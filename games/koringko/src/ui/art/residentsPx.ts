/**
 * 집 안 주민들 손찍기 본: 다락 · 책상 · 태엽 속 · 재봉 상자 · 동전 지갑 · 골목 주민과
 * 예전 보스 그림이던 이야기 주민 (곰 대장 · 젤리 대왕 · 깡 장군 · 더스티 · 먼지 왕) 을 장난감 크기로.
 *
 * 글자 (이 파일 안에서는 같은 글자 = 같은 재질, 색은 주민마다 팔레트로):
 *   .  투명 · # 외곽선
 *   L S s     살: 밝음 · 바탕 · 그늘          c 볼 연분홍
 *   E w       눈 · 눈 반짝                     m 입 · 콧수염 (진한 갈색)
 *   O N n     검정 · 남색 (모자 · 장화): 밝음 · 바탕 · 그늘
 *   Q R r q   빨강 천: 밝음 · 바탕 · 그늘 · 깊은 그늘
 *   Y A a Z   금 · 놋쇠: 반짝 · 바탕 · 그늘 · 깊은 그늘
 *   J U u     파랑 천: 밝음 · 바탕 · 그늘
 *   X P p     흰 천 · 종이: 밝음 · 바탕 · 그늘
 *   I M m k   은빛 쇠: 밝음 · 바탕 · 그늘 · 깊은 그늘
 *   V W w v   나무: 밝음 · 바탕 · 그늘 · 깊은 그늘
 *   K G g     초록: 밝음 · 바탕 · 그늘
 *   T F f t   털 · 몸 (주민마다 색): 밝음 · 바탕 · 그늘 · 깊은 그늘
 *   B b       둘째 색 (색종이 · 젤리 무늬 · 귓속): 바탕 · 그늘
 * 눈 깜빡임 · 숨쉬기 · 걸음은 격자를 고쳐 그리지 않고 합성(눈 칸 덮기 · 윗몸 한 줄 내리기 · 다리 조각 바꾸기)으로.
 * 옆모습은 오른쪽을 보는 것만, 왼쪽은 뒤집는다.
 */
import { Pix, hex, mix, shade, type Color } from './paint.ts';
import { gridSize, mat, paintGrid, softOutline, warmMat, type Grid, type Palette } from './px/grid.ts';

export type ResDir = 'down' | 'up' | 'left' | 'right';

const EYE = hex('#2a1c24');
const SHINE = hex('#fff6ea');
const MOUTH = hex('#5a3028');
const BLUSH = hex('#f0a0a0');
const WARM_INK = hex('#3a2030');

/** 늘 같은 뜻의 글자들 (눈 · 입 · 볼) */
const COMMON: Palette = { E: EYE, w: SHINE, m: MOUTH, c: BLUSH };
const skin = (base: Color): Palette => warmMat('.LSs.', base, hex('#c86a5a'));

// ───────────────────────── 합성 도구 ─────────────────────────

/** 눈 깜빡임: 'E' · 'w' 칸 중 아래에 또 눈 칸이 있는 칸은 눈꺼풀(lid 글자)로, 맨 아래 줄만 선으로 남긴다 */
export function blinkGrid(g: Grid, lid: string): Grid {
  const isEye = (y: number, x: number) => y < g.length && (g[y][x] === 'E' || g[y][x] === 'w');
  return g.map((row, y) =>
    [...row]
      .map((ch, x) => {
        if (ch !== 'E' && ch !== 'w') return ch;
        if (isEye(y + 1, x)) return lid;
        return 'E';
      })
      .join(''),
  );
}

/** 숨쉬기: waist 줄 위쪽(윗몸)을 한 줄 내린다 (발은 그대로) */
export function breatheGrid(g: Grid, waist: number): Grid {
  const w = g[0].length;
  return ['.'.repeat(w), ...g.slice(0, waist - 1), ...g.slice(waist)];
}

/** 격자 한 장 → 외곽선 두른 Pix (여백 1칸). 크기 w×h 틀 안에 바닥 맞춤 · 가운데 */
function frame(w: number, h: number, ls: { g: Grid; x?: number; y?: number; pal: Palette; flip?: boolean }[]): Pix {
  const p = new Pix(w, h);
  for (const l of ls) paintGrid(p, l.g, l.x ?? 0, l.y ?? 0, l.pal, l.flip);
  return softOutline(p, WARM_INK, 0.6);
}
/** 격자를 틀 바닥(외곽선 한 줄 위) · 가운데에 놓는 자리 */
function seat(w: number, h: number, g: Grid, lift = 0): { x: number; y: number } {
  const s = gridSize(g);
  return { x: Math.floor((w - s.w) / 2), y: h - 1 - s.h - lift };
}

// ───────────────────────── 양철 병정 (tinSoldier) ─────────────────────────
// 높은 털모자 + 빨간 깃털, 빨간 군복에 금단추 · 견장, 흰 띠, 파란 바지, 검정 장화. 콧수염.

const TIN_DOWN: Grid = [
  '.........RR.........',
  '........RQRr........',
  '......ONNNNNNn......',
  '.....ONNNNNNNNn.....',
  '.....ONNNAANNNn.....',
  '.....ONNNNNNNNn.....',
  '.....nnnnnnnnnn.....',
  '......LSSSSSSs......',
  '......SSESSESs......',
  '......SSESSESs......',
  '......cmmmmmmc......',
  '.......sSSSSs.......',
  '......aAAAAAAa......',
  '...QQRRRRYARRRRrr...',
  '..YAQRRRRAaRRRRrAa..',
  '..QRrRRRRYARRRRrRr..',
  '..QRrRRRRAaRRRRrRr..',
  '..QRrWWWWYAWWWWrRr..',
  '..QRrRRRRYARRRRrRr..',
  '..LSrRRRRAaRRRRrSs..',
  '...s.qrrrrrrrrq.s...',
  '....JUUUUUUUUUUu....',
  '....JUUUUuuUUUUu....',
  '....JUUUu..JUUUu....',
  '....JUUUu..JUUUu....',
  '....JUUUu..JUUUu....',
  '....ONNNn..ONNNn....',
  '...ONNNNn..ONNNNn...',
  '...nnnnnn..nnnnnn...',
];
const TIN_RIGHT: Grid = [
  '........RR..........',
  '.......RQRr.........',
  '......ONNNNNn.......',
  '.....ONNNNNNNn......',
  '.....ONNNNNNAn......',
  '.....ONNNNNNNn......',
  '.....nnnnnnnnnn.....',
  '......sLSSSSSS......',
  '......sSSSSSESS.....',
  '......sSSSSSESS.....',
  '......sSSSSScmmm....',
  '.......sSSSSSs......',
  '.......aAAAAAa......',
  '.....QRRRRRRRRr.....',
  '.....QRRYAaRRRr.....',
  '.....QRRQRrRRYr.....',
  '.....QRRQRrRRAr.....',
  '.....QWWQRrWWYw.....',
  '.....QRRQRrRRAr.....',
  '.....QRRLSsRRYr.....',
  '......qrrssrrrq.....',
  '......JUUUUUUu......',
  '......JUUUUUUu......',
  '......JUUuJUUu......',
  '......JUUuJUUu......',
  '......JUUuJUUu......',
  '......ONNnONNNn.....',
  '......ONNnONNNNn....',
  '......nnnnnnnnnn....',
];
const TIN_UP: Grid = [
  '.........RR.........',
  '........RQRr........',
  '......ONNNNNNn......',
  '.....ONNNNNNNNn.....',
  '.....ONNNNNNNNn.....',
  '.....ONNNNNNNNn.....',
  '.....nnnnnnnnnn.....',
  '......ONNNNNNn......',
  '......NNNNNNNn......',
  '......nNNNNNNn......',
  '......sSSSSSSs......',
  '.......sSSSSs.......',
  '......aAAAAAAa......',
  '...QQRRRRRRRRRRrr...',
  '..YAQRRRRRRRRRRrAa..',
  '..QRrRRRRrRRRRRrRr..',
  '..QRrRRRRrRRRRRrRr..',
  '..QRrWWWWWWWWWWrRr..',
  '..QRrRRRRrRRRRRrRr..',
  '..SsrRRRRrRRRRRrSs..',
  '...s.qrrrrrrrrq.s...',
  '....JUUUUUUUUUUu....',
  '....JUUUUuuUUUUu....',
  '....JUUUu..JUUUu....',
  '....JUUUu..JUUUu....',
  '....JUUUu..JUUUu....',
  '....ONNNn..ONNNn....',
  '...ONNNNn..ONNNNn...',
  '...nnnnnn..nnnnnn...',
];
/** 등에 꽂힌 금빛 태엽 열쇠: 앞에서는 몸 양옆으로 날개가 비친다 · 옆에서는 등 뒤로 · 뒤에서는 등 한가운데 */
const TIN_KEY_FRONT: Grid = [
  '.YAa............YAa.',
  'YAZAa..........YAZAa',
  'YAZAa..........YAZAa',
  '.Aaa............Aaa.',
];
const TIN_KEY_SIDE: Grid = ['.YA', 'YAa', 'YZa', 'AAA', 'YZa', 'YAa', '.aa'];
const TIN_KEY_BACK: Grid = [
  '.YAAa......YAAa.',
  'YAZZAa....YAZZAa',
  'YAZZAAAYAAAZZAaa',
  'YAZZAa....YAZZAa',
  '.Aaaa......Aaaa.',
];
const tinPal = (): Palette => ({
  ...COMMON,
  E: hex('#3a2420'),
  ...skin(hex('#f2c8a0')),
  ...mat('ONn..', hex('#34304a'), { gloss: 0.22 }),
  ...mat('.QRrq', hex('#c8443a')),
  ...mat('.YAaZ', hex('#e0b040')),
  ...mat('.JUu.', hex('#3a5a9a')),
  W: hex('#ece4d8'),
  w: shade(hex('#ece4d8'), -0.18),
});

