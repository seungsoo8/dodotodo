/**
 * 집 밖 기억 방 (사람 크기): 골목 · 학교 가는 길 · 놀이터 · 병원 앞 · 순이의 옛 마을.
 * 모두 22×12, 위 한 줄만 담 (wallH 1). 위쪽 띠(1~3줄)에 담 · 대문 · 건물 앞면이 붙고, 가운데는 넓은 길.
 * 같은 장소의 낮 · 해 질 녘 방은 가구 자리가 같다 (한 함수로 짓는다).
 */
import type { RoomDef } from '../types.ts';
import { house, type F } from './kit.ts';

const W = 22;
const H = 12;

/** 하루네 집 앞 골목: 이웃 담 · 파란 대문 (하루네) · 하루네 담 · 구멍가게 · 전봇대 · 가로등 */
function alley(id: string, look: string, music: string): RoomDef {
  const f: F[] = [
    ['nwall:red:ivy', 1, 1, 5, 2, true],
    ['gate', 6, 1, 3, 2, true],
    ['nwall:blue', 9, 1, 5, 2, true],
    ['shop', 14, 1, 7, 3, true],
    ['lamp', 5, 3, 1, 1, true],
    ['pole:l7r7', 13, 3, 1, 1, true],
    ['pots', 1, 10, 3, 1, true],
    ['bush', 8, 10, 2, 1, true],
    ['bike:#5a9ad8', 18, 10, 2, 1, true],
  ];
  return house(id, look, W, H, f, { wallH: 1, music, start: [7, 6] });
}

/** 학교 가는 길: 철망 담 · 학교 정문 · 은행나무 가로수 · 어린이 보호구역 표지판 · 찻길과 횡단보도 · 버스 정류장 */
function schoolRoad(id: string, look: string, music: string): RoomDef {
  const f: F[] = [
    ['nwall:mesh', 1, 1, 6, 2, true],
    ['bldg:school', 7, 1, 8, 3, true],
    ['nwall:mesh', 15, 1, 6, 2, true],
    ['tree:ginkgo', 2, 3, 1, 1, true],
    ['tree:ginkgo', 18, 3, 1, 1, true],
    ['signpost:school', 6, 4, 1, 1, true],
    ['road', 1, 7, 20, 2],
    ['crosswalk', 9, 7, 4, 2],
    ['lamp', 4, 10, 1, 1, true],
    ['busstop', 15, 10, 2, 1, true],
    ['tree:ginkgo', 20, 10, 1, 1, true],
  ];
  return house(id, look, W, H, f, { wallH: 1, music, start: [11, 9] });
}

/** 동네 놀이터: 미끄럼틀 · 벤치 · 가로등 · 그네 · 모래밭 · 시소 · 정글짐 · 큰 나무 */
function park(id: string, look: string, music: string): RoomDef {
  const f: F[] = [
    ['tree', 1, 3, 1, 1, true],
    ['slide', 3, 2, 3, 2, true],
    ['bench', 8, 2, 2, 1, true],
    ['lamp', 11, 3, 1, 1, true],
    ['swingset', 13, 3, 4, 1, true],
    ['tree', 20, 3, 1, 1, true],
    ['sandbox', 7, 5, 5, 3],
    ['seesaw', 2, 8, 3, 1, true],
    ['jungle', 16, 7, 3, 2, true],
    ['bench', 9, 10, 2, 1, true],
    ['bush', 13, 10, 2, 1, true],
  ];
  return house(id, look, W, H, f, { wallH: 1, music, start: [11, 9] });
}

/** 병원 정문 앞 (비): 정문 · 화단 · 가로수 · 젖은 벤치 · 가로등 · 웅덩이 · 찻길 · 버스 정류장 */
function hospitalFront(id: string, look: string, music: string): RoomDef {
  const f: F[] = [
    ['nwall:low', 1, 1, 5, 2, true],
    ['bldg:hospital', 6, 1, 10, 3, true],
    ['nwall:low', 16, 1, 5, 2, true],
    ['tree', 2, 3, 1, 1, true],
    ['tree', 19, 3, 1, 1, true],
    ['lamp', 5, 4, 1, 1, true],
    ['lamp', 16, 4, 1, 1, true],
    ['bench:wet', 3, 5, 2, 1, true],
    ['bench:wet', 17, 5, 2, 1, true],
    ['puddle', 8, 5, 2, 1],
    ['puddle', 13, 6, 2, 1],
    ['road', 1, 8, 20, 2],
    ['puddle', 3, 10, 2, 1],
    ['busstop', 17, 10, 2, 1, true],
  ];
  return house(id, look, W, H, f, { wallH: 1, music, rain: true, start: [11, 6] });
}

/** 순이의 일곱 살 옛 마을 (1950~60년대): 초가집 · 툇마루 · 돌담 · 장독대 · 우물 · 감나무 · 흙길 바큇자국 · 리어카 · 이정표 */
function village(id: string, look: string, music: string): RoomDef {
  const f: F[] = [
    ['thatch', 2, 1, 9, 3, true],
    ['stonewall', 11, 2, 10, 1, true],
    ['crocks', 12, 3, 2, 1, true],
    ['well', 15, 4, 2, 1, true],
    ['tree:persimmon', 19, 4, 1, 1, true],
    ['ruts', 1, 6, 20, 2],
    ['cart:load', 4, 8, 2, 1, true],
    ['signpost', 17, 8, 1, 1, true],
    ['bush', 1, 10, 2, 1, true],
    ['bush', 13, 10, 3, 1, true],
  ];
  return house(id, look, W, H, f, { wallH: 1, music, start: [10, 9] });
}

export const OUT_MEMROOMS: Record<string, () => RoomDef> = {
  m_out_alley: () => alley('m_out_alley', 'alley', 'box'),
  m_out_alley_d: () => alley('m_out_alley_d', 'alleyDusk', 'longing'),
  m_out_school: () => schoolRoad('m_out_school', 'schoolRoad', 'piano'),
  m_out_park: () => park('m_out_park', 'playground', 'waltz'),
  m_out_park_d: () => park('m_out_park_d', 'playgroundDusk', 'longing'),
  m_out_hosp: () => hospitalFront('m_out_hosp', 'hospitalFront', 'rain'),
  m_out_village: () => village('m_out_village', 'village', 'box'),
  m_out_village_d: () => village('m_out_village_d', 'villageDusk', 'night'),
};
