/** 탐험대 만들기 · 경험치와 레벨 · 스킬 포인트 */
import { CLASSES, LV_MAX, PER_LEVEL, SKILLS, classSkills, expToNext } from './classes.ts';
import { ATTRS, type Attr, type HeroId, type Save } from './types.ts';

export const SAVE_VERSION = 2;

/** 레벨마다 저절로 오르는 능력치 (합 4) */
export const GROWTH: Record<HeroId, Record<Attr, number>> = {
  toby: { str: 3, vit: 1, dex: 0, int: 0 },
  bori: { str: 2, vit: 2, dex: 0, int: 0 },
  ruru: { str: 0, vit: 1, dex: 3, int: 0 },
  nabi: { str: 0, vit: 1, dex: 0, int: 3 },
};

/** 동료의 처음 스킬 (A 만 1레벨) */
export function startSkills(hero: HeroId): Record<string, number> {
  const skills: Record<string, number> = {};
  for (const s of classSkills(hero)) skills[s.id] = 0;
  skills[CLASSES[hero].skills[0]] = 1;
  return skills;
}

/** 새 탐험대 (처음엔 hero 혼자, 보통 토비) */
export function newSave(slot = 0, hero: HeroId = 'toby'): Save {
  const c = CLASSES[hero];
  return {
    version: SAVE_VERSION,
    slot,
    name: '코링코 탐험대',
    hero,
    party: [hero],
    bench: {},
    lv: 1,
    exp: 0,
    gold: 60,
    attrs: { ...c.base },
    skillPts: 0,
    difficulty: 'normal',
    skills: startSkills(hero),
    variants: {},
    hp: 1,
    sp: 50,
    weaponLv: 1,
    potions: { hp: 5 },
    parts: {},
    slots: [],
    mats: { fluff: 0, gear: 0, sugar: 0, dust: 0, star: 0 },
    friends: {},
    rescued: [],
    quests: {},
    flags: {},
    map: 'village',
    x: 0,
    y: 0,
    riftDepth: 1,
    riftBest: 0,
    kills: 0,
    playTime: 0,
  };
}

/** 경험치를 얻는다. 오른 레벨 수를 돌려준다. 쉬는 동료도 함께 자란다 */
export function gainExp(save: Save, amount: number): number {
  if (save.lv >= LV_MAX) return 0;
  save.exp += amount;
  let ups = 0;
  while (save.lv < LV_MAX && save.exp >= expToNext(save.lv)) {
    save.exp -= expToNext(save.lv);
    save.lv++;
    ups++;
    save.skillPts += PER_LEVEL.skillPts;
    for (const a of ATTRS) save.attrs[a] += GROWTH[save.hero][a];
    for (const [h, st] of Object.entries(save.bench) as [HeroId, NonNullable<Save['bench'][HeroId]>][]) {
      st.skillPts += PER_LEVEL.skillPts;
      for (const a of ATTRS) st.attrs[a] += GROWTH[h][a];
    }
  }
  if (save.lv >= LV_MAX) save.exp = 0;
  return ups;
}

export type LearnCheck = { ok: true } | { ok: false; reason: 'points' | 'level' | 'max' | 'unknown' };

export function canLearn(save: Save, skillId: string): LearnCheck {
  const s = SKILLS[skillId];
  if (!s || s.hero !== save.hero) return { ok: false, reason: 'unknown' };
  if ((save.skills[skillId] ?? 0) >= s.maxLv) return { ok: false, reason: 'max' };
  if (save.lv < s.req) return { ok: false, reason: 'level' };
  if (save.skillPts <= 0) return { ok: false, reason: 'points' };
  return { ok: true };
}

/** 스킬 포인트 하나로 스킬을 배우거나 레벨을 올린다 */
export function learn(save: Save, skillId: string): boolean {
  if (!canLearn(save, skillId).ok) return false;
  save.skillPts--;
  save.skills[skillId] = (save.skills[skillId] ?? 0) + 1;
  return true;
}

export function skillLv(save: Save, skillId: string): number {
  return save.skills[skillId] ?? 0;
}
