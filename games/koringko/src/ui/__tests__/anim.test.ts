import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { BREATH_HZ, breathFrame, deadZone, FIDGETS, gaitFrame, idleFidget, leanToward, lookAhead, markerPop, phaseOf, talkBob, toastIn } from '../adv/anim.ts';
import { HERO_ACTS } from '../art/heroes.ts';
import { personSprite } from '../art/people.ts';
import { MOODS } from '../../core/adv/types.ts';

describe('표정 (mood) · 말하는 입 · 숨', () => {
  const key = (p: { px: Int32Array }) => Array.from(p.px).join(',');
  test('사람 얼굴은 표정 다섯 가지가 모두 다르고, 기본 얼굴과도 다르다', () => {
    for (const kind of ['grandma', 'haru7']) {
      const base = key(personSprite(kind, 'down', 'idle'));
      const all = MOODS.map((m) => key(personSprite(kind, 'down', 'idle', { mood: m })));
      assert.equal(new Set([base, ...all]).size, MOODS.length + 1, kind);
    }
  });
  test('말하는 입은 다문 입과 다르고, 뒤를 보면 얼굴이 없으니 같다', () => {
    assert.notEqual(key(personSprite('grandma', 'down', 'idle', { talk: true })), key(personSprite('grandma', 'down', 'idle')));
    assert.equal(key(personSprite('grandma', 'up', 'idle', { talk: true })), key(personSprite('grandma', 'up', 'idle')));
  });
  test('숨(bob -1)은 몸을 1px 올린다', () => {
    assert.notEqual(key(personSprite('grandma', 'down', 'idle', { bob: -1 })), key(personSprite('grandma', 'down', 'idle')));
  });
});

describe('숨쉬기: 인물마다 어긋나게', () => {
  test('위상은 id 마다 다르고 [0,1) 안, 같은 id 는 늘 같다', () => {
    const ids = ['toby', 'bori', 'ruru', 'nabi'];
    const ph = ids.map(phaseOf);
    assert.equal(new Set(ph).size, 4);
    for (const p of ph) assert.ok(p >= 0 && p < 1, `${p}`);
    assert.equal(phaseOf('bori'), phaseOf('bori'));
  });

  test('주기도 성격대로: 보리는 느긋, 루루는 들썩', () => {
    assert.ok(BREATH_HZ.bori < BREATH_HZ.toby && BREATH_HZ.toby < BREATH_HZ.ruru);
    assert.equal(BREATH_HZ.bori, 1.1);
    assert.equal(BREATH_HZ.ruru, 1.7);
  });

  test('넷이 같은 프레임에 함께 오르내리지 않는다 (10초 동안 모두 같은 그림인 순간이 절반도 안 된다)', () => {
    let same = 0;
    let n = 0;
    for (let t = 0; t < 10; t += 1 / 30, n++) {
      const f = ['toby', 'bori', 'ruru', 'nabi'].map((id) => breathFrame(id, id, t));
      if (f.every((x) => x === f[0])) same++;
    }
    assert.ok(same < n / 2, `${same}/${n}`);
  });

  test('breathFrame 은 0 또는 1, 주기 안에서 두 그림을 다 쓴다', () => {
    const seen = new Set<number>();
    for (let t = 0; t < 1; t += 0.05) seen.add(breathFrame('toby', 'toby', t));
    assert.deepEqual([...seen].sort(), [0, 1]);
  });
});

describe('대기 몸짓: 오래 서 있으면 인물마다 다른 몸짓', () => {
  test('3초 전에는 하지 않는다', () => {
    for (const s of [0, 1, 2.99]) assert.equal(idleFidget('toby', 'toby', s), null);
  });
  test('6~12초 안에 한 번은 몸짓을 하고, 그 몸짓은 그 인물 표에 있고 그릴 수 있는 것', () => {
    for (const kind of ['toby', 'bori', 'ruru', 'nabi']) {
      const acts = new Set<string>();
      for (let s = 3; s < 3 + 12 * 3; s += 0.05) {
        const f = idleFidget(kind, kind, s);
        if (f) acts.add(f.act);
      }
      assert.ok(acts.size >= 1, kind);
      for (const a of acts) {
        assert.ok(FIDGETS[kind].includes(a), `${kind} ${a}`);
        assert.ok(HERO_ACTS[a], `${a} 그림`);
      }
      let first = -1;
      for (let s = 3; s < 20 && first < 0; s += 0.05) if (idleFidget(kind, kind, s)) first = s;
      assert.ok(first >= 3 + 6 - 2 && first <= 3 + 12, `${kind} 첫 몸짓 ${first}`);
    }
  });
  test('표에 없는 인물(사람 · 주민)은 몸짓을 하지 않는다', () => {
    assert.equal(idleFidget('gm', 'grandma', 30), null);
  });
});

