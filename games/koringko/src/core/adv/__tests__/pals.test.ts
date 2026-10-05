import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Adv, NO_INPUT, type AdvData, type AdvInput } from '../adv.ts';
import { findPath, pickHangouts } from '../pals.ts';
import { Builder, TILE } from '../../maps.ts';
import { px } from '../stage.ts';
import type { HeroId } from '../../types.ts';
import type { PalId } from '../pals.ts';
import type { Cmd, RoomDef, Thing } from '../types.ts';

/** 시험용 장난감 방 20×12: 가장자리 벽, 가운데 (9~10, 4~7) 에 가구 발(H) */
function room(id: string, things: Thing[], extra: Partial<RoomDef> = {}): RoomDef {
  const b = new Builder(20, 12, 'w', 1);
  b.rect(0, 0, 20, 1, 'Q');
  b.rect(0, 11, 20, 1, 'Q');
  b.rect(0, 0, 1, 12, 'Q');
  b.rect(19, 0, 1, 12, 'Q');
  b.rect(9, 4, 2, 4, 'H');
  return { id, name: id, theme: 'toybox', w: 20, h: 12, tiles: b.rows(), structures: [], warps: [], npcs: [], spawns: [], start: { x: 2, y: 5 }, safe: true, dark: false, level: '', scale: 'toy', things, ...extra };
}

function data(things: Thing[], extra: Partial<RoomDef> = {}, party: HeroId[] = ['toby', 'bori', 'ruru', 'nabi']): AdvData {
  return {
    rooms: {
      r1: () => room('r1', things, extra),
      r2: () => room('r2', []),
      mem: () => ({ ...room('mem', []), scale: 'human' }),
    },
    chapters: [{ n: 1, title: '1장', sub: '', room: 'r1', start: [2, 5], party, wind: 1, intro: [{ t: 'say', who: 'toby', text: '가자' }] }],
  };
}

const idle = (a: Adv, secs: number, inp: AdvInput = NO_INPUT) => {
  for (let t = 0; t < secs; t += 1 / 60) a.step(1 / 60, inp);
};
const press = (a: Adv) => a.step(1 / 60, { ...NO_INPUT, act: true });
/** 대본이 끝날 때까지 대사를 넘긴다 (고르기가 나오면 pick 번째를 고른다) */
function finish(a: Adv, pick = 0): void {
  for (let i = 0; i < 3600 && (a.runner || a.mini); i++) {
    const ch = a.stage.choice;
    if (ch && ch.sel < pick) a.step(1 / 60, { ...NO_INPUT, dir: 'down' });
    else a.step(1 / 60, { ...NO_INPUT, act: i % 2 === 0 });
  }
}
const walk = (x: number, y: number): AdvInput => ({ ...NO_INPUT, move: { x, y } });
const tileOf = (a: Adv, who: string): [number, number] => [Math.floor(a.stage.actors[who].x / TILE), Math.floor(a.stage.actors[who].y / TILE)];
const dist = (a: Adv, p: string, q: string) => Math.hypot(a.stage.actors[p].x - a.stage.actors[q].x, a.stage.actors[p].y - a.stage.actors[q].y);

/** 토비를 동료 옆에 세우고 그쪽을 보게 해서 말을 건다 */
function talkTo(a: Adv, who: PalId, pick: number): void {
  const q = a.stage.actors[who];
  const [tx, ty] = [Math.floor(q.x / TILE), Math.floor(q.y / TILE)];
  const side = [[-1, 0, 'right'], [1, 0, 'left'], [0, 1, 'up'], [0, -1, 'down']] as const;
  const s = side.find(([dx, dy]) => !a.solid(tx + dx, ty + dy))!;
  a.place(px(tx + s[0]), px(ty + s[1]));
  a.face(s[2]);
  a.step(1 / 60, NO_INPUT);
  assert.equal(a.prompt?.id, `pal_${who}`, `${who} 에게 말 걸기가 떠야 한다 (지금 ${a.prompt?.id})`);
  press(a);
  finish(a, pick);
}

