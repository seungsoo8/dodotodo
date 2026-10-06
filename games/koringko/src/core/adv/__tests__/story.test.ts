import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Adv, isMemory, NO_INPUT, type MemThing } from '../adv.ts';
import { MINI_IDS, parsePuzzleId, PUZZLE_KINDS } from '../mini.ts';
import { CHAPTERS, ROOMS, STORY } from '../story/index.ts';
import { OLD_ORDER } from '../story/acts.ts';
import { ROAD } from '../story/talks.ts';
import { SONGS } from '../../../ui/audio/score.ts';
import { STORY_SFX } from '../../../ui/audio/storysfx.ts';
import { ALBUM, albumStart } from '../story/album.ts';
import { isSolidChar } from '../../maps.ts';
import { LOOKS } from '../../../ui/art/house.ts';
import type { Chapter, Cmd, RoomDef, Thing } from '../types.ts';
import { isPal } from '../pals.ts';
import { DECAL_KINDS, grid, scatterDecals, toyRoom } from '../story/kit.ts';
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
    if (t.kind === 'door') out.push(t.first ?? [], t.locked ?? []);
    if (t.kind === 'seq' && t.wrong) out.push(t.wrong);
    if (t.kind === 'watcher') out.push(t.caught, t.hint ?? []);
    if (isMemory(t) && t.explore) out.push(t.explore.intro ?? [], ...t.explore.threads.map((x) => x.text), ...(t.explore.looks ?? []).map((x) => x.text));
    return out;
  });
}

const rooms = Object.fromEntries(Object.entries(ROOMS).map(([k, f]) => [k, f()]));
/** 막 도입 · 막의 둘째 · 셋째 방에 들어선 장면 */
const allIntros: Cmd[][] = CHAPTERS.flatMap((c) => [c.intro, ...(c.rooms ?? []).flatMap((r) => (r.enter ? [r.enter] : []))]);
const allScripts: Cmd[][] = [...allIntros, ...Object.values(rooms).flatMap(scenesOf), ...Object.values(rooms).flatMap((r) => r.steps?.caught ?? [])];

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
/** 기억 조각을 모으며 탐험하는 막 (새벽 장 · 프롤로그 빼고, 에필로그 포함) */
const EXPLORE = CHAPTERS.filter((c) => c !== DAWN && c !== PRO);

/** 막의 방 하나하나 (막이 아닌 장은 그 장의 방): 그 방에 들어설 때의 장면(막 첫 방은 막 도입, 나머지는 enter) */
interface Place {
  c: Chapter;
  room: string;
  title: string;
  intro: Cmd[];
}
const placesOf = (c: Chapter): Place[] => (c.rooms ?? [{ id: c.room, name: c.sub }]).map((r, i) => ({ c, room: r.id, title: `${c.title} — ${r.name}`, intro: i === 0 ? c.intro : ('enter' in r ? (r.enter ?? []) : []) }));
const PLACES: Place[] = CHAPTERS.flatMap(placesOf);
/** 탐험하는 막의 방 (옛 장 방 스무 개 + 새 방) */
const EXPLORE_PLACES: Place[] = EXPLORE.flatMap(placesOf);
/** 막의 마지막 방 (기억의 문이 다음 막으로 여는 곳) */
const lastRoom = (c: Chapter): string => c.rooms?.at(-1)?.id ?? c.room;

