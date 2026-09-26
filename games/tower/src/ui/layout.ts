import { DIFFICULTIES, type DifficultyId, type GameMode } from '../core/config.ts';
import { HEROES, type HeroId } from '../core/heroes.ts';
import { BASE_SKILLS } from '../core/skills.ts';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Layout {
  width: number;
  height: number;
  /** 전장 높이 (그 아래가 상점) */
  fieldHeight: number;
  cards: Rect[];
  reroll: Rect;
  speed: Rect;
  pause: Rect;
  /** 소리 켜기/끄기 (전장 오른쪽 위) */
  mute: Rect;
  /** 시작 화면의 난이도 버튼 */
  difficulty: { id: DifficultyId; rect: Rect }[];
  /** 시작 화면의 모드 탭 */
  modes: { id: GameMode; rect: Rect }[];
  /** 스킬 버튼 (전장 아래쪽 가운데) */
  skills: Rect[];
  /** 보상 카드 3장 */
  perkCards: Rect[];
  /** 시작 화면의 탑 카드 */
  heroes: { id: HeroId; rect: Rect }[];
  metaButton: Rect;
  achButton: Rect;
  /** 강화 상점 칸 (3열) */
  metaCards: Rect[];
  /** 업적 목록 칸 (2열) */
  achRows: Rect[];
  /** 강화 상점·업적 화면의 돌아가기 */
  back: Rect;
  /** 스킬 바 옆 스킬 트리 버튼 */
  treeButton: Rect;
  /** 스킬 트리 화면: 기본 · 진화 · 합체 칸, 설명 칸, 닫기 */
  tree: {
    base: { id: string; rect: Rect }[];
    evolve: { id: string; rect: Rect }[];
    fused: { id: string; rect: Rect }[];
    detail: Rect;
    close: Rect;
  };
}

export type Hit =
  | { kind: 'card'; index: number }
  | { kind: 'reroll' }
  | { kind: 'speed' }
  | { kind: 'pause' }
  | { kind: 'mute' }
  | { kind: 'skill'; index: number }
  | { kind: 'tree' };

export type StartHit =
  | { kind: 'difficulty'; id: DifficultyId }
  | { kind: 'mode'; id: GameMode }
  | { kind: 'hero'; id: HeroId }
  | { kind: 'meta' }
  | { kind: 'achievements' };

export type MetaHit = { kind: 'upgrade'; index: number } | { kind: 'back' };

export type TreeHit = { kind: 'learn' | 'evolve' | 'fuse'; id: string } | { kind: 'close' };

/** 합체 칸 자리: 줄(0·1)과 기본 스킬 열 번호 기준 가로 위치 */
const FUSION_SPOTS: Record<string, [number, number]> = {
  comet: [0, 0.5],
  ice_wall: [0, 1.5],
  alchemy: [0, 2.5],
  tempest: [0, 4.5],
  golden_meteor: [1, 1.0],
  judgement: [1, 2.3],
  frost_gale: [1, 3.6],
};

function treeLayout(width: number, fieldHeight: number): Layout['tree'] {
  const colW = 92;
  const gap = 10;
  const x0 = (width - (BASE_SKILLS.length * colW + (BASE_SKILLS.length - 1) * gap)) / 2;
  const center = (col: number) => x0 + col * (colW + gap) + colW / 2;
  const fw = 84;
  return {
    base: BASE_SKILLS.map((k, i) => ({ id: k.id, rect: { x: x0 + i * (colW + gap), y: 42, w: colW, h: 38 } })),
    evolve: BASE_SKILLS.map((k, i) => ({ id: k.id, rect: { x: x0 + i * (colW + gap), y: 92, w: colW, h: 30 } })),
    fused: Object.entries(FUSION_SPOTS).map(([id, [row, col]]) => ({
      id,
      rect: { x: center(col) - fw / 2, y: 150 + row * 52, w: fw, h: 38 },
    })),
    detail: { x: x0, y: 252, w: width - x0 * 2, h: 50 },
    close: { x: width / 2 - 60, y: fieldHeight - 44, w: 120, h: 24 },
  };
}

const PANEL_HEIGHT = 80;
const PAD = 6;
const BUTTON_COLUMN = 120;

