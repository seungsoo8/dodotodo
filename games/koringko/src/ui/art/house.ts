/**
 * 사람 크기 기억 방: 벽지 · 바닥 · 가구. 방마다 꾸밈(look)이 있어 같은 하루의 방도 나이에 따라 다르게 보인다.
 * 가구 그림은 (w×h 칸) 자리의 아래쪽에 발을 두고, 키 큰 가구는 위로 솟는다.
 */
import { Pix, hash2, hex, mix, shade, type Color } from './paint.ts';
import { propSprite } from './houseProps.ts';

export const HT = 24;

export interface HouseLook {
  wall: Color;
  pattern: 'stars' | 'dots' | 'stripes' | 'flowers' | 'plain' | 'tiles' | 'none';
  accent: Color;
  floor: Color;
  /** 바닥 종류 */
  floorKind: 'wood' | 'tile' | 'lino' | 'grass' | 'asphalt' | 'paving' | 'sand' | 'dirt';
  /** 걸레받이 */
  base: Color;
  /** 창밖 (낮 · 밤 · 비 · 노을) */
  sky: 'day' | 'night' | 'rain' | 'dusk';
  /** 다락: 양옆 벽 두께(X) 대신 경사 천장이 바닥까지 내려온 낮은 구석 (eaveTile) */
  eaves?: boolean;
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
  attic: { wall: hex('#b89060'), pattern: 'stripes', accent: hex('#a88050'), floor: hex('#a87848'), floorKind: 'wood', base: hex('#8a6038'), sky: 'dusk', eaves: true },
  newroom: { wall: hex('#f4ecd8'), pattern: 'stars', accent: hex('#ecdcb8'), floor: hex('#c89868'), floorKind: 'wood', base: hex('#e8dcc0'), sky: 'day' },
  bath: { wall: hex('#e8f0f4'), pattern: 'tiles', accent: hex('#c8dce8'), floor: hex('#d8e4ec'), floorKind: 'tile', base: hex('#a8c0d0'), sky: 'day' },
  bathNight: { wall: hex('#a8b8c8'), pattern: 'tiles', accent: hex('#94a8bc'), floor: hex('#9aacbc'), floorKind: 'tile', base: hex('#7a90a4'), sky: 'night' },
  yardDay: { wall: hex('#6aa05a'), pattern: 'none', accent: hex('#5a904a'), floor: hex('#78b062'), floorKind: 'grass', base: hex('#5a904a'), sky: 'day' },
  yardNight: { wall: hex('#2a4a3a'), pattern: 'none', accent: hex('#24402f'), floor: hex('#36583e'), floorKind: 'grass', base: hex('#24402f'), sky: 'night' },
  balcony: { wall: hex('#e8dcc8'), pattern: 'plain', accent: hex('#d8ccb8'), floor: hex('#c8a078'), floorKind: 'wood', base: hex('#b89870'), sky: 'day' },
  gmNight: { wall: hex('#8a7c6a'), pattern: 'flowers', accent: hex('#7a6a7a'), floor: hex('#6a4a30'), floorKind: 'wood', base: hex('#5a4030'), sky: 'night' },
  clinic: { wall: hex('#e4ecea'), pattern: 'plain', accent: hex('#d0dcda'), floor: hex('#d0dcd8'), floorKind: 'lino', base: hex('#a8bcb8'), sky: 'day' },
  // 할머니가 젊었을 적 옛집 (장판 · 창호지)
  oldhome: { wall: hex('#f0e4c8'), pattern: 'plain', accent: hex('#e0d0a8'), floor: hex('#d8a858'), floorKind: 'lino', base: hex('#8a6a40'), sky: 'day' },
  oldhomeNight: { wall: hex('#a89a80'), pattern: 'plain', accent: hex('#988a70'), floor: hex('#9a7a40'), floorKind: 'lino', base: hex('#5a4a30'), sky: 'night' },
  // 놀이공원 인형 뽑기 가게
  arcade: { wall: hex('#4a3a6a'), pattern: 'stars', accent: hex('#e868a8'), floor: hex('#5a4a7a'), floorKind: 'tile', base: hex('#2a2040'), sky: 'night' },
  // 해 질 녘 앞마당 (서장)
  yardDusk: { wall: hex('#5a6a4a'), pattern: 'none', accent: hex('#4a5a3e'), floor: hex('#7a9a5a'), floorKind: 'grass', base: hex('#4a5a3e'), sky: 'dusk' },
  yard: { wall: hex('#6a9a5a'), pattern: 'none', accent: hex('#5a8a4a'), floor: hex('#6aa058'), floorKind: 'grass', base: hex('#5a8a4a'), sky: 'rain' },
  // ── 집 밖 (바깥 기억 방). wall: 가장자리 담 색 · accent: 담쟁이 · 덤불 · 울타리 · base: 담 갓돌
  // 하루네 집 앞 골목 (아스팔트 · 붉은 벽돌 담)
  alley: { wall: hex('#b8735c'), pattern: 'none', accent: hex('#5a9048'), floor: hex('#74767c'), floorKind: 'asphalt', base: hex('#cfcac0'), sky: 'day' },
  alleyDusk: { wall: hex('#9a5e52'), pattern: 'none', accent: hex('#4a6a40'), floor: hex('#686270'), floorKind: 'asphalt', base: hex('#b8a8a0'), sky: 'dusk' },
  // 학교 가는 길 (보도블록 · 시멘트 블록 담)
  schoolRoad: { wall: hex('#a8a6a0'), pattern: 'none', accent: hex('#6a9a52'), floor: hex('#bdb5aa'), floorKind: 'paving', base: hex('#e0dcd2'), sky: 'day' },
  // 동네 놀이터 (모래 · 나무 울타리와 덤불)
  playground: { wall: hex('#5e9450'), pattern: 'none', accent: hex('#b8844e'), floor: hex('#e2cb94'), floorKind: 'sand', base: hex('#8a5e36'), sky: 'day' },
  playgroundDusk: { wall: hex('#4c6644'), pattern: 'none', accent: hex('#9a6a44'), floor: hex('#cfaa7c'), floorKind: 'sand', base: hex('#6a4630'), sky: 'dusk' },
  // 병원 앞 (젖은 보도블록 · 회색 담)
  hospitalFront: { wall: hex('#9a9894'), pattern: 'none', accent: hex('#4e7a58'), floor: hex('#9ea2a6'), floorKind: 'paving', base: hex('#bcbcb8'), sky: 'rain' },
  // 1950~60년대 순이의 옛 시골 마을 (흙길 · 돌담)
  village: { wall: hex('#a89a86'), pattern: 'none', accent: hex('#6e9a4a'), floor: hex('#b48c5c'), floorKind: 'dirt', base: hex('#8a7a66'), sky: 'day' },
  villageDusk: { wall: hex('#8a7a6c'), pattern: 'none', accent: hex('#56703e'), floor: hex('#9c7452'), floorKind: 'dirt', base: hex('#6a5a4c'), sky: 'dusk' },
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
  if (L.floorKind === 'asphalt' || L.floorKind === 'paving') return brickWall(L, tx, ty, bottom);
  if (L.floorKind === 'sand') return parkHedge(L, tx, ty, bottom);
  if (L.floorKind === 'dirt') return stoneWall(L, tx, ty, bottom);
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

/** 집 밖 꾸밈 (담 · 울타리: 벽지 · 두께 규칙 대신 옛 그림) */
const outdoor = (L: HouseLook) => L.floorKind === 'grass' || L.floorKind === 'asphalt' || L.floorKind === 'paving' || L.floorKind === 'sand' || L.floorKind === 'dirt';

/** 벽 윗면 (위에서 본 벽 두께 · 뒷벽 맨 위 띠) 색: 벽지와 걸레받이를 짙게 섞은 색 */
export function wallCap(L: HouseLook): Color {
  return shade(mix(mix(L.wall, L.base, 0.5), hex('#5a3a28'), 0.68), -0.2);
}

/**
 * 뒷벽 앞면 한 칸 (E2). row: 벽 앞면에서 위로부터 몇 번째 줄, rows: 벽 줄 수.
 * 맨 윗줄 위 6px 윗면 띠 · 3px 천장 몰딩 · 벽지 · 맨 아랫줄 걸레받이 (벽 줄 수와 상관없이).
 */
export function wallFaceTile(L: HouseLook, tx: number, ty: number, row: number, rows: number): Pix {
  const last = row === rows - 1;
  if (outdoor(L)) return wallTile(L, tx, ty, last, row === 0);
  const p = wallTile(L, tx, ty, false, false);
  // 위쪽은 천장 그늘로 조금 어둡게
  const k0 = row === 0 ? -0.14 : 0;
  if (k0) for (let y = 9; y < 16; y++) for (let x = 0; x < HT; x++) p.set(x, y, shade(p.get(x, y), k0 * (1 - (y - 9) / 7)));
  if (row === 0) {
    const cap = wallCap(L);
    p.rect(0, 0, HT, 6, cap);
    p.rect(0, 0, HT, 1, shade(cap, 0.2));
    p.rect(0, 5, HT, 1, shade(cap, -0.3));
    const mold = shade(L.base, 0.12);
    p.rect(0, 6, HT, 3, mold);
    p.rect(0, 6, HT, 1, shade(mold, 0.3));
    p.rect(0, 8, HT, 1, shade(L.base, -0.28));
  }
  if (last) {
    // 걸레받이 (윗선 하이라이트 · 아래 바닥과 닿는 짙은 줄)
    p.rect(0, HT - 6, HT, 5, L.base);
    p.rect(0, HT - 6, HT, 1, shade(L.base, 0.28));
    p.rect(0, HT - 7, HT, 1, shade(L.wall, -0.2));
    p.rect(0, HT - 1, HT, 1, shade(L.base, -0.4));
  }
  return p;
}

/** 이웃이 트였나 (벽 두께 칸의 가장자리 · 모서리 그리기용) */
export interface Open {
  u: boolean;
  d: boolean;
  l: boolean;
  r: boolean;
  ul: boolean;
  ur: boolean;
  dl: boolean;
  dr: boolean;
}

/** 벽 두께 한 칸 (옆벽 · 칸막이 윗면): 짙은 윗면, 트인 쪽 가장자리에 짙은 선 + 안쪽 1px 하이라이트, 안쪽 모서리 점 */
export function thicknessTile(L: HouseLook, tx: number, ty: number, o: Open): Pix {
  if (outdoor(L)) return wallTile(L, tx, ty, false, o.u);
  const p = new Pix(HT, HT);
  const cap = wallCap(L);
  for (let y = 0; y < HT; y++)
    for (let x = 0; x < HT; x++) {
      const X = tx * HT + x;
      const Y = ty * HT + y;
      p.set(x, y, shade(cap, (hash2(X >> 2, Y >> 2, 401) - 0.5) * 0.06));
    }
  const edge = shade(cap, -0.42);
  const hi = shade(cap, 0.3);
  if (o.u) {
    p.rect(0, 0, HT, 1, edge);
    p.rect(0, 1, HT, 1, hi);
  }
  if (o.d) {
    p.rect(0, HT - 1, HT, 1, edge);
    p.rect(0, HT - 2, HT, 1, hi);
  }
  if (o.l) {
    p.rect(0, 0, 1, HT, edge);
    p.rect(1, o.u ? 1 : 0, 1, HT - (o.u ? 1 : 0) - (o.d ? 1 : 0), hi);
  }
  if (o.r) {
    p.rect(HT - 1, 0, 1, HT, edge);
    p.rect(HT - 2, o.u ? 1 : 0, 1, HT - (o.u ? 1 : 0) - (o.d ? 1 : 0), hi);
  }
  // 안쪽 모서리: 대각선만 트였을 때
  const corner = (x: number, y: number, dx: number, dy: number) => {
    p.set(x, y, edge);
    p.set(x + dx, y, hi);
    p.set(x, y + dy, hi);
  };
  if (o.ul && !o.u && !o.l) corner(0, 0, 1, 1);
  if (o.ur && !o.u && !o.r) corner(HT - 1, 0, -1, 1);
  if (o.dl && !o.d && !o.l) corner(0, HT - 1, 1, -1);
  if (o.dr && !o.d && !o.r) corner(HT - 1, HT - 1, -1, -1);
  return p;
}

/**
 * 다락의 낮은 구석 한 칸 (벽 두께 X 대신): 경사 천장 널이 비스듬히 내려와 바닥과 만난다.
 * side: 구석이 방의 왼쪽(l) · 오른쪽(r), d: 바닥 쪽 안쪽 칸부터 몇 번째 (0 = 바닥과 맞닿은 칸), n: 구석 칸 수.
 * 안쪽부터: 천장 아래 낮은 틈(짙은 그늘 · 먼지) → 깔도리(천장이 바닥에 닿는 나무) → 바깥으로 올라가는 천장 널 + 비스듬한 서까래.
 */
export function eaveTile(L: HouseLook, tx: number, ty: number, side: 'l' | 'r', d: number, n: number): Pix {
  const p = new Pix(HT, HT);
  const span = n * HT;
  const gap = 9;
  const sill = 5;
  const board = hex('#7a5438');
  const rafter = hex('#4e3424');
  for (let y = 0; y < HT; y++)
    for (let x = 0; x < HT; x++) {
      // e: 바닥과 만나는 안쪽 가장자리에서 바깥으로 잰 거리 (px)
      const e = side === 'l' ? (d + 1) * HT - 1 - x : d * HT + x;
      const X = tx * HT + x;
      const Y = ty * HT + y;
      let c: Color;
      if (e < gap) {
        // 낮은 틈: 바닥 널이 그늘 속으로 (안쪽으로 갈수록 짙게)
        const fl = floorTile(L, tx, ty).get(x, y);
        c = shade(fl, -0.38 - (e / gap) * 0.3);
        if (hash2(X, Y, 811) < 0.025) c = shade(L.floor, -0.25);
      } else if (e < gap + sill) {
        // 깔도리
        const k = e - gap;
        c = k === 0 ? shade(rafter, 0.28) : k === sill - 1 ? shade(rafter, -0.3) : shade(rafter, 0.06 + (hash2(X >> 3, Y >> 1, 812) - 0.5) * 0.08);
      } else {
        // 천장 널 (바깥으로 갈수록 높아져 조금 밝다) + 비스듬한 서까래
        const u = (e - gap - sill) / Math.max(1, span - gap - sill);
        const plank = Math.floor((e - gap - sill) / 7);
        c = shade(board, -0.32 + u * 0.22 + (hash2(plank, Math.floor(Y / 30), 813) - 0.5) * 0.08);
        if ((e - gap - sill) % 7 === 0) c = shade(c, -0.22);
        else if (hash2(X >> 2, Y, 814) < 0.05) c = shade(c, -0.1);
        const r = (Y + Math.round((e - gap - sill) * 0.55)) % 34;
        if (r < 6) c = r === 0 ? shade(rafter, 0.24) : r === 5 ? shade(rafter, -0.35) : shade(rafter, -0.08 + u * 0.12);
        else if (r < 9) c = shade(c, -0.18);
      }
      p.set(x, y, c);
    }
  // 거미줄: 깔도리와 천장이 만나는 구석에 가끔
  if (d === 0 && hash2(tx, ty, 815) < 0.22) {
    const web = hex('#cfc8bc');
    const ax = side === 'l' ? HT - gap - sill : gap + sill - 1;
    const dir = side === 'l' ? -1 : 1;
    const ay = 4 + Math.floor(hash2(tx, ty, 816) * 10);
    for (let i = 0; i < 4; i++) p.line(ax, ay, ax + dir * (5 + i * 2), ay + 9 - i * 3, web);
    for (let k = 2; k < 8; k += 3) p.line(ax + dir * k, ay + 6 - Math.floor(k / 2), ax + dir * (k + 2), ay + 3 - Math.floor(k / 2), shade(web, -0.15));
  }
  // 먼지 뭉치: 낮은 틈 바닥에
  if (d === 0 && hash2(tx, ty, 817) < 0.18) {
    const dx = side === 'l' ? HT - 5 : 2;
    const dy = 6 + Math.floor(hash2(tx, ty, 818) * 12);
    p.oval(dx + 1, dy, 2, 1, shade(L.floor, -0.35));
    p.set(dx, dy - 1, shade(L.floor, -0.2));
  }
  return p;
}

/** 단 앞면 (S): 위 칸(높은 바닥) 재질의 앞판 10px + 그 아래 낮은 바닥과 닿는 그늘, 끝은 1px 짙은 모서리 */
export function stepTile(high: HouseLook, low: HouseLook, tx: number, ty: number, leftEnd: boolean, rightEnd: boolean): Pix {
  const p = floorTile(low, tx, ty);
  const ph = 10;
  const f = high.floor;
  for (let y = 0; y < ph; y++)
    for (let x = 0; x < HT; x++) {
      const X = tx * HT + x;
      let c = shade(f, -0.14);
      if (high.floorKind === 'wood') {
        if (hash2(X >> 3, y >> 1, 411) < 0.18) c = shade(c, -0.06);
        if ((X + Math.floor(hash2(ty, 0, 412) * 30)) % 40 === 0) c = shade(f, -0.32);
      } else if ((X % 12 === 0 && high.floorKind === 'tile') || (y === 5 && high.floorKind !== 'lino')) c = shade(f, -0.28);
      p.set(x, y, c);
    }
  p.rect(0, 0, HT, 1, shade(f, 0.22));
  p.rect(0, ph - 1, HT, 1, shade(f, -0.42));
  for (let y = ph; y < ph + 3; y++) for (let x = 0; x < HT; x++) p.set(x, y, shade(p.get(x, y), -0.3 + (y - ph) * 0.09));
  if (leftEnd) p.rect(0, 0, 1, ph, shade(f, -0.5));
  if (rightEnd) p.rect(HT - 1, 0, 1, ph, shade(f, -0.5));
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
      } else if (L.floorKind === 'asphalt') c = asphaltAt(f, X, Y);
      else if (L.floorKind === 'paving') c = pavingAt(f, X, Y);
      else if (L.floorKind === 'sand') c = shade(f, (hash2(X >> 2, Y >> 1, 51) - 0.5) * 0.06 + (hash2(X, Y, 52) < 0.08 ? 0.16 : hash2(X, Y, 53) < 0.07 ? -0.1 : 0));
      else if (L.floorKind === 'dirt') {
        c = shade(f, (hash2(X >> 2, Y >> 2, 61) - 0.5) * 0.12 + (hash2(X, Y, 62) < 0.05 ? -0.12 : 0));
      } else {
        c = shade(f, (hash2(X >> 1, Y >> 1, 21) - 0.5) * 0.16);
        if (hash2(X, Y, 22) < 0.04) c = shade(f, 0.2);
      }
      p.set(x, y, c);
    }
  if (L.floorKind === 'asphalt') asphaltMarks(p, f, tx, ty);
  else if (L.floorKind === 'sand') sandMarks(p, f, tx, ty);
  else if (L.floorKind === 'dirt') dirtMarks(p, f, L.accent, tx, ty);
  else if (L.floorKind === 'paving' && L.sky === 'rain') {
    // 젖은 보도: 줄눈에 고인 물 반짝임
    for (let i = 0; i < 3; i++) if (hash2(tx, ty, 70 + i) < 0.35) p.rect(Math.floor(hash2(tx, i, 71) * 16), Math.floor(hash2(ty, i, 72) * 20), 4 + Math.floor(hash2(i, tx, 73) * 4), 1, shade(f, 0.28));
  }
  return p;
}

