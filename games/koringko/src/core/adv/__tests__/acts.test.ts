/**
 * 막(幕) 구조 엔진 (ACTS.md D-1 · D-2 · D-7 acts.test): 막 안의 방을 잇는 문(door) · 방 preset 깃발 · 동료가 늘 따라다니는 막 ·
 * 기억 사슬(다음 물건으로 카메라 + bridge 지문) · 방 시각 · 옛 저장을 막으로 옮기기 · 옛 기억의 문 @next 를 막의 다음 방으로.
 * 엔진 동작은 작은 시험용 막으로, 이야기 자료의 규칙은 실제 STORY 로 본다.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Adv, doneFlag, isMemory, NO_INPUT, SAVE_VER, type AdvData, type AdvSave } from '../adv.ts';
import { Builder, isSolidChar, TILE } from '../../maps.ts';
import { px } from '../stage.ts';
import { Runner } from '../script.ts';
import { simpleHost } from './host.ts';
import { CHAPTERS, ROOMS, STORY } from '../story/index.ts';
import type { ActRoom, Chapter, Cmd, RoomDef, Thing } from '../types.ts';

// ───────────────────────── 시험용 막: 방 둘 (r1 → r2), 문 하나씩, 사슬 다섯 단계 ─────────────────────────

/** 시험용 장난감 방 20×12 (가장자리 벽) */
function room(id: string, things: Thing[]): RoomDef {
  const b = new Builder(20, 12, 'w', 1);
  b.rect(0, 0, 20, 1, 'Q');
  b.rect(0, 11, 20, 1, 'Q');
  b.rect(0, 0, 1, 12, 'Q');
  b.rect(19, 0, 1, 12, 'Q');
  return { id, name: id, theme: 'toybox', w: 20, h: 12, tiles: b.rows(), structures: [], warps: [], npcs: [], spawns: [], start: { x: 2, y: 5 }, safe: true, dark: false, level: '', scale: 'toy', things };
}

const say = (who: string, text: string): Cmd => ({ t: 'say', who, text });
const memScene = (text: string): Cmd[] => [{ t: 'room', id: 'mem', at: [3, 3] }, say('', text)];

interface Opt {
  /** 사슬 둘째 단계(sA)의 when (기본: 앞 단계 끝 깃발 mem_mA1) */
  sAwhen?: string;
  follow?: boolean;
  party?: Chapter['party'];
  /** r1 에 옛 기억의 문 (@next) 을 둔다 */
  oldLink?: boolean;
}

function world(o: Opt = {}): AdvData {
  const r1: Thing[] = [
    { kind: 'memory', id: 'mA1', at: [5, 3], name: 'A1', caption: 'A1', scene: memScene('옛날 A1') },
    { kind: 'spot', id: 'sA', at: [7, 3], scene: [say('bori', '살펴본 A')], when: o.sAwhen ?? 'mem_mA1' },
    { kind: 'door', id: 'dAB', at: [17, 5], rect: [17, 5, 1, 2], to: 'r2', arrive: [3, 5], dir: 'right', when: 'seen_sA', locked: [say('toby', '아직이야')], first: [say('', '떠나기 전 장면')] },
    { kind: 'door', id: 'dKey', at: [12, 9], to: 'r2', arrive: [5, 8], name: '열쇠 구멍으로' },
    ...(o.oldLink ? [{ kind: 'link', id: 'lOld', at: [10, 2], name: '옛 문', icon: 'key', scene: [{ t: 'next' }], locked: [] } as Thing] : []),
  ];
  const r2: Thing[] = [
    { kind: 'memory', id: 'mB1', at: [6, 3], name: 'B1', caption: 'B1', scene: memScene('옛날 B1'), when: 'door_dAB' },
    { kind: 'trigger', id: 'tB', rect: [10, 8, 2, 1], scene: [say('', '밟았다')], when: 'mem_mB1' },
    { kind: 'door', id: 'dBA', at: [1, 5], rect: [1, 5, 1, 2], to: 'r1', arrive: [16, 5], dir: 'left' },
    { kind: 'link', id: 'lB', at: [15, 2], name: '끝 문', icon: 'key', scene: [{ t: 'next' }], locked: [] },
  ];
  const rooms: ActRoom[] = [
    { id: 'r1', name: '첫 방', clock: '23:10' },
    { id: 'r2', name: '둘째 방', clock: '23:25', preset: ['bridge_ok'], enter: [say('', '들어선 장면')], start: [3, 7] },
  ];
  return {
    rooms: { r1: () => room('r1', r1), r2: () => room('r2', r2), r3: () => room('r3', []), mem: () => ({ ...room('mem', []), scale: 'human' }) },
    chapters: [
      {
        n: 1,
        title: '1막 · 시험',
        sub: '시험',
        room: 'r1',
        start: [2, 5],
        party: o.party ?? ['toby', 'bori', 'ruru', 'nabi'],
        wind: 1,
        intro: [say('toby', '가자')],
        clock: '23:10',
        rooms,
        ...(o.follow === false ? {} : { follow: true }),
        chain: [{ id: 'mA1', bridge: 'A 다음 줄' }, { id: 'sA', bridge: '문 쪽 줄' }, { id: 'dAB' }, { id: 'mB1', gate: 'door_dAB', bridge: 'B 다음 줄' }, { id: 'tB' }],
      },
      { n: 2, title: '2막 · 다음', sub: '', room: 'r3', start: [2, 5], party: ['toby'], wind: 1, intro: [say('toby', '다음 막')] },
    ],
  };
}

