import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { blipSpec, vowelLevel, lastVoiced, jitterSpec } from '../audio/storysfx.ts';
import type { SoundSpec } from '../audio/sfx.ts';

const hz = (s: SoundSpec) => s[0].freq;
const gain = (s: SoundSpec) => s[0].gain;

describe('말소리 블립: 글자의 모음으로 높이 5단', () => {
  test('모음 높이: ㅜ·ㅡ < ㅗ < ㅓ < ㅏ < ㅣ·ㅔ', () => {
    assert.equal(vowelLevel('우'), 0);
    assert.equal(vowelLevel('그'), 0);
    assert.equal(vowelLevel('고'), 1);
    assert.equal(vowelLevel('서'), 2);
    assert.equal(vowelLevel('가'), 3);
    assert.equal(vowelLevel('이'), 4);
    assert.equal(vowelLevel('네'), 4);
    assert.equal(vowelLevel('할'), 3, '받침이 있어도 모음으로');
  });

  test('한글이 아닌 글자도 0~4 안의 정해진 단 (빈 글자 · 기호 포함)', () => {
    for (const ch of ['a', 'Z', '7', '', '!', '😀']) {
      const v = vowelLevel(ch);
      assert.ok(Number.isInteger(v) && v >= 0 && v <= 4, `${ch} → ${v}`);
      assert.equal(vowelLevel(ch), v, '늘 같다');
    }
  });

  test('같은 사람이 같은 줄을 말하면 블립이 늘 같다 (무작위 없음)', () => {
    assert.deepEqual(blipSpec('toby', '하루야, 어디 가', 3), blipSpec('toby', '하루야, 어디 가', 3));
  });

  test('모음이 높을수록 블립이 높다 (같은 사람, 같은 자리)', () => {
    const u = hz(blipSpec('toby', '우우우우우우우우우', 0));
    const o = hz(blipSpec('toby', '오오오오오오오오오', 0));
    const a = hz(blipSpec('toby', '아아아아아아아아아', 0));
    const i = hz(blipSpec('toby', '이이이이이이이이이', 0));
    assert.ok(u < o && o < a && a < i, `${u} ${o} ${a} ${i}`);
    assert.ok(i / u < 1.6, '다섯 단 폭은 너무 넓지 않게 (반음 몇 개)');
  });

  test('사람마다 기준 높이가 다르다 (루루 > 토비 > 보리)', () => {
    const t = '아아아아아';
    assert.ok(hz(blipSpec('ruru', t, 0)) > hz(blipSpec('toby', t, 0)));
    assert.ok(hz(blipSpec('toby', t, 0)) > hz(blipSpec('bori', t, 0)));
  });
});

describe('말소리 블립: 문장 부호', () => {
  test('? 로 끝나는 줄은 마지막 블립들이 올라가고, 끝으로 갈수록 더 높다', () => {
    const q = '아아아아아아아아아아?';
    const plain = '아아아아아아아아아아.';
    assert.equal(hz(blipSpec('toby', q, 0)), hz(blipSpec('toby', plain, 0)), '앞부분은 같다');
    const last = hz(blipSpec('toby', q, 9));
    const mid = hz(blipSpec('toby', q, 6));
    assert.ok(last > hz(blipSpec('toby', plain, 9)), '끝은 올라간다');
    assert.ok(last > mid && mid > hz(blipSpec('toby', plain, 6)), `${mid} ${last}`);
    assert.ok(hz(blipSpec('toby', q, 3)) === hz(blipSpec('toby', plain, 3)), '마지막 블립 셋(글자 여섯)만');
  });

  test('? 뒤에 따옴표 · 공백이 붙어도 물음으로 본다', () => {
    assert.ok(hz(blipSpec('toby', '아아아아?」 ', 3)) > hz(blipSpec('toby', '아아아아」 ', 3)));
  });

  test('… 가 들어간 줄은 세기 0.6배 · 높이 0.9배', () => {
    const a = blipSpec('gm', '아아아아아아', 1);
    const b = blipSpec('gm', '아아아…아아아', 1);
    assert.ok(Math.abs(gain(b) / gain(a) - 0.6) < 1e-9);
    assert.ok(Math.abs(hz(b) / hz(a) - 0.9) < 1e-9);
    const dots = blipSpec('gm', '아아아...아아아', 1);
    assert.ok(Math.abs(gain(dots) / gain(a) - 0.6) < 1e-9, '... 도 같다');
  });

  test('! 가 있으면 첫 블립만 1.3배 세다', () => {
    const t = '아아아아아아아!';
    const p = '아아아아아아아.';
    assert.ok(Math.abs(gain(blipSpec('toby', t, 0)) / gain(blipSpec('toby', p, 0)) - 1.3) < 1e-9);
    assert.equal(gain(blipSpec('toby', t, 5)), gain(blipSpec('toby', p, 5)));
  });
});

