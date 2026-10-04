import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { newSave } from '../character.ts';
import { buildMap, isSolid, TILE } from '../maps.ts';
import { accept, canAccept, onKill, progress, QUEST_BY_ID, QUESTS, errandsHere } from '../quests.ts';
import { NPCS } from '../story.ts';
import { tileCenter } from '../world.ts';
import { changeMap } from '../game.ts';
import { idle, play } from './helpers.ts';

describe('심부름: 방에 떨어진 물건 찾아 오기', () => {
  test('모든 심부름 물건은 그 방의 걸을 수 있는 자리에 있다', () => {
    const errands = QUESTS.filter((q) => q.kind === 'fetch');
    assert.ok(errands.length >= 4);
    for (const q of errands) {
      const f = q.fetch!;
      assert.ok(!isSolid(buildMap(f.map), f.x, f.y), q.id);
      assert.ok(f.item.length > 0);
    }
  });

  test('받은 뒤 그 자리에 가면 물건을 줍고 보고할 수 있다 (받기 전에는 없다)', () => {
    const g = play('toby', 'toybox');
    g.save.rescued.push('mouse');
    const q = QUEST_BY_ID.q_cheese;
    const f = q.fetch!;
    changeMap(g, f.map);
    g.world.player.x = tileCenter(f.x);
    g.world.player.y = tileCenter(f.y);
    assert.deepEqual(errandsHere(g.save, f.map), [], '받기 전에는 물건이 보이지 않는다');
    idle(g, 0.1);
    assert.equal(progress(g.save, 'q_cheese').state, 'none');
    assert.equal(accept(g.save, 'q_cheese'), true);
    assert.equal(errandsHere(g.save, f.map).length, 1);
    idle(g, 0.1);
    assert.equal(progress(g.save, 'q_cheese').state, 'ready');
    assert.ok(g.world.events.some((e) => e.kind === 'errand' && e.item === f.item));
    assert.deepEqual(errandsHere(g.save, f.map), [], '주운 뒤에는 사라진다');
  });

  test('멀리 있으면 줍지 않는다', () => {
    const g = play('toby', 'toybox');
    g.save.rescued.push('mouse');
    accept(g.save, 'q_cheese');
    const f = QUEST_BY_ID.q_cheese.fetch!;
    changeMap(g, f.map);
    g.world.player.x = tileCenter(f.x) + TILE * 3;
    g.world.player.y = tileCenter(f.y);
    idle(g, 0.1);
    assert.equal(progress(g.save, 'q_cheese').state, 'active');
  });
});

describe('친구 부탁: 블록 마을 게시판', () => {
  test('게시판 부탁은 그 친구를 구해야 받을 수 있다', () => {
    const s = newSave(0, 'toby');
    const board = QUESTS.filter((q) => q.giver === 'board');
    assert.ok(board.length >= 4);
    for (const q of board) {
      assert.ok(q.req.rescued, q.id);
      assert.equal(canAccept(s, q), false, `${q.id} 친구를 구하기 전`);
      s.rescued.push(q.req.rescued!);
      assert.equal(canAccept(s, q), true, `${q.id} 친구를 구한 뒤`);
    }
  });

  test('게시판은 블록 마을에 있고, 그림 없이 말을 걸 수 있는 물건이다', () => {
    assert.ok(buildMap('village').npcs.some((n) => n.id === 'board'));
    assert.equal(NPCS.board.prop, true);
  });

  test('젤리 여왕 부탁: 젤리를 깨끗하게 하면 오른다', () => {
    const s = newSave(0, 'toby');
    s.rescued.push('b_jelly');
    const q = QUESTS.find((x) => x.giver === 'board' && x.req.rescued === 'b_jelly')!;
    accept(s, q.id);
    for (let i = 0; i < q.count; i++) onKill(s, q.target);
    assert.equal(progress(s, q.id).state, 'ready');
  });
});
