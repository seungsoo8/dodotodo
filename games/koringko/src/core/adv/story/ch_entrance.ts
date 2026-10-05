/** 현관 (11살, 놓지 않았다는 거짓말) */
import { s } from '../parse.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { CAUGHT } from './ch1.ts';
import { grid, toyRoom } from './kit.ts';

const MAP = grid(30, 18, '#', 'K', [
  ['v', 1, 6, 28, 1],
  ['K', 21, 10, 8, 1],
  ['K', 21, 11, 1, 6],
  ['#', 21, 13, 1, 1],
  ['K', 6, 9, 3, 2],
  ['K', 13, 12, 2, 2],
  ['O', 4, 2, 1, 1],
  ['O', 25, 3, 1, 1],
]);

export const CH_ENTRANCE: Chapter = {
  n: 0,
  title: '0장 · 현관',
  sub: '11살, 놓지 않았다는 거짓말',
  room: 'entrance',
  start: [3, 15],
  party: ['toby', 'bori', 'ruru', 'nabi'],
  wind: 0.55,
  intro: s`
    @fade 1 0 white
    @bars on
    @music night
    @chtitle
    @fade 0 2
    > 현관. 이삿짐 상자들 사이로 신발들이 가지런히 놓여 있다.
    ruru: 신발 냄새…
    nabi: 여긴 하루가 매일 아침 "다녀오겠습니다" 하던 곳이야.
    bori: 그리고 할머니가 매일 "차 조심하고" 하던 곳.
    toby: …단차가 높네. 아래 칸에서 위 칸으로 올라가려면 밧줄이 필요하겠어.
    @bars off
    @goal 기억 조각 여섯 개를 찾자
    @flag che_in
  `,
};

