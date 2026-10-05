/**
 * 13장 · 베란다 (6살, 하루 꽃) — 사람 크기 베란다 (houseMap, layout_d.ts), 04:20 바람 부는 밤.
 *
 * 놀이 (REDESIGN §7 13장):
 *  1. 바람 타이밍 — 열린 창 앞 두 칸 줄은 4초마다 바람이 불어 거실 쪽으로 밀려난다. 빨래 그늘에서 쉬었다가 멎은 틈에 건넌다.
 *     빨래집게 자매 「집순이 · 집돌이」가 건조대에서 「꽉 잡아!」.
 *  2. 물뿌리개 배달 — 수도꼭지 옆 물뿌리개는 무겁다(보리를 불러 와야 든다, 들면 느려진다). 바람 두 줄을 건너 하루 꽃에 물을 주면
 *     꽃이 고개를 들고 할머니가 꽂아 둔 「하루 꽃」 이름표(mVa)가 드러난다.
 *  3. 세탁기 위 비닐봉지 — 루루가 밧줄로 끌어내린다 (mVd). 이 던지기(mVb 기억 속)는 지금 것 그대로.
 */
import { s } from '../parse.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { BALCONY_SHELTER1, BALCONY_SHELTER2, BALCONY_WIND1, BALCONY_WIND2, HARU_FLOWER, HARU_FLOWER_WATER, balconySpec } from './layout_d.ts';
import { houseMap } from './kit.ts';

