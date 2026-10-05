import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Adv, isMemory, NO_INPUT, type MemThing } from '../adv.ts';
import { MINI_IDS, parsePuzzleId, PUZZLE_KINDS } from '../mini.ts';
import { CHAPTERS, ROOMS, STORY } from '../story/index.ts';
import { ROAD } from '../story/talks.ts';
import { SONGS } from '../../../ui/audio/score.ts';
import { STORY_SFX } from '../../../ui/audio/storysfx.ts';
import { ALBUM, albumStart } from '../story/album.ts';
import { isSolidChar } from '../../maps.ts';
import { LOOKS } from '../../../ui/art/house.ts';
import type { Chapter, Cmd, RoomDef, Thing } from '../types.ts';
import { isPal } from '../pals.ts';
import { DECAL_KINDS } from '../story/kit.ts';
import { lookPix } from '../../../ui/render/looks.ts';
import { itemSprite } from '../../../ui/art/items.ts';
import { atticRoom } from '../story/ch1.ts';
import { grandRoom } from '../story/ch2.ts';
import { underbedRoom } from '../story/ch3.ts';
import { windowRoom } from '../story/ch4.ts';
import { deskRoom } from '../story/ch5.ts';
import { shelfRoom } from '../story/ch6.ts';
import { drawerRoom } from '../story/ch7.ts';
import { yardRoom } from '../story/ch8.ts';
import { toyboxRoom } from '../story/ch9.ts';
import { balconyRoom } from '../story/ch_balcony.ts';
import { bathRoom } from '../story/ch_bath.ts';
import { closetRoom } from '../story/ch_closet.ts';
import { cupboardRoom } from '../story/ch_cupboard.ts';
import { dresserRoom } from '../story/ch_dresser.ts';
import { entranceRoom } from '../story/ch_entrance.ts';
import { newroomToyRoom } from '../story/ch_epilogue.ts';
import { sewboxRoom } from '../story/ch_grandma.ts';
import { outsideRoom } from '../story/ch_outside.ts';
import { schoolbagRoom } from '../story/ch_schoolbag.ts';
import { sofaRoom } from '../story/ch_sofa.ts';
import { tobykeyRoom } from '../story/ch_tobykey.ts';
import { MORE } from '../story/more.ts';
import { MORE2 } from '../story/more2.ts';
import { MORE3A } from '../story/more3a.ts';
import { MORE3B } from '../story/more3b.ts';

const KINDS = new Set(['toby', 'bori', 'ruru', 'nabi', 'grandoll', 'haru4', 'haru5', 'haru6', 'haru7', 'haru9', 'haru11', 'haru8', 'haru10', 'haru12', 'haru13', 'haru14', 'haru15', 'grandma', 'suni7', 'suni20', 'suni40', 'gpa', 'gmom', 'eunju6', 'jiwoo10', 'jiwoo13', 'mom', 'dad', 'bear', 'jelly', 'tin', 'dusty', 'king']);
const SPEAKERS = new Set(['', 'cuckoo', 'toby', 'bori', 'ruru', 'nabi', 'doll', 'haru', 'gm', 'suni', 'gpa', 'gmom', 'eunju', 'jiwoo', 'mom', 'dad', 'bear', 'jelly', 'tin', 'dusty', 'king', 'pins', 'coin', 'frog', 'cat']);
// 태엽 속 (큰톱니 · 작은톱니) · 재봉 상자 (골무 아재) 주민
for (const w of ['gear', 'cog', 'thimble']) SPEAKERS.add(w);

/** 대본 안의 모든 명령 (갈래 속까지) */
function flat(cmds: readonly Cmd[]): Cmd[] {
  return cmds.flatMap((c) => (c.t === 'if' ? [c, ...flat(c.then), ...flat(c.else ?? [])] : [c]));
}

function scenesOf(r: RoomDef): Cmd[][] {
  return r.things.flatMap((t) => {
    const out: Cmd[][] = [];
    if ('scene' in t && t.scene) out.push(t.scene);
    if (isMemory(t) && t.after) out.push(t.after);
    if (isMemory(t) && t.aside) out.push(t.aside.text);
    if (t.kind === 'link') out.push(t.locked);
    if (t.kind === 'seq' && t.wrong) out.push(t.wrong);
    if (t.kind === 'watcher') out.push(t.caught, t.hint ?? []);
    if (isMemory(t) && t.explore) out.push(t.explore.intro ?? [], ...t.explore.threads.map((x) => x.text), ...(t.explore.looks ?? []).map((x) => x.text));
    return out;
  });
}

const rooms = Object.fromEntries(Object.entries(ROOMS).map(([k, f]) => [k, f()]));
const allScripts: Cmd[][] = [...CHAPTERS.map((c) => c.intro), ...Object.values(rooms).flatMap(scenesOf), ...Object.values(rooms).flatMap((r) => r.steps?.caught ?? [])];

/** 장난감이 걷는 방인가 (장난감 크기 방 · 장난감이 걷는 사람 크기 장 방) */
const toyWalks = (r: RoomDef): boolean => r.scale === 'toy' || !!r.toys;

/**
 * 걸어서 닿는 칸 (덩어리 · 밀 물건은 밀 수 있다고 보고, 밧줄 다리 · 오르기는 놓였다고 본다).
 * 높이(elev)가 다른 칸으로는 걸어서 못 가고 오르기(climb)로만 잇는다. 장난감은 가구 밑 U 를 지나간다.
 */
function reach(r: RoomDef, from: readonly [number, number] = [r.start.x, r.start.y]): Set<string> {
  const toy = toyWalks(r);
  const elev = (x: number, y: number) => Number(r.elev?.[y]?.[x] ?? 0);
  const open = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= r.w || y >= r.h) return false;
    if (r.things.some((t) => t.kind === 'gap' && t.tiles.some((p) => p[0] === x && p[1] === y))) return true;
    if (toy && r.tiles[y][x] === 'U') return true;
    return !isSolidChar(r.tiles[y][x]);
  };
  const climbs = r.things.flatMap((t) => (t.kind === 'climb' ? [[t.at, t.to], [t.to, t.at]] : []));
  const seen = new Set<string>([`${from[0]},${from[1]}`]);
  const q = [[from[0], from[1]]];
  while (q.length) {
    const [x, y] = q.pop()!;
    const next: [number, number][] = [];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (open(x + dx, y + dy) && elev(x + dx, y + dy) === elev(x, y)) next.push([x + dx, y + dy]);
    for (const [a, b] of climbs) if (a[0] === x && a[1] === y) next.push([b[0], b[1]]);
    for (const [nx, ny] of next) {
      const k = `${nx},${ny}`;
      if (!seen.has(k)) {
        seen.add(k);
        q.push([nx, ny]);
      }
    }
  }
  return seen;
}

