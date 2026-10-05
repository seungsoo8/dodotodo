import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { STORY_SFX, stepSpec, specLength, FLOORS } from '../audio/storysfx.ts';
import { floorOf } from '../audio/floor.ts';
import type { SoundSpec } from '../audio/sfx.ts';

/** 원래 있던 소리 (세기 기준) */
const OLD = 'click move back page talk memory star fold miss push rope steps freeze caught safe blow cough stitch cheer giggle windTick door tape thud phone thunder chime sparkle open pop drip lift put'.split(' ');
/** 물건 · 효과음 약속(PROPS.md)의 새 효과음 */
const NEW = [
  'tapeRip tapeStick marker cardboard boxDrag paper letterOpen crumple',
  'doorOpen doorClose knock stairs drawer zipper curtain chair bed blanket clock clockChime switch window',
  'kettle pour spoon dish chop sizzle faucet slurp crunch',
  'sewing scissors knit clothes pat clap hug',
  'sob sigh laugh heartbeat',
  'rainRoof wind crickets birds cicada carPass bike swing gate bus bell dog splash umbrellaOpen sandStep',
  'camera candle bubbles phoneVibe music',
].join(' ').split(' ');

/** 겹 하나의 최대 세기 */
const peakLayer = (s: SoundSpec) => Math.max(...s.map((l) => l.gain));
/** 동시에 울리는 겹들의 세기 합 중 가장 큰 값 (겹이 시작하는 순간마다 잰다) */
function peakSum(s: SoundSpec): number {
  let best = 0;
  for (const at of s.map((l) => l.delay ?? 0)) {
    const sum = s.filter((l) => (l.delay ?? 0) <= at && at < (l.delay ?? 0) + l.dur).reduce((a, l) => a + l.gain, 0);
    best = Math.max(best, sum);
  }
  return best;
}

const oldLayerMax = Math.max(...OLD.map((n) => peakLayer(STORY_SFX[n])));
const oldSumMax = Math.max(...OLD.map((n) => peakSum(STORY_SFX[n])));

describe('이야기 효과음: 새 소리', () => {
  test('약속한 새 효과음 이름이 모두 소리 목록에 있다', () => {
    assert.equal(NEW.length, 67);
    const missing = NEW.filter((n) => !STORY_SFX[n]);
    assert.deepEqual(missing, []);
  });

  test('원래 소리도 그대로 남아 있다', () => {
    assert.deepEqual(OLD.filter((n) => !STORY_SFX[n]), []);
  });

  for (const n of NEW) {
    test(`${n}: 1겹 이상 · 길이 0 초과 4초 이하 · 세기가 기존 소리 범위 안`, () => {
      const s = STORY_SFX[n];
      assert.ok(s && s.length >= 1, '겹이 없다');
      for (const l of s) {
        assert.ok(l.dur > 0 && Number.isFinite(l.dur), `길이 ${l.dur}`);
        assert.ok(l.gain > 0 && l.gain <= oldLayerMax, `겹 세기 ${l.gain} (기존 최대 ${oldLayerMax})`);
        assert.ok(l.freq > 0 && (l.to === undefined || l.to > 0), '주파수는 양수 (지수 미끄럼)');
        assert.ok((l.delay ?? 0) >= 0, '늦춤은 0 이상');
        if (l.attack !== undefined) assert.ok(l.attack > 0 && l.attack < l.dur, `attack ${l.attack} < dur ${l.dur}`);
        if (l.release !== undefined) assert.ok(l.release > 0 && l.release <= l.dur, `release ${l.release}`);
        if (l.trem) assert.ok(l.trem.rate > 0 && l.trem.depth > 0 && l.trem.depth <= 1, '떨림 깊이 0~1');
        if (l.vib) assert.ok(l.vib.rate > 0 && l.vib.depth > 0 && l.vib.depth < l.freq, '흔들림 폭은 주파수보다 작게');
      }
      const len = specLength(s);
      assert.ok(len > 0 && len <= 4, `전체 길이 ${len}`);
      assert.ok(peakSum(s) <= oldSumMax + 1e-9, `동시 세기 합 ${peakSum(s).toFixed(3)} (기존 최대 ${oldSumMax})`);
    });
  }

  test('specLength 는 가장 늦게 끝나는 겹의 끝', () => {
    assert.equal(specLength([{ kind: 'tone', freq: 440, dur: 0.2, gain: 0.1 }, { kind: 'noise', freq: 900, dur: 0.3, gain: 0.1, delay: 0.5 }]), 0.8);
    assert.equal(specLength([]), 0);
  });

  test('묘사대로: 테이프 뜯기는 0.5초 넘게 여러 조각 잡음, 매직펜은 높은 잡음 두세 번, 빗소리는 2초 넘게', () => {
    const rip = STORY_SFX.tapeRip;
    assert.ok(rip.filter((l) => l.kind === 'noise').length >= 5 && specLength(rip) >= 0.5, '테이프');
    const freqs = new Set(rip.map((l) => l.freq));
    assert.ok(freqs.size >= 3, '조각마다 주파수가 들쭉날쭉');
    const mk = STORY_SFX.marker.filter((l) => l.kind === 'noise' && l.freq >= 2000);
    assert.ok(mk.length >= 2 && mk.length <= 6, `매직펜 끽 ${mk.length}`);
    assert.ok(specLength(STORY_SFX.rainRoof) >= 2 && specLength(STORY_SFX.rainRoof) <= 3.5, '빗소리 2~3초');
    assert.ok(STORY_SFX.kettle.some((l) => (l.attack ?? 0) >= 0.5 && l.freq >= 1500), '주전자: 높은 소리가 천천히 커진다');
    assert.ok(STORY_SFX.crickets.some((l) => l.trem && l.freq >= 3000), '귀뚜라미: 높은 떨림');
    const stairs = STORY_SFX.stairs.filter((l) => l.kind === 'tone').map((l) => l.delay ?? 0);
    assert.ok(new Set(stairs).size >= 3, '계단: 세 걸음 이상, 간격을 두고');
    assert.ok(peakLayer(STORY_SFX.stairs) < peakLayer(STORY_SFX.steps), '계단은 steps(쿵쿵) 보다 가볍다');
  });
});

