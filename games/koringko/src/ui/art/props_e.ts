/**
 * 갈래 E 근접 지도 소품 · 주민 그림: 17장 토비의 태엽 속 (황동 톱니 · 태엽 스프링 · 솜 · 바느질 안감 · 메아리 글자)
 * 과 20장 할머니의 재봉 상자 (누빈 안감 · 실패 · 바늘꽂이 · 단추 · 엉킨 노란 실 · 줄자 · 약봉지 …).
 * 약속은 houseProps.ts 와 같다: 칸 자리의 발 (x*24, (y+h)*24) 에서 그림 왼쪽 위까지 (ox, oy), wall 이면 바닥 · 벽에 구워진다.
 * 3면 규칙(윗면 밝게 · 앞면 중간 · 오른쪽 옆면 어둡게), 순검정 · 순흰색 없음.
 */
import { drawGlyph, textH, textWidth } from './glyphs.ts';
import type { PropSprite, RDir } from './houseProps.ts';
import { Pix, hash2, hex, mix, shade, type Color } from './paint.ts';
import { blank, draw, flipG, hs, onto, put, putOn, remap, swap, tile, transpose, vs } from './px/chapkit.ts';
import { box } from './px/chapbox.ts';
import type { Grid, Palette } from './px/grid.ts';
import * as X from './px/chapE.ts';
import { TOY_SPRITE_H } from './sizes.ts';

const HT = 24;

/** 종류 · 기본 칸 크기 (모두 장난감 눈높이) */
export const PROPS_E_KINDS: Record<string, { w: number; h: number; scale: 'toy' }> = {
  // 토비의 태엽 속
  clothWall: { w: 4, h: 3, scale: 'toy' },
  brassGear: { w: 3, h: 2, scale: 'toy' },
  mainspring: { w: 3, h: 2, scale: 'toy' },
  pawl: { w: 2, h: 1, scale: 'toy' },
  screwBig: { w: 2, h: 1, scale: 'toy' },
  cotton: { w: 2, h: 1, scale: 'toy' },
  oilDrop: { w: 1, h: 1, scale: 'toy' },
  rustPatch: { w: 2, h: 1, scale: 'toy' },
  brokenKey: { w: 2, h: 1, scale: 'toy' },
  stitchPatch: { w: 1, h: 1, scale: 'toy' },
  lint: { w: 1, h: 1, scale: 'toy' },
  echo: { w: 1, h: 1, scale: 'toy' },
  keyAxle: { w: 1, h: 1, scale: 'toy' },
  keyGiant: { w: 2, h: 2, scale: 'toy' },
  counter: { w: 2, h: 1, scale: 'toy' },
  axleBar: { w: 6, h: 1, scale: 'toy' },
  // 할머니의 재봉 상자
  quiltWall: { w: 4, h: 3, scale: 'toy' },
  spoolBig: { w: 2, h: 1, scale: 'toy' },
  pincushion: { w: 3, h: 2, scale: 'toy' },
  buttonHill: { w: 3, h: 2, scale: 'toy' },
  bigButton: { w: 1, h: 1, scale: 'toy' },
  yarnLine: { w: 1, h: 1, scale: 'toy' },
  yarnKnot: { w: 1, h: 1, scale: 'toy' },
  tapeMeasure: { w: 1, h: 1, scale: 'toy' },
  scissorsBig: { w: 4, h: 1, scale: 'toy' },
  thimbleCup: { w: 2, h: 1, scale: 'toy' },
  medPouch: { w: 1, h: 1, scale: 'toy' },
  clinicCard: { w: 1, h: 1, scale: 'toy' },
  crumpledLetters: { w: 1, h: 1, scale: 'toy' },
  whiteScrap: { w: 1, h: 1, scale: 'toy' },
  fabricHill: { w: 3, h: 2, scale: 'toy' },
  oilBottle: { w: 1, h: 1, scale: 'toy' },
  lensShard: { w: 1, h: 1, scale: 'toy' },
  chalk: { w: 2, h: 1, scale: 'toy' },
  pinBig: { w: 3, h: 1, scale: 'toy' },
  divider: { w: 1, h: 1, scale: 'toy' },
  // 새벽 다락 (사람 크기): 다락 뒷벽 둥근 창에 겹쳐 그리는 새벽 하늘
  dawnPane: { w: 4, h: 3, scale: 'toy' },
};

