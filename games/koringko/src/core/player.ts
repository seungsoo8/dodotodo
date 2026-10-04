/** 주인공: 걷기 · 구르기 · 기본 공격 · 스킬 · 포션 */
import { CLASSES, SKILLS, skillForKey, type BasicStep } from './classes.ts';
import { LINK, UNWOUND } from './link.ts';
import { skillLv } from './character.ts';
import { hasPower, healPlayer, hitMonster, refreshStats } from './combat.ts';
import type { Game } from './game.ts';
import { distPointSegment, fromAngle, inArc, normalize, type Vec } from './geom.ts';
import { faceOf, moveCircle, nearestMonster, type Input, type Monster, type World } from './world.ts';
import { variantOf } from './variants.ts';
import { swapTo, updateBench } from './tag.ts';
import { WIND } from './wind.ts';
import { partBonus } from './parts.ts';

export const ROLL = { dist: 66, time: 0.28, cd: 0.65, iframes: 0.08 };
export const POTION = { heal: 0.4, cd: 1 };
/** 별 위성: 반지름 · 치는 간격 */
export const ORBIT = { r: 30, every: 0.35 };
/** 기본 공격이 맞는 순간 (공격 시간의 몇 %) */
const HIT_AT = 0.3;
/** 자동 조준 거리 (근접은 닿는 거리 + 이만큼) */
const AUTO_AIM_MELEE = 50;

