import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { formatTime, topDamage } from '../summary.ts';

describe('결과 화면: 무기별 피해 순위', () => {
  test('스킬·특전 피해는 한글 이름으로 보인다 (메테오·시체 폭발)', () => {
    const rows = topDamage({ meteor: 300, corpse_blast: 100 }, 2);
    assert.deepEqual(
      rows.map((r) => r.name),
      ['메테오', '시체 폭발'],
    );
  });

  test('피해가 큰 순서로 이름과 비율(%)을 돌려준다', () => {
    const rows = topDamage({ sling: 100, mortar: 300, thorns: 100 }, 3);
    assert.deepEqual(rows, [
      { id: 'mortar', name: '박격포', damage: 300, percent: 60 },
      { id: 'sling', name: '돌팔매', damage: 100, percent: 20 },
      { id: 'thorns', name: '가시', damage: 100, percent: 20 },
    ]);
  });

  test('개수 제한만큼만 돌려준다', () => {
    assert.equal(topDamage({ sling: 1, mortar: 2, longbow: 3 }, 2).length, 2);
  });

  test('피해가 0 인 항목은 빼고, 아무 피해도 없으면 빈 목록', () => {
    assert.deepEqual(topDamage({ sling: 0 }, 3), []);
    assert.deepEqual(topDamage({}, 3), []);
  });

  test('비율은 정수로 반올림한다', () => {
    const rows = topDamage({ sling: 1, mortar: 2 }, 2);
    assert.deepEqual(
      rows.map((r) => r.percent),
      [67, 33],
    );
  });
});

describe('시간 표시', () => {
  test('초를 "분:초" 로 바꾼다 (초는 두 자리)', () => {
    assert.equal(formatTime(0), '0:00');
    assert.equal(formatTime(59.9), '0:59');
    assert.equal(formatTime(60), '1:00');
    assert.equal(formatTime(305), '5:05');
  });
});
