import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Fx } from '../render/fx.ts';

test('효과: 쓰러뜨리면 몬스터 쓰러짐 그림이 잠깐 남았다가 사라진다', () => {
  const fx = new Fx();
  fx.onEvent({ kind: 'kill', at: { x: 10, y: 20 }, monsterId: 1, defId: 'fluff', rank: 'normal', boss: false, exp: 5 }, 0, '#fff');
  assert.equal(fx.corpses.length, 1);
  assert.equal(fx.corpses[0].defId, 'fluff');
  fx.update(0.3);
  assert.equal(fx.corpses.length, 1);
  fx.update(0.3);
  assert.equal(fx.corpses.length, 0);
});

test('효과: 피해 숫자는 위로 떠오르다 사라지고, 치명타는 크게 · 멈칫', () => {
  const fx = new Fx();
  fx.onEvent({ kind: 'hit', at: { x: 0, y: 0 }, amount: 42, crit: true, targetId: 1, skill: false }, 0, '#fff');
  const t = fx.texts[0];
  assert.equal(t.text, '42');
  assert.equal(t.big, true);
  assert.ok(fx.hitstop > 0);
  const y = t.y;
  fx.update(0.2);
  assert.ok(fx.texts[0].y < y);
  fx.update(2);
  assert.equal(fx.texts.length, 0);
});

test('효과: 맞은 직후 다른 방으로 가도 (세계 시간이 0부터) 주인공이 하얗게 번쩍인 채로 남지 않는다', () => {
  const fx = new Fx();
  fx.onEvent({ kind: 'hurt', at: { x: 0, y: 0 }, amount: 5 }, 12, '#fff');
  assert.ok(12 - fx.hurtAt < 0.1, '맞은 순간에는 번쩍');
  fx.clear();
  for (const t of [0, 0.5, 3, 11.95]) assert.ok(t - fx.hurtAt >= 0.35, `새 방 시간 ${t}`);
  assert.ok(0 - fx.lastSwing.time > 1, '휘두르기 자국도 남지 않는다');
});
