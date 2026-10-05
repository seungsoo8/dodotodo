/**
 * 옮길 수 있는 물건 (@item · @take · @put · @carry): 사람(키 약 40px) 손에 맞는 크기의 도트 그림.
 * 그림의 아래 가운데가 물건이 놓이는 자리 (발 기준). 가구 그림(house.ts)과 같은 결: 위는 밝게 · 아래와 오른쪽은 어둡게 · 외곽선.
 */
import { Pix, hash2, hex, shade, type Color } from './paint.ts';

/** 대본이 쓰는 물건 종류 (PROPS.md) */
export const ITEM_KINDS = [
  'box', 'boxOpen', 'boxTaped', 'boxKeep', 'jar', 'jarSmall', 'letter', 'card', 'photo', 'doll', 'toby', 'bear', 'fox', 'cat',
  'scarf', 'yarn', 'bowl', 'cup', 'tray', 'umbrella', 'bag', 'cake', 'pot', 'phone', 'book', 'basket', 'icecream', 'paperstar',
  'tape', 'pen', 'key', 'towel', 'flowers', 'lunchbox', 'sewing',
] as const;

const INK = hex('#2a1c24');
const CARD = hex('#c89a64');
const TAPE = hex('#e2c890');
const WHITE = hex('#f8f4ec');
const WOOD = hex('#a8703c');

/** 가구와 같은 상자 붓: 윗줄 밝게 · 아랫줄 · 오른쪽 어둡게 */
function box(p: Pix, x: number, y: number, w: number, h: number, c: Color): void {
  p.rect(x, y, w, h, c);
  p.rect(x, y, w, 1, shade(c, 0.25));
  p.rect(x, y + h - 1, w, 1, shade(c, -0.3));
  p.rect(x + w - 1, y, 1, h, shade(c, -0.18));
}

/** 둘레 1칸(외곽선 자리)을 둔 w×h 그림 */
function canvas(w: number, h: number, draw: (p: Pix) => void, after?: (p: Pix) => void): Pix {
  const p = new Pix(w + 2, h + 2);
  const inner = new Pix(w, h);
  draw(inner);
  p.stamp(inner, 1, 1).outline();
  if (after) {
    const top = new Pix(w + 2, h + 2);
    after(top);
    p.stamp(top, 0, 0);
  }
  return p;
}

// ───────────────────────── 종이 상자 ─────────────────────────

const BW = 18;
const BH = 15;
/** 닫힌 이삿짐 상자: 윗면(뚜껑 날개 이음매) + 앞면 (골판지 결 · 손잡이 구멍) */
function cardboard(p: Pix, y0: number): void {
  const top = shade(CARD, 0.14);
  // 윗면 (조금 비스듬히 보이는 뚜껑)
  p.rect(1, y0, BW - 2, 4, top);
  p.rect(0, y0 + 1, BW, 3, top);
  p.rect(1, y0, BW - 2, 1, shade(top, 0.25));
  p.rect(2, y0 + 2, BW - 4, 1, shade(top, -0.12)); // 날개 이음매
  // 앞면
  box(p, 0, y0 + 4, BW, BH - 4, CARD);
  const fy = y0 + 4;
  const fh = BH - 4;
  // 골판지 결: 옅은 세로 줄 · 얼룩
  for (let x = 2; x < BW - 2; x += 3) p.set(x, fy + fh - 3, shade(CARD, -0.08));
  for (let i = 0; i < 6; i++) p.set(1 + Math.floor(hash2(i, 3, 11) * (BW - 3)), fy + 2 + Math.floor(hash2(i, 5, 11) * (fh - 4)), shade(CARD, -0.12));
  // 옆 손잡이 구멍
  p.rect(BW - 5, fy + 2, 3, 1, shade(CARD, -0.55));
  // 왼쪽 모서리 빛
  p.rect(0, fy + 1, 1, fh - 2, shade(CARD, 0.12));
}

function tapeStrip(p: Pix, y0: number): void {
  const cx = BW / 2 - 1;
  p.rect(cx, y0, 3, 4, TAPE);
  p.rect(cx, y0 + 4, 3, 4, TAPE);
  p.rect(cx, y0, 1, 8, shade(TAPE, 0.35));
  p.rect(cx + 2, y0 + 1, 1, 7, shade(TAPE, -0.12));
}

