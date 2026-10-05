/** 6장 · 책장 (8살, 토비 극장) — 동료 셋이 하루에게 온 사연. 사람 크기 거실 책장 쪽 (livingHouse), 04:05 비 갬 */
import { s } from '../parse.ts';
import type { ChainStep, Chapter, RoomDef } from '../types.ts';
import { LIVING, livingMap } from './layout_b.ts';

export const CH6: Chapter = {
  n: 6,
  title: '6장 · 책장',
  sub: '8살, 토비 극장',
  room: 'shelf',
  start: [10, 14],
  party: ['toby', 'bori', 'ruru', 'nabi'],
  wind: 0.4,
  intro: s`
    @fade 1 0 white
    @bars on
    @music playful
    @chtitle
    @fade 0 2
    > 새벽 두 시 오 분. 비가 그쳤다. 거실 책장. 그림책과 동화책 사이에 오래된 인형극 무대가 숨어 있다.
    @prop tv on
    > 소파의 아빠는 아직 잔다. 켜 둔 TV 가 푸르게 깜빡인다.
    ruru: 여기다! 토비 극장 무대!
    bori: 커튼이 다 떨어졌네.
    @bars off
    @goal 책장 칸칸에 꽂힌 보리 · 루루 · 나비의 이야기를 들어 보자
    @flag ch6_in
  `,
};

