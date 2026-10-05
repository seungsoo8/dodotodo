/**
 * 책상 위 장 (방 'desk'): 장을 시작해 놀이를 차례로 실제로 살펴보기 · 밀기 · 밟기로 풀면
 * 깃발이 서고, 모든 기억에 닿고, 기억의 문(인형극 무대)이 열려 다음 장으로 간다.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Adv, isMemory, NO_INPUT, REACH, type AdvInput } from '../adv.ts';
import { CHAPTERS, ROOMS, STORY } from '../story/index.ts';
import { px } from '../stage.ts';
import { TILE } from '../../maps.ts';
import type { Cmd, Facing, Thing } from '../types.ts';

const CH = CHAPTERS.find((c) => c.room === 'desk')!;

function flat(cmds: readonly Cmd[]): Cmd[] {
  return cmds.flatMap((c) => (c.t === 'if' ? [c, ...flat(c.then), ...flat(c.else ?? [])] : [c]));
}

/** 책상 장을 바로 시작하고 들어오는 대본을 끝까지 */
function start(): Adv {
  const a = new Adv(STORY);
  a.runner = null;
  (a as unknown as { queue: unknown[] }).queue = [];
  (a as unknown as { applyChapter(n: number): void }).applyChapter(CH.n);
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

/** 지금 조종 인물이 (sx, sy) 에서 걸어서 닿는 칸 (밀 물건 · 높이 · 낭떠러지 모두 지금 상태로) */
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
  const [x, y] = t.kind === 'seq' ? t.keys[0].at : t.kind === 'trigger' || t.kind === 'chase' ? [0, 0] : t.at;
  for (const [dx, dy, dir] of [[0, 1, 'up'], [-1, 0, 'right'], [1, 0, 'left'], [0, -1, 'down']] as const) {
    if (!from.has(`${x + dx},${y + dy}`)) continue;
    const r = useAt(a, x + dx, y + dy, dir);
    if (r.id === t.id) return r.lines;
  }
  assert.fail(`${t.id} (${x},${y}) 에 걸어서 다가가 살펴볼 수 없다`);
}

