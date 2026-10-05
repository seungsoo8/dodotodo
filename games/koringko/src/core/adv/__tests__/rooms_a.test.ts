/**
 * 갈래 A 방 (사람 크기 하루 방 · 새 방): 4장 침대 밑 · 8장 책가방 · 18장 장난감 상자 · 에필로그 새 방.
 * 장마다 처음부터 끝까지 실제로 풀어 본다: 놀이를 차례로 (숨바꼭질 · 등불 · 설득 · 배달 · 당기기 · 맞추기 · 순서),
 * 동료를 말 걸어 부르고, 모든 기억 물건에 걸어가 닿고, 기억의 문으로 다음 장 (에필로그는 크레디트).
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Adv, isMemory, NO_INPUT, type AdvInput } from '../adv.ts';
import { actOfRoom, ROOMS, STORY } from '../story/index.ts';
import { startIn } from './acthelp.ts';
import { HARU } from '../story/layout_a.ts';
import { px } from '../stage.ts';
import { TILE } from '../../maps.ts';
import { lookPix } from '../../../ui/render/looks.ts';
import type { Cmd, Facing, RoomDef, Thing } from '../types.ts';

type Pal = 'bori' | 'ruru' | 'nabi';
const chOf = (room: string) => actOfRoom(room)!;

function flat(cmds: readonly Cmd[]): Cmd[] {
  return cmds.flatMap((c) => (c.t === 'if' ? [c, ...flat(c.then), ...flat(c.else ?? [])] : [c]));
}

/** 장을 바로 시작하고 들어오는 대본을 끝까지 */
function start(room: string): Adv {
  return startIn(room, (a) => finish(a));
}

/** 대본 · 놀이가 끝날 때까지 넘기며 나온 대사를 모은다 (작은 놀이는 다 한 것으로, 고르기는 0번) */
function finish(a: Adv, limit = 120): string[] {
  const lines: string[] = [];
  for (let i = 0; i < limit * 60 && (a.runner || a.mini); i++) {
    if (a.mini) a.mini.done = true;
    const d = a.stage.dialog;
    if (d && lines[lines.length - 1] !== d.text) lines.push(d.text);
    a.step(1 / 60, { ...NO_INPUT, act: i % 2 === 0 });
  }
  assert.equal(a.runner, null, '대본이 끝나지 않는다');
  return lines;
}

/** 고르기가 나올 때까지 넘기고 k 번째를 고른 뒤 끝까지 */
function answer(a: Adv, k: number): string[] {
  const lines: string[] = [];
  for (let i = 0; i < 60 * 60 && a.runner && !a.stage.choice; i++) {
    const d = a.stage.dialog;
    if (d && lines[lines.length - 1] !== d.text) lines.push(d.text);
    a.step(1 / 60, { ...NO_INPUT, act: i % 2 === 0 });
  }
  assert.ok(a.stage.choice, '고르기가 나오지 않는다');
  a.stage.choice!.sel = k;
  a.step(1 / 60, { ...NO_INPUT, act: true });
  return [...lines, ...finish(a)];
}

/** 그 칸에 서서 (밟으면 터지는 대본은 먼저 넘기고) 그쪽을 본다 → 지금 누를 수 있는 것 */
function stand(a: Adv, x: number, y: number, dir: Facing): string | undefined {
  a.place(px(x), px(y));
  a.face(dir);
  a.step(1 / 60, NO_INPUT);
  finish(a);
  a.face(dir);
  a.step(1 / 60, NO_INPUT);
  return a.prompt?.id;
}

/** 그 칸에서 그쪽을 보고 누른다 (want 를 눌렀는지 확인) → 대본 끝까지의 대사 */
function use(a: Adv, x: number, y: number, dir: Facing, want: string): string[] {
  assert.equal(stand(a, x, y, dir), want, `(${x},${y}) ${dir} 에서 ${want} 을 누를 수 있어야 한다`);
  a.step(1 / 60, { ...NO_INPUT, act: true });
  return finish(a);
}

