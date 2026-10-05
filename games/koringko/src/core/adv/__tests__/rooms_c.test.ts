/**
 * 갈래 C 의 사람 크기 집 지도 장 (3장 안방 · 7장 현관 · 10장 욕실 · 12장 부엌 과자 서랍 · 19장 부엌 찬장):
 * 장을 시작해 놀이를 차례로 실제로 풀고 (살펴보기 · 밀기 · 당기기 · 밟기 · 오르기 · 걷기 · 미끄러지기),
 * 동료를 말 걸어 불러 오고, 모든 기억에 걸어서 닿아 들여다보고, 기억의 문으로 다음 장에 간다.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Adv, isMemory, NO_INPUT, type AdvInput } from '../adv.ts';
import { CHAPTERS, ROOMS, STORY } from '../story/index.ts';
import { px } from '../stage.ts';
import { isSolidChar, TILE } from '../../maps.ts';
import type { Cmd, Facing, RoomDef, Thing } from '../types.ts';
import { lookPix } from '../../../ui/render/looks.ts';
import { KITCHEN_H, KITCHEN_W } from '../story/layout_c.ts';

type Pal = 'bori' | 'ruru' | 'nabi';
const chapterOf = (room: string) => CHAPTERS.find((c) => c.room === room)!;

function flat(cmds: readonly Cmd[]): Cmd[] {
  return cmds.flatMap((c) => (c.t === 'if' ? [c, ...flat(c.then), ...flat(c.else ?? [])] : [c]));
}

/** 그 장을 바로 시작하고 들어오는 대본을 끝까지 */
function start(room: string): Adv {
  const a = new Adv(STORY);
  a.runner = null;
  (a as unknown as { queue: unknown[] }).queue = [];
  (a as unknown as { applyChapter(n: number): void }).applyChapter(chapterOf(room).n);
  finish(a);
  return a;
}

/** 대본 · 놀이가 끝날 때까지 넘기며 나온 대사를 모은다 (작은 놀이는 다 한 것으로, 고르기는 pick 번째) */
function finish(a: Adv, pick = 0, limit = 120): string[] {
  const lines: string[] = [];
  for (let i = 0; i < limit * 60 && (a.runner || a.mini); i++) {
    if (a.mini) a.mini.done = true;
    if (a.stage.choice) a.stage.choice.sel = pick;
    const d = a.stage.dialog;
    if (d && lines[lines.length - 1] !== d.text) lines.push(d.text);
    a.step(1 / 60, { ...NO_INPUT, act: i % 2 === 0 });
  }
  assert.equal(a.runner, null, '대본이 끝나지 않는다');
  return lines;
}

const cellOf = (a: Adv): [number, number] => {
  const p = a.stage.actors.toby;
  return [Math.floor(p.x / TILE), Math.floor(p.y / TILE)];
};

/** 그 칸에 서서 그쪽을 본다 (밟으면 터지는 대본은 먼저 넘긴다) → 지금 누를 수 있는 것 */
function stand(a: Adv, x: number, y: number, dir: Facing, pick = 0): string | undefined {
  a.place(px(x), px(y));
  a.face(dir);
  a.step(1 / 60, NO_INPUT);
  finish(a, pick);
  a.face(dir);
  a.step(1 / 60, NO_INPUT);
  return a.prompt?.id;
}

/** 그 칸에서 그쪽을 보고 누른다: 눌린 것이 want 인지 확인하고 대본을 끝까지 → 나온 대사 */
function use(a: Adv, x: number, y: number, dir: Facing, want: string, pick = 0): string[] {
  assert.equal(stand(a, x, y, dir, pick), want, `(${x},${y}) ${dir} 에서 ${want} 을 누를 수 있어야 한다`);
  a.step(1 / 60, { ...NO_INPUT, act: true });
  return finish(a, pick);
}

/** 동료가 자기 자리에 갈 때까지 기다렸다가, 옆 (같은 높이) 에 서서 말을 걸고 「같이 가자」 */
function callPal(a: Adv, h: Pal): void {
  const home = a.palHome(h)!;
  for (let i = 0; i < 60 * 30; i++) {
    const q = a.stage.actors[h];
    if (Math.floor(q.x / TILE) === home[0] && Math.floor(q.y / TILE) === home[1] && !q.moving) break;
    if (a.runner) finish(a);
    else a.step(1 / 60, NO_INPUT);
  }
  const e = a.elevAt(home[0], home[1]);
  const open = (x: number, y: number) => !isSolidChar(a.room.tiles[y]?.[x]) && a.elevAt(x, y) === e;
  const side = ([[-1, 0, 'right'], [1, 0, 'left'], [0, 1, 'up'], [0, -1, 'down']] as const).find(([dx, dy]) => open(home[0] + dx, home[1] + dy))!;
  use(a, home[0] + side[0], home[1] + side[1], side[2], `pal_${h}`);
  assert.ok(a.withMe().includes(h), `${h} 를 불러 왔다`);
}

