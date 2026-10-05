/**
 * 새 놀이 (2 · 3단계 장에 쓰는 것): 숨바꼭질 watcher · 협동 당기기 pull · 조각 맞추기 part/assemble · 등불 자원 lantern/lamp/charge ·
 * 손거울 빛 beam/mirror · 젖은 타일 slip · 바람 wind · 톱니 gears · 물길 flow · 음 발판 seq.note · 낮은 천장 low.
 * 모두 실제 Adv 를 걸려 보며 확인한다 (풀 수 있음 · 실패 · 결곗값).
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Adv, NO_INPUT, type AdvData, type AdvInput } from '../adv.ts';
import { Builder, TILE } from '../../maps.ts';
import { px } from '../stage.ts';
import type { Cmd, Facing, RoomDef, Thing, WindDef } from '../types.ts';

/** 12×8 장난감 방: 가장자리 벽 Q, 안은 모두 바닥. cells 로 칸을 바꾼다 */
function room(id: string, things: Thing[], extra: Partial<RoomDef> = {}, cells: [number, number, string][] = []): RoomDef {
  const b = new Builder(12, 8, 'w', 1);
  b.rect(0, 0, 12, 1, 'Q');
  b.rect(0, 7, 12, 1, 'Q');
  b.rect(0, 0, 1, 8, 'Q');
  b.rect(11, 0, 1, 8, 'Q');
  for (const [x, y, c] of cells) b.rect(x, y, 1, 1, c);
  return { id, name: id, theme: 'toybox', w: 12, h: 8, tiles: b.rows(), structures: [], warps: [], npcs: [], spawns: [], start: { x: 2, y: 3 }, safe: true, dark: false, level: '', scale: 'toy', things, ...extra };
}

function data(things: Thing[], extra: Partial<RoomDef> = {}, cells: [number, number, string][] = [], party: AdvData['chapters'][0]['party'] = ['toby', 'bori', 'ruru', 'nabi']): AdvData {
  return {
    rooms: { r1: () => room('r1', things, extra, cells) },
    chapters: [{ n: 1, title: '1장', sub: '', room: 'r1', start: [2, 3], party, wind: 0.8, intro: [] }],
  };
}

const say = (who: string, text: string): Cmd => ({ t: 'say', who, text });
const idle = (a: Adv, secs: number, inp: AdvInput = NO_INPUT) => {
  for (let t = 0; t < secs - 1e-9; t += 1 / 60) a.step(1 / 60, inp);
};
const press = (a: Adv) => a.step(1 / 60, { ...NO_INPUT, act: true });
function finish(a: Adv, limit = 60): string[] {
  const lines: string[] = [];
  for (let i = 0; i < limit * 60 && (a.runner || a.mini); i++) {
    const d = a.stage.dialog;
    if (d && lines[lines.length - 1] !== d.text) lines.push(d.text);
    a.step(1 / 60, { ...NO_INPUT, act: i % 2 === 0 });
  }
  return lines;
}
const walk = (x: number, y: number): AdvInput => ({ ...NO_INPUT, move: { x, y } });
function useAt(a: Adv, x: number, y: number, dir: Facing): string[] {
  a.place(px(x), px(y));
  a.face(dir);
  a.step(1 / 60, NO_INPUT);
  press(a);
  return finish(a);
}
const tileOf = (a: Adv): [number, number] => [Math.floor(a.stage.actors.toby.x / TILE), Math.floor(a.stage.actors.toby.y / TILE)];
/** 시작 대본을 끝내고 (call 이면 모두 불러) 바로 놀 수 있는 판 */
function start(d: AdvData, call = true): Adv {
  const a = new Adv(d);
  finish(a);
  if (call) a.call('all', true);
  return a;
}

// ───────────────────────── 숨바꼭질 ─────────────────────────

