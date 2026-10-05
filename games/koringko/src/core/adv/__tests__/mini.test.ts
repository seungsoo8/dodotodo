import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { ASSIST, BREATH, CandlesMini, FLIP_LEVELS, FlipMini, FOLDS, makeMini, MINI_IDS, ORDER_LEVELS, OrderMini, PHOTO_LEVELS, PhotoMini, PUPPET_CUES, PUPPETS, PuppetMini, puzzleId, PUZZLE_KINDS, PUZZLE_REST, SEW, SewMini, solveFlip, solveThread, StarsMini, THREAD_LEVELS, ThreadMini, WIND, WindMini, type MemoryPuzzle, type MiniDir, type MiniInput } from "../mini.ts";

const NONE: MiniInput = { act: false, hold: false, dir: null };
const tick = (m: { step(dt: number, i: MiniInput): void }, secs: number, inp: MiniInput = NONE) => {
  for (let t = 0; t < secs; t += 1 / 60) m.step(1 / 60, inp);
};

describe('종이별 접기', () => {
  test('할머니 손을 따라 맞는 방향을 누르면 한 번 접히고, 다섯 번이면 별 하나', () => {
    const m = new StarsMini();
    for (const d of FOLDS[0]) m.step(1 / 60, { ...NONE, dir: d });
    assert.equal(m.star, 1);
    assert.equal(m.fold, 0);
    assert.ok(m.sfx.includes('star'));
  });

  test('틀린 방향은 접히지 않고 흔들릴 뿐 (실패해서 끝나지 않는다)', () => {
    const m = new StarsMini();
    const wrong: MiniDir = FOLDS[0][0] === 'up' ? 'down' : 'up';
    for (let i = 0; i < 20; i++) m.step(1 / 60, { ...NONE, dir: wrong });
    assert.equal(m.fold, 0);
    assert.ok(m.wrong > 0);
    assert.equal(m.done, false);
  });

  test('별 셋을 다 접으면 끝 (마지막 별 뒤 잠깐 쉬고)', () => {
    const m = new StarsMini();
    for (const seq of FOLDS) {
      for (const d of seq) m.step(1 / 60, { ...NONE, dir: d });
      tick(m, 1.3);
    }
    assert.equal(m.done, true);
  });

  test('쉬는 동안 누른 방향은 무시된다', () => {
    const m = new StarsMini();
    for (const d of FOLDS[0]) m.step(1 / 60, { ...NONE, dir: d });
    m.step(1 / 60, { ...NONE, dir: FOLDS[1][0] });
    assert.equal(m.fold, 0);
  });
});

describe('천 번째 별', () => {
  test('별 하나만 접으면 끝', () => {
    const m = makeMini('star1000') as StarsMini;
    for (const d of FOLDS[0]) m.step(1 / 60, { ...NONE, dir: d });
    tick(m, 1.3);
    assert.equal(m.done, true);
    assert.equal(m.star, 1);
  });
});

describe('촛불 끄기', () => {
  const blow = (m: CandlesMini, secs: number) => {
    tick(m, secs, { ...NONE, hold: true });
    m.step(1 / 60, NONE);
  };
  test('알맞게 들이쉬고 놓으면 셋, 조금이면 하나, 너무 짧으면 그대로', () => {
    const mid = (BREATH.zone[0] + BREATH.zone[1]) / 2 / BREATH.rise;
    const m = new CandlesMini();
    blow(m, mid);
    assert.equal(m.lit, BREATH.candles - 3);
    blow(m, 0.4 / BREATH.rise);
    assert.equal(m.lit, BREATH.candles - 4);
    blow(m, 0.1);
    assert.equal(m.lit, BREATH.candles - 4);
  });

  test('너무 오래 들이쉬면 콜록 (그동안 못 분다), 촛불이 다 꺼지면 끝', () => {
    const m = new CandlesMini();
    tick(m, 1 / BREATH.rise + 0.1, { ...NONE, hold: true });
    assert.ok(m.cough > 0);
    assert.ok(m.sfx.includes('cough'));
    assert.equal(m.lit, BREATH.candles);
    tick(m, 1.1);
    const mid = (BREATH.zone[0] + BREATH.zone[1]) / 2 / BREATH.rise;
    for (let i = 0; i < 3; i++) blow(m, mid);
    assert.equal(m.lit, 0);
    assert.equal(m.done, true);
  });
});