/** 지금 보이는 오르기 · 밀 물건 자리까지 따져, (sx, sy) 에서 걸어서 (오르기 포함) 닿는 칸 */
function reachAll(a: Adv, from: readonly [number, number]): Set<string> {
  const r = a.room;
  const climbs = a.things().flatMap((t) => (t.kind === 'climb' ? [[t.at, t.to], [t.to, t.at]] : []));
  const pushes = new Set(r.things.filter((t) => t.kind === 'push').map((t) => a.blockAt(t.id).join(',')));
  const open = (x: number, y: number) => {
    const c = r.tiles[y]?.[x];
    if (c === undefined || pushes.has(`${x},${y}`)) return false;
    return c === 'U' || !isSolidChar(c);
  };
  const seen = new Set<string>([from.join(',')]);
  const q: [number, number][] = [[from[0], from[1]]];
  while (q.length) {
    const [x, y] = q.pop()!;
    const next: [number, number][] = [];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (open(x + dx, y + dy) && a.elevAt(x + dx, y + dy) === a.elevAt(x, y)) next.push([x + dx, y + dy]);
    for (const [p, q2] of climbs) if (p[0] === x && p[1] === y) next.push([q2[0], q2[1]]);
    for (const n of next) {
      const k = n.join(',');
      if (!seen.has(k)) {
        seen.add(k);
        q.push(n);
      }
    }
  }
  return seen;
}

/** 걸어서 (오르기 포함) 닿는 이웃 칸에 서서 그 물건을 보고 누른다 (누를 수 없으면 null) */
function tryVisit(a: Adv, t: Thing, from: Set<string>, pick = 0): string[] | null {
  const [x, y] = 'at' in t ? t.at : [0, 0];
  for (const [dx, dy, dir] of [[0, 1, 'up'], [-1, 0, 'right'], [1, 0, 'left'], [0, -1, 'down']] as const) {
    if (!from.has(`${x + dx},${y + dy}`)) continue;
    if (stand(a, x + dx, y + dy, dir, pick) !== t.id) continue;
    a.step(1 / 60, { ...NO_INPUT, act: true });
    return finish(a, pick);
  }
  return null;
}
function visit(a: Adv, t: Thing, from: Set<string>, pick = 0): string[] {
  const r = tryVisit(a, t, from, pick);
  if (!r) assert.fail(`${t.id} (${'at' in t ? t.at : '?'}) 에 걸어서 다가가 살펴볼 수 없다`);
  return r;
}

/** 기억 하나: 걷는 기억이면 실을 모두 줍고, 직접 움직이는 기억이면 살펴볼 곳을 차례로 → 장 방으로 돌아옴 */
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

/** 모든 기억에 걸어서 (오르기 포함) 다가가 들여다보고, 기억의 문으로 다음 장 */
function allMemoriesThenLink(a: Adv, room: string, from: readonly [number, number], doneFlag: string): void {
  const r = ROOMS[room]();
  const link = r.things.find((t) => t.kind === 'link')!;
  // 기억을 다 보기 전에는 문이 잠겨 있다
  visit(a, link, reachAll(a, from));
  assert.equal(a.flags[doneFlag], undefined, '기억을 다 보기 전에 문이 열렸다');
  // 붙어 놓인 물건은 앞의 것을 먼저 들여다봐야 뒤의 것을 누를 수 있다: 누를 수 있는 것부터 차례로
  for (let left = r.things.filter(isMemory); left.length; ) {
    const m = left.find((q) => tryVisit(a, q, reachAll(a, from)));
    assert.ok(m, `걸어서 닿지 않는 기억: ${left.map((q) => q.id).join(', ')}`);
    liveMemory(a, room, m.id);
    left = left.filter((q) => !a.flags[`mem_${q.id}`]);
  }
  assert.deepEqual(a.memories(), { got: 7, total: 7 });
  visit(a, link, reachAll(a, from));
  assert.equal(a.flags[doneFlag], true);
  const ch = chapterOf(room);
  assert.equal(a.save.chapter, CHAPTERS[CHAPTERS.indexOf(ch) + 1].n, '다음 장으로');
}

/** 목표 문구: 장 시작 + 그 방 놀이 대본에서 (기억 장면 빼고) */
function goalsOf(room: string): string[] {
  const r = ROOMS[room]();
  const own = r.things.filter((t) => !isMemory(t)).flatMap((t) => ('scene' in t && t.scene ? [t.scene] : []));
  return [chapterOf(room).intro, ...own].flatMap(flat).flatMap((c) => (c.t === 'goal' && c.text ? [c.text] : []));
}

/** 공통: 사람 크기 집 지도 · 장난감이 걷고 · 앵커 소품 · 윗층 · 앞 가림 · 빛 · 동료 자리 · 이야기 목표 */
function commonChecks(room: string, anchors: string[], w: number, h: number): void {
  const r: RoomDef = ROOMS[room]();
  assert.equal(r.scale, 'human');
  assert.equal(r.toys, true);
  assert.deepEqual([r.w, r.h], [w, h]);
  const kinds = new Set((r.furniture ?? []).map((f) => f.kind.split(':')[0]));
  for (const k of anchors) assert.ok(kinds.has(k), `${room}: 소품 ${k} 이 없다`);
  assert.ok((r.furniture ?? []).some((f) => f.over), `${room}: 윗층 하나 이상`);
  const fg = (r.furniture ?? []).filter((f) => f.fg).length;
  assert.ok(fg >= 1 && fg <= 2, `${room}: 앞쪽 가림막 ${fg}`);
  assert.ok(r.beams?.length && r.lights?.length, `${room}: 창 빛 · 붙박인 빛`);
  // 걸을 수 있는 칸 위의 잔 소품 (이삿짐 데칼) 열 개 이상
  const decals = (r.furniture ?? []).filter((f) => ['tapeBit', 'markerPen', 'newsSheet', 'slipper', 'coin', 'button', 'hairBand', 'dragMarks', 'honeycandy', 'hairTie', 'eraserDust', 'paperStrips'].includes(f.kind.split(':')[0]));
  assert.ok(decals.length >= 6, `${room}: 잔 소품 ${decals.length}개`);
  for (const p of ['bori', 'ruru', 'nabi'] as const) {
    const hg = r.hangouts?.[p];
    assert.ok(hg, `${room}: ${p} 자리`);
    assert.ok(!isSolidChar(r.tiles[hg.at[1]][hg.at[0]]), `${room}: ${p} 자리가 막힌 칸`);
    assert.equal(flat(hg.talk ?? []).filter((c) => c.t === 'say').length, 2, `${room}: ${p} 처음 대사 두 줄`);
  }
  const goals = goalsOf(room);
  assert.ok(goals.length >= 3, `${room}: 목표 ${goals.length}개`);
  for (const g of goals) assert.ok(!/기억 조각|개를 찾자/.test(g), `${room}: 목표 「${g}」`);
  // 기억은 모두 그림이 있는 그 자리의 물건
  const mems = r.things.filter(isMemory);
  assert.equal(mems.length, 7);
  for (const m of mems) {
    assert.equal(m.kind, 'keepsake', `${room} ${m.id}`);
    if (m.kind === 'keepsake') assert.ok((lookPix(m.look, r.look)?.count() ?? 0) >= 20, `${room} ${m.id}: 「${m.look}」 그림`);
  }
}