describe('watcher (숨바꼭질): 시야 · 숨을 곳 · 들키면 마지막 숨은 곳으로', () => {
  const eye = (extra: Partial<Extract<Thing, { kind: 'watcher' }>> = {}): Thing => ({ kind: 'watcher', id: 'haru', at: [10, 3], actor: 'haru7', pattern: [{ s: 100, dir: 'left', r: 6, arc: 30 }], caught: [say('haru', '…응? 거기 누구야?')], ...extra });

  test('시야 안에 숨지 않고 머물면 들키고, 대사 뒤 처음 자리(들어온 칸)로 돌아간다', () => {
    const a = start(data([eye()]));
    assert.ok(a.stage.actors.haru, '지켜보는 이가 무대에 선다');
    a.place(px(6), px(3));
    idle(a, 1.2);
    assert.ok(a.runner, '들킨 장면');
    const lines = finish(a);
    assert.ok(lines.includes('…응? 거기 누구야?'), lines.join('/'));
    assert.deepEqual(tileOf(a), [2, 3]);
    assert.equal(a.watchState('haru')?.caught, 1);
  });

  test('시야 밖 (반지름 밖 · 등 뒤) 에서는 오래 있어도 안 들킨다', () => {
    const a = start(data([eye()]));
    a.place(px(3), px(3));
    idle(a, 3);
    assert.equal(a.runner, null);
    assert.equal(a.watchState('haru')?.caught, 0);
    assert.equal(a.watchState('haru')?.seen, false);
  });

  test('grace(0.8초)보다 짧게 스치면 괜찮다 (결곗값)', () => {
    const a = start(data([eye()]));
    a.place(px(6), px(3));
    idle(a, 0.5);
    assert.equal(a.watchState('haru')?.seen, true);
    assert.equal(a.runner, null);
    a.place(px(2), px(3));
    idle(a, 2);
    assert.equal(a.watchState('haru')?.caught, 0);
  });

  test('숨을 곳(hide) · 가구 밑 U 칸에 있으면 시야 안이어도 안 보인다', () => {
    const a = start(data([eye({ hide: [[6, 3]] })], {}, [[7, 4, 'U']]));
    a.place(px(6), px(3));
    idle(a, 2);
    assert.equal(a.runner, null);
    assert.equal(a.watchState('haru')?.seen, false);
    a.place(px(7), px(4));
    idle(a, 2);
    assert.equal(a.runner, null, '가구 밑');
  });

  test('밀어 둔 상자 뒤는 시야가 가려진다', () => {
    const a = start(data([eye(), { kind: 'push', id: 'box', at: [8, 3], look: 'box' }]));
    a.place(px(6), px(3));
    idle(a, 2);
    assert.equal(a.runner, null);
    assert.ok(!a.watchCells('haru').has('6,3'));
    assert.ok(!a.watchCells('haru').has('8,3'), '상자 칸');
    assert.ok(a.watchCells('haru').has('9,3'), '상자 앞은 보임');
  });

  test('들키면 마지막으로 숨었던 칸으로 돌아간다', () => {
    const a = start(data([eye({ hide: [[4, 5]] })]));
    a.place(px(4), px(5));
    idle(a, 0.2);
    a.place(px(6), px(3));
    idle(a, 1.2);
    finish(a);
    assert.deepEqual(tileOf(a), [4, 5]);
  });

  test('박자(pattern): 눈 감은 동안은 지나가도 되고, 눈을 뜨면 시야가 생긴다', () => {
    const a = start(data([eye({ pattern: [{ s: 2, dir: null }, { s: 2, dir: 'left', r: 6, arc: 30 }] })]));
    a.place(px(6), px(3));
    idle(a, 1.5);
    assert.equal(a.watchState('haru')?.step, 0);
    assert.equal(a.watchCells('haru').size, 0, '눈 감음');
    assert.equal(a.runner, null);
    idle(a, 0.7);
    assert.equal(a.watchState('haru')?.step, 1);
    idle(a, 0.8);
    assert.ok(a.runner, '눈을 뜬 뒤 0.8초 넘게 시야 안');
  });

  test('풀 수 있다: 눈 감은 틈에 시야를 가로질러 건너편 깃발 칸에 닿는다', () => {
    const a = start(data([
      { kind: 'watcher', id: 'mom', at: [6, 1], actor: 'mom', pattern: [{ s: 3, dir: null }, { s: 3, dir: 'down', r: 7, arc: 50 }], caught: [say('mom', '…뭐지?')] },
      { kind: 'trigger', id: 'goal', rect: [9, 3, 1, 1], scene: [{ t: 'flag', name: 'crossed' }] },
    ]));
    a.place(px(2), px(3));
    idle(a, 3.5);
    assert.equal(a.watchState('mom')?.step, 1, '눈을 떴다');
    a.place(px(2), px(3));
    idle(a, 0.1);
    // 다시 눈을 감을 때까지 시야 밖에서 기다렸다가 건넌다
    while (a.watchState('mom')?.step !== 0) a.step(1 / 60, NO_INPUT);
    for (let i = 0; i < 180 && !a.flags.crossed; i++) a.step(1 / 60, walk(1, 0));
    finish(a);
    assert.equal(a.flags.crossed, true);
    assert.equal(a.watchState('mom')?.caught, 0);
  });

  test('순찰: at 이 있는 박자에는 그 칸으로 걸어간다', () => {
    const a = start(data([eye({ pattern: [{ s: 2, at: [10, 3], dir: 'left' }, { s: 2, at: [10, 6], dir: 'up' }] })]));
    idle(a, 3.5);
    const h = a.stage.actors.haru;
    assert.ok(Math.abs(h.y - px(6)) < 2, `${h.y}`);
    assert.equal(h.dir, 'up');
  });

  test('moveOnly (스탠드 · 잠결): 가만히 있으면 괜찮고, 시야 안에서 움직이면 들킨다', () => {
    const a = start(data([eye({ moveOnly: true })]));
    a.place(px(7), px(3));
    idle(a, 3);
    assert.equal(a.runner, null);
    for (let i = 0; i < 90 && !a.runner; i++) a.step(1 / 60, walk(0, i % 40 < 20 ? 1 : -1));
    assert.ok(a.runner, '움직이다 들킴');
  });

  test('motion (센서등): 둘레 안에서 2칸까지 움직이면 괜찮고, 넘으면 들킨다', () => {
    const a = start(data([{ kind: 'watcher', id: 'lamp', at: [6, 4], actor: '', pattern: [{ s: 100, dir: 'down', r: 3, arc: 180 }], motion: 2, caught: [say('', '딸깍, 센서등이 켜졌다.')] }]));
    a.place(px(4), px(5));
    idle(a, 0.35, walk(1, 0));
    idle(a, 0.3);
    assert.equal(a.runner, null, `움직인 칸 ${a.watchState('lamp')?.moved}`);
    idle(a, 0.6, walk(1, 0));
    assert.ok(a.runner, '2칸 넘게 움직임');
  });

  test('세 번째로 들키면 동료 귀띔(hint)이 붙는다', () => {
    const a = start(data([eye({ hint: [say('nabi', '상자 그림자 쪽으로 붙어 가.')] })]));
    for (let n = 1; n <= 3; n++) {
      a.place(px(6), px(3));
      idle(a, 1.2);
      const lines = finish(a);
      assert.equal(lines.includes('상자 그림자 쪽으로 붙어 가.'), n >= 3, `${n}번째: ${lines.join('/')}`);
    }
  });

  test('when 깃발이 없거나 until 깃발이 서면 지켜보지 않는다', () => {
    const a = start(data([eye({ when: 'night', until: 'asleep' })]));
    a.place(px(6), px(3));
    idle(a, 2);
    assert.equal(a.runner, null);
    a.flags.night = true;
    idle(a, 1.2);
    assert.ok(a.runner);
    finish(a);
    a.flags.asleep = true;
    a.place(px(6), px(3));
    idle(a, 2);
    assert.equal(a.runner, null);
  });
});

