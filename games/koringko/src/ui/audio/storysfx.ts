/** 이야기 효과음 (tone · noise 겹) */
import type { Layer, SoundSpec } from './sfx.ts';

const tone = (wave: OscillatorType, freq: number, to: number | undefined, dur: number, gain: number, delay = 0): Layer => ({ kind: 'tone', wave, freq, to, dur, gain, delay });
const noise = (filter: BiquadFilterType, freq: number, to: number | undefined, dur: number, gain: number, delay = 0, q = 1): Layer => ({ kind: 'noise', filter, freq, to, dur, gain, delay, q });
const bells = (notes: number[], gap: number, gain = 0.05, dur = 0.5): SoundSpec => notes.flatMap((hz, i) => [tone('sine', hz, undefined, dur, gain, i * gap), tone('sine', hz * 2, undefined, dur * 0.5, gain * 0.3, i * gap)]);

// ───────── 새 효과음 (물건 · 집 · 부엌 · 바깥) ─────────

/** 겹에 덧붙이기 (attack · release · trem · vib) */
const w = (l: Layer, o: Partial<Layer>): Layer => ({ ...l, ...o });
/** 겹들을 통째로 늦춘다 */
const later = (s: SoundSpec, by: number): SoundSpec => s.map((l) => ({ ...l, delay: (l.delay ?? 0) + by }));
/** 늘 같은 소리가 나도록 씨앗을 고정한 들쭉날쭉 (0~1) */
function seeded(seed: number): () => number {
  let x = seed >>> 0 || 1;
  return () => {
    x = (x * 1664525 + 1013904223) >>> 0;
    return x / 2 ** 32;
  };
}
const rand = (r: () => number, a: number, b: number) => a + (b - a) * r();
/**
 * 짧은 잡음 조각을 n 개 흩뿌린다 (찢어짐 · 바스락 · 바삭).
 * 조각마다 주파수 · 세기 · 길이 · 시각이 조금씩 다르다.
 */
function grains(seed: number, n: number, o: { from: number; span: number; lo: number; hi: number; gain: [number, number]; dur: [number, number]; q: [number, number]; drop?: number }): SoundSpec {
  const r = seeded(seed);
  return Array.from({ length: n }, (_, i) => {
    const f = rand(r, o.lo, o.hi);
    const at = o.from + (o.span * (i + rand(r, 0, 0.8))) / n;
    return noise('bandpass', f, f * (o.drop ?? rand(r, 0.7, 1.25)), rand(r, ...o.dur), rand(r, ...o.gain), at, rand(r, ...o.q));
  });
}
/** 나무 · 바닥을 한 번 딛는 소리 (계단 · 토닥) */
const knockAt = (at: number, hz: number, gain: number): SoundSpec => [tone('sine', hz, hz * 0.62, 0.09, gain, at), noise('bandpass', hz * 7, hz * 5, 0.05, gain * 0.5, at, 3)];
/** 쇠 · 사기 울림: 어긋난 배음 몇 개 */
const ring = (hz: number, at: number, gain: number, dur: number, parts: [number, number][] = [[1, 1], [2.76, 0.35], [5.4, 0.15]]): SoundSpec => parts.map(([k, g]) => tone('sine', hz * k, undefined, dur / Math.sqrt(k), gain * g, at));
/** 삐걱: 끈적하게 미끄러지는 톱니파 (높이가 바르르) */
const creak = (from: number, to: number, dur: number, gain: number, at = 0): SoundSpec => [
  w(tone('sawtooth', from, to, dur, gain, at), { attack: dur * 0.2, vib: { rate: 24, depth: from * 0.06 } }),
  w(tone('square', from * 2, to * 2, dur * 0.8, gain * 0.35, at + 0.02), { attack: dur * 0.2, vib: { rate: 31, depth: from * 0.1 } }),
];

