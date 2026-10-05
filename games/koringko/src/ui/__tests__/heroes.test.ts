import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { dirOf, heroHand, weaponAngle, HERO_DIRS, HERO_FOOT, HERO_POSES, heroPose, heroSprite, WALK_FRAMES, type Dir, type Pose } from '../art/heroes.ts';
import { CLEAR, type Pix } from '../art/paint.ts';
import { HERO_ORDER } from '../../core/classes.ts';

const diff = (a: Pix, b: Pix) => {
  let n = 0;
  for (let i = 0; i < a.px.length; i++) if (a.px[i] !== b.px[i]) n++;
  return n;
};
/** 가장 아래 칠한 줄 (발바닥) */
const bottom = (p: Pix) => {
  for (let y = p.h - 1; y >= 0; y--) for (let x = 0; x < p.w; x++) if (p.get(x, y) !== CLEAR) return y;
  return -1;
};
/** 아래 4줄(다리)에 칠한 점들의 가로 평균 */
const legX = (p: Pix) => {
  const b = bottom(p);
  let s = 0;
  let n = 0;
  for (let y = b - 3; y <= b; y++) for (let x = 0; x < p.w; x++) if (p.get(x, y) !== CLEAR) (s += x), n++;
  return s / n;
};

describe('네 동료의 동작 그림', () => {
  test('동작마다 그림이 따로 있다: 서기 3 · 걷기 4 · 공격 3 · 맞기 1', () => {
    for (const p of ['idle', 'idle2', 'blink', 'walk1', 'walk2', 'walk3', 'walk4', 'windup', 'attack', 'follow', 'hurt'] as Pose[]) assert.ok(HERO_POSES.includes(p), p);
    assert.equal(WALK_FRAMES.length, 4);
  });

  test('모든 동료 · 방향 · 동작에서 걷기 네 장은 서로 다르다', () => {
    for (const h of HERO_ORDER)
      for (const d of HERO_DIRS) {
        const fr = WALK_FRAMES.map((f) => heroSprite(h, d, f));
        for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) assert.ok(diff(fr[i], fr[j]) > 4, `${h} ${d} walk${i + 1}=walk${j + 1}`);
      }
  });

  test('옆모습 걷기: 1번과 3번은 발이 엇갈린다 (다리가 앞뒤로 바뀐다)', () => {
    for (const h of HERO_ORDER) {
      const a = heroSprite(h, 'right', 'walk1');
      const b = heroSprite(h, 'right', 'walk3');
      const left = heroSprite(h, 'left', 'walk1');
      assert.ok(Math.abs(legX(a) - legX(b)) >= 0.4 || diff(a, b) > 20, `${h}`);
      assert.ok(diff(a, left) > 20, `${h} 왼쪽 · 오른쪽 모습이 다르다`);
    }
  });

  test('발은 땅에 붙어 있다: 어떤 동작에서도 발바닥 줄이 흔들리지 않는다 (그림이 떠 보이지 않게)', () => {
    for (const h of HERO_ORDER)
      for (const d of HERO_DIRS)
        for (const p of HERO_POSES) {
          const y = bottom(heroSprite(h, d, p));
          assert.ok(Math.abs(y - HERO_FOOT) <= 1, `${h} ${d} ${p}: 발 ${y} (기준 ${HERO_FOOT})`);
        }
  });

  test('숨쉬기는 살짝: 서기 두 장은 조금만 다르다 · 공격 세 장은 크게 다르다', () => {
    for (const h of HERO_ORDER) {
      const a = heroSprite(h, 'down', 'idle');
      const b = heroSprite(h, 'down', 'idle2');
      const n = a.px.filter((v) => v !== CLEAR).length;
      assert.ok(diff(a, b) > 0 && diff(a, b) < n * 0.5, `${h} 숨쉬기 ${diff(a, b)}/${n}`);
      const w = heroSprite(h, 'right', 'windup');
      const s = heroSprite(h, 'right', 'attack');
      assert.ok(diff(w, s) > 25, `${h} 예비 동작 → 휘두르기`);
    }
  });

  test('공격 때 몸이 기운다: 예비 동작은 뒤로, 휘두르기는 앞으로 (오른쪽을 볼 때)', () => {
    const cx = (p: Pix) => {
      let s = 0;
      let n = 0;
      for (let y = 0; y < p.h - 8; y++) for (let x = 0; x < p.w; x++) if (p.get(x, y) !== CLEAR) (s += x), n++;
      return s / n;
    };
    for (const h of HERO_ORDER) assert.ok(cx(heroSprite(h, 'right', 'attack')) > cx(heroSprite(h, 'right', 'windup')) + 0.8, h);
  });

  test('눈 깜빡임 · 맞기: 얼굴이 바뀐다', () => {
    for (const h of HERO_ORDER) {
      assert.ok(diff(heroSprite(h, 'down', 'idle'), heroSprite(h, 'down', 'blink')) >= 2, `${h} 깜빡임`);
      assert.ok(diff(heroSprite(h, 'down', 'idle'), heroSprite(h, 'down', 'hurt')) > 6, `${h} 맞기`);
    }
  });
});

