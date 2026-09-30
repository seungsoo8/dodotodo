import type { StoryPage } from '../core/story.ts';

/** 한 줄이 나타나는 간격(초) */
export const LINE_DELAY = 0.45;

/** 판 위에 뜨는 이야기 카드 (서장·결말). 떠 있는 동안 판은 멈춘다 */
export interface StoryCard {
  pages: StoryPage[];
  index: number;
  /** 이 쪽을 연 시각 */
  openedAt: number;
  /** 누른 뒤라 이 쪽 줄을 모두 보여 준다 */
  revealed: boolean;
}

export function openCard(pages: StoryPage[], now: number): StoryCard | null {
  return pages.length ? { pages, index: 0, openedAt: now, revealed: false } : null;
}

export function cardPage(card: StoryCard): StoryPage {
  return card.pages[card.index];
}

/** 지금 보이는 줄 수 */
export function shownLines(card: StoryCard, now: number): number {
  const total = cardPage(card).lines.length;
  if (card.revealed) return total;
  return Math.min(total, 1 + Math.floor(Math.max(0, now - card.openedAt) / LINE_DELAY));
}

/** 누름: 줄이 덜 나왔으면 다 보여 주고, 다 나왔으면 다음 쪽 (끝이면 null) */
export function advanceCard(card: StoryCard, now: number): StoryCard | null {
  if (shownLines(card, now) < cardPage(card).lines.length) return { ...card, revealed: true };
  if (card.index + 1 >= card.pages.length) return null;
  return { ...card, index: card.index + 1, openedAt: now, revealed: false };
}
