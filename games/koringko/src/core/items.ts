/** 장비: 부위 · 등급 · 추가 능력 · 전설 고유 능력 · 이름 · 값 */
import { CLASSES, type WeaponType } from './classes.ts';
import type { Rng } from './rng.ts';
import { RARITIES, SLOTS, type Affix, type AffixId, type HeroId, type Item, type Rarity, type Slot } from './types.ts';

export const SLOT_NAME: Record<Slot, string> = { weapon: '무기', hat: '모자', armor: '옷', gloves: '장갑', shoes: '신발', ring: '반지', necklace: '목걸이' };

export const RARITY: Record<Rarity, { name: string; color: string; affixes: [number, number]; roll: number; value: number }> = {
  normal: { name: '일반', color: '#e6e2d6', affixes: [0, 0], roll: 1, value: 1 },
  magic: { name: '매직', color: '#6fb2ff', affixes: [1, 2], roll: 1, value: 2.5 },
  rare: { name: '레어', color: '#ffd84a', affixes: [3, 4], roll: 1.1, value: 6 },
  unique: { name: '유니크', color: '#d68cff', affixes: [4, 4], roll: 1.3, value: 14 },
  legendary: { name: '전설', color: '#ff9a3a', affixes: [5, 5], roll: 1.45, value: 26 },
};

/** 8단계 이름 (아이템 레벨 6마다 한 단계) */
const WEAPON_NAMES: Record<WeaponType, string[]> = {
  sword: ['나무 칼', '단추 검', '바늘 검', '은빛 바늘검', '별 바늘검', '무지개 검', '꿈결의 검', '코링코 성검'],
  axe: ['장난감 도끼', '블록 도끼', '태엽 도끼', '쇠망치 도끼', '별 도끼', '무지개 도끼', '꿈결의 도끼', '코링코 대도끼'],
  bow: ['고무줄 활', '대나무 활', '리본 활', '은실 활', '별 활', '무지개 활', '꿈결의 활', '코링코 장궁'],
  staff: ['막대사탕 지팡이', '크레파스 지팡이', '별사탕 지팡이', '달빛 지팡이', '별빛 지팡이', '무지개 지팡이', '꿈결의 지팡이', '코링코 홀'],
};
const ARMOR_NAMES: Record<Exclude<Slot, 'weapon'>, string[]> = {
  hat: ['종이 모자', '털실 모자', '단추 투구', '골무 투구', '별 모자', '무지개 모자', '꿈결의 왕관', '코링코 왕관'],
  armor: ['헝겊 옷', '솜 조끼', '단추 갑옷', '골무 갑옷', '별 망토', '무지개 갑옷', '꿈결의 갑옷', '코링코 예복'],
  gloves: ['털장갑', '고무장갑', '단추 장갑', '골무 장갑', '별 장갑', '무지개 장갑', '꿈결의 장갑', '코링코 손싸개'],
  shoes: ['양말', '고무신', '단추 장화', '태엽 장화', '별 장화', '무지개 장화', '꿈결의 장화', '코링코 날개신'],
  ring: ['단추 반지', '구슬 반지', '태엽 반지', '은방울 반지', '별 반지', '무지개 반지', '꿈결의 반지', '코링코 반지'],
  necklace: ['실 목걸이', '구슬 목걸이', '방울 목걸이', '은단추 목걸이', '별 목걸이', '무지개 목걸이', '꿈결의 목걸이', '코링코 목걸이'],
};

/** 무기 종류: 공격 속도와 피해 배율 */
export const WEAPON_TYPES: Record<WeaponType, { spd: number; dmg: number }> = {
  sword: { spd: 1, dmg: 1 },
  axe: { spd: 0.86, dmg: 1.4 },
  bow: { spd: 1, dmg: 0.95 },
  staff: { spd: 0.92, dmg: 1.12 },
};

const ARMOR_DEF: Partial<Record<Slot, number>> = { armor: 1, hat: 0.6, gloves: 0.45, shoes: 0.45 };

