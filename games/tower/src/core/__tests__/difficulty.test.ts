import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CONFIG, DIFFICULTIES, mergeOverrides } from '../config.ts';
import { createGame } from '../game.ts';

describe('난이도', () => {
  test('쉬움·보통·어려움 세 가지가 이 순서로 있다', () => {
    assert.deepEqual(
      DIFFICULTIES.map((d) => d.id),
      ['easy', 'normal', 'hard'],
    );
    for (const d of DIFFICULTIES) assert.ok(d.name.length > 0 && d.desc.length > 0);
  });

  test('보통은 기본 설정 그대로다', () => {
    const s = createGame({ seed: 1, difficulty: 'normal' });
    assert.deepEqual(s.config, DEFAULT_CONFIG);
  });

  test('난이도를 정하지 않으면 보통이다', () => {
    const s = createGame({ seed: 1 });
    assert.equal(s.difficulty, 'normal');
  });

  test('어려울수록 적이 빨리 강해진다 (쉬움 < 보통 < 어려움)', () => {
    const g = (id: 'easy' | 'normal' | 'hard') => createGame({ seed: 1, difficulty: id }).config.waves.hpGrowth;
    assert.ok(g('easy') < g('normal'));
    assert.ok(g('normal') < g('hard'));
  });

  test('쉬움은 시작 골드와 탑 체력이 보통보다 넉넉하다', () => {
    const easy = createGame({ seed: 1, difficulty: 'easy' });
    const normal = createGame({ seed: 1, difficulty: 'normal' });
    assert.ok(easy.gold > normal.gold);
    assert.ok(easy.tower.maxHp > normal.tower.maxHp);
    assert.equal(easy.tower.hp, easy.tower.maxHp);
  });

  test('직접 준 설정이 난이도 설정보다 우선한다', () => {
    const s = createGame({ seed: 1, difficulty: 'hard', config: { waves: { hpGrowth: 1.01 } } });
    assert.equal(s.config.waves.hpGrowth, 1.01);
    assert.equal(s.difficulty, 'hard');
    const hard = DIFFICULTIES.find((d) => d.id === 'hard')!;
    // 난이도가 바꾼 다른 값은 그대로 남는다
    assert.equal(s.config.waves.countPerRound, hard.overrides.waves?.countPerRound ?? DEFAULT_CONFIG.waves.countPerRound);
  });
});

describe('설정 합치기', () => {
  test('뒤쪽 값이 앞쪽을 덮되, 묶음 안의 다른 값은 지킨다', () => {
    const merged = mergeOverrides({ waves: { hpGrowth: 1.2, atkGrowth: 1.3 }, roundSeconds: 10 }, { waves: { hpGrowth: 1.5 } });
    assert.deepEqual(merged, { waves: { hpGrowth: 1.5, atkGrowth: 1.3 }, roundSeconds: 10 });
  });

  test('배열은 통째로 바뀐다', () => {
    const merged = mergeOverrides({ startWeapons: ['a', 'b'] }, { startWeapons: [] });
    assert.deepEqual(merged.startWeapons, []);
  });
});
