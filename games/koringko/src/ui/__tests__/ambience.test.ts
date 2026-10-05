import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { AMB_LOOPS, ambienceFor, ambienceGain, type AmbRoom } from '../audio/ambience.ts';
import { STORY_SFX } from '../audio/storysfx.ts';
import { STORY } from '../../core/adv/story/index.ts';

const room = (o: Partial<AmbRoom> & { kinds?: string[] }): AmbRoom => ({ id: o.id ?? 'x', scale: o.scale ?? 'human', look: o.look, theme: o.theme ?? 'toybox', rain: o.rain, weather: o.weather, amb: o.amb, furniture: (o.kinds ?? []).map((kind) => ({ kind })) });
const names = (r: AmbRoom) => ambienceFor(r).map((l) => l.name);

describe('바깥 소리 층 고르기', () => {
  test('시계 · 뻐꾸기시계가 있는 방은 째깍 소리 (clockTick)', () => {
    assert.ok(names(room({ look: 'living', kinds: ['clock'] })).includes('clockTick'));
    assert.ok(names(room({ look: 'attic', kinds: ['cuckoo'] })).includes('clockTick'));
    assert.ok(!names(room({ look: 'living', kinds: ['sofa'] })).includes('clockTick'));
  });

  test('냉장고가 있는 부엌은 웅웅 (fridgeHum), 세면대 · 욕조는 가끔 물방울 (drip, every)', () => {
    assert.ok(names(room({ look: 'kitchenNight', kinds: ['fridge'] })).includes('fridgeHum'));
    const bath = ambienceFor(room({ look: 'bathNight', kinds: ['sink'] }));
    const drip = bath.find((l) => l.name === 'drip');
    assert.ok(drip && drip.every && drip.every[0] > 0 && drip.every[1] >= drip.every[0]);
  });

  test('집 밖 (풀 · 아스팔트 · 모래 바닥) 은 바람 + 먼 차 소리, 밤이고 비가 없으면 귀뚜라미', () => {
    const yard = names(room({ look: 'yardNight' }));
    assert.ok(yard.includes('wind') && yard.includes('traffic') && yard.includes('crickets'), `${yard}`);
    const wet = names(room({ look: 'yardNight', rain: true }));
    assert.ok(wet.includes('wind') && !wet.includes('crickets'), `${wet}`);
    assert.ok(!names(room({ look: 'alley' })).includes('crickets'), '낮 골목엔 귀뚜라미 없음');
  });

  test('안쪽 방도 아주 작게 먼 차 소리 · 방 울림 (roomTone) 이 깔린다', () => {
    const r = ambienceFor(room({ look: 'haru15' }));
    assert.ok(r.some((l) => l.name === 'roomTone'));
    const t = r.find((l) => l.name === 'traffic');
    const out = ambienceFor(room({ look: 'yardNight' })).find((l) => l.name === 'traffic');
    assert.ok(t && out && t.gain < out.gain, '안에서는 먼 차 소리가 더 작다');
  });

  test('기억 방 (m_…) 은 먹먹하게 (muffle) 하고 소리가 더 작다', () => {
    const now = ambienceFor(room({ id: 'living', look: 'living', kinds: ['clock'] }));
    const mem = ambienceFor(room({ id: 'm_living', look: 'living', kinds: ['clock'] }));
    assert.ok(mem.every((l) => l.muffle));
    assert.ok(now.every((l) => !l.muffle));
    const g = (ls: typeof now) => ls.find((l) => l.name === 'clockTick')!.gain;
    assert.ok(g(mem) < g(now));
  });

  test('방에 적어 둔 amb 가 있으면 그대로 쓴다', () => {
    const r = ambienceFor(room({ look: 'living', kinds: ['clock'], amb: [{ name: 'wind', gain: 0.4 }] }));
    assert.deepEqual(r.map((l) => [l.name, l.gain]), [['wind', 0.4]]);
  });

  test('모든 층은 조용하다 (gain 0 < g ≤ 0.5), 이름은 계속 흐르는 고리이거나 효과음 이름', () => {
    const rooms = Object.values(STORY.rooms).map((f) => f());
    for (const r of rooms)
      for (const l of ambienceFor(r)) {
        assert.ok(l.gain > 0 && l.gain <= 0.5, `${r.id} ${l.name} ${l.gain}`);
        assert.ok((AMB_LOOPS as readonly string[]).includes(l.name) || !!STORY_SFX[l.name], `${r.id}: ${l.name}`);
        if (l.every) assert.ok(!!STORY_SFX[l.name], `가끔 나는 소리는 효과음: ${l.name}`);
      }
  });

  test('실제 이야기 방: 다락은 뻐꾸기시계 째깍, 바깥 장은 바람', () => {
    assert.ok(names(STORY.rooms.attic()).includes('clockTick'));
    assert.ok(names(STORY.rooms.outside()).includes('wind'));
  });
});

describe('바깥 소리 세기는 효과음 볼륨을 따른다', () => {
  test('효과음 0 이면 0, 볼륨에 비례', () => {
    assert.equal(ambienceGain(0.3, 0), 0);
    assert.ok(Math.abs(ambienceGain(0.3, 1) - 2 * ambienceGain(0.3, 0.5)) < 1e-9);
    assert.ok(ambienceGain(0.5, 1) <= 0.1, '가장 커도 작게');
  });
});