// ───────────────────────── 색종이 자매 (paperSisters) ─────────────────────────
// 손을 맞잡은 종이 인형 사슬 셋 (분홍 · 하늘 · 연두). 머리 모양이 다 다르다. 뒤는 하얀 종이 뒷면.

/** 종이 인형 몸 (10폭): 팔을 옆으로 뻗어 이웃과 이어진다 */
const DOLL_BODY: Grid = [
  '....PP....',
  'XPPPPPPPPp',
  'pppXPPPppp',
  '...XPPPp..',
  '...XPPPp..',
  '..XPPPPPp.',
  '..XPPPPPp.',
  '.XPPPPPPPp',
  '.XPPPPPPPp',
  'XPPPPPPPPp',
  '.ppppppppp',
  '...Pp.Pp..',
  '...Pp.Pp..',
  '..PPp.PPp.',
];
/** 머리 셋: 양 갈래 · 단발 · 똥머리 */
const DOLL_HEADS: Grid[] = [
  [
    '..........',
    'Bb.XPPp.Bb',
    'BbXPPPPpBb',
    '.bPEPPEPb.',
    '..PEPPEp..',
    '..cPmmPc..',
    '...pPPp...',
  ],
  [
    '..........',
    '..BBBBBb..',
    '.BBBBBBBb.',
    '.BPEPPEPb.',
    '.bPEPPEpb.',
    '.bcPmmPcb.',
    '...pPPp...',
  ],
  [
    '....BB....',
    '...BBbb...',
    '..XPPPPp..',
    '..PEPPEp..',
    '..PEPPEp..',
    '..cPmmPc..',
    '...pPPp...',
  ],
];
const DOLL_COLS = [hex('#e88a98'), hex('#7ab0d8'), hex('#9cc890')];
/** 색종이 뒷면 (크림) */
const PAPER_BACK = hex('#f2ead8');
const DOLL_HAIR = [hex('#c8566a'), hex('#4a7ab0'), hex('#5a9a5a')];
const dollPal = (k: number, backside: boolean): Palette => ({
  ...COMMON,
  ...mat('.XPp.', backside ? PAPER_BACK : DOLL_COLS[k], { light: 0.25, shadow: 0.16 }),
  ...mat('..Bb.', backside ? hex('#e4dac8') : DOLL_HAIR[k]),
  E: backside ? PAPER_BACK : hex('#3a2a34'),
  m: backside ? hex('#e4dac8') : shade(DOLL_COLS[k], -0.45),
  c: backside ? PAPER_BACK : mix(DOLL_COLS[k], BLUSH, 0.6),
});
/** 옆에서 보면 접힌 종이 사슬 (얇은 지그재그) */
const DOLL_SIDE: Grid = [
  '..PP.',
  '.XPPp',
  '.XPPp',
  '..Pp.',
  '.XPp.',
  'XPPp.',
  '.XPp.',
  '..Pp.',
  '..XPp',
  '..XPp',
  '..XPp',
  '.XPPp',
  '.XPPp',
  'XPPPp',
  '.ppp.',
  '..Pp.',
  '..Pp.',
  '.PPp.',
];

// ───────────────────────── 뻐꾹 영감 (cuckooElder) ─────────────────────────
// 뻐꾸기 시계 영감: 세모 지붕 + 조각 잎, 작은 문 (빼꼼 열리면 뻐꾸기), 무뚝뚝한 눈썹, 시계판 얼굴, 처진 콧수염 바늘, 추.

const CUCKOO: Grid = [
  '..................VV..................',
  '.................VWWw.................',
  '................vWWWwv................',
  '...............vWWWWWwv...............',
  '..............vWWWVWWWwv..............',
  '.............vWWWVWWWWWwv.............',
  '............vWWWVWWWWWWWwv............',
  '...........vWWWVWWWWWWWWWwv...........',
  '..........vWWWVWWWWWWWWWWWwv..........',
  '.........vWWWVWWWWWWWWWWWWWwv.........',
  '........vWWWVWWWWWWWWWWWWWWWwv........',
  '.......vWWWVWWWWWWWWWWWWWWWWWwv.......',
  '......vWWWVWWWWWWWWWWWWWWWWWWWwv......',
  '.....vvvvvvvvvvvvvvvvvvvvvvvvvvvv.....',
  '...KGgKGgKGgKGgKGgKGgKGgKGgKGgKGgg....',
  '....gg.gg.gg.gg.gg.gg.gg.gg.gg.gg.....',
  '.....VWWWWWWWWWWWWWWWWWWWWWWWWWwv.....',
  '.....VWWWWWWWWWVVVVVVwWWWWWWWWWwv.....',
  '.....VWWWWWWWWWVvvvvvwWWWWWWWWWwv.....',
  '.....VWWWWWWWWWVvvvvvwWWWWWWWWWwv.....',
  '.....VWWWWWWWWWVvvvvvwWWWWWWWWWwv.....',
  '.....VWWWWWWWWWVvvvvvwWWWWWWWWWwv.....',
  '.....VWWWWWWWWWVvvvvvwWWWWWWWWWwv.....',
  '.....VWWWWWWWWWwwwwwwwWWWWWWWWWwv.....',
  '.....VWWWvvvvvWWWWWWWWWWvvvvvWWwv.....',
  '.....VWWvvvvvWWWWWWWWWWWWvvvvvWwv.....',
  '.....VWWWWWWWWWWXXXXXXWWWWWWWWWwv.....',
  '.....VWWWWWWWXXXPPPPPPXXpWWWWWWwv.....',
  '.....VWWWWWXXPPPpPPPPpPPPpWWWWWwv.....',
  '.....VWWWWXPPPPPPPPPPPPPPPpWWWWwv.....',
  '.....VWWWWXPPPEEPPPPPPEEPPpWWWWwv.....',
  '.....VWWWXPpPPEEPPPPPPEEPPPpWWWwv.....',
  '.....VWWWXPPPPPPPPPPPPPPPPPpWWWwv.....',
  '.....VWWWXPPPPmPPPPAPPPPmPPpWWWwv.....',
  '.....VWWWXPpPPPmmPPAPPmmPPPpWWWwv.....',
  '.....VWWWWPPPPPPPmmZmmPPPPPpWWWWv.....',
  '.....VWWWWpPPPPPPPPPPPPPPPppWWWWv.....',
  '.....VWWWWWpPPPpPPPPPPpPPppWWWWWv.....',
  '.....VWWWWWWppPPPPPPPPPPppWWWWWWv.....',
  '.....VWWWWWWWWpppppppppppWWWWWWWv.....',
  '.....vvvvvvvvvvvvvvvvvvvvvvvvvvvv.....',
];
/** 작은 문: 닫힘 · 빼꼼 열림 (뻐꾸기가 내다본다). 지붕 아래 문틀(15,17) 자리 */
const CUCKOO_DOOR: Grid[] = [
  ['VWWWWw', 'VWWWWw', 'VWWWAw', 'VWWWWw', 'VWWWWw', 'wwwwww'],
  ['VW.ww.', 'VWTTt.', 'VTFFEY', 'VWFFf.', 'VWfff.', 'wwwwww'],
];
/** 추 (솔방울 둘) — 시계 아래 */
const CUCKOO_WEIGHT: Grid = ['.a.', '.a.', '.a.', 'YAa', 'AaZ', 'YAa', 'AaZ', '.Z.'];
const cuckooPal = (): Palette => ({
  ...COMMON,
  ...mat('.VWwv', hex('#7a5038'), { light: 0.16, shadow: 0.22, deep: 0.4 }),
  ...mat('.KGg.', hex('#8aa47a')),
  ...mat('.XPp.', hex('#ecdcbc'), { light: 0.14, shadow: 0.14 }),
  ...mat('.YAaZ', hex('#d8a848')),
  ...mat('.TFft', hex('#a8784a')),
  m: hex('#4a2e20'),
});

// ───────────────────────── 큰톱니 · 작은톱니 (gearBig · gearSmall) ─────────────────────────
// 놋쇠 톱니 형제. 큰톱니는 졸린 눈 · 느긋, 작은톱니는 동그란 눈 · 땀 한 방울. 짧은 다리로 선다.

