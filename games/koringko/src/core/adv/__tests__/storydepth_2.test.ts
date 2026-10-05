/**
 * 이야기 깊이 (STORYDEPTH) 갈래 2: 8~14장 (책가방 · 책상 · 욕실 · 책장 · 과자 서랍 · 베란다 · 소파 밑).
 * 대본 데이터를 읽어, 계획한 이야기의 줄기(시각 · 단서 · 동료의 상처가 풀리는 자리 · 떡밥)가 제자리에 있는지 본다.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { isMemory } from '../adv.ts';
import { CHAPTERS, ROOMS } from '../story/index.ts';
import { CH_BATH } from '../story/ch_bath.ts';
import { CH7 } from '../story/ch7.ts';
import type { Cmd, RoomDef, Thing } from '../types.ts';

const MY_ROOMS = ['schoolbag', 'desk', 'bath', 'shelf', 'drawer', 'balcony', 'sofa'] as const;

const built = new Map<string, RoomDef>();
const room = (id: string): RoomDef => {
  let r = built.get(id);
  if (!r) {
    r = ROOMS[id]();
    built.set(id, r);
  }
  return r;
};

/** 대본 안의 모든 명령 (갈래 속까지) */
function flat(cmds: readonly Cmd[]): Cmd[] {
  return cmds.flatMap((c) => (c.t === 'if' ? [c, ...flat(c.then), ...flat(c.else ?? [])] : [c]));
}
/** 대사 · 지문을 「누구: 말」 줄로 (지문은 누구가 빈 글자) */
const lines = (cmds: readonly Cmd[]): string[] => flat(cmds).flatMap((c) => (c.t === 'say' ? [`${c.who}: ${c.text}`] : []));

function thing(roomId: string, id: string): Thing {
  const t = room(roomId).things.find((x) => x.id === id);
  assert.ok(t, `${roomId} 에 ${id} 가 없다`);
  return t;
}
/** 기억 뒤 감상 전체: 저절로 나오는 줄 + 동료에게 옮긴 줄 (차례대로) */
function afterLines(roomId: string, id: string): string[] {
  const t = thing(roomId, id);
  assert.ok(isMemory(t), `${id} 는 기억이어야 한다`);
  return [...lines(t.after ?? []), ...lines(t.aside?.text ?? [])];
}
function sceneOf(roomId: string, id: string): Cmd[] {
  const t = thing(roomId, id);
  assert.ok('scene' in t && t.scene, `${id} 에 장면이 없다`);
  return t.scene;
}
const chapterOf = (roomId: string) => {
  const c = CHAPTERS.find((x) => x.room === roomId);
  assert.ok(c, `${roomId} 장이 없다`);
  return c;
};

