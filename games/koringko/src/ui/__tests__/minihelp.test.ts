/**
 * 작은 놀이 안내 글: 휴대폰(touch)에서는 「방향키 / Z」 대신 누르기 안내, 키보드에서는 방향키 · Z.
 * 진짜 Ui · 진짜 Adv · 진짜 놀이로 그리고, 붓(ctx)은 쓴 글자만 기록한다.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Adv, type AdvData } from '../../core/adv/adv.ts';
import { ASSIST, makeMini, PUZZLE_KINDS, puzzleId, type MemoryPuzzle } from '../../core/adv/mini.ts';
import { Builder } from '../../core/maps.ts';
import type { RoomDef } from '../../core/adv/types.ts';
import { Ui } from '../kit.ts';
import { drawOverlay, puzzleHelp } from '../adv/overlay.ts';

// 물건 그림(pixCanvas)이 쓰는 캔버스만 흉내 낸다
(globalThis as { document?: unknown }).document ??= {
  createElement: () => ({
    width: 0,
    height: 0,
    getContext: () => ({ createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData: () => {} }),
  }),
};

function room(): RoomDef {
  const b = new Builder(12, 8, 'w', 1);
  b.rect(0, 0, 12, 1, 'Q');
  b.rect(0, 7, 12, 1, 'Q');
  return { id: 'r1', name: 'r1', theme: 'toybox', w: 12, h: 8, tiles: b.rows(), structures: [], warps: [], npcs: [], spawns: [], start: { x: 2, y: 3 }, safe: true, dark: false, level: '', scale: 'toy', things: [] };
}

function game(): Adv {
  const data: AdvData = {
    rooms: { r1: () => room() },
    chapters: [{ n: 1, title: '1장', sub: '', room: 'r1', start: [2, 3], party: ['toby'], wind: 0.7, intro: [] }],
  };
  const a = new Adv(data);
  a.runner = null;
  a.queue = [];
  return a;
}

function draw(a: Adv, touch: boolean): string[] {
  const texts: string[] = [];
  const noop = () => {};
  const ctx = {
    font: '',
    textAlign: 'left',
    textBaseline: 'top',
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    lineWidth: 1,
    lineJoin: 'round',
    imageSmoothingEnabled: false,
    fillText: (s: string) => texts.push(s),
    strokeText: noop,
    measureText: (s: string) => ({ width: s.length * 6 }),
    fillRect: noop,
    strokeRect: noop,
    drawImage: noop,
    translate: noop,
    rotate: noop,
    beginPath: noop,
    arc: noop,
    fill: noop,
    save: noop,
    restore: noop,
    rect: noop,
    clip: noop,
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }),
  };
  const ui = new Ui();
  ui.begin(ctx as unknown as CanvasRenderingContext2D, 480, 270, 1);
  drawOverlay(ui, a, { cam: { x: 0, y: 0 }, bubbles: [], marker: null, heads: {} } as never, 1, touch, { act: noop, dir: noop, pick: noop });
  return texts;
}

const KEYS = /방향키|←→|\bZ\b/;

describe('작은 놀이 안내: 휴대폰과 키보드', () => {
  for (const id of [...PUZZLE_KINDS.map((k) => puzzleId(k, 1)), 'stars']) {
    test(`${id}: 휴대폰에서는 방향키 · Z 를 말하지 않고, 키보드에서는 말한다`, () => {
      const a = game();
      a.mini = makeMini(id);
      const t = draw(a, true);
      assert.ok(t.length > 0);
      assert.ok(!t.some((s) => KEYS.test(s)), `휴대폰 안내에 키 이름: ${t.join(' | ')}`);
      assert.ok(t.some((s) => s.includes('눌러')), `누르기 안내가 없다: ${t.join(' | ')}`);
      const k = draw(a, false);
      assert.ok(k.some((s) => KEYS.test(s)), `키보드 안내가 없다: ${k.join(' | ')}`);
    });
  }

  test('건너뛸 수 있게 되면 휴대폰은 「건너뛰기」 단추, 키보드는 「Z 꾹」 안내 (그 전에는 없다)', () => {
    const a = game();
    const m = makeMini('order2') as MemoryPuzzle;
    a.mini = m;
    assert.ok(!draw(a, true).includes('건너뛰기'));
    m.fails = ASSIST.skip;
    assert.ok(draw(a, true).includes('건너뛰기'));
    assert.ok(draw(a, false).some((s) => s.startsWith('Z 꾹')));
  });

  test('안내 글 함수: 네 놀이 모두 휴대폰 · 키보드 문구가 다르다', () => {
    for (const k of PUZZLE_KINDS) assert.notEqual(puzzleHelp(k, true), puzzleHelp(k, false), k);
  });
});
