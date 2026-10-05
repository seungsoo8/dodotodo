/**
 * 이삿날 공통 소품 라이브러리 (REDESIGN §8 이삿짐 묶음 + 바닥 잔 소품). 사람 크기 방(24px 칸) 기준, 3면 규칙:
 * 윗면 가장 밝게 · 앞면 중간 · 오른쪽 옆면 가장 어둡게, 바닥에 닿는 줄은 진한 접지 선. 순검정 · 순흰색 없음.
 * 약속은 houseProps.ts 와 같다: 칸 자리의 발 (x*24, (y+h)*24) 에서 그림 왼쪽 위까지 (ox, oy). 목록 · 크기는 scratchpad PROPS2.md.
 *  - flat (wall: true): 바닥 · 벽에 구워지는 데칼 (테이프 조각 · 동전 · 액자 자국 …). 인물을 가리지 않는다
 *  - 나머지는 발 정렬로 인물과 앞뒤를 가리고, 사람 키(40px)보다 높으면 윗부분(top)이 나뉜다
 */
import { textH, textWidth, glyph } from './glyphs.ts';
import type { PropSprite } from './houseProps.ts';
import { Pix, hash2, hex, mix, shade, type Color } from './paint.ts';
import { PERSON_SPRITE_H } from './sizes.ts';

const HT = 24;
const PERSON_H = PERSON_SPRITE_H;

/** 종류 · 기본 칸 크기 · 납작한가 */
export const MOVE_KINDS: Record<string, { w: number; h: number; flat: boolean }> = {
  cartonS: { w: 1, h: 1, flat: false },
  cartonM: { w: 1, h: 1, flat: false },
  cartonL: { w: 2, h: 1, flat: false },
  cartonOpen: { w: 1, h: 1, flat: false },
  cartonHalf: { w: 1, h: 1, flat: false },
  rolledRug: { w: 2, h: 1, flat: false },
  sofaWrap: { w: 3, h: 1, flat: false },
  bookTied: { w: 1, h: 1, flat: false },
  bubbleWrap: { w: 1, h: 1, flat: false },
  dishWrap: { w: 1, h: 1, flat: false },
  curtainPile: { w: 1, h: 1, flat: false },
  trashBag: { w: 1, h: 1, flat: false },
  grandClock: { w: 1, h: 1, flat: false },
  tapeBit: { w: 1, h: 1, flat: true },
  markerPen: { w: 1, h: 1, flat: true },
  frameGhost: { w: 1, h: 1, flat: true },
  dragMarks: { w: 2, h: 1, flat: true },
  newsSheet: { w: 1, h: 1, flat: true },
  slipper: { w: 1, h: 1, flat: true },
  coin: { w: 1, h: 1, flat: true },
  button: { w: 1, h: 1, flat: true },
  hairBand: { w: 1, h: 1, flat: true },
};

/** 움직이는 부분 (render 가 매 프레임 덧그린다): 그림 안 좌표 */
export interface LiveSpec {
  /** 추: 매단 점 (x, y) · 길이 · 추 반지름 */
  pendulum?: { x: number; y: number; len: number; r: number };
  /** 시계판: 가운데 · 반지름 (바늘은 장의 시각) */
  face?: { x: number; y: number; r: number };
}
export const MOVE_LIVE: Record<string, LiveSpec> = {
  grandClock: { pendulum: { x: 12, y: 30, len: 16, r: 3 }, face: { x: 12, y: 15, r: 6 } },
};

// ───────────────────────── 팔레트 ─────────────────────────
const INK = hex('#2a1c24');
const CARD = hex('#c89a64');
const CARD_D = hex('#a87a4a');
const TAPE = hex('#e2c890');
const MARKER = hex('#3a2c3a');
const RED = hex('#b83a34');
const PAPER = hex('#e8e2d2');
const NEWS = hex('#d8d2c2');
const WOOD = hex('#8a5432');
const BRASS = hex('#d8b050');

