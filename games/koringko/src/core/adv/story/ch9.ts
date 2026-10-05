/** 9장 · 장난감 상자 (4살, 첫 만남) */
import { s } from '../parse.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { grid, toyRoom } from './kit.ts';

const MAP = grid(30, 18, 'w', 'Q', [
  ['v', 15, 1, 1, 16],
  ['Q', 16, 10, 13, 1],
  ['w', 22, 10, 1, 1],
  ['Q', 5, 5, 2, 2],
  ['Q', 10, 11, 2, 2],
  ['O', 3, 9, 1, 1],
  ['O', 12, 3, 1, 1],
  ['O', 20, 6, 1, 1],
  ['O', 26, 14, 1, 1],
]);

export const CH9: Chapter = {
  n: 9,
  title: '9장 · 장난감 상자',
  sub: '4살, 처음 만난 날',
  room: 'toybox',
  start: [3, 15],
  party: ['toby', 'bori', 'ruru', 'nabi'],
  wind: 0.16,
  intro: s`
    @fade 1 0 white
    @bars on
    @music box
    @chtitle
    @fade 0 2
    > 하루의 방, 장난감 상자. 우리가 오랫동안 살던 곳.
    bori: 집이다…
    ruru: 다 비었네. 다락방으로 다 옮겨서.
    nabi: 곰 대장님은 아직 여기 계시네. 너무 커서 상자에 안 들어갔나 봐.
    @sfx windTick
    @wait 0.8
    > 끼…릭. 토비의 태엽이 아주 느리게 돈다.
    @act toby sigh
    toby: …서두르자. 이제 정말 얼마 안 남았어.
    @bars off
    @goal 마지막 기억 조각 일곱 개를 찾자
  `,
};