/** 한글 시각 「새벽 두 시 오십오 분」 · 「한 시 반」 → 'HH:MM' (못 읽으면 null) */
const HOURS = ['열두', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열', '열한'];
const DIGIT: Record<string, number> = { 일: 1, 이: 2, 삼: 3, 사: 4, 오: 5, 육: 6, 칠: 7, 팔: 8, 구: 9 };
function koMinutes(w: string): number {
  // 「오십오」 = 5*10+5, 「십」 = 10, 「사십」 = 40, 「오」 = 5
  const m = /^(?:([일이삼사오육칠팔구])?(십))?([일이삼사오육칠팔구])?$/.exec(w);
  if (!m || !w) return NaN;
  const tens = m[2] ? (m[1] ? DIGIT[m[1]] : 1) : 0;
  return tens * 10 + (m[3] ? DIGIT[m[3]] : 0);
}
function koClock(text: string): string | null {
  const m = /(열두|열한|열|한|두|세|네|다섯|여섯|일곱|여덟|아홉) 시(?: (반)| ([일이삼사오육칠팔구십]+) 분)?/.exec(text);
  if (!m) return null;
  const h = HOURS.indexOf(m[1]);
  const mi = m[2] ? 30 : m[3] ? koMinutes(m[3]) : 0;
  if (h < 0 || Number.isNaN(mi)) return null;
  return `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`;
}

describe('이야기 깊이 2 · 한글 시각 읽기 (시험 도우미)', () => {
  test('시 · 분 · 반 · 십 단위를 읽는다', () => {
    assert.equal(koClock('> 새벽 한 시 십 분. 하루 방.'), '01:10');
    assert.equal(koClock('새벽 한 시 반.'), '01:30');
    assert.equal(koClock('새벽 두 시 오십오 분'), '02:55');
    assert.equal(koClock('새벽 두 시 오 분'), '02:05');
    assert.equal(koClock('열두 시'), '00:00');
  });
  test('시각이 없는 글은 null', () => {
    assert.equal(koClock('불 꺼진 욕실.'), null);
    assert.equal(koClock('세 번이나'), null);
  });
});

describe('이야기 깊이 2 · 이삿날 밤이 흐른다 (8~14장 시각)', () => {
  for (const id of MY_ROOMS) {
    test(`${id}: 장 도입 첫 지문의 시각이 장 제목 카드의 시각(${chapterOf(id).clock})과 같다`, () => {
      const c = chapterOf(id);
      assert.ok(c.clock, '밤 장은 시각이 있어야 한다');
      const first = flat(c.intro).find((x) => x.t === 'say' && x.who === '');
      assert.ok(first && first.t === 'say', '도입에 지문이 있어야 한다');
      assert.equal(koClock(first.text), c.clock, `첫 지문: ${first.text}`);
    });
  }
  test('책상의 휴대폰 화면 시각도 장 시각과 같고, 지우의 문자 · 쓰다 만 「오지」가 보인다', () => {
    const ls = lines(sceneOf('desk', 'desk_phone'));
    const clock = chapterOf('desk').clock;
    assert.ok(ls.some((l) => l.includes(`「${clock}」`)), ls.join('\n'));
    assert.ok(ls.some((l) => l.includes('지우:') && l.includes('모퉁이')));
    assert.ok(ls.some((l) => l.includes('「오지」')));
    // 오래된 시각(03:40)이 남아 장 제목 카드와 어긋나지 않는다
    assert.ok(!ls.some((l) => l.includes('03:40')));
  });
});

describe('이야기 깊이 2 · 다락의 막간 ② (8장 노란 별 문 끝)', () => {
  const scene = flat(sceneOf('schoolbag', 'lJ'));
  test('미니 놀이와 깃발 뒤, 다음 장으로 넘어가기 전에 사람 크기 다락에서 태엽 할머니 목소리만 들린다', () => {
    const iMini = scene.findIndex((c) => c.t === 'mini');
    const iFlag = scene.findIndex((c) => c.t === 'flag' && c.name === 'chj_done');
    const iRoom = scene.findIndex((c) => c.t === 'room' && c.id === 'h_attic');
    const iNext = scene.findIndex((c) => c.t === 'next');
    assert.ok(iMini >= 0 && iFlag > iMini && iRoom > iFlag && iNext > iRoom, `차례: mini ${iMini} flag ${iFlag} room ${iRoom} next ${iNext}`);
    assert.ok(ROOMS.h_attic, '막간 방이 있어야 한다');
    const mid = scene.slice(iRoom, iNext);
    assert.ok(mid.some((c) => c.t === 'item' && c.kind === 'boxTaped'), '테이프 붙인 상자');
    assert.ok(mid.some((c) => c.t === 'sfx' && c.name === 'windTick'), '끼릭 소리');
    assert.ok(mid.some((c) => c.t === 'say' && c.who === 'doll' && c.text.includes('토비')));
    // 상자 안의 목소리: 인형 그림을 세우지 않는다
    assert.ok(!mid.some((c) => c.t === 'show'));
    assert.ok(!mid.some((c) => c.t === 'say' && ['toby', 'bori', 'ruru', 'nabi'].includes(c.who)), '장난감들은 막간에 없다');
  });
});

describe('이야기 깊이 2 · 반전의 단서 (9장 「대신 감아 주고」)', () => {
  test('m5b 장면 속 할머니의 말을 감상에서 토비가 그대로 되짚는다', () => {
    const scene = lines(sceneOf('desk', 'm5b'));
    assert.ok(scene.some((l) => l.startsWith('gm:') && l.includes('토비 태엽도 대신 감아 주고')));
    const after = afterLines('desk', 'm5b');
    assert.ok(after.some((l) => l.startsWith('toby:') && l.includes('「토비 태엽도 대신 감아 주고.」')), after.join('\n'));
    assert.ok(after.some((l) => l.startsWith('bori:') && l.includes('반들반들')));
  });
  test('m5b 감상은 2장부터 알던 사실을 새 발견처럼 말하지 않고, 결론도 내리지 않는다', () => {
    const after = afterLines('desk', 'm5b');
    assert.ok(!after.some((l) => l.includes('역시')));
    assert.ok(!after.some((l) => l.includes('할머니 마음으로 우리를 보낸')));
    assert.equal(after.at(-1), 'nabi: …', '나비는 말없이 끝낸다');
  });
  test('m5c: 루루의 분노는 남고, 대답(「웃는 걸 오래 보고 싶으셨던」)은 20장까지 미룬다', () => {
    const after = afterLines('desk', 'm5c');
    assert.ok(after.some((l) => l.startsWith('ruru:') && l.includes('그렇게까지 아프진 않았을')));
    assert.ok(!after.some((l) => l.includes('오래 보고 싶')));
    assert.ok(after.some((l) => l === 'toby: …모르겠어. 나도.'));
  });
  test('8~14장 어디에서도 반전(「다 알고 계셨」 · 「한 명씩, 몰래」 · 태엽 할머니가 감았다)을 미리 말하지 않는다', () => {
    const leaks = [/다 알고 계셨/, /한 명씩, 몰래/, /태엽 할머니가.*(감았|감아 줬)/, /그래서였어/];
    for (const id of MY_ROOMS) {
      const r = room(id);
      const all = [...lines(chapterOf(id).intro), ...r.things.flatMap((t) => [
        ...('scene' in t && t.scene ? lines(t.scene) : []),
        ...(isMemory(t) ? [...lines(t.after ?? []), ...lines(t.aside?.text ?? [])] : []),
      ])];
      for (const l of all) for (const re of leaks) assert.ok(!re.test(l), `${id}: ${l}`);
    }
  });
});

describe('이야기 깊이 2 · 루루 「덤」 은 14장에서 한 번만 풀린다', () => {
  test('11장 m6b: 루루가 「덤인 줄 알았어」로 끝내고, 아무도 풀어 주지 않는다', () => {
    const after = afterLines('shelf', 'm6b');
    assert.ok(after.at(-1)?.startsWith('ruru: …덤인 줄 알았어'), after.join('\n'));
    assert.ok(!after.some((l) => /덤 아니|덤이 아니/.test(l)));
  });
  test('13장 mVd: 루루는 아직 낫지 않는다 (「덤이 아니었어」 · 「이제 알아」 없음)', () => {
    const after = afterLines('balcony', 'mVd');
    assert.ok(!after.some((l) => /덤이 아니|이제 알아/.test(l)), after.join('\n'));
    assert.ok(after.some((l) => l.includes('세 개는 사겠다')));
  });
  test('14장 lR: 루루가 스스로 「덤 아니었어. 이제 알아.」라고 말한다', () => {
    const ls = lines(sceneOf('sofa', 'lR'));
    const i = ls.findIndex((l) => l.startsWith('ruru:') && l.includes('덤 아니었어. 이제 알아.'));
    const thanks = ls.findIndex((l) => l.includes('들어 줘서, 나도 고마워'));
    assert.ok(thanks >= 0 && i > thanks, ls.join('\n'));
  });
  test('14장 mRd: 할머니의 부탁(「하루가 웃는 걸 잊어버리거든, 네가 먼저 장난을 쳐 다오」)이 장면에 있다', () => {
    const ls = lines(sceneOf('sofa', 'mRd'));
    const ask = ls.findIndex((l) => l.startsWith('gm:') && l.includes('먼저 장난을 쳐 다오'));
    const end = ls.findIndex((l) => l.includes('시집갈 때까지는'));
    assert.ok(ask >= 0 && end > ask);
  });
});

describe('이야기 깊이 2 · 보리 · 나비의 내력이 미리 풀리지 않는다', () => {
  test('11장 m6a: 보리는 알지만 말하지 않는다 (「찬장에 가면」)', () => {
    const after = afterLines('shelf', 'm6a');
    assert.ok(!after.some((l) => l.includes('할머니의 엄마였구나') || l.includes('몰랐어? 본인이')));
    assert.ok(after.some((l) => l.startsWith('bori:') && l.includes('찬장에 가면')));
  });
  test('12장 도입: 부엌에 나온 엄마가 곰을 「곰돌아」라고 부른다 (목소리 · 지문만, 사람 그림 없음)', () => {
    const intro = flat(CH7.intro);
    const ls = lines(intro);
    assert.ok(ls.some((l) => l.startsWith('mom:') && l.includes('곰돌아')));
    assert.ok(ls.some((l) => l === 'bori: 나중에. 찬장에 가면.'));
    assert.ok(!intro.some((c) => c.t === 'show'), '장난감 방에 사람 그림을 세우지 않는다');
    const goal = intro.findIndex((c) => c.t === 'goal');
    const mom = intro.findIndex((c) => c.t === 'say' && c.who === 'mom');
    assert.ok(mom >= 0 && goal > mom, '엄마 장면은 목표 앞에');
  });
  test('11장 m6c 는 나비 출생을 「발견」하지 않고, 13장 mVe 에서만 발견한다', () => {
    assert.ok(!afterLines('shelf', 'm6c').some((l) => l.includes('하루 냄새')));
    assert.ok(afterLines('balcony', 'mVe').some((l) => l.includes('하루 냄새')));
  });
});

describe('이야기 깊이 2 · 겹치던 도입 정리 (욕실 · 과자 서랍)', () => {
  test('욕실 도입: 물 싫어하는 농담은 한 번, 토비가 욕조 턱에서 미끄러진다', () => {
    const ls = lines(CH_BATH.intro);
    assert.equal(ls.filter((l) => /물 싫어|물을 싫어/.test(l)).length, 2, '루루와 나비가 한 번씩 (같은 농담 두 번 아님)');
    assert.equal(ls.filter((l) => l.includes('고양이')).length, 1);
    assert.ok(ls.some((l) => l.includes('욕조 턱을 오르다')));
    assert.ok(flat(CH_BATH.intro).some((c) => c.t === 'act' && c.who === 'toby' && c.name === 'tremble'));
  });
  test('과자 서랍 도입: 보리가 「먹으면 안 돼?」라고 했다가 「안 먹을 거야」로 뒤집히지 않는다', () => {
    const ls = lines(CH7.intro);
    assert.ok(!ls.some((l) => l.includes('먹으면 안 돼')));
    assert.ok(ls.some((l) => l.startsWith('bori:') && l.includes('안 먹을 거야')));
    const talk = lines(room('drawer').hangouts?.bori?.talk ?? []);
    assert.ok(!talk.some((l) => l.includes('먹을 게 걸린')), '자기 자리 말도 「안 먹는다」와 어긋나지 않는다');
  });
  test('11장 도입의 메타 발언(「주인공은 원래 마지막에」)을 지웠다', () => {
    assert.ok(!lines(chapterOf('shelf').intro).some((l) => l.includes('주인공은 원래')));
  });
});

describe('이야기 깊이 2 · 떡밥과 되부름', () => {
  test('모퉁이: 8장 mJf 감상에 루루의 「모퉁이에 오겠네」, 13장 mVg 감상에 나비의 「모퉁이」', () => {
    assert.ok(afterLines('schoolbag', 'mJf').some((l) => l.startsWith('ruru:') && l.includes('모퉁이에 오겠네')));
    assert.ok(afterLines('balcony', 'mVg').some((l) => l.startsWith('nabi:') && l.includes('모퉁이')));
  });
  test('욕실 mBe 는 8장 지우 쪽지 「내가 먼저 감을게」를 되부르고, mBb 는 교훈 대신 하루의 글을 짚는다', () => {
    assert.ok(afterLines('bath', 'mBe').some((l) => l.includes('「내가 먼저 감을게」')));
    const bb = afterLines('bath', 'mBb');
    assert.ok(!bb.some((l) => l.includes('더 아픈 거야')));
    assert.ok(bb.some((l) => l.includes('「내 마음 태엽도 잘 감습니다.」')));
  });
  test('12장 m7c: 「매일 세 번」은 하루가 정한 것 (할머니는 「매일」)', () => {
    const after = afterLines('drawer', 'm7c');
    assert.ok(after.some((l) => l.includes('「매일 세 번」') && l.includes('「매일」')));
    assert.ok(!after.some((l) => l.includes('감아 줄 사람이 없었으니까')));
  });
  test('거두지 않은 떡밥은 남겨 둔다: 오르골 「찾아야 해. 그것도.」 · 노란 띠 · 루루의 동전 스물아홉', () => {
    assert.ok(afterLines('drawer', 'm7d').some((l) => l.includes('찾아야 해. 그것도.')));
    assert.ok(lines(sceneOf('desk', 'l5')).some((l) => l.includes('노란 띠는 저기 그대로 두자')));
    assert.ok(lines(sceneOf('sofa', 'rr_coins')).some((l) => l.includes('스물아홉')));
  });
  test('동료 감상에서 「평생」을 되뇌지 않는다 (m6f 는 지갑 속 표를 보여 준다)', () => {
    const after = afterLines('shelf', 'm6f');
    assert.ok(!after.some((l) => l.startsWith('toby:') && l.includes('평생')));
    assert.ok(after.some((l) => l.startsWith('toby:') && l.includes('장례식 날')));
  });
  test('13장 mVc: 20장 과제(「하루 태엽을 감자」)를 앞지르지 않는다', () => {
    const after = afterLines('balcony', 'mVc');
    assert.ok(!after.some((l) => l.includes('하루 태엽을 감자')));
    assert.ok(after.some((l) => l.startsWith('bori:') && l.includes('같이 걸을 수는')));
  });
});
