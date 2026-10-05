/**
 * 보스 다섯 그림: 동작 여섯 장 (숨쉬기 둘 · 모으기 · 내리치기 · 맞기 · 고유 기술) × 단계 (화가 나면 모습이 바뀐다).
 * 발은 어떤 동작에서도 같은 줄에 닿는다.
 */
import { Pix, hex, shade, type Color } from './paint.ts';

export type BossPose = 'idle0' | 'idle1' | 'windup' | 'strike' | 'hurt' | 'special';
export const BOSS_POSES: BossPose[] = ['idle0', 'idle1', 'windup', 'strike', 'hurt', 'special'];
export const BOSS_IDS = ['b_bear', 'b_jelly', 'b_tin', 'b_dusty', 'b_king'];

const INK = hex('#1c1424');
const WHITE = hex('#ffffff');

type Draw = (p: Pix, pose: BossPose, phase: number) => void;

/** 보송보송한 덩어리: 공 하나에 가장자리 작은 공들 (먼지 · 털) */
function fluff(p: Pix, cx: number, cy: number, rx: number, ry: number, c: Color, bumps = 12, seed = 0): void {
  p.ball(cx, cy, rx, ry, c, true);
  for (let i = 0; i < bumps; i++) {
    const a = (i / bumps) * Math.PI * 2 + seed;
    const r = 2.2 + ((i * 7 + seed * 3) % 3);
    p.ball(cx + Math.cos(a) * rx * 0.92, cy + Math.sin(a) * ry * 0.92, r, r, shade(c, Math.sin(a) < 0 ? 0.08 : -0.06), true);
  }
}

/** 단추 눈 (구멍 넷 · 반짝) */
function buttonEye(p: Pix, x: number, y: number, r: number, c: Color): void {
  p.oval(x, y, r, r, c);
  p.oval(x, y, r - 1, r - 1, shade(c, 0.12));
  for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) p.set(x + dx * 0.8, y + dy * 0.8, shade(c, -0.5));
  p.set(x - r + 1, y - r + 1, WHITE);
}

/** 바느질 땀 (점선) */
function stitch(p: Pix, x0: number, y0: number, x1: number, y1: number, c: Color): void {
  const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 2));
  for (let i = 0; i <= n; i += 2) p.set(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, c);
}

/** 화난 눈썹 (바느질 줄) */
function brows(p: Pix, x: number, y: number, gap: number, c: Color): void {
  p.line(x - gap - 3, y - 2, x - gap + 2, y, c);
  p.line(x + gap + 3, y - 2, x + gap - 2, y, c);
}

/** 꼭 감은 > < 눈 */
function squint(p: Pix, x: number, y: number, c: Color): void {
  p.line(x - 2, y - 2, x + 1, y, c);
  p.line(x + 1, y, x - 2, y + 2, c);
}

// ───────────────────────── 태엽 곰 대장 ─────────────────────────
// 군모를 쓴 곰 인형 대장: 단추 눈, 배의 바느질 솔기, 어깨 견장, 팔의 덧댄 천. 2단계: 솔기가 터져 솜이 비어져 나온다

const BEAR = hex('#9a6038');
const BEAR_LIGHT = hex('#e8c08c');
const NAVY = hex('#34508c');
const GOLD = hex('#e8c040');

