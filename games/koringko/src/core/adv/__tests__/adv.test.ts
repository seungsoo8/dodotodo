import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Adv, NO_INPUT, type AdvData, type AdvInput } from '../adv.ts';
import { Builder, TILE } from '../../maps.ts';
import { px } from '../stage.ts';
import type { Cmd, Facing, RoomDef, Thing } from '../types.ts';

/** 시험용 방: 12×8, 가장자리 블록 벽, (6,1)~(6,6) 은 낭떠러지 줄 (가운데 (6,3)(6,4) 만 다리 자리) */
function testRoom(id: string, things: Thing[], extra: Partial<RoomDef> = {}): RoomDef {
  const b = new Builder(12, 8, 'w', 1);
  b.rect(0, 0, 12, 1, 'Q');
  b.rect(0, 7, 12, 1, 'Q');
  b.rect(0, 0, 1, 8, 'Q');
  b.rect(11, 0, 1, 8, 'Q');
  b.rect(6, 1, 1, 6, 'v');
  return { id, name: id, theme: 'toybox', w: 12, h: 8, tiles: b.rows(), structures: [], warps: [], npcs: [], spawns: [], start: { x: 2, y: 3 }, safe: true, dark: false, level: '', scale: 'toy', things, ...extra };
}

const say = (text: string): Cmd => ({ t: 'say', who: 'toby', text });

function data(things: Thing[], extra: Partial<RoomDef> = {}): AdvData {
  return {
    rooms: {
      r1: () => testRoom('r1', things, extra),
      r2: () => testRoom('r2', []),
      mem: () => ({ ...testRoom('mem', []), scale: 'human' }),
    },
    chapters: [
      { n: 1, title: '1장', sub: '', room: 'r1', start: [2, 3], party: ['toby', 'bori'], wind: 0.8, intro: [{ t: 'flag', name: 'intro1_ran' }] },
      { n: 2, title: '2장', sub: '', room: 'r2', start: [3, 3], party: ['toby', 'bori', 'ruru'], wind: 0.6, intro: [{ t: 'title', text: '2장', s: 1 }, { t: 'flag', name: 'intro2_ran' }] },
    ],
  };
}

const idle = (a: Adv, secs: number, inp: AdvInput = NO_INPUT) => {
  for (let t = 0; t < secs; t += 1 / 60) a.step(1 / 60, inp);
};
const press = (a: Adv) => a.step(1 / 60, { ...NO_INPUT, act: true });
/** 대본이 끝날 때까지 대사를 넘긴다 */
function finish(a: Adv, limit = 60): void {
  for (let i = 0; i < limit * 60 && (a.runner || a.mini); i++) a.step(1 / 60, { ...NO_INPUT, act: i % 2 === 0 });
}
const walk = (x: number, y: number): AdvInput => ({ ...NO_INPUT, move: { x, y } });

describe('어드벤처: 시작 · 걷기', () => {
  test('새로 시작하면 1장 방 · 시작 자리 · 동료 · 태엽, 그리고 들어오는 대본을 한 번만', () => {
    const a = new Adv(data([]));
    assert.equal(a.room.id, 'r1');
    const p = a.stage.actors.toby;
    assert.deepEqual([p.x, p.y], [px(2), px(3)]);
    assert.ok(a.stage.actors.bori, '동료도 무대에');
    assert.equal(a.save.wind, 0.8);
    finish(a);
    assert.equal(a.flags.intro1_ran, true);
  });

  test('막힌 칸으로는 못 간다 (벽 · 낭떠러지)', () => {
    const a = new Adv(data([]));
    finish(a);
    idle(a, 3, walk(-1, 0));
    assert.ok(a.stage.actors.toby.x >= TILE + 4, `왼쪽 벽 ${a.stage.actors.toby.x}`);
    idle(a, 4, walk(1, 0));
    assert.ok(a.stage.actors.toby.x <= 6 * TILE - 4, `낭떠러지 앞 ${a.stage.actors.toby.x}`);
  });

  test('불러 온 동료는 발자국을 따라 뒤에서 걷는다', () => {
    const a = new Adv(data([]));
    finish(a);
    a.call('bori', true);
    idle(a, 0.8, walk(1, 0));
    const t = a.stage.actors.toby;
    const b = a.stage.actors.bori;
    assert.ok(b.x < t.x - 10 && b.x > t.x - 40, `토비 ${t.x} 보리 ${b.x}`);
    assert.equal(b.dir, 'right');
    assert.equal(b.moving, true);
    idle(a, 1);
    assert.equal(a.stage.actors.bori.moving, false, '멈추면 같이 멈춘다');
  });
});

