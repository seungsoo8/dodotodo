/** 퀘스트: 받기 · 진행 · 보고 · 보상 */
import { gainExp } from './character.ts';
import type { Rng } from './rng.ts';
import type { MapId } from './maps.ts';
import type { MatId, QuestProgress, Save } from './types.ts';

export type QuestKind = 'kill' | 'collect' | 'boss' | 'rift' | 'forge' | 'elite' | 'rescue' | 'friends' | 'freeze' | 'fetch' | 'tagKill' | 'overwindKill';

export interface QuestDef {
  id: string;
  name: string;
  main: boolean;
  giver: string;
  kind: QuestKind;
  /** 몬스터 id · 재료 id · 보스 id · 균열 깊이 */
  target: string;
  count: number;
  /** 받을 수 있는 조건 */
  req: { lv?: number; quest?: string; rescued?: string };
  /** 심부름: 이 방 이 칸에 떨어진 물건 */
  fetch?: { map: MapId; x: number; y: number; item: string };
  /** 진행 상황에 붙는 설명 (퀘스트 창 · 목표) */
  goal: string;
  reward: { exp: number; gold: number; potions?: { hp?: number }; part?: string; mats?: Partial<Record<MatId, number>> };
  /** 끝내면 켜지는 깃발 */
  flags?: string[];
  /** 대사: 줄 때 · 하는 중 · 다 했을 때 */
  talk: { offer: string[]; progress: string; done: string[] };
}

