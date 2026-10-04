import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { beginMove } from '../ai.ts';
import { BEAR, JELLY, KING, TIN } from '../bossrules.ts';
import { hitMonster, refreshStats } from '../combat.ts';
import { FREEZE } from '../freeze.ts';
import type { Game } from '../game.ts';
import type { MapId } from '../maps.ts';
import { tileCenter, type Monster } from '../world.ts';
import { hold, idle, placeAt, play } from './helpers.ts';

/** 보스를 주인공 옆에 세운다. 주인공은 아주 튼튼하게 */
function withBoss(id: string, map: MapId, dx = 90): { g: Game; m: Monster } {
  const g = play('toby', map);
  // 아주 튼튼한 주인공 (능력치로 HP 를 올린다)
  g.save.attrs.vit = 1e6;
  refreshStats(g);
  g.save.hp = g.stats.maxHp;
  // 보스 자리에서 싸운다 (출구에서 멀리)
  const arena = g.world.map.boss!;
  g.world.player.x = tileCenter(arena.x) - dx / 2;
  g.world.player.y = tileCenter(arena.y + 3);
  const m = placeAt(g, id, dx, 0, 10);
  g.world.boss = 'spawned';
  return { g, m };
}

describe('태엽 곰 대장: 태엽이 풀리면 멈춘다', () => {
  test('기술을 쓸 때마다 태엽이 줄고, 다 풀리면 한동안 멈춘 채 피해를 두 배로 받는다', () => {
    const { g, m } = withBoss('b_bear', 'toybox');
    const b = m.boss!;
    assert.equal(b.spring, BEAR.spring);
    const uses = Math.ceil(BEAR.spring / BEAR.cost);
    for (let i = 0; i < uses; i++) {
      beginMove(g, m, 'slam');
      idle(g, 2.5);
    }
    assert.ok(b.unwound > 0, '태엽이 다 풀렸다');
    assert.ok(g.world.events.some((e) => e.kind === 'bossUnwound'));
    const x = m.x;
    const cycle = b.cycle;
    idle(g, 1);
    assert.equal(m.x, x, '풀린 동안 움직이지 않는다');
    assert.equal(b.cycle, cycle, '기술도 쓰지 않는다');
    // 피해 두 배
    const hp0 = m.hp;
    hitMonster(g, m, 1, { canCrit: false });
    const hurtUnwound = hp0 - m.hp;
    b.unwound = 0;
    const hp1 = m.hp;
    hitMonster(g, m, 1, { canCrit: false });
    const hurtNormal = hp1 - m.hp;
    assert.ok(Math.abs(hurtUnwound - hurtNormal * BEAR.taken) <= BEAR.taken, `${hurtUnwound} vs ${hurtNormal}`);
  });

  test('풀린 시간이 지나면 태엽을 다시 감고 움직인다', () => {
    const { g, m } = withBoss('b_bear', 'toybox');
    const b = m.boss!;
    b.spring = 0;
    b.unwound = 0.5;
    idle(g, 0.6);
    assert.equal(b.unwound, 0);
    assert.equal(b.spring, BEAR.spring);
    assert.ok(g.world.events.some((e) => e.kind === 'bossRewound'));
  });
});

describe('젤리 여왕: 맞을수록 쪼개지고, 조각이 돌아오면 합쳐진다', () => {
  test('체력이 20% 줄 때마다 젤리 조각이 나와 여왕에게 기어간다', () => {
    const { g, m } = withBoss('b_jelly', 'drawer', 160);
    m.hp = m.maxHp * 0.79;
    idle(g, 0.05);
    const blobs = g.world.monsters.filter((x) => x.merge === m.id);
    assert.equal(blobs.length, JELLY.blobs);
    assert.ok(g.world.events.some((e) => e.kind === 'bossSplit'));
    // 같은 구간에서는 다시 나오지 않는다
    idle(g, 0.05);
    assert.equal(g.world.monsters.filter((x) => x.merge === m.id).length, JELLY.blobs);
  });

  test('조각이 여왕에게 닿으면 여왕 체력이 차고, 조각은 보상 없이 사라진다', () => {
    const { g, m } = withBoss('b_jelly', 'drawer', 160);
    m.boss!.splits = 1;
    m.hp = m.maxHp * 0.7;
    const blob = placeAt(g, 'jellet', 160, 0, 10);
    blob.merge = m.id;
    blob.x = m.x + m.r + blob.r - 4;
    blob.y = m.y;
    const hp = m.hp;
    const kills = g.save.kills;
    idle(g, 0.1);
    assert.ok(m.hp >= hp + m.maxHp * JELLY.heal - 1, '여왕이 회복');
    assert.ok(!g.world.monsters.includes(blob));
    assert.equal(g.save.kills, kills, '쓰러뜨린 것으로 치지 않는다');
    assert.ok(g.world.events.some((e) => e.kind === 'bossMerge'));
  });

  test('조각을 먼저 쓰러뜨리면 합쳐지지 않는다', () => {
    const { g, m } = withBoss('b_jelly', 'drawer', 160);
    m.hp = m.maxHp * 0.79;
    idle(g, 0.05);
    const hp = m.hp;
    for (const x of g.world.monsters) if (x.merge === m.id) x.hp = 0;
    idle(g, 3);
    assert.ok(m.hp <= hp);
  });
});

