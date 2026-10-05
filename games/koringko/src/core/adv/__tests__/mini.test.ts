import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { BREATH, CandlesMini, FOLDS, makeMini, MINI_IDS, PUPPET_CUES, PUPPETS, PuppetMini, SEW, SewMini, StarsMini, WIND, WindMini, type MiniDir, type MiniInput } from '../mini.ts';

const NONE: MiniInput = { act: false, hold: false, dir: null };
const tick = (m: { step(dt: number, i: MiniInput): void }, secs: number, inp: MiniInput = NONE) => {
  for (let t = 0; t < secs; t += 1 / 60) m.step(1 / 60, inp);
};

describe('종이별 접기', () => {
  test('할머니 손을 따라 맞는 방향을 누르면 한 번 접히고, 다섯 번이면 별 하나', () => {
    const m = new StarsMini();
    for (const d of FOLDS[0]) m.step(1 / 60, { ...NONE, dir: d });
    assert.equal(m.star, 1);
    assert.equal(m.fold, 0);
    assert.ok(m.sfx.includes('star'));
  });

  test('틀린 방향은 접히지 않고 흔들릴 뿐 (실패해서 끝나지 않는다)', () => {
    const m = new StarsMini();
    const wrong: MiniDir = FOLDS[0][0] === 'up' ? 'down' : 'up';
    for (let i = 0; i < 20; i++) m.step(1 / 60, { ...NONE, dir: wrong });
    assert.equal(m.fold, 0);
    assert.ok(m.wrong > 0);
    assert.equal(m.done, false);
  });

  test('별 셋을 다 접으면 끝 (마지막 별 뒤 잠깐 쉬고)', () => {
    const m = new StarsMini();
    for (const seq of FOLDS) {
      for (const d of seq) m.step(1 / 60, { ...NONE, dir: d });
      tick(m, 1.3);
    }
    assert.equal(m.done, true);
  });

  test('쉬는 동안 누른 방향은 무시된다', () => {
    const m = new StarsMini();
    for (const d of FOLDS[0]) m.step(1 / 60, { ...NONE, dir: d });
    m.step(1 / 60, { ...NONE, dir: FOLDS[1][0] });
    assert.equal(m.fold, 0);
  });
});

describe('천 번째 별', () => {
  test('별 하나만 접으면 끝', () => {
    const m = makeMini('star1000') as StarsMini;
    for (const d of FOLDS[0]) m.step(1 / 60, { ...NONE, dir: d });
    tick(m, 1.3);
    assert.equal(m.done, true);
    assert.equal(m.star, 1);
  });
});

describe('촛불 끄기', () => {
  const blow = (m: CandlesMini, secs: number) => {
    tick(m, secs, { ...NONE, hold: true });
    m.step(1 / 60, NONE);
  };
  test('알맞게 들이쉬고 놓으면 셋, 조금이면 하나, 너무 짧으면 그대로', () => {
    const mid = (BREATH.zone[0] + BREATH.zone[1]) / 2 / BREATH.rise;
    const m = new CandlesMini();
    blow(m, mid);
    assert.equal(m.lit, BREATH.candles - 3);
    blow(m, 0.4 / BREATH.rise);
    assert.equal(m.lit, BREATH.candles - 4);
    blow(m, 0.1);
    assert.equal(m.lit, BREATH.candles - 4);
  });

  test('너무 오래 들이쉬면 콜록 (그동안 못 분다), 촛불이 다 꺼지면 끝', () => {
    const m = new CandlesMini();
    tick(m, 1 / BREATH.rise + 0.1, { ...NONE, hold: true });
    assert.ok(m.cough > 0);
    assert.ok(m.sfx.includes('cough'));
    assert.equal(m.lit, BREATH.candles);
    tick(m, 1.1);
    const mid = (BREATH.zone[0] + BREATH.zone[1]) / 2 / BREATH.rise;
    for (let i = 0; i < 3; i++) blow(m, mid);
    assert.equal(m.lit, 0);
    assert.equal(m.done, true);
  });
});

describe('바느질', () => {
  test('바늘이 표시 위에 있을 때 누르면 한 땀, 아니면 빗나감', () => {
    const m = new SewMini();
    m.t = m.mark;
    m.step(0, { ...NONE, act: true });
    assert.equal(m.stitches, 1);
    m.t = Math.min(1, m.mark + SEW.zone + 0.2);
    m.step(0, { ...NONE, act: true });
    assert.equal(m.stitches, 1);
    assert.ok(m.miss > 0);
  });

  test('바늘은 0~1 사이를 오간다, 여섯 땀이면 끝', () => {
    const m = new SewMini();
    for (let i = 0; i < 600; i++) {
      m.step(1 / 60, NONE);
      assert.ok(m.t >= 0 && m.t <= 1);
    }
    for (let i = 0; i < SEW.stitches; i++) {
      m.t = m.mark;
      m.step(0, { ...NONE, act: true });
    }
    assert.equal(m.done, true);
  });
});

describe('인형극', () => {
  test('줄마다 맞는 인형을 고르면 다음 줄, 틀리면 하루가 웃는 말', () => {
    const m = new PuppetMini();
    const wrong = PUPPETS.findIndex((p) => p !== PUPPET_CUES[0].answer);
    while (m.sel !== wrong) m.step(1 / 60, { ...NONE, dir: 'right' });
    m.step(1 / 60, { ...NONE, act: true });
    assert.equal(m.silly, PUPPET_CUES[0].silly);
    assert.equal(m.cue, 0);
    for (const c of PUPPET_CUES) {
      const want = PUPPETS.indexOf(c.answer);
      while (m.sel !== want) m.step(1 / 60, { ...NONE, dir: 'left' });
      m.step(1 / 60, { ...NONE, act: true });
      tick(m, 1.5);
    }
    assert.equal(m.done, true);
  });

  test('고르기는 양 끝에서 돌아간다', () => {
    const m = new PuppetMini();
    m.step(1 / 60, { ...NONE, dir: 'left' });
    assert.equal(m.sel, PUPPETS.length - 1);
    m.step(1 / 60, { ...NONE, dir: 'right' });
    assert.equal(m.sel, 0);
  });
});

describe('태엽 감기', () => {
  test('누를 때마다 감기고, 쉬면 조금씩 풀린다. 끝까지 감으면 끝', () => {
    const m = new WindMini();
    m.step(1 / 60, { ...NONE, act: true });
    assert.equal(m.v, WIND.per);
    tick(m, 0.5);
    assert.ok(m.v < WIND.per && m.v > 0);
    for (let i = 0; i < 40 && !m.done; i++) m.step(1 / 60, { ...NONE, act: true });
    assert.equal(m.done, true);
    assert.equal(m.v, 1);
  });
});

describe('놀이 목록', () => {
  test('이름으로 만들 수 있고, 없는 이름은 오류', () => {
    assert.deepEqual([...MINI_IDS].sort(), ['candles', 'puppet', 'sew', 'star1000', 'stars', 'wind']);
    for (const id of MINI_IDS) assert.equal(makeMini(id).id, id);
    assert.throws(() => makeMini('nope'));
  });
});