const looks = (room: string) => Object.fromEntries(ROOMS[room]().things.filter(isMemory).map((m) => [m.id, m.kind === 'keepsake' ? `${m.look}@${m.at.join(',')}` : '구슬']));

// ───────────────────────── 3장 · 엄마의 화장대 (안방) ─────────────────────────

describe('3장 안방: 잠 못 드는 엄마 · 서랍 계단 · 손거울 빛 · 휴대폰 배달', () => {
  test('사람 크기 안방 26×16: 화장대 · 서랍장 · 엄마가 누운 침대 · 스탠드 · 건조대 · 「안방」 상자', () => {
    commonChecks('dresser', ['vanityMirror', 'surfaceTop', 'surfaceFront', 'bedMom', 'lamp', 'dryRack', 'jewelBox', 'perfume', 'cartonL', 'frameGhost', 'window', 'clock'], 26, 16);
    assert.deepEqual(looks('dresser'), { mMa: 'flowers@3,3', mMb: 'card@4,4', mMc: 'hairTie@5,6', mMd: 'towel@13,8', mMg: 'phone@21,5', mMe: 'bag@22,5', mMf: 'letter@23,5' });
    assert.equal(start('dresser').stage.goal, '잠 못 드는 엄마 곁에, 할머니 목소리가 든 휴대폰을 가져다 놓자');
  });

  test('엄마가 이쪽을 볼 때 움직이면 들켜 숨었던 곳으로 돌아가고, 가만히 있거나 침대 밑 · 건조대 밑에 숨으면 괜찮다', () => {
    const a = start('dresser');
    const look = () => {
      for (let i = 0; i < 60 * 12 && a.watchState('mom_eye')?.step !== 1; i++) a.step(1 / 60, NO_INPUT);
      assert.equal(a.watchState('mom_eye')?.step, 1, '엄마가 고개를 돌린다');
    };
    // 상자 그늘 (숨는 칸) 을 지나서 시야 안으로
    stand(a, 9, 11, 'up');
    look();
    a.place(px(12), px(5));
    a.step(1 / 60, NO_INPUT);
    assert.ok(a.watchCells('mom_eye').has('12,5'), '화장대 앞은 시야 안');
    // 가만히: 빛 안이어도 괜찮다 (스탠드 빛 · moveOnly)
    for (let i = 0; i < 40; i++) a.step(1 / 60, NO_INPUT);
    assert.equal(a.runner, null);
    // 움직이면 들킨다 → 숨었던 상자 그늘로
    for (let i = 0; i < 70 && !a.runner; i++) a.step(1 / 60, { ...NO_INPUT, move: { x: i % 40 < 20 ? 1 : -1, y: 0 } } as AdvInput);
    assert.ok(a.runner, '시야 안에서 움직이면 들킨다');
    const lines = finish(a);
    assert.ok(lines.some((l) => /뭐가 움직였나/.test(l)), lines.join(' / '));
    assert.equal(a.watchState('mom_eye')?.caught, 1);
    assert.deepEqual(cellOf(a), [9, 11], '마지막으로 숨은 상자 그늘로 돌아온다');
    // 건조대 밑 (가구 밑 U) 은 시야 안이어도 숨은 자리
    look();
    a.place(px(11), px(8));
    for (let i = 0; i < 60; i++) a.step(1 / 60, { ...NO_INPUT, move: { x: 0, y: 0 } });
    assert.equal(a.watchState('mom_eye')?.seen, false);
  });

  test('서랍 계단 → 루루 밧줄 → 손거울 둘로 빛을 꺾어 보석함 → 휴대폰을 머리맡에 → 모든 기억 → 동백꽃 머리핀', () => {
    const a = start('dresser');
    // 들어서면 엄마 이야기 · 목표 단계
    stand(a, 3, 12, 'up');
    assert.match(a.stage.goal ?? '', /서랍 계단/);
    assert.ok(!a.things().some((t) => t.id === 'chest_climb'), '서랍 계단 전에는 오를 수 없다');
    assert.ok(!a.things().some((t) => t.id === 'mom_phone'), '휴대폰은 보석함이 열린 뒤에');

    // 놀이 2 · 서랍 계단: 위 서랍부터 당기면 틀린다
    stand(a, 6, 7, 'up');
    a.place(px(6), px(6));
    a.step(1 / 60, NO_INPUT);
    const wrong = finish(a);
    assert.ok(wrong.some((l) => /아래부터/.test(l)), wrong.join(' / '));
    assert.deepEqual(a.seqState('drawer_steps')?.pressed, []);
    for (const x of [8, 7, 6]) {
      a.place(px(x), px(7));
      a.step(1 / 60, NO_INPUT);
      a.place(px(x), px(6));
      a.step(1 / 60, NO_INPUT);
      finish(a);
    }
    assert.equal(a.flags.steps_ok, true);
    a.step(1 / 60, NO_INPUT);
    finish(a);
    assert.equal(a.stage.props['surfaceFront@6,5']?.state, 'stairs', '서랍이 계단처럼 빠져나온다');

    // 루루를 부르기 전에는 못 오른다
    use(a, 10, 6, 'left', 'chest_climb');
    assert.equal(a.stage.actors.toby.elev, 0);
    callPal(a, 'ruru');
    use(a, 10, 6, 'left', 'chest_climb');
    assert.deepEqual(cellOf(a), [9, 4]);
    assert.equal(a.stage.actors.toby.elev, 1, '화장대 위 (높은 층)');
    assert.equal(a.solid(9, 5), true, '앞면 아래로는 걸어서 못 내려간다');

    // 놀이 3 · 손거울: 나비가 없으면 빛이 없다
    assert.equal(a.beamPath('lantern_beam'), null);
    callPal(a, 'nabi');
    use(a, 10, 6, 'left', 'chest_climb');
    const path = a.beamPath('lantern_beam')!;
    assert.equal(path.hit, false, '처음 방향으로는 열쇠 구멍에 안 닿는다');
    use(a, 7, 4, 'left', 'hm1');
    use(a, 7, 3, 'left', 'hm2');
    assert.equal(a.flags.jewel_open, undefined, '거울 하나만 맞으면 아직');
    // 되돌리기: 처음 방향으로
    use(a, 11, 4, 'up', 'mirror_undo');
    assert.deepEqual([a.mirrorFace('hm1'), a.mirrorFace('hm2')], [3, 0]);
    use(a, 7, 4, 'left', 'hm1');
    use(a, 7, 3, 'left', 'hm2');
    use(a, 7, 3, 'left', 'hm2');
    assert.equal(a.beamPath('lantern_beam')?.hit, true);
    assert.equal(a.flags.jewel_open, true);
    assert.equal(a.stage.props['jewelBox@2,3']?.state, 'open');
    assert.match(a.stage.goal ?? '', /휴대폰을 침대 머리맡/);

    // 배달: 바닥의 휴대폰 → 머리맡 (엄마가 잠들면 숨바꼭질도 끝)
    use(a, 9, 4, 'down', 'chest_climb');
    assert.equal(a.stage.actors.toby.elev, 0);
    use(a, 8, 11, 'down', 'mom_phone');
    assert.deepEqual(a.held(), ['mom_phone']);
    assert.ok(!a.things().some((t) => t.id === 'mMg'), '저장된 목소리는 휴대폰을 놓은 뒤');
    const sleep = use(a, 20, 6, 'up', 'pillowside');
    assert.ok(sleep.some((l) => /밥은 먹고 다니니/.test(l)));
    assert.equal(a.flags.mom_sleeps, true);
    assert.equal(a.watchCells('mom_eye').size, 0, '엄마가 잠들면 시야가 없다');
    assert.ok(a.things().some((t) => t.id === 'mMg'));

    allMemoriesThenLink(a, 'dresser', [2, 13], 'lM_done');
  });
});

