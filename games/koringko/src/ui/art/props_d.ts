/**
 * 갈래 D 소품 · 주민 그림: 13장 베란다 · 14장 소파 밑(근접) · 15장 비 오는 마당 · 16장 골목 끝 놀이터.
 * 약속은 houseProps.ts 와 같다: 칸 자리의 발 (x*24, (y+h)*24) 에서 그림 왼쪽 위까지 (ox, oy).
 * 3면 규칙(윗면 밝게 · 앞면 중간 · 오른쪽 옆면 어둡게), 바닥 데칼은 wall: true (바닥에 구움), 윗층은 top = pix 전체.
 * 사람 크기(person): 사람 48px · 장난감 36px 기준 실제 크기. 장난감 크기(toy): 소파 밑을 장난감 눈높이로 본 거대한 물건.
 * 순검정 · 순흰색은 쓰지 않는다.
 */
import { Pix, hex, shade } from './paint.ts';
import type { PropSprite } from './houseProps.ts';
import { PERSON_SPRITE_H, TOY_SPRITE_H } from './sizes.ts';
import { textH, textWidth } from './glyphs.ts';
import { blank, draw, flipG, hs, nine, onto, put, swap, tile, vs } from './px/chapkit.ts';
import { box } from './px/chapbox.ts';
import type { Grid, Palette } from './px/grid.ts';
import * as X from './px/chapD.ts';

const HT = 24;

/** 종류 · 기본 칸 크기 · 눈높이 */
export const PROPS_D: Record<string, { w: number; h: number; scale: 'person' | 'toy' }> = {
  // 13장 베란다
  balconyWin: { w: 4, h: 3, scale: 'person' },
  washer: { w: 2, h: 1, scale: 'person' },
  pegTub: { w: 1, h: 1, scale: 'person' },
  faucet: { w: 1, h: 1, scale: 'person' },
  dustpan: { w: 1, h: 1, scale: 'person' },
  gloves: { w: 1, h: 1, scale: 'person' },
  laundry: { w: 3, h: 1, scale: 'person' },
  dryingRack: { w: 4, h: 1, scale: 'person' },
  haruFlower: { w: 1, h: 1, scale: 'person' },
  chairFold: { w: 1, h: 1, scale: 'person' },
  nameStick: { w: 1, h: 1, scale: 'person' },
  feather: { w: 1, h: 1, scale: 'person' },
  foxBag: { w: 1, h: 1, scale: 'person' },
  trowel: { w: 1, h: 1, scale: 'person' },
  watercan: { w: 1, h: 1, scale: 'person' },
  // 15장 마당
  eaves: { w: 6, h: 1, scale: 'person' },
  downspout: { w: 1, h: 2, scale: 'person' },
  boots: { w: 1, h: 1, scale: 'person' },
  daetdol: { w: 1, h: 1, scale: 'person' },
  tub: { w: 1, h: 1, scale: 'person' },
  clothesline: { w: 6, h: 1, scale: 'person' },
  snail: { w: 1, h: 1, scale: 'person' },
  raincoatButton: { w: 1, h: 1, scale: 'person' },
  cotton: { w: 1, h: 1, scale: 'person' },
  clothespin: { w: 1, h: 1, scale: 'person' },
  looseStone: { w: 1, h: 1, scale: 'person' },
  flashlight: { w: 1, h: 1, scale: 'person' },
  brick: { w: 1, h: 1, scale: 'person' },
  shrub: { w: 3, h: 2, scale: 'person' },
  // 16장 골목 · 놀이터
  car: { w: 4, h: 2, scale: 'person' },
  milkCrate: { w: 1, h: 1, scale: 'person' },
  catBowl: { w: 1, h: 1, scale: 'person' },
  vinylBag: { w: 1, h: 1, scale: 'person' },
  flyer: { w: 1, h: 1, scale: 'person' },
  ditch: { w: 1, h: 1, scale: 'person' },
  wires: { w: 10, h: 1, scale: 'person' },
  sandCastle: { w: 1, h: 1, scale: 'person' },
  palmPrint: { w: 1, h: 1, scale: 'person' },
  footSticker: { w: 1, h: 1, scale: 'person' },
  sticks2: { w: 1, h: 1, scale: 'person' },
  // 14장 소파 밑 (장난감 눈높이)
  skirtBoard: { w: 8, h: 3, scale: 'toy' },
  sofaLeg: { w: 2, h: 2, scale: 'toy' },
  sofaBottom: { w: 10, h: 1, scale: 'toy' },
  spring: { w: 1, h: 1, scale: 'toy' },
  fringe: { w: 8, h: 1, scale: 'toy' },
  matchbox: { w: 2, h: 2, scale: 'toy' },
  crumbHill: { w: 2, h: 2, scale: 'toy' },
  remoteGiant: { w: 4, h: 2, scale: 'toy' },
  dustBunny: { w: 2, h: 1, scale: 'toy' },
  buttonGiant: { w: 1, h: 1, scale: 'toy' },
  candyWrap: { w: 1, h: 1, scale: 'toy' },
  furTuft: { w: 1, h: 1, scale: 'toy' },
  coinGiant: { w: 1, h: 1, scale: 'toy' },
  lego: { w: 1, h: 1, scale: 'toy' },
  marble: { w: 1, h: 1, scale: 'toy' },
  sock: { w: 3, h: 1, scale: 'toy' },
  toothpicks: { w: 1, h: 3, scale: 'toy' },
  straw: { w: 2, h: 1, scale: 'toy' },
  bottleCap: { w: 3, h: 1, scale: 'toy' },
  capsule: { w: 1, h: 1, scale: 'toy' },
  scratcherTip: { w: 1, h: 1, scale: 'toy' },
  threadRed: { w: 1, h: 1, scale: 'toy' },
  penCap: { w: 1, h: 1, scale: 'toy' },
};

