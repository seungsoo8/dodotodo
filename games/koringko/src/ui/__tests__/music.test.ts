import { test } from 'node:test';
import assert from 'node:assert/strict';
import { musicMood, stepNotes, STEPS, TRACKS } from '../audio/music.ts';

test('곡 고르기: 타이틀 · 지도 테마 · 보스', () => {
  assert.deepEqual(musicMood({ playing: false, theme: 'village', boss: false, nearEnemies: 0 }), { track: 'title', level: 2 });
  assert.equal(musicMood({ playing: true, theme: 'village', boss: false, nearEnemies: 0 }).track, 'village');
  assert.equal(musicMood({ playing: true, theme: 'cave', boss: false, nearEnemies: 0 }).track, 'cave');
  assert.equal(musicMood({ playing: true, theme: 'rift', boss: true, nearEnemies: 0 }).track, 'boss');
});

test('곡 세기: 가까운 적이 많을수록 겹이 늘어난다 (0 → 1 → 2)', () => {
  const lv = (n: number) => musicMood({ playing: true, theme: 'toybox', boss: false, nearEnemies: n }).level;
  assert.equal(lv(0), 0);
  assert.equal(lv(2), 1);
  assert.equal(lv(6), 2);
  // 마을은 언제나 가락까지
  assert.equal(musicMood({ playing: true, theme: 'village', boss: false, nearEnemies: 0 }).level, 2);
});

test('악보: 세기 0 에는 북 · 가락이 없고, 세기 2 의 첫 칸에는 가락이 있다', () => {
  for (const id of Object.keys(TRACKS) as (keyof typeof TRACKS)[]) {
    for (let s = 0; s < STEPS; s++) assert.ok(stepNotes(id, s, 0).every((n) => n.inst === 'bass' || n.inst === 'arp'), id);
    if (TRACKS[id].lead[0] !== undefined) assert.ok(stepNotes(id, 0, 2).some((n) => n.inst === 'lead'), id);
  }
});

test('얼음 땡 동안은 음악이 북 · 가락 없이 숨죽인다 (보스전은 얼음이 없다)', () => {
  assert.equal(musicMood({ playing: true, theme: 'toybox', boss: false, nearEnemies: 6, frozen: true }).level, 0);
  assert.equal(musicMood({ playing: true, theme: 'toybox', boss: false, nearEnemies: 6 }).level, 2);
});

test('방 테마마다 곡이 있다', () => {
  for (const th of ['village', 'toybox', 'candy', 'factory', 'cave', 'rift'] as const) assert.equal(musicMood({ playing: true, theme: th, boss: false, nearEnemies: 0 }).track, th);
});
