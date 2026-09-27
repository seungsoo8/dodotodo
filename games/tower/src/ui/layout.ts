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
  /** 오른쪽 위 정보(능력치·특전) 버튼 */
  info: Rect;
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
  | { kind: 'info' }
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

/**
 * 모든 UI 는 16:9 전장 위에 떠 있다.
 * 위: 얇은 상단 바 · 오른쪽 위 작은 버튼 / 아래: 상점 한 줄 · 그 위 스킬 바
 */
export function computeLayout(width: number, fieldHeight: number, slots: number): Layout {
  const cardW = 78;
  const cardH = 46;
  const gap = 6;
  const rerollW = 44;
  const shopW = slots * cardW + (slots - 1) * gap + gap + rerollW;
  const shopX = (width - shopW) / 2;
  const shopY = fieldHeight - cardH - 8;
  const cards = Array.from({ length: slots }, (_, i) => ({ x: shopX + i * (cardW + gap), y: shopY, w: cardW, h: cardH }));

  const skillSize = 28;
  const skillGap = 6;
  const skillRow = 5 * skillSize + 4 * skillGap; // 스킬 4칸 + 트리 버튼
  const skillX = width / 2 - skillRow / 2;
  const skillY = shopY - skillSize - 8;
  const icon = (k: number) => ({ x: width - 24 - k * 22, y: 5, w: 18, h: 18 });

  return {
    width,
    height: fieldHeight,
    fieldHeight,
    cards,
    reroll: { x: shopX + slots * (cardW + gap), y: shopY, w: rerollW, h: cardH },
    mute: icon(0),
    pause: icon(1),
    speed: icon(2),
    info: icon(3),
    difficulty: DIFFICULTIES.map((d, i) => {
      const w = 124;
      const g = 10;
      const total = DIFFICULTIES.length * w + (DIFFICULTIES.length - 1) * g;
      return { id: d.id, rect: { x: (width - total) / 2 + i * (w + g), y: 220, w, h: 42 } };
    }),
    skills: Array.from({ length: 4 }, (_, i) => ({ x: skillX + i * (skillSize + skillGap), y: skillY, w: skillSize, h: skillSize })),
    treeButton: { x: skillX + 4 * (skillSize + skillGap), y: skillY, w: skillSize, h: skillSize },
    perkCards: Array.from({ length: 3 }, (_, i) => {
      const w = 132;
      const g = 12;
      const total = 3 * w + 2 * g;
      return { x: width / 2 - total / 2 + i * (w + g), y: (fieldHeight - 150) / 2 + 12, w, h: 150 };
    }),
    modes: (['classic', 'endless'] as GameMode[]).map((id, i) => {
      const w = 110;
      return { id, rect: { x: width / 2 - w + i * w, y: 180, w, h: 24 } };
    }),
    heroes: HEROES.map((h, i) => {
      const w = 100;
      const g = 10;
      const total = HEROES.length * w + (HEROES.length - 1) * g;
      return { id: h.id, rect: { x: (width - total) / 2 + i * (w + g), y: 56, w, h: 90 } };
    }),
    metaButton: { x: width / 2 - 154, y: 270, w: 148, h: 24 },
    achButton: { x: width / 2 + 6, y: 270, w: 148, h: 24 },
    metaCards: Array.from({ length: 12 }, (_, i) => {
      const w = 190;
      const h = 56;
      const g = 8;
      const x0 = (width - (3 * w + 2 * g)) / 2;
      return { x: x0 + (i % 3) * (w + g), y: 52 + Math.floor(i / 3) * (h + g), w, h };
    }),
    achRows: Array.from({ length: 14 }, (_, i) => {
      const w = 290;
      const h = 32;
      const g = 8;
      const x0 = (width - (2 * w + g)) / 2;
      return { x: x0 + (i % 2) * (w + g), y: 46 + Math.floor(i / 2) * (h + 6), w, h };
    }),
    back: { x: width / 2 - 60, y: fieldHeight - 34, w: 120, h: 24 },
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
  if (inside(layout.info, x, y)) return { kind: 'info' };
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
