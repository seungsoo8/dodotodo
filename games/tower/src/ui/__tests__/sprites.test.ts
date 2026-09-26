import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { BOSS, ENEMIES } from '../../core/data.ts';
import { ENEMY_SPRITES, TOWER_SPRITE, facesLeft, grid, parseSprite, walkFrame } from '../sprites.ts';
import { DEFAULT_CONFIG } from '../../core/config.ts';

describe('도트 그림 해석', () => {
  test('글자 한 칸이 도트 하나가 되고, 점(.)은 투명이라 도트가 생기지 않는다', () => {
    const s = parseSprite(['a.', '.b', 'ab'], { a: '#111111', b: '#222222' });
    assert.equal(s.width, 2);
    assert.equal(s.height, 3);
    assert.deepEqual(s.pixels, [
      { x: 0, y: 0, color: '#111111' },
      { x: 1, y: 1, color: '#222222' },
      { x: 0, y: 2, color: '#111111' },
      { x: 1, y: 2, color: '#222222' },
    ]);
  });

  test('줄 길이가 서로 다르면 어느 줄(1부터 셈)이 틀렸는지 알려주며 실패한다', () => {
    assert.throws(() => parseSprite(['aa', 'a', 'aa'], { a: '#000' }), /2번 줄/);
  });

  test('팔레트에 없는 글자가 있으면 실패한다', () => {
    assert.throws(() => parseSprite(['az'], { a: '#000' }), /z/);
  });

  test('빈 그림은 만들 수 없다', () => {
    assert.throws(() => parseSprite([], { a: '#000' }));
  });
});

describe('grid: 오른쪽 여백을 점으로 채워 줄 길이를 맞춤', () => {
  test('짧은 줄은 오른쪽에 점을 붙여 폭을 맞춘다', () => {
    assert.deepEqual(grid(4, ['ab', 'abcd', '']), ['ab..', 'abcd', '....']);
  });

  test('폭보다 긴 줄이 있으면 그 줄 번호를 알려주며 실패한다', () => {
    assert.throws(() => grid(3, ['abc', 'abcd']), /2번 줄/);
  });
});

describe('적 도트 그림', () => {
  const all = [...ENEMIES, BOSS];

  for (const def of all) {
    test(`${def.name}: 걷기 프레임이 2개 이상이고 모든 프레임 크기가 같다`, () => {
      const frames = ENEMY_SPRITES[def.id];
      assert.ok(frames, `${def.id} 그림이 없음`);
      assert.ok(frames.length >= 2);
      for (const f of frames) {
        assert.equal(f.width, frames[0].width);
        assert.equal(f.height, frames[0].height);
        assert.ok(f.pixels.length > 0);
      }
    });

    test(`${def.name}: 그림 크기가 충돌 크기(반지름 ${def.radius})와 어울린다`, () => {
      const f = ENEMY_SPRITES[def.id][0];
      const size = Math.max(f.width, f.height);
      assert.ok(size >= def.radius * 1.6 && size <= def.radius * 2.6, `크기 ${size} 가 반지름 ${def.radius} 와 맞지 않음`);
    });

    test(`${def.name}: 프레임끼리 실제로 다르다 (걷는 동작)`, () => {
      const [a, b] = ENEMY_SPRITES[def.id];
      assert.notDeepEqual(a.pixels, b.pixels);
    });
  }

  test('적마다 서로 다른 그림을 쓴다', () => {
    const keys = all.map((d) => JSON.stringify(ENEMY_SPRITES[d.id][0].pixels));
    assert.equal(new Set(keys).size, all.length);
  });
});

describe('걷기 애니메이션 프레임', () => {
  test('초당 4프레임으로 0 → 1 → 0 → 1 을 번갈아 고른다', () => {
    assert.equal(walkFrame(0, 0, 2, 4), 0);
    assert.equal(walkFrame(0.24, 0, 2, 4), 0);
    assert.equal(walkFrame(0.25, 0, 2, 4), 1);
    assert.equal(walkFrame(0.5, 0, 2, 4), 0);
    assert.equal(walkFrame(0.75, 0, 2, 4), 1);
  });

  test('적 id 에 따라 박자가 어긋나서 모두가 똑같이 걷지 않는다', () => {
    assert.notEqual(walkFrame(0, 0, 2, 4), walkFrame(0, 1, 2, 4));
  });

  test('프레임 번호는 항상 0 이상 프레임 수 미만이다', () => {
    for (let t = 0; t < 10; t += 0.07) {
      for (let id = 0; id < 5; id++) {
        const f = walkFrame(t, id, 3, 6);
        assert.ok(Number.isInteger(f) && f >= 0 && f < 3);
      }
    }
  });
});

describe('바라보는 방향', () => {
  test('그림은 오른쪽을 보고 있으므로, 탑보다 오른쪽에 있는 적만 좌우를 뒤집는다', () => {
    assert.equal(facesLeft(400, 320), true);
    assert.equal(facesLeft(100, 320), false);
    assert.equal(facesLeft(320, 320), false, '탑과 같은 세로줄이면 뒤집지 않는다');
  });
});

describe('탑 도트 그림', () => {
  test('탑 그림은 탑 충돌 크기(지름)와 비슷하다', () => {
    const d = DEFAULT_CONFIG.tower.radius * 2;
    assert.ok(TOWER_SPRITE.width >= d * 0.8 && TOWER_SPRITE.width <= d * 1.4, `폭 ${TOWER_SPRITE.width}`);
    assert.ok(TOWER_SPRITE.height >= d && TOWER_SPRITE.height <= d * 1.8, `높이 ${TOWER_SPRITE.height}`);
  });
});
