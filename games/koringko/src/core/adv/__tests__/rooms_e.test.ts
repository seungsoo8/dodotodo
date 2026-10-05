/**
 * 토비의 태엽 속 · 할머니의 재봉 상자 (근접 지도) · 새벽 다락 (1막 다락 배치의 새벽 상태).
 * 막을 처음부터 끝까지 풀어 보는 시험은 acts.test.ts (모든 막) · acts_d.test.ts 에 있다.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Adv, isMemory, NO_INPUT } from '../adv.ts';
import { actOfRoom, CHAPTERS, ROOMS, STORY } from '../story/index.ts';
import { startIn } from './acthelp.ts';
import { px } from '../stage.ts';
import { lookPix } from '../../../ui/render/looks.ts';
import { residentSprite } from '../../../ui/art/houseProps.ts';
import { SB, TK } from '../story/layout_e.ts';
import type { Cmd, Facing } from '../types.ts';

const chapterOf = (room: string) => actOfRoom(room)!;

function flat(cmds: readonly Cmd[]): Cmd[] {
  return cmds.flatMap((c) => (c.t === 'if' ? [c, ...flat(c.then), ...flat(c.else ?? [])] : [c]));
}

/** 그 장을 바로 시작하고 들어오는 대본을 끝까지 */
function start(room: string): Adv {
  return startIn(room, (a) => finish(a));
}

/** 대본 · 놀이가 끝날 때까지 넘기며 나온 대사를 모은다 (작은 놀이는 다 한 것으로, 고르기는 pick 번을 고른다). limit 초: 새벽 장 들어오는 대본(약 3분)이 넉넉히 들어가게 */
function finish(a: Adv, pick = 0, limit = 240): string[] {
  const lines: string[] = [];
  for (let i = 0; i < limit * 60 && (a.runner || a.mini); i++) {
    if (a.mini) a.mini.done = true;
    if (a.stage.choice && a.stage.choice.picked === null) a.stage.choice.sel = pick;
    const d = a.stage.dialog;
    if (d && lines[lines.length - 1] !== d.text) lines.push(d.text);
    a.step(1 / 60, { ...NO_INPUT, act: i % 2 === 0 });
  }
  return lines;
}

/** 그 칸에 서서 그쪽을 보고 (안내 대사는 먼저 넘기고) 누른다 → 대본 끝까지. 누른 것의 id 와 대사 */
function useAt(a: Adv, x: number, y: number, dir: Facing, pick = 0): { id: string | undefined; lines: string[] } {
  a.place(px(x), px(y));
  a.face(dir);
  a.step(1 / 60, NO_INPUT);
  finish(a);
  a.face(dir);
  a.step(1 / 60, NO_INPUT);
  const id = a.prompt?.id;
  a.step(1 / 60, { ...NO_INPUT, act: true });
  return { id, lines: finish(a, pick) };
}

// ───────────────────────── 17장 · 토비의 태엽 속 ─────────────────────────

describe('토비의 태엽 속 (9막 · 근접 · 환상 지도)', () => {
  const room = ROOMS.tobykey();

  test('장난감 크기 근접 지도: 천 안감 뒷벽 · 열쇠 구멍 · 황동 톱니 · 태엽 스프링 · 가운데 낭떠러지, 주민 큰톱니 · 작은톱니', () => {
    assert.equal(room.scale, 'toy');
    assert.equal(room.w, 32);
    assert.equal(room.h, 20);
    const kinds = new Set((room.furniture ?? []).map((f) => f.kind.split(':')[0]));
    for (const k of ['clothWall', 'brassGear', 'mainspring', 'keyGiant', 'cotton', 'screwBig', 'pawl', 'counter', 'echo', 'oilDrop', 'rustPatch']) assert.ok(kinds.has(k), `소품 ${k}`);
    assert.ok((room.furniture ?? []).some((f) => f.kind === 'clothWall:keyhole'), '열쇠 구멍');
    assert.equal(room.tiles[TK.bridge[0][1]][TK.bridge[0][0]], 'v', '다리 자리는 처음엔 낭떠러지');
    assert.deepEqual(room.things.filter((t) => t.kind === 'npc').map((t) => t.kind === 'npc' && t.actor).sort(), ['gearBig', 'gearSmall']);
    for (const k of ['gearBig', 'gearSmall']) for (const f of [0, 1]) assert.ok(residentSprite(k, 'down', f)!.count() > 80, `${k} 그림`);
    // 소리: 태엽 속이라 째깍 소리
    assert.ok(room.amb?.some((x) => x.name === 'clockTick'));
  });

  test('기억 여섯은 그 장소의 물건이고 (서로 다른 그림 · 그려진다), 메아리 넷 · 태엽 감기 뒤에 드러난다', () => {
    const mems = room.things.filter(isMemory);
    assert.equal(mems.length, 6);
    const looks = Object.fromEntries(mems.map((m) => [m.id, m.kind === 'keepsake' ? m.look : 'orb']));
    assert.deepEqual(looks, { mTa: 'stitchPatch', mTb: 'echo:5,lit', mTc: 'lint', mTd: 'tape', mTe: 'echo:note,lit', mTf: 'keyAxle' });
    for (const l of Object.values(looks)) assert.ok((lookPix(l)?.count() ?? 0) >= 20, `${l} 그림`);
    const when = Object.fromEntries(mems.map((m) => [m.id, m.when]));
    assert.deepEqual(when, { mTa: undefined, mTb: 'echo_5', mTc: 'echo_12', mTd: 'echo_13', mTe: 'echo_14', mTf: 'tb_wound' });
  });

});