export function shelfRoom(): RoomDef {
  const r = livingMap('shelf', [
      {
        kind: 'memory',
        id: 'm6a',
        at: [22, 4],
        name: '할머니의 곰',
        caption: '보리는 할머니가 일곱 살 때부터 함께한 곰',
        scene: s`
          @room m_living8
          @show gm grandma 5 8 up sit
          @show haru haru8 9 8 up sit
          @item bear6a bear 4 8
          @music waltz
          @sfx rainRoof
          > 하루, 여덟 살. 비 오는 토요일, 할머니와 거실에서 인형극을 준비했다.
          @face haru gm
          @act haru think nowait
          haru: 할머니, 보리는 원래 할머니 곰이었다며. 할머니는 누구한테 받았어?
          @face gm haru
          gm: 할머니의 엄마한테. 할머니가 일곱 살 때, 손수 만들어 주셨지.
          haru: 그럼 보리는 몇 살이야?
          gm: 글쎄다… 예순 살은 훌쩍 넘었겠지?
          @emote haru !
          @act haru jump
          haru: 예순 살! 그럼 할머니보다 딱 일곱 살 동생이네!
          @act gm laugh nowait
          gm: 허허. 셈도 잘하네, 우리 하루.
          @face gm left
          @take gm bear6a
          @pose gm sit
          gm: 할머니는 힘들 때마다 보리를 꼭 안았어. 그러면 꿀처럼 마음이 달콤해졌지.
          @walk haru 6 8 40
          @face haru gm
          @face gm haru
          @give gm haru bear6a
          @sfx hug
          gm: 그래서 우리 하루한테 준 거야. 하루도 힘들 때 꼭 안으라고.
          @emote haru ♥
          @wait 1
        `,
        explore: {
          enter: [16, 5],
          intro: s`
            toby: 거실이야. 하루가 여덟 살이던 비 오는 토요일.
            > 빗소리가 창에 붙은 채 멈췄다.
          `,
          threads: [
            { at: [6, 3], text: s`
              > 창에 빗줄기가 그어진 채 멈춰 있다.
              nabi: 비 오는 날이면 할머니는 꼭 인형극을 하자고 하셨어. 하루가 창밖만 보며 심심해하지 않게.
            ` },
            { at: [4, 8], text: s`
              > 할머니 곁에 앉혀 둔 보리. 왼쪽 귀만 실 색이 조금 다르다.
              bori: 귀가 떨어질 때마다 할머니가 다시 달아 주셨어. 그래서 실 색이 매번 달라.
              ruru: 네 귀, 거의 누더기 지도네.
              bori: 훈장이야.
            ` },
            { at: [11, 4], text: s`
              > 무대 옆에 세운 종이 간판. 「토비 극장」. 글씨 반은 할머니, 반은 하루.
              ruru: 왜 맨날 토비 극장이야. 루루 극장은 없어?
              toby: …하루가 정했어. 내가 제일 오래됐다고.
            ` },
          ],
          looks: [
            { at: [5, 7], text: s`
              > 할머니. 무릎 위에 바늘쌈지를 펼쳐 놓았다.
              bori: 할머니 무릎은 원래 내 자리였어. 하루가 네 살 되던 해부터는 하루 차지였지만.
            ` },
            { at: [9, 7], text: s`
              > 하루. 무언가 물어보려고 입을 막 벌린 참이다.
              toby: 하루는 궁금한 게 생기면 참지를 못했어. 지금 무슨 질문을 하려는 걸까.
            ` },
          ],
        },
        after: s`
          @emote bori …
          ruru: 보리, 왜 아무 말 안 해? 너 얘기잖아.
          bori: 「예순 살은 훌쩍 넘었겠지」래. …훌쩍은 좀 서운하다.
          @act bori pat
          bori: 일곱 살 할머니 손은 이만했어. …나중에 얘기해 줄게. 찬장에 가면.
          toby: 보리…
        `,
      },
      {
        kind: 'memory',
        id: 'm6b',
        at: [22, 6],
        name: '서른 번의 인형 뽑기',
        caption: '아빠가 서른 번 만에 뽑아 준 여우',
        scene: s`
          @room m_living8
          @show dad dad 13 6 left
          @show haru haru8 9 8 up sit
          @item fox6b fox 10 8
          @music waltz
          @sfx clock
          @face haru dad
          haru: 아빠! 루루는 아빠가 뽑아 준 거지?
          dad: 그럼! 놀이공원 인형 뽑기. 아빠가 서른 번 만에 뽑았지.
          @act haru surprise
          haru: 서른 번!
          dad: 엄마한테 엄청 혼났어. 그 돈이면 여우 인형 세 개는 사겠다고.
          @emote dad sweat
          @pose haru hipsHands
          haru: 그래도 루루는 하나뿐이잖아.
          dad: 그래. 하루가 저 여우 아니면 안 된다고 울어서, 아빠가 포기를 못 했지.
          @face haru right
          @take haru fox6b
          @sfx hug
          @emote haru ♪
          haru: 루루는 아빠가 서른 번이나 포기 안 하고 데려온 거야. 그러니까 제일제일 소중해.
          @wait 1
        `,
        after: s`
          @emote ruru …
          ruru: …서른 번.
          nabi: 서른 번이나 포기 안 하고 데려온 거래. 너를.
          @act ruru shrug nowait
          ruru: 하, 그냥 뽑기 기계가 고장 났던 거겠지.
          bori: 루루 꼬리 흔들린다.
          @act ruru stomp nowait
          ruru: 안 흔들렸거든!
          @wait 1.2
          ruru: …덤인 줄 알았어. 그냥 딸려 온 거.
        `,
      },
      {
        kind: 'memory',
        id: 'm6c',
        at: [33, 4],
        name: '토비 극장',
        caption: '「또 해 줘」 — 열 번도 넘게 들은 나비 이야기',
        dark: true,
        scene: s`
          @room m_living8
          @show gm grandma 8 5 down
          @show haru haru8 10 5 down
          @item cat6c cat 11 5
          @item tix6c card 13 6
          @music waltz
          > 상자로 만든 무대 위로 빨간 커튼이 걷혔다.
          @sfx curtain
          gm: 자, 「토비 극장」 시작합니다! 오늘의 이야기는…
          @sfx clap
          @act haru hop
          haru: 할머니, 인형은 내가 고를게!
          @mini puppet
          gm: …그리하여 토비와 친구들은 무사히 집으로 돌아왔답니다. 끝!
          @sfx cheer
          @face haru right
          @take haru cat6c
          @face haru gm
          haru: 할머니, 나비 얘기 또 해 줘! 나비 처음 만든 날!
          @face gm haru
          gm: 또? 벌써 열 번은 했을 텐데. 나비는 할머니가 만들었지. 하루 아기 때 덮던 이불로.
          @emote haru ♪
          @act haru clap nowait
          haru: 내 이불! 그 부분이 제일 좋아.
          gm: 그래. 하루가 그 이불이 다 해져도 못 버리고 울길래, 고양이로 만들어 줬지. 등불도 하나 들려 주고.
          @act haru think nowait
          haru: 왜 등불이야?
          gm: 하루는 어둠을 무서워했잖니. 밤에도 나비가 길을 밝혀 주라고.
          @sfx hug
          @wait 1
        `,
        explore: {
          enter: [2, 9],
          intro: s`
            > 불 꺼진 거실. 무대 위 작은 전구 하나만 켜져 있다.
            ruru: 이번엔 공연 날이구나. 객석은… 두 명?
          `,
          threads: [
            { at: [11, 4], text: s`
              > 무대의 빨간 커튼이 반쯤 걷히다 멈췄다. 할머니 치마 자투리 천이다.
              bori: 할머니 장롱엔 자투리 천 상자가 있었어. 커튼도, 무대 이불도 다 거기서 나왔지.
            ` },
            { at: [6, 4], text: s`
              > 무대 뒤에서 장난감 넷이 차례를 기다린다. 토끼, 곰, 여우… 그리고 등불 든 고양이.
              nabi: …저기 나도 있네.
              ruru: 우리가 우리를 구경하다니. 기분 이상해.
            ` },
            { at: [13, 6], text: s`
              > 소파 위, 크레용으로 그린 표가 몇 장 겹쳐 있다. 이름 칸은 전부 「할머니」.
              toby: 공짜라고 해도 할머니는 매번 표를 사셨어. 꼭 돈을 내고.
              ruru: 몇 장이나 산 거야, 대체.
            ` },
          ],
          looks: [
            { at: [8, 6], text: s`
              > 할머니. 이야기꾼 목소리를 내려고 헛기침을 하는 중이다.
              nabi: 할머니는 내 이야기를 할 때면 목소리가 조금 낮아졌어. 비밀 얘기처럼.
            ` },
            { at: [10, 6], text: s`
              > 하루. 벌써 박수 칠 준비가 되어 있다.
              bori: 아직 시작도 안 했는데.
            ` },
          ],
        },
        after: s`
          @emote nabi …
          nabi: 열 번도 넘게 들었대. 내 얘기를.
          @act ruru giggle nowait
          ruru: 넌 그때마다 무대 뒤에서 잘난 척했지.
          nabi: 잘난 척 아니야. …좋아서 그런 거야.
          toby: 나비 덕분에 침대 밑에서도 길을 찾았어.
          @act nabi shrug nowait
          nabi: …흥. 당연하지.
        `,
      },
      {
        kind: 'link',
        id: 'l6',
        at: [33, 3],
        name: '녹은 생일 초',
        icon: 'candle',
        locked: s`nabi: 아직이야. 우리 셋 기억이 다 모여야 해.`,
        scene: s`
          @bars on
          > 책장 맨 아래, 반쯤 녹은 생일 초 하나가 굴러다닌다.
          toby: 일곱 개 중 하나야. 하루 일곱 살 생일.
          @act bori jump nowait
          bori: 케이크! 그날 케이크 진짜 맛있었는데.
          ruru: 너 먹지도 못했잖아.
          bori: 냄새로 먹었어!
          toby: 그날… 내 태엽이 처음으로 멈췄던 날이야.
          @emote toby …
          toby: 가 보자. 과자 서랍으로.
          > 촛농이 흘러내린 자국을 거꾸로 따라가 본다.
          @mini thread3
          @sfx open
          @flag ch6_done
          @sfx memory
          @fade 1 1.4 white
          @next
        `,
      },
      // ───── 소파의 아빠: 비가 그친 뒤라 더 깊이 잔다. 그래도 이따금 뒤척인다 (그때 움직이면 들킨다)
      {
        kind: 'watcher',
        id: 'dad_sofa6',
        at: [16, 10],
        actor: 'dad',
        dir: 'down',
        moveOnly: true,
        pattern: [
          { s: 8, dir: null, pose: 'sleep' },
          { s: 2.5, dir: 'down', r: 5, arc: 55, pose: 'sleep', emote: '…' },
          { s: 7, dir: null, pose: 'sleep' },
          { s: 2.5, dir: 'left', r: 5, arc: 55, pose: 'sleep', emote: '…' },
        ],
        caught: s`
          dad: …으음… 하루야… 불 끄고 자…
          > 아빠가 잠꼬대를 하며 돌아눕는다. 장난감들은 얼른 숨었던 자리로 돌아간다.
        `,
        hint: s`
          bori: 아저씨가 뒤척일 땐 멈춰. 탁자 밑 그늘로 가면 안 보여.
        `,
        until: 'show_done',
      },
      { kind: 'climb', id: 'curtain_cord6', at: [2, 4], to: [3, 4], who: 'ruru' },
      // ───── 놀이 1 · 책 계단: 끈으로 묶다 만 책 묶음 셋을 높이대로 (낮은 것 · 가운데 · 높은 것) 책장 앞에 늘어놓는다
      { kind: 'push', id: 'bk1', at: [27, 6], look: 'bookTied:1' },
      { kind: 'push', id: 'bk2', at: [26, 8], look: 'bookTied:2' },
      { kind: 'push', id: 'bk3', at: [25, 6], look: 'bookTied:3' },
      { kind: 'pad', id: 'step1', at: [25, 4], accepts: ['bk1'], flag: 'st1' },
      { kind: 'pad', id: 'step2', at: [26, 4], accepts: ['bk2'], flag: 'st2' },
      { kind: 'pad', id: 'step3', at: [27, 4], accepts: ['bk3'], flag: 'st3' },
      {
        kind: 'trigger',
        id: 'books_hint',
        rect: [22, 5, 7, 5],
        unless: 'stairs_done',
        scene: s`
          > 책장 맨 아래 칸, 빨간 천 커튼을 단 종이 상자 무대. 무대 칸은 장난감 키보다 훨씬 높다.
          > 그 앞에 끈으로 묶다 만 책 묶음 셋. 얇은 것, 가운데 것, 두꺼운 것.
          @if with_bori
            @act bori think nowait
            bori: 얇은 것부터 두꺼운 것 차례로 책장 앞에 붙이면 계단이 되겠다. 무대 쪽이 제일 높게!
          @else
            toby: 책 묶음을 높이대로 늘어놓으면 무대로 오르는 계단이 될 텐데. 보리를 불러 오자.
          @end
          @goal 책 묶음을 높이대로 늘어놓아, 무대로 오르는 계단을 만들자
        `,
      },
      { kind: 'trigger', id: 'stair_a', rect: [1, 3, 34, 14], when: 'st1', scene: s`
        @if st2
          @if st3
            @flag stairs_done
          @end
        @end
      ` },
      { kind: 'trigger', id: 'stair_b', rect: [1, 3, 34, 14], when: 'st2', scene: s`
        @if st1
          @if st3
            @flag stairs_done
          @end
        @end
      ` },
      { kind: 'trigger', id: 'stair_c', rect: [1, 3, 34, 14], when: 'st3', scene: s`
        @if st1
          @if st2
            @flag stairs_done
          @end
        @end
      ` },
      {
        kind: 'trigger',
        id: 'stairs_ok',
        rect: [1, 3, 34, 14],
        when: 'stairs_done',
        scene: s`
          @sfx chime
          > 얇은 책, 가운데 책, 두꺼운 책. 책장 앞에 계단이 생겼다.
          @act ruru cheer nowait
          ruru: 토비 극장 입장! 표는 공짜야, 오늘만.
          @goal 무대 커튼 끈을 쥐고 있는 늑대 손인형을 설득하자
        `,
      },
      {
        kind: 'spot',
        id: 'books_undo',
        at: [22, 8],
        unless: 'stairs_done',
        scene: s`
          > 책 묶음 끈 끝이 바닥에 늘어져 있다. 끈을 당기면 책 묶음들이 처음 자리로 미끄러져 돌아올 것 같다.
          @sfx boxDrag
          @reset bk1 bk2 bk3
          toby: 처음부터. 얇은 것, 가운데, 두꺼운 것.
        `,
      },
      { kind: 'climb', id: 'bookstair', at: [24, 4], to: [29, 4], who: 'any', when: 'stairs_done' },
      // ───── 놀이 2 · 설득: 늑대 손인형이 무대 커튼 끈을 물고 놓지 않는다
      {
        kind: 'spot',
        id: 'wolf',
        at: [32, 4],
        unless: 'curtain_open',
        scene: s`
          > 무대 옆에 늑대 손인형이 엎드려 있다. 커튼 끈을 이빨로 꽉 물었다. 토비 극장의 영원한 악당.
          > 이마의 크레용 글씨: 「늑대 (나쁜 역)」.
          toby: 저기… 커튼 좀 열어 줄래? 마지막 공연이야.
          @choice wolf | 비켜, 시간 없어. | 이번 공연은 네가 주인공이야. 착한 늑대. | 커튼 끈만 잠깐 빌려 줘.
          @if wolf_1
            @sfx giggle
            > 늑대 손인형의 귀가 쫑긋 선다. 물고 있던 끈이 툭 떨어진다.
            @act ruru laugh nowait
            ruru: 착한 늑대라니. 대본 다시 써야겠네.
            @sfx curtain
            > 빨간 천 커튼이 스르르 걷힌다.
            @flag curtain_open
            @goal 나비 등불을 무대 뒤에 켜고, 그림자극을 올리자
          @else
            > 늑대 손인형은 끈을 더 꽉 문다. 눈썹(실밥)이 꿈틀한다.
            @act nabi shrug nowait
            nabi: 저 녀석, 맨날 나쁜 역만 해서 삐졌어. 원하는 걸 줘야 해.
          @end
        `,
      },
      // ───── 놀이 3 · 그림자극: 나비 등불을 무대 뒤에 켜고 → 인형극 → 아빠가 잠결에 박수
      { kind: 'lamp', id: 'stage_lamp', at: [34, 4], r: 2, look: 'flashlight', who: 'nabi', when: 'curtain_open' },
      {
        kind: 'spot',
        id: 'shadow_show',
        at: [31, 4],
        when: 'curtain_open',
        unless: 'show_done',
        scene: s`
          @if lamp_stage_lamp
            @bars on
            > 무대 뒤 등불이 켜지자 종이 커튼에 그림자들이 커다랗게 비친다.
            toby: 토비 극장, 마지막 공연. 「토비, 별을 따러 가다」.
            @mini puppet
            @sfx clap
            > 짝, 짝, 짝. 소파 쪽에서 박수 소리가 났다.
            @emote toby !
            dad: …음… 잘했네… 하루…
            > 아빠는 눈을 감은 채 손뼉을 몇 번 치더니, 다시 코를 골았다.
            @act ruru giggle nowait
            ruru: 관객 한 명. 할머니 다음으로 두 번째야.
            @flag show_done
            @goal 공연이 끝났다. 무대에 남은 것들을 살펴보자
            @bars off
          @else
            > 무대 뒤가 깜깜하다. 그림자를 비출 빛이 없다.
            toby: 나비 등불을 무대 뒤에 켜야 해.
          @end
        `,
      },
      { kind: 'star', id: 's6a', at: [23, 5], text: '그림책 사이에 끼어 있던 종이별.' },
      { kind: 'star', id: 's6b', at: [3, 3], text: '어둠 속에서 은은하게 빛나는 종이별.', dark: true },
      { kind: 'star', id: 's6c', at: [6, 12], text: '구슬 옆에 떨어진 분홍 종이별.' },
      { kind: 'star', id: 's6d', at: [2, 5], text: '밧줄 끝에 걸려 있던 종이별.' },
      {
        kind: 'spot',
        id: 'picturebook',
        at: [22, 5],
        scene: s`
          @sfx page
          > 「달님 안녕」. 표지가 너덜너덜하다.
          toby: 할머니가 매일 밤 읽어 주던 책이야. 하루는 마지막 장에서 꼭 달님한테 손을 흔들었어.
        `,
      },
      {
        kind: 'spot',
        id: 'script',
        at: [20, 6],
        scene: s`
          @sfx paper
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
          > 색종이로 만든 입장권 한 뭉치. 「토비 극장 · 관객: 할머니」. 한 장만 「관객: 아빠 (졸면 안 됨)」.
          nabi: 관객은 거의 늘 할머니였어. 그래도 할머니는 매번 처음 보는 것처럼 박수를 치셨지.
        `,
      },
      {
        kind: 'spot',
        id: 'curtain',
        at: [34, 6],
        scene: s`
          @sfx curtain
          > 떨어진 빨간 커튼 조각. 할머니가 바느질한 자국이 보인다.
          toby: 할머니 바늘땀. 하나하나 똑같은 간격이야.
        `,
      },
      {
        kind: 'spot',
        id: 'marble6',
        at: [5, 12],
        scene: s`
          > 구슬 하나가 반짝인다.
          ruru: 토비 극장 2화 소품. 이게 「용의 보물」이었어.
          bori: 그냥 구슬인데.
          @act ruru shake nowait
          ruru: 상상력이 없구나, 보리.
        `,
      },
  ]);
  return {
    ...r,
    toys: true,
    keepProps: [{ key: `tv@${LIVING.tv[0]},${LIVING.tv[1]}`, flag: 'ch6_in', state: 'on' }],
    amb: [
      { name: 'roomTone', gain: 0.3 },
      { name: 'clockTick', gain: 0.25 },
    ],
    hangouts: {
      bori: { at: [21, 9], pose: 'chinRest', dir: 'up', talk: s`
        @act bori lookAround nowait
        bori: 책 묶음이 나보다 무거워 보여. …그래도 한 칸씩이면 밀 수 있어.
        bori: 밀 거 있으면 불러. 아저씨 안 깨게 살살.
      ` },
      ruru: { at: [12, 10], dir: 'right', talk: s`
        @act ruru spin nowait
        ruru: 토비 극장 3화, 내가 상어였던 거 기억나? 최고의 악당이었지.
        ruru: 높은 데 걸 거면 불러. 무대 위든 창턱이든.
      ` },
      nabi: { at: [34, 8], pose: 'sleepSit', dir: 'left', talk: s`
        @act nabi peek nowait
        nabi: 그림자극은 등불이 있어야 해. 할머니는 늘 나를 무대 뒤에 앉혔어.
        nabi: 무대 뒤를 비출 때 나를 불러.
      ` },
    },
  };
}

/** 막 기억 사슬 (ACTS.md 막별 표): 이 방의 단계 차례 — 비어 있으면 사슬 없음 */
export const SHELF_CHAIN: ChainStep[] = [];
