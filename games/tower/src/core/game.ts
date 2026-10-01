import {
  findDifficulty,
  makeConfig,
  mergeOverrides,
  type ConfigOverrides,
  type DifficultyId,
  type GameConfig,
  type GameMode,
} from './config.ts';
import {
  BOSSES,
  BOSS_PATTERN,
  ELITE,
  ENEMIES,
  SELL_REFUND,
  SHAMAN,
  SHIELD,
  SHOP_POOL,
  SLIMELET,
  SPLIT,
  THIEF,
  findEnemy,
  findItem,
} from './data.ts';
import { FACES, faceOf, inArc, mainFace, makePlan, pickRoad, roadStart, type Face, type WavePlan } from './faces.ts';
import { findHero, heroPassive, type HeroId } from './heroes.ts';
import type { MetaBonuses } from './meta.ts';
import { createRng, type Rng } from './rng.ts';
import { effectiveWeapon, weaponCounts, type WeaponStats } from './sets.ts';
import { PERK, hasPerk } from './perks.ts';
import { applyReward, drawRewards, type RewardCard } from './rewards.ts';
import { SKILL, meteorDamage, tickSkills, type OwnedSkill } from './skills.ts';
import { ULT, onKill, onTowerHit, tickAction } from './ultimate.ts';
import { INCIDENT, OFFICER, incidentCountMul, incidentEnemyId, isBossRound, isOfficerRound, pincerPlan, rollIncident, type IncidentId } from './incidents.ts';
import type {
  Enemy,
  EnemyDef,
  GameEvent,
  GameStatus,
  ItemDef,
  OwnedWeapon,
  Point,
  Tower,
  WeaponDef,
} from './types.ts';

export interface GameState {
  config: GameConfig;
  difficulty: DifficultyId;
  mode: GameMode;
  rng: Rng;
  time: number;
  round: number;
  roundTime: number;
  status: GameStatus;
  /** 포기해서 끝났는지 (결과 화면 문구) */
  gaveUp: boolean;
  gold: number;
  tower: Tower;
  weapons: OwnedWeapon[];
  enemies: Enemy[];
  shop: (ItemDef | null)[];
  rerollCount: number;
  kills: number;
  spawnedThisRound: number;
  nextEnemyId: number;
  /** 가진 특전 id */
  perks: string[];
  /** 고르는 중인 보상 카드 (있으면 게임이 멈춘다) */
  choice: RewardCard[] | null;
  /** 고르는 동안 또 생긴 보상 (고르고 나면 바로 이어서 나온다) */
  pendingRewards: number;
  /** 스킬 id → 남은 재사용 대기 시간 */
  skillCooldowns: Record<string, number>;
  /** 골드 러시 남은 시간과 배율 */
  goldRushLeft: number;
  goldRushMul: number;
  /** 스킬 칸 (Q W E D 순서) */
  skills: OwnedSkill[];
  /** 합체에 쓴 기본 스킬 (다시 배울 수 없음) */
  consumedSkills: string[];
  /** 얼음 성벽: 받는 피해 감소 남은 시간 */
  shieldLeft: number;
  /** 길을 막은 바리케이드 */
  barricades: { face: Face; left: number; evolved: boolean }[];
  /** 무기 id (가시는 'thorns') 별로 실제로 준 피해 */
  damageByWeapon: Record<string, number>;
  /** 고른 탑 (null 이면 고유 능력 없음) */
  hero: HeroId | null;
  /** 스킬 재사용 대기 배율 (탑 고유 능력 × 영구 강화) */
  skillCooldownMul: number;
  /** 업적 판정용 기록 */
  stats: RunStats;
  /** 바로 전에 나온 보스 id (같은 보스가 연달아 나오지 않게) */
  lastBoss: string | null;
  /** 지금 고른 면 (산 무기가 여기에 붙는다) */
  face: Face;
  /** 탑을 다시 돌릴 수 있을 때까지 남은 시간 */
  rotateLeft: number;
  /** 이번 라운드에 길마다 오는 적의 비율 */
  plan: WavePlan;
  /** 다음 라운드 예보 (라운드가 바뀌면 그대로 plan 이 된다) */
  nextPlan: WavePlan;
  /** 이번 라운드 사건 · 다음 라운드 사건(예보) */
  incident: IncidentId | null;
  nextIncident: IncidentId | null;
  /** 궁극기 게이지 (0 ~ ULT.max) */
  ult: number;
  /** 수호탑 성문 닫기 남은 시간 */
  gateLeft: number;
  /** 직접 때리기 재사용 대기 */
  tapLeft: number;
  /** 연속 처치: 이어진 수 · 끊기기까지 남은 시간 */
  combo: { count: number; left: number };
  /** 화면 연출용. 그리는 쪽이 읽고 비운다. */
  events: GameEvent[];
}

export interface RunStats {
  skillsUsed: number;
  bossesKilled: number;
  /** 가져 본 가장 높은 ★ */
  maxStar: number;
}

export interface CreateGameOptions {
  seed?: number;
  difficulty?: DifficultyId;
  mode?: GameMode;
  /** 고른 탑. 없으면 고유 능력 없이 설정의 시작 무기로 */
  hero?: HeroId;
  /** 영구 강화 효과 */
  meta?: MetaBonuses;
  /** 난이도 설정 위에 덮어쓴다 */
  config?: ConfigOverrides;
}

