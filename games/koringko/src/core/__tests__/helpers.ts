import type { ConfigOverrides } from '../config.ts';
import { createRun, spawnEnemy, step, type Run } from '../game.ts';
import type { Vec } from '../geom.ts';
import { NO_INPUT, type Enemy, type EnemyDef, type HeroId, type Input } from '../types.ts';

/** 적이 저절로 나오지 않는 빈 방 (가운데에 주인공). 상황은 테스트가 만든다 */
export function arena(hero: HeroId = 'toby', config: ConfigOverrides = {}, seed = 1): Run {
  return createRun({ hero, seed, config: { crit: { chance: 0 }, ...config }, arena: true });
}

/** 움직이지도 때리지도 않는 표적 */
export function dummy(overrides: Partial<EnemyDef> = {}): EnemyDef {
  return { id: 'dummy', name: '허수아비', hp: 1000, speed: 0, radius: 8, damage: 0, behavior: 'chase', candy: 0, weight: 1, cost: 1, ...overrides };
}

/** 주인공 기준 (dx, dy) 자리에 적을 바로 세운다 (나타나는 예고 없이) */
export function placeAt(run: Run, dx: number, dy: number, def: EnemyDef = dummy()): Enemy {
  const e = spawnEnemy(run, def, run.player.x + dx, run.player.y + dy, false);
  e.spawnLeft = 0;
  return e;
}

export function input(over: Partial<Input> = {}): Input {
  return { ...NO_INPUT, ...over };
}

/** seconds 동안 같은 조작으로 흘린다. 첫 순간에만 누르는 것(대시·기술·궁극기)은 처음 한 번만 */
export function hold(run: Run, over: Partial<Input>, seconds: number, dt = 1 / 60): void {
  const n = Math.round(seconds / dt);
  for (let i = 0; i < n; i++) {
    const once = i === 0 ? {} : { dash: false, skill: false, ult: false };
    step(run, dt, input({ ...over, ...once }));
  }
}

export function idle(run: Run, seconds: number): void {
  hold(run, {}, seconds);
}

export const right: Vec = { x: 1, y: 0 };
