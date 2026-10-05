import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { PROP_KINDS, RESIDENT_KINDS, propSprite, residentSprite, type Rect } from '../art/houseProps.ts';
import { CLEAR, rgb, type Pix } from '../art/paint.ts';

/** 1장 다락방 · 9장 책상 위에 필요한 소품 (REDESIGN §7) */
const ATTIC = ['atticWall', 'beam', 'trapdoor', 'cuckoo', 'xmasbox', 'honeycandy', 'fan', 'tricycle', 'mat', 'dresserCloth', 'bookbundle', 'umbrellaStand', 'sewbox', 'mousetrap', 'paintcan', 'railing', 'cobweb', 'movingBoxes', 'chairOld'];
const DESK = ['bookspines', 'pencilCup', 'lampBase', 'notebook', 'eraser', 'eraserDust', 'ruler', 'pencil', 'paperStrips', 'starJarGiant', 'phoneGiant', 'calendarDesk', 'testPapers', 'candyTin', 'tapeCutter', 'hairTie', 'milkCarton', 'memoWall', 'deskEdge', 'numberPad'];

const sprite = (k: string, opt = '') => {
  const d = PROP_KINDS[k];
  const s = propSprite(k, d.w, d.h, opt);
  assert.ok(s, `${k} 그림 없음`);
  return s;
};
const same = (a: Pix, b: Pix) => a.w === b.w && a.h === b.h && a.px.every((v, i) => v === b.px[i]);
const lum = (c: number) => {
  const [r, g, b] = rgb(c);
  return 0.299 * r + 0.587 * g + 0.114 * b;
};
/** 면 안에 칠한 칸 밝기의 가운데 값 (글씨 · 무늬에 흔들리지 않게) */
const medianLum = (p: Pix, [x, y, w, h]: Rect) => {
  const v: number[] = [];
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
    const c = p.get(xx, yy);
    if (c !== CLEAR) v.push(lum(c));
  }
  assert.ok(v.length > 0, '면에 칠한 칸이 없다');
  v.sort((a, b) => a - b);
  return v[Math.floor(v.length / 2)];
};
const countColor = (p: Pix, pred: (r: number, g: number, b: number) => boolean, y0 = 0, y1 = p.h) => {
  let n = 0;
  for (let y = y0; y < y1; y++) for (let x = 0; x < p.w; x++) {
    const c = p.get(x, y);
    if (c !== CLEAR && pred(...rgb(c))) n++;
  }
  return n;
};
const lowestRow = (p: Pix) => {
  for (let y = p.h - 1; y >= 0; y--) for (let x = 0; x < p.w; x++) if (p.get(x, y) !== CLEAR) return y;
  return -1;
};

