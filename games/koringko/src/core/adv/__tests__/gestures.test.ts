import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Adv, NO_INPUT, type AdvData } from '../adv.ts';
import { interactGesture } from '../gestures.ts';
import { Builder } from '../../maps.ts';
import { px } from '../stage.ts';
import type { HeroId } from '../../types.ts';
import type { Cmd, Facing, RoomDef, Thing } from '../types.ts';

/** 시험용 장난감 방 14×9 (가장자리 벽) */
function room(id: string, things: Thing[], extra: Partial<RoomDef> = {}): RoomDef {
  const b = new Builder(14, 9, 'w', 1);
  b.rect(0, 0, 14, 1, 'Q');
  b.rect(0, 8, 14, 1, 'Q');
  b.rect(0, 0, 1, 9, 'Q');
  b.rect(13, 0, 1, 9, 'Q');
  return { id, name: id, theme: 'toybox', w: 14, h: 9, tiles: b.rows(), structures: [], warps: [], npcs: [], spawns: [], start: { x: 2, y: 4 }, safe: true, dark: false, level: '', scale: 'toy', things, ...extra };
}
function data(things: Thing[], party: HeroId[] = ['toby', 'bori', 'ruru', 'nabi']): AdvData {
  return {
    rooms: { r1: () => room('r1', things), mem: () => ({ ...room('mem', things), scale: 'human' }) },
    chapters: [{ n: 1, title: '1장', sub: '', room: 'r1', start: [2, 4], party, wind: 1, intro: [] }],
  };
}
const say = (who: string, text: string): Cmd => ({ t: 'say', who, text });

/** 그 칸에 서서 그쪽을 보고 누른 바로 뒤 (대본 첫머리) */
function pressAt(a: Adv, x: number, y: number, dir: Facing): void {
  a.place(px(x), px(y));
  a.face(dir);
  a.step(1 / 60, NO_INPUT);
  a.step(1 / 60, { ...NO_INPUT, act: true });
}
function finish(a: Adv): void {
  for (let i = 0; i < 3600 && (a.runner || a.mini); i++) a.step(1 / 60, { ...NO_INPUT, act: i % 2 === 0 });
}
/** 대본이 끝날 때까지 그 인물이 한 몸짓 이름들 */
function actsDuring(a: Adv, who: string): string[] {
  const seen: string[] = [];
  for (let i = 0; i < 3600 && (a.runner || a.mini); i++) {
    const act = a.stage.actors[who]?.act ? a.stage.actors[who].pose : null;
    if (act && seen[seen.length - 1] !== act) seen.push(act);
    a.step(1 / 60, { ...NO_INPUT, act: i % 2 === 0 });
  }
  return seen;
}

