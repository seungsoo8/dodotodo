import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { findItem } from '../data.ts';
import { applyItem, choosePerk, step } from '../game.ts';
import { SKILLS, bestMeteorTarget, findSkill, skillCooldownLeft, skillUnlocked, useSkill } from '../skills.ts';
import { distToTower, dummyDef, placeAt, quietGame } from './helpers.ts';

const meteor = findSkill('meteor');

describe('스킬 목록', () => {
  test('메테오(Q)·눈보라(W)·긴급 수리(E)·골드 러시(D) 4종, 1·3·6·9 라운드에 풀린다', () => {
    assert.deepEqual(
      SKILLS.map((s) => [s.id, s.key, s.unlockRound]),
      [
        ['meteor', 'Q', 1],
        ['blizzard', 'W', 3],
        ['repair', 'E', 6],
        ['gold_rush', 'D', 9],
      ],
    );
  });

  test('잠긴 스킬은 쓸 수 없다', () => {
    const s = quietGame();
    assert.equal(skillUnlocked(s, 'blizzard'), false);
    assert.equal(useSkill(s, 'blizzard'), false);
    s.round = 3;
    assert.equal(skillUnlocked(s, 'blizzard'), true);
    assert.equal(useSkill(s, 'blizzard'), true);
  });
});

describe('메테오', () => {
  test('지점 반경 55 안의 적 모두에게 150 피해, 밖은 멀쩡', () => {
    const s = quietGame();
    const center = { x: s.tower.x + 150, y: s.tower.y };
    const a = placeAt(s, 150, 0, dummyDef({ hp: 1000 }));
    const b = placeAt(s, 150, 50, dummyDef({ hp: 1000 }));
    const c = placeAt(s, 150, 70, dummyDef({ hp: 1000 }));
    assert.equal(useSkill(s, 'meteor', center), true);
    assert.deepEqual([a.hp, b.hp, c.hp], [850, 850, 1000]);
    assert.ok(s.events.some((ev) => ev.kind === 'skill' && ev.id === 'meteor'));
  });

  test('날아다니는 적(박쥐)도 맞는다', () => {
    const s = quietGame();
    const bat = placeAt(s, 150, 0, dummyDef({ hp: 1000, ability: 'flying' }));
    useSkill(s, 'meteor', { x: bat.x, y: bat.y });
    assert.equal(bat.hp, 850);
  });

  test('라운드가 오를수록 적 체력 성장만큼 세진다', () => {
    const s = quietGame({ waves: { hpGrowth: 1.5 } });
    s.round = 3;
    const e = placeAt(s, 150, 0, dummyDef({ hp: 1e6 }));
    const before = e.hp;
    useSkill(s, 'meteor', { x: e.x, y: e.y });
    assert.ok(Math.abs(before - e.hp - 150 * 1.5 ** 2) < 1e-6);
  });

  test('쓰고 나면 30초 동안 다시 못 쓴다', () => {
    const s = quietGame();
    const p = { x: 100, y: 100 };
    assert.equal(useSkill(s, 'meteor', p), true);
    assert.equal(skillCooldownLeft(s, 'meteor'), meteor.cooldown);
    assert.equal(useSkill(s, 'meteor', p), false);
    step(s, 29.9);
    assert.equal(useSkill(s, 'meteor', p), false);
    step(s, 0.2);
    assert.equal(useSkill(s, 'meteor', p), true);
  });

  test('지점을 안 주면 적이 가장 많이 모인 곳에 떨어진다 (적이 없으면 쓰지 않음)', () => {
    const s = quietGame();
    assert.equal(bestMeteorTarget(s), null);
    assert.equal(useSkill(s, 'meteor'), false);
    placeAt(s, -150, 0);
    const pack = [placeAt(s, 150, 0), placeAt(s, 160, 10), placeAt(s, 150, 20)];
    const at = bestMeteorTarget(s)!;
    assert.ok(Math.hypot(at.x - pack[0].x, at.y - pack[0].y) <= 25);
    useSkill(s, 'meteor');
    assert.ok(pack.every((e) => e.hp < 100));
  });
});

describe('눈보라', () => {
  test('모든 적이 3초 동안 얼어붙어 움직이지도 탑을 때리지도 못하고, 그 뒤 다시 움직인다', () => {
    const s = quietGame();
    s.round = 3;
    const walker = placeAt(s, 150, 0, dummyDef({ speed: 40 }));
    placeAt(s, 21, 0, dummyDef({ atk: 50 }));
    useSkill(s, 'blizzard');
    const d = distToTower(s, walker);
    step(s, 2.9);
    assert.equal(distToTower(s, walker), d);
    assert.equal(s.tower.hp, s.tower.maxHp);
    step(s, 0.2);
    step(s, 0.5);
    assert.ok(distToTower(s, walker) < d);
    assert.ok(s.tower.hp < s.tower.maxHp);
  });
});

describe('긴급 수리', () => {
  test('탑 체력을 최대 체력의 35% 회복한다 (최대를 넘지 않음)', () => {
    const s = quietGame();
    s.round = 6;
    s.tower.hp = 100;
    useSkill(s, 'repair');
    assert.equal(s.tower.hp, 450);
    s.tower.hp = 900;
    s.skillCooldowns.repair = 0;
    useSkill(s, 'repair');
    assert.equal(s.tower.hp, 1000);
  });
});

describe('골드 러시', () => {
  test('10초 동안 처치 현상금이 2배, 그 뒤 원래대로', () => {
    const s = quietGame();
    s.round = 9;
    applyItem(s, findItem('sling'));
    useSkill(s, 'gold_rush');
    // 9라운드라 적이 강해져 있으므로 체력·현상금을 직접 맞춘다
    const weak = () => {
      const e = placeAt(s, 60, 0);
      e.hp = 1;
      e.bounty = 10;
    };
    weak();
    let gold = s.gold;
    step(s, 0.01);
    assert.equal(s.gold, gold + 20);
    step(s, 10);
    weak();
    gold = s.gold;
    step(s, 1);
    assert.equal(s.gold, gold + 10);
  });
});

describe('스킬 공통', () => {
  test('주문 숙련 특전이 있으면 재사용 시간 -30%', () => {
    const s = quietGame();
    s.choice = ['skill_master', 'skill_master', 'skill_master'];
    choosePerk(s, 0);
    useSkill(s, 'meteor', { x: 1, y: 1 });
    assert.ok(Math.abs(skillCooldownLeft(s, 'meteor') - meteor.cooldown * 0.7) < 1e-9);
  });

  test('보상 카드를 고르는 중이나 게임이 끝나면 쓸 수 없다', () => {
    const s = quietGame();
    s.choice = ['lucky', 'sharpen', 'interest'];
    assert.equal(useSkill(s, 'meteor', { x: 1, y: 1 }), false);
    s.choice = null;
    s.status = 'lost';
    assert.equal(useSkill(s, 'meteor', { x: 1, y: 1 }), false);
  });
});
