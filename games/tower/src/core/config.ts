export interface GameConfig {
  width: number;
  height: number;
  roundSeconds: number;
  /** 마지막 라운드. 이 라운드가 시작되면 보스가 나오고, 보스를 잡으면 승리 */
  totalRounds: number;
  /** 시작할 때 들고 있는 무기 id */
  startWeapons: string[];
  /** 상점에 나오지 않는 아이템 id (영구 성장으로 풀리는 전설 무기) */
  lockedItems: string[];
  tower: {
    radius: number;
    maxHp: number;
    regen: number;
    armor: number;
    /** 공격 속도 배율 상한 */
    maxAttackSpeedMul: number;
    /** 탑에 달 수 있는 무기 수 */
    weaponSlots: number;
  };
  /** 스킬: 칸 수, 처음 가진 스킬, 스킬 포인트를 주는 라운드 주기 */
  skills: {
    slots: number;
    start: string[];
    pointEvery: number;
  };
  /** 보상 카드: every 라운드마다 cards 장 중 1장 */
  perks: {
    every: number;
    cards: number;
  };
  /** 무기 합성: 같은 무기 count 개 → 한 단계 위. 레벨별(★1, ★2, ★3) 배율 */
  merge: {
    count: number;
    maxLevel: number;
    damageMul: number[];
    speedMul: number[];
  };
  economy: {
    startGold: number;
    baseIncome: number;
    incomePerRound: number;
  };
  shop: {
    slots: number;
    rerollBaseCost: number;
    /** 같은 라운드에서 리롤할 때마다 오르는 비용 */
    rerollCostStep: number;
  };
  waves: {
    baseCount: number;
    countPerRound: number;
    /** 라운드 시간 중 적이 나오는 구간 비율 (0~1) */
    spawnWindow: number;
    hpGrowth: number;
    atkGrowth: number;
    bountyGrowth: number;
    /** 이 라운드마다 정예가 나온다 (0 이면 없음). 마지막 라운드는 제외 */
    eliteEvery: number;
  };
  sets: {
    /** 같은 계열 무기 수가 이 값 이상이면 1단계, 2단계 */
    thresholds: [number, number];
    /** 단계별 그 계열 무기 피해 보너스 */
    damageBonus: [number, number];
  };
  /** 무한 모드 규칙 */
  endless: {
    /** 이 라운드마다 보스 (15, 30, 45 …) */
    bossEvery: number;
    /** n 번째 보스는 기본 능력치 × 배율^(n-1) */
    bossHpGrowth: number;
    bossAtkGrowth: number;
    bossBountyGrowth: number;
    /** 클래식 마지막 라운드 이후 적 체력이 라운드마다 추가로 곱해지는 배율 (끝없이 버틸 수는 없게) */
    lateHpGrowth: number;
  };
  /** 방어력 1당 받는 피해 감소율. 받는 피해 = 공격력 / (1 + armor × 이 값) */
  armorFactor: number;
  /** 카오스 무기 피해 배율 범위 */
  chaosRange: [number, number];
}

export const DEFAULT_CONFIG: GameConfig = {
  width: 640,
  height: 360,
  roundSeconds: 20,
  totalRounds: 15,
  startWeapons: ['sling'],
  lockedItems: ['thunder_hammer', 'phoenix_bow', 'meteor_staff'],
  tower: {
    radius: 16,
    maxHp: 1000,
    regen: 0,
    armor: 0,
    maxAttackSpeedMul: 3,
    weaponSlots: 10,
  },
  perks: {
    every: 3,
    cards: 3,
  },
  skills: {
    slots: 4,
    start: ['meteor'],
    pointEvery: 3,
  },
  merge: {
    count: 3,
    maxLevel: 3,
    damageMul: [1, 3.5, 12],
    speedMul: [1, 1.1, 1.25],
  },
  economy: {
    startGold: 300,
    baseIncome: 5,
    incomePerRound: 1,
  },
  shop: {
    slots: 4,
    rerollBaseCost: 20,
    rerollCostStep: 10,
  },
  waves: {
    baseCount: 8,
    countPerRound: 3,
    spawnWindow: 0.8,
    hpGrowth: 1.17,
    atkGrowth: 1.1,
    bountyGrowth: 1.08,
    eliteEvery: 5,
  },
  sets: {
    thresholds: [3, 6],
    damageBonus: [0.2, 0.5],
  },
  endless: {
    bossEvery: 15,
    bossHpGrowth: 2.5,
    bossAtkGrowth: 1.5,
    bossBountyGrowth: 1.5,
    lateHpGrowth: 1.05,
  },
  armorFactor: 0.05,
  chaosRange: [0.5, 2],
};

