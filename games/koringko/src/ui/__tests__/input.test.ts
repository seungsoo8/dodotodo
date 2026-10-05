/**
 * 입력 다듬기: 본 대사 기억(건너뛰기) · 건너뛰기 박자 · 새 대사 직후 잘못 누르기 막기(F3) · 조작 글리프(E6)
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { actHint, lineKey, SEEN_KEY, SEEN_MAX, SeenLines, SKIP_GAP, SkipPacer, TAP_GRACE, tapAllowed } from '../input.ts';

function memStore(init: Record<string, string> = {}, broken = false) {
  const m = new Map(Object.entries(init));
  return {
    m,
    getItem(k: string): string | null {
      if (broken) throw new Error('blocked');
      return m.get(k) ?? null;
    },
    setItem(k: string, v: string): void {
      if (broken) throw new Error('blocked');
      m.set(k, v);
    },
  };
}

describe('본 대사 기억', () => {
  test('lineKey: 같은 인물 · 글이면 같고, 인물이나 글이 다르면 다르다', () => {
    assert.equal(lineKey('toby', '안녕'), lineKey('toby', '안녕'));
    assert.notEqual(lineKey('toby', '안녕'), lineKey('bori', '안녕'));
    assert.notEqual(lineKey('toby', '안녕'), lineKey('toby', '안녕!'));
    assert.notEqual(lineKey('ab', 'c'), lineKey('a', 'bc'));
  });

  test('add 한 대사만 has', () => {
    const s = new SeenLines();
    s.add('toby', '안녕');
    assert.equal(s.has('toby', '안녕'), true);
    assert.equal(s.has('toby', '잘 가'), false);
  });

  test('저장하고 다시 불러오면 본 대사를 기억한다', () => {
    const st = memStore();
    const s = new SeenLines();
    s.add('gm', '태엽은 천천히 감아야 오래 간단다.');
    s.save(st);
    assert.ok(st.m.has(SEEN_KEY));
    const t = SeenLines.load(st);
    assert.equal(t.has('gm', '태엽은 천천히 감아야 오래 간단다.'), true);
    assert.equal(t.has('gm', '다른 말'), false);
  });

  test('깨진 저장 · 막힌 저장소에서도 던지지 않고 빈 기억', () => {
    assert.equal(SeenLines.load(memStore({ [SEEN_KEY]: '{x' })).size, 0);
    assert.equal(SeenLines.load(memStore({ [SEEN_KEY]: '[1,2,"a"]' })).size, 1);
    const broken = memStore({}, true);
    assert.equal(SeenLines.load(broken).size, 0);
    assert.doesNotThrow(() => new SeenLines().save(broken));
  });

  test(`${SEEN_MAX}줄을 넘으면 가장 오래된 것부터 잊는다`, () => {
    const s = new SeenLines();
    for (let i = 0; i < SEEN_MAX + 3; i++) s.add('toby', `줄${i}`);
    assert.equal(s.size, SEEN_MAX);
    assert.equal(s.has('toby', '줄0'), false);
    assert.equal(s.has('toby', '줄3'), true);
    assert.equal(s.has('toby', `줄${SEEN_MAX + 2}`), true);
  });

  test('이미 본 대사를 다시 add 하면 새것으로 올라가 잊히지 않는다', () => {
    const s = new SeenLines();
    s.add('toby', '처음');
    for (let i = 0; i < SEEN_MAX - 1; i++) s.add('toby', `줄${i}`);
    s.add('toby', '처음');
    s.add('toby', '하나 더');
    assert.equal(s.has('toby', '처음'), true);
    assert.equal(s.has('toby', '줄0'), false);
  });
});

describe('건너뛰기 박자', () => {
  test(`누르고 있는 동안 ${SKIP_GAP}초마다 한 번 넘긴다 (처음 누른 순간 바로 한 번)`, () => {
    const p = new SkipPacer();
    assert.equal(p.step(0.01, true), true);
    let n = 0;
    for (let i = 0; i < 100; i++) if (p.step(0.01, true)) n++;
    // 1초 동안 대략 1 / SKIP_GAP 번
    assert.ok(Math.abs(n - 1 / SKIP_GAP) <= 1, `${n}`);
  });

  test('손을 떼면 넘기지 않고, 다시 누르면 바로 넘긴다', () => {
    const p = new SkipPacer();
    p.step(0.01, true);
    assert.equal(p.step(0.5, false), false);
    assert.equal(p.step(0.01, true), true);
  });
});

describe('새 대사 직후 잘못 누르기 막기', () => {
  test(`새 줄이 뜨고 ${TAP_GRACE}초 안에는 넘기기를 막는다`, () => {
    assert.equal(tapAllowed(0.05, 10, 10), false);
    assert.equal(tapAllowed(TAP_GRACE - 0.001, 10, 10), false);
  });

  test('그 사이에도 글자가 덜 나왔으면 다 보이기는 허용', () => {
    assert.equal(tapAllowed(0.05, 3, 10), true);
  });

  test(`${TAP_GRACE}초가 지나면 넘길 수 있다 (경계 포함)`, () => {
    assert.equal(tapAllowed(TAP_GRACE, 10, 10), true);
    assert.equal(tapAllowed(2, 10, 10), true);
  });
});

describe('조작 글리프', () => {
  test('키보드는 [Z], 손가락은 키 글자 없이 「톡」', () => {
    assert.equal(actHint(false), '[Z]');
    assert.equal(actHint(true), '톡');
    assert.ok(!/[A-Z]/.test(actHint(true)));
  });
});
