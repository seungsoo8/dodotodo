/**
 * 사람 머리 본 (손으로 찍은 도트 틀): 투더문 · RPG 만들기 XP 캐릭터처럼
 * 둥근 머리 · 머리숱 · 윤기, 턱선과 목, 순한 눈 (작은 눈동자 + 흰 반짝).
 *
 * 글자 = 팔레트 칸 (사람마다 머리 · 살 색으로 바꿔 칠한다):
 *   .  투명
 *   H 머리 바탕 · h 머리 그늘 · d 머리 가장 어두운 결 · g 머리 밝음 · G 윤기
 *   S 살 · s 살 그늘 · n 살 깊은 그늘(턱 밑) · L 살 밝음
 *   p 머리 장식 (머리끈 · 비녀)
 * 눈 · 입 · 볼 · 안경은 표정마다 달라서 틀에 칠하지 않고 자리(닻)만 적는다.
 */
import { hex, type Color } from './paint.ts';
import { mat, warmMat, type Grid, type Palette } from './px/grid.ts';

export interface HeadTpl {
  /** 몸 위에 덮어 그리는 칸 (위에서 아래로, 모든 줄 폭이 같다) */
  rows: Grid;
  /** 몸보다 먼저 그리는 칸 (몸 뒤로 넘어가는 머리채). 같은 원점 */
  under?: Grid;
  /** 정수리에서 목 아래까지 줄 수 (몸통이 이 줄 바로 위에서 시작한다) */
  hd: number;
  /** 몸 가운데 선(x=16)에 맞추는 열 */
  ax: number;
  /** 눈 왼쪽 열들 (앞모습 둘, 옆모습 하나, 뒷모습 없음) · 눈 윗줄 · 눈 높이 */
  eyes: number[];
  ey: number;
  eh: number;
  /** 입 (앞모습: 2칸 입의 왼칸) */
  mouth: [number, number];
  /** 턱 끝 줄 */
  chin: number;
  /** 볼 자리 (앞모습 둘 · 옆모습 하나): 왼쪽 열 */
  cheeks?: number[];
  /** 속눈썹 (어른 여자) */
  lash?: boolean;
}

export type HeadSet = { down: HeadTpl; right: HeadTpl; up: HeadTpl };

// ───────────────────────── 열 살 하루: 단발 · 앞머리 ─────────────────────────
const KID_BOB: HeadSet = {
  down: {
    rows: [
      '....HHHHHH....',
      '..HHgGGgHHHH..',
      '.HHgGgHHHHHHh.',
      '.HgHHHHHHHHHh.',
      'HHgHHHHHHHHHhh',
      'HHHHHdHHHHdHhh',
      'HHHdSSdHHdSShh',
      'HhSSSSSSSSSShh',
      'HhSSSSSSSSSShh',
      'HhSSSSSSSSSshh',
      'HhSSSSSSSSSshh',
      'hhsSSSSSSSSshh',
      'hd.sSSSSSSs.dh',
      'hd..sSSSSs..dh',
      '.....snns.....',
      '.....ssss.....',
    ],
    hd: 16, ax: 7, eyes: [3, 9], ey: 8, eh: 3, mouth: [6, 12], chin: 13, cheeks: [2, 10],
  },
  right: {
    rows: [
      '...HHHHHH.....',
      '.HHgGGgHHH....',
      'HHgGgHHHHHH...',
      'HgHHHHHHHHHH..',
      'HgHHHHHHHHHHh.',
      'HHHHHHHHHdHHh.',
      'HHHHHHHHdSSdS.',
      'HHHHHHHhSSSSS.',
      'HHHHHHHhSSSSS.',
      'HHHHHHHhSSSSSS',
      'HHHHHHHhsSSSS.',
      'hHHHHHHhsSSSs.',
      'hHHHHHHd.sSSs.',
      'hhdhhdd..sSs..',
      '........sns...',
      '........sss...',
    ],
    hd: 16, ax: 9, eyes: [10], ey: 8, eh: 3, mouth: [11, 12], chin: 13, cheeks: [9],
  },
  up: {
    rows: [
      '....HHHHHH....',
      '..HHgGGgHHHH..',
      '.HHgGgHHHHHHh.',
      '.HgHHHHHHHHHh.',
      'HHgHHHHHHHHHhh',
      'HHHHHHHHHHHHhh',
      'HHHHHHHHHHHHhh',
      'HhHHHHHHHHHhhh',
      'HhHHHhHHHHHhhh',
      'HhHHhHHHhHHhhh',
      'HhhHHHHHHHhhhh',
      'hhhHHHHHHhhhdh',
      'hdhhhhhhhhhhdh',
      'hddhhdhhdhhddh',
      '.....snns.....',
      '.....ssss.....',
    ],
    hd: 16, ax: 7, eyes: [], ey: 8, eh: 3, mouth: [6, 12], chin: 13,
  },
};