/** 주민 (인물처럼 움직이는 것) */
export const RESIDENTS_D = ['clothespins', 'coinElder', 'frogBro', 'alleyCat'] as const;

// ───────────────────────── 색 (주민 그림이 쓴다) · 붙이기 ─────────────────────────
const INK = hex('#2a1c24');
const STEEL = hex('#a8b0b8');
const RED = hex('#c8483c');
const PINK = hex('#e88a98');

type Part = [Grid, number, number];

function slice(p: Pix, y0: number, h: number): Pix {
  const q = new Pix(p.w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < p.w; x++) q.set(x, y, p.get(x, y0 + y));
  return q;
}

/** 서 있는 소품: 키를 넘는 윗부분은 인물 위로 (top) */
function stand(pix: Pix, scale: 'person' | 'toy', ox = 0): PropSprite {
  const s: PropSprite = { pix, ox, oy: -pix.h };
  const split = pix.h - (scale === 'person' ? PERSON_SPRITE_H : TOY_SPRITE_H);
  if (split >= 6) {
    s.top = slice(pix, 0, split);
    s.topSplitY = split;
  }
  return s;
}
/** 바닥 · 벽에 구워지는 납작한 것 */
const flat = (pix: Pix, oy = -pix.h): PropSprite => ({ pix, ox: 0, oy, wall: true });
/** 늘 인물 위 (윗층) */
const overTop = (pix: Pix, oy: number): PropSprite => ({ pix, ox: 0, oy, top: pix, topSplitY: pix.h });
/** 한 격자를 판 위 (x, y) 에 */
const one = (W: number, H: number, g: Grid, x: number, y: number, p: Palette, outline = true) => onto(W, H, [[g, x, y]], p, outline);
/** 늘인 줄 격자에서 x 열의 줄 높이 (처진 빨랫줄에 집게 · 빨래를 거는 자리) */
function lineY(g: Grid, x: number): number {
  const i = g.findIndex((r) => r[x] !== undefined && r[x] !== '.');
  return Math.max(0, i);
}

// ───────────────────────── 13장 베란다 ─────────────────────────

/** 베란다 바깥 창 (밤하늘 · 별 · 이웃집 지붕 · 전깃줄) + 아래 난간. open: 창이 열려 바람이 드는 칸 */
function balconyWin(W: number, H: number, opt: string): PropSprite {
  const winH = H - 26;
  const mid = Math.floor(W / 2);
  const g = blank(W, H);
  put(g, tile(X.NIGHT_SKY, W, winH - 2, W % 32), 0, 2);
  put(g, tile(X.ROOFS, W, 10, W % 30), 0, winH - 10);
  put(g, hs(X.SKY_WIRE, W - 2, 18, 18), 1, 8);
  put(g, nine(X.WIN_FRAME, W, winH, 2, 2, 2, 0), 0, 0);
  put(g, vs(X.WIN_BAR, winH, 0, 0), mid - 1, 0);
  if (opt.includes('open')) {
    put(g, vs(X.WIN_SLID, winH, 0, 0), mid - 5, 0);
    put(g, vs(X.CURTAIN_STRING, winH - 6, 0, 0), W - 5, 4);
  } else {
    put(g, X.WIN_GLINT, 4, winH - 12);
    put(g, X.WIN_GLINT, mid + 3, winH - 12);
  }
  put(g, hs(X.SILL, W, 0, 0), 0, winH);
  put(g, tile(vs(X.BAL_WALL, H - winH - 4, 2, 1), W, H - winH - 4), 0, winH + 4);
  return { pix: draw(g, X.balconyPal, false), ox: 0, oy: -H, wall: true };
}

/** 드럼 세탁기 (앞면 동그란 문 · 윗면 · 옆면) */
function washer(W: number): PropSprite {
  const cx = Math.floor((W - 4) / 2);
  return stand(onto(W, 45, [[swap(box(W - 4, 10, 34), 'W', 'F'), 2, 1], [X.WASH_PANEL, 4, 12], [X.WASH_DOOR, cx - 10, 20]], X.washerPal), 'person');
}

const pegTub = (W: number) => stand(one(W, 18, X.PEG_TUB, 5, 5, X.pegPal), 'person');

