/** 캐릭터 만들기 · 경험치와 레벨 · 능력치/스킬 포인트 */
import { CLASSES, LV_MAX, PER_LEVEL, SKILLS, classSkills, expToNext } from './classes.ts';
import { makeItem } from './items.ts';
import { createRng } from './rng.ts';
import type { Attr, HeroId, Item, Save } from './types.ts';

export const SAVE_VERSION = 1;

export function newSave(hero: HeroId, name: string, slot = 0): Save {
  const c = CLASSES[hero];
  const skills: Record<string, number> = {};
  for (const s of classSkills(hero)) skills[s.id] = 0;
  // 첫 스킬(A)은 처음부터 1레벨
  skills[c.skills[0]] = 1;
  const save: Save = {
    version: SAVE_VERSION,
    slot,
    name,
    hero,
    lv: 1,
    exp: 0,
    gold: 80,
    attrs: { ...c.base },
    statPts: 0,
    skillPts: 0,
    skills,
    hp: 1,
    sp: 1,
    potions: { hp: 5, sp: 3 },
    bag: [],
    gear: { weapon: starterWeapon(hero, slot) },
    mats: { fluff: 0, gear: 0, sugar: 0, dust: 0, star: 0 },
    quests: {},
    flags: {},
    map: 'village',
    x: 0,
    y: 0,
    riftDepth: 1,
    riftBest: 0,
    kills: 0,
    playTime: 0,
    nextUid: 1,
  };
  return save;
}

/** 처음 드는 무기: 직업에 맞는 1레벨 일반 무기 */
export function starterWeapon(hero: HeroId, slot = 0): Item {
  return makeItem(createRng(1), { ilvl: 1, slot: 'weapon', rarity: 'normal', hero, uid: `${slot}-0` });
}

/** 경험치를 얻는다. 오른 레벨 수를 돌려준다 (레벨이 오르면 포인트를 받고 다 회복) */
export function gainExp(save: Save, amount: number): number {
  if (save.lv >= LV_MAX) return 0;
  save.exp += amount;
  let ups = 0;
  while (save.lv < LV_MAX && save.exp >= expToNext(save.lv)) {
    save.exp -= expToNext(save.lv);
    save.lv++;
    ups++;
    save.statPts += PER_LEVEL.statPts;
    save.skillPts += PER_LEVEL.skillPts;
    // 주 능력치는 레벨마다 저절로 1 오른다
    save.attrs[CLASSES[save.hero].main]++;
  }
  if (save.lv >= LV_MAX) save.exp = 0;
  return ups;
}

/** 능력치 포인트 하나를 쓴다 */
export function allocate(save: Save, attr: Attr): boolean {
  if (save.statPts <= 0) return false;
  save.statPts--;
  save.attrs[attr]++;
  return true;
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
