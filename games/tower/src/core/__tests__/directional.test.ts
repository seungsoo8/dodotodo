import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { BOSS_PATTERN, findEnemy, findItem } from '../data.ts';
import { applyItem, createGame, selectFace, spawnEnemy, step, towerDamageTaken } from '../game.ts';
import { effectiveWeapon } from '../sets.ts';
import { SKILL, findSkill, meteorDamage, useSkill } from '../skills.ts';
import type { WeaponDef } from '../types.ts';
import { directionalGame, distToTower, dummyDef, giveSkills, placeAt, quietGame } from './helpers.ts';

describe('눈보라: 한 길을 얼린다', () => {
  test('겨눈 길(동쪽)의 적만 4초 동안 얼고, 다른 길의 적은 그대로 움직인다', () => {
    const s = quietGame();
    giveSkills(s, [['blizzard', false]]);
    const east = placeAt(s, 150, 0, dummyDef({ speed: 40 }));
    const west = placeAt(s, -150, 0, dummyDef({ speed: 40 }));
    assert.equal(useSkill(s, 'blizzard', { x: s.tower.x + 100, y: s.tower.y + 10 }), true);
    const [de, dw] = [distToTower(s, east), distToTower(s, west)];
    step(s, 3.9);
    assert.equal(distToTower(s, east), de);
    assert.ok(distToTower(s, west) < dw);
    step(s, 0.2);
    step(s, 0.5);
    assert.ok(distToTower(s, east) < de, '4초 뒤에는 다시 움직인다');
  });

  test('겨누지 않으면 적이 가장 많은 길을 얼린다', () => {
    const s = quietGame();
    giveSkills(s, [['blizzard', false]]);
    const north = [placeAt(s, 0, -100), placeAt(s, 10, -140)];
    const south = placeAt(s, 0, 100);
    useSkill(s, 'blizzard');
    for (const e of north) assert.equal(e.slowFactor, 0);
    assert.equal(south.slowTimeLeft, 0);
  });

  test('진화(영구 동토): 6초 동안 얼린다', () => {
    const s = quietGame();
    giveSkills(s, [['blizzard', true]]);
    const e = placeAt(s, 150, 0);
    useSkill(s, 'blizzard', { x: e.x, y: e.y });
    assert.equal(e.slowTimeLeft, SKILL.freezeEvolved);
    assert.equal(SKILL.freezeEvolved, 6);
  });

  test('적이 없으면 쓰지 않는다', () => {
    const s = quietGame();
    giveSkills(s, [['blizzard', false]]);
    assert.equal(useSkill(s, 'blizzard'), false);
  });
});

describe('돌풍: 한 길을 밀어낸다', () => {
  test('겨눈 길의 적만 110 밀어내고 약한 피해, 다른 길은 그대로', () => {
    const s = quietGame();
    giveSkills(s, [['gust', false]]);
    const east = placeAt(s, 40, 0, dummyDef({ hp: 1000 }));
    const north = placeAt(s, 0, -40, dummyDef({ hp: 1000 }));
    useSkill(s, 'gust', { x: s.tower.x + 80, y: s.tower.y });
    assert.ok(Math.abs(distToTower(s, east) - 150) < 1e-6);
    assert.ok(Math.abs(1000 - east.hp - meteorDamage(s) * SKILL.gustMul) < 1e-6);
    assert.equal(distToTower(s, north), 40);
    assert.equal(north.hp, 1000);
  });

  test('화면 밖으로는 밀려나지 않는다', () => {
    const s = quietGame();
    giveSkills(s, [['gust', true]]);
    const e = placeAt(s, 300, 0);
    useSkill(s, 'gust', { x: e.x, y: e.y });
    assert.ok(e.x <= s.config.width && e.x >= 0);
  });
});

describe('바리케이드 (새 기본 스킬)', () => {
  test('땅 속성 기본 스킬이고 겨눠서 쓴다', () => {
    const def = findSkill('barricade');
    assert.equal(def.tier, 'base');
    assert.deepEqual(def.tags, ['earth']);
    assert.equal(def.aimed, true);
  });

  test('막은 길의 땅 적은 바리케이드(탑에서 90) 앞에서 멈추고, 풀리면 다시 온다', () => {
    const s = quietGame();
    giveSkills(s, [['barricade', false]]);
    const e = placeAt(s, 0, 150, dummyDef({ speed: 40 }));
    useSkill(s, 'barricade', { x: s.tower.x, y: s.tower.y + 120 });
    for (let i = 0; i < 50; i++) step(s, 0.1);
    assert.ok(Math.abs(distToTower(s, e) - SKILL.barricadeDist) < 1e-6);
    for (let i = 0; i < 20; i++) step(s, 0.1);
    assert.ok(distToTower(s, e) < SKILL.barricadeDist, `${SKILL.barricadeSeconds}초 뒤 풀린다`);
  });

  test('다른 길 적과 날아다니는 적은 막지 못한다', () => {
    const s = quietGame();
    giveSkills(s, [['barricade', false]]);
    const east = placeAt(s, 150, 0, dummyDef({ speed: 40 }));
    const bat = placeAt(s, 0, 150, dummyDef({ speed: 40, ability: 'flying' }));
    useSkill(s, 'barricade', { x: s.tower.x, y: s.tower.y + 120 });
    for (let i = 0; i < 40; i++) step(s, 0.1);
    assert.ok(distToTower(s, east) < 90);
    assert.ok(distToTower(s, bat) < 90);
  });

  test('이미 바리케이드 안쪽에 있던 적은 막히지 않는다', () => {
    const s = quietGame();
    giveSkills(s, [['barricade', false]]);
    const e = placeAt(s, 0, 60, dummyDef({ speed: 40 }));
    useSkill(s, 'barricade', { x: s.tower.x, y: s.tower.y + 120 });
    step(s, 0.5);
    assert.ok(distToTower(s, e) < 60);
  });

  test('진화(철벽): 10초 동안 막고, 막힌 적은 초당 메테오의 0.2배 피해', () => {
    const s = quietGame();
    giveSkills(s, [['barricade', true]]);
    const e = placeAt(s, 0, 91, dummyDef({ hp: 1e6, speed: 40 }));
    useSkill(s, 'barricade', { x: e.x, y: e.y });
    assert.equal(s.barricades[0].left, 10);
    for (let i = 0; i < 10; i++) step(s, 0.1);
    const perSec = meteorDamage(s) * SKILL.barricadeDps;
    assert.ok(Math.abs(1e6 - e.hp - perSec) < perSec * 0.05, `${1e6 - e.hp} ≈ ${perSec}`);
  });
});

