/**
 * 견본 2장 화면 다듬기 (1장 다락방 · 책상 장): 열린 시작 상자, 소품 상태 그림(뻐꾸기 · 스탠드),
 * keepsake look 그림, 다락 낮은 구석(X), 들보, 밀 물건(연필 · 지우개) 그림 크기, 연필 다리.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { atticRoom } from '../../core/adv/story/ch1.ts';
import { deskRoom } from '../../core/adv/story/ch5.ts';
import { house } from '../../core/adv/story/kit.ts';
import { TILE } from '../../core/maps.ts';
import type { Furniture, RoomDef } from '../../core/adv/types.ts';
import { HT, LOOKS, furnitureSprite, lookOf, thicknessTile } from '../art/house.ts';
import { PROP_KINDS, propSprite } from '../art/houseProps.ts';
import { itemSprite } from '../art/items.ts';
import { CLEAR, Pix, rgb } from '../art/paint.ts';
import { buildHousePlan, houseCells, placeFurniture, type PlanSprite } from '../render/housePlan.ts';
import { bridgeLook, lookPix, pushPix, stateGlow, stateSprite } from '../render/looks.ts';

/** 높은 층 한 단의 그림 높이 (render.ts ELEV_PX 와 같은 값) */
const ELEV_PX = 12;
/** 장난감 몸 높이 (발에서 머리까지 대략) */
const TOY_BODY = 24;

const same = (a: Pix, b: Pix) => a.w === b.w && a.h === b.h && a.px.every((v, i) => v === b.px[i]);
const opaqueIn = (s: PlanSprite, x0: number, y0: number, x1: number, y1: number) => {
  let n = 0;
  for (let y = Math.max(y0, s.y); y < Math.min(y1, s.y + s.pix.h); y++)
    for (let x = Math.max(x0, s.x); x < Math.min(x1, s.x + s.pix.w); x++) if (s.pix.get(x - s.x, y - s.y) !== CLEAR) n++;
  return n;
};
const furn = (r: RoomDef, kind: string, x?: number, y?: number): Furniture => {
  const f = (r.furniture ?? []).find((f) => f.kind.split(':')[0] === kind && (x === undefined || (f.x === x && f.y === y)));
  assert.ok(f, `${kind} 가구가 지도에 없다`);
  return f;
};

describe('1장 다락방: 시작 상자는 열린 상자 (안에 선 인물이 보인다)', () => {
  const r = atticRoom();
  const plan = buildHousePlan(r);
  const box = furn(r, 'boxes', 5, 4);
  const parts = plan.props.filter((s) => s.f === box);

  test('상자 안(높은 층)에 선 인물보다 나중에 그리는 상자 부분은 인물 몸을 가리지 않는다 (앞면은 발만)', () => {
    assert.ok(parts.length > 0, '상자 그림이 props 에 없다');
    for (let ty = box.y; ty < box.y + box.h; ty++)
      for (let tx = box.x; tx < box.x + box.w; tx++) {
        assert.equal(r.elev?.[ty]?.[tx], '1', `(${tx},${ty}) 는 상자 안 높은 층`);
        const footSort = ty * TILE + TILE / 2 + 6;
        const feet = ty * TILE + TILE / 2 + 6 - ELEV_PX;
        const body: [number, number, number, number] = [tx * TILE + 6, feet - TOY_BODY, tx * TILE + TILE - 6, feet - 6];
        for (const s of parts.filter((s) => s.foot > footSort)) assert.equal(opaqueIn(s, ...body), 0, `(${tx},${ty}) 인물 몸을 상자가 가림`);
      }
  });

  test('상자 뒷벽 · 펼친 날개는 맨 뒷줄 인물보다 먼저 그린다 (안이 비어 보이지 않게 그림은 있다)', () => {
    const backRowSort = box.y * TILE + TILE / 2 + 6;
    const behind = parts.filter((s) => s.foot < backRowSort);
    assert.ok(behind.length > 0, '인물 뒤에 그리는 상자 부분이 없다');
    assert.ok(behind.reduce((n, s) => n + s.pix.count(), 0) > 300, '상자 뒷부분 그림이 너무 작다');
  });

  test('열린 상자(open)와 닫힌 상자 그림이 다르다', () => {
    const L = lookOf('attic');
    assert.ok(!same(furnitureSprite('boxes', 3, 2, L, 'label,open').pix, furnitureSprite('boxes', 3, 2, L, 'label').pix));
  });
});