type Part = [Grid, number, number];
// 주민 그림이 쓰는 색
const BRASS = hex('#c8963c');
const BRASS_D = hex('#7a5428');
const RIBBON = hex('#c8483c');
const NEAR_BLACK = hex('#2c2430');

/** 키 넘는 부분을 top 으로 나눈다 (발 줄 = pix 의 -oy 줄) */
function stand(pix: Pix, extra: Partial<PropSprite> = {}): PropSprite {
  const s: PropSprite = { pix, ox: 0, oy: -pix.h, ...extra };
  const split = pix.h - TOY_SPRITE_H;
  if (split >= 6) {
    const top = new Pix(pix.w, split);
    for (let y = 0; y < split; y++) for (let x = 0; x < pix.w; x++) top.set(x, y, pix.get(x, y));
    s.top = top;
    s.topSplitY = split;
  }
  return s;
}
/** 바닥 · 벽에 구워지는 납작한 것 */
const flat = (pix: Pix): PropSprite => ({ pix, ox: 0, oy: -pix.h, wall: true });
const one = (W: number, H: number, g: Grid, x: number, y: number, p: Palette, outline = true) => onto(W, H, [[g, x, y]], p, outline);

// ───────────────────────── 토비의 태엽 속 ─────────────────────────

/** 뒷벽: 토비 몸 안쪽의 하얀 천 안감 (솜이 비치고, 바느질 땀이 하늘의 별자리처럼). keyhole 이면 가운데 열쇠 구멍으로 빛 */
function clothWall(W: number, H: number, opt: string): PropSprite {
  const g = blank(W, H);
  const seamY = Math.floor(H * 0.42);
  const b = Math.floor(seamY / 3);
  put(g, tile(X.CLOTH_T0, W, b), 0, 0);
  put(g, tile(X.CLOTH_T1, W, b, 5), 0, b);
  put(g, tile(X.CLOTH_T2, W, seamY - 2 * b, 9), 0, 2 * b);
  put(g, tile(X.CLOTH_T3, W, H - 9 - seamY, 3), 0, seamY);
  for (const [fx, fy] of [[0.1, 0.1], [0.62, 0.3], [0.3, 0.55]]) if (fx * W + 18 <= W) put(g, X.CLOTH_BUMP, Math.round(fx * W), Math.round(fy * (H - 20)));
  put(g, tile(X.SEAM, W, 3), 0, seamY - 2);
  for (let x = 4; x < W; x += 34) put(g, tile(X.VSTITCH, 1, seamY - 6), x, 2);
  put(g, tile(X.HEM, W, 9), 0, H - 9);
  for (let x = 6; x < W; x += 16) put(g, X.RIVET, x, H - 3);
  if (opt.includes('keyhole')) {
    const cx = Math.floor(W / 2);
    put(g, X.KEY_GLOW, cx - 18, 0);
    put(g, X.KEYHOLE, cx - 7, 9);
    put(g, X.TAPE, cx - 16, 6);
    put(g, X.TAPE, cx + 9, 30);
  }
  return { pix: draw(g, X.clothPal, false), ox: 0, oy: -H, wall: true };
}

/** 큰 황동 톱니 (바닥에 누워 돈다). rust 면 녹슨 톱니 (붉은 갈색 · 얼룩), small 이면 작게 */
function brassGear(W: number, H: number, opt: string): PropSprite {
  const rust = opt.includes('rust');
  const Ht = H + 8;
  const g = blank(W, Ht);
  if (W >= 48 && !opt.includes('small')) {
    put(g, X.GEAR, Math.floor((W - 48) / 2), Ht - 26);
    if (rust) putOn(g, X.RUST_SPOTS, Math.floor(W / 2) - 15, Ht - 22);
  } else {
    put(g, X.GEAR_S, Math.floor((W - 22) / 2), Ht - 17);
    if (rust) putOn(g, X.RUST_SPOTS, Math.floor((W - 22) / 2), Ht - 15);
  }
  return stand(draw(g, X.gearPal(rust)));
}

