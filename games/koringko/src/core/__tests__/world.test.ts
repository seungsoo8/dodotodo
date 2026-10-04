import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { CLASSES, SKILLS, expToNext } from '../classes.ts';
import { armorMul } from '../combat.ts';
import { DEATH_GOLD, changeMap, enterRift, interactTarget, newGame, step } from '../game.ts';
import { TILE, buildMap } from '../maps.ts';
import { MONSTERS } from '../monsters.ts';
import { POTION, ROLL } from '../player.ts';
import { newSave } from '../character.ts';
import { NO_INPUT, tileCenter } from '../world.ts';
import { clearField, fixedRng, freeze, hold, idle, placeAt, play } from './helpers.ts';

const near = (a: number, b: number, eps: number) => Math.abs(a - b) <= eps;
const right = { x: 1, y: 0 };

describe('걷기 · 구르기', () => {
  test('누른 방향으로 이동 속도만큼 간다 (대각선도 같은 빠르기)', () => {
    const g = play('toby', 'village');
    const p = g.world.player;
    const x = p.x;
    hold(g, { move: right }, 0.5);
    assert.ok(near(p.x - x, g.stats.ms * 0.5, 2), `${p.x - x}`);
    assert.equal(p.face, 'right');
    const { x: x0, y: y0 } = p;
    hold(g, { move: { x: Math.SQRT1_2, y: Math.SQRT1_2 } }, 0.3);
    assert.ok(near(Math.hypot(p.x - x0, p.y - y0), g.stats.ms * 0.3, 2));
  });

  test('막힌 타일(벽·나무·물)은 지나가지 못한다', () => {
    const g = play('toby', 'village');
    hold(g, { move: { x: 0, y: 1 } }, 15);
    const p = g.world.player;
    const ty = Math.floor((p.y + p.r) / TILE);
    // 발밑 아래 칸은 막힌 칸
    assert.ok(buildMap('village').tiles[ty + 1]?.[Math.floor(p.x / TILE)] !== undefined);
    assert.ok(p.y < g.world.map.h * TILE);
  });

  test('구르면 정해진 거리를 가고 그동안 맞지 않으며, 다시 구르려면 기다려야 한다', () => {
    const g = play('toby', 'village');
    const p = g.world.player;
    const x = p.x;
    hold(g, { move: right, roll: true }, ROLL.time + 0.02);
    assert.ok(near(p.x - x, ROLL.dist + g.stats.ms * 0.02, 3), `${p.x - x}`);
    const x2 = p.x;
    hold(g, { roll: true }, 0.1);
    assert.ok(p.x - x2 < 10, '대기 중');
  });

  test('구르는 중에는 몬스터에게 맞지 않는다', () => {
    const g = play('toby');
    const m = placeAt(g, 'fluff', 14, 0);
    m.atk = 50;
    const hp = g.save.hp;
    hold(g, { move: right, roll: true }, 0.15);
    assert.equal(g.save.hp, hp);
  });
});

