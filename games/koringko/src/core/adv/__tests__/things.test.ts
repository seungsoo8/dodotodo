/**
 * 새 놀이 물건 (keepsake · push · pad · windup · climb · seq · chase), 장난감만 지나가는 가구 밑 'U', 높이 elev.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Adv, NO_INPUT, type AdvData, type AdvInput } from '../adv.ts';
import { Builder, TILE } from '../../maps.ts';
import { px } from '../stage.ts';
import type { Cmd, Facing, RoomDef, Thing } from '../types.ts';

/** 12×8 장난감 방: 가장자리 벽 Q, (6,1)~(6,6) 낭떠러지 v. cells 로 칸을 바꾼다 */
function room(id: string, things: Thing[], extra: Partial<RoomDef> = {}, cells: [number, number, string][] = []): RoomDef {
  const b = new Builder(12, 8, 'w', 1);
  b.rect(0, 0, 12, 1, 'Q');
  b.rect(0, 7, 12, 1, 'Q');
  b.rect(0, 0, 1, 8, 'Q');
  b.rect(11, 0, 1, 8, 'Q');
  b.rect(6, 1, 1, 6, 'v');
  for (const [x, y, c] of cells) b.rect(x, y, 1, 1, c);
  return { id, name: id, theme: 'toybox', w: 12, h: 8, tiles: b.rows(), structures: [], warps: [], npcs: [], spawns: [], start: { x: 2, y: 3 }, safe: true, dark: false, level: '', scale: 'toy', things, ...extra };
}

function data(things: Thing[], extra: Partial<RoomDef> = {}, cells: [number, number, string][] = [], party: AdvData['chapters'][0]['party'] = ['toby', 'bori']): AdvData {
  return {
    rooms: {
      r1: () => room('r1', things, extra, cells),
      r2: () => room('r2', []),
      mem: () => ({ ...room('mem', []), scale: 'human' }),
    },
    chapters: [
      { n: 1, title: '1장', sub: '', room: 'r1', start: [2, 3], party, wind: 0.8, intro: [] },
      { n: 2, title: '2장', sub: '', room: 'r2', start: [3, 3], party: ['toby'], wind: 1, intro: [{ t: 'flag', name: 'ch2' }] },
    ],
  };
}

const say = (who: string, text: string): Cmd => ({ t: 'say', who, text });
const idle = (a: Adv, secs: number, inp: AdvInput = NO_INPUT) => {
  for (let t = 0; t < secs; t += 1 / 60) a.step(1 / 60, inp);
};
const press = (a: Adv) => a.step(1 / 60, { ...NO_INPUT, act: true });
/** 대본이 끝날 때까지 넘기며, 나온 대사를 모은다 */
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
/** 그 칸에 서서 그쪽을 보고 누른다 → 대본 끝까지 (대사 목록) */
function useAt(a: Adv, x: number, y: number, dir: Facing): string[] {
  a.place(px(x), px(y));
  a.face(dir);
  a.step(1 / 60, NO_INPUT);
  press(a);
  return finish(a);
}
function withParty(a: Adv, party: AdvData['chapters'][0]['party']): void {
  a.save.party = [...party];
  a.syncParty();
}