const bear: Draw = (p, pose, phase) => {
  const G = 63;
  const breathe = pose === 'idle1' ? 1 : 0;
  const slump = pose === 'special';
  const head = pose === 'windup' ? -2 : pose === 'strike' ? 3 : slump ? 5 : pose === 'hurt' ? 1 : breathe;
  const tilt = slump ? 3 : pose === 'hurt' ? -2 : 0;
  // 발
  for (const x of [21, 43]) {
    p.ball(x, G - 5, 8.5, 5.5, shade(BEAR, -0.12), true);
    p.oval(x, G - 4, 4.5, 2.6, BEAR_LIGHT);
  }
  // 팔 (뒤)
  const arm = (x: number, y: number, rx: number, ry: number) => p.ball(x, y, rx, ry, shade(BEAR, -0.05), true);
  const armY = { idle0: 41, idle1: 42, windup: 20, strike: 52, hurt: 37, special: 50 }[pose];
  const armX = pose === 'strike' ? 10 : pose === 'windup' ? 12 : pose === 'hurt' ? 15 : 11;
  arm(armX, armY, 6.5, pose === 'strike' ? 6 : 8.5);
  arm(64 - armX, armY + (slump ? 2 : 0), 6.5, pose === 'strike' ? 6 : 8.5);
  // 덧댄 천 (오른팔)
  p.rect(64 - armX - 3, armY - 2, 6, 5, hex('#c8784a'));
  stitch(p, 64 - armX - 3, armY - 3, 64 - armX + 3, armY - 3, hex('#4a2a14'));
  // 몸통 · 배
  p.ball(32, 44 + breathe, 20 + breathe * 0.5, 16 - breathe * 0.5, BEAR, true);
  p.oval(32, 47 + breathe, 11, 10, BEAR_LIGHT);
  if (phase >= 2) {
    // 터진 솔기에서 비어져 나온 솜
    p.oval(32, 47 + breathe, 4, 6, hex('#3a2418'));
    for (const [dx, dy, r] of [[-1, -3, 2.6], [2, 0, 3], [-2, 3, 2.4], [1, 5, 2]]) p.ball(32 + dx, 47 + breathe + dy, r, r, hex('#f4f0e8'), true);
    stitch(p, 28, 39, 28, 55, hex('#4a2a14'));
  } else stitch(p, 32, 38 + breathe, 32, 56 + breathe, hex('#7a4a28'));
  // 견장
  for (const x of [13, 44]) {
    p.rect(x, 30 + breathe, 8, 3, GOLD);
    for (let i = 0; i < 8; i += 2) p.rect(x + i, 33 + breathe, 1, 2, shade(GOLD, -0.2));
  }
  // 머리
  const hx = 32 + tilt;
  const hy = 21 + head;
  for (const ex of [hx - 15, hx + 15]) {
    p.ball(ex, hy - 11, 5.5, 5.5, BEAR, true);
    if (!(phase >= 2 && ex > hx)) p.oval(ex, hy - 11, 2.6, 2.6, hex('#e8a87c'));
  }
  p.ball(hx, hy, 16, 13, BEAR, true);
  // 주둥이 · 코 · 입
  p.ball(hx, hy + 6, 7, 5, BEAR_LIGHT, true);
  p.rect(hx - 2, hy + 3, 5, 3, hex('#2a1810'));
  p.set(hx - 1, hy + 3, shade(hex('#2a1810'), 0.5));
  if (pose === 'strike') p.oval(hx, hy + 9, 3, 2, hex('#7a2a2a'));
  else if (pose === 'hurt') for (let i = -3; i <= 3; i++) p.set(hx + i, hy + 9 + (i % 2 === 0 ? 0 : 1), INK);
  else {
    p.set(hx - 1, hy + 8, INK);
    p.set(hx + 1, hy + 8, INK);
    p.set(hx, hy + 7, INK);
  }
  // 눈
  const eyeY = hy - 2;
  if (slump) {
    // 태엽이 풀려 멍한 X 눈
    for (const ex of [hx - 7, hx + 7]) {
      p.line(ex - 2, eyeY - 2, ex + 2, eyeY + 2, INK);
      p.line(ex + 2, eyeY - 2, ex - 2, eyeY + 2, INK);
    }
  } else if (pose === 'hurt') {
    squint(p, hx - 7, eyeY, INK);
    p.line(hx + 9, eyeY - 2, hx + 6, eyeY, INK);
    p.line(hx + 6, eyeY, hx + 9, eyeY + 2, INK);
  } else {
    buttonEye(p, hx - 7, eyeY, 3, hex('#2a1a1a'));
    // 2단계: 한쪽 단추가 실에 매달려 처진다
    buttonEye(p, hx + 7, eyeY + (phase >= 2 ? 2 : 0), 3, hex('#2a1a1a'));
    if (pose === 'windup' || pose === 'strike' || phase >= 2) brows(p, hx, eyeY - 4, 6, hex('#4a2a14'));
  }
  // 군모 (태엽이 풀리면 비뚤어진다)
  const cap = slump ? 3 : 0;
  p.rect(hx - 11, hy - 15 + cap, 22, 6, NAVY);
  p.rect(hx - 11, hy - 15 + cap, 22, 1, shade(NAVY, 0.3));
  p.rect(hx - 13 + cap, hy - 10 + cap, 26, 2, shade(NAVY, -0.35));
  p.rect(hx - 2, hy - 14 + cap, 4, 3, GOLD);
  p.set(hx - 1, hy - 14 + cap, shade(GOLD, 0.5));
};

