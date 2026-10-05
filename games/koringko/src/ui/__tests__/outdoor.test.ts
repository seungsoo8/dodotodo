import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { FLAT, HT, LOOKS, floorTile, furnitureSprite, wallTile, type HouseLook } from '../art/house.ts';
import { hex, shade, type Color } from '../art/paint.ts';
import { OUT_MEMROOMS } from '../../core/adv/story/outrooms.ts';

const colors = (px: Int32Array): Set<Color> => new Set(Array.from(px).filter((c) => c !== -1));
const share = (px: Int32Array, pred: (c: Color) => boolean): number => {
  const all = Array.from(px).filter((c) => c !== -1);
  return all.filter(pred).length / all.length;
};
const rgb = (c: Color) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];

describe('집 밖 그림: 바닥 · 가장자리 담', () => {
  test('바깥 꾸밈 여덟 가지가 정해진 바닥 · 하늘을 갖는다', () => {
    const want: Record<string, [HouseLook['floorKind'], HouseLook['sky']]> = {
      alley: ['asphalt', 'day'],
      alleyDusk: ['asphalt', 'dusk'],
      schoolRoad: ['paving', 'day'],
      playground: ['sand', 'day'],
      playgroundDusk: ['sand', 'dusk'],
      hospitalFront: ['paving', 'rain'],
      village: ['dirt', 'day'],
      villageDusk: ['dirt', 'dusk'],
    };
    for (const [id, [floor, sky]] of Object.entries(want)) {
      assert.ok(LOOKS[id], `${id} 꾸밈이 없다`);
      assert.deepEqual([LOOKS[id].floorKind, LOOKS[id].sky], [floor, sky], id);
    }
  });

  test('보도블록 바닥에는 줄눈(바탕보다 어두운 선)이 8px마다 가로로 지난다', () => {
    const L = LOOKS.schoolRoad;
    const t = floorTile(L, 3, 2);
    const row0 = Array.from({ length: HT }, (_, x) => t.get(x, 0));
    const row4 = Array.from({ length: HT }, (_, x) => t.get(x, 4));
    const lum = (c: Color) => rgb(c).reduce((a, b) => a + b, 0);
    const avg = (r: Color[]) => r.reduce((a, c) => a + lum(c), 0) / r.length;
    assert.ok(avg(row0) < avg(row4) - 40, '줄눈 줄이 블록 가운데보다 충분히 어둡지 않다');
  });

  test('아스팔트 바닥은 회색 (빨강 · 초록 · 파랑이 고르다), 모래 · 흙은 누렇다 (빨강 > 파랑)', () => {
    const grayish = (c: Color) => {
      const [r, g, b] = rgb(c);
      return Math.max(r, g, b) - Math.min(r, g, b) < 40;
    };
    assert.ok(share(floorTile(LOOKS.alley, 5, 5).px, grayish) > 0.9);
    for (const id of ['playground', 'village']) {
      const warm = (c: Color) => rgb(c)[0] > rgb(c)[2] + 30;
      assert.ok(share(floorTile(LOOKS[id], 5, 5).px, warm) > 0.8, `${id} 바닥이 누렇지 않다`);
    }
  });

  test('바깥 가장자리는 집 벽지가 아니다: 골목은 벽돌 줄눈 · 놀이터는 나무 말뚝 · 옛 마을은 돌', () => {
    const alley = wallTile(LOOKS.alley, 4, 0, true, true);
    const lum = (c: Color) => rgb(c).reduce((a, b) => a + b, 0);
    const mortar = share(alley.px, (c) => lum(c) > lum(shade(LOOKS.alley.wall, 0.2)) && c !== LOOKS.alley.base && lum(c) < lum(shade(LOOKS.alley.wall, 0.45)));
    assert.ok(mortar > 0.1, `벽돌 줄눈(벽돌보다 밝은 선)이 ${mortar}`);
    assert.ok(colors(alley.px).has(LOOKS.alley.base), '담 위 갓돌이 없다');
    const park = wallTile(LOOKS.playground, 4, 0, true, true);
    assert.ok(colors(park.px).has(LOOKS.playground.accent), '나무 울타리 색이 없다');
    const village = wallTile(LOOKS.village, 4, 0, true, true);
    assert.ok(colors(village.px).size > 8, '돌담이 한두 색 덩어리다');
    // 집 안 벽지처럼 한 색으로 칠해져 있지 않다
    for (const t of [alley, park, village]) assert.ok(share(t.px, (c) => c === LOOKS.haru10.wall) === 0);
  });
});

