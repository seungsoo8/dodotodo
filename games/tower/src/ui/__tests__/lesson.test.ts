import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { buyItem, rotateTower, selectFace, step, type GameState } from '../../core/game.ts';
import { faceOf } from '../../core/faces.ts';
import { useSkill } from '../../core/skills.ts';
import {
  LESSON_PARTS,
  LESSON_STEPS,
  advanceLesson,
  createLessonGame,
  lessonPart,
  lessonRunning,
  lessonText,
  skipLesson,
  startLesson,
  type Lesson,
} from '../lesson.ts';

/** 게임을 진행하며 연습 판을 넘긴다 (실제 루프처럼 이벤트를 꺼내 넘긴다) */
function tick(s: GameState, l: Lesson, seconds = 0.1, input: 'next' | null = null): Lesson {
  if (lessonRunning(l)) step(s, seconds);
  return advanceLesson(l, s, s.events.splice(0), input);
}

function stepId(l: Lesson): string {
  return LESSON_STEPS[l.step].id;
}

/** 적이 다 쓰러질 때까지 (최대 60초) */
function clear(s: GameState, l: Lesson): Lesson {
  for (let i = 0; i < 600 && lessonRunning(l); i++) l = tick(s, l);
  return l;
}

describe('연습 판 준비', () => {
  test('연습 판은 적이 저절로 나오지 않고, 라운드도 넘어가지 않는다', () => {
    const s = createLessonGame();
    for (let i = 0; i < 100; i++) step(s, 1);
    assert.equal(s.enemies.length, 0);
    assert.equal(s.round, 1);
    assert.equal(s.weapons.length, 0, '무기 없이 시작 (직접 사 보게)');
  });

  test('설명 없이 바로 무기 사기부터: 상점이 차려져 있고 게임은 멈춰 있다', () => {
    const s = createLessonGame();
    const l = startLesson(s);
    assert.equal(stepId(l), 'buy');
    assert.equal(lessonRunning(l), false);
    assert.ok(s.shop.every((it) => it?.kind === 'weapon'));
    assert.ok(s.gold >= 600);
  });

  test('핵심 4가지(사기 · 면 · 돌리기 · 스킬)로 묶여 1/4 ~ 4/4 로 보이고, 마지막 인사는 번호가 없다', () => {
    assert.equal(LESSON_PARTS, 4);
    const parts = LESSON_STEPS.map((st) => st.part ?? null);
    assert.deepEqual(parts, [1, 1, 2, 2, 3, 4, null]);
    assert.deepEqual(
      LESSON_STEPS.map((st) => st.id),
      ['buy', 'wedge', 'otherFace', 'otherWave', 'rotate', 'skill', 'done'],
    );
    const s = createLessonGame();
    assert.equal(lessonPart(startLesson(s)), 1);
  });
});

describe('따라 하며 배우기', () => {
  function toBuy(): [GameState, Lesson] {
    const s = createLessonGame();
    return [s, startLesson(s)];
  }

  test('사기: 상점에 무기만 놓이고 골드가 넉넉하며, 사면 다음 단계로', () => {
    const [s, l0] = toBuy();
    assert.ok(s.shop.every((it) => it?.kind === 'weapon'));
    assert.ok(buyItem(s, 0));
    const l = tick(s, l0);
    assert.equal(stepId(l), 'wedge');
  });

  test('"다음" 은 할 일이 있는 단계를 건너뛰지 못한다', () => {
    const [s, l0] = toBuy();
    const l = tick(s, l0, 0.1, 'next');
    assert.equal(stepId(l), 'buy');
  });

  test('부채꼴: 무기를 단 쪽 길에서만 적이 오고 게임이 흐른다. 다 잡으면 다음', () => {
    const [s, l0] = toBuy();
    buyItem(s, 0);
    let l = tick(s, l0);
    assert.equal(lessonRunning(l), true);
    assert.ok(s.enemies.length > 0);
    const face = s.weapons[0].face;
    for (const e of s.enemies) assert.equal(faceOf(e.x - s.tower.x, e.y - s.tower.y), face);
    l = clear(s, l);
    assert.equal(stepId(l), 'otherFace');
    assert.equal(s.enemies.length, 0);
  });

  function toOther(): [GameState, Lesson] {
    const [s, l0] = toBuy();
    buyItem(s, 0);
    return [s, clear(s, tick(s, l0))];
  }

  test('반대쪽 면: 반대쪽을 골라 무기를 달아야 넘어간다 (같은 면에 더 사면 안 넘어감)', () => {
    const [s, l0] = toOther();
    const target = l0.otherFace;
    assert.notEqual(target, s.weapons[0].face);
    buyItem(s, 1);
    let l = tick(s, l0);
    assert.equal(stepId(l), 'otherFace');
    selectFace(s, target);
    buyItem(s, 2);
    l = tick(s, l);
    assert.equal(stepId(l), 'otherWave');
    l = clear(s, l);
    assert.equal(stepId(l), 'rotate');
  });

  test('돌리기 → 스킬 → 끝 (예보는 첫 판 안내로 넘긴다)', () => {
    const [s, l0] = toOther();
    selectFace(s, l0.otherFace);
    buyItem(s, 2);
    let l = clear(s, tick(s, l0));
    assert.equal(stepId(l), 'rotate');
    rotateTower(s, 1);
    l = tick(s, l);
    assert.equal(stepId(l), 'skill');
    assert.equal(lessonPart(l), 4);
    assert.ok(s.enemies.length >= 4, '메테오 쓸 무리가 나온다');
    for (let i = 0; i < 20; i++) l = tick(s, l);
    assert.ok(useSkill(s, 'meteor'));
    l = tick(s, l);
    assert.equal(stepId(l), 'done');
    l = tick(s, l, 0.1, 'next');
    assert.equal(l.finished, true);
  });

  test('건너뛰기는 어느 단계에서나 바로 끝낸다', () => {
    const [s, l0] = toBuy();
    const l = skipLesson(l0);
    assert.equal(l.finished, true);
    assert.equal(lessonRunning(l), false);
    assert.ok(s);
  });

  test('스킬 단계의 적은 무기가 없는 길로 와서 스킬을 쓸 틈이 있고, 스킬 전에 다 사라지면 다시 온다', () => {
    const [s, l0] = toOther();
    selectFace(s, l0.otherFace);
    buyItem(s, 2);
    let l = clear(s, tick(s, l0));
    rotateTower(s, 1);
    l = tick(s, l);
    assert.equal(stepId(l), 'skill');
    const armed = new Set(s.weapons.map((w) => w.face));
    for (const e of s.enemies) assert.ok(!armed.has(faceOf(e.x - s.tower.x, e.y - s.tower.y)), '무기가 없는 길');
    s.enemies = [];
    l = tick(s, l);
    assert.equal(stepId(l), 'skill');
    assert.ok(s.enemies.length > 0, '다시 온다');
  });

  test('반대쪽 면 단계 설명에는 실제 방향과 방향키가 들어간다', () => {
    const [s, l0] = toOther();
    const text = lessonText(LESSON_STEPS[l0.step], l0);
    const label = { n: '북', e: '동', s: '남', w: '서' }[l0.otherFace];
    const key = { n: '↑', e: '→', s: '↓', w: '←' }[l0.otherFace];
    assert.ok(text.includes(`${label}쪽`), text);
    assert.ok(text.includes(key), text);
    assert.ok(!text.includes('{'), text);
    assert.ok(s);
  });

  test('단계마다 제목과 설명이 있다', () => {
    for (const st of LESSON_STEPS) assert.ok(st.title && st.text, st.id);
  });
});
