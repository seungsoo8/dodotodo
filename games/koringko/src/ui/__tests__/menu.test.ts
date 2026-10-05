/** 메뉴 글: 멈춤 메뉴의 「지금 할 일」(E6) · 조작 안내(F3 — 손가락 기기에 키 글자 없음) */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { controlsLine, todoLines } from '../menu.ts';

describe('지금 할 일', () => {
  test('목표가 있으면 첫 줄, 함께하는 친구마다 할 수 있는 일 한 줄', () => {
    const ls = todoLines('다락 창가의 상자를 열어 보자', ['toby', 'bori', 'nabi']);
    assert.equal(ls[0], '다락 창가의 상자를 열어 보자');
    assert.ok(ls.some((l) => l.includes('토비') && l.includes('태엽')));
    assert.ok(ls.some((l) => l.includes('보리') && l.includes('밀')));
    assert.ok(ls.some((l) => l.includes('나비') && l.includes('등불')));
    assert.ok(!ls.some((l) => l.includes('루루')), '함께하지 않는 루루가 나왔다');
  });

  test('목표가 없으면 둘러보라는 줄, 모르는 동료는 건너뛴다', () => {
    const ls = todoLines(null, ['ruru', 'zzz']);
    assert.equal(ls[0], '둘러보며 살펴보자');
    assert.equal(ls.length, 2);
    assert.ok(ls[1].includes('루루') && ls[1].includes('밧줄'));
  });
});

describe('조작 안내 줄', () => {
  test('손가락 기기에는 키보드 글자(Z · Esc · 방향키)가 없다', () => {
    const t = controlsLine(true);
    assert.ok(!/Z|Esc|방향키/.test(t), t);
    assert.ok(t.includes('눌러'));
  });

  test('키보드에는 Z · Esc 를 알려 준다', () => {
    const t = controlsLine(false);
    assert.ok(t.includes('Z') && t.includes('Esc'), t);
  });
});