/** 3면 덩어리 (윗면 깊이 d · 앞면 h · 오른쪽 옆면 sw) */
function block3(p: Pix, x: number, y: number, w: number, d: number, h: number, c: Color, sw = 3, topC?: Color): void {
  const fw = w - sw;
  const tc = topC ?? shade(c, 0.18);
  const sc = shade(c, -0.34);
  p.rect(x, y, fw, d, tc);
  p.rect(x, y, fw, 1, shade(tc, 0.28));
  p.rect(x, y + d, fw, h, c);
  p.rect(x, y + d, fw, 1, shade(c, 0.12));
  for (let k = 0; k < sw; k++) p.rect(x + fw + k, y + 1 + k, 1, d + h - 1 - k, sc);
  p.rect(x + fw, y + d + h - 1, sw, 1, shade(sc, -0.2));
  p.rect(x, y + d + h - 1, fw, 1, shade(c, -0.42));
}

/** 키 넘는 부분을 top 으로 (발 줄 = 그림 맨 아래) */
function stand(pix: Pix, extra: Partial<PropSprite> = {}): PropSprite {
  const s: PropSprite = { pix, ox: 0, oy: -pix.h, ...extra };
  const split = pix.h - PERSON_H;
  if (split >= 6) {
    const top = new Pix(pix.w, split);
    for (let y = 0; y < split; y++) for (let x = 0; x < pix.w; x++) top.set(x, y, pix.get(x, y));
    s.top = top;
    s.topSplitY = split;
  }
  return s;
}
const flat = (pix: Pix, oy = -pix.h): PropSprite => ({ pix, ox: 0, oy, wall: true });

/** 상자 이름: 그릴 수 있는 글자가 든 옵션 첫 것 (없으면 기본) */
function labelOf(opt: string, dflt: string): string {
  const parts = opt.split(',').map((s) => s.trim()).filter((s) => s && [...s].some((c) => glyph(c)));
  return parts[0] ?? dflt;
}

/** 테이프 상자: 앞면 높이 fh, 매직 이름 (깨짐주의는 붉게) */
function carton(W: number, fh: number, d: number, opt: string, dflt: string, seed: number): Pix {
  const Ht = fh + d + 1;
  const p = new Pix(W, Ht);
  const bw = W - 2;
  const c = shade(CARD, (hash2(seed, fh, 3) - 0.5) * 0.08);
  block3(p, 1, 0, bw, d, fh, c, Math.max(3, Math.round(bw / 7)));
  // 윗면 가운데 테이프 · 앞면으로 흘러내린 테이프
  const tx = Math.floor((bw - 3) / 2) - 1;
  p.rect(tx, 0, 5, d, TAPE);
  p.rect(tx, d, 5, Math.min(6, fh - 4), shade(TAPE, -0.08));
  p.rect(tx, 0, 1, d, shade(TAPE, 0.2));
  // 덮개 이음매
  p.rect(2, Math.floor(d / 2), bw - 4, 1, shade(c, 0.05));
  // 이름
  const label = labelOf(opt, dflt);
  const fw = bw - Math.max(3, Math.round(bw / 7));
  const gap = textWidth(label) > fw - 4 ? 0 : 1;
  const tw = textWidth(label, gap);
  if (fh >= 13 && tw <= fw + 2) textH(p, label, 1 + Math.max(1, Math.floor((fw - tw) / 2)), d + Math.max(3, fh - 12), label.includes('깨') ? RED : MARKER, gap);
  else for (let x = 4; x < fw - 2; x++) if (hash2(x, seed, 5) < 0.6) p.set(x, d + Math.floor(fh / 2), MARKER);
  return p.outline(INK);
}

