/** 6장 · 책장 (8살, 토비 극장) — 동료 셋이 하루에게 온 사연 */
import { s } from '../parse.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { grid, toyRoom } from './kit.ts';

const MAP = grid(28, 16, 'w', 'E', [
  ['E', 7, 1, 1, 4],
  ['E', 20, 1, 1, 3],
  ['Q', 11, 3, 2, 2],
  ['E', 1, 5, 3, 1],
  ['E', 5, 5, 3, 1],
  ['E', 20, 5, 4, 1],
  ['E', 25, 5, 2, 1],
  ['E', 7, 6, 1, 2],
  ['E', 20, 6, 1, 2],
  ['E', 7, 9, 1, 1],
  ['E', 20, 9, 1, 1],
  ['E', 1, 10, 7, 1],
  ['E', 11, 10, 6, 1],
  ['E', 20, 10, 1, 5],
  ['v', 21, 10, 6, 1],
  ['O', 4, 12, 1, 1],
  ['O', 15, 13, 1, 1],
]);

export const CH6: Chapter = {
  n: 6,
  title: '6장 · 책장',
  sub: '8살, 토비 극장',
  room: 'shelf',
  start: [10, 13],
  party: ['toby', 'bori', 'ruru', 'nabi'],
  wind: 0.4,
  intro: s`
    @fade 1 0 white
    @bars on
    @music playful
    @title 6장 · 책장 | 8살, 토비 극장
    @fade 0 2
    > 거실 책장. 그림책과 동화책 사이에 오래된 인형극 무대가 숨어 있다.
    ruru: 여기다! 토비 극장 무대!
    bori: 커튼이 다 떨어졌네.
    nabi: 이 책장엔 우리 셋의 기억이 하나씩 있대. …왠지 그런 느낌이 들어.
    toby: 우리 셋? 나는?
    nabi: 너는 맨 마지막에. 주인공은 원래 마지막에 나오는 거야.
    @bars off
    @goal 기억 조각 다섯 개를 찾자 (보리 · 루루 · 나비의 기억)
  `,
};