/** 벽 수도꼭지 · 호스 · 양동이 (yard: 마당 수돗가, 시멘트 받침) */
function faucet(W: number, opt: string): PropSprite {
  if (opt.includes('yard')) return stand(onto(W, 34, [[X.TAP_YARD, 5, 1], [swap(box(W - 2, 4, 9), 'W', 'A'), 1, 21]], X.faucetPal), 'person');
  return stand(onto(W, 40, [[X.TAP_WALL, 8, 2], [X.HOSE, 5, 9], [X.BUCKET, 4, 27]], X.faucetPal), 'person');
}

const dustpan = (W: number, H: number) => flat(one(W, H, X.DUSTPAN, 2, 9, X.dustpanPal));
const gloves = (W: number, H: number) => flat(one(W, H, X.GLOVES, 1, 8, X.glovePal));

/** 빨래 (윗층): 줄에 널린 셔츠 · 양말 · 수건. towel: 의자에 걸친 큰 수건 */
function laundry(W: number, opt: string): PropSprite {
  if (opt.includes('towel')) return overTop(one(W, 40, hs(X.TOWEL_RACK, W, 3, 3), 0, 4, X.laundryPal), -40);
  const line = hs(X.LAUNDRY_LINE, W, 30, 30);
  const parts: Part[] = [[vs(X.LAUNDRY_POST, 38, 1, 1), 0, 2], [vs(X.LAUNDRY_POST, 38, 1, 1), W - 2, 2], [line, 0, 4]];
  const kinds = [X.SHIRT, X.SOCKS, X.TOWEL_HANG];
  for (let x = 3, i = 0; x < W - 8; i++) {
    const c = kinds[i % 3];
    const w = c[0].length;
    parts.push([c, x, 4 + lineY(line, x + Math.floor(w / 2))]);
    x += w + 3;
  }
  return overTop(onto(W, 40, parts, X.laundryPal), -40);
}

/** 빨래 건조대 (서 있는, 바닥에 다리): 널린 빨래 · 집게 */
function dryingRack(W: number): PropSprite {
  const parts: Part[] = [
    [vs(X.RACK_POST, 22, 0, 0), 1, 9], [vs(X.RACK_POST, 22, 0, 0), W - 16, 9],
    [X.RACK_LEGS, 1, 30], [X.RACK_LEGS, W - 16, 30],
    [hs(X.RACK_BAR, W - 4, 1, 1), 2, 8],
  ];
  const slots = ['C', 'A', 'B', 'G'];
  for (let i = 0; i < 5; i++) parts.push([vs(swap(X.RACK_CLOTH, 'C', slots[i % 4]), 14 + (i % 2) * 8, 2, 1), 6 + i * Math.floor((W - 12) / 5), 9]);
  return stand(onto(W, 44, parts, X.dryingPal), 'person');
}

/** 「하루 꽃」 화분: 말라 늘어진 잎 (up: 물을 받고 고개를 든 꽃) */
const haruFlower = (W: number, opt: string) =>
  stand(onto(W, 34, [opt.includes('up') ? [X.BLOOM, 6, 6] : [X.WILT, 7, 11], [X.POT, 4, 21]], X.flowerPal), 'person');

const chairFold = (W: number) => stand(one(W, 40, X.CHAIR_FOLD, 5, 11, X.chairFoldPal), 'person');

/** 할머니가 꽂아 둔 「하루 꽃」 이름표 막대 (글씨는 글씨 격자) */
function nameStick(W: number): PropSprite {
  const p = one(W, 30, X.NAME_STICK, 3, 3, X.namePal);
  textH(p, '하루', Math.floor((W - textWidth('하루')) / 2), 5, X.namePal['9']);
  return stand(p, 'person');
}

const feather = (W: number, H: number) => flat(one(W, H, X.FEATHER, 4, 8, X.featherPal));
/** 놀이공원 여우 그림 비닐봉지 */
const foxBag = (W: number) => stand(one(W, 24, X.FOX_BAG, 4, 6, X.foxPal), 'person');
const trowel = (W: number, H: number) => flat(one(W, H, X.TROWEL, 1, 13, X.trowelPal));
/** 작은 노란 물뿌리개 (손에 들거나 바닥에) */
const watercan = (W: number) => stand(one(W, 22, X.WATERCAN, 2, 7, X.canPal), 'person');

// ───────────────────────── 15장 마당 ─────────────────────────

/** 처마 끝 (윗층): 기와 끝선 · 낙숫물 */
const eaves = (W: number) => overTop(onto(W, 18, [[tile(X.EAVES, W, 15), 0, 0], [tile(X.EAVES_DRIP, W, 3), 0, 15]], X.eavesPal, false), -HT - 6);

const downspout = (W: number, H: number) => stand(one(W, H + 4, vs(X.DOWNSPOUT, H + 3, 1, 4), 7, 1, X.spoutPal), 'person');

const boots = (W: number) => stand(onto(W, 22, [[X.BOOT, 2, 5], [X.BOOT, 12, 5]], X.bootPal), 'person');

