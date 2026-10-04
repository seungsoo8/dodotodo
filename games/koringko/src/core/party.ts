/** 탐험대: 동료 합류 · 쉬게 하기 · 바꿔 들기 */
import { CLASSES, LV_MAX } from './classes.ts';
import { GROWTH, startSkills } from './character.ts';
import { ATTRS, type HeroId, type HeroState, type Save } from './types.ts';

export const HERO_SLOTS: HeroId[] = ['toby', 'bori', 'ruru', 'nabi'];

/** 동료 상태 (지금 싸우는 동료면 위쪽 값으로) */
export function heroState(save: Save, h: HeroId): HeroState {
  if (h === save.hero) return { hp: save.hp, sp: save.sp, attrs: save.attrs, skills: save.skills, skillPts: save.skillPts, variants: save.variants, weaponLv: save.weaponLv, down: 0 };
  return save.bench[h]!;
}

/** 동료 합류: 탐험대 레벨만큼 자란 채로 쉬는 자리에 */
export function joinParty(save: Save, h: HeroId): boolean {
  if (save.party.includes(h)) return false;
  const c = CLASSES[h];
  const ups = Math.min(LV_MAX, save.lv) - 1;
  const attrs = { ...c.base };
  for (const a of ATTRS) attrs[a] += GROWTH[h][a] * ups;
  save.bench[h] = { hp: 1e9, sp: 50, attrs, skills: startSkills(h), skillPts: ups, variants: {}, weaponLv: 1, down: 0 };
  save.party.push(h);
  return true;
}

/** 지금 동료를 쉬는 자리로 */
export function stashHero(save: Save, down = 0): void {
  save.bench[save.hero] = { hp: save.hp, sp: save.sp, attrs: save.attrs, skills: save.skills, skillPts: save.skillPts, variants: save.variants, weaponLv: save.weaponLv, down };
}

/** 쉬던 동료를 위로 */
export function loadHero(save: Save, h: HeroId): void {
  const st = save.bench[h]!;
  save.hero = h;
  save.hp = st.hp;
  save.sp = st.sp;
  save.attrs = st.attrs;
  save.skills = st.skills;
  save.skillPts = st.skillPts;
  save.variants = st.variants;
  save.weaponLv = st.weaponLv;
  delete save.bench[h];
}

/** 다음에 나설 수 있는 동료 (쓰러진 동료는 건너뛴다) */
export function nextHero(save: Save): HeroId | null {
  const n = save.party.length;
  const i = save.party.indexOf(save.hero);
  for (let k = 1; k < n; k++) {
    const h = save.party[(i + k) % n];
    if ((save.bench[h]?.down ?? 0) <= 0) return h;
  }
  return null;
}

/** 쉬는 동료 h 를 잠깐 앞에 세워 fn 을 하고 원래대로 (메뉴에서 스킬 · 무기). 탐험대에 없으면 undefined */
export function withHero<T>(save: Save, h: HeroId, fn: () => T): T | undefined {
  if (h === save.hero) return fn();
  if (!save.party.includes(h) || !save.bench[h]) return undefined;
  const cur = save.hero;
  const down = save.bench[h]!.down;
  stashHero(save);
  loadHero(save, h);
  try {
    return fn();
  } finally {
    stashHero(save, down);
    loadHero(save, cur);
  }
}
