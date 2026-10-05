/**
 * 막 다시 짜기 · 구현자 C (ACTS.md 5~7막): 5막 노란 별 (책가방 → 책상) · 6막 웃은 자국 (욕실 → 책장) · 7막 매일 해 주던 일 (과자 서랍 → 베란다 → 소파 밑).
 * 지운 놀이가 남지 않았는지, 막마다 놀이가 하나만 남았는지, 문 · 기억 사슬 · 물음 목표 · 여는/닫는 장면이 계획대로인지,
 * 그리고 실제 STORY 로 막을 열어 사슬을 처음부터 끝까지 걸으면 다음 막으로 넘어가는지 본다.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Adv, doneFlag, isMemory, NO_INPUT } from '../adv.ts';
import { isSolidChar, TILE } from '../../maps.ts';
import { px } from '../stage.ts';
import { CHAPTERS, ROOMS } from '../story/index.ts';
import { ROOM_CLOCK, ROOM_WIND } from '../story/acts.ts';
import { startIn } from './acthelp.ts';
import type { Chapter, Cmd, RoomDef, Thing } from '../types.ts';

type Door = Extract<Thing, { kind: 'door' }>;

const actOf = (room: string): Chapter => {
  const c = CHAPTERS.find((x) => x.rooms?.some((r) => r.id === room));
  assert.ok(c, `${room} 이 든 막이 없다`);
  return c;
};
const ACT5 = actOf('schoolbag');
const ACT6 = actOf('bath');
const ACT7 = actOf('drawer');
const MY_ACTS = [ACT5, ACT6, ACT7];

const built = new Map<string, RoomDef>();
const R = (id: string): RoomDef => {
  let r = built.get(id);
  if (!r) {
    r = ROOMS[id]();
    built.set(id, r);
  }
  return r;
};
const roomsOf = (c: Chapter): string[] => c.rooms!.map((r) => r.id);
const thingsOf = (c: Chapter): Thing[] => roomsOf(c).flatMap((id) => R(id).things);
const find = (c: Chapter, id: string): Thing => {
  const t = thingsOf(c).find((x) => x.id === id);
  assert.ok(t, `${c.title} 에 ${id} 가 없다`);
  return t;
};
const doorOf = (c: Chapter, id: string): Door => {
  const t = find(c, id);
  assert.equal(t.kind, 'door', `${id} 는 문`);
  return t as Door;
};

/** 대본 안의 모든 명령 (갈래 속까지) */
const flat = (cmds: readonly Cmd[]): Cmd[] => cmds.flatMap((c) => (c.t === 'if' ? [c, ...flat(c.then), ...flat(c.else ?? [])] : [c]));
const goals = (cmds: readonly Cmd[]): string[] => flat(cmds).flatMap((c) => (c.t === 'goal' && c.text ? [c.text] : []));
const says = (cmds: readonly Cmd[]): string[] => flat(cmds).flatMap((c) => (c.t === 'say' ? [`${c.who}: ${c.text}`] : []));
/** 물건 대본 (기억 장면 · 감상 밖): 장면 · 문의 떠나기 전 · 잠김 · 기억의 문 잠김 */
function objectScripts(t: Thing): Cmd[][] {
  if (isMemory(t)) return [];
  const out: Cmd[][] = [];
  if ('scene' in t && t.scene) out.push(t.scene);
  if (t.kind === 'door') out.push(t.first ?? [], t.locked ?? []);
  if (t.kind === 'link') out.push(t.locked);
  return out;
}
const enterOf = (c: Chapter, room: string): Cmd[] => c.rooms!.find((r) => r.id === room)?.enter ?? [];

/** 대본이 끝날 때까지 넘긴다 (미니 놀이는 끝낸 셈, 고르기는 첫 갈래) · 나온 대사 */
function finish(a: Adv, limit = 180): string[] {
  const out: string[] = [];
  for (let i = 0; i < limit * 60 && (a.runner || a.mini); i++) {
    if (a.mini) a.mini.done = true;
    if (a.stage.choice) a.stage.choice.sel = 0;
    const d = a.stage.dialog;
    if (d && out.at(-1) !== d.text) out.push(d.text);
    a.step(1 / 60, { ...NO_INPUT, act: i % 2 === 0 });
  }
  assert.equal(a.runner, null, '대본이 끝나지 않는다');
  return out;
}
const visible = (a: Adv, id: string): boolean => a.things().some((t) => t.id === id);
function interact(a: Adv, id: string): string[] {
  const t = a.things().find((x) => x.id === id);
  assert.ok(t, `${a.room.id}: ${id} 이 보이지 않는다`);
  (a as unknown as { interact(t: Thing): void }).interact(t);
  return finish(a);
}
const cellOf = (a: Adv): [number, number] => [Math.floor(a.stage.actors.toby.x / TILE), Math.floor(a.stage.actors.toby.y / TILE)];
/** 막을 시작해 도입을 끝까지 */
const begin = (room: string): Adv => startIn(room, (a) => finish(a));