describe('상호작용 몸짓: 무엇을 하든 인물이 몸으로 반응한다', () => {
  test('종류마다 어울리는 몸짓 (살펴보기 · 줍기 · 말 걸기 · 태엽 · 기억 · 기억의 문 · 실)', () => {
    assert.equal(interactGesture({ kind: 'spot', id: 's', at: [1, 1], scene: [] }), 'peek');
    assert.equal(interactGesture({ kind: 'star', id: 's', at: [1, 1], text: '별' }), 'bow');
    assert.equal(interactGesture({ kind: 'npc', id: 'n', at: [1, 1], actor: 'tin', scene: [] }), 'nod');
    assert.equal(interactGesture({ kind: 'npc', id: 'pal_bori', at: [1, 1], actor: 'bori', scene: [], pal: 'bori' }), 'pat');
    assert.equal(interactGesture({ kind: 'windup', id: 'w', at: [1, 1], cost: 0.1, scene: [] }), 'stretch');
    assert.equal(interactGesture({ kind: 'keepsake', id: 'k', at: [1, 1], look: 'frame', name: '사진', scene: [] }), 'peek');
    assert.equal(interactGesture({ kind: 'link', id: 'l', at: [1, 1], name: '문', icon: 'star', locked: [], scene: [] }), 'think');
    assert.equal(interactGesture({ kind: 'thread', id: 't', at: [1, 1], text: [] }), 'bow');
  });

  test('살펴보기를 누르면 토비가 들여다보는 몸짓을 하며 (기다리지 않고) 첫 대사가 함께 뜬다', () => {
    const a = new Adv(data([{ kind: 'spot', id: 'jar', at: [4, 4], scene: [say('toby', '종이별 병이다')] }]));
    finish(a);
    pressAt(a, 3, 4, 'right');
    assert.equal(a.stage.actors.toby.pose, 'peek');
    assert.ok(a.stage.actors.toby.act, '한 번 하는 몸짓 중');
    assert.equal(a.stage.dialog?.text, '종이별 병이다', '누르는 즉시 대사 (몸짓 때문에 늦어지지 않는다)');
    finish(a);
    for (let i = 0; i < 60; i++) a.step(1 / 60, NO_INPUT);
    assert.equal(a.stage.actors.toby.act, undefined, '몸짓이 끝나면 원래 자세로');
    assert.equal(a.stage.actors.toby.pose, 'idle');
  });

  test('대본이 이미 몸짓으로 시작하면 덧붙이지 않는다 (같은 몸짓 두 번 금지)', () => {
    const a = new Adv(data([{ kind: 'spot', id: 'jar', at: [4, 4], scene: [{ t: 'act', who: 'toby', name: 'jump' }, say('toby', '와!')] }]));
    finish(a);
    pressAt(a, 3, 4, 'right');
    assert.deepEqual(actsDuring(a, 'toby'), ['jump']);
  });

  test('종이별을 주우면 숙이고, 동료에게 말을 걸면 손을 흔든다', () => {
    const a = new Adv(data([{ kind: 'star', id: 'st', at: [4, 4], text: '별' }]));
    finish(a);
    pressAt(a, 3, 4, 'right');
    assert.ok(actsDuring(a, 'toby').includes('bow'));
    for (let i = 0; i < 60 * 8; i++) a.step(1 / 60, NO_INPUT);
    const q = a.stage.actors.bori;
    const [bx, by] = [Math.floor(q.x / 24), Math.floor(q.y / 24)];
    const side = ([[-1, 0, 'right'], [1, 0, 'left'], [0, 1, 'up'], [0, -1, 'down']] as const).find(([dx, dy]) => !a.solid(bx + dx, by + dy))!;
    pressAt(a, bx + side[0], by + side[1], side[2]);
    assert.equal(a.prompt, null);
    assert.ok(actsDuring(a, 'toby').includes('pat'));
  });

  test('밀기: 토비는 가리키고 보리는 힘을 준다 / 못 밀 때는 토비가 낑낑댄다', () => {
    const things: Thing[] = [{ kind: 'push', id: 'box', at: [4, 4], look: 'boxes' }];
    const a = new Adv(data(things));
    finish(a);
    pressAt(a, 3, 4, 'right');
    assert.ok(actsDuring(a, 'toby').includes('tremble'), '보리 없이 혼자 밀어 본다');
    a.call('bori', true);
    pressAt(a, 3, 4, 'right');
    const tAct = a.stage.actors.toby.pose;
    const bori = actsDuring(a, 'bori');
    assert.equal(tAct, 'point');
    assert.ok(bori.includes('stomp'), `보리 몸짓 ${bori}`);
    assert.deepEqual(a.blockAt('box'), [5, 4]);
  });

  test('오르기: 오른 자리에서 토비가 폴짝 내려선다', () => {
    const a = new Adv(data([{ kind: 'climb', id: 'up', at: [4, 4], to: [4, 2] }]));
    finish(a);
    pressAt(a, 4, 5, 'up');
    assert.equal(Math.floor(a.stage.actors.toby.y / 24), 2);
    assert.ok(actsDuring(a, 'toby').includes('hop'));
  });

  test('발판 순서: 맞게 밟으면 폴짝, 틀리면 움찔', () => {
    const a = new Adv(data([{ kind: 'seq', id: 'code', keys: [{ at: [4, 4], look: 'n1' }, { at: [6, 4], look: 'n2' }], order: [0, 1], flag: 'ok' }]));
    finish(a);
    a.place(px(4), px(4));
    a.step(1 / 60, NO_INPUT);
    assert.equal(a.stage.actors.toby.pose, 'hop');
    a.place(px(5), px(6));
    for (let i = 0; i < 60; i++) a.step(1 / 60, NO_INPUT);
    a.place(px(4), px(4));
    a.step(1 / 60, NO_INPUT);
    assert.equal(a.stage.actors.toby.pose, 'shiver', '처음 것을 또 밟으면 틀림');
  });

  test('기억 속 하루(사람)를 조종할 때도 살펴보면 몸짓을 한다', () => {
    const d = data([]);
    d.rooms.mem = () => ({ ...room('mem', [{ kind: 'spot', id: 'desk', at: [5, 4], scene: [say('haru', '숙제…')] }]), scale: 'human' });
    const a = new Adv(d);
    finish(a);
    a.run([{ t: 'room', id: 'mem', at: [4, 4] }, { t: 'show', who: 'haru', kind: 'haru10', at: [4, 4] }, { t: 'control', who: 'haru' }]);
    finish(a);
    pressAt(a, 4, 4, 'right');
    assert.equal(a.stage.actors.haru.pose, 'peek');
  });
});
