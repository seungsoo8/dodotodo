import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { RIFT_MAX, buildMap, isSolid, isSolidChar, riftBoss, riftLevel, type MapDef, type MapId } from '../maps.ts';
import { MONSTERS } from '../monsters.ts';

/** 시작 칸에서 걸어서 갈 수 있는 칸 */
function reachable(m: MapDef): Set<string> {
  const seen = new Set<string>();
  const q: [number, number][] = [[m.start.x, m.start.y]];
  while (q.length) {
    const [x, y] = q.pop()!;
    const k = `${x},${y}`;
    if (seen.has(k) || isSolid(m, x, y)) continue;
    seen.add(k);
    q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return seen;
}

/** 칸 또는 그 둘레 한 칸 안에 걸어갈 수 있는 곳이 있는가 */
function nearReach(r: Set<string>, x: number, y: number, pad = 1): boolean {
  for (let dy = -pad; dy <= pad; dy++) for (let dx = -pad; dx <= pad; dx++) if (r.has(`${x + dx},${y + dy}`)) return true;
  return false;
}

const FIXED: MapId[] = ['village', 'toybox', 'drawer', 'desk', 'underbed', 'attic'];

describe('고정 지도', () => {
  for (const id of FIXED) {
    test(`${id}: 네모 반듯하고, 시작 칸에서 출구 · NPC · 사냥터 · 보스까지 걸어갈 수 있다`, () => {
      const m = buildMap(id);
      assert.equal(m.tiles.length, m.h);
      for (const row of m.tiles) assert.equal(row.length, m.w);
      const r = reachable(m);
      assert.ok(r.size > 100, `${r.size} 칸`);
      for (const w of m.warps) {
        let ok = false;
        for (let yy = w.y; yy < w.y + w.h; yy++) for (let xx = w.x; xx < w.x + w.w; xx++) ok ||= nearReach(r, xx, yy);
        assert.ok(ok, `출구 → ${w.to}`);
      }
      for (const n of m.npcs) assert.ok(nearReach(r, n.x, n.y), `NPC ${n.id}`);
      for (const s of m.spawns) {
        assert.ok(nearReach(r, s.x, s.y, 2), `사냥터 ${s.x},${s.y}`);
        for (const id2 of s.pool) assert.ok(MONSTERS[id2], id2);
      }
      if (m.boss) assert.ok(nearReach(r, m.boss.x, m.boss.y, 2), '보스');
    });
  }

  test('출구로 도착하는 칸은 그 지도에서 밟을 수 있는 땅이다', () => {
    for (const id of FIXED) {
      for (const w of buildMap(id).warps) {
        const to = buildMap(w.to);
        assert.equal(isSolid(to, w.tx, w.ty), false, `${id} → ${w.to} (${w.tx},${w.ty})`);
      }
    }
  });

  test('마을은 안전하고(사냥터 없음), 방마다 끝에 보스 (곰 대장 → 젤리 여왕 → 깡통 대장 → 더스티 → 먼지 왕)', () => {
    assert.equal(buildMap('village').safe, true);
    assert.equal(buildMap('village').spawns.length, 0);
    const bosses = (['toybox', 'drawer', 'desk', 'underbed', 'attic'] as const).map((id) => buildMap(id).boss?.id);
    assert.deepEqual(bosses, ['b_bear', 'b_jelly', 'b_tin', 'b_dusty', 'b_king']);
    assert.equal(buildMap('underbed').dark, true, '침대 밑은 어둡다');
  });
});

describe('다락방 균열', () => {
  test('같은 깊이 · 같은 씨앗이면 같은 지도, 씨앗이 다르면 다르다', () => {
    assert.deepEqual(buildMap('rift', 3, 42).tiles, buildMap('rift', 3, 42).tiles);
    assert.notDeepEqual(buildMap('rift', 3, 42).tiles, buildMap('rift', 3, 43).tiles);
  });

  test('어떤 씨앗이든 모든 방(사냥터)과 보스 자리에 걸어갈 수 있다', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const depth = (seed % 12) + 1;
      const m = buildMap('rift', depth, seed);
      const r = reachable(m);
      assert.ok(m.spawns.length >= 4, `${seed}: 방 ${m.spawns.length}`);
      for (const s of m.spawns) assert.ok(nearReach(r, s.x, s.y, 2), `씨앗 ${seed} 방 ${s.x},${s.y}`);
    }
  });

  test('다섯 단계마다 보스 (5단계는 더스티, 50단계는 먼지 왕), 깊을수록 몬스터 레벨이 높다', () => {
    assert.equal(riftBoss(3), null);
    assert.equal(riftBoss(5), 'b_dusty');
    assert.ok(riftBoss(10));
    assert.equal(riftBoss(RIFT_MAX), 'b_king');
    assert.ok(riftLevel(20) > riftLevel(2));
    assert.equal(buildMap('rift', 10, 1).boss?.id, riftBoss(10));
    assert.equal(buildMap('rift', 7, 1).boss, undefined);
  });
});

describe('집 안 재질', () => {
  test('책상 시계 공장은 책상 나무판 · 책 더미 벽, 침대 밑은 먼지 바닥 · 먼지 덩이 벽 (예전 공장 · 동굴 재질 없음)', () => {
    const all = (id: 'desk' | 'underbed') => buildMap(id).tiles.join('');
    const desk = all('desk');
    assert.ok(desk.includes('d') && desk.includes('E') && desk.includes('G'));
    assert.ok(!/[MmK]/.test(desk), '쇠 바닥 · 쇠 벽 · 나무 상자 없음');
    const bed = all('underbed');
    assert.ok(bed.includes('u') && bed.includes('Y') && bed.includes('L'));
    assert.ok(!/[C_c]/.test(bed), '동굴 벽 · 동굴 바닥 · 수정 없음');
  });

  test('새 재질의 벽 · 소품은 막히고 바닥은 걸을 수 있다', () => {
    const m = buildMap('desk');
    for (const c of ['E', 'G', 'Y', 'L']) assert.ok(isSolidChar(c), c);
    for (const c of ['d', 'u']) assert.ok(!isSolidChar(c), c);
    assert.ok(!isSolid(m, m.start.x, m.start.y));
  });
});

test('첫 방(장난감 상자) 입구 둘레는 조용하다: 첫 얼음 땡 연습을 몬스터 없이', () => {
  const m = buildMap('toybox');
  for (const z of m.spawns) assert.ok(Math.hypot(z.x - m.start.x, z.y - m.start.y) - z.r >= 8, `${z.x},${z.y}`);
});
