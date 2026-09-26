import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { LEGENDARY_WEAPONS, WEAPONS } from '../../core/data.ts';
import type { GameEvent } from '../../core/types.ts';
import { METEOR_FALL, WEAPON_FX, fxFor, hitDelay, schedule, travelAngle } from '../weaponfx.ts';

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;
const O = { x: 0, y: 0 };

describe('무기별 연출 사양', () => {
  test('모든 무기(15종)가 자기 연출을 가진다', () => {
    for (const w of WEAPONS) assert.ok(WEAPON_FX[w.id], `${w.name}(${w.id}) 연출 없음`);
  });

  test('전설 무기 3종도 자기 연출을 가진다', () => {
    for (const w of LEGENDARY_WEAPONS) assert.ok(WEAPON_FX[w.id], `${w.name}(${w.id}) 연출 없음`);
  });

  test('무기마다 눈에 보이는 모양이 거의 다 다르다 (15종 중 13가지 이상)', () => {
    const looks = new Set(WEAPONS.map((w) => WEAPON_FX[w.id].projectile ?? WEAPON_FX[w.id].beam));
    assert.ok(looks.size >= 13, `모양 ${looks.size}가지`);
  });

  test('이름에 맞는 방식: 번개·광선은 즉시, 광역(포탄·바위·항아리)은 떨어질 때 터짐, 나머지는 날아간다', () => {
    const byId = (id: string) => WEAPON_FX[id];
    for (const id of ['chain_bolt', 'storm_crystal', 'void_ray', 'chaos_eye']) {
      assert.equal(byId(id).timing, 'instant', id);
      assert.ok(byId(id).beam, `${id} 는 광선/번개`);
    }
    for (const id of ['mortar', 'catapult', 'fire_pot']) {
      assert.equal(byId(id).timing, 'impact', id);
      assert.ok(byId(id).arc > 0, `${id} 는 포물선`);
    }
    for (const id of ['longbow', 'gale_bow', 'ballista', 'sling', 'twin_daggers', 'battle_axe', 'frost_orb', 'chaos_orb']) {
      assert.equal(byId(id).timing, 'travel', id);
      assert.ok(byId(id).projectile, `${id} 는 투사체`);
    }
    assert.equal(byId('twin_daggers').count, 2, '쌍단검은 두 자루');
  });

  test('날아가는 무기는 눈에 보일 만큼 느리되(100px 에 0.12초 이상) 사거리 끝까지 0.8초를 넘지 않는다', () => {
    for (const w of WEAPONS) {
      const fx = WEAPON_FX[w.id];
      if (fx.timing === 'instant') continue;
      assert.ok(100 / fx.speed >= 0.12, `${w.id} 너무 빠름`);
      assert.ok(w.range / fx.speed <= 0.8, `${w.id} 너무 느림`);
    }
  });

  test('모르는 무기 id 는 기본 연출을 쓴다', () => {
    assert.ok(fxFor('???').projectile);
  });
});

describe('착탄 시각', () => {
  const travel = { ...WEAPON_FX.longbow, speed: 100 };
  const impact = { ...WEAPON_FX.mortar, speed: 100 };
  const instant = WEAPON_FX.chain_bolt;

  test('즉시형은 지연 0', () => {
    assert.equal(hitDelay(instant, O, { x: 300, y: 0 }, { x: 300, y: 0 }), 0);
  });

  test('날아가는 무기는 맞은 적까지의 거리 ÷ 속도 (관통 화살은 가까운 적부터 차례로 맞는다)', () => {
    assert.ok(close(hitDelay(travel, O, { x: 200, y: 0 }, { x: 50, y: 0 }), 0.5));
    assert.ok(close(hitDelay(travel, O, { x: 200, y: 0 }, { x: 150, y: 0 }), 1.5));
  });

  test('날아가는 거리보다 먼 곳은 끝 지점 도착 시각으로 자른다', () => {
    assert.ok(close(hitDelay(travel, O, { x: 100, y: 0 }, { x: 130, y: 0 }), 1));
  });

  test('떨어져 터지는 무기는 주변 적도 모두 착탄 시각에 맞는다', () => {
    assert.ok(close(hitDelay(impact, O, { x: 200, y: 0 }, { x: 170, y: 30 }), 2));
  });
});

