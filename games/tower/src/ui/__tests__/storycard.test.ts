import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyMeta } from '../../core/meta.ts';
import { storyPages } from '../../core/story.ts';
import { LINE_DELAY, advanceCard, cardPage, openCard, shownLines } from '../storycard.ts';

const pages = storyPages(emptyMeta()).slice(0, 2); // 서막 · 수호탑 서장

describe('판 위 이야기 카드', () => {
  test('보여 줄 쪽이 없으면 카드를 열지 않는다', () => {
    assert.equal(openCard([], 0), null);
  });

  test('줄이 하나씩 나타난다: 연 순간 첫 줄, LINE_DELAY 마다 한 줄 더, 끝에서 멈춤', () => {
    const c = openCard(pages, 10)!;
    const n = pages[0].lines.length;
    assert.equal(shownLines(c, 10), 1);
    assert.equal(shownLines(c, 10 + LINE_DELAY * 2 + 0.01), 3);
    assert.equal(shownLines(c, 10 + 999), n);
  });

  test('줄이 다 나오기 전에 누르면 이 쪽을 한 번에 다 보여 준다', () => {
    const c = openCard(pages, 0)!;
    const next = advanceCard(c, 0.1)!;
    assert.equal(cardPage(next).id, 'world');
    assert.equal(shownLines(next, 0.1), pages[0].lines.length);
  });

  test('다 나온 뒤 누르면 다음 쪽, 줄은 다시 하나부터', () => {
    const c = openCard(pages, 0)!;
    const next = advanceCard(c, 100)!;
    assert.equal(cardPage(next).id, 'prologue:guardian');
    assert.equal(shownLines(next, 100), 1);
  });

  test('마지막 쪽을 다 읽고 누르면 카드가 닫힌다 (null)', () => {
    let c = openCard(pages, 0);
    c = advanceCard(c!, 100);
    assert.equal(advanceCard(c!, 200), null);
  });
});
