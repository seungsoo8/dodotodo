/**
 * 갈래 D 장 방: 13장 베란다 · 14장 소파 밑 · 15장 비 오는 마당 · 16장 골목 끝 놀이터.
 * 장을 시작해 놀이(바람 · 물뿌리개 배달 · 루루 안내 · TV 빛 · 동전 탑 · 물길 · 개굴 형 · 얼룩이 · 등불 · 그네)를
 * 실제로 걷고 · 밀고 · 줍고 · 당겨 풀면 깃발이 서고, 모든 기억 물건에 닿고, 기억의 문으로 다음 장에 간다.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Adv, isMemory, NO_INPUT, type AdvInput } from '../adv.ts';
import { CHAPTERS, ROOMS, STORY } from '../story/index.ts';
import { px } from '../stage.ts';
import { TILE, isSolidChar } from '../../maps.ts';
import type { Cmd, Facing, Pt, RoomDef, Thing } from '../types.ts';
import { lookPix } from '../../../ui/render/looks.ts';
import { residentSprite } from '../../../ui/art/houseProps.ts';
import { RESIDENTS_D } from '../../../ui/art/props_d.ts';

type PalId = 'bori' | 'ruru' | 'nabi';

function flat(cmds: readonly Cmd[]): Cmd[] {
  return cmds.flatMap((c) => (c.t === 'if' ? [c, ...flat(c.then), ...flat(c.else ?? [])] : [c]));
}

const chapterOf = (room: string) => CHAPTERS.find((c) => c.room === room)!;

/** 그 장을 바로 시작하고 들어오는 대본을 끝까지 */
function start(room: string): Adv {
  const a = new Adv(STORY);
  a.runner = null;
  (a as unknown as { queue: unknown[] }).queue = [];
  (a as unknown as { applyChapter(n: number): void }).applyChapter(chapterOf(room).n);
  finish(a);
  return a;
}

/** 대본 · 놀이가 끝날 때까지 넘기며 나온 대사를 모은다 (작은 놀이는 다 한 것으로) */
function finish(a: Adv, limit = 120): string[] {
  const lines: string[] = [];
  for (let i = 0; i < limit * 60 && (a.runner || a.mini); i++) {
    if (a.mini) a.mini.done = true;
    const d = a.stage.dialog;
    if (d && lines[lines.length - 1] !== d.text) lines.push(d.text);
    a.step(1 / 60, { ...NO_INPUT, act: i % 2 === 0 });
  }
  return lines;
}

const tileOf = (a: Adv): [number, number] => [Math.floor(a.stage.actors.toby.x / TILE), Math.floor(a.stage.actors.toby.y / TILE)];
const idle = (a: Adv, secs: number, inp: AdvInput = NO_INPUT) => {
  for (let t = 0; t < secs - 1e-9; t += 1 / 60) a.step(1 / 60, inp);
};
const walkIn = (x: number, y: number): AdvInput => ({ ...NO_INPUT, move: { x, y } });

/** 조건이 설 때까지 가만히 (대본이 뜨면 넘긴다). 못 서면 실패 */
function waitUntil(a: Adv, ok: () => boolean, secs: number, why: string): void {
  for (let t = 0; t < secs; t += 1 / 60) {
    if (ok()) return;
    if (a.runner) finish(a);
    a.step(1 / 60, NO_INPUT);
  }
  assert.fail(`기다려도 안 된다: ${why}`);
}

/** 칸 가운데를 차례로 걸어간다 (방향 키로). 다 가면 true, 시간이 다 되면 false */
function walkPath(a: Adv, cells: readonly Pt[], secs = 20): boolean {
  let t = 0;
  for (const [cx, cy] of cells) {
    for (; t < secs; t += 1 / 60) {
      if (a.runner) return false;
      const p = a.stage.actors.toby;
      const dx = px(cx) - p.x;
      const dy = px(cy) - p.y;
      if (Math.abs(dx) <= 2.5 && Math.abs(dy) <= 2.5) break;
      a.step(1 / 60, walkIn(Math.abs(dx) > 2.5 ? Math.sign(dx) : 0, Math.abs(dy) > 2.5 ? Math.sign(dy) : 0));
    }
    if (t >= secs) return false;
  }
  return true;
}

