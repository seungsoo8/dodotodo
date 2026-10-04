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
  const hero = o.hero as HeroId;
  if (!CLASSES[hero]) return null;
  for (const k of ['lv', 'exp', 'gold', 'hp', 'sp']) if (o[k] !== undefined && !isNum(o[k])) return null;
  const base = newSave(hero, typeof o.name === 'string' ? o.name : CLASSES[hero].name, isNum(o.slot) ? (o.slot as number) : 0);
  const merged = { ...base, ...o } as Save;
  merged.mats = { ...base.mats, ...((o.mats as object) ?? {}) };
  merged.potions = { ...base.potions, ...((o.potions as object) ?? {}) };
  merged.attrs = { ...base.attrs, ...((o.attrs as object) ?? {}) };
  merged.skills = { ...base.skills, ...((o.skills as object) ?? {}) };
  merged.flags = { ...((o.flags as object) ?? {}) };
  merged.quests = { ...((o.quests as object) ?? {}) };
  merged.gear = { ...((o.gear as object) ?? {}) };
  merged.bag = Array.isArray(o.bag) ? (o.bag as Save['bag']) : [];
  merged.version = SAVE_VERSION;
  return merged;
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