/** 쪽지 (색으로 「두고 가는 짐」 · 「가져가는 짐」을 가른다): 매직펜 글씨 두 줄 */
function note(p: Pix, x: number, y: number, c: Color, mark: 'cross' | 'heart'): void {
  box(p, x, y, 9, 6, c);
  p.set(x, y, shade(c, 0.4));
  // 글씨 (꼬불꼬불 짧은 줄)
  for (let i = 0; i < 5; i++) p.set(x + 1 + i, y + 2 - (i % 2), INK);
  for (let i = 0; i < 4; i++) p.set(x + 1 + i, y + 4, i === 2 ? shade(c, -0.1) : INK);
  if (mark === 'heart') {
    const r = hex('#e8414f');
    p.set(x + 6, y + 3, r);
    p.set(x + 7, y + 4, r);
    p.set(x + 7, y + 3, r);
    p.set(x + 6, y + 4, r);
    p.set(x + 7, y + 2, r);
  } else {
    p.set(x + 6, y + 3, INK);
    p.set(x + 7, y + 4, INK);
  }
}

function closedBox(kind: 'box' | 'boxTaped' | 'boxKeep'): Pix {
  return canvas(BW, BH, (p) => {
    cardboard(p, 0);
    tapeStrip(p, 0);
    if (kind === 'box') return;
    // 테이프로 꽁꽁: 가로 띠 한 줄 더
    p.rect(0, 2, BW, 2, TAPE);
    p.rect(0, 2, BW, 1, shade(TAPE, 0.35));
    if (kind === 'boxTaped') note(p, 2, 7, hex('#fff4a8'), 'cross');
    else note(p, 2, 7, hex('#bfe6ff'), 'heart');
  });
}

/** 뚜껑 열린 상자: 날개 네 장이 벌어지고 안은 어둡고, 장난감 귀가 살짝 */
function openBox(): Pix {
  const W = BW + 6;
  const H = BH + 5;
  return canvas(W, H, (p) => {
    const ox = 3;
    const y0 = 5;
    const flap = shade(CARD, 0.1);
    // 뒤 날개 (위로 젖혀짐)
    p.rect(ox + 2, y0 - 4, BW - 4, 4, shade(CARD, -0.08));
    p.rect(ox + 2, y0 - 4, BW - 4, 1, shade(CARD, 0.1));
    // 안쪽 어둠
    p.rect(ox, y0, BW, 4, hex('#5a3a22'));
    p.rect(ox, y0, BW, 1, hex('#3e2616'));
    // 장난감 귀 (하얀 토끼 귀 두 개)
    const fur = hex('#f6f0f4');
    p.rect(ox + 6, y0 - 2, 2, 5, fur);
    p.rect(ox + 10, y0 - 1, 2, 4, shade(fur, -0.08));
    p.set(ox + 6, y0 - 1, hex('#ff9ec7'));
    p.set(ox + 10, y0, hex('#ff9ec7'));
    // 앞면
    box(p, ox, y0 + 4, BW, BH - 4, CARD);
    p.rect(ox, y0 + 5, 1, BH - 6, shade(CARD, 0.12));
    for (let x = ox + 2; x < ox + BW - 2; x += 3) p.set(x, y0 + BH - 3, shade(CARD, -0.08));
    p.rect(ox + BW - 5, y0 + 6, 3, 1, shade(CARD, -0.55));
    // 앞 날개: 앞으로 접혀 내려옴 (반쯤)
    p.rect(ox + 1, y0 + 4, BW - 2, 2, flap);
    p.rect(ox + 1, y0 + 4, BW - 2, 1, shade(flap, 0.25));
    // 양옆 날개: 비스듬히 벌어짐
    p.tri(ox, y0 + 4, ox, y0, ox - 3, y0 - 2, flap);
    p.tri(ox + BW - 1, y0 + 4, ox + BW - 1, y0, ox + BW + 2, y0 - 2, shade(CARD, -0.06));
    // 뜯긴 테이프 자국
    p.rect(ox + BW / 2 - 1, y0 + 4, 3, 3, TAPE);
  });
}

