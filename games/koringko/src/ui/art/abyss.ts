/**
 * 근접(장난감 크기) 지도 아래로 아득히 보이는 사람 크기 방바닥 (abyss 배경). 이어 붙일 수 있는 한 장.
 * 멀리 있으니 대비를 낮추고 어둡게: 넓은 나무 마루 · 슬리퍼 한 짝 · 바닥 자국 · 크레파스 · 먼지.
 */
import { Pix, hash2, hex, shade } from './paint.ts';
import { paintGrid } from './px/grid.ts';
import { paintTiled } from './px/slice.ts';
import * as HX from './px/houseTiles.ts';
import * as TX from './px/toyTiles.ts';

export const ABYSS_SIZE = 240;

/** 그림 이름 → 이어 붙이는 한 장 (모르는 이름은 roomFloor) */
export function abyssSprite(name: string): Pix {
  switch (name) {
    default:
      return roomFloor();
  }
}

/** 저 아래 사람 크기 마루 (집 마루 격자 WOOD_SHEET 를 어둡게) · 의자 끈 자국 · 슬리퍼 · 크레파스 */
function roomFloor(): Pix {
  const S = ABYSS_SIZE;
  const p = new Pix(S, S);
  const wood = hex('#7a5a40');
  const pal = HX.woodPal(wood);
  // 240 = 마루 한 장(120) 두 번 · 줄마다 엇갈림은 마루 격자 안에 있다 (위아래 · 좌우로 이어진다)
  for (let y = 0; y < S; y += 24) paintTiled(p, HX.WOOD_SHEET, pal, 0, y, S, 24, Math.floor(hash2(y, 3, 501) * 5) * 24, 0);
  const fp = TX.farPal(wood);
  for (let i = 0; i < 3; i++) paintTiled(p, TX.SCUFF, fp, 20 + Math.floor(hash2(i, 1, 510) * 160), 30 + Math.floor(hash2(i, 2, 510) * 170), 40, 1, i * 7, 0);
  paintGrid(p, TX.SLIPPER, 52, 156, fp);
  paintGrid(p, TX.FAR_CRAYON, 150, 194, fp);
  // 먼지 (드문드문 밝은 점, 격자 VOID_DUST)
  paintTiled(p, TX.VOID_DUST, { s: shade(wood, 0.16), S: shade(wood, 0.24) }, 0, 0, S, S, 0, 0);
  return p;
}
