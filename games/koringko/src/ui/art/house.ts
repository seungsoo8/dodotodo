/**
 * 사람 크기 기억 방: 벽지 · 바닥 · 가구. 방마다 꾸밈(look)이 있어 같은 하루의 방도 나이에 따라 다르게 보인다.
 * 가구 그림은 (w×h 칸) 자리의 아래쪽에 발을 두고, 키 큰 가구는 위로 솟는다.
 */
import { Pix, hash2, hex, mix, shade, type Color } from './paint.ts';

export const HT = 24;

export interface HouseLook {
  wall: Color;
  pattern: 'stars' | 'dots' | 'stripes' | 'flowers' | 'plain' | 'tiles' | 'none';
  accent: Color;
  floor: Color;
  /** 바닥 종류 */
  floorKind: 'wood' | 'tile' | 'lino' | 'grass';
  /** 걸레받이 */
  base: Color;
  /** 창밖 (낮 · 밤 · 비 · 노을) */
  sky: 'day' | 'night' | 'rain' | 'dusk';
}

export const LOOKS: Record<string, HouseLook> = {
  haru4: { wall: hex('#f8e8b0'), pattern: 'stars', accent: hex('#f0c860'), floor: hex('#c89058'), floorKind: 'wood', base: hex('#e8d0a0'), sky: 'day' },
  haru7: { wall: hex('#f8d0dc'), pattern: 'dots', accent: hex('#f0a0b8'), floor: hex('#c89058'), floorKind: 'wood', base: hex('#f0e0e8'), sky: 'dusk' },
  haru10: { wall: hex('#cfe8d8'), pattern: 'stripes', accent: hex('#b0d8c0'), floor: hex('#b8804a'), floorKind: 'wood', base: hex('#f0f0e8'), sky: 'day' },
  haru13: { wall: hex('#9ab0a8'), pattern: 'stripes', accent: hex('#8aa098'), floor: hex('#8a6040'), floorKind: 'wood', base: hex('#b8c0b8'), sky: 'night' },
  haru14: { wall: hex('#c8d0d0'), pattern: 'plain', accent: hex('#b8c0c0'), floor: hex('#a07048'), floorKind: 'wood', base: hex('#e0e0e0'), sky: 'dusk' },
  haru15: { wall: hex('#e0dcd4'), pattern: 'plain', accent: hex('#d0ccc4'), floor: hex('#a87850'), floorKind: 'wood', base: hex('#f0ece4'), sky: 'night' },
  grandma: { wall: hex('#ecdcc0'), pattern: 'flowers', accent: hex('#c8a0b8'), floor: hex('#9a6a40'), floorKind: 'wood', base: hex('#a87850'), sky: 'day' },
  grandma14: { wall: hex('#b8aa94'), pattern: 'flowers', accent: hex('#9a8494'), floor: hex('#7a5434'), floorKind: 'wood', base: hex('#8a6440'), sky: 'dusk' },
  living: { wall: hex('#f0e4cc'), pattern: 'stripes', accent: hex('#e4d4b4'), floor: hex('#b07848'), floorKind: 'wood', base: hex('#d8c098'), sky: 'rain' },
  living8: { wall: hex('#f4e8d0'), pattern: 'stripes', accent: hex('#e8d8b8'), floor: hex('#b07848'), floorKind: 'wood', base: hex('#d8c098'), sky: 'day' },
  kitchen: { wall: hex('#f4f0e4'), pattern: 'tiles', accent: hex('#d8e8f0'), floor: hex('#e8e0d0'), floorKind: 'tile', base: hex('#c8b898'), sky: 'dusk' },
  kitchenNight: { wall: hex('#c8c4bc'), pattern: 'tiles', accent: hex('#b0bcc4'), floor: hex('#b8b0a0'), floorKind: 'tile', base: hex('#9a8a70'), sky: 'night' },
  hospitalNight: { wall: hex('#9ab0b0'), pattern: 'plain', accent: hex('#8aa4a0'), floor: hex('#94a8a4'), floorKind: 'lino', base: hex('#7a9490'), sky: 'night' },
  hospital: { wall: hex('#d8ece8'), pattern: 'plain', accent: hex('#c0dcd8'), floor: hex('#c8d8d4'), floorKind: 'lino', base: hex('#a8c0bc'), sky: 'rain' },
  attic: { wall: hex('#b89060'), pattern: 'stripes', accent: hex('#a88050'), floor: hex('#a87848'), floorKind: 'wood', base: hex('#8a6038'), sky: 'dusk' },
  newroom: { wall: hex('#f4ecd8'), pattern: 'stars', accent: hex('#ecdcb8'), floor: hex('#c89868'), floorKind: 'wood', base: hex('#e8dcc0'), sky: 'day' },
  bath: { wall: hex('#e8f0f4'), pattern: 'tiles', accent: hex('#c8dce8'), floor: hex('#d8e4ec'), floorKind: 'tile', base: hex('#a8c0d0'), sky: 'day' },
  bathNight: { wall: hex('#a8b8c8'), pattern: 'tiles', accent: hex('#94a8bc'), floor: hex('#9aacbc'), floorKind: 'tile', base: hex('#7a90a4'), sky: 'night' },
  yardDay: { wall: hex('#6aa05a'), pattern: 'none', accent: hex('#5a904a'), floor: hex('#78b062'), floorKind: 'grass', base: hex('#5a904a'), sky: 'day' },
  yardNight: { wall: hex('#2a4a3a'), pattern: 'none', accent: hex('#24402f'), floor: hex('#36583e'), floorKind: 'grass', base: hex('#24402f'), sky: 'night' },
  balcony: { wall: hex('#e8dcc8'), pattern: 'plain', accent: hex('#d8ccb8'), floor: hex('#c8a078'), floorKind: 'wood', base: hex('#b89870'), sky: 'day' },
  gmNight: { wall: hex('#8a7c6a'), pattern: 'flowers', accent: hex('#7a6a7a'), floor: hex('#6a4a30'), floorKind: 'wood', base: hex('#5a4030'), sky: 'night' },
  clinic: { wall: hex('#e4ecea'), pattern: 'plain', accent: hex('#d0dcda'), floor: hex('#d0dcd8'), floorKind: 'lino', base: hex('#a8bcb8'), sky: 'day' },
  yard: { wall: hex('#6a9a5a'), pattern: 'none', accent: hex('#5a8a4a'), floor: hex('#6aa058'), floorKind: 'grass', base: hex('#5a8a4a'), sky: 'rain' },
};

