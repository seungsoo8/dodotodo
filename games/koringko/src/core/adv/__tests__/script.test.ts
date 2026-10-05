import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Runner, FAST, TAKE_S } from '../script.ts';
import { ACT_S } from '../stage.ts';
import { simpleHost } from './host.ts';
import { addActor, newStage, px, TEXT_RATE, updateStage } from '../stage.ts';
import type { Cmd } from '../types.ts';

/** 대본을 dt 씩 돌린다 (무대도 함께). until 이 참이 되거나 limit 초가 지나면 멈춘다 */
function run(r: Runner, h: ReturnType<typeof simpleHost>, secs: number, dt = 1 / 60, fast = false): number {
  let t = 0;
  while (t < secs && !r.done) {
    r.update(h, dt, fast);
    updateStage(h.stage, fast ? dt * FAST : dt);
    t += dt;
  }
  return t;
}

describe('대본 실행: 대사', () => {
  test('대사는 한 글자씩 나오고, 누르면 먼저 다 보이고, 한 번 더 누르면 다음으로', () => {
    const h = simpleHost();
    const r = new Runner([
      { t: 'say', who: 'toby', text: '하루야, 어디 가?' },
      { t: 'say', who: 'bori', text: '배고파' },
    ]);
    r.update(h, 0.1);
    const d = h.stage.dialog!;
    assert.equal(d.who, 'toby');
    assert.ok(d.shown > 0 && d.shown < d.text.length, `0.1초에 ${d.shown}글자`);
    r.advance(h);
    assert.equal(h.stage.dialog!.shown, '하루야, 어디 가?'.length, '첫 누름: 글자를 다 보여 준다');
    assert.equal(h.stage.dialog!.who, 'toby');
    r.advance(h);
    r.update(h, 0.01);
    assert.equal(h.stage.dialog!.who, 'bori', '두 번째 누름: 다음 대사');
    r.advance(h);
    r.advance(h);
    r.update(h, 0.01);
    assert.equal(r.done, true);
    assert.equal(h.stage.dialog, null, '대본이 끝나면 대화창이 닫힌다');
  });

  test('글자 속도: 1초에 TEXT_RATE 글자, 빨리 넘기기(누르고 있기)면 FAST 배', () => {
    const text = '가'.repeat(200);
    const a = simpleHost();
    const ra = new Runner([{ t: 'say', who: '', text }]);
    ra.update(a, 0);
    ra.update(a, 1);
    const b = simpleHost();
    const rb = new Runner([{ t: 'say', who: '', text }]);
    rb.update(b, 0, true);
    rb.update(b, 1, true);
    assert.ok(Math.abs(a.stage.dialog!.shown - TEXT_RATE) <= 1, `${a.stage.dialog!.shown}`);
    assert.ok(Math.abs(b.stage.dialog!.shown - TEXT_RATE * FAST) <= 1, `${b.stage.dialog!.shown}`);
  });
});

describe('대본 실행: 말소리', () => {
  const voices = (h: ReturnType<typeof simpleHost>) => h.stage.sfx.filter((n) => n.startsWith('voice'));

  test('글자가 나올 때 두 글자마다 말하는 이의 말소리 (띄어쓰기 · 문장 부호는 세지 않는다)', () => {
    const h = simpleHost();
    const text = '하루야, 어디 가? 같이 가자!';
    const r = new Runner([{ t: 'say', who: 'toby', text }]);
    for (let i = 0; i < 120; i++) r.update(h, 1 / 60);
    const letters = [...text].filter((ch) => /[가-힣a-zA-Z0-9]/.test(ch)).length;
    assert.equal(h.stage.dialog!.shown, text.length);
    assert.equal(voices(h).length, Math.floor(letters / 2));
    assert.ok(voices(h).every((n) => n === 'voice:toby'));
  });

  test('지문(말하는 이 없음)은 낮은 말소리, 누르면 바로 다 보이고 소리는 더 나지 않는다', () => {
    const h = simpleHost();
    const r = new Runner([{ t: 'say', who: '', text: '창밖에 첫눈이 내린다. 아주 조용히.' }]);
    r.update(h, 0.1);
    const before = voices(h).length;
    assert.ok(before >= 1 && voices(h).every((n) => n === 'voice:'));
    r.advance(h);
    r.update(h, 0.1);
    assert.equal(voices(h).length, before, '건너뛴 글자는 소리 없이');
  });
});