/** 기억 하나: 걷는 기억이면 실을 모두 줍고, 직접 움직이는 기억이면 그 방의 살펴볼 곳을 차례로 → 책상으로 돌아옴 */
function liveMemory(a: Adv, id: string): void {
  for (let guard = 0; guard < 40 && (a.room.id !== 'desk' || a.resume); guard++) {
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
  assert.equal(a.room.id, 'desk', `${id}: 책상으로 돌아오지 않았다`);
  assert.equal(a.flags[`mem_${id}`], true, `${id}: 기억 깃발`);
}

const gapCell = (a: Adv) => !a.solid(11, 8) && !a.solid(12, 8);

describe('책상 위 (근접 지도)', () => {
  const room = ROOMS.desk();

  test('장난감 크기 근접 지도: 40×22 안팎, 아득한 방바닥, 높이, 거대한 소품 18개 이상, 주민 둘', () => {
    assert.equal(room.scale, 'toy');
    assert.ok(room.w >= 36 && room.w <= 44 && room.h >= 20 && room.h <= 24, `${room.w}×${room.h}`);
    assert.equal(room.abyss, 'roomFloor');
    assert.equal(room.elev?.length, room.h);
    const kinds = new Set((room.furniture ?? []).map((f) => f.kind.split(':')[0]));
    for (const k of ['bookspines', 'memoWall', 'pencilCup', 'lampBase', 'notebook', 'eraserDust', 'ruler', 'pencil', 'paperStrips', 'starJarGiant', 'phoneGiant', 'calendarDesk', 'testPapers', 'candyTin', 'tapeCutter', 'hairTie', 'milkCarton', 'deskEdge']) assert.ok(kinds.has(k), `소품 ${k} 이 없다`);
    assert.ok((room.furniture ?? []).some((f) => f.over), '윗층 하나 이상');
    const npcs = room.things.filter((t) => t.kind === 'npc');
    assert.deepEqual(npcs.map((t) => t.kind === 'npc' && t.actor).sort(), ['paperSisters', 'tinSoldier']);
    // 앞 · 오른쪽 가장자리는 책상 모서리 너머 낭떠러지
    assert.ok(room.tiles[room.h - 1].split('').every((c) => c === 'v'));
    assert.ok(room.tiles.slice(3, room.h - 2).every((r) => r[room.w - 1] === 'v'));
  });

  test('기억 일곱 개가 모두 그 자리의 물건(keepsake)이다 — 유리병 첫 별 · 털실 · 도라지 사탕 · 금색 별 · 사진 · 시험지 별 · 노란 종이띠', () => {
    const mems = room.things.filter(isMemory);
    assert.equal(mems.length, 7);
    const looks = Object.fromEntries(mems.map((m) => [m.id, m.kind === 'keepsake' ? m.look : 'orb']));
    assert.deepEqual(looks, { m5a: 'paperstar', m5b: 'yarn', m5c: 'honeycandy', m5d: 'paperstar', m5e: 'photo', m5f: 'testPapers:60', m5g: 'paperStrips' });
    const g = mems.find((m) => m.id === 'm5g')!;
    assert.equal(g.when, 'folded', '노란 종이띠는 별 접기 연습 뒤에');
  });

  test('목표 문구는 이야기 단계 (「기억 조각」 · 「N개를 찾자」가 없다), 단계마다 바뀐다', () => {
    const scripts = [CH.intro, ...room.things.flatMap((t) => ('scene' in t && t.scene ? [t.scene] : t.kind === 'seq' && t.wrong ? [t.wrong] : []))];
    const own = room.things.filter((t) => !isMemory(t)).flatMap((t) => ('scene' in t && t.scene ? [t.scene] : []));
    const goals = [CH.intro, ...own].flatMap(flat).filter((c): c is Extract<Cmd, { t: 'goal' }> => c.t === 'goal' && !!c.text);
    assert.ok(goals.length >= 5, `목표 ${goals.length}개`);
    for (const g of scripts.flatMap(flat)) if (g.t === 'goal' && g.text) assert.ok(!/기억 조각|개를 찾자/.test(g.text), g.text);
  });

  test('연필 다리 · 깡 장군 암호 · 지우개 계단 · 스탠드 · 별 접기를 차례로 풀면 모든 기억에 닿고 인형극 무대가 열린다', () => {
    const a = start();
    assert.equal(a.room.id, 'desk');
    assert.ok(a.stage.goal && !/기억 조각/.test(a.stage.goal), `장 시작 목표: ${a.stage.goal}`);
    const firstGoal = a.stage.goal;

    // ── 놀이 1: 연필 다리. 처음엔 틈을 건널 수 없고, 밧줄 걸 틈은 손이 닿지 않는다
    assert.equal(gapCell(a), false);
    let here = reachable(a, CH.start[0], CH.start[1]);
    assert.ok(!here.has('13,8'), '다리 전에는 공책 들판에 못 간다');
    const gap = room.things.find((t) => t.kind === 'gap')!;
    for (const k of here) {
      const [x, y] = k.split(',').map(Number);
      assert.ok(Math.hypot(px(gap.at[0]) - px(x), px(gap.at[1]) - px(y)) - 10 > REACH, `(${x},${y}) 에서 밧줄 틈에 손이 닿는다`);
    }
    // 연필을 위로 굴리면 우유갑에 막혀 7줄에서 멈추고, 오른쪽으로 굴리면 틈 가장자리 발판에 걸친다
    assert.equal(useAt(a, 5, 12, 'up').id, 'pencil1');
    assert.deepEqual(a.blockAt('pencil1'), [5, 7]);
    assert.equal(a.flags.gap_g9pencil, undefined);
    assert.equal(useAt(a, 4, 7, 'right').id, 'pencil1');
    assert.deepEqual(a.blockAt('pencil1'), [10, 7]);
    assert.equal(a.flags.gap_g9pencil, true);
    assert.equal(gapCell(a), true);
    a.place(px(4), px(9));
    a.step(1 / 60, NO_INPUT);
    finish(a);
    assert.notEqual(a.stage.goal, firstGoal, '다리를 놓으면 목표가 바뀐다');
    here = reachable(a, CH.start[0], CH.start[1]);
    assert.ok(here.has('20,9'), '다리를 건너 공책 들판에');

    // ── 놀이 2: 깡 장군. 암호 없이 길목에 들어서면 되돌려 보낸다
    const meet = visit(a, room.things.find((t) => t.id === 'tin')!, here);
    assert.ok(meet.some((l) => /암호/.test(l)));
    a.place(px(23), px(11));
    a.step(1 / 60, NO_INPUT);
    for (let i = 0; i < 60; i++) a.step(1 / 60, { ...NO_INPUT, move: { x: 1, y: 0 } } as AdvInput);
    finish(a);
    assert.ok(a.stage.actors.toby.x < 24 * TILE, '장군이 길목에서 되돌려 보낸다');

    // 첫 틀림: 루루의 「꿀?」
    a.place(px(15), px(9));
    a.step(1 / 60, NO_INPUT);
    const miss = finish(a);
    assert.ok(miss.some((l) => /꿀\?/.test(l)), `첫 틀림 대사: ${miss.join(' / ')}`);
    assert.equal(a.flags.code_ok, undefined);
    assert.deepEqual(a.seqState('code')?.pressed, []);

    // 태엽 나눠 주기: 태엽이 줄고 차례 힌트
    const w0 = a.save.wind;
    const hint = useAt(a, 22, 11, 'right');
    assert.equal(hint.id, 'tinkey');
    assert.ok(a.save.wind < w0);
    assert.ok(hint.lines.some((l) => /달력, 시간표, 시험지/.test(l)));

    // 달력 · 시간표 · 시험지에서 숫자를 알아낸다
    assert.ok(visit(a, room.things.find((t) => t.id === 'desk_cal')!, here).some((l) => /「7」/.test(l)));
    assert.ok(visit(a, room.things.find((t) => t.id === 'desk_timetable')!, here).some((l) => /2교시/.test(l)));
    assert.ok(visit(a, room.things.find((t) => t.id === 'desk_tests')!, here).some((l) => /60/.test(l)));

    // 7 → 2 → 6 차례로 밟는다
    for (const [x, y] of [[17, 12], [15, 9], [20, 9]] as const) {
      a.place(px(x), px(y));
      a.step(1 / 60, NO_INPUT);
      finish(a);
    }
    assert.equal(a.flags.code_ok, true);
    // 다음 걸음에 장군이 통과를 허락한다
    a.step(1 / 60, NO_INPUT);
    finish(a);
    assert.match(a.stage.goal ?? '', /스탠드/);
    a.place(px(23), px(11));
    for (let i = 0; i < 90; i++) a.step(1 / 60, { ...NO_INPUT, move: { x: 1, y: 0 } } as AdvInput);
    finish(a);
    assert.ok(a.stage.actors.toby.x > 26 * TILE, '암호를 대면 길목을 지나간다');

    // ── 놀이 3: 지우개 계단. 큰 지우개를 세 번 밀어 책 더미 앞에
    here = reachable(a, CH.start[0], CH.start[1]);
    assert.ok(here.has('29,11'));
    assert.equal(a.things().some((t) => t.id === 'c9pile'), false, '계단 전에는 오를 수 없다');
    for (const y of [11, 10, 9]) assert.equal(useAt(a, 29, y, 'up').id, 'erBig');
    assert.deepEqual(a.blockAt('erBig'), [29, 7]);
    assert.equal(a.flags.er_big, true);
    assert.equal(useAt(a, 28, 9, 'up').id, 'c9pile');
    assert.equal(a.stage.actors.toby.elev, 1, '책 더미 위 (높이 1)');
    // 책 더미 위에서는 바닥으로 그냥 내려서지 못한다
    assert.equal(a.solid(28, 8), true);
    assert.equal(useAt(a, 28, 5, 'right').id, 'erSmall');
    assert.deepEqual(a.blockAt('erSmall'), [30, 5]);
    assert.equal(a.flags.er_small, true);
    assert.equal(useAt(a, 28, 5, 'right').id, 'c9lamp');
    assert.equal(a.stage.actors.toby.elev, 2, '스탠드 받침 위 (높이 2)');

    // 스탠드: 보리가 엉덩이로 스위치
    const lamp = useAt(a, 32, 5, 'up');
    assert.equal(lamp.id, 'lampbtn');
    assert.equal(a.flags.lamp_on, true);
    assert.ok(lamp.lines.some((l) => /엉덩이/.test(l)));
    assert.equal(a.stage.props['lampBase@31,4']?.state, 'on');
    assert.match(a.stage.goal ?? '', /노란 종이띠/);
    // 받침에서 내려와 바닥으로
    assert.equal(useAt(a, 31, 5, 'left').id, 'c9lamp');
    assert.equal(a.stage.actors.toby.elev, 1);
    assert.equal(useAt(a, 28, 6, 'down').id, 'c9pile');
    assert.equal(a.stage.actors.toby.elev, 0);

    // 색종이 자매와 별 접기 연습 → 노란 종이띠(m5g) 가 드러난다
    assert.ok(!a.things().some((t) => t.id === 'm5g'));
    here = reachable(a, CH.start[0], CH.start[1]);
    const fold = visit(a, room.things.find((t) => t.id === 'paper')!, here);
    assert.ok(fold.some((l) => /천 번째 별은 하루가 접어야/.test(l)));
    assert.equal(a.flags.folded, true);
    assert.ok(a.things().some((t) => t.id === 'm5g'));

    // 기억의 문은 기억을 다 모으기 전에는 잠겨 있다
    const link = room.things.find((t) => t.kind === 'link')!;
    assert.ok(visit(a, link, here).some((l) => /아직이야/.test(l)));
    assert.equal(a.flags.ch5_done, undefined);

    // 모든 기억: 장 시작 자리에서 걸어서 다가가 살펴본다
    here = reachable(a, CH.start[0], CH.start[1]);
    for (const m of room.things.filter(isMemory)) {
      visit(a, m, here);
      liveMemory(a, m.id);
      here = reachable(a, CH.start[0], CH.start[1]);
    }
    assert.deepEqual(a.memories(), { got: 7, total: 7 });

    // 인형극 무대 → 맞추기 → 다음 장
    visit(a, link, here);
    assert.equal(a.flags.ch5_done, true);
    const next = CHAPTERS[CHAPTERS.indexOf(CH) + 1];
    assert.equal(a.save.chapter, next.n, '다음 장으로');
  });

  test('연필 세 자루 어느 것으로도 다리를 놓을 수 있다 (한 자루를 엉뚱하게 굴려도 막히지 않게)', () => {
    // 첫 연필을 아래로 굴리면 책상 앞 모서리까지 가 버린다 (발판이 아니다)
    const a = start();
    assert.equal(useAt(a, 5, 10, 'down').id, 'pencil1');
    assert.deepEqual(a.blockAt('pencil1'), [5, 19]);
    assert.equal(a.flags.gap_g9pencil, undefined);
    // 둘째 연필: 위로 → 연필꽂이에 막혀 7줄 → 오른쪽 → 발판
    assert.equal(useAt(a, 8, 15, 'up').id, 'pencil2');
    assert.deepEqual(a.blockAt('pencil2'), [8, 7]);
    assert.equal(useAt(a, 7, 7, 'right').id, 'pencil2');
    assert.deepEqual(a.blockAt('pencil2'), [10, 7]);
    assert.equal(a.flags.gap_g9pencil, true);

    // 셋째 연필만으로: 오른쪽 → 틈 가장자리, 위로 → 머리끈에 걸려 발판
    const b = start();
    assert.equal(useAt(b, 2, 16, 'right').id, 'pencil3');
    assert.deepEqual(b.blockAt('pencil3'), [10, 16]);
    assert.equal(b.flags.gap_g9pencil, undefined);
    assert.equal(useAt(b, 10, 17, 'up').id, 'pencil3');
    assert.deepEqual(b.blockAt('pencil3'), [10, 7]);
    assert.equal(b.flags.gap_g9pencil, true);
  });
});

describe('책상: 막다른 곳에서 다시 풀기', () => {
  test('연필을 엉뚱하게 굴려도 지우개 가루 자리를 살펴보면 세 연필이 처음 자리로 돌아온다', () => {
    const a = start();
    const room = ROOMS.desk();
    const origin = (id: string) => (room.things.find((t) => t.id === id) as Extract<Thing, { kind: 'push' }>).at;
    a.save.blocks.pencil1 = [2, 19];
    a.save.blocks.pencil3 = [9, 19];
    const undo = a.things().find((t) => t.id === 'undoPencil')!;
    (a as unknown as { interact(t: Thing): void }).interact(undo);
    finish(a);
    for (const id of ['pencil1', 'pencil2', 'pencil3']) assert.deepEqual(a.blockAt(id), origin(id), id);
  });

  test('연필 다리가 놓인 뒤에는 되돌리기 자리가 사라진다', () => {
    const a = start();
    a.flags.gap_g9pencil = true;
    assert.equal(a.things().some((t) => t.id === 'undoPencil'), false);
  });
});
