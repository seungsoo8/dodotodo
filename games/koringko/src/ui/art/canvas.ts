/** 도트 버퍼 → 캔버스 (브라우저에서만) */
import { CLEAR, type Pix } from './paint.ts';

const cache = new WeakMap<Pix, HTMLCanvasElement>();

export function pixCanvas(p: Pix): HTMLCanvasElement {
  const hit = cache.get(p);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = p.w;
  c.height = p.h;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(p.w, p.h);
  for (let i = 0; i < p.px.length; i++) {
    const v = p.px[i];
    if (v === CLEAR) continue;
    img.data[i * 4] = (v >> 16) & 255;
    img.data[i * 4 + 1] = (v >> 8) & 255;
    img.data[i * 4 + 2] = v & 255;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  cache.set(p, c);
  return c;
}