// ───────────────────────── 협동 당기기 ─────────────────────────

describe('pull (협동 당기기): 필요한 동료가 모두 불려 와야, tugs 번 당기면 열린다', () => {
  const drawer: Thing = { kind: 'pull', id: 'drawer', at: [5, 3], look: 'drawer', need: ['ruru', 'bori'], tugs: 3, flag: 'drawer_open', scene: [{ t: 'flag', name: 'drawer_scene' }] };

  test('동료를 부르지 않았으면 「불러 와」 하고 안 열린다', () => {
    const a = start(data([drawer]), false);
    const lines = useAt(a, 4, 3, 'right');
    assert.ok(lines.some((l) => l.includes('불러') && l.includes('루루') && l.includes('보리')), lines.join('/'));
    assert.ok(!a.flags.drawer_open);
  });

  test('한 명만 불러 오면 모자란 동료 이름만 말한다', () => {
    const a = start(data([drawer]), false);
    a.call('bori', true);
    const lines = useAt(a, 4, 3, 'right');
    assert.ok(lines.some((l) => l.includes('루루') && !l.includes('보리')), lines.join('/'));
    assert.ok(!a.flags.drawer_open);
  });

  test('무리에 없는 동료가 필요하면 부르라는 말 대신 「누가 더 있어야」', () => {
    const a = start(data([drawer], {}, [], ['toby', 'bori']));
    const lines = useAt(a, 4, 3, 'right');
    assert.ok(lines.some((l) => l.includes('루루') && !l.includes('불러')), lines.join('/'));
  });

  test('둘 다 불러 오면 세 번째 당김에서 열리고 (두 번째까지는 아직), 장면이 돈다', () => {
    const a = start(data([drawer]));
    useAt(a, 4, 3, 'right');
    useAt(a, 4, 3, 'right');
    assert.ok(!a.flags.drawer_open);
    assert.equal(a.pullCount('drawer'), 2);
    useAt(a, 4, 3, 'right');
    assert.equal(a.flags.drawer_open, true);
    assert.equal(a.flags.drawer_scene, true);
    a.place(px(4), px(3));
    a.face('right');
    a.step(1 / 60, NO_INPUT);
    assert.notEqual(a.prompt?.id, 'drawer', '열린 뒤엔 더 당길 수 없다');
  });
});

// ───────────────────────── 조각 맞추기 ─────────────────────────

