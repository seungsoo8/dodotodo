/**
 * 막 다시 짜기 갈래 D (ACTS.md A · 8~10막 · 새벽 · 에필로그, D-7 acts_d):
 * 프롤로그 영상(PROLOGUE_FILM)은 보는 영상이고 나중 막의 핵심 대사를 앞질러 말하지 않으며,
 * 8 · 9 · 10막과 에필로그는 놀이를 하나만 남긴 채 기억 사슬 · 문 · 물음 한 줄로 이야기만 따라 끝까지 걸을 수 있다.
 * 모두 실제 STORY 자료와 실제 Adv 엔진으로 본다.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Adv, doneFlag, isMemory, NO_INPUT } from '../adv.ts';
import { actOfRoom, CHAPTERS, introOf, ROOMS, STORY } from '../story/index.ts';
import { PROLOGUE_FILM } from '../story/prologue_film.ts';
import { isSolidChar, TILE } from '../../maps.ts';
import { px } from '../stage.ts';
import { cueFor } from '../../../ui/audio/cues.ts';
import { SONGS } from '../../../ui/audio/score.ts';
import type { Chapter, Cmd, RoomDef, Thing } from '../types.ts';

type Say = Extract<Cmd, { t: 'say' }>;
const flat = (cmds: readonly Cmd[]): Cmd[] => cmds.flatMap((c) => (c.t === 'if' ? [c, ...flat(c.then), ...flat(c.else ?? [])] : [c]));
const says = (cmds: readonly Cmd[]): Say[] => flat(cmds).filter((c): c is Say => c.t === 'say');
const built: Record<string, RoomDef> = {};
const R = (id: string): RoomDef => (built[id] ??= ROOMS[id]());
const atOf = (t: Thing): readonly [number, number] => {
  assert.ok('at' in t, `${t.id} 자리`);
  return (t as { at: readonly [number, number] }).at;
};
const thing = (room: string, id: string): Thing => {
  const t = R(room).things.find((x) => x.id === id);
  assert.ok(t, `${room} 에 ${id} 가 없다`);
  return t;
};
type Door = Extract<Thing, { kind: 'door' }>;
const door = (room: string, id: string): Door => {
  const t = thing(room, id);
  assert.equal(t.kind, 'door');
  return t as Door;
};

/** 갈래 D 의 막 (방 차례) */
const MY_ACTS: { title: RegExp; rooms: string[] }[] = [
  { title: /^8막 · 매일 걷던 길$/, rooms: ['yard', 'outside'] },
  { title: /^9막 · 감는 사람, 기다리는 사람$/, rooms: ['tobykey', 'toybox'] },
  { title: /^10막 · 맡겨진 것들$/, rooms: ['cupboard', 'sewbox'] },
  { title: /^에필로그 · 새 방$/, rooms: ['newroom_toy'] },
];
const MY_ROOMS = MY_ACTS.flatMap((a) => a.rooms);

// ───────────────────────── 프롤로그 (ACTS.md A-4) ─────────────────────────

