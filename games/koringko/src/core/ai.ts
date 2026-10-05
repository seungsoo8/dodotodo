/** 몬스터 움직임: 깡충이 · 근접 · 돌진 · 원거리 · 날개 · 보스 */
import { hurtPlayer, tickStatus } from './combat.ts';
import type { Game } from './game.ts';
import { fromAngle, normalize, type Vec } from './geom.ts';
import { MONSTERS } from './monsters.ts';
import { AFFIX } from './elite.ts';
import { FREEZE, callFreeze } from './freeze.ts';
import { BEAR, DUSTY, JELLY, KING, TIN } from './bossrules.ts';
import { moveCircle, spawnMonster, walkable, type BossBrain, type Monster, type World } from './world.ts';

/** 집에서 이만큼 멀어지면 돌아간다 */
const LEASH = 300;
const CONTACT_CD = 0.9;
const MELEE_WINDUP = 0.45;
/** 같은 무리로 함께 덤비는 거리 */
const PACK_RANGE = 110;

export function updateMonsters(g: Game, dt: number): void {
  const w = g.world;
  for (const m of w.monsters) {
    if (m.hp <= 0) continue;
    if (m.spawnLeft > 0) {
      m.spawnLeft = Math.max(0, m.spawnLeft - dt);
      continue;
    }
    const burn = tickStatus(m.status, dt);
    if (burn > 0) {
      m.hp -= burn;
      m.hitAt = w.time;
    }
    m.contactCd = Math.max(0, m.contactCd - dt);
    m.rage = Math.max(0, m.rage - dt);
    if (m.kx || m.ky) {
      moveCircle(w.map, m, m.kx * dt, m.ky * dt, m.r, !!m.def.fly);
      const k = Math.exp(-7 * dt);
      m.kx *= k;
      m.ky *= k;
      if (Math.abs(m.kx) < 1 && Math.abs(m.ky) < 1) m.kx = m.ky = 0;
    }
    if (m.status.stun > 0) continue;
    if (m.boss) updateBoss(g, m, m.boss, dt);
    else if (m.merge !== undefined) updateBlob(g, m, dt);
    else updateNormal(g, m, dt);
    if (m.affixes.length) updateAffixes(g, m, dt);
    // 몸이 닿으면 아프다 (돌진·깡충·날개는 몸이 무기)
    const p = w.player;
    const touching = Math.hypot(p.x - m.x, p.y - m.y) < p.r + m.r - 2;
    const bodyHits = m.def.ai === 'hopper' || m.def.ai === 'flyer' || m.boss || (m.def.ai === 'charger' && m.ai.state === 'dash');
    if (touching && bodyHits && m.contactCd <= 0) {
      if (hurtPlayer(g, m.atk * (m.ai.state === 'dash' ? 1.2 : 0.8), m)) m.contactCd = CONTACT_CD;
    }
  }
  separate(w);
}

function toward(m: Vec, t: Vec): Vec {
  return normalize({ x: t.x - m.x, y: t.y - m.y });
}

function step(w: World, m: Monster, dir: Vec, speed: number, dt: number): void {
  const s = speed * m.status.slow * (m.rage > 0 ? FREEZE.rageSpeed : 1) * dt;
  moveCircle(w.map, m, dir.x * s, dir.y * s, m.r, !!m.def.fly);
}