/** 댓돌 (툇마루 앞 넓적한 디딤돌) · 하얀 고무신 한 켤레 */
const daetdol = (W: number) => stand(onto(W + 4, 20, [[box(W + 2, 8, 7), 1, 4], [X.RUBBER_SHOE, 5, 6], [X.RUBBER_SHOE, 13, 7]], X.daetPal), 'person', -2);

/** 빨간 고무 대야 (물이 차면 물길 그림이 위에) */
const tub = (W: number, H: number) => flat(one(W, H, X.TUB, 1, 4, X.tubPal));

/** 빨랫줄 (윗층): 양 끝 기둥 · 빈 집게 */
function clothesline(W: number): PropSprite {
  const line = hs(X.CLOTHESLINE, W - 6, 30, 30);
  const parts: Part[] = [[vs(X.LINE_POST, 44, 0, 1), 1, 2], [vs(X.LINE_POST, 44, 0, 1), W - 4, 2], [line, 3, 4]];
  for (let x = 16, i = 0; x < W - 10; x += 19, i++) parts.push([i % 2 ? X.PIN2 : X.PIN, x, 3 + lineY(line, x - 3)]);
  return overTop(onto(W, 46, parts, X.linePal), -46 + 4);
}

const snail = (W: number, H: number) => flat(one(W, H, X.SNAIL, 5, 9, X.snailPal));
/** 노란 비옷 단추 (웅덩이 옆) */
const raincoatButton = (W: number, H: number) => flat(one(W, H, X.RAIN_BUTTON, 6, 8, X.rainBtnPal));
/** 덤불 밑 하얀 솜 한 줌 (토비 털) */
const cotton = (W: number, H: number) => flat(one(W, H, X.COTTON_D, 5, 9, X.cottonDPal));
const clothespin = (W: number, H: number) => stand(one(W, H, X.CLOTHESPIN, 9, 6, X.pinPal), 'person');
const looseStone = (W: number, H: number) => stand(one(W, H, X.STONE, 4, 10, X.stonePal), 'person');
const flashlight = (W: number, H: number) => flat(one(W, H, X.FLASH_D, 4, 11, X.flashDPal));
/** 붉은 벽돌 (밀어서 물길을 막는다) */
const brick = (W: number) => stand(one(W, 22, X.BRICK, 2, 8, X.brickPal), 'person');

/** 큰 덤불 (빽빽한 잎 · 아래는 어두운 굴: 그날 토비가 떨어진 자리). 잎 덩이 격자를 뒤에서 앞으로 겹친다 */
const CLUMPS: [number, number][] = [[0.3, 0], [0.7, 0.04], [0.05, 0.22], [0.45, 0.2], [0.9, 0.26], [0.2, 0.45], [0.65, 0.44], [0, 0.66], [0.4, 0.68], [0.85, 0.7], [0.15, 0.88], [0.6, 0.9]];
function shrub(W: number, H: number): PropSprite {
  const Ht = H + 22;
  const parts: Part[] = [[hs(X.SHRUB_HOLE, W - 8, 4, 4), 4, Ht - 8]];
  for (const [fx, fy] of CLUMPS) parts.push([X.LEAF_CLUMP, 1 + Math.round(fx * (W - 24)), 1 + Math.round(fy * (Ht - 24))]);
  return stand(onto(W, Ht, parts, X.shrubPal), 'person');
}

// ───────────────────────── 16장 골목 · 놀이터 ─────────────────────────

/** 주차된 차 (차 밑은 장난감이 숨는다) */
function car(W: number, H: number): PropSprite {
  const Ht = H + 26;
  const g = Ht - 1;
  const parts: Part[] = [
    [vs(X.CAR_SHADOW, 6, 0, 0).map((r) => r.padEnd(W - 12, '2')), 6, g - 8],
    [nine(X.CAR_CABIN, W - 40, 18, 5, 5, 2, 2), 18, g - 56],
    [nine(X.CAR_BODY, W - 4, 38, 6, 6, 5, 2), 2, g - 44],
    [X.CAR_WHEEL, 7, g - 9], [X.CAR_WHEEL, W - 25, g - 9],
    [X.CAR_LIGHT, 5, g - 20], [X.CAR_LIGHT, W - 14, g - 20],
    [X.CAR_PLATE, W / 2 - 8, g - 19],
  ];
  return stand(onto(W, Ht, parts, X.carPal), 'person');
}

/** 우유 상자 (플라스틱 칸막이 · 숨는 칸). stack: 두 개 쌓음 (막힘) */
function milkCrate(W: number, opt: string): PropSprite {
  const Ht = opt.includes('stack') ? 42 : 24;
  const parts: Part[] = [[X.MILK_CRATE, 1, Ht - 18]];
  if (opt.includes('stack')) parts.unshift([X.MILK_CRATE, 1, Ht - 35]);
  return stand(onto(W, Ht, parts, X.cratePal), 'person');
}