/** 태엽 스프링 (태엽 심): 납작한 쇠띠가 나선으로 감겨, 거의 다 풀려 느슨하다. wound 면 촘촘히 감김 */
function mainspring(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 6;
  const wound = opt.includes('wound');
  const x0 = Math.floor((W - 48) / 2);
  const parts: Part[] = wound
    ? [[X.RING48, x0, 8], [X.RING40, x0 + 4, 10], [X.RING32, x0 + 8, 12], [X.RING24, x0 + 12, 14], [X.RING16, x0 + 16, 16]]
    : [[X.RING48, x0, 8], [X.RING32, x0 + 8, 12], [X.RING16, x0 + 16, 16], [X.SPRING_TAIL, x0 + 44, 22]];
  parts.push([X.SPRING_AXLE, x0 + 20, 18]);
  return stand(onto(W, Ht, parts, X.springPal));
}

/** 멈춤쇠 · 걸쇠: 굴대에 꽂힌 휘어진 쇠 갈고리 (끝이 아래로 굽어 톱니를 붙든다) */
const pawl = (W: number, H: number) => stand(onto(W, H + 14, [[X.PAWL_BASE, 1, H + 4], [X.PAWL_ARM, 8, 14], [X.PAWL_BOLT, 5, 20]], X.pawlPal));

/** 굴러다니는 큰 나사 (누운 원기둥 · 십자 머리) */
const screwBig = (W: number, H: number) => stand(one(W, H, X.SCREW, 5, H - 12, X.screwPal));

/** 솜 덩어리 (토비 몸속을 채운 하얀 솜) */
const cotton = (W: number, H: number) => stand(one(W, H + 4, X.COTTON_E, 4, H - 12, X.cottonEPal));

const oilDrop = (W: number, H: number) => flat(one(W, H, X.OIL_DROP, 4, H - 12, X.oilPal, false));
const rustPatch = (W: number, H: number) => flat(one(W, H, X.RUST_PATCH, 9, 8, X.rustPatchPal, false));
/** 부러진 첫 열쇠 자국: 바닥에 눌린 열쇠 모양 (반쯤 끊긴) */
const brokenKey = (W: number, H: number) => flat(one(W, H, X.KEY_PRINT, 4, H - 13, X.keyPrintPal, false));
/** 반쯤 접힌 귀 안쪽 천 조각: 바느질 땀 한 줄 + 꺾인 철사 뼈대 */
const stitchPatch = (W: number, H: number) => stand(one(W, H + 4, X.STITCH_PATCH, 2, H - 11, X.stitchPal));
/** 남색 외투 주머니 실밥 뭉치 */
const lint = (W: number, H: number) => stand(one(W, H, X.LINT, 5, H - 12, X.lintPal));

/**
 * 하루 목소리의 메아리: 공중에 뜬 빛 글자 조각 (opt 첫 글자 · note 면 음표).
 * 상태 faint 은 부르는 빛(밝게), lit 은 들은 뒤 (금빛 테두리) — 기본은 흐릿하다.
 */
function echo(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 16;
  const state = /\blit\b/.test(opt) ? 'lit' : /\bfaint\b/.test(opt) ? 'faint' : '';
  const p = X.echoPal(state);
  const cy = Ht - 22;
  const parts: Part[] = [[X.ECHO_SPARK, 5, cy - 5], [X.ECHO_POOL, 5, Ht - 6]];
  if (opt.includes('note')) parts.push([X.ECHO_NOTE, 8, cy - 6]);
  const pix = onto(W, Ht, parts, p, false);
  if (!opt.includes('note')) {
    const ch = opt.split(',').find((s) => s && s !== 'lit' && s !== 'faint' && s !== 'note');
    const t = ch ?? '하';
    textH(pix, t, Math.floor(W / 2 - textWidth(t) / 2), cy - 4, p['3']);
  }
  return { pix, ox: 0, oy: -Ht };
}

/** 할머니가 고친 새 열쇠 축: 놋쇠 축에 빨간 리본 끝 */
const keyAxle = (W: number, H: number) => stand(one(W, H + 6, X.KEY_AXLE, 1, H - 11, X.keyAxlePal));

