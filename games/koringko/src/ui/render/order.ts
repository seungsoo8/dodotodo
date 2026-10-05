/**
 * 그리기 순서 (ENGINE0 §4): back → [props: 가구 아랫부분 · 물건 · 인물을 발 높이로] → 가구 윗부분(top) → 윗층(over) → (빛) → 앞쪽 가림막(fg).
 * 화면과 상관없는 순서만 여기 둔다 (시험할 수 있게).
 */
export type DrawLayer = 'props' | 'top' | 'over' | 'fg';

export interface DrawEntry {
  layer: DrawLayer;
  /** 발 높이 (같은 층 안에서 앞뒤) */
  foot: number;
  id: string;
  draw: () => void;
}

const RANK: Record<DrawLayer, number> = { props: 0, top: 1, over: 2, fg: 3 };

/** 층 차례 → 같은 층은 발 높이 → 같으면 넣은 차례 */
export function orderDraws(es: DrawEntry[]): DrawEntry[] {
  return es
    .map((e, i) => ({ e, i }))
    .sort((a, b) => RANK[a.e.layer] - RANK[b.e.layer] || a.e.foot - b.e.foot || a.i - b.i)
    .map((x) => x.e);
}

export interface Layers<S> {
  props: S[];
  tops: S[];
  over: S[];
  fg: S[];
}

/** 방 그림 층들을 그리기 항목으로 (paint 가 실제로 그린다) */
export function planEntries<S extends { foot: number; kind: string }>(p: Layers<S>, paint: (s: S, layer: DrawLayer) => void): DrawEntry[] {
  const out: DrawEntry[] = [];
  const add = (list: S[], layer: DrawLayer) => list.forEach((s, i) => out.push({ layer, foot: s.foot, id: `${layer}${i}:${s.kind}`, draw: () => paint(s, layer) }));
  add(p.props, 'props');
  add(p.tops, 'top');
  add(p.over, 'over');
  add(p.fg, 'fg');
  return out;
}