const catBowl = (W: number, H: number) => flat(one(W, H, X.CAT_BOWL, 4, 12, X.catBowlPal));
const vinylBag = (W: number, H: number) => flat(one(W, H, X.VINYL_BAG, 4, 9, X.vinylPal));
const flyer = (W: number, H: number) => flat(one(W, H, X.FLYER, 3, 11, X.flyerPal));
/** 하수구 도랑 (시멘트 홈 · 물) */
const ditch = (W: number, H: number) => flat(draw(tile(X.DITCH, W, H), X.ditchPal, false));
/** 전깃줄 (윗층, 골목을 가로지른다) */
const wires = (W: number) => overTop(one(W, 30, hs(X.WIRES, W, 60, 60), 0, 6, X.wiresPal, false), -HT * 3);
const sandCastle = (W: number, H: number) => stand(onto(W, H, [[X.SAND_HEAP, 3, 20], [X.SAND_CASTLE, 6, 7]], X.sandPal), 'person');
/** 가로등 기둥 밑동: 할머니가 짚던 자리, 페인트가 닳은 손바닥 모양 */
const palmPrint = (W: number) => stand(one(W, 30, X.LAMP_POST, 7, 2, X.postPal), 'person');
/** 횡단보도 앞 노란 발자국 스티커 */
const footSticker = (W: number, H: number) => flat(one(W, H, X.FOOT_STICKER, 5, 8, X.footPal, false));
/** 벤치 위 아이스크림 막대 둘 (하나는 「한 개 더」) */
const sticks2 = (W: number, H: number) => flat(one(W, H, X.STICKS2, 5, 12, X.sticksPal));

// ───────────────────────── 14장 소파 밑 (장난감 눈높이) ─────────────────────────

/** 거대한 걸레받이 + 그 위 벽지 (outlet: 콘센트 · 늘어진 충전기 줄) */
function skirtBoard(W: number, H: number, opt: string): PropSprite {
  const g = blank(W, H);
  put(g, tile(X.WALLPAPER, W, H - 30), 0, 0);
  put(g, tile(X.SKIRT, W, 30), 0, H - 30);
  if (opt.includes('outlet')) {
    const ox = Math.floor(W / 2) - 14;
    put(g, X.OUTLET, ox, H - 60);
    put(g, vs(X.CHARGER_CORD, 38, 0, 0), ox + 8, H - 38);
  }
  return { pix: draw(g, X.skirtPal, false), ox: 0, oy: -H, wall: true };
}

/** 소파 다리 (거대한 나무 기둥, 천장까지) */
const sofaLeg = (W: number) => stand(one(W, 120, vs(X.SOFA_LEG, 119, 4, 9), (W - 32) / 2, 1, X.sofaLegPal), 'toy');

/** 소파 바닥 천 가장자리 (윗층): 체크무늬 안감이 위에서 늘어져 있다 */
const sofaBottom = (W: number) => overTop(one(W, 30, tile(X.SOFA_LINING, W, 28), 0, 0, X.liningPal, false), -HT * 2);

/** 튀어나온 용수철 (윗층) */
const spring = (W: number) => overTop(one(W, 44, tile(X.SPRING_COIL, 14, 36), 5, 0, X.springPal), -HT * 2 - 10);

/** 술 장식 (앞쪽 가림막). gap: 사이로 TV 빛 */
function fringe(W: number, opt: string): PropSprite {
  const parts: Part[] = [[tile(X.FRINGE_BAND, W, 8), 0, 0]];
  if (opt.includes('gap')) {
    const a = Math.floor(W / 2) - 14;
    const b = Math.floor(W / 2) + 10;
    parts.push([tile(X.FRINGE_TASSEL, a, 34), 0, 8], [tile(X.FRINGE_TASSEL, W - b, 34, b % 4), b, 8]);
  } else parts.push([tile(X.FRINGE_TASSEL, W, 34), 0, 8]);
  return { pix: onto(W, 46, parts, X.fringePal, false), ox: 0, oy: -30 };
}

/** 루루의 보물 상자 (성냥갑) */
const matchbox = (W: number) =>
  stand(onto(W, 44, [[swap(box(W - 4, 16, 20), 'W', 'A'), 2, 6], [X.MATCH_LABEL, 4, 26], [X.MATCHBOX_DRAWER, 6, 3]], X.matchPal), 'toy');

const crumbHill = (W: number) => stand(one(W, 40, X.CRUMB_HILL, 1, 18, X.crumbPal), 'toy');

/** 커다란 텔레비전 리모컨 */
function remoteGiant(W: number, H: number): PropSprite {
  const parts: Part[] = [[nine(X.REMOTE, W - 4, H + 6, 2, 5, 4, 9), 2, 2]];
  for (let i = 0; i < 12; i++) parts.push([i === 3 ? X.REMOTE_RED : X.REMOTE_KEY, 8 + (i % 6) * 12, 6 + Math.floor(i / 6) * 12]);
  parts.push([X.REMOTE_RED, W - 20, 5]);
  return stand(onto(W, H + 10, parts, X.remotePal), 'toy');
}

const dustBunny = (W: number) => stand(one(W, 30, X.DUST_BUNNY, 8, 14, X.bunnyPal), 'toy');

