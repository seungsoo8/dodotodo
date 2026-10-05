/** 5장 · 책상 (10살, 할머니가 종이별 접기를 알려 준 날) */
import { s } from '../parse.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { grid, toyRoom } from './kit.ts';

const MAP = grid(28, 16, 'd', 'E', [
  ['v', 10, 1, 1, 14],
  ['v', 18, 1, 1, 14],
  ['G', 4, 3, 1, 1],
  ['G', 6, 11, 1, 1],
  ['G', 14, 5, 1, 1],
  ['G', 15, 12, 1, 1],
  ['G', 22, 4, 1, 1],
  ['G', 21, 10, 1, 1],
  ['E', 24, 12, 3, 1],
  ['E', 24, 14, 1, 1],
]);

export const CH5: Chapter = {
  n: 5,
  title: '5장 · 책상',
  sub: '10살, 종이별을 처음 배운 날',
  room: 'desk',
  start: [3, 13],
  party: ['toby', 'bori', 'ruru', 'nabi'],
  wind: 0.5,
  intro: s`
    @fade 1 0 white
    @bars on
    @music night
    @chtitle
    @fade 0 2
    > 하루의 책상 위. 공책과 교과서가 섬처럼 놓여 있다.
    bori: 높다… 책상 위는 처음 올라와 봐.
    ruru: 공책 사이가 다 낭떠러지네. 오늘 내 밧줄이 바쁘겠어.
    nabi: 저기 저 깡통 병정, 아직도 서 있네. 하루 숙제를 지킨다던.
    @emote toby sweat
    toby: …다들, 조금만 서두르자.
    bori: 토비? 왜?
    toby: 아무것도 아니야. 태엽이 조금 느려진 것 같아서.
    @bars off
    @goal 기억 조각 일곱 개를 찾자
    @flag ch5_in
  `,
};

