/**
 * 이야기 깊이 (STORYDEPTH) 갈래 1: 서장 ~ 7장(현관) 과 모든 장에 걸친 되풀이 문장 정리.
 * 대본 데이터를 직접 읽어, 계획서가 바꾸라고 한 줄이 실제로 바뀌었는지 · 깔아야 할 단서가 제자리에 있는지 본다.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { isMemory } from '../adv.ts';
import { CHAPTERS, ROOMS } from '../story/index.ts';
import { ROAD } from '../story/talks.ts';
import type { Chapter, Cmd, RoomDef, Thing } from '../types.ts';

/** 대본 안의 모든 명령 (갈래 속까지) */
function flat(cmds: readonly Cmd[]): Cmd[] {
  return cmds.flatMap((c) => (c.t === 'if' ? [c, ...flat(c.then), ...flat(c.else ?? [])] : [c]));
}

const rooms: Record<string, RoomDef> = Object.fromEntries(Object.entries(ROOMS).map(([k, f]) => [k, f()]));
const chapter = (room: string): Chapter => {
  const c = CHAPTERS.find((x) => x.room === room);
  assert.ok(c, `장 ${room}`);
  return c;
};
const thing = (room: string, id: string): Thing => {
  const t = rooms[room].things.find((x) => x.id === id);
  assert.ok(t, `${room} 의 ${id}`);
  return t;
};

/** 대사 · 지문 글 (말하는 이: 글) */
const lines = (cmds: readonly Cmd[]): string[] => flat(cmds).flatMap((c) => (c.t === 'say' ? [`${c.who}: ${c.text}`] : []));
const text = (cmds: readonly Cmd[]): string => lines(cmds).join('\n');
/** 물건 · 기억의 대본 (장면 · 감상 · 옮긴 감상 · 걷는 기억 · 잠김) 전부 */
function scriptsOf(t: Thing): Cmd[][] {
  const out: Cmd[][] = [];
  if ('scene' in t && t.scene) out.push(t.scene);
  if (isMemory(t) && t.after) out.push(t.after);
  if (isMemory(t) && t.aside) out.push(t.aside.text);
  if (t.kind === 'link') out.push(t.locked);
  if (isMemory(t) && t.explore) out.push(t.explore.intro ?? [], ...t.explore.threads.map((x) => x.text), ...(t.explore.looks ?? []).map((x) => x.text));
  return out;
}
/** 기억이 끝나고 들리는 말 전부 (저절로 남은 감상 + 동료에게 옮긴 감상) */
const afterText = (room: string, id: string): string => {
  const t = thing(room, id);
  assert.ok(isMemory(t), `${id} 는 기억`);
  return text([...(t.after ?? []), ...(t.aside?.text ?? [])]);
};
const sceneText = (room: string, id: string): string => {
  const t = thing(room, id);
  assert.ok('scene' in t && t.scene, `${id} 장면`);
  return text(t.scene);
};
const linkOf = (room: string): Extract<Thing, { kind: 'link' }> => {
  const l = rooms[room].things.find((t) => t.kind === 'link');
  assert.ok(l && l.kind === 'link', `${room} 기억의 문`);
  return l;
};

/** 이 갈래가 맡은 장의 방 (서장 ~ 7장) */
const MINE = ['h_yard_eve', 'attic', 'grandroom', 'dresser', 'underbed', 'closet', 'window', 'entrance'];
const mineText = (room: string): string => text([...chapter(room).intro, ...rooms[room].things.flatMap(scriptsOf).flat()]);

