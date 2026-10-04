/** 지금 있는 지도 위의 모든 것: 주인공 · 몬스터 · 탄 · 장판 · 떨어진 물건 */
import { pushOutOfRect, type Vec } from './geom.ts';
import type { RescueState } from './rescue.ts';
import type { FreezeKind } from './freeze.ts';
import { TILE, buildMap, isSolid, type MapDef, type MapId } from './maps.ts';
import { MONSTERS, scaleMonster, type BossId, type MonsterDef } from './monsters.ts';
import type { Rank } from './loot.ts';
import type { Rng } from './rng.ts';
import type { HeroId, MatId } from './types.ts';
import { AFFIX, ELITE_AFFIX, rollEliteAffixes, type EliteAffix } from './elite.ts';
import type { RuleId } from './riftrun.ts';
import { freshFreeze, type FreezeState } from './freeze.ts';

/** 한 순간의 조작 */
export interface Input {
  /** 이동 방향 (길이 0~1) */
  move: Vec;
  /** 공격 키를 누르고 있다 */
  attack: boolean;
  /** 이번 순간 새로 눌렀다 (말 걸기 · 확인) */
  attackPressed: boolean;
  roll: boolean;
  skill: 'A' | 'S' | 'D' | 'F' | null;
  potion: 'hp' | null;
  /** 태엽 감기 (누르고 있기) */
  wind: boolean;
  /** 동료 바꾸기: 'next' 이거나 동료 */
  swap: HeroId | 'next' | null;
}

export const NO_INPUT: Input = { move: { x: 0, y: 0 }, attack: false, attackPressed: false, roll: false, skill: null, potion: null, wind: false, swap: null };

export interface Status {
  burnDps: number;
  burnLeft: number;
  slow: number;
  slowLeft: number;
  stun: number;
}

export function freshStatus(): Status {
  return { burnDps: 0, burnLeft: 0, slow: 1, slowLeft: 0, stun: 0 };
}

export type Face = 'up' | 'down' | 'left' | 'right';

export interface Player {
  x: number;
  y: number;
  r: number;
  /** 보는 방향 (단위 벡터) */
  dir: Vec;
  face: Face;
  /** 지금 하는 일과 남은 시간 */
  state: 'idle' | 'move' | 'attack' | 'roll' | 'cast' | 'dead';
  stateLeft: number;
  /** 연속 공격 몇 번째 (다음에 칠 단계) */
  combo: number;
  comboLeft: number;
  /** 이번 공격이 맞는 시각까지 남은 시간 (-1 이면 이미 맞았거나 없음) */
  hitIn: number;
  rollCd: number;
  rollDir: Vec;
  iframes: number;
  skillCd: Record<string, number>;
  potionCd: number;
  /** 버프 남은 시간 */
  buffs: { roar: number; rage: number; swift: number; frenzy: number; overwind: number; linked: number };
  /** 교대 연계가 남은 시간 (첫 스킬 공짜 · 더 세게) */
  linkLeft: number;
  /** 마지막으로 스킬을 쓴 때 (합동 기술) */
  lastSkillAt: number;
  /** 태엽 풀림 (느려짐) 남은 시간 */
  windOut: number;
  /** 태엽을 다시 감아 또 풀릴 수 있는가 */
  windArmed: boolean;
  /** 태엽을 감는 중 */
  winding: boolean;
  /** 다시 교대할 수 있기까지 */
  tagCd: number;
  /** 마지막으로 바꿔 든 때 (교대 기술로 쓰러뜨렸나) */
  tagAt: number;
  /** 별 위성 시계 */
  orbitT: number;
  kx: number;
  ky: number;
  /** 불사조 깃털 다시 쓸 수 있기까지 */
  phoenixCd: number;
  /** 쓰러진 뒤 마을로 돌아가기까지 */
  deadLeft: number;
  /** 시간 차를 두고 이어지는 스킬 (난무 · 별사냥 등) */
  queue: { at: number; kind: string; n: number; x?: number; y?: number; dx?: number; dy?: number; mult?: number }[];
  /** 걷기 그림 박자 */
  walkT: number;
}

export interface BossBrain {
  id: BossId;
  phase: number;
  move: string | null;
  step: 'idle' | 'windup' | 'active' | 'recover';
  timer: number;
  /** 다음 기술까지 */
  next: number;
  cycle: number;
  dir: Vec;
  target: Vec;
  count: number;
  angle: number;
  /** 곰 대장 태엽 (0 이 되면 풀린다) */
  spring: number;
  /** 태엽이 풀려 멈춘 남은 시간 */
  unwound: number;
  /** 젤리 여왕이 쪼개진 횟수 */
  splits: number;
}

