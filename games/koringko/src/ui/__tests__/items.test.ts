import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEM_KINDS, itemSprite } from '../art/items.ts';
import { CLEAR, hex, type Pix } from '../art/paint.ts';
import { PEOPLE, PERSON_FOOT_PAD, personBody, personHand, personSprite, type PDir } from '../art/people.ts';

/** PROPS.md 의 물건 종류 (대본 · 그림 약속) */
const PROPS = ['box', 'boxOpen', 'boxTaped', 'boxKeep', 'jar', 'jarSmall', 'letter', 'card', 'photo', 'doll', 'toby', 'bear', 'fox', 'cat', 'scarf', 'yarn', 'bowl', 'cup', 'tray', 'umbrella', 'bag', 'cake', 'pot', 'phone', 'book', 'basket', 'icecream', 'paperstar', 'tape', 'pen', 'key', 'towel', 'flowers', 'lunchbox', 'sewing'];

const same = (a: Pix, b: Pix) => a.w === b.w && a.h === b.h && a.px.every((v, i) => v === b.px[i]);
const diffN = (a: Pix, b: Pix) => {
  let n = 0;
  for (let i = 0; i < a.px.length; i++) if (a.px[i] !== b.px[i]) n++;
  return n;
};
/** 그 색이 칠해진 칸 */
const colorAt = (p: Pix, c: number) => {
  const out: [number, number][] = [];
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) if (p.get(x, y) === c) out.push([x, y]);
  return out;
};
const topRow = (p: Pix) => {
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) if (p.get(x, y) !== CLEAR) return y;
  return -1;
};

describe('옮길 수 있는 물건 그림', () => {
  test('PROPS.md 의 물건 종류는 모두 그림 목록에 있다', () => {
    for (const k of PROPS) assert.ok((ITEM_KINDS as readonly string[]).includes(k), k);
  });

  test('모든 종류가 비어 있지 않은 그림을 가진다 (칠한 칸 20개 이상, 외곽선이 둘린다)', () => {
    for (const k of PROPS) {
      const p = itemSprite(k);
      assert.ok(p.count() >= 20, `${k}: ${p.count()}`);
      // 바닥 줄에 무언가 닿는다 (놓인 자리 = 그림 아래)
      let bottom = false;
      for (let x = 0; x < p.w; x++) if (p.get(x, p.h - 1) !== CLEAR || p.get(x, p.h - 2) !== CLEAR) bottom = true;
      assert.ok(bottom, `${k} 바닥에 닿지 않는다`);
    }
  });

  test('종류끼리 그림이 모두 다르다', () => {
    const ps = PROPS.map((k) => itemSprite(k));
    for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) assert.ok(!same(ps[i], ps[j]), `${PROPS[i]} = ${PROPS[j]}`);
  });

  test('닫힌 상자와 열린 상자는 다르고, 열린 상자는 뚜껑 날개가 벌어져 더 넓고 높다', () => {
    const b = itemSprite('box');
    const o = itemSprite('boxOpen');
    assert.ok(o.w > b.w, `${o.w} <= ${b.w}`);
    assert.ok(o.h > b.h, `${o.h} <= ${b.h}`);
    // 안에 장난감 귀 (하얀 털색)가 살짝 보인다
    assert.ok(colorAt(o, hex('#f6f0f4')).length >= 4, '귀가 없다');
    assert.equal(colorAt(b, hex('#f6f0f4')).length, 0);
  });

  test('「두고 가는 짐」 · 「가져가는 짐」 상자는 쪽지 색이 다르다', () => {
    const left = itemSprite('boxTaped');
    const keep = itemSprite('boxKeep');
    assert.equal(left.w, keep.w);
    assert.ok(colorAt(left, hex('#fff4a8')).length >= 10, '노란 쪽지');
    assert.equal(colorAt(keep, hex('#fff4a8')).length, 0);
    assert.ok(colorAt(keep, hex('#bfe6ff')).length >= 10, '하늘색 쪽지');
    assert.equal(colorAt(left, hex('#bfe6ff')).length, 0);
    // 그냥 상자에는 쪽지가 없다
    assert.equal(colorAt(itemSprite('box'), hex('#fff4a8')).length, 0);
  });

  test('사람 손에 맞는 크기: 상자는 사람(키 40) 몸통 폭쯤, 작은 물건(펜 · 열쇠 · 종이별)은 상자보다 훨씬 작다', () => {
    const b = itemSprite('box');
    assert.ok(b.w >= 14 && b.w <= 24, `상자 폭 ${b.w}`);
    assert.ok(b.h >= 12 && b.h <= 20, `상자 높이 ${b.h}`);
    for (const k of ITEM_KINDS) {
      const p = itemSprite(k);
      assert.ok(p.w <= 26 && p.h <= 22, `${k} 너무 크다 ${p.w}x${p.h}`);
    }
    for (const k of ['pen', 'key', 'paperstar']) assert.ok(itemSprite(k).count() * 3 < b.count(), k);
  });

  test('모르는 종류는 작은 꾸러미 (비어 있지 않고, 어느 정해진 물건과도 다르다)', () => {
    const p = itemSprite('없는물건');
    assert.ok(p.count() >= 20);
    for (const k of PROPS) assert.ok(!same(p, itemSprite(k)), k);
    // 같은 이름은 늘 같은 그림
    assert.ok(same(itemSprite('jar'), itemSprite('jar')));
  });
});