export function lookOf(id: string | undefined): HouseLook {
  return LOOKS[id ?? ''] ?? LOOKS.haru10;
}

/** 벽 한 칸. bottom: 바닥과 닿는 줄 (걸레받이) */
export function wallTile(L: HouseLook, tx: number, ty: number, bottom: boolean, topRow: boolean): Pix {
  const p = new Pix(HT, HT);
  if (L.floorKind === 'grass') {
    // 마당: 울타리 너머 덤불
    p.rect(0, 0, HT, HT, shade(L.wall, -0.15));
    for (let i = 0; i < 9; i++) p.ball(hash2(tx, i, 3) * HT, hash2(ty, i, 4) * HT, 4 + hash2(i, tx, ty) * 3, 4, shade(L.wall, (hash2(i, ty, 9) - 0.5) * 0.3), true);
    return p;
  }
  p.rect(0, 0, HT, HT, L.wall);
  const gx = tx * HT;
  const gy = ty * HT;
  for (let y = 0; y < HT; y++)
    for (let x = 0; x < HT; x++) {
      const X = gx + x;
      const Y = gy + y;
      let c: Color | null = null;
      switch (L.pattern) {
        case 'stripes':
          if (X % 12 < 5) c = L.accent;
          break;
        case 'dots':
          if ((X + (Math.floor(Y / 12) % 2) * 6) % 12 === 0 && Y % 12 === 4) c = L.accent;
          if ((X + (Math.floor(Y / 12) % 2) * 6) % 12 === 1 && Y % 12 === 4) c = L.accent;
          break;
        case 'stars': {
          const sx = (X + (Math.floor(Y / 16) % 2) * 8) % 16;
          const sy = Y % 16;
          if ((sx === 8 && sy >= 5 && sy <= 9) || (sy === 7 && sx >= 6 && sx <= 10)) c = L.accent;
          break;
        }
        case 'flowers': {
          const fx = (X + (Math.floor(Y / 14) % 2) * 7) % 14;
          const fy = Y % 14;
          if (Math.abs(fx - 7) + Math.abs(fy - 7) === 1) c = L.accent;
          if (fx === 7 && fy === 7) c = hex('#e8c860');
          break;
        }
        case 'tiles':
          if (X % 12 === 0 || Y % 12 === 0) c = L.accent;
          break;
        default:
          if (hash2(X, Y, 5) < 0.04) c = shade(L.wall, -0.04);
      }
      if (c !== null) p.set(x, y, c);
    }
  if (topRow) p.rect(0, 0, HT, 2, shade(L.wall, -0.25));
  if (bottom) {
    // 걸레받이 + 벽 아래 그늘
    p.rect(0, HT - 7, HT, 5, L.base);
    p.rect(0, HT - 7, HT, 1, shade(L.base, 0.25));
    p.rect(0, HT - 2, HT, 2, shade(L.base, -0.35));
  }
  return p;
}

