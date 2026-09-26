import {
  findDifficulty,
  makeConfig,
  mergeOverrides,
  type ConfigOverrides,
  type DifficultyId,
  type GameConfig,
  type GameMode,
} from './config.ts';
import { BOSS, ELITE, ENEMIES, SHOP_POOL, findItem } from './data.ts';
import { createRng, type Rng } from './rng.ts';
import { effectiveWeapon, weaponCounts, type WeaponStats } from './sets.ts';
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
    damageByWeapon: {},
    events: [],
  };
  for (const id of config.startWeapons) applyItem(state, findItem(id));
  fillShop(state);
  return state;
}

// ───────────────────────── 진행 ─────────────────────────

export function step(state: GameState, dt: number): void {
  if (state.status !== 'playing') return;

  state.time += dt;
  state.roundTime += dt;
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
  const { totalRounds, waves, endless } = state.config;
  const bossRound = state.mode === 'endless' ? round % endless.bossEvery === 0 : round === totalRounds;
  if (bossRound) {
    spawnBoss(state, state.mode === 'endless' ? round / endless.bossEvery : 1);
  } else if (waves.eliteEvery > 0 && round % waves.eliteEvery === 0) {
    spawnElite(state);
  }
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
  const pool = ENEMIES.filter((e) => e.minRound <= state.round);
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
    const dist = Math.hypot(dx, dy);
    const contact = t.radius + e.radius;
    if (dist > contact) {
      const next = Math.max(contact, dist - speed * dt);
      e.x = t.x + (dx / dist) * next;
      e.y = t.y + (dy / dist) * next;
    }

    e.attackCooldown -= dt;
    const touching = Math.hypot(e.x - t.x, e.y - t.y) <= contact + 1e-9;
    if (touching && e.attackCooldown <= 0) {
      const amount = towerDamageTaken(state.config, e.atk, t.armor);
      t.hp = Math.max(0, t.hp - amount);
      e.attackCooldown = e.def.atkInterval;
      state.events.push({ kind: 'towerHit', amount });
      if (t.thorns > 0) dealDamage(state, 'thorns', e, t.thorns, false);
    }
  }
}

// ───────────────────────── 무기 ─────────────────────────

function updateWeapons(state: GameState, dt: number): void {
  const counts = weaponCounts(state);
  for (const w of state.weapons) {
    w.cooldownLeft -= dt;
    if (w.cooldownLeft > 0) continue;
    const stats = effectiveWeapon(state, w.def, counts);
    const target = nearestInRange(state, stats.range);
    if (!target) continue;
    fire(state, w.def, stats, target);
    w.cooldownLeft = stats.cooldown;
  }
}

function alive(state: GameState): Enemy[] {
  return state.enemies.filter((e) => e.hp > 0);
}

function nearestInRange(state: GameState, range: number): Enemy | null {
  const t = state.tower;
  let best: Enemy | null = null;
  let bestDist = Infinity;
  for (const e of alive(state)) {
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
      shot({ x: target.x, y: target.y });
      hit(target);
      if (b.kind === 'slow') {
        target.slowFactor = b.factor;
        target.slowTimeLeft = b.duration;
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
        if (Math.hypot(e.x - at.x, e.y - at.y) <= b.radius + e.radius) hit(e);
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
  dealDamage(state, def.id, e, amount, crit);
}

function dealDamage(state: GameState, source: string, e: Enemy, amount: number, crit: boolean): void {
  const applied = Math.min(amount, Math.max(0, e.hp));
  e.hp -= amount;
  state.damageByWeapon[source] = (state.damageByWeapon[source] ?? 0) + applied;
  state.events.push({ kind: 'hit', at: { x: e.x, y: e.y }, amount, enemyId: e.id, crit });
}

function removeDead(state: GameState): void {
  const survivors: Enemy[] = [];
  for (const e of state.enemies) {
    if (e.hp > 0) {
      survivors.push(e);
      continue;
    }
    state.gold += e.bounty;
    state.kills++;
    state.events.push({ kind: 'kill', at: { x: e.x, y: e.y }, bounty: e.bounty, enemyId: e.id });
    if (e.isBoss) {
      if (state.mode === 'classic') state.status = 'won';
      else state.events.push({ kind: 'bossDown', at: { x: e.x, y: e.y } });
    }
  }
  state.enemies = survivors;
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

export function buyItem(state: GameState, slot: number): boolean {
  if (state.status !== 'playing') return false;
  const item = state.shop[slot];
  if (!item || state.gold < item.price) return false;
  state.gold -= item.price;
  state.shop[slot] = null;
  applyItem(state, item);
  return true;
}

/** 아이템 효과만 적용한다 (골드는 쓰지 않음). */
export function applyItem(state: GameState, item: ItemDef): void {
  if (item.kind === 'weapon') {
    state.weapons.push({ def: item, cooldownLeft: 0 });
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