// ───────────────────────── 열다섯 살 하루: 긴 생머리 · 옆으로 넘긴 앞머리 ─────────────────────────
const TEEN_LONG: HeadSet = {
  down: {
    rows: [
      '....HHHHHH....',
      '..HHGgHHHHHH..',
      '.HHGgHHHHHHHh.',
      '.HgHHHHHHHHHh.',
      'HHgHHHHHHHHHhh',
      'HHHHHHHHHHdHhh',
      'HHHHHHHdSSShhh',
      'HHHHddSSSSSShh',
      'HhdSSSSSSSSShh',
      'HhSSSSSSSSSShh',
      'HhSSSSSSSSSshh',
      'HhsSSSSSSSSshh',
      'Hh.sSSSSSSs.hh',
      'Hh..ssSSss..hh',
      'Hh...snns...hh',
      'hh...ssss...hh',
      'hh..........hh',
      'hh..........hh',
      'hd..........dh',
      '.d..........d.',
    ],
    hd: 16, ax: 7, eyes: [3, 9], ey: 9, eh: 2, mouth: [6, 12], chin: 13, cheeks: [2, 10], lash: true,
  },
  right: {
    rows: [
      '...HHHHHH.....',
      '.HHGgHHHHH....',
      'HHGgHHHHHHH...',
      'HgHHHHHHHHHH..',
      'HgHHHHHHHHHHh.',
      'HHHHHHHHHHHdh.',
      'HHHHHHHHHdSSh.',
      'HHHHHHHhdSSSS.',
      'HHHHHHHhSSSSS.',
      'HHHHHHHhSSSSSS',
      'HHHHHHHhsSSSS.',
      'HHHHHHHhsSSSs.',
      'HHHHHHhd.sSSs.',
      'HHHHHHh..ssS..',
      'HHHHHh..sns...',
      'hHHHHh..sss...',
      'hHHHh.........',
      'hhHHh.........',
      '.hhhd.........',
      '..dd..........',
    ],
    hd: 16, ax: 9, eyes: [10], ey: 9, eh: 2, mouth: [11, 12], chin: 13, cheeks: [9], lash: true,
  },
  up: {
    rows: [
      '....HHHHHH....',
      '..HHGgHHHHHH..',
      '.HHGgHHHHHHHh.',
      '.HgHHHHHHHHHh.',
      'HHgHHHHHHHHHhh',
      'HHHHHHHHHHHHhh',
      'HHHHHHHHHHHHhh',
      'HhHHHHHHHHHhhh',
      'HhHHHHhHHHHhhh',
      'HhHHHhHHHHHhhh',
      'HhHHHHHHHhHhhh',
      'HhHHHHHHhHHhhh',
      'HhHHHHHHHHHhhh',
      'HhHHHHHHHHHhhh',
      'HhhHHHHHHHhhhh',
      'hhhHHHHHHHhhhh',
      'hhhhHHHHHhhhhh',
      'hhhhhhhhhhhhdh',
      'hdhhdhhhdhhhdh',
      '.dd.dd.dd.dd..',
    ],
    hd: 16, ax: 7, eyes: [], ey: 9, eh: 2, mouth: [6, 12], chin: 13,
  },
};

