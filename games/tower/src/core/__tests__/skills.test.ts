import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { findItem } from '../data.ts';
import { applyItem, choosePerk, spawnEnemy, step } from '../game.ts';
import {
  BASE_SKILLS,
  COMBOS,
  FUSED_SKILLS,
  SKILL,
  bestMeteorTarget,
  evolveCost,
  evolveSkill,
  findSkill,
  fuseCheck,
  fuseSkills,
  learnCheck,
  learnSkill,
  meteorDamage,
  skillCooldownLeft,
  skillCooldownOf,
  useSkill,
} from '../skills.ts';
import { distToTower, dummyDef, giveSkills, placeAt, quietGame } from './helpers.ts';

const meteor = findSkill('meteor');
const ids = (s: ReturnType<typeof quietGame>) => s.skills.map((k) => k.id);

describe('스킬 목록', () => {
  test('기본 스킬 6종 (메테오·눈보라·긴급 수리·골드 러시·천둥·돌풍), 모두 진화 짝 특전이 있다', () => {
    assert.deepEqual(
      BASE_SKILLS.map((k) => k.id),
      ['meteor', 'blizzard', 'repair', 'gold_rush', 'thunder', 'gust'],
    );
    for (const k of BASE_SKILLS) {
      assert.ok(k.evolve, `${k.id} 진화 없음`);
      assert.doesNotThrow(() => findSkill(k.id));
    }
  });

  test('합체 스킬 7종은 서로 다른 기본 스킬 두 개로 만들고, 조합이 겹치지 않는다', () => {
    assert.equal(FUSED_SKILLS.length, 7);
    const keys = new Set<string>();
    for (const f of FUSED_SKILLS) {
      const [a, b] = f.recipe!;
      assert.notEqual(a, b);
      assert.equal(findSkill(a).tier, 'base');
      assert.equal(findSkill(b).tier, 'base');
      keys.add([a, b].sort().join('+'));
      // 합체 스킬은 두 재료의 속성을 모두 가진다
      for (const tag of [...findSkill(a).tags, ...findSkill(b).tags]) assert.ok(f.tags.includes(tag), `${f.id} ${tag}`);
    }
    assert.equal(keys.size, 7);
  });

  test('없는 스킬 id 는 오류', () => {
    assert.throws(() => findSkill('nope'));
  });
});

describe('스킬 포인트', () => {
  test('메테오 하나만 가지고, 포인트 0 으로 시작한다', () => {
    const s = quietGame();
    assert.deepEqual(ids(s), ['meteor']);
    assert.equal(s.skillPoints, 0);
  });

  test('3라운드마다 1점 (3·6 라운드), 그 사이 라운드에는 없다', () => {
    const s = quietGame({ roundSeconds: 2 });
    step(s, 2.01);
    assert.equal(s.round, 2);
    assert.equal(s.skillPoints, 0);
    step(s, 2);
    assert.equal(s.round, 3);
    assert.equal(s.skillPoints, 1);
    assert.ok(s.events.some((ev) => ev.kind === 'skillPoint'));
    step(s, 2);
    step(s, 2);
    assert.equal(s.round, 5);
    assert.equal(s.skillPoints, 1);
    step(s, 2);
    assert.equal(s.round, 6);
    assert.equal(s.skillPoints, 2);
  });

  test('주기를 0 으로 두면 라운드로는 포인트가 생기지 않는다', () => {
    const s = quietGame({ roundSeconds: 1, skills: { pointEvery: 0 } });
    for (let i = 0; i < 13; i++) step(s, 0.5);
    assert.ok(s.round >= 6);
    assert.equal(s.skillPoints, 0);
  });

  test('정예를 잡으면 1점', () => {
    const s = quietGame();
    applyItem(s, findItem('sling'));
    const e = placeAt(s, 60, 0);
    e.isElite = true;
    e.hp = 1;
    step(s, 0.01);
    assert.equal(s.skillPoints, 1);
  });
});