describe('keepsake (기억이 깃든 물건): memory 와 같은 "기억"', () => {
  const things: Thing[] = [
    { kind: 'memory', id: 'm1', at: [2, 5], name: '구슬 기억', scene: [say('toby', '기억 하나')] },
    { kind: 'keepsake', id: 'k1', at: [4, 5], look: 'frame', look2: 'frame_up', name: '엎어 놓은 사진', caption: '틀만 두고 갔네', scene: [{ t: 'room', id: 'mem', at: [3, 3] }, { t: 'show', who: 'haru', kind: 'haru15', at: [4, 3] }, say('haru', '사진은 내가 가져갈래')], after: [{ t: 'flag', name: 'k1_after' }] },
    { kind: 'link', id: 'door', at: [5, 2], name: '바늘', icon: 'needle', locked: [say('toby', '아직이야')], scene: [{ t: 'chapter', n: 2 }] },
  ];

  test('살펴보면 기억 방(세피아)에 다녀오고, mem_ 깃발 · 앨범 · 뒤 대화, 물건은 things() 에서 빠진다', () => {
    const a = new Adv(data(things));
    finish(a);
    a.place(px(4), px(4));
    a.face('down');
    a.step(1 / 60, NO_INPUT);
    assert.equal(a.prompt?.id, 'k1');
    press(a);
    let sawMemory = false;
    for (let i = 0; i < 6000 && a.runner; i++) {
      if (a.room.id === 'mem' && a.stage.tone === 'memory') sawMemory = true;
      a.step(1 / 60, { ...NO_INPUT, act: i % 2 === 0 });
    }
    assert.ok(sawMemory);
    assert.equal(a.room.id, 'r1');
    assert.deepEqual([a.stage.actors.toby.x, a.stage.actors.toby.y], [px(4), px(4)], '원래 자리로');
    assert.equal(a.flags.mem_k1, true);
    assert.equal(a.flags.k1_after, true);
    assert.deepEqual(a.save.album, ['k1']);
    assert.ok(!a.things().some((t) => t.id === 'k1'));
  });

  test('memories() 는 memory 와 keepsake 를 함께 센다', () => {
    const a = new Adv(data(things));
    finish(a);
    assert.deepEqual(a.memories(), { got: 0, total: 2 });
    a.flags.mem_k1 = true;
    assert.deepEqual(a.memories(), { got: 1, total: 2 });
  });

  test('기억의 문은 keepsake 까지 모아야 열린다', () => {
    const a = new Adv(data(things));
    finish(a);
    a.flags.mem_m1 = true;
    assert.deepEqual(useAt(a, 5, 3, 'up'), ['아직이야'], 'memory 만 모았을 때는 잠김');
    assert.equal(a.save.chapter, 1);
    a.flags.mem_k1 = true;
    useAt(a, 5, 3, 'up');
    assert.equal(a.save.chapter, 2);
    assert.equal(a.flags.ch2, true);
  });

  test('dark keepsake 는 나비가 있어야 보인다', () => {
    const a = new Adv(data([{ kind: 'keepsake', id: 'kd', at: [3, 3], look: 'jar', name: '어둠 속', scene: [], dark: true }]));
    finish(a);
    assert.deepEqual(a.things().map((t) => t.id), []);
    withParty(a, ['toby', 'nabi']);
    assert.deepEqual(a.things().map((t) => t.id), ['kd']);
  });

  test('걷는 기억 explore: 들어가서 실을 다 모으면 장면이 흐르고 돌아온다', () => {
    const a = new Adv(data([{ kind: 'keepsake', id: 'w1', at: [2, 4], look: 'tape', name: '테이프 소리', scene: [{ t: 'room', id: 'mem' }, { t: 'flag', name: 'body' }], explore: { enter: [3, 6], threads: [{ at: [5, 5], text: [say('toby', '실')] }] } }]));
    finish(a);
    useAt(a, 2, 3, 'down');
    assert.equal(a.room.id, 'mem');
    assert.deepEqual(a.threadCount(), { got: 0, total: 1 });
    assert.ok(!a.flags.body);
    useAt(a, 5, 6, 'up');
    finish(a);
    assert.equal(a.flags.body, true);
    assert.equal(a.flags.mem_w1, true);
    assert.equal(a.room.id, 'r1');
  });
});

