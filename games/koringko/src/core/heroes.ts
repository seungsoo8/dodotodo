import type { HeroId } from './types.ts';

/** 기본 공격 한 단계 (연속 공격은 이것을 차례로) */
export type AttackStep =
  | {
      kind: 'arc';
      damage: number;
      range: number;
      /** 부채꼴 각도 */
      arc: number;
      /** 다음 공격까지 */
      recover: number;
      knockback: number;
      /** 휘두르며 앞으로 나가는 거리 */
      lunge: number;
    }
  | {
      kind: 'shot';
      projectile: 'arrow' | 'orb';
      damage: number;
      speed: number;
      range: number;
      radius: number;
      recover: number;
      pierce: number;
      /** 터지는 반경 (구슬) */
      explode?: number;
      knockback: number;
    };

export interface HeroDef {
  id: HeroId;
  name: string;
  animal: string;
  /** 한 줄 소개 (캐릭터 고르기) */
  title: string;
  desc: string;
  color: string;
  maxHp: number;
  speed: number;
  radius: number;
  /** 받는 피해 감소 (0.15 = 15%) */
  armor: number;
  dash: { distance: number; time: number; charges: number; recharge: number; blink: boolean };
  combo: AttackStep[];
  skill: { name: string; desc: string; cooldown: number };
  ult: { name: string; desc: string };
  /** 해금 값 (단추). 0 이면 처음부터 */
  unlockCost: number;
}

export const HEROES: HeroDef[] = [
  {
    id: 'toby',
    name: '토비',
    animal: '토끼',
    title: '토끼 검사',
    desc: '빠른 세 번 베기. 겁은 없고 덜렁댄다',
    color: '#ff9ec7',
    maxHp: 100,
    speed: 125,
    radius: 9,
    armor: 0,
    dash: { distance: 72, time: 0.14, charges: 1, recharge: 0.55, blink: false },
    combo: [
      { kind: 'arc', damage: 10, range: 36, arc: 120, recover: 0.22, knockback: 70, lunge: 6 },
      { kind: 'arc', damage: 10, range: 36, arc: 120, recover: 0.22, knockback: 70, lunge: 6 },
      { kind: 'arc', damage: 20, range: 42, arc: 170, recover: 0.4, knockback: 170, lunge: 12 },
    ],
    skill: { name: '회전 베기', desc: '빙글 돌며 주변을 모두 벤다', cooldown: 5 },
    ult: { name: '달토끼 난무', desc: '가까운 적 여섯을 순식간에 베고 다닌다' },
    unlockCost: 0,
  },
  {
    id: 'bori',
    name: '보리',
    animal: '곰',
    title: '곰 도끼잡이',
    desc: '느리지만 한 방이 크다. 잘 버틴다',
    color: '#c88a54',
    maxHp: 140,
    speed: 105,
    radius: 11,
    armor: 0.15,
    dash: { distance: 58, time: 0.18, charges: 1, recharge: 0.85, blink: false },
    combo: [
      { kind: 'arc', damage: 24, range: 42, arc: 150, recover: 0.5, knockback: 140, lunge: 4 },
      { kind: 'arc', damage: 36, range: 46, arc: 210, recover: 0.7, knockback: 240, lunge: 8 },
    ],
    skill: { name: '땅 내려찍기', desc: '앞을 크게 내려찍어 적을 기절시킨다', cooldown: 7 },
    ult: { name: '곰의 분노', desc: '6초 동안 더 세고 빠르고 단단해진다' },
    unlockCost: 40,
  },
  {
    id: 'ruru',
    name: '루루',
    animal: '여우',
    title: '여우 궁수',
    desc: '멀리서 쏜다. 구르기가 길다',
    color: '#ff9a3c',
    maxHp: 85,
    speed: 130,
    radius: 9,
    armor: 0,
    dash: { distance: 92, time: 0.17, charges: 2, recharge: 0.8, blink: false },
    combo: [{ kind: 'shot', projectile: 'arrow', damage: 9, speed: 380, range: 280, radius: 4, recover: 0.27, pierce: 0, knockback: 40 }],
    skill: { name: '부채 화살', desc: '화살 다섯 대를 부채꼴로 쏜다', cooldown: 4 },
    ult: { name: '화살비', desc: '조준한 곳에 화살비를 퍼붓는다' },
    unlockCost: 60,
  },
  {
    id: 'nabi',
    name: '나비',
    animal: '고양이',
    title: '고양이 마법사',
    desc: '터지는 마법 구슬. 대시는 순간이동',
    color: '#b48cff',
    maxHp: 80,
    speed: 118,
    radius: 9,
    armor: 0,
    dash: { distance: 85, time: 0, charges: 1, recharge: 0.9, blink: true },
    combo: [{ kind: 'shot', projectile: 'orb', damage: 12, speed: 230, range: 240, radius: 6, recover: 0.45, pierce: 0, explode: 26, knockback: 60 }],
    skill: { name: '얼음 장판', desc: '조준한 곳을 얼려 적을 느리게 하고 계속 아프게 한다', cooldown: 7 },
    ult: { name: '유성우', desc: '별똥별 여덟 개가 적에게 떨어진다' },
    unlockCost: 80,
  },
];

export function findHero(id: HeroId): HeroDef {
  return HEROES.find((h) => h.id === id)!;
}

/** 기술 · 궁극기 수치 */
export const SKILL = {
  spin: { range: 54, damage: 26, knockback: 180 },
  slam: { forward: 30, radius: 70, damage: 40, stun: 1, delay: 0.12 },
  fan: { count: 5, spread: 60, damage: 12, pierce: 1 },
  frost: { reach: 170, radius: 60, life: 3, tick: 0.5, damage: 6, slow: 0.5 },
};

export const ULT = {
  /** 달토끼 난무 */
  dance: { strikes: 6, damage: 40, range: 260, iframes: 1 },
  /** 곰의 분노 */
  rage: { seconds: 6, damageMul: 1.6, speedMul: 0.6, takenMul: 0.5, shockRadius: 80, shockDamage: 30 },
  /** 화살비 */
  rain: { reach: 220, radius: 90, life: 2, tick: 0.2, damage: 10 },
  /** 유성우 */
  meteor: { count: 8, radius: 40, damage: 45, delayMin: 0.35, delayMax: 1.2 },
};
