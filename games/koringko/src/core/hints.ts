/** 처음 하는 사람을 위한 짧은 안내 (한 번씩) · 휴대폰 자동 공격 */
import { CLASSES } from './classes.ts';
import type { Game } from './game.ts';
import { nearestMonster } from './world.ts';

export interface HintState {
  map: string;
  nearNpc: boolean;
  nearMonster: boolean;
  lowHp: boolean;
  skillPts: number;
  /** 부품을 막 얻었다 */
  partNew: boolean;
  elite: boolean;
  hazard: boolean;
  inRift: boolean;
  /** 태엽이 거의 없다 */
  lowWind: boolean;
  /** 탐험대 수 */
  party: number;
  nearCocoon: boolean;
}

export const HINTS: Record<string, { key: string; touch: string; when: (s: HintState) => boolean }> = {
  move: { key: '방향키로 걸어요', touch: '왼쪽 화면을 끌어서 걸어요', when: () => true },
  talk: { key: 'Z 를 누르면 주민과 이야기해요', touch: '공격 단추를 누르면 주민과 이야기해요', when: (s) => s.nearNpc },
  dodge: { key: '바닥의 붉은 예고! X 로 굴러 피하면 무적이에요', touch: '바닥의 붉은 예고! 구르기로 피하면 무적이에요', when: (s) => s.hazard },
  attack: { key: 'Z 를 누르고 있으면 가까운 적을 알아서 공격해요', touch: '적이 가까우면 공격 단추를 눌러요 (설정에서 자동 공격)', when: (s) => s.nearMonster },
  potion: { key: 'HP 가 적어요! Q 로 사탕을 먹어요', touch: 'HP 가 적어요! 사탕 단추를 눌러요', when: (s) => s.lowHp },
  skill: { key: '스킬 점수가 생겼어요! K 를 눌러 배워 보세요', touch: '스킬 점수가 생겼어요! ≡ 메뉴 → 스킬', when: (s) => s.skillPts > 0 },
  wind: { key: '태엽이 모자라요! 적을 때리거나 얼음 땡을 버티면 감겨요', touch: '태엽이 모자라요! 적을 때리거나 얼음 땡을 버티면 감겨요', when: (s) => s.lowWind },
  tag: { key: 'E (또는 1~4) 로 동료를 바꿔 들어요. 들어서는 순간 교대 기술!', touch: '왼쪽 위 동료 얼굴을 누르면 바꿔 들어요. 들어서는 순간 교대 기술!', when: (s) => s.party >= 2 },
  cocoon: { key: '먼지 고치! Z 로 털어 내면 먼지 무리가 몰려와요', touch: '먼지 고치! 공격 단추로 털어 내면 먼지 무리가 몰려와요', when: (s) => s.nearCocoon },
  part: { key: '부품을 얻었어요! I 로 부품 칸에 끼워요', touch: '부품을 얻었어요! ≡ 메뉴 → 부품에서 끼워요', when: (s) => s.partNew },
  elite: { key: '빛나는 정예! 이름 앞의 성질을 보고 싸워요', touch: '빛나는 정예! 이름 앞의 성질을 보고 싸워요', when: (s) => s.elite },
  rift: { key: '게이지를 채우면 상자 지킴이! 깨면 축복 카드를 골라요', touch: '게이지를 채우면 상자 지킴이! 깨면 축복 카드를 골라요', when: (s) => s.inRift },
};

/** 아직 안 본 안내 중 지금 맞는 것 (위에서부터) */
export function nextHint(s: HintState, seen: Set<string>): string | null {
  for (const [id, h] of Object.entries(HINTS)) if (!seen.has(id) && h.when(s)) return id;
  return null;
}

/** 자동 공격: 멈춰 있고 사거리 안에 적이 있으면 */
export function autoAttackTarget(g: Game, moving: boolean): boolean {
  if (moving) return false;
  const p = g.world.player;
  const melee = CLASSES[g.save.hero].combo[0].kind === 'melee';
  const m = nearestMonster(g.world, p.x, p.y, melee ? 56 : 190);
  return !!m;
}