// ───────────────────────── 엄마: 뒤로 묶은 머리 · 귀 · 옆가르마 ─────────────────────────
const WOMAN_PONY: HeadSet = {
  down: {
    rows: [
      '....HHHHHH....',
      '..HHGgHHHHHH..',
      '.HHGgHHHHHHHh.',
      '.HgHHHHHHHHHh.',
      '.HHHHHHHHHHhh.',
      'HHHHHHHHHHdhhh',
      'HhHHHddSSSShhh',
      'HhddSSSSSSSShh',
      'hhSSSSSSSSSShh',
      '.hSSSSSSSSSSh.',
      '.sSSSSSSSSSSs.',
      '..sSSSSSSSSs..',
      '...sSSSSSSs...',
      '....sSSSSs....',
      '.....snns.....',
      '.....ssss.....',
    ],
    hd: 16, ax: 7, eyes: [3, 9], ey: 9, eh: 2, mouth: [6, 12], chin: 13, cheeks: [2, 10], lash: true,
  },
  right: {
    rows: [
      '...HHHHHH.....',
      '.HHGgHHHHH....',
      'HHGgHHHHHHH...',
      'HgHHHHHHHHHH..',
      'HgHHHHHHHHHHh.',
      'HHHHHHHHHHHdh.',
      'HHHHHHHHHdSSS.',
      'HHHHHHhSSSSSS.',
      'pHHHHhSSSSSSS.',
      'HHHHHhSSSSSSSS',
      'hHHHhsSSSSSSS.',
      'HHhhhsSSSSSSs.',
      'HHh...sSSSSSs.',
      'HHh.....sSSs..',
      'Hh......sns...',
      'hh......sss...',
      'h.............',
    ],
    hd: 16, ax: 9, eyes: [10], ey: 9, eh: 2, mouth: [11, 12], chin: 13, cheeks: [9], lash: true,
  },
  up: {
    rows: [
      '....HHHHHH....',
      '..HHgGGgHHHH..',
      '.HHgGgHHHHHHh.',
      '.HgHHHHHHHHHh.',
      '.HHHHHHHHHHHh.',
      'HHHHhHHHHhHHhh',
      'HhHHHhHHhHHhhh',
      'HhHHHHhhHHHhhh',
      'HhhHHHHHHHhhhh',
      '.hhhHpppHhhhh.',
      '.ShhhHHHHhhhS.',
      '..hhhHHHhhhh..',
      '...hhHHHhhh...',
      '....nHHHhn....',
      '.....hHhs.....',
      '.....sdds.....',
    ],
    hd: 16, ax: 7, eyes: [], ey: 9, eh: 2, mouth: [6, 12], chin: 13,
  },
};

// ───────────────────────── 아빠: 짧은 머리 · 귀 · 넓은 턱 · 굵은 목 ─────────────────────────
const MAN_SHORT: HeadSet = {
  down: {
    rows: [
      '..............',
      '....HHHHHH....',
      '..HHGgHHHHHH..',
      '.HHGgHHHHHHHh.',
      '.HgHHHHHHHHHh.',
      '.HHHHHHHHHHHh.',
      '.HHHHHHHHHhhh.',
      '.HhHHHdSSSShh.',
      '.hddSSSSSSSSh.',
      '.sSSSSSSSSSSs.',
      '.sSSSSSSSSSSs.',
      '..SSSSSSSSSS..',
      '..sSSSSSSSSs..',
      '...ssSSSSss...',
      '....snnnns....',
      '....ssssss....',
    ],
    hd: 16, ax: 7, eyes: [3, 9], ey: 9, eh: 2, mouth: [6, 12], chin: 13, cheeks: [2, 10],
  },
  right: {
    rows: [
      '..............',
      '...HHHHHH.....',
      '.HHGgHHHHH....',
      'HHGgHHHHHHH...',
      'HgHHHHHHHHHH..',
      'HHHHHHHHHHHHh.',
      'HHHHHHHHHHHdh.',
      'HHHHHHHdSSSSS.',
      'hHHHHhSSSSSSS.',
      'hHHHhsSSSSSSSS',
      'hHHhssSSSSSSS.',
      '.hhhssSSSSSSs.',
      '..hh..sSSSSSs.',
      '.......sSSss..',
      '.......snns...',
      '.......ssss...',
    ],
    hd: 16, ax: 9, eyes: [10], ey: 9, eh: 2, mouth: [11, 12], chin: 13, cheeks: [9],
  },
  up: {
    rows: [
      '..............',
      '....HHHHHH....',
      '..HHgGGgHHHH..',
      '.HHgGgHHHHHHh.',
      '.HgHHHHHHHHHh.',
      '.HHHHHHHHHHHh.',
      '.HHHHHHHHHHHh.',
      '.HhHHHHHHHHhh.',
      '.HhHHHHHHHHhh.',
      '.hhHHHHHHHhhh.',
      '.hhhHHHHHHhhh.',
      '.Shhhhhhhhhhs.',
      '..shdhhhhdhs..',
      '...snSSSSns...',
      '....snnnns....',
      '....ssssss....',
    ],
    hd: 16, ax: 7, eyes: [], ey: 9, eh: 2, mouth: [6, 12], chin: 13,
  },
};