describe('part · assemble (조각을 모아 자리에 맞추기)', () => {
  const things = (): Thing[] => [
    { kind: 'part', id: 'p1', at: [3, 5], look: 'paper', set: 'crayon' },
    { kind: 'part', id: 'p2', at: [8, 5], look: 'paper', set: 'crayon' },
    { kind: 'part', id: 'h1', at: [9, 2], look: 'box', set: 'crayon', heavy: true },
    { kind: 'part', id: 'q1', at: [2, 6], look: 'button', set: 'eyes' },
    { kind: 'assemble', id: 'pic', at: [5, 2], set: 'crayon', need: 3, flag: 'pic_done', scene: [{ t: 'flag', name: 'pic_scene' }] },
  ];

  test('주우면 손에 들고 바닥에서 사라진다', () => {
    const a = start(data(things()));
    useAt(a, 3, 4, 'down');
    assert.deepEqual(a.held(), ['p1']);
    assert.ok(!a.things().some((t) => t.id === 'p1'));
  });

  test('모자라게 놓으면 몇 개 남았는지 말하고, need 개가 되면 flag + 장면', () => {
    const a = start(data(things()));
    useAt(a, 3, 4, 'down');
    const lines = useAt(a, 5, 3, 'up');
    assert.deepEqual(a.held(), []);
    assert.deepEqual(a.assembled('pic'), { placed: 1, need: 3, done: false });
    assert.ok(lines.some((l) => l.includes('2')), lines.join('/'));
    useAt(a, 8, 4, 'down');
    useAt(a, 9, 3, 'up');
    assert.deepEqual(a.held().sort(), ['h1', 'p2']);
    useAt(a, 5, 3, 'up');
    assert.equal(a.flags.pic_done, true);
    assert.equal(a.flags.pic_scene, true);
    assert.deepEqual(a.assembled('pic'), { placed: 3, need: 3, done: true });
  });

  test('빈손으로 맞추는 자리를 살펴보면 아직 없다는 말만', () => {
    const a = start(data(things()));
    const lines = useAt(a, 5, 3, 'up');
    assert.ok(lines.length > 0);
    assert.deepEqual(a.assembled('pic')?.placed, 0);
  });

  test('다른 짝 조각은 내려놓지 않는다', () => {
    const a = start(data(things()));
    useAt(a, 2, 5, 'down');
    useAt(a, 5, 3, 'up');
    assert.deepEqual(a.held(), ['q1']);
    assert.equal(a.assembled('pic')?.placed, 0);
  });

  test('무거운 조각: 보리가 없으면 못 들고, 들고 있으면 다른 것을 못 줍고 걸음이 느려진다', () => {
    const a = start(data(things()), false);
    useAt(a, 9, 3, 'up');
    assert.deepEqual(a.held(), [], '보리를 안 불렀다');
    a.call('all', true);
    a.place(px(2), px(3));
    idle(a, 1, walk(1, 0));
    const free = a.stage.actors.toby.x - px(2);
    useAt(a, 9, 3, 'up');
    assert.deepEqual(a.held(), ['h1']);
    useAt(a, 8, 4, 'down');
    assert.deepEqual(a.held(), ['h1'], '손이 꽉 참');
    a.place(px(2), px(3));
    idle(a, 1, walk(1, 0));
    const loaded = a.stage.actors.toby.x - px(2);
    assert.ok(loaded < free * 0.85, `${loaded} < ${free}`);
  });

  test('저장했다 불러와도 든 것 · 놓은 것이 그대로', () => {
    const a = start(data(things()));
    useAt(a, 3, 4, 'down');
    useAt(a, 5, 3, 'up');
    useAt(a, 8, 4, 'down');
    const b = new Adv(data(things()), a.snapshot());
    assert.deepEqual(b.held(), ['p2']);
    assert.equal(b.assembled('pic')?.placed, 1);
  });
});

// ───────────────────────── 등불 자원 ─────────────────────────

