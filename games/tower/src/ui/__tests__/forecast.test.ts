import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { quietGame } from '../../core/__tests__/helpers.ts';
import { FORECAST_LEAD, forecastVisible, nextBig, nextIncidentShown, nextIsBoss, roadShares, timeLeftLabel } from '../forecast.ts';

describe('다음 라운드 예보 표시', () => {
  test(`라운드가 끝나기 ${FORECAST_LEAD}초 전부터 보인다`, () => {
    const s = quietGame();
    s.roundTime = s.config.roundSeconds - FORECAST_LEAD - 0.1;
    assert.equal(forecastVisible(s), false);
    s.roundTime = s.config.roundSeconds - FORECAST_LEAD;
    assert.equal(forecastVisible(s), true);
  });

  test('클래식 마지막 라운드에는 다음이 없으니 안 보인다', () => {
    const s = quietGame();
    s.round = s.config.totalRounds;
    s.roundTime = s.config.roundSeconds - 1;
    assert.equal(forecastVisible(s), false);
  });

  test('무한 모드는 마지막 라운드가 없으니 계속 보인다', () => {
    const s = quietGame();
    s.mode = 'endless';
    s.round = s.config.totalRounds + 3;
    s.roundTime = s.config.roundSeconds - 1;
    assert.equal(forecastVisible(s), true);
  });

  test('판이 끝났으면 안 보인다', () => {
    const s = quietGame();
    s.roundTime = s.config.roundSeconds - 1;
    s.status = 'lost';
    assert.equal(forecastVisible(s), false);
  });

  test('길마다 비율을 백분율로, 오는 길만, 많은 순으로', () => {
    assert.deepEqual(roadShares({ n: 0.4, e: 0, s: 0.6, w: 0 }), [
      { face: 's', pct: 60 },
      { face: 'n', pct: 40 },
    ]);
    assert.deepEqual(
      roadShares({ n: 0.2, e: 0.4, s: 0.2, w: 0.2 }).map((r) => r.pct),
      [40, 20, 20, 20],
    );
  });

  test('남은 시간 표시: 초 단위로 올림, 끝없는 튜토리얼 라운드는 "튜토리얼"', () => {
    const s = quietGame();
    s.roundTime = s.config.roundSeconds - 4.2;
    assert.equal(timeLeftLabel(s), '5초');
    s.config.roundSeconds = 1e6;
    assert.equal(timeLeftLabel(s), '튜토리얼');
  });

  test('다음 라운드의 큰 적: 부관(정예 주기마다, 보스 라운드는 빼고) · 정예의 길을 고르면 정예 · 보스', () => {
    const s = quietGame();
    const every = s.config.waves.eliteEvery;
    s.round = every - 1;
    assert.equal(nextBig(s), 'officer');
    s.round = every;
    assert.equal(nextBig(s), null);
    s.eliteHunt = true;
    assert.equal(nextBig(s), 'elite');
    s.eliteHunt = false;
    s.config.waves.eliteEvery = 0;
    s.round = 4;
    assert.equal(nextBig(s), null, '부관이 없는 설정');
    s.round = s.config.totalRounds - 1;
    assert.equal(nextBig(s), 'boss');
  });

  test('다음 라운드 사건 예보: 있으면 보이고, 짙은 안개 속에서는 가려진다', () => {
    const s = quietGame();
    assert.equal(nextIncidentShown(s), null);
    s.nextIncident = 'gold';
    assert.equal(nextIncidentShown(s), 'gold');
    s.incident = 'fog';
    assert.equal(nextIncidentShown(s), 'hidden');
  });

  test('다음 라운드가 보스 라운드인지 (클래식: 마지막 라운드, 무한: 15의 배수)', () => {
    const s = quietGame();
    s.round = s.config.totalRounds - 1;
    assert.equal(nextIsBoss(s), true);
    s.round = 3;
    assert.equal(nextIsBoss(s), false);
    s.mode = 'endless';
    s.round = s.config.endless.bossEvery * 2 - 1;
    assert.equal(nextIsBoss(s), true);
  });
});
