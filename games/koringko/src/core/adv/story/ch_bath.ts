/** 욕실 (9살, 웃은 자국) */
import { s } from '../parse.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { grid, toyRoom } from './kit.ts';

const MAP = grid(28, 16, 'b', 'M', [
  ['~', 3, 2, 8, 4],
  ['M', 18, 6, 9, 1],
  ['M', 18, 1, 1, 6],
  ['b', 22, 6, 1, 1],
  ['v', 1, 10, 12, 1],
  ['~', 15, 12, 3, 2],
  ['K', 8, 7, 2, 1],
]);

export const CH_BATH: Chapter = {
  n: 0,
  title: '0장 · 욕실',
  sub: '9살, 웃은 자국',
  room: 'bath',
  start: [22, 13],
  party: ['toby', 'bori', 'ruru', 'nabi'],
  wind: 0.45,
  intro: s`
    @fade 1 0 white
    @bars on
    @music night
    @chtitle
    @fade 0 2
    > 불 꺼진 욕실. 수도꼭지에서 톡, 톡, 물방울이 떨어진다.
    nabi: 으… 물. 고양이는 물을 싫어해.
    ruru: 그럼 넌 거기 있어. 우리끼리 갔다 올게.
    nabi: …같이 갈 거야. 내 등불 없으면 아래 칸은 하나도 안 보일걸.
    bori: 비누 냄새 좋다. 할머니가 쓰시던 장미 비누.
    toby: 욕조에 물이 고여 있으니까 조심해. 우리 솜은 젖으면 무거워져.
    @bars off
    @goal 기억 조각 일곱 개를 찾자
  `,
};

