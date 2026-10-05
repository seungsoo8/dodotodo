/**
 * 갈래 E 근접 지도 소품 · 주민 그림: 17장 토비의 태엽 속 (황동 톱니 · 태엽 스프링 · 솜 · 바느질 안감 · 메아리 글자)
 * 과 20장 할머니의 재봉 상자 (누빈 안감 · 실패 · 바늘꽂이 · 단추 · 엉킨 노란 실 · 줄자 · 약봉지 …).
 * 약속은 houseProps.ts 와 같다: 칸 자리의 발 (x*24, (y+h)*24) 에서 그림 왼쪽 위까지 (ox, oy), wall 이면 바닥 · 벽에 구워진다.
 * 3면 규칙(윗면 밝게 · 앞면 중간 · 오른쪽 옆면 어둡게), 순검정 · 순흰색 없음.
 */
import { drawGlyph, textH, textWidth } from './glyphs.ts';
import type { PropSprite, RDir } from './houseProps.ts';
import { Pix, hash2, hex, mix, shade, type Color } from './paint.ts';
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

// ───────────────────────── 팔레트 ─────────────────────────
const BRASS = hex('#c8963c');
const BRASS_L = hex('#ecc868');
const BRASS_D = hex('#7a5428');
const STEEL = hex('#8a8e98');
const CLOTH = hex('#ece2d0');
const STITCH = hex('#b08a64');
const RIBBON = hex('#c8483c');
const NAVY = hex('#3a4670');
const RUST = hex('#a85a30');
const OIL = hex('#4a3a2c');
const YELLOW = hex('#f0c848');
const PAPER = hex('#f2ead8');
const PENCIL = hex('#5a5260');
const WOOD = hex('#9a6a40');
const NEAR_BLACK = hex('#2c2430');
const GLOW = hex('#fff0b8');

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

/** 3면 덩어리: 윗면(깊이 d) + 앞면(높이 h) + 오른쪽 옆면(폭 sw) */
function block3(p: Pix, x: number, y: number, w: number, d: number, h: number, c: Color, sw = 3, topC?: Color): void {
  const fw = w - sw;
  const tc = topC ?? shade(c, 0.18);
  const sc = shade(c, -0.34);
  p.rect(x, y, fw, d, tc);
  p.rect(x, y, fw, 1, shade(tc, 0.3));
  p.rect(x, y + d, fw, h, c);
  p.rect(x, y + d, fw, 1, shade(c, 0.12));
  for (let k = 0; k < sw; k++) p.rect(x + fw + k, y + 1 + k, 1, d + h - 1 - k, sc);
  p.rect(x, y + d + h - 1, fw, 1, shade(c, -0.42));
}

/** 납작하게 누운 톱니 (위에서 비스듬히): 가운데 (cx, cy), 반지름 r, 이 n 개, 두께 th */
function flatGear(p: Pix, cx: number, cy: number, r: number, n: number, c: Color, th: number, seed: number): void {
  const ry = r * 0.62;
  // 두께 (앞면)
  for (let k = th; k >= 1; k--) gearRing(p, cx, cy + k, r, ry, n, shade(c, -0.38 + k * 0.02));
  gearRing(p, cx, cy, r, ry, n, c);
  // 윗면 무늬: 안쪽 원 · 바퀴살 넷 · 축
  p.oval(cx, cy, r * 0.7, ry * 0.7, shade(c, -0.12));
  p.oval(cx, cy, r * 0.6, ry * 0.6, shade(c, 0.06));
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + 0.4;
    for (let t = 0.18; t < 0.6; t += 0.04) p.set(cx + Math.cos(a) * r * t, cy + Math.sin(a) * ry * t, shade(c, -0.2));
  }
  p.oval(cx, cy, r * 0.18 + 1, ry * 0.18 + 1, shade(c, -0.35));
  p.oval(cx - 0.5, cy - 0.5, r * 0.1 + 0.5, ry * 0.1 + 0.5, shade(c, 0.4));
  // 윗면 반짝 (왼쪽 위)
  for (let a = Math.PI * 1.05; a < Math.PI * 1.45; a += 0.03) p.set(cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * ry * 0.82, shade(c, 0.42));
  for (let i = 0; i < 6; i++) p.set(cx + (hash2(i, 1, seed) - 0.5) * r, cy + (hash2(i, 2, seed) - 0.5) * ry, shade(c, -0.18));
}
function gearRing(p: Pix, cx: number, cy: number, r: number, ry: number, n: number, c: Color): void {
  p.oval(cx, cy, r * 0.84, ry * 0.84, c);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const tx = cx + Math.cos(a) * r * 0.9;
    const ty = cy + Math.sin(a) * ry * 0.9;
    p.oval(tx, ty, Math.max(1.6, r * 0.13), Math.max(1.2, ry * 0.13), c);
  }
}

// ───────────────────────── 토비의 태엽 속 ─────────────────────────