export const QUESTS: QuestDef[] = [
  // ───── 주 이야기
  {
    id: 'q_fluff',
    name: '솜뭉치 소동',
    main: true,
    giver: 'chief',
    kind: 'kill',
    target: 'fluff',
    count: 6,
    req: {},
    goal: '장난감 상자의 솜뭉치를 깨끗하게 해 주기',
    reward: { exp: 60, gold: 60, potions: { hp: 3 } },
    talk: {
      offer: ['깨어났구나, 토비야. 네 태엽을 감는 데 한참 걸렸단다.', '다락방에서 내려온 먼지 때문에 장난감들이 사나워졌어.', '오른쪽 장난감 상자의 솜뭉치 여섯을 톡톡 두드려 깨끗하게 해 주렴. 깨끗해진 장난감은 우리 친구가 될 거야.'],
      progress: '장난감 상자는 마을 오른쪽 길 끝이란다.',
      done: ['잘했어! 솜뭉치들이 정신을 차렸구나.', '깨끗하게 만든 장난감이 여럿 모이면 마을로 놀러 온단다. 친구가 늘수록 마을도 커지지.'],
    },
  },
  {
    id: 'q_bori',
    name: '먼지 고치 속의 보리',
    main: true,
    giver: 'chief',
    kind: 'rescue',
    target: 'bori',
    count: 1,
    req: { quest: 'q_fluff' },
    goal: '장난감 상자 아래쪽의 먼지 고치에서 보리 구하기',
    reward: { exp: 120, gold: 100, potions: { hp: 2 } },
    talk: {
      offer: ['곰 인형 보리가 먼지 고치에 갇혔다는구나.', '고치에 말을 걸면 먼지 무리가 몰려올 거야. 다 물리치면 보리가 깨어날 거란다.'],
      progress: '고치는 장난감 상자 아래쪽 빈터에 있어.',
      done: ['보리가 왔구나! 이제 둘이서 번갈아 싸울 수 있겠어.', 'E 나 1·2 키로 바꿔 들면, 들어서는 동료가 교대 기술을 쓴단다.'],
    },
  },
  {
    id: 'q_bear',
    name: '장난감 상자의 주인',
    main: true,
    giver: 'chief',
    kind: 'boss',
    target: 'b_bear',
    count: 1,
    req: { quest: 'q_bori' },
    goal: '장난감 상자 끝의 태엽 곰 대장을 깨끗하게 하기',
    reward: { exp: 300, gold: 300, mats: { dust: 3 } },
    flags: ['drawer_open'],
    talk: {
      offer: ['장난감 상자 끝에서 태엽 곰 대장이 먼지에 홀렸대.', '돌진해 올 때 바닥에 길이 보이면 옆으로 비키렴.'],
      progress: '곰 대장은 장난감 상자 오른쪽 아래 끝에 있어.',
      done: ['곰 대장도 이제 우리 친구야.', '곰 대장 말로는 위쪽 과자 서랍에서 여우 루루를 봤대. 서랍 문을 열어 두었단다.'],
    },
  },
  {
    id: 'q_ruru',
    name: '서랍 속의 루루',
    main: true,
    giver: 'baker',
    kind: 'rescue',
    target: 'ruru',
    count: 1,
    req: { quest: 'q_bear' },
    goal: '과자 서랍 왼쪽 위 먼지 고치에서 루루 구하기',
    reward: { exp: 400, gold: 300, potions: { hp: 3 } },
    talk: {
      offer: ['어머, 탐험대구나! 여우 루루가 서랍 구석 먼지 고치에 갇혔어.', '왼쪽 위 쿠키 길 끝이야. 서둘러 줘!'],
      progress: '고치는 서랍 왼쪽 위 끝에 있어.',
      done: ['루루를 구했구나! 활 솜씨가 대단하대.'],
    },
  },
  {
    id: 'q_jelly',
    name: '젤리 여왕의 잠꼬대',
    main: true,
    giver: 'baker',
    kind: 'boss',
    target: 'b_jelly',
    count: 1,
    req: { quest: 'q_ruru' },
    goal: '과자 서랍 꼭대기의 젤리 여왕 깨우기',
    reward: { exp: 900, gold: 600, mats: { dust: 4, sugar: 3 } },
    flags: ['desk_open'],
    talk: {
      offer: ['서랍 꼭대기의 젤리 여왕이 먼지를 먹고 잠꼬대를 해.', '여왕이 몸을 나누면 작은 젤리들이 우르르 몰려와. 조심해!'],
      progress: '여왕은 서랍 맨 위에 있어.',
      done: ['여왕이 깨어났어! 고마워.', '여왕 말로는 책상 위 시계 공장에서 고양이 나비를 봤대. 마을 왼쪽 길이 책상으로 이어져.'],
    },
  },
  {
    id: 'q_nabi',
    name: '시계 속의 나비',
    main: true,
    giver: 'mole',
    kind: 'rescue',
    target: 'nabi',
    count: 1,
    req: { quest: 'q_jelly' },
    goal: '책상 시계 공장의 먼지 고치에서 나비 구하기',
    reward: { exp: 1000, gold: 600, potions: { hp: 3 } },
    talk: {
      offer: ['어이쿠, 탐험대구먼! 마법사 고양이 나비가 공장 한가운데 고치에 갇혔다네.', '공장 기계 사이로 가 보게.'],
      progress: '고치는 공장 왼쪽 위 작업장 가운데에 있어.',
      done: ['나비까지 모였군! 이제 탐험대가 다 모였어.'],
    },
  },
  {
    id: 'q_tin',
    name: '멈추지 않는 공장',
    main: true,
    giver: 'mole',
    kind: 'boss',
    target: 'b_tin',
    count: 1,
    req: { quest: 'q_nabi' },
    goal: '공장 안쪽의 깡통 대장을 멈추기',
    reward: { exp: 1500, gold: 900, mats: { dust: 5, star: 2 } },
    flags: ['bed_open'],
    talk: {
      offer: ['깡통 대장이 공장 안쪽에서 레이저를 마구 쏘고 있다네.', '바닥의 레이저 선을 잘 보고 피하게.'],
      progress: '깡통 대장은 공장 맨 위 큰 방에 있어.',
      done: ['기계가 조용해졌어! 정말 고맙네.', '깡통 대장 말로는 먼지 사도 더스티가 침대 밑에 숨었다는구먼. 마을 아래쪽 길이야.'],
    },
  },
  {
    id: 'q_dusty',
    name: '침대 밑의 더스티',
    main: true,
    giver: 'chief',
    kind: 'boss',
    target: 'b_dusty',
    count: 1,
    req: { quest: 'q_tin' },
    goal: '침대 밑 깊은 곳의 먼지 사도 더스티 붙잡기',
    reward: { exp: 2500, gold: 1500, mats: { star: 3 } },
    flags: ['attic_open'],
    talk: {
      offer: ['침대 밑은 어둡고 먼지투성이란다. 더스티가 거기 숨어 있어.', '어둠 속에서는 반짝이는 구슬 빛을 따라가렴.'],
      progress: '침대 밑은 마을 아래쪽 길이야.',
      done: ['더스티를 붙잡았구나!', '먼지 왕은 다락방에 있대. 마을 오른쪽 위 사다리로 올라가렴.'],
    },
  },
  {
    id: 'q_king',
    name: '다락방의 먼지 왕',
    main: true,
    giver: 'chief',
    kind: 'boss',
    target: 'b_king',
    count: 1,
    req: { quest: 'q_dusty' },
    goal: '다락방 꼭대기의 먼지 왕 깨끗하게 하기',
    reward: { exp: 4000, gold: 3000, mats: { star: 5 } },
    flags: ['ending', 'rift_open'],
    talk: {
      offer: ['먼지 왕을 깨끗하게 하면 코링코에 다시 아침이 올 거야.', '탐험대가 함께라면 할 수 있단다.'],
      progress: '다락방은 사다리 위야. 조심하렴.',
      done: ['해냈구나, 탐험대! 태엽 심장이 다시 째깍째깍 뛰고 있어.', '다락방 상자들 속엔 아직 먼지가 남아 있대. 별지기 부엉이가 도전을 기다린단다.'],
    },
  },
  // ───── 곁 이야기
  {
    id: 'q_cloth',
    name: '솜 조각 모으기',
    main: false,
    giver: 'tailor',
    kind: 'collect',
    target: 'fluff',
    count: 5,
    req: { lv: 2 },
    goal: '솜뭉치·헝겊 늑대가 떨어뜨리는 솜 조각 모으기',
    reward: { exp: 90, gold: 40, part: 'stuffing' },
    talk: {
      offer: ['어머, 솜이 많이 빠졌네!', '솜 조각 다섯 개만 구해 오면 "솜 듬뿍" 부품을 만들어 줄게. 부품은 탐험대가 함께 쓴단다.'],
      progress: '솜뭉치와 헝겊 늑대가 솜 조각을 잘 떨어뜨려.',
      done: ['폭신폭신! 부품 칸에 끼워 보렴 (메뉴 → 부품).'],
    },
  },
  {
    id: 'q_forge',
    name: '무기 손질',
    main: false,
    giver: 'forge',
    kind: 'forge',
    target: 'any',
    count: 1,
    req: { lv: 2 },
    goal: '망치 너구리에게 무기를 한 번 손질 받기',
    reward: { exp: 70, gold: 0, mats: { gear: 3, dust: 2 } },
    talk: {
      offer: ['땅! 땅! 무기는 손질할수록 세진다네.', '단추와 톱니를 가져오면 한 단계씩 손질해 주지. 동료마다 따로란다.'],
      progress: '나한테 말을 걸어 손질을 맡겨 보게.',
      done: ['훨씬 낫지? 재료를 좀 줄 테니 또 오게.'],
    },
  },
  {
    id: 'q_friends',
    name: '친구 셋',
    main: false,
    giver: 'chief',
    kind: 'friends',
    target: 'any',
    count: 3,
    req: { quest: 'q_fluff' },
    goal: '장난감 친구 셋을 마을로 데려오기',
    reward: { exp: 200, gold: 150, part: 'clover' },
    talk: {
      offer: ['같은 장난감을 여러 번 깨끗하게 하면 마을로 놀러 온단다.', '친구 셋을 데려오면 마을이 한 단계 커져. 부품 칸도 늘지.'],
      progress: '메뉴의 도감에서 누가 얼마나 남았는지 볼 수 있어.',
      done: ['마을이 북적북적하구나! 행운의 클로버를 받으렴.'],
    },
  },
  {
    id: 'q_freeze',
    name: '얼음 땡 놀이',
    main: false,
    giver: 'tailor',
    kind: 'freeze',
    target: 'any',
    count: 3,
    req: { quest: 'q_fluff' },
    goal: '아이가 들어올 때 꼼짝 않고 세 번 참기',
    reward: { exp: 300, gold: 200, part: 'bandage' },
    talk: {
      offer: ['쉿! 가끔 아이가 방에 들어온단다. "발소리!" 가 들리면 얼음이 돼야 해.', '움직이면 들켜! 세 번 끝까지 참아 보렴. 태엽을 감는 건 괜찮아.'],
      progress: '방에서 발소리가 들리면 멈춰서 기다리렴.',
      done: ['완벽한 얼음이었어! 반창고 부품을 줄게.'],
    },
  },
  {
    id: 'q_sugar',
    name: '설탕 결정 모으기',
    main: false,
    giver: 'baker',
    kind: 'collect',
    target: 'sugar',
    count: 6,
    req: { quest: 'q_ruru' },
    goal: '젤리 · 쿠키 병정이 떨어뜨리는 설탕 결정 모으기',
    reward: { exp: 500, gold: 300, part: 'buttoneye' },
    talk: {
      offer: ['과자를 구우려면 설탕 결정이 여섯 개 필요해.', '모아 오면 반짝이는 단추 눈을 줄게.'],
      progress: '젤리나 쿠키 병정이 잘 떨어뜨려.',
      done: ['고마워! 단추 눈이야. 치명타가 잘 터질 거야.'],
    },
  },
  {
    id: 'q_parts',
    name: '톱니 모으기',
    main: false,
    giver: 'mole',
    kind: 'collect',
    target: 'gear',
    count: 8,
    req: { quest: 'q_nabi' },
    goal: '공장 몬스터가 떨어뜨리는 톱니 모으기',
    reward: { exp: 900, gold: 500, part: 'spring' },
    talk: {
      offer: ['기계를 고치려면 톱니가 잔뜩 필요해.', '여덟 개만 모아 오면 강철 스프링을 주지.'],
      progress: '깡통 병정이나 연필 병정이 톱니를 잘 떨어뜨린다네.',
      done: ['딱 맞는 톱니들이군! 강철 스프링일세.'],
    },
  },
  {
    id: 'q_elite',
    name: '정예 사냥꾼',
    main: false,
    giver: 'riftkeeper',
    kind: 'elite',
    target: 'any',
    count: 5,
    req: { quest: 'q_bear' },
    goal: '아무 곳에서나 정예 몬스터 쓰러뜨리기',
    reward: { exp: 1200, gold: 600, part: 'marble' },
    talk: {
      offer: ['부엉… 몸에 빛이 도는 정예 몬스터를 본 적 있나?', '다섯 마리를 쓰러뜨리면 좋은 걸 주겠네. 성질을 잘 보고 싸우게.'],
      progress: '정예는 이름 앞에 성질이 붙어 있다네.',
      done: ['훌륭하군. 반짝 구슬일세.'],
    },
  },
  {
    id: 'q_rift10',
    name: '다락방 상자 10층',
    main: false,
    giver: 'riftkeeper',
    kind: 'rift',
    target: '10',
    count: 1,
    req: { quest: 'q_king' },
    goal: '다락방 상자 10층 깨기',
    reward: { exp: 3000, gold: 2000, part: 'p_orbit' },
    talk: {
      offer: ['다락방 상자 속엔 아직 먼지가 남았다네. 10층까지 가 보겠나?', '상자를 깰 때마다 축복 카드를 하나씩 고를 수 있지.'],
      progress: '6층부터 시작할 수 있다네. 5층을 깼다면 말이지.',
      done: ['10층이라니! 별 위성을 주지.'],
    },
  },
  // ───── 규칙 도전
  {
    id: 'q_tagkill',
    name: '교대 기술 연습',
    main: false,
    giver: 'chief',
    kind: 'tagKill',
    target: 'any',
    count: 5,
    req: { quest: 'q_bori' },
    goal: '동료를 바꿔 들 때 터지는 교대 기술로 장난감 다섯 깨끗하게 하기',
    reward: { exp: 220, gold: 150, mats: { gear: 2 } },
    talk: {
      offer: ['둘이 되었구나! 동료를 바꿔 드는 순간, 들어서는 동료가 멋진 기술을 쓴단다.', '바꿔 드는 그 기술로 장난감 다섯을 깨끗하게 해 보렴. E 나 숫자 키로 바꿔 들 수 있어.'],
      progress: '적이 모였을 때 바꿔 들면 한꺼번에 깨끗해진단다.',
      done: ['손발이 척척 맞는구나! 이게 바로 탐험대지.'],
    },
  },
  {
    id: 'q_overwind',
    name: '태엽 가득 도전',
    main: false,
    giver: 'mole',
    kind: 'overwindKill',
    target: 'any',
    count: 10,
    req: { quest: 'q_nabi' },
    goal: '태엽을 가득 감은 동안(태엽 가득) 장난감 열 깨끗하게 하기',
    reward: { exp: 900, gold: 500, part: 'p_swift' },
    talk: {
      offer: ['태엽이 가득 차면 몸이 번쩍번쩍하지? 그때 힘이 제일 세단다.', '멈춰 서서 W 로 끝까지 감은 다음, 그 기세로 열을 깨끗하게 해 보게.'],
      progress: '태엽 가득은 잠깐뿐이야. 감자마자 달려들게!',
      done: ['훌륭해! 내가 아끼던 질풍 태엽을 주지.'],
    },
  },
  // ───── 심부름
  {
    id: 'q_pin',
    name: '잃어버린 밀대',
    main: false,
    giver: 'baker',
    kind: 'fetch',
    target: 'pin',
    count: 1,
    req: { quest: 'q_ruru' },
    fetch: { map: 'drawer', x: 46, y: 10, item: '나무 밀대' },
    goal: '과자 서랍 오른쪽 위에 굴러간 나무 밀대 찾아오기',
    reward: { exp: 450, gold: 250, part: 'thread' },
    talk: {
      offer: ['아이고, 반죽을 밀다가 밀대가 서랍 오른쪽 위로 데굴데굴 굴러갔어.', '사탕 벌이 윙윙대서 무서워 못 가겠구나. 찾아다 주련?'],
      progress: '오른쪽 위, 사탕 벌들이 모인 곳 근처야.',
      done: ['이거야 이거! 고마워라. 실 꾸러미에서 빨간 실을 좀 떼 줄게.'],
    },
  },
  // ───── 친구 부탁 (블록 마을 게시판)
  {
    id: 'q_cheese',
    name: '태엽 쥐의 치즈',
    main: false,
    giver: 'board',
    kind: 'fetch',
    target: 'cheese',
    count: 1,
    req: { rescued: 'mouse' },
    fetch: { map: 'toybox', x: 22, y: 8, item: '장난감 치즈' },
    goal: '장난감 상자 위쪽에 두고 온 장난감 치즈 찾아 주기',
    reward: { exp: 120, gold: 120, potions: { hp: 3 } },
    talk: {
      offer: ['[쪽지] 찍찍! 깨끗해지기 전에 장난감 상자 위쪽에 치즈를 숨겨 뒀어요.', '[쪽지] 찾아 주면 사탕을 나눠 줄게요. — 태엽 쥐'],
      progress: '[쪽지] 장난감 상자 위쪽 가운데쯤이에요!',
      done: ['[쪽지] 찍! 내 치즈! 고마워요, 탐험대!'],
    },
  },
  {
    id: 'q_brother',
    name: '꼬마 깡통을 찾아서',
    main: false,
    giver: 'board',
    kind: 'fetch',
    target: 'brother',
    count: 1,
    req: { rescued: 'tin' },
    fetch: { map: 'desk', x: 12, y: 14, item: '꼬마 깡통' },
    goal: '책상 시계 공장 왼쪽 위에서 헤매는 꼬마 깡통 데려오기',
    reward: { exp: 700, gold: 400, mats: { gear: 4 } },
    talk: {
      offer: ['[쪽지] 깡! 내 동생 꼬마 깡통이 공장 왼쪽 위에서 길을 잃었어.', '[쪽지] 아직 너무 작아서 혼자 못 와. 데려와 줘. — 깡통 병정'],
      progress: '[쪽지] 공장 왼쪽 위, 나사 거미들 사이에 있을 거야.',
      done: ['[쪽지] 깡깡! 형아! … 고마워, 이거 톱니야. 우리 집에 남는 거.'],
    },
  },
  {
    id: 'q_pair',
    name: '짝 잃은 양말',
    main: false,
    giver: 'board',
    kind: 'fetch',
    target: 'pair',
    count: 1,
    req: { rescued: 'sock' },
    fetch: { map: 'underbed', x: 38, y: 14, item: '짝 양말' },
    goal: '침대 밑 오른쪽 깊은 곳에서 양말 한 짝 찾아오기',
    reward: { exp: 1000, gold: 600, mats: { fluff: 6, dust: 3 } },
    talk: {
      offer: ['[쪽지] 흑흑… 나는 늘 한 짝이야. 내 짝이 침대 밑 오른쪽 깊은 곳에 있대.', '[쪽지] 찾아 주면 솜이랑 별가루를 줄게. — 양말 유령'],
      progress: '[쪽지] 오른쪽 깊은 곳… 단추 눈이 노려보는 곳이야.',
      done: ['[쪽지] 이제 우리 둘이야! 다시는 안 잃어버릴 거야.'],
    },
  },
  {
    id: 'q_honey',
    name: '곰 대장의 꿀사탕',
    main: false,
    giver: 'board',
    kind: 'collect',
    target: 'sugar',
    count: 5,
    req: { rescued: 'b_bear' },
    goal: '설탕 결정 다섯 모아 곰 대장에게 주기',
    reward: { exp: 500, gold: 300, potions: { hp: 5 } },
    talk: {
      offer: ['[쪽지] 태엽이 풀릴 때마다 단 게 당겨. 설탕 결정 다섯만 모아 줄래? — 곰 대장'],
      progress: '[쪽지] 설탕 결정은 과자 서랍 젤리들이 갖고 있어.',
      done: ['[쪽지] 와구와구! 고마워. 남는 사탕 가져가.'],
    },
  },
  {
    id: 'q_jellyfriends',
    name: '젤리 여왕의 신하들',
    main: false,
    giver: 'board',
    kind: 'kill',
    target: 'jelly',
    count: 10,
    req: { rescued: 'b_jelly' },
    goal: '과자 서랍의 젤리 열 깨끗하게 해 주기',
    reward: { exp: 600, gold: 350, mats: { sugar: 4 } },
    talk: {
      offer: ['[쪽지] 내 신하 젤리들이 아직 먼지에 홀려 있어. 열만 깨끗하게 해 다오. — 젤리 여왕'],
      progress: '[쪽지] 젤리는 과자 서랍 왼쪽 위에 많단다.',
      done: ['[쪽지] 말랑말랑 정신이 들었구나. 상으로 설탕을 주마.'],
    },
  },
];

