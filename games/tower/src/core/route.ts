/**
 * 밤 지도 갈림길: route.every 라운드마다 길 셋 중 하나를 고른다.
 * 고르는 동안(그리고 안개 속 사건을 고르는 동안) 게임은 멈춘다.
 */
import { SHOP_POOL, UPGRADES } from './data.ts';
import { applyItem, mergeWeapons, offerReward, type GameState } from './game.ts';
import { gainUlt, ULT } from './ultimate.ts';
import type { OwnedWeapon } from './types.ts';

export type RouteNodeId = 'elite' | 'merchant' | 'campfire' | 'forge' | 'gamble' | 'mystery';

export interface RouteNodeDef {
  name: string;
  icon: string;
  desc: string;
}

export const ROUTE = {
  /** 정예의 길: 잡으면 보상 카드를 이만큼 */
  eliteCards: 2,
  merchantSale: 0.7,
  /** 상인이 첫 칸에 놓는 무기의 최소 가격 */
  merchantMinPrice: 550,
  campfireHeal: 0.4,
  campfireMaxHp: 0.05,
  /** 도박: 주사위 눈 1~6 → 건 돈의 배율 */
  gambleMul: [0, 0.5, 1, 1.5, 2, 3],
  gambleMin: 50,
};

export const ROUTE_NODES: Record<RouteNodeId, RouteNodeDef> = {
  elite: { name: '정예의 길', icon: '⚔', desc: `다음 라운드에 정예가 온다. 잡으면 보상 카드 ${ROUTE.eliteCards}번` },
  merchant: { name: '떠돌이 상인', icon: '🏪', desc: `이번 라운드 상점 ${Math.round((1 - ROUTE.merchantSale) * 100)}% 할인, 비싼 무기를 들고 왔다` },
  campfire: { name: '모닥불', icon: '🔥', desc: `체력 ${ROUTE.campfireHeal * 100}% 회복, 최대 체력 +${ROUTE.campfireMaxHp * 100}%` },
  forge: { name: '모루', icon: '⚒', desc: '무기 하나를 골라 ★ 하나 올리기' },
  gamble: { name: '도박꾼 천막', icon: '🎲', desc: '가진 골드 절반을 걸고 주사위 (눈 1 이면 다 잃고, 6 이면 세 배)' },
  mystery: { name: '안개 속 사건', icon: '❓', desc: '무슨 일이 기다릴지 모른다' },
};

export type EncounterId = 'shrine' | 'peddler' | 'starshard';

export const ENCOUNTER = {
  shrineHpCost: 0.1,
  shrineRest: 0.25,
  peddlerBase: 150,
  peddlerPerRound: 20,
  peddlerUpgrades: 2,
  starshardGold: 60,
  starshardGoldPerRound: 40,
};

export interface EncounterDef {
  name: string;
  desc: string;
  options: [{ label: string; desc: string }, { label: string; desc: string }];
}

export const ENCOUNTERS: Record<EncounterId, EncounterDef> = {
  shrine: {
    name: '낡은 사당',
    desc: '이끼 낀 별의 사당. 무언가를 바치면 응답한다고 한다.',
    options: [
      { label: '기도한다', desc: `최대 체력 -${ENCOUNTER.shrineHpCost * 100}%, 보상 카드 한 번` },
      { label: '쉬어 간다', desc: `체력 ${ENCOUNTER.shrineRest * 100}% 회복` },
    ],
  },
  peddler: {
    name: '수상한 행상',
    desc: '두건 쓴 행상이 보따리를 푼다. "싸게 줄게."',
    options: [
      { label: '산다', desc: `골드를 내고 탑 강화 ${ENCOUNTER.peddlerUpgrades}개` },
      { label: '보낸다', desc: '아무 일 없다' },
    ],
  },
  starshard: {
    name: '별 조각',
    desc: '길가에 떨어진 별 조각이 따뜻하게 빛난다.',
    options: [
      { label: '품는다', desc: '궁극기 게이지 가득' },
      { label: '판다', desc: '골드를 받는다' },
    ],
  },
};

/** 행상의 값 (라운드가 오를수록 비싸다) */
export function peddlerCost(state: GameState): number {
  return ENCOUNTER.peddlerBase + ENCOUNTER.peddlerPerRound * state.round;
}

export function starshardGold(state: GameState): number {
  return ENCOUNTER.starshardGold + ENCOUNTER.starshardGoldPerRound * state.round;
}

/** 모루 추천: 가장 많은 피해를 준 무기 중 ★ 가 가장 높은 것 (최대 ★ 는 빼고) */
export function forgeTarget(state: GameState): OwnedWeapon | null {
  const max = state.config.merge.maxLevel;
  let best: OwnedWeapon | null = null;
  const score = (w: OwnedWeapon) => state.damageByWeapon[w.def.id] ?? 0;
  for (const w of state.weapons) {
    if (w.level >= max) continue;
    if (!best || score(w) > score(best) || (score(w) === score(best) && w.level > best.level)) best = w;
  }
  return best;
}

function hasNextRound(state: GameState): boolean {
  return state.mode === 'endless' || state.round < state.config.totalRounds;
}

