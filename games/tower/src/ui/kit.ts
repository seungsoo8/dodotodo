import type { WeaponType } from '../core/types.ts';
import type { Rect } from './layout.ts';
import type { Sprite } from './sprites.ts';

/** 요즘 게임처럼 매끈한 한글 글꼴 (Pretendard 가 없으면 시스템 글꼴) */
export const FONT = '"Pretendard Variable", "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", system-ui, sans-serif';

export const C = {
  gold: '#ffd166',
  goldDark: '#c9962c',
  dim: '#9aa3b8',
  text: '#e9edf5',
  red: '#ff6b6b',
  green: '#5fd68a',
  ink: '#06080d',
  /** 반투명 유리 패널 */
  glass: 'rgba(16, 20, 32, 0.72)',
  glassHi: 'rgba(255, 255, 255, 0.10)',
  accent: '#7cc4ff',
  panel: 'rgba(18, 22, 34, 0.86)',
  panelHi: 'rgba(255, 255, 255, 0.12)',
  panelLo: 'rgba(0, 0, 0, 0)',
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

/** 둥근 사각형 경로 */
export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/**
 * 둥근 반투명 창. fill 은 바탕, hi 는 테두리 색 (강조할 때만 진하게).
 * (예전 도트 창과 같은 이름이라 부르는 쪽은 그대로 두고 모양만 바뀐다)
 */
export function panel(ctx: CanvasRenderingContext2D, r: Rect, fill = C.panel, hi = C.panelHi, _lo = C.panelLo, radius = 6): void {
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  roundRect(ctx, r.x, r.y, r.w, r.h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
  roundRect(ctx, r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, radius);
  ctx.strokeStyle = hi;
  ctx.lineWidth = 1;
  ctx.stroke();
}

/** 알약 모양 (완전히 둥근 끝) */
export function pill(ctx: CanvasRenderingContext2D, r: Rect, fill = C.glass, border = C.glassHi): void {
  panel(ctx, r, fill, border, undefined, r.h / 2);
}

export type ButtonState = 'normal' | 'hover' | 'disabled' | 'selected';

export function button(ctx: CanvasRenderingContext2D, r: Rect, label: string, state: ButtonState = 'normal', accent = C.gold): void {
  const fill =
    state === 'selected' ? 'rgba(255, 209, 102, 0.16)' : state === 'hover' ? 'rgba(255, 255, 255, 0.12)' : state === 'disabled' ? 'rgba(16, 20, 32, 0.5)' : 'rgba(22, 27, 42, 0.82)';
  const border = state === 'selected' ? accent : state === 'hover' ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.10)';
  panel(ctx, r, fill, border, undefined, Math.min(8, r.h / 2));
  if (!label) return;
  ctx.fillStyle = state === 'disabled' ? '#5a6078' : state === 'selected' ? accent : C.text;
  ctx.font = `600 ${Math.min(10, r.h * 0.42)}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2 + 0.5);
}

/** 글자 (전장 위에서도 읽히게 옅은 그림자) */
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
  ctx.font = `${bold ? '700 ' : '500 '}${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  // 흐림 그림자는 글자마다 비싸서, 살짝 내린 어두운 글자를 한 번 먼저 찍는다
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillText(str, x, y + 0.8);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

/** 둥근 가로 막대 (바탕 + 값 + 선택적 잔상) */
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
  const r = h / 2;
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.fill();
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  if (ghost !== undefined && ghost > ratio) {
    roundRect(ctx, x, y, Math.max(h, w * clamp(ghost)), h, r);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fill();
  }
  if (ratio > 0) {
    roundRect(ctx, x, y, Math.max(h, w * clamp(ratio)), h, r);
    ctx.fillStyle = color;
    ctx.fill();
  }
}