/** 태엽 한가운데 꽂힌 커다란 열쇠 (손잡이는 나비 날개, 빛바랜 빨간 리본) */
function keyGiant(W: number, H: number): PropSprite {
  const Ht = H + 30;
  const cx = W / 2;
  const parts: Part[] = [
    [X.KEY_BASE, cx - 12, Ht - 8],
    [vs(X.KEY_SHAFT, 38, 0, 0), cx - 4, Ht - 44],
    [X.KEY_WING, cx - 22, Ht - 62],
    [flipG(X.KEY_WING), cx + 2, Ht - 62],
    [X.KEY_HUB, cx - 5, Ht - 60],
    [X.KEY_RIBBON, cx - 9, Ht - 46],
  ];
  return stand(onto(W, Ht, parts, X.keyGiantPal));
}

/**
 * 머리 위를 가로지르는 것 (윗층, 장난감보다 늘 위): 놋쇠 굴대 (작은 톱니가 꽂힘) · needle 이면 은빛 큰 바늘 (바늘귀에 빨간 실)
 */
function axleBar(W: number, H: number, opt: string): PropSprite {
  const parts: Part[] = opt.includes('needle')
    ? [[tile(X.NEEDLE_BODY, W - 27, 4), 14, 6], [X.NEEDLE_TIP, W - 14, 6], [X.NEEDLE_EYE, 3, 4]]
    : [[tile(X.AXLE_BAR, W, 5), 0, 6], [X.AXLE_GEAR, Math.floor(W * 0.62) - 4, 0]];
  const p = onto(W, 22, parts, X.axlePal);
  return { pix: p, ox: 0, oy: -p.h - H + 10, top: p, topSplitY: p.h };
}

/** 작은 숫자판: 「2917」에서 멈춘 계수기 (숫자는 글씨 격자) */
function counter(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 8;
  const num = opt.match(/\d+/)?.[0] ?? '2917';
  const parts: Part[] = [[box(W - 4, 6, 14, 'C', 'W'), 2, Ht - 22]];
  for (let i = 0; i < num.length; i++) parts.push([X.DIGIT_PLATE, 6 + i * 9, Ht - 15]);
  const p = onto(W, Ht, parts, X.counterPal);
  for (let i = 0; i < num.length; i++) drawGlyph(p, num[i], 6 + i * 9, Ht - 14, NEAR_BLACK);
  return stand(p);
}

// ───────────────────────── 할머니의 재봉 상자 ─────────────────────────

const FLOWERS: [number, number][] = [[0.08, 0.15], [0.3, 0.4], [0.55, 0.12], [0.8, 0.5], [0.15, 0.7], [0.45, 0.78], [0.7, 0.3], [0.9, 0.85]];
/** 뒷벽: 상자 안벽의 누빈 꽃무늬 안감. lid 면 맨 위 뚜껑 틈으로 새벽빛 (분홍 · 푸름) */
function quiltWall(W: number, H: number, opt: string): PropSprite {
  const g = blank(W, H);
  const b = Math.floor(H / 3);
  put(g, tile(remap(X.QUILT_DIAMOND, 'xyz', 'ckC'), W, b), 0, 0);
  put(g, tile(remap(X.QUILT_DIAMOND, 'xyz', 'CcL'), W, b, 0, b), 0, b);
  put(g, tile(remap(X.QUILT_DIAMOND, 'xyz', 'LCO'), W, H - 2 * b, 0, 2 * b), 0, 2 * b);
  FLOWERS.forEach(([fx, fy], i) => {
    if (i < Math.max(1, Math.floor(W / 12))) put(g, i % 2 ? X.QUILT_FLOWER2 : X.QUILT_FLOWER, Math.round(fx * (W - 3)), Math.round(fy * (H - 12)) + 2);
  });
  put(g, tile(X.QUILT_BASE, W, 6), 0, H - 6);
  if (opt.includes('lid')) put(g, tile(X.LID_SKY, W, 7), 0, 0);
  return { pix: draw(g, X.quiltWallPal, false), ox: 0, oy: -H, wall: true };
}

