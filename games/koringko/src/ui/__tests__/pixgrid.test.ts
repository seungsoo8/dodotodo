import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { CLEAR, Pix, hex, rgb } from '../art/paint.ts';
import { checkGrid, gridPix, gridSize, mat, paintGrid, softOutline } from '../art/px/grid.ts';
import { HEAD_SETS, headPalette } from '../art/peopleHeads.ts';
import { PEOPLE, personSprite } from '../art/people.ts';

const lum = (c: number) => {
  const [r, g, b] = rgb(c);
  return r * 0.3 + g * 0.59 + b * 0.11;
};

describe('손찍기 격자 (px/grid.ts)', () => {
  test('gridSize: 폭 · 높이를 재고, 줄 폭이 다르면 몇 번째 줄인지 알려 준다', () => {
    assert.deepEqual(gridSize(['ab.', '...']), { w: 3, h: 2 });
    assert.throws(() => gridSize(['abc', 'ab']), /1번 줄/);
  });

  test('checkGrid: 팔레트에 없는 글자만 돌려준다 (. 공백 # 은 늘 허용)', () => {
    assert.deepEqual(checkGrid(['aZ.#', ' a q'], { a: 1 }), ['Z', 'q']);
    assert.deepEqual(checkGrid(['a.#'], { a: 1 }), []);
  });

  test('mat: 다섯 글자가 밝은 쪽부터 어두운 쪽으로, 가운데 글자가 바탕색 그대로', () => {
    const base = hex('#6ab04a');
    const m = mat('GgHhd', base);
    assert.equal(m.H, base);
    const order = ['G', 'g', 'H', 'h', 'd'].map((k) => lum(m[k]));
    for (let i = 1; i < order.length; i++) assert.ok(order[i] < order[i - 1], `${i} ${order[i]} >= ${order[i - 1]}`);
    // '.' 자리는 뺀다
    assert.deepEqual(Object.keys(mat('.x.y.', base)).sort(), ['x', 'y']);
  });

  test('paintGrid: 글자 자리에 팔레트 색, 투명 칸은 밑그림을 그대로 두고, flip 은 좌우가 뒤집힌다', () => {
    const p = new Pix(4, 1);
    p.set(1, 0, 7);
    paintGrid(p, ['a.b'], 0, 0, { a: 1, b: 2 });
    assert.deepEqual([...p.px], [1, 7, 2, CLEAR]);
    const q = paintGrid(new Pix(3, 1), ['a.b'], 0, 0, { a: 1, b: 2 }, true);
    assert.deepEqual([...q.px], [2, CLEAR, 1]);
    assert.throws(() => paintGrid(new Pix(2, 1), ['z'], 0, 0, {}), /'z'/);
  });

  test("'#' 는 이웃 색을 어둡게 한 외곽선 (검정이 아니라 그 재질 색)", () => {
    const red = hex('#e04040');
    const p = paintGrid(new Pix(2, 1), ['r#'], 0, 0, { r: red });
    const ink = p.get(1, 0);
    assert.ok(lum(ink) < lum(red) * 0.5, '어둡다');
    const [r, g, b] = rgb(ink);
    assert.ok(r > g && r > b, `붉은 기가 남는다 ${r},${g},${b}`);
  });

  test('gridPix: 여백 한 칸을 두고 둘레에 외곽선을 두른다', () => {
    const p = gridPix(['a'], { a: hex('#ffffff') });
    assert.equal(p.w, 3);
    assert.equal(p.h, 3);
    assert.equal(p.get(1, 1), hex('#ffffff'));
    for (const [x, y] of [[0, 1], [2, 1], [1, 0], [1, 2]]) assert.notEqual(p.get(x, y), CLEAR);
    assert.equal(p.get(0, 0), CLEAR, '모서리는 비워 둥글게');
  });

  test('softOutline: 투명 칸 중 그림에 닿은 칸만 칠한다', () => {
    const p = new Pix(3, 1);
    p.set(1, 0, hex('#80c0ff'));
    softOutline(p, hex('#3a2230'));
    assert.notEqual(p.get(0, 0), CLEAR);
    assert.notEqual(p.get(2, 0), CLEAR);
    assert.ok(lum(p.get(0, 0)) < lum(hex('#80c0ff')));
  });
});