export function createGame(opts: CreateGameOptions = {}): GameState {
  const difficulty = opts.difficulty ?? 'normal';
  const hero = opts.hero ?? null;
  const passive = heroPassive(hero);
  const meta = opts.meta;
  // 난이도 → 탑 시작 무기 → 영구 해금 → 직접 준 설정 순서로 덮어쓴다
  let overrides = findDifficulty(difficulty).overrides;
  if (hero) overrides = mergeOverrides(overrides, { startWeapons: findHero(hero).startWeapons });
  if (meta) overrides = mergeOverrides(overrides, { lockedItems: meta.lockedItems });
  const config = makeConfig(mergeOverrides(overrides, opts.config ?? {}));
  config.tower.faceSlots += passive.faceSlots ?? 0;
  if (passive.chaosMax) config.chaosRange = [config.chaosRange[0], config.chaosRange[1] * passive.chaosMax];
  const maxHp = config.tower.maxHp + (passive.maxHp ?? 0) + (meta?.maxHp ?? 0);
  const rng = createRng(opts.seed ?? Date.now());
  const plan = makePlan(config, 1, rng, null);
  const mode = opts.mode ?? 'classic';
  const nextIncident = rollIncident(config, 2, mode, rng, null);
  const nextPlan = makePlan(config, 2, rng, plan);
  const state: GameState = {
    config,
    difficulty,
    mode,
    rng,
    time: 0,
    round: 1,
    roundTime: 0,
    status: 'playing',
    gaveUp: false,
    gold: config.economy.startGold + (meta?.startGold ?? 0),
    tower: {
      x: config.width / 2,
      y: config.height / 2,
      radius: config.tower.radius,
      hp: maxHp,
      maxHp,
      regen: config.tower.regen,
      armor: config.tower.armor + (passive.armor ?? 0),
      damageMul: 1 + (meta?.damage ?? 0),
      bonusIncome: 0,
      attackSpeedMul: 1,
      critChance: passive.crit ?? 0,
      thorns: passive.thorns ?? 0,
      rangeBonus: 0,
    },
    weapons: [],
    enemies: [],
    shop: [],
    rerollCount: 0,
    kills: 0,
    spawnedThisRound: 0,
    nextEnemyId: 1,
    perks: [],
    choice: null,
    pendingRewards: 0,
    skillCooldowns: {},
    goldRushLeft: 0,
    goldRushMul: SKILL.goldRushMul,
    skills: config.skills.start.map((id) => ({ id, evolved: false, power: 1 })),
    consumedSkills: [],
    shieldLeft: 0,
    barricades: [],
    damageByWeapon: {},
    hero,
    skillCooldownMul: passive.skillCooldownMul ?? 1,
    stats: { skillsUsed: 0, bossesKilled: 0, maxStar: 1 },
    lastBoss: null,
    // 시작 무기가 1라운드 적이 오는 쪽을 보게
    face: mainFace(plan),
    rotateLeft: 0,
    plan,
    nextPlan: nextIncident === 'pincer' ? pincerPlan(nextPlan) : nextPlan,
    incident: null,
    nextIncident,
    ult: 0,
    gateLeft: 0,
    tapLeft: 0,
    combo: { count: 0, left: 0 },
    events: [],
  };
  for (const id of config.startWeapons) applyItem(state, findItem(id));
  fillShop(state);
  return state;
}

// ───────────────────────── 진행 ─────────────────────────

export function step(state: GameState, dt: number): void {
  if (state.status !== 'playing' || state.choice) return;

  state.time += dt;
  state.roundTime += dt;
  tickSkills(state, dt);
  tickAction(state, dt);
  if (state.rotateLeft > 0) state.rotateLeft = Math.max(0, state.rotateLeft - dt);
  const { config } = state;
  const hasNextRound = state.mode === 'endless' || state.round < config.totalRounds;
  if (state.roundTime >= config.roundSeconds && hasNextRound) {
    state.roundTime -= config.roundSeconds;
    beginRound(state, state.round + 1);
  }

  spawnDueEnemies(state);

  state.gold += incomePerSecond(state) * dt;
  const t = state.tower;
  t.hp = Math.min(t.maxHp, t.hp + t.regen * dt);

  updateEnemies(state, dt);
  updateWeapons(state, dt);
  removeDead(state);

  if (state.status === 'playing' && t.hp <= 0) state.status = 'lost';
}

function beginRound(state: GameState, round: number): void {
  state.round = round;
  state.plan = state.nextPlan;
  state.incident = state.nextIncident;
  state.nextPlan = makePlan(state.config, round + 1, state.rng, state.plan);
  state.nextIncident = rollIncident(state.config, round + 1, state.mode, state.rng, state.incident);
  if (state.nextIncident === 'pincer') state.nextPlan = pincerPlan(state.nextPlan);
  state.spawnedThisRound = 0;
  state.rerollCount = 0;
  fillShop(state);
  state.events.push({ kind: 'round', round });
  if (state.incident) state.events.push({ kind: 'incident', id: state.incident });
  if (hasPerk(state, 'interest')) state.gold += Math.min(PERK.interestMax, Math.floor(state.gold * PERK.interestRate));
  const heal = heroPassive(state.hero).roundHealPct ?? 0;
  if (heal > 0) state.tower.hp = Math.min(state.tower.maxHp, state.tower.hp + state.tower.maxHp * heal);
  const { endless } = state.config;
  if (isBossRound(state.config, round, state.mode)) {
    spawnBoss(state, state.mode === 'endless' ? round / endless.bossEvery : 1);
  } else if (isOfficerRound(state.config, round, state.mode)) {
    spawnOfficer(state);
  }
  const { rewards } = state.config;
  if (rewards.every > 0 && round % rewards.every === 0) offerReward(state);
}

