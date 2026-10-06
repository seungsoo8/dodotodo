/**
 * 기억의 상징물 (기억의 문) · 기억 조각 · 종이별 · 밀 수 있는 덩어리 그림.
 * 모양은 모두 손으로 찍은 격자 (px/keepsakes.ts): 여기서는 조각을 자리에 놓고 팔레트로 칠한 뒤 외곽선을 두른다.
 */
import { Pix, hex, type Color } from './paint.ts';
import { mat, paintGrid, softOutline, type Grid, type Palette } from './px/grid.ts';
import * as G from './px/keepsakes.ts';

const INK = hex('#2a1c24');
const WARM = hex('#3a2430');

const main = (c: Color) => mat('GgCcj', c);
const second = (c: Color) => mat('.hAas', c);
const third = (c: Color) => mat('.lBbn', c);
const paper = (c: Color) => mat('OoPpy', c);
const wood = (c: Color) => mat('.uWwv', c);
const metal = (c: Color) => mat('IiMmz', c);
const pal = (...ps: Palette[]): Palette => Object.assign({ X: INK }, ...ps);
const STARS = { '1': hex('#ffe07a'), '2': hex('#ff9ec7'), '3': hex('#8ad0ff'), '4': hex('#b8f08a'), '5': hex('#ffb070') };

type Part = [Grid, number, number];
/** w×h 그림에 조각들을 놓고 칠한 뒤 외곽선 */
function build(w: number, h: number, parts: Part[], p: Palette, outline = true): Pix {
  const out = new Pix(w, h);
  for (const [g, x, y] of parts) paintGrid(out, g, x, y, p);
  return outline ? softOutline(out, WARM) : out;
}

const YELLOW = hex('#ffe07a');
const ICON: Record<string, () => Pix> = {
  star: () => build(22, 22, [[G.STAR_BIG, 1, 2]], pal(main(YELLOW))),
  halfstar: () => build(22, 22, [[G.STAR_MID, 1, 7], [G.STRIP, 13, 9]], pal(main(YELLOW))),
  key: () => build(22, 22, [[G.KEY_RING, 1, 7], [G.KEY_BIT, 11, 10], [G.BOW, 2, 3]], pal(main(hex('#ffc83a')), { R: hex('#e8414f'), r: hex('#b83038'), '1': hex('#f8807a') })),
  umbrella: () => build(22, 22, [[G.UMBRELLA, 1, 3]], pal(main(hex('#e85a6a')), wood(hex('#6a4a3a')))),
  needle: () => build(22, 22, [[G.NEEDLE, 2, 3]], pal(metal(hex('#c8d0d8')), main(hex('#e85a6a')), { R: hex('#e85a6a') })),
  phone: () => build(22, 22, [[G.PHONE, 2, 5]], pal(paper(hex('#ece2d0')), second(hex('#a8a090')))),
  candle: () => build(22, 22, [[G.CANDLE, 7, 3]], pal(main(hex('#8ad0ff')), { '1': hex('#ffd84a'), '2': hex('#fff4c8'), '3': hex('#ff9a4a') })),
  photo: () => build(22, 22, [[G.PHOTO, 2, 3]], pal(wood(hex('#8a5a3a')), paper(hex('#f0e4c8')), main(hex('#a88ad0')), second(hex('#4a3226')), third(hex('#ffd25a')), { H: hex('#e8e4ec'), S: hex('#f4d8c0') })),
  puppet: () => build(22, 22, [[G.PUPPET, 4, 2]], pal(mat('.EFf.', hex('#b07444')), second(hex('#e8c08c')), main(hex('#4f9a52')), { '2': hex('#e8a07a'), '3': hex('#e89090'), '4': hex('#f2c94c'), y: hex('#4a2e20') })),
  jar: () => build(22, 22, [[G.JAR, 5, 3]], pal(wood(hex('#e8c860')), { I: hex('#f2fafc'), G: hex('#d8f0f8'), g: hex('#a8c8d4') }, STARS)),
  letter: () => build(22, 22, [[G.LETTER, 2, 5]], pal(paper(hex('#f8f0e0')), { R: hex('#e85a6a'), '1': hex('#f8a0a0') })),
};

/** 상징물 그림 (22×22) */
export function keepsakeSprite(icon: string): Pix {
  return (ICON[icon] ?? (() => build(22, 22, [[G.ORB, 4, 4]], pal(main(YELLOW), { O: hex('#fff6d0') }))))();
}

/** 기억 조각: 빛나는 구슬 (frame 0~3 반짝임) */
export function shardSprite(frame: number): Pix {
  const k = frame % 4;
  return build(16, 16, [[G.SHARD, 3, 3], [k === 0 || k === 2 ? G.SPARK_CROSS : G.SPARK_X, 0, 0]], pal(main(hex('#bfe8ff')), { O: hex('#f6fbff'), '1': hex('#fcfdff') }), false);
}

/** 바닥에 떨어진 종이별 */
export function paperStarSprite(): Pix {
  return build(11, 11, [[G.STAR_SMALL, 1, 1]], pal(main(YELLOW)));
}

const BLOCK: Record<string, () => Pix> = {
  cookie: () => build(24, 30, [[G.BLK_COOKIE, 1, 7]], pal(main(hex('#d8a060')), { X: hex('#5a3420'), x: hex('#7a4a30') })),
  book: () => build(24, 30, [[G.BLK_BOOK, 1, 7]], pal(main(hex('#c84a4a')), paper(hex('#f4ecdc')), { '1': hex('#e8c860') })),
  shoe: () => build(24, 30, [[G.BLK_SHOE, 1, 7]], pal(main(hex('#4a78d8')), paper(hex('#eeeef0')), metal(hex('#c8c8d0')), { O: hex('#f6f6f8') })),
  soap: () => build(24, 30, [[G.BLK_SOAP, 1, 7]], pal(main(hex('#f8c8d8')), { O: hex('#eef6fc') })),
  spool: () => build(24, 30, [[G.BLK_SPOOL, 1, 7]], pal(wood(hex('#c8905a')), main(hex('#e85a6a')))),
  pot: () => build(24, 30, [[G.BLK_POT, 1, 7]], pal(main(hex('#c8704a')), third(hex('#4a9a4a')))),
  box: () => build(24, 30, [[G.BLK_BOX, 1, 7]], pal(mat('QqKkx', hex('#c89a64')), mat('.eTt.', hex('#d8c098')))),
};

/** 보리가 미는 덩어리 */
export function blockSprite(look: string): Pix {
  return (BLOCK[look] ?? (() => build(24, 30, [[G.BLK_BLOCK, 1, 7]], pal(main(hex('#e8b04a')), { R: hex('#e85a5a') }))))();
}
