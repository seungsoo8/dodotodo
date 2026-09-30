/**
 * 이야기: 별이 떨어진 밤.
 *
 * 길잡이별이 떨어져 부서진 뒤 잿빛 안개가 번지고, 안개에서 태어난 괴물이
 * 네 갈래 길을 따라 마지막 마을 등불골로 몰려온다. 교차로의 탑에는 저마다
 * 사연을 가진 수호자가 깃든다.
 *
 * 탑마다 서장(처음 고를 때)과 결말(그 탑으로 처음 이길 때)이 있고, 결말은
 * 잿빛 왕의 정체에 관한 진실 조각을 하나씩 밝힌다. 다섯 탑으로 모두 이기면
 * 마지막 이야기가 열린다.
 */
import type { GameMode } from './config.ts';
import { HEROES, type HeroId } from './heroes.ts';
import { heroUnlocked, type MetaState } from './meta.ts';

/** 글상자 한 줄에 들어가는 최대 글자 수 */
export const STORY_LINE_MAX = 34;

export interface StoryText {
  title: string;
  lines: string[];
}

export interface Chapter {
  /** 탑에 깃든 수호자 */
  keeper: string;
  prologue: StoryText;
  ending: StoryText & { piece: string };
  /** 판 도중 탑이 하는 말 */
  lines: {
    /** 1라운드 */
    start: string;
    /** 5라운드 (첫 정예) */
    mid: string;
    /** 10라운드 (두 번째 정예) */
    late: string;
    /** 체력이 30% 아래로 처음 떨어졌을 때 */
    lowHp: string;
  };
  /** 보스(잿빛 왕의 장수)가 나왔을 때, 보스 id → 대사 */
  boss: Record<string, string>;
}

export const WORLD_INTRO: StoryText = {
  title: '서막 · 별이 떨어진 밤',
  lines: [
    '오래전, 밤하늘에서 가장 밝던 길잡이별이 떨어졌다.',
    '별은 산산이 부서졌고, 그 자리에서 잿빛 안개가 피었다.',
    '안개에서 태어난 괴물들이 네 갈래 길로 몰려온다.',
    '사람들은 마지막 마을, 등불골로 모였다.',
    '교차로 한가운데 별조각을 품은 탑 하나.',
    '그 빛만이 안개를 밀어낸다.',
  ],
};