// ───────────────────────── 할머니: 은빛 쪽머리 · 물결 옆머리 · 안경 ─────────────────────────
const ELDER_BUN: HeadSet = {
  down: {
    rows: [
      '.....gGgh.....',
      '....gGHHHh....',
      '....HHHHhh....',
      '.....dhhd.....',
      '..HHgGgHHHHH..',
      '.HHgGHHHHHHHh.',
      '.HgHHHHHHHHHh.',
      'HHHHHHhHHHHHhh',
      'HHHhhSSSShhhhh',
      'HhhSSSSSSSShhh',
      'HhSSSSSSSSSShh',
      'hhSSSSSSSSSShh',
      '.hSSSSSSSSSSh.',
      '..SSSSSSSSSS..',
      '...sSSSSSSs...',
      '....ssSSss....',
      '.....snns.....',
      '.....ssss.....',
    ],
    hd: 18, ax: 7, eyes: [3, 9], ey: 11, eh: 2, mouth: [6, 14], chin: 15, cheeks: [2, 10],
  },
  right: {
    rows: [
'.gGgh.........',
      'gGHHHh........',
      'HHHHhh........',
      '.dhhd.........',
      '.HHHgGgHH.....',
      'HHHgGHHHHHH...',
      'HHgHHHHHHHHH..',
      'HHHHHHHHHHHHh.',
      'HHHHHHHHHhhhh.',
      'HHHHHHhhSSSSS.',
      'HHHHHhSSSSSSS.',
      'hHHHhsSSSSSSSS',
      'hHHhssSSSSSSS.',
      '.hhhssSSSSSSs.',
      '..h...sSSSSs..',
      '.......sSSs...',
      '.......snns...',
      '.......ssss...',
    ],
    hd: 18, ax: 9, eyes: [10], ey: 11, eh: 2, mouth: [11, 14], chin: 15, cheeks: [9],
  },
  up: {
    rows: [
      '.....gGgh.....',
      '....gHHHHh....',
      '....HHHhhh....',
      '....pdhhdp....',
      '..HHgGgHHHHH..',
      '.HHgGHHHHHHHh.',
      '.HgHHHHHHHHHh.',
      'HHHHHhHHHHHHhh',
      'HHHHHHhHHHHHhh',
      'HhHHHHHhHHHhhh',
      'HhHHHHHHhHHhhh',
      'HhhHHHHHHHhhhh',
      '.hhHHHHHHHhhh.',
      '.Shhhhhhhhhhs.',
      '..shdhhhhdhs..',
      '....nSSSSn....',
      '.....snns.....',
      '.....ssss.....',
    ],
    hd: 18, ax: 7, eyes: [], ey: 11, eh: 2, mouth: [6, 14], chin: 15,
  },
};

