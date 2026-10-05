/** 3장 · 침대 밑 (13살, 할머니가 떠난 날 밤) */
import { s } from '../parse.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { toyRoom } from './kit.ts';

const MAP = [
  'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
  'YuuuuuuuuuuYYYYYYuuuuuuuuuuuuY',
  'YuuuuuuuuuuuYYYYuuuuuuuuLuuuuY',
  'YuuLuuuuuuuuuuuuuuuuuuuuuuuuuY',
  'YuuuuuYYYuuuuuuuuuYYYuuuuuuuuY',
  'YuuuuuYYYuuuuuuuuuYYYuuuuYYuuY',
  'YYYuuuuuuuuuuLuuuuuuuuuuuYYuuY',
  'YYYuuuuuuuuuuuuuuuuuuuuuuuuuuY',
  'YuuuuuuuuYYYYuuuuuuuuuuuuuuuuY',
  'YuuuuuuuuYYYYuuuuuuYYYYuuuuuuY',
  'YuuuLuuuuuuuuuuuuuuYYYYuuuLuuY',
  'YuuuuuuuuuuuuuuuuuuuuuuuuuuuuY',
  'YuuuuuYYuuuuuuLuuuuuuuuuuuuuuY',
  'YuuuuuYYuuuuuuuuuuuuuuuYYYuuuY',
  'YuuuuuuuuuuuuuuuuuuuuuuYYYuuuY',
  'YuuuuuuuuuuuuuuuuuuuuuuuuuuuuY',
  'YuuuuuuuuuuuuuuuuuuuuuuuuuuuuY',
  'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
];

export const CH3: Chapter = {
  n: 3,
  title: '3장 · 침대 밑',
  sub: '13살, 할머니가 떠난 날 밤',
  room: 'underbed',
  start: [2, 15],
  party: ['toby', 'bori', 'ruru'],
  wind: 0.7,
  intro: s`
    @fade 1 0 white
    @bars on
    @music dark
    @chtitle
    @fade 0 2
    > 하루의 침대 밑. 아무도 치우지 않은 먼지가 소복하다.
    toby: 깜깜해… 아무것도 안 보여.
    bori: 나비! 등불 좀 켜 줘.
    @wait 0.6
    @emote bori ?
    bori: 나비? 나비 어디 갔어?
    ruru: 방금까지 맨 뒤에 있었는데!
    toby: 침대 밑으로 들어오다가 길을 잃었나 봐. 찾아야 해.
    @bars off
    @goal 어둠 속에서 나비를 찾자
  `,
};

