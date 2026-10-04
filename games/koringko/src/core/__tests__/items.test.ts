import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { newSave } from '../character.ts';
import { forgeCost, forgeChance, dismantle, upgrade } from '../forge.ts';
import { BAG_MAX, addItem, equip, equipCheck, sell, unequip } from '../inventory.ts';
import { AFFIX_RULES, RARITY, itemTier, itemValue, makeItem, rollRarity } from '../items.ts';
import { rollDrops } from '../loot.ts';
import { createRng } from '../rng.ts';
import { buyItem, buyPotion, potionPrice, shopStock } from '../shop.ts';
import { RARITIES, SLOTS, type Item } from '../types.ts';

const rng = () => createRng(7);

describe('장비 만들기', () => {
  test('등급마다 추가 능력 수가 정해진 범위 안이고, 같은 능력은 겹치지 않는다', () => {
    const r = rng();
    for (const rarity of RARITIES) {
      for (let i = 0; i < 60; i++) {
        const it = makeItem(r, { ilvl: 10, rarity, hero: 'toby', uid: `${i}` });
        const [lo0, hi0] = RARITY[rarity].affixes;
        // 장신구(반지·목걸이)는 일반이어도 능력 하나
        const jewel = it.slot === 'ring' || it.slot === 'necklace';
        const lo = jewel ? Math.max(1, lo0) : lo0;
        const hi = jewel ? Math.max(1, hi0) : hi0;
        assert.ok(it.affixes.length >= lo && it.affixes.length <= hi, `${rarity} ${it.affixes.length}`);
        assert.equal(new Set(it.affixes.map((a) => a.id)).size, it.affixes.length);
        for (const a of it.affixes) assert.ok(a.v > 0, `${a.id} ${a.v}`);
      }
    }
  });

  test('무기는 그 직업 무기 종류이고 피해 범위가 있다. 방어구는 방어력, 장신구는 둘 다 없다', () => {
    const r = rng();
    const w = makeItem(r, { ilvl: 5, slot: 'weapon', hero: 'ruru', rarity: 'normal', uid: 'w' });
    assert.equal(w.hero, 'ruru');
    assert.ok(w.dmg && w.dmg[1] >= w.dmg[0] && w.dmg[0] > 0 && w.spd);
    const a = makeItem(r, { ilvl: 5, slot: 'armor', hero: 'ruru', rarity: 'normal', uid: 'a' });
    assert.ok(a.def && a.def > 0 && !a.dmg);
    const ring = makeItem(r, { ilvl: 5, slot: 'ring', hero: 'ruru', rarity: 'normal', uid: 'r' });
    assert.ok(!ring.def && !ring.dmg);
    assert.ok(ring.affixes.length >= 1, '장신구는 일반이어도 능력 하나');
  });

  test('아이템 레벨이 높을수록 무기 피해 · 방어력 · 값이 크다', () => {
    const lo = makeItem(createRng(1), { ilvl: 2, slot: 'weapon', hero: 'toby', rarity: 'normal', uid: 'a' });
    const hi = makeItem(createRng(1), { ilvl: 30, slot: 'weapon', hero: 'toby', rarity: 'normal', uid: 'b' });
    assert.ok(hi.dmg![0] > lo.dmg![0]);
    assert.ok(itemValue(hi) > itemValue(lo));
    assert.ok(itemTier(30) > itemTier(2));
  });

  test('전설은 고유 능력이 있고, 그 아래는 없다', () => {
    const r = rng();
    assert.ok(makeItem(r, { ilvl: 20, rarity: 'legendary', hero: 'bori', uid: 'l' }).power);
    assert.equal(makeItem(r, { ilvl: 20, rarity: 'rare', hero: 'bori', uid: 'q' }).power, undefined);
  });

  test('능력마다 붙을 수 있는 부위가 정해져 있다 (이동 속도는 신발·목걸이만)', () => {
    const r = rng();
    for (let i = 0; i < 200; i++) {
      const slot = SLOTS[i % SLOTS.length];
      const it = makeItem(r, { ilvl: 20, rarity: 'legendary', slot, hero: 'toby', uid: `${i}` });
      for (const a of it.affixes) assert.ok(AFFIX_RULES[a.id].slots.includes(slot), `${a.id} on ${slot}`);
    }
  });

  test('등급 굴리기: 대부분 일반·매직, 전설은 아주 드물다. 행운을 올리면 좋은 등급이 늘어난다', () => {
    const r = rng();
    const count = (luck: number) => {
      const c: Record<string, number> = {};
      for (let i = 0; i < 20000; i++) {
        const k = rollRarity(r, luck);
        c[k] = (c[k] ?? 0) + 1;
      }
      return c;
    };
    const base = count(0);
    assert.ok(base.normal + base.magic > 16000);
    assert.ok((base.legendary ?? 0) < 300);
    const lucky = count(1);
    assert.ok((lucky.rare ?? 0) > (base.rare ?? 0));
  });
});

