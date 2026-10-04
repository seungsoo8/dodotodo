/**
 * 얼음 땡: 아이가 방에 들어온다! 경고 뒤 '얼음' 동안 모두 멈춘다.
 * 움직이면 들켜서 HP 를 잃고 몬스터가 화가 난다. 끝까지 참으면 조금 회복. 태엽 감기는 괜찮다.
 */
import type { Game } from './game.ts';
import { onFreezeOk } from './quests.ts';
import type { Input } from './world.ts';
import type { MapDef } from './maps.ts';

export const FREEZE = {
  /** 방에 들어와 첫 얼음까지 */
  first: 45,
  /** 다음 얼음까지 (최소 · 최대) */
  gap: [70, 110] as [number, number],
  warn: 3,
  freeze: 3.5,
  hpLoss: 0.2,
  heal: 0.1,
  /** 들켰을 때 몬스터가 빨라지는 시간 · 배율 */
  rage: 6,
  rageSpeed: 1.4,
};

/**
 * 방마다 다른 얼음 땡:
 *   still — 아이 발소리: 움직이면 들킨다 (장난감 상자 · 다락방 상자)
 *   hands — 엄마 손이 과자를 집으러 온다: 손 그림자 안에 있으면 들킨다 (과자 서랍)
 *   alarm — 시계 알람 따르릉: 계속 움직여야 한다, 멈추면 들킨다 (책상 시계 공장)
 *   light — 손전등 불빛이 훑고 지나간다: 빛에 닿으면 들킨다 (침대 밑)
 *   king  — 먼지 왕의 목소리: 경고가 짧고 얼음이 길고 더 아프다 (다락방)
 */
export type FreezeKind = 'still' | 'hands' | 'alarm' | 'light' | 'king';

export const FREEZE_KIND: Record<FreezeKind, { warn: number; freeze: number; hpLoss: number }> = {
  still: { warn: FREEZE.warn, freeze: FREEZE.freeze, hpLoss: FREEZE.hpLoss },
  hands: { warn: 3, freeze: 3, hpLoss: 0.2 },
  alarm: { warn: 2.5, freeze: 3, hpLoss: 0.2 },
  light: { warn: 2.5, freeze: 3.6, hpLoss: 0.2 },
  king: { warn: 1.8, freeze: 4.5, hpLoss: 0.3 },
};
/** 손 그림자 · 손전등 · 알람 */
export const HANDS = { n: 3, r: 44, spread: 110 };
export const LIGHT = { r: 60, speed: 120, from: 220 };
export const ALARM = { still: 0.5 };

export function freezeKind(map: MapDef): FreezeKind {
  return map.freeze ?? 'still';
}

export interface FreezeState {
  phase: 'none' | 'warn' | 'freeze';
  kind: FreezeKind;
  /** 손 그림자 */
  zones: { x: number; y: number; r: number }[];
  /** 손전등 불빛 */
  light: { x: number; y: number; vx: number; r: number } | null;
  /** 알람: 멈춰 있던 시간 */
  stillT: number;
  /** 이번 단계 남은 시간 */
  t: number;
  /** 다음 경고까지 */
  next: number;
  caught: boolean;
  /** 먼지 왕이 외친 얼음: 얼음 시간 · 들키면 잃는 HP 비율 */
  dur?: number;
  loss?: number;
}

export function freshFreeze(): FreezeState {
  return { phase: 'none', kind: 'still', zones: [], light: null, stillT: 0, t: 0, next: FREEZE.first, caught: false };
}

function moved(input: Input): boolean {
  return Math.hypot(input.move.x, input.move.y) > 0.05 || input.attack || input.roll || !!input.skill || !!input.potion || !!input.swap;
}

/** 얼음이 걸리는 곳: 마을이 아니고 보스 · 먼지 무리와 싸우는 중이 아닐 때 */
export function freezeActive(g: Game): boolean {
  const w = g.world;
  return !w.map.safe && w.boss !== 'spawned' && !w.rescue && !(w.rift && w.rift.guardian === 'spawned') && w.player.state !== 'dead';
}