describe('push (보리가 한 칸 밀기) · pad (자리 맞추기)', () => {
  test('보리가 없으면 안 밀리고, 있으면 미는 쪽으로 딱 한 칸 (미끄러지지 않음)', () => {
    const a = new Adv(data([{ kind: 'push', id: 'p1', at: [3, 3], look: 'cushion' }], {}, [], ['toby']));
    finish(a);
    useAt(a, 2, 3, 'right');
    assert.deepEqual(a.blockAt('p1'), [3, 3]);
    withParty(a, ['toby', 'bori']);
    useAt(a, 2, 3, 'right');
    assert.deepEqual(a.blockAt('p1'), [4, 3]);
    useAt(a, 3, 3, 'right');
    assert.deepEqual(a.blockAt('p1'), [5, 3]);
  });

  test('앞 칸이 막혔으면 (낭떠러지 · 벽 · 다른 밀 물건) 그대로', () => {
    const a = new Adv(data([
      { kind: 'push', id: 'p1', at: [5, 3], look: 'box' },
      { kind: 'push', id: 'p2', at: [2, 2], look: 'box' },
      { kind: 'push', id: 'p3', at: [2, 1], look: 'box' },
    ]));
    finish(a);
    const lines = useAt(a, 4, 3, 'right');
    assert.deepEqual(a.blockAt('p1'), [5, 3], '낭떠러지 쪽으로는 안 밀림');
    assert.ok(lines.length > 0, '보리가 한마디');
    useAt(a, 2, 3, 'up');
    assert.deepEqual(a.blockAt('p2'), [2, 2], '앞에 다른 물건');
    assert.deepEqual(a.blockAt('p3'), [2, 1]);
  });

  test('밀 물건이 놓인 칸은 지나갈 수 없다', () => {
    const a = new Adv(data([{ kind: 'push', id: 'p1', at: [4, 3], look: 'box' }]));
    finish(a);
    a.place(px(2), px(3));
    idle(a, 2, walk(1, 0));
    assert.ok(a.stage.actors.toby.x < 4 * TILE, `${a.stage.actors.toby.x}`);
    assert.equal(a.solid(4, 3), true);
  });

  test('roll (연필) 은 막힐 때까지 굴러간다', () => {
    const a = new Adv(data([{ kind: 'push', id: 'pen', at: [2, 2], look: 'pencil', roll: true }]));
    finish(a);
    useAt(a, 1, 2, 'right');
    assert.deepEqual(a.blockAt('pen'), [5, 2], '낭떠러지 앞까지');
  });

  test('무게 2 는 보리 말고 동료가 하나 더 있어야: 아니면 「혼자는 무거워」', () => {
    const things: Thing[] = [{ kind: 'push', id: 'hatch', at: [3, 3], look: 'hatch', weight: 2 }];
    const a = new Adv(data(things));
    finish(a);
    const lines = useAt(a, 2, 3, 'right');
    assert.deepEqual(a.blockAt('hatch'), [3, 3]);
    assert.ok(lines.some((l) => l.includes('혼자는 무거워')), lines.join('/'));
    withParty(a, ['toby', 'bori', 'ruru']);
    useAt(a, 2, 3, 'right');
    assert.deepEqual(a.blockAt('hatch'), [4, 3]);
    withParty(a, ['toby', 'ruru', 'nabi']);
    useAt(a, 3, 3, 'right');
    assert.deepEqual(a.blockAt('hatch'), [4, 3], '보리가 없으면 아무리 많아도 안 됨');
  });

  test('pad: 받는 물건이 그 칸에 놓이면 깃발, 다른 물건은 아님', () => {
    const things: Thing[] = [
      { kind: 'push', id: 'candy', at: [3, 2], look: 'candy' },
      { kind: 'push', id: 'book', at: [3, 4], look: 'book' },
      { kind: 'pad', id: 'nose', at: [4, 4], accepts: ['candy'], flag: 'bori_smell' },
      { kind: 'pad', id: 'nose2', at: [4, 2], accepts: ['candy'], flag: 'candy_moved' },
    ];
    const a = new Adv(data(things));
    finish(a);
    useAt(a, 2, 4, 'right');
    assert.deepEqual(a.blockAt('book'), [4, 4]);
    assert.equal(a.flags.bori_smell, undefined, '책은 받지 않는다');
    assert.ok(!a.solid(4, 2), 'pad 칸 자체는 막히지 않는다');
    useAt(a, 2, 2, 'right');
    assert.deepEqual(a.blockAt('candy'), [4, 2]);
    assert.equal(a.flags.candy_moved, true);
  });

  test('밀어 놓은 자리는 저장 · 불러오기 뒤에도 그대로', () => {
    const things: Thing[] = [{ kind: 'push', id: 'p1', at: [3, 3], look: 'box' }];
    const a = new Adv(data(things));
    finish(a);
    useAt(a, 2, 3, 'right');
    const b = new Adv(data(things), JSON.parse(JSON.stringify(a.snapshot())));
    assert.deepEqual(b.blockAt('p1'), [4, 3]);
    assert.equal(b.solid(4, 3), true);
    assert.equal(b.solid(3, 3), false);
  });
});

