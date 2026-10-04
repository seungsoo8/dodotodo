import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { findHero, SKILL, ULT } from '../heroes.ts';
import { step } from '../game.ts';
import { arena, dummy, hold, idle, input, placeAt, right } from './helpers.ts';

const near = (a: number, b: number, eps: number) => Math.abs(a - b) <= eps;

describe('움직이기', () => {
  test('누른 방향으로 영웅 속도만큼 가고, 그쪽을 본다', () => {
    const r = arena('toby');
    const x = r.player.x;
    hold(r, { move: right }, 1);
    assert.ok(near(r.player.x - x, findHero('toby').speed, 3), `${r.player.x - x}`);
    assert.ok(near(r.player.facing, 0, 1e-9));
  });

  test('대각선도 같은 빠르기 (빨라지지 않는다)', () => {
    const r = arena('toby');
    const { x, y } = r.player;
    const d = Math.SQRT1_2;
    hold(r, { move: { x: d, y: d } }, 0.5);
    assert.ok(near(Math.hypot(r.player.x - x, r.player.y - y), findHero('toby').speed * 0.5, 2));
  });

  test('벽과 장애물은 지나가지 못한다', () => {
    const r = arena('toby');
    hold(r, { move: right }, 10);
    assert.ok(r.player.x <= r.room.width - r.config.wall - r.player.r + 1e-6);
    const s = arena('toby');
    s.room.obstacles.push({ x: s.player.x + 30, y: s.player.y - 20, w: 20, h: 40 });
    hold(s, { move: right }, 2);
    assert.ok(s.player.x <= s.room.obstacles[0].x - s.player.r + 1e-6, `${s.player.x}`);
  });
});

describe('대시', () => {
  test('누르면 정해진 거리를 짧게 미끄러지고, 그동안 무적', () => {
    const r = arena('toby');
    const x = r.player.x;
    const dash = findHero('toby').dash;
    hold(r, { move: right, dash: true }, dash.time / 2);
    assert.ok(r.player.iframes > 0 || r.player.dashLeft > 0, '대시 중 무적');
    hold(r, {}, dash.time);
    assert.ok(near(r.player.x - x, dash.distance, 4), `${r.player.x - x}`);
  });

  test('충전이 없으면 못 하고, 다시 차면 된다', () => {
    const r = arena('toby');
    const dash = findHero('toby').dash;
    hold(r, { move: right, dash: true }, 0.2);
    assert.equal(r.player.dashCharges, dash.charges - 1);
    const x = r.player.x;
    hold(r, { dash: true }, 0.05);
    assert.ok(near(r.player.x, x, 0.5), '충전 없음');
    idle(r, dash.recharge);
    assert.equal(r.player.dashCharges, dash.charges);
  });

  test('루루는 두 번 연달아 구를 수 있다', () => {
    const r = arena('ruru');
    hold(r, { move: right, dash: true }, 0.2);
    hold(r, { move: right, dash: true }, 0.2);
    assert.equal(r.player.dashCharges, 0);
  });

  test('나비의 대시는 순간이동 (바로 그 자리)', () => {
    const r = arena('nabi');
    const x = r.player.x;
    step(r, 1 / 60, input({ move: right, dash: true }));
    assert.ok(near(r.player.x - x, findHero('nabi').dash.distance, 3), `${r.player.x - x}`);
  });

  test('대시 중에는 적에게 맞지 않는다', () => {
    const r = arena('toby');
    placeAt(r, 20, 0, dummy({ damage: 30 }));
    const hp = r.player.hp;
    hold(r, { move: right, dash: true }, 0.1);
    assert.equal(r.player.hp, hp);
  });
});

