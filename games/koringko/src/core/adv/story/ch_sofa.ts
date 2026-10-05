/** 곁가지 장 · 루루의 소파 밑 — 덤인 줄 알았던 여우의 아지트 (베란다 다음, 비 오는 마당 앞) */
import { s } from '../parse.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { grid, house, toyRoom } from './kit.ts';

const MAP = grid(30, 18, 'u', 'Y', [
  // 마룻바닥 틈 (루루 밧줄)
  ['v', 10, 1, 1, 16],
  // 커다란 리모컨
  ['Y', 14, 3, 4, 2],
  // 떨어진 책 한 권
  ['Y', 13, 12, 2, 2],
  // 소파 다리 · 굳은 과자 부스러기 벽 (가운데 한 칸은 과자 덩어리가 막고 있다 — 보리가 민다)
  ['Y', 19, 9, 10, 1],
  ['Y', 19, 9, 1, 8],
  ['u', 19, 12, 1, 1],
  // 빠진 용수철 · 굴러온 단추
  ['O', 3, 7, 1, 1],
  ['O', 6, 11, 1, 1],
  ['O', 16, 8, 1, 1],
  ['O', 24, 4, 1, 1],
]);

export const CH_SOFA: Chapter = {
  n: 0,
  title: '0장 · 루루의 소파 밑',
  sub: '덤이 아니었던 여우',
  room: 'sofa',
  start: [3, 15],
  party: ['toby', 'bori', 'ruru', 'nabi'],
  wind: 0.26,
  intro: s`
    @fade 1 0 white
    @bars on
    @music night
    @chtitle
    @fade 0 2
    > 거실 소파 밑. 먼지 냄새, 잃어버린 동전, 오래된 과자 부스러기.
    bori: 으, 먼지… 에, 에취!
    nabi: 빨간 실은 여기서 끊겼어.
    toby: 루루. 여기 알지?
    ruru: …몰라.
    nabi: 쌓아 놓은 동전 탑. 모아 놓은 부스러기. 여기저기 묻은 여우 털.
    @emote ruru sweat
    ruru: …알아. 됐냐?
    ruru: 여기, 내 아지트야. 아무한테도 말 안 했던 데.
    bori: 아지트! 간식 있어?
    ruru: 너한테 줄 건 없어.
    @emote toby ♪
    toby: 그럼 오늘은 루루가 안내해 줘.
    ruru: 흥. 길 잃어도 모른다. …바짝 따라와.
    @bars off
    @goal 기억 조각 여섯 개를 찾자
  `,
};

