/**
 * 다락방 균열 한 판 (로그라이트): 체크포인트에서 시작해 층을 깰 때마다 축복 카드를 하나씩 모은다.
 * 쓰러지거나 마을로 돌아가면 판이 끝나고 축복은 사라진다. 가장 깊이 간 곳은 저장된다.
 */
import { refreshStats } from './combat.ts';
import { changeMap, enterRift, type Game } from './game.ts';
import { RIFT_MAX, TILE, riftBoss } from './maps.ts';
import type { Rng } from './rng.ts';
import type { Bonus } from './stats.ts';
import { ELITE_CHANCE } from './world.ts';
import { randomMissingPart } from './parts.ts';

export type RuleId = 'none' | 'swarm' | 'elite' | 'haste' | 'fragile' | 'dark' | 'freezeRush' | 'relay' | 'treasure';

export const RULES: Record<RuleId, { name: string; desc: string }> = {
  none: { name: '고요', desc: '특별한 일이 없는 층' },
  swarm: { name: '무리', desc: '몬스터가 1.5배 많다' },
  elite: { name: '정예 소굴', desc: '정예 몬스터가 자주 나온다' },
  haste: { name: '서두름', desc: '몬스터가 빠르다 · 보상 +20%' },
  fragile: { name: '아슬아슬', desc: '받는 피해 +30% · 보상 +50%' },
  dark: { name: '칠흑', desc: '시야가 좁다 · 보상 +30%' },
  freezeRush: { name: '얼음 땡 잔치', desc: '얼음 땡이 곧바로, 자주 온다 · 보상 +40%' },
  relay: { name: '교대 릴레이', desc: '교대 기술 피해 3배' },
  treasure: { name: '보물 상자', desc: '층 어딘가에 보물 상자가 숨어 있다' },
};
/** 이 층마다 처음 깨면 선물 */
export const BOX_MILESTONE = 10;
const RULE_IDS = Object.keys(RULES) as RuleId[];

export interface Blessing {
  name: string;
  desc: string;
  /** 고르는 순간 한 번 (회복 · 물약) */
  now?: (g: Game) => void;
  bonus?: Bonus;
  /** 전설 능력 빌리기 */
  power?: string;
}

const POWER_CARDS: Record<string, string> = { shockwave: '충격파 태엽', chill: '서리 발톱', thorns: '가시 솜', frenzy: '광란의 단추', orbit: '별 위성', thunder: '번개 단추', vampire: '흡혈 실밥' };

export const BLESSINGS: Record<string, Blessing> = {
  atk: { name: '날카로운 별', desc: '공격력 +15%', bonus: { atkPct: 0.15 } },
  hp: { name: '솜사탕 심장', desc: '최대 HP +20%', bonus: { hpPct: 0.2 } },
  aspd: { name: '태엽 박차', desc: '공격 속도 +12%', bonus: { aspd: 0.12 } },
  crit: { name: '행운 단추', desc: '치명타 +6%', bonus: { crit: 6 } },
  cdr: { name: '모래시계', desc: '재사용 대기 -10%', bonus: { cdr: 0.1 } },
  regen: { name: '포근한 담요', desc: '초당 최대 HP 의 1% 회복', bonus: { regenPct: 0.01 } },
  leech: { name: '흡혈 실', desc: '준 피해의 3% 회복', bonus: { leech: 0.03 } },
  ms: { name: '바람 신발', desc: '이동 속도 +10%', bonus: { msPct: 0.1 } },
  skill: { name: '별가루 마법', desc: '스킬 피해 +20%', bonus: { skillPct: 20 } },
  gold: { name: '반짝 주머니', desc: '단추 +40%', bonus: { goldPct: 40 } },
  potion: { name: '사탕 상자', desc: '사탕 4개', now: (g) => (g.save.potions.hp += 4) },
  heal: { name: '다시 감기', desc: 'HP · 태엽을 모두 채운다 · 최대 HP +5%', bonus: { hpPct: 0.05 }, now: (g) => ((g.save.hp = g.stats.maxHp), (g.save.sp = g.stats.maxSp)) },
  ...Object.fromEntries(Object.entries(POWER_CARDS).map(([id, name]) => [`power:${id}`, { name: `★ ${name}`, desc: '이번 판 동안 전설 능력을 빌린다', power: id }])),
};

export interface RiftRun {
  depth: number;
  blessings: string[];
  /** 고를 카드 (없으면 null) */
  offer: string[] | null;
}

/** 시작할 수 있는 층: 1, 6, 11 … (가장 깊이 간 곳 다음 층까지) */
export function checkpoints(best: number): number[] {
  const out: number[] = [];
  for (let d = 1; d <= Math.min(RIFT_MAX, best + 1); d += 5) out.push(d);
  return out;
}

export function startRun(g: Game, depth: number): boolean {
  if (!g.save.flags.rift_open || !checkpoints(g.save.riftBest).includes(depth)) return false;
  g.run = { depth, blessings: [], offer: null };
  enterRift(g, depth);
  applyRule(g, rollRule(g.rng, depth));
  refreshStats(g);
  return true;
}