export function updatePlayer(g: Game, dt: number, input: Input): void {
  const w = g.world;
  const p = w.player;
  const save = g.save;

  // ── 시간
  p.iframes = Math.max(0, p.iframes - dt);
  p.rollCd = Math.max(0, p.rollCd - dt);
  p.potionCd = Math.max(0, p.potionCd - dt);
  p.phoenixCd = Math.max(0, p.phoenixCd - dt);
  p.tagCd = Math.max(0, p.tagCd - dt);
  updateBench(g, dt);
  for (const k of Object.keys(p.skillCd)) p.skillCd[k] = Math.max(0, p.skillCd[k] - dt);
  let buffChanged = false;
  p.linkLeft = Math.max(0, p.linkLeft - dt);
  p.windOut = Math.max(0, p.windOut - dt);
  for (const k of ['roar', 'rage', 'swift', 'frenzy', 'overwind', 'linked'] as const) {
    if (p.buffs[k] > 0) {
      p.buffs[k] = Math.max(0, p.buffs[k] - dt);
      if (p.buffs[k] === 0) buffChanged = true;
    }
  }
  if (buffChanged) refreshStats(g);
  if (p.comboLeft > 0) {
    p.comboLeft -= dt;
    if (p.comboLeft <= 0) p.combo = 0;
  }
  // 밀려남
  if (p.kx || p.ky) {
    moveCircle(w.map, p, p.kx * dt, p.ky * dt, p.r);
    const k = Math.exp(-8 * dt);
    p.kx *= k;
    p.ky *= k;
    if (Math.abs(p.kx) < 1 && Math.abs(p.ky) < 1) p.kx = p.ky = 0;
  }

  if (p.state === 'dead') {
    p.deadLeft = Math.max(0, p.deadLeft - dt);
    return;
  }

  // 재생
  const s = g.stats;
  save.hp = Math.min(s.maxHp, save.hp + s.regen * dt);
  save.sp = Math.min(s.maxSp, save.sp + s.spRegen * w.mods.windRegen * dt);
  // 태엽 풀림: 바닥나면 한 번, 다시 넉넉히 감으면 또
  if (save.sp >= UNWOUND.rearm) p.windArmed = true;
  else if (save.sp < 1 && p.windArmed) {
    p.windArmed = false;
    p.windOut = UNWOUND.time;
    w.events.push({ kind: 'windEmpty' });
  }

  // 이어지는 스킬
  runQueue(g, dt);
  // 전설: 별 위성
  if (hasPower(g, 'orbit')) {
    p.orbitT += dt;
    if (p.orbitT >= ORBIT.every) {
      p.orbitT -= ORBIT.every;
      for (const m of w.monsters) {
        const d = Math.hypot(m.x - p.x, m.y - p.y);
        if (m.hp > 0 && m.spawnLeft <= 0 && d <= ORBIT.r + m.r && d >= ORBIT.r - 14 - m.r) hitMonster(g, m, 0.6, { knock: 30, canCrit: false });
      }
    }
  }

  // ── 사탕 · 교대
  if (input.potion && p.potionCd <= 0) usePotion(g, input.potion);
  if (input.swap && swapTo(g, input.swap)) return;

  // ── 지금 하는 일 진행
  if (p.state === 'roll') {
    moveCircle(w.map, p, p.rollDir.x * (ROLL.dist / ROLL.time) * dt, p.rollDir.y * (ROLL.dist / ROLL.time) * dt, p.r);
    p.stateLeft -= dt;
    if (p.stateLeft <= 0) {
      p.state = 'idle';
      p.iframes = Math.max(p.iframes, ROLL.iframes);
      if (hasPower(g, 'swift')) {
        p.buffs.swift = 2;
        refreshStats(g);
      }
      if (hasPower(g, 'shockwave')) hazard(w, 'quake', p.x, p.y, 56, 1.5, { stun: 0.3 });
    }
    return;
  }
  if (p.state === 'attack' || p.state === 'cast') {
    if (p.state === 'attack' && p.hitIn >= 0) {
      p.hitIn -= dt;
      if (p.hitIn < 0) resolveBasic(g);
    }
    p.stateLeft -= dt;
    // 구르기로 끊을 수 있다
    if (input.roll && p.rollCd <= 0) {
      startRoll(g, input.move);
      return;
    }
    if (p.stateLeft > 0) return;
    p.state = 'idle';
  }

  // ── 새로 하는 일
  if (input.roll && p.rollCd <= 0) {
    startRoll(g, input.move);
    return;
  }
  if (input.skill) {
    const def = skillForKey(save.hero, input.skill);
    if (def && castSkill(g, def.id)) return;
  }
  if (input.attack) {
    startBasic(g);
    return;
  }

  // ── 걷기 · 태엽 감기
  const mv = input.move;
  const len = Math.hypot(mv.x, mv.y);
  p.winding = input.wind && len <= 0.05;
  if (p.winding) {
    const before = save.sp;
    save.sp = Math.min(s.maxSp, save.sp + WIND.rate * (1 + (partBonus(save).windPct ?? 0)) * dt);
    // 감아서 가득 채웠다
    if (before < s.maxSp && save.sp >= s.maxSp) {
      p.buffs.overwind = WIND.overTime;
      refreshStats(g);
      w.events.push({ kind: 'overwind' });
    }
    p.state = 'idle';
    return;
  }
  if (len > 0.05) {
    const d = len > 1 ? { x: mv.x / len, y: mv.y / len } : mv;
    const sp = s.ms * (p.windOut > 0 ? UNWOUND.slow : 1);
    moveCircle(w.map, p, d.x * sp * dt, d.y * sp * dt, p.r);
    p.dir = normalize(d);
    p.face = faceOf(p.dir);
    p.state = 'move';
    p.walkT += dt * Math.min(1, len);
  } else {
    p.state = 'idle';
  }
}

function startRoll(g: Game, move: Vec): void {
  const p = g.world.player;
  const len = Math.hypot(move.x, move.y);
  p.rollDir = len > 0.05 ? normalize(move) : { ...p.dir };
  p.dir = { ...p.rollDir };
  p.face = faceOf(p.dir);
  p.state = 'roll';
  p.stateLeft = ROLL.time;
  p.rollCd = ROLL.cd;
  p.hitIn = -1;
  g.world.events.push({ kind: 'roll', at: { x: p.x, y: p.y }, dir: { ...p.rollDir } });
}

/** 사탕 먹기 */
export function usePotion(g: Game, _kind: 'hp' = 'hp'): boolean {
  const p = g.world.player;
  if (p.potionCd > 0 || g.save.potions.hp <= 0 || p.state === 'dead' || g.save.hp >= g.stats.maxHp) return false;
  g.save.potions.hp--;
  p.potionCd = POTION.cd;
  healPlayer(g, g.stats.maxHp * POTION.heal);
  g.world.events.push({ kind: 'potion', potion: 'hp' });
  return true;
}

