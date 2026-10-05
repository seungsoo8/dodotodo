import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { rainLevelOf } from '../audio/weather.ts';
import { STORY } from '../../core/adv/story/index.ts';

const room = (o: { rain?: boolean; look?: string; win?: string[] }) => ({ rain: o.rain, look: o.look, furniture: (o.win ?? []).map((kind) => ({ kind, x: 0, y: 0, w: 1, h: 1 })) });

describe('빗소리는 방의 날씨를 따른다', () => {
  test('비가 오는 방 (rain) 은 빗소리 가득', () => {
    assert.equal(rainLevelOf(room({ rain: true })), 1);
  });

  test('거실 · 병원 꾸밈이어도 비가 오지 않으면 빗소리가 없다 (예전 버그)', () => {
    assert.equal(rainLevelOf(room({ look: 'living', win: ['window:night'] })), 0);
    assert.equal(rainLevelOf(room({ look: 'hospital', win: ['window:day'] })), 0);
    assert.equal(rainLevelOf(room({ look: 'living' })), 0);
  });

  test('안쪽 방이라도 창밖에 비가 오면 (window:rain) 먹먹하게 작게', () => {
    const v = rainLevelOf(room({ look: 'living', win: ['window:rain', 'clock'] }));
    assert.ok(v > 0 && v < 1, `${v}`);
  });

  test('방이 없으면 (타이틀) 고요', () => {
    assert.equal(rainLevelOf(null), 0);
    assert.equal(rainLevelOf(undefined), 0);
  });

  test('실제 이야기 방: 병원 계단참(낮 창)은 고요, 12살 비 오는 거실 · 병원은 빗소리', () => {
    assert.equal(rainLevelOf(STORY.rooms.m_tb_hall()), 0);
    assert.ok(rainLevelOf(STORY.rooms.m_living()) > 0);
    assert.ok(rainLevelOf(STORY.rooms.m_hospital()) > 0);
  });
});