// ───────────────────────── 집 밖: 바닥 무늬 ─────────────────────────

function asphaltAt(f: Color, X: number, Y: number): Color {
  // 아스팔트: 굵은 알갱이 (밝은 돌 · 어두운 구멍) 위에 얼룩
  let c = shade(f, (hash2(X >> 3, Y >> 3, 31) - 0.5) * 0.08);
  const g = hash2(X, Y, 32);
  if (g < 0.07) c = shade(c, 0.14);
  else if (g < 0.13) c = shade(c, -0.12);
  return c;
}

function asphaltMarks(p: Pix, f: Color, tx: number, ty: number): void {
  const dark = shade(f, -0.38);
  // 갈라진 금 (칸마다 다른 모양으로 꺾인다)
  if (hash2(tx, ty, 34) < 0.16) {
    let x = Math.floor(hash2(tx, ty, 35) * HT);
    let y = 0;
    const len = 10 + Math.floor(hash2(tx, ty, 33) * 14);
    while (y < len) {
      p.set(x, y, dark);
      if (hash2(x, y + ty * HT, 36) < 0.3) p.set(x + 1, y, shade(f, -0.2));
      y++;
      x += Math.floor(hash2(tx * 7 + y, ty, 37) * 3) - 1;
      if (hash2(tx, y, 38) < 0.04) {
        // 곁가지 금
        for (let k = 1; k < 5; k++) p.set(x + k, y + (k >> 1), dark);
      }
    }
  }
  // 기름 얼룩
  if (hash2(tx, ty, 39) < 0.08) p.oval(12, 14, 7, 3, shade(f, -0.14));
  // 맨홀 뚜껑 (드물게)
  if (hash2(tx, ty, 40) < 0.014) manhole(p, 12, 12, f);
}

function manhole(p: Pix, cx: number, cy: number, f: Color): void {
  const iron = shade(f, -0.3);
  p.oval(cx, cy, 10, 8, shade(f, -0.5));
  p.oval(cx, cy, 9, 7, iron);
  for (let y = -5; y <= 5; y += 2) for (let x = -7; x <= 7; x += 3) if ((x * x) / 49 + (y * y) / 25 < 0.9) p.rect(cx + x, cy + y, 2, 1, shade(iron, 0.18));
  p.oval(cx, cy, 2, 1.5, shade(iron, -0.3));
  p.rect(cx - 6, cy - 6, 5, 1, shade(iron, 0.35));
}

function pavingAt(f: Color, X: number, Y: number): Color {
  // 보도블록: 16×8 벽돌을 줄마다 반씩 엇갈려 깐다. 블록마다 색이 조금씩, 가끔 분홍 블록
  const row = Math.floor(Y / 8);
  const off = row % 2 ? 8 : 0;
  const col = Math.floor((X + off) / 16);
  const bx = (X + off) % 16;
  const by = Y % 8;
  let c = shade(f, (hash2(row, col, 41) - 0.5) * 0.08);
  if (hash2(row, col, 42) < 0.1) c = mix(c, hex('#c49890'), 0.22);
  if (by === 0 || bx === 0) return shade(f, -0.17);
  if (by === 1 || bx === 1) return shade(c, 0.08);
  if (by === 7 || bx === 15) return shade(c, -0.07);
  if (hash2(X, Y, 43) < 0.05) c = shade(c, -0.06);
  return c;
}

function sandMarks(p: Pix, f: Color, tx: number, ty: number): void {
  // 모래 물결과 작은 발자국 (드문드문)
  if (hash2(tx, ty, 54) < 0.35) {
    const y0 = 4 + Math.floor(hash2(tx, ty, 55) * 14);
    for (let x = 2; x < HT - 2; x++) p.set(x, y0 + Math.round(Math.sin(x / 3 + tx) * 1), shade(f, -0.08));
  }
  if (hash2(tx, ty, 56) < 0.22) {
    const fx = 4 + Math.floor(hash2(tx, ty, 57) * 10);
    const fy = 3 + Math.floor(hash2(tx, ty, 58) * 8);
    for (const [dx, dy] of [[0, 0], [5, 6], [0, 12]] as const) {
      if (fy + dy > HT - 4) break;
      p.oval(fx + dx + 2, fy + dy + 2, 2, 3, shade(f, -0.16));
      p.rect(fx + dx + 1, fy + dy, 2, 1, shade(f, -0.22));
    }
  }
  if (hash2(tx, ty, 59) < 0.1) p.ball(hash2(tx, 1, 60) * 20 + 2, hash2(ty, 2, 60) * 20 + 2, 1.5, 1.2, hex('#c8c0b4'));
}

function dirtMarks(p: Pix, f: Color, grass: Color, tx: number, ty: number): void {
  // 자갈 · 마른 흙덩이 · 길섶 풀
  const n = Math.floor(hash2(tx, ty, 63) * 4);
  for (let i = 0; i < n; i++) {
    const x = 2 + hash2(tx, i, 64) * 20;
    const y = 2 + hash2(ty, i, 65) * 20;
    p.ball(x, y, 1.5 + hash2(i, tx, 66), 1.2, mix(hex('#b0a898'), f, hash2(i, ty, 67) * 0.4));
  }
  if (hash2(tx, ty, 68) < 0.14) {
    const x = 3 + Math.floor(hash2(tx, ty, 69) * 16);
    const y = 6 + Math.floor(hash2(ty, tx, 69) * 14);
    for (let k = -2; k <= 2; k++) p.line(x + k, y, x + k * 2, y - 3 - (k === 0 ? 2 : 0), shade(grass, k * 0.06));
  }
}

// ───────────────────────── 집 밖: 가장자리 담 ─────────────────────────

/** 골목 · 길: 갓돌을 얹은 낮은 벽돌 담. 군데군데 담쟁이 */
function brickWall(L: HouseLook, tx: number, ty: number, bottom: boolean): Pix {
  const p = new Pix(HT, HT);
  const b = L.wall;
  const gx = tx * HT;
  const top = bottom ? 5 : 0;
  for (let y = 0; y < HT; y++)
    for (let x = 0; x < HT; x++) {
      const Y = ty * HT + y;
      const X = gx + x;
      const row = Math.floor(Y / 5);
      const off = row % 2 ? 6 : 0;
      const col = Math.floor((X + off) / 12);
      let c = shade(b, (hash2(row, col, 81) - 0.5) * 0.16);
      if (Y % 5 === 0 || (X + off) % 12 === 0) c = shade(b, 0.32);
      else if (Y % 5 === 4) c = shade(c, -0.12);
      if (!bottom) c = shade(c, -0.12);
      p.set(x, y, c);
    }
  if (bottom) {
    // 갓돌 (담 위에 얹은 시멘트) · 담 아래 그늘
    p.rect(0, 0, HT, top, L.base);
    p.rect(0, 0, HT, 1, shade(L.base, 0.3));
    p.rect(0, top - 1, HT, 1, shade(L.base, -0.3));
    p.rect(0, top, HT, 2, shade(b, -0.35));
    p.rect(0, HT - 3, HT, 3, shade(b, -0.42));
  } else {
    // 옆 · 아래 담: 위에서 본 갓돌 줄
    p.rect(0, 0, HT, 2, shade(L.base, -0.1));
    p.rect(0, HT - 2, HT, 2, shade(L.base, -0.1));
  }
  // 담쟁이 (몇 칸에만 늘어진다)
  if (bottom && hash2(tx, 0, 82) < 0.3) {
    for (let i = 0; i < 14; i++) {
      const x = hash2(tx, i, 83) * HT;
      const y = 2 + hash2(i, tx, 84) * (14 + (i % 3) * 3);
      p.ball(x, y, 3, 2.5, shade(L.accent, (hash2(i, ty, 85) - 0.5) * 0.4), true);
    }
  }
  return p;
}

/** 놀이터: 낮은 나무 울타리, 그 너머 덤불 */
function parkHedge(L: HouseLook, tx: number, ty: number, bottom: boolean): Pix {
  const p = new Pix(HT, HT);
  p.rect(0, 0, HT, HT, shade(L.wall, -0.2));
  for (let i = 0; i < 9; i++) p.ball(hash2(tx, i, 91) * HT, hash2(ty, i, 92) * (bottom ? 16 : HT), 4 + hash2(i, tx, ty) * 3, 4, shade(L.wall, (hash2(i, ty, 93) - 0.5) * 0.35), true);
  // 덤불 사이 작은 꽃
  if (hash2(tx, ty, 94) < 0.25) p.ball(4 + hash2(tx, 1, 95) * 16, 3 + hash2(ty, 1, 95) * 8, 1.5, 1.5, hex('#f8e8a0'));
  const wood = L.accent;
  if (bottom) {
    // 말뚝 울타리 (칸마다 말뚝 셋 + 가로대 둘)
    for (let x = 1; x < HT; x += 8) {
      p.rect(x, 9, 5, 13, wood);
      p.rect(x, 9, 1, 13, shade(wood, 0.25));
      p.rect(x + 4, 9, 1, 13, shade(wood, -0.25));
      p.tri(x, 9, x + 5, 9, x + 2.5, 6, wood);
    }
    p.rect(0, 12, HT, 2, shade(wood, 0.1));
    p.rect(0, 18, HT, 2, shade(wood, 0.1));
    p.rect(0, 22, HT, 2, shade(L.wall, -0.45));
  } else {
    p.rect(0, 10, HT, 3, wood);
    p.rect(0, 10, HT, 1, shade(wood, 0.25));
  }
  return p;
}

/** 옛 마을: 둥근 돌을 쌓은 돌담 */
function stoneWall(L: HouseLook, tx: number, ty: number, bottom: boolean): Pix {
  const p = new Pix(HT, HT);
  const mud = shade(L.base, -0.15);
  p.rect(0, 0, HT, HT, mud);
  for (let r = 0; r < 5; r++) {
    const y = 3 + r * 5;
    const off = (r % 2) * 4 + Math.floor(hash2(r, ty, 101) * 3);
    for (let x = -off; x < HT + 6; x += 8) {
      const X = tx * HT + x;
      const k = hash2(X, r + ty * 5, 102);
      p.ball(x + 3, y, 4 + k * 1.5, 2.6 + k, shade(L.wall, (k - 0.5) * 0.3 - (bottom ? 0 : 0.1)));
    }
  }
  // 이끼 · 담 밑 풀
  for (let i = 0; i < 3; i++) if (hash2(tx, ty, 103 + i) < 0.4) p.ball(hash2(tx, i, 104) * HT, hash2(ty, i, 105) * HT, 2, 1.5, shade(L.accent, -0.1));
  if (bottom) {
    p.rect(0, 0, HT, 2, shade(L.wall, 0.15));
    p.rect(0, HT - 2, HT, 2, shade(mud, -0.35));
  }
  return p;
}

// ───────────────────────── 가구 ─────────────────────────

/** 3면 가구의 면 자리 (그림 안 y): 윗면 frontY 전까지 · 앞면 frontH · 그 아래 다리 legs · 오른쪽 옆면 폭 sideW */
export interface Faces {
  topY: number;
  frontY: number;
  frontH: number;
  sideW: number;
  legs: number;
}

/** 그리기 함수가 돌려주는 그림 한 장 */
export interface RawSprite {
  pix: Pix;
  /** 칸 자리 (x*HT, (y+h)*HT) 에서 그림 왼쪽 위까지 */
  ox: number;
  oy: number;
  /** 벽에 붙은 것 (인물보다 늘 뒤) */
  wall: boolean;
  faces?: Faces;
  /** 인물보다 먼저(가구 맨 뒷줄 발 높이로) 그리는 뒷부분: 열린 상자의 뒷벽 · 안 · 펼친 날개 (같은 자리 · 같은 크기) */
  behind?: Pix;
  /** behind 가 있을 때 발 정렬로 그리는 앞부분 (없으면 pix) */
  front?: Pix;
  /** 바닥에 구워 넣는 그늘 (칠한 칸만 어둡게): 떠 있는 들보의 그림자 */
  ground?: { pix: Pix; ox: number; oy: number };
}

