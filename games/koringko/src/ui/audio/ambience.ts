/**
 * 바깥 소리(앰비언스) 층 고르기 (QUALITY D2): 방의 꾸밈 · 가구 · 날씨로 계속 흐르는 고리와 가끔 나는 소리를 고른다.
 * 비 소리는 weather.ts(rainLevelOf) 가 따로 맡는다. 화면 · 소리 장치와 무관 (연주는 storysound.ts).
 */
import { lookOf } from '../art/house.ts';

/** 계속 흐르는 고리 (storysound.ts 가 잡음 · 발진기로 만든다) */
export const AMB_LOOPS = ['clockTick', 'fridgeHum', 'wind', 'traffic', 'roomTone', 'waterHum'] as const;
export type AmbLoop = (typeof AMB_LOOPS)[number];

export interface AmbLayer {
  /** 고리 이름 (AMB_LOOPS) 또는 가끔 나는 효과음 이름 (STORY_SFX) */
  name: string;
  /** 0..0.5 (효과음 볼륨에 다시 곱한다) */
  gain: number;
  /** 가끔 나는 소리: [최소, 최대] 초 간격 */
  every?: readonly [number, number];
  /** 기억 방: 지금 밤의 소리가 저역 통과로 먹먹하게 남는다 */
  muffle?: boolean;
}

export interface AmbRoom {
  id: string;
  scale: 'toy' | 'human';
  look?: string;
  theme?: string;
  rain?: boolean;
  weather?: string;
  amb?: readonly { name: string; gain: number; every?: readonly [number, number] }[];
  furniture?: readonly { kind: string }[];
}

const OUTDOOR = new Set(['grass', 'asphalt', 'paving', 'sand', 'dirt']);

/** 장난감 크기 장 방: 그 자리가 집의 어디인지 (꾸밈 이름이 없어서) */
const PLACE: Record<string, 'out' | 'kitchen' | 'bath' | 'living' | 'room' | 'porch'> = {
  outside: 'out', yard: 'out', balcony: 'out', entrance: 'porch',
  cupboard: 'kitchen', drawer: 'kitchen', bath: 'bath', sofa: 'living', shelf: 'living', window: 'living',
};

export function ambienceFor(r: AmbRoom): AmbLayer[] {
  const memory = r.id.startsWith('m_');
  const wrap = (ls: AmbLayer[]) => ls.map((l) => (memory ? { ...l, gain: +(l.gain * 0.55).toFixed(3), muffle: true } : l));
  if (r.amb) return wrap(r.amb.map((l) => ({ ...l })));
  const kinds = new Set((r.furniture ?? []).map((f) => f.kind.split(':')[0]));
  const L = r.look ? lookOf(r.look) : null;
  const place = r.scale === 'toy' ? PLACE[r.id] : undefined;
  const outdoor = (L && OUTDOOR.has(L.floorKind)) || place === 'out';
  const night = L ? L.sky === 'night' || L.sky === 'dusk' : true;
  const wet = !!r.rain || r.weather === 'rain' || r.weather === 'drizzle' || L?.sky === 'rain';
  const out: AmbLayer[] = [];
  if (outdoor) {
    out.push({ name: 'wind', gain: wet ? 0.24 : 0.16 });
    out.push({ name: 'traffic', gain: 0.12 });
    if (night && !wet && r.weather !== 'snow') out.push({ name: 'crickets', gain: 0.18, every: [5, 12] });
    out.push({ name: 'carPass', gain: 0.12, every: [18, 40] });
    if (night) out.push({ name: 'dog', gain: 0.08, every: [35, 80] });
  } else {
    out.push({ name: 'roomTone', gain: 0.1 });
    out.push({ name: 'traffic', gain: place === 'porch' ? 0.07 : 0.04 });
    if (place === 'porch') out.push({ name: 'carPass', gain: 0.06, every: [25, 60] });
  }
  if (kinds.has('clock') || kinds.has('cuckoo') || place === 'living') out.push({ name: 'clockTick', gain: 0.22 });
  if (kinds.has('fridge') || place === 'kitchen' || r.look?.startsWith('kitchen')) out.push({ name: 'fridgeHum', gain: 0.14 });
  if (kinds.has('sink') || kinds.has('bathtub') || place === 'bath' || r.look?.startsWith('bath')) {
    out.push({ name: 'waterHum', gain: 0.05 });
    out.push({ name: 'drip', gain: 0.16, every: [2.5, 6] });
  }
  return wrap(out);
}

/** 실제로 내는 세기: 층 세기 × 효과음 볼륨 × 작게 (바깥 소리는 늘 배경) */
export function ambienceGain(layer: number, sfxVolume: number): number {
  return Math.max(0, layer) * Math.max(0, sfxVolume) * 0.2;
}