describe('windup (토비 태엽 나눠 주기)', () => {
  const clock = (cost: number): Thing[] => [{ kind: 'windup', id: 'cuckoo', at: [3, 3], cost, scene: [say('cuckoo', '뻐꾹!'), { t: 'flag', name: 'nabi_awake' }] }];

  test('태엽을 cost 만큼 덜고 장면 · windup_<id> 깃발, 다 쓴 장치는 다시 살펴볼 것이 아니다', () => {
    const a = new Adv(data(clock(0.3)));
    finish(a);
    const lines = useAt(a, 2, 3, 'right');
    assert.ok(lines.includes('뻐꾹!'));
    assert.equal(a.flags.nabi_awake, true);
    assert.equal(a.flags.windup_cuckoo, true);
    assert.ok(Math.abs(a.save.wind - 0.5) < 1e-9, `${a.save.wind}`);
    a.place(px(2), px(3));
    a.face('right');
    a.step(1 / 60, NO_INPUT);
    assert.equal(a.prompt, null);
    assert.ok(a.things().some((t) => t.id === 'cuckoo'), '그림은 남는다');
  });

  test('태엽이 cost 와 같으면 0 까지 쓴다 (경곗값)', () => {
    const a = new Adv(data(clock(0.8)));
    finish(a);
    useAt(a, 2, 3, 'right');
    assert.equal(a.flags.windup_cuckoo, true);
    assert.equal(a.save.wind, 0);
  });

  test('태엽이 모자라면 덜지 않고 「태엽이 모자라…」', () => {
    const a = new Adv(data(clock(0.9)));
    finish(a);
    const lines = useAt(a, 2, 3, 'right');
    assert.ok(lines.some((l) => l.includes('태엽이 모자라')), lines.join('/'));
    assert.equal(a.save.wind, 0.8);
    assert.equal(a.flags.windup_cuckoo, undefined);
    assert.equal(a.flags.nabi_awake, undefined);
  });
});

describe('climb (오르내리기) · 높이 elev', () => {
  /** 0~5 열은 높이 0, 7~10 열은 높이 1 (6 열은 낭떠러지) */
  const elev = Array.from({ length: 8 }, () => '000000011111');
  const rope: Thing = { kind: 'climb', id: 'rope', at: [5, 3], to: [7, 3], who: 'ruru' };

  test('같은 높이 칸끼리만 걷는다: 높이 1 칸은 막힌 칸처럼', () => {
    const cells: [number, number, string][] = [[6, 3, 'w']];
    const a = new Adv(data([], { elev }, cells));
    finish(a);
    a.place(px(5), px(3));
    idle(a, 2, walk(1, 0));
    assert.ok(a.stage.actors.toby.x > 6 * TILE && a.stage.actors.toby.x < 7 * TILE, `높이 0 인 6 열까지는 가고, 높이 1 로는 못 넘어감 ${a.stage.actors.toby.x}`);
    assert.equal(a.solid(7, 3), true);
    assert.equal(a.solid(4, 3), false);
  });

  test('루루가 없으면 못 오르고, 있으면 at ↔ to 로 (동료도 함께 · 높이 표시 · 밧줄 소리)', () => {
    const a = new Adv(data([rope], { elev }));
    finish(a);
    const lines = useAt(a, 4, 3, 'right');
    assert.ok(lines.length > 0);
    assert.deepEqual([a.stage.actors.toby.x, a.stage.actors.toby.y], [px(4), px(3)]);
    withParty(a, ['toby', 'bori', 'ruru']);
    a.place(px(4), px(3));
    a.face('right');
    a.step(1 / 60, NO_INPUT);
    assert.equal(a.prompt?.id, 'rope');
    a.stage.sfx.length = 0;
    press(a);
    const sfx: string[] = [...a.stage.sfx];
    for (let i = 0; i < 3600 && a.runner; i++) {
      sfx.push(...a.stage.sfx);
      a.step(1 / 60, { ...NO_INPUT, act: i % 2 === 0 });
    }
    assert.ok(sfx.includes('rope'));
    const t = a.stage.actors.toby;
    assert.deepEqual([t.x, t.y], [px(7), px(3)]);
    assert.equal(t.elev, 1);
    for (const h of ['bori', 'ruru']) {
      assert.equal(a.stage.actors[h].elev, 1, h);
      assert.ok(Math.hypot(a.stage.actors[h].x - t.x, a.stage.actors[h].y - t.y) < TILE, `${h} 도 위로`);
    }
    // 위에서는 높이 1 칸을 걷고, 높이 0 칸으로는 못 내려간다
    assert.equal(a.solid(8, 3), false);
    assert.equal(a.solid(5, 3), true);
    idle(a, 1, walk(1, 0));
    assert.ok(a.stage.actors.toby.x > px(7) + 10);
    // 다시 to 쪽에서 살펴보면 at 으로 내려온다
    useAt(a, 8, 3, 'left');
    assert.deepEqual([a.stage.actors.toby.x, a.stage.actors.toby.y], [px(5), px(3)]);
    assert.equal(a.stage.actors.toby.elev, 0);
  });

  test('who 가 없으면 (any) 혼자서도 오른다', () => {
    const a = new Adv(data([{ kind: 'climb', id: 'tape', at: [3, 3], to: [8, 3] }], { elev }, [], ['toby']));
    finish(a);
    useAt(a, 2, 3, 'right');
    assert.deepEqual([a.stage.actors.toby.x, a.stage.actors.toby.y], [px(8), px(3)]);
  });

  test('when 깃발이 없으면 오를 곳이 보이지 않는다', () => {
    const a = new Adv(data([{ kind: 'climb', id: 'c', at: [3, 3], to: [8, 3], when: 'hooked' }], { elev }));
    finish(a);
    assert.ok(!a.things().some((t) => t.id === 'c'));
    a.flags.hooked = true;
    assert.ok(a.things().some((t) => t.id === 'c'));
  });
});