describe('바느질', () => {
  test('바늘이 표시 위에 있을 때 누르면 한 땀, 아니면 빗나감', () => {
    const m = new SewMini();
    m.t = m.mark;
    m.step(0, { ...NONE, act: true });
    assert.equal(m.stitches, 1);
    m.t = Math.min(1, m.mark + SEW.zone + 0.2);
    m.step(0, { ...NONE, act: true });
    assert.equal(m.stitches, 1);
    assert.ok(m.miss > 0);
  });

  test('바늘은 0~1 사이를 오간다, 여섯 땀이면 끝', () => {
    const m = new SewMini();
    for (let i = 0; i < 600; i++) {
      m.step(1 / 60, NONE);
      assert.ok(m.t >= 0 && m.t <= 1);
    }
    for (let i = 0; i < SEW.stitches; i++) {
      m.t = m.mark;
      m.step(0, { ...NONE, act: true });
    }
    assert.equal(m.done, true);
  });
});

describe('인형극', () => {
  test('줄마다 맞는 인형을 고르면 다음 줄, 틀리면 하루가 웃는 말', () => {
    const m = new PuppetMini();
    const wrong = PUPPETS.findIndex((p) => p !== PUPPET_CUES[0].answer);
    while (m.sel !== wrong) m.step(1 / 60, { ...NONE, dir: 'right' });
    m.step(1 / 60, { ...NONE, act: true });
    assert.equal(m.silly, PUPPET_CUES[0].silly);
    assert.equal(m.cue, 0);
    for (const c of PUPPET_CUES) {
      const want = PUPPETS.indexOf(c.answer);
      while (m.sel !== want) m.step(1 / 60, { ...NONE, dir: 'left' });
      m.step(1 / 60, { ...NONE, act: true });
      tick(m, 1.5);
    }
    assert.equal(m.done, true);
  });

  test('고르기는 양 끝에서 돌아간다', () => {
    const m = new PuppetMini();
    m.step(1 / 60, { ...NONE, dir: 'left' });
    assert.equal(m.sel, PUPPETS.length - 1);
    m.step(1 / 60, { ...NONE, dir: 'right' });
    assert.equal(m.sel, 0);
  });
});

describe('태엽 감기', () => {
  test('누를 때마다 감기고, 쉬면 조금씩 풀린다. 끝까지 감으면 끝', () => {
    const m = new WindMini();
    m.step(1 / 60, { ...NONE, act: true });
    assert.equal(m.v, WIND.per);
    tick(m, 0.5);
    assert.ok(m.v < WIND.per && m.v > 0);
    for (let i = 0; i < 40 && !m.done; i++) m.step(1 / 60, { ...NONE, act: true });
    assert.equal(m.done, true);
    assert.equal(m.v, 1);
  });
});


describe('놀이 목록', () => {
  test('이름으로 만들 수 있고, 없는 이름은 오류', () => {
    const PUZ = /^(flip|order|thread|photo)\d+$/;
    assert.deepEqual([...MINI_IDS].filter((i) => !PUZ.test(i)).sort(), ['candles', 'puppet', 'sew', 'star1000', 'stars', 'wind']);
    for (const id of MINI_IDS) assert.equal(makeMini(id).id, id);
    assert.throws(() => makeMini('nope'));
    assert.throws(() => makeMini('flip99'));
    assert.throws(() => makeMini('memento1'), '옛 이름은 더 없다');
  });

  test('기억 맞추기는 네 가지 놀이 × 다섯 단계 (flip1 … photo5)', () => {
    assert.deepEqual([...PUZZLE_KINDS], ['flip', 'order', 'thread', 'photo']);
    for (const k of PUZZLE_KINDS)
      for (let lv = 1; lv <= 5; lv++) {
        const id = puzzleId(k, lv);
        assert.equal(id, `${k}${lv}`);
        const m = makeMini(id) as MemoryPuzzle;
        assert.equal(m.kind, k);
        assert.equal(m.level, lv);
        assert.equal(m.isSolved(), false, `${id} 은 처음에 흐트러져 있다`);
      }
  });
});