describe('배우기 (1단)', () => {
  test('포인트 1 을 내고 빈 칸에 새 스킬을 배운다', () => {
    const s = quietGame();
    s.skillPoints = 1;
    assert.equal(learnSkill(s, 'thunder'), true);
    assert.deepEqual(ids(s), ['meteor', 'thunder']);
    assert.equal(s.skillPoints, 0);
    assert.ok(s.events.some((ev) => ev.kind === 'learn' && ev.id === 'thunder'));
  });

  test('포인트가 없거나, 이미 가졌거나, 합체 스킬이면 배울 수 없다', () => {
    const s = quietGame();
    assert.deepEqual(learnCheck(s, 'thunder'), { ok: false, reason: 'points' });
    s.skillPoints = 5;
    assert.deepEqual(learnCheck(s, 'meteor'), { ok: false, reason: 'owned' });
    assert.deepEqual(learnCheck(s, 'comet'), { ok: false, reason: 'fused' });
    assert.equal(learnSkill(s, 'meteor'), false);
    assert.equal(s.skillPoints, 5);
  });

  test('칸(4개)이 꽉 차면 더 배울 수 없다', () => {
    const s = quietGame();
    s.skillPoints = 10;
    for (const id of ['blizzard', 'repair', 'gold_rush']) learnSkill(s, id);
    assert.equal(s.skills.length, 4);
    assert.deepEqual(learnCheck(s, 'thunder'), { ok: false, reason: 'slots' });
  });
});

describe('진화 (2단)', () => {
  test('포인트 2 를 내고 가진 기본 스킬을 진화시킨다', () => {
    const s = quietGame();
    s.skillPoints = 2;
    assert.equal(evolveCost(s, 'meteor'), SKILL.evolveCost);
    assert.equal(evolveSkill(s, 'meteor'), true);
    assert.equal(s.skills[0].evolved, true);
    assert.equal(s.skillPoints, 0);
    assert.ok(s.events.some((ev) => ev.kind === 'evolve' && ev.id === 'meteor'));
    assert.equal(evolveSkill(s, 'meteor'), false, '두 번은 안 된다');
  });

  test('짝 특전(메테오 ↔ 대폭발)을 가지고 있으면 진화가 공짜', () => {
    const s = quietGame();
    s.choice = ['big_splash', 'lucky', 'sharpen'];
    choosePerk(s, 0);
    assert.equal(evolveCost(s, 'meteor'), 0);
    assert.equal(evolveSkill(s, 'meteor'), true);
    assert.equal(s.skillPoints, 0);
  });

  test('가지지 않은 스킬은 진화할 수 없다', () => {
    const s = quietGame();
    s.skillPoints = 5;
    assert.equal(evolveSkill(s, 'thunder'), false);
  });
});

describe('합체 (3단)', () => {
  test('두 재료를 가지고 포인트 2 가 있으면 합체: 첫 재료 자리에 새 스킬, 다른 칸은 비고 바로 쓸 수 있다', () => {
    const s = quietGame();
    s.skillPoints = 4;
    learnSkill(s, 'thunder');
    learnSkill(s, 'blizzard');
    s.skillCooldowns.meteor = 20;
    assert.deepEqual(fuseCheck(s, 'comet'), { ok: true });
    assert.equal(fuseSkills(s, 'comet'), true);
    assert.deepEqual(ids(s), ['comet', 'thunder']);
    assert.equal(s.skillPoints, 0);
    assert.equal(skillCooldownLeft(s, 'comet'), 0);
    assert.ok(s.events.some((ev) => ev.kind === 'fuse' && ev.id === 'comet'));
  });

  test('재료가 없거나 포인트가 모자라면 합체할 수 없다', () => {
    const s = quietGame();
    s.skillPoints = 5;
    assert.deepEqual(fuseCheck(s, 'comet'), { ok: false, reason: 'missing' });
    learnSkill(s, 'blizzard');
    s.skillPoints = 1;
    assert.deepEqual(fuseCheck(s, 'comet'), { ok: false, reason: 'points' });
  });

  test('합체에 쓴 기본 스킬은 다시 배울 수 없다 (같은 합체 스킬을 둘 가질 수 없게)', () => {
    const s = quietGame();
    s.skillPoints = 10;
    learnSkill(s, 'blizzard');
    fuseSkills(s, 'comet');
    assert.deepEqual(learnCheck(s, 'meteor'), { ok: false, reason: 'consumed' });
    assert.deepEqual(learnCheck(s, 'blizzard'), { ok: false, reason: 'consumed' });
    assert.deepEqual(learnCheck(s, 'repair'), { ok: true });
  });

  test('진화한 재료로 합체하면 합체 스킬이 재료 하나당 30% 더 강하다', () => {
    const s = quietGame();
    s.skillPoints = 10;
    learnSkill(s, 'blizzard');
    evolveSkill(s, 'meteor');
    fuseSkills(s, 'comet');
    assert.ok(Math.abs(s.skills[0].power - (1 + SKILL.fusedEvolvedBonus)) < 1e-9);
  });
});