export function sofaRoom(): RoomDef {
  return toyRoom('sofa', MAP, {
    name: '루루의 소파 밑',
    theme: 'village',
    start: [3, 15],
    music: 'night',
    ambient: [110, 100, 130],
    beams: [{ x: 2, w: 6, h: 18, slant: 1 }, { x: 21, w: 5, h: 9, slant: 1 }],
    lights: [{ at: [27, 15], r: 60, color: [255, 210, 150], k: 0.3 }],
    things: [
      {
        kind: 'memory',
        id: 'mRa',
        at: [3, 3],
        name: '유리 상자 속',
        caption: '뽑기 기계 맨 밑에서 올려다본 서른 번',
        scene: s`
          @room m_rr_arcade
          @show haru haru6 8 6 up
          @show dad dad 10 6 up
          @music box
          > 놀이공원, 해 질 녘. 인형 뽑기 기계 맨 밑에, 꼬리가 뜯어진 여우 하나가 깔려 있었다.
          > 유리 너머로, 코를 꼭 붙인 여자아이 얼굴이 보였다.
          haru: 저 여우. 아빠, 저 여우!
          dad: 위에 있는 곰이 쉬운데…
          haru: 여우! 꼬리 아픈 여우!
          dad: 좋아. 아빠만 믿어.
          @sfx click
          > 집게가 내려갔다가, 빈손으로 올라왔다.
          dad: …연습이야.
          @sfx click
          @wait 0.4
          @sfx click
          @wait 0.4
          @sfx click
          > 다섯 번. 열 번. 스무 번. 아빠 주머니의 동전이 줄어들었다.
          @emote dad sweat
          dad: 하루야, 저 위의 토끼는 어때? 저건 금방 뽑을 것 같은데.
          @face haru dad
          haru: 안 돼. 여우가 맨 밑에 있잖아. 아무도 안 뽑아 주면 계속 깔려 있어야 돼.
          @emote dad …
          @wait 1
          dad: …그렇지.
          > 아빠는 지폐를 동전으로 바꿔 왔다.
          @sfx click
          @wait 0.5
          dad: 스물아홉…
          @sfx click
          dad: 서른.
          @sfx pop
          > 집게가 여우의 뜯어진 꼬리를 걸고 올라왔다.
          @emote haru !
          haru: 나왔다! 아빠, 나왔어!
          @pose dad hold
          dad: 하하… 꼬리가 걸려서 나왔네. 너 운 좋다.
          @wait 1.5
        `,
        after: s`
          @emote ruru …
          ruru: 나는… 꼬리가 우연히 걸려서 나온 줄 알았어. 운 좋은 덤.
          nabi: 서른 번 다 너만 노렸는데?
          ruru: 위에 쉬운 곰도 있었고, 토끼도 있었는데.
          bori: 토끼는 이미 토비가 있었잖아.
          toby: 응. 토끼 자리는 꽉 찼어.
          @emote ruru ♥
          ruru: …시끄러. 먼지 들어가서 눈이 따가운 거야.
        `,
      },
      {
        kind: 'memory',
        id: 'mRb',
        at: [13, 2],
        name: '꼬리 세 번',
        caption: '태엽이 없는 루루에겐, 꼬리 쓰다듬기 세 번',
        scene: s`
          @room m_room6
          @show haru haru6 13 6 left
          @show mom mom 4 6 right
          @music box
          > 루루가 온 지 며칠 뒤, 밤.
          haru: 하나, 둘, 셋.
          > 하루가 토비의 태엽을 감는다. 매일 세 번. 할머니와의 약속.
          > 선반 끝의 여우는 그 소리를 가만히 듣고 있었다.
          mom: 하루야, 이제 불 끈다.
          haru: 잠깐! 루루도 해 줘야 돼.
          mom: 루루는 태엽이 없잖아.
          @emote haru ?
          @wait 1
          haru: 그럼 꼬리! 할머니가 꿰매 준 데.
          @pose haru holdDoll
          haru: 하나, 둘, 셋.
          > 하루는 꿰맨 자리를 세 번 쓰다듬었다.
          haru: 됐다. 이제 루루도 매일 세 번이야.
          mom: 매일?
          haru: 응. 토비만 해 주면 루루가 샘내.
          @emote mom ♥
          mom: 샘내는 건 어떻게 알았어?
          haru: 루루 표정 보면 알아.
          @wait 1.5
        `,
        after: s`
          bori: 루루 표정 보면 안대.
          ruru: 내 표정이 뭐! 나 그때 아무 표정도 안 지었어!
          nabi: 지금 짓고 있는 그 표정.
          toby: 매일 세 번… 하루는 나만 감아 준 게 아니었구나.
          ruru: 흥. 꼬리 털이 그래서 거기만 짧은 거야. …자랑하는 거 아니다.
        `,
      },
      {
        kind: 'memory',
        id: 'mRc',
        at: [27, 6],
        name: '소파 밑 일주일',
        caption: '찾은 건 할머니, 찾았다고 한 건 하루',
        scene: s`
          @room m_rr_living
          @show haru haru7 9 7 down
          @show mom mom 13 7 left
          @music minor
          > 하루, 일곱 살. 루루가 없어진 지 일주일째.
          haru: 장난감 상자에도 없고, 이불 속에도 없고, 가방에도 없어.
          mom: 놀러 갔다 흘렸나 보다. 엄마가 비슷한 여우 사 줄게.
          @face haru mom
          haru: 비슷한 거 아니야! 루루는 서른 번이야!
          @pose haru cry
          @wait 1
          @fade 1 0.6 black
          @hide haru
          @hide mom
          @show gm grandma 3 7 right
          @fade 0 0.8
          > 그날 밤. 할머니가 효자손을 들고 거실로 나왔다.
          @walk gm 8 6 30
          @face gm up
          @pose gm kneel
          gm: 어디 보자… 아이고, 허리야.
          > 할머니는 효자손으로 소파 밑을 휘휘 저었다.
          @sfx pop
          gm: …요 녀석. 여기 숨어 있었구나. 먼지투성이네.
          @pose gm holdDoll
          gm: 일주일 동안 하루가 얼마나 울었는지 아니.
          > 할머니는 루루의 먼지를 털어, 잠든 하루 베개 옆에 슬쩍 눕혀 두었다.
          @fade 1 0.6 white
          @pose gm idle
          @show haru haru7 3 7 right holdDoll
          @fade 0 0.8
          @walk haru 6 7 50
          haru: 할머니! 루루 찾았어! 내가 찾았어! 베개 옆에 있었어!
          @face gm haru
          gm: 그래? 우리 하루가 찾았구나. 장하다.
          haru: 루루가 나 기다렸나 봐.
          gm: 그럼. 일주일 내내 기다렸지.
          @wait 1.5
        `,
        after: s`
          ruru: 그 일주일… 여기 있었어. 이 소파 밑.
          bori: 그래서 여기가 아지트야?
          ruru: 처음엔 무서웠어. 깜깜하고, 아무도 안 오고. 덤은 그냥 잊어버리나 보다 했어.
          ruru: 근데 매일 밤, 하루 우는 소리가 들렸어. 저쪽 방에서.
          nabi: …그래서 무서울 때마다 여기 오는구나. 누가 찾으러 와 준 데라서.
          ruru: 분석하지 마.
        `,
      },
      {
        kind: 'memory',
        id: 'mRd',
        at: [15, 15],
        name: '두 번째 바느질',
        caption: '할머니와 루루, 둘만 아는 이야기',
        scene: s`
          @room m_gm_n
          @show gm grandma 3 4 up sit
          @music grandma
          > 하루, 여덟 살. 다들 잠든 밤, 할머니 방에만 불이 켜져 있었다.
          @sfx stitch
          gm: 또 뜯어졌네. 우리 하루가 너무 꼭 쥐고 다녀서.
          gm: 꼬리 잡고 빙빙 돌리고, 꼬리 잡고 가방에 넣고. 그렇지?
          @sfx stitch
          gm: 그런데 루루야. 너 요즘 시무룩하더라. 꼬리가 축 처져서.
          gm: 그 돈이면 세 개 산다던 말, 아직 마음에 담아 뒀니?
          @wait 1
          gm: 할머니가 하나 알려 줄까.
          gm: 인형은 값으로 오는 게 아니란다. 누가 얼마나 데려오고 싶어 했는지로 오는 거지.
          gm: 하루 아빠가 서른 번. 하루가 유리에 코 박고 기다린 것도 서른 번.
          @sfx stitch
          gm: 그러니까 너는 덤이 아니란다. 서른 번 만에 온 귀한 손님이지.
          @pose gm holdDoll
          gm: 자, 다 됐다. 이번엔 두 겹으로 꿰맸어.
          gm: 하루 시집갈 때까지는 끄떡없을 거다.
          @wait 1.5
        `,
        after: s`
          ruru: …할머니가 그 말 해 준 거, 아무한테도 말 안 했어.
          toby: 왜?
          ruru: 들었는데, 그땐 안 믿었어. 할머니는 원래 다 귀하다고 하니까.
          toby: 지금은?
          @emote ruru …
          ruru: …지금은 조금.
          bori: 꿀처럼 아껴 먹는 거구나.
          ruru: 너는 그 비유밖에 없냐.
        `,
      },
      {
        kind: 'memory',
        id: 'mRe',
        at: [22, 11],
        name: '루루가 그랬어',
        caption: '낮잠 자는 아빠와 여우 수염',
        scene: s`
          @room m_rr_living
          @show dad dad 8 6 down sleep
          @show haru haru9 3 7 right
          @prop tv on
          @music waltz
          > 일요일 오후. 텔레비전을 켜 둔 채, 아빠가 소파 앞에서 낮잠을 잔다.
          @emote dad zz
          haru: 루루, 작전 개시.
          @walk haru 7 7 20
          @pose haru holdDoll
          > 하루는 루루를 아빠 배 위에 살며시 앉혔다. 그리고 수성펜으로, 아빠 볼에 수염을 그렸다.
          @sfx giggle
          haru: 한 줄… 두 줄… 세 줄.
          @emote dad ?
          dad: 으음… 하루야, 지금 몇 시…
          @pose dad idle
          @emote dad !
          dad: 어? 여우?
          @pose haru idle
          haru: 루루가 그랬어!
          dad: 루루가? 루루가 펜을 들었다고?
          haru: 응! 루루는 장난꾸러기야!
          dad: 그럼 루루는 벌로… 간지럼!
          @sfx giggle
          haru: 꺄하하! 루루 말고 왜 나야!
          dad: 공범이잖아!
          @emote haru ♪
          > 그날 저녁, 아빠는 수염을 지우지 않고 밥을 먹었다. 할머니가 배를 잡고 웃었다.
          @wait 1.2
        `,
        after: s`
          ruru: 봐! 내가 장난꾸러기가 된 건 하루 때문이라고.
          nabi: 하루가 「루루가 그랬어」 한 게 몇 번인지 알아?
          ruru: 서른 번은 넘지.
          toby: 덕분에 하루는 한 번도 안 혼났어.
          bori: 루루가 다 대신 혼났지. 착한 공범.
          ruru: 착한 거 아니거든. …뭐, 공범은 맞아.
        `,
      },
      {
        kind: 'memory',
        id: 'mRf',
        at: [27, 15],
        name: '서른한 번째',
        caption: '아빠는 이번에도 포기하지 않기로 했다',
        scene: s`
          @room m_rr_living_n
          @show dad dad 8 6 down sit
          @music piano
          > 하루, 열세 살. 할머니 장례식이 끝나고 며칠 뒤의 밤.
          > 다들 잠든 거실. 아빠가 소파 앞에 혼자 앉아 있다. 손에는 여우 인형 하나.
          @pose dad holdDoll
          dad: 너, 소파 밑에 또 들어가 있더라. 옛날 버릇 그대로네.
          dad: 꼬리 꿰맨 자리… 장모님 솜씨다. 두 겹이네.
          @wait 1
          dad: 루루야. 아빠가 비밀 하나 말해 줄까.
          dad: 그날, 스물다섯 번째쯤에 아빠 진짜 그만두려고 했어. 주머니에 동전도 없었고.
          dad: 근데 하루가 유리에 코를 박고 그러더라. "아빠, 여우가 기다려."
          @emote dad …
          @wait 1
          dad: 하루가 요즘 말을 안 해. 밥도 잘 안 먹고. 방문도 닫고.
          dad: 아빠는 그런 거 잘 몰라. 장모님이 다 해 주셨으니까. 미역국도, 바느질도, 하루 마음도.
          @wait 1.5
          dad: …그래도 서른 번은 해 봤잖아. 그거 하나는 잘했어, 아빠가.
          @pose dad idle
          @walk dad 2 4 30
          @face dad left
          > 아빠는 하루 방 앞에 루루를 살며시 기대 앉혔다. 문은 두드리지 않았다.
          dad: 내일 아침엔 토스트라도 구워 볼까.
          dad: 안 먹으면… 모레 또 굽지 뭐.
          @wait 1.5
          > 아빠의 서른한 번째가, 그렇게 시작되었다.
          @wait 1
        `,
        after: s`
          @emote ruru tear
          ruru: …아빠 탄 토스트. 그게 그다음 날 아침이었어.
          toby: 하루가 한 입 먹었던 날.
          nabi: 아빠도 태엽을 감고 있었구나. 서툴게, 매일.
          ruru: 아빠는 원래 서툴러. 인형 뽑기도 서른 번이나 걸리고.
          @wait 0.8
          ruru: …그래서 좋아.
          @emote bori ♥
        `,
      },
      {
        kind: 'link',
        id: 'lR',
        at: [21, 6],
        name: '작은 노란 우산',
        icon: 'umbrella',
        locked: s`ruru: 아직이야. 내 아지트는 그렇게 좁지 않거든. 구석구석 다 봐.`,
        scene: s`
          @bars on
          > 소파 밑 가장 깊은 곳. 접힌 작은 노란 우산 끝이 비죽 나와 있다.
          ruru: 이거… 하루 다섯 살 때 우산이야. 내가 오기 전부터 여기 있었어.
          @sfx drip
          bori: 끝이 아직 젖어 있어.
          nabi: 비 냄새.
          @emote toby …
          toby: 비 오는 마당… 내가 없어졌던 날이야.
          ruru: 가 봐. 이번엔 네 차례야, 토끼.
          toby: 루루.
          ruru: 왜.
          toby: 아지트 구경시켜 줘서 고마워.
          @emote ruru sweat
          ruru: …딱 한 번만 말한다. 들어 줘서, 나도 고마워.
          ruru: 자, 빨리 가! 아무도 이쪽 보지 마!
          > 상징물에 깃든 기억이 흐트러져 있다. 조각을 맞춰야 다음 기억으로 이어진다.
          @mini memento14
          @sfx open
          @flag chr_done
          @sfx memory
          @fade 1 1.4 white
          @next
        `,
      },
      { kind: 'gap', id: 'gR', at: [9, 6], tiles: [[10, 6]] },
      { kind: 'block', id: 'bR', at: [19, 12], look: 'cookie' },
      {
        kind: 'trigger',
        id: 'tRgap',
        rect: [6, 4, 4, 5],
        unless: 'gap_gR',
        scene: s`
          ruru: 마룻바닥 틈이다. 비켜 봐, 이건 루루 님 전문이야.
          ruru: 틈 앞에서 나만 불러. 밧줄 휙— 한 번에 건다. 박수 준비해.
        `,
      },
      {
        kind: 'trigger',
        id: 'tRcookie',
        rect: [15, 10, 4, 4],
        unless: 'mem_mRe',
        scene: s`bori: 과자 부스러기가 굳어서 길을 막았어. 왼쪽에서 내가 밀게!`,
      },
      { kind: 'star', id: 'sRa', at: [1, 1], text: '먼지 뭉치 속에 파묻힌 종이별.' },
      { kind: 'star', id: 'sRb', at: [28, 1], text: '동전 탑 꼭대기에 얹힌 종이별.' },
      { kind: 'star', id: 'sRc', at: [28, 10], text: '과자 부스러기 사이에 낀 종이별.' },
      { kind: 'star', id: 'sRd', at: [11, 16], text: '소파 다리 옆에 떨어진 종이별.' },
      {
        kind: 'spot',
        id: 'rr_coins',
        at: [7, 14],
        scene: s`
          > 100원짜리 동전이 탑처럼 쌓여 있다.
          ruru: 내 보물. 아빠 주머니에서 굴러 나온 거 모은 거야.
          bori: 몇 개야?
          ruru: 스물아홉 개. 하나만 더 모으면 서른.
        `,
      },
      {
        kind: 'spot',
        id: 'rr_remote',
        at: [16, 5],
        scene: s`
          > 커다란 텔레비전 리모컨. 단추 하나가 반쯤 눌려 있다.
          nabi: 아빠가 일주일 동안 찾던 리모컨이네.
          ruru: 원래 여기 있었어. 내가 밀어 넣은 거 아니야.
          toby: 루루가 그랬어?
          ruru: 루루가 안 그랬어!
        `,
      },
      {
        kind: 'spot',
        id: 'rr_crumbs',
        at: [25, 7],
        scene: s`
          > 오래된 과자 부스러기 더미.
          bori: 이거 먹어도 돼?
          ruru: 그거 3년 됐어.
          bori: …냄새만 맡을게.
        `,
      },
      {
        kind: 'spot',
        id: 'rr_spring',
        at: [3, 9],
        scene: s`
          > 소파에서 빠진 용수철 하나. 아직 탱탱하다.
          ruru: 소파에서 너무 뛰어서 빠진 거야. 하루 말고, 아빠.
          toby: 아빠가 왜 소파에서 뛰어?
          ruru: 축구 볼 때. 골 들어가면.
        `,
      },
      {
        kind: 'spot',
        id: 'rr_hairtie',
        at: [24, 14],
        scene: s`
          > 빨간 방울이 달린 작은 머리끈.
          nabi: 하루가 일곱 살 때 잃어버린 머리끈이다.
          ruru: 그 일주일 동안 같이 굴러 들어와 있었어. 이거 베고 잤어.
          bori: 베개 있는 아지트. 좋다.
        `,
      },
    ],
  });
}