describe('이벤트 지연 스케줄', () => {
  const shot = (weaponId: string, to = { x: 100, y: 0 }): GameEvent => ({
    kind: 'shot',
    weaponId,
    weaponType: 'normal',
    behavior: 'single',
    from: O,
    to,
  });
  const hit = (enemyId: number, x: number): GameEvent => ({ kind: 'hit', at: { x, y: 0 }, amount: 5, enemyId, crit: false });
  const kill = (enemyId: number, x: number): GameEvent => ({ kind: 'kill', at: { x, y: 0 }, bounty: 3, enemyId });

  test('발사는 바로, 그 발사의 피격은 날아간 시간만큼 늦게', () => {
    const speed = WEAPON_FX.sling.speed;
    const out = schedule([shot('sling'), hit(1, 100)]);
    assert.equal(out[0].delay, 0);
    assert.ok(close(out[1].delay, 100 / speed));
    assert.equal(out[1].fx, WEAPON_FX.sling, '피격 효과도 그 무기 것');
  });

  test('관통 화살의 피격은 거리마다 다른 시각', () => {
    const out = schedule([shot('longbow', { x: 180, y: 0 }), hit(1, 40), hit(2, 120)]);
    assert.ok(out[2].delay > out[1].delay);
  });

  test('광역 폭발(splash)과 그 피격은 모두 착탄 시각', () => {
    const splash: GameEvent = { kind: 'splash', at: { x: 100, y: 0 }, radius: 40 };
    const out = schedule([shot('mortar'), splash, hit(1, 100), hit(2, 130)]);
    const t = 100 / WEAPON_FX.mortar.speed;
    assert.ok(close(out[1].delay, t) && close(out[2].delay, t) && close(out[3].delay, t));
  });

  test('처치 연출은 그 적이 마지막으로 맞은 시각에 맞춘다', () => {
    const out = schedule([shot('sling', { x: 50, y: 0 }), hit(7, 50), shot('catapult', { x: 200, y: 0 }), hit(7, 200), kill(7, 60)]);
    assert.ok(close(out[4].delay, Math.max(out[1].delay, out[3].delay)));
  });

  test('발사와 상관없는 피격(가시 반사)은 지연 없이: 탑 피격 뒤에는 앞선 발사 정보를 잊는다', () => {
    const towerHit: GameEvent = { kind: 'towerHit', amount: 3 };
    const out = schedule([shot('catapult', { x: 200, y: 0 }), towerHit, hit(3, 30)]);
    assert.equal(out[2].delay, 0);
    assert.equal(out[2].fx, undefined);
  });

  test('맞은 적 없이 처치만 있으면 지연 0', () => {
    assert.equal(schedule([kill(9, 0)])[0].delay, 0);
  });
});

describe('진행 방향 (화살 머리를 날아가는 쪽으로)', () => {
  test('평평하게 오른쪽이면 0, 아래쪽이면 π/2', () => {
    assert.ok(close(travelAngle(O, { x: 100, y: 0 }, 0.5, 0), 0));
    assert.ok(close(travelAngle(O, { x: 0, y: 100 }, 0.5, 0), Math.PI / 2));
  });

  test('포물선으로 던지면 처음엔 위를, 끝에선 아래를 향한다', () => {
    const start = travelAngle(O, { x: 100, y: 0 }, 0, 30);
    const end = travelAngle(O, { x: 100, y: 0 }, 1, 30);
    assert.ok(start < 0, '처음엔 위로 (y 감소)');
    assert.ok(end > 0, '끝에선 아래로');
    assert.ok(close(travelAngle(O, { x: 100, y: 0 }, 0.5, 30), 0), '꼭대기에선 수평');
  });
});

describe('메테오 스킬 착탄 시각', () => {
  test('메테오 스킬 바로 뒤 피격·처치는 운석이 떨어지는 시간 뒤에 보인다', () => {
    const skill: GameEvent = { kind: 'skill', id: 'meteor', at: { x: 100, y: 100 } };
    const out = schedule([
      skill,
      { kind: 'hit', at: { x: 100, y: 100 }, amount: 150, enemyId: 4, crit: false },
      { kind: 'kill', at: { x: 100, y: 100 }, bounty: 5, enemyId: 4 },
    ]);
    assert.equal(out[0].delay, 0);
    assert.equal(out[1].delay, METEOR_FALL);
    assert.equal(out[2].delay, METEOR_FALL);
  });

  test('혜성·황금 운석도 운석처럼 떨어지는 시간 뒤에 맞는다', () => {
    for (const id of ['comet', 'golden_meteor']) {
      const out = schedule([
        { kind: 'skill', id, at: { x: 1, y: 1 } },
        { kind: 'hit', at: O, amount: 1, enemyId: 1, crit: false },
      ]);
      assert.equal(out[1].delay, METEOR_FALL, id);
    }
  });

  test('다른 스킬 뒤 피격은 지연 없음', () => {
    const out = schedule([
      { kind: 'skill', id: 'blizzard' },
      { kind: 'hit', at: O, amount: 1, enemyId: 1, crit: false },
    ]);
    assert.equal(out[1].delay, 0);
  });
});