describe('동료: 길 찾기 · 자리 고르기 (순수 함수)', () => {
  const open = (x: number, y: number) => x >= 0 && y >= 0 && x < 7 && y < 5 && !(x === 3 && y < 4);

  test('막힌 벽을 돌아서 가는 칸 길을 준다 (시작 칸은 빼고 도착 칸은 넣는다)', () => {
    const p = findPath([1, 1], [5, 1], open, 7, 5)!;
    assert.ok(p, '길이 있어야 한다');
    assert.deepEqual(p[p.length - 1], [5, 1]);
    assert.ok(p.some(([x, y]) => x === 3 && y === 4), '벽 아래 트인 칸 (3,4) 로 돈다');
    for (let i = 1; i < p.length; i++) assert.equal(Math.abs(p[i][0] - p[i - 1][0]) + Math.abs(p[i][1] - p[i - 1][1]), 1, '한 칸씩');
  });

  test('닿을 수 없으면 null, 같은 칸이면 빈 길', () => {
    assert.equal(findPath([1, 1], [3, 1], open, 7, 5), null);
    assert.deepEqual(findPath([2, 2], [2, 2], open, 7, 5), []);
  });

  test('자리는 걸을 수 있는 칸, 들어온 칸과 서로에게서 떨어져 있고, 피할 칸(살펴볼 것) 옆은 고르지 않는다', () => {
    const big = (x: number, y: number) => x > 0 && y > 0 && x < 19 && y < 11;
    const avoid: [number, number][] = [[8, 5], [12, 5]];
    const h = pickHangouts(['bori', 'ruru', 'nabi'], [2, 5], big, 20, 12, avoid);
    const spots = Object.values(h);
    assert.equal(spots.length, 3);
    for (const s of spots) {
      assert.ok(big(s[0], s[1]), `${s} 는 걸을 수 있는 칸`);
      assert.ok(Math.hypot(s[0] - 2, s[1] - 5) >= 3, `${s} 는 들어온 칸에서 떨어져 있다`);
      for (const v of avoid) assert.ok(Math.max(Math.abs(s[0] - v[0]), Math.abs(s[1] - v[1])) >= 2, `${s} 는 ${v} 옆이 아니다`);
    }
    for (let i = 0; i < spots.length; i++)
      for (let j = i + 1; j < spots.length; j++) assert.ok(Math.hypot(spots[i][0] - spots[j][0], spots[i][1] - spots[j][1]) >= 3, `${spots[i]} ${spots[j]}`);
  });

  test('좁은 방에서도 겹치지 않게 (간격을 줄여서라도) 모두에게 자리를 준다', () => {
    const tiny = (x: number, y: number) => x >= 0 && y >= 0 && x < 4 && y < 2;
    const h = pickHangouts(['bori', 'ruru', 'nabi'], [0, 0], tiny, 4, 2, []);
    const keys = Object.values(h).map((p) => `${p}`);
    assert.equal(keys.length, 3);
    assert.equal(new Set(keys).size, 3);
  });
});

