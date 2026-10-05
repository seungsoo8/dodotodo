/**
 * 이야기 음악: 「하루의 테마」 하나를 장면마다 편곡한다 (투더문처럼 같은 가락이 되풀이되며 감정을 쌓는다).
 *   box     오르골 (4살 · 타이틀)        piano  피아노 독주 (10살)
 *   waltz   통통 튀는 피아노 (7살 생일)   minor  느린 단조 (13살 · 장례식 날)
 *   rain    빗소리 피아노 (12살 · 5살)    finale 합주 (엔딩)
 * 그 밖에 지금(밤) 탐험 · 어둠 · 장난 · 발소리 긴장 곡.
 * 화면과 무관한 계산만 (어느 칸에 어떤 음이 나오는가).
 */
export const BAR = 16;

export type SInst = 'piano' | 'box' | 'pad' | 'bass' | 'heart';

export interface SNote {
  inst: SInst;
  midi: number;
  /** 길이 (16분음표 칸) */
  len: number;
  /** 가락 · 메아리 · 반주 · 바탕 */
  part: 'lead' | 'counter' | 'comp' | 'base';
}

/** 너무 낮은 음은 한 옥타브 올린다 */
const low = (m: number) => (m < 33 ? m + 12 : m);

/** [칸, 음, 길이]: 여덟 마디 주제 가락 (다장조) */
export const THEME: [number, number, number][] = [
  [0, 76, 4], [4, 79, 4], [8, 81, 6], [14, 79, 2],
  [16, 76, 4], [20, 74, 4], [24, 72, 8],
  [32, 74, 4], [36, 76, 4], [40, 79, 4], [44, 76, 4],
  [48, 74, 12],
  [64, 76, 4], [68, 79, 4], [72, 81, 6], [78, 84, 2],
  [80, 83, 4], [84, 81, 4], [88, 79, 8],
  [96, 81, 4], [100, 79, 4], [104, 76, 4], [108, 74, 4],
  [112, 72, 12],
];

const C = [48, 52, 55];
const Am = [45, 48, 52];
const F = [41, 45, 48];
const G = [43, 47, 50];
const Em = [40, 43, 47];
const Dm = [38, 41, 45];
const E = [40, 44, 47];
const D = [38, 42, 45];
const A = [45, 49, 52];
const Bb = [46, 50, 53];
const Gm = [43, 46, 50];
const B = [47, 51, 54];

const MAJOR = [C, Am, F, G, C, Em, Dm, C];
const MINOR = [Am, F, Dm, E, Am, Em, Dm, Am];

type Comp = 'arp8' | 'bell' | 'bounce' | 'pad' | 'none';

interface Song {
  bpm: number;
  chords: number[][];
  /** 주제 가락을 쓰는가 */
  theme: boolean;
  /** 가락 악기 (none: 가락 없음) */
  lead: SInst | 'none';
  /** 가락 옥타브 옮김 */
  oct: number;
  minor?: boolean;
  comp: Comp;
  bass: 'root' | 'none';
  pad?: boolean;
  /** 오르골 메아리 (엔딩) */
  counter?: boolean;
  heart?: boolean;
  /** 주제가 아닌 곡의 가락 */
  melody?: [number, number, number][];
  /** 고리 끝의 쉼 마디 수 (바깥 소리만 남는다) */
  rest?: number;
  /** 홀수 고리에는 앞 절반(A)의 가락을 빼고 화음만 */
  vary?: boolean;
  /** 다른 곡에 갔다 돌아오면 떠난 마디부터 이어서 (탐험 곡) */
  resume?: boolean;
}