const ALL: Slot[] = SLOTS;
/** 추가 능력: 붙는 부위 · 값 범위 (아이템 레벨이 오를수록 커진다) · 최소 등급 */
export const AFFIX_RULES: Record<AffixId, { name: string; slots: Slot[]; range: [number, number]; scale: number; min?: Rarity; unit?: string; decimals?: number }> = {
  atk: { name: '공격력', slots: ['weapon', 'gloves', 'ring', 'necklace'], range: [1, 3], scale: 0.25 },
  atkp: { name: '공격력', slots: ['weapon', 'gloves', 'necklace'], range: [3, 8], scale: 0.04, unit: '%' },
  def: { name: '방어력', slots: ['hat', 'armor', 'gloves', 'shoes', 'ring'], range: [2, 5], scale: 0.3 },
  hp: { name: '최대 HP', slots: ALL, range: [8, 18], scale: 0.3 },
  sp: { name: '최대 SP', slots: ['hat', 'ring', 'necklace', 'weapon'], range: [4, 9], scale: 0.12 },
  str: { name: '힘', slots: ALL, range: [1, 3], scale: 0.1 },
  vit: { name: '체력', slots: ALL, range: [1, 3], scale: 0.1 },
  dex: { name: '민첩', slots: ALL, range: [1, 3], scale: 0.1 },
  int: { name: '지혜', slots: ALL, range: [1, 3], scale: 0.1 },
  crit: { name: '치명타', slots: ['weapon', 'gloves', 'ring', 'necklace', 'hat'], range: [1, 3], scale: 0.03, unit: '%' },
  critd: { name: '치명 피해', slots: ['weapon', 'gloves', 'necklace'], range: [5, 12], scale: 0.1, unit: '%' },
  aspd: { name: '공격 속도', slots: ['weapon', 'gloves', 'ring'], range: [3, 7], scale: 0.03, unit: '%' },
  ms: { name: '이동 속도', slots: ['shoes', 'necklace'], range: [3, 7], scale: 0.02, unit: '%' },
  skill: { name: '스킬 피해', slots: ['weapon', 'hat', 'necklace', 'ring'], range: [4, 9], scale: 0.06, unit: '%' },
  regen: { name: 'HP 재생', slots: ['armor', 'hat', 'ring', 'necklace'], range: [0.3, 0.8], scale: 0.03, unit: '/초', decimals: 1 },
  leech: { name: '생명 흡수', slots: ['weapon', 'ring'], range: [1, 2], scale: 0.02, unit: '%', min: 'rare', decimals: 1 },
  gold: { name: '골드 획득', slots: ['ring', 'necklace', 'gloves', 'shoes'], range: [6, 14], scale: 0.1, unit: '%' },
  cdr: { name: '재사용 대기 감소', slots: ['hat', 'necklace', 'weapon'], range: [2, 4], scale: 0.02, unit: '%', min: 'rare' },
};

/** 전설 고유 능력 */
export const POWERS: Record<string, { name: string; desc: string }> = {
  thunder: { name: '번개 단추', desc: '기본 공격이 맞으면 20% 확률로 번개가 떨어진다 (공격력의 120%)' },
  vampire: { name: '흡혈 실밥', desc: '적을 쓰러뜨리면 최대 HP 의 3% 회복' },
  swift: { name: '질풍 태엽', desc: '구르고 나면 2초 동안 공격 속도 +40%' },
  giant: { name: '거인의 솜', desc: '기본 공격 범위 +30%' },
  phoenix: { name: '불사조 깃털', desc: '쓰러질 때 HP 50% 로 일어선다 (2분에 한 번)' },
  star: { name: '별의 축복', desc: '스킬을 쓰면 25% 확률로 SP 를 돌려받는다' },
  shockwave: { name: '충격파 태엽', desc: '구르기가 끝나면 주변을 터뜨린다 (공격력의 150%)' },
  chill: { name: '서리 발톱', desc: '기본 공격이 적을 1.5초 동안 30% 느리게 한다' },
  thorns: { name: '가시 솜', desc: '몬스터에게 맞으면 그 몬스터에게 공격력의 200% 피해' },
  frenzy: { name: '광란의 단추', desc: '적을 쓰러뜨리면 3초 동안 공격 속도 +25%' },
  orbit: { name: '별 위성', desc: '별 두 개가 주인공 둘레를 돌며 닿는 적을 친다 (공격력의 60%)' },
};

const MAGIC_PREFIX: Partial<Record<AffixId, string>> = {
  atk: '날카로운',
  atkp: '사나운',
  def: '튼튼한',
  hp: '포근한',
  sp: '반짝이는',
  str: '힘센',
  vit: '든든한',
  dex: '재빠른',
  int: '영리한',
  crit: '예리한',
  critd: '무시무시한',
  aspd: '날쌘',
  ms: '가벼운',
  skill: '신비한',
  regen: '따스한',
  gold: '행운의',
};
const RARE_WORDS = ['폭풍', '달빛', '새벽', '꿀벌', '무지개', '천둥', '솜사탕', '은하수', '불꽃', '이슬', '종소리', '마시멜로'];
const RARE_TAILS = ['의 노래', '의 약속', '의 비밀', '의 꿈', '의 수호', '의 메아리'];
const UNIQUE_OWNERS = ['곰돌이 대장', '태엽 할머니', '토끼 기사단', '여우 사냥꾼', '고양이 현자', '헝겊 공주', '단추 왕', '별지기'];

export function itemTier(ilvl: number): number {
  return Math.max(0, Math.min(7, Math.floor((ilvl - 1) / 6)));
}