describe('어드벤처: 살펴보기 · 기억 조각 · 기억의 문', () => {
  const things: Thing[] = [
    { kind: 'spot', id: 'jar', at: [3, 3], scene: [say('종이별 병이다')] },
    { kind: 'memory', id: 'm1', at: [2, 5], name: '첫 기억', scene: [{ t: 'room', id: 'mem', at: [3, 3] }, { t: 'show', who: 'haru', kind: 'haru15', at: [4, 3] }, say('…')] },
    { kind: 'memory', id: 'm2', at: [4, 5], name: '둘째 기억', scene: [say('기억 둘')] },
    { kind: 'link', id: 'door', at: [5, 2], name: '종이별', icon: 'star', locked: [say('아직 기억이 모자라')], scene: [say('이어진다'), { t: 'chapter', n: 2 }] },
  ];

  test('가까운 것을 알려 주고, 누르면 그 대본이 돈다', () => {
    const a = new Adv(data(things));
    finish(a);
    assert.equal(a.prompt?.id, 'jar', '바로 옆 종이별 병');
    press(a);
    a.step(1 / 60, NO_INPUT);
    assert.equal(a.stage.dialog?.text, '종이별 병이다');
    finish(a);
    assert.equal(a.flags.seen_jar, true);
  });

  test('기억 조각: 기억 방에 다녀온 뒤 원래 자리로, 조각은 모은 것으로 · 앨범에 한 장', () => {
    const a = new Adv(data(things));
    finish(a);
    a.place(px(2), px(4));
    a.step(1 / 60, NO_INPUT);
    assert.equal(a.prompt?.id, 'm1');
    press(a);
    let sawMemory = false;
    for (let i = 0; i < 6000 && a.runner; i++) {
      if (a.room.id === 'mem' && a.stage.tone === 'memory') sawMemory = true;
      a.step(1 / 60, { ...NO_INPUT, act: i % 2 === 0 });
    }
    assert.ok(sawMemory, '기억 방을 세피아로 보여 준다');
    assert.equal(a.room.id, 'r1');
    assert.equal(a.stage.tone, 'now');
    assert.deepEqual([a.stage.actors.toby.x, a.stage.actors.toby.y], [px(2), px(4)]);
    assert.equal(a.stage.actors.haru, undefined, '기억 속 인물은 사라진다');
    assert.deepEqual(a.memories(), { got: 1, total: 2 });
    assert.deepEqual(a.save.album, ['m1']);
    assert.ok(!a.things().some((t) => t.id === 'm1'), '모은 조각은 방에서 사라진다');
  });

  test('기억의 문은 조각을 다 모아야 열리고, 열리면 다음 장 (방 · 동료 · 태엽 · 들어오는 대본)', () => {
    const a = new Adv(data(things));
    finish(a);
    a.place(px(5), px(3));
    a.face('up');
    a.step(1 / 60, NO_INPUT);
    assert.equal(a.prompt?.id, 'door');
    press(a);
    a.step(1 / 60, NO_INPUT);
    assert.equal(a.stage.dialog?.text, '아직 기억이 모자라');
    finish(a);
    assert.equal(a.save.chapter, 1);
    a.flags.mem_m1 = true;
    a.flags.mem_m2 = true;
    press(a);
    finish(a);
    assert.equal(a.save.chapter, 2);
    assert.equal(a.room.id, 'r2');
    assert.deepEqual(a.save.party, ['toby', 'bori', 'ruru']);
    assert.ok(a.stage.actors.ruru);
    assert.equal(a.save.wind, 0.6);
    assert.equal(a.flags.intro2_ran, true);
  });
});

describe('어드벤처: 동료 능력 퍼즐', () => {
  test('보리가 있어야 덩어리를 민다: 바라보는 쪽으로 막힐 때까지 미끄러지고, 벽 · 낭떠러지 · 놓인 물건 앞에서 멈춘다', () => {
    const things: Thing[] = [
      { kind: 'block', id: 'c1', at: [3, 3], look: 'cookie' },
      { kind: 'block', id: 'c2', at: [3, 5], look: 'cookie' },
      { kind: 'star', id: 'st', at: [5, 5], text: '별' },
    ];
    const a = new Adv(data(things));
    finish(a);
    a.save.party = ['toby'];
    a.syncParty();
    a.place(px(2), px(3));
    a.face('right');
    a.step(1 / 60, NO_INPUT);
    assert.equal(a.prompt?.id, 'c1');
    press(a);
    finish(a);
    assert.deepEqual(a.blockAt('c1'), [3, 3], '혼자서는 꿈쩍도 안 한다');
    a.save.party = ['toby', 'bori'];
    a.syncParty();
    a.call('bori', true);
    press(a);
    finish(a);
    assert.deepEqual(a.blockAt('c1'), [5, 3], '(6,3) 낭떠러지 앞까지 미끄러진다');
    // 덩어리는 막힌 칸: 못 지나간다
    a.place(px(2), px(3));
    idle(a, 2, walk(1, 0));
    assert.ok(a.stage.actors.toby.x < 5 * TILE, `${a.stage.actors.toby.x}`);
    a.place(px(4), px(3));
    a.face('right');
    press(a);
    finish(a);
    assert.deepEqual(a.blockAt('c1'), [5, 3], '낭떠러지로는 안 밀린다');
    // 놓인 물건(종이별) 앞에서 멈춘다
    a.place(px(2), px(5));
    a.face('right');
    a.step(1 / 60, NO_INPUT);
    press(a);
    finish(a);
    assert.deepEqual(a.blockAt('c2'), [4, 5]);
  });

  test('루루가 있어야 밧줄 다리: 다리가 놓이면 낭떠러지를 건넌다', () => {
    const things: Thing[] = [{ kind: 'gap', id: 'g1', at: [5, 3], tiles: [[6, 3]] }];
    const a = new Adv(data(things));
    finish(a);
    a.place(px(5), px(3));
    a.face('right');
    a.step(1 / 60, NO_INPUT);
    assert.equal(a.prompt?.id, 'g1');
    press(a);
    finish(a);
    assert.equal(a.flags.gap_g1, undefined, '루루가 없으면 못 건다');
    a.save.party = ['toby', 'ruru'];
    a.syncParty();
    a.call('ruru', true);
    press(a);
    finish(a);
    assert.equal(a.flags.gap_g1, true);
    idle(a, 2, walk(1, 0));
    assert.ok(a.stage.actors.toby.x > 7 * TILE, `건넜다 ${a.stage.actors.toby.x}`);
  });

  test('나비 불빛이 있어야 어둠 속 조각 · 종이별이 보인다', () => {
    const things: Thing[] = [
      { kind: 'memory', id: 'md', at: [3, 3], name: '어둠 속', scene: [], dark: true },
      { kind: 'star', id: 's1', at: [2, 5], text: '종이별', dark: true },
    ];
    const a = new Adv(data(things));
    finish(a);
    assert.deepEqual(a.things().map((t) => t.id), []);
    assert.ok(!['md', 's1'].includes(a.prompt?.id ?? ''), '어둠 속 것은 알림도 없다');
    a.save.party = ['toby', 'nabi'];
    a.syncParty();
    a.call('nabi', true);
    assert.deepEqual(a.things().map((t) => t.id).sort(), ['md', 's1']);
  });
});