/** 고르기가 있는 것을 눌러 k 번째를 고른다 */
function useAnswer(a: Adv, x: number, y: number, dir: Facing, want: string, k: number): string[] {
  assert.equal(stand(a, x, y, dir), want, `(${x},${y}) ${dir} 에서 ${want}`);
  a.step(1 / 60, { ...NO_INPUT, act: true });
  return answer(a, k);
}

/** 동료가 자기 자리에 갈 때까지 기다렸다가, 옆에 서서 말을 걸고 「같이 가자」 */
function callPal(a: Adv, h: Pal): string[] {
  const home = a.palHome(h)!;
  for (let i = 0; i < 60 * 30; i++) {
    const q = a.stage.actors[h];
    if (Math.floor(q.x / TILE) === home[0] && Math.floor(q.y / TILE) === home[1] && !q.moving) break;
    a.step(1 / 60, NO_INPUT);
  }
  const side = ([[-1, 0, 'right'], [1, 0, 'left'], [0, 1, 'up'], [0, -1, 'down']] as const).find(([dx, dy]) => !a.solid(home[0] + dx, home[1] + dy))!;
  const lines = use(a, home[0] + side[0], home[1] + side[1], side[2], `pal_${h}`);
  assert.ok(a.withMe().includes(h), `${h} 를 불러 왔다`);
  return lines;
}

/** 지금 조종 인물이 (sx, sy) 에서 걸어서 닿는 칸 */
function reachable(a: Adv, sx: number, sy: number): Set<string> {
  const seen = new Set<string>([`${sx},${sy}`]);
  const q: [number, number][] = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.pop()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = `${x + dx},${y + dy}`;
      if (!seen.has(k) && !a.solid(x + dx, y + dy)) {
        seen.add(k);
        q.push([x + dx, y + dy]);
      }
    }
  }
  return seen;
}

/** 걸어서 닿는 이웃 칸에서 그 물건을 보고 살펴본다 (닿지 않으면 실패) */
function visit(a: Adv, t: Thing, from: Set<string>): string[] {
  const [x, y] = 'at' in t ? t.at : [0, 0];
  for (const [dx, dy, dir] of [[0, 1, 'up'], [-1, 0, 'right'], [1, 0, 'left'], [0, -1, 'down']] as const) {
    if (!from.has(`${x + dx},${y + dy}`)) continue;
    if (stand(a, x + dx, y + dy, dir) !== t.id) continue;
    a.step(1 / 60, { ...NO_INPUT, act: true });
    return finish(a);
  }
  assert.fail(`${t.id} (${x},${y}) 에 걸어서 다가가 살펴볼 수 없다`);
}

/** 기억 하나: 걷는 기억이면 실을 모두 줍고, 아니면 장면을 끝까지 → 장 방으로 돌아옴 */
function liveMemory(a: Adv, room: string, id: string): void {
  for (let guard = 0; guard < 40 && (a.room.id !== room || a.resume); guard++) {
    const t = a.things().find((x) => (x.kind === 'thread' && !a.flags[x.id]) || (x.kind === 'spot' && !a.flags[`seen_${x.id}`]));
    if (!t || !('at' in t)) break;
    a.place(px(t.at[0]), px(t.at[1]));
    a.face('up');
    a.step(1 / 60, NO_INPUT);
    if (a.prompt) {
      a.step(1 / 60, { ...NO_INPUT, act: true });
      finish(a);
    }
    a.flags[`seen_${t.id}`] = true;
  }
  assert.equal(a.room.id, room, `${id}: 장 방으로 돌아오지 않았다`);
  assert.equal(a.flags[`mem_${id}`], true, `${id}: 기억 깃발`);
}

