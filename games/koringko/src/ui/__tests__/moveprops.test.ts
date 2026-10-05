import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { MOVE_KINDS, MOVE_LIVE, moveSprite } from '../art/moveProps.ts';
import { PROP_KINDS, propSprite } from '../art/houseProps.ts';
import { furnitureSprite, hasFurniture, lookOf } from '../art/house.ts';
import { lookPix } from '../render/looks.ts';
import { MOVING_KINDS } from '../../core/adv/moving.ts';
import { houseMap } from '../../core/adv/story/kit.ts';
import { CLEAR, rgb, type Pix } from '../art/paint.ts';

const kinds = Object.keys(MOVE_KINDS);
const same = (a: Pix, b: Pix) => a.w === b.w && a.h === b.h && a.px.every((v, i) => v === b.px[i]);
const lum = (c: number) => {
  const [r, g, b] = rgb(c);
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

describe('이삿날 공통 소품 목록 (REDESIGN §8)', () => {
  test('기획서의 이삿짐 소품이 모두 있다 (상자 3크기 · 열린 · 반쯤 찬 · 러그 · 비닐 소파 · 책 더미 · 뽁뽁이 · 신문지 그릇 · 테이프 조각 · 매직펜 · 액자 자국 · 끌린 자국)', () => {
    for (const k of ['cartonS', 'cartonM', 'cartonL', 'cartonOpen', 'cartonHalf', 'rolledRug', 'sofaWrap', 'bookTied', 'bubbleWrap', 'dishWrap', 'tapeBit', 'markerPen', 'frameGhost', 'dragMarks'])
      assert.ok(MOVE_KINDS[k], k);
  });

  test('바닥 잔 소품 (슬리퍼 · 동전 · 단추 · 머리끈 · 신문지 한 장) 과 괘종시계 · 떼어 낸 커튼도 있다', () => {
    for (const k of ['slipper', 'coin', 'button', 'hairBand', 'newsSheet', 'grandClock', 'curtainPile']) assert.ok(MOVE_KINDS[k], k);
  });

  test('모든 종류가 비어 있지 않은 그림을 낸다 (칠한 칸 ≥ 12, 그림 폭 ≥ 칸 폭)', () => {
    for (const k of kinds) {
      const d = MOVE_KINDS[k];
      const s = moveSprite(k, d.w, d.h, '');
      assert.ok(s, k);
      assert.ok(s.pix.count() >= 12, `${k}: ${s.pix.count()}칸`);
      assert.ok(s.pix.w >= d.w * 24, `${k} 폭 ${s.pix.w}`);
    }
  });

  test('큰 소품은 바닥 잔 소품보다 칠한 칸이 많다 (상자 대 > 상자 소 > 동전)', () => {
    const n = (k: string) => moveSprite(k, MOVE_KINDS[k].w, MOVE_KINDS[k].h, '')!.pix.count();
    assert.ok(n('cartonL') > n('cartonS'));
    assert.ok(n('cartonS') > n('coin'));
  });

  test('상자 크기 3종은 높이(앞면)가 소 < 중 < 대', () => {
    const h = (k: string) => moveSprite(k, MOVE_KINDS[k].w, MOVE_KINDS[k].h, '')!.pix.h;
    assert.ok(h('cartonS') < h('cartonM') && h('cartonM') < h('cartonL'), `${h('cartonS')} ${h('cartonM')} ${h('cartonL')}`);
  });

  test('서로 다른 종류는 서로 다른 그림, 순검정 · 순흰색은 없다', () => {
    const all = kinds.map((k) => [k, moveSprite(k, MOVE_KINDS[k].w, MOVE_KINDS[k].h, '')!.pix] as const);
    for (let i = 0; i < all.length; i++) {
      for (const c of all[i][1].px) assert.ok(c !== 0x000000 && c !== 0xffffff, `${all[i][0]} ${c.toString(16)}`);
      for (let j = i + 1; j < all.length; j++) assert.ok(!same(all[i][1], all[j][1]), `${all[i][0]} = ${all[j][0]}`);
    }
  });

  test('상자 매직 글씨: 이름을 바꾸면 그림이 바뀐다 (부엌 ≠ 깨짐주의), 모르는 글자만이면 기본 이름', () => {
    const a = moveSprite('cartonM', 1, 1, '부엌')!.pix;
    const b = moveSprite('cartonM', 1, 1, '깨짐주의')!.pix;
    assert.ok(!same(a, b));
    assert.ok(same(moveSprite('cartonM', 1, 1, 'xyz')!.pix, moveSprite('cartonM', 1, 1, '')!.pix));
  });

  test('바닥 잔 소품 · 액자 자국은 납작하다 (wall: 바닥에 구워져 인물을 가리지 않음), 상자는 서 있다', () => {
    for (const k of kinds) {
      const s = moveSprite(k, MOVE_KINDS[k].w, MOVE_KINDS[k].h, '')!;
      assert.equal(!!s.wall, MOVE_KINDS[k].flat, k);
    }
  });

  test('액자 자국은 벽지를 밝히는 네모 (lighten) 와 못 하나를 낸다', () => {
    const s = moveSprite('frameGhost', 1, 1, '')!;
    assert.ok(s.lighten && s.lighten.pix.count() >= 60, '밝힐 네모');
    const wide = moveSprite('frameGhost', 2, 1, 'wide')!;
    assert.ok(wide.lighten!.pix.count() > s.lighten!.pix.count());
  });

  test('비닐 씌운 소파는 비닐 반짝임(밝은 줄) 이 있다: 가장 밝은 칸이 소파 천보다 훨씬 밝다', () => {
    const p = moveSprite('sofaWrap', 3, 1, '')!.pix;
    const ls: number[] = [];
    for (const c of p.px) if (c !== CLEAR) ls.push(lum(c));
    ls.sort((a, b) => a - b);
    assert.ok(ls.at(-1)! - ls[Math.floor(ls.length / 2)] > 60);
  });

  test('괘종시계는 사람보다 키가 커서 윗부분(top)이 나뉘고, 추가 움직인다 (MOVE_LIVE 에 추 자리)', () => {
    const s = moveSprite('grandClock', 1, 1, '')!;
    assert.ok(s.top && (s.topSplitY ?? 0) >= 6);
    const live = MOVE_LIVE.grandClock;
    assert.ok(live?.pendulum && live.pendulum.len >= 8);
    assert.ok(live.face && live.face.r >= 3);
  });

  test('집 가구 · 기억 물건 이름으로 쓸 수 있다 (hasFurniture · furnitureSprite · lookPix · PROP_KINDS)', () => {
    for (const k of kinds) {
      assert.ok(hasFurniture(k), k);
      assert.ok(PROP_KINDS[k], `PROP_KINDS ${k}`);
      const s = furnitureSprite(k, MOVE_KINDS[k].w, MOVE_KINDS[k].h, lookOf('living'), '');
      assert.ok(s.pix.count() >= 12, k);
      assert.ok(lookPix(k, 'living'), `look ${k}`);
      assert.ok(propSprite(k, MOVE_KINDS[k].w, MOVE_KINDS[k].h, ''), `propSprite ${k}`);
    }
  });

  test('이삿짐 표시 목록(core MOVING_KINDS)의 이름은 모두 그림이 있다', () => {
    for (const k of MOVING_KINDS) assert.ok(MOVE_KINDS[k], k);
    assert.ok(MOVING_KINDS.includes('cartonM') && !MOVING_KINDS.includes('grandClock'), '괘종시계는 옛날에도 있다');
  });

  test("houseMap: 옛날(past) 에는 이삿짐 소품이 저절로 빠지고, 지금(now) 은 그대로", () => {
    const spec = {
      id: 'tst', w: 8, h: 7,
      rooms: [{ id: 'a', rect: [1, 0, 6, 6] as [number, number, number, number], look: 'living' }],
      furniture: [
        { kind: 'cartonM:부엌', x: 2, y: 4, w: 1, h: 1, solid: true },
        { kind: 'grandClock', x: 4, y: 3, w: 1, h: 1, solid: true },
        { kind: 'tapeBit', x: 5, y: 5, w: 1, h: 1 },
      ],
    };
    const now = houseMap(spec).furniture!.map((f) => f.kind);
    const past = houseMap(spec, { era: 'past' }).furniture!.map((f) => f.kind);
    assert.deepEqual(now, ['cartonM:부엌', 'grandClock', 'tapeBit']);
    assert.deepEqual(past, ['grandClock']);
    assert.notEqual(houseMap(spec).tiles[4][2], houseMap(spec, { era: 'past' }).tiles[4][2], '옛날엔 상자 자리가 막히지 않는다');
  });
});