export const CHAPTERS: Record<HeroId, Chapter> = {
  guardian: {
    keeper: '바우',
    prologue: {
      title: '수호탑 · 문을 닫지 못한 문지기',
      lines: [
        '나는 바우. 은빛성의 문지기였다.',
        '별이 떨어지던 밤, 끝내 성문을 닫지 못했다.',
        '성은 하룻밤 만에 안개에 잠겼지.',
        '그 성의 돌을 하나하나 날라 이 탑을 쌓았다.',
        '이번엔 닫는다. 내 뒤로는 한 놈도 못 지나간다.',
      ],
    },
    lines: {
      start: '성문 닫아라! …아, 이제 문은 나 하나지.',
      mid: '놈들 눈이 이상하다. 마을이 아니라 탑만 본다.',
      late: '대체 이 탑에 뭐가 있길래 저렇게 달려드나.',
      lowHp: '무너져도 좋다. 문만 버티면 돼!',
    },
    boss: {
      boss: '땅 밑으로 오겠다고? 여긴 은빛성 주춧돌이다.',
      boss_rhino: '들이받아 봐라. 문은 그렇게 안 열린다.',
      boss_witch: '불로 녹는 돌이었으면 진작 무너졌지.',
    },
    ending: {
      title: '수호탑 결말 · 탑이 품은 것',
      piece: '괴물은 마을이 아니라 탑 속 별조각을 노린다',
      lines: [
        '장수는 쓰러지면서도 탑으로 손을 뻗었다.',
        '그 손끝에 반짝이는 별가루가 묻어 있었다.',
        '놈들이 노린 건 마을이 아니었다.',
        '탑 속에 박힌 별조각이었다.',
        '바우는 처음으로 문 너머가 궁금해졌다.',
      ],
    },
  },
  archer: {
    keeper: '솔',
    prologue: {
      title: '궁수탑 · 안개를 쫓는 사냥꾼',
      lines: [
        '나는 솔. 푸른숲에서 사냥하며 살았어.',
        '숲이 안개에 먹힌 날, 괴물 발자국을 따라갔지.',
        '발자국은 늘 같은 곳에서 시작됐어.',
        '별이 떨어진 구덩이, 사람들 말로 별무덤.',
        '거기 가려면 우선 여기서 살아남아야 해.',
      ],
    },
    lines: {
      start: '바람은 북쪽… 아니, 사방이네. 좋아.',
      mid: '맞은 놈들이 잿가루로 흩어져. 살아 있는 게 아니야.',
      late: '안개가 짙어지는 쪽으로 가면 별무덤이 나와.',
      lowHp: '숨 고르고… 아직 한 발 남았어.',
    },
    boss: {
      boss: '별무덤에서부터 땅굴을 파고 온 거구나.',
      boss_rhino: '그 뿔, 숲에서 봤어. 나무를 쓰러뜨리던 뿔.',
      boss_witch: '숲을 태운 게 너였어? 이번엔 네 차례야.',
    },
    ending: {
      title: '궁수탑 결말 · 별무덤의 울음',
      piece: '안개는 별무덤에서 울음처럼 흘러나온다',
      lines: [
        '장수가 흩어진 자리에서 잿빛 실이 풀려 나갔다.',
        '실은 곧장 별무덤 쪽으로 이어져 있었다.',
        '귀를 기울이자, 구덩이 깊은 곳에서',
        '무언가 울고 있는 소리가 들렸다.',
        '안개는 거기서 나온다. 누군가의 울음처럼.',
      ],
    },
  },
  mage: {
    keeper: '루미',
    prologue: {
      title: '마법탑 · 별을 끌어내린 제자',
      lines: [
        '나는 루미. 별지기탑에서 별을 읽던 견습생이야.',
        '스승님은 길잡이별을 더 가까이서 보고 싶어 하셨어.',
        '그래서 별을 부르는 주문을 만들었지. 나도 도왔고.',
        '그날 밤 별은… 정말로 내려왔어. 너무 가까이.',
        '내가 도운 일이니까, 내가 막아야 해.',
      ],
    },
    lines: {
      start: '주문 외울 준비 됐어. 이번엔 틀리지 않아.',
      mid: '괴물들 몸에서 별빛이 조금씩 새어 나와.',
      late: '이 주문 흔적… 스승님 글씨체랑 똑같아.',
      lowHp: '마나가 흔들려… 집중, 집중!',
    },
    boss: {
      boss: '땅 밑에서 별빛이 올라와. 조각을 삼켰구나.',
      boss_rhino: '그 뿔에 새긴 문양, 별 부르는 주문이야!',
      boss_witch: '그 불꽃… 별빛을 태워서 만든 거지?',
    },
    ending: {
      title: '마법탑 결말 · 끌어내린 별',
      piece: '별은 떨어진 게 아니라 사람이 끌어내렸다',
      lines: [
        '쓰러진 장수의 가슴에서 별조각이 굴러 나왔다.',
        '조각에는 스승님과 내가 새긴 주문이 남아 있었다.',
        '별은 떨어진 게 아니야. 우리가 끌어내린 거야.',
        '그렇다면 되돌리는 방법도 분명 있을 거야.',
      ],
    },
  },
  fortress: {
    keeper: '무쇠',
    prologue: {
      title: '요새 · 별을 쪼갠 망치',
      lines: [
        '무쇠라 한다. 왕의 공성 부대에서 투석기를 만들었다.',
        '별이 떨어진 뒤, 왕은 가장 큰 조각을 쪼개라 명했다.',
        '조각 하나하나가 무기가 되고 성벽이 된다면서.',
        '내 망치가 내리칠 때마다 안개는 더 짙어졌다.',
        '부순 건 나다. 그러니 이번엔 버틴다.',
      ],
    },
    lines: {
      start: '포대 정렬. 느려도 맞으면 끝이다.',
      mid: '놈들이 조각 찾는 소리… 망치 소리를 닮았군.',
      late: '왕궁 창고에 쌓아 둔 조각들은 지금 어디 있을까.',
      lowHp: '벽이 운다. 조금만 더 버텨라.',
    },
    boss: {
      boss: '땅굴이라… 우리가 조각 캐던 굴이군.',
      boss_rhino: '그 강철, 왕궁 대장간 쇠다. 알아보겠어.',
      boss_witch: '불꽃이 파랗군. 쪼갠 조각을 태우는 불이다.',
    },
    ending: {
      title: '요새 결말 · 쪼갤수록',
      piece: '별을 쪼갤수록 안개가 짙어졌다',
      lines: [
        '장수의 갑옷 속은 텅 비어 있었다.',
        '안개와, 쪼개진 별조각 몇 개뿐.',
        '조각이 늘어날수록 안개도 늘어났던 거다.',
        '별은 부서질 때마다 아팠던 거야.',
        '무쇠는 망치를 내려놓았다. 다시는 들지 않기로.',
      ],
    },
  },
  gambler: {
    keeper: '딸랑',
    prologue: {
      title: '도박탑 · 안개와 한 내기',
      lines: [
        '딸랑이라고 불러. 주사위 소리가 좋아서.',
        '안개가 처음 퍼지던 밤, 어떤 목소리와 내기를 했어.',
        '"열닷새를 버티면 네가 이긴다." 그렇게 말했지.',
        '판돈은 이 마을이야. 내가 걸었어. …미안.',
        '그러니까 꼭 이길 거야. 다 걸어!',
      ],
    },
    lines: {
      start: '주사위는 던졌다. 굴러가는 걸 보자고.',
      mid: '그 목소리가 또 들려. "돌아가고 싶다"고.',
      late: '내기 상대가 누군지 알 것 같아. 저 하늘 빈자리.',
      lowHp: '아직 판 안 끝났어. 마지막 한 판!',
    },
    boss: {
      boss: '장수님 납셨네. 판을 키우시겠다?',
      boss_rhino: '뿔에 걸래, 내 주사위에 걸래?',
      boss_witch: '불장난은 판돈이 너무 크잖아.',
    },
    ending: {
      title: '도박탑 결말 · 잿빛 왕의 소원',
      piece: '잿빛 왕은 떨어진 길잡이별 자신이다',
      lines: [
        '마지막 장수가 쓰러지자 그 목소리가 다시 들렸다.',
        '"네가 이겼다. …나는 그저 집에 가고 싶었다."',
        '잿빛 왕은 떨어진 길잡이별, 그 부서진 마음.',
        '흩어진 조각을 모아 하늘로 돌아가려던 거야.',
      ],
    },
  },
};

