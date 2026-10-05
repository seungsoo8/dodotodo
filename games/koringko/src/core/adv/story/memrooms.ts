/** 기억 속 방 (사람 크기): 하루의 방은 나이마다 꾸밈이 바뀐다 */
import type { RoomDef } from '../types.ts';
import { s } from '../parse.ts';
import { house, type F } from './kit.ts';

const W = 18;
const H = 11;

/** 하루의 방 기본 자리: 창 · 문 · 침대 · 장난감 상자 · 러그 */
function haruRoom(id: string, look: string, extra: F[], o: { bed?: string; window?: string; desk?: string; toybox?: string; shelf?: string; music?: string; noRug?: boolean } = {}): RoomDef {
  const f: F[] = [
    [`window:${o.window ?? ''}`, 7, 0, 3, 2],
    ['door', 1, 1, 1, 2],
    [`bed:${o.bed ?? ''}`, 14, 3, 3, 4, true],
    ...(o.noRug ? [] : ([['rug:#c8a0b0', 6, 5, 6, 3]] as F[])),
    ...(o.toybox !== undefined ? ([[`toybox:${o.toybox}`, 10, 8, 2, 1, true]] as F[]) : []),
    ...(o.desk !== undefined ? ([[`desk:${o.desk}`, 2, 3, 3, 1, true], ['chair', 3, 4, 1, 1, true]] as F[]) : []),
    ...(o.shelf !== undefined ? ([[`shelf:${o.shelf}`, 5, 3, 2, 1, true]] as F[]) : []),
    ...extra,
  ];
  return house(id, look, W, H, f, { music: o.music });
}