describe('다락방 · 책상 위 소품 그림', () => {
  test('기획서의 소품 종류가 모두 목록에 있고 눈높이가 맞다', () => {
    for (const k of ATTIC) assert.equal(PROP_KINDS[k]?.scale, 'person', k);
    for (const k of DESK) assert.equal(PROP_KINDS[k]?.scale, 'toy', k);
  });

  test('모든 종류가 비어 있지 않은 그림을 낸다 (칠한 칸 30개 이상, 그림 폭은 칸 폭 이상)', () => {
    for (const k of [...ATTIC, ...DESK]) {
      const s = sprite(k);
      assert.ok(s.pix.count() >= 30, `${k}: ${s.pix.count()}칸`);
      assert.ok(s.pix.w >= PROP_KINDS[k].w * 24, `${k} 폭 ${s.pix.w}`);
    }
  });

  test('모르는 종류는 null', () => {
    assert.equal(propSprite('spaceship', 1, 1, ''), null);
    assert.equal(propSprite('', 2, 2, ''), null);
  });

  test('서로 다른 종류는 서로 다른 그림이다', () => {
    const all = [...ATTIC, ...DESK].map((k) => [k, sprite(k).pix] as const);
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) assert.ok(!same(all[i][1], all[j][1]), `${all[i][0]} = ${all[j][0]}`);
  });

  test('순검정 · 순흰색 픽셀은 쓰지 않는다', () => {
    for (const k of [...ATTIC, ...DESK]) {
      const p = sprite(k).pix;
      for (const c of p.px) assert.ok(c !== 0x000000 && c !== 0xffffff, `${k}: ${c.toString(16)}`);
    }
    for (const k of RESIDENT_KINDS) for (const d of ['down', 'up', 'left', 'right'] as const) for (const f of [0, 1]) {
      for (const c of residentSprite(k, d, f)!.px) assert.ok(c !== 0x000000 && c !== 0xffffff, `${k} ${d} ${f}`);
    }
  });

  test('바닥에 놓인 소품은 그림 아래가 발 줄(칸 아래)에 닿는다', () => {
    const floor = ['xmasbox', 'honeycandy', 'fan', 'tricycle', 'mat', 'dresserCloth', 'bookbundle', 'umbrellaStand', 'sewbox', 'mousetrap', 'paintcan', 'movingBoxes', 'chairOld', 'pencilCup', 'lampBase', 'starJarGiant', 'milkCarton', 'candyTin', 'tapeCutter', 'eraser', 'calendarDesk'];
    for (const k of floor) {
      const s = sprite(k);
      const foot = -s.oy; // pix 안의 발 줄
      const low = lowestRow(s.pix);
      assert.ok(Math.abs(low - (foot - 1)) <= 3, `${k}: 맨 아래 ${low}, 발 줄 ${foot}`);
      assert.equal(s.ox, 0, k);
    }
  });
});

describe('3면 가구: 윗면 · 앞면 · 오른쪽 옆면 그늘', () => {
  const THREE = ['fan', 'xmasbox', 'sewbox', 'movingBoxes', 'bookbundle', 'chairOld', 'mousetrap', 'dresserCloth', 'eraser', 'tapeCutter', 'testPapers', 'numberPad'];
  for (const k of THREE) {
    test(`${k}: 앞면에 높이가 있고, 오른쪽 옆면이 앞면보다 어둡고, 윗면이 앞면보다 밝다`, () => {
      const s = sprite(k);
      assert.ok(s.faces, `${k} 면 정보 없음`);
      const { top, front, side } = s.faces!;
      assert.ok(front[3] >= 3, `${k} 앞면 높이 ${front[3]}`);
      assert.ok(side[2] >= 2 && side[2] <= 4, `${k} 옆면 폭 ${side[2]}`);
      // 옆면은 앞면의 오른쪽에 붙어 있다
      assert.equal(side[0], front[0] + front[2], `${k} 옆면 자리`);
      const lt = medianLum(s.pix, top);
      const lf = medianLum(s.pix, front);
      const ls = medianLum(s.pix, side);
      assert.ok(ls < lf, `${k} 옆면 ${ls.toFixed(0)} >= 앞면 ${lf.toFixed(0)}`);
      assert.ok(lt > lf, `${k} 윗면 ${lt.toFixed(0)} <= 앞면 ${lf.toFixed(0)}`);
    });
  }

  test('높이는 앞면 길이로 읽힌다: 큰 지우개 앞면 > 작은 지우개 앞면, 눌린 숫자 발판은 앞면이 얇다', () => {
    assert.ok(sprite('eraser', 'big').faces!.front[3] > sprite('eraser', 'small').faces!.front[3]);
    assert.ok(sprite('numberPad', '3 on').faces!.front[3] < sprite('numberPad', '3').faces!.front[3]);
  });
});

