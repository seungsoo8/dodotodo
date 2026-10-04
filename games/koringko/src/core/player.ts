/** 주인공: 걷기 · 구르기 · 기본 공격 · 스킬 · 포션 */
import { CLASSES, SKILLS, skillForKey, type BasicStep } from './classes.ts';
import { skillLv } from './character.ts';
import { hasPower, healPlayer, hitMonster, refreshStats } from './combat.ts';
import type { Game } from './game.ts';
import { distPointSegment, fromAngle, inArc, normalize, type Vec } from './geom.ts';
import { faceOf, moveCircle, nearestMonster, type Input, type Monster, type World } from './world.ts';

export const ROLL = { dist: 66, time: 0.28, cd: 0.65, iframes: 0.08 };
export const POTION = { heal: 0.4, cd: 1 };
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
  for (const k of Object.keys(p.skillCd)) p.skillCd[k] = Math.max(0, p.skillCd[k] - dt);
  let buffChanged = false;
  for (const k of ['roar', 'rage', 'swift'] as const) {
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
  save.sp = Math.min(s.maxSp, save.sp + s.spRegen * dt);

  // 이어지는 스킬
  runQueue(g, dt);

  // ── 포션
  if (input.potion && p.potionCd <= 0) usePotion(g, input.potion);

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

  // ── 걷기
  const mv = input.move;
  const len = Math.hypot(mv.x, mv.y);
  if (len > 0.05) {
    const d = len > 1 ? { x: mv.x / len, y: mv.y / len } : mv;
    const sp = s.ms;
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

export function usePotion(g: Game, kind: 'hp' | 'sp'): boolean {
  const p = g.world.player;
  if (p.potionCd > 0 || g.save.potions[kind] <= 0 || p.state === 'dead') return false;
  if (kind === 'hp' && g.save.hp >= g.stats.maxHp) return false;
  if (kind === 'sp' && g.save.sp >= g.stats.maxSp) return false;
  g.save.potions[kind]--;
  p.potionCd = POTION.cd;
  if (kind === 'hp') healPlayer(g, g.stats.maxHp * POTION.heal);
  else g.save.sp = Math.min(g.stats.maxSp, g.save.sp + g.stats.maxSp * POTION.heal);
  g.world.events.push({ kind: 'potion', potion: kind });
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
  if (g.save.sp < def.sp) return { ok: false, reason: 'sp' };
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
  g.save.sp -= def.sp;
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
  switch (id) {
    // ───── 토비
    case 't_rush': {
      const from = { x, y };
      moveCircle(w.map, p, p.dir.x * 86, p.dir.y * 86, p.r);
      for (const m of w.monsters) if (m.hp > 0 && distPointSegment(m, from, p) <= m.r + 16) hitMonster(g, m, mult, { skill: true, knock: 120, dir: p.dir });
      p.iframes = Math.max(p.iframes, 0.3);
      break;
    }
    case 't_spin':
      for (const m of w.monsters) if (m.hp > 0 && inArc(p, ang, 52, 360, m, m.r)) hitMonster(g, m, mult, { skill: true, knock: 160 });
      break;
    case 't_leap': {
      const target = nearestMonster(w, x, y, 130);
      const to = target ? { x: target.x, y: target.y } : { x: x + p.dir.x * 70, y: y + p.dir.y * 70 };
      moveCircle(w.map, p, to.x - x, to.y - y, p.r);
      p.iframes = Math.max(p.iframes, 0.45);
      p.stateLeft = 0.4;
      hazard(w, 'leap', p.x, p.y, 58, mult, { delay: 0.25, stun: 1 });
      break;
    }
    case 't_dance':
      p.iframes = Math.max(p.iframes, 1.1);
      p.stateLeft = 0.9;
      for (let i = 0; i < 8; i++) p.queue.push({ at: w.time + 0.1 * (i + 1), kind: 'dance', n: i });
      break;
    // ───── 보리
    case 'b_slam':
      hazard(w, 'slam', x + p.dir.x * 34, y + p.dir.y * 34, 54, mult, { delay: 0.18, stun: 1.2 });
      p.stateLeft = 0.45;
      break;
    case 'b_roar':
      for (const m of w.monsters) if (m.hp > 0 && inArc(p, ang, 74, 360, m, m.r)) hitMonster(g, m, mult, { skill: true, knock: 220 });
      p.buffs.roar = 8;
      refreshStats(g);
      break;
    case 'b_axe':
      w.projectiles.push({ id: w.nextId++, kind: 'axe', x, y, vx: p.dir.x * 230, vy: p.dir.y * 230, r: 9, damage: mult, from: 'player', pierce: 999, life: 1.5, hit: [], skill: true, basic: false, returnAt: w.time + 0.55 });
      break;
    case 'b_rage':
      hazard(w, 'quake', x, y, 84, mult, { stun: 0.6 });
      p.buffs.rage = 10;
      refreshStats(g);
      break;
    // ───── 루루
    case 'r_fan':
      for (let i = 0; i < 5; i++) shoot(g, 'arrow', fromAngle(ang + ((i - 2) * 12 * Math.PI) / 180), { speed: 340, range: arrowRange(g, 220), mult, skill: true, pierce: 1, knock: 50 });
      break;
    case 'r_rain':
      hazard(w, 'rain', x + p.dir.x * 92, y + p.dir.y * 92, 62, mult, { life: 2, tick: 0.2 });
      break;
    case 'r_bomb':
      shoot(g, 'bomb', p.dir, { speed: 300, range: arrowRange(g, 240), mult, explode: 50, skill: true, knock: 160, r: 4 });
      break;
    case 'r_hunt':
      p.stateLeft = 0.2;
      for (let i = 0; i < 24; i++) p.queue.push({ at: w.time + 0.125 * (i + 1), kind: 'hunt', n: i });
      break;
    // ───── 나비
    case 'n_fire':
      shoot(g, 'fireball', p.dir, { speed: 240, range: 240, mult, explode: 46, burn: 0.25, skill: true, knock: 120, r: 6 });
      break;
    case 'n_frost': {
      const t = nearestMonster(w, x, y, 170);
      const at = t ? { x: t.x, y: t.y } : { x: x + p.dir.x * 80, y: y + p.dir.y * 80 };
      hazard(w, 'frost', at.x, at.y, 64, mult, { life: 4, tick: 0.5, slow: 0.5 });
      break;
    }
    case 'n_chain':
      chain(g, mult);
      break;
    case 'n_meteor': {
      const targets = w.monsters.filter((m) => m.hp > 0 && m.spawnLeft <= 0 && Math.hypot(m.x - x, m.y - y) < 240);
      for (let i = 0; i < 10; i++) {
        const t = targets.length ? targets[i % targets.length] : null;
        const a = g.rng.next() * Math.PI * 2;
        const at = t ? { x: t.x, y: t.y } : { x: x + Math.cos(a) * 80, y: y + Math.sin(a) * 80 };
        hazard(w, 'meteor', at.x, at.y, 42, mult, { delay: 0.4 + i * 0.1 });
      }
      break;
    }
  }
  return true;
}

/** 번개 사슬: 가까운 적부터 다섯 번 튄다 */
function chain(g: Game, mult: number): void {
  const w = g.world;
  const p = w.player;
  let from = { x: p.x, y: p.y };
  const hit: Monster[] = [];
  let range = 180;
  for (let i = 0; i < 5; i++) {
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
    from = { x: best.x, y: best.y };
    range = 95;
  }
}

function runQueue(g: Game, _dt: number): void {
  const w = g.world;
  const p = w.player;
  while (p.queue.length && p.queue[0].at <= w.time) {
    const q = p.queue.shift()!;
    if (q.kind === 'dance') {
      const lv = skillLv(g.save, 't_dance');
      const m = nearestMonster(w, p.x, p.y, 170);
      if (!m) continue;
      // 적 옆으로 순간이동해서 벤다
      const a = (q.n * Math.PI * 2) / 3;
      p.x = m.x + Math.cos(a) * (m.r + 10);
      p.y = m.y + Math.sin(a) * (m.r + 10);
      moveCircle(w.map, p, 0, 0, p.r);
      p.dir = normalize({ x: m.x - p.x, y: m.y - p.y });
      p.face = faceOf(p.dir);
      w.events.push({ kind: 'swing', at: { x: p.x, y: p.y }, dir: { ...p.dir }, reach: 40, arc: 160, step: 2 });
      hitMonster(g, m, SKILLS.t_dance.mult(lv), { skill: true, knock: 60 });
    } else if (q.kind === 'hunt') {
      const lv = skillLv(g.save, 'r_hunt');
      const m = nearestMonster(w, p.x, p.y, arrowRange(g, 240));
      const dir = m ? { x: m.x - p.x, y: m.y - p.y } : p.dir;
      shoot(g, 'arrow', dir, { speed: 380, range: arrowRange(g, 250), mult: SKILLS.r_hunt.mult(lv), skill: true, knock: 30 });
    }
  }
}
