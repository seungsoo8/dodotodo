/** 7장 · 과자 서랍 (7살, 생일 · 새 태엽 열쇠) */
import { s } from '../parse.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { grid, toyRoom } from './kit.ts';

const MAP = grid(28, 16, 'p', 'k', [
  ['k', 13, 1, 1, 14],
  ['p', 13, 5, 1, 1],
  ['k', 14, 10, 13, 1],
  ['p', 20, 10, 1, 1],
  ['l', 6, 4, 1, 1],
  ['l', 9, 9, 1, 1],
  ['l', 17, 3, 1, 1],
  ['l', 23, 6, 1, 1],
  ['l', 16, 13, 1, 1],
  ['k', 3, 9, 2, 1],
]);

export const CH7: Chapter = {
  n: 7,
  title: '7장 · 과자 서랍',
  sub: '7살, 생일과 새 태엽 열쇠',
  room: 'drawer',
  start: [2, 13],
  party: ['toby', 'bori', 'ruru', 'nabi'],
  wind: 0.32,
  intro: s`
    @fade 1 0 white
    @bars on
    @music playful
    @chtitle
    @fade 0 2
    > 부엌 찬장의 과자 서랍. 달콤한 냄새가 가득하다.
    @emote bori ♥
    bori: 여기가… 천국인가?
    ruru: 보리 침 떨어진다.
    nabi: 쿠키가 길을 막고 있어. 보리, 먹지 말고 밀어.
    bori: 먹으면 안 돼?
    toby: …안 돼.
    @emote toby sweat
    > 토비의 걸음이 아까보다 확실히 느려졌다.
    nabi: 토비. 태엽 괜찮아?
    toby: 괜찮아. 가자.
    @bars off
    @goal 기억 조각 일곱 개를 찾자
    @flag ch7_in
  `,
};

