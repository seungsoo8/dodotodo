import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { CLASSES } from '../classes.ts';
import { gainExp, GROWTH, newSave } from '../character.ts';
import { expToNext } from '../classes.ts';
import { joinParty, nextHero, stashHero, loadHero, heroState, withHero } from '../party.ts';

describe('탐험대 저장', () => {
  test('새 탐험대는 토비 혼자, 사탕 · 단추 · 빈 부품 칸으로 시작한다', () => {
    const s = newSave(0);
    assert.equal(s.hero, 'toby');
    assert.deepEqual(s.party, ['toby']);
    assert.equal(s.weaponLv, 1);
    assert.ok(s.potions.hp > 0);
    assert.deepEqual(s.slots, []);
    assert.deepEqual(s.rescued, []);
    assert.equal(s.version, 2);
  });

  test('동료가 합류하면 탐험대 레벨에 맞춰 자란 상태로 들어온다', () => {
    const s = newSave(0);
    while (s.lv < 5) gainExp(s, expToNext(s.lv) - s.exp);
    assert.equal(joinParty(s, 'bori'), true);
    assert.deepEqual(s.party, ['toby', 'bori']);
    const b = heroState(s, 'bori');
    assert.equal(b.attrs.str, CLASSES.bori.base.str + GROWTH.bori.str * 4);
    assert.equal(b.skillPts, 4);
    assert.equal(b.weaponLv, 1);
    assert.equal(joinParty(s, 'bori'), false, '이미 있다');
  });

  test('레벨이 오르면 쉬는 동료도 함께 자란다', () => {
    const s = newSave(0);
    joinParty(s, 'nabi');
    const before = heroState(s, 'nabi').attrs.int;
    gainExp(s, expToNext(1));
    assert.equal(heroState(s, 'nabi').attrs.int, before + GROWTH.nabi.int);
    assert.equal(heroState(s, 'nabi').skillPts, 1);
  });

  test('바꿔 들기: 지금 동료를 쉬게 하고 다른 동료의 상태를 위로 올린다', () => {
    const s = newSave(0);
    joinParty(s, 'ruru');
    s.hp = 33;
    s.weaponLv = 4;
    stashHero(s);
    loadHero(s, 'ruru');
    assert.equal(s.hero, 'ruru');
    assert.equal(s.weaponLv, 1);
    assert.equal(heroState(s, 'toby').hp, 33);
    assert.equal(heroState(s, 'toby').weaponLv, 4);
    assert.ok(s.skills.r_fan >= 1);
  });

  test('다음 동료: 쓰러진 동료는 건너뛰고, 혼자면 없다', () => {
    const s = newSave(0);
    assert.equal(nextHero(s), null);
    joinParty(s, 'bori');
    joinParty(s, 'ruru');
    assert.equal(nextHero(s), 'bori');
    s.bench.bori!.down = 10;
    assert.equal(nextHero(s), 'ruru');
  });
});

describe('쉬는 동료 다루기 (메뉴에서 스킬 배우기 · 무기 손질)', () => {
  test('withHero: 쉬는 동료를 잠깐 앞에 세워 바꾸고, 원래 동료로 돌아온다 (쓰러진 시간도 그대로)', () => {
    const s = newSave(0, 'toby');
    s.lv = 5;
    joinParty(s, 'bori');
    s.bench.bori!.down = 12;
    const tobyHp = s.hp;
    const pts = s.bench.bori!.skillPts;
    const r = withHero(s, 'bori', () => {
      assert.equal(s.hero, 'bori');
      s.skillPts -= 1;
      s.weaponLv = 3;
      return 'ok';
    });
    assert.equal(r, 'ok');
    assert.equal(s.hero, 'toby');
    assert.equal(s.hp, tobyHp);
    assert.equal(s.bench.bori!.skillPts, pts - 1);
    assert.equal(s.bench.bori!.weaponLv, 3);
    assert.equal(s.bench.bori!.down, 12);
    assert.equal(s.bench.toby, undefined, '앞에 선 동료는 쉬는 자리에 없다');
  });

  test('withHero: 지금 싸우는 동료면 그대로 실행, 탐험대에 없는 동료면 실행하지 않는다', () => {
    const s = newSave(0, 'toby');
    assert.equal(withHero(s, 'toby', () => s.hero), 'toby');
    assert.equal(withHero(s, 'nabi', () => 'x'), undefined);
  });
});
