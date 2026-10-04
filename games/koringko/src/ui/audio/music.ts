/**
 * 배경음악: 코드로 연주하는 칩튠. 곡마다 두 마디(16분음표 32칸)를 되풀이하고,
 * 세기(0·1·2)에 따라 겹을 늘린다.  0: 베이스 · 반주   1: + 북   2: + 가락
 */
export type TrackId = 'title' | 'village' | 'forest' | 'candy' | 'cave' | 'factory' | 'rift' | 'boss';
export type Inst = 'bass' | 'arp' | 'lead' | 'kick' | 'snare' | 'hat';

export interface Note {
  inst: Inst;
  midi?: number;
}

export const STEPS = 32;

interface Track {
  bpm: number;
  chords: number[][];
  lead: Record<number, number>;
  drums: string;
  bassHits: number[];
}

export const TRACKS: Record<TrackId, Track> = {
  // 타이틀: 오르골처럼
  title: {
    bpm: 80,
    chords: [
      [60, 64, 67],
      [57, 60, 64],
      [53, 57, 60],
      [55, 59, 62],
    ],
    lead: { 0: 79, 4: 76, 6: 77, 8: 76, 12: 72, 16: 74, 20: 77, 22: 76, 24: 74, 28: 71 },
    drums: '----------------',
    bassHits: [0],
  },
  // 마을: 느긋한 장조
  village: {
    bpm: 96,
    chords: [
      [65, 69, 72],
      [62, 65, 69],
      [58, 62, 65],
      [60, 64, 67],
    ],
    lead: { 0: 77, 3: 76, 4: 74, 6: 72, 8: 74, 12: 69, 16: 70, 18: 72, 20: 74, 24: 76, 26: 77, 28: 79 },
    drums: 'k---h---s---h---',
    bassHits: [0, 4],
  },
  // 숲: 경쾌하게
  forest: {
    bpm: 120,
    chords: [
      [67, 71, 74],
      [64, 67, 71],
      [60, 64, 67],
      [62, 66, 69],
    ],
    lead: { 0: 79, 2: 81, 4: 83, 6: 79, 8: 76, 10: 79, 12: 81, 16: 84, 18: 83, 20: 81, 22: 79, 24: 78, 26: 79, 28: 81 },
    drums: 'k-h-s-h-k-h-s-hh',
    bassHits: [0, 3, 4, 6],
  },
  // 과자 언덕: 통통 튀게
  candy: {
    bpm: 132,
    chords: [
      [72, 76, 79],
      [69, 72, 76],
      [65, 69, 72],
      [67, 71, 74],
    ],
    lead: { 0: 84, 1: 86, 2: 88, 4: 84, 6: 79, 8: 81, 10: 84, 12: 86, 16: 88, 18: 86, 20: 84, 22: 81, 24: 83, 26: 86, 28: 91 },
    drums: 'kh-hsh-hkh-hshhh',
    bassHits: [0, 2, 4, 6],
  },
  // 동굴: 단조, 낮게
  cave: {
    bpm: 100,
    chords: [
      [57, 60, 64],
      [55, 58, 62],
      [53, 57, 60],
      [52, 56, 59],
    ],
    lead: { 0: 69, 4: 72, 6: 71, 8: 69, 12: 64, 16: 65, 20: 67, 22: 65, 24: 64, 28: 68 },
    drums: 'k-----h-k-s---h-',
    bassHits: [0, 3],
  },
  // 공장: 기계처럼 딱딱 맞게
  factory: {
    bpm: 126,
    chords: [
      [52, 55, 59],
      [52, 55, 59],
      [48, 52, 55],
      [50, 54, 57],
    ],
    lead: { 0: 71, 2: 71, 4: 74, 6: 71, 8: 76, 12: 74, 14: 71, 16: 69, 18: 69, 20: 72, 22: 69, 24: 74, 28: 71 },
    drums: 'k-hhs-hhk-hhs-hk',
    bassHits: [0, 2, 4, 6],
  },
  // 균열: 신비롭고 불안하게
  rift: {
    bpm: 112,
    chords: [
      [62, 65, 69],
      [63, 67, 70],
      [58, 62, 65],
      [61, 64, 68],
    ],
    lead: { 0: 74, 2: 77, 4: 81, 8: 80, 10: 77, 12: 75, 16: 74, 18: 70, 20: 73, 24: 76, 26: 80, 28: 81 },
    drums: 'k-h-s-hkk-h-s-hh',
    bassHits: [0, 2, 3, 6],
  },
  // 보스: 빠르고 거칠게
  boss: {
    bpm: 150,
    chords: [
      [57, 60, 64],
      [57, 60, 64],
      [53, 57, 60],
      [56, 59, 64],
    ],
    lead: { 0: 76, 2: 75, 4: 76, 6: 79, 8: 76, 10: 72, 12: 71, 14: 69, 16: 71, 17: 72, 18: 75, 20: 76, 22: 79, 24: 83, 26: 79, 28: 75, 30: 71 },
    drums: 'khhhskhkkhhhskhs',
    bassHits: [0, 1, 3, 4, 6],
  },
};

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
  playing: boolean;
  theme: 'village' | 'forest' | 'candy' | 'cave' | 'factory' | 'rift';
  boss: boolean;
  /** 주인공 가까이의 적 수 */
  nearEnemies: number;
}

export function musicMood(m: MoodInput): { track: TrackId; level: 0 | 1 | 2 } {
  if (!m.playing) return { track: 'title', level: 2 };
  if (m.boss) return { track: 'boss', level: 2 };
  if (m.theme === 'village') return { track: 'village', level: 2 };
  return { track: m.theme, level: m.nearEnemies >= 5 ? 2 : m.nearEnemies >= 1 ? 1 : 0 };
}
