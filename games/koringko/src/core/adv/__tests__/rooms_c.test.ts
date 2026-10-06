/**
 * 사람 크기 안방 · 현관 · 욕실 · 부엌 (과자 서랍 · 찬장) 지도와, 막 구조에서도 남은 걸음 (현관 마루 밧줄 · 신발 짝 · 까치밥).
 * 막을 처음부터 끝까지 풀어 보는 시험은 acts.test.ts (모든 막) · acts_b~d.test.ts 에 있다.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Adv, isMemory, NO_INPUT } from '../adv.ts';
import { actOfRoom, CHAPTERS, ROOMS } from '../story/index.ts';
import { startIn } from './acthelp.ts';
import { px } from '../stage.ts';
import { isSolidChar, TILE } from '../../maps.ts';
import type { Cmd, Facing, RoomDef, Thing } from '../types.ts';
import { lookPix } from '../../../ui/render/looks.ts';
import { KITCHEN_H, KITCHEN_W } from '../story/layout_c.ts';
const chapterOf = (room: string) => actOfRoom(room)!;

function flat(cmds: readonly Cmd[]): Cmd[] {
  return cmds.flatMap((c) => (c.t === 'if' ? [c, ...flat(c.then), ...flat(c.else ?? [])] : [c]));
}

/** 그 장을 바로 시작하고 들어오는 대본을 끝까지 */
function start(room: string): Adv {
  return startIn(room, (a) => finish(a));
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

/** 공통: 사람 크기 집 지도 · 장난감이 걷고 · 앵커 소품 · 윗층 · 앞 가림 · 빛 · 동료 자리 (목표 줄은 story.test 의 막 규칙이 본다) */
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

describe('엄마의 화장대 · 안방 (2막)', () => {
  test('사람 크기 안방 26×16: 화장대 · 서랍장 · 엄마가 누운 침대 · 스탠드 · 건조대 · 「안방」 상자', () => {
    commonChecks('dresser', ['vanityMirror', 'surfaceTop', 'surfaceFront', 'bedMom', 'lamp', 'dryRack', 'jewelBox', 'perfume', 'cartonL', 'frameGhost', 'window', 'clock'], 26, 16);
    assert.deepEqual(looks('dresser'), { mMa: 'flowers@3,3', mMb: 'card@4,4', mMc: 'hairTie@5,6', mMd: 'towel@13,8', mMg: 'phone@21,5', mMe: 'bag@22,5', mMf: 'letter@23,5' });
    // 막의 둘째 방: 들어선 장면의 물음
    assert.equal(start('dresser').stage.goal, '엄마는 어디서 울었을까?');
  });

});

// ───────────────────────── 7장 · 현관 ─────────────────────────

describe('현관 (4막): 마루에서 한 단 아래 · 신발 짝', () => {
  test('사람 크기 현관 26×16: 마루(높은 층)와 한 단 낮은 돌바닥, 신발장 · 현관문 · 자전거 · 우산꽂이 · 상자 탑', () => {
    commonChecks('entrance', ['tileFloor', 'shoeCabinet', 'door', 'bike', 'umbrellaStand', 'rug', 'ceilLamp', 'cartonL', 'cartonM', 'clock'], 26, 16);
    const r = ROOMS.entrance();
    assert.equal(r.tiles[8].slice(1, 15), 'S'.repeat(14), '마루 앞면 (한 단)');
    assert.equal(r.elev?.[5][3], '1');
    assert.equal(r.elev?.[10][3], '0');
    assert.deepEqual(looks('entrance'), { mEa: 'tape@22,6', mEb: 'basket@17,3', mEc: 'tray@13,5', mEd: 'shoePair:small@21,4', mEe: 'card@17,4', mEf: 'shoePair:fur@16,4', mEg: 'umbrella@23,3' });
  });

  test('마루에서 시작해, 루루 밧줄로만 한 단 내려간다 (루루가 무리를 떠나 있으면 못 내려가고, 돌아오면 바로 따라와 내려간다)', () => {
    const a = start('entrance');
    assert.equal(a.stage.actors.toby.elev, 1);
    assert.equal(a.solid(7, 8), true);
    assert.ok(!reachAll(a, [3, 5]).has('10,12') || a.things().some((t) => t.id === 'step_down'));
    a.leave('ruru');
    use(a, 6, 7, 'right', 'step_down');
    assert.equal(a.stage.actors.toby.elev, 1, '루루 없이는 못 내려간다');
    a.join('ruru');
    assert.ok(a.withMe().includes('ruru'), '늘 따라다니는 막: 돌아온 루루는 바로 함께 다닌다');
    use(a, 6, 7, 'right', 'step_down');
    assert.deepEqual(cellOf(a), [7, 9]);
    assert.equal(a.stage.actors.toby.elev, 0);
  });

  test('신발 네 켤레를 매트에 짝대로 (아빠 구두는 보리와 함께) → 신발장 아래 칸이 열리고 → 모든 기억 → 운동회 사진', () => {
    const a = start('entrance');
    // 막 사슬: 현관 기억은 거실 창가에서 들어오는 문을 지난 뒤, 신발은 「교문 앞 말고」(mEg) 를 본 뒤에 놓인다
    a.flags.door_d_win_ent = true;
    a.flags.mem_mEg = true;
    use(a, 6, 7, 'right', 'step_down');
    // 흩어진 신발: 작아진 운동화 · 하루 운동화 · 엄마 운동화
    use(a, 11, 11, 'up', 'shoe_small');
    use(a, 16, 14, 'right', 'shoe_haru');
    use(a, 23, 12, 'up', 'shoe_mom');
    assert.deepEqual([...a.held()].sort(), ['shoe_haru', 'shoe_mom', 'shoe_small']);
    use(a, 20, 5, 'up', 'shoe_mat');
    assert.deepEqual(a.assembled('shoe_mat'), { placed: 3, need: 4, done: false });
    // 아빠 구두는 무거워 보리가 있어야 (늘 따라다니는 막이라 보리가 곁에 있다)
    use(a, 20, 6, 'down', 'shoe_dad');
    assert.deepEqual(a.held(), ['shoe_dad']);
    assert.ok(!a.things().some((t) => t.id === 'mEd'), '작아진 운동화 기억은 신발을 다 맞춘 뒤');
    use(a, 20, 5, 'up', 'shoe_mat');
    assert.equal(a.flags.shoes_paired, true);
    assert.equal(a.stage.props['shoeCabinet@15,3']?.state, 'open');
    // 사슬: 운동회(mEd) 가 먼저, 털신(mEf) 은 그 뒤
    assert.ok(a.things().some((t) => t.id === 'mEd') && !a.things().some((t) => t.id === 'mEf'));
    allMemoriesThenLink(a, 'entrance', [3, 5], 'che_done');
  });
});

// ───────────────────────── 10장 · 욕실 ─────────────────────────

describe('욕실 (6막): 세면대 위 안경 자리', () => {
  test('사람 크기 욕실 20×16: 욕조 · 세면대 윗면 · 의자 · 「욕실」 상자 · 수건 더미 (막 구조: 미끄러지는 젖은 타일은 없다)', () => {
    commonChecks('bath', ['bathtub', 'surfaceTop', 'surfaceFront', 'stool', 'towelPile', 'duck', 'cartonM', 'cartonL', 'window', 'rug'], 20, 16);
    const r = ROOMS.bath();
    assert.equal(r.slip, undefined);
    assert.equal(r.grip, undefined);
    assert.deepEqual(looks('bath'), { mBa: 'photo@12,3', mBb: 'book@9,4', mBc: 'tray@10,3', mBd: 'paperstar@1,3', mBe: 'cup@14,3', mBf: 'gourd@8,4', mBg: 'pen@10,5' });
    assert.equal(r.things.find((t) => t.id === 'mBa')?.kind === 'keepsake' && (r.things.find((t) => t.id === 'mBa') as { dark?: boolean }).dark, true, '김 서린 거울은 나비 등불 온기로');
  });

});

// ───────────────────────── 12장 · 부엌 과자 서랍 ─────────────────────────

describe('부엌 과자 서랍 (7막)', () => {
  test('사람 크기 부엌 41×16 (부엌 + 과자 서랍 속 단면): 냉장고 · 조리대 · 식탁 · 찬장 · 쌀 포대 · 「부엌」 상자', () => {
    commonChecks('drawer', ['fridge', 'kcounter', 'wallCab', 'surfaceTop', 'surfaceFront', 'chair', 'riceSack', 'cartonL', 'dishWrap', 'window', 'clock', 'calendar', 'candyTin'], KITCHEN_W, KITCHEN_H);
    assert.deepEqual(looks('drawer'), { m7a: 'cake@34,7', m7b: 'key@37,5', m7c: 'ribbon@1,3', m7d: 'xmasbox@17,9', m7e: 'cup@9,4', m7f: 'honeycandy@32,9', m7g: 'apron@22,3' });
    const npc = ROOMS.drawer().things.find((t) => t.id === 'jellyking');
    assert.deepEqual(npc && 'at' in npc && npc.at, [35, 5], '젤리 대왕은 서랍 속에');
  });

});

// ───────────────────────── 19장 · 부엌 찬장 ─────────────────────────

describe('부엌 찬장 (10막): 같은 부엌 · 까치밥 · 꿀단지', () => {
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
