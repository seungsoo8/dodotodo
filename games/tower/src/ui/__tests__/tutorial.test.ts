import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { findEnemy, findItem } from '../../core/data.ts';
import { applyItem, selectFace, spawnEnemy } from '../../core/game.ts';
import { dummyDef, placeAt, quietGame } from '../../core/__tests__/helpers.ts';
import { emptyProgress, tutorialHint, updateProgress, type TutorialProgress } from '../tutorial.ts';

const all: TutorialProgress = { bought: true, meteor: true, faced: true, rotated: true };

describe('튜토리얼 안내 순서', () => {
  test('처음에는 상점에서 무기를 사라고 한다', () => {
    const s = quietGame();
    assert.match(tutorialHint(s, emptyProgress())!.title, /상점/);
  });

  test('산 뒤 적이 4마리 이상 모이면 메테오(Q)를 알려준다 (3마리면 아직)', () => {
    const s = quietGame();
    const p = { ...emptyProgress(), bought: true, faced: true };
    for (let i = 0; i < 3; i++) placeAt(s, 100 + i * 5, 0, dummyDef());
    assert.equal(tutorialHint(s, p), null);
    placeAt(s, 130, 0, dummyDef());
    assert.match(tutorialHint(s, p)!.title, /Q/);
  });

  test('무기가 없는 면 쪽 길로 적이 오면 면 고르는 법을 알려준다', () => {
    const s = quietGame();
    const p = { ...emptyProgress(), bought: true, meteor: true };
    selectFace(s, 'e');
    applyItem(s, findItem('sling'));
    placeAt(s, 150, 0, dummyDef());
    assert.equal(tutorialHint(s, p), null, '동쪽은 무기가 있다');
    placeAt(s, 0, -150, dummyDef());
    const hint = tutorialHint(s, p)!;
    assert.match(hint.title, /북/);
    assert.match(hint.text, /방향키/);
    assert.equal(tutorialHint(s, { ...p, faced: true }), null, '한 번 해 봤으면 그만');
  });

  test('다음 라운드 예보가 뜰 때, 가장 많이 올 길에 무기가 없으면 미리 알려준다', () => {
    const s = quietGame();
    const p = { ...emptyProgress(), bought: true, meteor: true };
    selectFace(s, 'e');
    applyItem(s, findItem('sling'));
    s.nextPlan = { n: 0, e: 0, s: 1, w: 0 };
    s.roundTime = s.config.roundSeconds - 2;
    assert.match(tutorialHint(s, p)!.title, /다음 라운드.*남/);
  });

  test('보스가 나오면 탑 돌리기(Z X)를 알려준다 (한 번 돌려 봤으면 그만)', () => {
    const s = quietGame();
    const p = { ...all, rotated: false };
    assert.equal(tutorialHint(s, p), null);
    spawnEnemy(s, findEnemy('boss'), s.tower.x + 200, s.tower.y);
    const hint = tutorialHint(s, p)!;
    assert.match(hint.title, /돌리기/);
    assert.match(hint.text, /Z/);
    assert.equal(tutorialHint(s, all), null);
  });

  test('두 길로 오기 시작하면(4라운드~) 탑 돌리기를 알려준다', () => {
    const s = quietGame();
    const p = { ...all, rotated: false };
    s.round = 3;
    assert.equal(tutorialHint(s, p), null);
    s.round = 4;
    assert.match(tutorialHint(s, p)!.title, /돌리기/);
  });

  test('같은 ★1 무기를 2개 가지면 하나 더 사면 합성된다고 알려준다', () => {
    const s = quietGame();
    applyItem(s, findItem('sling'));
    assert.equal(tutorialHint(s, all), null);
    applyItem(s, findItem('sling'));
    assert.match(tutorialHint(s, all)!.text, /★2/);
  });

  test('보스가 기를 모으면 무엇보다 먼저 끊는 법을 알려준다', () => {
    const s = quietGame();
    const boss = spawnEnemy(s, findEnemy('boss'), s.tower.x + 200, s.tower.y);
    assert.match(tutorialHint(s, emptyProgress())!.title, /상점/);
    boss.pattern!.phase = 'windup';
    assert.match(tutorialHint(s, emptyProgress())!.text, /눈보라/);
  });

  test('다 배웠고 특별한 상황이 없으면 안내하지 않는다', () => {
    assert.equal(tutorialHint(quietGame(), all), null);
  });
});

describe('튜토리얼 진행 기록', () => {
  test('메테오를 쓰면 메테오를, 무기를 옮기면 면 고르기를 배운 것으로 친다. 원래 값은 그대로', () => {
    const p = emptyProgress();
    const next = updateProgress(p, [
      { kind: 'skill', id: 'meteor', at: { x: 0, y: 0 } },
      { kind: 'round', round: 2 },
    ]);
    assert.deepEqual(next, { bought: false, meteor: true, faced: false, rotated: false });
    assert.equal(updateProgress(next, [{ kind: 'rotate', dir: 1 }]).rotated, true);
    assert.deepEqual(p, emptyProgress());
    assert.equal(updateProgress(next, [{ kind: 'move', weaponId: 'sling', face: 'n' }]).faced, true);
  });

  test('합성 이벤트는 산 것으로 친다', () => {
    assert.equal(updateProgress(emptyProgress(), [{ kind: 'merge', weaponId: 'sling', level: 2 }]).bought, true);
  });
});
