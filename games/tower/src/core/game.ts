import {
  findDifficulty,
  makeConfig,
  mergeOverrides,
  type ConfigOverrides,
  type DifficultyId,
  type GameConfig,
  type GameMode,
} from './config.ts';
import { BOSS, ELITE, ENEMIES, SELL_REFUND, SHAMAN, SHIELD, SHOP_POOL, SLIMELET, SPLIT, THIEF, findItem } from './data.ts';
import { createRng, type Rng } from './rng.ts';
import { effectiveWeapon, weaponCounts, type WeaponStats } from './sets.ts';
import { PERK, applyPerk, drawChoice, hasPerk } from './perks.ts';
import { SKILL, tickSkills } from './skills.ts';
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
  choice: string[] | null;
  /** 스킬 id → 남은 재사용 대기 시간 */
  skillCooldowns: Record<string, number>;
  /** 골드 러시 남은 시간 */
  goldRushLeft: number;
  /** 무기 id (가시는 'thorns') 별로 실제로 준 피해 */
  damageByWeapon: Record<string, number>;
  /** 화면 연출용. 그리는 쪽이 읽고 비운다. */
  events: GameEvent[];
}

export interface CreateGameOptions {
  seed?: number;
  difficulty?: DifficultyId;
  mode?: GameMode;
  /** 난이도 설정 위에 덮어쓴다 */
  config?: ConfigOverrides;
}