export interface FurnSprite extends RawSprite {
  /** 발 쪽 (인물과 발 정렬). 윗부분이 없으면 pix 와 같다 */
  base: Pix;
  /** 사람 키(40px)보다 높은 윗부분: 인물보다 늘 나중에 그린다 (같은 자리 · 같은 크기, 아랫부분은 비어 있음) */
  top?: Pix;
  /** top 이 차지하는 줄 수 (그림 위에서부터) */
  topH: number;
  /** 바닥 위 실제 높이 (px): 그림자 길이 */
  height: number;
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

/** 사람 키 (px): 이보다 높은 부분은 윗부분(top) */
export const PERSON_H = 40;

/** 키 큰 가구 (윗부분을 인물 위로 나눔) */
const TALL = new Set(['wardrobe', 'shelf', 'iv', 'stage', 'swing', 'tree', 'pole', 'lamp', 'swingset', 'busstop', 'slide', 'jungle', 'fridge']);

/** 가구의 바닥 위 높이 (그림자 길이) */
const HEIGHT: Record<string, number> = {
  bed: 14, crib: 30, desk: 22, chair: 24, shelf: 76, claw: 70, wardrobe: 72, toybox: 16, table: 20, sofa: 26, tv: 40, plant: 30, boxes: 30,
  sewing: 26, hbed: 22, iv: 54, fence: 26, flowers: 10, bush: 26, stage: 50, bathtub: 16, sink: 34, truck: 44, swing: 58, mailbox: 30,
  bike: 18, railing: 24, stool: 12, pots: 20, cushion: 6, tree: 90, pole: 110, lamp: 80, bench: 14, slide: 44, swingset: 60, seesaw: 12,
  jungle: 46, well: 22, signpost: 40, cart: 22, crocks: 20, busstop: 60,
};

/** 다른 그림 모음이 맡는 가구 (모르는 kind 일 때): 자리만 — 연결은 setFurnitureFallback 으로 */
export type FurnitureFallback = (kind: string, w: number, h: number, opt: string) => { pix: Pix; ox: number; oy: number; top?: Pix; topSplitY?: number; wall?: boolean; ground?: RawSprite['ground']; behind?: Pix; front?: Pix } | null;
/** 기본: 다락방 · 책상 위 소품 (houseProps.ts) */
let fallback: FurnitureFallback | null = propSprite;
export function setFurnitureFallback(f: FurnitureFallback | null): void {
  fallback = f;
}

/** 이 이름의 가구 그림이 있나 */
export function hasFurniture(kind: string): boolean {
  return FURN_KINDS.has(kind) || !!fallback?.(kind, 1, 1, '');
}

/** 가구 그림. opt: 색 · 열림 같은 꾸밈. 키 큰 가구는 base + top 으로 나뉜다 */
export function furnitureSprite(kind: string, w: number, h: number, look: HouseLook, opt = ''): FurnSprite {
  if (!FURN_KINDS.has(kind) && fallback) {
    const o = fallback(kind, w, h, opt);
    if (o) {
      // top 은 pix 윗줄 topSplitY 줄을 잘라 둔 것 → 같은 크기 그림으로 (아랫부분 비움), base 는 그 줄들을 비운 것
      const split = o.top ? Math.min(o.pix.h, o.topSplitY ?? o.top.h) : 0;
      const top = o.top ? new Pix(o.pix.w, o.pix.h).stamp(o.top, 0, 0) : undefined;
      const base = new Pix(o.pix.w, o.pix.h).stamp(o.pix, 0, 0);
      for (let y = 0; y < split; y++) for (let x = 0; x < base.w; x++) base.px[y * base.w + x] = -1;
      return { pix: o.pix, ox: o.ox, oy: o.oy, wall: !!o.wall, base: o.front ?? base, behind: o.behind, top, topH: split, height: HEIGHT[kind] ?? Math.min(-o.oy - 2, 30), ground: o.ground };
    }
  }
  const raw = drawFurniture(kind, w, h, look, opt);
  const p = raw.pix;
  if (!raw.wall && !FLAT.has(kind) && !raw.faces) sideShade(p, 2);
  const out: FurnSprite = { ...raw, base: raw.front ?? p, topH: 0, height: HEIGHT[kind] ?? Math.min(p.h - 2, 30) };
  if (TALL.has(kind)) {
    const split = p.h - 2 - PERSON_H;
    if (split >= 6) {
      const top = new Pix(p.w, p.h);
      const base = new Pix(p.w, p.h);
      for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) (y < split ? top : base).set(x, y, p.get(x, y));
      out.top = top;
      out.base = base;
      out.topH = split;
    }
  }
  return out;
}

/** 오른쪽 옆면 그늘: 줄마다 오른쪽 끝(외곽선) 안쪽 n px 를 어둡게 */
function sideShade(p: Pix, n: number): void {
  for (let y = 0; y < p.h; y++) {
    let r = -1;
    for (let x = p.w - 1; x >= 0; x--)
      if (p.get(x, y) !== -1) {
        r = x;
        break;
      }
    for (let k = 1; k <= n && r - k >= 0; k++) {
      const c = p.get(r - k, y);
      if (c !== -1) p.set(r - k, y, shade(c, -0.16));
    }
  }
}

/** 3면 상자: (x, y) 왼쪽 위 · 폭 w · 윗면 깊이 d · 앞면 높이 fh. 윗면 가장 밝게, 앞면 c, 오른쪽 옆면 sw px 가장 어둡게 */
function block3(p: Pix, x: number, y: number, w: number, d: number, fh: number, c: Color, sw = 3, topC?: Color): void {
  const top = topC ?? shade(c, 0.14);
  p.rect(x, y, w, d, top);
  p.rect(x, y, w, 1, shade(top, 0.18));
  p.rect(x, y + d - 1, w, 1, shade(top, 0.3));
  p.rect(x, y + d, w, fh, c);
  p.rect(x, y + d + fh - 1, w, 1, shade(c, -0.3));
  p.rect(x + w - sw, y + 1, sw, d + fh - 1, shade(c, -0.34));
  p.rect(x + w - sw, y + 1, 1, d + fh - 1, shade(c, -0.24));
}