/** 거대한 단추 (house: 단추 집 두 칸 — 동전 마을의 집) */
function buttonGiant(W: number, opt: string): PropSprite {
  if (opt.includes('house')) return stand(onto(W, 40, [[hs(X.BIG_BTN, W - 4, 8, 8), 2, 26], [X.BTN_HOUSE, W / 2 - 10, 9]], X.buttonPal(true)), 'toy');
  return stand(one(W, 22, X.BIG_BTN, 2, 8, X.buttonPal(false)), 'toy');
}

const candyWrap = (W: number, H: number) => flat(one(W, H, X.CANDY_WRAP, 3, 9, X.wrapPal));
/** 여우 털 세 가닥 (빨간 실로 묶음) */
const furTuft = (W: number, H: number) => flat(one(W, H, X.FUR_TUFT, 4, 7, X.furPal));

/** 거대한 동전 (stack: 쌓인 탑 · 500 · 100 · 50 · 10 한 닢) */
function coinGiant(W: number, opt: string): PropSprite {
  const gold = opt.includes('10') && !opt.includes('100');
  const p = X.coinPal(gold);
  if (opt.includes('stack')) {
    const parts: Part[] = [];
    for (let k = 0; k < 9; k++) parts.push([X.COIN_LAYER, (W - 20) / 2, 45 - k * 5]);
    return stand(onto(W, 54, parts, p), 'toy');
  }
  const w = opt.includes('500') ? 22 : opt.includes('100') ? 20 : opt.includes('50') ? 18 : 16;
  return stand(one(W, 20, hs(X.COIN, w, 6, 6), (W - w) / 2, 9, p), 'toy');
}

const lego = (W: number) => stand(one(W, 30, X.LEGO, 2, 10, X.legoPal), 'toy');
const marble = (W: number) => stand(one(W, 22, X.MARBLE, 3, 4, X.marblePal), 'toy');
/** 아빠 양말 (둘둘 뭉친 산) */
const sock = (W: number) => stand(one(W, 36, X.SOCK_BALL, 11, 12, X.sockBallPal), 'toy');

/** 이쑤시개 울타리 (부스러기에 꽂아 세운 말뚝 · 빨간 실로 엮음): 한 칸마다 같은 울타리 한 마디 */
function toothpicks(W: number, H: number): PropSprite {
  const Ht = H + 26;
  const n = H / HT;
  const parts: Part[] = [];
  for (let ty = 0; ty < n; ty++) {
    const foot = Ht - 1 - (n - 1 - ty) * HT;
    parts.push([X.PICKET_TOP, 0, foot - 29], [X.PICKETS, 0, foot - 23]);
  }
  return stand(onto(W, Ht, parts, X.picketPal), 'toy');
}

const straw = (W: number) => stand(one(W, 20, tile(X.STRAW, W - 4, 8), 2, 8, X.strawPal), 'toy');
const bottleCap = (W: number) => stand(onto(W, 40, [[X.BOTTLE_CAP, 3, 20], [X.BOTTLE_CAP, 39, 20]], X.capPal), 'toy');
/** 인형 뽑기 기계의 동그란 플라스틱 캡슐 */
const capsule = (W: number, H: number) => stand(one(W, H, X.CAPSULE, 4, 5, X.capsulePal), 'toy');
/** 효자손 끝 (고무 손가락) */
const scratcherTip = (W: number, H: number) => flat(one(W, H, X.SCRATCHER, 2, 10, X.scratcherPal));
/** 빨간 실 한 토막 (루루 꼬리와 같은 실) */
const threadRed = (W: number, H: number) => flat(one(W, H, X.THREAD_RED, 3, 7, X.threadPal));
/** 수성펜 뚜껑 */
const penCap = (W: number, H: number) => flat(one(W, H, X.PEN_CAP, 3, 10, X.penPal));