describe('태엽이 적은 토비의 걸음 그림', () => {
  test('태엽이 넉넉하면 걸음 그림은 고르게 돈다', () => {
    const frames = Array.from({ length: 40 }, (_, i) => gaitFrame(i / 10 + 0.001, 1));
    assert.deepEqual(frames.slice(0, 4), [0, 1, 2, 3]);
  });
  test('태엽이 0.3 아래면 가끔 한 박자 멈칫한다 (같은 그림이 두 박자 이어짐)', () => {
    let stuck = 0;
    let prev = -1;
    for (let i = 0; i < 110; i++) {
      const f = gaitFrame((i + 0.5) / 10, 0.2);
      if (f === prev) stuck++;
      prev = f;
    }
    assert.ok(stuck >= 5 && stuck <= 20, `${stuck}`);
    prev = -1;
    stuck = 0;
    for (let i = 0; i < 110; i++) {
      const f = gaitFrame((i + 0.5) / 10, 0.5);
      if (f === prev) stuck++;
      prev = f;
    }
    assert.equal(stuck, 0);
  });
});

describe('말하는 몸짓 · 표시 팝 · 알림', () => {
  test('말하는 동안 0.15초마다 1px 오르내린다', () => {
    assert.equal(talkBob(0), 0);
    assert.equal(talkBob(0.16), 1);
    assert.equal(talkBob(0.31), 0);
  });
  test('표시 ▼ 는 0.6 → 1.1 → 1 배로 0.15초 동안 튄다', () => {
    assert.equal(markerPop(0), 0.6);
    assert.ok(Math.abs(markerPop(0.075) - 1.1) < 1e-9);
    assert.ok(markerPop(0.11) < 1.1 && markerPop(0.11) > 1);
    assert.equal(markerPop(0.15), 1);
    assert.equal(markerPop(3), 1);
    assert.equal(markerPop(-1), 0.6);
  });
  test('알림은 0.4초 동안 올라오고, 머물다가 끝에서 사라진다', () => {
    assert.equal(toastIn(1.9, 1.9), 0);
    assert.ok(Math.abs(toastIn(1.7, 1.9) - 0.5) < 1e-9);
    assert.equal(toastIn(1.0, 1.9), 1);
    assert.ok(toastIn(0.1, 1.9) < 1 && toastIn(0.1, 1.9) > 0, '끝에서 옅어진다');
    assert.equal(toastIn(0, 1.9), 0);
  });
});

describe('카메라: 앞서 보기 · 데드존 · 말하는 쪽으로 기울기', () => {
  test('걷는 쪽으로 24px 앞서 본다: 0.4초면 거의 다 닿고, 한 프레임에 확 가지 않는다', () => {
    let v = { x: 0, y: 0 };
    v = lookAhead(v, { x: 1, y: 0 }, 1 / 60);
    assert.ok(v.x > 0 && v.x < 6, `${v.x}`);
    for (let t = 0; t < 0.4; t += 1 / 60) v = lookAhead(v, { x: 1, y: 0 }, 1 / 60);
    assert.ok(v.x > 24 * 0.9 && v.x <= 24, `${v.x}`);
    assert.equal(v.y, 0);
  });
  test('멈추면 천천히 가운데로 돌아온다', () => {
    let v = { x: 24, y: 0 };
    v = lookAhead(v, null, 0.1);
    assert.ok(v.x < 24 && v.x > 12, `${v.x}`);
    for (let t = 0; t < 3; t += 1 / 60) v = lookAhead(v, null, 1 / 60);
    assert.ok(Math.abs(v.x) < 0.5);
  });
  test('대각선은 길이 24 를 넘지 않는다', () => {
    let v = { x: 0, y: 0 };
    for (let t = 0; t < 3; t += 1 / 60) v = lookAhead(v, { x: Math.SQRT1_2, y: Math.SQRT1_2 }, 1 / 60);
    assert.ok(Math.hypot(v.x, v.y) <= 24.0001);
  });
  test('데드존(가로 32 · 세로 20) 안의 움직임에는 카메라가 따라가지 않고, 넘으면 넘은 만큼만', () => {
    const f = { x: 100, y: 100 };
    assert.deepEqual(deadZone(f, { x: 110, y: 105 }), { x: 100, y: 100 });
    assert.deepEqual(deadZone(f, { x: 116, y: 90 }), { x: 100, y: 100 }, '경계');
    assert.deepEqual(deadZone(f, { x: 130, y: 100 }), { x: 114, y: 100 });
    assert.deepEqual(deadZone(f, { x: 100, y: 70 }), { x: 100, y: 80 });
  });
  test('말하는 이 쪽으로 최대 8px 기울인다', () => {
    assert.deepEqual(leanToward({ x: 0, y: 0 }, { x: 100, y: 0 }), { x: 8, y: 0 });
    assert.deepEqual(leanToward({ x: 0, y: 0 }, { x: 4, y: 0 }), { x: 2, y: 0 }, '가까우면 거리의 절반만');
    assert.deepEqual(leanToward({ x: 5, y: 5 }, { x: 5, y: 5 }), { x: 0, y: 0 });
  });
});
