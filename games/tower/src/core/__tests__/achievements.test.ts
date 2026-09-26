import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { ACHIEVEMENTS, checkAchievements } from '../achievements.ts';
import { BOSS, findItem } from '../data.ts';
import { applyItem, dealDamage, spawnEnemy, step } from '../game.ts';
import { HEROES } from '../heroes.ts';
import { emptyMeta } from '../meta.ts';
import { buildRunReport, finishRun, shardsForRun, type RunReport } from '../progress.ts';
import { useSkill } from '../skills.ts';
import { dummyDef, placeAt, quietGame } from './helpers.ts';

function report(over: Partial<RunReport> = {}): RunReport {
  return {
    mode: 'classic',
    difficulty: 'normal',
    hero: 'guardian',
    won: true,
    round: 15,
    kills: 400,
    weaponDamage: { normal: 1000, pierce: 0, magic: 0, siege: 0, chaos: 0 },
    skillsUsed: 3,
    bossesKilled: 1,
    maxStar: 2,
    hpRatio: 0.5,
    gold: 100,
    ...over,
  };
}

function has(r: RunReport, id: string, heroWins: string[] = []): boolean {
  return checkAchievements(r, heroWins).includes(id);
}

describe('판 결과 모으기', () => {
  test('무기 계열별 피해·스킬 사용·★·보스 처치·체력 비율이 기록된다', () => {
    const s = quietGame({ roundSeconds: 5 });
    applyItem(s, findItem('longbow'));
    for (let i = 0; i < 3; i++) applyItem(s, findItem('sling')); // ★2 합성
    placeAt(s, 60, 0, dummyDef({ hp: 1e6 }));
    step(s, 0.05);
    useSkill(s, 'meteor');
    dealDamage(s, 'thorns', s.enemies[0], 10, false);
    const boss = spawnEnemy(s, BOSS, s.tower.x + 100, s.tower.y);
    boss.hp = 1;
    // 첫 발 뒤 재사용 대기(최대 1.2초)가 지나면 장궁이 보스까지 꿰뚫는다
    for (let i = 0; i < 30 && s.status === 'playing'; i++) step(s, 0.05);
    s.tower.hp = s.tower.maxHp / 4;
    const r = buildRunReport(s);
    assert.equal(r.won, true);
    assert.ok(r.weaponDamage.pierce > 0);
    assert.ok(r.weaponDamage.normal > 0);
    assert.equal(r.weaponDamage.magic, 0);
    assert.equal(r.skillsUsed, 1);
    assert.equal(r.maxStar, 2);
    assert.equal(r.bossesKilled, 1);
    assert.equal(r.hpRatio, 0.25);
    assert.equal(r.hero, null);
  });
});

