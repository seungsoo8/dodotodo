/**
 * 막 구조 · 갈래 B (ACTS.md 1~4막): 다락방 · 할머니 방 → 엄마의 화장대 · 침대 밑 → 나비의 이불장 · 거실 창가 → 현관.
 * 실제 STORY 자료를 읽어 지운 놀이가 없고 막마다 놀이 하나만 남았는지, 물음 목표 · 사슬 bridge · 문의 떠나기 전 장면 규칙을 보고,
 * 막 하나하나를 도입 → 사슬 차례대로 (다른 방이면 문으로) → 남긴 놀이 → 마지막 방의 기억의 문 → 다음 막까지 실제로 돌려 본다.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Adv, doneFlag, isMemory, NO_INPUT } from '../adv.ts';
import { CHAPTERS, ROOMS, STORY } from '../story/index.ts';
import { ROOM_CLOCK, ROOM_WIND } from '../story/acts.ts';
import { ATTIC_CHAIN } from '../story/ch1.ts';
import { GRANDROOM_CHAIN } from '../story/ch2.ts';
import { DRESSER_CHAIN } from '../story/ch_dresser.ts';
import { UNDERBED_CHAIN } from '../story/ch3.ts';
import { CLOSET_CHAIN } from '../story/ch_closet.ts';
import { WINDOW_CHAIN } from '../story/ch4.ts';
import { ENTRANCE_CHAIN } from '../story/ch_entrance.ts';
import { parsePuzzleId } from '../mini.ts';
import { px } from '../stage.ts';
import { TILE } from '../../maps.ts';
import type { ChainStep, Chapter, Cmd, RoomDef, Thing } from '../types.ts';

type Door = Extract<Thing, { kind: 'door' }>;

function flat(cmds: readonly Cmd[]): Cmd[] {
  return cmds.flatMap((c) => (c.t === 'if' ? [c, ...flat(c.then), ...flat(c.else ?? [])] : [c]));
}

const built: Record<string, RoomDef> = {};
const R = (id: string): RoomDef => (built[id] ??= ROOMS[id]());
const actN = (n: number): Chapter => {
  const c = CHAPTERS.find((x) => x.title.startsWith(`${n}막 `));
  assert.ok(c, `${n}막`);
  return c;
};

/** 갈래 B 의 막: 방 차례와 방 파일이 내보내는 사슬 */
const MINE: { n: number; rooms: string[]; chains: ChainStep[][] }[] = [
  { n: 1, rooms: ['attic'], chains: [ATTIC_CHAIN] },
  { n: 2, rooms: ['grandroom', 'dresser'], chains: [GRANDROOM_CHAIN, DRESSER_CHAIN] },
  { n: 3, rooms: ['underbed', 'closet'], chains: [UNDERBED_CHAIN, CLOSET_CHAIN] },
  { n: 4, rooms: ['window', 'entrance'], chains: [WINDOW_CHAIN, ENTRANCE_CHAIN] },
];
const ALL_ROOMS = MINE.flatMap((m) => m.rooms);

/** 막에서 지운 놀이 · 감시 (남긴 것은 아래에서 따로 본다) */
const GONE = ['push', 'pad', 'block', 'seq', 'chase', 'watcher', 'gears', 'flow', 'beam', 'mirror', 'charge'];

/** 방 안의 모든 대본 (물건 장면 · 감상 · 문 · 기억의 문 · 걷는 기억 · 동료 자리) */
function scriptsOf(r: RoomDef): { where: string; cmds: Cmd[] }[] {
  const out: { where: string; cmds: Cmd[] }[] = [];
  for (const t of r.things) {
    const at = `${r.id}/${t.id}`;
    if ('scene' in t && t.scene) out.push({ where: at, cmds: t.scene });
    if (isMemory(t)) {
      if (t.after) out.push({ where: `${at}.after`, cmds: t.after });
      if (t.aside) out.push({ where: `${at}.aside`, cmds: t.aside.text });
      if (t.explore) out.push({ where: `${at}.explore`, cmds: [...(t.explore.intro ?? []), ...t.explore.threads.flatMap((x) => x.text), ...(t.explore.looks ?? []).flatMap((x) => x.text)] });
    }
    if (t.kind === 'link') out.push({ where: `${at}.locked`, cmds: t.locked });
    if (t.kind === 'door') out.push({ where: `${at}.first`, cmds: t.first ?? [] }, { where: `${at}.locked`, cmds: t.locked ?? [] });
  }
  for (const [who, h] of Object.entries(r.hangouts ?? {})) if (h?.talk) out.push({ where: `${r.id}/hangout ${who}`, cmds: h.talk });
  return out;
}
const goalsIn = (cmds: readonly Cmd[]): string[] => flat(cmds).flatMap((c) => (c.t === 'goal' && c.text ? [c.text] : []));