describe('기본 공격', () => {
  test('토비: 바라보는 쪽 닿는 거리 안의 적만 맞고, 피해 = 공격력 × 배율', () => {
    const g = play('toby');
    const front = freeze(placeAt(g, 'fluff', 24, 0));
    const back = freeze(placeAt(g, 'fluff', -60, 0));
    front.hp = front.maxHp = 9999;
    hold(g, { attack: true }, 0.2);
    assert.equal(9999 - front.hp, Math.round(g.stats.atk * CLASSES.toby.combo[0].mult));
    assert.equal(back.hp, back.maxHp);
  });

  test('자동 조준: 옆에 있는 적 쪽으로 돌아서 친다', () => {
    const g = play('toby');
    const m = freeze(placeAt(g, 'fluff', 0, 26));
    m.hp = m.maxHp = 9999;
    hold(g, { attack: true }, 0.2);
    assert.equal(g.world.player.face, 'down');
    assert.ok(m.hp < 9999);
  });

  test('이어 치면 세 번째가 가장 세다. 쉬면 처음부터', () => {
    const g = play('toby');
    const m = freeze(placeAt(g, 'fluff', 24, 0));
    m.hp = m.maxHp = 1e6;
    const dealt: number[] = [];
    for (let i = 0; i < 3; i++) {
      const hp = m.hp;
      hold(g, { attack: true }, 1 / 60);
      while (g.world.player.state === 'attack') step(g, 1 / 60, NO_INPUT);
      dealt.push(hp - m.hp);
    }
    const atk = g.stats.atk;
    assert.deepEqual(dealt, CLASSES.toby.combo.map((c) => Math.round(atk * c.mult)));
    idle(g, 1);
    assert.equal(g.world.player.combo, 0);
  });

  test('공격 속도가 빠를수록 같은 시간에 더 많이 친다', () => {
    const swings = (aspd: number) => {
      const g = play('toby');
      const m = freeze(placeAt(g, 'fluff', 24, 0));
      m.hp = m.maxHp = 1e9;
      g.stats.aspd = aspd;
      let n = 0;
      for (let i = 0; i < 180; i++) {
        step(g, 1 / 60, { ...NO_INPUT, attack: true });
        n += g.world.events.filter((e) => e.kind === 'swing').length;
        g.world.events = [];
      }
      return n;
    };
    assert.ok(swings(2) > swings(1));
  });

  test('방어력이 높은 적은 덜 아프다', () => {
    assert.ok(armorMul(20) < armorMul(0));
    assert.equal(armorMul(0), 1);
  });

  test('루루: 화살이 날아가 멀리 있는 적을 맞힌다', () => {
    const g = play('ruru');
    const m = freeze(placeAt(g, 'fluff', 140, 0));
    m.hp = m.maxHp = 9999;
    hold(g, { attack: true }, 1 / 60);
    hold(g, {}, 0.12);
    assert.equal(m.hp, 9999, '아직 날아가는 중');
    idle(g, 0.6);
    assert.equal(9999 - m.hp, Math.round(g.stats.atk * CLASSES.ruru.combo[0].mult));
  });

  test('나비: 구슬이 터지면 근처 적도 맞는다', () => {
    const g = play('nabi');
    const a = freeze(placeAt(g, 'fluff', 110, 0));
    const b = freeze(placeAt(g, 'fluff', 110, 18));
    const far = freeze(placeAt(g, 'fluff', 110, 70));
    for (const m of [a, b, far]) m.hp = m.maxHp = 9999;
    hold(g, { attack: true }, 1 / 60);
    idle(g, 1);
    assert.ok(a.hp < 9999 && b.hp < 9999);
    assert.equal(far.hp, 9999);
  });
});

