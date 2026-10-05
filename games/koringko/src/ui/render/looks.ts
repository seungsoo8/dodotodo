/**
 * 물건 · 가구 그림 고르기 (캔버스 없이 도트 버퍼만, 시험할 수 있게).
 *  - lookPix : things 의 look 이름 → 그림 (기억 물건 전용 모양 → 물건 → 가구 1칸)
 *  - pushPix : 밀 물건 그림 (연필 · 지우개처럼 소품 기본 크기가 있으면 진짜 크기로, 충돌은 1칸 그대로)
 *  - stateSprite · stateGlow : 대본 @prop 으로 바뀐 소품 상태 그림 (뻐꾸기 bird · 스탠드 on) 과 그 빛
 *  - bridgeLook : 밀 물건을 발판에 놓아 생기는 다리의 그림 (연필 다리)
 */
import type { Furniture, Pt, RoomDef } from '../../core/adv/types.ts';
import { TILE } from '../../core/maps.ts';
import { furnitureSprite, hasFurniture, lookOf, type FurnSprite, type HouseLook } from '../art/house.ts';
import { PROP_KINDS, propSprite } from '../art/houseProps.ts';
import { ITEM_KINDS, LOOK_ART, itemSprite } from '../art/items.ts';
import type { Pix } from '../art/paint.ts';
import type { Cone, Light } from './light.ts';

/** look 이름 → 그림 (없으면 null). roomLook: 가구 그림의 방 꾸밈 */
export function lookPix(look: string, roomLook?: string): Pix | null {
  const art = LOOK_ART[look];
  if (art) return art();
  const [kind, opt] = look.split(':');
  if ((ITEM_KINDS as readonly string[]).includes(kind)) return itemSprite(kind);
  if (hasFurniture(kind)) return furnitureSprite(kind, 1, 1, lookOf(roomLook), opt ?? '').pix;
  return null;
}

/** 밀 물건 그림: 소품 기본 크기가 1칸보다 크면 그 크기로 (연필 5칸 · 큰 지우개 2칸) */
export function pushPix(look: string, roomLook?: string): Pix | null {
  const [kind, opt] = look.split(':');
  const d = PROP_KINDS[kind];
  if (d && (d.w > 1 || d.h > 1)) {
    const s = propSprite(kind, d.w, d.h, opt ?? '');
    if (s) return s.pix;
  }
  return lookPix(look, roomLook);
}

/** 상태가 붙은 소품 그림: 원래 꾸밈(opt) 에 상태를 더한다 (cuckoo + bird, lampBase + on) */
export function stateSprite(f: Furniture, state: string, L: HouseLook): FurnSprite {
  const [kind, opt] = f.kind.split(':');
  return furnitureSprite(kind, f.w, f.h, L, opt ? `${opt},${state}` : state);
}

/** 소품 상태가 내는 빛: 켜진 스탠드는 화면 밖 갓에서 받침 앞 책상까지 노란 원뿔 + 내려앉은 빛 웅덩이 */
export function stateGlow(f: Furniture, state: string): { cones: Cone[]; lights: Light[] } {
  const kind = f.kind.split(':')[0];
  if (kind === 'lampBase' && state === 'on') {
    // 목이 올라간 자리 (lampBase 그림의 목 꼭대기) 바로 위에 갓이 있다
    const x = f.x * TILE + (f.w * TILE) / 2 + 2;
    const y = Math.max(TILE / 2, f.y * TILE - TILE * 2);
    const land = (f.y + f.h + 2) * TILE;
    return {
      cones: [{ x, y, len: land - y, spread: f.w * TILE * 2, color: [255, 214, 120], k: 0.62 }],
      lights: [
        { x: x + 3, y: land - TILE, r: f.w * TILE * 1.3, color: [255, 210, 130], k: 0.55, glow: 0.25 },
        { x: x - 6, y: (f.y + f.h) * TILE - 8, r: 26, color: [255, 230, 160], k: 0.6, glow: 0.4 },
      ],
    };
  }
  return { cones: [], lights: [] };
}

/**
 * 틈(gap) 의 다리 그림: 그 틈의 플래그(gap_<id>)를 켜는 발판이 받는 밀 물건 중 발판 위에 놓인 것(없으면 첫 것)의 look.
 * 길쭉한 소품(기본 폭 2칸 이상)일 때만 — 아니면 null (밧줄 다리 나무판).
 */
export function bridgeLook(r: RoomDef, gapId: string, blockAt: (id: string) => Pt): string | null {
  const pad = r.things.find((t) => t.kind === 'pad' && t.flag === `gap_${gapId}`);
  if (!pad || pad.kind !== 'pad') return null;
  const pushes = pad.accepts.map((id) => r.things.find((t) => t.id === id)).filter((t) => t?.kind === 'push');
  const on = pushes.find((t) => {
    const [x, y] = blockAt(t!.id);
    return x === pad.at[0] && y === pad.at[1];
  });
  const t = on ?? pushes[0];
  if (!t || t.kind !== 'push') return null;
  const d = PROP_KINDS[t.look.split(':')[0]];
  return d && d.w >= 2 ? t.look : null;
}

/**
 * 근접 지도의 높은 층(^) · 단 앞면(S) 재질: 그 칸 위(또는 한 줄 아래까지)에 제 면을 그리는 소품(스탠드 받침 등)이
 * 놓여 있으면 그 자리 바닥, 아니면 책 더미 (책등 소품은 더미 뒤에 세운 책이라 제외).
 */
export function raisedLookOf(r: RoomDef): (tx: number, ty: number) => 'book' | 'floor' {
  const own = (r.furniture ?? []).filter((f) => !f.over && !f.fg && f.kind.split(':')[0] !== 'bookspines');
  return (tx, ty) => (own.some((f) => tx >= f.x && tx < f.x + f.w && ty >= f.y && ty <= f.y + f.h) ? 'floor' : 'book');
}