/** 모든 기억에 걸어가 닿아 본다 (지금 보이는 것만 · 장 시작 자리에서) */
function allMemories(a: Adv, room: string): void {
  const r = ROOMS[room]();
  const start = chOf(room).start;
  for (const m of r.things.filter(isMemory)) {
    if (a.flags[`mem_${m.id}`]) continue;
    const here = reachable(a, start[0], start[1]);
    let live = a.things().find((t) => t.id === m.id);
    if (!live && m.dark) {
      // 어둠 속 물건: 곁으로 걸어가 나비 등불이 따라와 비출 때까지
      const side = [[0, 1], [-1, 0], [1, 0], [0, -1]].find(([dx, dy]) => here.has(`${m.at[0] + dx},${m.at[1] + dy}`))!;
      a.place(px(m.at[0] + side[0]), px(m.at[1] + side[1]));
      idle(a, 2);
      finish(a);
      live = a.things().find((t) => t.id === m.id);
    }
    assert.ok(live, `${m.id}: 지금 보이지 않는다`);
    visit(a, live, here);
    liveMemory(a, room, m.id);
  }
  assert.deepEqual(a.memories(), { got: r.things.filter(isMemory).length, total: r.things.filter(isMemory).length });
}

const idle = (a: Adv, secs: number, inp: AdvInput = NO_INPUT) => {
  for (let t = 0; t < secs - 1e-9; t += 1 / 60) a.step(1 / 60, inp);
};
const tileOf = (a: Adv): [number, number] => [Math.floor(a.stage.actors.toby.x / TILE), Math.floor(a.stage.actors.toby.y / TILE)];
/** 지켜보는 이가 그 박자가 될 때까지 기다린다 (토비는 숨은 칸에서) */
function waitStep(a: Adv, id: string, step: number): void {
  for (let i = 0; i < 60 * 30 && a.watchState(id)?.step !== step; i++) a.step(1 / 60, NO_INPUT);
  assert.equal(a.watchState(id)?.step, step, `${id} 박자 ${step}`);
}
const goals = (room: string): string[] => {
  const r = ROOMS[room]();
  const scripts = [chOf(room).intro, ...r.things.flatMap((t) => ('scene' in t && t.scene ? [t.scene] : []))];
  return scripts.flatMap(flat).flatMap((c) => (c.t === 'goal' && c.text ? [c.text] : []));
};
const keepLooks = (r: RoomDef) => Object.fromEntries(r.things.filter(isMemory).map((m) => [m.id, m.kind === 'keepsake' ? m.look : '구슬']));

// ───────────────────────── 하루 방: 세 장이 같은 배치 ─────────────────────────

