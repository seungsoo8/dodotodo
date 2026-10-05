/**
 * 입력 다듬기: 이미 본 대사 기억(다시 볼 때 꾹 누르면 건너뛰기) · 건너뛰기 박자 ·
 * 새 대사가 뜬 바로 그 순간의 누름 막기 · 기기에 맞는 조작 글리프.
 */

export const SEEN_KEY = 'koringko:seen';
/** 기억해 두는 본 대사 수 (넘으면 오래된 것부터 잊는다) */
export const SEEN_MAX = 6000;

/** 인물 + 글 → 짧은 열쇠 (FNV-1a 32비트 두 번, 36진수) */
export function lineKey(who: string, text: string): string {
  const s = `${who}\u0000${text}`;
  let a = 0x811c9dc5;
  let b = 0x01000193 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193);
    b = Math.imul(b ^ c, 0x5bd1e995) ^ (b >>> 15);
  }
  return (a >>> 0).toString(36) + (b >>> 0).toString(36);
}

interface Store {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

export class SeenLines {
  /** 넣은 차례를 지키는 모음 (처음 것이 가장 오래됨) */
  private readonly keys = new Set<string>();
  dirty = false;

  get size(): number {
    return this.keys.size;
  }

  has(who: string, text: string): boolean {
    return this.keys.has(lineKey(who, text));
  }

  add(who: string, text: string): void {
    const k = lineKey(who, text);
    if (this.keys.has(k)) this.keys.delete(k);
    else this.dirty = true;
    this.keys.add(k);
    while (this.keys.size > SEEN_MAX) this.keys.delete(this.keys.values().next().value!);
  }

  save(s: Store): void {
    try {
      s.setItem(SEEN_KEY, JSON.stringify([...this.keys]));
      this.dirty = false;
    } catch {
      /* 저장소가 막혀 있다 */
    }
  }

  static load(s: Store): SeenLines {
    const out = new SeenLines();
    try {
      const v: unknown = JSON.parse(s.getItem(SEEN_KEY) ?? '[]');
      if (Array.isArray(v)) for (const k of v) if (typeof k === 'string') out.keys.add(k);
    } catch {
      /* 처음이거나 깨졌다 */
    }
    while (out.keys.size > SEEN_MAX) out.keys.delete(out.keys.values().next().value!);
    return out;
  }
}

/** 건너뛸 때 한 번 넘기는 간격 (초) */
export const SKIP_GAP = 0.08;

/** 누르고 있는 동안 SKIP_GAP 마다 한 번 true (처음 누른 순간 바로) */
export class SkipPacer {
  private t = 0;
  private on = false;

  step(dt: number, active: boolean): boolean {
    if (!active) {
      this.on = false;
      return false;
    }
    if (!this.on) {
      this.on = true;
      this.t = 0;
      return true;
    }
    this.t += dt;
    if (this.t + 1e-9 < SKIP_GAP) return false;
    this.t -= SKIP_GAP;
    return true;
  }
}

/** 새 대사가 뜬 뒤 넘기기를 무시하는 시간 (초) */
export const TAP_GRACE = 0.15;

/** 누름을 받을까: 새 줄 직후에는 글자 다 보이기만 허용 */
export function tapAllowed(sinceLine: number, shown: number, length: number): boolean {
  return sinceLine >= TAP_GRACE || shown < length;
}

/** 살펴보기 표시 옆 조작 글리프 */
export function actHint(touch: boolean): string {
  return touch ? '톡' : '[Z]';
}
