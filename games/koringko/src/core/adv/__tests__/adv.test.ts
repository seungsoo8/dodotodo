import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Adv, NO_INPUT, type AdvData, type AdvInput } from '../adv.ts';
import { Builder, TILE } from '../../maps.ts';
import { px } from '../stage.ts';
import type { Cmd, RoomDef, Thing } from '../types.ts';

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

  test('동료는 발자국을 따라 뒤에서 걷는다', () => {
    const a = new Adv(data([]));
    finish(a);
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
    assert.equal(a.prompt, null);
    a.save.party = ['toby', 'nabi'];
    a.syncParty();
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
