import { DIFFICULTIES, type DifficultyId } from '../core/config.ts';
import { emptyMeta, refundRetired, type MetaState } from '../core/meta.ts';

export interface DifficultyRecord {
  bestRound: number;
  plays: number;
  wins: number;
  /** 가장 빠른 승리 시간(초). 승리가 없으면 null */
  fastestWin: number | null;
}

export type Records = Record<DifficultyId, DifficultyRecord>;

export interface RunResult {
  difficulty: DifficultyId;
  won: boolean;
  round: number;
  time: number;
  kills: number;
}

/** localStorage 와 같은 모양 (테스트에서는 메모리 저장소를 넣는다) */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

const KEY = 'tower-guardian:records';

function emptyRecord(): DifficultyRecord {
  return { bestRound: 0, plays: 0, wins: 0, fastestWin: null };
}

export function emptyRecords(): Records {
  return { easy: emptyRecord(), normal: emptyRecord(), hard: emptyRecord() };
}

export function updateRecords(records: Records, result: RunResult): Records {
  const prev = records[result.difficulty];
  const next: DifficultyRecord = {
    bestRound: Math.max(prev.bestRound, result.round),
    plays: prev.plays + 1,
    wins: prev.wins + (result.won ? 1 : 0),
    fastestWin: result.won && (prev.fastestWin === null || result.time < prev.fastestWin) ? result.time : prev.fastestWin,
  };
  return { ...records, [result.difficulty]: next };
}

function isRecord(v: unknown): v is DifficultyRecord {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  const num = (x: unknown) => typeof x === 'number' && Number.isFinite(x);
  return num(r.bestRound) && num(r.plays) && num(r.wins) && (r.fastestWin === null || num(r.fastestWin));
}

export function loadRecords(storage: StorageLike): Records {
  const records = emptyRecords();
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return records;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    for (const { id } of DIFFICULTIES) {
      const r = parsed[id];
      if (isRecord(r)) records[id] = { bestRound: r.bestRound, plays: r.plays, wins: r.wins, fastestWin: r.fastestWin };
    }
  } catch {
    // 깨진 데이터나 막힌 저장소: 빈 기록으로 시작
  }
  return records;
}

export function saveRecords(storage: StorageLike, records: Records): void {
  try {
    storage.setItem(KEY, JSON.stringify(records));
  } catch {
    // 저장이 막혀 있으면 이번 판 기록만 화면에 남는다
  }
}

// ───────────── 무한 모드 기록 (클래식과 따로 저장) ─────────────

export interface EndlessRecord {
  bestRound: number;
  bestKills: number;
  plays: number;
}

export type EndlessRecords = Record<DifficultyId, EndlessRecord>;

export interface EndlessResult {
  difficulty: DifficultyId;
  round: number;
  kills: number;
}

const ENDLESS_KEY = 'tower-guardian:endless';

export function emptyEndless(): EndlessRecords {
  const r = (): EndlessRecord => ({ bestRound: 0, bestKills: 0, plays: 0 });
  return { easy: r(), normal: r(), hard: r() };
}

export function updateEndless(records: EndlessRecords, result: EndlessResult): EndlessRecords {
  const prev = records[result.difficulty];
  return {
    ...records,
    [result.difficulty]: {
      bestRound: Math.max(prev.bestRound, result.round),
      bestKills: Math.max(prev.bestKills, result.kills),
      plays: prev.plays + 1,
    },
  };
}

export function loadEndless(storage: StorageLike): EndlessRecords {
  const records = emptyEndless();
  try {
    const raw = storage.getItem(ENDLESS_KEY);
    if (!raw) return records;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const num = (x: unknown) => typeof x === 'number' && Number.isFinite(x);
    for (const { id } of DIFFICULTIES) {
      const r = parsed[id] as Record<string, unknown> | undefined;
      if (r && num(r.bestRound) && num(r.bestKills) && num(r.plays)) {
        records[id] = { bestRound: r.bestRound as number, bestKills: r.bestKills as number, plays: r.plays as number };
      }
    }
  } catch {
    // 깨진 데이터나 막힌 저장소: 빈 기록으로 시작
  }
  return records;
}

