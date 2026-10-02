import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { LEGENDARY_WEAPONS, WEAPONS } from '../../../core/data.ts';
import { ALL_SKILLS } from '../../../core/skills.ts';
import { WEAPON_FX, type ImpactKind } from '../../weaponfx.ts';
import { IMPACT_SOUNDS, SKILL_SOUNDS, UI_SOUNDS, impactSound, shotSound, skillSound, ultSound, type SoundSpec } from '../sfx.ts';

const key = (s: SoundSpec) => JSON.stringify(s);

function valid(s: SoundSpec, name: string): void {
  assert.ok(s.length > 0, `${name}: 빈 소리`);
  for (const l of s) {
    assert.ok(l.dur > 0 && l.dur <= 2, `${name}: 길이 ${l.dur}`);
    assert.ok(l.gain > 0 && l.gain <= 0.3, `${name}: 크기 ${l.gain}`);
    if (l.kind === 'noise') assert.ok(l.filter, `${name}: 잡음은 거르개(filter)로 색을 입힌다`);
  }
}

describe('효과음 설계', () => {
  test('모든 무기(전설 포함)가 쏘는 소리를 가지고, 계열이 같아도 무기마다 소리가 다를 수 있다', () => {
    const all = [...WEAPONS, ...LEGENDARY_WEAPONS];
    for (const w of all) valid(shotSound(w.id), w.id);
    // 같은 일반 계열이라도 돌팔매와 전투 도끼는 소리가 다르다
    assert.notEqual(key(shotSound('sling')), key(shotSound('battle_axe')));
    assert.notEqual(key(shotSound('longbow')), key(shotSound('ballista')));
  });

  test('연출의 착탄 종류마다 맞는 소리가 있고, 서로 다르다', () => {
    const kinds = [...new Set(Object.values(WEAPON_FX).map((f) => f.impact))] as ImpactKind[];
    for (const k of kinds) valid(impactSound(k), k);
    assert.equal(new Set(kinds.map((k) => key(IMPACT_SOUNDS[k]))).size, kinds.length);
  });

  test('모든 스킬이 소리를 가진다 (바리케이드 포함, 합체 스킬은 재료 소리를 겹친다)', () => {
    for (const k of ALL_SKILLS) valid(skillSound(k.id), k.id);
    assert.ok(SKILL_SOUNDS.barricade);
    assert.equal(skillSound('comet').length, SKILL_SOUNDS.meteor.length + SKILL_SOUNDS.blizzard.length);
  });

  test('폭발·바람 같은 소리는 잡음을 섞어 질감을 낸다 (삑 소리만이 아니다)', () => {
    for (const k of ['explosion', 'dustBlast', 'wind'] as ImpactKind[]) {
      assert.ok(impactSound(k).some((l) => l.kind === 'noise'), k);
    }
  });
});

describe('새 화면들의 소리', () => {
  const NEW = ['start', 'storyOpen', 'page', 'speech', 'warn', 'reset', 'giveUp', 'splashFall', 'splashImpact', 'splashLight'] as const;

  test('타이틀 연출 · 시작 · 이야기 카드 · 말풍선 · 경고 · 초기화 · 포기 소리가 있고 모두 쓸 만한 크기·길이', () => {
    for (const k of NEW) valid(UI_SOUNDS[k], k);
  });

  test('서로 다른 소리다 (초기화가 판매 소리, 경고가 거절 소리와 같지 않다)', () => {
    const all = NEW.map((k) => key(UI_SOUNDS[k]));
    assert.equal(new Set(all).size, NEW.length);
    assert.notEqual(key(UI_SOUNDS.reset), key(UI_SOUNDS.sell));
    assert.notEqual(key(UI_SOUNDS.warn), key(UI_SOUNDS.denied));
  });

  test('별이 떨어지는 소리와 떨어지는 쿵은 잡음으로 질감을 낸다', () => {
    assert.ok(UI_SOUNDS.splashFall.some((l) => l.kind === 'noise'));
    assert.ok(UI_SOUNDS.splashImpact.some((l) => l.kind === 'noise'));
  });
});

describe('손맛·갈림길 소리', () => {
  const NEW = ['tap', 'combo', 'incident', 'officer', 'route', 'pick', 'forge', 'gambleWin', 'gambleLose', 'encounter', 'ultReady'] as const;

  test('직접 때리기 · 콤보 · 사건 · 부관 · 갈림길 · 모루 · 도박 · 사건 · 궁극기 준비 소리가 있고 쓸 만하다', () => {
    for (const k of NEW) valid(UI_SOUNDS[k], k);
    assert.equal(new Set(NEW.map((k) => key(UI_SOUNDS[k]))).size, NEW.length, '서로 다르다');
  });

  test('궁극기는 여섯 가지가 모두 소리를 가지고 서로 다르며, 묵직하게 잡음을 섞는다', () => {
    const ids = ['gate', 'volley', 'starfall', 'barrage', 'dice', 'lantern'];
    for (const id of ids) valid(ultSound(id), id);
    assert.equal(new Set(ids.map((id) => key(ultSound(id)))).size, ids.length);
    for (const id of ids) assert.ok(ultSound(id).some((l) => l.kind === 'noise') || ultSound(id).length >= 3, id);
  });

  test('도박은 이기면 높게, 지면 낮게 끝난다', () => {
    const lastFreq = (s: SoundSpec) => {
      const tones = s.filter((l) => l.kind === 'tone');
      const l = tones[tones.length - 1];
      return l.kind === 'tone' ? (l.to ?? l.freq) : 0;
    };
    assert.ok(lastFreq(UI_SOUNDS.gambleWin) > lastFreq(UI_SOUNDS.gambleLose));
  });
});