describe('업적 조건', () => {
  test('업적은 14개, id 가 겹치지 않고 보상이 있다', () => {
    assert.equal(ACHIEVEMENTS.length, 14);
    assert.equal(new Set(ACHIEVEMENTS.map((a) => a.id)).size, 14);
    for (const a of ACHIEVEMENTS) assert.ok(a.reward > 0 && a.name && a.desc);
  });

  test('첫 승리: 클래식에서 이기면', () => {
    assert.equal(has(report(), 'first_win'), true);
    assert.equal(has(report({ won: false }), 'first_win'), false);
  });

  test('관통만으로 승리: 무기 피해가 모두 관통일 때만 (스킬·가시 피해는 상관없음)', () => {
    const pierce = { normal: 0, pierce: 5000, magic: 0, siege: 0, chaos: 0 };
    assert.equal(has(report({ weaponDamage: pierce }), 'pierce_only'), true);
    assert.equal(has(report({ weaponDamage: { ...pierce, normal: 1 } }), 'pierce_only'), false);
    assert.equal(has(report({ weaponDamage: pierce, won: false }), 'pierce_only'), false);
  });

  test('무기 피해가 하나도 없으면 "~만으로 승리"는 아니다', () => {
    const none = { normal: 0, pierce: 0, magic: 0, siege: 0, chaos: 0 };
    const r = checkAchievements(report({ weaponDamage: none }), []);
    for (const id of ['normal_only', 'pierce_only', 'magic_only', 'siege_only', 'chaos_only']) assert.equal(r.includes(id), false);
  });

  test('스킬 없이 승리', () => {
    assert.equal(has(report({ skillsUsed: 0 }), 'no_skill'), true);
    assert.equal(has(report({ skillsUsed: 1 }), 'no_skill'), false);
  });

  test('어려움 승리 · 체력 80% 이상 남긴 승리 (경곗값 포함)', () => {
    assert.equal(has(report({ difficulty: 'hard' }), 'hard_win'), true);
    assert.equal(has(report({ difficulty: 'normal' }), 'hard_win'), false);
    assert.equal(has(report({ hpRatio: 0.8 }), 'flawless'), true);
    assert.equal(has(report({ hpRatio: 0.79 }), 'flawless'), false);
  });

  test('★3 무기는 이기지 않아도 된다', () => {
    assert.equal(has(report({ won: false, maxStar: 3 }), 'star3'), true);
    assert.equal(has(report({ maxStar: 2 }), 'star3'), false);
  });

  test('무한 모드: 30라운드 도달 · 한 판에 보스 3마리', () => {
    const e = { mode: 'endless' as const, won: false };
    assert.equal(has(report({ ...e, round: 30 }), 'endless_30'), true);
    assert.equal(has(report({ ...e, round: 29 }), 'endless_30'), false);
    assert.equal(has(report({ ...e, bossesKilled: 3 }), 'boss_slayer'), true);
    assert.equal(has(report({ ...e, bossesKilled: 2 }), 'boss_slayer'), false);
    assert.equal(has(report({ ...e, won: false }), 'first_win'), false, '무한 모드에는 승리가 없다');
  });

  test('부자 탑: 골드 2000 이상 가진 채 끝내기', () => {
    assert.equal(has(report({ won: false, gold: 2000 }), 'rich'), true);
    assert.equal(has(report({ gold: 1999 }), 'rich'), false);
  });

  test('모든 탑의 주인: 다섯 탑으로 모두 이기면 (이번 승리 포함)', () => {
    const others = HEROES.map((h) => h.id).filter((id) => id !== 'gambler');
    assert.equal(has(report({ hero: 'gambler' }), 'all_heroes', others), true);
    assert.equal(has(report({ hero: 'gambler', won: false }), 'all_heroes', others), false);
    assert.equal(has(report({ hero: 'guardian' }), 'all_heroes', others), false);
  });
});

describe('판이 끝났을 때 보상', () => {
  test('별조각: 라운드×2 + 처치/40 + 승리 25, 난이도 배율(쉬움 0.7 · 보통 1 · 어려움 1.5), 올림', () => {
    assert.equal(shardsForRun(report({ won: true, round: 15, kills: 400 })), 30 + 10 + 25);
    assert.equal(shardsForRun(report({ won: false, round: 7, kills: 79 })), 14 + 1);
    assert.equal(shardsForRun(report({ won: false, round: 7, kills: 79, difficulty: 'hard' })), Math.ceil(15 * 1.5));
    assert.equal(shardsForRun(report({ won: false, round: 7, kills: 79, difficulty: 'easy' })), Math.ceil(15 * 0.7));
  });

  test('별조각: 무한 모드는 보스 1마리당 15', () => {
    assert.equal(shardsForRun(report({ mode: 'endless', won: false, round: 31, kills: 0, bossesKilled: 2 })), 62 + 30);
  });

  test('처음 얻은 업적만 보상을 주고, 기록·탑 승리·판 수·튜토리얼 완료가 남는다', () => {
    const r = report({ skillsUsed: 0 });
    const first = finishRun(emptyMeta(), r);
    const ids = first.achieved.map((a) => a.id).sort();
    assert.deepEqual(ids, ['first_win', 'no_skill', 'normal_only']);
    const reward = first.achieved.reduce((sum, a) => sum + a.reward, 0);
    assert.equal(first.meta.shards, first.shards + reward);
    assert.deepEqual([...first.meta.achievements].sort(), ids);
    assert.deepEqual(first.meta.heroWins, ['guardian']);
    assert.equal(first.meta.runs, 1);
    assert.equal(first.meta.tutorialDone, true);

    const second = finishRun(first.meta, r);
    assert.deepEqual(second.achieved, [], '같은 업적은 다시 주지 않는다');
    assert.equal(second.meta.shards, first.meta.shards + second.shards);
    assert.deepEqual(second.meta.heroWins, ['guardian'], '겹치지 않게');
  });

  test('지면 탑 승리 기록은 남지 않는다', () => {
    const { meta } = finishRun(emptyMeta(), report({ won: false }));
    assert.deepEqual(meta.heroWins, []);
  });
});
