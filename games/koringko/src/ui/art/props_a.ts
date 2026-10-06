/**
 * 갈래 A 소품: 하루 방 (4 · 8 · 18장) · 새 방 (에필로그). 사람 크기 방(24px 칸), houseProps.ts 와 같은 약속:
 * 칸 자리의 발 (x*24, (y+h)*24) 에서 그림 왼쪽 위까지 (ox, oy). 윗면 밝게 · 앞면 중간 · 오른쪽 옆면 어둡게. 순검정 · 순흰색 없음.
 *  - haruBed      가로로 놓인 하루 침대 (머리판 왼쪽). behind(머리판 · 매트리스 · 베개)와 front(앞판 · 늘어진 이불)로 나뉘어,
 *                 침대에 누운 사람(잠든 하루)이 그 사이에 그려진다. 꾸밈: empty(이불 걷힘) · yarn(노란 털실이 늘어짐) · dawn(새벽빛 이불)
 *  - chairBag     책상 의자 + 등받이에 걸린 낡은 초등학교 책가방 (open: 지퍼 열림)
 *  - pencilFolks  필통 (기본: 닫힌 필통 하나 / out: 몽당연필 · 지우개 · 30cm 자가 나와 서 있다)
 *  - hangerRack   옷걸이 행거 (교복 · 비닐 커버 옷)
 *  - 나머지는 1칸 물건: boxMark(바닥 네모 자국) wasteBin(쓰레기통) sockOne(외짝 양말) dressBag(비닐 커버 검은 원피스)
 *    dustGhost(인형 자리 먼지 자국) mugRings(머그잔 자국 둘) breadTie(빵 끈 집게) coat(겨울 외투) crayonTin(크레용 통)
 *    stickerBag(야광 별 스티커 봉지) blockBox(블록 상자) zipTab(가방 지퍼 고리에 걸린 밧줄 · open: 풀린 밧줄)
 *    crayonScrap(찢어진 크레용 그림 조각) glowStar(바닥 도안 위 야광 별 스티커 자리)
 */
import { Pix } from './paint.ts';
import type { PropSprite } from './houseProps.ts';
import { PERSON_SPRITE_H } from './sizes.ts';
import { blank, draw, hs, nine, onto, put, vs } from './px/chapkit.ts';
import * as X from './px/chapA.ts';

const HT = 24;

/** 갈래 A 소품 이름 · 기본 칸 크기 */
export const PROPS_A_KINDS: Record<string, { w: number; h: number }> = {
  haruBed: { w: 3, h: 2 },
  chairBag: { w: 1, h: 1 },
  pencilFolks: { w: 3, h: 1 },
  hangerRack: { w: 1, h: 1 },
  boxMark: { w: 1, h: 1 },
  wasteBin: { w: 1, h: 1 },
  sockOne: { w: 1, h: 1 },
  dressBag: { w: 1, h: 1 },
  dustGhost: { w: 1, h: 1 },
  mugRings: { w: 1, h: 1 },
  breadTie: { w: 1, h: 1 },
  coat: { w: 1, h: 1 },
  crayonTin: { w: 1, h: 1 },
  stickerBag: { w: 1, h: 1 },
  blockBox: { w: 1, h: 1 },
  zipTab: { w: 1, h: 1 },
  crayonScrap: { w: 1, h: 1 },
  glowStar: { w: 1, h: 1 },
};

// ───────────────────────── 하루 침대 (가로) ─────────────────────────

function haruBed(W: number, H: number, opt: string): PropSprite {
  const lift = 18;
  const Ht = H + lift;
  const empty = opt.includes('empty');
  const pal = X.bedPal(opt.includes('dawn'));
  // 뒤: 머리판 · 매트리스 · 베개 · 이불 (누운 사람은 이 위, 앞판 아래에 그려진다)
  const back = blank(W, Ht);
  put(back, nine(X.BED_MAT, W - 10, 38, 3, 3, 3, 6), 8, lift - 4);
  put(back, X.BED_PILLOW, 10, lift + 1);
  if (empty) {
    put(back, X.BED_DENT, 16, lift + 4);
    put(back, X.BED_LUMP, W - 32, lift + 8);
  } else put(back, nine(X.BED_QUILT, W - 30, 34, 4, 2, 2, 4), 26, lift - 2);
  put(back, vs(X.BED_HEAD, Ht, 5, 4), 0, 0);
  const behind = draw(back, pal);
  // 앞: 침대 틀 앞판 · 다리 · 늘어진 이불 자락 · 털실
  const fy = Ht - 14;
  const fr = blank(W, Ht);
  put(fr, hs(X.BED_FRONT, W - 7, 4, 5), 6, fy);
  if (empty) put(fr, X.BED_DRAPE, W - 30, fy - 3);
  if (opt.includes('yarn')) put(fr, X.BED_YARN, 21, fy - 2);
  const front = draw(fr, pal);
  const pix = new Pix(W, Ht).stamp(behind, 0, 0).stamp(front, 0, 0);
  return { pix, ox: -10, oy: -Ht, behind, front };
}

// ───────────────────────── 의자 + 책가방 · 필통 사람들 ─────────────────────────

function chairBag(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 22;
  const parts: [readonly string[], number, number][] = [[X.CHAIR, 1, 1], [X.BAG, 4, 5], [X.BAG_STRAP, 6, 1]];
  if (opt.includes('open')) parts.push([X.BAG_OPEN, 4, 6]);
  return stand(onto(W, Ht, parts, X.chairPal));
}