/** 그 칸에 서서 그쪽을 보고 (안내 대사는 먼저 넘기고) 누른다 → 대본 끝까지. 누른 것의 id 와 대사 */
function useAt(a: Adv, x: number, y: number, dir: Facing): { id: string | undefined; lines: string[] } {
  a.place(px(x), px(y));
  a.face(dir);
  a.step(1 / 60, NO_INPUT);
  finish(a);
  a.face(dir);
  a.step(1 / 60, NO_INPUT);
  const id = a.prompt?.id;
  a.step(1 / 60, { ...NO_INPUT, act: true });
  return { id, lines: finish(a) };
}

/** 동료가 자기 자리에 갈 때까지 기다렸다가, 옆에 서서 말을 걸고 「같이 가자」 */
function callPal(a: Adv, h: PalId): void {
  const home = a.palHome(h)!;
  for (let i = 0; i < 60 * 30; i++) {
    const q = a.stage.actors[h];
    if (Math.floor(q.x / TILE) === home[0] && Math.floor(q.y / TILE) === home[1] && !q.moving) break;
    a.step(1 / 60, NO_INPUT);
  }
  const side = ([[-1, 0, 'right'], [1, 0, 'left'], [0, 1, 'up'], [0, -1, 'down']] as const).find(([dx, dy]) => !a.solid(home[0] + dx, home[1] + dy))!;
  assert.equal(useAt(a, home[0] + side[0], home[1] + side[1], side[2]).id, `pal_${h}`);
  assert.ok(a.withMe().includes(h), `${h} 를 불러 왔다`);
}

/** 지금 조종 인물이 (sx, sy) 에서 걸어서 닿는 칸 (밀 물건 · 높이 · 물웅덩이 · 낮은 천장 모두 지금 상태로) */
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
    const r = useAt(a, x + dx, y + dy, dir);
    if (r.id === t.id) return r.lines;
  }
  assert.fail(`${t.id} (${x},${y}) 에 걸어서 다가가 살펴볼 수 없다`);
}