// ───────────────────────── 1. 지운 놀이 · 남긴 놀이 ─────────────────────────

describe('5~7막: 지운 놀이는 남지 않고, 막마다 놀이는 하나만', () => {
  const GONE = new Set(['push', 'pad', 'block', 'chase', 'watcher', 'gears', 'flow', 'beam', 'mirror', 'charge', 'part', 'assemble', 'windup']);
  for (const c of MY_ACTS)
    test(`${c.title}: 밀기 · 발판 · 쫓기 · 숨바꼭질 · 톱니 · 물길 · 빛 · 조각 · 태엽 나눔이 없고, 방에 미끄럼 · 바람 · 낮은 천장이 없다`, () => {
      for (const id of roomsOf(c)) {
        const r = R(id);
        const left = r.things.filter((t) => GONE.has(t.kind)).map((t) => `${t.kind}:${t.id}`);
        assert.deepEqual(left, [], `${id}`);
        assert.equal(r.slip, undefined, `${id} slip`);
        assert.equal(r.grip, undefined, `${id} grip`);
        assert.equal(r.winds, undefined, `${id} winds`);
        assert.equal(r.low, undefined, `${id} low`);
        if (r.lantern) assert.equal(r.lantern.drain, 0, `${id} 등불은 줄지 않는다`);
      }
    });

  test('남긴 놀이: 5막은 다 같이 지퍼(루루 · 보리와 세 번), 6막은 나비와 무대 불, 7막은 오르골 노래 — 막마다 그 하나뿐', () => {
    const plays = (c: Chapter) => thingsOf(c).filter((t) => t.kind === 'pull' || t.kind === 'seq' || t.kind === 'lamp').map((t) => t.id);
    assert.deepEqual(plays(ACT5), ['zipper']);
    assert.deepEqual(plays(ACT6), ['stage_lamp']);
    assert.deepEqual(plays(ACT7), ['musicbox']);
    const zip = find(ACT5, 'zipper');
    assert.ok(zip.kind === 'pull' && zip.need.includes('ruru') && zip.need.includes('bori') && zip.tugs === 3 && zip.flag === 'zip_open');
    const lamp = find(ACT6, 'stage_lamp');
    assert.ok(lamp.kind === 'lamp' && lamp.who === 'nabi' && lamp.when === 'curtain_open');
    const mb = find(ACT7, 'musicbox');
    assert.ok(mb.kind === 'seq' && mb.flag === 'musicbox_half' && mb.order.length === 3);
  });

  test('밀어 두던 것 · 당기던 것은 같은 자리의 살펴보기로: 과자 서랍 · 여우 봉지 · 하루 꽃 · 동전 탑이 이야기 깃발을 세운다', () => {
    const want: [Chapter, string, string, readonly [number, number]][] = [
      [ACT7, 'snack_drawer', 'drawer_open', [25, 4]],
      [ACT7, 'bagPull', 'bag_down', [9, 4]],
      [ACT7, 'flowerAsm', 'flower_watered', [31, 6]],
      [ACT7, 'coinTower', 'tower_done', [33, 9]],
    ];
    for (const [c, id, flag, at] of want) {
      const t = find(c, id);
      assert.equal(t.kind, 'spot', id);
      assert.deepEqual(t.kind === 'spot' && t.at, at, `${id} 자리`);
      assert.ok(t.kind === 'spot' && flat(t.scene).some((x) => x.t === 'flag' && x.name === flag), `${id} → ${flag}`);
    }
    // 잠든 아빠는 숨바꼭질 대신 같은 자리에서 잠꼬대하는 사람
    const dad = find(ACT6, 'dad_sofa6');
    assert.ok(dad.kind === 'npc' && dad.actor === 'dad' && dad.pose === 'sleep');
    assert.deepEqual(dad.at, [16, 10]);
  });
});

