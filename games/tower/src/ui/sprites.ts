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

const SLIME = frames(
  12,
  { g: '#6fdc6f', G: '#3f9a45' },
  ['....kkkk', '..kkgggGkk', '.kgggggggGk', '.kggggwkgwk', 'kgggggggggGk', 'kgGgggggggGk', 'kggggggggggk', '.kGggggggGk', '..kkkkkkkk', ''],
  { 0: '', 1: '....kkkk', 2: '..kkgggGkk', 3: '.kggggwkgwk', 7: 'kgGgggggggGk', 8: '.kkkkkkkkkk' },
);

const SLIMELET_SPRITE = frames(
  8,
  { g: '#9fe89a', G: '#5fb85a' },
  ['..kkkk', '.kgggwk', 'kggggggk', 'kgGgggGk', '.kkkkkk', ''],
  { 0: '', 1: '..kkkk', 2: '.kgggwk', 4: 'kkkkkkkk' },
);

const THIEF_SPRITE = frames(
  12,
  { h: '#4a3e5e', g: '#7bc96f', b: '#b08a4a' },
  ['....hhhh', '...hhhhhh', '..hhgggwk', 'b.hgggggk', 'bbkgggrgk', 'bbkhhhhk', 'bbkhhhhhk', '.bkhhhhk', '..khhk', '..khhk', '..kk.kk', '..kk.kk'],
  { 10: '...kkkk', 11: '..kk..kk' },
);

const SHIELD_SPRITE = frames(
  16,
  { m: '#a0a6b8', S: '#5a6aa0' },
  [
    '....kkkkk',
    '...kmmmmmk',
    '...kmkwkmk',
    '...kmmmmmk',
    '..kkmmmmmk.kkkk',
    '.kmmmmmmmkkSSSSk',
    '.kmmmmmmmkSSySSk',
    '.kmmmmmmmkSyyySk',
    '.kmmmmmmmkSSySSk',
    '.kkmmmmmkkSSSSSk',
    '..kmmmmmk.kSSSk',
    '..kmmkmmk..kkk',
    '..kmk.kmk',
    '..kmk.kmk',
    '.kkk..kkk',
    '',
  ],
  { 12: '..kmk..kmk', 13: '...kmk.kmk', 14: '..kkk..kkk' },
);

const SHAMAN_SPRITE = frames(
  14,
  { p: '#3a5a9a', P: '#2a3f70', o: '#9bb85a', c: '#7ff0ff', b: '#8a5a34' },
  [
    '..........kk',
    '.........kcck',
    '...kkkk..kcck',
    '..kppppk..kbk',
    '.kppppppk.kb',
    '.kpoowopk.kb',
    '.kpoooopk.kb',
    '..kppppkkkbk',
    '.kppPPppppbk',
    '.kpPPPPppkb',
    '.kpPPPPppkb',
    '.kppPPpppkb',
    '..kpk.kpk.b',
    '..kk...kk.k',
  ],
  { 1: '.........kwck', 12: '...kpkkpk.b', 13: '..kk....kkk' },
);

const BAT_SPRITE = frames(
  13,
  { p: '#7a5cff' },
  ['k...........k', 'kk.........kk', 'kpk..kkk..kpk', 'kppkkpppkkppk', '.kppppwpwpppk', '..kpppppppk', '...kkpppkk', '.....kkk', ''],
  {
    0: '',
    1: '',
    2: '.....kkk',
    3: '....kpppk',
    4: '..kkpwpwpkk',
    5: '.kpppppppppk',
    6: 'kpppkpppkpppk',
    7: 'kppk.kkk.kppk',
    8: 'kk.........kk',
  },
);

