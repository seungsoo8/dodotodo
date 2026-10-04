import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keyAction, moveFromKeys } from '../keys.ts';

test('키 배치: 레퍼런스처럼 Z 공격 · X 구르기 · A S D F 스킬 · Q W 물약', () => {
  assert.equal(keyAction('KeyZ'), 'attack');
  assert.equal(keyAction('KeyX'), 'roll');
  assert.equal(keyAction('KeyA'), 'skillA');
  assert.equal(keyAction('KeyS'), 'skillS');
  assert.equal(keyAction('KeyD'), 'skillD');
  assert.equal(keyAction('KeyF'), 'skillF');
  assert.equal(keyAction('KeyQ'), 'potionHp');
  assert.equal(keyAction('KeyW'), 'potionSp');
});

test('키 배치: 확인 · 취소 · 메뉴 단축키, 모르는 키는 null', () => {
  assert.equal(keyAction('Enter'), 'attack');
  assert.equal(keyAction('Space'), 'attack');
  assert.equal(keyAction('Escape'), 'menu');
  assert.equal(keyAction('KeyI'), 'bag');
  assert.equal(keyAction('KeyC'), 'status');
  assert.equal(keyAction('KeyK'), 'skills');
  assert.equal(keyAction('KeyJ'), 'quests');
  assert.equal(keyAction('KeyP'), null);
});

test('방향키 이동: 대각선은 길이 1 로 맞춘다, 반대 키는 서로 지운다', () => {
  assert.deepEqual(moveFromKeys(new Set(['ArrowRight'])), { x: 1, y: 0 });
  const d = moveFromKeys(new Set(['ArrowRight', 'ArrowUp']));
  assert.ok(Math.abs(d.x - Math.SQRT1_2) < 1e-9 && Math.abs(d.y + Math.SQRT1_2) < 1e-9);
  assert.deepEqual(moveFromKeys(new Set(['ArrowLeft', 'ArrowRight'])), { x: 0, y: 0 });
  assert.deepEqual(moveFromKeys(new Set()), { x: 0, y: 0 });
});
