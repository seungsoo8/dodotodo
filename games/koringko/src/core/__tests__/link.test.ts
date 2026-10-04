import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { castCheck } from '../player.ts';
import { DUO, LINK, UNWOUND } from '../link.ts';
import { joinParty } from '../party.ts';
import type { Game } from '../game.ts';
import { freeze, hold, idle, placeAt, play } from './helpers.ts';

function duoGame(): Game {
  const g = play('toby', 'toybox');
  joinParty(g.save, 'bori');
  g.save.bench.bori!.sp = 100;
  return g;
}

/** 이벤트에서 맞은 피해 합 */
function dealt(g: Game, id: number): number {
  return g.world.events.reduce((a, e) => a + (e.kind === 'hit' && e.targetId === id ? e.amount : 0), 0);
}

describe('교대 연계: 바꿔 든 뒤 첫 스킬', () => {
  test('바꿔 들고 곧바로 쓰는 스킬은 태엽이 들지 않는다', () => {
    const g = duoGame();
    hold(g, { swap: 'bori' }, 1 / 60);
    g.save.sp = 0;
    assert.equal(castCheck(g, 'b_slam').ok, true);
    hold(g, { skill: 'A' }, 1 / 60);
    assert.ok(g.save.sp < 1, '태엽을 쓰지 않았다');
    assert.ok(g.world.events.some((e) => e.kind === 'link'));
    assert.equal(g.world.player.linkLeft, 0, '한 번만');
  });

  test('연계 스킬은 피해가 더 크다', () => {
    const run = (link: boolean) => {
      const g = duoGame();
      const m = freeze(placeAt(g, 'fluff', 80, 0, 1));
      m.hp = m.maxHp = 1e7;
      hold(g, { swap: 'bori' }, 1 / 60);
      if (!link) idle(g, LINK.time + 0.1);
      g.save.sp = 100;
      g.world.events = [];
      hold(g, { skill: 'A' }, 0.5);
      return dealt(g, m.id);
    };
    const withLink = run(true);
    const without = run(false);
    assert.ok(without > 0);
    assert.ok(withLink > without * 1.4, `${withLink} vs ${without}`);
  });

  test(`${LINK.time}초가 지나면 연계가 사라진다`, () => {
    const g = duoGame();
    hold(g, { swap: 'bori' }, 1 / 60);
    idle(g, LINK.time + 0.1);
    g.save.sp = 0;
    assert.deepEqual(castCheck(g, 'b_slam'), { ok: false, reason: 'sp' });
  });
});

describe('합동 기술: 스킬을 쓰자마자 바꿔 들면', () => {
  test(`스킬을 쓰고 ${DUO.window}초 안에 바꿔 들면 두 동료가 함께 큰 기술을 쓴다`, () => {
    const g = duoGame();
    const m = freeze(placeAt(g, 'fluff', 70, 0, 1));
    m.hp = m.maxHp = 1e7;
    g.save.sp = 100;
    hold(g, { skill: 'A' }, 0.5);
    g.world.events = [];
    hold(g, { swap: 'bori' }, 1 / 60);
    const duo = g.world.events.find((e) => e.kind === 'duo');
    assert.ok(duo && duo.kind === 'duo' && duo.name.length > 0);
    assert.ok(dealt(g, m.id) > 0, '둘레의 적을 친다');
  });

  test('스킬을 쓰고 한참 뒤에 바꿔 들면 합동 기술은 없다', () => {
    const g = duoGame();
    g.save.sp = 100;
    hold(g, { skill: 'A' }, 0.5);
    idle(g, DUO.window + 0.2);
    g.world.events = [];
    hold(g, { swap: 'bori' }, 1 / 60);
    assert.ok(!g.world.events.some((e) => e.kind === 'duo'));
  });
});

describe('태엽 풀림', () => {
  test('태엽이 바닥나면 잠깐 느려지고, 다시 감으면 또 일어날 수 있다', () => {
    const g = play('toby', 'toybox');
    const walk = () => {
      const x = g.world.player.x;
      hold(g, { move: { x: 1, y: 0 } }, 0.5);
      const d = g.world.player.x - x;
      hold(g, { move: { x: -1, y: 0 } }, 0.5);
      return d;
    };
    const normal = walk();
    g.save.sp = 0.5;
    idle(g, 1 / 60);
    assert.ok(g.world.events.some((e) => e.kind === 'windEmpty'));
    const slow = walk();
    assert.ok(slow < normal * (UNWOUND.slow + 0.1), `${slow} vs ${normal}`);
    // 시간이 지나면 다시 제 속도
    idle(g, UNWOUND.time);
    g.world.events = [];
    // 다시 감고 (기준 이상) 또 바닥나면 다시 풀린다
    g.save.sp = UNWOUND.rearm + 1;
    idle(g, 1 / 60);
    g.save.sp = 0.5;
    idle(g, 1 / 60);
    assert.ok(g.world.events.some((e) => e.kind === 'windEmpty'));
  });
});