export function saveEndless(storage: StorageLike, records: EndlessRecords): void {
  try {
    storage.setItem(ENDLESS_KEY, JSON.stringify(records));
  } catch {
    // 저장이 막혀 있으면 이번 판 기록만 화면에 남는다
  }
}

// ───────────── 영구 진행 (별조각·강화·업적) ─────────────

const META_KEY = 'tower-guardian:meta';

export function loadMeta(storage: StorageLike): MetaState {
  const meta = emptyMeta();
  try {
    const raw = storage.getItem(META_KEY);
    if (!raw) return meta;
    const p = JSON.parse(raw) as Record<string, unknown>;
    const count = (x: unknown) => typeof x === 'number' && Number.isInteger(x) && x >= 0;
    const strings = (x: unknown) => (Array.isArray(x) ? x.filter((v): v is string => typeof v === 'string') : []);
    if (typeof p.shards === 'number' && Number.isFinite(p.shards) && p.shards > 0) meta.shards = Math.floor(p.shards);
    if (typeof p.levels === 'object' && p.levels !== null) {
      for (const [id, lv] of Object.entries(p.levels)) if (count(lv) && (lv as number) > 0) meta.levels[id] = lv as number;
    }
    meta.achievements = strings(p.achievements);
    meta.heroWins = strings(p.heroWins);
    meta.tutorialDone = p.tutorialDone === true;
    meta.lessonDone = p.lessonDone === true;
    meta.storySeen = strings(p.storySeen);
    if (count(p.runs)) meta.runs = p.runs as number;
  } catch {
    // 깨진 데이터나 막힌 저장소: 처음부터
  }
  return refundRetired(meta);
}

export function saveMeta(storage: StorageLike, meta: MetaState): void {
  try {
    storage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    // 저장이 막혀 있으면 이번 세션에만 남는다
  }
}

// ───────── 소리 설정 ─────────

export interface AudioSettings {
  /** 효과음 크기 0~1 */
  sfx: number;
  /** 배경음악 크기 0~1 */
  music: number;
  muted: boolean;
}

export const DEFAULT_AUDIO: AudioSettings = { sfx: 0.8, music: 0.45, muted: false };

const AUDIO_KEY = 'tower-guardian:audio';
/** 예전에 쓰던 "소리 끄기"만 저장하던 자리 */
const OLD_MUTE_KEY = 'tower-guardian:muted';

export function loadAudio(storage: StorageLike): AudioSettings {
  const out = { ...DEFAULT_AUDIO };
  try {
    const raw = storage.getItem(AUDIO_KEY);
    if (!raw) {
      out.muted = storage.getItem(OLD_MUTE_KEY) === '1';
      return out;
    }
    const p = JSON.parse(raw) as Record<string, unknown>;
    const level = (x: unknown, fallback: number) => (typeof x === 'number' && Number.isFinite(x) ? Math.max(0, Math.min(1, x)) : fallback);
    out.sfx = level(p.sfx, DEFAULT_AUDIO.sfx);
    out.music = level(p.music, DEFAULT_AUDIO.music);
    out.muted = p.muted === true;
  } catch {
    return { ...DEFAULT_AUDIO };
  }
  return out;
}

export function saveAudio(storage: StorageLike, settings: AudioSettings): void {
  try {
    storage.setItem(AUDIO_KEY, JSON.stringify(settings));
  } catch {
    // 저장 못 해도 이번 세션에는 적용된다
  }
}

// ───────────── 초기화 ─────────────

/** 고른 탑 (main.ts 가 저장한다) */
export const HERO_KEY = 'tower-guardian:hero';

/** 게임 초기화: 진행(별조각·강화·업적·이야기·기록·튜토리얼)을 모두 지운다. 소리 설정은 남긴다 */
/** 새 기능 첫 안내를 본 목록 (intro.ts) */
export const INTRO_KEY = 'tower-guardian:intro';

export function resetProgress(storage: StorageLike): void {
  for (const key of [KEY, ENDLESS_KEY, META_KEY, HERO_KEY, INTRO_KEY]) {
    try {
      if (storage.removeItem) storage.removeItem(key);
      else storage.setItem(key, '');
    } catch {
      // 막힌 저장소: 이번 세션 값만 처음으로 돌린다 (main.ts)
    }
  }
}
