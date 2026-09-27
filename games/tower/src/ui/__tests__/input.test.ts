import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { CHOICE_INPUT_DELAY, END_INPUT_DELAY, inputReady, normalizeKey, shouldIgnoreKey } from '../input.ts';

describe('단축키 (한글 입력 상태에서도)', () => {
  test('물리 키 위치로 읽는다: 한글 자판에서 Q 자리(ㅂ)도 q', () => {
    assert.equal(normalizeKey('KeyQ', 'ㅂ'), 'q');
    assert.equal(normalizeKey('KeyT', 'ㅅ'), 't');
    assert.equal(normalizeKey('KeyR', 'Process'), 'r');
    assert.equal(normalizeKey('KeyQ', 'Q'), 'q', 'Shift·CapsLock 이어도 소문자');
  });

  test('숫자는 윗줄·숫자 패드 모두 같은 숫자', () => {
    assert.equal(normalizeKey('Digit2', '2'), '2');
    assert.equal(normalizeKey('Numpad3', '3'), '3');
  });

  test('나머지 키는 원래 이름 그대로 (Space·Enter·Escape·화살표·Tab)', () => {
    assert.equal(normalizeKey('Space', ' '), ' ');
    assert.equal(normalizeKey('Enter', 'Enter'), 'Enter');
    assert.equal(normalizeKey('Escape', 'Escape'), 'Escape');
    assert.equal(normalizeKey('ArrowLeft', 'ArrowLeft'), 'ArrowLeft');
    assert.equal(normalizeKey('Tab', 'Tab'), 'Tab');
  });

  test('누르고 있어서 반복되는 입력이나 Ctrl·Cmd·Alt 조합은 무시한다 (Ctrl+R 새로 고침 등을 막지 않게)', () => {
    const base = { repeat: false, ctrlKey: false, metaKey: false, altKey: false };
    assert.equal(shouldIgnoreKey(base), false);
    assert.equal(shouldIgnoreKey({ ...base, repeat: true }), true);
    assert.equal(shouldIgnoreKey({ ...base, ctrlKey: true }), true);
    assert.equal(shouldIgnoreKey({ ...base, metaKey: true }), true);
    assert.equal(shouldIgnoreKey({ ...base, altKey: true }), true);
  });
});

describe('화면이 뜨자마자 들어온 입력은 받지 않는다', () => {
  test('보상 카드: 뜬 지 0.4초가 지나야 고를 수 있다 (경곗값 포함)', () => {
    assert.equal(CHOICE_INPUT_DELAY, 0.4);
    assert.equal(inputReady(10, 10.39, CHOICE_INPUT_DELAY), false);
    assert.equal(inputReady(10, 10.4, CHOICE_INPUT_DELAY), true);
  });

  test('결과 화면: 창이 다 뜬 뒤(1.2초)에야 넘길 수 있다', () => {
    assert.equal(END_INPUT_DELAY, 1.2);
    assert.equal(inputReady(5, 6, END_INPUT_DELAY), false);
    assert.equal(inputReady(5, 6.2, END_INPUT_DELAY), true);
  });

  test('아직 열리지 않았으면(null) 받지 않는다', () => {
    assert.equal(inputReady(null, 100, 0.4), false);
  });
});