describe('소품 상태 그림 (stage.props)', () => {
  test("뻐꾸기시계: 상태 'bird' 면 bird 그림 (기본 그림과 다르다)", () => {
    const r = atticRoom();
    const f = furn(r, 'cuckoo');
    const L = lookOf('attic');
    const bird = stateSprite(f, 'bird', L).pix;
    assert.ok(!same(bird, furnitureSprite('cuckoo', f.w, f.h, L, '').pix), 'bird 상태 그림이 기본과 같다');
    // 추 · 바늘은 render 가 움직여 그리므로 상태 그림도 live (추 없는) 그림이다
    assert.ok(same(bird, propSprite('cuckoo', f.w, f.h, 'live,bird')!.pix));
    assert.ok(propSprite('cuckoo', f.w, f.h, 'bird')!.pix.count() > bird.count(), 'live 가 아니면 추가 그려진다');
  });

  test("책상 스탠드: 상태 'on' 이면 on 그림 + 노란 원뿔 빛, 꺼져 있으면 빛 없음", () => {
    const r = deskRoom();
    const f = furn(r, 'lampBase', 31, 4);
    const L = lookOf(r.look);
    assert.ok(!same(stateSprite(f, 'on', L).pix, furnitureSprite('lampBase', f.w, f.h, L, '').pix), 'on 그림이 꺼진 그림과 같다');
    const on = stateGlow(f, 'on');
    assert.equal(on.cones.length, 1, '원뿔 빛 하나');
    const c = on.cones[0];
    assert.ok(c.color[0] > 200 && c.color[1] > 170 && c.color[2] < 190, `노란 빛 ${c.color}`);
    // 원뿔이 내려앉는 곳은 받침 앞 책상 위 (화면 밖 갓에서 받침 아래까지)
    assert.ok(c.y + c.len > (f.y + f.h) * TILE, '원뿔이 받침 아래 책상까지 내려와야 한다');
    assert.ok(c.y < f.y * TILE, '원뿔 꼭짓점은 받침보다 위(갓 쪽)');
    assert.deepEqual(stateGlow(f, 'off'), { cones: [], lights: [] });
  });
});

describe('책상 장: 스탠드 받침 위(높은 층 2)에 선 장난감', () => {
  test('받침 그림 중 장난감보다 나중에 그리는 부분은 받침 위에 선 장난감 몸을 가리지 않고, 받침 윗면 · 목은 먼저 그린다', () => {
    const r = deskRoom();
    const f = furn(r, 'lampBase', 31, 4);
    const back = new Pix(r.w * TILE, r.h * TILE);
    const lay = placeFurniture([f], back, () => true, () => lookOf(r.look));
    const parts = [...lay.props, ...lay.tops, ...lay.over];
    assert.ok(parts.length >= 2, '받침 그림이 앞뒤로 나뉘지 않았다');
    for (let ty = f.y; ty < f.y + f.h; ty++)
      for (let tx = f.x; tx < f.x + f.w; tx++) {
        const elev = Number(r.elev?.[ty]?.[tx] ?? 0);
        assert.equal(elev, 2, `(${tx},${ty}) 는 받침 위`);
        const footSort = ty * TILE + TILE / 2 + 6;
        const feet = footSort - elev * ELEV_PX;
        const body: [number, number, number, number] = [tx * TILE + 6, feet - TOY_BODY, tx * TILE + TILE - 6, feet - 6];
        const later = [...lay.props.filter((s) => s.foot > footSort), ...lay.tops, ...lay.over];
        for (const s of later) assert.equal(opaqueIn(s, ...body), 0, `(${tx},${ty}) 받침 위 장난감을 가림`);
      }
    // 윗면이 받침 위 장난감 발밑에 있다 (뒷부분 그림에 칠한 칸)
    const behind = lay.props.filter((s) => s.foot < f.y * TILE + TILE / 2 + 6);
    const feetRow = f.y * TILE + TILE / 2 + 6 - 2 * ELEV_PX + 2;
    assert.ok(behind.some((s) => opaqueIn(s, (f.x + 1) * TILE, feetRow, (f.x + 2) * TILE, feetRow + 4) > 0), '받침 윗면이 발밑에 없다');
  });
});

