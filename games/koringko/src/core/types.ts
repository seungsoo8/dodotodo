import type { Rect, Vec } from './geom.ts';

export type HeroId = 'toby' | 'bori' | 'ruru' | 'nabi';

/** 한 순간의 조작 (키보드·마우스·조이스틱이 이것으로 바뀐다) */
export interface Input {
  /** 이동 방향 (길이 0~1) */
  move: Vec;
  /** 조준할 전장 좌표 (없으면 가까운 적 → 이동 방향 → 보던 방향) */
  aim: Vec | null;
  /** 누르고 있는 동안 계속 공격 */
  attack: boolean;
  /** 이번 순간 눌렀다 */
  dash: boolean;
  skill: boolean;
  ult: boolean;
}

export const NO_INPUT: Input = { move: { x: 0, y: 0 }, aim: null, attack: false, dash: false, skill: false, ult: false };

export interface Status {
  burnDps: number;
  burnLeft: number;
  /** 이동 속도 배율 (1 = 정상) */
  slow: number;
  slowLeft: number;
  /** 멈춤(기절·얼음) 남은 시간 */
  stun: number;
}

export function freshStatus(): Status {
  return { burnDps: 0, burnLeft: 0, slow: 1, slowLeft: 0, stun: 0 };
}

export interface Player {
  hero: HeroId;
  x: number;
  y: number;
  r: number;
  hp: number;
  maxHp: number;
  /** 보는 방향 (라디안) */
  facing: number;
  /** 밀려나는 속도 */
  kx: number;
  ky: number;
  /** 대시 중 남은 시간과 방향 */
  dashLeft: number;
  dashDir: Vec;
  dashCharges: number;
  /** 다음 대시 충전까지 */
  dashRecharge: number;
  /** 무적 남은 시간 */
  iframes: number;
  /** 다음 공격까지 */
  attackCd: number;
  /** 지금 몇 번째 연속 공격 (0부터) */
  combo: number;
  /** 연속 공격이 이어지는 남은 시간 */
  comboLeft: number;
  skillCd: number;
  /** 궁극기 게이지 (0 ~ ult.max) */
  ult: number;
  /** 보리 궁극기(곰의 분노) 남은 시간 */
  rageLeft: number;
  status: Status;
}

export type EnemyBehavior = 'chase' | 'charger' | 'shooter' | 'bouncer' | 'jumper' | 'flyer' | 'caster';

export interface EnemyDef {
  id: string;
  name: string;
  hp: number;
  speed: number;
  radius: number;
  /** 몸으로 부딪힐 때 피해 */
  damage: number;
  behavior: EnemyBehavior;
  /** 떨구는 사탕 */
  candy: number;
  /** 밀려나는 정도 (0 = 안 밀림) */
  weight?: number;
  /** 죽으면 이것 두 마리로 나뉜다 */
  splitInto?: string;
  /** 쏘는 탄 피해 (사수·마법사) */
  shot?: { damage: number; speed: number; interval: number; count?: number; spread?: number };
  /** 웨이브 예산에서 차지하는 값 */
  cost: number;
}

export interface Enemy {
  id: number;
  def: EnemyDef;
  x: number;
  y: number;
  r: number;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  elite: boolean;
  kx: number;
  ky: number;
  status: Status;
  /** 행동 단계와 시간 */
  ai: { state: string; timer: number; dir: Vec; target: Vec };
  /** 다시 몸으로 때릴 수 있을 때까지 */
  contactCd: number;
  /** 땅속(깜짝 상자)·순간이동 중: 맞지도 때리지도 않는다 */
  hidden: boolean;
  /** 나타나기까지 남은 시간 (그동안 자리 표시만) */
  spawnLeft: number;
  /** 보스 */
  boss: BossState | null;
  /** 맞은 순간 (깜빡임) */
  hitAt: number;
}

export type BossId = 'bear' | 'jelly' | 'tin' | 'dust';

export interface BossState {
  id: BossId;
  phase: number;
  /** 지금 기술 (없으면 쉬는 중) */
  move: string | null;
  /** 기술의 단계 */
  step: 'idle' | 'windup' | 'active' | 'recover';
  timer: number;
  /** 다음 기술까지 */
  next: number;
  /** 기술 순서 (번갈아 쓴다) */
  cycle: number;
  /** 기술마다 쓰는 값 (돌진 방향, 회전 각 등) */
  data: { dir: Vec; target: Vec; count: number; angle: number };
}

export interface Projectile {
  id: number;
  kind: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  damage: number;
  from: 'player' | 'enemy';
  /** 더 꿰뚫을 수 있는 수 */
  pierce: number;
  life: number;
  /** 이미 맞은 적 (꿰뚫을 때 두 번 맞지 않게) */
  hit: number[];
  /** 닿으면 이 반경으로 터진다 */
  explode?: number;
  /** 어디서 온 피해인지 (축복 효과 고르기) */
  source: DamageSource;
}

