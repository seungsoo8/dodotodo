import { dealDamage, type GameState } from './game.ts';
import { PERK, hasPerk } from './perks.ts';
import type { Enemy, Point } from './types.ts';

/** 스킬 속성. 속성이 이어지게 연달아 쓰면 콤보가 터진다 */
export type SkillTag = 'fire' | 'ice' | 'storm' | 'wind' | 'heal' | 'gold';

export interface SkillDef {
  id: string;
  name: string;
  desc: string;
  /** 재사용 대기 시간 (초) */
  cooldown: number;
  tags: SkillTag[];
  /** base: 배워서 얻음 · fused: 두 기본 스킬을 합쳐서 얻음 */
  tier: 'base' | 'fused';
  /** 합체 재료 */
  recipe?: [string, string];
  /** 진화: 짝 특전이 있으면 공짜 */
  evolve?: { perk: string; name: string; desc: string };
  /** 떨어뜨릴 곳을 고르는 스킬 */
  aimed?: boolean;
}

/** 칸에 들어 있는 스킬 */
export interface OwnedSkill {
  id: string;
  evolved: boolean;
  /** 합체 스킬 힘 배율 (진화한 재료 하나당 +30%) */
  power: number;
}

export const BASE_SKILLS: SkillDef[] = [
  {
    id: 'meteor', name: '메테오', desc: '지점에 운석을 떨어뜨려 주변 적에게 큰 피해', cooldown: 30, tags: ['fire'], tier: 'base', aimed: true,
    evolve: { perk: 'big_splash', name: '유성우', desc: '다른 두 무리에도 운석이 하나씩 더' },
  },
  {
    id: 'blizzard', name: '눈보라', desc: '모든 적을 3초 동안 얼린다', cooldown: 45, tags: ['ice'], tier: 'base',
    evolve: { perk: 'frost_aura', name: '영구 동토', desc: '5초 동안 얼린다' },
  },
  {
    id: 'repair', name: '긴급 수리', desc: '탑 체력을 35% 회복', cooldown: 50, tags: ['heal'], tier: 'base',
    evolve: { perk: 'vampiric', name: '생명의 샘', desc: '60% 회복' },
  },
  {
    id: 'gold_rush', name: '골드 러시', desc: '10초 동안 처치 현상금 2배', cooldown: 60, tags: ['gold'], tier: 'base',
    evolve: { perk: 'interest', name: '황금 시대', desc: '15초 동안 현상금 3배' },
  },
  {
    id: 'thunder', name: '천둥', desc: '가장 튼튼한 적 5마리에게 벼락', cooldown: 35, tags: ['storm'], tier: 'base',
    evolve: { perk: 'conductor', name: '뇌신', desc: '10마리에게 벼락' },
  },
  {
    id: 'gust', name: '돌풍', desc: '모든 적을 탑에서 밀어내고 약한 피해', cooldown: 40, tags: ['wind'], tier: 'base',
    evolve: { perk: 'rapid_fire', name: '태풍', desc: '훨씬 멀리 밀어낸다' },
  },
];

export const FUSED_SKILLS: SkillDef[] = [
  { id: 'comet', name: '혜성', desc: '얼음 운석: 넓게 큰 피해, 맞은 적은 4초 얼음', cooldown: 40, tags: ['fire', 'ice'], tier: 'fused', recipe: ['meteor', 'blizzard'], aimed: true },
  { id: 'golden_meteor', name: '황금 운석', desc: '운석 + 10초 골드 러시', cooldown: 45, tags: ['fire', 'gold'], tier: 'fused', recipe: ['meteor', 'gold_rush'], aimed: true },
  { id: 'judgement', name: '천벌', desc: '가장 튼튼한 8마리에게 메테오 2배 벼락', cooldown: 45, tags: ['fire', 'storm'], tier: 'fused', recipe: ['meteor', 'thunder'] },
  { id: 'ice_wall', name: '얼음 성벽', desc: '모두 얼리고 35% 회복, 6초 동안 받는 피해 -70%', cooldown: 55, tags: ['ice', 'heal'], tier: 'fused', recipe: ['blizzard', 'repair'] },
  { id: 'frost_gale', name: '설풍', desc: '멀리 밀어내고 4초 얼린다', cooldown: 50, tags: ['ice', 'wind'], tier: 'fused', recipe: ['blizzard', 'gust'] },
  { id: 'alchemy', name: '연금술', desc: '35% 회복 + 골드 (100 + 라운드×30)', cooldown: 55, tags: ['heal', 'gold'], tier: 'fused', recipe: ['repair', 'gold_rush'] },
  { id: 'tempest', name: '폭풍', desc: '밀어내고 6마리에게 천둥', cooldown: 45, tags: ['storm', 'wind'], tier: 'fused', recipe: ['thunder', 'gust'] },
];

