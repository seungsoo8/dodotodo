/** 스킬 변형: 공격 스킬마다 셋 중 하나 (0 = 기본). 마을에서 바꾼다 */
import { SKILLS } from './classes.ts';
import type { Save } from './types.ts';

export interface Variant {
  name: string;
  desc: string;
}

const B: Variant = { name: '기본', desc: '' };

export const VARIANTS: Record<string, Variant[]> = {
  t_rush: [B, { name: '번개 돌진', desc: '맞은 적을 오래 기절시킨다' }, { name: '되돌아 베기', desc: '돌진한 길을 돌아오며 한 번 더 벤다' }],
  t_spin: [B, { name: '회오리', desc: '1.5초 동안 계속 돌며 벤다 (한 번 피해는 작다)' }, { name: '끌어당기기', desc: '더 넓게 베고 적을 가운데로 끌어당긴다' }],
  t_leap: [B, { name: '지진 착지', desc: '더 넓게 내려찍고 오래 기절시킨다' }, { name: '두 번 뛰기', desc: '한 번 더 뛰어 내려찍는다' }],
  t_dance: [B, { name: '별빛 난무', desc: '12번 벤다 (한 번 피해는 작다)' }, { name: '마지막 일격', desc: '6번 벤 뒤 크게 터뜨린다' }],
  b_slam: [B, { name: '연속 내려찍기', desc: '앞으로 나아가며 세 번 내려찍는다' }, { name: '얼음 내려찍기', desc: '기절 대신 넓게 얼려 느리게 한다' }],
  b_roar: [B, { name: '전투 함성', desc: '피해 없이 방어 버프가 길어지고 HP 를 조금 회복한다' }, { name: '겁주기', desc: '주변 적을 오래 기절시킨다 (버프는 짧다)' }],
  b_axe: [B, { name: '세 도끼', desc: '도끼 셋을 부채꼴로 던진다' }, { name: '회전 도끼', desc: '앞에 도끼를 세워 2.5초 동안 돌린다' }],
  b_rage: [B, { name: '불의 분노', desc: '땅울림에 맞은 적을 불태운다' }, { name: '대지 분노', desc: '훨씬 넓고 세게 울리지만 버프는 짧다' }],
  r_fan: [B, { name: '관통 부채', desc: '세 발이지만 적을 여럿 꿰뚫는다' }, { name: '독 부채', desc: '맞은 적을 불태운다' }],
  r_rain: [B, { name: '얼음비', desc: '화살비가 적을 느리게 한다' }, { name: '집중 화살비', desc: '좁은 곳에 훨씬 세게 쏟아진다' }],
  r_bomb: [B, { name: '집속탄', desc: '작은 폭탄 셋을 흩뿌린다' }, { name: '폭탄 덫', desc: '발밑에 덫을 놓아 잠시 뒤 크게 터진다' }],
  r_hunt: [B, { name: '저격', desc: '꿰뚫는 강한 화살 여섯 발' }, { name: '난사', desc: '약한 화살을 사방으로 쏟아붓는다' }],
  n_fire: [B, { name: '화염 장판', desc: '터진 자리에 불길이 남는다' }, { name: '세 갈래 불꽃', desc: '작은 불꽃 구슬 셋을 쏜다' }],
  n_frost: [B, { name: '얼음 감옥', desc: '한 번에 얼려 오래 기절시킨다' }, { name: '눈보라', desc: '더 넓고 오래가는 얼음 장판' }],
  n_chain: [B, { name: '긴 사슬', desc: '여덟 번 튀지만 한 번 피해는 작다' }, { name: '번개 폭발', desc: '튈 때마다 작게 터진다' }],
  n_meteor: [B, { name: '거대 운석', desc: '아주 커다란 운석 하나' }, { name: '유성우', desc: '작은 별똥별 스무 개' }],
};

export function variantOf(save: Save, id: string): number {
  const v = save.variants?.[id] ?? 0;
  return VARIANTS[id] && v >= 0 && v < VARIANTS[id].length ? v : 0;
}

export type VariantCheck = { ok: true } | { ok: false; reason: 'unlearned' | 'invalid' | 'town' };

/** 변형 바꾸기. inTown: 마을(안전한 곳)에 있는가 */
export function setVariant(save: Save, id: string, idx: number, inTown: boolean): VariantCheck {
  if (!SKILLS[id] || (save.skills[id] ?? 0) <= 0) return { ok: false, reason: 'unlearned' };
  if (!VARIANTS[id] || !Number.isInteger(idx) || idx < 0 || idx >= VARIANTS[id].length) return { ok: false, reason: 'invalid' };
  if (!inTown) return { ok: false, reason: 'town' };
  save.variants[id] = idx;
  return { ok: true };
}
