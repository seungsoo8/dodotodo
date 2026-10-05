import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Adv, NO_INPUT, SPEED, type AdvData, type AdvInput } from '../adv.ts';
import { Builder, TILE } from '../../maps.ts';
import { stepRate, stepSize, WALK_SPEED } from '../stage.ts';
import type { RoomDef } from '../types.ts';
import type { HeroId } from '../../types.ts';

/** 시험용 빈 방: 20×8, 가장자리 벽 */
function room(id: string, scale: 'toy' | 'human'): RoomDef {
  const b = new Builder(20, 8, 'w', 1);
  b.rect(0, 0, 20, 1, 'Q');
  b.rect(0, 7, 20, 1, 'Q');
  b.rect(0, 0, 1, 8, 'Q');
  b.rect(19, 0, 1, 8, 'Q');
  return { id, name: id, theme: 'toybox', w: 20, h: 8, tiles: b.rows(), structures: [], warps: [], npcs: [], spawns: [], start: { x: 2, y: 3 }, safe: true, dark: false, level: '', scale, things: [] };
}

function data(party: HeroId[], first: 'toy' | 'human' = 'toy'): AdvData {
  return {
    rooms: { toy: () => room('toy', 'toy'), mem: () => room('mem', 'human') },
    chapters: [{ n: 1, title: '1장', sub: '', room: first === 'toy' ? 'toy' : 'mem', start: [2, 3], party, wind: 1, intro: [] }],
  };
}

const DT = 1 / 60;
/** secs 초 동안 돌리며 나온 소리를 모은다 */
function run(a: Adv, secs: number, inp: AdvInput = NO_INPUT): string[] {
  const out: string[] = [];
  for (let i = 0; i < Math.round(secs / DT); i++) {
    a.step(DT, inp);
    out.push(...a.stage.sfx.splice(0));
  }
  return out;
}
const count = (sfx: string[], name: string) => sfx.filter((n) => n === name).length;
const right: AdvInput = { ...NO_INPUT, move: { x: 1, y: 0 } };

describe('발소리: 걸음 크기', () => {
  test('장난감 종류는 toy, 사람은 human, 할머니 인형은 작은 인형이라 toy', () => {
    assert.equal(stepSize('toby'), 'toy');
    assert.equal(stepSize('bori'), 'toy');
    assert.equal(stepSize('grandoll'), 'toy');
    assert.equal(stepSize('king'), 'toy');
    assert.equal(stepSize('haru7'), 'human');
    assert.equal(stepSize('mom'), 'human');
    assert.equal(stepSize('grandma'), 'human');
  });
});

describe('발소리: 조종하는 인물', () => {
  test('토비가 1초 걸으면 걸음 그림 박자(stepRate)만큼 작은 발소리가 난다', () => {
    const a = new Adv(data(['toby']));
    run(a, 0.5);
    const x0 = a.stage.actors.toby.x;
    const sfx = run(a, 1, right);
    const dist = a.stage.actors.toby.x - x0;
    assert.ok(Math.abs(dist - SPEED.toy) < 2, `1초에 ${dist}px`);
    const want = stepRate('toby');
    const got = count(sfx, 'step:toy');
    assert.ok(Math.abs(got - want) <= 1, `발소리 ${got}번 (기대 ${want})`);
    assert.equal(count(sfx, 'step:human'), 0, '장난감은 사람 발소리를 내지 않는다');
  });

  test('걸은 거리에 비례: 3초(약 276px) 걸으면 3 × 박자, 1초의 약 세 배', () => {
    const a = new Adv(data(['toby']));
    run(a, 0.5);
    const one = count(run(a, 1, right), 'step:toy');
    a.place(2 * TILE + TILE / 2, 3 * TILE + TILE / 2);
    run(a, 0.5);
    // 방 폭(18칸 = 432px) 안이라 3초 동안 벽에 닿지 않는다
    const three = count(run(a, 3, right), 'step:toy');
    assert.ok(Math.abs(three - 3 * stepRate('toby')) <= 1, `3초 ${three}`);
    assert.ok(three >= one * 2.5 && three <= one * 3.5, `1초 ${one} · 3초 ${three}`);
  });

  test('서 있으면 발소리가 나지 않는다', () => {
    const a = new Adv(data(['toby', 'bori']));
    run(a, 1, right);
    run(a, 1); // 동료까지 멈출 시간
    const sfx = run(a, 3);
    assert.equal(sfx.filter((n) => n.startsWith('step:')).length, 0, sfx.join(','));
  });

  test('따라오는 동료도 걸으면 발소리를 낸다 (둘이면 혼자일 때보다 많다)', () => {
    const solo = count(run(new Adv(data(['toby'])), 1.5, right), 'step:toy');
    const duo = count(run(new Adv(data(['toby', 'bori'])), 1.5, right), 'step:toy');
    assert.ok(duo > solo + 2, `혼자 ${solo} · 둘 ${duo}`);
  });
});

describe('발소리: 대본으로 걷는 인물', () => {
  test('@walk 로 사람이 5칸 걸으면 걸린 시간 × 박자 만큼, 도착하면 멈춘다', () => {
    const a = new Adv(data(['toby'], 'human'));
    run(a, 0.2);
    a.run([
      { t: 'show', who: 'mom', kind: 'mom', at: [2, 5] },
      { t: 'walk', who: 'mom', to: [7, 5] },
    ]);
    const sfx = run(a, 3);
    const secs = (5 * TILE) / WALK_SPEED;
    const want = secs * stepRate('mom');
    const got = count(sfx, 'step:human');
    assert.equal(a.stage.actors.mom.x, 7 * TILE + TILE / 2, '도착');
    assert.ok(Math.abs(got - want) <= 1.5, `발소리 ${got}번 (기대 ${want.toFixed(1)})`);
    assert.equal(count(run(a, 2), 'step:human'), 0, '도착한 뒤에는 조용');
  });

  test('다시 나타난(show) 인물은 지난 걸음을 몰아서 내지 않는다', () => {
    const a = new Adv(data(['toby'], 'human'));
    a.run([
      { t: 'show', who: 'mom', kind: 'mom', at: [2, 5] },
      { t: 'walk', who: 'mom', to: [12, 5] },
    ]);
    run(a, 5);
    a.run([{ t: 'show', who: 'mom', kind: 'mom', at: [2, 5] }]);
    const sfx = run(a, 0.5);
    assert.equal(count(sfx, 'step:human'), 0, sfx.join(','));
  });
});