export interface Monster {
  id: number;
  def: MonsterDef;
  lv: number;
  rank: Rank;
  x: number;
  y: number;
  r: number;
  hp: number;
  maxHp: number;
  atk: number;
  def_: number;
  exp: number;
  gold: [number, number];
  speed: number;
  /** 태어난 자리 (너무 멀어지면 돌아간다) */
  home: Vec;
  zone: number;
  ai: { state: string; timer: number; dir: Vec; target: Vec };
  kx: number;
  ky: number;
  status: Status;
  hitAt: number;
  contactCd: number;
  /** 나타나기까지 (그동안 맞지도 때리지도 않는다) */
  spawnLeft: number;
  boss: BossBrain | null;
  /** 다락방 상자 지킴이 */
  guardian: boolean;
  name: string;
  /** 정예 성질 */
  affixes: EliteAffix[];
  /** 얼음 땡에 들켜서 화난 시간 */
  rage: number;
  /** 성질 시계 (불꽃 · 순간이동) */
  affixT: number;
  /** 젤리 조각: 돌아가 합쳐질 여왕 id */
  merge?: number;
  /** 합쳐져 사라졌다 (쓰러뜨린 것이 아니다) */
  merged?: boolean;
}

export interface Projectile {
  id: number;
  kind: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  damage: number;
  from: 'player' | 'monster';
  pierce: number;
  life: number;
  hit: number[];
  explode?: number;
  burn?: number;
  /** 스킬 피해 (지혜 보너스) */
  skill: boolean;
  /** 돌아오는 도끼: 돌아올 시각 */
  returnAt?: number;
  /** 기본 공격 (전설 '번개 단추') */
  basic: boolean;
  /** 터진 자리에 남는 불길 (0.5초마다 공격력 ×) */
  pool?: number;
}

export type HazardShape = { type: 'circle'; x: number; y: number; r: number } | { type: 'line'; x1: number; y1: number; x2: number; y2: number; w: number };

export interface Hazard {
  id: number;
  kind: string;
  shape: HazardShape;
  /** 예고 남은 시간 */
  delay: number;
  /** 전체 예고 시간 (그리기) */
  telegraph: number;
  /** 이 장판을 만든 몬스터 (흡혈) */
  owner?: number;
  /** 예고 뒤 살아 있는 시간 (0 이면 한 번 터지고 끝) */
  life: number;
  from: 'player' | 'monster';
  damage: number;
  tick: number;
  tickLeft: number;
  slow?: number;
  stun?: number;
  burn?: number;
  skill: boolean;
  hit: number[];
}

export type DropKind = 'gold' | 'part' | 'potion' | 'mat';

export interface Drop {
  id: number;
  kind: DropKind;
  x: number;
  y: number;
  gold?: number;
  /** 부품 id */
  part?: string;
  potion?: 'hp';
  mat?: MatId;
  /** 떨어진 뒤 시간 (튀어 오르는 연출 · 줍기 대기) */
  age: number;
}

export interface RiftState {
  depth: number;
  /** 0~100: 몬스터를 쓰러뜨리면 찬다 */
  gauge: number;
  guardian: 'none' | 'spawned' | 'dead';
  /** 수호자를 쓰러뜨리면 나타나는 귀환문 */
  portal: Vec | null;
  /** 이 층의 규칙 (한 판 균열) */
  rule: RuleId;
  /** 수호자가 나오는 자리 (마지막 방) · 몬스터 종류 · 레벨 */
  exit: Vec;
  pool: string[];
  lv: number;
}

