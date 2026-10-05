/** 현관 (11살, 놓지 않았다는 거짓말) */
import { s } from '../parse.ts';
import type { ChainStep, Chapter, RoomDef } from '../types.ts';
import { houseMap } from './kit.ts';
import { entranceHouse } from './layout_c.ts';


export const CH_ENTRANCE: Chapter = {
  n: 0,
  title: '0장 · 현관',
  sub: '11살, 놓지 않았다는 거짓말',
  room: 'entrance',
  start: [3, 5],
  party: ['toby', 'bori', 'ruru', 'nabi'],
  wind: 0.55,
  intro: s`
    @fade 1 0 white
    @bars on
    @music night
    @chtitle
    @fade 0 2
    > 밤 열두 시 오십오 분. 현관 앞 마루. 한 단 아래 현관에는 이삿짐 상자 사이로 신발들이 이리저리 흩어져 있다.
    > 신발장 맨 위 칸, 꽃무늬 고무신 한 켤레. 아무도 신지 않는 자리.
    ruru: 신발 냄새…
    nabi: 여긴 하루가 매일 아침 "다녀오겠습니다" 하던 곳이야.
    bori: 그리고 할머니가 매일 "차 조심하고" 하던 곳.
    @emote toby …
    @wait 1
    toby: 할머니는 그 인사를 몇 번이나 들었을까.
    @act ruru stomp nowait
    ruru: 토비, 무거운 얘기 금지. 운동회 날도 있다며. 신나는 거 먼저 보러 가자.
    @bars off
    @goal 센서등에 들키지 말고, 신발장 맨 아래 칸의 털신에 닿자
    @flag che_in
  `,
};