// ───────────────────────── 인형들 ─────────────────────────

function plush(kind: 'toby' | 'bear' | 'fox' | 'cat'): Pix {
  const C = {
    toby: { fur: hex('#f6f0f4'), inner: hex('#ff9ec7'), cloth: hex('#4a78d8'), trim: hex('#e8414f') },
    bear: { fur: hex('#b07444'), inner: hex('#e8c08c'), cloth: hex('#4f9a52'), trim: hex('#f2c94c') },
    fox: { fur: hex('#f28a2e'), inner: hex('#fff4e2'), cloth: hex('#3e7a4a'), trim: hex('#a8d86a') },
    cat: { fur: hex('#6a5a80'), inner: hex('#ff9ec7'), cloth: hex('#7b4fd0'), trim: hex('#ffd84a') },
  }[kind];
  return canvas(11, 14, (p) => {
    const cx = 5.5;
    // 귀
    if (kind === 'toby') {
      p.rect(2, 0, 2, 5, C.fur);
      p.rect(7, 0, 2, 5, shade(C.fur, -0.06));
      p.set(2, 1, C.inner);
      p.set(7, 1, C.inner);
      p.set(2, 2, C.inner);
      p.set(7, 2, C.inner);
    } else if (kind === 'bear') {
      p.ball(2.5, 4, 2, 2, C.fur, true);
      p.ball(8.5, 4, 2, 2, C.fur, true);
      p.set(2, 4, C.inner);
      p.set(8, 4, C.inner);
    } else {
      p.tri(1, 6, 2, 1, 5, 4, C.fur);
      p.tri(10, 6, 9, 1, 6, 4, shade(C.fur, -0.06));
      p.set(2, 4, C.inner);
      p.set(8, 4, C.inner);
    }
    // 꼬리 (여우는 크게)
    if (kind === 'fox') {
      p.ball(9.5, 11, 1.8, 2.5, C.fur, true);
      p.set(10, 13, C.inner);
    }
    // 몸 · 옷
    p.ball(cx, 11, 4, 3, C.cloth, true);
    p.rect(2, 9, 7, 1, C.trim);
    // 팔
    p.set(1, 10, C.fur);
    p.set(9, 10, shade(C.fur, -0.1));
    // 머리
    p.ball(cx, 6.5, 4, 3.4, C.fur, true);
    if (kind === 'fox') p.oval(cx, 8, 2, 1.2, C.inner);
    if (kind === 'bear') p.oval(cx, 8, 1.8, 1.1, C.inner);
    p.set(4, 6, INK);
    p.set(7, 6, INK);
    p.set(5, 8, shade(C.fur, -0.5));
    p.set(6, 8, shade(C.fur, -0.5));
    p.set(3, 7, hex('#ff9ec7'));
    p.set(8, 7, hex('#ff9ec7'));
    // 다리
    p.rect(3, 13, 2, 1, C.fur);
    p.rect(6, 13, 2, 1, shade(C.fur, -0.1));
    // 나비 모자 (고양이)
    if (kind === 'cat') {
      p.rect(3, 2, 5, 1, C.cloth);
      p.set(5, 1, C.trim);
    }
  });
}

/** 태엽 할머니 인형 (흰 쪽머리 · 안경 · 보라 옷 · 등의 태엽) */
function doll(): Pix {
  return canvas(10, 14, (p) => {
    p.ball(5, 1.5, 1.8, 1.5, hex('#eceaf2'), true);
    // 태엽 (뒤로 살짝)
    p.rect(8, 8, 2, 1, hex('#e8c040'));
    p.rect(9, 7, 1, 3, hex('#e8c040'));
    // 몸 (보라 카디건 · 치마)
    p.rect(2, 7, 6, 4, hex('#a88ad0'));
    p.rect(1, 10, 8, 3, hex('#7a6a8a'));
    p.rect(1, 10, 8, 1, shade(hex('#7a6a8a'), 0.2));
    p.rect(4, 7, 2, 3, hex('#f4ece0'));
    p.rect(2, 13, 2, 1, hex('#5a4038'));
    p.rect(6, 13, 2, 1, hex('#5a4038'));
    // 머리
    p.ball(5, 4.5, 3.2, 3, hex('#f4d8c0'), true);
    p.rect(2, 2, 6, 1, hex('#eceaf2'));
    p.set(2, 3, hex('#eceaf2'));
    p.set(7, 3, hex('#eceaf2'));
    const gl = hex('#b89a6a');
    p.rect(3, 4, 2, 2, gl);
    p.rect(6, 4, 2, 2, gl);
    p.set(3, 5, INK);
    p.set(6, 5, INK);
    p.set(5, 7, hex('#ff9ec7'));
  });
}