describe('lantern · charge · lamp (나비 등불 밝기 자원)', () => {
  const lit = { lantern: { max: 4, min: 1, drain: 1 } } as Partial<RoomDef>;
  const dk: Thing = { kind: 'keepsake', id: 'kd', at: [8, 3], look: 'jar', name: '어둠 속 유리병', scene: [], dark: true };

  test('반지름은 max 에서 시작해 초당 drain 씩 줄고 min 아래로는 안 내려간다', () => {
    const a = start(data([dk], lit));
    assert.equal(a.lanternR(), 4);
    idle(a, 2);
    assert.ok(Math.abs(a.lanternR() - 2) < 0.1, `${a.lanternR()}`);
    idle(a, 5);
    assert.equal(a.lanternR(), 1);
  });

  test('어둠 속 물건은 나비 등불 반지름 안에서만 보인다', () => {
    const a = start(data([dk], lit));
    a.place(px(2), px(3));
    a.step(1 / 60, NO_INPUT);
    assert.ok(!a.things().some((t) => t.id === 'kd'), '6칸 떨어짐');
    a.place(px(5), px(3));
    a.step(1 / 60, NO_INPUT);
    assert.ok(a.things().some((t) => t.id === 'kd'), '3칸 (반지름 4 안)');
    idle(a, 3);
    assert.ok(!a.things().some((t) => t.id === 'kd'), '등불이 줄어 3칸이 밖');
  });

  test('나비를 부르지 않았으면 바로 옆이어도 안 보이고, 등불도 줄지 않는다', () => {
    const a = start(data([dk], lit), false);
    a.place(px(7), px(3));
    idle(a, 2);
    assert.ok(!a.things().some((t) => t.id === 'kd'));
    assert.equal(a.lanternR(), 4);
  });

  test('충전 자리 (야광 스티커) 가까이에 있으면 다시 찬다 (max 까지)', () => {
    const a = start(data([dk, { kind: 'charge', id: 'sticker', at: [2, 5], rate: 2 }], lit));
    idle(a, 3);
    const low = a.lanternR();
    a.place(px(2), px(5));
    idle(a, 1);
    assert.ok(a.lanternR() > low + 1.5, `${low} → ${a.lanternR()}`);
    idle(a, 3);
    assert.equal(a.lanternR(), 4);
  });

  test('zones 가 있으면 그 어두운 곳 안에서만 준다', () => {
    const a = start(data([dk], { lantern: { max: 4, min: 1, drain: 1, zones: [[6, 1, 5, 6]] } }));
    a.place(px(2), px(3));
    idle(a, 2);
    assert.equal(a.lanternR(), 4);
    a.place(px(7), px(3));
    idle(a, 1);
    assert.ok(a.lanternR() < 3.2);
  });

  test('등(lamp)을 켜면 그 반지름 안의 어둠 속 물건이 나비 없이도 보인다 · who 동료가 없으면 못 켠다', () => {
    const lamp: Thing = { kind: 'lamp', id: 'stand', at: [8, 5], r: 2, who: 'nabi' };
    const a = start(data([dk, lamp], lit), false);
    useAt(a, 8, 4, 'down');
    assert.ok(!a.flags.lamp_stand, '나비가 없다');
    a.call('nabi', true);
    useAt(a, 8, 4, 'down');
    assert.equal(a.flags.lamp_stand, true);
    a.call('nabi', false);
    a.place(px(2), px(3));
    a.step(1 / 60, NO_INPUT);
    assert.ok(a.things().some((t) => t.id === 'kd'));
  });

  test('켜진 등 곁에서도 등불이 찬다', () => {
    const a = start(data([dk, { kind: 'lamp', id: 'stand', at: [8, 5], r: 2 }], lit));
    useAt(a, 8, 4, 'down');
    a.place(px(2), px(3));
    idle(a, 3);
    const low = a.lanternR();
    a.place(px(8), px(4));
    idle(a, 1);
    assert.ok(a.lanternR() > low + 0.5, `${low} → ${a.lanternR()}`);
  });
});

// ───────────────────────── 손거울 빛 ─────────────────────────

describe('beam · mirror (손거울로 빛을 꺾어 과녁에)', () => {
  const things = (extra: Thing[] = []): Thing[] => [
    { kind: 'beam', id: 'light', at: [1, 2], dir: 'right', target: [9, 5], flag: 'keyhole', who: 'nabi', scene: [{ t: 'flag', name: 'box_open' }] },
    { kind: 'mirror', id: 'm1', at: [6, 2], face: 0 },
    { kind: 'mirror', id: 'm2', at: [6, 5], face: 0 },
    { kind: 'spot', id: 'undo', at: [2, 6], scene: [{ t: 'reset', ids: ['m1', 'm2'] }] },
    ...extra,
  ];

  test('거울을 돌려 맞추면 과녁에 닿아 flag + 장면, 그 전에는 아니다', () => {
    const a = start(data(things()));
    assert.ok(!a.flags.keyhole);
    useAt(a, 5, 3, 'right');
    assert.equal(a.mirrorFace('m1'), 1);
    assert.ok(!a.flags.keyhole);
    useAt(a, 5, 3, 'right');
    assert.equal(a.mirrorFace('m1'), 2);
    idle(a, 0.1);
    finish(a);
    assert.equal(a.flags.keyhole, true);
    assert.equal(a.flags.box_open, true);
    assert.equal(a.beamPath('light')?.hit, true);
  });

  test('나비가 없으면 빛이 없다 (거울을 맞춰도)', () => {
    const a = start(data(things()), false);
    useAt(a, 5, 3, 'right');
    useAt(a, 5, 3, 'right');
    idle(a, 0.2);
    assert.ok(!a.flags.keyhole);
    assert.equal(a.beamPath('light'), null);
  });

  test('밀 물건이 빛길을 막으면 닿지 않는다', () => {
    const a = start(data(things([{ kind: 'push', id: 'box', at: [4, 2], look: 'box' }])));
    useAt(a, 5, 3, 'right');
    useAt(a, 5, 3, 'right');
    idle(a, 0.2);
    assert.ok(!a.flags.keyhole);
    assert.deepEqual(a.beamPath('light')?.cells.at(-1), [3, 2]);
  });

  test('되돌리기(@reset)로 거울 방향이 처음으로', () => {
    const a = start(data(things()));
    useAt(a, 5, 3, 'right');
    assert.equal(a.mirrorFace('m1'), 1);
    useAt(a, 2, 5, 'down');
    assert.equal(a.mirrorFace('m1'), 0);
  });

  test('저장했다 불러와도 거울 방향이 그대로', () => {
    const a = start(data(things()));
    useAt(a, 5, 3, 'right');
    const b = new Adv(data(things()), a.snapshot());
    assert.equal(b.mirrorFace('m1'), 1);
  });
});