export const SONGS = {
  title: { bpm: 78, chords: MAJOR, theme: true, lead: 'box', oct: 0, comp: 'bell', bass: 'none', pad: true },
  box: { bpm: 84, chords: MAJOR, theme: true, lead: 'box', oct: 0, comp: 'bell', bass: 'none' },
  piano: { bpm: 76, chords: MAJOR, theme: true, lead: 'piano', oct: -12, comp: 'arp8', bass: 'root' },
  waltz: { bpm: 108, chords: MAJOR, theme: true, lead: 'piano', oct: -12, comp: 'bounce', bass: 'none' },
  minor: { bpm: 58, chords: MINOR, theme: true, lead: 'piano', oct: -12, minor: true, comp: 'pad', bass: 'root' },
  rain: { bpm: 66, chords: MINOR, theme: true, lead: 'piano', oct: -12, minor: true, comp: 'arp8', bass: 'none', pad: true },
  finale: { bpm: 80, chords: MAJOR, theme: true, lead: 'piano', oct: -12, comp: 'arp8', bass: 'root', pad: true, counter: true },
  // 지금 (밤): 낮은 화음 위로 주제의 첫 소절만 오르골로 가끔
  // 지금 (밤) 탐험 곡 셋: A(8마디) · B(8마디) · 쉼(2마디). 장 묶음마다 하나씩 (exploreSong)
  // 1) 1~7장: 낮은 화음 위로 주제의 첫 소절을 오르골로 가끔, B 에서 조금 높이
  night: {
    bpm: 70, chords: [C, Am, F, G, C, Em, F, G, Am, Em, F, C, Dm, G, C, C], theme: false, lead: 'box', oct: 0, comp: 'pad', bass: 'none', rest: 2, vary: true, resume: true,
    melody: [[0, 76, 4], [4, 79, 4], [8, 81, 8], [40, 79, 4], [44, 76, 4], [48, 74, 12], [64, 72, 4], [68, 76, 4], [72, 79, 8], [80, 71, 8], [88, 74, 8], [96, 72, 4], [100, 69, 4], [104, 72, 8], [112, 71, 12],
      [128, 81, 8], [136, 79, 4], [140, 76, 4], [144, 76, 12], [160, 77, 4], [164, 76, 4], [168, 72, 8], [176, 76, 12], [192, 74, 4], [196, 77, 4], [200, 81, 8], [208, 79, 8], [216, 74, 8], [224, 72, 16]],
  },
  // 2) 8~14장: 마단조로 기운 쓸쓸한 피아노, 조금 느리게
  night2: {
    bpm: 64, chords: [Em, C, G, D, Em, Am, B, Em, C, G, Am, Em, C, D, Em, Em], theme: false, lead: 'piano', oct: 0, minor: true, comp: 'pad', bass: 'none', rest: 2, vary: true, resume: true,
    melody: [[0, 71, 8], [8, 67, 4], [12, 64, 4], [16, 64, 12], [28, 67, 4], [32, 71, 8], [40, 74, 8], [48, 69, 16], [64, 67, 4], [68, 71, 4], [72, 76, 8], [80, 72, 8], [88, 71, 4], [92, 69, 4], [96, 71, 8], [104, 66, 8], [112, 64, 16],
      [128, 76, 8], [136, 74, 4], [140, 72, 4], [144, 71, 16], [160, 72, 4], [164, 71, 4], [168, 69, 8], [176, 67, 12], [192, 64, 8], [200, 67, 8], [208, 66, 16], [224, 64, 16]],
  },
  // 3) 15장~: 새벽 기운. 오르골 가락에 피아노가 잔잔히 섞인다
  night3: {
    bpm: 74, chords: [G, D, Em, C, G, D, C, D, Em, C, G, D, C, D, G, G], theme: false, lead: 'box', oct: 0, comp: 'arp8', bass: 'none', pad: true, rest: 2, vary: true, resume: true,
    melody: [[0, 79, 4], [4, 83, 4], [8, 86, 8], [16, 81, 8], [24, 78, 8], [32, 79, 12], [44, 76, 4], [48, 76, 16], [64, 74, 4], [68, 79, 4], [72, 83, 8], [80, 81, 8], [88, 78, 4], [92, 76, 4], [96, 79, 8], [104, 76, 8], [112, 78, 16],
      [128, 83, 8], [136, 81, 4], [140, 79, 4], [144, 84, 12], [160, 83, 4], [164, 81, 4], [168, 79, 8], [176, 81, 16], [192, 79, 8], [200, 76, 8], [208, 78, 8], [216, 81, 8], [224, 79, 16]],
  },
  dark: { bpm: 62, chords: [Am, Dm, Em, Am], theme: false, lead: 'piano', oct: 0, comp: 'pad', bass: 'root', resume: true, melody: [[0, 64, 8], [16, 65, 8], [32, 64, 4], [36, 62, 4], [48, 57, 12]] },
  playful: {
    bpm: 116,
    chords: [C, F, G, C],
    theme: false,
    lead: 'box',
    oct: 0,
    comp: 'bounce',
    bass: 'none',
    melody: [[0, 72, 2], [2, 76, 2], [4, 79, 2], [6, 76, 2], [8, 77, 4], [12, 76, 4], [16, 81, 2], [18, 79, 2], [20, 77, 2], [22, 76, 2], [24, 74, 8], [32, 74, 2], [34, 77, 2], [36, 79, 2], [38, 81, 2], [40, 83, 4], [44, 79, 4], [48, 84, 8], [56, 79, 4]],
  },
  tension: { bpm: 96, chords: [Am, Am], theme: false, lead: 'none', oct: 0, comp: 'pad', bass: 'none', heart: true },
  // ── 감정 곡: 주제와 다른 저마다의 가락 ──
  // 메인 테마 「태엽이 멈추기 전에」: 단조로 시작해 마지막 마디에서 장화음으로 살짝 들린다
  main: {
    bpm: 68, chords: [Am, F, C, G, Am, F, G, E], theme: false, lead: 'piano', oct: 0, comp: 'arp8', bass: 'root', pad: true,
    melody: [[0, 69, 6], [6, 72, 2], [8, 76, 6], [14, 74, 2], [16, 72, 8], [24, 69, 4], [28, 72, 4], [32, 72, 4], [36, 76, 4], [40, 79, 6], [46, 77, 2], [48, 74, 12], [60, 71, 4], [64, 76, 6], [70, 77, 2], [72, 79, 6], [78, 77, 2], [80, 77, 4], [84, 76, 4], [88, 72, 8], [96, 74, 4], [100, 71, 4], [104, 74, 4], [108, 79, 4], [112, 76, 12], [124, 71, 4]],
  },
  // 할머니의 노래: 따뜻한 장조, 낮은 피아노
  grandma: {
    bpm: 84, chords: [F, C, Dm, G, F, C, G, C], theme: false, lead: 'piano', oct: -12, comp: 'arp8', bass: 'root',
    melody: [[0, 77, 4], [4, 76, 2], [6, 77, 2], [8, 81, 8], [16, 79, 4], [20, 76, 4], [24, 72, 8], [32, 74, 4], [36, 77, 4], [40, 81, 4], [44, 79, 4], [48, 79, 12], [60, 77, 4], [64, 77, 4], [68, 76, 2], [70, 77, 2], [72, 81, 6], [78, 84, 2], [80, 84, 4], [84, 83, 4], [88, 79, 8], [96, 79, 4], [100, 77, 4], [104, 76, 4], [108, 74, 4], [112, 72, 16]],
  },
  // 그리움: 마단조 쪽으로 기우는 느린 피아노
  longing: {
    bpm: 64, chords: [Em, C, G, D, Em, C, D, Em], theme: false, lead: 'piano', oct: 0, comp: 'arp8', bass: 'root', pad: true,
    melody: [[0, 71, 6], [6, 69, 2], [8, 67, 8], [16, 64, 4], [20, 67, 4], [24, 72, 8], [32, 71, 6], [38, 72, 2], [40, 74, 8], [48, 69, 12], [60, 66, 4], [64, 71, 4], [68, 74, 4], [72, 76, 8], [80, 76, 4], [84, 74, 4], [88, 72, 8], [96, 74, 6], [102, 72, 2], [104, 71, 4], [108, 69, 4], [112, 67, 6], [118, 66, 2], [120, 64, 8]],
  },
  // 슬픔: 아주 느린 라단조, 음 사이가 넓다
  sorrow: {
    bpm: 52, chords: [Dm, Bb, F, A, Dm, Bb, Gm, A], theme: false, lead: 'piano', oct: 0, minor: true, comp: 'pad', bass: 'root',
    melody: [[0, 69, 8], [8, 65, 8], [16, 70, 8], [24, 69, 4], [28, 65, 4], [32, 65, 12], [44, 67, 4], [48, 64, 16], [64, 69, 6], [70, 70, 2], [72, 72, 8], [80, 74, 8], [88, 72, 4], [92, 70, 4], [96, 70, 8], [104, 69, 8], [112, 69, 16]],
  },
  // 회상: 오르골 상자를 연 듯한 높은 방울 소리
  memory: {
    bpm: 72, chords: [C, Em, F, C, Am, Dm, G, C], theme: false, lead: 'box', oct: 0, comp: 'bell', bass: 'none', pad: true,
    melody: [[0, 84, 4], [4, 79, 4], [8, 76, 4], [12, 79, 4], [16, 83, 6], [22, 81, 2], [24, 79, 8], [32, 81, 4], [36, 77, 4], [40, 72, 4], [44, 77, 4], [48, 76, 12], [60, 79, 4], [64, 81, 4], [68, 84, 4], [72, 88, 6], [78, 86, 2], [80, 86, 4], [84, 84, 4], [88, 81, 8], [96, 83, 4], [100, 79, 4], [104, 74, 4], [108, 79, 4], [112, 84, 16]],
  },
  // 희망: 올라가는 가락, 에필로그
  hope: {
    bpm: 88, chords: [G, D, Em, C, G, D, C, G], theme: false, lead: 'piano', oct: 0, comp: 'arp8', bass: 'root', pad: true,
    melody: [[0, 71, 4], [4, 74, 4], [8, 79, 8], [16, 78, 4], [20, 76, 4], [24, 74, 8], [32, 76, 4], [36, 79, 4], [40, 83, 8], [48, 84, 8], [56, 83, 4], [60, 79, 4], [64, 79, 4], [68, 81, 4], [72, 83, 8], [80, 81, 6], [86, 78, 2], [88, 74, 8], [96, 76, 4], [100, 79, 4], [104, 84, 4], [108, 83, 4], [112, 79, 16]],
  },
} satisfies Record<string, Song>;