export type ConfigOverrides = {
  [K in keyof GameConfig]?: GameConfig[K] extends unknown[]
    ? GameConfig[K]
    : GameConfig[K] extends object
      ? Partial<GameConfig[K]>
      : GameConfig[K];
};

export function makeConfig(overrides: ConfigOverrides = {}): GameConfig {
  const base = DEFAULT_CONFIG;
  return {
    ...base,
    ...overrides,
    tower: { ...base.tower, ...overrides.tower },
    economy: { ...base.economy, ...overrides.economy },
    shop: { ...base.shop, ...overrides.shop },
    waves: { ...base.waves, ...overrides.waves },
    sets: { ...base.sets, ...overrides.sets },
    endless: { ...base.endless, ...overrides.endless },
    merge: { ...base.merge, ...overrides.merge },
    perks: { ...base.perks, ...overrides.perks },
    skills: { ...base.skills, ...overrides.skills },
    chaosRange: overrides.chaosRange ?? base.chaosRange,
    startWeapons: overrides.startWeapons ?? base.startWeapons,
    lockedItems: overrides.lockedItems ?? base.lockedItems,
  };
}

/** 두 설정 덮어쓰기를 합친다. 뒤(b)가 이기고, 묶음(tower·waves 등)은 안쪽 값끼리 합친다. */
export function mergeOverrides(a: ConfigOverrides, b: ConfigOverrides): ConfigOverrides {
  const out: Record<string, unknown> = { ...a };
  for (const [key, value] of Object.entries(b)) {
    const prev = out[key];
    const isGroup = (v: unknown) => typeof v === 'object' && v !== null && !Array.isArray(v);
    out[key] = isGroup(prev) && isGroup(value) ? { ...(prev as object), ...(value as object) } : value;
  }
  return out as ConfigOverrides;
}

export type DifficultyId = 'easy' | 'normal' | 'hard';

/** classic: 15라운드 보스를 잡으면 승리 · endless: 끝없이 버티기 */
export type GameMode = 'classic' | 'endless';

export interface Difficulty {
  id: DifficultyId;
  name: string;
  desc: string;
  overrides: ConfigOverrides;
}

export const DIFFICULTIES: Difficulty[] = [
  {
    id: 'easy',
    name: '쉬움',
    desc: '적은 느리게, 돈은 넉넉하게',
    overrides: {
      tower: { maxHp: 1500 },
      economy: { startGold: 450 },
      waves: { hpGrowth: 1.13, atkGrowth: 1.08 },
    },
  },
  {
    id: 'normal',
    name: '보통',
    desc: '처음이라면 여기서',
    overrides: {},
  },
  {
    id: 'hard',
    name: '어려움',
    desc: '적이 많고 빨리 강해진다',
    overrides: {
      waves: { hpGrowth: 1.22, atkGrowth: 1.12, countPerRound: 4 },
    },
  },
];

export function findDifficulty(id: DifficultyId): Difficulty {
  const d = DIFFICULTIES.find((x) => x.id === id);
  if (!d) throw new Error(`알 수 없는 난이도: ${id}`);
  return d;
}
