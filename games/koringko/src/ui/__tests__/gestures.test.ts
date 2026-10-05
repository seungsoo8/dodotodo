import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { HERO_ACTS, heroActSprite, heroSprite, type Dir } from '../art/heroes.ts';
import { CLEAR, hex, type Pix } from '../art/paint.ts';
import { PEOPLE, PERSON_ACTS, PERSON_ANIM, PERSON_MORE, PERSON_POSES, personFrame, personSprite, type PDir, type PPose } from '../art/people.ts';

/** PROPS.md 「몸짓」 · 「계속 자세 새로」 */
const ACTS = ['nod', 'shake', 'laugh', 'giggle', 'clap', 'jump', 'hop', 'bow', 'sigh', 'wipe', 'stretch', 'point', 'think', 'shiver', 'tremble', 'spin', 'pat', 'stomp', 'peek', 'surprise', 'lookAround', 'shrug', 'cheer'];
const MORE = ['read', 'write', 'knit', 'sew', 'cook', 'eat', 'drink', 'lie', 'hugKnees', 'handsBack', 'hipsHands', 'chinRest', 'lookDown', 'sleepSit', 'wavePush', 'carryBack'];

/** 두 그림을 발(아래)에 맞춰 겹쳤을 때 다른 칸 수 (높이가 달라도 비교) */
function diffBottom(a: Pix, b: Pix): number {
  const w = Math.max(a.w, b.w);
  const h = Math.max(a.h, b.h);
  let n = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) if (a.get(x, a.h - h + y) !== b.get(x, b.h - h + y)) n++;
  return n;
}
/** 칠한 칸 중 가장 아래 · 위 줄 (발에서 잰 높이) */
function rows(p: Pix): { top: number; bottom: number } {
  let top = -1;
  let bottom = -1;
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++)
      if (p.get(x, y) !== CLEAR) {
        if (top < 0) top = y;
        bottom = y;
      }
  return { top: p.h - top, bottom: p.h - bottom };
}
const count = (p: Pix, c: number) => p.px.filter((v) => v === c).length;

