import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Adv, NO_INPUT, SPEED, type AdvData, type AdvInput } from '../adv.ts';
import { Builder } from '../../maps.ts';
import { approachVel, gaitScale, px, SLIDE_S, slideAt, TOAST_S } from '../stage.ts';
import type { HeroId } from '../../types.ts';
import type { Cmd, Facing, RoomDef, Thing } from '../types.ts';

/** 시험용 장난감 방 14×9 (가장자리 벽) */
function room(id: string, things: Thing[], extra: Partial<RoomDef> = {}): RoomDef {
  const b = new Builder(14, 9, 'w', 1);
  b.rect(0, 0, 14, 1, 'Q');
  b.rect(0, 8, 14, 1, 'Q');
  b.rect(0, 0, 1, 9, 'Q');
  b.rect(13, 0, 1, 9, 'Q');
  return { id, name: id, theme: 'toybox', w: 14, h: 9, tiles: b.rows(), structures: [], warps: [], npcs: [], spawns: [], start: { x: 2, y: 4 }, safe: true, dark: false, level: '', scale: 'toy', things, ...extra };
}
function data(things: Thing[], party: HeroId[] = ['toby', 'bori', 'ruru', 'nabi'], wind = 1): AdvData {
  return {
    rooms: { r1: () => room('r1', things), mem: () => ({ ...room('mem', []), scale: 'human' }) },
    chapters: [{ n: 1, title: '1장', sub: '', room: 'r1', start: [2, 4], party, wind, intro: [] }],
  };
}
function pressAt(a: Adv, x: number, y: number, dir: Facing): void {
  a.place(px(x), px(y));
  a.face(dir);
  a.step(1 / 60, NO_INPUT);
  a.step(1 / 60, { ...NO_INPUT, act: true });
}
function finish(a: Adv): void {
  for (let i = 0; i < 3600 && (a.runner || a.mini); i++) a.step(1 / 60, { ...NO_INPUT, act: i % 2 === 0 });
}
const steps = (a: Adv, secs: number, inp: AdvInput = NO_INPUT) => {
  for (let t = 0; t < secs - 1e-9; t += 1 / 60) a.step(1 / 60, inp);
};
const walk = (x: number, y: number): AdvInput => ({ ...NO_INPUT, move: { x, y } });

describe('종이별: 대화창 대신 잠깐 뜨는 알림', () => {
  test('주우면 대본(대화창) 없이 알림 "★ n" 과 별 글귀, 반짝 소리, 토비는 숙인다', () => {
    const a = new Adv(data([{ kind: 'star', id: 'st', at: [4, 4], text: '하루가 접은 별' }, { kind: 'star', id: 'st2', at: [8, 4], text: '' }]));
    finish(a);
    a.stage.sfx.length = 0;
    pressAt(a, 3, 4, 'right');
    assert.equal(a.runner, null, '대본이 돌지 않는다 (걷기를 막지 않는다)');
    assert.equal(a.stage.dialog, null, '대화창이 뜨지 않는다');
    assert.equal(a.flags.star_st, true);
    assert.deepEqual({ text: a.stage.toast?.text, sub: a.stage.toast?.sub }, { text: '★ 1', sub: '하루가 접은 별' });
    assert.ok(a.stage.sfx.includes('star'));
    assert.equal(a.stage.actors.toby.pose, 'bow');
    assert.ok(a.stage.actors.toby.act, '한 번 하는 몸짓');
    // 바로 걸을 수 있다
    const x0 = a.stage.actors.toby.x;
    steps(a, 0.3, walk(0, 1));
    assert.ok(a.stage.actors.toby.y > px(4) + 5 && Math.abs(a.stage.actors.toby.x - x0) < 1);
    // 두 번째 별: 수가 오른다
    pressAt(a, 7, 4, 'right');
    assert.equal(a.stage.toast?.text, '★ 2');
    assert.equal(a.stage.toast?.sub, '');
  });

  test('알림은 TOAST_S 초 뒤 사라진다', () => {
    const a = new Adv(data([{ kind: 'star', id: 'st', at: [4, 4], text: '별' }]));
    finish(a);
    pressAt(a, 3, 4, 'right');
    steps(a, TOAST_S - 0.1);
    assert.ok(a.stage.toast, '아직 떠 있다');
    steps(a, 0.2);
    assert.equal(a.stage.toast ?? null, null);
  });
});

