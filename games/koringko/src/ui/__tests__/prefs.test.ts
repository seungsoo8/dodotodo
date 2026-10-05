/**
 * 설정(F1 · D4): 글자 속도 · 글자 크기 · 흔들림 · 자동 넘김 · 기기 음성 · 본 대사 건너뛰기를
 * 읽고(잘못된 값은 하나씩 기본으로) 쓰고, 무대(Stage)와 글자 화면에 넣는다.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { applyPrefs, AUTO_SECONDS, cyclePref, DEFAULT_PREFS, loadPrefs, parsePrefs, PREFS_KEY, prefValueText, savePrefs, TEXT_SCALE, TEXT_SPEED, uiView, type Prefs } from '../prefs.ts';
import { newStage } from '../../core/adv/stage.ts';

/** 진짜처럼 값을 담는 저장소 (막힌 저장소 흉내 가능) */
function memStore(init: Record<string, string> = {}, broken = false) {
  const m = new Map(Object.entries(init));
  return {
    m,
    getItem(k: string): string | null {
      if (broken) throw new Error('blocked');
      return m.get(k) ?? null;
    },
    setItem(k: string, v: string): void {
      if (broken) throw new Error('blocked');
      m.set(k, v);
    },
  };
}

describe('설정 기본값', () => {
  test('기기 음성(TTS)은 기본으로 꺼져 있고, 글자 속도 보통 · 크기 보통 · 흔들림 켜짐 · 자동 넘김 끔 · 본 대사 건너뛰기 켜짐', () => {
    assert.equal(DEFAULT_PREFS.voice, false);
    assert.equal(DEFAULT_PREFS.textSpeed, 'normal');
    assert.equal(DEFAULT_PREFS.textSize, 'normal');
    assert.equal(DEFAULT_PREFS.shake, true);
    assert.equal(DEFAULT_PREFS.auto, 'off');
    assert.equal(DEFAULT_PREFS.skipSeen, true);
  });

  test('저장된 것이 없으면 기본값 (예전 목소리 키도 없으면 음성 꺼짐)', () => {
    assert.deepEqual(parsePrefs(null, null), DEFAULT_PREFS);
  });
});

describe('설정 읽기: 값 검사', () => {
  test('올바른 값은 그대로 읽는다', () => {
    const p: Prefs = { textSpeed: 'fast', textSize: 'large', shake: false, auto: 'slow', voice: true, skipSeen: false };
    assert.deepEqual(parsePrefs(JSON.stringify(p), null), p);
  });

  test('모르는 값 · 틀린 형은 그 항목만 기본값으로 (나머지는 지킨다)', () => {
    const raw = JSON.stringify({ textSpeed: 'warp', textSize: 'large', shake: 'no', auto: 3, voice: 1, skipSeen: false });
    assert.deepEqual(parsePrefs(raw, null), { ...DEFAULT_PREFS, textSize: 'large', skipSeen: false });
  });

  test('깨진 JSON · 배열 · null 은 기본값', () => {
    assert.deepEqual(parsePrefs('{oops', null), DEFAULT_PREFS);
    assert.deepEqual(parsePrefs('[1,2]', null), DEFAULT_PREFS);
    assert.deepEqual(parsePrefs('null', null), DEFAULT_PREFS);
  });

  test('새 설정이 없을 때 예전 목소리 키가 "on" 이면(직접 켠 사람) 켜고, "off" 나 없음이면 끈다', () => {
    assert.equal(parsePrefs(null, 'on').voice, true);
    assert.equal(parsePrefs(null, 'off').voice, false);
    // 새 설정이 있으면 예전 키는 보지 않는다
    assert.equal(parsePrefs(JSON.stringify({ voice: false }), 'on').voice, false);
  });
});

describe('설정 저장 · 불러오기', () => {
  test('저장한 것을 다시 불러오면 같다', () => {
    const s = memStore();
    const p: Prefs = { ...DEFAULT_PREFS, textSpeed: 'instant', auto: 'fast' };
    savePrefs(s, p);
    assert.ok(s.m.has(PREFS_KEY));
    assert.deepEqual(loadPrefs(s), p);
  });

  test('저장소가 막혀 있어도 던지지 않고, 불러오기는 기본값', () => {
    const s = memStore({}, true);
    assert.doesNotThrow(() => savePrefs(s, DEFAULT_PREFS));
    assert.deepEqual(loadPrefs(s), DEFAULT_PREFS);
  });

  test('예전 목소리 키(koringko:voice)를 함께 읽는다', () => {
    assert.equal(loadPrefs(memStore({ 'koringko:voice': 'on' })).voice, true);
  });
});