function drawFurniture(kind: string, w: number, h: number, look: HouseLook, opt = ''): RawSprite {
  const W = w * HT;
  const H = h * HT;
  const tall = (extra: number) => new Pix(W, H + extra);
  switch (kind) {
    case 'bed': {
      // 3면 침대: 머리판(앞면이 보이는 판) · 매트리스 윗면(베개 · 이불) · 앞면(늘어진 이불 · 나무 틀) · 오른쪽 옆면
      const fh = 12;
      const p = new Pix(W, H + fh);
      const quilt = opt ? hex(opt) : hex('#f0a0a8');
      const sheet = hex('#f4ecdc');
      block3(p, 1, 8, W - 2, H - 8, fh, shade(WOODF, -0.1), 3, sheet);
      // 베개
      p.oval(W / 2 - 1, 20, W / 2 - 8, 4, WHITE);
      p.rect(W / 2 - (W / 2 - 8), 22, W - 18, 1, shade(WHITE, -0.12));
      // 이불: 윗면 · 앞으로 늘어진 자락
      const qy = 28;
      p.rect(2, qy, W - 5, H - qy, quilt);
      p.rect(2, qy, W - 5, 2, shade(quilt, 0.22));
      for (let y = qy + 6; y < H - 1; y += 7) p.rect(3, y, W - 7, 1, shade(quilt, -0.1));
      p.rect(2, H, W - 5, 6, shade(quilt, -0.14));
      p.rect(2, H, W - 5, 1, shade(quilt, 0.12));
      for (let x = 5; x < W - 5; x += 6) p.rect(x, H + 1, 1, 5, shade(quilt, -0.24));
      // 머리판 (앞면이 보이는 나무판 · 위 윗면)
      block3(p, 0, 0, W, 3, 11, WOODF, 3);
      p.rect(4, 6, W - 10, 1, shade(WOODF, 0.18));
      // 옆면 다시 (이불 위로도)
      p.rect(W - 4, 3, 3, H + fh - 4, shade(WOODF, -0.42));
      return { pix: p.outline(), ox: 0, oy: -(H + fh), wall: false, faces: { topY: qy, frontY: H, frontH: fh, sideW: 3, legs: 0 } };
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
      // 3면 책상: 위 물건 자리 16 · 윗판 윗면 · 앞판 8 · 다리 14, 오른쪽에 서랍장
      const room = 16;
      const d = Math.max(10, H - 8);
      const fh = 8;
      const legs = 14;
      const p = new Pix(W, room + d + fh + legs);
      const fy = room + d;
      const leg = shade(WOODF, -0.3);
      p.rect(3, fy + fh, 3, legs, leg);
      p.rect(7, fy + fh, 2, legs - 4, shade(leg, -0.2));
      // 서랍장 (앞면 · 옆면)
      p.rect(W - 26, fy + fh, 22, legs, shade(WOODF, -0.06));
      p.rect(W - 26, fy + fh + 6, 22, 1, shade(WOODF, -0.3));
      p.rect(W - 18, fy + fh + 2, 5, 1, hex('#e8c860'));
      p.rect(W - 18, fy + fh + 9, 5, 1, hex('#e8c860'));
      p.rect(W - 4, fy + fh, 3, legs, shade(WOODF, -0.36));
      block3(p, 0, room, W, d, fh, WOODF, 3);
      p.rect(W - 18, fy + 3, 5, 1, hex('#e8c860'));
      // 책상 위: 스탠드 · 공책 · (opt 'jar' 종이별 병)
      const ly = room + 4;
      p.rect(5, ly + 6, 9, 3, hex('#4a5a7a'));
      p.rect(8, 4, 2, ly + 3, hex('#5a6a8a'));
      p.tri(1, 8, 15, 8, 8, 1, hex('#4a78d8'));
      p.rect(3, 8, 11, 1, hex('#ffe8a8'));
      box(p, 20, room + 3, 16, 9, hex('#f4f0e4'));
      p.rect(22, room + 5, 11, 1, hex('#a8c0e0'));
      p.rect(22, room + 8, 9, 1, hex('#a8c0e0'));
      if (opt.includes('jar')) starJar(p, W - 16, room - 8);
      return { pix: p.outline(), ox: 0, oy: -p.h, wall: false, faces: { topY: room, frontY: fy, frontH: fh, sideW: 3, legs } };
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
      const p = tall(44);
      box(p, 0, 0, W, H + 44, WOODF);
      const rows = 5;
      const rh = (H + 40) / rows;
      for (let r = 0; r < rows; r++) {
        const y = Math.round(3 + r * rh);
        p.rect(3, y, W - 6, Math.round(rh) - 3, shade(WOODF, -0.45));
        let x = 4;
        while (x < W - 6) {
          const bw = 3 + Math.floor(hash2(x, r, 2) * 3);
          const bh = Math.round(rh) - 4 - Math.floor(hash2(x, r, 3) * 3);
          const col = [hex('#d85a5a'), hex('#5a8ad8'), hex('#e8c860'), hex('#6ab06a'), hex('#a87ad0'), hex('#f0f0e0')][Math.floor(hash2(x, r, 4) * 6)];
          if (opt.includes('toys')) {
            // 인형 가게: 줄마다 토끼 · 곰 · 여우 인형이 나란히 (귀 · 동그란 머리)
            const fur = [hex('#f4f0ec'), hex('#c8905a'), hex('#e8884a'), hex('#b8a0d8'), hex('#f0c0d0')][Math.floor(hash2(x, r, 5) * 5)];
            const by = y + Math.round(rh) - 4;
            p.oval(x + 3, by - 3, 3, 3, fur);
            p.oval(x + 3, by - 7, 2.5, 2.5, fur);
            if (hash2(x, r, 6) < 0.4) {
              p.rect(x + 1, by - 13, 1, 5, fur);
              p.rect(x + 4, by - 13, 1, 5, fur);
            } else {
              p.set(x + 1, by - 9, fur);
              p.set(x + 5, by - 9, fur);
            }
            p.set(x + 2, by - 7, hex('#2a1c24'));
            p.set(x + 4, by - 7, hex('#2a1c24'));
            x += 7;
            continue;
          }
          if (!(opt.includes('jar') && r === 1 && x > W / 2)) p.rect(x, y + Math.round(rh) - 3 - bh, bw, bh, col);
          x += bw + 1;
        }
        p.rect(2, y + Math.round(rh) - 3, W - 4, 2, shade(WOODF, 0.15));
      }
      if (opt.includes('jar')) starJar(p, W - 16, Math.round(3 + rh) - 2);
      p.rect(W - 3, 1, 2, H + 42, shade(WOODF, -0.34));
      return { pix: p.outline(), ox: 0, oy: -(H + 44), wall: true };
    }
    case 'claw': {
      // 인형 뽑기 기계: 유리 상자 안에 인형 더미, 위에 집게, 앞에 조이스틱 판
      const p = tall(38);
      const body = hex('#d85a9a');
      box(p, 0, 0, W, H + 38, body);
      const gx = 4;
      const gy = 6;
      const gw = W - 8;
      const gh = H + 12;
      p.rect(gx, gy, gw, gh, hex('#9ad0e8'));
      // 인형 더미 (아래쪽에 수북이)
      for (let i = 0; i < 14; i++) {
        const fur = [hex('#f4f0ec'), hex('#c8905a'), hex('#e8884a'), hex('#8ac0f0'), hex('#f0c0d0'), hex('#b8e08a')][Math.floor(hash2(i, 3, 700) * 6)];
        const ox = gx + 4 + hash2(i, 1, 701) * (gw - 8);
        const oy = gy + gh - 4 - hash2(i, 2, 702) * 12;
        p.oval(ox, oy, 3.5, 3, fur);
        p.set(Math.round(ox) - 1, Math.round(oy) - 1, hex('#2a1c24'));
        p.set(Math.round(ox) + 1, Math.round(oy) - 1, hex('#2a1c24'));
      }
      // 맨 아래 깔린 주황 여우 (루루)
      p.oval(gx + gw - 10, gy + gh - 3, 4, 2.5, hex('#e8884a'));
      // 집게
      const cx = gx + gw / 2;
      p.rect(gx, gy + 2, gw, 1, hex('#5a5a6a'));
      p.rect(cx, gy + 2, 1, 10, hex('#8a8a9a'));
      p.rect(cx - 3, gy + 12, 7, 1, hex('#8a8a9a'));
      p.rect(cx - 3, gy + 12, 1, 4, hex('#8a8a9a'));
      p.rect(cx + 3, gy + 12, 1, 4, hex('#8a8a9a'));
      // 유리 반짝임
      p.rect(gx + 2, gy + 3, 1, gh - 8, hex('#e8f8ff'));
      p.rect(gx + 5, gy + 3, 1, 6, hex('#e8f8ff'));
      // 조작판 · 조이스틱 · 버튼 · 꺼내는 구멍
      const ky = gy + gh + 3;
      p.rect(3, ky, W - 6, 10, shade(body, -0.25));
      p.rect(8, ky + 2, 2, 5, hex('#3a3a44'));
      p.oval(9, ky + 2, 2.5, 2.5, hex('#e84a4a'));
      p.oval(20, ky + 5, 2.5, 2, hex('#ffd84a'));
      p.rect(W - 18, ky + 2, 12, 7, hex('#2a2030'));
      // 불빛 띠
      for (let x = 2; x < W - 2; x += 4) p.set(x, 2, (x / 4) % 2 ? hex('#fff08a') : hex('#ffffff'));
      return { pix: p.outline(), ox: 0, oy: -(H + 38), wall: true };
    }
    case 'wardrobe': {
      // 장롱 (사람보다 높다): 윗면 띠 · 두 문짝 · 오른쪽 옆면
      const c = hex('#c8905a');
      const p = tall(48);
      block3(p, 0, 0, W, 5, H + 43, c, 4);
      p.rect(2, 7, W - 7, 3, shade(c, 0.12));
      p.rect(Math.floor((W - 4) / 2), 10, 1, H + 34, shade(WOODF, -0.4));
      p.rect(Math.floor((W - 4) / 2) - 4, Math.floor((H + 48) / 2), 2, 6, hex('#e8c860'));
      p.rect(Math.floor((W - 4) / 2) + 3, Math.floor((H + 48) / 2), 2, 6, hex('#e8c860'));
      p.rect(2, H + 40, W - 6, 2, shade(c, -0.25));
      return { pix: p.outline(), ox: 0, oy: -(H + 48), wall: true };
    }
    case 'toybox': {
      // 3면 장난감 상자: 뚜껑 윗면 · 앞면 (노란 띠) · 오른쪽 옆면. 열리면 뚜껑이 뒤로 서고 안이 보인다
      const col = hex('#5a9ae8');
      const d = Math.max(10, H - 6);
      const fh = 16;
      const p = new Pix(W, d + fh + (opt.includes('open') ? 0 : 0));
      if (opt.includes('open')) {
        block3(p, 1, 0, W - 2, d, fh, col, 3, shade(col, -0.55));
        box(p, 1, 0, W - 2, 6, shade(col, -0.1));
        p.ball(11, d - 3, 4, 4, hex('#e85a5a'));
        p.ball(W - 13, d - 4, 4, 4, hex('#6ab06a'));
      } else block3(p, 0, 0, W, d, fh, col, 3);
      p.rect(3, d + 4, W - 8, 2, hex('#ffd84a'));
      if (opt.includes('label')) {
        box(p, W / 2 - 10, d + 7, 18, 7, hex('#f8f0d8'));
        p.rect(W / 2 - 7, d + 10, 12, 1, INK);
      }
      return { pix: p.outline(), ox: 0, oy: -p.h, wall: false, faces: { topY: 0, frontY: d, frontH: fh, sideW: 3, legs: 0 } };
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
      // 3면 식탁: 윗판 윗면 · 앞판 8 · 다리 12 (그 밑은 장난감이 지나가는 그늘)
      const fh = 8;
      const legs = 12;
      const d = H - fh;
      const p = new Pix(W, d + fh + legs);
      const clothy = opt.includes('cloth');
      const wood = WOODF;
      const leg = shade(wood, -0.3);
      p.rect(6, d + fh, 2, legs - 3, shade(leg, -0.25));
      p.rect(W - 10, d + fh, 2, legs - 3, shade(leg, -0.25));
      p.rect(2, d + fh, 3, legs, leg);
      p.rect(W - 6, d + fh, 3, legs, shade(leg, -0.15));
      if (clothy) {
        const cloth = hex('#f8f0f4');
        block3(p, 0, 0, W, d, fh, shade(cloth, -0.1), 3, cloth);
        for (let x = 2; x < W - 3; x += 6) p.rect(x, d + fh - 1, 3, 2, shade(cloth, -0.16));
      } else block3(p, 0, 0, W, d, fh, wood, 3);
      if (opt.includes('cake')) cake(p, W / 2 - 12, 2, opt.includes('out'));
      if (opt.includes('phone')) phone(p, W / 2 - 6, 6);
      if (opt.includes('tea')) {
        box(p, 8, 6, 8, 6, WHITE);
        box(p, W - 18, 6, 8, 6, WHITE);
      }
      return { pix: p.outline(), ox: 0, oy: -p.h, wall: false, faces: { topY: 0, frontY: d, frontH: fh, sideW: 3, legs } };
    }
    case 'sofa': {
      // 3면 소파: 등받이(윗면 · 앞면) · 앉는 면 윗면 · 앞면 12 · 팔걸이 둘 · 오른쪽 옆면
      const c = opt ? hex(opt) : hex('#c8705a');
      const seatD = Math.max(8, H - 10);
      const fh = 12;
      const backH = 14;
      const p = new Pix(W, backH + seatD + fh);
      block3(p, 0, 0, W, 4, backH - 4 + seatD, shade(c, -0.1), 3);
      const sy = backH;
      block3(p, 8, sy, W - 16, seatD, fh, shade(c, -0.04), 0, shade(c, 0.16));
      for (let x = 8 + (W - 16) / 3; x < W - 9; x += (W - 16) / 3) p.rect(Math.round(x), sy, 1, seatD + fh, shade(c, -0.18));
      block3(p, 0, 8, 9, sy - 8 + seatD, fh, c, 0, shade(c, 0.2));
      block3(p, W - 9, 8, 9, sy - 8 + seatD, fh, c, 3, shade(c, 0.2));
      return { pix: p.outline(), ox: 0, oy: -p.h, wall: false, faces: { topY: sy, frontY: sy + seatD, frontH: fh, sideW: 3, legs: 0 } };
    }
    case 'tv': {
      // 3면 TV: 낮은 장 (윗면 · 앞면 · 옆면) 위에 브라운관 상자 (윗면 띠 · 화면 앞면 · 옆면)
      const d = Math.max(8, H - 8);
      const fh = 14;
      const tvH = 24;
      const p = new Pix(W, tvH - 2 + d + fh);
      block3(p, 0, tvH - 2, W, d, fh, WOODF, 3);
      p.rect(4, tvH - 2 + d + 4, W - 10, 1, shade(WOODF, -0.25));
      const cab = hex('#2e2e38');
      block3(p, 4, 0, W - 10, 5, tvH - 5, cab, 3, shade(cab, 0.25));
      p.rect(7, 7, W - 19, 14, hex('#3a4a5a'));
      p.rect(8, 8, 6, 2, hex('#6a7a8a'));
      return { pix: p.outline(), ox: 0, oy: -p.h, wall: true, faces: { topY: tvH - 2, frontY: tvH - 2 + d, frontH: fh, sideW: 3, legs: 0 } };
    }
    case 'plant': {
      const p = tall(18);
      box(p, W / 2 - 6, H + 4, 12, 12, hex('#c8704a'));
      for (let i = 0; i < 7; i++) p.ball(W / 2 + (hash2(i, 1, 1) - 0.5) * 14, 6 + hash2(i, 2, 2) * (H + 2), 5, 4, shade(hex('#4a9a4a'), (hash2(i, 3, 3) - 0.5) * 0.4), true);
      return { pix: p.outline(), ox: 0, oy: -(H + 18), wall: false };
    }
    case 'boxes': {
      // opt 'open': 뚜껑 날개가 벌어진 열린 상자 하나 (안에 장난감이 선다)
      if (opt.includes('open')) return openCarton(W, H, opt);
      // 이삿짐 상자 더미 (3면 상자 둘): opt 'label' 두고 가는 짐 쪽지
      const card = hex('#c89a64');
      const tape = hex('#dcc49c');
      if (w === 1) {
        // 한 칸짜리는 상자 하나 (가는 기둥처럼 쌓지 않는다)
        const p = new Pix(W, 30);
        block3(p, 0, 0, W, 11, 19, card, 3);
        p.rect(W / 2 - 2, 0, 4, 11, tape);
        p.rect(W / 2 - 2, 11, 4, 5, shade(tape, -0.08));
        if (opt.includes('tape')) for (let x = 2; x < W - 4; x++) p.set(x, 21 + (x % 3 === 0 ? 1 : 0), shade(tape, -0.04));
        if (opt.includes('label')) {
          box(p, 3, 17, 10, 8, hex('#fff8b0'));
          p.rect(5, 20, 6, 1, INK);
        }
        return { pix: p.outline(), ox: 0, oy: -p.h, wall: false, faces: { topY: 0, frontY: 11, frontH: 19, sideW: 3, legs: 0 } };
      }
      const d = Math.max(10, H - 6);
      const fh = 18;
      const up = 16;
      const p = new Pix(W, up + d + fh);
      block3(p, 0, up, W, d, fh, card, 3);
      p.rect(W / 2 - 2, up, 4, d, tape);
      p.rect(W / 2 - 2, up + d, 4, 6, shade(tape, -0.08));
      // 위 상자 (조금 작게, 아래 상자 윗면 위에)
      const tw = W - 14;
      block3(p, 5, 0, tw, 8, up + 4, shade(card, 0.05), 3);
      p.rect(5 + tw / 2 - 2, 0, 4, 8, tape);
      p.rect(5 + tw / 2 - 2, 8, 4, 5, shade(tape, -0.08));
      if (opt.includes('label')) {
        box(p, 4, up + d + 4, 16, 10, hex('#fff8b0'));
        p.rect(6, up + d + 7, 11, 1, INK);
        p.rect(6, up + d + 10, 8, 1, INK);
      }
      return { pix: p.outline(), ox: 0, oy: -p.h, wall: false, faces: { topY: up, frontY: up + d, frontH: fh, sideW: 3, legs: 0 } };
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
    case 'facade': {
      // 집 앞면: 지붕 처마 · 벽 · 창 셋 (해 질 녘 불빛) · 가운데 현관문 · 문등
      const p = tall(30);
      const wall = hex('#e8dcc4');
      p.rect(0, 30, W, H, wall);
      for (let y = 34; y < H + 30; y += 6) p.rect(0, y, W, 1, shade(wall, -0.06));
      // 지붕
      const roof = hex('#7a4a3a');
      p.rect(0, 6, W, 26, roof);
      for (let x = 0; x < W; x += 8) for (let y = 8; y < 30; y += 6) p.rect(x + ((y / 6) % 2) * 4, y, 7, 4, shade(roof, ((x + y) % 3) * 0.04 - 0.04));
      p.rect(0, 30, W, 3, shade(roof, -0.35));
      // 다락방 둥근 창 (지붕 가운데)
      p.oval(W / 2, 16, 7, 7, hex('#3a2a28'));
      p.oval(W / 2, 16, 5, 5, hex('#ffd890'));
      // 창
      const win = (x: number) => {
        box(p, x, 40, 34, 22, hex('#8a6a4a'));
        p.rect(x + 3, 43, 28, 16, hex('#ffd890'));
        p.rect(x + 16, 43, 2, 16, hex('#8a6a4a'));
        p.rect(x + 3, 50, 28, 2, hex('#8a6a4a'));
      };
      win(24);
      win(W - 58);
      win(W / 2 + 40);
      // 현관문 · 문등
      const dx = W / 2 - 14;
      box(p, dx, 44, 28, H + 30 - 44, hex('#6a3a2a'));
      p.rect(dx + 3, 48, 22, 10, shade(hex('#6a3a2a'), 0.12));
      p.ball(dx + 22, 44 + (H + 30 - 44) / 2, 2, 2, hex('#e8c860'));
      p.ball(dx + 34, 42, 3, 3, hex('#fff0b0'));
      return { pix: p.outline(), ox: 0, oy: -(H + 30), wall: true };
    }
    case 'truck': {
      // 이삿짐 트럭: 하얀 짐칸 + 파란 운전석
      const p = tall(20);
      const box1 = hex('#f0ece4');
      box(p, 0, 0, W - 34, H + 8, box1);
      p.rect(4, 6, W - 42, 4, hex('#5a8ad8'));
      p.rect(4, 12, W - 60, 2, hex('#5a8ad8'));
      const cab = hex('#4a7ac8');
      box(p, W - 34, 10, 32, H - 2, cab);
      p.rect(W - 28, 14, 18, 10, hex('#bfe0ff'));
      for (const cx of [14, W - 64, W - 18]) {
        p.oval(cx, H + 12, 8, 8, hex('#2a2a32'));
        p.oval(cx, H + 12, 3, 3, hex('#c8c8d0'));
      }
      return { pix: p.outline(), ox: 0, oy: -(H + 20), wall: false };
    }
    case 'swing': {
      // 할아버지가 만든 나무 그네: A자 기둥 · 밧줄 · 판자
      const p = tall(34);
      const wood = hex('#9a6a3a');
      p.line(3, H + 34, 10, 2, wood);
      p.line(5, H + 34, 12, 2, wood);
      p.line(W - 4, H + 34, W - 11, 2, wood);
      p.line(W - 6, H + 34, W - 13, 2, wood);
      p.rect(8, 1, W - 16, 4, wood);
      p.rect(16, 5, 1, H + 14, hex('#d8c8a8'));
      p.rect(W - 17, 5, 1, H + 14, hex('#d8c8a8'));
      box(p, 13, H + 18, W - 26, 4, shade(wood, 0.1));
      return { pix: p.outline(), ox: 0, oy: -(H + 34), wall: false };
    }
    case 'mailbox': {
      const p = tall(16);
      p.rect(W / 2 - 1, 14, 3, H + 2, hex('#6a4a2a'));
      box(p, W / 2 - 8, 2, 16, 13, hex('#d84a4a'));
      p.rect(W / 2 - 6, 4, 12, 2, shade(hex('#d84a4a'), 0.2));
      p.rect(W / 2 + 6, 0, 2, 6, hex('#ffd84a'));
      return { pix: p.outline(), ox: 0, oy: -(H + 16), wall: false };
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
    // ───────────── 집 밖 ─────────────
    case 'pole': return pole(W, H, look, opt);
    case 'lamp': return lamp(W, H, look);
    case 'tree': return tree(W, H, look, opt);
    case 'gate': return gate(W, H, look, opt);
    case 'nwall': return nwall(W, H, look, opt);
    case 'shop': return shop(W, H, look);
    case 'bldg': return opt.includes('school') ? school(W, H, look) : hospital(W, H, look);
    case 'busstop': return busstop(W, H);
    case 'bench': return bench(W, H, opt);
    case 'slide': return slide(W, H);
    case 'swingset': return swingset(W, H, w);
    case 'seesaw': return seesaw(W, H);
    case 'jungle': return jungle(W, H);
    case 'crosswalk': return crosswalk(W, H, look);
    case 'road': return road(W, H, look);
    case 'sandbox': return sandbox(W, H, look);
    case 'ruts': return ruts(W, H, look);
    case 'well': return well(W, H, look);
    case 'thatch': return thatch(W, H, look);
    case 'stonewall': return stonewallRow(W, H, look);
    case 'signpost': return signpost(W, H, opt);
    case 'cart': return cart(W, H, opt);
    case 'crocks': return crocks(W, H, w);
    default: {
      const p = new Pix(W, H);
      box(p, 0, 0, W, H, hex('#c0a080'));
      return { pix: p.outline(), ox: 0, oy: -H, wall: false };
    }
  }
}

/** 종이별이 가득한 유리병 */
/**
 * 열린 이삿짐 상자 (발자리 w×h 칸 전체가 상자 안 = 높은 층).
 * behind: 펼친 뒷날개 · 뒷벽 안쪽 · 바닥 · 양옆 안벽 · 옆 날개 (안에 선 인물보다 먼저)
 * front : 앞 테두리 · 앞면 (쪽지 · 뜯긴 테이프) · 오른쪽 옆면 — 안에 선 인물의 발만 가린다.
 */
function openCarton(W: number, H: number, opt: string): RawSprite {
  const card = hex('#c89a64');
  const inner = hex('#a87c50');
  const tape = hex('#dcc49c');
  const fl = 9;
  const PW = W + fl * 2;
  const up = 26;
  // 앞면은 발 줄 아래 단 앞면(S) 칸까지 덮는다 (상자 밑동이 바닥에 닿는 자리)
  const sink = 10;
  const Ht = H + up + sink;
  const full = new Pix(PW, Ht);
  const x0 = fl;
  const x1 = fl + W;
  const rimB = 14;
  const floorY = 28;
  const rimF = 52;
  const sw = 4;
  // 뒷날개: 뒤로 젖혀져 세워짐 (안쪽 면이 보인다), 위 가장자리는 조금 구겨짐
  for (let x = x0 + 3; x < x1 - 5; x++) {
    const top = 2 + Math.round(hash2(x >> 3, 0, 801) * 2);
    for (let y = top; y < rimB; y++) full.set(x, y, shade(inner, 0.1 - (y - top) * 0.012));
    full.set(x, top, shade(inner, 0.32));
  }
  for (let y = 3; y < rimB; y++) full.set(x0 + Math.floor((W - 8) / 2), y, shade(inner, -0.14));
  // 뜯긴 테이프가 뒷날개에 매달림
  const tx = x0 + Math.floor(W * 0.62);
  full.rect(tx, 2, 5, 9, tape);
  full.rect(tx, 2, 1, 9, shade(tape, 0.3));
  for (let x = tx; x < tx + 5; x++) full.set(x, 11 + (x % 2), tape);
  // 양옆 날개: 바깥으로 벌어짐 (왼쪽은 빛을 받고 오른쪽은 그늘)
  for (let y = rimB + 4; y < rimF - 6; y++) {
    const t = (y - rimB - 4) / (rimF - 10 - rimB);
    const reach = Math.round(fl - 1 - t * 3);
    for (let k = 0; k <= reach; k++) full.set(x0 - k, y, shade(card, 0.16 - k * 0.012));
    full.set(x0 - reach, y, shade(card, -0.25));
    for (let k = 0; k <= reach - 1; k++) full.set(x1 + k, y + 2, shade(card, -0.3 - k * 0.01));
    full.set(x1 + reach - 1, y + 2, shade(card, -0.5));
  }
  // 뒷 테두리 (뒷면 윗변) · 뒷벽 안쪽 (그늘)
  full.rect(x0, rimB, W, 2, shade(card, 0.3));
  for (let y = rimB + 2; y < floorY; y++) full.rect(x0 + 2, y, W - sw - 2, 1, shade(inner, -0.22 - (y - rimB) * 0.008));
  // 바닥 (뒤쪽이 가장 어둡다) · 구겨진 신문지
  for (let y = floorY; y < rimF; y++) {
    const t = (y - floorY) / (rimF - floorY);
    for (let x = x0 + 2; x < x1 - sw; x++) full.set(x, y, shade(inner, -0.42 + t * 0.16 + (hash2(x >> 2, y >> 1, 802) - 0.5) * 0.05));
  }
  for (const [cx, cy, r] of [[x0 + 7, floorY + 4, 4], [x1 - sw - 8, rimF - 5, 5]] as const) {
    full.ball(cx, cy, r, r * 0.6, hex('#bcb4a4'), true);
    full.set(cx - 1, cy - 1, hex('#8a8478'));
    full.set(cx + 1, cy, hex('#8a8478'));
  }
  // 양옆 안벽: 왼쪽 안벽은 오른쪽을 보고 밝고, 오른쪽 안벽은 그늘
  full.rect(x0, rimB, 2, rimF - rimB, shade(card, 0.22));
  full.rect(x0 + 2, rimB + 2, 2, rimF - rimB - 2, shade(inner, -0.05));
  full.rect(x1 - sw - 3, rimB + 2, 3, rimF - rimB - 2, shade(inner, -0.5));
  // 앞 테두리 + 앞면
  const front = new Pix(PW, Ht);
  front.rect(x0, rimF, W - sw, 2, shade(card, 0.32));
  front.rect(x0, rimF + 2, W - sw, Ht - rimF - 2, card);
  front.rect(x0, rimF + 2, W - sw, 1, shade(card, -0.12));
  front.rect(x0, Ht - 1, W - sw, 1, shade(card, -0.42));
  // 오른쪽 옆면 (위로 갈수록 뒤로)
  for (let k = 0; k < sw; k++) full.rect(x1 - sw + k, rimB + 1 + k, 1, rimF - rimB, shade(card, -0.36));
  for (let k = 0; k < sw; k++) front.rect(x1 - sw + k, rimF, 1, Ht - rimF, shade(card, -0.36));
  front.rect(x1 - sw, Ht - 1, sw, 1, shade(card, -0.55));
  // 앞면: 반쯤 뜯긴 세로 테이프 · 쪽지
  const mx = x0 + Math.floor((W - sw) / 2) - 2;
  front.rect(mx, rimF, 5, 9, tape);
  front.rect(mx, rimF, 1, 9, shade(tape, 0.3));
  for (let x = mx; x < mx + 5; x++) front.set(x, rimF + 9 + (x % 2), tape);
  if (opt.includes('label')) {
    box(front, x0 + 4, rimF + 6, 16, 11, hex('#fff8b0'));
    front.rect(x0 + 6, rimF + 9, 11, 1, INK);
    front.rect(x0 + 6, rimF + 12, 8, 1, INK);
    front.rect(x0 + 6, rimF + 14, 10, 1, shade(INK, 0.4));
  }
  full.stamp(front, 0, 0);
  full.outline();
  // 외곽선까지 나눈다: 앞 테두리 줄부터 아래는 앞부분
  const behind = new Pix(PW, Ht);
  const fr = new Pix(PW, Ht);
  for (let y = 0; y < Ht; y++) for (let x = 0; x < PW; x++) (y < rimF ? behind : fr).set(x, y, full.get(x, y));
  return { pix: full, ox: -fl, oy: -(Ht - sink), wall: false, behind, front: fr, faces: { topY: rimB, frontY: rimF, frontH: Ht - rimF, sideW: sw, legs: 0 } };
}

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
export const FLAT = new Set(['rug', 'puddle', 'mud', 'crosswalk', 'road', 'sandbox', 'ruts']);

/** furnitureSprite 가 아는 가구 이름 */
const FURN_KINDS = new Set([
  'bed', 'crib', 'desk', 'chair', 'shelf', 'claw', 'wardrobe', 'toybox', 'window', 'door', 'rug', 'table', 'sofa', 'tv', 'plant', 'boxes', 'sewing',
  'photo', 'clock', 'garland', 'hbed', 'iv', 'fence', 'flowers', 'puddle', 'mud', 'bush', 'stage', 'bathtub', 'sink', 'facade', 'truck', 'swing',
  'mailbox', 'bike', 'railing', 'stool', 'pots', 'cushion', 'calendar', 'pole', 'lamp', 'tree', 'gate', 'nwall', 'shop', 'bldg', 'busstop', 'bench',
  'slide', 'swingset', 'seesaw', 'jungle', 'crosswalk', 'road', 'sandbox', 'ruts', 'well', 'thatch', 'stonewall', 'signpost', 'cart', 'crocks',
]);

// ───────────────────────── 집 밖 가구 ─────────────────────────
// 사람은 1칸 폭 · 2칸 키 (24×48). 전봇대 · 가로수는 사람 키의 두 배쯤, 건물 앞면은 4칸 높이로 위쪽 띠에 붙는다.

const evening = (L: HouseLook) => L.sky === 'dusk' || L.sky === 'night';
const LIT = hex('#ffdc8a');
const IRON = hex('#4a5660');

/** 늘어진 줄 (전선 · 그넷줄) */
function sag(p: Pix, x0: number, y0: number, x1: number, y1: number, depth: number, c: Color): void {
  const n = Math.max(1, Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    p.set(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t + Math.sin(Math.PI * t) * depth), c);
  }
}

/** 굵은 선 (막대 · 철봉) — 위 · 왼쪽 줄은 밝게 */
function rod(p: Pix, x0: number, y0: number, x1: number, y1: number, c: Color, t = 2): void {
  for (let k = 0; k < t; k++) {
    const col = k === 0 ? shade(c, 0.28) : k === t - 1 && t > 2 ? shade(c, -0.22) : c;
    p.line(x0 + (Math.abs(y1 - y0) > Math.abs(x1 - x0) ? k : 0), y0 + (Math.abs(y1 - y0) > Math.abs(x1 - x0) ? 0 : k), x1 + (Math.abs(y1 - y0) > Math.abs(x1 - x0) ? k : 0), y1 + (Math.abs(y1 - y0) > Math.abs(x1 - x0) ? 0 : k), col);
  }
}

/** 간판 글씨 (읽히지는 않는 한글 모양 덩어리) */
function glyphs(p: Pix, x: number, y: number, n: number, size: number, c: Color, seed: number): void {
  for (let i = 0; i < n; i++) {
    const gx = x + i * (size + 2);
    // 자음 (위 · 왼쪽) + 모음 (오른쪽 세로 획) + 받침 (아래)
    p.rect(gx, y, size - 3, 1, c);
    if (hash2(i, seed, 1) < 0.6) p.rect(gx, y, 1, size / 2, c);
    else p.rect(gx + (size - 4), y, 1, size / 2, c);
    p.rect(gx + size - 2, y, 1, size - (hash2(i, seed, 2) < 0.5 ? 2 : 0), c);
    p.rect(gx + size - 2, y + Math.floor(size / 3), 2, 1, c);
    if (hash2(i, seed, 3) < 0.6) p.rect(gx, y + size - 2, size - 3, 1, c);
  }
}

/** 전봇대 + 전선. opt 'l6r9': 전선이 왼쪽 6칸 · 오른쪽 9칸까지 뻗는다 (다음 전봇대 · 담 너머로) */
function pole(W: number, H: number, L: HouseLook, opt: string): RawSprite {
  const l = Number(/l(\d+)/.exec(opt)?.[1] ?? 2);
  const r = Number(/r(\d+)/.exec(opt)?.[1] ?? 2);
  const ext = 72;
  const T = H + ext;
  const left = l * HT;
  const p = new Pix(left + W + r * HT, T);
  const cx = left + Math.floor(W / 2);
  const conc = hex('#c2beb4');
  p.bar(cx - 3, 6, 6, T - 6, conc);
  p.rect(cx - 2, 4, 4, 2, shade(conc, 0.15));
  // 아래쪽 노랑 · 검정 띠 (밤에 부딪히지 말라고)
  for (let k = 0; k < 4; k++) p.rect(cx - 3, T - 18 + k * 3, 6, 2, k % 2 ? hex('#2a2a30') : hex('#f0d040'));
  // 발판 볼트
  for (let y = 30; y < T - 40; y += 7) p.rect((y / 7) % 2 < 1 ? cx - 5 : cx + 3, y, 2, 1, hex('#6a6a70'));
  // 덕지덕지 붙은 전단 (사람 눈높이)
  box(p, cx - 3, T - 44, 6, 9, hex('#f4ecd8'));
  p.rect(cx - 2, T - 42, 4, 1, hex('#8a8080'));
  p.rect(cx - 2, T - 40, 3, 1, hex('#8a8080'));
  box(p, cx - 2, T - 52, 5, 6, hex('#f0b0a0'));
  // 완금 · 변압기
  const ay = 12;
  p.rect(cx - 16, ay, 32, 3, hex('#7a7a82'));
  p.rect(cx - 16, ay, 32, 1, hex('#a8a8b0'));
  p.line(cx - 10, ay + 3, cx - 2, ay + 10, hex('#7a7a82'));
  p.bar(cx + 4, ay + 12, 9, 15, hex('#9aa4ac'));
  p.rect(cx + 3, ay + 11, 11, 2, hex('#7a8490'));
  p.rect(cx + 6, ay + 16, 5, 1, hex('#d8dce0'));
  p.outline();
  // 애자 (흰 사기) · 전선
  const wire = hex('#2a2a34');
  const ins = [cx - 14, cx - 6, cx + 5, cx + 13];
  for (const x of ins) {
    p.rect(x, ay - 3, 2, 3, hex('#f4f4f0'));
    p.set(x + 1, ay - 3, hex('#c8c8c4'));
  }
  for (const [i, x] of ins.entries()) {
    const y0 = ay - 3;
    sag(p, x, y0, 0, y0 + (i % 2) * 2, 4 + l * 2 + i, wire);
    sag(p, x + 1, y0, p.w - 1, y0 + (i % 2) * 2, 4 + r * 2 + i, wire);
  }
  // 변압기에서 집으로 들어가는 선
  sag(p, cx + 12, ay + 14, p.w - 1, ay + 4, 10, wire);
  return { pix: p, ox: -left, oy: -T, wall: false };
}

/** 가로등: 굽은 팔 끝의 등. 해 질 녘 · 밤 · 비 오는 날엔 켜져 있다 */
function lamp(W: number, H: number, L: HouseLook): RawSprite {
  const ext = 62;
  const T = H + ext;
  const p = new Pix(W + 14, T);
  const cx = Math.floor(W / 2);
  p.bar(cx - 2, 10, 4, T - 10, IRON);
  box(p, cx - 4, T - 8, 8, 8, shade(IRON, 0.1));
  // 굽은 팔
  for (let i = 0; i <= 10; i++) p.rect(cx - 1 + i, 9 - Math.round(Math.sin((i / 10) * Math.PI * 0.5) * 3), 2, 2, IRON);
  const on = L.sky !== 'day';
  box(p, cx + 6, 3, 12, 5, hex('#5a6870'));
  p.rect(cx + 7, 8, 10, 2, on ? LIT : hex('#d8dcd4'));
  if (on) p.rect(cx + 8, 10, 8, 1, shade(LIT, 0.4));
  p.outline();
  return { pix: p, ox: 0, oy: -T, wall: false };
}

/** 나무: 기본 초록 가로수. opt 'ginkgo' 노란 은행나무 · 'persimmon' 감나무 (주황 감). 보도 · 골목이면 밑동에 철망 덮개 */
function tree(W: number, H: number, L: HouseLook, opt: string): RawSprite {
  const ext = 72;
  const T = H + ext;
  const side = 26;
  const p = new Pix(W + side * 2, T);
  const cx = side + Math.floor(W / 2);
  const kind = opt.includes('ginkgo') ? 'ginkgo' : opt.includes('persimmon') ? 'persimmon' : 'green';
  const bark = kind === 'persimmon' ? hex('#4e3a2c') : hex('#6a5444');
  p.bar(cx - 4, 36, 8, T - 36, bark);
  p.rect(cx - 6, T - 4, 12, 4, shade(bark, -0.1));
  for (let y = 44; y < T - 6; y += 5) p.set(cx - 2 + ((y * 7) % 5), y, shade(bark, -0.3));
  rod(p, cx - 1, 54, cx - 15, 36, bark, 2);
  rod(p, cx, 50, cx + 14, 32, bark, 2);
  const leaf = kind === 'ginkgo' ? hex('#ecc23a') : kind === 'persimmon' ? hex('#5a8a3c') : L.sky === 'rain' ? hex('#4a8248') : L.sky === 'dusk' ? hex('#5a8a44') : hex('#5c9c48');
  const cy = 30;
  const rx = kind === 'ginkgo' ? 20 : 30;
  const ry = kind === 'ginkgo' ? 28 : 25;
  const leaves: [number, number, number][] = [];
  for (let i = 0; i < 70; i++) {
    const a = hash2(i, 1, 201) * Math.PI * 2;
    const d = Math.sqrt(hash2(i, 2, 202));
    const y = cy + Math.sin(a) * ry * d;
    // 은행나무는 위가 좁은 원뿔꼴
    const k = kind === 'ginkgo' ? 0.45 + 0.55 * ((y - (cy - ry)) / (ry * 2)) : 1;
    leaves.push([cx + Math.cos(a) * rx * d * k, y, i]);
  }
  leaves.sort((a, b) => b[1] - a[1]);
  p.oval(cx, cy + 4, rx * 0.9, ry * 0.85, shade(leaf, -0.4));
  for (const [x, y, i] of leaves) {
    const k = -((y - cy) / ry) * 0.2 + (hash2(i, 5, 205) - 0.5) * 0.16;
    p.ball(x, y, 5 + hash2(i, 3, 203) * 3, 4.5 + hash2(i, 4, 204) * 2, shade(leaf, k), true);
    // 잎 덩이 끝의 낱잎
    if (hash2(i, 6, 206) < 0.5) p.set(Math.round(x - 4), Math.round(y - 4), shade(leaf, k + 0.3));
  }
  if (kind === 'persimmon')
    for (let i = 0; i < 14; i++) {
      const x = cx + (hash2(i, 6, 206) - 0.5) * rx * 1.6;
      const y = cy + (hash2(i, 7, 207) - 0.3) * ry * 1.3;
      p.ball(x, y, 2.5, 2.2, hex('#f07a28'));
      p.set(Math.round(x), Math.round(y) - 3, hex('#3a5a28'));
    }
  if (OUTDOOR_PAVED.has(L.floorKind)) {
    // 가로수 밑동 철망 덮개
    p.rect(cx - 11, T - 5, 22, 5, shade(IRON, -0.2));
    for (let x = cx - 10; x < cx + 10; x += 3) p.rect(x, T - 4, 2, 3, shade(IRON, 0.15));
  }
  p.outline();
  if (kind === 'ginkgo') for (let i = 0; i < 10; i++) p.set(cx + (hash2(i, 8, 208) - 0.5) * 40, T - 1 - hash2(i, 9, 209) * 5, hex('#f4d050'));
  return { pix: p, ox: -side, oy: -T, wall: false };
}

const OUTDOOR_PAVED = new Set<HouseLook['floorKind']>(['asphalt', 'paving']);

/** 벽돌 무늬로 칠하기 (담 · 기둥) */
function bricks(p: Pix, x0: number, y0: number, w: number, h: number, c: Color): void {
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const row = Math.floor(y / 5);
      const off = row % 2 ? 6 : 0;
      let col = shade(c, (hash2(row, Math.floor((x + off) / 12), 211) - 0.5) * 0.16);
      if (y % 5 === 0 || (x + off) % 12 === 0) col = shade(c, 0.3);
      else if (y % 5 === 4) col = shade(col, -0.12);
      p.set(x0 + x, y0 + y, col);
    }
}

