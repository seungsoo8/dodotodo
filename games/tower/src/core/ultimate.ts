/**
 * 손으로 싸우는 맛: 수호자 궁극기 · 직접 때리기 · 연속 처치 콤보.
 */
import { FACE_INFO } from './faces.ts';
import { dealDamage, type GameState } from './game.ts';
import type { HeroId } from './heroes.ts';
import { meteorDamage } from './skills.ts';
import type { Enemy, Point } from './types.ts';

export const ULT = {
  /** 게이지 가득 */
  max: 100,
  perKill: 1.5,
  perElite: 15,
  /** 장수·부관 */
  perBoss: 25,
  /** 최대 체력만큼 맞으면 이만큼 (10% 맞으면 1/10) */
  perHpLost: 60,
  perTap: 0.5,
  /** 궁극기 피해 = 메테오 피해 × 이 값 */
  damageMul: 2.5,
  // 수호탑: 성문 닫기
  gateSeconds: 6,
  gateMul: 0.2,
  /** 이 거리 안의 땅 적을 여기까지 밀어낸다 */
  gatePush: 110,
  // 궁수탑: 길 폭 (길 가운데 줄에서 이만큼까지)
  volleyLane: 22,
  volleyMul: 1.2,
  // 마법탑
  starfallMul: 0.7,
  stunSeconds: 2.5,
  bossStunSeconds: 1,
  // 요새: 고른 면 쪽 세 곳
  barrageAt: [80, 140, 200],
  barrageRadius: 60,
  barrageMul: 1.4,
  // 탑 없음
  lanternMul: 0.8,
  // 직접 때리기
  tapRadius: 18,
  tapCooldown: 0.3,
  tapBase: 8,
};

/** 도박탑 주사위: 눈 1~6 → 피해 배율. 1 이 나오면 위로금 */
export const DICE = {
  mul: [0.3, 0.6, 1, 1.5, 2.5, 4],
  consolationGold: 120,
};

export const COMBO = {
  /** 이 시간(초) 안에 다음 적을 잡아야 이어진다 */
  window: 2,
  /** 이만큼마다 보너스 */
  step: 10,
  bonus: 15,
};

export interface UltimateDef {
  id: 'gate' | 'volley' | 'starfall' | 'barrage' | 'dice' | 'lantern';
  name: string;
  desc: string;
}

const ULTIMATES: Record<HeroId | 'none', UltimateDef> = {
  guardian: { id: 'gate', name: '성문 닫기', desc: `붙은 적을 밀쳐내고 ${ULT.gateSeconds}초 동안 받는 피해 -${Math.round((1 - ULT.gateMul) * 100)}%` },
  archer: { id: 'volley', name: '별빛 일제 사격', desc: '네 길 위의 적을 모두 꿰뚫는다' },
  mage: { id: 'starfall', name: '별 부르기', desc: `모든 적에게 번개, ${ULT.stunSeconds}초 동안 멈춘다` },
  fortress: { id: 'barrage', name: '포대 일제 사격', desc: '고른 면 쪽으로 큰 폭발 세 번' },
  gambler: { id: 'dice', name: '운명의 주사위', desc: '눈에 따라 ×0.3 ~ ×4 피해, 1 이면 골드' },
  none: { id: 'lantern', name: '등불', desc: '모든 적에게 빛' },
};

export function ultimateFor(hero: HeroId | null): UltimateDef {
  return ULTIMATES[hero ?? 'none'];
}

export function ultDamage(state: GameState): number {
  return meteorDamage(state) * ULT.damageMul;
}

export function gainUlt(state: GameState, amount: number): void {
  state.ult = Math.min(ULT.max, state.ult + amount);
}

export function ultReady(state: GameState): boolean {
  return state.ult >= ULT.max;
}

const alive = (state: GameState) => state.enemies.filter((e) => e.hp > 0);
const flying = (e: Enemy) => e.def.ability === 'flying';

