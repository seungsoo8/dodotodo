import { dealDamage, type GameState } from './game.ts';
import { PERK, hasPerk } from './perks.ts';
import type { Point } from './types.ts';

/** 플레이어가 직접 쓰는 스킬 */
export interface SkillDef {
  id: string;
  name: string;
  desc: string;
  key: string;
  /** 재사용 대기 시간 (초) */
  cooldown: number;
  /** 이 라운드부터 쓸 수 있다 */
  unlockRound: number;
}

export const SKILLS: SkillDef[] = [
  { id: 'meteor', name: '메테오', desc: '지점에 운석을 떨어뜨려 주변 적에게 큰 피해', key: 'Q', cooldown: 30, unlockRound: 1 },
  { id: 'blizzard', name: '눈보라', desc: '모든 적을 3초 동안 얼린다', key: 'W', cooldown: 45, unlockRound: 3 },
  { id: 'repair', name: '긴급 수리', desc: '탑 체력을 35% 회복', key: 'E', cooldown: 50, unlockRound: 6 },
  { id: 'gold_rush', name: '골드 러시', desc: '10초 동안 처치 현상금 2배', key: 'D', cooldown: 60, unlockRound: 9 },
];

/** 스킬 수치 (한곳에서 조정) */
export const SKILL = {
  meteorDamage: 150,
  meteorRadius: 55,
  freezeSeconds: 3,
  repairPct: 0.35,
  goldRushSeconds: 10,
  goldRushMul: 2,
};

export function findSkill(id: string): SkillDef {
  const s = SKILLS.find((x) => x.id === id);
  if (!s) throw new Error(`알 수 없는 스킬: ${id}`);
  return s;
}

export function skillUnlocked(state: GameState, id: string): boolean {
  return state.round >= findSkill(id).unlockRound;
}

export function skillCooldownLeft(state: GameState, id: string): number {
  return Math.max(0, state.skillCooldowns[id] ?? 0);
}

/** 메테오 피해: 적 체력이 자라는 만큼 같이 자라서 끝까지 쓸모 있다 */
export function meteorDamage(state: GameState): number {
  return SKILL.meteorDamage * state.config.waves.hpGrowth ** (state.round - 1);
}

/** 반경 안에 적이 가장 많이 들어가는 적 위치 (같으면 탑에 가까운 쪽). 적이 없으면 null */
export function bestMeteorTarget(state: GameState): Point | null {
  let best: Point | null = null;
  let bestCount = 0;
  let bestDist = Infinity;
  const t = state.tower;
  for (const c of state.enemies) {
    if (c.hp <= 0) continue;
    const count = state.enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - c.x, e.y - c.y) <= SKILL.meteorRadius).length;
    const d = Math.hypot(c.x - t.x, c.y - t.y);
    if (count > bestCount || (count === bestCount && d < bestDist)) {
      best = { x: c.x, y: c.y };
      bestCount = count;
      bestDist = d;
    }
  }
  return best;
}

/** 스킬을 쓴다. 못 쓰면 false (잠김·재사용 대기·카드 선택 중·게임 끝·대상 없음) */
export function useSkill(state: GameState, id: string, target?: Point): boolean {
  if (state.status !== 'playing' || state.choice) return false;
  const def = findSkill(id);
  if (!skillUnlocked(state, id) || skillCooldownLeft(state, id) > 0) return false;

  let at: Point | undefined;
  switch (id) {
    case 'meteor': {
      at = target ?? bestMeteorTarget(state) ?? undefined;
      if (!at) return false;
      const dmg = meteorDamage(state);
      for (const e of state.enemies) {
        if (e.hp > 0 && Math.hypot(e.x - at.x, e.y - at.y) <= SKILL.meteorRadius + e.radius) dealDamage(state, 'meteor', e, dmg, false);
      }
      break;
    }
    case 'blizzard':
      for (const e of state.enemies) {
        e.slowFactor = 0;
        e.slowTimeLeft = SKILL.freezeSeconds;
      }
      break;
    case 'repair': {
      const t = state.tower;
      t.hp = Math.min(t.maxHp, t.hp + t.maxHp * SKILL.repairPct);
      at = { x: t.x, y: t.y };
      break;
    }
    case 'gold_rush':
      state.goldRushLeft = SKILL.goldRushSeconds;
      break;
  }
  state.skillCooldowns[id] = def.cooldown * (hasPerk(state, 'skill_master') ? PERK.skillMaster : 1);
  state.events.push({ kind: 'skill', id, at });
  return true;
}

/** 매 순간 재사용 대기 시간과 골드 러시 시간을 줄인다 */
export function tickSkills(state: GameState, dt: number): void {
  for (const id of Object.keys(state.skillCooldowns)) state.skillCooldowns[id] -= dt;
  if (state.goldRushLeft > 0) state.goldRushLeft = Math.max(0, state.goldRushLeft - dt);
}