/** 뒷벽: 토비 몸 안쪽의 하얀 천 안감 (솜이 비치고, 바느질 땀이 하늘의 별자리처럼). keyhole 이면 가운데 열쇠 구멍으로 빛 */
function clothWall(W: number, H: number, opt: string): PropSprite {
  const p = new Pix(W, H);
  for (let y = 0; y < H; y++) {
    const t = y / H;
    for (let x = 0; x < W; x++) {
      const v = hash2(x >> 2, y >> 2, 701);
      let c = mix(shade(CLOTH, -0.32), CLOTH, t * 0.9);
      if (v < 0.18) c = shade(c, -0.05);
      // 천 결 (가는 가로줄)
      if (y % 3 === 0 && hash2(x, y, 702) < 0.5) c = shade(c, -0.04);
      p.set(x, y, c);
    }
  }
  // 솜 덩이가 비치는 볼록한 자리
  for (let i = 0; i < Math.floor(W / 30); i++) {
    const cx = 10 + hash2(i, 0, 703) * (W - 20);
    const cy = 8 + hash2(i, 1, 703) * (H - 30);
    p.oval(cx, cy, 9, 6, shade(CLOTH, 0.04));
    p.oval(cx - 2, cy - 2, 4, 2, shade(CLOTH, 0.1));
  }
  // 이음매 · 바느질 땀 (점선)
  const seamY = Math.floor(H * 0.42);
  for (let x = 0; x < W; x++) {
    p.set(x, seamY, shade(CLOTH, -0.22));
    if (x % 6 < 3) p.set(x, seamY - 2, STITCH);
  }
  for (let x = 4; x < W; x += 34) for (let y = 2; y < seamY - 4; y += 6) p.rect(x, y, 1, 3, STITCH);
  // 아래: 쇠틀에 꿰맨 단 (밑단 접힘 · 그늘)
  p.rect(0, H - 9, W, 3, shade(CLOTH, -0.18));
  for (let x = 1; x < W; x += 5) p.rect(x, H - 8, 2, 1, STITCH);
  p.rect(0, H - 6, W, 6, shade(BRASS_D, -0.1));
  p.rect(0, H - 6, W, 1, BRASS);
  for (let x = 6; x < W; x += 16) {
    p.set(x, H - 3, BRASS_L);
    p.set(x + 1, H - 2, shade(BRASS_D, -0.3));
  }
  if (opt.includes('keyhole')) {
    // 열쇠 구멍: 바깥의 새벽빛이 들어오는 구멍 (둥근 머리 + 좁은 몸)
    const cx = Math.floor(W / 2);
    for (let r = 14; r > 0; r--) p.oval(cx, 18, r + 4, r + 4, mix(CLOTH, GLOW, 1 - r / 14));
    p.oval(cx, 16, 7, 7, shade(BRASS_D, -0.2));
    p.rect(cx - 3, 16, 7, 26, shade(BRASS_D, -0.2));
    p.oval(cx, 16, 5, 5, GLOW);
    p.rect(cx - 1, 16, 3, 24, GLOW);
    p.set(cx - 1, 13, hex('#fffae0'));
    // 테이프 자국 (「열지 마」 쪽지가 붙어 있던 자리)
    p.rect(cx - 16, 6, 9, 4, mix(hex('#e2c890'), CLOTH, 0.5));
    p.rect(cx + 9, 30, 9, 4, mix(hex('#e2c890'), CLOTH, 0.5));
  }
  return { pix: p, ox: 0, oy: -H, wall: true };
}

/** 큰 황동 톱니 (바닥에 누워 돈다). rust 면 녹슨 톱니 (붉은 갈색 · 얼룩), small 이면 작게 */
function brassGear(W: number, H: number, opt: string): PropSprite {
  const rust = opt.includes('rust');
  const small = opt.includes('small');
  const Ht = H + 8;
  const p = new Pix(W, Ht);
  const r = Math.min(W / 2 - 2, (H + 8) * 0.8) * (small ? 0.7 : 1);
  const c = rust ? RUST : BRASS;
  flatGear(p, W / 2 - 1, Ht - r * 0.62 - 6, r, Math.max(8, Math.round(r / 2.4)), c, 5, rust ? 711 : 712);
  if (rust) for (let i = 0; i < 26; i++) p.set(W / 2 - r + hash2(i, 3, 713) * r * 2, Ht - r - 2 + hash2(i, 4, 713) * r * 1.1, hash2(i, 5, 713) < 0.5 ? hex('#6a3a24') : hex('#c87848'));
  p.outline();
  return stand(p);
}

/** 태엽 스프링 (태엽 심): 납작한 쇠띠가 나선으로 감겨, 거의 다 풀려 느슨하다. wound 면 촘촘히 감김 */
function mainspring(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 6;
  const p = new Pix(W, Ht);
  const cx = W / 2;
  const cy = Ht / 2 + 2;
  const wound = opt.includes('wound');
  const turns = wound ? 6 : 3.4;
  const rMax = W / 2 - 4;
  const band = hex('#a8acb8');
  for (let t = 0; t < turns * Math.PI * 2; t += 0.02) {
    const rr = 3 + (t / (turns * Math.PI * 2)) * rMax;
    const x = cx + Math.cos(t) * rr;
    const y = cy + Math.sin(t) * rr * 0.56;
    p.rect(x, y, 2, 3, shade(band, Math.sin(t) > 0 ? -0.25 : 0.1));
    p.set(x, y, shade(band, 0.35));
  }
  // 바깥 끝은 늘어져 바닥에 끌린다
  if (!wound) for (let k = 0; k < 18; k++) p.rect(cx + rMax - 2 + k * 0.5, cy + rMax * 0.3 + k * 0.6, 2, 2, shade(band, -0.1));
  // 축
  p.oval(cx, cy, 4, 3, BRASS_D);
  p.oval(cx - 1, cy - 1, 2, 1.5, BRASS_L);
  p.outline();
  return stand(p);
}