describe('동료: 각자 자기 자리에서 지낸다', () => {
  test('방에 들어와 대사가 끝나면 동료들은 서로 다른 자기 자리로 걸어가 머문다', () => {
    const a = new Adv(data([]));
    assert.ok(a.stage.actors.bori && a.stage.actors.ruru && a.stage.actors.nabi, '처음엔 토비 뒤에 함께 선다');
    finish(a);
    idle(a, 8);
    const homes = (['bori', 'ruru', 'nabi'] as PalId[]).map((h) => a.palHome(h)!);
    for (const [i, h] of (['bori', 'ruru', 'nabi'] as PalId[]).entries()) {
      assert.deepEqual(tileOf(a, h), [homes[i][0], homes[i][1]], `${h} 가 자기 자리에 도착`);
      assert.equal(a.stage.actors[h].moving, false);
      assert.ok(!a.solid(homes[i][0], homes[i][1]), `${h} 자리는 걸을 수 있는 칸`);
    }
    assert.equal(new Set(homes.map((p) => `${p}`)).size, 3, '자리가 겹치지 않는다');
  });

  test('부르지 않은 동료는 토비가 걸어가도 따라오지 않는다', () => {
    const a = new Adv(data([]));
    finish(a);
    idle(a, 8);
    const before = tileOf(a, 'bori');
    idle(a, 1.5, walk(0, 1));
    assert.deepEqual(tileOf(a, 'bori'), before);
    assert.deepEqual(a.withMe(), []);
  });

  test('방에 자리표(hangouts)가 있으면 그 칸 · 그 자세로 지낸다', () => {
    const a = new Adv(data([], { hangouts: { bori: { at: [15, 3], pose: 'chinRest', dir: 'left' } } }));
    finish(a);
    idle(a, 10);
    assert.deepEqual(tileOf(a, 'bori'), [15, 3]);
    assert.equal(a.stage.actors.bori.dir, 'left');
    assert.ok(['chinRest'].includes(a.stage.actors.bori.pose) || a.stage.actors.bori.act?.back === 'chinRest', a.stage.actors.bori.pose);
  });

  test('자기 자리에 있으면 가끔 몸짓을 한다 (가만히 굳어 있지 않다)', () => {
    const a = new Adv(data([]));
    finish(a);
    idle(a, 8);
    let acted = false;
    for (let t = 0; t < 20 && !acted; t += 1 / 60) {
      a.step(1 / 60, NO_INPUT);
      if (a.stage.actors.ruru.act) acted = true;
    }
    assert.ok(acted, '20초 안에 한 번은 몸짓');
  });

  test('토비가 처음 다가가면 그쪽을 돌아보며 반긴다', () => {
    const a = new Adv(data([], { hangouts: { bori: { at: [15, 3], pose: 'chinRest', dir: 'up' } } }));
    finish(a);
    idle(a, 10);
    a.place(px(15), px(5));
    a.step(1 / 60, NO_INPUT);
    assert.equal(a.stage.actors.bori.dir, 'down');
    assert.ok(a.stage.actors.bori.emote, '말풍선 감정');
  });

  test('대본(장면)이 도는 동안에는 동료가 제멋대로 걸어가지 않는다', () => {
    const a = new Adv(data([]));
    const at = tileOf(a, 'bori');
    idle(a, 3);
    assert.ok(a.runner, '아직 대사 중');
    assert.deepEqual(tileOf(a, 'bori'), at);
  });
});

