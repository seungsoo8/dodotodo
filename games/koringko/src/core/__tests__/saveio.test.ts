import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { newSave } from '../character.ts';
import { SLOT_COUNT, deleteSlot, listSlots, loadSlot, parseSave, saveSlot, type StorageLike } from '../saveio.ts';

function mem(init: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...init };
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v), removeItem: (k) => void delete data[k] };
}

describe('저장 · 불러오기', () => {
  test('저장했다 불러오면 그대로 (장비 · 퀘스트 · 깃발 포함)', () => {
    const st = mem();
    const s = newSave('bori', '보리', 1);
    s.lv = 7;
    s.gold = 1234;
    s.gear.weapon = { uid: '1-1', slot: 'weapon', name: '블록 도끼', rarity: 'magic', ilvl: 7, req: 5, dmg: [10, 14], spd: 0.86, affixes: [{ id: 'str', v: 2 }], plus: 3, hero: 'bori' };
    s.quests.q_fluff = { state: 'done', n: 6 };
    s.flags.cave_open = true;
    saveSlot(st, s);
    assert.deepEqual(loadSlot(st, 1), s);
  });

  test('칸 목록: 빈 칸은 null, 있는 칸은 이름 · 직업 · 레벨', () => {
    const st = mem();
    saveSlot(st, newSave('ruru', '루루', 2));
    const list = listSlots(st);
    assert.equal(list.length, SLOT_COUNT);
    assert.equal(list[0], null);
    assert.deepEqual(list[2] && { name: list[2].name, hero: list[2].hero, lv: list[2].lv }, { name: '루루', hero: 'ruru', lv: 1 });
    deleteSlot(st, 2);
    assert.equal(listSlots(st)[2], null);
  });

  test('깨진 값 · 모르는 직업 · 숫자가 아닌 값은 버린다', () => {
    assert.equal(parseSave('{깨짐'), null);
    assert.equal(parseSave(JSON.stringify({ ...newSave('toby', 'x'), hero: 'dragon' })), null);
    assert.equal(parseSave(JSON.stringify({ ...newSave('toby', 'x'), lv: 'abc' })), null);
    assert.equal(parseSave('null'), null);
  });

  test('예전 저장에 없던 칸은 기본값으로 채운다', () => {
    const old = newSave('nabi', '나비') as unknown as Record<string, unknown>;
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
    assert.doesNotThrow(() => saveSlot(broken, newSave('toby', 't')));
    assert.equal(loadSlot(broken, 0), null);
  });
});

test('예전 저장의 남은 능력치 포인트는 읽을 때 저절로 나눠 넣는다', () => {
  const s = newSave('nabi', '나비');
  s.statPts = 4;
  const back = parseSave(JSON.stringify(s))!;
  assert.equal(back.statPts, 0);
  assert.equal(back.attrs.int > s.attrs.int, true);
});
