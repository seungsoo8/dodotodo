/**
 * 갈래 E 장들을 처음부터 끝까지 실제로 풀어 본다 (살펴보기 · 밀기 · 걷기 · 고르기로):
 *  - 17장 토비의 태엽 속 (근접 · 환상 지도): 톱니 맞물리기 → 다리 → 메아리 따라가기 → 태엽 감기 → 모든 기억 → 빨간 리본 열쇠
 *  - 20장 할머니의 재봉 상자 (근접 지도): 엉킨 매듭 다섯 → 눈 단추 맞추기 → 루루 밧줄 · 나비 등불 → 마지막 땀 → 할머니의 바늘
 *  - 마지막 장 새벽: 1장 다락 배치를 새벽 상태로 다시 쓴다
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Adv, isMemory, NO_INPUT, REACH } from '../adv.ts';
import { CHAPTERS, ROOMS, STORY } from '../story/index.ts';
import { px } from '../stage.ts';
import { TILE } from '../../maps.ts';
import { lookPix } from '../../../ui/render/looks.ts';
import { residentSprite } from '../../../ui/art/houseProps.ts';
import { SB, TK } from '../story/layout_e.ts';
import type { Cmd, Facing, Thing } from '../types.ts';

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

/** 대본 · 놀이가 끝날 때까지 넘기며 나온 대사를 모은다 (작은 놀이는 다 한 것으로, 고르기는 pick 번을 고른다) */
function finish(a: Adv, pick = 0, limit = 120): string[] {
  const lines: string[] = [];
  for (let i = 0; i < limit * 60 && (a.runner || a.mini); i++) {
    if (a.mini) a.mini.done = true;
    if (a.stage.choice && a.stage.choice.picked === null) a.stage.choice.sel = pick;
    const d = a.stage.dialog;
    if (d && lines[lines.length - 1] !== d.text) lines.push(d.text);
    a.step(1 / 60, { ...NO_INPUT, act: i % 2 === 0 });
  }
  return lines;
}

/** 그 칸에 서서 그쪽을 보고 (안내 대사는 먼저 넘기고) 누른다 → 대본 끝까지. 누른 것의 id 와 대사 */
function useAt(a: Adv, x: number, y: number, dir: Facing, pick = 0): { id: string | undefined; lines: string[] } {
  a.place(px(x), px(y));
  a.face(dir);
  a.step(1 / 60, NO_INPUT);
  finish(a);
  a.face(dir);
  a.step(1 / 60, NO_INPUT);
  const id = a.prompt?.id;
  a.step(1 / 60, { ...NO_INPUT, act: true });
  return { id, lines: finish(a, pick) };
}

/** 그 칸에 들어선다 (밟으면 도는 대본까지) */
function stepOn(a: Adv, x: number, y: number): string[] {
  a.place(px(x), px(y));
  a.step(1 / 60, NO_INPUT);
  return finish(a);
}

/** 동료가 자기 자리에 갈 때까지 기다렸다가, 옆에 서서 말을 걸고 「같이 가자」 */
function callPal(a: Adv, h: 'bori' | 'ruru' | 'nabi'): void {
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
function visit(a: Adv, t: Thing, from: Set<string>, pick = 0): string[] {
  const [x, y] = 'at' in t ? t.at : [0, 0];
  for (const [dx, dy, dir] of [[0, 1, 'up'], [-1, 0, 'right'], [1, 0, 'left'], [0, -1, 'down']] as const) {
    if (!from.has(`${x + dx},${y + dy}`)) continue;
    const r = useAt(a, x + dx, y + dy, dir, pick);
    if (r.id === t.id) return r.lines;
  }
  assert.fail(`${t.id} (${x},${y}) 에 걸어서 다가가 살펴볼 수 없다`);
}

/** 기억 하나를 끝까지: 걷는 기억이면 실을 모두 줍고 → 장 방으로 돌아옴 */
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
  assert.equal(a.room.id, room, `${id}: ${room} 으로 돌아오지 않았다`);
  assert.equal(a.flags[`mem_${id}`], true, `${id}: 기억 깃발`);
}

const shown = (a: Adv, id: string) => a.things().some((t) => t.id === id);
const thing = (room: string, id: string) => ROOMS[room]().things.find((t) => t.id === id)!;