describe('집 밖 그림: 가구', () => {
  const L = LOOKS.alley;
  const fallback = furnitureSprite('__없는것__', 2, 1, L);
  const KINDS: [string, number, number][] = [
    ['pole', 1, 1], ['gate', 3, 2], ['shop', 7, 3], ['crosswalk', 4, 2], ['lamp', 1, 1], ['tree', 1, 1], ['bench', 2, 1], ['slide', 3, 2],
    ['swingset', 4, 1], ['seesaw', 3, 1], ['sandbox', 5, 3], ['jungle', 3, 2], ['bldg', 10, 3], ['busstop', 2, 1], ['well', 2, 1],
    ['thatch', 9, 3], ['stonewall', 10, 1], ['signpost', 1, 1], ['cart', 2, 1], ['nwall', 5, 2], ['road', 20, 2], ['ruts', 20, 2], ['crocks', 2, 1],
  ];

  test('바깥 가구마다 제 그림이 있다 (모르는 가구의 갈색 상자가 아니다)', () => {
    const plain = colors(fallback.pix.px);
    for (const [k, w, h] of KINDS) {
      const s = furnitureSprite(k, w, h, L);
      const own = [...colors(s.pix.px)].filter((c) => !plain.has(c));
      assert.ok(own.length > 3, `${k}: 제 그림이 아니다`);
    }
  });

  test('전봇대 · 가로수는 사람 키(2칸)보다 크고, 벤치는 사람보다 낮다', () => {
    const tall = (k: string) => furnitureSprite(k, 1, 1, L).pix.h;
    assert.ok(tall('pole') >= HT * 3.5, `전봇대 ${tall('pole')}px`);
    assert.ok(tall('tree') >= HT * 3.5, `가로수 ${tall('tree')}px`);
    assert.ok(furnitureSprite('bench', 2, 1, L).pix.h < HT * 2);
  });

  test('바닥에 깔리는 것(횡단보도 · 찻길 · 모래밭 테두리 · 바큇자국)은 인물 밑에 그린다', () => {
    for (const k of ['crosswalk', 'road', 'sandbox', 'ruts']) assert.ok(FLAT.has(k), k);
    for (const k of ['pole', 'tree', 'slide', 'well']) assert.ok(!FLAT.has(k), k);
  });

  test('파란 대문은 :open 이면 그림이 바뀌고 (열린 틈), 닫힌 문은 파랑이 더 많다', () => {
    const blue = (c: Color) => c === hex('#3a78c8');
    const closed = furnitureSprite('gate', 3, 2, L);
    const open = furnitureSprite('gate', 3, 2, L, 'open');
    assert.ok(share(closed.pix.px, blue) > share(open.pix.px, blue) + 0.05);
  });

  test('감나무엔 주황 감이 달리고, 은행나무는 노랗다', () => {
    const orange = (c: Color) => c === hex('#f07a28');
    assert.ok(share(furnitureSprite('tree', 1, 1, LOOKS.village, 'persimmon').pix.px, orange) > 0);
    assert.equal(share(furnitureSprite('tree', 1, 1, LOOKS.village).pix.px, orange), 0);
    const yellow = (c: Color) => {
      const [r, g, b] = rgb(c);
      return r > 180 && g > 140 && b < 120;
    };
    assert.ok(share(furnitureSprite('tree', 1, 1, LOOKS.schoolRoad, 'ginkgo').pix.px, yellow) > 0.2);
    assert.ok(share(furnitureSprite('tree', 1, 1, LOOKS.schoolRoad).pix.px, yellow) < 0.02, '보통 가로수는 초록');
  });

  test('bldg 꾸밈: 병원엔 빨간 십자, 학교엔 없다', () => {
    const red = (c: Color) => c === hex('#e03a3a');
    assert.ok(share(furnitureSprite('bldg', 10, 3, LOOKS.hospitalFront, 'hospital').pix.px, red) > 0);
    assert.equal(share(furnitureSprite('bldg', 8, 3, LOOKS.schoolRoad, 'school').pix.px, red), 0);
  });

  test('가로등은 낮엔 꺼져 있고 해 질 녘엔 켜진다', () => {
    const lit = (c: Color) => c === hex('#ffdc8a');
    assert.equal(share(furnitureSprite('lamp', 1, 1, LOOKS.alley).pix.px, lit), 0);
    assert.ok(share(furnitureSprite('lamp', 1, 1, LOOKS.alleyDusk).pix.px, lit) > 0);
  });
});

