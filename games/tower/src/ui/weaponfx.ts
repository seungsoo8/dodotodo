import type { GameEvent, Point } from '../core/types.ts';

/**
 * travel: 날아가며 지나는 적을 차례로 맞힘 (맞은 적까지 거리 ÷ 속도 뒤에 피격 연출)
 * impact: 목표 지점에 떨어져 터짐 (주변 적 모두 착탄 시각에 피격 연출)
 * instant: 번개·광선처럼 즉시
 */
export type Timing = 'travel' | 'impact' | 'instant';

export type ProjectileKind =
  | 'stone'
  | 'dagger'
  | 'axe'
  | 'arrow'
  | 'galeArrow'
  | 'bolt'
  | 'frostOrb'
  | 'shell'
  | 'boulder'
  | 'pot'
  | 'chaosOrb';

export type BeamKind = 'lightning' | 'storm' | 'eyeBeam' | 'voidBeam';

export type ImpactKind =
  | 'chips'
  | 'slash'
  | 'bigSlash'
  | 'spark'
  | 'wind'
  | 'heavySpark'
  | 'zap'
  | 'stormZap'
  | 'iceBurst'
  | 'explosion'
  | 'dustBlast'
  | 'fireBurst'
  | 'chaosPop'
  | 'eyeSpark'
  | 'voidImplode';

export interface WeaponFx {
  projectile?: ProjectileKind;
  beam?: BeamKind;
  /** 비행 속도 (px/초). 즉시형은 무시 */
  speed: number;
  /** 포물선 높이 (px) */
  arc: number;
  /** 초당 회전 수 (0 이면 진행 방향을 향함) */
  spin: number;
  timing: Timing;
  impact: ImpactKind;
  /** 한 번에 날아가는 개수 (쌍단검 2) */
  count?: number;
}

export const WEAPON_FX: Record<string, WeaponFx> = {
  // 일반
  sling: { projectile: 'stone', speed: 300, arc: 14, spin: 3, timing: 'travel', impact: 'chips' },
  twin_daggers: { projectile: 'dagger', speed: 380, arc: 0, spin: 5, timing: 'travel', impact: 'slash', count: 2 },
  battle_axe: { projectile: 'axe', speed: 260, arc: 10, spin: 2.5, timing: 'travel', impact: 'bigSlash' },
  // 관통
  longbow: { projectile: 'arrow', speed: 480, arc: 0, spin: 0, timing: 'travel', impact: 'spark' },
  gale_bow: { projectile: 'galeArrow', speed: 600, arc: 0, spin: 0, timing: 'travel', impact: 'wind' },
  ballista: { projectile: 'bolt', speed: 520, arc: 0, spin: 0, timing: 'travel', impact: 'heavySpark' },
  // 마법
  chain_bolt: { beam: 'lightning', speed: 0, arc: 0, spin: 0, timing: 'instant', impact: 'zap' },
  storm_crystal: { beam: 'storm', speed: 0, arc: 0, spin: 0, timing: 'instant', impact: 'stormZap' },
  frost_orb: { projectile: 'frostOrb', speed: 260, arc: 0, spin: 0, timing: 'travel', impact: 'iceBurst' },
  // 공성
  mortar: { projectile: 'shell', speed: 300, arc: 70, spin: 0, timing: 'impact', impact: 'explosion' },
  catapult: { projectile: 'boulder', speed: 330, arc: 90, spin: 1, timing: 'impact', impact: 'dustBlast' },
  fire_pot: { projectile: 'pot', speed: 250, arc: 55, spin: 2, timing: 'impact', impact: 'fireBurst' },
  // 카오스
  chaos_orb: { projectile: 'chaosOrb', speed: 240, arc: 0, spin: 0, timing: 'travel', impact: 'chaosPop' },
  chaos_eye: { beam: 'eyeBeam', speed: 0, arc: 0, spin: 0, timing: 'instant', impact: 'eyeSpark' },
  void_ray: { beam: 'voidBeam', speed: 0, arc: 0, spin: 0, timing: 'instant', impact: 'voidImplode' },
  // 전설
  thunder_hammer: { projectile: 'axe', speed: 280, arc: 16, spin: 2, timing: 'travel', impact: 'stormZap' },
  phoenix_bow: { projectile: 'galeArrow', speed: 620, arc: 0, spin: 0, timing: 'travel', impact: 'fireBurst' },
  meteor_staff: { projectile: 'boulder', speed: 300, arc: 110, spin: 1.5, timing: 'impact', impact: 'explosion' },
};