/** 장의 목표 문구가 모두 이야기 한 줄 · 단계 (「기억 조각」 · 「N개를 찾자」 없음), 단계마다 바뀐다 */
function goalsOf(room: string): string[] {
  const r = ROOMS[room]();
  const own = r.things.filter((t) => !isMemory(t)).flatMap((t) => ('scene' in t && t.scene ? [t.scene] : []));
  return [chapterOf(room).intro, ...own].flatMap(flat).flatMap((c) => (c.t === 'goal' && c.text ? [c.text] : []));
}

// ───────────────────────── 17장 · 토비의 태엽 속 ─────────────────────────

describe('17장 토비의 태엽 속 (근접 · 환상 지도)', () => {
  const room = ROOMS.tobykey();

  test('장난감 크기 근접 지도: 천 안감 뒷벽 · 열쇠 구멍 · 황동 톱니 · 태엽 스프링 · 가운데 낭떠러지, 주민 큰톱니 · 작은톱니', () => {
    assert.equal(room.scale, 'toy');
    assert.equal(room.w, 32);
    assert.equal(room.h, 20);
    const kinds = new Set((room.furniture ?? []).map((f) => f.kind.split(':')[0]));
    for (const k of ['clothWall', 'brassGear', 'mainspring', 'keyGiant', 'cotton', 'screwBig', 'pawl', 'counter', 'echo', 'oilDrop', 'rustPatch']) assert.ok(kinds.has(k), `소품 ${k}`);
    assert.ok((room.furniture ?? []).some((f) => f.kind === 'clothWall:keyhole'), '열쇠 구멍');
    assert.equal(room.tiles[TK.bridge[0][1]][TK.bridge[0][0]], 'v', '다리 자리는 처음엔 낭떠러지');
    assert.deepEqual(room.things.filter((t) => t.kind === 'npc').map((t) => t.kind === 'npc' && t.actor).sort(), ['gearBig', 'gearSmall']);
    for (const k of ['gearBig', 'gearSmall']) for (const f of [0, 1]) assert.ok(residentSprite(k, 'down', f)!.count() > 80, `${k} 그림`);
    // 소리: 태엽 속이라 째깍 소리
    assert.ok(room.amb?.some((x) => x.name === 'clockTick'));
  });

  test('기억 여섯은 그 장소의 물건이고 (서로 다른 그림 · 그려진다), 메아리 넷 · 태엽 감기 뒤에 드러난다', () => {
    const mems = room.things.filter(isMemory);
    assert.equal(mems.length, 6);
    const looks = Object.fromEntries(mems.map((m) => [m.id, m.kind === 'keepsake' ? m.look : 'orb']));
    assert.deepEqual(looks, { mTa: 'stitchPatch', mTb: 'echo:5,lit', mTc: 'lint', mTd: 'tape', mTe: 'echo:note,lit', mTf: 'keyAxle' });
    for (const l of Object.values(looks)) assert.ok((lookPix(l)?.count() ?? 0) >= 20, `${l} 그림`);
    const when = Object.fromEntries(mems.map((m) => [m.id, m.when]));
    assert.deepEqual(when, { mTa: undefined, mTb: 'echo_5', mTc: 'echo_12', mTd: 'echo_13', mTe: 'echo_14', mTf: 'tb_wound' });
  });

  test('목표는 이야기 한 줄 + 단계 (톱니 → 메아리 → 태엽 → 열쇠), 「기억 조각」 · 개수 없음', () => {
    const goals = goalsOf('tobykey');
    assert.ok(goals.length >= 4, goals.join(' / '));
    for (const g of goals) assert.ok(!/기억 조각|개를 찾자/.test(g), g);
    for (const w of ['톱니', '메아리', '태엽', '열쇠']) assert.ok(goals.some((g) => g.includes(w)), `${w} 단계`);
  });

  test('녹슨 톱니 옆을 지나는 줄은 다 같이 멈춘다 (결곗값: 하나만 닿아도)', () => {
    const a = start('tobykey');
    // 큰톱니 (6,6) → (7,6) (8,6) (8,7) (8,8) (9,8) → 작은톱니 (10,8): (8,6) 이 녹슨 톱니 (9,6) 옆
    const path: [number, number][] = [[7, 6], [8, 6], [8, 7], [8, 8], [9, 8]];
    Object.keys(TK.gears).forEach((id, i) => (a.save.blocks[id] = path[i]));
    a.step(1 / 60, NO_INPUT);
    finish(a);
    assert.equal(a.gearState('heart')?.jammed, true);
    assert.equal(a.flags.gap_gTbridge, undefined);
    // (8,6) 하나만 비켜 (7,7) 로 돌아가면 돈다
    a.save.blocks[Object.keys(TK.gears)[1]] = [7, 7];
    a.step(1 / 60, NO_INPUT);
    finish(a);
    assert.equal(a.gearState('heart')?.jammed, false);
    assert.equal(a.flags.gap_gTbridge, true);
  });

  test('톱니 다섯을 보리와 밀어 큰톱니와 작은톱니를 잇고 → 다리 → 메아리 넷 → 태엽 감기 → 모든 기억 → 빨간 리본 열쇠로 다음 장', () => {
    const CH = chapterOf('tobykey');
    const a = start('tobykey');
    assert.equal(a.room.id, 'tobykey');
    assert.match(a.stage.goal ?? '', /톱니/);
    const firstGoal = a.stage.goal;

    // 다리 전: 가운데 낭떠러지 너머(오른쪽)에 못 가고, 다리 틈에는 손이 닿지 않는다 (밧줄로 건너뛸 수 없다)
    let here = reachable(a, CH.start[0], CH.start[1]);
    assert.ok(!here.has(`${TK.link[0]},${TK.link[1] + 1}`), '다리 전에는 오른쪽에 못 간다');
    for (const k of here) {
      const [x, y] = k.split(',').map(Number);
      assert.ok(Math.hypot(px(TK.bridgeAt[0]) - px(x), px(TK.bridgeAt[1]) - px(y)) - 10 > REACH, `(${x},${y}) 에서 다리 틈에 손이 닿는다`);
    }
    // 큰톱니가 할 일을 말해 준다
    assert.ok(visit(a, thing('tobykey', 'gear'), here).some((l) => /녹슨/.test(l)));

    // 보리 없이는 안 밀린다
    assert.equal(useAt(a, 3, 7, 'right').id, 'tkG1');
    assert.deepEqual(a.blockAt('tkG1'), [4, 7]);
    callPal(a, 'bori');
    const push = (id: string, moves: [number, number, Facing][]) => {
      for (const [x, y, d] of moves) assert.equal(useAt(a, x, y, d).id, id, `${id} @${x},${y}`);
    };
    push('tkG1', [[3, 7, 'right'], [4, 7, 'right']]);
    assert.deepEqual(a.blockAt('tkG1'), [6, 7]);
    push('tkG2', [[6, 11, 'up'], [6, 10, 'up']]);
    push('tkG3', [[7, 13, 'up'], [7, 12, 'up'], [7, 11, 'up'], [7, 10, 'up']]);
    push('tkG5', [[9, 13, 'up'], [9, 12, 'up'], [9, 11, 'up'], [9, 10, 'up']]);
    assert.equal(a.flags.gap_gTbridge, undefined, '한 개 모자라면 아직');
    assert.equal(a.gearState('heart')?.spin.has(`${TK.smallGear[0]},${TK.smallGear[1]}`), false);
    push('tkG4', [[12, 10, 'left'], [11, 10, 'left'], [10, 10, 'left'], [8, 11, 'up'], [8, 10, 'up']]);
    assert.deepEqual(a.blockAt('tkG4'), [8, 8]);
    a.step(1 / 60, NO_INPUT);
    finish(a);
    assert.equal(a.flags.gap_gTbridge, true, '큰톱니 → 작은톱니가 이어지면 다리');
    assert.equal(a.gearState('heart')?.jammed, false);
    assert.ok(!a.solid(TK.bridge[0][0], TK.bridge[0][1]) && !a.solid(TK.bridge[1][0], TK.bridge[1][1]), '다리가 놓였다');
    assert.notEqual(a.stage.goal, firstGoal);
    assert.match(a.stage.goal ?? '', /메아리/);
    here = reachable(a, CH.start[0], CH.start[1]);
    assert.ok(here.has(`${TK.link[0]},${TK.link[1] + 1}`), '다리를 건너 오른쪽으로');

    // 메아리: 차례를 건너뛰면 들리지 않는다 (12살 자리에 먼저 가도 아무 일 없음)
    const [e5, e12, e13, e14] = TK.echoes;
    stepOn(a, e12.at[0], e12.at[1] + 1);
    assert.equal(a.flags.echo_12, undefined);
    assert.equal(shown(a, 'mTc'), false);
    for (const e of [e5, e12, e13, e14]) {
      const lines = stepOn(a, e.at[0], e.at[1] + 1);
      assert.equal(a.flags[`echo_${e.age}`], true, `${e.age}살 메아리`);
      assert.equal(a.stage.props[`echo@${e.at[0]},${e.at[1]}`]?.state, 'lit');
      assert.ok(lines.length >= 2, `${e.age}살: ${lines.join(' / ')}`);
    }
    assert.ok(['mTb', 'mTc', 'mTd', 'mTe'].every((id) => shown(a, id)), '메아리마다 그 나이의 물건이 드러났다');
    assert.match(a.stage.goal ?? '', /태엽/);

    // 태엽 감기: 동료들이 감는다 (게이지가 오르고, 새 열쇠 축이 드러난다)
    assert.equal(shown(a, 'mTf'), false);
    const w0 = a.save.wind;
    assert.equal(useAt(a, 22, 6, 'up').id, 'tb_wind');
    assert.equal(a.flags.tb_wound, true);
    assert.ok(a.save.wind > w0, `태엽 ${w0} → ${a.save.wind}`);
    assert.equal(a.stage.props[`mainspring@${TK.spring[0]},${TK.spring[1]}`]?.state, 'wound');
    assert.ok(shown(a, 'mTf'));

    // 열쇠는 기억을 다 보기 전엔 잠겨 있다
    const link = room.things.find((t) => t.kind === 'link')!;
    here = reachable(a, CH.start[0], CH.start[1]);
    assert.ok(visit(a, link, here).some((l) => /아직이야/.test(l)));
    for (const m of room.things.filter(isMemory)) {
      visit(a, m, here);
      liveMemory(a, 'tobykey', m.id);
      here = reachable(a, CH.start[0], CH.start[1]);
    }
    assert.deepEqual(a.memories(), { got: 6, total: 6 });
    visit(a, link, here);
    assert.equal(a.flags.chT_done, true);
    assert.equal(a.save.chapter, CHAPTERS[CHAPTERS.indexOf(CH) + 1].n, '다음 장으로');
  });

  test('막다른 곳에 밀어 넣으면 되돌리기로 톱니가 처음 자리로', () => {
    const a = start('tobykey');
    callPal(a, 'bori');
    // 넷째 톱니를 위로 걸쇠 밑까지 밀어 버린다
    for (const y of [11, 10, 9, 8]) assert.equal(useAt(a, 11, y, 'up').id, 'tkG4');
    assert.deepEqual(a.blockAt('tkG4'), [11, 7]);
    assert.notDeepEqual(a.blockAt('tkG4'), TK.gears.tkG4);
    assert.equal(useAt(a, 2, 12, 'up').id, 'tk_undo');
    for (const [id, at] of Object.entries(TK.gears)) assert.deepEqual(a.blockAt(id), [...at], id);
  });
});