/** 파란 철 대문 (하루네). 양쪽 벽돌 기둥 · 문패 · 초인종. opt 'open': 한 짝이 안으로 열려 마당이 보인다 */
function gate(W: number, H: number, L: HouseLook, opt: string): RawSprite {
  const T = H + 24;
  const p = new Pix(W, T);
  const blue = hex('#3a78c8');
  const pw = 9;
  const top = 16;
  // 기둥
  for (const x of [0, W - pw]) {
    bricks(p, x, 8, pw, T - 8, L.wall);
    box(p, x - 0, 4, pw, 5, L.base);
    p.rect(x + pw - 1, 8, 1, T - 8, shade(L.wall, -0.3));
  }
  // 문패 · 초인종
  box(p, 2, 24, 5, 9, hex('#e8dcb8'));
  p.rect(3, 26, 3, 1, INK);
  p.rect(3, 28, 3, 1, INK);
  p.rect(3, 30, 2, 1, INK);
  box(p, 3, 38, 4, 5, hex('#e8e4dc'));
  p.set(5, 40, hex('#e84a4a'));
  const gx = pw;
  const gw = W - pw * 2;
  const leaf = (x: number, w: number) => {
    box(p, x, top, w, T - top - 1, blue);
    // 위 창살 (뒤가 어둡게 비친다)
    p.rect(x + 3, top + 4, w - 6, 15, hex('#24303e'));
    for (let xx = x + 4; xx < x + w - 3; xx += 4) p.rect(xx, top + 4, 2, 15, shade(blue, 0.12));
    p.ball(x + w / 2, top + 11, 4, 4, shade(blue, 0.05));
    // 아래 철판 (볼록한 네모 무늬)
    box(p, x + 3, top + 22, w - 6, T - top - 27, shade(blue, 0.06));
    box(p, x + 6, top + 26, w - 12, T - top - 36, shade(blue, -0.05));
    for (let xx = x + 1; xx < x + w - 1; xx += 4) p.tri(xx, top, xx + 3, top, xx + 1.5, top - 4, blue);
  };
  if (opt.includes('open')) {
    const half = Math.floor(gw / 2);
    leaf(gx, half);
    // 열린 쪽: 마당 · 현관 계단이 보인다
    const ox = gx + half;
    const ow = gw - half;
    p.rect(ox, top - 2, ow, T - top + 2, hex('#e8dcc4'));
    p.rect(ox, top + 22, ow, T - top - 22, hex('#8ab070'));
    p.rect(ox + 4, top + 26, ow - 8, T - top - 26, hex('#c8bca8'));
    for (let y = top + 28; y < T; y += 4) p.rect(ox + 4, y, ow - 8, 1, hex('#a89c88'));
    box(p, ox + 6, top + 2, ow - 12, 18, hex('#6a3a2a'));
    p.rect(ox, top - 2, ow, 3, hex('#7a4a3a'));
    // 안쪽으로 젖혀진 문짝 (옆에서 본 얇은 판)
    box(p, ox + ow - 6, top, 5, T - top - 4, shade(blue, -0.2));
  } else {
    leaf(gx, Math.floor(gw / 2));
    leaf(gx + Math.floor(gw / 2), gw - Math.floor(gw / 2));
    p.rect(gx + Math.floor(gw / 2) - 4, top + 20, 2, 4, hex('#d8d8d8'));
  }
  return { pix: p.outline(), ox: 0, oy: -T, wall: true };
}

