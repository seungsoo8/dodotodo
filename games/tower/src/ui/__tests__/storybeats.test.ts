import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, type GameState } from '../../core/game.ts';
import { CHAPTERS } from '../../core/story.ts';
import { LOW_HP_LINE, emptyBeatMemo, storyBeats } from '../storybeats.ts';

function game(opts: Parameters<typeof createGame>[0] = {}): GameState {
  return createGame({ hero: 'archer', seed: 1, ...opts });
}

describe('판 도중 수호자 대사', () => {
  test('1라운드에 첫 대사를 한 번만 한다', () => {
    const s = game();
    const first = storyBeats(s, [], emptyBeatMemo());
    assert.deepEqual(first.beats.map((b) => b.text), [CHAPTERS.archer.lines.start]);
    assert.equal(first.beats[0].keeper, '솔');
    assert.deepEqual(storyBeats(s, [], first.memo).beats, []);
  });

  test('5라운드·10라운드에 이야기가 이어진다', () => {
    const s = game();
    let memo = storyBeats(s, [], emptyBeatMemo()).memo;
    s.round = 5;
    const r5 = storyBeats(s, [], memo);
    assert.deepEqual(r5.beats.map((b) => b.text), [CHAPTERS.archer.lines.mid]);
    memo = r5.memo;
    s.round = 10;
    assert.deepEqual(storyBeats(s, [], memo).beats.map((b) => b.text), [CHAPTERS.archer.lines.late]);
  });

  test('라운드를 건너뛰어 지나쳤으면 늦은 대사는 하지 않는다 (가장 최근 것만)', () => {
    const s = game();
    s.round = 11;
    assert.deepEqual(storyBeats(s, [], emptyBeatMemo()).beats.map((b) => b.text), [CHAPTERS.archer.lines.late]);
  });

  test('보스가 나오면 그 보스에 맞는 대사', () => {
    const s = game();
    const memo = storyBeats(s, [], emptyBeatMemo()).memo;
    const out = storyBeats(s, [{ kind: 'boss', n: 1, id: 'boss_witch' }], memo);
    assert.deepEqual(out.beats.map((b) => b.text), [CHAPTERS.archer.boss.boss_witch]);
  });

  test('체력이 30% 아래로 처음 떨어지면 한 번 버틴다는 말을 한다', () => {
    const s = game();
    let memo = storyBeats(s, [], emptyBeatMemo()).memo;
    s.tower.hp = s.tower.maxHp * LOW_HP_LINE;
    assert.deepEqual(storyBeats(s, [], memo).beats, [], '딱 30% 는 아직');
    s.tower.hp = s.tower.maxHp * 0.29;
    const low = storyBeats(s, [], memo);
    assert.deepEqual(low.beats.map((b) => b.text), [CHAPTERS.archer.lines.lowHp]);
    memo = low.memo;
    s.tower.hp = s.tower.maxHp * 0.1;
    assert.deepEqual(storyBeats(s, [], memo).beats, []);
  });

  test('무한 모드는 라운드 대사 없이 보스·위기 대사만', () => {
    const s = game({ mode: 'endless' });
    assert.deepEqual(storyBeats(s, [], emptyBeatMemo()).beats, []);
    const out = storyBeats(s, [{ kind: 'boss', n: 2, id: 'boss' }], emptyBeatMemo());
    assert.deepEqual(out.beats.map((b) => b.text), [CHAPTERS.archer.boss.boss]);
  });

  test('탑을 고르지 않은 판(연습 등)은 아무 말도 안 한다', () => {
    const s = createGame({ seed: 1 });
    assert.equal(s.hero, null);
    assert.deepEqual(storyBeats(s, [{ kind: 'boss', n: 1, id: 'boss' }], emptyBeatMemo()).beats, []);
  });
});
