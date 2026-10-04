import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MONSTERS } from '../../core/monsters.ts';
import { bookGroups } from '../book.ts';

test('도감: 모든 장난감이 꼭 한 번씩, 방 순서대로 실린다 (나뉜 꼬마 젤리는 젤리 옆)', () => {
  const groups = bookGroups();
  const all = groups.flatMap((g) => g.ids);
  assert.equal(all.length, new Set(all).size, '겹치지 않는다');
  assert.deepEqual([...all].sort(), Object.keys(MONSTERS).filter((id) => !MONSTERS[id].summon).sort(), '보스가 부른 분신은 빼고 모두');
  assert.equal(groups[0].name, '장난감 상자');
  assert.ok(groups[0].ids.includes('fluff') && groups[0].ids.includes('b_bear'));
  const drawer = groups.find((g) => g.name === '과자 서랍')!;
  assert.equal(drawer.ids[drawer.ids.indexOf('jelly') + 1], 'jellet');
});
