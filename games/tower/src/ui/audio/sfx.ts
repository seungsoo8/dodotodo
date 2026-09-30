import { fxFor, type BeamKind, type ImpactKind, type ProjectileKind } from '../weaponfx.ts';

/**
 * 효과음 설계 (소리 파일 없이 Web Audio 로 즉석에서 만든다).
 * tone: 발진기(삑·뚱) · noise: 잡음을 거르개로 색을 입혀 "쉭·쿵·퍽" 같은 질감을 낸다.
 */
export interface Layer {
  kind: 'tone' | 'noise';
  /** tone 파형 */
  wave?: OscillatorType;
  /** tone 은 음 높이, noise 는 거르개 주파수 (Hz) */
  freq: number;
  /** 끝 주파수 (미끄러지는 소리) */
  to?: number;
  /** noise 거르개 */
  filter?: BiquadFilterType;
  q?: number;
  dur: number;
  gain: number;
  delay?: number;
}

export type SoundSpec = Layer[];

const tone = (wave: OscillatorType, freq: number, to: number | undefined, dur: number, gain: number, delay = 0): Layer => ({ kind: 'tone', wave, freq, to, dur, gain, delay });
const noise = (filter: BiquadFilterType, freq: number, to: number | undefined, dur: number, gain: number, delay = 0, q = 1): Layer => ({ kind: 'noise', filter, freq, to, dur, gain, delay, q });

/** 날아가는 것별 쏘는 소리 */
const PROJECTILE_SHOT: Record<ProjectileKind, SoundSpec> = {
  stone: [noise('highpass', 2500, 1500, 0.05, 0.05), tone('square', 420, 300, 0.03, 0.02)],
  dagger: [noise('bandpass', 5000, 3000, 0.04, 0.05, 0, 3), noise('bandpass', 5500, 3200, 0.04, 0.04, 0.04, 3)],
  axe: [noise('lowpass', 1400, 500, 0.12, 0.07), tone('triangle', 200, 140, 0.08, 0.03)],
  arrow: [tone('triangle', 720, 480, 0.07, 0.05), noise('highpass', 4000, undefined, 0.04, 0.03)],
  galeArrow: [noise('bandpass', 1500, 4000, 0.12, 0.05, 0, 2), tone('sine', 900, 1300, 0.06, 0.03)],
  bolt: [tone('square', 190, 90, 0.1, 0.05), noise('lowpass', 900, 300, 0.08, 0.05)],
  frostOrb: [tone('sine', 1500, 2300, 0.1, 0.04), tone('sine', 2250, 3000, 0.08, 0.02, 0.03)],
  shell: [tone('sine', 150, 70, 0.14, 0.09), noise('lowpass', 600, 200, 0.12, 0.06)],
  boulder: [noise('lowpass', 400, 150, 0.2, 0.08), tone('sine', 110, 60, 0.18, 0.07)],
  pot: [tone('triangle', 500, 350, 0.08, 0.04), noise('bandpass', 1200, 800, 0.1, 0.04, 0, 2)],
  chaosOrb: [tone('square', 300, 900, 0.09, 0.03), tone('square', 310, 450, 0.09, 0.02, 0.02)],
};

/** 광선·번개 쏘는 소리 */
const BEAM_SHOT: Record<BeamKind, SoundSpec> = {
  lightning: [tone('sawtooth', 2200, 500, 0.07, 0.04), noise('highpass', 6000, undefined, 0.06, 0.04)],
  storm: [tone('sawtooth', 1600, 300, 0.12, 0.05), noise('bandpass', 3000, 1500, 0.12, 0.05, 0, 2)],
  eyeBeam: [tone('sine', 1800, 2600, 0.06, 0.035)],
  voidBeam: [tone('sawtooth', 120, 60, 0.18, 0.05), tone('sine', 60, 40, 0.2, 0.06)],
};

/** 무기별 쏘는 소리 (연출 사양의 날아가는 것·광선에 맞춘다) */
export function shotSound(weaponId: string): SoundSpec {
  const fx = fxFor(weaponId);
  if (fx.beam) return BEAM_SHOT[fx.beam];
  return PROJECTILE_SHOT[fx.projectile ?? 'stone'];
}