/** 멈춤쇠 · 걸쇠: 굴대에 꽂힌 휘어진 쇠 갈고리 (끝이 아래로 굽어 톱니를 붙든다) */
function pawl(W: number, H: number): PropSprite {
  const Ht = H + 14;
  const p = new Pix(W, Ht);
  const g = Ht - 3;
  // 바닥 그늘 · 굴대 받침 (놋쇠 원판)
  p.oval(12, g - 2, 9, 3.5, shade(BRASS_D, -0.3));
  p.oval(12, g - 4, 9, 3.5, BRASS);
  p.oval(11, g - 5, 5, 1.6, BRASS_L);
  // 휘어진 팔: 굴대에서 오른쪽 위로 뻗었다가 끝이 아래로 굽는다
  for (let t = 0; t <= 1; t += 0.02) {
    const x = 12 + t * (W - 20);
    const y = g - 10 - Math.sin(t * Math.PI * 0.9) * 10;
    p.rect(x, y, 3, 5, shade(STEEL, t < 0.5 ? 0.12 : -0.04));
    p.set(x, y, shade(STEEL, 0.4));
  }
  const ex = W - 8;
  p.rect(ex, g - 14, 4, 10, shade(STEEL, -0.1));
  p.tri(ex - 2, g - 4, ex + 5, g - 4, ex + 2, g + 1, shade(STEEL, -0.22));
  // 굴대 (볼트 머리)
  p.oval(12, g - 11, 4, 4, shade(STEEL, -0.25));
  p.oval(11, g - 12, 2, 2, shade(STEEL, 0.35));
  p.outline();
  return stand(p);
}

/** 굴러다니는 큰 나사 (누운 원기둥 · 십자 머리) */
function screwBig(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const y = H - 12;
  for (let x = 12; x < W - 3; x++) {
    p.rect(x, y, 1, 8, STEEL);
    if ((x - 12) % 4 < 2) p.rect(x, y + 1, 1, 6, shade(STEEL, -0.2));
  }
  p.rect(12, y, W - 15, 2, shade(STEEL, 0.25));
  p.oval(9, y + 4, 6, 7, shade(STEEL, 0.1));
  p.oval(9, y + 4, 4.5, 5.5, shade(STEEL, 0.2));
  p.rect(8, y, 2, 9, shade(STEEL, -0.4));
  p.rect(5, y + 4, 9, 1, shade(STEEL, -0.4));
  p.outline();
  return stand(p);
}

/** 솜 덩어리 (토비 몸속을 채운 하얀 솜) */
function cotton(W: number, H: number): PropSprite {
  const Ht = H + 4;
  const p = new Pix(W, Ht);
  for (const [cx, cy, r] of [[12, Ht - 10, 9], [24, Ht - 13, 11], [36, Ht - 9, 8], [20, Ht - 6, 8], [31, Ht - 5, 7]] as const) p.ball(cx, cy, r, r * 0.8, hex('#ece6dc'), true);
  for (let i = 0; i < 10; i++) p.set(4 + hash2(i, 1, 721) * (W - 8), Ht - 18 + hash2(i, 2, 721) * 14, shade(CLOTH, -0.12));
  p.outline(shade(CLOTH, -0.45));
  return stand(p);
}

function oilDrop(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  p.oval(W / 2, H - 8, 8, 4, OIL);
  p.oval(W / 2 + 4, H - 5, 4, 2, OIL);
  p.oval(W / 2 - 3, H - 9, 3, 1.2, hex('#8a7a8c'));
  p.set(W / 2 - 4, H - 10, hex('#c8c0d8'));
  return flat(p);
}

function rustPatch(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  for (let y = 4; y < H - 2; y++)
    for (let x = 2; x < W - 2; x++) {
      const v = hash2(x >> 1, y >> 1, 731);
      const d = Math.hypot((x - W / 2) / (W / 2), (y - H / 2) / (H / 2.4));
      if (d < 0.9 && v < 0.75 - d * 0.5) p.set(x, y, v < 0.25 ? hex('#7a4228') : RUST);
    }
  return flat(p);
}

/** 부러진 첫 열쇠 자국: 바닥에 눌린 열쇠 모양 (반쯤 끊긴) */
function brokenKey(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const c = shade(STEEL, -0.28);
  const y = H - 12;
  p.oval(9, y + 3, 6, 4, c);
  p.oval(9, y + 3, 3, 2, shade(c, 0.15));
  p.rect(14, y + 2, 12, 3, c);
  // 끊긴 자리 · 떨어져 나간 끝
  p.rect(30, y + 3, 8, 2, c);
  p.rect(35, y + 5, 2, 3, c);
  p.set(27, y + 1, shade(c, 0.3));
  p.set(29, y + 5, shade(c, 0.3));
  return flat(p);
}

/** 반쯤 접힌 귀 안쪽 천 조각: 바느질 땀 한 줄 + 꺾인 철사 뼈대 */
function stitchPatch(W: number, H: number): PropSprite {
  const Ht = H + 4;
  const p = new Pix(W, Ht);
  p.tri(3, Ht - 4, W - 3, Ht - 4, W / 2 + 2, Ht - 22, CLOTH);
  p.tri(5, Ht - 5, W / 2 + 1, Ht - 20, W / 2 + 1, Ht - 5, hex('#f4c8c8'));
  for (let i = 0; i < 6; i++) p.rect(6 + i * 2, Ht - 6 - i * 2.4, 1, 2, RIBBON);
  // 꺾인 철사
  p.line(W / 2 + 2, Ht - 22, W / 2 + 4, Ht - 12, STEEL);
  p.line(W / 2 + 4, Ht - 12, W - 3, Ht - 14, STEEL);
  p.outline();
  return stand(p);
}

/** 남색 외투 주머니 실밥 뭉치 */
function lint(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const cx = W / 2;
  const cy = H - 8;
  p.ball(cx, cy, 6, 4.5, NAVY, true);
  for (let i = 0; i < 9; i++) {
    const a = hash2(i, 1, 741) * Math.PI * 2;
    p.line(cx, cy, cx + Math.cos(a) * 9, cy + Math.sin(a) * 6, shade(NAVY, hash2(i, 2, 741) < 0.5 ? 0.2 : -0.1));
  }
  p.outline();
  return stand(p);
}