/** 'HH:MM' → 지문 속 한국어 시각 (23:10 → 「열한 시 십 분」, 00:00 → 「열두 시」) */
function koClock(hm: string): string {
  const [h, m] = hm.split(':').map(Number);
  const HOURS = ['열두', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열', '열한'];
  const tens = ['', '십', '이십', '삼십', '사십', '오십'];
  const ones = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  const hour = `${HOURS[h % 12]} 시`;
  return m === 0 ? hour : `${hour} ${tens[Math.floor(m / 10)]}${ones[m % 10]} 분`;
}

const PRO = CHAPTERS.find((c) => c.room === 'h_yard_eve')!;
const DAWN = CHAPTERS.find((c) => c.room === 'attic_dawn')!;
const EXPLORE = CHAPTERS.filter((c) => c !== PRO && c !== DAWN);

describe('이야기 깊이 1 · 모든 장의 되풀이 문장', () => {
  test('기억의 문 시스템 지문 「상징물에 깃든 기억이…」 은 어디에도 없고, 문마다 그 상징물에 맞는 지문 한 줄이 놀이 바로 앞에 있다', () => {
    const seen = new Set<string>();
    for (const c of EXPLORE) {
      const link = linkOf(c.room);
      const cmds = flat(link.scene);
      assert.ok(!text(link.scene).includes('상징물에 깃든'), `${c.title}: 옛 시스템 지문`);
      const mi = cmds.findIndex((x) => x.t === 'mini');
      if (mi < 0) continue;
      const before = cmds.slice(0, mi).filter((x) => x.t === 'say');
      const last = before.at(-1);
      assert.ok(last && last.t === 'say' && last.who === '', `${c.title}: 놀이 바로 앞이 지문이 아니다`);
      assert.ok(last.text.length >= 8, `${c.title}: 지문이 너무 짧다`);
      assert.ok(!seen.has(last.text), `${c.title}: 다른 문과 같은 지문 「${last.text}」`);
      seen.add(last.text);
    }
    assert.ok(seen.size >= 19, `상징물 지문 ${seen.size}개`);
  });

  test('걷는 기억 도입의 「실을 찾자 · 흘러갈 거야」 안내는 1장 첫 걷는 기억(m1a) 한 곳뿐', () => {
    const GUIDE = /실을\s*(다\s*)?(찾|이으|이어)|실 찾|흘러가|흐를 거야|흘러갈/;
    const found: string[] = [];
    for (const r of Object.values(rooms))
      for (const t of r.things) if (isMemory(t) && t.explore && GUIDE.test(text(t.explore.intro ?? []))) found.push(t.id);
    assert.deepEqual(found, ['m1a']);
  });

  test('대사 · 잠김 말에서 「기억 조각」이라는 게임 말이 나오지 않는다 (지문도 마찬가지)', () => {
    const bad: string[] = [];
    for (const c of CHAPTERS) if (text(c.intro).includes('기억 조각')) bad.push(c.title);
    for (const r of Object.values(rooms)) for (const t of r.things) for (const sc of scriptsOf(t)) if (text(sc).includes('기억 조각')) bad.push(`${r.id}/${t.id}`);
    assert.deepEqual(bad, []);
  });

  test('겹치던 가는 길 잡담은 지웠다: 할머니 방 · 창가 · 현관 · 욕실 · 과자 서랍 · 장난감 상자 · 재봉 상자', () => {
    for (const k of ['grandroom', 'window', 'entrance', 'bath', 'drawer', 'toybox', 'sewbox']) assert.equal(ROAD[k], undefined, k);
    // 그대로 두는 잡담은 남아 있다
    for (const k of ['desk', 'shelf', 'yard', 'outside', 'balcony']) assert.ok(ROAD[k]?.length, k);
    // 20장의 비밀 (할머니가 열한 살에 병을 알았다) 을 앞질러 말하는 줄은 어느 잡담에도 없다
    for (const [k, v] of Object.entries(ROAD)) assert.ok(!text(v).includes('처음 아프다는 걸'), k);
  });
});

describe('이야기 깊이 1 · 서장', () => {
  test('아빠는 할머니 의자를 아직 못 정해 다락에 올려 두었고, 트럭에는 의자가 없다 (1장 다락의 의자와 맞는다)', () => {
    const all = mineText('h_yard_eve');
    assert.ok(!all.includes('할머니 의자도 실었어'));
    assert.match(sceneText('h_yard_eve', 'p_dad'), /의자만 아직 못 정했어/);
    assert.match(sceneText('h_yard_eve', 'p_dad'), /다락에 올려/);
    assert.ok(!sceneText('h_yard_eve', 'p_truck').includes('의자'));
    // 1장 다락에는 그 의자가 정말 있다
    assert.ok(rooms.attic.things.some((t) => t.kind === 'keepsake' && t.look === 'chairOld'));
  });

  test('도입은 설명하지 않고, 상자 속 인형은 토끼 쪽으로 기울어 있고, 지우의 문자에 「오지 마」를 쓰다 보내지 않는다', () => {
    assert.ok(!text(PRO.intro).includes('열다섯 해를 산 아이'));
    const box = flat((thing('h_yard_eve', 'p_box') as { scene: Cmd[] }).scene);
    const bt = text(box);
    assert.match(bt, /토끼 쪽으로 기울어/);
    assert.match(bt, /지우: 내일 몇 시에 가\?/);
    assert.match(bt, /「오지 마」라고 썼다가, 보내지 않고/);
    assert.ok(box.some((c) => c.t === 'sfx' && c.name === 'phoneVibe'));
    // 「…가자.」 는 문자 뒤로 옮겼다 (상자를 든 다음 마지막 말)
    const says = box.filter((c) => c.t === 'say');
    const go = says.findIndex((c) => c.t === 'say' && c.text === '…가자.');
    const sms = says.findIndex((c) => c.t === 'say' && c.text.includes('오지 마'));
    assert.ok(go > sms && sms >= 0, '「…가자.」 는 문자 뒤');
  });

  test('다락의 하루: 인형을 바로 세우려다 그만두고, 태엽 열쇠를 놓은 뒤 더 오래 머문다', () => {
    const door = flat((thing('h_yard_eve', 'p_door') as { scene: Cmd[] }).scene);
    assert.match(text(door), /바로 세워 주려고 손을 뻗었다가— 그냥 두었다/);
    const i = door.findIndex((c) => c.t === 'say' && c.text.includes('태엽 열쇠를 잡았다가'));
    const w = door[i + 1];
    assert.ok(w && w.t === 'wait' && w.s >= 1.6, '태엽 열쇠 뒤 침묵이 1.6초 이상');
  });
});

describe('이야기 깊이 1 · 1장 다락방', () => {
  const ch1 = chapter('attic');
  test('토비를 깨운 끼릭 세 번: 소리 셋과 지문이 태엽 할머니의 첫마디 전에, 토비가 묻고 할머니는 「꿈꿨나 보구나」로 둘러댄다', () => {
    const cmds = flat(ch1.intro);
    const firstDoll = cmds.findIndex((c) => c.t === 'say' && c.who === 'doll');
    const ticks = cmds.slice(0, firstDoll).filter((c) => c.t === 'sfx' && c.name === 'windTick');
    assert.equal(ticks.length, 3);
    assert.ok(cmds.slice(0, firstDoll).some((c) => c.t === 'say' && c.who === '' && c.text.startsWith('끼릭. 끼릭. 끼릭.')));
    const it = text(ch1.intro);
    assert.match(it, /toby: …방금, 누가 제 태엽 감았어요\? 세 번\./);
    assert.match(it, /doll: 꿈꿨나 보구나\. 감아 줄 사람이 어디 있다고\./);
    // 「오래 걷지 못한단다」 는 그대로 (거짓말 단서)
    assert.match(it, /오래 걷지 못한단다/);
  });

  test('튜토리얼 설명 줄을 걷어 냈다: 「기억을 거슬러…왜 너희를 두고 가려는지」 · 「물건마다 기억이 깃들어」 · 「살펴보면 그날로」', () => {
    const all = mineText('attic');
    assert.ok(!all.includes('하루가 왜 너희를 두고 가려는지'));
    assert.ok(!all.includes('물건마다 하루의 기억이 깃들어 있단다'));
    assert.ok(!all.includes('무엇을 잊으려 했는지'));
    assert.match(text(ch1.intro), /doll: 하루가 이 집에 두고 가려는 게, 우리만은 아니란다\./);
    assert.match(all, /doll: 하루 손때가 묻은 물건은, 가만히 들여다보면 그날 냄새가 난단다\./);
  });

  test('모두 깨운 뒤 뚜껑문 불빛을 비추는 침묵은 1.8초', () => {
    const cmds = rooms.attic.things.flatMap((t) => ('scene' in t && t.scene ? flat(t.scene) : []));
    const i = cmds.findIndex((c) => c.t === 'cam' && Array.isArray(c.to) && c.to[0] === 13 && c.to[1] === 13);
    assert.ok(i >= 0);
    const w = cmds[i + 1];
    assert.ok(w.t === 'wait' && w.s === 1.8);
  });

  test('보리는 꿀사탕을 먹지 않고 쥔다 (먹보 농담 · 오도독 소리 없음)', () => {
    const fan = flat((thing('attic', 'fan') as { scene: Cmd[] }).scene);
    const t = text(fan);
    assert.ok(!fan.some((c) => c.t === 'sfx' && c.name === 'crunch'), '사탕 깨무는 소리 없음');
    assert.ok(!t.includes('배고파'));
    assert.match(t, /앞발 안에 꼭 쥐었다/);
    assert.match(t, /bori: 나중에\. …왠지 그래야 할 것 같아\./);
  });

  test('m1f: 하루는 이유를 말하지 않는다 (물음의 사다리) · 쪽지를 고쳐 쓰는 까닭은 「글씨」', () => {
    const t = sceneText('attic', 'm1f');
    assert.ok(!t.includes('매일 보면'));
    assert.ok(!t.includes('가져가면'));
    assert.match(t, /haru: …글씨가 마음에 안 들어서\./);
  });

  test('m1d: 아빠가 수저 한 벌을 도로 넣고, 감상은 그걸 다시 짚는다', () => {
    assert.match(sceneText('attic', 'm1d'), /한 벌을, 소리 나지 않게 서랍에 도로 넣었다/);
    const a = afterText('attic', 'm1d');
    assert.match(a, /nabi: 수저 봤어\? 아빠가 하나 도로 넣은 거\./);
    assert.ok(!a.includes('그게 문제야'));
  });

  test('m1a: 토비 리본에 보라색 보풀 한 올 (태엽 할머니 소매의 첫 단서) · 기억의 문은 바늘 끝 빨간 실', () => {
    const m = thing('attic', 'm1a');
    assert.ok(isMemory(m) && m.explore);
    const looks = (m.explore.looks ?? []).map((l) => text(l.text)).join('\n');
    assert.match(looks, /빨간 리본에 보라색 보풀 한 올이 엉켜 있다/);
    assert.match(text(linkOf('attic').scene), /바늘 끝 빨간 실이 엉켜 있다/);
    assert.match(text(linkOf('attic').scene), /doll: …그럼\. 아주 잘 알지\./);
  });
});

describe('이야기 깊이 1 · 2장 할머니 방', () => {
  const ch = chapter('grandroom');
  test('합친 도입: 「기억 조각을 찾자」 대신 멈춘 초침 · 보리의 무릎 · 토비의 「조용히」', () => {
    const it = text(ch.intro);
    assert.match(it, /초침/);
    assert.match(it, /bori: 무릎은 원래 내 자리였는데\./);
    assert.match(it, /toby: 다들, 하루가 아직 깨어 있을지도 몰라\. 조용히\./);
    assert.ok(flat(ch.intro).some((c) => c.t === 'wait' && c.s >= 1.2), '침묵');
  });

  test('m2c: 할머니 기일을 며칠 앞둔 날, 하루는 인형을 토비 바로 옆에 눕혔다 · 감상은 「토비 쪽으로 기울어」', () => {
    const t = sceneText('grandroom', 'm2c');
    assert.match(t, /할머니 기일을 며칠 앞둔 날/);
    assert.match(t, /인형을 토비 바로 옆에 눕혔다/);
    const a = afterText('grandroom', 'm2c');
    assert.match(a, /toby: 그래서 태엽 할머니가 우리 상자에 계셨구나\./);
    assert.match(a, /토비 쪽으로 기울어 있었어/);
    assert.match(a, /파스 냄새/);
    assert.ok(!a.includes('닮은 게 아니라'));
  });

  test('m2d 감상은 결론 대신 관찰 · m2g 에서 하루는 아직 울지 않는다 (울음은 새벽까지 아낀다)', () => {
    const d = afterText('grandroom', 'm2d');
    assert.ok(!d.includes('울기 싫으니까'));
    assert.ok(!d.includes('혼자서만 울어'));
    assert.match(d, /한 숟갈씩만/);
    const g = sceneText('grandroom', 'm2g');
    assert.ok(!g.includes('처음으로 소리 내어 울었다'));
    assert.match(g, /울지는 않았다\. 하루까지 울면, 정말이 될 것 같았다\./);
  });

  test('l2: 엄마 마음을 두 번 말하지 않고, 잠김 말은 장면 말투', () => {
    const l = linkOf('grandroom');
    const t = text(l.scene);
    assert.match(t, /ruru: 엄마도 할머니 딸이랬지/);
    assert.ok(!t.includes('한 번도 들여다본 적이 없어'));
    assert.match(t, /봉투 위 먼지에 손자국이 여러 겹이다/);
    assert.equal(text(l.locked), 'toby: 할머니 방이… 아직 우리한테 할 말이 있는 것 같아.');
  });
});

describe('이야기 깊이 1 · 3장 엄마의 화장대', () => {
  const ch = chapter('dresser');
  test('도입: 잠 못 드는 지금의 엄마 · 장 부제를 소리 내 읽는 줄은 없다', () => {
    const it = text(ch.intro);
    assert.match(it, /nabi: 자는 척하는 거야\. 숨소리가 달라\./);
    assert.ok(!it.includes('엄마도 엄마를 잃었어'));
  });

  test('mMe 뒤 토비의 헛단서: 그 뒤의 끼릭도 엄마였나', () => {
    const a = afterText('dresser', 'mMe');
    assert.match(a, /따뜻한 손이었는데, 하루 손은 아니었어/);
    assert.match(a, /toby: 그럼 그 뒤로 가끔 났던 끼릭도… 엄마였나\./);
  });

  test('lM: 할머니 목소리가 한 번 더 새어 나오고, 막간 ① 다락의 태엽 할머니는 「하나… 둘…」 에서 멈춘다 (다음 장으로 가기 전)', () => {
    const l = linkOf('dresser');
    const cmds = flat(l.scene);
    const t = text(l.scene);
    assert.match(t, /은주야, 엄마다\. 바쁘지\?/);
    assert.match(t, /핀 옆 쪽지가 몇 번이나 접혔다 펴졌다/);
    const room = cmds.findIndex((c) => c.t === 'room' && c.id === 'h_attic');
    const mini = cmds.findIndex((c) => c.t === 'mini');
    const next = cmds.findIndex((c) => c.t === 'next');
    assert.ok(mini >= 0 && room > mini && next > room, '놀이 → 다락 막간 → 다음 장');
    const inter = cmds.slice(room, next);
    const dolls = inter.filter((c) => c.t === 'say' && c.who === 'doll').map((c) => (c.t === 'say' ? c.text : ''));
    assert.deepEqual(dolls, ['…하나.', '…둘.']);
    assert.ok(inter.some((c) => c.t === 'say' && c.who === '' && c.text === '셋은 들리지 않았다.'));
    assert.ok(inter.some((c) => c.t === 'item' && c.kind === 'boxTaped'), '테이프 붙인 상자');
    assert.equal(text(l.locked), 'toby: 엄마 화장대는 아직 다 안 봤어.');
  });
});

describe('이야기 깊이 1 · 4장 침대 밑', () => {
  const ch = chapter('underbed');
  test('도입: 노란 목도리를 안고 자는 하루가 잠꼬대로 「하나… 둘…」 을 세다 멈춘다', () => {
    const it = text(ch.intro);
    assert.match(it, /가방에 넣었던 목도리야/);
    assert.match(it, /haru: …하나… 둘…/);
    assert.match(it, /셋은 오지 않았다/);
  });

  test('새 살펴보기 boxmark: 상자 안에서 밤마다 토비 쪽에서 끼릭 소리가 났다 · 토비는 안 걸었다', () => {
    const b = thing('underbed', 'boxmark');
    assert.equal(b.kind, 'spot');
    const t = sceneText('underbed', 'boxmark');
    assert.match(t, /밤마다 네 쪽에서 끼릭 소리가 났어/);
    assert.match(t, /toby: …나는 안 걸었는데\./);
  });

  test('m3c 감상: 토비는 하루의 말을 자기 탓으로 받아들이고, 루루가 막는다 (교훈 줄 없음)', () => {
    const a = afterText('underbed', 'm3c');
    assert.match(a, /toby: …나 때문이었어\. 하루가 아픈 거\./);
    assert.match(a, /ruru: 그만\. 그런 계산은 하지 마\./);
    assert.ok(!a.includes('슬픔이 너무 크면'));
    assert.ok(!a.includes('nabi:'), '나비는 아직 무리에 없다');
    // 고비를 여는 첫 두 줄은 저절로 들린다
    const m = thing('underbed', 'm3c');
    assert.ok(isMemory(m));
    assert.match(text(m.after ?? []), /…기억났어\. 그날 새벽\./);
  });

  test('m3e 감상 · l3: 큰고모 · 잠결의 「…할머니」 와 접힌 별 지문', () => {
    const a = afterText('underbed', 'm3e');
    assert.ok(!a.includes('상자 뚜껑을 닫아 버려'));
    assert.match(a, /ruru: 큰고모, 우리 이름도 몰랐을걸\./);
    const t = text(linkOf('underbed').scene);
    assert.match(t, /하루가 잠결에 중얼거렸다\. 「…할머니\.」/);
    assert.match(t, /반쯤 접힌 별 속에, 접다 만 그날 밤이 접혀 있다/);
  });
});

describe('이야기 깊이 1 · 5장 나비의 이불장', () => {
  test('mNf 감상: 지킨 게 아니라 지켜졌다 — 「둘이서. 나랑 할머니랑」 · 앞지른 반전과 이어짐 오류 줄 없음', () => {
    const a = afterText('closet', 'mNf');
    assert.match(a, /nabi: …둘이서\. 나랑 할머니랑\./);
    assert.match(a, /nabi: 기분 탓이야\./);
    assert.ok(!a.includes('평생 같이 놀아 달라고'));
    assert.ok(!a.includes('한 명씩, 몰래'));
  });

  test('lN: 나비가 실을 직접 든다 · 실 지문', () => {
    const t = text(linkOf('closet').scene);
    assert.match(t, /nabi: …내가 들게\. 이건 내 거니까\./);
    assert.match(t, /실 끝이 이불 사이로 흩어져 있다/);
  });
});

describe('이야기 깊이 1 · 6장 거실 창가', () => {
  const ch = chapter('window');
  test('합친 도입: 토비의 느려지는 태엽 · 「하루가 감아 줘야 해」 · 보리의 천둥 (가는 길 잡담에서 옮김)', () => {
    const it = text(ch.intro);
    assert.match(it, /끼릭, 끼릭\. 점점 느려져/);
    assert.match(it, /태엽은 감아 준 사람 마음까지 같이 감기는 거래/);
    assert.match(it, /하루가 감아 줘야 해/);
    assert.match(it, /bori: 곰이라도 무서운 건 무서운 거야\./);
    assert.ok(!it.includes('창가 위에 반짝이는 게 있어'));
    assert.ok(!it.includes('체면'));
  });

  test('m4a 감상: 소매 · 보리의 숨긴 상처 (그 겨울 병원에 한 번도 못 갔다)', () => {
    const a = afterText('window', 'm4a');
    assert.match(a, /nabi: 소매\. 또 내리셨어\./);
    assert.match(a, /bori: …나는 그 겨울에 병원에 한 번도 못 갔어\. 예순 해를 같이 살았는데\./);
    assert.match(a, /하루 주머니엔 자리가 하나뿐이었으니까/);
    assert.ok(!a.includes('조금 슬퍼 보였어'));
  });

  test('m4e: 추신의 내용은 할머니 손에 가려 보이지 않는다 (반전을 6장에서 말하지 않는다)', () => {
    const t = sceneText('window', 'm4e');
    assert.match(t, /gm: …추신\./);
    assert.match(t, /할머니 손에 가려 보이지 않는다/);
    assert.ok(!t.includes('토비야. 보리야. 루루야. 나비야.'));
    assert.ok(!t.includes('너희가 해 주렴'));
    const a = afterText('window', 'm4e');
    assert.ok(!a.includes('다 알고 계셨어'));
    assert.match(a, /아직 재봉틀 서랍에 있어/);
  });

  test('m4g 감상은 장부를 앞지르지 않고 지금의 아빠 수첩으로 돌아온다 · l4 의 아빠 잠꼬대 · 차례 설명 없음', () => {
    const a = afterText('window', 'm4g');
    assert.ok(!a.includes('떠날 준비만'));
    assert.match(a, /아빠 배 위에 있던 거잖아/);
    assert.ok(thing('window', 'dadnote').kind === 'spot');
    const l = linkOf('window');
    const t = text(l.scene);
    assert.match(t, /…약불에… 한 번 더…/);
    assert.ok(!t.includes('기억은 거꾸로'));
    assert.match(t, /toby: 현관부터 들르자\. 할머니가 매일 아침 서 계시던 데\./);
    assert.equal(text(l.locked), 'toby: 창가 위에도, 아직.');
  });

  test('m4c: 새벽 전화벨 앞의 침묵은 2초', () => {
    const cmds = flat((thing('window', 'm4c') as { scene: Cmd[] }).scene);
    const i = cmds.findIndex((c) => c.t === 'say' && c.text === '새벽에 전화벨이 울렸다.');
    const w = cmds.slice(0, i).reverse().find((c) => c.t === 'wait');
    assert.ok(w && w.t === 'wait' && w.s === 2);
  });
});

describe('이야기 깊이 1 · 7장 현관', () => {
  const ch = chapter('entrance');
  test('합친 도입: 인사를 몇 번이나 · 「열한 살에 병을 알았다」는 말 없음', () => {
    const it = text(ch.intro);
    assert.match(it, /toby: 할머니는 그 인사를 몇 번이나 들었을까\./);
    assert.match(it, /ruru: 토비, 무거운 얘기 금지\./);
    assert.ok(!mineText('entrance').includes('처음 아프다는 걸'));
  });

  test('새 살펴보기 newslippers: 상표도 안 뗀 퇴원 선물 실내화, 아빠 글씨', () => {
    assert.equal(thing('entrance', 'newslippers').kind, 'spot');
    const t = sceneText('entrance', 'newslippers');
    assert.match(t, /퇴원 선물 — 사위가/);
    assert.match(t, /bori: 아빠 글씨야\./);
  });

  test('mEe 감상은 교훈 대신 떡볶이 · mEf 뒤 침묵 2초 · 잠김 말', () => {
    const a = afterText('entrance', 'mEe');
    assert.ok(!a.includes('착해서'));
    assert.match(a, /떡볶이를 안 드셨어/);
    const cmds = flat((thing('entrance', 'mEf') as { scene: Cmd[] }).scene);
    assert.ok(cmds.at(-1)?.t === 'wait' && (cmds.at(-1) as { s: number }).s === 2);
    assert.equal(text(linkOf('entrance').locked), 'toby: 신발장 위 칸에도 뭐가 있어.');
  });
});

describe('이야기 깊이 1 · 반전은 아직 말하지 않는다 (서장 ~ 7장)', () => {
  test('「할머니는 다 알고 계셨어」 · 「한 명씩, 몰래」 · 「하루를 맡기고」 · 「평생 같이 놀아 달라고」 가 앞 장에 없다', () => {
    const LEAK = ['다 알고 계셨어', '한 명씩, 몰래', '하루를 맡기고', '평생 같이 놀아 달라고', '태엽 할머니가 감아'];
    for (const room of MINE) {
      const all = mineText(room);
      for (const w of LEAK) assert.ok(!all.includes(w), `${room}: 「${w}」`);
    }
  });

  test('장마다 이삿날 밤의 시각이 첫 지문에 있고, 장 제목 카드의 밤 시계(chapter.clock)와 같다 (1~7장)', () => {
    for (const room of MINE.slice(1)) {
      const c = chapter(room);
      assert.ok(c.clock, `${room}: 밤 시계`);
      const want = koClock(c.clock);
      const first = flat(c.intro).find((x) => x.t === 'say' && x.who === '');
      assert.ok(first && first.t === 'say' && first.text.includes(want), `${room}: 첫 지문에 「${want}」 (${c.clock}) — 「${first && first.t === 'say' ? first.text : ''}」`);
    }
  });
});
