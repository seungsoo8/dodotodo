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
import { Pix, hash2, hex, shade, type Color } from './paint.ts';
import type { PropSprite } from './houseProps.ts';
import { PERSON_SPRITE_H } from './sizes.ts';

const HT = 24;
const INK = hex('#2a1c24');
const PAPER = hex('#efe6d2');

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

/** 3면 상자 (윗면 d · 앞면 fh · 오른쪽 옆면 sw) */
function block3(p: Pix, x: number, y: number, w: number, d: number, fh: number, c: Color, sw = 3): void {
  const fw = w - sw;
  const tc = shade(c, 0.18);
  p.rect(x, y, fw, d, tc);
  p.rect(x, y, fw, 1, shade(tc, 0.3));
  p.rect(x, y + d, fw, fh, c);
  p.rect(x, y + d, fw, 1, shade(c, 0.12));
  for (let k = 0; k < sw; k++) p.rect(x + fw + k, y + 1 + k, 1, d + fh - 1 - k, shade(c, -0.34));
  p.rect(x, y + d + fh - 1, fw, 1, shade(c, -0.42));
}

// ───────────────────────── 하루 침대 (가로) ─────────────────────────

function haruBed(W: number, H: number, opt: string): PropSprite {
  const lift = 18;
  const Ht = H + lift;
  const empty = opt.includes('empty');
  const quilt = opt.includes('dawn') ? hex('#b8c4e0') : hex('#e8a8a0');
  const frame = hex('#9a6a42');
  const mat = hex('#ece4d8');
  const behind = new Pix(W, Ht);
  const front = new Pix(W, Ht);
  const g = Ht - 1;
  // 머리판 (왼쪽, 앞면이 보이는 판)
  block3(behind, 0, 0, 10, 4, Ht - 8, shade(frame, 0.05), 3);
  for (let y = 8; y < Ht - 10; y += 6) behind.rect(2, y, 5, 1, shade(frame, -0.18));
  // 매트리스 윗면 (위에서 본 면) · 시트
  behind.rect(8, lift - 4, W - 10, H - 12, mat);
  behind.rect(8, lift - 4, W - 10, 1, shade(mat, 0.3));
  for (let x = 12; x < W - 4; x += 7) behind.set(x, lift + 6, shade(mat, -0.06));
  // 베개 (머리 쪽)
  behind.oval(18, lift + 4, 8, 5, hex('#f4eef4'));
  behind.rect(11, lift + 8, 15, 1, hex('#d8d0dc'));
  if (empty) {
    // 걷어 낸 이불: 발치에 뭉쳐 있고, 베개에는 머리 자국
    behind.oval(18, lift + 4, 3, 2, hex('#e4dce8'));
    behind.oval(W - 16, lift + 8, 13, 8, quilt);
    behind.oval(W - 18, lift + 5, 9, 4, shade(quilt, 0.2));
    for (let x = W - 26; x < W - 6; x += 5) behind.set(x, lift + 10, shade(quilt, -0.15));
  } else {
    // 덮은 이불 (사람이 누우면 그 위로 사람 그림의 이불이 겹친다)
    behind.rect(26, lift - 2, W - 30, H - 16, shade(quilt, 0.06));
    for (let x = 30; x < W - 6; x += 6) behind.set(x, lift + 8, shade(quilt, -0.1));
  }
  // 앞판: 침대 틀 앞면 · 늘어진 이불 자락 · 다리 · 오른쪽 옆면
  const fy = Ht - 14;
  front.rect(6, fy, W - 9, 10, frame);
  front.rect(6, fy, W - 9, 1, shade(frame, 0.2));
  front.rect(W - 4, fy - 3, 3, 13, shade(frame, -0.34));
  front.rect(7, g - 3, 3, 3, shade(frame, -0.3));
  front.rect(W - 7, g - 3, 3, 3, shade(frame, -0.4));
  if (empty) front.oval(W - 18, fy - 1, 12, 4, quilt);
  if (opt.includes('yarn')) {
    // 이불 가장자리로 늘어진 노란 털실 한 가닥 (가방에 넣었던 목도리)
    for (let y = fy - 2; y < g - 1; y++) front.set(22 + Math.round(Math.sin(y / 2) * 1.5), y, hex('#f0c848'));
    front.oval(23, g - 1, 2, 1, hex('#f0c848'));
  }
  behind.outline(INK);
  front.outline(INK);
  const pix = new Pix(W, Ht).stamp(behind, 0, 0).stamp(front, 0, 0);
  return { pix, ox: -10, oy: -Ht, behind, front };
}

