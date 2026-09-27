import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { LEGENDARY_WEAPONS, findItem } from '../data.ts';
import { createGame, reroll, rerollCost, step } from '../game.ts';
import { HEROES, findHero } from '../heroes.ts';
import { effectiveWeapon } from '../sets.ts';
import { findSkill, useSkill } from '../skills.ts';
import { dummyDef, placeAt } from './helpers.ts';

/** 적이 나오지 않고 수입도 없는 판에 탑을 고른다 */
function heroGame(hero: string, extra: Parameters<typeof createGame>[0] = {}) {
  return createGame({
    seed: 1,
    hero: hero as never,
    ...extra,
    config: {
      waves: { baseCount: 0, countPerRound: 0 },
      rewards: { every: 0 },
      economy: { baseIncome: 0, incomePerRound: 0 },
      ...extra.config,
    },
  });
}

describe('탑 목록', () => {
  test('수호탑·궁수탑·마법탑·요새·도박탑 5종이고, 모두 이름·설명·대사·시작 무기가 있다', () => {
    assert.deepEqual(
      HEROES.map((h) => h.id),
      ['guardian', 'archer', 'mage', 'fortress', 'gambler'],
    );
    for (const h of HEROES) {
      assert.ok(h.name && h.desc && h.quote, h.id);
      assert.ok(h.startWeapons.length > 0, h.id);
      for (const w of h.startWeapons) assert.equal(findItem(w).kind, 'weapon');
    }
  });

  test('없는 탑 id 는 오류', () => {
    assert.throws(() => findHero('nope' as never));
  });
});

describe('탑을 고르지 않으면 (기존 규칙)', () => {
  test('고유 능력이 없고 설정의 시작 무기를 쓴다', () => {
    const s = createGame({ seed: 1 });
    assert.equal(s.hero, null);
    assert.deepEqual(s.weapons.map((w) => w.def.id), ['sling']);
    assert.equal(s.tower.maxHp, 1000);
  });
});

describe('탑별 시작 무기', () => {
  test('각 탑은 자기 시작 무기를 들고 시작한다', () => {
    const expect: Record<string, string> = { guardian: 'sling', archer: 'longbow', mage: 'chain_bolt', fortress: 'mortar', gambler: 'chaos_orb' };
    for (const [id, weapon] of Object.entries(expect)) {
      assert.deepEqual(heroGame(id).weapons.map((w) => w.def.id), [weapon], id);
    }
  });

  test('설정에서 시작 무기를 직접 주면 그게 우선이다', () => {
    const s = heroGame('archer', { config: { startWeapons: [] } });
    assert.equal(s.weapons.length, 0);
  });
});

describe('수호탑', () => {
  test('최대 체력 +200 (난이도 체력 위에 더한다)', () => {
    assert.equal(heroGame('guardian').tower.maxHp, 1200);
    assert.equal(heroGame('guardian', { difficulty: 'easy' }).tower.maxHp, 1700);
    assert.equal(heroGame('guardian').tower.hp, 1200);
  });

  test('라운드가 시작될 때마다 최대 체력의 10% 를 회복한다 (최대치를 넘지 않음)', () => {
    const s = heroGame('guardian', { config: { roundSeconds: 5 } });
    s.tower.hp = 500;
    step(s, 5.01);
    assert.equal(s.round, 2);
    assert.ok(Math.abs(s.tower.hp - 620) < 1e-6);
    s.tower.hp = s.tower.maxHp - 10;
    step(s, 5);
    assert.equal(s.tower.hp, s.tower.maxHp);
  });
});

describe('궁수탑', () => {
  test('관통 무기 피해 +30%, 사거리 +30. 다른 계열은 그대로', () => {
    const s = heroGame('archer');
    const bow = findItem('longbow');
    const sling = findItem('sling');
    if (bow.kind !== 'weapon' || sling.kind !== 'weapon') throw new Error();
    const b = effectiveWeapon(s, bow);
    assert.ok(Math.abs(b.damage - 30 * 1.3) < 1e-9);
    assert.equal(b.range, 180 + 30);
    const sl = effectiveWeapon(s, sling);
    assert.equal(sl.damage, 20);
    assert.equal(sl.range, 120);
  });
});