const DAWN = CHAPTERS.find((c) => c.room === 'attic_dawn')!;
const PRO = CHAPTERS.find((c) => c.room === 'h_yard_eve')!;
/** 기억 조각을 모으며 탐험하는 장 (새벽 장 · 서장 빼고) */
const EXPLORE = CHAPTERS.filter((c) => c !== DAWN && c !== PRO);

describe('이야기 자료', () => {
  test('장은 1장부터 차례로, 장마다 방이 있다', () => {
    CHAPTERS.forEach((c, i) => {
      assert.equal(c.n, i + 1);
      assert.ok(rooms[c.room], `${c.title} 방 ${c.room}`);
    });
  });

  /** 서장(앞마당) · 새벽 다락방은 탐험 없이 이야기만 (기억 조각 · 기억의 문 없음) */

  test('서장은 맨 앞: 하루가 되어 앞마당을 걷고, 기억 조각 없이 다락방 장으로 이어진다', () => {
    assert.equal(CHAPTERS.indexOf(PRO), 0);
    const r = rooms[PRO.room];
    assert.equal(r.scale, 'human');
    assert.equal(r.things.filter((t) => isMemory(t)).length, 0);
    assert.ok(flat(PRO.intro).some((c) => c.t === 'control' && c.who === 'haru'), '하루를 조종한다');
    const scripts = r.things.flatMap((t) => ('scene' in t && t.scene ? [flat(t.scene)] : []));
    assert.ok(scripts.some((sc) => sc.some((c) => c.t === 'next')), '다음 장으로');
    assert.equal(CHAPTERS[1].title, '1장 · 다락방', '서장 다음이 1장');
  });

  test('장의 목표는 이야기 한 줄: 개수를 세지 않고 「기억 조각」을 말하지 않는다 (숫자는 앨범에만)', () => {
    const COUNT = /\d|(한|두|세|네|다섯|여섯|일곱|여덟|아홉|열)\s*개|개를 찾자|기억 조각/;
    let checked = 0;
    for (const c of CHAPTERS) {
      const scripts = [c.intro, ...scenesOf(rooms[c.room])];
      const goals = scripts.flatMap((sc) => flat(sc)).flatMap((x) => (x.t === 'goal' && x.text ? [x.text] : []));
      for (const g of goals) assert.ok(!COUNT.test(g), `${c.title}: 목표 「${g}」 가 개수를 센다`);
      checked += goals.length;
    }
    assert.ok(checked >= 20, `목표 ${checked}개`);
  });

  test('탐험하는 장마다 들어올 때 이야기 목표 한 줄을 건다 (빈 목표로 시작하지 않는다)', () => {
    for (const c of EXPLORE) {
      const g = flat(c.intro).find((x) => x.t === 'goal');
      assert.ok(g && g.t === 'goal' && g.text && g.text.length >= 8, `${c.title}: 들어올 때 목표가 없다`);
    }
  });

  test('탐험하는 장 (에필로그 포함) 방에는 기억 조각 다섯~일곱 개와 기억의 문 하나', () => {
    assert.ok(EXPLORE.length >= 14);
    for (const c of EXPLORE) {
      const r = rooms[c.room];
      const n = r.things.filter((t) => isMemory(t)).length;
      assert.ok(n >= 5 && n <= 7, `${c.title}: 기억 ${n}개`);
      assert.equal(r.things.filter((t) => t.kind === 'link').length, 1, c.title);
    }
  });

  test('가는 길 잡담은 실제 장의 방에 붙고, 장 시작의 띠를 걷기 전에 나온다', () => {
    for (const room of Object.keys(ROAD)) {
      const c = CHAPTERS.find((x) => x.room === room);
      assert.ok(c, `잡담 ${room} 에 맞는 장이 없다`);
      const first = flat(ROAD[room])[0];
      const i = c!.intro.indexOf(first);
      const off = c!.intro.findIndex((x) => x.t === 'bars' && !x.on);
      assert.ok(i >= 0 && i < off, `${c!.title}: 잡담이 띠 걷기 전에 없다`);
    }
  });

  test('기억의 문 맞추기는 장마다 네 가지 놀이를 돌아가며, 같은 놀이는 장이 갈수록 다음 단계', () => {
    const ids = EXPLORE.flatMap((c) => {
      const link = rooms[c.room].things.find((t) => t.kind === 'link')!;
      return flat(link.kind === 'link' ? link.scene : []).flatMap((x) => (x.t === 'mini' && parsePuzzleId(x.id) ? [x.id] : []));
    });
    assert.ok(ids.length >= 13);
    const ps = ids.map((i) => parsePuzzleId(i)!);
    // 이웃한 두 장은 다른 놀이
    for (let i = 1; i < ps.length; i++) assert.notEqual(ps[i].kind, ps[i - 1].kind, `${ids[i - 1]} → ${ids[i]}`);
    // 네 가지 모두 쓰고, 놀이마다 1, 2, 3 … 단계 차례로
    for (const k of PUZZLE_KINDS) {
      const lv = ps.filter((p) => p.kind === k).map((p) => p.level);
      assert.ok(lv.length > 0, `${k} 를 쓰는 장이 없다`);
      assert.deepEqual(lv, lv.map((_, i) => i + 1), k);
    }
  });

  test('기억의 문은 다음 장으로, 새벽 장은 에필로그로, 에필로그의 문은 크레디트와 끝 깃발', () => {
    const linkOf = (c: Chapter) => {
      const link = rooms[c.room].things.find((t) => t.kind === 'link')!;
      return flat(link.kind === 'link' ? link.scene : []);
    };
    for (const c of EXPLORE.slice(0, -1)) assert.ok(linkOf(c).some((x) => x.t === 'next'), c.title);
    // 새벽 장은 끝에서 둘째, 이야기 끝에 다음 장 (에필로그) 으로
    assert.equal(CHAPTERS.indexOf(DAWN), CHAPTERS.length - 2);
    const dawn = flat(DAWN.intro);
    assert.ok(dawn.some((x) => x.t === 'next'));
    assert.ok(!dawn.some((x) => x.t === 'credits'));
    const last = linkOf(CHAPTERS.at(-1)!);
    assert.ok(!last.some((x) => x.t === 'next'));
    assert.ok(last.some((x) => x.t === 'credits'));
    assert.deepEqual(last.at(-1), { t: 'flag', name: 'ending' });
  });

  test('방에 놓인 것은 걸을 수 있는 칸에, 장 시작 자리에서 걸어서 닿는다', () => {
    for (const r of Object.values(rooms)) {
      if (!toyWalks(r)) continue;
      const ok = reach(r);
      for (const t of r.things) {
        // 지켜보는 이 (침대 위) · 빛 · 톱니 동력 · 물 수원은 가구 · 벽 칸에 있어도 된다
        if (t.kind === 'trigger' || t.kind === 'seq' || t.kind === 'chase' || t.kind === 'watcher' || t.kind === 'beam' || t.kind === 'gears' || t.kind === 'flow') continue;
        const [x, y] = t.at;
        if (t.kind !== 'gap') assert.ok(!isSolidChar(r.tiles[y]?.[x]), `${r.id} ${t.id} (${x},${y}) 막힌 칸`);
        if (t.kind === 'block' || t.kind === 'push' || t.kind === 'gap') continue;
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
        if (c.t === 'mini') assert.ok(MINI_IDS.includes(c.id), c.id);
      }
  });

  test('기억 조각의 이름과 앨범 한 줄은 서로 겹치지 않는다 (같은 장면이 두 번 나오지 않게)', () => {
    const mems = CHAPTERS.flatMap((c) => rooms[c.room].things.filter((t): t is MemThing => isMemory(t)));
    const dup = (xs: string[]) => xs.filter((x, i) => xs.indexOf(x) !== i);
    assert.deepEqual(dup(mems.map((m) => m.name)), [], '이름이 겹친다');
    assert.deepEqual(dup(mems.map((m) => m.caption ?? '')), [], '앨범 한 줄이 겹친다');
  });

  test('모든 기억 조각에는 이름과 앨범 한 줄이 있다', () => {
    for (const r of Object.values(rooms)) for (const t of r.things) if (isMemory(t)) assert.ok(t.name && t.caption, `${r.id} ${t.id}`);
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
      // 처음 장(서장)의 들어오는 대본은 건너뛰고 바로 그 장으로
      a.runner = null;
      (a as unknown as { queue: unknown[] }).queue = [];
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
        a.run('scene' in t ? (t.scene ?? []) : []);
        run();
        if (a.room.id !== c.room) a.goRoom(c.room);
      }
    }
  });
});

