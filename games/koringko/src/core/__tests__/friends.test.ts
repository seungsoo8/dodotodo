import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { newSave } from '../character.ts';
import { cleanToy, friendBonus, rescueNeed, villageLevel } from '../friends.ts';
import { refreshStats } from '../combat.ts';
import { idle, placeAt, play } from './helpers.ts';

describe('구해 주면 친구', () => {
  test('같은 장난감을 여러 번 깨끗하게 하면 구출, 보스는 한 번에', () => {
    const s = newSave(0);
    const need = rescueNeed('fluff');
    assert.ok(need > 1);
    for (let i = 0; i < need - 1; i++) assert.equal(cleanToy(s, 'fluff'), false);
    assert.equal(cleanToy(s, 'fluff'), true);
    assert.deepEqual(s.rescued, ['fluff']);
    assert.equal(cleanToy(s, 'fluff'), false, '이미 친구');
    assert.equal(rescueNeed('b_bear'), 1);
    assert.equal(cleanToy(s, 'b_bear'), true);
  });

  test('친구가 셋 모일 때마다 마을 단계가 오르고 (최대 6), 친구마다 공격 · HP 가 오른다', () => {
    const s = newSave(0);
    assert.equal(villageLevel(s), 1);
    s.rescued = ['a', 'b', 'c'];
    assert.equal(villageLevel(s), 2);
    s.rescued = Array.from({ length: 40 }, (_, i) => `m${i}`);
    assert.equal(villageLevel(s), 6);
    s.rescued = ['a', 'b'];
    assert.deepEqual(friendBonus(s), { atkPct: 0.02, hpPct: 0.02 });
  });

  test('싸움에서: 쓰러뜨리면 깨끗해지고, 구출되면 알리고 탐험대가 세진다', () => {
    const g = play('toby', 'forest');
    g.save.friends.fluff = rescueNeed('fluff') - 1;
    const atk = g.stats.atk;
    placeAt(g, 'fluff', 200, 0, 1).hp = 0;
    idle(g, 0.05);
    assert.ok(g.world.events.some((e) => e.kind === 'friend' && e.defId === 'fluff'));
    assert.ok(g.save.rescued.includes('fluff'));
    refreshStats(g);
    assert.ok(g.stats.atk > atk);
  });
});