function updateNormal(g: Game, m: Monster, dt: number): void {
  const w = g.world;
  const p = w.player;
  const ai = m.ai;
  const d = Math.hypot(p.x - m.x, p.y - m.y);
  const alive = p.state !== 'dead';
  ai.timer -= dt;

  // 돌아가는 중: 집에 닿으면 다 낫는다
  if (ai.state === 'return') {
    step(w, m, toward(m, m.home), m.speed * 1.6, dt);
    if (Math.hypot(m.x - m.home.x, m.y - m.home.y) < 12) {
      m.hp = m.maxHp;
      ai.state = 'idle';
    }
    return;
  }
  if (!m.guardian && Math.hypot(m.x - m.home.x, m.y - m.home.y) > LEASH && ai.state !== 'dash') {
    ai.state = 'return';
    return;
  }
  if (ai.state === 'idle') {
    if (alive && d < m.def.aggro) {
      ai.state = 'chase';
      ai.timer = 0;
      alertPack(w, m);
      return;
    }
    // 어슬렁어슬렁
    if (ai.timer <= 0) {
      ai.timer = 1 + g.rng.next() * 2;
      const a = g.rng.next() * Math.PI * 2;
      const back = Math.hypot(m.x - m.home.x, m.y - m.home.y) > 60;
      ai.dir = back ? toward(m, m.home) : g.rng.next() < 0.4 ? { x: 0, y: 0 } : fromAngle(a);
    }
    step(w, m, ai.dir, m.speed * 0.35, dt);
    return;
  }
  // 주인공을 놓치면 어슬렁
  if (!alive || d > m.def.aggro * 2.2) {
    ai.state = 'idle';
    return;
  }
  switch (m.def.ai) {
    case 'hopper':
      if (ai.state === 'hop') {
        step(w, m, ai.dir, m.speed * 3, dt);
        if (ai.timer <= 0) {
          ai.state = 'chase';
          ai.timer = 0.6 + g.rng.next() * 0.3;
        }
      } else if (ai.timer <= 0) {
        ai.state = 'hop';
        ai.dir = toward(m, p);
        ai.timer = 0.28;
      }
      break;
    case 'flyer': {
      // 좌우로 흔들리며 다가온다
      const base = toward(m, p);
      const wob = Math.sin(w.time * 5 + m.id) * 0.8;
      step(w, m, normalize({ x: base.x - base.y * wob, y: base.y + base.x * wob }), m.speed, dt);
      break;
    }
    case 'melee':
      if (ai.state === 'windup') {
        // 맞는 것은 예고 장판이 터질 때
        if (ai.timer <= 0) {
          ai.state = 'recover';
          ai.timer = 0.6;
        }
      } else if (ai.state === 'recover') {
        if (ai.timer <= 0) ai.state = 'chase';
      } else if (d <= (m.def.reach ?? 20) + p.r) {
        ai.state = 'windup';
        ai.timer = MELEE_WINDUP;
        ai.dir = toward(m, p);
        const reach = m.def.reach ?? 20;
        hazardAt(w, 'claw', m.x + ai.dir.x * reach * 0.6, m.y + ai.dir.y * reach * 0.6, reach * 0.7, m.atk, MELEE_WINDUP, 0, m.id);
        w.events.push({ kind: 'windup', at: { x: m.x, y: m.y }, monsterId: m.id });
      } else step(w, m, toward(m, p), m.speed, dt);
      break;
    case 'charger':
      if (ai.state === 'windup') {
        if (ai.timer <= 0) {
          ai.state = 'dash';
          ai.timer = 0.45;
        }
      } else if (ai.state === 'dash') {
        step(w, m, ai.dir, m.speed * 3.8, dt);
        if (ai.timer <= 0) {
          ai.state = 'recover';
          ai.timer = 0.8;
        }
      } else if (ai.state === 'recover') {
        if (ai.timer <= 0) ai.state = 'chase';
      } else if (d < 120) {
        ai.state = 'windup';
        ai.timer = 0.5;
        ai.dir = toward(m, p);
        lineAt(w, 'dashLine', { x: m.x, y: m.y }, ai.dir, m.speed * 3.8 * 0.45 + m.r, m.r * 2, 0, 0.5, 0);
        w.events.push({ kind: 'windup', at: { x: m.x, y: m.y }, monsterId: m.id });
      } else step(w, m, toward(m, p), m.speed, dt);
      break;
    case 'ranged': {
      const shot = m.def.shot!;
      if (ai.state === 'windup') {
        if (ai.timer <= 0) {
          fire(w, m, toward(m, p), shot.count, shot.spread, shot.speed, m.atk);
          ai.state = 'chase';
          ai.timer = shot.interval;
        }
        break;
      }
      // 알맞은 거리 지키기
      const dir = toward(m, p);
      if (d < 90) step(w, m, { x: -dir.x, y: -dir.y }, m.speed, dt);
      else if (d > 160) step(w, m, dir, m.speed, dt);
      else step(w, m, { x: -dir.y, y: dir.x }, m.speed * 0.4 * Math.sin(w.time + m.id), dt);
      if (ai.timer <= 0 && d < 220) {
        ai.state = 'windup';
        ai.timer = 0.4;
        lineAt(w, 'aim', { x: m.x, y: m.y }, dir, Math.min(220, d + 30), 3, 0, 0.4, 0);
        w.events.push({ kind: 'windup', at: { x: m.x, y: m.y }, monsterId: m.id });
      }
      break;
    }
  }
}