export type WorldEvent =
  | { kind: 'swing'; at: Vec; dir: Vec; reach: number; arc: number; step: number }
  | { kind: 'shot'; at: Vec; dir: Vec; projectile: string }
  | { kind: 'hit'; at: Vec; amount: number; crit: boolean; targetId: number; skill: boolean }
  | { kind: 'kill'; at: Vec; monsterId: number; defId: string; rank: Rank; boss: boolean; exp: number }
  | { kind: 'hurt'; amount: number; at: Vec }
  | { kind: 'roll'; at: Vec; dir: Vec }
  | { kind: 'skill'; id: string; at: Vec; dir: Vec }
  | { kind: 'noSp' }
  | { kind: 'potion'; potion: 'hp' }
  | { kind: 'explode'; at: Vec; r: number; tag: string }
  | { kind: 'chain'; from: Vec; to: Vec }
  | { kind: 'monsterShot'; at: Vec }
  | { kind: 'windup'; at: Vec; monsterId: number }
  | { kind: 'spawn'; at: Vec; rank: Rank }
  | { kind: 'pickup'; drop: DropKind; at: Vec; gold?: number; part?: string; potion?: 'hp'; mat?: MatId }
  | { kind: 'tag'; from: HeroId; to: HeroId; at: Vec; forced: boolean }
  | { kind: 'heroDown'; hero: HeroId }
  | { kind: 'heroUp'; hero: HeroId }
  | { kind: 'overwind' }
  | { kind: 'link'; at: Vec }
  | { kind: 'duo'; name: string; from: HeroId; to: HeroId; at: Vec }
  | { kind: 'windEmpty' }
  | { kind: 'friend'; defId: string; name: string }
  | { kind: 'villageUp'; lv: number; facility: string | null }
  | { kind: 'villageGift'; candy: number }
  | { kind: 'join'; hero: HeroId }
  | { kind: 'rescueStart'; hero: HeroId }
  | { kind: 'rescueWave'; wave: number; of: number }
  | { kind: 'freezeWarn'; type: FreezeKind }
  | { kind: 'freeze'; type: FreezeKind }
  | { kind: 'caught'; amount: number }
  | { kind: 'freezeOk' }
  | { kind: 'chest'; part: string | null; gold: number }
  | { kind: 'errand'; quest: string; item: string }
  | { kind: 'bagFull' }
  | { kind: 'levelUp'; lv: number }
  | { kind: 'heal'; amount: number }
  | { kind: 'bossIntro'; id: string; name: string }
  | { kind: 'bossPhase'; id: string; phase: number }
  | { kind: 'bossMove'; id: string; move: string }
  | { kind: 'bossDown'; id: string; at: Vec }
  | { kind: 'bossUnwound'; at: Vec }
  | { kind: 'bossRewound'; at: Vec }
  | { kind: 'bossSplit'; at: Vec }
  | { kind: 'bossMerge'; at: Vec }
  | { kind: 'riftGuardian'; at: Vec; name: string }
  | { kind: 'riftClear'; depth: number; at: Vec }
  | { kind: 'boxGift'; depth: number; part: string | null; gold: number }
  | { kind: 'phoenix' }
  | { kind: 'died' }
  | { kind: 'respawn'; goldLost: number }
  | { kind: 'talk'; npc: string }
  | { kind: 'portal' }
  | { kind: 'locked'; text: string }
  | { kind: 'enter'; map: string; name: string; level: string }
  | { kind: 'quest'; id: string; state: string };

export interface World {
  map: MapDef;
  time: number;
  player: Player;
  monsters: Monster[];
  projectiles: Projectile[];
  hazards: Hazard[];
  drops: Drop[];
  events: WorldEvent[];
  /** 사냥터마다 다시 나오기까지 남은 시간 */
  respawn: number[];
  boss: 'none' | 'spawned' | 'dead';
  rift: RiftState | null;
  nextId: number;
  /** 사냥터를 처음 한꺼번에 채웠는지 */
  filled: boolean;
  /** 얼음 땡 */
  freeze: FreezeState;
  /** 더스티가 불을 끈 남은 시간 (더 어둡다) */
  lightsOut: number;
  /** 먼지 고치 구출 중 */
  rescue: RescueState | null;
  /** 난이도 배율 (새로 나오는 몬스터에 붙는다) */
  mods: { hp: number; atk: number; speed: number; elite: number; taken: number; reward: number; freezeGap: number; windRegen: number; tagMul: number };
}

export const RESPAWN = 7;
export const ELITE_CHANCE = 0.07;
export const ELITE = { hp: 3, atk: 1.35, exp: 3, r: 3 };

export function createPlayer(x: number, y: number): Player {
  return {
    x,
    y,
    r: 8,
    dir: { x: 0, y: 1 },
    face: 'down',
    state: 'idle',
    stateLeft: 0,
    combo: 0,
    comboLeft: 0,
    hitIn: -1,
    rollCd: 0,
    rollDir: { x: 0, y: 1 },
    iframes: 0,
    skillCd: {},
    potionCd: 0,
    buffs: { roar: 0, rage: 0, swift: 0, frenzy: 0, overwind: 0, linked: 0 },
    linkLeft: 0,
    lastSkillAt: -99,
    windOut: 0,
    windArmed: true,
    winding: false,
    tagCd: 0,
    tagAt: -99,
    orbitT: 0,
    kx: 0,
    ky: 0,
    phoenixCd: 0,
    deadLeft: 0,
    queue: [],
    walkT: 0,
  };
}