// ───────────────────────── 의자 + 책가방 · 필통 사람들 ─────────────────────────

function chairBag(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 22;
  const p = new Pix(W, Ht);
  const g = Ht - 1;
  const wd = hex('#8a6a4a');
  // 의자 등받이 · 앉는 판 · 다리
  p.rect(4, 2, 3, g - 2, shade(wd, -0.1));
  p.rect(W - 8, 2, 3, g - 2, shade(wd, -0.25));
  p.rect(4, 2, W - 9, 4, shade(wd, 0.15));
  block3(p, 2, g - 15, W - 4, 7, 4, wd, 3);
  p.rect(3, g - 4, 3, 4, shade(wd, -0.2));
  p.rect(W - 8, g - 4, 3, 4, shade(wd, -0.35));
  // 등받이에 걸린 낡은 책가방 (빨강이 바랜 분홍, 앞주머니 · 지퍼 · 이름표)
  const bag = hex('#c86a6a');
  const by = 5;
  p.rect(5, by, W - 10, 18, bag);
  p.rect(5, by, W - 10, 2, shade(bag, 0.2));
  p.rect(W - 7, by + 1, 2, 17, shade(bag, -0.3));
  p.rect(7, by + 8, W - 14, 9, shade(bag, -0.06));
  p.rect(7, by + 8, W - 14, 1, hex('#e8d8a0'));
  p.rect(9, by + 11, 6, 3, PAPER);
  // 어깨끈 (등받이 위로) · 껌 종이 반지
  p.rect(7, 0, 2, by + 1, shade(bag, -0.2));
  p.rect(W - 10, 0, 2, by + 1, shade(bag, -0.2));
  p.set(W - 10, 3, hex('#f0d860'));
  if (opt.includes('open')) {
    // 지퍼가 열려 속이 보인다 (공책 모서리 · 도시락 주머니)
    p.rect(7, by + 2, W - 14, 4, hex('#3a2a30'));
    p.rect(8, by + 1, 4, 4, hex('#e8e0c8'));
    p.rect(13, by + 2, 4, 3, hex('#7aa0d0'));
    p.set(W - 9, by + 7, hex('#f0d080'));
  } else p.rect(7, by + 3, W - 14, 1, hex('#e8d8a0'));
  return stand(p.outline(INK));
}

function pencilFolks(W: number, H: number, opt: string): PropSprite {
  const p = new Pix(W, H + 8);
  const g = p.h - 1;
  // 필통 (자석 필통, 뚜껑이 열린 채 누움)
  const pc = hex('#6a9ac8');
  block3(p, 1, g - 9, 22, 4, 5, pc, 3);
  p.rect(4, g - 7, 14, 1, shade(pc, 0.35));
  if (!opt.includes('out')) return flat(p.outline(INK));
  const face = (x: number, y: number) => {
    p.set(x, y, INK);
    p.set(x + 3, y, INK);
    p.set(x + 1, y + 2, hex('#c85a5a'));
    p.set(x + 2, y + 2, hex('#c85a5a'));
  };
  // 몽당연필: 짧고 통통, 웅크림
  const mx = 27;
  p.rect(mx, g - 14, 8, 13, hex('#f0c848'));
  p.rect(mx, g - 14, 8, 2, hex('#f4a0a8'));
  p.rect(mx, g - 12, 8, 1, hex('#c8c0b0'));
  p.rect(mx + 6, g - 12, 2, 11, shade(hex('#f0c848'), -0.25));
  p.tri(mx, g - 1, mx + 8, g - 1, mx + 4, g + 0, hex('#e8c8a0'));
  face(mx + 2, g - 8);
  // 지우개 (분홍 · 말랑)
  const ex = 40;
  p.rect(ex, g - 11, 13, 10, hex('#f4a8b8'));
  p.rect(ex, g - 11, 13, 2, hex('#f8c8d4'));
  p.rect(ex + 10, g - 10, 3, 9, hex('#d888a0'));
  p.rect(ex + 2, g - 6, 7, 3, hex('#e8f0f4'));
  face(ex + 3, g - 9);
  // 30cm 자 (꼿꼿하게 서 있다)
  const rx = 58;
  p.rect(rx, g - 26, 6, 25, hex('#e8e0b8'));
  p.rect(rx + 4, g - 25, 2, 24, shade(hex('#e8e0b8'), -0.2));
  for (let y = g - 24; y < g - 1; y += 3) p.rect(rx, y, y % 6 ? 1 : 3, 1, hex('#5a5048'));
  face(rx + 1, g - 20);
  return stand(p.outline(INK));
}

