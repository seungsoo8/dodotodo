/**
 * 이야기 깊이 (STORYDEPTH) 갈래 3: 15~20장 · 새벽 · 에필로그.
 * 대본 데이터로 본다: 반전(숨은 손)은 20장 기억의 문에서만 터지고, 그 단서는 17 · 20장에 깔리며,
 * 막간(태엽 할머니 혼자) · 떡밥 회수(2917 · 꿀사탕 · 오르골 · 추신 · 모퉁이 공책) · 에필로그 「…이천구백십팔」이 제자리에 있다.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { isMemory } from '../adv.ts';
import { ROOMS } from '../story/index.ts';
// 막 구조: 옛 장 단위 시험은 막의 방마다 (그 방에 들어설 때의 장면 · 그 방의 시각)
import { ROOM_CHAPTERS as CHAPTERS } from './acthelp.ts';
import { ITEM_KINDS, itemSprite } from '../../../ui/art/items.ts';
import type { Chapter, Cmd, RoomDef, Thing } from '../types.ts';

type Say = Extract<Cmd, { t: 'say' }>;

const flat = (cmds: readonly Cmd[]): Cmd[] => cmds.flatMap((c) => (c.t === 'if' ? [c, ...flat(c.then), ...flat(c.else ?? [])] : [c]));
const says = (cmds: readonly Cmd[]): Say[] => flat(cmds).filter((c): c is Say => c.t === 'say');
const room = (id: string): RoomDef => ROOMS[id]();
const chapterOf = (id: string): Chapter => CHAPTERS.find((c) => c.room === id)!;
const thing = (r: string, id: string): Thing => {
  const t = room(r).things.find((x) => x.id === id);
  assert.ok(t, `${r} 에 ${id} 가 없다`);
  return t;
};
const sceneOf = (r: string, id: string): Cmd[] => {
  const t = thing(r, id);
  return 'scene' in t && t.scene ? t.scene : [];
};
const afterOf = (r: string, id: string): { after: Cmd[]; aside: Cmd[] } => {
  const t = thing(r, id);
  assert.ok(isMemory(t));
  return { after: t.after ?? [], aside: t.aside?.text ?? [] };
};
const idx = (cmds: readonly Cmd[], f: (c: Cmd) => boolean): number => cmds.findIndex(f);
const sayIdx = (cmds: readonly Cmd[], re: RegExp, who?: string): number => idx(cmds, (c) => c.t === 'say' && re.test(c.text) && (who === undefined || c.who === who));

/** 방 하나의 모든 대본 (장 도입 · 물건 · 감상 · 옮긴 감상 · 걷는 기억 · 잠김 · 동료 자리 말) */
function scriptsOf(r: RoomDef): { where: string; cmds: Cmd[] }[] {
  const out: { where: string; cmds: Cmd[] }[] = [];
  for (const t of r.things) {
    if ('scene' in t && t.scene) out.push({ where: `${r.id}/${t.id}`, cmds: t.scene });
    if (t.kind === 'link') out.push({ where: `${r.id}/${t.id}:locked`, cmds: t.locked });
    if (isMemory(t)) {
      if (t.after) out.push({ where: `${r.id}/${t.id}:after`, cmds: t.after });
      if (t.aside) out.push({ where: `${r.id}/${t.id}:aside`, cmds: t.aside.text });
      if (t.explore) {
        out.push({ where: `${r.id}/${t.id}:walk`, cmds: t.explore.intro ?? [] });
        for (const x of [...t.explore.threads, ...(t.explore.looks ?? [])]) out.push({ where: `${r.id}/${t.id}:walk`, cmds: x.text });
      }
    }
  }
  for (const [who, h] of Object.entries(r.hangouts ?? {})) if (h?.talk) out.push({ where: `${r.id}/hangout:${who}`, cmds: h.talk });
  return out;
}
const everyScript = (): { where: string; cmds: Cmd[] }[] => [
  ...CHAPTERS.map((c) => ({ where: `${c.room}:intro`, cmds: c.intro })),
  ...Object.values(ROOMS).flatMap((f) => scriptsOf(f())),
];

// ───────────────────────── 반전: 숨은 손은 20장 기억의 문에서 한 번에 ─────────────────────────