// ───────────────────────── 작은 물건들 ─────────────────────────

const STAR_C = [hex('#ffe07a'), hex('#ff9ec7'), hex('#8ad0ff'), hex('#b8f08a'), hex('#ffb070')];

function glassJar(w: number, h: number, stars: number): Pix {
  return canvas(w, h, (p) => {
    const glass = hex('#d8f0f8');
    // 뚜껑
    box(p, 1, 0, w - 2, 3, hex('#e8c860'));
    // 목 · 몸통
    p.rect(1, 3, w - 2, 1, shade(glass, -0.1));
    p.rect(0, 4, w, h - 4, glass);
    p.rect(1, h - 1, w - 2, 1, shade(glass, -0.2));
    p.rect(w - 1, 5, 1, h - 6, shade(glass, -0.15));
    // 종이별 (아래부터 쌓임)
    for (let i = 0; i < stars; i++) {
      const x = 1 + Math.floor(hash2(i, 1, 9) * (w - 2));
      const y = h - 2 - Math.floor(hash2(i, 2, 9) ** 0.7 * (h - 7));
      p.set(x, y, STAR_C[i % STAR_C.length]);
    }
    // 유리 반짝임
    p.rect(1, 5, 1, h - 8, hex('#ffffff'));
    p.set(2, 5, hex('#ffffff'));
  });
}

function letter(): Pix {
  return canvas(11, 8, (p) => {
    box(p, 0, 0, 11, 8, hex('#fff8ec'));
    p.line(0, 0, 5, 4, shade(hex('#fff8ec'), -0.2));
    p.line(10, 0, 5, 4, shade(hex('#fff8ec'), -0.2));
    // 하트 봉인 스티커
    const r = hex('#e8414f');
    p.rect(4, 4, 3, 2, r);
    p.set(4, 3, r);
    p.set(6, 3, r);
    p.set(5, 6, r);
    p.set(4, 4, shade(r, 0.4));
  });
}

function card(): Pix {
  return canvas(10, 10, (p) => {
    // 접어 세운 생일 카드: 앞면 분홍 · 뒷면 그늘
    p.rect(7, 1, 3, 9, shade(hex('#f8a0b8'), -0.25));
    box(p, 0, 0, 8, 10, hex('#ffc8d8'));
    // 작은 케이크 그림 · 별
    p.rect(2, 5, 4, 3, hex('#ffffff'));
    p.rect(2, 5, 4, 1, hex('#f06a8a'));
    p.set(4, 3, hex('#ff8a3a'));
    p.set(4, 4, hex('#8ad0ff'));
    p.set(1, 1, hex('#ffd84a'));
    p.set(6, 2, hex('#ffd84a'));
  });
}

function photo(): Pix {
  return canvas(10, 12, (p) => {
    box(p, 0, 0, 10, 12, hex('#8a5a3a'));
    p.rect(2, 2, 6, 8, hex('#f0e4c8'));
    // 사진 속 할머니와 하루
    p.set(3, 4, hex('#e8e4ec'));
    p.rect(3, 5, 2, 4, hex('#a88ad0'));
    p.set(6, 5, hex('#4a3226'));
    p.rect(6, 6, 1, 3, hex('#ffd25a'));
    p.rect(2, 2, 6, 1, hex('#fffaf0'));
  });
}

