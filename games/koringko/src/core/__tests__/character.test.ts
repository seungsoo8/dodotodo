import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { CLASSES, HERO_ORDER, LV_MAX, PER_LEVEL, SKILLS, classSkills, expToNext, skillForKey } from '../classes.ts';
import { allocate, canLearn, gainExp, learn, newSave } from '../character.ts';
import { computeStats, power, takenMul } from '../stats.ts';
import type { Item } from '../types.ts';

const near = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps;

function item(over: Partial<Item>): Item {
  return { uid: 'x', slot: 'ring', name: '시험', rarity: 'normal', ilvl: 1, req: 1, affixes: [], plus: 0, ...over };
}

describe('네 인형', () => {
  test('직업마다 무기가 다르고 스킬은 A S D F 와 패시브 하나씩', () => {
    assert.equal(new Set(HERO_ORDER.map((h) => CLASSES[h].weapon)).size, 4);
    for (const h of HERO_ORDER) {
      assert.deepEqual(classSkills(h).map((s) => s.key), ['A', 'S', 'D', 'F', 'P']);
      for (const s of classSkills(h)) assert.equal(s.hero, h);
    }
  });

  test('스킬은 레벨이 오를수록 세지고, 궁극기(F)는 늦게 배운다', () => {
    for (const s of Object.values(SKILLS)) {
      if (s.key === 'P') continue;
      assert.ok(s.mult(s.maxLv) > s.mult(1), s.id);
      assert.ok(s.desc(1).length > 0);
    }
    for (const h of HERO_ORDER) assert.ok(skillForKey(h, 'F')!.req > skillForKey(h, 'D')!.req);
  });
});

describe('새 캐릭터', () => {
  test('1레벨 · 직업 기본 능력치 · 첫 스킬(A)만 배운 상태 · 포션 조금', () => {
    const s = newSave('ruru', '루루', 2);
    assert.equal(s.lv, 1);
    assert.equal(s.slot, 2);
    assert.deepEqual(s.attrs, CLASSES.ruru.base);
    assert.equal(s.skills.r_fan, 1);
    assert.equal(s.skills.r_rain, 0);
    assert.ok(s.potions.hp > 0);
    assert.equal(s.map, 'village');
  });
});

describe('경험치와 레벨', () => {
  test('필요 경험치는 레벨이 오를수록 늘고, 끝 레벨에서는 무한', () => {
    for (let lv = 1; lv < LV_MAX - 1; lv++) assert.ok(expToNext(lv + 1) > expToNext(lv));
    assert.equal(expToNext(LV_MAX), Infinity);
  });

  test('채우면 레벨이 오르고 포인트를 받으며 주 능력치가 1 오른다. 남은 경험치는 이어진다', () => {
    const s = newSave('toby', '토비');
    const need = expToNext(1);
    assert.equal(gainExp(s, need - 1), 0);
    assert.equal(gainExp(s, 5), 1);
    assert.equal(s.lv, 2);
    assert.equal(s.exp, 4);
    assert.equal(s.statPts, PER_LEVEL.statPts);
    assert.equal(s.skillPts, PER_LEVEL.skillPts);
    assert.equal(s.attrs.str, CLASSES.toby.base.str + 1);
  });

  test('한 번에 여러 레벨도 오르고, 끝 레벨을 넘지 않는다', () => {
    const s = newSave('nabi', '나비');
    assert.equal(gainExp(s, expToNext(1) + expToNext(2) + expToNext(3)), 3);
    assert.equal(s.lv, 4);
    gainExp(s, 1e12);
    assert.equal(s.lv, LV_MAX);
    assert.equal(gainExp(s, 100), 0);
  });
});

describe('포인트 쓰기', () => {
  test('능력치 포인트가 있어야 올릴 수 있다', () => {
    const s = newSave('toby', '토비');
    assert.equal(allocate(s, 'vit'), false);
    s.statPts = 2;
    assert.equal(allocate(s, 'vit'), true);
    assert.equal(s.attrs.vit, CLASSES.toby.base.vit + 1);
    assert.equal(s.statPts, 1);
  });

  test('스킬은 포인트 · 요구 레벨 · 최대 레벨을 지킨다', () => {
    const s = newSave('toby', '토비');
    assert.deepEqual(canLearn(s, 't_spin'), { ok: false, reason: 'level' });
    s.lv = 3;
    assert.deepEqual(canLearn(s, 't_spin'), { ok: false, reason: 'points' });
    s.skillPts = 20;
    assert.equal(learn(s, 't_spin'), true);
    assert.equal(s.skills.t_spin, 1);
    assert.deepEqual(canLearn(s, 'b_slam'), { ok: false, reason: 'unknown' }, '남의 스킬');
    s.skills.t_spin = SKILLS.t_spin.maxLv;
    assert.deepEqual(canLearn(s, 't_spin'), { ok: false, reason: 'max' });
  });
});

