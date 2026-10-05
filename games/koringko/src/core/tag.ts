/** 탐험대 교대 (싸우는 중): 바꿔 들기 · 교대 기술 · 쉬는 동료 회복 · 쓰러짐과 일어남 */
import { refreshStats, hitMonster } from './combat.ts';
import type { Game } from './game.ts';
import { inArc } from './geom.ts';
import { heroState, loadHero, nextHero, stashHero } from './party.ts';
import { computeStats } from './stats.ts';
import type { HeroId, Save } from './types.ts';

export const TAG = { cd: 1.5, iframes: 0.35 };
/** 쓰러진 동료: 쉬면 일어난다 */
export const REVIVE = { time: 30, hp: 0.3 };
/** 쉬는 동료 회복 (초당 최대 HP 비율 · 태엽) */
export const REST = { hp: 0.02, wind: 2 };

/** 쉬는 동료의 최대 HP */
export function benchMaxHp(save: Save, h: HeroId): number {
  const st = heroState(save, h);
  return computeStats({ ...save, hero: h, attrs: st.attrs, skills: st.skills, weaponLv: st.weaponLv }).maxHp;
}

/** 바꿔 들기. forced: 쓰러져서 (대기 · 상태 무시) */
export function swapTo(g: Game, to: HeroId | 'next', forced = false): boolean {
  const save = g.save;
  const p = g.world.player;
  const h = to === 'next' ? nextHero(save) : to;
  if (!h || h === save.hero || !save.party.includes(h) || (save.bench[h]?.down ?? 0) > 0) return false;
  if (!forced && (p.tagCd > 0 || p.state === 'dead' || p.state === 'roll')) return false;
  const from = save.hero;
  stashHero(save, forced ? REVIVE.time : 0);
  if (forced) save.bench[from]!.hp = 0;
  loadHero(save, h);
  refreshStats(g);
  save.hp = Math.max(1, Math.min(save.hp, g.stats.maxHp));
  p.state = 'idle';
  p.stateLeft = 0;
  p.hitIn = -1;
  p.combo = 0;
  p.queue = [];
  p.tagCd = TAG.cd;
  p.tagAt = g.world.time;
  p.iframes = Math.max(p.iframes, forced ? 1.5 : TAG.iframes);
  g.world.events.push({ kind: 'tag', from, to: h, at: { x: p.x, y: p.y }, forced });
  tagMove(g, h);
  return true;
}

/** 교대 기술: 들어서는 동료마다 다르다 */
function tagMove(g: Game, h: HeroId): void {
  const w = g.world;
  const p = w.player;
  const ang = Math.atan2(p.dir.y, p.dir.x);
  const hitAround = (r: number, mult: number, o: Parameters<typeof hitMonster>[3]) => {
    for (const m of w.monsters) if (m.hp > 0 && m.spawnLeft <= 0 && inArc(p, ang, r, 360, m, m.r)) hitMonster(g, m, mult * w.mods.tagMul, { skill: true, ...o });
  };
  switch (h) {
    case 'toby':
      // 빙그르 베며 들어선다
      w.events.push({ kind: 'swing', at: { x: p.x, y: p.y }, dir: { ...p.dir }, reach: 46, arc: 360, step: 0 });
      hitAround(46, 1.4, { knock: 120 });
      break;
    case 'bori':
      // 쿵! 땅을 울려 기절시킨다
      w.events.push({ kind: 'explode', at: { x: p.x, y: p.y }, r: 56, tag: 'quake' });
      hitAround(56, 1.2, { stun: 0.8, knock: 60 });
      break;
    case 'ruru':
      // 가까운 적들을 밀쳐 낸다
      w.events.push({ kind: 'explode', at: { x: p.x, y: p.y }, r: 60, tag: 'wind' });
      hitAround(60, 0.9, { knock: 260 });
      break;
    case 'nabi':
      // 얼음 고리로 느리게 한다
      w.events.push({ kind: 'explode', at: { x: p.x, y: p.y }, r: 70, tag: 'frost' });
      hitAround(70, 1, { slow: 0.5, slowFor: 3 });
      break;
  }
}

/** 쉬는 동료: 회복 · 쓰러진 동료 일어나기 */
export function updateBench(g: Game, dt: number): void {
  const save = g.save;
  for (const h of save.party) {
    const st = save.bench[h];
    if (!st) continue;
    const max = benchMaxHp(save, h);
    if (st.down > 0) {
      st.down = Math.max(0, st.down - dt);
      if (st.down === 0) {
        st.hp = Math.round(max * REVIVE.hp);
        g.world.events.push({ kind: 'heroUp', hero: h });
      }
      continue;
    }
    st.hp = Math.min(max, st.hp + max * REST.hp * dt);
    st.sp = Math.min(100, st.sp + REST.wind * dt);
  }
}

/** 지금 동료가 쓰러졌다: 나설 동료가 있으면 바꾸고 true */
export function fallBack(g: Game): boolean {
  const h = nextHero(g.save);
  if (!h) return false;
  const from = g.save.hero;
  g.world.events.push({ kind: 'heroDown', hero: from });
  return swapTo(g, h, true);
}

/** 모두 쓰러진 뒤 마을에서: 다 일어난다 */
export function reviveAll(g: Game): void {
  for (const h of g.save.party) {
    const st = g.save.bench[h];
    if (!st) continue;
    st.down = 0;
    st.hp = benchMaxHp(g.save, h);
  }
}
