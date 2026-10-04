import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { newSave } from '../character.ts';
import { joinParty } from '../party.ts';
import { SLOT_COUNT, deleteSlot, isOldSave, listSlots, loadSlot, parseSave, saveSlot, type StorageLike } from '../saveio.ts';

function mem(init: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...init };
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v), removeItem: (k) => void delete data[k] };
}

describe('저장 · 불러오기', () => {
  test('저장했다 불러오면 그대로 (동료 · 부품 · 친구 · 퀘스트 · 깃발 포함)', () => {
    const st = mem();
    const s = newSave(1, 'toby');
    s.lv = 7;
    s.gold = 1234;
    joinParty(s, 'bori');
    s.parts.pin = 2;
    s.slots = ['pin'];
    s.friends.fluff = 3;
    s.rescued = ['mouse'];
    s.weaponLv = 4;
    s.quests.q_fluff = { state: 'done', n: 6 };
    s.flags.cave_open = true;
    saveSlot(st, s);
    assert.deepEqual(loadSlot(st, 1), s);
  });

  test('칸 목록: 빈 칸은 null, 있는 칸은 탐험대 · 레벨', () => {
    const st = mem();
    saveSlot(st, newSave(2));
    const list = listSlots(st);
    assert.equal(list.length, SLOT_COUNT);
    assert.equal(list[0], null);
    assert.deepEqual(list[2] && { name: list[2].name, party: list[2].party, lv: list[2].lv }, { name: '코링코 탐험대', party: ['toby'], lv: 1 });
    deleteSlot(st, 2);
    assert.equal(listSlots(st)[2], null);
  });

  test('깨진 값 · 모르는 직업 · 숫자가 아닌 값은 버린다', () => {
    assert.equal(parseSave('{깨짐'), null);
    assert.equal(parseSave(JSON.stringify({ ...newSave(0, 'toby'), hero: 'dragon' })), null);
    assert.equal(parseSave(JSON.stringify({ ...newSave(0, 'toby'), lv: 'abc' })), null);
    assert.equal(parseSave('null'), null);
  });

  test('예전 저장에 없던 칸은 기본값으로 채운다', () => {
    const old = newSave(0, 'nabi') as unknown as Record<string, unknown>;
    delete old.mats;
    delete old.flags;
    delete old.riftBest;
    const s = parseSave(JSON.stringify(old))!;
    assert.ok(s);
    assert.equal(s.mats.dust, 0);
    assert.deepEqual(s.flags, {});
    assert.equal(s.riftBest, 0);
  });

  test('저장소가 막혀 있어도 멈추지 않는다', () => {
    const broken: StorageLike = {
      getItem: () => {
        throw new Error('no');
      },
      setItem: () => {
        throw new Error('no');
      },
    };
    assert.doesNotThrow(() => saveSlot(broken, newSave(0, 'toby')));
    assert.equal(loadSlot(broken, 0), null);
  });
});

test('예전 버전(장비가 있던) 저장은 읽지 않고, 예전 저장인지 알려 준다', () => {
  const st = mem({ 'koringko:slot0': JSON.stringify({ version: 1, hero: 'toby', lv: 9, gold: 5, gear: {}, bag: [] }) });
  assert.equal(loadSlot(st, 0), null);
  assert.equal(isOldSave(st, 0), true);
  assert.equal(isOldSave(st, 1), false);
});
