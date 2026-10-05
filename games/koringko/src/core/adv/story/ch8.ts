/** 8장 · 비 오는 마당 (5살, 잃어버린 토비) */
import { s } from '../parse.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { grid, toyRoom } from './kit.ts';

const MAP = grid(30, 18, '.', 'B', [
  ['~', 1, 6, 28, 2],
  [':', 2, 13, 10, 1],
  [':', 11, 9, 1, 5],
  [',', 4, 9, 3, 2],
  [',', 17, 13, 3, 2],
  [',', 3, 2, 3, 1],
  ['B', 22, 11, 1, 6],
  ['B', 22, 11, 7, 1],
  ['.', 22, 13, 1, 1],
  ['T', 26, 3, 1, 1],
  ['T', 12, 2, 1, 1],
  ['T', 17, 9, 1, 1],
  ['o', 6, 15, 1, 1],
  ['o', 14, 11, 1, 1],
]);

export const CH8: Chapter = {
  n: 8,
  title: '8장 · 비 오는 마당',
  sub: '5살, 잃어버린 토비',
  room: 'yard',
  start: [3, 15],
  party: ['toby', 'bori', 'ruru', 'nabi'],
  wind: 0.24,
  intro: s`
    @fade 1 0 white
    @bars on
    @music rain
    @title 8장 · 비 오는 마당 | 5살, 잃어버린 토비
    @fade 0 2
    > 고양이 문을 지나 마당으로. 밤비가 추적추적 내린다.
    ruru: 으, 털 다 젖겠다.
    nabi: 고양이는 비를 싫어해. 이건 상식이야.
    bori: 등불은 괜찮아?
    nabi: 내 등불은 안 꺼져. 할머니가 만든 거니까.
    @emote toby …
    toby: 여기… 와 본 적 있어. 이 냄새. 젖은 흙.
    @bars off
    @goal 기억 조각 세 개를 찾자
  `,
};