describe('하루 방 공용 배치 (4 · 8 · 18장)', () => {
  const rs = ['underbed', 'schoolbag', 'toybox'].map((id) => ROOMS[id]());

  test('세 장 모두 사람 크기 집 지도 (26×17)에 장난감이 걷고, 벽 · 문 · 침대 밑 칸이 똑같다', () => {
    for (const r of rs) {
      assert.equal(r.scale, 'human', r.id);
      assert.equal(r.toys, true, r.id);
      assert.deepEqual([r.w, r.h], [HARU.w, HARU.h], r.id);
    }
    const frame = (r: RoomDef) => r.tiles.map((row) => row.replace(/[^WXDU]/g, '.'));
    assert.deepEqual(frame(rs[1]), frame(rs[0]));
    assert.deepEqual(frame(rs[2]), frame(rs[0]));
    // 침대 밑은 사람에게 막히고 장난감에게 열린 칸 (U), 하루 방 문은 복도와 이어진다
    const [bx, by, bw, bh] = HARU.bed;
    for (let y = by; y < by + bh; y++) for (let x = bx; x < bx + bw; x++) assert.equal(rs[0].tiles[y][x], 'U', `침대 밑 (${x},${y})`);
    assert.equal(rs[0].tiles[HARU.door[1]][HARU.door[0]], 'D');
  });

  test('앵커(침대 · 책상 · 옷장 · 창)와 이삿짐이 놓이고, 밤마다 다른 것이 있다 (하루 · 빈 침대 · 장난감 상자)', () => {
    const kinds = (r: RoomDef) => (r.furniture ?? []).map((f) => f.kind);
    for (const r of rs) {
      const k = kinds(r).map((x) => x.split(':')[0]);
      for (const want of ['haruBed', 'desk', 'wardrobe', 'shelf', 'window', 'hangerRack', 'cartonL', 'cartonM', 'wasteBin']) assert.ok(k.includes(want), `${r.id}: ${want}`);
      assert.ok((r.furniture ?? []).filter((f) => f.fg).length >= 1, `${r.id}: 앞쪽 가림막`);
      assert.ok((r.furniture ?? []).filter((f) => ['tapeBit', 'markerPen', 'newsSheet', 'slipper', 'coin', 'button', 'hairBand', 'dragMarks'].includes(f.kind.split(':')[0])).length >= 12, `${r.id}: 잔 소품`);
      assert.ok(r.beams?.length, `${r.id}: 창 달빛`);
    }
    assert.ok(kinds(rs[0]).includes('haruBed:yarn'), '4장: 노란 털실이 늘어진 이불');
    assert.ok(kinds(rs[1]).includes('haruBed:empty') && kinds(rs[1]).includes('chairBag'), '8장: 빈 침대 · 의자에 걸린 책가방');
    assert.ok(kinds(rs[2]).includes('toybox') && !kinds(rs[0]).includes('toybox'), '18장에만 장난감 상자');
    // 잠든 하루: 4 · 18장은 침대 위 (잠든 사람 npc · 아직 바꾸지 않은 방은 지켜보는 이), 8장은 없다 (화장실)
    const haru = (r: RoomDef) => r.things.find((t): t is Extract<Thing, { kind: 'watcher' | 'npc' }> => (t.kind === 'watcher' || t.kind === 'npc') && t.actor === 'haru15');
    assert.deepEqual(haru(rs[0])?.at, HARU.haru);
    assert.equal(haru(rs[1]), undefined);
    assert.ok(haru(rs[2]));
  });

  test('기억 물건 그림은 모두 그려지고 (20칸 이상), 한 방 안에서 서로 다르다', () => {
    for (const r of [...rs, ROOMS.newroom_toy()]) {
      const ks = r.things.filter((t) => t.kind === 'keepsake');
      assert.equal(r.things.filter((t) => t.kind === 'memory').length, 0, `${r.id}: 구슬`);
      const looks = ks.map((k) => (k.kind === 'keepsake' ? k.look : ''));
      assert.deepEqual(looks.filter((l, i) => looks.indexOf(l) !== i), [], `${r.id}: 겹친 그림`);
      for (const l of looks) assert.ok((lookPix(l, r.look)?.count() ?? 0) >= 20, `${r.id}: 「${l}」 그림`);
    }
  });
});

// ───────────────────────── 4장 · 침대 밑 ─────────────────────────

describe('4장 · 침대 밑: 잠든 하루 숨바꼭질 → 나비 → 더스티 설득 → 짝잃이 배달 → 접다 만 종이별', () => {
  const ROOM = 'underbed';
  const r = ROOMS[ROOM]();

  test('기억 일곱은 하루 방의 물건 (원피스 · 유리병 · 상자 자국 · 휴대폰 · 먼지 자국 · 빵 끈 · 머그잔 자국)', () => {
    assert.deepEqual(keepLooks(r), { m3a: 'dressBag', m3b: 'jar', m3c: 'boxMark', m3d: 'phone', m3e: 'dustGhost', m3f: 'breadTie', m3g: 'mugRings' });
  });

});

// ───────────────────────── 8장 · 하루의 책가방 ─────────────────────────

describe('8장 · 하루의 책가방: 지퍼 협동 당기기 → 필통 사람들 설득 → 앞주머니의 노란 별', () => {
  const ROOM = 'schoolbag';
  const r = ROOMS[ROOM]();

  test('기억 일곱은 하루 방의 물건 (도시락 주머니 · 만두 별 · 공책 · 껌 종이 반지 · 외투 · 교복 단추 · 편지)', () => {
    assert.deepEqual(keepLooks(r), { mJa: 'lunchbox', mJb: 'paperstar', mJc: 'book', mJg: 'hairBand:yellow', mJd: 'coat', mJe: 'button', mJf: 'letter' });
    assert.equal(r.things.some((t) => t.kind === 'gap' || t.kind === 'block'), false, '옛 밧줄 틈 · 덩어리는 없다');
  });

  test('기억이나 다른 방에서 돌아와도 열린 가방 · 나온 필통 사람들은 그대로다', () => {
    const a = start(ROOM);
    a.flags.zip_open = true;
    a.goRoom('desk');
    a.goRoom(ROOM);
    assert.equal(a.stage.props['chairBag@7,4']?.state, 'open');
    assert.equal(a.stage.props['pencilFolks@8,5']?.state, 'out');
  });
});