describe('어드벤처: 얼음 땡 (발소리)', () => {
  const steps = { calm: [2, 2] as const, warn: 1, hold: 2, caught: [[say('들킬 뻔했다')]] };

  test('발소리 → 멈춤. 멈춤 동안 움직이면 들켜서 마지막 숨은 자리로 (체력 없음)', () => {
    const a = new Adv(data([], { steps }));
    finish(a);
    a.place(px(2), px(3));
    idle(a, 2.05);
    assert.equal(a.steps.phase, 'warn');
    idle(a, 1);
    assert.equal(a.steps.phase, 'hold');
    // 버티면 그 자리가 숨은 자리
    idle(a, 2.05);
    assert.equal(a.steps.phase, 'calm');
    assert.deepEqual(a.checkpoint, { x: px(2), y: px(3) });
    // 조용할 때 걸어갔다가, 멈춤에 움직이면
    idle(a, 1, walk(0, 1));
    assert.ok(a.stage.actors.toby.y > px(3) + 40);
    idle(a, 2);
    assert.equal(a.steps.phase, 'hold');
    a.step(1 / 60, walk(1, 0));
    assert.ok(a.runner, '들킨 장면');
    finish(a);
    assert.deepEqual([a.stage.actors.toby.x, a.stage.actors.toby.y], [px(2), px(3)]);
    assert.equal(a.steps.caught, 1);
    assert.equal(a.steps.phase, 'calm');
  });

  test('경고 동안에는 움직여도 괜찮다 (숨을 곳으로 갈 시간)', () => {
    const a = new Adv(data([], { steps }));
    finish(a);
    idle(a, 2.05);
    idle(a, 0.5, walk(1, 0));
    assert.equal(a.runner, null);
    assert.equal(a.steps.caught, 0);
  });

  test('대본이 도는 동안에는 발소리가 쉰다', () => {
    const a = new Adv(data([{ kind: 'spot', id: 'x', at: [2, 3], scene: [{ t: 'wait', s: 5 }] }], { steps }));
    finish(a);
    press(a);
    idle(a, 4);
    assert.equal(a.steps.phase, 'calm');
  });
});