export function yardRoom(): RoomDef {
  return toyRoom('yard', MAP, {
    name: '비 오는 마당',
    theme: 'village',
    start: [3, 15],
    music: 'rain',
    rain: true,
    ambient: [74, 84, 124],
    lights: [{ at: [3, 16], r: 110, color: [255, 210, 150], k: 0.5 }],
    things: [
      {
        kind: 'memory',
        id: 'm8a',
        at: [8, 11],
        name: '노란 비옷',
        caption: '개구리를 쫓다 떨어뜨린 토비',
        scene: s`
          @room m_yard
          @show haru haru5 10 6 down
          @show gm grandma 3 3 down umbrella
          @music rain
          > 하루, 다섯 살. 비 오는 날 마당.
          haru: 첨벙! 첨벙!
          @walk haru 7 6 60
          @sfx pop
          @walk haru 12 8 60
          @sfx pop
          gm: 하루야, 감기 걸린다! 웅덩이는 살살 밟아야지.
          @pose haru hold
          haru: 할머니, 토비도 첨벙 좋아해! 그치, 토비야?
          @emote haru ♪
          > 하루는 토비를 안고 비 오는 마당을 뛰어다녔다. 노란 비옷이 빗속에서 반짝였다.
          @pose haru idle
          @emote haru !
          haru: 앗, 개구리다! 기다려!
          @walk haru 18 9 70
          @hide haru
          > 하루는 개구리를 쫓아 덤불 너머로 사라졌다. 토비를 품에 안은 채로.
          @wait 1.2
        `,
        after: s`
          bori: 개구리를 쫓아갔어. 토비를 안고.
          toby: …그리고 나는 그 덤불 아래 떨어졌어. 진흙 속에.
          ruru: 기억나?
          toby: 조금. 비가 얼굴에 떨어지던 거. 차갑고… 무서웠어.
        `,
      },
      {
        kind: 'memory',
        id: 'm8b',
        at: [26, 14],
        name: '토비가 없어!',
        caption: '어둠을 무서워하던 아이가 손전등 대신 할머니 손을 잡았다',
        scene: s`
          @room m_room5
          @show haru haru5 8 7 down
          @music rain
          > 저녁이 되어서야 하루는 알았다.
          haru: 토비… 토비 어디 있어?
          @walk haru 11 6 60
          @walk haru 5 6 60
          @walk haru 8 7 60
          @emote haru !
          haru: 토비가 없어!
          @pose haru cry
          haru: 으아앙! 토비가 없어졌어! 할머니!
          @show gm grandma 1 3 down
          @walk gm 6 7 40
          gm: 어디 보자. 마지막으로 토비랑 어디 있었니?
          haru: 마당… 개구리…
          gm: 그럼 마당에 있겠구나. 할머니랑 같이 찾으러 가자.
          haru: 밖에 깜깜하잖아… 비도 오고…
          gm: 할머니가 우산 씌워 줄게. 하루는 할머니 손만 꼭 잡고 있으렴.
          @pose haru idle
          @emote haru …
          haru: …응.
          @wait 1
        `,
        after: s`
          nabi: 하루는 어둠을 무서워했어. 그래도 너를 찾으러 나간 거야.
          toby: 나를…
          ruru: 감동은 이따가 해. 아직 하나 남았잖아.
        `,
      },
      {
        kind: 'memory',
        id: 'm8c',
        at: [20, 3],
        name: '우산 속',
        caption: '「다시는 안 잃어버릴게. 평생」',
        scene: s`
          @room m_yard
          @show haru haru5 4 4 down
          @show gm grandma 3 4 right umbrella
          @music rain
          > 해가 지고, 비는 더 세차게 내렸다.
          gm: 하루야, 어디부터 찾아볼까?
          haru: 저쪽… 개구리 있던 데!
          @flag yard_search
          @control haru
          @goal 어린 하루가 되어 토비를 찾자 (꽃밭 · 웅덩이 · 덤불)
        `,
        after: s`
          toby: 하루가… 날 찾으러 와 줬어. 그 깜깜한 빗속을.
          bori: 다섯 살짜리가.
          nabi: 어둠을 그렇게 무서워하던 애가.
          ruru: …토비, 울어?
          toby: 태엽 인형은 안 울어.
          @emote toby tear
          ruru: 거짓말.
        `,
      },
      {
        kind: 'link',
        id: 'l8',
        at: [8, 3],
        name: '작은 노란 우산',
        icon: 'umbrella',
        locked: s`toby: 아직 기억 조각이 남아 있어. 연못 건너편도 살펴보자.`,
        scene: s`
          @bars on
          > 덤불 아래 작은 노란 우산이 쓰러져 있다.
          nabi: 할머니가 하루한테 사 준 우산.
          toby: 이제 하나 남았어. 맨 처음. 내가 하루한테 온 날.
          bori: 장난감 상자로 가자. 우리가 처음 만난 곳.
          > 상징물에 깃든 기억이 흐트러져 있다. 조각을 맞춰야 다음 기억으로 이어진다.
          @mini memento8
          @sfx open
          @flag ch8_done
          @sfx memory
          @fade 1 1.4 white
          @chapter 9
        `,
      },
      { kind: 'gap', id: 'g8', at: [15, 8], tiles: [[15, 7], [15, 6]] },
      { kind: 'block', id: 'b8', at: [22, 13], look: 'pot' },
      {
        kind: 'trigger',
        id: 't8pond',
        rect: [12, 8, 7, 2],
        unless: 'gap_g8',
        scene: s`
          ruru: 연못이다. 헤엄은 못 쳐. 밧줄이면 돼! 연못가에서 나를 불러.
          nabi: 젖는 건 싫지만, 떨어지는 건 더 싫어.
        `,
      },
      {
        kind: 'trigger',
        id: 't8pot',
        rect: [19, 12, 3, 3],
        unless: 'mem_m8b',
        scene: s`bori: 화분이 덤불 틈을 막고 있어. 왼쪽에서 밀면 되겠다!`,
      },
      {
        kind: 'trigger',
        id: 't8thunder',
        rect: [9, 9, 4, 4],
        scene: s`
          @sfx thunder
          @shake 0.5
          @emote ruru !
          @emote bori !
          ruru: 으악, 천둥!
          nabi: …안 무서웠어. 진짜야.
        `,
      },
      { kind: 'star', id: 's8a', at: [2, 3], text: '꽃잎 사이에 숨은 종이별.' },
      { kind: 'star', id: 's8b', at: [27, 1], text: '나무 밑동에 걸린 젖은 종이별.' },
      { kind: 'star', id: 's8c', at: [1, 10], text: '빗물에 떠내려온 종이별.' },
      { kind: 'star', id: 's8d', at: [27, 16], text: '화분 뒤에 숨은 종이별.' },
      {
        kind: 'spot',
        id: 'frog',
        at: [10, 10],
        scene: s`
          > 개구리 한 마리가 웅크리고 있다. 개굴.
          ruru: 너구나, 범인이.
          bori: 이 개구리가 그때 그 개구리일까?
          nabi: 개구리는 그렇게 오래 안 살아.
        `,
      },
      {
        kind: 'spot',
        id: 'boots',
        at: [4, 12],
        scene: s`
          > 현관 옆에 놓인 작은 노란 장화 한 켤레.
          toby: 비옷이랑 세트였어. 하루가 첨벙거릴 때마다 장화 속에 물이 들어갔지.
        `,
      },
      {
        kind: 'spot',
        id: 'swing',
        at: [24, 4],
        scene: s`
          > 녹슨 그네. 바람에 끼익, 끼익 흔들린다.
          bori: 할아버지가 만들어 주신 그네래. 할머니가 매일 밀어 주셨어.
          ruru: 하루가 더 높이! 하면 할머니가 깜짝 놀라 줄을 잡았지.
        `,
      },
      {
        kind: 'spot',
        id: 'garden',
        at: [5, 4],
        scene: s`
          > 할머니의 작은 꽃밭. 이름표가 꽂혀 있다. 「하루 꽃」.
          nabi: 하루가 씨앗 심은 자리. 할머니가 매일 물을 주셨대.
          toby: 꽃이… 아직 피어 있어.
        `,
      },
    ],
  });
}
