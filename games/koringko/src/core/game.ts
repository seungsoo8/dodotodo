/** 한 판: 저장 내용 + 지금 있는 지도. 매 순간 진행 · 지도 이동 · 죽음과 부활 · 균열 */
import { updateMonsters } from './ai.ts';
import { gainExp } from './character.ts';
import { hasPower, hitMonster, hurtPlayer, refreshStats } from './combat.ts';
import { distPointSegment, type Vec } from './geom.ts';
import { randomMissingPart } from './parts.ts';
import { cleanToy } from './friends.ts';
import { reviveAll } from './tag.ts';
import { liveStructures, openChest, startRescue, structureSpot, updateRescue } from './rescue.ts';
import { frozen, updateFreeze } from './freeze.ts';
import { rollDrops } from './loot.ts';
import { RIFT_MAX, TILE, buildMap, isSolid, type MapId } from './maps.ts';
import { MONSTERS, expFactor } from './monsters.ts';
import { tileCenter, createWorld, refillSpawns, spawnMonster, addDrop, moveCircle, type Input, type Monster, type World, NO_INPUT } from './world.ts';
import { updatePlayer } from './player.ts';
import { errandsHere, onEliteKill, onFriend, onKill, onOverwindKill, onRiftClear, onTagKill, pickErrand, refreshCollect } from './quests.ts';
import { createRng, type Rng } from './rng.ts';
import { applyDifficulty, DIFFICULTY } from './difficulty.ts';
import { rollEliteAffixes } from './elite.ts';
import { rollOffer, type RiftRun } from './riftrun.ts';
import type { ShopOffer } from './shop.ts';
import type { Stats } from './stats.ts';
import type { HeroId, Save } from './types.ts';

export interface Game {
  save: Save;
  world: World;
  rng: Rng;
  stats: Stats;
  /** 잡화점 진열 (마을에 들어올 때마다 새로) */
  shop: ShopOffer[] | null;
  /** 출구를 막 막혔을 때 (같은 말을 계속 하지 않게) */
  lockedAt: number;
  /** 균열 한 판 (없으면 null) */
  run: RiftRun | null;
}

export const TALK_RANGE = 34;
/** 바꿔 든 뒤 이 시간 안에 쓰러뜨리면 교대 기술로 친다 */
export const TAG_KILL = 0.6;
/** 심부름 물건 줍는 거리 */
export const ERRAND_RANGE = 22;
/** 보스를 처음 쓰러뜨리면 주는 특별한 부품 */
export const BOSS_PART: Record<string, string> = { b_bear: 'p_giant', b_jelly: 'p_vampire', b_tin: 'p_thunder', b_dusty: 'p_shockwave', b_king: 'p_phoenix' };
/** 죽으면 잃는 골드 비율 */
export const DEATH_GOLD = 0.1;

export function newGame(save: Save, seed = Date.now()): Game {
  const rng = createRng(seed);
  // 균열 안에서 끝냈으면 마을에서 다시 시작
  const map: MapId = save.map === 'rift' ? 'village' : (save.map as MapId);
  const def = buildMap(map);
  let at: { tx: number; ty: number } | undefined;
  if (save.map === map && save.x > 0) {
    const tx = Math.floor(save.x / TILE);
    const ty = Math.floor(save.y / TILE);
    if (!isSolid(def, tx, ty)) at = { tx, ty };
  }
  const world = createWorld(map, at);
  if (at) {
    world.player.x = save.x;
    world.player.y = save.y;
  }
  const g: Game = { save, world, rng, stats: null as unknown as Stats, shop: null, lockedAt: -99, run: null };
  applyDifficulty(g);
  refreshStats(g);
  if (save.hp <= 1) save.hp = g.stats.maxHp;
  if (save.sp <= 1) save.sp = g.stats.maxSp;
  save.hp = Math.min(save.hp, g.stats.maxHp);
  save.map = map;
  world.events.push({ kind: 'enter', map, name: world.map.name, level: world.map.level });
  return g;
}

/** 다른 지도로 (타일 tx, ty 에 선다) */
export function changeMap(g: Game, id: MapId, tx?: number, ty?: number, depth = 1): void {
  const old = g.world;
  const seed = Math.floor(g.rng.next() * 1e9);
  const w = createWorld(id, tx !== undefined && ty !== undefined ? { tx, ty } : undefined, depth, seed);
  w.events.push(...old.events);
  // 버프 · 재사용 대기는 이어진다
  w.player.skillCd = old.player.skillCd;
  w.player.buffs = old.player.buffs;
  w.player.phoenixCd = old.player.phoenixCd;
  g.world = w;
  applyDifficulty(g);
  g.save.map = id;
  g.save.x = w.player.x;
  g.save.y = w.player.y;
  if (id === 'village') g.shop = null;
  w.events.push({ kind: 'enter', map: id, name: w.map.name, level: w.map.level });
}