export const QUEST_BY_ID: Record<string, QuestDef> = Object.fromEntries(QUESTS.map((q) => [q.id, q]));

export function progress(save: Save, id: string): QuestProgress {
  return save.quests[id] ?? { state: 'none', n: 0 };
}

export function canAccept(save: Save, q: QuestDef): boolean {
  if (progress(save, q.id).state !== 'none') return false;
  if (q.req.lv && save.lv < q.req.lv) return false;
  if (q.req.quest && progress(save, q.req.quest).state !== 'done') return false;
  if (q.req.rescued && !save.rescued.includes(q.req.rescued)) return false;
  return true;
}

export function accept(save: Save, id: string): boolean {
  const q = QUEST_BY_ID[id];
  if (!q || !canAccept(save, q)) return false;
  save.quests[id] = { state: 'active', n: 0 };
  refreshCollect(save);
  return true;
}

/** 모으기 · 친구 · 구출 퀘스트는 지금 가진 것으로 다 했는지 본다 */
export function refreshCollect(save: Save): void {
  for (const q of QUESTS) {
    if (q.kind !== 'collect' && q.kind !== 'friends' && q.kind !== 'rescue') continue;
    const p = save.quests[q.id];
    if (!p || (p.state !== 'active' && p.state !== 'ready')) continue;
    // 모으기는 가진 재료, 친구는 구한 친구 수, 구출은 이미 합류했는가
    const have = q.kind === 'collect' ? (save.mats[q.target as MatId] ?? 0) : q.kind === 'friends' ? save.rescued.length : save.party.includes(q.target as never) ? 1 : 0;
    p.n = Math.min(q.count, have);
    p.state = p.n >= q.count ? 'ready' : 'active';
  }
}