describe('기억 속을 걷기', () => {
  type Mem = MemThing;
  const walks = (c: Chapter): Mem[] => rooms[c.room].things.filter((t): t is Mem => isMemory(t) && !!t.explore);
  const memRoom = (m: Mem) => {
    const r = m.scene.find((c) => c.t === 'room');
    return rooms[r && r.t === 'room' ? r.id : ''];
  };

  test('탐험하는 장마다 걷는 기억이 둘 이상 (기억 조각만 줍는 장이 없게)', () => {
    for (const c of EXPLORE) assert.ok(walks(c).length >= 2, `${c.title}: 걷는 기억 ${walks(c).length}개`);
  });

  test('걷는 기억: 실은 둘 이상, 들어선 자리에서 걸어서 닿고, 실 · 살펴볼 것이 한 칸에 겹치지 않는다', () => {
    for (const c of EXPLORE)
      for (const m of walks(c)) {
        const r = memRoom(m);
        assert.ok(r, `${m.id}: 기억 방이 없다`);
        const e = m.explore!;
        assert.ok(e.threads.length >= 2 && e.threads.length <= 5, `${m.id}: 실 ${e.threads.length}개`);
        assert.ok(!isSolidChar(r.tiles[e.enter[1]][e.enter[0]]), `${m.id}: 들어서는 칸이 막혔다`);
        const ok = reach(r, e.enter);
        const all = [...e.threads, ...(e.looks ?? [])];
        const keys = all.map((x) => `${x.at[0]},${x.at[1]}`);
        assert.equal(new Set(keys).size, keys.length, `${m.id}: 겹친 칸`);
        for (const x of all) {
          const near = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => ok.has(`${x.at[0] + dx},${x.at[1] + dy}`));
          assert.ok(near, `${m.id} (${x.at}) 닿지 않는다`);
        }
        assert.ok(!flat(m.scene).some((x) => x.t === 'control'), `${m.id}: 걷는 기억 장면에 @control 은 쓰지 않는다`);
      }
  });

  test('걷는 기억은 실을 다 모으면 장면이 흐르고 원래 장 방으로 돌아온다 (조각 깃발 · 앨범)', () => {
    for (const c of EXPLORE)
      for (const m of walks(c)) {
        const a = new Adv(STORY);
        a.runner = null;
        (a as unknown as { queue: unknown[] }).queue = [];
        const h = a as unknown as { applyChapter(n: number): void; interact(t: Thing): void };
        h.applyChapter(c.n);
        const run = () => {
          for (let i = 0; i < 60 * 600 && (a.runner || a.mini); i++) {
            if (a.mini) a.mini.done = true;
            a.step(1 / 30, { ...NO_INPUT, act: i % 2 === 0, hold: true });
          }
        };
        run();
        h.interact(m);
        run();
        assert.deepEqual(a.threadCount(), { got: 0, total: m.explore!.threads.length }, m.id);
        assert.equal(a.room.id, memRoom(m).id);
        for (const th of a.things().filter((t) => t.kind === 'thread')) {
          h.interact(th);
          run();
        }
        assert.equal(a.flags[`mem_${m.id}`], true, m.id);
        assert.ok(a.save.album.includes(m.id));
        assert.equal(a.room.id, c.room, `${m.id}: 돌아오지 못했다`);
        assert.equal(a.threadCount(), null);
      }
  });
});

describe('집 밖으로', () => {
  type Mem = MemThing;
  const memRoomId = (m: Mem) => {
    const r = m.scene.find((c) => c.t === 'room');
    return r && r.t === 'room' ? r.id : '';
  };
  const allMems = CHAPTERS.flatMap((c) => rooms[c.room].things.filter((t): t is Mem => isMemory(t)));
  const usedRooms = new Set(allMems.map(memRoomId));

  test('기억 속 바깥: 골목(아스팔트) · 학교 가는 길(보도) · 놀이터(모래) · 옛 마을(흙길) 바닥이 기억 장면에 쓰인다', () => {
    for (const kind of ['asphalt', 'paving', 'sand', 'dirt']) {
      const used = Object.values(rooms).filter((r) => r.scale === 'human' && LOOKS[r.look ?? '']?.floorKind === kind && usedRooms.has(r.id));
      assert.ok(used.length >= 1, `${kind} 바닥의 기억 방이 기억 장면에 쓰이지 않는다`);
    }
  });

  test('바깥 기억 방은 다섯 곳 이상이고, 그 기억들은 걷는 기억이다 (바깥을 직접 걷는다)', () => {
    const OUT = new Set(['asphalt', 'paving', 'sand', 'dirt']);
    const outRooms = Object.values(rooms).filter((r) => r.scale === 'human' && OUT.has(LOOKS[r.look ?? '']?.floorKind ?? '') && usedRooms.has(r.id));
    assert.ok(outRooms.length >= 5, `바깥 기억 방 ${outRooms.length}곳`);
    const outMems = allMems.filter((m) => outRooms.some((r) => r.id === memRoomId(m)));
    for (const m of outMems) assert.ok(m.explore, `${m.id}: 바깥 기억인데 걷는 기억이 아니다`);
  });

  test('장난감들의 바깥 모험: 「outside」 장은 장난감 크기 방이고, 그 장 기억 중 셋 이상이 바깥 기억 방에서', () => {
    const c = CHAPTERS.find((x) => x.room === 'outside');
    assert.ok(c, 'outside 장이 없다');
    const r = rooms[c.room];
    assert.ok(toyWalks(r), '장난감이 걷는 방 (장난감 크기 · 장난감이 걷는 사람 크기 지도)');
    const OUT = new Set(['asphalt', 'paving', 'sand', 'dirt', 'grass']);
    const mems = r.things.filter((t): t is Mem => isMemory(t));
    const outside = mems.filter((m) => OUT.has(LOOKS[rooms[memRoomId(m)]?.look ?? '']?.floorKind ?? ''));
    assert.ok(outside.length >= 3, `바깥 기억 ${outside.length}개`);
  });
});