/** 몬스터 탄 (count 발을 spread 라디안씩 벌려서) */
export function fire(w: World, m: Monster, dir: Vec, count: number, spread: number, speed: number, damage: number, kind = 'spit'): void {
  const base = Math.atan2(dir.y, dir.x);
  for (let i = 0; i < count; i++) {
    const a = base + (i - (count - 1) / 2) * spread;
    w.projectiles.push({ id: w.nextId++, kind, x: m.x, y: m.y - 2, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 4, damage, from: 'monster', pierce: 0, life: 3, hit: [], skill: false, basic: false });
  }
  w.events.push({ kind: 'monsterShot', at: { x: m.x, y: m.y } });
}

/** 몬스터끼리 겹치지 않게 살짝 민다 */
function separate(w: World): void {
  const ms = w.monsters;
  for (let i = 0; i < ms.length; i++) {
    const a = ms[i];
    if (a.hp <= 0) continue;
    for (let j = i + 1; j < ms.length; j++) {
      const b = ms[j];
      if (b.hp <= 0) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy);
      const min = a.r + b.r;
      if (d >= min || d === 0) continue;
      const push = (min - d) / 2;
      const ux = dx / d;
      const uy = dy / d;
      // 보스는 밀리지 않는다
      const wa = a.boss ? 0 : b.boss ? 1 : 0.5;
      const wb = b.boss ? 0 : a.boss ? 1 : 0.5;
      moveCircle(w.map, a, -ux * push * wa * 2, -uy * push * wa * 2, a.r, !!a.def.fly);
      moveCircle(w.map, b, ux * push * wb * 2, uy * push * wb * 2, b.r, !!b.def.fly);
    }
  }
}

// ───────────────────────── 보스 ─────────────────────────

const CYCLES: Record<string, string[][]> = {
  bear: [['charge', 'slam', 'summon'], ['charge', 'charge', 'slam', 'summon']],
  jelly: [['ring', 'hop'], ['ring', 'hop', 'ring']],
  tin: [['volley', 'magnet', 'summon'], ['laser', 'magnet', 'volley', 'summon', 'magnet']],
  dusty: [['spiral', 'lights', 'clones', 'burst'], ['spiral', 'blink', 'clones', 'lights', 'rain']],
  king: [['spiral', 'rain', 'charge', 'summon'], ['freezeCall', 'laser', 'spiral', 'rain', 'charge', 'summon'], ['freezeCall', 'laser', 'spiral', 'rain', 'blink', 'burst', 'charge']],
};
const MINION: Record<string, string> = { bear: 'marble', jelly: 'jellet', tin: 'mouse', dusty: 'dustling', king: 'shadow' };

export function bossPhase(b: BossBrain, ratio: number): number {
  if (b.id === 'king') return ratio < 0.3 ? 3 : ratio < 0.65 ? 2 : 1;
  return ratio < 0.5 ? 2 : 1;
}

function hazardAt(w: World, kind: string, x: number, y: number, r: number, damage: number, delay: number, life = 0, owner?: number, tick = 0): void {
  w.hazards.push({ id: w.nextId++, kind, shape: { type: 'circle', x, y, r }, delay, telegraph: delay, life, from: 'monster', damage, tick, tickLeft: 0, skill: false, hit: [], owner });
}

/** 정예 성질: 불꽃 발자국 · 순간이동 */
function updateAffixes(g: Game, m: Monster, dt: number): void {
  const w = g.world;
  const p = w.player;
  m.affixT += dt;
  if (m.affixes.includes('fire') && m.affixT % AFFIX.fireEvery < dt) hazardAt(w, 'fireTrail', m.x, m.y + m.r * 0.4, 12, m.atk * 0.35, 0, 2.5, m.id, 0.5);
  if (m.affixes.includes('blink') && m.ai.state === 'chase' && m.affixT >= AFFIX.blinkEvery) {
    const d = Math.hypot(p.x - m.x, p.y - m.y);
    if (d > 50 && p.state !== 'dead') {
      const dir = toward(p, m);
      const to = { x: p.x + dir.x * 34, y: p.y + dir.y * 34 };
      if (walkable(w.map, to.x, to.y)) {
        w.events.push({ kind: 'explode', at: { x: m.x, y: m.y }, r: 18, tag: 'blink' });
        m.x = to.x;
        m.y = to.y;
        w.events.push({ kind: 'explode', at: { x: m.x, y: m.y }, r: 18, tag: 'blink' });
      }
    }
    m.affixT = 0;
  }
}

