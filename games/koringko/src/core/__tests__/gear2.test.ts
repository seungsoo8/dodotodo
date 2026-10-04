import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { newSave } from '../character.ts';
import { accept, progress } from '../quests.ts';
import { computeStats } from '../stats.ts';
import { WEAPON_MAX, weaponCost, weaponDamage, upgradeWeapon } from '../weapon.ts';
import { PARTS, craftPart, equipPart, partBonus, partSlots, sewCost, sewPart, unequipPart, hasPartPower } from '../parts.ts';

describe('무기 손질', () => {
  test('무기 단계가 오를수록, 탐험대 레벨이 오를수록 피해가 커진다', () => {
    assert.ok(weaponDamage('toby', 2, 1) > weaponDamage('toby', 1, 1));
    assert.ok(weaponDamage('toby', 1, 10) > weaponDamage('toby', 1, 1));
    assert.ok(weaponDamage('bori', 1, 1) > weaponDamage('toby', 1, 1), '도끼가 더 묵직');
  });

  test('손질은 단추와 재료가 있어야 하고, 최고 단계를 넘지 않는다', () => {
    const s = newSave(0);
    s.lv = 2;
    assert.equal(upgradeWeapon(s), false);
    const c = weaponCost(1);
    s.gold = c.gold;
    s.mats.gear = c.gear;
    s.mats.dust = c.dust;
    accept(s, 'q_forge');
    assert.equal(upgradeWeapon(s), true);
    assert.equal(s.weaponLv, 2);
    assert.equal(s.gold, 0);
    assert.equal(progress(s, 'q_forge').state, 'ready', '손질 퀘스트가 오른다');
    s.weaponLv = WEAPON_MAX;
    s.gold = 1e9;
    s.mats.gear = s.mats.dust = s.mats.star = 1e6;
    assert.equal(upgradeWeapon(s), false);
  });

  test('무기 손질은 공격력에 그대로 들어간다', () => {
    const s = newSave(0);
    const a = computeStats(s).atk;
    s.weaponLv = 10;
    assert.ok(computeStats(s).atk > a * 1.3);
  });
});

describe('부품', () => {
  test('부품은 이름 · 설명 · 효과가 있고, 만들 수 있는 부품과 특별한 부품(능력)이 있다', () => {
    const ids = Object.keys(PARTS);
    assert.ok(ids.length >= 20);
    assert.ok(ids.some((id) => PARTS[id].craft));
    assert.ok(ids.some((id) => PARTS[id].power));
    for (const id of ids) assert.ok(PARTS[id].name && PARTS[id].desc(1).length > 4, id);
  });

  test('만들기: 재료와 단추를 쓰고, 이미 있으면 못 만든다', () => {
    const s = newSave(0);
    const p = PARTS.pin;
    assert.equal(craftPart(s, 'pin'), false);
    s.gold = 1e6;
    for (const [m, n] of Object.entries(p.craft!.mats)) s.mats[m as 'gear'] = n!;
    assert.equal(craftPart(s, 'pin'), true);
    assert.equal(s.parts.pin, 1);
    assert.equal(craftPart(s, 'pin'), false);
  });

  test('꿰매기: 단계가 오르면 효과가 커지고, 3단계가 끝', () => {
    const s = newSave(0);
    s.parts.stuffing = 1;
    equipPart(s, 'stuffing');
    const hp1 = computeStats(s, partBonus(s)).maxHp;
    s.gold = 1e9;
    s.mats = { fluff: 99, gear: 99, sugar: 99, dust: 99, star: 99 };
    assert.ok(sewCost('stuffing', 1));
    assert.equal(sewPart(s, 'stuffing'), true);
    assert.equal(s.parts.stuffing, 2);
    assert.ok(computeStats(s, partBonus(s)).maxHp > hp1);
    sewPart(s, 'stuffing');
    assert.equal(sewPart(s, 'stuffing'), false);
    assert.equal(s.parts.stuffing, 3);
  });

  test('부품 칸: 처음 3칸, 가진 부품만, 같은 부품 두 번 안 됨, 빼기', () => {
    const s = newSave(0);
    assert.equal(partSlots(s), 3);
    assert.equal(equipPart(s, 'pin'), false, '없는 부품');
    for (const id of ['pin', 'stuffing', 'cloth', 'spring']) s.parts[id] = 1;
    assert.equal(equipPart(s, 'pin'), true);
    assert.equal(equipPart(s, 'pin'), false);
    equipPart(s, 'stuffing');
    equipPart(s, 'cloth');
    assert.equal(equipPart(s, 'spring'), false, '칸이 꽉 참');
    assert.equal(unequipPart(s, 'pin'), true);
    assert.equal(equipPart(s, 'spring'), true);
  });

  test('특별한 부품을 끼면 그 능력이 켜진다', () => {
    const s = newSave(0);
    s.parts.p_orbit = 1;
    assert.equal(hasPartPower(s, 'orbit'), false);
    equipPart(s, 'p_orbit');
    assert.equal(hasPartPower(s, 'orbit'), true);
  });
});
