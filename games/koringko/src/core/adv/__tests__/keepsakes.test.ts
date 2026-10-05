import { test } from 'node:test';
import assert from 'node:assert/strict';
import { placeKeepsakes } from '../story/index.ts';
import type { Thing } from '../types.ts';

const mem = (id: string, at: [number, number]): Thing => ({ kind: 'memory', id, at, name: id, caption: id, scene: [], when: 'woke_all' });

test('방이 정한 기억 → 물건 자리표: 그 기억은 keepsake 로 바뀌어 새 자리 · 그림을 갖고, 장면 · 이름 · 조건은 그대로', () => {
  const things = [mem('m1a', [2, 2]), mem('m1d', [16, 13]), { kind: 'star', id: 's1', at: [1, 1], text: '' } as Thing];
  const out = placeKeepsakes(things, { m1d: { at: [9, 7], look: 'chairOld', look2: 'chairOld:tidy' } });
  const d = out.find((t) => t.id === 'm1d')!;
  assert.equal(d.kind, 'keepsake');
  assert.deepEqual(d.kind === 'keepsake' && [d.at, d.look, d.look2, d.name, d.when], [[9, 7], 'chairOld', 'chairOld:tidy', 'm1d', 'woke_all']);
  assert.equal(out.find((t) => t.id === 'm1a')!.kind, 'memory', '자리표에 없으면 그대로');
  assert.equal(out.length, 3);
});

test('자리표가 조건(when)을 주면 그것으로 바꾼다', () => {
  const out = placeKeepsakes([mem('m1c', [3, 3])], { m1c: { at: [4, 4], look: 'door', when: 'nabi_awake' } });
  const c = out[0];
  assert.equal(c.kind === 'keepsake' && c.when, 'nabi_awake');
});

test('자리표에 있는데 기억이 없는 id 는 오류 (오타를 바로 알게)', () => {
  assert.throws(() => placeKeepsakes([mem('m1a', [2, 2])], { m1z: { at: [1, 1], look: 'x' } }), /m1z/);
});