/** 한 마리가 알아채면 가까운 무리도 덤빈다 */
function alertPack(w: World, m: Monster): void {
  for (const o of w.monsters) {
    if (o === m || o.hp <= 0 || o.boss || o.ai.state !== 'idle') continue;
    const near = Math.hypot(o.x - m.x, o.y - m.y) < PACK_RANGE;
    if (near && (o.zone === m.zone || m.zone < 0)) {
      o.ai.state = 'chase';
      o.ai.timer = 0;
    }
  }
}

function lineAt(w: World, kind: string, from: Vec, dir: Vec, len: number, width: number, damage: number, delay: number, life: number): void {
  w.hazards.push({ id: w.nextId++, kind, shape: { type: 'line', x1: from.x, y1: from.y, x2: from.x + dir.x * len, y2: from.y + dir.y * len, w: width }, delay, telegraph: delay, life, from: 'monster', damage, tick: 0, tickLeft: 0, skill: false, hit: [] });
}

function updateBoss(g: Game, m: Monster, b: BossBrain, dt: number): void {
  const w = g.world;
  const p = w.player;
  const phase = bossPhase(b, m.hp / m.maxHp);
  if (phase !== b.phase) {
    b.phase = phase;
    w.events.push({ kind: 'bossPhase', id: m.def.id, phase });
  }
  // 곰 대장: 태엽이 풀린 동안은 꼼짝 못 한다
  if (b.unwound > 0) {
    b.unwound = Math.max(0, b.unwound - dt);
    if (b.unwound === 0) {
      b.spring = BEAR.spring;
      b.next = 0.8;
      w.events.push({ kind: 'bossRewound', at: { x: m.x, y: m.y } });
    }
    return;
  }
  // 젤리 여왕: 20% 마다 조각으로 쪼개진다
  if (b.id === 'jelly') {
    const crossed = Math.floor((1 - m.hp / m.maxHp) / JELLY.step + 1e-9);
    if (crossed > b.splits) {
      b.splits = crossed;
      splitJelly(g, m);
    }
  }
  const fast = b.phase > 1 ? 0.7 : 1;
  b.timer -= dt;
  if (b.step === 'idle') {
    b.next -= dt;
    // 가까이 다가가되 너무 붙지는 않는다
    const d = Math.hypot(p.x - m.x, p.y - m.y);
    if (d > 70) step(w, m, toward(m, p), m.speed * (b.phase > 1 ? 1.25 : 1), dt);
    if (b.next <= 0 && p.state !== 'dead') {
      const cycle = CYCLES[b.id][Math.min(b.phase, CYCLES[b.id].length) - 1];
      const move = cycle[b.cycle % cycle.length];
      b.cycle++;
      beginMove(g, m, move);
    }
    return;
  }
  if (b.step === 'windup') {
    if (b.timer <= 0) {
      b.step = 'active';
      b.timer = activeTime(b.move!);
      releaseMove(g, m, b);
    }
    return;
  }
  if (b.step === 'active') {
    activeMove(g, m, b, dt);
    if (b.timer <= 0) {
      b.step = 'recover';
      b.timer = 0.6 * fast;
    }
    return;
  }
  if (b.timer <= 0) {
    b.step = 'idle';
    b.move = null;
    b.next = (b.phase > 1 ? 1.1 : 1.7) * (b.id === 'king' ? 0.8 : 1);
    if (b.id === 'bear' && b.spring <= 0) {
      b.unwound = BEAR.unwound;
      w.events.push({ kind: 'bossUnwound', at: { x: m.x, y: m.y } });
    }
  }
}

/** 보스 기술 시작 (예고부터) */
export function beginMove(g: Game, m: Monster, move: string): void {
  const b = m.boss!;
  const p = g.world.player;
  b.move = move;
  b.step = 'windup';
  b.count = 0;
  b.timer = windupTime(move) * (b.phase > 1 ? 0.7 : 1);
  b.dir = toward(m, p);
  b.target = { x: p.x, y: p.y };
  if (b.id === 'bear') b.spring -= b.phase > 1 ? BEAR.costP2 : BEAR.cost;
  g.world.events.push({ kind: 'bossMove', id: m.def.id, move });
  startMove(g, m, b);
}