const MORE: Record<string, SoundSpec> = {
  // 상자 · 종이
  /** 테이프 쭉: 거친 바탕 잡음 위로 짧은 찢김 조각이 들쭉날쭉, 끝에 톡 떨어짐 */
  tapeRip: [
    w(noise('bandpass', 1800, 2800, 0.6, 0.025, 0, 1.2), { attack: 0.03, trem: { rate: 37, depth: 0.7 } }),
    ...grains(11, 10, { from: 0, span: 0.55, lo: 1400, hi: 4800, gain: [0.03, 0.06], dur: [0.03, 0.08], q: [1.5, 4] }),
    noise('highpass', 4000, undefined, 0.04, 0.04, 0.58),
    tone('sine', 160, 90, 0.05, 0.03, 0.6),
  ],
  /** 테이프 짧게 붙이기: 찍 + 손바닥으로 꾹 */
  tapeStick: [
    ...grains(12, 3, { from: 0, span: 0.15, lo: 1800, hi: 3600, gain: [0.03, 0.05], dur: [0.03, 0.06], q: [1.5, 3] }),
    tone('sine', 160, 90, 0.08, 0.06, 0.2),
    noise('lowpass', 900, 300, 0.06, 0.04, 0.2),
  ],
  /** 매직펜 끽 끽 끽 (세 번째는 짧게) */
  marker: [0, 0.22, 0.42].flatMap((at, i) => [
    w(noise('bandpass', 2600 + i * 200, 3300, i === 2 ? 0.1 : 0.16, 0.035, at, 6), { attack: 0.02 }),
    w(tone('triangle', 2400 + i * 150, 2900, i === 2 ? 0.08 : 0.14, 0.007, at), { attack: 0.02 }),
  ]),
  /** 상자 뚜껑: 종이 스침 → 툭 */
  cardboard: [noise('bandpass', 1500, 800, 0.12, 0.03, 0, 1.2), tone('sine', 120, 70, 0.15, 0.08, 0.1), noise('lowpass', 700, 250, 0.18, 0.06, 0.1), noise('bandpass', 1200, undefined, 0.06, 0.025, 0.11, 2)],
  /** 상자 끌기: 바닥을 긁는 낮은 마찰 (드드득) */
  boxDrag: [
    w(noise('lowpass', 500, 380, 0.8, 0.06), { attack: 0.08, release: 0.15, trem: { rate: 14, depth: 0.6 } }),
    w(noise('bandpass', 1200, 1000, 0.8, 0.025, 0, 2), { attack: 0.08, release: 0.15, trem: { rate: 9, depth: 0.5 } }),
    w(tone('sine', 70, 65, 0.8, 0.03), { attack: 0.1, release: 0.2 }),
  ],
  /** 종이 바스락 */
  paper: [...grains(13, 6, { from: 0, span: 0.35, lo: 2500, hi: 6000, gain: [0.025, 0.04], dur: [0.03, 0.07], q: [0.8, 1.5] }), w(noise('highpass', 5000, undefined, 0.3, 0.012), { attack: 0.05 })],
  /** 봉투 뜯기: 점점 높아지는 찌이익 + 종이 펄럭 */
  letterOpen: [
    ...grains(14, 7, { from: 0, span: 0.4, lo: 2000, hi: 4200, gain: [0.03, 0.05], dur: [0.04, 0.08], q: [2, 4], drop: 1.2 }),
    noise('bandpass', 1400, 800, 0.08, 0.025, 0.45, 1),
  ],
  /** 종이 구기기: 잔 바삭거림이 연달아 */
  crumple: [
    ...grains(15, 12, { from: 0, span: 0.5, lo: 1500, hi: 5000, gain: [0.03, 0.06], dur: [0.02, 0.05], q: [2, 5] }),
    w(noise('lowpass', 1200, 600, 0.5, 0.02), { attack: 0.05 }),
  ],

  // 집
  /** 문 끼이익: 걸쇠 딸깍 → 경첩 삐걱 */
  doorOpen: [noise('highpass', 3000, undefined, 0.03, 0.04), ...creak(180, 260, 0.7, 0.015, 0.04), w(noise('bandpass', 600, 500, 0.6, 0.02, 0.04, 1), { attack: 0.2 })],
  /** 문 탁: 쿵 + 걸쇠 찰칵 */
  doorClose: [tone('sine', 110, 60, 0.22, 0.12), noise('lowpass', 600, 150, 0.18, 0.08), noise('highpass', 3000, undefined, 0.03, 0.04, 0.02), noise('bandpass', 1800, undefined, 0.04, 0.03, 0.07, 3)],
  /** 똑똑 */
  knock: [0, 0.17].flatMap((at) => [tone('sine', 220, 160, 0.08, 0.08, at), noise('bandpass', 1200, 900, 0.05, 0.05, at, 3)]),
  /** 나무 계단 오르기: 가벼운 통 · 통 · 통 · 통 (두 번째에 삐걱) */
  stairs: [
    ...[0, 0.42, 0.84, 1.26].flatMap((at, i) => [...knockAt(at, 150 + i * 6, 0.08), tone('triangle', 320, 260, 0.06, 0.02, at)]),
    ...creak(300, 340, 0.2, 0.006, 0.47),
  ],
  /** 서랍 드르륵 → 탁 */
  drawer: [
    w(noise('bandpass', 900, 1300, 0.45, 0.05, 0, 2), { trem: { rate: 22, depth: 0.5 } }),
    w(noise('lowpass', 400, undefined, 0.45, 0.04), { release: 0.1 }),
    tone('sine', 130, 80, 0.1, 0.07, 0.45),
    noise('lowpass', 800, 300, 0.06, 0.04, 0.45),
  ],
  /** 지퍼 지이익: 이빨 하나하나가 딸깍대는 떨림 */
  zipper: [
    w(noise('bandpass', 3000, 4500, 0.5, 0.04, 0, 3), { attack: 0.03, trem: { rate: 45, depth: 0.9 } }),
    w(noise('highpass', 6000, undefined, 0.5, 0.012), { trem: { rate: 45, depth: 0.9 } }),
  ],
  /** 커튼 촥: 천이 휙 + 고리가 봉 위로 짤랑 */
  curtain: [
    w(noise('bandpass', 800, 2500, 0.45, 0.06, 0, 0.7), { attack: 0.12 }),
    w(noise('highpass', 5000, undefined, 0.35, 0.015), { trem: { rate: 30, depth: 0.8 } }),
  ],
  /** 의자 끄는 소리: 끼익 긁힘 → 툭 */
  chair: [
    w(noise('bandpass', 500, 700, 0.35, 0.05, 0, 4), { attack: 0.04, trem: { rate: 30, depth: 0.7 } }),
    w(tone('sawtooth', 140, 120, 0.3, 0.01), { attack: 0.04 }),
    tone('sine', 120, 80, 0.08, 0.05, 0.36),
  ],
  /** 침대 삐걱 (눌렀다 놓기) */
  bed: [...creak(240, 200, 0.35, 0.012), ...creak(220, 260, 0.3, 0.01, 0.45), noise('lowpass', 300, 150, 0.3, 0.04)],
  /** 이불 스침 */
  blanket: [w(noise('bandpass', 1200, 600, 0.6, 0.05, 0, 0.6), { attack: 0.15 }), w(noise('highpass', 3000, undefined, 0.5, 0.012), { attack: 0.1 })],
  /** 째깍째깍 (높낮이 번갈아) */
  clock: [0, 0.5, 1, 1.5].flatMap((at, i) => [tone('triangle', i % 2 ? 2600 : 3000, i % 2 ? 2300 : 2700, 0.02, 0.025, at), noise('bandpass', 4000, undefined, 0.02, 0.04, at, 4)]),
  /** 괘종 댕 · 댕 · 댕 (낮은 쇠 울림) */
  clockChime: [0, 0.9, 1.8].flatMap((at) => [...ring(392, at, 0.06, 1.6), noise('bandpass', 2000, undefined, 0.02, 0.03, at, 2)]),
  /** 전등 스위치 딸깍 */
  switch: [noise('bandpass', 3000, undefined, 0.02, 0.06, 0, 3), tone('square', 1500, 900, 0.015, 0.02), noise('bandpass', 2200, undefined, 0.015, 0.03, 0.03, 3)],
  /** 창문 드르륵 → 탁 (유리 살짝 떨림) */
  window: [
    w(noise('bandpass', 600, 900, 0.6, 0.05, 0, 3), { attack: 0.05, trem: { rate: 18, depth: 0.5 } }),
    w(noise('lowpass', 300, undefined, 0.6, 0.04), { release: 0.1 }),
    tone('sine', 160, 90, 0.1, 0.05, 0.6),
    tone('sine', 2600, undefined, 0.15, 0.01, 0.6),
  ],

  // 부엌
  /** 주전자: 보글보글 끓다가 휘파람이 천천히 커진다 */
  kettle: [
    w(noise('lowpass', 400, undefined, 2.4, 0.03), { attack: 0.3, release: 0.4, trem: { rate: 9, depth: 0.6 } }),
    w(tone('sine', 1800, 2200, 2.2, 0.035, 0.2), { attack: 1.4, release: 0.3, vib: { rate: 6, depth: 25 } }),
    w(tone('sine', 3600, 4400, 2.2, 0.008, 0.2), { attack: 1.4, release: 0.3, vib: { rate: 6, depth: 50 } }),
    w(noise('bandpass', 2000, 2400, 2.2, 0.03, 0.2, 6), { attack: 1.4, release: 0.3 }),
  ],
  /** 따르기: 물줄기 + 차오르며 높아지는 꼴꼴 */
  pour: [
    w(noise('bandpass', 700, 1200, 1.2, 0.05, 0, 2), { attack: 0.08, release: 0.3, trem: { rate: 11, depth: 0.4 } }),
    w(tone('sine', 300, 700, 1.2, 0.012), { attack: 0.1, release: 0.3, trem: { rate: 13, depth: 0.6 } }),
    w(noise('highpass', 2500, undefined, 0.5, 0.015, 0.1), { trem: { rate: 17, depth: 0.7 } }),
  ],
  /** 숟가락 달그락 */
  spoon: [...ring(2600, 0, 0.03, 0.2, [[1, 1], [1.58, 0.5]]), noise('highpass', 5000, undefined, 0.02, 0.03), ...ring(3300, 0.12, 0.025, 0.15, [[1, 1], [1.58, 0.5]]), noise('highpass', 5000, undefined, 0.02, 0.025, 0.12)],
  /** 그릇 부딪힘 (사기 짤각 두 번) */
  dish: [...ring(1700, 0, 0.035, 0.3, [[1, 1], [1.7, 0.6], [2.76, 0.3]]), noise('bandpass', 2500, undefined, 0.04, 0.06, 0, 2), ...ring(1500, 0.09, 0.02, 0.2, [[1, 1], [1.7, 0.6]]), noise('bandpass', 2300, undefined, 0.03, 0.03, 0.09, 2)],
  /** 도마 칼질 통통통통 */
  chop: [0, 0.22, 0.44, 0.66].flatMap((at, i) => [tone('sine', 180 - i * 5, 110, 0.06, 0.08, at), noise('bandpass', 2500, undefined, 0.03, 0.05, at, 1.5), noise('lowpass', 800, 300, 0.05, 0.04, at)]),
  /** 지글지글: 쉬이 + 기름 톡톡 */
  sizzle: [
    w(noise('highpass', 4000, undefined, 1.6, 0.03), { attack: 0.05, release: 0.4, trem: { rate: 23, depth: 0.7 } }),
    w(noise('bandpass', 7000, undefined, 1.6, 0.025, 0, 1), { attack: 0.05, release: 0.4, trem: { rate: 37, depth: 0.8 } }),
    ...grains(16, 8, { from: 0.05, span: 1.4, lo: 1800, hi: 3200, gain: [0.025, 0.04], dur: [0.01, 0.02], q: [2, 4] }),
  ],
  /** 수돗물 쏴아 */
  faucet: [
    w(noise('bandpass', 1200, undefined, 1.5, 0.05, 0, 0.8), { attack: 0.1, release: 0.3, trem: { rate: 8, depth: 0.25 } }),
    w(noise('highpass', 3500, undefined, 1.5, 0.02), { attack: 0.1, release: 0.3 }),
    w(noise('lowpass', 400, undefined, 1.5, 0.03), { attack: 0.1, release: 0.3 }),
  ],
  /** 후루룩 (두 번, 두 번째가 더 높게) */
  slurp: [
    w(noise('bandpass', 900, 2200, 0.3, 0.05, 0, 3), { attack: 0.08, trem: { rate: 25, depth: 0.6 } }),
    w(tone('sine', 300, 550, 0.28, 0.012), { attack: 0.08, trem: { rate: 25, depth: 0.6 } }),
    w(noise('bandpass', 1200, 2800, 0.25, 0.045, 0.36, 3), { attack: 0.06, trem: { rate: 28, depth: 0.6 } }),
  ],
  /** 과자 바삭 (한 입 + 씹기) */
  crunch: [
    ...grains(17, 10, { from: 0, span: 0.22, lo: 1000, hi: 4000, gain: [0.04, 0.07], dur: [0.015, 0.04], q: [1, 3] }),
    noise('lowpass', 600, 200, 0.15, 0.05),
    ...grains(18, 5, { from: 0.4, span: 0.15, lo: 1000, hi: 3000, gain: [0.025, 0.04], dur: [0.015, 0.03], q: [1, 3] }),
  ],

  // 바느질 · 손
  /** 재봉틀 드르륵: 바늘이 빠르게 오르내리는 떨림 + 모터 웅 */
  sewing: [
    w(tone('square', 70, undefined, 1.2, 0.012), { attack: 0.05, release: 0.15, trem: { rate: 18, depth: 0.9 } }),
    w(noise('bandpass', 1500, undefined, 1.2, 0.035, 0, 3), { attack: 0.05, release: 0.15, trem: { rate: 18, depth: 0.95 } }),
    w(noise('lowpass', 300, undefined, 1.2, 0.04), { attack: 0.05, release: 0.15, trem: { rate: 18, depth: 0.5 } }),
    w(tone('sine', 120, undefined, 1.2, 0.02), { attack: 0.1, release: 0.2 }),
  ],
  /** 가위 싹둑 싹둑 */
  scissors: [0, 0.3].flatMap((at) => [noise('bandpass', 3500, 6000, 0.08, 0.05, at, 3), tone('triangle', 2800, 3800, 0.06, 0.012, at), noise('highpass', 4000, undefined, 0.015, 0.04, at + 0.08)]),
  /** 뜨개바늘 딸깍딸깍 + 털실 스침 */
  knit: [...[0, 0.25, 0.5, 0.75].flatMap((at, i) => [tone('sine', i % 2 ? 3600 : 3200, undefined, 0.04, 0.02, at), noise('highpass', 5000, undefined, 0.02, 0.03, at)]), w(noise('bandpass', 1500, undefined, 0.9, 0.012, 0, 1), { attack: 0.2 })],
  /** 옷 스침 (휙 - 슥) */
  clothes: [w(noise('bandpass', 1000, 2200, 0.35, 0.05, 0, 0.8), { attack: 0.08 }), w(noise('bandpass', 2200, 1200, 0.3, 0.04, 0.25, 0.8), { attack: 0.06 })],
  /** 토닥토닥 */
  pat: [0, 0.2, 0.45, 0.65].flatMap((at, i) => [noise('lowpass', 900, 300, 0.07, i % 2 ? 0.05 : 0.06, at), tone('sine', 180, 120, 0.06, 0.04, at)]),
  /** 짝짝짝 박수 (손마다 조금씩 다르게) */
  clap: (() => {
    const r = seeded(19);
    return [0, 0.16, 0.32, 0.48, 0.64, 0.8].flatMap((t) => {
      const at = t + rand(r, -0.02, 0.02) + 0.02;
      return [noise('bandpass', rand(r, 1100, 1700), undefined, 0.06, rand(r, 0.06, 0.08), at, 1.2), noise('highpass', 2500, undefined, 0.03, 0.03, at)];
    });
  })(),
  /** 포옥: 옷이 포근하게 감기는 소리 */
  hug: [w(noise('lowpass', 1500, 500, 0.35, 0.06), { attack: 0.08 }), w(tone('sine', 220, 170, 0.25, 0.02), { attack: 0.06 }), w(noise('bandpass', 900, undefined, 0.3, 0.03, 0.15, 1), { attack: 0.08 })],

  // 사람
  /** 훌쩍 (코 들이마심 두 번 + 작은 흐느낌) */
  sob: [
    w(noise('bandpass', 1500, 3000, 0.18, 0.05, 0, 2), { attack: 0.06 }),
    w(noise('bandpass', 1700, 3200, 0.12, 0.04, 0.25, 2), { attack: 0.04 }),
    w(tone('sine', 520, 440, 0.3, 0.012, 0.5), { attack: 0.05, vib: { rate: 7, depth: 15 } }),
  ],
  /** 한숨 후우 */
  sigh: [
    w(noise('bandpass', 900, 500, 1, 0.05, 0, 0.8), { attack: 0.25, release: 0.6 }),
    w(noise('lowpass', 600, undefined, 0.9, 0.03), { attack: 0.3 }),
    w(tone('sine', 220, 180, 0.8, 0.008), { attack: 0.3 }),
  ],
  /** 아이 웃음 히히히 */
  laugh: [0, 0.11, 0.22, 0.33, 0.44].flatMap((at, i) => [w(tone('triangle', 900 - i * 30, 820 - i * 30, 0.08, 0.022, at), { vib: { rate: 20, depth: 20 } }), noise('bandpass', 2000, undefined, 0.06, 0.012, at, 1)]),
  /** 두근 · 두근 */
  heartbeat: [0, 0.85].flatMap((at) => [tone('sine', 65, 40, 0.14, 0.18, at), tone('sine', 60, 38, 0.12, 0.13, at + 0.22)]),

  // 바깥
  /** 지붕 빗소리: 잔잔한 쏴아 + 톡톡 떨어지는 빗방울 */
  rainRoof: [
    w(noise('bandpass', 2400, undefined, 2.6, 0.03, 0, 0.5), { attack: 0.4, release: 0.8 }),
    w(noise('highpass', 5000, undefined, 2.6, 0.012), { attack: 0.4, release: 0.8 }),
    w(noise('lowpass', 600, undefined, 2.6, 0.02), { attack: 0.4, release: 0.8 }),
    ...(() => {
      const r = seeded(20);
      return Array.from({ length: 22 }, (_, i): Layer => {
        const f = rand(r, 1500, 3500);
        return tone('sine', f, f * 0.7, 0.03, rand(r, 0.008, 0.015), 0.1 + (2.2 * (i + r())) / 22);
      });
    })(),
    ...grains(21, 10, { from: 0.15, span: 2.2, lo: 2500, hi: 4000, gain: [0.015, 0.02], dur: [0.01, 0.02], q: [3, 5] }),
  ],
  /** 바람 쏴아 (거르개가 천천히 일렁인다) */
  wind: [
    w(noise('bandpass', 400, 900, 2.4, 0.05, 0, 1.5), { attack: 0.8, release: 1, vib: { rate: 0.6, depth: 200 } }),
    w(noise('bandpass', 1200, 700, 2.4, 0.02, 0, 3), { attack: 1, release: 1, vib: { rate: 0.9, depth: 300 } }),
  ],
  /** 귀뚜라미 귀뚤귀뚤: 높은 떨림이 짧게 반복, 멀리 한 마리 더 */
  crickets: [
    ...[0, 0.4, 0.8, 1.2, 1.6].map((at) => w(tone('sine', 4300, undefined, 0.14, 0.012, at), { trem: { rate: 45, depth: 1 } })),
    ...[0.2, 0.75, 1.3].map((at) => w(tone('sine', 4700, undefined, 0.12, 0.007, at), { trem: { rate: 52, depth: 1 } })),
  ],
  /** 새소리 짹짹 · 삐리리 */
  birds: (() => {
    const r = seeded(22);
    const out: Layer[] = [];
    for (let i = 0; i < 6; i++) {
      const at = i * 0.2 + rand(r, 0, 0.06);
      const f = rand(r, 2800, 4200);
      out.push(i % 3 === 2 ? w(tone('sine', f, f * 1.1, 0.16, 0.015, at), { vib: { rate: 30, depth: 300 } }) : tone('sine', f, f * (i % 2 ? 0.75 : 1.35), 0.07, 0.02, at));
    }
    return out;
  })(),
  /** 매미 맴-맴-맴-맴 */
  cicada: [0, 0.5, 1, 1.5].flatMap((at) => [
    w(noise('bandpass', 4500, 4200, 0.4, 0.04, at, 4), { attack: 0.08, release: 0.25, trem: { rate: 45, depth: 0.7 } }),
    w(tone('sawtooth', 4200, 3800, 0.4, 0.006, at), { attack: 0.08, release: 0.25, trem: { rate: 45, depth: 0.7 } }),
  ]),
  /** 차 지나감: 다가오며 커지고 지나가며 낮아진다 (도플러) */
  carPass: [
    w(noise('lowpass', 500, 1400, 0.9, 0.06), { attack: 0.8 }),
    noise('lowpass', 1400, 350, 1.3, 0.06, 0.85),
    w(tone('sawtooth', 110, 130, 0.9, 0.012), { attack: 0.8 }),
    tone('sawtooth', 120, 85, 1.3, 0.012, 0.85),
    w(noise('bandpass', 2000, 1500, 1.8, 0.015, 0.3, 0.7), { attack: 0.6 }),
  ],
  /** 자전거 따릉따릉 */
  bike: [0, 0.4].flatMap((at) => [
    w(tone('sine', 2350, undefined, 0.35, 0.03, at), { trem: { rate: 30, depth: 0.8 } }),
    w(tone('sine', 5900, undefined, 0.18, 0.008, at), { trem: { rate: 30, depth: 0.8 } }),
    noise('highpass', 5000, undefined, 0.01, 0.03, at),
  ]),
  /** 그네 삐걱 (갔다 왔다) + 휙 */
  swing: [...creak(380, 300, 0.35, 0.01), w(noise('bandpass', 600, 1200, 0.5, 0.025, 0.3, 1), { attack: 0.2 }), ...creak(300, 380, 0.35, 0.01, 0.9)],
  /** 철 대문 끼이익 → 철컹 */
  gate: [
    ...creak(260, 420, 0.9, 0.012),
    w(tone('sine', 900, undefined, 0.6, 0.012), { attack: 0.3 }),
    ...ring(420, 0.9, 0.03, 0.6, [[1, 1], [2.69, 0.4], [4.1, 0.2]]),
    noise('bandpass', 2500, undefined, 0.05, 0.05, 0.9, 2),
  ],
  /** 버스: 엔진이 잦아들고 에어 브레이크 치익 */
  bus: [
    w(tone('sawtooth', 120, 70, 1.1, 0.015), { release: 0.4, trem: { rate: 12, depth: 0.3 } }),
    w(noise('lowpass', 300, undefined, 1.1, 0.04), { release: 0.4 }),
    w(noise('bandpass', 3000, 2000, 0.6, 0.07, 0.5, 0.8), { release: 0.4 }),
  ],
  /** 학교 종 딩동댕동 */
  bell: bells([659, 523, 587, 392], 0.4, 0.05, 1),
  /** 먼 개 짖음 멍 멍 */
  dog: [0, 0.3].flatMap((at) => [noise('bandpass', 600, 400, 0.12, 0.04, at, 2), tone('triangle', 380, 280, 0.12, 0.015, at)]),
  /** 물 첨벙 */
  splash: [
    tone('sine', 200, 80, 0.1, 0.05),
    noise('bandpass', 1500, 600, 0.45, 0.08, 0, 0.7),
    noise('lowpass', 800, 200, 0.3, 0.07),
    ...(() => {
      const r = seeded(23);
      return Array.from({ length: 5 }, (): Layer => {
        const f = rand(r, 1200, 2200);
        return tone('sine', f, f * 1.4, 0.04, 0.01, rand(r, 0.2, 0.6));
      });
    })(),
  ],
  /** 우산 펼침: 딸깍 → 휙 → 팡 */
  umbrellaOpen: [noise('highpass', 3000, undefined, 0.02, 0.04), noise('bandpass', 400, 1500, 0.25, 0.06, 0.05, 1), tone('sine', 180, 110, 0.12, 0.05, 0.25), noise('bandpass', 2000, undefined, 0.05, 0.05, 0.27, 2)],
  /** 모래 발소리 사각 · 사각 · 사각 */
  sandStep: [0, 0.4, 0.8].flatMap((at) => [w(noise('bandpass', 2500, 1500, 0.12, 0.04, at, 0.8), { attack: 0.03 }), noise('lowpass', 600, undefined, 0.08, 0.03, at)]),

  // 기타
  /** 사진기 찰칵 */
  camera: [noise('highpass', 3000, undefined, 0.02, 0.05), tone('square', 900, 600, 0.03, 0.01), noise('bandpass', 1500, undefined, 0.04, 0.05, 0.04, 2), noise('highpass', 3000, undefined, 0.02, 0.04, 0.09)],
  /** 성냥 치익 → 화르륵 */
  candle: [noise('bandpass', 3000, 1500, 0.18, 0.07, 0, 1), w(noise('lowpass', 800, 2000, 0.4, 0.05, 0.12), { attack: 0.04 }), w(noise('highpass', 4000, undefined, 0.3, 0.015, 0.15), { trem: { rate: 30, depth: 0.8 } })],
  /** 거품 보글보글: 작은 방울이 톡톡 올라온다 */
  bubbles: (() => {
    const r = seeded(24);
    return Array.from({ length: 10 }, (_, i): Layer => {
      const f = rand(r, 400, 1000);
      return tone('sine', f, f * 1.8, rand(r, 0.04, 0.07), rand(r, 0.02, 0.03), (1.2 * (i + r() * 0.7)) / 10);
    });
  })(),
  /** 휴대폰 진동 부웅 · 부웅 (책상 위에서 드르르) */
  phoneVibe: [0, 0.6].flatMap((at) => [
    w(tone('sawtooth', 160, undefined, 0.4, 0.02, at), { attack: 0.02, release: 0.05 }),
    w(noise('lowpass', 250, undefined, 0.4, 0.05, at), { attack: 0.02, release: 0.05, trem: { rate: 18, depth: 0.4 } }),
  ]),
  /** 오르골 몇 음 */
  music: [1047, 1319, 1568, 1319, 1175, 1047].flatMap((hz, i) => [tone('sine', hz, undefined, 0.7, 0.04, i * 0.22), tone('sine', hz * 4.007, undefined, 0.2, 0.008, i * 0.22)]),
};

