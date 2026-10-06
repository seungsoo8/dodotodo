/**
 * 베란다 · 소파 밑 · 비 오는 마당 · 골목 끝 놀이터 지도와 주민 그림.
 * 막을 처음부터 끝까지 풀어 보는 시험은 acts.test.ts (모든 막) · acts_c.test.ts · acts_d.test.ts 에 있다.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { isMemory } from '../adv.ts';
import { ROOMS } from '../story/index.ts';
import { isSolidChar } from '../../maps.ts';
import type { RoomDef } from '../types.ts';
import { lookPix } from '../../../ui/render/looks.ts';
import { residentSprite } from '../../../ui/art/houseProps.ts';
import { RESIDENTS_D } from '../../../ui/art/props_d.ts';

/** 장 방의 공통 모양: 기억은 모두 그림이 있는 물건 (목표 줄은 story.test 의 막 규칙이 본다) */
function commonShape(room: string, looks: Record<string, string>): RoomDef {
  const r = ROOMS[room]();
  const mems = r.things.filter(isMemory);
  assert.ok(mems.every((m) => m.kind === 'keepsake'), '공중 구슬 없이 모두 물건');
  assert.deepEqual(Object.fromEntries(mems.map((m) => [m.id, m.kind === 'keepsake' ? m.look : ''])), looks);
  for (const m of mems) {
    if (m.kind !== 'keepsake') continue;
    const p = lookPix(m.look, r.look);
    assert.ok(p && p.count() >= 20, `${m.id}: 「${m.look}」 그림`);
    assert.ok(!isSolidChar(r.tiles[m.at[1]][m.at[0]]), `${m.id} (${m.at}) 은 걸을 수 있는 칸`);
  }
  return r;
}

// ───────────────────────── 13장 베란다 ─────────────────────────

describe('베란다 (7막)', () => {
  const room = 'balcony';

  test('거실 끝과 베란다를 미닫이 문턱으로 이은 사람 크기 지도: 바깥 창 · 세탁기 · 빨래 건조대 · 하루 꽃, 윗층 빨래 · 앞 가림막', () => {
    const r = commonShape(room, { mVa: 'nameStick', mVb: 'feather', mVc: 'flowers', mVd: 'foxBag', mVe: 'towel', mVf: 'photo', mVg: 'trowel' });
    assert.equal(r.scale, 'human');
    assert.equal(r.toys, true);
    assert.deepEqual(r.looks?.map((l) => l.look), ['living', 'balcony']);
    assert.equal(r.tiles[8][7], 'D');
    assert.equal(r.tiles[9][7], 'D');
    const kinds = new Set((r.furniture ?? []).map((f) => f.kind.split(':')[0]));
    for (const k of ['balconyWin', 'washer', 'dryingRack', 'haruFlower', 'pots', 'faucet', 'grandClock', 'frameGhost', 'cartonL']) assert.ok(kinds.has(k), k);
    assert.ok((r.furniture ?? []).some((f) => f.over), '윗층 (빨래)');
    assert.ok((r.furniture ?? []).some((f) => f.fg), '앞쪽 가림막');
    assert.equal(r.winds, undefined, '막 구조: 밀어내는 바람은 없다 (소리 · 빨래 그림만)');
    assert.ok(r.things.some((t) => t.kind === 'npc' && t.actor === 'clothespins'), '빨래집게 자매');
  });

});

// ───────────────────────── 14장 소파 밑 ─────────────────────────

describe('소파 밑 (7막)', () => {
  const room = 'sofa';

  test('장난감 눈높이 근접 지도: 걸레받이 · 소파 다리 넷 · 성냥갑 · 리모컨 · 동전 탑 · 술 장식 가림막 · 천장 윗층, 주민 백원 할배', () => {
    const r = commonShape(room, { mRa: 'capsule', mRb: 'furTuft', mRc: 'scratcherTip', mRd: 'threadRed', mRe: 'penCap', mRf: 'coinGiant:100' });
    assert.equal(r.scale, 'toy');
    assert.ok(r.w >= 36 && r.h >= 18, `${r.w}×${r.h}`);
    const furn = r.furniture ?? [];
    assert.equal(furn.filter((f) => f.kind === 'sofaLeg').length, 4);
    const kinds = new Set(furn.map((f) => f.kind.split(':')[0]));
    for (const k of ['skirtBoard', 'matchbox', 'remoteGiant', 'coinGiant', 'crumbHill', 'dustBunny', 'sock', 'toothpicks', 'bottleCap', 'fringe', 'sofaBottom', 'spring']) assert.ok(kinds.has(k), k);
    assert.ok(furn.some((f) => f.over) && furn.some((f) => f.fg));
    assert.equal(r.low, undefined, '막 구조: 보리를 막는 낮은 천장은 없다');
    assert.ok(r.things.some((t) => t.kind === 'npc' && t.actor === 'coinElder'));
  });

});