/** 커다란 실패 (나무 원통 두 마구리 사이에 감긴 실). opt: 실 색 이름 */
function spoolBig(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 22;
  const colors: Record<string, string> = { red: '#c84a44', blue: '#5a7ab8', green: '#6a9a6a', purple: '#9a7ac0', yellow: '#e8c050', cream: '#e8dcc0' };
  const c = colors[opt.split(',')[0]] ?? colors.red;
  const parts: Part[] = [[X.SPOOL_BOTTOM, 6, Ht - 12], [tile(X.SPOOL_THREAD, 27, 26), 10, Ht - 37], [X.SPOOL_TOP, 6, Ht - 41], [X.SPOOL_END, 37, Ht - 22]];
  return stand(onto(W, Ht, parts, X.spoolPal(c)));
}

/** 토마토 바늘꽂이 + 바늘 숲 (빨간 실 꿴 바늘 하나) */
const NEEDLES: [number, number][] = [[12, 28], [18, 22], [24, 26], [30, 18], [36, 24], [42, 20], [48, 27], [54, 23], [60, 29], [21, 31], [39, 30], [51, 32]];
function pincushion(W: number, H: number): PropSprite {
  const Ht = H + 40;
  const g = blank(W, Ht);
  const heads = [X.PIN_NEEDLE, X.PIN_NEEDLE2, X.PIN_NEEDLE3, X.PIN_NEEDLE4];
  NEEDLES.forEach(([x, y], i) => put(g, heads[i % 4], x - 1, y));
  put(g, X.TOMATO, Math.floor((W - 60) / 2), Ht - 40);
  putOn(g, X.TOMATO_GROOVES, Math.floor((W - 60) / 2) + 7, Ht - 30);
  put(g, X.TOMATO_LEAF, Math.floor(W / 2) - 7, Ht - 42);
  put(g, X.THREADED_NEEDLE, Math.floor(W / 2) + 8, Ht - 58);
  return stand(draw(g, X.pincushionPal));
}

/** 단추 산: 짝 잃은 단추들이 언덕처럼 (뒤 줄부터 앞 줄로) */
function buttonHill(W: number, H: number): PropSprite {
  const Ht = H + 18;
  const slots = ['C', 'A', 'B', 'G', 'F', 'N', 'W', 'S'];
  const rows: [number, number, number][] = [[30, 32, 1], [26, 27, 2], [21, 22, 4], [16, 17, 6], [11, 12, 7], [7, 7, 8], [3, 2, 9]];
  const parts: Part[] = [];
  let k = 0;
  for (const [x0, up, n] of rows)
    for (let i = 0; i < n; i++, k++) parts.push([swap(X.SMALL_BTN, 'C', slots[(k * 5) % slots.length]), x0 + i * 7, Ht - 9 - up]);
  return stand(onto(W, Ht, parts, X.buttonsPal));
}

/** 장난감 눈높이의 큰 단추 (opt: black2 · black4 · red4 · square · cream) */
function bigButton(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 2;
  const kind = opt.split(',')[0] || 'black2';
  const c = kind.startsWith('red') ? '#c84a44' : kind === 'cream' ? '#efe4cc' : '#3a3440';
  const four = kind.endsWith('4') || kind === 'square';
  const parts: Part[] = kind === 'square' ? [[X.BTN_SQUARE, 4, Ht - 12]] : [[X.BTN_ROUND, 3, Ht - 13]];
  const cx = W / 2;
  const cy = kind === 'square' ? Ht - 9 : Ht - 9;
  parts.push(four ? [X.HOLES4, cx - 3, cy - 1] : [X.HOLES2, cx - 3, cy]);
  return stand(onto(W, Ht, parts, X.bigBtnPal(c)));
}

/** 바닥을 지나는 노란 털실 한 가닥 (opt: h 가로 · v 세로 · ne nw se sw 꺾임) */
function yarnLine(W: number, H: number, opt: string): PropSprite {
  const d = opt.split(',')[0] || 'h';
  const mid = Math.floor(W / 2);
  const parts: Part[] = [];
  if (d === 'h') parts.push([tile(X.YARN_H, W, 3), 0, mid - 1]);
  else if (d === 'v') parts.push([transpose(tile(X.YARN_H, H, 3)), mid - 1, 0]);
  else {
    parts.push([transpose(tile(X.YARN_H, mid + 2, 3)), mid - 1, d.startsWith('n') ? 0 : mid - 1]);
    parts.push([tile(X.YARN_H, mid + 1, 3), d.endsWith('e') ? mid : 0, mid - 1]);
  }
  return flat(onto(W, H, parts, X.yarnPal, false));
}