describe('설정 고르기 (메뉴에서 ◀ ▶)', () => {
  test('글자 속도는 느림 → 보통 → 빠름 → 바로 → 느림 으로 돈다', () => {
    let p: Prefs = { ...DEFAULT_PREFS, textSpeed: 'slow' };
    const seen: string[] = [];
    for (let i = 0; i < 4; i++) {
      p = cyclePref(p, 'textSpeed', 1);
      seen.push(p.textSpeed);
    }
    assert.deepEqual(seen, ['normal', 'fast', 'instant', 'slow']);
    assert.equal(cyclePref({ ...DEFAULT_PREFS, textSpeed: 'slow' }, 'textSpeed', -1).textSpeed, 'instant');
  });

  test('켜고 끄는 항목은 뒤집힌다, 원래 객체는 그대로', () => {
    const p = { ...DEFAULT_PREFS };
    const q = cyclePref(p, 'voice', 1);
    assert.equal(q.voice, true);
    assert.equal(p.voice, false);
    assert.equal(cyclePref(q, 'shake', -1).shake, false);
  });

  test('항목 값 글자', () => {
    assert.equal(prefValueText({ ...DEFAULT_PREFS, textSpeed: 'instant' }, 'textSpeed'), '바로');
    assert.equal(prefValueText({ ...DEFAULT_PREFS, textSize: 'large' }, 'textSize'), '크게');
    assert.equal(prefValueText({ ...DEFAULT_PREFS, shake: false }, 'shake'), '끔');
    assert.equal(prefValueText({ ...DEFAULT_PREFS, auto: 'off' }, 'auto'), '끔');
  });
});

describe('설정을 무대에 넣기 (2갈래가 읽는 값)', () => {
  test('글자 속도 배율: 느림 20 · 보통 30 · 빠름 50 글자/초 (TEXT_RATE 30 기준), 바로는 한 번에', () => {
    assert.ok(Math.abs(TEXT_SPEED.slow * 30 - 20) < 1e-9);
    assert.equal(TEXT_SPEED.normal, 1);
    assert.ok(Math.abs(TEXT_SPEED.fast * 30 - 50) < 1e-9);
    // 1/60초 한 장면에 긴 대사(120자)도 다 나온다
    assert.ok(TEXT_SPEED.instant * 30 * (1 / 60) >= 120);
  });

  test('applyPrefs: textSpeed · noShake · autoAdvance 를 무대에 쓴다', () => {
    const st = newStage();
    applyPrefs(st, { ...DEFAULT_PREFS, textSpeed: 'fast', shake: false, auto: 'slow' });
    const s = st as unknown as { textSpeed: number; noShake: boolean; autoAdvance: number };
    assert.equal(s.textSpeed, TEXT_SPEED.fast);
    assert.equal(s.noShake, true);
    assert.equal(s.autoAdvance, AUTO_SECONDS.slow);
    applyPrefs(st, DEFAULT_PREFS);
    assert.equal(s.textSpeed, 1);
    assert.equal(s.noShake, false);
    assert.equal(s.autoAdvance, 0);
  });

  test('자동 넘김: 끔은 0초, 느리게가 빠르게보다 오래 기다린다', () => {
    assert.equal(AUTO_SECONDS.off, 0);
    assert.ok(AUTO_SECONDS.slow > AUTO_SECONDS.fast && AUTO_SECONDS.fast > 0);
  });
});

describe('글자 크기: 글자 화면 배율', () => {
  test('보통은 화면 그대로', () => {
    const v = { scale: 3, w: 640, h: 360 };
    assert.deepEqual(uiView(v, 'normal'), v);
  });

  test('크게는 배율 ×1.25, 논리 크기는 그만큼 줄어 장치 픽셀은 같다', () => {
    const v = { scale: 3, w: 640, h: 360 };
    const u = uiView(v, 'large');
    assert.equal(TEXT_SCALE.large, 1.25);
    assert.equal(u.scale, 3.75);
    assert.equal(u.w, 512);
    assert.equal(u.h, 288);
    assert.ok(u.w * u.scale >= v.w * v.scale - u.scale);
  });

  test('크게여도 아주 작은 화면은 논리 1 아래로 내려가지 않는다', () => {
    const u = uiView({ scale: 1, w: 1, h: 1 }, 'large');
    assert.ok(u.w >= 1 && u.h >= 1);
  });
});