describe('어드벤처: 밟으면 · 고르기 · 기억 속 조종', () => {
  test('밟으면 도는 대본은 한 번만 (repeat 아니면)', () => {
    const a = new Adv(data([{ kind: 'trigger', id: 't1', rect: [4, 1, 1, 6], scene: [{ t: 'flag', name: 'hit' }, { t: 'wait', s: 0.1 }] }]));
    finish(a);
    idle(a, 1.5, walk(1, 0));
    assert.equal(a.flags.hit, true);
    a.flags.hit = false;
    a.place(px(2), px(3));
    finish(a);
    idle(a, 1.5, walk(1, 0));
    assert.equal(a.flags.hit, false);
  });

  test('고르기: 위아래로 고르고 눌러서 정한다', () => {
    const a = new Adv(data([{ kind: 'spot', id: 'q', at: [2, 3], scene: [{ t: 'choice', flag: 'ans', options: ['하나', '둘', '셋'] }] }]));
    finish(a);
    press(a);
    a.step(1 / 60, NO_INPUT);
    assert.ok(a.stage.choice);
    a.step(1 / 60, { ...NO_INPUT, dir: 'down' });
    a.step(1 / 60, { ...NO_INPUT, dir: 'down' });
    a.step(1 / 60, { ...NO_INPUT, dir: 'down' });
    assert.equal(a.stage.choice!.sel, 2, '끝에서 멈춘다');
    a.step(1 / 60, { ...NO_INPUT, dir: 'up' });
    press(a);
    a.step(1 / 60, NO_INPUT);
    assert.equal(a.flags.ans_1, true);
  });

  test('기억 속에서 어린 하루를 조종하면 동료는 무대에서 빠지고, 하루가 걷는다', () => {
    const a = new Adv(data([{ kind: 'spot', id: 'go', at: [2, 3], scene: [{ t: 'room', id: 'mem', at: [3, 3] }, { t: 'show', who: 'haru', kind: 'haru5', at: [3, 3] }, { t: 'control', who: 'haru' }] }]));
    finish(a);
    press(a);
    finish(a);
    assert.equal(a.player, 'haru');
    assert.equal(a.stage.actors.bori, undefined);
    const x0 = a.stage.actors.haru.x;
    idle(a, 0.5, walk(1, 0));
    assert.ok(a.stage.actors.haru.x > x0 + 20);
  });
});

describe('어드벤처: 저장', () => {
  test('저장했다가 불러오면 장 · 방 · 자리 · 동료 · 깃발 · 앨범 · 덩어리 자리가 그대로', () => {
    const things: Thing[] = [{ kind: 'block', id: 'c1', at: [3, 3], look: 'box' }];
    const a = new Adv(data(things));
    finish(a);
    a.call('bori', true);
    a.place(px(2), px(3));
    a.face('right');
    press(a);
    finish(a);
    a.place(px(2), px(5));
    a.flags.mem_x = true;
    a.save.album.push('x');
    const json = JSON.stringify(a.snapshot());
    const b = new Adv(data(things), JSON.parse(json));
    assert.equal(b.runner, null, '불러오면 들어오는 대본을 다시 보지 않는다');
    assert.equal(b.room.id, 'r1');
    assert.deepEqual([b.stage.actors.toby.x, b.stage.actors.toby.y], [px(2), px(5)]);
    assert.deepEqual(b.blockAt('c1'), [5, 3]);
    assert.equal(b.flags.mem_x, true);
    assert.deepEqual(b.save.album, ['x']);
    assert.ok(b.stage.actors.bori);
  });

  /** 같은 이야기에 장 하나를 맨 앞에 끼워 넣은 판 (번호가 하나씩 밀린다) */
  function withPrologue(): AdvData {
    const d = data([]);
    return {
      rooms: { ...d.rooms, r0: () => testRoom('r0', []) },
      chapters: [{ n: 1, title: '새 장', sub: '', room: 'r0', start: [2, 3], party: ['toby'], wind: 1, intro: [] }, ...d.chapters.map((c) => ({ ...c, n: c.n + 1 }))],
    };
  }

  test('장을 앞에 끼워 넣어도, 저장한 장에서 이어진다 (번호가 아니라 장의 방으로 기억)', () => {
    const a = new Adv(data([]));
    finish(a);
    (a as unknown as { applyChapter(n: number): void }).applyChapter(2);
    finish(a);
    assert.equal(a.chapterTitle().text, '2장');
    const saved = JSON.parse(JSON.stringify(a.snapshot()));
    const b = new Adv(withPrologue(), saved);
    assert.equal(b.room.id, 'r2');
    assert.equal(b.save.chapter, 3, '밀린 번호로 바뀐다');
    assert.equal(b.chapterTitle().text, '2장');
  });

  test('장 표시가 없는 옛 저장은 지금 있는 방으로 장을 찾는다', () => {
    const old = { v: 1, chapter: 2, room: 'r2', x: px(3), y: px(3), party: ['toby', 'bori', 'ruru'], flags: { intro2_ran: true }, album: [], wind: 0.6, blocks: {}, time: 12 };
    const b = new Adv(withPrologue(), old as never);
    assert.equal(b.save.chapter, 3);
    assert.equal(b.chapterTitle().text, '2장');
    assert.equal(b.flags.intro2_ran, true);
  });

  test('장의 방이 없어진 저장은 처음부터', () => {
    const lost = { v: 1, chapter: 2, ch: 'gone', room: 'gone', x: px(3), y: px(3), party: ['toby'], flags: {}, album: [], wind: 0.6, blocks: {}, time: 0 };
    const b = new Adv(withPrologue(), lost as never);
    assert.equal(b.save.chapter, 1);
    assert.equal(b.room.id, 'r0');
  });

  test('저장 내용이 망가졌으면 처음부터', () => {
    const b = new Adv(data([]), { v: 99 } as never);
    assert.equal(b.save.chapter, 1);
    assert.equal(b.room.id, 'r1');
  });
});