/** 대본이 끝날 때까지 넘기며, 나온 대사와 그 대사가 떠 있을 때의 카메라를 적는다 */
function finish(a: Adv, log: { text: string; cam: { x: number; y: number } | string | null }[] = []): typeof log {
  for (let i = 0; i < 60 * 120 && (a.runner || a.mini); i++) {
    if (a.mini) a.mini.done = true;
    const d = a.stage.dialog;
    if (d && log.at(-1)?.text !== d.text) log.push({ text: d.text, cam: a.stage.cam });
    a.step(1 / 60, { ...NO_INPUT, act: i % 2 === 0 });
  }
  assert.equal(a.runner, null, '대본이 끝나지 않는다');
  return log;
}
const texts = (log: { text: string }[]) => log.map((l) => l.text);
const cellOf = (a: Adv): [number, number] => [Math.floor(a.stage.actors.toby.x / TILE), Math.floor(a.stage.actors.toby.y / TILE)];

/** 막을 시작하고 도입을 끝까지 */
function begin(o: Opt = {}): Adv {
  const a = new Adv(world(o));
  finish(a);
  return a;
}

/** 그 칸에 세우고 한 틱 (밟으면 터지는 것은 대본이 뜬다) */
function stepOn(a: Adv, x: number, y: number): void {
  a.place(px(x), px(y));
  a.step(1 / 60, NO_INPUT);
}

const interact = (a: Adv, id: string) => {
  const t = a.things().find((x) => x.id === id);
  assert.ok(t, `${id} 이 보이지 않는다`);
  (a as unknown as { interact(t: Thing): void }).interact(t);
};

// ───────────────────────── 1. 문 ─────────────────────────