describe('깡통 대장: 자석으로 끌어당긴다', () => {
  test('자석이 켜지면 주인공이 끌려가고, 끝에 둘레를 내려친다', () => {
    const { g, m } = withBoss('b_tin', 'desk', 150);
    m.speed = 0;
    beginMove(g, m, 'magnet');
    const d0 = Math.hypot(m.x - g.world.player.x, m.y - g.world.player.y);
    idle(g, TIN.magnetWindup + TIN.magnetTime * 0.8);
    const d1 = Math.hypot(m.x - g.world.player.x, m.y - g.world.player.y);
    assert.ok(d1 < d0 - 30, `${d0} → ${d1}`);
    idle(g, TIN.magnetTime);
    assert.ok(g.world.events.some((e) => e.kind === 'explode' && e.tag === 'slam'), '내려친다');
  });

  test('자석에 끌려도 반대로 걸으면 버틸 수 있다', () => {
    const { g, m } = withBoss('b_tin', 'desk', 150);
    m.speed = 0;
    beginMove(g, m, 'magnet');
    idle(g, TIN.magnetWindup);
    const d0 = Math.hypot(m.x - g.world.player.x, m.y - g.world.player.y);
    hold(g, { move: { x: -1, y: 0 } }, TIN.magnetTime * 0.8);
    const d1 = Math.hypot(m.x - g.world.player.x, m.y - g.world.player.y);
    assert.ok(d1 >= d0 - 10, `${d0} → ${d1}`);
  });

  test('부하로 태엽 쥐를 부른다', () => {
    const { g, m } = withBoss('b_tin', 'desk');
    beginMove(g, m, 'summon');
    idle(g, 1);
    assert.ok(g.world.monsters.some((x) => x.def.id === 'mouse'));
  });
});

describe('먼지 사도 더스티: 불 끄기와 분신', () => {
  test('불을 끄면 잠깐 더 어두워졌다가 다시 밝아진다', () => {
    const { g, m } = withBoss('b_dusty', 'underbed');
    beginMove(g, m, 'lights');
    idle(g, 1);
    assert.ok(g.world.lightsOut > 0);
    m.status.stun = 1e9; // 다른 기술은 쓰지 않게
    idle(g, 8);
    assert.equal(g.world.lightsOut, 0);
  });

  test('먼지 분신 둘이 나오고, 분신은 한 대만 맞아도 터진다', () => {
    const { g, m } = withBoss('b_dusty', 'underbed');
    beginMove(g, m, 'clones');
    idle(g, 1);
    const clones = g.world.monsters.filter((x) => x.def.id === 'dusty_clone');
    assert.equal(clones.length, 2);
    hitMonster(g, clones[0], 0.2, { canCrit: false });
    assert.ok(clones[0].hp <= 0);
  });
});

describe('먼지 왕: "얼음!" 을 외친다', () => {
  test('보스전에서도 먼지 왕이 외치면 얼음이 되고, 움직이면 크게 다친다', () => {
    const { g, m } = withBoss('b_king', 'attic');
    const max = g.stats.maxHp;
    beginMove(g, m, 'freezeCall');
    idle(g, KING.warn + 0.05);
    assert.equal(g.world.freeze.phase, 'freeze');
    const hp = g.save.hp;
    hold(g, { move: { x: 1, y: 0 } }, 0.1);
    assert.ok(hp - g.save.hp >= max * KING.hpLoss * 0.98, `${hp} → ${g.save.hp}`);
    assert.ok(KING.hpLoss > FREEZE.hpLoss, '보통 얼음보다 아프다');
  });

  test('끝까지 참으면 얼음이 풀리고 먼지 왕은 다시 싸운다', () => {
    const { g, m } = withBoss('b_king', 'attic');
    beginMove(g, m, 'freezeCall');
    idle(g, KING.warn + KING.freeze + 0.2);
    assert.equal(g.world.freeze.phase, 'none');
    assert.ok(g.world.events.some((e) => e.kind === 'freezeOk'));
  });
});