/** 보상 카드를 띄운다. 이미 고르는 중이면 고른 뒤에 이어서 */
function offerReward(state: GameState): void {
  if (state.choice) {
    state.pendingRewards++;
    return;
  }
  state.choice = drawRewards(state, state.config.rewards.cards);
  state.events.push({ kind: 'choice' });
}

/** 탑이 e 에게 받는 피해 배율: 얼음 성벽, 수호탑의 빈 면 */
function hitMul(state: GameState, e: Enemy): number {
  const shield = (state.shieldLeft > 0 ? SKILL.shieldMul : 1) * (state.gateLeft > 0 ? ULT.gateMul : 1);
  const empty = heroPassive(state.hero).emptyFaceDamage;
  const face = faceOf(e.x - state.tower.x, e.y - state.tower.y);
  return shield * (empty !== undefined && faceWeaponCount(state, face) === 0 ? empty : 1);
}

/** 보상 카드 중 하나를 고른다 */
export function chooseReward(state: GameState, index: number): boolean {
  const card = state.choice?.[index];
  if (!card) return false;
  state.choice = null;
  applyReward(state, card);
  if (state.pendingRewards > 0) {
    state.pendingRewards--;
    offerReward(state);
  }
  return true;
}

/** n 번째 보스 (무한 모드에서는 나올 때마다 강해진다). 셋 중 하나, 바로 전 보스는 빼고 */
function spawnBoss(state: GameState, n: number): void {
  const { endless } = state.config;
  const options = BOSSES.filter((b) => b.id !== state.lastBoss);
  const def = options[state.rng.int(options.length)];
  state.lastBoss = def.id;
  const p = roadStart(state.config, mainFace(state.plan));
  const boss = spawnEnemy(state, def, p.x, p.y);
  boss.maxHp *= endless.bossHpGrowth ** (n - 1);
  boss.hp = boss.maxHp;
  boss.atk *= endless.bossAtkGrowth ** (n - 1);
  boss.bounty *= endless.bossBountyGrowth ** (n - 1);
  state.events.push({ kind: 'boss', n, id: def.id });
}

/** 정예가 될 적: 지금 나올 수 있는 가장 튼튼한 적 (특수 능력이 있는 적은 너무 가파른 벽이 되니 빼고) */
function eliteBase(state: GameState): EnemyDef {
  const pool = ENEMIES.filter((e) => e.minRound <= state.round && !e.ability);
  return pool.reduce((a, b) => (b.hp > a.hp ? b : a));
}

/** 중간 장수: 장수 하나의 기술을 쓰고, 그 라운드 정예의 몇 배 체력. 잡아도 판은 이어진다 */
function spawnOfficer(state: GameState): void {
  const boss = BOSSES[state.rng.int(BOSSES.length)];
  const p = roadStart(state.config, mainFace(state.plan));
  const e = spawnEnemy(state, boss, p.x, p.y);
  const eliteHp = eliteBase(state).hp * state.config.waves.hpGrowth ** (state.round - 1) * ELITE.hpMul;
  e.maxHp = eliteHp * OFFICER.eliteMul;
  e.hp = e.maxHp;
  e.atk = boss.atk * OFFICER.atkMul;
  e.bounty = OFFICER.bounty;
  e.radius = boss.radius - OFFICER.radiusLess;
  e.isBoss = false;
  e.isOfficer = true;
  state.events.push({ kind: 'officer', id: boss.id, name: `${boss.name}의 부관` });
}

/** 지금 나올 수 있는 가장 튼튼한 적을 크게 키운 정예 */
export function spawnElite(state: GameState): void {
  const base = eliteBase(state);
  const p = roadStart(state.config, mainFace(state.plan));
  const e = spawnEnemy(state, base, p.x, p.y);
  e.maxHp *= ELITE.hpMul;
  e.hp = e.maxHp;
  e.atk *= ELITE.atkMul;
  e.bounty *= ELITE.bountyMul;
  e.radius += ELITE.radiusBonus;
  e.isElite = true;
  state.events.push({ kind: 'elite', name: base.name });
}

export function enemyCountForRound(config: GameConfig, round: number): number {
  return config.waves.baseCount + config.waves.countPerRound * (round - 1);
}

/** 이번 라운드에 실제로 나오는 적 수 (사건 반영) */
export function roundEnemyCount(state: GameState, round = state.round, incident = state.incident): number {
  return Math.round(enemyCountForRound(state.config, round) * incidentCountMul(incident));
}

function spawnDueEnemies(state: GameState): void {
  const count = roundEnemyCount(state);
  if (count <= 0) return;
  const interval = (state.config.roundSeconds * state.config.waves.spawnWindow) / count;
  while (state.spawnedThisRound < count && state.roundTime >= state.spawnedThisRound * interval) {
    spawnFromRoad(state, pickEnemyDef(state));
    state.spawnedThisRound++;
  }
}

function pickEnemyDef(state: GameState): EnemyDef {
  const forced = incidentEnemyId(state.incident, state.rng);
  if (forced) return findEnemy(forced);
  const pool = ENEMIES.filter((e) => e.minRound <= state.round);
  const total = pool.reduce((sum, e) => sum + e.weight, 0);
  let roll = state.rng.next() * total;
  for (const def of pool) {
    roll -= def.weight;
    if (roll < 0) return def;
  }
  return pool[pool.length - 1];
}

/**
 * 예보 비율대로 고른 길 끝에서 적을 만든다.
 * 땅 적은 길 폭 안에서, 날아다니는 적은 그쪽 가장자리 아무 곳에서 나온다 (대각선으로 날아옴).
 */
