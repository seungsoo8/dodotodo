/** 코링코 탐험대 네 인형: 능력치 · 기본 공격 · 스킬 */
import type { Attr, HeroId } from './types.ts';

export type WeaponType = 'sword' | 'axe' | 'bow' | 'staff';

/** 기본 공격 한 단계 */
export type BasicStep =
  | { kind: 'melee'; mult: number; reach: number; arc: number; time: number; knock: number }
  | { kind: 'shot'; mult: number; projectile: 'arrow' | 'orb'; speed: number; range: number; time: number; explode?: number; knock: number };

export interface ClassDef {
  id: HeroId;
  name: string;
  title: string;
  animal: string;
  role: string;
  desc: string;
  color: string;
  weapon: WeaponType;
  /** 공격력을 올리는 주 능력치 */
  main: Attr;
  base: Record<Attr, number>;
  hpBase: number;
  hpPerLv: number;
  /** 이동 속도 (픽셀/초) */
  speed: number;
  /** 기본 공격 (차례로 이어진다) */
  combo: BasicStep[];
  /** A S D F 스킬과 패시브 */
  skills: string[];
}

export const CLASSES: Record<HeroId, ClassDef> = {
  toby: {
    id: 'toby',
    name: '토비',
    title: '토끼 검사',
    animal: '토끼',
    role: '근접 · 연속 공격',
    desc: '솜털 귀의 용감한 검사. 빠른 세 번 베기와 돌진으로 적진을 휘젓는다.',
    color: '#ff9ec7',
    weapon: 'sword',
    main: 'str',
    base: { str: 8, vit: 7, dex: 6, int: 3 },
    hpBase: 120,
    hpPerLv: 14,
    speed: 92,
    combo: [
      { kind: 'melee', mult: 1, reach: 34, arc: 120, time: 0.28, knock: 70 },
      { kind: 'melee', mult: 1.05, reach: 34, arc: 120, time: 0.28, knock: 70 },
      { kind: 'melee', mult: 1.6, reach: 40, arc: 170, time: 0.42, knock: 170 },
    ],
    skills: ['t_rush', 't_spin', 't_leap', 't_dance', 't_pass'],
  },
  bori: {
    id: 'bori',
    name: '보리',
    title: '곰 도끼잡이',
    animal: '곰',
    role: '근접 · 광역 · 방어',
    desc: '느긋하지만 든든한 곰. 큰 도끼로 넓게 휘두르고 잘 버틴다.',
    color: '#c88a54',
    weapon: 'axe',
    main: 'str',
    base: { str: 9, vit: 9, dex: 3, int: 3 },
    hpBase: 150,
    hpPerLv: 18,
    speed: 82,
    combo: [
      { kind: 'melee', mult: 1.4, reach: 40, arc: 160, time: 0.5, knock: 140 },
      { kind: 'melee', mult: 1.9, reach: 44, arc: 220, time: 0.65, knock: 230 },
    ],
    skills: ['b_slam', 'b_roar', 'b_axe', 'b_rage', 'b_pass'],
  },
  ruru: {
    id: 'ruru',
    name: '루루',
    title: '여우 궁수',
    animal: '여우',
    role: '원거리 · 물리',
    desc: '똑똑하고 새침한 여우. 멀리서 화살비를 퍼붓는다.',
    color: '#ff9a3c',
    weapon: 'bow',
    main: 'dex',
    base: { str: 4, vit: 6, dex: 10, int: 4 },
    hpBase: 105,
    hpPerLv: 12,
    speed: 96,
    combo: [{ kind: 'shot', mult: 1.25, projectile: 'arrow', speed: 330, range: 230, time: 0.36, knock: 40 }],
    skills: ['r_fan', 'r_rain', 'r_bomb', 'r_hunt', 'r_pass'],
  },
  nabi: {
    id: 'nabi',
    name: '나비',
    title: '고양이 마법사',
    animal: '고양이',
    role: '원거리 · 원소',
    desc: '늘 졸린 천재 고양이. 불·얼음·번개를 다룬다.',
    color: '#b48cff',
    weapon: 'staff',
    main: 'int',
    base: { str: 3, vit: 5, dex: 5, int: 11 },
    hpBase: 95,
    hpPerLv: 11,
    speed: 88,
    combo: [{ kind: 'shot', mult: 1.3, projectile: 'orb', speed: 220, range: 210, time: 0.45, explode: 22, knock: 60 }],
    skills: ['n_fire', 'n_frost', 'n_chain', 'n_meteor', 'n_pass'],
  },
};

