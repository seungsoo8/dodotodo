/** 코링코 탐험대 이야기: NPC · 서막 · 장면 */

export interface NpcInfo {
  name: string;
  title: string;
  /** 그냥 말을 걸었을 때 하는 말 (돌아가며) */
  lines: string[];
  /** 말을 걸면 열리는 창 */
  menu?: 'shop' | 'forge' | 'rift' | 'tailor';
  color: string;
  /** 사람이 아닌 물건 (게시판): 그림 없이 말을 건다 */
  prop?: boolean;
}

export const NPCS: Record<string, NpcInfo> = {
  board: {
    name: '부탁 게시판',
    title: '친구들의 쪽지',
    color: '#ffe08a',
    lines: ['구한 친구들이 붙여 둔 부탁 쪽지가 펄럭인다.', '아직 새 쪽지가 없다. 친구를 더 구해 보자.'],
    prop: true,
  },
  chief: {
    name: '태엽 할머니',
    title: '블록 마을 촌장',
    color: '#d9b8ff',
    lines: ['째깍, 째깍… 마을 시계는 오늘도 잘 가는구나.', '무리하지 말고, 지치면 언제든 돌아오렴.', '태엽은 천천히 감아야 오래 간단다.'],
  },
  shop: {
    name: '곰돌 아저씨',
    title: '가게',
    color: '#c88a54',
    menu: 'shop',
    lines: ['어서 와! 사탕은 언제나 넉넉하게.', '마을에 친구가 늘면 들여오는 부품도 많아진다네.'],
  },
  forge: {
    name: '망치 너구리',
    title: '대장간',
    color: '#9fb4c8',
    menu: 'forge',
    lines: ['땅! 땅! 무기는 손질할수록 빛나지.', '동료마다 무기가 다르니 골고루 손질해 주게.'],
  },
  tailor: {
    name: '재봉 토끼',
    title: '재봉사',
    color: '#ffb3c8',
    lines: ['바늘과 실만 있으면 뭐든 꿰맬 수 있어.', '재료를 가져오면 부품을 만들어 주고, 꿰매서 더 좋게 해 줄게!'],
    menu: 'tailor',
  },
  riftkeeper: {
    name: '별지기 부엉이',
    title: '다락방 문지기',
    color: '#7cc4ff',
    menu: 'rift',
    lines: ['부엉… 다락방 상자 속엔 오래된 기억이 잠들어 있다네.', '깊은 상자일수록 먼지가 짙어지지.'],
  },
  mole: {
    name: '정비공 두더지',
    title: '책상 시계 공장',
    color: '#c8a070',
    lines: ['기름칠은 매일매일! 그래야 태엽이 잘 돌지.', '공장 안쪽은 위험하다네. 레이저 선이 보이면 바로 비켜서게.'],
  },
  baker: {
    name: '파티시에 다람쥐',
    title: '과자 서랍 빵집',
    color: '#ffcf7a',
    lines: ['갓 구운 쿠키 냄새 좋지?', '언덕의 과자들이 다시 얌전해지면 좋겠어.'],
  },
};

/** 처음 시작할 때 보는 이야기 */
export const PROLOGUE: string[] = [
  '딸깍. 아이 방 불이 꺼졌다.',
  '끼릭, 끼릭… 누군가 토비의 등에 달린 태엽을 감는다.',
  '"일어나렴, 토비야. 다락방 먼지 때문에 친구들이 이상해졌어."',
  '"아, 그리고 하나만 기억하렴. 발소리가 들리면… 얼음!"',
]

/** 이야기 장면 */
export const CUTSCENES: Record<'join_bori' | 'join_ruru' | 'join_nabi' | 'bear' | 'jelly' | 'tin' | 'dusty' | 'ending', { who: string; text: string }[]> = {
  join_bori: [
    { who: '보리', text: '푸하! 먼지 맛 진짜 최악이야.' },
    { who: '보리', text: '힘든 녀석 나오면 나 불러. E 한 번이면 바로 갈게!' },
  ],
  join_ruru: [
    { who: '루루', text: '휴, 서랍 냄새가 너무 달아서 정신을 잃을 뻔했네.' },
    { who: '루루', text: '멀리 있는 녀석은 내 활에 맡겨. 탐험대, 좋은 이름이다!' },
  ],
  join_nabi: [
    { who: '나비', text: '…시계 소리에 잠이 들었었어. 냐.' },
    { who: '나비', text: '내 별 지팡이로 먼지를 날려 줄게. 다 같이 다락방까지 가자.' },
  ],
  bear: [
    { who: '태엽 곰 대장', text: '끼이익… 태엽이 다 풀렸었구먼. 미안하다, 꼬마들.' },
    { who: '태엽 곰 대장', text: '이 몸이 상자 문을 지키마. 위쪽 과자 서랍으로 가 보거라.' },
  ],
  jelly: [
    { who: '젤리 여왕', text: '하암… 달콤한 꿈인 줄 알았는데 먼지 맛이었구나.' },
    { who: '젤리 여왕', text: '책상 위 시계 공장에서 고양이 아이를 봤어. 서둘러!' },
  ],
  tin: [
    { who: '깡통 대장', text: '삐— 삐빗. 명령… 해제. 고맙다.' },
    { who: '깡통 대장', text: '더스티가 침대 밑에서 먼지를 모으고 있다. 먼지 왕이 힘을 키우고 있다.' },
  ],
  dusty: [
    { who: '먼지 사도 더스티', text: '이, 이럴 수가… 먼지 왕님께 혼나겠어!' },
    { who: '먼지 사도 더스티', text: '왕님은 다락방 꼭대기에 계셔. 갈 수 있다면 가 보시지!' },
  ],
  ending: [
    { who: '먼지 왕', text: '…나는 그저, 잊힌 장난감들이 쌓인 먼지였을 뿐이다.' },
    { who: '먼지 왕', text: '아무도 놀아 주지 않는 다락방은… 너무 조용했어.' },
    { who: '태엽 할머니', text: '그렇다면 이제 블록 마을에서 함께 살자꾸나. 태엽은 넉넉하단다.' },
    { who: '탐험대', text: '아침 햇살이 아이 방에 들어온다. 장난감들은 모두 제자리에서, 조용히 웃었다.' },
  ],
};