/** 공격 방향: 가까운 적이 있으면 그쪽 (자동 조준) */
function aim(g: Game, range: number): void {
  const p = g.world.player;
  const m = nearestMonster(g.world, p.x, p.y, range);
  if (!m) return;
  p.dir = normalize({ x: m.x - p.x, y: m.y - p.y });
  p.face = faceOf(p.dir);
}

function basicStep(g: Game): BasicStep {
  const combo = CLASSES[g.save.hero].combo;
  return combo[g.world.player.combo % combo.length];
}

function arrowRange(g: Game, base: number): number {
  return base * (1 + skillLv(g.save, 'r_pass') * 0.03);
}

function startBasic(g: Game): void {
  const p = g.world.player;
  const step = basicStep(g);
  aim(g, step.kind === 'melee' ? step.reach + AUTO_AIM_MELEE : arrowRange(g, step.range));
  const dur = step.time / g.stats.aspd;
  p.state = 'attack';
  p.stateLeft = dur;
  p.hitIn = dur * HIT_AT;
}

function resolveBasic(g: Game): void {
  const w = g.world;
  const p = w.player;
  const step = basicStep(g);
  const combo = CLASSES[g.save.hero].combo;
  const n = p.combo % combo.length;
  if (step.kind === 'melee') {
    const reach = step.reach * (hasPower(g, 'giant') ? 1.3 : 1);
    const ang = Math.atan2(p.dir.y, p.dir.x);
    w.events.push({ kind: 'swing', at: { x: p.x, y: p.y }, dir: { ...p.dir }, reach, arc: step.arc, step: n });
    for (const m of w.monsters) {
      if (m.hp > 0 && inArc(p, ang, reach, step.arc, m, m.r)) hitMonster(g, m, step.mult, { basic: true, knock: step.knock });
    }
  } else {
    const range = arrowRange(g, step.range);
    shoot(g, step.projectile, p.dir, { speed: step.speed, range, mult: step.mult, explode: step.explode, knock: step.knock, basic: true });
  }
  p.combo = (n + 1) % combo.length;
  p.comboLeft = p.stateLeft + 0.5;
}

interface ShotOptions {
  speed: number;
  range: number;
  mult: number;
  explode?: number;
  knock?: number;
  pierce?: number;
  skill?: boolean;
  basic?: boolean;
  burn?: number;
  r?: number;
  pool?: number;
}

export function shoot(g: Game, kind: string, dir: Vec, o: ShotOptions): void {
  const w = g.world;
  const p = w.player;
  const d = normalize(dir);
  w.projectiles.push({
    id: w.nextId++,
    kind,
    x: p.x + d.x * (p.r + 2),
    y: p.y + d.y * (p.r + 2) - 2,
    vx: d.x * o.speed,
    vy: d.y * o.speed,
    r: o.r ?? (kind === 'orb' || kind === 'fireball' ? 5 : 3),
    damage: o.mult,
    from: 'player',
    pierce: o.pierce ?? 0,
    life: o.range / o.speed,
    hit: [],
    explode: o.explode,
    burn: o.burn,
    skill: !!o.skill,
    basic: !!o.basic,
    pool: o.pool,
  });
  w.events.push({ kind: 'shot', at: { x: p.x, y: p.y }, dir: d, projectile: kind });
}

function hazard(w: World, kind: string, x: number, y: number, r: number, mult: number, o: { delay?: number; life?: number; tick?: number; stun?: number; slow?: number; burn?: number } = {}): void {
  w.hazards.push({
    id: w.nextId++,
    kind,
    shape: { type: 'circle', x, y, r },
    delay: o.delay ?? 0,
    telegraph: o.delay ?? 0,
    life: o.life ?? 0,
    from: 'player',
    damage: mult,
    tick: o.tick ?? 0,
    tickLeft: 0,
    stun: o.stun,
    slow: o.slow,
    burn: o.burn,
    skill: true,
    hit: [],
  });
}

export type CastCheck = { ok: true } | { ok: false; reason: 'unlearned' | 'cooldown' | 'sp' | 'busy' };

