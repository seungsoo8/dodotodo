/** 이야기 효과음 (tone · noise 겹) */
import type { Layer, SoundSpec } from './sfx.ts';

const tone = (wave: OscillatorType, freq: number, to: number | undefined, dur: number, gain: number, delay = 0): Layer => ({ kind: 'tone', wave, freq, to, dur, gain, delay });
const noise = (filter: BiquadFilterType, freq: number, to: number | undefined, dur: number, gain: number, delay = 0, q = 1): Layer => ({ kind: 'noise', filter, freq, to, dur, gain, delay, q });
const bells = (notes: number[], gap: number, gain = 0.05, dur = 0.5): SoundSpec => notes.flatMap((hz, i) => [tone('sine', hz, undefined, dur, gain, i * gap), tone('sine', hz * 2, undefined, dur * 0.5, gain * 0.3, i * gap)]);

export const STORY_SFX: Record<string, SoundSpec> = {
  click: [tone('square', 880, 1100, 0.04, 0.03)],
  move: [tone('square', 660, undefined, 0.025, 0.015)],
  back: [tone('square', 660, 440, 0.06, 0.025)],
  page: [tone('triangle', 1200, undefined, 0.03, 0.025)],
  talk: [tone('triangle', 900, undefined, 0.02, 0.012)],
  memory: [...bells([1047, 1319, 1568, 2093], 0.12, 0.05, 0.9), noise('highpass', 5000, 9000, 1.2, 0.02)],
  star: bells([1568, 2093, 2637], 0.07, 0.05, 0.4),
  fold: [noise('bandpass', 3000, 1800, 0.06, 0.05, 0, 2), tone('triangle', 1200, 1400, 0.04, 0.02)],
  miss: [tone('square', 220, 200, 0.08, 0.03)],
  push: [noise('lowpass', 600, 200, 0.3, 0.09), tone('sine', 90, 60, 0.25, 0.08)],
  rope: [noise('bandpass', 1500, 3000, 0.25, 0.05, 0, 2), tone('triangle', 400, 800, 0.2, 0.03, 0.1), noise('lowpass', 400, 100, 0.15, 0.06, 0.3)],
  steps: [tone('sine', 70, 40, 0.25, 0.25), tone('sine', 70, 40, 0.25, 0.25, 0.55), tone('sine', 70, 40, 0.25, 0.28, 1.1)],
  freeze: [tone('sine', 1760, 880, 0.35, 0.05), tone('triangle', 2637, 1319, 0.3, 0.03, 0.04)],
  caught: [tone('square', 880, 220, 0.4, 0.05), tone('square', 660, 165, 0.4, 0.035, 0.05)],
  safe: bells([523, 659, 784], 0.08, 0.05, 0.3),
  blow: [noise('lowpass', 1200, 300, 0.4, 0.08)],
  cough: [noise('bandpass', 800, 400, 0.12, 0.08), noise('bandpass', 800, 400, 0.12, 0.08, 0.2)],
  stitch: [tone('square', 2000, 1500, 0.03, 0.03), noise('highpass', 4000, undefined, 0.03, 0.03)],
  cheer: [...bells([784, 988, 1175, 1568], 0.07, 0.05, 0.3), noise('bandpass', 2000, 3000, 0.5, 0.03, 0, 0.5)],
  giggle: bells([1175, 1319, 1175, 1319], 0.06, 0.03, 0.12),
  windTick: [tone('square', 2400, 1800, 0.025, 0.02), noise('highpass', 5000, undefined, 0.02, 0.02)],
  door: [noise('lowpass', 500, 200, 0.3, 0.07), tone('sine', 140, 90, 0.2, 0.05)],
  tape: [noise('bandpass', 2500, 1200, 0.5, 0.06, 0, 1.5)],
  thud: [tone('sine', 100, 50, 0.2, 0.12), noise('lowpass', 500, 100, 0.15, 0.05)],
  phone: [tone('square', 880, undefined, 0.3, 0.025), tone('square', 880, undefined, 0.3, 0.025, 0.45)],
  thunder: [noise('lowpass', 900, 80, 1.6, 0.14), tone('sine', 60, 30, 1.2, 0.08)],
  chime: bells([1319, 1047, 784, 523], 0.25, 0.04, 1.2),
  sparkle: bells([2093, 2637, 3136], 0.05, 0.03, 0.3),
  open: bells([523, 784, 1047], 0.1, 0.05, 0.6),
  pop: [tone('sine', 600, 1200, 0.06, 0.05)],
};