const GEAR_BIG: Grid = [
  '............AYA.AYA...........',
  '.......AYA..YAAaYAAa..AYA.....',
  '.......YAAaYAAAAAAAAaYAAa.....',
  '........AAAAAAAAAAAAAAAAa.....',
  '...AYA.YAAAAAAAAAAAAAAAAAaAYA.',
  '...YAAaYAAAAAAAAAAAAAAAAAAAAAa',
  '....AYAAAAAAAAAAAAAAAAAAAAAAa.',
  '.....YAAAAAAAAAAAAAAAAAAAAAa..',
  '.AYAYAAAAAAAAAAAAAAAAAAAAAAaAa',
  '.YAAAAAAAAAAAAAAAAAAAAAAAAAAaa',
  '..YAAAAAAAAAAAAAAAAAAAAAAAAAa.',
  '...AAAAAAAAAAAAAAAAAAAAAAAAAa.',
  '..YAAAAAAAAAAAAAAAAAAAAAAAAAaa',
  '.YAAAAAAAAAAAAAAAAAAAAAAAAAAaa',
  '..AAAAAAAAEEEEAAAAEEEEAAAAAAa.',
  '...AAAAAAAAAAAAAAAAAAAAAAAAAa.',
  '..YAAAAAAAcAAAAAAAAAAcAAAAAAaa',
  '.YAAAAAAAAAAAAAmmmAAAAAAAAAAaa',
  '..AAAAAAAAAAAAAAAAAAAAAAAAAAa.',
  '...AAAAAAAAAAAAAAAAAAAAAAAAa..',
  '..AaAAAAAAAAAAAAAAAAAAAAAAAaa.',
  '..aa.AAAAAAAAAAAAAAAAAAAAaaaa.',
  '......aAAAAAAAAAAAAAAAAAaa....',
  '.....AaaAAAAAAAAAAAAAAaaAa....',
  '.....aa.aaAAAAAAAAAAaaa.aa....',
  '.........aa.aaaaaaa.aa........',
  '..........ZaaZ...ZaaZ.........',
  '..........ZaZ.....ZaZ.........',
  '.........ZZaZ.....ZaZZ........',
];
const GEAR_SMALL: Grid = [
  '.........YA.........',
  '....YA..YAAa..YA....',
  '....AAaYAAAAaYAa....',
  '.....AAAAAAAAAAa....',
  '.YA.YAAAAAAAAAAAa.Ya',
  '.AAaYAAAAAAAAAAAAaAa',
  '..AAAAwEAAAAwEAAAa..',
  '..YAAAEEAAAAEEAAAa..',
  'YAAAAAEEAAAAEEAAAAAa',
  'AAAAAAcAAAAAAcAAAAaa',
  '..AAAAAAAmmAAAAAAa..',
  '..AAAAAAAAAAAAAAAa..',
  '.YaaAAAAAAAAAAAAaAa.',
  '.aa.aAAAAAAAAAAa.aa.',
  '.....aaAAAAAAaa.....',
  '....Aa.aaaaaa.Aa....',
  '....aa..ZaaZ..aa....',
  '........ZaaZ........',
  '.......ZZa.ZZ.......',
];
/** 옆으로 서면 톱니가 얇은 바퀴로 보인다 (몸 두께 + 둘레 이) */
const GEAR_EDGE: Grid = [
  '..YA..',
  '.YAAa.',
  'YAAAaa',
  '.AAAa.',
  'YAAAaa',
  '.AAAa.',
  'YAAEaa',
  '.AAEa.',
  'YAAAaa',
  '.AAAa.',
  'YAAAaa',
  '.AAAa.',
  'YAAAaa',
  '.aaaa.',
  '.ZaZ..',
  '.ZaZ..',
  'ZZaZ..',
];
/** 등쪽: 가운데 축 구멍 + 바퀴살 */
const GEAR_AXLE: Grid = ['.aZZa.', 'aZkkZa', 'ZkkkkZ', 'ZkkkkZ', 'aZkkZa', '.aZZa.'];
const gearPal = (big: boolean): Palette => ({
  ...COMMON,
  ...mat('.YAaZ', big ? hex('#c89a48') : hex('#d8b058'), { light: 0.24, shadow: 0.2, deep: 0.42 }),
  k: hex('#4a3420'),
  w: SHINE,
  c: mix(hex('#c89a48'), BLUSH, 0.5),
});
const DROP: Grid = ['.J', 'JJ', 'Ju'];

// ───────────────────────── 골무 아재 (thimbleMan) ─────────────────────────
// 은빛 골무 몸에 오목 무늬, 콧수염, 빨간 다리.

const THIMBLE_DOWN: Grid = [
  '.......IMMMMm.......',
  '.....IIMkMMkMMm.....',
  '....IMMMMMMMMMMm....',
  '...IMkMMkMMkMMkMm...',
  '...IMMMMMMMMMMMMm...',
  '..IMMkMMkMMkMMkMMm..',
  '..IMMMMMMMMMMMMMMm..',
  '..IMMMMEMMMMEMMMMm..',
  '..IMMMMEMMMMEMMMMm..',
  '..IMMMcMMMMMMcMMMm..',
  '..IMMmmmmMMmmmmMMm..',
  '..IMmmMMmmmmMMmmMm..',
  '..IMMMMMMMMMMMMMMm..',
  '..IMkMMkMMkMMkMMkm..',
  '..IMMMMMMMMMMMMMMm..',
  '.IIMMMMMMMMMMMMMMMm.',
  '.IMMMMMMMMMMMMMMMMm.',
  '.mmmmmmmmmmmmmmmmmm.',
  '..kkkkkkkkkkkkkkkk..',
  '.....QRr....QRr.....',
  '.....QRr....QRr.....',
  '.....QRr....QRr.....',
  '....QRRr...QRRr.....',
  '....rrrr...rrrr.....',
];
const THIMBLE_RIGHT: Grid = [
  '.......IMMMMm.......',
  '.....IIMkMMkMm......',
  '....IMMMMMMMMMm.....',
  '...IMkMMkMMkMMMm....',
  '...IMMMMMMMMMMMm....',
  '..IMMkMMkMMkMMMMm...',
  '..IMMMMMMMMMMMMMm...',
  '..IMMMMMMMMMMEMMm...',
  '..IMMMMMMMMMMEMMm...',
  '..IMMMMMMMMMMMcMm...',
  '..IMMMMMMMMMmmmmmm..',
  '..IMMMMMMMMMMMMmmm..',
  '..IMMMMMMMMMMMMMMm..',
  '..IMkMMkMMkMMkMMkm..',
  '..IMMMMMMMMMMMMMMm..',
  '.IIMMMMMMMMMMMMMMMm.',
  '.IMMMMMMMMMMMMMMMMm.',
  '.mmmmmmmmmmmmmmmmmm.',
  '..kkkkkkkkkkkkkkkk..',
  '.......QRr.QRr......',
  '.......QRr.QRr......',
  '.......QRr.QRr......',
  '.......QRrrQRRr.....',
  '.......rrrrrrrr.....',
];
const THIMBLE_UP: Grid = [
  '.......IMMMMm.......',
  '.....IIMkMMkMMm.....',
  '....IMMMMMMMMMMm....',
  '...IMkMMkMMkMMkMm...',
  '...IMMMMMMMMMMMMm...',
  '..IMMkMMkMMkMMkMMm..',
  '..IMMMMMMMMMMMMMMm..',
  '..IMkMMkMMkMMkMMkm..',
  '..IMMMMMMMMMMMMMMm..',
  '..IMMkMMkMMkMMkMMm..',
  '..IMMMMMMMMMMMMMMm..',
  '..IMkMMkMMkMMkMMkm..',
  '..IMMMMMMMMMMMMMMm..',
  '..IMMkMMkMMkMMkMMm..',
  '..IMMMMMMMMMMMMMMm..',
  '.IIMMMMMMMMMMMMMMMm.',
  '.IMMMMMMMMMMMMMMMMm.',
  '.mmmmmmmmmmmmmmmmmm.',
  '..kkkkkkkkkkkkkkkk..',
  '.....QRr....QRr.....',
  '.....QRr....QRr.....',
  '.....QRr....QRr.....',
  '....QRRr...QRRr.....',
  '....rrrr...rrrr.....',
];
const thimblePal = (): Palette => ({
  ...COMMON,
  ...mat('.IMmk', hex('#b8bcc8'), { light: 0.22, shadow: 0.2, deep: 0.36 }),
  ...mat('.QRr.', hex('#c8504a')),
  m: hex('#7a6a5a'),
  c: mix(hex('#b8bcc8'), BLUSH, 0.55),
});

// ───────────────────────── 집순이 · 집돌이 (clothespins) ─────────────────────────
// 나무 빨래집게 남매 (분홍 · 하늘), 허리에 은빛 용수철, 아래로 갈라진 두 다리.

const PIN: Grid = [
  '..XPPp..',
  '.XPPPPp.',
  '.XPPPPp.',
  '.XEPPEp.',
  '.XEPPEp.',
  '.XcPPcp.',
  '.XPmmPp.',
  '.XPPPPp.',
  '.XPPPPp.',
  'IMMMMMMm',
  'MkMkMkMk',
  'IMMMMMMm',
  '.XPPPPp.',
  '.XPPpPp.',
  '.XPp.Pp.',
  '.XPp.Pp.',
  '.XPp.Pp.',
  '.XPp.Pp.',
  '.XPp.Pp.',
  '..Pp.Pp.',
  '..pp.pp.',
];
const PIN_SIDE: Grid = [
  '.XPp.',
  'XPPPp',
  'XPPPp',
  'XPPEp',
  'XPPEp',
  'XPPcp',
  'XPPPm',
  'XPPPp',
  'XPPPp',
  'IMMMm',
  'MkMkk',
  'IMMMm',
  'XPPPp',
  'XPPPp',
  'XPPpp',
  'XPpPp',
  'XPpPp',
  'XPpPp',
  'XPpPp',
  '.Pp.p',
  '.pp.p',
];
const PIN_COLS = [hex('#e89aa8'), hex('#8ac8e8')];
const pinPal = (k: number, back: boolean): Palette => ({
  ...COMMON,
  ...mat('.XPp.', PIN_COLS[k], { light: 0.22, shadow: 0.18 }),
  ...mat('.IMmk', hex('#b8bcc8'), { light: 0.25, shadow: 0.2, deep: 0.4 }),
  ...(back ? { E: PIN_COLS[k], c: PIN_COLS[k], m: PIN_COLS[k] } : { c: mix(PIN_COLS[k], BLUSH, 0.55), m: shade(PIN_COLS[k], -0.5) }),
});

// ───────────────────────── 백원 할배 (coinElder) ─────────────────────────
// 은빛 백 원 동전 할아버지: 흰 눈썹 · 수염, 성냥개비 지팡이. 옆에서 보면 톱니 테두리의 얇은 동전.