export function castCheck(g: Game, id: string): CastCheck {
  const def = SKILLS[id];
  const p = g.world.player;
  if (!def || def.key === 'P' || skillLv(g.save, id) <= 0) return { ok: false, reason: 'unlearned' };
  if ((p.skillCd[id] ?? 0) > 0) return { ok: false, reason: 'cooldown' };
  if (g.save.sp < def.sp && p.linkLeft <= 0) return { ok: false, reason: 'sp' };
  if (p.state === 'dead' || p.state === 'roll') return { ok: false, reason: 'busy' };
  return { ok: true };
}

export function castSkill(g: Game, id: string): boolean {
  const c = castCheck(g, id);
  const w = g.world;
  if (!c.ok) {
    if (c.reason === 'sp') w.events.push({ kind: 'noSp' });
    return false;
  }
  const def = SKILLS[id];
  const lv = skillLv(g.save, id);
  const mult = def.mult(lv);
  const p = w.player;
  p.lastSkillAt = w.time;
  if (p.linkLeft > 0) {
    // 교대 연계: 태엽 없이, 더 세게
    p.linkLeft = 0;
    p.buffs.linked = LINK.buff;
    refreshStats(g);
    w.events.push({ kind: 'link', at: { x: p.x, y: p.y } });
  } else g.save.sp -= def.sp;
  p.skillCd[id] = def.cd * (1 - g.stats.cdr);
  if (hasPower(g, 'star') && g.rng.next() < 0.25) g.save.sp = Math.min(g.stats.maxSp, g.save.sp + def.sp);
  p.state = 'cast';
  p.stateLeft = 0.3;
  p.hitIn = -1;
  p.combo = 0;
  aim(g, 160);
  const { x, y } = p;
  const ang = Math.atan2(p.dir.y, p.dir.x);
  w.events.push({ kind: 'skill', id, at: { x, y }, dir: { ...p.dir } });
  const v = variantOf(g.save, id);
  const fwd = (d: number) => ({ x: x + p.dir.x * d, y: y + p.dir.y * d });
  switch (id) {
    // ───── 토비
    case 't_rush': {
      const from = { x, y };
      moveCircle(w.map, p, p.dir.x * 86, p.dir.y * 86, p.r);
      for (const m of w.monsters) if (m.hp > 0 && distPointSegment(m, from, p) <= m.r + 16) hitMonster(g, m, mult * (v === 1 ? 1.1 : 1), { skill: true, knock: v === 2 ? 30 : 120, dir: p.dir, stun: v === 1 ? 1 : undefined });
      p.iframes = Math.max(p.iframes, 0.3);
      if (v === 2) p.queue.push({ at: w.time + 0.35, kind: 'rushBack', n: 0, x: from.x, y: from.y, mult: mult * 0.8 });
      break;
    }
    case 't_spin':
      if (v === 1) {
        for (let i = 0; i < 6; i++) p.queue.push({ at: w.time + 0.25 * i, kind: 'spin', n: i, mult: mult * 0.4 });
        p.stateLeft = 0.2;
      } else {
        const reach = v === 2 ? 84 : 52;
        for (const m of w.monsters) {
          if (m.hp <= 0 || !inArc(p, ang, reach, 360, m, m.r)) continue;
          hitMonster(g, m, mult * (v === 2 ? 0.8 : 1), { skill: true, knock: v === 2 ? 0 : 160 });
          if (v === 2 && !m.boss) {
            // 가운데로 끌어당기기
            const d = Math.hypot(m.x - x, m.y - y) || 1;
            const to = Math.max(p.r + m.r + 2, d * 0.4);
            moveCircle(w.map, m, ((x - m.x) / d) * (d - to), ((y - m.y) / d) * (d - to), m.r, !!m.def.fly);
          }
        }
      }
      break;
    case 't_leap': {
      leapTo(g, 130, mult * (v === 1 ? 0.9 : v === 2 ? 0.75 : 1), v === 1 ? 84 : 58, v === 1 ? 1.8 : 1);
      if (v === 2) p.queue.push({ at: w.time + 0.55, kind: 'leap', n: 0, mult: mult * 0.75 });
      break;
    }
    case 't_dance': {
      const n = v === 1 ? 12 : v === 2 ? 6 : 8;
      const k = v === 1 ? 0.7 : 1;
      p.iframes = Math.max(p.iframes, 0.1 * n + 0.3);
      p.stateLeft = 0.1 * n + 0.1;
      for (let i = 0; i < n; i++) p.queue.push({ at: w.time + 0.1 * (i + 1), kind: 'dance', n: i, mult: mult * k });
      if (v === 2) p.queue.push({ at: w.time + 0.1 * (n + 1) + 0.1, kind: 'finale', n: 0, mult: mult * 3 });
      break;
    }
    // ───── 보리
    case 'b_slam':
      if (v === 1) {
        for (let i = 0; i < 3; i++) hazard(w, 'slam', x + p.dir.x * (34 + i * 30), y + p.dir.y * (34 + i * 30), 46, mult * 0.55, { delay: 0.18 + i * 0.3, stun: 0.5 });
        p.stateLeft = 0.9;
      } else if (v === 2) {
        hazard(w, 'slam', x + p.dir.x * 34, y + p.dir.y * 34, 66, mult * 0.9, { delay: 0.18, slow: 0.4 });
        p.stateLeft = 0.45;
      } else {
        hazard(w, 'slam', x + p.dir.x * 34, y + p.dir.y * 34, 54, mult, { delay: 0.18, stun: 1.2 });
        p.stateLeft = 0.45;
      }
      break;
    case 'b_roar':
      if (v !== 1) for (const m of w.monsters) if (m.hp > 0 && inArc(p, ang, 74, 360, m, m.r)) hitMonster(g, m, mult * (v === 2 ? 0.6 : 1), { skill: true, knock: v === 2 ? 40 : 220, stun: v === 2 ? 1.6 : undefined });
      p.buffs.roar = v === 1 ? 14 : v === 2 ? 4 : 8;
      if (v === 1) healPlayer(g, g.stats.maxHp * 0.12);
      refreshStats(g);
      break;
    case 'b_axe':
      if (v === 2) {
        const at = fwd(60);
        w.hazards.push({ id: w.nextId++, kind: 'axeSpin', shape: { type: 'circle', x: at.x, y: at.y, r: 40 }, delay: 0, telegraph: 0, life: 2.5, from: 'player', damage: mult * 0.4, tick: 0.25, tickLeft: 0, skill: true, hit: [] });
      } else {
        const n = v === 1 ? 3 : 1;
        for (let i = 0; i < n; i++) {
          const d = fromAngle(ang + (n > 1 ? (i - 1) * 0.45 : 0));
          w.projectiles.push({ id: w.nextId++, kind: 'axe', x, y, vx: d.x * 230, vy: d.y * 230, r: 9, damage: mult * (n > 1 ? 0.6 : 1), from: 'player', pierce: 999, life: 1.5, hit: [], skill: true, basic: false, returnAt: w.time + 0.55 });
        }
      }
      break;
    case 'b_rage':
      hazard(w, 'quake', x, y, v === 2 ? 130 : 84, mult * (v === 2 ? 1.5 : 1), { stun: 0.6, burn: v === 1 ? 0.6 : undefined });
      p.buffs.rage = v === 2 ? 5 : 10;
      refreshStats(g);
      break;
    // ───── 루루
    case 'r_fan': {
      const n = v === 1 ? 3 : 5;
      for (let i = 0; i < n; i++) shoot(g, 'arrow', fromAngle(ang + ((i - (n - 1) / 2) * 12 * Math.PI) / 180), { speed: 340, range: arrowRange(g, 220), mult: mult * (v === 1 ? 1.3 : 1), skill: true, pierce: v === 1 ? 4 : 1, knock: 50, burn: v === 2 ? 0.3 : undefined });
      break;
    }
    case 'r_rain': {
      const at = fwd(92);
      hazard(w, 'rain', at.x, at.y, v === 2 ? 38 : 62, mult * (v === 2 ? 1.8 : 1), { life: 2, tick: 0.2, slow: v === 1 ? 0.5 : undefined });
      break;
    }
    case 'r_bomb':
      if (v === 1) for (let i = -1; i <= 1; i++) shoot(g, 'bomb', fromAngle(ang + i * 0.3), { speed: 280, range: arrowRange(g, 200), mult: mult * 0.55, explode: 34, skill: true, knock: 100, r: 4 });
      else if (v === 2) hazard(w, 'trap', x, y, 70, mult * 1.6, { delay: 1.2, stun: 1 });
      else shoot(g, 'bomb', p.dir, { speed: 300, range: arrowRange(g, 240), mult, explode: 50, skill: true, knock: 160, r: 4 });
      break;
    case 'r_hunt': {
      const n = v === 1 ? 6 : v === 2 ? 36 : 24;
      const gap = v === 1 ? 0.4 : v === 2 ? 0.08 : 0.125;
      const k = v === 1 ? 3.5 : v === 2 ? 0.55 : 1;
      p.stateLeft = 0.2;
      for (let i = 0; i < n; i++) p.queue.push({ at: w.time + gap * (i + 1), kind: v === 2 ? 'spray' : v === 1 ? 'snipe' : 'hunt', n: i, mult: mult * k });
      break;
    }
    // ───── 나비
    case 'n_fire':
      if (v === 2) for (let i = -1; i <= 1; i++) shoot(g, 'fireball', fromAngle(ang + i * 0.35), { speed: 240, range: 220, mult: mult * 0.55, explode: 30, burn: 0.2, skill: true, knock: 80, r: 4 });
      else shoot(g, 'fireball', p.dir, { speed: 240, range: 240, mult, explode: 46, burn: 0.25, skill: true, knock: 120, r: 6, pool: v === 1 ? mult * 0.25 : undefined });
      break;
    case 'n_frost': {
      const t = nearestMonster(w, x, y, 170);
      const at = t ? { x: t.x, y: t.y } : fwd(80);
      if (v === 1) hazard(w, 'frost', at.x, at.y, 54, mult * 3, { delay: 0.3, stun: 2 });
      else hazard(w, 'frost', at.x, at.y, v === 2 ? 100 : 64, mult * (v === 2 ? 0.8 : 1), { life: v === 2 ? 5 : 4, tick: 0.5, slow: 0.5 });
      break;
    }
    case 'n_chain':
      if (v === 1) chain(g, mult * 0.7, 8, 220, 120, false);
      else if (v === 2) chain(g, mult * 0.8, 5, 180, 95, true);
      else chain(g, mult, 5, 180, 95, false);
      break;
    case 'n_meteor': {
      const targets = w.monsters.filter((m) => m.hp > 0 && m.spawnLeft <= 0 && Math.hypot(m.x - x, m.y - y) < 240);
      if (v === 1) {
        const t = nearestMonster(w, x, y, 240);
        const at = t ? { x: t.x, y: t.y } : fwd(80);
        hazard(w, 'meteor', at.x, at.y, 100, mult * 6, { delay: 1 });
        break;
      }
      const n = v === 2 ? 20 : 10;
      for (let i = 0; i < n; i++) {
        const t = targets.length ? targets[i % targets.length] : null;
        const a = g.rng.next() * Math.PI * 2;
        const spread = v === 2 ? 30 : 0;
        const at = t ? { x: t.x + Math.cos(a) * spread, y: t.y + Math.sin(a) * spread } : { x: x + Math.cos(a) * 80, y: y + Math.sin(a) * 80 };
        hazard(w, 'meteor', at.x, at.y, v === 2 ? 30 : 42, mult * (v === 2 ? 0.45 : 1), { delay: 0.4 + i * (v === 2 ? 0.06 : 0.1) });
      }
      break;
    }
  }
  return true;
}