describe('대본 실행: 몸짓', () => {
  test('걷기는 도착할 때까지 기다리고, 걸린 시간은 거리 ÷ 빠르기', () => {
    const h = simpleHost();
    addActor(h.stage, 'haru', 'haru7', px(2), px(2));
    const r = new Runner([
      { t: 'walk', who: 'haru', to: [6, 2], speed: 48 },
      { t: 'flag', name: 'arrived' },
    ]);
    const t = run(r, h, 10);
    const a = h.stage.actors.haru;
    assert.equal(a.x, px(6));
    assert.equal(a.y, px(2));
    assert.equal(h.flags.arrived, true);
    // 4칸 = 96px, 초당 48px → 2초
    assert.ok(t > 1.9 && t < 2.2, `${t}초`);
    assert.equal(a.dir, 'right', '가는 쪽을 본다');
    assert.equal(a.moving, false, '도착하면 멈춘다');
  });

  test('wait:false 걷기는 기다리지 않고 바로 다음 명령 (두 사람이 함께 걷기)', () => {
    const h = simpleHost();
    addActor(h.stage, 'a', 'toby', px(0), px(0));
    addActor(h.stage, 'b', 'bori', px(0), px(1));
    const r = new Runner([
      { t: 'walk', who: 'a', to: [3, 0], wait: false },
      { t: 'walk', who: 'b', to: [3, 1] },
    ]);
    r.update(h, 1 / 60);
    assert.ok(h.stage.actors.a.goal && h.stage.actors.b.goal, '둘 다 출발');
    run(r, h, 10);
    assert.equal(h.stage.actors.a.x, px(3));
    assert.equal(h.stage.actors.b.x, px(3));
  });

  test('돌아보기: 다른 인물 쪽으로 (대각선 포함)', () => {
    const h = simpleHost();
    addActor(h.stage, 'a', 'toby', px(5), px(5));
    addActor(h.stage, 'b', 'haru7', px(2), px(5));
    addActor(h.stage, 'c', 'grandma', px(8), px(8));
    const r = new Runner([{ t: 'face', who: 'a', dir: 'b' }]);
    r.update(h, 0);
    assert.equal(h.stage.actors.a.dir, 'left');
    new Runner([{ t: 'face', who: 'a', dir: 'c' }]).update(h, 0);
    assert.equal(h.stage.actors.a.dir, 'downRight');
    new Runner([{ t: 'face', who: 'a', dir: 'up' }]).update(h, 0);
    assert.equal(h.stage.actors.a.dir, 'up');
  });

  test('감정 말풍선은 잠깐 멈추고 (wait:false 면 안 멈춤), 잠시 뒤 사라진다', () => {
    const h = simpleHost();
    addActor(h.stage, 'a', 'toby', 0, 0);
    const r = new Runner([{ t: 'emote', who: 'a', e: '!' }, { t: 'flag', name: 'next' }]);
    r.update(h, 1 / 60);
    assert.equal(h.stage.actors.a.emote?.e, '!');
    assert.equal(h.flags.next, undefined, '바로 넘어가지 않는다');
    run(r, h, 3);
    assert.equal(h.flags.next, true);
    for (let i = 0; i < 200; i++) updateStage(h.stage, 1 / 60);
    assert.equal(h.stage.actors.a.emote, null);
    const h2 = simpleHost();
    addActor(h2.stage, 'a', 'toby', 0, 0);
    new Runner([{ t: 'emote', who: 'a', e: '?', wait: false }, { t: 'flag', name: 'next' }]).update(h2, 1 / 60);
    assert.equal(h2.flags.next, true);
  });

  test('나타나기 · 사라지기 · 자세', () => {
    const h = simpleHost();
    const r = new Runner([
      { t: 'show', who: 'gm', kind: 'grandma', at: [3, 4], dir: 'left', pose: 'sit' },
      { t: 'pose', who: 'gm', pose: 'hold' },
    ]);
    r.update(h, 0);
    const g = h.stage.actors.gm;
    assert.deepEqual([g.kind, g.x, g.y, g.dir, g.pose], ['grandma', px(3), px(4), 'left', 'hold']);
    new Runner([{ t: 'hide', who: 'gm' }]).update(h, 0);
    assert.equal(h.stage.actors.gm, undefined);
  });
});

