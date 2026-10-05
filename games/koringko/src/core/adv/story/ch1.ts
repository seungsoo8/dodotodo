/** 서장 + 1장 · 다락방 (15살, 이삿짐을 싸던 밤) */
import { s } from '../parse.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { toyRoom } from './kit.ts';

export const ATTIC = [
  'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKK',
  'KKKKKKKKKwwwwwwKKKKKKKKKKKKKKK',
  'KKwwwwwwwwwwwwwwwwwwwwwKwwwwwK',
  'KwwwwwwwwwwwwwwwwwwwwwwKwwwwwK',
  'KwwKKwwwwwwQQwwwwwwwwwwKwwwwwK',
  'KwwKKwwwwwwQQwwwwwKKwwwKwwwwwK',
  'KwwwwwwwwwwwwwwwwwKKwwwKKKwKKK',
  'KwwwwwwKKKwwwwwwwwwwwwwwwwwwwK',
  'KKKwwwwKKKwwwwwwwwwwwwwwwwwwwK',
  'KKKwwwwwwwwwwwKKKwwwwwwwwwwwwK',
  'KwwwwwwwwwwwwwKKKwwwwwwKKwwwwK',
  'KwwwwQQwwwwwwwwwwwwwwwwKKwwwwK',
  'KwwwwQQwwwwwwwwwwwwwwwwwwwwwwK',
  'KwKKwwwwwwwKKKKwwwwwwwwwwwwwwK',
  'KwKKwwwwwwwKKKKwwwwwQQwwwwwwwK',
  'KwwwwwwwwwwwwwwwwwwwQQwwwwwwwK',
  'KwwwwwwwwwwwwwwwwwwwwwwwwwwwwK',
  'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKK',
];

const DOLL_HINT = s`
  @if woke_all
    @if mem_m1c
      doll: 기억 조각을 다 모았다면 바느질 바늘을 만져 보렴.
    @else
      doll: 저 위 구석, 상자로 막힌 틈이 있지? 보리라면 밀어낼 수 있을 게다.
    @end
  @else
    doll: 친구들을 먼저 깨우렴. 보리는 크레용 그림 근처, 루루는 아래쪽, 나비는 저 위 상자 더미 옆에 있단다.
  @end
`;

const ALL_AWAKE = s`
  @if woke_bori
  @if woke_ruru
  @if woke_nabi
    @wait 0.4
    @bars on
    doll: 다들 모였구나.
    @face toby doll
    doll: 하나 더 알려 주마. 우리가 움직이는 건 이 밤뿐이란다. 해가 뜨면 다시 장난감이 되지.
    ruru: 그럼 밤새 놀 수 있는 거네!
    bori: 밤새 걸으면 배고플 텐데.
    nabi: 그건 자랑이 아니야, 보리.
    doll: 그리고 저기, 반짝이는 것이 보이니? 하루의 기억 조각이란다.
    @cam 9 3 1.2
    @wait 1.2
    doll: 만지면 그날로 돌아가 볼 수 있지. 하루가 무슨 생각을 했는지, 무엇을 잊으려 했는지.
    @cam off
    @bars off
    @goal 기억 조각 일곱 개를 찾자
    @flag woke_all
  @end
  @end
  @end
`;

export const CH1: Chapter = {
  n: 1,
  title: '1장 · 다락방',
  sub: '15살, 이삿짐을 싸던 밤',
  room: 'attic',
  start: [5, 15],
  party: ['toby'],
  wind: 0.9,
  intro: s`
    @fade 1 0
    @bars on
    @music none
    @pose toby stop
    @wait 1
    > 그날 밤. 불 꺼진 다락방, 「두고 가는 짐」 상자 안.
    @wait 1.5
    @sfx windTick
    @wait 0.25
    @sfx windTick
    @wait 0.25
    @sfx windTick
    doll: …토비야.
    doll: 일어나렴, 토비야.
    @fade 0 3
    @wait 0.5
    @pose toby idle
    @emote toby ?
    toby: …으음. 여기가… 어디지?
    @face toby doll
    doll: 다락방이란다. 하루가 우리를 상자에 담아 이리로 올려 보냈어.
    toby: 태엽 할머니! 하루가? 우리를… 왜요?
    doll: 내일 이 집을 떠난대. 그리고 이 상자에는 쪽지가 붙었지. 「두고 가는 짐」.
    @emote toby !
    toby: 두고… 간다고요? 우리를?
    doll: 쉿. 크게 말하면 아래층까지 들린단다.
    toby: 말도 안 돼. 하루는 매일 밤 내 태엽을 감아 줬어요. "태엽이 멈추지 않게"라면서…
    doll: 그건 아주 오래전 일이지. 네 등을 만져 보렴.
    @sfx windTick
    > 끼릭… 끼…릭. 등의 태엽이 느리게, 아주 느리게 돌고 있다.
    toby: 태엽이… 거의 다 풀렸어.
    doll: 하루가 마지막으로 네 태엽을 감아 준 게 두 해 전이란다. 태엽이 다 풀리면, 우리 같은 장난감은 다시 깨어나지 못해.
    @emote toby …
    doll: 그러니 태엽이 멈추기 전에, 하루의 마음을 찾아오렴.
    toby: 하루의 마음이요?
    doll: 이 집 곳곳에 하루의 기억이 떨어져 있단다. 기억을 거슬러 올라가다 보면 알게 될 거야. 하루가 왜 너희를 두고 가려는지.
    toby: 할머니도 같이 가요.
    doll: 이 할머니는 태엽이 너무 낡아서 오래 걷지 못한단다. 여기서 기다리마.
    doll: 먼저 친구들을 깨우렴. 보리, 루루, 나비. 혼자서는 못 해낼 일이니까.
    @bars off
    @title 태엽이 멈추기 전에 | 
    @music night
    @chtitle
    @goal 잠든 친구들을 깨우자 (보리 · 루루 · 나비)
  `,
};