describe('5~7막: 살펴보기는 동료의 짧은 이야기', () => {
  test('방마다 보리 · 루루 · 나비가 저마다 적어도 한 살펴보기에서 말하고, 동료 자리 말에 「불러」 귀띔이 없다', () => {
    for (const c of MY_ACTS)
      for (const id of roomsOf(c)) {
        const r = R(id);
        const who = new Set(r.things.flatMap((t) => (t.kind === 'spot' ? flat(t.scene) : [])).flatMap((x) => (x.t === 'say' ? [x.who] : [])));
        for (const p of ['bori', 'ruru', 'nabi']) assert.ok(who.has(p), `${id}: ${p}`);
        for (const [p, h] of Object.entries(r.hangouts ?? {})) for (const l of says(h.talk ?? [])) assert.ok(!/불러|부르면/.test(l), `${id} ${p}: ${l}`);
      }
  });
});

// ───────────────────────── 2. 목표 줄은 물음 ─────────────────────────

describe('5~7막: 목표 줄은 물음 한 줄', () => {
  const COUNT = /\d|(한|두|세|네|다섯|여섯|일곱|여덟|아홉|열)\s*개|기억 조각/;
  test('막 도입 하나 · 둘째 · 셋째 방 들어선 장면 하나씩, 정해진 물음 그대로', () => {
    assert.deepEqual(goals(ACT5.intro), ['종이별은 왜 구백구십구 개에서 멈춰 있을까?']);
    assert.deepEqual(goals(enterOf(ACT5, 'desk')), ['천 번째 별에, 하루는 무엇을 빌려고 했을까?']);
    assert.deepEqual(goals(ACT6.intro), ['하루가 마지막으로 크게 웃은 건 언제였을까?']);
    assert.deepEqual(goals(enterOf(ACT6, 'shelf')), ['토비 극장의 관객은 누구였을까?']);
    assert.deepEqual(goals(ACT7.intro), ['매일 해 주던 사람이 없으면, 그 일은 누가 할까?']);
    assert.deepEqual(goals(enterOf(ACT7, 'balcony')), ['하루 꽃은 왜 시들었을까?']);
    assert.deepEqual(goals(enterOf(ACT7, 'sofa')), ['루루는 정말 덤이었을까?']);
  });

  test('물건 대본 · 문 · 기억의 문에는 @goal 이 없고, 모든 목표는 「?」 로 끝나며 개수 · 「~자」 명령이 없다', () => {
    for (const c of MY_ACTS) {
      for (const t of thingsOf(c)) for (const sc of objectScripts(t)) assert.deepEqual(goals(sc), [], `${c.title} ${t.id}`);
      const all = [...goals(c.intro), ...c.rooms!.flatMap((r) => goals(r.enter ?? [])), ...thingsOf(c).filter(isMemory).flatMap((m) => goals(m.scene))];
      assert.ok(all.length >= 3);
      for (const g of all) {
        assert.ok(g.endsWith('?'), `「${g}」`);
        assert.ok(!COUNT.test(g), `「${g}」 개수`);
        assert.ok(!/자[.!]?$|자\s*[(—·]/.test(g), `「${g}」 명령형`);
      }
    }
  });

  test('기억 속 조종 장면의 목표: 숨바꼭질 · 깨진 안경 · 이 던지기가 물음으로, 조종(@control) 뒤에만', () => {
    const want: [Chapter, string, string][] = [
      [ACT5, 'm5e', '할머니는 어디 숨었을까?'],
      [ACT6, 'mBc', '깨진 안경… 숨길까, 말할까?'],
      [ACT7, 'mVb', '이를 어디로 던지더라?'],
    ];
    for (const [c, id, q] of want) {
      const m = find(c, id);
      assert.ok(isMemory(m));
      const cmds = flat(m.scene);
      const ctl = cmds.findIndex((x) => x.t === 'control' && x.who === 'haru');
      const g = cmds.findIndex((x) => x.t === 'goal');
      assert.ok(ctl >= 0 && g > ctl, `${id}: 조종 ${ctl} 목표 ${g}`);
      assert.deepEqual(goals(m.scene), [q]);
    }
  });
});

// ───────────────────────── 3. 문 · 여는 장면 · 닫는 장면 ─────────────────────────

describe('5~7막: 방을 잇는 문과 장면', () => {
  test('문 표 그대로: 자리 · 가는 방 · 도착 칸 · 바라봄 · 사슬 깃발 · 잠김 말', () => {
    const rows: [Chapter, string, string, string, [number, number], string, string | undefined, string | undefined][] = [
      [ACT5, 'schoolbag', 'd_bag_desk', 'desk', [4, 18], 'up', 'mem_mJf', 'ruru: 가방 속 얘기가 아직 남았어.'],
      // 계획표의 [5,6] 은 도시락 주머니(jw_lunchbag) 칸이라 한 칸 옆
      [ACT5, 'desk', 'd_desk_bag', 'schoolbag', [6, 6], 'down', undefined, undefined],
      [ACT6, 'bath', 'd_bath_shelf', 'shelf', [10, 14], 'up', 'mem_mBd', 'bori: 장미 비누 냄새… 조금만 더 맡고 가자.'],
      [ACT6, 'shelf', 'd_shelf_bath', 'bath', [10, 12], 'up', undefined, undefined],
      [ACT7, 'drawer', 'd_drawer_balc', 'balcony', [4, 8], 'right', 'mem_m7e', 'toby: 부엌이 아직 따뜻해. 조금만 더.'],
      [ACT7, 'balcony', 'd_balc_drawer', 'drawer', [3, 12], 'right', undefined, undefined],
      [ACT7, 'balcony', 'd_balc_sofa', 'sofa', [6, 18], 'up', 'mem_mVg', 'ruru: …거긴 나중에.'],
      [ACT7, 'sofa', 'd_sofa_balc', 'balcony', [3, 9], 'down', undefined, undefined],
    ];
    for (const [c, room, id, to, arrive, dir, when, locked] of rows) {
      const d = R(room).things.find((t) => t.id === id);
      assert.ok(d && d.kind === 'door', `${room} 에 문 ${id}`);
      assert.equal(d.to, to, id);
      assert.deepEqual(d.arrive, arrive, id);
      assert.equal(d.dir, dir, id);
      assert.equal(d.when, when, id);
      assert.deepEqual(says(d.locked ?? []), locked ? [locked] : [], id);
      assert.ok(roomsOf(c).includes(to));
      // 도착 칸은 걸을 수 있고, 몸이 있는 물건(살펴보기 · 기억 · 사람)과 겹치지 않는다
      assert.ok(!isSolidChar(R(to).tiles[arrive[1]][arrive[0]]), `${id} 도착 칸이 막혔다`);
      const on = R(to).things.find((t) => t.kind !== 'trigger' && t.kind !== 'door' && t.kind !== 'gap' && 'at' in t && t.at[0] === arrive[0] && t.at[1] === arrive[1]);
      assert.equal(on, undefined, `${id} 도착 칸에 ${on?.id}`);
    }
    // 걸어 들어서는 문 · 살펴보는 문
    assert.deepEqual(doorOf(ACT6, 'd_bath_shelf').rect, [9, 14, 2, 1]);
    assert.equal(doorOf(ACT5, 'd_bag_desk').rect, undefined);
    assert.equal(doorOf(ACT5, 'd_bag_desk').name, '책상 위로');
    assert.equal(doorOf(ACT7, 'd_balc_sofa').name, '소파 밑으로');
    // 6막은 욕실 아래 문 rect 밖에서 시작한다
    assert.deepEqual(ACT6.start, [10, 12]);
  });

  test('떠나기 전 장면: 옛 기억의 문 대사를 옮겼고, 미니 놀이 · 다음 장 · 장 끝 깃발 · 흰 페이드는 없다', () => {
    const moved: [Chapter, string, string][] = [
      [ACT5, 'd_bag_desk', 'toby: 거기서부터야. 별도, 소원도.'],
      [ACT6, 'd_bath_shelf', 'nabi: 책장으로 가자. 무대가 아직 거기 있어.'],
      [ACT7, 'd_drawer_balc', 'ruru: 하나씩 가자. 베란다 먼저.'],
      [ACT7, 'd_balc_sofa', 'ruru: …흥. 따라오든가.'],
    ];
    for (const [c, id, line] of moved) {
      const first = flat(doorOf(c, id).first ?? []);
      assert.ok(says(first).includes(line), `${id}: ${line}`);
      assert.ok(!first.some((x) => x.t === 'mini' || x.t === 'next' || (x.t === 'flag' && /^ch.*_done$/.test(x.name)) || (x.t === 'fade' && x.color === 'white') || (x.t === 'sfx' && x.name === 'memory')), id);
      assert.deepEqual(first.filter((x) => x.t === 'bars').map((x) => x.t === 'bars' && x.on), [true, false], `${id}: 띠를 걷고 끝난다`);
    }
    assert.ok(says(doorOf(ACT6, 'd_bath_shelf').first ?? []).includes(': 복도를 지나, 계단을 한 칸씩 내려간다.'));
    // 소파 밑으로 갈 때 루루가 먼저 사라진다 (소파 밑에서 앞장서려고)
    assert.deepEqual(flat(doorOf(ACT7, 'd_balc_sofa').first ?? []).filter((x) => x.t === 'leave'), [{ t: 'leave', who: 'ruru' }]);
  });

  test('기억의 문은 막의 마지막 방에만 하나: 인형극 무대 flip2 · 녹은 생일 초 order2 · 작은 노란 우산 thread2', () => {
    const want: [Chapter, string, string][] = [
      [ACT5, 'l5', 'flip2'],
      [ACT6, 'l6', 'order2'],
      [ACT7, 'lR', 'thread2'],
    ];
    for (const [c, id, mini] of want) {
      const ids = roomsOf(c);
      for (const r of ids.slice(0, -1)) assert.equal(R(r).things.filter((t) => t.kind === 'link').length, 0, `${r} 에 기억의 문이 남았다`);
      const links = R(ids.at(-1)!).things.filter((t) => t.kind === 'link');
      assert.deepEqual(links.map((t) => t.id), [id]);
      const cmds = flat(links[0].kind === 'link' ? links[0].scene : []);
      assert.deepEqual(cmds.filter((x) => x.t === 'mini').map((x) => x.t === 'mini' && x.id), [mini]);
      assert.equal(cmds.at(-1)?.t, 'next');
    }
  });

  test('들어선 장면: 방 이름 · 옛 장 시각 제목과 옛 장 태엽, 첫 지문의 시각, 장 제목 카드 · 흰 페이드는 막 도입에만', () => {
    const second: [Chapter, string, string, string][] = [
      [ACT5, 'desk', '책상 위', '새벽 한 시 반'],
      [ACT6, 'shelf', '거실 책장', '새벽 두 시 오 분'],
      [ACT7, 'balcony', '베란다', '새벽 두 시 사십 분'],
      [ACT7, 'sofa', '소파 밑', '새벽 두 시 오십오 분'],
    ];
    for (const [c, room, name, ko] of second) {
      const e = enterOf(c, room);
      assert.deepEqual(e[0], { t: 'title', text: name, sub: ROOM_CLOCK[room] }, room);
      assert.deepEqual(e[1], { t: 'wind', v: ROOM_WIND[room] }, room);
      assert.ok(!flat(e).some((x) => x.t === 'chtitle' || (x.t === 'fade' && x.color === 'white')), room);
      const first = flat(e).find((x) => x.t === 'say' && x.who === '');
      assert.ok(first && first.t === 'say' && first.text.includes(ko), `${room}: ${first && first.t === 'say' ? first.text : ''}`);
    }
    for (const c of MY_ACTS) assert.ok(flat(c.intro).some((x) => x.t === 'chtitle'), `${c.title}: 막 도입은 장 제목 카드`);
  });

  test('여는 장면: 5막은 2층으로 돌아오며 01:10, 6막 끝에 젖은 바닥 한 줄, 7막은 엄마의 「곰돌아」 · 보리 「안 먹을 거야」', () => {
    const l5 = says(ACT5.intro);
    assert.equal(l5.find((l) => l.startsWith(': ')), ': 다시 2층, 새벽 한 시 십 분. 하루 방 문이 반쯤 열려 있다.');
    const l6 = says(ACT6.intro);
    assert.ok(l6.includes(': 욕실 바닥이 달빛에 번들거린다.'));
    const l7 = says(ACT7.intro);
    assert.ok(l7.some((l) => l.startsWith('mom:') && l.includes('곰돌아')));
    assert.ok(l7.includes('bori: …아니. 나 이번엔 안 먹을 거야.'));
  });

  test('닫는 장면: 5막 끝 인형극 무대 뒤 막간 ② (다락 · 태엽 할머니 목소리) 뒤에야 다음 막, 7막 끝 루루 「덤 아니었어. 이제 알아.」', () => {
    const l5 = flat(find(ACT5, 'l5').kind === 'link' ? (find(ACT5, 'l5') as Extract<Thing, { kind: 'link' }>).scene : []);
    const iMini = l5.findIndex((x) => x.t === 'mini');
    const iAttic = l5.findIndex((x) => x.t === 'room' && x.id === 'h_attic');
    const iNext = l5.findIndex((x) => x.t === 'next');
    assert.ok(iMini >= 0 && iAttic > iMini && iNext > iAttic);
    assert.ok(says(l5.slice(iAttic, iNext)).some((l) => l.startsWith('doll:')));
    const lR = find(ACT7, 'lR');
    assert.ok(lR.kind === 'link' && says(lR.scene).includes('ruru: 그리고. …덤 아니었어. 이제 알아.'));
  });
});

// ───────────────────────── 4. 기억 사슬 ─────────────────────────

describe('5~7막: 기억 사슬', () => {
  const ORDER: [Chapter, string[]][] = [
    [ACT5, ['zipper', 'mJa', 'mJb', 'mJc', 'mJg', 'mJd', 'mJe', 'mJf', 'd_bag_desk', 'm5a', 'm5d', 'm5f', 'm5e', 'm5c', 'm5b', 'paper', 'm5g']],
    [ACT6, ['mBb', 'mBf', 'mBg', 'mBa', 'mBc', 'mBe', 'mBd', 'd_bath_shelf', 'm6a', 'm6b', 'm6g', 'm6f', 'm6d', 'm6e', 'wolf', 'stage_lamp', 'm6c']],
    [ACT7, ['musicbox', 'm7d', 'snack_drawer', 'm7f', 'm7a', 'm7b', 'm7g', 'm7c', 'm7e', 'd_drawer_balc', 'bagPull', 'mVd', 'mVf', 'mVe', 'mVc', 'flowerAsm', 'mVa', 'mVb', 'mVg', 'd_balc_sofa', 'mRa', 'mRb', 'mRe', 'mRc', 'mRd', 'coinTower', 'mRf']],
  ];
  test('막별 표의 차례 그대로이고, 그 막 방의 기억(5막 14 · 6막 14 · 7막 20)이 모두 한 번씩', () => {
    for (const [c, ids] of ORDER) {
      assert.deepEqual(c.chain!.map((s) => s.id), ids, c.title);
      const mems = thingsOf(c).filter(isMemory).map((m) => m.id);
      assert.equal(mems.length, { [ACT5.title]: 14, [ACT6.title]: 14, [ACT7.title]: 20 }[c.title]);
      assert.deepEqual([...mems].sort(), ids.filter((i) => mems.includes(i)).sort());
    }
  });

  test('둘째 단계부터 when 은 gate 또는 앞 단계의 끝 깃발, 둘째 방 첫 단계는 들어오는 문 깃발 (소파 밑만 들어선 장면의 루루 안내 ruru_led)', () => {
    for (const [c] of ORDER) {
      const chain = c.chain!;
      for (let i = 1; i < chain.length; i++) {
        const t = find(c, chain[i].id);
        const want = chain[i].gate ?? doneFlag(find(c, chain[i - 1].id));
        assert.equal((t as { when?: string }).when, want ?? undefined, `${c.title} ${t.id}`);
        if (chain[i - 1].id.startsWith('d_')) assert.equal(want, t.id === 'mRa' ? 'ruru_led' : `door_${chain[i - 1].id}`, `${t.id}: 문 다음`);
      }
    }
    // ruru_led 는 소파 밑에 처음 들어선 장면에서만 선다 (문을 지나야)
    const setters = (cmds: readonly Cmd[]) => flat(cmds).some((x) => x.t === 'flag' && x.name === 'ruru_led');
    assert.ok(setters(enterOf(ACT7, 'sofa')));
    assert.ok(!thingsOf(ACT7).some((t) => objectScripts(t).some(setters)));
  });

  test('bridge 는 모두 해설 한 줄 (40자 이하, 말하는 이 없음, 줄바꿈 없음)이고, 문과 놀이 단계 말고는 다음으로 잇는 줄이 있다', () => {
    let n = 0;
    for (const c of MY_ACTS)
      for (const [i, s] of c.chain!.entries()) {
        const kind = find(c, s.id).kind;
        if (i < c.chain!.length - 1 && kind !== 'door' && kind !== 'pull' && kind !== 'seq' && kind !== 'spot' && kind !== 'npc') assert.ok(s.bridge, `${c.title} ${s.id}: bridge 없음`);
        if (s.bridge === undefined) continue;
        n++;
        assert.ok(s.bridge.length > 0 && s.bridge.length <= 40, `${s.id}: ${s.bridge.length}자 「${s.bridge}」`);
        assert.ok(!s.bridge.includes('\n'));
        assert.ok(!/^[a-z]+:/.test(s.bridge) && !s.bridge.startsWith('>'), `${s.id}: 해설만`);
      }
    assert.ok(n >= 40, `bridge ${n}줄`);
  });
});

// ───────────────────────── 5. 실제로 걸어 보기 ─────────────────────────

/** 사슬 한 단계를 마친다: 문은 지나고, 기억은 끝 깃발을 세운 셈 (기억 장면 자체는 다른 시험이 본다), 나머지는 실제로 */
function doStep(a: Adv, c: Chapter, id: string): void {
  const t = find(c, id);
  switch (t.kind) {
    case 'door': {
      interact(a, id);
      assert.equal(a.room.id, t.to, `${id} 를 지나 ${t.to}`);
      return;
    }
    case 'memory':
    case 'keepsake':
      assert.ok(visible(a, id), `${a.room.id}: 기억 ${id} 이 보이지 않는다`);
      a.flags[`mem_${id}`] = true;
      a.run(a.bridgeCmds(id));
      finish(a);
      return;
    case 'pull':
      for (let k = 0; k < (t.tugs ?? 1); k++) interact(a, id);
      return;
    case 'seq':
      for (const k of t.order) {
        a.place(px(t.keys[k].at[0]), px(t.keys[k].at[1]));
        a.step(1 / 60, NO_INPUT);
      }
      finish(a);
      return;
    default:
      interact(a, id);
  }
}

describe('5~7막을 처음부터 끝까지: 사슬 차례대로 걸으면 다음 단계가 하나씩 드러나고, 마지막 방의 기억의 문이 다음 막으로', () => {
  for (const c of MY_ACTS)
    test(`${c.title}`, () => {
      const a = begin(c.room);
      assert.equal(a.save.chapter, c.n);
      assert.deepEqual(a.withMe().sort(), (c.party.filter((h) => h !== 'toby') as string[]).sort(), '동료가 늘 함께');
      const chain = c.chain!;
      for (const [i, s] of chain.entries()) {
        const next = chain[i + 1];
        const nt = next ? find(c, next.id) : null;
        // 다음 단계는 (같은 방이면) 이 단계를 마치기 전에 숨어 있다
        if (nt && nt.kind !== 'door' && R(a.room.id).things.includes(nt) && (nt as { when?: string }).when) assert.ok(!visible(a, nt.id), `${s.id} 전에 ${nt.id} 가 보인다`);
        doStep(a, c, s.id);
        const f = doneFlag(find(c, s.id));
        assert.equal(f && a.flags[f], true, `${s.id} 끝 깃발 ${f}`);
        if (nt && nt.kind !== 'door' && a.room.id === roomsOf(c).find((r) => R(r).things.includes(nt))) assert.ok(visible(a, nt.id), `${s.id} 뒤 ${nt.id} 가 드러나야 한다`);
      }
      assert.equal(a.chainNext(), null);
      // 마지막 방의 기억이 다 모였으니 기억의 문이 열리고, 다음 막으로
      assert.equal(a.room.id, roomsOf(c).at(-1));
      assert.deepEqual(a.memories().got, a.memories().total);
      const link = a.things().find((t) => t.kind === 'link')!;
      interact(a, link.id);
      assert.equal(a.save.chapter, c.n + 1, '다음 막');
    });

  test('잠긴 문: 책가방의 「책상 위로」는 앞주머니 편지 전에는 루루의 말만 하고 방이 그대로, 열린 뒤 처음 지나면 떠나기 전 · 책상에 들어선 장면', () => {
    const a = begin('schoolbag');
    const before = interact(a, 'd_bag_desk');
    assert.deepEqual(before, ['가방 속 얘기가 아직 남았어.']);
    assert.equal(a.room.id, 'schoolbag');
    a.flags.mem_mJf = true;
    const lines = interact(a, 'd_bag_desk');
    const i = lines.indexOf('거기서부터야. 별도, 소원도.');
    const j = lines.findIndex((l) => l.startsWith('새벽 한 시 반.'));
    assert.ok(i >= 0 && j > i, lines.join(' / '));
    assert.equal(a.room.id, 'desk');
    assert.deepEqual(cellOf(a), [4, 18]);
    assert.equal(a.flags.enter_desk, true);
    assert.equal(a.flags.gap_g9pencil, true, '자 다리는 늘 놓여 있다 (preset)');
  });

  test('다 같이 지퍼: 세 번째 당김에야 열리고, 그 전에는 도시락(mJa)이 숨어 있다', () => {
    const a = begin('schoolbag');
    interact(a, 'zipper');
    interact(a, 'zipper');
    assert.equal(a.flags.zip_open, undefined);
    assert.ok(!visible(a, 'mJa'));
    interact(a, 'zipper');
    assert.equal(a.flags.zip_open, true);
    assert.ok(visible(a, 'mJa'));
    assert.ok(!visible(a, 'mJb'), '만두 별은 도시락 기억 뒤');
  });

  test('필통 사람들은 고르기 없이 수다로 비켜선다 (셋 다 듣고 나면 pencils_ok)', () => {
    const a = begin('schoolbag');
    a.flags.zip_open = true;
    for (const id of ['pc_mong', 'pc_mal']) interact(a, id);
    assert.equal(a.flags.pencils_ok, undefined);
    const last = interact(a, 'pc_ban');
    assert.ok(last.includes('친구 물건은 허락 받고 볼게.'));
    assert.equal(a.flags.pencils_ok, true);
  });

  test('색종이 자매: 스탠드가 꺼져 있어도 보리가 켜고 별 하나를 접는다 (folded → 천 장 하고 한 장)', () => {
    const a = begin('desk');
    a.flags.mem_m5b = true;
    assert.equal(a.flags.lamp_on, undefined);
    assert.ok(!visible(a, 'm5g'));
    interact(a, 'paper');
    assert.equal(a.flags.lamp_on, true);
    assert.equal(a.flags.folded, true);
    assert.ok(visible(a, 'm5g'));
  });

  test('오르골: 틀린 음부터 밟으면 열리지 않고, 미 · 솔 · 라 차례로 밟아야 오르골 기억이 드러난다', () => {
    const a = begin('drawer');
    const mb = find(ACT7, 'musicbox');
    assert.ok(mb.kind === 'seq');
    const wrong = mb.keys.findIndex((_, k) => !mb.order.includes(k));
    a.place(px(mb.keys[wrong].at[0]), px(mb.keys[wrong].at[1]));
    a.step(1 / 60, NO_INPUT);
    finish(a);
    for (const k of mb.order.slice(1)) {
      a.place(px(mb.keys[k].at[0]), px(mb.keys[k].at[1]));
      a.step(1 / 60, NO_INPUT);
    }
    finish(a);
    assert.equal(a.flags.musicbox_half, undefined, '첫 음을 건너뛰면 안 된다');
    assert.ok(!visible(a, 'm7d'));
    doStep(a, ACT7, 'musicbox');
    assert.equal(a.flags.musicbox_half, true);
    assert.ok(visible(a, 'm7d'));
  });

  test('소파 밑에 처음 들어서면 루루가 앞장서 아지트까지 안내하고 다시 무리에 낀다 (ruru_led), 토비는 걸을 수 있는 칸에', () => {
    const a = begin('drawer');
    a.flags.door_d_drawer_balc = true;
    a.enterRoom('balcony');
    finish(a);
    a.flags.mem_mVg = true;
    interact(a, 'd_balc_sofa');
    assert.equal(a.room.id, 'sofa');
    assert.equal(a.flags.ruru_led, true);
    assert.equal(a.flags.enter_sofa, true);
    assert.ok(a.withMe().includes('ruru'), '루루가 다시 함께');
    assert.equal(a.stage.actors.ruru_lead, undefined, '앞장서던 루루 그림은 무리의 루루가 된다');
    const [x, y] = cellOf(a);
    assert.ok(!isSolidChar(a.room.tiles[y][x]), `토비 (${x},${y})`);
    assert.ok(visible(a, 'mRa'));
  });

  test('늑대 손인형: 대본 공책 기억 뒤에야 보이고, 착한 역을 주면 커튼 끈을 놓는다 → 나비와 무대 불 → 토비 극장 기억', () => {
    const a = begin('shelf');
    assert.ok(!visible(a, 'wolf'));
    assert.ok(!visible(a, 'stage_lamp'));
    a.flags.mem_m6e = true;
    interact(a, 'wolf');
    assert.equal(a.flags.curtain_open, true);
    assert.ok(!visible(a, 'm6c'));
    interact(a, 'stage_lamp');
    assert.equal(a.flags.lamp_stage_lamp, true);
    assert.ok(visible(a, 'm6c'));
  });
});
