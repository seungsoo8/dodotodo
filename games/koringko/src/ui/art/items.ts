/**
 * 옮길 수 있는 물건 (@item · @take · @put · @carry): 사람(키 약 40px) 손에 맞는 크기의 도트 그림.
 * 그림의 아래 가운데가 물건이 놓이는 자리 (발 기준). 모양은 모두 손으로 찍은 격자 (px/items.ts),
 * 여기서는 물건마다 팔레트를 골라 칠하고 둘레에 따뜻한 색 외곽선을 두른다.
 */
import { Pix, hex, mix, type Color } from './paint.ts';
import { mat, paintGrid, softOutline, type Grid, type Palette } from './px/grid.ts';
import { stack } from './px/kit.ts';
import * as G from './px/items.ts';

/** 대본이 쓰는 물건 종류 (PROPS.md) */
export const ITEM_KINDS = [
  'box', 'boxOpen', 'boxTaped', 'boxKeep', 'jar', 'jarSmall', 'letter', 'card', 'photo', 'doll', 'toby', 'bear', 'fox', 'cat',
  'scarf', 'yarn', 'bowl', 'cup', 'tray', 'umbrella', 'bag', 'cake', 'pot', 'phone', 'book', 'basket', 'icecream', 'paperstar',
  'tape', 'pen', 'key', 'towel', 'flowers', 'lunchbox', 'sewing', 'candy', 'musicbox',
] as const;

const INK = hex('#2a1c24');
/** 외곽선에 섞는 따뜻한 먹색 */
const WARM = hex('#3a2430');
const CARD = hex('#c89a64');
const TAPE = hex('#e2c890');
const WOOD = hex('#a8703c');
const STEAM = hex('#f4f0ea');

// ───────────────────────── 재질 (글자 뜻은 px/items.ts 머리말) ─────────────────────────
const card = mat('QqKkx', CARD);
const tape = mat('.eTt.', TAPE);
const wood = (c: Color = WOOD) => mat('.uWwv', c);
const paper = (c: Color) => mat('OoPpy', c);
const main = (c: Color) => mat('GgCcj', c);
const second = (c: Color) => mat('.hAas', c);
const third = (c: Color) => mat('.lBbn', c);
const metal = (c: Color) => mat('IiMmz', c);
const pal = (...ps: Palette[]): Palette => Object.assign({ X: INK }, ...ps);

/** 격자 한 장 → 둘레 1칸(외곽선 자리)을 둔 그림. over 는 외곽선 없이 위에 덧찍는 층 (김 · 빛) */
function art(g: Grid, p: Palette, over?: { g: Grid; pal: Palette }): Pix {
  const w = g[0].length;
  const h = g.length;
  const out = softOutline(paintGrid(new Pix(w + 2, h + 2), g, 1, 1, p), WARM);
  if (over) paintGrid(out, over.g, 1, 1, over.pal);
  return out;
}

// ───────────────────────── 종이 상자 ─────────────────────────

const boxPal = pal(card, tape, { N: hex('#fff4a8'), n: mix(hex('#fff4a8'), CARD, 0.35), '1': hex('#fffbe0'), R: hex('#e8414f') });
function closedBox(kind: 'box' | 'boxTaped' | 'boxKeep'): Pix {
  if (kind === 'box') return art(G.BOX, boxPal);
  const note = kind === 'boxTaped' ? G.NOTE_CROSS : G.NOTE_HEART;
  const g = stack(18, 15, [[G.BOX, 0, 0], [G.BOX_BAND, 0, 2], [note, 2, 7]]);
  if (kind === 'boxTaped') return art(g, boxPal);
  const blue = hex('#bfe6ff');
  return art(g, { ...boxPal, N: blue, n: mix(blue, CARD, 0.35), '1': hex('#e8f6ff') });
}

const openPal = pal(card, tape, { F: hex('#f6f0f4'), f: hex('#d8d0dc'), '2': hex('#ff9ec7'), v: hex('#4a2e1c'), x: hex('#3a2416') });

// ───────────────────────── 인형들 ─────────────────────────

