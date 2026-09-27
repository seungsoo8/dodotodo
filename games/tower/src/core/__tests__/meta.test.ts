import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { LEGENDARY_WEAPONS } from '../data.ts';
import { createGame, incomePerSecond } from '../game.ts';
import { META, META_UPGRADES, buyMetaUpgrade, emptyMeta, heroUnlocked, metaBonuses, metaLevel, nextCost, type MetaState } from '../meta.ts';
import { findSkill, useSkill } from '../skills.ts';
import { dummyDef, placeAt } from './helpers.ts';

function rich(shards = 10000): MetaState {
  return { ...emptyMeta(), shards };
}

describe('영구 강화 구매', () => {
  test('처음에는 별조각 0, 모든 강화 0단계', () => {
    const m = emptyMeta();
    assert.equal(m.shards, 0);
    for (const u of META_UPGRADES) assert.equal(metaLevel(m, u.id), 0);
  });

  test('별조각을 내고 한 단계 올린다. 원래 상태는 바뀌지 않는다', () => {
    const m = rich(100);
    const cost = nextCost(m, 'start_gold')!;
    const next = buyMetaUpgrade(m, 'start_gold')!;
    assert.equal(next.shards, 100 - cost);
    assert.equal(metaLevel(next, 'start_gold'), 1);
    assert.equal(metaLevel(m, 'start_gold'), 0);
    assert.equal(m.shards, 100);
  });

  test('단계마다 값이 오른다', () => {
    let m = rich();
    const costs: number[] = [];
    while (nextCost(m, 'max_hp') !== null) {
      costs.push(nextCost(m, 'max_hp')!);
      m = buyMetaUpgrade(m, 'max_hp')!;
    }
    assert.ok(costs.length >= 3);
    for (let i = 1; i < costs.length; i++) assert.ok(costs[i] > costs[i - 1]);
  });

  test('별조각이 모자라면 살 수 없다 (딱 맞으면 산다)', () => {
    const cost = nextCost(emptyMeta(), 'power')!;
    assert.equal(buyMetaUpgrade(rich(cost - 1), 'power'), null);
    assert.equal(buyMetaUpgrade(rich(cost), 'power')!.shards, 0);
  });

  test('최고 단계면 더 살 수 없다', () => {
    let m = rich();
    const max = META_UPGRADES.find((u) => u.id === 'income')!.costs.length;
    for (let i = 0; i < max; i++) m = buyMetaUpgrade(m, 'income')!;
    assert.equal(nextCost(m, 'income'), null);
    assert.equal(buyMetaUpgrade(m, 'income'), null);
  });

  test('없는 강화는 살 수 없다', () => {
    assert.equal(buyMetaUpgrade(rich(), 'nope'), null);
  });
});

describe('탑 해금', () => {
  test('수호탑은 처음부터, 나머지는 해금해야 고를 수 있다', () => {
    const m = emptyMeta();
    assert.equal(heroUnlocked(m, 'guardian'), true);
    for (const id of ['archer', 'mage', 'fortress', 'gambler'] as const) assert.equal(heroUnlocked(m, id), false);
    const next = buyMetaUpgrade(rich(), 'hero_archer')!;
    assert.equal(heroUnlocked(next, 'archer'), true);
    assert.equal(heroUnlocked(next, 'mage'), false);
  });
});

describe('영구 강화 효과', () => {
  test('아무것도 없으면 효과 없음 · 전설 무기는 모두 잠김', () => {
    const b = metaBonuses(emptyMeta());
    assert.deepEqual(
      { ...b, lockedItems: [...b.lockedItems].sort() },
      { startGold: 0, maxHp: 0, damage: 0, income: 0, skillCooldownMul: 1, lockedItems: LEGENDARY_WEAPONS.map((w) => w.id).sort() },
    );
  });

  test('단계만큼 시작 골드·체력·피해·수입·스킬 대기가 좋아진다', () => {
    let m = rich();
    for (let i = 0; i < 2; i++) for (const id of ['start_gold', 'max_hp', 'power', 'income', 'skill_cd']) m = buyMetaUpgrade(m, id)!;
    const b = metaBonuses(m);
    assert.equal(b.startGold, META.startGold * 2);
    assert.equal(b.maxHp, META.maxHp * 2);
    assert.ok(Math.abs(b.damage - META.damage * 2) < 1e-9);
    assert.equal(b.income, META.income * 2);
    assert.ok(Math.abs(b.skillCooldownMul - (1 - META.skillCooldown * 2)) < 1e-9);
  });

  test('전설 무기를 해금하면 잠금 목록에서 빠진다', () => {
    const m = buyMetaUpgrade(rich(), 'weapon_phoenix_bow')!;
    assert.deepEqual([...metaBonuses(m).lockedItems].sort(), ['meteor_staff', 'thunder_hammer']);
  });

  test('게임을 만들 때 영구 강화가 난이도 값 위에 더해진다', () => {
    let m = rich();
    for (const id of ['start_gold', 'max_hp', 'power', 'income', 'skill_cd']) m = buyMetaUpgrade(m, id)!;
    const s = createGame({ seed: 1, difficulty: 'easy', meta: metaBonuses(m), config: { economy: { incomePerRound: 0 } } });
    assert.equal(s.gold, 450 + META.startGold);
    assert.equal(s.tower.maxHp, 1500 + META.maxHp);
    assert.equal(s.tower.hp, s.tower.maxHp);
    assert.ok(Math.abs(s.tower.damageMul - (1 + META.damage)) < 1e-9);
    assert.equal(incomePerSecond(s), s.config.economy.baseIncome + META.income);
    placeAt(s, 150, 0, dummyDef({ hp: 1e6 }));
    useSkill(s, 'meteor');
    assert.ok(Math.abs(s.skillCooldowns.meteor - findSkill('meteor').cooldown * (1 - META.skillCooldown)) < 1e-9);
  });
});
