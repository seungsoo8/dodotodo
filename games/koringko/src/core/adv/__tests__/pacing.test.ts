import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Runner, FAST } from '../script.ts';
import { addActor, listenDir, pauseAfter, px, TEXT_RATE, updateStage } from '../stage.ts';
import { parseScript } from '../parse.ts';
import { simpleHost } from './host.ts';
import type { Cmd } from '../types.ts';

/** 대본을 dt 씩 secs 초 돌린다 (무대도 함께) */
function run(r: Runner, h: ReturnType<typeof simpleHost>, secs: number, dt = 1 / 120, fast = false): void {
  for (let t = 0; t < secs - 1e-9 && !r.done; t += dt) {
    r.update(h, dt, fast);
    updateStage(h.stage, fast ? dt * FAST : dt);
  }
}

describe('대사 호흡: 문장 부호 뒤 멈춤', () => {
  test('쉼표 0.12초 · 마침표 물음표 느낌표 0.25초 · 말줄임표 0.4초 (뒤에 글자가 더 있을 때)', () => {
    assert.equal(pauseAfter('가, 나', 1), 0.12);
    assert.equal(pauseAfter('가、나', 1), 0.12);
    assert.equal(pauseAfter('가. 나', 1), 0.25);
    assert.equal(pauseAfter('가? 나', 1), 0.25);
    assert.equal(pauseAfter('가! 나', 1), 0.25);
    assert.equal(pauseAfter('가…나', 1), 0.4);
    assert.equal(pauseAfter('가나다', 1), 0, '보통 글자 뒤에는 멈추지 않는다');
    assert.equal(pauseAfter('가 나', 1), 0, '띄어쓰기 뒤에도 멈추지 않는다');
  });

  test('마지막 글자 · 이어진 문장 부호 · 숫자 속 점에서는 멈추지 않는다', () => {
    assert.equal(pauseAfter('가나.', 2), 0, '끝 글자 뒤는 어차피 ▼ 를 기다린다');
    assert.equal(pauseAfter('정말?! 왜', 2), 0, '?! 는 첫 부호 뒤에서 멈추지 않고');
    assert.equal(pauseAfter('정말?! 왜', 3), 0.25, '마지막 부호 뒤에서 한 번만 멈춘다');
    assert.equal(pauseAfter('어... 그래', 1), 0);
    assert.equal(pauseAfter('어... 그래', 3), 0.4, '점 세 개는 말줄임표처럼');
    assert.equal(pauseAfter('1.5배', 1), 0, '숫자 속 점');
    assert.equal(pauseAfter('', 0), 0);
    assert.equal(pauseAfter('가', 5), 0, '범위 밖');
  });

  test('쉼표에서 실제로 멈췄다가 이어서 나온다', () => {
    const h = simpleHost();
    const text = '가나, 다라마바';
    const r = new Runner([{ t: 'say', who: 'toby', text }]);
    // 3글자(가나,)는 0.1초. 멈춤이 없으면 0.2초에 6글자
    run(r, h, 0.2);
    assert.equal(Math.floor(h.stage.dialog!.shown), 3, `0.2초: 쉼표 뒤에서 기다림 (${h.stage.dialog!.shown})`);
    run(r, h, 0.15);
    assert.ok(h.stage.dialog!.shown > 3, '멈춤이 끝나면 다시 나온다');
    run(r, h, 1);
    assert.equal(h.stage.dialog!.shown, text.length);
  });

  test('빨리 넘기기(누르고 있기)면 멈추지 않는다', () => {
    const text = '가, '.repeat(60);
    const h = simpleHost();
    const r = new Runner([{ t: 'say', who: '', text }]);
    r.update(h, 0, true);
    r.update(h, 1, true);
    assert.ok(Math.abs(h.stage.dialog!.shown - Math.min(text.length, TEXT_RATE * FAST)) <= 1, `${h.stage.dialog!.shown}`);
  });

  test('멈춘 동안 누르면 남은 글자를 모두 보여 준다', () => {
    const h = simpleHost();
    const text = '음… 그러니까 말이야';
    const r = new Runner([{ t: 'say', who: 'toby', text }]);
    run(r, h, 0.1);
    assert.ok((h.stage.dialog!.hold ?? 0) > 0, '말줄임표 뒤에서 기다리는 중');
    r.advance(h);
    assert.equal(h.stage.dialog!.shown, text.length);
    assert.equal(h.stage.dialog!.hold ?? 0, 0);
  });
});