export function updateFreeze(g: Game, dt: number, input: Input): void {
  const w = g.world;
  const f = w.freeze;
  const p = w.player;
  if (f.phase === 'none') {
    if (!freezeActive(g)) return;
    f.next -= dt;
    if (f.next <= 0) startWarn(g, freezeKind(w.map));
    return;
  }
  f.t -= dt;
  if (f.phase === 'warn') {
    if (f.t <= 0) {
      f.phase = 'freeze';
      f.t = f.dur ?? FREEZE_KIND[f.kind].freeze;
      f.caught = false;
      f.stillT = 0;
      if (f.kind === 'light') f.light = { x: p.x - LIGHT.from, y: p.y, vx: LIGHT.speed, r: LIGHT.r };
      w.events.push({ kind: 'freeze', type: f.kind });
    }
    return;
  }
  // 얼음!
  if (f.light) f.light.x += f.light.vx * dt;
  if (!f.caught && spotted(f, input, p, dt)) {
    f.caught = true;
    const loss = Math.round(g.stats.maxHp * (f.loss ?? FREEZE_KIND[f.kind].hpLoss));
    g.save.hp = Math.max(1, g.save.hp - loss);
    for (const m of w.monsters) if (m.hp > 0) m.rage = FREEZE.rage;
    w.events.push({ kind: 'caught', amount: loss });
  }
  if (f.t <= 0) {
    if (!f.caught) {
      g.save.hp = Math.min(g.stats.maxHp, g.save.hp + g.stats.maxHp * FREEZE.heal);
      w.events.push({ kind: 'freezeOk' });
      for (const id of onFreezeOk(g.save)) w.events.push({ kind: 'quest', id, state: g.save.quests[id].state });
    }
    f.phase = 'none';
    f.dur = f.loss = undefined;
    f.zones = [];
    f.light = null;
    f.next = FREEZE.gap[0] + g.rng.next() * (FREEZE.gap[1] - FREEZE.gap[0]);
  }
}

function startWarn(g: Game, kind: FreezeKind): void {
  const w = g.world;
  const f = w.freeze;
  const p = w.player;
  f.phase = 'warn';
  f.kind = kind;
  f.t = FREEZE_KIND[kind].warn;
  f.zones = [];
  f.light = null;
  if (kind === 'hands') {
    // 하나는 주인공 자리, 나머지는 둘레
    f.zones.push({ x: p.x, y: p.y, r: HANDS.r });
    for (let i = 1; i < HANDS.n; i++) {
      const a = g.rng.next() * Math.PI * 2;
      f.zones.push({ x: p.x + Math.cos(a) * HANDS.spread, y: p.y + Math.sin(a) * HANDS.spread, r: HANDS.r });
    }
  }
  w.events.push({ kind: 'freezeWarn', type: kind });
}

/** 이번 얼음 종류에서 들켰나 */
function spotted(f: FreezeState, input: Input, p: { x: number; y: number }, dt: number): boolean {
  switch (f.kind) {
    case 'hands':
      return f.zones.some((z) => Math.hypot(z.x - p.x, z.y - p.y) < z.r);
    case 'light':
      return !!f.light && Math.hypot(f.light.x - p.x, f.light.y - p.y) < f.light.r;
    case 'alarm':
      if (moved(input)) f.stillT = 0;
      else f.stillT += dt;
      return f.stillT > ALARM.still;
    default:
      return moved(input);
  }
}

/** 누군가 "얼음!" 을 외친다 (보스전에서도) */
export function callFreeze(g: Game, warn: number, dur: number, loss: number): void {
  const f = g.world.freeze;
  f.phase = 'warn';
  f.kind = 'still';
  f.zones = [];
  f.light = null;
  f.t = warn;
  f.dur = dur;
  f.loss = loss;
  g.world.events.push({ kind: 'freezeWarn', type: 'still' });
}

/** 얼음 동안은 몬스터 · 탄 · 장판이 멈춘다 */
export function frozen(g: Game): boolean {
  return g.world.freeze.phase === 'freeze';
}