export function enterRift(g: Game, depth = g.save.riftDepth): boolean {
  if (!g.save.flags.rift_open) return false;
  const d = Math.max(1, Math.min(RIFT_MAX, depth, g.save.riftBest + 1));
  changeMap(g, 'rift', undefined, undefined, d);
  return true;
}

export type InteractTarget = { kind: 'npc'; id: string } | { kind: 'portal' } | { kind: 'cocoon'; hero: HeroId } | { kind: 'chest'; part: string };

/** 말 걸 수 있는 가까운 것 (NPC · 균열 귀환문 · 먼지 고치 · 보물 상자) */
export function interactTarget(g: Game): InteractTarget | null {
  const w = g.world;
  const p = w.player;
  for (const n of w.map.npcs) {
    if (n.id === 'riftkeeper' && !g.save.flags.rift_open) continue;
    if (Math.hypot(tileCenter(n.x) - p.x, tileCenter(n.y) - p.y) <= TALK_RANGE) return { kind: 'npc', id: n.id };
  }
  if (w.rift?.portal && Math.hypot(w.rift.portal.x - p.x, w.rift.portal.y - p.y) <= TALK_RANGE) return { kind: 'portal' };
  for (const s of liveStructures(g)) {
    const at = structureSpot(s);
    if (Math.hypot(at.x - p.x, at.y - p.y) > TALK_RANGE) continue;
    if (s.kind === 'cocoon') return { kind: 'cocoon', hero: s.id as HeroId };
    return { kind: 'chest', part: s.id ?? '' };
  }
  return null;
}

function interact(g: Game, t: InteractTarget): void {
  const w = g.world;
  if (t.kind === 'npc') w.events.push({ kind: 'talk', npc: t.id });
  else if (t.kind === 'portal') w.events.push({ kind: 'portal' });
  else if (t.kind === 'cocoon') startRescue(g, t.hero);
  else {
    const s = liveStructures(g).find((x) => x.kind === 'chest' && x.id === t.part);
    if (s) openChest(g, s);
  }
}

export function step(g: Game, dt: number, input: Input = NO_INPUT): void {
  const w = g.world;
  const save = g.save;
  w.time += dt;
  save.playTime += dt;

  // 말 걸기: 공격 키를 새로 눌렀고 가까이 누가 있으면 공격 대신 말
  let inp = input;
  if (input.attackPressed && w.player.state !== 'dead') {
    const t = interactTarget(g);
    if (t) {
      interact(g, t);
      inp = { ...input, attack: false, attackPressed: false };
    }
  }

  updateFreeze(g, dt, inp);
  updatePlayer(g, dt, inp);
  if (g.world !== w) return;
  if (!frozen(g)) {
    if (!w.map.safe) {
      triggerBoss(g);
      refillSpawns(w, g.rng, dt);
    }
    updateMonsters(g, dt);
    w.lightsOut = Math.max(0, w.lightsOut - dt);
    updateProjectiles(g, dt);
    updateHazards(g, dt);
  }
  updateDrops(g, dt);
  collectDead(g);
  updateRescue(g);
  checkErrands(g);
  updateRift(g);
  save.x = w.player.x;
  save.y = w.player.y;
  checkWarps(g);
  if (w.player.state === 'dead' && w.player.deadLeft <= 0) respawn(g);
}

// ───────────────────────── 탄 · 장판 ─────────────────────────