// ───────────────────────── 7장 · 현관 ─────────────────────────

describe('7장 현관: 마루에서 한 단 아래 · 센서등 숨바꼭질 · 신발 짝 배달', () => {
  test('사람 크기 현관 26×16: 마루(높은 층)와 한 단 낮은 돌바닥, 신발장 · 현관문 · 자전거 · 우산꽂이 · 상자 탑', () => {
    commonChecks('entrance', ['tileFloor', 'shoeCabinet', 'door', 'bike', 'umbrellaStand', 'rug', 'ceilLamp', 'cartonL', 'cartonM', 'clock'], 26, 16);
    const r = ROOMS.entrance();
    assert.equal(r.tiles[8].slice(1, 15), 'S'.repeat(14), '마루 앞면 (한 단)');
    assert.equal(r.elev?.[5][3], '1');
    assert.equal(r.elev?.[10][3], '0');
    assert.deepEqual(looks('entrance'), { mEa: 'tape@22,6', mEb: 'basket@17,3', mEc: 'tray@13,5', mEd: 'shoePair:small@21,4', mEe: 'card@17,4', mEf: 'shoePair:fur@16,4', mEg: 'umbrella@23,3' });
  });

  test('마루에서 시작해, 루루 밧줄로만 한 단 내려간다', () => {
    const a = start('entrance');
    assert.equal(a.stage.goal, '센서등에 들키지 말고, 신발장 맨 아래 칸의 털신에 닿자');
    assert.equal(a.stage.actors.toby.elev, 1);
    assert.equal(a.solid(7, 8), true);
    assert.ok(!reachAll(a, [3, 5]).has('10,12') || a.things().some((t) => t.id === 'step_down'));
    stand(a, 6, 7, 'right');
    assert.match(a.stage.goal ?? '', /루루 밧줄/);
    use(a, 6, 7, 'right', 'step_down');
    assert.equal(a.stage.actors.toby.elev, 1, '루루 없이는 못 내려간다');
    callPal(a, 'ruru');
    use(a, 6, 7, 'right', 'step_down');
    assert.deepEqual(cellOf(a), [7, 9]);
    assert.equal(a.stage.actors.toby.elev, 0);
  });

  /** 칸 가운데까지 걸어간다 (진짜 걸음: 센서등은 움직인 거리를 잰다) */
  const walkTo = (a: Adv, path: [number, number][]) => {
    for (const [tx, ty] of path) {
      for (let i = 0; i < 240 && !a.runner; i++) {
        const p = a.stage.actors.toby;
        const dx = px(tx) - p.x;
        const dy = px(ty) - p.y;
        if (Math.abs(dx) < 2 && Math.abs(dy) < 2) break;
        a.step(1 / 60, { ...NO_INPUT, move: { x: Math.abs(dx) >= 2 ? Math.sign(dx) : 0, y: Math.abs(dx) < 2 ? Math.sign(dy) : 0 } });
      }
      if (a.runner) return;
    }
  };

  test('센서등: 동그라미 안을 곧장 가로지르면 불이 켜지고, 숨을 곳을 디디며 두 걸음씩 가면 켜지지 않는다', () => {
    const a = start('entrance');
    a.place(px(15), px(10));
    a.step(1 / 60, NO_INPUT);
    finish(a);
    walkTo(a, [[16, 10], [22, 10]]);
    assert.ok(a.runner, '곧장 가로지르면 들킨다');
    const lines = finish(a);
    assert.ok(lines.some((l) => /현관 불/.test(l)), lines.join(' / '));
    assert.equal(a.watchState('sensor')?.caught, 1);
    // 숨을 곳 (상자 탑 그늘 · 신발 속) 을 디디며
    a.place(px(15), px(8));
    a.step(1 / 60, NO_INPUT);
    walkTo(a, [[16, 8], [16, 7], [16, 6], [16, 5], [20, 5], [20, 6]]);
    assert.equal(a.runner, null, '두 걸음씩 숨으며 가면 안 켜진다');
    assert.equal(a.watchState('sensor')?.caught, 1);
    assert.deepEqual(cellOf(a), [20, 6]);
  });

  test('신발 네 켤레를 매트에 짝대로 (아빠 구두는 보리와 함께) → 신발장 아래 칸이 열리고 → 모든 기억 → 운동회 사진', () => {
    const a = start('entrance');
    callPal(a, 'ruru');
    use(a, 6, 7, 'right', 'step_down');
    // 흩어진 신발: 작아진 운동화 · 하루 운동화 · 엄마 운동화
    use(a, 11, 11, 'up', 'shoe_small');
    use(a, 16, 14, 'right', 'shoe_haru');
    use(a, 23, 12, 'up', 'shoe_mom');
    assert.deepEqual([...a.held()].sort(), ['shoe_haru', 'shoe_mom', 'shoe_small']);
    const part = use(a, 20, 5, 'up', 'shoe_mat');
    assert.ok(part.some((l) => /1개/.test(l)), part.join(' / '));
    assert.deepEqual(a.assembled('shoe_mat'), { placed: 3, need: 4, done: false });
    // 아빠 구두는 무거워 보리가 있어야
    use(a, 20, 6, 'down', 'shoe_dad');
    assert.deepEqual(a.held(), []);
    callPal(a, 'bori');
    use(a, 20, 6, 'down', 'shoe_dad');
    assert.deepEqual(a.held(), ['shoe_dad']);
    assert.ok(!a.things().some((t) => t.id === 'mEf'), '털신은 신발을 다 맞춘 뒤');
    use(a, 20, 5, 'up', 'shoe_mat');
    assert.equal(a.flags.shoes_paired, true);
    assert.equal(a.stage.props['shoeCabinet@15,3']?.state, 'open');
    assert.match(a.stage.goal ?? '', /털신/);
    assert.ok(a.things().some((t) => t.id === 'mEf') && a.things().some((t) => t.id === 'mEd'));
    allMemoriesThenLink(a, 'entrance', [3, 5], 'che_done');
  });
});