describe('프롤로그 「태엽 감는 소리」: 보는 영상 → 앞마당 서장 → 1막', () => {
  const pro = CHAPTERS[0];
  const intro = flat(pro.intro);
  const film = flat(PROLOGUE_FILM);
  const filmEnd = intro.indexOf(film.at(-1)!);

  test('프롤로그는 첫 묶음이고, 도입은 영상으로 시작해 앞마당(h_yard_eve)으로 돌아온 뒤에야 제목 카드 · 조종 · 물음 한 줄이 나온다', () => {
    assert.equal(pro.title, '프롤로그 · 이삿날 전날');
    assert.equal(pro.room, 'h_yard_eve');
    assert.deepEqual(intro.slice(0, film.length), film, '도입 첫머리가 영상 그대로');
    const back = intro.findIndex((c, i) => i > filmEnd && c.t === 'room' && c.id === 'h_yard_eve');
    const title = intro.findIndex((c) => c.t === 'chtitle');
    const control = intro.findIndex((c) => c.t === 'control' && c.who === 'haru');
    const goal = intro.findIndex((c) => c.t === 'goal');
    assert.ok(filmEnd > 0 && filmEnd < back && back < title && back < control && control < goal, `${filmEnd} ${back} ${title} ${control} ${goal}`);
    assert.equal(film.filter((c) => c.t === 'control' || c.t === 'chtitle' || c.t === 'goal').length, 0, '영상 동안은 조종 · 제목 · 목표가 없다');
    const g = intro[goal];
    assert.ok(g.t === 'goal' && g.text?.endsWith('?'), '물음 한 줄');
  });

  test('영상의 기억 방은 사람 크기 기억 방 9곳 이상, 하루가 태어난 밤(할머니 방) · 네 살 방 · 열다섯 방을 지난다', () => {
    const rooms = film.filter((c): c is Extract<Cmd, { t: 'room' }> => c.t === 'room').map((c) => c.id);
    const human = new Set(rooms.filter((id) => id.startsWith('m_') && R(id).scale === 'human'));
    assert.ok(human.size >= 9, `사람 크기 기억 방 ${human.size}곳`);
    assert.deepEqual([rooms[0], rooms[1], rooms.at(-1)], ['m_gm_n', 'm_room4', 'm_room15']);
  });

  test('영상은 읽는 글이 아니라 보는 것: 인물 대사 30줄 이하, 기다림 합 30초 이상', () => {
    const lines = says(PROLOGUE_FILM).filter((c) => c.who !== '');
    assert.ok(lines.length > 0 && lines.length <= 30, `대사 ${lines.length}줄`);
    const waits = film.reduce((n, c) => n + (c.t === 'wait' ? c.s : 0), 0);
    assert.ok(waits >= 30, `기다림 ${waits}초`);
  });

  test('첫 효과음 셋은 끼릭 세 번(windTick), 검은 화면에서', () => {
    const sfx = film.filter((c): c is Extract<Cmd, { t: 'sfx' }> => c.t === 'sfx').slice(0, 3).map((c) => c.name);
    assert.deepEqual(sfx, ['windTick', 'windTick', 'windTick']);
    const firstRoom = film.findIndex((c) => c.t === 'room');
    const thirdTick = film.findIndex((c, i) => c.t === 'sfx' && film.slice(0, i + 1).filter((x) => x.t === 'sfx').length === 3);
    assert.ok(film[0].t === 'fade' && film[0].to === 1 && thirdTick < firstRoom, '방이 보이기 전');
  });

  test('나중 막의 핵심 대사를 앞질러 말하지 않는다: 「놓지 마」 「천 개」 「하루 별」 「평생」 없음, 네 살 하루는 이름을 다 부르기 전에 끊긴다', () => {
    for (const c of says(PROLOGUE_FILM)) for (const bad of ['놓지 마', '천 개', '하루 별', '평생']) assert.ok(!c.text.includes(bad), `「${bad}」: ${c.text}`);
    const haru = says(PROLOGUE_FILM).filter((c) => c.who === 'haru').map((c) => c.text);
    assert.ok(haru.includes('토…'), '「토…」 에서 끊긴다');
    assert.ok(!haru.some((t) => /토비/.test(t)), '영상의 하루는 「토비」를 부르지 않는다');
    // 끊긴 이름은 9막 「선물 상자」(m9a) 에서 처음 불린다
    const m9a = thing('toybox', 'm9a');
    assert.ok(isMemory(m9a) && says(m9a.scene).some((c) => c.who === 'haru' && /토비/.test(c.text)));
  });

  test('영상 속 인물 · 물건은 그 기억 방의 걸을 수 있는 칸에 서고, 상자에 넣은 인형은 치워진다(@item … none)', () => {
    let room: RoomDef | null = null;
    for (const c of film) {
      if (c.t === 'room') room = R(c.id);
      const at = c.t === 'show' || c.t === 'item' ? c.at : c.t === 'walk' ? c.to : undefined;
      if (!at || !room) continue;
      assert.ok(!isSolidChar(room.tiles[at[1]]?.[at[0]]), `${room.id} (${at}) 막힌 칸`);
    }
    const put = film.filter((c): c is Extract<Cmd, { t: 'item' }> => c.t === 'item' && /^p[1-5]$/.test(c.id));
    for (const id of ['p1', 'p2', 'p3', 'p4', 'p5']) {
      const mine = put.filter((c) => c.id === id);
      assert.deepEqual(mine.map((c) => c.kind === 'none'), [false, true], `${id}: 꺼냈다가 상자에`);
    }
  });

  test('영상의 음악은 모두 있는 곡으로 풀리고, 태어난 밤의 노래는 끝 소절 전에 멈추는 오르골(orgel)', () => {
    let where = '';
    let tone: 'now' | 'memory' | 'dawn' = 'now';
    const got: string[] = [];
    for (const c of film) {
      if (c.t === 'room') where = c.id;
      if (c.t === 'tone') tone = c.v;
      if (c.t !== 'music' || c.track === null) continue;
      const r = R(where);
      const id = cueFor({ track: c.track, steps: 'calm', tone, room: r.id, look: r.look, roomMusic: r.music, memory: null, flags: {} });
      assert.ok(id && id in SONGS, `${where} ${c.track} → ${id}`);
      got.push(`${where}:${id}`);
    }
    assert.equal(got[0], 'm_gm_n:orgel');
    assert.ok(got.length >= 5, got.join(' '));
  });

  test('서장의 목표 줄은 물음 하나뿐 (상자를 안아도 목표 줄이 바뀌지 않는다), 현관문(p_door)이 1막으로 넘긴다', () => {
    const goals = [...intro, ...R('h_yard_eve').things.flatMap((t) => ('scene' in t && t.scene ? flat(t.scene) : []))].filter((c) => c.t === 'goal');
    assert.equal(goals.length, 1);
    const pdoor = thing('h_yard_eve', 'p_door');
    assert.ok(pdoor.kind === 'spot' && flat(pdoor.scene).some((c) => c.t === 'next'));
    assert.match(CHAPTERS[1].title, /^1막/);
  });
});