function scarf(): Pix {
  const y = hex('#ffd84a');
  return canvas(13, 7, (p) => {
    // 개어 놓은 노란 목도리 (줄무늬 · 술)
    box(p, 0, 0, 12, 5, y);
    for (let x = 2; x < 11; x += 3) p.rect(x, 1, 1, 3, shade(y, -0.15));
    p.rect(0, 2, 12, 1, hex('#f4f0e0'));
    for (let x = 1; x < 12; x += 2) p.set(x, 5, shade(y, -0.1));
    p.rect(9, 4, 3, 2, shade(y, -0.05));
    p.set(12, 5, y);
    p.set(12, 6, shade(y, -0.1));
  });
}

function yarn(): Pix {
  const y = hex('#ffd84a');
  return canvas(10, 8, (p) => {
    p.ball(4, 4, 4, 3.6, y, true);
    // 감긴 실 결
    p.line(1, 5, 5, 1, shade(y, -0.2));
    p.line(3, 7, 7, 2, shade(y, -0.2));
    p.line(1, 3, 6, 6, shade(y, 0.25));
    // 풀린 실 끝
    p.line(7, 6, 9, 7, y);
  });
}

function bowl(): Pix {
  return canvas(12, 10, (p) => {
    const c = hex('#f4ecdc');
    // 국 (위에서 살짝 보이는 국물)
    p.oval(6, 5, 5.6, 1.6, hex('#e8a860'));
    p.set(4, 5, hex('#5aa04a'));
    p.set(7, 4, hex('#f8f0d8'));
    // 그릇
    for (let y = 5; y < 10; y++) {
      const half = Math.round(6 - (y - 5) * 0.8);
      p.rect(6 - half, y, half * 2, 1, y === 5 ? shade(c, 0.2) : c);
    }
    p.rect(2, 7, 8, 1, hex('#5a8ad0'));
    p.rect(9, 6, 1, 3, shade(c, -0.2));
  }, (p) => {
    // 김 (외곽선 없이 옅게)
    const s = hex('#ffffff');
    p.set(4, 2, s);
    p.set(5, 1, s);
    p.set(8, 2, s);
    p.set(7, 0, s);
  });
}

function cup(): Pix {
  return canvas(10, 8, (p) => {
    const c = hex('#ffffff');
    // 받침
    p.rect(0, 6, 10, 2, shade(c, -0.08));
    p.rect(0, 6, 10, 1, c);
    // 잔 · 손잡이
    p.rect(2, 2, 6, 4, c);
    p.rect(2, 2, 6, 1, hex('#c88a4a'));
    p.rect(7, 3, 1, 3, shade(c, -0.15));
    p.rect(8, 3, 2, 1, shade(c, -0.1));
    p.rect(9, 3, 1, 2, shade(c, -0.1));
    p.rect(3, 4, 4, 1, hex('#ff9ec7'));
  }, (p) => {
    p.set(4, 1, hex('#ffffff'));
    p.set(5, 0, hex('#ffffff'));
  });
}

function tray(): Pix {
  return canvas(18, 5, (p) => {
    box(p, 0, 1, 18, 4, WOOD);
    p.rect(1, 0, 16, 2, shade(WOOD, 0.2));
    p.rect(2, 1, 14, 1, shade(WOOD, 0.05));
    // 손잡이 구멍
    p.rect(1, 2, 2, 1, shade(WOOD, -0.5));
    p.rect(15, 2, 2, 1, shade(WOOD, -0.5));
  });
}

function umbrella(): Pix {
  const y = hex('#ffd84a');
  return canvas(18, 5, (p) => {
    // 접힌 노란 우산 (누운 모양): 꼭지 · 접힌 천 · 끈 · 굽은 손잡이
    p.set(0, 2, hex('#8a8a96'));
    for (let x = 1; x < 13; x++) {
      const h = x < 4 ? 1 : x < 8 ? 2 : 3;
      p.rect(x, 2 - Math.floor(h / 2), 1, h, x % 3 === 0 ? shade(y, -0.15) : y);
    }
    p.rect(4, 1, 8, 1, shade(y, 0.3));
    p.rect(9, 1, 1, 3, hex('#e8584a'));
    p.rect(13, 2, 2, 1, hex('#8a8a96'));
    p.rect(15, 2, 2, 1, hex('#7a4a2a'));
    p.rect(17, 2, 1, 3, hex('#7a4a2a'));
    p.set(16, 4, hex('#7a4a2a'));
  });
}

