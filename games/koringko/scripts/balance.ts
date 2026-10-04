// 균형 확인: 봇이 직업 · 레벨 · 지역별로 싸워 본다.  node scripts/balance.ts
import { newSave, gainExp, learn } from '../src/core/character.ts';
import { classSkills, expToNext, HERO_ORDER, skillForKey } from '../src/core/classes.ts';
import { refreshStats } from '../src/core/combat.ts';
import { changeMap, enterRift, newGame, step, type Game } from '../src/core/game.ts';
import { makeItem } from '../src/core/items.ts';
import { castCheck } from '../src/core/player.ts';
import { createRng } from '../src/core/rng.ts';
import { SLOTS, type HeroId, type Rarity } from '../src/core/types.ts';
import type { Input } from '../src/core/world.ts';
import { isSolid, TILE, type MapId } from '../src/core/maps.ts';

/** 타일 너비 우선 탐색: 목표로 가는 다음 칸 중심 */
function nextStep(g: Game, tx: number, ty: number): { x: number; y: number } | null {
  const m = g.world.map;
  const p = g.world.player;
  const sx = Math.floor(p.x / TILE);
  const sy = Math.floor(p.y / TILE);
  const prev = new Map<number, number>();
  const key = (x: number, y: number) => y * m.w + x;
  const q = [key(tx, ty)];
  prev.set(q[0], -1);
  for (let i = 0; i < q.length && i < 6000; i++) {
    const k = q[i];
    const x = k % m.w;
    const y = (k - x) / m.w;
    if (x === sx && y === sy) {
      const n = prev.get(k)!;
      if (n < 0) return null;
      const nx = n % m.w;
      return { x: nx * TILE + TILE / 2, y: ((n - nx) / m.w) * TILE + TILE / 2 };
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ax = x + dx;
      const ay = y + dy;
      if (ax < 0 || ay < 0 || ax >= m.w || ay >= m.h || isSolid(m, ax, ay) || prev.has(key(ax, ay))) continue;
      prev.set(key(ax, ay), k);
      q.push(key(ax, ay));
    }
  }
  return null;
}

function hero(h: HeroId, lv: number, rarity: Rarity): Game {
  const s = newSave(h, 'bot');
  while (s.lv < lv) gainExp(s, expToNext(s.lv) - s.exp);
  const rng = createRng(lv * 7 + h.length);
  for (const slot of SLOTS) s.gear[slot] = makeItem(rng, { ilvl: lv, slot, hero: h, rarity, uid: slot });
  for (let i = 0; i < 99 && s.skillPts > 0; i++) for (const sk of classSkills(h)) learn(s, sk.id);
  s.potions = { hp: 8, sp: 5 };
  const g = newGame(s, 11);
  refreshStats(g);
  s.hp = g.stats.maxHp;
  s.sp = g.stats.maxSp;
  return g;
}

function bot(g: Game): Input {
  const w = g.world;
  const p = w.player;
  const ranged = g.save.hero === 'ruru' || g.save.hero === 'nabi';
  let best = null as null | (typeof w.monsters)[number];
  let bd = 1e9;
  for (const m of w.monsters) {
    if (m.hp <= 0 || m.spawnLeft > 0) continue;
    const d = Math.hypot(m.x - p.x, m.y - p.y);
    if (d < bd) [best, bd] = [m, d];
  }
  const inp: Input = { move: { x: 0, y: 0 }, attack: false, attackPressed: false, roll: false, skill: null, potion: null };
  if (g.save.hp < g.stats.maxHp * 0.4) inp.potion = 'hp';
  else if (g.save.sp < 15) inp.potion = 'sp';
  // 위험한 장판에서 구르기
  for (const h of w.hazards) if (h.from === 'monster' && h.delay > 0 && h.shape.type === 'circle' && Math.hypot(h.shape.x - p.x, h.shape.y - p.y) < h.shape.r + 6) {
    const a = Math.atan2(p.y - h.shape.y, p.x - h.shape.x);
    inp.move = { x: Math.cos(a), y: Math.sin(a) };
    inp.roll = true;
    return inp;
  }
  if (!best) return inp;
  const want = ranged ? 110 : 26;
  const dx = best.x - p.x;
  const dy = best.y - p.y;
  if (bd > want) {
    const n = bd > 60 ? nextStep(g, Math.floor(best.x / TILE), Math.floor(best.y / TILE)) : null;
    if (n) {
      const d = Math.hypot(n.x - p.x, n.y - p.y) || 1;
      inp.move = { x: (n.x - p.x) / d, y: (n.y - p.y) / d };
    } else inp.move = { x: dx / bd, y: dy / bd };
  }
  else if (ranged && bd < 60) inp.move = { x: -dx / bd, y: -dy / bd };
  if (bd < want + 40) {
    inp.attack = true;
    for (const k of ['F', 'D', 'S', 'A'] as const) {
      const sk = skillForKey(g.save.hero, k);
      if (sk && castCheck(g, sk.id).ok) {
        inp.skill = k;
        break;
      }
    }
  }
  return inp;
}

