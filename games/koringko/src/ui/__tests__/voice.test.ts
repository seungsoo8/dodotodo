import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { speakable, voiceProfile, VoiceActor, type Synth, type Utter } from '../voice.ts';

/** 말한 것을 적어 두는 가짜 음성 합성기 */
function fakeSynth(voices: { name: string; lang: string }[] = [{ name: 'Korean A', lang: 'ko-KR' }]): Synth & { said: Utter[]; cancels: number } {
  const s = {
    said: [] as Utter[],
    cancels: 0,
    voices: () => voices,
    speak: (u: Utter) => void s.said.push(u),
    cancel: () => void s.cancels++,
  };
  return s;
}

describe('목소리: 읽을 글 다듬기', () => {
  test('낫표 · 따옴표는 빼고, 말줄임은 잠깐 쉬는 쉼표로', () => {
    assert.equal(speakable('「두고 가는 짐」이라고 썼어.'), '두고 가는 짐이라고 썼어.');
    assert.equal(speakable('…응. 할머니가 "차 조심하고" 했어'), '응. 할머니가 차 조심하고 했어');
    assert.equal(speakable('그건… 아니야'), '그건, 아니야');
  });

  test('글자가 없는 대사(…, !?, ♥)는 읽지 않는다 (빈 글)', () => {
    assert.equal(speakable('…'), '');
    assert.equal(speakable('……!?'), '');
    assert.equal(speakable('♥'), '');
  });
});

describe('목소리: 인물마다 다른 높이 · 빠르기', () => {
  test('하루는 어릴수록 목소리가 높다 (4살 > 10살 > 15살)', () => {
    const p4 = voiceProfile('haru', 'haru4').pitch;
    const p10 = voiceProfile('haru', 'haru10').pitch;
    const p15 = voiceProfile('haru', 'haru15').pitch;
    assert.ok(p4 > p10 && p10 > p15, `${p4} ${p10} ${p15}`);
  });

  test('할머니는 천천히, 아빠 · 보리는 낮게, 토비와 나비는 서로 다르게', () => {
    assert.ok(voiceProfile('gm', 'grandma').rate < voiceProfile('haru', 'haru15').rate);
    assert.ok(voiceProfile('dad', 'dad').pitch < voiceProfile('mom', 'mom').pitch);
    assert.ok(voiceProfile('bori', 'bear').pitch < voiceProfile('toby', 'toby').pitch);
    assert.notDeepEqual(voiceProfile('toby', 'toby'), voiceProfile('nabi', 'nabi'));
  });

  test('높이 · 빠르기는 합성기가 받는 범위 안 (높이 0~2, 빠르기 0.5~2)', () => {
    for (const [who, kind] of [['haru', 'haru4'], ['gm', 'grandma'], ['dad', 'dad'], ['ruru', 'ruru'], ['someone', '']]) {
      const p = voiceProfile(who, kind);
      assert.ok(p.pitch > 0 && p.pitch <= 2, `${who} pitch ${p.pitch}`);
      assert.ok(p.rate >= 0.5 && p.rate <= 2, `${who} rate ${p.rate}`);
    }
  });
});

describe('목소리: 대사를 읽는 배우', () => {
  test('인물 대사는 한국어로 읽고, 해설(독백 · 지문)은 읽지 않는다', () => {
    const s = fakeSynth();
    const v = new VoiceActor(s);
    assert.equal(v.line('haru', 'haru10', '할머니, 이거 봐!'), true);
    assert.equal(v.line('', '', '창밖으로 비가 내렸다.'), false);
    assert.equal(s.said.length, 1);
    assert.equal(s.said[0].text, '할머니, 이거 봐!');
    assert.equal(s.said[0].lang, 'ko-KR');
    assert.equal(s.said[0].voice, 'Korean A');
    assert.equal(s.said[0].pitch, voiceProfile('haru', 'haru10').pitch);
  });

  test('새 대사가 나오면 앞 대사 목소리는 끊는다', () => {
    const s = fakeSynth();
    const v = new VoiceActor(s);
    v.line('toby', 'toby', '하루야.');
    const before = s.cancels;
    v.line('bori', 'bear', '배고파.');
    assert.ok(s.cancels > before);
    assert.deepEqual(s.said.map((u) => u.text), ['하루야.', '배고파.']);
  });

  test('끄면 아무것도 읽지 않고 읽던 것도 멈춘다', () => {
    const s = fakeSynth();
    const v = new VoiceActor(s);
    v.line('toby', 'toby', '하루야.');
    v.setOn(false);
    assert.ok(s.cancels >= 1);
    assert.equal(v.line('toby', 'toby', '또 말해.'), false);
    assert.equal(s.said.length, 1);
  });

  test('한국어 목소리가 없는 기기에서는 읽지 않는다 (엉뚱한 언어로 읽지 않게)', () => {
    const s = fakeSynth([{ name: 'English', lang: 'en-US' }]);
    const v = new VoiceActor(s);
    assert.equal(v.available(), false);
    assert.equal(v.line('haru', 'haru10', '안녕'), false);
    assert.equal(s.said.length, 0);
  });

  test('잠꼬대(_sleep)와 글자 없는 대사는 읽지 않는다', () => {
    const s = fakeSynth();
    const v = new VoiceActor(s);
    assert.equal(v.line('haru_sleep', 'haru5', '음냐…'), false);
    assert.equal(v.line('haru', 'haru5', '…'), false);
    assert.equal(s.said.length, 0);
  });

  test('남자 목소리가 따로 있으면 아빠 · 할아버지는 그 목소리로', () => {
    const s = fakeSynth([{ name: 'Yuna', lang: 'ko-KR' }, { name: 'InJoon (Male)', lang: 'ko-KR' }]);
    const v = new VoiceActor(s);
    v.line('dad', 'dad', '출발하자!');
    v.line('mom', 'mom', '응.');
    assert.equal(s.said[0].voice, 'InJoon (Male)');
    assert.equal(s.said[1].voice, 'Yuna');
  });
});