/** 젤리 여왕 조각: 사방으로 튀어 나간 뒤 여왕에게 기어간다 */
function splitJelly(g: Game, m: Monster): void {
  const w = g.world;
  w.events.push({ kind: 'bossSplit', at: { x: m.x, y: m.y } });
  for (let i = 0; i < JELLY.blobs; i++) {
    const a = (i / JELLY.blobs) * Math.PI * 2 + g.rng.next();
    let x = m.x + Math.cos(a) * (m.r + 70);
    let y = m.y + Math.sin(a) * (m.r + 70);
    if (!walkable(w.map, x, y)) {
      x = m.x + Math.cos(a) * (m.r + 20);
      y = m.y + Math.sin(a) * (m.r + 20);
    }
    const blob = spawnMonster(w, 'jellet', x, y, Math.max(1, m.lv - 2));
    blob.merge = m.id;
    blob.name = '젤리 조각';
    blob.exp = Math.round(blob.exp * 0.3);
    blob.spawnLeft = 0.3;
  }
}

/** 조각: 여왕에게 기어가고, 닿으면 합쳐진다 */
function updateBlob(g: Game, m: Monster, dt: number): void {
  const w = g.world;
  const q = w.monsters.find((o) => o.id === m.merge && o.hp > 0);
  if (!q) {
    m.merge = undefined;
    return;
  }
  if (Math.hypot(q.x - m.x, q.y - m.y) <= q.r + m.r + 8) {
    q.hp = Math.min(q.maxHp, q.hp + q.maxHp * JELLY.heal);
    m.hp = 0;
    m.merged = true;
    w.events.push({ kind: 'bossMerge', at: { x: q.x, y: q.y } });
    return;
  }
  step(w, m, toward(m, q), JELLY.crawl, dt);
}

function windupTime(move: string): number {
  return { charge: 0.8, slam: 0.7, summon: 0.5, ring: 0.5, hop: 0.6, volley: 0.5, laser: 0.9, missiles: 0.4, spiral: 0.4, blink: 0.3, burst: 0.4, rain: 0.4, magnet: TIN.magnetWindup, lights: 0.6, clones: 0.5, freezeCall: 0.1 }[move] ?? 0.5;
}

function activeTime(move: string): number {
  return { charge: 0.5, hop: 0.9, spiral: 1.6, laser: 0.25, magnet: TIN.magnetTime }[move] ?? 0.05;
}

/** 기 모으기 시작: 예고 표시 */
function startMove(g: Game, m: Monster, b: BossBrain): void {
  const w = g.world;
  switch (b.move) {
    case 'charge':
      lineAt(w, 'warnLine', { x: m.x, y: m.y }, b.dir, 260, m.r * 2, 0, b.timer, 0);
      break;
    case 'slam':
      hazardAt(w, 'slam', m.x, m.y, 84, m.atk * 1.4, b.timer);
      break;
    case 'hop':
      hazardAt(w, 'land', b.target.x, b.target.y, 64, m.atk * 1.3, b.timer + activeTime('hop'));
      break;
    case 'laser':
      lineAt(w, 'laser', { x: m.x, y: m.y }, b.dir, 420, 18, m.atk * 1.5, b.timer, 0.25);
      break;
    case 'magnet':
      // 끌어당긴 끝에 둘레를 내려친다 (처음부터 예고)
      hazardAt(w, 'slam', m.x, m.y, TIN.slamR + m.r, m.atk * 1.5, b.timer + TIN.magnetTime);
      break;
    case 'freezeCall':
      callFreeze(g, KING.warn, KING.freeze, KING.hpLoss);
      break;
    case 'missiles':
    case 'rain': {
      const n = b.move === 'rain' ? 8 : 4;
      const spread = b.move === 'rain' ? 150 : 60;
      const p = w.player;
      for (let i = 0; i < n; i++) {
        const a = g.rng.next() * Math.PI * 2;
        const r = i === 0 ? 0 : g.rng.next() * spread;
        hazardAt(w, b.move === 'rain' ? 'dustRain' : 'missile', p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, 34, m.atk * 1.1, 1 + i * 0.06);
      }
      break;
    }
  }
}