// ───────────────────────── 젖은 타일 ─────────────────────────

describe('slip (젖은 타일 미끄럼)', () => {
  const run = (extra: Partial<RoomDef>, things: Thing[] = [], inp = walk(1, 0)) => {
    const a = start(data(things, extra));
    a.place(px(2), px(3));
    idle(a, 0.3, inp);
    idle(a, 2.5);
    return a;
  };

  test('젖은 칸에 들어서면 마른 칸에 닿을 때까지 미끄러져 그 칸 가운데에 선다', () => {
    const a = run({ slip: [[3, 3, 5, 1]] });
    assert.deepEqual(tileOf(a), [8, 3]);
    assert.ok(Math.abs(a.stage.actors.toby.y - px(3)) < 1);
    assert.ok(Math.abs(a.stage.actors.toby.x - px(8)) < 1.5, `${a.stage.actors.toby.x}`);
  });

  test('미끄러지는 동안은 방향 키를 눌러도 꺾이지 않는다', () => {
    const a = start(data([], { slip: [[3, 3, 5, 1]] }));
    a.place(px(2), px(3));
    idle(a, 0.3, walk(1, 0));
    idle(a, 2.5, walk(0, 1));
    assert.equal(tileOf(a)[0] >= 8, true, `${tileOf(a)}`);
  });

  test('벽 앞 젖은 칸에서 멈추고, 거기서 돌아서면 반대로 미끄러진다', () => {
    const a = run({ slip: [[3, 3, 8, 1]] });
    assert.deepEqual(tileOf(a), [10, 3]);
    idle(a, 0.3, walk(-1, 0));
    idle(a, 3);
    assert.deepEqual(tileOf(a), [2, 3]);
  });

  test('때수건(grip) · 밀어 둔 슬리퍼 앞에서 멈춘다', () => {
    assert.deepEqual(tileOf(run({ slip: [[3, 3, 5, 1]], grip: [[5, 3]] })), [5, 3]);
    assert.deepEqual(tileOf(run({ slip: [[3, 3, 5, 1]] }, [{ kind: 'push', id: 'slipper', at: [6, 3], look: 'shoe' }])), [5, 3]);
  });

  test('마른 바닥은 그대로 걷는다', () => {
    const a = start(data([]));
    a.place(px(2), px(3));
    idle(a, 0.3, walk(1, 0));
    idle(a, 2);
    assert.ok(tileOf(a)[0] <= 3, `${tileOf(a)}`);
  });
});

// ───────────────────────── 바람 ─────────────────────────

