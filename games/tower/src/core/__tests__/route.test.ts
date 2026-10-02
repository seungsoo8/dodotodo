import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CONFIG } from '../config.ts';
import { UPGRADES, findItem } from '../data.ts';
import { applyItem, buyItem, chooseReward, priceOf, step, type GameState } from '../game.ts';
import { ENCOUNTER, ENCOUNTERS, ROUTE, ROUTE_NODES, canForge, chooseEncounter, chooseForge, chooseRoute, forgeTarget, offerRoute, routeOptions, type EncounterId, type RouteNodeId } from '../route.ts';
import { ULT } from '../ultimate.ts';
import type { WeaponDef } from '../types.ts';
import { placeAt, quietGame } from './helpers.ts';

/** 갈림길만 켜 둔 조용한 판 */
function routeGame(seed = 1, every = 3): GameState {
  return quietGame({ roundSeconds: 1, route: { every } }, seed);
}

function advanceTo(s: GameState, round: number): void {
  for (let i = 0; i < 10000 && s.round < round && !s.route && !s.choice; i++) step(s, 0.25);
}

/** 갈림길을 열고 id 칸을 고른다 (그 칸이 나올 때까지 다시 연다) */
function pick(s: GameState, id: RouteNodeId): void {
  for (let i = 0; i < 200; i++) {
    s.route = null;
    offerRoute(s);
    const idx = s.route!.indexOf(id);
    if (idx >= 0) {
      assert.equal(chooseRoute(s, idx), true);
      return;
    }
  }
  assert.fail(`${id} 칸이 나오지 않음`);
}

describe('밤 지도 갈림길: 언제 나오나', () => {
  test('기본 설정: 3라운드마다 갈림길, 라운드마다 저절로 나오던 보상 카드는 없다', () => {
    assert.equal(DEFAULT_CONFIG.route.every, 3);
    assert.equal(DEFAULT_CONFIG.rewards.every, 0);
  });

  test('3라운드가 시작되면 서로 다른 갈림길 3개가 나오고 (2라운드에는 없다) 알림이 뜬다', () => {
    const s = routeGame();
    advanceTo(s, 2);
    assert.equal(s.route, null);
    advanceTo(s, 3);
    assert.equal(s.round, 3);
    const nodes = s.route as RouteNodeId[] | null;
    assert.ok(nodes);
    assert.equal(nodes.length, 3);
    assert.equal(new Set(nodes).size, 3);
    for (const id of nodes) assert.ok(ROUTE_NODES[id], id);
    assert.ok(s.events.some((e) => e.kind === 'route'));
  });

  test('갈림길을 고르는 동안 게임이 멈추고, 고르면 다시 흐른다', () => {
    const s = routeGame();
    advanceTo(s, 3);
    const t = s.time;
    step(s, 5);
    assert.equal(s.time, t);
    assert.equal(chooseRoute(s, 0), true);
    assert.equal(s.route, null);
    step(s, 0.1);
    assert.ok(s.time > t);
  });

  test('없는 칸을 고르거나 갈림길이 없을 때 고르면 아무 일 없다', () => {
    const s = routeGame();
    assert.equal(chooseRoute(s, 0), false);
    offerRoute(s);
    assert.equal(chooseRoute(s, 3), false);
    assert.equal(chooseRoute(s, -1), false);
    assert.ok(s.route);
  });

  test('여러 번 열면 여섯 갈래가 모두 나온다', () => {
    const s = routeGame();
    s.gold = 1000;
    applyItem(s, findItem('sling'));
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      s.route = null;
      offerRoute(s);
      for (const id of s.route!) seen.add(id);
    }
    assert.deepEqual([...seen].sort(), (Object.keys(ROUTE_NODES) as RouteNodeId[]).sort());
  });

  test('모루는 올릴 무기가 있을 때만, 도박꾼은 골드가 있을 때만, 정예의 길은 다음 라운드가 있을 때만 나온다', () => {
    const s = routeGame();
    s.gold = 0;
    assert.ok(!routeOptions(s).includes('forge'));
    assert.ok(!routeOptions(s).includes('gamble'));
    assert.ok(routeOptions(s).includes('elite'));
    s.gold = ROUTE.gambleMin;
    applyItem(s, findItem('sling'));
    assert.ok(routeOptions(s).includes('forge'));
    assert.ok(routeOptions(s).includes('gamble'));
    s.round = s.config.totalRounds;
    assert.ok(!routeOptions(s).includes('elite'), '마지막 라운드');
    s.mode = 'endless';
    assert.ok(routeOptions(s).includes('elite'), '무한 모드는 다음이 있다');
  });
});