export type SongId = keyof typeof SONGS;

/** 한 고리의 칸 수 (쉼 마디 포함) */
export function songSteps(id: SongId): number {
  const s = SONGS[id] as Song;
  return (s.chords.length + (s.rest ?? 0)) * BAR;
}

/** 화음이 있는 (쉼이 아닌) 칸 수 */
export function playSteps(id: SongId): number {
  return (SONGS[id] as Song).chords.length * BAR;
}

/** 떠났다 돌아오면 이어서 트는 곡인가 */
export function resumes(id: SongId): boolean {
  return !!(SONGS[id] as Song).resume;
}

function melodyOf(s: Song): [number, number, number][] {
  return s.theme ? THEME : (s.melody ?? []);
}

/** step 칸의 음들. loop: 몇 번째 고리인가 (변주하는 곡은 홀수 고리에서 A 의 가락을 뺀다) */
export function songNotes(id: SongId, step: number, loop = 0): SNote[] {
  const s = SONGS[id] as Song;
  const total = songSteps(id);
  const i = ((step % total) + total) % total;
  const bar = Math.floor(i / BAR);
  if (bar >= s.chords.length) return [];
  const pos = i % BAR;
  const chord = s.chords[bar];
  const out: SNote[] = [];
  const quiet = !!s.vary && loop % 2 === 1 && bar < s.chords.length / 2;
  // 가락 (주제는 8마디: 짧은 곡에서는 앞부분만)
  if (s.lead !== 'none' && !quiet)
    for (const [at, m, len] of melodyOf(s)) if (at === i) out.push({ inst: s.lead, midi: m + s.oct, len, part: 'lead' });
  if (s.counter) {
    const j = (i - 2 + total) % total;
    for (const [at, m, len] of THEME) if (at === j) out.push({ inst: 'box', midi: m + 12, len: Math.min(4, len), part: 'counter' });
  }
  switch (s.comp) {
    case 'arp8':
      if (pos % 2 === 0) out.push({ inst: 'piano', midi: chord[[0, 1, 2, 1][(pos / 2) % 4]] + 12, len: 2, part: 'comp' });
      break;
    case 'bell':
      if (pos % 4 === 0) out.push({ inst: 'box', midi: chord[(pos / 4) % 3] + 24, len: 4, part: 'comp' });
      break;
    case 'bounce':
      if (pos === 0 || pos === 8) out.push({ inst: 'bass', midi: low(chord[pos === 0 ? 0 : 2] - 12), len: 3, part: 'base' });
      if (pos === 4 || pos === 12 || pos === 14) for (const n of chord) out.push({ inst: 'piano', midi: n + 12, len: 1, part: 'comp' });
      break;
    case 'pad':
      if (pos === 0) for (const n of chord) out.push({ inst: 'pad', midi: n + 12, len: BAR, part: 'base' });
      break;
    default:
      break;
  }
  if (s.pad && s.comp !== 'pad' && pos === 0) for (const n of chord) out.push({ inst: 'pad', midi: n + 12, len: BAR, part: 'base' });
  if (s.bass === 'root' && (pos === 0 || pos === 8)) out.push({ inst: 'bass', midi: low(chord[0] - 12), len: 8, part: 'base' });
  if (s.heart && (pos === 0 || pos === 3 || pos === 8 || pos === 11)) out.push({ inst: 'heart', midi: 36, len: 1, part: 'base' });
  return out;
}