// ───────────────────────── 네 · 다섯 살 하루: 짧은 머리 · 정수리 삐침 (작은 머리 15줄) ─────────────────────────
const KID_TUFT: HeadSet = {
  down: {
    rows: [
      '......Hh......',
      '....HHHHHH....',
      '..HHgGGgHHHH..',
      '.HHgGHHHHHHHh.',
      '.HgHHHHHHHHHh.',
      'HHHHHdHHHdHHhh',
      'HhHdSSdHdSSShh',
      'HhSSSSSSSSSShh',
      'hhSSSSSSSSSShh',
      'shSSSSSSSSSShs',
      '.sSSSSSSSSSSs.',
      '..sSSSSSSSSs..',
      '....sSSSSs....',
      '.....snns.....',
      '.....ssss.....',
    ],
    hd: 15, ax: 7, eyes: [3, 9], ey: 7, eh: 3, mouth: [6, 11], chin: 12, cheeks: [2, 10],
  },
  right: {
    rows: [
      '.....Hh.......',
      '...HHHHHH.....',
      '.HHgGGgHHH....',
      'HHgGgHHHHHH...',
      'HgHHHHHHHHHH..',
      'HHHHHHHHHdHHh.',
      'HHHHHHHHdSSdS.',
      'HHHHHHhSSSSSS.',
      'hHHHHhSSSSSSSS',
      'hHHHhsSSSSSSS.',
      '.hHhSsSSSSSSs.',
      '..hh.ssSSSSSs.',
      '.......sSSs...',
      '........sns...',
      '........sss...',
    ],
    hd: 15, ax: 9, eyes: [10], ey: 7, eh: 3, mouth: [11, 11], chin: 12, cheeks: [9],
  },
  up: {
    rows: [
      '......Hh......',
      '....HHHHHH....',
      '..HHgGGgHHHH..',
      '.HHgGgHHHHHHh.',
      '.HgHHHHHHHHHh.',
      'HHHHHHHHHHHHhh',
      'HhHHHHhHHHHhhh',
      'HhHHHHHHhHHhhh',
      'hhhHHHHHHHhhhh',
      'shhhhHHHhhhhhs',
      '.Shhhhhhhhhhs.',
      '..shhhhhhhhs..',
      '...snhhhhns...',
      '.....snns.....',
      '.....ssss.....',
    ],
    hd: 15, ax: 7, eyes: [], ey: 7, eh: 3, mouth: [6, 11], chin: 12,
  },
};

// ───────────────────────── 여섯~아홉 살 하루 · 은주 · 지우: 묶은 머리 (머리끈 p) ─────────────────────────
const KID_PONY: HeadSet = {
  down: {
    rows: [
      '....HHHHHH....',
      '..HHgGGgHHHH..',
      '.HHgGgHHHHHHh.',
      '.HgHHHHHHHHHh.',
      'HHgHHHHHHHHHhh',
      'HHHHHdHHHHdHhh',
      'HHHdSSdHHdSShh',
      'HhSSSSSSSSSShh',
      'hhSSSSSSSSSShh',
      'shSSSSSSSSSShs',
      'sSSSSSSSSSSSSs',
      '.sSSSSSSSSSSs.',
      '..sSSSSSSSSs..',
      '....sSSSSs....',
      '.....snns.....',
      '.....ssss.....',
    ],
    hd: 16, ax: 7, eyes: [3, 9], ey: 8, eh: 3, mouth: [6, 12], chin: 13, cheeks: [2, 10],
  },
  right: { ...WOMAN_PONY.right, ey: 8, eh: 3, lash: false },
  up: { ...WOMAN_PONY.up, ey: 8, eh: 3 },
};

export const HEAD_SETS = { kidTuft: KID_TUFT, kidPony: KID_PONY, kidBob: KID_BOB, teenLong: TEEN_LONG, womanPony: WOMAN_PONY, manShort: MAN_SHORT, elderBun: ELDER_BUN } as const;
export type HeadKind = keyof typeof HEAD_SETS;

/** 틀의 글자 → 색 (머리 · 살 · 장식): 공용 격자 문법 (px/grid.ts) 의 재질 다섯 단계 */
export function headPalette(hair: Color, skin: Color, pin: Color): Palette {
  return { ...mat('GgHhd', hair), ...warmMat('.LSsn', skin, hex('#a85a50')), p: pin };
}