// ───────────────────────── 8 · 9 · 10막 · 에필로그: 구조 (D-7 acts_d) ─────────────────────────

const actOf = (title: RegExp): Chapter => {
  const c = CHAPTERS.find((x) => title.test(x.title));
  assert.ok(c, `${title} 이 없다`);
  return c;
};

describe('8 · 9 · 10막 · 에필로그: 놀이는 하나, 막는 건 이야기뿐', () => {
  const GONE = new Set(['push', 'pad', 'block', 'seq', 'chase', 'watcher', 'gears', 'flow', 'beam', 'mirror', 'charge']);

  test('막은 방들을 차례로 갖고, 동료는 늘 따라다닌다 (follow)', () => {
    for (const a of MY_ACTS) {
      const c = actOf(a.title);
      assert.deepEqual(c.rooms?.map((r) => r.id), a.rooms, c.title);
      assert.equal(c.follow, true, c.title);
    }
    const dawn = CHAPTERS.at(-2)!;
    assert.equal(dawn.title, '마지막 장 · 새벽');
    assert.equal(dawn.follow, undefined, '새벽은 대본뿐 (따라다니기 없음)');
  });

  test('지운 놀이 종류가 남아 있지 않고, 미끄럼 · 바람 · 낮은 천장이 없으며, 나비 등불은 줄지 않는다', () => {
    for (const id of MY_ROOMS) {
      const r = R(id);
      const left = r.things.filter((t) => GONE.has(t.kind)).map((t) => `${t.kind}:${t.id}`);
      assert.deepEqual(left, [], id);
      for (const k of ['slip', 'grip', 'winds', 'low']) assert.equal((r as unknown as Record<string, unknown>)[k], undefined, `${id}.${k}`);
      if (r.lantern) assert.equal(r.lantern.drain, 0, `${id} 등불`);
    }
  });

  test('막마다 남긴 놀이는 하나: 그네 밀기 · 상자 뚜껑 · 인형 눈 단추 · 「가져온 짐」 풀기', () => {
    const plays = (rooms: string[]) => rooms.flatMap((id) => R(id).things.filter((t) => t.kind === 'pull' || t.kind === 'assemble').map((t) => t.id));
    assert.deepEqual(plays(['yard', 'outside']), ['swingPush']);
    assert.deepEqual(plays(['tobykey', 'toybox']), ['lid']);
    assert.deepEqual(plays(['cupboard', 'sewbox']), ['dollEyes']);
    assert.deepEqual(plays(['newroom_toy']), ['unpack']);
    const eyes = R('sewbox').things.filter((t) => t.kind === 'part');
    assert.deepEqual(eyes.map((t) => t.id).sort(), ['eyeA', 'eyeB']);
    for (const p of eyes) assert.equal((p as { when?: string }).when, 'mem_mGb', '「비밀로 해 다오」 뒤에 드러난다');
  });

  test('목표 줄은 물음 한 줄: 막 도입 하나, 둘째 방 들어선 장면 하나, 물건 대본에는 기억 속 조종 장면(m8c)만', () => {
    const want: Record<string, string> = {
      yard: '할머니는 늘 어디서 하루를 기다렸을까?',
      outside: '그네는 언제 멈췄을까?',
      tobykey: '토비는 왜 오늘 밤 깨어났을까?',
      toybox: '할머니는 토비에게 무엇을 부탁했을까?',
      cupboard: '할머니는 누구에게 무엇을 맡기고 갔을까?',
      sewbox: '할머니가 혼자 지킨 이야기는 무엇이었을까?',
      newroom_toy: '새 방에서, 우리 자리는 어디일까?',
    };
    for (const [room, q] of Object.entries(want)) {
      const goals = flat(introOf(room)).filter((c): c is Extract<Cmd, { t: 'goal' }> => c.t === 'goal').map((c) => c.text);
      assert.deepEqual(goals, [q], room);
    }
    const inThings: string[] = [];
    for (const id of MY_ROOMS)
      for (const t of R(id).things) {
        const scs = [...('scene' in t && t.scene ? [t.scene] : []), ...(t.kind === 'door' ? [t.first ?? [], t.locked ?? []] : []), ...(t.kind === 'link' ? [t.locked] : [])];
        for (const sc of scs) for (const c of flat(sc)) if (c.t === 'goal' && c.text) inThings.push(`${t.id}:${c.text}`);
      }
    assert.deepEqual(inThings, ['m8c:토비는 어디에 떨어졌을까?']);
    for (const q of [...Object.values(want), '토비는 어디에 떨어졌을까?']) {
      assert.ok(q.endsWith('?') && !/\d|기억 조각|자\?$/.test(q), q);
    }
  });

  test('동료 자리 말에 「불러」 귀띔이 없다 (늘 함께 다니므로)', () => {
    for (const id of MY_ROOMS)
      for (const [who, h] of Object.entries(R(id).hangouts ?? {})) for (const c of says(h?.talk ?? [])) assert.ok(!/불러|부르면/.test(c.text), `${id} ${who}: ${c.text}`);
  });

  test('사슬: 막마다 기억이 모두 한 번씩, 이어 주는 줄(bridge)은 「>」 없는 해설 한 줄 40자 이하, 첫 단계 말고는 숨어 있다가 드러난다', () => {
    for (const a of MY_ACTS) {
      const c = actOf(a.title);
      const chain = c.chain ?? [];
      const things = a.rooms.flatMap((id) => R(id).things);
      const mems = things.filter(isMemory).map((m) => m.id);
      assert.deepEqual(chain.map((s) => s.id).filter((id) => mems.includes(id)).sort(), [...mems].sort(), c.title);
      for (const s of chain) {
        if (s.bridge === undefined) continue;
        assert.ok(s.bridge.length <= 40, `${s.id}: ${s.bridge.length}자`);
        assert.ok(!/^\s*>/.test(s.bridge) && !/^\w+:/.test(s.bridge) && !s.bridge.includes('\n'), s.id);
      }
      // 첫 단계만 처음부터 보이고, 나머지는 앞 단계(또는 gate)가 서야 보인다
      const byId = new Map(things.map((t) => [t.id, t]));
      assert.equal((byId.get(chain[0].id) as { when?: string }).when, undefined, `${chain[0].id} 는 막을 시작하면 바로 보인다`);
      for (const s of chain.slice(1)) assert.ok((byId.get(s.id) as { when?: string }).when, `${s.id} 는 숨어 있다가 드러난다`);
    }
  });

  test('둘째 방의 첫 단계는 그 방으로 들어오는 문을 지난 뒤 (gate = door_<문>)', () => {
    const pairs: [string, string, string][] = [['mOUa', 'd_yard_out', 'outside'], ['lid', 'd_key_box', 'toybox'], ['mGa', 'd_cup_sew', 'sewbox']];
    for (const [first, d, room] of pairs) {
      const c = actOfRoom(room)!;
      const s = c.chain!.find((x) => x.id === first)!;
      assert.equal(s.gate, `door_${d}`);
      assert.equal((thing(room, first) as { when?: string }).when, `door_${d}`);
    }
  });

  test('문: 막 안의 방으로만 가고, 떠나기 전 장면에는 맞추기 · 다음 장 · 장 끝 깃발이 없다; 9 · 10막 문은 되돌아오는 문이 없다', () => {
    const doors = MY_ROOMS.flatMap((id) => R(id).things.filter((t): t is Door => t.kind === 'door').map((d) => ({ id, d })));
    assert.deepEqual(doors.map((x) => x.d.id).sort(), ['d_cup_sew', 'd_key_box', 'd_out_yard', 'd_yard_out']);
    for (const { id, d } of doors) {
      assert.equal(actOfRoom(id), actOfRoom(d.to), `${d.id}: 다른 막`);
      const f = flat(d.first ?? []);
      assert.equal(f.filter((c) => c.t === 'mini' || c.t === 'next' || (c.t === 'flag' && /_done$/.test(c.name))).length, 0, d.id);
    }
    assert.ok(!R('toybox').things.some((t) => t.kind === 'door'), '태엽 속에서 깨어나면 돌아가지 않는다');
    assert.ok(!R('sewbox').things.some((t) => t.kind === 'door'), '다락으로 올라가면 돌아가지 않는다');
  });

  test('기억의 문(맞추기)은 막마다 하나, 막의 마지막 방에만: 8막 photo2 · 9막 flip3 · 10막 order3, 반전은 재봉 상자의 기억의 문에', () => {
    const minis = (room: string) =>
      R(room).things.flatMap((t) => (t.kind === 'link' ? flat(t.scene).filter((c): c is Extract<Cmd, { t: 'mini' }> => c.t === 'mini').map((c) => c.id) : []));
    assert.deepEqual([minis('yard'), minis('outside')], [[], ['photo2']]);
    assert.deepEqual([minis('tobykey'), minis('toybox')], [[], ['flip3']]);
    assert.deepEqual([minis('cupboard'), minis('sewbox')], [[], ['order3']]);
    for (const room of ['yard', 'tobykey', 'cupboard']) assert.ok(!R(room).things.some((t) => t.kind === 'link'), `${room}: 첫 방엔 기억의 문이 없다`);
    const lG = thing('sewbox', 'lG');
    assert.ok(lG.kind === 'link' && says(lG.scene).some((c) => /하루가 울던 밤에만/.test(c.text)));
  });

  test('찬장 꿀단지는 honey_open (9막 lid_open 과 따로), 막간 ③ 은 골목 끝 lOut 끝에 · 막간 ④ 는 계단 문 장면에', () => {
    assert.equal((thing('cupboard', 'mOa') as { when?: string }).when, 'honey_open');
    const lid = thing('cupboard', 'honey_lid');
    assert.ok(lid.kind === 'spot' && flat(lid.scene).some((c) => c.t === 'flag' && c.name === 'honey_open'));
    const lOut = thing('outside', 'lOut');
    assert.ok(lOut.kind === 'link' && says(lOut.scene).some((c) => c.who === 'doll' && /그다음은, 하루가 불러야지/.test(c.text)));
    assert.ok(says(door('cupboard', 'd_cup_sew').first ?? []).some((c) => c.who === 'doll' && /먼저 그만하자고/.test(c.text)));
  });

  test('9막 기억 물건 자리: 방석(m9f)은 카드(m9b)와 다른 칸 [18,6], 크레용 그림은 조각 배달 대신 넷이 맞추는 장면', () => {
    assert.equal(thing('toybox', 'm9f').kind, 'keepsake');
    assert.deepEqual(atOf(thing('toybox', 'm9f')), [18, 6]);
    assert.notDeepEqual(atOf(thing('toybox', 'm9b')), [18, 6]);
    assert.equal(thing('toybox', 'crayon_pic').kind, 'spot');
    assert.equal(thing('toybox', 'haru_dawn').kind, 'npc');
  });
});

