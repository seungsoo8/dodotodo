import { DIFFICULTIES, type DifficultyId } from '../core/config.ts';
import { emptyMeta, type MetaState } from '../core/meta.ts';

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
    if (count(p.runs)) meta.runs = p.runs as number;
  } catch {
    // 깨진 데이터나 막힌 저장소: 처음부터
  }
  return meta;
}

export function saveMeta(storage: StorageLike, meta: MetaState): void {
  try {
    storage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    // 저장이 막혀 있으면 이번 세션에만 남는다
  }
}
