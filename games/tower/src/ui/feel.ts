/**
 * 두드리는 손맛: 큰 타격에 아주 잠깐 멈춤(히트스톱), 장수를 쓰러뜨린 순간의 슬로모션,
 * 연속 처치 표시, 화면 위 장수 체력바.
 */
import { BOSS_PATTERN } from '../core/data.ts';
import type { GameState } from '../core/game.ts';
import type { Enemy, GameEvent } from '../core/types.ts';

export const FEEL = {
  eliteStop: 0.06,
  officerStop: 0.1,
  ultimateStop: 0.1,
  slamStop: 0.08,
  bossSlow: 1.6,
  bossSlowScale: 0.2,
  officerSlow: 0.7,
  officerSlowScale: 0.35,
  comboMin: 3,
  comboBaseSize: 10,
  comboMaxSize: 20,
};

/** 남은 멈춤 · 남은 슬로모션 (전체 길이와 가장 느린 배율) */
export interface Feel {
  stop: number;
  slow: number;
  slowDur: number;
  slowScale: number;
}

export function idleFeel(): Feel {
  return { stop: 0, slow: 0, slowDur: 0, slowScale: 1 };
}

/** 이번 프레임 이벤트로 멈춤·슬로모션을 건다 (겹치면 가장 센 것) */
export function feelFromEvents(feel: Feel, events: GameEvent[]): Feel {
  let { stop, slow, slowDur, slowScale } = feel;
  const slowDown = (dur: number, scale: number) => {
    if (slow > 0 && slowScale <= scale && slow >= dur) return;
    slow = slowDur = dur;
    slowScale = scale;
  };
  for (const ev of events) {
    switch (ev.kind) {
      case 'kill':
        if (ev.rank === 'elite') stop = Math.max(stop, FEEL.eliteStop);
        if (ev.rank === 'officer') {
          stop = Math.max(stop, FEEL.officerStop);
          slowDown(FEEL.officerSlow, FEEL.officerSlowScale);
        }
        if (ev.rank === 'boss') slowDown(FEEL.bossSlow, FEEL.bossSlowScale);
        break;
      case 'ultimate':
        stop = Math.max(stop, FEEL.ultimateStop);
        break;
      case 'bossSlam':
        stop = Math.max(stop, FEEL.slamStop);
        break;
    }
  }
  return { stop, slow, slowDur, slowScale };
}

/** 실제 시간 realDt 가 흐른다. scale: 이번에 게임 시간에 곱할 배율 (멈춤이면 0) */
export function feelTick(feel: Feel, realDt: number): { feel: Feel; scale: number } {
  if (feel.stop > 0) {
    const stop = Math.max(0, feel.stop - realDt);
    return { feel: { ...feel, stop }, scale: 0 };
  }
  if (feel.slow > 0) {
    // 처음엔 가장 느리고, 끝으로 갈수록 원래 속도로
    const k = 1 - feel.slow / feel.slowDur;
    const scale = feel.slowScale + (1 - feel.slowScale) * k * k;
    const slow = Math.max(0, feel.slow - realDt);
    return { feel: slow > 0 ? { ...feel, slow } : idleFeel(), scale };
  }
  return { feel: idleFeel(), scale: 1 };
}

/** 연속 처치 표시 (짧으면 숨긴다) */
export function comboView(count: number): { text: string; size: number; color: string } | null {
  if (count < FEEL.comboMin) return null;
  const size = Math.min(FEEL.comboMaxSize, FEEL.comboBaseSize + Math.floor(count / 5));
  const color = count < 10 ? '#f4f1e8' : count < 20 ? '#ffd166' : count < 30 ? '#ff9d4d' : '#ff5a4d';
  return { text: `${count} 연속`, size, color };
}

export interface BossBar {
  name: string;
  /** 남은 체력 0~1 */
  frac: number;
  /** 단계가 바뀌는 체력 비율 */
  marks: number[];
  enraged: boolean;
  officer: boolean;
  /** 기를 모으는 중이면 모은 정도 0~1 */
  windup: number | null;
}

/** 화면 위에 띄울 장수 체력바: 장수 우선, 없으면 부관 */
export function bossBar(state: GameState): BossBar | null {
  const alive = state.enemies.filter((e) => e.hp > 0);
  const pick = (list: Enemy[]) => list.reduce<Enemy | null>((a, b) => (!a || b.maxHp > a.maxHp ? b : a), null);
  const e = pick(alive.filter((x) => x.isBoss)) ?? pick(alive.filter((x) => x.isOfficer));
  if (!e) return null;
  const p = e.pattern;
  return {
    name: e.isOfficer ? `${e.def.name}의 부관` : e.def.name,
    frac: Math.min(1, e.hp / e.maxHp),
    marks: p ? [BOSS_PATTERN.enrageAt] : [],
    enraged: !!p?.enraged,
    officer: !!e.isOfficer && !e.isBoss,
    windup: p?.phase === 'windup' ? 1 - p.phaseLeft / BOSS_PATTERN.windup[p.kind] : null,
  };
}