/** 엉킨 매듭 (loose 면 풀린 고리) */
const yarnKnot = (W: number, H: number, opt: string) => stand(one(W, H + 6, /\bloose\b/.test(opt) ? X.YARN_LOOSE : X.YARN_KNOT, 3, H - 9, X.yarnPal));

/** 돌돌 말린 줄자 (끝에 실 매듭 · 눈금) */
const tapeMeasure = (W: number, H: number) => stand(one(W, H + 4, X.TAPE_MEASURE, 1, H - 9, X.tapePal));

/** 큰 가위 (벌어진 채 바닥에 누움) */
const scissorsBig = (W: number, H: number) => stand(one(W, H, X.SCISSORS, 9, H - 17, X.scissorsPal));

/** 엎어진 골무 (배처럼) */
const thimbleCup = (W: number, H: number) => stand(one(W, H + 12, X.THIMBLE, 8, H - 12, X.thimblePal));

/** 접힌 흰 약봉지 (연필 글씨 몇 줄) */
const medPouch = (W: number, H: number) => stand(one(W, H, X.MED_POUCH, 3, H - 16, X.medPal));
/** 진료 카드 (분홍 판지 · 날짜 칸) */
const clinicCard = (W: number, H: number) => stand(one(W, H, X.CLINIC_CARD, 2, H - 15, X.cardPal));
/** 구긴 편지지 더미 (「열다섯 살 하루에게」 쓰다 만) */
const crumpledLetters = (W: number, H: number) => stand(one(W, H + 4, X.CRUMPLED, 2, H - 11, X.lettersPal));
/** 토비 털과 같은 하얀 천 조각 (귀 수선용, 시침핀 하나) */
const whiteScrap = (W: number, H: number) => stand(one(W, H, X.WHITE_SCRAP, 2, H - 14, X.scrapPal));

/** 천 조각 언덕 (색색 자투리가 겹겹이): 뒤(높은 단)부터 앞으로 */
const FABRICS: [number, number, number][] = [[26, 4, 16], [20, 3, 20], [36, 3, 16], [14, 2, 18], [30, 2, 20], [8, 1, 20], [26, 1, 22], [46, 1, 18], [2, 0, 22], [22, 0, 24], [44, 0, 24]];
function fabricHill(W: number, H: number): PropSprite {
  const Ht = H + 16;
  const step = (Ht - 22) / 4;
  const slots = ['C', 'A', 'B', 'G', 'N', 'F', 'S'];
  const parts: Part[] = FABRICS.map(([x, lv, w], i) => [hs(swap(X.FABRIC, 'C', slots[i % slots.length]), Math.min(w, W - 2 - x), 2, 2), x + 1, Math.round(Ht - 10 - lv * step)]);
  return stand(onto(W, Ht, parts, X.fabricPal));
}

/** 재봉틀 기름병 (긴 주둥이) */
const oilBottle = (W: number, H: number) => stand(one(W, H + 14, X.OIL_BOTTLE, 6, H - 13, X.oilBottlePal));
/** 돋보기 렌즈 조각 (반짝) */
const lensShard = (W: number, H: number) => flat(one(W, H, X.LENS, 4, H - 10, X.lensPal, false));
/** 재단 분필 (납작한 삼각 분필 · 가루) */
const chalk = (W: number, H: number) => flat(one(W, H, X.CHALK, 5, H - 10, X.chalkPal, false));
/** 바닥에 누운 시침핀 (진주 머리) */
const pinBig = (W: number, H: number) => flat(onto(W, H, [[tile(X.PIN_SHAFT, W - 20, 3), 10, H - 10], [X.PIN_TIP, W - 10, H - 10], [X.PIN_HEAD, 2, H - 12]], X.pinBigPal, false));
/** 칸막이 나무판 위 (가로 칸막이 끝 기둥) */
const divider = (W: number, H: number) => stand(one(W, H + 10, box(W - 2, 6, 18), 1, H - 15, X.dividerPal));

// ───────────────────────── 새벽 다락 ─────────────────────────

/**
 * 다락 뒷벽(atticWall:window, 4×3칸)의 둥근 창 자리에만 새벽 하늘을 덧그린다: 분홍 → 연보라, 바짝 붙은 별 둘.
 * 그림 크기 · 자리는 atticWall 과 같다 (폭 W, 높이 H+12, 창 가운데 (W/2, H+12-38)).
 */