// ───────────────────────── 실제로 걸어 보기 ─────────────────────────

/** 대본을 끝까지 (맞추기는 끝낸 것으로, 고르기는 answers 의 답으로, 없으면 첫 답) */
function finish(a: Adv, answers: Record<string, number> = {}): string[] {
  const lines: string[] = [];
  for (let i = 0; i < 60 * 300 && (a.runner || a.mini); i++) {
    if (a.mini) a.mini.done = true;
    const ch = a.stage.choice;
    if (ch && ch.flag in answers) ch.sel = answers[ch.flag];
    const d = a.stage.dialog;
    if (d && lines.at(-1) !== d.text) lines.push(d.text);
    a.step(1 / 60, { ...NO_INPUT, act: i % 2 === 0 });
  }
  assert.equal(a.runner, null, '대본이 끝나지 않는다');
  return lines;
}
const cellOf = (a: Adv): [number, number] => [Math.floor(a.stage.actors.toby.x / TILE), Math.floor(a.stage.actors.toby.y / TILE)];
const doInteract = (a: Adv, t: Thing) => (a as unknown as { interact(t: Thing): void }).interact(t);

/** 막을 시작해 도입을 끝까지 */
function startAct(c: Chapter): Adv {
  const a = new Adv(STORY);
  a.runner = null;
  (a as unknown as { queue: unknown[] }).queue = [];
  (a as unknown as { applyChapter(n: number): void }).applyChapter(c.n);
  finish(a);
  return a;
}

