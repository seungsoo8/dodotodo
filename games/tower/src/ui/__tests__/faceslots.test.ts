import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { findItem } from '../../core/data.ts';
import { FACES } from '../../core/faces.ts';
import { applyItem, selectFace } from '../../core/game.ts';
import { quietGame } from '../../core/__tests__/helpers.ts';
import { faceClick, hitTestFaces, sellButtonRect, slotRect, weaponsOn } from '../faceslots.ts';
import { TOWER_SCALE, TOWER_SPRITE } from '../sprites.ts';
import type { Rect } from '../layout.ts';

const tower = { x: 320, y: 180, radius: 24 };
const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const center = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

describe('탑 둘레 무기 칸 자리', () => {
  const top = tower.y + tower.radius - TOWER_SPRITE.height * TOWER_SCALE;
  const halfW = (TOWER_SPRITE.width * TOWER_SCALE) / 2;

  test('북쪽 칸은 탑 그림 위, 남쪽은 탑 아래, 동쪽은 오른쪽, 서쪽은 왼쪽', () => {
    for (let k = 0; k < 3; k++) {
      assert.ok(slotRect(tower, 'n', k, 3).y + slotRect(tower, 'n', k, 3).h <= top);
      assert.ok(slotRect(tower, 's', k, 3).y >= tower.y + tower.radius);
      assert.ok(slotRect(tower, 'e', k, 3).x >= tower.x + halfW);
      assert.ok(slotRect(tower, 'w', k, 3).x + slotRect(tower, 'w', k, 3).w <= tower.x - halfW);
    }
  });

  test('모든 칸은 서로 겹치지 않는다', () => {
    const all = FACES.flatMap((f) => [0, 1, 2].map((k) => slotRect(tower, f, k, 3)));
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) assert.ok(!overlap(all[i], all[j]), `${i}·${j}`);
  });

  test('칸 수가 줄면 (요새: 2칸) 가운데로 모인다', () => {
    const two = [0, 1].map((k) => center(slotRect(tower, 'n', k, 2)).x);
    assert.ok(Math.abs((two[0] + two[1]) / 2 - tower.x) < 1e-9);
  });

  test('칸 가운데를 누르면 그 면·그 칸, 멀리 누르면 없음', () => {
    for (const f of FACES) {
      for (let k = 0; k < 3; k++) {
        const c = center(slotRect(tower, f, k, 3));
        assert.deepEqual(hitTestFaces(tower, 3, c.x, c.y), { face: f, slot: k });
      }
    }
    assert.equal(hitTestFaces(tower, 3, 20, 20), null);
    assert.equal(hitTestFaces(tower, 3, tower.x, tower.y), null, '탑 한가운데는 칸이 아니다');
  });

  test('판매 버튼은 고른 칸 바깥쪽에 붙고 다른 칸과 겹치지 않는다', () => {
    const all = FACES.flatMap((f) => [0, 1, 2].map((k) => slotRect(tower, f, k, 3)));
    for (const f of FACES) {
      const b = sellButtonRect(tower, f, 1, 3);
      for (const r of all) assert.ok(!overlap(b, r), f);
    }
  });
});

describe('칸을 눌렀을 때 할 일', () => {
  function game() {
    const s = quietGame();
    selectFace(s, 'n');
    applyItem(s, findItem('sling'));
    applyItem(s, findItem('mortar'));
    selectFace(s, 'e');
    applyItem(s, findItem('longbow'));
    return s;
  }

  test('면마다 무기를 순서대로 모은다', () => {
    const s = game();
    assert.deepEqual(weaponsOn(s, 'n'), [0, 1]);
    assert.deepEqual(weaponsOn(s, 'e'), [2]);
    assert.deepEqual(weaponsOn(s, 'w'), []);
  });

  test('아무것도 안 집었을 때: 빈 칸은 그 면 고르기, 무기 칸은 그 무기 집기', () => {
    const s = game();
    assert.deepEqual(faceClick(s, null, { face: 'w', slot: 0 }), { kind: 'select', face: 'w' });
    assert.deepEqual(faceClick(s, null, { face: 'n', slot: 1 }), { kind: 'pick', index: 1, face: 'n' });
    assert.deepEqual(faceClick(s, null, { face: 'n', slot: 2 }), { kind: 'select', face: 'n' });
  });

  test('집은 채로 다른 면을 누르면 그 면으로 옮기기', () => {
    const s = game();
    assert.deepEqual(faceClick(s, 0, { face: 's', slot: 0 }), { kind: 'move', index: 0, face: 's' });
    assert.deepEqual(faceClick(s, 0, { face: 'e', slot: 0 }), { kind: 'move', index: 0, face: 'e' });
  });

  test('집은 무기를 다시 누르면 내려놓기, 같은 면 다른 무기를 누르면 그걸 집기', () => {
    const s = game();
    assert.deepEqual(faceClick(s, 0, { face: 'n', slot: 0 }), { kind: 'cancel' });
    assert.deepEqual(faceClick(s, 0, { face: 'n', slot: 1 }), { kind: 'pick', index: 1, face: 'n' });
    assert.deepEqual(faceClick(s, 0, { face: 'n', slot: 2 }), { kind: 'select', face: 'n' });
  });
});
