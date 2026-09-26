export type WeaponType = 'normal' | 'pierce' | 'magic' | 'siege' | 'chaos';

/** 무기가 적을 때리는 방식 */
export type WeaponBehavior =
  | { kind: 'single' }
  | { kind: 'pierce'; width: number }
  | { kind: 'chain'; jumps: number; jumpRange: number }
  | { kind: 'splash'; radius: number }
  | { kind: 'slow'; factor: number; duration: number };

export interface WeaponDef {
  kind: 'weapon';
  id: string;
  name: string;
  desc: string;
  type: WeaponType;
  price: number;
  damage: number;
  /** 공격 주기(초) */
  cooldown: number;
  /** 사거리(px, 탑 중심 기준) */
  range: number;
  behavior: WeaponBehavior;
}

export type UpgradeEffect =
  | { stat: 'maxHp'; amount: number }
  | { stat: 'regen'; amount: number }
  | { stat: 'armor'; amount: number }
  | { stat: 'damage'; amount: number }
  | { stat: 'income'; amount: number }
  | { stat: 'attackSpeed'; amount: number }
  | { stat: 'crit'; amount: number }
  | { stat: 'thorns'; amount: number }
  | { stat: 'range'; amount: number };

export interface UpgradeDef {
  kind: 'upgrade';
  id: string;
  name: string;
  desc: string;
  price: number;
  effect: UpgradeEffect;
}

export type ItemDef = WeaponDef | UpgradeDef;

/** 적의 특수 능력 */
export type EnemyAbility = 'split' | 'thief' | 'healer' | 'shield' | 'flying';

/** 보스 패턴: 소환 · 돌진 · 화염 폭풍 */
export type BossPattern = 'summon' | 'charge' | 'nova';

/** 보스 패턴 진행 상태. idle → (주기) → windup(기 모으기) → 발동. 돌진은 dash 를 거친다 */
export interface BossPatternState {
  kind: BossPattern;
  phase: 'idle' | 'windup' | 'dash';
  /** 다음 기 모으기까지 남은 시간 */
  timer: number;
  /** 기 모으기 남은 시간 */
  phaseLeft: number;
  /** 기 모으는 동안 받은 피해 (끊기 판정) */
  staggerDamage: number;
  enraged: boolean;
}

export interface EnemyDef {
  id: string;
  name: string;
  hp: number;
  speed: number;
  atk: number;
  /** 공격 주기(초) */
  atkInterval: number;
  bounty: number;
  radius: number;
  /** 이 라운드부터 등장 */
  minRound: number;
  /** 등장 가중치 */
  weight: number;
  color: string;
  ability?: EnemyAbility;
  /** 보스만: 패턴과 등장 대사 */
  boss?: { pattern: BossPattern; line: string };
}

export interface Enemy {
  id: number;
  def: EnemyDef;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  atk: number;
  speed: number;
  radius: number;
  bounty: number;
  isBoss: boolean;
  isElite: boolean;
  attackCooldown: number;
  slowFactor: number;
  slowTimeLeft: number;
  /** 도둑: 훔친 골드 */
  stolen: number;
  /** 도둑: 훔친 뒤 달아나는 중 */
  fleeing: boolean;
  /** 도둑: 화면 밖으로 도망침 (현상금 없이 사라짐) */
  escaped: boolean;
  /** 능력 주기 타이머 (주술사 치유) */
  abilityTimer: number;
  /** 보스 패턴 상태 (보스만) */
  pattern?: BossPatternState;
}

export interface OwnedWeapon {
  def: WeaponDef;
  cooldownLeft: number;
  /** ★ 레벨 (1~3). 같은 무기 3개가 합쳐지면 오른다 */
  level: number;
}

export interface Tower {
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  regen: number;
  armor: number;
  /** 모든 무기 피해 배율 (1 = 100%) */
  damageMul: number;
  /** 아이템으로 얻은 추가 초당 골드 */
  bonusIncome: number;
  /** 공격 속도 배율 (1 = 100%). 주기 = 기본 주기 / 이 값 */
  attackSpeedMul: number;
  /** 치명타 확률 (0~1). 치명타는 2배 피해 */
  critChance: number;
  /** 탑을 때린 적에게 돌려주는 피해 */
  thorns: number;
  /** 모든 무기 사거리 추가 */
  rangeBonus: number;
}

/** 화면 연출용 이벤트. 로직에는 영향을 주지 않는다. */
export type GameEvent =
  | { kind: 'shot'; weaponId: string; weaponType: WeaponType; behavior: WeaponBehavior['kind']; from: Point; to: Point }
  | { kind: 'splash'; at: Point; radius: number }
  | { kind: 'hit'; at: Point; amount: number; enemyId: number; crit: boolean }
  | { kind: 'towerHit'; amount: number }
  | { kind: 'kill'; at: Point; bounty: number; enemyId: number }
  | { kind: 'round'; round: number }
  | { kind: 'boss'; n: number; id: string }
  | { kind: 'bossWindup'; pattern: BossPattern; at: Point; duration: number }
  | { kind: 'bossCancel'; at: Point }
  | { kind: 'bossSummon'; at: Point; count: number }
  | { kind: 'bossSlam'; at: Point; amount: number }
  | { kind: 'bossNova'; at: Point; amount: number }
  | { kind: 'bossShot'; from: Point; amount: number }
  | { kind: 'bossEnrage'; at: Point }
  | { kind: 'bossDown'; at: Point }
  | { kind: 'elite'; name: string }
  | { kind: 'steal'; at: Point; amount: number }
  | { kind: 'escape'; at: Point; amount: number }
  | { kind: 'heal'; at: Point; radius: number }
  | { kind: 'merge'; weaponId: string; level: number }
  | { kind: 'sell'; weaponId: string; amount: number }
  | { kind: 'choice' }
  | { kind: 'perk'; id: string }
  | { kind: 'skill'; id: string; at?: Point; targets?: Point[]; evolved?: boolean }
  | { kind: 'combo'; id: string }
  | { kind: 'skillPoint'; total: number }
  | { kind: 'learn'; id: string }
  | { kind: 'evolve'; id: string }
  | { kind: 'fuse'; id: string; from: [string, string] }

export interface Point {
  x: number;
  y: number;
}

export type GameStatus = 'playing' | 'won' | 'lost';