describe('반전 (태엽 할머니가 토비를 감아 왔다) 은 20장 기억의 문에서만 터진다', () => {
  const lG = sceneOf('sewbox', 'lG');
  /** 반전과 「나눠 맡김」을 말로 하는 줄 */
  const REVEAL = [/하루가 울던 밤에만/, /끼릭 세 번도/, /숨바꼭질은… 할머니처럼/, /다 한 명씩이었네/, /자기를 조금씩 나눠 두고/, /네 등에 남은 것도, 다 할머니 태엽/];

  test('반전의 줄은 저마다 이야기 전체에서 할머니의 바늘(lG) 한 곳에만 있다', () => {
    for (const re of REVEAL) {
      const at = everyScript().filter((s) => says(s.cmds).some((c) => re.test(c.text))).map((s) => s.where);
      assert.deepEqual(at, ['sewbox/lG'], `${re} 이 나오는 곳`);
    }
  });

  test('기억의 문 안에서: 장부(나눠 맡김) → 고요(@music none) → 「끼릭 세 번도요?」 → 보라 실이 소매로 → 고백, 모두 맞추기(@mini) 앞', () => {
    const ledger = sayIdx(lG, /다 한 명씩이었네/);
    const silence = idx(lG, (c) => c.t === 'music' && c.track === null);
    const ask = sayIdx(lG, /끼릭 세 번도/, 'ruru');
    const thread = sayIdx(lG, /보라 실 한 올.*소매로 이어져/, '');
    const confess = sayIdx(lG, /하루가 울던 밤에만/, 'doll');
    const mini = idx(lG, (c) => c.t === 'mini');
    assert.ok(ledger >= 0 && silence >= 0 && ask >= 0 && thread >= 0 && confess >= 0 && mini >= 0, `${ledger} ${silence} ${ask} ${thread} ${confess} ${mini}`);
    assert.ok(ledger < silence && silence < ask && ask < thread && thread < confess && confess < mini);
    // 동료 넷이 저마다 맡은 것을 한 줄씩
    for (const who of ['nabi', 'ruru', 'bori', 'toby']) assert.ok(says(lG.slice(0, ask)).some((c) => c.who === who && /^…?나한텐/.test(c.text)), `${who} 의 장부 줄`);
    // 기억의 문 지문은 그 상징물에 맞는 한 줄 (시스템 문장 아님)
    assert.ok(sayIdx(lG, /^마지막 바늘땀이 남아 있다\.$/, '') === mini - 1);
    assert.equal(sayIdx(lG, /상징물에 깃든 기억/), -1);
  });

  test('20장 앞의 감상은 반전을 앞질러 말하지 않는다 (mGc 는 「조금 이따가」로 미루고, m9e · mOf 의 앞지른 줄은 없다)', () => {
    const gc = afterOf('sewbox', 'mGc');
    const all = says([...gc.after, ...gc.aside]);
    assert.ok(!all.some((c) => /태엽 좀 감아 주렴/.test(c.text)));
    assert.equal(all.at(-1)?.text, '…그건, 조금 이따가.');
    const e = afterOf('toybox', 'm9e');
    assert.ok(!says([...e.after, ...e.aside]).some((c) => /태엽 할머니로/.test(c.text)));
    const f = afterOf('cupboard', 'mOf');
    assert.ok(!says([...f.after, ...f.aside]).some((c) => c.who === 'toby'), '토비는 아직 mGe 를 보지 않았다');
  });
});

// ───────────────────────── 단서: 17 · 20장 ─────────────────────────

