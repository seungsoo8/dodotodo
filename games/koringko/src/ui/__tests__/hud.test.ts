/**
 * 탐험 HUD (E13 · A6): 왼쪽 위 목표 한 줄만. 기억 수는 앨범에서만, 태엽 게이지는 0.3 아래일 때만.
 * 진짜 Ui · 진짜 Adv 로 그리고, 붓(ctx)은 쓴 글자 · 동그라미만 기록한다.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Adv, type AdvData } from '../../core/adv/adv.ts';
import { Builder } from '../../core/maps.ts';
import type { RoomDef, Thing } from '../../core/adv/types.ts';
import { Ui } from '../kit.ts';
import { drawOverlay } from '../adv/overlay.ts';

function room(things: Thing[]): RoomDef {
  const b = new Builder(12, 8, 'w', 1);
  b.rect(0, 0, 12, 1, 'Q');
  b.rect(0, 7, 12, 1, 'Q');
  return { id: 'r1', name: 'r1', theme: 'toybox', w: 12, h: 8, tiles: b.rows(), structures: [], warps: [], npcs: [], spawns: [], start: { x: 2, y: 3 }, safe: true, dark: false, level: '', scale: 'toy', things };
}

const mem = (id: string, x: number): Thing => ({ kind: 'memory', id, at: [x, 5], name: id, scene: [] });

function game(): Adv {
  const data: AdvData = {
    rooms: { r1: () => room([mem('m1', 3), mem('m2', 5), mem('m3', 7)]) },
    chapters: [{ n: 1, title: '1장', sub: '', room: 'r1', start: [2, 3], party: ['toby'], wind: 0.7, intro: [] }],
  };
  const a = new Adv(data);
  a.runner = null;
  a.queue = [];
  a.save.flags.mem_m2 = true;
  return a;
}

/** 글자 · 동그라미 · 사각형을 기록하는 붓 */
function recorder() {
  const texts: string[] = [];
  let arcs = 0;
  const bars: number[][] = [];
  const ctx = {
    font: '',
    textAlign: 'left',
    textBaseline: 'top',
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    lineWidth: 1,
    lineJoin: 'round',
    fillText: (s: string) => texts.push(s),
    strokeText: () => {},
    measureText: (s: string) => ({ width: s.length * 6 }),
    fillRect: (x: number, y: number, w: number, h: number) => bars.push([x, y, w, h]),
    beginPath: () => {},
    arc: () => {
      arcs++;
    },
    fill: () => {},
    save: () => {},
    restore: () => {},
    rect: () => {},
    clip: () => {},
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, texts, arcs: () => arcs };
}

const frame = { cam: { x: 0, y: 0 }, bubbles: [], marker: null, heads: {} };
const ctl = { act: () => {}, dir: () => {}, pick: () => {} };

function draw(a: Adv, time: number) {
  const rec = recorder();
  const ui = new Ui();
  ui.begin(rec.ctx, 480, 270, time);
  drawOverlay(ui, a, frame, time, false, ctl);
  return rec;
}

describe('HUD: 목표 한 줄만 (기억 수는 앨범에서만, A6)', () => {
  test('목표 문구를 그리고, 「기억 n / m」 · 기억 점(동그라미)은 그리지 않는다', () => {
    const a = game();
    a.stage.goal = '다락 창가의 상자를 열어 보자';
    draw(a, 10);
    const rec = draw(a, 11);
    assert.ok(rec.texts.includes('다락 창가의 상자를 열어 보자'), `그린 글자: ${rec.texts.join(' | ')}`);
    assert.ok(!rec.texts.some((t) => /^기억\s*\d/.test(t)), `기억 n / m 이 남았다: ${rec.texts.join(' | ')}`);
    assert.equal(rec.arcs(), 0, '기억 점(동그라미)을 그렸다');
  });

  test('태엽이 넉넉하면(0.3 이상) 게이지를 숨기고, 0.3 아래로 떨어지면 보인다', () => {
    const a = game();
    a.stage.goal = null;
    a.save.wind = 0.3;
    assert.ok(!draw(a, 5).texts.includes('태엽'), '넉넉한데 태엽 게이지를 그렸다');
    a.save.wind = 0.29;
    assert.ok(draw(a, 6).texts.includes('태엽'), '모자란데 태엽 게이지가 없다');
  });

  test('기억을 다 모으기 전에는 목표 문구를 그대로 둔다 (숙제 목록처럼 수를 붙이지 않는다)', () => {
    const a = game();
    a.stage.goal = '기억 조각을 찾자';
    const rec = draw(a, 7);
    assert.ok(rec.texts.includes('기억 조각을 찾자'));
    assert.ok(!rec.texts.some((t) => /\d\s*\/\s*\d/.test(t)), rec.texts.join(' | '));
  });

  test('목표가 바뀌면 0.6초 동안 펼쳐진다: 바뀐 직후에는 글자 띠가 다 펼쳐지지 않았다', async () => {
    const { goalReveal } = await import('../adv/overlay.ts');
    const a = game();
    a.stage.goal = '첫 목표';
    draw(a, 20);
    a.stage.goal = '두 번째 목표';
    draw(a, 30);
    assert.ok(goalReveal(30.1) < 0.5, `0.1초 뒤 ${goalReveal(30.1)}`);
    assert.ok(goalReveal(30.3) > goalReveal(30.1));
    assert.equal(goalReveal(30.7), 1);
  });
});