function bump(save: Save, kind: QuestKind, target: string): string[] {
  const changed: string[] = [];
  for (const q of QUESTS) {
    if (q.kind !== kind || (q.target !== target && q.target !== 'any')) continue;
    const p = save.quests[q.id];
    if (!p || p.state !== 'active') continue;
    p.n = Math.min(q.count, p.n + 1);
    if (p.n >= q.count) p.state = 'ready';
    changed.push(q.id);
  }
  return changed;
}

export function onKill(save: Save, defId: string): string[] {
  return [...bump(save, 'kill', defId), ...bump(save, 'boss', defId)];
}

/** 균열 층을 깼다: 그 층보다 얕은 목표는 모두 채운다 */
export function onRiftClear(save: Save, depth: number): string[] {
  const out: string[] = [];
  for (const q of QUESTS) {
    if (q.kind !== 'rift' || Number(q.target) > depth) continue;
    out.push(...bump(save, 'rift', q.target));
  }
  return out;
}

export function onEliteKill(save: Save): string[] {
  return bump(save, 'elite', 'any');
}

export function onRescue(save: Save, hero: string): string[] {
  refreshCollect(save);
  return QUESTS.filter((q) => q.kind === 'rescue' && q.target === hero && save.quests[q.id]).map((q) => q.id);
}