describe('숨은 손의 단서가 17 · 20장에 깔린다', () => {
  test('17장 mTd: 「처음 한 해는 아무 소리도 없었다」 · 「언젠가부터」 끼릭 (엄마는 한 번뿐)', () => {
    const d = afterOf('tobykey', 'mTd');
    const text = says([...d.after, ...d.aside]).map((c) => c.text).join('\n');
    assert.match(text, /처음 한 해는 아무 소리도 없었어/);
    assert.match(text, /언젠가부터/);
    assert.match(text, /엄마가 감아 준 건 딱 한 번/);
  });

  test('17장 mTe: 아무도 안 감았는데 돈 끼릭 바로 앞에, 등 뒤를 스친 털실', () => {
    const sc = sceneOf('tobykey', 'mTe');
    const yarn = sayIdx(sc, /털실 같은 것이 아주 가볍게 스쳤다/, '');
    const tick = sayIdx(sc, /아무도 감지 않았는데 내 태엽이 한 칸 돌았다/, '');
    assert.ok(yarn >= 0 && tick > yarn);
  });

  test('17장 mTf: 남긴 감상은 토비의 (틀린) 답 두 줄, 옮긴 감상은 보리의 의심부터', () => {
    const f = afterOf('tobykey', 'mTf');
    assert.deepEqual(says(f.after).map((c) => c.who), ['toby', 'toby']);
    const first = says(f.aside)[0];
    assert.equal(first.who, 'bori');
    assert.match(first.text, /우는 소리만으로 태엽이 감겨/);
  });

  test('17장 기억의 문: 리본에 보라 털실 · 「저 혼자 돌았다」 마법 설명은 없다', () => {
    const lT = sceneOf('tobykey', 'lT');
    assert.ok(sayIdx(lT, /보라색 털실 한 올/, '') >= 0);
    assert.equal(sayIdx(lT, /저 혼자 돌았다/), -1);
    assert.equal(sayIdx(lT, /어디선가 울고 있나 봐/), -1);
  });

  test('20장 도입: 풀린 소매 · 토비를 한 칸 감음(@wind 가 장의 태엽보다 크게) · 「먼지를 털었지」', () => {
    const ch = chapterOf('sewbox');
    const intro = flat(ch.intro);
    assert.ok(sayIdx(intro, /소매가 손목까지 풀려 있다/, '') >= 0);
    const w = intro.find((c): c is Extract<Cmd, { t: 'wind' }> => c.t === 'wind');
    assert.ok(w && w.v > ch.wind, `@wind ${w?.v} > ${ch.wind}`);
    const lie = sayIdx(intro, /먼지를 털었지/, 'doll');
    assert.ok(lie > intro.indexOf(w));
  });

  test('20장 mGc: 할머니가 인형을 만든 밤, 자기 태엽을 덜어 인형을 세 번 감는다', () => {
    const sc = sceneOf('sewbox', 'mGc');
    const give = sayIdx(sc, /할머니 태엽 조금 나눠 주마/, 'gm');
    const save = sayIdx(sc, /할머니는 못 아꼈지만/, 'gm');
    assert.ok(give >= 0 && save > give);
    assert.equal(sc.slice(give, save).filter((c) => c.t === 'sfx' && c.name === 'windTick').length, 3);
  });

  test('20장 mGd: 할머니의 두려움 한 줄은 쓰다가 구겨진다 (편지에는 없다)', () => {
    const sc = sceneOf('sewbox', 'mGd');
    const fear = sayIdx(sc, /사실 할머니는 무섭단다/, 'gm');
    assert.ok(fear >= 0);
    assert.ok(sc.slice(fear).some((c) => c.t === 'sfx' && c.name === 'crumple'));
    assert.equal(sayIdx(chapterOf('attic_dawn').intro, /무섭단다/), -1);
  });

  test('20장 감상: mGe 둘째 줄은 「감아 주라는 거였어」, mGb 는 9장 루루의 물음을 매듭짓는다 (교훈 줄 없음)', () => {
    const e = afterOf('sewbox', 'mGe');
    assert.equal(says(e.after)[1]?.text, '감아 달라는 게 아니었어. 감아 주라는 거였어.');
    const b = afterOf('sewbox', 'mGb');
    const all = says([...b.after, ...b.aside]);
    assert.ok(!all.some((c) => /무거운 사랑/.test(c.text)));
    assert.ok(all.some((c) => c.who === 'ruru' && /조금만 더 오래/.test(c.text)));
  });
});

// ───────────────────────── 15 · 16 · 17 · 18 · 19장의 고비 ─────────────────────────

