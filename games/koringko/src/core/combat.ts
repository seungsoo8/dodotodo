/** 피해 주고받기 · 상태 이상 · 밀려남 */
import { onEnemyHit, onPlayerHurt } from './boons.ts';
import type { Run } from './game.ts';
import { normalize, type Vec } from './geom.ts';
import { findHero, ULT } from './heroes.ts';
import type { DamageSource, Enemy, Status } from './types.ts';

export interface HitOptions {
  /** 밀어내는 세기와 방향 (방향이 없으면 주인공에서 적 쪽) */
  knock?: number;
  dir?: Vec;
  /** 치명타가 날 수 있는가 (기본 true) */
  canCrit?: boolean;
  stun?: number;
  slow?: number;
  slowFor?: number;
  burn?: number;
}

/** 주인공 쪽 피해 배율 (영구 강화 · 축복 · 분노 · 위기) */
export function playerDamageMul(run: Run): number {
  const p = run.player;
  let mul = run.mods.damageMul;
  if (p.rageLeft > 0) mul *= ULT.rage.damageMul;
  if (run.mods.lowHpDamage > 0 && p.hp <= p.maxHp * 0.35) mul *= 1 + run.mods.lowHpDamage;
  return mul;
}

/** 적에게 피해. 실제로 준 피해를 돌려준다 (맞지 않는 상태면 0) */
export function damageEnemy(run: Run, e: Enemy, base: number, source: DamageSource, o: HitOptions = {}): number {
  if (e.hp <= 0 || e.hidden || e.spawnLeft > 0) return 0;
  let amount = base * playerDamageMul(run);
  const crit = o.canCrit !== false && run.rng.next() < run.config.crit.chance + run.mods.critChance;
  if (crit) amount *= run.config.crit.mul;
  if (e.boss) amount *= e.boss.phase >= 2 ? 1 : 1;
  e.hp -= amount;
  e.hitAt = run.time;
  run.stats.damageDealt += amount;
  run.events.push({ kind: 'hit', at: { x: e.x, y: e.y }, amount, crit, enemyId: e.id, source });
  if (source !== 'ult') gainUlt(run, amount * run.config.ult.perDamage);
  const weight = e.boss ? 0 : (e.def.weight ?? 1) * (e.elite ? 0.5 : 1);
  if (o.knock && weight > 0) {
    const d = o.dir ?? normalize({ x: e.x - run.player.x, y: e.y - run.player.y });
    e.kx += d.x * o.knock * weight;
    e.ky += d.y * o.knock * weight;
  }
  const bossStun = e.boss ? 0.25 : 1;
  if (o.stun) e.status.stun = Math.max(e.status.stun, o.stun * bossStun);
  if (o.slow !== undefined) applySlow(e.status, o.slow, o.slowFor ?? 1);
  if (o.burn) applyBurn(e.status, o.burn, 3);
  if (source !== 'boon') onEnemyHit(run, e, source);
  return amount;
}

export function applySlow(s: Status, factor: number, seconds: number): void {
  s.slow = Math.min(s.slow, factor);
  s.slowLeft = Math.max(s.slowLeft, seconds);
}

export function applyBurn(s: Status, dps: number, seconds: number): void {
  s.burnDps = Math.max(s.burnDps, dps);
  s.burnLeft = Math.max(s.burnLeft, seconds);
}

/** 상태 이상 시간 흐르기. 불타는 피해를 돌려준다 */
export function tickStatus(s: Status, dt: number): number {
  let burn = 0;
  if (s.burnLeft > 0) {
    const t = Math.min(dt, s.burnLeft);
    burn = s.burnDps * t;
    s.burnLeft -= dt;
    if (s.burnLeft <= 0) s.burnDps = 0;
  }
  if (s.slowLeft > 0) {
    s.slowLeft -= dt;
    if (s.slowLeft <= 0) s.slow = 1;
  }
  if (s.stun > 0) s.stun = Math.max(0, s.stun - dt);
  return burn;
}

export function gainUlt(run: Run, amount: number): void {
  const p = run.player;
  const max = run.config.ult.max;
  const before = p.ult;
  p.ult = Math.min(max, p.ult + amount * run.mods.ultGainMul);
  if (before < max && p.ult >= max) run.events.push({ kind: 'ultReady' });
}

/** 주인공이 맞는다. 맞았으면 true (무적·대시 중이면 false) */
export function hurtPlayer(run: Run, base: number, from: Vec): boolean {
  const p = run.player;
  if (run.status !== 'playing' || p.iframes > 0 || p.dashLeft > 0 || base <= 0) return false;
  const armor = findHero(p.hero).armor + run.mods.armor;
  let amount = base * (1 - Math.min(0.8, armor)) * run.config.playerDamageTakenMul;
  if (p.rageLeft > 0) amount *= ULT.rage.takenMul;
  p.hp -= amount;
  p.iframes = run.config.hurtIframes;
  const d = normalize({ x: p.x - from.x, y: p.y - from.y });
  p.kx += d.x * 160;
  p.ky += d.y * 160;
  run.stats.damageTaken += amount;
  run.events.push({ kind: 'hurt', amount, at: { x: p.x, y: p.y } });
  onPlayerHurt(run);
  if (p.hp <= 0) {
    if (run.revives > 0) {
      run.revives--;
      p.hp = p.maxHp * 0.5;
      p.iframes = 2;
      run.events.push({ kind: 'revive' });
    } else {
      p.hp = 0;
      run.status = 'lost';
    }
  }
  return true;
}

export function healPlayer(run: Run, amount: number): void {
  const p = run.player;
  const before = p.hp;
  p.hp = Math.min(p.maxHp, p.hp + amount);
  if (p.hp > before) run.events.push({ kind: 'heal', amount: p.hp - before });
}