export const TRUE_ENDING: StoryText = {
  title: '마지막 이야기 · 다섯 등불',
  lines: [
    '바우, 솔, 루미, 무쇠, 딸랑. 다섯 수호자가 모였다.',
    '괴물은 조각을, 안개는 울음을, 왕은 집을 원했다.',
    '그래서 싸워 뺏는 대신 돌려주기로 했다.',
    '다섯 탑의 별조각이 하나씩 하늘로 떠올랐다.',
    '그날 밤, 길잡이별이 다시 떴다. 안개가 걷혔다.',
    '탑들은 지금도 교차로에 서 있다. 길을 밝히는 등불로.',
  ],
};

export type StoryPageKind = 'world' | 'prologue' | 'ending' | 'true';

export interface StoryPage extends StoryText {
  id: string;
  kind: StoryPageKind;
  hero: HeroId | null;
  unlocked: boolean;
  seen: boolean;
}

export function trueEndingUnlocked(meta: MetaState): boolean {
  return HEROES.every((h) => meta.heroWins.includes(h.id));
}

/** 이야기 책의 모든 쪽 (서막 → 탑마다 서장·결말 → 마지막 이야기) */
export function storyPages(meta: MetaState): StoryPage[] {
  const seen = new Set(meta.storySeen);
  const page = (id: string, kind: StoryPageKind, hero: HeroId | null, text: StoryText, unlocked: boolean): StoryPage => ({
    id,
    kind,
    hero,
    title: text.title,
    lines: text.lines,
    unlocked,
    seen: seen.has(id),
  });
  return [
    page('world', 'world', null, WORLD_INTRO, true),
    ...HEROES.flatMap((h) => [
      page(`prologue:${h.id}`, 'prologue', h.id, CHAPTERS[h.id].prologue, heroUnlocked(meta, h.id)),
      page(`ending:${h.id}`, 'ending', h.id, CHAPTERS[h.id].ending, meta.heroWins.includes(h.id)),
    ]),
    page('true', 'true', null, TRUE_ENDING, trueEndingUnlocked(meta)),
  ];
}

/** 열렸지만 아직 안 본 쪽 수 */
export function unreadCount(meta: MetaState): number {
  return storyPages(meta).filter((p) => p.unlocked && !p.seen).length;
}

export function markSeen(meta: MetaState, id: string): MetaState {
  return meta.storySeen.includes(id) ? meta : { ...meta, storySeen: [...meta.storySeen, id] };
}

function pick(meta: MetaState, ids: string[]): StoryPage[] {
  const pages = storyPages(meta);
  return ids.map((id) => pages.find((p) => p.id === id)!);
}

/** 판을 시작할 때 띄울 쪽: 클래식에서 아직 안 본 서막·서장 */
export function prologueCards(meta: MetaState, hero: HeroId, mode: GameMode): StoryPage[] {
  if (mode !== 'classic') return [];
  const ids = ['world', `prologue:${hero}`].filter((id) => !meta.storySeen.includes(id));
  return pick(meta, ids);
}

/** 이긴 뒤 띄울 쪽: 이번에 새로 열린 결말(과 마지막 이야기) */
export function endingCards(before: MetaState, after: MetaState, hero: HeroId): StoryPage[] {
  if (before.heroWins.includes(hero) || !after.heroWins.includes(hero)) return [];
  const ids = [`ending:${hero}`];
  if (!trueEndingUnlocked(before) && trueEndingUnlocked(after)) ids.push('true');
  return pick(after, ids);
}