describe('메테오', () => {
  test('지점 반경 55 안의 적 모두에게 150 피해, 밖은 멀쩡', () => {
    const s = quietGame();
    const center = { x: s.tower.x + 150, y: s.tower.y };
    const a = placeAt(s, 150, 0, dummyDef({ hp: 1000 }));
    const b = placeAt(s, 150, 50, dummyDef({ hp: 1000 }));
    const c = placeAt(s, 150, 70, dummyDef({ hp: 1000 }));
    assert.equal(useSkill(s, 'meteor', center), true);
    assert.deepEqual([a.hp, b.hp, c.hp], [850, 850, 1000]);
    assert.ok(s.events.some((ev) => ev.kind === 'skill' && ev.id === 'meteor'));
  });

  test('라운드가 오를수록 적 체력 성장만큼 세진다', () => {
    const s = quietGame({ waves: { hpGrowth: 1.5 } });
    s.round = 3;
    assert.ok(Math.abs(meteorDamage(s) - 150 * 1.5 ** 2) < 1e-6);
  });

  test('쓰고 나면 30초 동안 다시 못 쓴다', () => {
    const s = quietGame();
    const p = { x: 100, y: 100 };
    assert.equal(useSkill(s, 'meteor', p), true);
    assert.equal(skillCooldownLeft(s, 'meteor'), meteor.cooldown);
    assert.equal(useSkill(s, 'meteor', p), false);
    step(s, 29.9);
    assert.equal(useSkill(s, 'meteor', p), false);
    step(s, 0.2);
    assert.equal(useSkill(s, 'meteor', p), true);
  });

  test('지점을 안 주면 적이 가장 많이 모인 곳에 떨어진다 (적이 없으면 쓰지 않음)', () => {
    const s = quietGame();
    assert.equal(bestMeteorTarget(s), null);
    assert.equal(useSkill(s, 'meteor'), false);
    placeAt(s, -150, 0);
    const pack = [placeAt(s, 150, 0), placeAt(s, 160, 10), placeAt(s, 150, 20)];
    useSkill(s, 'meteor');
    assert.ok(pack.every((e) => e.hp < 100));
  });

  test('진화(유성우): 가장 붐비는 곳과 다른 두 곳에도 운석이 떨어진다', () => {
    const s = quietGame();
    giveSkills(s, [['meteor', true]]);
    const far = [placeAt(s, -150, 0, dummyDef({ hp: 1000 })), placeAt(s, 0, 150, dummyDef({ hp: 1000 })), placeAt(s, 150, 0, dummyDef({ hp: 1000 }))];
    useSkill(s, 'meteor', { x: far[2].x, y: far[2].y });
    assert.ok(far.every((e) => e.hp === 850), far.map((e) => e.hp).join(','));
  });

  test('가지지 않은 스킬은 쓸 수 없다', () => {
    const s = quietGame();
    placeAt(s, 100, 0);
    assert.equal(useSkill(s, 'blizzard'), false);
  });
});

