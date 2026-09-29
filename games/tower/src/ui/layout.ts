import { DIFFICULTIES, type DifficultyId, type GameMode } from '../core/config.ts';
import { HEROES, type HeroId } from '../core/heroes.ts';

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
  /** 스킬 바 양옆: 탑 반시계·시계 방향 돌리기 */
  rotateLeft: Rect;
  rotateRight: Rect;
  /** 보상 카드 3장 */
  perkCards: Rect[];
  /** 시작 화면의 탑 카드 */
  heroes: { id: HeroId; rect: Rect }[];
  metaButton: Rect;
  achButton: Rect;
  /** 시작 화면: 연습 판 다시 하기 */
  lessonButton: Rect;
  /** 소리 설정 창 (♪ 버튼): 효과음·음악 막대, 끄기 */
  audio: { panel: Rect; sfx: Rect; music: Rect; mute: Rect };
  /** 연습 판 안내 창과 그 안의 버튼 */
  lessonPanel: Rect;
  lessonNext: Rect;
  lessonSkip: Rect;
  /** 강화 상점 칸 (3열) */
  metaCards: Rect[];
  /** 업적 목록 칸 (2열) */
  achRows: Rect[];
  /** 강화 상점·업적 화면의 돌아가기 */
  back: Rect;
}

export type Hit =
  | { kind: 'card'; index: number }
  | { kind: 'reroll' }
  | { kind: 'speed' }
  | { kind: 'pause' }
  | { kind: 'mute' }
  | { kind: 'info' }
  | { kind: 'skill'; index: number }
  | { kind: 'rotate'; dir: 1 | -1 };

export type StartHit =
  | { kind: 'difficulty'; id: DifficultyId }
  | { kind: 'mode'; id: GameMode }
  | { kind: 'hero'; id: HeroId }
  | { kind: 'meta' }
  | { kind: 'achievements' }
  | { kind: 'lesson' };

export type MetaHit = { kind: 'upgrade'; index: number } | { kind: 'back' };

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
  const skillRow = 4 * skillSize + 3 * skillGap;
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
    rotateLeft: { x: skillX - 14 - skillSize, y: skillY, w: skillSize, h: skillSize },
    rotateRight: { x: skillX + skillRow + 14, y: skillY, w: skillSize, h: skillSize },
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
    // 강화 상점 · 업적 · 연습 판 한 줄
    metaButton: { x: width / 2 - 200, y: 270, w: 128, h: 24 },
    achButton: { x: width / 2 - 64, y: 270, w: 128, h: 24 },
    lessonButton: { x: width / 2 + 72, y: 270, w: 128, h: 24 },
    ...lessonLayout(width),
    audio: audioLayout(width),
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
  };
}

/** 점이 칸 안에 있는가. pad 만큼 바깥까지 넉넉하게 볼 수 있다 */
export function inside(r: Rect, x: number, y: number, pad = 0): boolean {
  return x >= r.x - pad && x < r.x + r.w + pad && y >= r.y - pad && y < r.y + r.h + pad;
}

/** 작은 아이콘 버튼은 누르는 범위를 이만큼 넓힌다 (손가락으로도 눌리게) */
const ICON_PAD = 4;

/** 스킬을 떨어뜨릴 수 있는 전장인가 (위쪽 바·스킬 바·상점 위는 아님) */
export function aimableAt(layout: Layout, p: { x: number; y: number }): boolean {
  if (p.x < 0 || p.x >= layout.width || p.y < 0 || p.y >= layout.fieldHeight) return false;
  if (p.y < 28) return false;
  if (p.y >= layout.skills[0].y - 8) return false;
  return true;
}

export function hitTest(layout: Layout, x: number, y: number): Hit | null {
  const index = layout.cards.findIndex((c) => inside(c, x, y));
  if (index >= 0) return { kind: 'card', index };
  if (inside(layout.reroll, x, y)) return { kind: 'reroll' };
  // 가운데에 가장 가까운 작은 버튼 (넉넉한 범위가 이웃과 겹쳐도 헷갈리지 않게)
  const icons = (['info', 'speed', 'pause', 'mute'] as const).filter((k) => inside(layout[k], x, y, ICON_PAD));
  if (icons.length) {
    const dist = (k: (typeof icons)[number]) => Math.abs(x - (layout[k].x + layout[k].w / 2));
    return { kind: icons.reduce((a, b) => (dist(b) < dist(a) ? b : a)) };
  }
  const skill = layout.skills.findIndex((r) => inside(r, x, y));
  if (skill >= 0) return { kind: 'skill', index: skill };
  if (inside(layout.rotateLeft, x, y)) return { kind: 'rotate', dir: -1 };
  if (inside(layout.rotateRight, x, y)) return { kind: 'rotate', dir: 1 };
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
  if (inside(layout.lessonButton, x, y)) return { kind: 'lesson' };
  return null;
}

/** 연습 판 안내 창에서 누른 것 (창 안 빈 곳은 'panel': 아래 전장으로 새지 않게) */
export function hitTestLesson(layout: Layout, x: number, y: number): 'next' | 'skip' | 'panel' | null {
  if (inside(layout.lessonNext, x, y, 2)) return 'next';
  if (inside(layout.lessonSkip, x, y, 2)) return 'skip';
  return inside(layout.lessonPanel, x, y) ? 'panel' : null;
}

function audioLayout(width: number): Layout['audio'] {
  const panel = { x: width - 176, y: 28, w: 168, h: 66 };
  const track = (y: number) => ({ x: panel.x + 50, y, w: 104, h: 10 });
  return { panel, sfx: track(panel.y + 8), music: track(panel.y + 26), mute: { x: panel.x + 10, y: panel.y + 44, w: 148, h: 16 } };
}

/** 막대 위 x 위치 → 0~1 */
export function sliderValue(track: Rect, x: number): number {
  return Math.max(0, Math.min(1, (x - track.x) / track.w));
}

export type AudioHit = { kind: 'sfx' | 'music'; value: number } | { kind: 'mute' } | { kind: 'panel' };

/** 소리 설정 창에서 누른 것 (막대는 위아래로 넉넉하게) */
export function hitTestAudio(layout: Layout, x: number, y: number): AudioHit | null {
  const a = layout.audio;
  const onTrack = (r: Rect) => x >= r.x - 6 && x <= r.x + r.w + 6 && y >= r.y - 4 && y <= r.y + r.h + 4;
  if (onTrack(a.sfx)) return { kind: 'sfx', value: sliderValue(a.sfx, x) };
  if (onTrack(a.music)) return { kind: 'music', value: sliderValue(a.music, x) };
  if (inside(a.mute, x, y)) return { kind: 'mute' };
  return inside(a.panel, x, y) ? { kind: 'panel' } : null;
}

function lessonLayout(width: number): Pick<Layout, 'lessonPanel' | 'lessonNext' | 'lessonSkip'> {
  const panel = { x: (width - 420) / 2, y: 32, w: 420, h: 62 };
  const next = { x: panel.x + panel.w - 74, y: panel.y + panel.h - 21, w: 64, h: 15 };
  return { lessonPanel: panel, lessonNext: next, lessonSkip: { ...next, x: next.x - 72 } };
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
