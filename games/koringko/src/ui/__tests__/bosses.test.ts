import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { BOSS_IDS, BOSS_POSES, bossSprite, type BossPose } from '../art/bosses.ts';
import { CLEAR, type Pix } from '../art/paint.ts';
import { HERO_H } from '../art/heroes.ts';

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

describe('이야기 주민 다섯 (예전 보스): 장난감 크기 손찍기', () => {
  test('다섯 보스 모두 동작 여섯 장: 숨쉬기 둘 · 모으기 · 내리치기 · 맞기 · 고유 기술', () => {
    assert.deepEqual([...BOSS_IDS].sort(), ['b_bear', 'b_dusty', 'b_jelly', 'b_king', 'b_tin']);
    assert.deepEqual([...BOSS_POSES].sort(), ['hurt', 'idle0', 'idle1', 'special', 'strike', 'windup']);
    for (const id of BOSS_IDS) for (const p of BOSS_POSES) assert.ok(count(bossSprite(id, p, 1)) > 300, `${id} ${p}`);
  });

  test('이야기 주민 크기: 장난감(32×40) 곁에 서는 크기 — 폭 · 키 48 이하, 키 28 이상, 곰 대장은 장난감보다 크다', () => {
    for (const id of BOSS_IDS) {
      const now = bossSprite(id, 'idle0', 1);
      assert.ok(now.w <= 48 && now.h <= 48 && now.h >= 28, `${id} ${now.w}×${now.h}`);
    }
    assert.ok(bossSprite('b_bear', 'idle0', 1).h > HERO_H, '곰 대장 > 장난감 키');
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
