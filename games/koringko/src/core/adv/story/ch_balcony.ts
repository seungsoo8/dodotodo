/** 베란다 (6살, 하루 꽃) */
import { s } from '../parse.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { grid, toyRoom } from './kit.ts';

const MAP = grid(30, 18, 'w', 'B', [
  ['B', 6, 3, 2, 3],
  ['B', 12, 2, 1, 5],
  ['B', 14, 1, 1, 8],
  ['v', 1, 8, 13, 1],
  ['B', 18, 9, 1, 8],
  ['B', 18, 9, 11, 1],
  ['w', 18, 12, 1, 1],
  ['T', 24, 4, 1, 1],
  ['o', 9, 13, 1, 1],
]);

export const CH_BALCONY: Chapter = {
  n: 0,
  title: '0장 · 베란다',
  sub: '6살, 하루 꽃',
  room: 'balcony',
  start: [10, 15],
  party: ['toby', 'bori', 'ruru', 'nabi'],
  wind: 0.28,
  intro: s`
    @fade 1 0 white
    @bars on
    @music night
    @chtitle
    @fade 0 2
    > 베란다. 화분들 사이로 밤바람이 분다. 하늘엔 별이 가득하다.
    @sfx wind
    bori: 별 많다…
    nabi: 저기 제일 반짝이는 거. 「하루 별」이야.
    ruru: 그럼 그 옆 작은 건 「할머니 별」?
    nabi: 응. 아직 거기 있네.
    @emote toby …
    toby: …할머니. 우리 지금 하루 마음 찾으러 가는 중이에요.
    @bars off
    @goal 기억 조각 일곱 개를 찾자
  `,
};