function cartonOpen(W: number, half: boolean): PropSprite {
  const fh = 18;
  const d = 9;
  const Ht = fh + d + 8;
  const p = new Pix(W, Ht);
  const y0 = 8;
  const bw = W - 4;
  // 뒤 덮개 (위로 젖혀짐) · 옆 덮개
  p.rect(4, 1, bw - 4, y0, shade(CARD, 0.06));
  p.rect(4, 1, bw - 4, 1, shade(CARD, 0.24));
  p.tri(1, y0 + 2, 4, y0, 2, 2, CARD_D);
  p.tri(W - 2, y0 + 2, W - 6, y0, W - 3, 3, CARD_D);
  // 안 (어두운 속) · 앞면
  block3(p, 2, y0, bw, d, fh, CARD, 3, shade(CARD, -0.55));
  p.rect(3, y0 + 1, bw - 6, d - 2, shade(CARD, -0.62));
  if (half) {
    // 반쯤 찬 상자: 책 등 · 수건 · 신문지 뭉치가 삐죽
    p.rect(5, y0 - 2, 6, d + 1, hex('#3e5a8a'));
    p.rect(5, y0 - 2, 6, 1, shade(hex('#3e5a8a'), 0.3));
    p.rect(12, y0 + 1, 5, d - 2, hex('#e8dcc0'));
    p.oval(W - 9, y0 + 3, 4, 3, NEWS);
    p.set(W - 10, y0 + 2, MARKER);
    p.set(W - 8, y0 + 4, MARKER);
  }
  // 앞 덮개 (아래로 늘어짐)
  p.rect(3, y0 + d, bw - 6, 3, shade(CARD, 0.1));
  p.rect(Math.floor(W / 2) - 3, y0 + d + 3, 5, 5, shade(TAPE, -0.1));
  return stand(p.outline(INK));
}

function rolledRug(W: number): PropSprite {
  const Ht = 16;
  const p = new Pix(W, Ht);
  const c = hex('#a8504a');
  // 눕힌 원기둥: 위가 밝고 아래가 어둡다, 오른쪽 끝은 말린 단면
  for (let y = 2; y < Ht - 1; y++) {
    const t = (y - 2) / (Ht - 3);
    p.rect(2, y, W - 8, 1, shade(c, 0.22 - t * 0.5));
  }
  for (let x = 4; x < W - 8; x += 4) p.rect(x, 4, 2, 1, hex('#e0c070'));
  p.oval(W - 6, Ht / 2 + 0.5, 4, 6.5, shade(c, -0.1));
  p.oval(W - 6, Ht / 2 + 0.5, 2.5, 4.5, shade(c, 0.12));
  p.oval(W - 6, Ht / 2 + 0.5, 1, 2, shade(c, -0.3));
  // 끈 두 줄
  for (const x of [Math.floor(W * 0.28), Math.floor(W * 0.62)]) {
    p.rect(x, 1, 2, Ht - 2, hex('#e8dcb0'));
    p.rect(x + 1, 1, 1, Ht - 2, hex('#c8b888'));
  }
  // 술 (왼쪽 끝)
  for (let y = 4; y < Ht - 3; y += 2) p.rect(0, y, 2, 1, hex('#e0c8a0'));
  return stand(p.outline(INK));
}

function sofaWrap(W: number): PropSprite {
  const Ht = 36;
  const p = new Pix(W, Ht);
  const c = hex('#7a8a6a');
  const g = Ht - 1;
  // 등받이 · 앉는 면 · 팔걸이 (3면)
  block3(p, 2, 0, W - 4, 4, 14, shade(c, -0.08), 4);
  block3(p, 3, 14, W - 6, 8, 12, c, 4);
  block3(p, 0, 9, 8, 6, 20, shade(c, -0.05), 2);
  block3(p, W - 9, 9, 9, 6, 20, shade(c, -0.12), 3);
  p.rect(4, g - 2, 3, 2, WOOD);
  p.rect(W - 8, g - 2, 3, 2, shade(WOOD, -0.3));
  // 비닐: 반짝이는 대각선 줄 · 접힌 주름 · 테이프
  const shine = hex('#f2f6fa');
  for (let i = 0; i < 4; i++) {
    const x0 = 6 + i * Math.floor((W - 12) / 4);
    for (let k = 0; k < 9; k++) p.set(x0 + k, 3 + k * 2, mix(shine, c, k / 14));
  }
  for (let x = 2; x < W - 3; x += 7) p.rect(x, 22, 1, 6, shade(c, 0.28));
  p.rect(1, g - 6, W - 3, 1, shade(c, 0.35));
  p.rect(Math.floor(W / 2) - 2, 12, 5, 4, TAPE);
  return stand(p.outline(INK));
}