export function onFriend(save: Save): string[] {
  refreshCollect(save);
  return QUESTS.filter((q) => q.kind === 'friends' && save.quests[q.id]).map((q) => q.id);
}

export function onFreezeOk(save: Save): string[] {
  return bump(save, 'freeze', 'any');
}

export function onTagKill(save: Save): string[] {
  return bump(save, 'tagKill', 'any');
}

export function onOverwindKill(save: Save): string[] {
  return bump(save, 'overwindKill', 'any');
}

/** 이 방에 아직 줍지 않은 심부름 물건 */
export function errandsHere(save: Save, map: string): QuestDef[] {
  return QUESTS.filter((q) => q.kind === 'fetch' && q.fetch!.map === map && progress(save, q.id).state === 'active');
}

/** 심부름 물건을 주웠다 */
export function pickErrand(save: Save, id: string): boolean {
  const p = save.quests[id];
  if (!p || p.state !== 'active') return false;
  p.n = 1;
  p.state = 'ready';
  return true;
}

export function onForge(save: Save): string[] {
  return bump(save, 'forge', 'any');
}

/** 보고하고 보상을 받는다 */
export function complete(save: Save, id: string, rng: Rng): boolean {
  const q = QUEST_BY_ID[id];
  refreshCollect(save);
  const p = save.quests[id];
  if (!q || !p || p.state !== 'ready') return false;
  if (q.kind === 'collect') save.mats[q.target as MatId] -= q.count;
  p.state = 'done';
  const r = q.reward;
  save.gold += r.gold;
  gainExp(save, r.exp);
  if (r.potions?.hp) save.potions.hp += r.potions.hp;
  for (const [k, v] of Object.entries(r.mats ?? {})) save.mats[k as MatId] += v!;
  if (r.part) {
    if (save.parts[r.part]) save.gold += 200;
    else save.parts[r.part] = 1;
  }
  void rng;
  for (const f of q.flags ?? []) save.flags[f] = true;
  refreshCollect(save);
  return true;
}