export function shelfRoom(): RoomDef {
  return toyRoom('shelf', MAP, {
    name: '책장',
    theme: 'toybox',
    start: [10, 13],
    music: 'playful',
    lights: [{ at: [13, 8], r: 90, color: [255, 210, 160], k: 0.4 }],
    things: [
      {
        kind: 'memory',
        id: 'm6a',
        at: [2, 2],
        name: '할머니의 곰',
        caption: '보리는 할머니가 일곱 살 때부터 함께한 곰',
        scene: s`
          @room m_living8
          @show gm grandma 5 8 up sit
          @show haru haru8 9 8 up sit
          @music waltz
          > 하루, 여덟 살. 비 오는 토요일, 할머니와 거실에서 인형극을 준비했다.
          @face haru gm
          haru: 할머니, 보리는 어디서 왔어? 토비는 할머니가 사 줬잖아.
          @face gm haru
          gm: 보리? 보리는… 할머니 곰이란다.
          @emote haru !
          haru: 할머니 곰?
          gm: 할머니가 일곱 살 때, 할머니의 엄마가 만들어 주셨지. 그때부터 쭉 할머니 옆에 있었단다.
          haru: 그럼 보리는 몇 살이야?
          gm: 글쎄다… 예순 살은 훌쩍 넘었겠지?
          haru: 예순 살! 보리 할아버지네!
          gm: 허허. 할머니가 너무 힘들 때마다 보리를 꼭 안았어. 그러면 꿀처럼 마음이 달콤해졌지.
          gm: 그래서 우리 하루한테 준 거야. 하루도 힘들 때 꼭 안으라고.
          @wait 1
        `,
        after: s`
          @emote bori …
          bori: 나… 할머니 곰이었구나.
          ruru: 몰랐어? 본인이?
          bori: 너무 오래돼서. 기억이 꿀처럼 녹아 버렸나 봐.
          bori: 그래도 이제 기억났어. 할머니의 작은 손. 그리고… 하루한테 건네지던 날.
          @emote bori tear
          bori: 할머니. 하루 꼭 안아 줄게요. 약속해요.
          toby: 보리…
        `,
      },
      {
        kind: 'memory',
        id: 'm6b',
        at: [24, 13],
        name: '서른 번의 인형 뽑기',
        caption: '아빠가 서른 번 만에 뽑아 준 여우',
        scene: s`
          @room m_living8
          @show dad dad 13 6 left
          @show haru haru8 9 8 up sit
          @music waltz
          @face haru dad
          haru: 아빠! 루루는 아빠가 뽑아 준 거지?
          dad: 그럼! 놀이공원 인형 뽑기. 아빠가 서른 번 만에 뽑았지.
          haru: 서른 번!
          dad: 엄마한테 엄청 혼났어. 그 돈이면 여우 인형 세 개는 사겠다고.
          haru: 그래도 루루는 하나뿐이잖아.
          dad: 그래. 하루가 저 여우 아니면 안 된다고 울어서, 아빠가 포기를 못 했지.
          @emote haru ♪
          haru: 루루는 아빠가 서른 번이나 포기 안 하고 데려온 거야. 그러니까 제일제일 소중해.
          @wait 1
        `,
        after: s`
          @emote ruru …
          ruru: …서른 번.
          nabi: 서른 번이나 포기 안 하고 데려온 거래. 너를.
          ruru: 하, 그냥 뽑기 기계가 고장 났던 거겠지.
          bori: 루루 꼬리 흔들린다.
          ruru: 안 흔들렸거든!
          @emote ruru ♥
          ruru: …덤인 줄 알았어. 그냥 딸려 온 거.
          toby: 덤 아니야. 처음부터.
        `,
      },
      {
        kind: 'memory',
        id: 'm6c',
        at: [24, 2],
        name: '토비 극장',
        caption: '나비는 하루 아기 이불로 만든 고양이',
        dark: true,
        scene: s`
          @room m_living8
          @show gm grandma 8 5 down
          @show haru haru8 10 5 down
          @music waltz
          > 상자로 만든 무대 위로 빨간 커튼이 걷혔다.
          gm: 자, 「토비 극장」 시작합니다! 오늘의 이야기는…
          haru: 할머니, 인형은 내가 고를게!
          @mini puppet
          gm: …그리하여 토비와 친구들은 무사히 집으로 돌아왔답니다. 끝!
          @sfx cheer
          @face haru gm
          haru: 할머니, 나비는? 나비는 어디서 왔어?
          @face gm haru
          gm: 나비는 할머니가 만들었지. 하루 아기 때 덮던 이불로.
          @emote haru !
          haru: 내 이불?
          gm: 그래. 하루가 그 이불이 다 해져도 못 버리고 울길래, 고양이로 만들어 줬지. 등불도 하나 들려 주고.
          haru: 왜 등불이야?
          gm: 하루는 어둠을 무서워했잖니. 밤에도 나비가 길을 밝혀 주라고.
          @wait 1
        `,
        after: s`
          @emote nabi …
          nabi: 하루 아기 이불… 그래서 내 몸에서 하루 냄새가 나는 거구나.
          ruru: 나비가 맨날 잘난 척하던 게 사실은 하루 이불이었다니.
          nabi: 이불이 뭐 어때서. 이 세상에서 하루를 제일 오래 안아 준 게 나라고.
          toby: 나비 덕분에 침대 밑에서도 길을 찾았어. 할머니 말대로.
          nabi: …흥. 당연하지.
        `,
      },
      {
        kind: 'link',
        id: 'l6',
        at: [14, 7],
        name: '녹은 생일 초',
        icon: 'candle',
        locked: s`nabi: 아직이야. 우리 셋 기억이 다 모여야 해.`,
        scene: s`
          @bars on
          > 책장 맨 아래, 반쯤 녹은 생일 초 하나가 굴러다닌다.
          toby: 일곱 개 중 하나야. 하루 일곱 살 생일.
          bori: 케이크! 그날 케이크 진짜 맛있었는데.
          ruru: 너 먹지도 못했잖아.
          bori: 냄새로 먹었어!
          toby: 그날… 내 태엽이 처음으로 멈췄던 날이야.
          @emote toby …
          toby: 가 보자. 과자 서랍으로.
          > 상징물에 깃든 기억이 흐트러져 있다. 조각을 맞춰야 다음 기억으로 이어진다.
          @mini memento6
          @sfx open
          @flag ch6_done
          @sfx memory
          @fade 1 1.4 white
          @chapter 7
        `,
      },
      { kind: 'block', id: 'b6', at: [4, 5], look: 'block' },
      { kind: 'gap', id: 'g6', at: [23, 9], tiles: [[23, 10]] },
      {
        kind: 'trigger',
        id: 't6block',
        rect: [3, 6, 3, 2],
        unless: 'mem_m6a',
        scene: s`
          bori: 이 위는… 왠지 내가 가야 할 것 같은 곳이야. 블록을 밀어 볼게. 블록 아래에서!
        `,
      },
      {
        kind: 'trigger',
        id: 't6gap',
        rect: [21, 8, 6, 2],
        unless: 'gap_g6',
        scene: s`
          ruru: 저 아래 칸… 내 냄새가 나. 밧줄로 내려가자. 낭떠러지 끝에서 나를 불러!
        `,
      },
      {
        kind: 'trigger',
        id: 't6dark',
        rect: [21, 6, 6, 2],
        unless: 'mem_m6c',
        scene: s`
          nabi: 맨 위 칸은 깜깜하네. 내 등불을 따라와.
        `,
      },
      { kind: 'star', id: 's6a', at: [1, 1], text: '그림책 사이에 끼어 있던 종이별.' },
      { kind: 'star', id: 's6b', at: [26, 1], text: '어둠 속에서 은은하게 빛나는 종이별.', dark: true },
      { kind: 'star', id: 's6c', at: [1, 14], text: '구슬 옆에 떨어진 분홍 종이별.' },
      { kind: 'star', id: 's6d', at: [26, 14], text: '밧줄 끝에 걸려 있던 종이별.' },
      {
        kind: 'spot',
        id: 'picturebook',
        at: [9, 2],
        scene: s`
          > 「달님 안녕」. 표지가 너덜너덜하다.
          toby: 할머니가 매일 밤 읽어 주던 책이야. 하루는 마지막 장에서 꼭 달님한테 손을 흔들었어.
        `,
      },
      {
        kind: 'spot',
        id: 'script',
        at: [16, 3],
        scene: s`
          > 크레용으로 쓴 대본. 「토비 극장 3화: 토비, 바다에 가다」.
          ruru: 3화는 내가 상어 역할이었어. 최고의 악당이었지.
          bori: 나는 고래였어. 말없이 떠 있기만 했지만.
        `,
      },
      {
        kind: 'spot',
        id: 'tickets',
        at: [13, 13],
        scene: s`
          > 색종이로 만든 입장권 한 뭉치. 「토비 극장 · 관객: 할머니」.
          nabi: 관객은 늘 할머니 한 분이었어. 그래도 할머니는 매번 처음 보는 것처럼 박수를 치셨지.
        `,
      },
      {
        kind: 'spot',
        id: 'curtain',
        at: [17, 7],
        scene: s`
          > 떨어진 빨간 커튼 조각. 할머니가 바느질한 자국이 보인다.
          toby: 할머니 바늘땀. 하나하나 똑같은 간격이야.
        `,
      },
      {
        kind: 'spot',
        id: 'marble6',
        at: [5, 13],
        scene: s`
          > 구슬 하나가 반짝인다.
          ruru: 토비 극장 2화 소품. 이게 「용의 보물」이었어.
          bori: 그냥 구슬인데.
          ruru: 상상력이 없구나, 보리.
        `,
      },
    ],
  });
}
