/** 효과음 설계: tone(발진기) · noise(잡음 + 거르개) 겹을 쌓는다 */
export interface Layer {
  kind: 'tone' | 'noise';
  wave?: OscillatorType;
  freq: number;
  to?: number;
  filter?: BiquadFilterType;
  q?: number;
  dur: number;
  gain: number;
  delay?: number;
}

export type SoundSpec = Layer[];

const tone = (wave: OscillatorType, freq: number, to: number | undefined, dur: number, gain: number, delay = 0): Layer => ({ kind: 'tone', wave, freq, to, dur, gain, delay });
const noise = (filter: BiquadFilterType, freq: number, to: number | undefined, dur: number, gain: number, delay = 0, q = 1): Layer => ({ kind: 'noise', filter, freq, to, dur, gain, delay, q });
const arp = (notes: number[], gap: number, wave: OscillatorType = 'square', gain = 0.05, dur = 0.09): SoundSpec => notes.map((hz, i) => tone(wave, hz, undefined, dur, gain, i * gap));

export const SFX = {
  // 기본 공격
  swordSwing: [noise('bandpass', 2600, 5200, 0.09, 0.07, 0, 2), tone('triangle', 900, 500, 0.05, 0.02)],
  axeSwing: [noise('lowpass', 1600, 500, 0.14, 0.09), tone('triangle', 240, 150, 0.1, 0.03)],
  bowShot: [tone('triangle', 760, 420, 0.08, 0.05), noise('highpass', 4000, undefined, 0.04, 0.03)],
  orbShot: [tone('sine', 900, 1500, 0.1, 0.04), tone('square', 1350, 2000, 0.06, 0.015, 0.02)],
  hit: [noise('bandpass', 1400, 600, 0.06, 0.08, 0, 1.5), tone('square', 180, 90, 0.05, 0.03)],
  crit: [noise('bandpass', 2400, 900, 0.09, 0.09, 0, 2), tone('square', 1200, 600, 0.08, 0.04), tone('square', 1800, 900, 0.06, 0.02, 0.03)],
  kill: [tone('square', 520, 260, 0.08, 0.035), noise('lowpass', 1200, 300, 0.12, 0.05)],
  eliteKill: arp([523, 659, 784, 1047], 0.05, 'square', 0.04),
  hurt: [tone('square', 300, 120, 0.16, 0.07), noise('lowpass', 900, 200, 0.15, 0.06)],
  roll: [noise('bandpass', 700, 1600, 0.16, 0.05, 0, 1.2)],
  explode: [noise('lowpass', 1600, 120, 0.4, 0.14), tone('sine', 120, 40, 0.35, 0.12)],
  chain: [tone('sawtooth', 2200, 500, 0.08, 0.04), noise('highpass', 6000, undefined, 0.06, 0.04)],
  monsterShot: [tone('square', 600, 300, 0.07, 0.025)],
  windup: [tone('sawtooth', 200, 500, 0.3, 0.03)],
  spawnElite: [tone('square', 330, 660, 0.25, 0.04), tone('square', 495, 990, 0.25, 0.02, 0.05)],
  gold: arp([1568, 2093], 0.04, 'square', 0.03, 0.06),
  item: arp([784, 988, 1175], 0.05, 'triangle', 0.06, 0.1),
  rareItem: arp([784, 988, 1175, 1568, 1976], 0.06, 'square', 0.045, 0.14),
  potion: [tone('sine', 400, 900, 0.18, 0.06), tone('sine', 800, 1400, 0.12, 0.03, 0.06)],
  levelUp: arp([523, 659, 784, 1047, 1319, 1568], 0.07, 'square', 0.05, 0.16),
  bossIntro: [tone('sawtooth', 110, 55, 1.2, 0.08), tone('square', 220, 110, 1, 0.04, 0.1), noise('lowpass', 400, 100, 1, 0.08)],
  bossPhase: [tone('sawtooth', 160, 320, 0.5, 0.07), noise('bandpass', 800, 2000, 0.4, 0.06)],
  bossDown: [...arp([392, 523, 659, 784, 1047], 0.09, 'square', 0.06, 0.25), noise('lowpass', 1200, 100, 0.8, 0.1)],
  riftClear: arp([659, 831, 988, 1319], 0.08, 'triangle', 0.07, 0.25),
  phoenix: arp([440, 554, 659, 880, 1109], 0.06, 'sawtooth', 0.04, 0.2),
  // 탐험대 교대: 휙 + 짠
  tag: [noise('bandpass', 900, 3200, 0.14, 0.06, 0, 1.4), ...arp([784, 1175], 0.05, 'square', 0.035, 0.08)],
  heroDown: arp([523, 440, 349, 262], 0.09, 'triangle', 0.06, 0.16),
  heroUp: arp([392, 523, 659], 0.07, 'triangle', 0.05, 0.12),
  // 태엽: 끼릭끼릭 · 가득 차면 땡
  windTick: [tone('square', 2400, 1800, 0.025, 0.02), noise('highpass', 5000, undefined, 0.02, 0.02)],
  overwind: [...arp([1047, 1319, 1568, 2093], 0.04, 'square', 0.04, 0.1), tone('sine', 2093, undefined, 0.5, 0.04, 0.16)],
  friend: arp([659, 784, 988, 1319, 1568], 0.07, 'triangle', 0.06, 0.18),
  join: arp([523, 659, 784, 1047, 784, 1047, 1319], 0.09, 'square', 0.045, 0.16),
  chest: [tone('square', 220, 330, 0.12, 0.05), ...arp([988, 1319, 1568, 1976], 0.06, 'triangle', 0.06, 0.16).map((l) => ({ ...l, delay: (l.delay ?? 0) + 0.12 }))],
  rescueStart: [tone('sawtooth', 160, 90, 0.4, 0.06), noise('lowpass', 800, 200, 0.4, 0.06)],
  // 얼음 땡: 쿵 쿵 발소리 → 얼음! → 들킴 / 휴
  footstep: [tone('sine', 80, 40, 0.22, 0.2), noise('lowpass', 300, 80, 0.2, 0.08)],
  freeze: [tone('sine', 1760, 880, 0.35, 0.05), tone('triangle', 2637, 1319, 0.3, 0.03, 0.04), noise('highpass', 6000, undefined, 0.25, 0.03)],
  caught: [tone('square', 880, 220, 0.4, 0.06), tone('square', 660, 165, 0.4, 0.04, 0.05)],
  freezeOk: arp([523, 659, 784], 0.08, 'sine', 0.06, 0.14),
  duo: [...arp([523, 784, 1047, 1568], 0.045, 'square', 0.05, 0.12), noise('lowpass', 2000, 200, 0.4, 0.1, 0.12), tone('sine', 140, 50, 0.4, 0.12, 0.12)],
  link: arp([1319, 1760], 0.04, 'triangle', 0.04, 0.08),
  windEmpty: [tone('square', 700, 90, 0.7, 0.05)],
  // 보스 규칙: 태엽 풀림 (끼이익…) · 다시 감기 · 젤리 쪼개짐 · 합쳐짐
  unwind: [tone('square', 900, 120, 0.9, 0.05), tone('triangle', 450, 60, 0.9, 0.04, 0.05)],
  rewind: [...arp([300, 400, 300, 400, 500], 0.07, 'square', 0.03, 0.05)],
  split: [noise('lowpass', 1200, 300, 0.25, 0.08), tone('sine', 300, 600, 0.2, 0.05)],
  merge: [tone('sine', 600, 250, 0.3, 0.06)],
  died: arp([392, 330, 262, 196], 0.18, 'triangle', 0.08, 0.3),
  noSp: [tone('square', 220, 200, 0.1, 0.04)],
  portal: [tone('sine', 300, 1200, 0.5, 0.06), tone('sine', 450, 1800, 0.4, 0.03, 0.1)],
  locked: [tone('square', 200, 150, 0.12, 0.05), tone('square', 150, 120, 0.12, 0.05, 0.1)],
  // 화면
  click: [tone('square', 880, 1100, 0.04, 0.035)],
  move: [tone('square', 660, undefined, 0.025, 0.02)],
  back: [tone('square', 660, 440, 0.06, 0.03)],
  buy: arp([988, 1319], 0.05, 'square', 0.04, 0.07),
  sell: arp([1319, 1568, 2093], 0.04, 'square', 0.03, 0.06),
  equip: [noise('bandpass', 1500, 900, 0.08, 0.05, 0, 2), tone('triangle', 500, 700, 0.08, 0.04)],
  forgeOk: [noise('bandpass', 3000, 1500, 0.1, 0.08, 0, 3), ...arp([1047, 1319, 1568, 2093], 0.06, 'square', 0.045, 0.12)],
  forgeFail: [noise('bandpass', 2500, 800, 0.15, 0.08, 0, 3), ...arp([392, 330, 262], 0.1, 'triangle', 0.06, 0.15)],
  error: [tone('square', 160, 140, 0.12, 0.05)],
  quest: arp([659, 784, 1047, 1319], 0.08, 'triangle', 0.07, 0.2),
  level: arp([784, 1047], 0.06, 'square', 0.04, 0.1),
  page: [tone('triangle', 1200, undefined, 0.03, 0.03)],
} satisfies Record<string, SoundSpec>;

