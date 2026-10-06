/**
 * 악보 적기: 사람이 읽고 고칠 수 있는 글자로 가락 · 화음을 적는다 (화면 · 소리와 무관한 계산).
 *   가락  'E5:4 G5:4 A5:6 G5:2 | D5:12 r:4'  마디는 |, 음이름+옥타브:길이(16분음표 칸), r 쉼, - 앞 음 늘이기.
 *         길이를 안 적으면 앞 낱말의 길이. 마디 칸 합은 bars 로 돌려주고, 맞는지는 부르는 쪽(시험)이 본다.
 *   화음  'C Am F/A G7 % Dm7 Bbmaj7 Asus4'  한 마디에 하나, % 는 앞 화음 되풀이.
 */

const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** 'C4' → 60, 'F#5' → 78, 'Bb4' → 70 */
export function noteMidi(name: string): number {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(name);
  if (!m) throw new Error(`음이름이 이상해요: ${name}`);
  return 12 * (Number(m[3]) + 1) + PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}

export type TuneNote = [step: number, midi: number, len: number];

export interface Tune {
  notes: TuneNote[];
  /** 마디마다 적힌 칸 합 */
  bars: number[];
}

export function parseTune(src: string, barLen: number): Tune {
  const notes: TuneNote[] = [];
  const bars: number[] = [];
  let at = 0;
  let len = 4;
  let last: TuneNote | null = null;
  for (const bar of src.split('|')) {
    const start = bars.length * barLen;
    at = start;
    for (const tok of bar.trim().split(/\s+/).filter(Boolean)) {
      const m = /^([^:]+)(?::(\d+))?$/.exec(tok);
      if (!m) throw new Error(`가락 낱말이 이상해요: ${tok}`);
      if (m[2] !== undefined) len = Number(m[2]);
      if (!(len > 0)) throw new Error(`길이는 1칸 이상: ${tok}`);
      if (m[1] === 'r') last = null;
      else if (m[1] === '-') {
        if (!last) throw new Error(`- 앞에 늘일 음이 없어요: ${tok}`);
        last[2] += len;
      } else {
        last = [at, noteMidi(m[1]), len];
        notes.push(last);
      }
      at += len;
    }
    bars.push(at - start);
  }
  return { notes, bars };
}

const QUALITY: Record<string, number[]> = {
  '': [0, 4, 7],
  m: [0, 3, 7],
  '7': [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  sus4: [0, 5, 7],
  sus2: [0, 2, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  add9: [0, 4, 7, 14],
  m6: [0, 3, 7, 9],
  '6': [0, 4, 7, 9],
};

/** 근음을 D2(38) ~ C#3(49) 사이에 */
const rootMidi = (pc: number) => {
  const m = 36 + (((pc % 12) + 12) % 12);
  return m < 38 ? m + 12 : m;
};

const pcOf = (s: string): number => {
  const m = /^([A-G])(#|b)?$/.exec(s);
  if (!m) throw new Error(`화음 이름이 이상해요: ${s}`);
  return PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
};

export interface Harmony {
  /** 마디마다 화음 음 (근음부터) */
  chords: number[][];
  /** 마디마다 베이스 음 (근음과 같은 높이대: 연주할 때 한 옥타브 내린다) */
  bass: number[];
}

export function parseChords(src: string): Harmony {
  const chords: number[][] = [];
  const bass: number[] = [];
  for (const tok of src.trim().split(/\s+/)) {
    if (tok === '%') {
      if (!chords.length) throw new Error('% 앞에 화음이 없어요');
      chords.push([...chords[chords.length - 1]]);
      bass.push(bass[bass.length - 1]);
      continue;
    }
    const m = /^([A-G](?:#|b)?)([a-z0-9]*)(?:\/([A-G](?:#|b)?))?$/.exec(tok);
    if (!m || !(m[2] in QUALITY)) throw new Error(`화음 이름이 이상해요: ${tok}`);
    const r = rootMidi(pcOf(m[1]));
    chords.push(QUALITY[m[2]].map((i) => r + i));
    bass.push(m[3] ? rootMidi(pcOf(m[3])) : r);
  }
  return { chords, bass };
}