/**
 * 처음부터 끝까지 실제로 풀어 보는 시험이 따로 있는 장 방 (새 놀이: 바람 · 물길 · 숨바꼭질 · 낮은 천장 · 조각 배달 · 당기기).
 * 1장 다락방은 아래 「1장 다락방을 처음부터 끝까지」, 베란다 · 소파 밑 · 마당 · 골목은 rooms_d.test.ts.
 */
const FULL_PLAY = new Set(['attic', 'balcony', 'sofa', 'yard', 'outside']);

describe('퍼즐은 풀린다', () => {
  test('덩어리를 차례로 밀면 (보리), 밧줄을 걸면 (루루), 등불이 있으면 (나비) 그 방의 모든 기억 조각에 닿는다', () => {
    // 사람 크기 집 지도 장 · 근접 지도 장(갈래별 rooms_*.test.ts)은 저마다 처음부터 끝까지 놀이를 하나하나 풀어 본다
    for (const c of CHAPTERS.filter((c) => c.room !== 'attic_dawn' && c.room !== 'h_yard_eve' && !rooms[c.room].toys && !FULL_PLAY.has(c.room))) {
      const r = rooms[c.room];
      const a = new Adv(STORY);
      // 처음 장(서장)의 들어오는 대본은 건너뛰고 바로 그 장으로
      a.runner = null;
      (a as unknown as { queue: unknown[] }).queue = [];
      (a as unknown as { applyChapter(n: number): void }).applyChapter(c.n);
      for (let i = 0; i < 60 * 600 && a.runner; i++) a.step(1 / 30, { ...NO_INPUT, act: i % 2 === 0, hold: true });
      for (const g of r.things) if (g.kind === 'gap') a.flags[`gap_${g.id}`] = true;
      a.flags.found_nabi = true;
      a.save.party = ['toby', 'bori', 'ruru', 'nabi'];
      a.syncParty();
      a.call('all', true);
      for (const t of r.things) {
        if (t.kind !== 'block') continue;
        const [bx, by] = t.at;
        let moved = false;
        for (const [dx, dy, dir] of [[-1, 0, 'right'], [1, 0, 'left'], [0, -1, 'down'], [0, 1, 'up']] as const) {
          if (a.solid(bx + dx, by + dy)) continue;
          a.place((bx + dx + 0.5) * 24, (by + dy + 0.5) * 24);
          // 그 자리에서 터지는 안내 대사는 먼저 넘긴다
          a.step(1 / 60, NO_INPUT);
          for (let i = 0; i < 600 && a.runner; i++) a.step(1 / 30, { ...NO_INPUT, act: i % 2 === 0 });
          a.face(dir);
          a.step(1 / 60, NO_INPUT);
          if (a.prompt?.id !== t.id) continue;
          a.step(1 / 60, { ...NO_INPUT, act: true });
          for (let i = 0; i < 600 && a.runner; i++) a.step(1 / 30, { ...NO_INPUT, act: i % 2 === 0 });
          const [nx, ny] = a.blockAt(t.id);
          if (nx !== bx || ny !== by) {
            moved = true;
            break;
          }
        }
        assert.ok(moved, `${c.title} ${t.id} 이 꿈쩍도 안 한다`);
      }
      // 모든 기억 조각 칸까지 길이 있다 (장 시작 자리에서)
      const seen = new Set<string>([`${c.start[0]},${c.start[1]}`]);
      const q = [[c.start[0], c.start[1]]];
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
      for (const m of r.things) if (isMemory(m) || m.kind === 'link') assert.ok(seen.has(`${m.at[0]},${m.at[1]}`), `${c.title}: ${m.id} 에 닿지 않는다`);
    }
  });
});