// ───────────────────────── 10장 · 욕실 ─────────────────────────

describe('10장 욕실: 젖은 타일 미끄럼 · 슬리퍼 디딤돌 · 세면대 위 안경 자리', () => {
  test('사람 크기 욕실 20×16: 욕조 · 세면대 윗면 · 의자 · 「욕실」 상자 · 수건 더미 · 젖은 타일과 마른 자리', () => {
    commonChecks('bath', ['bathtub', 'surfaceTop', 'surfaceFront', 'stool', 'towelPile', 'duck', 'cartonM', 'cartonL', 'window', 'rug'], 20, 16);
    const r = ROOMS.bath();
    assert.deepEqual(r.slip, [[1, 6, 18, 7]]);
    assert.deepEqual(r.grip, [[4, 11], [15, 9]]);
    assert.deepEqual(looks('bath'), { mBa: 'photo@12,3', mBb: 'book@9,4', mBc: 'tray@10,3', mBd: 'paperstar@1,3', mBe: 'cup@14,3', mBf: 'gourd@8,4', mBg: 'pen@10,5' });
    assert.equal(r.things.find((t) => t.id === 'mBa')?.kind === 'keepsake' && (r.things.find((t) => t.id === 'mBa') as { dark?: boolean }).dark, true, '김 서린 거울은 나비 등불 온기로');
  });

  /** 한 방향으로 누르고 미끄러짐이 멈출 때까지 */
  const push = (a: Adv, dx: number, dy: number) => {
    const from = cellOf(a).join(',');
    for (let i = 0; i < 60 && !a.slidingNow() && cellOf(a).join(',') === from; i++) a.step(1 / 60, { ...NO_INPUT, move: { x: dx, y: dy } });
    for (let i = 0; i < 240 && a.slidingNow(); i++) a.step(1 / 60, NO_INPUT);
    for (let i = 0; i < 4; i++) a.step(1 / 60, NO_INPUT);
    finish(a);
  };
  const center = (a: Adv) => {
    const [x, y] = cellOf(a);
    a.place(px(x), px(y));
  };

  test('젖은 타일: 한 번 디디면 막히거나 마른 칸까지 미끄러지고, 오른쪽 위 마른 자리는 슬리퍼 없이는 못 간다', () => {
    const a = start('bath');
    a.place(px(16), px(13));
    a.step(1 / 60, NO_INPUT);
    finish(a);
    push(a, 0, -1);
    assert.deepEqual(cellOf(a), [16, 8], '빨래 바구니 앞에서 멈춘다');
    center(a);
    push(a, 1, 0);
    assert.deepEqual(cellOf(a), [18, 8], '벽까지');
    center(a);
    push(a, 0, -1);
    assert.deepEqual(cellOf(a), [18, 8], '봉투에 막혀 위로는 못 간다');
    // 때수건 (마른 칸) 에서는 멈춘다
    a.place(px(4), px(13));
    a.step(1 / 60, NO_INPUT);
    push(a, 0, -1);
    assert.deepEqual(cellOf(a), [4, 11]);
  });

  test('보리가 슬리퍼를 위로 세 번 밀어 멈출 자리 → 세면대 밑 마른 자리 → 슬리퍼 위에서 멈춰 오른쪽 끝 → 의자 → 세면대 위 → 모든 기억 → 토비 극장 대본', () => {
    const a = start('bath');
    assert.equal(a.stage.goal, '욕조 건너편 세면대 위, 할머니 안경이 놓이던 자리에 닿자');
    stand(a, 10, 14, 'up');
    assert.match(a.stage.goal ?? '', /젖은 타일/);
    // 보리 없이는 슬리퍼가 꿈쩍 않는다
    use(a, 12, 11, 'up', 'slipper_push');
    assert.deepEqual(a.blockAt('slipper_push'), [12, 10]);
    callPal(a, 'bori');
    // 문 앞에서 위로 디디면 슬리퍼 앞까지 미끄러진다
    a.place(px(12), px(13));
    a.step(1 / 60, NO_INPUT);
    push(a, 0, -1);
    assert.deepEqual(cellOf(a), [12, 11]);
    for (const y of [11, 10, 9]) {
      center(a);
      assert.deepEqual(cellOf(a), [12, y]);
      a.face('up');
      a.step(1 / 60, NO_INPUT);
      assert.equal(a.prompt?.id, 'slipper_push');
      a.step(1 / 60, { ...NO_INPUT, act: true });
      finish(a);
      assert.deepEqual(a.blockAt('slipper_push'), [12, y - 2]);
      push(a, 0, -1);
    }
    assert.deepEqual(a.blockAt('slipper_push'), [12, 7], '슬리퍼가 세면대 앞 둘째 줄에');
    // 아래로 미끄러져 문 앞 → 오른쪽 한 칸 → 위로 미끄러져 세면대 밑 마른 자리
    center(a);
    push(a, 0, 1);
    assert.deepEqual(cellOf(a), [12, 13]);
    center(a);
    push(a, 1, 0);
    center(a);
    assert.deepEqual(cellOf(a), [13, 13]);
    push(a, 0, -1);
    assert.deepEqual(cellOf(a), [13, 5], '세면대 밑 마른 자리');
    center(a);
    push(a, -1, 0);
    center(a);
    assert.deepEqual(cellOf(a), [12, 5]);
    // 내려서면 슬리퍼에 막혀 첫 젖은 줄에서 멈추고 → 오른쪽 끝 → 위 마른 자리
    push(a, 0, 1);
    assert.deepEqual(cellOf(a), [12, 6]);
    center(a);
    push(a, 1, 0);
    assert.deepEqual(cellOf(a), [18, 6]);
    center(a);
    push(a, 0, -1);
    assert.deepEqual(cellOf(a), [18, 5], '의자 쪽 마른 자리');
    // 의자를 밟고 세면대 위
    use(a, 17, 3, 'down', 'stool_up');
    assert.deepEqual(cellOf(a), [16, 3]);
    assert.equal(a.stage.actors.toby.elev, 1);
    a.step(1 / 60, NO_INPUT);
    finish(a);
    assert.match(a.stage.goal ?? '', /안경이 놓이던 자리/);
    // 김 서린 거울은 나비가 있어야 보인다
    assert.ok(!a.things().some((t) => t.id === 'mBa'));
    callPal(a, 'nabi');
    assert.ok(a.things().some((t) => t.id === 'mBa'));
    // 되돌리기: 슬리퍼를 처음 자리로
    use(a, 3, 13, 'up', 'slipper_undo');
    assert.deepEqual(a.blockAt('slipper_push'), [12, 10]);
    // 나머지는 (같은 길로 오른 것으로 보고) 걸어서 닿는다: 슬리퍼를 다시 제자리에 둔다
    a.save.blocks.slipper_push = [12, 7];
    allMemoriesThenLink(a, 'bath', [18, 4], 'chb_done');
  });
});

