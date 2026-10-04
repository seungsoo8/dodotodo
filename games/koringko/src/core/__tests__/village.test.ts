import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { newSave } from '../character.ts';
import { friendBonus, rescueNeed } from '../friends.ts';
import { changeMap } from '../game.ts';
import { joinParty } from '../party.ts';
import { FACILITIES, VILLAGE, facilities } from '../village.ts';
import { idle, placeAt, play } from './helpers.ts';

const withFriends = (n: number) => Array.from({ length: n }, (_, i) => `f${i}`);

describe('블록 마을 시설', () => {
  test('시설은 마을 단계에 맞춰 하나씩 생긴다', () => {
    const s = newSave(0, 'toby');
    assert.deepEqual(facilities(s), []);
    s.rescued = withFriends(3);
    assert.deepEqual(facilities(s), ['house']);
    s.rescued = withFriends(15);
    assert.deepEqual(facilities(s), FACILITIES.map((f) => f.id));
    for (const f of FACILITIES) assert.ok(f.name && f.desc, f.id);
  });

  test('쉼터 방석(3단계): 방에서 마을로 돌아오면 탐험대 모두 HP · 태엽이 가득 찬다', () => {
    const g = play('toby', 'toybox');
    joinParty(g.save, 'bori');
    g.save.bench.bori!.hp = 5;
    g.save.hp = 10;
    g.save.sp = 0;
    g.save.rescued = withFriends(6);
    changeMap(g, 'village');
    assert.equal(g.save.hp, g.stats.maxHp);
    assert.equal(g.save.sp, g.stats.maxSp);
    assert.ok(g.save.bench.bori!.hp > 5);
  });

  test('쉼터가 없으면 돌아와도 그대로다', () => {
    const g = play('toby', 'toybox');
    g.save.hp = 10;
    g.save.rescued = withFriends(3);
    changeMap(g, 'village');
    assert.equal(g.save.hp, 10);
  });

  test('사탕 공장(4단계): 방에서 돌아올 때마다 사탕을 준다 (마을 안에서는 아니다)', () => {
    const g = play('toby', 'toybox');
    g.save.rescued = withFriends(9);
    const c = g.save.potions.hp;
    changeMap(g, 'village');
    assert.equal(g.save.potions.hp, c + VILLAGE.candy);
    changeMap(g, 'village');
    assert.equal(g.save.potions.hp, c + VILLAGE.candy, '마을에서 마을로는 주지 않는다');
  });

  test('놀이터(5단계): 경험치가 더 들어온다', () => {
    const exp = (friends: number) => {
      const g = play('toby', 'toybox');
      g.save.rescued = withFriends(friends);
      g.save.lv = 1;
      g.save.exp = 0;
      placeAt(g, 'wolf', 200, 0, 4).hp = 0;
      idle(g, 0.05);
      const e = g.world.events.find((x) => x.kind === 'kill');
      return e && e.kind === 'kill' ? e.exp : 0;
    };
    assert.ok(exp(12) >= Math.floor(exp(9) * (1 + VILLAGE.expPct) - 1) && exp(12) > exp(9));
  });

  test('축제 무대(6단계): 단추가 더 들어온다', () => {
    const s = newSave(0, 'toby');
    s.rescued = withFriends(14);
    assert.equal(friendBonus(s).goldPct ?? 0, 0);
    s.rescued = withFriends(15);
    assert.equal(friendBonus(s).goldPct, VILLAGE.goldPct);
  });

  test('친구를 구해 마을 단계가 오르면 알린다', () => {
    const g = play('toby', 'toybox');
    g.save.rescued = withFriends(2);
    g.save.friends.fluff = rescueNeed('fluff') - 1;
    placeAt(g, 'fluff', 200, 0, 1).hp = 0;
    idle(g, 0.05);
    const up = g.world.events.find((e) => e.kind === 'villageUp');
    assert.ok(up && up.kind === 'villageUp' && up.lv === 2 && up.facility === 'house');
  });
});