export function entranceRoom(): RoomDef {
  return toyRoom('entrance', MAP, {
    name: '현관',
    theme: 'village',
    start: [3, 15],
    music: 'night',
    ambient: [92, 96, 140],
    lights: [{ at: [15, 2], r: 120, color: [255, 210, 150], k: 0.4 }],
    steps: { calm: [11, 16], warn: 2.4, hold: 3, when: 'che_in', until: 'che_done', caught: [...CAUGHT, s`nabi: 엄마가 문단속하러 나왔어. 밤마다 두 번씩 확인하거든.`] },
    things: [
      {
        kind: 'memory',
        id: 'mEa',
        at: [9, 14],
        name: '놓지 마',
        caption: '「안 놨어」 — 할머니의 첫 거짓말',
        scene: s`
          @room m_yard_d
          @show haru haru11 4 6 right
          @show gm grandma 3 6 right
          @music piano
          > 하루, 열한 살. 보조 바퀴를 뗀 자전거.
          haru: 할머니! 절대 놓으면 안 돼! 알았지?
          gm: 그래, 그래. 꽉 잡고 있으마.
          @walk haru 9 6 40 nowait
          @walk gm 8 6 40
          haru: 놓지 마! 놓지 마!
          gm: 안 놨어. 계속 잡고 있어.
          @walk haru 17 6 60 nowait
          @wait 0.3
          > 할머니의 손이, 살며시 떨어졌다.
          @wait 1.4
          haru: 할머니, 나 잘 타지? 할머니 아직 잡고 있지?
          @face haru left
          @emote haru !
          > 돌아본 하루의 눈에, 저 멀리서 손을 흔드는 할머니가 보였다.
          haru: …언제 놨어?
          gm: 아까부터. 우리 하루 혼자 잘만 가던데?
          haru: 거짓말쟁이!
          gm: 허허. 이건 착한 거짓말이란다.
          @wait 1.5
        `,
        after: s`
          toby: 착한 거짓말…
          nabi: 할머니는 하루가 혼자 갈 수 있다는 걸 알았던 거야. 하루보다 먼저.
          ruru: 근데 그거 좀 무섭다. 돌아봤는데 아무도 안 잡고 있으면.
          bori: 그래도 손을 흔들고 있었잖아. 저 멀리서.
        `,
      },
      {
        kind: 'memory',
        id: 'mEb',
        at: [26, 2],
        name: '미역국 배우기',
        caption: '「참기름에 고기를 달달 볶다가, 마음을 한 숟갈」',
        scene: s`
          @room m_kitchen_d
          @show gm grandma 8 4 down
          @show haru haru11 10 4 down
          @music box
          > 토요일 아침. 할머니가 앞치마를 두 개 꺼냈다.
          gm: 오늘은 할머니가 미역국 끓이는 법 알려 줄게.
          haru: 왜 갑자기?
          gm: 할머니 미역국은 할머니가 없으면 아무도 못 끓이잖니.
          @emote haru ?
          haru: 할머니가 왜 없어. 맨날 끓여 주면 되지.
          gm: …그러니까, 할머니가 바쁠 때 말이다. 자, 참기름 한 숟갈.
          haru: 한 숟갈!
          gm: 고기를 달달 볶다가… 불린 미역을 넣고… 또 달달.
          haru: 달달.
          gm: 물 붓고, 간장 조금. 그리고 마지막에—
          haru: 마지막에?
          gm: 마음 한 숟갈.
          haru: 그게 뭐야!
          gm: 맛있게 먹어라, 하는 마음. 그게 제일 중요해.
          @wait 1.2
        `,
        after: s`
          bori: 마음 한 숟갈…
          nabi: 그래서 2장에서 하루가 "할머니 맛이랑 달라"라고 한 거야. 마음 한 숟갈이 빠져서.
          ruru: 아니야. 마음은 넣었을 거야. 너무 많이 넣어서 짰겠지.
          toby: 루루가 웬일로 좋은 말을 해.
          ruru: 나 원래 좋은 말 해!
        `,
      },
      {
        kind: 'memory',
        id: 'mEc',
        at: [27, 15],
        name: '짠 미역국',
        caption: '「세상에서 제일 맛있는 미역국이다」',
        scene: s`
          @room m_kitchen_d
          @show gm grandma 7 7 up
          @show haru haru11 10 7 up
          @show mom mom 11 4 down
          @music waltz
          > 할머니 생신 아침. 하루가 처음으로 혼자 미역국을 끓였다.
          haru: 할머니! 생신 축하해! 내가 끓였어!
          gm: 아이고, 우리 하루가? 어디 보자.
          @wait 1
          > 할머니가 한 숟갈 떠먹었다.
          @wait 1.2
          @emote gm sweat
          mom: …어머니, 짜시죠?
          gm: 짜긴. 딱 좋다.
          haru: 진짜? 짜면 짜다고 해.
          gm: …아이고, 짜라!
          @emote haru !
          gm: 그런데 세상에서 제일 맛있는 미역국이다.
          > 할머니는 그 짠 미역국을 한 그릇 다 비웠다. 두 그릇째도.
          haru: 할머니, 내년에도 끓여 줄게. 내년엔 안 짜게!
          gm: 그래. 기다리마.
          @wait 1.5
        `,
        after: s`
          @emote bori tear
          bori: 내년에도…
          nabi: 내년엔… 할머니가 입원하셨지.
          toby: 그래서 하루는 미역국을 다시 끓이지 못했어. 할머니한테는.
          ruru: 다음 생신엔 엄마가 끓였고. 하루는 몰래 혼자 먹었고.
          @emote toby …
        `,
      },
      {
        kind: 'memory',
        id: 'mEd',
        at: [16, 2],
        name: '운동회',
        caption: '꼴찌로 들어온 하루에게 가장 큰 박수',
        scene: s`
          @room m_yard_d
          @show haru haru11 3 7 right
          @show gm grandma 12 3 down
          @show dad dad 14 3 down
          @music waltz
          > 가을 운동회. 이어달리기 마지막 주자, 하루.
          gm: 우리 하루 화이팅!
          dad: 어머니, 목 쉬세요.
          > 출발! 하루가 달린다. 그리고— 넘어졌다.
          @pose haru sit
          @emote haru tear
          gm: 하루야! 일어나! 할머니 여기 있다!
          @pose haru idle
          @flag race_go
          @control haru
          @goal 끝까지 달리자 (오른쪽 끝 결승선)
        `,
        after: s`
          ruru: 꼴찌로 들어왔는데 할머니가 제일 크게 박수 쳤대.
          bori: 할머니한텐 하루가 늘 일등이야.
          nabi: 그날 하루 무릎에 붙인 반창고, 아직 일기장에 붙어 있어.
          toby: …나비는 그런 걸 어떻게 다 알아?
          nabi: 고양이는 다 봐.
        `,
      },
      {
        kind: 'memory',
        id: 'mEe',
        at: [3, 2],
        name: '의원 앞 의자',
        caption: '「괜찮대」 — 하루는 그 말을 믿었다',
        scene: s`
          @room m_clinic
          @show haru haru11 5 7 up sit
          @music piano
          > 동네 의원. 하루는 진료실 밖 의자에서 할머니를 기다렸다.
          @wait 1
          > 문 너머로 낮은 목소리들이 들린다. 무슨 말인지는 들리지 않는다.
          @wait 1.5
          @show gm grandma 8 5 down
          @pose haru idle
          @face haru gm
          haru: 할머니! 뭐래?
          gm: 괜찮대. 감기가 좀 오래간대.
          haru: 그럼 약 먹으면 낫지?
          gm: …그럼. 약 먹으면 낫지.
          gm: 가자. 할머니가 떡볶이 사 줄게.
          haru: 앗싸!
          > 하루는 그날 떡볶이를 두 그릇 먹었다. 할머니는 한 입도 안 먹었다.
          @wait 1.5
        `,
        after: s`
          toby: 할머니는 그날 뭔가를 들었던 거야. 의사 선생님한테.
          nabi: 그리고 하루한테는 "괜찮대"라고 했어.
          ruru: 또 착한 거짓말이네.
          bori: 할머니 거짓말은 다 착해서… 더 슬퍼.
        `,
      },
      {
        kind: 'memory',
        id: 'mEf',
        at: [24, 14],
        name: '다녀오겠습니다',
        caption: '매일 아침 현관의 인사, 하루도 빠짐없이',
        scene: s`
          @room m_room11
          @show haru haru11 8 8 up
          @show gm grandma 1 3 down
          @music box
          > 아침. 하루가 책가방을 메고 나서려는데.
          gm: 하루야, 신발주머니!
          haru: 아 맞다!
          @walk gm 6 6 50
          @face haru gm
          gm: 차 조심하고. 모르는 사람 따라가지 말고. 점심 남기지 말고.
          haru: 할머니, 그 말 매일 해.
          gm: 매일 해야 매일 기억하지.
          haru: 다녀오겠습니다!
          gm: 그래, 잘 다녀와.
          @walk haru 8 10 60
          @hide haru
          > 그 인사는 할머니가 입원하던 날까지, 하루도 빠지지 않았다.
          @wait 1.5
        `,
        after: s`
          toby: 매일 해야 매일 기억한다.
          bori: 태엽이랑 똑같네. 매일 감아야 멈추지 않으니까.
          nabi: 할머니는 같은 말을 여러 번 하는 사람이었어. 일부러.
          ruru: 그래서 우리가 다 외우고 있잖아. 할머니 말.
        `,
      },
      {
        kind: 'link',
        id: 'lE',
        at: [15, 9],
        name: '운동회 사진',
        icon: 'photo',
        locked: s`toby: 아직 기억 조각이 남아 있어. 신발장 위 칸도, 구석 칸도 살펴보자.`,
        scene: s`
          @bars on
          > 신발장 문틈에 끼어 있는 사진 한 장. 무릎에 반창고를 붙인 하루와, 목이 쉰 할머니.
          ruru: 둘 다 엄청 웃고 있네.
          toby: 이때 하루는 열한 살. 할머니가 종이별 접기를 알려 준 건 그보다 전이었지.
          nabi: 열 살. 하루 책상.
          bori: 가자, 책상으로!
          > 상징물에 깃든 기억이 흐트러져 있다. 조각을 맞춰야 다음 기억으로 이어진다.
          @mini memento5
          @sfx open
          @flag che_done
          @sfx memory
          @fade 1 1.4 white
          @next
        `,
      },
      { kind: 'gap', id: 'gE', at: [14, 7], tiles: [[14, 6]] },
      { kind: 'block', id: 'bE', at: [21, 13], look: 'shoe' },
      {
        kind: 'trigger',
        id: 'tEgap',
        rect: [11, 7, 7, 2],
        unless: 'gap_gE',
        scene: s`ruru: 현관 단차! 내 밧줄이면 한 번에 올라가지. 단차 앞에서 불러 줘.`,
      },
      {
        kind: 'trigger',
        id: 'tEshoe',
        rect: [18, 12, 3, 3],
        unless: 'mem_mEc',
        scene: s`bori: 운동화가 구석 칸을 막고 있어. 운동화 왼쪽에서 밀게!`,
      },
      { kind: 'star', id: 'sEa', at: [1, 1], text: '신발장 위 먼지 속 종이별.' },
      { kind: 'star', id: 'sEb', at: [28, 5], text: '우산 손잡이에 걸린 종이별.' },
      { kind: 'star', id: 'sEc', at: [1, 11], text: '현관 매트 밑에 깔린 납작한 종이별.' },
      { kind: 'star', id: 'sEd', at: [28, 16], text: '작은 운동화 속에 들어 있던 종이별.' },
      {
        kind: 'spot',
        id: 'flowershoes',
        at: [10, 4],
        scene: s`
          > 꽃무늬 고무신 한 켤레. 신발장 맨 위 칸, 아무도 신지 않는 자리.
          nabi: 할머니 꽃신이야. 텃밭 갈 때 신으시던.
          bori: 엄마가 버리지 못하고 맨 위에 올려 두셨대.
        `,
      },
      {
        kind: 'spot',
        id: 'babyshoes',
        at: [4, 12],
        scene: s`
          > 손바닥만 한 노란 운동화.
          ruru: 이거 하루 첫 신발이다! 이렇게 작았어?
          toby: 할머니가 이 신발 신기고 마당 한 바퀴 걷는 데 한 시간 걸렸대.
        `,
      },
      {
        kind: 'spot',
        id: 'keyhook',
        at: [20, 2],
        scene: s`
          > 열쇠 걸이. 빈 고리 하나에 「할머니」 이름표가 붙어 있다.
          toby: 할머니 열쇠 자리…
          nabi: 빈 고리인데 아무도 이름표를 떼지 않았어.
        `,
      },
      {
        kind: 'spot',
        id: 'shoehorn',
        at: [11, 15],
        scene: s`
          > 긴 나무 구둣주걱.
          bori: 할아버지 거래. 할머니가 평생 쓰셨대. 이것도 오래됐어. 나처럼.
          ruru: 너 진짜 그 말 좋아한다.
        `,
      },
      {
        kind: 'spot',
        id: 'mail',
        at: [23, 8],
        scene: s`
          > 우편함에서 빠져나온 엽서 한 장. 「하루야 생일 축하한다 — 할머니」. 몇 년 전 날짜.
          toby: 할머니는 같은 집에 살면서도 생일마다 엽서를 보냈어.
          nabi: 우체부 아저씨가 매년 웃었대.
        `,
      },
    ],
  });
}
