import { DIFFICULTIES, type DifficultyId, type GameMode } from '../core/config.ts';
import type { Face } from '../core/faces.ts';
import { HEROES, type HeroId } from '../core/heroes.ts';

/** 전장(게임 세계) 크기. 규칙은 이 크기로 돈다 */
export const WORLD_W = 640;
export const WORLD_H = 360;

/** 화면 크기(CSS 픽셀) → 게임 화면 크기(논리 픽셀). 비율에 맞춰 늘리고, 너무 넓거나 길면 멈춘다 */
export function computeView(vw: number, vh: number): { width: number; height: number } {
  const aspect = vw / Math.max(1, vh);
  if (aspect >= 1) {
    if (aspect >= WORLD_W / WORLD_H) return { width: Math.min(960, Math.round(WORLD_H * aspect)), height: WORLD_H };
    return { width: WORLD_W, height: Math.round(WORLD_W / aspect) };
  }
  return { width: 360, height: Math.max(560, Math.min(820, Math.round(360 / aspect))) };
}

/** 전장 좌표 → 화면 좌표: 화면 = 전장 × s + (x, y) */
export interface Camera {
  x: number;
  y: number;
  s: number;
}

/** 메뉴 글자 자리 (가로는 640×360 상자 안, 세로는 화면 그대로) */
export interface MenuText {
  titleX: number;
  titleY: number;
  /** 제목을 가운데 정렬 (세로) · 부제는 제목 아래 */
  titleCenter: boolean;
  quoteY: number;
  descY: number;
  modeHintY: number;
  promptY: number;
  tipY: number;
  /** 키보드 조작 안내 줄 (세로·터치에서는 숨김) */
  footY: number | null;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Layout {
  /** 게임 화면 크기 (논리 픽셀) */
  width: number;
  height: number;
  /** 세로 화면 배치 */
  portrait: boolean;
  /** 전장을 그리는 화면 칸과 카메라 */
  field: Rect;
  cam: Camera;
  /** 전장 칸 아래 끝 (세로에서는 그 아래가 버튼 칸) */
  fieldHeight: number;
  /** 메뉴 화면을 그리는 상자 (가로: 가운데 640×360, 세로: 화면 전체). 메뉴 칸 좌표는 이 상자 기준 */
  menu: Rect;
  menuText: MenuText;
  /** 위쪽 바: 라운드 · 남은 적 · 골드 · 체력 */
  hud: { round: Rect; enemies: Rect; gold: Rect; hp: Rect };
  /** 면 고르기 버튼 (십자 모양) */
  facePad: Record<Face, Rect>;
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
  /** 궁극기 버튼 (스킬 줄 오른쪽 끝, 게이지가 둘레에 찬다) */
  ult: Rect;
  /** 보상 카드 3장 */
  perkCards: Rect[];
  /** 시작 화면의 탑 카드 */
  heroes: { id: HeroId; rect: Rect }[];
  /** 시작 화면: 이야기 책 */
  storyButton: Rect;
  metaButton: Rect;
  achButton: Rect;
  /** 판 도중 소리 창 (♪ 버튼): 효과음·음악 막대, 끄기 */
  audio: AudioPanel;
  /** 메뉴 오른쪽 위 ⚙ 와 그 설정 창 (소리 + 튜토리얼 다시 하기 · 초기화) */
  gear: Rect;
  menuAudio: AudioPanel;
  /** 일시정지 창: 계속하기 · 포기하기 */
  pausePanel: Rect;
  pauseResume: Rect;
  pauseGiveUp: Rect;
  /** 연습 판 안내 창과 그 안의 버튼 */
  lessonPanel: Rect;
  lessonNext: Rect;
  lessonSkip: Rect;
  /** 강화 상점 칸 (3열) */
  metaCards: Rect[];
  /** 업적 목록 칸 (2열) */
  achRows: Rect[];
  /** 이야기 화면: 왼쪽 목록(12쪽)과 오른쪽 본문 */
  storyTabs: Rect[];
  storyText: Rect;
  /** 판 위에 뜨는 이야기 카드(서장·결말)와 건너뛰기 */
  storyCard: Rect;
  storyCardSkip: Rect;
  /** 강화 상점·업적 화면의 돌아가기 */
  back: Rect;
}

export interface AudioPanel {
  panel: Rect;
  sfx: Rect;
  music: Rect;
  mute: Rect;
  lesson?: Rect;
  reset?: Rect;
}

export type Hit =
  | { kind: 'card'; index: number }
  | { kind: 'reroll' }
  | { kind: 'speed' }
  | { kind: 'pause' }
  | { kind: 'mute' }
  | { kind: 'info' }
  | { kind: 'skill'; index: number }
  | { kind: 'rotate'; dir: 1 | -1 }
  | { kind: 'ult' }
  | { kind: 'face'; face: Face };

export type StartHit =
  | { kind: 'difficulty'; id: DifficultyId }
  | { kind: 'mode'; id: GameMode }
  | { kind: 'hero'; id: HeroId }
  | { kind: 'meta' }
  | { kind: 'achievements' }
  | { kind: 'story' }
  | { kind: 'settings' };

export type MetaHit = { kind: 'upgrade'; index: number } | { kind: 'back' };
export type StoryHit = { kind: 'page'; index: number } | { kind: 'back' };

/** 가로·세로에 맞는 배치. width·height 는 computeView 가 준 게임 화면 크기 */
export function computeLayout(width: number, height: number, slots: number): Layout {
  return height > width ? portraitLayout(width, height, slots) : landscapeLayout(width, height, slots);
}

const PERK_H = 150;

/** 메뉴 칸들 (가로: 640×360 상자 기준) */
function landscapeMenu(): Pick<
  Layout,
  'heroes' | 'modes' | 'difficulty' | 'storyButton' | 'metaButton' | 'achButton' | 'gear' | 'menuAudio' | 'metaCards' | 'achRows' | 'storyTabs' | 'storyText' | 'back' | 'menuText'
> {
  const width = WORLD_W;
  const height = WORLD_H;
  const modes = (['classic', 'endless'] as GameMode[]).map((id, i) => ({ id, rect: { x: width / 2 - 110 + i * 110, y: 180, w: 110, h: 24 } }));
  const tabW = 170;
  return {
    heroes: HEROES.map((h, i) => {
      const w = 100;
      const g = 10;
      const total = HEROES.length * w + (HEROES.length - 1) * g;
      return { id: h.id, rect: { x: (width - total) / 2 + i * (w + g), y: 56, w, h: 90 } };
    }),
    modes,
    difficulty: DIFFICULTIES.map((d, i) => {
      const w = 124;
      const g = 10;
      const total = DIFFICULTIES.length * w + (DIFFICULTIES.length - 1) * g;
      return { id: d.id, rect: { x: (width - total) / 2 + i * (w + g), y: 220, w, h: 42 } };
    }),
    ...buttonRow(width, 128, 270, 24),
    gear: { x: width - 30, y: 16, w: 20, h: 20 },
    menuAudio: audioLayout(width, 42, true),
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
    storyTabs: Array.from({ length: 12 }, (_, i) => ({ x: 16, y: 44 + i * 23, w: tabW, h: 20 })),
    storyText: { x: 16 + tabW + 10, y: 44, w: width - 32 - tabW - 10, h: height - 44 - 44 },
    back: { x: width / 2 - 60, y: height - 34, w: 120, h: 24 },
    menuText: { titleX: 24, titleY: 28, titleCenter: false, quoteY: 158, descY: 170, modeHintY: 210, promptY: 306, tipY: 320, footY: height - 30 },
  };
}

/** 가로: 전장이 화면 전체, 위쪽 바는 왼쪽 위, 작은 버튼은 오른쪽 위, 상점·스킬은 아래 가운데, 면 고르기는 왼쪽 아래 */
function landscapeLayout(width: number, height: number, slots: number): Layout {
  const cardW = 78;
  const cardH = 46;
  const gap = 6;
  const rerollW = 44;
  const shopW = slots * cardW + (slots - 1) * gap + gap + rerollW;
  const shopX = (width - shopW) / 2;
  const shopY = height - cardH - 8;
  const skillSize = 28;
  const skillGap = 6;
  const skillRow = 4 * skillSize + 3 * skillGap;
  const skillX = width / 2 - skillRow / 2;
  const skillY = shopY - skillSize - 8;
  const icon = (k: number) => ({ x: width - 24 - k * 22, y: 5, w: 18, h: 18 });
  const cell = 26;
  const padX = 8;
  const padY = height - 8 - 3 * cell - 4;
  const perkW = 132;
  const perkG = 12;
  const card = { x: (width - 440) / 2, y: (height - 190) / 2 - 15, w: 440, h: 190 };
  return {
    width,
    height,
    portrait: false,
    field: { x: 0, y: 0, w: width, h: height },
    cam: { x: (width - WORLD_W) / 2, y: (height - WORLD_H) / 2, s: 1 },
    fieldHeight: height,
    menu: { x: (width - WORLD_W) / 2, y: (height - WORLD_H) / 2, w: WORLD_W, h: WORLD_H },
    hud: { round: { x: 6, y: 5, w: 112, h: 20 }, enemies: { x: 122, y: 5, w: 40, h: 20 }, gold: { x: 166, y: 5, w: 84, h: 20 }, hp: { x: 254, y: 5, w: 150, h: 20 } },
    facePad: compass(padX, padY, cell, 2),
    cards: Array.from({ length: slots }, (_, i) => ({ x: shopX + i * (cardW + gap), y: shopY, w: cardW, h: cardH })),
    reroll: { x: shopX + slots * (cardW + gap), y: shopY, w: rerollW, h: cardH },
    mute: icon(0),
    pause: icon(1),
    speed: icon(2),
    info: icon(3),
    skills: Array.from({ length: 4 }, (_, i) => ({ x: skillX + i * (skillSize + skillGap), y: skillY, w: skillSize, h: skillSize })),
    rotateLeft: { x: skillX - 14 - skillSize, y: skillY, w: skillSize, h: skillSize },
    rotateRight: { x: skillX + skillRow + 14, y: skillY, w: skillSize, h: skillSize },
    ult: { x: skillX + skillRow + 14 + skillSize + 12, y: skillY - 3, w: skillSize + 6, h: skillSize + 6 },
    perkCards: Array.from({ length: 3 }, (_, i) => ({ x: width / 2 - (3 * perkW + 2 * perkG) / 2 + i * (perkW + perkG), y: (height - PERK_H) / 2 + 12, w: perkW, h: PERK_H })),
    storyCard: card,
    storyCardSkip: { x: card.x + 10, y: card.y + card.h - 24, w: 72, h: 16 },
    ...lessonLayout(width, 420, 32, 62),
    ...pauseLayout(width, height),
    audio: audioLayout(width, 28, false),
    ...landscapeMenu(),
  };
}

/** 세로: 위쪽 바 두 줄 · 전장(좌우 조금 잘림) · 아래에 큰 버튼 (스킬 줄, 면 고르기 십자 + 상점 2×2) */
function portraitLayout(width: number, height: number, slots: number): Layout {
  const top = 48;
  const blockH = 190;
  const blockTop = height - blockH;
  const s = Math.max(0.75, Math.min(0.9, (blockTop - top) / WORLD_H));
  const cam = { x: width / 2 - (WORLD_W / 2) * s, y: top + Math.max(0, (blockTop - top - WORLD_H * s) / 2), s };
  const icon = (k: number) => ({ x: width - 24 - k * 22, y: 5, w: 18, h: 18 });

  // 버튼 칸
  const y0 = blockTop + 6;
  const btn = 32;
  const btnGap = 8;
  const rowW = 6 * btn + 5 * btnGap;
  const bx = (width - rowW) / 2;
  const at = (i: number) => ({ x: bx + i * (btn + btnGap), y: y0, w: btn, h: btn });
  const y1 = y0 + btn + 10;
  const cell = 30;
  const shopX = 8 + 3 * cell + 2 * 3 + 8;
  const shopW = width - 8 - shopX;
  const cardW = (shopW - 6) / 2;
  const cardH = 46;
  const cols = 2;
  const cards = Array.from({ length: slots }, (_, i) => ({ x: shopX + (i % cols) * (cardW + 6), y: y1 + Math.floor(i / cols) * (cardH + 6), w: cardW, h: cardH }));
  const rerollY = y1 + Math.ceil(slots / cols) * (cardH + 6);

  // 보상 카드 · 이야기 카드
  const perkW = 108;
  const perkH = 170;
  const card = { x: 10, y: (height - 300) / 2, w: width - 20, h: 300 };

  // 메뉴: 폭은 화면 그대로, 긴 화면에서는 세로 가운데 상자
  const MH = Math.min(height, 620);
  const heroW = 108;
  const heroRow = (i: number) => (i < 3 ? { x: 10 + i * (heroW + 8), y: 58 } : { x: 10 + (heroW + 8) / 2 + (i - 3) * (heroW + 8), y: 154 });
  const listW = width - 16;
  return {
    width,
    height,
    portrait: true,
    field: { x: 0, y: 0, w: width, h: blockTop },
    cam,
    fieldHeight: blockTop,
    menu: { x: 0, y: Math.floor((height - MH) / 2), w: width, h: MH },
    hud: { round: { x: 6, y: 5, w: 112, h: 20 }, enemies: { x: 122, y: 5, w: 40, h: 20 }, gold: { x: 166, y: 5, w: 84, h: 20 }, hp: { x: 6, y: 28, w: width - 12, h: 16 } },
    facePad: compass(8, y1, cell, 3),
    cards,
    reroll: { x: shopX, y: rerollY, w: shopW, h: 28 },
    mute: icon(0),
    pause: icon(1),
    speed: icon(2),
    info: icon(3),
    rotateLeft: at(0),
    skills: [1, 2, 3, 4].map(at),
    rotateRight: at(5),
    ult: at(6),
    perkCards: Array.from({ length: 3 }, (_, i) => ({ x: (width - (3 * perkW + 16)) / 2 + i * (perkW + 8), y: (height - perkH) / 2, w: perkW, h: perkH })),
    storyCard: card,
    storyCardSkip: { x: card.x + 10, y: card.y + card.h - 24, w: 72, h: 16 },
    ...lessonLayout(width, width - 16, 52, 74),
    ...pauseLayout(width, height),
    audio: audioLayout(width, 48, false),
    heroes: HEROES.map((h, i) => ({ id: h.id, rect: { ...heroRow(i), w: heroW, h: 90 } })),
    modes: (['classic', 'endless'] as GameMode[]).map((id, i) => ({ id, rect: { x: width / 2 - 110 + i * 110, y: 290, w: 110, h: 24 } })),
    difficulty: DIFFICULTIES.map((d, i) => ({ id: d.id, rect: { x: (width - 300) / 2, y: 336 + i * 44, w: 300, h: 38 } })),
    ...buttonRow(width, 110, 474, 26),
    gear: { x: width - 30, y: 16, w: 20, h: 20 },
    menuAudio: audioLayout(width, 42, true),
    metaCards: Array.from({ length: 12 }, (_, i) => ({ x: 8 + (i % 2) * ((listW - 8) / 2 + 8), y: 58 + Math.floor(i / 2) * 62, w: (listW - 8) / 2, h: 56 })),
    achRows: Array.from({ length: 14 }, (_, i) => ({ x: 8, y: 58 + i * 31, w: listW, h: 28 })),
    storyTabs: Array.from({ length: 12 }, (_, i) => ({ x: 8 + (i % 2) * ((listW - 8) / 2 + 8), y: 58 + Math.floor(i / 2) * 24, w: (listW - 8) / 2, h: 20 })),
    storyText: { x: 8, y: 206, w: listW, h: MH - 34 - 8 - 206 },
    back: { x: width / 2 - 60, y: MH - 34, w: 120, h: 24 },
    menuText: { titleX: width / 2, titleY: 26, titleCenter: true, quoteY: 256, descY: 270, modeHintY: 320, promptY: 514, tipY: 530, footY: null },
  };
}

/** 십자 모양 면 고르기 버튼 (왼쪽 위 모서리 x, y) */
function compass(x: number, y: number, cell: number, gap: number): Record<Face, Rect> {
  const c = (col: number, row: number) => ({ x: x + col * (cell + gap), y: y + row * (cell + gap), w: cell, h: cell });
  return { n: c(1, 0), w: c(0, 1), e: c(2, 1), s: c(1, 2) };
}

/** 전장 좌표 → 화면 좌표 */
export function toScreen(layout: Layout, p: { x: number; y: number }): { x: number; y: number } {
  const { x, y, s } = layout.cam;
  return { x: p.x * s + x, y: p.y * s + y };
}

/** 화면 좌표 → 전장 좌표 */
export function toWorld(layout: Layout, p: { x: number; y: number }): { x: number; y: number } {
  const { x, y, s } = layout.cam;
  return { x: (p.x - x) / s, y: (p.y - y) / s };
}

/** 화면 좌표 → 메뉴 상자 좌표 */
export function toMenu(layout: Layout, p: { x: number; y: number }): { x: number; y: number } {
  return { x: p.x - layout.menu.x, y: p.y - layout.menu.y };
}

/** 화면에 보이는 전장 범위 (전장 좌표). area 를 주지 않으면 전장 칸 */
export function visibleWorld(layout: Layout, area: Rect = layout.field): Rect {
  const a = toWorld(layout, { x: area.x, y: area.y });
  const b = toWorld(layout, { x: area.x + area.w, y: area.y + area.h });
  return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
}

/** 점이 칸 안에 있는가. pad 만큼 바깥까지 넉넉하게 볼 수 있다 */
export function inside(r: Rect, x: number, y: number, pad = 0): boolean {
  return x >= r.x - pad && x < r.x + r.w + pad && y >= r.y - pad && y < r.y + r.h + pad;
}

/** 작은 아이콘 버튼은 누르는 범위를 이만큼 넓힌다 (손가락으로도 눌리게) */
const ICON_PAD = 4;

/** 위쪽 바 아래 끝 */
function hudBottom(layout: Layout): number {
  return layout.hud.hp.y + layout.hud.hp.h + 3;
}

/** 면 고르기 십자를 감싸는 상자 */
function padBox(layout: Layout): Rect {
  const { n, s, w, e } = layout.facePad;
  return { x: w.x, y: n.y, w: e.x + e.w - w.x, h: s.y + s.h - n.y };
}

/** 스킬을 떨어뜨릴 수 있는 전장인가 (위쪽 바·스킬 바·상점·면 고르기 위는 아님). p 는 화면 좌표 */
export function aimableAt(layout: Layout, p: { x: number; y: number }): boolean {
  if (p.x < 0 || p.x >= layout.width || p.y < 0 || p.y >= layout.fieldHeight) return false;
  if (p.y < hudBottom(layout)) return false;
  if (!layout.portrait) {
    if (p.y >= layout.skills[0].y - 8) return false;
    if (inside(padBox(layout), p.x, p.y, 4)) return false;
  }
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
  if (inside(layout.ult, x, y)) return { kind: 'ult' };
  for (const face of ['n', 'e', 's', 'w'] as Face[]) if (inside(layout.facePad[face], x, y, 1)) return { kind: 'face', face };
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
  if (inside(layout.storyButton, x, y)) return { kind: 'story' };
  if (inside(layout.metaButton, x, y)) return { kind: 'meta' };
  if (inside(layout.achButton, x, y)) return { kind: 'achievements' };
  if (inside(layout.gear, x, y, 3)) return { kind: 'settings' };
  return null;
}

/** 연습 판 안내 창에서 누른 것 (창 안 빈 곳은 'panel': 아래 전장으로 새지 않게) */
export function hitTestLesson(layout: Layout, x: number, y: number): 'next' | 'skip' | 'panel' | null {
  if (inside(layout.lessonNext, x, y, 2)) return 'next';
  if (inside(layout.lessonSkip, x, y, 2)) return 'skip';
  return inside(layout.lessonPanel, x, y) ? 'panel' : null;
}

function audioLayout(width: number, top: number, menu: boolean): AudioPanel {
  const panel = { x: width - 176, y: top, w: 168, h: menu ? 106 : 66 };
  const track = (y: number) => ({ x: panel.x + 50, y, w: 104, h: 10 });
  const row = (y: number) => ({ x: panel.x + 10, y: panel.y + y, w: 148, h: 16 });
  const base = { panel, sfx: track(panel.y + 8), music: track(panel.y + 26), mute: row(44) };
  return menu ? { ...base, lesson: row(64), reset: row(84) } : base;
}

/** 막대 위 x 위치 → 0~1 */
export function sliderValue(track: Rect, x: number): number {
  return Math.max(0, Math.min(1, (x - track.x) / track.w));
}

export type AudioHit =
  | { kind: 'sfx' | 'music'; value: number }
  | { kind: 'mute' }
  | { kind: 'lesson' }
  | { kind: 'reset' }
  | { kind: 'panel' };

/** 소리(설정) 창에서 누른 것 (막대는 위아래로 넉넉하게). which: 판 도중 ♪ 창 / 메뉴 ⚙ 창 */
export function hitTestAudio(layout: Layout, x: number, y: number, which: 'audio' | 'menuAudio' = 'audio'): AudioHit | null {
  const a = layout[which];
  const onTrack = (r: Rect) => x >= r.x - 6 && x <= r.x + r.w + 6 && y >= r.y - 4 && y <= r.y + r.h + 4;
  if (onTrack(a.sfx)) return { kind: 'sfx', value: sliderValue(a.sfx, x) };
  if (onTrack(a.music)) return { kind: 'music', value: sliderValue(a.music, x) };
  if (inside(a.mute, x, y)) return { kind: 'mute' };
  if (a.lesson && inside(a.lesson, x, y)) return { kind: 'lesson' };
  if (a.reset && inside(a.reset, x, y)) return { kind: 'reset' };
  return inside(a.panel, x, y) ? { kind: 'panel' } : null;
}

/** 메뉴 아래 줄 버튼 셋: 이야기 · 강화 상점 · 업적 */
function buttonRow(width: number, w: number, y: number, h: number): Pick<Layout, 'storyButton' | 'metaButton' | 'achButton'> {
  const g = (width - 3 * w) / 2 > 16 ? 8 : 6;
  const x0 = width / 2 - (3 * w + 2 * g) / 2;
  const at = (i: number) => ({ x: x0 + i * (w + g), y, w, h });
  return { storyButton: at(0), metaButton: at(1), achButton: at(2) };
}

/** 이야기 화면에서 누른 것 */
export function hitTestStory(layout: Layout, x: number, y: number): StoryHit | null {
  const i = layout.storyTabs.findIndex((r) => inside(r, x, y));
  if (i >= 0) return { kind: 'page', index: i };
  return inside(layout.back, x, y) ? { kind: 'back' } : null;
}

/** 판 위 이야기 카드: 건너뛰기 말고는 어디를 눌러도 다음 */
export function hitTestStoryCard(layout: Layout, x: number, y: number): 'skip' | 'next' {
  return inside(layout.storyCardSkip, x, y) ? 'skip' : 'next';
}

function pauseLayout(width: number, height: number): Pick<Layout, 'pausePanel' | 'pauseResume' | 'pauseGiveUp'> {
  const panel = { x: width / 2 - 110, y: height / 2 - 40, w: 220, h: 80 };
  const y = panel.y + panel.h - 30;
  return {
    pausePanel: panel,
    pauseResume: { x: panel.x + 12, y, w: 94, h: 20 },
    pauseGiveUp: { x: panel.x + panel.w - 12 - 94, y, w: 94, h: 20 },
  };
}

/** 일시정지 창에서 누른 것 (창 안 빈 곳은 panel: 아래로 새지 않게) */
export function hitTestPause(layout: Layout, x: number, y: number): 'resume' | 'giveUp' | 'panel' | null {
  if (inside(layout.pauseResume, x, y, 2)) return 'resume';
  if (inside(layout.pauseGiveUp, x, y, 2)) return 'giveUp';
  return inside(layout.pausePanel, x, y) ? 'panel' : null;
}

function lessonLayout(width: number, w: number, y: number, h: number): Pick<Layout, 'lessonPanel' | 'lessonNext' | 'lessonSkip'> {
  const panel = { x: (width - w) / 2, y, w, h };
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