const COIN_DOWN: Grid = [
  '........IIMMMMm.........',
  '......IIMMMMMMMMm.......',
  '.....IMMXXXXXXMMMm......',
  '....IMMXMMMMMMXMMMm.....',
  '...IMMXMMMMMMMMXMMMm....',
  '...IMXMMXXMMXXMMXMMm....',
  '..IMMXMMMMMMMMMMXMMMm...',
  '..IMXMMMEMMMMEMMMXMMm...',
  '..IMXMMMEMMMMEMMMXMMm...',
  '..IMXMMcMMMMMMcMMXMMm...',
  '..IMXMMMMXXXXMMMMXMMm...',
  '..IMXMMMXXXXXXMMMXMMm...',
  '..IMMXMMMXXXXMMMXMMMm...',
  '...IMXMMMMXXMMMMXMMm....',
  '...IMMXMMMMMMMMXMMmm....',
  '....IMMXMMMMMMXMMMm.....',
  '.....mMMXXXXXXMMmm......',
  '......mmMMMMMMmmm.......',
  '........mmmmmmm.........',
  '.........Ii..Ii.........',
  '.........Mm..Mm.........',
  '.........Mm..Mm.........',
  '........IMm.IMm.........',
  '........mmm.mmm.........',
];
const COIN_SIDE: Grid = [
  '....IMm....',
  '...IMMmm...',
  '...IMMmk...',
  '..IMMMmk...',
  '..IMMMmk...',
  '..IMMMmk...',
  '..IMEMmk...',
  '..IMEMmk...',
  '..IMMXXk...',
  '..IMXXXk...',
  '..IMMXmk...',
  '..IMMMmk...',
  '..IMMMmk...',
  '...IMMmk...',
  '...IMMmk...',
  '....Imk....',
  '....Mm.....',
  '....Mm.....',
  '...IMm.....',
  '...mmm.....',
];
const COIN_BACK: Grid = [
  '........IIMMMMm.........',
  '......IIMMMMMMMMm.......',
  '.....IMMMMMMMMMMMm......',
  '....IMMMMMMMMMMMMMm.....',
  '...IMMMMMMMMMMMMMMMm....',
  '...IMMMMMMMMMMMMMMMm....',
  '..IMMMMMMMMMMMMMMMMMm...',
  '..IMMMMXMMXXXMXXXMMMm...',
  '..IMMMXXMMXMXMXMXMMMm...',
  '..IMMMMXMMXMXMXMXMMMm...',
  '..IMMMMXMMXMXMXMXMMMm...',
  '..IMMMXXXMXXXMXXXMMMm...',
  '..IMMMMMMMMMMMMMMMMMm...',
  '...IMMMMMMMMMMMMMMMm....',
  '...IMMMMMMMMMMMMMMmm....',
  '....IMMMMMMMMMMMMMm.....',
  '.....mMMMMMMMMMMmm......',
  '......mmMMMMMMmmm.......',
  '........mmmmmmm.........',
  '.........Ii..Ii.........',
  '.........Mm..Mm.........',
  '.........Mm..Mm.........',
  '........IMm.IMm.........',
  '........mmm.mmm.........',
];
/** 성냥개비 지팡이 (빨간 머리) */
const MATCH: Grid = ['.QR', 'QRr', '.rr', '.VW', '.VW', '.VW', '.VW', '.VW', '.VW', '.VW', '.VW', '.VW', '.VW', '.VW', '.VW', '.VW', '.Vw', '.ww'];
const coinPal = (): Palette => ({
  ...COMMON,
  ...mat('.IMmk', hex('#c8ccd4'), { light: 0.2, shadow: 0.16, deep: 0.34 }),
  X: hex('#f2f0ea'),
  i: hex('#eef0f4'),
  ...mat('.QRr.', hex('#c8443a')),
  ...mat('.VWw.', hex('#e8c88a')),
  c: mix(hex('#c8ccd4'), BLUSH, 0.5),
});

// ───────────────────────── 개굴 형 (frogBro) ─────────────────────────
// 초록 개구리: 툭 튀어나온 눈, 흰 배, 넓은 입.

const FROG_DOWN: Grid = [
  '...XPPp......XPPp...',
  '..XPwEPp....XPwEPp..',
  '..KGEEGg....KGEEGg..',
  '.KGGGGGGGGGGGGGGGGg.',
  'KGGGGGGGGGGGGGGGGGGg',
  'KGGcGGGGGGGGGGGGcGGg',
  'KGGGmmmmmmmmmmmmGGGg',
  '.KGGGGPPPPPPPPGGGGg.',
  'KGGgGXPPPPPPPPpGgGGg',
  'KGg.gXPPPPPPPPpg.gGg',
  'Kgg..gppppppppg..ggg',
  'KGGg..gg....gg..gGGg',
];
const FROG_RIGHT: Grid = [
  '..........XPPp.....',
  '.........XPwEPp....',
  '.........KGEEGg....',
  '....KKGGGGGGGGGGg..',
  '..KGGGGGGGGGGGGGGg.',
  '.KGGGGGGGGGGGGGcGGg',
  'KGGGGGGGGGGGGmmmmmg',
  'KGGGGGGGGGGGPPPPPg.',
  'KGGGGGGgGGXPPPPPg..',
  'KGGGGGgGGGXPPPPg...',
  '.gGGGgGGGgpppgg....',
  'KGGggggg.KGGg......',
  'gggg....KGGGgg.....',
];
const FROG_UP: Grid = [
  '...KGGg......KGGg...',
  '..KGGGGg....KGGGGg..',
  '..KGGGGg....KGGGGg..',
  '.KGGGGGGGGGGGGGGGGg.',
  'KGGGGGgGGGGGGgGGGGGg',
  'KGGGGGGGGGGGGGGGGGGg',
  'KGGGGGGGgGGgGGGGGGGg',
  '.KGGGGGGGGGGGGGGGGg.',
  'KGGgGGGGGGGGGGGGgGGg',
  'KGg.gGGGGGGGGGGg.gGg',
  'Kgg..gggggggggg..ggg',
  'KGGg..gg....gg..gGGg',
];
const frogPal = (): Palette => ({
  ...COMMON,
  ...mat('.KGg.', hex('#6ab048'), { light: 0.2, shadow: 0.2 }),
  ...mat('.XPp.', hex('#e8e4b8'), { light: 0.2, shadow: 0.14 }),
  E: EYE,
  m: hex('#3a6a2a'),
  c: mix(hex('#6ab048'), BLUSH, 0.6),
});

// ───────────────────────── 얼룩이 (alleyCat) ─────────────────────────
// 골목 길고양이: 흰 바탕에 회색 얼룩, 노란 눈. 앞에서는 앉아 있고, 옆으로는 네 발로 걷는다.

const CAT_SIT: Grid = [
  '.....TF.........TF......',
  '....TFFf.......TFFf.....',
  '....TBFf.......TBFf.....',
  '...TBBFFfXPPPPpTBFFf....',
  '...TFFFFXPPPPPPPFFFFf...',
  '...TFFFFXPPPPPPPPFFFf...',
  '...TFFFXPPPPPPPPPpFFf...',
  '...XFFAAPPPPPPPPAAPFf...',
  '...XPPAEPPPPPPPPAEPPp...',
  '...XPPPPPPPPPPPPPPPPp...',
  '..mmmPPPPPPBBPPPPPPmmm..',
  '...XPPPPPPPPmPPPPPPPp...',
  '....pPPPPPPmPmPPPPPp....',
  '.....ppPPPPPPPPPPpp.....',
  '......XPPPPPPPPPPp......',
  '.....XPPPPPPPPPPPPp.....',
  '....XPPPPPPPPPPTFFFf....',
  '....XPPPPPPPPPTFFFFFf...',
  '...XPPPPPPPPPPTFFFFFf...',
  '...XPPPPPPPPPPTFFFFFf...',
  '...XPPPPPPPPPPPTFFFf....',
  '...XPPPPPPPPPPPPPPPp....',
  '...XPPXPPPPPPPPXPPPp....',
  '...XPPXPPPPPPPPXPPPpPPp.',
  '...XPPXPPPPPPPPXPPPPPPp.',
  '...pppppppppppppppppppp.',
];
const CAT_SIDE: Grid = [
  '..............................TF....TF..',
  '.............................TFFf..TBFf.',
  '.............................TFFFFFFFFf.',
  '............................XPPFFFFFFFf.',
  '............................XPPPPFFFFFf.',
  '............................XPPPPPPAEPP.',
  '.........................mmmXPPPPPPPPPBm',
  '..........................XPPPPPPPPPPPmP',
  'TF......................XPPPPPPPPPPPPPp.',
  'Ff.......XPPPPPPPPPPPPPPPPPPPPPPPPPPpp..',
  'Ff......XPPPTFFFFfPPPPPPPPPPPPPPPPPPp...',
  'Ff.....XPPPTFFFFFFfPPPPPPPPPTFFfPPPPp...',
  '.Ff...XPPPPTFFFFFFfPPPPPPPPTFFFFfPPPp...',
  '..FfXPPPPPPPTFFFFfPPPPPPPPPPTFFfPPPPp...',
  '....XPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPp...',
  '....XPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPpp...',
  '.....pPPPPPPPPPPPPPPPPPPPPPPPPPPPPpp....',
  '......ppppppppppppppppppppppppppppp.....',
];
/** 옆 걸음 다리 둘 (앞 · 뒷다리 엇갈림) */
const CAT_LEGS: Grid[] = [
  [
    '.......XPp.XPp..........XPp.XPp.........',
    '.......XPp.XPp..........XPp.XPp.........',
    '.......XPp..XPp........XPp..XPp.........',
    '.......XPp..XPp........XPp...XPp........',
    '......XPPp..XPPp......XPPp...XPPp.......',
  ],
  [
    '........XPpXPp...........XPpXPp.........',
    '........XPpXPp...........XPpXPp.........',
    '.......XPp.XPp..........XPp.XPp.........',
    '.......XPp..XPp.........XPp..XPp........',
    '......XPPp..XPPp.......XPPp..XPPp.......',
  ],
];
const CAT_BACK: Grid = [
  '.....TF.........TF......',
  '....TFFf.......TFFf.....',
  '....TFFf.......TFFf.....',
  '...TFFFFfXPPPPpTFFFf....',
  '...TFFFFXPPPPPPPFFFFf...',
  '...TFFFFXPPPPPPPPFFFf...',
  '...TFFFXPPPPPPPPPpFFf...',
  '...XFFPPPPPPPPPPPPFFf...',
  '...XPPPPPPPPPPPPPPPPp...',
  '...XPPPPPPPPPPPPPPPPp...',
  '...XPPPPPPPPPPPPPPPPp...',
  '...XPPPPPPPPPPPPPPPPp...',
  '....pPPPPPPPPPPPPPPp....',
  '.....ppPPPPPPPPPPpp.....',
  '......XPPPPPPPPPPp......',
  '.....XPPTFFFfPPPPPp.....',
  '....XPPTFFFFFfPPPPPp....',
  '....XPPTFFFFFfPPPPPp....',
  '...XPPPPTFFFfPPPPPPPp...',
  '...XPPPPPPPPPPPPPPPPp...',
  '...XPPPPPPPPPPPPPPPPp...',
  '...XPPPPPPPPPPPPPPPPp...',
  '...XPPPPPPPPPPPPPPPPp...',
  '...XPPPPPPPPPPPPPPPPpTF.',
  '...XPPPPPPPPPPPPPPPPTFf.',
  '...pppppppppppppppppFf..',
];
const catPal = (): Palette => ({
  ...COMMON,
  ...mat('.XPp.', hex('#e8e4dc'), { light: 0.2, shadow: 0.16 }),
  ...mat('.TFft', hex('#6a6670'), { light: 0.2, shadow: 0.2 }),
  A: hex('#e8c848'),
  B: hex('#d88a8a'),
  m: hex('#b8b0a8'),
});

