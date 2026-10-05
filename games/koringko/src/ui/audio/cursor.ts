/**
 * 곡 자리표: 지금 어느 곡의 몇째 칸을 치는가 (화면 · 소리와 무관한 계산).
 * 탐험 곡(resume)은 다른 곡에 갔다 돌아오면 떠난 마디의 첫 칸부터 이어서 친다.
 * 쉼 마디에서 떠났으면 쉼을 건너뛰고 다음 고리 처음부터.
 */
import { BAR, playSteps, resumes, songNotes, songSteps, type SNote, type SongId } from './score.ts';

export class SongCursor {
  song: SongId | null = null;
  /** 이 곡을 처음 튼 뒤로 친 칸 수 (고리를 넘어도 계속 센다) */
  pos = 0;
  private saved = new Map<SongId, number>();

  /** 한 고리 안의 칸 */
  get step(): number {
    return this.song ? this.pos % songSteps(this.song) : 0;
  }

  /** 몇 번째 고리 (0부터) */
  get loop(): number {
    return this.song ? Math.floor(this.pos / songSteps(this.song)) : 0;
  }

  switchTo(id: SongId | null): void {
    if (id === this.song) return;
    if (this.song) this.saved.set(this.song, this.pos);
    this.song = id;
    this.pos = 0;
    if (!id || !resumes(id)) return;
    const was = this.saved.get(id);
    if (was === undefined) return;
    const total = songSteps(id);
    const loop = Math.floor(was / total);
    const inLoop = was % total;
    this.pos = inLoop >= playSteps(id) ? (loop + 1) * total : loop * total + Math.floor(inLoop / BAR) * BAR;
  }

  /** 지금 칸의 음을 내고 한 칸 나아간다 */
  next(): SNote[] {
    if (!this.song) return [];
    const out = songNotes(this.song, this.step, this.loop);
    this.pos++;
    return out;
  }
}