function dawnPane(W: number, H: number): PropSprite {
  const Ht = H + 12;
  const cx = W / 2;
  const cy = Ht - 38;
  const g = blank(W, Ht);
  put(g, X.DAWN, cx - 15, cy - 15);
  putOn(g, X.DAWN_HORIZON, cx - 12, cy + 9);
  putOn(g, X.DAWN_CLOUD, cx - 9, cy + 3);
  putOn(g, X.DAWN_STARS, cx + 5, cy - 8);
  putOn(g, X.DAWN_BAR_H, cx - 15, cy - 1);
  putOn(g, vs(X.DAWN_BAR_V, 31, 0, 0), cx - 1, cy - 15);
  return { pix: draw(g, X.dawnPal, false), ox: 0, oy: -Ht, wall: true };
}

/** 소품 그림. 모르는 kind 는 null */
export function propSpriteE(kind: string, w: number, h: number, opt = ''): PropSprite | null {
  const W = Math.max(1, w) * HT;
  const H = Math.max(1, h) * HT;
  switch (kind) {
    case 'clothWall': return clothWall(W, H, opt);
    case 'brassGear': return brassGear(W, H, opt);
    case 'mainspring': return mainspring(W, H, opt);
    case 'pawl': return pawl(W, H);
    case 'screwBig': return screwBig(W, H);
    case 'cotton': return cotton(W, H);
    case 'oilDrop': return oilDrop(W, H);
    case 'rustPatch': return rustPatch(W, H);
    case 'brokenKey': return brokenKey(W, H);
    case 'stitchPatch': return stitchPatch(W, H);
    case 'lint': return lint(W, H);
    case 'echo': return echo(W, H, opt);
    case 'keyAxle': return keyAxle(W, H);
    case 'keyGiant': return keyGiant(W, H);
    case 'counter': return counter(W, H, opt);
    case 'axleBar': return axleBar(W, H, opt);
    case 'quiltWall': return quiltWall(W, H, opt);
    case 'spoolBig': return spoolBig(W, H, opt);
    case 'pincushion': return pincushion(W, H);
    case 'buttonHill': return buttonHill(W, H);
    case 'bigButton': return bigButton(W, H, opt);
    case 'yarnLine': return yarnLine(W, H, opt);
    case 'yarnKnot': return yarnKnot(W, H, opt);
    case 'tapeMeasure': return tapeMeasure(W, H);
    case 'scissorsBig': return scissorsBig(W, H);
    case 'thimbleCup': return thimbleCup(W, H);
    case 'medPouch': return medPouch(W, H);
    case 'clinicCard': return clinicCard(W, H);
    case 'crumpledLetters': return crumpledLetters(W, H);
    case 'whiteScrap': return whiteScrap(W, H);
    case 'fabricHill': return fabricHill(W, H);
    case 'oilBottle': return oilBottle(W, H);
    case 'lensShard': return lensShard(W, H);
    case 'chalk': return chalk(W, H);
    case 'pinBig': return pinBig(W, H);
    case 'divider': return divider(W, H);
    case 'dawnPane': return dawnPane(W, H);
    default: return null;
  }
}

// ───────────────────────── 주민 ─────────────────────────

export const RESIDENT_E_KINDS = ['gearBig', 'gearSmall', 'thimbleMan'] as const;

