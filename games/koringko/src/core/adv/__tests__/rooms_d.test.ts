/**
 * 갈래 D 장 방: 13장 베란다 · 14장 소파 밑 · 15장 비 오는 마당 · 16장 골목 끝 놀이터.
 * 장을 시작해 놀이(바람 · 물뿌리개 배달 · 루루 안내 · TV 빛 · 동전 탑 · 물길 · 개굴 형 · 얼룩이 · 등불 · 그네)를
 * 실제로 걷고 · 밀고 · 줍고 · 당겨 풀면 깃발이 서고, 모든 기억 물건에 닿고, 기억의 문으로 다음 장에 간다.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Adv, isMemory, NO_INPUT, type AdvInput } from '../adv.ts';
import { actOfRoom, CHAPTERS, ROOMS, STORY } from '../story/index.ts';
import { startIn } from './acthelp.ts';
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

const chapterOf = (room: string) => actOfRoom(room)!;

/** 그 장을 바로 시작하고 들어오는 대본을 끝까지 */
function start(room: string): Adv {
  return startIn(room, (a) => finish(a));
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

/** 장 방의 공통 모양: 기억은 모두 그림이 있는 물건 (목표 줄은 story.test 의 막 규칙이 본다) */
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
    assert.equal(r.winds, undefined, '막 구조: 밀어내는 바람은 없다 (소리 · 빨래 그림만)');
    assert.ok(r.things.some((t) => t.kind === 'npc' && t.actor === 'clothespins'), '빨래집게 자매');
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
    assert.equal(r.low, undefined, '막 구조: 보리를 막는 낮은 천장은 없다');
    assert.ok(r.things.some((t) => t.kind === 'npc' && t.actor === 'coinElder'));
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
