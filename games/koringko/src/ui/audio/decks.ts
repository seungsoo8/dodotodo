/**
 * 크로스페이드 데크 (화면 · 소리와 무관한 계산): 곡마다 데크 하나. 곡을 바꾸면 옛 데크는 줄어들며 계속 울리고
 * 새 데크가 동시에 올라온다. 줄어드는 중인 곡으로 곧장 돌아오면 그 데크를 되살린다.
 * 다 줄어든 데크는 거두고 그 자리(칸)를 함께 쓰는 자리표 저장소에 남긴다 → 탐험 곡은 돌아오면 떠난 마디부터.
 * 소리 쪽(storysound.ts)은 want() 가 돌려준 사건대로 데크의 소리 세기를 옮기고, 데크마다 cursor.next() 로 음을 친다.
 */
import { SongCursor } from './cursor.ts';
import { fadeTau, isOnce, songSteps, type SongId } from './score.ts';

export interface Deck {
  /** 소리 쪽이 데크를 알아보는 번호 */
  key: number;
  cursor: SongCursor;
  /** 줄어드는 중이면 거둘 시각 (null = 살아 있음) */
  endAt: number | null;
  /** 한 번만 트는 신호곡을 다 쳤나 */
  readonly done: boolean;
}

export interface DeckEvent {
  deck: Deck;
  /** 소리 세기 목표 (0 줄임 · 1 키움) */
  target: 0 | 1;
  /** setTargetAtTime 시간 상수 (초) */
  tau: number;
}

/** 시간 상수의 몇 배 뒤에 거두나 (e^-6 ≈ 0.25% 남음) */
const REAP_TAUS = 6;

class SongDeck implements Deck {
  key: number;
  cursor: SongCursor;
  endAt: number | null = null;

  constructor(key: number, cursor: SongCursor) {
    this.key = key;
    this.cursor = cursor;
  }

  get done(): boolean {
    const id = this.cursor.song;
    return !!id && isOnce(id) && this.cursor.pos >= songSteps(id);
  }
}

export class Decks {
  /** 곡마다 떠난 자리 (모든 데크가 함께 쓴다) */
  readonly saved = new Map<SongId, number>();
  live: Deck | null = null;
  all: Deck[] = [];
  private seq = 0;

  /** 원하는 곡 (null = 고요). fade: 대본의 페이드 초 (없으면 기본) */
  want(id: SongId | null, now: number, fade?: number): DeckEvent[] {
    if ((this.live?.cursor.song ?? null) === id) return [];
    const tau = fadeTau(fade);
    const ev: DeckEvent[] = [];
    if (this.live) {
      this.live.endAt = now + tau * REAP_TAUS;
      ev.push({ deck: this.live, target: 0, tau });
      this.live = null;
    }
    if (id === null) return ev;
    const back = this.all.find((d) => d.endAt !== null && d.cursor.song === id);
    if (back) {
      back.endAt = null;
      this.live = back;
      ev.push({ deck: back, target: 1, tau: Math.max(0.3, tau) });
      return ev;
    }
    const cursor = new SongCursor(this.saved);
    cursor.switchTo(id);
    const deck = new SongDeck(++this.seq, cursor);
    this.all.push(deck);
    this.live = deck;
    ev.push({ deck, target: 1, tau: Math.max(0.3, tau) });
    return ev;
  }

  /** 다 줄어든 데크를 거둔다 (자리는 저장소에) */
  reap(now: number): Deck[] {
    const gone = this.all.filter((d) => d.endAt !== null && now >= d.endAt);
    for (const d of gone) d.cursor.switchTo(null);
    this.all = this.all.filter((d) => !gone.includes(d));
    return gone;
  }
}
