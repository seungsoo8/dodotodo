import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { clockLabel, nightClocks, parseClock } from '../../core/adv/clock.ts';
import { chapterPalette, nightPalette, tintAmbient, tintLights } from '../render/nightClock.ts';
import { CHAPTERS, STORY } from '../../core/adv/story/index.ts';
import { Adv } from '../../core/adv/adv.ts';

describe('밤의 시계: 시각 글자 ↔ 분', () => {
  test('밤 시각은 자정을 넘어도 이어지는 분으로 (23:10 < 00:30 < 04:40)', () => {
    assert.equal(parseClock('23:10'), 23 * 60 + 10);
    assert.equal(parseClock('00:30'), 24 * 60 + 30);
    assert.equal(parseClock('04:40'), 28 * 60 + 40);
    assert.ok(parseClock('23:10') < parseClock('00:30'));
  });

  test('분 → 글자는 24시를 넘기면 0시부터 두 자리로', () => {
    assert.equal(clockLabel(23 * 60 + 10), '23:10');
    assert.equal(clockLabel(24 * 60 + 5), '00:05');
    assert.equal(clockLabel(28 * 60 + 40), '04:40');
    assert.equal(clockLabel(parseClock('02:15')), '02:15');
  });

  test('잘못된 글자는 NaN', () => {
    assert.ok(Number.isNaN(parseClock('25:99')));
    assert.ok(Number.isNaN(parseClock('밤')));
  });
});

describe('밤의 시계: 장마다 23:10 → 04:40', () => {
  test('n 개의 밤 장은 첫 장 23:10 · 마지막 장 04:40, 사이는 5분 단위로 늘기만 한다', () => {
    const c = nightClocks(20);
    assert.equal(c.length, 20);
    assert.equal(c[0], '23:10');
    assert.equal(c[19], '04:40');
    for (let i = 1; i < c.length; i++) {
      assert.ok(parseClock(c[i]) > parseClock(c[i - 1]), `${c[i - 1]} → ${c[i]}`);
      assert.equal(parseClock(c[i]) % 5, 0, c[i]);
    }
  });

  test('밤 장이 하나뿐이면 23:10 하나, 0 개면 빈 목록', () => {
    assert.deepEqual(nightClocks(1), ['23:10']);
    assert.deepEqual(nightClocks(0), []);
  });

  test('실제 막 목록: 프롤로그(해 질 녘)와 에필로그(새집)는 시계가 없고, 1막은 23:10, 막 시각은 늘기만 하고, 새벽은 05:00', () => {
    assert.equal(CHAPTERS[0].clock, undefined);
    assert.equal(CHAPTERS.at(-1)!.clock, undefined);
    const act1 = CHAPTERS.find((c) => c.room === 'attic')!;
    assert.equal(act1.clock, '23:10');
    const timed = CHAPTERS.filter((c) => c.clock);
    assert.equal(timed.length, 11, '열 막 + 새벽');
    for (let i = 1; i < timed.length; i++) assert.ok(parseClock(timed[i].clock!) > parseClock(timed[i - 1].clock!), `${timed[i - 1].title} → ${timed[i].title}`);
    assert.equal(timed.at(-1)!.clock, '05:00');
  });

  test('막의 방 시각은 옛 장 시각(23:10 … 04:40) 그대로이고, 막 안에서도 방을 따라 늘기만 하며, 막의 시각은 첫 방 시각', () => {
    const rooms = CHAPTERS.flatMap((c) => c.rooms ?? []).filter((r) => r.clock);
    assert.deepEqual(rooms.map((r) => r.clock), nightClocks(20));
    for (const c of CHAPTERS) {
      if (!c.rooms?.length || !c.clock) continue;
      assert.equal(c.clock, c.rooms[0].clock, c.title);
      for (let i = 1; i < c.rooms.length; i++) assert.ok(parseClock(c.rooms[i].clock!) > parseClock(c.rooms[i - 1].clock!), `${c.title}: ${c.rooms[i - 1].name} → ${c.rooms[i].name}`);
    }
  });
});