describe('가방과 장착', () => {
  const w = (over: Partial<Item> = {}): Item => ({ uid: 'w1', slot: 'weapon', name: '나무 칼', rarity: 'normal', ilvl: 1, req: 1, dmg: [3, 5], spd: 1, affixes: [], plus: 0, hero: 'toby', ...over });

  test('가방에 넣고, 꽉 차면 못 넣는다', () => {
    const s = newSave('toby', '토비');
    for (let i = 0; i < BAG_MAX; i++) assert.equal(addItem(s, w({ uid: `${i}` })), true);
    assert.equal(addItem(s, w({ uid: 'over' })), false);
  });

  test('장착하면 가방에서 빠지고, 끼고 있던 것은 가방으로', () => {
    const s = newSave('toby', '토비');
    addItem(s, w({ uid: 'a' }));
    addItem(s, w({ uid: 'b' }));
    assert.equal(equip(s, 0), true);
    assert.equal(s.gear.weapon?.uid, 'a');
    assert.deepEqual(s.bag.map((i) => i.uid), ['b']);
    assert.equal(equip(s, 0), true);
    assert.equal(s.gear.weapon?.uid, 'b');
    assert.deepEqual(s.bag.map((i) => i.uid), ['a']);
  });

  test('요구 레벨이 높거나 남의 무기면 못 낀다', () => {
    const s = newSave('toby', '토비');
    addItem(s, w({ req: 5 }));
    assert.deepEqual(equipCheck(s, s.bag[0]), { ok: false, reason: 'level' });
    assert.equal(equip(s, 0), false);
    s.bag = [w({ hero: 'ruru' })];
    assert.deepEqual(equipCheck(s, s.bag[0]), { ok: false, reason: 'hero' });
  });

  test('벗으면 가방으로 (가방이 꽉 찼으면 못 벗는다)', () => {
    const s = newSave('toby', '토비');
    s.gear.weapon = w();
    assert.equal(unequip(s, 'weapon'), true);
    assert.equal(s.gear.weapon, undefined);
    assert.equal(s.bag.length, 1);
    s.gear.weapon = w({ uid: 'z' });
    while (s.bag.length < BAG_MAX) s.bag.push(w({ uid: `f${s.bag.length}` }));
    assert.equal(unequip(s, 'weapon'), false);
  });

  test('팔면 값만큼 골드', () => {
    const s = newSave('toby', '토비');
    addItem(s, w());
    const gold = s.gold;
    const v = itemValue(s.bag[0]);
    assert.equal(sell(s, 0), v);
    assert.equal(s.gold, gold + v);
    assert.equal(s.bag.length, 0);
  });
});

describe('상점', () => {
  test('포션은 레벨에 따라 값이 오르고, 골드가 있어야 산다', () => {
    const s = newSave('toby', '토비');
    assert.ok(potionPrice(20, 'hp') > potionPrice(1, 'hp'));
    s.gold = potionPrice(1, 'hp');
    assert.equal(buyPotion(s, 'hp'), true);
    assert.equal(s.gold, 0);
    assert.equal(buyPotion(s, 'hp'), false);
  });

  test('장비 진열은 내 레벨 근처 일반·매직, 사면 가방으로 들어가고 다시 못 산다', () => {
    const s = newSave('bori', '보리');
    s.lv = 8;
    const stock = shopStock(createRng(3), s);
    assert.ok(stock.length >= 4);
    for (const o of stock) {
      assert.ok(o.item.rarity === 'normal' || o.item.rarity === 'magic');
      assert.ok(Math.abs(o.item.ilvl - 8) <= 2);
      if (o.item.slot === 'weapon') assert.equal(o.item.hero, 'bori');
      assert.ok(o.price > itemValue(o.item), '파는 값보다 비싸다');
    }
    s.gold = 1e6;
    assert.equal(buyItem(s, stock, 0), true);
    assert.equal(s.bag.length, 1);
    assert.equal(buyItem(s, stock, 0), false, '팔린 칸');
  });
});