interface Result { kills: number; deaths: number; potions: number; time: number; bossDead?: boolean }

function run(g: Game, secs: number, stopOnBoss = false): Result {
  let deaths = 0;
  const p0 = g.save.potions.hp + g.save.potions.sp;
  const k0 = g.save.kills;
  const map = g.world.map.id;
  let t = 0;
  for (; t < secs; t += 1 / 30) {
    step(g, 1 / 30, bot(g));
    for (const e of g.world.events.splice(0)) if (e.kind === 'died') deaths++;
    if (g.world.map.id !== map) break; // 쓰러져 마을로
    if (stopOnBoss && (g.world.boss === 'dead' || g.world.rift?.guardian === 'dead')) break;
  }
  return { kills: g.save.kills - k0, deaths, potions: p0 - (g.save.potions.hp + g.save.potions.sp), time: Math.round(t), bossDead: g.world.boss === 'dead' || g.world.rift?.guardian === 'dead' };
}

const FIELDS: [MapId, number, Rarity][] = [['forest', 3, 'normal'], ['forest', 6, 'normal'], ['candy', 8, 'normal'], ['candy', 11, 'magic'], ['cave', 12, 'magic']];
console.log('── 사냥터 (120초)  처치/분 · 쓰러짐 · 물약');
for (const [m, lv, r] of FIELDS) {
  const row = HERO_ORDER.map((h) => {
    const g = hero(h, lv, r);
    g.save.flags.cave_open = g.save.flags.candy_open = true;
    changeMap(g, m);
    if (m === 'cave') g.world.map = { ...g.world.map, boss: undefined };
    const res = run(g, 120);
    return `${h} ${(res.kills / 2).toFixed(0)}/${res.deaths}/${res.potions}`;
  });
  console.log(`${m} Lv${lv} ${r}: ${row.join('  ')}`);
}
console.log('── 보스 (최대 180초)  걸린 시간 · 쓰러짐');
for (const [lv, r] of [[12, 'magic'], [14, 'magic'], [14, 'rare']] as [number, Rarity][]) {
  const row = HERO_ORDER.map((h) => {
    const g = hero(h, lv, r);
    g.save.flags.cave_open = true;
    changeMap(g, 'cave', 24, 9);
    g.world.monsters = [];
    g.world.map = { ...g.world.map, spawns: [] };
    g.world.respawn = [];
    const res = run(g, 180, true);
    return `${h} ${res.bossDead ? res.time + 's' : 'X'}/${res.deaths}/${res.potions}`;
  });
  console.log(`곰 대장 Lv${lv} ${r}: ${row.join('  ')}`);
}
console.log('── 균열 보스 층 (최대 300초)  수호자 처치 시간 · 쓰러짐');
for (const [depth, r] of [[5, 'rare'], [15, 'rare'], [30, 'rare'], [45, 'unique'], [50, 'unique']] as [number, Rarity][]) {
  const lv = Math.min(50, 8 + depth);
  const row = HERO_ORDER.map((h) => {
    const g = hero(h, lv, r);
    g.save.flags.rift_open = true;
    g.save.riftBest = 60;
    enterRift(g, depth);
    const res = run(g, 300, true);
    return `${h} ${res.bossDead ? res.time + 's' : 'X'}/${res.deaths}/${res.potions}`;
  });
  console.log(`균열 ${depth}층 Lv${lv} ${r}: ${row.join('  ')}`);
}