describe('능력 계산', () => {
  test('주 능력치를 올리면 공격력이, 체력을 올리면 HP 와 방어력이 오른다', () => {
    const s = newSave('toby', '토비');
    const a = computeStats(s);
    s.attrs.str += 10;
    assert.ok(computeStats(s).atk > a.atk);
    s.attrs.vit += 10;
    const b = computeStats(s);
    assert.equal(b.maxHp, a.maxHp + 60);
    assert.ok(b.def > a.def);
  });

  test('민첩은 치명타, 지혜는 SP · 스킬 피해 (치명타는 70% 를 넘지 않는다)', () => {
    const s = newSave('nabi', '나비');
    const a = computeStats(s);
    s.attrs.dex += 10;
    s.attrs.int += 10;
    const b = computeStats(s);
    assert.ok(near(b.crit - a.crit, 0.02));
    assert.equal(b.maxSp - a.maxSp, 20);
    assert.ok(b.skillPct > a.skillPct);
    s.attrs.dex = 10000;
    assert.equal(computeStats(s).crit, 0.7);
  });

  test('무기 피해가 공격력의 바탕이고, 강화할수록(+8%/단계) 세진다', () => {
    const s = newSave('toby', '토비');
    const bare = computeStats(s).atk;
    s.gear.weapon = item({ slot: 'weapon', dmg: [10, 14], spd: 1 });
    const w = computeStats(s).atk;
    assert.ok(w > bare);
    s.gear.weapon.plus = 5;
    const w5 = computeStats(s).atk;
    // (12×1.4 + 4) / (12 + 4)
    assert.ok(near(w5 / w, (12 * 1.4 + 4) / 16, 1e-9));
  });

  test('장비 추가 능력이 더해진다 (힘 · 체력 · 치명 · 이동 속도)', () => {
    const s = newSave('toby', '토비');
    const a = computeStats(s);
    s.gear.ring = item({ affixes: [{ id: 'hp', v: 50 }, { id: 'crit', v: 5 }, { id: 'ms', v: 10 }, { id: 'str', v: 4 }] });
    const b = computeStats(s);
    assert.equal(b.maxHp, a.maxHp + 50);
    assert.ok(near(b.crit - a.crit, 0.05));
    assert.ok(near(b.ms, a.ms * 1.1));
    assert.equal(b.attrs.str, a.attrs.str + 4);
  });

  test('패시브 스킬도 능력에 들어간다 (보리 두꺼운 털: HP · 방어)', () => {
    const s = newSave('bori', '보리');
    const a = computeStats(s);
    s.skills.b_pass = 5;
    const b = computeStats(s);
    assert.ok(b.maxHp > a.maxHp && b.def > a.def);
  });

  test('방어력이 높을수록 덜 아프고, 같은 방어력이면 고레벨일수록 효과가 준다', () => {
    assert.equal(takenMul(1, 0), 1);
    assert.ok(takenMul(10, 50) < takenMul(10, 10));
    assert.ok(takenMul(30, 50) > takenMul(10, 50));
  });

  test('전투력은 강해질수록 오른다', () => {
    const s = newSave('toby', '토비');
    const a = power(computeStats(s));
    s.gear.weapon = item({ slot: 'weapon', dmg: [20, 30], spd: 1 });
    assert.ok(power(computeStats(s)) > a);
  });
});

test('새 캐릭터: 직업에 맞는 1레벨 일반 무기를 들고 시작한다', () => {
  for (const h of HERO_ORDER) {
    const s = newSave(h, '시험');
    const w = s.gear.weapon;
    assert.ok(w, h);
    assert.equal(w.slot, 'weapon');
    assert.equal(w.rarity, 'normal');
    assert.equal(w.hero, h);
    assert.equal(w.req, 1);
    assert.ok(w.dmg && w.dmg[0] >= 1 && w.dmg[1] > w.dmg[0]);
    assert.equal(w.affixes.length, 0);
  }
});