function updateProjectiles(g: Game, dt: number): void {
  const w = g.world;
  const p = w.player;
  for (const pr of w.projectiles) {
    if (pr.life <= 0) continue;
    // 돌아오는 도끼
    if (pr.returnAt !== undefined && w.time >= pr.returnAt) {
      const dx = p.x - pr.x;
      const dy = p.y - pr.y;
      const d = Math.hypot(dx, dy) || 1;
      pr.vx = (dx / d) * 260;
      pr.vy = (dy / d) * 260;
      if (pr.returnAt > 0 && w.time - pr.returnAt < dt * 1.5) pr.hit = [];
      if (d < 12) pr.life = 0;
    }
    pr.x += pr.vx * dt;
    pr.y += pr.vy * dt;
    pr.life -= dt;
    const blocked = pr.returnAt === undefined && isSolid(w.map, Math.floor(pr.x / TILE), Math.floor(pr.y / TILE)) && !'~v'.includes(w.map.tiles[Math.floor(pr.y / TILE)]?.[Math.floor(pr.x / TILE)] ?? 'X');
    if (pr.from === 'player') {
      for (const m of w.monsters) {
        if (m.hp <= 0 || m.spawnLeft > 0 || pr.hit.includes(m.id)) continue;
        if (Math.hypot(m.x - pr.x, m.y - pr.y) > m.r + pr.r) continue;
        pr.hit.push(m.id);
        if (pr.explode) {
          explode(g, pr.x, pr.y, pr.explode, pr.damage, pr.skill, pr.burn, pr.basic, pr.pool);
          pr.life = 0;
          break;
        }
        hitMonster(g, m, pr.damage, { skill: pr.skill, basic: pr.basic, knock: 50, dir: { x: pr.vx / Math.hypot(pr.vx, pr.vy), y: pr.vy / Math.hypot(pr.vx, pr.vy) } });
        if (pr.pierce-- <= 0) {
          pr.life = 0;
          break;
        }
      }
      if (pr.life > 0 && (blocked || pr.life <= 0) && pr.explode) explode(g, pr.x, pr.y, pr.explode, pr.damage, pr.skill, pr.burn, pr.basic, pr.pool);
      else if (pr.life <= 0 && pr.explode && pr.hit.length === 0) explode(g, pr.x, pr.y, pr.explode, pr.damage, pr.skill, pr.burn, pr.basic, pr.pool);
    } else if (p.state !== 'dead' && Math.hypot(p.x - pr.x, p.y - pr.y) < p.r + pr.r) {
      if (hurtPlayer(g, pr.damage, { x: pr.x - pr.vx * 0.01, y: pr.y - pr.vy * 0.01 })) pr.life = 0;
    }
    if (blocked) pr.life = 0;
  }
  w.projectiles = w.projectiles.filter((x) => x.life > 0);
}

function explode(g: Game, x: number, y: number, r: number, mult: number, skill: boolean, burn?: number, basic?: boolean, pool?: number): void {
  const w = g.world;
  if (pool) w.hazards.push({ id: w.nextId++, kind: 'flame', shape: { type: 'circle', x, y, r: r * 0.9 }, delay: 0, telegraph: 0, life: 3, from: 'player', damage: pool, tick: 0.5, tickLeft: 0, burn, skill: true, hit: [] });
  w.events.push({ kind: 'explode', at: { x, y }, r, tag: burn ? 'fire' : skill ? 'bomb' : 'orb' });
  for (const m of w.monsters) {
    if (m.hp > 0 && Math.hypot(m.x - x, m.y - y) <= r + m.r) hitMonster(g, m, mult, { skill, burn, basic, knock: 90, dir: { x: m.x - x, y: m.y - y } });
  }
}

function inShape(h: World['hazards'][number], x: number, y: number, r: number): boolean {
  const s = h.shape;
  if (s.type === 'circle') return Math.hypot(x - s.x, y - s.y) <= s.r + r;
  return distPointSegment({ x, y }, { x: s.x1, y: s.y1 }, { x: s.x2, y: s.y2 }) <= s.w / 2 + r;
}

function updateHazards(g: Game, dt: number): void {
  const w = g.world;
  const p = w.player;
  for (const h of w.hazards) {
    if (h.delay > 0) {
      h.delay -= dt;
      if (h.delay > 0) continue;
      // 예고가 끝난 순간 한 번 친다
      fireHazard(g, h);
      if (h.tick > 0) h.tickLeft = h.tick;
      if (h.life <= 0) h.life = -1;
      continue;
    }
    if (h.life === 0) {
      // 예고 없는 장판: 바로 친다
      fireHazard(g, h);
      h.life = -1;
      continue;
    }
    if (h.life < 0) continue;
    h.life -= dt;
    if (h.tick > 0) {
      h.tickLeft -= dt;
      if (h.tickLeft <= 0) {
        h.tickLeft += h.tick;
        h.hit = [];
        fireHazard(g, h);
      }
    } else if (h.from === 'monster' && h.damage > 0 && !h.hit.includes(-1) && inShape(h, p.x, p.y, p.r)) {
      // 남아 있는 몬스터 장판(레이저)은 닿는 순간
      h.hit.push(-1);
      hurtPlayer(g, h.damage, { x: (h.shape as { x1?: number }).x1 ?? p.x, y: (h.shape as { y1?: number }).y1 ?? p.y });
    }
    if (h.life <= 0) h.life = -1;
  }
  w.hazards = w.hazards.filter((h) => h.delay > 0 || h.life > 0);
}