/** 번개 사슬: 가까운 적부터 n 번 튄다. boom: 튈 때마다 작게 터진다 */
function chain(g: Game, mult: number, n: number, first: number, hop: number, boom: boolean): void {
  const w = g.world;
  const p = w.player;
  let from = { x: p.x, y: p.y };
  const hit: Monster[] = [];
  let range = first;
  for (let i = 0; i < n; i++) {
    let best: Monster | null = null;
    let bd = range;
    for (const m of w.monsters) {
      if (m.hp <= 0 || m.spawnLeft > 0 || hit.includes(m)) continue;
      const d = Math.hypot(m.x - from.x, m.y - from.y);
      if (d < bd) {
        bd = d;
        best = m;
      }
    }
    if (!best) break;
    hit.push(best);
    w.events.push({ kind: 'chain', from, to: { x: best.x, y: best.y } });
    hitMonster(g, best, mult, { skill: true, stun: 0.3 });
    if (boom) hazard(w, 'thunder', best.x, best.y, 30, mult * 0.5, { delay: 0.05 });
    from = { x: best.x, y: best.y };
    range = hop;
  }
}

/** 토끼 도약: 가까운 적에게 뛰어 내려찍는다 */
function leapTo(g: Game, range: number, mult: number, r: number, stun: number): void {
  const w = g.world;
  const p = w.player;
  const target = nearestMonster(w, p.x, p.y, range);
  const to = target ? { x: target.x, y: target.y } : { x: p.x + p.dir.x * 70, y: p.y + p.dir.y * 70 };
  moveCircle(w.map, p, to.x - p.x, to.y - p.y, p.r);
  p.iframes = Math.max(p.iframes, 0.45);
  p.stateLeft = 0.4;
  hazard(w, 'leap', p.x, p.y, r, mult, { delay: 0.25, stun });
}

