import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { FACES } from '../../core/faces.ts';
import { aimableAt, computeLayout, computeView, hitTest, toMenu, toScreen, toWorld, type Layout, type Rect } from '../layout.ts';

const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const within = (r: Rect, w: number, h: number) => r.x >= 0 && r.y >= 0 && r.x + r.w <= w + 1e-9 && r.y + r.h <= h + 1e-9;

function noOverlap(rects: Rect[], name: string): void {
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) assert.ok(!overlaps(rects[i], rects[j]), `${name}: ${i}·${j} 겹침 ${JSON.stringify(rects[i])} ${JSON.stringify(rects[j])}`);
  }
}

/** 판 도중 화면의 버튼·칸 (서로 겹치면 안 되는 것) */
function gameRects(l: Layout): Rect[] {
  return [
    ...l.cards,
    l.reroll,
    ...l.skills,
    l.rotateLeft,
    l.rotateRight,
    ...FACES.map((f) => l.facePad[f]),
    l.info,
    l.speed,
    l.pause,
    l.mute,
    l.hud.round,
    l.hud.enemies,
    l.hud.gold,
    l.hud.hp,
  ];
}

describe('화면 크기 → 게임 화면 크기', () => {
  test('16:9 는 지금과 같은 640×360', () => {
    assert.deepEqual(computeView(1280, 720), { width: 640, height: 360 });
    assert.deepEqual(computeView(1920, 1080), { width: 640, height: 360 });
  });

  test('더 넓은 가로 화면은 높이 360 에 폭을 늘린다 (너무 넓으면 960 까지)', () => {
    assert.deepEqual(computeView(2560, 1080), { width: 853, height: 360 });
    assert.deepEqual(computeView(844, 390), { width: 779, height: 360 });
    assert.deepEqual(computeView(5000, 1000), { width: 960, height: 360 });
  });

  test('덜 넓은 가로 화면(4:3 등)은 폭 640 에 높이를 늘린다', () => {
    assert.deepEqual(computeView(1024, 768), { width: 640, height: 480 });
  });

  test('세로 화면은 폭 360 에 높이를 늘린다 (너무 짧거나 길면 560~820 으로)', () => {
    assert.deepEqual(computeView(390, 844), { width: 360, height: 779 });
    assert.deepEqual(computeView(768, 1024), { width: 360, height: 560 });
    assert.deepEqual(computeView(300, 1000), { width: 360, height: 820 });
  });
});

describe('가로 레이아웃', () => {
  test('640×360 은 예전과 같다: 전장이 화면 전체, 카메라 그대로, 메뉴 상자도 그대로', () => {
    const l = computeLayout(640, 360, 4);
    assert.equal(l.portrait, false);
    assert.deepEqual(l.cam, { x: 0, y: 0, s: 1 });
    assert.deepEqual(l.field, { x: 0, y: 0, w: 640, h: 360 });
    assert.deepEqual(l.menu, { x: 0, y: 0, w: 640, h: 360 });
  });

  for (const [w, h] of [
    [640, 360],
    [853, 360],
    [640, 480],
    [960, 360],
  ]) {
    test(`${w}×${h}: 판 화면 버튼이 화면 안에 겹치지 않고, 전장·메뉴 상자는 가운데`, () => {
      const l = computeLayout(w, h, 4);
      for (const r of gameRects(l)) assert.ok(within(r, w, h), JSON.stringify(r));
      noOverlap(gameRects(l), `${w}×${h}`);
      assert.equal(l.cam.x, (w - 640) / 2);
      assert.equal(l.cam.y, (h - 360) / 2);
      assert.deepEqual(l.menu, { x: (w - 640) / 2, y: (h - 360) / 2, w: 640, h: 360 });
      // 상점은 화면 아래에 붙는다
      assert.ok(h - (l.cards[0].y + l.cards[0].h) <= 10);
      // 작은 버튼은 오른쪽 위 끝에
      assert.ok(w - (l.mute.x + l.mute.w) <= 8);
    });
  }
});

