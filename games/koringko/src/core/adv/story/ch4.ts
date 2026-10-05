/** 4장 · 거실 창가 (12살, 할머니가 병원에 계시던 겨울) */
import { s } from '../parse.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { grid, toyRoom } from './kit.ts';

const MAP = grid(28, 16, 'w', 'E', [
  ['v', 1, 3, 26, 1],
  ['a', 10, 6, 7, 4],
  ['K', 3, 5, 4, 2],
  ['K', 20, 5, 4, 2],
  ['K', 3, 10, 2, 2],
  ['K', 21, 10, 2, 2],
  ['E', 12, 12, 4, 1],
  ['E', 12, 13, 1, 1],
  ['E', 15, 13, 1, 2],
]);

export const CH4: Chapter = {
  n: 4,
  title: '4장 · 거실 창가',
  sub: '12살, 할머니가 병원에 계시던 겨울',
  room: 'window',
  start: [3, 14],
  party: ['toby', 'bori', 'ruru', 'nabi'],
  wind: 0.6,
  intro: s`
    @fade 1 0 white
    @bars on
    @music night
    @chtitle
    @fade 0 2
    > 한밤의 거실. 커다란 창에 빗방울이 맺혀 있다.
    ruru: 비 온다. 이삿날 전날인데.
    bori: 하루 아빠가 소파에서 자고 있어. 코 고는 소리 들려?
    nabi: 그래서 조심해야 해. 저 아저씨, 자다가 꼭 냉장고에 가거든.
    toby: 창가 위에 반짝이는 게 있어. …하루가 늘 앉아 있던 자리야.
    @bars off
    @goal 기억 조각 일곱 개를 찾자
    @flag ch4_in
  `,
};

