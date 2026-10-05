import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { CLEAR, type Pix } from '../art/paint.ts';
import { PEOPLE, PERSON_DIRS, PERSON_FOOT_PAD, PERSON_POSES, PERSON_ANIM, PERSON_W, personBody, personH, personHand, personSprite, type PPose } from '../art/people.ts';
import { HERO_ACTS, HERO_DIRS, HERO_FOOT, HERO_H, HERO_POSES, HERO_W, heroActSprite, heroHand, heroSprite, npcSprite } from '../art/heroes.ts';

/** 칠한 칸의 위 · 아래 줄 */
function rows(p: Pix): { top: number; bottom: number } {
  let top = -1;
  let bottom = -1;
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++)
      if (p.get(x, y) !== CLEAR) {
        if (top < 0) top = y;
        bottom = y;
      }
  return { top, bottom };
}
/** 칠한 높이 (외곽선 포함) */
const tall = (p: Pix) => {
  const r = rows(p);
  return r.bottom - r.top + 1;
};
/** 가장자리(위 줄 · 왼쪽 · 오른쪽 열)에 칠한 칸이 있으면 그림이 잘린 것 */
function clipped(p: Pix): boolean {
  for (let x = 0; x < p.w; x++) if (p.get(x, 0) !== CLEAR) return true;
  for (let y = 0; y < p.h; y++) if (p.get(0, y) !== CLEAR || p.get(p.w - 1, y) !== CLEAR) return true;
  return false;
}
const HUMANS = Object.keys(PEOPLE).filter((k) => k !== 'grandoll');
const ADULTS = ['mom', 'dad', 'gpa', 'suni20', 'suni40'];
const HARU = ['haru4', 'haru5', 'haru6', 'haru7', 'haru8', 'haru9', 'haru10', 'haru11', 'haru12', 'haru13', 'haru14', 'haru15'];
const TOYS = ['toby', 'bori', 'ruru', 'nabi'] as const;
/** 뛰거나 팔을 머리 위로 드는 자세: 위에 여백을 더 둔 그림 */
const TALL_POSES = new Set(['jump', 'hop', 'stretch', 'cheer', 'surprise', 'pat', 'umbrella', 'wave']);

describe('사람 그림 틀: 투더문 크기 (32×48 · 인형은 32×40)', () => {
  test('사람은 모두 32×48 한 칸, 태엽 할머니 인형은 32×40', () => {
    for (const k of HUMANS) {
      assert.equal(personH(k), 48, k);
      for (const d of PERSON_DIRS) {
        const p = personSprite(k, d, 'idle');
        assert.equal(p.w, 32, `${k} ${d} 폭`);
        assert.equal(p.h, 48, `${k} ${d} 높이`);
      }
    }
    assert.equal(PERSON_W, 32);
    assert.equal(personH('grandoll'), 40);
    assert.equal(personSprite('grandoll', 'down', 'idle').h, 40);
  });

  test('어른은 틀을 거의 채운다 (외곽선까지 44~47줄)', () => {
    for (const k of ADULTS) {
      const t = tall(personSprite(k, 'down', 'idle'));
      assert.ok(t >= 44 && t <= 47, `${k} ${t}`);
    }
  });

  test('나이에 따라 키가 자란다: 네 살 ≈ 32, 열다섯 살 ≈ 44, 해마다 커진다', () => {
    const hs = HARU.map((k) => tall(personSprite(k, 'down', 'idle')));
    assert.ok(Math.abs(hs[0] - 32) <= 2, `네 살 ${hs[0]}`);
    assert.ok(Math.abs(hs[hs.length - 1] - 44) <= 2, `열다섯 살 ${hs[hs.length - 1]}`);
    for (let i = 1; i < hs.length; i++) assert.ok(hs[i] > hs[i - 1], `${HARU[i]} ${hs[i]} <= ${HARU[i - 1]} ${hs[i - 1]}`);
    // 같은 또래 친구도 하루와 비슷한 키
    assert.ok(Math.abs(tall(personSprite('jiwoo10', 'down', 'idle')) - hs[6]) <= 1);
    assert.ok(Math.abs(tall(personSprite('suni7', 'down', 'idle')) - hs[3]) <= 1);
  });

  test('머리가 크다 (2.5등신 안팎): 머리 높이가 키의 1/3 ~ 1/2', () => {
    for (const k of [...HARU, ...ADULTS, 'grandma']) {
      const { headD } = personBody(k);
      const r = headD / PEOPLE[k].h;
      assert.ok(r >= 0.33 && r <= 0.52, `${k} ${r.toFixed(2)}`);
    }
  });

  test('할머니 · 증조할머니는 허리가 굽어 같은 키 어른보다 머리가 낮다', () => {
    const top = (k: string) => rows(personSprite(k, 'right', 'idle')).top;
    assert.ok(top('grandma') > top('suni40'), `${top('grandma')} vs ${top('suni40')}`);
    assert.ok(top('gmom') > top('suni40'), `${top('gmom')} vs ${top('suni40')}`);
  });
});

