import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { findItem } from '../../core/data.ts';
import { applyItem } from '../../core/game.ts';
import { quietGame } from '../../core/__tests__/helpers.ts';
import { OWNED_ROW, hitTestOwned, ownedGroups } from '../owned.ts';

describe('보유 무기 목록', () => {
  test('같은 무기·같은 ★ 끼리 묶고, 계열 순서 → ★ 높은 순으로 보여준다', () => {
    const s = quietGame();
    for (const id of ['mortar', 'sling', 'sling', 'sling', 'sling', 'longbow']) applyItem(s, findItem(id));
    const groups = ownedGroups(s);
    assert.deepEqual(
      groups.map((g) => [g.id, g.level, g.count]),
      [
        ['sling', 2, 1],
        ['sling', 1, 1],
        ['longbow', 1, 1],
        ['mortar', 1, 1],
      ],
    );
  });

  test('각 묶음은 판매할 때 쓸 실제 무기 칸 번호를 가진다', () => {
    const s = quietGame();
    applyItem(s, findItem('sling'));
    applyItem(s, findItem('sling'));
    const [g] = ownedGroups(s);
    assert.equal(g.count, 2);
    assert.deepEqual([...g.indices].sort(), [0, 1]);
    for (const i of g.indices) assert.equal(s.weapons[i].def.id, 'sling');
  });

  test('목록 줄을 누르면 그 묶음 번호, 목록 밖이면 null', () => {
    const s = quietGame();
    applyItem(s, findItem('sling'));
    applyItem(s, findItem('mortar'));
    const groups = ownedGroups(s);
    assert.equal(hitTestOwned(groups, OWNED_ROW.x + 5, OWNED_ROW.y + OWNED_ROW.h * 1 + 2), 1);
    assert.equal(hitTestOwned(groups, OWNED_ROW.x + 5, OWNED_ROW.y + 2), 0);
    assert.equal(hitTestOwned(groups, OWNED_ROW.x + 5, OWNED_ROW.y + OWNED_ROW.h * 2 + 2), null);
    assert.equal(hitTestOwned(groups, 400, OWNED_ROW.y + 2), null);
  });
});