// ───────── 발소리 ─────────

export const FLOORS = ['wood', 'tile', 'grass', 'asphalt', 'paving', 'sand', 'dirt', 'toy'] as const;
export type Floor = (typeof FLOORS)[number];

/** 사람 크기 발소리 (바닥마다) */
const STEP: Record<Floor, SoundSpec> = {
  /** 나무 마루: 낮은 통 + 마루 울림 */
  wood: [tone('sine', 120, 80, 0.07, 0.03), noise('bandpass', 700, 500, 0.05, 0.012, 0, 1.5)],
  /** 타일: 짧고 단단한 탁 */
  tile: [tone('sine', 140, 90, 0.04, 0.02), noise('bandpass', 2400, 1800, 0.025, 0.018, 0, 2)],
  /** 풀밭: 사락 */
  grass: [noise('bandpass', 1800, 1200, 0.09, 0.02, 0, 0.7), noise('highpass', 4000, undefined, 0.06, 0.008), noise('lowpass', 300, undefined, 0.05, 0.012)],
  /** 아스팔트: 또각 */
  asphalt: [tone('triangle', 500, 300, 0.025, 0.012), noise('bandpass', 3000, 2400, 0.02, 0.022, 0, 3), noise('lowpass', 600, undefined, 0.05, 0.012)],
  /** 보도블록: 탁 + 자갈 서걱 */
  paving: [noise('bandpass', 1800, 1400, 0.03, 0.018, 0, 2), tone('sine', 180, 110, 0.05, 0.018), noise('highpass', 3500, undefined, 0.04, 0.006)],
  /** 모래: 사각 (잡음만) */
  sand: [w(noise('bandpass', 2800, 1800, 0.12, 0.022, 0, 0.6), { attack: 0.03 }), noise('lowpass', 700, undefined, 0.08, 0.015), noise('highpass', 5000, undefined, 0.1, 0.006)],
  /** 흙길: 퍽 */
  dirt: [noise('lowpass', 500, 200, 0.07, 0.025), noise('bandpass', 1200, undefined, 0.06, 0.01, 0, 1), tone('sine', 90, 60, 0.05, 0.008)],
  /** 장난감 방 바닥: 가벼운 톡 */
  toy: [tone('sine', 300, 220, 0.04, 0.02), noise('bandpass', 1600, 1300, 0.025, 0.012, 0, 2)],
};