/** 갈래 D 소품 그림 (모르는 이름이면 null) */
export function propDSprite(kind: string, w: number, h: number, opt = ''): PropSprite | null {
  const W = w * HT;
  const H = h * HT;
  switch (kind) {
    case 'balconyWin': return balconyWin(W, H, opt);
    case 'washer': return washer(W);
    case 'pegTub': return pegTub(W);
    case 'faucet': return faucet(W, opt);
    case 'dustpan': return dustpan(W, H);
    case 'gloves': return gloves(W, H);
    case 'laundry': return laundry(W, opt);
    case 'dryingRack': return dryingRack(W);
    case 'haruFlower': return haruFlower(W, opt);
    case 'chairFold': return chairFold(W);
    case 'nameStick': return nameStick(W);
    case 'feather': return feather(W, H);
    case 'foxBag': return foxBag(W);
    case 'trowel': return trowel(W, H);
    case 'watercan': return watercan(W);
    case 'eaves': return eaves(W);
    case 'downspout': return downspout(W, H);
    case 'boots': return boots(W);
    case 'daetdol': return daetdol(W);
    case 'tub': return tub(W, H);
    case 'clothesline': return clothesline(W);
    case 'snail': return snail(W, H);
    case 'raincoatButton': return raincoatButton(W, H);
    case 'cotton': return cotton(W, H);
    case 'clothespin': return clothespin(W, H);
    case 'looseStone': return looseStone(W, H);
    case 'flashlight': return flashlight(W, H);
    case 'brick': return brick(W);
    case 'shrub': return shrub(W, H);
    case 'car': return car(W, H);
    case 'milkCrate': return milkCrate(W, opt);
    case 'catBowl': return catBowl(W, H);
    case 'vinylBag': return vinylBag(W, H);
    case 'flyer': return flyer(W, H);
    case 'ditch': return ditch(W, H);
    case 'wires': return wires(W);
    case 'sandCastle': return sandCastle(W, H);
    case 'palmPrint': return palmPrint(W);
    case 'footSticker': return footSticker(W, H);
    case 'sticks2': return sticks2(W, H);
    case 'skirtBoard': return skirtBoard(W, H, opt);
    case 'sofaLeg': return sofaLeg(W);
    case 'sofaBottom': return sofaBottom(W);
    case 'spring': return spring(W);
    case 'fringe': return fringe(W, opt);
    case 'matchbox': return matchbox(W);
    case 'crumbHill': return crumbHill(W);
    case 'remoteGiant': return remoteGiant(W, H);
    case 'dustBunny': return dustBunny(W);
    case 'buttonGiant': return buttonGiant(W, opt);
    case 'candyWrap': return candyWrap(W, H);
    case 'furTuft': return furTuft(W, H);
    case 'coinGiant': return coinGiant(W, opt);
    case 'lego': return lego(W);
    case 'marble': return marble(W);
    case 'sock': return sock(W);
    case 'toothpicks': return toothpicks(W, H);
    case 'straw': return straw(W);
    case 'bottleCap': return bottleCap(W);
    case 'capsule': return capsule(W, H);
    case 'scratcherTip': return scratcherTip(W, H);
    case 'threadRed': return threadRed(W, H);
    case 'penCap': return penCap(W, H);
    default: return null;
  }
}

// ───────────────────────── 주민 ─────────────────────────

type RDir = 'down' | 'up' | 'left' | 'right';

/** 빨래집게 자매 집순이 · 집돌이 (분홍 · 하늘색, 바람에 흔들림) */
function clothespins(dir: RDir, frame: number): Pix {
  const p = new Pix(30, 34);
  const back = dir === 'up';
  const cols = [PINK, hex('#8ac8e8')];
  cols.forEach((c, k) => {
    const x = 5 + k * 12 + (frame === 1 ? (k ? -1 : 1) : 0);
    const top = 6 + k * 3;
    // 두 다리 (집게 날)
    p.rect(x, top, 4, 24 - k * 3, c);
    p.rect(x + 5, top, 4, 24 - k * 3, shade(c, -0.12));
    p.rect(x, top, 1, 24 - k * 3, shade(c, 0.25));
    // 스프링 (허리)
    p.rect(x - 1, top + 10, 11, 3, STEEL);
    p.rect(x - 1, top + 10, 11, 1, shade(STEEL, 0.3));
    if (!back) {
      p.set(x + 1, top + 4, INK);
      p.set(x + 7, top + 4, INK);
      p.set(x + 4, top + 7, hex('#a04a5a'));
      p.set(x + 3, top + 6, shade(c, 0.3));
    }
  });
  p.outline();
  return dir === 'left' ? p.flipped() : p;
}

/** 백원 할배 (1998년산 백 원 동전, 옆으로 서서 굴러다님 · 흰 눈썹 · 지팡이 성냥개비) */
function coinElder(dir: RDir, frame: number): Pix {
  const p = new Pix(28, 34);
  const c = hex('#c8ccd4');
  const side = dir === 'left' || dir === 'right';
  const cx = 14;
  const bob = frame === 1 ? 1 : 0;
  if (side) {
    p.rect(cx - 3, 6 + bob, 6, 24, shade(c, -0.15));
    for (let y = 7; y < 29; y += 2) p.set(cx + 2, y + bob, shade(c, -0.35));
    p.rect(cx - 3, 6 + bob, 2, 24, shade(c, 0.2));
  } else {
    p.oval(cx, 18 + bob, 11, 12, shade(c, -0.25));
    p.oval(cx, 18 + bob, 10, 11, c);
    p.oval(cx, 18 + bob, 7, 8, shade(c, 0.08));
    if (dir === 'down') {
      // 얼굴 (이순신 장군처럼 근엄한 흰 눈썹)
      p.rect(cx - 6, 13 + bob, 4, 2, hex('#f4f0e8'));
      p.rect(cx + 2, 13 + bob, 4, 2, hex('#f4f0e8'));
      p.set(cx - 4, 16 + bob, INK);
      p.set(cx + 4, 16 + bob, INK);
      p.rect(cx - 3, 21 + bob, 6, 2, hex('#f4f0e8'));
      p.rect(cx - 2, 23 + bob, 4, 1, hex('#f4f0e8'));
    } else {
      textH(p, '100', cx - 6, 15 + bob, shade(c, -0.4));
    }
  }
  // 성냥개비 지팡이
  p.rect(cx + 11, 10, 2, 22, hex('#e8d0a0'));
  p.ball(cx + 12, 10, 2, 2, RED);
  p.outline();
  return dir === 'left' ? p.flipped() : p;
}