export type SfxId = keyof typeof SFX;

/** 스킬 소리 (스킬 첫 글자 = 직업) */
export function skillSound(id: string): SoundSpec {
  switch (id) {
    case 't_rush':
      return [noise('bandpass', 1200, 4000, 0.18, 0.08, 0, 1.5), tone('square', 400, 900, 0.12, 0.03)];
    case 't_spin':
      return [noise('bandpass', 1800, 3600, 0.3, 0.07, 0, 2), noise('bandpass', 3600, 1800, 0.2, 0.05, 0.12, 2)];
    case 't_leap':
      return [tone('triangle', 300, 900, 0.2, 0.05), noise('lowpass', 1200, 100, 0.3, 0.1, 0.22)];
    case 't_dance':
      return arp([784, 988, 1175, 1568], 0.05, 'square', 0.04, 0.08);
    case 'b_slam':
      return [noise('lowpass', 900, 80, 0.4, 0.14, 0.15), tone('sine', 100, 40, 0.35, 0.12, 0.15)];
    case 'b_roar':
      return [tone('sawtooth', 140, 90, 0.5, 0.08), noise('lowpass', 600, 200, 0.5, 0.08)];
    case 'b_axe':
      return [noise('bandpass', 900, 2000, 0.5, 0.06, 0, 2)];
    case 'b_rage':
      return [tone('sawtooth', 110, 220, 0.6, 0.08), noise('lowpass', 1000, 80, 0.5, 0.12)];
    case 'r_fan':
      return [tone('triangle', 900, 500, 0.08, 0.05), tone('triangle', 1000, 550, 0.08, 0.04, 0.03), noise('highpass', 4000, undefined, 0.08, 0.04)];
    case 'r_rain':
      return [noise('highpass', 3000, 6000, 0.6, 0.05)];
    case 'r_bomb':
      return [tone('triangle', 500, 300, 0.12, 0.05)];
    case 'r_hunt':
      return arp([659, 880, 1175], 0.06, 'triangle', 0.05, 0.1);
    case 'n_fire':
      return [noise('lowpass', 800, 2400, 0.25, 0.08), tone('sawtooth', 200, 400, 0.2, 0.03)];
    case 'n_frost':
      return [tone('sine', 1500, 2600, 0.3, 0.05), tone('sine', 2250, 3000, 0.25, 0.03, 0.05), noise('highpass', 5000, undefined, 0.3, 0.03)];
    case 'n_chain':
      return [tone('sawtooth', 2400, 400, 0.2, 0.05), noise('highpass', 5000, undefined, 0.2, 0.05)];
    case 'n_meteor':
      return [tone('sawtooth', 600, 100, 0.8, 0.05), noise('lowpass', 2000, 200, 0.8, 0.06)];
    default:
      return SFX.click;
  }
}