describe('wind (바람이 불 때만 밀려난다)', () => {
  const gust = (extra: Partial<WindDef> = {}): Partial<RoomDef> => ({ winds: [{ id: 'w', rect: [5, 1, 2, 6], dir: 'left', period: 4, gust: 2, ...extra }] });

  test('부는 동안 바람 칸에 서 있으면 dir 쪽으로 밀려 나간다', () => {
    const a = start(data([], gust()));
    a.place(px(6), px(3));
    idle(a, 0.6);
    assert.equal(a.windState('w')?.blowing, true);
    assert.ok(tileOf(a)[0] <= 4, `${tileOf(a)}`);
  });

  test('멎은 동안은 안 밀리고, 멎기 전 0.8초는 예고(warn)', () => {
    const a = start(data([], gust()));
    a.place(px(2), px(3));
    idle(a, 2.2);
    assert.equal(a.windState('w')?.blowing, false);
    a.place(px(6), px(3));
    idle(a, 1);
    assert.deepEqual(tileOf(a), [6, 3]);
    idle(a, 0.3);
    assert.equal(a.windState('w')?.warn, true);
  });

  test('바람 그늘(shelter)에서는 부는 동안에도 안 밀린다', () => {
    const a = start(data([], gust({ shelter: [[6, 3]] })));
    a.place(px(6), px(3));
    idle(a, 1);
    assert.deepEqual(tileOf(a), [6, 3]);
  });

  test('blows 의 물건은 바람이 일 때마다 한 칸 (바람 칸 안에 있을 때만)', () => {
    const a = start(data([{ kind: 'push', id: 'leaf', at: [6, 5], look: 'leaf' }], gust({ blows: ['leaf'] })));
    idle(a, 0.1);
    assert.deepEqual(a.blockAt('leaf'), [5, 5]);
    idle(a, 4);
    assert.deepEqual(a.blockAt('leaf'), [4, 5]);
    idle(a, 4);
    assert.deepEqual(a.blockAt('leaf'), [4, 5], '바람 칸 밖');
  });

  test('when 깃발이 없으면 안 분다', () => {
    const a = start(data([], gust({ when: 'window_open' })));
    a.place(px(6), px(3));
    idle(a, 1);
    assert.deepEqual(tileOf(a), [6, 3]);
  });
});

// ───────────────────────── 톱니 ─────────────────────────

describe('gears (톱니를 밀어 끼워 동력을 전하기)', () => {
  const things = (extra: Partial<Extract<Thing, { kind: 'gears' }>> = {}): Thing[] => [
    { kind: 'gears', id: 'train', at: [2, 2], target: [6, 2], gears: ['g1', 'g2', 'g3'], flag: 'key_turns', scene: [{ t: 'flag', name: 'tick' }], ...extra },
    { kind: 'push', id: 'g1', at: [3, 2], look: 'gear' },
    { kind: 'push', id: 'g2', at: [4, 2], look: 'gear' },
    { kind: 'push', id: 'g3', at: [5, 4], look: 'gear' },
  ];

  test('빈 자리에 톱니를 밀어 넣으면 열쇠 축까지 돌아 flag + 장면', () => {
    const a = start(data(things()));
    assert.ok(!a.flags.key_turns);
    assert.equal(a.gearState('train')?.spin.has('6,2'), false);
    useAt(a, 5, 5, 'up');
    assert.ok(!a.flags.key_turns, '한 칸 모자람');
    useAt(a, 5, 4, 'up');
    idle(a, 0.1);
    finish(a);
    assert.deepEqual(a.blockAt('g3'), [5, 2]);
    assert.equal(a.flags.key_turns, true);
    assert.equal(a.flags.tick, true);
    assert.equal(a.gearState('train')?.spin.get('6,2'), 1, '네 번 건너 같은 방향');
  });

  test('축(pegs)이 있으면 축 위의 톱니만 맞물린다', () => {
    const a = start(data(things({ pegs: [[3, 2], [4, 2]] })));
    useAt(a, 5, 5, 'up');
    useAt(a, 5, 4, 'up');
    idle(a, 0.1);
    assert.ok(!a.flags.key_turns);
  });

  test('녹슨 톱니(jam)와 이어지면 멈춘다', () => {
    const a = start(data(things({ jam: [[6, 3]] })));
    useAt(a, 5, 5, 'up');
    useAt(a, 5, 4, 'up');
    idle(a, 0.1);
    assert.ok(!a.flags.key_turns);
    assert.equal(a.gearState('train')?.jammed, true);
  });

  test('when (태엽을 나눠 줌) 이 서야 동력이 돈다', () => {
    const a = start(data(things({ when: 'wound' })));
    useAt(a, 5, 5, 'up');
    useAt(a, 5, 4, 'up');
    idle(a, 0.1);
    assert.ok(!a.flags.key_turns);
    a.flags.wound = true;
    idle(a, 0.1);
    finish(a);
    assert.equal(a.flags.key_turns, true);
  });
});

// ───────────────────────── 물길 ─────────────────────────