export const ALL_SKILLS: SkillDef[] = [...BASE_SKILLS, ...FUSED_SKILLS];

/** 연달아 쓰면 터지는 콤보: 앞 스킬 속성(from) → 이번 스킬 속성(to) */
export interface ComboDef {
  id: string;
  name: string;
  from: SkillTag;
  to: SkillTag;
  desc: string;
}

export const COMBOS: ComboDef[] = [
  { id: 'shatter', name: '빙쇄', from: 'ice', to: 'fire', desc: '얼어 있는 모든 적이 메테오 피해를 한 번 더' },
  { id: 'firewind', name: '불바람', from: 'fire', to: 'wind', desc: '모든 적에게 메테오의 0.6배' },
  { id: 'superconduct', name: '초전도', from: 'storm', to: 'ice', desc: '모든 적에게 메테오의 0.5배' },
  { id: 'cyclone', name: '회오리 번개', from: 'wind', to: 'storm', desc: '탑 주변 120 안의 적에게 메테오의 0.8배' },
  { id: 'repair_fee', name: '보수 공사비', from: 'heal', to: 'gold', desc: '골드 (50 + 라운드×20)' },
];

export const TAG_INFO: Record<SkillTag, { label: string; color: string }> = {
  fire: { label: '불', color: '#ff6b35' },
  ice: { label: '얼음', color: '#9fd8ff' },
  storm: { label: '번개', color: '#ffe066' },
  wind: { label: '바람', color: '#9fe0b0' },
  heal: { label: '치유', color: '#6fdc6f' },
  gold: { label: '금', color: '#ffd75e' },
};

/** 스킬 수치 (한곳에서 조정) */
export const SKILL = {
  learnCost: 1,
  evolveCost: 2,
  fuseCost: 2,
  fusedEvolvedBonus: 0.3,
  comboWindow: 4,
  meteorDamage: 150,
  meteorRadius: 55,
  meteorExtra: 2,
  freezeSeconds: 3,
  freezeEvolved: 5,
  repairPct: 0.35,
  repairEvolved: 0.6,
  goldRushSeconds: 10,
  goldRushMul: 2,
  goldAgeSeconds: 15,
  goldAgeMul: 3,
  thunderTargets: 5,
  thunderEvolved: 10,
  thunderMul: 1.2,
  gustPush: 70,
  gustEvolved: 110,
  gustMul: 0.3,
  cometMul: 1.5,
  cometRadius: 70,
  cometFreeze: 4,
  judgementTargets: 8,
  judgementMul: 2,
  shieldSeconds: 6,
  /** 얼음 성벽 동안 받는 피해 배율 */
  shieldMul: 0.3,
  alchemyBase: 100,
  alchemyPerRound: 30,
  tempestPush: 90,
  tempestTargets: 6,
  galePush: 80,
  galeFreeze: 4,
  comboShatter: 1,
  comboFirewind: 0.6,
  comboSuperconduct: 0.5,
  comboCyclone: 0.8,
  cycloneRadius: 120,
  feeBase: 50,
  feePerRound: 20,
};

export function findSkill(id: string): SkillDef {
  const s = ALL_SKILLS.find((x) => x.id === id);
  if (!s) throw new Error(`알 수 없는 스킬: ${id}`);
  return s;
}

export function ownedSkill(state: GameState, id: string): OwnedSkill | undefined {
  return state.skills.find((k) => k.id === id);
}

/** 이름 (진화했으면 진화 이름) */
export function skillName(id: string, evolved: boolean): string {
  const def = findSkill(id);
  return evolved && def.evolve ? def.evolve.name : def.name;
}

/** 실제 재사용 대기 = 기본 × 주문 숙련 × 탑·영구 강화 배율 */
export function skillCooldownOf(state: GameState, id: string): number {
  return findSkill(id).cooldown * (hasPerk(state, 'skill_master') ? PERK.skillMaster : 1) * state.skillCooldownMul;
}

export function skillCooldownLeft(state: GameState, id: string): number {
  return Math.max(0, state.skillCooldowns[id] ?? 0);
}

// ───────────────────────── 스킬 트리 ─────────────────────────

export type TreeCheck = { ok: true } | { ok: false; reason: 'points' | 'slots' | 'owned' | 'consumed' | 'fused' | 'missing' | 'evolved' };