function bookTied(W: number, opt: string): PropSprite {
  const n = Math.max(1, Math.min(3, parseInt(opt, 10) || 2));
  const per = 6;
  const Ht = 6 + n * per + 2;
  const p = new Pix(W, Ht);
  const cols = [hex('#b84a40'), hex('#3e5a8a'), hex('#d8a840'), hex('#6a8a5a'), hex('#8a5a8a'), hex('#c87a48')];
  for (let i = 0; i < n * 2; i++) {
    const y = Ht - 1 - (i + 1) * 3 - 3;
    const off = Math.round((hash2(i, n, 9) - 0.5) * 4);
    block3(p, 2 + off, y, W - 5, 2, 3, cols[i % cols.length], 2, PAPER);
  }
  // 끈 열십자
  const cx = Math.floor(W / 2) - 1;
  p.rect(cx, 0, 2, Ht - 1, hex('#e8dcb0'));
  p.rect(2, Ht - 6, W - 5, 1, hex('#e8dcb0'));
  p.rect(cx - 2, 0, 6, 2, hex('#e8dcb0'));
  return stand(p.outline(INK));
}

function bubbleWrap(W: number): PropSprite {
  const Ht = 26;
  const p = new Pix(W, Ht);
  const c = hex('#c8dce4');
  // 세운 두루마리: 위 둥근 단면 · 몸통
  p.rect(4, 5, W - 8, Ht - 7, c);
  p.rect(W - 7, 5, 3, Ht - 7, shade(c, -0.22));
  p.rect(4, 5, 2, Ht - 7, shade(c, 0.3));
  for (let y = 8; y < Ht - 3; y += 3) for (let x = 6 + (y % 2) * 1; x < W - 7; x += 3) p.set(x, y, hex('#eef4f6'));
  p.oval(W / 2, 5, W / 2 - 4, 3.5, shade(c, 0.18));
  p.oval(W / 2, 5, 2.5, 1.6, shade(c, -0.25));
  // 풀린 자락
  p.rect(W - 6, Ht - 6, 5, 4, shade(c, 0.1));
  return stand(p.outline(INK));
}

function dishWrap(W: number): PropSprite {
  const Ht = 18;
  const p = new Pix(W, Ht);
  // 신문지에 싼 그릇 뭉치 셋 (쌓임)
  const ball = (cx: number, cy: number, r: number, s: number) => {
    p.ball(cx, cy, r, r * 0.8, NEWS, true);
    for (let i = 0; i < 5; i++) p.rect(cx - r + 2 + Math.floor(hash2(i, s, 3) * (r * 2 - 4)), cy - 2 + Math.floor(hash2(s, i, 4) * 4), 3, 1, shade(NEWS, -0.35));
    p.line(cx - 2, cy - r * 0.6, cx + 1, cy - 1, shade(NEWS, -0.2));
  };
  ball(7, Ht - 6, 5.5, 1);
  ball(W - 8, Ht - 6, 5.5, 2);
  ball(W / 2, Ht - 11, 5, 3);
  p.rect(2, Ht - 2, W - 4, 1, shade(NEWS, -0.4));
  return stand(p.outline(INK));
}