describe('문(door): 막 안의 방을 걸어서 잇는다', () => {
  test('잠긴 문(when 이 서기 전): 들어서면 locked 를 한 번 말하고 방은 그대로, 안에 서 있어도 다시 말하지 않고, 나갔다 들어오면 또 말한다', () => {
    const a = begin();
    stepOn(a, 15, 5);
    assert.equal(a.runner, null, '문 밖에서는 아무 일 없다');
    stepOn(a, 17, 5);
    assert.deepEqual(texts(finish(a)), ['아직이야']);
    assert.equal(a.room.id, 'r1');
    assert.equal(a.flags.door_dAB, undefined);
    for (let i = 0; i < 30; i++) a.step(1 / 60, NO_INPUT);
    stepOn(a, 17, 6);
    assert.equal(a.runner, null, '같은 문 안에서 칸만 옮겨도 다시 말하지 않는다');
    stepOn(a, 15, 5);
    stepOn(a, 17, 5);
    assert.deepEqual(texts(finish(a)), ['아직이야'], '나갔다 다시 들어오면 또');
  });

  test('열린 문을 처음 지나면 떠나기 전 장면 → 다른 방의 도착 칸 → 들어선 장면 (door_ · enter_ 깃발), 두 번째부터는 바로 지나간다', () => {
    const a = begin();
    a.flags.seen_sA = true;
    stepOn(a, 17, 5);
    const first = texts(finish(a));
    assert.ok(first.indexOf('떠나기 전 장면') >= 0 && first.indexOf('떠나기 전 장면') < first.indexOf('들어선 장면'), first.join(' / '));
    assert.equal(a.room.id, 'r2');
    assert.deepEqual(cellOf(a), [3, 5]);
    assert.equal(a.stage.actors.toby.dir, 'right');
    assert.equal(a.flags.door_dAB, true);
    assert.equal(a.flags.enter_r2, true);
    // 되돌아가는 문 (first · when 없음): 도착 칸에 바로
    stepOn(a, 1, 5);
    assert.deepEqual(texts(finish(a)), []);
    assert.equal(a.room.id, 'r1');
    assert.deepEqual(cellOf(a), [16, 5]);
    // 다시 지나면 떠나기 전 장면 · 들어선 장면 없이
    stepOn(a, 17, 5);
    const again = texts(finish(a));
    assert.ok(!again.includes('떠나기 전 장면') && !again.includes('들어선 장면'), again.join(' / '));
    assert.equal(a.room.id, 'r2');
  });

  test('도착 칸 위에 문이 없으니 내려서자마자 되돌아가지 않는다 (막 지난 문 칸에 서 있어도 들어선 순간에만)', () => {
    const a = begin();
    a.flags.seen_sA = true;
    stepOn(a, 17, 5);
    finish(a);
    for (let i = 0; i < 30; i++) a.step(1 / 60, NO_INPUT);
    assert.equal(a.room.id, 'r2');
    // 문 칸 위로 바로 옮겨진 경우 (불러오기 등): 그 문은 들어선 셈
    a.goRoom('r2', [1, 5]);
    a.step(1 / 60, NO_INPUT);
    assert.equal(a.runner, null);
    assert.equal(a.room.id, 'r2');
  });

  test('rect 가 없는 문은 다가가 살펴보면 지나가고, 안내 글은 그 문의 이름', () => {
    const a = begin();
    a.place(px(11), px(9));
    a.face('right');
    a.step(1 / 60, NO_INPUT);
    assert.equal(a.prompt?.id, 'dKey');
    assert.equal(a.prompt?.kind === 'door' && a.prompt.name, '열쇠 구멍으로');
    a.step(1 / 60, { ...NO_INPUT, act: true });
    finish(a);
    assert.equal(a.room.id, 'r2');
    assert.deepEqual(cellOf(a), [5, 8]);
  });

  test('걸어 들어서는 문(rect)은 살펴보기 표시가 뜨지 않는다', () => {
    const a = begin();
    a.place(px(16), px(5));
    a.face('right');
    a.step(1 / 60, NO_INPUT);
    assert.notEqual(a.prompt?.id, 'dAB');
  });
});

// ───────────────────────── 2. preset · 방 시각 · 이름 ─────────────────────────

describe('막의 방: preset 깃발 · 방 시각 · 방 이름', () => {
  test('preset 깃발은 그 방에 들어올 때마다 선다 (지워져도 다시)', () => {
    const a = begin();
    assert.equal(a.flags.bridge_ok, undefined, '첫 방에는 없다');
    a.flags.seen_sA = true;
    stepOn(a, 17, 5);
    finish(a);
    assert.equal(a.flags.bridge_ok, true);
    delete a.flags.bridge_ok;
    a.goRoom('r1', [10, 5]);
    a.goRoom('r2', [10, 5]);
    assert.equal(a.flags.bridge_ok, true);
  });

  test('방 시각 · 이름은 들어선 막의 방 것 (기억 방에 다녀와도 그대로)', () => {
    const a = begin();
    assert.equal(a.roomClock(), '23:10');
    assert.equal(a.roomName(), '첫 방');
    a.enterRoom('r2');
    finish(a);
    assert.equal(a.roomClock(), '23:25');
    assert.equal(a.roomName(), '둘째 방');
    a.goRoom('mem');
    assert.equal(a.roomClock(), '23:25');
  });
});

// ───────────────────────── 3. 동료가 늘 따라다니는 막 ─────────────────────────

