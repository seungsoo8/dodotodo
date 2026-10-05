/** 7장 · 과자 서랍 (7살, 생일 · 새 태엽 열쇠) */
import { s } from '../parse.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { houseMap } from './kit.ts';
import { kitchenHouse } from './layout_c.ts';


export const CH7: Chapter = {
  n: 7,
  title: '7장 · 과자 서랍',
  sub: '7살, 생일과 새 태엽 열쇠',
  room: 'drawer',
  start: [2, 12],
  party: ['toby', 'bori', 'ruru', 'nabi'],
  wind: 0.32,
  intro: s`
    @fade 1 0 white
    @bars on
    @music playful
    @chtitle
    @fade 0 2
    > 새벽 두 시 이십 분. 부엌 찬장의 과자 서랍. 냉장고가 웅웅거리고, 달콤한 냄새가 가득하다.
    @sfx drawer
    @act ruru jump nowait
    ruru: 과자 서랍이다! 보리 신났지?
    @act bori shake nowait
    bori: …아니. 나 이번엔 안 먹을 거야.
    nabi: 진짜?
    bori: 하루가 안 웃으면 과자도 맛없어.
    @emote ruru …
    ruru: …보리가 그런 말도 할 줄 알았어?
    bori: 예순 살이 넘었다니까.
    @emote toby sweat
    > 토비의 걸음이 아까보다 확실히 느려졌다.
    nabi: 토비. 태엽 괜찮아?
    @act toby nod nowait
    toby: 괜찮아. 가자.
    @sfx switch
    > 부엌 불이 탁 켜졌다.
    @act toby surprise nowait
    toby: 얼음!
    @sfx freeze
    @sfx steps
    > 슬리퍼 소리. 냉장고 문이 열렸다 닫히고, 물 따르는 소리.
    @sfx pour
    mom: …어?
    > 커다란 손이 서랍 앞의 곰을 집어 들었다.
    mom: 곰돌아. 네가 왜 여기 있어.
    @wait 1.5
    > 엄마는 곰의 왼쪽 귀에 코를 대 보았다. 한참 그러고 있었다.
    mom: …아직도 꿀 냄새 나네.
    > 엄마는 곰을 서랍 옆에 도로 앉혔다. 불이 꺼졌다.
    @sfx switch
    @wait 1.5
    ruru: …방금 「곰돌이」라고 했어?
    @emote bori …
    nabi: 보리?
    bori: 나중에. 찬장에 가면.
    @bars off
    @goal 하루의 오르골 노래를 다시 울리자
    @flag ch7_in
  `,
};