export function deskRoom(): RoomDef {
  return toyRoom('desk', MAP, {
    name: '책상',
    theme: 'factory',
    start: [3, 13],
    music: 'night',
    lights: [{ at: [6, 2], r: 140, color: [255, 214, 150], k: 0.55 }],
    things: [
      {
        kind: 'npc',
        id: 'tinguard',
        at: [15, 9],
        actor: 'tin',
        dir: 'left',
        scene: s`
          @if seen_tinguard
            tin: 충성! 숙제는 끝까지! 종이별도 끝까지!
          @else
            tin: 정지! 누구냐! 암호를 대라!
            ruru: 암호? 음… 꿀?
            tin: …통과! 그건 보리 장군의 암호였지. 오랜만이다, 장난감 상자 친구들.
            toby: 깡통 장군님! 아직도 책상을 지키고 계셨어요?
            tin: 물론이다. 하루 일병이 숙제를 다 할 때까지 자리를 지키는 것이 내 임무다.
            tin: 그런데… 하루 일병은 요즘 숙제를 할 때 나를 보지 않더군. 대신 자꾸 창밖을 본다.
            nabi: 할머니 생각을 하는 거예요.
            tin: …그렇군. 그렇다면 더 잘 지켜야겠군. 충성!
          @end
        `,
      },
      {
        kind: 'memory',
        id: 'm5a',
        at: [5, 2],
        name: '종이별 접는 법',
        caption: '「천 개를 접으면 소원이 하나 이루어진단다」',
        scene: s`
          @room m_room10
          @show haru haru10 3 5 up
          @show gm grandma 5 5 left
          @music grandma
          > 하루, 열 살. 할머니가 알록달록한 종이띠를 한 묶음 가져오셨다.
          gm: 하루야, 할머니가 재밌는 거 알려 줄까?
          @face haru gm
          haru: 뭔데?
          gm: 종이별. 이 띠를 이렇게 묶고… 접고, 또 접고… 그리고 살짝 눌러 주면.
          @sfx pop
          gm: 짠. 별이 되지.
          @emote haru !
          haru: 우와! 나도 할래!
          gm: 그래, 할머니 손을 잘 보렴.
          @face haru up
          @mini stars
          gm: 아이고, 우리 하루 손이 야무지네. 할머니보다 예쁘게 접었구나.
          @face haru gm
          haru: 할머니, 이거 몇 개 접어야 돼?
          gm: 천 개를 접으면 소원이 하나 이루어진단다.
          haru: 진짜? 천 개?
          gm: 그럼. 대신 한 개 한 개 마음을 담아서 접어야 해. 대충 접으면 하늘이 다 알아.
          haru: 그럼 뭐 빌지…
          @emote haru ?
          haru: 비밀! 천 개 다 접으면 알려 줄게.
          gm: 허허, 그래. 기다리마.
          @wait 1
        `,
        after: s`
          ruru: 할머니가 처음 알려 줬구나, 종이별.
          bori: 하루 첫 소원은 뭐였을까?
          toby: …천 개 다 접으면 알려 준댔잖아.
        `,
      },
      {
        kind: 'memory',
        id: 'm5b',
        at: [14, 2],
        name: '할머니를 닮은 인형',
        caption: '할머니가 손수 만든 태엽 할머니',
        scene: s`
          @room m_gm
          @show gm grandma 3 4 up sit
          @show haru haru10 1 3 down
          @music box
          > 할머니 방에서 재봉틀 소리가 났다. 드르륵, 드르륵.
          @walk haru 6 5 40
          @face haru gm
          haru: 할머니, 뭐 만들어?
          gm: 쉿, 비밀이었는데. 들켰네.
          @face gm haru
          @pose gm holdDoll
          gm: 짠. 할머니를 꼭 닮은 인형이란다.
          @emote haru !
          haru: 진짜 할머니 같아! 안경도 있고, 머리도 동그랗고!
          gm: 할머니가 바빠서 못 놀아 줄 때 이 인형이 대신 놀아 줄 거야. 토비 태엽도 대신 감아 주고.
          haru: 인형이 어떻게 태엽을 감아?
          gm: 마음이 있으면 다 할 수 있지. 장난감도, 사람도.
          haru: 그럼 이름은… 태엽 할머니!
          gm: 태엽 할머니? 허허, 그거 좋구나.
          @pose gm sit
          gm: 하루야. 할머니가 혹시 멀리 가더라도, 태엽 할머니가 하루랑 토비 곁에 있어 줄 거야.
          haru: 할머니가 어딜 가. 할머니는 맨날 여기 있잖아.
          @wait 1
          gm: …그래. 맨날 여기 있지.
          @wait 1
        `,
        after: s`
          @emote nabi …
          nabi: …역시. 태엽 할머니는 할머니가 만든 인형이었어.
          toby: 그래서 태엽 할머니가 할머니처럼 말했던 거구나. "태엽은 천천히 감아야 오래 간단다."
          bori: 할머니 마음이 들어 있어서 그래.
          ruru: 그럼 다락방에서 기다리는 태엽 할머니도… 할머니 마음으로 우리를 보낸 거야?
          toby: …응. 분명 그럴 거야.
        `,
      },
      {
        kind: 'memory',
        id: 'm5c',
        at: [25, 14],
        name: '기침',
        caption: '하루의 소원: 「할머니 감기 낫게 해 주세요」',
        scene: s`
          @room m_room10
          @show haru haru10 3 5 up
          @show gm grandma 5 5 left
          @music grandma
          > 저녁. 둘은 나란히 앉아 별을 접었다.
          gm: 콜록, 콜록.
          @emote haru ?
          @face haru gm
          haru: 할머니, 감기야?
          gm: 응, 감기란다. 금방 낫지.
          gm: 콜록… 콜록콜록.
          @emote haru …
          haru: 할머니 요즘 맨날 기침해.
          gm: 날이 추워서 그래. 걱정 마.
          @wait 1
          haru: …정했다.
          gm: 응?
          haru: 소원. 천 개 다 접으면 할머니 감기 낫게 해 달라고 빌 거야.
          @wait 1.5
          gm: …우리 하루. 그럼 할머니가 천 개 될 때까지 기다려야겠네.
          haru: 응! 금방 접을게. 일 년이면 돼!
          > 할머니는 하루의 머리를 오래오래 쓰다듬었다.
          @wait 1.2
        `,
        after: s`
          toby: 그게 하루의 소원이었어. 할머니 감기가 낫는 것.
          ruru: 감기가 아니었잖아.
          @emote ruru anger
          ruru: 할머니는 알고 계셨잖아! 왜 말 안 했어? 그랬으면 하루가…
          nabi: 루루.
          ruru: …그랬으면 하루가 그렇게까지 아프진 않았을 거 아냐.
          bori: 할머니는 하루가 웃는 걸 오래 보고 싶으셨던 거야. 끝까지.
          @emote ruru …
        `,
      },
      {
        kind: 'link',
        id: 'l5',
        at: [22, 7],
        name: '인형극 무대',
        icon: 'puppet',
        locked: s`toby: 아직 기억 조각이 남아 있어. 공책 섬들을 더 건너 보자.`,
        scene: s`
          @bars on
          > 책상 너머 책장 꼭대기에, 상자로 만든 인형극 무대가 보인다. 빨간 커튼.
          ruru: 토비 극장이다!
          bori: 하루가 여덟 살 때, 할머니랑 매주 토요일마다 했잖아.
          nabi: 그날… 할머니가 우리 이야기를 해 줬어. 우리가 어디서 왔는지.
          @sfx drip
          > 어디선가 톡, 톡. 욕실 수도꼭지 소리.
          bori: 그 전에 욕실! 아홉 살 하루가 거기서 대본 연습을 했잖아. 비누 거품 수염 붙이고.
          toby: 가자. 웃음소리가 남은 곳부터.
          > 상징물에 깃든 기억이 흐트러져 있다. 조각을 맞춰야 다음 기억으로 이어진다.
          @mini memento9
          @sfx open
          @flag ch5_done
          @sfx memory
          @fade 1 1.4 white
          @next
        `,
      },
      { kind: 'gap', id: 'g5a', at: [9, 7], tiles: [[10, 7]] },
      { kind: 'gap', id: 'g5b', at: [17, 10], tiles: [[18, 10]] },
      { kind: 'block', id: 'b5', at: [24, 13], look: 'book' },
      {
        kind: 'trigger',
        id: 't5gap',
        rect: [7, 5, 3, 5],
        unless: 'gap_g5a',
        scene: s`ruru: 공책 섬 사이에 밧줄을 걸자. 낭떠러지 끝에 서서 나를 불러!`,
      },
      {
        kind: 'trigger',
        id: 't5book',
        rect: [21, 12, 3, 3],
        unless: 'mem_m5c',
        scene: s`bori: 책이 길을 막고 있어. 내가 밀게! 책 왼쪽에 서 봐.`,
      },
      { kind: 'star', id: 's5a', at: [1, 1], text: '지우개 가루 속의 종이별.' },
      { kind: 'star', id: 's5b', at: [16, 14], text: '필통 옆에 떨어진 종이별.' },
      { kind: 'star', id: 's5c', at: [26, 1], text: '연필깎이 밑의 종이별.' },
      { kind: 'star', id: 's5d', at: [26, 14], text: '책 뒤에 숨어 있던 반짝이 종이별.' },
      {
        kind: 'spot',
        id: 'homework',
        at: [7, 9],
        scene: s`
          > 펼쳐진 수학 공책. 귀퉁이에 낙서가 있다. 토끼, 곰, 여우, 고양이.
          bori: 우리다!
          ruru: 내 꼬리가 너무 짧게 그려졌는데.
          nabi: 나는 예쁘게 그렸네. 역시 하루는 보는 눈이 있어.
        `,
      },
      {
        kind: 'spot',
        id: 'lamp',
        at: [2, 4],
        scene: s`
          > 스탠드 불빛이 따뜻하다. 하루가 끄는 걸 잊었나 보다.
          toby: 하루는 요즘 밤늦게까지 불을 켜 두고 잠들어. 어두운 게 싫대.
        `,
      },
      {
        kind: 'spot',
        id: 'diary',
        at: [13, 13],
        scene: s`
          > 「일기장」. 자물쇠가 잠겨 있다.
          ruru: 열어 볼까?
          nabi: 루루.
          ruru: 농담이야, 농담.
        `,
      },
      {
        kind: 'spot',
        id: 'strip',
        at: [20, 2],
        scene: s`
          > 쓰지 않은 종이띠 한 묶음. 고무줄로 묶여 있다.
          toby: 할머니가 사 오신 종이띠야. 아직 이렇게 많이 남았네.
        `,
      },
      {
        kind: 'spot',
        id: 'sticker',
        at: [12, 9],
        scene: s`
          > 책상 위에 붙은 별 스티커. 「참 잘했어요」.
          bori: 할머니가 하루 숙제 다 하면 붙여 주던 스티커야.
        `,
      },
    ],
  });
}