/** 맞는 순간의 소리 */
export const IMPACT_SOUNDS: Record<ImpactKind, SoundSpec> = {
  chips: [noise('bandpass', 1800, 900, 0.05, 0.05, 0, 2)],
  slash: [noise('highpass', 3500, 2000, 0.06, 0.05)],
  bigSlash: [noise('bandpass', 1600, 700, 0.1, 0.07, 0, 1.5), tone('square', 160, 90, 0.06, 0.03)],
  spark: [noise('highpass', 5000, undefined, 0.04, 0.04), tone('square', 1400, 900, 0.03, 0.02)],
  wind: [noise('bandpass', 900, 2600, 0.14, 0.05, 0, 1.5)],
  heavySpark: [tone('square', 240, 110, 0.08, 0.05), noise('highpass', 3500, undefined, 0.06, 0.04)],
  zap: [noise('highpass', 7000, undefined, 0.04, 0.035), tone('square', 1900, 1200, 0.03, 0.02)],
  stormZap: [noise('bandpass', 3500, 1200, 0.12, 0.05, 0, 2), tone('sawtooth', 900, 200, 0.1, 0.03)],
  iceBurst: [tone('sine', 2600, 1800, 0.08, 0.035), noise('highpass', 6000, undefined, 0.07, 0.03)],
  explosion: [noise('lowpass', 900, 120, 0.35, 0.12), tone('sine', 90, 40, 0.3, 0.1)],
  dustBlast: [noise('lowpass', 500, 100, 0.4, 0.12), tone('sine', 70, 35, 0.3, 0.09)],
  fireBurst: [noise('bandpass', 1500, 500, 0.3, 0.08, 0, 1), noise('highpass', 5000, undefined, 0.25, 0.02, 0.05)],
  chaosPop: [tone('square', 700, 250, 0.08, 0.04), tone('square', 1100, 400, 0.06, 0.02, 0.03)],
  eyeSpark: [tone('sine', 2400, 1600, 0.05, 0.03)],
  voidImplode: [noise('lowpass', 300, 1500, 0.2, 0.06), tone('sine', 55, 110, 0.2, 0.06)],
};

export function impactSound(kind: ImpactKind): SoundSpec {
  return IMPACT_SOUNDS[kind];
}

/** 기본 스킬 소리 */
export const SKILL_SOUNDS: Record<string, SoundSpec> = {
  meteor: [tone('sawtooth', 900, 120, 0.4, 0.04), noise('lowpass', 1200, 100, 0.6, 0.13, 0.4), tone('sine', 70, 30, 0.5, 0.1, 0.4)],
  blizzard: [noise('bandpass', 3000, 1200, 0.9, 0.06, 0, 1.5), tone('sine', 1800, 900, 0.6, 0.03, 0.1)],
  repair: [523, 659, 784].map((f, i) => tone('triangle', f, undefined, 0.14, 0.06, i * 0.08)),
  gold_rush: [1047, 1319, 1568, 2093].map((f, i) => tone('square', f, undefined, 0.08, 0.035, i * 0.05)),
  thunder: [noise('highpass', 4000, undefined, 0.1, 0.07), tone('sawtooth', 2400, 200, 0.15, 0.05), noise('lowpass', 400, 80, 0.5, 0.1, 0.08)],
  gust: [noise('bandpass', 500, 2500, 0.5, 0.08, 0, 1.2)],
  barricade: [noise('lowpass', 700, 200, 0.15, 0.09), tone('square', 180, 120, 0.08, 0.04), noise('lowpass', 700, 200, 0.12, 0.08, 0.12), tone('square', 200, 140, 0.08, 0.04, 0.12)],
};

/** 합체 스킬은 두 재료 소리를 겹친다 */
const FUSED: Record<string, [string, string]> = {
  comet: ['meteor', 'blizzard'],
  golden_meteor: ['meteor', 'gold_rush'],
  judgement: ['thunder', 'meteor'],
  ice_wall: ['blizzard', 'repair'],
  frost_gale: ['gust', 'blizzard'],
  alchemy: ['repair', 'gold_rush'],
  tempest: ['gust', 'thunder'],
};

export function skillSound(id: string): SoundSpec {
  const parts = FUSED[id] ?? [id];
  return parts.flatMap((p) => SKILL_SOUNDS[p] ?? []);
}