/** 물음 목표의 꼴: 「?」 로 끝나고 숫자 · 「기억 조각」 · 「~자」 명령이 없다 */
function assertQuestion(g: string, where: string): void {
  assert.ok(g.trim().endsWith('?'), `${where}: 「${g}」 는 물음이 아니다`);
  assert.ok(!/[0-9]/.test(g), `${where}: 「${g}」 에 숫자`);
  assert.ok(!g.includes('기억 조각'), `${where}: 「${g}」`);
  assert.ok(!/자[\s.!)]*$/.test(g.replace(/\?$/, '')), `${where}: 「${g}」 는 「~자」 명령`);
}

// ───────────────────────── 1. 자료: 지운 것 · 남긴 놀이 하나 ─────────────────────────

describe('1~4막의 방: 미션 놀이를 걷어 내고 막마다 이야기에 뜻이 있는 놀이 하나만', () => {
  test('지운 놀이 (밀기 · 발판 · 순서 발판 · 쫓아가기 · 숨바꼭질 · 빛 꺾기 · 거울 · 충전 · 톱니 · 물길) 와 미끄럼 · 바람 · 낮은 길 속성이 일곱 방 어디에도 없고, 나비 등불은 줄지 않는다', () => {
    for (const id of ALL_ROOMS) {
      const r = R(id);
      const left = r.things.filter((t) => GONE.includes(t.kind)).map((t) => `${t.kind}:${t.id}`);
      assert.deepEqual(left, [], `${id} 에 남은 놀이`);
      const props = r as RoomDef & { slip?: unknown; grip?: unknown; winds?: unknown; low?: unknown };
      for (const k of ['slip', 'grip', 'winds', 'low'] as const) assert.equal(props[k], undefined, `${id}.${k}`);
      if (r.lantern) assert.equal(r.lantern.drain, 0, `${id}: 나비 등불이 줄어든다`);
    }
    // 등불이 있는 두 방 (침대 밑 · 이불장) 은 등불이 그대로 있다 (어둠 속 물건은 나비 곁에서만 보이는 분위기)
    assert.ok(R('underbed').lantern && R('closet').lantern);
  });

  test('막마다 남긴 놀이 하나: 1막 뻐꾸기 태엽 · 2막 엄마 머리맡 휴대폰 · 3막 침대 밑 나비 찾기 · 4막 가족 신발 짝 (그 밖의 당기기 · 맞추기 · 태엽 나눔은 없다)', () => {
    const kinds = (ids: string[], k: string) => ids.flatMap((id) => R(id).things.filter((t) => t.kind === k).map((t) => t.id)).sort();
    // 1막: 태엽 나눔은 뻐꾸기 하나
    assert.deepEqual(kinds(['attic'], 'windup'), ['cuckoo']);
    assert.deepEqual([...kinds(['attic'], 'pull'), ...kinds(['attic'], 'assemble')], []);
    // 2막: 휴대폰 하나를 머리맡에 (부품 하나 · 맞추는 곳 하나)
    assert.deepEqual(kinds(['grandroom', 'dresser'], 'part'), ['mom_phone']);
    assert.deepEqual(kinds(['grandroom', 'dresser'], 'assemble'), ['pillowside']);
    assert.deepEqual([...kinds(['grandroom', 'dresser'], 'pull'), ...kinds(['grandroom', 'dresser'], 'windup')], []);
    // 3막: 놀이 물건 없이, 침대 밑 어둠 속 나비 (말을 걸면 무리에 든다)
    assert.deepEqual([...kinds(['underbed', 'closet'], 'part'), ...kinds(['underbed', 'closet'], 'assemble'), ...kinds(['underbed', 'closet'], 'pull'), ...kinds(['underbed', 'closet'], 'windup')], []);
    const nabi = R('underbed').things.find((t) => t.id === 'nabi_lost');
    assert.ok(nabi && nabi.kind === 'npc' && flat(nabi.scene).some((c) => c.t === 'join' && c.who === 'nabi'));
    // 4막: 가족 신발 넷 → 현관 매트
    assert.deepEqual(kinds(['window', 'entrance'], 'part'), ['shoe_dad', 'shoe_haru', 'shoe_mom', 'shoe_small']);
    assert.deepEqual(kinds(['window', 'entrance'], 'assemble'), ['shoe_mat']);
    assert.deepEqual([...kinds(['window', 'entrance'], 'pull'), ...kinds(['window', 'entrance'], 'windup')], []);
  });

  test('바꾼 것: 루루는 자는 척하다 꼬리를 들키고 · 흰 천 둘과 야광 별판은 살펴보기 · 괘종 씨는 살펴보면 태엽 이야기 · 잠든 사람은 npc', () => {
    const t = (room: string, id: string) => R(room).things.find((x) => x.id === id);
    const ruru = t('attic', 'ruru_sleep');
    assert.ok(ruru && ruru.kind === 'npc' && ruru.pose === 'sleep');
    const rs = flat(ruru.scene);
    assert.ok(rs.some((c) => c.t === 'say' && c.text.includes('꼬리 끝이 몰래 흔들렸다')));
    assert.ok(rs.some((c) => c.t === 'flag' && c.name === 'woke_ruru') && rs.some((c) => c.t === 'join' && c.who === 'ruru'));
    for (const [room, id, flag] of [['grandroom', 'cloth_sew', 'cloth_sew'], ['grandroom', 'cloth_ward', 'cloth_ward'], ['closet', 'glow_board', 'glow_on'], ['window', 'gclock', 'windup_gclock']] as const) {
      const x = t(room, id);
      assert.ok(x && x.kind === 'spot', `${id} 는 살펴보기`);
      assert.ok(flat(x.scene).some((c) => c.t === 'flag' && c.name === flag), `${id} 는 ${flag} 를 세운다`);
    }
    // 재봉틀 천을 걷으면 서랍도 열려 있다 (실 꿰기 놀이 없이)
    const sew = t('grandroom', 'cloth_sew');
    assert.ok(sew && 'scene' in sew && flat(sew.scene ?? []).some((c) => c.t === 'flag' && c.name === 'drawer_open'));
    for (const [room, id, actor] of [['underbed', 'haru_sleep', 'haru15'], ['window', 'dad_sofa', 'dad']] as const) {
      const x = t(room, id);
      assert.ok(x && x.kind === 'npc' && x.actor === actor && x.pose === 'sleep', `${room} ${id}`);
    }
    // 뚜껑문은 사슬 끝 (닫힌 방문 기억 뒤) 에 다 같이 밀어 연다
    const hatch = t('attic', 'hatch_open');
    assert.ok(hatch && hatch.kind === 'trigger' && hatch.when === 'mem_m1c');
    assert.ok(flat(hatch.scene).some((c) => c.t === 'flag' && c.name === 'trap_open'));
  });
});