export function drawerRoom(): RoomDef {
  const r = houseMap({
    ...kitchenHouse('drawer'),
    things: [
      {
        kind: 'npc',
        id: 'jellyking',
        at: [35, 5],
        actor: 'jelly',
        dir: 'right',
        scene: s`
          @if seen_jellyking
            jelly: 말랑… 생일 케이크는 최고였지. 딸기 일곱 개.
          @else
            jelly: 말랑말랑… 누구냐, 내 낮잠을 깨운 것이.
            @act bori surprise nowait
            bori: 젤리 대왕님! 아직 안 드셔졌어요?
            jelly: 무례하군! …하지만 사실이다. 하루가 나를 아껴 두었지. 생일 때 먹는다고.
            jelly: 그런데 그 생일이 몇 번이나 지나갔는데도 나를 꺼내지 않더군.
            nabi: 하루는 요즘 생일 케이크도 안 먹었대요. 촛불도 안 껐고.
            jelly: …그렇군. 촛불을 끄는 아이가 웃는 법인데.
          @end
        `,
      },
      {
        kind: 'memory',
        id: 'm7a',
        at: [3, 2],
        name: '일곱 개의 초',
        caption: '할머니의 소원: 「우리 하루가 오래오래 웃는 거」',
        scene: s`
          @room m_kitchen
          @show haru haru7 8 8 up
          @show gm grandma 6 8 up
          @show mom mom 10 8 up
          @show dad dad 12 7 left
          @music waltz
          > 하루의 일곱 번째 생일.
          @sfx candle
          @wait 0.4
          @sfx switch
          dad: 자, 다 같이! 생일 축하합니다~
          mom: 생일 축하합니다~
          gm: 사랑하는 우리 하루~
          > 노래가 끝나자, 하루가 숨을 크게 들이쉬었다.
          @walk haru 8 7 40
          @face haru up
          @mini candles
          @sfx cheer
          @sfx clap
          dad: 우와! 다 껐다!
          @face gm haru
          gm: 소원은 빌었니?
          @face haru gm
          @act haru giggle nowait
          haru: 응! 근데 비밀이야.
          gm: 그래, 소원은 말하면 안 이루어지지.
          haru: 할머니는 무슨 소원 빌었어? 할머니 생일 때.
          gm: 할머니 소원은… 우리 하루가 오래오래 웃는 거.
          @act haru shrug nowait
          haru: 그게 뭐야, 시시해!
          @emote gm ♥
          @wait 1
        `,
        explore: {
          enter: [2, 4],
          intro: s`
            toby: 부엌이야. 하루의 일곱 번째 생일.
            nabi: 실을 찾자. 다 이어지면, 이 노래가 다시 흐를 거야.
          `,
          threads: [
            { at: [9, 4], text: s`
              > 식탁 위 케이크. 딸기 일곱 개, 초 일곱 개. 불꽃이 위로 선 채 멈춰 있다.
              bori: 딸기! 일곱 개! 아직 아무도 안 먹었어.
              ruru: 보리, 침.
            ` },
            { at: [14, 3], text: s`
              > 벽의 달력. 오늘 칸에 하루가 별을 일곱 개나 그려 놓았다. 지난 칸들은 하나씩 엑스.
              nabi: 생일 전 한 달 내내, 하루는 자기 전에 날짜를 하나씩 지웠어.
              toby: 매일 조금씩. …태엽 감는 것처럼.
            ` },
            { at: [12, 4], text: s`
              > 식탁 모서리에 할머니가 놓아둔 작은 선물 상자. 리본이 두 번 묶여 있다.
              ruru: 할머니 리본은 꼭 두 번 묶여 있어. 하루가 너무 빨리 열지 말라고.
            ` },
          ],
          looks: [
            { at: [6, 7], text: s`
              > 할머니. 노래를 부르려고 숨을 들이쉬던 참이다.
              toby: 할머니는 노래를 늘 반 박자 늦게 시작하셨어. 하루 목소리를 먼저 들으려고.
            ` },
            { at: [8, 7], text: s`
              > 하루. 볼에 바람을 가득 넣고 기다리고 있다.
              bori: 볼 좀 봐. 찐빵 같아.
            ` },
            { at: [13, 7], text: s`
              > 아빠. 박수 칠 손을 벌린 채 멈춰 있다.
              ruru: 아빠는 박수를 항상 너무 일찍 쳐. 서른 번 뽑기 때도 그랬을걸.
            ` },
          ],
        },
        after: s`
          bori: 케이크에 딸기가 일곱 개 올라가 있었어.
          @act ruru shrug nowait
          ruru: 너는 진짜 그것만 기억하는구나.
          nabi: 할머니 소원, 들었어? 하루가 오래오래 웃는 거.
          @act toby lookDown
          toby: …응. 그런데 지금 하루는 웃지 않아.
        `,
      },
      {
        kind: 'memory',
        id: 'm7b',
        at: [22, 3],
        name: '멈춘 태엽',
        caption: '너무 많이 감아서 부러진 태엽 열쇠',
        scene: s`
          @room m_room7
          @show haru haru7 8 7 down hold
          @music grandma
          @sfx crickets
          > 생일 파티가 끝난 밤. 하루는 토비 태엽을 신나게 감았다.
          @act haru jump
          haru: 토비야, 오늘 내 생일이니까 엄청 많이 감아 줄게! 끼릭끼릭끼릭!
          @sfx windTick
          @wait 0.12
          @sfx windTick
          @wait 0.12
          @sfx windTick
          @wait 0.12
          @sfx windTick
          @wait 0.12
          @sfx windTick
          @sfx thud
          @item key7b key 6 8
          > 툭.
          @emote haru !
          haru: …어?
          > 태엽 열쇠가 부러졌다. 토비는 더 이상 걷지 않았다.
          @act haru tremble nowait
          haru: 토비야? 토비야, 움직여 봐!
          @pose haru cry
          haru: 으아앙! 할머니! 토비가 죽었어!
          @sfx sob
          @sfx stairs
          @wait 0.8
          @sfx doorOpen
          @show gm grandma 1 3 down
          @walk gm 6 7 50
          gm: 아이고, 무슨 일이니.
          haru: 내가… 내가 너무 많이 감아서…
          @face gm down
          @take gm key7b
          @face gm haru
          @emote gm …
          gm: 괜찮아, 괜찮아. 할머니가 고쳐 줄게. 하룻밤만 기다리렴.
          @sfx pat
          @wait 1
        `,
        after: s`
          toby: 그날 기억나. 세상이 갑자기 깜깜해졌어.
          ruru: 그때도 태엽이 멈췄었구나.
          toby: 응. 그런데 다음 날 아침, 눈을 떴어. 할머니가…
        `,
      },
      {
        kind: 'memory',
        id: 'm7c',
        at: [24, 13],
        name: '새 열쇠와 약속',
        caption: '「태엽이 멈추지 않게, 매일 감아 주렴」',
        scene: s`
          @room m_gm
          @show gm grandma 3 4 up sit
          @show haru haru7 6 6 up
          @carry gm key key7c
          @music box
          @sfx birds
          > 다음 날 아침. 할머니가 밤새 토비를 고쳐 놓으셨다.
          @face gm haru
          gm: 자, 새 열쇠란다. 하루가 좋아하는 빨간 리본도 묶었지.
          @walk haru 4 5 30
          @face haru gm
          @give gm haru key7c
          @pose haru hold
          @sfx windTick
          @wait 0.5
          @sfx windTick
          @wait 0.5
          @sfx windTick
          @emote haru !
          @act haru cheer nowait
          haru: 움직여! 토비가 다시 움직여!
          gm: 하루야, 하나 약속하자.
          haru: 응!
          gm: 태엽은 천천히 감아야 오래 간단다. 한꺼번에 많이 감으면 부러지지.
          gm: 대신 매일 조금씩 감아 주렴. 태엽이 멈추지 않게.
          haru: 매일매일?
          gm: 그래, 매일매일.
          @act haru nod nowait
          haru: 약속! 매일매일 감아 줄게. 평생!
          gm: 허허. 우리 하루는 평생이 좋구나.
          @sfx pat
          @wait 1
        `,
        explore: {
          enter: [16, 9],
          intro: s`
            toby: 할머니 방. 내 열쇠가 부러진 다음 날 아침이야.
            ruru: 하룻밤 만에 고쳤다고? 어떻게?
          `,
          threads: [
            { at: [5, 3], text: s`
              > 재봉틀 위, 밤새 켜 둔 스탠드. 바늘에 하얀 실이 꿰여 있다.
              toby: 할머니는 한숨도 안 주무셨어. 내 배를 열고, 태엽을 갈고, 다시 꿰매고.
            ` },
            { at: [13, 3], text: s`
              > 벽시계 아래, 풀어진 손수건 한 장. 무언가를 오래 싸 두었던 모양대로 접힌 자국이 남아 있다.
              bori: 할머니가 서랍 맨 안쪽에 넣어 두던 손수건이야. 할아버지 시계를 싸 두던.
              nabi: …그럼 그 시계는 어디 갔을까.
            ` },
            { at: [8, 6], text: s`
              > 찻상 위에 식은 보리차 한 잔. 그 옆에 작은 줄칼과 반짝이는 쇳가루.
              ruru: 줄칼? 할머니가 쇠를 깎으셨다고?
              toby: …열쇠는 가게에서 사 온 게 아니었구나.
            ` },
          ],
          looks: [
            { at: [3, 5], text: s`
              > 할머니. 눈이 빨갛다. 그래도 웃고 있다.
              bori: 밤을 새우신 눈이야. 하루한테는 절대 말 안 하셨지만.
            ` },
            { at: [6, 5], text: s`
              > 하루. 눈이 퉁퉁 부었다.
              ruru: 밤새 울었어. 나 그 옆에서 다 들었거든. …딱히 걱정한 건 아니고.
            ` },
          ],
        },
        after: s`
          toby: …"태엽이 멈추지 않게." 할머니 말이었어. 처음부터.
          nabi: 하루는 그 약속을 여섯 해 동안 지켰어. 하루도 안 빼고.
          bori: 그리고 할머니가 떠나신 날, 멈췄고.
          toby: 「매일 세 번」은 하루가 정한 거야. 할머니는 「매일」이라고만 했는데.
          @emote toby …
        `,
      },
      {
        kind: 'link',
        id: 'l7',
        at: [29, 10],
        name: '부러진 첫 열쇠',
        icon: 'key',
        locked: s`toby: 아직 기억 조각이 남아 있어. 부엌이랑 서랍 속을 더 살펴보자.`,
        scene: s`
          @bars on
          > 사탕 사이에 작은 쇠붙이가 반짝인다. 부러진 옛 태엽 열쇠.
          toby: 내 첫 번째 열쇠…
          ruru: 할머니가 버리지 않고 여기 넣어 두셨나 봐.
          bori: 저기 봐. 베란다 문이 조금 열려 있어. 바람이 화분 냄새를 데려와.
          nabi: 여섯 살 하루가 할머니랑 꽃을 심은 곳이야. 「하루 꽃」.
          toby: …그리고 그 너머가 마당이지. 비 오는 날의.
          @act ruru point
          ruru: 하나씩 가자. 베란다 먼저.
          > 상징물에 깃든 기억이 흐트러져 있다. 조각을 맞춰야 다음 기억으로 이어진다.
          @mini photo3
          @sfx open
          @flag ch7_done
          @sfx memory
          @fade 1 1.4 white
          @next
        `,
      },
      // ── 놀이 1 · 오르골 음: 식탁 위 숟가락 · 컵 · 그릇을 노래 차례로 (기억 속 「미, 솔, 라…」)
      { kind: 'climb', id: 'table_chair', at: [14, 9], to: [15, 9], who: 'any' },
      {
        kind: 'trigger',
        id: 'table_hint',
        rect: [11, 6, 4, 6],
        scene: s`
          > 식탁 위에 오르골 하나. 하루가 꺼내 놓고 한참 망설인 것처럼, 뚜껑이 반쯤 열려 있다.
          > 그 둘레에 숟가락 · 컵 · 그릇이 일곱 개. 두드리면 저마다 다른 음이 날 것 같다.
          nabi: 오르골 원통의 핀이 몇 개 빠졌어. 그래서 노래가 안 나와.
          toby: 빠진 음을 우리가 대신 울려 주자. 의자를 밟고 식탁 위로.
          @goal 식탁 위 그릇들을 오르골 노래 차례대로 밟아, 하루의 노래를 다시 울리자
        `,
      },
      {
        kind: 'seq',
        id: 'musicbox',
        keys: [
          { at: [15, 8], look: 'cup', label: '도', note: '도' },
          { at: [16, 8], look: 'bowl', label: '레', note: '레' },
          { at: [18, 8], look: 'cup', label: '미', note: '미' },
          { at: [16, 9], look: 'tray', label: '파', note: '파' },
          { at: [19, 9], look: 'bowl', label: '솔', note: '솔' },
          { at: [20, 8], look: 'tray', label: '라', note: '라' },
          { at: [20, 9], look: 'cup', label: '시', note: '시' },
        ],
        order: [2, 4, 5],
        flag: 'musicbox_half',
        wrong: s`
          @sfx miss
          ruru: 음이 이상해. 할머니 노래는 그렇게 시작 안 했어.
          bori: 오르골 기억 속에서 들었잖아. 맨 처음 세 음.
        `,
      },
      {
        kind: 'trigger',
        id: 'musicbox_done',
        rect: [15, 8, 6, 2],
        when: 'musicbox_half',
        scene: s`
          @bars on
          @sfx music
          > 미, 솔, 라… 오르골이 세 음을 이어 받아 몇 마디를 울리다가, 툭 멈춘다.
          @emote toby …
          toby: 여기까지야. 뒤는… 핀이 다 빠졌어.
          nabi: 끝은 하루만 알 거야. 할머니가 하루한테만 끝까지 불러 주셨으니까.
          @act bori lookAround nowait
          bori: 킁킁. 그건 그렇고, 과자 서랍에서 달콤한 냄새가 나. 저 안에 생일 초 상자가 있을 거야.
          @bars off
          @goal 보리 · 루루와 함께 과자 서랍을 당겨 열자
        `,
      },
      // ── 놀이 2 · 과자 서랍 당기기: 루루가 손잡이에 밧줄 → 보리 · 토비가 하나, 둘, 셋
      {
        kind: 'pull',
        id: 'snack_drawer',
        at: [25, 4],
        look: 'drawerFront',
        look2: 'drawerFront:open',
        need: ['bori', 'ruru'],
        tugs: 3,
        flag: 'drawer_open',
        when: 'musicbox_half',
        scene: s`
          @prop kcounter@23,3 open
          @sfx drawer
          > 드르륵. 과자 서랍이 반쯤 빠져나왔다. 안쪽은 깜깜하고, 달콤한 냄새가 훅 끼친다.
          @goal 서랍 속으로 들어가 보자
        `,
      },
      { kind: 'climb', id: 'into_drawer', at: [26, 4], to: [28, 6], who: 'any', when: 'drawer_open' },
      // ── 놀이 3 · 배달: 굴러간 딸기 사탕을 젤리 대왕에게 → 생일 초 상자
      {
        kind: 'trigger',
        id: 'jelly_ask',
        rect: [32, 5, 6, 4],
        when: 'drawer_open',
        scene: s`
          jelly: 말랑… 거기 누구냐. 마침 잘 왔다.
          jelly: 내가 지키던 딸기 사탕 마지막 하나가, 서랍이 흔들릴 때 저 깊은 구석으로 굴러가 버렸다.
          jelly: 깜깜해서 나는 못 간다. 찾아다 주면, 내가 지키는 다른 보물을 보여 주마.
          nabi: 깜깜한 데는 내 등불이야. 나를 데려가.
          @goal 서랍 깊숙이 굴러간 딸기 사탕을 젤리 대왕에게 돌려주자
        `,
      },
      { kind: 'part', id: 'strawberry', at: [38, 10], look: 'candyRed', set: 'gift', dark: true, when: 'trig_jelly_ask' },
      {
        kind: 'assemble',
        id: 'jelly_gift',
        at: [35, 6],
        set: 'gift',
        flag: 'jelly_gift',
        scene: s`
          @bars on
          jelly: 오오, 내 딸기 사탕! 말랑말랑 고맙구나.
          jelly: 약속대로 보물을 보여 주마. 생일 초 상자다. 일곱 개 중에 하나만 녹아서 짧지.
          bori: 일곱 살 생일 초야! 하루가 한 번에 다 끈 거.
          @bars off
          @goal 부러진 첫 태엽 열쇠에 닿자
        `,
      },
      // ── 종이별
      { kind: 'star', id: 's7a', at: [1, 14], text: '사탕 포장지에 싸여 있던 종이별.' },
      { kind: 'star', id: 's7b', at: [26, 13], text: '설탕 가루를 뒤집어쓴 종이별.' },
      { kind: 'star', id: 's7c', at: [39, 11], text: '젤리 대왕 옆에 떨어진 종이별.' },
      { kind: 'star', id: 's7d', at: [24, 8], text: '식탁 다리 밑의 종이별.' },
      // ── 살펴보기
      {
        kind: 'spot',
        id: 'candlebox',
        at: [30, 7],
        scene: s`
          @sfx cardboard
          > 과자 봉지 사이로 생일 초 포장지가 비죽 나와 있다. 「7」 모양 초 하나만 빠져 있다.
          ruru: 이 초, 하루가 끝까지 버리지 말라고 해서 아직 있는 거야.
        `,
      },
      {
        kind: 'spot',
        id: 'sprinkles',
        at: [14, 4],
        scene: s`
          > 신문지 꾸러미 옆에 무지개 스프링클 병.
          bori: 할머니가 하루 생일마다 케이크에 뿌려 주셨던 거.
          @emote bori ♥
        `,
      },
      {
        kind: 'spot',
        id: 'honeycandy',
        at: [6, 4],
        scene: s`
          @sfx paper
          > 가스레인지 밑에 꿀사탕 봉지. 반쯤 비었다.
          bori: 할머니 꿀사탕! 하루는 기침할 때마다 이걸 받아먹었어.
          nabi: 그거 하루가 할머니 기침하실 때 사 드렸던 거야. 거꾸로.
        `,
      },
      {
        kind: 'spot',
        id: 'gum',
        at: [38, 7],
        scene: s`
          > 풍선껌 하나. 「하루 꺼! 먹지 마!」라고 적혀 있다.
          ruru: 일곱 살 하루 글씨다. 아직도 아무도 안 먹었네.
        `,
      },
      {
        kind: 'spot',
        id: 'recipe',
        at: [20, 4],
        scene: s`
          @sfx paper
          > 바닥에 떨어진 할머니 글씨 쪽지. 「하루 생일 케이크: 딸기 7개, 사랑 듬뿍」.
          toby: 사랑 듬뿍…
          nabi: 할머니다운 요리법이네.
        `,
      },
    ],
  });
  return {
    ...r,
    toys: true,
    // 열린 과자 서랍은 다시 들어와도 열려 있다
    keepProps: [{ key: 'kcounter@23,3', flag: 'drawer_open', state: 'open' }],
    amb: [
      { name: 'fridgeHum', gain: 0.16 },
      { name: 'clockTick', gain: 0.08 },
      { name: 'drip', gain: 0.3, every: [3, 6] },
    ],
    hangouts: {
      bori: { at: [12, 10], pose: 'chinRest', dir: 'up', talk: s`
        @act bori surprise nowait
        bori: 부엌이다! 냉장고 냄새, 보리차 냄새, 과자 냄새.
        bori: 서랍 당길 땐 불러. …먹으려고 당기는 거 아니야, 오늘은.
      ` },
      ruru: { at: [6, 9], dir: 'right', talk: s`
        @act ruru hop nowait
        ruru: 서랍 손잡이에 밧줄 걸 거지? 그런 건 나밖에 못 해.
        ruru: 식탁 위에서 쿵쿵 뛰면 소리 난다. 조심해.
      ` },
      nabi: { at: [22, 11], pose: 'sleepSit', dir: 'left', talk: s`
        @act nabi stretch nowait
        nabi: 냉장고 문틈 불빛이 따뜻해. …여기 있을래.
        nabi: 깜깜한 서랍 속에 들어갈 땐 불러. 등불은 내가 들게.
      ` },
    },
  };
}