describe('동료는 늘 따라다닌다 (follow)', () => {
  test('막을 시작하면 무리의 동료가 모두 함께 다니고 (with_ 깃발), 자기 자리로 돌려보내는 @call off 는 듣지 않는다', () => {
    const a = begin();
    assert.deepEqual(a.withMe(), ['bori', 'ruru', 'nabi']);
    assert.equal(a.flags.with_nabi, true);
    a.call('all', false);
    assert.deepEqual(a.withMe(), ['bori', 'ruru', 'nabi']);
  });

  test('@join 한 동료는 바로 따라오고, @leave 하면 무리에서 빠진다', () => {
    const a = begin({ party: ['toby', 'bori'] });
    assert.deepEqual(a.withMe(), ['bori']);
    a.run([{ t: 'join', who: 'ruru' }]);
    finish(a);
    assert.deepEqual(a.withMe(), ['bori', 'ruru']);
    a.run([{ t: 'leave', who: 'bori' }]);
    finish(a);
    assert.deepEqual(a.withMe(), ['ruru']);
  });

  test('동료에게 말을 걸면 이야기만 하고 「같이 가자 / 여기 있어」 고르기가 없다', () => {
    const a = begin();
    (a as unknown as { talkPal(p: string): void }).talkPal('bori');
    let choice = false;
    let said = 0;
    for (let i = 0; i < 600 && a.runner; i++) {
      if (a.stage.choice) choice = true;
      if (a.stage.dialog?.who === 'bori') said++;
      a.step(1 / 60, { ...NO_INPUT, act: i % 2 === 0 });
    }
    assert.equal(a.runner, null);
    assert.equal(choice, false, '고르기가 나왔다');
    assert.ok(said > 0, '보리가 말을 한다');
    assert.deepEqual(a.withMe(), ['bori', 'ruru', 'nabi']);
  });

  test('follow 가 없는 장은 지금처럼: 동료는 자기 자리에서 지내고, 말을 걸면 고르기가 나온다', () => {
    const a = begin({ follow: false });
    assert.deepEqual(a.withMe(), []);
    (a as unknown as { talkPal(p: string): void }).talkPal('bori');
    let choice = false;
    for (let i = 0; i < 600 && a.runner; i++) {
      if (a.stage.choice) {
        choice = true;
        a.stage.choice.sel = 0;
      }
      a.step(1 / 60, { ...NO_INPUT, act: i % 2 === 0 });
    }
    assert.equal(choice, true);
    assert.deepEqual(a.withMe(), ['bori'], '「같이 가자」를 고르면 따라온다');
  });
});

// ───────────────────────── 4. 기억 사슬 ─────────────────────────

describe('기억 사슬: 마친 단계 뒤 다음 물건으로 카메라 + bridge 지문', () => {
  test('끝 깃발: 기억 mem_ · 살펴보기 seen_ · 밟기 trig_ · 문 door_ · 놀이 flag · 태엽 windup_ · 등 lamp_ (없으면 null)', () => {
    assert.equal(doneFlag({ kind: 'memory', id: 'm', at: [0, 0], name: '', scene: [] }), 'mem_m');
    assert.equal(doneFlag({ kind: 'npc', id: 'n', at: [0, 0], actor: 'x', scene: [] }), 'seen_n');
    assert.equal(doneFlag({ kind: 'trigger', id: 't', rect: [0, 0, 1, 1], scene: [] }), 'trig_t');
    assert.equal(doneFlag({ kind: 'door', id: 'd', at: [0, 0], to: 'r', arrive: [0, 0] }), 'door_d');
    assert.equal(doneFlag({ kind: 'pull', id: 'p', at: [0, 0], need: [], flag: 'zip_open' }), 'zip_open');
    assert.equal(doneFlag({ kind: 'windup', id: 'w', at: [0, 0], cost: 0.1, scene: [] }), 'windup_w');
    assert.equal(doneFlag({ kind: 'lamp', id: 'l', at: [0, 0], r: 2 }), 'lamp_l');
    assert.equal(doneFlag({ kind: 'star', id: 's', at: [0, 0], text: '' }), null);
  });

  test('기억을 보고 나오면 다음 단계 물건 쪽으로 카메라가 가고 bridge 지문이 나온다 · chainNext 가 한 칸 나아간다', () => {
    const a = begin();
    assert.equal(a.chainNext(), 'mA1');
    interact(a, 'mA1');
    const log = finish(a);
    const b = log.find((l) => l.text === 'A 다음 줄');
    assert.ok(b, texts(log).join(' / '));
    assert.deepEqual(b.cam, { x: px(7), y: px(3) }, '다음 단계 sA 를 비춘다');
    assert.equal(a.stage.cam, null, '카메라는 돌아온다');
    assert.equal(a.chainNext(), 'sA');
  });

  test('다음 물건이 아직 숨어 있으면 (when 이 서지 않음) 지문만, 카메라는 가지 않는다', () => {
    const a = begin({ sAwhen: 'never' });
    interact(a, 'mA1');
    const b = finish(a).find((l) => l.text === 'A 다음 줄');
    assert.ok(b);
    assert.notDeepEqual(b.cam, { x: px(7), y: px(3) });
  });

  test('다음 단계가 다른 방이면 그 방으로 가는 문을 비추고, 살펴보기는 처음 한 번만 사슬을 잇는다', () => {
    const a = begin();
    a.flags.mem_mA1 = true;
    interact(a, 'sA');
    const b = finish(a).find((l) => l.text === '문 쪽 줄');
    assert.ok(b);
    assert.deepEqual(b.cam, { x: px(17), y: px(5.5) }, '문 rect 가운데');
    interact(a, 'sA');
    assert.ok(!texts(finish(a)).includes('문 쪽 줄'), '두 번째 살펴볼 때는 없다');
  });

  test('문을 처음 지나 들어서면 그 방의 다음 단계(문 다음 기억)를 비추고, 밟기(trigger)도 사슬을 잇는다', () => {
    const a = begin();
    a.flags.mem_mA1 = true;
    a.flags.seen_sA = true;
    stepOn(a, 17, 5);
    let sawB = false;
    for (let i = 0; i < 60 * 60 && a.runner; i++) {
      const c = a.stage.cam;
      if (a.room.id === 'r2' && c && typeof c === 'object' && c.x === px(6) && c.y === px(3)) sawB = true;
      a.step(1 / 60, { ...NO_INPUT, act: i % 2 === 0 });
    }
    assert.ok(sawB, '문 다음 기억 mB1 을 비춘다');
    assert.equal(a.chainNext(), 'mB1');
    interact(a, 'mB1');
    const b = finish(a).find((l) => l.text === 'B 다음 줄');
    assert.deepEqual(b?.cam, { x: px(10.5), y: px(8) }, '밟는 자리(rect 가운데)');
    stepOn(a, 10, 8);
    assert.deepEqual(texts(finish(a)), ['밟았다'], '사슬 마지막 단계 뒤에는 잇는 줄이 없다');
    assert.equal(a.chainNext(), null);
  });

  test('사슬 밖 물건 · 사슬이 없는 장에서는 아무것도 덧붙지 않는다', () => {
    const a = begin();
    assert.deepEqual(a.bridgeCmds('dKey'), []);
    assert.deepEqual(a.bridgeCmds('없는것'), []);
    a.save.chapter = 2;
    assert.deepEqual(a.bridgeCmds('mA1'), []);
    assert.equal(a.chainNext(), null);
  });
});