export function windowRoom(): RoomDef {
  return toyRoom('window', MAP, {
    name: '거실 창가',
    theme: 'village',
    start: [3, 14],
    music: 'night',
    beams: [
      { x: 4, w: 5, h: 12, slant: 2 },
      { x: 17, w: 5, h: 12, slant: 2 },
    ],
    ambient: [86, 92, 140],
    things: [
      {
        kind: 'memory',
        id: 'm4a',
        at: [20, 1],
        name: '병원',
        caption: '「천 개 되면 할머니 다 나아」',
        scene: s`
          @room m_hospital
          @show haru haru12 4 8 right holdStar
          @music rain
          > 할머니가 입원한 지 석 달째. 하루, 열두 살.
          @walk haru 7 6 40
          @face haru right
          haru: 할머니! 나 왔어.
          gm: 아이고, 우리 하루 왔니. 학교는 잘 다녀왔고?
          haru: 응! 할머니, 이거 봐. 종이별 구백 개 넘었어.
          gm: 벌써? 우리 하루 손 아프겠다.
          haru: 하나도 안 아파. 천 개 되면 할머니 다 나아. 할머니가 그랬잖아, 천 개 접으면 소원 이루어진다고.
          @wait 0.8
          gm: …그럼. 우리 하루 소원인데, 하늘도 들어줘야지.
          gm: 하루야, 토비 태엽은 잘 감아 주고 있니?
          haru: 매일매일! 할머니가 매일 감으랬잖아.
          gm: 잘했다. 태엽은 천천히 감아야 오래 간단다. 서두르지 말고.
          haru: 할머니, 그 말 백 번도 넘게 했어.
          gm: 그랬나? 허허. 할머니가 나이가 들어서 그렇지.
          > 창밖으로 비가 내렸다. 할머니는 하루가 돌아갈 때까지 내내 웃고 계셨다.
          @pose haru idle
          @emote haru ♥
          @wait 1
        `,
        explore: {
          enter: [2, 9],
          intro: s`
            toby: 여기는… 병원. 하루가 열두 살이던 겨울이야.
            ruru: 다들 멈춰 있어. 하루도, 할머니도, 빗방울도.
            nabi: 기억의 실을 찾자. 실이 모두 이어지면, 이 순간이 흘러갈 거야.
          `,
          threads: [
            { at: [4, 3], text: s`
              > 창에 맺힌 빗방울이 공중에 멈춰 있다.
              toby: 그해 겨울은 비가 자주 왔어. 하루는 우산을 접으면서 늘 웃는 연습을 했어. 병실 문 앞에서.
            ` },
            { at: [12, 6], text: s`
              > 링거 줄. 할머니 손등에 파란 멍이 여러 개.
              nabi: 할머니는 하루가 오는 날이면 소매를 꼭 내려 입으셨어. 이걸 안 보이려고.
            ` },
            { at: [6, 8], text: s`
              > 하루 품에 안긴 유리병. 종이별이 목까지 차 있다.
              bori: 구백 개 넘게… 하루는 학교 쉬는 시간에도 접었어. 손가락에 종이에 벤 자국이 가득했지.
              @emote bori tear
            ` },
          ],
          looks: [
            { at: [4, 7], text: s`
              > 문가에 선 하루. 신이 난 얼굴이다.
              ruru: 저 표정 좀 봐. …저때는 아무것도 몰랐으니까.
            ` },
            { at: [9, 7], text: s`
              > 침대 위의 할머니. 웃고 있다.
              toby: 할머니 웃는 얼굴… 그런데 왜 이렇게 지쳐 보일까.
            ` },
          ],
        },
        after: s`
          bori: 할머니 목소리… 정말 오랜만에 들었어.
          nabi: 할머니가 웃고 있었어. 그런데 눈은… 조금 슬퍼 보였어.
          toby: 할머니는 알고 계셨던 거야. 천 개를 접어도…
          ruru: 그만해, 토비.
        `,
      },
      {
        kind: 'memory',
        id: 'm4b',
        at: [24, 8],
        name: '비 오는 밤의 전화',
        caption: '「할머니가 없어도, 태엽은 꼭 감아 주렴」',
        scene: s`
          @room m_living
          @show haru haru12 14 7 up phone
          @music rain
          > 비가 그치지 않던 밤. 하루가 병원에 전화를 걸었다.
          @sfx phone
          @wait 1
          gm: 여보세요… 하루니?
          haru: 할머니! 나 아직 안 자.
          gm: 이 시간에? 내일 학교 가야지.
          haru: 할머니한테 할 말 있어서.
          @choice call | 보고 싶어요. 빨리 집에 와요. | 별 이제 거의 다 접었어요! | 할머니, 아프지 마요.
          @if call_0
            gm: 할머니도 우리 하루 보고 싶지. 조금만 기다려 주렴.
          @end
          @if call_1
            gm: 벌써? 우리 하루 손이 아주 야무지구나.
          @end
          @if call_2
            gm: …그래. 하루가 그렇게 말해 주니 하나도 안 아프구나.
          @end
          @wait 0.6
          gm: 하루야. 할머니가 부탁 하나만 하자.
          haru: 응.
          gm: 혹시라도 할머니가 없어도, 토비 태엽은 꼭 감아 주렴. 태엽이 멈추면 안 되잖니.
          @emote haru !
          haru: 할머니가 왜 없어? 이상한 소리 하지 마.
          gm: …그래, 그래. 할머니가 괜한 말을 했구나.
          gm: 이제 자렴. 잘 자, 우리 강아지.
          haru: …할머니도 잘 자.
          @pose haru idle
          @sfx thud
          > 수화기를 내려놓은 하루는 한참 동안 빗소리를 들었다.
          @face haru up
          @wait 1.5
        `,
        after: s`
          ruru: 할머니가 부탁했어. 할머니가 없어도 태엽은 꼭 감아 달라고.
          toby: …그 약속, 하루는 지키지 못했어.
          bori: 못 지킨 게 아니야. 지금은 잠깐 잊은 거야.
          nabi: 보리 말이 맞아. 우리가 하루한테 기억나게 해 주면 돼.
        `,
      },
      {
        kind: 'memory',
        id: 'm4c',
        at: [14, 13],
        name: '구백구십구 번째 별',
        caption: '마지막 별은 할머니 앞에서 접으려 했다',
        scene: s`
          @room m_room12
          @show haru haru12 3 5 up
          @music rain
          > 그날 밤도 하루는 책상 앞에서 별을 접었다.
          haru: 구백구십육, 구백구십칠…
          @mini stars
          haru: 구백구십구!
          @emote haru ♪
          haru: 하나만 더 접으면 천 개다. 내일 병원 가서, 할머니 앞에서 마지막 거 접어야지.
          > 하루는 마지막 종이띠 한 장을 남겨 두고 불을 껐다.
          @fade 1 1.2
          @wait 1
          @sfx phone
          @wait 1.2
          @sfx phone
          > 새벽에 전화벨이 울렸다.
          @show mom mom 1 3 down
          @fade 0.4 1
          mom: 하루야… 일어나 봐. 병원에… 가야겠다.
          @emote haru …
          @wait 1.5
          > 하루는 그날, 마지막 별을 접지 못했다.
          @wait 1
        `,
        after: s`
          @emote toby …
          toby: 천 번째 별을… 할머니 앞에서 접고 싶었던 거구나.
          nabi: 그래서 끝내 못 접은 거야. 접으면, 할머니가 없는 게 진짜가 되니까.
          bori: 토비, 그 반쪽 별… 잘 가지고 있지?
          toby: 응. 여기 있어.
        `,
      },
      {
        kind: 'link',
        id: 'l4',
        at: [13, 8],
        name: '빈 유리병 자리',
        icon: 'jar',
        locked: s`toby: 아직 기억 조각이 남아 있어. 창가 위도 살펴보자.`,
        scene: s`
          @bars on
          > 창가에 유리병이 놓여 있던 자리. 동그란 먼지 자국만 남아 있다.
          toby: 하루는 왜 천 개를 접으면 할머니가 나을 거라고 믿었을까.
          nabi: 누가 그렇게 알려 줬겠지. 처음 별 접는 법을 알려 준 사람이.
          bori: 할머니! 할머니가 책상에서 알려 주셨어. 하루가 열 살 때.
          @sfx door
          > 아래층 현관 쪽에서, 바람에 신발장 문이 덜컹 흔들린다.
          ruru: 어? 현관이다. 하루가 열한 살 때 운동회 날… 거기서 할머니가 하루를 기다렸어.
          toby: 책상에 가는 길에 현관부터 들르자. 기억은 거꾸로, 하나씩.
          > 상징물에 깃든 기억이 흐트러져 있다. 조각을 맞춰야 다음 기억으로 이어진다.
          @mini memento6
          @sfx open
          @flag ch4_done
          @sfx memory
          @fade 1 1.4 white
          @next
        `,
      },
      { kind: 'gap', id: 'g4', at: [8, 4], tiles: [[8, 3]] },
      { kind: 'block', id: 'b4', at: [12, 14], look: 'box' },
      {
        kind: 'trigger',
        id: 't4gap',
        rect: [5, 4, 7, 1],
        unless: 'gap_g4',
        scene: s`
          ruru: 창틀 위로 올라가려면 밧줄이 필요하겠는걸. 내가 걸어 줄게. 낭떠러지 앞에 서 봐!
        `,
      },
      {
        kind: 'trigger',
        id: 't4box',
        rect: [9, 13, 3, 2],
        unless: 'mem_m4c',
        scene: s`
          bori: 텔레비전 장 밑에 반짝이는 게 있어. 상자를 밀어 보자. 상자 왼쪽에서!
        `,
      },
      { kind: 'star', id: 's4a', at: [2, 1], text: '창틀 구석의 노란 종이별.' },
      { kind: 'star', id: 's4b', at: [26, 2], text: '커튼 자락에 걸린 종이별.' },
      { kind: 'star', id: 's4c', at: [1, 8], text: '소파 밑에서 굴러 나온 종이별.' },
      { kind: 'star', id: 's4d', at: [19, 14], text: '현관 쪽으로 굴러간 하늘색 종이별.' },
      {
        kind: 'spot',
        id: 'rainwin',
        at: [12, 1],
        scene: s`
          > 유리창을 타고 빗방울이 흘러내린다. 바깥은 깜깜하다.
          toby: 하루는 비 오는 날이면 여기 앉아서 별을 접었어. 병원 쪽 하늘을 보면서.
        `,
      },
      {
        kind: 'spot',
        id: 'tv',
        at: [5, 8],
        scene: s`
          > 꺼진 텔레비전.
          ruru: 하루 아빠는 텔레비전 켜 놓고 맨날 졸아.
          bori: 하루가 다섯 살 때는 아빠 배 위에서 같이 잤대. 둘이 똑같이 코 골면서.
        `,
      },
      {
        kind: 'spot',
        id: 'phone4',
        at: [22, 8],
        scene: s`
          > 전화기. 수화기에 작은 스티커가 붙어 있다. 「1번 할머니 ♥」.
          nabi: 단축번호 1번. 하루가 직접 붙인 거야.
        `,
      },
      {
        kind: 'spot',
        id: 'crumbs',
        at: [17, 11],
        scene: s`
          > 소파 밑에 과자 부스러기.
          bori: …냠.
          ruru: 방금 먹었지?
          bori: 아니, 안 먹었어. 냄새만 맡았어.
        `,
      },
      {
        kind: 'spot',
        id: 'umbrella4',
        at: [25, 13],
        scene: s`
          > 우산꽂이에 꽂힌 작은 노란 우산. 손잡이에 「하루」.
          nabi: 할머니가 사 준 우산이야. 하루 다섯 살 때.
          toby: 다섯 살… 비 오는 날.
        `,
      },
      {
        kind: 'spot',
        id: 'family',
        at: [1, 13],
        scene: s`
          > 벽에 걸린 가족사진. 아빠, 엄마, 하루, 그리고 할머니.
          ruru: 할머니만 한복 입었네.
          bori: 그날 할머니 생신이었어. 하루가 케이크에 초를 꽂았지.
        `,
      },
    ],
  });
}