describe('밀기 · 굴리기: 칸 사이를 미끄러진다', () => {
  test('밀면 저장 자리는 바로 바뀌고, 그림 자리는 보리가 힘을 준 뒤 칸마다 SLIDE_S 초 동안 옮겨 간다', () => {
    const a = new Adv(data([{ kind: 'push', id: 'box', at: [4, 4], look: 'boxes', roll: true }]));
    finish(a);
    a.call('bori', true);
    finish(a);
    pressAt(a, 3, 4, 'right');
    const end = a.blockAt('box');
    assert.deepEqual(end, [12, 4], '구르는 물건은 벽 앞까지');
    const sl = a.stage.slides?.box;
    assert.ok(sl, '미끄러짐이 생긴다');
    assert.deepEqual([sl.from, sl.to], [[4, 4], [12, 4]]);
    assert.ok(Math.abs(sl.dur - SLIDE_S * 8) < 1e-9, `${sl.dur}`);
    assert.deepEqual(slideAt(a.stage, 'box', end), [4, 4], '보리가 힘주는 동안은 처음 자리');
    // 중간쯤
    steps(a, 0.5 + sl.dur / 2);
    const mid = slideAt(a.stage, 'box', end);
    assert.ok(mid[0] > 5 && mid[0] < 11 && mid[1] === 4, `${mid}`);
    finish(a);
    steps(a, sl.dur);
    assert.deepEqual(slideAt(a.stage, 'box', end), [12, 4]);
  });

  test('다 미끄러지면 작은 흔들림 (끝난 미끄러짐은 지운다)', () => {
    const a = new Adv(data([{ kind: 'push', id: 'box', at: [4, 4], look: 'boxes' }]));
    finish(a);
    a.call('bori', true);
    finish(a);
    pressAt(a, 3, 4, 'right');
    assert.deepEqual(a.blockAt('box'), [5, 4]);
    let shook = false;
    for (let i = 0; i < 120; i++) {
      a.step(1 / 60, NO_INPUT);
      if (a.stage.shake > 0) shook = true;
    }
    assert.ok(shook, '멈출 때 흔들린다');
    steps(a, 1);
    assert.equal(a.stage.slides?.box, undefined);
  });

  test('미끄러짐이 없으면 저장 자리 그대로', () => {
    const a = new Adv(data([]));
    assert.deepEqual(slideAt(a.stage, 'nothing', [3, 7]), [3, 7]);
  });
});

describe('걸음의 손맛: 짧은 가속 · 감속', () => {
  test('approachVel: 가속 0.08초 · 감속 0.06초에 목표 속도에 닿는다', () => {
    const v0 = { x: 0, y: 0 };
    const half = approachVel(v0, { x: 100, y: 0 }, 0.04);
    assert.ok(half.x > 40 && half.x < 60, `${half.x}`);
    assert.deepEqual(approachVel(v0, { x: 100, y: 0 }, 0.08), { x: 100, y: 0 });
    assert.deepEqual(approachVel({ x: 100, y: 0 }, { x: 0, y: 0 }, 0.06), { x: 0, y: 0 });
    const slow = approachVel({ x: 100, y: 0 }, { x: 0, y: 0 }, 0.03);
    assert.ok(slow.x > 40 && slow.x < 60, `${slow.x}`);
    assert.deepEqual(approachVel({ x: 30, y: 40 }, { x: 30, y: 40 }, 0.016), { x: 30, y: 40 });
  });

  test('걷기 시작 첫 프레임은 최고 속도보다 덜 가고, 손을 떼면 아주 조금 미끄러져 멈춘다', () => {
    const a = new Adv(data([]));
    finish(a);
    a.place(px(3), px(4));
    const x0 = a.stage.actors.toby.x;
    a.step(1 / 60, walk(1, 0));
    const first = a.stage.actors.toby.x - x0;
    assert.ok(first > 0 && first < (SPEED.toy / 60) * 0.5, `첫 프레임 ${first}`);
    steps(a, 0.5, walk(1, 0));
    const x1 = a.stage.actors.toby.x;
    a.step(1 / 60, walk(1, 0));
    assert.ok(Math.abs(a.stage.actors.toby.x - x1 - SPEED.toy / 60) < 0.01, '곧 최고 속도');
    const x2 = a.stage.actors.toby.x;
    steps(a, 0.3);
    const glide = a.stage.actors.toby.x - x2;
    assert.ok(glide > 0 && glide < 4, `미끄러짐 ${glide}`);
    assert.equal(a.stage.actors.toby.moving, false);
  });
});