/** 이웃집 담: 담 너머 지붕 · 창. opt 'ivy' 담쟁이 · 'mesh' 학교 철망 울타리 · 'red' / 'blue' / 'green' 지붕 색 · 'low' 지붕 없이 담만 */
function nwall(W: number, H: number, L: HouseLook, opt: string): RawSprite {
  const T = H + 24;
  const p = new Pix(W, T);
  if (opt.includes('mesh')) {
    // 학교 운동장 쪽: 덤불 · 흙 위에 초록 철망
    p.rect(0, 10, W, T - 24, hex('#c8ac7c'));
    for (let i = 0; i < W / 6; i++) p.ball(hash2(i, 1, 221) * W, 12 + hash2(i, 2, 222) * 12, 6, 5, shade(L.accent, (hash2(i, 3, 223) - 0.5) * 0.3), true);
    for (let y = 8; y < T - 14; y++) for (let x = 0; x < W; x++) if ((x + y) % 6 === 0 || (x - y + 600) % 6 === 0) p.set(x, y, hex('#3a8a5a'));
    p.rect(0, 7, W, 2, hex('#2a6a44'));
    for (let x = 2; x < W; x += HT) p.bar(x, 6, 3, T - 18, hex('#2a6a44'));
    box(p, 0, T - 14, W, 14, hex('#cbc6bc'));
    return { pix: p.outline(), ox: 0, oy: -T, wall: true };
  }
  const wallTop = T - 36;
  if (opt.includes('low')) {
    // 담 너머 정원수 (둥근 회양목 · 키 작은 나무)
    for (let i = 0; i < W / 5; i++) {
      const x = hash2(i, 1, 229) * W;
      const y = wallTop - 6 - hash2(i, 2, 229) * 22;
      p.ball(x, y, 7, 6, shade(L.accent, (hash2(i, 3, 229) - 0.5) * 0.3 + (y - wallTop) * 0.006), true);
    }
  } else {
    const roof = opt.includes('blue') ? hex('#4a6a9a') : opt.includes('green') ? hex('#4a8a6a') : opt.includes('red') ? hex('#b85a48') : [hex('#b85a48'), hex('#4a6a9a'), hex('#5a7a5a')][Math.floor(hash2(W, H, 224) * 3)];
    const hw = evening(L) ? hex('#d8c8b4') : hex('#ece2d0');
    p.rect(6, 14, W - 12, wallTop - 10, hw);
    for (let y = 16; y < wallTop; y += 5) p.rect(6, y, W - 12, 1, shade(hw, -0.05));
    for (let x = 18; x + 22 < W - 6; x += 44) {
      box(p, x, 19, 22, 13, hex('#e8e4dc'));
      p.rect(x + 2, 21, 18, 9, evening(L) ? LIT : hex('#8ab0c8'));
      p.rect(x + 10, 21, 1, 9, hex('#e8e4dc'));
      if (!evening(L)) p.rect(x + 3, 22, 4, 1, hex('#d8eef8'));
      // 방범창
      for (let xx = x + 3; xx < x + 20; xx += 3) p.rect(xx, 20, 1, 11, hex('#5a5a62'));
    }
    p.rect(0, 2, W, 12, roof);
    for (let y = 4; y < 14; y += 3) p.rect(0, y, W, 1, shade(roof, -0.18));
    for (let x = 0; x < W; x += 5) p.rect(x, 2, 1, 12, shade(roof, 0.1));
    p.rect(0, 2, W, 1, shade(roof, 0.35));
    p.rect(4, 14, W - 8, 2, shade(roof, -0.45));
  }
  bricks(p, 0, wallTop, W, T - wallTop, L.wall);
  box(p, 0, wallTop - 4, W, 5, L.base);
  p.rect(0, T - 2, W, 2, shade(L.wall, -0.4));
  if (opt.includes('ivy'))
    for (let i = 0; i < W / 3; i++) {
      const x = hash2(i, 1, 225) * W;
      const y = wallTop - 3 + hash2(i, 2, 226) * hash2(i, 3, 227) * 30;
      p.ball(x, y, 3, 2.5, shade(L.accent, (hash2(i, 4, 228) - 0.5) * 0.4), true);
    }
  return { pix: p.outline(), ox: 0, oy: -T, wall: true };
}

/** 동네 구멍가게 앞면: 간판 · 줄무늬 차양 · 유리문 · 진열 상자 · 아이스크림 냉장고 · 평상 */
function shop(W: number, H: number, L: HouseLook): RawSprite {
  const T = H + 24;
  const p = new Pix(W, T);
  const ev = evening(L);
  // 건물 벽 · 간판
  p.rect(2, 0, W - 4, T - 24, hex('#e4dccc'));
  box(p, 6, 2, W - 12, 15, hex('#2a5aa8'));
  p.rect(8, 4, W - 16, 1, hex('#4a7ad0'));
  glyphs(p, W / 2 - 30, 6, 5, 9, hex('#f8f4e8'), 3);
  p.ball(16, 9, 4, 4, hex('#e8584a'));
  // 가게 안 (유리문 · 선반)
  const iy = 32;
  const ih = T - 24 - iy;
  p.rect(4, iy, W - 8, ih, ev ? hex('#8a6a48') : hex('#3a3a44'));
  for (let r = 0; r < 3; r++) {
    const sy = iy + 6 + r * 9;
    p.rect(6, sy + 6, W - 12, 1, hex('#a8a098'));
    for (let x = 7; x < W - 8; x += 3) if (hash2(x, r, 231) < 0.8) p.rect(x, sy + 1 + Math.floor(hash2(x, r, 232) * 2), 2, 5 - Math.floor(hash2(x, r, 232) * 2), [hex('#e8584a'), hex('#f0c840'), hex('#5a9ad8'), hex('#f0f0e8'), hex('#6ab05a'), hex('#e88a3a')][Math.floor(hash2(x, r, 233) * 6)]);
  }
  // 유리문 틀 (알루미늄)
  for (const x of [4, W / 2 - 22, W / 2 + 22, W - 6]) p.rect(x, iy, 2, ih, hex('#c8ccd0'));
  p.rect(W / 2 - 1, iy, 2, ih, hex('#c8ccd0'));
  for (const x of [W / 2 - 18, W / 2 + 4]) p.rect(x, iy + 4, 2, ih - 8, ev ? shade(LIT, 0.3) : hex('#8a9aa8'));
  // 줄무늬 차양 (가장자리 물결)
  const ay = 18;
  for (let x = 0; x < W; x++) {
    const red = Math.floor(x / 8) % 2 === 0;
    const c = red ? hex('#d84a42') : hex('#f4f0e8');
    p.rect(x, ay, 1, 12, x < 2 || x > W - 3 ? shade(c, -0.2) : c);
    p.set(x, ay, shade(c, 0.3));
    const sc = 12 + Math.round(Math.sin(((x % 8) / 8) * Math.PI) * 3);
    p.rect(x, ay + 12, 1, sc - 12, shade(c, -0.08));
  }
  // 바깥 진열: 라면 상자 · 과일 바구니 (가운데)
  const fy = T - 24;
  box(p, W / 2 - 18, fy - 4, 16, 14, hex('#c89a64'));
  p.rect(W / 2 - 16, fy, 12, 3, hex('#e8584a'));
  box(p, W / 2 - 1, fy + 2, 18, 8, hex('#a8784a'));
  for (let i = 0; i < 6; i++) p.ball(W / 2 + 2 + i * 2.6, fy + 1 + (i % 2), 2.2, 2, i % 2 ? hex('#e8584a') : hex('#f0a838'));
  box(p, W / 2 - 16, fy + 10, 12, 10, hex('#3a8ad8'));
  box(p, W / 2 - 14, fy + 6, 8, 5, hex('#3a8ad8'));
  // 아이스크림 냉장고 (왼쪽 앞)
  const fx = 6;
  box(p, fx, fy + 4, 40, 18, hex('#f4f4f0'));
  p.rect(fx + 2, fy + 14, 36, 3, hex('#3a78d8'));
  glyphs(p, fx + 6, fy + 18, 3, 4, hex('#e8584a'), 7);
  box(p, fx + 1, fy - 2, 38, 7, hex('#cfe8f4'));
  for (let i = 0; i < 9; i++) p.rect(fx + 4 + i * 4, fy - 1 + (i % 2), 3, 3, [hex('#f0c840'), hex('#e85a8a'), hex('#8a5a3a'), hex('#f8f8f8'), hex('#6ac0e8')][i % 5]);
  p.rect(fx + 3, fy - 2, 14, 1, hex('#ffffff'));
  // 평상 (오른쪽 앞, 나무 판)
  const px0 = W - 62;
  box(p, px0, fy + 6, 56, 10, hex('#b8844a'));
  for (let x = px0 + 7; x < px0 + 56; x += 7) p.rect(x, fy + 6, 1, 10, hex('#8a5a32'));
  p.rect(px0, fy + 6, 56, 2, hex('#d8a868'));
  for (const x of [px0 + 2, px0 + 52]) p.rect(x, fy + 16, 3, 6, hex('#6a4426'));
  // 평상 위 바둑판 · 부채
  box(p, px0 + 30, fy + 4, 12, 5, hex('#e8c878'));
  p.rect(px0 + 31, fy + 6, 10, 1, hex('#8a6a3a'));
  p.ball(px0 + 12, fy + 6, 4, 2, hex('#7aa8d8'));
  return { pix: p.outline(), ox: 0, oy: -T, wall: true };
}

/** 병원 정문: 하얀 타일 건물 · 빨간 십자 · 차양 · 유리 자동문 · 화단 */
function hospital(W: number, H: number, L: HouseLook): RawSprite {
  const T = H + 24;
  const p = new Pix(W, T);
  const tile = L.sky === 'rain' ? hex('#d8dcdc') : hex('#eceeea');
  p.rect(0, 0, W, T, tile);
  for (let y = 0; y < T; y += 6) p.rect(0, y, W, 1, shade(tile, -0.06));
  // 창 두 줄
  for (const wy of [3, 22])
    for (let x = 6; x + 14 < W; x += 20) {
      if (wy === 22 && x > W / 2 - 40 && x < W / 2 + 26) continue;
      box(p, x, wy, 14, 13, hex('#9aa8b0'));
      p.rect(x + 2, wy + 2, 10, 9, L.sky === 'rain' ? hex('#5a7488') : hex('#7aa8c8'));
      p.rect(x + 2, wy + 2, 10, 1, hex('#b8d0e0'));
      p.rect(x + 7, wy + 2, 1, 9, hex('#9aa8b0'));
    }
  // 빨간 십자 간판
  box(p, W / 2 - 10, 18, 20, 20, hex('#f8f8f8'));
  p.rect(W / 2 - 2, 21, 4, 14, hex('#e03a3a'));
  p.rect(W / 2 - 7, 26, 14, 4, hex('#e03a3a'));
  p.rect(W / 2 - 2, 21, 1, 14, hex('#f86a6a'));
  // 차양 (콘크리트 판 + 이름 띠)
  const cy = 40;
  box(p, W / 2 - 44, cy, 88, 9, hex('#c8ccd0'));
  p.rect(W / 2 - 42, cy + 2, 84, 5, hex('#3a8a7a'));
  glyphs(p, W / 2 - 30, cy + 2, 6, 5, hex('#f4f8f4'), 11);
  for (const x of [W / 2 - 42, W / 2 + 38]) p.bar(x, cy + 9, 4, T - cy - 13, hex('#c8ccd0'));
  // 유리 자동문 (안은 불빛)
  const dy = cy + 9;
  const inside = hex('#e8eed8');
  p.rect(W / 2 - 34, dy, 68, T - dy - 4, hex('#5a6a70'));
  for (const x of [W / 2 - 32, W / 2 + 1]) {
    box(p, x, dy + 1, 31, T - dy - 6, hex('#a8c0c8'));
    p.rect(x + 2, dy + 3, 27, T - dy - 10, mix(inside, hex('#8aa8b8'), 0.4));
    p.line(x + 4, dy + 4, x + 12, dy + 16, hex('#f0f8ff'));
    p.line(x + 8, dy + 4, x + 14, dy + 12, hex('#f0f8ff'));
  }
  p.rect(W / 2 - 1, dy, 2, T - dy - 4, hex('#3a4a50'));
  // 계단 · 경사로
  box(p, W / 2 - 40, T - 4, 80, 4, hex('#c4c4c0'));
  // 양옆 화단
  for (const x of [8, W - 52]) {
    box(p, x, T - 10, 44, 10, hex('#b8b4ac'));
    for (let i = 0; i < 7; i++) p.ball(x + 4 + i * 6, T - 12 - (i % 2) * 2, 5, 4, shade(L.accent, (i % 3) * 0.08), true);
  }
  return { pix: p.outline(), ox: 0, oy: -T, wall: true };
}