function bag(): Pix {
  const c = hex('#e8584a');
  return canvas(12, 13, (p) => {
    // 손잡이 고리
    p.rect(4, 0, 4, 1, shade(c, -0.3));
    p.set(4, 1, shade(c, -0.3));
    p.set(7, 1, shade(c, -0.3));
    // 몸 · 덮개 · 고리 단추
    box(p, 0, 2, 12, 11, c);
    p.rect(1, 2, 10, 5, shade(c, 0.12));
    p.rect(1, 6, 10, 1, shade(c, -0.25));
    p.rect(5, 6, 2, 2, hex('#ffd84a'));
    // 앞주머니
    p.rect(2, 9, 8, 3, shade(c, -0.1));
    p.rect(2, 9, 8, 1, shade(c, 0.1));
    // 반사띠
    p.set(1, 3, hex('#ffffff'));
  });
}

function cake(): Pix {
  return canvas(14, 11, (p) => {
    box(p, 0, 5, 14, 6, hex('#fff0f4'));
    p.rect(0, 5, 14, 2, hex('#f8a0b8'));
    for (let x = 1; x < 14; x += 3) p.set(x, 7, hex('#f8a0b8'));
    p.set(3, 9, hex('#e8414f'));
    p.set(10, 9, hex('#e8414f'));
    const cs = [hex('#8ad0ff'), hex('#ffd84a'), hex('#f06a8a')];
    for (let i = 0; i < 4; i++) {
      const x = 2 + i * 3;
      p.rect(x, 2, 1, 3, cs[i % 3]);
      p.set(x, 1, hex('#ff8a3a'));
      p.set(x, 0, hex('#ffd84a'));
    }
  });
}

/** 「하루 꽃」 화분: 토분 · 잎 · 노란 꽃 · 이름표 */
function pot(): Pix {
  const terra = hex('#c8704a');
  return canvas(12, 16, (p) => {
    p.rect(6, 3, 1, 7, hex('#4a9a4a'));
    p.ball(4, 7, 2, 1.2, hex('#5aaa4a'), true);
    p.ball(8.5, 6, 2, 1.2, hex('#4a9a4a'), true);
    // 꽃
    const pet = hex('#ffd84a');
    p.ball(6.5, 2.5, 2.6, 2.4, pet, true);
    p.set(6, 2, hex('#e8904a'));
    p.set(7, 2, hex('#e8904a'));
    // 이름표 막대
    p.rect(9, 7, 1, 3, hex('#d8c098'));
    p.rect(8, 6, 3, 2, WHITE);
    // 화분
    box(p, 1, 9, 10, 2, shade(terra, 0.1));
    for (let y = 11; y < 16; y++) p.rect(2 + (y > 13 ? 1 : 0), y, 8 - (y > 13 ? 2 : 0), 1, terra);
    p.rect(9, 11, 1, 4, shade(terra, -0.2));
    p.rect(2, 11, 1, 3, shade(terra, 0.15));
  });
}

function phone(): Pix {
  return canvas(6, 9, (p) => {
    box(p, 0, 0, 6, 9, hex('#e8e8f0'));
    p.rect(1, 1, 4, 6, hex('#3a4a6a'));
    p.rect(1, 1, 2, 2, hex('#8ab0e8'));
    p.set(2, 8, hex('#a8a8b8'));
    p.set(3, 8, hex('#a8a8b8'));
  });
}

function book(): Pix {
  const c = hex('#4a90e0');
  return canvas(11, 8, (p) => {
    // 책장 쪽 (흰 종이) · 표지
    p.rect(1, 5, 10, 3, hex('#f4ecdc'));
    for (let x = 2; x < 10; x += 2) p.set(x, 6, hex('#d8ccb4'));
    box(p, 0, 0, 11, 6, c);
    p.rect(0, 0, 2, 6, shade(c, -0.25));
    p.rect(4, 2, 5, 1, hex('#ffd84a'));
    p.set(6, 4, hex('#ffffff'));
  });
}