export const CH_BALCONY: Chapter = {
  n: 0,
  title: '0장 · 베란다',
  sub: '6살, 하루 꽃',
  room: 'balcony',
  start: [4, 8],
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
    @act bori lookAround nowait
    bori: 별 많다…
    @act nabi point nowait
    nabi: 저기 제일 반짝이는 거. 「하루 별」이야.
    ruru: 그럼 그 옆 작은 건 「할머니 별」?
    nabi: 응. 아직 거기 있네.
    @emote toby …
    toby: …할머니. 우리 지금 하루 마음 찾으러 가는 중이에요.
    @cam 31 5 1.2
    @wait 1
    > 베란다 맨 끝, 화분 하나가 고개를 푹 숙이고 있다.
    @cam off
    @bars off
    @goal 말라 가는 하루 꽃에 물을 주자 · 열린 창 앞 바람을 건너자
  `,
};

/** 바람이 불 때 (빨래 펄럭임 · 화분 잎 · 전깃줄) */
const WIND_PERIOD = 4;
const WIND_GUST = 1.6;

export function balconyRoom(): RoomDef {
  const r = houseMap({
    ...balconySpec(),
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
          @act haru giggle nowait
          haru: 쏙!
          gm: 흙 이불 덮어 주고. 물 조금.
          @sfx pour
          @act haru think nowait
          haru: 언제 펴?
          gm: 매일 물 주면 한 달쯤? 꽃은 매일 물을 줘야 핀단다. 태엽처럼.
          @act haru jump nowait
          haru: 토비처럼!
          gm: 그래. 이 꽃 이름은 뭐라고 할까?
          @act haru cheer nowait
          haru: 하루 꽃! 내가 심었으니까!
          gm: 하루 꽃. 그럼 하루가 매일 물 줘야 한다?
          @act haru nod nowait
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
          @act haru jump nowait
          haru: 할머니, 이 빠졌어! 피 나!
          @act gm clap nowait
          gm: 아이고, 장하다. 이제 형님 되겠네.
          haru: 이거 어떻게 해?
          gm: 지붕 위로 던지면서 이렇게 말하는 거야. "까치야 까치야, 헌 이 줄게 새 이 다오."
          @act haru think nowait
          haru: 진짜 까치가 줘?
          @act gm point nowait
          gm: 그럼. 한 번 해 보렴. 저기 난간으로 가서.
          @flag tooth_go
          @control haru
          @goal 난간으로 가서 이를 던지자
        `,
        after: s`
          @act ruru laugh nowait
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
          @act haru jump nowait
          haru: 할머니! 나 졸업했어! 이제 초등학생이다!
          gm: 아이고, 축하한다. 할머니가 꽃 사 왔지.
          @give gm haru flowers
          @sfx paper
          @act haru spin nowait
          haru: 우와! 노란 꽃!
          @act gm sigh nowait
          gm: 엊그제 아장아장 걷던 것 같은데… 벌써.
          haru: 할머니, 시간이 빨라?
          gm: 그래. 시간이 태엽보다 빠르구나. 감을 새도 없이 풀려 버려.
          @act haru shrug nowait
          haru: 그럼 할머니가 감으면 되잖아. 천천히 가게.
          @act gm pat
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
          @act dad cheer nowait
          dad: 짜잔! 아빠가 뽑았다!
          @emote haru !
          haru: 여우다! 아까 그 여우! 아빠 몇 번 했어?
          @act dad shrug nowait
          dad: …서른 번.
          @act haru jump nowait
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
          @act haru think
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
          @act ruru stomp nowait
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
          @act haru stomp nowait
          haru: 이 냄새 없으면 못 자!
          @wait 1
          gm: 그럼 할머니가 이 이불로 뭘 만들어 줄까? 늘 같이 잘 수 있게.
          haru: 뭘로?
          @act gm think
          gm: 음… 고양이? 밤에 무서울 때 등불을 들고 지켜 주는 고양이.
          @emote haru !
          @pose haru idle
          haru: 등불 고양이!
          @act haru jump nowait
          @face gm up
          @pose gm sew
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
          @act ruru giggle nowait
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
          @act haru clap nowait
          haru: 할머니 공주님 같아!
          gm: 공주님은 무슨. 할머니 공주님이지.
          @sfx laugh
          @act dad point nowait
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
          @act ruru giggle nowait
          ruru: 셔터 누를 때 꼭 눈 감더라, 하루.
        `,
      },
      {
        kind: 'link',
        id: 'lV',
        at: [22, 7],
        name: '빨간 실 한 가닥',
        icon: 'needle',
        locked: s`toby: 아직 기억 조각이 남아 있어. 화분 너머도 살펴보자.`,
        scene: s`
          @bars on
          > 빨래 건조대 아래, 빨간 실 한 가닥이 거실 쪽으로 길게 이어져 있다.
          @emote ruru !
          ruru: 저 실… 할머니가 내 꼬리 꿰맨 실이야.
          bori: 거실 소파 밑으로 들어가는데?
          @act ruru shake nowait
          ruru: 거, 거긴 아무것도 없어! 그냥 먼지야, 먼지!
          nabi: 수상해.
          toby: 루루. 이번엔 네 기억 차례인가 봐.
          @emote ruru sweat
          ruru: …흥. 따라오든가.
          > 상징물에 깃든 기억이 흐트러져 있다. 조각을 맞춰야 다음 기억으로 이어진다.
          @mini flip4
          @sfx open
          @flag chv_done
          @sfx memory
          @fade 1 1.4 white
          @next
        `,
      },
      // ── 주민: 빨래 건조대의 빨래집게 자매
      {
        kind: 'npc',
        id: 'pins',
        at: [21, 4],
        actor: 'clothespins',
        dir: 'down',
        scene: s`
          @if flower_watered
            pins: 고개 들었지? 하루 꽃! 우리가 다 봤어!
            pins: 바람이 세도 꽃은 안 날아가. 뿌리가 꽉 잡고 있으니까.
          @else
            @if met_pins
              pins: 바람 오기 전에 빨래가 먼저 펄럭여. 그거 보면 숨어!
              pins: 수건 밑, 빨래 밑. 거기선 우리가 꽉 잡아 줄게!
            @else
              @sfx wind
              pins: 꽉 잡아! 꽉 잡아! …어머, 장난감이네?
              pins: 우린 집순이, 집돌이. 이 건조대에서 삼 년째 빨래 잡는 중이야.
              @act toby bow nowait
              toby: 하루 꽃한테 물을 주러 가요. 바람이 너무 세서…
              pins: 창이 열려서 그래. 내일 이사라고 다 열어 두고 잤거든.
              pins: 바람은 네 번 세면 한 번 와. 빨래가 펄럭이면 곧 온다는 뜻이야. 그때 빨래 밑으로 쏙!
              pins: 물뿌리개는 수도꼭지 옆에 있어. 근데 무거워. 곰 친구한테 들어 달라고 해.
              @flag met_pins
            @end
          @end
        `,
      },
      // ── 놀이 1 · 바람 길 앞: 처음 밀려나면 자매가 외친다
      {
        kind: 'trigger',
        id: 'tVwind',
        rect: [BALCONY_WIND1[0] - 1, 3, 1, 9],
        unless: 'met_pins',
        scene: s`
          @sfx wind
          > 열린 창으로 밤바람이 쏟아져 들어온다. 빨래가 거세게 펄럭인다.
          @act ruru shiver nowait
          ruru: 으아, 꼬리 날아가겠다!
          nabi: 바람이 불 때 말고, 멎을 때 건너. 빨래가 먼저 알려 줘.
          @goal 말라 가는 하루 꽃에 물을 주자 · 바람이 멎은 틈에 건너자 (빨래 그늘에서 쉬기)
        `,
      },
      // ── 하루 꽃 앞에 처음 오면: 물뿌리개를 찾자
      {
        kind: 'trigger',
        id: 'tVflower',
        rect: [28, 4, 5, 8],
        unless: 'seen_flower',
        scene: s`
            > 「하루 꽃」 화분. 잎이 바싹 말라 흙 쪽으로 늘어져 있다.
            @emote toby …
            toby: 하루 꽃이야. 하루가 매일 물 주기로 했던.
            bori: 흙이 갈라졌어. 며칠째 아무도 안 줬나 봐.
            nabi: 이삿짐 싸느라. 다들 바빴으니까.
            toby: 우리가 주자. 물뿌리개는 수도꼭지 옆에 있었어.
            @goal 말라 가는 하루 꽃에 물을 주자 · 수도꼭지 옆 물뿌리개를 가져오자 (보리와 함께)
            @flag seen_flower
        `,
      },
      // ── 놀이 2 · 물뿌리개 배달 (무거움: 보리를 불러 와야 든다)
      { kind: 'part', id: 'wcan', at: [13, 4], look: 'watercan', set: 'water', heavy: true },
      {
        kind: 'assemble',
        id: 'flowerAsm',
        at: HARU_FLOWER_WATER,
        set: 'water',
        flag: 'flower_watered',
        scene: s`
          @bars on
          @sfx pour
          > 보리가 물뿌리개를 기울이고, 토비가 꼭지를 받친다. 말라 갈라진 흙에 물이 스며든다.
          bori: 천천히… 천천히.
          @wait 0.8
          @prop haruFlower up
          @sfx sparkle
          > 늘어졌던 잎 하나가, 아주 조금 고개를 들었다.
          @emote toby ♪
          @act ruru cheer nowait
          ruru: 들었다! 고개 들었어!
          nabi: 할머니가 꽂아 둔 이름표도 아직 있네. 「하루 꽃」.
          toby: 하루가 심었으니까, 하루 꽃.
          @bars off
          @goal 하루 꽃이 고개를 들었다 · 빨래 건조대 아래 빨간 실을 따라가자
        `,
      },
      // ── 놀이 3 · 세탁기 위 놀이공원 비닐봉지: 루루가 밧줄로
      {
        kind: 'pull',
        id: 'bagPull',
        at: [9, 4],
        need: ['ruru'],
        flag: 'bag_down',
        scene: s`
          @sfx rope
          > 루루의 밧줄이 세탁기 위 비닐봉지 손잡이에 걸린다. 휙— 봉지가 사르르 내려앉는다.
          @act ruru jump nowait
          ruru: 이거… 놀이공원 봉지잖아. 여우 그림.
          @emote ruru …
          ruru: 내가 담겨 왔던 봉지야.
        `,
      },
      {
        kind: 'spot',
        id: 'washerTop',
        at: [11, 4],
        unless: 'bag_down',
        scene: s`
          > 세탁기 위에 비닐봉지 하나가 접혀 얹혀 있다. 토비 키로는 손이 안 닿는다.
          @if with_ruru
            ruru: 저 손잡이에 밧줄 걸면 되겠다. 세탁기 앞에서 당겨 볼게.
          @else
            toby: 높아. 루루 밧줄이면 닿을 텐데.
          @end
        `,
      },
      { kind: 'star', id: 'sVa', at: [32, 7], text: '화분 흙 위에 꽂힌 종이별.' },
      { kind: 'star', id: 'sVb', at: [19, 8], text: '난간 아래로 떨어진 종이별.' },
      { kind: 'star', id: 'sVc', at: [32, 11], text: '화분 뒤 구석의 종이별.' },
      { kind: 'star', id: 'sVd', at: [23, 5], text: '빨래집게에 집힌 종이별.' },
      {
        kind: 'spot',
        id: 'watercan',
        at: [12, 4],
        unless: 'got_wcan',
        scene: s`
          > 수도꼭지 옆의 작은 노란 물뿌리개. 물이 반쯤 차 있다.
          toby: 하루가 「하루 꽃」 물 주던 물뿌리개야.
          bori: 할머니도 몰래 쓰던 거.
        `,
      },
      {
        kind: 'spot',
        id: 'laundry',
        at: [21, 8],
        scene: s`
          > 빨래 건조대. 빨래집게 하나에 토끼 귀 모양 자국이 남아 있다.
          toby: …이 집게야. 다섯 살 그날 밤, 할머니가 이걸로 내 귀를 집어서 하루 방 빨랫줄에 널었어.
          ruru: 귀 자국 남았네. 영광의 상처다.
        `,
      },
      {
        kind: 'spot',
        id: 'starview',
        at: [29, 4],
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
        at: [31, 9],
        scene: s`
          > 접이식 의자 하나. 할머니가 해 질 녘마다 앉아 있던 자리.
          bori: 할머니는 여기 앉아서 하루 하교하는 걸 내려다보셨어.
          nabi: 손 흔들면 하루가 위를 보고 같이 흔들었지.
        `,
      },
      {
        kind: 'spot',
        id: 'clockV',
        at: [5, 3],
        scene: s`
          > 거실 괘종시계. 추가 똑, 딱. 네 시 이십 분을 지나고 있다.
          nabi: 시계는 이사 가도 같이 가. 할머니가 결혼할 때 가져온 거래.
          toby: 이 시계도 태엽이야. 아빠가 매주 일요일에 감았어.
        `,
      },
    ],
  });
  return {
    ...r,
    toys: true,
    amb: [
      { name: 'wind', gain: 0.5 },
      { name: 'traffic', gain: 0.12 },
      { name: 'crickets', gain: 0.25, every: [5, 11] },
    ],
    winds: [
      { id: 'gust1', rect: BALCONY_WIND1, dir: 'left', period: WIND_PERIOD, gust: WIND_GUST, shelter: BALCONY_SHELTER1 },
      { id: 'gust2', rect: BALCONY_WIND2, dir: 'left', period: WIND_PERIOD, gust: WIND_GUST, phase: 2, shelter: BALCONY_SHELTER2 },
    ],
    keepProps: [{ key: `haruFlower@${HARU_FLOWER[0]},${HARU_FLOWER[1]}`, flag: 'flower_watered', state: 'up' }],
    hangouts: {
      bori: { at: [3, 6], pose: 'chinRest', dir: 'right', talk: s`
        @act bori lookAround nowait
        bori: 거실에서 바람 소리 들으니까 좋다. 상자 냄새도 나고.
        bori: 무거운 거 들 일 있으면 불러. 물뿌리개라든가.
      ` },
      ruru: { at: [10, 6], dir: 'up', talk: s`
        @act ruru peek nowait
        ruru: 세탁기 위에 뭐가 있어. 비닐봉지 같은데… 낯이 익어.
        ruru: 높은 데 걸 거 있으면 불러. 밧줄은 나밖에 없잖아.
      ` },
      nabi: { at: [12, 8], pose: 'sleepSit', dir: 'right', talk: s`
        @act nabi stretch nowait
        nabi: 바람이 털을 거꾸로 쓸어. …그래도 별은 잘 보여.
        nabi: 어두운 데 갈 거면 불러. 여기선 별빛으로 충분하지만.
      ` },
    },
  };
}
