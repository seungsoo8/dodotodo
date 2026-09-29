/**
 * 배경음악: 소리 파일 없이 코드로 연주하는 칩튠.
 * 곡마다 두 마디(16분음표 32칸)를 되풀이하고, 세기(0·1·2)에 따라 겹을 늘린다.
 *   0: 베이스 · 반주(아르페지오)   1: + 북   2: + 가락
 */

export type TrackId = 'title' | 'day' | 'night' | 'boss';
export type Inst = 'bass' | 'arp' | 'lead' | 'kick' | 'snare' | 'hat';

export interface Note {
  inst: Inst;
  /** 음 높이 (MIDI 번호). 북은 없음 */
  midi?: number;
}

/** 한 바퀴 칸 수 (16분음표 32개 = 4/4 두 마디) */
export const STEPS = 32;

interface Track {
  bpm: number;
  /** 음계 (가락·화음이 여기서만 나온다) */
  scale: number[];
  /** 8칸(반 마디)마다 바뀌는 화음 4개 */
  chords: number[][];
  /** 가락: 칸 → 음 */
  lead: Record<number, number>;
  /** 북: 16칸 문자열 (k 큰북 · s 작은북 · h 하이햇 · - 쉼) 두 번 되풀이 */
  drums: string;
  /** 베이스를 치는 칸 (반 마디 8칸 안에서) */
  bassHits: number[];
}

export const TRACKS: Record<TrackId, Track> = {
  // 시작 화면: 도 장조 5음계, 느긋하게
  title: {
    bpm: 84,
    scale: [60, 62, 64, 67, 69],
    chords: [
      [60, 64, 67],
      [57, 60, 64],
      [55, 62, 69],
      [60, 64, 67],
    ],
    lead: { 0: 76, 3: 74, 6: 72, 8: 69, 12: 72, 16: 74, 19: 76, 22: 79, 24: 76, 28: 74 },
    drums: '----------------',
    bassHits: [0, 4],
  },
  // 낮 전투: 가 단조, 경쾌하게
  day: {
    bpm: 112,
    scale: [57, 59, 60, 62, 64, 65, 67],
    chords: [
      [57, 60, 64],
      [53, 57, 60],
      [48, 52, 55],
      [55, 59, 62],
    ],
    lead: { 0: 76, 2: 72, 4: 74, 6: 76, 8: 77, 10: 76, 12: 72, 16: 71, 18: 72, 20: 74, 22: 76, 24: 79, 26: 76, 28: 74 },
    drums: 'k-h-s-h-k-k-s-h-',
    bassHits: [0, 3, 6],
  },
  // 밤: 라 단조, 더 빠르고 어둡게
  night: {
    bpm: 124,
    scale: [62, 64, 65, 67, 69, 70, 72],
    chords: [
      [50, 53, 57],
      [46, 50, 53],
      [48, 52, 55],
      [45, 48, 52],
    ],
    lead: { 0: 74, 1: 72, 2: 69, 4: 74, 6: 77, 8: 76, 10: 74, 12: 72, 14: 69, 16: 70, 18: 72, 20: 74, 22: 77, 24: 76, 26: 72, 28: 69, 30: 67 },
    drums: 'k-hhs-h-k-hks-hh',
    bassHits: [0, 2, 4, 6],
  },
  // 보스: 미 화성 단조, 가장 빠르고 무겁게
  boss: {
    bpm: 140,
    scale: [64, 66, 67, 69, 71, 72, 75],
    chords: [
      [52, 55, 59],
      [48, 52, 55],
      [45, 48, 52],
      [47, 51, 54],
    ],
    lead: { 0: 76, 2: 75, 4: 76, 6: 79, 8: 76, 10: 72, 12: 71, 14: 69, 16: 71, 17: 72, 18: 75, 20: 76, 22: 79, 24: 83, 26: 79, 28: 75, 30: 71 },
    drums: 'khhhskhkkhhhskhs',
    bassHits: [0, 1, 3, 4, 6],
  },
};

/** 곡의 한 칸에서 울릴 음들 */
export function stepNotes(id: TrackId, step: number, level: number): Note[] {
  const t = TRACKS[id];
  const s = ((step % STEPS) + STEPS) % STEPS;
  const chord = t.chords[Math.floor(s / 8)];
  const out: Note[] = [];
  if (t.bassHits.includes(s % 8)) out.push({ inst: 'bass', midi: chord[0] - 12 });
  if (s % 2 === 0) out.push({ inst: 'arp', midi: chord[(s / 2) % chord.length] + 12 });
  if (level >= 1) {
    const d = t.drums[s % 16];
    if (d === 'k') out.push({ inst: 'kick' });
    if (d === 's') out.push({ inst: 'snare' });
    if (d === 'h') out.push({ inst: 'hat' });
  }
  if (level >= 2 && t.lead[s] !== undefined) out.push({ inst: 'lead', midi: t.lead[s] });
  return out;
}

export interface MoodInput {
  started: boolean;
  lesson: boolean;
  status: 'playing' | 'won' | 'lost';
  bossAlive: boolean;
  /** 밤 정도 (0 낮 ~ 1 밤) */
  night: number;
  /** 살아 있는 적 수 */
  enemies: number;
}

/** 지금 틀 곡과 세기. 판이 끝났으면 곡 없음 */
export function musicMood(m: MoodInput): { track: TrackId | null; level: 0 | 1 | 2 } {
  if (!m.started || m.lesson) return { track: 'title', level: 2 };
  if (m.status !== 'playing') return { track: null, level: 0 };
  if (m.bossAlive) return { track: 'boss', level: 2 };
  const level = m.enemies >= 12 ? 2 : m.enemies >= 4 ? 1 : 0;
  return { track: m.night > 0.5 ? 'night' : 'day', level };
}
