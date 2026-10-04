/** 저장되는 탐험대 상태 (화면과 무관) */

export type HeroId = 'toby' | 'bori' | 'ruru' | 'nabi';
export type Attr = 'str' | 'vit' | 'dex' | 'int';
export const ATTRS: Attr[] = ['str', 'vit', 'dex', 'int'];

/** 난이도 */
export type Difficulty = 'easy' | 'normal' | 'hard';

export type MatId = 'fluff' | 'gear' | 'sugar' | 'dust' | 'star';

export type QuestState = 'none' | 'active' | 'ready' | 'done';

export interface QuestProgress {
  state: QuestState;
  n: number;
}

/** 동료 한 명의 상태 (쉬는 동료는 bench 에 있다) */
export interface HeroState {
  hp: number;
  /** 태엽 (0~100) */
  sp: number;
  attrs: Record<Attr, number>;
  skills: Record<string, number>;
  skillPts: number;
  variants: Record<string, number>;
  /** 무기 손질 단계 (1~20) */
  weaponLv: number;
  /** 쓰러진 뒤 일어나기까지 남은 시간 (0 이면 멀쩡) */
  down: number;
}

/** 탐험대 저장 내용. 지금 싸우는 동료의 상태는 위쪽(hp · sp · attrs …)에, 쉬는 동료는 bench 에 */
export interface Save {
  version: number;
  /** 저장 칸 번호 (0~2) */
  slot: number;
  name: string;
  /** 지금 싸우는 동료 */
  hero: HeroId;
  /** 합류한 동료 (순서 = 1~4 키) */
  party: HeroId[];
  bench: Partial<Record<HeroId, HeroState>>;
  /** 탐험대 레벨 · 경험치 */
  lv: number;
  exp: number;
  /** 단추 (화폐) */
  gold: number;
  attrs: Record<Attr, number>;
  skillPts: number;
  difficulty: Difficulty;
  /** 스킬 id → 레벨 (0 이면 아직 배우지 않음) */
  skills: Record<string, number>;
  /** 스킬 id → 변형 번호 (없으면 기본) */
  variants: Record<string, number>;
  hp: number;
  /** 태엽 (0~100) */
  sp: number;
  weaponLv: number;
  /** 사탕 */
  potions: { hp: number };
  /** 가진 부품 id → 단계 (1~3) */
  parts: Record<string, number>;
  /** 부품 칸에 낀 부품 */
  slots: string[];
  mats: Record<MatId, number>;
  /** 몬스터 종류 → 깨끗하게 만든 수 */
  friends: Record<string, number>;
  /** 구출해서 마을 주민이 된 장난감 */
  rescued: string[];
  quests: Record<string, QuestProgress>;
  flags: Record<string, boolean>;
  /** 마지막으로 있던 곳 */
  map: string;
  x: number;
  y: number;
  /** 다락방 상자 도전: 지금 도전할 깊이 · 가장 깊이 간 곳 */
  riftDepth: number;
  riftBest: number;
  kills: number;
  playTime: number;
}
