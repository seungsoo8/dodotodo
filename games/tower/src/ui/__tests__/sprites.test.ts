import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { BOSSES, ENEMIES, LEGENDARY_WEAPONS, SLIMELET, WEAPONS } from '../../core/data.ts';
import { ENEMY_SCALE, ENEMY_SPRITES, ICONS, TOWER_SCALE, PROJECTILES, PROPS, SKILL_ICONS, WEAPON_ICONS, TOWER_SPRITE, facesLeft, grid, parseSprite, walkFrame } from '../sprites.ts';
import { WEAPON_FX } from '../weaponfx.ts';
import { ALL_SKILLS } from '../../core/skills.ts';
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
  const all = [...ENEMIES, ...BOSSES, SLIMELET];

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

    test(`${def.name}: 화면에 그리는 크기(그림 × ${ENEMY_SCALE})가 충돌 크기(반지름 ${def.radius})와 어울린다`, () => {
      const f = ENEMY_SPRITES[def.id][0];
      const size = Math.max(f.width, f.height) * ENEMY_SCALE;
      assert.ok(size >= def.radius * 1.6 && size <= def.radius * 2.6, `크기 ${size} 가 반지름 ${def.radius} 와 맞지 않음`);
    });

    test(`${def.name}: 프레임끼리 실제로 다르다 (걷는 동작)`, () => {
      const [a, b] = ENEMY_SPRITES[def.id];
      assert.notDeepEqual(a.pixels, b.pixels);
    });
  }

  test('작은 적도 화면 높이(360)의 5% 이상, 보스는 14% 이상으로 보인다', () => {
    for (const def of [...ENEMIES, SLIMELET]) {
      const f = ENEMY_SPRITES[def.id][0];
      assert.ok(Math.max(f.width, f.height) * ENEMY_SCALE >= 360 * 0.05 || def.id === 'slimelet', `${def.name} 너무 작음`);
    }
    for (const def of BOSSES) {
      const f = ENEMY_SPRITES[def.id][0];
      assert.ok(f.height * ENEMY_SCALE >= 360 * 0.14 || f.width * ENEMY_SCALE >= 360 * 0.14, `${def.name} 너무 작음`);
    }
  });

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
  test(`화면에 그리는 탑(그림 × ${TOWER_SCALE})은 탑 충돌 크기(지름)와 비슷하다`, () => {
    const d = DEFAULT_CONFIG.tower.radius * 2;
    const w = TOWER_SPRITE.width * TOWER_SCALE;
    const h = TOWER_SPRITE.height * TOWER_SCALE;
    assert.ok(w >= d * 0.8 && w <= d * 1.4, `폭 ${w}`);
    assert.ok(h >= d && h <= d * 1.8, `높이 ${h}`);
  });

  test('탑은 가장 큰 잡몹(골렘)보다 크게 보인다', () => {
    const golem = ENEMY_SPRITES.golem[0];
    assert.ok(TOWER_SPRITE.height * TOWER_SCALE > golem.height * ENEMY_SCALE * 1.3);
  });
});

describe('아이콘', () => {
  test('무기 계열 5종·강화·코인·하트 아이콘이 모두 9×9 크기로 있다', () => {
    for (const id of ['normal', 'pierce', 'magic', 'siege', 'chaos', 'upgrade', 'coin', 'heart']) {
      const icon = ICONS[id];
      assert.ok(icon, `${id} 아이콘 없음`);
      assert.equal(icon.width, 9);
      assert.equal(icon.height, 9);
      assert.ok(icon.pixels.length >= 10, `${id} 가 너무 비어 있음`);
    }
  });
});

describe('투사체 도트 그림', () => {
  test('연출 사양에 쓰인 모든 투사체에 그림이 있고, 3~16픽셀 크기다', () => {
    const kinds = new Set(Object.values(WEAPON_FX).flatMap((f) => (f.projectile ? [f.projectile] : [])));
    assert.ok(kinds.size >= 10);
    for (const k of kinds) {
      const s = PROJECTILES[k];
      assert.ok(s, `${k} 그림 없음`);
      assert.ok(s.width >= 3 && s.width <= 16 && s.height >= 3 && s.height <= 16, `${k} 크기 ${s.width}x${s.height}`);
      assert.ok(s.pixels.length >= 5, `${k} 가 너무 비어 있음`);
    }
  });

  test('화살류는 가로로 길다 (오른쪽을 향한 그림을 진행 방향으로 돌린다)', () => {
    for (const k of ['arrow', 'galeArrow', 'bolt'] as const) {
      assert.ok(PROJECTILES[k].width > PROJECTILES[k].height * 2, k);
    }
  });
});

describe('무기별 아이콘', () => {
  const all = [...WEAPONS, ...LEGENDARY_WEAPONS];

  test('모든 무기(전설 포함)가 자기 아이콘을 가진다', () => {
    for (const w of all) assert.ok(WEAPON_ICONS[w.id], `${w.name} 아이콘 없음`);
  });

  test('아이콘은 모두 11×11 이고 비어 있지 않다', () => {
    for (const w of all) {
      const s = WEAPON_ICONS[w.id];
      assert.equal(s.width, 11, w.id);
      assert.equal(s.height, 11, w.id);
      assert.ok(s.pixels.length >= 15, `${w.id} 점 ${s.pixels.length}개`);
    }
  });

  test('무기마다 서로 다른 그림이다', () => {
    const keys = all.map((w) => JSON.stringify(WEAPON_ICONS[w.id].pixels));
    assert.equal(new Set(keys).size, all.length);
  });
});

describe('전장 소품', () => {
  test('나무·덤불·바위 그림이 있고 크기가 전장 소품답게 작다', () => {
    for (const key of ['tree', 'pine', 'bush', 'rock'] as const) {
      const s = PROPS[key];
      assert.ok(s.pixels.length > 0, key);
      assert.ok(s.width <= 16 && s.height <= 20, `${key} ${s.width}×${s.height}`);
    }
  });
});

describe('스킬 아이콘', () => {
  test('스킬 13종(기본 6 · 합체 7) 모두 서로 다른 9×9 아이콘이 있다', () => {
    const keys = new Set<string>();
    for (const k of ALL_SKILLS) {
      const icon = SKILL_ICONS[k.id];
      assert.ok(icon, `${k.name} 아이콘 없음`);
      assert.equal(icon.width, 9);
      assert.equal(icon.height, 9);
      keys.add(JSON.stringify(icon.pixels));
    }
    assert.equal(keys.size, ALL_SKILLS.length);
  });
});
