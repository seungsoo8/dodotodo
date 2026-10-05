/** 피해 주고받기 · 상태 이상 · 버프가 들어간 능력 */
import { skillLv } from './character.ts';
import { bossTakenMul } from './bossrules.ts';
import { WIND } from './wind.ts';
import type { Game } from './game.ts';
import { normalize, type Vec } from './geom.ts';
import { computeStats, takenMul, type Bonus, type Stats } from './stats.ts';
import { fallBack } from './tag.ts';
import type { Monster, Status } from './world.ts';
import { AFFIX } from './elite.ts';
import { runBonus, runHasPower } from './riftrun.ts';
import { hasPartPower, partBonus } from './parts.ts';
import { friendBonus } from './friends.ts';

export interface HitOptions {
  skill?: boolean;
  /** 기본 공격 (전설 '번개 단추') */
  basic?: boolean;
  knock?: number;
  dir?: Vec;
  stun?: number;
  slow?: number;
  slowFor?: number;
  burn?: number;
  canCrit?: boolean;
}

/** 버프를 넣어 능력을 다시 계산한다 */
export function refreshStats(g: Game): Stats {
  const p = g.world.player;
  const rage = p.buffs.rage > 0 ? 0.3 + skillLv(g.save, 'b_rage') * 0.06 : 0;
  const roar = p.buffs.roar > 0 ? 0.2 + skillLv(g.save, 'b_roar') * 0.04 : 0;
  const aspd = (p.buffs.rage > 0 ? 0.3 : 0) + (p.buffs.swift > 0 ? 0.4 : 0) + (p.buffs.frenzy > 0 ? 0.25 : 0);
  const total = sumBonus(runBonus(g.run), partBonus(g.save), friendBonus(g.save));
  g.stats = computeStats(g.save, { ...total, atkPct: rage + (total.atkPct ?? 0), aspd: aspd + (total.aspd ?? 0), defPct: roar + (total.defPct ?? 0) });
  return g.stats;
}

export function hasPower(g: Game, power: string): boolean {
  return hasPartPower(g.save, power) || runHasPower(g.run, power);
}

/** 몬스터 방어력에 따른 배율 */
export function armorMul(def: number): number {
  return 60 / (60 + Math.max(0, def) * 2);
}

/** 몬스터를 때린다. 실제로 준 피해 (맞지 않는 상태면 0) */
export function hitMonster(g: Game, m: Monster, mult: number, o: HitOptions = {}): number {
  if (m.hp <= 0 || m.spawnLeft > 0) return 0;
  const s = g.stats;
  const rng = g.rng;
  let amount = s.atk * mult * (0.9 + rng.next() * 0.2) * armorMul(m.def_);
  if (m.affixes.includes('armored')) amount *= AFFIX.armoredTaken;
  amount *= bossTakenMul(m);
  if (o.skill) amount *= 1 + s.skillPct / 100;
  const crit = o.canCrit !== false && rng.next() < s.crit;
  if (crit) amount *= s.critDmg;
  amount = Math.max(1, Math.round(amount));
  m.hp -= amount;
  m.hitAt = g.world.time;
  g.save.sp = Math.min(s.maxSp, g.save.sp + WIND.perHit);
  const w = g.world;
  w.events.push({ kind: 'hit', at: { x: m.x, y: m.y }, amount, crit, targetId: m.id, skill: !!o.skill });
  // 생명 흡수
  if (s.leech > 0) healPlayer(g, amount * s.leech, false);
  // 밀려남 (보스는 안 밀리고, 정예는 덜)
  const weight = m.boss ? 0 : m.rank === 'elite' || m.guardian ? 0.4 : 1;
  if (o.knock && weight > 0) {
    const d = o.dir ?? normalize({ x: m.x - w.player.x, y: m.y - w.player.y });
    m.kx += d.x * o.knock * weight;
    m.ky += d.y * o.knock * weight;
  }
  const bossK = m.boss ? 0.3 : 1;
  if (o.stun) m.status.stun = Math.max(m.status.stun, o.stun * bossK);
  if (o.slow !== undefined) {
    m.status.slow = Math.min(m.status.slow, o.slow);
    m.status.slowLeft = Math.max(m.status.slowLeft, o.slowFor ?? 1);
  }
  if (o.burn) {
    m.status.burnDps = Math.max(m.status.burnDps, s.atk * o.burn);
    m.status.burnLeft = 3;
  }
  // 전설: 서리 발톱
  if (o.basic && hasPower(g, 'chill')) {
    m.status.slow = Math.min(m.status.slow, 0.7);
    m.status.slowLeft = Math.max(m.status.slowLeft, 1.5);
  }
  // 전설: 번개 단추
  if (o.basic && hasPower(g, 'thunder') && rng.next() < 0.2) {
    w.hazards.push({ id: w.nextId++, kind: 'thunder', shape: { type: 'circle', x: m.x, y: m.y, r: 26 }, delay: 0.15, telegraph: 0.15, life: 0, from: 'player', damage: 1.2, tick: 0, tickLeft: 0, skill: false, hit: [] });
  }
  return amount;
}