describe('갈림길 칸의 효과', () => {
  test('⚔ 정예의 길: 다음 라운드에 정예가 나오고, 잡으면 보상 카드를 두 번 고른다', () => {
    const s = routeGame();
    pick(s, 'elite');
    assert.equal(s.enemies.some((e) => e.isElite), false, '아직은 없다');
    s.roundTime = s.config.roundSeconds - 0.01;
    step(s, 0.02);
    const elite = s.enemies.find((e) => e.isElite);
    assert.ok(elite, '다음 라운드에 나온다');
    applyItem(s, findItem('sling'));
    elite.hp = 0;
    step(s, 0.01);
    assert.ok(s.choice, '첫 보상');
    chooseReward(s, 0);
    assert.ok(s.choice, '두 번째 보상');
    chooseReward(s, 0);
    assert.equal(s.choice, null);
  });

  test('🏪 떠돌이 상인: 이번 라운드 상점이 할인되고, 첫 칸에 비싼 무기가 놓인다', () => {
    const s = routeGame();
    const sling = findItem('sling');
    const before = priceOf(s, sling);
    pick(s, 'merchant');
    assert.equal(priceOf(s, sling), Math.ceil(before * ROUTE.merchantSale));
    const featured = s.shop[0]!;
    assert.equal(featured.kind, 'weapon');
    assert.ok(featured.price >= ROUTE.merchantMinPrice, `${featured.id} ${featured.price}`);
    // 할인 가격으로 산다
    s.gold = 10000;
    buyItem(s, 0);
    assert.equal(s.gold, 10000 - Math.ceil(featured.price * ROUTE.merchantSale));
    // 다음 라운드가 되면 원래 가격
    s.roundTime = s.config.roundSeconds - 0.01;
    step(s, 0.02);
    assert.equal(priceOf(s, sling), before);
  });

  test('🏪 상인은 잠긴 전설 무기는 내놓지 않는다', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const s = quietGame({ roundSeconds: 1, route: { every: 3 }, lockedItems: ['thunder_hammer', 'phoenix_bow', 'meteor_staff'] }, seed);
      pick(s, 'merchant');
      assert.ok(!['thunder_hammer', 'phoenix_bow', 'meteor_staff'].includes(s.shop[0]!.id), s.shop[0]!.id);
    }
  });

  test('🔥 모닥불: 최대 체력이 조금 늘고 체력을 크게 회복한다 (최대를 넘지 않는다)', () => {
    const s = routeGame();
    const max = s.tower.maxHp;
    s.tower.hp = max * 0.3;
    pick(s, 'campfire');
    const newMax = max * (1 + ROUTE.campfireMaxHp);
    assert.ok(Math.abs(s.tower.maxHp - newMax) < 1e-6);
    assert.ok(Math.abs(s.tower.hp - (max * 0.3 + max * ROUTE.campfireMaxHp + newMax * ROUTE.campfireHeal)) < 1e-6, `${s.tower.hp}`);
    s.tower.hp = s.tower.maxHp;
    pick(s, 'campfire');
    assert.equal(s.tower.hp, s.tower.maxHp);
  });

  test('모루: 고르면 게임이 멈추고 올릴 무기를 직접 고른다. 고른 무기의 ★ 가 하나 오른다', () => {
    const s = routeGame();
    applyItem(s, findItem('sling'));
    applyItem(s, findItem('longbow'));
    pick(s, 'forge');
    assert.equal(s.forging, true);
    assert.equal(s.weapons.every((w) => w.level === 1), true, '고르기 전에는 그대로');
    const t = s.time;
    step(s, 1);
    assert.equal(s.time, t, '고르는 동안 멈춘다');
    const sling = s.weapons.findIndex((w) => w.def.id === 'sling');
    assert.equal(chooseForge(s, sling), true);
    assert.equal(s.forging, false);
    assert.equal(s.weapons.find((w) => w.def.id === 'sling')!.level, 2);
    assert.equal(s.weapons.find((w) => w.def.id === 'longbow')!.level, 1);
    assert.ok(s.events.some((e) => e.kind === 'forge' && e.weaponId === 'sling' && e.level === 2));
    step(s, 0.1);
    assert.ok(s.time > t, '고르면 다시 흐른다');
  });

  test('모루: 최대 ★ 무기 · 없는 칸 · 모루가 아닐 때는 고를 수 없다', () => {
    const s = routeGame();
    applyItem(s, findItem('sling'));
    applyItem(s, findItem('longbow'));
    assert.equal(chooseForge(s, 0), false, '모루가 아니다');
    pick(s, 'forge');
    const bow = s.weapons.findIndex((w) => w.def.id === 'longbow');
    s.weapons[bow].level = s.config.merge.maxLevel;
    assert.equal(canForge(s, bow), false);
    assert.equal(chooseForge(s, bow), false);
    assert.equal(chooseForge(s, 99), false);
    assert.equal(chooseForge(s, -1), false);
    assert.equal(s.forging, true, '아직 고르는 중');
    assert.equal(canForge(s, 1 - bow), true);
  });

  test('모루 추천: 가장 많은 피해를 준 무기 (최대 ★ 는 빼고, 같으면 ★ 가 높은 쪽)', () => {
    const s = routeGame();
    applyItem(s, findItem('sling'));
    applyItem(s, findItem('longbow'));
    s.damageByWeapon = { sling: 10, longbow: 500 };
    assert.equal(forgeTarget(s)!.def.id, 'longbow');
    s.weapons.find((w) => w.def.id === 'longbow')!.level = s.config.merge.maxLevel;
    assert.equal(forgeTarget(s)!.def.id, 'sling');
    s.weapons.find((w) => w.def.id === 'sling')!.level = s.config.merge.maxLevel;
    assert.equal(forgeTarget(s), null);
    const t = routeGame();
    const sling = findItem('sling') as WeaponDef;
    t.weapons = [1, 2, 1].map((level) => ({ def: sling, cooldownLeft: 0, level, face: t.face, restLeft: 0 }));
    t.damageByWeapon = { sling: 1 };
    assert.equal(forgeTarget(t), t.weapons[1]);
  });

  test('모루로 올린 ★ 가 같은 ★ 무기와 셋이 되면 합쳐진다', () => {
    const s = routeGame();
    const sling = findItem('sling') as WeaponDef;
    s.weapons = [2, 2, 1].map((level) => ({ def: sling, cooldownLeft: 0, level, face: s.face, restLeft: 0 }));
    pick(s, 'forge');
    assert.equal(chooseForge(s, 2), true);
    assert.deepEqual(s.weapons.map((w) => w.level), [3]);
  });

  test('모루를 고르는 사이 쌓인 보상은 고른 뒤에 나온다', () => {
    const s = routeGame();
    applyItem(s, findItem('sling'));
    pick(s, 'forge');
    s.pendingRewards = 1;
    chooseForge(s, 0);
    assert.ok(s.choice);
  });

  test('🎲 도박꾼: 가진 골드 절반을 걸고 주사위 눈에 따라 잃거나 불린다', () => {
    const seen = new Set<number>();
    for (let seed = 1; seed <= 60; seed++) {
      const s = routeGame(seed);
      s.gold = 400;
      pick(s, 'gamble');
      const ev = s.events.find((e) => e.kind === 'gamble');
      assert.ok(ev && ev.kind === 'gamble');
      seen.add(ev.roll);
      assert.equal(ev.bet, 200);
      assert.equal(s.gold, 200 + Math.floor(200 * ROUTE.gambleMul[ev.roll - 1]), `눈 ${ev.roll}`);
    }
    assert.equal(seen.size, 6, '1~6 이 모두 나온다');
    // 평균은 건 돈보다 조금 낫다
    const mean = ROUTE.gambleMul.reduce((a, b) => a + b, 0) / 6;
    assert.ok(mean > 1 && mean < 1.5);
  });

  test('❓ 안개 속 사건: 두 갈래 선택지가 있는 사건이 열리고 게임은 계속 멈춰 있다', () => {
    const s = routeGame();
    pick(s, 'mystery');
    assert.ok(s.encounter);
    assert.ok(ENCOUNTERS[s.encounter]);
    assert.equal(ENCOUNTERS[s.encounter].options.length, 2);
    const t = s.time;
    step(s, 1);
    assert.equal(s.time, t);
    assert.ok(s.events.some((e) => e.kind === 'encounter'));
  });
});