function fireHazard(g: Game, h: World['hazards'][number]): void {
  const w = g.world;
  if (h.shape.type === 'circle' && (h.kind === 'meteor' || h.kind === 'slam' || h.kind === 'leap' || h.kind === 'quake' || h.kind === 'thunder' || h.kind === 'land' || h.kind === 'missile' || h.kind === 'dustRain')) {
    w.events.push({ kind: 'explode', at: { x: h.shape.x, y: h.shape.y }, r: h.shape.r, tag: h.kind });
  }
  if (h.from === 'player') {
    for (const m of w.monsters) {
      if (m.hp <= 0 || h.hit.includes(m.id) || !inShape(h, m.x, m.y, m.r)) continue;
      h.hit.push(m.id);
      hitMonster(g, m, h.damage, { skill: h.skill, stun: h.stun, slow: h.slow, slowFor: h.tick ? h.tick + 0.2 : 1, burn: h.burn, knock: h.kind === 'rain' || h.kind === 'frost' ? 0 : 80, dir: { x: m.x - (h.shape as { x: number }).x, y: m.y - (h.shape as { y: number }).y } });
    }
    return;
  }
  const p = w.player;
  if (h.damage > 0 && !h.hit.includes(-1) && inShape(h, p.x, p.y, p.r)) {
    h.hit.push(-1);
    const c = h.shape.type === 'circle' ? { x: h.shape.x, y: h.shape.y } : { x: h.shape.x1, y: h.shape.y1 };
    const owner = h.owner !== undefined ? w.monsters.find((m) => m.id === h.owner && m.hp > 0) : undefined;
    // 흡혈 정예의 장판이면 그 몬스터가 회복
    hurtPlayer(g, h.damage, c, owner);
  }
}

// ───────────────────────── 떨어진 물건 ─────────────────────────

const PICK = 18;
const MAGNET = 60;

function updateDrops(g: Game, dt: number): void {
  const w = g.world;
  const p = w.player;
  const save = g.save;
  if (p.state === 'dead') return;
  for (const d of w.drops) {
    d.age += dt;
    if (d.age < 0.35) continue;
    const dist = Math.hypot(p.x - d.x, p.y - d.y);
    // 단추 · 사탕 · 재료 · 부품은 끌려온다
    if (dist < MAGNET) {
      const k = Math.min(1, (dt * 220) / Math.max(1, dist));
      d.x += (p.x - d.x) * k;
      d.y += (p.y - d.y) * k;
    }
    if (dist > PICK) continue;
    if (d.kind === 'part' && d.part) {
      if (save.parts[d.part]) save.gold += 100;
      else save.parts[d.part] = 1;
    } else if (d.kind === 'gold') save.gold += d.gold ?? 0;
    else if (d.kind === 'potion') save.potions.hp++;
    else if (d.kind === 'mat') save.mats[d.mat!]++;
    w.events.push({ kind: 'pickup', drop: d.kind, at: { x: d.x, y: d.y }, gold: d.gold, part: d.part, potion: d.potion, mat: d.mat });
    d.age = -1;
    if (d.kind === 'mat') refreshCollect(save);
  }
  w.drops = w.drops.filter((d) => d.age >= 0);
}

/** 심부름 물건 줍기 */
function checkErrands(g: Game): void {
  const w = g.world;
  const p = w.player;
  if (p.state === 'dead') return;
  for (const q of errandsHere(g.save, w.map.id)) {
    const f = q.fetch!;
    if (Math.hypot(tileCenter(f.x) - p.x, tileCenter(f.y) - p.y) > ERRAND_RANGE) continue;
    if (pickErrand(g.save, q.id)) {
      w.events.push({ kind: 'errand', quest: q.id, item: f.item });
      w.events.push({ kind: 'quest', id: q.id, state: 'ready' });
    }
  }
}

// ───────────────────────── 쓰러뜨림 ─────────────────────────