/** 그 칸 옆에 토비와 나비(등불)를 세운다 */
function near(a: Adv, at: readonly [number, number]): void {
  a.place(px(at[0]), px(at[1]));
  const nabi = a.stage.actors.nabi;
  if (nabi) {
    nabi.x = px(at[0]);
    nabi.y = px(at[1]);
  }
}

/** 기억을 끝까지 본다 (걷는 기억은 실을 모두, 조종 장면은 끝 깃발로) */
function seeMemory(a: Adv, t: Thing, home: string): void {
  doInteract(a, t);
  finish(a);
  for (let k = 0; k < 8 && a.room.id !== home; k++) {
    if (a.threadCount()) for (const th of a.things().filter((x) => x.kind === 'thread')) {
      doInteract(a, th);
      finish(a);
    }
    else {
      // 조종 장면은 그 기억 방의 일을 마치면 끝 깃발이 선다: 깃발을 세우고 대본 하나를 끝내면 이어진다
      a.flags[`${t.id}_end`] = true;
      a.run([{ t: 'wait', s: 0 }]);
    }
    finish(a);
  }
  assert.equal(a.room.id, home, `${t.id}: 돌아오지 못했다`);
}

/** 사슬 차례대로 막을 끝까지 걷는다. 단계마다: 그 방에 있고 보이며, 마치면 끝 깃발이 선다 */
function playAct(c: Chapter, answers: Record<string, number> = {}): Adv {
  const a = startAct(c);
  for (const step of c.chain ?? []) {
    const t = a.room.things.find((x) => x.id === step.id);
    assert.ok(t, `${c.title} ${step.id}: 지금 방(${a.room.id})에 없다`);
    if (t.kind !== 'trigger' && t.kind !== 'door') {
      near(a, atOf(t));
      assert.ok(a.things().some((x) => x.id === t.id), `${c.title} ${t.id}: 보이지 않는다`);
    }
    const before = a.room.id;
    switch (t.kind) {
      case 'memory':
      case 'keepsake':
        seeMemory(a, t, before);
        break;
      case 'trigger':
        a.place(px(t.rect[0] + t.rect[2] / 2 - 0.5), px(t.rect[1] + t.rect[3] / 2 - 0.5));
        a.step(1 / 60, NO_INPUT);
        finish(a, answers);
        break;
      case 'door':
        if (t.rect) {
          a.place(px(t.rect[0] - 2), px(t.rect[1]));
          a.step(1 / 60, NO_INPUT);
          a.place(px(t.rect[0]), px(t.rect[1]));
          a.step(1 / 60, NO_INPUT);
        } else {
          near(a, t.at);
          doInteract(a, t);
        }
        finish(a, answers);
        assert.equal(a.room.id, t.to, `${t.id}: 지나가지 못했다`);
        assert.equal(a.flags[`enter_${t.to}`], true, `${t.to}: 들어선 장면`);
        break;
      case 'pull':
        for (let i = 0; i < (t.tugs ?? 1); i++) {
          doInteract(a, t);
          finish(a, answers);
        }
        break;
      case 'assemble':
        for (const p of a.room.things.filter((x) => x.kind === 'part' && x.set === t.set)) {
          near(a, atOf(p));
          doInteract(a, p);
          finish(a, answers);
          near(a, t.at);
          doInteract(a, t);
          finish(a, answers);
        }
        break;
      default:
        doInteract(a, t);
        finish(a, answers);
    }
    const f = doneFlag(t);
    if (t.kind !== 'link') assert.ok(f && a.flags[f], `${c.title} ${t.id}: 끝 깃발 ${f}`);
  }
  return a;
}