function curtainPile(W: number): PropSprite {
  const Ht = 14;
  const p = new Pix(W, Ht);
  const c = hex('#d8a0a8');
  // 개켜 놓은 커튼 (주름 층)
  for (let i = 0; i < 3; i++) {
    const y = Ht - 4 - i * 4;
    block3(p, 2 + i, y - 1, W - 5 - i * 2, 2, 3, shade(c, -i * 0.04), 2);
    for (let x = 4 + i; x < W - 5 - i; x += 4) p.set(x, y + 2, shade(c, -0.22));
  }
  // 커튼 고리 몇 개
  for (let i = 0; i < 3; i++) p.oval(5 + i * 5, 2, 1.5, 1.5, BRASS);
  return stand(p.outline(INK));
}

function trashBag(W: number): PropSprite {
  const Ht = 24;
  const p = new Pix(W, Ht);
  const c = hex('#3a3e48');
  p.ball(W / 2, Ht - 9, W / 2 - 2, 9, c, false);
  p.tri(W / 2 - 4, 6, W / 2 + 4, 6, W / 2, 10, shade(c, 0.1));
  p.tri(W / 2 - 5, 1, W / 2, 6, W / 2 - 1, 7, shade(c, 0.05));
  p.tri(W / 2 + 5, 2, W / 2, 6, W / 2 + 1, 7, shade(c, -0.05));
  p.line(W / 2 - 6, Ht - 12, W / 2 - 2, Ht - 6, shade(c, 0.4));
  return stand(p.outline(INK));
}

function grandClock(W: number): PropSprite {
  // 괘종시계: 지붕 · 시계판 · 추 창 · 받침 (사람보다 큼). 추와 바늘은 render 가 움직인다 (MOVE_LIVE)
  const Ht = 64;
  const p = new Pix(W, Ht);
  const c = WOOD;
  block3(p, 2, 4, W - 4, 3, Ht - 8, c, 3);
  p.tri(1, 6, W - 1, 6, W / 2, 0, shade(c, -0.15));
  p.rect(2, 6, W - 4, 1, shade(c, 0.3));
  // 시계판
  const f = MOVE_LIVE.grandClock.face!;
  p.oval(f.x, f.y, f.r + 1.5, f.r + 1.5, BRASS);
  p.oval(f.x, f.y, f.r, f.r, hex('#efe4c8'));
  for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) p.set(f.x + dx * (f.r - 1), f.y + dy * (f.r - 1), INK);
  // 추 창 (유리 · 안은 어둡게)
  const pd = MOVE_LIVE.grandClock.pendulum!;
  p.rect(5, pd.y - 2, W - 12, pd.len + 8, hex('#3a2a24'));
  p.rect(5, pd.y - 2, W - 12, 1, shade(hex('#3a2a24'), 0.25));
  p.rect(6, pd.y, 1, pd.len + 4, hex('#5a4a44'));
  // 받침 · 다리
  p.rect(1, Ht - 6, W - 2, 5, shade(c, -0.1));
  p.rect(1, Ht - 6, W - 2, 1, shade(c, 0.2));
  p.rect(2, Ht - 1, 3, 1, shade(c, -0.4));
  p.rect(W - 5, Ht - 1, 3, 1, shade(c, -0.4));
  return stand(p.outline(INK));
}

// ───────────────────────── 납작한 것 (바닥 · 벽 데칼) ─────────────────────────

function tapeBit(W: number, H: number, opt: string): PropSprite {
  const p = new Pix(W, H);
  const s = hash2(opt.length, 3, 7);
  // 바닥에 붙은 테이프 조각 (비스듬, 끝이 찢김) + 동그랗게 말린 한 조각
  for (let i = 0; i < 9; i++) {
    const x = 5 + i;
    const y = 12 + Math.round(i * (s - 0.3) * 0.6);
    p.rect(x, y, 1, 3, i === 8 || i === 0 ? shade(TAPE, -0.1) : TAPE);
    p.set(x, y, shade(TAPE, 0.22));
  }
  p.set(13, 11, TAPE);
  p.oval(17, 17, 2.5, 1.5, shade(TAPE, -0.05));
  p.set(17, 17, shade(TAPE, -0.3));
  return flat(p);
}

