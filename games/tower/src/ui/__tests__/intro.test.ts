import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { BOSS } from '../../core/data.ts';
import { spawnEnemy } from '../../core/game.ts';
import { offerRoute } from '../../core/route.ts';
import { ULT, gainUlt } from '../../core/ultimate.ts';
import { placeAt, quietGame } from '../../core/__tests__/helpers.ts';
import { INTROS, introDue, loadIntros, saveIntros, type IntroId } from '../intro.ts';
import { resetProgress } from '../records.ts';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (k: string) => data[k] ?? null,
    setItem: (k: string, v: string) => void (data[k] = v),
    removeItem: (k: string) => void delete data[k],
  };
}

/** 예보가 보이는 시점(라운드 끝 6초 전 안)으로 */
function forecastTime(s: ReturnType<typeof quietGame>): void {
  s.roundTime = s.config.roundSeconds - 3;
}

describe('새 기능을 처음 만났을 때 짧은 안내', () => {
  test('아무 일 없으면 안내도 없다 (1라운드, 적 없음)', () => {
    const s = quietGame();
    assert.equal(introDue(s, [], []), null);
  });

  test('밤 지도가 처음 열리면 갈림길 안내', () => {
    const s = quietGame();
    offerRoute(s);
    assert.equal(introDue(s, [], []), 'route');
  });

  test('안개 속 사건 · 모루 고르기가 처음 열리면 그 안내', () => {
    const s = quietGame();
    s.encounter = 'shrine';
    assert.equal(introDue(s, [], []), 'encounter');
    s.encounter = null;
    s.forging = true;
    assert.equal(introDue(s, [], []), 'forge');
  });

  test('부관은 예보에 뜰 때(라운드 4 끝 무렵) 또는 나타날 때', () => {
    const s = quietGame();
    s.round = 4;
    assert.notEqual(introDue(s, [], []), 'officer', '예보 전에는 아직');
    forecastTime(s);
    assert.equal(introDue(s, [], ['tap']), 'officer');
    const t = quietGame();
    assert.equal(introDue(t, [{ kind: 'officer', id: BOSS.id, name: '부관' }], []), 'officer');
  });

  test('사건은 예보에 뜰 때 또는 시작할 때', () => {
    const s = quietGame();
    s.nextIncident = 'gold';
    assert.equal(introDue(s, [], []), null, '예보 전');
    forecastTime(s);
    assert.equal(introDue(s, [], []), 'incident');
    const t = quietGame();
    assert.equal(introDue(t, [{ kind: 'incident', id: 'bats' }], []), 'incident');
  });

  test('궁극기 게이지가 처음 가득 차면 궁극기 안내', () => {
    const s = quietGame();
    gainUlt(s, ULT.max - 1);
    assert.equal(introDue(s, [], []), null);
    gainUlt(s, 1);
    assert.equal(introDue(s, [], []), 'ult');
  });

  test('2라운드부터 적이 보이면 직접 때리기 안내 (1라운드는 상점·면 고르기 배우기에 맡긴다)', () => {
    const s = quietGame();
    placeAt(s, 100, 0);
    assert.equal(introDue(s, [], []), null);
    s.round = 2;
    assert.equal(introDue(s, [], []), 'tap');
  });

  test('이미 본 안내는 다시 나오지 않고, 여럿이면 급한 것(지금 멈춰 있는 창)부터', () => {
    const s = quietGame();
    s.round = 2;
    placeAt(s, 100, 0);
    gainUlt(s, ULT.max);
    offerRoute(s);
    assert.equal(introDue(s, [], []), 'route');
    assert.equal(introDue(s, [], ['route']), 'ult');
    assert.equal(introDue(s, [], ['route', 'ult']), 'tap');
    assert.equal(introDue(s, [], ['route', 'ult', 'tap']), null);
  });

  test('판이 끝났거나 마지막 일격 연출 중이면 안내하지 않는다', () => {
    const s = quietGame();
    gainUlt(s, ULT.max);
    s.status = 'won';
    assert.equal(introDue(s, [], []), null);
    const t = quietGame();
    gainUlt(t, ULT.max);
    spawnEnemy(t, BOSS, t.tower.x + 100, t.tower.y);
    t.finaleLeft = 0.5;
    assert.equal(introDue(t, [], []), null);
  });

  test('안내마다 제목과 설명이 있다', () => {
    for (const id of Object.keys(INTROS) as IntroId[]) {
      assert.ok(INTROS[id].title.length > 0 && INTROS[id].text.length > 0, id);
    }
  });
});

describe('본 안내 저장', () => {
  test('저장했다 불러오면 그대로, 처음엔 빈 목록', () => {
    const st = memoryStorage();
    assert.deepEqual(loadIntros(st), []);
    saveIntros(st, ['route', 'ult']);
    assert.deepEqual(loadIntros(st), ['route', 'ult']);
  });

  test('깨진 값이나 모르는 이름은 버린다', () => {
    assert.deepEqual(loadIntros(memoryStorage({ 'tower-guardian:intro': '{깨짐' })), []);
    assert.deepEqual(loadIntros(memoryStorage({ 'tower-guardian:intro': '["ult","없는것",3]' })), ['ult']);
  });

  test('게임 초기화를 하면 안내도 처음부터 다시 나온다', () => {
    const st = memoryStorage();
    saveIntros(st, ['ult']);
    resetProgress(st);
    assert.deepEqual(loadIntros(st), []);
  });
});