function pencilFolks(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 8;
  if (!opt.includes('out')) return flat(onto(W, Ht, [[X.CASE, 1, Ht - 11]], X.pencilPal));
  return stand(onto(W, Ht, [[X.CASE, 1, Ht - 11], [X.STUB, 27, Ht - 15], [X.ERASER, 40, Ht - 12], [X.RULER, 58, Ht - 27]], X.pencilPal));
}

function hangerRack(W: number, H: number): PropSprite {
  const Ht = H + 44;
  return stand(onto(W, Ht, [[X.RACK, 1, Ht - 65], [X.JACKET, 4, 7], [X.DRESS, 13, 6]], X.rackPal));
}

// ───────────────────────── 1칸 물건 ─────────────────────────

const one = (W: number, Ht: number, g: readonly string[], x: number, y: number, p: Parameters<typeof draw>[1], outline = true) => onto(W, Ht, [[g, x, y]], p, outline);

/** 서 있는 소품: 발 줄이 그림 맨 아래, 사람 키보다 높으면 윗부분을 나눈다 */
function stand(pix: Pix, extra: Partial<PropSprite> = {}): PropSprite {
  const s: PropSprite = { pix, ox: 0, oy: -pix.h, ...extra };
  const split = pix.h - PERSON_SPRITE_H;
  if (split >= 6 && !s.top) {
    const top = new Pix(pix.w, split);
    for (let y = 0; y < split; y++) for (let x = 0; x < pix.w; x++) top.set(x, y, pix.get(x, y));
    s.top = top;
    s.topSplitY = split;
  }
  return s;
}
/** 바닥에 구워지는 납작한 것 (인물을 가리지 않음) */
const flat = (pix: Pix): PropSprite => ({ pix, ox: 0, oy: -pix.h, wall: true });

const boxMark = (W: number, H: number) => flat(one(W, H, X.BOX_MARK, 2, 6, X.boxMarkPal, false));
const wasteBin = (W: number) => stand(one(W, 22, X.BIN, 3, 2, X.binPal));
const sockOne = (W: number, H: number, opt: string) =>
  stand(onto(W, H, opt.includes('pair') ? [[X.SOCK2, 7, 5], [X.SOCK, 3, 8]] : [[X.SOCK, 4, 8]], X.sockPal));
const dressBag = (W: number, H: number) => stand(one(W, H, X.DRESS_DOWN, 4, 5, X.rackPal));
const dustGhost = (W: number, H: number) => flat(one(W, H, X.DUST_GHOST, 2, 7, X.dustPal, false));
const mugRings = (W: number, H: number) => flat(one(W, H, X.MUG_RINGS, 3, 6, X.mugPal, false));
const breadTie = (W: number, H: number) => stand(one(W, H, X.BREAD_TIE, 3, 8, X.breadPal));
const coat = (W: number, H: number) => stand(one(W, H + 4, X.COAT, 2, 4, X.coatPal));
const crayonTin = (W: number, H: number) => stand(one(W, H, X.CRAYON_TIN, 4, 7, X.tinPal));
const stickerBag = (W: number, H: number) => stand(one(W, H, X.STICKER_BAG, 5, 6, X.stickerPal));
const blockBox = (W: number, H: number) => stand(one(W, H + 4, X.BLOCK_BOX, 1, 5, X.blockPal));
const zipTab = (W: number, H: number, opt: string) =>
  stand(onto(W, H, opt.includes('open') ? [[X.ZIP, 9, 2], [X.ROPE_COIL, 5, 15]] : [[X.ZIP, 9, 2], [X.ROPE_HANG, 6, 12]], X.zipPal));
const crayonScrap = (W: number, H: number) => stand(one(W, H, X.CRAYON_SCRAP, 2, 7, X.scrapPal));
const glowStar = (W: number, H: number) => flat(one(W, H, X.GLOW_STAR_A, 5, 10, X.glowAPal, false));

/** 갈래 A 소품 그림 (모르는 이름이면 null) */
export function propSpriteA(kind: string, w: number, h: number, opt = ''): PropSprite | null {
  if (!PROPS_A_KINDS[kind]) return null;
  const W = Math.max(1, w) * HT;
  const H = Math.max(1, h) * HT;
  switch (kind) {
    case 'haruBed': return haruBed(W, H, opt);
    case 'chairBag': return chairBag(W, H, opt);
    case 'pencilFolks': return pencilFolks(W, H, opt);
    case 'hangerRack': return hangerRack(W, H);
    case 'boxMark': return boxMark(W, H);
    case 'wasteBin': return wasteBin(W);
    case 'sockOne': return sockOne(W, H, opt);
    case 'dressBag': return dressBag(W, H);
    case 'dustGhost': return dustGhost(W, H);
    case 'mugRings': return mugRings(W, H);
    case 'breadTie': return breadTie(W, H);
    case 'coat': return coat(W, H);
    case 'crayonTin': return crayonTin(W, H);
    case 'stickerBag': return stickerBag(W, H);
    case 'blockBox': return blockBox(W, H);
    case 'zipTab': return zipTab(W, H, opt);
    case 'crayonScrap': return crayonScrap(W, H);
    case 'glowStar': return glowStar(W, H);
  }
  return null;
}