function markerPen(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  // 굴러다니는 매직펜 (비스듬히 누움) · 뚜껑은 따로
  for (let i = 0; i < 12; i++) {
    const x = 5 + i;
    const y = 15 - Math.floor(i / 3);
    p.rect(x, y, 1, 3, i < 2 ? INK : i < 9 ? hex('#ece6d6') : hex('#2a2a3a'));
    p.set(x, y, i < 9 && i >= 2 ? hex('#fbf6ea') : shade(INK, 0.2));
  }
  p.rect(9, 14, 3, 2, MARKER);
  p.rect(19, 16, 3, 2, INK);
  p.set(19, 16, shade(INK, 0.4));
  p.rect(5, 18, 13, 1, shade(hex('#2a1c24'), 0.3));
  return flat(p);
}

function frameGhost(W: number, H: number, opt: string): PropSprite {
  // 떼어 낸 액자 자국: 벽지가 주변보다 밝은 네모 (lighten) · 둘레 먼지 · 못 하나와 못 그늘
  const wide = opt.includes('wide');
  const tall = opt.includes('tall');
  const small = opt.includes('small');
  const fw = Math.min(W - 2, wide ? W - 4 : small ? 10 : 16);
  const fh = Math.min(H - 4, tall ? 20 : small ? 9 : 14);
  const x0 = Math.floor((W - fw) / 2);
  const y0 = Math.floor((H - fh) / 2) + 2;
  const light = new Pix(W, H);
  light.rect(x0, y0, fw, fh, 0x000060);
  const p = new Pix(W, H);
  const dust = hex('#8a7a66');
  for (let x = x0; x < x0 + fw; x++) {
    if (hash2(x, y0, 31) < 0.7) p.set(x, y0 - 1, dust);
    if (hash2(x, y0, 32) < 0.5) p.set(x, y0 + fh, dust);
  }
  for (let y = y0; y < y0 + fh; y++) {
    if (hash2(x0, y, 33) < 0.55) p.set(x0 - 1, y, dust);
    if (hash2(x0, y, 34) < 0.55) p.set(x0 + fw, y, dust);
  }
  const nx = Math.floor(W / 2);
  p.set(nx, y0 - 4, hex('#b0a8a0'));
  p.set(nx, y0 - 3, hex('#5a5048'));
  p.set(nx + 1, y0 - 3, shade(dust, -0.2));
  return { pix: p, ox: 0, oy: -H, wall: true, lighten: { pix: light, ox: 0, oy: -H } };
}

function dragMarks(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  // 상자를 끌고 간 자국: 두 줄 긁힘 (바닥보다 어두운 얇은 선, 끝이 흐려짐)
  const c = hex('#6a4a34');
  for (const y0 of [8, 15]) for (let x = 2; x < W - 3; x++) if (hash2(x, y0, 41) < 0.82 - (x / W) * 0.5) p.set(x, y0 + Math.round(Math.sin(x * 0.12) * 0.6), x % 9 < 6 ? c : shade(c, 0.15));
  return flat(p);
}

function newsSheet(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  // 바닥의 신문지 한 장 (살짝 접힘, 글 줄)
  p.tri(2, 9, W - 3, 6, W - 5, H - 3, NEWS);
  p.tri(2, 9, W - 5, H - 3, 4, H - 4, shade(NEWS, -0.06));
  for (let y = 10; y < H - 5; y += 2) for (let x = 5; x < W - 7; x++) if (hash2(x, y, 51) < 0.55) p.set(x, y, shade(NEWS, -0.3));
  p.rect(6, 8, 7, 2, shade(NEWS, -0.45));
  p.line(W - 3, 6, W - 5, H - 3, shade(NEWS, -0.18));
  return flat(p);
}