function hangerRack(W: number, H: number): PropSprite {
  const Ht = H + 44;
  const p = new Pix(W, Ht);
  const g = Ht - 1;
  const metal = hex('#a8a8b0');
  // 기둥 · 받침 · 가로대
  p.rect(2, 2, 2, g - 2, metal);
  p.rect(W - 4, 2, 2, g - 2, shade(metal, -0.25));
  p.rect(1, 2, W - 2, 2, shade(metal, 0.2));
  p.rect(0, g - 2, W, 2, shade(metal, -0.3));
  // 교복 (남색 재킷 · 흰 셔츠 깃)
  const nv = hex('#3a4a6a');
  p.rect(4, 6, 9, 26, nv);
  p.rect(5, 6, 4, 4, hex('#e8e4dc'));
  p.rect(11, 8, 2, 22, shade(nv, -0.25));
  p.set(8, 16, hex('#e0c060'));
  // 비닐 커버 검은 원피스 (반들반들한 사선)
  const bl = hex('#3a3238');
  p.rect(13, 5, 9, 34, bl);
  for (let y = 7; y < 37; y += 5) p.set(14 + ((y / 5) % 6), y, hex('#a0a4b8'));
  p.rect(13, 5, 1, 34, hex('#7a7a90'));
  return stand(p.outline(INK));
}

// ───────────────────────── 1칸 물건 ─────────────────────────

function boxMark(W: number, H: number): PropSprite {
  // 장난감 상자가 오래 있던 자리: 바닥보다 덜 바랜 네모 + 모서리 먼지
  const p = new Pix(W, H);
  const c = hex('#c89a68');
  p.rect(2, 6, W - 4, H - 10, c);
  p.rect(2, 6, W - 4, 1, hex('#8a6a4a'));
  p.rect(2, H - 5, W - 4, 1, hex('#8a6a4a'));
  p.rect(2, 6, 1, H - 10, hex('#8a6a4a'));
  p.rect(W - 3, 6, 1, H - 10, hex('#8a6a4a'));
  for (let i = 0; i < 9; i++) p.set(3 + Math.floor(hash2(i, 1, 41) * (W - 6)), 7 + Math.floor(hash2(i, 2, 41) * (H - 13)), hex('#b0a090'));
  return flat(p);
}

function wasteBin(W: number): PropSprite {
  const Ht = 22;
  const p = new Pix(W, Ht);
  const g = Ht - 1;
  const c = hex('#7a9a8a');
  for (let y = 5; y < g; y++) {
    const inset = Math.round(((y - 5) / (g - 5)) * 2);
    p.rect(4 + inset, y, W - 8 - inset * 2, 1, shade(c, -((y - 5) / (g - 5)) * 0.2));
  }
  p.oval(W / 2, 5, (W - 8) / 2, 3, shade(c, -0.45));
  // 구긴 종이 (넘쳐 나온 시험지)
  p.oval(W / 2 - 3, 3, 4, 3, PAPER);
  p.oval(W / 2 + 4, 4, 3, 2, shade(PAPER, -0.06));
  p.set(W / 2 - 4, 2, hex('#c85a5a'));
  p.rect(W - 6, 6, 2, g - 6, shade(c, -0.35));
  return stand(p.outline(INK));
}

function sockOne(W: number, H: number, opt: string): PropSprite {
  const p = new Pix(W, H);
  const c = hex('#e8c0d0');
  // 별무늬 외짝 양말 (발목 · 발꿈치 · 발끝), 안에 방울
  p.rect(5, 6, 6, 9, c);
  p.rect(5, 6, 6, 2, hex('#f4e0e8'));
  p.oval(12, 15, 7, 3.5, c);
  p.oval(16, 15, 3, 3, shade(c, -0.1));
  p.set(7, 10, hex('#f0c848'));
  p.set(12, 15, hex('#f0c848'));
  p.set(9, 13, hex('#f0c848'));
  if (opt.includes('pair')) {
    p.rect(9, 3, 6, 9, shade(c, -0.08));
    p.oval(16, 12, 6, 3, shade(c, -0.08));
  }
  return stand(p.outline(INK));
}