describe('탑별 방향 성격', () => {
  test('수호탑: 무기가 없는 면으로 들어온 적에게 받는 피해 -40%', () => {
    const s = createGame({ seed: 1, hero: 'guardian', config: { startWeapons: [], rewards: { every: 0 }, route: { every: 0 }, waves: { baseCount: 0, countPerRound: 0 } } });
    selectFace(s, 'e');
    applyItem(s, findItem('sling'));
    const atk = dummyDef({ atk: 100, hp: 1e9 });
    // 서쪽(무기 없음)에서 때림
    spawnEnemy(s, atk, s.tower.x - s.tower.radius - atk.radius, s.tower.y);
    step(s, 0.01);
    const west = s.tower.maxHp - s.tower.hp;
    assert.ok(Math.abs(west - towerDamageTaken(s.config, 100, s.tower.armor) * 0.6) < 1e-6);
  });

  test('수호탑: 무기가 있는 면으로 들어온 적은 그대로 아프다', () => {
    const s = createGame({ seed: 1, hero: 'guardian', config: { startWeapons: [], rewards: { every: 0 }, route: { every: 0 }, waves: { baseCount: 0, countPerRound: 0 } } });
    selectFace(s, 'e');
    applyItem(s, findItem('battle_axe'));
    const atk = dummyDef({ atk: 100, hp: 1e9 });
    spawnEnemy(s, atk, s.tower.x + s.tower.radius + atk.radius, s.tower.y);
    step(s, 0.01);
    assert.ok(Math.abs(s.tower.maxHp - s.tower.hp - towerDamageTaken(s.config, 100, s.tower.armor)) < 1e-6);
  });

  test('마법탑: 마법 무기는 150° 를 쏜다 (다른 계열은 120°)', () => {
    const s = createGame({ seed: 1, hero: 'mage' });
    const bolt = findItem('chain_bolt') as WeaponDef;
    const sling = findItem('sling') as WeaponDef;
    assert.equal(effectiveWeapon(s, bolt).arc, 150);
    assert.equal(effectiveWeapon(s, sling).arc, 120);
  });

  test('마법탑: 옆으로 70° 떨어진 적도 연쇄 번개가 맞힌다 (보통 무기는 60° 까지)', () => {
    const s = directionalGame();
    s.hero = 'mage';
    selectFace(s, 'e');
    applyItem(s, findItem('chain_bolt'));
    const rad = (70 * Math.PI) / 180;
    const e = placeAt(s, Math.cos(rad) * 80, Math.sin(rad) * 80);
    step(s, 0.01);
    assert.ok(e.hp < 100);
  });
});

describe('강철 뿔 돌진: 들이받은 면의 무기가 잠시 멈춘다', () => {
  test(`동쪽에서 들이받으면 동쪽 무기만 ${BOSS_PATTERN.chargeStun}초 쉰다`, () => {
    const s = directionalGame();
    selectFace(s, 'e');
    applyItem(s, findItem('sling'));
    selectFace(s, 'w');
    applyItem(s, findItem('mortar'));
    const boss = spawnEnemy(s, findEnemy('boss_rhino'), s.tower.x + 60, s.tower.y);
    boss.pattern!.phase = 'dash';
    for (let i = 0; i < 60 && !s.events.some((ev) => ev.kind === 'bossSlam'); i++) step(s, 1 / 60);
    const slam = s.events.find((ev) => ev.kind === 'bossSlam');
    assert.ok(slam && slam.kind === 'bossSlam' && slam.face === 'e');
    const [east, west] = s.weapons;
    assert.ok(east.restLeft > BOSS_PATTERN.chargeStun - 0.1);
    assert.equal(west.restLeft, 0);
  });
});

describe('어느 면으로 맞았는지', () => {
  test('탑이 맞으면 피격 이벤트에 때린 적이 있는 면이 실린다', () => {
    const s = quietGame();
    placeAt(s, 0, s.tower.radius + 5, dummyDef({ atk: 10 }));
    step(s, 0.01);
    const hit = s.events.find((ev) => ev.kind === 'towerHit');
    assert.ok(hit && hit.kind === 'towerHit');
    assert.equal(hit.face, 's');
  });
});
