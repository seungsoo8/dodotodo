/**
 * 근접(장난감 크기) 지도 아래로 아득히 보이는 사람 크기 방바닥 (abyss 배경). 이어 붙일 수 있는 한 장.
 * 멀리 있으니 대비를 낮추고 어둡게: 넓은 나무 마루 · 슬리퍼 한 짝 · 바닥 자국 · 크레파스 · 먼지.
 */
import { Pix, hash2, hex, mix, shade, type Color } from './paint.ts';

export const ABYSS_SIZE = 240;

/** 그림 이름 → 이어 붙이는 한 장 (모르는 이름은 roomFloor) */
export function abyssSprite(name: string): Pix {
  switch (name) {
    default:
      return roomFloor();
  }
}

function roomFloor(): Pix {
  const S = ABYSS_SIZE;
  const p = new Pix(S, S);
  const wood = hex('#7a5a40');
  const rowH = 20;
  const plankW = 80;
  for (let y = 0; y < S; y++) {
    const row = Math.floor(y / rowH);
    const off = Math.floor(hash2(row, 3, 501) * plankW);
    for (let x = 0; x < S; x++) {
      const X = (x + off) % S;
      const plank = Math.floor(X / plankW);
      let c: Color = shade(wood, (hash2(row, plank, 502) - 0.5) * 0.12);
      if (y % rowH === 0) c = shade(wood, -0.28);
      else if (X % plankW === 0) c = shade(wood, -0.22);
      else if (hash2(X >> 3, y >> 1, 503) < 0.08) c = shade(c, -0.05);
      p.set(x, y, c);
    }
  }
  // 바닥 자국: 의자를 끈 긴 줄 · 둥근 얼룩
  for (let i = 0; i < 3; i++) {
    const x0 = 20 + hash2(i, 1, 510) * 180;
    const y0 = 30 + hash2(i, 2, 510) * 170;
    for (let k = 0; k < 40; k++) p.set(x0 + k, y0 + k * 0.15, shade(wood, 0.12));
  }
  p.oval(180, 60, 14, 6, shade(wood, -0.1));
  // 슬리퍼 한 짝 (분홍, 바닥 그늘)
  const sl = hex('#c88a94');
  p.oval(74, 168, 18, 8, shade(wood, -0.3));
  p.oval(70, 164, 17, 8, sl);
  p.oval(62, 163, 8, 6, shade(sl, 0.12));
  p.oval(76, 163, 8, 7, shade(sl, -0.18));
  p.rect(60, 160, 14, 2, mix(sl, hex('#f0e0d0'), 0.4));
  // 떨어진 크레파스
  p.rect(150, 196, 14, 3, hex('#5a7ab0'));
  p.rect(150, 196, 3, 3, shade(hex('#5a7ab0'), 0.25));
  p.rect(151, 199, 13, 1, shade(wood, -0.25));
  // 먼지
  for (let i = 0; i < 60; i++) p.set(hash2(i, 5, 520) * S, hash2(i, 6, 520) * S, shade(wood, 0.2));
  return p;
}