// ───────────────────────── 주민 그림 ─────────────────────────

/** 사람처럼 앞 · 옆 · 뒤가 있는 주민 하나: 깜빡임 눈꺼풀 글자 · 숨쉬기 허리 줄 */
interface Folk {
  w: number;
  h: number;
  down: Grid;
  right: Grid;
  up: Grid;
  lid: string;
  waist: number;
  pal: () => Palette;
}
const FOLK: Record<string, Folk> = {
  tinSoldier: { w: 24, h: 32, down: TIN_DOWN, right: TIN_RIGHT, up: TIN_UP, lid: 'S', waist: 20, pal: tinPal },
  thimbleMan: { w: 24, h: 30, down: THIMBLE_DOWN, right: THIMBLE_RIGHT, up: THIMBLE_UP, lid: 'M', waist: 18, pal: thimblePal },
  coinElder: { w: 28, h: 34, down: COIN_DOWN, right: COIN_SIDE, up: COIN_BACK, lid: 'M', waist: 19, pal: coinPal },
};

function folk(F: Folk, dir: ResDir, f: number, kind = ''): Pix {
  let g = dir === 'down' ? F.down : dir === 'up' ? F.up : F.right;
  if (f === 1) g = blinkGrid(breatheGrid(g, F.waist), F.lid);
  const s = seat(F.w, F.h, g);
  const pal = F.pal();
  const ls: { g: Grid; x: number; y: number; pal: Palette }[] = [];
  const bob = f === 1 ? 1 : 0;
  // 양철 병정의 태엽 열쇠 (몸 뒤 · 등)
  if (kind === 'tinSoldier' && dir === 'down') ls.push({ g: TIN_KEY_FRONT, x: s.x, y: s.y + 13 + bob, pal });
  if (kind === 'tinSoldier' && dir === 'right') ls.push({ g: TIN_KEY_SIDE, x: s.x + 3, y: s.y + 13 + bob, pal });
  ls.push({ g, ...s, pal });
  if (kind === 'tinSoldier' && dir === 'up') ls.push({ g: TIN_KEY_BACK, x: s.x + 2, y: s.y + 13 + bob, pal });
  return frame(F.w, F.h, ls);
}

function paperSisters(dir: ResDir, f: number): Pix {
  const W = 32;
  const H = 34;
  if (dir === 'left' || dir === 'right') {
    const s = seat(W, H, DOLL_SIDE);
    const ls = [0, 1, 2].map((k) => ({ g: f === 1 && k === 1 ? breatheGrid(DOLL_SIDE, 4) : DOLL_SIDE, x: s.x - 6 + k * 6, y: s.y, pal: dollPal(dir === 'left' ? 2 - k : k, false), flip: dir === 'left' }));
    return frame(W, H, ls);
  }
  const back = dir === 'up';
  const ls: { g: Grid; x: number; y: number; pal: Palette; flip?: boolean }[] = [];
  for (let k = 0; k < 3; k++) {
    // 뒤에서 보면 순서가 바뀐다 (분홍이 오른쪽)
    const c = back ? 2 - k : k;
    const x = 2 + k * 9;
    // frame 1: 가운데 동생이 한 칸 콩 (사슬이 출렁)
    const hop = f === 1 && k === 1 ? 1 : 0;
    const by = H - 1 - DOLL_BODY.length - hop;
    const head = f === 1 && !back ? blinkGrid(DOLL_HEADS[c], 'P') : DOLL_HEADS[c];
    ls.push({ g: DOLL_BODY, x, y: by, pal: dollPal(c, back) });
    ls.push({ g: head, x, y: by - head.length + 1, pal: dollPal(c, back), flip: back });
  }
  return frame(W, H, ls);
}

function cuckooElder(_dir: ResDir, f: number): Pix {
  const W = 44;
  const H = 52;
  const pal = cuckooPal();
  const s = { x: Math.floor((W - gridSize(CUCKOO).w) / 2), y: 9 };
  const body = f === 1 ? CUCKOO.map((r, y) => (y >= 30 && y <= 31 ? r.replace(/EE/g, 'PP') : r)) : CUCKOO;
  const ls: { g: Grid; x: number; y: number; pal: Palette }[] = [
    { g: CUCKOO_WEIGHT, x: s.x + 12 + (f === 1 ? 1 : 0), y: H - 2 - CUCKOO_WEIGHT.length, pal },
    { g: CUCKOO_WEIGHT, x: s.x + 23 - (f === 1 ? 1 : 0), y: H - 4 - CUCKOO_WEIGHT.length, pal },
    { g: body, x: s.x, y: 2, pal },
    { g: CUCKOO_DOOR[f], x: s.x + 15, y: 2 + 17, pal },
  ];
  return frame(W, H, ls);
}

function gearFolk(big: boolean, dir: ResDir, f: number): Pix {
  const W = big ? 36 : 28;
  const H = big ? 34 : 26;
  const pal = gearPal(big);
  const front = big ? GEAR_BIG : GEAR_SMALL;
  if (dir === 'left' || dir === 'right') {
    // 옆으로 돌면: 얼굴은 그쪽으로 조금 돌고, 뒤로 톱니 두께 (같은 본을 어둡게 두 칸 뒤에)
    const g = f === 1 ? blinkGrid(breatheGrid(front, big ? 25 : 15), 'A') : front;
    const s = seat(W, H, g);
    const back = dir === 'left' ? 2 : -2;
    const thick = { ...pal, ...mat('.YAaZ', shade(big ? hex('#c89a48') : hex('#d8b058'), -0.3)) };
    const faceOnly = g.map((r) => r.replace(/[Ecmw]/g, 'A'));
    return frame(W, H, [
      { g: faceOnly, x: s.x + back, y: s.y, pal: thick },
      { g, x: s.x - Math.sign(back), y: s.y, pal },
    ]);
  }
  if (dir === 'up') {
    // 등: 눈 · 입 없는 톱니 + 가운데 축 구멍
    const g0 = front.map((r) => r.replace(/[Ecmw]/g, 'A'));
    const g = f === 1 ? breatheGrid(g0, big ? 25 : 15) : g0;
    const s = seat(W, H, g);
    const cy = s.y + (big ? 11 : 7) + (f === 1 ? 1 : 0);
    return frame(W, H, [{ g, ...s, pal }, { g: GEAR_AXLE, x: s.x + Math.floor(gridSize(g).w / 2) - 3, y: cy, pal }]);
  }
  // 앞: 큰톱니는 frame 1 에 꾸벅 (눈은 늘 졸린 선), 작은톱니는 깜빡 + 땀방울
  const g = f === 1 ? (big ? breatheGrid(front, 25) : blinkGrid(breatheGrid(front, 15), 'A')) : front;
  const s = seat(W, H, g);
  const ls: { g: Grid; x: number; y: number; pal: Palette }[] = [{ g, ...s, pal }];
  if (!big) ls.push({ g: DROP, x: s.x + 16, y: s.y + 1 + f, pal: { ...pal, ...mat('.JUu.', hex('#8ad0f0')) } });
  return frame(W, H, ls);
}

function clothespins(dir: ResDir, f: number): Pix {
  const W = 30;
  const H = 34;
  const side = dir === 'left' || dir === 'right';
  const g0 = side ? PIN_SIDE : PIN;
  const ls: { g: Grid; x: number; y: number; pal: Palette; flip?: boolean }[] = [];
  for (let k = 0; k < 2; k++) {
    const c = dir === 'up' ? 1 - k : k;
    // 동생(하늘)이 세 칸 작다: 키 차이는 바닥에 묻지 않고 위를 자른다
    const g = c === 1 ? g0.filter((_, i) => i < 14 || i > 16) : g0;
    const sway = f === 1 ? (k ? -1 : 1) : 0;
    const x = side ? 10 + k * 6 + sway : 5 + k * 12 + sway;
    const gg = f === 1 && dir !== 'up' ? blinkGrid(g, 'P') : g;
    ls.push({ g: gg, x, y: H - 1 - g.length, pal: pinPal(c, dir === 'up'), flip: dir === 'left' });
  }
  return frame(W, H, ls);
}

function coinElder(dir: ResDir, f: number): Pix {
  const F = FOLK.coinElder;
  const p = folk(F, dir, f);
  if (dir === 'up') return p;
  // 성냥개비 지팡이 (오른손 쪽 · 옆모습은 앞쪽)
  const W = F.w;
  const H = F.h;
  const q = new Pix(W, H);
  paintGrid(q, MATCH, dir === 'down' ? 21 : dir === 'right' ? 17 : 7, H - 1 - MATCH.length, coinPal());
  softOutline(q, WARM_INK, 0.6);
  return q.stamp(p, 0, 0);
}

