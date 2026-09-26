import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { computeLayout, fitScale, hitTest, hitTestChoice, hitTestStart, toLogical } from '../layout.ts';

describe('화면 배치', () => {
  const layout = computeLayout(640, 360, 4);

  test('전장 아래에 상점 칸 4개가 겹치지 않게 왼쪽부터 놓인다', () => {
    assert.equal(layout.cards.length, 4);
    for (const c of layout.cards) assert.ok(c.y >= 360, '상점은 전장 아래에 있다');
    for (let i = 1; i < 4; i++) {
      assert.ok(layout.cards[i].x >= layout.cards[i - 1].x + layout.cards[i - 1].w, `${i}번 칸이 앞 칸과 겹침`);
    }
    const last = layout.cards[3];
    assert.ok(last.x + last.w <= layout.reroll.x, '상점 칸은 리롤 버튼과 겹치지 않는다');
    assert.ok(layout.reroll.x + layout.reroll.w <= layout.width);
    assert.ok(layout.height > 360);
  });

  test('칸 안을 누르면 그 칸 번호, 버튼을 누르면 그 버튼, 빈 곳이나 전장은 null', () => {
    const c2 = layout.cards[2];
    assert.deepEqual(hitTest(layout, c2.x + 1, c2.y + 1), { kind: 'card', index: 2 });
    assert.deepEqual(hitTest(layout, c2.x + c2.w - 1, c2.y + c2.h - 1), { kind: 'card', index: 2 });
    const r = layout.reroll;
    assert.deepEqual(hitTest(layout, r.x + r.w / 2, r.y + r.h / 2), { kind: 'reroll' });
    const sp = layout.speed;
    assert.deepEqual(hitTest(layout, sp.x + 2, sp.y + 2), { kind: 'speed' });
    const pa = layout.pause;
    assert.deepEqual(hitTest(layout, pa.x + 2, pa.y + 2), { kind: 'pause' });
    assert.equal(hitTest(layout, 320, 180), null);
    assert.equal(hitTest(layout, c2.x - 0.5, c2.y + 5), null, '칸 사이 틈');
  });

  test('칸의 경계선(오른쪽·아래 끝)은 그 칸에 포함되지 않는다', () => {
    const c0 = layout.cards[0];
    assert.equal(hitTest(layout, c0.x + c0.w, c0.y + 1), null);
    assert.equal(hitTest(layout, c0.x + 1, c0.y + c0.h), null);
    assert.deepEqual(hitTest(layout, c0.x, c0.y), { kind: 'card', index: 0 });
  });
});

describe('화면 크기 맞추기', () => {
  test('비율을 유지하며 창 안에 들어가는 가장 큰 배율을 고른다', () => {
    assert.equal(fitScale(640, 440, 1280, 880), 2);
    assert.equal(fitScale(640, 440, 1280, 440), 1, '세로가 더 좁으면 세로에 맞춘다');
    assert.equal(fitScale(640, 440, 320, 1000), 0.5, '가로가 더 좁으면 가로에 맞춘다');
  });

  test('화면 좌표를 게임 좌표로 바꾼다 (캔버스 위치와 배율 반영)', () => {
    const rect = { left: 100, top: 50, width: 1280, height: 880 };
    assert.deepEqual(toLogical(rect, 640, 440, 100, 50), { x: 0, y: 0 });
    assert.deepEqual(toLogical(rect, 640, 440, 740, 490), { x: 320, y: 220 });
    assert.deepEqual(toLogical(rect, 640, 440, 1380, 930), { x: 640, y: 440 });
  });
});

describe('시작 화면 버튼', () => {
  const layout = computeLayout(640, 360, 4);

  test('난이도 버튼 3개가 겹치지 않게 가로로 놓이고 화면 안에 있다', () => {
    assert.deepEqual(
      layout.difficulty.map((d) => d.id),
      ['easy', 'normal', 'hard'],
    );
    for (let i = 1; i < 3; i++) {
      const a = layout.difficulty[i - 1].rect;
      const b = layout.difficulty[i].rect;
      assert.ok(b.x >= a.x + a.w);
    }
    for (const { rect } of layout.difficulty) {
      assert.ok(rect.x >= 0 && rect.x + rect.w <= layout.width);
      assert.ok(rect.y >= 0 && rect.y + rect.h <= layout.height);
    }
  });

  test('시작 화면에서 난이도 버튼을 누르면 그 난이도, 다른 곳은 null', () => {
    const hard = layout.difficulty[2].rect;
    assert.deepEqual(hitTestStart(layout, hard.x + 2, hard.y + 2), { kind: 'difficulty', id: 'hard' });
    assert.equal(hitTestStart(layout, 1, 1), null);
  });

  test('소리 버튼은 게임 중 hitTest 로 눌린다', () => {
    const m = layout.mute;
    assert.deepEqual(hitTest(layout, m.x + 1, m.y + 1), { kind: 'mute' });
  });
});

describe('시작 화면 모드 탭', () => {
  const layout = computeLayout(640, 360, 4);

  test('클래식·무한 탭이 난이도 버튼 위에 겹치지 않게 놓인다', () => {
    assert.deepEqual(
      layout.modes.map((m) => m.id),
      ['classic', 'endless'],
    );
    const [a, b] = layout.modes.map((m) => m.rect);
    assert.ok(b.x >= a.x + a.w);
    for (const m of layout.modes) assert.ok(m.rect.y + m.rect.h <= layout.difficulty[0].rect.y, '난이도 버튼보다 위');
  });

  test('탭을 누르면 그 모드를 고른다', () => {
    const e = layout.modes[1].rect;
    assert.deepEqual(hitTestStart(layout, e.x + 3, e.y + 3), { kind: 'mode', id: 'endless' });
  });
});

describe('스킬 바와 보상 카드 배치', () => {
  const layout = computeLayout(640, 360, 4);

  test('스킬 버튼 4개가 전장 아래쪽 가운데에 겹치지 않게 놓인다', () => {
    assert.equal(layout.skills.length, 4);
    for (let i = 1; i < 4; i++) assert.ok(layout.skills[i].x >= layout.skills[i - 1].x + layout.skills[i - 1].w);
    const left = layout.skills[0].x;
    const right = layout.skills[3].x + layout.skills[3].w;
    assert.ok(Math.abs((left + right) / 2 - 320) < 1, '가운데 정렬');
    for (const r of layout.skills) assert.ok(r.y + r.h <= 360 && r.y > 300, '전장 아래쪽 안');
  });

  test('게임 중 스킬 버튼을 누르면 그 번호', () => {
    const r = layout.skills[2];
    assert.deepEqual(hitTest(layout, r.x + 2, r.y + 2), { kind: 'skill', index: 2 });
  });

  test('보상 카드 3장이 전장 가운데에 나란히 있고, 누르면 그 번호', () => {
    assert.equal(layout.perkCards.length, 3);
    for (let i = 1; i < 3; i++) assert.ok(layout.perkCards[i].x >= layout.perkCards[i - 1].x + layout.perkCards[i - 1].w);
    for (const r of layout.perkCards) assert.ok(r.y >= 0 && r.y + r.h <= 360);
    const r = layout.perkCards[1];
    assert.equal(hitTestChoice(layout, r.x + 5, r.y + 5), 1);
    assert.equal(hitTestChoice(layout, 1, 1), null);
  });
});
