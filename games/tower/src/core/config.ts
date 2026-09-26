export interface GameConfig {
  width: number;
  height: number;
  roundSeconds: number;
  /** 마지막 라운드. 이 라운드가 시작되면 보스가 나오고, 보스를 잡으면 승리 */
  totalRounds: number;
  /** 시작할 때 들고 있는 무기 id */
  startWeapons: string[];
  tower: {
    radius: number;
    maxHp: number;
    regen: number;
    armor: number;
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
  tower: {
    radius: 16,
    maxHp: 1000,
    regen: 0,
    armor: 0,
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
    hpGrowth: 1.16,
    atkGrowth: 1.1,
    bountyGrowth: 1.08,
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
    chaosRange: overrides.chaosRange ?? base.chaosRange,
    startWeapons: overrides.startWeapons ?? base.startWeapons,
  };
}