// ───────────────────────── 20장 · 할머니의 재봉 상자 ─────────────────────────

describe('할머니의 재봉 상자 (10막 · 근접 지도)', () => {
  const room = ROOMS.sewbox();

  test('장난감 크기 근접 지도: 누빈 안감 뒷벽 · 나무 칸막이 네 칸 · 실패 · 바늘꽂이 · 단추 산 · 노란 실, 주민 골무 아재', () => {
    assert.equal(room.scale, 'toy');
    assert.equal(room.w, 36);
    assert.equal(room.h, 22);
    const kinds = new Set((room.furniture ?? []).map((f) => f.kind.split(':')[0]));
    for (const k of ['quiltWall', 'spoolBig', 'pincushion', 'buttonHill', 'bigButton', 'yarnLine', 'yarnKnot', 'scissorsBig', 'thimbleCup', 'fabricHill']) assert.ok(kinds.has(k), `소품 ${k}`);
    // 칸막이: 가로 · 세로 나무 칸, 문 둘과 바닥 틈 하나
    assert.equal(room.tiles[11][3], 'K');
    assert.equal(room.tiles[15][17], 'K');
    assert.equal(room.tiles[SB.doorDown[1]][SB.doorDown[0]], 'a');
    assert.equal(room.tiles[SB.doorRight[1]][SB.doorRight[0]], 'a');
    assert.equal(room.tiles[SB.crack[1]][SB.crack[0]], 'v');
    assert.deepEqual(room.things.filter((t) => t.kind === 'npc').map((t) => t.kind === 'npc' && t.actor).sort(), ['grandoll', 'thimbleMan']);
    assert.ok(residentSprite('thimbleMan', 'down', 0)!.count() > 80);
    // 바늘 칸만 깜깜하다 (나비 등불)
    assert.deepEqual(room.lantern?.zones, [SB.needleRoom]);
  });

  test('기억 일곱은 그 장소의 물건이고, 찬장에서 들어서면 진찰실부터 매듭 · 눈 단추 · 마지막 땀으로 드러난다', () => {
    const mems = room.things.filter(isMemory);
    assert.equal(mems.length, 7);
    const looks = Object.fromEntries(mems.map((m) => [m.id, m.kind === 'keepsake' ? m.look : 'orb']));
    assert.deepEqual(looks, { mGa: 'clinicCard', mGb: 'medPouch', mGc: 'button', mGd: 'crumpledLetters', mGe: 'whiteScrap', mGf: 'tapeMeasure', mGg: 'yarn' });
    for (const l of Object.values(looks)) assert.ok((lookPix(l)?.count() ?? 0) >= 20, `${l} 그림`);
    const when = Object.fromEntries(mems.map((m) => [m.id, m.when]));
    assert.deepEqual(when, { mGa: 'door_d_cup_sew', mGb: 'knot1', mGc: 'doll_eyes', mGd: 'knot2', mGe: 'knot4', mGf: 'knot3', mGg: 'sewn' });
    assert.equal(mems.find((m) => m.id === 'mGe')!.dark, true, '바늘 칸의 천 조각은 등불 안에서만');
  });

  test('마지막 땀은 눈 단추를 맞추기 전엔 놓을 수 없다 (인형이 먼저 눈을 부탁한다)', () => {
    const a = start('sewbox');
    for (let i = 1; i <= 5; i++) a.flags[`knot${i}`] = true;
    a.flags.gap_gG = true;
    const r = useAt(a, SB.sew[0], SB.sew[1] + 1, 'up');
    assert.equal(r.id, 'lastStitch');
    assert.equal(a.flags.sewn, undefined);
    assert.ok(r.lines.some((l) => /눈 단추/.test(l)), r.lines.join(' / '));
  });
});