/**
 * 하루 목소리의 메아리: 공중에 뜬 빛 글자 조각 (opt 첫 글자 · note 면 음표).
 * 상태 faint 은 부르는 빛(밝게), lit 은 들은 뒤 (금빛 테두리) — 기본은 흐릿하다.
 */
function echo(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 16;
  const p = new Pix(W, Ht);
  const lit = /\blit\b/.test(opt);
  const faint = /\bfaint\b/.test(opt);
  const base = lit ? hex('#ffe08a') : faint ? hex('#f8f0c8') : hex('#a8a0c0');
  const cy = Ht - 22;
  // 퍼진 빛 (점점이)
  for (let r = 10; r > 4; r -= 2) for (let a = 0; a < Math.PI * 2; a += 0.5) if (hash2(r, Math.floor(a * 10), 751) < (lit || faint ? 0.7 : 0.35)) p.set(W / 2 + Math.cos(a) * r, cy + Math.sin(a) * r * 0.8, shade(base, -0.15));
  const ch = opt.split(',').find((s) => s && s !== 'lit' && s !== 'faint' && s !== 'note');
  if (opt.includes('note')) {
    p.oval(W / 2 - 3, cy + 4, 3, 2.4, base);
    p.rect(W / 2 - 1, cy - 6, 2, 10, base);
    p.rect(W / 2, cy - 6, 5, 2, base);
  } else {
    const t = ch ?? '하';
    textH(p, t, Math.floor(W / 2 - textWidth(t) / 2), cy - 4, base);
  }
  // 바닥의 작은 빛 웅덩이
  p.oval(W / 2, Ht - 4, 7, 2, shade(base, -0.45));
  return { pix: p, ox: 0, oy: -Ht };
}

/** 할머니가 고친 새 열쇠 축: 놋쇠 축에 빨간 리본 끝 */
function keyAxle(W: number, H: number): PropSprite {
  const Ht = H + 6;
  const p = new Pix(W, Ht);
  p.bar(W / 2 - 3, Ht - 22, 6, 18, BRASS);
  p.oval(W / 2, Ht - 22, 3, 1.6, BRASS_L);
  p.oval(W / 2, Ht - 4, 5, 2, BRASS_D);
  // 리본: 매듭과 늘어진 두 끝
  p.oval(W / 2 + 1, Ht - 14, 3, 2, RIBBON);
  p.tri(W / 2 + 2, Ht - 14, W - 2, Ht - 8, W - 5, Ht - 5, shade(RIBBON, -0.1));
  p.tri(W / 2, Ht - 14, 3, Ht - 6, 6, Ht - 4, shade(RIBBON, 0.1));
  // 새로 감은 실 (할머니 수선 자국)
  for (let y = Ht - 20; y < Ht - 16; y += 2) p.rect(W / 2 - 3, y, 6, 1, hex('#b89ad0'));
  p.outline();
  return stand(p);
}

/** 태엽 한가운데 꽂힌 커다란 열쇠 (손잡이는 나비 날개, 빛바랜 빨간 리본) */
function keyGiant(W: number, H: number): PropSprite {
  const Ht = H + 30;
  const p = new Pix(W, Ht);
  const cx = W / 2;
  // 축 (바닥에 꽂힘)
  p.oval(cx, Ht - 8, 12, 5, shade(BRASS_D, -0.25));
  p.bar(cx - 4, Ht - 44, 8, 38, BRASS);
  // 날개 손잡이
  p.ball(cx - 12, Ht - 54, 10, 8, BRASS);
  p.ball(cx + 12, Ht - 54, 10, 8, BRASS);
  p.oval(cx - 12, Ht - 54, 4, 3, shade(BRASS, -0.35));
  p.oval(cx + 12, Ht - 54, 4, 3, shade(BRASS, -0.35));
  p.rect(cx - 4, Ht - 58, 8, 10, shade(BRASS, -0.1));
  // 리본
  p.oval(cx, Ht - 44, 5, 3, shade(RIBBON, -0.12));
  p.tri(cx, Ht - 44, cx + 14, Ht - 30, cx + 9, Ht - 27, shade(RIBBON, -0.22));
  p.tri(cx, Ht - 44, cx - 12, Ht - 31, cx - 8, Ht - 28, shade(RIBBON, -0.1));
  p.outline();
  return stand(p);
}

/**
 * 머리 위를 가로지르는 것 (윗층, 장난감보다 늘 위): 놋쇠 굴대 (작은 톱니가 꽂힘) · needle 이면 은빛 큰 바늘 (바늘귀에 빨간 실)
 */
function axleBar(W: number, H: number, opt: string): PropSprite {
  const needle = opt.includes('needle');
  const p = new Pix(W, 22);
  const y = 6;
  if (needle) {
    const c = hex('#c8ccd6');
    p.rect(10, y, W - 22, 4, c);
    p.rect(10, y, W - 22, 1, hex('#eef0f4'));
    p.rect(10, y + 3, W - 22, 1, shade(c, -0.3));
    p.tri(W - 12, y, W - 12, y + 4, W - 1, y + 2, shade(c, 0.1));
    // 바늘귀 + 빨간 실
    p.oval(9, y + 2, 6, 3, c);
    p.oval(9, y + 2, 3, 1, shade(c, -0.55));
    p.line(9, y + 2, 2, y + 14, RIBBON);
    p.line(2, y + 14, 6, y + 16, RIBBON);
  } else {
    p.bar(0, y, W, 5, BRASS);
    p.rect(0, y, W, 1, BRASS_L);
    for (let x = 10; x < W; x += 30) {
      p.oval(x, y + 2, 2, 2, BRASS_D);
      p.set(x - 1, y + 1, BRASS_L);
    }
    // 굴대에 꽂힌 작은 톱니 (옆에서 본)
    const gx = Math.floor(W * 0.62);
    p.rect(gx - 2, y - 6, 5, 17, shade(BRASS, -0.1));
    for (let k = -6; k <= 10; k += 3) p.rect(gx - 4, y + k, 9, 1, shade(BRASS, -0.3));
  }
  p.outline();
  return { pix: p, ox: 0, oy: -p.h - H + 10, top: p, topSplitY: p.h };
}