describe('어드벤처: 기억 뒤 대화 · 잠든 동료 깨우기', () => {
  test('기억에서 돌아오면 동료들이 이어서 이야기한다 (원래 방에서)', () => {
    const things: Thing[] = [{ kind: 'memory', id: 'm1', at: [2, 4], name: '기억', scene: [{ t: 'room', id: 'mem' }, say('그날')], after: [{ t: 'flag', name: 'talked_after' }, say('하루가 미안하대')] }];
    const a = new Adv(data(things));
    finish(a);
    a.place(px(2), px(3));
    a.step(1 / 60, NO_INPUT);
    press(a);
    let roomWhenTalk = '';
    for (let i = 0; i < 6000 && a.runner; i++) {
      if (a.stage.dialog?.text === '하루가 미안하대') roomWhenTalk = a.room.id;
      a.step(1 / 60, { ...NO_INPUT, act: i % 2 === 0 });
    }
    assert.equal(roomWhenTalk, 'r1');
    assert.equal(a.flags.talked_after, true);
    assert.equal(a.flags.mem_m1, true);
  });

  test('잠든 동료(인물)를 깨워 줄에 넣으면 그 자리에서 일어나 따라온다', () => {
    const things: Thing[] = [{ kind: 'npc', id: 'ruru_sleep', at: [4, 3], actor: 'ruru', pose: 'sleep', unless: 'woke_ruru', scene: [{ t: 'flag', name: 'woke_ruru' }, { t: 'join', who: 'ruru' }] }];
    const a = new Adv(data(things));
    finish(a);
    assert.equal(a.stage.actors.ruru_sleep.pose, 'sleep');
    a.place(px(3), px(3));
    a.face('right');
    a.step(1 / 60, NO_INPUT);
    assert.equal(a.prompt?.id, 'ruru_sleep');
    press(a);
    finish(a);
    assert.ok(a.save.party.includes('ruru'));
    assert.equal(a.stage.actors.ruru_sleep, undefined);
    assert.equal(a.stage.actors.ruru.x, px(4), '깨운 자리에서');
    a.step(1 / 60, NO_INPUT);
    assert.equal(a.stage.actors.ruru_sleep, undefined, '다시 나타나지 않는다');
  });
});

describe('어드벤처: 기억 속 직접 움직이기', () => {
  const things: Thing[] = [
    {
      kind: 'memory',
      id: 'm9',
      at: [2, 4],
      name: '찾기',
      scene: [{ t: 'room', id: 'mem2', at: [3, 3] }, { t: 'show', who: 'haru', kind: 'haru5', at: [3, 3] }, say('토비를 찾자'), { t: 'control', who: 'haru' }, { t: 'goal', text: '토비를 찾자' }],
      after: [say('찾았구나')],
    },
  ];
  const d = (): AdvData => ({ ...data(things), rooms: { ...data(things).rooms, mem2: () => ({ ...testRoom('mem2', [{ kind: 'spot', id: 'found', at: [5, 3], scene: [say('토비다!'), { t: 'flag', name: 'm9_end' }] }]), scale: 'human' }) } });

  test('@control 에서 장면이 멈추고 하루를 움직인다. 목표를 찾아 끝 깃발이 서면 마무리하고 원래 방으로', () => {
    const a = new Adv(d());
    finish(a);
    a.place(px(2), px(3));
    a.face('down');
    a.step(1 / 60, NO_INPUT);
    press(a);
    finish(a);
    assert.equal(a.room.id, 'mem2');
    assert.equal(a.player, 'haru');
    assert.equal(a.runner, null, '조종 중에는 대본이 없다');
    assert.equal(a.flags.mem_m9, undefined, '아직 끝나지 않았다');
    assert.equal(a.canSave(), false, '기억 속에서는 저장하지 않는다');
    idle(a, 0.6, walk(1, 0));
    a.face('right');
    a.step(1 / 60, NO_INPUT);
    assert.equal(a.prompt?.id, 'found');
    press(a);
    let back = false;
    for (let i = 0; i < 6000 && (a.runner || a.resume); i++) {
      if (a.stage.dialog?.text === '찾았구나') back = (a.room.id as string) === 'r1';
      a.step(1 / 60, { ...NO_INPUT, act: i % 2 === 0 });
    }
    assert.equal(a.room.id, 'r1');
    assert.equal(a.flags.mem_m9, true);
    assert.equal(back, true, '동료들의 말은 원래 방에서');
    assert.equal(a.player, 'toby');
  });
});

describe('어드벤처: 기억에서 돌아오면', () => {
  test('할 일 글이 그대로 돌아온다', () => {
    const a = new Adv(data([{ kind: 'memory', id: 'mg', at: [2, 4], name: '기억', scene: [{ t: 'room', id: 'mem' }, { t: 'goal', text: '기억 속 할 일' }, say('…')] }]));
    finish(a);
    a.stage.goal = '기억 조각을 찾자';
    a.place(px(2), px(3));
    a.step(1 / 60, NO_INPUT);
    press(a);
    finish(a);
    assert.equal(a.room.id, 'r1');
    assert.equal(a.stage.goal, '기억 조각을 찾자');
  });
});