// ───────── 기억 맞추기 공통 도우미
const press = (m: MemoryPuzzle, inp: Partial<MiniInput>) => m.step(1 / 60, { ...NONE, ...inp });
const finish = (m: MemoryPuzzle) => {
  tick(m, PUZZLE_REST + 0.1);
  return m.done;
};

describe('난이도 곡선: 같은 놀이는 단계가 오를수록 크고 길어진다', () => {
  for (const k of PUZZLE_KINDS) {
    test(`${k}: 판 크기와 최소 수가 줄지 않고, 마지막 단계가 첫 단계보다 크다`, () => {
      const all = [1, 2, 3, 4, 5].map((lv) => makeMini(puzzleId(k, lv)) as MemoryPuzzle);
      for (let i = 1; i < all.length; i++) {
        assert.ok(all[i - 1].size <= all[i].size, `${k}${i} 크기 ${all[i - 1].size} <= ${k}${i + 1} ${all[i].size}`);
        assert.ok(all[i - 1].least <= all[i].least, `${k}${i} 최소 ${all[i - 1].least} <= ${k}${i + 1} ${all[i].least}`);
      }
      assert.ok(all[0].size < all[4].size);
      assert.ok(all[0].least < all[4].least);
    });
  }
  test('단계 표의 수와 놀이 이름의 수가 같다 (각 다섯)', () => {
    assert.equal(FLIP_LEVELS.length, 5);
    assert.equal(ORDER_LEVELS.length, 5);
    assert.equal(THREAD_LEVELS.length, 5);
    assert.equal(PHOTO_LEVELS.length, 5);
  });
});