export function atticRoom(): RoomDef {
  return toyRoom('attic', ATTIC, {
    name: '다락방',
    theme: 'toybox',
    start: [5, 15],
    music: 'night',
    beams: [{ x: 9, w: 6, h: 9, slant: -3 }],
    things: [
      { kind: 'npc', id: 'doll', at: [7, 14], actor: 'grandoll', dir: 'down', scene: DOLL_HINT },
      // ── 잠든 친구들
      {
        kind: 'npc',
        id: 'bori_sleep',
        at: [9, 12],
        actor: 'bori',
        pose: 'sleep',
        unless: 'woke_bori',
        scene: [
          ...s`
            @emote bori_sleep zz
            toby: 보리야, 일어나!
            bori: 으음… 꿀 한 숟갈만 더…
            toby: 보리!
            @emote bori_sleep !
            bori: 어, 어? 토비? 여기 어디야? 깜깜해. 그리고 배고파.
            toby: 다락방이야. 설명은 이따가 할게. 같이 가자.
            bori: 다락방…? 하루는? 하루가 아침 먹으러 오라고 했어?
            toby: …아니. 그냥 따라와.
            @flag woke_bori
            @join bori
          `,
          ...ALL_AWAKE,
        ],
      },
      {
        kind: 'npc',
        id: 'ruru_sleep',
        at: [17, 15],
        actor: 'ruru',
        pose: 'sleep',
        unless: 'woke_ruru',
        scene: [
          ...s`
            toby: 루루, 일어나.
            > …대답이 없다.
            toby: 루루?
            @emote ruru_sleep !
            @pose ruru_sleep idle
            ruru: 왁!!
            @shake 0.3
            @emote toby !
            toby: 으악!
            ruru: 히히히! 속았지? 너희 올라올 때부터 깨어 있었다구.
            toby: 지금 장난칠 때가 아니야, 루루.
            ruru: 알아, 알아. 「두고 가는 짐」. 다 들었어.
            @emote ruru_sleep …
            ruru: …뭐, 상관없어. 난 원래 혼자서도 잘 놀거든.
            toby: 루루 귀가 축 처졌는데.
            ruru: 안 처졌거든!
            @flag woke_ruru
            @join ruru
          `,
          ...ALL_AWAKE,
        ],
      },
      {
        kind: 'npc',
        id: 'nabi_sleep',
        at: [21, 8],
        actor: 'nabi',
        dir: 'left',
        unless: 'woke_nabi',
        scene: [
          ...s`
            nabi: …시끄러워. 다 들려.
            toby: 나비! 깨어 있었구나.
            nabi: 고양이는 원래 밤에 깨어 있는 거야. 상식이지.
            nabi: 그래서, 하루의 기억을 찾으러 간다고? 깜깜한 데를 헤맬 거면 등불이 있어야 할 텐데.
            ruru: 같이 가고 싶으면 그냥 같이 가고 싶다고 해.
            nabi: …흥. 너희가 길을 잃으면 하루가 슬퍼할 테니까. 그것뿐이야.
            @flag woke_nabi
            @join nabi
          `,
          ...ALL_AWAKE,
        ],
      },
      // ── 기억 조각
      {
        kind: 'memory',
        id: 'm1a',
        at: [10, 3],
        name: '테이프 소리',
        caption: '하루는 토비를 상자에 넣고 「미안」이라 했다',
        when: 'woke_all',
        scene: s`
          @room m_room15
          @show haru haru15 12 8 left hold
          @music piano
          > 이삿날 전날 밤. 하루의 방.
          @wait 0.8
          > 하루가 토비 인형을 한참 내려다본다.
          @emote haru …
          @wait 0.8
          mom: 하루야, 다 쌌니? 내일 아침 일찍 출발이야.
          haru: …거의.
          mom: 장난감 상자는? 그거 다 할머니가 사 주신 것들이잖아.
          @emote haru …
          haru: 다락방에 올려 둘 거야. 새집은 내 방이 좁대매.
          mom: 그래도…
          haru: 엄마. 나 이제 열다섯 살이야. 인형 가지고 놀 나이 아니야.
          > 엄마는 더 말하지 않았다.
          @wait 1
          @face haru left
          @pose haru idle
          @sfx tape
          > 하루는 토비 인형을 상자에 넣고, 뚜껑을 닫았다.
          @wait 1
          haru: …미안.
          > 아주 작은 목소리였다.
          @wait 1
        `,
        after: s`
          bori: 하루가… 미안하다고 했어.
          ruru: 미안하면 안 두고 가면 되잖아. 쳇.
          nabi: 그 얼굴 봤어? 아무렇지 않은 척하는 얼굴이었어.
          toby: …응. 하루는 거짓말할 때 꼭 저렇게 입술을 깨물어.
        `,
      },
      {
        kind: 'memory',
        id: 'm1b',
        at: [21, 12],
        name: '엎어 놓은 사진',
        caption: '할머니와 찍은 사진을 엎어 두었다',
        when: 'woke_all',
        scene: s`
          @room m_room15
          @show haru haru15 8 7 down holdPhoto
          @music piano
          > 하루가 책상 서랍 깊은 곳에서 액자 하나를 꺼냈다.
          @wait 0.6
          haru: …할머니.
          > 사진 속에서 할머니와 네 살짜리 하루가 웃고 있다. 하루의 품에는 하얀 토끼 인형.
          @wait 1.2
          haru: 이것도 상자에 넣어야 하나.
          @emote haru …
          @wait 1.2
          > 하루는 사진을 상자에 넣지 않았다. 대신 엎어서, 가방 맨 밑에 넣었다.
          @pose haru idle
          haru: 보면… 또 생각나니까.
          @wait 1
        `,
        after: s`
          toby: 사진 속 토끼… 나였어.
          bori: 할머니가 하루를 안고 있었어. 하루는 토비를 안고 있었고.
          nabi: 할머니… 하루의 진짜 할머니 말이야. 요즘 통 안 보이셨지.
          ruru: 쉿, 나비.
          @emote nabi …
        `,
      },
      {
        kind: 'memory',
        id: 'm1c',
        at: [27, 3],
        name: '닫힌 방문',
        caption: '할머니 방 문을 또 닫았다',
        when: 'woke_all',
        scene: s`
          @room m_gm14
          @show haru haru15 1 3 down
          @music minor
          > 복도 끝, 할머니 방.
          @wait 0.6
          @walk haru 2 4 30
          @face haru right
          @emote haru …
          > 두 해 동안 아무도 열지 않은 방. 재봉틀 위에 먼지가 소복하다.
          mom: 하루야, 할머니 방 짐은 엄마가 정리할까?
          haru: …아니.
          haru: 내가 할게. 나중에.
          mom: 내일 떠나는데, 나중이 언제야.
          @wait 1.2
          haru: …모르겠어.
          @walk haru 1 3 30
          @sfx door
          @hide haru
          > 하루는 문을 닫았다. 두 해 전 그날처럼.
          @wait 1
        `,
        after: s`
          ruru: 두 해 동안이나 안 열었대.
          bori: 할머니 방에 가면 꿀 냄새가 났는데. 할머니가 타 주시던 꿀차.
          toby: 할머니 방에… 무슨 일이 있었던 걸까.
        `,
      },
      // ── 기억의 문
      {
        kind: 'link',
        id: 'l1',
        at: [5, 13],
        name: '할머니의 바늘',
        icon: 'needle',
        locked: s`
          doll: 아직 기억 조각이 모자라는구나. 반짝이는 조각을 더 찾아보렴.
        `,
        scene: s`
          @bars on
          doll: 기억 조각을 다 모았구나.
          doll: 하루의 마음은 아직 닫힌 문 너머에 있단다. 할머니 방… 그 문을 열어 보렴.
          toby: 할머니 방으로는 어떻게 가요?
          doll: 이 바늘을 따라가렴. 할머니가 평생 쓰시던 바늘이란다.
          nabi: 태엽 할머니는… 하루의 할머니를 잘 알아요?
          doll: …그럼. 아주 잘 알지.
          > 바늘이 은은하게 빛나며, 닫힌 문 너머를 비춘다—
          > 상징물에 깃든 기억이 흐트러져 있다. 조각을 맞춰야 다음 기억으로 이어진다.
          @mini memento1
          @sfx open
          @flag ch1_done
          @sfx memory
          @fade 1 1.4 white
          @next
        `,
      },
      // ── 숨은 장치
      { kind: 'block', id: 'b1', at: [26, 6], look: 'box' },
      // ── 종이별
      { kind: 'star', id: 's1a', at: [2, 3], text: '상자 틈에 끼어 있던 노란 종이별.' },
      { kind: 'star', id: 's1b', at: [28, 16], text: '먼지 속에서 분홍 종이별을 찾았다.' },
      { kind: 'star', id: 's1c', at: [16, 7], text: '창틀 아래 떨어진 하늘색 종이별.' },
      // ── 살펴보기
      {
        kind: 'spot',
        id: 'label',
        at: [4, 13],
        scene: s`
          > 상자 옆면에 노란 쪽지가 붙어 있다. 「두고 가는 짐」.
          @if woke_bori
            bori: 두고 가는… 짐. 우리가 짐이야?
            @if woke_ruru
              ruru: 짐 맞지 뭐. 무겁잖아, 보리 너.
              bori: 나 안 무거워! 솜이야!
            @end
          @else
            toby: 하루 글씨다. 동그랗게 말린 ㄹ… 하루 글씨가 맞아.
          @end
        `,
      },
      {
        kind: 'spot',
        id: 'window',
        at: [11, 2],
        scene: s`
          > 둥근 창으로 달빛이 쏟아진다.
          toby: 하루 방 창문에서도 이 달이 보일까.
          @if woke_nabi
            nabi: 하루는 보름달이 뜨면 꼭 소원을 빌었어. 무슨 소원인지는 끝까지 안 알려 줬지만.
          @end
        `,
      },
      {
        kind: 'spot',
        id: 'raincoat',
        at: [19, 3],
        scene: s`
          > 작아진 노란 비옷이 상자 밖으로 삐져나와 있다.
          @if woke_bori
            bori: 이거 하루가 다섯 살 때 입던 거다! 비 오는 날 마당에서…
            @emote bori ?
            bori: …마당에서 뭐 했더라? 기억이 안 나.
            toby: …나도.
          @else
            toby: 하루의 노란 비옷. 이렇게 작았구나.
          @end
        `,
      },
      {
        kind: 'spot',
        id: 'sewing',
        at: [2, 6],
        scene: s`
          > 낡은 바느질 상자. 실패에 빨간 실이 감겨 있다.
          @if woke_nabi
            nabi: 할머니 바느질 상자야. 내 꼬리도 이 빨간 실로 꿰매 주셨어.
            ruru: 나비 꼬리 뜯어진 거, 사실 내가…
            nabi: 알아. 다 알고 있었어.
            @emote ruru sweat
          @else
            toby: 할머니 바느질 상자가 왜 여기에…
          @end
        `,
      },
      {
        kind: 'spot',
        id: 'hat',
        at: [16, 11],
        scene: s`
          > 구겨진 고깔모자. 「7」이라고 적혀 있다.
          @if woke_ruru
            ruru: 일곱 살 생일! 케이크에 초가 일곱 개였지. 하루가 한 번에 못 끄고 콜록거려서 다 같이 웃었어.
          @else
            toby: 일곱 살 생일 모자다.
          @end
        `,
      },
      {
        kind: 'spot',
        id: 'crayon',
        at: [8, 16],
        scene: s`
          > 크레용 그림 한 장. 할머니와 아이, 그리고 하얀 토끼 한 마리.
          > 삐뚤빼뚤한 글씨: 「평생 같이 놀자」
          toby: …평생.
          @if woke_ruru
            ruru: 평생이 이렇게 짧은 줄 알았나.
            @if woke_bori
              bori: 루루…
            @end
          @end
        `,
      },
      {
        kind: 'spot',
        id: 'stage',
        at: [24, 9],
        scene: s`
          > 상자를 오려 만든 작은 인형극 무대. 빨간 커튼이 반쯤 떨어져 있다.
          @if woke_ruru
            ruru: 토비 극장! 우리가 주인공이었잖아. 할머니가 목소리 연기를 진짜 잘하셨는데.
          @else
            toby: 토비 극장… 오랜만이다.
          @end
        `,
      },
      {
        kind: 'trigger',
        id: 'first_box',
        rect: [24, 7, 5, 1],
        when: 'woke_bori',
        unless: 'mem_m1c',
        scene: s`
          toby: 저 구석에 반짝이는 게 있어. 그런데 상자가 막고 있네.
          bori: 나한테 맡겨! 상자 밀기는 자신 있어.
        `,
      },
    ],
  });
}
