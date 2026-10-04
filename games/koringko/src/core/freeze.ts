/**
 * 얼음 땡: 아이가 방에 들어온다! 경고 뒤 '얼음' 동안 모두 멈춘다.
 * 움직이면 들켜서 HP 를 잃고 몬스터가 화가 난다. 끝까지 참으면 조금 회복. 태엽 감기는 괜찮다.
 */
import type { Game } from './game.ts';
import { onFreezeOk } from './quests.ts';
import type { Input } from './world.ts';

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

export interface FreezeState {
  phase: 'none' | 'warn' | 'freeze';
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
  return { phase: 'none', t: 0, next: FREEZE.first, caught: false };
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
  if (f.phase === 'none') {
    if (!freezeActive(g)) return;
    f.next -= dt;
    if (f.next <= 0) {
      f.phase = 'warn';
      f.t = FREEZE.warn;
      w.events.push({ kind: 'freezeWarn' });
    }
    return;
  }
  f.t -= dt;
  if (f.phase === 'warn') {
    if (f.t <= 0) {
      f.phase = 'freeze';
      f.t = f.dur ?? FREEZE.freeze;
      f.caught = false;
      w.events.push({ kind: 'freeze' });
    }
    return;
  }
  // 얼음!
  if (!f.caught && moved(input)) {
    f.caught = true;
    const loss = Math.round(g.stats.maxHp * (f.loss ?? FREEZE.hpLoss));
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
    f.next = FREEZE.gap[0] + g.rng.next() * (FREEZE.gap[1] - FREEZE.gap[0]);
  }
}

/** 누군가 "얼음!" 을 외친다 (보스전에서도) */
export function callFreeze(g: Game, warn: number, dur: number, loss: number): void {
  const f = g.world.freeze;
  f.phase = 'warn';
  f.t = warn;
  f.dur = dur;
  f.loss = loss;
  g.world.events.push({ kind: 'freezeWarn' });
}

/** 얼음 동안은 몬스터 · 탄 · 장판이 멈춘다 */
export function frozen(g: Game): boolean {
  return g.world.freeze.phase === 'freeze';
}