export function learnCheck(state: GameState, id: string): TreeCheck {
  const def = findSkill(id);
  if (def.tier === 'fused') return { ok: false, reason: 'fused' };
  if (ownedSkill(state, id)) return { ok: false, reason: 'owned' };
  if (state.consumedSkills.includes(id)) return { ok: false, reason: 'consumed' };
  if (state.skillPoints < SKILL.learnCost) return { ok: false, reason: 'points' };
  if (state.skills.length >= state.config.skills.slots) return { ok: false, reason: 'slots' };
  return { ok: true };
}

/** 1단: 기본 스킬 배우기 */
export function learnSkill(state: GameState, id: string): boolean {
  if (!learnCheck(state, id).ok) return false;
  state.skillPoints -= SKILL.learnCost;
  state.skills.push({ id, evolved: false, power: 1 });
  state.events.push({ kind: 'learn', id });
  return true;
}

/** 진화 비용: 짝 특전이 있으면 0 */
export function evolveCost(state: GameState, id: string): number {
  const def = findSkill(id);
  return def.evolve && hasPerk(state, def.evolve.perk) ? 0 : SKILL.evolveCost;
}

export function evolveCheck(state: GameState, id: string): TreeCheck {
  const owned = ownedSkill(state, id);
  if (!owned || !findSkill(id).evolve) return { ok: false, reason: 'missing' };
  if (owned.evolved) return { ok: false, reason: 'evolved' };
  if (state.skillPoints < evolveCost(state, id)) return { ok: false, reason: 'points' };
  return { ok: true };
}

/** 2단: 가진 기본 스킬 진화 */
export function evolveSkill(state: GameState, id: string): boolean {
  if (!evolveCheck(state, id).ok) return false;
  state.skillPoints -= evolveCost(state, id);
  ownedSkill(state, id)!.evolved = true;
  state.events.push({ kind: 'evolve', id });
  return true;
}

export function fuseCheck(state: GameState, id: string): TreeCheck {
  const def = findSkill(id);
  if (!def.recipe) return { ok: false, reason: 'missing' };
  if (ownedSkill(state, id)) return { ok: false, reason: 'owned' };
  if (!def.recipe.every((r) => ownedSkill(state, r))) return { ok: false, reason: 'missing' };
  if (state.skillPoints < SKILL.fuseCost) return { ok: false, reason: 'points' };
  return { ok: true };
}

/** 3단: 두 기본 스킬을 합체. 첫 재료 자리에 들어가고 다른 칸은 빈다 */
export function fuseSkills(state: GameState, id: string): boolean {
  if (!fuseCheck(state, id).ok) return false;
  const [a, b] = findSkill(id).recipe!;
  const parts = [ownedSkill(state, a)!, ownedSkill(state, b)!];
  const power = 1 + SKILL.fusedEvolvedBonus * parts.filter((p) => p.evolved).length;
  const first = Math.min(state.skills.indexOf(parts[0]), state.skills.indexOf(parts[1]));
  state.skills = state.skills.filter((k) => !parts.includes(k));
  state.skills.splice(first, 0, { id, evolved: false, power });
  state.consumedSkills.push(a, b);
  state.skillPoints -= SKILL.fuseCost;
  state.skillCooldowns[id] = 0;
  state.events.push({ kind: 'fuse', id, from: [a, b] });
  return true;
}

// ───────────────────────── 효과 ─────────────────────────

/** 스킬 피해 기준: 적 체력이 자라는 만큼 같이 자라서 끝까지 쓸모 있다 */
export function meteorDamage(state: GameState): number {
  return SKILL.meteorDamage * state.config.waves.hpGrowth ** (state.round - 1);
}

const aliveEnemies = (state: GameState) => state.enemies.filter((e) => e.hp > 0);

/** 반경 안에 적이 가장 많이 들어가는 적 위치 (같으면 탑에 가까운 쪽). 빼 둘 자리(avoid) 근처는 고르지 않는다 */
export function bestMeteorTarget(state: GameState, radius = SKILL.meteorRadius, avoid: Point[] = []): Point | null {
  let best: Point | null = null;
  let bestCount = 0;
  let bestDist = Infinity;
  const t = state.tower;
  const alive = aliveEnemies(state);
  for (const c of alive) {
    if (avoid.some((p) => Math.hypot(p.x - c.x, p.y - c.y) <= radius)) continue;
    const count = alive.filter((e) => Math.hypot(e.x - c.x, e.y - c.y) <= radius).length;
    const d = Math.hypot(c.x - t.x, c.y - t.y);
    if (count > bestCount || (count === bestCount && d < bestDist)) {
      best = { x: c.x, y: c.y };
      bestCount = count;
      bestDist = d;
    }
  }
  return best;
}