export const MEMORY_ROOMS: Record<string, () => RoomDef> = {
  // 4살: 아기 침대 대신 낮은 침대, 장난감 상자가 열려 있다
  m_room4: () => haruRoom('m_room4', 'haru4', [['cushion', 4, 7, 2, 2], ['plant', 12, 3, 1, 1, true]], { bed: '#ffe08a', toybox: 'open', window: 'day' }),
  // 5살: 비 오는 날
  m_room5: () => haruRoom('m_room5', 'haru4', [['cushion', 4, 7, 2, 2]], { bed: '#ffe08a', toybox: 'open', window: 'rain' }),
  // 7살: 생일 깃발
  m_room7: () => haruRoom('m_room7', 'haru7', [['garland', 2, 0, 5, 2], ['garland', 11, 0, 5, 2]], { bed: '#f8b0c8', toybox: 'open' }),
  // 8살
  m_room8: () => haruRoom('m_room8', 'haru7', [['photo', 11, 0, 2, 2]], { bed: '#a8d0f0', toybox: '', shelf: '' }),
  // 10살: 책상 · 종이별 병
  m_room10: () => haruRoom('m_room10', 'haru10', [['photo', 11, 0, 2, 2], ['calendar', 4, 0, 2, 2]], { bed: '#8ac0e8', desk: 'jar', toybox: '', shelf: '' }),
  // 12살: 비 오는 밤의 책상
  m_room12: () => haruRoom('m_room12', 'haru10', [['photo', 11, 0, 2, 2], ['calendar:x', 4, 0, 2, 2]], { bed: '#8ac0e8', desk: 'jar', toybox: '', shelf: '', window: 'rain' }),
  // 13살: 장례식 날 밤
  m_room13: () => haruRoom('m_room13', 'haru13', [['photo', 11, 0, 2, 2]], { bed: '#6a7a9a', desk: 'jar', toybox: 'label', shelf: '' }),
  // 15살: 이삿짐 상자 · 빈 벽
  m_room15: () => haruRoom('m_room15', 'haru15', [['boxes:tape', 2, 4, 2, 2, true], ['boxes', 5, 3, 2, 1, true], ['boxes:label', 10, 7, 2, 2, true], ['boxes', 12, 3, 1, 1, true]], { bed: '#c8c0b8', noRug: true }),
  // 할머니 방 (하루 10살 무렵 · 낮)
  m_gm: () =>
    house('m_gm', 'grandma', W, H, [
      ['door', 1, 1, 1, 2],
      ['window', 8, 0, 3, 2],
      ['photo', 4, 0, 2, 2],
      ['clock', 13, 0, 2, 2],
      ['sewing:thread', 2, 3, 3, 1, true],
      ['bed:#c8a0d8', 14, 3, 3, 4, true],
      ['wardrobe', 11, 3, 2, 1, true],
      ['rug:#a88ab8', 5, 5, 6, 3],
      ['table:tea', 6, 7, 3, 1, true],
      ['plant', 1, 8, 1, 1, true],
    ]),
  // 할머니 방 (14살 · 먼지 쌓인)
  m_gm14: () =>
    house('m_gm14', 'grandma14', W, H, [
      ['door:closed', 1, 1, 1, 2],
      ['window:dusk', 8, 0, 3, 2],
      ['photo', 4, 0, 2, 2],
      ['clock', 13, 0, 2, 2],
      ['sewing:dust', 2, 3, 3, 1, true],
      ['bed:#a890b0', 14, 3, 3, 4, true],
      ['wardrobe', 11, 3, 2, 1, true],
      ['rug:#8a7a98', 5, 5, 6, 3],
      ['boxes', 7, 8, 2, 1, true],
    ]),
  // 거실 (12살 · 비)
  m_living: () =>
    house('m_living', 'living', W, H, [
      ['window:rain', 5, 0, 4, 2],
      ['clock', 12, 0, 2, 2],
      ['tv', 10, 3, 3, 1, true],
      ['sofa:#7a8ab8', 3, 6, 4, 2, true],
      ['table:phone', 13, 5, 2, 2, true],
      ['rug:#b89a7a', 7, 5, 5, 3],
      ['plant', 16, 3, 1, 1, true],
    ]),
  // 거실 (8살 · 인형극)
  m_living8: () =>
    house('m_living8', 'living8', W, H, [
      ['window:day', 5, 0, 4, 2],
      ['clock', 12, 0, 2, 2],
      ['stage', 7, 3, 4, 2, true],
      ['sofa:#c8705a', 12, 7, 4, 2, true],
      ['cushion', 4, 7, 2, 2],
      ['cushion', 8, 7, 2, 2],
      ['rug:#d8a070', 3, 6, 9, 3],
      ['plant', 1, 3, 1, 1, true],
    ]),
  // 부엌 (7살 생일)
  m_kitchen: () =>
    house('m_kitchen', 'kitchen', W, H, [
      ['window:dusk', 3, 0, 3, 2],
      ['garland', 7, 0, 6, 2],
      ['calendar', 14, 0, 2, 2],
      ['table:cloth+cake', 7, 5, 4, 2, true],
      ['chair', 6, 5, 1, 1, true],
      ['chair', 11, 5, 1, 1, true],
      ['plant', 16, 3, 1, 1, true],
    ]),
  // 병원 (12살)
  m_hospital: () =>
    house('m_hospital', 'hospital', W, H, [
      ['window:rain', 3, 0, 3, 2],
      ['clock', 13, 0, 2, 2],
      ['hbed:gm', 8, 3, 3, 4, true],
      ['iv', 11, 3, 1, 1, true],
      ['chair', 6, 6, 1, 1, true],
      ['plant', 15, 3, 1, 1, true],
    ]),
  // 마당 (5살 · 비)
  m_yard: () =>
    house(
      'm_yard',
      'yard',
      22,
      12,
      [
        ['fence', 1, 1, 20, 1],
        ['flowers', 2, 2, 6, 1],
        ['flowers', 14, 2, 6, 1],
        ['bush', 17, 7, 3, 2, true],
        ['bush', 2, 8, 2, 2, true],
        ['puddle', 6, 5, 3, 2],
        ['puddle', 12, 8, 3, 2],
        ['mud', 15, 4, 3, 2],
      ],
      {
        wallH: 1,
        rain: true,
        things: [
          { kind: 'spot', id: 'y_flower', at: [5, 3], when: 'yard_search', unless: 'm8c_end', scene: s`haru: 꽃밭에도 없어… 토비야, 어디 있어?` },
          { kind: 'spot', id: 'y_puddle', at: [7, 7], when: 'yard_search', unless: 'm8c_end', scene: s`haru: 웅덩이에 빠졌나…? 아니야, 여기도 없어.` },
          { kind: 'spot', id: 'y_mud', at: [16, 4], when: 'yard_search', unless: 'm8c_end', scene: s`haru: 으, 진흙. 차가워… 토비도 추울 텐데.` },
          { kind: 'spot', id: 'y_bush', at: [4, 7], when: 'yard_search', unless: 'm8c_end', scene: s`haru: 작은 덤불… 없어. 개구리는 큰 덤불 쪽으로 갔는데.` },
          {
            kind: 'spot',
            id: 'y_found',
            at: [18, 9],
            when: 'yard_search',
            unless: 'm8c_end',
            scene: s`
              haru: …토비?
              @emote haru !
              > 큰 덤불 아래, 진흙투성이가 된 토비가 누워 있었다.
              @pose haru hug
              haru: 토비야! 토비야아…
              @pose haru cry
              haru: 미안해… 내가 떨어뜨려서… 춥지? 무서웠지?
              @walk gm 16 9 40
              @face gm haru
              gm: 찾았구나. 우리 하루, 용감했다.
              @pose haru hug
              haru: 할머니… 다시는 안 잃어버릴게. 평생.
              gm: 그래. 평생 꼭 붙잡고 있으렴.
              > 그날 밤, 할머니는 토비를 깨끗이 빨아 주셨다. 하루는 토비가 다 마를 때까지 그 옆에서 잠들었다.
              @wait 1
              @flag m8c_end
            `,
          },
        ],
      },
    ),
};