// ───────────────────────── 15장 비 오는 마당 ─────────────────────────

describe('비 오는 마당 (8막)', () => {
  const room = 'yard';

  test('집 뒷벽 · 처마(윗층) · 툇마루(높이 1, 댓돌) · 장독대 · 빨랫줄 · 꽃밭 · 돌담 · 큰 덤불 · 대문, 비가 내리는 바깥', () => {
    const r = commonShape(room, { m8a: 'raincoatButton', m8b: 'cotton', m8c: 'umbrella', m8d: 'clothespin', m8e: 'cushion', m8f: 'looseStone', m8g: 'flashlight' });
    assert.equal(r.scale, 'human');
    assert.equal(r.toys, true);
    assert.equal(r.weather, 'rain');
    assert.equal(r.elev?.[4][8], '1', '툇마루는 높이 1');
    assert.equal(r.tiles[5][8], 'S', '툇마루 앞면');
    const kinds = new Set((r.furniture ?? []).map((f) => f.kind.split(':')[0]));
    for (const k of ['facade', 'eaves', 'crocks', 'clothesline', 'flowers', 'stonewall', 'bush', 'gate', 'tub', 'daetdol', 'swing']) assert.ok(kinds.has(k), k);
    assert.ok(r.looks?.some((l) => l.look === 'gmNight'), '툇마루는 나무 마루');
  });

});

// ───────────────────────── 16장 골목 끝 놀이터 ─────────────────────────

describe('골목 끝 놀이터 (8막)', () => {
  const room = 'outside';

  test('골목(아스팔트)과 놀이터(모래)를 울타리 틈으로 이은 바깥 지도: 대문 · 구멍가게 · 가로등 셋 · 주차된 차(밑) · 도랑 · 그네, 골목 주인 얼룩이', () => {
    const r = commonShape(room, { mOUa: 'palmPrint', mOUb: 'footSticker', mOUc: 'icecream', mOUd: 'bench', mOUe: 'scarf', mOUf: 'sticks2' });
    assert.equal(r.toys, true);
    assert.deepEqual(r.looks?.map((l) => l.look), ['alley', 'playground']);
    const furn = r.furniture ?? [];
    assert.equal(furn.filter((f) => f.kind === 'lamp').length, 3, '가로등 셋');
    assert.ok(furn.some((f) => f.kind === 'car' && f.under), '차 밑에 숨는다');
    for (const k of ['gate', 'shop', 'pole', 'ditch', 'milkCrate', 'swingset', 'slide', 'sandbox', 'jungle', 'bench', 'wires']) assert.ok(furn.some((f) => f.kind.split(':')[0] === k), k);
    assert.ok(r.tiles.some((row) => row.includes('U')), '차 밑 칸');
    // 8막: 순찰 숨바꼭질은 걷어 내고, 얼룩이는 말을 걸면 담판 (담판 뒤엔 평상 위에서 잔다). 지켜보는 이는 없다
    assert.equal(r.things.filter((t) => t.kind === 'watcher').length, 0);
    const cat = r.things.find((t) => t.id === 'cat');
    assert.ok(cat && cat.kind === 'npc' && cat.actor === 'alleyCat' && cat.unless === 'cat_deal');
    const nap = r.things.find((t) => t.id === 'cat_nap');
    assert.ok(nap && nap.kind === 'npc' && nap.when === 'cat_deal' && nap.pose === 'sleep');
    assert.ok(r.lantern && r.lantern.zones?.length && r.lantern.drain === 0, '어둠은 남되 등불은 줄지 않는다');
  });

});

describe('갈래 D 주민 그림', () => {
  test('빨래집게 자매 · 백원 할배 · 개굴 형 · 얼룩이: 네 방향 · 두 박자 모두 그려지고, 왼쪽은 오른쪽을 뒤집은 것', () => {
    for (const k of RESIDENTS_D)
      for (const d of ['down', 'up', 'left', 'right'] as const)
        for (const f of [0, 1]) {
          const p = residentSprite(k, d, f);
          assert.ok(p && p.count() >= 60, `${k} ${d} ${f}`);
        }
    for (const k of RESIDENTS_D) {
      const l = residentSprite(k, 'left', 0)!;
      const r = residentSprite(k, 'right', 0)!.flipped();
      assert.ok(l.w === r.w && l.px.every((v, i) => v === r.px[i]), k);
    }
    // 얼룩이는 장난감(토비)보다 크다 (진짜 고양이)
    assert.ok(residentSprite('alleyCat', 'down', 0)!.h > residentSprite('frogBro', 'down', 0)!.h);
  });
});
