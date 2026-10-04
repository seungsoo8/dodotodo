import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newSave } from '../character.ts';
import { powerChange } from '../compare.ts';
import { computeStats, power } from '../stats.ts';
import type { Item } from '../types.ts';

function weapon(min: number, max: number, req = 1): Item {
  return { uid: 'w', slot: 'weapon', name: '시험 검', rarity: 'normal', ilvl: 1, req, dmg: [min, max], spd: 1, affixes: [], plus: 0, hero: 'toby' };
}

test('전투력 비교: 더 센 무기를 끼면 전투력이 오르고, 그 차이를 돌려준다', () => {
  const save = newSave('toby', '시험');
  const before = power(computeStats(save));
  const d = powerChange(save, weapon(30, 40));
  assert.ok(d > 0);
  save.gear.weapon = weapon(30, 40);
  assert.equal(before + d, power(computeStats(save)));
});

test('전투력 비교: 원래 저장 내용은 바뀌지 않는다', () => {
  const save = newSave('toby', '시험');
  const had = save.gear.weapon;
  powerChange(save, weapon(30, 40));
  assert.equal(save.gear.weapon, had);
});

test('전투력 비교: 지금 낀 것과 같은 장비면 0, 약한 장비면 음수', () => {
  const save = newSave('toby', '시험');
  save.gear.weapon = weapon(20, 30);
  assert.equal(powerChange(save, save.gear.weapon), 0);
  assert.ok(powerChange(save, weapon(1, 2)) < 0);
});