describe('사람 머리 본 (peopleHeads.ts)', () => {
  const pal = headPalette(hex('#4a3226'), hex('#f6d2b4'), hex('#c8a0d8'));
  const ALL = Object.entries(HEAD_SETS).flatMap(([k, set]) => Object.entries(set).map(([d, t]) => ({ name: `${k}.${d}`, d, t })));

  test('모든 본: 줄 폭이 고르고, 팔레트에 있는 글자만 쓴다', () => {
    for (const { name, t } of ALL) {
      assert.doesNotThrow(() => gridSize(t.rows), name);
      assert.deepEqual(checkGrid(t.rows, pal), [], name);
      if (t.under) assert.deepEqual(checkGrid(t.under, pal), [], `${name} under`);
      assert.ok(t.hd <= t.rows.length, `${name} hd ${t.hd}`);
    }
  });

  test('앞 · 옆모습: 눈 · 입 자리는 살 칸 위, 눈은 앞 둘 · 옆 하나', () => {
    for (const { name, d, t } of ALL) {
      if (d === 'up') continue;
      assert.equal(t.eyes.length, d === 'down' ? 2 : 1, name);
      for (const ex of t.eyes)
        for (let y = t.ey; y < t.ey + t.eh; y++)
          for (const x of [ex, ex + 1]) assert.ok('SsL'.includes(t.rows[y][x]), `${name} 눈 (${x},${y}) '${t.rows[y][x]}'`);
      const [mx, my] = t.mouth;
      assert.ok('SsL'.includes(t.rows[my][mx]), `${name} 입 (${mx},${my})`);
      assert.ok(t.chin > my && t.chin < t.hd, `${name} 턱 ${t.chin}`);
    }
  });

  test('앞모습 두 눈 사이는 네 칸 (가까이 몰린 눈이 아니다), 얼굴 가운데 맞춤', () => {
    for (const [k, set] of Object.entries(HEAD_SETS)) {
      const [l, r] = set.down.eyes;
      assert.equal(r - (l + 2), 4, k);
      const w = set.down.rows[0].length;
      assert.equal(l + r + 2, w, `${k} 좌우 대칭`);
    }
  });

  test('목이 보인다: 턱 아래 줄에 살 칸이 있고 머리카락이 없다 (앞모습)', () => {
    for (const [k, set] of Object.entries(HEAD_SETS)) {
      const row = set.down.rows[set.down.chin + 1];
      assert.match(row, /[Ssn]/, k);
      const mid = row.slice(4, row.length - 4);
      assert.doesNotMatch(mid, /[HhdgG]/, `${k} 목 가운데`);
    }
  });
});

describe('본으로 그린 사람 (하루 10 · 15살 · 할머니 · 엄마 · 아빠)', () => {
  const V2 = Object.keys(PEOPLE).filter((k) => PEOPLE[k].tpl);
  const INK = hex('#2a1c24');
  const count = (p: Pix, c: number) => p.px.filter((v) => v === c).length;

  test('다섯 사람이 본을 쓴다', () => {
    assert.deepEqual(V2.sort(), ['dad', 'grandma', 'haru10', 'haru15', 'mom']);
  });

  test('뜬 눈: 흰 반짝이 두 눈에 하나씩, 진한 먹색 눈꺼풀(옛 그림)은 없다', () => {
    for (const k of V2) {
      const p = personSprite(k, 'down', 'idle');
      assert.equal(count(p, INK), 0, `${k} 먹색`);
      assert.ok(count(p, hex('#ffffff')) >= 2, `${k} 반짝`);
    }
  });

  test('하루는 열 살에도 노란 별 머리핀을 한다 (앞 · 옆), 뒷모습에는 없다', () => {
    const clip = PEOPLE.haru10.clip!;
    assert.ok(count(personSprite('haru10', 'down', 'idle'), clip) >= 3);
    assert.ok(count(personSprite('haru10', 'right', 'idle'), clip) >= 3);
    assert.equal(count(personSprite('haru10', 'up', 'idle'), clip), 0);
  });

  test('외곽선은 순수 검정이 아니다', () => {
    for (const k of V2) assert.equal(count(personSprite(k, 'down', 'idle'), 0x000000), 0, k);
  });

  test('본 어른은 다리가 몸통보다 길다 (늘인 아이가 아니다)', () => {
    for (const k of ['mom', 'dad']) {
      const p = personSprite(k, 'down', 'idle');
      // 허리띠 줄(갈색) 아래부터 발까지 > 목 아래부터 허리띠까지
      let belt = -1;
      for (let y = 0; y < p.h && belt < 0; y++) for (let x = 0; x < p.w; x++) if (p.get(x, y) === hex('#5a4030')) belt = y;
      let neck = -1;
      for (let y = 0; y < p.h && neck < 0; y++) if (p.get(16, y) === PEOPLE[k].top) neck = y;
      assert.ok(belt > 0 && neck > 0, `${k} ${belt} ${neck}`);
      assert.ok(p.h - 1 - belt > belt - neck, `${k} 다리 ${p.h - 1 - belt} 몸통 ${belt - neck}`);
    }
  });
});