describe('사람 몸짓 · 새 자세', () => {
  test('PROPS.md 의 몸짓 23개 · 새 자세 16개가 모두 자세 목록에 있다', () => {
    assert.equal(ACTS.length, 23);
    assert.equal(MORE.length, 16);
    for (const a of ACTS) assert.ok((PERSON_ACTS as readonly string[]).includes(a) && PERSON_POSES.includes(a as PPose), a);
    for (const a of MORE) assert.ok((PERSON_MORE as readonly string[]).includes(a) && PERSON_POSES.includes(a as PPose), a);
  });

  test('몸짓 · 새 자세의 그림은 (앞 · 옆 · 뒤 모두) 서 있는 그림과 다르다', () => {
    for (const kind of ['haru9', 'grandma'])
      for (const d of ['down', 'right', 'up'] as PDir[]) {
        const idle = personSprite(kind, d, 'idle');
        for (const a of [...ACTS, ...MORE]) {
          // 뒷모습에서는 얼굴 표정 · 손에 든 작은 것이 안 보이는 자세가 있다
          if (d === 'up' && ['read', 'write', 'knit', 'sew', 'eat', 'drink', 'lookDown', 'think', 'giggle', 'wipe', 'chinRest'].includes(a)) continue;
          const frames = PERSON_ANIM[a as PPose]?.n ?? 1;
          for (let f = 0; f < frames; f++) {
            const g = personSprite(kind, d, a as PPose, { frame: f });
            assert.ok(diffBottom(idle, g) >= 4, `${kind} ${d} ${a}#${f}: ${diffBottom(idle, g)}`);
          }
        }
      }
  });

  test('되풀이하는 몸짓은 프레임끼리 다르다 (앞 · 옆모습)', () => {
    for (const d of ['down', 'right'] as PDir[])
      for (const [a, an] of Object.entries(PERSON_ANIM)) {
        const fr = Array.from({ length: an!.n }, (_, f) => personSprite('haru9', d, a as PPose, { frame: f }));
        for (let i = 0; i < fr.length; i++) {
          const j = (i + 1) % fr.length;
          assert.ok(diffBottom(fr[i], fr[j]) >= 2, `${d} ${a} #${i}=#${j}`);
        }
      }
  });

  test('jump: 뜬 프레임은 발이 바닥에서 떨어지고(3칸 이상) 두 팔이 머리 위로', () => {
    const stand = rows(personSprite('haru9', 'down', 'idle'));
    const up = personSprite('haru9', 'down', 'jump', { frame: 1 });
    const r = rows(up);
    assert.ok(r.bottom - stand.bottom >= 3, `발 ${r.bottom} vs ${stand.bottom}`);
    assert.ok(r.top > stand.top + 3, `꼭대기 ${r.top} vs ${stand.top}`);
  });

  test('nod: 머리가 2칸 내려갔다 올라온다 (몸은 그대로)', () => {
    const a = personSprite('haru9', 'down', 'nod', { frame: 0 });
    const b = personSprite('haru9', 'down', 'nod', { frame: 1 });
    assert.equal(rows(b).top, rows(a).top - 2);
    assert.equal(rows(b).bottom, rows(a).bottom);
  });

  test('shiver: 그림 전체가 좌우 1칸씩 떨린다 (두 프레임은 서로 2칸 어긋난 같은 모양)', () => {
    const a = personSprite('haru9', 'down', 'shiver', { frame: 0 });
    const b = personSprite('haru9', 'down', 'shiver', { frame: 1 });
    let same = 0;
    let n = 0;
    for (let y = 0; y < a.h; y++)
      for (let x = 0; x < a.w - 2; x++) {
        if (a.get(x, y) === CLEAR) continue;
        n++;
        if (b.get(x + 2, y) === a.get(x, y)) same++;
      }
    assert.ok(same / n > 0.95, `${same}/${n}`);
  });

  test('wipe: 손이 눈가(얼굴 위)에 올라온다 — 얼굴 높이에 살색 손이 더 많다', () => {
    const L = PEOPLE.haru9;
    const idle = personSprite('haru9', 'down', 'idle');
    const w = personSprite('haru9', 'down', 'wipe');
    // 빈 몸의 얼굴(살색)보다 손이 얼굴 밖 경계를 넘거나 같은 자리라도 눈동자가 가려진다
    const eye = hex('#3a2418');
    assert.ok(count(w, eye) < count(idle, eye), '눈이 가려지지 않았다');
    assert.ok(count(w, L.skin) > 0);
  });

  test('spin: 프레임마다 바라보는 쪽이 돈다 (1번 = 옆모습, 2번 = 뒷모습)', () => {
    const s1 = personSprite('haru9', 'down', 'spin', { frame: 1 });
    const s2 = personSprite('haru9', 'down', 'spin', { frame: 2 });
    assert.equal(diffBottom(s1, personSprite('haru9', 'right', 'spin')), 0);
    assert.equal(diffBottom(s2, personSprite('haru9', 'up', 'spin')), 0);
  });

  test('lie: 누운 그림 (자는 그림과 크기는 같고 눈을 뜬 것만 다르다)', () => {
    const lie = personSprite('mom', 'down', 'lie');
    const sleep = personSprite('mom', 'down', 'sleep');
    assert.ok(lie.w > lie.h, '누운 그림은 가로로 길다');
    assert.equal(lie.w, sleep.w);
    const n = diffBottom(lie, sleep);
    assert.ok(n > 0 && n < 12, `${n}`);
  });

  test('손에 든 것: 책(read) · 찻잔(drink) · 뜨개 털실(knit) 색이 그림에 있다', () => {
    assert.ok(count(personSprite('haru9', 'down', 'read'), hex('#fffaf0')) >= 8, 'read');
    assert.ok(count(personSprite('haru9', 'right', 'read'), hex('#fffaf0')) >= 8, 'read 옆');
    assert.ok(count(personSprite('grandma', 'down', 'knit'), hex('#ffd84a')) >= 6, 'knit');
    assert.ok(count(personSprite('grandma', 'down', 'drink', { frame: 0 }), hex('#ff9ec7')) >= 3, 'drink');
  });

  test('personFrame: 시간으로 프레임을 돌리고, 한 장짜리 자세는 늘 0', () => {
    const seen = new Set<number>();
    for (let t = 0; t < 2; t += 0.05) seen.add(personFrame('jump', t));
    assert.deepEqual([...seen].sort(), [0, 1, 2, 3]);
    assert.equal(personFrame('read', 3.7), 0);
    assert.equal(personFrame('idle', 1.2), 0);
  });
});