const RHINO = frames(
  30,
  { s: '#8a93a6', S: '#5b6273', h: '#efe6cf' },
  [
    '.........................hk',
    '........................hhk',
    '.......................hhk',
    '.......kkkkkkkkkkk....khhk',
    '.....kkSSsssssssSSkk.kSsk',
    '....kSsssssssssssssSkSsssk',
    '...kSssSsssSsssSssssSsswrsk',
    '..kSsssSsssSsssSssssssssssk',
    '.kksssssssssssssssssssssssk',
    'kk.kSsssssssssssssssssssSkk',
    '...kSSssssssssssssssssssSk',
    '...kSSSsssssssssssssssSSSk',
    '....kSSSSSSSSSSSSSSSSSSSk',
    '....kSSSk.kSSSk.kSSSk.kSSSk',
    '....kSSSk.kSSSk.kSSSk.kSSSk',
    '....kSSSk.kSSSk.kSSSk.kSSSk',
    '....kwwwk.kwwwk.kwwwk.kwwwk',
    '....kkkkk.kkkkk.kkkkk.kkkkk',
  ],
  {
    13: '...kSSSk..kSSSk.kSSSk..kSSSk',
    14: '...kSSSk..kSSSk..kSSSk.kSSSk',
    15: '..kSSSk....kSSSk.kSSSk.kSSSk',
    16: '..kwwwk....kwwwk.kwwwk.kwwwk',
    17: '..kkkkk....kkkkk.kkkkk.kkkkk',
  },
);

const WITCH = frames(
  24,
  { p: '#5a2d82', f: '#f2c09a', o: '#b8362a', O: '#7d1f18', b: '#6b4423' },
  [
    '..........kk..........r',
    '.........kppk........ryr',
    '........kpppk........ryr',
    '.......kppppk.........r',
    '......kppppppk.......kyk',
    '.....kpyyyyyppk......kbk',
    '..kkkkkkkkkkkkkkkk...kbk',
    '.kppppppppppppppppk..kbk',
    '..kkkkfffffffkkkk....kbk',
    '......kffwkffk.......kbk',
    '......kffffffk.......kbk',
    '.......kkkkkk........kbk',
    '.....kkoooookk.......kbk',
    '....koooooooookkkkkkkfbk',
    '...koooOooooOoooooookkbk',
    '...kooooooooooookk...kbk',
    '..koooOooooOoooook...kbk',
    '..kooooooooooooooook.kbk',
    '.koooOooooOooooOoook.kbk',
    '.koooooooooooooooook.kbk',
    'koooOooooOooooOoooookkbk',
    'kOoOoOoOoOoOoOoOoOok..k',
    '.kkkkkkkkkkkkkkkkkkk',
    '......kbbk..kbbk',
    '......kkkk..kkkk',
  ],
  {
    0: '..........kk.........r',
    1: '.........kppk........rr',
    2: '........kpppk.......ryyr',
    3: '.......kppppk........ryr',
    21: '.kOoOoOoOoOoOoOoOoOok.k',
    22: '..kkkkkkkkkkkkkkkkkk',
    23: '.......kbbk..kbbk',
    24: '.......kkkk..kkkk',
  },
);

export const ENEMY_SPRITES: Record<string, Sprite[]> = {
  goblin: GOBLIN,
  wolf: WOLF,
  orc: ORC,
  golem: GOLEM,
  boss: BOSS,
  boss_rhino: RHINO,
  boss_witch: WITCH,
  slime: SLIME,
  slimelet: SLIMELET_SPRITE,
  thief: THIEF_SPRITE,
  shield: SHIELD_SPRITE,
  shaman: SHAMAN_SPRITE,
  bat: BAT_SPRITE,
};

// ───────────────────────── 탑 ─────────────────────────

/** 가운데 정렬 (양쪽을 '.' 으로 채움) */
function center(width: number, rows: string[]): string[] {
  return rows.map((r) => {
    const left = Math.floor((width - r.length) / 2);
    return '.'.repeat(left) + r + '.'.repeat(width - r.length - left);
  });
}

