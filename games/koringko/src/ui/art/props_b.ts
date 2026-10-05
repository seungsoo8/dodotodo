/**
 * 갈래 B 소품 (복도 · 할머니 방 · 이불장 · 거실): 사람 크기 방(24px 칸), 3면 규칙 · 순검정/순흰색 없음.
 * 약속은 houseProps.ts 와 같다: 칸 자리의 발 (x*24, (y+h)*24) 에서 그림 왼쪽 위까지 (ox, oy).
 *  - sheet      흰 천 덮개 (opt tall · mid · low). 상태 off = 걷혀서 발치에 구겨진 천 (대본 @prop sheet@x,y off)
 *  - quilts     개어 쌓은 이불 더미 (opt 단 수 2~4 · pouch: 귀퉁이에 꿰맨 작은 주머니)
 *  - dustRing   먼지 위 동그란 빈 자국 (opt four: 네 개) — 바닥 데칼
 *  - flashlight 배터리 뺀 낡은 손전등
 *  - glowStar   야광 별 스티커 (opt many: 여럿) — 바닥 · 벽 데칼
 *  - fogPane    김 서린 유리 조각에 손가락 글씨
 *  - cordKnot   꼬인 전화선 매듭 (opt over: 위로 넘기 · under: 밑으로) — 바닥 데칼
 *  - phoneCord  바닥을 가로지르는 꼬불꼬불 전화선 (opt v: 세로) — 바닥 데칼
 *  - visitorPass 병원 면회증 목걸이
 *  - tickets    고무줄로 묶은 색종이 표 열 장
 */
import type { PropSprite } from './houseProps.ts';
import { Pix } from './paint.ts';
import { PERSON_SPRITE_H } from './sizes.ts';
import { blank, draw, hs, nine, onto, put, swap, transpose } from './px/chapkit.ts';
import * as X from './px/chapB.ts';

const HT = 24;

/** 갈래 B 소품 이름 · 기본 칸 크기 (PROP_KINDS 에 덧붙인다) */
export const PROPS_B: Record<string, { w: number; h: number }> = {
  sheet: { w: 2, h: 1 },
  quilts: { w: 2, h: 1 },
  dustRing: { w: 1, h: 1 },
  flashlight: { w: 1, h: 1 },
  glowStar: { w: 1, h: 1 },
  fogPane: { w: 1, h: 1 },
  cordKnot: { w: 1, h: 1 },
  phoneCord: { w: 1, h: 1 },
  visitorPass: { w: 1, h: 1 },
  tickets: { w: 1, h: 1 },
};

/** 사람 키보다 높은 윗줄을 top 으로 (없어도 빈 top 을 두어 상태 그림이 원래 윗부분을 덮게) */
function stand(pix: Pix, keepTop: boolean): PropSprite {
  const s: PropSprite = { pix, ox: 0, oy: -pix.h };
  const split = pix.h - PERSON_SPRITE_H;
  if (split >= 6) {
    const top = new Pix(pix.w, split);
    if (keepTop) for (let y = 0; y < split; y++) for (let x = 0; x < pix.w; x++) top.set(x, y, pix.get(x, y));
    s.top = top;
    s.topSplitY = split;
  }
  return s;
}
const flat = (pix: Pix): PropSprite => ({ pix, ox: 0, oy: -pix.h, wall: true });

/** 흰 천: 덮인 가구 모양대로 늘어진 천 (높이 tall 80 · mid 36 · low 30), off 면 발치에 구겨진 천만 */
function sheet(W: number, opt: string): PropSprite {
  const Ht = opt.includes('tall') ? 80 : opt.includes('mid') ? 36 : 30;
  if (opt.includes('off')) return stand(onto(W, Ht, [[X.SHEET_OFF, 1, Ht - 11]], X.sheetPal), false);
  const top = opt.includes('tall') ? 2 : 3;
  return stand(onto(W, Ht, [[nine(X.SHEET, W - 2, Ht - top, 4, 4, 6, 3), 1, top]], X.sheetPal), true);
}