export function balconyRoom(): RoomDef {
  return toyRoom('balcony', MAP, {
    name: '베란다',
    theme: 'village',
    start: [10, 15],
    music: 'night',
    ambient: [96, 104, 156],
    beams: [{ x: 3, w: 8, h: 18, slant: 3 }, { x: 19, w: 6, h: 18, slant: 3 }],
    things: [
      {
        kind: 'memory',
        id: 'mVa',
        at: [3, 3],
        name: '하루 꽃',
        caption: '「꽃은 매일 물을 줘야 피어. 태엽처럼」',
        scene: s`
          @room m_balcony
          @show gm grandma 7 5 down
          @show haru haru6 9 5 down
          @item pot pot 8 6
          @music box
          @sfx birds
          > 하루, 여섯 살. 할머니와 화분에 씨앗을 심었다.
          @pose gm kneel
          @pose haru kneel
          gm: 손가락으로 콕 구멍을 내고… 씨앗을 하나 쏙.
          haru: 쏙!
          gm: 흙 이불 덮어 주고. 물 조금.
          @sfx pour
          haru: 언제 펴?
          gm: 매일 물 주면 한 달쯤? 꽃은 매일 물을 줘야 핀단다. 태엽처럼.
          haru: 토비처럼!
          gm: 그래. 이 꽃 이름은 뭐라고 할까?
          haru: 하루 꽃! 내가 심었으니까!
          gm: 하루 꽃. 그럼 하루가 매일 물 줘야 한다?
          haru: 응! 매일매일!
          @pose gm idle
          @pose haru idle
          @take haru pot
          > 하루는 화분을 두 손으로 받쳐 들고, 해가 제일 잘 드는 창가로 옮겼다.
          @walk haru 7 4 30
          @face haru left
          @put haru pot 6 4
          @emote haru ♪
          @wait 1.5
        `,
        after: s`
          nabi: 마당 꽃밭에 「하루 꽃」 이름표 있었잖아. 그 꽃이야.
          toby: 하루가 매일 물을 줬을까?
          bori: 처음엔. 나중엔 할머니가 몰래 줬대.
          ruru: 그래도 이름은 하루 꽃이네.
        `,
      },
      {
        kind: 'memory',
        id: 'mVb',
        at: [9, 2],
        name: '까치야 까치야',
        caption: '첫 이를 지붕 위로',
        scene: s`
          @room m_balcony
          @show gm grandma 8 5 down
          @show haru haru6 6 6 right
          @music waltz
          @sfx birds
          > 하루의 첫 앞니가 빠진 날.
          haru: 할머니, 이 빠졌어! 피 나!
          gm: 아이고, 장하다. 이제 형님 되겠네.
          haru: 이거 어떻게 해?
          gm: 지붕 위로 던지면서 이렇게 말하는 거야. "까치야 까치야, 헌 이 줄게 새 이 다오."
          haru: 진짜 까치가 줘?
          gm: 그럼. 한 번 해 보렴. 저기 난간으로 가서.
          @flag tooth_go
          @control haru
          @goal 난간으로 가서 이를 던지자
        `,
        after: s`
          ruru: 하루 이 빠진 거 기억나! 한동안 발음이 샜잖아. "토비"를 "또비"라고.
          toby: 또비…
          bori: 귀여웠어.
          toby: …그때 나 기분 좋았어. 이름이 특별해진 것 같아서.
        `,
      },
      {
        kind: 'memory',
        id: 'mVc',
        at: [24, 15],
        name: '졸업 꽃다발',
        caption: '「시간이 태엽보다 빠르구나」',
        scene: s`
          @room m_living8
          @show gm grandma 6 6 right
          @carry gm flowers
          @music waltz
          > 유치원 졸업식 날. 하루가 졸업 모자를 쓰고 뛰어 들어왔다.
          @show haru haru6 16 5 left
          @sfx steps
          @walk haru 7 6 70
          @face haru gm
          haru: 할머니! 나 졸업했어! 이제 초등학생이다!
          gm: 아이고, 축하한다. 할머니가 꽃 사 왔지.
          @give gm haru flowers
          @sfx paper
          haru: 우와! 노란 꽃!
          gm: 엊그제 아장아장 걷던 것 같은데… 벌써.
          haru: 할머니, 시간이 빨라?
          gm: 그래. 시간이 태엽보다 빠르구나. 감을 새도 없이 풀려 버려.
          haru: 그럼 할머니가 감으면 되잖아. 천천히 가게.
          gm: …허허. 그럴 수 있으면 좋겠다.
          @wait 1.5
        `,
        after: s`
          nabi: 시간 태엽은 아무도 못 감아.
          toby: 그래서 할머니가 우리 태엽을 그렇게 열심히 감았나 봐. 감을 수 있는 건 감고 싶어서.
          bori: 그럼 우리는 하루 태엽을 감자. 우리가 할 수 있는 거니까.
        `,
      },
      {
        kind: 'memory',
        id: 'mVd',
        at: [27, 11],
        name: '서른 번째',
        caption: '루루가 온 날: 「여우는 루루야」',
        scene: s`
          @room m_living
          @show haru haru6 9 7 up
          @show dad dad 12 5 left
          @carry dad fox ruru
          @music waltz
          > 놀이공원에서 돌아온 저녁. 아빠가 여우 인형을 높이 들었다.
          dad: 짜잔! 아빠가 뽑았다!
          @emote haru !
          haru: 여우다! 아까 그 여우! 아빠 몇 번 했어?
          dad: …서른 번.
          haru: 서른 번!
          @sfx laugh
          @show mom mom 1 3 down
          mom: 그 돈이면 여우 인형 세 개는…
          @sfx sigh
          dad: 여보, 그 여우가 아니면 안 된다잖아.
          @walk dad 10 7
          @face dad haru
          @face haru dad
          @give dad haru ruru
          @sfx hug
          haru: 이름 지어 줄래! 여우는… 루루! 루루야!
          @show gm grandma 4 6 right
          gm: 루루? 꼬리가 조금 뜯어졌구나. 할머니가 꿰매 주마.
          haru: 할머니가 고쳐 주면 루루 새것 돼!
          @wait 1.5
        `,
        after: s`
          @emote ruru …
          ruru: 내 꼬리… 할머니가 처음 꿰매 준 날이야.
          nabi: 그때부터 너는 덤이 아니었어.
          ruru: 알아. 이제 알아.
          @emote ruru ♥
          ruru: …다들 이쪽 보지 마.
        `,
      },
      {
        kind: 'memory',
        id: 'mVe',
        at: [21, 15],
        name: '해진 이불',
        caption: '등불 고양이가 태어난 밤',
        scene: s`
          @room m_gm
          @show haru haru6 9 6 down
          @show gm grandma 3 4 up sit
          @music box
          > 하루가 해진 아기 이불을 끌어안고 울고 있었다.
          @pose haru cry
          @sfx sob
          haru: 엄마가 버린대. 구멍 났다고. 싫어!
          gm: 그 이불 없으면 못 자?
          haru: 이 냄새 없으면 못 자!
          @wait 1
          gm: 그럼 할머니가 이 이불로 뭘 만들어 줄까? 늘 같이 잘 수 있게.
          haru: 뭘로?
          gm: 음… 고양이? 밤에 무서울 때 등불을 들고 지켜 주는 고양이.
          @emote haru !
          @pose haru idle
          haru: 등불 고양이!
          @face gm up
          @sfx sewing
          > 할머니의 재봉틀이 밤새 드르륵 돌았다. 아침에 하루 베개 옆엔, 이불 냄새가 나는 고양이가 앉아 있었다.
          @wait 1.5
        `,
        explore: {
          enter: [9, 9],
          intro: s`
            toby: 할머니 방이야. 하루가 여섯 살 때.
            nabi: …여기 알아. 내가 아직 없을 때야.
            ruru: 실부터 찾자. 실이 다 이어지면 이 순간이 흘러가.
          `,
          threads: [
            { at: [2, 4], text: s`
              > 재봉틀 바늘 아래 끼워 둔 천 조각. 하늘색 아기 이불의 한 귀퉁이.
              bori: 할머니가 벌써 실을 꿰어 두셨어. 하루한테 묻기도 전에.
              nabi: …물어보기 전부터 정해 두셨던 거야.
            ` },
            { at: [7, 8], text: s`
              > 탁자 위 반짇고리. 까만 단추 두 개가 나란히 골라져 있다.
              nabi: 내 눈이야. 할머니는 반짇고리를 다 뒤져서 제일 반짝이는 걸로 고르셨어.
              ruru: 그래서 그렇게 새침하게 반짝이는구나.
            ` },
            { at: [10, 6], text: s`
              > 하루 품의 아기 이불. 구멍 난 자리로 솜이 비죽 나와 있다.
              toby: 하루는 저 구멍에 손가락을 넣고 잤어. 그래야 잠이 왔대.
            ` },
          ],
          looks: [
            { at: [3, 5], text: s`
              > 재봉틀 앞의 할머니. 돋보기를 코끝에 걸치고 하루 쪽을 돌아본다.
              bori: 할머니 눈이 웃고 있어. 벌써 다 생각해 두신 얼굴이야.
            ` },
            { at: [9, 7], text: s`
              > 이불을 끌어안은 하루. 울어서 코끝이 빨갛다.
              @emote nabi …
              nabi: 울지 마, 하루. …곧 내가 갈게.
            ` },
          ],
        },
        after: s`
          @emote nabi …
          nabi: …나, 그날 아침 기억나. 처음 눈을 떴을 때 하루가 날 꼭 안고 있었어.
          nabi: 하루한테서 내 냄새가 났어. 아니, 나한테서 하루 냄새가 났지.
          ruru: 나비가 처음으로 솔직해졌다.
          nabi: …오늘만이야.
        `,
      },
      {
        kind: 'memory',
        id: 'mVf',
        at: [2, 15],
        name: '한복 입은 날',
        caption: '할머니 생신, 거실 벽의 가족사진',
        scene: s`
          @room m_kitchen_d
          @show gm grandma 8 4 down
          @show haru haru6 7 7 up
          @show mom mom 5 6 right
          @show dad dad 12 6 left
          @music waltz
          > 할머니 생신. 할머니는 고운 한복을 입었다.
          haru: 할머니 공주님 같아!
          gm: 공주님은 무슨. 할머니 공주님이지.
          @sfx laugh
          dad: 자, 다 같이 사진 찍자! 하루, 할머니 옆으로!
          @walk haru 9 5 40
          @face haru down
          @pose gm hug
          dad: 하나, 둘—
          @sfx camera
          @fade 1 0.15 white
          @fade 0 0.6
          > 거실 벽에 걸린 그 가족사진은, 이날 찍은 것이었다.
          @wait 1.5
        `,
        explore: {
          enter: [14, 9],
          intro: s`
            bori: 부엌이다! 맛있는 냄새가… 아, 냄새도 멈춰 있네.
            toby: 할머니 생신날이야. 하루 여섯 살. 다 같이 있던 날.
          `,
          threads: [
            { at: [15, 3], text: s`
              > 달력에 빨간 동그라미. 「엄마 생신」— 엄마 글씨. 옆에는 하루가 크레용으로 그린 케이크.
              bori: 케이크 그림이 진짜보다 맛있어 보여.
              ruru: 초가 서른 개쯤 꽂혀 있는데. 할머니가 서른 살이야?
            ` },
            { at: [10, 4], text: s`
              > 식탁 위 미역국 냄비. 김이 공중에서 멈춰 있다.
              nabi: 엄마가 새벽부터 끓였어. 할머니는 한 숟갈 뜨시고, 엄마 얼굴을 한참 보셨지.
              toby: 「우리 은주 다 컸네」. …엄마는 그 말에 베란다로 숨었어.
            ` },
            { at: [4, 6], text: s`
              > 엄마 손의 작은 선물 상자. 리본이 비뚤비뚤 반쯤 묶였다.
              ruru: 포장은 엄마 담당, 리본은 하루 담당. 그래서 리본이 저 모양이야.
            ` },
          ],
          looks: [
            { at: [8, 3], text: s`
              > 고운 한복의 할머니. 옷고름을 매만지던 손이 멈춰 있다.
              toby: 할머니가 한복을 입는 건 일 년에 딱 한 번이었어.
            ` },
            { at: [13, 6], text: s`
              > 카메라를 든 아빠. 한쪽 눈을 감고, 입까지 같이 찡그렸다.
              ruru: 아빠는 사진 찍을 때 얼굴이 제일 웃겨. 정작 사진엔 안 나오지만.
            ` },
          ],
        },
        after: s`
          bori: 거실 그 사진! 할머니만 한복 입은!
          toby: 다들 웃고 있었어. 하루는 눈 감고 웃었고.
          ruru: 셔터 누를 때 꼭 눈 감더라, 하루.
        `,
      },
      {
        kind: 'link',
        id: 'lV',
        at: [15, 12],
        name: '빨간 실 한 가닥',
        icon: 'needle',
        locked: s`toby: 아직 기억 조각이 남아 있어. 화분 너머도 살펴보자.`,
        scene: s`
          @bars on
          > 빨래 건조대 아래, 빨간 실 한 가닥이 거실 쪽으로 길게 이어져 있다.
          @emote ruru !
          ruru: 저 실… 할머니가 내 꼬리 꿰맨 실이야.
          bori: 거실 소파 밑으로 들어가는데?
          ruru: 거, 거긴 아무것도 없어! 그냥 먼지야, 먼지!
          nabi: 수상해.
          toby: 루루. 이번엔 네 기억 차례인가 봐.
          @emote ruru sweat
          ruru: …흥. 따라오든가.
          > 상징물에 깃든 기억이 흐트러져 있다. 조각을 맞춰야 다음 기억으로 이어진다.
          @mini memento13
          @sfx open
          @flag chv_done
          @sfx memory
          @fade 1 1.4 white
          @next
        `,
      },
      { kind: 'gap', id: 'gV', at: [9, 9], tiles: [[9, 8]] },
      { kind: 'block', id: 'bV', at: [18, 12], look: 'pot' },
      {
        kind: 'trigger',
        id: 'tVgap',
        rect: [6, 9, 7, 2],
        unless: 'gap_gV',
        scene: s`ruru: 화분 선반 위로 올라가자. 틈에 밧줄 건다!`,
      },
      {
        kind: 'trigger',
        id: 'tVpot',
        rect: [15, 11, 3, 3],
        unless: 'mem_mVd',
        scene: s`bori: 화분이 구석을 막고 있어. 화분 왼쪽에서 밀게!`,
      },
      { kind: 'star', id: 'sVa', at: [1, 1], text: '화분 흙 위에 꽂힌 종이별.' },
      { kind: 'star', id: 'sVb', at: [28, 1], text: '난간에 걸린 종이별.' },
      { kind: 'star', id: 'sVc', at: [28, 16], text: '화분 뒤 구석의 종이별.' },
      { kind: 'star', id: 'sVd', at: [13, 16], text: '빨래집게에 집힌 종이별.' },
      {
        kind: 'spot',
        id: 'watercan',
        at: [5, 13],
        scene: s`
          > 작은 노란 물뿌리개.
          toby: 하루가 「하루 꽃」 물 주던 물뿌리개야.
          bori: 할머니도 몰래 쓰던 거.
        `,
      },
      {
        kind: 'spot',
        id: 'laundry',
        at: [14, 16],
        scene: s`
          > 빨래 건조대. 빨래집게 하나에 토끼 귀 모양 자국이 남아 있다.
          toby: …이 집게야. 다섯 살 그날 밤, 할머니가 이걸로 내 귀를 집어서 하루 방 빨랫줄에 널었어.
          ruru: 귀 자국 남았네. 영광의 상처다.
        `,
      },
      {
        kind: 'spot',
        id: 'starview',
        at: [21, 3],
        scene: s`
          > 난간 사이로 밤하늘이 보인다. 반짝이는 별 하나, 그 옆 작은 별 하나.
          nabi: 「하루 별」, 「할머니 별」.
          toby: 할머니. 반짝 해 주세요. …보고 계시면.
          > 작은 별이, 반짝 하고 빛난 것 같았다.
          @sfx sparkle
        `,
      },
      {
        kind: 'spot',
        id: 'chair6',
        at: [26, 6],
        scene: s`
          > 접이식 의자 하나. 할머니가 해 질 녘마다 앉아 있던 자리.
          bori: 할머니는 여기 앉아서 하루 하교하는 걸 내려다보셨어.
          nabi: 손 흔들면 하루가 위를 보고 같이 흔들었지.
        `,
      },
    ],
  });
}