describe('어드벤처: 방에 들어오면', () => {
  test('동료들은 한 칸에 겹치지 않고 토비 뒤로 줄을 선다 (막힌 칸은 피해서)', () => {
    const a = new Adv(data([]));
    finish(a);
    a.save.party = ['toby', 'bori', 'ruru', 'nabi'];
    a.goRoom('r1', [2, 3]);
    const pos = ['toby', 'bori', 'ruru', 'nabi'].map((h) => `${Math.round(a.stage.actors[h].x)},${Math.round(a.stage.actors[h].y)}`);
    assert.equal(new Set(pos).size, 4, pos.join(' '));
    for (const h of ['bori', 'ruru', 'nabi']) {
      const q = a.stage.actors[h];
      assert.ok(!a.solid(Math.floor(q.x / TILE), Math.floor(q.y / TILE)), h);
    }
  });
});

describe('어드벤처: 장 차례', () => {
  test('@next 는 목록의 다음 장으로, @chtitle 은 그 장의 제목 · 부제를 카드로 띄운다', () => {
    const d = data([{ kind: 'spot', id: 'go', at: [2, 3], scene: [{ t: 'next' }] }]);
    d.chapters[1].intro = [{ t: 'chtitle' }, { t: 'flag', name: 'titled' }];
    d.chapters[1].sub = '부제';
    const a = new Adv(d);
    finish(a);
    press(a);
    for (let i = 0; i < 20; i++) a.step(1 / 60, NO_INPUT);
    assert.equal(a.save.chapter, 2);
    assert.deepEqual([a.stage.title?.text, a.stage.title?.sub], ['2장', '부제']);
    finish(a);
    assert.equal(a.flags.titled, true);
  });
});

describe('어드벤처: 의자에 앉기', () => {
  /** 사람 크기 부엌: (6,4) 의자 · (7,4)~(8,5) 식탁 · (9,4) 의자 */
  function kitchen(): AdvData {
    const d = data([]);
    const room: RoomDef = { ...testRoom('kitchen', []), scale: 'human', furniture: [{ kind: 'chair', x: 6, y: 4, w: 1, h: 1 }, { kind: 'table:cloth', x: 7, y: 4, w: 2, h: 2 }, { kind: 'chair', x: 9, y: 4, w: 1, h: 1 }] };
    return { ...d, rooms: { ...d.rooms, kitchen: () => room } };
  }
  const scene = (cmds: Cmd[]): Thing[] => [{ kind: 'spot', id: 's', at: [2, 3], scene: [{ t: 'room', id: 'kitchen', at: [2, 6] }, ...cmds, { t: 'wait', s: 0.2 }] }];

  function play(cmds: Cmd[]): Adv {
    const d = kitchen();
    const a = new Adv({ ...d, rooms: { ...d.rooms, r1: () => testRoom('r1', scene(cmds)) } });
    finish(a);
    a.place(px(2), px(4));
    a.face('up');
    press(a);
    for (let i = 0; i < 6; i++) a.step(1 / 60, NO_INPUT);
    return a;
  }

  test('앉는 자세가 되면 가까운 의자로 옮겨 앉고, 식탁 쪽을 본다', () => {
    const a = play([{ t: 'show', who: 'haru', kind: 'haru7', at: [6, 5], pose: 'sit' }, { t: 'show', who: 'gm', kind: 'grandma', at: [10, 4] }, { t: 'pose', who: 'gm', pose: 'sit' }]);
    const h = a.stage.actors.haru;
    assert.deepEqual([h.x, h.y], [px(6), px(4)]);
    assert.equal(h.dir, 'right');
    assert.equal(h.seat, true);
    const g = a.stage.actors.gm;
    assert.deepEqual([g.x, g.y], [px(9), px(4)]);
    assert.equal(g.dir, 'left');
  });

  test('의자가 멀면 그 자리에 그냥 앉고 (바닥), 일어서면 의자에서 내려온다', () => {
    const a = play([{ t: 'show', who: 'haru', kind: 'haru7', at: [3, 6], pose: 'sit' }]);
    const h = a.stage.actors.haru;
    assert.deepEqual([h.x, h.y], [px(3), px(6)]);
    assert.ok(!h.seat);
    const b = play([{ t: 'show', who: 'haru', kind: 'haru7', at: [6, 5], pose: 'sit' }, { t: 'pose', who: 'haru', pose: 'idle' }]);
    assert.ok(!b.stage.actors.haru.seat);
  });

  test('앉아 있다가 걸어가면 일어서서 걷는다', () => {
    const a = play([{ t: 'show', who: 'haru', kind: 'haru7', at: [6, 5], pose: 'sit' }, { t: 'walk', who: 'haru', to: [3, 6] }]);
    const h = a.stage.actors.haru;
    assert.ok(!h.seat);
    assert.equal(h.pose, 'idle');
  });

  test('한 의자에는 한 사람만', () => {
    const a = play([{ t: 'show', who: 'haru', kind: 'haru7', at: [6, 5], pose: 'sit' }, { t: 'show', who: 'mom', kind: 'mom', at: [6, 3], pose: 'sit' }]);
    assert.deepEqual([a.stage.actors.haru.x, a.stage.actors.haru.y], [px(6), px(4)]);
    assert.ok(!a.stage.actors.mom.seat, '다음 의자는 멀어서 바닥에');
  });
});