export function entranceRoom(): RoomDef {
  const r = houseMap({
    ...entranceHouse(),
    things: [
      {
        kind: 'memory',
        id: 'mEa',
        at: [9, 14],
        name: '놓지 마',
        caption: '「안 놨어」 — 할머니의 착한 거짓말',
        scene: s`
          @room m_yard_d
          @show haru haru11 4 6 right
          @show gm grandma 3 6 right
          @music grandma
          @sfx birds
          > 하루, 열한 살. 보조 바퀴를 뗀 자전거.
          haru: 할머니! 절대 놓으면 안 돼! 알았지?
          @act gm nod nowait
          gm: 그래, 그래. 꽉 잡고 있으마.
          @sfx bike
          @walk haru 9 6 40 nowait
          @walk gm 8 6 40
          haru: 놓지 마! 놓지 마!
          gm: 안 놨어. 계속 잡고 있어.
          @walk haru 17 6 60 nowait
          @wait 0.3
          > 할머니의 손이, 살며시 떨어졌다.
          @wait 1.4
          @sfx bike
          haru: 할머니, 나 잘 타지? 할머니 아직 잡고 있지?
          @face haru left
          @act haru surprise nowait
          @emote haru !
          @pose gm wave
          > 돌아본 하루의 눈에, 저 멀리서 손을 흔드는 할머니가 보였다.
          haru: …언제 놨어?
          gm: 아까부터. 우리 하루 혼자 잘만 가던데?
          @pose gm idle
          @act haru stomp
          haru: 거짓말쟁이!
          @act gm laugh nowait
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
          @sfx birds
          > 토요일 아침. 할머니가 앞치마를 두 개 꺼냈다.
          @sfx clothes
          gm: 오늘은 할머니가 미역국 끓이는 법 알려 줄게.
          @act haru think nowait
          haru: 왜 갑자기?
          gm: 할머니 미역국은 할머니가 없으면 아무도 못 끓이잖니.
          @emote haru ?
          haru: 할머니가 왜 없어. 맨날 끓여 주면 되지.
          @face gm up
          @pose gm cook
          gm: …그러니까, 할머니가 바쁠 때 말이다. 자, 참기름 한 숟갈.
          @act haru nod nowait
          haru: 한 숟갈!
          @sfx sizzle
          gm: 고기를 달달 볶다가… 불린 미역을 넣고… 또 달달.
          @face haru up
          @pose haru cook
          haru: 달달.
          @sfx pour
          gm: 물 붓고, 간장 조금. 그리고 마지막에—
          haru: 마지막에?
          gm: 마음 한 숟갈.
          @pose haru idle
          @face haru gm
          @act haru laugh nowait
          haru: 그게 뭐야!
          @pose gm idle
          @face gm haru
          @act gm pat
          gm: 맛있게 먹어라, 하는 마음. 그게 제일 중요해.
          @wait 1.2
        `,
        after: s`
          bori: 마음 한 숟갈…
          nabi: 그래서 할머니 없는 첫 생신에, 하루가 엄마 미역국을 먹고 "할머니 맛이랑 달라"라고 한 거야. 마음 한 숟갈이 빠져서.
          ruru: 아니야. 엄마도 마음은 넣었을 거야. 할머니 마음이 아니었을 뿐이지.
          toby: 루루가 웬일로 좋은 말을 해.
          @act ruru stomp nowait
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
          @show gm grandma 7 7 up sit
          @show haru haru11 10 7 up sit
          @show mom mom 11 4 down
          @item mEcbowl bowl 8 7
          @music waltz
          @sfx birds
          > 할머니 생신 아침. 하루가 처음으로 혼자 미역국을 끓였다.
          @act haru clap nowait
          haru: 할머니! 생신 축하해! 내가 끓였어!
          gm: 아이고, 우리 하루가? 어디 보자.
          @wait 1
          @pose gm eat
          @sfx spoon
          > 할머니가 한 숟갈 떠먹었다.
          @sfx slurp
          @wait 1.2
          @emote gm sweat
          mom: …엄마, 짜지?
          gm: 짜긴. 딱 좋다.
          haru: 진짜? 짜면 짜다고 해.
          @act gm laugh nowait
          gm: …아이고, 짜라!
          @act haru surprise nowait
          @emote haru !
          gm: 그런데 세상에서 제일 맛있는 미역국이다.
          @sfx spoon
          > 할머니는 그 짠 미역국을 한 그릇 다 비웠다. 두 그릇째도.
          @sfx dish
          @pose gm sit
          @act haru cheer nowait
          haru: 할머니, 내년에도 끓여 줄게. 내년엔 안 짜게!
          gm: 그래. 기다리마.
          @wait 1.5
        `,
        explore: {
          enter: [2, 9],
          intro: s`
            toby: 부엌이야. 할머니 생신 아침, 하루는 열한 살.
            ruru: 킁, 냄새 좋다. …근데 좀 짭짤한데?
            bori: 생신 아침이다. 미역국 냄새.
          `,
          threads: [
            { at: [8, 7], text: s`
              > 식탁 위 미역국 두 그릇. 김이 오르다 멈췄다. 국물 색이 유난히 진하다.
              ruru: 색만 봐도 짜. 간장을 몇 번 부은 거야.
              bori: 그래도 냄새는 할머니 미역국이랑 똑같아.
            ` },
            { at: [14, 3], text: s`
              > 벽 달력. 오늘 날짜에 하루 글씨로 「할머니 생신」. 동그라미를 세 번이나 그렸다.
              bori: 하루가 일주일 전부터 날짜만 셌어. 매일 밤 하나씩 지우면서.
            ` },
            { at: [16, 4], text: s`
              > 화분 뒤에 반쯤 숨겨 둔 하얀 약봉지. 「하루 세 번」.
              toby: 하루 세 번… 내 태엽이랑 같네.
              ruru: 누가 숨겼는지는 안 봐도 알겠다.
            ` },
          ],
          looks: [
            { at: [6, 7], text: s`
              > 식탁 앞의 할머니. 숟가락을 든 채, 웃음을 참는 얼굴.
              toby: 첫 숟갈 뜨기 직전이야.
            ` },
            { at: [11, 7], text: s`
              > 열한 살 하루. 앞치마도 안 벗고, 할머니 얼굴만 보고 있다.
              nabi: 손등에 빨간 자국. 냄비 손잡이 잡다가 데었어. 할머니한텐 비밀이래.
            ` },
            { at: [12, 4], text: s`
              > 국자를 든 엄마. 한 숟갈 먼저 맛본 얼굴이다.
              ruru: 엄마는 벌써 알아. 짜다는 거.
            ` },
          ],
        },
        after: s`
          @emote bori tear
          bori: 내년에도…
          nabi: 이듬해 생신엔 안 짰어. 그런데 할머니는 입맛이 없다고, 반 그릇만 드셨지.
          toby: 그게 할머니가 하루 미역국을 드신 마지막이었어.
          ruru: 할머니 없는 첫 생신엔 엄마가 끓였고. 하루는 밤에 몰래 혼자 먹었고.
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
          @sfx birds
          @act gm cheer nowait
          @sfx clap
          gm: 우리 하루 화이팅!
          @act dad shrug nowait
          dad: 어머니, 목 쉬세요.
          > 출발! 하루가 달린다. 그리고— 넘어졌다.
          @sfx thud
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
          @music grandma
          @sfx clock
          > 동네 의원. 하루는 진료실 밖 의자에서 할머니를 기다렸다.
          @act haru lookAround
          @wait 1
          > 문 너머로 낮은 목소리들이 들린다. 무슨 말인지는 들리지 않는다.
          @wait 1.5
          @sfx doorOpen
          @show gm grandma 8 5 down
          @sfx doorClose
          @pose haru idle
          @face haru gm
          haru: 할머니! 뭐래?
          @sfx cough
          gm: 괜찮대. 감기가 좀 오래간대.
          haru: 그럼 약 먹으면 낫지?
          @wait 0.6
          @act gm nod
          gm: …그럼. 약 먹으면 낫지.
          gm: 가자. 할머니가 떡볶이 사 줄게.
          @act haru jump nowait
          haru: 앗싸!
          > 하루는 그날 떡볶이를 두 그릇 먹었다. 할머니는 한 입도 안 먹었다.
          @wait 1.5
        `,
        explore: {
          enter: [11, 8],
          intro: s`
            toby: 동네 의원. 하루가 열한 살이던 가을이야.
            bori: 할머니는? 안 보여.
            nabi: 진료실 안에 계셔. 하루는 밖에서 혼자 기다리고.
          `,
          threads: [
            { at: [7, 4], text: s`
              > 접수대 위 서류 묶음. 맨 위 종이에 「큰 병원 진료 의뢰서」라는 글씨가 거꾸로 보인다.
              toby: …큰 병원.
              nabi: 하루 자리에선 안 보이는 각도야.
            ` },
            { at: [10, 3], text: s`
              > 벽시계. 하루가 의자에 앉은 지 사십 분째다.
              bori: 감기 진찰이 이렇게 오래 걸려?
              ruru: …안 걸리지.
            ` },
            { at: [4, 7], text: s`
              > 하루 무릎 위에 할머니 꽃무늬 손수건. 꼭 쥔 채 멈춰 있다.
              nabi: 할머니가 기침할 때마다 입을 가리던 손수건이야. 들어가면서 하루한테 맡겼어.
            ` },
          ],
          looks: [
            { at: [5, 8], text: s`
              > 의자에 앉은 열한 살 하루. 다리를 흔들다 멈췄다.
              ruru: 떡볶이 생각하는 얼굴이다.
              toby: …응. 아무것도 모르는 얼굴.
            ` },
          ],
        },
        after: s`
          toby: 할머니는 그날 뭔가를 들었던 거야. 의사 선생님한테.
          nabi: 그리고 하루한테는 "괜찮대"라고 했어.
          ruru: 또 착한 거짓말이네.
          bori: 할머니가 떡볶이를 안 드셨어. 할머니 떡볶이 좋아하시는데.
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
          @carry gm lunchbox mEfpouch
          @music box
          @sfx birds
          > 아침. 하루가 책가방을 메고 나서려는데.
          gm: 하루야, 신발주머니!
          @act haru surprise nowait
          haru: 아 맞다!
          @walk gm 6 6 50
          @face haru gm
          @face gm haru
          @give gm haru mEfpouch
          gm: 차 조심하고. 모르는 사람 따라가지 말고. 점심 남기지 말고.
          @act haru shrug nowait
          haru: 할머니, 그 말 매일 해.
          gm: 매일 해야 매일 기억하지.
          @act haru bow
          haru: 다녀오겠습니다!
          @pose gm wave
          gm: 그래, 잘 다녀와.
          @walk haru 8 10 60
          @sfx doorOpen
          @hide haru
          @sfx doorClose
          > 그 인사는 할머니가 입원하던 날까지, 하루도 빠지지 않았다.
          @wait 2
        `,
        after: s`
          toby: 매일 해야 매일 기억한다.
          bori: 태엽이랑 똑같네. 매일 감아야 멈추지 않으니까.
          nabi: 할머니는 같은 말을 여러 번 하는 사람이었어. 일부러.
          ruru: 그래서 우리가 다 외우고 있잖아. 할머니 말.
          toby: 하루가 "다녀오겠습니다" 하면, 할머니는 꼭 "차 조심하고".
        `,
      },
      {
        kind: 'link',
        id: 'lE',
        at: [16, 5],
        name: '운동회 사진',
        icon: 'photo',
        locked: s`toby: 신발장 위 칸에도 뭐가 있어.`,
        scene: s`
          @bars on
          > 신발장 문틈에 끼어 있는 사진 한 장. 무릎에 반창고를 붙인 하루와, 목이 쉰 할머니.
          > 그리고 사진 귀퉁이, 「하루 화이팅」 종이를 든 단발머리 여자아이 하나.
          ruru: 둘 다 엄청 웃고 있네. …아니, 셋이네.
          nabi: 지우야. 하루 단짝. 그날 하루 무릎에 반창고 붙여 준 것도 지우였어.
          toby: 지우… 하루 책가방 앞주머니엔 늘 지우 쪽지가 들어 있었지.
          bori: 그 책가방, 아직 하루 방 의자에 걸려 있어!
          ruru: 가자, 책가방으로!
          > 사진 귀퉁이가 찢겨 흩어져 있다. 맞춰 본다.
          @mini thread2
          @sfx open
          @flag che_done
          @sfx memory
          @fade 1 1.4 white
          @next
        `,
      },
      // ── 놀이 1 · 단 내려가기: 마루(높은 층)에서 루루 밧줄로 현관 바닥에
      { kind: 'climb', id: 'step_down', at: [7, 9], to: [7, 7], who: 'ruru' },
      {
        kind: 'trigger',
        id: 'step_edge',
        rect: [5, 6, 5, 2],
        scene: s`
          > 마루 끝. 한 단 아래로 현관 돌바닥이 차갑게 깔려 있다.
          toby: 단이 높네. 우리 키로는 그냥 못 내려가.
          ruru: 밧줄이면 한 번이지. 나를 불러 와.
          @goal 루루 밧줄로 마루에서 현관 바닥으로 내려가자
        `,
      },
      // ── 놀이 2 · 센서등 숨바꼭질: 둘레 4칸 안에서 2칸 넘게 움직이면 불이 켜진다 (신발 속 · 상자 그림자는 괜찮다)
      {
        kind: 'watcher',
        id: 'sensor',
        at: [19, 9],
        actor: '',
        pattern: [{ s: 99, dir: 'down', r: 4, arc: 180 }],
        motion: 2,
        hide: [[16, 7], [20, 6], [21, 8], [18, 12], [22, 11], [17, 13]],
        caught: s`
          @sfx switch
          > 딸깍. 센서등이 하얗게 켜졌다.
          mom: …여보, 현관 불 켜졌어…?
          > 잠시 뒤, 불이 저절로 꺼진다. 다들 얼어붙은 채 숨을 죽였다.
        `,
        hint: s`nabi: 불빛 동그라미 안에서는 두 걸음까지야. 신발 속이나 상자 그림자에 숨었다가 다시 가.`,
      },
      {
        kind: 'trigger',
        id: 'floor_in',
        rect: [1, 9, 14, 6],
        unless: 'shoes_paired',
        scene: s`
          > 현관 천장에 센서등. 그 아래 바닥에 희미한 동그라미가 보인다.
          nabi: 저 동그라미 안에서 많이 움직이면 불이 켜져. 엄마가 깨실 거야.
          bori: 신발이 다 흩어져 있어. 짝도 안 맞고. 할머니는 늘 가지런히 놓아 주셨는데.
          toby: 매트 위에 짝대로 놓아 드리자. 할머니처럼.
          @goal 흩어진 신발 네 켤레를 짝대로 현관 매트에 놓자 (센서등을 조심해서)
        `,
      },
      // ── 놀이 3 · 신발 짝 맞추기 (배달): 아빠 구두는 무거워 보리가 함께 든다
      { kind: 'part', id: 'shoe_dad', at: [20, 7], look: 'shoePair:dad', set: 'shoes', heavy: true },
      { kind: 'part', id: 'shoe_mom', at: [23, 11], look: 'shoePair:mom', set: 'shoes' },
      { kind: 'part', id: 'shoe_haru', at: [17, 14], look: 'shoePair:haru', set: 'shoes' },
      { kind: 'part', id: 'shoe_small', at: [11, 10], look: 'shoePair:small', set: 'shoes' },
      {
        kind: 'assemble',
        id: 'shoe_mat',
        at: [20, 4],
        set: 'shoes',
        flag: 'shoes_paired',
        scene: s`
          @bars on
          > 아빠 구두, 엄마 운동화, 하루 운동화, 그리고 작아진 운동화 한 켤레. 매트 위에 짝대로 나란히.
          @act bori nod nowait
          bori: 할머니가 하던 대로야. 코가 문 쪽을 보게.
          nabi: 아침에 바로 신고 나가라고. 「다녀오겠습니다」 하자마자.
          @sfx open
          @prop shoeCabinet open
          > 끼익. 신발장 맨 아래 칸 문이 저절로 조금 열린다.
          @emote toby !
          toby: 저기… 털신이야. 할머니 털신.
          @bars off
          @goal 신발장 맨 아래 칸, 할머니 털신에 닿자
        `,
      },
      // ── 종이별
      { kind: 'star', id: 'sEa', at: [1, 3], text: '마루 구석 먼지 속 종이별.' },
      { kind: 'star', id: 'sEb', at: [24, 5], text: '우산 손잡이에 걸린 종이별.' },
      { kind: 'star', id: 'sEc', at: [1, 13], text: '현관 매트 밑에 깔린 납작한 종이별.' },
      { kind: 'star', id: 'sEd', at: [24, 14], text: '작은 운동화 속에 들어 있던 종이별.' },
      // ── 살펴보기
      {
        kind: 'spot',
        id: 'flowershoes',
        at: [18, 4],
        scene: s`
          > 꽃무늬 고무신. 앞코에 마른 흙이 그대로 묻어 있다.
          nabi: 할머니 꽃신이야. 텃밭 갈 때 신으시던.
          bori: 엄마가 버리지 못하고 맨 위에 올려 두셨대.
        `,
      },
      {
        kind: 'spot',
        id: 'newslippers',
        at: [18, 6],
        scene: s`
          > 신발장 맨 아래 칸, 할머니 털신 옆에 작은 실내화 한 켤레. 상표도 안 뗐다. 메모가 꽂혀 있다. 「퇴원 선물 — 사위가」
          bori: 아빠 글씨야.
          nabi: …한 번도 안 신으셨네.
          @wait 1.2
          ruru: 이것도 「두고 가는 짐」이야?
          toby: …아직 모르는 것 같아. 아빠도.
        `,
      },
      {
        kind: 'spot',
        id: 'babyshoes',
        at: [5, 11],
        scene: s`
          > 손바닥만 한 노란 운동화.
          ruru: 이거 하루 첫 신발이다! 이렇게 작았어?
          toby: 할머니가 이 신발 신기고 마당 한 바퀴 걷는 데 한 시간 걸렸대.
        `,
      },
      {
        kind: 'spot',
        id: 'keyhook',
        at: [22, 3],
        scene: s`
          > 열쇠 걸이. 빈 고리 하나에 「할머니」 이름표가 붙어 있다.
          toby: 할머니 열쇠 자리…
          nabi: 빈 고리인데 아무도 이름표를 떼지 않았어.
        `,
      },
      {
        kind: 'spot',
        id: 'shoehorn',
        at: [13, 13],
        scene: s`
          > 긴 나무 구둣주걱.
          bori: 할아버지 거래. 할머니가 평생 쓰셨대. 이것도 오래됐어. 나처럼.
          ruru: 너 진짜 그 말 좋아한다.
        `,
      },
      {
        kind: 'spot',
        id: 'mail',
        at: [21, 5],
        scene: s`
          > 우유 투입구에서 빠져나온 엽서 한 장. 「하루야 생일 축하한다 — 할머니」. 몇 년 전 날짜.
          toby: 할머니는 같은 집에 살면서도 생일마다 엽서를 보냈어.
          nabi: 우체부 아저씨가 매년 웃었대.
        `,
      },
    ],
  });
  return {
    ...r,
    toys: true,
    keepProps: [{ key: 'shoeCabinet@15,3', flag: 'shoes_paired', state: 'open' }],
    amb: [
      { name: 'roomTone', gain: 0.12 },
      { name: 'traffic', gain: 0.05 },
      { name: 'carPass', gain: 0.18, every: [9, 18] },
    ],
    hangouts: {
      bori: { at: [9, 5], pose: 'chinRest', dir: 'down', talk: s`
        @act bori lookAround nowait
        bori: 마루에서 보면 현관이 꼭 골짜기 같아. 신발 냄새 나는 골짜기.
        bori: 무거운 구두는 나랑 같이 들어. 혼자 들면 허리 나가.
      ` },
      ruru: { at: [4, 7], dir: 'down', talk: s`
        @act ruru hop nowait
        ruru: 이 단, 하루는 매일 아침 폴짝 뛰어내렸어. 할머니가 「신발 신고 뛰어!」 하셨지.
        ruru: 내려갈 땐 나를 불러. 밧줄은 마루 끝에 걸면 돼.
      ` },
      nabi: { at: [3, 11], pose: 'sleepSit', dir: 'right', talk: s`
        @act nabi stretch nowait
        nabi: 센서등은 고양이도 싫어해. 갑자기 켜지니까.
        nabi: 동그라미 안에선 두 걸음, 그다음엔 숨기. 그것만 기억해.
      ` },
    },
  };
}

/** 막 기억 사슬 (ACTS.md 막별 표): 이 방의 단계 차례 — 비어 있으면 사슬 없음 */
export const ENTRANCE_CHAIN: ChainStep[] = [];