describe('8 · 9 · 10막 · 에필로그를 사슬대로 끝까지 걷는다 (진짜 엔진)', () => {
  test('8막: 마당 기억 일곱 → 파란 대문(떠나기 전 장면 · 골목 들어선 장면) → 골목 기억 → 그네 밀기 → 벤치 위 두 별 → 9막', () => {
    const c = actOf(MY_ACTS[0].title);
    const a = playAct(c);
    assert.equal(a.flags.enter_outside, true);
    assert.equal(a.flags.swing_pushed, true);
    const lOut = a.things().find((t) => t.id === 'lOut')!;
    near(a, atOf(lOut));
    doInteract(a, lOut);
    const lines = finish(a);
    assert.ok(lines.some((l) => /그다음은, 하루가 불러야지/.test(l)), '막간 ③');
    assert.equal(a.save.chapter, c.n + 1);
    assert.match(CHAPTERS[c.n].title, /^9막/);
  });

  test('9막: 태엽 속 메아리 → 태엽 감기 → 빨간 리본 열쇠(깨어남) → 넷이 뚜껑 → 상자 기억 → 크레용 그림 → 약속의 날 → 10막', () => {
    const c = actOf(MY_ACTS[1].title);
    const a = playAct(c);
    assert.equal(a.room.id, 'toybox');
    assert.equal(a.flags.crayon_done, true);
    const l9 = a.things().find((t) => t.id === 'l9')!;
    near(a, atOf(l9));
    doInteract(a, l9);
    finish(a);
    assert.equal(a.save.chapter, c.n + 1);
  });

  test('10막: 꿀단지 → 찬장 기억 → 계단 문(막간 ④) → 매듭 다섯 · 눈 단추 · 마지막 땀 → 할머니의 바늘(반전) → 마지막 장 · 새벽', () => {
    const c = actOf(MY_ACTS[2].title);
    // 매듭은 실이 들어온 반대쪽: 둘째 · 넷째만 「밑으로 지나기」
    const a = playAct(c, { kn2: 1, kn4: 1 });
    assert.equal(a.flags.sewn, true);
    assert.equal(a.flags.doll_eyes, true);
    const lG = a.things().find((t) => t.id === 'lG')!;
    near(a, atOf(lG));
    doInteract(a, lG);
    const lines = finish(a);
    assert.ok(lines.some((l) => /끼릭 세 번도/.test(l)), '반전');
    // 다음은 대본뿐인 마지막 장 · 새벽 (뻐꾹 영감의 「정각」) → 끝까지 흘러 에필로그
    const dawn = lines.findIndex((l) => /정각이다/.test(l));
    assert.ok(dawn > lines.findIndex((l) => /끼릭 세 번도/.test(l)), '반전 뒤에 새벽');
    assert.equal(CHAPTERS[a.save.chapter - 1].title, '에필로그 · 새 방');
  });

  test('에필로그: 「가져온 짐」 풀기 → 선반 수다 → 별자리(나비가 비춘다) → 기억 → 새 유리병 → 크레디트 · 끝 깃발', () => {
    const c = actOf(MY_ACTS[3].title);
    const a = playAct(c);
    assert.equal(a.flags.dipper_done, true);
    assert.equal(a.flags.ending, true);
  });
});