describe('기본 공격', () => {
  test('토비: 앞의 적은 맞고 뒤의 적은 안 맞는다', () => {
    const r = arena('toby');
    const front = placeAt(r, 25, 0);
    const back = placeAt(r, -25, 0);
    hold(r, { attack: true, aim: { x: r.player.x + 100, y: r.player.y } }, 1 / 60);
    assert.equal(front.hp, 1000 - 10);
    assert.equal(back.hp, 1000);
  });

  test('토비: 이어 치면 10 · 10 · 20 세 번째가 세고, 쉬면 처음부터', () => {
    const r = arena('toby');
    const e = placeAt(r, 25, 0);
    const aim = { x: r.player.x + 100, y: r.player.y };
    const dealt: number[] = [];
    let hp = e.hp;
    for (let i = 0; i < 4; i++) {
      hold(r, { attack: true, aim }, 1 / 60);
      dealt.push(hp - e.hp);
      hp = e.hp;
      // 다음 공격이 가능해질 때까지 (누르지 않고) 기다린다
      while (r.player.attackCd > 0) step(r, 1 / 60, input({ aim }));
    }
    assert.deepEqual(dealt, [10, 10, 20, 10]);
    idle(r, r.config.comboWindow + 0.1);
    assert.equal(r.player.combo, 0);
  });

  test('누르고 있으면 회복 시간마다 계속 친다 (그보다 빨리는 못 친다)', () => {
    const r = arena('toby');
    const e = placeAt(r, 25, 0, dummy({ hp: 1e6 }));
    hold(r, { attack: true, aim: { x: r.player.x + 100, y: r.player.y } }, 1);
    const swings = r.stats.swings;
    // 0.22 + 0.22 + 0.4 = 0.84 초에 세 번, 1초면 네 번
    assert.equal(swings, 4);
    assert.ok(e.hp < 1e6);
  });

  test('보리: 크게 치고 멀리 밀어낸다', () => {
    const r = arena('bori');
    const e = placeAt(r, 30, 0, dummy({ weight: 1 }));
    hold(r, { attack: true, aim: { x: r.player.x + 100, y: r.player.y } }, 1 / 60);
    assert.equal(1000 - e.hp, 24);
    const x = e.x;
    idle(r, 0.4);
    assert.ok(e.x - x > 20, `밀려남 ${e.x - x}`);
  });

  test('무거운 적(weight 0)은 밀리지 않는다', () => {
    const r = arena('bori');
    const e = placeAt(r, 30, 0, dummy({ weight: 0 }));
    hold(r, { attack: true, aim: { x: r.player.x + 100, y: r.player.y } }, 1 / 60);
    const x = e.x;
    idle(r, 0.4);
    assert.ok(near(e.x, x, 1e-9));
  });

  test('루루: 화살이 날아가 멀리 있는 적을 맞힌다', () => {
    const r = arena('ruru');
    const e = placeAt(r, 150, 0);
    hold(r, { attack: true, aim: { x: e.x, y: e.y } }, 1 / 60);
    assert.equal(e.hp, 1000, '아직 날아가는 중');
    idle(r, 0.6);
    assert.equal(1000 - e.hp, 9);
    assert.equal(r.projectiles.length, 0, '맞으면 사라진다');
  });

  test('나비: 구슬이 터지면 주변 적도 함께 맞는다', () => {
    const r = arena('nabi');
    const a = placeAt(r, 120, 0);
    const b = placeAt(r, 120, 18);
    const far = placeAt(r, 120, 60);
    hold(r, { attack: true, aim: { x: a.x, y: a.y } }, 1 / 60);
    idle(r, 0.8);
    assert.ok(a.hp < 1000 && b.hp < 1000, '터진 자리 근처');
    assert.equal(far.hp, 1000);
  });
});

describe('조준', () => {
  test('조준점이 있으면 그쪽을 본다', () => {
    const r = arena('toby');
    step(r, 1 / 60, input({ aim: { x: r.player.x, y: r.player.y - 50 } }));
    assert.ok(near(r.player.facing, -Math.PI / 2, 1e-9));
  });

  test('조준점이 없으면 가까운 적을 보고, 적이 없으면 움직이는 쪽', () => {
    const r = arena('toby');
    placeAt(r, 0, 80);
    placeAt(r, -150, 0);
    step(r, 1 / 60, input({ attack: true }));
    assert.ok(near(r.player.facing, Math.PI / 2, 1e-9), `${r.player.facing}`);
    const s = arena('toby');
    step(s, 1 / 60, input({ move: { x: -1, y: 0 } }));
    assert.ok(near(Math.abs(s.player.facing), Math.PI, 1e-9));
  });
});

describe('기술', () => {
  test('토비 회전 베기: 사방의 적이 모두 맞고, 재사용 대기 동안은 다시 못 쓴다', () => {
    const r = arena('toby');
    const es = [placeAt(r, 30, 0), placeAt(r, -30, 0), placeAt(r, 0, 30), placeAt(r, 0, -30)];
    step(r, 1 / 60, input({ skill: true }));
    for (const e of es) assert.equal(1000 - e.hp, SKILL.spin.damage);
    step(r, 1 / 60, input({ skill: true }));
    assert.equal(1000 - es[0].hp, SKILL.spin.damage, '대기 중');
    idle(r, findHero('toby').skill.cooldown);
    step(r, 1 / 60, input({ skill: true }));
    assert.equal(1000 - es[0].hp, SKILL.spin.damage * 2);
  });

  test('보리 땅 내려찍기: 앞쪽 넓게 맞고 기절한다', () => {
    const r = arena('bori');
    const e = placeAt(r, 45, 10);
    step(r, 1 / 60, input({ skill: true, aim: { x: r.player.x + 100, y: r.player.y } }));
    idle(r, SKILL.slam.delay + 0.05);
    assert.equal(1000 - e.hp, SKILL.slam.damage);
    assert.ok(e.status.stun > 0);
  });

  test('루루 부채 화살: 다섯 대가 부채꼴로', () => {
    const r = arena('ruru');
    step(r, 1 / 60, input({ skill: true, aim: { x: r.player.x + 100, y: r.player.y } }));
    assert.equal(r.projectiles.filter((p) => p.from === 'player').length, SKILL.fan.count);
    const angles = r.projectiles.map((p) => Math.atan2(p.vy, p.vx));
    const spread = (Math.max(...angles) - Math.min(...angles)) * (180 / Math.PI);
    assert.ok(near(spread, SKILL.fan.spread, 0.5), `${spread}`);
  });

  test('나비 얼음 장판: 조준한 곳 위의 적이 느려지고 계속 아프다', () => {
    const r = arena('nabi');
    const e = placeAt(r, 100, 0, dummy({ speed: 50 }));
    step(r, 1 / 60, input({ skill: true, aim: { x: e.x, y: e.y } }));
    idle(r, 1.1);
    assert.ok(e.status.slow < 1, '느려짐');
    assert.ok(1000 - e.hp >= SKILL.frost.damage * 2, `${1000 - e.hp}`);
  });
});