/** 바닥 한 칸 (이웃 칸과 이어지는 무늬) */
export function floorTile(L: HouseLook, tx: number, ty: number): Pix {
  const p = new Pix(HT, HT);
  const f = L.floor;
  const gx = tx * HT;
  const gy = ty * HT;
  for (let y = 0; y < HT; y++)
    for (let x = 0; x < HT; x++) {
      const X = gx + x;
      const Y = gy + y;
      let c = f;
      if (L.floorKind === 'wood') {
        // 가로 널빤지: 8px 줄, 널마다 길이 · 결 · 밝기가 다르다
        const row = Math.floor(Y / 8);
        const off = Math.floor(hash2(row, 0, 11) * 40);
        const plank = Math.floor((X + off) / 40);
        c = shade(f, (hash2(row, plank, 12) - 0.5) * 0.14);
        if (Y % 8 === 0) c = shade(f, -0.22);
        else if ((X + off) % 40 === 0) c = shade(f, -0.18);
        else if (hash2(X >> 2, Y, 13) < 0.06) c = shade(c, -0.07);
      } else if (L.floorKind === 'tile') {
        const odd = (Math.floor(X / 12) + Math.floor(Y / 12)) % 2;
        c = odd ? shade(f, -0.06) : f;
        if (X % 12 === 0 || Y % 12 === 0) c = shade(f, -0.16);
      } else if (L.floorKind === 'lino') {
        c = hash2(X, Y, 3) < 0.05 ? shade(f, -0.06) : f;
        if (Y % 24 === 0) c = shade(f, -0.08);
      } else {
        c = shade(f, (hash2(X >> 1, Y >> 1, 21) - 0.5) * 0.16);
        if (hash2(X, Y, 22) < 0.04) c = shade(f, 0.2);
      }
      p.set(x, y, c);
    }
  return p;
}

// ───────────────────────── 가구 ─────────────────────────

export interface FurnSprite {
  pix: Pix;
  /** 칸 자리 (x*HT, (y+h)*HT) 에서 그림 왼쪽 위까지 */
  ox: number;
  oy: number;
  /** 벽에 붙은 것 (인물보다 늘 뒤) */
  wall: boolean;
}

const WOODF = hex('#a8703c');
const WHITE = hex('#f8f4ec');
const INK = hex('#2a1c24');

function box(p: Pix, x: number, y: number, w: number, h: number, c: Color): void {
  p.rect(x, y, w, h, c);
  p.rect(x, y, w, 1, shade(c, 0.25));
  p.rect(x, y + h - 1, w, 1, shade(c, -0.3));
  p.rect(x + w - 1, y, 1, h, shade(c, -0.18));
}

