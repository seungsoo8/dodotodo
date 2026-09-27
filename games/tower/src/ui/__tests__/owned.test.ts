import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { findItem } from '../../core/data.ts';
import { applyItem } from '../../core/game.ts';
import { quietGame } from '../../core/__tests__/helpers.ts';
import { OWNED, hitTestOwned, ownedTileCount, hitTestSetChip, ownedGroups, setChipRect, tileRect } from '../owned.ts';

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

  test('무기 칸 10개가 왼쪽 위에 작은 아이콘 한 줄로, 겹치지 않고 상단 바 아래 좁은 띠 안에 들어간다', () => {
    const rects = Array.from({ length: 10 }, (_, i) => tileRect(i));
    for (let i = 1; i < 10; i++) {
      assert.equal(rects[i].y, rects[0].y, '한 줄');
      assert.ok(rects[i].x >= rects[i - 1].x + rects[i - 1].w, `${i} 겹침`);
    }
    assert.ok(rects[0].y >= 26, '상단 바 아래');
    assert.ok(rects[0].h <= 22, '작은 칸');
    assert.ok(rects[9].x + rects[9].w <= 250, '왼쪽 좁은 띠');
  });

  test('칸을 누르면 그 묶음 번호, 칸 사이 틈·빈 칸·패널 밖은 null', () => {
    const s = quietGame();
    applyItem(s, findItem('sling'));
    applyItem(s, findItem('mortar'));
    const groups = ownedGroups(s);
    const t1 = tileRect(1);
    assert.equal(hitTestOwned(groups, t1.x + 2, t1.y + 2), 1);
    const t0 = tileRect(0);
    assert.equal(hitTestOwned(groups, t0.x + t0.w - 1, t0.y + t0.h - 1), 0);
    assert.equal(hitTestOwned(groups, t0.x + t0.w + 0.5, t0.y + 2), null, '틈');
    const t2 = tileRect(2);
    assert.equal(hitTestOwned(groups, t2.x + 2, t2.y + 2), null, '빈 칸');
    assert.equal(hitTestOwned(groups, 400, 200), null);
  });

  test('세트 칩은 무기 칸 줄 바로 아래에 가로로 늘어선다', () => {
    const c0 = setChipRect(0, 3);
    assert.ok(c0.y >= tileRect(0).y + tileRect(0).h);
    assert.ok(c0.y < tileRect(0).y + tileRect(0).h + 8, '바로 아래');
    assert.ok(setChipRect(1, 3).x > c0.x);
    assert.equal(setChipRect(1, 3).y, c0.y);
  });

  test('세트 칩을 누르면 그 칩 번호, 없는 칩은 null', () => {
    const c = setChipRect(1, 3);
    assert.equal(hitTestSetChip(2, 3, c.x + 1, c.y + 1), 1);
    const c2 = setChipRect(2, 3);
    assert.equal(hitTestSetChip(2, 3, c2.x + 1, c2.y + 1), null);
  });

  test('칸 수 = 무기 묶음 + 남은 무기 칸 (한 줄이라 빈 칸도 모두 보인다)', () => {
    const s = quietGame();
    for (const id of ['sling', 'sling', 'mortar']) applyItem(s, findItem(id));
    assert.equal(ownedTileCount(s, ownedGroups(s)), 2 + 7);
  });

  test('남은 무기 칸보다 많이 채우지는 않는다 (칸이 꽉 차면 묶음 수만큼)', () => {
    const s = quietGame({ tower: { weaponSlots: 3 } });
    for (const id of ['sling', 'mortar']) applyItem(s, findItem(id));
    assert.equal(ownedTileCount(s, ownedGroups(s)), 3);
    applyItem(s, findItem('longbow'));
    assert.equal(ownedTileCount(s, ownedGroups(s)), 3);
  });

  test('무기가 없으면 빈 칸 10개', () => {
    const s = quietGame();
    assert.equal(ownedTileCount(s, ownedGroups(s)), 10);
  });
});