describe('flow (벽돌을 밀어 물길 돌리기)', () => {
  const things = (): Thing[] => [
    { kind: 'flow', id: 'rain', at: [1, 2], channel: [[1, 2, 9, 1], [5, 3, 1, 3]], pools: [{ at: [9, 2], flag: 'poolA' }, { at: [5, 5], flag: 'poolB' }], fill: [0], dry: [1], flag: 'path_dry', scene: [{ t: 'flag', name: 'frog_hops' }] },
    { kind: 'push', id: 'brick', at: [6, 3], look: 'block' },
  ];

  test('처음엔 두 웅덩이가 차 있어 지나갈 수 없다', () => {
    const a = start(data(things()));
    idle(a, 0.1);
    assert.equal(a.flags.poolA, true);
    assert.equal(a.flags.poolB, true);
    assert.equal(a.solid(5, 5), true);
    assert.equal(a.solid(5, 4), false, '물길 자체는 얕아서 걷는다');
  });

  test('벽돌로 갈래를 막으면 그 웅덩이가 말라 걸을 수 있고, 조건이 맞아 flag + 장면', () => {
    const a = start(data(things()));
    useAt(a, 7, 3, 'left');
    idle(a, 0.1);
    finish(a);
    assert.deepEqual(a.blockAt('brick'), [5, 3]);
    assert.ok(!a.flags.poolB, '마른 웅덩이 깃발은 내려감');
    assert.equal(a.solid(5, 5), false);
    assert.equal(a.flags.path_dry, true);
    assert.equal(a.flags.frog_hops, true);
    assert.ok(!a.flowCells('rain').has('5,4'));
  });

  test('본류를 막으면 둘 다 말라 조건(fill)이 안 맞는다', () => {
    const a = start(data([...things().slice(0, 1), { kind: 'push', id: 'brick', at: [3, 3], look: 'block' }]));
    useAt(a, 3, 4, 'up');
    idle(a, 0.1);
    assert.deepEqual(a.blockAt('brick'), [3, 2]);
    assert.ok(!a.flags.poolA);
    assert.ok(!a.flags.poolB, '마른 웅덩이 깃발은 내려감');
    assert.ok(!a.flags.path_dry);
  });

  test('찬 웅덩이로는 밀 물건을 밀어 넣을 수 없다 (물길 밖에서 밀어도)', () => {
    const a = start(data([...things().slice(0, 1), { kind: 'push', id: 'brick', at: [4, 5], look: 'block' }]));
    idle(a, 0.1);
    useAt(a, 3, 5, 'right');
    assert.deepEqual(a.blockAt('brick'), [4, 5]);
    assert.equal(a.flags.poolB, true);
  });
});

// ───────────────────────── 음 발판 ─────────────────────────

describe('seq + note (음 발판: 밟으면 그 음, 맞는 가락이면 flag)', () => {
  const tune: Thing = { kind: 'seq', id: 'music', keys: [{ at: [3, 5], look: '', note: '미' }, { at: [5, 5], look: '', note: '솔' }, { at: [7, 5], look: '', note: '라' }], order: [0, 1, 2], flag: 'music_box' };
  const stepOn = (a: Adv, x: number, y: number): string[] => {
    a.stage.sfx.length = 0;
    a.place(px(x), px(y));
    a.step(1 / 60, NO_INPUT);
    const s = [...a.stage.sfx];
    a.place(px(x), px(y - 2));
    a.step(1 / 60, NO_INPUT);
    finish(a);
    return s;
  };

  test('발판마다 제 음이 나고, 미 · 솔 · 라 순서면 flag', () => {
    const a = start(data([tune]));
    assert.ok(stepOn(a, 3, 5).includes('noteMi'));
    assert.ok(stepOn(a, 5, 5).includes('noteSol'));
    assert.ok(!a.flags.music_box);
    assert.ok(stepOn(a, 7, 5).includes('noteLa'));
    assert.equal(a.flags.music_box, true);
  });

  test('틀린 음을 밟으면 그 음 + 틀림 소리, 처음부터', () => {
    const a = start(data([tune]));
    stepOn(a, 3, 5);
    const s = stepOn(a, 7, 5);
    assert.ok(s.includes('noteLa') && s.includes('wrong'), s.join(','));
    assert.deepEqual(a.seqState('music')?.pressed, []);
  });
});

// ───────────────────────── 낮은 천장 ─────────────────────────

describe('low (낮은 천장): 보리가 함께면 못 지나간다', () => {
  const ceiling = (when?: string): Partial<RoomDef> => ({ low: [{ rect: [5, 1, 1, 6], when }] });

  test('보리를 데려가면 막히고, 보리 없이 (토비 · 루루) 는 지나간다', () => {
    const a = start(data([], ceiling()), false);
    a.call('ruru', true);
    a.place(px(3), px(3));
    idle(a, 1.5, walk(1, 0));
    assert.ok(tileOf(a)[0] > 5, `${tileOf(a)}`);
    a.call('bori', true);
    a.place(px(3), px(3));
    idle(a, 1.5, walk(1, 0));
    assert.ok(tileOf(a)[0] < 5, `${tileOf(a)}`);
    assert.equal(a.solid(5, 3), true);
  });

  test('when 깃발(천장이 내려앉음) 이 서야 낮아진다', () => {
    const a = start(data([], ceiling('sag')));
    assert.equal(a.solid(5, 3), false);
    a.flags.sag = true;
    assert.equal(a.solid(5, 3), true);
  });
});