describe('기억 물건 · 밀 물건 그림 (look)', () => {
  const rooms = [atticRoom(), deskRoom()];
  const looks = new Set<string>();
  for (const r of rooms) {
    for (const t of r.things) {
      if (t.kind === 'keepsake') {
        looks.add(t.look);
        if (t.look2) looks.add(t.look2);
      }
      if (t.kind === 'push' || (t.kind === 'windup' && t.look)) looks.add(t.look!);
    }
    for (const k of Object.values(r.keepsakes ?? {})) looks.add(k.look);
  }

  test('1장 · 책상 장의 모든 keepsake · push look 이 그림을 낸다 (빈 그림 · 꾸러미 대체 그림 아님)', () => {
    const parcel = itemSprite('parcel');
    // 막 구조: 책상의 밀 연필 · 지우개는 걷어 냈다 (그 그림은 아래 「밀 연필 · 큰 지우개」 시험이 본다)
    assert.ok(looks.size >= 12, `look ${looks.size}개`);
    for (const l of looks) {
      const p = lookPix(l, 'attic');
      assert.ok(p, `${l}: 그림 없음`);
      assert.ok(p.count() >= 20, `${l}: ${p.count()}칸`);
      assert.ok(!same(p, parcel), `${l}: 꾸러미 대체 그림`);
    }
  });

  test("엎어진 액자 'photo:down' 은 세운 액자 'photo' 와 다르다 (액자 뒷판 · 받침)", () => {
    assert.ok(!same(lookPix('photo:down')!, lookPix('photo')!));
  });

  test("뚜껑문 틈 'crack' 은 가는 노란 빛 줄이 있다", () => {
    const p = lookPix('crack')!;
    let yellow = 0;
    for (let y = 0; y < p.h; y++)
      for (let x = 0; x < p.w; x++) {
        const c = p.get(x, y);
        if (c === CLEAR) continue;
        const [R, G, B] = rgb(c);
        if (R > 220 && G > 170 && B < 150) yellow++;
      }
    assert.ok(yellow >= 8, `노란 빛 ${yellow}칸`);
    assert.ok(p.h < p.w, '가로로 긴 틈');
  });

  test("뜯어진 테이프 자락 'tape' 은 둥근 테이프 뭉치(물건 tape)와 다른 긴 자락", () => {
    const p = lookPix('tape')!;
    assert.ok(!same(p, itemSprite('tape')));
    assert.ok(p.w >= 14 || p.h >= 14, `자락 크기 ${p.w}×${p.h}`);
  });

  test('밀 연필 · 큰 지우개는 칸(24px)보다 넓은 진짜 크기 그림 (PROP_KINDS 기본 크기)', () => {
    const pencil = pushPix('pencil')!;
    assert.ok(pencil.w > TILE * 3, `연필 폭 ${pencil.w}`);
    assert.ok(same(pencil, propSprite('pencil', PROP_KINDS.pencil.w, PROP_KINDS.pencil.h, '')!.pix));
    assert.ok(pushPix('pencil:red')!.w > TILE * 3);
    assert.ok(pushPix('eraser:big')!.w > TILE, '큰 지우개');
    const small = pushPix('eraser:small')!;
    assert.ok(small.count() < pushPix('eraser:big')!.count(), '작은 지우개는 큰 지우개보다 작다');
    // 크기가 없는 물건은 그대로 1칸 그림
    assert.ok(same(pushPix('bookbundle', 'attic')!, lookPix('bookbundle', 'attic')!));
  });
});

describe('연필 다리 (bridgeLook)', () => {
  /** 틈 하나 · 연필 셋 · 연필을 받는 발판 하나 (옛 책상 장의 연필 다리 놀이) */
  const pencilRoom = (): RoomDef => ({
    ...deskRoom(),
    things: [
      { kind: 'gap', id: 'gp', at: [11, 21], tiles: [[11, 7], [12, 7]] },
      { kind: 'push', id: 'pencil1', at: [5, 11], look: 'pencil', roll: true },
      { kind: 'push', id: 'pencil2', at: [8, 14], look: 'pencil:red', roll: true },
      { kind: 'push', id: 'pencil3', at: [3, 16], look: 'pencil:green', roll: true },
      { kind: 'pad', id: 'rest', at: [10, 7], accepts: ['pencil1', 'pencil2', 'pencil3'], flag: 'gap_gp' },
    ],
  });
  test('연필을 받는 발판으로 이어진 틈은 연필 다리 (나무판 아님), 발판 위에 굴러 간 연필 색을 따른다', () => {
    const r = pencilRoom();
    assert.equal(bridgeLook(r, 'gp', () => [0, 0]), 'pencil', '어느 연필도 발판에 없으면 첫 연필');
    assert.equal(bridgeLook(r, 'gp', (id) => (id === 'pencil2' ? [10, 7] : [0, 0])), 'pencil:red');
    // 발판이 없는 틈은 다리 그림 없음 (나무판)
    assert.equal(bridgeLook(r, 'nope', () => [0, 0]), null);
  });
  test("막 구조의 책상: 틈 'g9pencil' 에는 발판이 없어 나무 자(나무판) 다리로 늘 놓여 있다", () => {
    const r = deskRoom();
    assert.ok(r.things.some((t) => t.kind === 'gap' && t.id === 'g9pencil'));
    assert.equal(bridgeLook(r, 'g9pencil', () => [0, 0]), null);
  });
});