export function computeLayout(width: number, fieldHeight: number, slots: number): Layout {
  const top = fieldHeight + PAD;
  const innerH = PANEL_HEIGHT - PAD * 2;
  const cardsWidth = width - BUTTON_COLUMN - PAD * 2;
  const cardW = (cardsWidth - PAD * (slots - 1)) / slots;
  const cards = Array.from({ length: slots }, (_, i) => ({ x: PAD + i * (cardW + PAD), y: top, w: cardW, h: innerH }));

  const bx = width - BUTTON_COLUMN;
  const bw = BUTTON_COLUMN - PAD;
  const half = (innerH - PAD) / 2;
  const smallW = (bw - PAD) / 2;
  return {
    width,
    height: fieldHeight + PANEL_HEIGHT,
    fieldHeight,
    cards,
    reroll: { x: bx, y: top, w: bw, h: half },
    speed: { x: bx, y: top + half + PAD, w: smallW, h: half },
    pause: { x: bx + smallW + PAD, y: top + half + PAD, w: smallW, h: half },
    mute: { x: width - 26, y: 4, w: 20, h: 16 },
    difficulty: DIFFICULTIES.map((d, i) => {
      const w = 130;
      const gap = 14;
      const total = DIFFICULTIES.length * w + (DIFFICULTIES.length - 1) * gap;
      return { id: d.id, rect: { x: (width - total) / 2 + i * (w + gap), y: 216, w, h: 44 } };
    }),
    skills: Array.from({ length: 4 }, (_, i) => {
      const w = 30;
      const gap = 6;
      const total = 4 * w + 3 * gap;
      return { x: width / 2 - total / 2 + i * (w + gap), y: fieldHeight - 36, w, h: 30 };
    }),
    perkCards: Array.from({ length: 3 }, (_, i) => {
      const w = 150;
      const gap = 14;
      const total = 3 * w + 2 * gap;
      return { x: width / 2 - total / 2 + i * (w + gap), y: (fieldHeight - 150) / 2 + 10, w, h: 150 };
    }),
    modes: (['classic', 'endless'] as GameMode[]).map((id, i) => {
      const w = 120;
      const gap = 10;
      return { id, rect: { x: width / 2 - w - gap / 2 + i * (w + gap), y: 182, w, h: 26 } };
    }),
    heroes: HEROES.map((h, i) => {
      const w = 112;
      const gap = 8;
      const total = HEROES.length * w + (HEROES.length - 1) * gap;
      return { id: h.id, rect: { x: (width - total) / 2 + i * (w + gap), y: 46, w, h: 96 } };
    }),
    metaButton: { x: width / 2 - 176, y: 270, w: 170, h: 24 },
    achButton: { x: width / 2 + 6, y: 270, w: 170, h: 24 },
    metaCards: Array.from({ length: 12 }, (_, i) => {
      const w = 196;
      const h = 60;
      const gap = 8;
      const x0 = (width - (3 * w + 2 * gap)) / 2;
      return { x: x0 + (i % 3) * (w + gap), y: 56 + Math.floor(i / 3) * (h + gap), w, h };
    }),
    achRows: Array.from({ length: 14 }, (_, i) => {
      const w = 300;
      const h = 34;
      const gap = 6;
      const x0 = (width - (2 * w + gap)) / 2;
      return { x: x0 + (i % 2) * (w + gap), y: 40 + Math.floor(i / 2) * (h + 5), w, h };
    }),
    back: { x: width / 2 - 70, y: fieldHeight + 20, w: 140, h: 28 },
    treeButton: { x: width / 2 + 75, y: fieldHeight - 36, w: 44, h: 30 },
    tree: treeLayout(width, fieldHeight),
  };
}

function inside(r: Rect, x: number, y: number): boolean {
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}

export function hitTest(layout: Layout, x: number, y: number): Hit | null {
  const index = layout.cards.findIndex((c) => inside(c, x, y));
  if (index >= 0) return { kind: 'card', index };
  if (inside(layout.reroll, x, y)) return { kind: 'reroll' };
  if (inside(layout.speed, x, y)) return { kind: 'speed' };
  if (inside(layout.pause, x, y)) return { kind: 'pause' };
  if (inside(layout.mute, x, y)) return { kind: 'mute' };
  const skill = layout.skills.findIndex((r) => inside(r, x, y));
  if (skill >= 0) return { kind: 'skill', index: skill };
  if (inside(layout.treeButton, x, y)) return { kind: 'tree' };
  return null;
}

/** 보상 카드 선택 화면에서 누른 카드 번호 */
export function hitTestChoice(layout: Layout, x: number, y: number): number | null {
  const i = layout.perkCards.findIndex((r) => inside(r, x, y));
  return i >= 0 ? i : null;
}

export function hitTestStart(layout: Layout, x: number, y: number): StartHit | null {
  const d = layout.difficulty.find((b) => inside(b.rect, x, y));
  if (d) return { kind: 'difficulty', id: d.id };
  const m = layout.modes.find((b) => inside(b.rect, x, y));
  if (m) return { kind: 'mode', id: m.id };
  const h = layout.heroes.find((b) => inside(b.rect, x, y));
  if (h) return { kind: 'hero', id: h.id };
  if (inside(layout.metaButton, x, y)) return { kind: 'meta' };
  if (inside(layout.achButton, x, y)) return { kind: 'achievements' };
  return null;
}

/** 스킬 트리 화면에서 누른 칸 */
export function hitTestTree(layout: Layout, x: number, y: number): TreeHit | null {
  const t = layout.tree;
  const b = t.base.find((n) => inside(n.rect, x, y));
  if (b) return { kind: 'learn', id: b.id };
  const e = t.evolve.find((n) => inside(n.rect, x, y));
  if (e) return { kind: 'evolve', id: e.id };
  const f = t.fused.find((n) => inside(n.rect, x, y));
  if (f) return { kind: 'fuse', id: f.id };
  return inside(t.close, x, y) ? { kind: 'close' } : null;
}

/** 강화 상점 화면에서 누른 것 */
export function hitTestMeta(layout: Layout, x: number, y: number): MetaHit | null {
  const i = layout.metaCards.findIndex((r) => inside(r, x, y));
  if (i >= 0) return { kind: 'upgrade', index: i };
  return inside(layout.back, x, y) ? { kind: 'back' } : null;
}

/** 비율을 유지하며 (availW × availH) 안에 들어가는 가장 큰 배율 */
export function fitScale(w: number, h: number, availW: number, availH: number): number {
  return Math.min(availW / w, availH / h);
}

/** 브라우저 좌표 → 게임 좌표 */
export function toLogical(
  rect: { left: number; top: number; width: number; height: number },
  w: number,
  h: number,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  return {
    x: ((clientX - rect.left) / rect.width) * w,
    y: ((clientY - rect.top) / rect.height) * h,
  };
}