describe('대장간', () => {
  const armor = (plus = 0): Item => ({ uid: 'a', slot: 'armor', name: '솜 조끼', rarity: 'rare', ilvl: 10, req: 10, def: 20, affixes: [], plus });

  test('강화 비용은 단계가 오를수록 비싸고, +4 부터 별 조각이 든다. 확률은 점점 낮다', () => {
    assert.ok(forgeCost(armor(5)).gold > forgeCost(armor(1)).gold);
    assert.equal(forgeCost(armor(2)).star, 0);
    assert.ok(forgeCost(armor(4)).star > 0);
    assert.ok(forgeChance(0) === 1 && forgeChance(9) < forgeChance(3));
  });

  test('재료가 있으면 강화하고 재료를 쓴다. 재료가 모자라면 못 한다', () => {
    const s = newSave('toby', '토비');
    s.gear.armor = armor(0);
    const cost = forgeCost(s.gear.armor);
    assert.equal(upgrade(s, { gear: 'armor' }, createRng(1)).kind, 'poor');
    s.gold = cost.gold;
    s.mats.dust = cost.dust;
    assert.equal(upgrade(s, { gear: 'armor' }, createRng(1)).kind, 'success');
    assert.equal(s.gear.armor.plus, 1);
    assert.equal(s.gold, 0);
    assert.equal(s.mats.dust, 0);
  });

  test('실패하면 재료만 쓰고, +6 이상에서 실패하면 한 단계 내려간다', () => {
    const s = newSave('toby', '토비');
    s.gear.armor = armor(7);
    s.gold = 1e9;
    s.mats.dust = 1e6;
    s.mats.star = 1e6;
    // 항상 실패하는 주사위
    const bad = { next: () => 0.9999, range: (a: number) => a, int: () => 0 };
    const r = upgrade(s, { gear: 'armor' }, bad);
    assert.equal(r.kind, 'fail');
    assert.equal(s.gear.armor.plus, 6);
    s.gear.armor.plus = 3;
    upgrade(s, { gear: 'armor' }, bad);
    assert.equal(s.gear.armor.plus, 3);
  });

  test('+10 이 끝이다', () => {
    const s = newSave('toby', '토비');
    s.gear.armor = armor(10);
    s.gold = 1e9;
    assert.equal(upgrade(s, { gear: 'armor' }, createRng(1)).kind, 'max');
  });

  test('분해하면 별가루, 레어 이상은 별 조각도', () => {
    const s = newSave('toby', '토비');
    s.bag = [{ ...armor(0), rarity: 'normal' }, armor(0)];
    const a = dismantle(s, 1);
    assert.ok(a.dust > 0 && a.star > 0);
    const b = dismantle(s, 0);
    assert.ok(b.dust > 0 && b.star === 0);
    assert.equal(s.bag.length, 0);
    assert.equal(s.mats.dust, a.dust + b.dust);
  });
});

describe('떨어뜨리는 것', () => {
  test('보통 몬스터는 골드를 주고 가끔 장비, 보스는 레어 이상 장비를 여럿', () => {
    const r = createRng(11);
    let items = 0;
    for (let i = 0; i < 400; i++) {
      const d = rollDrops(r, { lv: 5, rank: 'normal', gold: [2, 6], hero: 'toby', luck: 0, uid: () => `${i}` });
      assert.ok(d.gold >= 2);
      items += d.items.length;
    }
    assert.ok(items > 10 && items < 120, `${items}`);
    let n = 0;
    const boss = rollDrops(r, { lv: 10, rank: 'boss', gold: [100, 100], hero: 'toby', luck: 0, uid: () => `b${n++}` });
    assert.ok(boss.items.length >= 2);
    assert.ok(boss.items.every((it) => RARITIES.indexOf(it.rarity) >= RARITIES.indexOf('rare')));
  });
});
