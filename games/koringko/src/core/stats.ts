/** 장비 · 능력치 · 패시브를 모은 실제 능력 */
import { CLASSES } from './classes.ts';
import { skillLv } from './character.ts';
import { ATTRS, SLOTS, type AffixId, type Attr, type Save } from './types.ts';

export interface Stats {
  maxHp: number;
  maxSp: number;
  /** 공격력 (스킬 배율의 기준) */
  atk: number;
  def: number;
  /** 치명타 확률 (0~0.7) */
  crit: number;
  /** 치명타 피해 배율 */
  critDmg: number;
  /** 공격 속도 배율 */
  aspd: number;
  /** 이동 속도 (픽셀/초) */
  ms: number;
  /** 스킬 피해 +% */
  skillPct: number;
  /** HP 재생 (초당) */
  regen: number;
  /** SP 재생 (초당) */
  spRegen: number;
  /** 준 피해 중 HP 로 돌아오는 비율 */
  leech: number;
  /** 골드 획득 +% */
  goldPct: number;
  /** 재사용 대기 감소 (0~0.4) */
  cdr: number;
  attrs: Record<Attr, number>;
}

/** 강화 한 단계마다 무기 피해 · 방어구 방어력 +8% */
export const PLUS_STEP = 0.08;

/** 장비에 붙은 추가 능력 합 */
export function gearSum(save: Save): Record<AffixId, number> {
  const out = {} as Record<AffixId, number>;
  for (const slot of SLOTS) {
    const it = save.gear[slot];
    if (!it) continue;
    for (const a of it.affixes) out[a.id] = (out[a.id] ?? 0) + a.v;
  }
  return out;
}

export function computeStats(save: Save, buffs: { atkPct?: number; aspd?: number; defPct?: number } = {}): Stats {
  const c = CLASSES[save.hero];
  const g = gearSum(save);
  const gv = (k: AffixId) => g[k] ?? 0;
  const attrs = Object.fromEntries(ATTRS.map((k) => [k, save.attrs[k] + gv(k)])) as Record<Attr, number>;
  const lv = save.lv;
  const pass = (id: string) => (c.skills.includes(id) ? skillLv(save, id) : 0);

  const maxHp = Math.round((c.hpBase + c.hpPerLv * (lv - 1) + attrs.vit * 6 + gv('hp')) * (1 + pass('b_pass') * 0.03));
  const maxSp = Math.round(30 + (lv - 1) * 2 + attrs.int * 2 + gv('sp'));

  const w = save.gear.weapon;
  const weaponAvg = w?.dmg ? ((w.dmg[0] + w.dmg[1]) / 2) * (1 + w.plus * PLUS_STEP) : 3;
  const main = attrs[c.main];
  const side = c.main !== 'str' ? attrs.str * 0.008 : 0;
  const atk = (weaponAvg + 4 + gv('atk')) * (1 + main * 0.035 + side) * (1 + gv('atkp') / 100) * (1 + (buffs.atkPct ?? 0));

  let armor = 0;
  for (const slot of SLOTS) {
    const it = save.gear[slot];
    if (it?.def) armor += it.def * (1 + it.plus * PLUS_STEP);
  }
  const def = (attrs.vit * 0.5 + attrs.str * 0.3 + armor + gv('def')) * (1 + pass('b_pass') * 0.04) * (1 + (buffs.defPct ?? 0));

  return {
    maxHp,
    maxSp,
    atk,
    def,
    crit: Math.min(0.7, (5 + attrs.dex * 0.2 + gv('crit') + pass('t_pass')) / 100),
    critDmg: 1.5 + (gv('critd') + pass('r_pass') * 6) / 100,
    aspd: (w?.spd ?? 1) * (1 + attrs.dex * 0.003 + gv('aspd') / 100 + pass('t_pass') * 0.02 + (buffs.aspd ?? 0)),
    ms: c.speed * (1 + gv('ms') / 100),
    skillPct: attrs.int * 0.5 + gv('skill') + pass('n_pass') * 4,
    regen: attrs.vit * 0.05 + gv('regen'),
    spRegen: (1 + attrs.int * 0.04) * (1 + pass('n_pass') * 0.1),
    leech: gv('leech') / 100,
    goldPct: gv('gold'),
    cdr: Math.min(0.4, gv('cdr') / 100),
    attrs,
  };
}

/** 받는 피해 배율: 방어력이 높을수록 줄지만, 레벨이 오를수록 같은 방어력의 효과는 준다 */
export function takenMul(lv: number, def: number): number {
  const k = 40 + lv * 6;
  return k / (k + Math.max(0, def));
}

/** 전투력: 한눈에 보는 강함 (공격 · 방어 · 체력 · 치명) */
export function power(s: Stats): number {
  return Math.round(s.atk * (1 + s.crit * (s.critDmg - 1)) * s.aspd * 6 + s.def * 4 + s.maxHp * 0.5);
}
