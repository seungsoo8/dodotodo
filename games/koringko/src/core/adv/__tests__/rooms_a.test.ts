/**
 * 갈래 A 방 (사람 크기 하루 방 · 새 방): 4장 침대 밑 · 8장 책가방 · 18장 장난감 상자 · 에필로그 새 방.
 * 장마다 처음부터 끝까지 실제로 풀어 본다: 놀이를 차례로 (숨바꼭질 · 등불 · 설득 · 배달 · 당기기 · 맞추기 · 순서),
 * 동료를 말 걸어 부르고, 모든 기억 물건에 걸어가 닿고, 기억의 문으로 다음 장 (에필로그는 크레디트).
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Adv, isMemory, NO_INPUT, type AdvInput } from '../adv.ts';
import { CHAPTERS, ROOMS, STORY } from '../story/index.ts';
import { HARU } from '../story/layout_a.ts';
import { px } from '../stage.ts';
import { TILE } from '../../maps.ts';
import { lookPix } from '../../../ui/render/looks.ts';
import type { Cmd, Facing, RoomDef, Thing } from '../types.ts';

type Pal = 'bori' | 'ruru' | 'nabi';
const chOf = (room: string) => CHAPTERS.find((c) => c.room === room)!;

function flat(cmds: readonly Cmd[]): Cmd[] {
  return cmds.flatMap((c) => (c.t === 'if' ? [c, ...flat(c.then), ...flat(c.else ?? [])] : [c]));
}

/** 장을 바로 시작하고 들어오는 대본을 끝까지 */
function start(room: string): Adv {
  const a = new Adv(STORY);
  a.runner = null;
  (a as unknown as { queue: unknown[] }).queue = [];
  (a as unknown as { applyChapter(n: number): void }).applyChapter(chOf(room).n);
  finish(a);
  return a;
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
    // 잠든 하루: 4 · 18장은 침대 위 (지켜보는 이), 8장은 없다 (화장실)
    const haru = (r: RoomDef) => r.things.find((t): t is Extract<Thing, { kind: 'watcher' }> => t.kind === 'watcher' && t.actor === 'haru15');
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

  test('목표는 이야기 단계 (개수 · 「기억 조각」 없이), 다섯 단계 이상', () => {
    const g = goals(ROOM);
    assert.ok(new Set(g).size >= 5, g.join(' / '));
    for (const x of g) assert.ok(!/기억 조각|\d|개를 찾자/.test(x), x);
  });

  test('잠든 하루: 실눈을 뜬 동안 시야에 머물면 들켜 숨은 곳으로 돌아가고, 원피스 비닐 속 · 침대 밑은 안 보인다', () => {
    const a = start(ROOM);
    assert.equal(a.room.id, ROOM);
    assert.ok(a.stage.actors.haru_sleep, '침대 위 하루');
    assert.deepEqual(tileOf(a), [...chOf(ROOM).start]);
    // 숨은 곳: 원피스 비닐 커버 속 (14,4) — 하루의 실눈 시야 안이지만 안 보인다
    a.place(px(14), px(4));
    a.step(1 / 60, NO_INPUT);
    waitStep(a, 'haru_sleep', 1);
    const open = a.watchCells('haru_sleep');
    assert.ok(open.size > 10, `실눈 시야 ${open.size}칸`);
    assert.ok(open.has('17,3') && open.has('15,3') && open.has('14,4'), '창 밑 달빛 자리 · 원피스 자리는 시야 안');
    assert.ok(!open.has('14,8') && !open.has('15,8'), '상자 뒤 그림자는 가려진다');
    idle(a, 1.5);
    assert.equal(a.runner, null);
    assert.equal(a.watchState('haru_sleep')?.caught, 0);
    // 달빛 자리로 나가 머물면 들킨다 → 원피스 속 (마지막 숨은 곳) 으로
    a.place(px(16), px(3));
    idle(a, 0.5);
    assert.equal(a.runner, null, 'grace 안 (0.5초)');
    idle(a, 0.5);
    assert.ok(a.runner, '0.8초 넘게 시야 안');
    const lines = finish(a);
    assert.ok(lines.some((l) => /누구… 있어/.test(l)), lines.join(' / '));
    assert.equal(a.watchState('haru_sleep')?.caught, 1);
    assert.deepEqual(tileOf(a), [14, 4]);
    // 눈을 감은 동안은 같은 자리도 괜찮다 (결곗값: 박자 0)
    waitStep(a, 'haru_sleep', 2);
    a.place(px(16), px(3));
    idle(a, 1.5);
    assert.equal(a.watchState('haru_sleep')?.caught, 1, '눈 감은 동안');
    // 침대 밑 (U) 은 장난감만 지나가고, 하루 눈에 안 보인다
    assert.equal(a.solid(20, 4), false);
    waitStep(a, 'haru_sleep', 3);
    a.place(px(20), px(4));
    a.step(1 / 60, NO_INPUT);
    finish(a);
    idle(a, 1.5);
    assert.equal(a.watchState('haru_sleep')?.caught, 1);
    assert.equal(a.flags.trig_bed_in, true, '침대 밑에 들어섰다');
  });

  test('휴대폰 알림 빛: 빛나는 동안 가만히 있으면 괜찮고, 움직이면 들킨다', () => {
    const a = start(ROOM);
    a.place(px(21), px(7));
    a.step(1 / 60, NO_INPUT);
    waitStep(a, 'phone_glow', 1);
    assert.ok(a.watchCells('phone_glow').has('21,7'), '침대 발치는 빛 안');
    idle(a, 1.5);
    assert.equal(a.runner, null, '꼼짝 않으면 괜찮다');
    for (let i = 0; i < 90 && !a.runner; i++) a.step(1 / 60, { ...NO_INPUT, move: { x: i % 30 < 15 ? 1 : -1, y: 0 } });
    assert.ok(a.runner, '빛 속에서 움직이면 들킨다');
    assert.ok(finish(a).some((l) => /휴대폰 화면/.test(l)));
    assert.equal(a.watchState('phone_glow')?.caught, 1);
  });

  test('처음부터 끝까지: 나비를 찾고, 더스티를 설득하고, 짝을 배달하고, 기억을 모두 보고, 접다 만 별로 다음 장', () => {
    const a = start(ROOM);
    assert.match(a.stage.goal ?? '', /침대 밑/);
    assert.deepEqual(a.save.party, ['toby', 'bori', 'ruru']);
    // 침대 밑 어둠 속 빵 끈 · 짝잃이는 아직 보이지 않는다
    assert.ok(!a.things().some((t) => t.id === 'm3f' || t.id === 'sock_pair'));

    // ── 나비: 침대 밑을 지나 벽 틈에서
    const here = reachable(a, ...([...chOf(ROOM).start] as [number, number]));
    assert.ok(here.has('21,4') && here.has('24,4'), '침대 밑을 지나 벽 틈까지 걸어간다');
    use(a, 21, 4, 'right', 'nabi_lost');
    assert.equal(a.flags.found_nabi, true);
    assert.ok(a.save.party.includes('nabi'));
    assert.ok(a.withMe().includes('nabi'), '나비가 등불을 들고 따라온다');
    assert.match(a.stage.goal ?? '', /나비의 등불/);
    // 등불: 침대 밑 어둠에서는 줄고, 휴대폰 화면 곁에서 다시 찬다
    const r0 = a.lanternR();
    a.place(px(20), px(4));
    idle(a, 3);
    assert.ok(a.lanternR() < r0, `침대 밑에서 등불이 준다 ${r0} → ${a.lanternR()}`);
    assert.ok(a.lanternR() >= 1.6 - 1e-9, '최소 반지름 밑으로는 안 준다');
    const low = a.lanternR();
    waitStep(a, 'phone_glow', 0);
    a.place(px(21), px(5));
    idle(a, 1);
    assert.ok(a.lanternR() > low, '휴대폰 화면 곁에서 찬다');

    // ── 더스티: 이유를 대면 재채기, 「같이 들어 줄게」 면 길을 연다
    const wrong = useAnswer(a, 22, 4, 'right', 'dustbun', 0);
    assert.equal(a.flags.dusty_ok, undefined);
    assert.ok(wrong.some((l) => /재채기/.test(l)), wrong.join(' / '));
    useAnswer(a, 22, 4, 'right', 'dustbun', 1);
    assert.equal(a.flags.dusty_ok, undefined, '두고 가려고 → 틀림');
    useAnswer(a, 22, 4, 'right', 'dustbun', 2);
    assert.equal(a.flags.dusty_ok, true);
    assert.match(a.stage.goal ?? '', /짝잃이/);
    assert.ok(a.things().some((t) => t.id === 'sock_pair'), '짝잃이가 나온다');
    assert.ok(a.things().some((t) => t.id === 'm3f'), '등불 안에 빵 끈이 보인다');

    // 기억의 문(별)은 짝을 찾아 주기 전에는 잠겨 있다 (기억을 다 보기 전)
    const locked = use(a, 24, 4, 'up', 'l3');
    assert.ok(locked.some((l) => /어둠 속에 기억/.test(l)));

    // ── 짝 배달: 무거워서 보리가 있어야 든다
    use(a, 18, 12, 'down', 'sock_mate');
    assert.deepEqual(a.held(), [], '보리 없이는 못 든다');
    callPal(a, 'bori');
    use(a, 18, 12, 'down', 'sock_mate');
    assert.deepEqual(a.held(), ['sock_mate']);
    use(a, 21, 4, 'right', 'sock_pair');
    assert.equal(a.flags.sock_paired, true);
    assert.match(a.stage.goal ?? '', /반쯤 접힌 별/);

    // ── 기억 일곱: 걸어가 닿아 모두 본다 (나비 등불이 있어야 어둠 속 빵 끈)
    allMemories(a, ROOM);

    // ── 접다 만 종이별 → 다음 장
    const next = CHAPTERS[CHAPTERS.indexOf(chOf(ROOM)) + 1];
    use(a, 24, 4, 'up', 'l3');
    assert.equal(a.flags.ch3_done, true);
    assert.equal(a.save.chapter, next.n);
  });

  test('짝을 찾아 주기 전에는 기억을 다 보아도 별 앞을 짝잃이가 막는다 (다음 장으로 안 간다)', () => {
    const a = start(ROOM);
    for (const m of r.things.filter(isMemory)) a.flags[`mem_${m.id}`] = true;
    a.flags.found_nabi = true;
    const lines = use(a, 24, 4, 'up', 'l3');
    assert.ok(lines.some((l) => /짝을 찾아 주기 전엔/.test(l)), lines.join(' / '));
    assert.equal(a.flags.ch3_done, undefined);
    assert.equal(a.save.chapter, chOf(ROOM).n);
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

  test('목표는 이야기 단계 (개수 · 「기억 조각」 없이), 네 단계 이상', () => {
    const g = goals(ROOM);
    assert.ok(new Set(g).size >= 4, g.join(' / '));
    for (const x of g) assert.ok(!/기억 조각|\d|개를 찾자/.test(x), x);
  });

  test('처음부터 끝까지: 루루 · 보리를 불러 지퍼를 세 번 당기고, 필통 사람 셋을 설득하고, 기억을 모두 보고, 노란 별로 다음 장', () => {
    const a = start(ROOM);
    assert.equal(a.room.id, ROOM);
    assert.equal(a.stage.actors.haru_sleep, undefined, '하루는 화장실 (침대가 비었다)');
    assert.deepEqual(a.withMe(), []);
    // 가방에서 나온 것들은 지퍼를 열기 전엔 없다
    const shown = () => a.things().filter(isMemory).map((t) => t.id).sort();
    assert.deepEqual(shown(), ['mJd', 'mJe', 'mJg']);

    // ── 지퍼: 혼자서는 꿈쩍 않는다 → 루루 · 보리를 불러 「하나! 둘! 셋!」
    const alone = use(a, 7, 6, 'up', 'zipper');
    assert.ok(alone.some((l) => /불러 와야겠어/.test(l)), alone.join(' / '));
    assert.equal(a.pullCount('zipper'), 0);
    callPal(a, 'ruru');
    const half = use(a, 7, 6, 'up', 'zipper');
    assert.ok(half.some((l) => /보리/.test(l)), '보리가 아직 없다');
    callPal(a, 'bori');
    assert.match(a.stage.goal ?? '', /지퍼/);
    use(a, 7, 6, 'up', 'zipper');
    use(a, 7, 6, 'up', 'zipper');
    assert.equal(a.flags.zip_open, undefined, '두 번으로는 아직');
    assert.equal(a.pullCount('zipper'), 2);
    use(a, 7, 6, 'up', 'zipper');
    assert.equal(a.flags.zip_open, true);
    assert.equal(a.stage.props['chairBag@7,4']?.state, 'open');
    assert.equal(a.stage.props['pencilFolks@8,5']?.state, 'out');
    assert.deepEqual(a.withMe(), [], '일을 마친 루루 · 보리는 자기 자리로');
    assert.deepEqual(shown(), ['mJa', 'mJb', 'mJc', 'mJd', 'mJe', 'mJg'], '쏟아진 도시락 · 별 · 공책');
    assert.match(a.stage.goal ?? '', /필통 사람들/);

    // ── 필통 사람들: 틀린 말엔 비켜 주지 않고, 다시 물으면 다시 고를 수 있다
    const no = useAnswer(a, 9, 6, 'up', 'pc_mal', 0);
    assert.ok(no.some((l) => /비켜 줄 수 없어/.test(l)), no.join(' / '));
    assert.equal(a.flags.pc_mal, undefined);
    useAnswer(a, 9, 6, 'up', 'pc_mal', 1);
    assert.equal(a.flags.pc_mal, true);
    useAnswer(a, 8, 6, 'up', 'pc_mong', 2);
    assert.equal(a.flags.pc_mong, undefined, '「새 연필 사면 되잖아」 는 틀림');
    useAnswer(a, 10, 6, 'up', 'pc_ban', 0);
    assert.equal(a.flags.pc_ban, true);
    assert.equal(a.flags.pencils_ok, undefined, '아직 둘');
    assert.ok(!a.things().some((t) => t.id === 'mJf'), '앞주머니 편지는 아직');
    const last = useAnswer(a, 8, 6, 'up', 'pc_mong', 1);
    assert.ok(last.some((l) => /허락한다/.test(l)), last.join(' / '));
    assert.equal(a.flags.pencils_ok, true);
    assert.match(a.stage.goal ?? '', /노란 별과 편지/);
    // 이미 설득한 필통 사람은 다시 묻지 않는다
    assert.ok(!use(a, 9, 6, 'up', 'pc_mal').some((l) => /지워 줄게/.test(l)));

    // ── 기억 일곱 → 노란 별 → 다음 장 (책상)
    allMemories(a, ROOM);
    const next = CHAPTERS[CHAPTERS.indexOf(chOf(ROOM)) + 1];
    assert.equal(next.room, 'desk');
    const link = r.things.find((t) => t.kind === 'link')!;
    visit(a, link, reachable(a, HARU.start[0], HARU.start[1]));
    assert.equal(a.flags.chj_done, true);
    assert.equal(a.save.chapter, next.n);
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
    assert.equal(r.things.filter((t) => t.kind === 'part' && t.set === 'crayon').length, 6, '크레용 그림 조각 여섯');
  });

  test('목표는 이야기 단계 (개수 · 「기억 조각」 없이), 다섯 단계 이상', () => {
    const g = goals(ROOM);
    assert.ok(new Set(g).size >= 5, g.join(' / '));
    for (const x of g) assert.ok(!/기억 조각|\d|개를 찾자/.test(x), x);
  });

  test('하루는 깊이 잠들어 숨바꼭질이 없다: 침대 앞을 오래 서성여도 들키지 않고, 머리맡에선 잠꼬대만', () => {
    const a = start(ROOM);
    assert.ok(a.stage.actors.haru_dawn, '침대 위 하루');
    a.place(px(16), px(3));
    idle(a, 6);
    assert.equal(a.runner, null);
    assert.equal(a.watchCells('haru_dawn').size, 0);
    a.place(px(17), px(3));
    a.step(1 / 60, NO_INPUT);
    assert.ok(finish(a).some((l) => /잠꼬대/.test(l)));
    assert.equal(a.flags.trig_haru_mumble, true);
    assert.equal(a.watchState('haru_dawn')?.caught, 0);
  });

  test('처음부터 끝까지: 셋을 불러 뚜껑을 들고, 조각 여섯을 맞추고, 머리끈으로 곰 대장을 깨우고, 기억을 모두 보고, 크레용 그림으로 다음 장', () => {
    const a = start(ROOM);
    assert.match(a.stage.goal ?? '', /크레용 그림/);
    assert.equal(a.things().some((t) => t.kind === 'part'), false, '뚜껑을 열기 전엔 조각이 없다');

    // ── 뚜껑: 둘로는 안 되고 넷이 (토비 + 보리 · 루루 · 나비)
    callPal(a, 'bori');
    callPal(a, 'ruru');
    const two = use(a, 15, 6, 'up', 'lid');
    assert.ok(two.some((l) => /나비/.test(l)), two.join(' / '));
    assert.equal(a.flags.lid_open, undefined);
    callPal(a, 'nabi');
    use(a, 15, 6, 'up', 'lid');
    assert.equal(a.flags.lid_open, true);
    assert.equal(a.stage.props['toybox@15,4']?.state, 'open');
    assert.match(a.stage.goal ?? '', /조각을 모아/);

    // ── 조각 맞추기: 하나 놓을 때마다 「앞으로 n개」, 여섯이면 그림이 돌아온다
    const parts = a.things().filter((t): t is Extract<Thing, { kind: 'part' }> => t.kind === 'part' && t.set === 'crayon');
    assert.equal(parts.length, 6);
    const first = parts[0];
    visit(a, first, reachable(a, HARU.start[0], HARU.start[1]));
    assert.deepEqual(a.held(), [first.id]);
    const one = use(a, 16, 6, 'up', 'crayon_pic');
    assert.ok(one.some((l) => /앞으로 5개/.test(l)), one.join(' / '));
    assert.deepEqual(a.assembled('crayon_pic'), { placed: 1, need: 6, done: false });
    for (const p of parts.slice(1)) visit(a, p, reachable(a, HARU.start[0], HARU.start[1]));
    assert.equal(a.held().length, 5, '가벼운 조각은 한꺼번에 든다');
    use(a, 16, 6, 'up', 'crayon_pic');
    assert.equal(a.flags.crayon_done, true);
    assert.match(a.stage.goal ?? '', /곰 대장/);

    // ── 곰 대장: 머리끈 없이 말을 걸면 코만 곤다 → 하루 머리맡 머리끈 → 곰 대장 앞
    use(a, 12, 6, 'up', 'bear_wake');
    assert.equal(a.flags.bear_awake, undefined, '하루 냄새가 없으면 안 깬다');
    use(a, 17, 4, 'up', 'hairtie');
    assert.deepEqual(a.held(), ['hairtie']);
    use(a, 12, 6, 'up', 'bear_wake');
    assert.equal(a.flags.bear_awake, true);
    assert.match(a.stage.goal ?? '', /약속의 날/);

    // ── 기억 일곱 (맞춘 그림 m9c 포함) → 크레용 그림 → 다음 장
    callPal(a, 'nabi');
    allMemories(a, ROOM);
    const next = CHAPTERS[CHAPTERS.indexOf(chOf(ROOM)) + 1];
    const link = r.things.find((t) => t.kind === 'link')!;
    visit(a, link, reachable(a, HARU.start[0], HARU.start[1]));
    assert.equal(a.flags.ch9_done, true);
    assert.equal(a.save.chapter, next.n);
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

  test('목표는 이야기 단계 (개수 · 「기억 조각」 없이), 다섯 단계 이상', () => {
    const g = goals(ROOM);
    assert.ok(new Set(g).size >= 5, g.join(' / '));
    for (const x of g) assert.ok(!/기억 조각|\d|개를 찾자/.test(x), x);
  });

  test('처음부터 끝까지: 상자를 풀고, 동료들 말을 듣고 선반 자리를 정하고, 북두칠성을 잇고, 기억을 모두 보고, 유리병에서 크레디트', () => {
    const a = start(ROOM);
    assert.equal(a.room.id, ROOM);
    assert.ok(!a.things().some((t) => t.id === 'mEPa' || t.id === 'shelf_place'), '상자를 풀기 전');

    // ── 상자 풀기: 보리 · 루루를 불러 테이프를 두 번
    const alone = use(a, 5, 11, 'up', 'unpack');
    assert.ok(alone.some((l) => /불러 와야겠어/.test(l)), alone.join(' / '));
    // 처음 말을 걸면 저마다 바라는 선반 자리를 말한다
    const heard = [...callPal(a, 'ruru'), ...callPal(a, 'bori')];
    use(a, 5, 11, 'up', 'unpack');
    assert.equal(a.flags.unpacked, undefined);
    use(a, 5, 11, 'up', 'unpack');
    assert.equal(a.flags.unpacked, true);
    assert.ok(a.things().some((t) => t.id === 'mEPa'), '가져온 짐');
    assert.match(a.stage.goal ?? '', /선반/);

    // ── 자리 정하기: 나비에게도 말을 걸어 바라는 자리를 듣는다 (첫 말)
    heard.push(...callPal(a, 'nabi'));
    assert.ok(heard.some((l) => /문 쪽 칸/.test(l)) && heard.some((l) => /침대가 보이는 칸/.test(l)) && heard.some((l) => /맨 위 칸/.test(l)), heard.join(' / '));
    // 틀리게 고르면 웃긴 한마디 · 깃발 없음 (보리를 창가에)
    assert.equal(stand(a, 6, 5, 'up'), 'shelf_place');
    a.step(1 / 60, { ...NO_INPUT, act: true });
    const pick = (k: number) => {
      for (let i = 0; i < 60 * 60 && a.runner && !a.stage.choice; i++) a.step(1 / 60, { ...NO_INPUT, act: i % 2 === 0 });
      assert.ok(a.stage.choice);
      a.stage.choice!.sel = k;
      a.step(1 / 60, { ...NO_INPUT, act: true });
    };
    pick(0);
    pick(1);
    pick(3);
    finish(a);
    assert.equal(a.flags.place_bori, undefined, '보리를 창가에 → 틀림');
    assert.equal(a.flags.place_nabi, true);
    assert.equal(a.flags.place_ruru, true);
    assert.equal(a.flags.placed_all, undefined);
    // 다시 물으면 남은 보리만
    assert.equal(stand(a, 6, 5, 'up'), 'shelf_place');
    a.step(1 / 60, { ...NO_INPUT, act: true });
    pick(2);
    finish(a);
    assert.equal(a.flags.placed_all, true);
    assert.match(a.stage.goal ?? '', /북두칠성/);

    // ── 북두칠성: 차례를 틀리면 처음부터, 손잡이 끝부터 국자 끝까지 밟으면 빛난다
    const keys = r.things.find((t): t is Extract<Thing, { kind: 'seq' }> => t.kind === 'seq')!.keys.map((k) => k.at);
    assert.equal(keys.length, 7);
    const stepOn = ([x, y]: readonly [number, number]) => {
      a.place(px(x), px(y));
      a.step(1 / 60, NO_INPUT);
      finish(a);
    };
    stepOn(keys[0]);
    stepOn(keys[2]);
    assert.deepEqual(a.seqState('dipper')?.pressed, [], '건너뛰면 처음부터');
    for (const k of keys) stepOn(k);
    assert.equal(a.flags.dipper_done, true);
    a.step(1 / 60, NO_INPUT);
    finish(a);
    assert.equal(a.flags.trig_dipper_lit, true);
    assert.match(a.stage.goal ?? '', /하루가 웃은 날/);

    // ── 기억 여섯 → 새 유리병 → 크레디트 · 끝 깃발
    allMemories(a, ROOM);
    const link = r.things.find((t) => t.kind === 'link')!;
    visit(a, link, reachable(a, ...([...chOf(ROOM).start] as [number, number])));
    assert.equal(a.flags.ending, true);
  });
});