describe('말소리 블립: 사람마다 음색 · 길이', () => {
  test('할머니는 둥근 사인파에 느린 시작 · 긴 블립, 루루는 짧은 사각파', () => {
    const gm = blipSpec('gm', '아아', 0)[0];
    const ruru = blipSpec('ruru', '아아', 0)[0];
    const toby = blipSpec('toby', '아아', 0)[0];
    assert.equal(gm.wave, 'sine');
    assert.equal(ruru.wave, 'square');
    assert.ok(gm.dur > toby.dur && toby.dur > ruru.dur, `${gm.dur} ${toby.dur} ${ruru.dur}`);
    assert.ok((gm.attack ?? 0) > (ruru.attack ?? 0));
    assert.ok((gm.attack ?? 0) < gm.dur, '시작은 길이 안에서 끝난다');
  });

  test('모르는 사람 · 범위 밖 자리여도 소리는 난다 (지문 목소리)', () => {
    const s = blipSpec('nobody', '', 99);
    assert.equal(s.length, 1);
    assert.ok(s[0].freq > 0 && s[0].gain > 0 && s[0].dur > 0);
    assert.deepEqual(blipSpec('nobody', '아', 0)[0].wave, blipSpec('', '아', 0)[0].wave);
  });
});

describe('지금 소리 낼 글자 찾기 (lastVoiced)', () => {
  test('보인 글자 중 마지막 소리 나는 글자 (띄어쓰기 · 부호 건너뜀)', () => {
    assert.equal(lastVoiced('하루야, 가', 4), 2);
    assert.equal(lastVoiced('하루야, 가', 6), 5);
    assert.equal(lastVoiced('하루야, 가', 3.7), 2);
  });

  test('결곗값: 아직 아무것도 안 보였거나 소리 나는 글자가 없으면 -1, 넘치면 끝 글자', () => {
    assert.equal(lastVoiced('하루', 0), -1);
    assert.equal(lastVoiced('… !', 3), -1);
    assert.equal(lastVoiced('하루', 50), 1);
  });
});

describe('되풀이 효과음 흔들기 (jitterSpec)', () => {
  const spec: SoundSpec = [{ kind: 'tone', freq: 1000, to: 500, dur: 0.1, gain: 0.05 }, { kind: 'noise', freq: 2000, dur: 0.2, gain: 0.02, delay: 0.1 }];

  test('가운데 난수(0.5)면 그대로, 양 끝이면 높이 ±4% · 세기 ±10%', () => {
    assert.deepEqual(jitterSpec(spec, () => 0.5), spec);
    const lo = jitterSpec(spec, () => 0);
    assert.ok(Math.abs(lo[0].freq - 960) < 1e-9 && Math.abs(lo[0].to! - 480) < 1e-9);
    assert.ok(Math.abs(lo[0].gain - 0.045) < 1e-9 && Math.abs(lo[1].gain - 0.018) < 1e-9);
    const hi = jitterSpec(spec, () => 1);
    assert.ok(Math.abs(hi[1].freq - 2080) < 1e-9 && Math.abs(hi[1].gain - 0.022) < 1e-9);
  });

  test('겹 전체가 함께 흔들리고 (화음 유지), 원래 소리는 바뀌지 않는다', () => {
    const before = JSON.stringify(spec);
    const j = jitterSpec(spec, () => 0.2);
    assert.ok(Math.abs(j[0].freq / spec[0].freq - j[1].freq / spec[1].freq) < 1e-12);
    assert.equal(JSON.stringify(spec), before);
    assert.equal(j[1].delay, 0.1);
    assert.equal(j[1].to, undefined);
  });
});