describe("가구 밑 'U': 장난감은 지나가고 사람은 막힌다", () => {
  const cells: [number, number, string][] = [[3, 3, 'U'], [4, 3, 'U']];

  test('토비 (장난감) 는 U 칸을 지나간다', () => {
    const a = new Adv(data([], {}, cells));
    finish(a);
    assert.equal(a.solid(3, 3), false);
    a.place(px(2), px(3));
    idle(a, 1, walk(1, 0));
    assert.ok(a.stage.actors.toby.x > px(4), `${a.stage.actors.toby.x}`);
  });

  test('사람 (기억 속 하루) 을 조종하면 U 칸은 막힘', () => {
    const a = new Adv(data([{ kind: 'spot', id: 'go', at: [2, 3], scene: [{ t: 'show', who: 'haru', kind: 'haru7', at: [2, 3] }, { t: 'control', who: 'haru' }] }], {}, cells));
    finish(a);
    press(a);
    finish(a);
    assert.equal(a.player, 'haru');
    assert.equal(a.solid(3, 3), true);
    idle(a, 1, walk(1, 0));
    assert.ok(a.stage.actors.haru.x < 3 * TILE, `${a.stage.actors.haru.x}`);
  });

  test('밀 물건은 U 칸으로 밀려 들어가지 않는다', () => {
    const a = new Adv(data([{ kind: 'push', id: 'p', at: [2, 3], look: 'box' }], {}, cells));
    finish(a);
    useAt(a, 1, 3, 'right');
    assert.deepEqual(a.blockAt('p'), [2, 3]);
  });
});