// ───────────────────────── 18장 · 장난감 상자 ─────────────────────────

describe('18장 · 장난감 상자: 넷이 뚜껑 들기 → 크레용 그림 여섯 조각 맞추기 → 하루 냄새로 곰 대장 깨우기', () => {
  const ROOM = 'toybox';
  const r = ROOMS[ROOM]();

  test('기억 일곱은 하루 방의 물건 (선물 상자 · 손 그림 · 맞춘 그림 · 보리차 컵 · 크레용 · 베개 · 이름표)', () => {
    assert.deepEqual(keepLooks(r), { m9a: 'xmasbox', m9b: 'card', m9c: 'photo', m9d: 'cup', m9e: 'pen', m9f: 'cushion', m9g: 'letter' });
    // 9막: 조각 배달 놀이는 걷어 내고, 크레용 기억 뒤에 넷이 조각을 물어 와 맞추는 장면 하나 (crayon_done)
    assert.equal(r.things.filter((t) => t.kind === 'part').length, 0, '조각 배달 놀이는 없다');
    const pic = r.things.find((t) => t.id === 'crayon_pic');
    assert.ok(pic && pic.kind === 'spot' && pic.when === 'mem_m9e');
    assert.ok(pic.scene.some((c) => c.t === 'if' && c.else?.some((x) => x.t === 'flag' && x.name === 'crayon_done')));
  });

  test('하루는 깊이 잠들어 숨바꼭질이 없다: 지켜보는 이가 없고, 침대 앞을 오래 서성여도 아무 일 없으며, 머리맡에선 잠꼬대만', () => {
    assert.equal(r.things.filter((t) => t.kind === 'watcher').length, 0);
    const a = start(ROOM);
    assert.equal(a.stage.actors.haru_dawn?.pose, 'sleep', '침대 위 잠든 하루');
    a.place(px(16), px(3));
    idle(a, 6);
    assert.equal(a.runner, null);
    assert.equal(a.watchCells('haru_dawn').size, 0);
    a.place(px(17), px(3));
    a.step(1 / 60, NO_INPUT);
    assert.ok(finish(a).some((l) => /잠꼬대/.test(l)));
    assert.equal(a.flags.trig_haru_mumble, true);
  });

});

// ───────────────────────── 에필로그 · 새 방 ─────────────────────────

describe('에필로그 · 새 방: 「가져온 짐」 풀기 → 선반 자리 정하기 → 야광 별 북두칠성 → 「하루가 웃은 날」 유리병', () => {
  const ROOM = 'newroom_toy';
  const r = ROOMS[ROOM]();

  test('새집의 첫 겨울 낮: 사람 크기 새 방 (하루 방과 다른 배치), 첫눈 창 · 선반 · 할머니 의자 · 풀다 만 상자', () => {
    assert.equal(r.scale, 'human');
    assert.equal(r.toys, true);
    assert.notDeepEqual([r.w, r.h], [HARU.w, HARU.h]);
    const kinds = (r.furniture ?? []).map((f) => f.kind);
    for (const k of ['window:snow', 'shelf', 'chairOld:plain', 'cartonOpen', 'cartonHalf', 'plant', 'desk:jar', 'bed:#e8c860']) assert.ok(kinds.includes(k), k);
    assert.ok(r.ambient && r.ambient[0] > 200, '낮 (밤의 어둠이 아니다)');
    assert.deepEqual(keepLooks(r), { mEPa: 'boxKeep', mEPb: 'bowl', mEPc: 'scarf', mEPd: 'stickerBag', mEPe: 'cushion', mEPf: 'phone' });
  });

});