/** 거실 (루루 장면: 소파 앞) */
function rrLiving(id: string, win: string): RoomDef {
  return house(id, 'living', 18, 11, [
    ['door', 1, 1, 1, 2],
    [`window:${win}`, 5, 0, 4, 2],
    ['photo', 10, 0, 2, 2],
    ['clock', 13, 0, 2, 2],
    ['sofa:#7a9a6a', 6, 4, 5, 2, true],
    ['tv', 12, 3, 3, 1, true],
    ['rug:#c8a070', 5, 6, 7, 3],
    ['plant', 16, 3, 1, 1, true],
  ]);
}

/** 이 장에서만 쓰는 사람 크기 기억 방 */
export const SOFA_MEMROOMS: Record<string, () => RoomDef> = {
  // 놀이공원 오락실: 가운데가 인형 뽑기 기계
  m_rr_arcade: () =>
    house('m_rr_arcade', 'arcade', 18, 11, [
      ['garland', 2, 0, 5, 2],
      ['garland', 11, 0, 5, 2],
      ['shelf:toys', 1, 3, 2, 1, true],
      ['shelf:toys', 15, 3, 2, 1, true],
      ['claw', 7, 3, 4, 2, true],
      ['stool', 13, 7, 1, 1, true],
      ['rug:#e868a8', 6, 6, 6, 2],
    ], { music: 'box' }),
  // 거실 낮 (7살 · 9살)
  m_rr_living: () => rrLiving('m_rr_living', 'day'),
  // 거실 밤 (13살)
  m_rr_living_n: () => rrLiving('m_rr_living_n', 'night'),
};