/** 학교 정문: 운동장 너머 학교 건물 (가운데 시계) · 정문 기둥 · 학교 이름판 · 밀어 여는 철문 · 양옆 철망 담 */
function school(W: number, H: number, L: HouseLook): RawSprite {
  const T = H + 24;
  const p = new Pix(W, T);
  // 운동장 너머 건물
  const bw = hex('#f0e2c4');
  p.rect(0, 0, W, 34, bw);
  p.rect(0, 0, W, 2, hex('#b8a888'));
  for (let x = 4; x + 10 < W; x += 14) {
    if (Math.abs(x + 5 - W / 2) < 14) continue;
    for (const wy of [5, 19]) {
      box(p, x, wy, 10, 10, hex('#8a9aa0'));
      p.rect(x + 1, wy + 1, 8, 8, hex('#9ac4dc'));
      p.rect(x + 1, wy + 1, 8, 1, hex('#d0e8f4'));
    }
  }
  // 가운데 시계탑
  box(p, W / 2 - 12, 0, 24, 34, shade(bw, -0.06));
  p.ball(W / 2, 11, 7, 7, hex('#f8f8f0'), true);
  p.line(W / 2, 11, W / 2, 6, INK);
  p.line(W / 2, 11, W / 2 + 3, 12, INK);
  p.rect(W / 2 - 6, 22, 12, 12, hex('#6a5a4a'));
  // 운동장 흙 · 국기 게양대
  p.rect(0, 34, W, T - 34, hex('#d4b884'));
  for (let i = 0; i < 30; i++) p.set(hash2(i, 1, 241) * W, 36 + hash2(i, 2, 242) * (T - 38), hex('#c0a070'));
  p.rect(W / 2 + 40, 4, 1, 40, hex('#c8c8c8'));
  p.rect(W / 2 + 41, 5, 8, 5, hex('#f4f4f0'));
  p.ball(W / 2 + 45, 7.5, 1.5, 1.5, hex('#d84a4a'));
  // 양옆 철망 담
  const gl = W / 2 - 34;
  const gr = W / 2 + 34;
  for (const [a, b] of [[0, gl - 10], [gr + 10, W]] as const) {
    for (let y = 36; y < T - 12; y++) for (let x = a; x < b; x++) if ((x + y) % 6 === 0 || (x - y + 600) % 6 === 0) p.set(x, y, hex('#3a8a5a'));
    p.rect(a, 35, b - a, 2, hex('#2a6a44'));
    box(p, a, T - 12, b - a, 12, hex('#cbc6bc'));
  }
  // 정문 기둥 · 이름판
  for (const x of [gl - 10, gr]) {
    box(p, x, 28, 10, T - 28, hex('#d8d4cc'));
    box(p, x - 1, 25, 12, 4, hex('#b8b4ac'));
  }
  box(p, gl - 9, 36, 8, 26, hex('#f8f8f4'));
  for (let y = 39; y < 60; y += 5) p.rect(gl - 7, y, 4, 3, INK);
  // 밀어 여는 철문 (반쯤 열림, 오른쪽 기둥 쪽으로 접혀 있다)
  const gate = hex('#4a6a7a');
  box(p, gr - 26, T - 22, 26, 3, gate);
  box(p, gr - 26, T - 6, 26, 3, gate);
  for (let x = gr - 25; x < gr; x += 4) p.rect(x, T - 20, 1, 15, shade(gate, 0.15));
  p.ball(gr - 24, T - 2, 2, 2, hex('#2a2a30'));
  p.ball(gr - 4, T - 2, 2, 2, hex('#2a2a30'));
  return { pix: p.outline(), ox: 0, oy: -T, wall: true };
}

/** 버스 정류장: 파란 표지판 (버스 그림) · 노선표 · 철제 의자 */
function busstop(W: number, H: number): RawSprite {
  const T = H + 48;
  const p = new Pix(W, T);
  p.bar(5, 12, 3, T - 12, hex('#9aa0a8'));
  box(p, 0, 0, 14, 14, hex('#2a68b8'));
  box(p, 3, 3, 8, 7, hex('#f4f4f0'));
  p.rect(4, 4, 6, 3, hex('#2a68b8'));
  p.set(4, 10, INK);
  p.set(9, 10, INK);
  box(p, 1, 18, 11, 14, hex('#f4f4ec'));
  for (let y = 20; y < 31; y += 2) p.rect(2, y, 8 - (y % 4), 1, hex('#5a6a8a'));
  // 의자
  const sx = 16;
  box(p, sx, T - 22, W - sx - 1, 4, hex('#8aa4c0'));
  box(p, sx, T - 15, W - sx - 1, 4, hex('#9ab4d0'));
  for (const x of [sx + 1, W - 4]) p.rect(x, T - 18, 2, 18, hex('#5a6a7a'));
  return { pix: p.outline(), ox: 0, oy: -T, wall: false };
}

/** 나무 벤치 (등받이 · 철제 팔걸이). 칸마다 한 사람이 앉는다. opt 'wet': 빗물에 젖어 번들 */
function bench(W: number, H: number, opt: string): RawSprite {
  const T = H + 6;
  const p = new Pix(W, T);
  const wood = opt.includes('wet') ? hex('#8a5a36') : hex('#b07a46');
  const iron = hex('#3a4a44');
  // 등받이 (가로 판 둘) · 앉는 판 (위에서 보여 넓다) · 철제 다리
  box(p, 3, 0, W - 6, 4, wood);
  box(p, 3, 5, W - 6, 4, wood);
  box(p, 1, 11, W - 2, 5, shade(wood, 0.1));
  box(p, 1, 16, W - 2, 4, shade(wood, -0.04));
  for (const x of [2, W - 5]) {
    p.rect(x, 0, 3, 11, iron);
    p.rect(x, 0, 1, 11, shade(iron, 0.3));
    p.rect(x, 20, 3, T - 20, iron);
  }
  if (opt.includes('wet')) for (let x = 6; x < W - 6; x += 7) p.rect(x, 12, 3, 1, hex('#d8e0e8'));
  return { pix: p.outline(), ox: 0, oy: -T, wall: false };
}

/** 미끄럼틀: 왼쪽 사다리 · 난간 두른 발판 · 오른쪽으로 내려오는 빨간 미끄럼판 */
function slide(W: number, H: number): RawSprite {
  const T = H + 40;
  const p = new Pix(W, T);
  const steel = hex('#b8c0c8');
  // 받침 기둥
  p.bar(21, 18, 3, T - 18, steel);
  p.bar(44, 36, 3, T - 36, steel);
  // 사다리
  p.bar(3, 14, 3, T - 14, steel);
  p.bar(15, 14, 3, T - 14, steel);
  for (let y = 20; y < T - 2; y += 7) p.rect(6, y, 9, 2, shade(steel, -0.1));
  // 발판 · 난간
  box(p, 2, 12, 24, 6, hex('#f0c030'));
  for (const x of [2, 24]) p.rect(x, 0, 2, 13, hex('#e8584a'));
  p.rect(2, 0, 24, 2, hex('#e8584a'));
  p.rect(2, 6, 24, 1, hex('#e8584a'));
  // 미끄럼판
  const red = hex('#e85048');
  const sx0 = 24;
  const sx1 = W - 2;
  for (let x = sx0; x <= sx1; x++) {
    const t = (x - sx0) / (sx1 - sx0);
    const y = Math.round(14 + (T - 26) * (t < 0.85 ? Math.sin((t / 0.85) * Math.PI * 0.5) : 1));
    p.rect(x, y - 2, 1, 3, shade(red, -0.25));
    p.rect(x, y + 1, 1, 7, red);
    p.set(x, y + 2, shade(red, 0.4));
    p.rect(x, y + 8, 1, 2, shade(red, -0.3));
  }
  return { pix: p.outline(), ox: 0, oy: -T, wall: false };
}

/** 그네 두 개: 양 끝 A자 기둥 · 가로 쇠막대 · 쇠사슬 · 고무 앉을판. 앉을판은 가운데 칸들 (1번째 · 2번째 칸) */
function swingset(W: number, H: number, w: number): RawSprite {
  const T = H + 52;
  const p = new Pix(W, T);
  const blue = hex('#3a78c8');
  for (const x of [5, W - 7]) {
    rod(p, x, 6, x - 5, T - 1, blue, 3);
    rod(p, x, 6, x + 5, T - 1, blue, 3);
  }
  box(p, 1, 3, W - 2, 5, hex('#e8584a'));
  const seats = Array.from({ length: Math.max(1, w - 2) }, (_, i) => (i + 1) * HT + HT / 2);
  for (const cx of seats) {
    for (const x of [cx - 6, cx + 5])
      for (let y = 8; y < T - 13; y++) p.set(x, y, y % 3 ? hex('#a8b0b8') : hex('#6a7078'));
    box(p, cx - 8, T - 14, 16, 4, hex('#3a3a44'));
    p.rect(cx - 7, T - 14, 14, 1, hex('#6a6a7a'));
  }
  return { pix: p.outline(), ox: 0, oy: -T, wall: false };
}

/** 시소: 가운데 받침 · 기운 널판 · 손잡이 · 낮은 쪽 밑에 반쯤 묻힌 타이어 */
function seesaw(W: number, H: number): RawSprite {
  const T = H + 18;
  const p = new Pix(W, T);
  p.oval(9, T - 3, 7, 3, hex('#2a2a30'));
  p.oval(9, T - 4, 4, 1.5, hex('#5a5a62'));
  p.tri(W / 2 - 7, T, W / 2 + 7, T, W / 2, T - 16, hex('#f0c030'));
  p.rect(W / 2 - 7, T - 3, 14, 3, shade(hex('#f0c030'), -0.2));
  const plank = hex('#3aa070');
  for (let k = 0; k < 4; k++) p.line(3, T - 8 + k, W - 3, T - 26 + k, k === 0 ? shade(plank, 0.3) : k === 3 ? shade(plank, -0.3) : plank);
  for (const t of [0.18, 0.82]) {
    const x = Math.round(3 + (W - 6) * t);
    const y = Math.round(T - 8 - 18 * t);
    p.rect(x, y - 7, 2, 7, hex('#b8c0c8'));
    p.rect(x - 3, y - 8, 8, 2, hex('#e8584a'));
  }
  p.ball(W / 2, T - 16, 2.5, 2.5, hex('#9aa0a8'));
  return { pix: p.outline(), ox: 0, oy: -T, wall: false };
}

/** 정글짐: 앞 · 뒤 두 겹 격자 (빨강 · 노랑 · 파랑 쇠막대) */
function jungle(W: number, H: number): RawSprite {
  const T = H + 30;
  const p = new Pix(W, T);
  const cols = [hex('#e8584a'), hex('#f0c030'), hex('#3a78c8'), hex('#3aa070')];
  const grid = (ox: number, oy: number, dark: number) => {
    const x0 = 3 + ox;
    const x1 = W - 12 + ox;
    const y0 = 16 + oy;
    const y1 = T - 2 + oy;
    for (let i = 0; i <= 3; i++) {
      const x = Math.round(x0 + ((x1 - x0) * i) / 3);
      p.rect(x, y0, 2, y1 - y0, shade(cols[i % 4], dark));
      p.rect(x, y0, 1, y1 - y0, shade(cols[i % 4], dark + 0.25));
      const y = Math.round(y0 + ((y1 - y0) * i) / 3);
      p.rect(x0, y, x1 - x0 + 2, 2, shade(cols[(i + 2) % 4], dark));
      p.rect(x0, y, x1 - x0 + 2, 1, shade(cols[(i + 2) % 4], dark + 0.25));
    }
  };
  grid(9, -12, -0.3);
  for (let i = 0; i <= 3; i++) {
    const x = Math.round(3 + ((W - 15) * i) / 3);
    p.line(x, 16, x + 9, 4, shade(cols[3], -0.15));
    p.line(x, T - 2, x + 9, T - 14, shade(cols[3], -0.15));
  }
  grid(0, 0, 0);
  return { pix: p.outline(), ox: 0, oy: -T, wall: false };
}

/** 아스팔트 덩어리 (찻길 · 횡단보도 바탕) */
function asphaltFill(p: Pix, x0: number, y0: number, w: number, h: number, base: Color): void {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p.set(x0 + x, y0 + y, asphaltAt(base, x0 + x, y0 + y));
}

/** 찻길: 위 · 아래 연석 · 가운데 흰 점선 (opt 'yellow' 노란 두 줄). 비 오는 날엔 젖어 번들 */
function road(W: number, H: number, L: HouseLook): RawSprite {
  const p = new Pix(W, H);
  const base = L.sky === 'rain' ? hex('#4c5056') : hex('#5c5e64');
  asphaltFill(p, 0, 0, W, H, base);
  for (const y of [0, H - 4]) {
    p.rect(0, y, W, 4, hex('#c8c6be'));
    p.rect(0, y + (y === 0 ? 3 : 0), W, 1, hex('#8a8880'));
    for (let x = 0; x < W; x += 16) p.rect(x, y, 1, 4, hex('#a8a69e'));
  }
  for (let x = 4; x < W - 4; x += 18) p.rect(x, H / 2 - 1, 10, 2, hex('#e8e8e0'));
  if (L.sky === 'rain') for (let i = 0; i < W / 30; i++) p.rect(hash2(i, 1, 251) * W, 6 + hash2(i, 2, 252) * (H - 12), 8 + hash2(i, 3, 253) * 12, 1, hex('#7a8898'));
  return { pix: p, ox: 0, oy: -H, wall: true };
}

/** 횡단보도: 아스팔트 위 흰 줄 (걷는 쪽으로 길게, 군데군데 닳아 있다) */
function crosswalk(W: number, H: number, L: HouseLook): RawSprite {
  const p = new Pix(W, H);
  asphaltFill(p, 0, 0, W, H, L.sky === 'rain' ? hex('#4c5056') : hex('#5c5e64'));
  const white = hex('#eeeee6');
  for (let x = 3; x < W - 3; x += 9)
    for (let y = 2; y < H - 2; y++)
      for (let k = 0; k < 5; k++) if (hash2(x + k, y, 254) > 0.015) p.set(x + k, y, k === 0 ? shade(white, 0.3) : k === 4 ? shade(white, -0.12) : white);
  return { pix: p, ox: 0, oy: -H, wall: true };
}