/** 기를 다 모았다 */
function releaseMove(g: Game, m: Monster, b: BossBrain): void {
  const w = g.world;
  const p = w.player;
  switch (b.move) {
    case 'lights':
      w.lightsOut = DUSTY.lightsOut;
      break;
    case 'clones':
      for (const side of [-1, 1]) {
        const x = m.x + side * 70;
        const ok = walkable(w.map, x, m.y);
        const c = spawnMonster(w, 'dusty_clone', ok ? x : m.x, m.y + (ok ? 0 : side * 40), m.lv);
        c.ai.state = 'chase';
        c.spawnLeft = 0.3;
      }
      break;
    case 'summon': {
      const minions = w.monsters.filter((x) => x.hp > 0 && !x.boss).length;
      // 곰 대장은 첫 보스: 부하를 적게
      const n = b.id === 'bear' ? Math.min(2, 4 - minions) : Math.min(3, 9 - minions);
      for (let i = 0; i < n; i++) {
        const a = (i / 3) * Math.PI * 2;
        const x = m.x + Math.cos(a) * (m.r + 20);
        const y = m.y + Math.sin(a) * (m.r + 20);
        if (!walkable(w.map, x, y)) continue;
        const mm = spawnMonster(w, MINION[b.id], x, y, Math.max(1, m.lv - 4));
        mm.ai.state = 'chase';
        mm.exp = Math.round(mm.exp * 0.3);
      }
      break;
    }
    case 'ring':
      fire(w, m, { x: 1, y: 0 }, b.phase > 1 ? 18 : 12, (Math.PI * 2) / (b.phase > 1 ? 18 : 12), 120, m.atk * 0.7, 'jellyShot');
      break;
    case 'volley':
      fire(w, m, toward(m, p), 5, 0.22, 170, m.atk * 0.8, 'bolt');
      break;
    case 'burst':
      fire(w, m, { x: 1, y: 0 }, 10, (Math.PI * 2) / 10, 130, m.atk * 0.7, 'dustShot');
      break;
    case 'blink': {
      for (let i = 0; i < 10; i++) {
        const a = g.rng.next() * Math.PI * 2;
        const x = p.x + Math.cos(a) * 100;
        const y = p.y + Math.sin(a) * 100;
        if (walkable(w.map, x, y)) {
          w.events.push({ kind: 'explode', at: { x: m.x, y: m.y }, r: 24, tag: 'blink' });
          m.x = x;
          m.y = y;
          break;
        }
      }
      fire(w, m, toward(m, p), 8, (Math.PI * 2) / 8, 120, m.atk * 0.7, 'dustShot');
      break;
    }
  }
}

function activeMove(g: Game, m: Monster, b: BossBrain, dt: number): void {
  const w = g.world;
  switch (b.move) {
    case 'charge': {
      const before = { x: m.x, y: m.y };
      step(w, m, b.dir, m.speed * 6, dt);
      // 벽에 막히면 멈춘다
      if (Math.hypot(m.x - before.x, m.y - before.y) < m.speed * 6 * dt * 0.3) b.timer = 0;
      const p = w.player;
      if (Math.hypot(p.x - m.x, p.y - m.y) < p.r + m.r && m.contactCd <= 0) {
        if (hurtPlayer(g, m.atk * 1.3, m)) m.contactCd = CONTACT_CD;
      }
      break;
    }
    case 'hop': {
      // 예고한 자리로 날아간다
      const d = Math.hypot(b.target.x - m.x, b.target.y - m.y);
      const sp = Math.min(d, (d / Math.max(dt, b.timer)) * dt);
      if (d > 1) {
        const u = toward(m, b.target);
        m.x += u.x * sp;
        m.y += u.y * sp;
      }
      break;
    }
    case 'magnet': {
      // 주인공을 보스 쪽으로 끌어당긴다 (걷거나 굴러서 버틴다)
      const p = w.player;
      if (p.state !== 'dead') {
        const u = toward(p, m);
        moveCircle(w.map, p, u.x * TIN.pull * dt, u.y * TIN.pull * dt, p.r);
      }
      break;
    }
    case 'spiral':
      b.angle = (b.angle ?? 0) + dt * 2.4;
      b.count += dt;
      while (b.count >= 0.12) {
        b.count -= 0.12;
        fire(w, m, fromAngle(b.angle), 3, (Math.PI * 2) / 3, 110, m.atk * 0.6, 'dustShot');
      }
      break;
  }
  void MONSTERS;
}
