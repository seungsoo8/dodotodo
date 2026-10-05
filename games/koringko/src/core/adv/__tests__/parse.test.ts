import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { parseScript } from '../parse.ts';

describe('대본 글 → 명령', () => {
  test('대사 · 해설 · 빈 줄 · 주석', () => {
    const cmds = parseScript(`
      # 주석은 무시
      toby: 하루야, 어디 가?

      > 다락방에 불이 꺼졌다.
      bori: 배고파… 꿀 있어?
    `);
    assert.deepEqual(cmds, [
      { t: 'say', who: 'toby', text: '하루야, 어디 가?' },
      { t: 'say', who: '', text: '다락방에 불이 꺼졌다.' },
      { t: 'say', who: 'bori', text: '배고파… 꿀 있어?' },
    ]);
  });

  test('대사 안의 쌍점은 첫 번째만 나눈다', () => {
    assert.deepEqual(parseScript('haru: 엄마: 응, 지금 갈게!'), [{ t: 'say', who: 'haru', text: '엄마: 응, 지금 갈게!' }]);
  });

  test('몸짓 명령: 걷기 · 감정 · 돌아보기 · 자세 · 나타나기 · 사라지기', () => {
    assert.deepEqual(parseScript(`
      @walk haru 5 3.5
      @walk gm 2 2 40 nowait
      @emote toby ! 2
      @emote bori … nowait
      @face haru gm
      @pose haru cry
      @show gm grandma 4 3 left sit
      @show haru haru7 3 3
      @hide gm
    `), [
      { t: 'walk', who: 'haru', to: [5, 3.5] },
      { t: 'walk', who: 'gm', to: [2, 2], speed: 40, wait: false },
      { t: 'emote', who: 'toby', e: '!', s: 2 },
      { t: 'emote', who: 'bori', e: '…', wait: false },
      { t: 'face', who: 'haru', dir: 'gm' },
      { t: 'pose', who: 'haru', pose: 'cry' },
      { t: 'show', who: 'gm', kind: 'grandma', at: [4, 3], dir: 'left', pose: 'sit' },
      { t: 'show', who: 'haru', kind: 'haru7', at: [3, 3] },
      { t: 'hide', who: 'gm' },
    ]);
  });

  test('화면 명령: 기다리기 · 어두워지기 · 띠 · 음악 · 소리 · 카메라 · 흔들림 · 색감', () => {
    assert.deepEqual(parseScript(`
      @wait 0.5
      @fade 1 2 white
      @fade 0
      @bars on
      @bars off
      @music minor
      @music none
      @sfx tape
      @cam 10 4 1.5
      @cam haru
      @cam off
      @shake 0.4
      @tone memory
    `), [
      { t: 'wait', s: 0.5 },
      { t: 'fade', to: 1, s: 2, color: 'white' },
      { t: 'fade', to: 0 },
      { t: 'bars', on: true },
      { t: 'bars', on: false },
      { t: 'music', track: 'minor' },
      { t: 'music', track: null },
      { t: 'sfx', name: 'tape' },
      { t: 'cam', to: [10, 4], s: 1.5 },
      { t: 'cam', to: 'haru' },
      { t: 'cam', to: null },
      { t: 'shake', s: 0.4 },
      { t: 'tone', v: 'memory' },
    ]);
  });

  test('이야기 명령: 제목 · 방 · 깃발 · 동료 · 조종 · 할 일 · 놀이 · 장 · 태엽 · 앨범 · 크레디트 · 고르기', () => {
    assert.deepEqual(parseScript(`
      @title 1장 · 다락방 | 15살, 이삿짐을 싸던 밤
      @room mem_attic 4 5 up
      @room attic
      @flag met_doll
      @flag met_doll off
      @join bori
      @leave nabi
      @control haru
      @goal 할머니를 찾아보자
      @goal off
      @mini stars
      @chapter 2
      @wind 0.45
      @album m1
      @credits
      @choice call | 보고 싶어요 | 괜찮아요, 할머니
    `), [
      { t: 'title', text: '1장 · 다락방', sub: '15살, 이삿짐을 싸던 밤' },
      { t: 'room', id: 'mem_attic', at: [4, 5], dir: 'up' },
      { t: 'room', id: 'attic' },
      { t: 'flag', name: 'met_doll' },
      { t: 'flag', name: 'met_doll', v: false },
      { t: 'join', who: 'bori' },
      { t: 'leave', who: 'nabi' },
      { t: 'control', who: 'haru' },
      { t: 'goal', text: '할머니를 찾아보자' },
      { t: 'goal', text: null },
      { t: 'mini', id: 'stars' },
      { t: 'chapter', n: 2 },
      { t: 'wind', v: 0.45 },
      { t: 'album', id: 'm1' },
      { t: 'credits' },
      { t: 'choice', flag: 'call', options: ['보고 싶어요', '괜찮아요, 할머니'] },
    ]);
  });

  test('갈래: @if … @else … @end (겹쳐도 된다)', () => {
    assert.deepEqual(parseScript(`
      @if saw_jar
        toby: 아까 그 병!
        @if star_s1
          bori: 별도 주웠지
        @end
      @else
        toby: 뭐였더라?
      @end
      toby: 가자.
    `), [
      {
        t: 'if',
        flag: 'saw_jar',
        then: [{ t: 'say', who: 'toby', text: '아까 그 병!' }, { t: 'if', flag: 'star_s1', then: [{ t: 'say', who: 'bori', text: '별도 주웠지' }] }],
        else: [{ t: 'say', who: 'toby', text: '뭐였더라?' }],
      },
      { t: 'say', who: 'toby', text: '가자.' },
    ]);
  });

  test('틀린 줄은 몇째 줄인지 알려 준다 (모르는 명령 · 숫자 아님 · 닫히지 않은 갈래)', () => {
    assert.throws(() => parseScript('toby: 안녕\n@jump 3'), /2번째 줄.*jump/);
    assert.throws(() => parseScript('@wait 빨리'), /1번째 줄/);
    assert.throws(() => parseScript('@if x\ntoby: 응'), /@end/);
    assert.throws(() => parseScript('그냥 글'), /1번째 줄/);
  });
});