function frogBro(dir: ResDir, frame4: number): Pix {
  const W = 24;
  const H = 20;
  const hop = frame4 >= 2 ? 3 : 0;
  const g0 = dir === 'down' ? FROG_DOWN : dir === 'up' ? FROG_UP : FROG_RIGHT;
  const g = frame4 % 2 === 1 && dir === 'down' ? blinkGrid(g0, 'G') : frame4 % 2 === 1 ? breatheGrid(g0, 6) : g0;
  const s = seat(W, H, g, hop);
  return frame(W, H, [{ g, ...s, pal: frogPal(), flip: dir === 'left' }]);
}

function alleyCat(dir: ResDir, frame4: number): Pix {
  const pal = catPal();
  if (dir === 'left' || dir === 'right') {
    const W = 44;
    const H = 26;
    const legs = CAT_LEGS[frame4 % 2];
    const s = seat(W, H, CAT_SIDE, legs.length - 1);
    const breathe = frame4 % 2 ? CAT_SIDE : CAT_SIDE;
    return frame(W, H, [
      { g: legs, x: s.x, y: H - 1 - legs.length, pal, flip: dir === 'left' },
      { g: breathe, x: s.x, y: s.y, pal, flip: dir === 'left' },
    ]);
  }
  const W = 28;
  const H = 30;
  const g0 = dir === 'down' ? CAT_SIT : CAT_BACK;
  const g = frame4 % 2 === 1 ? (dir === 'down' ? blinkGrid(breatheGrid(g0, 14), 'P') : breatheGrid(g0, 14)) : g0;
  const s = seat(W, H, g);
  return frame(W, H, [{ g, ...s, pal }]);
}

/** 손찍기 주민 그림 (모르는 이름이면 null). frame: 0/1 숨쉬기 · 깜빡임 (개구리 · 고양이는 0~3 걸음) */
export function residentPxSprite(kind: string, dir: ResDir, frame: number): Pix | null {
  // 왼쪽은 언제나 오른쪽 그림을 뒤집은 것
  if (dir === 'left') return residentPxSprite(kind, 'right', frame)?.flipped() ?? null;
  const f = frame % 2;
  switch (kind) {
    case 'tinSoldier':
    case 'thimbleMan':
      return folk(FOLK[kind], dir, f, kind);
    case 'coinElder':
      return coinElder(dir, f);
    case 'paperSisters':
      return paperSisters(dir, f);
    case 'cuckooElder':
      return cuckooElder(dir, f);
    case 'gearBig':
      return gearFolk(true, dir, f);
    case 'gearSmall':
      return gearFolk(false, dir, f);
    case 'clothespins':
      return clothespins(dir, f);
    case 'frogBro':
      return frogBro(dir, frame);
    case 'alleyCat':
      return alleyCat(dir, frame);
    default:
      return null;
  }
}

export const RESIDENT_PX_KINDS = ['tinSoldier', 'paperSisters', 'cuckooElder', 'gearBig', 'gearSmall', 'thimbleMan', 'clothespins', 'coinElder', 'frogBro', 'alleyCat'] as const;

/** 시험용: 이 파일의 모든 격자와 그 팔레트 */
export function residentGrids(): { name: string; g: Grid; pal: Palette }[] {
  const out: { name: string; g: Grid; pal: Palette }[] = [];
  const add = (name: string, gs: Grid[], pal: Palette) => gs.forEach((g, i) => out.push({ name: `${name}${i}`, g, pal }));
  add('tin', [TIN_DOWN, TIN_RIGHT, TIN_UP, TIN_KEY_FRONT, TIN_KEY_SIDE, TIN_KEY_BACK], tinPal());
  add('doll', [DOLL_BODY, DOLL_SIDE, ...DOLL_HEADS], dollPal(0, false));
  add('cuckoo', [CUCKOO, ...CUCKOO_DOOR, CUCKOO_WEIGHT], cuckooPal());
  add('gear', [GEAR_BIG, GEAR_SMALL, GEAR_EDGE, GEAR_AXLE], gearPal(true));
  add('drop', [DROP], { ...mat('.JUu.', hex('#8ad0f0')) });
  add('thimble', [THIMBLE_DOWN, THIMBLE_RIGHT, THIMBLE_UP], thimblePal());
  add('pin', [PIN, PIN_SIDE], pinPal(0, false));
  add('coin', [COIN_DOWN, COIN_SIDE, COIN_BACK, MATCH], coinPal());
  add('frog', [FROG_DOWN, FROG_RIGHT, FROG_UP], frogPal());
  add('cat', [CAT_SIT, CAT_SIDE, CAT_BACK, ...CAT_LEGS], catPal());
  return out;
}

// ═════════════════════════ 이야기 주민 (예전 보스 그림): 장난감 크기 ═════════════════════════
// 곰 대장 · 젤리 대왕 · 깡 장군 · 더스티 · 먼지 왕. 동작 여섯 (숨 둘 · 모으기 · 내리치기 · 맞기 · 고유)과
// 화난 2단계는 몸 격자 하나에 윗몸 옮기기 · 팔 조각 · 표정(닻)을 합성해 만든다.

export type BossPosePx = 'idle0' | 'idle1' | 'windup' | 'strike' | 'hurt' | 'special';

// ───────── 곰 대장: 군모 · 금빛 견장 · 배 솔기 (2단계: 솔기가 터져 솜이 비어져 나온다)
const BEAR_CHIEF: Grid = [
  '......TFf...ONNNNNNNNNNn...TFf......',
  '.....TFBFf.ONNNNNAANNNNNn.TFBFf.....',
  '.....TBbFfONNNNNNAANNNNNNnTFBbf.....',
  '.....TFFFOONNNNNNNNNNNNNNnnFFFf.....',
  '......tTTnnnnnnnnnnnnnnnnnnTTt......',
  '.....TFFFFFFFFFFFFFFFFFFFFFFFFf.....',
  '....TFFFFFFFFFFFFFFFFFFFFFFFFFFf....',
  '....TFFFFFFFFFFFFFFFFFFFFFFFFFFf....',
  '....TFFFFFFFFFFFFFFFFFFFFFFFFFFf....',
  '....TFFFFFFFFFFFFFFFFFFFFFFFFFFf....',
  '....TFFFFFFFFFXPPPPPPpFFFFFFFFFf....',
  '....TFFFFFFFFXPPkkkkPPpFFFFFFFFf....',
  '....TFFFFFFFFPPPPkkPPPPFFFFFFFFf....',
  '....TFFFFFFFFpPPPPPPPPpFFFFFFFFf....',
  '....tFFFFFFFFFppppppppFFFFFFFFFf....',
  '.....tFFFFFFFFFFFFFFFFFFFFFFFff.....',
  '......ttFFFFFFFFFFFFFFFFFFFfft......',
  '........tttttttttttttttttttt........',
  '......AAAAaTFFFFFFFFFFFFfAAAAa......',
  '.....YAAAAAFFFFFFFFFFFFFFYAAAAa.....',
  '.....aZaZaTFFFFFFFFFFFFFFfaZaZa.....',
  '....TFFFFFFFFFFFFFFFFFFFFFFFFFFf....',
  '...TFFFFFFFXPPPPPPPPPPPPpFFFFFFFf...',
  '...TFFFFFFXPPPPPPpPPPPPPPpFFFFFFf...',
  '...TFFFFFFXPPPPPPPPPPPPPPpFFFFFFf...',
  '...TFFFFFFXPPPPPPpPPPPPPPpFFFFFFf...',
  '...TFFFFFFXPPPPPPPPPPPPPPpFFFFFFf...',
  '...TFFFFFFXPPPPPPpPPPPPPPpFFFFFFf...',
  '...TFFFFFFXPPPPPPPPPPPPPPpFFFFFFf...',
  '...TFFFFFFXPPPPPPpPPPPPPPpFFFFFFf...',
  '...TFFFFFFXPPPPPPPPPPPPPPpFFFFFFf...',
  '...tFFFFFFFppppppppppppppFFFFFFFf...',
  '....tFFFFFFFFFFFFFFFFFFFFFFFFFFf....',
  '....ttFFFFFFFFFFFFFFFFFFFFFFFFft....',
  '......TFFFFFFFFf....TFFFFFFFFf......',
  '.....TFFFFFFFFFFf..TFFFFFFFFFFf.....',
  '.....TFFXPPPPXFFf..TFFXPPPPXFFf.....',
  '.....TFXPPPPPPXFf..TFXPPPPPPXFf.....',
  '.....tFFpPPPPpFFf..tFFpPPPPpFFf.....',
  '......tttttttttt....tttttttttt......',
];
/** 왼팔 (오른팔은 뒤집기). 오른팔에는 덧댄 천 조각 */
const BEAR_ARM: Grid = ['..TFFf..', '.TFFFFf.', 'TFFFFFFf', 'TFFFFFFf', 'TFFFFFFf', 'TFFFFFFf', 'TFFFFFFf', 'TFFXPPFf', '.TXPPPf.', '..tpppt.'];
const BEAR_PATCH: Grid = ['BbBbB', 'BBBBb', 'bBBBb', 'BbBbB'];
const BEAR_TEAR: Grid = ['.kwwk.', 'kwwwwk', 'wwXwww', 'kwwwwk', '.kwwk.'];
const bearChiefPal = (phase: number): Palette => ({
  ...COMMON,
  ...mat('.TFft', phase >= 2 ? hex('#8a5232') : hex('#9a6038'), { light: 0.18, shadow: 0.2, deep: 0.38 }),
  ...mat('.XPp.', hex('#e8c08c'), { light: 0.2, shadow: 0.16 }),
  ...mat('ONn..', hex('#34508c'), { gloss: 0.2 }),
  ...mat('.YAaZ', hex('#e8c040')),
  ...mat('..Bb.', hex('#c8784a')),
  k: hex('#2a1810'),
  w: hex('#f4f0e8'),
});