/** 개어 쌓은 이불: 단마다 색이 다르고(같은 격자 · 재질만 바꿈) 맨 위에 윗면 */
function quilts(W: number, opt: string): PropSprite {
  const n = Math.max(1, Math.min(5, Number(opt.match(/\d/)?.[0] ?? (W > HT ? 3 : 2))));
  const slots = ['C', 'A', 'B', 'G', 'N'];
  const th = 7;
  const Ht = n * th + 6;
  const g = blank(W, Ht);
  let y = Ht - 1;
  let last = 'C';
  for (let i = 0; i < n; i++) {
    last = slots[(i + W) % slots.length];
    const inset = i % 2;
    y -= th;
    put(g, hs(swap(X.QUILT_TIER, 'C', last), W - 3 - inset, 2, 4), 1 + inset, y);
  }
  put(g, hs(swap(X.QUILT_TOP, 'C', last), W - 5, 2, 2), 2, y - 4);
  if (opt.includes('pouch')) put(g, X.QUILT_POUCH, W - 13, Ht - 13);
  return stand(draw(g, X.quiltPal), true);
}

/** 먼지 위의 빈 자국: 둘레만 뽀얗고 가운데는 깨끗한 원 */
const dustRing = (W: number, H: number, opt: string) =>
  flat(onto(W, H, [opt.includes('four') ? [X.DUST_RING4, 1, 9] : [X.DUST_RING, 1, 8]], X.dustRingPal, false));

const flashlight = (W: number, H: number): PropSprite => ({ pix: onto(W, H, [[X.FLASH_B, 2, H - 12]], X.flashBPal), ox: 0, oy: -H });

/** 야광 별: 연둣빛 오각 별 (many 면 셋) */
const glowStar = (W: number, H: number, opt: string) =>
  flat(onto(W, H, opt.includes('many') ? [[X.GLOW_SMALL, 4, 6], [X.GLOW_SMALL, 14, 4], [X.GLOW_SMALL, 10, 14]] : [[X.GLOW_BIG, 7, 9]], X.glowPal, false));

/** 김 서린 유리 조각 (창턱에 기대 놓인 액자 유리): 뽀얀 면에 손가락 글씨 줄 */
function fogPane(W: number, H: number): PropSprite {
  const p = onto(W, H + 10, [[X.FOG_PANE, 3, 2]], X.fogPal);
  return { pix: p, ox: 0, oy: -p.h };
}

/** 꼬인 전화선 매듭: 동그란 고리 셋 + 위(over) / 아래(under) 표시 화살 */
function cordKnot(W: number, H: number, opt: string): PropSprite {
  const parts: [readonly string[], number, number][] = [[X.CORD_KNOT, 0, 13]];
  if (opt.includes('over')) parts.push([X.ARROW_UP, 9, 4]);
  else if (opt.includes('under')) parts.push([X.ARROW_DOWN, 9, 18]);
  return flat(onto(W, H, parts, X.cordPal, false));
}

/** 바닥을 가로지르는 꼬불꼬불 전화선 */
const phoneCord = (W: number, H: number, opt: string) =>
  flat(onto(W, H, [opt.includes('v') ? [transpose(X.PHONE_CORD), 11, 0] : [X.PHONE_CORD, 0, 15]], X.phonePal, false));

const visitorPass = (W: number, H: number): PropSprite => ({ pix: onto(W, H, [[X.VISITOR_PASS, 3, H - 17]], X.passPal), ox: 0, oy: -H });
const tickets = (W: number, H: number): PropSprite => ({ pix: onto(W, H, [[X.TICKETS, 3, H - 17]], X.ticketPal), ox: 0, oy: -H });

/** 갈래 B 소품 그림. 모르는 kind 는 null */
export function propsB(kind: string, w: number, h: number, opt = ''): PropSprite | null {
  const W = Math.max(1, w) * HT;
  const H = Math.max(1, h) * HT;
  switch (kind) {
    case 'sheet': return sheet(W, opt);
    case 'quilts': return quilts(W, opt);
    case 'dustRing': return dustRing(W, H, opt);
    case 'flashlight': return flashlight(W, H);
    case 'glowStar': return glowStar(W, H, opt);
    case 'fogPane': return fogPane(W, H);
    case 'cordKnot': return cordKnot(W, H, opt);
    case 'phoneCord': return phoneCord(W, H, opt);
    case 'visitorPass': return visitorPass(W, H);
    case 'tickets': return tickets(W, H);
    default: return null;
  }
}