/** 지금 나올 수 있는 갈림길 */
export function routeOptions(state: GameState): RouteNodeId[] {
  return (Object.keys(ROUTE_NODES) as RouteNodeId[]).filter((id) => {
    if (id === 'elite') return hasNextRound(state);
    if (id === 'forge') return forgeTarget(state) !== null;
    if (id === 'gamble') return state.gold >= ROUTE.gambleMin;
    return true;
  });
}

/** 갈림길을 띄운다 */
export function offerRoute(state: GameState): void {
  const pool = routeOptions(state);
  const nodes: RouteNodeId[] = [];
  while (nodes.length < state.config.route.nodes && pool.length) nodes.push(pool.splice(state.rng.int(pool.length), 1)[0]);
  state.route = nodes;
  state.events.push({ kind: 'route' });
}

/** 멈춰 있던 보상 카드를 이어서 띄운다 */
function flushRewards(state: GameState): void {
  if (state.route || state.encounter || state.forging || state.choice || state.pendingRewards <= 0) return;
  state.pendingRewards--;
  offerReward(state);
}

/** 갈림길 중 하나를 고른다 */
export function chooseRoute(state: GameState, index: number): boolean {
  const id = state.route?.[index];
  if (!id) return false;
  state.route = null;
  const t = state.tower;
  switch (id) {
    case 'elite':
      state.eliteHunt = true;
      break;
    case 'merchant': {
      state.sale = ROUTE.merchantSale;
      const locked = state.config.lockedItems;
      const pool = SHOP_POOL.filter((i) => i.kind === 'weapon' && i.price >= ROUTE.merchantMinPrice && !locked.includes(i.id));
      if (pool.length) state.shop[0] = pool[state.rng.int(pool.length)];
      break;
    }
    case 'campfire': {
      const extra = t.maxHp * ROUTE.campfireMaxHp;
      t.maxHp += extra;
      t.hp = Math.min(t.maxHp, t.hp + extra + t.maxHp * ROUTE.campfireHeal);
      break;
    }
    case 'forge':
      // 올릴 무기는 chooseForge 로 직접 고른다
      state.forging = true;
      break;
    case 'gamble': {
      const bet = Math.floor(state.gold / 2);
      const roll = state.rng.int(6) + 1;
      const win = Math.floor(bet * ROUTE.gambleMul[roll - 1]);
      state.gold += win - bet;
      state.events.push({ kind: 'gamble', roll, bet, win });
      break;
    }
    case 'mystery': {
      const ids = Object.keys(ENCOUNTERS) as EncounterId[];
      state.encounter = ids[state.rng.int(ids.length)];
      state.events.push({ kind: 'encounter', id: state.encounter });
      break;
    }
  }
  state.events.push({ kind: 'node', id });
  flushRewards(state);
  return true;
}

/** 모루로 index 번 무기를 올릴 수 있나 */
export function canForge(state: GameState, index: number): boolean {
  const w = state.weapons[index];
  return state.forging && !!w && w.level < state.config.merge.maxLevel;
}

/** 모루: 고른 무기의 ★ 를 하나 올린다 (같은 ★ 셋이 되면 합쳐진다) */
export function chooseForge(state: GameState, index: number): boolean {
  if (!canForge(state, index)) return false;
  const w = state.weapons[index];
  state.forging = false;
  w.level++;
  state.stats.maxStar = Math.max(state.stats.maxStar, w.level);
  state.events.push({ kind: 'forge', weaponId: w.def.id, level: w.level });
  mergeWeapons(state, w.def.id);
  flushRewards(state);
  return true;
}

/** 이 선택지를 지금 고를 수 있나 */
export function canChooseEncounter(state: GameState, index: number): boolean {
  if (!state.encounter || (index !== 0 && index !== 1)) return false;
  if (state.encounter === 'peddler' && index === 0) return state.gold >= peddlerCost(state);
  return true;
}

/** 안개 속 사건의 선택지를 고른다 */
export function chooseEncounter(state: GameState, index: number): boolean {
  if (!canChooseEncounter(state, index)) return false;
  const id = state.encounter!;
  state.encounter = null;
  const t = state.tower;
  switch (`${id}:${index}`) {
    case 'shrine:0':
      t.maxHp *= 1 - ENCOUNTER.shrineHpCost;
      t.hp = Math.min(t.hp, t.maxHp);
      offerReward(state);
      break;
    case 'shrine:1':
      t.hp = Math.min(t.maxHp, t.hp + t.maxHp * ENCOUNTER.shrineRest);
      break;
    case 'peddler:0': {
      state.gold -= peddlerCost(state);
      const items: string[] = [];
      for (let i = 0; i < ENCOUNTER.peddlerUpgrades; i++) {
        const u = UPGRADES[state.rng.int(UPGRADES.length)];
        applyItem(state, u);
        items.push(u.id);
      }
      state.events.push({ kind: 'peddler', items });
      break;
    }
    case 'starshard:0':
      gainUlt(state, ULT.max);
      break;
    case 'starshard:1':
      state.gold += starshardGold(state);
      break;
  }
  flushRewards(state);
  return true;
}
