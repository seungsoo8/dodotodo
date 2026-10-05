/**
 * 사람 몸 손찍기 본: 다리 · 몸통 · 치마 · 옷 꾸밈 · 앉은 무릎.
 * 모두 「앞(=뒤)모습」과 「오른쪽을 보는 옆모습」 두 가지. 왼쪽은 그림 전체를 뒤집는다.
 *
 * 글자 (사람 팔레트, people.ts 의 bodyPalette):
 *   윗옷 U 밝음 · C 바탕 · c 그늘 · e 깊은 그늘     장식 T · t (테 · 깃 · 끈)  W 흰 깃
 *   바지 V 밝음 · B 바탕 · b 그늘 · v 깊은 그늘     허리띠 R · 버클 Q
 *   아래옷 (치마 · 원피스 자락 · 앉은 무릎) M 밝음 · N 바탕 · m 그늘 · r 주름 · J 허리 · k 단
 *   양말 · 발목 O · o     신발 X 반짝 · Z 바탕 · z 바닥     살 L S s n
 * 늘이는 줄(sr) · 열(sc)은 키에 맞춰 되풀이한다 (stretchRow · stretchCol).
 */
import type { Grid } from '../grid.ts';

export interface Part {
  g: Grid;
  /** 늘이는 줄 (여럿이면 차례로 위쪽 · 아래쪽) */
  sr?: number[];
  sc?: number;
}

// ───────────── 다리 (허리 아래 엉덩이 줄 + 다리 + 신발). 맨 아래 줄이 발바닥 ─────────────
// sr[0] = 엉덩이 줄 (윗옷 밑단 ~ 다리 시작), sr[1] = 다리 줄
export const LEGS: Record<string, Part> = {
  // 앞(뒤)모습은 엉덩이 줄 + 왼다리 + 오른다리를 따로 찍는다 (걸을 때 한쪽 발만 든다)
  pantsHips10: { g: ['.VBBBBBBb.'] },
  pantsL10: { g: ['.VBb', '.VBb', '.OOo', 'XZZz', 'zzzz'], sr: [1] },
  pantsR10: { g: ['VBb.', 'VBb.', 'OOo.', 'XZZz', 'zzzz'], sr: [1] },
  pantsHips12: { g: ['.VBBBBBBBBb.'] },
  pantsL12: { g: ['.VBbb', '.VBbb', '.OOoo', 'XZZZz', 'zzzzz'], sr: [1] },
  pantsR12: { g: ['VBbb.', 'VBbb.', 'OOoo.', 'XZZZz', 'zzzzz'], sr: [1] },
  // 맨다리 (치마 · 원피스 아래): 엉덩이 줄은 치마에 가린다, 아이는 흰 양말
  bareHips10: { g: ['..SSSSSS..'] },
  bareL10: { g: ['.Ss', '.Ss', '.OO', 'XZz', 'zzz'], sr: [1] },
  bareR10: { g: ['Ss.', 'Ss.', 'OO.', 'XZz', 'zzz'], sr: [1] },
  bareHips12: { g: ['..SSSSSSSS..'] },
  bareL12: { g: ['.LSs', '.LSs', '.OOo', 'XZZz', 'zzzz'], sr: [1] },
  bareR12: { g: ['LSs.', 'LSs.', 'OOo.', 'XZZz', 'zzzz'], sr: [1] },
  // 옆모습: 서기 (몸통 폭 6 · 8 공용, 다리 한 짝만 보인다)
  side: {
    g: [
      '..VBBBb.',
      '...VBb..',
      '...OOo..',
      '...XZZz.',
      '...zzzzz',
    ],
    sr: [0, 1],
  },
  sideWide: {
    g: [
      '.VBBBBBb.',
      '..VBBbb..',
      '..OOOoo..',
      '..XZZZZz.',
      '..zzzzzzz',
    ],
    sr: [0, 1],
  },
};

