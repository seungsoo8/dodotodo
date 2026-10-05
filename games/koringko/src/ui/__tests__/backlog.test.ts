/** 대사 기록(백로그): 새 대사가 뜰 때마다 모아 두고(최근 80줄), 멈춤 메뉴에서 거슬러 본다 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Backlog, BACKLOG_MAX, logWindow } from '../backlog.ts';

describe('대사 기록 모으기', () => {
  test('같은 대사 객체는 한 번만, 새 대사 객체가 오면 덧붙인다 (null 은 무시)', () => {
    const b = new Backlog();
    const d1 = { who: 'toby', text: '안녕', shown: 0 };
    b.track(d1);
    d1.shown = 2;
    b.track(d1);
    b.track(null);
    b.track({ who: '', text: '바람이 분다.', shown: 0 });
    assert.deepEqual(b.lines(), [
      { who: 'toby', text: '안녕' },
      { who: '', text: '바람이 분다.' },
    ]);
  });

  test('같은 글이라도 새로 나온 대사면 또 적는다 (되풀이된 대사)', () => {
    const b = new Backlog();
    b.track({ who: 'bori', text: '응', shown: 0 });
    b.track({ who: 'bori', text: '응', shown: 0 });
    assert.equal(b.lines().length, 2);
  });

  test(`최근 ${BACKLOG_MAX}줄만 남기고 오래된 줄부터 버린다`, () => {
    const b = new Backlog();
    for (let i = 0; i < BACKLOG_MAX + 5; i++) b.track({ who: 'toby', text: `줄${i}`, shown: 0 });
    const ls = b.lines();
    assert.equal(ls.length, BACKLOG_MAX);
    assert.equal(ls[0].text, '줄5');
    assert.equal(ls.at(-1)!.text, `줄${BACKLOG_MAX + 4}`);
  });

  test('clear 하면 비고, 지금 대사를 다시 받아도 적는다', () => {
    const b = new Backlog();
    const d = { who: 'toby', text: 'a', shown: 0 };
    b.track(d);
    b.clear();
    assert.equal(b.lines().length, 0);
    b.track(d);
    assert.equal(b.lines().length, 1);
  });
});

describe('대사 기록 보기 창 (아래가 최신, 위로 거슬러 올라간다)', () => {
  const ls = Array.from({ length: 10 }, (_, i) => i);

  test('scroll 0 이면 맨 끝 rows 줄', () => {
    assert.deepEqual(logWindow(ls, 0, 4), { items: [6, 7, 8, 9], scroll: 0, max: 6 });
  });

  test('scroll 만큼 위로, 끝을 넘으면 맨 위에서 멈춘다', () => {
    assert.deepEqual(logWindow(ls, 2, 4).items, [4, 5, 6, 7]);
    assert.deepEqual(logWindow(ls, 99, 4), { items: [0, 1, 2, 3], scroll: 6, max: 6 });
    assert.equal(logWindow(ls, -3, 4).scroll, 0);
  });

  test('줄이 rows 보다 적으면 다 보이고 거슬러 갈 곳이 없다', () => {
    assert.deepEqual(logWindow([1, 2], 5, 4), { items: [1, 2], scroll: 0, max: 0 });
    assert.deepEqual(logWindow([], 0, 4), { items: [], scroll: 0, max: 0 });
  });
});