describe('지금 보여 줄 동작 고르기', () => {
  const base = { state: 'idle', walkT: 0, time: 0.5, hitIn: -1, sinceSwing: 9, hurtFor: 9 };

  test('걸으면 걸음 시간에 따라 네 장을 차례로', () => {
    const seen = new Set<string>();
    for (let t = 0; t < 1; t += 0.03) seen.add(heroPose({ ...base, state: 'move', walkT: t }));
    assert.deepEqual([...seen].sort(), ['walk1', 'walk2', 'walk3', 'walk4']);
  });

  test('공격: 맞히기 전에는 예비 동작, 맞힌 직후에는 휘두르기, 그 뒤 마무리', () => {
    assert.equal(heroPose({ ...base, state: 'attack', hitIn: 0.05 }), 'windup');
    assert.equal(heroPose({ ...base, state: 'attack', hitIn: -1, sinceSwing: 0.03 }), 'attack');
    assert.equal(heroPose({ ...base, state: 'attack', hitIn: -1, sinceSwing: 0.2 }), 'follow');
  });

  test('맞은 직후에는 아파하는 얼굴 (공격 중이어도)', () => {
    assert.equal(heroPose({ ...base, hurtFor: 0.1 }), 'hurt');
    assert.equal(heroPose({ ...base, state: 'attack', hitIn: 0.1, hurtFor: 0.05 }), 'hurt');
    assert.notEqual(heroPose({ ...base, hurtFor: 0.5 }), 'hurt');
  });

  test('가만히 있으면 숨쉬고 가끔 눈을 깜빡인다', () => {
    const seen = new Set<string>();
    for (let t = 0; t < 8; t += 0.02) seen.add(heroPose({ ...base, time: t }));
    assert.deepEqual([...seen].sort(), ['blink', 'idle', 'idle2']);
    let blinks = 0;
    for (let t = 0; t < 8; t += 0.02) if (heroPose({ ...base, time: t }) === 'blink') blinks++;
    assert.ok(blinks * 0.02 < 0.6, '깜빡임은 짧게');
  });
});