// ───────────────────────── 젤리 여왕 ─────────────────────────
// 투명한 포도 젤리 여왕: 속이 비치는 몸 · 큰 반짝임 · 안쪽 거품 · 보석 왕관. 2단계: 붉게 달아오르고 왕관에 금이 간다

const jelly: Draw = (p, pose, phase) => {
  const G = 59;
  const c = phase >= 2 ? hex('#c84a9a') : hex('#a85ae8');
  const [rx, ry] = { idle0: [28, 21], idle1: [29, 20], windup: [22, 26], strike: [33, 15], hurt: [30, 19], special: [25, 23] }[pose];
  const cx = 34;
  const cy = G - ry;
  // 바닥 웅덩이
  p.oval(cx, G - 1, rx + 2, 2.5, shade(c, -0.45));
  p.ball(cx, cy, rx, ry, c);
  // 비치는 속 · 거품
  p.oval(cx + 2, cy + 3, rx * 0.55, ry * 0.5, shade(c, 0.18));
  for (const [dx, dy, r] of [[-10, 6, 2.4], [8, 9, 1.8], [-3, 12, 1.4], [12, -2, 1.2]]) p.oval(cx + dx * (rx / 28), cy + dy * (ry / 21), r, r, shade(c, 0.45));
  // 아래 테두리 · 반짝임
  for (let x = Math.ceil(cx - rx + 2); x < cx + rx - 2; x++) p.set(x, G - 2, shade(c, -0.3));
  p.oval(cx - rx * 0.45, cy - ry * 0.5, rx * 0.22, ry * 0.14, shade(c, 0.7));
  p.set(cx - rx * 0.2, cy - ry * 0.68, WHITE);
  // 얼굴
  const fy = cy - ry * 0.05;
  const gap = 8;
  if (pose === 'special') {
    // 신나게 뛰어오를 때: ^ ^
    for (const ex of [cx - gap, cx + gap]) {
      p.line(ex - 3, fy + 1, ex, fy - 2, INK);
      p.line(ex, fy - 2, ex + 3, fy + 1, INK);
    }
    // 튀는 방울
    for (const [dx, dy] of [[-rx - 4, -6], [rx + 3, -10], [-rx + 2, -ry - 4], [rx - 4, -ry - 2]]) p.ball(cx + dx, cy + dy, 2.2, 2.6, shade(c, 0.2));
  } else if (pose === 'hurt') {
    squint(p, cx - gap, fy, INK);
    p.line(cx + gap + 2, fy - 2, cx + gap - 1, fy, INK);
    p.line(cx + gap - 1, fy, cx + gap + 2, fy + 2, INK);
  } else {
    for (const ex of [cx - gap, cx + gap]) {
      p.oval(ex, fy, 3, 4, INK);
      p.set(ex - 1, fy - 2, WHITE);
      p.set(ex + 1, fy + 1, shade(c, 0.5));
    }
    if (pose === 'windup' || pose === 'strike' || phase >= 2) brows(p, cx, fy - 5, gap - 1, INK);
  }
  // 볼 · 입
  p.oval(cx - gap - 4, fy + 5, 2.4, 1.2, hex('#ff9ec7'));
  p.oval(cx + gap + 4, fy + 5, 2.4, 1.2, hex('#ff9ec7'));
  if (pose === 'strike') p.oval(cx, fy + 7, 4, 2.4, hex('#5a1a3a'));
  else p.line(cx - 3, fy + 7, cx + 3, fy + 7, INK);
  // 왕관 (몸 위에 얹혀 같이 출렁인다)
  const ky = cy - ry - 3;
  const gold = hex('#ffd84a');
  const tilt = pose === 'strike' ? 2 : pose === 'hurt' ? -2 : 0;
  p.rect(cx - 11 + tilt, ky, 22, 6, gold);
  p.rect(cx - 11 + tilt, ky + 5, 22, 1, shade(gold, -0.35));
  for (const x of [-11, -4, 3, 9]) p.tri(cx + x + tilt, ky, cx + x + 3 + tilt, ky, cx + x + 1.5 + tilt, ky - 6, gold);
  for (const [x, col] of [[-6, '#e8414f'], [0, '#5ac8f0'], [6, '#7ae08a']] as const) p.oval(cx + x + tilt, ky + 3, 1.6, 1.6, hex(col));
  if (phase >= 2) p.line(cx + 2 + tilt, ky, cx - 1 + tilt, ky + 5, shade(gold, -0.6));
};

