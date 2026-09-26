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

  test('무기 칸은 한 줄에 5칸씩, 10칸이 겹치지 않고 두 줄 안에 들어간다', () => {
    const rects = Array.from({ length: 10 }, (_, i) => tileRect(i));
    for (let i = 0; i < 10; i++) {
      for (let j = i + 1; j < 10; j++) {
        const a = rects[i];
        const b = rects[j];
        assert.ok(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y, `${i}·${j} 겹침`);
      }
    }
    assert.equal(rects[4].y, rects[0].y, '0~4 는 같은 줄');
    assert.ok(rects[5].y > rects[0].y, '5 부터 다음 줄');
    assert.equal(rects[5].x, rects[0].x);
    for (const r of rects) assert.ok(r.x + r.w <= OWNED.x + OWNED.w, '패널 폭 안');
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

  test('세트 칩은 무기 칸 줄 바로 아래에 놓인다 (칸이 한 줄이면 한 줄 아래, 두 줄이면 두 줄 아래)', () => {
    const oneRow = setChipRect(0, 3);
    const twoRows = setChipRect(0, 7);
    assert.ok(oneRow.y >= tileRect(0).y + tileRect(0).h);
    assert.ok(oneRow.y < tileRect(5).y + tileRect(5).h);
    assert.ok(twoRows.y >= tileRect(5).y + tileRect(5).h);
    assert.ok(setChipRect(1, 3).x > oneRow.x, '칩은 가로로 늘어선다');
  });

  test('세트 칩을 누르면 그 칩 번호, 없는 칩은 null', () => {
    const c = setChipRect(1, 3);
    assert.equal(hitTestSetChip(2, 3, c.x + 1, c.y + 1), 1);
    const c2 = setChipRect(2, 3);
    assert.equal(hitTestSetChip(2, 3, c2.x + 1, c2.y + 1), null);
  });

  test('빈 칸은 지금 줄만 채운다: 묶음 2개면 5칸, 묶음 6개(무기 7개)면 둘째 줄을 남은 3칸만큼 → 9칸', () => {
    const s = quietGame();
    for (const id of ['sling', 'sling', 'mortar']) applyItem(s, findItem(id));
    assert.equal(ownedTileCount(s, ownedGroups(s)), 5);
    for (const id of ['longbow', 'chain_bolt', 'frost_orb', 'chaos_orb']) applyItem(s, findItem(id));
    assert.equal(ownedGroups(s).length, 6);
    assert.equal(ownedTileCount(s, ownedGroups(s)), 9);
  });

  test('남은 무기 칸보다 많이 채우지는 않는다 (칸이 꽉 차면 묶음 수만큼)', () => {
    const s = quietGame({ tower: { weaponSlots: 3 } });
    for (const id of ['sling', 'mortar']) applyItem(s, findItem(id));
    assert.equal(ownedTileCount(s, ownedGroups(s)), 3);
    applyItem(s, findItem('longbow'));
    assert.equal(ownedTileCount(s, ownedGroups(s)), 3);
  });

  test('무기가 없으면 빈 칸 한 줄', () => {
    const s = quietGame();
    assert.equal(ownedTileCount(s, ownedGroups(s)), 5);
  });
});