// ───────────────────────── 5. 옛 기억의 문 @next · 옛 저장 ─────────────────────────

describe('막 사이 넘어가기 · 옛 저장 옮기기', () => {
  test('막의 마지막 방이 아닌 방의 @next 는 막의 다음 방 (시작 칸 · 들어선 장면), 마지막 방의 @next 는 다음 막', () => {
    const a = begin({ oldLink: true });
    a.run([{ t: 'next' }]);
    const l = texts(finish(a));
    assert.equal(a.save.chapter, 1, '막은 그대로');
    assert.equal(a.room.id, 'r2');
    assert.deepEqual(cellOf(a), [3, 7]);
    assert.ok(l.includes('들어선 장면'));
    a.run([{ t: 'next' }]);
    finish(a);
    assert.equal(a.save.chapter, 2);
    assert.equal(a.room.id, 'r3');
  });

  const oldSave = (o: Partial<AdvSave>): AdvSave => ({ v: 1, chapter: 7, room: 'r2', x: px(12), y: px(9), party: ['toby', 'bori', 'ruru', 'nabi'], flags: { kept: true }, album: [], wind: 0.5, blocks: { box: [4, 4] }, marks: { mir: 2 }, with: [], time: 10, ...o });

  test('옛 저장(ver 없음): 막의 방 차례대로 enter_ · 그 방들로 들어오는 문 door_ 깃발, 들어오는 문의 도착 칸, 밀어 둔 물건 비움, 동료는 함께', () => {
    const a = new Adv(world(), oldSave({ ch: 'r2' }));
    assert.equal(a.save.chapter, 1);
    assert.equal(a.room.id, 'r2');
    assert.deepEqual(cellOf(a), [3, 5], 'dAB 의 도착 칸');
    for (const f of ['enter_r1', 'enter_r2', 'door_dAB', 'door_dKey', 'door_dBA', 'kept']) assert.equal(a.flags[f], true, f);
    assert.deepEqual(a.save.blocks, {});
    assert.deepEqual(a.save.marks, {});
    assert.deepEqual(a.withMe(), ['bori', 'ruru', 'nabi']);
    assert.equal(a.snapshot().ver, SAVE_VER);
    assert.equal(a.snapshot().ch, 'r1', '저장은 막의 첫 방 이름으로');
  });

  test('옛 저장이 막의 첫 방이면 막 시작 칸, 다음 방으로 가는 문 깃발은 세우지 않는다', () => {
    const a = new Adv(world(), oldSave({ ch: 'r1', room: 'r1' }));
    assert.deepEqual(cellOf(a), [2, 5]);
    assert.equal(a.flags.enter_r1, true);
    assert.equal(a.flags.enter_r2, undefined);
    assert.equal(a.flags.door_dAB, undefined);
    assert.equal(a.flags.door_dBA, true, '첫 방으로 들어오는 문');
  });

  test('새 저장(ver 2)은 옮기지 않는다: 자리 · 밀어 둔 물건 그대로', () => {
    const a = new Adv(world(), oldSave({ ch: 'r1', room: 'r2', ver: SAVE_VER }));
    assert.equal(a.room.id, 'r2');
    assert.deepEqual(cellOf(a), [12, 9]);
    assert.deepEqual(a.save.blocks, { box: [4, 4] });
    assert.equal(a.flags.enter_r1, undefined);
  });

  test('모르는 장 이름의 저장은 새 게임', () => {
    const a = new Adv(world(), oldSave({ ch: 'nowhere', room: 'r2' }));
    assert.equal(a.save.chapter, 1);
    assert.equal(a.room.id, 'r1');
    assert.equal(a.flags.kept, undefined);
  });
});

