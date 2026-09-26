export interface Pixel {
  x: number;
  y: number;
  color: string;
}

export interface Sprite {
  width: number;
  height: number;
  pixels: Pixel[];
}

/** 글자 그림 → 도트 목록. '.' 은 투명, 나머지 글자는 팔레트 색. */
export function parseSprite(rows: string[], palette: Record<string, string>): Sprite {
  if (rows.length === 0) throw new Error('빈 그림');
  const width = rows[0].length;
  const pixels: Pixel[] = [];
  rows.forEach((row, y) => {
    if (row.length !== width) throw new Error(`${y + 1}번 줄 길이가 ${row.length} (다른 줄은 ${width})`);
    [...row].forEach((ch, x) => {
      if (ch === '.') return;
      const color = palette[ch];
      if (!color) throw new Error(`팔레트에 없는 글자 '${ch}' (${y + 1}번 줄)`);
      pixels.push({ x, y, color });
    });
  });
  return { width, height: rows.length, pixels };
}

/** 오른쪽 여백을 '.' 으로 채워 모든 줄을 width 폭으로 맞춘다. 그릴 때 뒤쪽 점을 셀 필요가 없다. */
export function grid(width: number, rows: string[]): string[] {
  return rows.map((row, i) => {
    if (row.length > width) throw new Error(`${i + 1}번 줄이 폭 ${width} 보다 김 (${row.length})`);
    return row.padEnd(width, '.');
  });
}

/** 걷기 프레임 번호. id 로 박자를 어긋나게 한다. */
export function walkFrame(time: number, id: number, count: number, fps: number): number {
  return (Math.floor(time * fps) + id) % count;
}

/** 그림은 모두 오른쪽을 본다. 탑보다 오른쪽에 있는 적은 왼쪽(탑 쪽)을 보도록 뒤집는다. */
export function facesLeft(x: number, towerX: number): boolean {
  return x > towerX;
}

// ───────────────────────── 그림 ─────────────────────────
// 모두 오른쪽을 보고 있다. 프레임 B 는 다리(와 팔) 줄만 바꾼다.

const OUTLINE = { k: '#1b1522', w: '#f4f1e8', r: '#e0404a', y: '#ffd75e', Y: '#c9962c' };

function frames(width: number, palette: Record<string, string>, base: string[], changes: Record<number, string>): Sprite[] {
  const a = grid(width, base);
  const b = [...a];
  for (const [row, text] of Object.entries(changes)) b[Number(row)] = grid(width, [text])[0];
  const pal = { ...OUTLINE, ...palette };
  return [parseSprite(a, pal), parseSprite(b, pal)];
}

const GOBLIN = frames(
  12,
  { g: '#7bc96f', G: '#4e9a45', b: '#8a5a34', B: '#5e3b20' },
  [
    '.k........k.',
    '.gk.kkkk.kg.',
    '..gkggggkg..',
    '..kgggwkgk..',
    '..kggggggk..',
    '...kgrrgk...',
    '..kbbbbbbk..',
    '.kgkbBBbkgk.',
    '.kk.kbbk.kk.',
    '....kBBk....',
    '...kk..kk...',
    '...kk..kk...',
  ],
  { 10: '....kk.kk...', 11: '...kk...kk..' },
);

const WOLF = frames(
  15,
  { s: '#b4b4c4', S: '#7c7c90' },
  [
    '..........k.k',
    '.........ksksk',
    'k........ksssk',
    'sk..kkkkksswskk',
    '.sk.ksssssssssk',
    '..kkssssssssskk',
    '...kSsssssssSk',
    '...kSSkkkkkSSk',
    '...kk.k...k.kk',
    '...k..k...k..k',
  ],
  { 8: '....k.kk.kk.k', 9: '...k...k.k...k' },
);