// ───────────────────────── 2. 목표는 물음 한 줄 ─────────────────────────

describe('목표 줄(@goal)은 미션이 아니라 물음 한 줄', () => {
  test('막 도입마다 물음 하나, 둘째 방에 처음 들어설 때 물음 하나 (ACTS 표의 그 물음)', () => {
    const want: Record<number, [string, string?]> = {
      1: ['하루는 왜 우리를 두고 가려는 걸까?'],
      2: ['할머니 방 문은 왜 두 해 동안 닫혀 있었을까?', '엄마는 어디서 울었을까?'],
      3: ['할머니가 떠난 밤, 하루는 무엇을 상자에 넣었을까?', '나비는 왜 이불장 어둠 속에 있었을까?'],
      4: ['할머니는 정말 괜찮았을까?', '「다녀오겠습니다」 뒤에, 할머니는 무엇을 숨겼을까?'],
    };
    for (const m of MINE) {
      const c = actN(m.n);
      assert.deepEqual(goalsIn(c.intro), [want[m.n][0]], `${c.title} 도입`);
      const second = c.rooms?.[1];
      if (m.rooms.length > 1) assert.deepEqual(goalsIn(second?.enter ?? []), [want[m.n][1]], `${c.title} ${second?.id} 들어선 장면`);
      for (const g of [...goalsIn(c.intro), ...goalsIn(second?.enter ?? [])]) assertQuestion(g, c.title);
    }
  });

  test('방 물건 · 문 · 기억의 문 · 동료 대본에는 목표 줄이 없고, 기억 속 조종 장면 (꿀차 · 병실 · 운동회) 의 목표는 물음으로 바뀌었다', () => {
    const CONTROL: Record<string, string> = {
      m2e: '할머니 꿀단지는 어디 있었더라?',
      m4d: '할머니 병실에는 무엇이 있었더라?',
      mEd: '결승선까지, 끝까지 달릴 수 있을까?',
    };
    const seen: Record<string, string[]> = {};
    for (const id of ALL_ROOMS)
      for (const s of scriptsOf(R(id))) {
        const gs = goalsIn(s.cmds);
        if (!gs.length) continue;
        const mem = s.where.split('/')[1];
        // 기억 장면 안 @control 뒤에서만 (그 기억 속을 직접 걷는 동안)
        const cmds = flat(s.cmds);
        const ctl = cmds.findIndex((c) => c.t === 'control' && c.who !== 'toby');
        assert.ok(ctl >= 0 && cmds.findIndex((c) => c.t === 'goal') > ctl, `${s.where}: 물건 대본에 목표 줄 ${gs.join(' / ')}`);
        seen[mem] = gs;
      }
    assert.deepEqual(seen, Object.fromEntries(Object.entries(CONTROL).map(([k, v]) => [k, [v]])));
    for (const [k, v] of Object.entries(CONTROL)) assertQuestion(v, k);
  });

  test('물음 꼴 검사의 결곗값: 「~자」 명령 · 숫자 · 「기억 조각」 · 물음표 없는 문장은 걸러진다', () => {
    for (const bad of ['상자 밖으로 나가자', '잠든 친구들을 깨우자?', '기억 조각 7개를 찾을까?', '털신에 닿자 (센서등)', '할머니 방'])
      assert.throws(() => assertQuestion(bad, '시험'), assert.AssertionError, bad);
    assert.doesNotThrow(() => assertQuestion('할머니는 정말 괜찮았을까?', '시험'));
  });
});