describe('스킬', () => {
  test('SP 를 쓰고 재사용 대기가 생긴다. SP 가 모자라거나 배우지 않았으면 못 쓴다', () => {
    const g = play('toby');
    const sp = g.save.sp;
    hold(g, { skill: 'A' }, 1 / 60);
    assert.equal(g.save.sp <= sp - SKILLS.t_rush.sp + 1, true);
    assert.ok(g.world.player.skillCd.t_rush > 0);
    const g2 = play('toby');
    g2.save.sp = 0;
    hold(g2, { skill: 'A' }, 1 / 60);
    assert.ok(g2.world.events.some((e) => e.kind === 'noSp'));
    assert.equal(g2.world.player.skillCd.t_rush ?? 0, 0);
    const g3 = play('toby');
    hold(g3, { skill: 'S' }, 1 / 60);
    assert.equal(g3.world.player.skillCd.t_spin ?? 0, 0, '배우지 않은 스킬');
  });

  test('회전 베기: 사방의 적이 모두 맞는다 (스킬 피해는 지혜 보너스 포함)', () => {
    const g = play('toby');
    g.save.skills.t_spin = 1;
    const ms = [placeAt(g, 'fluff', 30, 0), placeAt(g, 'fluff', -30, 0), placeAt(g, 'fluff', 0, 30), placeAt(g, 'fluff', 0, -30)].map(freeze);
    for (const m of ms) m.hp = m.maxHp = 9999;
    hold(g, { skill: 'S' }, 1 / 60);
    const expect = Math.round(g.stats.atk * SKILLS.t_spin.mult(1) * (1 + g.stats.skillPct / 100));
    for (const m of ms) assert.equal(9999 - m.hp, expect);
  });

  test('보리 땅 내려찍기: 앞쪽에 떨어져 기절', () => {
    const g = play('bori');
    const m = freeze(placeAt(g, 'fluff', 40, 0));
    m.status.stun = 0;
    m.speed = 0;
    m.hp = m.maxHp = 9999;
    g.world.player.dir = right;
    hold(g, { skill: 'A' }, 0.4);
    assert.ok(m.hp < 9999);
    assert.ok(m.status.stun > 0);
  });

  test('나비 번개 사슬: 적 사이를 여러 번 튄다', () => {
    const g = play('nabi');
    g.save.lv = 6;
    g.save.skills.n_chain = 1;
    const ms = [placeAt(g, 'fluff', 60, 0), placeAt(g, 'fluff', 120, 0), placeAt(g, 'fluff', 180, 0)].map(freeze);
    for (const m of ms) m.hp = m.maxHp = 9999;
    hold(g, { skill: 'D' }, 1 / 60);
    for (const m of ms) assert.ok(m.hp < 9999);
    assert.equal(g.world.events.filter((e) => e.kind === 'chain').length, 3);
  });

  test('보리 곰의 분노: 공격력이 오른다', () => {
    const g = play('bori');
    g.save.skills.b_rage = 1;
    g.save.sp = 999;
    const atk = g.stats.atk;
    hold(g, { skill: 'F' }, 1 / 60);
    assert.ok(g.stats.atk > atk);
    idle(g, 10.2);
    assert.ok(near(g.stats.atk, atk, 1e-6), '끝나면 원래대로');
  });
});

describe('포션', () => {
  test('HP 포션: 최대 HP 의 40% 회복, 하나 줄고, 잠깐 다시 못 마신다', () => {
    const g = play('toby');
    g.save.hp = 10;
    const n = g.save.potions.hp;
    hold(g, { potion: 'hp' }, 1 / 60);
    assert.ok(near(g.save.hp, 10 + g.stats.maxHp * POTION.heal, 1));
    assert.equal(g.save.potions.hp, n - 1);
    hold(g, { potion: 'hp' }, 1 / 60);
    assert.equal(g.save.potions.hp, n - 1);
  });

  test('HP 가 가득하면 마시지 않는다', () => {
    const g = play('toby');
    const n = g.save.potions.hp;
    hold(g, { potion: 'hp' }, 1 / 60);
    assert.equal(g.save.potions.hp, n);
  });
});

