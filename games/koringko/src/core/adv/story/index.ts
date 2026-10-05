/** 「태엽이 멈추기 전에」 전체 이야기: 방과 장 */
import type { AdvData } from '../adv.ts';
import type { Chapter, KeepsakePlace, RoomDef, Thing } from '../types.ts';
import { atticRoom, CH1 } from './ch1.ts';
import { CH2, grandRoom } from './ch2.ts';
import { CH3, underbedRoom } from './ch3.ts';
import { CH4, windowRoom } from './ch4.ts';
import { CH5, deskRoom } from './ch5.ts';
import { CH6, shelfRoom } from './ch6.ts';
import { CH7, drawerRoom } from './ch7.ts';
import { CH8, yardRoom } from './ch8.ts';
import { CH9, toyboxRoom } from './ch9.ts';
import { balconyRoom, CH_BALCONY } from './ch_balcony.ts';
import { bathRoom, CH_BATH } from './ch_bath.ts';
import { CH_ENTRANCE, entranceRoom } from './ch_entrance.ts';
import { EPILOGUE, newroomToyRoom } from './ch_epilogue.ts';
import { CH_GRANDMA, sewboxRoom } from './ch_grandma.ts';
import { atticDawnRoom, END, humanAttic, newRoom } from './ending.ts';
import { MEMORY_ROOMS } from './memrooms.ts';
import { OUT_MEMROOMS } from './outrooms.ts';
import { MORE } from './more.ts';
import { PROLOGUE, yardEveRoom } from './ch_prologue.ts';
import { MORE2 } from './more2.ts';
import { MEMROOMS3A, MORE3A } from './more3a.ts';
import { MEMROOMS3B, MORE3B } from './more3b.ts';
import { CH_CLOSET, CLOSET_MEMROOMS, closetRoom } from './ch_closet.ts';
import { CH_CUPBOARD, CUPBOARD_MEMROOMS, cupboardRoom } from './ch_cupboard.ts';
import { CH_SOFA, SOFA_MEMROOMS, sofaRoom } from './ch_sofa.ts';
import { CH_DRESSER, DRESSER_MEMROOMS, dresserRoom } from './ch_dresser.ts';
import { CH_SCHOOLBAG, SCHOOLBAG_MEMROOMS, schoolbagRoom } from './ch_schoolbag.ts';
import { CH_TOBYKEY, TOBYKEY_MEMROOMS, tobykeyRoom } from './ch_tobykey.ts';
import { CH_OUTSIDE, outsideRoom } from './ch_outside.ts';
import { ROAD } from './talks.ts';

/** 기억 → 물건 자리표대로 기억 조각을 그 장소의 물건(keepsake)으로 바꾼다 */
export function placeKeepsakes(things: Thing[], map: Record<string, KeepsakePlace>): Thing[] {
  for (const id of Object.keys(map)) if (!things.some((t) => t.id === id && (t.kind === 'memory' || t.kind === 'keepsake'))) throw new Error(`자리표의 기억이 없다: ${id}`);
  return things.map((t): Thing => {
    const p = map[t.id];
    if (!p || (t.kind !== 'memory' && t.kind !== 'keepsake')) return t;
    const { kind: _k, ...rest } = t;
    return { ...rest, kind: 'keepsake', at: p.at, look: p.look, ...(p.look2 ? { look2: p.look2 } : {}), ...(p.when ? { when: p.when } : {}), ...(p.dark !== undefined ? { dark: p.dark } : {}) };
  });
}

/** 장 방에 더해진 기억 조각을 끼워 넣는다 (방의 자리표가 있으면 물건으로) */
const more = (f: () => RoomDef) => (): RoomDef => {
  const r = f();
  const things = [...r.things, ...(MORE[r.id] ?? []), ...(MORE2[r.id] ?? []), ...(MORE3A[r.id] ?? []), ...(MORE3B[r.id] ?? [])];
  return { ...r, things: r.keepsakes ? placeKeepsakes(things, r.keepsakes) : things };
};

/** 장 시작: 원래 들어오는 대본 + 가는 길 잡담 (띠를 걷기 전에) */
const road = (c: Chapter): Chapter => {
  const t = ROAD[c.room];
  if (!t) return c;
  const i = c.intro.findIndex((x) => x.t === 'bars' && !x.on);
  return i < 0 ? { ...c, intro: [...c.intro, ...t] } : { ...c, intro: [...c.intro.slice(0, i), ...t, ...c.intro.slice(i)] };
};

/** 차례대로 번호를 다시 매긴다 (제목의 「N장」 도) */
let numbered = 0;
const number = (c: Chapter, i: number): Chapter => {
  if (i === 0) numbered = 0;
  if (!/^\d+장/.test(c.title)) return { ...c, n: i + 1 };
  numbered++;
  return { ...c, n: i + 1, title: c.title.replace(/^\d+장/, `${numbered}장`) };
};

export const CHAPTERS: Chapter[] = [PROLOGUE, CH1, CH2, CH_DRESSER, CH3, CH_CLOSET, CH4, CH_ENTRANCE, CH_SCHOOLBAG, CH5, CH_BATH, CH6, CH7, CH_BALCONY, CH_SOFA, CH8, CH_OUTSIDE, CH_TOBYKEY, CH9, CH_CUPBOARD, CH_GRANDMA, END, EPILOGUE].map(road).map(number);

export const ROOMS: Record<string, () => RoomDef> = {
  ...MEMORY_ROOMS,
  ...MEMROOMS3A,
  ...MEMROOMS3B,
  ...CLOSET_MEMROOMS,
  ...SOFA_MEMROOMS,
  ...CUPBOARD_MEMROOMS,
  ...DRESSER_MEMROOMS,
  ...SCHOOLBAG_MEMROOMS,
  ...TOBYKEY_MEMROOMS,
  ...OUT_MEMROOMS,
  attic: more(atticRoom),
  grandroom: more(grandRoom),
  underbed: more(underbedRoom),
  window: more(windowRoom),
  desk: more(deskRoom),
  shelf: more(shelfRoom),
  drawer: more(drawerRoom),
  yard: more(yardRoom),
  toybox: more(toyboxRoom),
  entrance: more(entranceRoom),
  bath: more(bathRoom),
  balcony: more(balconyRoom),
  sewbox: more(sewboxRoom),
  closet: more(closetRoom),
  sofa: more(sofaRoom),
  cupboard: more(cupboardRoom),
  dresser: more(dresserRoom),
  schoolbag: more(schoolbagRoom),
  tobykey: more(tobykeyRoom),
  outside: more(outsideRoom),
  attic_dawn: atticDawnRoom,
  h_yard_eve: yardEveRoom,
  newroom_toy: newroomToyRoom,
  h_attic: humanAttic,
  h_newroom: newRoom,
};

export const STORY: AdvData = { rooms: ROOMS, chapters: CHAPTERS };
