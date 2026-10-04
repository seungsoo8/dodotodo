import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { buildMap, isSolid, type MapId } from '../maps.ts';
import { MONSTERS } from '../monsters.ts';
import { accept, complete, onKill, onRiftClear, progress, QUEST_BY_ID, QUESTS, onEliteKill } from '../quests.ts';
import { NPCS, CUTSCENES } from '../story.ts';
import { newSave } from '../character.ts';
import { fixedRng } from './helpers.ts';

const MAPS: MapId[] = ['village', 'forest', 'candy', 'cave', 'factory'];

describe('넓어진 세계', () => {
  test('과자 언덕 끝에는 젤리 여왕, 태엽 공장 끝에는 깡통 대장', () => {
    assert.equal(buildMap('candy').boss?.id, 'b_jelly');
    const f = buildMap('factory');
    assert.equal(f.boss?.id, 'b_tin');
    assert.ok(f.npcs.some((n) => n.id === 'mole'));
  });

  test('과자 언덕에서 태엽 공장으로 가는 길은 젤리 여왕 퀘스트를 끝내야 열린다', () => {
    const w = buildMap('candy').warps.find((x) => x.to === 'factory');
    assert.ok(w);
    assert.equal(w.need, 'factory_open');
  });

  test('모든 지도: 출구가 가리키는 지도와 도착 칸이 있고, 시작 칸 · NPC · 보스 자리는 걸을 수 있다', () => {
    for (const id of MAPS) {
      const m = buildMap(id);
      assert.ok(!isSolid(m, m.start.x, m.start.y), `${id} 시작`);
      for (const wp of m.warps) {
        const to = buildMap(wp.to);
        assert.ok(!isSolid(to, wp.tx, wp.ty), `${id} → ${wp.to} 도착`);
      }
      for (const n of m.npcs) assert.ok(NPCS[n.id], `${id} ${n.id}`);
      if (m.boss) {
        assert.ok(MONSTERS[m.boss.id]);
        assert.ok(!isSolid(m, m.boss.x, m.boss.y), `${id} 보스 자리`);
      }
      for (const s of m.spawns) for (const p of s.pool) assert.ok(MONSTERS[p], `${id} ${p}`);
    }
  });

  test('보스 장면: 젤리 여왕 · 깡통 대장', () => {
    assert.ok(CUTSCENES.jelly.length >= 2);
    assert.ok(CUTSCENES.tin.length >= 2);
  });
});

describe('늘어난 퀘스트', () => {
  test('주 퀘스트 순서: 곰 대장 → 젤리 여왕 → 깡통 대장 → 더스티 → 먼지 왕', () => {
    assert.equal(QUEST_BY_ID.q_jelly.req.quest, 'q_bear');
    assert.equal(QUEST_BY_ID.q_tin.req.quest, 'q_jelly');
    assert.equal(QUEST_BY_ID.q_dusty.req.quest, 'q_tin');
    assert.ok(QUEST_BY_ID.q_jelly.flags?.includes('factory_open'));
  });

  test('퀘스트를 주는 주민은 모두 있고, 보스 퀘스트 대상은 보스다', () => {
    for (const q of QUESTS) {
      assert.ok(NPCS[q.giver], q.id);
      if (q.kind === 'boss' || q.kind === 'kill') assert.ok(MONSTERS[q.target], q.id);
    }
  });

  test('젤리 여왕을 쓰러뜨리고 보고하면 공장 길이 열린다', () => {
    const s = newSave(0, 'toby');
    s.quests.q_bear = { state: 'done', n: 1 };
    assert.equal(accept(s, 'q_jelly'), true);
    onKill(s, 'b_jelly');
    assert.equal(progress(s, 'q_jelly').state, 'ready');
    assert.equal(complete(s, 'q_jelly', fixedRng()), true);
    assert.equal(s.flags.factory_open, true);
  });

  test('정예 사냥 퀘스트: 정예를 쓰러뜨릴 때마다 센다', () => {
    const s = newSave(0, 'toby');
    s.lv = 20;
    const q = QUESTS.find((x) => x.kind === 'elite')!;
    assert.ok(q);
    for (const r of Object.keys(q.req)) if (r === 'quest') s.quests[q.req.quest!] = { state: 'done', n: 1 };
    assert.equal(accept(s, q.id), true);
    for (let i = 0; i < q.count; i++) onEliteKill(s);
    assert.equal(progress(s, q.id).state, 'ready');
  });

  test('균열 퀘스트는 그 층보다 깊은 곳을 깨도 된다 (체크포인트에서 시작해도)', () => {
    const s = newSave(0, 'toby');
    s.quests.q_tin = { state: 'done', n: 1 };
    accept(s, 'q_dusty');
    onRiftClear(s, 7);
    assert.equal(progress(s, 'q_dusty').state, 'ready');
  });
});