const ORC = frames(
  16,
  { o: '#9bb85a', O: '#6f8a3a', m: '#a0a6b8', M: '#646a7c', b: '#7a5230' },
  [
    '.....kkkkkk',
    '....kMmmmmMk',
    '...kMmmmmmmMk',
    '...koooooowkok',
    '...kooooooooook',
    '...kOoooooowowk',
    '....kOoooooook',
    '..kkmmMmmmmMkk',
    '.koMmmbbbbmmMok',
    '.kokmmbbbbmmkok',
    '.kOk.mmmmmm.kOk',
    '..k..kbbbbk..k',
    '.....kbkkbk',
    '.....kbk.kbk',
    '....kkkk.kkkk',
    '',
  ],
  { 13: '....kbk...kbk', 14: '...kkkk...kkkk' },
);

const GOLEM = frames(
  22,
  { p: '#9a8ac8', P: '#6c5c9e', q: '#4a3e74', c: '#7ff0ff' },
  [
    '......kkkkkkkkkk',
    '.....kppppppppppk',
    '.....kpPpppppPppk',
    '.....kppppppccppk',
    '.....kPppppppppPk',
    '.....kkqqqqqqqqkk',
    '..kkkkppppppppppkkkk',
    '.kppppkpPppppppkppppk',
    '.kpPppkppppqpppkpPppk',
    '.kppppkpqppppppkppppk',
    '.kpPppkppppppPpkppppk',
    '.kppppkppppppppkpPppk',
    '.kkkkkkpppqppppkkkkkk',
    '..kppk.kPppppppk.kppk',
    '..kqqk.kppppppPk.kqqk',
    '..kkkk.kkkkkkkkk.kkkk',
    '.......kppk..kppk',
    '.......kppk..kppk',
    '.......kPpk..kPpk',
    '......kkppk..kppkk',
    '......kqqqk..kqqqk',
    '......kkkkk..kkkkk',
  ],
  {
    17: '......kppk....kppk',
    18: '......kPpk....kPpk',
    19: '.....kkppk....kppkk',
    20: '.....kqqqk....kqqqk',
    21: '.....kkkkk....kkkkk',
  },
);

const BOSS = frames(
  30,
  { e: '#c8404c', E: '#8e2632', f: '#f08a5a' },
  [
    '...........y...y...y',
    '...........yy.yyy.yy',
    '...........yyyyyyyyy',
    '...........yYyYyYyYy',
    '..........kkkkkkkkkkk',
    '.........keeeeeeeeeeek',
    '........keeeeeeeeeeeeek',
    '........keeEeeeeeyykeek',
    '........keeeeeeeeyykeek',
    '........keEeeeeeeeeeeeek',
    '........keeeeeeeeeewwwwk',
    '........kkeeeeeeeeekkkkk',
    '.....kkkkkeeeeeeeeeekkkkkk',
    '....keeeekfffffffffkeeeeek',
    '...keeEeekffffffffffkeEeeek',
    '...keeeeekfffffffffffkeeeek',
    '..keeEeeekfffffffffffkeeEeek',
    '..keeeeeekfffffffffffkeeeeek',
    '..kwkwkwkkffffffffffkkwkwkwk',
    '..k.k.k.kkffffffffffk.k.k.k',
    '.........kffffffffffk',
    '.........keeeeeeeeeek',
    '.........kEeeeeeeeeEk',
    '.........keeeekkeeeek',
    '.........keeeek.keeeek',
    '........keeeek..keeeek',
    '........kEeek....kEeek',
    '.......kkeeek....keeekk',
    '.......kwwwwk....kwwwwk',
    '.......kkkkkk....kkkkkk',
  ],
  {
    18: '..kwkwkwkkffffffffffkkwkwkwk',
    19: '...k.k.k.kffffffffffk.k.k.k',
    24: '........keeeek..keeeek',
    25: '.......keeeek....keeeek',
    26: '......kEeek......kEeek',
    27: '.....kkeeek......keeekk',
    28: '.....kwwwwk......kwwwwk',
    29: '.....kkkkkk......kkkkkk',
  },
);

export const ENEMY_SPRITES: Record<string, Sprite[]> = {
  goblin: GOBLIN,
  wolf: WOLF,
  orc: ORC,
  golem: GOLEM,
  boss: BOSS,
};