function runQueue(g: Game, _dt: number): void {
  const w = g.world;
  const p = w.player;
  while (p.queue.length && p.queue[0].at <= w.time) {
    const q = p.queue.shift()!;
    const mult = q.mult ?? 1;
    switch (q.kind) {
      case 'dance': {
        const m = nearestMonster(w, p.x, p.y, 170);
        if (!m) break;
        // 적 옆으로 순간이동해서 벤다
        const a = (q.n * Math.PI * 2) / 3;
        p.x = m.x + Math.cos(a) * (m.r + 10);
        p.y = m.y + Math.sin(a) * (m.r + 10);
        moveCircle(w.map, p, 0, 0, p.r);
        p.dir = normalize({ x: m.x - p.x, y: m.y - p.y });
        p.face = faceOf(p.dir);
        w.events.push({ kind: 'swing', at: { x: p.x, y: p.y }, dir: { ...p.dir }, reach: 40, arc: 160, step: 2 });
        hitMonster(g, m, mult, { skill: true, knock: 60 });
        break;
      }
      case 'finale':
        hazard(w, 'quake', p.x, p.y, 70, mult, { delay: 0.05, stun: 0.6 });
        break;
      case 'rushBack': {
        const from = { x: p.x, y: p.y };
        const to = { x: q.x!, y: q.y! };
        moveCircle(w.map, p, to.x - p.x, to.y - p.y, p.r);
        p.dir = normalize({ x: to.x - from.x, y: to.y - from.y });
        p.face = faceOf(p.dir);
        p.iframes = Math.max(p.iframes, 0.2);
        for (const m of w.monsters) if (m.hp > 0 && distPointSegment(m, from, p) <= m.r + 16) hitMonster(g, m, mult, { skill: true, knock: 100, dir: p.dir });
        break;
      }
      case 'spin':
        w.events.push({ kind: 'swing', at: { x: p.x, y: p.y }, dir: fromAngle(q.n * 2), reach: 52, arc: 360, step: q.n });
        for (const m of w.monsters) if (m.hp > 0 && Math.hypot(m.x - p.x, m.y - p.y) <= 52 + m.r) hitMonster(g, m, mult, { skill: true, knock: 40 });
        break;
      case 'leap':
        leapTo(g, 130, mult, 58, 1);
        break;
      case 'hunt':
      case 'snipe': {
        const m = nearestMonster(w, p.x, p.y, arrowRange(g, 260));
        const dir = m ? { x: m.x - p.x, y: m.y - p.y } : p.dir;
        shoot(g, 'arrow', dir, { speed: q.kind === 'snipe' ? 520 : 380, range: arrowRange(g, q.kind === 'snipe' ? 320 : 250), mult, skill: true, knock: q.kind === 'snipe' ? 90 : 30, pierce: q.kind === 'snipe' ? 5 : 0 });
        break;
      }
      case 'spray': {
        const m = nearestMonster(w, p.x, p.y, arrowRange(g, 240));
        const base = m ? Math.atan2(m.y - p.y, m.x - p.x) : Math.atan2(p.dir.y, p.dir.x);
        shoot(g, 'arrow', fromAngle(base + (g.rng.next() - 0.5) * 1.6), { speed: 360, range: arrowRange(g, 200), mult, skill: true, knock: 20 });
        break;
      }
    }
  }
}
