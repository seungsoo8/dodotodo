/**
 * 설정: 글자 속도 · 글자 크기 · 화면 흔들림 · 자동 넘김 · 기기 음성(실험, 기본 끔) · 본 대사 건너뛰기.
 * 읽을 때 항목마다 값을 검사해 틀린 것만 기본값으로 돌리고, 저장소가 막혀도 던지지 않는다.
 */
import type { View } from './view.ts';

export type TextSpeed = 'slow' | 'normal' | 'fast' | 'instant';
export type TextSize = 'normal' | 'large';
export type AutoAdvance = 'off' | 'slow' | 'fast';

export interface Prefs {
  textSpeed: TextSpeed;
  textSize: TextSize;
  /** 화면 흔들림 · 깜빡임 (false = 줄이기) */
  shake: boolean;
  auto: AutoAdvance;
  /** 기기 음성으로 대사 읽기 (실험) */
  voice: boolean;
  /** 이미 본 대사는 꾹 누르면 건너뛰기 */
  skipSeen: boolean;
}

export const PREFS_KEY = 'koringko:prefs';
/** 예전 목소리 켜기/끄기 키 ('on' 은 직접 켠 사람) */
export const LEGACY_VOICE_KEY = 'koringko:voice';

export const DEFAULT_PREFS: Readonly<Prefs> = Object.freeze({ textSpeed: 'normal', textSize: 'normal', shake: true, auto: 'off', voice: false, skipSeen: true });

const TEXT_SPEEDS: readonly TextSpeed[] = ['slow', 'normal', 'fast', 'instant'];
const TEXT_SIZES: readonly TextSize[] = ['normal', 'large'];
const AUTOS: readonly AutoAdvance[] = ['off', 'slow', 'fast'];

/** 글자 속도 배율 (기본 30 글자/초에 곱한다): 느림 20 · 보통 30 · 빠름 50 · 바로(한 장면에 다) */
export const TEXT_SPEED: Readonly<Record<TextSpeed, number>> = { slow: 20 / 30, normal: 1, fast: 50 / 30, instant: 300 };
/** 대사가 다 나오고 넘기기까지 기다리는 초 (0 = 끔) */
export const AUTO_SECONDS: Readonly<Record<AutoAdvance, number>> = { off: 0, slow: 2.4, fast: 1.2 };
/** 글자 화면 배율 */
export const TEXT_SCALE: Readonly<Record<TextSize, number>> = { normal: 1, large: 1.25 };

const oneOf = <T extends string>(list: readonly T[], v: unknown, d: T): T => (typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T) : d);
const bool = (v: unknown, d: boolean): boolean => (typeof v === 'boolean' ? v : d);

/** 저장된 글 → 설정. raw 가 없을 때만 예전 목소리 키를 본다 */
export function parsePrefs(raw: string | null, legacyVoice: string | null): Prefs {
  const d = DEFAULT_PREFS;
  if (raw === null) return { ...d, voice: legacyVoice === 'on' };
  let o: unknown;
  try {
    o = JSON.parse(raw);
  } catch {
    return { ...d };
  }
  if (!o || typeof o !== 'object' || Array.isArray(o)) return { ...d };
  const v = o as Record<string, unknown>;
  return {
    textSpeed: oneOf(TEXT_SPEEDS, v.textSpeed, d.textSpeed),
    textSize: oneOf(TEXT_SIZES, v.textSize, d.textSize),
    shake: bool(v.shake, d.shake),
    auto: oneOf(AUTOS, v.auto, d.auto),
    voice: bool(v.voice, d.voice),
    skipSeen: bool(v.skipSeen, d.skipSeen),
  };
}

interface Store {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

export function loadPrefs(s: Store): Prefs {
  try {
    return parsePrefs(s.getItem(PREFS_KEY), s.getItem(LEGACY_VOICE_KEY));
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(s: Store, p: Prefs): void {
  try {
    s.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* 저장소가 막혀 있다 — 이번 판에만 */
  }
}

export type PrefKey = keyof Prefs;

/** 메뉴에서 ◀(-1) ▶(+1): 고르는 항목은 돌고, 켜고 끄는 항목은 뒤집는다 (새 객체) */
export function cyclePref(p: Prefs, k: PrefKey, d: 1 | -1): Prefs {
  const turn = <T>(list: readonly T[], cur: T): T => list[(list.indexOf(cur) + d + list.length) % list.length];
  switch (k) {
    case 'textSpeed':
      return { ...p, textSpeed: turn(TEXT_SPEEDS, p.textSpeed) };
    case 'textSize':
      return { ...p, textSize: turn(TEXT_SIZES, p.textSize) };
    case 'auto':
      return { ...p, auto: turn(AUTOS, p.auto) };
    default:
      return { ...p, [k]: !p[k] };
  }
}

const SPEED_TEXT: Record<TextSpeed, string> = { slow: '느림', normal: '보통', fast: '빠름', instant: '바로' };
const SIZE_TEXT: Record<TextSize, string> = { normal: '보통', large: '크게' };
const AUTO_TEXT: Record<AutoAdvance, string> = { off: '끔', slow: '느리게', fast: '빠르게' };

/** 항목 값 글자 */
export function prefValueText(p: Prefs, k: PrefKey): string {
  if (k === 'textSpeed') return SPEED_TEXT[p.textSpeed];
  if (k === 'textSize') return SIZE_TEXT[p.textSize];
  if (k === 'auto') return AUTO_TEXT[p.auto];
  return p[k] ? '켬' : '끔';
}

/** 무대가 읽는 값: 글자 속도 배율 · 흔들림 끄기 · 자동 넘김 초 (그리기 · 대본 쪽이 쓴다) */
export function applyPrefs(stage: object, p: Prefs): void {
  const st = stage as { textSpeed?: number; noShake?: boolean; autoAdvance?: number };
  st.textSpeed = TEXT_SPEED[p.textSpeed];
  st.noShake = !p.shake;
  st.autoAdvance = AUTO_SECONDS[p.auto];
}

/** 글자 화면: 크게면 배율을 올리고 논리 크기를 줄여 같은 장치 픽셀을 덮는다 */
export function uiView(v: View, size: TextSize): View {
  const k = TEXT_SCALE[size];
  if (k === 1) return v;
  return { scale: v.scale * k, w: Math.max(1, Math.ceil(v.w / k)), h: Math.max(1, Math.ceil(v.h / k)) };
}
