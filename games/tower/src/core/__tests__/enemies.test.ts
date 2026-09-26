import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES, SHAMAN, SLIMELET, THIEF, findEnemy, findItem } from '../data.ts';
import { applyItem, step } from '../game.ts';
import { distToTower, dummyDef, placeAt, quietGame } from './helpers.ts';

const def = (id: string) => findEnemy(id);

describe('새 적 등장 시기', () => {
  test('슬라임 3, 도둑 4, 방패병 5, 주술사 6, 박쥐 8 라운드부터 나온다', () => {
    const minRound = (id: string) => ENEMIES.find((e) => e.id === id)?.minRound;
    assert.deepEqual(
      ['slime', 'thief', 'shield', 'shaman', 'bat'].map(minRound),
      [3, 4, 5, 6, 8],
    );
  });

  test('새끼 슬라임은 스스로 나오지 않는다 (분열로만)', () => {
    assert.equal(ENEMIES.some((e) => e.id === SLIMELET.id), false);
  });
});

describe('분열 슬라임', () => {
  test('죽으면 그 자리에서 새끼 슬라임 두 마리로 나뉜다', () => {
    const s = quietGame();
    applyItem(s, findItem('sling'));
    const slime = placeAt(s, 60, 0, def('slime'));
    slime.hp = 1;
    slime.speed = 0;
    step(s, 0.01);
    assert.equal(s.enemies.includes(slime), false);
    const kids = s.enemies.filter((e) => e.def.id === SLIMELET.id);
    assert.equal(kids.length, 2);
    for (const k of kids) {
      assert.ok(Math.hypot(k.x - slime.x, k.y - slime.y) <= 10, '분열한 자리 근처');
      assert.equal(k.hp, k.maxHp);
    }
    assert.equal(s.kills, 1, '부모 슬라임 처치는 센다');
  });

  test('새끼 슬라임은 더 나뉘지 않는다', () => {
    const s = quietGame();
    applyItem(s, findItem('sling'));
    const kid = placeAt(s, 60, 0, SLIMELET);
    kid.hp = 1;
    kid.speed = 0;
    step(s, 0.01);
    assert.equal(s.enemies.length, 0);
  });

  test('새끼도 라운드만큼 강해진다', () => {
    const s = quietGame({ waves: { hpGrowth: 1.5 } });
    s.round = 3;
    applyItem(s, findItem('sling'));
    const slime = placeAt(s, 60, 0, def('slime'));
    slime.hp = 1;
    slime.speed = 0;
    step(s, 0.01);
    const kid = s.enemies.find((e) => e.def.id === SLIMELET.id)!;
    assert.ok(Math.abs(kid.maxHp - SLIMELET.hp * 1.5 ** 2) < 1e-6);
  });
});

describe('도둑 고블린', () => {
  test('탑에 닿으면 탑을 때리지 않고 골드를 훔친다 (25 + 라운드×5, 가진 만큼까지)', () => {
    const s = quietGame();
    const thief = placeAt(s, 22, 0, def('thief'));
    step(s, 0.01);
    assert.equal(s.tower.hp, s.tower.maxHp);
    assert.equal(thief.stolen, THIEF.baseSteal + THIEF.perRound * 1);
    assert.equal(s.gold, 300 - thief.stolen);
    assert.equal(thief.fleeing, true);
    assert.ok(s.events.some((ev) => ev.kind === 'steal'));
  });

  test('골드가 적으면 있는 만큼만 훔친다', () => {
    const s = quietGame();
    s.gold = 7;
    const thief = placeAt(s, 22, 0, def('thief'));
    step(s, 0.01);
    assert.equal(thief.stolen, 7);
    assert.equal(s.gold, 0);
  });

  test('훔친 뒤에는 탑에서 멀어진다', () => {
    const s = quietGame();
    const thief = placeAt(s, 22, 0, def('thief'));
    step(s, 0.01);
    const before = distToTower(s, thief);
    step(s, 1);
    assert.ok(distToTower(s, thief) > before + thief.speed * 0.9);
  });

  test('화면 밖으로 도망치면 사라지고 골드는 돌아오지 않는다 (현상금·처치 없음)', () => {
    const s = quietGame();
    const thief = placeAt(s, 22, 0, def('thief'));
    step(s, 0.01);
    const gold = s.gold;
    for (let i = 0; i < 100 && s.enemies.includes(thief); i++) step(s, 0.1);
    assert.equal(s.enemies.includes(thief), false);
    assert.equal(s.gold, gold);
    assert.equal(s.kills, 0);
    assert.ok(s.events.some((ev) => ev.kind === 'escape'));
  });

  test('도망가는 도둑을 잡으면 현상금과 훔친 골드를 모두 받는다', () => {
    const s = quietGame();
    const thief = placeAt(s, 22, 0, def('thief'));
    step(s, 0.01);
    const stolen = thief.stolen;
    const gold = s.gold;
    applyItem(s, findItem('sling'));
    thief.hp = 1;
    step(s, 0.01);
    assert.equal(s.enemies.includes(thief), false);
    assert.equal(s.gold, gold + stolen + thief.bounty);
  });
});