// ───────────────────────── 3. 사슬 · 문 ─────────────────────────

describe('기억 사슬과 막 안의 문', () => {
  test('막마다 사슬이 있고 (방 파일의 *_CHAIN 을 이어 붙인 것), 그 막 방의 기억이 모두 정확히 한 번씩, 둘째 단계부터 when 은 gate 또는 앞 단계의 끝 깃발', () => {
    for (const m of MINE) {
      const c = actN(m.n);
      const chain = m.chains.flat();
      assert.deepEqual(c.chain, chain, `${c.title}: 막 사슬 = 방 사슬 차례대로`);
      assert.ok(chain.length >= 7, `${c.title}: 사슬 ${chain.length}`);
      const things = m.rooms.flatMap((id) => R(id).things);
      const byId = new Map(things.map((t) => [t.id, t]));
      const mems = things.filter(isMemory).map((t) => t.id).sort();
      assert.deepEqual(chain.filter((s) => isMemory(byId.get(s.id)!)).map((s) => s.id).sort(), mems, `${c.title}: 사슬의 기억`);
      for (let i = 1; i < chain.length; i++) {
        const t = byId.get(chain[i].id)!;
        assert.equal((t as { when?: string }).when, chain[i].gate ?? doneFlag(byId.get(chain[i - 1].id)!), `${c.title} ${t.id}.when`);
      }
      // 둘째 방의 사슬은 그 방으로 들어오는 문 다음에 시작한다
      for (let k = 1; k < m.rooms.length; k++) {
        const head = m.chains[k][0];
        const prevTail = m.chains[k - 1].at(-1)!;
        const door = byId.get(prevTail.id);
        assert.ok(door && door.kind === 'door' && door.to === m.rooms[k], `${c.title}: ${m.rooms[k - 1]} 사슬 끝은 ${m.rooms[k]} 로 가는 문`);
        assert.equal(head.gate, `door_${door.id}`);
      }
    }
  });

  test('bridge 는 모두 「>」 해설 한 줄 (말하는 이 없음 · 40자 이하 · 결론 대사 없음)', () => {
    let n = 0;
    for (const m of MINE)
      for (const s of m.chains.flat()) {
        if (s.bridge === undefined) continue;
        n++;
        assert.ok(s.bridge.length > 0 && s.bridge.length <= 40, `${s.id}: ${s.bridge.length}자 「${s.bridge}」`);
        assert.ok(!s.bridge.includes('\n'), s.id);
        assert.ok(!/^\s*[a-zA-Z_]+\s*:/.test(s.bridge) && !s.bridge.startsWith('>'), `${s.id}: 말하는 이 · 기호 없이 지문 글만`);
      }
    assert.ok(n >= 25, `bridge ${n}줄`);
  });

  test('문: ACTS 표대로 (rect · 도착 칸 · 사슬 깃발 · 잠김 말), 되돌아오는 문은 잠기지 않고, 떠나기 전 장면에는 맞추기 놀이 · 다음 장 넘김 · 흰빛이 없다', () => {
    const table: [string, string, [number, number, number, number], string, [number, number], string | undefined][] = [
      ['grandroom', 'd_gr_dresser', [16, 18, 2, 1], 'dresser', [2, 13], 'mem_m2g'],
      ['dresser', 'd_dresser_gr', [1, 12, 1, 2], 'grandroom', [16, 20], undefined],
      ['underbed', 'd_ub_closet', [1, 15, 3, 1], 'closet', [4, 19], 'mem_m3c'],
      ['closet', 'd_closet_ub', [3, 18, 2, 1], 'underbed', [2, 13], undefined],
      ['window', 'd_win_ent', [34, 14, 1, 2], 'entrance', [3, 5], 'mem_m4e'],
      ['entrance', 'd_ent_win', [1, 4, 1, 2], 'window', [32, 14], undefined],
    ];
    const doors = ALL_ROOMS.flatMap((id) => R(id).things.filter((t): t is Door => t.kind === 'door'));
    assert.deepEqual(doors.map((d) => d.id).sort(), table.map((x) => x[1]).sort());
    for (const [room, id, rect, to, arrive, when] of table) {
      const d = R(room).things.find((t): t is Door => t.kind === 'door' && t.id === id);
      assert.ok(d, `${room} ${id}`);
      assert.deepEqual([d.rect, d.to, d.arrive, d.when], [rect, to, arrive, when], id);
      if (when) assert.ok(d.locked?.length && d.first?.length, `${id}: 잠김 말 · 떠나기 전 장면`);
      const first = flat(d.first ?? []);
      for (const bad of ['mini', 'next', 'album']) assert.ok(!first.some((c) => c.t === bad), `${id}.first 에 @${bad}`);
      assert.ok(!first.some((c) => c.t === 'fade' && c.color === 'white'), `${id}.first 에 흰빛`);
      assert.ok(!first.some((c) => c.t === 'flag' && /^ch\d+_done$|_done$/.test(c.name)), `${id}.first 에 장 끝 깃발`);
    }
  });

  test('기억의 문은 막의 마지막 방에만 하나, 맞추기는 flip1 → order1 → thread1 → photo1', () => {
    const minis: string[] = [];
    for (const m of MINE) {
      const last = m.rooms.at(-1)!;
      for (const id of m.rooms) assert.equal(R(id).things.filter((t) => t.kind === 'link').length, id === last ? 1 : 0, `${m.n}막 ${id}`);
      const link = R(last).things.find((t) => t.kind === 'link')!;
      const sc = flat(link.kind === 'link' ? link.scene : []);
      minis.push(...sc.flatMap((c) => (c.t === 'mini' && parsePuzzleId(c.id) ? [c.id] : [])));
      assert.ok(sc.some((c) => c.t === 'next'), `${m.n}막: 기억의 문이 다음 막으로`);
    }
    assert.deepEqual(minis, ['flip1', 'order1', 'thread1', 'photo1']);
  });

  test('둘째 방에 처음 들어설 때의 장면: 방 이름 · 밤 시각 카드와 옛 장 태엽, 장 제목 카드 · 흰빛은 없다', () => {
    for (const m of MINE.filter((x) => x.rooms.length > 1)) {
      const c = actN(m.n);
      const r = c.rooms![1];
      const enter = r.enter ?? [];
      assert.deepEqual(enter[0], { t: 'title', text: r.name, sub: ROOM_CLOCK[r.id] }, `${r.id} 첫 줄`);
      assert.deepEqual(enter[1], { t: 'wind', v: ROOM_WIND[r.id] }, `${r.id} 태엽`);
      assert.ok(!enter.some((x) => x.t === 'chtitle' || (x.t === 'fade' && x.color === 'white')), `${r.id}: 장 제목 · 흰빛`);
      assert.ok(enter.some((x) => x.t === 'bars' && !x.on), `${r.id}: 띠를 걷는다`);
    }
  });
});