/** 한 걸음: 장난감은 높고 작고 짧게, jitter(0~1)로 걸음마다 높이를 조금 흔든다 */
export function stepSpec(floor: Floor, size: 'toy' | 'human', jitter: number): SoundSpec {
  const j = 1 + (jitter - 0.5) * 0.1;
  const k = size === 'toy' ? { f: 2, g: 0.55, d: 0.7 } : { f: 1, g: 1, d: 1 };
  return STEP[floor].map((l) => ({ ...l, freq: l.freq * j * k.f, to: l.to && l.to * j * k.f, gain: l.gain * k.g, dur: l.dur * k.d, attack: l.attack && l.attack * k.d }));
}

/** 소리 전체 길이 (가장 늦게 끝나는 겹) */
export function specLength(s: SoundSpec): number {
  return s.reduce((m, l) => Math.max(m, (l.delay ?? 0) + l.dur), 0);
}

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
  /** 놀이: 틀림 (낮게 두 번) · 잡았다 (톡 + 높게) · 태엽 나눠 주기 (끼릭 셋 + 반짝) · 굴러감 (데굴데굴) */
  wrong: [tone('triangle', 330, 300, 0.12, 0.04), tone('triangle', 247, 220, 0.18, 0.04, 0.14)],
  catch: [tone('sine', 520, 880, 0.08, 0.05), tone('triangle', 1175, undefined, 0.12, 0.03, 0.07)],
  windup: [tone('square', 2400, 1800, 0.025, 0.02), tone('square', 2400, 1800, 0.025, 0.02, 0.16), tone('square', 2400, 1800, 0.025, 0.02, 0.32), tone('sine', 1568, 2093, 0.3, 0.035, 0.45)],
  roll: [noise('lowpass', 700, 300, 0.5, 0.05, 0, 1), tone('sine', 120, 90, 0.08, 0.04, 0.05), tone('sine', 120, 90, 0.08, 0.04, 0.2), tone('sine', 120, 90, 0.08, 0.035, 0.35)],
  /** 물건을 들어 올림: 옷깃 스침 + 가벼운 숨 */
  lift: [noise('bandpass', 900, 1600, 0.18, 0.05, 0, 1.2), tone('sine', 180, 240, 0.12, 0.04)],
  /** 물건을 내려놓음: 둔탁한 톡 */
  put: [tone('sine', 140, 70, 0.14, 0.09), noise('lowpass', 700, 200, 0.1, 0.05)],
  drip: [tone('sine', 1400, 700, 0.08, 0.04), tone('sine', 1200, 600, 0.08, 0.03, 0.35)],
  ...MORE,
};

