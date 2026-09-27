import type { GameState } from './game.ts';
import { GOLD_POUCH, PERKS, applyPerk, hasPerk } from './perks.ts';
import { BASE_SKILLS, FUSED_SKILLS, evolveCheck, evolveSkill, fuseCheck, fuseSkills, learnCheck, learnSkill } from './skills.ts';

/**
 * 보상 카드 한 장: 특전을 얻거나, 스킬을 배우거나·진화시키거나·합체한다.
 * 3라운드마다, 그리고 정예를 잡을 때마다 3장 중 1장을 고른다.
 */
export type RewardCard =
  | { kind: 'perk'; id: string }
  | { kind: 'learn'; id: string }
  | { kind: 'evolve'; id: string }
  | { kind: 'fuse'; id: string };

/** 카드를 구분하는 이름 */
export function cardKey(c: RewardCard): string {
  return `${c.kind}:${c.id}`;
}

/** 한 번에 섞이는 스킬 카드 최대 수 */
export const MAX_SKILL_CARDS = 2;

/** 지금 스킬로 할 수 있는 모든 것 */
export function skillCards(state: GameState): RewardCard[] {
  const cards: RewardCard[] = [];
  for (const k of BASE_SKILLS) {
    if (learnCheck(state, k.id).ok) cards.push({ kind: 'learn', id: k.id });
    if (evolveCheck(state, k.id).ok) cards.push({ kind: 'evolve', id: k.id });
  }
  for (const k of FUSED_SKILLS) if (fuseCheck(state, k.id).ok) cards.push({ kind: 'fuse', id: k.id });
  return cards;
}

function perkCards(state: GameState): RewardCard[] {
  return PERKS.filter((p) => !hasPerk(state, p.id)).map((p) => ({ kind: 'perk', id: p.id }));
}

/**
 * n 장을 뽑는다. 스킬로 할 것이 있으면 첫 장은 스킬 카드, 둘째 장은 특전,
 * 나머지는 둘을 섞은 데서 (스킬 카드는 많아야 2장). 모자라면 골드 주머니.
 */
export function drawRewards(state: GameState, n: number): RewardCard[] {
  const rng = state.rng;
  const skills = skillCards(state);
  const perks = perkCards(state);
  const take = (pool: RewardCard[]) => pool.splice(rng.int(pool.length), 1)[0];
  const cards: RewardCard[] = [];
  if (cards.length < n && skills.length) cards.push(take(skills));
  if (cards.length < n && perks.length) cards.push(take(perks));
  while (cards.length < n && (skills.length || perks.length)) {
    const skillsLeft = cards.filter((c) => c.kind !== 'perk').length < MAX_SKILL_CARDS ? skills : [];
    const pool = [...skillsLeft, ...perks];
    if (!pool.length) break;
    const card = pool[rng.int(pool.length)];
    const from = card.kind === 'perk' ? perks : skills;
    from.splice(from.indexOf(card), 1);
    cards.push(card);
  }
  while (cards.length < n) cards.push({ kind: 'perk', id: GOLD_POUCH.id });
  return cards;
}

/** 고른 카드의 효과를 적용한다 */
export function applyReward(state: GameState, card: RewardCard): void {
  switch (card.kind) {
    case 'perk':
      applyPerk(state, card.id);
      state.events.push({ kind: 'perk', id: card.id });
      return;
    case 'learn':
      learnSkill(state, card.id);
      return;
    case 'evolve':
      evolveSkill(state, card.id);
      return;
    case 'fuse':
      fuseSkills(state, card.id);
      return;
  }
}
