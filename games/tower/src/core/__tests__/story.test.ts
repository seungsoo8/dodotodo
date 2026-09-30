import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { BOSSES } from '../data.ts';
import { HEROES, type HeroId } from '../heroes.ts';
import { emptyMeta, type MetaState } from '../meta.ts';
import {
  CHAPTERS,
  STORY_LINE_MAX,
  STORY_ROUNDS,
  TRUE_ENDING,
  WORLD_INTRO,
  endingCards,
  markSeen,
  prologueCards,
  storyPages,
  trueEndingUnlocked,
  unreadCount,
} from '../story.ts';

const ALL: HeroId[] = HEROES.map((h) => h.id);

function meta(over: Partial<MetaState> = {}): MetaState {
  return { ...emptyMeta(), ...over };
}

/** 탑을 모두 연 상태 */
function allUnlocked(over: Partial<MetaState> = {}): MetaState {
  return meta({ levels: { hero_archer: 1, hero_mage: 1, hero_fortress: 1, hero_gambler: 1 }, ...over });
}

describe('이야기 내용', () => {
  test('탑마다 수호자 이름·서장·라운드 대사·보스별 대사·결말이 모두 있다', () => {
    for (const id of ALL) {
      const c = CHAPTERS[id];
      assert.ok(c.keeper.length > 0, `${id} 수호자 이름`);
      assert.ok(c.prologue.lines.length >= 3, `${id} 서장`);
      assert.ok(c.ending.lines.length >= 3, `${id} 결말`);
      assert.ok(c.lines.lowHp.length > 0, `${id} 위기`);
      assert.deepEqual(Object.keys(c.lines.rounds).map(Number), STORY_ROUNDS, `${id} 라운드 대사`);
      for (const r of STORY_ROUNDS) assert.ok(c.lines.rounds[r].length > 0, `${id} ${r}라운드`);
      for (const b of BOSSES) assert.ok(c.boss[b.id]?.length > 0, `${id} → ${b.id}`);
    }
  });

  test('결말 다섯 개가 서로 다른 진실 조각을 하나씩 밝힌다', () => {
    const pieces = ALL.map((id) => CHAPTERS[id].ending.piece);
    assert.equal(new Set(pieces).size, ALL.length);
  });

  test('한 줄은 화면 글상자 폭을 넘지 않는다', () => {
    const texts = [
      ...WORLD_INTRO.lines,
      ...TRUE_ENDING.lines,
      ...ALL.flatMap((id) => {
        const c = CHAPTERS[id];
        return [...c.prologue.lines, ...c.ending.lines, ...Object.values(c.lines.rounds), c.lines.lowHp, ...Object.values(c.boss)];
      }),
    ];
    for (const t of texts) assert.ok(t.length <= STORY_LINE_MAX, `너무 긴 줄 (${t.length}자): ${t}`);
  });
});

describe('라운드 대사 간격', () => {
  test('한 판 동안 1·3·5·7·10·12라운드에 이어지고, 마지막 장수 전에 끝난다', () => {
    assert.deepEqual(STORY_ROUNDS, [1, 3, 5, 7, 10, 12]);
  });
});

describe('이야기 쪽 열림', () => {
  test('처음에는 서막과 수호탑 서장만 열려 있다', () => {
    const open = storyPages(meta()).filter((p) => p.unlocked).map((p) => p.id);
    assert.deepEqual(open, ['world', 'prologue:guardian']);
  });

  test('탑을 열면 그 탑의 서장이 열린다', () => {
    const pages = storyPages(meta({ levels: { hero_mage: 1 } }));
    assert.equal(pages.find((p) => p.id === 'prologue:mage')?.unlocked, true);
    assert.equal(pages.find((p) => p.id === 'prologue:archer')?.unlocked, false);
  });

  test('그 탑으로 클래식을 이기면 결말이 열린다', () => {
    const pages = storyPages(meta({ heroWins: ['guardian'] }));
    assert.equal(pages.find((p) => p.id === 'ending:guardian')?.unlocked, true);
    assert.equal(pages.find((p) => p.id === 'ending:archer')?.unlocked, false);
  });

  test('다섯 탑 모두로 이겨야 마지막 이야기가 열린다 (넷은 부족)', () => {
    assert.equal(trueEndingUnlocked(meta({ heroWins: ALL.slice(0, 4) })), false);
    assert.equal(trueEndingUnlocked(meta({ heroWins: [...ALL] })), true);
    assert.equal(storyPages(meta({ heroWins: [...ALL] })).find((p) => p.id === 'true')?.unlocked, true);
  });

  test('열렸지만 아직 안 본 쪽 수를 센다', () => {
    assert.equal(unreadCount(meta()), 2);
    assert.equal(unreadCount(meta({ storySeen: ['world'] })), 1);
    assert.equal(unreadCount(meta({ storySeen: ['world', 'prologue:guardian'] })), 0);
  });

  test('본 쪽 표시는 한 번만 남는다', () => {
    const m = markSeen(markSeen(meta(), 'world'), 'world');
    assert.deepEqual(m.storySeen, ['world']);
  });
});

describe('판을 시작할 때 보여 줄 이야기', () => {
  test('맨 처음 클래식이면 서막 뒤에 그 탑 서장', () => {
    assert.deepEqual(
      prologueCards(meta(), 'guardian', 'classic').map((p) => p.id),
      ['world', 'prologue:guardian'],
    );
  });

  test('서막을 봤으면 새 탑 서장만', () => {
    assert.deepEqual(prologueCards(allUnlocked({ storySeen: ['world'] }), 'mage', 'classic').map((p) => p.id), ['prologue:mage']);
  });

  test('이미 본 서장은 다시 띄우지 않는다', () => {
    assert.deepEqual(prologueCards(meta({ storySeen: ['world', 'prologue:guardian'] }), 'guardian', 'classic'), []);
  });

  test('무한 모드는 이야기를 띄우지 않는다', () => {
    assert.deepEqual(prologueCards(meta(), 'guardian', 'endless'), []);
  });
});

describe('이겼을 때 보여 줄 이야기', () => {
  test('그 탑으로 처음 이기면 결말', () => {
    const before = meta();
    const after = meta({ heroWins: ['guardian'] });
    assert.deepEqual(endingCards(before, after, 'guardian').map((p) => p.id), ['ending:guardian']);
  });

  test('마지막 탑으로 이기면 결말 뒤에 마지막 이야기까지', () => {
    const before = meta({ heroWins: ALL.filter((h) => h !== 'gambler') });
    const after = meta({ heroWins: [...ALL] });
    assert.deepEqual(endingCards(before, after, 'gambler').map((p) => p.id), ['ending:gambler', 'true']);
  });

  test('이미 이겨 본 탑이면 결말을 다시 띄우지 않는다', () => {
    const m = meta({ heroWins: ['guardian'] });
    assert.deepEqual(endingCards(m, m, 'guardian'), []);
  });

  test('졌으면(탑 승리가 늘지 않았으면) 아무것도 없다', () => {
    assert.deepEqual(endingCards(meta(), meta(), 'archer'), []);
  });
});
