import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Adv, NO_INPUT } from '../adv.ts';
import { CHAPTERS, ROOMS, STORY } from '../story/index.ts';
import { isSolidChar } from '../../maps.ts';
import type { Cmd, RoomDef, Thing } from '../types.ts';

const KINDS = new Set(['toby', 'bori', 'ruru', 'nabi', 'grandoll', 'haru4', 'haru5', 'haru7', 'haru8', 'haru10', 'haru12', 'haru13', 'haru14', 'haru15', 'grandma', 'mom', 'dad', 'bear', 'jelly', 'tin', 'dusty', 'king']);
const SPEAKERS = new Set(['', 'toby', 'bori', 'ruru', 'nabi', 'doll', 'haru', 'gm', 'mom', 'dad', 'bear', 'jelly', 'tin', 'dusty', 'king']);

/** 대본 안의 모든 명령 (갈래 속까지) */
function flat(cmds: readonly Cmd[]): Cmd[] {
  return cmds.flatMap((c) => (c.t === 'if' ? [c, ...flat(c.then), ...flat(c.else ?? [])] : [c]));
}

function scenesOf(r: RoomDef): Cmd[][] {
  return r.things.flatMap((t) => {
    const out: Cmd[][] = [];
    if ('scene' in t) out.push(t.scene);
    if (t.kind === 'memory' && t.after) out.push(t.after);
    if (t.kind === 'link') out.push(t.locked);
    return out;
  });
}

const rooms = Object.fromEntries(Object.entries(ROOMS).map(([k, f]) => [k, f()]));
const allScripts: Cmd[][] = [...CHAPTERS.map((c) => c.intro), ...Object.values(rooms).flatMap(scenesOf), ...Object.values(rooms).flatMap((r) => r.steps?.caught ?? [])];

/** 걸어서 닿는 칸 (덩어리는 밀 수 있다고 보고, 밧줄 다리는 놓였다고 본다) */
function reach(r: RoomDef): Set<string> {
  const open = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= r.w || y >= r.h) return false;
    if (r.things.some((t) => t.kind === 'gap' && t.tiles.some((p) => p[0] === x && p[1] === y))) return true;
    return !isSolidChar(r.tiles[y][x]);
  };
  const seen = new Set<string>([`${r.start.x},${r.start.y}`]);
  const q = [[r.start.x, r.start.y]];
  while (q.length) {
    const [x, y] = q.pop()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = `${x + dx},${y + dy}`;
      if (!seen.has(k) && open(x + dx, y + dy)) {
        seen.add(k);
        q.push([x + dx, y + dy]);
      }
    }
  }
  return seen;
}

describe('이야기 자료', () => {
  test('장은 1장부터 차례로, 장마다 방이 있다', () => {
    CHAPTERS.forEach((c, i) => {
      assert.equal(c.n, i + 1);
      assert.ok(rooms[c.room], `${c.title} 방 ${c.room}`);
    });
  });

  test('장 방에는 기억 조각 셋과 기억의 문 하나 (마지막 장 · 엔딩은 빼고)', () => {
    for (const c of CHAPTERS.slice(0, -1)) {
      const r = rooms[c.room];
      assert.equal(r.things.filter((t) => t.kind === 'memory').length, 3, c.title);
      assert.equal(r.things.filter((t) => t.kind === 'link').length, 1, c.title);
    }
  });

  test('기억의 문은 다음 장으로, 마지막 장은 크레디트와 끝 깃발', () => {
    for (const c of CHAPTERS.slice(0, -1)) {
      const link = rooms[c.room].things.find((t) => t.kind === 'link')!;
      const cs = flat(link.kind === 'link' ? link.scene : []);
      assert.deepEqual(cs.find((x) => x.t === 'chapter'), { t: 'chapter', n: c.n + 1 }, c.title);
    }
    const last = flat(CHAPTERS.at(-1)!.intro);
    assert.ok(last.some((x) => x.t === 'credits'));
    assert.deepEqual(last.at(-1), { t: 'flag', name: 'ending' });
  });

  test('방에 놓인 것은 걸을 수 있는 칸에, 장 시작 자리에서 걸어서 닿는다', () => {
    for (const r of Object.values(rooms)) {
      if (r.scale !== 'toy') continue;
      const ok = reach(r);
      for (const t of r.things) {
        if (t.kind === 'trigger') continue;
        const [x, y] = t.at;
        if (t.kind !== 'gap') assert.ok(!isSolidChar(r.tiles[y]?.[x]), `${r.id} ${t.id} (${x},${y}) 막힌 칸`);
        if (t.kind === 'block' || t.kind === 'gap') continue;
        const near = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => ok.has(`${x + dx},${y + dy}`));
        assert.ok(near, `${r.id} ${t.id} (${x},${y}) 닿지 않는다`);
      }
    }
  });

  test('대본의 방 · 인물 그림 · 말하는 이 · 놀이는 모두 있는 것', () => {
    for (const sc of allScripts)
      for (const c of flat(sc)) {
        if (c.t === 'room') assert.ok(rooms[c.id], `없는 방 ${c.id}`);
        if (c.t === 'show') assert.ok(KINDS.has(c.kind), `없는 그림 ${c.kind}`);
        if (c.t === 'say') assert.ok(SPEAKERS.has(c.who) || /_sleep$/.test(c.who), `모르는 말하는 이 ${c.who}: ${c.text}`);
        if (c.t === 'mini') assert.ok(['stars', 'star1000', 'candles', 'sew', 'puppet', 'wind'].includes(c.id), c.id);
      }
  });

  test('모든 기억 조각에는 이름과 앨범 한 줄이 있다', () => {
    for (const r of Object.values(rooms)) for (const t of r.things) if (t.kind === 'memory') assert.ok(t.name && t.caption, `${r.id} ${t.id}`);
  });

  test('아이디는 겹치지 않는다 (기억 · 종이별 · 살펴보기 깃발이 섞이지 않게)', () => {
    const ids = Object.values(rooms).flatMap((r) => r.things.map((t: Thing) => t.id));
    const dup = ids.filter((id, i) => ids.indexOf(id) !== i && !id.startsWith('doll'));
    assert.deepEqual(dup, []);
  });
});

describe('이야기 돌려 보기', () => {
  /** 장마다: 들어오는 대본을 끝까지, 방의 모든 것을 차례로 살펴보고 대본을 끝까지 (오류 없이) */
  test('모든 장의 모든 대본이 오류 없이 끝까지 돈다', () => {
    for (const c of CHAPTERS) {
      const a = new Adv(STORY);
      a.save.chapter = c.n;
      (a as unknown as { applyChapter(n: number): void }).applyChapter(c.n);
      const run = () => {
        for (let i = 0; i < 60 * 600 && (a.runner || a.mini); i++) {
          if (a.mini) a.mini.done = true;
          a.step(1 / 30, { ...NO_INPUT, act: i % 2 === 0, hold: true });
        }
        assert.equal(a.runner, null, `${c.title}: 대본이 끝나지 않는다`);
      };
      run();
      for (const f of Object.keys(a.flags)) void f;
      // 깨우기 · 퍼즐 순서와 상관없이 모든 대본을 한 번씩
      const r = rooms[c.room];
      for (const t of r.things) {
        if (t.kind === 'trigger' || t.kind === 'link' || t.kind === 'block' || t.kind === 'gap' || t.kind === 'dark') continue;
        a.run('scene' in t ? t.scene : []);
        run();
        if (a.room.id !== c.room) a.goRoom(c.room);
      }
    }
  });
});