export function tileCenter(t: number): number {
  return t * TILE + TILE / 2;
}

/** 지도 하나를 연다. at 이 없으면 지도의 시작 자리 */
export function createWorld(id: MapId, at?: { tx: number; ty: number }, depth = 1, seed = 1): World {
  const map = buildMap(id, depth, seed);
  const tx = at?.tx ?? map.start.x;
  const ty = at?.ty ?? map.start.y;
  return {
    map,
    time: 0,
    player: createPlayer(tileCenter(tx), tileCenter(ty)),
    monsters: [],
    projectiles: [],
    hazards: [],
    drops: [],
    events: [],
    // 처음엔 바로 채운다
    respawn: map.spawns.map(() => 0),
    boss: 'none',
    rift: id === 'rift' ? riftState(map, depth) : null,
    nextId: 1,
    filled: false,
    freeze: freshFreeze(),
    rescue: null,
    lightsOut: 0,
    mods: { hp: 1, atk: 1, speed: 1, elite: ELITE_CHANCE, taken: 1, reward: 1, freezeGap: 1, windRegen: 1, tagMul: 1 },
  };
}

function riftState(map: MapDef, depth: number): RiftState {
  const last = map.spawns[map.spawns.length - 1];
  const exit = map.boss ?? last;
  return { depth, gauge: 0, rule: 'none', guardian: 'none', portal: null, exit: { x: tileCenter(exit.x), y: tileCenter(exit.y) }, pool: last.pool, lv: last.lv[1] };
}

// ───────────────────────── 움직임과 벽 ─────────────────────────

/** 반지름 r 인 원을 (x,y) → (x+dx, y+dy) 로 옮기되 막힌 타일에 박히지 않게 */
export function moveCircle(map: MapDef, p: { x: number; y: number }, dx: number, dy: number, r: number, fly = false): void {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (r * 0.8)));
  for (let i = 0; i < steps; i++) {
    p.x += dx / steps;
    p.y += dy / steps;
    if (fly) {
      p.x = Math.max(r, Math.min(map.w * TILE - r, p.x));
      p.y = Math.max(r, Math.min(map.h * TILE - r, p.y));
      continue;
    }
    resolveTiles(map, p, r);
  }
}

export function resolveTiles(map: MapDef, p: { x: number; y: number }, r: number): void {
  const x0 = Math.floor((p.x - r) / TILE);
  const x1 = Math.floor((p.x + r) / TILE);
  const y0 = Math.floor((p.y - r) / TILE);
  const y1 = Math.floor((p.y + r) / TILE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (!isSolid(map, tx, ty)) continue;
      const q = pushOutOfRect(p, r, { x: tx * TILE, y: ty * TILE, w: TILE, h: TILE });
      p.x = q.x;
      p.y = q.y;
    }
  }
}

export function walkable(map: MapDef, x: number, y: number): boolean {
  return !isSolid(map, Math.floor(x / TILE), Math.floor(y / TILE));
}

// ───────────────────────── 몬스터 만들기 ─────────────────────────

export function spawnMonster(w: World, defId: string, x: number, y: number, lv: number, rank: Rank = 'normal', zone = -1, affixes: EliteAffix[] = []): Monster {
  const def = MONSTERS[defId];
  const s = scaleMonster(def, lv);
  const elite = rank === 'elite';
  const m: Monster = {
    id: w.nextId++,
    def,
    lv,
    rank,
    x,
    y,
    r: def.r + (elite ? ELITE.r : 0),
    hp: Math.round(s.hp * w.mods.hp) * (elite ? ELITE.hp : 1),
    maxHp: Math.round(s.hp * w.mods.hp) * (elite ? ELITE.hp : 1),
    atk: Math.round(s.atk * w.mods.atk) * (elite ? ELITE.atk : 1),
    def_: s.def,
    exp: Math.round(s.exp * (elite ? ELITE.exp : 1)),
    gold: s.gold,
    speed: def.speed * (affixes.includes('fast') ? AFFIX.fastSpeed : 1) * w.mods.speed,
    home: { x, y },
    zone,
    ai: { state: 'idle', timer: 0.5 + (w.nextId % 7) * 0.2, dir: { x: 0, y: 0 }, target: { x, y } },
    kx: 0,
    ky: 0,
    status: freshStatus(),
    hitAt: -1,
    contactCd: 0,
    spawnLeft: 0.5,
    boss: def.boss ? { id: def.boss, phase: 1, move: null, step: 'idle', timer: 0, next: 1.5, cycle: 0, dir: { x: 0, y: 0 }, target: { x, y }, count: 0, angle: 0, spring: 100, unwound: 0, splits: 0 } : null,
    guardian: false,
    name: affixes.length ? `${affixes.map((a) => ELITE_AFFIX[a].name).join(' ')} ${def.name}` : def.name,
    affixes,
    affixT: 0,
    rage: 0,
  };
  w.monsters.push(m);
  w.events.push({ kind: 'spawn', at: { x, y }, rank });
  return m;
}