describe('대본 실행: 화면 연출', () => {
  test('어두워지기는 정한 시간 동안 이어지고 끝나야 다음으로', () => {
    const h = simpleHost();
    const r = new Runner([{ t: 'fade', to: 1, s: 1, color: 'white' }, { t: 'flag', name: 'after' }]);
    const t = run(r, h, 5);
    assert.equal(h.stage.fade, 1);
    assert.equal(h.stage.fadeColor, 'white');
    assert.ok(t > 0.95 && t < 1.1, `${t}`);
    assert.equal(h.flags.after, true);
  });

  test('장 제목 카드는 s 초 동안 보이고, 누르면 빨리 사라진다', () => {
    const h = simpleHost();
    const r = new Runner([{ t: 'title', text: '1장', sub: '15살', s: 3 }]);
    r.update(h, 0);
    assert.equal(h.stage.title?.text, '1장');
    assert.ok(run(r, h, 10) > 2.9);
    const h2 = simpleHost();
    const r2 = new Runner([{ t: 'title', text: '1장', s: 3 }]);
    r2.update(h2, 0);
    r2.advance(h2);
    assert.ok(run(r2, h2, 10) < 0.6, '누르면 0.5초 안에');
  });

  test('검은 띠 · 음악 · 소리 · 흔들림 · 색감 · 할 일은 바로 바뀌고 기다리지 않는다', () => {
    const h = simpleHost();
    new Runner([
      { t: 'bars', on: true },
      { t: 'music', track: 'theme4' },
      { t: 'sfx', name: 'tick' },
      { t: 'shake', s: 0.5 },
      { t: 'tone', v: 'memory' },
      { t: 'goal', text: '할머니를 찾자' },
    ]).update(h, 0);
    const s = h.stage;
    assert.deepEqual([s.barsOn, s.music, s.sfx, s.shake, s.tone, s.goal], [true, 'theme4', ['tick'], 0.5, 'memory', '할머니를 찾자']);
    for (let i = 0; i < 60; i++) updateStage(s, 1 / 60);
    assert.equal(s.bars, 1, '띠는 1초 안에 다 내려온다');
  });

  test('카메라: 칸 → 픽셀 목표, s 초 기다림, null 이면 조종하는 인물', () => {
    const h = simpleHost();
    const r = new Runner([{ t: 'cam', to: [10, 5], s: 1 }]);
    r.update(h, 0);
    assert.deepEqual(h.stage.cam, { x: px(10), y: px(5) });
    assert.ok(run(r, h, 5) > 0.95);
    new Runner([{ t: 'cam', to: 'haru' }]).update(h, 0);
    assert.equal(h.stage.cam, 'haru');
    new Runner([{ t: 'cam', to: null }]).update(h, 0);
    assert.equal(h.stage.cam, null);
  });
});

describe('대본 실행: 갈래 · 연결', () => {
  test('깃발에 따라 갈래 (then · else)', () => {
    const script = (): Cmd[] => [{ t: 'if', flag: 'saw', then: [{ t: 'flag', name: 'A' }], else: [{ t: 'flag', name: 'B' }] }, { t: 'flag', name: 'end' }];
    const h = simpleHost();
    new Runner(script()).update(h, 0);
    assert.deepEqual([h.flags.A, h.flags.B, h.flags.end], [undefined, true, true]);
    const h2 = simpleHost();
    h2.flags.saw = true;
    new Runner(script()).update(h2, 0);
    assert.deepEqual([h2.flags.A, h2.flags.B, h2.flags.end], [true, undefined, true]);
  });

  test('같은 대본을 두 번 돌려도 갈래가 섞이지 않는다 (원본 대본을 바꾸지 않는다)', () => {
    const cmds: Cmd[] = [{ t: 'if', flag: 'x', then: [{ t: 'flag', name: 'A' }] }];
    new Runner(cmds).update(simpleHost(), 0);
    assert.equal(cmds.length, 1);
  });

  test('방 옮기기 · 장 넘기기 · 동료 · 조종 · 태엽 · 앨범은 집(host)에 전한다', () => {
    const h = simpleHost();
    new Runner([
      { t: 'room', id: 'attic', at: [3, 4], dir: 'up' },
      { t: 'join', who: 'bori' },
      { t: 'control', who: 'haru' },
      { t: 'wind', v: 0.4 },
      { t: 'album', id: 'm1' },
      { t: 'chapter', n: 2 },
    ]).update(h, 0);
    assert.deepEqual(h.log, ['room attic 3,4 up', 'join bori', 'control haru', 'wind 0.4', 'album m1', 'chapter 2']);
  });

  test('작은 놀이는 끝날 때까지 기다린다', () => {
    const h = simpleHost();
    const r = new Runner([{ t: 'mini', id: 'stars' }, { t: 'flag', name: 'after' }]);
    run(r, h, 1);
    assert.equal(h.flags.after, undefined);
    assert.equal(h.log.at(-1), 'mini stars');
    h.miniOver = true;
    run(r, h, 1);
    assert.equal(h.flags.after, true);
  });
});