// ───────── 젤리 대왕: 보랏빛 젤리 덩어리 + 보석 왕관 (2단계: 분홍빛으로 달아오른다)
const JELLY: Grid = [
  '...........Y..Y.YY.Y..Y...........',
  '...........YA.YAYYAY.Aa...........',
  '...........YAAAAAAAAAAa...........',
  '...........YAQAAJJAAGAa...........',
  '...........AaaaaaaaaaaZ...........',
  '.........TTFFFFFFFFFFFFFFf........',
  '.......TwwFFFFFFFFFFFFFFFFf.......',
  '.....TwwwFFFFFFFFFFFFFFFFFFFf.....',
  '....TwwFFFFFFFFFFFFFFFFFFFFFFf....',
  '...TwFFFFFFFFFFFFFFFFFFFFFFFFFf...',
  '..TFFFFFFFFFFFFFFFFFFFFFFFFFFFFf..',
  '..TFFFFFFFFFFFFFFFFFFFFFFFFFFFFf..',
  '.TFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFf.',
  '.TFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFf.',
  '.TFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFf.',
  '.TFBbFFFFFFFFFFFFFFFFFFFFFFFFBbFf.',
  '.TFbbFFFFFFFFFFFFFFFFFFFFFFFFbbFf.',
  '.TFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFf.',
  'TFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFf',
  'TFFFFFFFBbFFFFFFFFFFFFFFFFFFFFFFff',
  'TFFFFFFFbbFFFFFFFFFFFFFFFFBbFFFFff',
  'TFFFFFFFFFFFFFFFFFFFFFFFFFbbFFFFff',
  'TFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFfff',
  'tFFFFFFFFFFFFFFFFFFFFFFFFFFFFFffft',
  'ttffFFFFFFFFFFFFFFFFFFFFFFFFffffft',
  '.ttffffffffffffffffffffffffffffft.',
  '..tttttttttttttttttttttttttttttt..',
];
const BUBBLE: Grid = ['.ww.', 'wFFw', 'wFFf', '.ff.'];
const jellyPal = (phase: number): Palette => ({
  ...COMMON,
  ...mat('.TFft', phase >= 2 ? hex('#d05a9a') : hex('#9a6ad8'), { light: 0.2, shadow: 0.18, deep: 0.36 }),
  ...mat('..Bb.', phase >= 2 ? hex('#e88ac0') : hex('#b890ec')),
  ...mat('.YAaZ', hex('#f0c848')),
  ...mat('.QRr.', hex('#e04848')),
  ...mat('.JUu.', hex('#48a8e8')),
  ...mat('.KGg.', hex('#58c868')),
  w: hex('#f0e4ff'),
});

// ───────── 깡 장군: 빨간 띠 두른 통조림 깡통 장군, 별 훈장 · 말굽 자석 손 (2단계: 찌그러진 자국 · 녹)
const TIN_GEN: Grid = [
  '............QR..............',
  '............Rr..............',
  '...........kMMk.............',
  '.......IIIMMMMMMMMMm........',
  '......IMMMMMMMMMMMMMm.......',
  '......IMMMMMMMMMMMMMm.......',
  '......IMMMMMMMMMMMMMm.......',
  '......IMMMMMMMMMMMMMm.......',
  '......IMMMMMMMMMMMMMm.......',
  '......IMMMMMMMMMMMMMm.......',
  '......IMMMMmmmmMMMMMm.......',
  '......mmmmmmmmmmmmmmm.......',
  '....kkIIIMMMMMMMMMMMmkk.....',
  '....IIMMMMMMMMMMMMMMMmm.....',
  '....YAAAAAAAAAAAAAAAAAa.....',
  '....QRRRRRRRRRRRRRRRRRr.....',
  '....QRRRRRPPPPPPPRRRRRr.....',
  '....QRRRRPPPPYPPPPRRRRr.....',
  '....QRRRRPPPYYYPPPRRRRr.....',
  '....QRRRRPPPPYPPPPRRRRr.....',
  '....QRRRRRPPPPPPPRRRRRr.....',
  '....QRRRRRRRRRRRRRRRRRr.....',
  '....YAAAAAAAAAAAAAAAAAa.....',
  '....IMMMMMMMMMMMMMMMMMm.....',
  '....IMMMMMMMMMMMMMMMMMm.....',
  '....mmmmmmmmmmmmmmmmmmm.....',
  '.......IMMMm...IMMMm........',
  '.......IMMMm...IMMMm........',
  '.......IMMMm...IMMMm........',
  '.......IMMMm...IMMMm........',
  '......kkkkkk..kkkkkk........',
  '.....kkkkkkk..kkkkkkk.......',
];
const TIN_ARM: Grid = ['.IMm.', 'IMMMm', 'IMMMm', 'IMMMm', 'IMMMm', 'IMMMm', 'IMMMm', 'QRRRr', 'QR.Rr', 'II.Im'];
const TIN_DENT: Grid = ['..mk..', '.mkkm.', 'mkkkkm', '.mmmm.', 'B..Bb.', '.bB..B'];
const tinGenPal = (phase: number): Palette => ({
  ...COMMON,
  ...mat('.IMmk', hex('#a8b2bc'), { light: 0.25, shadow: 0.2, deep: 0.45 }),
  ...mat('.QRr.', hex('#c8443a')),
  ...mat('.YAaZ', hex('#e8c040')),
  ...mat('.XPp.', hex('#f0e4c8')),
  ...mat('..Bb.', hex('#a8603a')),
  E: phase >= 2 ? hex('#e05040') : hex('#3a2420'),
});

// ───────── 더스티: 침대 밑 먼지 뭉치 (파란 실 한 가닥이 엉켜 있다), 작은 빗자루 (2단계: 더 부스스)
const DUSTY: Grid = [
  '..........TF..TFf..TF.........',
  '.......TF.TFFfTFFFfTFFf.TF....',
  '......TFFfFFFFBFFFFFFFFFf.....',
  '....TFTFFFFBBFFFFFFFFFFFfFf...',
  '...TFFFFFFFFFFFFFFBBFFFFFFf...',
  '..TFFFBFFFFFFFFFFFFFFFFFFFFf..',
  '.TTFFFFFFFFFFFFFFFFFFFFFFFFff.',
  'TFFFFFFFFFFFFFFFFFFFFFFFFFFFf.',
  '.TFFFFFFFFFFFFFFFFFFFFFFFFFFff',
  'TFFFFFFFFFFFFFFFFFFFFFFFFFFFf.',
  '.TFFFFFFFFFFFFFFFFFFFFFFFFFFff',
  'TFBFFFFFFFFFFFFFFFFFFFFFFFFFf.',
  '.TFFFFFFFFFFFFFFFFFFFFFFFFFFff',
  'TFFFFFFFFFFFFFFFFFFFFFFFFBFFf.',
  '.TFFFFQQFFFFFFFFFFFFFFFFFFFFff',
  'TFFFFFFFQRFFFFFFFFFFFFFFFFFfff',
  '.tFFFFFFFFRrFFFFFFFFFFFFFFFff.',
  'tfFFFFFFFFFFRrFFFFFFFfFFFFfff.',
  '.tffFFFFFFFFFFrFFFFFffFFfffft.',
  '..tfffFFFFFFFFFFFFFFffffffft..',
  '...tt.tfffffffffffffffftt.t...',
  '.......t.tt.tt..tt.tt.t.......',
];
const BROOM: Grid = ['.W.', '.W.', '.W.', '.W.', '.W.', '.W.', '.W.', '.w.', 'YAa', 'YAa', 'AAa', 'AaZ', 'aZa'];
const FLUFF: Grid = ['.TF.', 'TFFf', '.ff.'];
const dustyPal = (phase: number): Palette => ({
  ...COMMON,
  ...mat('.TFft', phase >= 2 ? hex('#6e6878') : hex('#8a8494'), { light: 0.2, shadow: 0.16, deep: 0.32 }),
  ...mat('..Bb.', hex('#a8a2b0')),
  ...mat('.QRr.', hex('#6a98c8')),
  ...mat('.VWw.', hex('#a07040')),
  ...mat('.YAaZ', hex('#d8b058')),
  E: phase >= 2 ? hex('#e8c040') : EYE,
});

// ───────── 먼지 왕: 커다란 먼지 덩어리 + 기운 왕관 + 보라 망토 자락 (2단계: 눈이 주황으로)
const DUST_KING: Grid = [
  '..............Y..Y..Y..Y................',
  '..............YA.YAaYA.Aa...............',
  '..............YAAAAJAAAAa...............',
  '..............AaaaaaaaaaZ...............',
  '.........TF..TFFFFFFFFFFFf..TF..........',
  '......TF.TFFfFFFFFFFFFFFFFFfTFFf.TF.....',
  '.....TFFfFFFFFFFFFBFFFFFFFFFFFFFfFFf....',
  '...TFTFFFFBBFFFFFFFFFFFFFFFFFFFFFFFFf...',
  '..TFFFFFFFFFFFFFFFFFFFFFFFFFFFBBFFFFFf..',
  '.TFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFf..',
  '.TFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFf.',
  'TFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFf.',
  '.TFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFff',
  'TFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFf.',
  '.TFBFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFff',
  'TFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFf.',
  '.TFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFBFff',
  'TFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFf.',
  '.TFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFff',
  'TFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFfff',
  '.TFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFff.',
  'TFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFfff.',
  '.tFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFffft.',
  'JUtfFFFFFFFFFFFFFFFFFFFFFFFFFFFFFfffuUu.',
  'JUUtffFFFFFFFFFFFFFFFFFFFFFFFFffffuUUUu.',
  'JUUUttfffffffffffffffffffffffffftuUUUUu.',
  'JUUUUUUttUUtUUtUUUtUUtUUtUUUUUUUUUUUUuu.',
  '.uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu..',
];
/** 2단계: 이마에 소용돌이치는 먼지 (성난 주름) */
const KING_RAGE: Grid = ['.BB....BB.', 'B..B..B..B', '.bb.bb.bb.'];
const KING_ARM: Grid = ['..TF..', '.TFFf.', 'TFFFFf', 'TFFFFf', 'TFFFFf', '.tFFf.', '..tf..'];
const kingPal = (phase: number): Palette => ({
  ...COMMON,
  ...mat('.TFft', hex('#5a5466'), { light: 0.2, shadow: 0.2, deep: 0.36 }),
  ...mat('..Bb.', hex('#7a7488')),
  ...mat('.YAaZ', hex('#d8b048')),
  ...mat('.JUu.', hex('#6a3a9a')),
  E: phase >= 2 ? hex('#f08a30') : hex('#e04848'),
});