const EXPLORE = ['night', 'night2', 'night3'] as const;

/** 장 묶음마다 탐험 곡: 앞 1/3 은 night, 가운데 night2, 마지막 night3 */
export function exploreSong(n: number, of: number): (typeof EXPLORE)[number] {
  if (!(n > 0) || !(of > 0)) return EXPLORE[0];
  const k = Math.ceil((Math.min(n, of) / of) * 3) - 1;
  return EXPLORE[Math.max(0, Math.min(2, k))];
}

/** 지금 틀 곡: 발소리가 들리면 긴장 곡. 대본의 night 는 장(chapter)을 주면 장 묶음 곡으로 */
export function songFor(track: string | null, steps: 'calm' | 'warn' | 'hold', chapter?: { n: number; of: number }): SongId | null {
  if (steps !== 'calm') return 'tension';
  if (!track || !(track in SONGS)) return null;
  if (track === 'night' && chapter) return exploreSong(chapter.n, chapter.of);
  return track as SongId;
}

/**
 * 사람 손 같은 연주: 세기 ±12% (마디 첫 박 +10%), 시각 ±6ms,
 * 가락만 길이 ±10% 이고 긴 음(8칸 이상)은 끝을 살짝 일찍 뗀다. r: 0~1 난수.
 */
export function humanize(n: SNote, pos: number, r: () => number): { gain: number; dt: number; len: number } {
  const gain = (1 + (r() * 2 - 1) * 0.12) * (pos % BAR === 0 ? 1.1 : 1);
  const dt = (r() * 2 - 1) * 0.006;
  let len = 1;
  if (n.part === 'lead') {
    len = 1 + (r() * 2 - 1) * 0.1;
    if (n.len >= 8) len *= 0.85;
  }
  return { gain, dt, len };
}

/** 음악 페이드 초 → setTargetAtTime 시간 상수 (없으면 0.25, 그 시간 안에 거의 다 바뀌게 1/3, 최대 4) */
export function fadeTau(fade: number | undefined): number {
  if (fade === undefined || !(fade > 0)) return 0.25;
  return Math.min(4, fade / 3);
}