describe('(a) 뒤집기: 줄 · 칸을 뒤집어 그림 맞추기', () => {
  test('3×3 판: 같은 줄 · 칸을 다시 뒤집으면 풀리고, 잠깐 보여 준 뒤 끝', () => {
    const m = new FlipMini(3, [['row', 1], ['col', 2]]);
    assert.equal(m.grid.length, 9);
    assert.equal(m.grid.filter((v) => !v).length, 4, '줄 하나 + 칸 하나 = 겹친 한 칸은 제자리');
    m.flip('row', 1);
    m.flip('col', 2);
    assert.ok(m.isSolved());
    press(m, {});
    assert.equal(m.done, false, '다 맞춘 그림을 잠깐 보여 준다');
    assert.ok(finish(m));
    assert.equal(m.skipped, false);
  });

  test('고르는 자리: 방향키로 줄(왼쪽) · 칸(위쪽)을 돌고, 판 크기 밖으로 나가지 않는다', () => {
    const m = new FlipMini(3, [['row', 0]]);
    for (let i = 0; i < 5; i++) press(m, { dir: 'down' });
    assert.deepEqual(m.cursor, { kind: 'row', i: 2 });
    press(m, { dir: 'right' });
    for (let i = 0; i < 5; i++) press(m, { dir: 'right' });
    assert.deepEqual(m.cursor, { kind: 'col', i: 2 });
    const before = [...m.grid];
    press(m, { act: true });
    for (let y = 0; y < 3; y++) assert.equal(m.grid[y * 3 + 2], !before[y * 3 + 2]);
    assert.equal(m.moves, 1);
  });

  test('최소 수는 모든 조합을 다 해 본 가장 짧은 풀이와 같다 (3×3 · 4×4 · 5×5)', () => {
    const shortest = (g: boolean[], n: number): number => {
      let best = Infinity;
      for (let mask = 0; mask < 1 << (2 * n); mask++) {
        const t = [...g];
        for (let b = 0; b < 2 * n; b++) {
          if (!(mask & (1 << b))) continue;
          for (let j = 0; j < n; j++) {
            const k = b < n ? b * n + j : j * n + (b - n);
            t[k] = !t[k];
          }
        }
        if (t.every((v) => v)) best = Math.min(best, popcount(mask));
      }
      return best;
    };
    const popcount = (x: number): number => (x ? (x & 1) + popcount(x >> 1) : 0);
    for (let lv = 1; lv <= 5; lv++) {
      const m = makeMini(`flip${lv}`) as FlipMini;
      assert.equal(m.least, shortest(m.grid, m.n), `flip${lv}`);
      assert.equal(solveFlip(m.grid, m.n)!.length, m.least);
    }
    // 네 줄 모두 = 네 칸 모두, 같은 줄 두 번 = 제자리
    assert.equal(new FlipMini(4, [['row', 0], ['row', 1], ['row', 2], ['row', 3], ['col', 0]]).least, 3);
    assert.equal(new FlipMini(4, [['row', 1], ['col', 2], ['row', 1]]).least, 1);
  });

  test('줄 · 칸 뒤집기로 만들 수 없는 판은 풀이가 없다 (null)', () => {
    const g = new Array(9).fill(true);
    g[0] = false;
    assert.equal(solveFlip(g, 3), null);
  });

  test('틀린 수: 풀이에서 멀어지는 뒤집기는 실패로 센다, 가까워지면 세지 않는다', () => {
    const m = new FlipMini(4, [['row', 1]]);
    m.flip('col', 0);
    assert.equal(m.fails, 1);
    assert.ok(m.wrong > 0);
    assert.ok(m.sfx.includes('miss'));
    m.flip('col', 0);
    assert.equal(m.fails, 1, '되돌리는 수는 가까워지는 수');
    m.flip('row', 1);
    assert.ok(m.isSolved());
    assert.equal(m.fails, 1);
  });

  test('되돌리기: 처음 모습으로 (몇 번이든 다시 할 수 있다)', () => {
    const m = new FlipMini(4, [['row', 2], ['col', 0], ['row', 3]]);
    const start = [...m.grid];
    m.flip('col', 3);
    m.reset();
    assert.deepEqual(m.grid, start);
    assert.equal(m.moves, 0);
  });

  test('힌트: 실패가 쌓이면 가장 짧은 풀이의 한 수를 알려 주고, 그대로 따르면 풀린다', () => {
    // 5×5 에서 최소 2 수: 멀어지는 수가 넉넉하다 (최소가 n 이면 어느 수든 가까워진다)
    const m = new FlipMini(5, [['row', 1], ['col', 2]]);
    assert.equal(m.hinting, false);
    /** 뒤집으면 남은 최소 수가 늘어나는 줄 · 칸 하나 (판은 건드리지 않고 셈) */
    const worse = (): [('row' | 'col'), number] => {
      const now = solveFlip(m.grid, m.n)!.length;
      for (const k of ['row', 'col'] as const)
        for (let i = 0; i < m.n; i++) {
          const g = [...m.grid];
          for (let j = 0; j < m.n; j++) {
            const c = k === 'row' ? i * m.n + j : j * m.n + i;
            g[c] = !g[c];
          }
          if (solveFlip(g, m.n)!.length > now) return [k, i];
        }
      throw new Error('멀어지는 수가 없다');
    };
    const bad = (): void => {
      const [k, i] = worse();
      m.flip(k, i);
    };
    for (let i = 0; i < ASSIST.hint; i++) bad();
    assert.equal(m.fails, ASSIST.hint);
    assert.equal(m.hinting, true);
    for (let guard = 0; guard < 20 && !m.isSolved(); guard++) {
      const h = m.hint()!;
      m.flip(h[0], h[1]);
    }
    assert.ok(m.isSolved());
    assert.equal(m.hint(), null, '다 맞추면 힌트도 없다');
  });
});

describe('(b) 순서 놓기: 흐릿한 기억부터 또렷한 기억까지 차례로', () => {
  test('가장 이른 장면을 고르면 놓이고, 다 놓으면 끝', () => {
    const m = new OrderMini([2, 0, 1]);
    assert.equal(m.placed, 0);
    m.pick(1);
    assert.equal(m.placed, 1);
    m.pick(2);
    m.pick(0);
    assert.equal(m.placed, 3);
    assert.ok(m.isSolved());
    assert.equal(m.fails, 0);
    assert.ok(finish(m));
  });

  test('틀린 장면을 고르면 놓이지 않고 실패로 센다, 이미 놓은 장면은 다시 골라도 아무 일 없다', () => {
    const m = new OrderMini([1, 0, 2]);
    m.pick(0);
    assert.equal(m.placed, 0);
    assert.equal(m.fails, 1);
    assert.ok(m.sfx.includes('miss'));
    m.pick(1);
    assert.equal(m.placed, 1);
    m.pick(1);
    assert.equal(m.placed, 1);
    assert.equal(m.fails, 1, '놓인 장면은 실패로 세지 않는다');
  });

  test('방향키는 아직 놓지 않은 장면만 건너다니고, 확인으로 고른다', () => {
    const m = new OrderMini([1, 0, 2]);
    assert.equal(m.sel, 0);
    press(m, { dir: 'right' });
    assert.equal(m.sel, 1);
    press(m, { act: true });
    assert.equal(m.placed, 1);
    // 놓인 1번 칸을 건너뛰어 0번 → 2번
    press(m, { dir: 'left' });
    assert.equal(m.sel, 0);
    press(m, { dir: 'right' });
    assert.equal(m.sel, 2, '놓인 장면은 건너뛴다');
    press(m, { dir: 'right' });
    assert.equal(m.sel, 2, '끝에서 멈춘다');
  });

  test('카드는 0…n-1 을 한 번씩 담고, 단계마다 풀 수 있다', () => {
    for (let lv = 1; lv <= 5; lv++) {
      const m = makeMini(`order${lv}`) as OrderMini;
      assert.deepEqual([...m.cards].sort((a, b) => a - b), m.cards.map((_, i) => i));
      while (!m.isSolved()) m.pick(m.hint()!);
      assert.equal(m.fails, 0);
    }
    assert.throws(() => new OrderMini([0, 0, 1]), '같은 장면 두 장은 안 된다');
  });
});