/** 이 NPC 와 이야기할 때 보여 줄 퀘스트 (보고할 것 → 새로 받을 것 → 하는 중인 것) */
export function questFor(save: Save, npc: string): { quest: QuestDef; mode: 'done' | 'offer' | 'progress' } | null {
  refreshCollect(save);
  const mine = QUESTS.filter((q) => q.giver === npc);
  const ready = mine.find((q) => progress(save, q.id).state === 'ready');
  if (ready) return { quest: ready, mode: 'done' };
  const offer = mine.find((q) => canAccept(save, q));
  if (offer) return { quest: offer, mode: 'offer' };
  const active = mine.find((q) => progress(save, q.id).state === 'active');
  if (active) return { quest: active, mode: 'progress' };
  return null;
}

/** 지금 할 일 (화면 오른쪽 위 목표): 주 퀘스트 우선 */
export function currentGoal(save: Save): { quest: QuestDef; state: QuestProgress } | null {
  refreshCollect(save);
  for (const q of QUESTS.filter((x) => x.main)) {
    const p = progress(save, q.id);
    if (p.state === 'active' || p.state === 'ready') return { quest: q, state: p };
  }
  for (const q of QUESTS.filter((x) => x.main)) if (canAccept(save, q)) return { quest: q, state: progress(save, q.id) };
  return null;
}