function collectDead(g: Game): void {
  const w = g.world;
  const dead = w.monsters.filter((m) => m.hp <= 0);
  if (!dead.length) return;
  w.monsters = w.monsters.filter((m) => m.hp > 0);
  for (const m of dead) if (!m.merged) onMonsterDeath(g, m);
}

function onMonsterDeath(g: Game, m: Monster): void {
  const w = g.world;
  const save = g.save;
  const rank = m.boss || m.guardian ? 'boss' : m.rank;
  if (hasPower(g, 'frenzy')) {
    w.player.buffs.frenzy = 3;
    refreshStats(g);
  }
  // 서리 정예: 쓰러지면 얼음이 터진다
  if (m.affixes.includes('frost')) w.hazards.push({ id: w.nextId++, kind: 'frostNova', shape: { type: 'circle', x: m.x, y: m.y, r: 50 }, delay: 0.8, telegraph: 0.8, life: 0, from: 'monster', damage: m.atk * 1.2, tick: 0, tickLeft: 0, skill: false, hit: [] });
  const reward = (DIFFICULTY[save.difficulty]?.reward ?? 1) * w.mods.reward;
  const exp = Math.round(m.exp * expFactor(save.lv, m.lv) * reward);
  w.events.push({ kind: 'kill', at: { x: m.x, y: m.y }, monsterId: m.id, defId: m.def.id, rank, boss: !!m.boss, exp });
  save.kills++;
  const before = save.lv;
  gainExp(save, exp);
  if (save.lv > before) {
    refreshStats(g);
    save.hp = g.stats.maxHp;
    save.sp = g.stats.maxSp;
    w.events.push({ kind: 'levelUp', lv: save.lv });
  }
  if (hasPower(g, 'vampire')) save.hp = Math.min(g.stats.maxHp, save.hp + g.stats.maxHp * 0.03);
  // 깨끗해진 장난감: 여러 번 모이면 구출되어 친구가 된다
  if (!m.guardian || m.boss) {
    if (cleanToy(save, m.def.id)) {
      w.events.push({ kind: 'friend', defId: m.def.id, name: m.def.name });
      refreshStats(g);
      for (const id of onFriend(save)) w.events.push({ kind: 'quest', id, state: save.quests[id].state });
    }
  }
  const drops = rollDrops(g.rng, { rank, gold: m.gold, mat: m.def.mat });
  const gold = Math.round(drops.gold * (1 + g.stats.goldPct / 100) * reward);
  if (gold > 0) addDrop(w, g.rng, 'gold', m.x, m.y, { gold });
  if (drops.candy) addDrop(w, g.rng, 'potion', m.x, m.y, { potion: 'hp' });
  // 보스는 처음 쓰러뜨릴 때 특별한 부품, 정예는 가끔 부품
  const bossPart = m.boss && !m.guardian ? BOSS_PART[m.def.id] : undefined;
  const part = bossPart && !save.parts[bossPart] ? bossPart : drops.part ? randomMissingPart(save, g.rng.next(), g.rng.next() < 0.25) : null;
  if (part) addDrop(w, g.rng, 'part', m.x, m.y, { part });
  for (const [k, v] of Object.entries(drops.mats)) for (let i = 0; i < (v ?? 0); i++) addDrop(w, g.rng, 'mat', m.x, m.y, { mat: k as never });
  // 나뉘는 몬스터
  if (m.def.split) {
    for (let i = 0; i < 2; i++) {
      const c = spawnMonster(w, m.def.split, m.x + (i ? 8 : -8), m.y, m.lv, 'normal', m.zone);
      c.spawnLeft = 0.15;
      c.ai.state = 'chase';
    }
  }
  const rule = m.def.summon || m.merge !== undefined ? [] : [...(w.time - w.player.tagAt < TAG_KILL ? onTagKill(save) : []), ...(w.player.buffs.overwind > 0 ? onOverwindKill(save) : [])];
  for (const id of [...onKill(save, m.def.id), ...(m.rank === 'elite' ? onEliteKill(save) : []), ...rule]) w.events.push({ kind: 'quest', id, state: save.quests[id].state });
  if (w.rift && !m.boss && !m.guardian && w.rift.guardian === 'none') w.rift.gauge = Math.min(100, w.rift.gauge + (m.rank === 'elite' ? 15 : 5));
  if (m.boss && !m.guardian) {
    w.boss = 'dead';
    save.flags[`${m.def.id}_dead`] = true;
    w.events.push({ kind: 'bossDown', id: m.def.id, at: { x: m.x, y: m.y } });
  }
  if (m.guardian && w.rift) {
    w.rift.guardian = 'dead';
    w.rift.portal = { x: m.x, y: m.y };
    const depth = w.rift.depth;
    save.riftBest = Math.max(save.riftBest, depth);
    save.riftDepth = Math.min(RIFT_MAX, Math.max(save.riftDepth, depth + 1));
    if (m.boss) {
      save.flags[`${m.def.id}_dead`] = true;
      w.events.push({ kind: 'bossDown', id: m.def.id, at: { x: m.x, y: m.y } });
    }
    for (const id of onRiftClear(save, depth)) w.events.push({ kind: 'quest', id, state: save.quests[id].state });
    if (g.run) g.run.offer = rollOffer(g.rng, g.run.blessings);
    w.events.push({ kind: 'riftClear', depth, at: { x: m.x, y: m.y } });
  }
}

