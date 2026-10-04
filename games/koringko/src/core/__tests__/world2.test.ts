import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { buildMap, isSolid, type MapId } from '../maps.ts';
import { MONSTERS } from '../monsters.ts';
import { accept, complete, onKill, onRiftClear, progress, QUEST_BY_ID, QUESTS, onEliteKill } from '../quests.ts';
import { NPCS, CUTSCENES } from '../story.ts';
import { newSave } from '../character.ts';
import { fixedRng } from './helpers.ts';

const MAPS: MapId[] = ['village', 'toybox', 'drawer', 'desk', 'underbed', 'attic'];

describe('넓어진 세계', () => {
  test('과자 서랍 끝에는 젤리 여왕, 책상 시계 공장 끝에는 깡통 대장 (두더지 기사가 있다)', () => {
    assert.equal(buildMap('drawer').boss?.id, 'b_jelly');
    const f = buildMap('desk');
    assert.equal(f.boss?.id, 'b_tin');
    assert.ok(f.npcs.some((n) => n.id === 'mole'));
  });

  test('방은 모두 블록 마을에서 나가고, 첫 방(장난감 상자) 말고는 깃발이 있어야 열린다', () => {
    const need = Object.fromEntries(buildMap('village').warps.map((w) => [w.to, w.need ?? null]));
    assert.deepEqual(need, { toybox: null, drawer: 'drawer_open', desk: 'desk_open', underbed: 'bed_open', attic: 'attic_open' });
    for (const id of ['toybox', 'drawer', 'desk', 'underbed', 'attic'] as const) {
      assert.deepEqual(buildMap(id).warps.map((w) => w.to), ['village'], `${id} 는 마을로 돌아간다`);
    }
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
  test('주 퀘스트 순서: 보리 구출 → 곰 대장 → 루루 구출 → 젤리 여왕 → 나비 구출 → 깡통 대장 → 더스티 → 먼지 왕', () => {
    const chain: string[] = [];
    let q = QUESTS.find((x) => x.main && !x.req.quest);
    while (q) {
      chain.push(q.id);
      const id = q.id;
      q = QUESTS.find((x) => x.main && x.req.quest === id);
    }
    assert.deepEqual(chain, ['q_fluff', 'q_bori', 'q_bear', 'q_ruru', 'q_jelly', 'q_nabi', 'q_tin', 'q_dusty', 'q_king']);
    assert.ok(QUEST_BY_ID.q_bear.flags?.includes('drawer_open'));
    assert.ok(QUEST_BY_ID.q_jelly.flags?.includes('desk_open'));
    assert.ok(QUEST_BY_ID.q_tin.flags?.includes('bed_open'));
    assert.ok(QUEST_BY_ID.q_dusty.flags?.includes('attic_open'));
    assert.ok(QUEST_BY_ID.q_king.flags?.includes('rift_open'));
  });

  test('구출 퀘스트의 동료는 그 방의 먼지 고치 안에 있다', () => {
    const where: Record<string, string> = { bori: 'toybox', ruru: 'drawer', nabi: 'desk' };
    for (const q of QUESTS.filter((x) => x.kind === 'rescue')) {
      const m = buildMap(where[q.target] as MapId);
      assert.ok(m.structures.some((st) => st.kind === 'cocoon' && st.id === q.target), q.id);
    }
  });

  test('퀘스트를 주는 주민은 모두 있고, 보스 퀘스트 대상은 보스다', () => {
    for (const q of QUESTS) {
      assert.ok(NPCS[q.giver], q.id);
      if (q.kind === 'boss' || q.kind === 'kill') assert.ok(MONSTERS[q.target], q.id);
    }
  });

  test('젤리 여왕을 쓰러뜨리고 보고하면 책상으로 가는 길이 열린다', () => {
    const s = newSave(0, 'toby');
    s.quests.q_ruru = { state: 'done', n: 1 };
    assert.equal(accept(s, 'q_jelly'), true);
    onKill(s, 'b_jelly');
    assert.equal(progress(s, 'q_jelly').state, 'ready');
    assert.equal(complete(s, 'q_jelly', fixedRng()), true);
    assert.equal(s.flags.desk_open, true);
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
    s.quests.q_king = { state: 'done', n: 1 };
    accept(s, 'q_rift10');
    onRiftClear(s, 9);
    assert.equal(progress(s, 'q_rift10').state, 'active');
    onRiftClear(s, 12);
    assert.equal(progress(s, 'q_rift10').state, 'ready');
  });
});
