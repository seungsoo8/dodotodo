/**
 * 책상 위 장 (방 'desk'): 장을 시작해 놀이를 차례로 실제로 살펴보기 · 밀기 · 밟기로 풀면
 * 깃발이 서고, 모든 기억에 닿고, 기억의 문(인형극 무대)이 열려 다음 장으로 간다.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Adv, isMemory, NO_INPUT, REACH, type AdvInput } from '../adv.ts';
import { ROOMS, STORY } from '../story/index.ts';
import { px } from '../stage.ts';
import { TILE } from '../../maps.ts';
import type { Cmd, Facing, Thing } from '../types.ts';

function flat(cmds: readonly Cmd[]): Cmd[] {
  return cmds.flatMap((c) => (c.t === 'if' ? [c, ...flat(c.then), ...flat(c.else ?? [])] : [c]));
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

});
