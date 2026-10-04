import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { newSave } from '../character.ts';
import { buildMap } from '../maps.ts';
import { QUESTS, QUEST_BY_ID, accept, canAccept, complete, currentGoal, onKill, onRiftClear, progress, questFor } from '../quests.ts';
import { createRng } from '../rng.ts';
import { NPCS, PROLOGUE, CUTSCENES } from '../story.ts';
import { freeze, hold, placeAt, play } from './helpers.ts';

describe('퀘스트 받기', () => {
  test('첫 퀘스트는 바로, 다음 퀘스트는 앞 퀘스트를 끝내야 (레벨 조건도)', () => {
    const s = newSave('toby', '토비');
    assert.equal(canAccept(s, QUEST_BY_ID.q_fluff), true);
    assert.equal(canAccept(s, QUEST_BY_ID.q_wolf), false);
    s.quests.q_fluff = { state: 'done', n: 6 };
    assert.equal(canAccept(s, QUEST_BY_ID.q_wolf), false, '레벨 3 필요');
    s.lv = 3;
    assert.equal(canAccept(s, QUEST_BY_ID.q_wolf), true);
    assert.equal(accept(s, 'q_wolf'), true);
    assert.equal(accept(s, 'q_wolf'), false, '두 번 받지 않는다');
  });
});

describe('진행과 보고', () => {
  test('잡기 퀘스트: 그 몬스터를 쓰러뜨릴 때마다 오르고, 다 채우면 보고할 수 있다', () => {
    const s = newSave('toby', '토비');
    accept(s, 'q_fluff');
    for (let i = 0; i < 5; i++) onKill(s, 'fluff');
    onKill(s, 'wolf');
    assert.deepEqual(progress(s, 'q_fluff'), { state: 'active', n: 5 });
    onKill(s, 'fluff');
    assert.equal(progress(s, 'q_fluff').state, 'ready');
  });

  test('실제로 솜뭉치를 쓰러뜨리면 퀘스트가 오른다', () => {
    const g = play('toby');
    accept(g.save, 'q_fluff');
    const m = freeze(placeAt(g, 'fluff', 24, 0));
    m.hp = 1;
    hold(g, { attack: true }, 0.2);
    assert.equal(progress(g.save, 'q_fluff').n, 1);
    assert.ok(g.world.events.some((e) => e.kind === 'quest' && e.id === 'q_fluff'));
  });

  test('보고하면 보상(골드·경험치·포션)을 받고 끝난다. 다 하지 않았으면 못 한다', () => {
    const s = newSave('toby', '토비');
    accept(s, 'q_fluff');
    assert.equal(complete(s, 'q_fluff', createRng(1)), false);
    s.quests.q_fluff = { state: 'ready', n: 6 };
    const gold = s.gold;
    const hp = s.potions.hp;
    assert.equal(complete(s, 'q_fluff', createRng(1)), true);
    assert.equal(s.gold, gold + QUEST_BY_ID.q_fluff.reward.gold);
    assert.equal(s.potions.hp, hp + 3);
    assert.ok(s.exp > 0 || s.lv > 1);
    assert.equal(progress(s, 'q_fluff').state, 'done');
  });

  test('모으기 퀘스트: 가진 재료로 다 했는지 보고, 보고하면 재료를 내고 장비를 받는다', () => {
    const s = newSave('toby', '토비');
    s.lv = 2;
    accept(s, 'q_cloth');
    s.mats.fluff = 3;
    assert.equal(questFor(s, 'tailor')?.mode, 'progress');
    s.mats.fluff = 7;
    assert.equal(questFor(s, 'tailor')?.mode, 'done');
    assert.equal(complete(s, 'q_cloth', createRng(2)), true);
    assert.equal(s.mats.fluff, 2);
    assert.equal(s.bag.length, 1);
    assert.equal(s.bag[0].slot, 'armor');
  });

  test('끝내면 깃발이 켜진다 (늑대 → 동굴·과자 언덕 길)', () => {
    const s = newSave('toby', '토비');
    s.quests.q_fluff = { state: 'done', n: 6 };
    s.lv = 3;
    accept(s, 'q_wolf');
    for (let i = 0; i < 6; i++) onKill(s, 'wolf');
    complete(s, 'q_wolf', createRng(1));
    assert.equal(s.flags.cave_open, true);
    assert.equal(s.flags.candy_open, true);
  });

  test('균열 퀘스트는 그 깊이를 깨면 보고할 수 있다', () => {
    const s = newSave('toby', '토비');
    s.quests.q_bear = { state: 'done', n: 1 };
    accept(s, 'q_dusty');
    onRiftClear(s, 4);
    assert.equal(progress(s, 'q_dusty').state, 'active');
    onRiftClear(s, 5);
    assert.equal(progress(s, 'q_dusty').state, 'ready');
  });
});

describe('누구에게 무엇을', () => {
  test('보고할 것 → 새로 줄 것 → 하는 중인 것 순서', () => {
    const s = newSave('toby', '토비');
    assert.equal(questFor(s, 'chief')?.quest.id, 'q_fluff');
    assert.equal(questFor(s, 'chief')?.mode, 'offer');
    accept(s, 'q_fluff');
    assert.equal(questFor(s, 'chief')?.mode, 'progress');
    s.quests.q_fluff.state = 'ready';
    assert.equal(questFor(s, 'chief')?.mode, 'done');
  });

  test('지금 목표는 주 퀘스트', () => {
    const s = newSave('toby', '토비');
    assert.equal(currentGoal(s)?.quest.id, 'q_fluff');
    s.quests.q_fluff = { state: 'done', n: 6 };
    s.lv = 3;
    assert.equal(currentGoal(s)?.quest.id, 'q_wolf');
  });

  test('퀘스트를 주는 NPC 는 모두 어딘가 지도에 있고 이름과 대사가 있다', () => {
    const placed = new Set(['village', 'forest', 'candy', 'cave'].flatMap((id) => buildMap(id as never).npcs.map((n) => n.id)));
    for (const q of QUESTS) {
      assert.ok(placed.has(q.giver), q.giver);
      assert.ok(NPCS[q.giver]?.name, q.giver);
      assert.ok(q.talk.offer.length && q.talk.done.length && q.talk.progress);
    }
    for (const id of placed) assert.ok(NPCS[id]?.lines.length, id);
  });

  test('이야기: 서막과 장면들이 있다', () => {
    assert.ok(PROLOGUE.length >= 3);
    for (const k of ['bear', 'dusty', 'ending'] as const) assert.ok(CUTSCENES[k].length >= 2, k);
  });
});
