import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { findItem } from '../data.ts';
import { applyItem, buyItem, createGame, incomePerSecond, reroll, rerollCost, step } from '../game.ts';
import { quietGame } from './helpers.ts';

describe('시작 상태', () => {
  test('설정대로 골드·체력·라운드가 시작되고, 상점 4칸이 모두 채워져 있다', () => {
    const s = createGame({ seed: 5, config: { economy: { startGold: 300 }, tower: { maxHp: 1000 } } });
    assert.equal(s.gold, 300);
    assert.equal(s.tower.hp, 1000);
    assert.equal(s.tower.maxHp, 1000);
    assert.equal(s.round, 1);
    assert.equal(s.status, 'playing');
    assert.equal(s.shop.length, 4);
    assert.ok(s.shop.every((item) => item !== null));
  });

  test('기본 설정에서는 돌팔매 하나를 들고 시작한다', () => {
    const s = createGame({ seed: 5 });
    assert.deepEqual(
      s.weapons.map((w) => w.def.id),
      ['sling'],
    );
  });

  test('시작 무기를 비우면 무기 없이 시작한다', () => {
    const s = createGame({ seed: 5, config: { startWeapons: [] } });
    assert.equal(s.weapons.length, 0);
  });

  test('같은 시드는 같은 상점을 보여준다', () => {
    const a = createGame({ seed: 99 });
    const b = createGame({ seed: 99 });
    assert.deepEqual(
      a.shop.map((i) => i?.id),
      b.shop.map((i) => i?.id),
    );
  });
});

describe('골드 수입', () => {
  test('초당 수입 = 기본 5 + 라운드당 1 × (라운드-1) + 아이템', () => {
    const s = quietGame({ economy: { baseIncome: 5, incomePerRound: 1 } });
    assert.equal(incomePerSecond(s), 5);
    s.round = 4;
    assert.equal(incomePerSecond(s), 8);
    applyItem(s, findItem('gold_coin'));
    assert.equal(incomePerSecond(s), 11);
  });

  test('시간이 지나면 초당 수입만큼 골드가 쌓인다', () => {
    const s = quietGame({ economy: { baseIncome: 5, incomePerRound: 1 } });
    step(s, 2);
    assert.ok(Math.abs(s.gold - 310) < 1e-9);
  });
});

describe('구매', () => {
  test('골드가 충분하면 사고, 골드가 줄고, 무기가 생기고, 그 칸은 빈다', () => {
    const s = quietGame();
    s.shop[0] = findItem('sling');
    assert.equal(buyItem(s, 0), true);
    assert.equal(s.gold, 200);
    assert.equal(s.weapons.length, 1);
    assert.equal(s.weapons[0].def.id, 'sling');
    assert.equal(s.shop[0], null);
  });

  test('골드가 가격과 딱 같으면 살 수 있다', () => {
    const s = quietGame();
    s.gold = 100;
    s.shop[1] = findItem('sling');
    assert.equal(buyItem(s, 1), true);
    assert.equal(s.gold, 0);
  });

  test('골드가 1 이라도 모자라면 사지 못하고 아무것도 바뀌지 않는다', () => {
    const s = quietGame();
    s.gold = 99;
    const sling = findItem('sling');
    s.shop[0] = sling;
    assert.equal(buyItem(s, 0), false);
    assert.equal(s.gold, 99);
    assert.equal(s.weapons.length, 0);
    assert.equal(s.shop[0], sling);
  });

  test('빈 칸이나 없는 칸은 살 수 없다', () => {
    const s = quietGame();
    s.shop[0] = null;
    assert.equal(buyItem(s, 0), false);
    assert.equal(buyItem(s, -1), false);
    assert.equal(buyItem(s, 4), false);
    assert.equal(s.gold, 300);
  });

  test('강화 아이템을 사면 탑 능력치가 바뀐다', () => {
    const s = quietGame();
    s.shop[2] = findItem('iron_plate');
    assert.equal(buyItem(s, 2), true);
    assert.equal(s.tower.armor, 2);
    assert.equal(s.weapons.length, 0);
    assert.equal(s.gold, 150);
  });

  test('게임이 끝나면 살 수 없다', () => {
    const s = quietGame();
    s.status = 'lost';
    s.shop[0] = findItem('sling');
    assert.equal(buyItem(s, 0), false);
    assert.equal(s.gold, 300);
  });
});

describe('리롤', () => {
  test('첫 리롤은 20 골드, 이후 10 씩 오른다', () => {
    const s = quietGame();
    assert.equal(rerollCost(s), 20);
    assert.equal(reroll(s), true);
    assert.equal(s.gold, 280);
    assert.equal(rerollCost(s), 30);
    assert.equal(reroll(s), true);
    assert.equal(s.gold, 250);
    assert.equal(rerollCost(s), 40);
  });

  test('리롤하면 빈 칸까지 4칸이 모두 새로 채워진다', () => {
    const s = quietGame();
    s.shop = [null, null, null, null];
    reroll(s);
    assert.equal(s.shop.length, 4);
    assert.ok(s.shop.every((i) => i !== null));
  });

  test('리롤 결과는 난수를 따른다 (여러 번 리롤하면 다른 구성이 나온다)', () => {
    const s = quietGame();
    s.gold = 1e6;
    const seen = new Set<string>();
    for (let i = 0; i < 10; i++) {
      reroll(s);
      seen.add(s.shop.map((it) => it?.id).join(','));
    }
    assert.ok(seen.size > 1);
  });

  test('골드가 모자라면 리롤되지 않는다', () => {
    const s = quietGame();
    s.gold = 19;
    const before = [...s.shop];
    assert.equal(reroll(s), false);
    assert.equal(s.gold, 19);
    assert.deepEqual(s.shop, before);
    assert.equal(rerollCost(s), 20);
  });

  test('새 라운드가 되면 리롤 비용이 처음으로 돌아가고 상점이 무료로 새로 채워진다', () => {
    const s = quietGame({ roundSeconds: 5 });
    reroll(s);
    reroll(s);
    s.shop[0] = null;
    const gold = s.gold;
    step(s, 5.01);
    assert.equal(s.round, 2);
    assert.equal(rerollCost(s), 20);
    assert.equal(s.gold, gold);
    assert.ok(s.shop.every((i) => i !== null));
  });
});