// ───────────────────────── 사람: 들고 걷기 ─────────────────────────

const PLUSH = [hex('#f6f0f4'), hex('#4a78d8')];
const DIRS: PDir[] = ['down', 'right', 'left'];

describe('든 채로 걷는 사람', () => {
  test('hold 자세로 걸으면: 몸 위쪽(팔 · 안은 인형)은 서 있을 때와 똑같고, 다리 쪽은 다르다', () => {
    for (const kind of ['haru9', 'haru7', 'mom'])
      for (const d of DIRS) {
        const stand = personSprite(kind, d, 'hold');
        const H = stand.h;
        // 다리가 시작하는 줄 (발바닥 = H - 1 - PERSON_FOOT_PAD)
        const legTop = H - 1 - PERSON_FOOT_PAD - personBody(kind).legLen + 1;
        // 흔들림 없는 걸음 (0 · 2)
        for (const step of [0, 2] as const) {
          const walk = personSprite(kind, d, 'hold', { step });
          let upper = 0;
          for (let y = 0; y < legTop - 2; y++) for (let x = 0; x < stand.w; x++) if (stand.get(x, y) !== walk.get(x, y)) upper++;
          assert.equal(upper, 0, `${kind} ${d} step${step} 윗몸이 달라졌다`);
          let legs = 0;
          for (let y = legTop; y < H; y++) for (let x = 0; x < stand.w; x++) if (stand.get(x, y) !== walk.get(x, y)) legs++;
          assert.ok(legs >= 3, `${kind} ${d} step${step} 다리가 그대로 ${legs}`);
          // 인형 털 · 옷 색이 같은 자리에 남아 있다
          for (const c of PLUSH) {
            const a = colorAt(stand, c);
            assert.ok(a.length > 0, `${kind} ${d} 서 있는 그림에 인형이 없다`);
            for (const [x, y] of a) assert.equal(walk.get(x, y), c, `${kind} ${d} (${x},${y})`);
          }
        }
        // 들썩이는 걸음 (1 · 3): 인형도 몸과 함께 1칸 위로
        const bob = personSprite(kind, d, 'hold', { step: 1 });
        for (const [x, y] of colorAt(stand, PLUSH[1])) assert.equal(bob.get(x, y - 1), PLUSH[1], `${kind} ${d} 들썩 (${x},${y})`);
      }
  });

  test('예전처럼 걷기 그림(walk1)으로 바꾸면 인형이 사라진다 — 걸음 프레임은 자세와 따로', () => {
    const plain = personSprite('haru9', 'down', 'walk1');
    assert.equal(colorAt(plain, PLUSH[1]).length, 0);
    assert.ok(colorAt(personSprite('haru9', 'down', 'hold', { step: 0 }), PLUSH[1]).length > 0);
    // walk1 은 idle + 걸음 0 과 같은 그림
    assert.ok(same(plain, personSprite('haru9', 'down', 'idle', { step: 0 })));
  });

  test('다른 손 자세(사진 · 별 · 우산)도 걸을 때 든 것이 남는다', () => {
    const frame = hex('#8a5a3a');
    const star = hex('#ffe07a');
    const umb = hex('#e85a6a');
    for (const [pose, c] of [['holdPhoto', frame], ['holdStar', star], ['umbrella', umb]] as const) {
      const n = colorAt(personSprite('haru9', 'down', pose), c).length;
      assert.ok(n > 0, pose);
      assert.equal(colorAt(personSprite('haru9', 'down', pose, { step: 2 }), c).length, n, pose);
    }
  });
});