describe('몬스터', () => {
  test('근접 몬스터는 다가와 기를 모았다가 때린다', () => {
    const g = play('toby');
    const m = placeAt(g, 'mushroom', 60, 0, 2);
    const hp = g.save.hp;
    idle(g, 0.4);
    assert.equal(g.save.hp, hp, '아직');
    idle(g, 2);
    assert.ok(g.save.hp < hp);
    assert.ok(m.hp > 0);
  });

  test('원거리 몬스터는 탄을 쏜다', () => {
    const g = play('toby', 'candy');
    clearField(g);
    placeAt(g, 'gum', 130, 0, 9);
    idle(g, 3);
    assert.ok(g.world.events.some((e) => e.kind === 'monsterShot'));
  });

  test('멀리 있는 몬스터는 알아채지 못하고, 집에서 너무 멀어지면 돌아간다', () => {
    const g = play('toby');
    const m = placeAt(g, 'fluff', 400, 0);
    idle(g, 1);
    assert.equal(m.ai.state, 'idle');
    m.x += 500;
    m.ai.state = 'chase';
    idle(g, 0.1);
    assert.equal(m.ai.state, 'return');
  });

  test('쓰러뜨리면 경험치와 골드(떨어진 것을 주우면)를 얻는다', () => {
    const g = play('toby');
    const m = freeze(placeAt(g, 'fluff', 24, 0));
    m.hp = 1;
    const gold = g.save.gold;
    hold(g, { attack: true }, 0.2);
    assert.ok(g.world.events.some((e) => e.kind === 'kill'));
    assert.equal(g.save.exp, MONSTERS.fluff.exp);
    idle(g, 1.5);
    assert.ok(g.save.gold > gold, '골드가 끌려와 주워진다');
  });

  test('경험치가 차면 레벨이 오르고 HP·SP 가 가득 찬다', () => {
    const g = play('toby');
    g.save.exp = expToNext(1) - 1;
    g.save.hp = 5;
    const m = freeze(placeAt(g, 'fluff', 24, 0));
    m.hp = 1;
    hold(g, { attack: true }, 0.2);
    assert.equal(g.save.lv, 2);
    assert.equal(g.save.hp, g.stats.maxHp);
    assert.ok(g.world.events.some((e) => e.kind === 'levelUp'));
  });

  test('젤리는 쓰러지면 꼬마 젤리 둘로 나뉜다', () => {
    const g = play('toby', 'candy');
    clearField(g);
    const m = freeze(placeAt(g, 'jelly', 24, 0, 6));
    m.hp = 1;
    hold(g, { attack: true }, 0.2);
    assert.equal(g.world.monsters.filter((x) => x.def.id === 'jellet').length, 2);
  });

  test('사냥터는 처음에 채워지고, 쓰러뜨리면 시간이 지나 다시 나온다', () => {
    const save = newSave('toby', '시험');
    const g = newGame(save, 3);
    changeMap(g, 'forest');
    step(g, 1 / 60, NO_INPUT);
    const total = g.world.map.spawns.reduce((s, z) => s + z.max, 0);
    assert.ok(g.world.monsters.length >= total - 3, `${g.world.monsters.length}/${total}`);
    const before = g.world.monsters.length;
    g.world.monsters.splice(0, 5);
    for (let i = 0; i < 60 * 30; i++) step(g, 1 / 60, NO_INPUT);
    assert.ok(g.world.monsters.length >= before - 2);
  });
});

describe('죽음과 부활', () => {
  test('HP 가 다하면 쓰러지고, 잠시 뒤 마을에서 골드 10% 를 잃고 다시 일어난다', () => {
    const g = play('toby');
    g.save.gold = 1000;
    g.save.hp = 3;
    const m = placeAt(g, 'mushroom', 20, 0, 2);
    m.atk = 999;
    idle(g, 1.5);
    assert.equal(g.world.player.state, 'dead');
    idle(g, 3);
    assert.equal(g.world.map.id, 'village');
    assert.equal(g.save.gold, 1000 - 1000 * DEATH_GOLD);
    assert.equal(g.save.hp, g.stats.maxHp);
  });
});

describe('지도 이동', () => {
  test('출구를 밟으면 다른 지도로 간다', () => {
    const g = play('toby', 'village');
    const wp = g.world.map.warps.find((w) => w.to === 'forest')!;
    g.world.player.x = tileCenter(wp.x - 1);
    g.world.player.y = tileCenter(wp.y + 1);
    hold(g, { move: right }, 0.6);
    assert.equal(g.world.map.id, 'forest');
    assert.ok(g.world.events.some((e) => e.kind === 'enter' && e.map === 'forest'));
  });

  test('막힌 출구는 말만 하고 지나가지 못한다 (깃발이 있으면 지나간다)', () => {
    const g = play('toby', 'village');
    const wp = g.world.map.warps.find((w) => w.to === 'candy')!;
    g.world.player.x = tileCenter(wp.x + 1);
    g.world.player.y = tileCenter(wp.y + 2);
    hold(g, { move: { x: 0, y: -1 } }, 1);
    assert.equal(g.world.map.id, 'village');
    assert.ok(g.world.events.some((e) => e.kind === 'locked'));
    g.save.flags.candy_open = true;
    hold(g, { move: { x: 0, y: -1 } }, 1);
    assert.equal(g.world.map.id, 'candy');
  });

  test('NPC 옆에서 공격 키를 누르면 말을 걸고 공격하지 않는다', () => {
    const g = play('toby', 'village');
    const chief = g.world.map.npcs.find((n) => n.id === 'chief')!;
    g.world.player.x = tileCenter(chief.x);
    g.world.player.y = tileCenter(chief.y) + 20;
    assert.deepEqual(interactTarget(g), { kind: 'npc', id: 'chief' });
    hold(g, { attack: true, attackPressed: true }, 1 / 60);
    assert.ok(g.world.events.some((e) => e.kind === 'talk' && e.npc === 'chief'));
    assert.ok(!g.world.events.some((e) => e.kind === 'swing'));
  });
});

