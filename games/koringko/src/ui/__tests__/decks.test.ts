import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Decks } from '../audio/decks.ts';
import { songBar, songSteps } from '../audio/score.ts';

const play = (d: Decks, steps: number) => {
  for (const k of d.all) for (let i = 0; i < steps; i++) k.cursor.next();
};

describe('곡 사이 크로스페이드 (두 곡이 잠깐 겹친다)', () => {
  test('처음 곡: 데크 하나가 소리 0 에서 1 로 올라온다', () => {
    const d = new Decks();
    const ev = d.want('ex_attic', 10);
    assert.equal(d.live?.cursor.song, 'ex_attic');
    assert.deepEqual(ev.map((e) => [e.deck.cursor.song, e.target]), [['ex_attic', 1]]);
  });

  test('곡을 바꾸면 옛 곡은 줄어들며 계속 울리고 (사라지는 시각까지), 새 곡이 동시에 올라온다', () => {
    const d = new Decks();
    d.want('ex_attic', 0);
    const ev = d.want('box', 5, 2);
    assert.equal(d.all.length, 2, '두 곡이 겹친다');
    const out = ev.find((e) => e.target === 0)!;
    const inn = ev.find((e) => e.target === 1)!;
    assert.equal(out.deck.cursor.song, 'ex_attic');
    assert.equal(inn.deck.cursor.song, 'box');
    assert.ok(Math.abs(out.tau - 2 / 3) < 1e-9, 'fade=2 → 시간 상수 2/3');
    assert.ok(out.deck.endAt! > 5 + 2 && out.deck.endAt! < 5 + 6, `${out.deck.endAt}`);
    assert.equal(d.reap(6).length, 0, '줄어드는 중에는 남는다');
    assert.equal(d.reap(out.deck.endAt! + 0.01).length, 1);
    assert.deepEqual(d.all.map((k) => k.cursor.song), ['box']);
  });

  test('같은 곡을 다시 원하면 아무 일도 없다', () => {
    const d = new Decks();
    d.want('ex_attic', 0);
    assert.deepEqual(d.want('ex_attic', 1), []);
    assert.equal(d.all.length, 1);
  });

  test('줄어드는 중인 곡으로 곧장 돌아오면 그 데크를 되살린다 (새로 시작하지 않는다)', () => {
    const d = new Decks();
    d.want('ex_attic', 0);
    const first = d.live!;
    play(d, 37);
    d.want('box', 1);
    const ev = d.want('ex_attic', 1.5);
    assert.equal(d.live, first);
    assert.equal(first.endAt, null);
    assert.equal(first.cursor.pos, 37, '자리 그대로');
    assert.deepEqual(ev.map((e) => [e.deck.cursor.song, e.target]).sort(), [['box', 0], ['ex_attic', 1]]);
  });

  test('기억에 들어갔다 나오면 탐험 곡은 떠난 마디 첫 칸부터 이어서 (사라진 데크의 자리를 기억)', () => {
    const d = new Decks();
    d.want('ex_attic', 0);
    const L = songBar('ex_attic');
    play(d, 3 * L + 5);
    d.want('grandma', 1);
    play(d, 7);
    d.reap(100);
    assert.deepEqual(d.all.map((k) => k.cursor.song), ['grandma']);
    d.want('ex_attic', 120);
    // 줄어드는 동안에도 3L+5+7 칸까지 쳤다 → 넷째 마디(0부터 3) 첫 칸부터
    assert.equal(d.live!.cursor.pos, 3 * L, '떠난 마디 첫 칸부터');
  });

  test('이어 틀지 않는 곡(기억 곡)은 다시 오면 처음부터', () => {
    const d = new Decks();
    d.want('grandma', 0);
    play(d, 40);
    d.want('ex_attic', 1);
    d.reap(100);
    d.want('grandma', 101);
    assert.equal(d.live!.cursor.pos, 0);
  });

  test('고요(null): 지금 곡이 줄어들고 새 곡은 없다, 다 줄면 데크가 없다', () => {
    const d = new Decks();
    d.want('ex_attic', 0);
    const ev = d.want(null, 2, 3);
    assert.equal(d.live, null);
    assert.deepEqual(ev.map((e) => e.target), [0]);
    assert.equal(ev[0].tau, 1);
    d.reap(2 + 3 * 6);
    assert.equal(d.all.length, 0);
  });

  test('한 번만 트는 신호곡은 끝나면 (둘째 고리) 다 친 것으로 본다', () => {
    const d = new Decks();
    d.want('sting_memory', 0);
    const k = d.live!;
    assert.equal(k.done, false);
    play(d, songSteps('sting_memory'));
    assert.equal(k.done, true);
  });
});