describe('키 큰 소품은 인물보다 위에 그릴 윗부분(top)을 따로 낸다', () => {
  for (const k of ['starJarGiant', 'pencilCup', 'bookspines', 'lampBase', 'milkCarton', 'dresserCloth']) {
    test(`${k}: top 은 pix 의 윗줄을 그대로 잘라 낸 것이고, 키 기준선 위에서 끝난다`, () => {
      const s = sprite(k);
      assert.ok(s.top && s.topSplitY, `${k} top 없음`);
      assert.equal(s.top!.h, s.topSplitY);
      assert.equal(s.top!.w, s.pix.w);
      assert.ok(s.top!.count() >= 20, `${k} top 이 비었다`);
      for (let y = 0; y < s.top!.h; y++) for (let x = 0; x < s.pix.w; x++) assert.equal(s.top!.get(x, y), s.pix.get(x, y));
      const limit = PROP_KINDS[k].scale === 'toy' ? 26 : 40;
      assert.equal(s.topSplitY, -s.oy - limit, `${k} 나눔 줄`);
    });
  }

  test('윗층(들보 · 거미줄)은 그림 전체가 top 이다', () => {
    for (const k of ['beam', 'cobweb']) {
      const s = sprite(k);
      assert.equal(s.top, s.pix, k);
      assert.equal(s.topSplitY, s.pix.h, k);
    }
    // 들보는 사람 머리(40px)보다 위에 떠 있다
    const b = sprite('beam');
    assert.ok(-b.oy - lowestRow(b.pix) > 40, `들보 아래 끝이 ${-b.oy - lowestRow(b.pix)}px 높이`);
  });

  test('바닥에 깔린 작은 것은 top 이 없다', () => {
    for (const k of ['honeycandy', 'notebook', 'mat', 'ruler', 'pencil', 'hairTie', 'numberPad', 'trapdoor', 'eraserDust']) assert.equal(sprite(k).top, undefined, k);
  });
});

describe('opt 변주', () => {
  test('뚜껑문: 열면 위로 세운 문만큼 키가 크고, 구멍 아래에서 노란 빛이 보인다', () => {
    const shut = sprite('trapdoor');
    const open = sprite('trapdoor', 'open');
    assert.ok(open.pix.h > shut.pix.h);
    const warm = (r: number, g: number, b: number) => r > 200 && g > 150 && b < 130;
    const holeY = open.pix.h - 24;
    assert.ok(countColor(open.pix, warm, holeY, open.pix.h) > countColor(shut.pix, warm, 0, shut.pix.h) + 20);
  });

  test('다락 뒷벽: window 면 밤하늘 창(푸른 칸)이 생긴다', () => {
    const blue = (r: number, g: number, b: number) => b > r + 30 && b > 70;
    assert.equal(countColor(sprite('atticWall').pix, blue), 0);
    assert.ok(countColor(sprite('atticWall', 'window').pix, blue) > 200);
    assert.equal(sprite('atticWall', 'window').wall, true);
  });

  test('뻐꾸기시계 bird · 이삿짐 글씨 · 책등 제목 · 숫자 발판 숫자는 그림을 바꾼다', () => {
    assert.ok(!same(sprite('cuckoo').pix, sprite('cuckoo', 'bird').pix));
    assert.ok(!same(sprite('movingBoxes').pix, sprite('movingBoxes', '책,옷').pix));
    assert.ok(!same(sprite('bookspines', '수학 4-2').pix, sprite('bookspines', '어린 왕자').pix));
    assert.ok(!same(sprite('bookspines', '0').pix, sprite('bookspines', '1').pix));
    assert.ok(!same(sprite('numberPad', '3').pix, sprite('numberPad', '7').pix));
    assert.ok(!same(sprite('lampBase').pix, sprite('lampBase', 'on').pix));
  });

  test('종이별 병 안에는 여러 색 별이 빽빽하다 (서로 다른 색 6가지 이상, 별 칸 600개 이상)', () => {
    const p = sprite('starJarGiant').pix;
    const colors = new Set<number>();
    let n = 0;
    for (const c of p.px) {
      const [r, g, b] = c === CLEAR ? [0, 0, 0] : rgb(c);
      if (c !== CLEAR && Math.max(r, g, b) - Math.min(r, g, b) > 60) {
        colors.add(c);
        n++;
      }
    }
    assert.ok(colors.size >= 6, `색 ${colors.size}`);
    assert.ok(n >= 600, `별 칸 ${n}`);
  });
});