function basket(): Pix {
  const c = hex('#d8a860');
  return canvas(14, 12, (p) => {
    // 손잡이
    p.rect(3, 0, 8, 1, shade(c, -0.15));
    p.rect(2, 1, 1, 4, shade(c, -0.15));
    p.rect(11, 1, 1, 4, shade(c, -0.15));
    // 대파 · 사과
    p.rect(9, 0, 1, 5, hex('#6ab04a'));
    p.rect(9, 4, 1, 1, hex('#f4f0e0'));
    p.ball(5, 4, 1.8, 1.6, hex('#e8414f'));
    // 짠 바구니
    box(p, 0, 5, 14, 7, c);
    for (let y = 6; y < 11; y++) for (let x = (y % 2) + 1; x < 13; x += 2) p.set(x, y, shade(c, -0.14));
    p.rect(0, 5, 14, 1, shade(c, 0.25));
  });
}

function icecream(): Pix {
  const c = hex('#ff9ec7');
  return canvas(5, 11, (p) => {
    p.rect(0, 1, 5, 7, c);
    p.rect(1, 0, 3, 1, c);
    p.rect(0, 1, 5, 2, hex('#7a4a2a'));
    p.rect(1, 0, 3, 1, hex('#7a4a2a'));
    p.rect(1, 3, 1, 4, shade(c, 0.3));
    p.rect(4, 2, 1, 6, shade(c, -0.15));
    p.rect(2, 8, 1, 3, hex('#e8c890'));
  });
}

function paperstar(): Pix {
  const c = hex('#ffe07a');
  return canvas(5, 5, (p) => {
    p.set(2, 0, c);
    p.rect(0, 1, 5, 1, c);
    p.rect(1, 2, 3, 1, c);
    p.set(0, 3, c);
    p.set(4, 3, c);
    p.rect(1, 3, 3, 1, shade(c, -0.1));
    p.set(0, 4, shade(c, -0.15));
    p.set(4, 4, shade(c, -0.15));
    p.set(2, 1, shade(c, 0.5));
  });
}

function tape(): Pix {
  return canvas(8, 6, (p) => {
    p.ball(4, 3, 4, 3, TAPE, true);
    p.oval(4, 3, 1.6, 1, hex('#8a6a4a'));
    p.rect(6, 4, 2, 2, shade(TAPE, 0.2));
  });
}

function pen(): Pix {
  return canvas(10, 3, (p) => {
    p.bar(0, 0, 3, 3, INK);
    p.rect(3, 0, 6, 3, hex('#f0f0f0'));
    p.rect(3, 0, 6, 1, hex('#ffffff'));
    p.rect(3, 2, 6, 1, hex('#c8c8d0'));
    p.rect(5, 1, 2, 1, INK);
    p.set(9, 1, INK);
  });
}

/** 태엽 열쇠 (나비 날개 모양 손잡이) */
function key(): Pix {
  const g = hex('#e8c040');
  return canvas(9, 7, (p) => {
    p.ball(2, 2, 2, 2, g);
    p.ball(6, 2, 2, 2, g);
    p.set(2, 2, shade(g, -0.4));
    p.set(6, 2, shade(g, -0.4));
    p.rect(4, 2, 1, 5, shade(g, -0.15));
    p.rect(3, 4, 3, 1, g);
  });
}

function towel(): Pix {
  const c = hex('#8ad0e8');
  return canvas(12, 6, (p) => {
    box(p, 0, 0, 12, 6, c);
    p.rect(0, 2, 12, 1, WHITE);
    p.rect(0, 4, 12, 1, hex('#f4f0e0'));
    p.rect(1, 0, 10, 1, shade(c, 0.35));
  });
}