describe('안개 속 사건', () => {
  function meet(id: EncounterId, seed = 1): GameState {
    const s = routeGame(seed);
    s.encounter = id;
    return s;
  }

  test('낡은 사당 · 기도한다: 최대 체력이 줄고 보상 카드를 고른다', () => {
    const s = meet('shrine');
    const max = s.tower.maxHp;
    assert.equal(chooseEncounter(s, 0), true);
    assert.equal(s.encounter, null);
    assert.ok(Math.abs(s.tower.maxHp - max * (1 - ENCOUNTER.shrineHpCost)) < 1e-6);
    assert.ok(s.tower.hp <= s.tower.maxHp);
    assert.ok(s.choice);
  });

  test('낡은 사당 · 쉬어 간다: 체력을 회복한다', () => {
    const s = meet('shrine');
    s.tower.hp = 100;
    chooseEncounter(s, 1);
    assert.ok(Math.abs(s.tower.hp - (100 + s.tower.maxHp * ENCOUNTER.shrineRest)) < 1e-6);
    assert.equal(s.choice, null);
  });

  test('수상한 행상 · 산다: 값을 내고 탑 강화 두 개, 골드가 모자라면 살 수 없다', () => {
    const s = meet('peddler');
    const cost = ENCOUNTER.peddlerBase + ENCOUNTER.peddlerPerRound * s.round;
    s.gold = cost - 1;
    assert.equal(chooseEncounter(s, 0), false);
    assert.equal(s.encounter, 'peddler');
    s.gold = cost;
    const t = { ...s.tower };
    assert.equal(chooseEncounter(s, 0), true);
    assert.equal(s.gold, 0);
    const changed = (['maxHp', 'regen', 'armor', 'damageMul', 'bonusIncome', 'attackSpeedMul', 'critChance', 'thorns', 'rangeBonus'] as const).filter((k) => s.tower[k] !== t[k]);
    assert.ok(changed.length >= 1, '탑이 강해졌다');
    assert.equal(s.events.filter((e) => e.kind === 'peddler').flatMap((e) => (e.kind === 'peddler' ? e.items : [])).length, ENCOUNTER.peddlerUpgrades);
    for (const ev of s.events) if (ev.kind === 'peddler') for (const id of ev.items) assert.ok(UPGRADES.some((u) => u.id === id));
  });

  test('수상한 행상 · 보낸다: 아무 일 없다', () => {
    const s = meet('peddler');
    s.gold = 500;
    assert.equal(chooseEncounter(s, 1), true);
    assert.equal(s.gold, 500);
  });

  test('별 조각 · 품는다: 궁극기 게이지가 가득 / 판다: 라운드에 따라 골드', () => {
    const a = meet('starshard');
    chooseEncounter(a, 0);
    assert.equal(a.ult, ULT.max);
    const b = meet('starshard');
    b.round = 6;
    const gold = b.gold;
    chooseEncounter(b, 1);
    assert.equal(b.gold, gold + ENCOUNTER.starshardGold + ENCOUNTER.starshardGoldPerRound * 6);
  });

  test('사건이 없을 때나 없는 선택지는 고를 수 없다', () => {
    const s = routeGame();
    assert.equal(chooseEncounter(s, 0), false);
    s.encounter = 'shrine';
    assert.equal(chooseEncounter(s, 2), false);
    assert.equal(s.encounter, 'shrine');
  });
});

describe('갈림길과 보상 카드가 겹칠 때', () => {
  test('갈림길이 열린 순간 부관/정예를 잡으면, 갈림길을 고른 뒤 보상 카드가 나온다', () => {
    const s = routeGame();
    applyItem(s, findItem('sling'));
    const e = placeAt(s, 60, 0);
    e.isElite = true;
    e.hp = 1;
    s.round = 2;
    s.roundTime = 0.99;
    step(s, 0.02);
    assert.equal(s.round, 3);
    assert.ok(s.route, '갈림길 먼저');
    assert.equal(s.choice, null);
    chooseRoute(s, s.route.indexOf('mystery') >= 0 ? (s.route.indexOf('mystery') + 1) % 3 : 0);
    assert.ok(s.choice, '그 다음 보상 카드');
  });

  test('사당에서 기도하는 사이 쌓인 보상도 이어서 나온다', () => {
    const s = routeGame();
    s.encounter = 'shrine';
    s.pendingRewards = 1;
    chooseEncounter(s, 0);
    assert.ok(s.choice);
    chooseReward(s, 0);
    assert.ok(s.choice, '쌓여 있던 보상');
    chooseReward(s, 0);
    assert.equal(s.choice, null);
  });
});
