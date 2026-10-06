/**
 * 사람 크기 기억 방: 벽지 · 바닥 · 가구. 방마다 꾸밈(look)이 있어 같은 하루의 방도 나이에 따라 다르게 보인다.
 * 가구 그림은 (w×h 칸) 자리의 아래쪽에 발을 두고, 키 큰 가구는 위로 솟는다.
 */
import { CLEAR, Pix, hash2, hex, mix, shade, type Color } from './paint.ts';
import { propSprite } from './houseProps.ts';
import { PERSON_SPRITE_H } from './sizes.ts';
import { paintGrid, type Grid, type Palette } from './px/grid.ts';
import { cutTile, fitGrid, paintFit, paintTiled, tileChar, type Seg } from './px/slice.ts';
import * as FA from './px/furnA.ts';
import * as FB from './px/furnB.ts';
import * as FC from './px/furnC.ts';
import * as FD from './px/furnD.ts';
import * as HX from './px/houseTiles.ts';

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

/** 벽 한 칸. bottom: 바닥과 닿는 줄 (걸레받이). 무늬 · 띠는 손찍기 격자 (px/houseTiles.ts) 를 전체 좌표로 되풀이 */
export function wallTile(L: HouseLook, tx: number, ty: number, bottom: boolean, topRow: boolean): Pix {
  const p = new Pix(HT, HT);
  const gx = tx * HT;
  const gy = ty * HT;
  if (L.floorKind === 'grass') {
    // 마당: 울타리 너머 덤불
    return paintTiled(p, HX.HEDGE, HX.hedgePal(L.wall, -0.15), 0, 0, HT, HT, gx, gy);
  }
  if (L.floorKind === 'asphalt' || L.floorKind === 'paving') return brickWall(L, tx, ty, bottom);
  if (L.floorKind === 'sand') return parkHedge(L, tx, ty, bottom);
  if (L.floorKind === 'dirt') return stoneWall(L, tx, ty, bottom);
  const pal = HX.wallPal(L.wall, L.accent);
  paintTiled(p, HX.WALLPAPER[L.pattern] ?? HX.WALLPAPER.plain, pal, 0, 0, HT, HT, gx, gy);
  if (topRow) paintTiled(p, ['s'], { s: shade(L.wall, -0.25) }, 0, 0, HT, 2);
  if (bottom) paintTiled(p, HX.BASEBOARD, HX.wallBandPal(L, wallCap(L)), 0, HT - 7, HT, 7, gx, 0);
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
  const gx = tx * HT;
  const band = HX.wallBandPal(L, wallCap(L));
  if (row === 0) {
    // 천장 그늘 (빛 효과): 몰딩 아래 벽지가 위로 갈수록 조금 어둡다
    for (let y = 9; y < 16; y++) for (let x = 0; x < HT; x++) p.set(x, y, shade(p.get(x, y), -0.14 * (1 - (y - 9) / 7)));
    paintTiled(p, HX.WALL_TOP, band, 0, 0, HT, HX.WALL_TOP.length, gx, 0);
  }
  if (last && rows >= 3 && L.pattern !== 'tiles') {
    // 징두리 판벽: 맨 아랫줄은 벽지 대신 세로 판 (16px 판 한 장 격자를 높이에 맞춰 늘인다) + 위 몰딩 띠
    const ph = HT - 6 - 3;
    paintTiled(p, fitGrid(HX.WAINSCOT, 16, ph, [16], [2, [7, 'r'], 2]), band, 0, 3, HT, ph, gx, 0);
    paintTiled(p, HX.WAINSCOT_RAIL, band, 0, 0, HT, 4, gx, 0);
  }
  if (last) paintTiled(p, HX.BASEBOARD, band, 0, HT - 7, HT, 7, gx, 0);
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

/** 격자를 위아래로 뒤집은 것 (모서리 조각을 네 귀퉁이에 쓰려고) */
const vflip = (g: readonly string[]): string[] => [...g].reverse();
/** 격자를 옆으로 눕힌 것 (가로 띠 ↔ 세로 띠) */
const turn = (g: readonly string[]): string[] => [...g[0]].map((_, x) => g.map((r) => r[x]).join(''));

/** 벽 두께 한 칸 (옆벽 · 칸막이 윗면): 짙은 윗면 판, 트인 쪽 가장자리에 짙은 선 + 안쪽 밝은 선, 안쪽 모서리 조각 */
export function thicknessTile(L: HouseLook, tx: number, ty: number, o: Open): Pix {
  if (outdoor(L)) return wallTile(L, tx, ty, false, o.u);
  const p = new Pix(HT, HT);
  const pal = HX.capPal(wallCap(L));
  paintTiled(p, HX.CAP_TOP, pal, 0, 0, HT, HT, tx * HT, ty * HT);
  const side = turn(HX.CAP_EDGE);
  const sideR = side.map((r) => [...r].reverse().join(''));
  const y0 = o.u ? 1 : 0;
  const hh = HT - y0 - (o.d ? 1 : 0);
  if (o.l) {
    paintTiled(p, [side[0][0]], pal, 0, 0, 1, HT);
    paintTiled(p, [side[0][1]], pal, 1, y0, 1, hh);
  }
  if (o.r) {
    paintTiled(p, [sideR[0][1]], pal, HT - 1, 0, 1, HT);
    paintTiled(p, [sideR[0][0]], pal, HT - 2, y0, 1, hh);
  }
  if (o.u) paintTiled(p, HX.CAP_EDGE, pal, 0, 0, HT, 2);
  if (o.d) paintTiled(p, vflip(HX.CAP_EDGE), pal, 0, HT - 2, HT, 2);
  // 안쪽 모서리: 대각선만 트였을 때
  const C = HX.CAP_CORNER;
  if (o.ul && !o.u && !o.l) paintGrid(p, C, 0, 0, pal);
  if (o.ur && !o.u && !o.r) paintGrid(p, C, HT - 2, 0, pal, true);
  if (o.dl && !o.d && !o.l) paintGrid(p, vflip(C), 0, HT - 2, pal);
  if (o.dr && !o.d && !o.r) paintGrid(p, vflip(C), HT - 2, HT - 2, pal, true);
  return p;
}

/**
 * 다락의 낮은 구석 한 칸 (벽 두께 X 대신): 경사 천장 널이 비스듬히 내려와 바닥과 만난다.
 * side: 구석이 방의 왼쪽(l) · 오른쪽(r), d: 바닥 쪽 안쪽 칸부터 몇 번째 (0 = 바닥과 맞닿은 칸), n: 구석 칸 수.
 * 안쪽부터: 천장 아래 낮은 틈(짙은 그늘) → 깔도리 격자 → 바깥으로 올라가는 천장 널 · 서까래 격자 (EAVE_SHEET).
 */
export function eaveTile(L: HouseLook, tx: number, ty: number, side: 'l' | 'r', d: number, n: number): Pix {
  const p = new Pix(HT, HT);
  const span = n * HT;
  const gap = 9;
  const sill = HX.SILL[0].length;
  const pal = HX.eavePal(L.floor);
  const fl = floorTile(L, tx, ty);
  for (let y = 0; y < HT; y++)
    for (let x = 0; x < HT; x++) {
      // e: 바닥과 만나는 안쪽 가장자리에서 바깥으로 잰 거리 (px)
      const e = side === 'l' ? (d + 1) * HT - 1 - x : d * HT + x;
      const Y = ty * HT + y;
      let c: Color;
      if (e < gap) c = shade(fl.get(x, y), -0.38 - (e / gap) * 0.3); // 낮은 틈: 안쪽으로 갈수록 짙은 그늘 (빛 효과)
      else if (e < gap + sill) c = pal[HX.SILL[Y % HX.SILL.length][e - gap]];
      else {
        // 천장 널 · 서까래: 바깥(높은 쪽)으로 갈수록 조금 밝다 (빛 효과)
        const k = e - gap - sill;
        const u = k / Math.max(1, span - gap - sill);
        c = shade(pal[tileChar(HX.EAVE_SHEET, k, Y)], u * 0.22);
      }
      p.set(x, y, c);
    }
  // 거미줄: 깔도리와 천장이 만나는 구석에 가끔 · 먼지 뭉치: 낮은 틈 바닥에
  if (d === 0 && hash2(tx, ty, 815) < 0.22) {
    const w = HX.COBWEB[0].length;
    const ay = 3 + Math.floor(hash2(tx, ty, 816) * 10);
    if (side === 'l') paintGrid(p, HX.COBWEB, HT - gap - sill - w, ay, pal, true);
    else paintGrid(p, HX.COBWEB, gap + sill, ay, pal);
  }
  if (d === 0 && hash2(tx, ty, 817) < 0.18) paintGrid(p, HX.DUSTBALL, side === 'l' ? HT - 6 : 1, 5 + Math.floor(hash2(tx, ty, 818) * 12), pal);
  return p;
}

/** 단 앞면 (S): 위 칸(높은 바닥) 재질의 앞판 10px 격자 + 그 아래 낮은 바닥과 닿는 그늘, 끝은 짙은 모서리 */
export function stepTile(high: HouseLook, low: HouseLook, tx: number, ty: number, leftEnd: boolean, rightEnd: boolean): Pix {
  const p = floorTile(low, tx, ty);
  const pal = HX.stepPal(high.floor);
  const g = high.floorKind === 'tile' || high.floorKind === 'paving' ? HX.STEP_TILE : HX.STEP_WOOD;
  const ph = g.length;
  paintTiled(p, g, pal, 0, 0, HT, ph, tx * HT + Math.floor(hash2(ty, 0, 412) * 24), 0);
  for (let y = ph; y < ph + 3; y++) for (let x = 0; x < HT; x++) p.set(x, y, shade(p.get(x, y), -0.3 + (y - ph) * 0.09));
  if (leftEnd) paintTiled(p, HX.STEP_END, pal, 0, 0, 1, ph);
  if (rightEnd) paintTiled(p, HX.STEP_END, pal, HT - 1, 0, 1, ph);
  return p;
}

/** 바닥 한 칸 (이웃 칸과 이어지는 손찍기 무늬) */
export function floorTile(L: HouseLook, tx: number, ty: number): Pix {
  const p = new Pix(HT, HT);
  const f = L.floor;
  const gx = tx * HT;
  const gy = ty * HT;
  switch (L.floorKind) {
    case 'wood': {
      // 마루: 다섯 칸 폭 한 장을 칸 줄마다 엇갈려 깐다 (같은 널 무늬가 줄지어 보이지 않게)
      const off = Math.floor(hash2(ty, 0, 11) * HX.WOOD_SHEET[0].length);
      return paintTiled(p, HX.WOOD_SHEET, HX.woodPal(f), 0, 0, HT, HT, gx + off, gy);
    }
    case 'tile':
      return paintTiled(p, HX.TILE_FLOOR, HX.tilePal(f), 0, 0, HT, HT, gx, gy);
    case 'lino':
      return paintTiled(p, HX.LINO_FLOOR, HX.linoPal(f), 0, 0, HT, HT, gx, gy);
    case 'asphalt':
      paintTiled(p, HX.ASPHALT, HX.asphaltPal(f), 0, 0, HT, HT, gx + (ty % 3) * 7, gy);
      asphaltMarks(p, f, tx, ty);
      return p;
    case 'paving': {
      paintTiled(p, HX.PAVING, HX.pavingPal(f), 0, 0, HT, HT, gx, gy);
      // 젖은 보도: 줄눈 옆에 고인 물 반짝임
      if (L.sky === 'rain' && hash2(tx, ty, 70) < 0.5) paintTiled(p, HX.PAVING_WET, { s: shade(f, 0.28) }, 0, 1 + 8 * Math.floor(hash2(tx, ty, 72) * 3), HT, 1, gx, 0);
      return p;
    }
    case 'sand':
      paintTiled(p, HX.SAND, HX.sandPal(f), 0, 0, HT, HT, gx + (ty % 2) * 11, gy);
      sandMarks(p, f, tx, ty);
      return p;
    case 'dirt':
      paintTiled(p, HX.DIRT, HX.dirtPal(f, L.accent), 0, 0, HT, HT, gx + (ty % 3) * 9, gy);
      dirtMarks(p, f, L.accent, tx, ty);
      return p;
    default:
      return paintTiled(p, HX.GRASS_FLOOR, HX.grassPal(f), 0, 0, HT, HT, gx + (ty % 2) * 13, gy);
  }
}

// ───────────────────────── 집 밖: 바닥 자국 (손찍기 조각을 칸마다 몇 개 골라 찍는다) ─────────────────────────

function asphaltMarks(p: Pix, f: Color, tx: number, ty: number): void {
  const pal = HX.asphaltPal(f);
  // 갈라진 금 (칸 몇 개에만, 모양 둘 중 하나 · 좌우 뒤집기)
  if (hash2(tx, ty, 34) < 0.16) {
    const g = HX.ASPHALT_CRACKS[Math.floor(hash2(tx, ty, 35) * HX.ASPHALT_CRACKS.length)];
    paintGrid(p, g, 0, Math.floor(hash2(tx, ty, 33) * (HT - g.length)), pal, hash2(tx, ty, 36) < 0.5);
  }
  // 맨홀 뚜껑 (드물게)
  if (hash2(tx, ty, 40) < 0.014) paintGrid(p, HX.MANHOLE, 2, 4, pal);
}

function sandMarks(p: Pix, f: Color, tx: number, ty: number): void {
  const pal = HX.sandPal(f);
  // 모래 물결과 작은 발자국 · 돌 (드문드문)
  if (hash2(tx, ty, 54) < 0.35) paintTiled(p, HX.SAND_RIPPLE, pal, 0, 4 + Math.floor(hash2(tx, ty, 55) * 14), HT, 2, tx * HT, 0);
  if (hash2(tx, ty, 56) < 0.22) paintGrid(p, HX.SAND_STEPS, 4 + Math.floor(hash2(tx, ty, 57) * 8), 3 + Math.floor(hash2(tx, ty, 58) * 8), pal, hash2(tx, ty, 59) < 0.5);
  if (hash2(tx, ty, 59) < 0.1) paintGrid(p, HX.PEBBLE, 2 + Math.floor(hash2(tx, 1, 60) * 18), 2 + Math.floor(hash2(ty, 2, 60) * 18), pal);
}

function dirtMarks(p: Pix, f: Color, grass: Color, tx: number, ty: number): void {
  const pal = HX.dirtPal(f, grass);
  // 자갈 · 길섶 풀
  const n = Math.floor(hash2(tx, ty, 63) * 4);
  for (let i = 0; i < n; i++) paintGrid(p, HX.PEBBLE, 1 + Math.floor(hash2(tx, i, 64) * 19), 1 + Math.floor(hash2(ty, i, 65) * 20), pal);
  if (hash2(tx, ty, 68) < 0.14) paintGrid(p, HX.TUFT, 3 + Math.floor(hash2(tx, ty, 69) * 16), 4 + Math.floor(hash2(ty, tx, 69) * 16), pal);
}

// ───────────────────────── 집 밖: 가장자리 담 ─────────────────────────

/** 골목 · 길: 갓돌을 얹은 낮은 벽돌 담. 군데군데 담쟁이 */
function brickWall(L: HouseLook, tx: number, ty: number, bottom: boolean): Pix {
  const p = new Pix(HT, HT);
  const gx = tx * HT;
  paintTiled(p, HX.BRICKS, HX.brickPal(L.wall, !bottom), 0, 0, HT, HT, gx, ty * HT);
  const cop = { G: shade(L.base, 0.3), g: L.base, h: shade(L.base, -0.3), s: shade(L.wall, -0.35), S: shade(L.wall, -0.42), e: shade(L.base, -0.1) };
  if (bottom) {
    // 갓돌 (담 위에 얹은 시멘트) · 담 아래 그늘
    paintTiled(p, HX.COPING, cop, 0, 0, HT, HX.COPING.length, gx, 0);
    paintTiled(p, ['S'], cop, 0, HT - 3, HT, 3);
    // 담쟁이 (몇 칸에만 늘어진다)
    if (hash2(tx, 0, 82) < 0.3) paintTiled(p, HX.IVY, { l: shade(L.accent, -0.2), L: shade(L.accent, 0.05), G: shade(L.accent, 0.25) }, 0, 3, HT, HX.IVY.length, gx + Math.floor(hash2(tx, 1, 83) * 24), 0);
  } else {
    // 옆 · 아래 담: 위에서 본 갓돌 줄
    paintTiled(p, ['e'], cop, 0, 0, HT, 2);
    paintTiled(p, ['e'], cop, 0, HT - 2, HT, 2);
  }
  return p;
}

/** 놀이터: 낮은 나무 울타리, 그 너머 덤불 */
function parkHedge(L: HouseLook, tx: number, ty: number, bottom: boolean): Pix {
  const p = new Pix(HT, HT);
  const gx = tx * HT;
  const hp = HX.hedgePal(L.wall);
  paintTiled(p, HX.HEDGE, hp, 0, 0, HT, HT, gx, ty * HT);
  // 덤불 사이 작은 꽃
  if (hash2(tx, ty, 94) < 0.25) paintGrid(p, HX.BLOSSOM, 3 + Math.floor(hash2(tx, 1, 95) * 16), 2 + Math.floor(hash2(ty, 1, 95) * 8), hp);
  const pp = HX.picketPal(L.accent, L.wall);
  if (bottom) paintTiled(p, HX.PICKETS, pp, 0, 6, HT, HX.PICKETS.length, gx + 7, 0);
  else paintTiled(p, ['G', 'W', 'W'], pp, 0, 10, HT, 3);
  return p;
}

/** 옛 마을: 둥근 돌을 쌓은 돌담 */
function stoneWall(L: HouseLook, tx: number, ty: number, bottom: boolean): Pix {
  const p = new Pix(HT, HT);
  paintTiled(p, HX.STONES, HX.stonePal(L.wall, L.base, L.accent, !bottom), 0, 0, HT, HT, tx * HT + (ty % 2) * 4, ty * HT + 1);
  if (bottom) {
    paintTiled(p, ['t'], { t: shade(L.wall, 0.15) }, 0, 0, HT, 2);
    paintTiled(p, ['b'], { b: shade(shade(L.base, -0.15), -0.35) }, 0, HT - 2, HT, 2);
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
  /** 벽 · 바닥을 밝히는 자리 (칠한 칸의 파랑 값 = 세기): 떼어 낸 액자 자국 */
  lighten?: { pix: Pix; ox: number; oy: number };
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

/** 사람 키 (px): 이보다 높은 부분은 윗부분(top) */
export const PERSON_H = PERSON_SPRITE_H;

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
export type FurnitureFallback = (kind: string, w: number, h: number, opt: string) => { pix: Pix; ox: number; oy: number; top?: Pix; topSplitY?: number; wall?: boolean; ground?: RawSprite['ground']; lighten?: RawSprite['lighten']; behind?: Pix; front?: Pix } | null;
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
      return { pix: o.pix, ox: o.ox, oy: o.oy, wall: !!o.wall, base: o.front ?? base, behind: o.behind, top, topH: split, height: HEIGHT[kind] ?? Math.min(-o.oy - 2, 30), ground: o.ground, lighten: o.lighten };
    }
  }
  const raw = drawFurniture(kind, w, h, look, opt);
  const p = raw.pix;
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



/**
 * 잎 덩이 격자를 겹쳐 덤불을 만든다: layouts 는 24px 폭 · 58줄 높이 한 마디에 놓을 [덩이, x, y] (뒤 → 앞) 목록들.
 * 폭만큼 마디를 번갈아 놓고 (뒷줄부터 앞줄 차례로) 높이는 줄 수 비율로 맞춘다. 덩이가 그림 밖으로 잘리지 않게 x 를 안쪽으로 당긴다.
 */
function clumps(p: Pix, layouts: readonly (readonly (readonly [Grid, number, number])[])[], pal: Palette, x0: number, y0: number, w: number, h: number): void {
  const cells = Math.max(1, Math.round(w / HT));
  for (let row = 0; row < 8; row++)
    for (let k = 0; k < cells; k++) {
      const layout = layouts[k % layouts.length];
      if (row >= layout.length) continue;
      const [g, lx, ly] = layout[row];
      const gw = g[0].length;
      const gh = g.length;
      const x = Math.max(0, Math.min(w - gw, Math.round(k * (w / cells) + lx)));
      const y = Math.max(0, Math.min(h - gh, Math.round((ly * (h - 14)) / 44)));
      paintGrid(p, g, x0 + x, y0 + y, pal);
    }
}

/** 조각 맞춤 격자를 (x, y) 에 w×h 로 찍는다 */
function fitInto(p: Pix, s: FA.Sliced, pal: Palette, x: number, y: number, w: number, h: number, flip = false): void {
  paintFit(p, s.g, pal, x, y, w, h, s.cols, s.rows, flip);
}

/** 격자를 위에서부터 줄 띠로 나눠 띠마다 따로 높이를 맞춰 쌓는다 (윗면 깊이 · 앞면 높이를 정확히 맞출 때) */
function bands(p: Pix, g: Grid, pal: Palette, x: number, y: number, w: number, cols: readonly Seg[], parts: [readonly Seg[], number][]): void {
  let row = 0;
  for (const [segs, h] of parts) {
    const n = segs.reduce<number>((a, s) => a + (typeof s === 'number' ? s : s[0]), 0);
    paintFit(p, g.slice(row, row + n), pal, x, y, w, h, cols, segs);
    row += n;
    y += h;
  }
}

/** 3면 상자 (격자 BOX3): 윗면 깊이 d · 앞면 높이 fh */
function box3(p: Pix, pal: Palette, x: number, y: number, w: number, d: number, fh: number): void {
  bands(p, FA.BOX3.g, pal, x, y, w, FA.BOX3.cols, [[[2, [1, 'r'], 2], d], [[[3, 'r'], 2], fh]]);
}

function drawFurniture(kind: string, w: number, h: number, look: HouseLook, opt = ''): RawSprite {
  const W = w * HT;
  const H = h * HT;
  const tall = (extra: number) => new Pix(W, H + extra);
  switch (kind) {
    case 'bed': {
      // 3면 침대 (손찍기 격자 BED): 머리판 · 베개 · 홑청 · 이불 윗면(되풀이) · 앞면 12 (늘어진 이불 · 나무 틀) · 오른쪽 옆면
      const fh = 12;
      const p = new Pix(W, H + fh);
      const pal = { ...FA.woodPal(WOODF), ...FA.clothPal(opt ? hex(opt) : hex('#f0a0a8')), ...FA.linenPal() };
      fitInto(p, FA.BED, pal, 0, 0, W, H + fh);
      return { pix: p.outline(), ox: 0, oy: -(H + fh), wall: false, faces: { topY: 28, frontY: H, frontH: fh, sideW: 3, legs: 0 } };
    }
    case 'crib': {
      const p = tall(14);
      fitInto(p, FA.CRIB, { ...FA.woodPal(hex('#e8d0a8')), ...FA.clothPal(hex('#ffe08a')), ...FA.linenPal() }, 0, 0, W, H + 14);
      return { pix: p.outline(), ox: 0, oy: -(H + 14), wall: false };
    }
    case 'desk': {
      // 3면 책상 (격자 DESK): 위 물건 자리 16 · 윗판 윗면 · 앞판 8 · 다리 14, 오른쪽에 서랍장
      const room = 16;
      const d = Math.max(10, H - 8);
      const fh = 8;
      const legs = 14;
      const p = new Pix(W, room + d + fh + legs);
      const fy = room + d;
      bands(p, FA.DESK.g, FA.woodPal(WOODF), 0, room, W, FA.DESK.cols, [[[3, [4, 'r'], 3], d], [[8], fh], [[14], legs]]);
      // 책상 위: 스탠드 · 공책 · (opt 'jar' 종이별 병)
      const dp = FA.deskPropPal();
      paintGrid(p, FA.DESK_LAMP, 1, room + 6 - FA.DESK_LAMP.length + 4, dp);
      paintGrid(p, FA.NOTEBOOK, 20, room + 3, dp);
      if (opt.includes('jar')) paintGrid(p, FA.STAR_JAR, W - 16, room - 8, dp);
      return { pix: p.outline(), ox: 0, oy: -p.h, wall: false, faces: { topY: room, frontY: fy, frontH: fh, sideW: 3, legs } };
    }
    case 'chair': {
      const p = tall(16);
      fitInto(p, FA.CHAIR, FA.woodPal(WOODF), 0, 0, W, H + 16);
      return { pix: p.outline(), ox: 0, oy: -(H + 16), wall: false };
    }
    case 'shelf': {
      // 키 큰 책장 (벽에 붙어 위로 솟는다): 칸 틀 격자 (12줄 칸 되풀이) + 칸마다 책 한 줄 격자 (opt 'toys': 인형 줄)
      const p = tall(44);
      fitInto(p, FA.SHELF, FA.woodPal(WOODF), 0, 0, W, H + 44);
      const strip = opt.includes('toys') ? FA.SHELF_TOYS : FA.BOOKS;
      const rowH = 12;
      for (let k = 0, y = 3; y + 9 <= H + 44 - 4; k++, y += rowH) {
        paintTiled(p, strip.slice(0, 9), FA.bookPal(), 4, y, W - 8, 9, k * 13, 0);
        if (opt.includes('jar') && k === 1) paintGrid(p, FA.STAR_JAR, W - 16, y - 8, FA.deskPropPal());
      }
      return { pix: p.outline(), ox: 0, oy: -(H + 44), wall: true };
    }
    case 'claw': {
      // 인형 뽑기 기계 (격자 CLAW_BODY): 유리 상자 안 인형 더미 · 맨 아래 주황 여우 (루루) · 집게 · 조작판
      const p = tall(38);
      const T = H + 38;
      fitInto(p, FB.CLAW_BODY, FB.clawPal(), 0, 0, W, T);
      const pp = FB.plushPal();
      const pileY = T - 11 - FB.PLUSH_PILE.length;
      paintTiled(p, FB.PLUSH_PILE, pp, 4, pileY, W - 8, FB.PLUSH_PILE.length, 0, 0);
      paintGrid(p, FB.FOX, W - 13, T - 11 - FB.FOX.length, pp);
      paintGrid(p, FB.CLAW_ARM, Math.round(W / 2 - 3), 4, pp);
      return { pix: p.outline(), ox: 0, oy: -(H + 38), wall: true };
    }
    case 'wardrobe': {
      // 장롱 (사람보다 높다, 격자 WARDROBE): 위 몰딩 · 두 문짝 · 놋쇠 손잡이 · 받침 · 오른쪽 옆면
      const p = tall(48);
      fitInto(p, FA.WARDROBE, FA.woodPal(hex('#c8905a')), 0, 0, W, H + 48);
      return { pix: p.outline(), ox: 0, oy: -(H + 48), wall: true };
    }
    case 'toybox': {
      // 3면 장난감 상자 (격자 BOX3): 뚜껑 윗면 · 앞면 (노란 띠) · 오른쪽 옆면. 열리면 뚜껑이 뒤로 서고 안이 보인다
      const col = hex('#5a9ae8');
      const d = Math.max(10, H - 6);
      const fh = 16;
      const p = new Pix(W, d + fh);
      const bp = FA.boxPropPal();
      if (opt.includes('open')) {
        box3(p, { ...FA.plainPal(col), G: shade(col, -0.45), O: shade(col, -0.55) }, 1, 0, W - 2, d, fh);
        box3(p, FA.plainPal(shade(col, -0.1)), 1, 0, W - 2, 3, 3);
        paintGrid(p, FA.TOYS_IN, 6, d - 11, bp);
      } else box3(p, FA.plainPal(col), 0, 0, W, d, fh);
      paintTiled(p, FA.BAND, bp, 3, d + 4, W - 8, 2);
      if (opt.includes('label')) paintGrid(p, FA.LABEL, Math.round(W / 2 - 10), d + 7, bp);
      return { pix: p.outline(), ox: 0, oy: -p.h, wall: false, faces: { topY: 0, frontY: d, frontH: fh, sideW: 3, legs: 0 } };
    }
    case 'window': {
      // 벽에 난 창 (opt: 하늘 덮어쓰기): 하늘 띠 격자 · 구름 · 달 · 별 · 비 · 눈 → 흰 창틀 (열십자 창살) → 양쪽 커튼
      const p = new Pix(W, H);
      const sky = (opt || look.sky) as FB.Sky;
      const wp = FB.windowPal(sky, look.accent);
      fitInto(p, FB.SKY_BANDS, wp, 3, 3, W - 6, H - 6);
      if (sky === 'night') {
        paintTiled(p, FB.NIGHT_STARS, wp, 4, 4, W - 8, H - 10, 0, 0);
        paintGrid(p, FB.MOON, W - 18, 5, wp);
      } else if (sky === 'rain') paintTiled(p, FB.RAIN, wp, 4, 4, W - 8, H - 10, 0, 0);
      else if (sky === 'snow') {
        paintTiled(p, FB.SNOW, wp, 4, 4, W - 8, H - 10, 0, 0);
        paintTiled(p, FB.SNOW_SILL, wp, 3, H - 7, W - 6, 3);
      } else if (sky === 'day') paintGrid(p, FB.CLOUD, 6, 5, wp);
      fitInto(p, FB.WINDOW_FRAME, wp, 0, 0, W, H);
      fitInto(p, FB.CURTAIN, wp, 0, 0, 6, H);
      fitInto(p, FB.CURTAIN, wp, W - 6, 0, 6, H, true);
      return { pix: p.outline(), ox: 0, oy: -H, wall: true };
    }
    case 'door': {
      // 나무 문 (격자 DOOR): 판 둘 · 놋쇠 손잡이. 'closed' 할머니 방: 이름표
      const p = new Pix(W, H);
      fitInto(p, FB.DOOR, FB.woodPal(hex('#b07a48')), 0, 0, W, H);
      if (opt.includes('closed')) paintGrid(p, FB.NAMEPLATE, Math.round(W / 2 - 7), 8, FB.namePal());
      return { pix: p.outline(), ox: 0, oy: -H, wall: true };
    }
    case 'rug': {
      // 러그 (격자 RUG, 둥근 모서리 9-조각): 테 · 밝은 띠 · 마름모 무늬
      const p = new Pix(W, H);
      fitInto(p, FB.RUG, FB.clothPal(opt ? hex(opt) : hex('#c86a7a')), 0, 0, W, H);
      return { pix: p, ox: 0, oy: -H, wall: true };
    }
    case 'table': {
      // 3면 식탁: 윗판 윗면 · 앞판 8 · 다리 12 (그 밑은 장난감이 지나가는 그늘)
      const fh = 8;
      const legs = 12;
      const d = H - fh;
      const p = new Pix(W, d + fh + legs);
      fitInto(p, FA.TABLE_LEGS, FA.woodPal(WOODF), 0, d + fh, W, legs);
      if (opt.includes('cloth')) bands(p, FA.TABLECLOTH.g, FA.tableclothPal(), 0, 0, W, FA.TABLECLOTH.cols, [[[2, [2, 'r'], 1], d], [[[3, 'r'], 3], fh + 2]]);
      else box3(p, FA.woodPal(WOODF), 0, 0, W, d, fh);
      const tp = FA.tablePropPal(opt.includes('out'));
      if (opt.includes('cake')) paintGrid(p, FA.CAKE, Math.round(W / 2 - 12), 1, tp);
      if (opt.includes('phone')) paintGrid(p, FA.PHONE, Math.round(W / 2 - 7), 4, tp);
      if (opt.includes('tea')) {
        paintGrid(p, FA.TEACUP, 8, 5, tp);
        paintGrid(p, FA.TEACUP, W - 18, 5, tp);
      }
      return { pix: p.outline(), ox: 0, oy: -p.h, wall: false, faces: { topY: 0, frontY: d, frontH: fh, sideW: 3, legs } };
    }
    case 'sofa': {
      // 3면 소파 (격자 SOFA): 위 띠(등받이 · 팔걸이 · 쿠션 윗면)를 앉는 면 깊이에, 아래 띠(앞면)를 12줄에 맞춘다
      const c = opt ? hex(opt) : hex('#c8705a');
      const seatD = Math.max(8, H - 10);
      const fh = 12;
      const backH = 14;
      const p = new Pix(W, backH + seatD + fh);
      const sy = backH;
      bands(p, FA.SOFA.g, { ...FA.clothPal(c), v: shade(WOODF, -0.4) }, 0, 0, W, FA.SOFA.cols, [[FA.SOFA_UP, sy + seatD], [FA.SOFA_DOWN, fh]]);
      return { pix: p.outline(), ox: 0, oy: -p.h, wall: false, faces: { topY: sy, frontY: sy + seatD, frontH: fh, sideW: 3, legs: 0 } };
    }
    case 'tv': {
      // 3면 TV: 낮은 장 (격자 BOX3) 위에 브라운관 상자 (격자 CRT)
      const d = Math.max(8, H - 8);
      const fh = 14;
      const tvH = 24;
      const p = new Pix(W, tvH - 2 + d + fh);
      box3(p, FA.woodPal(WOODF), 0, tvH - 2, W, d, fh);
      paintTiled(p, ['w'], FA.woodPal(WOODF), 4, tvH - 2 + d + 4, W - 10, 1);
      fitInto(p, FA.CRT, FA.crtPal(), 4, 0, W - 10, tvH);
      return { pix: p.outline(), ox: 0, oy: -p.h, wall: true, faces: { topY: tvH - 2, frontY: tvH - 2 + d, frontH: fh, sideW: 3, legs: 0 } };
    }
    case 'plant': {
      const p = tall(18);
      paintGrid(p, FA.PLANT, Math.round((W - FA.PLANT[0].length) / 2), H + 18 - FA.PLANT.length, FA.plantPal());
      return { pix: p.outline(), ox: 0, oy: -(H + 18), wall: false };
    }
    case 'boxes': {
      // opt 'open': 뚜껑 날개가 벌어진 열린 상자 하나 (안에 장난감이 선다)
      if (opt.includes('open')) return openCarton(W, H, opt);
      // 이삿짐 상자 더미 (격자 BOX3 둘): opt 'label' 두고 가는 짐 쪽지 · 'tape' 가로 테이프
      const card = FA.plainPal(hex('#c89a64'));
      const tp = { T: hex('#dcc49c'), t: shade(hex('#dcc49c'), -0.1) };
      const bp = FA.boxPropPal();
      if (w === 1) {
        // 한 칸짜리는 상자 하나 (가는 기둥처럼 쌓지 않는다)
        const p = new Pix(W, 30);
        box3(p, card, 0, 0, W, 11, 19);
        paintTiled(p, FA.TAPE_V, tp, W / 2 - 2, 1, 4, 15);
        if (opt.includes('tape')) paintTiled(p, FA.TAPE_H, tp, 1, 21, W - 4, 2);
        if (opt.includes('label')) paintGrid(p, FA.LABEL, 2, 18, bp);
        return { pix: p.outline(), ox: 0, oy: -p.h, wall: false, faces: { topY: 0, frontY: 11, frontH: 19, sideW: 3, legs: 0 } };
      }
      const d = Math.max(10, H - 6);
      const fh = 18;
      const up = 16;
      const p = new Pix(W, up + d + fh);
      box3(p, card, 0, up, W, d, fh);
      paintTiled(p, FA.TAPE_V, tp, W / 2 - 2, up + 1, 4, d + 5);
      // 위 상자 (조금 작게, 아래 상자 윗면 위에)
      const tw = W - 14;
      box3(p, FA.plainPal(shade(hex('#c89a64'), 0.05)), 5, 0, tw, 8, up + 4);
      paintTiled(p, FA.TAPE_V, tp, Math.round(5 + tw / 2 - 2), 1, 4, 12);
      if (opt.includes('label')) paintGrid(p, FA.LABEL, 4, up + d + 4, bp);
      return { pix: p.outline(), ox: 0, oy: -p.h, wall: false, faces: { topY: up, frontY: up + d, frontH: fh, sideW: 3, legs: 0 } };
    }
    case 'sewing': {
      // 할머니 재봉틀: 나무 탁자 (BOX3 · 다리) 위에 검은 재봉틀 머리 (격자 SEWING_HEAD). opt 'thread' 빨간 실패 · 'dust' 먼지
      const p = tall(14);
      const sp = FA.sewingPal();
      box3(p, FA.woodPal(WOODF), 0, 12, W, 6, 10);
      fitInto(p, FA.TABLE_LEGS, FA.woodPal(WOODF), 0, 28, W, H + 14 - 28);
      fitInto(p, FA.SEWING_HEAD, sp, 6, 0, W - 12, 16);
      if (opt.includes('thread')) paintGrid(p, FA.THREAD, W - 11, 6, sp);
      if (opt.includes('dust')) {
        const dust = cutTile(FA.DUST_SPECKS, 0, 0, W, 16);
        for (let y = 0; y < 16; y++) for (let x = 0; x < W; x++) if (dust[y][x] === 'd' && p.get(x, y) !== CLEAR) p.set(x, y, sp.d);
      }
      return { pix: p.outline(), ox: 0, oy: -(H + 14), wall: false };
    }
    case 'photo': {
      // 액자 (격자 FRAME) 속 사진 (할머니와 하루, 격자 PICTURE)
      const p = new Pix(W, H);
      const pp = FB.picturePal();
      fitInto(p, FB.FRAME, FB.woodPal(hex('#8a5a3a')), 2, 2, W - 4, H - 4);
      paintTiled(p, ['M'], pp, 6, 6, W - 12, H - 12);
      const pw = FB.PICTURE[0].length;
      paintGrid(p, FB.PICTURE, Math.round((W - pw) / 2), H - 6 - FB.PICTURE.length, pp);
      return { pix: p.outline(), ox: 0, oy: -H, wall: true };
    }
    case 'clock': {
      // 둥근 벽시계 (격자 CLOCK_FACE). live: 바늘은 render 가 장의 시각으로 그린다
      const p = new Pix(W, H);
      const cp = FB.clockPal();
      const n = FB.CLOCK_FACE.length;
      paintGrid(p, FB.CLOCK_FACE, Math.round((W - n) / 2), Math.round((H - n) / 2), cp);
      if (!/\blive\b/.test(opt)) paintGrid(p, FB.CLOCK_HANDS, Math.round(W / 2) - 3, Math.round(H / 2) - 6, cp);
      else paintGrid(p, ['o'], Math.round(W / 2), Math.round(H / 2), cp);
      return { pix: p.outline(), ox: 0, oy: -H, wall: true };
    }
    case 'garland': {
      // 생일 깃발 줄: 깃발 한 장 격자(FLAG)를 줄이 처진 모양대로 이어 찍는다 (네 색 돌아가며)
      const p = new Pix(W, H);
      const cs = [hex('#f06a8a'), hex('#ffd84a'), hex('#6ac8f0'), hex('#8ad06a')];
      const fw = FB.FLAG[0].length;
      for (let i = 0, x = 2; x < W - 4; x += fw, i++) paintGrid(p, FB.FLAG, x, 3 + Math.round(Math.sin(((x + fw / 2) / W) * Math.PI) * 6), FB.flagPal(cs[i % 4]));
      return { pix: p, ox: 0, oy: -H, wall: true };
    }
    case 'hbed': {
      // 병원 침대 (격자 HBED, opt 'gm': 할머니가 누워 있다)
      const p = tall(16);
      fitInto(p, FC.HBED, FC.hbedPal(hex('#a8c8e8')), 0, 0, W, H + 16);
      if (opt.includes('gm')) paintGrid(p, FC.GM_HEAD, Math.round(W / 2 - 6), 7, FC.gmPal());
      return { pix: p.outline(), ox: 0, oy: -(H + 16), wall: false };
    }
    case 'iv': {
      const p = tall(30);
      fitInto(p, FC.IV, FC.ivPal(), Math.round(W / 2 - 5), 2, 11, H + 28);
      return { pix: p.outline(), ox: 0, oy: -(H + 30), wall: false };
    }
    case 'fence': {
      const p = tall(6);
      fitInto(p, FC.FENCE, FC.fencePal(hex('#f0ece0')), 0, 0, W, H + 6);
      return { pix: p.outline(), ox: 0, oy: -(H + 6), wall: false };
    }
    case 'flowers': {
      // 화단: 흙 상자 (PLANTER) 위로 꽃 셋 한 마디 (FLOWER_ROW) 를 되풀이
      const p = new Pix(W, H);
      const fp = FC.flowerPal();
      fitInto(p, FC.PLANTER, fp, 0, H - 10, W, 10);
      paintTiled(p, FC.FLOWER_ROW, fp, 1, H - 17, W - 2, FC.FLOWER_ROW.length, 0, 0);
      return { pix: p.outline(), ox: 0, oy: -H, wall: false };
    }
    case 'puddle': {
      const p = new Pix(W, H);
      fitInto(p, FC.PUDDLE, FC.puddlePal(hex('#7a8aa0')), 0, 3, W, H - 6);
      return { pix: p, ox: 0, oy: -H, wall: true };
    }
    case 'mud': {
      const p = new Pix(W, H);
      fitInto(p, FC.MUD, FC.puddlePal(hex('#6a4a30')), 0, 2, W, H - 4);
      return { pix: p, ox: 0, oy: -H, wall: true };
    }
    case 'bush': {
      const p = tall(10);
      clumps(p, FC.BUSH_LAYOUT, FC.bushPal(hex('#4a8a4a')), 0, 0, W, H + 10);
      return { pix: p.outline(), ox: 0, oy: -(H + 10), wall: false };
    }
    case 'stage': {
      // 인형극 무대 (상자로 만든, 격자 STAGE)
      const p = tall(30);
      fitInto(p, FC.STAGE, FC.stagePal(), 0, 0, W, H + 30);
      return { pix: p.outline(), ox: 0, oy: -(H + 30), wall: false };
    }
    case 'bathtub': {
      // 욕조 (격자 TUB): 물 위 거품 (opt 'bubble') · 수도꼭지
      const p = tall(10);
      const T = H + 10;
      const tp = FC.tubPal();
      fitInto(p, FC.TUB, tp, 0, 0, W, T);
      if (opt.includes('bubble')) {
        const extra = T - FC.TUB.g.length;
        const waterEnd = 11 + Math.floor(extra / 2) + (extra % 2);
        paintTiled(p, FC.BUBBLES, tp, 5, 5, W - 10, waterEnd - 6, 0, 0);
      }
      paintGrid(p, FC.FAUCET, W - 11, 0, tp);
      return { pix: p.outline(), ox: 0, oy: -(H + 10), wall: false };
    }
    case 'sink': {
      const p = tall(20);
      fitInto(p, FC.SINK, FC.sinkPal(), 0, 0, W, H + 20);
      return { pix: p.outline(), ox: 0, oy: -(H + 20), wall: true };
    }
    case 'facade': {
      // 집 앞면: 기와 지붕 · 다락방 둥근 창 · 벽 널 · 불 켜진 창 셋 · 가운데 현관문 · 문등 (부분 격자를 붙인다)
      const p = tall(30);
      const fp = FD.facadePal();
      paintTiled(p, FD.SIDING, fp, 0, 30, W, H, 0, 0);
      paintTiled(p, FD.FACADE_ROOF, fp, 0, 6, W, 24, 0, 0);
      paintTiled(p, ['h', 'h', 'h'], fp, 0, 30, W, 3);
      paintGrid(p, FD.ROUND_WIN, Math.round(W / 2 - 8), 8, fp);
      for (const x of [24, W - 58, W / 2 + 40]) paintGrid(p, FD.FACADE_WIN, Math.round(x), 40, fp);
      fitInto(p, FB.DOOR, FB.woodPal(hex('#6a3a2a')), Math.round(W / 2 - 14), 44, 28, H + 30 - 44);
      paintGrid(p, FD.PORCH_LAMP, Math.round(W / 2 + 31), 39, fp);
      return { pix: p.outline(), ox: 0, oy: -(H + 30), wall: true };
    }
    case 'truck': {
      // 이삿짐 트럭: 하얀 짐칸 (격자 TRUCK_BOX) + 파란 운전석 (TRUCK_CAB) + 바퀴 셋
      const p = tall(20);
      const tp = FD.truckPal();
      fitInto(p, FD.TRUCK_BOX, tp, 0, 0, W - 34, H + 8);
      fitInto(p, FD.TRUCK_CAB, tp, W - 34, 10, 32, H - 2);
      for (const cx of [14, W - 64, W - 18]) paintGrid(p, FD.WHEEL, cx - 9, H + 3, tp);
      return { pix: p.outline(), ox: 0, oy: -(H + 20), wall: false };
    }
    case 'swing': {
      // 할아버지가 만든 나무 그네 (격자 SWING): 들보 · 기둥 · 밧줄 · 판자
      const p = tall(34);
      fitInto(p, FC.SWING, FC.swingPal(), 0, 0, W, H + 34);
      return { pix: p.outline(), ox: 0, oy: -(H + 34), wall: false };
    }
    case 'mailbox': {
      const p = tall(16);
      paintGrid(p, FC.MAILBOX, Math.round(W / 2 - 12), H + 16 - FC.MAILBOX.length, FC.mailboxPal());
      return { pix: p.outline(), ox: 0, oy: -(H + 16), wall: false };
    }
    case 'bike': {
      const p = tall(8);
      // 바퀴 둘 (격자 BIKE_WHEEL) · 틀 (BIKE_FRAME): 뒷바퀴 축 · 앞 포크 끝이 틀의 1열 · 30열에 오게
      const bp = FC.bikePal(opt ? hex(opt) : hex('#e85a6a'));
      const x0 = Math.round((W - 48) / 2);
      const y0 = H + 8 - 26;
      paintGrid(p, FC.BIKE_WHEEL, x0, y0 + 6, bp);
      paintGrid(p, FC.BIKE_WHEEL, x0 + 29, y0 + 6, bp);
      paintGrid(p, FC.BIKE_FRAME, x0 + 7, y0 + 2, bp);
      return { pix: p.outline(), ox: 0, oy: -(H + 8), wall: false };
    }
    case 'railing': {
      const p = tall(6);
      fitInto(p, FC.RAILING, FC.railPal(), 0, 2, W, H + 2);
      return { pix: p.outline(), ox: 0, oy: -(H + 6), wall: true };
    }
    case 'stool': {
      const p = tall(6);
      fitInto(p, FC.STOOL, FA.woodPal(WOODF), 0, 0, W, H + 6);
      return { pix: p.outline(), ox: 0, oy: -(H + 6), wall: false };
    }
    case 'pots': {
      // 꽃 화분 (격자 POT) 을 칸마다 하나씩, 꽃 색은 돌아가며
      const p = tall(14);
      const cs = [hex('#f06a8a'), hex('#ffd84a'), hex('#a88ad0')];
      for (let i = 0; i < Math.max(1, w); i++) paintGrid(p, FC.POT, i * HT, H + 14 - FC.POT.length, FC.potPal(cs[i % 3]));
      return { pix: p.outline(), ox: 0, oy: -(H + 14), wall: false };
    }
    case 'cushion': {
      const p = new Pix(W, H);
      const cp = FA.clothPal(hex('#e8a0a0'));
      fitInto(p, FC.CUSHION, cp, 1, 5, W - 2, H - 8);
      paintGrid(p, FC.BUTTON, Math.round(W / 2 - 2), Math.round(H / 2), cp);
      return { pix: p.outline(), ox: 0, oy: -H, wall: false };
    }
    case 'calendar': {
      // 벽 달력 (격자 CALENDAR): 빨간 머리 · 날짜 점. 'x': 지운 날 X 표
      const p = new Pix(W, H);
      const cp = FB.calendarPal();
      fitInto(p, FB.CALENDAR, cp, 3, 2, W - 6, H - 4);
      if (opt.includes('x')) for (let k = 0; k < 3 && 6 + k * 8 + 5 < W - 4; k++) paintGrid(p, FB.CROSS, 6 + k * 8, 9 + (k % 2) * 6, cp);
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
      box3(p, FA.plainPal(hex('#c0a080')), 0, 0, W, Math.min(10, H - 8), H - Math.min(10, H - 8));
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
  const fl = 9;
  const PW = W + fl * 2;
  const up = 26;
  // 앞면은 발 줄 아래 단 앞면(S) 칸까지 덮는다 (상자 밑동이 바닥에 닿는 자리)
  const sink = 10;
  const Ht = H + up + sink;
  const rimB = 14;
  const rimF = FA.CARTON_BACK.g.length;
  const sw = 4;
  const cp = FA.cartonPal();
  // 뒷부분 격자 (뒷날개 · 뒤 테 · 안 · 바닥 · 옆 날개) 와 앞부분 격자 (앞 테 · 앞면 · 옆면) 를 폭에 맞춰 붙인다
  const full = new Pix(PW, Ht);
  fitInto(full, FA.CARTON_BACK, cp, 0, 0, PW, rimF);
  const front = new Pix(PW, Ht);
  fitInto(front, FA.CARTON_FRONT, cp, 0, rimF, PW, Ht - rimF);
  if (opt.includes('label')) paintGrid(front, FA.LABEL, fl + 4, rimF + 6, FA.boxPropPal());
  full.stamp(front, 0, 0);
  full.outline();
  // 외곽선까지 나눈다: 앞 테 줄부터 아래는 앞부분
  const behind = new Pix(PW, Ht);
  const fr = new Pix(PW, Ht);
  for (let y = 0; y < Ht; y++) for (let x = 0; x < PW; x++) (y < rimF ? behind : fr).set(x, y, full.get(x, y));
  return { pix: full, ox: -fl, oy: -(Ht - sink), wall: false, behind, front: fr, faces: { topY: rimB, frontY: rimF, frontH: Ht - rimF, sideW: sw, legs: 0 } };
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

/** 늘어진 줄 (전선): 한 칸 굵기 줄을 처지게 잇는다 (합성: 손찍기 그림 사이를 잇는 선) */
function sag(p: Pix, x0: number, y0: number, x1: number, y1: number, depth: number, c: Color): void {
  const n = Math.max(1, Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    p.set(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t + Math.sin(Math.PI * t) * depth), c);
  }
}

/** 격자를 그 크기 그대로, 아니면 조각 맞춤으로 (w×h) 찍는다 */
function gridAt(p: Pix, g: Grid, pal: Palette, x: number, y: number, w = g[0].length, h = g.length, cols: readonly Seg[] = [[g[0].length, 'r']], rows: readonly Seg[] = [[g.length, 'r']]): void {
  if (w === g[0].length && h === g.length) paintGrid(p, g, x, y, pal);
  else paintFit(p, g, pal, x, y, w, h, cols, rows);
}

/** 위아래를 뒤집은 격자 */
const flipV = (g: Grid): string[] => [...g].reverse();

/** 전봇대 (격자 POLE) + 전선. opt 'l6r9': 전선이 왼쪽 6칸 · 오른쪽 9칸까지 뻗는다 (다음 전봇대 · 담 너머로) */
function pole(W: number, H: number, L: HouseLook, opt: string): RawSprite {
  const l = Number(/l(\d+)/.exec(opt)?.[1] ?? 2);
  const r = Number(/r(\d+)/.exec(opt)?.[1] ?? 2);
  const ext = 72;
  const T = H + ext;
  const left = l * HT;
  const p = new Pix(left + W + r * HT, T);
  const cx = left + Math.floor(W / 2);
  // 머리 (완금 · 애자 · 변압기) · 줄기 마디 되풀이 · 밑동 (전단 · 띠)
  const pp = FD.polePal();
  paintGrid(p, FD.POLE_TOP, cx - 17, 0, pp);
  const foot = FD.POLE_FOOT.length;
  paintTiled(p, FD.POLE_SHAFT, pp, cx - 6, FD.POLE_TOP.length, 12, T - foot - FD.POLE_TOP.length, 0, 0);
  paintGrid(p, FD.POLE_FOOT, cx - 6, T - foot, pp);
  p.outline();
  // 전선: 애자에서 양옆 끝까지 처진 줄 · 변압기에서 집으로 들어가는 선
  const wire = hex('#2a2a34');
  const ay = 12;
  const ins = [cx - 14, cx - 6, cx + 4, cx + 12];
  for (const [i, x] of ins.entries()) {
    const y0 = 7;
    sag(p, x, y0, 0, y0 + (i % 2) * 2, 4 + l * 2 + i, wire);
    sag(p, x + 1, y0, p.w - 1, y0 + (i % 2) * 2, 4 + r * 2 + i, wire);
  }
  sag(p, cx + 15, ay + 8, p.w - 1, ay + 4, 10, wire);
  return { pix: p, ox: -left, oy: -T, wall: false };
}

/** 가로등 (격자 LAMP): 굽은 팔 끝의 등. 해 질 녘 · 밤 · 비 오는 날엔 켜져 있다 */
function lamp(W: number, H: number, L: HouseLook): RawSprite {
  const T = H + 62;
  const p = new Pix(W + 14, T);
  const cx = Math.floor(W / 2);
  const lp = FD.lampPal(L.sky !== 'day', LIT);
  paintGrid(p, FD.LAMP_HEAD, cx - 3, 0, lp);
  paintTiled(p, FD.LAMP_POST, lp, cx - 3, FD.LAMP_HEAD.length, 6, T - FD.LAMP_HEAD.length - FD.LAMP_FOOT.length);
  paintGrid(p, FD.LAMP_FOOT, cx - 4, T - FD.LAMP_FOOT.length, lp);
  p.outline();
  return { pix: p, ox: 0, oy: -T, wall: false };
}

/** 나무 (격자 TREE_*): 기본 초록 가로수. opt 'ginkgo' 노란 은행나무 · 'persimmon' 감나무 (주황 감). 보도 · 골목이면 밑동에 철망 덮개 */
function tree(W: number, H: number, L: HouseLook, opt: string): RawSprite {
  const T = H + 72;
  const side = 26;
  const p = new Pix(W + side * 2, T);
  const cx = side + Math.floor(W / 2);
  const kind = opt.includes('ginkgo') ? 'ginkgo' : opt.includes('persimmon') ? 'persimmon' : 'green';
  const bark = kind === 'persimmon' ? hex('#4e3a2c') : hex('#6a5444');
  const leaf = kind === 'ginkgo' ? hex('#ecc23a') : kind === 'persimmon' ? hex('#5a8a3c') : L.sky === 'rain' ? hex('#4a8248') : L.sky === 'dusk' ? hex('#5a8a44') : hex('#5c9c48');
  const tp = FD.treePal(leaf, bark);
  // 줄기 (격자 TRUNK) 위에 잎 덩이를 손으로 고른 자리에 겹친다 (은행나무는 원뿔꼴), 감나무는 감을 단다
  fitInto(p, FD.TRUNK, tp, cx - 8, 28, 16, T - 28);
  for (const [g, x, y] of kind === 'ginkgo' ? FD.CROWN_CONE : FD.CROWN_ROUND) paintGrid(p, g, cx - 38 + x, y, tp);
  if (kind === 'persimmon') for (const [x, y] of FD.FRUIT_SPOTS) paintGrid(p, FD.FRUIT, cx - 38 + x, y, tp);
  if (OUTDOOR_PAVED.has(L.floorKind)) paintGrid(p, FD.GRATE, cx - 11, T - 5, tp);
  p.outline();
  if (kind === 'ginkgo') paintGrid(p, FD.LEAF_FALL, cx - 11, T - 3, tp);
  return { pix: p, ox: -side, oy: -T, wall: false };
}

const OUTDOOR_PAVED = new Set<HouseLook['floorKind']>(['asphalt', 'paving']);

/** 벽돌 기둥 · 담 (격자 HX.BRICKS 되풀이) */
function bricks(p: Pix, x0: number, y0: number, w: number, h: number, c: Color): void {
  paintTiled(p, HX.BRICKS, HX.brickPal(c, false), x0, y0, w, h, 0, 0);
}

/** 갓돌 (격자 HX.COPING 위 다섯 줄) */
function coping(p: Pix, L: HouseLook, x: number, y: number, w: number): void {
  paintTiled(p, HX.COPING.slice(0, 5), { G: shade(L.base, 0.3), g: L.base, h: shade(L.base, -0.3) }, x, y, w, 5, 0, 0);
}

/** 파란 철 대문 (하루네, 격자 GATE_LEAF). 양쪽 벽돌 기둥 · 문패 · 초인종. opt 'open': 한 짝이 안으로 열려 마당이 보인다 */
function gate(W: number, H: number, L: HouseLook, opt: string): RawSprite {
  const T = H + 24;
  const p = new Pix(W, T);
  const gp = FD.gatePal(L.base, L.wall);
  const pw = 9;
  const top = 16;
  for (const x of [0, W - pw]) {
    bricks(p, x, 8, pw, T - 8, L.wall);
    gridAt(p, FD.PILLAR_CAP, gp, x, 4);
  }
  paintGrid(p, FD.NAMEPLATE_S, 2, 24, gp);
  paintGrid(p, FD.BELL, 3, 38, gp);
  const gx = pw;
  const gw = W - pw * 2;
  const half = Math.floor(gw / 2);
  const leaf = (x: number, w: number) => {
    fitInto(p, FD.GATE_LEAF, gp, x, top - 2, w, T - top + 1);
    paintGrid(p, FD.GATE_KNOB, Math.round(x + w / 2 - 2), top + 9, gp);
  };
  leaf(gx, half);
  if (opt.includes('open')) {
    // 열린 쪽: 마당 · 현관문 · 계단 (격자 YARD_VIEW) · 안쪽으로 젖혀진 문짝 (얇은 판)
    const ox = gx + half;
    const ow = gw - half;
    fitInto(p, FD.YARD_VIEW, gp, ox, top - 2, ow, T - top + 2);
    fitInto(p, FD.GATE_LEAF, gp, ox + ow - 6, top - 2, 5, T - top - 2);
  } else leaf(gx + half, gw - half);
  return { pix: p.outline(), ox: 0, oy: -T, wall: true };
}

/** 이웃집 담: 담 너머 지붕 · 창. opt 'ivy' 담쟁이 · 'mesh' 학교 철망 울타리 · 'red' / 'blue' / 'green' 지붕 색 · 'low' 지붕 없이 담만 */
function nwall(W: number, H: number, L: HouseLook, opt: string): RawSprite {
  const T = H + 24;
  const p = new Pix(W, T);
  if (opt.includes('mesh')) {
    // 학교 운동장 쪽: 덤불 · 흙 위에 초록 철망 · 기둥 · 시멘트 턱
    const sp = FD.schoolPal();
    paintTiled(p, HX.SAND, HX.sandPal(hex('#c8ac7c')), 0, 10, W, T - 24);
    paintTiled(p, FD.SHRUB_ROW, FD.shrubPal(L.accent), 0, 12, W, FD.SHRUB_ROW.length);
    paintTiled(p, FD.MESH, sp, 0, 8, W, T - 22);
    const rail = { m: hex('#2a6a44'), M: hex('#3a8a5a'), L: hex('#4aa070') };
    paintTiled(p, ['m', 'M'], rail, 0, 7, W, 2);
    for (let x = 2; x < W; x += HT) paintTiled(p, ['LMm'], rail, x, 6, 3, T - 18);
    fitInto(p, FD.CROCK_STAND, { S: hex('#d8d4cc'), s: hex('#cbc6bc'), n: hex('#a8a49c') }, 0, T - 14, W, 14);
    return { pix: p.outline(), ox: 0, oy: -T, wall: true };
  }
  const wallTop = T - 36;
  if (opt.includes('low')) {
    // 담 너머 정원수 (둥근 회양목 · 키 작은 나무)
    clumps(p, FC.BUSH_LAYOUT, FC.bushPal(L.accent), 0, wallTop - 30, W, 34);
  } else {
    const roof = opt.includes('blue') ? hex('#4a6a9a') : opt.includes('green') ? hex('#4a8a6a') : opt.includes('red') ? hex('#b85a48') : [hex('#b85a48'), hex('#4a6a9a'), hex('#5a7a5a')][Math.floor(hash2(W, H, 224) * 3)];
    const np = FD.nwallPal(roof, evening(L), LIT, L.accent);
    paintTiled(p, FD.SIDING, { W: evening(L) ? hex('#d8c8b4') : hex('#ece2d0'), w: shade(evening(L) ? hex('#d8c8b4') : hex('#ece2d0'), -0.05) }, 6, 14, W - 12, wallTop - 10);
    for (let x = 18; x + 22 < W - 6; x += 44) paintGrid(p, FD.HOUSE_WIN, x, 19, np);
    paintTiled(p, FD.ROOF_TILES, np, 0, 2, W, 12, 0, 0);
    paintTiled(p, ['h'], { h: shade(roof, -0.45) }, 4, 14, W - 8, 2);
  }
  bricks(p, 0, wallTop, W, T - wallTop, L.wall);
  coping(p, L, 0, wallTop - 4, W);
  paintTiled(p, ['s'], { s: shade(L.wall, -0.4) }, 0, T - 2, W, 2);
  if (opt.includes('ivy')) {
    const ivy = { l: shade(L.accent, -0.2), L: shade(L.accent, 0.05), G: shade(L.accent, 0.25) };
    paintTiled(p, HX.IVY, ivy, 0, wallTop - 2, W, HX.IVY.length, 0, 0);
    paintTiled(p, HX.IVY, ivy, 0, wallTop + 7, W, HX.IVY.length, 11, 0);
  }
  return { pix: p.outline(), ox: 0, oy: -T, wall: true };
}

/** 동네 구멍가게 앞면: 간판 · 줄무늬 차양 · 유리문 · 선반 · 진열 상자 · 아이스크림 냉장고 · 평상 (부분 격자를 붙인다) */
function shop(W: number, H: number, L: HouseLook): RawSprite {
  const T = H + 24;
  const p = new Pix(W, T);
  const ev = evening(L);
  const sp = FD.shopPal(ev, LIT);
  paintTiled(p, ['H'], { H: hex('#e4dccc') }, 2, 0, W - 4, T - 24);
  fitInto(p, FD.SIGNBOARD, FD.signboardPal(), 6, 2, W - 12, 15);
  paintGrid(p, FD.GLYPHS9, Math.round(W / 2 - 28), 5, FD.inkPal(hex('#f8f4e8')));
  paintGrid(p, FD.APPLE, 12, 5, FD.signboardPal());
  // 가게 안 (선반 · 물건) · 유리문 틀 (알루미늄) · 유리에 비친 빛
  const iy = 32;
  const ih = T - 24 - iy;
  paintTiled(p, ['I'], sp, 4, iy, W - 8, ih);
  paintTiled(p, FD.GOODS, sp, 6, iy + 2, W - 12, ih - 3, 0, 0);
  for (const x of [4, W / 2 - 22, W / 2 + 22, W - 6, W / 2 - 1]) paintTiled(p, ['J'], sp, Math.round(x), iy, 2, ih);
  for (const x of [W / 2 - 18, W / 2 + 4]) paintTiled(p, ['K'], sp, Math.round(x), iy + 4, 2, ih - 8);
  // 줄무늬 차양
  paintTiled(p, FD.AWNING, sp, 0, 18, W, FD.AWNING.length, 0, 0);
  // 바깥 진열 · 아이스크림 냉장고 · 평상
  const fy = T - 24;
  paintGrid(p, FD.CRATES, Math.round(W / 2 - 18), fy - 4, FD.cratePal());
  paintGrid(p, FD.FREEZER, 6, fy - 2, FD.freezerPal());
  paintGrid(p, FD.PYEONGSANG, W - 62, fy + 2, FD.pyeongPal());
  return { pix: p.outline(), ox: 0, oy: -T, wall: true };
}

/** 병원 정문: 하얀 타일 건물 · 창 두 줄 · 빨간 십자 · 차양 · 유리 자동문 · 계단 · 화단 */
function hospital(W: number, H: number, L: HouseLook): RawSprite {
  const T = H + 24;
  const p = new Pix(W, T);
  const hp = FD.hospPal(L.sky === 'rain', L.accent);
  paintTiled(p, FD.TILE_WALL, hp, 0, 0, W, T, 0, 0);
  for (const wy of [3, 22])
    for (let x = 6; x + 14 < W; x += 20) {
      if (wy === 22 && x > W / 2 - 40 && x < W / 2 + 26) continue;
      paintGrid(p, FD.HOSP_WIN, x, wy, hp);
    }
  paintGrid(p, FD.RED_CROSS, Math.round(W / 2 - 10), 18, FD.hospCrossPal());
  const cy = 40;
  fitInto(p, FD.CANOPY, hp, Math.round(W / 2 - 44), cy, 88, 9);
  paintTiled(p, FD.GLYPHS5, FD.inkPal(hex('#f4f8f4')), Math.round(W / 2 - 30), cy + 2, 60, 5, 0, 0);
  for (const x of [W / 2 - 42, W / 2 + 38]) paintTiled(p, ['CCcc'], hp, Math.round(x), cy + 9, 4, T - cy - 13);
  const dy = cy + 9;
  paintTiled(p, ['d'], { d: hex('#5a6a70') }, Math.round(W / 2 - 34), dy, 68, T - dy - 4);
  for (const x of [W / 2 - 32, W / 2 + 1]) fitInto(p, FD.GLASS_DOOR, hp, Math.round(x), dy + 1, 31, T - dy - 6);
  fitInto(p, FD.CROCK_STAND, { S: hex('#d4d4d0'), s: hex('#c4c4c0'), n: hex('#a4a4a0') }, Math.round(W / 2 - 40), T - 4, 80, 4);
  for (const x of [8, W - 52]) {
    fitInto(p, FD.CROCK_STAND, { S: hex('#c8c4bc'), s: hex('#b8b4ac'), n: hex('#98948c') }, x, T - 10, 44, 10);
    paintTiled(p, FD.SHRUB_ROW, FD.shrubPal(L.accent), x, T - 17, 44, FD.SHRUB_ROW.length - 1, 0, 0);
  }
  return { pix: p.outline(), ox: 0, oy: -T, wall: true };
}

/** 학교 게양대 깃발 */
const SCHOOL_FLAG: Grid = ['WWWWWWWW', 'WWWWrWWW', 'WWWrrrWW', 'WWWWrWWW', 'WWWWWWWw'];

/** 학교 정문: 운동장 너머 학교 건물 (가운데 시계탑) · 국기 · 양옆 철망 담 · 정문 기둥 · 이름판 · 밀어 여는 철문 */
function school(W: number, H: number, L: HouseLook): RawSprite {
  const T = H + 24;
  const p = new Pix(W, T);
  const sp = FD.schoolPal();
  paintTiled(p, ['b'], sp, 0, 0, W, 34);
  paintTiled(p, ['t', 't'], { t: hex('#b8a888') }, 0, 0, W, 2);
  for (let x = 4; x + 10 < W; x += 14) {
    if (Math.abs(x + 5 - W / 2) < 14) continue;
    for (const wy of [5, 19]) paintGrid(p, FD.SCHOOL_WIN, x, wy, sp);
  }
  paintGrid(p, FD.CLOCK_TOWER, Math.round(W / 2 - 12), 0, sp);
  // 운동장 흙 · 국기 게양대
  paintTiled(p, HX.SAND, HX.sandPal(hex('#d4b884')), 0, 34, W, T - 34, 0, 0);
  paintTiled(p, ['x'], sp, Math.round(W / 2 + 40), 4, 1, 40);
  paintGrid(p, SCHOOL_FLAG, Math.round(W / 2 + 41), 5, { W: hex('#f4f4f0'), w: hex('#d8d8d0'), r: hex('#d84a4a') });
  // 양옆 철망 담
  const gl = Math.round(W / 2 - 34);
  const gr = Math.round(W / 2 + 34);
  for (const [a, b] of [[0, gl - 10], [gr + 10, W]] as const) {
    paintTiled(p, FD.MESH, sp, a, 36, b - a, T - 48);
    paintTiled(p, ['m', 'M'], { m: hex('#2a6a44'), M: hex('#3a8a5a') }, a, 35, b - a, 2);
    fitInto(p, FD.CROCK_STAND, { S: hex('#dbd6cc'), s: hex('#cbc6bc'), n: hex('#aba69c') }, a, T - 12, b - a, 12);
  }
  // 정문 기둥 · 이름판 · 철문
  for (const x of [gl - 10, gr]) {
    fitInto(p, FD.CROCK_STAND, { S: hex('#e8e4dc'), s: hex('#d8d4cc'), n: hex('#b8b4ac') }, x, 28, 10, T - 28);
    fitInto(p, FD.CROCK_STAND, { S: hex('#c8c4bc'), s: hex('#b8b4ac'), n: hex('#98948c') }, x - 1, 25, 12, 4);
  }
  fitInto(p, { g: FD.NAME_BOARD, cols: [8], rows: [2, [14, 'r'], 2] }, sp, gl - 9, 36, 8, 26);
  paintGrid(p, FD.SLIDE_GATE, gr - 26, T - 22, sp);
  return { pix: p.outline(), ox: 0, oy: -T, wall: true };
}

/** 버스 정류장 (격자 BUS_SIGN · BUS_SEAT): 파란 표지판 · 노선표 · 철제 의자 */
function busstop(W: number, H: number): RawSprite {
  const T = H + 48;
  const p = new Pix(W, T);
  const bp = FD.busPal();
  fitInto(p, FD.BUS_SIGN, bp, 0, 0, 14, T);
  fitInto(p, FD.BUS_SEAT, bp, 16, T - 22, W - 17, 22);
  return { pix: p.outline(), ox: 0, oy: -T, wall: false };
}

/** 나무 벤치 (격자 BENCH): 등받이 · 철제 팔걸이. opt 'wet': 빗물에 젖어 번들 */
function bench(W: number, H: number, opt: string): RawSprite {
  const T = H + 6;
  const p = new Pix(W, T);
  const wet = opt.includes('wet');
  fitInto(p, FD.BENCH, FD.benchPal(wet), 0, T - FD.BENCH.g.length, W, FD.BENCH.g.length);
  if (wet) paintTiled(p, ['......XXX.'], { X: hex('#d8e0e8') }, 4, 12, W - 8, 1);
  return { pix: p.outline(), ox: 0, oy: -T, wall: false };
}

/** 미끄럼틀 (격자 SLIDE) */
function slide(W: number, H: number): RawSprite {
  const T = H + 40;
  const p = new Pix(W, T);
  const pp = FD.playPal();
  // 받침 기둥 · 사다리 · 꼭대기 발판 · 미끄럼판 (단면 한 줄을 손으로 정한 높이표대로 이어 놓는다)
  paintTiled(p, FD.STEEL_POST, pp, 20, 18, 5, T - 18);
  paintTiled(p, FD.STEEL_POST, pp, 43, 36, 5, T - 36);
  fitInto(p, FD.LADDER, pp, 2, 14, 16, T - 14);
  for (let i = 0; i < CHUTE_Y.length && 24 + i < W; i++) paintGrid(p, FD.CHUTE_COL, 24 + i, Math.round((CHUTE_Y[i] * (T - 12)) / 76) - 2, pp);
  paintGrid(p, FD.SLIDE_TOP, 1, 0, pp);
  return { pix: p.outline(), ox: 0, oy: -T, wall: false };
}

/** 미끄럼판 윗면 높이 (왼쪽 끝부터 한 칸씩, 손으로 정한 곡선: 처음엔 완만 · 가운데 가파름 · 끝은 평평) */
const CHUTE_Y = [14, 14, 15, 15, 16, 17, 18, 19, 20, 22, 23, 25, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 71, 72, 73, 74, 75, 75, 76, 76, 76, 76, 76, 76];

/** 그네 두 개: 양 끝 A자 기둥 · 가로 막대 · 쇠사슬 · 고무 앉을판. 앉을판은 가운데 칸들 */
function swingset(W: number, H: number, w: number): RawSprite {
  const T = H + 52;
  const p = new Pix(W, T);
  const pp = FD.playPal();
  for (const x of [0, W - 12]) fitInto(p, FD.SWING_FRAME, pp, x, 0, 12, T);
  paintTiled(p, FD.SWING_BAR, pp, 1, 2, W - 2, FD.SWING_BAR.length, 0, 0);
  for (let i = 0; i < Math.max(1, w - 2); i++) {
    const cx = (i + 1) * HT + HT / 2;
    fitInto(p, FD.SWING_SEAT, pp, cx - 8, 8, 18, T - 8 - 9);
  }
  return { pix: p.outline(), ox: 0, oy: -T, wall: false };
}

/** 시소 (격자 SEESAW) */
function seesaw(W: number, H: number): RawSprite {
  const T = H + 18;
  const p = new Pix(W, T);
  const pp = FD.playPal();
  // 타이어 · 받침 · 널판 (4px 마디를 손으로 정한 높이표대로 이어 놓는다) · 손잡이 둘 · 굴대
  paintGrid(p, FD.TIRE, 1, T - 7, pp);
  paintGrid(p, FD.FULCRUM, Math.round(W / 2 - 7), T - 16, pp);
  for (let i = 0; i < PLANK_RISE.length && 3 + i * 4 < W - 3; i++) paintGrid(p, FD.PLANK_STEP, 3 + i * 4, T - 11 - PLANK_RISE[i], FD.plankPal());
  for (const i of [2, 13]) paintGrid(p, FD.HANDLE, 3 + i * 4 - 2, T - 11 - PLANK_RISE[i] - 8, pp);
  paintGrid(p, FD.PIVOT, Math.round(W / 2 - 2), T - 18, pp);
  return { pix: p.outline(), ox: 0, oy: -T, wall: false };
}

/** 시소 널판 마디마다 올라가는 높이 (손으로 정함) */
const PLANK_RISE = [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18];

/** 정글짐 (격자 JUNGLE_GRID 두 겹 + 잇는 막대 JUNGLE_LINK) */
function jungle(W: number, H: number): RawSprite {
  const T = H + 30;
  const p = new Pix(W, T);
  const jp = FD.junglePal();
  const back = { R: shade(hex('#3a78c8'), -0.3), r: shade(hex('#3a78c8'), -0.45), Y: shade(hex('#3aa070'), -0.3), y: shade(hex('#3aa070'), -0.45) };
  const gw = W - 13;
  const gh = T - 18;
  fitInto(p, FD.JUNGLE_GRID, back, 12, 4, gw, gh);
  for (let x = 3; x <= 3 + gw - 2; x += 19) {
    paintGrid(p, FD.JUNGLE_LINK, x, 4, jp);
    paintGrid(p, FD.JUNGLE_LINK, x, T - 16, jp);
  }
  fitInto(p, FD.JUNGLE_GRID, jp, 3, 16, gw, gh);
  return { pix: p.outline(), ox: 0, oy: -T, wall: false };
}

/** 아스팔트 덩어리 (찻길 · 횡단보도 바탕) */
function asphaltFill(p: Pix, x0: number, y0: number, w: number, h: number, base: Color): void {
  paintTiled(p, HX.ASPHALT, HX.asphaltPal(base), x0, y0, w, h);
}

/** 찻길: 위 · 아래 연석 · 가운데 흰 점선. 비 오는 날엔 젖어 번들 */
function road(W: number, H: number, L: HouseLook): RawSprite {
  const p = new Pix(W, H);
  const rp = FD.roadPal();
  asphaltFill(p, 0, 0, W, H, L.sky === 'rain' ? hex('#4c5056') : hex('#5c5e64'));
  paintTiled(p, FD.CURB, rp, 0, 0, W, 4, 0, 0);
  paintTiled(p, flipV(FD.CURB), rp, 0, H - 4, W, 4, 0, 0);
  paintTiled(p, FD.DASH, rp, 0, Math.round(H / 2 - 1), W, 2, 0, 0);
  if (L.sky === 'rain') paintTiled(p, FD.PUDDLE_STREAK, { w: hex('#7a8898') }, 0, 6, W, H - 12, 0, 0);
  return { pix: p, ox: 0, oy: -H, wall: true };
}

/** 횡단보도: 아스팔트 위 흰 줄 (군데군데 닳아 있다) */
function crosswalk(W: number, H: number, L: HouseLook): RawSprite {
  const p = new Pix(W, H);
  asphaltFill(p, 0, 0, W, H, L.sky === 'rain' ? hex('#4c5056') : hex('#5c5e64'));
  paintTiled(p, FD.ZEBRA, FD.roadPal(), 0, 2, W - 3, H - 4, 0, 0);
  return { pix: p, ox: 0, oy: -H, wall: true };
}

/** 모래밭 (격자 SANDBOX): 둥근 통나무를 둘렀다. 양동이 · 삽 · 모래성 (늘 조금은 놀다 간 자리) */
function sandbox(W: number, H: number, L: HouseLook): RawSprite {
  const p = new Pix(W, H);
  const sp = FD.sandboxPal(L.floor);
  fitInto(p, FD.SANDBOX, sp, 0, 0, W, H);
  paintGrid(p, FD.SAND_TOYS, 8, H - 18, sp);
  return { pix: p, ox: 0, oy: -H, wall: true };
}

/** 흙길 바큇자국 (격자 RUTS): 두 줄 홈, 그 사이 풀 */
function ruts(W: number, H: number, L: HouseLook): RawSprite {
  const p = new Pix(W, H);
  fitInto(p, FD.RUTS, FD.rutsPal(L.floor, L.accent), 0, 0, W, H);
  return { pix: p, ox: 0, oy: -H, wall: true };
}

/** 우물 (격자 WELL) */
function well(W: number, H: number, L: HouseLook): RawSprite {
  const T = H + 32;
  const p = new Pix(W, T);
  const wp = FD.wellPal(L.wall);
  // 기둥 둘 · 가로대 · 두레박 줄 · 두레박 · 돌 테
  for (const x of [4, W - 9]) paintTiled(p, FD.WELL_POST, wp, x, 4, 5, T - 18);
  fitInto(p, FD.WELL_BEAM, wp, 2, 2, W - 4, 5);
  paintTiled(p, ['r'], wp, Math.round(W / 2), 7, 1, 11);
  paintGrid(p, FD.BUCKET, Math.round(W / 2 - 4), 18, wp);
  fitInto(p, FD.WELL_RING, wp, 2, T - 27, W - 4, 27);
  return { pix: p.outline(), ox: 0, oy: -T, wall: false };
}

/** 초가집 앞면: 볏짚 지붕 · 흙벽 · 기둥 · 창호지 문 · 부엌 널문 · 시래기 · 소쿠리 · 툇마루 · 댓돌 위 고무신. 해 질 녘엔 문에 불빛 */
function thatch(W: number, H: number, L: HouseLook): RawSprite {
  const T = H + 24;
  const p = new Pix(W, T);
  const tp = FD.thatchPal(evening(L), L.wall);
  const wy = 34;
  paintTiled(p, FD.MUD_WALL, tp, 6, wy, W - 12, T - wy - 20, 0, 0);
  const posts = [6, Math.round(W * 0.27), Math.round(W * 0.52), Math.round(W * 0.76), W - 11];
  for (const x of posts) paintTiled(p, FD.POST, tp, x, wy, 5, T - wy - 18);
  paintTiled(p, ['w'], tp, 6, wy, W - 12, 3);
  for (let i = 0; i < 2; i++) {
    const x0 = posts[i] + 8;
    const x1 = posts[i + 1] - 3;
    fitInto(p, FD.PAPER_DOOR, tp, x0, wy + 6, x1 - x0, T - wy - 30);
  }
  const kx = posts[2] + 8;
  fitInto(p, FD.PLANK_DOOR, tp, kx, wy + 6, posts[3] - kx - 3, T - wy - 24);
  const rx = posts[3] + 8;
  paintGrid(p, FD.SIRAEGI, rx + 3, wy + 4, tp);
  paintGrid(p, FD.BASKET, rx + 8, wy + 23, tp);
  fitInto(p, FD.THATCH_ROOF, FD.thatchRoofPal(), 0, 0, W, wy + 6);
  paintTiled(p, FD.MARU, FD.marPal(), 4, T - 20, W - 8, FD.MARU.length, 0, 0);
  paintTiled(p, FD.STONE_ROW.g.slice(-8), FD.stonePal(L.wall, L.base, L.accent), 2, T - 8, W - 4, 8, 0, 0);
  paintGrid(p, FD.STEP_STONE, Math.round(W / 2 - 34), T - 12, FD.stepStonePal());
  return { pix: p.outline(), ox: 0, oy: -T, wall: true };
}

/** 돌담 한 줄 (사람 허리 높이, 격자 STONE_ROW) */
function stonewallRow(W: number, H: number, L: HouseLook): RawSprite {
  const T = H + 12;
  const p = new Pix(W, T);
  fitInto(p, FD.STONE_ROW, FD.stonePal(L.wall, L.base, L.accent), 0, 0, W, T);
  return { pix: p.outline(), ox: 0, oy: -T, wall: false };
}

/** 이정표 (격자 SIGNPOST). opt 'school': 어린이 보호구역 표지판 (격자 SCHOOL_SIGN) */
function signpost(W: number, H: number, opt: string): RawSprite {
  const T = H + 42;
  const p = new Pix(W + 16, T);
  fitInto(p, opt.includes('school') ? FD.SCHOOL_SIGN : FD.SIGNPOST, FD.signPal(), Math.floor(W / 2) + 8 - 20, 0, 40, T);
  return { pix: p.outline(), ox: -8, oy: -T, wall: false };
}

/** 리어카 (격자 CART). opt 'load': 볏짚 단 · 배추를 실었다 */
function cart(W: number, H: number, opt: string): RawSprite {
  const T = H + 12;
  const p = new Pix(W + 10, T);
  const cp = FD.cartPal();
  const ox = 10;
  // 짐 (볏짚 단 · 배추) → 손잡이 · 짐칸 · 다리 · 큰 바퀴
  if (opt.includes('load')) {
    for (let i = 0; i < 4; i++) paintGrid(p, FD.STRAW, ox + 6 + i * 8, 1 - (i % 2) * 2, cp);
    paintGrid(p, FD.CABBAGE, ox + 26, 0, cp);
    paintGrid(p, FD.CABBAGE, ox + 18, -2, cp);
  }
  paintGrid(p, FD.CART_HANDLE, 0, 11, cp);
  fitInto(p, FD.CART_BED, cp, ox + 4, 6, W - 6, 14);
  paintTiled(p, ['#M#'], cp, ox + W - 7, 20, 3, T - 20);
  paintGrid(p, FD.CART_WHEEL, Math.round(ox + W / 2 + 2 - 9), T - 16, cp);
  return { pix: p.outline(), ox: -10, oy: -T, wall: false };
}

/** 장독대: 돌 단 위에 크고 작은 옹기 항아리 (격자 CROCK_BIG · CROCK_SMALL) */
function crocks(W: number, H: number, w: number): RawSprite {
  const T = H + 16;
  const p = new Pix(W, T);
  const cp = FD.crockPal(hex('#a8a090'));
  fitInto(p, FD.CROCK_STAND, cp, 0, T - 8, W, 8);
  const n = Math.max(2, w * 2);
  const jars = Array.from({ length: n }, (_, i) => ({ x: 6 + ((W - 12) * i) / (n - 1), big: i % 2 === 0 }));
  jars.sort((a, b) => Number(a.big) - Number(b.big));
  for (const j of jars) {
    const g = j.big ? FD.CROCK_BIG : FD.CROCK_SMALL;
    const r = j.big ? 8 : 6;
    const by = j.big ? T - 16 : T - 22;
    paintGrid(p, g, Math.round(j.x - r - 2), by - r - 5, cp);
  }
  return { pix: p.outline(), ox: 0, oy: -T, wall: false };
}
