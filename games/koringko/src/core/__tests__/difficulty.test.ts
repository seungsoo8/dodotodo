import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newSave } from '../character.ts';
import { DIFFICULTY, setDifficulty } from '../difficulty.ts';
import { parseSave } from '../saveio.ts';
import { MONSTERS, scaleMonster } from '../monsters.ts';
import { freeze, placeAt, play, idle } from './helpers.ts';
import type { Difficulty } from '../types.ts';

test('난이도: 새 캐릭터는 보통, 저장에 없거나 이상하면 보통으로 읽는다', () => {
  assert.equal(newSave(0, 'toby').difficulty, 'normal');
  const raw = JSON.parse(JSON.stringify(newSave(0, 'toby')));
  delete raw.difficulty;
  assert.equal(parseSave(JSON.stringify(raw))!.difficulty, 'normal');
  raw.difficulty = 'nightmare';
  assert.equal(parseSave(JSON.stringify(raw))!.difficulty, 'normal');
  raw.difficulty = 'hard';
  assert.equal(parseSave(JSON.stringify(raw))!.difficulty, 'hard');
});

test('난이도: 보통은 몬스터 표보다 세고, 어려움은 더 세고, 쉬움은 약하다', () => {
  assert.ok(DIFFICULTY.normal.hp > 1 && DIFFICULTY.normal.atk > 1);
  assert.ok(DIFFICULTY.hard.hp > DIFFICULTY.normal.hp && DIFFICULTY.hard.atk > DIFFICULTY.normal.atk);
  assert.ok(DIFFICULTY.easy.hp < 1 && DIFFICULTY.easy.atk < 1);
});

function monsterOn(d: Difficulty) {
  const g = play('toby', 'forest');
  setDifficulty(g, d);
  return { g, m: freeze(placeAt(g, 'wolf', 200, 0, 4)) };
}

test('난이도: 같은 몬스터라도 난이도에 따라 체력 · 공격력이 배율만큼 달라진다', () => {
  const s = scaleMonster(MONSTERS.wolf, 4);
  for (const d of ['easy', 'normal', 'hard'] as Difficulty[]) {
    const { m } = monsterOn(d);
    assert.equal(m.maxHp, Math.round(s.hp * DIFFICULTY[d].hp), d);
    assert.equal(m.atk, Math.round(s.atk * DIFFICULTY[d].atk), d);
  }
});

test('난이도: 어려움은 쓰러뜨렸을 때 경험치를 더 준다', () => {
  const exp = (d: Difficulty) => {
    const { g, m } = monsterOn(d);
    m.hp = 0;
    idle(g, 0.05);
    return g.save.exp;
  };
  assert.ok(exp('hard') > exp('normal'));
  assert.ok(exp('normal') >= exp('easy'));
});

test('난이도 바꾸기: 이미 나와 있는 몬스터는 그대로, 새로 나오는 몬스터부터 바뀐다', () => {
  const { g, m } = monsterOn('normal');
  const hp = m.maxHp;
  setDifficulty(g, 'hard');
  assert.equal(g.save.difficulty, 'hard');
  assert.equal(m.maxHp, hp);
  const m2 = placeAt(g, 'wolf', -200, 0, 4);
  assert.ok(m2.maxHp > hp);
});