describe('1장 다락방을 처음부터 끝까지 실제로 풀어 본다 (사람 크기 다락 · 장난감이 걷는다)', () => {
  const CH1 = CHAPTERS.find((c) => c.room === 'attic')!;
  type Dir = 'up' | 'down' | 'left' | 'right';
  const T = 24;
  const cell = (a: Adv): [number, number] => {
    const p = a.stage.actors.toby;
    return [Math.floor(p.x / T), Math.floor(p.y / T)];
  };
  /** 대본 · 놀이가 끝날 때까지 넘긴다 (작은 놀이는 끝난 것으로) */
  const finish = (a: Adv) => {
    for (let i = 0; i < 60 * 600 && (a.runner || a.mini); i++) {
      if (a.mini) a.mini.done = true;
      a.step(1 / 30, { ...NO_INPUT, act: i % 2 === 0, hold: true });
    }
    assert.equal(a.runner, null, '대본이 끝나지 않는다');
  };
  /** 그 칸에 서서 (밟으면 터지는 대본은 먼저 넘기고) 그쪽을 본다 → 지금 누를 수 있는 것 */
  const stand = (a: Adv, x: number, y: number, dir: Dir) => {
    a.place((x + 0.5) * T, (y + 0.5) * T);
    a.step(1 / 60, NO_INPUT);
    finish(a);
    a.face(dir);
    a.step(1 / 60, NO_INPUT);
    return a.prompt;
  };
  /** 그 칸에서 그쪽을 보고 누른다: 눌린 것이 want 인지 확인하고 대본을 끝까지 */
  const use = (a: Adv, x: number, y: number, dir: Dir, want: string) => {
    assert.equal(stand(a, x, y, dir)?.id, want, `(${x},${y}) ${dir} 에서 ${want} 을 누를 수 있어야 한다`);
    a.step(1 / 60, { ...NO_INPUT, act: true });
    finish(a);
  };
  /** 동료가 자기 자리에 갈 때까지 기다렸다가, 옆에 서서 말을 걸고 「같이 가자」 */
  const callPal = (a: Adv, h: 'bori' | 'ruru' | 'nabi') => {
    const home = a.palHome(h)!;
    for (let i = 0; i < 60 * 20; i++) {
      const q = a.stage.actors[h];
      if (Math.floor(q.x / T) === home[0] && Math.floor(q.y / T) === home[1] && !q.moving) break;
      a.step(1 / 60, NO_INPUT);
    }
    const side = ([[-1, 0, 'right'], [1, 0, 'left'], [0, 1, 'up'], [0, -1, 'down']] as const).find(([dx, dy]) => !a.solid(home[0] + dx, home[1] + dy))!;
    use(a, home[0] + side[0], home[1] + side[1], side[2], `pal_${h}`);
  };
  /** 지금 조종 인물이 (밀 물건 · 높이까지 따져) 걸어서 닿는 칸 */
  const walkable = (a: Adv): Set<string> => {
    const [sx, sy] = cell(a);
    const seen = new Set([`${sx},${sy}`]);
    const q = [[sx, sy]];
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
  };
  const start = (): Adv => {
    const a = new Adv(STORY);
    a.runner = null;
    (a as unknown as { queue: unknown[] }).queue = [];
    (a as unknown as { applyChapter(n: number): void }).applyChapter(CH1.n);
    finish(a);
    return a;
  };

  test('다락은 사람 크기 집 지도이고, 장난감이 걷는다 (토비가 무대에 선다)', () => {
    const r = rooms.attic;
    assert.equal(r.scale, 'human');
    assert.equal(r.toys, true);
    assert.ok(r.w >= 28 && r.w <= 32 && r.h >= 17 && r.h <= 20, `${r.w}×${r.h}`);
    const kinds = new Set((r.furniture ?? []).map((f) => f.kind.split(':')[0]));
    for (const k of ['atticWall', 'beam', 'railing', 'cuckoo', 'xmasbox', 'fan', 'tricycle', 'mat', 'dresserCloth', 'bookbundle', 'umbrellaStand', 'sewbox', 'mousetrap', 'cobweb', 'movingBoxes']) assert.ok(kinds.has(k), `소품 ${k} 이 없다`);
    assert.ok((r.furniture ?? []).filter((f) => f.kind === 'beam' && f.over).length === 2, '윗층 들보 두 개');
    assert.equal((r.furniture ?? []).filter((f) => f.fg).length, 1, '앞쪽 가림막 하나');
    assert.ok(r.beams?.length, '박공 창 달빛');
    const a = start();
    assert.ok(a.stage.actors.toby, '토비가 무대에 있다');
    assert.deepEqual(cell(a), CH1.start);
  });

  test('목표는 이야기 한 줄씩: 상자 밖으로 → 친구들을 깨우자 → 뚜껑문을 열고 아래층으로 (「기억 조각」 개수 말하기 없음)', () => {
    const goals = [CH1.intro, ...scenesOf(rooms.attic)].flatMap((sc) => flat(sc)).flatMap((c) => (c.t === 'goal' && c.text ? [c.text] : []));
    for (const g of goals) assert.ok(!/기억 조각|개를 찾자/.test(g), `목표 「${g}」`);
    const a = start();
    assert.equal(a.stage.goal, '상자 밖으로 나가자');
    assert.ok(goals.some((g) => g.includes('친구들을 깨우자')));
    assert.ok(goals.some((g) => g.includes('뚜껑문을 열고 아래층으로')));
  });

  test('기억 일곱 개는 모두 다락의 물건(keepsake)이고, 정해진 물건 그림으로 놓인다', () => {
    const mems = rooms.attic.things.filter((t): t is MemThing => isMemory(t));
    assert.deepEqual(mems.map((m) => m.id).sort(), ['m1a', 'm1b', 'm1c', 'm1d', 'm1e', 'm1f', 'm1g']);
    const look = Object.fromEntries(mems.map((m) => [m.id, m.kind === 'keepsake' ? m.look : '구슬']));
    assert.deepEqual(look, { m1a: 'tape', m1b: 'photo:down', m1c: 'crack', m1d: 'chairOld', m1e: 'yarn', m1f: 'letter', m1g: 'paintcan' });
    const link = rooms.attic.things.find((t) => t.kind === 'link');
    assert.equal(link?.kind === 'link' && link.name, '재봉 상자 틈의 바늘');
  });

  test('놀이를 차례로 풀면 동료가 모두 깨고, 뚜껑문이 열리고, 사다리 아래 바늘로 다음 장에 간다', () => {
    const a = start();
    // 1. 상자 탈출: 상자 안은 높은 층, 걸어서는 못 나가고 테이프 자락으로만
    assert.equal(a.stage.actors.toby.elev, 1, '상자 안 (높은 층) 에서 시작');
    assert.ok(a.solid(8, 5) && a.solid(6, 6), '상자 밖 바닥 · 상자 앞면은 걸어서 못 간다');
    assert.ok(!walkable(a).has('9,5'));
    use(a, 6, 5, 'right', 'box_tape');
    assert.deepEqual(cell(a), [8, 5]);
    assert.equal(a.stage.actors.toby.elev, 0);
    a.step(1 / 60, NO_INPUT);
    finish(a);
    assert.equal(a.flags.out_box, true);
    assert.match(a.stage.goal ?? '', /친구들을 깨우자/);

    // 2. 보리 깨우기: 사탕을 빼기 전 선풍기는 먼지만, 사탕 → 책 더미에 걸림 → 선풍기 바람 → 보리
    use(a, 12, 10, 'up', 'fan');
    assert.ok(!a.flags.woke_bori, '사탕을 빼기 전에는 깨지 않는다');
    use(a, 10, 10, 'up', 'candy');
    assert.equal(a.flags.candy_out, true);
    assert.ok(!a.flags.woke_bori, '사탕이 책 더미에 걸려 아직 못 깬다');
    use(a, 12, 10, 'up', 'fan');
    assert.equal(a.flags.woke_bori, true);
    assert.deepEqual(a.save.party, ['toby', 'bori']);
    assert.deepEqual(a.withMe(), [], '깨어난 보리는 따라오지 않고 자기 자리에서 쉰다');

    // 보리를 부르기 전에는 동화책 더미가 꿈쩍 않는다 → 보리에게 말을 걸어 데려온다
    use(a, 8, 13, 'left', 'books_gate');
    assert.deepEqual(a.blockAt('books_gate'), [7, 13], '보리를 부르기 전');
    callPal(a, 'bori');
    assert.deepEqual(a.withMe(), ['bori']);
    assert.equal(a.flags.with_bori, true, '대본이 쓰는 with_bori 깃발');

    // 뚜껑문은 무게 2: 보리 하나로는 안 열린다
    use(a, 12, 13, 'right', 'trapdoor');
    assert.deepEqual(a.blockAt('trapdoor'), [13, 13], '보리 혼자로는 꿈쩍 않는다');
    assert.ok(!a.flags.trap_open);

    // 보리의 첫 밀기: 동화책 더미를 두 칸 밀어야 할머니 의자 구석에 들어간다
    assert.ok(!walkable(a).has('3,12'), '처음엔 의자 구석이 막혀 있다');
    use(a, 8, 13, 'left', 'books_gate');
    assert.deepEqual(a.blockAt('books_gate'), [6, 13], '한 칸만 (미끄러지지 않는다)');
    assert.ok(!walkable(a).has('3,12'), '한 번으로는 아직 막힘');
    use(a, 7, 13, 'left', 'books_gate');
    assert.deepEqual(a.blockAt('books_gate'), [5, 13]);
    assert.ok(walkable(a).has('3,12'), '두 번 밀면 의자에 닿는다');

    // 3. 루루 깨우기: 세 번 따라잡기
    stand(a, 16, 13, 'right');
    assert.ok(a.flags.trig_ruru_wake, '가까이 가면 루루가 「잡아 봐라」');
    const ruru = (r: { x: number; y: number }) => [Math.floor(r.x / T), Math.floor(r.y / T)];
    for (let lap = 1; lap <= 3; lap++) {
      const r = a.stage.actors.ruru_sleep;
      const [rx, ry] = ruru(r);
      stand(a, rx - 1, ry, 'right');
      for (let i = 0; i < 60 * 5 && a.stage.actors.ruru_sleep?.goal; i++) a.step(1 / 30, NO_INPUT);
      finish(a);
      if (lap < 3) assert.deepEqual(a.chaseState('ruru_sleep'), { caught: lap, laps: 3, done: false, running: false }, `${lap}번째`);
    }
    assert.equal(a.flags.woke_ruru, true);
    assert.ok(a.save.party.includes('ruru'));
    assert.ok(!a.stage.actors.ruru_sleep, '잡힌 루루는 줄에 낀다');

    // 4. 나비 깨우기: 말 걸어도 안 깨고, 뻐꾹 영감에게 태엽을 나눠 주면 깬다
    use(a, 24, 12, 'right', 'nabi_sleep');
    assert.ok(!a.flags.woke_nabi);
    const before = a.save.wind;
    assert.equal(before, CH1.wind);
    use(a, 22, 4, 'up', 'cuckoo');
    assert.ok(a.flags.trig_cuckoo_meet, '뻐꾹 영감과 먼저 만난다');
    assert.equal(a.flags.woke_nabi, true);
    assert.ok(Math.abs(a.save.wind - (before - 0.15)) < 1e-9, `태엽 ${before} → ${a.save.wind}`);
    assert.equal(a.flags.woke_all, true, '셋 다 깨면 모두 모인 장면');
    assert.equal(a.stage.goal, '뚜껑문을 열고 아래층으로 내려가자');
    assert.notEqual(stand(a, 22, 4, 'up')?.id, 'cuckoo', '태엽은 한 번만 나눠 준다');

    // 5. 뚜껑문: 보리 + 동료(나비를 불러 옴) → 열림 → 둘은 자기 자리로, 루루가 밧줄을 들고 따라온다 → 사다리 아래
    callPal(a, 'nabi');
    assert.deepEqual(a.withMe(), ['bori', 'nabi']);
    use(a, 12, 13, 'right', 'trapdoor');
    assert.deepEqual(a.blockAt('trapdoor'), [14, 13]);
    assert.equal(a.flags.trap_open, true);
    a.step(1 / 60, NO_INPUT);
    finish(a);
    assert.equal(a.flags.trig_hatch_open, true, '열리는 장면');
    assert.deepEqual(a.withMe(), ['ruru'], '일을 마친 보리 · 나비는 자기 자리로, 「나만 믿어」 루루가 따라온다');
    use(a, 13, 13, 'down', 'ladder');
    assert.deepEqual(cell(a), [13, 18], '사다리 아래 계단참');

    // 기억을 다 보기 전에는 바늘이 잠겨 있다
    use(a, 14, 18, 'right', 'l1');
    assert.equal(a.save.chapter, CH1.n);

    // 기억 일곱 개는 모두 걸어서 (오르기 포함) 닿고, 그 자리에서 누를 수 있다
    use(a, 14, 18, 'left', 'ladder');
    assert.deepEqual(cell(a), [13, 13]);
    // 뚜껑문 틈의 깜깜한 기억(m1c)은 나비 불빛이 있어야: 나비를 다시 불러 온다
    assert.ok(!a.things().some((t) => t.id === 'm1c'), '나비 없이는 어둠 속 기억이 안 보인다');
    callPal(a, 'nabi');
    const mems = rooms.attic.things.filter((t): t is MemThing => isMemory(t));
    const ok = walkable(a);
    for (const m of mems) {
      const [x, y] = m.at;
      const sides: [number, number, Dir][] = [[x, y + 1, 'up'], [x, y - 1, 'down'], [x - 1, y, 'right'], [x + 1, y, 'left']];
      const hit = sides.some(([sx, sy, d]) => ok.has(`${sx},${sy}`) && stand(a, sx, sy, d)?.id === m.id);
      assert.ok(hit, `${m.id} (${x},${y}) 에 닿아 누를 수 없다`);
    }
    for (const m of mems) a.flags[`mem_${m.id}`] = true;
    use(a, 13, 13, 'down', 'ladder');
    use(a, 14, 18, 'right', 'l1');
    assert.equal(a.flags.ch1_done, true);
    assert.equal(a.save.chapter, CH1.n + 1, '다음 장으로');
  });

  test('놀이의 결곗값: 깨기 전엔 기억이 숨어 있고, 태엽이 모자라면 뻐꾸기는 울지 않는다', () => {
    const a = start();
    const visible = () => a.things().filter((t) => isMemory(t)).map((t) => t.id);
    assert.deepEqual(visible(), [], '상자 안에서는 기억이 보이지 않는다');
    use(a, 6, 5, 'right', 'box_tape');
    a.step(1 / 60, NO_INPUT);
    finish(a);
    assert.deepEqual(visible(), ['m1a'], '상자를 나오면 테이프 자락 하나');
    a.save.wind = 0.1;
    use(a, 22, 4, 'up', 'cuckoo');
    assert.ok(!a.flags.woke_nabi, '태엽 0.1 < 0.15');
    assert.equal(a.save.wind, 0.1, '모자라면 덜지 않는다');
  });
});