/** 옆모습 걸음 (앞다리 밝게 · 뒷다리 어둡게): 다리 길이 7 · 10 · 13 짜리, 남는 길이는 엉덩이 줄(0)로 */
export const STRIDE: Record<number, { a: Grid; b: Grid }> = {
  7: {
    a: [
      '..VBBBb...',
      '..vbVBb...',
      '.vbb.VBb..',
      '.vbb.VBb..',
      '.ooo..OOo.',
      'zZz...XZZz',
      'zzz...zzzz',
    ],
    b: [
      '..VBBBb...',
      '..VBvbb...',
      '.VBb.vbb..',
      '.VBb.vbb..',
      '.OOo..ooo.',
      'XZz...zZzz',
      'zzz...zzzz',
    ],
  },
  10: {
    a: [
      '...VBBBb...',
      '...VBBBb...',
      '...vbVBb...',
      '..vbbVBb...',
      '..vbb.VBb..',
      '..vbb.VBb..',
      '.vbb...VBb.',
      '.ooo...OOo.',
      'zZz....XZZz',
      'zzz....zzzz',
    ],
    b: [
      '...VBBBb...',
      '...VBBBb...',
      '...VBvbb...',
      '..VBbvbb...',
      '..VBb.vbb..',
      '..VBb.vbb..',
      '.VBb...vbb.',
      '.OOo...ooo.',
      'XZz....zZzz',
      'zzz....zzzz',
    ],
  },
  13: {
    a: [
      '....VBBBb....',
      '....VBBBb....',
      '....vbVBb....',
      '...vbbVBb....',
      '...vbb.VBb...',
      '...vbb.VBb...',
      '..vbb...VBb..',
      '..vbb...VBb..',
      '.vbb.....VBb.',
      '.vbb.....VBb.',
      '.ooo.....OOo.',
      'zZz......XZZz',
      'zzz......zzzz',
    ],
    b: [
      '....VBBBb....',
      '....VBBBb....',
      '....VBvbb....',
      '...VBbvbb....',
      '...VBb.vbb...',
      '...VBb.vbb...',
      '..VBb...vbb..',
      '..VBb...vbb..',
      '.VBb.....vbb.',
      '.VBb.....vbb.',
      '.OOo.....ooo.',
      'XZz......zZzz',
      'zzz......zzzz',
    ],
  },
};

/** 앉은 무릎 (앞모습: 허벅지가 앞으로 · 옆모습: 허벅지가 가로로). 아래옷 색 */
export const LAP: Record<string, Part> = {
  front10: {
    g: [
      '.MNNNNNNm.',
      'MNNNNNNNmm',
      'MNNNmNNNmm',
      '.mmm..mmm.',
    ],
  },
  front12: {
    g: [
      '.MNNNNNNNNm.',
      'MNNNNNNNNNmm',
      'MNNNNmNNNNmm',
      '.mmmm..mmmm.',
    ],
  },
  side: {
    g: [
      '.MNNNNNNm..',
      'MNNNNNNNNm.',
      'MNNNNNNNNNm',
      'rmmmmmmmXZz',
    ],
    sc: 4,
  },
};

// ───────────── 몸통 (윗옷: 목 아래 ~ 허리 · 원피스는 치마 시작까지) ─────────────
export const TORSO: Record<string, Part> = {
  w10: {
    g: [
      '...UCCc...',
      '.UUCCCCcc.',
      'UUCCCCCCcc',
      'UCCCCCCCcc',
      'UCCCCCCCcc',
      '.ecccccce.',
    ],
    sr: [3],
  },
  slim10: {
    g: [
      '...UCCc...',
      '.UUCCCCcc.',
      'UUCCCCCCcc',
      'UCCCCCCCcc',
      '.UCCCCCCc.',
      '.UCCCCCCc.',
      'UCCCCCCCcc',
      '.ecccccce.',
    ],
    sr: [3],
  },
  w12: {
    g: [
      '....UCCc....',
      '.UUUCCCCCcc.',
      'UUUCCCCCCccc',
      'UUCCCCCCCccc',
      'UCCCCCCCCccc',
      '.ecccccccce.',
    ],
    sr: [3],
  },
  side6: {
    g: [
      '..UCc.',
      '.UCCCc',
      'UCCCCc',
      'UCCCCc',
      '.eccce',
    ],
    sr: [2],
  },
  side8: {
    g: [
      '..UCCc..',
      '.UCCCCc.',
      'UCCCCCcc',
      'UCCCCCcc',
      '.ecccce.',
    ],
    sr: [2],
  },
};

// ───────────── 치마 · 원피스 자락 · 비옷 자락 (허리 줄 J, 늘이는 줄 1, 단 k) ─────────────
export const SKIRT: Record<string, Part> = {
  w10: {
    g: [
      '.JJJJJJJJJj.',
      '.MNNmNNmNNm.',
      'MNNNmNNmNNmm',
      'kkkkkkkkkkkk',
    ],
    sr: [1],
  },
  w12: {
    g: [
      '.JJJJJJJJJJJj.',
      '.MNNmNNmNNmNm.',
      'MNNNmNNmNNmNmm',
      'kkkkkkkkkkkkkk',
    ],
    sr: [1],
  },
  side6: {
    g: [
      '.JJJJJj.',
      '.MNNmNm.',
      'MNNmNNmm',
      'kkkkkkkk',
    ],
    sr: [1],
  },
  side8: {
    g: [
      '.JJJJJJj..',
      '.MNNmNNm..',
      'MNNmNNmNm.',
      'kkkkkkkkkk',
    ],
    sr: [1],
  },
};