describe('밤의 시계: 달빛 색 · 기울기 · 새벽', () => {
  const blue = (c: readonly number[]) => c[2] - c[0];
  test('앞 장은 푸른 달빛 (파랑 > 빨강), 뒤 장은 보랏빛, 04:40 은 분홍 (빨강 ≥ 파랑)', () => {
    const early = nightPalette(parseClock('23:10'));
    const mid = nightPalette(parseClock('02:30'));
    const late = nightPalette(parseClock('04:40'));
    assert.ok(blue(early.moon) > 80, `early ${early.moon}`);
    assert.ok(blue(mid.moon) > 0 && blue(mid.moon) < blue(early.moon), `mid ${mid.moon}`);
    assert.ok(late.moon[0] >= late.moon[2], `late ${late.moon}`);
  });

  test('시각이 갈수록 빨강이 늘고 새벽 기운(dawn)이 0 → 1 로 오른다', () => {
    let prevR = -1;
    let prevDawn = -1;
    for (const t of ['23:10', '00:30', '01:40', '02:50', '03:50', '04:40', '05:00']) {
      const p = nightPalette(parseClock(t));
      assert.ok(p.moon[0] >= prevR, `${t} 빨강 ${p.moon[0]}`);
      assert.ok(p.dawn >= prevDawn, `${t} dawn ${p.dawn}`);
      prevR = p.moon[0];
      prevDawn = p.dawn;
    }
    assert.equal(nightPalette(parseClock('23:10')).dawn, 0);
    assert.equal(nightPalette(parseClock('05:00')).dawn, 1);
  });

  test('달이 기울수록 빛줄기가 더 비스듬하다 (slantK 증가, 0.7 ~ 1.5 안)', () => {
    const a = nightPalette(parseClock('23:10')).slantK;
    const b = nightPalette(parseClock('04:40')).slantK;
    assert.ok(a >= 0.7 && b <= 1.5 && b > a, `${a} ${b}`);
  });

  test('범위 밖 시각은 양 끝 값으로 (22:00 = 23:10 색, 07:00 = 05:00 색)', () => {
    assert.deepEqual(nightPalette(parseClock('22:00')).moon, nightPalette(parseClock('23:10')).moon);
    assert.deepEqual(nightPalette(parseClock('07:00')).moon, nightPalette(parseClock('05:00')).moon);
  });

  test('어둠 곱하기 색 tint 는 0.8 ~ 1.25 배 안에서만 바뀌고, 새벽이 한밤보다 밝다', () => {
    for (const t of ['23:10', '02:00', '04:40', '05:00']) for (const v of nightPalette(parseClock(t)).tint) assert.ok(v >= 0.8 && v <= 1.25, `${t} ${v}`);
    const sum = (v: readonly number[]) => v[0] + v[1] + v[2];
    assert.ok(sum(nightPalette(parseClock('05:00')).tint) > sum(nightPalette(parseClock('01:30')).tint));
  });

  test('장 팔레트: 시계가 없는 장 · 기억 방은 null, 밤 장의 지금 방은 그 시각 팔레트', () => {
    assert.equal(chapterPalette(undefined, 'attic'), null);
    assert.equal(chapterPalette('01:00', 'm_gm'), null);
    const p = chapterPalette('01:00', 'attic');
    assert.ok(p);
    assert.equal(p.label, '01:00');
    assert.deepEqual(p.moon, nightPalette(parseClock('01:00')).moon);
  });
});

describe('밤의 시계: 빛줄기 · 어둠에 입히기', () => {
  const beam = { x: 0, y: 0, w: 48, h: 96, slant: 40, color: [150, 180, 255] as const, k: 0.4, moon: true };
  const lamp = { x: 0, y: 0, w: 48, h: 96, slant: 40, color: [255, 210, 130] as const, k: 0.4 };
  test('달빛(moon) 빛줄기만 팔레트 색 · 기울기로 바뀌고 등불 빛은 그대로', () => {
    const p = nightPalette(parseClock('04:40'));
    const out = tintLights([beam, lamp], p);
    assert.deepEqual(out[0].color, p.moon);
    assert.equal(out[0].slant, Math.round(40 * p.slantK));
    assert.deepEqual(out[1], lamp);
  });

  test('팔레트가 없으면 (기억 방) 아무것도 바꾸지 않는다', () => {
    assert.deepEqual(tintLights([beam], null), [beam]);
    assert.deepEqual(tintAmbient([100, 100, 160], null), [100, 100, 160]);
  });

  test('어둠 곱하기 색에 tint 를 곱하고 0..255 로 자른다', () => {
    const p = nightPalette(parseClock('05:00'));
    const a = tintAmbient([100, 200, 250], p);
    assert.deepEqual(a, [Math.min(255, Math.round(100 * p.tint[0])), Math.min(255, Math.round(200 * p.tint[1])), Math.min(255, Math.round(250 * p.tint[2]))]);
    assert.ok(a.every((v) => v >= 0 && v <= 255));
  });
});

describe('밤의 시계: 장 제목 카드에 시각', () => {
  test('밤 막의 부제 끝에 그 막의 시각이 붙고, 프롤로그는 붙지 않는다', () => {
    const a = new Adv(STORY);
    const ch1 = CHAPTERS.find((c) => c.room === 'attic')!;
    a.save.chapter = ch1.n;
    assert.ok(a.chapterTitle().sub.endsWith('23:10'), a.chapterTitle().sub);
    assert.ok(a.chapterTitle().sub.startsWith(ch1.sub));
    a.save.chapter = CHAPTERS[0].n;
    assert.equal(a.chapterTitle().sub, CHAPTERS[0].sub);
  });

  test('지금 방의 시각(roomClock): 막의 둘째 방에 들어서면 그 방 시각, 기억 방에 다녀와도 그대로, 막이 아닌 장은 장 시각', () => {
    const act = CHAPTERS.find((c) => (c.rooms?.length ?? 0) >= 2 && !!c.clock)!;
    const a = new Adv(STORY);
    a.runner = null;
    (a as unknown as { applyChapter(n: number): void }).applyChapter(act.n);
    assert.equal(a.roomClock(), act.rooms![0].clock);
    assert.equal(a.roomName(), act.rooms![0].name);
    a.runner = null;
    a.queue = [];
    a.enterRoom(act.rooms![1].id);
    assert.equal(a.roomClock(), act.rooms![1].clock);
    assert.equal(a.roomName(), act.rooms![1].name);
    assert.ok(parseClock(a.roomClock()!) > parseClock(act.clock!));
    // 기억 방(막의 방이 아님)으로 가도 들어선 막의 방 시각
    const mem = Object.keys(STORY.rooms).find((id) => !CHAPTERS.some((c) => c.room === id || c.rooms?.some((r) => r.id === id)))!;
    a.goRoom(mem);
    assert.equal(a.roomClock(), act.rooms![1].clock);
    const dawn = CHAPTERS.find((c) => c.room === 'attic_dawn')!;
    a.save.chapter = dawn.n;
    a.goRoom(dawn.room);
    assert.equal(a.roomClock(), '05:00');
  });
});
