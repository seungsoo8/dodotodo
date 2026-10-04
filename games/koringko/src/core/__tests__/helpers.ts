import { newSave } from '../character.ts';
import { newGame, step, type Game } from '../game.ts';
import type { Rng } from '../rng.ts';
import type { HeroId } from '../types.ts';
import { NO_INPUT, spawnMonster, type Input, type Monster } from '../world.ts';
import { changeMap } from '../game.ts';
import type { MapId } from '../maps.ts';

/** 늘 같은 값을 내는 주사위 (0.5 → 피해 변동 없음, 치명타 없음) */
export function fixedRng(v = 0.5): Rng {
  return { next: () => v, range: (a, b) => a + (b - a) * v, int: (n) => Math.floor(n * v) };
}

/** mapId 지도에 선 영웅. 몬스터는 모두 치우고 저절로 나오지 않게 한다 */
export function play(hero: HeroId = 'toby', mapId: MapId = 'toybox'): Game {
  const save = newSave(0, hero);
  const g = newGame(save, 1);
  if (mapId !== 'village') changeMap(g, mapId);
  clearField(g);
  g.rng = fixedRng();
  g.world.events = [];
  return g;
}

export function clearField(g: Game): void {
  g.world.monsters = [];
  g.world.map = { ...g.world.map, spawns: [] };
  g.world.respawn = [];
}

/** 주인공 기준 (dx, dy) 에 몬스터를 바로 세운다 */
export function placeAt(g: Game, defId: string, dx: number, dy: number, lv?: number): Monster {
  const p = g.world.player;
  const m = spawnMonster(g.world, defId, p.x + dx, p.y + dy, lv ?? 1);
  m.spawnLeft = 0;
  return m;
}

/** 꼼짝 않는 표적으로 만든다 */
export function freeze(m: Monster): Monster {
  m.speed = 0;
  m.status.stun = 1e9;
  return m;
}

export function hold(g: Game, over: Partial<Input>, seconds: number, dt = 1 / 60): void {
  const n = Math.round(seconds / dt);
  for (let i = 0; i < n; i++) {
    const first = i === 0;
    step(g, dt, { ...NO_INPUT, ...over, roll: first && !!over.roll, skill: first ? (over.skill ?? null) : null, potion: first ? (over.potion ?? null) : null, attackPressed: first && !!over.attackPressed, swap: first ? (over.swap ?? null) : null });
  }
}

export function idle(g: Game, seconds: number): void {
  hold(g, {}, seconds);
}