/** 사냥터를 채운다 (비어 있는 수만큼, 다시 나오는 시간이 지났으면) */
export function refillSpawns(w: World, rng: Rng, dt: number): void {
  w.map.spawns.forEach((z, i) => {
    const alive = w.monsters.filter((m) => m.zone === i && m.hp > 0).length;
    if (alive >= z.max) {
      w.respawn[i] = RESPAWN;
      return;
    }
    w.respawn[i] -= dt;
    if (w.respawn[i] > 0) return;
    // 처음 들어왔을 때는 한꺼번에, 그 뒤로는 하나씩
    const first = !w.filled;
    // 처음이 아니면 두세 마리씩 무리 지어
    const n = first ? z.max - alive : Math.min(z.max - alive, 1 + rng.int(3));
    let group: Vec | null = null;
    for (let k = 0; k < n; k++) {
      const pos: Vec | null = !first && group ? findSpot(w, rng, Math.floor(group.x / TILE), Math.floor(group.y / TILE), 1) : findSpot(w, rng, z.x, z.y, z.r);
      if (!pos) continue;
      // 주인공 바로 옆에는 나오지 않는다
      if (!first && Math.hypot(pos.x - w.player.x, pos.y - w.player.y) < 90) continue;
      group ??= pos;
      const id = z.pool[rng.int(z.pool.length)];
      const lv = z.lv[0] + rng.int(z.lv[1] - z.lv[0] + 1);
      const elite = rng.next() < w.mods.elite;
      spawnMonster(w, id, pos.x, pos.y, lv, elite ? 'elite' : 'normal', i, elite ? rollEliteAffixes(rng, w.mods.hp >= 1.8 ? 2 : 1) : []);
    }
    w.respawn[i] = RESPAWN;
  });
  w.filled = true;
}

function findSpot(w: World, rng: Rng, tx: number, ty: number, r: number): Vec | null {
  for (let i = 0; i < 20; i++) {
    const a = rng.next() * Math.PI * 2;
    const d = rng.next() * r;
    const x = tileCenter(Math.round(tx + Math.cos(a) * d));
    const y = tileCenter(Math.round(ty + Math.sin(a) * d));
    if (walkable(w.map, x, y)) return { x, y };
  }
  return null;
}

// ───────────────────────── 떨어진 물건 ─────────────────────────

export function addDrop(w: World, rng: Rng, kind: DropKind, x: number, y: number, extra: Partial<Drop>): Drop {
  const a = rng.next() * Math.PI * 2;
  const d = 6 + rng.next() * 14;
  const p = { x: x + Math.cos(a) * d, y: y + Math.sin(a) * d };
  resolveTiles(w.map, p, 4);
  const drop: Drop = { id: w.nextId++, kind, x: p.x, y: p.y, age: 0, ...extra };
  w.drops.push(drop);
  return drop;
}

export function nearestMonster(w: World, x: number, y: number, maxDist: number): Monster | null {
  let best: Monster | null = null;
  let bd = maxDist;
  for (const m of w.monsters) {
    if (m.hp <= 0 || m.spawnLeft > 0) continue;
    const d = Math.hypot(m.x - x, m.y - y) - m.r;
    if (d < bd) {
      bd = d;
      best = m;
    }
  }
  return best;
}

export function faceOf(dir: Vec): Face {
  if (Math.abs(dir.x) > Math.abs(dir.y)) return dir.x < 0 ? 'left' : 'right';
  return dir.y < 0 ? 'up' : 'down';
}
