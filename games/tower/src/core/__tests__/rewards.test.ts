import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { findItem } from '../data.ts';
import { applyItem, chooseReward, step, type GameState } from '../game.ts';
import { GOLD_POUCH, PERKS, hasPerk } from '../perks.ts';
import { cardKey, drawRewards, skillCards, type RewardCard } from '../rewards.ts';
import { BASE_SKILLS } from '../skills.ts';
import { giveSkills, placeAt, quietGame } from './helpers.ts';

function advanceTo(s: GameState, round: number): void {
  for (let i = 0; i < 10000 && s.round < round && !s.choice; i++) step(s, 0.25);
}

const isSkillCard = (c: RewardCard) => c.kind !== 'perk';

/** 배울 것도 진화할 것도 합칠 것도 없는 상태 (특전 카드만 나오게) */
function noSkillCards(s: GameState): void {
  s.skills = [];
  s.consumedSkills = BASE_SKILLS.map((k) => k.id);
}

describe('보상 카드 (3라운드마다, 특전과 스킬을 한 번에)', () => {
  test('3라운드가 시작되면 서로 다른 카드 3장이 나온다 (2라운드에는 없다)', () => {
    const s = quietGame({ roundSeconds: 1, rewards: { every: 3 } });
    advanceTo(s, 2);
    assert.equal(s.choice, null);
    advanceTo(s, 3);
    assert.equal(s.round, 3);
    const cards = s.choice as RewardCard[] | null;
    assert.ok(cards);
    assert.equal(cards.length, 3);
    assert.equal(new Set(cards.map(cardKey)).size, 3);
    assert.ok(s.events.some((ev) => ev.kind === 'choice'));
  });

  test('고르는 동안 게임이 멈추고, 고르면 다시 흐른다', () => {
    const s = quietGame({ roundSeconds: 1, rewards: { every: 3 } });
    advanceTo(s, 3);
    const t = s.time;
    step(s, 5);
    assert.equal(s.time, t);
    assert.equal(chooseReward(s, 0), true);
    assert.equal(s.choice, null);
    step(s, 0.5);
    assert.ok(s.time > t);
  });

  test('스킬로 할 수 있는 것이 있으면 스킬 카드가 1장 이상, 2장 이하로 섞인다', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const s = quietGame({}, seed);
      const cards = drawRewards(s, 3);
      const n = cards.filter(isSkillCard).length;
      assert.ok(n >= 1 && n <= 2, `시드 ${seed}: 스킬 카드 ${n}장`);
      assert.ok(cards.some((c) => c.kind === 'perk'), `시드 ${seed}: 특전 카드도 있다`);
    }
  });

  test('스킬로 할 수 있는 것: 빈 칸이 있으면 배우기, 가진 기본 스킬은 진화, 재료가 모이면 합체', () => {
    const s = quietGame();
    giveSkills(s, [['meteor', false], ['blizzard', true]]);
    const keys = skillCards(s).map(cardKey);
    assert.ok(keys.includes('learn:thunder'));
    assert.ok(!keys.includes('learn:meteor'), '가진 스킬은 다시 못 배운다');
    assert.ok(keys.includes('evolve:meteor'));
    assert.ok(!keys.includes('evolve:blizzard'), '이미 진화함');
    assert.ok(keys.includes('fuse:comet'));
    assert.ok(!keys.includes('fuse:ice_wall'), '재료(긴급 수리)가 없다');
  });

  test('칸이 꽉 차면 배우기 카드는 나오지 않는다', () => {
    const s = quietGame();
    giveSkills(s, [['meteor', true], ['blizzard', true], ['repair', true], ['gold_rush', true]]);
    const cards = skillCards(s);
    assert.ok(cards.length > 0);
    assert.ok(cards.every((c) => c.kind === 'fuse'));
  });

  test('배우기 카드를 고르면 빈 칸에 그 스킬이 들어간다', () => {
    const s = quietGame();
    s.choice = [{ kind: 'learn', id: 'thunder' }];
    assert.equal(chooseReward(s, 0), true);
    assert.deepEqual(s.skills.map((k) => k.id), ['meteor', 'thunder']);
    assert.ok(s.events.some((ev) => ev.kind === 'learn' && ev.id === 'thunder'));
  });

  test('진화 카드를 고르면 그 스킬이 진화한다', () => {
    const s = quietGame();
    s.choice = [{ kind: 'evolve', id: 'meteor' }];
    chooseReward(s, 0);
    assert.equal(s.skills[0].evolved, true);
    assert.ok(s.events.some((ev) => ev.kind === 'evolve' && ev.id === 'meteor'));
  });

  test('합체 카드를 고르면 두 재료가 합체 스킬 하나가 된다', () => {
    const s = quietGame();
    giveSkills(s, [['meteor', false], ['blizzard', false]]);
    s.choice = [{ kind: 'fuse', id: 'comet' }];
    chooseReward(s, 0);
    assert.deepEqual(s.skills.map((k) => k.id), ['comet']);
  });

  test('특전 카드를 고르면 특전을 얻는다', () => {
    const s = quietGame();
    s.choice = [{ kind: 'perk', id: 'sharpen' }];
    chooseReward(s, 0);
    assert.ok(hasPerk(s, 'sharpen'));
    assert.ok(s.events.some((ev) => ev.kind === 'perk' && ev.id === 'sharpen'));
  });

  test('없는 카드 번호나 선택 중이 아닐 때는 고를 수 없다', () => {
    const s = quietGame();
    assert.equal(chooseReward(s, 0), false);
    s.choice = [{ kind: 'perk', id: 'sharpen' }];
    assert.equal(chooseReward(s, 5), false);
    assert.ok(s.choice);
  });

  test('이미 가진 특전은 나오지 않는다', () => {
    const s = quietGame();
    noSkillCards(s);
    s.perks = PERKS.slice(0, 13).map((p) => p.id);
    const cards = drawRewards(s, 3);
    assert.deepEqual(cards.map((c) => c.id).sort(), PERKS.slice(13).map((p) => p.id).sort());
  });

  test('특전도 스킬 할 것도 없으면 골드 주머니가 나오고, 고르면 골드(100 + 라운드×30)', () => {
    const s = quietGame({ roundSeconds: 1, rewards: { every: 3 } });
    noSkillCards(s);
    s.perks = PERKS.map((p) => p.id);
    advanceTo(s, 3);
    assert.deepEqual(s.choice!.map((c) => c.id), [GOLD_POUCH.id, GOLD_POUCH.id, GOLD_POUCH.id]);
    const gold = s.gold;
    chooseReward(s, 0);
    assert.equal(s.gold, gold + 100 + 3 * 30);
  });

  test('정예를 잡으면 보상 카드가 한 번 더 나온다', () => {
    const s = quietGame();
    applyItem(s, findItem('sling'));
    const e = placeAt(s, 60, 0);
    e.isElite = true;
    e.hp = 1;
    step(s, 0.01);
    assert.ok(s.choice);
    assert.equal(s.choice.length, 3);
  });

  test('카드를 고르는 사이 보상이 또 생기면, 고른 뒤 바로 다음 카드가 나온다', () => {
    const s = quietGame({ roundSeconds: 1, rewards: { every: 3 } });
    applyItem(s, findItem('sling'));
    const e = placeAt(s, 60, 0);
    e.isElite = true;
    e.hp = 1;
    // 3라운드가 시작되는 순간 정예도 쓰러진다
    s.round = 2;
    s.roundTime = 0.99;
    step(s, 0.02);
    assert.equal(s.round, 3);
    assert.ok(s.choice);
    chooseReward(s, 0);
    assert.ok(s.choice, '두 번째 카드');
    chooseReward(s, 0);
    assert.equal(s.choice, null);
  });
});