// ───────────────────────── 마지막 장 · 새벽 ─────────────────────────

describe('마지막 장 새벽: 1장 다락 배치의 새벽 상태', () => {
  const dawn = ROOMS.attic_dawn();
  const night = ROOMS.attic();

  test('같은 다락 (크기 · 벽 · 소품 자리 그대로), 장난감이 걷는 사람 크기 방', () => {
    assert.equal(dawn.scale, 'human');
    assert.equal(dawn.toys, true);
    assert.equal(dawn.w, night.w);
    assert.equal(dawn.h, night.h);
    const key = (f: { kind: string; x: number; y: number }) => `${f.kind.split(':')[0]}@${f.x},${f.y}`;
    const nightKeys = new Set((night.furniture ?? []).map(key));
    for (const k of ['atticWall@13,0', 'cuckoo@22,1', 'beam@3,6', 'sewbox@11,13', 'railing@3,15']) {
      assert.ok(nightKeys.has(k), `밤 ${k}`);
      assert.ok((dawn.furniture ?? []).some((f) => key(f) === k), `새벽 ${k}`);
    }
    // 벽 · 바닥 줄은 뚜껑문 자리 말고 같다
    for (let y = 0; y < 3; y++) assert.equal(dawn.tiles[y], night.tiles[y]);
  });

  test('새벽 상태: 둥근 창은 새벽 하늘, 뚜껑문은 열려 있고, 재봉 상자 틈엔 바늘, 빛은 분홍', () => {
    const kinds = (dawn.furniture ?? []).map((f) => f.kind);
    assert.ok(kinds.includes('dawnPane'));
    assert.ok(kinds.includes('trapdoor:open'));
    assert.ok(kinds.includes('sewbox:needle'));
    assert.ok(!(night.furniture ?? []).some((f) => f.kind === 'dawnPane'));
    const pink = (dawn.lights ?? []).some((l) => l.color[0] > l.color[2] && l.color[0] - l.color[1] >= 40);
    assert.ok(pink, '분홍 빛');
    assert.equal(chapterOf('attic_dawn').clock, '05:00');
  });

  test('장 시작 자리 · 태엽 할머니 · 걸어올 자리는 걸을 수 있고 서로 이웃, 들어오는 대본은 끝까지 돌아 에필로그로', () => {
    const CH = chapterOf('attic_dawn');
    const a = start('attic_dawn');
    // (대본이 다 돌면 에필로그로 넘어간다)
    assert.equal(a.save.chapter, CHAPTERS[CHAPTERS.indexOf(CH) + 1].n);
    const b = new Adv(STORY);
    b.runner = null;
    (b as unknown as { queue: unknown[] }).queue = [];
    (b as unknown as { applyChapter(n: number): void }).applyChapter(CH.n);
    assert.equal(b.room.id, 'attic_dawn');
    assert.equal(b.solid(CH.start[0], CH.start[1]), false);
    const doll = dawn.things.find((t) => t.id === 'doll');
    assert.ok(doll && doll.kind === 'npc');
    assert.equal(b.solid(doll.at[0], doll.at[1]), false);
    const walk = flat(CH.intro).find((c) => c.t === 'walk' && c.who === 'doll');
    assert.ok(walk && walk.t === 'walk');
    assert.equal(b.solid(walk.to[0], walk.to[1]), false);
    assert.equal(Math.abs(walk.to[0] - CH.start[0]) + Math.abs(walk.to[1] - CH.start[1]), 1, '태엽 할머니는 토비 바로 곁으로 걸어온다');
  });
});
