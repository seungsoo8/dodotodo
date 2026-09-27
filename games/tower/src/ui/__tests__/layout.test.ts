import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { BASE_SKILLS, FUSED_SKILLS } from '../../core/skills.ts';
import { aimableAt, computeLayout, fitScale, hitTest, hitTestChoice, hitTestMeta, hitTestStart, hitTestTree, toLogical } from '../layout.ts';

describe('화면 배치', () => {
  const layout = computeLayout(640, 360, 4);

  const overlaps = (a: { x: number; y: number; w: number; h: number }, b: typeof a) =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

  test('화면은 16:9 전장 하나이고, 상점 4칸과 리롤은 아래쪽 가운데에 한 줄로 떠 있다', () => {
    assert.equal(layout.width, 640);
    assert.equal(layout.height, 360);
    assert.equal(layout.cards.length, 4);
    for (const c of layout.cards) assert.ok(c.y >= 290 && c.y + c.h <= 360, `상점 칸 y ${c.y}`);
    for (let i = 1; i < 4; i++) assert.ok(layout.cards[i].x >= layout.cards[i - 1].x + layout.cards[i - 1].w, `${i}번 칸이 앞 칸과 겹침`);
    const last = layout.cards[3];
    assert.ok(last.x + last.w <= layout.reroll.x, '상점 칸은 리롤 버튼과 겹치지 않는다');
    const left = layout.cards[0].x;
    const right = layout.reroll.x + layout.reroll.w;
    assert.ok(Math.abs((left + right) / 2 - 320) < 1, '가운데 정렬');
  });

  test('상단 버튼(정보·배속·정지·소리)은 오른쪽 위에 한 줄로, 서로 겹치지 않는다', () => {
    const top = [layout.info, layout.speed, layout.pause, layout.mute];
    for (const r of top) assert.ok(r.y + r.h <= 28 && r.x + r.w <= 640 && r.x > 480, JSON.stringify(r));
    for (let i = 0; i < top.length; i++) for (let j = i + 1; j < top.length; j++) assert.ok(!overlaps(top[i], top[j]));
    assert.deepEqual(hitTest(layout, layout.info.x + 2, layout.info.y + 2), { kind: 'info' });
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

  test('스킬 버튼 4개와 트리 버튼이 상점 바로 위 가운데에 겹치지 않게 놓인다', () => {
    assert.equal(layout.skills.length, 4);
    const row = [...layout.skills, layout.treeButton];
    for (let i = 1; i < row.length; i++) assert.ok(row[i].x >= row[i - 1].x + row[i - 1].w);
    const left = row[0].x;
    const right = row[row.length - 1].x + row[row.length - 1].w;
    assert.ok(Math.abs((left + right) / 2 - 320) < 1, '가운데 정렬');
    for (const r of row) assert.ok(r.y + r.h <= layout.cards[0].y, '상점 위');
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

describe('탑 선택 · 강화 상점 · 업적 화면', () => {
  const layout = computeLayout(640, 360, 4);
  const within = (r: { x: number; y: number; w: number; h: number }) =>
    r.x >= 0 && r.y >= 0 && r.x + r.w <= layout.width && r.y + r.h <= layout.height;
  const overlaps = (a: { x: number; y: number; w: number; h: number }, b: typeof a) =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

  test('시작 화면: 탑 카드 5장·모드·난이도·강화·업적 버튼이 서로 겹치지 않고 화면 안에 있다', () => {
    assert.deepEqual(
      layout.heroes.map((h) => h.id),
      ['guardian', 'archer', 'mage', 'fortress', 'gambler'],
    );
    const rects = [
      ...layout.heroes.map((h) => h.rect),
      ...layout.modes.map((m) => m.rect),
      ...layout.difficulty.map((d) => d.rect),
      layout.metaButton,
      layout.achButton,
    ];
    for (const r of rects) assert.ok(within(r));
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) assert.ok(!overlaps(rects[i], rects[j]), `${i}·${j} 겹침`);
  });

  test('시작 화면에서 탑 카드·강화·업적 버튼을 누르면 그것을 돌려준다', () => {
    const mage = layout.heroes[2].rect;
    assert.deepEqual(hitTestStart(layout, mage.x + 3, mage.y + 3), { kind: 'hero', id: 'mage' });
    assert.deepEqual(hitTestStart(layout, layout.metaButton.x + 2, layout.metaButton.y + 2), { kind: 'meta' });
    assert.deepEqual(hitTestStart(layout, layout.achButton.x + 2, layout.achButton.y + 2), { kind: 'achievements' });
  });

  test('강화 상점: 강화 12칸이 겹치지 않고, 돌아가기 버튼과도 겹치지 않는다', () => {
    assert.equal(layout.metaCards.length, 12);
    const rects = [...layout.metaCards, layout.back];
    for (const r of rects) assert.ok(within(r));
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) assert.ok(!overlaps(rects[i], rects[j]));
  });

  test('강화 상점에서 칸을 누르면 그 번호, 돌아가기는 back, 빈 곳은 null', () => {
    const c = layout.metaCards[7];
    assert.deepEqual(hitTestMeta(layout, c.x + 1, c.y + 1), { kind: 'upgrade', index: 7 });
    assert.deepEqual(hitTestMeta(layout, layout.back.x + 1, layout.back.y + 1), { kind: 'back' });
    assert.equal(hitTestMeta(layout, 1, 1), null);
  });

  test('업적 목록 14칸이 겹치지 않고 화면 안에 있다', () => {
    assert.equal(layout.achRows.length, 14);
    const rects = [...layout.achRows, layout.back];
    for (const r of rects) assert.ok(within(r));
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) assert.ok(!overlaps(rects[i], rects[j]));
  });
});

describe('스킬 트리 화면', () => {
  const layout = computeLayout(640, 360, 4);
  const t = layout.tree;
  const overlaps = (a: { x: number; y: number; w: number; h: number }, b: typeof a) =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

  test('기본 6칸 · 진화 6칸 · 합체 7칸 · 설명 칸 · 닫기가 서로 겹치지 않고 전장 안에 있다', () => {
    assert.deepEqual(
      t.base.map((n) => n.id),
      BASE_SKILLS.map((k) => k.id),
    );
    assert.deepEqual(
      t.evolve.map((n) => n.id),
      BASE_SKILLS.map((k) => k.id),
    );
    assert.deepEqual(
      [...t.fused.map((n) => n.id)].sort(),
      FUSED_SKILLS.map((k) => k.id).sort(),
    );
    const rects = [...t.base, ...t.evolve, ...t.fused].map((n) => n.rect).concat([t.detail, t.close]);
    for (const r of rects) assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= 640 && r.y + r.h <= 360, JSON.stringify(r));
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) assert.ok(!overlaps(rects[i], rects[j]), `${i}·${j} 겹침`);
  });

  test('진화 칸은 자기 기본 스킬 바로 아래, 합체 칸은 두 재료 사이에 있다', () => {
    t.base.forEach((b, i) => {
      const e = t.evolve[i].rect;
      assert.ok(e.y > b.rect.y + b.rect.h);
      assert.ok(Math.abs(e.x + e.w / 2 - (b.rect.x + b.rect.w / 2)) < 1);
    });
    for (const f of t.fused) {
      const [a, b] = FUSED_SKILLS.find((k) => k.id === f.id)!.recipe!;
      const ca = t.base.find((n) => n.id === a)!.rect;
      const cb = t.base.find((n) => n.id === b)!.rect;
      const cx = f.rect.x + f.rect.w / 2;
      const lo = Math.min(ca.x, cb.x);
      const hi = Math.max(ca.x + ca.w, cb.x + cb.w);
      assert.ok(cx > lo && cx < hi, `${f.id} 가 재료 사이에 없음`);
      assert.ok(f.rect.y > t.evolve[0].rect.y + t.evolve[0].rect.h, '합체는 진화 아래');
    }
  });

  test('누른 칸: 배우기·진화·합체·닫기, 빈 곳은 null', () => {
    const b = t.base[4].rect;
    assert.deepEqual(hitTestTree(layout, b.x + 2, b.y + 2), { kind: 'learn', id: 'thunder' });
    const e = t.evolve[0].rect;
    assert.deepEqual(hitTestTree(layout, e.x + 2, e.y + 2), { kind: 'evolve', id: 'meteor' });
    const f = t.fused.find((n) => n.id === 'comet')!.rect;
    assert.deepEqual(hitTestTree(layout, f.x + 2, f.y + 2), { kind: 'fuse', id: 'comet' });
    assert.deepEqual(hitTestTree(layout, t.close.x + 2, t.close.y + 2), { kind: 'close' });
    assert.equal(hitTestTree(layout, 1, 1), null);
  });

  test('게임 중 스킬 바 옆 트리 버튼을 누르면 tree', () => {
    const r = layout.treeButton;
    assert.ok(r.x >= layout.skills[3].x + layout.skills[3].w, '스킬 바 오른쪽');
    assert.deepEqual(hitTest(layout, r.x + 2, r.y + 2), { kind: 'tree' });
  });
});

describe('조준할 수 있는 곳', () => {
  const layout = computeLayout(640, 360, 4);

  test('열린 전장은 조준할 수 있다', () => {
    assert.equal(aimableAt(layout, { x: 320, y: 120 }), true);
    assert.equal(aimableAt(layout, { x: 600, y: 200 }), true);
  });

  test('위쪽 바·무기 칸·스킬 바·상점 위는 조준하지 않는다 (키로 스킬을 쓸 때 빈 곳에 떨어지지 않게)', () => {
    assert.equal(aimableAt(layout, { x: 320, y: 10 }), false, '위쪽 바');
    assert.equal(aimableAt(layout, { x: 60, y: 40 }), false, '무기 칸');
    const c = layout.cards[1];
    assert.equal(aimableAt(layout, { x: c.x + 5, y: c.y + 5 }), false, '상점');
    const sk = layout.skills[0];
    assert.equal(aimableAt(layout, { x: sk.x + 5, y: sk.y + 5 }), false, '스킬 바');
    assert.equal(aimableAt(layout, { x: -5, y: 100 }), false, '화면 밖');
  });
});

describe('작은 버튼은 누르는 범위를 넉넉하게', () => {
  const layout = computeLayout(640, 360, 4);

  test('오른쪽 위 작은 버튼은 가장자리 3px 바깥을 눌러도 눌린다', () => {
    const r = layout.info;
    assert.deepEqual(hitTest(layout, r.x - 3, r.y + r.h / 2), { kind: 'info' });
    assert.deepEqual(hitTest(layout, r.x + r.w / 2, r.y + r.h + 3), { kind: 'info' });
  });

  test('넉넉하게 잡아도 이웃 버튼끼리 겹치지 않는다 (가운데는 자기 버튼)', () => {
    for (const k of ['info', 'speed', 'pause', 'mute'] as const) {
      const r = layout[k];
      assert.deepEqual(hitTest(layout, r.x + r.w / 2, r.y + r.h / 2), { kind: k });
    }
  });
});
