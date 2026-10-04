import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { changeMap, interactTarget } from '../game.ts';
import { TILE } from '../maps.ts';
import { accept, progress } from '../quests.ts';
import { RESCUE_WAVES, structureSpot } from '../rescue.ts';
import { hold, play } from './helpers.ts';
import type { Game } from '../game.ts';

/** 지도의 id 구조물 앞(말 거는 자리)에 선다 */
function standAt(g: Game, kind: 'cocoon' | 'chest', id: string): void {
  const s = g.world.map.structures.find((x) => x.kind === kind && x.id === id)!;
  const at = structureSpot(s);
  g.world.player.x = at.x;
  g.world.player.y = at.y;
}

/** 지금 구출에 나온 먼지 무리를 모두 쓰러뜨린다 */
function clearWave(g: Game): number {
  const ids = g.world.rescue!.ids;
  let n = 0;
  for (const m of g.world.monsters) {
    if (ids.includes(m.id)) {
      m.hp = 0;
      n++;
    }
  }
  hold(g, {}, 0.1);
  return n;
}

describe('먼지 고치: 동료 구하기', () => {
  test('고치 앞에 서면 말 걸 대상이 고치, 멀리 있으면 아니다', () => {
    const g = play('toby', 'toybox');
    standAt(g, 'cocoon', 'bori');
    assert.deepEqual(interactTarget(g), { kind: 'cocoon', hero: 'bori' });
    g.world.player.x -= TILE * 4;
    assert.equal(interactTarget(g), null);
  });

  test('말을 걸면 먼지 무리가 차례로 몰려오고, 다 물리치면 보리가 탐험대에 들어온다', () => {
    const g = play('toby', 'toybox');
    accept(g.save, 'q_fluff');
    g.save.quests.q_fluff = { state: 'done', n: 6 };
    accept(g.save, 'q_bori');
    standAt(g, 'cocoon', 'bori');
    hold(g, { attack: true, attackPressed: true }, 1 / 60);
    assert.ok(g.world.rescue, '구출이 시작된다');
    assert.ok(g.world.events.some((e) => e.kind === 'rescueStart' && e.hero === 'bori'));
    const sizes: number[] = [];
    for (let i = 0; i < RESCUE_WAVES.length; i++) {
      assert.deepEqual(g.save.party, ['toby'], `${i + 1}번째 무리 동안은 아직`);
      // 무리는 늦게 나오는 몬스터까지 다 나온 뒤 센다
      hold(g, {}, 1.5);
      sizes.push(clearWave(g));
    }
    assert.deepEqual(sizes, RESCUE_WAVES);
    assert.deepEqual(g.save.party, ['toby', 'bori']);
    assert.equal(g.world.rescue, null);
    assert.equal(g.save.flags.rescued_bori, true);
    assert.ok(g.world.events.some((e) => e.kind === 'join' && e.hero === 'bori'));
    assert.equal(progress(g.save, 'q_bori').state, 'ready', '구출 퀘스트를 보고할 수 있다');
    // 구한 뒤에는 고치에 말을 걸 수 없다
    assert.equal(interactTarget(g), null);
  });

  test('구출 중 다른 방으로 나가면 처음부터 다시 (동료는 아직 고치 안에)', () => {
    const g = play('toby', 'toybox');
    standAt(g, 'cocoon', 'bori');
    hold(g, { attack: true, attackPressed: true }, 1 / 60);
    assert.ok(g.world.rescue);
    changeMap(g, 'village');
    changeMap(g, 'toybox');
    assert.equal(g.world.rescue, null);
    assert.deepEqual(g.save.party, ['toby']);
    standAt(g, 'cocoon', 'bori');
    assert.deepEqual(interactTarget(g), { kind: 'cocoon', hero: 'bori' });
  });

  test('구출 중에 고치에 다시 말을 걸어도 무리가 또 나오지 않는다', () => {
    const g = play('toby', 'toybox');
    standAt(g, 'cocoon', 'bori');
    hold(g, { attack: true, attackPressed: true }, 1 / 60);
    const first = g.world.rescue!.ids.slice();
    hold(g, { attack: true, attackPressed: true }, 1 / 60);
    assert.deepEqual(g.world.rescue!.ids, first);
    assert.equal(g.world.events.filter((e) => e.kind === 'rescueStart').length, 1);
  });
});

describe('보물 상자', () => {
  test('열면 정해진 부품과 단추가 나오고, 한 번 연 상자는 다시 열리지 않는다', () => {
    const g = play('toby', 'toybox');
    standAt(g, 'chest', 'pin');
    assert.deepEqual(interactTarget(g), { kind: 'chest', part: 'pin' });
    const gold = g.save.gold;
    hold(g, { attack: true, attackPressed: true }, 1 / 60);
    assert.equal(g.save.parts.pin, 1);
    assert.ok(g.save.gold > gold);
    assert.equal(g.save.flags.chest_toybox_pin, true);
    assert.ok(g.world.events.some((e) => e.kind === 'chest' && e.part === 'pin'));
    assert.equal(interactTarget(g), null);
  });

  test('이미 가진 부품이 든 상자는 부품 대신 단추를 더 준다', () => {
    const g = play('toby', 'toybox');
    g.save.parts.cloth = 2;
    standAt(g, 'chest', 'cloth');
    const gold = g.save.gold;
    hold(g, { attack: true, attackPressed: true }, 1 / 60);
    assert.equal(g.save.parts.cloth, 2, '레벨은 그대로');
    const ev = g.world.events.find((e) => e.kind === 'chest');
    assert.deepEqual(ev && ev.kind === 'chest' && ev.part, null);
    assert.ok(g.save.gold - gold >= 150);
  });
});