/** 가구 그림. opt: 색 · 열림 같은 꾸밈 */
export function furnitureSprite(kind: string, w: number, h: number, look: HouseLook, opt = ''): FurnSprite {
  const W = w * HT;
  const H = h * HT;
  const tall = (extra: number) => new Pix(W, H + extra);
  switch (kind) {
    case 'bed': {
      // 위에서 본 침대: 머리판 · 베개 · 이불 (opt: 이불 색)
      const p = tall(10);
      const quilt = opt ? hex(opt) : hex('#f0a0a8');
      box(p, 2, 0, W - 4, 14, WOODF);
      p.rect(4, 2, W - 8, 2, shade(WOODF, 0.2));
      box(p, 2, 10, W - 4, H - 2, hex('#f4ecdc'));
      p.oval(W / 2, 20, W / 2 - 7, 5, WHITE);
      p.rect(W / 2 - (W / 2 - 7), 21, W - 14, 1, shade(WHITE, -0.1));
      box(p, 3, 28, W - 6, H - 20, quilt);
      for (let y = 32; y < H + 6; y += 7) p.rect(4, y, W - 8, 1, shade(quilt, -0.12));
      p.rect(3, 28, W - 6, 3, shade(quilt, 0.2));
      box(p, 2, H + 4, W - 4, 6, WOODF);
      return { pix: p.outline(), ox: 0, oy: -(H + 10), wall: false };
    }
    case 'crib': {
      const p = tall(14);
      box(p, 2, 4, W - 4, H + 6, hex('#f8f0e0'));
      p.oval(W / 2, 16, W / 2 - 8, 4, WHITE);
      box(p, 5, 22, W - 10, H - 14, hex('#ffe08a'));
      for (let x = 2; x < W - 2; x += 5) p.rect(x, 0, 2, H + 14, hex('#e8d0a8'));
      p.rect(0, 0, W, 3, hex('#d8b888'));
      p.rect(0, H + 11, W, 3, hex('#d8b888'));
      return { pix: p.outline(), ox: 0, oy: -(H + 14), wall: false };
    }
    case 'desk': {
      const p = tall(22);
      box(p, 0, 14, W, 12, WOODF);
      p.rect(2, 26, 3, H - 6, shade(WOODF, -0.2));
      p.rect(W - 5, 26, 3, H - 6, shade(WOODF, -0.2));
      box(p, W - 22, 26, 17, 12, shade(WOODF, -0.05));
      p.rect(W - 15, 31, 4, 1, hex('#e8c860'));
      // 책상 위: 스탠드 · 공책 · (opt 'jar' 종이별 병)
      p.rect(6, 4, 2, 12, hex('#5a6a8a'));
      p.tri(1, 6, 13, 6, 7, 0, hex('#4a78d8'));
      p.rect(3, 15, 8, 2, hex('#5a6a8a'));
      box(p, 16, 10, 14, 6, hex('#f4f0e4'));
      p.rect(18, 12, 9, 1, hex('#a8c0e0'));
      if (opt.includes('jar')) starJar(p, W - 14, 0);
      return { pix: p.outline(), ox: 0, oy: -(H + 22), wall: false };
    }
    case 'chair': {
      const p = tall(16);
      box(p, 3, 0, W - 6, 18, WOODF);
      box(p, 2, 16, W - 4, 8, shade(WOODF, 0.1));
      p.rect(4, 24, 2, H - 8, shade(WOODF, -0.25));
      p.rect(W - 6, 24, 2, H - 8, shade(WOODF, -0.25));
      return { pix: p.outline(), ox: 0, oy: -(H + 16), wall: false };
    }
    case 'shelf': {
      // 키 큰 책장 (벽에 붙어 위로 솟는다)
      const p = tall(30);
      box(p, 0, 0, W, H + 30, WOODF);
      const rows = 4;
      const rh = (H + 26) / rows;
      for (let r = 0; r < rows; r++) {
        const y = Math.round(3 + r * rh);
        p.rect(3, y, W - 6, Math.round(rh) - 3, shade(WOODF, -0.45));
        let x = 4;
        while (x < W - 6) {
          const bw = 3 + Math.floor(hash2(x, r, 2) * 3);
          const bh = Math.round(rh) - 4 - Math.floor(hash2(x, r, 3) * 3);
          const col = [hex('#d85a5a'), hex('#5a8ad8'), hex('#e8c860'), hex('#6ab06a'), hex('#a87ad0'), hex('#f0f0e0')][Math.floor(hash2(x, r, 4) * 6)];
          if (!(opt.includes('jar') && r === 1 && x > W / 2)) p.rect(x, y + Math.round(rh) - 3 - bh, bw, bh, col);
          x += bw + 1;
        }
        p.rect(2, y + Math.round(rh) - 3, W - 4, 2, shade(WOODF, 0.15));
      }
      if (opt.includes('jar')) starJar(p, W - 16, Math.round(3 + rh) - 2);
      return { pix: p.outline(), ox: 0, oy: -(H + 30), wall: true };
    }
    case 'wardrobe': {
      const p = tall(34);
      box(p, 0, 0, W, H + 34, hex('#c8905a'));
      p.rect(W / 2, 3, 1, H + 28, shade(WOODF, -0.4));
      p.rect(W / 2 - 4, (H + 34) / 2, 2, 5, hex('#e8c860'));
      p.rect(W / 2 + 3, (H + 34) / 2, 2, 5, hex('#e8c860'));
      return { pix: p.outline(), ox: 0, oy: -(H + 34), wall: true };
    }
    case 'toybox': {
      const p = tall(10);
      const col = hex('#5a9ae8');
      box(p, 1, 10, W - 2, H - 2, col);
      p.rect(4, 16, W - 8, 2, hex('#ffd84a'));
      if (opt.includes('open')) {
        box(p, 1, 0, W - 2, 11, shade(col, -0.1));
        // 삐져나온 장난감
        p.ball(10, 12, 4, 4, hex('#e85a5a'));
        p.ball(W - 12, 11, 4, 4, hex('#6ab06a'));
      } else box(p, 0, 6, W, 6, shade(col, 0.15));
      if (opt.includes('label')) {
        box(p, W / 2 - 10, 20, 20, 8, hex('#f8f0d8'));
        p.rect(W / 2 - 7, 23, 14, 1, INK);
      }
      return { pix: p.outline(), ox: 0, oy: -(H + 10), wall: false };
    }
    case 'window': {
      // 벽에 난 창: 하늘 · 커튼 (opt: 하늘 덮어쓰기)
      const p = new Pix(W, H);
      const sky = (opt || look.sky) as HouseLook['sky'];
      box(p, 0, 0, W, H, WHITE);
      const top: Color = sky === 'night' ? hex('#1a2048') : sky === 'dusk' ? hex('#f0906a') : sky === 'rain' ? hex('#6a7a8a') : hex('#8ac8f0');
      const bot: Color = sky === 'night' ? hex('#3a3a78') : sky === 'dusk' ? hex('#f8d08a') : sky === 'rain' ? hex('#8a98a8') : hex('#d0ecff');
      for (let y = 3; y < H - 3; y++) p.rect(3, y, W - 6, 1, mix(top, bot, (y - 3) / (H - 6)));
      if (sky === 'night') {
        for (let i = 0; i < 8; i++) p.set(4 + hash2(i, 1, 2) * (W - 8), 4 + hash2(i, 2, 3) * (H - 10), hex('#ffffff'));
        p.ball(W - 12, 9, 4, 4, hex('#fff4c0'), true);
      } else if (sky === 'rain') {
        for (let i = 0; i < 14; i++) {
          const x = 4 + Math.floor(hash2(i, 5, 6) * (W - 8));
          const y = 4 + Math.floor(hash2(i, 7, 8) * (H - 12));
          p.rect(x, y, 1, 3, hex('#c8d8e8'));
        }
      } else if (sky === 'day') {
        p.oval(12, 10, 7, 3, WHITE);
        p.oval(16, 8, 5, 3, WHITE);
      }
      p.rect(W / 2 - 1, 2, 2, H - 4, WHITE);
      p.rect(2, H / 2 - 1, W - 4, 2, WHITE);
      // 커튼
      const cur = shade(look.accent, -0.1);
      p.rect(0, 0, 6, H, cur);
      p.rect(W - 6, 0, 6, H, cur);
      for (let y = 0; y < H; y += 3) {
        p.set(2, y, shade(cur, -0.2));
        p.set(W - 3, y, shade(cur, -0.2));
      }
      p.rect(0, H - 3, W, 3, shade(WHITE, -0.1));
      return { pix: p.outline(), ox: 0, oy: -H, wall: true };
    }
    case 'door': {
      const p = new Pix(W, H);
      box(p, 0, 0, W, H, hex('#b07a48'));
      box(p, 4, 4, W - 8, H / 2 - 6, shade(hex('#b07a48'), 0.08));
      box(p, 4, H / 2 + 2, W - 8, H / 2 - 6, shade(hex('#b07a48'), 0.08));
      p.ball(W - 7, H / 2, 2, 2, hex('#e8c860'));
      if (opt.includes('closed')) {
        // 할머니 방: 굳게 닫힌 문, 이름표
        box(p, W / 2 - 7, 8, 14, 6, hex('#f8f0d8'));
      }
      return { pix: p.outline(), ox: 0, oy: -H, wall: true };
    }
    case 'rug': {
      const p = new Pix(W, H);
      const c = opt ? hex(opt) : hex('#c86a7a');
      p.oval(W / 2, H / 2, W / 2 - 1, H / 2 - 1, shade(c, -0.15));
      p.oval(W / 2, H / 2, W / 2 - 3, H / 2 - 3, c);
      p.oval(W / 2, H / 2, W / 2 - 7, H / 2 - 6, shade(c, 0.15));
      p.oval(W / 2, H / 2, W / 2 - 10, H / 2 - 9, c);
      return { pix: p, ox: 0, oy: -H, wall: true };
    }
    case 'table': {
      const p = tall(8);
      const cloth = opt.includes('cloth') ? hex('#f8f0f4') : WOODF;
      box(p, 0, 0, W, H - 2, cloth);
      if (opt.includes('cloth')) for (let x = 2; x < W; x += 6) p.rect(x, H - 4, 3, 4, shade(cloth, -0.08));
      p.rect(3, H - 2, 3, 10, shade(WOODF, -0.25));
      p.rect(W - 6, H - 2, 3, 10, shade(WOODF, -0.25));
      if (opt.includes('cake')) cake(p, W / 2 - 12, 4, opt.includes('out'));
      if (opt.includes('phone')) phone(p, W / 2 - 6, 6);
      if (opt.includes('tea')) {
        box(p, 8, 8, 8, 6, WHITE);
        box(p, W - 16, 8, 8, 6, WHITE);
      }
      return { pix: p.outline(), ox: 0, oy: -(H + 8), wall: false };
    }
    case 'sofa': {
      const p = tall(14);
      const c = opt ? hex(opt) : hex('#c8705a');
      box(p, 0, 0, W, 16, shade(c, -0.08));
      box(p, 0, 12, 8, H - 4, c);
      box(p, W - 8, 12, 8, H - 4, c);
      box(p, 7, 14, W - 14, H - 8, shade(c, 0.1));
      for (let x = 7 + (W - 14) / 3; x < W - 8; x += (W - 14) / 3) p.rect(Math.round(x), 14, 1, H - 8, shade(c, -0.15));
      return { pix: p.outline(), ox: 0, oy: -(H + 14), wall: false };
    }
    case 'tv': {
      const p = tall(16);
      box(p, 0, 16, W, H - 2, WOODF);
      box(p, 4, 0, W - 8, 18, hex('#2a2a32'));
      p.rect(6, 2, W - 12, 13, hex('#3a4a5a'));
      p.rect(7, 3, 6, 2, hex('#6a7a8a'));
      return { pix: p.outline(), ox: 0, oy: -(H + 16), wall: true };
    }
    case 'plant': {
      const p = tall(18);
      box(p, W / 2 - 6, H + 4, 12, 12, hex('#c8704a'));
      for (let i = 0; i < 7; i++) p.ball(W / 2 + (hash2(i, 1, 1) - 0.5) * 14, 6 + hash2(i, 2, 2) * (H + 2), 5, 4, shade(hex('#4a9a4a'), (hash2(i, 3, 3) - 0.5) * 0.4), true);
      return { pix: p.outline(), ox: 0, oy: -(H + 18), wall: false };
    }
    case 'boxes': {
      // 이삿짐 상자 더미 (opt 'tape': 테이프 · 'label': 두고 가는 짐 쪽지)
      const p = tall(16);
      const card = hex('#c89a64');
      box(p, 0, 16, W, H, card);
      box(p, 4, 0, W - 8, 18, shade(card, 0.08));
      p.rect(W / 2 - 2, 0, 4, 18, hex('#d8c098'));
      p.rect(W / 2 - 2, 16, 4, H, hex('#d8c098'));
      if (opt.includes('label')) {
        box(p, 4, 24, 16, 10, hex('#fff8b0'));
        p.rect(6, 27, 11, 1, INK);
        p.rect(6, 30, 8, 1, INK);
      }
      return { pix: p.outline(), ox: 0, oy: -(H + 16), wall: false };
    }
    case 'sewing': {
      // 할머니 재봉틀 (opt 'dust': 먼지 덮개)
      const p = tall(14);
      box(p, 0, 12, W, H, WOODF);
      p.rect(3, H + 6, 3, 8, shade(WOODF, -0.3));
      p.rect(W - 6, H + 6, 3, 8, shade(WOODF, -0.3));
      const m = hex('#2a2a36');
      box(p, 8, 0, W - 22, 8, m);
      box(p, W - 18, 0, 8, 16, m);
      box(p, 8, 0, 6, 16, m);
      p.rect(10, 3, 10, 1, hex('#e8c860'));
      p.ball(W - 14, 5, 3, 3, hex('#d8d0c0'));
      if (opt.includes('thread')) {
        p.rect(W - 8, 6, 3, 6, hex('#e85a6a'));
        p.rect(W - 8, 6, 3, 1, shade(hex('#e85a6a'), 0.3));
      }
      if (opt.includes('dust')) for (let i = 0; i < 40; i++) p.set(hash2(i, 1, 5) * W, hash2(i, 2, 5) * 16, hex('#d8d0c8'));
      return { pix: p.outline(), ox: 0, oy: -(H + 14), wall: false };
    }
    case 'photo': {
      const p = new Pix(W, H);
      box(p, 2, 2, W - 4, H - 4, hex('#8a5a3a'));
      p.rect(5, 5, W - 10, H - 10, hex('#f0e4c8'));
      // 사진 속 두 사람 (할머니와 하루)
      p.ball(W / 2 - 4, H / 2 - 1, 3, 3, hex('#e8e4ec'));
      p.rect(W / 2 - 7, H / 2 + 2, 6, H / 2 - 8, hex('#a88ad0'));
      p.ball(W / 2 + 4, H / 2 + 1, 2.5, 2.5, hex('#4a3226'));
      p.rect(W / 2 + 2, H / 2 + 3, 5, H / 2 - 9, hex('#ffd25a'));
      return { pix: p.outline(), ox: 0, oy: -H, wall: true };
    }
    case 'clock': {
      const p = new Pix(W, H);
      p.ball(W / 2, H / 2, W / 2 - 3, H / 2 - 3, hex('#f4ecdc'), true);
      p.line(W / 2, H / 2, W / 2, H / 2 - 6, INK);
      p.line(W / 2, H / 2, W / 2 + 4, H / 2, INK);
      return { pix: p.outline(), ox: 0, oy: -H, wall: true };
    }
    case 'garland': {
      // 생일 깃발 줄
      const p = new Pix(W, H);
      for (let x = 0; x < W; x++) p.set(x, 3 + Math.round(Math.sin((x / W) * Math.PI) * 6), INK);
      const cs = [hex('#f06a7a'), hex('#ffd84a'), hex('#6ac8f0'), hex('#8ad06a')];
      for (let i = 0, x = 4; x < W - 6; x += 9, i++) {
        const y = 4 + Math.round(Math.sin((x / W) * Math.PI) * 6);
        p.tri(x, y, x + 7, y, x + 3.5, y + 8, cs[i % 4]);
      }
      return { pix: p, ox: 0, oy: -H, wall: true };
    }
    case 'hbed': {
      // 병원 침대 (opt 'gm': 할머니가 누워 있다)
      const p = tall(16);
      box(p, 0, 0, W, 10, hex('#c8d0d8'));
      box(p, 0, 8, W, H + 4, WHITE);
      p.oval(W / 2, 16, W / 2 - 8, 4, hex('#ffffff'));
      box(p, 2, 24, W - 4, H - 12, hex('#a8c8e8'));
      if (opt.includes('gm')) {
        p.ball(W / 2, 15, 5, 5, hex('#f0ccb0'), true);
        p.oval(W / 2, 11, 6, 3, hex('#e8e4ec'));
        p.rect(W / 2 - 2, 15, 1, 1, INK);
        p.rect(W / 2 + 1, 15, 1, 1, INK);
      }
      p.rect(2, H + 10, 3, 6, hex('#8a9098'));
      p.rect(W - 5, H + 10, 3, 6, hex('#8a9098'));
      return { pix: p.outline(), ox: 0, oy: -(H + 16), wall: false };
    }
    case 'iv': {
      const p = tall(30);
      p.rect(W / 2, 4, 1, H + 24, hex('#a8b0b8'));
      box(p, W / 2 - 4, 2, 9, 12, hex('#e8f4ff'));
      p.rect(W / 2 - 5, H + 26, 11, 2, hex('#8a9098'));
      return { pix: p.outline(), ox: 0, oy: -(H + 30), wall: false };
    }
    case 'fence': {
      const p = tall(6);
      const c = hex('#f0ece0');
      for (let x = 1; x < W; x += 6) {
        p.rect(x, 0, 4, H + 6, c);
        p.tri(x, 0, x + 4, 0, x + 2, -3, c);
      }
      p.rect(0, 6, W, 3, shade(c, -0.08));
      p.rect(0, H - 2, W, 3, shade(c, -0.08));
      return { pix: p.outline(), ox: 0, oy: -(H + 6), wall: false };
    }
    case 'flowers': {
      const p = new Pix(W, H);
      box(p, 0, H - 10, W, 10, hex('#8a5a3a'));
      for (let i = 0; i < W / 5; i++) {
        const x = 3 + i * 5;
        p.rect(x, H - 16, 1, 7, hex('#4a8a3a'));
        p.ball(x, H - 17, 2, 2, [hex('#f06a8a'), hex('#ffd84a'), hex('#ffffff')][i % 3], true);
      }
      return { pix: p.outline(), ox: 0, oy: -H, wall: false };
    }
    case 'puddle': {
      const p = new Pix(W, H);
      p.oval(W / 2, H / 2, W / 2 - 1, H / 2 - 3, hex('#7a8aa0'));
      p.oval(W / 2 - 3, H / 2 - 1, W / 4, 2, hex('#a8b8cc'));
      return { pix: p, ox: 0, oy: -H, wall: true };
    }
    case 'mud': {
      const p = new Pix(W, H);
      p.oval(W / 2, H / 2, W / 2 - 1, H / 2 - 2, hex('#6a4a30'));
      p.oval(W / 2 + 2, H / 2, W / 3, H / 4, hex('#7a5a3a'));
      return { pix: p, ox: 0, oy: -H, wall: true };
    }
    case 'bush': {
      const p = tall(10);
      for (let i = 0; i < 8; i++) p.ball(6 + hash2(i, w, 1) * (W - 12), 8 + hash2(i, h, 2) * (H - 4), 7, 6, shade(hex('#4a8a4a'), (hash2(i, 3, 4) - 0.5) * 0.4), true);
      return { pix: p.outline(), ox: 0, oy: -(H + 10), wall: false };
    }
    case 'stage': {
      // 인형극 무대 (상자로 만든)
      const p = tall(30);
      box(p, 0, 22, W, H + 8, hex('#c8905a'));
      box(p, 0, 0, W, 10, hex('#d85a5a'));
      for (let x = 0; x < W; x += 6) p.tri(x, 10, x + 6, 10, x + 3, 15, hex('#d85a5a'));
      p.rect(3, 10, 5, 14, hex('#b84a4a'));
      p.rect(W - 8, 10, 5, 14, hex('#b84a4a'));
      p.rect(8, 14, W - 16, 9, hex('#2a2030'));
      return { pix: p.outline(), ox: 0, oy: -(H + 30), wall: false };
    }
    case 'bathtub': {
      const p = tall(10);
      box(p, 0, 0, W, H + 10, hex('#f4f8fa'));
      p.rect(4, 4, W - 8, H, hex('#9ad0e8'));
      p.rect(4, 4, W - 8, 3, hex('#c8eaf8'));
      if (opt.includes('bubble')) for (let i = 0; i < 14; i++) p.ball(6 + ((i * 13) % (W - 12)), 6 + ((i * 7) % (H - 4)), 3, 3, hex('#ffffff'), true);
      p.rect(W - 10, 0, 4, 6, hex('#c8d0d8'));
      return { pix: p.outline(), ox: 0, oy: -(H + 10), wall: false };
    }
    case 'sink': {
      const p = tall(20);
      box(p, 2, 14, W - 4, H + 4, hex('#f4f8fa'));
      p.oval(W / 2, 20, W / 2 - 6, 4, hex('#c8dce8'));
      p.rect(W / 2 - 1, 8, 2, 8, hex('#c8d0d8'));
      box(p, 4, 0, W - 8, 10, hex('#d8eef8'));
      return { pix: p.outline(), ox: 0, oy: -(H + 20), wall: true };
    }
    case 'bike': {
      const p = tall(8);
      const c = opt ? hex(opt) : hex('#e85a6a');
      for (const cx of [8, W - 8]) {
        p.oval(cx, H, 7, 7, hex('#3a3a42'));
        p.oval(cx, H, 5, 5, -1 as never);
        p.oval(cx, H, 1, 1, hex('#c8c8d0'));
      }
      p.line(8, H, W / 2, H - 6, c);
      p.line(W / 2, H - 6, W - 8, H, c);
      p.line(W / 2, H - 6, W - 10, H - 10, c);
      p.rect(6, H - 9, 6, 2, hex('#3a3a42'));
      p.rect(W - 12, H - 12, 6, 2, hex('#3a3a42'));
      return { pix: p.outline(), ox: 0, oy: -(H + 8), wall: false };
    }
    case 'railing': {
      const p = tall(6);
      const c = hex('#f0ece0');
      p.rect(0, 2, W, 3, c);
      for (let x = 1; x < W; x += 5) p.rect(x, 4, 2, H + 2, shade(c, -0.06));
      p.rect(0, H + 2, W, 2, shade(c, -0.12));
      return { pix: p.outline(), ox: 0, oy: -(H + 6), wall: true };
    }
    case 'stool': {
      const p = tall(6);
      box(p, 2, 0, W - 4, 6, WOODF);
      p.rect(4, 6, 2, H, shade(WOODF, -0.25));
      p.rect(W - 6, 6, 2, H, shade(WOODF, -0.25));
      return { pix: p.outline(), ox: 0, oy: -(H + 6), wall: false };
    }
    case 'pots': {
      const p = tall(14);
      for (let i = 0; i < Math.max(1, w); i++) {
        const x = i * HT + 4;
        box(p, x, H + 2, 16, 12, hex('#c8704a'));
        p.rect(x + 7, H - 8, 2, 10, hex('#4a8a3a'));
        p.ball(x + 8, H - 9, 4, 4, [hex('#f06a8a'), hex('#ffd84a'), hex('#a88ad0')][i % 3], true);
      }
      return { pix: p.outline(), ox: 0, oy: -(H + 14), wall: false };
    }
    case 'cushion': {
      const p = new Pix(W, H);
      p.oval(W / 2, H / 2 + 2, W / 2 - 2, H / 2 - 5, hex('#e8a0a0'));
      p.oval(W / 2 - 2, H / 2, W / 3, 3, hex('#f4c0c0'));
      return { pix: p.outline(), ox: 0, oy: -H, wall: false };
    }
    case 'calendar': {
      const p = new Pix(W, H);
      box(p, 3, 2, W - 6, H - 4, WHITE);
      p.rect(3, 2, W - 6, 4, hex('#e05a5a'));
      for (let y = 9; y < H - 4; y += 3) for (let x = 5; x < W - 5; x += 3) p.set(x, y, hex('#a8a0a0'));
      if (opt.includes('x')) p.line(5, 9, W - 6, H - 5, hex('#e05a5a'));
      return { pix: p.outline(), ox: 0, oy: -H, wall: true };
    }
    default: {
      const p = new Pix(W, H);
      box(p, 0, 0, W, H, hex('#c0a080'));
      return { pix: p.outline(), ox: 0, oy: -H, wall: false };
    }
  }
}

