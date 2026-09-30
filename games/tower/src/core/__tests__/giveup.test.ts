import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, giveUp, step } from '../game.ts';
import { buildRunReport, shardsForRun } from '../progress.ts';

describe('포기하기', () => {
  test('진행 중인 판을 포기하면 패배로 끝나고, 포기했다는 표시가 남는다', () => {
    const s = createGame({ seed: 1 });
    step(s, 1);
    assert.equal(giveUp(s), true);
    assert.equal(s.status, 'lost');
    assert.equal(s.gaveUp, true);
  });

  test('포기한 판의 보상은 그 라운드에서 진 판과 같다', () => {
    const a = createGame({ seed: 2 });
    const b = createGame({ seed: 2 });
    a.round = b.round = 6;
    a.kills = b.kills = 120;
    giveUp(a);
    b.status = 'lost';
    assert.equal(shardsForRun(buildRunReport(a)), shardsForRun(buildRunReport(b)));
    assert.equal(buildRunReport(a).won, false);
  });

  test('무한 모드도 포기로 끝낼 수 있다 (버틴 라운드가 기록)', () => {
    const s = createGame({ seed: 3, mode: 'endless' });
    s.round = 22;
    assert.equal(giveUp(s), true);
    assert.equal(buildRunReport(s).round, 22);
  });

  test('이미 끝난 판은 포기할 수 없다 (승리가 패배로 바뀌지 않는다)', () => {
    const s = createGame({ seed: 4 });
    s.status = 'won';
    assert.equal(giveUp(s), false);
    assert.equal(s.status, 'won');
    assert.equal(s.gaveUp, false);
  });

  test('새 판은 포기 표시 없이 시작하고, 포기 뒤에는 시간이 흐르지 않는다', () => {
    const s = createGame({ seed: 5 });
    assert.equal(s.gaveUp, false);
    giveUp(s);
    const t = s.time;
    step(s, 1);
    assert.equal(s.time, t);
  });
});