const PLUSH = {
  toby: { g: G.PLUSH_TOBY, fur: hex('#f6f0f4'), inner: hex('#ff9ec7'), cloth: hex('#4a78d8'), trim: hex('#e8414f'), muzzle: hex('#f6f0f4') },
  bear: { g: G.PLUSH_BEAR, fur: hex('#b07444'), inner: hex('#e8c08c'), cloth: hex('#4f9a52'), trim: hex('#f2c94c'), muzzle: hex('#e8c08c') },
  fox: { g: G.PLUSH_FOX, fur: hex('#f28a2e'), inner: hex('#fff4e2'), cloth: hex('#3e7a4a'), trim: hex('#a8d86a'), muzzle: hex('#fff4e2') },
  cat: { g: G.PLUSH_CAT, fur: hex('#6a5a80'), inner: hex('#ff9ec7'), cloth: hex('#7b4fd0'), trim: hex('#ffd84a'), muzzle: hex('#6a5a80') },
};
function plush(kind: keyof typeof PLUSH): Pix {
  const c = PLUSH[kind];
  const fur = mat('.EFf.', c.fur);
  return art(c.g, pal(fur, main(c.cloth), second(c.muzzle), {
    '2': c.inner, '3': mix(c.fur, hex('#ff8aa8'), 0.45), '4': c.trim, y: mix(c.fur, INK, 0.7), X: INK,
  }));
}

const dollPal = pal(mat('.HHh.', hex('#eceaf2')), mat('..Ss.', hex('#f4d8c0')), main(hex('#a88ad0')), second(hex('#7a6a8a')), paper(hex('#f4ece0')), wood(hex('#5a4038')), {
  M: hex('#b89a6a'), '3': hex('#f0a0a8'), '5': hex('#e8c040'),
});

// ───────────────────────── 작은 물건들 ─────────────────────────

const STAR = { '1': hex('#ffe07a'), '2': hex('#ff9ec7'), '3': hex('#8ad0ff'), '4': hex('#b8f08a'), '5': hex('#ffb070') };
const glass = { I: hex('#f2fafc'), G: hex('#d8f0f8'), g: hex('#a8c8d4') };
const jarPal = pal(wood(hex('#e8c860')), glass, STAR);