function towerRows(): string[] {
  const roof = ['kk', 'kyyk', 'kyyk', 'kk'];
  for (let w = 2; w <= 18; w += 2) roof.push(`kV${'v'.repeat(w - 2)}Vk`);
  roof.push('k'.repeat(22));

  const merlon = 'ksssk..ksssk..ksssk..ksssk';
  const battlements = ['k'.repeat(26), merlon, merlon, 'k'.repeat(26), `k${'S'.repeat(24)}k`];

  const INNER = 22;
  const walls: string[] = [];
  for (let i = 0; i < 20; i++) {
    let inner = '';
    for (let j = 0; j < INNER; j++) {
      if (i % 5 === 4) inner += 'S';
      else inner += (j + (Math.floor(i / 5) % 2) * 3) % 6 === 5 ? 'S' : 's';
    }
    const chars = [...inner];
    // 창문 (가운데 위)
    if (i >= 2 && i <= 7) for (let j = 9; j <= 12; j++) chars[j] = j === 9 || j === 12 || i === 2 || i === 7 ? 'k' : 'y';
    // 문 (가운데 아래)
    if (i >= 13) for (let j = 8; j <= 13; j++) chars[j] = j === 8 || j === 13 || i === 13 ? 'k' : 'd';
    walls.push(`k${chars.join('')}k`);
  }
  const base = ['k'.repeat(26), 'k'.repeat(26)];
  return [...roof, ...battlements, ...walls, ...base];
}

export const TOWER_SPRITE: Sprite = parseSprite(center(28, towerRows()), {
  ...OUTLINE,
  s: '#7a8098',
  S: '#5a6078',
  V: '#6a3fb0',
  v: '#8a5cd6',
  d: '#6b4226',
});

// ───────────────────────── 아이콘 (9×9) ─────────────────────────

function icon(rows: string[], palette: Record<string, string>): Sprite {
  return parseSprite(grid(9, rows), { ...OUTLINE, ...palette });
}

export const ICONS: Record<string, Sprite> = {
  // 일반: 검
  normal: icon(
    ['.......kw', '......kwk', '.....kwk', '....kwk', '.k.kwk', '..kyk', '..yk', '.k.k', 'k'],
    { w: '#e8e1cf' },
  ),
  // 관통: 화살
  pierce: icon(
    ['......kkk', '.......gk', '......g.k', '.....g', '....g', '...g', 'kkg', '.kk', 'k.k'],
    { g: '#8fd16a' },
  ),
  // 마법: 수정
  magic: icon(
    ['....b', '...bwb', '..bwwwb', '.bwwbwwb', 'bwwbbbwwb', '.bwwbwwb', '..bwwwb', '...bwb', '....b'],
    { b: '#3f7fd8', w: '#bfe0ff' },
  ),
  // 공성: 폭탄
  siege: icon(
    ['.......y', '......ky', '.....k', '..kkkk', '.kooook', 'koowoook', 'kooooook', '.kooook', '..kkkk'],
    { o: '#4a4658', w: '#c8c0e0' },
  ),
  // 카오스: 소용돌이
  chaos: icon(
    ['..pppp', '.p....p', 'p..pp..p', 'p.p..p.p', 'p.p.pp.p', 'p..p...p', '.p....p', '..pppp', ''],
    { p: '#c77dff' },
  ),
  // 강화: 위 화살표
  upgrade: icon(['....y', '...yyy', '..yyyyy', '.yyyyyyy', '...yyy', '...yyy', '...yyy', '...yyy', ''], {}),
  coin: icon(
    ['..kkkkk', '.kyyyyyk', 'kyyYYYyyk', 'kyyYyyyyk', 'kyyYyyyyk', 'kyyYYYyyk', '.kyyyyyk', '..kkkkk', ''],
    {},
  ),
  heart: icon(
    ['.kk...kk', 'krrk.krrk', 'krwrkrrrk', 'krrrrrrrk', '.krrrrrk', '..krrrk', '...krk', '....k', ''],
    {},
  ),
  // 스킬: 불타는 운석
  meteor: icon(
    ['y', '.o', '..oy', '...okk', '...krrk', '...kRrrk', '....krrk', '.....kk', ''],
    { o: '#ff9d4d', r: '#8a7a66', R: '#b0a08a' },
  ),
  // 스킬: 눈송이
  snow: icon(['....w', '.w..w..w', '..w.w.w', '...www', 'wwwwwwwww', '...www', '..w.w.w', '.w..w..w', '....w'], { w: '#bfe0ff' }),
  // 스킬: 망치 (수리)
  hammer: icon(['.kkkkk', '.kmmmmk', '.kmmmmk', '..kkbk', '....bk', '....bk', '....bk', '....bk', '....kk'], { m: '#c8ccd8', b: '#8a5a34' }),
};