describe('추억 앨범', () => {
  test('이야기의 모든 기억 조각이 장 차례대로 한 번씩, 장마다 한 쪽', () => {
    const want = CHAPTERS.flatMap((c) => ROOMS[c.room]().things.flatMap((t) => (isMemory(t) ? [t.id] : [])));
    assert.deepEqual(ALBUM.flatMap((p) => p.items.map((i) => i.id)), want);
    assert.ok(ALBUM.length >= 20);
    for (const p of ALBUM) assert.ok(p.items.every((i) => i.name && i.line), p.title);
  });

  test('앨범을 열면 가장 최근에 모은 기억이 있는 쪽부터 (아무것도 없으면 첫 쪽)', () => {
    assert.equal(albumStart(ALBUM, []), 0);
    const third = ALBUM[2].items[0].id;
    const first = ALBUM[0].items[1].id;
    assert.equal(albumStart(ALBUM, [first, third]), 2);
    assert.equal(albumStart(ALBUM, [third, first]), 0, '모은 차례의 마지막 기억 기준');
    assert.equal(albumStart(ALBUM, ['없는기억']), 0);
  });
});

describe('이야기 중심', () => {
  test('얼음 땡(발소리 멈추기)은 어느 방에도 없다', () => {
    for (const [id, f] of Object.entries(ROOMS)) assert.equal(f().steps, undefined, id);
  });
  test('어느 대본에도 얼음 땡 설명이 남아 있지 않다', () => {
    const all = [...CHAPTERS.map((c) => c.intro), ...Object.values(ROOMS).flatMap((f) => f().things.flatMap((t) => ('scene' in t && t.scene ? [t.scene] : [])))];
    for (const sc of all) for (const c of flat(sc)) if (c.t === 'say') assert.ok(!/얼음 땡/.test(c.text), c.text);
  });
});

