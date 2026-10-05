import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { CLEAR, type Pix } from '../art/paint.ts';
import { checkGrid, gridSize, type Grid } from '../art/px/grid.ts';
import * as TOYS from '../art/px/toys.ts';
import { HERO_DIRS, heroActSprite, heroPalette, heroSprite } from '../art/heroes.ts';

const HEROES = ['toby', 'bori', 'ruru', 'nabi'] as const;
const MOODS = ['smile', 'sad', 'surprise', 'angry', 'tear'] as const;

/** 모듈 안의 모든 격자 (중첩 객체까지) */
function grids(o: unknown, path = ''): [string, Grid][] {
  if (Array.isArray(o) && o.length && o.every((r) => typeof r === 'string')) return [[path, o as Grid]];
  if (o && typeof o === 'object') return Object.entries(o).flatMap(([k, v]) => grids(v, `${path}.${k}`));
  return [];
}
const diff = (a: Pix, b: Pix) => a.px.reduce((n, v, i) => n + (v !== b.px[i] ? 1 : 0), 0);
/** 위쪽 n 줄의 칠한 칸 모양 (실루엣) */
const mask = (p: Pix, rows: number) => {
  const out: boolean[] = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < p.w; x++) out.push(p.get(x, y) !== CLEAR);
  return out;
};

describe('장난감 손찍기 본 (px/toys.ts)', () => {
  const all = grids(TOYS);

  test('본이 충분히 있고 (머리 16 · 몸 8 · 귀 4 · 꼬리 4 …), 모든 줄 폭이 같다', () => {
    assert.ok(all.length >= 50, `${all.length}`);
    for (const [k, g] of all) assert.doesNotThrow(() => gridSize(g), k);
  });

  test('모든 글자가 인형 팔레트에 있다 (네 동료 모두)', () => {
    for (const h of HEROES) for (const [k, g] of all) assert.deepEqual(checkGrid(g, heroPalette(h)), [], `${h} ${k}`);
  });

  test('머리 본: 눈 닻이 털 칸 위에 있고, 앞모습 두 눈은 머리 가운데 선(ax-0.5)에 대칭', () => {
    for (const [sp, set] of Object.entries(TOYS.TOY_HEADS))
      for (const [v, t] of Object.entries(set)) {
        for (const c of t.eyes) for (let dy = 0; dy < 3; dy++) for (const dx of [0, 1]) assert.equal(t.g[t.ey + dy][c + dx], 'H', `${sp} ${v} 눈 (${c + dx},${t.ey + dy})`);
        if (v === 'down') assert.equal((t.eyes[0] + 1 + t.eyes[1]) / 2, t.ax - 0.5, `${sp} 눈 대칭`);
        assert.equal(t.eyes.length, v === 'up' ? 0 : v === 'right' ? 1 : 2, `${sp} ${v}`);
      }
  });

  test('머리 · 몸 본은 그림 틀(32×40)에 들어가는 폭 (머리 20 · 몸 18 이하)', () => {
    for (const set of Object.values(TOYS.TOY_HEADS)) for (const t of Object.values(set)) assert.ok(gridSize(t.g).w <= 20);
    for (const set of [TOYS.BODY_DOLL, TOYS.BODY_ROBE]) for (const b of Object.values(set)) assert.ok(gridSize(b.g).w <= 18);
  });
});

describe('동료 인형 그림', () => {
  test('넷의 머리 실루엣이 서로 다르다 (귀 · 모자 · 볼털): 위 20줄 모양이 30칸 넘게 다르다', () => {
    for (let i = 0; i < HEROES.length; i++)
      for (let j = i + 1; j < HEROES.length; j++) {
        const a = mask(heroSprite(HEROES[i], 'down', 'idle'), 20);
        const b = mask(heroSprite(HEROES[j], 'down', 'idle'), 20);
        const n = a.filter((v, k) => v !== b[k]).length;
        assert.ok(n > 30, `${HEROES[i]} · ${HEROES[j]} ${n}`);
      }
  });

  test('외곽선은 순수 검정이 아니다 (색 있는 외곽선)', () => {
    for (const h of HEROES) for (const d of HERO_DIRS) for (const c of heroSprite(h, d, 'idle').px) assert.ok(c !== 0x000000, `${h} ${d}`);
  });

  test('초상화 표정 다섯 가지가 모두 다르고, 평소 얼굴과도 다르다 (얼굴만 바뀐다: 200칸 미만)', () => {
    for (const h of HEROES) {
      const base = heroSprite(h, 'down', 'idle');
      const faces = MOODS.map((m) => heroSprite(h, 'down', 'idle', m));
      faces.forEach((f, i) => {
        const d = diff(base, f);
        assert.ok(d >= 3 && d < 200, `${h} ${MOODS[i]} ${d}`);
      });
      for (let i = 0; i < faces.length; i++) for (let j = i + 1; j < faces.length; j++) assert.ok(diff(faces[i], faces[j]) >= 2, `${h} ${MOODS[i]} = ${MOODS[j]}`);
    }
  });

  test('웃는 몸짓(laugh)은 저절로 웃는 얼굴, 표정을 주면 그 표정이 앞선다', () => {
    const laugh = heroActSprite('toby', 'down', 'laugh', 0)!;
    assert.equal(diff(laugh, heroActSprite('toby', 'down', 'laugh', 0, 'smile')!), 0);
    assert.ok(diff(laugh, heroActSprite('toby', 'down', 'laugh', 0, 'sad')!) > 0);
  });

  test('등을 보이면 표정이 없다: 뒷모습은 표정을 줘도 그대로', () => {
    for (const h of HEROES) assert.equal(diff(heroSprite(h, 'up', 'idle'), heroSprite(h, 'up', 'idle', 'smile')), 0, h);
  });
});