describe('대본 실행: 고르기', () => {
  test('고를 때까지 기다리고, 고른 번호로 깃발을 세운다', () => {
    const h = simpleHost();
    const r = new Runner([{ t: 'choice', flag: 'call', options: ['보고 싶어요', '괜찮아요'] }, { t: 'flag', name: 'after' }]);
    run(r, h, 1);
    assert.deepEqual(h.stage.choice?.options, ['보고 싶어요', '괜찮아요']);
    assert.equal(h.flags.after, undefined);
    h.stage.choice!.picked = 1;
    run(r, h, 1);
    assert.deepEqual([h.flags.call_0, h.flags.call_1, h.flags.after, h.stage.choice], [undefined, true, true, null]);
  });
});

describe('대본 실행: 물건 들고 · 내려놓고 · 건네기', () => {
  const items = (h: ReturnType<typeof simpleHost>) => h.stage.items;

  test('@item 은 바닥에 물건을 놓고, 칸을 빼면 종류만 바꾼다 (자리는 그대로)', () => {
    const h = simpleHost();
    run(new Runner([{ t: 'item', id: 'box', kind: 'box', at: [4, 5] }]), h, 1);
    assert.deepEqual(items(h).box, { kind: 'box', x: px(4), y: px(5), on: null });
    run(new Runner([{ t: 'item', id: 'box', kind: 'boxOpen' }]), h, 1);
    assert.deepEqual(items(h).box, { kind: 'boxOpen', x: px(4), y: px(5), on: null });
  });

  test('@take: 몸을 숙였다가(kneel) 물건을 들어 올린다 — 걸린 시간 · 손에 든 것 · 소리', () => {
    const h = simpleHost();
    addActor(h.stage, 'haru', 'haru15', px(4), px(6));
    const r = new Runner([{ t: 'item', id: 'box', kind: 'box', at: [4, 5] }, { t: 'take', who: 'haru', id: 'box' }]);
    r.update(h, 1 / 60);
    r.update(h, 1 / 60);
    assert.equal(h.stage.actors.haru.pose, 'kneel', '집는 동안은 숙인다');
    const t = run(r, h, 3);
    assert.ok(t >= TAKE_S - 0.05 && t <= TAKE_S + 0.1, `${t}초`);
    const a = h.stage.actors.haru;
    assert.equal(a.carry, 'box');
    assert.equal(a.pose, 'idle', '들고 나면 선다');
    assert.equal(items(h).box.on, 'haru');
    assert.ok(h.stage.sfx.includes('lift'));
  });

  test('들고 걸으면 물건이 사람을 따라간다', () => {
    const h = simpleHost();
    addActor(h.stage, 'haru', 'haru15', px(2), px(2));
    run(new Runner([{ t: 'carry', who: 'haru', kind: 'box', id: 'b' }, { t: 'walk', who: 'haru', to: [6, 2] }]), h, 10);
    assert.equal(h.stage.actors.haru.carry, 'b');
    assert.deepEqual([items(h).b.x, items(h).b.y], [px(6), px(2)]);
  });

  test('@put: 숙였다가 정한 칸에 내려놓는다 (칸이 없으면 바라보는 앞 칸)', () => {
    const h = simpleHost();
    addActor(h.stage, 'haru', 'haru15', px(5), px(5));
    h.stage.actors.haru.dir = 'up';
    run(new Runner([{ t: 'carry', who: 'haru', kind: 'box', id: 'box' }, { t: 'put', who: 'haru', id: 'box' }]), h, 3);
    assert.equal(h.stage.actors.haru.carry, undefined);
    assert.deepEqual(items(h).box, { kind: 'box', x: px(5), y: px(4), on: null });
    assert.ok(h.stage.sfx.includes('put'));
    run(new Runner([{ t: 'take', who: 'haru', id: 'box' }, { t: 'put', who: 'haru', id: 'box', at: [9, 7] }]), h, 3);
    assert.deepEqual([items(h).box.x, items(h).box.y, items(h).box.on], [px(9), px(7), null]);
  });

  test('@face 는 물건 쪽으로도 돌아본다 (집기 전에 물건 보기)', () => {
    const h = simpleHost();
    addActor(h.stage, 'haru', 'haru15', px(5), px(5));
    run(new Runner([{ t: 'item', id: 'box', kind: 'box', at: [2, 5] }, { t: 'face', who: 'haru', dir: 'box' }]), h, 1);
    assert.equal(h.stage.actors.haru.dir, 'left');
  });

  test('@give: 든 물건을 다른 사람 손으로 (주는 사람은 빈손)', () => {
    const h = simpleHost();
    addActor(h.stage, 'gm', 'grandma', px(3), px(3));
    addActor(h.stage, 'haru', 'haru10', px(4), px(3));
    run(new Runner([{ t: 'carry', who: 'gm', kind: 'doll', id: 'doll' }, { t: 'give', from: 'gm', to: 'haru', id: 'doll' }]), h, 3);
    assert.equal(h.stage.actors.gm.carry, undefined);
    assert.equal(h.stage.actors.haru.carry, 'doll');
    assert.equal(items(h).doll.on, 'haru');
  });

  test('@carry 사람 none 은 든 것을 치운다, 든 사람이 사라지면 물건도 사라진다', () => {
    const h = simpleHost();
    addActor(h.stage, 'haru', 'haru15', px(2), px(2));
    addActor(h.stage, 'mom', 'mom', px(3), px(2));
    run(new Runner([{ t: 'carry', who: 'haru', kind: 'jar', id: 'jar' }, { t: 'carry', who: 'haru', kind: 'none', id: 'none' }]), h, 1);
    assert.equal(h.stage.actors.haru.carry, undefined);
    assert.equal(items(h).jar, undefined);
    run(new Runner([{ t: 'carry', who: 'mom', kind: 'box', id: 'b2' }, { t: 'hide', who: 'mom' }]), h, 1);
    assert.equal(items(h).b2, undefined);
  });

  test('없는 물건을 들거나 내려놓으라 하면 조용히 넘어간다 (멈추지 않는다)', () => {
    const h = simpleHost();
    addActor(h.stage, 'haru', 'haru15', px(2), px(2));
    const r = new Runner([{ t: 'take', who: 'haru', id: 'ghost' }, { t: 'put', who: 'haru', id: 'ghost' }, { t: 'give', from: 'haru', to: 'nobody', id: 'ghost' }, { t: 'flag', name: 'ok' }]);
    run(r, h, 3);
    assert.equal(h.flags.ok, true);
    assert.equal(h.stage.actors.haru.carry, undefined);
  });
});