describe('효과음', () => {
  test('대본이 부르는 효과음은 모두 소리 목록에 있다', () => {
    for (const sc of allScripts) for (const c of flat(sc)) if (c.t === 'sfx') assert.ok(STORY_SFX[c.name], `없는 효과음 ${c.name}`);
  });
  test('물건을 들고 내려놓는 소리(lift · put)가 있다', () => {
    assert.ok(STORY_SFX.lift && STORY_SFX.put);
  });
});

describe('음악', () => {
  test('대본 · 방이 부르는 곡은 모두 악보에 있다 (none 은 고요)', () => {
    const all = [...CHAPTERS.map((c) => c.intro), ...Object.values(ROOMS).flatMap((f) => f().things.flatMap((t) => ('scene' in t && t.scene ? [t.scene] : []).concat(isMemory(t) && t.after ? [t.after] : [])))];
    const used = new Set<string>();
    for (const sc of all) for (const c of flat(sc)) if (c.t === 'music' && c.track) used.add(c.track);
    for (const f of Object.values(ROOMS)) if (f().music) used.add(f().music!);
    for (const id of used) assert.ok(id in SONGS, `없는 곡 ${id}`);
    for (const id of ['main', 'grandma', 'sorrow', 'memory', 'hope']) assert.ok(used.has(id) || id === 'main', `${id} 를 쓰는 장면이 있다`);
  });
});

describe('옛 장 지도: 기억은 그 방의 물건으로, 바닥에는 잔 소품', () => {
  /** 사람 크기 집 지도(장난감이 걷는 방 · toys) · 책상(근접 견본)으로 이미 바뀐 장을 뺀 옛 장 방 */
  const OLD = EXPLORE.filter((c) => !rooms[c.room].toys && c.room !== 'desk');
  /** 기억 물건 시험은 새 지도 장도 함께 (책상은 같은 종이별 둘이라 따로 시험) */
  const KEEP = EXPLORE.filter((c) => c.room !== 'desk');
  const parcel = itemSprite('parcel');
  const same = (p: { w: number; h: number; px: Int32Array }, q: { w: number; h: number; px: Int32Array }) => p.w === q.w && p.h === q.h && p.px.every((v, i) => v === q.px[i]);

  test('옛 장 방에는 공중에 뜬 기억 구슬(memory)이 하나도 없고, 모든 기억은 그림이 있는 물건(keepsake)이다', () => {
    assert.ok(KEEP.length >= 18, `장 ${KEEP.length}개`);
    for (const c of KEEP) {
      const r = rooms[c.room];
      assert.deepEqual(r.things.filter((t) => t.kind === 'memory').map((t) => t.id), [], `${c.title}: 구슬로 남은 기억`);
      const ks = r.things.filter((t) => t.kind === 'keepsake');
      assert.ok(ks.length >= 5, `${c.title}: 물건 기억 ${ks.length}개`);
      for (const k of ks) {
        if (k.kind !== 'keepsake') continue;
        const p = lookPix(k.look, r.look);
        assert.ok(p, `${c.title} ${k.id}: 「${k.look}」 그림이 없다`);
        assert.ok(p.count() >= 20, `${c.title} ${k.id}: 「${k.look}」 ${p.count()}칸`);
        assert.ok(!same(p, parcel), `${c.title} ${k.id}: 「${k.look}」 가 꾸러미 대체 그림`);
      }
    }
  });

  test('한 방 안의 기억 물건은 서로 다른 물건이다 (같은 그림 둘이 놓이지 않게)', () => {
    for (const c of KEEP) {
      const looks = rooms[c.room].things.flatMap((t) => (t.kind === 'keepsake' ? [t.look] : []));
      assert.deepEqual(looks.filter((l, i) => looks.indexOf(l) !== i), [], `${c.title}: 겹친 물건`);
    }
  });

  /** 가구로 지은 새 지도 (사람 크기 집 지도 · 근접 지도) 는 잔 소품을 흩뿌리지 않고 가구 목록에 직접 놓는다 */
  const scattered = (r: RoomDef) => !r.toys && !r.abyss && (r.furniture ?? []).every((f) => (DECAL_KINDS as readonly string[]).includes(f.kind.split(':')[0]));
  test('옛 장 방 바닥에 잔 소품이 넷 이상: 걸을 수 있는 칸 위에만, 놓인 것 · 시작 자리와 그 옆 칸은 비운다', () => {
    for (const c of OLD.filter((c) => scattered(rooms[c.room]))) {
      const r = rooms[c.room];
      // 사람 크기 집 지도로 옮긴 장은 이삿짐 · 바닥 데칼을 직접 놓는다 (갈래마다 rooms_*.test.ts 가 본다)
      if (r.toys) continue;
      const decals = (r.furniture ?? []).filter((f) => (DECAL_KINDS as readonly string[]).includes(f.kind.split(':')[0]));
      assert.ok(decals.length >= 4, `${c.title}: 잔 소품 ${decals.length}개`);
      const keep: (readonly [number, number])[] = [[r.start.x, r.start.y], ...r.things.flatMap((t) => ('at' in t ? [t.at] : [])), ...r.things.flatMap((t) => (t.kind === 'gap' ? t.tiles : []))];
      for (const f of decals)
        for (let y = f.y; y < f.y + f.h; y++)
          for (let x = f.x; x < f.x + f.w; x++) {
            const ch = r.tiles[y]?.[x];
            assert.ok(ch !== undefined && !isSolidChar(ch) && ch !== 'U', `${c.title} ${f.kind} (${x},${y}) 막힌 칸 「${ch}」`);
            const hit = keep.find((k) => Math.abs(k[0] - x) <= 1 && Math.abs(k[1] - y) <= 1);
            assert.ok(!hit, `${c.title} ${f.kind} (${x},${y}) 가 (${hit}) 에 붙어 있다`);
          }
    }
  });

  test('잔 소품은 같은 방이면 늘 같은 자리, 방마다 자리는 다르다 (흩뿌림이 방 이름으로 정해진다)', () => {
    const at = (id: string) => (ROOMS[id]().furniture ?? []).map((f) => `${f.kind}@${f.x},${f.y}`);
    for (const c of OLD) assert.deepEqual(at(c.room), at(c.room), c.title);
    const sets = OLD.map((c) => at(c.room).join('|'));
    assert.equal(new Set(sets).size, sets.length, '두 방이 똑같이 흩뿌려졌다');
  });
});