describe('눈보라', () => {
  test('모든 적이 3초 동안 얼어붙어 움직이지도 탑을 때리지도 못하고, 그 뒤 다시 움직인다', () => {
    const s = quietGame();
    giveSkills(s, [['blizzard', false]]);
    const walker = placeAt(s, 150, 0, dummyDef({ speed: 40 }));
    placeAt(s, 21, 0, dummyDef({ atk: 50 }));
    useSkill(s, 'blizzard');
    const d = distToTower(s, walker);
    step(s, 2.9);
    assert.equal(distToTower(s, walker), d);
    assert.equal(s.tower.hp, s.tower.maxHp);
    step(s, 0.2);
    step(s, 0.5);
    assert.ok(distToTower(s, walker) < d);
    assert.ok(s.tower.hp < s.tower.maxHp);
  });

  test('진화(영구 동토): 5초 동안 얼린다', () => {
    const s = quietGame();
    giveSkills(s, [['blizzard', true]]);
    const e = placeAt(s, 150, 0);
    useSkill(s, 'blizzard');
    assert.equal(e.slowTimeLeft, 5);
  });
});

describe('긴급 수리', () => {
  test('탑 체력을 최대 체력의 35% 회복한다 (최대를 넘지 않음)', () => {
    const s = quietGame();
    giveSkills(s, [['repair', false]]);
    s.tower.hp = 100;
    useSkill(s, 'repair');
    assert.equal(s.tower.hp, 450);
    s.tower.hp = 900;
    s.skillCooldowns.repair = 0;
    useSkill(s, 'repair');
    assert.equal(s.tower.hp, 1000);
  });

  test('진화(생명의 샘): 60% 회복', () => {
    const s = quietGame();
    giveSkills(s, [['repair', true]]);
    s.tower.hp = 100;
    useSkill(s, 'repair');
    assert.equal(s.tower.hp, 700);
  });
});

describe('골드 러시', () => {
  function killWeak(s: ReturnType<typeof quietGame>): number {
    const e = placeAt(s, 60, 0);
    e.hp = 1;
    e.bounty = 10;
    const gold = s.gold;
    step(s, 0.01);
    return s.gold - gold;
  }

  test('10초 동안 처치 현상금이 2배, 그 뒤 원래대로', () => {
    const s = quietGame();
    giveSkills(s, [['gold_rush', false]]);
    applyItem(s, findItem('sling'));
    useSkill(s, 'gold_rush');
    assert.equal(killWeak(s), 20);
    step(s, 11);
    assert.equal(killWeak(s), 10);
  });

  test('진화(황금 시대): 15초 동안 3배', () => {
    const s = quietGame();
    giveSkills(s, [['gold_rush', true]]);
    applyItem(s, findItem('sling'));
    useSkill(s, 'gold_rush');
    assert.equal(s.goldRushLeft, 15);
    assert.equal(killWeak(s), 30);
  });
});

describe('천둥', () => {
  test('체력이 가장 많은 적 5마리에게 메테오 피해의 1.2배, 나머지는 멀쩡', () => {
    const s = quietGame();
    giveSkills(s, [['thunder', false]]);
    const es = [1, 2, 3, 4, 5, 6].map((k) => placeAt(s, 60 + k * 20, 0, dummyDef({ hp: 1000 + k })));
    useSkill(s, 'thunder');
    const dmg = meteorDamage(s) * SKILL.thunderMul;
    assert.equal(es[0].hp, 1001, '가장 약한 하나는 안 맞는다');
    for (const e of es.slice(1)) assert.ok(Math.abs(e.maxHp - e.hp - dmg) < 1e-6);
  });

  test('진화(뇌신): 10마리', () => {
    const s = quietGame();
    giveSkills(s, [['thunder', true]]);
    const es = Array.from({ length: 12 }, (_, k) => placeAt(s, 60 + k * 10, 0, dummyDef({ hp: 1000 + k })));
    useSkill(s, 'thunder');
    assert.equal(es.filter((e) => e.hp < e.maxHp).length, 10);
  });

  test('적이 없으면 쓰지 않는다', () => {
    const s = quietGame();
    giveSkills(s, [['thunder', false]]);
    assert.equal(useSkill(s, 'thunder'), false);
  });
});