describe('대본 실행: 몸짓 한 번 (@act)', () => {
  test('몸짓은 정한 시간 동안 그 자세였다가 원래 자세로 돌아오고, 대본은 그동안 기다린다', () => {
    const h = simpleHost();
    addActor(h.stage, 'haru', 'haru10', px(2), px(2), 'down', 'sit');
    const r = new Runner([{ t: 'act', who: 'haru', name: 'nod', s: 0.6 }, { t: 'flag', name: 'after' }]);
    r.update(h, 1 / 60);
    r.update(h, 1 / 60);
    assert.equal(h.stage.actors.haru.pose, 'nod');
    const t = run(r, h, 3);
    assert.ok(t >= 0.55 && t <= 0.7, `${t}초`);
    assert.equal(h.stage.actors.haru.pose, 'sit', '앉아 있던 자세로 돌아온다');
    assert.equal(h.flags.after, true);
  });

  test('시간을 안 주면 몸짓마다 정해진 길이, nowait 이면 기다리지 않고 다음 명령으로', () => {
    const h = simpleHost();
    addActor(h.stage, 'gm', 'grandma', px(2), px(2));
    const r = new Runner([{ t: 'act', who: 'gm', name: 'laugh', wait: false }, { t: 'flag', name: 'next' }]);
    r.update(h, 1 / 60);
    r.update(h, 1 / 60);
    assert.equal(h.flags.next, true, '기다리지 않음');
    assert.equal(h.stage.actors.gm.pose, 'laugh');
    run(new Runner([{ t: 'wait', s: ACT_S.laugh + 0.2 }]), h, 5);
    assert.equal(h.stage.actors.gm.pose, 'idle', '정해진 길이가 지나면 돌아온다');
  });

  test('없는 인물의 몸짓은 넘어간다', () => {
    const h = simpleHost();
    run(new Runner([{ t: 'act', who: 'ghost', name: 'nod' }, { t: 'flag', name: 'ok' }]), h, 2);
    assert.equal(h.flags.ok, true);
  });
});