describe('장난감 몸짓', () => {
  const MUST = ['hop', 'jump', 'nod', 'laugh', 'spin', 'sigh', 'wipe', 'clap', 'cheer', 'shiver'];

  test('사람 몸짓 이름 23개를 장난감도 모두 안다, 모르는 이름은 null', () => {
    for (const a of ACTS) assert.ok(HERO_ACTS[a], a);
    assert.equal(heroActSprite('toby', 'down', 'nope', 0), null);
  });

  test('네 장난감 모두: 몸짓 그림은 서 있는 그림과 다르고, 되풀이 프레임은 서로 다르다', () => {
    for (const h of ['toby', 'bori', 'ruru', 'nabi'] as const)
      for (const d of ['down', 'right'] as Dir[]) {
        const idle = heroSprite(h, d, 'idle');
        for (const a of ACTS) {
          const n = HERO_ACTS[a].length;
          const fr = Array.from({ length: n }, (_, f) => heroActSprite(h, d, a, f)!);
          // 한 번 하는 몸짓은 첫 프레임이 '준비'(서 있는 그대로)일 수 있다 — 적어도 한 프레임은 달라야 한다
          assert.ok(fr.some((p) => diffBottom(idle, p) >= 3), `${h} ${d} ${a} 서 있는 그림과 같다`);
          for (let f = 0; f < n; f++) assert.ok(diffBottom(fr[f], fr[(f + 1) % n]) >= 3, `${h} ${d} ${a} #${f}=#${(f + 1) % n}`);
        }
      }
  });

  test('꼭 있어야 할 장난감 몸짓(폴짝 · 끄덕 · 웃음 · 빙글 · 한숨 · 눈물 · 박수 · 만세 · 오들오들)은 어느 프레임이든 서 있는 그림과 다르다', () => {
    for (const h of ['toby', 'bori', 'ruru', 'nabi'] as const) {
      const idle = heroSprite(h, 'down', 'idle');
      for (const a of MUST) {
        const any = HERO_ACTS[a].some((_, f) => diffBottom(idle, heroActSprite(h, 'down', a, f)!) >= 6);
        assert.ok(any, `${h} ${a}`);
      }
    }
  });

  test('장난감 jump: 뜬 프레임은 몸이 위로, cheer 는 팔이 머리 옆 높이까지', () => {
    const idle = rows(heroSprite('bori', 'down', 'idle'));
    const up = rows(heroActSprite('bori', 'down', 'jump', 1)!);
    assert.ok(up.bottom - idle.bottom >= 2, `${up.bottom} ${idle.bottom}`);
    // 만세: 팔(털색)이 머리 높이에서 몸 바깥으로 나온다
    const fur = hex('#b07444');
    const ch = heroActSprite('bori', 'down', 'cheer', 0)!;
    const st = heroSprite('bori', 'down', 'idle');
    const side = (p: Pix) => {
      let n = 0;
      for (let y = 10; y < 26; y++) for (const x of [0, 1, 2, 3, p.w - 4, p.w - 3, p.w - 2, p.w - 1]) if (p.get(x, y) === fur) n++;
      return n;
    };
    assert.ok(side(ch) > side(st), `${side(ch)} ${side(st)}`);
  });
});