const ITEM: Record<string, () => Pix> = {
  box: () => closedBox('box'),
  boxTaped: () => closedBox('boxTaped'),
  boxKeep: () => closedBox('boxKeep'),
  boxOpen: () => art(G.BOX_OPEN, openPal),
  jar: () => art(G.JAR, jarPal),
  jarSmall: () => art(G.JAR_SMALL, jarPal),
  letter: () => art(G.LETTER, pal(paper(hex('#f8efdc')), { R: hex('#e8414f') })),
  card: () => art(G.CARD, pal(main(hex('#ffc0d2')), second(hex('#f06a8a')), paper(hex('#f6f0ea')), { '1': hex('#ffd84a'), '2': hex('#8ad0ff'), '3': hex('#ff8a3a') })),
  photo: () => art(G.PHOTO, pal(wood(hex('#8a5a3a')), paper(hex('#f0e4c8')), main(hex('#a88ad0')), second(hex('#4a3226')), third(hex('#ffd25a')), { H: hex('#e8e4ec') })),
  doll: () => art(G.DOLL, dollPal),
  toby: () => plush('toby'),
  bear: () => plush('bear'),
  fox: () => plush('fox'),
  cat: () => plush('cat'),
  scarf: () => art(G.SCARF, pal(main(hex('#ffd84a')), paper(hex('#f4f0e0')))),
  yarn: () => art(G.YARN, pal(main(hex('#ffd84a')))),
  bowl: () => art(G.BOWL, pal(paper(hex('#f4ecdc')), second(hex('#e8a860')), third(hex('#5a8ad0')), { '1': hex('#5aa04a') }), { g: G.BOWL_STEAM, pal: { Z: STEAM } }),
  cup: () => art(G.CUP, pal(paper(hex('#f4f0e8')), second(hex('#c88a4a')), { '1': hex('#ff9ec7') }), { g: G.CUP_STEAM, pal: { Z: STEAM } }),
  tray: () => art(G.TRAY, pal(wood())),
  umbrella: () => art(G.UMBRELLA, pal(main(hex('#ffd84a')), metal(hex('#8a8a96')), wood(hex('#7a4a2a')), { '1': hex('#e8584a') })),
  bag: () => art(G.BAG, pal(main(hex('#e8584a')), metal(hex('#ffd84a')), { O: hex('#fbe8e0') })),
  cake: () => art(G.CAKE, pal(paper(hex('#fff0f4')), main(hex('#f8a0b8')), second(hex('#8ad0ff')), third(hex('#ffd84a')), { '1': hex('#ffd84a'), '3': hex('#ff8a3a'), '4': hex('#e8414f') })),
  pot: () => art(G.POT, pal(main(hex('#c8704a')), second(hex('#ffd84a')), third(hex('#5aaa4a')), paper(hex('#f8f4ec')), { '1': hex('#4a9a4a'), '2': hex('#e8904a') })),
  phone: () => art(G.PHONE, pal(paper(hex('#e8e8f0')), second(hex('#3a4a6a')), metal(hex('#a8a8b8')), { h: hex('#8ab0e8') })),
  book: () => art(G.BOOK, pal(main(hex('#4a90e0')), paper(hex('#f4ecdc')), { '1': hex('#ffd84a'), O: hex('#f4f8fc') })),
  basket: () => art(G.BASKET, pal(wood(hex('#d8a860')), third(hex('#6ab04a')), { '1': hex('#ff8a8a'), '2': hex('#e8414f') })),
  icecream: () => art(G.ICECREAM, pal(main(hex('#ff9ec7')), second(hex('#7a4a2a')), wood(hex('#e8c890')))),
  paperstar: () => art(G.PAPERSTAR, pal(main(hex('#ffe07a')))),
  tape: () => art(G.TAPE_ROLL, pal(tape, wood(hex('#8a6a4a')))),
  pen: () => art(G.PEN, pal(paper(hex('#ece8e0')))),
  key: () => art(G.KEY, pal(main(hex('#e8c040')))),
  towel: () => art(G.TOWEL, pal(main(hex('#8ad0e8')), paper(hex('#f4f0e0')))),
  flowers: () => art(G.FLOWERS, pal(paper(hex('#f4ecdc')), third(hex('#5aaa4a')), { '1': hex('#ffd84a'), '2': hex('#ff9ec7'), '3': hex('#f06a8a'), '5': hex('#b08ae8'), R: hex('#e8414f') })),
  lunchbox: () => art(G.LUNCHBOX, pal(main(hex('#6ab08a')), second(hex('#9ad0b0')), paper(hex('#f6f0e6')))),
  sewing: () => art(G.SEWING, pal(main(hex('#c8584a')), second(hex('#e8414f')), third(hex('#4a90e0')), wood(hex('#d8c098')), { '1': hex('#c8c8d0'), '2': hex('#e8c860') })),
  candy: () => art(G.CANDY, pal(paper(hex('#e8d8a8')), main(hex('#e8a030')))),
  musicbox: () => art(G.MUSICBOX, pal(wood(hex('#b8784a')), main(hex('#e8c040')), second(hex('#c8384a')), metal(hex('#c8a040')))),
};

/** 모르는 종류: 끈으로 묶은 작은 꾸러미 */
const parcel = () => art(G.PARCEL, pal(mat('QqKkx', hex('#d8b484')), second(hex('#a85a4a'))));

// ───────────────────────── 기억 물건 전용 모양 (look) ─────────────────────────

/** 뜯어진 테이프 자락 */
const tornTape = () => art(G.TORN_TAPE, pal(mat('.eTt.', hex('#c8a46a')), { P: hex('#e8d8b8'), v: hex('#6a4a2a') }));
/** 엎어 놓은 액자 */
const photoDown = () => art(G.PHOTO_DOWN, pal(wood(hex('#7a4e30')), second(hex('#b89a70')), { M: hex('#a8a8b0'), w: hex('#8a6a46') }));
/** 뚜껑문 틈: 마룻널 사이 가는 틈으로 아래층 노란 불빛이 샌다 (외곽선 없음) */
function floorCrack(): Pix {
  const p = new Pix(24, 7);
  return paintGrid(p, G.FLOOR_CRACK, 0, 0, { x: hex('#3a2418'), '1': hex('#ffd86a'), '2': hex('#fff0b0'), '3': hex('#e8a848'), '5': hex('#c88a40') });
}

/** 물건 이름과 다른 기억 물건 전용 모양 (things 의 look) */
export const LOOK_ART: Record<string, () => Pix> = {
  tape: tornTape,
  'photo:down': photoDown,
  crack: floorCrack,
};

/** 물건 그림 한 장 (아래 가운데가 놓이는 자리) */
export function itemSprite(kind: string): Pix {
  return (ITEM[kind] ?? parcel)();
}