describe('이야기 자료', () => {
  test('묶음은 프롤로그 · 1~10막 · 마지막 장 · 에필로그 차례로 n=1.., 막은 방(rooms)을 갖고 첫 방은 그 막의 방, 모든 방이 있다', () => {
    assert.equal(CHAPTERS.length, 13);
    CHAPTERS.forEach((c, i) => {
      assert.equal(c.n, i + 1);
      assert.ok(rooms[c.room], `${c.title} 방 ${c.room}`);
    });
    const acts = CHAPTERS.filter((c) => /^\d+막 · /.test(c.title));
    assert.deepEqual(acts.map((c) => Number(/^(\d+)막/.exec(c.title)![1])), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert.deepEqual(acts.map((c) => CHAPTERS.indexOf(c)), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], '막은 프롤로그 바로 뒤부터 이어서');
    for (const c of acts) {
      assert.ok(c.rooms && c.rooms.length >= 1 && c.rooms.length <= 3, `${c.title}: 방 ${c.rooms?.length}`);
      assert.equal(c.rooms[0].id, c.room, `${c.title}: 첫 방 = 막의 방`);
      assert.equal(c.follow, true, `${c.title}: 동료가 늘 따라다닌다`);
      for (const r of c.rooms) {
        assert.ok(rooms[r.id], `${c.title}: 없는 방 ${r.id}`);
        assert.ok(r.name.length >= 2, `${c.title} ${r.id}: 방 이름`);
      }
    }
    // 막의 방은 옛 장 방 스무 개를 옛 차례 그대로 한 번씩 (이웃한 장끼리만 묶었다)
    assert.deepEqual(acts.flatMap((c) => c.rooms!.map((r) => r.id)), [...OLD_ORDER]);
  });

  /** 서장(앞마당) · 새벽 다락방은 탐험 없이 이야기만 (기억 조각 · 기억의 문 없음) */

  test('프롤로그는 맨 앞: 하루가 되어 앞마당을 걷고, 기억 조각 없이 1막(다락방)으로 이어진다', () => {
    assert.equal(CHAPTERS.indexOf(PRO), 0);
    const r = rooms[PRO.room];
    assert.equal(r.scale, 'human');
    assert.equal(r.things.filter((t) => isMemory(t)).length, 0);
    assert.ok(flat(PRO.intro).some((c) => c.t === 'control' && c.who === 'haru'), '하루를 조종한다');
    const scripts = r.things.flatMap((t) => ('scene' in t && t.scene ? [flat(t.scene)] : []));
    assert.ok(scripts.some((sc) => sc.some((c) => c.t === 'next')), '다음 장으로');
    assert.equal(CHAPTERS[1].title, '1막 · 두고 가는 짐', '프롤로그 다음이 1막');
  });

  test('장의 목표는 이야기 한 줄: 개수를 세지 않고 「기억 조각」을 말하지 않는다 (숫자는 앨범에만)', () => {
    const COUNT = /\d|(한|두|세|네|다섯|여섯|일곱|여덟|아홉|열)\s*개|개를 찾자|기억 조각/;
    let checked = 0;
    for (const c of PLACES) {
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

  test('탐험하는 막의 방 (에필로그 포함)마다 기억 조각 다섯~일곱 개, 기억의 문은 방마다 하나까지이고 막의 마지막 방에는 꼭 하나', () => {
    assert.equal(EXPLORE_PLACES.length, 21);
    for (const p of EXPLORE_PLACES) {
      const r = rooms[p.room];
      const n = r.things.filter((t) => isMemory(t)).length;
      assert.ok(n >= 5 && n <= 7, `${p.title}: 기억 ${n}개`);
      assert.ok(r.things.filter((t) => t.kind === 'link').length <= 1, p.title);
    }
    for (const c of EXPLORE) assert.equal(rooms[lastRoom(c)].things.filter((t) => t.kind === 'link').length, 1, `${c.title}: 마지막 방의 기억의 문`);
  });

  test('기억의 문은 막마다 하나, 막의 마지막 방에만 (앞 방에는 기억의 문이 없고 문으로 잇는다)', () => {
    for (const c of EXPLORE) {
      const ids = (c.rooms ?? [{ id: c.room }]).map((r) => r.id);
      const links = ids.map((id) => rooms[id].things.filter((t) => t.kind === 'link').length);
      assert.deepEqual(links, ids.map((_, i) => (i === ids.length - 1 ? 1 : 0)), `${c.title}: 방마다 기억의 문 ${links.join(' · ')}`);
    }
    // 프롤로그 · 새벽은 기억의 문이 없다
    for (const c of [PRO, DAWN]) assert.equal(rooms[c.room].things.filter((t) => t.kind === 'link').length, 0, c.title);
  });

  test('모든 @goal 은 「?」 로 끝나는 물음이고 개수 · 「기억 조각」 · 「~자」 끝맺음이 없다; 막 도입 · 둘째 · 셋째 방 enter 마다 하나, 물건 대본에는 없다 (기억 속 조종 장면 안만 예외)', () => {
    const COUNT = /\d|(한|두|세|네|다섯|여섯|일곱|여덟|아홉|열)\s*개|기억 조각/;
    const goalsIn = (cmds: readonly Cmd[]): string[] => flat(cmds).flatMap((x) => (x.t === 'goal' && x.text ? [x.text] : []));
    // 1) 이야기 전체 (막 도입 · enter · 모든 방의 물건 대본 · 기억 방의 조종 장면) 의 목표는 물음
    const every = allScripts.flatMap(goalsIn);
    assert.ok(every.length >= 20, `목표 ${every.length}개`);
    for (const g of every) {
      assert.ok(g.trim().endsWith('?'), `「${g}」 가 물음이 아니다`);
      assert.ok(!COUNT.test(g), `「${g}」 가 개수 · 기억 조각을 말한다`);
      assert.ok(!/자\s*[.!?]?\s*$|자\s*[(—·]/.test(g), `「${g}」 가 「~자」 명령이다`);
    }
    // 2) 탐험하는 막 (에필로그 포함) 의 방마다 들어설 때 물음 하나 (막 첫 방은 막 도입, 나머지는 enter)
    for (const p of EXPLORE_PLACES) assert.equal(goalsIn(p.intro).length, 1, `${p.title}: 들어설 때 물음 ${goalsIn(p.intro).length}개`);
    assert.equal(goalsIn(PRO.intro).length, 1, '프롤로그 물음 하나');
    // 3) 막 방의 물건 대본에는 목표가 없다; 기억 장면 안의 목표는 하루를 조종하는 장면(@control 뒤)에서만
    for (const p of PLACES)
      for (const t of rooms[p.room].things) {
        const own = scenesOf({ ...rooms[p.room], things: [t] });
        if (isMemory(t) && t.scene) {
          const sc = flat(t.scene);
          const ctl = sc.findIndex((x) => x.t === 'control');
          sc.forEach((x, i) => {
            if (x.t === 'goal' && x.text) assert.ok(ctl >= 0 && i > ctl, `${p.title} ${t.id}: 조종 장면 밖의 목표 「${x.text}」`);
          });
          own.splice(own.indexOf(t.scene), 1);
        }
        assert.deepEqual(own.flatMap(goalsIn), [], `${p.title} ${t.id}: 물건 대본의 목표`);
      }
  });

  test('가는 길 잡담은 실제 장의 방에 붙고, 장 시작의 띠를 걷기 전에 나온다', () => {
    for (const room of Object.keys(ROAD)) {
      // 막의 첫 방이면 막 도입에, 둘째 · 셋째 방이면 그 방에 들어선 장면(enter)에
      const p = PLACES.find((x) => x.room === room);
      assert.ok(p, `잡담 ${room} 에 맞는 방이 없다`);
      const first = flat(ROAD[room])[0];
      const i = p!.intro.indexOf(first);
      const off = p!.intro.findIndex((x) => x.t === 'bars' && !x.on);
      assert.ok(i >= 0 && i < off, `${p!.title}: 잡담이 띠 걷기 전에 없다`);
      if (p!.room !== p!.c.room) assert.equal(p!.c.intro.indexOf(first), -1, `${p!.title}: 둘째 방 잡담이 막 도입에 섞였다`);
    }
  });

  test('기억의 문 맞추기는 장마다 네 가지 놀이를 돌아가며, 같은 놀이는 장이 갈수록 다음 단계', () => {
    const ids = EXPLORE_PLACES.flatMap((p) => {
      const link = rooms[p.room].things.find((t) => t.kind === 'link');
      return flat(link?.kind === 'link' ? link.scene : []).flatMap((x) => (x.t === 'mini' && parsePuzzleId(x.id) ? [x.id] : []));
    });
    assert.ok(ids.length >= 10);
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

  test('막의 마지막 방의 기억의 문은 다음 막으로, 새벽 장은 에필로그로, 에필로그의 문은 크레디트와 끝 깃발', () => {
    const linkOf = (c: Chapter) => {
      const link = rooms[lastRoom(c)].things.find((t) => t.kind === 'link')!;
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
        // 침대 · 소파에 잠든 사람 (npc · sleep, 지켜보는 이를 바꾼 것) 도 가구 칸에 누워 있어도 된다 (닿기는 아래에서 본다)
        if (t.kind !== 'gap' && !(t.kind === 'npc' && t.pose === 'sleep')) assert.ok(!isSolidChar(r.tiles[y]?.[x]), `${r.id} ${t.id} (${x},${y}) 막힌 칸`);
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
    const mems = PLACES.flatMap((p) => rooms[p.room].things.filter((t): t is MemThing => isMemory(t)));
    // 막으로 묶어도 기억은 하나도 버리지 않는다 (막 다시 짜기 전 142개)
    assert.ok(mems.length >= 142, `기억 ${mems.length}개`);
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
  test('모든 막 · 막의 모든 방의 모든 대본(들어선 장면 · 문 장면 포함)이 오류 없이 끝까지 돈다', () => {
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
      // 막의 방마다: (첫 방이 아니면) 문 없이 들어서서 들어선 장면 → 깨우기 · 퍼즐 순서와 상관없이 모든 대본을 한 번씩
      for (const p of placesOf(c)) {
        if (a.room.id !== p.room) {
          a.enterRoom(p.room);
          run();
        }
        const r = rooms[p.room];
        for (const t of r.things) {
          if (t.kind === 'trigger' || t.kind === 'link' || t.kind === 'block' || t.kind === 'gap' || t.kind === 'dark') continue;
          const scs = t.kind === 'door' ? [t.first ?? [], t.locked ?? []] : ['scene' in t ? (t.scene ?? []) : []];
          for (const sc of scs) {
            a.run(sc);
            run();
            if (a.room.id !== p.room) a.goRoom(p.room);
          }
        }
      }
    }
  });
});

describe('기억 속을 걷기', () => {
  type Mem = MemThing;
  const walks = (p: Place): Mem[] => rooms[p.room].things.filter((t): t is Mem => isMemory(t) && !!t.explore);
  const memRoom = (m: Mem) => {
    const r = m.scene.find((c) => c.t === 'room');
    return rooms[r && r.t === 'room' ? r.id : ''];
  };

  test('탐험하는 막의 방마다 걷는 기억이 둘 이상 (기억 조각만 줍는 방이 없게)', () => {
    for (const p of EXPLORE_PLACES) assert.ok(walks(p).length >= 2, `${p.title}: 걷는 기억 ${walks(p).length}개`);
  });

  test('걷는 기억: 실은 둘 이상, 들어선 자리에서 걸어서 닿고, 실 · 살펴볼 것이 한 칸에 겹치지 않는다', () => {
    for (const p of EXPLORE_PLACES)
      for (const m of walks(p)) {
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

  test('걷는 기억은 실을 다 모으면 장면이 흐르고 원래 막의 방으로 돌아온다 (조각 깃발 · 앨범)', () => {
    for (const p of EXPLORE_PLACES)
      for (const m of walks(p)) {
        const c = p.c;
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
        if (a.room.id !== p.room) {
          a.enterRoom(p.room);
          run();
        }
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
        assert.equal(a.room.id, p.room, `${m.id}: 돌아오지 못했다`);
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
  const allMems = PLACES.flatMap((p) => rooms[p.room].things.filter((t): t is Mem => isMemory(t)));
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

  test('장난감들의 바깥 모험: 「outside」 방은 장난감이 걷는 방이고, 그 방 기억 중 셋 이상이 바깥 기억 방에서', () => {
    const c = PLACES.find((x) => x.room === 'outside');
    assert.ok(c, 'outside 방이 없다');
    const r = rooms[c.room];
    assert.ok(toyWalks(r), '장난감이 걷는 방 (장난감 크기 · 장난감이 걷는 사람 크기 지도)');
    const OUT = new Set(['asphalt', 'paving', 'sand', 'dirt', 'grass']);
    const mems = r.things.filter((t): t is Mem => isMemory(t));
    const outside = mems.filter((m) => OUT.has(LOOKS[rooms[memRoomId(m)]?.look ?? '']?.floorKind ?? ''));
    assert.ok(outside.length >= 3, `바깥 기억 ${outside.length}개`);
  });
});

describe('1장 다락방을 처음부터 끝까지 실제로 풀어 본다 (사람 크기 다락 · 장난감이 걷는다)', () => {
  const CH1 = CHAPTERS.find((c) => c.room === 'attic')!;
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

  test('기억 일곱 개는 모두 다락의 물건(keepsake)이고, 정해진 물건 그림으로 놓인다', () => {
    const mems = rooms.attic.things.filter((t): t is MemThing => isMemory(t));
    assert.deepEqual(mems.map((m) => m.id).sort(), ['m1a', 'm1b', 'm1c', 'm1d', 'm1e', 'm1f', 'm1g']);
    const look = Object.fromEntries(mems.map((m) => [m.id, m.kind === 'keepsake' ? m.look : '구슬']));
    assert.deepEqual(look, { m1a: 'tape', m1b: 'photo:down', m1c: 'crack', m1d: 'chairOld', m1e: 'yarn', m1f: 'letter', m1g: 'paintcan' });
    const link = rooms.attic.things.find((t) => t.kind === 'link');
    assert.equal(link?.kind === 'link' && link.name, '재봉 상자 틈의 바늘');
  });

});

describe('추억 앨범', () => {
  test('이야기의 모든 기억 조각이 막 차례대로 한 번씩, 막의 방마다 한 쪽 (쪽 제목 「막 제목 — 방 이름」)', () => {
    const want = PLACES.flatMap((p) => ROOMS[p.room]().things.flatMap((t) => (isMemory(t) ? [t.id] : [])));
    assert.deepEqual(ALBUM.flatMap((p) => p.items.map((i) => i.id)), want);
    assert.equal(ALBUM.length, 21);
    assert.deepEqual(ALBUM.map((p) => p.title), EXPLORE_PLACES.map((p) => p.title));
    for (const p of ALBUM) assert.ok(p.items.length <= 7, `${p.title}: 한 쪽에 ${p.items.length}개`);
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
    const all = [...allIntros, ...Object.values(ROOMS).flatMap((f) => f().things.flatMap((t) => ('scene' in t && t.scene ? [t.scene] : [])))];
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
    const all = [...allIntros, ...Object.values(ROOMS).flatMap((f) => f().things.flatMap((t) => ('scene' in t && t.scene ? [t.scene] : []).concat(isMemory(t) && t.after ? [t.after] : [])))];
    const used = new Set<string>();
    for (const sc of all) for (const c of flat(sc)) if (c.t === 'music' && c.track) used.add(c.track);
    for (const f of Object.values(ROOMS)) if (f().music) used.add(f().music!);
    for (const id of used) assert.ok(id in SONGS, `없는 곡 ${id}`);
    for (const id of ['main', 'grandma', 'sorrow', 'memory', 'hope']) assert.ok(used.has(id) || id === 'main', `${id} 를 쓰는 장면이 있다`);
  });
});

describe('옛 장 지도: 기억은 그 방의 물건으로, 바닥에는 잔 소품', () => {
  /** 사람 크기 집 지도(장난감이 걷는 방 · toys) · 책상(근접 견본)으로 이미 바뀐 장을 뺀 옛 장 방 */
  /** 기억 물건 시험은 새 지도 방도 함께 (책상은 같은 종이별 둘이라 따로 시험) */
  const KEEP = EXPLORE_PLACES.filter((c) => c.room !== 'desk');
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

  /** 가구 목록이 없는 장난감 크기 방(지금은 모든 장이 가구로 지어졌다)에는 잔 소품을 흩뿌린다: 직접 시험 방으로 확인 */
  const scatterRoom = (id: string): RoomDef =>
    toyRoom(id, grid(24, 14, 'w', 'Q', [['Q', 8, 4, 3, 3], ['v', 16, 1, 1, 12]]), { name: id, theme: 'toybox', start: [3, 10], things: [{ kind: 'spot', id: 's', at: [12, 9], scene: [] }] });
  test('잔 소품 흩뿌리기: 넷 이상 · 걸을 수 있는 칸 위에만 · 놓인 것과 시작 자리 옆은 비운다', () => {
    const r = scatterRoom('scatter_a');
    const decals = scatterDecals(r);
    assert.ok(decals.length >= 4, `잔 소품 ${decals.length}개`);
    for (const f of decals) {
      assert.ok((DECAL_KINDS as readonly string[]).includes(f.kind.split(':')[0]), f.kind);
      const ch = r.tiles[f.y]?.[f.x];
      assert.ok(ch !== undefined && !isSolidChar(ch), `${f.kind} (${f.x},${f.y}) 막힌 칸 「${ch}」`);
      for (const k of [[3, 10], [12, 9]]) assert.ok(Math.abs(k[0] - f.x) > 1 || Math.abs(k[1] - f.y) > 1, `${f.kind} (${f.x},${f.y}) 가 ${k} 에 붙어 있다`);
    }
  });

  test('잔 소품은 같은 방이면 늘 같은 자리, 방마다 자리는 다르다 (흩뿌림이 방 이름으로 정해진다)', () => {
    const at = (id: string) => scatterDecals(scatterRoom(id)).map((f) => `${f.kind}@${f.x},${f.y}`).join('|');
    assert.equal(at('scatter_a'), at('scatter_a'));
    assert.notEqual(at('scatter_a'), at('scatter_b'));
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
  const mems = EXPLORE_PLACES.flatMap((c) => rooms[c.room].things.filter((t): t is MemThing => isMemory(t)).map((m) => ({ c, m })));

  test('모든 탐험 막의 방의 원래 대본을 시험이 안다 (빠진 방이 없다)', () => {
    for (const c of EXPLORE_PLACES) assert.ok(RAW[c.room], `${c.title} 의 원래 방`);
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
    for (const c of EXPLORE_PLACES)
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

  test('감상을 옮겨 받은 동료는 그 막에 함께 있는 동료다 (들을 수 없는 감상이 되지 않게)', () => {
    for (const c of EXPLORE) {
      const can = new Set<string>(c.party);
      const walk = (cmds: readonly Cmd[]): void => {
        for (const x of flat(cmds)) if (x.t === 'join') can.add(x.who);
      };
      for (const p of placesOf(c)) {
        walk(p.intro);
        for (const sc of scenesOf(rooms[p.room])) walk(sc);
      }
      for (const p of placesOf(c)) for (const t of rooms[p.room].things) if (isMemory(t) && t.aside) assert.ok(can.has(t.aside.who), `${p.title} ${t.id}: ${t.aside.who} 는 이 막에 없다`);
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
    for (const p of EXPLORE_PLACES) {
      const c = p.c;
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
      if (a.room.id !== p.room) {
        a.enterRoom(p.room);
        run();
      }
      for (const m of rooms[p.room].things.filter((t): t is MemThing => isMemory(t) && !!t.aside)) {
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