function dressBag(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const bl = hex('#3a3238');
  // 개켜지지 않고 미끄러져 내려온 비닐 커버 원피스 (옷걸이째)
  p.rect(9, 2, 6, 1, hex('#a8a8b0'));
  p.line(12, 2, 12, 0, hex('#a8a8b0'));
  p.tri(5, 4, 19, 4, 21, 20, bl);
  p.tri(5, 4, 3, 20, 21, 20, bl);
  for (let y = 6; y < 20; y += 4) p.set(6 + (y % 9), y, hex('#a0a4b8'));
  p.rect(4, 19, 17, 2, shade(bl, -0.2));
  return stand(p.outline(INK));
}

function dustGhost(W: number, H: number): PropSprite {
  // 책장 아래칸에서 내려놓은 인형 자리: 먼지 위에 동그랗게 비어 있는 자국 둘
  const p = new Pix(W, H);
  const dust = hex('#b8b0a4');
  for (let y = 6; y < H - 3; y++) for (let x = 2; x < W - 2; x++) if (hash2(x, y, 77) < 0.45) p.set(x, y, dust);
  p.oval(8, 13, 4, 3, -1);
  p.oval(16, 14, 3, 3, -1);
  for (let a = 0; a < 12; a++) {
    p.set(8 + Math.round(Math.cos(a / 2) * 5), 13 + Math.round(Math.sin(a / 2) * 3.5), shade(dust, -0.2));
    p.set(16 + Math.round(Math.cos(a / 2) * 4), 14 + Math.round(Math.sin(a / 2) * 3.5), shade(dust, -0.2));
  }
  return flat(p);
}

function mugRings(W: number, H: number): PropSprite {
  // 머그잔 동그란 자국 둘 (하나는 진하고 하나는 흐리다)
  const p = new Pix(W, H);
  const ring = (cx: number, cy: number, r: number, c: Color) => {
    for (let a = 0; a < 28; a++) p.set(cx + Math.round(Math.cos((a / 28) * Math.PI * 2) * r), cy + Math.round(Math.sin((a / 28) * Math.PI * 2) * r * 0.7), c);
  };
  ring(8, 12, 5, hex('#7a5034'));
  ring(8, 12, 4, hex('#8a6040'));
  ring(16, 16, 5, hex('#a07a58'));
  p.set(12, 9, hex('#7a5034'));
  return flat(p);
}

function breadTie(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  // 빵 봉지 끈 집게 (파란 네모 집게) + 구겨진 빵 봉지 귀퉁이
  p.tri(3, 20, 14, 12, 18, 21, hex('#e8dcc0'));
  p.set(9, 17, hex('#c8a060'));
  p.rect(11, 11, 8, 6, hex('#5a8ad0'));
  p.rect(11, 11, 8, 1, hex('#8ab0e8'));
  p.rect(14, 13, 2, 2, -1);
  p.rect(18, 12, 1, 5, hex('#3a6ab0'));
  return stand(p.outline(INK));
}

function coat(W: number, H: number): PropSprite {
  const Ht = H + 4;
  const p = new Pix(W, Ht);
  const c = hex('#c87a48');
  // 의자 등받이에 걸쳐 둔 겨울 외투 (주머니가 불룩)
  p.rect(3, 2, W - 6, Ht - 6, c);
  p.rect(3, 2, W - 6, 3, shade(c, 0.2));
  p.rect(W - 6, 3, 3, Ht - 7, shade(c, -0.3));
  p.rect(10, 4, 2, Ht - 9, shade(c, -0.15));
  p.rect(5, Ht - 12, 6, 5, shade(c, -0.1));
  p.set(7, Ht - 13, hex('#f0d860'));
  p.rect(4, Ht - 4, W - 8, 2, shade(c, -0.25));
  return stand(p.outline(INK));
}

function crayonTin(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const tin = hex('#d8b048');
  block3(p, 3, 9, 18, 5, 9, tin, 3);
  // 크레용들 (짧아진 갈색 하나)
  const cols = ['#c84a4a', '#e8a040', '#f0d860', '#5a9a5a', '#4a7ac8', '#8a5a3a'];
  cols.forEach((c, i) => p.rect(5 + i * 2.5, i === 5 ? 7 : 4 + (i % 2), 2, i === 5 ? 3 : 6, hex(c)));
  p.rect(5, 15, 10, 2, hex('#f4ecd8'));
  return stand(p.outline(INK));
}