export function spawnFromRoad(state: GameState, def: EnemyDef): Enemy {
  const face = pickRoad(state.plan, state.rng);
  const start = roadStart(state.config, face);
  const { width, height, waves } = state.config;
  const r = state.rng;
  const vertical = face === 'n' || face === 's';
  let offset: number;
  if (def.ability === 'flying') {
    // 탑에서 본 방향이 그 길 쪽(45° 안)에 머물 만큼만 옆으로 (예보한 면으로 들어오게)
    const reach = Math.min(vertical ? height / 2 : width / 2, vertical ? width / 2 : height / 2) * 0.95;
    offset = r.range(-reach, reach);
  } else offset = r.range(-waves.roadJitter, waves.roadJitter);
  return spawnEnemy(state, def, vertical ? start.x + offset : start.x, vertical ? start.y : start.y + offset);
}

/** 현재 라운드 기준으로 강해진 적을 (x, y)에 만든다. */
export function spawnEnemy(state: GameState, def: EnemyDef, x: number, y: number): Enemy {
  const isBoss = def.boss !== undefined;
  // 보스는 정해진 능력치 그대로 나온다
  const growth = isBoss ? 0 : state.round - 1;
  const { waves } = state.config;
  const lateRounds = state.mode === 'endless' && !isBoss ? Math.max(0, state.round - state.config.totalRounds) : 0;
  const hp = def.hp * waves.hpGrowth ** growth * state.config.endless.lateHpGrowth ** lateRounds;
  const enemy: Enemy = {
    id: state.nextEnemyId++,
    def,
    x,
    y,
    hp,
    maxHp: hp,
    atk: def.atk * waves.atkGrowth ** growth,
    speed: def.speed,
    radius: def.radius,
    // 무한 모드에서 클래식 끝 라운드 이후에는 현상금이 더 오르지 않는다
    bounty: def.bounty * waves.bountyGrowth ** Math.min(growth, state.config.totalRounds - 1),
    isBoss,
    isElite: false,
    attackCooldown: 0,
    slowFactor: 1,
    slowTimeLeft: 0,
    stolen: 0,
    fleeing: false,
    escaped: false,
    abilityTimer: SHAMAN.interval,
  };
  if (def.boss) {
    enemy.pattern = {
      kind: def.boss.pattern,
      phase: 'idle',
      timer: BOSS_PATTERN.interval[def.boss.pattern],
      phaseLeft: 0,
      staggerDamage: 0,
      enraged: false,
      orbitDir: 1,
    };
  }
  state.enemies.push(enemy);
  return enemy;
}

// ───────────────────────── 적 ─────────────────────────

export function towerDamageTaken(config: GameConfig, atk: number, armor: number): number {
  return atk / (1 + armor * config.armorFactor);
}

function updateEnemies(state: GameState, dt: number): void {
  const t = state.tower;
  for (const e of state.enemies) {
    const slowed = e.slowTimeLeft > 0;
    const frozen = slowed && e.slowFactor === 0;
    if (slowed) e.slowTimeLeft = Math.max(0, e.slowTimeLeft - dt);
    // 보스 패턴: 기를 모으거나 돌진하는 중이면 평소처럼 걷지 않는다
    if (e.pattern && e.hp > 0 && updateBossPattern(state, e, dt, frozen)) continue;
    const speed = e.speed * (slowed ? e.slowFactor : 1);

    const dx = e.x - t.x;
    const dy = e.y - t.y;
    const dist = Math.hypot(dx, dy) || 1;

    if (e.fleeing) {
      // 훔친 도둑은 탑에서 멀어진다
      e.x += (dx / dist) * speed * dt;
      e.y += (dy / dist) * speed * dt;
      const m = THIEF.escapeMargin;
      if (e.x < -m || e.y < -m || e.x > state.config.width + m || e.y > state.config.height + m) e.escaped = true;
      continue;
    }

    // 냉기 오라: 탑 가까이 온 적은 느려진다
    const aura = hasPerk(state, 'frost_aura') && dist <= PERK.frostAuraRadius ? PERK.frostAuraSlow : 1;
    const moveSpeed = speed * aura;
    const contact = t.radius + e.radius;
    // 주술사는 멀찍이 멈춰 서고, 보스는 궤도에서 탑 둘레를 돌며 멀리서 쏜다
    const ranged = !!e.pattern;
    let stopAt =
      e.def.ability === 'healer' ? Math.max(contact, SHAMAN.stopDistance) : ranged ? Math.max(contact, BOSS_PATTERN.orbitRadius) : contact;
    // 바리케이드: 그 길 바깥에 있던 땅 적은 바리케이드 앞에서 멈춘다
    const wall = !isFlying(e) && dist >= SKILL.barricadeDist - 1e-6 ? state.barricades.find((b) => b.face === faceOf(dx, dy)) : undefined;
    if (wall) {
      stopAt = Math.max(stopAt, SKILL.barricadeDist);
      if (wall.evolved && dist <= SKILL.barricadeDist + 1) dealDamage(state, 'barricade', e, meteorDamage(state) * SKILL.barricadeDps * dt, false);
    }
    if (dist > stopAt + 1e-6) {
      const next = Math.max(stopAt, dist - moveSpeed * dt);
      e.x = t.x + (dx / dist) * next;
      e.y = t.y + (dy / dist) * next;
    } else if (e.pattern && !frozen) {
      // 돌진 뒤에는 궤도로 물러나고, 궤도에서는 탑 둘레를 돈다
      const r = Math.min(stopAt, dist + BOSS_PATTERN.retreatSpeed * (slowed ? e.slowFactor : 1) * dt);
      const turn = r >= stopAt - 1e-6 ? e.pattern.orbitDir * BOSS_PATTERN.orbitSpeed * (e.speed / e.def.speed) * (slowed ? e.slowFactor : 1) * dt : 0;
      const a = Math.atan2(dy, dx) + turn;
      e.x = t.x + Math.cos(a) * r;
      e.y = t.y + Math.sin(a) * r;
    }

    if (e.def.ability === 'healer') {
      e.abilityTimer -= dt;
      if (e.abilityTimer <= 0) {
        e.abilityTimer += SHAMAN.interval;
        healAround(state, e);
      }
    }

    e.attackCooldown -= dt;
    // 얼어붙은 적은 공격하지 못한다
    if (frozen) continue;
    const touching = Math.hypot(e.x - t.x, e.y - t.y) <= (ranged ? stopAt : contact) + 1e-9;
    if (!touching || e.attackCooldown > 0) continue;
    if (e.def.ability === 'thief') {
      const amount = Math.min(Math.floor(state.gold), THIEF.baseSteal + THIEF.perRound * state.round);
      state.gold -= amount;
      e.stolen += amount;
      e.fleeing = true;
      state.events.push({ kind: 'steal', at: { x: e.x, y: e.y }, amount });
      continue;
    }
    const amount = towerDamageTaken(state.config, e.atk, t.armor) * hitMul(state, e);
    t.hp = Math.max(0, t.hp - amount);
    e.attackCooldown = e.def.atkInterval;
    onTowerHit(state, amount);
    state.events.push({ kind: 'towerHit', amount, face: faceOf(e.x - t.x, e.y - t.y) });
    // 멀리서 쏘는 적은 가시에 찔리지 않는다
    if (ranged) state.events.push({ kind: 'bossShot', from: { x: e.x, y: e.y }, amount });
    else if (t.thorns > 0) dealDamage(state, 'thorns', e, t.thorns, false);
  }
}