describe('(c) 실 잇기: 모든 못을 한 번씩 지나는 한붓그리기', () => {
  const tiny = ['S.', '..'];
  test('방향으로 실을 늘이고, 모든 못을 지나면 끝', () => {
    const m = new ThreadMini(tiny);
    assert.deepEqual(m.path, [0]);
    press(m, { dir: 'right' });
    press(m, { dir: 'down' });
    press(m, { dir: 'left' });
    assert.deepEqual(m.path, [0, 1, 3, 2]);
    assert.ok(m.isSolved());
    assert.ok(finish(m));
  });

  test('벽 · 막힌 못 · 이미 지난 못으로는 못 간다 (상태 그대로, 실패도 아님)', () => {
    const m = new ThreadMini(['S#', '..']);
    m.move('up');
    m.move('left');
    m.move('right');
    assert.deepEqual(m.path, [0]);
    assert.equal(m.fails, 0);
    assert.ok(m.wrong > 0);
  });

  test('바로 앞 못으로 돌아가면 실을 감는다 (되돌리기), 누르기로 지난 못을 고르면 거기까지 감는다', () => {
    const m = new ThreadMini(['S..', '...', '...']);
    m.move('right');
    m.move('right');
    m.move('left');
    assert.deepEqual(m.path, [0, 1]);
    m.move('right');
    m.move('down');
    m.tap(1);
    assert.deepEqual(m.path, [0, 1]);
    m.tap(4);
    assert.deepEqual(m.path, [0, 1, 4], '머리 옆 못을 누르면 늘인다');
    m.tap(8);
    assert.deepEqual(m.path, [0, 1, 4], '떨어진 못은 누를 수 없다');
  });

  test('막다른 곳에 갇히면 실패로 세고, 잠깐 뒤 실이 처음 못으로 돌아간다', () => {
    const m = new ThreadMini(['S..', '...']);
    m.move('down');
    m.move('right');
    m.move('up');
    // 0 → 3 → 4 → 1: 남은 2 · 5 로 가려면 1 → 2 → 5 이니 갇히지 않음. 대신 4 에서 up 하지 말고:
    m.tap(4);
    m.move('right');
    m.move('up');
    m.move('left');
    assert.deepEqual(m.path, [0, 3, 4, 5, 2, 1]);
    assert.ok(m.isSolved(), '여기서는 풀린다');

    const d = new ThreadMini(['S..', '...', '...']);
    d.move('right');
    d.move('down');
    d.move('left');
    // 0 → 1 → 4 → 3: 이제 6 으로 내려가 7 · 8 · 5 · 2 로 갈 수 있으니 아직 아님
    assert.equal(d.fails, 0);
    d.move('down');
    d.move('right');
    d.move('up');
    // 0 1 4 3 6 7 4? 4 는 지났으니 안 간다
    assert.deepEqual(d.path, [0, 1, 4, 3, 6, 7]);
    d.move('right');
    d.move('up');
    d.move('up');
    assert.deepEqual(d.path, [0, 1, 4, 3, 6, 7, 8, 5, 2]);
    assert.ok(d.isSolved());

    const s = new ThreadMini(['S..', '...', '...']);
    s.move('down');
    s.move('right');
    s.move('up');
    s.move('right');
    // 0 → 3 → 4 → 1 → 2: 남은 5 · 6 · 7 · 8 은 2 → 5 → 8 → 7 → 6 으로 이어지니 아직 갇히지 않음
    assert.equal(s.fails, 0);
    s.move('down');
    s.move('down');
    s.move('left');
    s.move('left');
    assert.ok(s.isSolved());

    const t = new ThreadMini(['S..', '...', '...']);
    t.move('right');
    t.move('right');
    t.move('down');
    t.move('left');
    t.move('left');
    t.move('down');
    t.move('right');
    t.move('right');
    assert.ok(t.isSolved());

    const u = new ThreadMini(['S..', '...', '...']);
    u.move('right');
    u.move('down');
    u.move('right');
    u.move('up');
    // 0 → 1 → 4 → 5 → 2: 2 의 이웃 1 · 5 는 지났다 → 갇힘
    assert.equal(u.fails, 1);
    assert.ok(u.sfx.includes('miss'));
    u.move('left');
    assert.deepEqual(u.path, [0, 1, 4, 5, 2], '갇힌 동안은 입력을 받지 않는다');
    tick(u, 1);
    assert.deepEqual(u.path, [0], '처음 못으로 돌아간다');
  });

  test('단계마다 실제로 풀이가 있고, 그 풀이를 그대로 따라 하면 끝난다', () => {
    for (let lv = 1; lv <= 5; lv++) {
      const rows = THREAD_LEVELS[lv - 1];
      const sol = solveThread(rows);
      assert.ok(sol, `thread${lv} 풀이가 있다`);
      const m = makeMini(`thread${lv}`) as ThreadMini;
      assert.equal(sol!.length, m.openCount);
      for (const c of sol!.slice(1)) m.tap(c);
      assert.ok(m.isSolved(), `thread${lv}`);
      assert.equal(m.fails, 0);
    }
    assert.equal(solveThread(['S#.', '#..']), null, '이어지지 않은 못이 있으면 풀이가 없다');
    assert.throws(() => new ThreadMini(['...', '...']), '시작 못(S)이 없으면 오류');
  });

  test('힌트: 지금 실에서 이어지는 다음 못 (막다른 길이면 하나 되감기)', () => {
    const m = makeMini('thread3') as ThreadMini;
    for (let guard = 0; guard < 100 && !m.isSolved(); guard++) m.tap(m.hint()!);
    assert.ok(m.isSolved());
    assert.equal(m.fails, 0, '힌트만 따르면 갇히지 않는다');
    const w = new ThreadMini(['S..', '...', '...']);
    w.move('right');
    w.move('down');
    w.move('down');
    // 0 → 1 → 4 → 7: 왼쪽(3 · 6)과 오른쪽(2 · 5 · 8)이 갈려 풀이가 없다 (갇히지는 않았다) → 되감기를 권한다
    assert.equal(w.fails, 0);
    assert.equal(solveThread(['S..', '...', '...'], w.path), null);
    assert.equal(w.hint(), 4);
  });
});

