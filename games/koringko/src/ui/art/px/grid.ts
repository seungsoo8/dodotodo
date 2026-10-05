/**
 * 손으로 찍는 도트 격자 (모든 아트 공용): 글자 한 칸 = 픽셀 한 칸.
 *
 *   const TREE = ['..Gg..', '.gHHh.', 'gHHhhd', '..ww..'];
 *   const pal = { ...mat('GgHhd', hex('#6ab04a')), w: hex('#8a5a3a') };
 *   const pix = gridPix(TREE, pal);            // 외곽선까지 두른 Pix
 *   paintGrid(sprite, TREE, 4, 10, pal);       // 다른 그림 위에 한 겹 찍기 (층 합성)
 *
 * 규칙: '.' (그리고 ' ') 은 투명, 그 밖의 글자는 팔레트에 있어야 한다 (없으면 checkGrid 가 알려 준다).
 * '#' 는 따로 정하지 않으면 바로 옆 칸 색을 아주 어둡게 한 외곽선 색 (검정이 아닌 색 있는 외곽선).
 */
import { CLEAR, Pix, mix, shade, type Color } from '../paint.ts';

export type Grid = readonly string[];
export type Palette = Readonly<Record<string, Color>>;

/** 격자 폭 · 높이 (줄 폭이 다르면 오류: 틀이 어긋난 것) */
export function gridSize(g: Grid): { w: number; h: number } {
  const w = g.length ? g[0].length : 0;
  for (let i = 0; i < g.length; i++) if (g[i].length !== w) throw new Error(`격자 ${i}번 줄 폭 ${g[i].length} ≠ ${w}`);
  return { w, h: g.length };
}

/** 팔레트에 없는 글자들 (시험 · 개발용) */
export function checkGrid(g: Grid, pal: Palette): string[] {
  const bad = new Set<string>();
  for (const row of g) for (const ch of row) if (ch !== '.' && ch !== ' ' && ch !== '#' && !(ch in pal)) bad.add(ch);
  return [...bad];
}

/**
 * 한 재질의 다섯 단계 명암 → 글자 다섯 개 (밝은 쪽부터: 반짝 · 밝음 · 바탕 · 그늘 · 깊은 그늘).
 * 예: mat('GgHhd', 머리색) → G 반짝 · g 밝음 · H 바탕 · h 그늘 · d 깊은 그늘. 글자 자리에 '.' 를 두면 그 단계는 뺀다.
 * 그늘은 살짝 차갑게 (shade 가 푸른 기를 더한다), 빛은 왼쪽 위에서 온다.
 */
export function mat(letters: string, base: Color, k: { gloss?: number; light?: number; shadow?: number; deep?: number } = {}): Record<string, Color> {
  const tones = [shade(base, k.gloss ?? 0.42), shade(base, k.light ?? 0.18), base, shade(base, -(k.shadow ?? 0.2)), shade(base, -(k.deep ?? 0.4))];
  const out: Record<string, Color> = {};
  for (let i = 0; i < 5 && i < letters.length; i++) if (letters[i] !== '.') out[letters[i]] = tones[i];
  return out;
}

/** 살처럼 그늘이 따뜻한 재질: 그늘을 붉은 쪽으로 섞는다 */
export function warmMat(letters: string, base: Color, warm: Color): Record<string, Color> {
  const tones = [shade(base, 0.45), shade(base, 0.28), base, mix(base, warm, 0.22), mix(base, warm, 0.45)];
  const out: Record<string, Color> = {};
  for (let i = 0; i < 5 && i < letters.length; i++) if (letters[i] !== '.') out[letters[i]] = tones[i];
  return out;
}

/** 외곽선 색: 이웃 색을 어둡게 (검정 대신 그 재질의 가장 어두운 색) */
export function inkOf(c: Color, k = 0.68): Color {
  return shade(c, -k);
}

/**
 * 격자 한 겹을 (x0, y0) 에 찍는다. flip 이면 좌우를 뒤집어 찍는다 (x0 은 뒤집힌 그림의 왼쪽).
 * '#' 는 팔레트에 '#' 가 있으면 그 색, 없으면 왼쪽 · 위 · 오른쪽 · 아래에 먼저 칠해진 이웃의 외곽선 색.
 */
export function paintGrid(p: Pix, g: Grid, x0: number, y0: number, pal: Palette, flip = false): Pix {
  const { w } = gridSize(g);
  const inks: [number, number][] = [];
  for (let y = 0; y < g.length; y++)
    for (let x = 0; x < w; x++) {
      const ch = g[y][flip ? w - 1 - x : x];
      if (ch === '.' || ch === ' ') continue;
      if (ch === '#' && !('#' in pal)) {
        inks.push([x0 + x, y0 + y]);
        continue;
      }
      const c = pal[ch];
      if (c === undefined) throw new Error(`팔레트에 없는 글자 '${ch}'`);
      if (c !== CLEAR) p.set(x0 + x, y0 + y, c);
    }
  for (const [x, y] of inks) {
    const n = [p.get(x - 1, y), p.get(x, y - 1), p.get(x + 1, y), p.get(x, y + 1)].find((c) => c !== CLEAR);
    p.set(x, y, n === undefined ? 0x2a1c24 : inkOf(n));
  }
  return p;
}

/** 격자 하나 → 새 Pix (여백 pad 칸 · 외곽선 자동 두르기) */
export function gridPix(g: Grid, pal: Palette, opt: { pad?: number; outline?: boolean; ink?: Color } = {}): Pix {
  const pad = opt.pad ?? 1;
  const { w, h } = gridSize(g);
  const p = new Pix(w + pad * 2, h + pad * 2);
  paintGrid(p, g, pad, pad, pal);
  return opt.outline === false ? p : p.outline(opt.ink);
}

/** 여러 층을 차례로 (뒤 → 앞) 찍어 한 장으로: 몸 · 옷 · 머리처럼 갈라 그린 것을 합성 */
export function layers(w: number, h: number, ls: { g: Grid; x?: number; y?: number; pal: Palette; flip?: boolean }[], outline = true): Pix {
  const p = new Pix(w, h);
  for (const l of ls) paintGrid(p, l.g, l.x ?? 0, l.y ?? 0, l.pal, l.flip);
  return outline ? p.outline() : p;
}

/** 칠한 칸이 투명 칸과 닿은 자리에 외곽선을 두르되, 색은 이웃 색을 warm 쪽으로 섞어 어둡게 (따뜻한 색 외곽선) */
export function softOutline(p: Pix, warm: Color, k = 0.62): Pix {
  const out: [number, number, Color][] = [];
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      if (p.get(x, y) !== CLEAR) continue;
      const n = [p.get(x, y + 1), p.get(x - 1, y), p.get(x + 1, y), p.get(x, y - 1)].find((c) => c !== CLEAR);
      if (n !== undefined) out.push([x, y, mix(shade(n, -k), warm, 0.35)]);
    }
  for (const [x, y, c] of out) p.set(x, y, c);
  return p;
}