// ───────────────────────── 12장 · 부엌 과자 서랍 ─────────────────────────

describe('12장 부엌 과자 서랍: 오르골 음 · 서랍 당기기 · 서랍 속 젤리 대왕에게 딸기 사탕', () => {
  test('사람 크기 부엌 41×16 (부엌 + 과자 서랍 속 단면): 냉장고 · 조리대 · 식탁 · 찬장 · 쌀 포대 · 「부엌」 상자', () => {
    commonChecks('drawer', ['fridge', 'kcounter', 'wallCab', 'surfaceTop', 'surfaceFront', 'chair', 'riceSack', 'cartonL', 'dishWrap', 'window', 'clock', 'calendar', 'candyTin'], KITCHEN_W, KITCHEN_H);
    assert.deepEqual(looks('drawer'), { m7a: 'cake@34,7', m7b: 'key@37,5', m7c: 'ribbon@1,3', m7d: 'xmasbox@17,9', m7e: 'cup@9,4', m7f: 'honeycandy@32,9', m7g: 'apron@22,3' });
    const npc = ROOMS.drawer().things.find((t) => t.id === 'jellyking');
    assert.deepEqual(npc && 'at' in npc && npc.at, [35, 5], '젤리 대왕은 서랍 속에');
  });

  test('오르골 → 서랍 → 서랍 속 → 딸기 사탕 배달 → 생일 초 상자 → 모든 기억 → 부러진 첫 열쇠', () => {
    const a = start('drawer');
    assert.equal(a.stage.goal, '하루의 오르골 노래를 다시 울리자');
    assert.ok(!a.things().some((t) => t.id === 'snack_drawer'), '오르골 전에는 서랍을 당길 수 없다');
    stand(a, 12, 9, 'right');
    assert.match(a.stage.goal ?? '', /오르골 노래 차례/);
    // 의자를 밟고 식탁 위 (높은 층)
    use(a, 13, 9, 'right', 'table_chair');
    assert.deepEqual(cellOf(a), [15, 9]);
    assert.equal(a.stage.actors.toby.elev, 1);
    // 틀린 음부터 밟으면 처음부터
    a.place(px(15), px(8));
    a.step(1 / 60, NO_INPUT);
    assert.ok(finish(a).some((l) => /그렇게 시작 안 했어/.test(l)));
    assert.deepEqual(a.seqState('musicbox')?.pressed, []);
    // 미 · 솔 · 라
    for (const [x, y] of [[17, 8], [18, 8], [19, 8], [19, 9], [20, 8]] as const) {
      a.place(px(x), px(y));
      a.step(1 / 60, NO_INPUT);
      finish(a);
    }
    assert.equal(a.flags.musicbox_half, true);
    a.step(1 / 60, NO_INPUT);
    const song = finish(a);
    assert.ok(song.some((l) => /미, 솔, 라/.test(l)), song.join(' / '));
    assert.match(a.stage.goal ?? '', /과자 서랍/);

    // 서랍 당기기: 보리와 루루가 함께, 세 번
    use(a, 15, 9, 'left', 'table_chair');
    assert.equal(a.stage.actors.toby.elev, 0);
    use(a, 25, 5, 'up', 'snack_drawer');
    assert.equal(a.pullCount('snack_drawer'), 0);
    callPal(a, 'bori');
    use(a, 25, 5, 'up', 'snack_drawer');
    assert.equal(a.pullCount('snack_drawer'), 0, '루루도 있어야');
    callPal(a, 'ruru');
    for (let i = 1; i <= 3; i++) use(a, 25, 5, 'up', 'snack_drawer');
    assert.equal(a.flags.drawer_open, true);
    assert.equal(a.stage.props['kcounter@23,3']?.state, 'open');

    // 서랍 속으로 → 젤리 대왕의 부탁
    use(a, 26, 5, 'up', 'into_drawer');
    assert.deepEqual(cellOf(a), [28, 6]);
    stand(a, 33, 6, 'right');
    assert.equal(a.flags.trig_jelly_ask, true);
    assert.match(a.stage.goal ?? '', /딸기 사탕/);
    // 깜깜한 구석의 사탕은 나비 등불이 있어야 보인다
    assert.ok(!a.things().some((t) => t.id === 'strawberry'));
    callPal(a, 'nabi');
    use(a, 26, 5, 'up', 'into_drawer');
    assert.ok(a.things().some((t) => t.id === 'strawberry'));
    assert.ok(!a.things().some((t) => t.id === 'm7a'), '생일 초 상자는 배달 뒤에');
    use(a, 38, 9, 'down', 'strawberry');
    use(a, 35, 7, 'up', 'jelly_gift');
    assert.equal(a.flags.jelly_gift, true);
    assert.ok(a.things().some((t) => t.id === 'm7a'));
    assert.match(a.stage.goal ?? '', /부러진 첫 태엽 열쇠/);
    allMemoriesThenLink(a, 'drawer', [2, 12], 'ch7_done');
  });
});

