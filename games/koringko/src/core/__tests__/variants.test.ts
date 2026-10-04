import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { classSkills, HERO_ORDER, SKILLS } from '../classes.ts';
import { castSkill } from '../player.ts';
import { setVariant, VARIANTS, variantOf } from '../variants.ts';
import { newSave } from '../character.ts';
import { freeze, idle, placeAt, play } from './helpers.ts';
import type { Game } from '../game.ts';

function ready(g: Game, id: string, v: number): void {
  g.save.skills[id] = 1;
  g.save.lv = 30;
  g.save.variants[id] = v;
  g.save.sp = 999;
  g.stats.maxSp = 999;
}

describe('스킬 변형 자료', () => {
  test('공격 스킬마다 이름이 다른 변형이 셋 (첫째는 기본)', () => {
    for (const h of HERO_ORDER)
      for (const s of classSkills(h)) {
        if (s.key === 'P') continue;
        const vs = VARIANTS[s.id];
        assert.equal(vs?.length, 3, s.id);
        assert.equal(new Set(vs.map((v) => v.name)).size, 3, s.id);
        assert.equal(vs[0].name, '기본');
      }
  });

  test('바꾸기: 배운 스킬만, 있는 변형만, 마을에서만', () => {
    const s = newSave(0, 'toby');
    assert.deepEqual(setVariant(s, 't_spin', 1, true), { ok: false, reason: 'unlearned' });
    assert.deepEqual(setVariant(s, 't_rush', 3, true), { ok: false, reason: 'invalid' });
    assert.deepEqual(setVariant(s, 't_rush', 1, false), { ok: false, reason: 'town' });
    assert.deepEqual(setVariant(s, 't_rush', 2, true), { ok: true });
    assert.equal(variantOf(s, 't_rush'), 2);
    assert.equal(variantOf(s, 't_spin'), 0);
  });
});

describe('스킬 변형 동작', () => {
  test('모든 변형: 적이 있을 때 쓰면 SP 를 쓰고 피해를 준다 (함성만 예외)', () => {
    for (const h of HERO_ORDER)
      for (const s of classSkills(h)) {
        if (s.key === 'P') continue;
        for (let v = 0; v < 3; v++) {
          const g = play(h, 'toybox');
          ready(g, s.id, v);
          for (let i = 0; i < 4; i++) freeze(placeAt(g, 'ragdoll', 40 + i * 12, (i - 1.5) * 14, 5));
          const sp = g.save.sp;
          assert.equal(castSkill(g, s.id), true, `${s.id}#${v}`);
          assert.ok(g.save.sp < sp, `${s.id}#${v} SP`);
          idle(g, 3.5);
          const hits = g.world.events.filter((e) => e.kind === 'hit').length;
          if (!(s.id === 'b_roar' && v === 1)) assert.ok(hits > 0, `${s.id}#${v} 피해`);
        }
      }
  });

  test('되돌아 베기: 돌진한 길을 돌아오며 한 번 더 벤다', () => {
    const g = play('toby', 'toybox');
    ready(g, 't_rush', 2);
    const m = freeze(placeAt(g, 'ragdoll', 40, 0, 5));
    m.hp = m.maxHp = 1e6;
    castSkill(g, 't_rush');
    idle(g, 0.8);
    assert.equal(g.world.events.filter((e) => e.kind === 'hit' && e.targetId === m.id).length, 2);
  });

  test('끌어당기기: 기본보다 넓게 치고 적을 가까이 당긴다', () => {
    const g = play('toby', 'toybox');
    ready(g, 't_spin', 2);
    const m = placeAt(g, 'ragdoll', 72, 0, 5);
    m.hp = m.maxHp = 1e6;
    castSkill(g, 't_spin');
    idle(g, 0.3);
    assert.ok(g.world.events.some((e) => e.kind === 'hit' && e.targetId === m.id));
    assert.ok(m.x - g.world.player.x < 60);
  });

  test('세 도끼: 도끼 셋이 날아간다', () => {
    const g = play('bori', 'toybox');
    ready(g, 'b_axe', 1);
    castSkill(g, 'b_axe');
    assert.equal(g.world.projectiles.filter((p) => p.kind === 'axe').length, 3);
  });

  test('관통 부채: 세 발이지만 여러 적을 꿰뚫는다', () => {
    const g = play('ruru', 'toybox');
    ready(g, 'r_fan', 1);
    castSkill(g, 'r_fan');
    const arrows = g.world.projectiles.filter((p) => p.kind === 'arrow');
    assert.equal(arrows.length, 3);
    assert.ok(arrows.every((a) => a.pierce >= 3));
  });

  test('저격: 여섯 발을 차례로 쏜다', () => {
    const g = play('ruru', 'toybox');
    ready(g, 'r_hunt', 1);
    castSkill(g, 'r_hunt');
    assert.equal(g.world.player.queue.length, 6);
  });

  test('거대 운석: 커다란 운석 하나', () => {
    const g = play('nabi', 'toybox');
    ready(g, 'n_meteor', 1);
    castSkill(g, 'n_meteor');
    const ms = g.world.hazards.filter((h) => h.kind === 'meteor');
    assert.equal(ms.length, 1);
    assert.ok(ms[0].shape.type === 'circle' && ms[0].shape.r >= 90);
  });

  test('긴 사슬: 다섯 번보다 더 많이 튄다', () => {
    const g = play('nabi', 'toybox');
    ready(g, 'n_chain', 1);
    for (let i = 0; i < 9; i++) freeze(placeAt(g, 'ragdoll', 30 + i * 40, 0, 5)).hp = 1e6;
    castSkill(g, 'n_chain');
    assert.ok(g.world.events.filter((e) => e.kind === 'chain').length >= 7);
  });

  test('연속 내려찍기: 세 번 내려찍는다', () => {
    const g = play('bori', 'toybox');
    ready(g, 'b_slam', 1);
    castSkill(g, 'b_slam');
    idle(g, 1.5);
    assert.equal(g.world.events.filter((e) => e.kind === 'explode' && e.tag === 'slam').length, 3);
  });

  test('변형은 기본 스킬 설명과 별개로 짧은 설명을 가진다', () => {
    for (const [id, vs] of Object.entries(VARIANTS)) {
      assert.ok(SKILLS[id], id);
      for (const v of vs.slice(1)) assert.ok(v.desc.length > 5, `${id} ${v.name}`);
    }
  });
});