describe('장마다 고비와 떡밥 회수', () => {
  test('16장 기억의 문: 토비의 위기(「안 가는 게 나을지도」) → 루루가 화낸다(「덤도 아닌 게?」) → 「…응.」, 모두 맞추기 앞', () => {
    const lOut = sceneOf('outside', 'lOut');
    const crisis = sayIdx(lOut, /우리가 안 가는 게, 하루한테 나을지도/, 'toby');
    const angry = idx(lOut, (c) => c.t === 'say' && c.who === 'ruru' && c.mood === 'angry');
    const dum = sayIdx(lOut, /덤도 아닌 게\?/, 'ruru');
    const yes = sayIdx(lOut, /^…응\.$/, 'toby');
    const mini = idx(lOut, (c) => c.t === 'mini');
    assert.ok(crisis >= 0 && crisis < angry && angry < dum && dum < yes && yes < mini, `${crisis} ${angry} ${dum} ${yes} ${mini}`);
  });

  test('17장: 숫자판 「2917」은 「나중에」로 미루고, 기억의 문에서 「오늘 제일 좋았던 거」 횟수로 거둔다 (2916 번은 있었다)', () => {
    assert.ok(sayIdx(sceneOf('tobykey', 'o_tb_count'), /나중에 말해 줄게/, 'toby') >= 0);
    const lT = sceneOf('tobykey', 'lT');
    const n = sayIdx(lT, /이천구백십칠/, 'toby');
    const what = sayIdx(lT, /「오늘 제일 좋았던 거」를 들은 횟수/, 'toby');
    const had = sayIdx(lT, /이천구백십육 번은, 있었어/, 'toby');
    assert.ok(n >= 0 && n < what && what < had && had < idx(lT, (c) => c.t === 'mini'));
  });

  test('18장 도입: 하루의 잠꼬대 「…토비…」, m9c 옮긴 감상에 「깨어난 거야」 답은 없다', () => {
    const intro = chapterOf('toybox').intro;
    assert.ok(sayIdx(intro, /^…토비…$/, 'haru') >= 0);
    const c = afterOf('toybox', 'm9c');
    assert.ok(!says([...c.after, ...c.aside]).some((x) => /깨어난 거야/.test(x.text)));
  });

  test('19장: 보리의 돌아섬(맡기는 짐 · 곰돌이 이름) · 기억의 문에서 꿀사탕은 「까치밥」', () => {
    const f = afterOf('cupboard', 'mOf');
    const text = says([...f.after, ...f.aside]).map((c) => c.text).join('\n');
    assert.match(text, /맡기는 짐/);
    assert.match(text, /곁에 없었어/);
    const lO = sceneOf('cupboard', 'lO');
    const candy = sayIdx(lO, /까치밥/, 'bori');
    assert.ok(candy >= 0 && candy < idx(lO, (c) => c.t === 'mini'));
    assert.equal(sayIdx(lO, /꿀단지는… 돌아와서/), -1);
  });

  test('보리의 먹보 농담은 19장 도입 · 기억의 문부터 새벽 장까지 없고, 에필로그 도입에서 돌아온다', () => {
    const FOOD = /배고파|배고프다|먹고 싶|맛있겠|맛있는|안 멈춘다고 약속은/;
    const quiet = [
      ...says(chapterOf('cupboard').intro),
      ...says(sceneOf('cupboard', 'lO')),
      ...scriptsOf(room('sewbox')).flatMap((s) => says(s.cmds)),
      ...says(chapterOf('sewbox').intro),
      ...says(chapterOf('attic_dawn').intro),
    ].filter((c) => c.who === 'bori');
    assert.ok(quiet.length >= 10, `보리 대사 ${quiet.length}줄`);
    for (const c of quiet) assert.ok(!FOOD.test(c.text), `먹보 농담: ${c.text}`);
    assert.ok(says(chapterOf('newroom_toy').intro).some((c) => c.who === 'bori' && FOOD.test(c.text)), '에필로그에서 돌아온다');
  });

  test('15장 도입의 「고양이는 비를 싫어해」 버릇은 없다, 루루의 「안 흔들렸거든」은 15장부터 없다', () => {
    assert.equal(sayIdx(chapterOf('yard').intro, /고양이는 비를 싫어해/), -1);
    for (const id of ['yard', 'outside', 'tobykey', 'toybox', 'cupboard', 'sewbox', 'attic_dawn', 'newroom_toy']) {
      const all = [...says(chapterOf(id).intro), ...scriptsOf(room(id)).flatMap((s) => says(s.cmds))];
      assert.ok(!all.some((c) => c.who === 'ruru' && /안 흔들렸거든|안 처졌거든/.test(c.text)), id);
    }
  });
});

// ───────────────────────── 막간: 혼자 남은 다락 ─────────────────────────