// ───────────────────────── 6. 실제 이야기 ─────────────────────────

const ACTS = CHAPTERS.filter((c) => c.rooms?.length);
const built: Record<string, RoomDef> = {};
const R = (id: string): RoomDef => (built[id] ??= ROOMS[id]());
const doorsIn = (id: string) => R(id).things.filter((t): t is Extract<Thing, { kind: 'door' }> => t.kind === 'door');
/** 그 방에 막 안에서 들어서는 칸: 막 첫 방은 막 시작, 아니면 들어오는 문의 도착 칸 (없으면 그 방의 시작 칸) */
function entryOf(c: Chapter, id: string): [number, number] {
  if (id === c.room) return [c.start[0], c.start[1]];
  const ids = c.rooms!.map((r) => r.id);
  const k = ids.indexOf(id);
  const d = doorsIn(ids[k - 1]).find((x) => x.to === id) ?? ids.flatMap(doorsIn).find((x) => x.to === id);
  const s = d?.arrive ?? c.rooms![k].start ?? [R(id).start.x, R(id).start.y];
  return [s[0], s[1]];
}

/** 걸어서 닿는 칸 (밀 물건은 밀 수 있다고, 밧줄 다리 · 오르기는 놓였다고 본다; 장난감은 가구 밑 U 를 지나간다) */
function reach(r: RoomDef, from: readonly [number, number]): Set<string> {
  const elev = (x: number, y: number) => Number(r.elev?.[y]?.[x] ?? 0);
  const open = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= r.w || y >= r.h) return false;
    if (r.things.some((t) => t.kind === 'gap' && t.tiles.some((p) => p[0] === x && p[1] === y))) return true;
    if (r.tiles[y][x] === 'U') return true;
    return !isSolidChar(r.tiles[y][x]);
  };
  const climbs = r.things.flatMap((t) => (t.kind === 'climb' ? [[t.at, t.to], [t.to, t.at]] : []));
  const seen = new Set<string>([`${from[0]},${from[1]}`]);
  const q = [[from[0], from[1]]];
  while (q.length) {
    const [x, y] = q.pop()!;
    const next: [number, number][] = [];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (open(x + dx, y + dy) && elev(x + dx, y + dy) === elev(x, y)) next.push([x + dx, y + dy]);
    for (const [p, s] of climbs) if (p[0] === x && p[1] === y) next.push([s[0], s[1]]);
    for (const [nx, ny] of next) {
      const k = `${nx},${ny}`;
      if (!seen.has(k)) {
        seen.add(k);
        q.push([nx, ny]);
      }
    }
  }
  return seen;
}