/** 종이별이 가득한 유리병 */
function starJar(p: Pix, x: number, y: number): void {
  const glass = hex('#d8f0f8');
  p.rect(x, y + 3, 12, 14, glass);
  p.rect(x + 2, y, 8, 3, hex('#e8c860'));
  const cs = [hex('#ffe07a'), hex('#ff9ec7'), hex('#8ad0ff'), hex('#b8f08a'), hex('#ffb070')];
  for (let i = 0; i < 26; i++) p.set(x + 1 + Math.floor(hash2(i, 1, 9) * 10), y + 6 + Math.floor(hash2(i, 2, 9) * 10), cs[i % cs.length]);
  p.rect(x + 1, y + 4, 1, 10, hex('#ffffff'));
}

function cake(p: Pix, x: number, y: number, out: boolean): void {
  box(p, x, y + 10, 24, 10, hex('#fff0f4'));
  p.rect(x, y + 10, 24, 3, hex('#f8a0b8'));
  for (let i = 0; i < 7; i++) {
    const cx = x + 2 + i * 3;
    p.rect(cx, y + 4, 1, 6, [hex('#8ad0ff'), hex('#ffd84a'), hex('#f06a8a')][i % 3]);
    if (!out) {
      p.set(cx, y + 2, hex('#ffd84a'));
      p.set(cx, y + 3, hex('#ff8a3a'));
    }
  }
}

function phone(p: Pix, x: number, y: number): void {
  box(p, x, y + 4, 12, 7, hex('#e8e0d0'));
  box(p, x - 1, y, 14, 4, hex('#f0e8d8'));
  p.rect(x + 3, y + 6, 6, 3, hex('#a8a090'));
}

/** 바닥에 까는 것 (인물보다 늘 아래) */
export const FLAT = new Set(['rug', 'puddle', 'mud']);
