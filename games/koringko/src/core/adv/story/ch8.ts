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
    @chtitle
    @fade 0 2
    > 고양이 문을 지나 마당으로. 밤비가 추적추적 내린다.
    @act ruru shiver nowait
    ruru: 으, 털 다 젖겠다.
    nabi: 고양이는 비를 싫어해. 이건 상식이야.
    bori: 등불은 괜찮아?
    nabi: 내 등불은 안 꺼져. 할머니가 만든 거니까.
    @emote toby …
    toby: 여기… 와 본 적 있어. 이 냄새. 젖은 흙.
    @bars off
    @goal 기억 조각 일곱 개를 찾자
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
          @carry haru toby toby8a
          @carry gm towel towel8a
          @music rain
          @sfx rainRoof
          > 하루, 다섯 살. 비 오는 날 마당.
          @act haru jump
          haru: 첨벙! 첨벙!
          @walk haru 7 6 60
          @sfx splash
          @walk haru 12 8 60
          @sfx splash
          @sfx laugh
          gm: 하루야, 감기 걸린다! 웅덩이는 살살 밟아야지.
          @pose haru hold
          haru: 할머니, 토비도 첨벙 좋아해! 그치, 토비야?
          @emote haru ♪
          > 하루는 토비를 안고 비 오는 마당을 뛰어다녔다. 노란 비옷이 빗속에서 반짝였다.
          @pose haru idle
          @emote haru !
          @act haru point
          haru: 앗, 개구리다! 기다려!
          @walk haru 18 9 70
          @sfx clothes
          @hide haru
          > 하루는 개구리를 쫓아 덤불 너머로 사라졌다. 토비를 품에 안은 채로.
          @wait 1.2
        `,
        explore: {
          enter: [1, 10],
          intro: s`
            toby: 마당이야. 하루가 다섯 살이던, 비 오는 날.
            nabi: 나랑 루루가 오기도 전이네. 실을 찾자. 다 이어지면 비가 다시 내릴 거야.
          `,
          threads: [
            { at: [7, 4], text: s`
              > 웅덩이마다 작은 장화 자국. 하나, 둘, 셋… 전부 한가운데다.
              bori: 하루는 웅덩이를 그냥 지나간 적이 한 번도 없어.
            ` },
            { at: [4, 4], text: s`
              > 할머니 팔에 걸린 마른 수건 한 장. 하루 머리 닦아 주려고 들고 나오셨다.
              ruru: 수건까지 챙겨 나오셨어? 젖을 줄 알고?
              nabi: 할머니는 늘 하루보다 한 발 먼저 계셨어.
            ` },
            { at: [16, 7], text: s`
              > 덤불 아래 개구리 한 마리. 누군가를 기다리는 것처럼 앉아 있다.
              toby: …저기야. 내가 떨어질 곳.
              ruru: 개구리 녀석. 다 너 때문이야.
            ` },
          ],
          looks: [
            { at: [10, 5], text: s`
              > 노란 비옷의 하루. 품에 토비를 꼭 안고 있다.
              toby: 저때 하루 품은… 세상에서 제일 따뜻했어.
            ` },
            { at: [2, 3], text: s`
              > 우산 아래 할머니. 웅덩이가 아니라 하루만 보고 계신다.
              bori: 할머니 어깨 좀 봐. 우산이 하루 쪽으로 기울어서 다 젖었어.
            ` },
          ],
        },
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
          @sfx rainRoof
          > 저녁이 되어서야 하루는 알았다.
          @act haru lookAround
          haru: 토비… 토비 어디 있어?
          @walk haru 13 5 60
          @face haru right
          @sfx blanket
          @wait 0.4
          @walk haru 10 7 60
          @face haru down
          @sfx cardboard
          @wait 0.4
          @walk haru 5 6 60
          @face haru down
          @sfx clothes
          @walk haru 8 7 60
          @emote haru !
          haru: 토비가 없어!
          @pose haru cry
          @sfx sob
          haru: 으아앙! 토비가 없어졌어! 할머니!
          @sfx doorOpen
          @show gm grandma 1 3 down
          @walk gm 6 7 40
          @face gm haru
          @sfx pat
          gm: 어디 보자. 마지막으로 토비랑 어디 있었니?
          haru: 마당… 개구리…
          gm: 그럼 마당에 있겠구나. 할머니랑 같이 찾으러 가자.
          @act haru shiver nowait
          haru: 밖에 깜깜하잖아… 비도 오고…
          @carry gm umbrella umb8b
          gm: 할머니가 우산 씌워 줄게. 하루는 할머니 손만 꼭 잡고 있으렴.
          @pose haru idle
          @emote haru …
          @act haru nod nowait
          haru: …응.
          @walk gm 1 4 40 nowait
          @walk haru 2 4 40
          @hide gm
          @hide haru
          @sfx doorClose
          @wait 1
        `,
        explore: {
          enter: [2, 9],
          intro: s`
            > 하루의 방. 창밖은 벌써 깜깜하다.
            toby: …그날 저녁이야. 나는 여기 없었어. 마당 덤불 아래 있었으니까.
          `,
          threads: [
            { at: [10, 9], text: s`
              > 활짝 열린 장난감 상자. 토비 자리만 비어 있다.
              bori: 나는 저 안에 있었어. 토비가 안 오길래… 계속 문 쪽만 봤지.
            ` },
            { at: [13, 4], text: s`
              > 베개 옆, 토끼 모양으로 꺼진 자국.
              toby: 내 자리야. 하루는 나 없으면 잠을 못 잤어.
              ruru: 그럼 오늘 밤은 큰일이네.
            ` },
            { at: [8, 3], text: s`
              > 비 내리는 창. 커튼이 반만 쳐져 있다.
              nabi: 하루는 해가 지면 창 쪽을 안 봤대. 깜깜한 게 무서워서.
              toby: 그런데 오늘은… 저 깜깜한 데로 나가야 해.
            ` },
          ],
          looks: [
            { at: [8, 6], text: s`
              > 하루. 방을 두리번거리다 멈춘 얼굴.
              ruru: 아직 모르는 얼굴이야. 곧 알게 되겠지만.
            ` },
            { at: [1, 3], text: s`
              > 방문이 조금 열려 있다. 복도 끝에서 부엌 불빛이 새어 든다.
              nabi: 하루가 울면, 저 문으로 제일 먼저 들어오는 사람은 늘 정해져 있었어.
            ` },
          ],
        },
        after: s`
          nabi: 하루는 어둠을 무서워했어. 그래도 너를 찾으러 나간 거야.
          toby: 나를…
          @act ruru wipe nowait
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
          @sfx umbrellaOpen
          @sfx wind
          gm: 하루야, 어디부터 찾아볼까?
          @act haru point nowait
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
          @act ruru giggle nowait
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
          @sfx rainRoof
          > 덤불 아래 작은 노란 우산이 쓰러져 있다.
          nabi: 할머니가 하루한테 사 준 우산.
          bori: 하루는 이 우산 쓰고 매일 골목을 걸었어. 어린이집 갈 때도, 학교 갈 때도. 할머니 손 잡고.
          toby: 골목…
          @sfx windTick
          > 우산 끝이 마당의 파란 대문을 가리키고 있다. 대문 아래 틈으로 젖은 밤바람이 새어 든다.
          ruru: 저 밖은… 우리끼리 나가 본 적 한 번도 없잖아.
          nabi: 늘 하루 가방에 매달려서, 하루 품에 안겨서만 나갔지.
          toby: 하루가 기억하는 할머니는 집 안에만 있는 게 아니야. 골목에도, 놀이터에도 있어.
          bori: 밖은 넓겠다. 장난감한테는 엄청.
          @act ruru shrug nowait
          ruru: 무서우면 내 꼬리 잡아.
          nabi: 그건 할머니가 하루한테 하던 말이야. 내 꼬리로.
          ruru: …그럼 둘 다 잡아.
          > 상징물에 깃든 기억이 흐트러져 있다. 조각을 맞춰야 다음 기억으로 이어진다.
          @mini thread4
          @sfx open
          @flag ch8_done
          @sfx memory
          @fade 1 1.4 white
          @next
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
          @act ruru surprise nowait
          ruru: 으악, 천둥!
          @act nabi tremble nowait
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
          @sfx splash
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
          @sfx swing
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