describe('궁극기', () => {
  test('게이지는 적을 때리면 찬다. 가득 차기 전에는 못 쓴다', () => {
    const r = arena('toby');
    const e = placeAt(r, 25, 0, dummy({ hp: 1e6 }));
    hold(r, { attack: true, aim: { x: e.x, y: e.y } }, 1 / 60);
    assert.ok(near(r.player.ult, 10 * r.config.ult.perDamage, 1e-9));
    step(r, 1 / 60, input({ ult: true }));
    assert.ok(r.player.ult > 0, '안 썼다');
  });

  test('토비 달토끼 난무: 가까운 적들을 베고 잠깐 무적', () => {
    const r = arena('toby');
    const es = [placeAt(r, 60, 0), placeAt(r, -80, 20), placeAt(r, 0, 100)];
    r.player.ult = r.config.ult.max;
    step(r, 1 / 60, input({ ult: true }));
    for (const e of es) assert.ok(1000 - e.hp >= ULT.dance.damage, `${1000 - e.hp}`);
    assert.equal(r.player.ult, 0);
    assert.ok(r.player.iframes > 0);
  });

  test('보리 곰의 분노: 잠시 더 세게 치고 덜 아프다', () => {
    const r = arena('bori');
    const e = placeAt(r, 30, 0);
    r.player.ult = r.config.ult.max;
    step(r, 1 / 60, input({ ult: true }));
    assert.ok(r.player.rageLeft > 0);
    const hp = e.hp;
    while (r.player.attackCd > 0) step(r, 1 / 60, input());
    step(r, 1 / 60, input({ attack: true, aim: { x: e.x, y: e.y } }));
    assert.ok(near(hp - e.hp, 24 * ULT.rage.damageMul, 1e-6), `${hp - e.hp}`);
  });

  test('루루 화살비: 조준한 곳에 여러 번 쏟아진다', () => {
    const r = arena('ruru');
    const e = placeAt(r, 120, 0);
    r.player.ult = r.config.ult.max;
    step(r, 1 / 60, input({ ult: true, aim: { x: e.x, y: e.y } }));
    idle(r, ULT.rain.life + 0.1);
    assert.ok(1000 - e.hp >= ULT.rain.damage * 8, `${1000 - e.hp}`);
  });

  test('나비 유성우: 적들 위로 별똥별이 떨어진다', () => {
    const r = arena('nabi');
    const es = [placeAt(r, 100, 0), placeAt(r, -100, 40)];
    r.player.ult = r.config.ult.max;
    step(r, 1 / 60, input({ ult: true }));
    idle(r, ULT.meteor.delayMax + 0.1);
    for (const e of es) assert.ok(e.hp <= 1000 - ULT.meteor.damage, `${e.hp}`);
  });
});

describe('맞기', () => {
  test('적에게 닿으면 피해, 잠깐 무적이라 연달아 맞지 않는다', () => {
    const r = arena('toby');
    placeAt(r, 10, 0, dummy({ damage: 12 }));
    idle(r, 0.1);
    assert.equal(r.player.hp, 100 - 12);
    idle(r, 0.3);
    assert.equal(r.player.hp, 100 - 12);
  });

  test('보리는 단단해서 덜 아프다 (방어 15%)', () => {
    const r = arena('bori');
    placeAt(r, 10, 0, dummy({ damage: 20 }));
    idle(r, 0.05);
    assert.ok(near(r.player.hp, 140 - 20 * 0.85, 1e-9));
  });

  test('체력이 다하면 판이 끝난다', () => {
    const r = arena('toby');
    r.player.hp = 5;
    placeAt(r, 10, 0, dummy({ damage: 50 }));
    idle(r, 0.05);
    assert.equal(r.status, 'lost');
  });
});