interface BossDef {
  g: Grid;
  /** 이 줄 위가 윗몸 (숨쉬기 · 모으기 · 내리치기에 움직인다) */
  waist: number;
  pal: (phase: number) => Palette;
  /** 두 눈 왼쪽 위 칸 · 눈 크기 · 입 왼칸 (격자 좌표) */
  eyes: [number, number][];
  ew: number;
  eh: number;
  mouth: [number, number];
  /** 왼팔 조각과 동작별 자리 (격자 좌표, 오른팔은 몸 가운데에 대칭) */
  arm?: Grid;
  arms?: Record<BossPosePx, [number, number]>;
  /** 화난 2단계 덧그림 */
  patch2?: { g: Grid; x: number; y: number };
}

const BOSS_DEF: Record<string, BossDef> = {
  b_bear: {
    g: BEAR_CHIEF, waist: 21, pal: bearChiefPal, eyes: [[11, 7], [23, 7]], ew: 2, eh: 3, mouth: [17, 13],
    arm: BEAR_ARM, arms: { idle0: [0, 21], idle1: [0, 22], windup: [1, 6], strike: [5, 27], hurt: [1, 19], special: [1, 26] },
    patch2: { g: BEAR_TEAR, x: 15, y: 25 },
  },
  b_jelly: { g: JELLY, waist: 17, pal: jellyPal, eyes: [[11, 11], [21, 11]], ew: 2, eh: 3, mouth: [16, 15] },
  b_tin: {
    g: TIN_GEN, waist: 14, pal: tinGenPal, eyes: [[9, 6], [16, 6]], ew: 2, eh: 2, mouth: [12, 9],
    arm: TIN_ARM, arms: { idle0: [0, 14], idle1: [0, 15], windup: [0, 4], strike: [3, 18], hurt: [0, 13], special: [0, 2] },
    patch2: { g: TIN_DENT, x: 16, y: 5 },
  },
  b_dusty: { g: DUSTY, waist: 13, pal: dustyPal, eyes: [[9, 9], [19, 9]], ew: 2, eh: 2, mouth: [14, 13] },
  b_king: {
    g: DUST_KING, waist: 20, pal: kingPal, eyes: [[13, 12], [24, 12]], ew: 3, eh: 2, mouth: [18, 17],
    arm: KING_ARM, arms: { idle0: [0, 15], idle1: [0, 16], windup: [1, 3], strike: [4, 19], hurt: [0, 14], special: [1, 2] },
    patch2: { g: KING_RAGE, x: 15, y: 8 },
  },
};
export const BOSS_PX_IDS = Object.keys(BOSS_DEF);

/** 동작마다 윗몸이 움직이는 칸 [dx, dy] (몸 전체 dx 는 맞기에만) */
const UPPER: Record<BossPosePx, [number, number]> = { idle0: [0, 0], idle1: [0, 1], windup: [-1, -2], strike: [2, 2], hurt: [0, 0], special: [0, 2] };

/** 이야기 주민 그림 한 장 (보스 크기 계약: 동작 여섯 · 단계) */
export function bossPxSprite(id: string, pose: BossPosePx, phase: number): Pix {
  const D = BOSS_DEF[id] ?? BOSS_DEF.b_bear;
  const pal = D.pal(phase);
  const { w: gw, h: gh } = gridSize(D.g);
  const W = gw + 6;
  const H = gh + 6;
  const p = new Pix(W, H);
  const shiftAll = pose === 'hurt' ? -2 : 0;
  const x0 = 3 + shiftAll;
  const y0 = H - 2 - gh;
  const [ux, uy] = UPPER[pose];
  const upper = D.g.slice(0, D.waist);
  const lower = D.g.slice(D.waist);
  // 아랫몸 → (모으기: 늘어난 틈 메우기) → 윗몸
  paintGrid(p, lower, x0, y0 + D.waist, pal);
  for (let k = uy; k < 0; k++) paintGrid(p, [D.g[D.waist - 1]], x0 + Math.round((ux * (k - uy)) / -uy), y0 + D.waist - 1 + k + 1, pal);
  paintGrid(p, upper, x0 + ux, y0 + uy, pal);
  // 고유 몸짓 · 소품
  if (id === 'b_dusty') {
    const bx = pose === 'windup' ? x0 + gw - 3 : pose === 'strike' ? x0 + gw - 1 : x0 + gw - 4;
    const by = pose === 'windup' ? y0 - 2 : y0 + gh - BROOM.length;
    paintGrid(p, BROOM, bx, by, pal, pose === 'strike');
    if (pose === 'special' || phase >= 2)
      for (const [fx, fy] of [[1, 2], [gw - 2, 4], [0, gh - 8], [gw, gh - 12]]) paintGrid(p, FLUFF, x0 + fx - 1, y0 + fy - 1, pal);
  }
  if (id === 'b_jelly' && (pose === 'special' || pose === 'windup'))
    for (const [bx, by] of [[1, 2], [gw - 3, 4], [-1, 10], [gw, 12]]) paintGrid(p, BUBBLE, x0 + bx, y0 + by - (pose === 'windup' ? 3 : 0), pal);
  if (D.patch2 && phase >= 2) paintGrid(p, D.patch2.g, x0 + D.patch2.x + (D.patch2.y < D.waist ? ux : 0), y0 + D.patch2.y + (D.patch2.y < D.waist ? uy : 0), pal);
  // 팔: 왼팔 · 오른팔 (몸 가운데 대칭)
  if (D.arm && D.arms) {
    const [ax, ay] = D.arms[pose];
    const aw = gridSize(D.arm).w;
    paintGrid(p, D.arm, x0 + ax + (pose === 'strike' ? ux : 0), y0 + ay, pal);
    paintGrid(p, D.arm, x0 + gw - aw - ax + (pose === 'strike' ? ux : 0), y0 + ay, pal, true);
    if (id === 'b_bear') paintGrid(p, BEAR_PATCH, x0 + gw - aw - ax + 2 + (pose === 'strike' ? ux : 0), y0 + ay + 3, pal);
  }
  bossFace(p, D, x0 + ux, y0 + uy, pose, pal);
  return softOutline(p, WARM_INK, 0.6);
}

function bossFace(p: Pix, D: BossDef, fx: number, fy: number, pose: BossPosePx, pal: Palette): void {
  const E = pal.E;
  const brow = shade(pal.F ?? E, -0.45);
  D.eyes.forEach(([ex0, ey0], i) => {
    const x = fx + ex0;
    const y = fy + ey0;
    const out = i === 0 ? -1 : 1;
    if (pose === 'hurt') {
      // > < 꼭 감은 눈
      const o = out < 0 ? 0 : D.ew - 1;
      p.set(x + o, y - 1, E);
      p.set(x + D.ew - 1 - o, y, E);
      p.set(x + o, y + 1, E);
      return;
    }
    if (pose === 'special') {
      // 태엽이 풀린 듯 멍한 X 눈
      p.set(x, y, E);
      p.set(x + D.ew - 1, y, E);
      p.set(x + Math.floor((D.ew - 1) / 2), y + 1, E);
      p.set(x, y + 2, E);
      p.set(x + D.ew - 1, y + 2, E);
      return;
    }
    p.rect(x, y, D.ew, D.eh, E);
    p.set(x, y, pal.w);
    if (pose === 'windup' || pose === 'strike') {
      // 화난 눈썹: 안쪽이 내려간다
      p.set(out < 0 ? x : x + D.ew - 1, y - 2, brow);
      p.set(out < 0 ? x + 1 : x + D.ew - 2, y - 1, brow);
    }
  });
  const [mx, my] = D.mouth;
  const x = fx + mx;
  const y = fy + my;
  if (pose === 'strike') {
    p.rect(x - 1, y, 4, 2, MOUTH);
    p.rect(x, y + 1, 2, 1, hex('#e07080'));
  } else if (pose === 'hurt' || pose === 'special') {
    p.set(x - 1, y + 1, MOUTH);
    p.set(x, y, MOUTH);
    p.set(x + 1, y + 1, MOUTH);
    p.set(x + 2, y, MOUTH);
  } else p.rect(x, y, 2, 1, MOUTH);
}

/** 시험용: 주민 격자 목록에 이야기 주민도 */
export function bossGrids(): { name: string; g: Grid; pal: Palette }[] {
  return [
    ...[BEAR_CHIEF, BEAR_ARM, BEAR_PATCH, BEAR_TEAR].map((g, i) => ({ name: `bear${i}`, g, pal: bearChiefPal(2) })),
    ...[JELLY, BUBBLE].map((g, i) => ({ name: `jelly${i}`, g, pal: jellyPal(1) })),
    ...[TIN_GEN, TIN_ARM, TIN_DENT].map((g, i) => ({ name: `tin${i}`, g, pal: tinGenPal(1) })),
    ...[DUSTY, BROOM, FLUFF].map((g, i) => ({ name: `dusty${i}`, g, pal: dustyPal(1) })),
    ...[DUST_KING, KING_ARM, KING_RAGE].map((g, i) => ({ name: `king${i}`, g, pal: kingPal(1) })),
  ];
}