describe('태엽이 줄면 토비가 느려진다', () => {
  test('gaitScale: 태엽 0.3 아래면 걸음 박자 0.7배', () => {
    assert.equal(gaitScale(1), 1);
    assert.equal(gaitScale(0.3), 1);
    assert.equal(gaitScale(0.29), 0.7);
    assert.equal(gaitScale(0), 0.7);
  });
  test('태엽이 적으면 같은 시간을 걸어도 걸음(발소리 박자)이 덜 쌓인다', () => {
    const walkT = (wind: number) => {
      const a = new Adv(data([], ['toby'], wind));
      finish(a);
      a.place(px(2), px(4));
      steps(a, 1, walk(1, 0));
      return a.stage.actors.toby.walkT;
    };
    const full = walkT(1);
    const low = walkT(0.2);
    assert.ok(Math.abs(low / full - 0.7) < 0.05, `${low} / ${full}`);
  });
});

describe('살펴보기 표시가 처음 뜰 때 반짝 소리', () => {
  test('표시가 새로 뜨면 한 번만 sparkle', () => {
    const a = new Adv(data([{ kind: 'spot', id: 'jar', at: [4, 4], scene: [{ t: 'say', who: 'toby', text: '병' }] }]));
    finish(a);
    a.place(px(1), px(6));
    a.step(1 / 60, NO_INPUT);
    a.stage.sfx.length = 0;
    a.place(px(3), px(4));
    a.face('right');
    a.step(1 / 60, NO_INPUT);
    assert.equal(a.prompt?.id, 'jar');
    a.step(1 / 60, NO_INPUT);
    a.step(1 / 60, NO_INPUT);
    assert.deepEqual(a.stage.sfx.filter((n) => n === 'sparkle'), ['sparkle']);
  });
});

describe('기억 장면 전환: 물건 쪽으로 · 소리 먼저 · 나와서 물건을 잠깐 비춘다', () => {
  const scene: Cmd[] = [
    { t: 'room', id: 'mem', at: [3, 3] },
    { t: 'show', who: 'haru', kind: 'haru7', at: [4, 3] },
    { t: 'sfx', name: 'rain' },
    { t: 'say', who: 'haru', text: '비 온다' },
    { t: 'sfx', name: 'thunder' },
  ];
  const mem: Thing = { kind: 'keepsake', id: 'cup', at: [5, 4], look: 'cup', name: '컵', scene, after: [{ t: 'say', who: 'toby', text: '그랬구나' }] };

  /** 기억을 열고 장면이 끝날 때까지 들은 명령 순서 (sfx · fade · cam) */
  function trace(): string[] {
    const a = new Adv(data([mem]));
    finish(a);
    a.stage.sfx.length = 0;
    pressAt(a, 4, 4, 'right');
    const out: string[] = [];
    let lastCam = 'null';
    let lastFadeTo = 0;
    for (let i = 0; i < 6000 && a.runner; i++) {
      for (const n of a.stage.sfx.splice(0)) if (!n.startsWith('voice') && !n.startsWith('step')) out.push(`sfx ${n}`);
      const cam = a.stage.cam === null ? 'null' : typeof a.stage.cam === 'string' ? a.stage.cam : `${a.stage.cam.x},${a.stage.cam.y}`;
      if (cam !== lastCam) out.push(`cam ${cam}`);
      lastCam = cam;
      if (a.stage.fadeTo !== lastFadeTo) out.push(`fade ${a.stage.fadeTo}`);
      lastFadeTo = a.stage.fadeTo;
      if (a.stage.dialog) out.push(`say ${a.stage.dialog.text}`);
      a.step(1 / 60, { ...NO_INPUT, act: !!a.stage.dialog && i % 2 === 0 });
    }
    return out.filter((x, i, arr) => arr[i - 1] !== x);
  }

  test('첫 효과음(빗소리)이 흰빛보다 먼저, 카메라는 그 물건 쪽으로', () => {
    const t = trace();
    const at = (s: string) => t.indexOf(s);
    assert.ok(at(`cam ${px(5)},${px(4)}`) >= 0, t.join(' | '));
    assert.ok(at('sfx rain') >= 0 && at('sfx rain') < at('fade 1'), t.join(' | '));
    assert.equal(t.filter((x) => x === 'sfx rain').length, 1, '빗소리는 한 번만 (앞으로 옮겼다)');
    assert.ok(at('sfx thunder') > at('say 비 온다'), '뒤쪽 효과음은 제자리');
  });

  test('돌아오면 그 물건을 잠깐 비추고(반짝) 카메라를 돌려준 뒤 동료 말', () => {
    const t = trace();
    const back = t.lastIndexOf(`cam ${px(5)},${px(4)}`);
    const sparkle = t.lastIndexOf('sfx sparkle');
    const after = t.indexOf('say 그랬구나');
    assert.ok(back > t.indexOf('say 비 온다'), t.join(' | '));
    assert.ok(sparkle > back && sparkle < after, t.join(' | '));
    assert.ok(t.lastIndexOf('cam null') > back && t.lastIndexOf('cam null') < after, t.join(' | '));
  });
});