// ───────────────────────── 깡통 대장 ─────────────────────────
// 깡통 로봇 장군: 빨간 상표 띠 · 리벳 · 붉은 눈 바이저 · 안테나 · 커다란 말굽 자석 팔. 2단계: 찌그러지고 김이 샌다

const TIN = hex('#a8b4c4');
const TIN_RED = hex('#c83a3a');

const tin: Draw = (p, pose, phase) => {
  const G = 67;
  const breathe = pose === 'idle1' ? 1 : 0;
  // 다리 · 장화
  for (const x of [17, 31]) {
    p.bar(x, G - 15, 8, 11, shade(TIN, -0.2));
    p.rect(x - 1, G - 4, 10, 4, hex('#3a3a48'));
  }
  // 몸통 깡통
  const by = 28 + breathe;
  p.bar(10, by, 36, 26, TIN_RED);
  p.rect(10, by, 36, 3, shade(TIN, 0.1));
  p.rect(10, by + 23, 36, 3, shade(TIN, -0.15));
  for (const y of [by + 9, by + 15]) p.rect(10, y, 36, 2, hex('#ffd84a'));
  for (const x of [13, 22, 33, 42]) p.set(x, by + 1, shade(TIN, 0.5));
  // 가운데 태엽 단추판
  p.rect(23, by + 5, 10, 14, hex('#f2e4c8'));
  p.oval(28, by + 12, 3, 3, hex('#e8c040'));
  if (phase >= 2) {
    // 찌그러짐
    p.oval(16, by + 18, 4, 3, shade(TIN_RED, -0.35));
    p.line(13, by + 16, 19, by + 20, shade(TIN_RED, -0.55));
  }
  // 머리 깡통
  const hy = 8 + (pose === 'strike' ? 2 : pose === 'windup' ? -1 : breathe);
  const hx = 28 + (pose === 'hurt' ? -2 : 0);
  p.bar(hx - 13, hy, 26, 20, TIN);
  p.oval(hx, hy, 13, 3, shade(TIN, 0.25));
  p.rect(hx - 10, hy + 7, 20, 6, INK);
  const glow = pose === 'special' || pose === 'windup' || phase >= 2 ? hex('#ff7a5a') : hex('#ff3a3a');
  if (pose === 'hurt') {
    p.rect(hx - 8, hy + 9, 5, 2, glow);
    p.rect(hx + 4, hy + 10, 4, 1, shade(glow, -0.5));
  } else {
    p.rect(hx - 8, hy + 8, 5, 3, glow);
    p.rect(hx + 3, hy + 8, 5, 3, glow);
    p.set(hx - 7, hy + 8, WHITE);
    p.set(hx + 4, hy + 8, WHITE);
  }
  // 안테나 (2단계: 휘었다)
  const bend = phase >= 2 ? 3 : 0;
  p.line(hx, hy - 2, hx + bend, hy - 8, shade(TIN, -0.3));
  p.ball(hx + bend, hy - 9, 2, 2, pose === 'special' ? hex('#ffe04a') : hex('#e8414f'));
  // 왼팔
  const lArmY = pose === 'windup' ? 18 : pose === 'strike' ? by + 4 : by + 2 + breathe;
  p.bar(2, lArmY, 8, 16, TIN);
  p.ball(6, lArmY + 17, 4, 3, shade(TIN, -0.2));
  // 오른팔 + 말굽 자석 (들어 올리면 어깨에서 위로 곧게, 자석은 손 위에서 위를 향한다)
  const magnetUp = pose === 'windup' || pose === 'special';
  const ax = pose === 'strike' ? 49 : 46;
  const mx = ax + 4;
  if (magnetUp) {
    p.bar(ax, 12, 8, by + 6 - 12, TIN);
    p.ball(mx, 12, 4, 3, shade(TIN, -0.15));
    // 자석: 바닥 → 위로 두 갈래
    p.rect(mx - 7, 6, 14, 4, TIN_RED);
    p.rect(mx - 7, 1, 4, 6, TIN_RED);
    p.rect(mx + 3, 1, 4, 6, TIN_RED);
    p.rect(mx - 7, 0, 4, 2, hex('#e8eef8'));
    p.rect(mx + 3, 0, 4, 2, hex('#e8eef8'));
    if (pose === 'special')
      for (const [x0, y0, x1, y1] of [[mx - 10, 6, mx - 13, 2], [mx + 9, 6, mx + 11, 1], [mx - 9, 12, mx - 13, 14]]) {
        p.line(x0, y0, x1, y1, hex('#7ad0ff'));
        p.set(x1, y1, WHITE);
      }
  } else {
    const ay = pose === 'strike' ? by + 6 : by + 2 + breathe;
    p.bar(ax, ay, 8, 14, TIN);
    // 자석: 손 아래에서 아래로 두 갈래
    const my = ay + 13;
    p.rect(mx - 7, my, 14, 4, TIN_RED);
    p.rect(mx - 7, my + 4, 4, 6, TIN_RED);
    p.rect(mx + 3, my + 4, 4, 6, TIN_RED);
    p.rect(mx - 7, my + 10, 4, 2, hex('#e8eef8'));
    p.rect(mx + 3, my + 10, 4, 2, hex('#e8eef8'));
  }
  // 2단계 · 맞았을 때: 김
  if (phase >= 2 || pose === 'hurt') for (const [x, y] of [[hx - 14, hy + 2], [hx - 16, hy - 1]]) p.ball(x, y, 2.2, 2, hex('#e8e4f0'), true);
};

