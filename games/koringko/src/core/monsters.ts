/** 고장 난 장난감들: 몬스터 · 보스 정의와 레벨 맞추기 */
import type { MatId } from './types.ts';

export type Ai = 'hopper' | 'melee' | 'charger' | 'ranged' | 'flyer' | 'boss';
export type BossId = 'bear' | 'jelly' | 'tin' | 'dusty' | 'king';

export interface MonsterDef {
  id: string;
  name: string;
  lv: number;
  hp: number;
  atk: number;
  def: number;
  exp: number;
  gold: [number, number];
  /** 픽셀/초 */
  speed: number;
  ai: Ai;
  /** 알아채는 거리 */
  aggro: number;
  /** 몸 반지름 */
  r: number;
  /** 근접 공격이 닿는 거리 */
  reach?: number;
  /** 원거리: 탄 속도 · 한 번에 몇 발 · 벌어짐 · 간격 */
  shot?: { speed: number; count: number; spread: number; interval: number };
  /** 쓰러지면 이것 두 마리로 나뉜다 */
  split?: string;
  mat?: { id: MatId; chance: number };
  fly?: boolean;
  boss?: BossId;
}

const M: MonsterDef[] = [
  // ── 곰인형 숲 (1~6)
  { id: 'fluff', name: '솜뭉치', lv: 1, hp: 22, atk: 5, def: 0, exp: 5, gold: [2, 5], speed: 34, ai: 'hopper', aggro: 90, r: 8, mat: { id: 'fluff', chance: 0.3 } },
  { id: 'mushroom', name: '말랑 버섯', lv: 2, hp: 36, atk: 8, def: 1, exp: 8, gold: [3, 7], speed: 30, ai: 'melee', aggro: 80, r: 9, reach: 22 },
  { id: 'mouse', name: '태엽 쥐', lv: 3, hp: 30, atk: 9, def: 1, exp: 9, gold: [3, 8], speed: 64, ai: 'charger', aggro: 120, r: 7, mat: { id: 'gear', chance: 0.2 } },
  { id: 'wolf', name: '헝겊 늑대', lv: 4, hp: 62, atk: 12, def: 2, exp: 14, gold: [5, 10], speed: 58, ai: 'charger', aggro: 130, r: 10, mat: { id: 'fluff', chance: 0.3 } },
  { id: 'ragdoll', name: '누더기 인형', lv: 5, hp: 84, atk: 13, def: 3, exp: 18, gold: [6, 12], speed: 40, ai: 'melee', aggro: 110, r: 10, reach: 24 },
  // ── 과자 언덕 (6~12)
  { id: 'jelly', name: '젤리', lv: 6, hp: 72, atk: 13, def: 2, exp: 16, gold: [6, 12], speed: 36, ai: 'hopper', aggro: 100, r: 10, split: 'jellet', mat: { id: 'sugar', chance: 0.3 } },
  { id: 'jellet', name: '꼬마 젤리', lv: 6, hp: 24, atk: 8, def: 0, exp: 4, gold: [1, 3], speed: 44, ai: 'hopper', aggro: 120, r: 6 },
  { id: 'cookie', name: '쿠키 병정', lv: 7, hp: 112, atk: 17, def: 5, exp: 22, gold: [8, 14], speed: 42, ai: 'melee', aggro: 110, r: 10, reach: 24, mat: { id: 'sugar', chance: 0.25 } },
  { id: 'bee', name: '사탕 벌', lv: 8, hp: 56, atk: 15, def: 1, exp: 18, gold: [6, 12], speed: 70, ai: 'flyer', aggro: 130, r: 8, fly: true },
  { id: 'gum', name: '껌 저격수', lv: 9, hp: 70, atk: 16, def: 2, exp: 20, gold: [7, 13], speed: 34, ai: 'ranged', aggro: 150, r: 9, shot: { speed: 140, count: 1, spread: 0, interval: 1.8 } },
  { id: 'choco', name: '초콜릿 골렘', lv: 11, hp: 260, atk: 26, def: 10, exp: 48, gold: [14, 24], speed: 28, ai: 'melee', aggro: 100, r: 14, reach: 30, mat: { id: 'sugar', chance: 0.6 } },
  // ── 태엽 동굴 (8~14)
  { id: 'bat', name: '태엽 박쥐', lv: 8, hp: 52, atk: 15, def: 1, exp: 16, gold: [5, 11], speed: 76, ai: 'flyer', aggro: 130, r: 8, fly: true, mat: { id: 'gear', chance: 0.25 } },
  { id: 'tin', name: '깡통 병정', lv: 10, hp: 145, atk: 21, def: 7, exp: 30, gold: [9, 17], speed: 40, ai: 'melee', aggro: 120, r: 10, reach: 25, mat: { id: 'gear', chance: 0.35 } },
  { id: 'spider', name: '나사 거미', lv: 11, hp: 92, atk: 20, def: 3, exp: 28, gold: [8, 15], speed: 72, ai: 'charger', aggro: 140, r: 9 },
  { id: 'lamp', name: '램프 요정', lv: 12, hp: 82, atk: 19, def: 2, exp: 30, gold: [9, 16], speed: 40, ai: 'ranged', aggro: 160, r: 8, fly: true, shot: { speed: 150, count: 3, spread: 0.25, interval: 2.2 } },
  // ── 다락방 균열 (깊이에 맞춰 레벨이 오른다)
  { id: 'dustling', name: '먼지 뭉치', lv: 12, hp: 70, atk: 18, def: 2, exp: 20, gold: [8, 14], speed: 50, ai: 'hopper', aggro: 140, r: 9, mat: { id: 'dust', chance: 0.15 } },
  { id: 'shadow', name: '그림자 인형', lv: 13, hp: 140, atk: 24, def: 6, exp: 32, gold: [10, 18], speed: 52, ai: 'melee', aggro: 140, r: 10, reach: 26 },
  { id: 'eye', name: '단추 눈', lv: 13, hp: 80, atk: 21, def: 2, exp: 28, gold: [9, 16], speed: 40, ai: 'ranged', aggro: 170, r: 9, fly: true, shot: { speed: 150, count: 2, spread: 0.2, interval: 2 } },
  { id: 'dustknight', name: '먼지 기사', lv: 15, hp: 240, atk: 30, def: 11, exp: 50, gold: [14, 24], speed: 44, ai: 'charger', aggro: 150, r: 12, mat: { id: 'star', chance: 0.08 } },
  // ── 보스
  { id: 'b_bear', name: '태엽 곰 대장', lv: 14, hp: 3200, atk: 30, def: 10, exp: 900, gold: [300, 300], speed: 48, ai: 'boss', aggro: 999, r: 22, boss: 'bear' },
  { id: 'b_jelly', name: '젤리 여왕', lv: 16, hp: 4200, atk: 30, def: 8, exp: 1200, gold: [350, 350], speed: 40, ai: 'boss', aggro: 999, r: 24, boss: 'jelly' },
  { id: 'b_tin', name: '깡통 대장', lv: 18, hp: 5200, atk: 34, def: 14, exp: 1500, gold: [400, 400], speed: 40, ai: 'boss', aggro: 999, r: 22, boss: 'tin' },
  { id: 'b_dusty', name: '먼지 사도 더스티', lv: 20, hp: 7000, atk: 36, def: 12, exp: 2000, gold: [500, 500], speed: 60, ai: 'boss', aggro: 999, r: 18, boss: 'dusty' },
  { id: 'b_king', name: '먼지 왕', lv: 50, hp: 60000, atk: 70, def: 40, exp: 30000, gold: [5000, 5000], speed: 50, ai: 'boss', aggro: 999, r: 28, boss: 'king' },
];