export function toyboxRoom(): RoomDef {
  return toyRoom('toybox', MAP, {
    name: '장난감 상자',
    theme: 'toybox',
    start: [3, 15],
    music: 'box',
    beams: [{ x: 4, w: 4, h: 14, slant: 5 }],
    things: [
      {
        kind: 'npc',
        id: 'bearboss',
        at: [8, 13],
        actor: 'bear',
        dir: 'down',
        scene: s`
          @if seen_bearboss
            bear: 쿨… 쿨… 하루야, 숙제는 했니… 쿨…
          @else
            bear: 쿠울… 으응? 누구냐… 오, 꼬마들이구나.
            toby: 곰 대장님! 아직 여기 계셨어요?
            bear: 이 몸은 상자에 들어가기엔 너무 크지. 하루가 처음 산 장난감이 나였다는 걸 아느냐? 아니, 사실은 할머니가 산 거지만.
            bear: 하루가 갓난아기 때부터 이 방을 지켰다. 밤마다 하루가 무서운 꿈을 꾸면, 나를 꼭 끌어안았지.
            bear: 요즘은… 아무도 안지 않는구나.
            @emote bear zz
            bori: 다시 잠드셨어.
            ruru: 곰은 원래 잠이 많아. 보리 너처럼.
            @act bori stomp nowait
          bori: 난 곰 대장님만큼은 아니야!
          @end
        `,
      },
      {
        kind: 'memory',
        id: 'm9a',
        at: [4, 3],
        name: '선물 상자',
        caption: '「토비! 토비야!」 하루가 처음 부른 이름',
        scene: s`
          @room m_room4
          @show haru haru4 8 7 up
          @show gm grandma 10 6 left
          @carry gm box gift9a
          @music box
          @sfx birds
          > 하루, 네 살. 할머니가 커다란 선물 상자를 들고 오셨다.
          gm: 하루야, 할머니가 뭐 가져왔게?
          @act haru hop nowait
          haru: 과자!
          @act gm shake nowait
          gm: 땡.
          haru: 사탕!
          @put gm gift9a 9 7
          gm: 땡. 열어 보렴.
          @face haru right
          @sfx tapeRip
          @wait 0.5
          @item gift9a boxOpen
          @sfx cardboard
          > 상자 안에서, 하얀 토끼 인형이 나왔다. 등에 작은 태엽 열쇠가 달린.
          @item toby9a toby 9 7
          @take haru toby9a
          @pose haru hold
          @emote haru !
          @act haru jump nowait
          haru: 토끼다!
          gm: 이름 지어 줄래?
          @act haru think
          haru: 음… 토… 토…
          @emote haru ?
          @act haru cheer nowait
          haru: 토비! 토비야!
          gm: 토비. 좋은 이름이구나.
          @wait 1
        `,
        explore: {
          enter: [2, 9],
          intro: s`
            toby: 하루 방이야. 하루가 네 살이던 날… 내가 처음 온 날.
            ruru: 실 찾기, 알지? 얼른 하자. 나 이 방은 처음 봐.
          `,
          threads: [
            { at: [11, 6], text: s`
              > 할머니가 든 커다란 선물 상자. 안에서 아주 작게, 끼릭.
              toby: 할머니가… 나를 미리 한 번 감아 두셨구나. 하루를 처음 볼 때 걸을 수 있게.
            ` },
            { at: [12, 4], text: s`
              > 화분 옆 바닥에 크레용 몇 자루. 노란색만 몽당하다.
              nabi: 하루는 그때부터 노란색을 좋아했구나.
              bori: 할머니 목도리도 노란색이었지.
            ` },
            { at: [10, 9], text: s`
              > 새로 산 장난감 상자. 텅 빈 바닥에 할머니 글씨로 「하루의 친구들 집」.
              bori: 나는 이날 아직 할머니 방에 있었어. 다음 날 여기로 왔지.
              toby: 그러니까 이 상자에 제일 먼저 들어간 건… 나였구나.
            ` },
          ],
          looks: [
            { at: [8, 6], text: s`
              > 네 살 하루. 발뒤꿈치를 들고 상자 안을 들여다보려 한다.
              ruru: 작다. 진짜 작다.
            ` },
            { at: [10, 5], text: s`
              > 할머니. 상자보다 하루 얼굴을 보고 계신다.
              toby: 처음 만난 날, 먼저 웃고 계셨던 건 할머니였어.
            ` },
          ],
        },
        after: s`
          toby: …토비.
          toby: 하루가 처음으로 불러 준 내 이름이야.
          bori: 이름 엄청 빨리 정해졌네.
          @act ruru laugh nowait
          ruru: 토끼라서 토비. 단순하다, 하루.
          nabi: 네 살이잖아.
        `,
      },
      {
        kind: 'memory',
        id: 'm9b',
        at: [24, 4],
        name: '처음 감은 태엽',
        caption: '「하루가 감아 준 만큼 걷는 거란다」',
        scene: s`
          @room m_room4
          @show haru haru4 7 7 down sit
          @show gm grandma 9 7 left sit
          @carry haru toby toby9b
          @music box
          @sfx birds
          gm: 토비 등에 있는 열쇠 보이지? 이걸 돌리면 토비가 걷는단다.
          @act haru hop
          haru: 내가! 내가 할래!
          @pose haru hold
          @sfx windTick
          @wait 0.6
          @sfx windTick
          @wait 0.6
          @sfx windTick
          > 작은 손으로, 서툴게. 끼릭, 끼릭.
          haru: 됐다!
          @put haru toby9b 7 8
          @pose haru sit
          > 토비가 바닥 위를 아장아장 걸었다. 하루보다도 서툰 걸음으로.
          @sfx windTick
          @item toby9b toby 8 8
          @wait 0.5
          @sfx windTick
          @item toby9b toby 9 8
          @wait 0.3
          @sfx clap
          @emote haru ♪
          @act haru point nowait
          haru: 걷는다! 할머니, 토비가 걸어!
          gm: 그래. 하루가 감아 준 만큼 걷는 거란다.
          haru: 그럼 많이 감아 줄게! 계속계속 걷게!
          gm: 허허. 계속계속 걷게 하려면, 매일 조금씩 감아 주면 된단다.
          @wait 1
        `,
        after: s`
          toby: 하루가 감아 준 만큼 걷는다.
          toby: …그래서 이제 태엽이 거의 없는 거야. 하루가 감아 주지 않아서.
          @emote toby …
          nabi: 토비. 아직 시간 있어.
          bori: 우리 다 같이 있잖아.
        `,
      },
      {
        kind: 'memory',
        id: 'm9c',
        at: [25, 13],
        name: '평생 같이 놀자',
        caption: '「토비가 할머니 대신 평생 같이 놀아 줄 거야」',
        dark: true,
        scene: s`
          @room m_room4
          @show haru haru4 15 5 down sleep
          @show gm grandma 13 6 right
          @music box
          @sfx crickets
          > 그날 밤. 하루는 토비를 꼭 안고 침대에 누웠다.
          haru: 할머니, 토비랑 나랑 평생 같이 놀 거야.
          gm: 평생이라. 그거 아주 긴 약속이구나.
          @act haru nod nowait
          haru: 응! 할머니도 평생!
          @wait 1.8
          gm: …그래. 할머니도.
          haru: 약속!
          gm: 약속.
          > 할머니는 하루가 잠들 때까지 이불을 토닥였다. 토닥, 토닥.
          @sfx blanket
          @sfx pat
          @wait 0.8
          @sfx pat
          @wait 0.7
          gm: 우리 하루. 할머니가 평생은 못 있어 줘도…
          gm: 토비가 있잖니.
          gm: 토비야. 할머니 대신, 우리 하루랑 평생 같이 놀아 주렴.
          @wait 1.5
        `,
        explore: {
          enter: [2, 9],
          intro: s`
            > 그날 밤. 작은 스탠드 하나만 켜져 있다.
            toby: 이 밤은… 나도 잘 기억이 안 나. 하루 품에서 꾸벅꾸벅 졸았거든.
          `,
          threads: [
            { at: [8, 3], text: s`
              > 창밖에 별 하나가 유난히 밝다.
              nabi: 저 별… 나중에 하루가 「하루 별」이라고 부르게 되는 별이야.
            ` },
            { at: [10, 9], text: s`
              > 장난감 상자 뚜껑이 닫혀 있다. 첫날 밤부터 토비는 상자가 아니라 하루 품이다.
              bori: 이 시간에 나는 할머니 무릎 위에 있었어. 할머니가 내 단추 눈을 단단히 꿰매 주셨지. 내일부터 하루 친구 하라고.
            ` },
            { at: [13, 7], text: s`
              > 바닥에 할머니 실내화 한 짝. 발소리 안 나게 벗어 두고 들어오셨나 보다.
              ruru: 할머니, 은근히 작전가라니까.
            ` },
          ],
          looks: [
            { at: [13, 5], text: s`
              > 할머니. 이불 위에 얹은 손이 토닥이던 그대로 멈춰 있다.
              toby: 할머니 손은… 늘 따뜻했어.
            ` },
            { at: [15, 7], text: s`
              > 침대 위 하루. 토비를 안은 채 눈이 반쯤 감겼다.
              bori: 졸린 얼굴이다. 꿀 먹은 것처럼.
            ` },
          ],
        },
        after: s`
          @emote toby …
          toby: 기억났어. 전부.
          toby: 할머니가 나한테 부탁하셨어. "하루랑 평생 같이 놀아 주렴." 그날 밤, 하루가 잠든 뒤에.
          toby: 그래서 나는… 깨어난 거야. 하루 곁에 있으려고.
          bori: 그럼 우리가 할 일은 하나야.
          @act ruru point nowait
          ruru: 하루한테 가자. 상자가 차에 실리기 전에.
          nabi: 새벽이 오고 있어.
        `,
      },
      {
        kind: 'link',
        id: 'l9',
        at: [10, 7],
        name: '크레용 그림',
        icon: 'photo',
        locked: s`toby: 아직이야. 마지막 기억까지… 조금만 더.`,
        scene: s`
          @bars on
          > 장난감 상자 바닥에 크레용 그림이 붙어 있다. 할머니, 하루, 그리고 하얀 토끼. 「평생 같이 놀자」.
          @emote bori !
          bori: …킁킁. 이거 꿀 냄새다.
          @act ruru shrug nowait
          ruru: 지금? 이 와중에?
          bori: 상자 틈으로 들어와. 부엌 찬장 쪽이야. 할머니 꿀단지 냄새.
          bori: 다락방 가기 전에… 너희한테 보여 주고 싶은 게 있어. 하루보다 더 옛날 이야기.
          toby: 보리가 먼저 가자고 하는 건 처음이네. 가자, 찬장으로.
          > 상징물에 깃든 기억이 흐트러져 있다. 조각을 맞춰야 다음 기억으로 이어진다.
          @mini memento18
          @sfx open
          @flag ch9_done
          @sfx memory
          @fade 1 1.6 white
          @next
        `,
      },
      { kind: 'gap', id: 'g9', at: [14, 8], tiles: [[15, 8]] },
      { kind: 'block', id: 'b9', at: [22, 10], look: 'block' },
      {
        kind: 'trigger',
        id: 't9gap',
        rect: [12, 6, 3, 5],
        unless: 'gap_g9',
        scene: s`ruru: 마지막 밧줄이야. 멋지게 걸어 줄게!`,
      },
      {
        kind: 'trigger',
        id: 't9block',
        rect: [20, 8, 5, 2],
        unless: 'mem_m9c',
        scene: s`
          bori: 블록 밑으로 내려가는 길이야. 위에서 밀게!
          nabi: 아래는 깜깜해. 내 등불을 따라와.
        `,
      },
      { kind: 'star', id: 's9a', at: [1, 1], text: '블록 틈에 낀 종이별.' },
      { kind: 'star', id: 's9b', at: [28, 1], text: '구슬 옆의 종이별.' },
      { kind: 'star', id: 's9c', at: [13, 16], text: '상자 모서리의 종이별.' },
      { kind: 'star', id: 's9d', at: [28, 16], text: '어둠 속에서 빛나는 마지막 종이별.', dark: true },
      {
        kind: 'spot',
        id: 'blocks9',
        at: [8, 5],
        scene: s`
          @sfx thud
          > 「ㅎ ㅏ ㄹ ㅜ」 글자 블록이 나란히 놓여 있다.
          ruru: 하루가 처음 쓴 자기 이름이야. 「ㄹ」을 거꾸로 놓아서 할머니가 웃으셨지.
        `,
      },
      {
        kind: 'spot',
        id: 'pacifier',
        at: [2, 11],
        scene: s`
          @sfx chime
          > 조그만 딸랑이.
          bori: 하루 아기 때 거야. 할머니가 흔들면 하루가 꺄르르 웃었대.
        `,
      },
      {
        kind: 'spot',
        id: 'marbles9',
        at: [19, 3],
        scene: s`
          > 구슬 주머니. 구슬이 몇 개 굴러 나와 있다.
          nabi: 구슬 하나하나에 하루 얼굴이 비쳐 있던 시절이 있었지.
        `,
      },
      {
        kind: 'spot',
        id: 'note9',
        at: [26, 8],
        scene: s`
          > 상자 안쪽 벽에 할머니 글씨. 「하루의 친구들 집」.
          toby: …할머니가 써 주신 거야. 우리 집이라고.
        `,
      },
    ],
  });
}
