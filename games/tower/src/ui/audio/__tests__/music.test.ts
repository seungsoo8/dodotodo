import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { STEPS, TRACKS, musicMood, stepNotes, type TrackId } from '../music.ts';

const ids = Object.keys(TRACKS) as TrackId[];

describe('배경음악 곡', () => {
  test('시작 화면 · 낮 · 밤 · 보스 네 곡, 긴장될수록 빠르다', () => {
    assert.deepEqual([...ids].sort(), ['boss', 'day', 'night', 'title']);
    assert.ok(TRACKS.title.bpm < TRACKS.day.bpm);
    assert.ok(TRACKS.day.bpm < TRACKS.night.bpm);
    assert.ok(TRACKS.night.bpm < TRACKS.boss.bpm);
  });

  test('모든 가락 음은 그 곡의 음계 안에 있다 (틀린 음이 없다)', () => {
    for (const id of ids) {
      const t = TRACKS[id];
      const scale = new Set(t.scale.map((n) => n % 12));
      for (let step = 0; step < STEPS; step++) {
        for (const n of stepNotes(id, step, 2)) {
          if (n.midi !== undefined) assert.ok(scale.has(n.midi % 12), `${id} ${step}: ${n.midi}`);
        }
      }
    }
  });

  test('세기에 따라 겹이 늘어난다: 0 은 베이스·반주만, 1 은 북, 2 는 가락까지', () => {
    const insts = (id: TrackId, level: number) => new Set(Array.from({ length: STEPS }, (_, s) => stepNotes(id, s, level)).flat().map((n) => n.inst));
    const calm = insts('day', 0);
    assert.ok(calm.has('bass'));
    assert.ok(!calm.has('kick') && !calm.has('lead'));
    assert.ok(insts('day', 1).has('kick'));
    assert.ok(!insts('day', 1).has('lead'));
    assert.ok(insts('day', 2).has('lead'));
  });

  test('한 바퀴(32칸)가 지나면 같은 가락이 되풀이된다', () => {
    assert.deepEqual(stepNotes('night', 3, 2), stepNotes('night', 3 + STEPS, 2));
  });
});

describe('어떤 곡을 틀지', () => {
  const base = { started: true, lesson: false, status: 'playing' as const, bossAlive: false, night: 0, enemies: 0 };

  test('시작 화면과 연습 판은 잔잔한 곡', () => {
    assert.equal(musicMood({ ...base, started: false }).track, 'title');
    assert.equal(musicMood({ ...base, lesson: true }).track, 'title');
  });

  test('낮에는 낮 곡, 해가 지면 밤 곡, 보스가 있으면 보스 곡', () => {
    assert.equal(musicMood(base).track, 'day');
    assert.equal(musicMood({ ...base, night: 0.6 }).track, 'night');
    assert.equal(musicMood({ ...base, night: 0.6, bossAlive: true }).track, 'boss');
  });

  test('적이 많을수록 세진다 (0 · 1 · 2), 보스전은 늘 가장 세게', () => {
    assert.equal(musicMood({ ...base, enemies: 0 }).level, 0);
    assert.equal(musicMood({ ...base, enemies: 6 }).level, 1);
    assert.equal(musicMood({ ...base, enemies: 20 }).level, 2);
    assert.equal(musicMood({ ...base, bossAlive: true }).level, 2);
  });

  test('판이 끝나면 음악은 멈춘다 (승패 소리가 대신 난다)', () => {
    assert.equal(musicMood({ ...base, status: 'won' }).track, null);
    assert.equal(musicMood({ ...base, status: 'lost' }).track, null);
  });
});