/** 개굴 형 (진짜 청개구리, 빗방울이 맺힌 등) */
function frogBro(dir: RDir, frame: number): Pix {
  const p = new Pix(24, 20);
  const c = hex('#6ab048');
  const hop = frame >= 2 ? -3 : 0;
  const side = dir === 'left' || dir === 'right';
  if (side) {
    p.oval(11, 13 + hop, 8, 5, c);
    p.oval(16, 10 + hop, 4, 4, c);
    p.ball(17, 8 + hop, 2, 2, hex('#f0f4d0'));
    p.set(18, 8 + hop, INK);
    p.rect(4, 15 + hop, 6, 3, shade(c, -0.2));
    p.rect(13, 17 + hop, 4, 2, shade(c, -0.2));
    p.line(17, 12 + hop, 20, 12 + hop, hex('#3a5a28'));
  } else {
    p.oval(12, 13 + hop, 8, 6, c);
    p.oval(12, 15 + hop, 5, 3, dir === 'up' ? shade(c, -0.1) : hex('#e8f0c8'));
    for (const dx of [-5, 5]) {
      p.ball(12 + dx, 7 + hop, 3, 3, c);
      if (dir !== 'up') {
        p.ball(12 + dx, 7 + hop, 1.5, 1.5, hex('#f0f4d0'));
        p.set(12 + dx, 7 + hop, INK);
      }
    }
    p.rect(3, 16 + hop, 4, 3, shade(c, -0.2));
    p.rect(17, 16 + hop, 4, 3, shade(c, -0.2));
    if (dir === 'down') p.line(9, 12 + hop, 15, 12 + hop, hex('#3a5a28'));
  }
  p.set(9, 11 + hop, hex('#d8f0ff'));
  p.outline();
  return dir === 'left' ? p.flipped() : p;
}

/** 길고양이 얼룩이 (진짜 고양이, 장난감보다 크다: 흰 바탕 · 회색 얼룩 · 노란 눈) */
function alleyCat(dir: RDir, frame: number): Pix {
  const p = new Pix(48, 40);
  const white = hex('#e8e4dc');
  const gray = hex('#6a6670');
  const walk = frame % 2;
  const side = dir === 'left' || dir === 'right';
  if (side) {
    // 몸 · 꼬리 · 다리
    p.oval(22, 24, 15, 8, white);
    p.oval(16, 21, 7, 5, gray);
    p.oval(28, 25, 5, 4, gray);
    for (let t = 0; t < 14; t++) p.rect(6 - Math.round(Math.sin(t / 4 + frame) * 2), 22 - t, 3, 1, gray);
    for (const [x, k] of [[12, 0], [17, 1], [27, 0], [32, 1]] as const) p.rect(x, 30 + (walk === k ? -1 : 0), 3, 8, x < 20 ? gray : white);
    // 머리
    p.oval(38, 16, 8, 7, white);
    p.oval(35, 13, 4, 3, gray);
    p.tri(32, 11, 36, 4, 37, 11, white);
    p.tri(39, 11, 43, 4, 44, 12, white);
    p.ball(41, 15, 1.8, 1.8, hex('#e8c848'));
    p.set(41, 15, INK);
    p.set(46, 18, hex('#d88a8a'));
    p.line(44, 19, 48, 18, hex('#c8c0b8'));
  } else {
    const back = dir === 'up';
    p.oval(24, 27, 12, 10, white);
    p.oval(20, 24, 6, 5, gray);
    for (const x of [16, 28]) p.rect(x, 33 + (walk ? 1 : 0), 4, 6, white);
    p.oval(24, 14, 9, 8, white);
    p.oval(20, 12, 4, 4, gray);
    p.tri(15, 10, 18, 2, 21, 8, white);
    p.tri(27, 8, 30, 2, 33, 10, white);
    if (!back) {
      for (const dx of [-4, 4]) {
        p.ball(24 + dx, 14, 2, 2, hex('#e8c848'));
        p.rect(24 + dx, 13, 1, 3, INK);
      }
      p.set(24, 17, hex('#d88a8a'));
      p.line(14, 17, 19, 17, hex('#c8c0b8'));
      p.line(29, 17, 34, 17, hex('#c8c0b8'));
    } else {
      for (let t = 0; t < 14; t++) p.rect(24 + Math.round(Math.sin(t / 4 + frame) * 3), 26 + t, 3, 1, gray);
    }
  }
  p.outline();
  return dir === 'left' ? p.flipped() : p;
}

/** 갈래 D 주민 그림 (모르는 이름이면 null) */
export function residentDSprite(kind: string, dir: RDir, frame: number): Pix | null {
  switch (kind) {
    case 'clothespins': return clothespins(dir, frame % 2);
    case 'coinElder': return coinElder(dir, frame % 2);
    case 'frogBro': return frogBro(dir, frame);
    case 'alleyCat': return alleyCat(dir, frame);
    default: return null;
  }
}