export const HERO_ORDER: HeroId[] = ['toby', 'bori', 'ruru', 'nabi'];

export type SkillKey = 'A' | 'S' | 'D' | 'F' | 'P';

export interface SkillDef {
  id: string;
  hero: HeroId;
  key: SkillKey;
  name: string;
  /** 배울 수 있는 레벨 */
  req: number;
  maxLv: number;
  /** SP 소모 */
  sp: number;
  /** 재사용 대기 (초) */
  cd: number;
  /** 레벨별 피해 배율 (공격력 ×) */
  mult: (lv: number) => number;
  desc: (lv: number) => string;
}

const lin = (a: number, b: number) => (lv: number) => a + b * (lv - 1);
const pct = (x: number) => `${Math.round(x * 100)}%`;

const S: SkillDef[] = [
  // ───── 토비
  { id: 't_rush', hero: 'toby', key: 'A', name: '돌진 베기', req: 1, maxLv: 10, sp: 6, cd: 3, mult: lin(1.8, 0.18), desc: (l) => `앞으로 돌진하며 길 위의 적을 벤다 (공격력의 ${pct(lin(1.8, 0.18)(l))})` },
  { id: 't_spin', hero: 'toby', key: 'S', name: '회전 베기', req: 3, maxLv: 10, sp: 10, cd: 5, mult: lin(2.2, 0.22), desc: (l) => `빙글 돌며 주변을 모두 벤다 (${pct(lin(2.2, 0.22)(l))})` },
  { id: 't_leap', hero: 'toby', key: 'D', name: '토끼 도약', req: 6, maxLv: 10, sp: 14, cd: 8, mult: lin(3, 0.3), desc: (l) => `높이 뛰어 내려찍고 잠깐 기절시킨다 (${pct(lin(3, 0.3)(l))})` },
  { id: 't_dance', hero: 'toby', key: 'F', name: '달토끼 난무', req: 12, maxLv: 5, sp: 30, cd: 40, mult: lin(2.5, 0.5), desc: (l) => `가까운 적들 사이를 순식간에 베고 다닌다 (8번 × ${pct(lin(2.5, 0.5)(l))})` },
  { id: 't_pass', hero: 'toby', key: 'P', name: '날렵한 발', req: 1, maxLv: 10, sp: 0, cd: 0, mult: () => 0, desc: (l) => `치명타 +${l}%, 공격 속도 +${l * 2}%` },
  // ───── 보리
  { id: 'b_slam', hero: 'bori', key: 'A', name: '땅 내려찍기', req: 1, maxLv: 10, sp: 8, cd: 4, mult: lin(2.2, 0.22), desc: (l) => `앞을 내려찍어 기절시킨다 (${pct(lin(2.2, 0.22)(l))})` },
  { id: 'b_roar', hero: 'bori', key: 'S', name: '곰의 포효', req: 3, maxLv: 10, sp: 12, cd: 10, mult: lin(1, 0.1), desc: (l) => `주변을 밀쳐내고 8초 동안 방어력 +${20 + l * 4}% (${pct(lin(1, 0.1)(l))})` },
  { id: 'b_axe', hero: 'bori', key: 'D', name: '도끼 던지기', req: 6, maxLv: 10, sp: 14, cd: 6, mult: lin(1.8, 0.2), desc: (l) => `도끼가 빙글빙글 날아갔다 돌아온다 (닿을 때마다 ${pct(lin(1.8, 0.2)(l))})` },
  { id: 'b_rage', hero: 'bori', key: 'F', name: '곰의 분노', req: 12, maxLv: 5, sp: 30, cd: 45, mult: lin(3, 0.5), desc: (l) => `땅을 울리고 10초 동안 공격력 +${30 + l * 6}%, 공격 속도 +30% (${pct(lin(3, 0.5)(l))})` },
  { id: 'b_pass', hero: 'bori', key: 'P', name: '두꺼운 털', req: 1, maxLv: 10, sp: 0, cd: 0, mult: () => 0, desc: (l) => `최대 HP +${l * 3}%, 방어력 +${l * 4}%` },
  // ───── 루루
  { id: 'r_fan', hero: 'ruru', key: 'A', name: '부채 화살', req: 1, maxLv: 10, sp: 6, cd: 3, mult: lin(1.1, 0.1), desc: (l) => `화살 다섯 대를 부채꼴로 쏜다 (각 ${pct(lin(1.1, 0.1)(l))})` },
  { id: 'r_rain', hero: 'ruru', key: 'S', name: '화살비', req: 3, maxLv: 10, sp: 12, cd: 7, mult: lin(0.6, 0.06), desc: (l) => `앞쪽에 2초 동안 화살비 (10번 × ${pct(lin(0.6, 0.06)(l))})` },
  { id: 'r_bomb', hero: 'ruru', key: 'D', name: '폭탄 화살', req: 6, maxLv: 10, sp: 14, cd: 6, mult: lin(2.8, 0.28), desc: (l) => `맞으면 크게 터지는 화살 (${pct(lin(2.8, 0.28)(l))})` },
  { id: 'r_hunt', hero: 'ruru', key: 'F', name: '별사냥', req: 12, maxLv: 5, sp: 30, cd: 40, mult: lin(1, 0.2), desc: (l) => `3초 동안 가까운 적에게 화살을 마구 쏜다 (24발 × ${pct(lin(1, 0.2)(l))})` },
  { id: 'r_pass', hero: 'ruru', key: 'P', name: '매의 눈', req: 1, maxLv: 10, sp: 0, cd: 0, mult: () => 0, desc: (l) => `치명 피해 +${l * 6}%, 화살 사거리 +${l * 3}%` },
  // ───── 나비
  { id: 'n_fire', hero: 'nabi', key: 'A', name: '불꽃 구슬', req: 1, maxLv: 10, sp: 7, cd: 3, mult: lin(2, 0.2), desc: (l) => `크게 터지고 3초 동안 불태운다 (${pct(lin(2, 0.2)(l))})` },
  { id: 'n_frost', hero: 'nabi', key: 'S', name: '얼음 장판', req: 3, maxLv: 10, sp: 12, cd: 8, mult: lin(0.5, 0.05), desc: (l) => `4초 동안 바닥을 얼려 적을 느리게 하고 아프게 한다 (0.5초마다 ${pct(lin(0.5, 0.05)(l))})` },
  { id: 'n_chain', hero: 'nabi', key: 'D', name: '번개 사슬', req: 6, maxLv: 10, sp: 14, cd: 5, mult: lin(1.6, 0.16), desc: (l) => `적 사이를 다섯 번 튀는 번개 (${pct(lin(1.6, 0.16)(l))})` },
  { id: 'n_meteor', hero: 'nabi', key: 'F', name: '유성우', req: 12, maxLv: 5, sp: 34, cd: 45, mult: lin(3, 0.6), desc: (l) => `별똥별 열 개가 적에게 떨어진다 (각 ${pct(lin(3, 0.6)(l))})` },
  { id: 'n_pass', hero: 'nabi', key: 'P', name: '마력 순환', req: 1, maxLv: 10, sp: 0, cd: 0, mult: () => 0, desc: (l) => `스킬 피해 +${l * 4}%, SP 회복 +${l * 10}%` },
];

export const SKILLS: Record<string, SkillDef> = Object.fromEntries(S.map((s) => [s.id, s]));

export function classSkills(hero: HeroId): SkillDef[] {
  return CLASSES[hero].skills.map((id) => SKILLS[id]);
}

/** A S D F 키 → 스킬 */
export function skillForKey(hero: HeroId, key: SkillKey): SkillDef | undefined {
  return classSkills(hero).find((s) => s.key === key);
}

/** 레벨 1 → 2 에 필요한 경험치부터. 50 레벨이 끝 */
export const LV_MAX = 50;

export function expToNext(lv: number): number {
  if (lv >= LV_MAX) return Infinity;
  return Math.round(24 * lv ** 1.75 + 16);
}

/** 레벨이 오를 때마다 받는 능력치 · 스킬 포인트 */
export const PER_LEVEL = { skillPts: 1 };