export function fxFor(weaponId: string): WeaponFx {
  return WEAPON_FX[weaponId] ?? WEAPON_FX.sling;
}

/** 하늘에서 운석이 떨어지는 스킬 */
const FALLING_SKILLS = new Set(['meteor', 'comet', 'golden_meteor']);

/** 메테오 운석이 하늘에서 떨어지는 시간 (초) */
export const METEOR_FALL = 0.4;

const dist = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);

/** 발사(from→to)의 피격 연출이 at 에서 보일 때까지 걸리는 시간 */
export function hitDelay(fx: WeaponFx, from: Point, to: Point, at: Point): number {
  if (fx.timing === 'instant' || fx.speed <= 0) return 0;
  const full = dist(from, to) / fx.speed;
  if (fx.timing === 'impact') return full;
  return Math.min(full, dist(from, at) / fx.speed);
}

export interface Scheduled {
  event: GameEvent;
  /** 이만큼 뒤에 연출을 보여준다 (초) */
  delay: number;
  /** 피격을 일으킨 무기의 연출 (발사와 이어진 피격만) */
  fx?: WeaponFx;
}

/**
 * 한 프레임 동안 쌓인 이벤트에 연출 지연을 붙인다.
 * 게임 로직은 쏘는 순간 피해를 주지만, 화면에서는 투사체가 닿는 순간에 맞은 것처럼 보이게 한다.
 */
export function schedule(events: GameEvent[]): Scheduled[] {
  let current: { fx: WeaponFx; from: Point; to: Point } | null = null;
  /** 메테오처럼 정해진 시간 뒤에 닿는 스킬 */
  let fixed: number | null = null;
  const lastHit = new Map<number, number>();
  return events.map((event): Scheduled => {
    switch (event.kind) {
      case 'shot':
        fixed = null;
        current = { fx: fxFor(event.weaponId), from: event.from, to: event.to };
        return { event, delay: 0, fx: current.fx };
      case 'splash':
        return current ? { event, delay: hitDelay(current.fx, current.from, current.to, event.at), fx: current.fx } : { event, delay: 0 };
      case 'hit': {
        if (fixed !== null) {
          lastHit.set(event.enemyId, Math.max(lastHit.get(event.enemyId) ?? 0, fixed));
          return { event, delay: fixed };
        }
        if (!current) return { event, delay: 0 };
        const delay = hitDelay(current.fx, current.from, current.to, event.at);
        lastHit.set(event.enemyId, Math.max(lastHit.get(event.enemyId) ?? 0, delay));
        return { event, delay, fx: current.fx };
      }
      case 'kill':
        return { event, delay: lastHit.get(event.enemyId) ?? 0 };
      case 'skill':
        current = null;
        fixed = FALLING_SKILLS.has(event.id) ? METEOR_FALL : null;
        return { event, delay: 0 };
      default:
        fixed = null;
        // 탑 피격·라운드 등 발사와 무관한 이벤트가 끼면, 그 뒤 피격(가시 등)은 발사와 이어지지 않는다
        current = null;
        return { event, delay: 0 };
    }
  });
}

/** 포물선 비행 중 진행 방향 각도 (화면 좌표, 오른쪽 0, 아래 +) */
export function travelAngle(from: Point, to: Point, t: number, arc: number): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y - arc * 4 * (1 - 2 * t);
  return Math.atan2(dy, dx);
}
