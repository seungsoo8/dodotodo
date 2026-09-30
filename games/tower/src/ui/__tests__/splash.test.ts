import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyMeta } from '../../core/meta.ts';
import { SPLASH, afterSplash, splashFrame, splashPress } from '../splash.ts';

describe('타이틀 화면 연출 순서', () => {
  test('처음에는 별이 하늘 위에서 떨어지기 시작하고, 로고·안내는 아직 없다', () => {
    const f = splashFrame(0);
    assert.equal(f.fall, 0);
    assert.equal(f.burst, 0);
    assert.equal(f.logo, 0);
    assert.equal(f.prompt, false);
  });

  test('별은 SPLASH.fall 초 동안 떨어져 땅에 닿는다 (중간엔 절반쯤)', () => {
    assert.ok(Math.abs(splashFrame(SPLASH.fall / 2).fall - 0.5) < 1e-9);
    assert.equal(splashFrame(SPLASH.fall).fall, 1);
    assert.equal(splashFrame(SPLASH.fall + 5).fall, 1);
  });

  test('떨어진 순간 번쩍이고(burst 1) 곧 사그라든다', () => {
    assert.equal(splashFrame(SPLASH.fall - 0.01).burst, 0);
    assert.equal(splashFrame(SPLASH.fall).burst, 1);
    assert.equal(splashFrame(SPLASH.fall + SPLASH.burst).burst, 0);
  });

  test('안개가 차오른 뒤 로고가 떠오르고, 다 뜨면 "눌러 시작" 이 나온다', () => {
    assert.equal(splashFrame(SPLASH.fall).fog, 0);
    assert.equal(splashFrame(SPLASH.logoAt).fog, 1);
    assert.equal(splashFrame(SPLASH.logoAt - 0.01).logo, 0);
    assert.equal(splashFrame(SPLASH.logoAt + SPLASH.logoIn).logo, 1);
    assert.equal(splashFrame(SPLASH.promptAt - 0.01).prompt, false);
    assert.equal(splashFrame(SPLASH.promptAt).prompt, true);
  });
});

describe('타이틀 화면에서 누르기', () => {
  test('연출 중에 누르면 넘어가지 않고 연출을 끝으로 건너뛴다', () => {
    const r = splashPress(0.5);
    assert.deepEqual(r, { kind: 'skip', t: SPLASH.promptAt });
  });

  test('"눌러 시작" 이 뜬 뒤 누르면 시작', () => {
    assert.deepEqual(splashPress(SPLASH.promptAt), { kind: 'start' });
    assert.deepEqual(splashPress(SPLASH.promptAt + 10), { kind: 'start' });
  });

  test('처음이면(튜토리얼 안 함) 튜토리얼로, 해 봤으면 메뉴로', () => {
    assert.equal(afterSplash(emptyMeta()), 'lesson');
    assert.equal(afterSplash({ ...emptyMeta(), lessonDone: true }), 'menu');
  });
});
