import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_AUDIO, loadAudio, saveAudio } from '../records.ts';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return { data, getItem: (k: string) => (k in data ? data[k] : null), setItem: (k: string, v: string) => void (data[k] = v) };
}

describe('소리 설정 저장', () => {
  test('저장한 효과음·음악 크기와 끄기를 그대로 불러온다', () => {
    const st = memoryStorage();
    saveAudio(st, { sfx: 0.3, music: 0.7, muted: true });
    assert.deepEqual(loadAudio(st), { sfx: 0.3, music: 0.7, muted: true });
  });

  test('없으면 기본값 (음악은 효과음보다 작게)', () => {
    assert.deepEqual(loadAudio(memoryStorage()), DEFAULT_AUDIO);
    assert.ok(DEFAULT_AUDIO.music < DEFAULT_AUDIO.sfx);
  });

  test('범위를 벗어나거나 깨진 값은 0~1 로 자르거나 기본값', () => {
    const st = memoryStorage({ 'tower-guardian:audio': JSON.stringify({ sfx: 3, music: -1, muted: 'yes' }) });
    assert.deepEqual(loadAudio(st), { sfx: 1, music: 0, muted: false });
    assert.deepEqual(loadAudio(memoryStorage({ 'tower-guardian:audio': '{깨짐' })), DEFAULT_AUDIO);
  });

  test('예전 "소리 끄기" 저장값을 이어받는다', () => {
    const st = memoryStorage({ 'tower-guardian:muted': '1' });
    assert.equal(loadAudio(st).muted, true);
  });
});