describe('집 밖 기억 방', () => {
  const OUT = new Set(['asphalt', 'paving', 'sand', 'dirt']);

  test('여덟 방 모두 사람 크기 22×12, 위 한 줄만 담, 바깥 바닥', () => {
    const ids = ['m_out_alley', 'm_out_alley_d', 'm_out_school', 'm_out_park', 'm_out_park_d', 'm_out_hosp', 'm_out_village', 'm_out_village_d'];
    assert.deepEqual(Object.keys(OUT_MEMROOMS).sort(), [...ids].sort());
    for (const id of ids) {
      const r = OUT_MEMROOMS[id]();
      assert.equal(r.id, id);
      assert.equal(r.scale, 'human');
      assert.deepEqual([r.w, r.h], [22, 12], id);
      assert.ok(OUT.has(LOOKS[r.look ?? '']?.floorKind ?? ''), `${id}: 바깥 바닥이 아니다`);
      assert.equal(r.tiles[0], 'W'.repeat(22), `${id}: 맨 윗줄은 담`);
      assert.notEqual(r.tiles[1][1], 'W', `${id}: 둘째 줄은 이미 바깥 (담은 한 줄)`);
    }
  });

  test('낮 · 해 질 녘 같은 장소는 가구 자리가 같고 꾸밈만 다르다', () => {
    for (const [a, b] of [['m_out_alley', 'm_out_alley_d'], ['m_out_park', 'm_out_park_d'], ['m_out_village', 'm_out_village_d']]) {
      const ra = OUT_MEMROOMS[a]();
      const rb = OUT_MEMROOMS[b]();
      assert.deepEqual(ra.furniture, rb.furniture, `${a} / ${b}`);
      assert.deepEqual(ra.tiles, rb.tiles);
      assert.notEqual(ra.look, rb.look);
      assert.equal(LOOKS[rb.look ?? ''].sky, 'dusk');
    }
  });

  test('걸을 곳이 넉넉하다: 시작 칸에서 이어진 빈 칸이 안쪽의 70% 이상', () => {
    for (const [id, make] of Object.entries(OUT_MEMROOMS)) {
      const r = make();
      const free = (x: number, y: number) => r.tiles[y]?.[x] !== undefined && r.tiles[y][x] !== 'W' && r.tiles[y][x] !== 'H';
      assert.ok(free(r.start.x, r.start.y), `${id}: 시작 칸이 막혀 있다`);
      const seen = new Set([`${r.start.x},${r.start.y}`]);
      const q = [[r.start.x, r.start.y]];
      while (q.length) {
        const [x, y] = q.pop()!;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const k = `${x + dx},${y + dy}`;
          if (!seen.has(k) && free(x + dx, y + dy)) {
            seen.add(k);
            q.push([x + dx, y + dy]);
          }
        }
      }
      const inner = (r.w - 2) * (r.h - 2);
      assert.ok(seen.size / inner >= 0.7, `${id}: 이어진 빈 칸 ${seen.size}/${inner}`);
    }
  });
});
