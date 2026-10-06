/**
 * 표정 조각 (손찍기): 눈 · 눈썹 · 입 · 볼 · 눈물 · 안경 · 얼굴 가린 손.
 * 머리 본(peopleHeads.ts)의 닻(eyes · ey · mouth · cheeks)에 찍는다.
 *
 * 글자: E 눈동자 · e 눈동자 아래(밝은 갈색) · W 흰자 · 반짝 · l 속눈썹 · 감은 눈 · b 눈썹
 *       m 입술 · c 입꼬리 · D 벌린 입 · P 혀 · d 입 안 깊은 곳 · q 볼 · Q 볼 가장자리
 *       t T 눈물 · g 안경테 · L S s 손
 * 앞모습 왼눈 기준으로 그린 것은 오른눈 · 옆모습에 쓸 때 mirror 한다 (옆모습은 「바깥쪽 = 오른쪽」).
 */
import type { Grid } from '../grid.ts';

export interface Piece {
  g: Grid;
  /** 닻에서 격자 원점까지 */
  ox: number;
  oy: number;
}

/** 뜬 눈 (높이 3 · 2): 반짝은 왼 윗칸 (옆모습은 오른 윗칸) */
export const EYE_OPEN: Record<number, { front: Grid; side: Grid }> = {
  3: { front: ['WE', 'EE', 'ee'], side: ['EW', 'EE', 'ee'] },
  2: { front: ['WE', 'ee'], side: ['EW', 'ee'] },
};

/** 아래 조각들의 oy 는 눈 높이(eh)에 따라: 'bot' 는 눈 아랫줄 기준 */
export const FACE = {
  /** 바깥 속눈썹 한 칸 (왼눈: 눈 왼쪽 · 오른눈 · 옆: 눈 오른쪽) */
  lashL: { g: ['l'], ox: -1, oy: 0 },
  lashR: { g: ['l'], ox: 2, oy: 0 },
  /** 감은 눈 (아래로 둥근 선 + 바깥 끝 한 칸 위) : 눈 아랫줄 기준 */
  closedL: { g: ['l..', '.ll'], ox: -1, oy: -1 },
  closedR: { g: ['..l', 'll.'], ox: 0, oy: -1 },
  /** 웃는 눈 ∩ : 눈 아랫줄 기준 */
  smile: { g: ['.ll.', 'l..l'], ox: -1, oy: -1 },
  /** 내리깐 눈 : 눈 아랫줄 기준 */
  down: { g: ['ll', 'EE'], ox: 0, oy: -1 },
  /** 휘둥그레 (흰자 위로 한 칸 더) */
  wideL: { 3: ['WW', 'WE', 'WE', 'WE'], 2: ['WW', 'WE', 'WE'] } as Record<number, Grid>,
  wideR: { 3: ['WW', 'EW', 'EW', 'EW'], 2: ['WW', 'EW', 'EW'] } as Record<number, Grid>,
  /** 눈썹 (눈 윗줄 기준 위로 3칸부터): 슬픔은 안쪽이 올라가고, 화남은 안쪽이 내려간다 */
  browSadL: { g: ['.b', 'b.'], ox: 0, oy: -3 },
  browSadR: { g: ['b.', '.b'], ox: 0, oy: -3 },
  browAngryL: { g: ['b.', '.b'], ox: 0, oy: -3 },
  browAngryR: { g: ['.b', 'b.'], ox: 0, oy: -3 },
  /** 입 (입 닻: 앞모습은 두 칸 입의 왼칸 · 그 줄) */
  mouth: { g: ['mm'], ox: 0, oy: -1 },
  mouthSad: { g: ['.mm.', 'c..c'], ox: -1, oy: -1 },
  mouthOpen: { g: ['DDDD', '.PP.'], ox: -1, oy: -1 },
  mouthO: { g: ['dD', 'DD'], ox: 0, oy: -1 },
  sideMouth: { g: ['m'], ox: 0, oy: -1 },
  sideOpen: { g: ['D', 'P'], ox: 0, oy: -1 },
  sideO: { g: ['d', 'D'], ox: 0, oy: -1 },
  /** 볼 (볼 닻 · 눈 바로 아래 줄) */
  cheek: { g: ['qQ'], ox: 0, oy: 0 },
  sideCheek: { g: ['q'], ox: 0, oy: 0 },
  /** 눈물 (오른눈 아래) */
  tear: { g: ['t', 'T'], ox: 0, oy: 0 },
  /** 동그란 안경 (앞: 왼눈 기준 · 옆: 눈 기준), 눈 높이 2 */
  glasses: { g: ['.gg....gg.', 'g..gggg..g', 'g..g..g..g', '.gg....gg.'], ox: -1, oy: -1 },
  sideGlasses: { g: ['..gg.', 'gg..g', '....g', '..gg.'], ox: -2, oy: -1 },
  /** 두 손으로 얼굴을 가린다 (울기): 앞은 왼눈 왼쪽부터, 옆은 눈 왼쪽부터 */
  cryHands: { g: ['LLLLLLLLLL', 'SSSSsSSSSS', 'ssssssssss'], ox: -1, oy: 0 },
  sideCryHands: { g: ['LLLLL', 'SSSSs', 'sssss'], ox: -1, oy: 0 },
} satisfies Record<string, Piece | Record<number, Grid>>;