export const MONSTERS: Record<string, MonsterDef> = Object.fromEntries(M.map((m) => [m.id, m]));

export interface Scaled {
  lv: number;
  hp: number;
  atk: number;
  def: number;
  exp: number;
  gold: [number, number];
}

/** 레벨 lv 로 맞춘 능력치 (정의보다 높으면 세지고, 낮으면 약해진다) */
export function scaleMonster(def: MonsterDef, lv: number): Scaled {
  const d = lv - def.lv;
  const hpK = Math.max(0.3, 1 + d * 0.2) * (d > 10 ? 1.03 ** (d - 10) : 1);
  return {
    lv,
    hp: Math.round(def.hp * hpK),
    atk: Math.round(def.atk * Math.max(0.4, 1 + d * 0.11)),
    def: Math.max(0, Math.round(def.def + d * 0.6)),
    exp: Math.round(def.exp * Math.max(0.3, 1 + d * 0.16)),
    gold: [Math.round(def.gold[0] * Math.max(0.5, 1 + d * 0.1)), Math.round(def.gold[1] * Math.max(0.5, 1 + d * 0.1))],
  };
}

/** 내 레벨보다 너무 낮은 몬스터는 경험치를 덜 준다 */
export function expFactor(playerLv: number, monsterLv: number): number {
  const gap = playerLv - monsterLv - 5;
  return gap <= 0 ? 1 : Math.max(0.1, 1 - gap * 0.12);
}
