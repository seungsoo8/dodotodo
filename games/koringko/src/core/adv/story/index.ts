/** 「태엽이 멈추기 전에」 전체 이야기: 방과 막 (프롤로그 + 10막 + 마지막 장 · 새벽 + 에필로그) */
import type { AdvData } from '../adv.ts';
import type { Chapter, Cmd, KeepsakePlace, RoomDef, Thing } from '../types.ts';
import { atticRoom } from './ch1.ts';
import { grandRoom } from './ch2.ts';
import { underbedRoom } from './ch3.ts';
import { windowRoom } from './ch4.ts';
import { deskRoom } from './ch5.ts';
import { shelfRoom } from './ch6.ts';
import { drawerRoom } from './ch7.ts';
import { yardRoom } from './ch8.ts';
import { toyboxRoom } from './ch9.ts';
import { balconyRoom } from './ch_balcony.ts';
import { bathRoom } from './ch_bath.ts';
import { entranceRoom } from './ch_entrance.ts';
import { EPILOGUE, NEWROOM_CHAIN, newroomToyRoom } from './ch_epilogue.ts';
import { sewboxRoom } from './ch_grandma.ts';
import { atticDawnRoom, END, humanAttic, newRoom } from './ending.ts';
import { MEMORY_ROOMS } from './memrooms.ts';
import { OUT_MEMROOMS } from './outrooms.ts';
import { MORE } from './more.ts';
import { PROLOGUE, yardEveRoom } from './ch_prologue.ts';
import { MORE2 } from './more2.ts';
import { MEMROOMS3A, MORE3A } from './more3a.ts';
import { MEMROOMS3B, MORE3B } from './more3b.ts';
import { CLOSET_MEMROOMS, closetRoom } from './ch_closet.ts';
import { CUPBOARD_MEMROOMS, cupboardRoom } from './ch_cupboard.ts';
import { SOFA_MEMROOMS, sofaRoom } from './ch_sofa.ts';
import { DRESSER_MEMROOMS, dresserRoom } from './ch_dresser.ts';
import { SCHOOLBAG_MEMROOMS, schoolbagRoom } from './ch_schoolbag.ts';
import { TOBYKEY_MEMROOMS, tobykeyRoom } from './ch_tobykey.ts';
import { outsideRoom } from './ch_outside.ts';
import { ACTS } from './acts.ts';
import { ROAD } from './talks.ts';
import { trimAfters } from './asides.ts';
import { scatterDecals } from './kit.ts';
import { OLD_KEEPSAKES } from './places.ts';
import { DAWN } from '../clock.ts';

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

/** 다른 파일에서 더해진 것까지 모은 방 물건 (자리표 · 감상 옮기기 전) */
const rawThings = (r: RoomDef): Thing[] => [...r.things, ...(MORE[r.id] ?? []), ...(MORE2[r.id] ?? []), ...(MORE3A[r.id] ?? []), ...(MORE3B[r.id] ?? [])];

/**
 * 그 방에서 말을 걸 수 있게 되는 동료: 막이 데리고 들어온 동료 + 막 안(도입 · 방마다 들어선 장면 · 모든 방의 물건 대본 · 문)에서 무리에 드는 동료.
 * 막의 방들은 한 무리가 함께 걸으므로 막 단위로 본다
 */
function palsIn(room: string, things: Thing[]): Set<string> {
  const ch = CHAPTER_LIST.find((c) => c.room === room || !!c.rooms?.some((r) => r.id === room));
  const out = new Set<string>(ch?.party ?? []);
  const walk = (cmds: readonly Cmd[]): void => {
    for (const c of cmds) {
      if (c.t === 'join') out.add(c.who);
      if (c.t === 'if') {
        walk(c.then);
        walk(c.else ?? []);
      }
    }
  };
  const walkThings = (ts: readonly Thing[]): void => {
    for (const t of ts) {
      if ('scene' in t && t.scene) walk(t.scene);
      if (t.kind === 'link') walk(t.locked);
      if (t.kind === 'door') {
        walk(t.first ?? []);
        walk(t.locked ?? []);
      }
    }
  };
  walk(ch?.intro ?? []);
  for (const r of ch?.rooms ?? []) {
    walk(r.enter ?? []);
    const raw = RAW[r.id];
    if (r.id !== room && raw) walkThings(rawThings(raw()));
  }
  walkThings(things);
  return out;
}

/**
 * 장 방 마무리: 다른 파일에서 더해진 기억 조각을 끼워 넣고, 자리표대로 물건으로 바꾸고 (옛 장은 places.ts),
 * 기억 뒤 감상을 두 줄까지로 줄여 나머지는 동료에게 옮기고 (asides.ts), 가구가 없는 장난감 방 바닥에는 잔 소품을 흩뿌린다.
 */