describe('동료: 말을 걸어 부르고, 쉬게 한다', () => {
  test('말을 걸면 대사와 고르기가 나오고, 「같이 가자」를 고르면 따라온다', () => {
    const a = new Adv(data([]));
    finish(a);
    idle(a, 8);
    talkTo(a, 'bori', 0);
    assert.deepEqual(a.withMe(), ['bori']);
    idle(a, 1.2, walk(0, 1));
    idle(a, 0.5);
    assert.ok(dist(a, 'toby', 'bori') < 48, `토비 뒤를 따라온다 (${dist(a, 'toby', 'bori')})`);
  });

  test('「여기 있어」를 고르면 그대로 자기 자리에 남는다', () => {
    const a = new Adv(data([]));
    finish(a);
    idle(a, 8);
    const home = a.palHome('nabi')!;
    talkTo(a, 'nabi', 1);
    assert.deepEqual(a.withMe(), []);
    idle(a, 1.5, walk(0, 1));
    assert.deepEqual(tileOf(a, 'nabi'), [home[0], home[1]]);
  });

  test('함께 다니는 동료에게 「여기서 쉬어」를 고르면 자기 자리로 돌아간다', () => {
    const a = new Adv(data([]));
    finish(a);
    idle(a, 8);
    const home = a.palHome('ruru')!;
    a.call('ruru', true);
    a.place(px(3), px(9));
    idle(a, 1.5, walk(1, 0));
    idle(a, 0.5);
    // 뒤따라오던 루루를 돌아본다
    a.face('left');
    a.step(1 / 60, NO_INPUT);
    assert.equal(a.prompt?.id, 'pal_ruru');
    press(a);
    finish(a, 1);
    assert.deepEqual(a.withMe(), []);
    idle(a, 10);
    assert.deepEqual(tileOf(a, 'ruru'), [home[0], home[1]]);
  });

  test('필요한 일이 있는 방에서는 말을 걸면 그 일을 귀띔한다 (보리 · 밀 물건)', () => {
    const things: Thing[] = [
      { kind: 'push', id: 'box', at: [5, 2], look: 'boxes' },
      { kind: 'pad', id: 'p', at: [7, 2], accepts: ['box'], flag: 'box_on' },
    ];
    const a = new Adv(data(things));
    finish(a);
    idle(a, 8);
    const said: string[] = [];
    const q = a.stage.actors.bori;
    const [tx, ty] = [Math.floor(q.x / TILE), Math.floor(q.y / TILE)];
    a.place(px(tx - 1), px(ty));
    a.face('right');
    a.step(1 / 60, NO_INPUT);
    press(a);
    for (let i = 0; i < 600 && a.runner; i++) {
      if (a.stage.dialog && !said.includes(a.stage.dialog.text)) said.push(a.stage.dialog.text);
      a.step(1 / 60, { ...NO_INPUT, act: i % 2 === 0 });
    }
    assert.ok(said.some((t) => t.includes('밀')), said.join(' / '));
  });

  test('@call 대본 명령으로 부르고 (all 이면 모두) 돌려보낼 수 있다', () => {
    const go: Cmd[] = [{ t: 'call', who: 'all', on: true }];
    const a = new Adv(data([{ kind: 'spot', id: 'bell', at: [3, 5], scene: go }]));
    finish(a);
    a.place(px(2), px(5));
    a.face('right');
    a.step(1 / 60, NO_INPUT);
    press(a);
    finish(a);
    assert.deepEqual(a.withMe(), ['bori', 'ruru', 'nabi']);
    a.run([{ t: 'call', who: 'ruru', on: false }]);
    finish(a);
    assert.deepEqual(a.withMe(), ['bori', 'nabi']);
  });
});

describe('동료: 놀이에는 불러 온 동료만', () => {
  const things: Thing[] = [
    { kind: 'push', id: 'box', at: [5, 2], look: 'boxes' },
    { kind: 'pad', id: 'p', at: [7, 2], accepts: ['box'], flag: 'box_on' },
    { kind: 'push', id: 'heavy', at: [5, 9], look: 'trapdoor', weight: 2 },
    { kind: 'climb', id: 'up', at: [16, 9], to: [16, 2], who: 'ruru' },
    { kind: 'memory', id: 'md', at: [17, 6], name: '어둠 속', scene: [], dark: true },
  ];

  function shoveFrom(a: Adv, x: number, y: number): void {
    a.place(px(x), px(y));
    a.face('right');
    a.step(1 / 60, NO_INPUT);
    press(a);
    finish(a);
  }

  test('보리가 무리에 있어도 부르지 않으면 못 밀고, 부르면 밀린다', () => {
    const a = new Adv(data(things));
    finish(a);
    idle(a, 8);
    shoveFrom(a, 4, 2);
    assert.deepEqual(a.blockAt('box'), [5, 2], '부르기 전');
    a.call('bori', true);
    shoveFrom(a, 4, 2);
    assert.deepEqual(a.blockAt('box'), [6, 2]);
  });

  test('일이 끝나면(받침에 놓이면) 보리는 함께 다니기를 그치고 자기 자리로 돌아간다', () => {
    const a = new Adv(data(things));
    finish(a);
    idle(a, 8);
    const home = a.palHome('bori')!;
    a.call('bori', true);
    shoveFrom(a, 4, 2);
    assert.deepEqual(a.withMe(), ['bori'], '아직 일이 안 끝났다');
    shoveFrom(a, 5, 2);
    assert.equal(a.flags.box_on, true);
    assert.deepEqual(a.withMe(), []);
    idle(a, 12);
    assert.deepEqual(tileOf(a, 'bori'), [home[0], home[1]]);
  });

  test('무게 2 는 보리와 다른 동료 하나를 같이 불러야 밀린다', () => {
    const a = new Adv(data(things));
    finish(a);
    idle(a, 8);
    a.call('bori', true);
    shoveFrom(a, 4, 9);
    assert.deepEqual(a.blockAt('heavy'), [5, 9], '보리 혼자');
    a.call('nabi', true);
    shoveFrom(a, 4, 9);
    assert.deepEqual(a.blockAt('heavy'), [6, 9]);
  });

  test('루루 밧줄 오르기 · 나비 불빛도 불러 와야 쓸 수 있다', () => {
    const a = new Adv(data(things));
    finish(a);
    idle(a, 8);
    assert.ok(!a.things().some((t) => t.id === 'md'), '나비를 부르기 전엔 어둠 속이 안 보인다');
    a.call('nabi', true);
    assert.ok(a.things().some((t) => t.id === 'md'));
    a.place(px(16), px(9));
    a.face('down');
    a.step(1 / 60, NO_INPUT);
    assert.equal(a.prompt?.id, 'up');
    press(a);
    finish(a);
    assert.deepEqual(tileOf(a, 'toby'), [16, 9], '루루 없이 못 오른다');
    a.call('ruru', true);
    a.step(1 / 60, NO_INPUT);
    press(a);
    finish(a);
    assert.deepEqual(tileOf(a, 'toby'), [16, 2]);
  });

  test('무리에 없는 동료는 부를 수 없다', () => {
    const a = new Adv(data([], {}, ['toby', 'bori']));
    finish(a);
    a.call('ruru', true);
    assert.deepEqual(a.withMe(), []);
  });
});