export function baseName(slot: Slot, ilvl: number, hero?: HeroId): string {
  const t = itemTier(ilvl);
  if (slot === 'weapon') return WEAPON_NAMES[CLASSES[hero ?? 'toby'].weapon][t];
  return ARMOR_NAMES[slot][t];
}

/** 등급 굴리기. luck 1 이면 레어 이상이 대략 두 배 */
export function rollRarity(rng: Rng, luck = 0): Rarity {
  const w = { normal: 62, magic: 27, rare: 8.5 * (1 + luck), unique: 2 * (1 + luck), legendary: 0.5 * (1 + luck) };
  const total = RARITIES.reduce((s, r) => s + w[r], 0);
  let x = rng.next() * total;
  for (const r of [...RARITIES].reverse()) {
    if (x < w[r]) return r;
    x -= w[r];
  }
  return 'normal';
}

function rollAffix(rng: Rng, id: AffixId, ilvl: number, rarity: Rarity): Affix {
  const rule = AFFIX_RULES[id];
  const [lo, hi] = rule.range;
  const v = (lo + rng.next() * (hi - lo)) * (1 + ilvl * rule.scale) * RARITY[rarity].roll;
  const p = 10 ** (rule.decimals ?? 0);
  return { id, v: Math.max(1 / p, Math.round(v * p) / p) };
}

export interface MakeOptions {
  ilvl: number;
  uid: string;
  hero: HeroId;
  slot?: Slot;
  rarity?: Rarity;
  luck?: number;
}

export function makeItem(rng: Rng, o: MakeOptions): Item {
  const slot = o.slot ?? SLOTS[rng.int(SLOTS.length)];
  const rarity = o.rarity ?? rollRarity(rng, o.luck ?? 0);
  const ilvl = Math.max(1, Math.round(o.ilvl));
  const it: Item = { uid: o.uid, slot, name: '', rarity, ilvl, req: Math.max(1, rarity === 'normal' || rarity === 'magic' ? ilvl - 2 : ilvl - 1), affixes: [], plus: 0 };
  const rankMul = rarity === 'normal' ? 1 : rarity === 'magic' ? 1.05 : 1.12;
  if (slot === 'weapon') {
    const wt = WEAPON_TYPES[CLASSES[o.hero].weapon];
    const base = (4 + ilvl * 2.1) * wt.dmg * rankMul;
    const spread = 0.25 + rng.next() * 0.15;
    it.dmg = [Math.max(1, Math.round(base * (1 - spread / 2))), Math.max(2, Math.round(base * (1 + spread / 2)))];
    it.spd = wt.spd;
    it.hero = o.hero;
  } else if (ARMOR_DEF[slot]) {
    it.def = Math.max(1, Math.round((2 + ilvl * 1.1) * ARMOR_DEF[slot]! * rankMul));
  }
  // 추가 능력
  const [lo, hi] = RARITY[rarity].affixes;
  let n = lo + rng.int(hi - lo + 1);
  if ((slot === 'ring' || slot === 'necklace') && n === 0) n = 1;
  const order = RARITIES.indexOf(rarity);
  const pool = (Object.keys(AFFIX_RULES) as AffixId[]).filter((id) => {
    const r = AFFIX_RULES[id];
    return r.slots.includes(slot) && RARITIES.indexOf(r.min ?? 'normal') <= order;
  });
  for (let i = 0; i < n && pool.length; i++) {
    const id = pool.splice(rng.int(pool.length), 1)[0];
    it.affixes.push(rollAffix(rng, id, ilvl, rarity));
  }
  if (rarity === 'legendary') {
    const powers = Object.keys(POWERS);
    it.power = powers[rng.int(powers.length)];
  }
  it.name = itemName(rng, it, o.hero);
  return it;
}

function itemName(rng: Rng, it: Item, hero: HeroId): string {
  const base = baseName(it.slot, it.ilvl, hero);
  switch (it.rarity) {
    case 'normal':
      return base;
    case 'magic': {
      const first = it.affixes[0];
      const prefix = first ? MAGIC_PREFIX[first.id] : undefined;
      return prefix ? `${prefix} ${base}` : base;
    }
    case 'rare':
      return `${RARE_WORDS[rng.int(RARE_WORDS.length)]}${RARE_TAILS[rng.int(RARE_TAILS.length)]} ${base}`;
    case 'unique':
      return `${UNIQUE_OWNERS[rng.int(UNIQUE_OWNERS.length)]}의 ${base}`;
    case 'legendary':
      return `${POWERS[it.power!].name} · ${base}`;
  }
}

/** 상점에 팔 때 받는 값 */
export function itemValue(it: Item): number {
  return Math.round((6 + it.ilvl * 4) * RARITY[it.rarity].value * (1 + it.plus * 0.3));
}

export function affixText(a: Affix): string {
  const r = AFFIX_RULES[a.id];
  return `${r.name} +${a.v}${r.unit ?? ''}`;
}