// ───────────────────────── 먼지 사도 더스티 ─────────────────────────
// 보풀 망토를 두른 먼지 마법사: 그늘진 두건 속 노란 눈, 빗자루 지팡이, 떠다니는 먼지. 2단계: 망토 끝이 해지고 눈이 붉게

const dusty: Draw = (p, pose, phase) => {
  const G = 59;
  const c = hex('#4a4058');
  const puff = pose === 'hurt' ? 3 : pose === 'idle1' ? 1 : 0;
  // 망토 (아래로 퍼지는 보풀)
  p.tri(6 - puff, G - 2, 46 + puff, G - 2, 26, 14, c);
  p.tri(12, G - 2, 40, G - 2, 26, 22, shade(c, 0.1));
  for (let x = 6 - puff; x <= 46 + puff; x += 4) p.ball(x, G - 3, 2.6, 2.4, shade(c, (x % 8) * 0.01), true);
  if (phase >= 2) for (const x of [12, 24, 36]) p.rect(x, G - 6, 2, 6, hex('#1c1424'));
  // 보풀 무늬
  for (const [x, y] of [[18, 40], [30, 46], [24, 34], [36, 38]]) p.set(x, y, shade(c, 0.25));
  // 두건 머리
  const hy = 16 + (pose === 'strike' ? 3 : pose === 'windup' ? -2 : pose === 'idle1' ? 1 : 0);
  const hx = 26 + (pose === 'hurt' ? -2 : pose === 'strike' ? 2 : 0);
  fluff(p, hx, hy, 11 + puff * 0.5, 10 + puff * 0.5, hex('#8a8098'), 10, 0.3);
  p.oval(hx, hy + 2, 7, 6, hex('#1c1424'));
  // 눈
  const eye = phase >= 2 ? hex('#ff5a5a') : hex('#ffd84a');
  if (pose === 'hurt') {
    p.line(hx - 5, hy + 2, hx - 2, hy + 2, eye);
    p.line(hx + 2, hy + 2, hx + 5, hy + 2, eye);
  } else {
    const big = pose === 'special' ? 1 : 0;
    p.rect(hx - 5, hy + 1 - big, 3, 2 + big * 2, eye);
    p.rect(hx + 2, hy + 1 - big, 3, 2 + big * 2, eye);
    if (pose === 'windup' || pose === 'strike' || phase >= 2) {
      p.line(hx - 6, hy - 1, hx - 2, hy, shade(eye, -0.4));
      p.line(hx + 6, hy - 1, hx + 2, hy, shade(eye, -0.4));
    }
  }
  // 빗자루 지팡이
  const broom = (x0: number, y0: number, x1: number, y1: number) => {
    p.line(x0, y0, x1, y1, hex('#8a5a32'));
    p.line(x0 + 1, y0, x1 + 1, y1, hex('#6a4426'));
    const bx = x1;
    const by = y1;
    p.tri(bx - 4, by, bx + 5, by, bx + 0.5, by + 8, hex('#d8b060'));
    for (let i = -3; i <= 3; i += 2) p.line(bx + i * 0.6, by + 1, bx + i, by + 7, hex('#b89040'));
  };
  if (pose === 'windup' || pose === 'special') broom(40, 40, 44, 2);
  else if (pose === 'strike') broom(36, 26, 48, 42);
  else broom(42, 12, 42, G - 10);
  // 손 (먼지 장갑)
  const hand = pose === 'windup' || pose === 'special' ? [41, 22] : pose === 'strike' ? [40, 30] : [42, 34];
  p.ball(hand[0], hand[1], 3, 3, hex('#8a8098'), true);
  // 불 끄기: 둘레에 어둠 소용돌이
  if (pose === 'special') for (let i = 0; i < 10; i++) {
    const a = i * 0.63;
    p.ball(26 + Math.cos(a) * 22, 30 + Math.sin(a) * 14, 1.6, 1.6, hex('#2a2238'));
  }
};