describe('동료: 방을 오가도', () => {
  test('부른 동료는 다음 방까지 함께 오고, 나머지는 새 방의 자기 자리로 간다', () => {
    const a = new Adv(data([]));
    finish(a);
    idle(a, 8);
    a.call('bori', true);
    a.goRoom('r2', [2, 5]);
    assert.deepEqual(a.withMe(), ['bori']);
    idle(a, 1.2, walk(1, 0));
    idle(a, 0.5);
    assert.ok(dist(a, 'toby', 'bori') < 48, '보리는 따라온다');
    idle(a, 10);
    const h = a.palHome('ruru')!;
    assert.deepEqual(tileOf(a, 'ruru'), [h[0], h[1]]);
  });

  test('기억 장면을 보고 돌아오면 동료들은 있던 자리에 그대로 있다 (다시 걸어가지 않는다)', () => {
    const mem: Thing = { kind: 'memory', id: 'm1', at: [3, 9], name: '기억', scene: [{ t: 'room', id: 'mem', at: [3, 3] }, { t: 'say', who: '', text: '…' }] };
    const a = new Adv(data([mem]));
    finish(a);
    idle(a, 8);
    const before = (['bori', 'ruru', 'nabi'] as const).map((h) => tileOf(a, h));
    a.place(px(2), px(9));
    a.face('right');
    a.step(1 / 60, NO_INPUT);
    press(a);
    finish(a);
    assert.equal(a.room.id, 'r1');
    assert.deepEqual((['bori', 'ruru', 'nabi'] as const).map((h) => tileOf(a, h)), before);
  });

  test('부른 동료는 저장 · 불러오기 뒤에도 함께다', () => {
    const a = new Adv(data([]));
    finish(a);
    a.call('nabi', true);
    const b = new Adv(data([]), a.snapshot());
    assert.deepEqual(b.withMe(), ['nabi']);
  });

  test('새로 무리에 든 동료(@join)의 자리는 깨어난 그 자리', () => {
    const d = data([{ kind: 'npc', id: 'ruru_sleep', at: [14, 8], actor: 'ruru', pose: 'sleep', scene: [{ t: 'join', who: 'ruru' }] }], {}, ['toby']);
    const a = new Adv(d);
    finish(a);
    a.place(px(13), px(8));
    a.face('right');
    a.step(1 / 60, NO_INPUT);
    press(a);
    finish(a);
    assert.deepEqual(a.palHome('ruru'), [14, 8]);
    idle(a, 3);
    assert.deepEqual(tileOf(a, 'ruru'), [14, 8]);
  });
});