/** 작은 숫자판: 「2917」에서 멈춘 계수기 */
function counter(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 8;
  const p = new Pix(W, Ht);
  block3(p, 2, Ht - 22, W - 4, 6, 14, BRASS_D, 3, BRASS);
  const num = opt.match(/\d+/)?.[0] ?? '2917';
  const fx = 6;
  for (let i = 0; i < num.length; i++) {
    p.rect(fx + i * 9, Ht - 15, 8, 11, PAPER);
    drawGlyph(p, num[i], fx + i * 9, Ht - 14, NEAR_BLACK);
  }
  p.outline();
  return stand(p);
}

// ───────────────────────── 할머니의 재봉 상자 ─────────────────────────

/** 뒷벽: 상자 안벽의 누빈 꽃무늬 안감. lid 면 맨 위 뚜껑 틈으로 새벽빛 (분홍 · 푸름) */
function quiltWall(W: number, H: number, opt: string): PropSprite {
  const p = new Pix(W, H);
  const base = hex('#b86a6a');
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const t = y / H;
      let c = mix(shade(base, -0.35), base, t);
      // 누빔: 마름모 바느질 줄
      if ((x + y) % 16 === 0 || (x - y + 160) % 16 === 0) c = shade(c, -0.18);
      else if ((x + y) % 16 === 1 || (x - y + 160) % 16 === 1) c = shade(c, 0.1);
      p.set(x, y, c);
    }
  // 작은 꽃 (노랑 · 크림)
  for (let i = 0; i < Math.floor(W / 14); i++) {
    const cx = 6 + hash2(i, 1, 801) * (W - 12);
    const cy = 10 + hash2(i, 2, 801) * (H - 24);
    const fc = hash2(i, 3, 801) < 0.5 ? hex('#f0d080') : hex('#f2e0c8');
    for (const [dx, dy] of [[0, -2], [2, 0], [0, 2], [-2, 0]]) p.oval(cx + dx, cy + dy, 1.6, 1.6, fc);
    p.set(cx, cy, hex('#c85a4a'));
  }
  // 아래: 나무 상자 안 바닥과 만나는 띠 (그늘)
  p.rect(0, H - 6, W, 6, shade(WOOD, -0.25));
  p.rect(0, H - 6, W, 1, shade(WOOD, 0.1));
  if (opt.includes('lid')) {
    // 뚜껑 틈: 맨 위 가는 띠로 새벽 하늘 (분홍 → 푸름), 빛이 아래로 번진다
    for (let x = 0; x < W; x++) {
      const t = (x / W + hash2(x >> 4, 0, 802) * 0.2) % 1;
      p.rect(x, 0, 1, 4, mix(hex('#f4b8c8'), hex('#b8d0f0'), t));
      p.set(x, 4, mix(hex('#f4c8d0'), base, 0.5));
    }
    p.rect(0, 5, W, 2, shade(WOOD, -0.4));
  }
  return { pix: p, ox: 0, oy: -H, wall: true };
}

/** 커다란 실패 (나무 원통 두 마구리 사이에 감긴 실). opt: 실 색 이름 */
function spoolBig(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 22;
  const p = new Pix(W, Ht);
  const colors: Record<string, string> = { red: '#c84a44', blue: '#5a7ab8', green: '#6a9a6a', purple: '#9a7ac0', yellow: '#e8c050', cream: '#e8dcc0' };
  const th = hex(colors[opt.split(',')[0]] ?? colors.red);
  const x0 = 6;
  const sw = W - 12;
  // 아래 마구리 (나무 원판)
  p.oval(x0 + sw / 2, Ht - 7, sw / 2 + 4, 6, shade(WOOD, -0.2));
  p.oval(x0 + sw / 2, Ht - 9, sw / 2 + 4, 6, WOOD);
  // 감긴 실
  p.bar(x0 + 2, Ht - 36, sw - 4, 27, th);
  for (let y = Ht - 35; y < Ht - 10; y += 2) for (let x = x0 + 2; x < x0 + sw - 2; x++) if (hash2(x, y, 811) < 0.3) p.set(x, y, shade(p.get(x, y), -0.12));
  // 위 마구리 + 구멍
  p.oval(x0 + sw / 2, Ht - 36, sw / 2 + 4, 6, shade(WOOD, 0.15));
  p.oval(x0 + sw / 2, Ht - 36, sw / 2 + 1, 4, shade(WOOD, 0.28));
  p.oval(x0 + sw / 2, Ht - 36, 3, 2, shade(WOOD, -0.5));
  // 풀린 실 끝
  p.line(x0 + sw - 2, Ht - 20, W - 1, Ht - 4, th);
  p.outline();
  return stand(p);
}