function slipper(W: number, H: number, opt: string): PropSprite {
  const p = new Pix(W, H);
  const c = opt.includes('blue') ? hex('#6a8ab8') : hex('#e898a8');
  // 슬리퍼 한 짝 (위에서 비스듬히): 바닥창 · 발등 띠
  p.oval(12, 15, 8, 4, shade(c, -0.25));
  p.oval(12, 14, 7.5, 3.5, c);
  p.oval(9, 13, 4, 3.5, shade(c, 0.22));
  p.rect(7, 11, 6, 1, shade(c, 0.4));
  p.oval(15, 14, 2, 1.5, shade(c, -0.08));
  p.rect(5, 18, 14, 1, shade(c, -0.45));
  return flat(p.outline(INK));
}

function coin(W: number, H: number, opt: string): PropSprite {
  const p = new Pix(W, H);
  const gold = opt.includes('500') || opt.includes('10');
  const c = gold ? hex('#d8a050') : hex('#c8ccd0');
  p.oval(12, 16, 3.5, 2, shade(c, -0.35));
  p.oval(12, 15, 3.5, 2, c);
  p.set(11, 14, shade(c, 0.45));
  p.set(13, 15, shade(c, -0.2));
  p.oval(17, 18, 2.5, 1.5, shade(hex('#c8ccd0'), -0.1));
  return flat(p);
}

function button(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const c = hex('#c86a5a');
  p.oval(11, 15, 3, 2.5, c);
  p.set(10, 15, shade(c, -0.45));
  p.set(12, 15, shade(c, -0.45));
  p.set(10, 14, shade(c, 0.3));
  p.rect(9, 17, 5, 1, shade(c, -0.4));
  // 실밥 한 가닥
  p.line(13, 14, 17, 12, hex('#e8dcc0'));
  return flat(p);
}

function hairBand(W: number, H: number, opt: string): PropSprite {
  const p = new Pix(W, H);
  const c = opt.includes('yellow') ? hex('#e8c048') : hex('#d85a8a');
  for (let t = 0; t < 24; t++) {
    const a = (t / 24) * Math.PI * 2;
    p.set(12 + Math.cos(a) * 4, 15 + Math.sin(a) * 2.5, t % 6 === 0 ? shade(c, 0.3) : c);
  }
  p.oval(15, 13, 1.5, 1.5, shade(c, 0.15));
  return flat(p);
}

/** 소품 그림. 모르는 kind 는 null */
export function moveSprite(kind: string, w: number, h: number, opt = ''): PropSprite | null {
  const W = Math.max(1, w) * HT;
  const H = Math.max(1, h) * HT;
  switch (kind) {
    case 'cartonS': return stand(carton(W, 13, 6, opt, '책', 1));
    case 'cartonM': return stand(carton(W, 19, 8, opt, '부엌', 2));
    case 'cartonL': return stand(carton(W, 26, 10, opt, '거실', 3));
    case 'cartonOpen': return cartonOpen(W, false);
    case 'cartonHalf': return cartonOpen(W, true);
    case 'rolledRug': return rolledRug(W);
    case 'sofaWrap': return sofaWrap(W);
    case 'bookTied': return bookTied(W, opt);
    case 'bubbleWrap': return bubbleWrap(W);
    case 'dishWrap': return dishWrap(W);
    case 'curtainPile': return curtainPile(W);
    case 'trashBag': return trashBag(W);
    case 'grandClock': return grandClock(W);
    case 'tapeBit': return tapeBit(W, H, opt);
    case 'markerPen': return markerPen(W, H);
    case 'frameGhost': return frameGhost(W, H, opt);
    case 'dragMarks': return dragMarks(W, H);
    case 'newsSheet': return newsSheet(W, H);
    case 'slipper': return slipper(W, H, opt);
    case 'coin': return coin(W, H, opt);
    case 'button': return button(W, H);
    case 'hairBand': return hairBand(W, H, opt);
    default: return null;
  }
}
