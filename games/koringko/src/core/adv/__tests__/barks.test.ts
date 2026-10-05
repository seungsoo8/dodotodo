/**
 * 실패 대사 돌려 쓰기: 같은 실패를 거듭해도 같은 한 줄이 되풀이되지 않고, 두 번째부터는 다른 동료가 한마디 거든다.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { FAILS, failCmds, type Fail } from '../barks.ts';
import { Adv, NO_INPUT, type AdvData } from '../adv.ts';
import { Builder } from '../../maps.ts';
import { px } from '../stage.ts';
import type { HeroId } from '../../types.ts';
import type { Cmd, RoomDef, Thing } from '../types.ts';

const ALL: HeroId[] = ['toby', 'bori', 'ruru', 'nabi'];
const says = (cmds: Cmd[]) => cmds.flatMap((c) => (c.t === 'say' ? [{ who: c.who, text: c.text }] : []));

describe('실패 대사 (순수 함수)', () => {
  test('상황마다 대사가 넷 이상이고, 한 바퀴 도는 동안 같은 줄이 다시 나오지 않는다', () => {
    for (const k of Object.keys(FAILS) as Fail[]) {
      const n = FAILS[k].lines.length;
      assert.ok(n >= 4, `${k}: ${n}줄`);
      const first = Array.from({ length: n }, (_, i) => says(failCmds(k, i, ALL))[0].text);
      assert.equal(new Set(first).size, n, `${k}: 겹친다 ${first.join(' / ')}`);
      // 한 바퀴 돌면 처음 줄로 (끝 없이 돈다)
      assert.equal(says(failCmds(k, n, ALL))[0].text, first[0]);
    }
  });

  test('처음 실패는 원래 한 줄 그대로 (막힘 · 틈 · 태엽 · 보리 없음)', () => {
    assert.deepEqual(says(failCmds('blocked', 0, ALL)), [{ who: 'bori', text: '으라차… 저쪽은 막혀서 안 밀려.' }]);
    assert.deepEqual(says(failCmds('gap', 0, ALL)), [{ who: 'toby', text: '건너기엔 너무 멀어. 밧줄이 있으면 좋을 텐데…' }]);
    assert.deepEqual(says(failCmds('gapCall', 0, ALL)), [{ who: 'toby', text: '건너기엔 너무 멀어. 루루를 불러 와야겠어. 루루 밧줄이면 건널 수 있어.' }]);
    assert.deepEqual(says(failCmds('wind', 0, ALL)), [{ who: 'toby', text: '태엽이 모자라… 지금은 나눠 줄 수가 없어.' }]);
    assert.deepEqual(says(failCmds('noBori', 0, ALL)), [{ who: 'toby', text: '끙… 꿈쩍도 안 해. 힘센 보리라면 밀 수 있을 텐데.' }]);
    assert.deepEqual(says(failCmds('noBoriCall', 0, ALL)), [{ who: 'toby', text: '끙… 꿈쩍도 안 해. 보리를 불러 와야겠어.' }]);
  });

  test('두 번째 실패부터는 다른 동료가 거든다: 루루가 놀리고 → 보리가 다독이고 → 나비가 짚어 준다 (말한 이는 빼고)', () => {
    const who = (n: number, k: Fail = 'wind', party = ALL) => says(failCmds(k, n, party)).slice(1).map((s) => s.who);
    assert.deepEqual(who(0), [], '처음엔 혼자');
    assert.deepEqual(who(1), ['ruru']);
    assert.deepEqual(who(2), ['bori']);
    assert.deepEqual(who(3), ['nabi']);
    assert.deepEqual(who(4), ['ruru']);
    // 막힘은 보리가 말하므로 보리 차례는 건너뛴다
    assert.deepEqual(who(2, 'blocked'), ['nabi']);
    assert.ok(!says(failCmds('blocked', 2, ALL)).slice(1).some((s) => s.who === 'bori'));
  });

  test('무리에 없는 동료는 거들지 않고, 혼자면 한 줄뿐이다', () => {
    for (let n = 0; n < 8; n++) {
      const s = says(failCmds('gap', n, ['toby', 'bori']));
      assert.ok(s.every((x) => x.who === 'toby' || x.who === 'bori'), JSON.stringify(s));
      assert.equal(says(failCmds('wind', n, ['toby'])).length, 1);
    }
  });

  test('같은 동료가 거들 때도 늘 같은 말은 아니다 (차례로 돈다)', () => {
    const ruru = [1, 4, 7].map((n) => says(failCmds('wind', n, ALL))[1].text);
    assert.equal(new Set(ruru).size, 3, ruru.join(' / '));
  });
});

describe('실패 대사 (놀이 속)', () => {
  function data(things: Thing[], party: HeroId[] = ALL): AdvData {
    const b = new Builder(12, 8, 'w', 1);
    b.rect(0, 0, 12, 1, 'Q');
    b.rect(0, 7, 12, 1, 'Q');
    b.rect(0, 0, 1, 8, 'Q');
    b.rect(11, 0, 1, 8, 'Q');
    const room: RoomDef = { id: 'r', name: 'r', theme: 'toybox', w: 12, h: 8, tiles: b.rows(), structures: [], warps: [], npcs: [], spawns: [], start: { x: 5, y: 4 }, safe: true, dark: false, level: '', scale: 'toy', things };
    return { rooms: { r: () => room }, chapters: [{ n: 1, title: '1장', sub: '', room: 'r', start: [5, 4], party, wind: 0.05, intro: [] }] };
  }
  const lines = (a: Adv): string[] => {
    const out: string[] = [];
    for (let i = 0; i < 2000 && a.runner; i++) {
      const d = a.stage.dialog;
      if (d && out.at(-1) !== d.text) out.push(d.text);
      a.step(1 / 60, { ...NO_INPUT, act: i % 2 === 0 });
    }
    return out;
  };

  test('벽에 붙은 물건을 벽 쪽으로 거듭 밀면 보리의 대사가 매번 다르다', () => {
    const a = new Adv(data([{ kind: 'push', id: 'b', at: [10, 4], look: 'box' }]));
    lines(a);
    a.call('bori', true);
    const heard: string[] = [];
    for (let i = 0; i < 4; i++) {
      a.place(px(9), px(4));
      a.face('right');
      a.step(1 / 60, NO_INPUT);
      assert.equal(a.prompt?.id, 'b');
      a.step(1 / 60, { ...NO_INPUT, act: true });
      heard.push(lines(a)[0]);
    }
    assert.deepEqual(a.blockAt('b'), [10, 4], '벽 쪽으로는 안 밀린다');
    assert.equal(new Set(heard).size, 4, heard.join(' / '));
  });

  test('태엽이 모자란데 거듭 나눠 주려 하면, 두 번째에는 다른 동료가 거든다', () => {
    const a = new Adv(data([{ kind: 'windup', id: 'w', at: [7, 4], cost: 0.5, scene: [] }]));
    lines(a);
    const tries: string[][] = [];
    for (let i = 0; i < 2; i++) {
      a.place(px(6), px(4));
      a.face('right');
      a.step(1 / 60, NO_INPUT);
      a.step(1 / 60, { ...NO_INPUT, act: true });
      tries.push(lines(a));
    }
    assert.equal(tries[0].length, 1, tries[0].join(' / '));
    assert.ok(tries[1].length >= 2, tries[1].join(' / '));
    assert.notEqual(tries[1][0], tries[0][0]);
    assert.equal(a.save.wind, 0.05, '모자라면 덜지 않는다');
  });
});