describe('다락의 막간 (15 · 19장 기억의 문 끝): 상자 안의 태엽 할머니 목소리만', () => {
  for (const [r, link, line] of [['yard', 'l8', /그다음은, 하루가 불러야지/], ['cupboard', 'lO', /먼저 그만하자고 해도 될까요/]] as const) {
    test(`${r} ${link}: 맞추기와 깃발 뒤 · 다음 장 앞에, 사람 크기 다락에서, 말하는 이는 태엽 할머니와 지문뿐`, () => {
      const sc = sceneOf(r, link);
      const flag = idx(sc, (c) => c.t === 'flag');
      const atticAt = idx(sc, (c) => c.t === 'room' && c.id === 'h_attic');
      const next = idx(sc, (c) => c.t === 'next');
      assert.ok(flag >= 0 && flag < atticAt && atticAt < next, `${flag} ${atticAt} ${next}`);
      const inside = sc.slice(atticAt, next);
      assert.ok(inside.some((c) => c.t === 'item' && c.kind === 'boxTaped'), '테이프 붙인 상자');
      const voices = new Set(says(inside).map((c) => c.who));
      assert.deepEqual([...voices].sort(), ['', 'doll']);
      assert.ok(sayIdx(inside, line, 'doll') >= 0);
    });
  }

  test('막간 ③의 오르골 노래는 몇 초 만에 끊긴다 (끝까지 흐르는 건 새벽 한 번)', () => {
    const sc = sceneOf('yard', 'l8');
    const box = idx(sc, (c) => c.t === 'music' && c.track === 'box');
    const cut = idx(sc, (c) => c.t === 'music' && c.track === null && sc.indexOf(c) > box);
    assert.ok(box >= 0 && cut > box);
    assert.ok(!says(sc.slice(box, cut)).some((c) => c.who !== ''), '노래 도중엔 아무도 말하지 않는다');
    const end = flat(chapterOf('attic_dawn').intro);
    const dawnBox = idx(end, (c) => c.t === 'music' && c.track === 'box');
    const dawnCut = end.findIndex((c, i) => i > dawnBox && c.t === 'music');
    const done = sayIdx(end, /이렇게 끝나지/, 'haru');
    assert.ok(dawnBox >= 0 && dawnBox < done && done < dawnCut, '새벽엔 하루가 끝을 기억해 낸 뒤에야 멈춘다');
  });
});

// ───────────────────────── 장 시각 ─────────────────────────

/** 「새벽 네 시 사십 분」 → 'HH:MM' (없으면 null) */
function koreanClock(text: string): string | null {
  const H: Record<string, number> = { 한: 1, 두: 2, 세: 3, 네: 4, 다섯: 5, 여섯: 6, 일곱: 7 };
  const m = /(한|두|세|네|다섯|여섯|일곱) 시(?: (\S+) 분)?/.exec(text);
  if (!m) return null;
  const word = m[2] ?? '';
  const tens = word.includes('십') ? ({ '': 1, 이: 2, 삼: 3, 사: 4, 오: 5 } as Record<string, number>)[word.split('십')[0]] : 0;
  const ones = ({ '': 0, 오: 5 } as Record<string, number>)[word.includes('십') ? word.split('십')[1] : word];
  if (tens === undefined || ones === undefined) return null;
  return `${String(H[m[1]]).padStart(2, '0')}:${String(tens * 10 + ones).padStart(2, '0')}`;
}

describe('장 시각: 지문 속 시각은 그 장의 밤 시계와 같다', () => {
  test('시각 읽기 (결곗값: 정각 · 오 분 · 오십 분, 없는 말은 null)', () => {
    assert.equal(koreanClock('새벽 다섯 시. 다락방'), '05:00');
    assert.equal(koreanClock('새벽 네 시 오 분.'), '04:05');
    assert.equal(koreanClock('새벽 세 시 오십 분.'), '03:50');
    assert.equal(koreanClock('새벽 네 시 사십 분.'), '04:40');
    assert.equal(koreanClock('다락방. 둥근 창'), null);
  });

  for (const id of ['yard', 'outside', 'tobykey', 'toybox', 'cupboard', 'sewbox', 'attic_dawn']) {
    test(`${id}: 도입 첫 지문이 시각으로 시작하고 chapter.clock 과 같다`, () => {
      const ch = chapterOf(id);
      const first = says(ch.intro).find((c) => c.who === '');
      assert.ok(first && /^새벽 /.test(first.text), first?.text);
      assert.equal(koreanClock(first.text), ch.clock);
    });
  }
});

// ───────────────────────── 20장 오르골 · 새벽 · 에필로그 ─────────────────────────