/** 모래밭 테두리: 둥근 통나무를 둘렀다 (안은 고운 모래). opt 'toys': 빨간 양동이 · 노란 삽 · 모래성 */
function sandbox(W: number, H: number, L: HouseLook): RawSprite {
  const p = new Pix(W, H);
  const fine = shade(L.floor, 0.1);
  p.rect(3, 3, W - 6, H - 6, fine);
  for (let i = 0; i < W * H / 30; i++) p.set(4 + hash2(i, 1, 261) * (W - 8), 4 + hash2(i, 2, 261) * (H - 8), shade(fine, -0.08));
  const log = hex('#a87444');
  for (let x = 0; x < W; x += 6) {
    p.ball(x + 3, 2.5, 3, 2.5, log);
    p.ball(x + 3, H - 3, 3, 2.5, log);
  }
  for (let y = 0; y < H; y += 6) {
    p.ball(2.5, y + 3, 2.5, 3, log);
    p.ball(W - 3, y + 3, 2.5, 3, log);
  }
  // 모래성 · 양동이 · 삽 (늘 조금은 놀다 간 자리)
  p.ball(W - 18, H - 14, 6, 4, shade(L.floor, -0.05));
  p.rect(W - 20, H - 22, 5, 6, shade(L.floor, -0.02));
  p.rect(W - 18, H - 25, 1, 3, hex('#e8584a'));
  box(p, 10, H - 18, 7, 7, hex('#e8584a'));
  p.rect(10, H - 19, 7, 1, hex('#f88a7a'));
  p.line(20, H - 10, 26, H - 16, hex('#f0c030'));
  p.ball(27, H - 17, 2, 2, hex('#f0c030'));
  return { pix: p, ox: 0, oy: -H, wall: true };
}

/** 흙길 바큇자국: 두 줄 홈, 그 사이 풀 */
function ruts(W: number, H: number, L: HouseLook): RawSprite {
  const p = new Pix(W, H);
  const dark = shade(L.floor, -0.2);
  for (const ty of [H * 0.3, H * 0.7]) {
    for (let x = 0; x < W; x++) {
      const y = Math.round(ty + Math.sin(x / 23) * 2 + Math.sin(x / 7) * 0.6);
      p.set(x, y - 1, shade(L.floor, -0.1));
      p.rect(x, y, 1, 3, dark);
      p.set(x, y + 3, shade(L.floor, 0.12));
    }
  }
  for (let i = 0; i < W / 9; i++) {
    const x = hash2(i, 1, 271) * W;
    const y = H * 0.5 + (hash2(i, 2, 272) - 0.5) * H * 0.18;
    for (let k = -1; k <= 1; k++) p.line(x + k, y, x + k * 2, y - 2 - (k === 0 ? 1 : 0), shade(L.accent, k * 0.1));
  }
  return { pix: p, ox: 0, oy: -H, wall: true };
}

/** 우물: 돌로 쌓은 둥근 테 · 나무 기둥과 가로대 · 줄에 매단 두레박 */
function well(W: number, H: number, L: HouseLook): RawSprite {
  const T = H + 32;
  const p = new Pix(W, T);
  const wood = hex('#7a5a3a');
  for (const x of [5, W - 8]) p.bar(x, 4, 3, T - 18, wood);
  box(p, 2, 3, W - 4, 4, shade(wood, 0.1));
  // 돌 테 (앞에서 본 원통)
  const top = T - 22;
  p.oval(W / 2, top, W / 2 - 3, 5, shade(L.wall, 0.1));
  p.oval(W / 2, top, W / 2 - 7, 3, hex('#1e2a32'));
  p.rect(W / 2 - 4, top - 1, 4, 1, hex('#8aa8c0'));
  for (let r = 0; r < 4; r++)
    for (let x = 4 - (r % 2) * 3; x < W - 3; x += 7) p.ball(x + 3, top + 6 + r * 4, 3.6, 2.4, shade(L.wall, (hash2(x, r, 281) - 0.5) * 0.3 - r * 0.04));
  // 두레박
  p.rect(W / 2, 7, 1, 12, hex('#d8c8a0'));
  box(p, W / 2 - 4, 18, 9, 7, hex('#9a6a3a'));
  p.rect(W / 2 - 4, 20, 9, 1, hex('#5a5a5a'));
  return { pix: p.outline(), ox: 0, oy: -T, wall: false };
}

/** 초가집 앞면: 둥근 볏짚 지붕 (새끼줄 그물) · 흙벽 · 창호지 문 · 부엌문 · 툇마루 · 댓돌 위 고무신. 해 질 녘엔 문에 불빛 */
function thatch(W: number, H: number, L: HouseLook): RawSprite {
  const T = H + 24;
  const p = new Pix(W, T);
  const ev = evening(L);
  const straw = hex('#c8a25a');
  const wood = hex('#7a5a3a');
  const mud = ev ? hex('#d8ccb4') : hex('#ece2c8');
  // 흙벽 · 기둥
  const wy = 34;
  p.rect(6, wy, W - 12, T - wy - 20, mud);
  for (let i = 0; i < 40; i++) p.set(8 + hash2(i, 1, 291) * (W - 16), wy + hash2(i, 2, 291) * (T - wy - 22), shade(mud, -0.08));
  const posts = [6, Math.round(W * 0.27), Math.round(W * 0.52), Math.round(W * 0.76), W - 11];
  for (const x of posts) p.bar(x, wy, 5, T - wy - 18, wood);
  p.rect(6, wy, W - 12, 3, shade(wood, -0.1));
  // 창호지 문 두 칸 (격자)
  const paper = ev ? hex('#ffd890') : hex('#f6eed8');
  for (let i = 0; i < 2; i++) {
    const x0 = posts[i] + 8;
    const x1 = posts[i + 1] - 3;
    box(p, x0, wy + 6, x1 - x0, T - wy - 30, wood);
    p.rect(x0 + 2, wy + 8, x1 - x0 - 4, T - wy - 34, paper);
    for (let x = x0 + 2; x < x1 - 2; x += 4) p.rect(x, wy + 8, 1, T - wy - 34, shade(paper, -0.25));
    for (let y = wy + 8; y < T - 26; y += 5) p.rect(x0 + 2, y, x1 - x0 - 4, 1, shade(paper, -0.25));
    p.rect(Math.round((x0 + x1) / 2), wy + 6, 1, T - wy - 30, wood);
  }
  // 부엌: 널문 · 아궁이 그을음
  const kx = posts[2] + 8;
  box(p, kx, wy + 6, posts[3] - kx - 3, T - wy - 24, hex('#5a4030'));
  for (let x = kx + 4; x < posts[3] - 4; x += 5) p.rect(x, wy + 7, 1, T - wy - 26, hex('#4a3428'));
  p.oval(kx + 14, wy + 4, 10, 4, hex('#9a9088'));
  // 맨 오른쪽 칸: 걸어 둔 시래기 · 소쿠리
  const rx = posts[3] + 8;
  for (let i = 0; i < 4; i++) p.rect(rx + 3 + i * 5, wy + 4, 3, 12 + (i % 2) * 4, hex('#8a9a4a'));
  p.oval(rx + 14, wy + 26, 9, 4, hex('#c8a060'));
  // 지붕: 둥글게 부푼 볏짚, 새끼줄 그물
  for (let y = 0; y < wy + 6; y++)
    for (let x = 0; x < W; x++) {
      const nx = (x - W / 2) / (W / 2);
      const n2 = nx * nx;
      const edge = 1 + 12 * n2;
      // 처마 끝은 둥글게 말려 올라간다
      const bottom = wy + 4 - 10 * n2 * n2;
      if (y < edge || y > bottom) continue;
      // 위는 햇빛에 밝고, 처마 쪽으로 갈수록 그늘
      const depth = (y - edge) / Math.max(1, bottom - edge);
      let c = shade(straw, (hash2(x >> 1, y, 292) - 0.5) * 0.12 + 0.12 - depth * 0.3);
      if (y < edge + 3) c = shade(straw, 0.28);
      else if (bottom - y < 3) c = shade(straw, -0.38 + (hash2(x, 3, 294) - 0.5) * 0.2);
      else if ((x + y * 2) % 14 === 0 || (x - y * 2 + 1400) % 14 === 0) c = shade(c, -0.22);
      p.set(x, y, c);
    }
  // 용마름 (꼭대기에 엮어 덮은 짚)
  for (let x = Math.round(W * 0.12); x < W * 0.88; x++) {
    const nx = (x - W / 2) / (W / 2);
    const y = Math.round(1 + 12 * nx * nx);
    p.rect(x, y, 1, 3, (x >> 1) % 2 ? shade(straw, 0.05) : shade(straw, -0.15));
  }
  for (let x = 6; x < W - 6; x += 2) {
    const nx = (x - W / 2) / (W / 2);
    const b = Math.round(wy + 4 - 10 * nx ** 4);
    p.rect(x, b, 1, 1 + (x % 3), shade(straw, -0.45));
  }
  // 툇마루 (나무 판) · 기단 돌
  const my = T - 20;
  box(p, 4, my, W - 8, 7, hex('#a87848'));
  for (let x = 4; x < W - 8; x += 12) p.rect(x, my, 1, 7, hex('#7a5430'));
  p.rect(4, my, W - 8, 1, hex('#d0a070'));
  p.rect(4, my + 7, W - 8, 4, hex('#3a2a20'));
  for (let x = 2; x < W - 4; x += 9) p.ball(x + 4, T - 4, 5, 3.4, shade(L.wall, (hash2(x, 3, 293) - 0.5) * 0.3));
  // 댓돌 · 고무신 한 켤레 (순이 것, 작다) + 어른 것
  box(p, W / 2 - 34, T - 10, 26, 6, hex('#b8b0a0'));
  for (const [x, c] of [[W / 2 - 31, hex('#f4f4ee')], [W / 2 - 25, hex('#f4f4ee')], [W / 2 - 18, hex('#3a3a3e')], [W / 2 - 13, hex('#3a3a3e')]] as const) {
    p.oval(x, T - 11, 2.4, 1.6, c);
    p.set(x - 1, T - 12, shade(c, 0.3));
  }
  return { pix: p.outline(), ox: 0, oy: -T, wall: true };
}

/** 돌담 한 줄 (사람 허리 높이): 크고 작은 돌을 흙으로 쌓았다, 군데군데 풀 */
function stonewallRow(W: number, H: number, L: HouseLook): RawSprite {
  const T = H + 12;
  const p = new Pix(W, T);
  p.rect(0, 6, W, T - 6, shade(L.base, -0.1));
  for (let r = 0; r < 4; r++) {
    const y = T - 5 - r * 7;
    const off = (r % 2) * 5;
    for (let x = -off; x < W; x += 9 + Math.floor(hash2(x, r, 301) * 4)) {
      const k = hash2(x, r, 302);
      p.ball(x + 5, y, 4.5 + k * 1.5, 3.4 + k * 0.8, shade(L.wall, (k - 0.5) * 0.35 - r * 0.02));
    }
  }
  for (let i = 0; i < W / 12; i++) {
    const x = hash2(i, 1, 303) * W;
    p.ball(x, 4 + hash2(i, 2, 303) * 4, 3, 2, shade(L.accent, (hash2(i, 3, 303) - 0.5) * 0.3), true);
  }
  return { pix: p.outline(), ox: 0, oy: -T, wall: false };
}

/** 이정표: 나무 말뚝에 화살 판 둘 (옛 마을). opt 'school': 어린이 보호구역 표지판 */
function signpost(W: number, H: number, opt: string): RawSprite {
  const T = H + 42;
  const p = new Pix(W + 16, T);
  const cx = Math.floor(W / 2) + 8;
  if (opt.includes('school')) {
    p.bar(cx - 1, 10, 3, T - 10, hex('#a8b0b8'));
    p.tri(cx - 10, 18, cx + 11, 18, cx + 0.5, 0, hex('#d83a3a'));
    p.tri(cx - 7, 16, cx + 8, 16, cx + 0.5, 4, hex('#f4d040'));
    p.rect(cx - 2, 9, 2, 5, INK);
    p.rect(cx + 2, 10, 2, 4, INK);
    box(p, cx - 10, 20, 22, 9, hex('#f4f0e4'));
    glyphs(p, cx - 9, 22, 3, 5, hex('#d83a3a'), 13);
    return { pix: p.outline(), ox: -8, oy: -T, wall: false };
  }
  const wood = hex('#8a6a44');
  p.bar(cx - 2, 4, 5, T - 4, wood);
  const board = hex('#c8a46a');
  // 왼쪽 화살
  box(p, cx - 16, 8, 16, 7, board);
  p.tri(cx - 16, 7, cx - 16, 16, cx - 21, 11.5, board);
  glyphs(p, cx - 15, 9, 3, 4, hex('#4a3020'), 17);
  // 오른쪽 화살
  box(p, cx + 2, 18, 15, 7, shade(board, -0.06));
  p.tri(cx + 17, 17, cx + 17, 26, cx + 22, 21.5, shade(board, -0.06));
  glyphs(p, cx + 3, 19, 2, 4, hex('#4a3020'), 19);
  return { pix: p.outline(), ox: -8, oy: -T, wall: false };
}

/** 리어카: 나무 짐칸 · 큰 바퀴 · 앞으로 뻗은 손잡이. opt 'load': 볏짚 단 · 배추를 실었다 */
function cart(W: number, H: number, opt: string): RawSprite {
  const T = H + 12;
  const p = new Pix(W + 10, T);
  const ox = 10;
  const wood = hex('#9a7044');
  const iron = hex('#4a4a50');
  rod(p, 0, 12, ox + 6, 16, iron, 2);
  p.rect(0, 11, 2, 4, iron);
  if (opt.includes('load')) {
    for (let i = 0; i < 4; i++) p.ball(ox + 9 + i * 8, 6 - (i % 2) * 2, 5, 4, hex('#d8b860'), true);
    p.ball(ox + 30, 4, 5, 4, hex('#7aa84a'), true);
    p.ball(ox + 22, 2, 4, 3.5, hex('#8ab85a'), true);
  }
  box(p, ox + 4, 6, W - 6, 14, wood);
  for (let x = ox + 6; x < ox + W - 2; x += 6) p.rect(x, 7, 1, 12, shade(wood, -0.2));
  p.rect(ox + 4, 12, W - 6, 1, shade(wood, -0.25));
  const wx = ox + W / 2 + 2;
  const wy = T - 9;
  p.oval(wx, wy, 9, 9, hex('#2a2a30'));
  p.oval(wx, wy, 6.5, 6.5, hex('#8a8a90'));
  for (let a = 0; a < 6; a++) p.line(wx, wy, wx + Math.cos((a * Math.PI) / 3) * 6, wy + Math.sin((a * Math.PI) / 3) * 6, hex('#c8c8d0'));
  p.ball(wx, wy, 2, 2, hex('#c8c8d0'));
  p.rect(ox + W - 6, 20, 2, T - 20, iron);
  return { pix: p.outline(), ox: -ox, oy: -T, wall: false };
}

/** 장독대: 돌 단 위에 크고 작은 옹기 항아리 (뚜껑 · 반들반들한 윤) */
function crocks(W: number, H: number, w: number): RawSprite {
  const T = H + 16;
  const p = new Pix(W, T);
  box(p, 0, T - 8, W, 8, hex('#a8a090'));
  const brown = hex('#6a3a24');
  const n = Math.max(2, w * 2);
  const jars = Array.from({ length: n }, (_, i) => ({ x: 6 + ((W - 12) * i) / (n - 1), big: i % 2 === 0 }));
  jars.sort((a, b) => Number(a.big) - Number(b.big));
  for (const j of jars) {
    const r = j.big ? 8 : 6;
    const by = j.big ? T - 16 : T - 22;
    p.ball(j.x, by, r, r + 1, brown);
    p.oval(j.x, by - r - 1, r - 2, 2, shade(brown, -0.25));
    p.oval(j.x, by - r - 2, r - 3, 1.5, shade(brown, 0.1));
  }
  return { pix: p.outline(), ox: 0, oy: -T, wall: false };
}
