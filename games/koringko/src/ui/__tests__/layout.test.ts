import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hudLayout, type Circle } from '../layout.ts';

const SIZES: [number, number][] = [
  [640, 360],
  [683, 384],
  [390, 844],
  [844, 390],
  [320, 300],
];

function inside(c: Circle, w: number, h: number): boolean {
  return c.x - c.r >= 0 && c.y - c.r >= 0 && c.x + c.r <= w && c.y + c.r <= h;
}

test('터치 단추: 가로 · 세로 어느 화면에서도 화면 안에 있고 서로 겹치지 않는다', () => {
  for (const [w, h] of SIZES) {
    const L = hudLayout(w, h, true);
    const btns = Object.values(L.touch);
    assert.equal(btns.length, 8, `${w}x${h}`);
    for (const b of btns) assert.ok(inside(b, w, h), `${w}x${h} ${JSON.stringify(b)}`);
    for (let i = 0; i < btns.length; i++)
      for (let j = i + 1; j < btns.length; j++) {
        const a = btns[i];
        const b = btns[j];
        assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= a.r + b.r, `${w}x${h} 겹침 ${i},${j}`);
      }
  }
});

test('터치 단추: 공격 단추가 가장 크고 오른쪽 아래에 있다', () => {
  for (const [w, h] of SIZES) {
    const L = hudLayout(w, h, true);
    const atk = L.touch.attack;
    for (const [k, b] of Object.entries(L.touch)) if (k !== 'attack') assert.ok(b.r < atk.r);
    assert.ok(atk.x > w / 2 && atk.y > h / 2);
  }
});

test('키보드 화면: 단축칸 6개가 아래 가운데에 화면 안으로 놓이고 미니맵과 겹치지 않는다', () => {
  for (const [w, h] of SIZES) {
    const L = hudLayout(w, h, false);
    assert.equal(L.quick.length, 6);
    for (const q of L.quick) {
      assert.ok(q.x >= 0 && q.x + q.w <= w && q.y + q.h <= h, `${w}x${h}`);
      assert.ok(q.y > h / 2);
    }
    const mm = L.minimap;
    assert.ok(mm.x >= 0 && mm.x + mm.w <= w && mm.y >= 0);
    assert.ok(mm.x >= L.status.x + L.status.w, `${w}x${h} 미니맵이 상태창과 겹침`);
  }
});

test('탐험대 얼굴 4칸: 상태창 아래에 겹치지 않게 놓이고, 퀘스트 알림과 터치 단추를 가리지 않는다', () => {
  for (const [w, h] of SIZES) {
    for (const touch of [false, true]) {
      const L = hudLayout(w, h, touch);
      assert.equal(L.party.length, 4);
      const over = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
      for (let i = 0; i < 4; i++) {
        const p = L.party[i];
        assert.ok(p.x >= 0 && p.y >= L.status.y + L.status.h && p.x + p.w <= w, `${w}x${h} ${i}`);
        assert.ok(p.w >= 20 && p.h >= 20, '손가락으로 누를 만한 크기');
        for (let j = i + 1; j < 4; j++) assert.ok(!over(p, L.party[j]));
        assert.ok(!over(p, L.quest), `${w}x${h} 퀘스트와 겹침`);
        for (const c of Object.values(L.touch)) assert.ok(!over(p, { x: c.x - c.r, y: c.y - c.r, w: c.r * 2, h: c.r * 2 }));
      }
    }
  }
});

test('터치 단추에 사탕 · 태엽 감기가 있다', () => {
  const L = hudLayout(640, 360, true);
  assert.ok(L.touch.hp && L.touch.wind);
});