// ───────────────────────── 19장 · 부엌 찬장 ─────────────────────────

describe('19장 부엌 찬장: 같은 부엌 (열어 둔 과자 서랍) · 상자 디딤돌 · 그릇 탑 · 까치밥 · 꿀단지 뚜껑', () => {
  test('12장과 같은 부엌 배치: 냉장고 · 조리대 · 식탁 · 찬장 자리가 같고, 과자 서랍과 찬장 문이 열려 있다', () => {
    commonChecks('cupboard', ['fridge', 'kcounter', 'wallCab', 'surfaceTop', 'chair', 'riceSack', 'shelfBoard', 'cartonL'], KITCHEN_W, KITCHEN_H);
    const fixed = (room: string) => (ROOMS[room]().furniture ?? []).filter((f) => f.x < 27 && ['fridge', 'kcounter', 'wallCab', 'surfaceTop', 'surfaceFront', 'chair', 'window', 'clock'].includes(f.kind.split(':')[0])).map((f) => `${f.kind.split(':')[0]}@${f.x},${f.y},${f.w}x${f.h}`);
    assert.deepEqual(fixed('cupboard'), fixed('drawer'));
    const kinds = (room: string) => (ROOMS[room]().furniture ?? []).map((f) => f.kind);
    assert.ok(kinds('cupboard').includes('kcounter:drawer@2,open') && kinds('drawer').includes('kcounter:drawer@2'));
    assert.ok(kinds('cupboard').includes('wallCab:open'));
    assert.deepEqual(ROOMS.cupboard().tiles.slice(0, 15).map((r) => r.slice(0, 27)), ROOMS.drawer().tiles.slice(0, 15).map((r) => r.slice(0, 27)), '부엌 칸은 같다');
    assert.deepEqual(looks('cupboard'), { mOa: 'button@36,13', mOg: 'basket@31,2', mOb: 'lunchbox@31,13', mOc: 'cup@37,12', mOd: 'bowl@35,8', mOe: 'tray@34,2', mOf: 'sewing@33,14' });
  });

  test('상자를 서랍 옆에 밀어 디딤돌 → 찬장 속 → 그릇을 두 번 밀어 길 → 꿀 할매와 까치밥 (남겨 둠) → 넷이 뚜껑 → 단추 → 모든 기억 → 꿀단지와 단추', () => {
    const a = start('cupboard');
    assert.equal(a.stage.goal, '꿀단지 밑에 있는 곰돌이의 첫 단추 눈을 찾자');
    stand(a, 22, 6, 'right');
    assert.match(a.stage.goal ?? '', /「부엌」 상자/);
    assert.ok(!a.things().some((t) => t.id === 'to_shelf'), '디딤돌 전에는 찬장에 못 오른다');
    // 보리와 상자 밀기: 오른쪽 두 번, 위로 두 번
    callPal(a, 'bori');
    use(a, 23, 7, 'right', 'step_box');
    use(a, 24, 7, 'right', 'step_box');
    assert.deepEqual(a.blockAt('step_box'), [26, 7]);
    use(a, 26, 8, 'up', 'step_box');
    use(a, 26, 7, 'up', 'step_box');
    assert.deepEqual(a.blockAt('step_box'), [26, 5]);
    assert.equal(a.flags.step_box, true);
    // 되돌리기 자리 (막다른 곳일 때)
    const b = start('cupboard');
    b.save.blocks.step_box = [24, 4];
    use(b, 19, 6, 'up', 'box_undo');
    assert.deepEqual(b.blockAt('step_box'), [24, 7]);

    // 루루 밧줄로 찬장 맨 윗단
    callPal(a, 'ruru');
    use(a, 25, 4, 'right', 'to_shelf');
    assert.deepEqual(cellOf(a), [28, 2]);
    a.step(1 / 60, NO_INPUT);
    finish(a);
    assert.match(a.stage.goal ?? '', /그릇 탑/);
    use(a, 36, 3, 'right', 'shelf_down1');
    assert.deepEqual(cellOf(a), [37, 6]);
    // 그릇 탑: 큰 그릇을 두 번 밀어야 길이 난다
    assert.ok(!reachAll(a, [37, 6]).has('30,8'));
    use(a, 34, 7, 'left', 'bowl_big');
    assert.deepEqual(a.blockAt('bowl_big'), [32, 7]);
    assert.ok(!reachAll(a, [37, 6]).has('30,8'), '한 번으로는 아직');
    use(a, 33, 7, 'left', 'bowl_big');
    assert.deepEqual(a.blockAt('bowl_big'), [31, 7]);
    assert.ok(reachAll(a, [37, 6]).has('30,8'));
    use(a, 30, 8, 'left', 'shelf_down2');
    assert.deepEqual(cellOf(a), [29, 11]);

    // 까치밥: 「하나는 남겨 둔다」
    assert.ok(!a.things().some((t) => t.id === 'honey_lid'));
    a.place(px(32), px(12));
    a.step(1 / 60, NO_INPUT);
    const talk = finish(a, 1);
    assert.ok(talk.some((l) => /남겨 둘래/.test(l)), talk.join(' / '));
    assert.equal(a.flags.kkachi_1, true);
    assert.equal(a.flags.kkachi_done, true);
    // 뚜껑은 넷이 함께 (보리 · 루루 · 나비)
    use(a, 34, 12, 'right', 'honey_lid');
    assert.equal(a.pullCount('honey_lid'), 0, '나비가 없으면');
    // 그릇을 다 민 보리는 부엌 자기 자리로 돌아갔다: 루루가 드리운 밧줄 지름길로 데리러 갔다 온다
    assert.ok(!a.withMe().includes('bori'));
    callPal(a, 'bori');
    callPal(a, 'nabi');
    if (!a.withMe().includes('ruru')) callPal(a, 'ruru');
    use(a, 26, 11, 'down', 'shelf_rope');
    assert.deepEqual(cellOf(a), [28, 12]);
    assert.ok(!a.things().some((t) => t.id === 'mOa'), '단추는 뚜껑을 연 뒤');
    for (let i = 1; i <= 3; i++) use(a, 34, 12, 'right', 'honey_lid');
    assert.equal(a.flags.lid_open, true);
    assert.ok(a.things().some((t) => t.id === 'mOa'));
    allMemoriesThenLink(a, 'cupboard', [2, 12], 'chO_done');
  });

  test('까치밥에서 꿀을 먹어도 진행되고, 보리가 「남겨 둘걸」 한다', () => {
    const a = start('cupboard');
    a.place(px(32), px(12));
    a.step(1 / 60, NO_INPUT);
    const talk = finish(a, 0);
    assert.ok(talk.some((l) => /남겨 둘걸/.test(l)), talk.join(' / '));
    assert.equal(a.flags.kkachi_0, true);
    assert.equal(a.flags.kkachi_done, true);
    assert.ok(a.things().some((t) => t.id === 'honey_lid'));
  });
});