function blast(state: GameState, source: string, at: Point, radius: number, amount: number): Enemy[] {
  const hit = aliveEnemies(state).filter((e) => Math.hypot(e.x - at.x, e.y - at.y) <= radius + e.radius);
  for (const e of hit) dealDamage(state, source, e, amount, false);
  return hit;
}

function freeze(enemies: Enemy[], seconds: number): void {
  for (const e of enemies) {
    e.slowFactor = 0;
    e.slowTimeLeft = seconds;
  }
}

/** 모든 적을 탑에서 distance 만큼 밀어낸다 (화면 밖으로는 안 나감) */
function push(state: GameState, source: string, distance: number, amount: number): void {
  const t = state.tower;
  const { width, height } = state.config;
  for (const e of aliveEnemies(state)) {
    const dx = e.x - t.x;
    const dy = e.y - t.y;
    const d = Math.hypot(dx, dy) || 1;
    e.x = Math.max(0, Math.min(width, t.x + (dx / d) * (d + distance)));
    e.y = Math.max(0, Math.min(height, t.y + (dy / d) * (d + distance)));
    if (amount > 0) dealDamage(state, source, e, amount, false);
  }
}

function heal(state: GameState, pct: number): void {
  const t = state.tower;
  t.hp = Math.min(t.maxHp, t.hp + t.maxHp * pct);
}

function goldRush(state: GameState, seconds: number, mul: number): void {
  state.goldRushLeft = seconds;
  state.goldRushMul = mul;
}

/** 스킬을 쓴다. 못 쓰면 false (없음·재사용 대기·카드 선택 중·게임 끝·대상 없음) */
export function useSkill(state: GameState, id: string, target?: Point): boolean {
  if (state.status !== 'playing' || state.choice) return false;
  const owned = ownedSkill(state, id);
  if (!owned || skillCooldownLeft(state, id) > 0) return false;
  const def = findSkill(id);
  const ev = owned.evolved;
  const dmg = meteorDamage(state) * owned.power;
  const t = state.tower;
  const needsEnemy = ['meteor', 'comet', 'golden_meteor', 'thunder', 'judgement'].includes(id);
  if (needsEnemy && !target && aliveEnemies(state).length === 0) return false;

  // 1) 어디에 떨어질지 먼저 정하고 2) 스킬 이벤트를 남긴 뒤 3) 피해를 준다.
  //    화면은 스킬 이벤트 뒤의 피격을 운석이 떨어진 시각에 맞춰 보여준다.
  const aimed = (radius: number) => target ?? bestMeteorTarget(state, radius)!;
  const strongest = (n: number) =>
    aliveEnemies(state)
      .sort((a, b) => b.hp - a.hp)
      .slice(0, n);
  let at: Point | undefined;
  let targets: Point[] | undefined;
  let struck: Enemy[] = [];
  switch (id) {
    case 'meteor': {
      at = aimed(SKILL.meteorRadius);
      if (ev) {
        targets = [];
        const avoid = [at];
        for (let k = 0; k < SKILL.meteorExtra; k++) {
          const p = bestMeteorTarget(state, SKILL.meteorRadius, avoid);
          if (!p) break;
          avoid.push(p);
          targets.push(p);
        }
      }
      break;
    }
    case 'comet':
      at = aimed(SKILL.cometRadius);
      break;
    case 'golden_meteor':
      at = aimed(SKILL.meteorRadius);
      break;
    case 'thunder':
      struck = strongest(ev ? SKILL.thunderEvolved : SKILL.thunderTargets);
      break;
    case 'judgement':
      struck = strongest(SKILL.judgementTargets);
      break;
    case 'repair':
    case 'ice_wall':
    case 'alchemy':
      at = { x: t.x, y: t.y };
      break;
  }
  if (struck.length) targets = struck.map((e) => ({ x: e.x, y: e.y }));
  const skillEvent = { kind: 'skill' as const, id, at, targets, evolved: ev };
  state.events.push(skillEvent);

  switch (id) {
    case 'meteor':
      blast(state, id, at!, SKILL.meteorRadius, dmg);
      for (const p of targets ?? []) blast(state, id, p, SKILL.meteorRadius, dmg);
      break;
    case 'blizzard':
      freeze(aliveEnemies(state), ev ? SKILL.freezeEvolved : SKILL.freezeSeconds);
      break;
    case 'repair':
      heal(state, ev ? SKILL.repairEvolved : SKILL.repairPct);
      break;
    case 'gold_rush':
      if (ev) goldRush(state, SKILL.goldAgeSeconds, SKILL.goldAgeMul);
      else goldRush(state, SKILL.goldRushSeconds, SKILL.goldRushMul);
      break;
    case 'thunder':
      for (const e of struck) dealDamage(state, id, e, dmg * SKILL.thunderMul, false);
      break;
    case 'gust':
      push(state, id, ev ? SKILL.gustEvolved : SKILL.gustPush, dmg * SKILL.gustMul);
      break;
    case 'comet':
      freeze(blast(state, id, at!, SKILL.cometRadius, dmg * SKILL.cometMul), SKILL.cometFreeze);
      break;
    case 'golden_meteor':
      blast(state, id, at!, SKILL.meteorRadius, dmg * SKILL.cometMul);
      goldRush(state, SKILL.goldRushSeconds, SKILL.goldRushMul);
      break;
    case 'judgement':
      for (const e of struck) dealDamage(state, id, e, dmg * SKILL.judgementMul, false);
      break;
    case 'ice_wall':
      freeze(aliveEnemies(state), SKILL.freezeSeconds);
      heal(state, SKILL.repairPct);
      state.shieldLeft = SKILL.shieldSeconds;
      break;
    case 'frost_gale':
      push(state, id, SKILL.galePush, 0);
      freeze(aliveEnemies(state), SKILL.galeFreeze);
      break;
    case 'alchemy':
      heal(state, SKILL.repairPct);
      state.gold += (SKILL.alchemyBase + SKILL.alchemyPerRound * state.round) * owned.power;
      break;
    case 'tempest': {
      push(state, id, SKILL.tempestPush, dmg * SKILL.gustMul);
      const hit = strongest(SKILL.tempestTargets);
      // 밀어낸 뒤 자리에 벼락이 떨어지는 모습을 보여 주도록 이벤트에 채워 둔다
      skillEvent.targets = hit.map((e) => ({ x: e.x, y: e.y }));
      for (const e of hit) dealDamage(state, id, e, dmg * SKILL.thunderMul, false);
      break;
    }
  }
  state.skillCooldowns[id] = skillCooldownOf(state, id);
  state.stats.skillsUsed++;
  triggerCombo(state, def);
  state.lastSkill = { id, at: state.time };
  return true;
}

