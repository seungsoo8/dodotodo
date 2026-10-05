/**
 * 연기의 박자 (화면과 무관한 계산): 인물마다 어긋난 숨쉬기 · 오래 서 있을 때의 대기 몸짓 · 태엽이 적은 토비의 멈칫 걸음 ·
 * 말하는 몸짓 · 살펴보기 표시 팝 · 종이별 알림 · 카메라 앞서 보기 / 데드존 / 말하는 쪽으로 기울기.
 */
import { LOW_WIND } from '../../core/adv/stage.ts';
import { WALK_RATE } from '../art/heroes.ts';

// ───────── 숨쉬기

/** id → [0,1) 위상 (늘 같은 값) */
export function phaseOf(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10007) / 10007;
}

/** 숨 박자 (1초에 그림을 넘기는 횟수): 보리는 느긋, 루루는 들썩 */
export const BREATH_HZ: Record<string, number> = { toby: 1.4, bori: 1.1, ruru: 1.7, nabi: 1.25 };

/** 서 있는 장난감의 숨 그림 (0 = idle, 1 = idle2): 인물마다 위상 · 박자가 다르다 */
export function breathFrame(id: string, kind: string, time: number): 0 | 1 {
  const hz = BREATH_HZ[kind] ?? 1.4;
  return (Math.floor(time * hz + phaseOf(id) * 2) % 2) as 0 | 1;
}

/** 사람 숨: 3.8초에 한 번 1px (가슴 · 어깨) — 들이쉬는 동안 1 */
export const PERSON_BREATH_S = 3.8;
export function personBreath(id: string, time: number): 0 | 1 {
  const u = (time / PERSON_BREATH_S + phaseOf(id)) % 1;
  return u < 0.45 ? 1 : 0;
}

// ───────── 대기 몸짓

/** 오래 서 있을 때 인물마다 고르는 몸짓 (heroes.ts HERO_ACTS 이름) */
export const FIDGETS: Record<string, string[]> = {
  toby: ['lookAround', 'shrug'],
  bori: ['pat', 'stretch'],
  ruru: ['lookAround', 'hop'],
  nabi: ['stretch', 'nod'],
};
/** 몸짓 길이 (초) */
const FIDGET_S = 1.3;
/** 이만큼 서 있어야 몸짓을 시작한다 */
export const FIDGET_AFTER = 3;

/**
 * 서 있은 지 stillFor 초일 때 할 대기 몸짓 (없으면 null): 3초가 지나면 6~12초(인물마다)마다 한 번,
 * 표의 몸짓을 차례로. t 는 그 몸짓을 시작한 뒤 지난 초.
 */
export function idleFidget(id: string, kind: string, stillFor: number): { act: string; t: number } | null {
  const table = FIDGETS[kind];
  if (!table || stillFor < FIDGET_AFTER) return null;
  const period = 6 + 6 * phaseOf(id);
  const s = stillFor - FIDGET_AFTER;
  const n = Math.floor(s / period);
  const u = s - n * period;
  const start = period - FIDGET_S;
  if (u < start) return null;
  return { act: table[n % table.length], t: u - start };
}

// ───────── 걸음

/** 토비 걸음 그림 (0~3): 태엽이 적으면 11박자마다 한 박자 멈칫한다 (같은 그림이 두 박자) */
export function gaitFrame(walkT: number, wind: number): number {
  const local = walkT * WALK_RATE;
  if (wind >= LOW_WIND) return Math.floor(local) % 4;
  const c = local % 11;
  return Math.floor(local - Math.min(c, 1)) % 4;
}

// ───────── 말하기 · 표시 · 알림

/** 말하는 동안 0.15초마다 1px 들썩 */
export function talkBob(time: number): 0 | 1 {
  return (Math.floor(time / 0.15) % 2) as 0 | 1;
}

/** 살펴보기 ▼ 가 뜬 뒤 age 초의 크기: 0.6 → 1.1 (0.075초) → 1 (0.15초) */
export function markerPop(age: number): number {
  if (age <= 0) return 0.6;
  if (age < 0.075) return 0.6 + (age / 0.075) * 0.5;
  if (age < 0.15) return 1.1 - ((age - 0.075) / 0.075) * 0.1;
  return 1;
}

/** 알림이 보이는 정도 (0~1): 처음 0.4초 동안 올라오고, 마지막 0.3초 동안 옅어진다 */
export function toastIn(life: number, max: number): number {
  const age = max - life;
  if (life <= 0) return 0;
  if (age < 0.4) return Math.max(0, age / 0.4);
  if (life < 0.3) return life / 0.3;
  return 1;
}

// ───────── 카메라

type V = { x: number; y: number };

/** 앞서 보는 거리 (px) · 다가가는 시간 · 돌아오는 시간 */
export const LOOK_AHEAD = 24;
const LOOK_IN_S = 0.4;
const LOOK_OUT_S = 1.2;

/** 앞서 보기: 걷는 쪽(dir, 길이 1)으로 LOOK_AHEAD 만큼 0.4초에 걸쳐, 멈추면(null) 천천히 가운데로 */
export function lookAhead(cur: V, dir: V | null, dt: number): V {
  const want = dir ? { x: dir.x * LOOK_AHEAD, y: dir.y * LOOK_AHEAD } : { x: 0, y: 0 };
  // 시간 상수 T/3: T 초면 95%
  const k = 1 - Math.exp((-dt * 3) / (dir ? LOOK_IN_S : LOOK_OUT_S));
  const v = { x: cur.x + (want.x - cur.x) * k, y: cur.y + (want.y - cur.y) * k };
  const len = Math.hypot(v.x, v.y);
  return len > LOOK_AHEAD ? { x: (v.x / len) * LOOK_AHEAD, y: (v.y / len) * LOOK_AHEAD } : v;
}

/** 데드존: 목표가 focus 둘레 (±hw, ±hh) 안이면 그대로, 넘으면 넘은 만큼만 옮긴다 */
export function deadZone(focus: V, target: V, hw = 16, hh = 10): V {
  const dx = target.x - focus.x;
  const dy = target.y - focus.y;
  return {
    x: dx > hw ? target.x - hw : dx < -hw ? target.x + hw : focus.x,
    y: dy > hh ? target.y - hh : dy < -hh ? target.y + hh : focus.y,
  };
}

/** from 에서 to 쪽으로 max 만큼 (가까우면 거리의 절반만) */
export function leanToward(from: V, to: V, max = 8): V {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const d = Math.hypot(dx, dy);
  if (d < 1e-9) return { x: 0, y: 0 };
  const m = Math.min(max, d / 2);
  return { x: (dx / d) * m, y: (dy / d) * m };
}