describe('물건을 받쳐 드는 팔 (carry)', () => {
  test('carry 그림은 빈손 그림과 다르고, 두 손이 몸 앞 가운데로 모인다', () => {
    for (const kind of ['haru9', 'grandma', 'dad']) {
      const L = PEOPLE[kind];
      const idle = personSprite(kind, 'down', 'idle');
      const carry = personSprite(kind, 'down', 'idle', { carry: true });
      assert.ok(diffN(idle, carry) >= 8, kind);
      const hand = personHand(kind, 'down', 'idle', { carry: true });
      // 손 높이: 몸통 안 (발보다 위, 머리보다 아래)
      assert.ok(hand.y > carry.h - 2 - L.h + Math.round(L.h * L.head) - 2, `${kind} 손이 너무 높다 ${hand.y}`);
      assert.ok(hand.y < carry.h - 4, `${kind} 손이 너무 낮다 ${hand.y}`);
      // 손 자리 양옆에 살색 손이 있다 (빈손일 때는 그 자리에 손이 없다)
      const skinNear = (p: Pix) => {
        let n = 0;
        for (let x = hand.x - 4; x <= hand.x + 4; x++) for (let y = hand.y - 1; y <= hand.y + 1; y++) if (p.get(x, y) === L.skin) n++;
        return n;
      };
      assert.ok(skinNear(carry) >= 2, `${kind} 손이 없다`);
      assert.ok(skinNear(carry) > skinNear(idle), `${kind}`);
    }
  });

  test('옆모습 carry: 손이 몸 앞(바라보는 쪽)으로 나온다, 왼쪽은 좌우가 뒤집힌다', () => {
    const r = personHand('haru9', 'right', 'idle', { carry: true });
    const l = personHand('haru9', 'left', 'idle', { carry: true });
    const W = personSprite('haru9', 'right', 'idle').w;
    assert.ok(r.x > W / 2 + 2, `${r.x}`);
    assert.ok(l.x < W / 2 - 2, `${l.x}`);
    assert.equal(r.y, l.y);
  });

  test('carry 로 걸어도 팔은 그대로 · 손 높이는 걸음 들썩임만큼 (1칸) 움직인다', () => {
    const a = personHand('haru9', 'down', 'idle', { carry: true, step: 0 });
    const b = personHand('haru9', 'down', 'idle', { carry: true, step: 1 });
    assert.equal(a.y - b.y, 1);
    const s0 = personSprite('haru9', 'down', 'idle', { carry: true });
    const s2 = personSprite('haru9', 'down', 'idle', { carry: true, step: 2 });
    // 다리는 다르지만 팔(손 줄)은 같다
    for (let x = 0; x < s0.w; x++) assert.equal(s0.get(x, a.y), s2.get(x, a.y), `x ${x}`);
    assert.ok(diffN(s0, s2) > 0);
  });

  test('carry 중에는 hold 인형을 따로 그리지 않는다 (손이 물건으로 차 있다)', () => {
    assert.equal(colorAt(personSprite('haru9', 'down', 'hold', { carry: true }), PLUSH[1]).length, 0);
  });
});

describe('숙여 집기 (kneel)', () => {
  test('머리가 2~4칸 더 내려가고 (서 있을 때보다), 손이 무릎 아래까지 내려간다', () => {
    for (const kind of ['haru9', 'mom']) {
      const stand = personSprite(kind, 'down', 'idle');
      const kneel = personSprite(kind, 'down', 'kneel');
      const drop = topRow(kneel) - topRow(stand);
      const { legLen } = personBody(kind);
      // 무릎 굽힘(low) + 상체 숙임
      assert.ok(drop >= Math.round(legLen * 0.5) + 2 && drop <= Math.round(legLen * 0.5) + 4, `${kind} ${drop}`);
      const hk = personHand(kind, 'down', 'kneel');
      const hs = personHand(kind, 'down', 'idle', { carry: true });
      assert.ok(hk.y >= stand.h - 2 - legLen, `${kind} 손이 무릎보다 위 ${hk.y}`);
      assert.ok(hk.y > hs.y + 4);
    }
  });

  test('옆모습 kneel: 손이 앞으로 뻗어 내려간다', () => {
    const W = personSprite('haru9', 'right', 'kneel').w;
    const h = personHand('haru9', 'right', 'kneel');
    assert.ok(h.x > W / 2 + 2);
  });
});