/**
 * 보스 패턴을 진행한다. 이번 순간 보스가 평소처럼 걷고 때리지 않아야 하면(기 모으기·돌진) true.
 * 얼어 있는 동안에는 다음 패턴까지의 시간이 흐르지 않고, 기를 모으다 얼거나 크게 맞으면 끊긴다.
 */
function updateBossPattern(state: GameState, e: Enemy, dt: number, frozen: boolean): boolean {
  const p = e.pattern!;
  const P = BOSS_PATTERN;
  const at = () => ({ x: e.x, y: e.y });
  const interval = () => P.interval[p.kind] * (p.enraged ? P.enrageInterval : 1);
  if (!p.enraged && e.hp < e.maxHp * P.enrageAt) {
    p.enraged = true;
    e.speed *= P.enrageSpeed;
    p.timer = Math.min(p.timer, interval());
    state.events.push({ kind: 'bossEnrage', at: at() });
  }
  switch (p.phase) {
    case 'idle':
      if (frozen) return false;
      p.timer -= dt;
      if (p.timer > 0) return false;
      p.phase = 'windup';
      p.phaseLeft = P.windup[p.kind];
      p.staggerDamage = 0;
      state.events.push({ kind: 'bossWindup', pattern: p.kind, at: at(), duration: p.phaseLeft });
      return true;
    case 'windup':
      if (frozen || p.staggerDamage >= e.maxHp * P.staggerPct) {
        p.phase = 'idle';
        p.timer = interval();
        state.events.push({ kind: 'bossCancel', at: at() });
        return true;
      }
      p.phaseLeft -= dt;
      if (p.phaseLeft <= 0) releasePattern(state, e);
      return true;
    case 'dash': {
      if (frozen) {
        p.phase = 'idle';
        p.timer = interval();
        return true;
      }
      const t = state.tower;
      const dx = e.x - t.x;
      const dy = e.y - t.y;
      const dist = Math.hypot(dx, dy) || 1;
      const contact = t.radius + e.radius;
      const next = Math.max(contact, dist - P.chargeSpeed * dt);
      e.x = t.x + (dx / dist) * next;
      e.y = t.y + (dy / dist) * next;
      if (next <= contact) {
        const amount = towerDamageTaken(state.config, e.atk * P.chargeHitMul, t.armor) * hitMul(state, e);
        t.hp = Math.max(0, t.hp - amount);
        // 들이받힌 면의 무기는 잠시 쏘지 못한다
        const face = faceOf(e.x - t.x, e.y - t.y);
        for (const w of state.weapons) if (w.face === face) w.restLeft = Math.max(w.restLeft, P.chargeStun);
        state.events.push({ kind: 'bossSlam', at: at(), amount, face });
        e.attackCooldown = e.def.atkInterval;
        p.phase = 'idle';
        p.timer = interval();
      }
      return true;
    }
  }
}

function releasePattern(state: GameState, e: Enemy): void {
  const p = e.pattern!;
  const P = BOSS_PATTERN;
  const at = { x: e.x, y: e.y };
  p.phase = 'idle';
  p.timer = P.interval[p.kind] * (p.enraged ? P.enrageInterval : 1);
  p.orbitDir = p.orbitDir === 1 ? -1 : 1;
  switch (p.kind) {
    case 'summon':
      for (let i = 0; i < P.summonCount; i++) {
        const a = (i / P.summonCount) * Math.PI * 2;
        const def = findEnemy(P.summonIds[i % P.summonIds.length]);
        spawnEnemy(state, def, e.x + Math.cos(a) * P.summonSpread, e.y + Math.sin(a) * P.summonSpread);
      }
      state.events.push({ kind: 'bossSummon', at, count: P.summonCount });
      break;
    case 'charge':
      p.phase = 'dash';
      break;
    case 'nova': {
      const t = state.tower;
      const amount = towerDamageTaken(state.config, e.atk * P.novaMul, t.armor) * hitMul(state, e);
      t.hp = Math.max(0, t.hp - amount);
      state.events.push({ kind: 'bossNova', at, amount });
      break;
    }
  }
}