/** 토마토 바늘꽂이 + 바늘 숲 (빨간 실 꿴 바늘 하나) */
function pincushion(W: number, H: number): PropSprite {
  const Ht = H + 40;
  const p = new Pix(W, Ht);
  const red = hex('#c8443c');
  const cx = W / 2;
  const cy = Ht - 26;
  // 바늘 숲 (뒤쪽)
  for (let i = 0; i < 16; i++) {
    const x = cx - 26 + hash2(i, 1, 821) * 52;
    const top = cy - 22 - hash2(i, 2, 821) * 26;
    p.line(x, cy - 6, x + (hash2(i, 3, 821) - 0.5) * 8, top, hex('#c8ccd4'));
    p.set(x + (hash2(i, 3, 821) - 0.5) * 8, top, hex('#f0f0ea'));
    if (i % 4 === 0) p.oval(x + (hash2(i, 3, 821) - 0.5) * 8, top, 2, 2, [hex('#e8c050'), hex('#5a7ab8'), hex('#e87a8a'), hex('#8ac08a')][(i / 4) % 4]);
  }
  // 토마토 몸
  p.ball(cx, cy, 30, 20, red);
  for (let k = -2; k <= 2; k++) for (let y = cy - 18; y < cy + 18; y++) p.set(cx + k * 11 + Math.sin((y - cy) / 12) * 3, y, shade(red, -0.22));
  // 꼭지 (초록 잎)
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    p.tri(cx, cy - 16, cx + Math.cos(a) * 10, cy - 16 + Math.sin(a) * 5, cx + Math.cos(a + 0.6) * 6, cy - 16 + Math.sin(a + 0.6) * 3, hex('#5a8a4a'));
  }
  // 빨간 실 꿴 바늘 하나 (앞)
  p.line(cx + 14, cy - 8, cx + 24, cy - 40, hex('#d8dce4'));
  p.line(cx + 24, cy - 40, cx + 34, cy - 30, RIBBON);
  p.line(cx + 34, cy - 30, cx + 30, cy - 4, RIBBON);
  p.outline();
  return stand(p);
}

/** 단추 산: 짝 잃은 단추들이 언덕처럼 */
function buttonHill(W: number, H: number): PropSprite {
  const Ht = H + 18;
  const p = new Pix(W, Ht);
  const cols = ['#c84a44', '#5a7ab8', '#e8c050', '#8ac08a', '#f2e6cc', '#9a7ac0', '#7a5a3c', '#3a3440'].map(hex);
  for (let i = 0; i < 40; i++) {
    const t = i / 40;
    const x = 8 + hash2(i, 1, 831) * (W - 16);
    const peak = 1 - Math.abs((x - W / 2) / (W / 2));
    const y = Ht - 8 - hash2(i, 2, 831) * peak * 30 - t * 4;
    const c = cols[Math.floor(hash2(i, 3, 831) * cols.length)];
    const r = 4 + hash2(i, 4, 831) * 4;
    p.oval(x, y + 1.5, r, r * 0.6, shade(c, -0.35));
    p.oval(x, y, r, r * 0.6, c);
    p.oval(x - 1.4, y - 0.5, 0.8, 0.6, shade(c, -0.4));
    p.oval(x + 1.4, y - 0.5, 0.8, 0.6, shade(c, -0.4));
  }
  p.outline();
  return stand(p);
}

/** 장난감 눈높이의 큰 단추 (opt: black2 · black4 · red4 · square) */
function bigButton(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 2;
  const p = new Pix(W, Ht);
  const kind = opt.split(',')[0] || 'black2';
  const c = kind.startsWith('red') ? hex('#c84a44') : kind === 'cream' ? hex('#efe4cc') : hex('#3a3440');
  const cx = W / 2;
  const cy = Ht - 9;
  if (kind === 'square') {
    p.rect(cx - 8, cy - 3, 16, 9, shade(c, -0.3));
    p.rect(cx - 8, cy - 6, 16, 9, c);
    p.rect(cx - 8, cy - 6, 16, 1, shade(c, 0.4));
  } else {
    p.oval(cx, cy + 2, 9, 5, shade(c, -0.3));
    p.oval(cx, cy, 9, 5, c);
    p.oval(cx, cy, 6.5, 3.5, shade(c, 0.12));
    p.oval(cx - 3, cy - 3, 3, 1, shade(c, 0.5));
  }
  const holes = kind.endsWith('4') || kind === 'square' ? [[-2, -1], [2, -1], [-2, 1.5], [2, 1.5]] : [[-2, 0], [2, 0]];
  for (const [dx, dy] of holes) p.rect(cx + dx - 0.5, cy + dy - 0.5, 1.5, 1.2, shade(c, -0.6));
  p.outline();
  return stand(p);
}

/** 바닥을 지나는 노란 털실 한 가닥 (opt: h 가로 · v 세로 · ne nw se sw 꺾임) */
function yarnLine(W: number, H: number, opt: string): PropSprite {
  const p = new Pix(W, H);
  const d = opt.split(',')[0] || 'h';
  const mid = Math.floor(W / 2);
  const wob = (k: number) => Math.round(Math.sin(k * 0.5) * 1.2);
  const seg = (fx: number, fy: number, tx: number, ty: number) => {
    const n = Math.max(Math.abs(tx - fx), Math.abs(ty - fy));
    for (let i = 0; i <= n; i++) {
      const x = fx + ((tx - fx) * i) / n;
      const y = fy + ((ty - fy) * i) / n;
      const w = fx === tx ? wob(i) : 0;
      const v = fy === ty ? wob(i) : 0;
      p.rect(x + w, y + v, 2, 2, YELLOW);
      p.set(x + w, y + v, shade(YELLOW, 0.3));
      p.set(x + w + 1, y + v + 1, shade(YELLOW, -0.25));
    }
  };
  if (d === 'h') seg(0, mid, W - 1, mid);
  else if (d === 'v') seg(mid, 0, mid, H - 1);
  else {
    const vy = d.startsWith('n') ? 0 : H - 1;
    const hx = d.endsWith('e') ? W - 1 : 0;
    seg(mid, vy, mid, mid);
    seg(mid, mid, hx, mid);
  }
  return flat(p);
}

