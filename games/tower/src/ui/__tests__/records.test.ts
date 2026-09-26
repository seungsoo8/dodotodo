import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyRecords, loadRecords, saveRecords, updateRecords, type Records } from '../records.ts';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
  };
}

describe('최고 기록 갱신', () => {
  test('첫 판: 도달 라운드와 플레이 수가 기록된다', () => {
    const r = updateRecords(emptyRecords(), { difficulty: 'normal', won: false, round: 7, time: 130, kills: 50 });
    assert.equal(r.normal.bestRound, 7);
    assert.equal(r.normal.plays, 1);
    assert.equal(r.normal.wins, 0);
    assert.equal(r.normal.fastestWin, null);
    assert.equal(r.easy.plays, 0, '다른 난이도는 그대로');
  });

  test('더 낮은 라운드로 지면 최고 라운드는 그대로, 플레이 수만 오른다', () => {
    let r = updateRecords(emptyRecords(), { difficulty: 'hard', won: false, round: 9, time: 170, kills: 60 });
    r = updateRecords(r, { difficulty: 'hard', won: false, round: 4, time: 70, kills: 20 });
    assert.equal(r.hard.bestRound, 9);
    assert.equal(r.hard.plays, 2);
  });

  test('승리하면 승리 수가 오르고, 가장 빠른 승리 시간이 남는다', () => {
    let r = updateRecords(emptyRecords(), { difficulty: 'easy', won: true, round: 15, time: 320, kills: 300 });
    r = updateRecords(r, { difficulty: 'easy', won: true, round: 15, time: 350, kills: 310 });
    assert.equal(r.easy.wins, 2);
    assert.equal(r.easy.fastestWin, 320);
    r = updateRecords(r, { difficulty: 'easy', won: true, round: 15, time: 300, kills: 290 });
    assert.equal(r.easy.fastestWin, 300);
  });

  test('원래 기록 객체는 바뀌지 않는다', () => {
    const before = emptyRecords();
    updateRecords(before, { difficulty: 'normal', won: true, round: 15, time: 300, kills: 1 });
    assert.deepEqual(before, emptyRecords());
  });
});

describe('기록 저장·불러오기', () => {
  test('저장한 기록을 그대로 불러온다', () => {
    const storage = memoryStorage();
    const r = updateRecords(emptyRecords(), { difficulty: 'normal', won: true, round: 15, time: 301, kills: 9 });
    saveRecords(storage, r);
    assert.deepEqual(loadRecords(storage), r);
  });

  test('저장된 게 없으면 빈 기록', () => {
    assert.deepEqual(loadRecords(memoryStorage()), emptyRecords());
  });

  test('깨진 데이터면 빈 기록으로 시작한다', () => {
    const storage = memoryStorage({ 'tower-guardian:records': '{이상한' });
    assert.deepEqual(loadRecords(storage), emptyRecords());
  });

  test('일부 난이도만 저장돼 있거나 값 모양이 틀리면 그 부분만 빈 기록으로 채운다', () => {
    const partial: Partial<Records> = {
      hard: { bestRound: 12, plays: 3, wins: 0, fastestWin: null },
    };
    const storage = memoryStorage({
      'tower-guardian:records': JSON.stringify({ ...partial, easy: { bestRound: 'x' } }),
    });
    const r = loadRecords(storage);
    assert.deepEqual(r.hard, partial.hard);
    assert.deepEqual(r.easy, emptyRecords().easy);
    assert.deepEqual(r.normal, emptyRecords().normal);
  });

  test('저장소 접근이 막혀 있어도(예: 사생활 보호 모드) 오류 없이 빈 기록을 쓴다', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    assert.deepEqual(loadRecords(broken), emptyRecords());
    assert.doesNotThrow(() => saveRecords(broken, emptyRecords()));
  });
});