export type HazardShape = { type: 'circle'; x: number; y: number; r: number } | { type: 'line'; x1: number; y1: number; x2: number; y2: number; w: number };

export interface Hazard {
  id: number;
  kind: string;
  shape: HazardShape;
  /** 예고 남은 시간 (이 동안은 표시만) */
  delay: number;
  /** 예고 뒤 살아 있는 시간. 0 이면 한 번 터지고 끝 */
  life: number;
  from: 'player' | 'enemy';
  damage: number;
  /** 살아 있는 동안 이 간격마다 다시 때린다 (0 이면 처음 한 번만) */
  tick: number;
  tickLeft: number;
  slow?: number;
  stun?: number;
  burn?: number;
  source: DamageSource;
  /** 이번 판정에서 이미 맞은 대상 (한 번만 때리는 것) */
  hit: number[];
  /** 예고 동안 보여 줄 전체 시간 (그리기) */
  telegraph: number;
}

export type DamageSource = 'attack' | 'skill' | 'dash' | 'ult' | 'boon' | 'enemy';

export type PickupKind = 'candy' | 'heart';

export interface Pickup {
  id: number;
  kind: PickupKind;
  x: number;
  y: number;
  value: number;
  /** 플레이어 쪽으로 끌려가는 중 */
  pulled: boolean;
}

/** 문 너머 방에서 받을 보상 */
export type RewardKind = 'boon' | 'candy' | 'heart' | 'key' | 'shop' | 'rest' | 'boss';

export interface Door {
  x: number;
  reward: RewardKind;
  /** 정예 방 (더 어렵고 보상 두 배) */
  elite: boolean;
}

export type RoomKind = 'start' | 'fight' | 'shop' | 'rest' | 'boss';

export interface Room {
  kind: RoomKind;
  width: number;
  height: number;
  obstacles: Rect[];
  /** 웨이브마다 나올 적 (정예는 앞에 '!') */
  waves: string[][];
  /** 지금 웨이브 (waves.length 면 다 나왔다) */
  wave: number;
  /** 다 깨면 받는 보상 */
  reward: RewardKind | null;
  elite: boolean;
  cleared: boolean;
  /** 다 깬 뒤 열리는 문 */
  doors: Door[] | null;
  /** 쉼터 침대·상점을 이미 썼는지 */
  used: boolean;
}

export interface ShopItem {
  kind: 'heal' | 'maxHp' | 'boon' | 'key';
  price: number;
  sold: boolean;
}

/** 판을 멈추고 고르는 창 */
export type Pause = { kind: 'boon'; options: string[] } | { kind: 'key'; options: string[] } | { kind: 'shop'; items: ShopItem[] };

export type GameEvent =
  | { kind: 'swing'; at: Vec; facing: number; arc: number; range: number; step: number; source: DamageSource }
  | { kind: 'shot'; at: Vec; facing: number; projectile: string }
  | { kind: 'hit'; at: Vec; amount: number; crit: boolean; enemyId: number; source: DamageSource }
  | { kind: 'kill'; at: Vec; enemyId: number; defId: string; elite: boolean; boss: boolean }
  | { kind: 'hurt'; amount: number; at: Vec }
  | { kind: 'dash'; from: Vec; dir: Vec; blink: boolean }
  | { kind: 'skill'; hero: HeroId; at: Vec; facing: number }
  | { kind: 'ult'; hero: HeroId; at: Vec }
  | { kind: 'explode'; at: Vec; r: number; from: 'player' | 'enemy'; tag: string }
  | { kind: 'enemyShot'; at: Vec; count: number }
  | { kind: 'spawn'; at: Vec; elite: boolean }
  | { kind: 'wave'; wave: number; of: number }
  | { kind: 'roomClear'; reward: RewardKind | null }
  | { kind: 'room'; floor: number; roomNo: number; roomKind: RoomKind }
  | { kind: 'pickup'; pickup: PickupKind; value: number; at: Vec }
  | { kind: 'heal'; amount: number }
  | { kind: 'pause'; pause: Pause['kind'] }
  | { kind: 'boon'; id: string; level: number }
  | { kind: 'key'; id: string }
  | { kind: 'buy'; item: ShopItem['kind'] }
  | { kind: 'bossIntro'; id: BossId }
  | { kind: 'bossPhase'; id: BossId; phase: number }
  | { kind: 'bossMove'; id: BossId; move: string }
  | { kind: 'bossDown'; id: BossId; at: Vec }
  | { kind: 'revive' }
  | { kind: 'chain'; from: Vec; to: Vec }
  | { kind: 'ultReady' };