/** 엉킨 매듭 (loose 면 풀린 고리) */
function yarnKnot(W: number, H: number, opt: string): PropSprite {
  const Ht = H + 6;
  const p = new Pix(W, Ht);
  const loose = /\bloose\b/.test(opt);
  const cx = W / 2;
  const cy = Ht - 12;
  const loops = loose ? 2 : 7;
  for (let i = 0; i < loops; i++) {
    const rx = loose ? 9 - i * 2 : 4 + hash2(i, 1, 841) * 6;
    const ry = loose ? 4 : 3 + hash2(i, 2, 841) * 4;
    const ox = loose ? 0 : (hash2(i, 3, 841) - 0.5) * 8;
    const oy = loose ? i : (hash2(i, 4, 841) - 0.5) * 6;
    for (let a = 0; a < Math.PI * 2; a += 0.12) p.rect(cx + ox + Math.cos(a) * rx, cy + oy + Math.sin(a) * ry, 2, 1, Math.sin(a) < 0 ? shade(YELLOW, 0.2) : shade(YELLOW, -0.2));
  }
  p.outline();
  return stand(p);
}

/** 돌돌 말린 줄자 (끝에 실 매듭 · 눈금) */
function tapeMeasure(W: number, H: number): PropSprite {
  const Ht = H + 4;
  const p = new Pix(W, Ht);
  const c = hex('#f0d878');
  const cx = W / 2 - 1;
  const cy = Ht - 11;
  p.oval(cx, cy + 3, 9, 5, shade(c, -0.35));
  p.oval(cx, cy, 9, 5.5, c);
  for (let r = 7; r > 1; r -= 2) for (let a = 0; a < Math.PI * 2; a += 0.15) p.set(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.6, shade(c, -0.22));
  // 풀린 끝 · 눈금 · 실 매듭
  p.rect(cx + 6, cy + 2, W - cx - 7, 3, c);
  for (let x = cx + 7; x < W - 1; x += 2) p.set(x, cy + 2, NEAR_BLACK);
  p.rect(W - 4, cy + 1, 2, 5, RIBBON);
  p.outline();
  return stand(p);
}

/** 큰 가위 (벌어진 채 바닥에 누움) */
function scissorsBig(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const blade = hex('#c0c4cc');
  const y = H - 12;
  p.tri(30, y + 3, W - 2, y - 4, W - 6, y + 1, blade);
  p.tri(30, y + 5, W - 2, y + 11, W - 6, y + 7, shade(blade, -0.15));
  p.line(32, y + 3, W - 4, y - 3, shade(blade, 0.35));
  // 손잡이 고리 (빨강)
  p.oval(14, y, 10, 5, hex('#c84a44'));
  p.oval(14, y, 6, 2.5, hex('#7a3a34'));
  p.oval(16, y + 9, 10, 4, shade(hex('#c84a44'), -0.15));
  p.oval(16, y + 9, 6, 2, hex('#7a3a34'));
  p.oval(30, y + 4, 3, 3, BRASS);
  p.outline();
  return stand(p);
}

/** 엎어진 골무 (배처럼) */
function thimbleCup(W: number, H: number): PropSprite {
  const Ht = H + 12;
  const p = new Pix(W, Ht);
  const c = hex('#b8bcc4');
  p.oval(W / 2, Ht - 8, 18, 7, shade(c, -0.3));
  p.bar(W / 2 - 16, Ht - 26, 32, 18, c);
  p.oval(W / 2, Ht - 26, 16, 6, shade(c, 0.2));
  for (let y = Ht - 24; y < Ht - 9; y += 3) for (let x = W / 2 - 14; x < W / 2 + 14; x += 3) p.set(x, y, shade(c, -0.3));
  p.outline();
  return stand(p);
}

/** 접힌 흰 약봉지 (연필 글씨 몇 줄) */
function medPouch(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const y = H - 16;
  p.rect(3, y + 2, W - 6, 12, shade(PAPER, -0.18));
  p.rect(3, y, W - 6, 12, PAPER);
  p.rect(3, y, W - 6, 2, hex('#a8c8e0'));
  for (let i = 0; i < 3; i++) p.rect(6, y + 5 + i * 2, W - 12 - i * 3, 1, PENCIL);
  p.outline();
  return stand(p);
}

/** 진료 카드 (분홍 판지 · 날짜 칸) */
function clinicCard(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const c = hex('#f0c8cc');
  const y = H - 15;
  p.rect(2, y + 2, W - 4, 11, shade(c, -0.3));
  p.rect(2, y, W - 4, 11, c);
  p.rect(2, y, W - 4, 3, hex('#c86a7a'));
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) p.rect(4 + j * 6, y + 4 + i * 2, 5, 1, j === 2 && i === 2 ? RIBBON : shade(c, -0.35));
  p.outline();
  return stand(p);
}

/** 구긴 편지지 더미 (「열다섯 살 하루에게」 쓰다 만) */
function crumpledLetters(W: number, H: number): PropSprite {
  const Ht = H + 4;
  const p = new Pix(W, Ht);
  for (const [cx, cy, r] of [[8, Ht - 7, 6], [16, Ht - 8, 7], [12, Ht - 14, 6]] as const) {
    p.ball(cx, cy, r, r * 0.85, PAPER, true);
    for (let i = 0; i < 5; i++) p.line(cx - r + hash2(i, cx, 851) * r * 2, cy - r * 0.6, cx - r + hash2(i, cy, 852) * r * 2, cy + r * 0.6, shade(PAPER, -0.18));
  }
  p.rect(5, Ht - 4, 6, 1, PENCIL);
  p.outline();
  return stand(p);
}