describe('대각선 (8방향)', () => {
  test('바라보는 방향: 45도마다 나눈다', () => {
    const r = Math.SQRT1_2;
    const cases: [number, number, Dir][] = [
      [1, 0, 'right'], [r, r, 'downRight'], [0, 1, 'down'], [-r, r, 'downLeft'],
      [-1, 0, 'left'], [-r, -r, 'upLeft'], [0, -1, 'up'], [r, -r, 'upRight'],
      [1, 0.3, 'right'], [0.3, 1, 'down'], [1, 0.6, 'downRight'],
    ];
    for (const [x, y, d] of cases) assert.equal(dirOf({ x, y }), d, `${x},${y}`);
  });

  test('대각선 네 방향 그림이 따로 있다: 이웃한 정면 · 옆모습과 다르고, 왼쪽 · 오른쪽도 서로 다르다', () => {
    for (const d of ['downRight', 'downLeft', 'upRight', 'upLeft'] as Dir[]) assert.ok(HERO_DIRS.includes(d), d);
    for (const h of HERO_ORDER) {
      const dr = heroSprite(h, 'downRight', 'idle');
      assert.ok(diff(dr, heroSprite(h, 'down', 'idle')) > 15, `${h} ↘ ≠ ↓`);
      assert.ok(diff(dr, heroSprite(h, 'right', 'idle')) > 15, `${h} ↘ ≠ →`);
      assert.ok(diff(dr, heroSprite(h, 'downLeft', 'idle')) > 15, `${h} ↘ ≠ ↙`);
      assert.ok(diff(heroSprite(h, 'upRight', 'idle'), heroSprite(h, 'upLeft', 'idle')) > 10, `${h} ↗ ≠ ↖`);
      assert.ok(diff(heroSprite(h, 'upRight', 'idle'), heroSprite(h, 'up', 'idle')) > 10, `${h} ↗ ≠ ↑`);
    }
  });

  test('비스듬히 앞을 보면 얼굴이 그쪽으로 돌아가 있다 (눈이 몸 가운데보다 그쪽에)', () => {
    // 눈 색 점들의 가로 평균
    const eyeX = (p: Pix, eye: number) => {
      let s = 0;
      let n = 0;
      for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) if (p.get(x, y) === eye) (s += x), n++;
      return n ? s / n : NaN;
    };
    const EYE: Record<string, number> = { toby: 0x2a1e2e, bori: 0x24160e, ruru: 0x2a1a10, nabi: 0x1a1424 };
    for (const h of HERO_ORDER) {
      const front = eyeX(heroSprite(h, 'down', 'idle'), EYE[h]);
      assert.ok(eyeX(heroSprite(h, 'downRight', 'idle'), EYE[h]) > front + 0.8, `${h} ↘`);
      assert.ok(eyeX(heroSprite(h, 'downLeft', 'idle'), EYE[h]) < front - 0.8, `${h} ↙`);
      assert.ok(Number.isNaN(eyeX(heroSprite(h, 'upRight', 'idle'), EYE[h])), `${h} ↗ 뒷모습은 눈이 안 보인다`);
    }
  });
});


describe('무기는 손에 쥔다', () => {
  test('손 자리는 그림 속 팔 위 (무기 손잡이가 허공에 뜨지 않는다)', () => {
    for (const h of HERO_ORDER)
      for (const d of HERO_DIRS)
        for (const p of HERO_POSES) {
          const hand = heroHand(d, p);
          if (hand.behind) continue;
          assert.notEqual(heroSprite(h, d, p).get(Math.round(hand.x), Math.round(hand.y)), CLEAR, `${h} ${d} ${p} (${hand.x},${hand.y})`);
        }
  });

  test('손은 몸짓을 따라간다: 걸으면 팔과 함께 앞뒤로, 휘두르면 앞으로 뻗는다', () => {
    assert.notDeepEqual(heroHand('right', 'walk1'), heroHand('right', 'walk3'));
    assert.ok(heroHand('right', 'attack').x > heroHand('right', 'windup').x + 4);
    assert.ok(heroHand('left', 'attack').x < heroHand('left', 'windup').x - 4);
  });

  test('뒷모습에서는 무기가 몸 뒤에 (먼저 그린다)', () => {
    assert.equal(heroHand('up', 'idle').behind, true);
    assert.equal(heroHand('down', 'idle').behind, false);
    assert.equal(heroHand('right', 'idle').behind, false);
  });

  test('무기 각도: 평소엔 날이 위로, 예비 동작은 뒤로 젖히고, 휘두르면 바라보는 쪽으로', () => {
    for (const d of ['right', 'left', 'down', 'downRight'] as Dir[]) {
      const face = d === 'right' ? 0 : d === 'left' ? Math.PI : d === 'down' ? Math.PI / 2 : Math.PI / 4;
      const fv = { x: Math.cos(face), y: Math.sin(face) };
      const dot = (a: number) => Math.cos(a) * fv.x + Math.sin(a) * fv.y;
      assert.ok(Math.sin(weaponAngle(d, 'idle', 'sword', 0)) < -0.3, `${d} 평소 날이 위로`);
      assert.ok(dot(weaponAngle(d, 'windup', 'sword', 0)) < 0.2, `${d} 예비 동작은 뒤로`);
      assert.ok(dot(weaponAngle(d, 'attack', 'sword', 1)) > 0.6, `${d} 휘두르면 앞으로`);
      assert.ok(dot(weaponAngle(d, 'attack', 'bow', 1)) > 0.95, `${d} 활은 바라보는 쪽으로 겨눈다`);
    }
  });
});