describe('모든 자세 × 방향: 그려지고 잘리지 않는다', () => {
  test('사람: 모든 자세 · 방향 · 프레임에 칠한 칸이 있고 가장자리에 닿지 않는다', () => {
    for (const k of Object.keys(PEOPLE))
      for (const d of PERSON_DIRS)
        for (const pose of PERSON_POSES) {
          const n = PERSON_ANIM[pose]?.n ?? 1;
          for (let f = 0; f < n; f++)
            for (const carry of [false, true]) {
              const p = personSprite(k, d, pose, { frame: f, carry });
              assert.ok(p.count() > 60, `${k} ${d} ${pose}#${f} 거의 비었다`);
              assert.ok(!clipped(p), `${k} ${d} ${pose}#${f}${carry ? ' carry' : ''} 잘렸다`);
            }
        }
  });

  test('장난감: 모든 동작 · 몸짓 · 8방향이 32×40 안에 잘리지 않고 그려진다', () => {
    assert.equal(HERO_W, 32);
    assert.equal(HERO_H, 40);
    for (const h of TOYS)
      for (const d of HERO_DIRS) {
        for (const pose of HERO_POSES) {
          const p = heroSprite(h, d, pose);
          assert.equal(p.w, 32);
          assert.equal(p.h, 40);
          assert.ok(!clipped(p), `${h} ${d} ${pose} 잘렸다`);
        }
        for (const a of Object.keys(HERO_ACTS))
          for (let f = 0; f < HERO_ACTS[a].length; f++) assert.ok(!clipped(heroActSprite(h, d, a, f)!), `${h} ${d} ${a}#${f} 잘렸다`);
      }
    for (const n of ['chief', 'shop', 'forge', 'tailor', 'riftkeeper', 'mole', 'baker']) assert.ok(!clipped(npcSprite(n, 'down', 'idle')), n);
  });

  test('장난감 몸 높이는 34~36 안팎 (외곽선 포함 33~38줄): 사람보다 작지만 같은 그림 밀도', () => {
    for (const h of TOYS) {
      const t = tall(heroSprite(h, 'down', 'idle'));
      assert.ok(t >= 33 && t <= 38, `${h} ${t}`);
    }
    const doll = tall(personSprite('grandoll', 'down', 'idle'));
    assert.ok(doll >= 31 && doll <= 37, `인형 ${doll}`);
  });
});

describe('발 · 손 자리', () => {
  test('사람의 발(외곽선)은 그림 맨 아래 PERSON_FOOT_PAD 줄 위에 놓인다: 서기 · 걷기 · 몸짓 첫 프레임 모두', () => {
    for (const k of Object.keys(PEOPLE))
      for (const d of PERSON_DIRS)
        for (const pose of ['idle', 'blink', 'walk1', 'walk2', 'walk3', 'walk4', 'hold', 'wave', 'umbrella', 'read', 'nod', 'bow'] as PPose[]) {
          const p = personSprite(k, d, pose);
          assert.equal(rows(p).bottom, p.h - PERSON_FOOT_PAD, `${k} ${d} ${pose}`);
        }
  });

  test('장난감 발바닥 줄은 HERO_FOOT (모든 동작 · 8방향)', () => {
    for (const h of TOYS)
      for (const d of HERO_DIRS)
        for (const pose of HERO_POSES) assert.ok(Math.abs(rows(heroSprite(h, d, pose)).bottom - HERO_FOOT) <= 1, `${h} ${d} ${pose}`);
  });

  test('받쳐 든 손 · 숙인 손 · 안은 손 자리는 그림 안, 그 자리에 몸이 그려져 있다', () => {
    for (const k of Object.keys(PEOPLE))
      for (const d of PERSON_DIRS)
        for (const [pose, carry] of [['idle', true], ['kneel', false], ['hold', false], ['walk1', true]] as [PPose, boolean][]) {
          const h = personHand(k, d, pose, { carry });
          const p = personSprite(k, d, pose, { carry });
          assert.ok(h.x >= 0 && h.x < p.w && h.y >= 0 && h.y < p.h, `${k} ${d} ${pose} (${h.x},${h.y})`);
          // 손 자리 둘레 3칸 안에 칠한 칸이 있다 (허공에 뜨지 않는다)
          let near = 0;
          for (let y = h.y - 3; y <= h.y + 3; y++) for (let x = h.x - 3; x <= h.x + 3; x++) if (p.get(x, y) !== CLEAR) near++;
          assert.ok(near >= 8, `${k} ${d} ${pose} 손 둘레 ${near}`);
        }
  });

  test('장난감 무기 손은 32폭 그림 안', () => {
    for (const d of HERO_DIRS)
      for (const pose of HERO_POSES) {
        const h = heroHand(d, pose);
        assert.ok(h.x >= 1 && h.x <= HERO_W - 2 && h.y >= 1 && h.y <= HERO_H - 2, `${d} ${pose} (${h.x},${h.y})`);
      }
  });
});