export function drawerRoom(): RoomDef {
  return toyRoom('drawer', MAP, {
    name: '과자 서랍',
    theme: 'candy',
    start: [2, 13],
    music: 'playful',
    lights: [{ at: [13, 0], r: 160, color: [255, 220, 190], k: 0.35 }],
    things: [
      {
        kind: 'npc',
        id: 'jellyking',
        at: [8, 12],
        actor: 'jelly',
        dir: 'right',
        scene: s`
          @if seen_jellyking
            jelly: 말랑… 생일 케이크는 최고였지. 딸기 일곱 개.
          @else
            jelly: 말랑말랑… 누구냐, 내 낮잠을 깨운 것이.
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
          dad: 자, 다 같이! 생일 축하합니다~
          mom: 생일 축하합니다~
          gm: 사랑하는 우리 하루~
          > 노래가 끝나자, 하루가 숨을 크게 들이쉬었다.
          @mini candles
          @sfx cheer
          dad: 우와! 다 껐다!
          @face gm haru
          gm: 소원은 빌었니?
          @face haru gm
          haru: 응! 근데 비밀이야.
          gm: 그래, 소원은 말하면 안 이루어지지.
          haru: 할머니는 무슨 소원 빌었어? 할머니 생일 때.
          gm: 할머니 소원은… 우리 하루가 오래오래 웃는 거.
          haru: 그게 뭐야, 시시해!
          @emote gm ♥
          @wait 1
        `,
        after: s`
          bori: 케이크에 딸기가 일곱 개 올라가 있었어.
          ruru: 너는 진짜 그것만 기억하는구나.
          nabi: 할머니 소원, 들었어? 하루가 오래오래 웃는 거.
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
          > 생일 파티가 끝난 밤. 하루는 토비 태엽을 신나게 감았다.
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
          > 툭.
          @emote haru !
          haru: …어?
          > 태엽 열쇠가 부러졌다. 토비는 더 이상 걷지 않았다.
          haru: 토비야? 토비야, 움직여 봐!
          @pose haru cry
          haru: 으아앙! 할머니! 토비가 죽었어!
          @show gm grandma 1 3 down
          @walk gm 6 7 50
          gm: 아이고, 무슨 일이니.
          haru: 내가… 내가 너무 많이 감아서…
          gm: 괜찮아, 괜찮아. 할머니가 고쳐 줄게. 하룻밤만 기다리렴.
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
          @music box
          > 다음 날 아침. 할머니가 밤새 토비를 고쳐 놓으셨다.
          @face gm haru
          gm: 자, 새 열쇠란다. 하루가 좋아하는 빨간 리본도 묶었지.
          @walk haru 5 5 30
          @face haru gm
          @pose haru hold
          @sfx windTick
          @wait 0.5
          @sfx windTick
          @wait 0.5
          @sfx windTick
          @emote haru !
          haru: 움직여! 토비가 다시 움직여!
          gm: 하루야, 하나 약속하자.
          haru: 응!
          gm: 태엽은 천천히 감아야 오래 간단다. 한꺼번에 많이 감으면 부러지지.
          gm: 대신 매일 조금씩 감아 주렴. 태엽이 멈추지 않게.
          haru: 매일매일?
          gm: 그래, 매일매일.
          haru: 약속! 매일매일 감아 줄게. 평생!
          gm: 허허. 우리 하루는 평생이 좋구나.
          @wait 1
        `,
        after: s`
          toby: …"태엽이 멈추지 않게." 할머니 말이었어. 처음부터.
          nabi: 하루는 그 약속을 여섯 해 동안 지켰어. 하루도 안 빼고.
          bori: 그리고 할머니가 떠나신 날, 멈췄고.
          toby: 할머니 대신 하루의 태엽을 감아 줄 사람이 없었으니까.
          @emote toby …
        `,
      },
      {
        kind: 'link',
        id: 'l7',
        at: [6, 7],
        name: '부러진 첫 열쇠',
        icon: 'key',
        locked: s`toby: 아직 기억 조각이 남아 있어. 쿠키를 밀어서 길을 열자.`,
        scene: s`
          @bars on
          > 사탕 사이에 작은 쇠붙이가 반짝인다. 부러진 옛 태엽 열쇠.
          toby: 내 첫 번째 열쇠…
          ruru: 할머니가 버리지 않고 여기 넣어 두셨나 봐.
          bori: 저기 봐. 베란다 문이 조금 열려 있어. 바람이 화분 냄새를 데려와.
          nabi: 여섯 살 하루가 할머니랑 꽃을 심은 곳이야. 「하루 꽃」.
          toby: …그리고 그 너머가 마당이지. 비 오는 날의.
          ruru: 하나씩 가자. 베란다 먼저.
          > 상징물에 깃든 기억이 흐트러져 있다. 조각을 맞춰야 다음 기억으로 이어진다.
          @mini memento12
          @sfx open
          @flag ch7_done
          @sfx memory
          @fade 1 1.4 white
          @next
        `,
      },
      { kind: 'block', id: 'b7a', at: [13, 5], look: 'cookie' },
      { kind: 'block', id: 'b7b', at: [20, 10], look: 'cookie' },
      {
        kind: 'trigger',
        id: 't7a',
        rect: [10, 4, 3, 3],
        unless: 'mem_m7b',
        scene: s`bori: 쿠키 문이다! 나한테 맡겨. 쿠키 왼쪽에 서서 나를 불러!`,
      },
      {
        kind: 'trigger',
        id: 't7b',
        rect: [18, 8, 5, 2],
        unless: 'mem_m7c',
        scene: s`bori: 여기도 쿠키 문! 이번엔 위에서 아래로 밀어야겠어.`,
      },
      { kind: 'star', id: 's7a', at: [1, 1], text: '사탕 포장지에 싸여 있던 종이별.' },
      { kind: 'star', id: 's7b', at: [26, 1], text: '설탕 가루를 뒤집어쓴 종이별.' },
      { kind: 'star', id: 's7c', at: [11, 14], text: '젤리 대왕 옆에 떨어진 종이별.' },
      { kind: 'star', id: 's7d', at: [26, 14], text: '초콜릿 상자 밑의 종이별.' },
      {
        kind: 'spot',
        id: 'candlebox',
        at: [8, 2],
        scene: s`
          > 생일 초 상자. 「7」 모양 초 하나만 빠져 있다.
          ruru: 이 초, 하루가 끝까지 버리지 말라고 해서 아직 있는 거야.
        `,
      },
      {
        kind: 'spot',
        id: 'sprinkles',
        at: [16, 6],
        scene: s`
          > 무지개 스프링클 병.
          bori: 할머니가 하루 생일마다 케이크에 뿌려 주셨던 거.
          @emote bori ♥
        `,
      },
      {
        kind: 'spot',
        id: 'honeycandy',
        at: [5, 11],
        scene: s`
          > 꿀사탕 봉지. 반쯤 비었다.
          bori: 할머니 꿀사탕! 하루는 기침할 때마다 이걸 받아먹었어.
          nabi: 그거 하루가 할머니 기침하실 때 사 드렸던 거야. 거꾸로.
        `,
      },
      {
        kind: 'spot',
        id: 'gum',
        at: [25, 8],
        scene: s`
          > 풍선껌 하나. 「하루 꺼! 먹지 마!」라고 적혀 있다.
          ruru: 일곱 살 하루 글씨다. 아직도 아무도 안 먹었네.
        `,
      },
      {
        kind: 'spot',
        id: 'recipe',
        at: [17, 14],
        scene: s`
          > 할머니 글씨로 쓴 쪽지. 「하루 생일 케이크: 딸기 7개, 사랑 듬뿍」.
          toby: 사랑 듬뿍…
          nabi: 할머니다운 요리법이네.
        `,
      },
    ],
  });
}