describe('새벽 장: 스무 장의 줄을 거둔다', () => {
  const end = flat(chapterOf('attic_dawn').intro);

  test('20장 오르골: 토비가 태엽을 덜어 감는다 (도입에서 감긴 만큼으로 할 수 있다), 뚜껑은 하루가 열 때', () => {
    const o = thing('sewbox', 'orgel');
    assert.equal(o.kind, 'windup');
    if (o.kind !== 'windup') return;
    assert.equal(o.look, 'musicbox');
    const w = flat(chapterOf('sewbox').intro).find((c): c is Extract<Cmd, { t: 'wind' }> => c.t === 'wind');
    assert.ok(w && o.cost > 0 && o.cost <= w.v);
    assert.ok(sayIdx(o.scene, /하루가 열 때/, 'doll') >= 0);
  });

  test('장난감 다락: 요약 · 교훈 대사 대신 물건 넷, 뻐꾹 영감의 「정각」, 루루의 「데려가 줘」', () => {
    for (const re of [/슬픔이 너무 크면/, /우리를 잊은 게 아니었어요/, /상자째로 두고 간다는데/]) assert.equal(sayIdx(end, re), -1, `${re}`);
    assert.ok(sayIdx(end, /정각이다/, 'cuckoo') >= 0);
    assert.ok(sayIdx(end, /꿀사탕.*반짝이 실.*오르골/, '') >= 0);
    assert.ok(sayIdx(end, /이번엔… 숨기지 않고/, 'doll') >= 0);
    const take = sayIdx(end, /데려가 줘/, 'ruru');
    const freeze = sayIdx(end, /^얼음!$/, 'toby');
    assert.ok(take >= 0 && take < freeze);
  });

  test('사람 다락: 상자 위 물건 그림은 모두 그림 목록에 있다 (꿀사탕 · 실 · 오르골)', () => {
    const items = end.filter((c): c is Extract<Cmd, { t: 'item' }> => c.t === 'item' && !!c.at);
    for (const k of ['paperstar', 'candy', 'yarn', 'musicbox']) assert.ok(items.some((c) => c.kind === k), k);
    for (const c of items) assert.ok((ITEM_KINDS as readonly string[]).includes(c.kind), c.kind);
  });

  test('하루가 보라 실을 보고 → 빨간 실로 소매를 꿰매고 → 인형을 하나 · 둘 · 셋 감는다', () => {
    const purple = sayIdx(end, /보라색 실 한 올.*리본/, '');
    const sleeve = sayIdx(end, /빨간 바늘땀/, '');
    const one = sayIdx(end, /^너도\. 하나\.$/, 'haru');
    const three = sayIdx(end, /^셋\.$/, 'haru');
    assert.ok(purple >= 0 && purple < sleeve && sleeve < one && one < three);
    assert.equal(end.slice(one, three + 2).filter((c) => c.t === 'sfx' && c.name === 'windTick').length, 3);
  });

  test('쪽지 · 편지: 「가져가는 짐」은 순이의 말, 추신에 다섯 이름, 웃음 끝에 울음, 아빠의 「의자도 실었다」', () => {
    const keep = sayIdx(end, /^가져가는… 짐\.$/, 'haru');
    assert.ok(sayIdx(end, /순이가 이사할 때마다 곰돌이 상자에/, '') === keep + 1);
    const ps = sayIdx(end, /추신\. 토비야, 보리야, 루루야, 나비야\. 그리고 태엽 할머니/, '');
    const laugh = idx(end, (c, ) => c.t === 'act' && c.who === 'haru' && c.name === 'laugh' && end.indexOf(c) > ps);
    const cry = idx(end, (c) => c.t === 'pose' && c.who === 'haru' && c.pose === 'cry');
    assert.ok(ps >= 0 && ps < laugh && laugh < cry, `${ps} ${laugh} ${cry}`);
    assert.ok(sayIdx(end, /할머니 의자도 실었다/, 'dad') > cry);
  });

  test('골목 모퉁이: 편지 뒤 · 에필로그 앞, 지우가 「웃은 횟수」 공책을 건네고 하루가 먼저 사과한다', () => {
    const corner = idx(end, (c) => c.t === 'room' && c.id === 'm_out_alley_d');
    const letter = idx(end, (c) => c.t === 'music' && c.track === 'finale');
    const next = idx(end, (c) => c.t === 'next');
    assert.ok(letter >= 0 && letter < corner && corner < next);
    const part = end.slice(corner, next);
    assert.ok(part.some((c) => c.t === 'show' && c.who === 'jiwoo'));
    const sorry = sayIdx(part, /미안해/, 'haru');
    const count = sayIdx(part, /네가 웃은 횟수/, 'jiwoo');
    assert.ok(sorry >= 0 && sorry < count);
    assert.ok(sayIdx(part, /^…응\.$/, 'haru') > count);
  });
});