/** 토비 털과 같은 하얀 천 조각 (귀 수선용, 시침핀 하나) */
function whiteScrap(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const c = hex('#f0ece4');
  const y = H - 14;
  p.tri(2, y + 12, W - 2, y + 10, W - 6, y, c);
  p.tri(2, y + 12, W - 6, y, 6, y + 2, shade(c, -0.06));
  for (let x = 4; x < W - 4; x += 3) p.set(x, y + 9, STITCH);
  p.line(8, y + 3, 16, y + 7, hex('#c8ccd4'));
  p.oval(8, y + 3, 1.5, 1.5, hex('#e8c050'));
  p.outline();
  return stand(p);
}

/** 천 조각 언덕 (색색 자투리가 겹겹이) */
function fabricHill(W: number, H: number): PropSprite {
  const Ht = H + 16;
  const p = new Pix(W, Ht);
  const cols = ['#d88a7a', '#8aa0c8', '#e8d098', '#9a7ac0', '#a8c08a', '#f2e6cc', '#f0c848'].map(hex);
  for (let i = 0; i < 14; i++) {
    const x = 6 + hash2(i, 1, 861) * (W - 26);
    const y = Ht - 10 - (1 - Math.abs((x - W / 2) / (W / 2))) * 26 * hash2(i, 2, 861) - 4;
    const c = cols[i % cols.length];
    const w = 14 + hash2(i, 3, 861) * 10;
    p.rect(x, y + 2, w, 8, shade(c, -0.3));
    p.rect(x, y, w, 8, c);
    p.rect(x, y, w, 1, shade(c, 0.25));
    for (let k = x + 1; k < x + w; k += 3) p.set(k, y + 6, shade(c, 0.35));
  }
  p.outline();
  return stand(p);
}

/** 재봉틀 기름병 (긴 주둥이) */
function oilBottle(W: number, H: number): PropSprite {
  const Ht = H + 14;
  const p = new Pix(W, Ht);
  p.bar(W / 2 - 6, Ht - 22, 12, 18, hex('#5a8a6a'));
  p.oval(W / 2, Ht - 4, 6, 2, shade(hex('#5a8a6a'), -0.35));
  p.rect(W / 2 - 1, Ht - 36, 2, 14, STEEL);
  p.rect(W / 2 - 4, Ht - 16, 8, 5, PAPER);
  p.outline();
  return stand(p);
}

/** 돋보기 렌즈 조각 (반짝) */
function lensShard(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const c = hex('#b8d8e8');
  p.tri(4, H - 6, W - 4, H - 8, 12, H - 16, c);
  p.line(9, H - 12, 14, H - 9, hex('#f0f8fc'));
  p.set(12, H - 14, hex('#f8fcfc'));
  return flat(p);
}

/** 재단 분필 (납작한 삼각 분필 · 가루) */
function chalk(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  const c = hex('#d8e0ec');
  p.tri(8, H - 6, 30, H - 4, 18, H - 14, c);
  p.line(10, H - 7, 18, H - 13, shade(c, 0.12));
  for (let i = 0; i < 14; i++) p.set(20 + hash2(i, 1, 871) * 24, H - 4 - hash2(i, 2, 871) * 6, shade(c, -0.08));
  return flat(p);
}

/** 바닥에 누운 시침핀 (진주 머리) */
function pinBig(W: number, H: number): PropSprite {
  const p = new Pix(W, H);
  p.line(10, H - 8, W - 4, H - 6, hex('#c8ccd4'));
  p.line(10, H - 9, W - 6, H - 7, hex('#eceef2'));
  p.ball(7, H - 9, 5, 5, hex('#e8a0b8'));
  return flat(p);
}

/** 칸막이 나무판 위 (가로 칸막이 끝 기둥) */
function divider(W: number, H: number): PropSprite {
  const Ht = H + 10;
  const p = new Pix(W, Ht);
  block3(p, 0, Ht - 24, W, 6, 18, WOOD, 3);
  for (let y = Ht - 16; y < Ht - 4; y += 3) p.rect(1, y, W - 5, 1, shade(WOOD, -0.1));
  p.outline();
  return stand(p);
}

// ───────────────────────── 새벽 다락 ─────────────────────────

/**
 * 다락 뒷벽(atticWall:window, 4×3칸)의 둥근 창 자리에만 새벽 하늘을 덧그린다: 분홍 → 연보라, 바짝 붙은 별 둘.
 * 그림 크기 · 자리는 atticWall 과 같다 (폭 W, 높이 H+12, 창 가운데 (W/2, H+12-38)).
 */
function dawnPane(W: number, H: number): PropSprite {
  const Ht = H + 12;
  const p = new Pix(W, Ht);
  const cx = W / 2;
  const cy = Ht - 36 - 2;
  const r = 15;
  for (let y = -r; y <= r; y++)
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y > r * r) continue;
      const t = (y + r) / (2 * r);
      p.set(cx + x, cy + y, mix(hex('#8a7ab8'), hex('#f4b8b0'), t * t));
    }
  // 지평선 쪽 밝은 띠 · 구름 한 줄
  p.rect(cx - 12, cy + 9, 24, 2, hex('#f8d0a8'));
  p.rect(cx - 9, cy + 3, 10, 1, hex('#e8b8c8'));
  // 작은 별 하나, 그 옆에 바짝 붙은 별 하나
  p.set(cx + 5, cy - 8, hex('#fff4e0'));
  p.set(cx + 7, cy - 7, hex('#fff8ec'));
  p.set(cx + 7, cy - 8, hex('#f8e8d0'));
  // 창살
  p.rect(cx - r, cy - 1, 2 * r + 1, 2, hex('#c8ac80'));
  p.rect(cx - 1, cy - r, 2, 2 * r + 1, hex('#c8ac80'));
  p.rect(cx - r, cy - 1, 2 * r + 1, 1, hex('#ecd8b0'));
  return { pix: p, ox: 0, oy: -Ht, wall: true };
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