describe('(d) 찢어진 사진: 조각을 돌려 바로 세우기', () => {
  test('누를 때마다 시계 방향으로 한 번, 모두 바로 서면 끝', () => {
    const m = new PhotoMini(2, [0, 3, 0, 2]);
    assert.equal(m.least, 1 + 2);
    m.turn(1);
    assert.equal(m.rot[1], 0);
    m.turn(3);
    m.turn(3);
    assert.ok(m.isSolved());
    assert.equal(m.fails, 0);
    assert.ok(finish(m));
  });

  test('이미 바로 선 조각을 돌리면 실패로 센다', () => {
    const m = new PhotoMini(2, [0, 1, 0, 0]);
    m.turn(0);
    assert.equal(m.fails, 1);
    assert.equal(m.rot[0], 1);
    assert.equal(m.isSolved(), false);
  });

  test('방향키로 조각 사이를 움직이고 (판 밖으로는 안 나감), 확인으로 돌린다', () => {
    const m = new PhotoMini(3, [0, 0, 0, 0, 0, 0, 0, 0, 1]);
    press(m, { dir: 'left' });
    press(m, { dir: 'up' });
    assert.deepEqual(m.cursor, { x: 0, y: 0 });
    for (let i = 0; i < 4; i++) press(m, { dir: 'right' });
    for (let i = 0; i < 4; i++) press(m, { dir: 'down' });
    assert.deepEqual(m.cursor, { x: 2, y: 2 });
    for (let i = 0; i < 3; i++) press(m, { act: true });
    assert.ok(m.isSolved());
  });

  test('단계마다 힌트를 따르면 최소 수 그대로 풀린다, 잘못된 판은 오류', () => {
    for (let lv = 1; lv <= 5; lv++) {
      const m = makeMini(`photo${lv}`) as PhotoMini;
      while (!m.isSolved()) m.turn(m.hint()!);
      assert.equal(m.moves, m.least, `photo${lv}`);
    }
    assert.throws(() => new PhotoMini(2, [0, 1, 2]), '조각 수가 맞지 않음');
    assert.throws(() => new PhotoMini(2, [0, 4, 0, 0]), '돌림은 0~3');
  });
});