export function underbedRoom(): RoomDef {
  return toyRoom('underbed', MAP, {
    name: '침대 밑',
    theme: 'cave',
    start: [2, 15],
    music: 'dark',
    lights: [{ at: [2, 15], r: 60, color: [255, 200, 140], k: 0.3 }],
    things: [
      {
        kind: 'npc',
        id: 'nabi_lost',
        at: [27, 2],
        actor: 'nabi',
        dir: 'down',
        unless: 'found_nabi',
        scene: s`
          @emote nabi_lost !
          nabi: 누, 누구야!
          toby: 나야, 토비. 괜찮아?
          nabi: 괜찮아. 당연히 괜찮지. 고양이는 어둠을 무서워하지 않아.
          ruru: 꼬리가 바들바들 떨리는데?
          nabi: 추워서 그래!
          @emote nabi_lost …
          nabi: …사실, 여기 너무 조용해서. 하루가 울던 소리가 아직 남아 있는 것 같아.
          toby: 같이 가자, 나비. 네 등불이 있어야 기억 조각이 보여.
          nabi: …흥. 그렇게까지 부탁한다면.
          @flag found_nabi
          @join nabi
          @goal 나비의 등불로 어둠 속 기억 조각을 찾자
        `,
      },
      {
        kind: 'npc',
        id: 'dustbun',
        at: [12, 15],
        actor: 'dusty',
        dir: 'left',
        scene: s`
          @if seen_dustbun
            dusty: 부스스… 여기 먼지는 다 하루의 한숨이야. 하나하나 다 기억하지.
          @else
            dusty: 부스스… 손님이네. 이 침대 밑에 누가 오는 건 정말 오랜만이야.
            toby: 누구세요?
            dusty: 나는 먼지 뭉치. 다들 더스티라고 부르지. 여기서 오래오래 쌓였어.
            dusty: 두 해 전 그날 밤, 침대가 밤새 흔들렸어. 하루가 울어서.
            dusty: 그다음부턴 아무도 여길 들여다보지 않았지. 그래서 이렇게 커졌어.
            bori: 엄청 크다…
            dusty: 너희가 찾는 건 저 안쪽에 있을 거야. 등불을 들고 가렴.
          @end
        `,
      },
      {
        kind: 'memory',
        id: 'm3a',
        at: [5, 2],
        name: '검은 옷',
        caption: '장례식에서 돌아온 밤, 하루는 밥을 먹지 않았다',
        dark: true,
        scene: s`
          @room m_room13
          @show haru haru13 13 7 down sit
          @music minor
          > 할머니가 떠난 날. 장례식이 끝나고 돌아온 밤.
          > 하루는 검은 옷을 갈아입지도 않고 침대 끝에 앉아 있다.
          @show mom mom 1 3 down
          mom: 하루야… 밥 조금이라도 먹자.
          haru: 안 먹어.
          mom: 하루야.
          haru: 안 먹는다고.
          @wait 1
          mom: …문 열어 둘게. 배고프면 나와.
          @hide mom
          > 하루는 대답하지 않았다. 책상 위, 종이별이 가득한 유리병만 바라보고 있었다.
          @wait 1.2
        `,
        after: s`
          bori: 하루가 밥을 안 먹었어. 하루가 밥을 안 먹은 날은 처음이야.
          ruru: 너는 꼭 그런 것만 기억하더라.
          bori: 중요한 거야! 밥을 안 먹는 건 정말 슬프다는 거야.
          @emote ruru …
          ruru: …그러네.
        `,
      },
      {
        kind: 'memory',
        id: 'm3b',
        at: [14, 7],
        name: '구백구십구',
        caption: '하나만 더 접으면 천 개였다',
        dark: true,
        scene: s`
          @room m_room13
          @show haru haru13 3 5 up
          @music minor
          > 하루가 유리병을 쏟았다. 별들이 책상 위로 와르르 흩어진다.
          haru: 구백구십칠, 구백구십팔… 구백구십구.
          @wait 1
          haru: 천 개 접으면 할머니 낫는다고 했잖아.
          haru: 하나만… 딱 하나만 더 접으면 됐는데.
          @pose haru holdStar
          > 하루가 마지막 종이띠를 집었다. 접고, 또 접다가—
          @wait 1.2
          @pose haru idle
          @emote haru …
          haru: …이제 접어서 뭐 해.
          @sfx pop
          > 반쯤 접힌 종이별이 하루의 손에서 미끄러져, 침대 밑으로 굴러 들어갔다.
          @wait 1.2
        `,
        after: s`
          toby: 침대 밑으로… 그럼 그 별이 지금 여기 어딘가에 있다는 거야?
          nabi: 내 등불로 비추면 찾을 수 있을 거야.
        `,
      },
      {
        kind: 'memory',
        id: 'm3c',
        at: [27, 15],
        name: '마지막 태엽',
        caption: '하루가 토비의 태엽을 마지막으로 감던 새벽',
        dark: true,
        scene: s`
          @room m_room13
          @show haru haru13 11 6 down
          @music minor
          > 새벽. 하루는 잠들지 못하고 장난감 상자를 열었다.
          @pose haru hold
          haru: …토비야.
          @pose haru hug
          > 하루가 토비를 꼭 끌어안는다.
          haru: 할머니가… 이제 없대. 아무리 불러도 대답을 안 해.
          haru: 할머니가 그랬잖아. 태엽이 멈추지 않게 매일 감아 주라고.
          @pose haru hold
          @sfx windTick
          @wait 0.35
          @sfx windTick
          @wait 0.35
          @sfx windTick
          > 끼릭, 끼릭. 하루가 토비의 태엽을 감는다. 천천히, 아주 천천히.
          haru: 그런데 할머니 태엽은… 누가 감아 줬어야 했던 거야?
          @pose haru cry
          @wait 1.5
          haru: 이게 마지막이야, 토비.
          haru: 너를 보면… 자꾸 할머니가 생각나.
          @pose haru idle
          @sfx thud
          > 하루는 토비를 상자에 넣고, 뚜껑 위에 쪽지를 붙였다. 「열지 마」.
          @wait 1.2
        `,
        after: s`
          @emote toby …
          toby: …기억났어. 그날 새벽.
          toby: 하루가 날 안고 울었어. 그리고 태엽을 감아 줬어. 그게 마지막이었어.
          bori: 토비…
          toby: 하루는 우리가 싫어진 게 아니었어. 우리를 보면 할머니가 생각나서… 너무 아파서.
          nabi: 슬픔이 너무 크면, 사랑하는 것까지 상자에 넣어 버리게 되는 거야.
          ruru: …그런 거 몰라. 몰라도 돼.
          @emote ruru tear
        `,
      },
      {
        kind: 'link',
        id: 'l3',
        at: [15, 13],
        name: '접다 만 종이별',
        icon: 'halfstar',
        locked: s`nabi: 아직 어둠 속에 기억이 남아 있어. 내 등불로 더 비춰 보자.`,
        scene: s`
          @bars on
          > 먼지 속에 반쯤 접힌 노란 종이별이 떨어져 있다.
          toby: 찾았다… 하루가 접다 만 천 번째 별.
          toby: 이건 내가 가지고 갈게. 언젠가 하루에게 돌려줘야 하니까.
          @flag got_halfstar
          @sfx star
          @emote nabi …
          nabi: …저기. 다음은 내가 가 보고 싶은 데가 있어.
          ruru: 나비가 먼저 말을 꺼내다니. 별일이네.
          nabi: 이불장. 하루가 날 넣어 두었던 곳.
          nabi: 하루가 깜깜한 걸 무서워하던 밤들… 내가 다 봤어. 거기 가면 보일 거야.
          toby: 가자, 나비. 이번엔 네가 앞장서.
          > 상징물에 깃든 기억이 흐트러져 있다. 조각을 맞춰야 다음 기억으로 이어진다.
          @mini memento3
          @sfx open
          @flag ch3_done
          @sfx memory
          @fade 1 1.4 white
          @next
        `,
      },
      { kind: 'star', id: 's3a', at: [9, 1], text: '먼지 속에서 빛나는 하얀 종이별.', dark: true },
      { kind: 'star', id: 's3b', at: [21, 6], text: '양말 속에 들어가 있던 종이별.', dark: true },
      { kind: 'star', id: 's3c', at: [1, 9], text: '구석에 끼어 있던 납작한 종이별.', dark: true },
      { kind: 'star', id: 's3d', at: [24, 12], text: '거미줄에 걸린 작은 종이별.', dark: true },
      {
        kind: 'spot',
        id: 'sock',
        at: [6, 11],
        scene: s`
          > 짝 잃은 양말 한 짝. 작은 별무늬가 있다.
          ruru: 하루가 이거 찾는다고 온 집을 뒤집었었는데. 여기 있었네.
        `,
      },
      {
        kind: 'spot',
        id: 'car',
        at: [17, 3],
        scene: s`
          > 바퀴 하나가 빠진 장난감 자동차.
          bori: 이 친구도 상자에 못 들어갔구나.
          toby: 침대 밑에서 혼자… 얼마나 오래 있었을까.
        `,
      },
      {
        kind: 'spot',
        id: 'drawing',
        at: [24, 10],
        scene: s`
          > 구겨진 그림 한 장. 「할머니 빨리 나으세요」. 별 스티커가 잔뜩 붙어 있다.
          @emote nabi …
          toby: 병원에 가져가려던 그림이었나 봐.
        `,
      },
      {
        kind: 'spot',
        id: 'crayon3',
        at: [3, 6],
        scene: s`
          > 반으로 부러진 노란 크레용.
          bori: 하루는 노란색을 제일 좋아했어. 그래서 노란 크레용이 제일 먼저 닳았지.
        `,
      },
      {
        kind: 'spot',
        id: 'tissue',
        at: [10, 11],
        scene: s`
          > 똘똘 뭉친 휴지 뭉치가 여러 개.
          nabi: …눈물 닦은 휴지야.
          ruru: 이렇게나 많이?
        `,
      },
    ],
  });
}