// ───────────────────────── 4. 실제로 돌려 보기 ─────────────────────────

type Log = { text: string; cam: unknown }[];
function finish(a: Adv, log: Log = []): Log {
  for (let i = 0; i < 60 * 600 && (a.runner || a.mini); i++) {
    if (a.mini) a.mini.done = true;
    if (a.stage.choice) a.stage.choice.sel = 0;
    const d = a.stage.dialog;
    if (d && log.at(-1)?.text !== d.text) log.push({ text: d.text, cam: a.stage.cam });
    a.step(1 / 60, { ...NO_INPUT, act: i % 2 === 0 });
  }
  assert.equal(a.runner, null, '대본이 끝나지 않는다');
  return log;
}
const texts = (log: Log) => log.map((l) => l.text);

/** 그 막을 바로 시작해 도입을 끝까지 */
function begin(n: number): Adv {
  const c = actN(n);
  const a = new Adv(STORY);
  a.runner = null;
  (a as unknown as { queue: unknown[] }).queue = [];
  (a as unknown as { applyChapter(n: number): void }).applyChapter(c.n);
  finish(a);
  return a;
}
const interact = (a: Adv, t: Thing): void => (a as unknown as { interact(t: Thing): void }).interact(t);
const visible = (a: Adv, id: string): Thing | undefined => a.things().find((t) => t.id === id);
/** 그 칸에 서서 한 틱 (밟으면 터지는 것이 뜬다) */
function stepOn(a: Adv, x: number, y: number): void {
  a.place(px(x), px(y));
  a.step(1 / 60, NO_INPUT);
}
const cellOf = (a: Adv): [number, number] => [Math.floor(a.stage.actors.toby.x / TILE), Math.floor(a.stage.actors.toby.y / TILE)];