function healAround(state: GameState, healer: Enemy): void {
  for (const other of state.enemies) {
    if (other.hp <= 0 || other.hp >= other.maxHp) continue;
    if (Math.hypot(other.x - healer.x, other.y - healer.y) > SHAMAN.radius) continue;
    other.hp = Math.min(other.maxHp, other.hp + other.maxHp * SHAMAN.healPct);
  }
  state.events.push({ kind: 'heal', at: { x: healer.x, y: healer.y }, radius: SHAMAN.radius });
}

// ───────────────────────── 무기 ─────────────────────────

function updateWeapons(state: GameState, dt: number): void {
  const counts = Object.fromEntries(FACES.map((f) => [f, weaponCounts(state, f)])) as Record<Face, ReturnType<typeof weaponCounts>>;
  for (const w of state.weapons) {
    // 옮긴 무기는 자리 잡는 동안 쏘지 않는다
    if (w.restLeft > 0) {
      w.restLeft -= dt;
      if (w.restLeft > 0) continue;
      w.restLeft = 0;
    }
    w.cooldownLeft -= dt;
    if (w.cooldownLeft > 0) continue;
    const stats = effectiveWeapon(state, w.def, counts[w.face], w.level);
    // 공성(광역) 무기는 날아다니는 적을 노리지 못한다
    // 짙은 안개: 멀리 보이지 않는다
    const range = stats.range * (state.incident === 'fog' ? INCIDENT.fogRangeMul : 1);
    const target = nearestInRange(state, w.face, range, stats.arc, stats.behavior.kind === 'splash');
    if (!target) continue;
    fire(state, w, stats, target);
    w.cooldownLeft = stats.cooldown;
  }
}

function alive(state: GameState): Enemy[] {
  return state.enemies.filter((e) => e.hp > 0);
}

function isFlying(e: Enemy): boolean {
  return e.def.ability === 'flying';
}

/** 그 면 부채꼴·사거리 안에서 탑에 가장 가까운 적 */
function nearestInRange(state: GameState, face: Face, range: number, arc: number, groundOnly = false, exclude?: Enemy): Enemy | null {
  const t = state.tower;
  let best: Enemy | null = null;
  let bestDist = Infinity;
  for (const e of alive(state)) {
    if (groundOnly && isFlying(e)) continue;
    if (e === exclude) continue;
    if (!inArc(face, e.x - t.x, e.y - t.y, arc)) continue;
    const d = Math.hypot(e.x - t.x, e.y - t.y);
    if (d - e.radius <= range && d < bestDist) {
      best = e;
      bestDist = d;
    }
  }
  return best;
}

function fire(state: GameState, w: OwnedWeapon, stats: WeaponStats, target: Enemy): void {
  const def = w.def;
  const t = state.tower;
  const from = { x: t.x, y: t.y };
  const b = stats.behavior;
  const hit = (e: Enemy) => hitWith(state, def, stats, e);
  const shot = (to: Point) => state.events.push({ kind: 'shot', weaponId: def.id, weaponType: def.type, behavior: b.kind, from, to });

  switch (b.kind) {
    case 'single':
    case 'slow': {
      const targets = [target];
      // 다중 사격: 두 번째로 가까운 적에게도 한 발
      if (hasPerk(state, 'multishot')) {
        const second = nearestInRange(state, w.face, stats.range, stats.arc, false, target);
        if (second) targets.push(second);
      }
      for (const tg of targets) {
        shot({ x: tg.x, y: tg.y });
        hit(tg);
        if (b.kind === 'slow') {
          tg.slowFactor = b.factor;
          tg.slowTimeLeft = b.duration;
        }
      }
      return;
    }
    case 'pierce': {
      const d = Math.hypot(target.x - t.x, target.y - t.y) || 1;
      const end = { x: t.x + ((target.x - t.x) / d) * stats.range, y: t.y + ((target.y - t.y) / d) * stats.range };
      shot(end);
      for (const e of alive(state)) {
        if (distToSegment(e, from, end) <= b.width / 2 + e.radius) hit(e);
      }
      return;
    }
    case 'chain': {
      const struck = new Set<Enemy>();
      let current = target;
      let prev: Point = from;
      while (struck.size < b.jumps) {
        state.events.push({
          kind: 'shot',
          weaponId: def.id,
          weaponType: def.type,
          behavior: b.kind,
          from: prev,
          to: { x: current.x, y: current.y },
        });
        struck.add(current);
        hit(current);
        prev = { x: current.x, y: current.y };
        const next = nearestTo(state, prev, b.jumpRange, struck);
        if (!next) break;
        current = next;
      }
      return;
    }
    case 'splash': {
      const at = { x: target.x, y: target.y };
      shot(at);
      state.events.push({ kind: 'splash', at, radius: b.radius });
      for (const e of alive(state)) {
        if (!isFlying(e) && Math.hypot(e.x - at.x, e.y - at.y) <= b.radius + e.radius) hit(e);
      }
      return;
    }
  }
}

function nearestTo(state: GameState, p: Point, maxDist: number, exclude: Set<Enemy>): Enemy | null {
  let best: Enemy | null = null;
  let bestDist = Infinity;
  for (const e of alive(state)) {
    if (exclude.has(e)) continue;
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d <= maxDist && d < bestDist) {
      best = e;
      bestDist = d;
    }
  }
  return best;
}

function distToSegment(p: Point, a: Point, b: Point): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const len2 = abx * abx + aby * aby;
  const u = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.y - a.y) * aby) / len2));
  return Math.hypot(p.x - (a.x + abx * u), p.y - (a.y + aby * u));
}