describe('어드벤처: 바깥 자리에 앉기 (벤치 · 그네)', () => {
  /** 사람 크기 놀이터: (2,4)~(3,4) 두 칸 벤치 · (7,3)~(10,3) 그네 틀 (앉는 판은 (8,3) · (9,3)) */
  function park(cmds: Cmd[]): Adv {
    const d = data([]);
    const room: RoomDef = { ...testRoom('park', []), scale: 'human', furniture: [{ kind: 'bench', x: 2, y: 4, w: 2, h: 1 }, { kind: 'swingset', x: 7, y: 3, w: 4, h: 1 }] };
    const scene: Thing[] = [{ kind: 'spot', id: 's', at: [2, 3], scene: [{ t: 'room', id: 'park', at: [5, 6] }, ...cmds, { t: 'wait', s: 0.2 }] }];
    const a = new Adv({ ...d, rooms: { ...d.rooms, park: () => room, r1: () => testRoom('r1', scene) } });
    finish(a);
    a.place(px(2), px(4));
    a.face('up');
    press(a);
    for (let i = 0; i < 6; i++) a.step(1 / 60, NO_INPUT);
    return a;
  }
  const at = (a: Adv, id: string) => [a.stage.actors[id].x, a.stage.actors[id].y];

  test('두 칸 벤치에는 두 사람이 나란히 앉는다 (왼쪽 칸 · 오른쪽 칸)', () => {
    const a = park([
      { t: 'show', who: 'haru', kind: 'haru7', at: [2, 5], pose: 'sit' },
      { t: 'show', who: 'gm', kind: 'grandma', at: [2, 5], pose: 'sit' },
    ]);
    assert.deepEqual(at(a, 'haru'), [px(2), px(4)]);
    assert.deepEqual(at(a, 'gm'), [px(3), px(4)]);
    assert.equal(a.stage.actors.haru.seat, true);
    assert.equal(a.stage.actors.gm.seat, true);
  });

  test('세 번째 사람은 벤치가 차서 바닥에 앉는다', () => {
    const a = park([
      { t: 'show', who: 'haru', kind: 'haru7', at: [2, 5], pose: 'sit' },
      { t: 'show', who: 'gm', kind: 'grandma', at: [3, 5], pose: 'sit' },
      { t: 'show', who: 'mom', kind: 'mom', at: [3, 5], pose: 'sit' },
    ]);
    assert.ok(!a.stage.actors.mom.seat);
    assert.deepEqual(at(a, 'mom'), [px(3), px(5)]);
  });

  test('그네 앞에서 앉으면 그네 판(양 끝 기둥이 아닌 가운데 두 칸)에 앉는다', () => {
    const a = park([
      { t: 'show', who: 'haru', kind: 'haru7', at: [8, 4], pose: 'sit' },
      { t: 'show', who: 'jiwoo', kind: 'jiwoo10', at: [10, 4], pose: 'sit' },
    ]);
    assert.deepEqual(at(a, 'haru'), [px(8), px(3)]);
    assert.deepEqual(at(a, 'jiwoo'), [px(9), px(3)]);
    assert.equal(a.stage.actors.jiwoo.seat, true);
  });
});

