/** 캐릭터 저장 칸 (3개). 저장소(localStorage 등)는 밖에서 넣어 준다 */
import { CLASSES } from './classes.ts';
import { newSave, SAVE_VERSION } from './character.ts';
import type { HeroId, Save } from './types.ts';

export interface StorageLike {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem?(k: string): void;
}

export const SLOT_COUNT = 3;
const key = (slot: number) => `koringko:slot${slot}`;

const isNum = (v: unknown) => typeof v === 'number' && Number.isFinite(v);

/** 저장 글을 읽는다. 잘못되었으면 null, 빠진 칸은 기본값 */
export function parseSave(raw: string | null): Save | null {
  if (!raw) return null;
  let o: Record<string, unknown>;
  try {
    o = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!o || typeof o !== 'object') return null;
  // 예전 버전(장비가 있던 코링코)은 이어 할 수 없다
  if (o.version !== SAVE_VERSION) return null;
  const hero = o.hero as HeroId;
  if (!CLASSES[hero]) return null;
  for (const k of ['lv', 'exp', 'gold', 'hp', 'sp']) if (o[k] !== undefined && !isNum(o[k])) return null;
  const base = newSave(isNum(o.slot) ? (o.slot as number) : 0, hero);
  const merged = { ...base, ...o } as Save;
  merged.mats = { ...base.mats, ...((o.mats as object) ?? {}) };
  merged.potions = { hp: isNum((o.potions as { hp?: unknown })?.hp) ? (o.potions as { hp: number }).hp : base.potions.hp };
  merged.attrs = { ...base.attrs, ...((o.attrs as object) ?? {}) };
  merged.skills = { ...base.skills, ...((o.skills as object) ?? {}) };
  merged.variants = { ...((o.variants as object) ?? {}) };
  merged.flags = { ...((o.flags as object) ?? {}) };
  merged.quests = { ...((o.quests as object) ?? {}) };
  merged.parts = { ...((o.parts as object) ?? {}) };
  merged.friends = { ...((o.friends as object) ?? {}) };
  merged.bench = { ...((o.bench as object) ?? {}) };
  merged.slots = Array.isArray(o.slots) ? (o.slots as string[]).filter((x) => typeof x === 'string') : [];
  merged.rescued = Array.isArray(o.rescued) ? (o.rescued as string[]).filter((x) => typeof x === 'string') : [];
  merged.party = Array.isArray(o.party) ? (o.party as HeroId[]).filter((h) => CLASSES[h]) : [hero];
  if (!merged.party.includes(hero)) merged.party.unshift(hero);
  if (!['easy', 'normal', 'hard'].includes(merged.difficulty)) merged.difficulty = 'normal';
  if (!isNum(merged.weaponLv)) merged.weaponLv = 1;
  return merged;
}

/** 저장 칸에 예전 버전 저장이 남아 있는가 */
export function isOldSave(st: StorageLike, slot: number): boolean {
  try {
    const raw = st.getItem(key(slot));
    if (!raw) return false;
    const o = JSON.parse(raw);
    return !!o && o.version !== SAVE_VERSION;
  } catch {
    return false;
  }
}

export function saveSlot(st: StorageLike, save: Save): void {
  try {
    st.setItem(key(save.slot), JSON.stringify(save));
  } catch {
    // 막힌 저장소: 이번 세션만
  }
}

export function loadSlot(st: StorageLike, slot: number): Save | null {
  try {
    return parseSave(st.getItem(key(slot)));
  } catch {
    return null;
  }
}

export function deleteSlot(st: StorageLike, slot: number): void {
  try {
    if (st.removeItem) st.removeItem(key(slot));
    else st.setItem(key(slot), '');
  } catch {
    // 무시
  }
}

export function listSlots(st: StorageLike): (Save | null)[] {
  return Array.from({ length: SLOT_COUNT }, (_, i) => loadSlot(st, i));
}