describe('글자 속도 (설정 stage.textSpeed)', () => {
  const after1s = (speed: number): number => {
    const h = simpleHost();
    h.stage.textSpeed = speed;
    const r = new Runner([{ t: 'say', who: '', text: '가'.repeat(300) }]);
    r.update(h, 0);
    r.update(h, 1);
    return h.stage.dialog!.shown;
  };
  test('기본은 1배, 2배면 두 배 빠르고 0.5배면 절반', () => {
    assert.equal(simpleHost().stage.textSpeed, 1);
    assert.ok(Math.abs(after1s(1) - TEXT_RATE) <= 1);
    assert.ok(Math.abs(after1s(2) - TEXT_RATE * 2) <= 1, `${after1s(2)}`);
    assert.ok(Math.abs(after1s(0.5) - TEXT_RATE / 2) <= 1, `${after1s(0.5)}`);
  });
  test('0 · 음수 · 숫자가 아닌 값은 1배로 (멈춰 버리지 않게)', () => {
    for (const v of [0, -2, Number.NaN]) assert.ok(Math.abs(after1s(v) - TEXT_RATE) <= 1, `${v} → ${after1s(v)}`);
  });
  test('문장 부호 멈춤도 글자 속도에 맞춰 짧아진다', () => {
    const h = simpleHost();
    h.stage.textSpeed = 2;
    const r = new Runner([{ t: 'say', who: 'toby', text: '가나, 다라마바' }]);
    run(r, h, 0.05);
    assert.equal(Math.floor(h.stage.dialog!.shown), 3);
    assert.ok(Math.abs((h.stage.dialog!.hold ?? 0) - 0.06) < 0.02, `${h.stage.dialog!.hold}`);
  });
});

describe('자동 넘김 (설정 stage.autoAdvance)', () => {
  const lines: Cmd[] = [
    { t: 'say', who: 'toby', text: '가나' },
    { t: 'say', who: 'bori', text: '다라' },
  ];
  test('대사가 다 나오고 autoAdvance 초가 지나면 다음 대사로', () => {
    const h = simpleHost();
    h.stage.autoAdvance = 1.5;
    const r = new Runner(lines);
    run(r, h, 0.1);
    assert.equal(h.stage.dialog!.shown, 2, '두 글자는 0.1초 안에 다 나온다');
    run(r, h, 1.3);
    assert.equal(h.stage.dialog!.who, 'toby', '1.4초: 아직');
    run(r, h, 0.3);
    assert.equal(h.stage.dialog!.who, 'bori', '다 나온 뒤 1.5초가 지나면 넘어간다');
  });
  test('0 이거나 없으면 누를 때까지 기다린다', () => {
    for (const v of [0, undefined]) {
      const h = simpleHost();
      h.stage.autoAdvance = v;
      const r = new Runner(lines);
      run(r, h, 6);
      assert.equal(h.stage.dialog!.who, 'toby', `${v}`);
    }
  });
  test('빨리 넘기기 중에도 기다리는 시간은 실제 초로 센다', () => {
    const h = simpleHost();
    h.stage.autoAdvance = 2;
    const r = new Runner(lines);
    run(r, h, 1, 1 / 120, true);
    assert.equal(h.stage.dialog!.who, 'toby', '1초 (빨리 넘기기 4배여도 2초가 안 됐다)');
  });
});

describe('표정과 말하는 이 바라보기', () => {
  test('대본 "toby(sad): …" 는 표정을 단 대사, 대화창에 표정이 실린다', () => {
    const cmds = parseScript('toby(sad): 하루가 울었어.\nbori: 배고파');
    assert.deepEqual(cmds[0], { t: 'say', who: 'toby', text: '하루가 울었어.', mood: 'sad' });
    assert.deepEqual(cmds[1], { t: 'say', who: 'bori', text: '배고파' });
    const h = simpleHost();
    const r = new Runner(cmds);
    r.update(h, 0.01);
    assert.equal(h.stage.dialog!.mood, 'sad');
  });
  test('모르는 표정은 대본 오류', () => {
    assert.throws(() => parseScript('toby(hungry): 배고파'), /표정/);
  });

  test('듣는 이는 가까이에서 말하는 이 쪽을 본다 (멀거나 · 걷거나 · 대본이 돌려세웠으면 그대로)', () => {
    const h = simpleHost();
    const sp = addActor(h.stage, 'toby', 'toby', px(5), px(5));
    const ls = addActor(h.stage, 'bori', 'bori', px(3), px(5), 'down');
    assert.equal(listenDir(ls, sp), 'right');
    ls.x = px(7);
    assert.equal(listenDir(ls, sp), 'left');
    ls.x = px(5);
    ls.y = px(2);
    assert.equal(listenDir(ls, sp), 'down');
    ls.y = px(5) + px(20);
    assert.equal(listenDir(ls, sp), null, '멀리 있으면');
    ls.y = px(6);
    ls.faced = true;
    assert.equal(listenDir(ls, sp), null, '@face 로 돌려세운 인물');
    ls.faced = false;
    ls.moving = true;
    assert.equal(listenDir(ls, sp), null, '걷는 중');
    ls.moving = false;
    ls.pose = 'sleep';
    assert.equal(listenDir(ls, sp), null, '자는 중');
    ls.pose = 'idle';
    assert.equal(listenDir(sp, sp), null, '자기 자신');
  });

  test('@face 는 인물을 돌려세우고(faced), 걸으면 풀린다', () => {
    const h = simpleHost();
    addActor(h.stage, 'toby', 'toby', px(5), px(5));
    const r = new Runner([{ t: 'face', who: 'toby', dir: 'left' }, { t: 'wait', s: 0.1 }, { t: 'walk', who: 'toby', to: [6, 5] }]);
    r.update(h, 0.01);
    assert.equal(h.stage.actors.toby.faced, true);
    run(r, h, 2);
    assert.equal(h.stage.actors.toby.faced, false);
  });
});