describe('돌풍', () => {
  test('모든 적을 탑에서 70 밀어내고 약한 피해를 준다', () => {
    const s = quietGame();
    giveSkills(s, [['gust', false]]);
    const e = placeAt(s, 40, 0, dummyDef({ hp: 1000 }));
    useSkill(s, 'gust');
    assert.ok(Math.abs(distToTower(s, e) - 110) < 1e-6);
    assert.ok(Math.abs(1000 - e.hp - meteorDamage(s) * SKILL.gustMul) < 1e-6);
  });

  test('화면 밖으로는 밀려나지 않는다', () => {
    const s = quietGame();
    giveSkills(s, [['gust', true]]);
    const e = placeAt(s, 300, 0);
    useSkill(s, 'gust');
    assert.ok(e.x <= s.config.width && e.x >= 0);
  });
});

describe('합체 스킬 효과', () => {
  test('혜성: 반경 70 에 메테오의 1.5배 피해를 주고 맞은 적을 4초 얼린다', () => {
    const s = quietGame();
    giveSkills(s, [['comet', false]]);
    const e = placeAt(s, 150, 0, dummyDef({ hp: 1000 }));
    const edge = placeAt(s, 150, 65, dummyDef({ hp: 1000 }));
    useSkill(s, 'comet', { x: e.x, y: e.y });
    assert.equal(e.hp, 1000 - 150 * 1.5);
    assert.ok(edge.hp < 1000);
    assert.equal(e.slowFactor, 0);
    assert.equal(e.slowTimeLeft, 4);
  });

  test('황금 운석: 메테오 1.5배 피해 + 골드 러시', () => {
    const s = quietGame();
    giveSkills(s, [['golden_meteor', false]]);
    const e = placeAt(s, 150, 0, dummyDef({ hp: 1000 }));
    useSkill(s, 'golden_meteor', { x: e.x, y: e.y });
    assert.equal(e.hp, 1000 - 225);
    assert.equal(s.goldRushLeft, SKILL.goldRushSeconds);
  });

  test('얼음 성벽: 모두 얼리고 35% 회복, 6초 동안 받는 피해 70% 감소', () => {
    const s = quietGame();
    giveSkills(s, [['ice_wall', false]]);
    s.tower.hp = 100;
    placeAt(s, 150, 0);
    useSkill(s, 'ice_wall');
    assert.equal(s.tower.hp, 450);
    assert.equal(s.enemies[0].slowFactor, 0);
    s.enemies[0].slowTimeLeft = 0;
    const hitter = placeAt(s, 21, 0, dummyDef({ atk: 100 }));
    step(s, 0.01);
    assert.ok(Math.abs(450 - s.tower.hp - 30) < 1e-6, `${450 - s.tower.hp}`);
    assert.equal(hitter.def.atk, 100);
  });

  test('연금술: 35% 회복 + 골드 (100 + 라운드 × 30)', () => {
    const s = quietGame();
    giveSkills(s, [['alchemy', false]]);
    s.round = 4;
    s.tower.hp = 100;
    const gold = s.gold;
    useSkill(s, 'alchemy');
    assert.equal(s.tower.hp, 450);
    assert.equal(s.gold, gold + 100 + 4 * 30);
  });

  test('천벌: 가장 튼튼한 8마리에게 메테오 2배 피해', () => {
    const s = quietGame();
    giveSkills(s, [['judgement', false]]);
    const es = Array.from({ length: 9 }, (_, k) => placeAt(s, 60 + k * 10, 0, dummyDef({ hp: 1000 + k })));
    useSkill(s, 'judgement');
    assert.equal(es.filter((e) => e.hp < e.maxHp).length, 8);
    assert.equal(es[8].maxHp - es[8].hp, 300);
  });

  test('폭풍: 90 밀어내고 6마리에게 천둥', () => {
    const s = quietGame();
    giveSkills(s, [['tempest', false]]);
    const es = Array.from({ length: 7 }, (_, k) => placeAt(s, 30, k * 3 - 9, dummyDef({ hp: 1000 + k })));
    useSkill(s, 'tempest');
    assert.equal(es.filter((e) => e.hp < e.maxHp).length, 7, '밀쳐내기 피해는 모두');
    assert.ok(distToTower(s, es[0]) > 110);
  });

  test('설풍: 80 밀어내고 4초 얼린다', () => {
    const s = quietGame();
    giveSkills(s, [['frost_gale', false]]);
    const e = placeAt(s, 40, 0);
    useSkill(s, 'frost_gale');
    assert.ok(Math.abs(distToTower(s, e) - 120) < 1e-6);
    assert.equal(e.slowTimeLeft, 4);
  });

  test('합체 스킬 힘(power)만큼 피해가 커진다', () => {
    const s = quietGame();
    giveSkills(s, [['comet', false]]);
    s.skills[0].power = 1.3;
    const e = placeAt(s, 150, 0, dummyDef({ hp: 1000 }));
    useSkill(s, 'comet', { x: e.x, y: e.y });
    assert.ok(Math.abs(1000 - e.hp - 150 * 1.5 * 1.3) < 1e-6);
  });
});

