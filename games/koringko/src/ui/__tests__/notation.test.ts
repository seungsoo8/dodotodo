import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { noteMidi, parseChords, parseTune } from '../audio/notation.ts';

describe('음 이름 → MIDI', () => {
  test('가온 다(C4)는 60, 라(A4)는 69, 올림 · 내림표', () => {
    assert.equal(noteMidi('C4'), 60);
    assert.equal(noteMidi('A4'), 69);
    assert.equal(noteMidi('F#5'), 78);
    assert.equal(noteMidi('Bb4'), 70);
    assert.equal(noteMidi('C7'), 96);
    assert.equal(noteMidi('B2'), 47);
  });

  test('이상한 이름은 오류', () => {
    assert.throws(() => noteMidi('H4'));
    assert.throws(() => noteMidi('C'));
    assert.throws(() => noteMidi('E#x'));
  });
});

describe('가락 적기 (마디는 |, 음:길이, 쉼 r, 이어 끌기 -)', () => {
  test('마디마다 칸 위치를 이어 센다', () => {
    const t = parseTune('E5:4 G5:4 A5:6 G5:2 | C5:16', 16);
    assert.deepEqual(t.notes, [
      [0, 76, 4],
      [4, 79, 4],
      [8, 81, 6],
      [14, 79, 2],
      [16, 72, 16],
    ]);
    assert.deepEqual(t.bars, [16, 16]);
  });

  test('길이를 안 적으면 앞 음의 길이, 쉼은 칸만 건너뛴다', () => {
    const t = parseTune('C5:4 D5 r E5', 16);
    assert.deepEqual(t.notes, [
      [0, 72, 4],
      [4, 74, 4],
      [12, 76, 4],
    ]);
    assert.deepEqual(t.bars, [16]);
  });

  test('- 는 앞 음을 마디를 넘어 늘인다', () => {
    const t = parseTune('C5:16 | -:8 r:8', 16);
    assert.deepEqual(t.notes, [[0, 72, 24]]);
    assert.deepEqual(t.bars, [16, 16]);
  });

  test('3/4 박자 (마디 12칸)도 칸을 이어 센다, 마디 길이 합은 그대로 돌려준다 (검사는 부르는 쪽)', () => {
    const t = parseTune('F5:4 E5:2 F5:2 A5:4 | C5:8', 12);
    assert.deepEqual(t.notes.at(-1), [12, 72, 8]);
    assert.deepEqual(t.bars, [12, 8]);
  });

  test('모르는 낱말은 오류', () => {
    assert.throws(() => parseTune('C5:4 X5:4', 16));
    assert.throws(() => parseTune('C5:0', 16));
  });
});

describe('화음 적기', () => {
  test('근음은 D2~C#3 사이, 장 · 단 · 7 · maj7 · sus4 · 자리바꿈(/베이스) · % 되풀이', () => {
    const h = parseChords('C Am F/A G7 % Dm7 Bbmaj7 Asus4');
    assert.deepEqual(h.chords[0], [48, 52, 55]);
    assert.deepEqual(h.chords[1], [45, 48, 52]);
    assert.deepEqual(h.chords[2], [41, 45, 48]);
    assert.deepEqual(h.chords[3], [43, 47, 50, 53]);
    assert.deepEqual(h.chords[4], h.chords[3]);
    assert.deepEqual(h.chords[5], [38, 41, 45, 48]);
    assert.deepEqual(h.chords[6], [46, 50, 53, 57]);
    assert.deepEqual(h.chords[7], [45, 50, 52]);
    assert.equal(h.bass[2], 45, 'F/A 의 베이스는 A');
    assert.equal(h.bass[0], 48, '자리바꿈이 없으면 근음');
  });

  test('모르는 화음은 오류', () => {
    assert.throws(() => parseChords('C Hm'));
    assert.throws(() => parseChords('% C'));
  });
});