export function createGame(opts: CreateGameOptions = {}): GameState {
  const difficulty = opts.difficulty ?? 'normal';
  const config = makeConfig(mergeOverrides(findDifficulty(difficulty).overrides, opts.config ?? {}));
  const state: GameState = {
    config,
    difficulty,
    mode: opts.mode ?? 'classic',
    rng: createRng(opts.seed ?? Date.now()),
    time: 0,
    round: 1,
    roundTime: 0,
    status: 'playing',
    gold: config.economy.startGold,
    tower: {
      x: config.width / 2,
      y: config.height / 2,
      radius: config.tower.radius,
      hp: config.tower.maxHp,
      maxHp: config.tower.maxHp,
      regen: config.tower.regen,
      armor: config.tower.armor,
      damageMul: 1,
      bonusIncome: 0,
      attackSpeedMul: 1,
      critChance: 0,
      thorns: 0,
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
    skillCooldowns: {},
    goldRushLeft: 0,
    damageByWeapon: {},
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
  state.spawnedThisRound = 0;
  state.rerollCount = 0;
  fillShop(state);
  state.events.push({ kind: 'round', round });
  if (hasPerk(state, 'interest')) state.gold += Math.min(PERK.interestMax, Math.floor(state.gold * PERK.interestRate));
  const { totalRounds, waves, endless } = state.config;
  const bossRound = state.mode === 'endless' ? round % endless.bossEvery === 0 : round === totalRounds;
  if (bossRound) {
    spawnBoss(state, state.mode === 'endless' ? round / endless.bossEvery : 1);
  } else if (waves.eliteEvery > 0 && round % waves.eliteEvery === 0) {
    spawnElite(state);
  }
  const { perks } = state.config;
  if (perks.every > 0 && round % perks.every === 0) {
    state.choice = drawChoice(state, perks.cards);
    state.events.push({ kind: 'choice' });
  }
}

/** 보상 카드 중 하나를 고른다 */
export function choosePerk(state: GameState, index: number): boolean {
  const id = state.choice?.[index];
  if (!id) return false;
  state.choice = null;
  applyPerk(state, id);
  state.events.push({ kind: 'perk', id });
  return true;
}

/** n 번째 보스 (무한 모드에서는 나올 때마다 강해진다) */
function spawnBoss(state: GameState, n: number): void {
  const { endless } = state.config;
  const p = randomEdgePoint(state);
  const boss = spawnEnemy(state, BOSS, p.x, p.y);
  boss.maxHp *= endless.bossHpGrowth ** (n - 1);
  boss.hp = boss.maxHp;
  boss.atk *= endless.bossAtkGrowth ** (n - 1);
  boss.bounty *= endless.bossBountyGrowth ** (n - 1);
  state.events.push({ kind: 'boss', n });
}

/** 지금 나올 수 있는 가장 튼튼한 적을 크게 키운 정예 */
function spawnElite(state: GameState): void {
  // 특수 능력이 있는 적(방패병 등)은 정예로 키우지 않는다: 너무 가파른 난이도 벽이 된다
  const pool = ENEMIES.filter((e) => e.minRound <= state.round && !e.ability);
  const base = pool.reduce((a, b) => (b.hp > a.hp ? b : a));
  const p = randomEdgePoint(state);
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

function spawnDueEnemies(state: GameState): void {
  const count = enemyCountForRound(state.config, state.round);
  if (count <= 0) return;
  const interval = (state.config.roundSeconds * state.config.waves.spawnWindow) / count;
  while (state.spawnedThisRound < count && state.roundTime >= state.spawnedThisRound * interval) {
    const p = randomEdgePoint(state);
    spawnEnemy(state, pickEnemyDef(state), p.x, p.y);
    state.spawnedThisRound++;
  }
}

function pickEnemyDef(state: GameState): EnemyDef {
  const pool = ENEMIES.filter((e) => e.minRound <= state.round);
  const total = pool.reduce((sum, e) => sum + e.weight, 0);
  let roll = state.rng.next() * total;
  for (const def of pool) {
    roll -= def.weight;
    if (roll < 0) return def;
  }
  return pool[pool.length - 1];
}

function randomEdgePoint(state: GameState): Point {
  const { width, height } = state.config;
  const r = state.rng;
  switch (r.int(4)) {
    case 0:
      return { x: r.range(0, width), y: 0 };
    case 1:
      return { x: width, y: r.range(0, height) };
    case 2:
      return { x: r.range(0, width), y: height };
    default:
      return { x: 0, y: r.range(0, height) };
  }
}

/** 현재 라운드 기준으로 강해진 적을 (x, y)에 만든다. */
export function spawnEnemy(state: GameState, def: EnemyDef, x: number, y: number): Enemy {
  const isBoss = def === BOSS;
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
    const speed = e.speed * (slowed ? e.slowFactor : 1);
    if (slowed) e.slowTimeLeft = Math.max(0, e.slowTimeLeft - dt);

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
    // 주술사는 멀찍이 멈춰 선다
    const stopAt = e.def.ability === 'healer' ? Math.max(contact, SHAMAN.stopDistance) : contact;
    if (dist > stopAt) {
      const next = Math.max(stopAt, dist - moveSpeed * dt);
      e.x = t.x + (dx / dist) * next;
      e.y = t.y + (dy / dist) * next;
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
    if (slowed && e.slowFactor === 0) continue;
    const touching = Math.hypot(e.x - t.x, e.y - t.y) <= contact + 1e-9;
    if (!touching || e.attackCooldown > 0) continue;
    if (e.def.ability === 'thief') {
      const amount = Math.min(Math.floor(state.gold), THIEF.baseSteal + THIEF.perRound * state.round);
      state.gold -= amount;
      e.stolen += amount;
      e.fleeing = true;
      state.events.push({ kind: 'steal', at: { x: e.x, y: e.y }, amount });
      continue;
    }
    const amount = towerDamageTaken(state.config, e.atk, t.armor);
    t.hp = Math.max(0, t.hp - amount);
    e.attackCooldown = e.def.atkInterval;
    state.events.push({ kind: 'towerHit', amount });
    if (t.thorns > 0) dealDamage(state, 'thorns', e, t.thorns, false);
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
  const counts = weaponCounts(state);
  for (const w of state.weapons) {
    w.cooldownLeft -= dt;
    if (w.cooldownLeft > 0) continue;
    const stats = effectiveWeapon(state, w.def, counts, w.level);
    // 공성(광역) 무기는 날아다니는 적을 노리지 못한다
    const target = nearestInRange(state, stats.range, stats.behavior.kind === 'splash');
    if (!target) continue;
    fire(state, w.def, stats, target);
    w.cooldownLeft = stats.cooldown;
  }
}

function alive(state: GameState): Enemy[] {
  return state.enemies.filter((e) => e.hp > 0);
}

function isFlying(e: Enemy): boolean {
  return e.def.ability === 'flying';
}

function nearestInRange(state: GameState, range: number, groundOnly = false, exclude?: Enemy): Enemy | null {
  const t = state.tower;
  let best: Enemy | null = null;
  let bestDist = Infinity;
  for (const e of alive(state)) {
    if (groundOnly && isFlying(e)) continue;
    if (e === exclude) continue;
    const d = Math.hypot(e.x - t.x, e.y - t.y);
    if (d - e.radius <= range && d < bestDist) {
      best = e;
      bestDist = d;
    }
  }
  return best;
}

function fire(state: GameState, def: WeaponDef, stats: WeaponStats, target: Enemy): void {
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
        const second = nearestInRange(state, stats.range, false, target);
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
      e.bounty * (hasPerk(state, 'bounty_hunter') ? PERK.bountyHunter : 1) * (state.goldRushLeft > 0 ? SKILL.goldRushMul : 1);
    state.gold += bounty + e.stolen;
    state.kills++;
    state.events.push({ kind: 'kill', at: { x: e.x, y: e.y }, bounty: bounty + e.stolen, enemyId: e.id });
    if (e.def.ability === 'split') splits.push(e);
    if (hasPerk(state, 'vampiric')) state.tower.hp = Math.min(state.tower.maxHp, state.tower.hp + PERK.vampiricHeal);
    if (hasPerk(state, 'corpse_blast')) corpses.push(e);
    if (e.isBoss) {
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
  state.shop = Array.from({ length: state.config.shop.slots }, () => SHOP_POOL[state.rng.int(SHOP_POOL.length)]);
}

export function rerollCost(state: GameState): number {
  if (state.rerollCount === 0 && hasPerk(state, 'free_reroll')) return 0;
  return state.config.shop.rerollBaseCost + state.config.shop.rerollCostStep * state.rerollCount;
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
  if (item.kind === 'weapon' && state.weapons.length >= state.config.tower.weaponSlots && !mergesOnBuy(state, item)) {
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
    state.weapons.push({ def: item, cooldownLeft: 0, level: 1 });
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
    const used = new Set(same.slice(0, count));
    const def = same[0].def;
    state.weapons = state.weapons.filter((w) => !used.has(w));
    state.weapons.push({ def, cooldownLeft: 0, level: level + 1 });
    state.events.push({ kind: 'merge', weaponId: id, level: level + 1 });
  }
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