// ───────────────────────── 투사체 (오른쪽을 향함) ─────────────────────────

function proj(width: number, rows: string[], palette: Record<string, string>): Sprite {
  return parseSprite(grid(width, rows), { ...OUTLINE, ...palette });
}

export const PROJECTILES: Record<string, Sprite> = {
  // 돌팔매: 작은 돌
  stone: proj(4, ['.kk.', 'kssk', 'kSsk', '.kk.'], { s: '#9aa0b0', S: '#6a7080' }),
  // 쌍단검: 손잡이 + 칼날
  dagger: proj(8, ['...kkkk.', 'bbywwwwk', '...kkkk.'], { b: '#6b4226', w: '#dfe4f0' }),
  // 전투 도끼: 자루 + 날
  axe: proj(7, ['....kk.', '...kmmk', 'bbbbkmk', '...kmmk', '....kk.'], { b: '#8a5a34', m: '#c8ccd8' }),
  // 장궁: 붉은 깃 화살
  arrow: proj(10, ['ff.....k', 'fbbbbbbwwk', 'ff.....k'], { f: '#e0404a', b: '#a07a4a', w: '#d8def0' }),
  // 질풍 활: 바람을 두른 초록 화살
  galeArrow: proj(11, ['gg......k', 'gGGGGGGGwwk', 'gg......k'], { g: '#c8f0b0', G: '#8fd16a', w: '#f0fff0' }),
  // 노포: 굵은 볼트
  bolt: proj(14, ['ff..........k', 'fbbbbbbbbbbwwk', 'fbbbbbbbbbbwwk', 'ff..........k'], { f: '#6a7080', b: '#7a5230', w: '#c8ccd8' }),
  // 서리 구슬
  frostOrb: proj(6, ['.kkkk.', 'kwccck', 'kcwcck', 'kcccck', 'kcccCk', '.kkkk.'], { c: '#9fd8ff', C: '#5aa0e0' }),
  // 박격포: 검은 포탄
  shell: proj(5, ['.kkk.', 'ksRsk', 'kssSk', 'kSSSk', '.kkk.'], { s: '#5a5a6a', S: '#3a3a48', R: '#9a9aae' }),
  // 투석기: 큰 바위
  boulder: proj(8, ['..kkkk..', '.krrrrk.', 'krRrrrrk', 'krrrrRrk', 'krrrrrrk', '.krrRrk.', '..kkkk..'], { r: '#8a7a66', R: '#6a5a48' }),
  // 화염 항아리: 불붙은 심지가 달린 항아리
  pot: proj(6, ['..yo..', '.kyyk.', 'kppppk', 'kpPppk', 'kppPpk', '.kppk.', '..kk..'], { p: '#b0663a', P: '#8a4a26', o: '#ff6b35' }),
  // 혼돈 구슬
  chaosOrb: proj(6, ['.kkkk.', 'kppwpk', 'kpPPpk', 'kPppPk', 'kpPPpk', '.kkkk.'], { p: '#c77dff', P: '#7a3fc0' }),
};