describe('어드벤처: 움직이는 물건 (문 · 텔레비전 · 불)', () => {
  /** 사람 크기 방: (1,1)~(1,2) 문 · (10,3) 텔레비전 */
  function house(cmds: Cmd[]): Adv {
    const d = data([]);
    const room: RoomDef = { ...testRoom('home', []), scale: 'human', furniture: [{ kind: 'door', x: 1, y: 1, w: 1, h: 2 }, { kind: 'tv', x: 9, y: 3, w: 2, h: 1 }] };
    const spot: Thing[] = [{ kind: 'spot', id: 's', at: [2, 3], scene: [{ t: 'room', id: 'home', at: [5, 6] }, ...cmds, { t: 'wait', s: 5 }] }];
    const a = new Adv({ ...d, rooms: { ...d.rooms, home: () => room, r1: () => testRoom('r1', spot) } });
    finish(a);
    a.place(px(2), px(4));
    a.face('up');
    press(a);
    return a;
  }
  const doorOpen = (a: Adv) => a.stage.props['door@1,1']?.state === 'open';

  test('문 앞에서 사라지면 (나가면) 문이 열렸다가 잠시 뒤 닫힌다', () => {
    const a = house([{ t: 'show', who: 'haru', kind: 'haru7', at: [1, 3] }, { t: 'hide', who: 'haru' }]);
    idle(a, 0.1);
    assert.ok(doorOpen(a), '열림');
    assert.ok(a.stage.sfx.includes('door') || a.stage.props['door@1,1'], '문소리');
    idle(a, 2);
    assert.ok(!doorOpen(a), '닫힘');
  });

  test('대본이 이미 문소리(doorOpen · doorClose)를 냈으면 문이 열려도 소리를 겹쳐 내지 않는다', () => {
    const a = house([{ t: 'show', who: 'haru', kind: 'haru7', at: [5, 5] }, { t: 'walk', who: 'haru', to: [1, 3] }, { t: 'sfx', name: 'doorOpen' }, { t: 'hide', who: 'haru' }]);
    const heard: string[] = [];
    for (let i = 0; i < 400; i++) {
      a.step(1 / 60, NO_INPUT);
      heard.push(...a.stage.sfx.splice(0));
    }
    assert.ok(doorOpen(a) || heard.includes('doorOpen'));
    assert.equal(heard.filter((s) => s === 'doorOpen' || s === 'door').length, 1, heard.join(','));
  });

  test('문 앞에 나타나면 (들어오면) 문이 열리고, 문에서 먼 곳은 그대로', () => {
    const a = house([{ t: 'show', who: 'mom', kind: 'mom', at: [2, 3] }]);
    idle(a, 0.1);
    assert.ok(doorOpen(a));
    const b = house([{ t: 'show', who: 'mom', kind: 'mom', at: [8, 7] }, { t: 'hide', who: 'mom' }]);
    idle(b, 0.1);
    assert.ok(!doorOpen(b));
  });

  test('대본으로 켜고 끄기: 텔레비전 켜기, 방 불 끄기는 다시 바꿀 때까지 그대로', () => {
    const a = house([{ t: 'prop', what: 'tv', state: 'on' }, { t: 'prop', what: 'light', state: 'off' }]);
    idle(a, 3);
    assert.equal(a.stage.props['tv@9,3']?.state, 'on');
    assert.equal(a.stage.props.light?.state, 'off');
  });

  test('방을 옮기면 물건 상태는 처음으로', () => {
    const a = house([{ t: 'prop', what: 'tv', state: 'on' }, { t: 'room', id: 'r2' }]);
    idle(a, 0.2);
    assert.deepEqual(a.stage.props, {});
  });
});

describe('어드벤처: 기억 속을 걷기 (기억의 실 모으기)', () => {
  /** 장난감 방에 걷는 기억 하나: 사람 크기 방 mem 에서 할머니가 멈춰 서 있고, 실 둘 · 살펴볼 것 하나 */
  function walkMemory(): Adv {
    const things: Thing[] = [
      {
        kind: 'memory',
        id: 'w1',
        at: [2, 4],
        name: '걷는 기억',
        scene: [{ t: 'room', id: 'mem' }, { t: 'show', who: 'gm', kind: 'grandma', at: [8, 4] }, { t: 'flag', name: 'body_ran' }, say('그날 할머니가 웃었다')],
        after: [{ t: 'flag', name: 'after_ran' }],
        explore: {
          enter: [3, 6],
          intro: [{ t: 'flag', name: 'explore_intro' }],
          threads: [
            { at: [5, 5], text: [say('첫째 실')] },
            { at: [9, 6], text: [say('둘째 실')] },
          ],
          looks: [{ at: [8, 4], text: [{ t: 'flag', name: 'looked_gm' }] }],
        },
      },
    ];
    const a = new Adv(data(things));
    finish(a);
    a.place(px(2), px(3));
    a.face('down');
    press(a);
    finish(a);
    return a;
  }
  const useAt = (a: Adv, x: number, y: number, dir: Facing) => {
    a.place(px(x), px(y));
    a.face(dir);
    a.step(1 / 60, NO_INPUT);
    press(a);
    finish(a);
  };

  test('기억에 들어가면 장난감들이 그 순간 속에 서고, 기억 장면은 아직 흐르지 않는다', () => {
    const a = walkMemory();
    assert.equal(a.room.id, 'mem');
    assert.equal(a.player, 'toby');
    assert.deepEqual([a.stage.actors.toby.x, a.stage.actors.toby.y], [px(3), px(6)]);
    assert.ok(a.stage.actors.bori, '동료도 함께');
    assert.ok(a.stage.actors.gm, '멈춰 선 할머니');
    assert.equal(a.flags.explore_intro, true);
    assert.ok(!a.flags.body_ran);
    assert.deepEqual(a.threadCount(), { got: 0, total: 2 });
  });

  test('실을 모두 모으면 기억 장면이 흐르고, 끝나면 원래 방으로 (조각 · 앨범 · 뒤 대화)', () => {
    const a = walkMemory();
    useAt(a, 5, 6, 'up');
    assert.deepEqual(a.threadCount(), { got: 1, total: 2 });
    assert.ok(!a.flags.body_ran, '하나로는 아직');
    useAt(a, 8, 5, 'up');
    assert.equal(a.flags.looked_gm, true, '사람 살펴보기는 실이 아니다');
    assert.deepEqual(a.threadCount(), { got: 1, total: 2 });
    useAt(a, 9, 7, 'up');
    finish(a);
    assert.equal(a.flags.body_ran, true);
    assert.equal(a.flags.mem_w1, true);
    assert.equal(a.flags.after_ran, true);
    assert.deepEqual(a.save.album, ['w1']);
    assert.equal(a.room.id, 'r1');
    assert.equal(a.threadCount(), null, '기억 밖에서는 실 세기가 없다');
  });
});
