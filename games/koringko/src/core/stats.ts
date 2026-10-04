/** 레벨 · 무기 손질 · 능력치 · 패시브 · 부품을 모은 실제 능력 */
import { CLASSES } from './classes.ts';
import { skillLv } from './character.ts';
import type { Attr, Save } from './types.ts';
import { weaponDamage, weaponSpeed } from './weapon.ts';

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
  /** 태엽 저절로 감기는 양 (초당) */
  spRegen: number;
  /** 준 피해 중 HP 로 돌아오는 비율 */
  leech: number;
  /** 단추 획득 +% */
  goldPct: number;
  /** 재사용 대기 감소 (0~0.4) */
  cdr: number;
  attrs: Record<Attr, number>;
}

/** 버프 · 균열 축복이 주는 추가 능력 */
export interface Bonus {
  atkPct?: number;
  aspd?: number;
  defPct?: number;
  hpPct?: number;
  /** 치명타 (%p) */
  crit?: number;
  cdr?: number;
  /** 초당 HP 회복 (최대 HP 비율) */
  regenPct?: number;
  leech?: number;
  msPct?: number;
  skillPct?: number;
  goldPct?: number;
  /** 태엽 감기는 속도 +% (비율) */
  windPct?: number;
}

/** 태엽 최대치 */
export const WIND_MAX = 100;

export function computeStats(save: Save, buffs: Bonus = {}): Stats {
  const c = CLASSES[save.hero];
  const attrs = { ...save.attrs };
  const lv = save.lv;
  const pass = (id: string) => (c.skills.includes(id) ? skillLv(save, id) : 0);

  const maxHp = Math.round((c.hpBase + c.hpPerLv * (lv - 1) + attrs.vit * 6) * (1 + pass('b_pass') * 0.03) * (1 + (buffs.hpPct ?? 0)));
  const main = attrs[c.main];
  const side = c.main !== 'str' ? attrs.str * 0.008 : 0;
  const atk = (weaponDamage(save.hero, save.weaponLv, lv) + 4) * (1 + main * 0.035 + side) * (1 + (buffs.atkPct ?? 0));
  // 탐험대 레벨만큼 몸이 단단해진다 (예전 방어구 몫)
  const def = (attrs.vit * 0.5 + attrs.str * 0.3 + lv * 2.2) * (1 + pass('b_pass') * 0.04) * (1 + (buffs.defPct ?? 0));

  return {
    maxHp,
    maxSp: WIND_MAX,
    atk,
    def,
    crit: Math.min(0.7, (5 + attrs.dex * 0.2 + pass('t_pass') + (buffs.crit ?? 0)) / 100),
    critDmg: 1.5 + (pass('r_pass') * 6) / 100,
    aspd: weaponSpeed(save.hero) * (1 + attrs.dex * 0.003 + pass('t_pass') * 0.02 + (buffs.aspd ?? 0)),
    ms: c.speed * (1 + (buffs.msPct ?? 0)),
    skillPct: attrs.int * 0.5 + pass('n_pass') * 4 + (buffs.skillPct ?? 0),
    regen: attrs.vit * 0.05 + maxHp * (buffs.regenPct ?? 0),
    spRegen: (2.5 + attrs.int * 0.03) * (1 + pass('n_pass') * 0.1) * (1 + (buffs.windPct ?? 0)),
    leech: buffs.leech ?? 0,
    goldPct: buffs.goldPct ?? 0,
    cdr: Math.min(0.5, buffs.cdr ?? 0),
    attrs,
  };
}

/** 받는 피해 배율: 방어력이 높을수록 줄지만, 레벨이 오를수록 같은 방어력의 효과는 준다 */
export function takenMul(lv: number, def: number): number {
  const k = 40 + lv * 6;
  return k / (k + Math.max(0, def));
}