function rollRule(rng: Rng, depth: number): RuleId {
  if (riftBoss(depth)) return 'none';
  return RULE_IDS[rng.int(RULE_IDS.length)];
}

/** 지금 지도(균열 한 층)에 규칙을 건다 */
export function applyRule(g: Game, rule: RuleId): void {
  const w = g.world;
  if (!w.rift) return;
  w.rift.rule = rule;
  const m = w.mods;
  if (rule === 'swarm') w.map = { ...w.map, spawns: w.map.spawns.map((s) => ({ ...s, max: Math.ceil(s.max * 1.5) })) };
  if (rule === 'elite') m.elite = 0.3;
  if (rule === 'haste') ((m.speed = 1.25), (m.reward = 1.2));
  if (rule === 'fragile') ((m.taken = 1.3), (m.reward = 1.5));
  if (rule === 'dark') m.reward = 1.3;
  if (rule === 'none') m.elite = ELITE_CHANCE;
  if (rule === 'freezeRush') {
    w.freeze.next = Math.min(w.freeze.next, 6);
    m.freezeGap = 0.15;
    m.reward = 1.4;
  }
  if (rule === 'relay') m.tagMul = 3;
  if (rule === 'treasure') {
    // 사냥터 하나의 한가운데에 상자
    const z = w.map.spawns[1 + g.rng.int(Math.max(1, w.map.spawns.length - 1))] ?? w.map.spawns[0] ?? { x: Math.floor(w.rift.exit.x / TILE), y: Math.floor(w.rift.exit.y / TILE) };
    w.map = { ...w.map, structures: [...w.map.structures, { kind: 'chest', x: z.x - 1, y: z.y - 2, w: 2, h: 2, solid: false, id: `box${w.rift.depth}` }] };
  }
}

/** 이정표 층을 처음 깼다: 별 조각 · 단추 · 특별한 부품 */
export function boxGift(g: Game, depth: number): void {
  const s = g.save;
  if (depth % BOX_MILESTONE !== 0 || s.flags[`box_gift_${depth}`]) return;
  s.flags[`box_gift_${depth}`] = true;
  const k = depth / BOX_MILESTONE;
  s.mats.star += 1 + k;
  s.gold += 300 * k;
  const part = randomMissingPart(s, g.rng.next(), true);
  if (part) s.parts[part] = 1;
  g.world.events.push({ kind: 'boxGift', depth, part, gold: 300 * k });
}

/** 수호자를 쓰러뜨렸을 때: 축복 세 장 */
export function rollOffer(rng: Rng, have: string[]): string[] {
  const ids = Object.keys(BLESSINGS).filter((id) => !(BLESSINGS[id].power && have.includes(id)));
  const powers = ids.filter((id) => BLESSINGS[id].power);
  const plain = ids.filter((id) => !BLESSINGS[id].power);
  const out: string[] = [];
  if (powers.length && rng.next() < 0.35) out.push(powers[rng.int(powers.length)]);
  while (out.length < 3 && plain.length) out.push(plain.splice(rng.int(plain.length), 1)[0]);
  return out;
}

export function chooseBlessing(g: Game, i: number): boolean {
  const run = g.run;
  const id = run?.offer?.[i];
  if (!run || !id) return false;
  run.blessings.push(id);
  run.offer = null;
  refreshStats(g);
  BLESSINGS[id].now?.(g);
  return true;
}

/** 이번 판 축복을 합친 능력 */
export function runBonus(run: RiftRun | null): Bonus {
  const out: Required<Bonus> = { atkPct: 0, aspd: 0, defPct: 0, hpPct: 0, crit: 0, cdr: 0, regenPct: 0, leech: 0, msPct: 0, skillPct: 0, goldPct: 0, windPct: 0 };
  for (const id of run?.blessings ?? []) for (const [k, v] of Object.entries(BLESSINGS[id]?.bonus ?? {})) out[k as keyof Bonus] += v;
  return out;
}

export function runHasPower(run: RiftRun | null, power: string): boolean {
  return !!run?.blessings.includes(`power:${power}`);
}

/** 다음 층으로 (이번 층을 깨고 카드를 골랐어야 한다). rule: 규칙을 정해서 */
export function nextFloor(g: Game, rule?: RuleId): boolean {
  const run = g.run;
  const r = g.world.rift;
  if (!run || !r || r.guardian !== 'dead' || run.offer || run.depth >= RIFT_MAX) return false;
  run.depth++;
  const keep = { hp: g.save.hp, sp: g.save.sp };
  changeMap(g, 'rift', undefined, undefined, run.depth);
  g.save.hp = keep.hp;
  g.save.sp = keep.sp;
  applyRule(g, rule ?? rollRule(g.rng, run.depth));
  return true;
}

/** 판을 끝내고 마을로 */
export function endRun(g: Game): void {
  g.run = null;
  changeMap(g, 'village', 22, 13);
  refreshStats(g);
}
