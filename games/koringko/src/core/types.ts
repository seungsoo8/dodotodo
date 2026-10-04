/** 저장되는 캐릭터 상태와 장비 (화면과 무관) */

export type HeroId = 'toby' | 'bori' | 'ruru' | 'nabi';
export type Attr = 'str' | 'vit' | 'dex' | 'int';
export const ATTRS: Attr[] = ['str', 'vit', 'dex', 'int'];

export type Slot = 'weapon' | 'hat' | 'armor' | 'gloves' | 'shoes' | 'ring' | 'necklace';
export const SLOTS: Slot[] = ['weapon', 'hat', 'armor', 'gloves', 'shoes', 'ring', 'necklace'];

export type Rarity = 'normal' | 'magic' | 'rare' | 'unique' | 'legendary';
export const RARITIES: Rarity[] = ['normal', 'magic', 'rare', 'unique', 'legendary'];

/** 장비에 붙는 추가 능력 */
export type AffixId =
  | 'atk'
  | 'atkp'
  | 'def'
  | 'hp'
  | 'sp'
  | 'str'
  | 'vit'
  | 'dex'
  | 'int'
  | 'crit'
  | 'critd'
  | 'aspd'
  | 'ms'
  | 'skill'
  | 'regen'
  | 'leech'
  | 'gold'
  | 'cdr';

export interface Affix {
  id: AffixId;
  v: number;
}

export interface Item {
  uid: string;
  slot: Slot;
  /** 이름 (기본 이름, 레어 이상은 붙은 이름) */
  name: string;
  rarity: Rarity;
  /** 아이템 레벨 (나온 곳의 레벨) */
  ilvl: number;
  /** 착용 요구 레벨 */
  req: number;
  /** 무기 피해 [최소, 최대] */
  dmg?: [number, number];
  /** 무기 공격 속도 배율 */
  spd?: number;
  /** 방어구 기본 방어력 */
  def?: number;
  affixes: Affix[];
  /** 전설 고유 능력 */
  power?: string;
  /** 대장간 강화 단계 (+0 ~ +10) */
  plus: number;
  /** 무기 주인 (직업마다 무기 종류가 다르다) */
  hero?: HeroId;
}

export type MatId = 'fluff' | 'gear' | 'sugar' | 'dust' | 'star';

export type QuestState = 'none' | 'active' | 'ready' | 'done';

export interface QuestProgress {
  state: QuestState;
  n: number;
}

/** 캐릭터 하나의 저장 내용 */
export interface Save {
  version: number;
  /** 저장 칸 번호 (0~2) */
  slot: number;
  name: string;
  hero: HeroId;
  lv: number;
  exp: number;
  gold: number;
  /** 지금 능력치 (기본 + 레벨 자동 + 배분) */
  attrs: Record<Attr, number>;
  statPts: number;
  skillPts: number;
  /** 스킬 id → 레벨 (0 이면 아직 배우지 않음) */
  skills: Record<string, number>;
  hp: number;
  sp: number;
  potions: { hp: number; sp: number };
  bag: Item[];
  gear: Partial<Record<Slot, Item>>;
  mats: Record<MatId, number>;
  quests: Record<string, QuestProgress>;
  flags: Record<string, boolean>;
  /** 마지막으로 있던 곳 */
  map: string;
  x: number;
  y: number;
  /** 다락방 균열: 지금 도전할 깊이 · 가장 깊이 간 곳 */
  riftDepth: number;
  riftBest: number;
  kills: number;
  playTime: number;
  /** 아이템 번호 (uid) 를 만들 때 쓰는 수 */
  nextUid: number;
}