const more = (f: () => RoomDef) => (): RoomDef => {
  const r = f();
  let things = rawThings(r);
  const places = r.keepsakes ?? OLD_KEEPSAKES[r.id];
  if (places) things = placeKeepsakes(things, places);
  things = trimAfters(things, palsIn(r.id, things));
  const furniture = r.scale === 'toy' && !r.furniture ? scatterDecals({ ...r, things }) : r.furniture;
  return { ...r, things, ...(furniture ? { furniture } : {}) };
};

/** 가는 길 잡담을 띠를 걷기 전에 끼운다 (띠를 걷는 줄이 없으면 끝에) */
const withRoad = (cmds: Cmd[], t: Cmd[]): Cmd[] => {
  const i = cmds.findIndex((x) => x.t === 'bars' && !x.on);
  return i < 0 ? [...cmds, ...t] : [...cmds.slice(0, i), ...t, ...cmds.slice(i)];
};

/** 방에 들어설 때의 가는 길 잡담 (talks.ts ROAD): 막의 첫 방이면 막 도입에, 둘째 · 셋째 방이면 그 방의 들어선 장면에 */
const road = (c: Chapter): Chapter => {
  const head = ROAD[c.room];
  const rooms = c.rooms?.map((r) => (r.id !== c.room && ROAD[r.id] && r.enter ? { ...r, enter: withRoad(r.enter, ROAD[r.id]) } : r));
  return { ...c, ...(head ? { intro: withRoad(c.intro, head) } : {}), ...(rooms ? { rooms } : {}) };
};

/** 차례대로 번호를 매긴다 (제목은 이미 「N막」 을 갖고 있다) */
const number = (c: Chapter, i: number): Chapter => ({ ...c, n: i + 1 });

/** 마지막 장 · 새벽은 05:00, 에필로그는 새 방 하나에서 동료와 함께 걷는다 */
const DAWN_END: Chapter = { ...END, clock: DAWN };
const EPILOGUE_ACT: Chapter = { ...EPILOGUE, follow: true, chain: NEWROOM_CHAIN, rooms: [{ id: EPILOGUE.room, name: '새 방' }] };

/** 번호를 매기기 전 목록 (방마다 누가 함께 들어오는지 보려고 먼저 둔다): 프롤로그 · 1~10막 · 마지막 장 · 에필로그 */
const CHAPTER_LIST: Chapter[] = [PROLOGUE, ...ACTS, DAWN_END, EPILOGUE_ACT];

export const CHAPTERS: Chapter[] = CHAPTER_LIST.map(road).map(number);

/** 그 방에 들어설 때 나오는 장면: 막의 첫 방이면 막 도입, 둘째 · 셋째 방이면 그 방의 enter (없으면 빈 줄) */
export function introOf(room: string): Cmd[] {
  for (const c of CHAPTERS) {
    if (c.room === room) return c.intro;
    const r = c.rooms?.find((x) => x.id === room);
    if (r) return r.enter ?? [];
  }
  return [];
}

/** 그 방이 든 막 (막의 방이거나 장의 방) */
export function actOfRoom(room: string): Chapter | undefined {
  return CHAPTERS.find((c) => c.room === room || !!c.rooms?.some((r) => r.id === room));
}

/** 막의 방 (자리표 · 감상 옮기기 전): 막 단위로 누가 함께 있는지 셀 때 쓴다 */
const RAW: Record<string, () => RoomDef> = {
  attic: atticRoom,
  grandroom: grandRoom,
  dresser: dresserRoom,
  underbed: underbedRoom,
  closet: closetRoom,
  window: windowRoom,
  entrance: entranceRoom,
  schoolbag: schoolbagRoom,
  desk: deskRoom,
  bath: bathRoom,
  shelf: shelfRoom,
  drawer: drawerRoom,
  balcony: balconyRoom,
  sofa: sofaRoom,
  yard: yardRoom,
  outside: outsideRoom,
  tobykey: tobykeyRoom,
  toybox: toyboxRoom,
  cupboard: cupboardRoom,
  sewbox: sewboxRoom,
  newroom_toy: newroomToyRoom,
};

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
  attic_dawn: more(atticDawnRoom),
  h_yard_eve: yardEveRoom,
  newroom_toy: more(newroomToyRoom),
  h_attic: humanAttic,
  h_newroom: newRoom,
};

export const STORY: AdvData = { rooms: ROOMS, chapters: CHAPTERS };