// ───────────────────────── 보스 · 균열 ─────────────────────────

function triggerBoss(g: Game): void {
  const w = g.world;
  const b = w.map.boss;
  if (!b || w.rift || w.boss !== 'none') return;
  const p = w.player;
  if (Math.hypot(tileCenter(b.x) - p.x, tileCenter(b.y) - p.y) > TILE * 8) return;
  const m = spawnMonster(w, b.id, tileCenter(b.x), tileCenter(b.y), b.lv, 'normal');
  m.spawnLeft = 1.2;
  w.boss = 'spawned';
  w.events.push({ kind: 'bossIntro', id: b.id, name: m.name });
}

function updateRift(g: Game): void {
  const w = g.world;
  const r = w.rift;
  if (!r || r.guardian !== 'none' || r.gauge < 100) return;
  r.guardian = 'spawned';
  // 출구 방(마지막 방)에 수호자: 보스 단계면 보스, 아니면 커다란 정예
  const { x, y } = r.exit;
  let m: Monster;
  if (w.map.boss) {
    m = spawnMonster(w, w.map.boss.id, x, y, w.map.boss.lv, 'normal');
    w.events.push({ kind: 'bossIntro', id: m.def.id, name: m.name });
  } else {
    m = spawnMonster(w, r.pool[g.rng.int(r.pool.length)], x, y, r.lv + 1, 'elite', -1, rollEliteAffixes(g.rng, r.depth >= 20 ? 2 : 1));
    m.hp = m.maxHp = m.maxHp * 2.5;
    m.r += 4;
    m.name = `상자 지킴이 · ${m.name}`;
  }
  m.guardian = true;
  m.spawnLeft = 1;
  m.ai.state = 'chase';
  w.events.push({ kind: 'riftGuardian', at: { x, y }, name: m.name });
}

// ───────────────────────── 출구 · 죽음 ─────────────────────────

function checkWarps(g: Game): void {
  const w = g.world;
  const p = w.player;
  if (p.state === 'dead') return;
  const tx = Math.floor(p.x / TILE);
  const ty = Math.floor(p.y / TILE);
  for (const wp of w.map.warps) {
    if (tx < wp.x || tx >= wp.x + wp.w || ty < wp.y || ty >= wp.y + wp.h) continue;
    if (wp.need && !g.save.flags[wp.need]) {
      if (w.time - g.lockedAt > 2) w.events.push({ kind: 'locked', text: wp.locked ?? '아직 갈 수 없다' });
      g.lockedAt = w.time;
      // 한 걸음 뒤로
      moveCircle(w.map, p, -p.dir.x * 10, -p.dir.y * 10, p.r);
      return;
    }
    changeMap(g, wp.to, wp.tx, wp.ty);
    return;
  }
}

/** 균열 귀환문 · 균열에서 나가기 */
export function leaveRift(g: Game): void {
  g.run = null;
  changeMap(g, 'village', 22, 13);
  refreshStats(g);
}

function respawn(g: Game): void {
  const save = g.save;
  const lost = Math.floor(save.gold * DEATH_GOLD);
  save.gold -= lost;
  // 균열 한 판은 여기서 끝, 동료들은 모두 일어난다
  g.run = null;
  reviveAll(g);
  refreshStats(g);
  save.hp = g.stats.maxHp;
  save.sp = g.stats.maxSp;
  changeMap(g, 'village');
  g.world.events.push({ kind: 'respawn', goldLost: lost });
}

/** 몬스터 정의 확인용 */
export function monsterName(id: string): string {
  return MONSTERS[id]?.name ?? id;
}

export type { Vec };