describe('주민 그림', () => {
  const DIRS = ['down', 'up', 'left', 'right'] as const;

  test('세 주민 모두 네 방향 그림이 있고, frame 0 과 1 이 다르다 (숨쉬기 · 깜빡임)', () => {
    for (const k of RESIDENT_KINDS) for (const d of DIRS) {
      const a = residentSprite(k, d, 0);
      const b = residentSprite(k, d, 1);
      assert.ok(a && b, `${k} ${d}`);
      assert.ok(a.count() >= 60, `${k} ${d}: ${a.count()}`);
      assert.ok(!same(a, b), `${k} ${d} frame 0 = 1`);
      assert.ok(same(residentSprite(k, d, 2)!, a), `${k} frame 2 는 0 과 같다`);
    }
    assert.equal(residentSprite('robot', 'down', 0), null);
  });

  test('깡통 병정은 장난감 크기(키 24~32px)이고, 왼쪽은 오른쪽을 뒤집은 그림이다', () => {
    const p = residentSprite('tinSoldier', 'down', 0)!;
    assert.ok(p.h >= 24 && p.h <= 32, `키 ${p.h}`);
    assert.ok(same(residentSprite('tinSoldier', 'left', 0)!, residentSprite('tinSoldier', 'right', 0)!.flipped()));
  });

  test('깡통 병정: 빨간 제복 · 금빛 태엽 열쇠가 있고, 눈은 빨갛지 않은 짙은 갈색 점이다 (빨간 눈 로봇 금지)', () => {
    const red = (r: number, g: number, b: number) => r > 170 && g < 90 && b < 90;
    const gold = (r: number, g: number, b: number) => r > 200 && g > 150 && b < 110;
    for (const d of DIRS) {
      const p = residentSprite('tinSoldier', d, 0)!;
      assert.ok(countColor(p, red) >= 30, `${d} 빨간 제복`);
      assert.ok(countColor(p, gold) >= 8, `${d} 금빛 열쇠 · 장식`);
    }
    const front = residentSprite('tinSoldier', 'down', 0)!;
    // 얼굴 줄 (9~12): 빨간 칸이 없고 짙은 갈색 눈이 둘 (2칸씩)
    assert.equal(countColor(front, red, 9, 13), 0);
    const eye = (r: number, g: number, b: number) => r === 0x3a && g === 0x24 && b === 0x20;
    assert.equal(countColor(front, eye, 9, 13), 4);
    // 열쇠 날개가 몸통 밖으로 나온다 (몸통 바깥 열 x<7 또는 x>16 에 금빛)
    let outside = 0;
    for (let y = 14; y < 24; y++) for (const x of [2, 3, 4, 5, 19, 20, 21]) {
      const c = front.get(x, y);
      if (c !== CLEAR && gold(...rgb(c))) outside++;
    }
    assert.ok(outside >= 4, `열쇠 날개 ${outside}`);
  });

  test('종이띠 자매: 앞모습은 색 띠 셋에 눈이 있고, 뒷모습은 색종이 뒷면(크림)이 보인다', () => {
    const front = residentSprite('paperSisters', 'down', 0)!;
    const back = residentSprite('paperSisters', 'up', 0)!;
    const dark = (r: number, g: number, b: number) => r === 0x3a && g === 0x2a && b === 0x34;
    assert.equal(countColor(front, dark), 12); // 셋 × 두 눈 × 2칸
    assert.equal(countColor(back, dark), 0);
    const cream = (r: number, g: number, b: number) => r === 0xf2 && g === 0xea && b === 0xd8;
    assert.ok(countColor(back, cream) > countColor(front, cream) * 3);
  });
});