/** 상태 이상 시간 흐르기. 불타는 피해를 돌려준다 */
export function tickStatus(s: Status, dt: number): number {
  let burn = 0;
  if (s.burnLeft > 0) {
    burn = s.burnDps * Math.min(dt, s.burnLeft);
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

/** 주인공이 맞는다. 맞았으면 true (무적 · 구르는 중이면 false) */
/** 주인공이 맞는다. attacker: 때린 몬스터 (없으면 from 이 몬스터인지 본다) */
export function hurtPlayer(g: Game, atk: number, from: Vec, attacker?: Monster): boolean {
  const p = g.world.player;
  if (p.state === 'dead' || p.iframes > 0 || p.state === 'roll' || atk <= 0) return false;
  const amount = Math.max(1, Math.round(atk * (0.9 + g.rng.next() * 0.2) * takenMul(g.save.lv, g.stats.def) * g.world.mods.taken));
  g.save.hp -= amount;
  p.iframes = 0.5;
  // 흡혈 정예
  const att = attacker ?? ('affixes' in from ? (from as Monster) : undefined);
  if (att?.affixes.includes('vampire') && att.hp > 0) att.hp = Math.min(att.maxHp, att.hp + amount * AFFIX.vampireHeal);
  // 전설: 가시 솜
  if (att && att.hp > 0 && hasPower(g, 'thorns')) hitMonster(g, att, 2, { canCrit: false });
  const d = normalize({ x: p.x - from.x, y: p.y - from.y });
  p.kx += d.x * 120;
  p.ky += d.y * 120;
  g.world.events.push({ kind: 'hurt', amount, at: { x: p.x, y: p.y } });
  if (g.save.hp <= 0) {
    if (hasPower(g, 'phoenix') && p.phoenixCd <= 0) {
      g.save.hp = Math.round(g.stats.maxHp * 0.5);
      p.phoenixCd = 120;
      p.iframes = 2;
      g.world.events.push({ kind: 'phoenix' });
    } else if (fallBack(g)) {
      // 다른 동료가 나섰다
    } else {
      g.save.hp = 0;
      p.state = 'dead';
      p.deadLeft = 2.5;
      p.queue = [];
      g.world.events.push({ kind: 'died' });
    }
  }
  return true;
}

export function healPlayer(g: Game, amount: number, show = true): void {
  const before = g.save.hp;
  g.save.hp = Math.min(g.stats.maxHp, g.save.hp + amount);
  if (show && g.save.hp > before) g.world.events.push({ kind: 'heal', amount: Math.round(g.save.hp - before) });
}

/** 여러 보너스를 더한다 */
export function sumBonus(...bs: Bonus[]): Bonus {
  const out: Record<string, number> = {};
  for (const b of bs) for (const [k, v] of Object.entries(b)) out[k] = (out[k] ?? 0) + (v as number);
  return out as Bonus;
}