describe('세로 레이아웃', () => {
  for (const [w, h] of [
    [360, 779],
    [360, 640],
    [360, 560],
    [360, 820],
  ]) {
    test(`${w}×${h}: 위는 전장, 아래는 버튼. 모두 화면 안, 서로 겹치지 않음`, () => {
      const l = computeLayout(w, h, 4);
      assert.equal(l.portrait, true);
      for (const r of gameRects(l)) assert.ok(within(r, w, h), JSON.stringify(r));
      noOverlap(gameRects(l), `${w}×${h}`);
      // 버튼 줄(스킬·상점·면 고르기)은 전장 아래
      const fieldBottom = l.field.y + l.field.h;
      for (const r of [...l.cards, l.reroll, ...l.skills, l.rotateLeft, ...FACES.map((f) => l.facePad[f])]) {
        assert.ok(r.y >= fieldBottom, `전장 아래 ${JSON.stringify(r)}`);
      }
      // 손가락으로 누를 만한 크기
      for (const r of [...l.cards, ...l.skills, ...FACES.map((f) => l.facePad[f])]) assert.ok(r.w >= 28 && r.h >= 28, JSON.stringify(r));
    });
  }

  test('전장은 통째로 줄인 것(0.56배)보다 크게(0.75~0.9배) 보이고, 세로로는 길 끝까지 다 보이며 좌우만 조금 잘린다', () => {
    const l = computeLayout(360, 779, 4);
    assert.ok(l.cam.s >= 0.75 && l.cam.s <= 0.9, `${l.cam.s}`);
    const top = toWorld(l, { x: 0, y: l.field.y + 48 });
    const bottom = toWorld(l, { x: 0, y: l.field.y + l.field.h });
    assert.ok(top.y <= 0 + 1e-6 || l.cam.y <= 48, '북쪽 끝이 보인다');
    assert.ok(bottom.y >= 360 - 1e-6, '남쪽 끝이 보인다');
    const left = toWorld(l, { x: 0, y: 0 });
    const right = toWorld(l, { x: 360, y: 0 });
    assert.ok(left.x > 0 && left.x <= 120, `왼쪽은 조금만 잘린다 ${left.x}`);
    assert.ok(Math.abs(left.x + right.x - 640) < 1e-6, '탑이 가운데');
  });

  test('메뉴 화면 칸들도 360 폭 안에 겹치지 않게 (탑 카드 · 난이도 · 아래 버튼)', () => {
    for (const h of [560, 779]) {
      const l = computeLayout(360, h, 4);
      // 메뉴 상자는 폭 그대로, 긴 화면에서는 세로 가운데
      assert.equal(l.menu.x, 0);
      assert.equal(l.menu.w, 360);
      assert.ok(l.menu.y >= 0 && l.menu.y + l.menu.h <= h);
      assert.ok(Math.abs(l.menu.y - (h - l.menu.h) / 2) < 1);
      const rects = [...l.heroes.map((x) => x.rect), ...l.modes.map((x) => x.rect), ...l.difficulty.map((x) => x.rect), l.storyButton, l.metaButton, l.achButton, l.gear];
      for (const r of rects) assert.ok(within(r, l.menu.w, l.menu.h), JSON.stringify(r));
      noOverlap(rects, `메뉴 ${h}`);
    }
  });

  test('강화 상점 · 업적 · 이야기 책도 360 폭 안에 겹치지 않고, 돌아가기와도 겹치지 않는다', () => {
    for (const h of [560, 820]) {
      const l = computeLayout(360, h, 4);
      for (const group of [
        [...l.metaCards, l.back],
        [...l.achRows, l.back],
        [...l.storyTabs, l.storyText, l.back],
      ]) {
        for (const r of group) assert.ok(within(r, l.menu.w, l.menu.h), JSON.stringify(r));
        noOverlap(group, '목록');
      }
    }
  });

  test('보상 카드 3장 · 이야기 카드 · 튜토리얼 창 · 일시정지 창이 화면 폭 안에 들어간다', () => {
    const l = computeLayout(360, 640, 4);
    for (const r of [...l.perkCards, l.storyCard, l.storyCardSkip, l.lessonPanel, l.lessonNext, l.lessonSkip, l.pausePanel, l.audio.panel]) {
      assert.ok(within(r, 360, 640), JSON.stringify(r));
    }
    noOverlap(l.perkCards, '보상 카드');
  });
});

describe('좌표 바꾸기', () => {
  test('전장 좌표 ↔ 화면 좌표가 서로 되돌아온다 (가로·세로 모두)', () => {
    for (const l of [computeLayout(853, 360, 4), computeLayout(360, 779, 4)]) {
      const w = { x: 123.5, y: 77 };
      const back = toWorld(l, toScreen(l, w));
      assert.ok(Math.abs(back.x - w.x) < 1e-9 && Math.abs(back.y - w.y) < 1e-9);
    }
  });

  test('탑(전장 가운데)은 가로에서는 화면 가운데, 세로에서는 화면 폭 가운데', () => {
    const wide = computeLayout(853, 360, 4);
    assert.equal(toScreen(wide, { x: 320, y: 180 }).x, 853 / 2);
    const tall = computeLayout(360, 779, 4);
    assert.equal(toScreen(tall, { x: 320, y: 180 }).x, 180);
  });

  test('메뉴 좌표는 메뉴 상자 기준', () => {
    const l = computeLayout(853, 480, 4);
    assert.deepEqual(toMenu(l, { x: l.menu.x + 10, y: l.menu.y + 20 }), { x: 10, y: 20 });
  });
});

describe('세로 화면에서 누르기', () => {
  const l = computeLayout(360, 779, 4);

  test('면 고르기 버튼을 누르면 그 면', () => {
    for (const f of FACES) {
      const r = l.facePad[f];
      assert.deepEqual(hitTest(l, r.x + r.w / 2, r.y + r.h / 2), { kind: 'face', face: f });
    }
  });

  test('스킬은 전장 안에만 떨어뜨린다 (위쪽 바·아래 버튼 칸은 아님)', () => {
    assert.equal(aimableAt(l, toScreen(l, { x: 320, y: 120 })), true);
    assert.equal(aimableAt(l, { x: 180, y: 10 }), false, '위쪽 바');
    assert.equal(aimableAt(l, { x: 180, y: l.cards[0].y + 5 }), false, '아래 버튼');
  });
});

describe('가로 화면의 면 고르기 버튼', () => {
  test('왼쪽 아래에 있고 누르면 그 면, 그 자리는 스킬을 떨어뜨리지 않는다', () => {
    const l = computeLayout(640, 360, 4);
    const r = l.facePad.w;
    assert.ok(r.x < 160 && r.y > 200);
    assert.deepEqual(hitTest(l, r.x + 2, r.y + 2), { kind: 'face', face: 'w' });
    assert.equal(aimableAt(l, { x: r.x + 2, y: r.y + 2 }), false);
  });
});