/** 문을 지난다 (rect 문이면 그 칸에 들어선다) */
function useDoor(a: Adv, d: Door, log?: Log): void {
  if (d.rect) {
    stepOn(a, d.rect[0] + d.rect[2] + 1, d.rect[1] + d.rect[3] + 1); // 문 밖에서
    stepOn(a, d.rect[0], d.rect[1]);
  } else interact(a, d);
  finish(a, log);
}

/** 기억 하나: 들여다보고, 걷는 기억 · 직접 움직이는 기억은 끝 깃발을 세워 넘긴다 */
function viewMemory(a: Adv, t: Thing, log?: Log): void {
  interact(a, t);
  finish(a, log);
  for (let k = 0; k < 3 && a.resume; k++) {
    // 실을 다 이었다 · 직접 움직이기를 마쳤다 (끝 깃발) → 대본이 한 번 끝날 때 남은 장면이 흐른다
    a.flags[a.resume.flag] = true;
    a.run([{ t: 'wait', s: 0.01 }]);
    finish(a, log);
  }
}

/** 사슬 한 단계를 마친다 (다른 방이면 먼저 그 방으로 가는 문을 지난다) */
function doStep(a: Adv, id: string, log?: Log): void {
  if (!a.room.things.some((t) => t.id === id)) {
    const home = Object.keys(STORY.rooms).find((r) => ALL_ROOMS.includes(r) && R(r).things.some((t) => t.id === id))!;
    const d = a.room.things.find((t): t is Door => t.kind === 'door' && t.to === home);
    assert.ok(d, `${a.room.id} 에서 ${home} 로 가는 문`);
    useDoor(a, d, log);
    assert.equal(a.room.id, home);
  }
  // 그 물건 곁으로 간다 (나비도 함께 따라와, 어둠 속 물건은 나비 등불 곁에서 보인다)
  const here = a.room.things.find((x) => x.id === id);
  if (here && 'at' in here && here.kind !== 'door') {
    a.place(px(here.at[0]), px(here.at[1]));
    const nb = a.stage.actors.nabi;
    if (nb && a.withMe().includes('nabi')) {
      nb.x = px(here.at[0]);
      nb.y = px(here.at[1]);
    }
  }
  const t = visible(a, id) ?? a.room.things.find((x) => x.id === id && (x.kind === 'trigger' || x.kind === 'door'));
  assert.ok(t, `사슬 ${id} 가 보이지 않는다 (when ${(a.room.things.find((x) => x.id === id) as { when?: string } | undefined)?.when})`);
  switch (t.kind) {
    case 'memory':
    case 'keepsake':
      viewMemory(a, t, log);
      break;
    case 'trigger':
      stepOn(a, t.rect[0], t.rect[1]);
      finish(a, log);
      break;
    case 'door':
      useDoor(a, t, log);
      assert.equal(a.room.id, t.to);
      break;
    case 'assemble':
      // 남긴 놀이: 흩어진 부품을 모두 집어 (한 번에 하나씩 · 무거운 것도 무리가 함께) 맞추는 곳에 놓는다
      for (const p of a.room.things.filter((x): x is Extract<Thing, { kind: 'part' }> => x.kind === 'part' && x.set === t.set)) {
        const q = visible(a, p.id);
        assert.ok(q, `${p.id} 가 보이지 않는다`);
        interact(a, q);
        finish(a, log);
        interact(a, t);
        finish(a, log);
      }
      break;
    default:
      interact(a, t);
      finish(a, log);
  }
  const f = doneFlag(a.room.things.find((x) => x.id === id) ?? t);
  assert.ok(f && a.flags[f], `사슬 ${id} 를 마쳤는데 ${f} 가 없다`);
}