// ───────────────────────── 20장 · 할머니의 재봉 상자 ─────────────────────────

describe('20장 할머니의 재봉 상자 (근접 지도)', () => {
  const room = ROOMS.sewbox();

  test('장난감 크기 근접 지도: 누빈 안감 뒷벽 · 나무 칸막이 네 칸 · 실패 · 바늘꽂이 · 단추 산 · 노란 실, 주민 골무 아재', () => {
    assert.equal(room.scale, 'toy');
    assert.equal(room.w, 36);
    assert.equal(room.h, 22);
    const kinds = new Set((room.furniture ?? []).map((f) => f.kind.split(':')[0]));
    for (const k of ['quiltWall', 'spoolBig', 'pincushion', 'buttonHill', 'bigButton', 'yarnLine', 'yarnKnot', 'scissorsBig', 'thimbleCup', 'fabricHill']) assert.ok(kinds.has(k), `소품 ${k}`);
    // 칸막이: 가로 · 세로 나무 칸, 문 둘과 바닥 틈 하나
    assert.equal(room.tiles[11][3], 'K');
    assert.equal(room.tiles[15][17], 'K');
    assert.equal(room.tiles[SB.doorDown[1]][SB.doorDown[0]], 'a');
    assert.equal(room.tiles[SB.doorRight[1]][SB.doorRight[0]], 'a');
    assert.equal(room.tiles[SB.crack[1]][SB.crack[0]], 'v');
    assert.deepEqual(room.things.filter((t) => t.kind === 'npc').map((t) => t.kind === 'npc' && t.actor).sort(), ['grandoll', 'thimbleMan']);
    assert.ok(residentSprite('thimbleMan', 'down', 0)!.count() > 80);
    // 바늘 칸만 깜깜하다 (나비 등불)
    assert.deepEqual(room.lantern?.zones, [SB.needleRoom]);
  });

  test('기억 일곱은 그 장소의 물건이고, 매듭 · 눈 단추 · 마지막 땀으로 드러난다', () => {
    const mems = room.things.filter(isMemory);
    assert.equal(mems.length, 7);
    const looks = Object.fromEntries(mems.map((m) => [m.id, m.kind === 'keepsake' ? m.look : 'orb']));
    assert.deepEqual(looks, { mGa: 'clinicCard', mGb: 'medPouch', mGc: 'button', mGd: 'crumpledLetters', mGe: 'whiteScrap', mGf: 'tapeMeasure', mGg: 'yarn' });
    for (const l of Object.values(looks)) assert.ok((lookPix(l)?.count() ?? 0) >= 20, `${l} 그림`);
    const when = Object.fromEntries(mems.map((m) => [m.id, m.when]));
    assert.deepEqual(when, { mGa: undefined, mGb: 'knot1', mGc: 'doll_eyes', mGd: 'knot2', mGe: 'knot4', mGf: 'knot3', mGg: 'sewn' });
    assert.equal(mems.find((m) => m.id === 'mGe')!.dark, true, '바늘 칸의 천 조각은 등불 안에서만');
  });

  test('목표는 이야기 한 줄 + 단계 (실 → 눈 단추 → 바늘 칸 → 마지막 땀 → 바늘)', () => {
    const goals = goalsOf('sewbox');
    assert.ok(goals.length >= 5, goals.join(' / '));
    for (const g of goals) assert.ok(!/기억 조각|개를 찾자/.test(g), g);
    for (const w of ['실', '눈 단추', '바늘 칸', '마지막 땀', '바늘']) assert.ok(goals.some((g) => g.includes(w)), `${w} 단계`);
  });

  test('매듭 다섯 · 눈 단추 · 바닥 틈 · 마지막 땀을 차례로 풀면 모든 기억에 닿고 할머니의 바늘로 새벽 장에', () => {
    const CH = chapterOf('sewbox');
    const a = start('sewbox');
    assert.equal(a.room.id, 'sewbox');
    assert.match(a.stage.goal ?? '', /실/);
    let here = reachable(a, CH.start[0], CH.start[1]);
    assert.ok(!here.has('23,16'), '처음엔 바늘 칸에 못 간다 (바닥 틈)');
    assert.ok(here.has('5,16') && here.has('23,8'), '천 조각 칸 · 단추 칸은 문으로 이어져 있다');

    // 골무 아재가 매듭 푸는 법을 귀띔한다
    assert.ok(visit(a, thing('sewbox', 'thimble'), here).some((l) => /반대쪽/.test(l)));

    // 매듭은 차례로만 보인다
    assert.equal(shown(a, 'knot2_spot'), false);
    // 1: 밑으로 빠져나갔으니 위로 넘긴다 → 약봉지
    assert.equal(useAt(a, 11, 9, 'up', 0).id, 'knot1_spot');
    assert.equal(a.flags.knot1, true);
    assert.ok(shown(a, 'mGb'));
    assert.equal(a.stage.props[`yarnKnot@${SB.knots[0][0]},${SB.knots[0][1]}`]?.state, 'loose');
    // 2: 위로 넘어왔는데 위로 넘기면 더 엉킨다 (실패 · 다시) → 밑으로 지나면 풀린다
    const wrong = useAt(a, 5, 16, 'up', 0);
    assert.equal(wrong.id, 'knot2_spot');
    assert.ok(wrong.lines.some((l) => /더 엉켰어/.test(l)), wrong.lines.join(' / '));
    assert.equal(a.flags.knot2, undefined);
    assert.equal(shown(a, 'mGd'), false);
    assert.equal(useAt(a, 5, 16, 'up', 1).id, 'knot2_spot');
    assert.equal(a.flags.knot2, true);
    assert.ok(shown(a, 'mGd'));
    // 3: 줄자 → 눈 단추를 찾자
    assert.equal(useAt(a, 11, 19, 'up', 0).id, 'knot3_spot');
    assert.ok(shown(a, 'mGf'));
    assert.match(a.stage.goal ?? '', /눈 단추/);

    // 눈 단추: 아닌 단추는 줍지 않고, 까맣고 동그란 구멍 둘 단추 둘은 보리가 들어 날라 맞춘다
    here = reachable(a, CH.start[0], CH.start[1]);
    assert.ok(visit(a, thing('sewbox', 'btnFour'), here).some((l) => /구멍이 둘/.test(l)));
    assert.equal(useAt(a, 23, 8, 'up').id, 'eyeA');
    assert.deepEqual(a.held(), [], '무거워서 보리 없이는 못 든다');
    callPal(a, 'bori');
    assert.equal(useAt(a, 23, 8, 'up').id, 'eyeA');
    assert.deepEqual(a.held(), ['eyeA']);
    assert.equal(useAt(a, 32, 7, 'up').id, 'eyeB');
    assert.deepEqual(a.held(), ['eyeA'], '들고 있는 동안 다른 단추는 못 줍는다');
    assert.equal(useAt(a, SB.eyes[0], SB.eyes[1] + 1, 'up').id, 'dollEyes');
    assert.deepEqual(a.assembled('dollEyes'), { placed: 1, need: 2, done: false });
    assert.equal(useAt(a, 32, 7, 'up').id, 'eyeB');
    assert.equal(useAt(a, SB.eyes[0], SB.eyes[1] + 1, 'up').id, 'dollEyes');
    assert.equal(a.flags.doll_eyes, true);
    assert.ok(shown(a, 'mGc'));
    assert.match(a.stage.goal ?? '', /바늘 칸/);

    // 바닥 틈: 루루 밧줄 → 바늘 칸
    callPal(a, 'ruru');
    assert.equal(useAt(a, SB.crack[0], SB.crack[1] - 1, 'down').id, 'gG');
    assert.equal(a.flags.gap_gG, true);
    here = reachable(a, CH.start[0], CH.start[1]);
    assert.ok(here.has('23,16'), '틈을 건너 바늘 칸으로');

    // 4: 깜깜한 바늘 칸. 매듭은 풀려도 천 조각은 나비 등불 안에서만 보인다
    assert.equal(useAt(a, 23, 16, 'up', 1).id, 'knot4_spot');
    assert.equal(a.flags.knot4, true);
    a.place(px(20), px(17));
    a.step(1 / 60, NO_INPUT);
    assert.equal(shown(a, 'mGe'), false, '나비 없이는 깜깜하다');
    // 5: 바늘꽂이 앞 → 마지막 땀
    assert.equal(useAt(a, 29, 16, 'up', 0).id, 'knot5_spot');
    assert.match(a.stage.goal ?? '', /마지막 땀/);
    assert.equal(useAt(a, SB.sew[0], SB.sew[1] + 1, 'up').id, 'lastStitch');
    assert.equal(a.flags.sewn, true);
    assert.ok(shown(a, 'mGg'));
    assert.match(a.stage.goal ?? '', /바늘/);

    // 모든 기억 (어두운 천 조각은 나비를 불러 와서) → 할머니의 바늘
    callPal(a, 'nabi');
    const link = room.things.find((t) => t.kind === 'link')!;
    here = reachable(a, CH.start[0], CH.start[1]);
    assert.ok(visit(a, link, here).some((l) => /아직/.test(l)));
    for (const m of room.things.filter(isMemory)) {
      visit(a, m, here);
      liveMemory(a, 'sewbox', m.id);
      here = reachable(a, CH.start[0], CH.start[1]);
    }
    assert.deepEqual(a.memories(), { got: 7, total: 7 });
    visit(a, link, here);
    assert.equal(a.flags.chg_done, true);
    // 바늘 → 새벽 장 (새벽 장은 들어오는 대본만으로 끝까지 흘러 에필로그로 이어진다)
    const dawn = chapterOf('attic_dawn');
    assert.equal(CHAPTERS[CHAPTERS.indexOf(CH) + 1], dawn);
    assert.equal(a.save.chapter, CHAPTERS[CHAPTERS.indexOf(dawn) + 1].n, '새벽 장을 지나 에필로그로');
  });

  test('마지막 땀은 눈 단추를 맞추기 전엔 놓을 수 없다 (인형이 먼저 눈을 부탁한다)', () => {
    const a = start('sewbox');
    for (let i = 1; i <= 5; i++) a.flags[`knot${i}`] = true;
    a.flags.gap_gG = true;
    const r = useAt(a, SB.sew[0], SB.sew[1] + 1, 'up');
    assert.equal(r.id, 'lastStitch');
    assert.equal(a.flags.sewn, undefined);
    assert.ok(r.lines.some((l) => /눈 단추/.test(l)), r.lines.join(' / '));
  });
});