/** 기억 하나: 걷는 기억이면 실을 모두 줍고, 직접 움직이는 기억이면 그 방의 살펴볼 곳을 차례로 → 장 방으로 돌아옴 */
function liveMemory(a: Adv, room: string, id: string): void {
  for (let guard = 0; guard < 40 && (a.room.id !== room || a.resume); guard++) {
    const t = a.things().find((x) => (x.kind === 'thread' && !a.flags[x.id]) || (x.kind === 'spot' && !a.flags[`seen_${x.id}`]));
    if (!t || t.kind === 'trigger' || t.kind === 'seq' || t.kind === 'chase') break;
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

/** 모든 기억을 지금 걸어서 닿는 곳에서 살펴보고, 기억의 문으로 다음 장 */
function memoriesThenLink(a: Adv, room: string, doneFlag: string, from: () => Set<string>): void {
  const r = ROOMS[room]();
  const link = r.things.find((t) => t.kind === 'link')!;
  assert.ok(visit(a, link, from()).length > 0, '기억을 다 보기 전에는 잠긴 문 대사');
  assert.equal(a.flags[doneFlag], undefined, '기억을 다 보기 전에는 문이 열리지 않는다');
  for (const m of r.things.filter(isMemory)) {
    // 놀이 중에 이미 본 기억은 건너뛴다
    if (a.flags[`mem_${m.id}`]) continue;
    visit(a, m, from());
    liveMemory(a, room, m.id);
  }
  assert.deepEqual(a.memories(), { got: r.things.filter(isMemory).length, total: r.things.filter(isMemory).length });
  visit(a, link, from());
  assert.equal(a.flags[doneFlag], true);
  const ch = chapterOf(room);
  assert.equal(a.save.chapter, CHAPTERS[CHAPTERS.indexOf(ch) + 1].n, '다음 장으로');
}

/** 장 방의 공통 모양: 기억은 모두 그림이 있는 물건, 목표 문구는 이야기 단계 */
function commonShape(room: string, looks: Record<string, string>): RoomDef {
  const r = ROOMS[room]();
  const mems = r.things.filter(isMemory);
  assert.ok(mems.every((m) => m.kind === 'keepsake'), '공중 구슬 없이 모두 물건');
  assert.deepEqual(Object.fromEntries(mems.map((m) => [m.id, m.kind === 'keepsake' ? m.look : ''])), looks);
  for (const m of mems) {
    if (m.kind !== 'keepsake') continue;
    const p = lookPix(m.look, r.look);
    assert.ok(p && p.count() >= 20, `${m.id}: 「${m.look}」 그림`);
    assert.ok(!isSolidChar(r.tiles[m.at[1]][m.at[0]]), `${m.id} (${m.at}) 은 걸을 수 있는 칸`);
  }
  const own = r.things.filter((t) => !isMemory(t)).flatMap((t) => ('scene' in t && t.scene ? [t.scene] : []));
  const goals = [chapterOf(room).intro, ...own].flatMap(flat).filter((c): c is Extract<Cmd, { t: 'goal' }> => c.t === 'goal' && !!c.text);
  assert.ok(goals.length >= 3, `목표 ${goals.length}개`);
  for (const g of goals) assert.ok(!/기억 조각|개를 찾자/.test(g.text!), g.text!);
  return r;
}

// ───────────────────────── 13장 베란다 ─────────────────────────

describe('13장 베란다 (사람 크기 · 바람)', () => {
  const room = 'balcony';

  test('거실 끝과 베란다를 미닫이 문턱으로 이은 사람 크기 지도: 바깥 창 · 세탁기 · 빨래 건조대 · 하루 꽃, 윗층 빨래 · 앞 가림막', () => {
    const r = commonShape(room, { mVa: 'nameStick', mVb: 'feather', mVc: 'flowers', mVd: 'foxBag', mVe: 'towel', mVf: 'photo', mVg: 'trowel' });
    assert.equal(r.scale, 'human');
    assert.equal(r.toys, true);
    assert.deepEqual(r.looks?.map((l) => l.look), ['living', 'balcony']);
    assert.equal(r.tiles[8][7], 'D');
    assert.equal(r.tiles[9][7], 'D');
    const kinds = new Set((r.furniture ?? []).map((f) => f.kind.split(':')[0]));
    for (const k of ['balconyWin', 'washer', 'dryingRack', 'haruFlower', 'pots', 'faucet', 'grandClock', 'frameGhost', 'cartonL']) assert.ok(kinds.has(k), k);
    assert.ok((r.furniture ?? []).some((f) => f.over), '윗층 (빨래)');
    assert.ok((r.furniture ?? []).some((f) => f.fg), '앞쪽 가림막');
    assert.equal(r.winds?.length, 2);
    assert.ok(r.things.some((t) => t.kind === 'npc' && t.actor === 'clothespins'), '빨래집게 자매');
  });

  test('바람: 불 때 바람 길에 서 있으면 거실 쪽으로 밀려나고, 빨래 그늘에서는 안 밀린다', () => {
    const a = start(room);
    waitUntil(a, () => !!a.windState('gust1')?.blowing, 6, '바람 1');
    a.place(px(17), px(5));
    idle(a, 0.5);
    assert.ok(tileOf(a)[0] < 16, `밀려났다 ${tileOf(a)}`);
    waitUntil(a, () => !!a.windState('gust1')?.blowing, 6, '바람 1 다시');
    a.place(px(17), px(7));
    idle(a, 0.6);
    assert.deepEqual(tileOf(a), [17, 7], '빨래 그늘');
  });

  test('바람을 건너 물뿌리개(무거움 · 보리)를 하루 꽃까지 나르면 꽃이 고개를 들고 이름표가 드러난다 → 기억을 모두 보고 빨간 실로 다음 장', () => {
    const a = start(room);
    assert.match(a.stage.goal ?? '', /하루 꽃/);
    const first = a.stage.goal;
    // 바람 길 앞에 처음 서면 안내 · 목표가 바뀐다
    walkPath(a, [[8, 8], [14, 8], [15, 8]]);
    finish(a);
    assert.equal(tileOf(a)[0], 15, '거실에서 미닫이 문턱을 넘어 베란다로');
    assert.notEqual(a.stage.goal, first);
    // 빨래집게 자매
    const pins = ROOMS[room]().things.find((t) => t.id === 'pins')!;
    assert.ok(visit(a, pins, new Set(['21,5'])).some((l) => /꽉 잡아/.test(l)));
    assert.equal(a.flags.met_pins, true);
    // 물뿌리개: 보리 없이는 못 든다
    useAt(a, 13, 5, 'up');
    assert.deepEqual(a.held(), []);
    callPal(a, 'bori');
    assert.equal(useAt(a, 13, 5, 'up').id, 'wcan');
    assert.deepEqual(a.held(), ['wcan']);
    // 무거운 걸 들고 바람이 멎은 틈에 두 바람 길을 건넌다
    a.place(px(15), px(8));
    waitUntil(a, () => a.windState('gust1')?.blowing === true, 6, '바람 1');
    waitUntil(a, () => a.windState('gust1')?.blowing === false, 6, '바람 1 멎음');
    assert.ok(walkPath(a, [[20, 8]], 3), '바람 1 을 건넜다');
    finish(a);
    assert.equal(tileOf(a)[0], 20);
    a.place(px(23), px(8));
    waitUntil(a, () => a.windState('gust2')?.blowing === true, 6, '바람 2');
    waitUntil(a, () => a.windState('gust2')?.blowing === false, 6, '바람 2 멎음');
    walkPath(a, [[29, 8]], 4);
    finish(a);
    assert.ok(tileOf(a)[0] >= 28, `바람 2 를 건넜다 ${tileOf(a)}`);
    assert.equal(a.flags.seen_flower, true, '하루 꽃 앞 안내');
    assert.match(a.stage.goal ?? '', /물뿌리개/);
    // 물을 붓는 자리
    assert.equal(a.things().some((t) => t.id === 'mVa'), false, '물을 주기 전엔 이름표가 안 보인다');
    assert.equal(useAt(a, 31, 7, 'up').id, 'flowerAsm');
    assert.equal(a.flags.flower_watered, true);
    assert.equal(a.stage.props['haruFlower@31,5']?.state, 'up');
    assert.ok(a.things().some((t) => t.id === 'mVa'));
    assert.match(a.stage.goal ?? '', /빨간 실/);
    // 세탁기 위 봉지: 루루 밧줄
    assert.equal(a.things().some((t) => t.id === 'mVd'), false);
    useAt(a, 9, 5, 'up');
    assert.equal(a.flags.bag_down, undefined, '루루 없이는 못 당긴다');
    callPal(a, 'ruru');
    assert.equal(useAt(a, 9, 5, 'up').id, 'bagPull');
    assert.equal(a.flags.bag_down, true);
    assert.ok(a.things().some((t) => t.id === 'mVd'));
    // 기억을 모두 보고 빨간 실 (기억의 문)
    memoriesThenLink(a, room, 'chv_done', () => reachable(a, 4, 8));
  });
});

// ───────────────────────── 14장 소파 밑 ─────────────────────────

describe('14장 소파 밑 (근접 · 루루 안내 · TV 빛 · 낮은 천장 · 동전 탑)', () => {
  const room = 'sofa';

  test('장난감 눈높이 근접 지도: 걸레받이 · 소파 다리 넷 · 성냥갑 · 리모컨 · 동전 탑 · 술 장식 가림막 · 천장 윗층, 주민 백원 할배', () => {
    const r = commonShape(room, { mRa: 'capsule', mRb: 'furTuft', mRc: 'scratcherTip', mRd: 'threadRed', mRe: 'penCap', mRf: 'coinGiant:100' });
    assert.equal(r.scale, 'toy');
    assert.ok(r.w >= 36 && r.h >= 18, `${r.w}×${r.h}`);
    const furn = r.furniture ?? [];
    assert.equal(furn.filter((f) => f.kind === 'sofaLeg').length, 4);
    const kinds = new Set(furn.map((f) => f.kind.split(':')[0]));
    for (const k of ['skirtBoard', 'matchbox', 'remoteGiant', 'coinGiant', 'crumbHill', 'dustBunny', 'sock', 'toothpicks', 'bottleCap', 'fringe', 'sofaBottom', 'spring']) assert.ok(kinds.has(k), k);
    assert.ok(furn.some((f) => f.over) && furn.some((f) => f.fg));
    assert.equal(r.low?.length, 1);
    assert.ok(r.things.some((t) => t.kind === 'npc' && t.actor === 'coinElder'));
  });

  test('루루를 따라 아지트로 → TV 빛이 꺼진 틈에 건너기 (켜졌을 때 움직이면 들킨다) → 보리는 아래 길로 → 동전 넷을 모아 탑 → 기억을 모두 보고 노란 우산 끝으로', () => {
    const a = start(room);
    const ch = chapterOf(room);
    assert.ok(!a.save.party.includes('ruru'), '루루는 앞장서 달린다');
    assert.match(a.stage.goal ?? '', /루루를 따라/);
    // ── 루루 안내: 따라붙을 때마다 다음 자리로, 넷째에 아지트
    for (let n = 1; n <= 4; n++) {
      const g = a.stage.actors.ruru_lead;
      waitUntil(a, () => !a.stage.actors.ruru_lead.goal, 5, `루루가 ${n}번째 자리에 섰다`);
      a.place(g.x + 14, g.y);
      a.step(1 / 60, NO_INPUT);
      finish(a);
      assert.equal(a.chaseState('ruru_lead')!.caught, n);
    }
    assert.equal(a.flags.ruru_led, true);
    assert.ok(a.save.party.includes('ruru'), '아지트에서 무리에 낀다');
    assert.ok(a.things().some((t) => t.id === 'mRa'), '보물 상자 속 캡슐');
    // ── TV 빛 마루에 처음 들어서면 아빠가 뒤척여 위쪽 통로 천장이 내려앉는다
    a.place(px(13), px(10));
    assert.ok(walkPath(a, [[14, 10]], 2) || a.runner);
    finish(a);
    assert.equal(a.flags.dad_turned, true);
    assert.equal(a.solid(25, 6), false, '토비 혼자는 낮은 천장 밑을 지나간다');
    // 빛이 켜졌을 때 빛 속에서 움직이면 들킨다
    a.place(px(19), px(11));
    waitUntil(a, () => a.watchState('tvlight')!.step === 0, 6, 'TV 빛이 꺼짐');
    waitUntil(a, () => a.watchState('tvlight')!.step === 1, 6, 'TV 빛이 켜짐');
    idle(a, 1, walkIn(0, -1));
    finish(a);
    assert.equal(a.watchState('tvlight')!.caught, 1, '빛 속에서 움직여 들켰다');
    assert.deepEqual(tileOf(a), ch.start, '들어온 칸으로 돌아왔다');
    // 꺼진 틈에 건너면 괜찮다
    a.place(px(14), px(10));
    waitUntil(a, () => a.watchState('tvlight')!.step === 1, 6, '켜짐');
    waitUntil(a, () => a.watchState('tvlight')!.step === 0, 6, '꺼짐');
    assert.ok(walkPath(a, [[22, 10]], 2.4), '꺼진 틈에 빛 마루를 건넜다');
    assert.equal(a.watchState('tvlight')!.caught, 1, '더 들키지 않았다');
    // ── 동전: 십 원 · 오십 원 (가볍다)
    assert.equal(useAt(a, 15, 5, 'up').id, 'c10');
    assert.equal(useAt(a, 10, 16, 'down').id, 'c50');
    // 보리를 데려가면 위쪽 통로는 막히고, 아래쪽 울타리 문의 굳은 과자를 민다
    callPal(a, 'bori');
    assert.equal(a.solid(25, 6), true, '보리와 함께면 낮은 천장 밑을 못 지나간다');
    assert.ok(!reachable(a, 22, 10).has('30,10'), '보리와 함께 동전 마을에 못 간다 (과자 덩어리 전)');
    assert.equal(useAt(a, 26, 15, 'right').id, 'bR');
    assert.ok(reachable(a, 22, 10).has('30,10'), '굳은 과자를 밀자 아래 길이 열렸다');
    // 오백 원은 무겁다 (보리가 있어서 든다)
    assert.equal(useAt(a, 21, 15, 'down').id, 'c500');
    assert.deepEqual(a.held().sort(), ['c10', 'c50', 'c500']);
    // 백원 할배를 만나고, 백 원을 주워, 탑 자리에
    const meet = useAt(a, 32, 8, 'right');
    assert.equal(meet.id, 'coin');
    assert.ok(meet.lines.some((l) => /백원 할배/.test(l)));
    assert.match(a.stage.goal ?? '', /동전 넷/);
    assert.equal(useAt(a, 32, 9, 'right').id, 'coinTower');
    assert.deepEqual(a.assembled('coinTower'), { placed: 3, need: 4, done: false }, '오백 · 오십 · 십 — 하나 모자란다');
    assert.equal(useAt(a, 33, 6, 'up').id, 'c100');
    assert.equal(useAt(a, 32, 9, 'right').id, 'coinTower');
    assert.equal(a.flags.tower_done, true);
    assert.ok(a.things().some((t) => t.id === 'mRf'), '탑 꼭대기의 백원 할배 (서른한 번째)');
    // 모든 기억 → 노란 우산 끝
    memoriesThenLink(a, room, 'chr_done', () => reachable(a, ch.start[0], ch.start[1]));
  });
});

// ───────────────────────── 15장 비 오는 마당 ─────────────────────────

describe('15장 비 오는 마당 (사람 크기 · 물길 · 개굴 형)', () => {
  const room = 'yard';

  test('집 뒷벽 · 처마(윗층) · 툇마루(높이 1, 댓돌) · 장독대 · 빨랫줄 · 꽃밭 · 돌담 · 큰 덤불 · 대문, 비가 내리는 바깥', () => {
    const r = commonShape(room, { m8a: 'raincoatButton', m8b: 'cotton', m8c: 'umbrella', m8d: 'clothespin', m8e: 'cushion', m8f: 'looseStone', m8g: 'flashlight' });
    assert.equal(r.scale, 'human');
    assert.equal(r.toys, true);
    assert.equal(r.weather, 'rain');
    assert.equal(r.elev?.[4][8], '1', '툇마루는 높이 1');
    assert.equal(r.tiles[5][8], 'S', '툇마루 앞면');
    const kinds = new Set((r.furniture ?? []).map((f) => f.kind.split(':')[0]));
    for (const k of ['facade', 'eaves', 'crocks', 'clothesline', 'flowers', 'stonewall', 'bush', 'gate', 'tub', 'daetdol', 'swing']) assert.ok(kinds.has(k), k);
    assert.ok(r.looks?.some((l) => l.look === 'gmNight'), '툇마루는 나무 마루');
  });

  test('벽돌로 아래 물길만 막아 돌담 틈을 말리고 (위 갈래를 막으면 대야가 마른다 → 되돌리기), 개굴 형을 따라 덤불 밑까지 → 노란 우산으로 다음 장', () => {
    const a = start(room);
    const ch = chapterOf(room);
    a.step(1 / 60, NO_INPUT);
    assert.equal(a.flags.tub_full, true);
    assert.equal(a.flags.gap_pool, true);
    assert.equal(a.solid(21, 12), true, '돌담 틈은 물웅덩이');
    assert.ok(!reachable(a, 2, 4).has('26,16'), '덤불 밑에 못 간다');
    // 보리 없이는 벽돌이 안 밀린다
    useAt(a, 16, 11, 'right');
    assert.deepEqual(a.blockAt('brick'), [17, 11]);
    callPal(a, 'bori');
    // 위 갈래를 막으면: 대야가 마르고 돌담 틈은 그대로
    for (const y of [12, 11, 10]) assert.equal(useAt(a, 17, y, 'up').id, 'brick');
    a.step(1 / 60, NO_INPUT);
    assert.deepEqual(a.blockAt('brick'), [17, 8]);
    assert.ok(!a.flags.tub_full, '대야가 말랐다');
    assert.equal(a.flags.gap_pool, true);
    assert.equal(a.flags.water_turned, undefined);
    // 홈통 옆에서 벽돌을 처음 자리로
    assert.equal(useAt(a, 20, 5, 'up').id, 'undoBrick');
    assert.deepEqual(a.blockAt('brick'), [17, 11]);
    // 아래 갈래를 막는다 (오른쪽으로 두 번)
    assert.equal(useAt(a, 16, 11, 'right').id, 'brick');
    assert.equal(useAt(a, 17, 11, 'right').id, 'brick');
    a.step(1 / 60, NO_INPUT);
    finish(a);
    assert.deepEqual(a.blockAt('brick'), [19, 11]);
    assert.equal(a.flags.tub_full, true, '대야는 찬다');
    assert.ok(!a.flags.gap_pool, '돌담 틈이 말랐다');
    assert.equal(a.flags.water_turned, true);
    assert.match(a.stage.goal ?? '', /개굴 형/);
    assert.ok(reachable(a, 2, 4).has('26,16'), '덤불 밑으로 갈 수 있다');
    // 개굴 형: 네 번 따라붙기
    assert.equal(a.things().some((t) => t.id === 'm8c'), false);
    for (let n = 1; n <= 4; n++) {
      waitUntil(a, () => !a.stage.actors.gaegul.goal, 6, `개구리가 ${n}번째 자리에`);
      const g = a.stage.actors.gaegul;
      a.place(g.x + 14, g.y);
      a.step(1 / 60, NO_INPUT);
      finish(a);
      assert.equal(a.chaseState('gaegul')!.caught, n);
    }
    assert.equal(a.flags.frog_met, true);
    assert.ok(a.things().some((t) => t.id === 'm8c'), '뒤집힌 우산');
    // 툇마루 (높이 1) 는 댓돌로만
    assert.equal(a.solid(8, 4), true, '마당에서 툇마루로 그냥 못 올라간다');
    assert.equal(useAt(a, 12, 6, 'up').id, 'daetdol');
    assert.equal(a.stage.actors.toby.elev, 1);
    const onMaru = reachable(a, 12, 4);
    const m8e = ROOMS[room]().things.find((t) => t.id === 'm8e')!;
    visit(a, m8e, onMaru);
    liveMemory(a, room, 'm8e');
    a.place(px(12), px(4));
    a.step(1 / 60, NO_INPUT);
    assert.equal(useAt(a, 12, 4, 'down').id, 'daetdol');
    assert.equal(a.stage.actors.toby.elev, 0);
    memoriesThenLink(a, room, 'ch8_done', () => reachable(a, ch.start[0], ch.start[1]));
  });
});

// ───────────────────────── 16장 골목 끝 놀이터 ─────────────────────────

describe('16장 골목 끝 놀이터 (사람 크기 바깥 · 얼룩이 · 가로등 · 그네)', () => {
  const room = 'outside';

  test('골목(아스팔트)과 놀이터(모래)를 울타리 틈으로 이은 바깥 지도: 대문 · 구멍가게 · 가로등 셋 · 주차된 차(밑) · 도랑 · 그네, 순찰하는 얼룩이', () => {
    const r = commonShape(room, { mOUa: 'palmPrint', mOUb: 'footSticker', mOUc: 'icecream', mOUd: 'bench', mOUe: 'scarf', mOUf: 'sticks2' });
    assert.equal(r.toys, true);
    assert.deepEqual(r.looks?.map((l) => l.look), ['alley', 'playground']);
    const furn = r.furniture ?? [];
    assert.equal(furn.filter((f) => f.kind === 'lamp').length, 3, '가로등 셋');
    assert.ok(furn.some((f) => f.kind === 'car' && f.under), '차 밑에 숨는다');
    for (const k of ['gate', 'shop', 'pole', 'ditch', 'milkCrate', 'swingset', 'slide', 'sandbox', 'jungle', 'bench', 'wires']) assert.ok(furn.some((f) => f.kind.split(':')[0] === k), k);
    assert.ok(r.tiles.some((row) => row.includes('U')), '차 밑 칸');
    const cat = r.things.find((t) => t.kind === 'watcher');
    assert.ok(cat && cat.kind === 'watcher' && cat.actor === 'alleyCat' && cat.pattern.some((p) => p.at));
    assert.ok(r.lantern && r.lantern.zones?.length);
  });

  test('얼룩이 시야에 들키면 숨었던 곳으로 → 숨을 곳을 이어 골목을 지나 담판 → 도랑(루루) → 어둠 속 등불(나비) → 운동화(보리) → 넷이 그네를 밀고 → 벤치 위 두 별로', () => {
    const a = start(room);
    const ch = chapterOf(room);
    const cat = () => a.stage.actors.cat;
    // 들킴: 고양이 시야 한가운데 서 있으면 → 들어온 칸(대문 앞)으로
    waitUntil(a, () => a.watchState('cat')!.step === 1, 12, '얼룩이가 아래를 본다');
    const [cx, cy] = [Math.floor(cat().x / TILE), Math.floor(cat().y / TILE)];
    a.place(px(cx), px(cy + 2));
    idle(a, 1.2);
    finish(a);
    assert.equal(a.watchState('cat')!.caught, 1);
    assert.deepEqual(tileOf(a), ch.start, '대문 앞으로 돌아왔다');
    // 숨을 곳을 이어 간다: 대문 옆 (8,4) → 차 밑 → 우유 상자 (15,11) → 도랑 앞
    assert.ok(walkPath(a, [[8, 4]], 3));
    waitUntil(a, () => a.watchState('cat')!.step === 0 && cat().x > px(11), 14, '얼룩이가 오른쪽으로 걸어간다');
    assert.ok(walkPath(a, [[8, 7], [10, 7], [10, 9]], 4), '차 밑으로');
    waitUntil(a, () => a.watchState('cat')!.step === 0 && cat().x > px(16), 14, '얼룩이가 더 멀리');
    assert.ok(walkPath(a, [[13, 9], [13, 11], [15, 11]], 4), '우유 상자로');
    waitUntil(a, () => a.watchState('cat')!.step === 2 && cat().x < px(14), 14, '얼룩이가 왼쪽으로 돌아간다');
    walkPath(a, [[19, 11], [21, 11]], 4);
    finish(a);
    assert.equal(a.watchState('cat')!.caught, 1, '더 들키지 않고 지나왔다');
    assert.equal(a.flags.cat_deal, true, '나비의 「고양이끼리」 담판');
    assert.match(a.stage.goal ?? '', /가로등/);
    // 도랑: 루루 밧줄
    useAt(a, 22, 10, 'right');
    assert.equal(a.flags.gap_gOut, undefined, '루루 없이는 못 건다');
    callPal(a, 'ruru');
    assert.equal(useAt(a, 22, 10, 'right').id, 'gOut');
    assert.equal(a.flags.gap_gOut, true);
    assert.ok(reachable(a, 22, 10).has('25,10'), '도랑을 건넌다');
    // 어둠 속: 나비를 데려가면 등불이 줄고, 가로등 밑에서 찬다. 어두운 기억은 등불 안에서만 보인다
    callPal(a, 'nabi');
    a.place(px(25), px(13));
    const r0 = a.lanternR();
    idle(a, 9);
    assert.ok(a.lanternR() < r0 - 2, `어둠에서 등불이 줄었다 ${r0} → ${a.lanternR()}`);
    assert.equal(a.things().some((t) => t.id === 'mOUd'), false, '멀리 있는 어두운 정류장 의자는 안 보인다');
    a.place(px(29), px(6));
    idle(a, 2);
    assert.ok(a.lanternR() > r0 - 0.01, '가로등 밑에서 다시 찼다');
    assert.ok(walkPath(a, [[29, 8], [25, 8], [25, 15], [28, 15]], 6));
    idle(a, 0.5);
    assert.ok(a.things().some((t) => t.id === 'mOUd'), '등불 안에서 정류장 의자가 보인다');
    // 울타리 틈 운동화: 보리
    callPal(a, 'bori');
    assert.equal(useAt(a, 30, 10, 'right').id, 'bOut');
    assert.notDeepEqual(a.blockAt('bOut'), [31, 10]);
    a.place(px(33), px(10));
    a.step(1 / 60, NO_INPUT);
    finish(a);
    assert.equal(a.flags.in_park, true);
    // 그네: 혼자서는 꿈쩍도 안 한다 → 셋을 모두 불러 와 넷이 함께 여섯 번
    a.call('all', false);
    assert.ok(useAt(a, 45, 5, 'up').lines.some((l) => /불러 와야/.test(l)));
    assert.equal(a.pullCount('swingPush'), 0);
    for (const h of ['bori', 'ruru', 'nabi'] as const) callPal(a, h);
    assert.deepEqual(a.withMe().sort(), ['bori', 'nabi', 'ruru']);
    for (let n = 1; n <= 6; n++) {
      assert.equal(a.flags.swing_pushed, undefined, `${n - 1}번으로는 아직`);
      assert.equal(useAt(a, 45, 5, 'up').id, 'swingPush');
    }
    assert.equal(a.flags.swing_pushed, true);
    assert.ok(a.things().some((t) => t.id === 'mOUe'), '그네 줄의 노란 목도리');
    // 모든 기억 → 벤치 위의 두 별. 어두운 기억 앞에서는 나비가 옆에 있다 (place 가 따라오는 동료를 옮긴다)
    a.call('nabi', true);
    memoriesThenLink(a, room, 'lOut_done', () => reachable(a, ch.start[0], ch.start[1]));
  });
});

describe('갈래 D 주민 그림', () => {
  test('빨래집게 자매 · 백원 할배 · 개굴 형 · 얼룩이: 네 방향 · 두 박자 모두 그려지고, 왼쪽은 오른쪽을 뒤집은 것', () => {
    for (const k of RESIDENTS_D)
      for (const d of ['down', 'up', 'left', 'right'] as const)
        for (const f of [0, 1]) {
          const p = residentSprite(k, d, f);
          assert.ok(p && p.count() >= 60, `${k} ${d} ${f}`);
        }
    for (const k of RESIDENTS_D) {
      const l = residentSprite(k, 'left', 0)!;
      const r = residentSprite(k, 'right', 0)!.flipped();
      assert.ok(l.w === r.w && l.px.every((v, i) => v === r.px[i]), k);
    }
    // 얼룩이는 장난감(토비)보다 크다 (진짜 고양이)
    assert.ok(residentSprite('alleyCat', 'down', 0)!.h > residentSprite('frogBro', 'down', 0)!.h);
  });
});