/** 막을 처음부터 끝까지: 도입 → (깨우기) → 사슬 차례대로 → 마지막 방의 기억의 문 → 다음 막 */
function playAct(n: number, before: (a: Adv) => void = () => {}, beforeLink: (a: Adv) => void = () => {}): Adv {
  const c = actN(n);
  const a = begin(n);
  assert.equal(a.room.id, c.room);
  // 모두 따라다닌다
  assert.deepEqual([...a.withMe()].sort(), c.party.filter((h) => h !== 'toby').sort());
  before(a);
  for (const s of c.chain!) {
    const t = [c.room, ...(c.rooms ?? []).map((r) => r.id)].flatMap((r) => R(r).things).find((x) => x.id === s.id)!;
    if (a.flags[doneFlag(t)!]) continue;
    assert.equal(a.chainNext(), s.id, `${c.title}: 다음 단계`);
    doStep(a, s.id);
  }
  assert.equal(a.chainNext(), null);
  beforeLink(a);
  const link = a.room.things.find((t) => t.kind === 'link')!;
  assert.ok(link, `${c.title}: 마지막 방 ${a.room.id} 의 기억의 문`);
  assert.deepEqual(a.memories().got, a.memories().total);
  interact(a, link);
  finish(a);
  assert.equal(a.save.chapter, CHAPTERS[CHAPTERS.indexOf(c) + 1].n, `${c.title} → 다음 막`);
  return a;
}

describe('1~4막을 처음부터 끝까지', () => {
  test('1막: 상자를 나와 테이프 소리 → 보리 꿀사탕 · 뻐꾸기에 태엽 나눠 나비 · 꼬리 들킨 루루 → 사슬 일곱 → 다 같이 뚜껑문 → 바늘 → 2막', () => {
    playAct(1, (a) => {
      // 상자 밖으로 나오기 전에는 테이프 소리 기억이 숨어 있다
      assert.equal(visible(a, 'm1a'), undefined);
      doStep(a, 'out_box');
      assert.equal(a.flags.out_box, true);
      // 깨우기는 사슬 밖의 이야기 장면: 셋을 다 깨워야 엎어 놓은 사진 (m1b)
      doStep(a, 'm1a');
      assert.equal(visible(a, 'm1b'), undefined, '모두 깨우기 전에는 사진이 숨어 있다');
      for (const id of ['candy', 'fan']) {
        interact(a, visible(a, id)!);
        finish(a);
      }
      assert.ok(a.withMe().includes('bori'), '꿀사탕에 깬 보리가 바로 따라온다');
      const wind = a.save.wind;
      interact(a, visible(a, 'cuckoo')!);
      finish(a);
      assert.ok(a.save.wind < wind, '토비가 태엽을 나눠 주었다');
      assert.ok(a.withMe().includes('nabi'));
      interact(a, visible(a, 'ruru_sleep')!);
      const log = finish(a);
      assert.ok(texts(log).some((x) => x.includes('꼬리 끝이 몰래 흔들렸다')));
      assert.equal(a.flags.woke_all, true);
      assert.ok(texts(log).includes('다들 토비 곁에 꼭 붙어 다니렴. 이 밤에 길을 잃으면 안 되니까.'));
      assert.deepEqual([...a.withMe()].sort(), ['bori', 'nabi', 'ruru']);
      assert.equal(a.chainNext(), 'm1b');
      assert.ok(visible(a, 'm1b'));
    }, (a) => {
      assert.equal(a.flags.trap_open, true);
      assert.equal(a.stage.props['trapdoor@13,12']?.state, 'open', '뚜껑문이 열린 그림');
      // 사다리로 내려간다 (루루 밧줄)
      a.place(px(13), px(13));
      interact(a, visible(a, 'ladder')!);
      finish(a);
      assert.deepEqual(cellOf(a), [13, 18]);
    });
  });

  test('2막: 할머니 방 사슬 (흰 천 둘은 살펴보기) → 안방 문 → 엄마의 화장대 → 휴대폰을 머리맡에 → 동백꽃 머리핀 → 3막', () => {
    playAct(2);
  });

  test('3막: 검은 옷 → 어둠 속 나비 찾기 → 침대 밑 사슬 → 이불장 문 (접다 만 별) → 야광 별판 → 이불장 사슬 → 반짝이 실 → 4막', () => {
    playAct(3);
  });

  test('4막: 거실 창가 사슬 → 현관 문 → 현관 사슬 → 가족 신발 넷 → 운동회 · 털신 · 의원 → 운동회 사진 → 5막', () => {
    playAct(4);
  });
});