describe('실제 이야기의 막', () => {
  test('막의 방마다 시작 칸(막 시작 · 들어오는 문 도착 칸)은 걸을 수 있고, 그 방 물건은 모두 거기서 걸어서 닿는다', () => {
    for (const c of ACTS)
      for (const r of c.rooms!) {
        const room = R(r.id);
        const [sx, sy] = entryOf(c, r.id);
        assert.ok(!isSolidChar(room.tiles[sy]?.[sx]), `${c.title} ${r.id}: 시작 칸 (${sx},${sy}) 이 막혔다`);
        const ok = reach(room, [sx, sy]);
        for (const t of room.things) {
          if (t.kind === 'trigger' || t.kind === 'seq' || t.kind === 'chase' || t.kind === 'watcher' || t.kind === 'beam' || t.kind === 'gears' || t.kind === 'flow' || t.kind === 'block' || t.kind === 'push' || t.kind === 'gap') continue;
          const [x, y] = t.at;
          assert.ok([[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => ok.has(`${x + dx},${y + dy}`)), `${c.title} ${r.id} ${t.id} (${x},${y}) 닿지 않는다`);
        }
      }
  });

  test('문은 같은 막의 다른 방으로 가고, 문 칸 · 도착 칸은 걸을 수 있으며, 도착 칸은 그 방의 어느 문 rect 에도 들지 않고, 문 칸은 다른 물건과 겹치지 않는다', () => {
    let n = 0;
    for (const c of ACTS) {
      const ids = c.rooms!.map((r) => r.id);
      for (const id of ids)
        for (const d of doorsIn(id)) {
          n++;
          assert.ok(ids.includes(d.to) && d.to !== id, `${c.title} ${d.id}: 다른 막의 방 ${d.to}`);
          const cells = d.rect ? Array.from({ length: d.rect[2] * d.rect[3] }, (_, i): [number, number] => [d.rect![0] + (i % d.rect![2]), d.rect![1] + Math.floor(i / d.rect![2])]) : [[d.at[0], d.at[1]] as [number, number]];
          for (const [x, y] of cells) {
            assert.ok(!isSolidChar(R(id).tiles[y]?.[x]), `${d.id} (${x},${y}) 막힌 칸`);
            const other = R(id).things.find((t) => t !== d && t.kind !== 'trigger' && t.kind !== 'seq' && t.kind !== 'chase' && 'at' in t && t.at[0] === x && t.at[1] === y);
            assert.equal(other, undefined, `${d.id} (${x},${y}) 에 ${other?.id}`);
          }
          const to = R(d.to);
          assert.ok(!isSolidChar(to.tiles[d.arrive[1]]?.[d.arrive[0]]), `${d.id} 도착 칸 막힘`);
          for (const e of doorsIn(d.to)) if (e.rect) assert.ok(!(d.arrive[0] >= e.rect[0] && d.arrive[0] < e.rect[0] + e.rect[2] && d.arrive[1] >= e.rect[1] && d.arrive[1] < e.rect[1] + e.rect[3]), `${d.id} 도착 칸이 ${e.id} 안`);
        }
    }
    // 문은 1단계(B · C · D)에서 놓인다: 놓인 만큼 위 규칙을 지킨다 (n 은 지금 놓인 문 수)
    void n;
  });

  test('사슬: 막마다 그 막 방의 기억이 정확히 한 번씩 있고, 없는 id 가 없으며, 둘째 단계부터 when 은 gate 또는 앞 단계의 끝 깃발', () => {
    for (const c of CHAPTERS) {
      const chain = c.chain ?? [];
      if (!chain.length) continue;
      const things = (c.rooms ?? [{ id: c.room }]).flatMap((r) => R(r.id).things);
      const byId = new Map(things.map((t) => [t.id, t]));
      for (const s of chain) assert.ok(byId.has(s.id), `${c.title}: 사슬의 ${s.id} 가 막에 없다`);
      const ids = chain.map((s) => s.id);
      assert.deepEqual(ids.filter((x, i) => ids.indexOf(x) !== i), [], `${c.title}: 겹친 단계`);
      const mems = things.filter(isMemory).map((m) => m.id);
      assert.deepEqual(mems.filter((m) => !ids.includes(m)), [], `${c.title}: 사슬 밖 기억`);
      for (let i = 1; i < chain.length; i++) {
        const t = byId.get(chain[i].id)!;
        const want = chain[i].gate ?? doneFlag(byId.get(chain[i - 1].id)!);
        assert.equal((t as { when?: string }).when, want ?? undefined, `${c.title} ${t.id}.when`);
      }
      for (const s of chain) if (s.bridge !== undefined) assert.ok(s.bridge.trim().length > 0 && !s.bridge.includes('\n'), `${c.title} ${s.id}: bridge 는 한 줄`);
    }
  });

  test.todo('막마다 사슬이 있다 (1단계에서 B · C · D 가 방 파일의 *_CHAIN 을 채운 뒤 켠다)');
  test.todo('막 하나하나 처음부터 끝까지: 도입 → 사슬 차례대로 (다른 방이면 문으로) → 남긴 놀이 → 마지막 방의 기억의 문 → 다음 막 (2단계)');

  test('옛 저장을 막으로: 「이불장」 저장은 3막의 이불장, 지나온 방 enter_ 깃발과 들어오는 문 깃발이 서고 도착 칸에, 밀어 둔 물건은 비운다', () => {
    const act = CHAPTERS.find((c) => c.rooms?.some((r) => r.id === 'closet'))!;
    assert.match(act.title, /^3막/);
    const save: AdvSave = { v: 1, chapter: 5, ch: 'closet', room: 'closet', x: px(10), y: px(3), party: ['toby', 'bori', 'ruru', 'nabi'], flags: { mem_m3a: true }, album: ['m3a'], wind: 0.65, blocks: { pillow: [6, 9] }, time: 99 };
    const a = new Adv(STORY, save);
    assert.equal(a.save.chapter, act.n);
    assert.equal(a.room.id, 'closet');
    assert.deepEqual(cellOf(a), entryOf(act, 'closet'));
    for (const f of ['enter_underbed', 'enter_closet', 'mem_m3a']) assert.equal(a.flags[f], true, f);
    for (const d of act.rooms!.flatMap((r) => doorsIn(r.id))) assert.equal(a.flags[`door_${d.id}`], true, d.id);
    assert.deepEqual(a.save.blocks, {});
    assert.equal(a.snapshot().ver, SAVE_VER);
  });

  test('옛 저장: 새벽 다락은 마지막 장, 앞마당은 프롤로그, 모르는 장은 새 게임', () => {
    const base: AdvSave = { v: 1, chapter: 1, room: 'attic_dawn', x: px(11), y: px(14), party: ['toby', 'bori', 'ruru', 'nabi'], flags: {}, album: [], wind: 0.1, blocks: {}, time: 0 };
    const dawn = new Adv(STORY, { ...base, ch: 'attic_dawn' });
    assert.equal(dawn.save.chapter, CHAPTERS.find((c) => c.room === 'attic_dawn')!.n);
    assert.equal(dawn.room.id, 'attic_dawn');
    const pro = new Adv(STORY, { ...base, ch: 'h_yard_eve', room: 'h_yard_eve', x: px(9), y: px(11), party: [] });
    assert.equal(pro.save.chapter, CHAPTERS[0].n);
    const lost = new Adv(STORY, { ...base, ch: 'no_such_room' });
    assert.equal(lost.save.chapter, CHAPTERS[0].n);
    assert.equal(lost.room.id, CHAPTERS[0].room);
  });

  test('찬장 꿀단지 기억(mOa)은 장난감 상자 뚜껑(lid_open)과 따로: 꿀단지를 열어야(honey_open) 보인다', () => {
    const act = CHAPTERS.find((c) => c.rooms?.some((r) => r.id === 'cupboard'))!;
    const a = new Adv(STORY);
    a.runner = null;
    a.queue = [];
    (a as unknown as { applyChapter(n: number): void }).applyChapter(act.n);
    if (a.room.id !== 'cupboard') a.enterRoom('cupboard');
    a.flags.lid_open = true;
    assert.ok(!a.things().some((t) => t.id === 'mOa'), '9막 장난감 상자 뚜껑으로 꿀단지 기억이 먼저 열렸다');
    const opener = R('cupboard').things.find((t) => (('flag' in t && t.flag === 'honey_open') || ('scene' in t && t.scene?.some((c) => c.t === 'flag' && c.name === 'honey_open'))));
    assert.ok(opener, '꿀단지를 여는 것이 honey_open 을 세운다');
    a.flags.honey_open = true;
    assert.ok(a.things().some((t) => t.id === 'mOa'));
  });
});

// ───────────────────────── 7. 대본: 물건 치우기 ─────────────────────────

describe('@item <id> none', () => {
  test('바닥의 물건을 치우고, 든 사람 손에서도 치운다', () => {
    const h = simpleHost();
    const r = new Runner([
      { t: 'item', id: 'p1', kind: 'toby', at: [2, 2] },
      { t: 'show', who: 'haru', kind: 'haru15', at: [3, 3] },
      { t: 'carry', who: 'haru', kind: 'bear', id: 'p2' },
      { t: 'item', id: 'p1', kind: 'none' },
      { t: 'item', id: 'p2', kind: 'none' },
    ]);
    for (let i = 0; i < 10 && !r.done; i++) r.update(h, 1 / 60);
    assert.ok(r.done);
    assert.equal(h.stage.items.p1, undefined);
    assert.equal(h.stage.items.p2, undefined);
    assert.equal(h.stage.actors.haru.carry, undefined);
  });

  test('none 이 아니면 지금처럼 종류만 바꾼다', () => {
    const h = simpleHost();
    const r = new Runner([
      { t: 'item', id: 'p1', kind: 'box', at: [2, 2] },
      { t: 'item', id: 'p1', kind: 'boxOpen' },
    ]);
    for (let i = 0; i < 10 && !r.done; i++) r.update(h, 1 / 60);
    assert.equal(h.stage.items.p1?.kind, 'boxOpen');
  });
});