describe('문 결곗값 (실제 8막 대문)', () => {
  test('마지막 기억(m8g) 전에는 대문이 잠겨 locked 한 줄만, 방 그대로 · 처음 지날 때만 떠나기 전 장면 · 들어선 장면, 되돌아왔다 다시 나가면 바로 지나간다', () => {
    const c = actOf(MY_ACTS[0].title);
    const a = startAct(c);
    const d = door('yard', 'd_yard_out');
    const into = () => {
      a.place(px(d.rect![0] - 2), px(d.rect![1]));
      a.step(1 / 60, NO_INPUT);
      a.place(px(d.rect![0]), px(d.rect![1] + 1));
      a.step(1 / 60, NO_INPUT);
      return finish(a);
    };
    assert.deepEqual(into(), ['연못 건너편에 아직.']);
    assert.equal(a.room.id, 'yard');
    assert.equal(a.flags.door_d_yard_out, undefined);
    a.flags.mem_m8g = true;
    const first = into();
    const umbrella = first.findIndex((l) => /작은 노란 우산이 쓰러져 있다/.test(l));
    const sky = first.findIndex((l) => /하늘이 왜 이렇게 커/.test(l));
    assert.ok(umbrella >= 0 && umbrella < sky, first.join(' / '));
    assert.equal(a.room.id, 'outside');
    assert.equal(a.flags.enter_outside, true);
    // 돌아가는 문 → 마당의 도착 칸 (대문 rect 밖)
    const back = door('outside', 'd_out_yard');
    a.place(px(back.rect![0] + 2), px(back.rect![1]));
    a.step(1 / 60, NO_INPUT);
    a.place(px(back.rect![0]), px(back.rect![1]));
    a.step(1 / 60, NO_INPUT);
    finish(a);
    assert.equal(a.room.id, 'yard');
    assert.deepEqual(cellOf(a), [back.arrive[0], back.arrive[1]]);
    const again = into();
    assert.equal(a.room.id, 'outside');
    assert.ok(!again.some((l) => /작은 노란 우산|하늘이 왜 이렇게 커/.test(l)), again.join(' / '));
  });

  test('9막 빨간 리본 열쇠는 걸어 들어가는 문이 아니라 살펴보는 문: 할머니가 고친 열쇠 축(mTf) 전에는 「아직 들리는 소리가 있어」', () => {
    const c = actOf(MY_ACTS[1].title);
    const a = startAct(c);
    const d = door('tobykey', 'd_key_box');
    assert.equal(d.rect, undefined);
    near(a, d.at);
    doInteract(a, d);
    assert.deepEqual(finish(a), ['…아직 들리는 소리가 있어.']);
    assert.equal(a.room.id, 'tobykey');
    a.flags.mem_mTf = true;
    doInteract(a, d);
    const lines = finish(a);
    assert.ok(lines.some((l) => /이천구백십육 번은, 있었어/.test(l)));
    assert.ok(lines.some((l) => /토비가 눈을 떴다\. 장난감 상자 앞이었다/.test(l)));
    assert.equal(a.room.id, 'toybox');
  });
});