describe('기억 뒤 감상: 저절로는 두 줄까지, 나머지는 동료에게 말을 걸면', () => {
  const VOICE = new Set(['toby', 'bori', 'ruru', 'nabi', 'doll']);
  const lines = (cmds: readonly Cmd[] | undefined) => (cmds ?? []).flatMap((c) => (c.t === 'say' && VOICE.has(c.who) ? [`${c.who}: ${c.text}`] : []));
  const RAW: Record<string, () => RoomDef> = {
    attic: atticRoom, grandroom: grandRoom, underbed: underbedRoom, window: windowRoom, desk: deskRoom, shelf: shelfRoom, drawer: drawerRoom, yard: yardRoom,
    toybox: toyboxRoom, balcony: balconyRoom, bath: bathRoom, closet: closetRoom, cupboard: cupboardRoom, dresser: dresserRoom, entrance: entranceRoom,
    newroom_toy: newroomToyRoom, sewbox: sewboxRoom, outside: outsideRoom, schoolbag: schoolbagRoom, sofa: sofaRoom, tobykey: tobykeyRoom,
  };
  const rawMems = (id: string): MemThing[] => [...RAW[id]().things, ...(MORE[id] ?? []), ...(MORE2[id] ?? []), ...(MORE3A[id] ?? []), ...(MORE3B[id] ?? [])].filter((t): t is MemThing => isMemory(t));
  const mems = EXPLORE.flatMap((c) => rooms[c.room].things.filter((t): t is MemThing => isMemory(t)).map((m) => ({ c, m })));

  test('모든 탐험 장의 원래 대본을 시험이 안다 (빠진 방이 없다)', () => {
    for (const c of EXPLORE) assert.ok(RAW[c.room], `${c.title} 의 원래 방`);
  });

  test('기억이 끝나고 저절로 나오는 감상은 말 두 줄 이하, 다섯에 하나 이상은 말 없이 몸짓으로 끝난다 (깨우기 전후로 갈리는 @if 감상은 빼고)', () => {
    let silent = 0;
    let n = 0;
    for (const { c, m } of mems) {
      if ((m.after ?? []).some((x) => x.t === 'if')) continue;
      const k = lines(m.after).length;
      assert.ok(k <= 2, `${c.title} ${m.id}: 감상 ${k}줄`);
      n++;
      if (k === 0) silent++;
    }
    assert.ok(n >= 120, `감상 ${n}개`);
    assert.ok(silent >= n / 5, `말 없이 끝나는 감상 ${silent}/${n}`);
  });

  /** xs 가 all 의 차례를 지킨 부분인가 */
  const inOrder = (xs: string[], all: string[]) => {
    let j = 0;
    for (const x of xs) {
      while (j < all.length && all[j] !== x) j++;
      if (j++ >= all.length) return false;
    }
    return true;
  };

  test('줄인 감상은 버려지지 않는다: 원래 after 의 말이 남은 after 와 동료에게 옮긴 말에 한 번씩, 저마다 원래 차례대로', () => {
    let moved = 0;
    for (const c of EXPLORE)
      for (const raw of rawMems(c.room)) {
        const m = rooms[c.room].things.find((t): t is MemThing => isMemory(t) && t.id === raw.id);
        assert.ok(m, `${c.title} ${raw.id}`);
        const was = lines(raw.after);
        assert.deepEqual([...lines(m.after), ...lines(m.aside?.text)].sort(), [...was].sort(), `${c.title} ${raw.id}`);
        assert.ok(inOrder(lines(m.after), was) && inOrder(lines(m.aside?.text), was), `${c.title} ${raw.id}: 차례가 바뀌었다`);
        if (m.aside) {
          assert.ok(isPal(m.aside.who), `${m.id}: 옮겨 받은 이 ${m.aside.who}`);
          assert.ok(lines(m.aside.text).length >= 1);
          moved++;
        }
      }
    assert.ok(moved >= 100, `옮긴 감상 ${moved}개`);
  });

  test('감상을 옮겨 받은 동료는 그 장에 함께 있는 동료다 (들을 수 없는 감상이 되지 않게)', () => {
    for (const c of EXPLORE) {
      const can = new Set<string>(c.party);
      const walk = (cmds: readonly Cmd[]): void => {
        for (const x of flat(cmds)) if (x.t === 'join') can.add(x.who);
      };
      walk(c.intro);
      for (const sc of scenesOf(rooms[c.room])) walk(sc);
      for (const t of rooms[c.room].things) if (isMemory(t) && t.aside) assert.ok(can.has(t.aside.who), `${c.title} ${t.id}: ${t.aside.who} 는 이 장에 없다`);
    }
  });

  test('감상을 옮긴 기억은 그 동료의 「…」 로 끝난다 (말을 걸어 볼 실마리)', () => {
    for (const { c, m } of mems) {
      if (!m.aside) continue;
      const last = m.after!.at(-1);
      assert.deepEqual(last && last.t === 'emote' ? [last.who, last.e] : null, [m.aside.who, '…'], `${c.title} ${m.id}`);
    }
  });

  test('기억을 본 뒤 그 동료에게 말을 걸면 옮겨 둔 감상을 모두 듣고, 두 번째 말을 걸 때는 다시 나오지 않는다', () => {
    for (const c of EXPLORE) {
      const a = new Adv(STORY);
      a.runner = null;
      (a as unknown as { queue: unknown[] }).queue = [];
      const h = a as unknown as { applyChapter(n: number): void; talkPal(p: string): void };
      h.applyChapter(c.n);
      const heard: string[] = [];
      const run = () => {
        for (let i = 0; i < 60 * 600 && (a.runner || a.mini); i++) {
          if (a.mini) a.mini.done = true;
          const d = a.stage.dialog;
          if (d && heard.at(-1) !== `${d.who}: ${d.text}`) heard.push(`${d.who}: ${d.text}`);
          a.step(1 / 30, { ...NO_INPUT, act: i % 2 === 0, hold: true });
        }
      };
      run();
      for (const m of rooms[c.room].things.filter((t): t is MemThing => isMemory(t) && !!t.aside)) {
        a.flags[`mem_${m.id}`] = true;
        a.save.album.push(m.id);
        heard.length = 0;
        h.talkPal(m.aside!.who);
        run();
        for (const l of lines(m.aside!.text)) assert.ok(heard.includes(l), `${c.title} ${m.id}: 「${l}」 를 듣지 못했다 (${heard.join(' / ')})`);
        heard.length = 0;
        h.talkPal(m.aside!.who);
        run();
        assert.ok(!lines(m.aside!.text).some((l) => heard.includes(l)), `${c.title} ${m.id}: 같은 감상을 또 한다`);
      }
    }
  });
});