describe('마법탑', () => {
  test('마법 피해 +20%, 연쇄 +1회', () => {
    const s = heroGame('mage');
    const bolt = findItem('chain_bolt');
    if (bolt.kind !== 'weapon') throw new Error();
    const st = effectiveWeapon(s, bolt);
    assert.ok(Math.abs(st.damage - 25 * 1.2) < 1e-9);
    assert.equal(st.behavior.kind === 'chain' && st.behavior.jumps, 4);
  });

  test('스킬 재사용 대기 -25%', () => {
    const s = heroGame('mage');
    placeAt(s, 150, 0, dummyDef({ hp: 1e6 }));
    assert.equal(useSkill(s, 'meteor'), true);
    assert.equal(s.skillCooldowns.meteor, findSkill('meteor').cooldown * 0.75);
  });
});

describe('요새', () => {
  test('체력 +300, 방어 +6, 가시 20, 면마다 무기 칸 3 → 2', () => {
    const s = heroGame('fortress');
    assert.equal(s.tower.maxHp, 1300);
    assert.equal(s.tower.armor, 6);
    assert.equal(s.tower.thorns, 20);
    assert.equal(s.config.tower.faceSlots, 2);
  });

  test('공성 무기 피해 +20%', () => {
    const s = heroGame('fortress');
    const mortar = findItem('mortar');
    if (mortar.kind !== 'weapon') throw new Error();
    assert.ok(Math.abs(effectiveWeapon(s, mortar).damage - 40 * 1.2) < 1e-9);
  });

  test('요새를 골라도 기본 설정 객체의 무기 칸은 바뀌지 않는다', () => {
    heroGame('fortress');
    assert.equal(createGame({ seed: 1 }).config.tower.faceSlots, 3);
  });
});

describe('도박탑', () => {
  test('치명타 +10%, 카오스 피해 범위 50%~300%', () => {
    const s = heroGame('gambler');
    assert.ok(Math.abs(s.tower.critChance - 0.1) < 1e-9);
    const orb = findItem('chaos_orb');
    if (orb.kind !== 'weapon') throw new Error();
    const st = effectiveWeapon(s, orb);
    assert.equal(st.chaosMin, 0.5);
    assert.equal(st.chaosMax, 3);
    assert.deepEqual(createGame({ seed: 1 }).config.chaosRange, [0.5, 2], '기본 설정은 그대로');
  });

  test('리롤 비용 절반 (올림)', () => {
    const s = heroGame('gambler');
    assert.equal(rerollCost(s), 10);
    s.rerollCount = 1;
    assert.equal(rerollCost(s), 15);
  });
});

describe('전설 무기 (영구 성장으로 해금)', () => {
  test('천둥 망치·불사조 활·유성 지팡이 3종', () => {
    assert.deepEqual(
      LEGENDARY_WEAPONS.map((w) => w.id),
      ['thunder_hammer', 'phoenix_bow', 'meteor_staff'],
    );
  });

  function seenInShop(lockedItems?: string[]): Set<string> {
    const s = createGame({ seed: 5, config: lockedItems ? { lockedItems } : {} });
    const seen = new Set<string>();
    for (let i = 0; i < 400; i++) {
      for (const item of s.shop) if (item) seen.add(item.id);
      s.gold = 1e9;
      s.rerollCount = 0;
      reroll(s);
    }
    return seen;
  }

  test('해금하지 않으면(기본 설정) 상점에 나오지 않는다', () => {
    const seen = seenInShop();
    for (const w of LEGENDARY_WEAPONS) assert.equal(seen.has(w.id), false, w.id);
    assert.ok(seen.has('sling'));
  });

  test('잠금 목록에서 빠진 전설 무기는 상점에 나온다', () => {
    const seen = seenInShop(['meteor_staff']);
    assert.equal(seen.has('thunder_hammer'), true);
    assert.equal(seen.has('phoenix_bow'), true);
    assert.equal(seen.has('meteor_staff'), false);
  });

  test('전설 무기는 같은 계열 일반 무기보다 비싸고 강하다', () => {
    for (const w of LEGENDARY_WEAPONS) {
      assert.ok(w.price >= 800, w.id);
      assert.ok(w.damage / w.cooldown >= 60, `${w.id} 초당 피해`);
    }
  });
});
