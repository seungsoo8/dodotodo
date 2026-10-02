import { DEFAULT_CONFIG, type ConfigOverrides } from '../config.ts';
import { createGame, spawnEnemy, type GameState } from '../game.ts';
import type { Enemy, EnemyDef } from '../types.ts';

/**
 * 적이 자동으로 나오지 않고 골드 수입도 없고 보상 카드도 나오지 않는 판. 상황을 테스트가 직접 만든다.
 * 무기가 사방(360°)을 쏘게 해 두어 무기 자체의 동작만 본다. 면·부채꼴 규칙은 directionalGame 으로 따로 검증한다.
 */
export function quietGame(overrides: ConfigOverrides = {}, seed = 1): GameState {
  return createGame({
    seed,
    config: {
      startWeapons: [],
      ...overrides,
      tower: { arc: 360, ...overrides.tower },
      waves: { baseCount: 0, countPerRound: 0, ...overrides.waves },
      rewards: { every: 0, ...overrides.rewards },
      route: { every: 0, ...overrides.route },
      incidents: { chance: 0, ...overrides.incidents },
      economy: { baseIncome: 0, incomePerRound: 0, ...overrides.economy },
    },
  });
}

/** quietGame 과 같지만 무기가 실제 게임처럼 자기 면 부채꼴만 쏜다 */
export function directionalGame(overrides: ConfigOverrides = {}, seed = 1): GameState {
  return quietGame({ ...overrides, tower: { arc: DEFAULT_CONFIG.tower.arc, ...overrides.tower } }, seed);
}

/** 테스트용 적 정의. 기본은 움직이지도 공격하지도 않는 표적. */
export function dummyDef(overrides: Partial<EnemyDef> = {}): EnemyDef {
  return {
    id: 'dummy',
    name: '허수아비',
    hp: 100,
    speed: 0,
    atk: 0,
    atkInterval: 1,
    bounty: 7,
    radius: 5,
    minRound: 1,
    weight: 1,
    color: '#fff',
    ...overrides,
  };
}

/** 탑 중심에서 (dx, dy) 떨어진 곳에 적을 놓는다. */
export function placeAt(state: GameState, dx: number, dy: number, def: EnemyDef = dummyDef()): Enemy {
  return spawnEnemy(state, def, state.tower.x + dx, state.tower.y + dy);
}

export function distToTower(state: GameState, e: Enemy): number {
  return Math.hypot(e.x - state.tower.x, e.y - state.tower.y);
}

/** 스킬 칸을 직접 정한다: [id, 진화 여부] 목록 */
export function giveSkills(state: GameState, skills: [string, boolean][]): void {
  state.skills = skills.map(([id, evolved]) => ({ id, evolved, power: 1 }));
}
