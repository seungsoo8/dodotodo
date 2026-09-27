import type { GameState } from './game.ts';

/** 보상 카드로 얻는 특전 (한 판에 한 번씩만 가질 수 있음) */
export interface PerkDef {
  id: string;
  name: string;
  desc: string;
}

export const PERKS: PerkDef[] = [
  { id: 'rapid_fire', name: '연사', desc: '모든 무기 공격 속도 +20%' },
  { id: 'sharpen', name: '날 벼리기', desc: '모든 무기 피해 +20%' },
  { id: 'interest', name: '이자', desc: '라운드 시작 때 가진 골드의 10% (최대 150)' },
  { id: 'vampiric', name: '흡혈 탑', desc: '적을 잡을 때마다 탑 체력 4 회복' },
  { id: 'corpse_blast', name: '시체 폭발', desc: '적이 죽으면 주변 적에게 그 적 최대 체력의 15% 피해' },
  { id: 'multishot', name: '다중 사격', desc: '단일 공격 무기가 두 번째 적에게도 한 발 더' },
  { id: 'conductor', name: '전도체', desc: '연쇄 번개가 2번 더 튄다' },
  { id: 'giant_slayer', name: '거인 사냥꾼', desc: '정예·보스에게 피해 +50%' },
  { id: 'lucky', name: '행운', desc: '치명타 확률 +15%' },
  { id: 'fortress', name: '요새', desc: '탑 최대 체력 ×1.4, 방어 +3' },
  { id: 'bounty_hunter', name: '현상금 사냥꾼', desc: '처치 현상금 +30%' },
  { id: 'discount', name: '할인', desc: '상점 가격 -20%' },
  { id: 'free_reroll', name: '무료 리롤', desc: '라운드마다 첫 리롤은 공짜' },
  { id: 'skill_master', name: '주문 숙련', desc: '스킬 재사용 시간 -30%' },
  { id: 'frost_aura', name: '냉기 오라', desc: '탑 주변 70 안의 적 이동 속도 -40%' },
  { id: 'big_splash', name: '대폭발', desc: '광역 무기 폭발 반경 ×1.3' },
];

/** 특전을 다 가졌을 때 대신 나오는 카드 (몇 번이고 받을 수 있음) */
export const GOLD_POUCH: PerkDef = { id: 'gold_pouch', name: '골드 주머니', desc: '골드 +(100 + 라운드×30)' };

/** 특전 효과 수치 (한곳에서 조정) */
export const PERK = {
  rapidFire: 0.2,
  sharpen: 0.2,
  interestRate: 0.1,
  interestMax: 150,
  vampiricHeal: 4,
  corpsePct: 0.15,
  corpseRadius: 35,
  conductorJumps: 2,
  giantSlayer: 1.5,
  lucky: 0.15,
  fortressHp: 1.4,
  fortressArmor: 3,
  bountyHunter: 1.3,
  discount: 0.8,
  skillMaster: 0.7,
  frostAuraRadius: 70,
  frostAuraSlow: 0.6,
  bigSplash: 1.3,
  pouchBase: 100,
  pouchPerRound: 30,
};

export function findPerk(id: string): PerkDef {
  if (id === GOLD_POUCH.id) return GOLD_POUCH;
  const p = PERKS.find((x) => x.id === id);
  if (!p) throw new Error(`알 수 없는 특전: ${id}`);
  return p;
}

export function hasPerk(state: GameState, id: string): boolean {
  return state.perks.includes(id);
}

/** 고른 순간 바로 적용되는 효과. 나머지는 게임 로직에서 hasPerk 로 확인한다 */
export function applyPerk(state: GameState, id: string): void {
  const t = state.tower;
  switch (id) {
    case 'rapid_fire':
      t.attackSpeedMul = Math.min(state.config.tower.maxAttackSpeedMul, t.attackSpeedMul + PERK.rapidFire);
      break;
    case 'sharpen':
      t.damageMul += PERK.sharpen;
      break;
    case 'lucky':
      t.critChance = Math.min(1, t.critChance + PERK.lucky);
      break;
    case 'fortress': {
      const newMax = t.maxHp * PERK.fortressHp;
      t.hp += newMax - t.maxHp;
      t.maxHp = newMax;
      t.armor += PERK.fortressArmor;
      break;
    }
    case GOLD_POUCH.id:
      state.gold += PERK.pouchBase + PERK.pouchPerRound * state.round;
      return; // 몇 번이고 받을 수 있으니 목록에 남기지 않는다
  }
  state.perks.push(id);
}