describe('에필로그: 물건이 정리하고, 「…이천구백십팔」로 끝난다', () => {
  const lEP = flat(sceneOf('newroom_toy', 'lEP'));

  test('기억의 문: 설교 대신 한 줄, 밤의 「오늘 제일 좋았던 거」 끝에 토비의 「…이천구백십팔.」, 그 뒤 크레디트 · 끝 깃발', () => {
    assert.equal(sayIdx(lEP, /평생"이란다|누군가 매일 감아 준다는 게 중요한/), -1);
    assert.ok(sayIdx(lEP, /감아 주는 손이 바뀌어도, 태엽은 같은 태엽이에요/, 'toby') >= 0);
    const ask = sayIdx(lEP, /오늘 제일 좋았던 거\.$/, 'haru');
    const n = sayIdx(lEP, /^…이천구백십팔\.$/, 'toby');
    const credits = idx(lEP, (c) => c.t === 'credits');
    assert.ok(ask >= 0 && ask < n && n < credits, `${ask} ${n} ${credits}`);
    const tobyBefore = says(lEP.slice(0, credits)).filter((c) => c.who === 'toby');
    assert.equal(tobyBefore.at(-1)?.text, '…이천구백십팔.');
    assert.deepEqual(lEP.at(-1), { t: 'flag', name: 'ending' });
    assert.ok(sayIdx(lEP.slice(credits), /^…차 조심하고\.$/, 'doll') >= 0);
    assert.ok(sayIdx(lEP.slice(credits), /태엽 할머니도 집어, 세 번 감았다/, '') >= 0);
  });

  test('거둠 살펴보기 다섯: 문틀 · 나비 등불 · 서른째 동전 · 빈 머그잔 둘 · 지우의 공책', () => {
    const want: [string, RegExp][] = [['epFrame', /「토비」/], ['epNabi', /반짝이 실/], ['epCoin', /서른/], ['epTea', /둘 다 마셨어/], ['epNotebook', /바를 정 자/]];
    for (const [id, re] of want) {
      const t = thing('newroom_toy', id);
      assert.equal(t.kind, 'spot', id);
      assert.ok(says(sceneOf('newroom_toy', id)).some((c) => re.test(c.text)), id);
    }
  });

  test('기억 장면: 엄마의 「…응. 짜서.」 · 아빠의 「…비밀.」 · 지우와의 통화 (앨범 한 줄도 지우)', () => {
    assert.ok(sayIdx(sceneOf('newroom_toy', 'mEPb'), /^…응\. 짜서\.$/, 'mom') >= 0);
    assert.ok(sayIdx(sceneOf('newroom_toy', 'mEPe'), /^…비밀\.$/, 'dad') >= 0);
    const f = thing('newroom_toy', 'mEPf');
    assert.ok(isMemory(f));
    assert.equal(f.caption, '지우에게 처음 한 할머니 이야기');
    assert.ok(sayIdx(f.scene, /^지우야\. 나야\.$/, 'haru') >= 0);
  });
});

describe('새 물건 그림: 꿀사탕 · 오르골', () => {
  test('그림 목록에 있고, 비어 있지 않으며, 꾸러미 대체 그림 · 서로와 다르다', () => {
    const parcel = itemSprite('없는물건');
    const same = (p: ReturnType<typeof itemSprite>, q: ReturnType<typeof itemSprite>) => p.w === q.w && p.h === q.h && p.px.every((v, i) => v === q.px[i]);
    for (const k of ['candy', 'musicbox']) {
      assert.ok((ITEM_KINDS as readonly string[]).includes(k), k);
      const p = itemSprite(k);
      assert.ok(p.count() >= 20, `${k} ${p.count()}칸`);
      assert.ok(!same(p, parcel), `${k} 가 꾸러미`);
    }
    assert.ok(!same(itemSprite('candy'), itemSprite('musicbox')));
    // 꿀사탕은 상자보다 훨씬 작다 (손에 쥐는 한 알)
    assert.ok(itemSprite('candy').count() * 3 < itemSprite('box').count());
  });
});