/** 궁극기 쓰기 (가득 찼을 때만) */
export function useUltimate(state: GameState): boolean {
  if (!ultReady(state) || state.status !== 'playing') return false;
  state.ult = 0;
  const def = ultimateFor(state.hero);
  const t = state.tower;
  const dmg = ultDamage(state);
  let roll: number | undefined;
  switch (def.id) {
    case 'gate':
      state.gateLeft = ULT.gateSeconds;
      for (const e of alive(state)) {
        if (flying(e) || e.isBoss) continue;
        const dx = e.x - t.x;
        const dy = e.y - t.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d >= ULT.gatePush) continue;
        e.x = t.x + (dx / d) * ULT.gatePush;
        e.y = t.y + (dy / d) * ULT.gatePush;
      }
      break;
    case 'volley':
      for (const e of alive(state)) {
        if (Math.abs(e.x - t.x) <= ULT.volleyLane || Math.abs(e.y - t.y) <= ULT.volleyLane) dealDamage(state, 'ultimate', e, dmg * ULT.volleyMul, false);
      }
      break;
    case 'starfall':
      for (const e of alive(state)) {
        dealDamage(state, 'ultimate', e, dmg * ULT.starfallMul, false);
        e.slowFactor = 0;
        e.slowTimeLeft = e.isBoss || e.isOfficer ? ULT.bossStunSeconds : ULT.stunSeconds;
      }
      break;
    case 'barrage': {
      const f = FACE_INFO[state.face];
      for (const d of ULT.barrageAt) {
        const c = { x: t.x + f.dx * d, y: t.y + f.dy * d };
        for (const e of alive(state)) {
          if (Math.hypot(e.x - c.x, e.y - c.y) <= ULT.barrageRadius + e.radius) dealDamage(state, 'ultimate', e, dmg * ULT.barrageMul, false);
        }
      }
      break;
    }
    case 'dice':
      roll = state.rng.int(6) + 1;
      for (const e of alive(state)) dealDamage(state, 'ultimate', e, dmg * DICE.mul[roll - 1], false);
      if (roll === 1) state.gold += DICE.consolationGold;
      break;
    case 'lantern':
      for (const e of alive(state)) dealDamage(state, 'ultimate', e, dmg * ULT.lanternMul, false);
      break;
  }
  state.events.push({ kind: 'ultimate', id: def.id, hero: state.hero, face: state.face, roll });
  return true;
}

/** 직접 때리기 한 번의 피해 (라운드에 따라 조금 세진다) */
export function tapDamage(state: GameState): number {
  return ULT.tapBase * Math.sqrt(state.config.waves.hpGrowth) ** (state.round - 1);
}

/** 전장을 눌러 가장 가까운 적을 때린다 (p: 전장 좌표). 맞혔으면 true */
export function tapAttack(state: GameState, p: Point): boolean {
  if (state.tapLeft > 0 || state.status !== 'playing') return false;
  let best: Enemy | null = null;
  let bestD = Infinity;
  for (const e of alive(state)) {
    const d = Math.hypot(e.x - p.x, e.y - p.y) - e.radius;
    if (d <= ULT.tapRadius && d < bestD) {
      best = e;
      bestD = d;
    }
  }
  if (!best) return false;
  state.tapLeft = ULT.tapCooldown;
  dealDamage(state, 'tap', best, tapDamage(state), false);
  gainUlt(state, ULT.perTap);
  state.events.push({ kind: 'tap', at: { x: best.x, y: best.y } });
  return true;
}

/** 적을 잡았다: 게이지 · 콤보 (보너스 골드) */
export function onKill(state: GameState, e: Enemy): void {
  gainUlt(state, e.isBoss || e.isOfficer ? ULT.perBoss : e.isElite ? ULT.perElite : ULT.perKill);
  state.combo = { count: state.combo.count + 1, left: COMBO.window };
  if (state.combo.count % COMBO.step === 0) {
    const bonus = COMBO.bonus * (state.combo.count / COMBO.step);
    state.gold += bonus;
    state.events.push({ kind: 'combo', count: state.combo.count, bonus, at: { x: e.x, y: e.y } });
  }
}

/** 탑이 맞았다 */
export function onTowerHit(state: GameState, amount: number): void {
  gainUlt(state, (amount / state.tower.maxHp) * ULT.perHpLost);
}

/** 매 순간: 성문 · 때리기 대기 · 콤보 시간 */
export function tickAction(state: GameState, dt: number): void {
  if (state.gateLeft > 0) state.gateLeft = Math.max(0, state.gateLeft - dt);
  if (state.tapLeft > 0) state.tapLeft = Math.max(0, state.tapLeft - dt);
  if (state.combo.left > 0) {
    state.combo.left = Math.max(0, state.combo.left - dt);
    if (state.combo.left === 0) state.combo = { count: 0, left: 0 };
  }
}