function hitWith(state: GameState, def: WeaponDef, stats: WeaponStats, e: Enemy): void {
  let amount = stats.damage;
  if (def.type === 'chaos') amount *= state.rng.range(stats.chaosMin, stats.chaosMax);
  const crit = state.tower.critChance > 0 && state.rng.next() < state.tower.critChance;
  if (crit) amount *= 2;
  if ((e.isElite || e.isBoss) && hasPerk(state, 'giant_slayer')) amount *= PERK.giantSlayer;
  if (e.def.ability === 'shield' && SHIELD.types.includes(def.type)) amount *= 1 - SHIELD.reduction;
  dealDamage(state, def.id, e, amount, crit);
}

export function dealDamage(state: GameState, source: string, e: Enemy, amount: number, crit: boolean): void {
  const applied = Math.min(amount, Math.max(0, e.hp));
  e.hp -= amount;
  if (e.pattern?.phase === 'windup') e.pattern.staggerDamage += applied;
  state.damageByWeapon[source] = (state.damageByWeapon[source] ?? 0) + applied;
  state.events.push({ kind: 'hit', at: { x: e.x, y: e.y }, amount, enemyId: e.id, crit });
}

function removeDead(state: GameState): void {
  const survivors: Enemy[] = [];
  const splits: Enemy[] = [];
  const corpses: Enemy[] = [];
  for (const e of state.enemies) {
    if (e.escaped) {
      state.events.push({ kind: 'escape', at: { x: e.x, y: e.y }, amount: e.stolen });
      continue;
    }
    if (e.hp > 0) {
      survivors.push(e);
      continue;
    }
    // 도둑을 잡으면 훔친 골드도 돌아온다
    const bounty =
      e.bounty *
      (hasPerk(state, 'bounty_hunter') ? PERK.bountyHunter : 1) *
      (state.goldRushLeft > 0 ? state.goldRushMul : 1) *
      (state.incident === 'gold' ? INCIDENT.goldMul : 1);
    state.gold += bounty + e.stolen;
    state.kills++;
    state.events.push({ kind: 'kill', at: { x: e.x, y: e.y }, bounty: bounty + e.stolen, enemyId: e.id });
    onKill(state, e);
    if (e.def.ability === 'split') splits.push(e);
    if (e.isElite || e.isOfficer) offerReward(state);
    if (hasPerk(state, 'vampiric')) state.tower.hp = Math.min(state.tower.maxHp, state.tower.hp + PERK.vampiricHeal);
    if (hasPerk(state, 'corpse_blast')) corpses.push(e);
    if (e.isBoss) {
      state.stats.bossesKilled++;
      if (state.mode === 'classic') state.status = 'won';
      else state.events.push({ kind: 'bossDown', at: { x: e.x, y: e.y } });
    }
  }
  state.enemies = survivors;
  // 시체 폭발: 죽은 적 주변이 다친다 (이걸로 죽은 적은 다음 순간 정리된다)
  for (const c of corpses) {
    for (const e of survivors) {
      if (e.hp > 0 && Math.hypot(e.x - c.x, e.y - c.y) <= PERK.corpseRadius) dealDamage(state, 'corpse_blast', e, c.maxHp * PERK.corpsePct, false);
    }
  }
  for (const parent of splits) {
    for (let i = 0; i < SPLIT.count; i++) {
      const off = (i - (SPLIT.count - 1) / 2) * 2 * SPLIT.spread;
      spawnEnemy(state, SLIMELET, parent.x + off, parent.y);
    }
  }
}

// ───────────────────────── 경제 · 상점 ─────────────────────────

export function incomePerSecond(state: GameState): number {
  const eco = state.config.economy;
  return eco.baseIncome + eco.incomePerRound * (state.round - 1) + state.tower.bonusIncome;
}

function fillShop(state: GameState): void {
  const locked = state.config.lockedItems;
  const pool = locked.length ? SHOP_POOL.filter((i) => !locked.includes(i.id)) : SHOP_POOL;
  state.shop = Array.from({ length: state.config.shop.slots }, () => pool[state.rng.int(pool.length)]);
}

export function rerollCost(state: GameState): number {
  if (state.rerollCount === 0 && hasPerk(state, 'free_reroll')) return 0;
  const base = state.config.shop.rerollBaseCost + state.config.shop.rerollCostStep * state.rerollCount;
  return Math.ceil(base * (heroPassive(state.hero).rerollMul ?? 1));
}

export function reroll(state: GameState): boolean {
  if (state.status !== 'playing') return false;
  const cost = rerollCost(state);
  if (state.gold < cost) return false;
  state.gold -= cost;
  state.rerollCount++;
  fillShop(state);
  return true;
}

/** 실제로 내는 가격 (할인 특전 반영) */
export function priceOf(state: GameState, item: ItemDef): number {
  return hasPerk(state, 'discount') ? Math.ceil(item.price * PERK.discount) : item.price;
}

export type BuyCheck = { ok: true } | { ok: false; reason: 'empty' | 'gold' | 'slots' | 'status' };

/** 사면 바로 합쳐지는 무기인가 (같은 ★1 을 이미 count-1 개 가짐) */
export function mergesOnBuy(state: GameState, item: ItemDef): boolean {
  if (item.kind !== 'weapon') return false;
  const same = state.weapons.filter((w) => w.def.id === item.id && w.level === 1).length;
  return same >= state.config.merge.count - 1;
}

