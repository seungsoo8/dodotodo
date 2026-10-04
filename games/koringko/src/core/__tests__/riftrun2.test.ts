import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { applyRule, RULES, startRun, BOX_MILESTONE } from '../riftrun.ts';
import { interactTarget } from '../game.ts';
import { structureSpot } from '../rescue.ts';
import { joinParty } from '../party.ts';
import type { Game } from '../game.ts';
import { clearField, fixedRng, freeze, hold, idle, placeAt, play } from './helpers.ts';

function inBox(start = 1): Game {
  const g = play('toby', 'village');
  g.save.flags.rift_open = true;
  g.save.riftBest = 30;
  assert.equal(startRun(g, start), true);
  clearField(g);
  g.rng = fixedRng();
  return g;
}

function clearFloor(g: Game): void {
  g.world.rift!.gauge = 100;
  idle(g, 0.05);
  const guard = g.world.monsters.find((m) => m.guardian)!;
  guard.spawnLeft = 0;
  guard.hp = 0;
  idle(g, 0.05);
}

describe('다락방 상자 규칙 (집 안 장난감다운 것)', () => {
  test('새 규칙: 얼음 땡 잔치 · 태엽 고장 · 교대 릴레이 · 보물 상자', () => {
    for (const r of ['freezeRush', 'windless', 'relay', 'treasure'] as const) assert.ok(RULES[r].name && RULES[r].desc, r);
  });

  test('얼음 땡 잔치: 얼음이 곧바로, 자주 오고 보상이 많다', () => {
    const g = inBox();
    applyRule(g, 'freezeRush');
    assert.ok(g.world.freeze.next <= 8);
    assert.ok(g.world.mods.reward > 1);
    g.world.freeze.next = 0.01;
    idle(g, 0.05);
    idle(g, 10);
    assert.equal(g.world.freeze.phase, 'none');
    assert.ok(g.world.freeze.next < 30, `다음 얼음도 금방 (${g.world.freeze.next})`);
  });

  test('태엽 고장: 저절로는 태엽이 감기지 않지만, W 로 감기는 된다', () => {
    const g = inBox();
    applyRule(g, 'windless');
    g.save.sp = 10;
    idle(g, 2);
    assert.equal(Math.round(g.save.sp), 10);
    hold(g, { wind: true }, 0.5);
    assert.ok(g.save.sp > 20);
  });

  test('교대 릴레이: 교대 기술이 훨씬 세다', () => {
    const dmg = (relay: boolean) => {
      const g = inBox();
      if (relay) applyRule(g, 'relay');
      joinParty(g.save, 'bori');
      const m = freeze(placeAt(g, 'fluff', 30, 0, 30));
      m.hp = m.maxHp = 1e7;
      g.world.events = [];
      hold(g, { swap: 'bori' }, 1 / 60);
      return g.world.events.reduce((a, e) => a + (e.kind === 'hit' ? e.amount : 0), 0);
    };
    assert.ok(dmg(true) > dmg(false) * 1.8);
  });

  test('보물 상자: 층 어딘가에 상자가 나오고, 열면 부품이나 단추 · 재료를 많이 준다', () => {
    const g = inBox();
    applyRule(g, 'treasure');
    const chest = g.world.map.structures.find((s) => s.kind === 'chest');
    assert.ok(chest);
    const at = structureSpot(chest);
    g.world.player.x = at.x;
    g.world.player.y = at.y;
    assert.equal(interactTarget(g)?.kind, 'chest');
    const gold = g.save.gold;
    const parts = Object.keys(g.save.parts).length;
    hold(g, { attack: true, attackPressed: true }, 1 / 60);
    assert.ok(Object.keys(g.save.parts).length > parts || g.save.gold >= gold + 200);
  });
});

describe('다락방 상자 이정표 보상', () => {
  test(`${BOX_MILESTONE}층마다 처음 깨면 특별한 선물 (다시 깨면 없다)`, () => {
    const g = inBox(6);
    g.save.riftBest = 9;
    g.run!.depth = 10;
    g.world.rift!.depth = 10;
    const stars = g.save.mats.star;
    clearFloor(g);
    const gift = g.world.events.find((e) => e.kind === 'boxGift');
    assert.ok(gift && gift.kind === 'boxGift' && gift.depth === 10);
    assert.ok(g.save.mats.star > stars);
    // 다시 10층을 깨도 선물은 없다
    const g2 = inBox(6);
    g2.save.riftBest = 12;
    g2.save.flags = { ...g2.save.flags, box_gift_10: true };
    g2.run!.depth = 10;
    g2.world.rift!.depth = 10;
    clearFloor(g2);
    assert.ok(!g2.world.events.some((e) => e.kind === 'boxGift'));
  });
});
