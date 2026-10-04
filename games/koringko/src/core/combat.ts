/** 피해 주고받기 · 상태 이상 · 버프가 들어간 능력 */
import { skillLv } from './character.ts';
import type { Game } from './game.ts';
import { normalize, type Vec } from './geom.ts';
import { computeStats, takenMul, type Stats } from './stats.ts';
import type { Monster, Status } from './world.ts';

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
  const aspd = (p.buffs.rage > 0 ? 0.3 : 0) + (p.buffs.swift > 0 ? 0.4 : 0);
  g.stats = computeStats(g.save, { atkPct: rage, aspd, defPct: roar });
  return g.stats;
}

export function hasPower(g: Game, power: string): boolean {
  return Object.values(g.save.gear).some((it) => it?.power === power);
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
  if (o.skill) amount *= 1 + s.skillPct / 100;
  const crit = o.canCrit !== false && rng.next() < s.crit;
  if (crit) amount *= s.critDmg;
  amount = Math.max(1, Math.round(amount));
  m.hp -= amount;
  m.hitAt = g.world.time;
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
export function hurtPlayer(g: Game, atk: number, from: Vec): boolean {
  const p = g.world.player;
  if (p.state === 'dead' || p.iframes > 0 || p.state === 'roll' || atk <= 0) return false;
  const amount = Math.max(1, Math.round(atk * (0.9 + g.rng.next() * 0.2) * takenMul(g.save.lv, g.stats.def)));
  g.save.hp -= amount;
  p.iframes = 0.5;
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
