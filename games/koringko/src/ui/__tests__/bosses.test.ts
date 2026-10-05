import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { BOSS_IDS, BOSS_POSES, bossPose, bossSprite, type BossPose } from '../art/bosses.ts';
import { monsterFrames } from '../art/monsters.ts';
import { CLEAR, type Pix } from '../art/paint.ts';
import type { BossBrain } from '../../core/world.ts';

const diff = (a: Pix, b: Pix) => {
  if (a.w !== b.w || a.h !== b.h) return Infinity;
  let n = 0;
  for (let i = 0; i < a.px.length; i++) if (a.px[i] !== b.px[i]) n++;
  return n;
};
const count = (p: Pix) => p.px.filter((v) => v !== CLEAR).length;
const bottom = (p: Pix) => {
  for (let y = p.h - 1; y >= 0; y--) for (let x = 0; x < p.w; x++) if (p.get(x, y) !== CLEAR) return y;
  return -1;
};
const brain = (o: Partial<BossBrain>): BossBrain => ({ id: 'bear', phase: 1, move: null, step: 'idle', timer: 0, next: 1, cycle: 0, dir: { x: 0, y: 0 }, target: { x: 0, y: 0 }, count: 0, angle: 0, spring: 100, unwound: 0, splits: 0, ...o });

describe('보스 다섯의 새 그림', () => {
  test('다섯 보스 모두 동작 여섯 장: 숨쉬기 둘 · 모으기 · 내리치기 · 맞기 · 고유 기술', () => {
    assert.deepEqual([...BOSS_IDS].sort(), ['b_bear', 'b_dusty', 'b_jelly', 'b_king', 'b_tin']);
    assert.deepEqual([...BOSS_POSES].sort(), ['hurt', 'idle0', 'idle1', 'special', 'strike', 'windup']);
    for (const id of BOSS_IDS) for (const p of BOSS_POSES) assert.ok(count(bossSprite(id, p, 1)) > 300, `${id} ${p}`);
  });

  test('보스는 예전 그림보다 크다 (예전 크기: 곰 58 · 젤리 62×58 · 깡통 54×62 · 더스티 46×50 · 왕 74)', () => {
    const OLD: Record<string, [number, number]> = { b_bear: [58, 58], b_jelly: [62, 58], b_tin: [54, 62], b_dusty: [46, 50], b_king: [74, 74] };
    for (const id of BOSS_IDS) {
      const now = bossSprite(id, 'idle0', 1);
      assert.ok(now.w >= OLD[id][0] && now.h >= OLD[id][1] && now.w * now.h > OLD[id][0] * OLD[id][1], `${id} ${now.w}×${now.h}`);
    }
  });

  test('도감 · 쓰러짐 · 마을 친구도 새 그림을 쓴다', () => {
    for (const id of BOSS_IDS) {
      const [a, b] = monsterFrames(id);
      assert.deepEqual(a.px, bossSprite(id, 'idle0', 1).px, id);
      assert.deepEqual(b.px, bossSprite(id, 'idle1', 1).px, id);
    }
  });

  test('동작마다 모습이 확실히 다르고, 숨쉬기는 살짝만 다르다', () => {
    for (const id of BOSS_IDS) {
      const s = (p: BossPose) => bossSprite(id, p, 1);
      const n = count(s('idle0'));
      const breath = diff(s('idle0'), s('idle1'));
      assert.ok(breath > 0 && breath < n * 0.4, `${id} 숨쉬기 ${breath}/${n}`);
      for (const [a, b] of [['idle0', 'windup'], ['windup', 'strike'], ['idle0', 'special'], ['idle0', 'hurt']] as [BossPose, BossPose][])
        assert.ok(diff(s(a), s(b)) > n * 0.08, `${id} ${a}→${b} ${diff(s(a), s(b))}/${n}`);
    }
  });

  test('발은 바닥에 붙어 있다: 동작이 바뀌어도 맨 아랫줄이 같은 자리 (±2)', () => {
    for (const id of BOSS_IDS) {
      const base = bottom(bossSprite(id, 'idle0', 1));
      for (const p of BOSS_POSES) {
        const y = bottom(bossSprite(id, p, 1));
        assert.ok(Math.abs(y - base) <= 2, `${id} ${p}: ${y} vs ${base}`);
      }
    }
  });

  test('화가 난 2단계는 모습이 바뀐다 (찢어진 솔기 · 찌그러짐 · 빛나는 눈)', () => {
    for (const id of BOSS_IDS) assert.ok(diff(bossSprite(id, 'idle0', 1), bossSprite(id, 'idle0', 2)) > 20, id);
  });
});

describe('지금 보여 줄 보스 동작', () => {
  test('기술을 모으면 모으기, 쓰면 내리치기, 쉬면 숨쉬기', () => {
    assert.equal(bossPose(brain({ step: 'windup', move: 'slam' }), 1, 9), 'windup');
    assert.equal(bossPose(brain({ step: 'active', move: 'slam' }), 1, 9), 'strike');
    const idle = new Set([0, 0.4, 0.8, 1.2].map((t) => bossPose(brain({}), t, 9)));
    assert.deepEqual([...idle].sort(), ['idle0', 'idle1']);
  });

  test('보스마다 고유 기술: 곰 태엽 풀림 · 깡통 자석 · 더스티 불 끄기 · 먼지 왕 얼음 부르기 · 젤리 뛰어오르기', () => {
    assert.equal(bossPose(brain({ unwound: 2 }), 0, 9), 'special');
    assert.equal(bossPose(brain({ id: 'tin', move: 'magnet', step: 'active' }), 0, 9), 'special');
    assert.equal(bossPose(brain({ id: 'dusty', move: 'lights', step: 'windup' }), 0, 9), 'special');
    assert.equal(bossPose(brain({ id: 'king', move: 'freezeCall', step: 'windup' }), 0, 9), 'special');
    assert.equal(bossPose(brain({ id: 'jelly', move: 'hop', step: 'active' }), 0, 9), 'special');
    assert.equal(bossPose(brain({ id: 'tin', move: 'volley', step: 'active' }), 0, 9), 'strike');
  });

  test('맞은 직후에는 움찔 (기술을 쓰는 중에는 기술 모습이 먼저)', () => {
    assert.equal(bossPose(brain({}), 0, 0.05), 'hurt');
    assert.equal(bossPose(brain({ step: 'active', move: 'slam' }), 0, 0.05), 'strike');
    assert.equal(bossPose(brain({ unwound: 2 }), 0, 0.05), 'hurt', '태엽이 풀려 멍할 때 맞으면 움찔');
  });
});
