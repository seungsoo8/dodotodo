import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { refreshStats } from '../combat.ts';
import { joinParty } from '../party.ts';
import { TAG, REVIVE } from '../tag.ts';
import { WIND } from '../wind.ts';
import { freeze, hold, idle, placeAt, play } from './helpers.ts';

function team() {
  const g = play('toby', 'toybox');
  joinParty(g.save, 'bori');
  joinParty(g.save, 'ruru');
  refreshStats(g);
  g.save.hp = g.stats.maxHp;
  return g;
}

describe('탐험대 교대', () => {
  test('바꿔 들면 그 동료가 나서고, 잠깐은 다시 못 바꾼다', () => {
    const g = team();
    hold(g, { swap: 'bori' }, 1 / 60);
    assert.equal(g.save.hero, 'bori');
    assert.ok(g.world.events.some((e) => e.kind === 'tag' && e.from === 'toby' && e.to === 'bori'));
    hold(g, { swap: 'toby' }, 1 / 60);
    assert.equal(g.save.hero, 'bori', '교대 대기');
    idle(g, TAG.cd);
    hold(g, { swap: 'next' }, 1 / 60);
    assert.equal(g.save.hero, 'ruru');
  });

  test('교대 기술: 들어서는 동료가 주변 적을 친다', () => {
    const g = team();
    const m = freeze(placeAt(g, 'ragdoll', 30, 0, 5));
    m.hp = m.maxHp = 1e6;
    hold(g, { swap: 'bori' }, 0.3);
    assert.ok(g.world.events.some((e) => e.kind === 'hit' && e.targetId === m.id));
  });

  test('쉬는 동료는 HP 가 조금씩 찬다', () => {
    const g = team();
    g.save.hp = 10;
    hold(g, { swap: 'bori' }, 1 / 60);
    const before = g.save.bench.toby!.hp;
    idle(g, 5);
    assert.ok(g.save.bench.toby!.hp > before);
  });

  test('싸우던 동료가 쓰러지면 다른 동료가 나서고, 쓰러진 동료는 시간이 지나면 일어난다', () => {
    const g = team();
    const m = placeAt(g, 'fluff', 10, 0, 1);
    m.atk = 1e6;
    g.save.hp = 1;
    idle(g, 0.5);
    assert.notEqual(g.save.hero, 'toby');
    assert.equal(g.world.player.state === 'dead', false);
    assert.ok(g.world.events.some((e) => e.kind === 'heroDown' && e.hero === 'toby'));
    assert.ok(g.save.bench.toby!.down > 0);
    g.world.monsters = [];
    idle(g, REVIVE.time + 0.5);
    assert.equal(g.save.bench.toby!.down, 0);
    assert.ok(g.save.bench.toby!.hp > 0);
  });

  test('모두 쓰러지면 그때 쓰러진다', () => {
    const g = play('toby', 'toybox');
    const m = placeAt(g, 'fluff', 10, 0, 1);
    m.atk = 1e6;
    g.save.hp = 1;
    idle(g, 0.5);
    assert.ok(g.world.events.some((e) => e.kind === 'died'));
  });
});

describe('태엽 감기', () => {
  test('멈춰서 W 를 누르고 있으면 빠르게 감기고, 가득 채우면 태엽 가득', () => {
    const g = play('toby', 'toybox');
    g.save.sp = 10;
    const atk = g.stats.atk;
    hold(g, { wind: true }, 1);
    assert.ok(g.save.sp >= 10 + WIND.rate * 0.9);
    hold(g, { wind: true }, 2);
    assert.equal(g.save.sp, 100);
    assert.ok(g.world.events.some((e) => e.kind === 'overwind'));
    assert.ok(g.stats.atk > atk * 1.2);
  });

  test('움직이면서는 감을 수 없다', () => {
    const g = play('toby', 'toybox');
    g.save.sp = 10;
    hold(g, { wind: true, move: { x: 1, y: 0 } }, 1);
    assert.ok(g.save.sp < 10 + WIND.rate * 0.3);
  });

  test('적을 때리면 태엽이 감긴다', () => {
    const g = play('toby', 'toybox');
    g.save.sp = 0;
    g.stats.spRegen = 0;
    const m = freeze(placeAt(g, 'ragdoll', 24, 0, 5));
    m.hp = m.maxHp = 1e6;
    hold(g, { attack: true }, 0.5);
    assert.ok(g.save.sp >= WIND.perHit);
  });
});