describe('주술사', () => {
  test('탑에서 130 떨어진 곳에 멈춰 선다', () => {
    const s = quietGame();
    const shaman = placeAt(s, 200, 0, def('shaman'));
    for (let i = 0; i < 100; i++) step(s, 0.1);
    assert.ok(Math.abs(distToTower(s, shaman) - SHAMAN.stopDistance) < 1e-6);
  });

  test('2초마다 70 안의 다친 적을 최대 체력의 12% 만큼 치유한다 (최대 체력은 넘지 않음)', () => {
    const s = quietGame();
    placeAt(s, SHAMAN.stopDistance, 0, def('shaman'));
    const near = placeAt(s, SHAMAN.stopDistance, 40, dummyDef({ hp: 100 }));
    const far = placeAt(s, SHAMAN.stopDistance, 100, dummyDef({ hp: 100 }));
    const full = placeAt(s, SHAMAN.stopDistance - 30, 0, dummyDef({ hp: 100 }));
    near.hp = 50;
    far.hp = 50;
    full.hp = 95;
    step(s, 1.9);
    assert.equal(near.hp, 50, '아직 2초가 안 됨');
    step(s, 0.2);
    assert.equal(near.hp, 62);
    assert.equal(far.hp, 50);
    assert.equal(full.hp, 100);
    assert.ok(s.events.some((ev) => ev.kind === 'heal'));
  });
});

describe('방패병', () => {
  test('일반·관통 무기 피해는 절반만 받는다', () => {
    const s = quietGame();
    applyItem(s, findItem('sling'));
    const e = placeAt(s, 60, 0, def('shield'));
    e.speed = 0;
    const hp = e.hp;
    step(s, 0.01);
    assert.equal(hp - e.hp, 10);
  });

  test('공성·마법·카오스 무기 피해는 그대로 받는다', () => {
    const s = quietGame();
    applyItem(s, findItem('mortar'));
    const e = placeAt(s, 60, 0, def('shield'));
    e.speed = 0;
    const hp = e.hp;
    step(s, 0.01);
    assert.equal(hp - e.hp, 40);
  });
});

describe('박쥐 (비행)', () => {
  test('공성 무기는 박쥐만 있으면 쏘지 않는다', () => {
    const s = quietGame();
    applyItem(s, findItem('mortar'));
    const bat = placeAt(s, 60, 0, def('bat'));
    bat.speed = 0;
    step(s, 0.01);
    assert.equal(bat.hp, bat.maxHp);
    assert.equal(s.events.some((ev) => ev.kind === 'shot'), false);
  });

  test('공성 폭발 범위 안에 있어도 박쥐는 맞지 않는다', () => {
    const s = quietGame();
    applyItem(s, findItem('mortar'));
    const goblin = placeAt(s, 60, 0);
    const bat = placeAt(s, 62, 10, def('bat'));
    bat.speed = 0;
    step(s, 0.01);
    assert.ok(goblin.hp < 100);
    assert.equal(bat.hp, bat.maxHp);
  });

  test('다른 무기는 박쥐를 맞힌다', () => {
    const s = quietGame();
    applyItem(s, findItem('sling'));
    const bat = placeAt(s, 60, 0, def('bat'));
    bat.speed = 0;
    step(s, 0.01);
    assert.ok(bat.hp < bat.maxHp);
  });
});
