import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MONSTERS } from '../../core/monsters.ts';
import { MONSTER_ART_IDS, monsterFrames } from '../art/monsters.ts';
import { PARTS } from '../../core/parts.ts';
import { partIcon } from '../art/icons.ts';
import { CLEAR } from '../art/paint.ts';

test('모든 몬스터는 자기 그림이 있다 (회색 공으로 대신하지 않는다)', () => {
  for (const id of Object.keys(MONSTERS)) assert.ok(MONSTER_ART_IDS.includes(id), id);
  for (const id of ['marble', 'pencil', 'sock']) {
    const [a, b] = monsterFrames(id);
    assert.notDeepEqual(a.px, b.px, `${id} 두 프레임이 다르다`);
  }
});

test('모든 부품은 아이콘이 있고, 서로 다른 부품은 그림도 다르다', () => {
  const seen = new Set<string>();
  for (const [id, p] of Object.entries(PARTS)) {
    const icon = partIcon(id, p.color);
    assert.ok(icon.px.some((v) => v !== CLEAR), id);
    seen.add(Array.from(icon.px).join(','));
  }
  assert.equal(seen.size, Object.keys(PARTS).length);
});