describe('도움: 몇 번 틀리면 힌트, 더 틀리면 건너뛰기', () => {
  const failOnce = (m: OrderMini) => m.pick(m.cards.findIndex((v) => v !== m.placed && v > m.placed));

  test(`${ASSIST.hint}번 틀리면 힌트, ${ASSIST.skip}번 틀리면 건너뛸 수 있다 (그 전엔 건너뛰기가 듣지 않는다)`, () => {
    const m = new OrderMini([3, 2, 1, 0]);
    assert.ok(ASSIST.hint <= ASSIST.skip);
    for (let i = 0; i < ASSIST.skip - 1; i++) failOnce(m);
    assert.equal(m.canSkip, false);
    assert.equal(m.hinting, ASSIST.skip - 1 >= ASSIST.hint);
    m.skip();
    assert.equal(m.isSolved(), false, '아직 건너뛸 수 없다');
    failOnce(m);
    assert.equal(m.canSkip, true);
    m.skip();
    assert.ok(m.isSolved(), '건너뛰면 저절로 맞춰진다');
    assert.equal(m.skipped, true);
    assert.ok(finish(m));
  });

  test('건너뛸 수 있을 때 확인을 꾹 누르고 있으면 건너뛴다 (짧게 누르면 안 됨)', () => {
    const m = new ThreadMini(['S..', '...', '...']);
    for (let i = 0; i < ASSIST.skip; i++) {
      m.move('right');
      m.move('down');
      m.move('right');
      m.move('up');
      tick(m, 1);
    }
    assert.equal(m.fails, ASSIST.skip);
    tick(m, ASSIST.hold / 2, { ...NONE, hold: true });
    tick(m, 0.1);
    assert.equal(m.isSolved(), false, '중간에 놓으면 처음부터');
    tick(m, ASSIST.hold / 2, { ...NONE, hold: true });
    assert.equal(m.isSolved(), false);
    tick(m, ASSIST.hold / 2 + 0.1, { ...NONE, hold: true });
    assert.ok(m.isSolved());
    assert.ok(m.skipped);
    assert.equal(m.path.length, m.openCount, '건너뛰면 실이 끝까지 이어진 그림을 보여 준다');
  });

  test('건너뛸 수 없을 때 꾹 누르기는 아무 일도 하지 않는다', () => {
    const m = new PhotoMini(2, [1, 0, 0, 0]);
    tick(m, ASSIST.hold * 2, { ...NONE, hold: true });
    assert.equal(m.isSolved(), false);
    assert.equal(m.skipped, false);
  });

  test('다 맞춘 뒤 쉬는 동안의 입력은 무시된다', () => {
    const m = new FlipMini(3, [['row', 0]]);
    m.flip('row', 0);
    const g = [...m.grid];
    press(m, { act: true });
    m.flip('col', 1);
    assert.deepEqual(m.grid, g);
    assert.equal(m.moves, 1);
  });

  test('건너뛴 퍼즐도 판이 모두 맞춰진 모습이 된다 (네 놀이 모두)', () => {
    for (const k of PUZZLE_KINDS) {
      const m = makeMini(puzzleId(k, 5)) as MemoryPuzzle;
      m.fails = ASSIST.skip;
      m.skip();
      assert.ok(m.isSolved(), k);
      assert.ok(finish(m), k);
    }
  });
});