function stickerBag(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const bag = hex('#e4ecf0');
  // 투명 봉지 속 야광 별 스티커 (연두빛)
  p.rect(5, 6, 14, 14, bag);
  p.rect(5, 6, 14, 2, hex('#c84a6a'));
  const star = (x: number, y: number) => {
    p.set(x, y - 1, hex('#c8f0a0'));
    p.rect(x - 1, y, 3, 1, hex('#c8f0a0'));
    p.set(x - 1, y + 1, hex('#a8e080'));
    p.set(x + 1, y + 1, hex('#a8e080'));
  };
  star(8, 11);
  star(14, 10);
  star(11, 15);
  star(16, 16);
  p.rect(17, 7, 2, 13, shade(bag, -0.2));
  return stand(p.outline(INK));
}

function blockBox(W: number, H: number): PropSprite {
  const Ht = H + 4;
  const p = new Pix(W, Ht);
  // 뚜껑 없는 블록 상자 (글자 블록이 수북)
  const c = hex('#8ab0d8');
  block3(p, 1, 8, W - 2, 5, 14, c, 3);
  const cols = [hex('#e86a5a'), hex('#f0c848'), hex('#6ab070'), hex('#f4ecd8')];
  for (let i = 0; i < 5; i++) {
    const x = 3 + i * 4;
    const y = 3 + Math.round(hash2(i, 3, 55) * 4);
    p.rect(x, y, 5, 5, cols[i % cols.length]);
    p.rect(x, y, 5, 1, shade(cols[i % cols.length], 0.3));
  }
  return stand(p.outline(INK));
}

function zipTab(W: number, H: number, opt: string): PropSprite {
  const p = new Pix(W, H);
  // 가방에서 늘어진 지퍼 고리 (금속 손잡이 · 낡은 끈) 와 루루 밧줄
  const metal = hex('#c8c8d0');
  p.rect(10, 2, 4, 8, metal);
  p.rect(11, 4, 2, 4, -1);
  p.rect(13, 2, 1, 8, shade(metal, -0.3));
  p.rect(9, 10, 6, 3, hex('#e86a6a'));
  const rope = hex('#d8b070');
  if (opt.includes('open')) {
    // 일을 마친 밧줄이 바닥에 둘둘
    p.oval(12, 18, 7, 3, rope);
    p.oval(12, 18, 4, 1.5, shade(rope, -0.3));
  } else {
    for (let y = 13; y < 21; y++) p.set(12 + Math.round(Math.sin(y / 1.6)), y, rope);
    p.oval(12, 21, 5, 2, rope);
  }
  return stand(p.outline(INK));
}

function crayonScrap(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  // 찢어진 도화지 조각 (삐죽한 가장자리) 에 크레용 줄
  p.tri(4, 9, 19, 6, 20, 19, hex('#f4ecd8'));
  p.tri(4, 9, 3, 18, 20, 19, hex('#f4ecd8'));
  for (let x = 5; x < 19; x++) p.set(x, 12 + Math.round(Math.sin(x / 2) * 1.5), hex('#e86a5a'));
  for (let x = 7; x < 17; x += 2) p.set(x, 16, hex('#4a7ac8'));
  p.rect(13, 9, 3, 2, hex('#f0c848'));
  p.rect(3, 18, 18, 1, hex('#c8b898'));
  return stand(p.outline(INK));
}

function glowStar(W: number, H: number): PropSprite {
  // 도화지 위 야광 별 스티커 자리 (연둣빛 별 + 연필 동그라미)
  const p = new Pix(W, H);
  const c = hex('#c8f0a0');
  for (let a = 0; a < 20; a++) p.set(12 + Math.round(Math.cos((a / 20) * Math.PI * 2) * 7), 14 + Math.round(Math.sin((a / 20) * Math.PI * 2) * 4), hex('#8a8478'));
  p.tri(12, 8, 9, 16, 15, 16, c);
  p.tri(7, 12, 17, 12, 12, 17, c);
  p.set(12, 12, hex('#f0fcd8'));
  return flat(p);
}

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