// ───────────────────────── 마지막 장 · 새벽 ─────────────────────────

describe('마지막 장 새벽: 1장 다락 배치의 새벽 상태', () => {
  const dawn = ROOMS.attic_dawn();
  const night = ROOMS.attic();

  test('같은 다락 (크기 · 벽 · 소품 자리 그대로), 장난감이 걷는 사람 크기 방', () => {
    assert.equal(dawn.scale, 'human');
    assert.equal(dawn.toys, true);
    assert.equal(dawn.w, night.w);
    assert.equal(dawn.h, night.h);
    const key = (f: { kind: string; x: number; y: number }) => `${f.kind.split(':')[0]}@${f.x},${f.y}`;
    const nightKeys = new Set((night.furniture ?? []).map(key));
    for (const k of ['atticWall@13,0', 'cuckoo@22,1', 'beam@3,6', 'sewbox@11,13', 'railing@3,15']) {
      assert.ok(nightKeys.has(k), `밤 ${k}`);
      assert.ok((dawn.furniture ?? []).some((f) => key(f) === k), `새벽 ${k}`);
    }
    // 벽 · 바닥 줄은 뚜껑문 자리 말고 같다
    for (let y = 0; y < 3; y++) assert.equal(dawn.tiles[y], night.tiles[y]);
  });

  test('새벽 상태: 둥근 창은 새벽 하늘, 뚜껑문은 열려 있고, 재봉 상자 틈엔 바늘, 빛은 분홍', () => {
    const kinds = (dawn.furniture ?? []).map((f) => f.kind);
    assert.ok(kinds.includes('dawnPane'));
    assert.ok(kinds.includes('trapdoor:open'));
    assert.ok(kinds.includes('sewbox:needle'));
    assert.ok(!(night.furniture ?? []).some((f) => f.kind === 'dawnPane'));
    const pink = (dawn.lights ?? []).some((l) => l.color[0] > l.color[2] && l.color[0] - l.color[1] >= 40);
    assert.ok(pink, '분홍 빛');
    assert.equal(chapterOf('attic_dawn').clock, '05:00');
  });

  test('장 시작 자리 · 태엽 할머니 · 걸어올 자리는 걸을 수 있고 서로 이웃, 들어오는 대본은 끝까지 돌아 에필로그로', () => {
    const CH = chapterOf('attic_dawn');
    const a = start('attic_dawn');
    // (대본이 다 돌면 에필로그로 넘어간다)
    assert.equal(a.save.chapter, CHAPTERS[CHAPTERS.indexOf(CH) + 1].n);
    const b = new Adv(STORY);
    b.runner = null;
    (b as unknown as { queue: unknown[] }).queue = [];
    (b as unknown as { applyChapter(n: number): void }).applyChapter(CH.n);
    assert.equal(b.room.id, 'attic_dawn');
    assert.equal(b.solid(CH.start[0], CH.start[1]), false);
    const doll = dawn.things.find((t) => t.id === 'doll');
    assert.ok(doll && doll.kind === 'npc');
    assert.equal(b.solid(doll.at[0], doll.at[1]), false);
    const walk = flat(CH.intro).find((c) => c.t === 'walk' && c.who === 'doll');
    assert.ok(walk && walk.t === 'walk');
    assert.equal(b.solid(walk.to[0], walk.to[1]), false);
    assert.equal(Math.abs(walk.to[0] - CH.start[0]) + Math.abs(walk.to[1] - CH.start[1]), 1, '태엽 할머니는 토비 바로 곁으로 걸어온다');
  });
});
