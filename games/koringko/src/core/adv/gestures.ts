/**
 * 상호작용 몸짓: 무엇을 누르든 조종하는 인물이 먼저 몸으로 반응한다 (들여다보기 · 숙여 줍기 · 손 흔들기 …).
 * 대본이 이미 그 인물의 몸짓으로 시작하면 덧붙이지 않는다.
 */
import type { Cmd, Thing } from './types.ts';

/** 상호작용 몸짓 길이 (초): 짧게, 대사를 늦추지 않게 */
export const GESTURE_S = 0.45;

/** 그 물건을 누를 때 조종 인물의 몸짓 (없으면 null) */
export function interactGesture(t: Thing): string | null {
  switch (t.kind) {
    case 'spot':
    case 'memory':
    case 'keepsake':
      return 'peek';
    case 'star':
    case 'thread':
      return 'bow';
    case 'npc':
      return t.pal ? 'pat' : 'nod';
    case 'windup':
      return 'stretch';
    case 'link':
      return 'think';
    case 'block':
    case 'push':
    case 'gap':
      return 'point';
    case 'climb':
      return 'hop';
    default:
      return null;
  }
}

/** 대본 첫머리(세 명령 안, 대사 전)에 그 인물의 몸짓이 이미 있나 */
export function startsWithAct(cmds: readonly Cmd[], who: string): boolean {
  for (const c of cmds.slice(0, 3)) {
    if (c.t === 'act' && c.who === who) return true;
    if (c.t === 'say') return false;
  }
  return false;
}

/** 대본 앞에 몸짓을 붙인다 (이미 있으면 그대로). 기다리지 않는다: 몸짓과 첫 대사가 함께 — 누를 때마다 늦어지지 않게 */
export function withGesture(cmds: Cmd[], who: string, name: string | null): Cmd[] {
  if (!name || startsWithAct(cmds, who)) return cmds;
  return [{ t: 'act', who, name, s: GESTURE_S, wait: false }, ...cmds];
}