/** 톱니 주민: 세워 둔 톱니에 얼굴. big 은 느긋한 큰톱니 (졸린 눈), small 은 조급한 작은톱니 (동그란 눈 · 땀) */
function gearFolk(big: boolean, dir: RDir, frame: number): Pix {
  const Wd = big ? 32 : 24;
  const Hd = big ? 34 : 26;
  const p = new Pix(Wd, Hd);
  const r = big ? 14 : 10;
  const cx = Wd / 2;
  const cy = Hd - r - 3;
  const n = big ? 12 : 9;
  const rot = frame === 1 ? Math.PI / n : 0;
  const c = big ? BRASS : hex('#d8a850');
  // 받침 (축 다리)
  p.rect(cx - 3, Hd - 4, 6, 4, BRASS_D);
  // 이빨
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    p.oval(cx + Math.cos(a) * r, cy + Math.sin(a) * r, big ? 2.6 : 2, big ? 2.6 : 2, shade(c, -0.15));
  }
  p.ball(cx, cy, r - 1, r - 1, c);
  p.oval(cx, cy, r * 0.62, r * 0.62, shade(c, -0.08));
  if (dir === 'up') {
    // 뒷모습: 축 구멍 · 바퀴살
    p.oval(cx, cy, 3, 3, BRASS_D);
    for (let i = 0; i < 4; i++) p.line(cx, cy, cx + Math.cos(i * 1.57 + 0.3) * r * 0.6, cy + Math.sin(i * 1.57 + 0.3) * r * 0.6, shade(c, -0.25));
  } else {
    const side = dir === 'left' ? -2 : dir === 'right' ? 2 : 0;
    const ey = cy - 2;
    const blink = frame === 1 && big;
    for (const ex of [cx - (big ? 5 : 4) + side, cx + (big ? 5 : 4) + side]) {
      if (blink || big) p.rect(ex - 1.5, ey, 3, 1, NEAR_BLACK);
      else {
        p.oval(ex, ey, 2, 2, hex('#f6f0e0'));
        p.rect(ex - 0.5 + side * 0.25, ey - 0.5, 1.5, 1.5, NEAR_BLACK);
      }
    }
    // 입
    if (big) p.rect(cx - 3 + side, cy + 4, 6, 1, shade(c, -0.5));
    else p.oval(cx + side, cy + 4, 1.5, 1, shade(c, -0.5));
    // 볼 · 땀
    p.set(cx - 7 + side, cy + 2, hex('#e89a7a'));
    p.set(cx + 7 + side, cy + 2, hex('#e89a7a'));
    if (!big && frame === 1) p.oval(cx + r - 1, cy - r + 3, 1.5, 2, hex('#a8d8f0'));
  }
  p.outline();
  return p;
}

/** 골무 아재: 은빛 골무에 콧수염, 점점이 눌린 자국 */
function thimbleMan(dir: RDir, frame: number): Pix {
  const Wd = 24;
  const Hd = 30;
  const p = new Pix(Wd, Hd);
  const c = hex('#b8bcc8');
  const bob = frame === 1 ? 1 : 0;
  const cx = 12;
  // 다리 (짧은 실 두 가닥)
  p.rect(cx - 4, Hd - 5, 2, 5, RIBBON);
  p.rect(cx + 2, Hd - 5, 2, 5, RIBBON);
  // 몸 (위가 둥근 원통)
  p.bar(cx - 8, 8 + bob, 16, Hd - 13 - bob, c);
  p.oval(cx, 8 + bob, 8, 5, shade(c, 0.15));
  p.rect(cx - 8, Hd - 7, 16, 2, shade(c, -0.3));
  for (let y = 6 + bob; y < Hd - 8; y += 3) for (let x = cx - 6; x < cx + 7; x += 3) if (dir === 'up' || y < 12 + bob || y > 19 + bob) p.set(x, y, shade(c, -0.28));
  if (dir !== 'up') {
    const side = dir === 'left' ? -2 : dir === 'right' ? 2 : 0;
    p.rect(cx - 4 + side, 13 + bob, 2, frame === 1 ? 1 : 2, NEAR_BLACK);
    p.rect(cx + 2 + side, 13 + bob, 2, frame === 1 ? 1 : 2, NEAR_BLACK);
    // 콧수염
    p.rect(cx - 5 + side, 17 + bob, 4, 2, hex('#7a6a5a'));
    p.rect(cx + 1 + side, 17 + bob, 4, 2, hex('#7a6a5a'));
    p.set(cx - 6 + side, 18 + bob, hex('#7a6a5a'));
    p.set(cx + 5 + side, 18 + bob, hex('#7a6a5a'));
  }
  p.outline();
  return p;
}

export function residentSpriteE(kind: string, dir: RDir, frame: number): Pix | null {
  const f = frame % 2;
  switch (kind) {
    case 'gearBig': return gearFolk(true, dir, f);
    case 'gearSmall': return gearFolk(false, dir, f);
    case 'thimbleMan': return thimbleMan(dir, f);
    default: return null;
  }
}