export function canBuy(state: GameState, slot: number): BuyCheck {
  if (state.status !== 'playing') return { ok: false, reason: 'status' };
  const item = state.shop[slot];
  if (!item) return { ok: false, reason: 'empty' };
  if (state.gold < priceOf(state, item)) return { ok: false, reason: 'gold' };
  if (item.kind === 'weapon' && faceFull(state, state.face) && !mergesOnBuy(state, item)) {
    return { ok: false, reason: 'slots' };
  }
  return { ok: true };
}

export function buyItem(state: GameState, slot: number): boolean {
  if (!canBuy(state, slot).ok) return false;
  const item = state.shop[slot]!;
  state.gold -= priceOf(state, item);
  state.shop[slot] = null;
  applyItem(state, item);
  return true;
}

/** 아이템 효과만 적용한다 (골드는 쓰지 않음). */
export function applyItem(state: GameState, item: ItemDef): void {
  if (item.kind === 'weapon') {
    state.weapons.push({ def: item, cooldownLeft: 0, level: 1, face: state.face, restLeft: 0 });
    mergeWeapons(state, item.id);
    return;
  }
  const t = state.tower;
  const { stat, amount } = item.effect;
  switch (stat) {
    case 'maxHp':
      t.maxHp += amount;
      t.hp += amount;
      break;
    case 'regen':
      t.regen += amount;
      break;
    case 'armor':
      t.armor += amount;
      break;
    case 'damage':
      t.damageMul += amount;
      break;
    case 'income':
      t.bonusIncome += amount;
      break;
    case 'attackSpeed':
      t.attackSpeedMul = Math.min(state.config.tower.maxAttackSpeedMul, t.attackSpeedMul + amount);
      break;
    case 'crit':
      t.critChance = Math.min(1, t.critChance + amount);
      break;
    case 'thorns':
      t.thorns += amount;
      break;
    case 'range':
      t.rangeBonus += amount;
      break;
  }
}

// ───────────────────────── 합성 · 판매 ─────────────────────────

/** 같은 무기·같은 ★ 가 count 개 모이면 한 단계 위 하나로 합친다 (연달아 합쳐질 수 있음) */
function mergeWeapons(state: GameState, id: string): void {
  const { count, maxLevel } = state.config.merge;
  for (let level = 1; level < maxLevel; level++) {
    const same = state.weapons.filter((w) => w.def.id === id && w.level === level);
    if (same.length < count) continue;
    const parts = same.slice(-count);
    const used = new Set(parts);
    const def = same[0].def;
    state.weapons = state.weapons.filter((w) => !used.has(w));
    state.weapons.push({ def, cooldownLeft: 0, level: level + 1, face: mergedFace(parts), restLeft: 0 });
    state.stats.maxStar = Math.max(state.stats.maxStar, level + 1);
    state.events.push({ kind: 'merge', weaponId: id, level: level + 1 });
  }
}

/** 합친 무기가 남을 면: 재료가 가장 많던 면, 같으면 가장 나중에 들어온 재료의 면 */
function mergedFace(parts: OwnedWeapon[]): Face {
  let best = parts[parts.length - 1].face;
  const count = (f: Face) => parts.filter((p) => p.face === f).length;
  for (const p of parts) if (count(p.face) > count(best)) best = p.face;
  return best;
}

// ───────────────────────── 면 ─────────────────────────

export function faceWeaponCount(state: GameState, face: Face): number {
  return state.weapons.filter((w) => w.face === face).length;
}

export function faceFull(state: GameState, face: Face): boolean {
  return faceWeaponCount(state, face) >= state.config.tower.faceSlots;
}

/** 탑 전체를 90° 돌린다 (dir 1: 시계 방향 북→동). 무기는 쉬지 않고, 다시 돌리려면 기다려야 한다 */
/** 포기하기: 진행 중인 판을 그 자리에서 진 것으로 끝낸다 (보상·기록도 진 판과 같다) */
export function giveUp(state: GameState): boolean {
  if (state.status !== 'playing') return false;
  state.status = 'lost';
  state.gaveUp = true;
  state.choice = null;
  return true;
}

export function rotateTower(state: GameState, dir: 1 | -1): boolean {
  if (state.status !== 'playing' || state.choice || state.rotateLeft > 0) return false;
  for (const w of state.weapons) w.face = FACES[(FACES.indexOf(w.face) + dir + 4) % 4];
  state.rotateLeft = state.config.tower.rotateCooldown;
  state.events.push({ kind: 'rotate', dir });
  return true;
}

/** 산 무기가 붙을 면을 고른다 */
export function selectFace(state: GameState, face: Face): void {
  state.face = face;
}

/** 무기를 다른 면으로 옮긴다. 옮긴 무기는 잠깐 쏘지 않는다 */
export function moveWeapon(state: GameState, index: number, face: Face): boolean {
  if (state.status !== 'playing') return false;
  const w = state.weapons[index];
  if (!w || w.face === face || faceFull(state, face)) return false;
  w.face = face;
  w.restLeft = state.config.tower.moveRest;
  state.events.push({ kind: 'move', weaponId: w.def.id, face });
  return true;
}

/** 팔 때 받는 골드: 산 값 × 들어간 개수(3^(★-1)) × 50% */
export function sellPrice(weapon: OwnedWeapon): number {
  return Math.floor(weapon.def.price * 3 ** (weapon.level - 1) * SELL_REFUND);
}

export function sellWeapon(state: GameState, index: number): number {
  if (state.status !== 'playing') return 0;
  const weapon = state.weapons[index];
  if (!weapon) return 0;
  const amount = sellPrice(weapon);
  state.weapons.splice(index, 1);
  state.gold += amount;
  state.events.push({ kind: 'sell', weaponId: weapon.def.id, amount });
  return amount;
}
