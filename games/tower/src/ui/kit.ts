import type { WeaponType } from '../core/types.ts';
import type { Rect } from './layout.ts';
import type { Sprite } from './sprites.ts';

/** Galmuri 파일을 assets/ 에 넣으면 자동으로 쓰고, 없으면 시스템 한글 글꼴 */
export const FONT = '"Galmuri11", "Galmuri9", "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';

export const C = {
  gold: '#ffd75e',
  goldDark: '#c9962c',
  dim: '#8a94a8',
  text: '#d8def0',
  red: '#ff5c5c',
  green: '#6fdc6f',
  ink: '#06080d',
  panel: '#161b2a',
  panelHi: '#3a4466',
  panelLo: '#0c0f19',
  field: '#18202e',
};

export const TYPE_INFO: Record<WeaponType, { label: string; color: string }> = {
  normal: { label: '일반', color: '#e8e1cf' },
  pierce: { label: '관통', color: '#8fd16a' },
  magic: { label: '마법', color: '#6fb7ff' },
  siege: { label: '공성', color: '#ff9d4d' },
  chaos: { label: '카오스', color: '#c77dff' },
};

export type SpriteVariant = 'normal' | 'frozen' | 'white' | 'red';

const cache = new Map<Sprite, Map<string, HTMLCanvasElement>>();

/** 도트 그림을 작은 캔버스에 한 번만 그려 두고 재사용한다 */
export function spriteImage(sprite: Sprite, flip = false, variant: SpriteVariant = 'normal'): HTMLCanvasElement {
  const key = `${flip ? 'L' : 'R'}${variant}`;
  let variants = cache.get(sprite);
  if (!variants) {
    variants = new Map();
    cache.set(sprite, variants);
  }
  let canvas = variants.get(key);
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.width = sprite.width;
    canvas.height = sprite.height;
    const c = canvas.getContext('2d')!;
    for (const p of sprite.pixels) {
      c.fillStyle = p.color;
      c.fillRect(flip ? sprite.width - 1 - p.x : p.x, p.y, 1, 1);
    }
    const tint = { frozen: 'rgba(111, 183, 255, 0.55)', white: 'rgba(255, 255, 255, 0.85)', red: 'rgba(255, 70, 70, 0.5)' };
    if (variant !== 'normal') {
      c.globalCompositeOperation = 'source-atop';
      c.fillStyle = tint[variant];
      c.fillRect(0, 0, sprite.width, sprite.height);
    }
    variants.set(key, canvas);
  }
  return canvas;
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  x: number,
  y: number,
  scale = 1,
  flip = false,
  variant: SpriteVariant = 'normal',
): void {
  ctx.drawImage(spriteImage(sprite, flip, variant), Math.round(x), Math.round(y), sprite.width * scale, sprite.height * scale);
}

/** 픽셀 느낌 창: 검은 외곽 + 밝은 위·왼쪽 / 어두운 아래·오른쪽 턱 + 모서리 깎기 */
export function panel(ctx: CanvasRenderingContext2D, r: Rect, fill = C.panel, hi = C.panelHi, lo = C.panelLo): void {
  const x = Math.round(r.x);
  const y = Math.round(r.y);
  const w = Math.round(r.w);
  const h = Math.round(r.h);
  ctx.fillStyle = C.ink;
  ctx.fillRect(x + 1, y, w - 2, h);
  ctx.fillRect(x, y + 1, w, h - 2);
  ctx.fillStyle = fill;
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = hi;
  ctx.fillRect(x + 2, y + 1, w - 4, 1);
  ctx.fillRect(x + 1, y + 2, 1, h - 4);
  ctx.fillStyle = lo;
  ctx.fillRect(x + 2, y + h - 2, w - 4, 1);
  ctx.fillRect(x + w - 2, y + 2, 1, h - 4);
}

export type ButtonState = 'normal' | 'hover' | 'disabled' | 'selected';

export function button(ctx: CanvasRenderingContext2D, r: Rect, label: string, state: ButtonState = 'normal', accent = C.gold): void {
  const fill = state === 'selected' ? '#3a3220' : state === 'hover' ? '#2a3350' : state === 'disabled' ? '#141824' : '#222a40';
  const hi = state === 'selected' ? accent : state === 'disabled' ? '#20263a' : C.panelHi;
  panel(ctx, r, fill, hi);
  if (!label) return;
  ctx.fillStyle = state === 'disabled' ? '#5a6078' : state === 'selected' ? accent : C.text;
  ctx.font = `11px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2 + 1);
}

/** 그림자 있는 글자 */
export function text(
  ctx: CanvasRenderingContext2D,
  str: string,
  x: number,
  y: number,
  color: string,
  size = 11,
  align: CanvasTextAlign = 'left',
  bold = false,
): void {
  ctx.font = `${bold ? 'bold ' : ''}${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = C.ink;
  ctx.fillText(str, x + 1, y + 1);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

/** 가로 막대 (배경 + 값 + 선택적 잔상) */
export function bar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  ratio: number,
  color: string,
  ghost?: number,
): void {
  ctx.fillStyle = C.ink;
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = '#2a2f40';
  ctx.fillRect(x, y, w, h);
  if (ghost !== undefined && ghost > ratio) {
    ctx.fillStyle = '#f4f1e8';
    ctx.fillRect(x, y, w * Math.min(1, ghost), h);
  }
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, ratio)), h);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, ratio)), 1);
}
