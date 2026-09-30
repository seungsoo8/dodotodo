/**
 * 이야기 카드·이야기 책에 나오는 수호자 초상화 (16×16 도트).
 * 얼굴은 좌우 대칭이라 왼쪽 반(8칸)만 그리고 뒤집어 붙인다.
 */
import type { HeroId } from '../core/heroes.ts';
import { HEROES } from '../core/heroes.ts';
import { parseSprite, type Sprite } from './sprites.ts';

export const PORTRAIT_SIZE = 16;

/** 왼쪽 반 → 좌우 대칭 한 줄 */
export function mirrorRows(halves: string[]): string[] {
  const w = halves[0]?.length ?? 0;
  return halves.map((h, i) => {
    if (h.length !== w) throw new Error(`${i + 1}번 줄 길이가 ${h.length} (다른 줄은 ${w})`);
    return h + [...h].reverse().join('');
  });
}

/** 모두 같이 쓰는 색 (a·A·c·C·h 는 수호자마다) */
const BASE: Record<string, string> = {
  k: '#1b1522',
  s: '#f1c9a5',
  S: '#d9a383',
  e: '#1b1522',
  r: '#b5484f',
  w: '#ffffff',
  g: '#c8ccd6',
  m: '#8f97a8',
  M: '#5f6678',
  t: '#c98a5a',
  T: '#a86c42',
  H: '#3a2a22',
  y: '#ffd166',
  Y: '#fff3c4',
};

const heroColor = (id: HeroId) => HEROES.find((h) => h.id === id)!.color;

function portrait(halves: string[], colors: Record<string, string>): Sprite {
  return parseSprite(mirrorRows(halves), { ...BASE, ...colors });
}

export const PORTRAITS: Record<HeroId | 'star', Sprite> = {
  // 바우: 투구 쓴 늙은 문지기, 흰 수염
  guardian: portrait(
    [
      '........',
      '....kkkk',
      '...kmmmm',
      '..kmmwmm',
      '..kmmmmm',
      '.kMMMMMM',
      '..ksggss',
      '..kssess',
      '..ksssss',
      '..kwsssS',
      '..kwwwww',
      '...kwwww',
      '..kakwww',
      '.kaaakww',
      '.kaaaakw',
      'kaaaaaka',
    ],
    { a: heroColor('guardian') },
  ),
  // 솔: 초록 두건의 사냥꾼
  archer: portrait(
    [
      '........',
      '.....kkk',
      '....kaaa',
      '...kaaaa',
      '..kaaaaa',
      '..kaahhh',
      '..kahsss',
      '..kasess',
      '..kassss',
      '..kasssS',
      '..kaassr',
      '...kasss',
      '..kCaaaa',
      '.kCCaaaa',
      '.kCCCaaa',
      'kCCCCaab',
    ],
    { a: heroColor('archer'), C: '#3f7a4c', h: '#7a5230', b: '#7a5230' },
  ),
  // 루미: 별 박힌 뾰족 모자의 견습 마법사
  mage: portrait(
    [
      '.......k',
      '......ka',
      '.....kaa',
      '....kaay',
      '...kaaaa',
      '.kkkkkkk',
      '..khhhhh',
      '..khssss',
      '..khsess',
      '..khssss',
      '..khsssr',
      '...khsss',
      '..kccccc',
      '.kcccccY',
      '.kccaccc',
      'kccccccc',
    ],
    { a: heroColor('mage'), c: '#3b5ea8', h: '#c77dff' },
  ),
  // 무쇠: 두건 두른 공성 기술자, 콧수염과 갑옷
  fortress: portrait(
    [
      '........',
      '........',
      '....kkkk',
      '...kaaaa',
      '..kaaaaa',
      '..kAAAAA',
      '..kttttt',
      '..ktHHtt',
      '..kttett',
      '..kttttT',
      '..ktHHHH',
      '...ktttt',
      '.kmmmmmm',
      'kmmmmmmm',
      'kmmwmmmm',
      'kmmmmMMM',
    ],
    { a: heroColor('fortress'), A: '#c46a24' },
  ),
  // 딸랑: 높은 모자에 활짝 웃는 도박사
  gambler: portrait(
    [
      '........',
      '...kkkkk',
      '...kaaaa',
      '...kaaaa',
      '...kAAAA',
      '.kkkkkkk',
      '..khhsss',
      '..khsess',
      '..khssss',
      '..khsssS',
      '..kssrww',
      '...kssss',
      '..kccccc',
      '.kcccckw',
      '.kcccckw',
      'kcccccky',
    ],
    { a: heroColor('gambler'), A: '#ffd166', c: '#5a3a7a', h: '#2b2233' },
  ),
  // 길잡이별 (서막·마지막 이야기)
  star: portrait(
    [
      '........',
      '.......y',
      '......yy',
      '......yY',
      '.....yYY',
      'yyyyyyYY',
      '.yyYYYYY',
      '..yYYYYY',
      '...yYYYw',
      '...yYYYY',
      '..yYYYyy',
      '..yYYy..',
      '.yYy....',
      '.yy.....',
      '........',
      '........',
    ],
    {},
  ),
};

/** 이야기 쪽에 맞는 초상화: 탑 쪽이면 그 수호자, 아니면 별 */
export function portraitFor(hero: HeroId | null): Sprite {
  return hero ? PORTRAITS[hero] : PORTRAITS.star;
}
