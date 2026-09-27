import type { WeaponType } from './types.ts';

export type HeroId = 'guardian' | 'archer' | 'mage' | 'fortress' | 'gambler';

/** 탑 고유 능력. 없는 값은 효과 없음 */
export interface HeroPassive {
  maxHp?: number;
  armor?: number;
  thorns?: number;
  crit?: number;
  /** 면마다 무기 칸 증감 */
  faceSlots?: number;
  /** 라운드가 시작될 때 최대 체력의 이 비율만큼 회복 */
  roundHealPct?: number;
  /** 무기가 없는 면으로 들어온 적에게 받는 피해 배율 */
  emptyFaceDamage?: number;
  /** 계열별 부채꼴 각도(°) */
  typeArc?: Partial<Record<WeaponType, number>>;
  /** 계열별 피해 보너스 (0.3 = +30%) */
  typeDamage?: Partial<Record<WeaponType, number>>;
  /** 계열별 사거리 추가 */
  typeRange?: Partial<Record<WeaponType, number>>;
  /** 연쇄 추가 횟수 */
  chainJumps?: number;
  /** 스킬 재사용 대기 배율 */
  skillCooldownMul?: number;
  /** 리롤 비용 배율 */
  rerollMul?: number;
  /** 카오스 피해 상한 배율 */
  chaosMax?: number;
}

export interface HeroDef {
  id: HeroId;
  name: string;
  /** 고유 능력 설명 */
  desc: string;
  /** 고를 때·이길 때·질 때 하는 말 */
  quote: string;
  winLine: string;
  loseLine: string;
  /** 탑 꼭대기 구슬·깃발 색 */
  color: string;
  startWeapons: string[];
  passive: HeroPassive;
}

export const HEROES: HeroDef[] = [
  {
    id: 'guardian',
    name: '수호탑',
    desc: '체력 +200 · 라운드마다 10% 회복 · 빈 면으로 받는 피해 -40%',
    quote: '내 뒤로는 한 놈도 못 지나간다!',
    winLine: '봤지? 이 벽은 안 무너져.',
    loseLine: '…벽돌 좀 더 쌓고 올게.',
    color: '#ffd166',
    startWeapons: ['sling'],
    passive: { maxHp: 200, roundHealPct: 0.1, emptyFaceDamage: 0.6 },
  },
  {
    id: 'archer',
    name: '궁수탑',
    desc: '관통 무기 피해 +30% · 관통 사거리 +30',
    quote: '줄 서. 한 번에 꿰어 줄게.',
    winLine: '한 줄로 서 준 덕분이야.',
    loseLine: '화살통이 비었네.',
    color: '#7bd88f',
    startWeapons: ['longbow'],
    passive: { typeDamage: { pierce: 0.3 }, typeRange: { pierce: 30 } },
  },
  {
    id: 'mage',
    name: '마법탑',
    desc: '마법 무기 150° · 마법 피해 +20% · 연쇄 +1회 · 스킬 대기 -25%',
    quote: '찌릿한 거 좋아해?',
    winLine: '마나가 조금 남았네. 아깝다.',
    loseLine: '주문 외우다 혀 깨물었어.',
    color: '#6fb7ff',
    startWeapons: ['chain_bolt'],
    passive: { typeDamage: { magic: 0.2 }, typeArc: { magic: 150 }, chainJumps: 1, skillCooldownMul: 0.75 },
  },
  {
    id: 'fortress',
    name: '요새',
    desc: '체력+300 · 방어+6 · 가시 20 · 공성+20% · 면마다 칸 -1',
    quote: '느려도 돼. 안 무너지니까.',
    winLine: '포격, 끝. 먼지 털고 쉬자.',
    loseLine: '…보수 공사 좀 해야겠다.',
    color: '#ff9d4d',
    startWeapons: ['mortar'],
    passive: { maxHp: 300, armor: 6, thorns: 20, faceSlots: -1, typeDamage: { siege: 0.2 } },
  },
  {
    id: 'gambler',
    name: '도박탑',
    desc: '치명타 +10% · 카오스 피해 최대 300% · 리롤 반값',
    quote: '오늘 느낌 좋은데? 다 걸어!',
    winLine: '봐, 된다고 했지!',
    loseLine: '…판돈이 너무 컸나.',
    color: '#c77dff',
    startWeapons: ['chaos_orb'],
    passive: { crit: 0.1, chaosMax: 1.5, rerollMul: 0.5 },
  },
];

export function findHero(id: HeroId): HeroDef {
  const h = HEROES.find((x) => x.id === id);
  if (!h) throw new Error(`알 수 없는 탑: ${id}`);
  return h;
}

const NONE: HeroPassive = {};

/** 탑을 고르지 않은 판은 고유 능력이 없다 */
export function heroPassive(hero: HeroId | null): HeroPassive {
  return hero ? findHero(hero).passive : NONE;
}