describe('발소리 (step:)', () => {
  test('바닥 종류마다 장난감 · 사람 발소리가 있고, 작게 (겹 세기 0.05 이하) 짧게 (0.25초 이하)', () => {
    assert.deepEqual([...FLOORS].sort(), ['asphalt', 'dirt', 'grass', 'paving', 'sand', 'tile', 'toy', 'wood']);
    for (const f of FLOORS)
      for (const size of ['toy', 'human'] as const) {
        const s = stepSpec(f, size, 0.5);
        assert.ok(s.length >= 1, `${f}/${size}`);
        assert.ok(peakSum(s) <= 0.05, `${f}/${size} 세기 ${peakSum(s)}`);
        assert.ok(specLength(s) > 0 && specLength(s) <= 0.25, `${f}/${size} 길이 ${specLength(s)}`);
      }
  });

  test('장난감 발소리는 사람보다 높고 작다', () => {
    for (const f of FLOORS) {
      const toy = stepSpec(f, 'toy', 0.5);
      const hum = stepSpec(f, 'human', 0.5);
      const mean = (s: SoundSpec) => s.reduce((a, l) => a + l.freq, 0) / s.length;
      assert.ok(mean(toy) > mean(hum), `${f}: 높이 ${mean(toy)} vs ${mean(hum)}`);
      assert.ok(peakSum(toy) < peakSum(hum), `${f}: 세기`);
    }
  });

  test('바닥마다 소리가 다르다 (모래는 사각대는 잡음, 아스팔트는 또각 높은 톡)', () => {
    const sig = (f: (typeof FLOORS)[number]) => JSON.stringify(stepSpec(f, 'human', 0.5));
    assert.equal(new Set(FLOORS.map(sig)).size, FLOORS.length);
    const sand = stepSpec('sand', 'human', 0.5);
    assert.ok(sand.every((l) => l.kind === 'noise'), '모래: 잡음만');
    const asph = stepSpec('asphalt', 'human', 0.5);
    assert.ok(asph.some((l) => l.kind === 'noise' && l.filter === 'bandpass' && l.freq >= 2000), '아스팔트: 높은 또각');
  });

  test('같은 바닥이라도 걸음마다 높이가 조금씩 흔들린다 (jitter)', () => {
    const a = stepSpec('wood', 'human', 0)[0].freq;
    const b = stepSpec('wood', 'human', 1)[0].freq;
    assert.notEqual(a, b);
    assert.ok(Math.abs(a / b - 1) < 0.2, '흔들림은 작게');
  });

  test('바닥 정하기: 장난감 방은 toy, 사람 방은 꾸밈(look)의 바닥, 리놀륨은 tile, 모르는 꾸밈은 wood', () => {
    assert.equal(floorOf({ scale: 'toy' }), 'toy');
    assert.equal(floorOf({ scale: 'human', look: 'kitchen' }), 'tile');
    assert.equal(floorOf({ scale: 'human', look: 'hospital' }), 'tile');
    assert.equal(floorOf({ scale: 'human', look: 'haru7' }), 'wood');
    assert.equal(floorOf({ scale: 'human', look: '없는꾸밈' }), 'wood');
    assert.equal(floorOf({ scale: 'human' }), 'wood');
  });
});