function flowers(): Pix {
  return canvas(11, 15, (p) => {
    // 포장지 (아래로 좁아지는 고깔)
    p.tri(0, 6, 10, 6, 5, 15, hex('#f4ecdc'));
    p.tri(5, 6, 10, 6, 5, 15, hex('#e8dcc4'));
    p.rect(3, 10, 4, 1, hex('#e8414f'));
    // 꽃송이
    const heads: [number, number, Color][] = [[2.5, 4, hex('#ff9ec7')], [7.5, 3.5, hex('#ffd84a')], [5, 2, hex('#f06a8a')], [5, 5.5, hex('#ffffff')], [8.5, 6, hex('#b08ae8')]];
    p.rect(1, 6, 9, 1, hex('#5aaa4a'));
    for (const [x, y, c] of heads) p.ball(x, y, 1.8, 1.7, c, true);
  });
}

function lunchbox(): Pix {
  const c = hex('#6ab08a');
  return canvas(11, 10, (p) => {
    // 졸라맨 주머니 위 (끈 · 매듭)
    p.rect(2, 0, 7, 3, shade(c, 0.08));
    p.rect(4, 2, 3, 1, shade(c, -0.25));
    p.rect(3, 0, 1, 2, hex('#ffffff'));
    p.rect(7, 0, 1, 2, hex('#ffffff'));
    // 도시락 모양 주머니 (체크무늬)
    box(p, 0, 3, 11, 7, c);
    for (let y = 4; y < 9; y++) for (let x = 0; x < 10; x++) if (x % 3 === 1 || y % 3 === 1) p.set(x, y, x % 3 === 1 && y % 3 === 1 ? shade(c, -0.15) : shade(c, 0.12));
  });
}

/** 반짇고리: 뚜껑 덮인 상자 · 바늘꽂이 · 실패 */
function sewing(): Pix {
  const c = hex('#c8584a');
  return canvas(13, 9, (p) => {
    // 실패 · 바늘꽂이
    p.rect(2, 0, 2, 3, hex('#4a90e0'));
    p.rect(2, 0, 2, 1, hex('#d8c098'));
    p.ball(9, 1.5, 2, 1.6, hex('#e8414f'), true);
    p.set(8, 0, hex('#c8c8d0'));
    // 상자
    box(p, 0, 3, 13, 6, c);
    p.rect(0, 3, 13, 2, shade(c, 0.12));
    p.rect(0, 5, 13, 1, shade(c, -0.25));
    p.rect(5, 6, 3, 1, hex('#e8c860'));
  });
}

/** 모르는 종류: 끈으로 묶은 작은 꾸러미 */
function parcel(): Pix {
  const c = hex('#d8b484');
  return canvas(10, 8, (p) => {
    box(p, 0, 1, 10, 7, c);
    p.rect(0, 1, 10, 1, shade(c, 0.25));
    p.rect(4, 1, 1, 7, hex('#a85a4a'));
    p.rect(0, 4, 10, 1, hex('#a85a4a'));
    p.set(3, 0, hex('#a85a4a'));
    p.set(5, 0, hex('#a85a4a'));
  });
}

/** 물건 그림 한 장 (아래 가운데가 놓이는 자리) */
export function itemSprite(kind: string): Pix {
  switch (kind) {
    case 'box':
    case 'boxTaped':
    case 'boxKeep':
      return closedBox(kind);
    case 'boxOpen': return openBox();
    case 'jar': return glassJar(10, 13, 30);
    case 'jarSmall': return glassJar(7, 8, 0);
    case 'letter': return letter();
    case 'card': return card();
    case 'photo': return photo();
    case 'doll': return doll();
    case 'toby':
    case 'bear':
    case 'fox':
    case 'cat':
      return plush(kind);
    case 'scarf': return scarf();
    case 'yarn': return yarn();
    case 'bowl': return bowl();
    case 'cup': return cup();
    case 'tray': return tray();
    case 'umbrella': return umbrella();
    case 'bag': return bag();
    case 'cake': return cake();
    case 'pot': return pot();
    case 'phone': return phone();
    case 'book': return book();
    case 'basket': return basket();
    case 'icecream': return icecream();
    case 'paperstar': return paperstar();
    case 'tape': return tape();
    case 'pen': return pen();
    case 'key': return key();
    case 'towel': return towel();
    case 'flowers': return flowers();
    case 'lunchbox': return lunchbox();
    case 'sewing': return sewing();
    default: return parcel();
  }
}