/** 말소리: 말하는 이마다 다른 높이 · 음색의 짧은 톡 (지문은 낮고 작게) */
const VOICE: Record<string, [OscillatorType, number, number]> = {
  '': ['sine', 330, 0.012],
  toby: ['triangle', 700, 0.02],
  bori: ['sine', 420, 0.026],
  ruru: ['square', 900, 0.008],
  nabi: ['triangle', 1050, 0.016],
  doll: ['sine', 620, 0.02],
  haru: ['triangle', 820, 0.018],
  gm: ['sine', 560, 0.022],
  suni: ['triangle', 760, 0.018],
  mom: ['sine', 640, 0.02],
  eunju: ['triangle', 860, 0.018],
  dad: ['sine', 330, 0.026],
  gpa: ['sine', 300, 0.024],
  gmom: ['sine', 500, 0.02],
  jiwoo: ['triangle', 880, 0.016],
};

/** 말소리 한 번: 같은 사람이라도 높이를 조금씩 흔들어 말하는 느낌을 낸다 */
export function voiceSpec(who: string, jitter: number): SoundSpec {
  const [wave, hz, gain] = VOICE[who] ?? VOICE[''];
  const f = hz * (1 + (jitter - 0.5) * 0.12);
  return [tone(wave, f, f * 0.94, 0.045, gain)];
}