// ───────────── 옷 꾸밈 (몸통 위에만 찍는다: paintGridOn). top = 몸통 윗줄 기준, bot = 몸통 아랫줄 기준 ─────────────
export interface Deco {
  top?: Grid;
  bot?: Grid;
}
type DecoSet = { front?: Deco; back?: Deco; side?: Deco };

const STRIPES = (w: number, n = 18) => Array.from({ length: n }, (_, i) => (i % 3 === 1 ? 'T'.repeat(w) : i % 3 === 2 ? 't'.repeat(w) : '.'.repeat(w)));

/** 옷 모양별 꾸밈 (폭 10 기준; 폭 12 는 가운데 맞춰 한 칸씩 띄운다) */
export const DECO: Record<string, DecoSet> = {
  tee: {
    front: { top: ['...eSSe...', '....ee....', '..........', '....TT....', '....Tt....'] },
    back: { top: ['....ee....'] },
    side: { top: ['...ee.'] },
  },
  hoodie: {
    front: { top: ['..eSSSSe..', '..ceeeec..', '....TT....', '....TT....', '....tt....'], bot: ['..cccccc..', '..cCCCCc..', '..........'] },
    back: { top: ['..cccccc..', '..cCCCCe..', '...eeee...'] },
    side: { top: ['ecc...', 'eCc...', '.ee...'] },
  },
  shirt: {
    front: { top: ['...TSST...', '...TTTT...', '....TT....', '..........', '.....e....', '..........', '..........', '.....e....'], bot: ['RRRRRQRRRR'] },
    back: { top: ['...eeee...'], bot: ['RRRRRRRRRR'] },
    side: { top: ['...TT.', '....T.'], bot: ['RRRRRR'] },
  },
  uniform: {
    front: { top: ['.WWSSSSWW.', '..WWSSWW..', '...WWWW...', '....TT....', '....TT....', '...t..t...'] },
    back: { top: ['.WWWWWWWW.', '.WWWWWWWW.', '.WWWWWWWW.', '.TTTTTTTT.'] },
    side: { top: ['WWW.S.', 'WWW.T.', 'TTT.T.'] },
  },
  black: {
    front: { top: ['..TT..TT..', '..TT..TT..', '..........', '....U.....', '..........', '..........', '....U.....'] },
    back: { top: ['...TTTT...'] },
    side: { top: ['...TT.', '...TT.', '......', '....U.'] },
  },
  cardigan: {
    front: { top: ['...TTTT...', '...TTTT...', '..eTTTTe..', '...TTTT...', '...TttT...', '..e....e..'], bot: ['.cc....cc.', '.cc....cc.', '..........'] },
    side: { top: ['....TT', '....TT', '...eTT', '....Tt'] },
  },
  raincoat: {
    front: { top: ['...TTTT...', '..........', '....T.....', '..........', '..........', '....T.....'] },
    side: { top: ['...TT.', '......', '....T.'] },
  },
  dress: {
    front: { top: ['..TSSSST..', '..T....T..'] },
    back: { top: ['...TTTT...'] },
    side: { top: ['...TT.', '...T..'] },
  },
  stripe: {
    front: { top: ['...tSSt...', ...STRIPES(10).slice(1)] },
    back: { top: ['...tttt...', ...STRIPES(10).slice(1)] },
    side: { top: ['...tt.', ...STRIPES(6).slice(1)] },
  },
  overalls: {
    front: { top: ['..........', '..V....b..', '..V....b..', '..QBBBBQ..', '..VBBBBb..', '..VBvvBb..', '..VBBBBb..', '..VBBBBb..', '..VBBBBb..', '..VBBBBb..', '..VBBBBb..'] },
    back: { top: ['..........', '...V..b...', '....VB....', '...VBBb...', '..VBBBBb..', '..VBBBBb..', '..VBBBBb..', '..VBBBBb..'] },
    side: { top: ['......', '..V...', '..V...', '.VBBBb', '.VBBBb', '.VBBBb', '.VBBBb', '.VBBBb'] },
  },
};