/** 이벤트·버튼 소리 모음 */
export const UI_SOUNDS = {
  kill: [tone('triangle', 1300, 1900, 0.06, 0.035)],
  crit: [tone('square', 1800, 2400, 0.05, 0.025)],
  towerHit: [noise('lowpass', 500, 150, 0.14, 0.09), tone('sawtooth', 90, 50, 0.12, 0.05)],
  round: [tone('triangle', 523, undefined, 0.1, 0.06), tone('triangle', 784, undefined, 0.14, 0.06, 0.1)],
  elite: [tone('square', 220, undefined, 0.18, 0.05), tone('square', 196, undefined, 0.25, 0.05, 0.18)],
  boss: [tone('sawtooth', 110, undefined, 0.3, 0.07), tone('sawtooth', 104, undefined, 0.3, 0.07, 0.3), tone('sawtooth', 98, undefined, 0.6, 0.07, 0.6), noise('lowpass', 300, 80, 1.0, 0.08, 0.2)],
  bossDown: [523, 659, 784, 1047, 1319].map((f, i) => tone('square', f, undefined, 0.16, 0.05, i * 0.09)),
  merge: [659, 784, 1047, 1319].map((f, i) => tone('square', f, undefined, 0.1, 0.05, i * 0.06)),
  steal: [tone('square', 900, 300, 0.2, 0.04)],
  choice: [tone('triangle', 523, undefined, 0.15, 0.06), tone('triangle', 1047, undefined, 0.25, 0.06, 0.12)],
  bossCancel: [tone('square', 1568, 784, 0.12, 0.05), tone('triangle', 1047, undefined, 0.12, 0.05, 0.1)],
  bossImpact: [noise('lowpass', 600, 80, 0.6, 0.14), tone('sawtooth', 70, 30, 0.5, 0.09)],
  bossSummon: [tone('triangle', 90, 180, 0.3, 0.06), noise('lowpass', 400, 900, 0.3, 0.05)],
  bossShot: [noise('bandpass', 1200, 400, 0.18, 0.05, 0, 1.5), tone('sawtooth', 500, 150, 0.18, 0.025)],
  bossEnrage: [tone('sawtooth', 150, 90, 0.5, 0.08), tone('square', 160, 95, 0.5, 0.04, 0.05)],
  learn: [tone('triangle', 988, undefined, 0.08, 0.05), tone('triangle', 1480, undefined, 0.12, 0.05, 0.08)],
  move: [noise('lowpass', 900, 400, 0.08, 0.05), tone('square', 660, undefined, 0.05, 0.03, 0.06)],
  fuse: [523, 659, 784, 1047, 1319, 1568].map((f, i) => tone('square', f, undefined, 0.14, 0.05, i * 0.06)),
  perk: [392, 523, 659, 784].map((f, i) => tone('triangle', f, undefined, 0.12, 0.06, i * 0.07)),
  rotate: [noise('lowpass', 500, 250, 0.25, 0.09, 0, 2), tone('square', 180, 120, 0.18, 0.03), tone('triangle', 660, undefined, 0.06, 0.04, 0.2)],
  tick: [tone('triangle', 880, undefined, 0.03, 0.03)],
  sell: [tone('square', 1568, 1047, 0.12, 0.04), tone('triangle', 2093, undefined, 0.06, 0.03, 0.08)],
  buy: [tone('square', 988, undefined, 0.06, 0.04), tone('square', 1319, undefined, 0.1, 0.04, 0.06)],
  reroll: [noise('bandpass', 2000, 5000, 0.12, 0.04, 0, 2), tone('triangle', 400, 1200, 0.12, 0.04)],
  upgrade: [523, 784, 1047, 1568].map((f, i) => tone('triangle', f, undefined, 0.14, 0.06, i * 0.06)),
  denied: [tone('square', 160, undefined, 0.12, 0.04)],
  /** 빈 면으로 맞음: 짧고 날카로운 경고 두 번 */
  emptyFace: [tone('square', 880, undefined, 0.07, 0.05), tone('square', 880, undefined, 0.07, 0.05, 0.12)],
  /** 다음 라운드 예보가 떴다 */
  forecast: [tone('sine', 1175, undefined, 0.12, 0.05), tone('sine', 1568, undefined, 0.2, 0.05, 0.1)],
  /** 심장 박동 (쿵-쿵) */
  heartbeat: [tone('sine', 65, 45, 0.12, 0.12), tone('sine', 60, 40, 0.1, 0.09, 0.18)],
  /** 연습 판 단계 넘어감 */
  lessonStep: [tone('triangle', 1047, undefined, 0.1, 0.05), tone('triangle', 1568, undefined, 0.16, 0.05, 0.08)],
  win: [523, 659, 784, 1047].map((f, i) => tone('triangle', f, undefined, 0.25, 0.07, i * 0.18)),
  lose: [392, 330, 262, 196].map((f, i) => tone('triangle', f, undefined, 0.3, 0.07, i * 0.2)),
} satisfies Record<string, SoundSpec>;
