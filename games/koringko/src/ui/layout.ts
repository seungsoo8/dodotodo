/** HUD 자리 (논리 좌표). 가로 · 세로 화면, 키보드 · 터치에 맞춘다 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Circle {
  x: number;
  y: number;
  r: number;
}

export type TouchId = 'attack' | 'roll' | 'A' | 'S' | 'D' | 'F' | 'hp';

export interface HudLayout {
  status: Rect;
  minimap: Rect;
  menu: Rect;
  quest: Rect;
  boss: Rect;
  /** 탐험대 얼굴 (1~4) */
  party: Rect[];
  /** A S D F Q (키보드) */
  quick: Rect[];
  touch: Record<TouchId, Circle>;
  exp: Rect;
}

export function hudLayout(w: number, h: number, touch: boolean): HudLayout {
  const status = { x: 4, y: 4, w: 132, h: 40 };
  const mmW = w < 420 ? 64 : 84;
  const minimap = { x: w - mmW - 4, y: 4, w: mmW, h: Math.round(mmW * 0.64) };
  const menu = { x: minimap.x - 22, y: 4, w: 18, h: 18 };
  const narrow = w < 520;
  const P = 24;
  const party: Rect[] = [0, 1, 2, 3].map((i) => ({ x: status.x + i * (P + 4), y: status.y + status.h + 4, w: P, h: P }));
  const quest = { x: 4, y: party[0].y + P + 14, w: Math.min(150, w * 0.4), h: 40 };
  const bw = Math.min(220, w - 40);
  const boss = narrow ? { x: (w - bw) / 2, y: minimap.y + minimap.h + 14, w: bw, h: 8 } : { x: (w - bw) / 2, y: 10, w: bw, h: 8 };
  const S = 24;
  const gap = 3;
  const total = S * 5 + gap * 4 + 8;
  const qx = Math.round((w - total) / 2);
  const qy = h - S - 8;
  const quick: Rect[] = [];
  for (let i = 0; i < 5; i++) quick.push({ x: qx + i * (S + gap) + (i >= 4 ? 8 : 0), y: qy, w: S, h: S });

  // 터치: 오른쪽 아래 공격 단추 둘레에 부채꼴로
  const R = narrow ? 26 : 28;
  const ax = w - R - 14;
  const ay = h - R - 16;
  const ring = R + 40;
  const sk: Record<'A' | 'S' | 'D' | 'F', Circle> = {
    A: polar(ax, ay, ring, 180, 16),
    S: polar(ax, ay, ring, 210, 16),
    D: polar(ax, ay, ring, 240, 16),
    F: polar(ax, ay, ring, 270, 16),
  };
  const roll = { x: sk.A.x - 37, y: Math.min(h - 21, sk.A.y + 10), r: 17 };
  const pr = 13;
  const hp = { x: roll.x - 34, y: h - pr - 8, r: pr };
  return {
    status,
    minimap,
    menu,
    quest,
    party,
    boss,
    quick,
    touch: { attack: { x: ax, y: ay, r: R }, roll, ...sk, hp },
    exp: { x: 0, y: h - 3, w, h: 3 },
  };
  void touch;
}

function polar(cx: number, cy: number, d: number, deg: number, r: number): Circle {
  const a = (deg * Math.PI) / 180;
  return { x: Math.round(cx + Math.cos(a) * d), y: Math.round(cy + Math.sin(a) * d), r };
}