describe('연속 콤보', () => {
  test('콤보는 5가지: 얼음→불 빙쇄, 불→바람, 번개→얼음, 바람→번개, 치유→금', () => {
    assert.deepEqual(
      COMBOS.map((c) => `${c.from}>${c.to}`),
      ['ice>fire', 'fire>wind', 'storm>ice', 'wind>storm', 'heal>gold'],
    );
  });

  test('눈보라를 쓰고 4초 안에 메테오를 쓰면 빙쇄: 얼어 있는 모든 적이 메테오 피해를 한 번 더 받는다', () => {
    const s = quietGame();
    giveSkills(s, [['meteor', false], ['blizzard', false]]);
    const far = placeAt(s, -150, 0, dummyDef({ hp: 1000 }));
    const near = placeAt(s, 150, 0, dummyDef({ hp: 1000 }));
    useSkill(s, 'blizzard');
    step(s, 1);
    useSkill(s, 'meteor', { x: near.x, y: near.y });
    assert.equal(far.hp, 850, '멀리 있어도 얼어 있으면 부서진다');
    assert.equal(near.hp, 700, '운석 + 빙쇄');
    assert.ok(s.events.some((ev) => ev.kind === 'combo' && ev.id === 'shatter'));
  });

  test('4초가 지나면 콤보가 되지 않는다', () => {
    const s = quietGame();
    giveSkills(s, [['meteor', false], ['blizzard', false]]);
    const near = placeAt(s, 150, 0, dummyDef({ hp: 1000 }));
    useSkill(s, 'blizzard');
    step(s, 4.1);
    near.slowFactor = 0;
    near.slowTimeLeft = 1;
    useSkill(s, 'meteor', { x: near.x, y: near.y });
    assert.equal(near.hp, 850);
    assert.equal(s.events.some((ev) => ev.kind === 'combo'), false);
  });

  test('순서가 반대(불→얼음)면 빙쇄가 아니다', () => {
    const s = quietGame();
    giveSkills(s, [['meteor', false], ['blizzard', false]]);
    const near = placeAt(s, 150, 0, dummyDef({ hp: 1000 }));
    useSkill(s, 'meteor', { x: near.x, y: near.y });
    useSkill(s, 'blizzard');
    assert.equal(near.hp, 850);
    assert.equal(s.events.some((ev) => ev.kind === 'combo' && ev.id === 'shatter'), false);
  });

  test('긴급 수리 → 골드 러시: 보수 공사비 골드 (50 + 라운드 × 20)', () => {
    const s = quietGame();
    giveSkills(s, [['repair', false], ['gold_rush', false]]);
    s.round = 5;
    useSkill(s, 'repair');
    const gold = s.gold;
    useSkill(s, 'gold_rush');
    assert.equal(s.gold, gold + 50 + 5 * 20);
  });

  test('메테오 → 돌풍: 불바람 (모든 적에게 메테오의 0.6배)', () => {
    const s = quietGame();
    giveSkills(s, [['meteor', false], ['gust', false]]);
    const e = placeAt(s, -200, 0, dummyDef({ hp: 1000 }));
    useSkill(s, 'meteor', { x: 250, y: 0 });
    useSkill(s, 'gust');
    const expected = meteorDamage(s) * SKILL.gustMul + meteorDamage(s) * 0.6;
    assert.ok(Math.abs(1000 - e.hp - expected) < 1e-6);
  });

  test('합체 스킬은 두 속성을 모두 이어 받는다 (혜성=불+얼음 → 돌풍 은 불→바람 콤보)', () => {
    const s = quietGame();
    giveSkills(s, [['comet', false], ['gust', false]]);
    placeAt(s, 150, 0, dummyDef({ hp: 1e6 }));
    useSkill(s, 'comet', { x: s.tower.x + 150, y: s.tower.y });
    useSkill(s, 'gust');
    assert.ok(s.events.some((ev) => ev.kind === 'combo' && ev.id === 'firewind'));
  });

  test('콤보 수는 판 기록에 남는다', () => {
    const s = quietGame();
    giveSkills(s, [['repair', false], ['gold_rush', false]]);
    useSkill(s, 'repair');
    useSkill(s, 'gold_rush');
    assert.equal(s.stats.combos, 1);
  });
});