describe('막 안의 결곗값', () => {
  test('잠긴 문: 사슬 끝 기억을 보기 전에는 잠김 말을 한 번 하고 방이 그대로, 보고 나면 지나가며 떠나기 전 장면 → 둘째 방 도착 칸 → 들어선 장면의 물음', () => {
    const a = begin(2);
    const d = a.room.things.find((t): t is Door => t.id === 'd_gr_dresser')!;
    const log = finish(a);
    stepOn(a, 16, 18);
    finish(a, log);
    assert.equal(a.room.id, 'grandroom');
    assert.ok(texts(log).includes('할머니 방이… 아직 우리한테 할 말이 있는 것 같아.'));
    a.flags.mem_m2g = true;
    stepOn(a, 16, 20);
    const pass: Log = [];
    stepOn(a, 16, 18);
    finish(a, pass);
    assert.equal(a.room.id, 'dresser');
    assert.deepEqual(cellOf(a), d.arrive);
    assert.ok(texts(pass).some((x) => x.includes('엄마 화장대로 가 보자')), '떠나기 전 장면');
    assert.ok(texts(pass).some((x) => x.includes('밤 열한 시 사십오 분')), '들어선 장면');
    assert.equal(a.stage.goal, '엄마는 어디서 울었을까?');
    assert.equal(a.flags.enter_dresser, true);
    // 들어선 방의 사슬 첫 단계 (연습한 웃음) 가 이제 보인다
    assert.ok(visible(a, 'mMb'));
    // 되돌아가는 문은 잠기지 않는다
    stepOn(a, 1, 12);
    finish(a);
    assert.equal(a.room.id, 'grandroom');
    assert.deepEqual(cellOf(a), [16, 20]);
  });

  test('숨은 다음 단계: 기억을 보고 나오면 다음 물건 쪽으로 카메라가 가며 bridge 지문, 그 물건은 그때부터 보인다 (4막 병원 → 할머니 지킴이)', () => {
    const a = begin(4);
    assert.equal(visible(a, 'm4d'), undefined, '병원 기억을 보기 전에는 숨어 있다');
    const log: Log = [];
    viewMemory(a, visible(a, 'm4a')!, log);
    const line = WINDOW_CHAIN[0].bridge!;
    const at = log.find((l) => l.text === line);
    assert.ok(at, 'bridge 지문');
    const m4d = R('window').things.find((t) => t.id === 'm4d')!;
    assert.deepEqual(at.cam, 'at' in m4d ? { x: px(m4d.at[0]), y: px(m4d.at[1]) } : null, '카메라가 다음 물건으로');
    assert.ok(visible(a, 'm4d'));
    assert.equal(a.chainNext(), 'm4d');
  });

  test('신발 짝은 사슬이 거기 닿기 전엔 놓여 있지 않고, 부품 하나만 놓으면 아직 맞춰지지 않는다', () => {
    const a = begin(4);
    a.enterRoom('entrance');
    finish(a);
    assert.equal(visible(a, 'shoe_mom'), undefined);
    a.flags.mem_mEg = true;
    interact(a, visible(a, 'shoe_mom')!);
    finish(a);
    interact(a, visible(a, 'shoe_mat')!);
    finish(a);
    assert.deepEqual(a.assembled('shoe_mat'), { placed: 1, need: 4, done: false });
    assert.equal(a.flags.shoes_paired, undefined);
    assert.equal(visible(a, 'mEd'), undefined);
  });
});
