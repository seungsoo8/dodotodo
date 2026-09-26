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
  | { stat: 'income'; amount: number };

export interface UpgradeDef {
  kind: 'upgrade';
  id: string;
  name: string;
  desc: string;
  price: number;
  effect: UpgradeEffect;
}

export type ItemDef = WeaponDef | UpgradeDef;

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
  attackCooldown: number;
  slowFactor: number;
  slowTimeLeft: number;
}

export interface OwnedWeapon {
  def: WeaponDef;
  cooldownLeft: number;
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
}

/** 화면 연출용 이벤트. 로직에는 영향을 주지 않는다. */
export type GameEvent =
  | { kind: 'shot'; weaponType: WeaponType; from: Point; to: Point }
  | { kind: 'splash'; at: Point; radius: number }
  | { kind: 'hit'; at: Point; amount: number }
  | { kind: 'towerHit'; amount: number }
  | { kind: 'kill'; at: Point; bounty: number }
  | { kind: 'round'; round: number }
  | { kind: 'boss' };

export interface Point {
  x: number;
  y: number;
}

export type GameStatus = 'playing' | 'won' | 'lost';