describe('seq (발판 순서 퍼즐)', () => {
  const keys = [
    { at: [2, 2] as const, look: 'num', label: '3' },
    { at: [3, 2] as const, look: 'num', label: '1' },
    { at: [4, 2] as const, look: 'num', label: '7' },
  ];
  const code: Thing = { kind: 'seq', id: 'code', keys, order: [1, 0, 2], flag: 'code_ok', wrong: [say('ruru', '꿀?')] };
  const stepOn = (a: Adv, x: number, y: number) => {
    a.place(px(x), px(y));
    a.step(1 / 60, NO_INPUT);
  };

  test('순서대로 밟으면 깃발 (밟은 발판은 seqState 로)', () => {
    const a = new Adv(data([code]));
    finish(a);
    assert.deepEqual(a.seqState('code'), { pressed: [], total: 3, done: false });
    stepOn(a, 3, 2);
    assert.deepEqual(a.seqState('code')?.pressed, [1]);
    stepOn(a, 3, 4);
    stepOn(a, 2, 2);
    assert.deepEqual(a.seqState('code')?.pressed, [1, 0]);
    stepOn(a, 3, 4);
    stepOn(a, 4, 2);
    finish(a);
    assert.equal(a.flags.code_ok, true);
    assert.deepEqual(a.seqState('code'), { pressed: [1, 0, 2], total: 3, done: true });
  });

  test('같은 발판에 서 있는 동안은 한 번만 센다 (서 있다 다음 발판으로 가도 틀리지 않음)', () => {
    const a = new Adv(data([code]));
    finish(a);
    stepOn(a, 3, 2);
    idle(a, 0.5);
    stepOn(a, 3, 2);
    assert.deepEqual(a.seqState('code')?.pressed, [1]);
    // 발판에서 발판으로 곧장 걸어간다 (3,2) → (2,2)
    idle(a, 0.6, walk(-1, 0));
    assert.deepEqual(a.seqState('code')?.pressed, [1, 0]);
    assert.equal(a.runner, null, '틀린 대본이 돌지 않았다');
  });

  test('틀리면 처음부터 + wrong 대본, 그 뒤 다시 맞게 밟으면 깃발', () => {
    const a = new Adv(data([code]));
    finish(a);
    stepOn(a, 3, 2);
    stepOn(a, 3, 4);
    stepOn(a, 4, 2);
    const lines = finish(a);
    assert.deepEqual(lines, ['꿀?']);
    assert.deepEqual(a.seqState('code')?.pressed, []);
    assert.equal(a.flags.code_ok, undefined);
    for (const [x, y] of [[3, 2], [3, 4], [2, 2], [3, 4], [4, 2]] as const) stepOn(a, x, y);
    finish(a);
    assert.equal(a.flags.code_ok, true);
  });

  test('없는 퍼즐 id 는 null', () => {
    const a = new Adv(data([code]));
    assert.equal(a.seqState('nope'), null);
  });
});

describe('chase (쫓아가기)', () => {
  const tag: Thing = { kind: 'chase', id: 'tag', actor: 'ruru', path: [[3, 2], [5, 5], [2, 5]], laps: 3, flag: 'ruru_caught', scene: [say('ruru', '헤헤, 잡혔다!')] };

  test('도망치는 인물이 첫 점에 서 있다', () => {
    const a = new Adv(data([tag]));
    finish(a);
    const r = a.stage.actors.tag;
    assert.ok(r);
    assert.equal(r.kind, 'ruru');
    assert.deepEqual([r.x, r.y], [px(3), px(2)]);
    assert.deepEqual(a.chaseState('tag'), { caught: 0, laps: 3, done: false, running: false });
  });

  test('멀면 그대로, near 칸 안으로 들어가면 「잡았다」 → 다음 점으로 (토비보다 빠르게)', () => {
    const a = new Adv(data([tag]));
    finish(a);
    a.place(px(3), px(4.5));
    a.step(1 / 60, NO_INPUT);
    assert.equal(a.chaseState('tag')?.caught, 0, '2.5칸은 멀다');
    a.place(px(3), px(3.1));
    a.step(1 / 60, NO_INPUT);
    assert.equal(a.chaseState('tag')?.caught, 1);
    assert.equal(a.chaseState('tag')?.running, true);
    const r = a.stage.actors.tag;
    assert.ok(r.goal && r.goal.speed > 92, `${r.goal?.speed}`);
    idle(a, 3);
    assert.deepEqual([r.x, r.y], [px(5), px(5)]);
    assert.equal(a.chaseState('tag')?.running, false);
  });

  test('laps 번 따라잡으면 깃발 + 장면', () => {
    const a = new Adv(data([tag]));
    finish(a);
    let lines: string[] = [];
    for (const [x, y] of [[3, 2], [5, 5], [2, 5]] as const) {
      idle(a, 3);
      a.place(px(x) - 10, px(y));
      a.step(1 / 60, NO_INPUT);
      lines = finish(a);
    }
    assert.equal(a.chaseState('tag')?.caught, 3);
    assert.equal(a.chaseState('tag')?.done, true);
    assert.equal(a.flags.ruru_caught, true);
    assert.ok(lines.includes('헤헤, 잡혔다!'), lines.join('/'));
  });

  test('다 잡은 뒤 방에 다시 들어와도 도망치는 인물은 나타나지 않는다', () => {
    const a = new Adv(data([tag]));
    finish(a);
    a.flags.ruru_caught = true;
    a.goRoom('r1', [2, 3]);
    assert.equal(a.stage.actors.tag, undefined);
    assert.equal(a.chaseState('tag')?.done, true);
  });
});
