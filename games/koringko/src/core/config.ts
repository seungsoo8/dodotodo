/** 규칙 수치. 난이도와 테스트는 덮어쓰기로 바꾼다 */
export interface Config {
  /** 방 벽 두께 */
  wall: number;
  floors: number;
  /** 층마다 보스 방 앞까지의 방 수 (시작 방 포함) */
  roomsPerFloor: number;
  /** 정예 방 · 상점 · 쉼터가 문에 나올 확률 */
  doorChances: { elite: number; shop: number; rest: number };
  enemy: { hpMul: number; damageMul: number; speedMul: number };
  /** 웨이브 예산: base + 층마다 + 방마다 */
  budget: { base: number; perFloor: number; perRoom: number; waves: number };
  /** 웨이브가 끝나고 다음 웨이브까지 · 나타나기 전 예고 */
  waveDelay: number;
  spawnTelegraph: number;
  crit: { chance: number; mul: number };
  /** 연속 공격이 이어지는 시간 (공격 뒤) */
  comboWindow: number;
  /** 맞은 뒤 무적 */
  hurtIframes: number;
  /** 대시가 끝난 뒤 남는 무적 */
  dashIframesAfter: number;
  /** 적이 몸으로 다시 때릴 수 있기까지 */
  contactCooldown: number;
  /** 밀려나는 속도가 줄어드는 비율 (초당 남는 비율) */
  knockbackDecay: number;
  ult: { max: number; perDamage: number; perKill: number };
  /** 사탕이 끌려오는 거리 */
  magnet: number;
  /** 시작할 때 사탕 */
  startCandy: number;
  /** 정예 배율 */
  elite: { hp: number; damage: number; radius: number; candy: number };
  /** 받는 피해 배율 (난이도) */
  playerDamageTakenMul: number;
}

export const DEFAULT_CONFIG: Config = {
  wall: 16,
  floors: 4,
  roomsPerFloor: 6,
  doorChances: { elite: 0.2, shop: 0.18, rest: 0.12 },
  enemy: { hpMul: 1, damageMul: 1, speedMul: 1 },
  budget: { base: 6, perFloor: 4, perRoom: 1.5, waves: 2 },
  waveDelay: 0.8,
  spawnTelegraph: 0.6,
  crit: { chance: 0.05, mul: 2 },
  comboWindow: 0.5,
  hurtIframes: 0.7,
  dashIframesAfter: 0.1,
  contactCooldown: 0.8,
  knockbackDecay: 0.0005,
  ult: { max: 100, perDamage: 0.1, perKill: 2 },
  magnet: 70,
  startCandy: 0,
  elite: { hp: 2.5, damage: 1.3, radius: 4, candy: 3 },
  playerDamageTakenMul: 1,
};

export type DifficultyId = 'easy' | 'normal' | 'hard';

export const DIFFICULTIES: { id: DifficultyId; name: string; desc: string; overrides: ConfigOverrides }[] = [
  { id: 'easy', name: '쉬움', desc: '적이 약하고 덜 아프다', overrides: { enemy: { hpMul: 0.8, damageMul: 0.7, speedMul: 0.95 }, playerDamageTakenMul: 0.8 } },
  { id: 'normal', name: '보통', desc: '처음이라면 여기서', overrides: {} },
  { id: 'hard', name: '어려움', desc: '적이 많고 세다', overrides: { enemy: { hpMul: 1.3, damageMul: 1.3, speedMul: 1.1 }, budget: { base: 8, perFloor: 5, perRoom: 2, waves: 2 } } },
];

export type ConfigOverrides = {
  [K in keyof Config]?: Config[K] extends object ? Partial<Config[K]> : Config[K];
};

export function makeConfig(...layers: ConfigOverrides[]): Config {
  const out = structuredClone(DEFAULT_CONFIG) as unknown as Record<string, unknown>;
  for (const layer of layers) {
    for (const [k, v] of Object.entries(layer)) {
      const prev = out[k];
      out[k] = typeof prev === 'object' && prev !== null && typeof v === 'object' && v !== null ? { ...prev, ...v } : v;
    }
  }
  return out as unknown as Config;
}

export function findDifficulty(id: DifficultyId) {
  return DIFFICULTIES.find((d) => d.id === id)!;
}
