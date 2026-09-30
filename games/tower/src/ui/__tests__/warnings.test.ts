import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { findItem } from '../../core/data.ts';
import { applyItem, selectFace } from '../../core/game.ts';
import { quietGame } from '../../core/__tests__/helpers.ts';
import type { GameEvent } from '../../core/types.ts';
import { EMPTY_WARN_COOLDOWN, emptyFaceHits, shouldWarn } from '../warnings.ts';

const hit = (face: 'n' | 'e' | 's' | 'w'): GameEvent => ({ kind: 'towerHit', amount: 5, face });

describe('빈 면으로 맞았을 때 알림', () => {
  test('무기가 없는 면으로 맞은 것만, 면마다 한 번씩 고른다', () => {
    const s = quietGame();
    selectFace(s, 'e');
    applyItem(s, findItem('sling'));
    assert.deepEqual(emptyFaceHits(s, [hit('e'), hit('n'), hit('n'), hit('w'), { kind: 'round', round: 2 }]), ['n', 'w']);
  });

  test('무기가 있는 면으로만 맞았으면 알릴 것이 없다', () => {
    const s = quietGame();
    selectFace(s, 's');
    applyItem(s, findItem('sling'));
    assert.deepEqual(emptyFaceHits(s, [hit('s')]), []);
  });

  test(`같은 면 알림은 ${EMPTY_WARN_COOLDOWN}초에 한 번만 (다른 면은 따로)`, () => {
    const last: Partial<Record<'n' | 'e' | 's' | 'w', number>> = {};
    assert.equal(shouldWarn(last, 'n', 10), true);
    last.n = 10;
    assert.equal(shouldWarn(last, 'n', 10 + EMPTY_WARN_COOLDOWN - 0.1), false);
    assert.equal(shouldWarn(last, 'e', 11), true);
    assert.equal(shouldWarn(last, 'n', 10 + EMPTY_WARN_COOLDOWN), true);
  });
});