// ───────────────────────── 먼지 왕 ─────────────────────────
// 다락방 먼지가 뭉친 거대한 왕: 가시 같은 먼지 털, 붉은 눈, 보석 왕관, 보라 보풀 망토. 단계가 오를수록 눈과 왕관 보석이 타오른다

const king: Draw = (p, pose, phase) => {
  const G = 83;
  const c = hex('#3a3048');
  const breathe = pose === 'idle1' ? 1 : 0;
  // 보라 망토 (뒤)
  p.tri(4, G - 2, 80, G - 2, 42, 22, hex('#4a2a6a'));
  for (let x = 6; x <= 78; x += 6) p.tri(x - 3, G - 3, x + 3, G - 3, x, G + 0 - 1, shade(hex('#4a2a6a'), -0.3));
  // 몸
  fluff(p, 42, 58 + breathe, 34 - breathe * 0.5, 23, c, 18, 0.2);
  for (let i = 0; i < 9; i++) p.tri(14 + i * 7, 40 + (i % 2) * 2, 18 + i * 7, 40 + (i % 2) * 2, 16 + i * 7, 32 + (i % 3), shade(c, 0.12));
  // 팔
  const armY = { idle0: 56, idle1: 57, windup: 30, strike: 70, hurt: 52, special: 22 }[pose];
  const armX = pose === 'strike' ? 6 : pose === 'hurt' ? 12 : 8;
  fluff(p, armX, armY, 7, 10, shade(c, 0.05), 7, 1);
  fluff(p, 84 - armX, armY, 7, 10, shade(c, 0.05), 7, 2);
  // 머리
  const hy = 36 + (pose === 'strike' ? 4 : pose === 'windup' ? -2 : pose === 'special' ? -3 : breathe);
  const hx = 42 + (pose === 'hurt' ? -3 : 0);
  fluff(p, hx, hy, 21, 17, hex('#6a6080'), 14, 0.5);
  p.oval(hx, hy + 2, 15, 11, shade(hex('#6a6080'), -0.2));
  // 눈 · 입
  const eye = phase >= 3 ? hex('#ffe04a') : phase >= 2 ? hex('#ff7a3a') : hex('#ff3a5a');
  if (pose === 'hurt') {
    squint(p, hx - 8, hy, eye);
    p.line(hx + 10, hy - 2, hx + 7, hy, eye);
    p.line(hx + 7, hy, hx + 10, hy + 2, eye);
  } else {
    for (const ex of [hx - 8, hx + 8]) {
      p.oval(ex, hy, 3.4, 2.6, eye);
      p.set(ex - 1, hy - 1, shade(eye, 0.6));
    }
    brows(p, hx, hy - 5, 7, INK);
  }
  if (pose === 'special' || pose === 'strike') {
    // 얼음! 하고 외친다
    p.oval(hx, hy + 9, 6, 4, hex('#1c0a14'));
    for (let x = -4; x <= 4; x += 2) p.set(hx + x, hy + 6, WHITE);
  } else for (let x = -7; x <= 7; x++) p.set(hx + x, hy + 9 + (Math.abs(x) % 2), INK);
  // 왕관
  const ky = hy - 26;
  const gold = hex('#c8a040');
  p.rect(hx - 15, ky + 6, 30, 7, gold);
  p.rect(hx - 15, ky + 12, 30, 1, shade(gold, -0.4));
  for (const x of [-15, -6, 3, 11]) p.tri(hx + x, ky + 6, hx + x + 4, ky + 6, hx + x + 2, ky - 2, gold);
  const gem = pose === 'special' ? hex('#e8d8ff') : phase >= 2 ? hex('#c84aff') : hex('#7a3ad8');
  p.oval(hx, ky + 9, 3, 3, gem);
  if (pose === 'special') for (const [dx, dy] of [[-6, -2], [6, -2], [0, -6]]) p.line(hx, ky + 9, hx + dx, ky + 9 + dy, hex('#e8d8ff'));
  if (phase >= 2) p.line(hx - 9, ky + 6, hx - 6, ky + 12, shade(gold, -0.6));
};

const DRAW: Record<string, { w: number; h: number; draw: Draw }> = {
  b_bear: { w: 64, h: 64, draw: bear },
  b_jelly: { w: 68, h: 60, draw: jelly },
  b_tin: { w: 60, h: 68, draw: tin },
  b_dusty: { w: 52, h: 60, draw: dusty },
  b_king: { w: 84, h: 84, draw: king },
};

const CACHE = new Map<string, Pix>();

/** 보스 그림 한 장 (외곽선 포함). phase: 1 · 2 · 3 */
export function bossSprite(id: string, pose: BossPose, phase: number): Pix {
  const key = `${id}${pose}${phase}`;
  const hit = CACHE.get(key);
  if (hit) return hit;
  const d = DRAW[id];
  const p = new Pix(d.w + 2, d.h + 2);
  const inner = new Pix(d.w, d.h);
  d.draw(inner, pose, phase);
  p.stamp(inner, 1, 1);
  p.outline();
  CACHE.set(key, p);
  return p;
}
