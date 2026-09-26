import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { findEnemy, findItem } from '../../core/data.ts';
import { applyItem, spawnEnemy } from '../../core/game.ts';
import { dummyDef, placeAt, quietGame } from '../../core/__tests__/helpers.ts';
import { emptyProgress, tutorialHint, updateProgress, type TutorialProgress } from '../tutorial.ts';

const all: TutorialProgress = { bought: true, meteor: true, blizzard: true };

describe('튜토리얼 안내 순서', () => {
  test('처음에는 상점에서 무기를 사라고 한다', () => {
    const s = quietGame();
    assert.match(tutorialHint(s, emptyProgress())!.title, /상점/);
  });

  test('산 뒤 적이 4마리 이상 모이면 메테오(Q)를 알려준다 (3마리면 아직)', () => {
    const s = quietGame();
    const p = { ...emptyProgress(), bought: true };
    for (let i = 0; i < 3; i++) placeAt(s, 100 + i * 5, 0, dummyDef());
    assert.equal(tutorialHint(s, p), null);
    placeAt(s, 130, 0, dummyDef());
    assert.match(tutorialHint(s, p)!.title, /Q/);
  });

  test('3라운드부터 눈보라(W)를 알려준다', () => {
    const s = quietGame();
    const p = { ...emptyProgress(), bought: true, meteor: true };
    assert.equal(tutorialHint(s, p), null);
    s.round = 3;
    assert.match(tutorialHint(s, p)!.title, /W/);
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
  test('스킬을 쓴 이벤트로 메테오·눈보라를 배운 것으로 친다. 원래 값은 그대로', () => {
    const p = emptyProgress();
    const next = updateProgress(p, [
      { kind: 'skill', id: 'meteor', at: { x: 0, y: 0 } },
      { kind: 'round', round: 2 },
    ]);
    assert.deepEqual(next, { bought: false, meteor: true, blizzard: false });
    assert.deepEqual(p, emptyProgress());
    assert.equal(updateProgress(next, [{ kind: 'skill', id: 'blizzard' }]).blizzard, true);
  });

  test('합성 이벤트는 산 것으로 친다', () => {
    assert.equal(updateProgress(emptyProgress(), [{ kind: 'merge', weaponId: 'sling', level: 2 }]).bought, true);
  });
});