export function bathRoom(): RoomDef {
  return toyRoom('bath', MAP, {
    name: '욕실',
    theme: 'cave',
    start: [22, 13],
    music: 'night',
    ambient: [70, 80, 110],
    lights: [{ at: [22, 13], r: 70, color: [200, 220, 255], k: 0.3 }],
    things: [
      {
        kind: 'memory',
        id: 'mBa',
        at: [13, 3],
        name: '웃은 자국',
        caption: '「주름은 웃은 자국이란다. 하루 덕분에 많이 생겼지」',
        scene: s`
          @room m_bath
          @show gm grandma 7 7 left
          @show haru haru9 5 7 right
          @music box
          > 하루, 아홉 살. 할머니랑 거품 목욕.
          haru: 할머니, 거품 수염! 할아버지 같지?
          gm: 아이고, 우리 하루 할아버지 됐네.
          @emote haru ?
          haru: 할머니는 왜 얼굴에 주름이 있어?
          gm: 주름? 이건 웃은 자국이란다.
          haru: 웃은 자국?
          gm: 많이 웃으면 생기지. 하루 태어나고 엄청 많이 생겼어. 하루 덕분이야.
          haru: 그럼 나도 많이 웃으면 생겨?
          gm: 그럼. 할머니만큼 웃으려면 아직 멀었다.
          haru: 그럼 엄청 웃어야지! 하하하하!
          @emote gm ♥
          @wait 1.5
        `,
        after: s`
          ruru: 웃은 자국이래. 할머니 주름 엄청 많았는데.
          bori: 그럼 그만큼 웃으셨다는 거야.
          nabi: 대부분 하루 때문에.
          toby: 하루는 지금… 웃은 자국이 생길까?
          @emote toby …
        `,
      },
      {
        kind: 'memory',
        id: 'mBb',
        at: [5, 13],
        dark: true,
        name: '우리 할머니',
        caption: '하루의 작문 「우리 할머니」',
        scene: s`
          @room m_room9
          @show haru haru9 8 6 down
          @show gm grandma 8 8 up sit
          @music piano
          > 내일은 학교 공개 수업. 엄마 아빠는 일하러 가고, 할머니가 오시기로 했다.
          haru: 할머니, 내가 발표할 거 미리 들어 봐. 제목은 「우리 할머니」.
          gm: 할머니 얘기야? 떨리네.
          haru: 에헴.
          > 「우리 할머니는 태엽을 잘 감습니다. 토비 태엽도, 시계 태엽도, 내 마음 태엽도 잘 감습니다.」
          > 「우리 할머니는 거짓말을 못합니다. 그런데 숨바꼭질은 더 못합니다. 기침 때문에 다 들킵니다.」
          > 「우리 할머니 미역국은 세상에서 제일 맛있습니다. 마음을 한 숟갈 넣기 때문입니다.」
          > 「나는 커서 할머니처럼 되고 싶습니다. 주름이 많은 사람이 되고 싶습니다. 웃어서 생긴 주름이요.」
          haru: 끝! 어때?
          @wait 1.2
          @emote gm tear
          gm: …아이고. 우리 하루, 할머니 울리네.
          haru: 할머니 울어? 왜 울어? 슬픈 거 아닌데!
          gm: 좋아서 우는 거야. 이런 눈물도 있단다.
          @wait 1.5
        `,
        after: s`
          @emote bori tear
          bori: 마음 태엽도 잘 감는대…
          toby: 할머니 미역국… 마음 한 숟갈… 하루는 그걸 다 기억하고 있었어.
          nabi: 기억하고 있으니까 더 아픈 거야.
          ruru: 좋아서 우는 눈물도 있대. 그런 거면 울어도 괜찮겠다.
        `,
      },
      {
        kind: 'memory',
        id: 'mBc',
        at: [10, 12],
        dark: true,
        name: '깨진 안경',
        caption: '「안경은 또 사면 되지만, 정직한 우리 하루는 못 사」',
        scene: s`
          @room m_gm
          @show haru haru9 6 6 down
          @show gm grandma 13 6 left
          @music piano
          > 우지끈. 하루가 소파 방석 위에 앉았는데— 할머니 안경이었다.
          @emote haru !
          haru: …큰일 났다.
          gm: 하루야, 할머니 안경 못 봤니? 아까 여기 뒀는데.
          haru: 모, 못 봤어!
          > 하루는 깨진 안경을 등 뒤에 숨겼다.
          @flag glass_go
          @control haru
          @goal 어떻게 하지… (숨기기? 말하기?)
        `,
        after: s`
          ruru: 나 같으면 끝까지 숨겼을 텐데.
          nabi: 그래서 너는 할머니한테 칭찬 못 받는 거야.
          bori: 할머니는 안경보다 하루 마음이 더 중요했던 거야.
          toby: "정직한 우리 하루는 못 사." …지금 하루도 정직할까. 자기 마음한테.
        `,
      },
      {
        kind: 'memory',
        id: 'mBd',
        at: [24, 2],
        name: '하루 별',
        caption: '「할머니는 나중에 저 별 옆에 있을게」',
        scene: s`
          @room m_yard_n
          @show haru haru9 10 6 up sit
          @show gm grandma 11 6 up sit
          @music piano
          > 여름밤. 할머니와 마당에 돗자리를 깔고 누웠다.
          haru: 별 진짜 많다.
          gm: 저기 제일 반짝이는 거 보이니? 할머니가 저 별 이름 지어 줄게. 「하루 별」.
          haru: 하루 별! 그럼 그 옆에 작은 거는?
          gm: 음… 저건 「할머니 별」 하자.
          haru: 할머니 별은 왜 작아?
          gm: 할머니는 늙어서 그래. 허허.
          @wait 1
          gm: 하루야. 할머니가 나중에, 아주 나중에 하늘에 가면… 저 별 옆에 있을게.
          haru: 하늘 가지 마.
          gm: 아주 나중에.
          haru: …그럼 나는 매일 밤 인사할게. 할머니 별한테.
          gm: 그래. 그럼 할머니도 반짝 하고 대답하마.
          @wait 2
        `,
        after: s`
          nabi: 하루 별, 할머니 별.
          toby: 하루는 요즘도 밤에 하늘을 볼까.
          ruru: 다락방 창으로 보면 보이겠다. 오늘 밤.
          bori: 엔딩에서 꼭 보여 주자. 하루한테.
          ruru: 엔딩이 뭐야?
          bori: …몰라. 그냥 그런 말이 떠올랐어.
        `,
      },
      {
        kind: 'memory',
        id: 'mBe',
        at: [20, 4],
        name: '먼저 감는 사람',
        caption: '「미안하다는 말은 태엽 같은 거야. 먼저 감아 주는 사람이 이긴다」',
        scene: s`
          @room m_room9
          @show haru haru9 14 6 left sit
          @show gm grandma 1 3 down
          @music piano
          > 학교에서 단짝 친구와 싸운 날. 하루는 저녁도 안 먹고 침대에 앉아 있었다.
          @walk gm 11 6 40
          gm: 꿀차 타 왔다. 무슨 일이니.
          haru: 서윤이가 먼저 내 지우개 가져갔어. 근데 내가 소리 질렀다고 나만 혼났어.
          gm: 그래서 화가 났구나.
          haru: 내가 먼저 사과 안 할 거야.
          gm: …하루야. 미안하다는 말은 태엽 같은 거란다.
          haru: 태엽?
          gm: 서로 멈춰서 기다리기만 하면 둘 다 영영 안 움직여. 누가 먼저 감아 줘야 다시 걷지.
          gm: 그러니까 먼저 감아 주는 사람이 이기는 거야.
          @wait 1
          haru: …내일 서윤이한테 지우개 하나 줄래. 내 거 새것.
          gm: 그래. 그게 이기는 거다.
          @wait 1.5
        `,
        after: s`
          toby: 먼저 감아 주는 사람이 이긴다.
          ruru: 우리가 먼저 감으러 가는 거야. 하루 마음을.
          bori: 루루, 오늘 진짜 멋있는 말 많이 한다.
          ruru: 원래 멋있었거든.
        `,
      },
      {
        kind: 'memory',
        id: 'mBf',
        at: [2, 8],
        name: '할머니 머리 감기',
        caption: '이번엔 하루가 할머니 머리를 감겨 드렸다',
        scene: s`
          @room m_bath
          @show gm grandma 5 7 right sit
          @show haru haru9 7 7 left
          @music box
          > 할머니가 팔이 아프다고 한 날. 하루가 샴푸를 들었다.
          haru: 오늘은 내가 할머니 머리 감겨 줄게!
          gm: 아이고, 시원하다. 우리 하루 손이 약손이네.
          haru: 할머니 머리 하얗다. 눈 같아.
          gm: 눈이 많이 내렸지. 할머니 머리에.
          haru: 그럼 나중에 내 머리에도 내려?
          gm: 아주 나중에. 할머니만큼 살면.
          haru: 그럼 그때 내가 할머니 머리 또 감겨 줄게. 둘 다 하얀 머리로.
          gm: …허허. 그래, 그러자꾸나.
          @wait 1.5
        `,
        after: s`
          nabi: 둘 다 하얀 머리로…
          toby: 그 약속도 못 지키게 됐네.
          bori: 아니야. 하루가 할머니 나이가 되면, 그때 할머니 생각하면서 머리 감을 거야. 그럼 지킨 거야.
          ruru: 보리 계산도 할머니처럼 이상해졌다.
          bori: 좋은 계산이야.
        `,
      },
      {
        kind: 'link',
        id: 'lB',
        at: [24, 13],
        name: '토비 극장 대본',
        icon: 'puppet',
        locked: s`nabi: 아직이야. 어둠 속 아래 칸도, 비누 뒤 칸도 살펴봐.`,
        scene: s`
          @bars on
          > 욕조 옆 선반에 젖었다 마른 종이 한 장. 크레용 글씨: 「토비 극장 1화」.
          ruru: 하루가 목욕하면서 대본 연습했었어!
          bori: 그때부터 할머니랑 매주 토요일 인형극을 했지. 여덟 살.
          nabi: 책장으로 가자. 무대가 아직 거기 있어.
          > 상징물에 깃든 기억이 흐트러져 있다. 조각을 맞춰야 다음 기억으로 이어진다.
          @mini memento8
          @sfx open
          @flag chb_done
          @sfx memory
          @fade 1 1.4 white
          @next
        `,
      },
      { kind: 'block', id: 'bB', at: [22, 6], look: 'soap' },
      { kind: 'gap', id: 'gB', at: [6, 9], tiles: [[6, 10]] },
      {
        kind: 'trigger',
        id: 'tBsoap',
        rect: [20, 7, 5, 2],
        unless: 'mem_mBe',
        scene: s`bori: 커다란 비누가 선반 칸을 막고 있어. 아래에서 밀어 볼게!`,
      },
      {
        kind: 'trigger',
        id: 'tBgap',
        rect: [3, 8, 7, 2],
        unless: 'gap_gB',
        scene: s`
          ruru: 배수구 틈이다. 밧줄 걸게!
          nabi: 아래 칸은 깜깜해. 내려가면 내 옆에 붙어 있어.
        `,
      },
      { kind: 'star', id: 'sBa', at: [1, 1], text: '수건 사이에 낀 종이별.' },
      { kind: 'star', id: 'sBb', at: [26, 1], text: '비누 받침 뒤의 분홍 종이별.' },
      { kind: 'star', id: 'sBc', at: [1, 14], text: '어둠 속 배수구 옆 종이별.', dark: true },
      { kind: 'star', id: 'sBd', at: [26, 14], text: '젖었다 마른 쭈글쭈글한 종이별.' },
      {
        kind: 'spot',
        id: 'duck',
        at: [12, 7],
        scene: s`
          > 고무 오리 하나. 꽥.
          ruru: 이 친구는 우리랑 같이 상자에 안 들어갔네.
          bori: 욕실 담당이니까. 이사 가면 새 욕실에서 일하겠지.
        `,
      },
      {
        kind: 'spot',
        id: 'toothbrush',
        at: [16, 3],
        scene: s`
          > 칫솔꽂이. 칫솔이 셋. 한 자리가 비어 있다.
          nabi: 할머니 칫솔 자리.
          toby: 하루네는 빈자리를 잘 못 치우는구나. 열쇠 고리도, 의자도, 칫솔꽂이도.
        `,
      },
      {
        kind: 'spot',
        id: 'rosesoap',
        at: [14, 9],
        scene: s`
          > 장미 비누. 반쯤 닳았다.
          bori: 할머니 비누. 이 냄새만 맡으면 할머니가 옆에 있는 것 같아.
          ruru: 그래서 하루가 아직 이 비누 안 버린 거구나.
        `,
      },
      {
        kind: 'spot',
        id: 'mirror',
        at: [25, 8],
        scene: s`
          > 김 서린 거울에 손가락으로 쓴 글씨가 희미하게 남아 있다. 「할머니 보고 싶어」.
          @emote toby …
          toby: …최근 글씨야.
          nabi: 하루는 거울한테만 말했구나.
        `,
      },
    ],
  });
}
