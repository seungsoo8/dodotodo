import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { MON_POSES, monPose, monsterSprite, type MonPose } from '../art/monsters.ts';
import { MONSTERS } from '../../core/monsters.ts';
import { CLEAR, type Pix } from '../art/paint.ts';

const REGULAR = Object.keys(MONSTERS).filter((id) => !MONSTERS[id].boss);

/** 칠한 점들의 상자 (왼 · 오른 · 위 · 아래) */
function box(p: Pix) {
  let l = p.w;
  let r = -1;
  let t = p.h;
  let b = -1;
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++)
      if (p.get(x, y) !== CLEAR) {
        l = Math.min(l, x);
        r = Math.max(r, x);
        t = Math.min(t, y);
        b = Math.max(b, y);
      }
  return { w: r - l + 1, h: b - t + 1, b, cx: (l + r) / 2 };
}
const diff = (a: Pix, b: Pix) => {
  if (a.w !== b.w || a.h !== b.h) return Infinity;
  let n = 0;
  for (let i = 0; i < a.px.length; i++) if (a.px[i] !== b.px[i]) n++;
  return n;
};
const kind = (id: string) => MONSTERS[id].ai;

describe('일반 몬스터 동작 그림', () => {
  test('모든 일반 몬스터가 동작 일곱 장을 가진다: 숨쉬기 둘 · 이동 둘 · 모으기 · 공격 · 맞기', () => {
    assert.deepEqual([...MON_POSES].sort(), ['attack', 'hurt', 'idle0', 'idle1', 'move0', 'move1', 'windup']);
    assert.ok(REGULAR.length >= 20);
    for (const id of REGULAR) for (const p of MON_POSES) assert.ok(box(monsterSprite(id, p)).w > 4, `${id} ${p}`);
  });

  test('모으기는 납작하게 웅크린다 (키가 줄고 몸이 퍼진다)', () => {
    for (const id of REGULAR) {
      const a = box(monsterSprite(id, 'idle0'));
      const w = box(monsterSprite(id, 'windup'));
      assert.ok(w.h < a.h && w.w >= a.w, `${id}: 키 ${a.h}→${w.h}, 폭 ${a.w}→${w.w}`);
    }
  });

  test('공격은 부류마다 다르게: 돌진은 앞으로 길게 · 뛰기는 위로 길게 · 할퀴기는 앞으로 덮친다', () => {
    for (const id of REGULAR) {
      const a = box(monsterSprite(id, 'idle0'));
      const k = box(monsterSprite(id, 'attack'));
      if (kind(id) === 'charger') assert.ok(k.w > a.w && k.h < a.h, `${id} 돌진 ${a.w}x${a.h}→${k.w}x${k.h}`);
      else if (kind(id) === 'hopper') assert.ok(k.h > a.h && k.w < a.w + 1, `${id} 뛰기 ${a.w}x${a.h}→${k.w}x${k.h}`);
      else if (kind(id) === 'melee') assert.ok(k.cx > a.cx + 0.9, `${id} 앞으로 덮치기 ${a.cx}→${k.cx}`);
      else assert.ok(diff(monsterSprite(id, 'attack'), monsterSprite(id, 'idle0')) > 10, `${id} 공격`);
    }
  });

  test('맞으면 찌그러지며 뒤로 밀린다 (앞을 보는 쪽이 오른쪽)', () => {
    for (const id of REGULAR) {
      const a = box(monsterSprite(id, 'idle0'));
      const h = box(monsterSprite(id, 'hurt'));
      assert.ok(h.h < a.h || h.cx < a.cx - 0.4, `${id}`);
    }
  });

  test('발은 바닥에 붙어 있다: 어떤 동작에서도 맨 아랫줄이 같은 자리 (±1)', () => {
    for (const id of REGULAR) {
      const base = box(monsterSprite(id, 'idle0')).b;
      for (const p of MON_POSES) {
        const b = box(monsterSprite(id, p)).b;
        assert.ok(Math.abs(b - base) <= 1, `${id} ${p}: ${b} vs ${base}`);
      }
    }
  });

  test('숨쉬기 · 걷기 두 장씩은 서로 다르다', () => {
    for (const id of REGULAR) {
      assert.ok(diff(monsterSprite(id, 'idle0'), monsterSprite(id, 'idle1')) > 0, `${id} 숨`);
      assert.ok(diff(monsterSprite(id, 'move0'), monsterSprite(id, 'move1')) > 0, `${id} 걸음`);
    }
  });

  test('모으기 · 공격 중엔 화난 얼굴, 맞으면 질끈 감은 눈 (눈이 있는 몬스터의 얼굴이 바뀐다)', () => {
    // 솜뭉치: 숨쉬기 그림과 같은 크기로 그린 얼굴만 비교
    const idle = monsterSprite('mushroom', 'idle0');
    const hurt = monsterSprite('mushroom', 'hurt');
    assert.ok(diff(idle, hurt) > 6);
  });
});

describe('지금 보여 줄 몬스터 동작', () => {
  const m = (state: string, ai: string, timer = 0.55) => ({ ai: { state, timer }, def: { ai } });

  test('행동 상태에 따라', () => {
    assert.equal(monPose(m('windup', 'melee'), false, 0, 9), 'windup');
    assert.equal(monPose(m('dash', 'charger'), true, 0, 9), 'attack');
    assert.equal(monPose(m('hop', 'hopper'), true, 0, 9), 'attack');
    assert.equal(monPose(m('recover', 'melee', 0.55), false, 0, 9), 'attack', '할퀸 직후에는 덮친 자세');
    assert.ok(['idle0', 'idle1'].includes(monPose(m('recover', 'melee', 0.2), false, 0, 9)), '조금 지나면 다시 숨쉬기');
    assert.ok(['move0', 'move1'].includes(monPose(m('chase', 'melee'), true, 0.3, 9)));
    assert.ok(['idle0', 'idle1'].includes(monPose(m('idle', 'melee'), false, 0.3, 9)));
  });

  test('걸으면 두 장을 번갈아, 가만히 있으면 천천히 숨쉰다', () => {
    const walk = new Set([0, 0.1, 0.2, 0.3].map((t) => monPose(m('chase', 'melee'), true, t, 9)));
    assert.equal(walk.size, 2);
    const idle = new Set([0, 0.1, 0.2, 0.3].map((t) => monPose(m('idle', 'melee'), false, t, 9)));
    assert.equal(idle.size, 1, '숨은 천천히');
  });

  test('맞은 직후에는 움찔 (돌진 · 공격 중이면 그 동작이 먼저)', () => {
    assert.equal(monPose(m('chase', 'melee'), true, 0, 0.05), 'hurt');
    assert.equal(monPose(m('dash', 'charger'), true, 0, 0.05), 'attack');
  });
});