describe('보스', () => {
  test('태엽 동굴 끝에 가까이 가면 태엽 곰 대장이 나타나고, 쓰러뜨리면 깃발', () => {
    const g = play('toby', 'cave');
    const b = g.world.map.boss!;
    g.world.player.x = tileCenter(b.x);
    g.world.player.y = tileCenter(b.y + 4);
    idle(g, 0.1);
    const boss = g.world.monsters.find((m) => m.def.id === 'b_bear');
    assert.ok(boss);
    assert.ok(g.world.events.some((e) => e.kind === 'bossIntro'));
    boss.hp = 0;
    idle(g, 0.1);
    assert.equal(g.save.flags.b_bear_dead, true);
    assert.equal(g.world.drops.filter((d) => d.kind === 'item').length >= 2, true);
  });

  test('보스는 체력이 반 아래로 내려가면 2단계 (기술이 빨라진다) 그리고 기술을 쓴다', () => {
    const g = play('toby', 'cave');
    const b = g.world.map.boss!;
    g.world.player.x = tileCenter(b.x);
    g.world.player.y = tileCenter(b.y + 4);
    g.save.hp = 1e9;
    g.stats.maxHp = 1e9;
    idle(g, 0.1);
    const boss = g.world.monsters.find((m) => m.def.id === 'b_bear')!;
    idle(g, 6);
    assert.ok(g.world.events.some((e) => e.kind === 'bossMove'));
    boss.hp = boss.maxHp * 0.4;
    idle(g, 0.1);
    assert.equal(boss.boss!.phase, 2);
  });
});

describe('다락방 균열', () => {
  test('열리기 전에는 못 들어가고, 열리면 들어간다 (깊이는 가장 깊이 간 곳 +1 까지)', () => {
    const g = play('toby', 'village');
    assert.equal(enterRift(g), false);
    g.save.flags.rift_open = true;
    g.save.riftDepth = 9;
    g.save.riftBest = 2;
    assert.equal(enterRift(g, 9), true);
    assert.equal(g.world.rift?.depth, 3);
  });

  test('몬스터를 쓰러뜨리면 게이지가 차고, 다 차면 수호자. 수호자를 쓰러뜨리면 귀환문과 다음 깊이', () => {
    const g = play('toby', 'village');
    g.save.flags.rift_open = true;
    enterRift(g, 1);
    clearField(g);
    g.rng = fixedRng();
    g.world.rift!.gauge = 95;
    const m = freeze(placeAt(g, 'dustling', 24, 0, 11));
    m.hp = 1;
    hold(g, { attack: true }, 0.2);
    assert.equal(g.world.rift!.gauge, 100);
    idle(g, 0.05);
    const guard = g.world.monsters.find((x) => x.guardian);
    assert.ok(guard);
    assert.ok(g.world.events.some((e) => e.kind === 'riftGuardian'));
    guard.hp = 0;
    idle(g, 0.05);
    assert.ok(g.world.rift!.portal);
    assert.equal(g.save.riftBest, 1);
    assert.equal(g.save.riftDepth, 2);
  });
});