/** 앞 스킬과 속성이 이어지면 콤보 (한 번에 하나) */
function triggerCombo(state: GameState, def: SkillDef): void {
  const last = state.lastSkill;
  if (!last || state.time - last.at > SKILL.comboWindow) return;
  const prev = findSkill(last.id).tags;
  const combo = COMBOS.find((c) => prev.includes(c.from) && def.tags.includes(c.to));
  if (!combo) return;
  const dmg = meteorDamage(state);
  const t = state.tower;
  switch (combo.id) {
    case 'shatter':
      for (const e of aliveEnemies(state)) if (e.slowTimeLeft > 0 && e.slowFactor === 0) dealDamage(state, combo.id, e, dmg * SKILL.comboShatter, false);
      break;
    case 'firewind':
      for (const e of aliveEnemies(state)) dealDamage(state, combo.id, e, dmg * SKILL.comboFirewind, false);
      break;
    case 'superconduct':
      for (const e of aliveEnemies(state)) dealDamage(state, combo.id, e, dmg * SKILL.comboSuperconduct, false);
      break;
    case 'cyclone':
      blast(state, combo.id, { x: t.x, y: t.y }, SKILL.cycloneRadius, dmg * SKILL.comboCyclone);
      break;
    case 'repair_fee':
      state.gold += SKILL.feeBase + SKILL.feePerRound * state.round;
      break;
  }
  state.stats.combos++;
  state.events.push({ kind: 'combo', id: combo.id });
}

/** 이 스킬을 지금 쓰면 콤보가 터지는가 (화면 표시용) */
export function comboReady(state: GameState, id: string): ComboDef | null {
  const last = state.lastSkill;
  if (!last || state.time - last.at > SKILL.comboWindow || last.id === id) return null;
  const prev = findSkill(last.id).tags;
  const tags = findSkill(id).tags;
  return COMBOS.find((c) => prev.includes(c.from) && tags.includes(c.to)) ?? null;
}

/** 매 순간 재사용 대기 시간과 골드 러시·보호막 시간을 줄인다 */
export function tickSkills(state: GameState, dt: number): void {
  for (const id of Object.keys(state.skillCooldowns)) state.skillCooldowns[id] -= dt;
  if (state.goldRushLeft > 0) state.goldRushLeft = Math.max(0, state.goldRushLeft - dt);
  if (state.shieldLeft > 0) state.shieldLeft = Math.max(0, state.shieldLeft - dt);
}