describe('스킬 공통', () => {
  test('주문 숙련 특전이 있으면 재사용 시간 -30%', () => {
    const s = quietGame();
    s.choice = ['skill_master', 'lucky', 'sharpen'];
    choosePerk(s, 0);
    useSkill(s, 'meteor', { x: 1, y: 1 });
    assert.ok(Math.abs(skillCooldownLeft(s, 'meteor') - meteor.cooldown * 0.7) < 1e-9);
  });

  test('보상 카드를 고르는 중이나 게임이 끝나면 쓸 수 없다', () => {
    const s = quietGame();
    s.choice = ['lucky', 'sharpen', 'interest'];
    assert.equal(useSkill(s, 'meteor', { x: 1, y: 1 }), false);
    s.choice = null;
    s.status = 'lost';
    assert.equal(useSkill(s, 'meteor', { x: 1, y: 1 }), false);
  });

  test('보스에게도 천둥이 떨어진다', () => {
    const s = quietGame();
    giveSkills(s, [['thunder', false]]);
    const boss = spawnEnemy(s, { ...dummyDef({ hp: 50000 }), boss: { pattern: 'summon', line: '' } }, s.tower.x + 100, s.tower.y);
    useSkill(s, 'thunder');
    assert.ok(boss.hp < boss.maxHp);
  });

  test('스킬 이벤트는 그 스킬이 준 피해(hit)보다 먼저 기록된다 (운석이 떨어진 뒤에 맞은 것처럼 보이게)', () => {
    const s = quietGame();
    const e = placeAt(s, 150, 0, dummyDef({ hp: 1000 }));
    useSkill(s, 'meteor', { x: e.x, y: e.y });
    const kinds = s.events.map((ev) => ev.kind);
    assert.ok(kinds.indexOf('skill') < kinds.indexOf('hit'), kinds.join(','));
  });

  test('실제 재사용 대기 = 기본 × 주문 숙련 × 탑·영구 강화 배율 (화면 표시와 실제가 같게)', () => {
    const s = quietGame();
    assert.equal(skillCooldownOf(s, 'meteor'), 30);
    s.skillCooldownMul = 0.75;
    s.choice = ['skill_master', 'lucky', 'sharpen'];
    choosePerk(s, 0);
    assert.ok(Math.abs(skillCooldownOf(s, 'meteor') - 30 * 0.7 * 0.75) < 1e-9);
    useSkill(s, 'meteor', { x: 1, y: 1 });
    assert.ok(Math.abs(skillCooldownLeft(s, 'meteor') - skillCooldownOf(s, 'meteor')) < 1e-9);
  });
});