describe('1장 다락방: 양옆 낮은 구석 (경사 천장 X)', () => {
  test('다락의 양옆 X 칸은 일반 벽 두께 그림과 다르고 (서까래 · 그늘), 다른 방의 X 는 그대로', () => {
    const r = atticRoom();
    const plan = buildHousePlan(r);
    const cells = houseCells(r);
    const L = cells[8][1].look;
    assert.equal(cells[8][1].kind, 'thick');
    const tileOf = (p: Pix, tx: number, ty: number) => {
      const out: number[] = [];
      for (let y = 0; y < HT; y++) for (let x = 0; x < HT; x++) out.push(p.get(tx * HT + x, ty * HT + y));
      return out;
    };
    const closed = { u: false, d: false, l: false, r: false, ul: false, ur: false, dl: false, dr: false };
    const plain = thicknessTile(L, 1, 8, closed);
    const left = tileOf(plan.back, 1, 8);
    assert.ok(left.some((c, i) => c !== plain.px[i]), '왼쪽 낮은 구석이 일반 X 와 같다');
    const right = tileOf(plan.back, 28, 8);
    assert.ok(right.some((c, i) => c !== thicknessTile(L, 28, 8, closed).px[i]), '오른쪽 낮은 구석이 일반 X 와 같다');
    // 색이 여럿 (널 · 서까래 · 그늘), 한 색으로 칠한 띠가 아님
    assert.ok(new Set([...tileOf(plan.back, 1, 8), ...tileOf(plan.back, 2, 9)]).size >= 8, '낮은 구석 색 가짓수');
    // 경사가 진다: 바닥과 만나는 안쪽 칸(x=2)과 바깥 칸(x=0)의 밝기가 다르다 (한 색 띠가 아님)
    const lumAvg = (tx: number) => tileOf(plan.back, tx, 8).reduce((a, c) => a + rgb(c).reduce((x, y) => x + y, 0), 0) / (HT * HT * 3);
    assert.ok(Math.abs(lumAvg(0) - lumAvg(2)) > 6, '구석 안팎 밝기가 같다');

    // 다른 방 (haru10) 의 X 는 일반 두께 그림 그대로
    const h = house('t_x', 'haru10', 10, 8, []);
    const hp = buildHousePlan(h);
    const hc = houseCells(h);
    assert.equal(hc[4][0].kind, 'thick');
    const o = { u: false, d: false, l: false, r: true, ul: false, ur: true, dl: false, dr: true };
    assert.deepEqual(tileOf(hp.back, 0, 4), [...thicknessTile(LOOKS.haru10, 0, 4, o).px]);
  });
});

describe('1장 다락방: 들보는 얇고 높이 떠 있다', () => {
  test('들보 그림 두께 14px 이하, 발 줄보다 40px 이상 위', () => {
    const r = atticRoom();
    const plan = buildHousePlan(r);
    const beams = plan.over.filter((s) => s.kind === 'beam');
    assert.equal(beams.length, 2);
    for (const b of beams) {
      let top = Infinity;
      let bottom = -1;
      // 들보 몸통 줄 (거미줄 가닥은 빼고 가운데 열로 잰다)
      const cx = Math.floor(b.pix.w / 2);
      for (let y = 0; y < b.pix.h; y++)
        if (b.pix.get(cx, y) !== CLEAR) {
          top = Math.min(top, y);
          bottom = y;
        }
      assert.ok(bottom - top + 1 <= 14, `들보 두께 ${bottom - top + 1}`);
      const f = b.f!;
      assert.ok((f.y + f.h) * TILE - (b.y + bottom) >= 40, `들보 높이 ${(f.y + f.h) * TILE - (b.y + bottom)}`);
    }
  });
});
