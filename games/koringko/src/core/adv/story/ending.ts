/** 마지막 장 · 새벽 (15살, 이삿날 아침) — 엔딩 */
import { s } from '../parse.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { ATTIC } from './ch1.ts';
import { house, toyRoom } from './kit.ts';

export const END: Chapter = {
  n: 10,
  title: '마지막 장 · 새벽',
  sub: '15살, 이삿날 아침',
  room: 'attic_dawn',
  start: [5, 15],
  party: ['toby', 'bori', 'ruru', 'nabi'],
  wind: 0.06,
  intro: s`
    @fade 1 0 white
    @bars on
    @music none
    @title 마지막 장 · 새벽 | 15살, 이삿날 아침
    @fade 0 2.5
    @music night
    > 다락방. 둥근 창 너머 하늘이 분홍빛으로 물들기 시작했다.
    @face toby doll
    doll: 다들 돌아왔구나.
    toby: 태엽 할머니! 다 보고 왔어요. 하루가 왜 우리를 두고 가려는지.
    doll: 그래. 무엇을 보았니?
    toby: 하루는 우리를 잊은 게 아니었어요. 우리를 보면… 할머니가 생각나서. 너무 보고 싶어서.
    doll: …그래. 슬픔이 너무 크면, 사람은 사랑했던 것까지 상자에 넣어 버리기도 한단다.
    ruru: 그럼 어떡해요! 상자째로 두고 간다는데!
    toby: 이걸 하루한테 돌려줄 거예요. 하루가 접다 만 천 번째 별.
    @sfx windTick
    @wait 0.8
    @sfx windTick
    @wait 1.2
    > 끼…릭.
    @pose toby stop
    @shake 0.3
    @sfx thud
    bori: 토비!
    nabi: 태엽이…!
    ruru: 토비, 일어나! 장난치지 마!
    > 토비는 움직이지 않았다.
    @wait 1.8
    doll: …다들, 비켜 보렴.
    @walk doll 6 15 14
    doll: 이 할머니 태엽도 이제 얼마 안 남았지만…
    doll: 마지막 태엽은 이 할머니가 감아 주마. 할머니가 그러라고 나를 만들었으니까.
    @sfx windTick
    @wait 0.5
    @sfx windTick
    @wait 0.5
    @sfx windTick
    > 끼릭, 끼릭, 끼릭. 아주 천천히.
    @wind 0.3
    @pose toby idle
    @emote toby !
    toby: …태엽 할머니?
    doll: 하루에게 전해 주렴.
    doll: 할머니는 하나도 안 아프다고. 그리고… 고맙다고. 매일매일 웃어 줘서.
    @pose doll stop
    @wait 2
    toby: 태엽 할머니…!
    nabi: …멈췄어.
    @emote bori tear
    @emote ruru tear
    @wait 1.5
    @sfx steps
    > 쿵, 쿵, 쿵. 계단을 오르는 발소리.
    ruru: 하루야! 하루가 와!
    toby: 다들, 자리로! 별을 상자 위에!
    @sfx pop
    > 토비가 반쪽 별을 상자 위에 올려놓았다. 그리고—
    toby: 얼음!
    @fade 1 1.2
    @room h_attic
    @tone dawn
    @show haru haru15 8 9 up
    @music piano
    @fade 0 2
    > 하루가 다락방에 올라왔다. 마지막 짐을 내리러.
    @walk haru 8 6 30
    haru: …이것만 내리면 끝.
    @emote haru ?
    > 상자 위에 무언가 놓여 있다. 노란 종이별. 반쯤 접힌.
    @pose haru holdStar
    haru: 이거…
    haru: 내가 접다 만…
    @wait 1.2
    > 「천 개를 접으면 소원이 하나 이루어진단다.」
    > 「태엽은 천천히 감아야 오래 간단다.」
    > 「평생이라. 그거 아주 긴 약속이구나.」
    @wait 1
    @pose haru sit
    haru: …할머니.
    haru: 나, 천 개 다 못 접었어. 할머니 앞에서 접으려고 했는데.
    haru: 접으면… 정말로 할머니가 없는 게 될까 봐.
    @wait 1.5
    haru: …그래도 접을게. 이번엔 끝까지.
    @mini star1000
    @sfx star
    > 천 번째 별.
    @wait 1
    haru: 할머니. 소원 빌어도 돼?
    @choice wish | 할머니, 고마워요. | 토비랑 계속 같이 있게 해 주세요. | 할머니가 보고 싶어요.
    @if wish_0
      haru: 할머니. 고마워. 나 웃게 해 줘서. 오래오래 웃게 해 줘서.
    @end
    @if wish_1
      haru: 토비랑… 다 같이, 계속 같이 있게 해 주세요. 이번엔 진짜 평생.
    @end
    @if wish_2
      haru: 보고 싶어. 너무 보고 싶어, 할머니.
    @end
    @wait 1
    @pose haru idle
    @sfx open
    > 하루가 상자 테이프를 뜯었다. 토비, 보리, 루루, 나비. 그리고 태엽 할머니.
    @pose haru hold
    haru: …토비.
    > 등에 달린 태엽 열쇠. 빨간 리본은 바랬지만 그대로였다.
    haru: 미안해. 너무 오래 기다리게 해서.
    @mini wind
    @sfx windTick
    haru: 태엽이 멈추지 않게. 매일 감아 줄게. 이번엔 진짜로.
    @pose haru holdDoll
    haru: 태엽 할머니도.
    @sfx windTick
    @wait 0.5
    @sfx windTick
    > 할머니 인형의 태엽도 천천히 감았다. 끼릭, 끼릭.
    @pose haru idle
    @sfx tape
    > 하루는 「두고 가는 짐」 쪽지를 떼어 내고, 매직펜으로 새로 적었다.
    haru: 가져가는… 짐.
    dad: 하루야! 출발하자!
    haru: 응, 잠깐만! 친구들도 데려가야 해!
    @wait 0.8
    haru: …아, 그리고 하나만 더.
    @walk haru 8 9 40
    @fade 1 1.2
    @room m_gm
    @tone dawn
    @show haru haru15 1 3 down
    @music finale
    @fade 0 2
    > 두 해 만에, 하루가 할머니 방 문을 열었다.
    @walk haru 3 5 30
    @face haru up
    > 재봉틀 서랍. 「열다섯 살 하루에게」.
    @pose haru holdPhoto
    @wait 1.5
    > 「열다섯 살 하루에게.」
    > 「이 편지를 열었다면, 우리 하루는 벌써 열다섯 살이 되었겠구나.」
    > 「할머니는 아마 곁에 없겠지. 미안하구나. 평생 같이 있자는 약속을 다 못 지켜서.」
    > 「그래도 너무 슬퍼하지는 말렴. 할머니는 토비 태엽 속에, 종이별 속에, 하루가 웃는 얼굴 속에 다 들어 있단다.」
    > 「태엽은 천천히 감아야 오래 간단다. 슬픔도 그래. 한꺼번에 말고, 천천히, 조금씩 풀어 주렴.」
    > 「그리고 가끔은 할머니 생각을 하면서 웃어 주렴. 할머니 소원은 그거 하나란다.」
    > 「사랑한다, 우리 하루. — 할머니가」
    @wait 1.8
    @pose haru cry
    haru: …응.
    haru: 응, 할머니.
    @wait 2
    @pose haru idle
    haru: 나, 웃을게. 천천히. 조금씩.
    @walk haru 1 3 30
    @sfx door
    > 하루는 문을 닫았다. 이번에는 잠그지 않았다.
    @fade 1 2.5
    @next
  `,
};

export function atticDawnRoom(): RoomDef {
  return toyRoom('attic_dawn', ATTIC, {
    name: '새벽 다락방',
    theme: 'toybox',
    start: [5, 15],
    music: 'night',
    ambient: [196, 160, 168],
    beams: [{ x: 9, w: 6, h: 9, slant: -3 }],
    things: [{ kind: 'npc', id: 'doll', at: [7, 14], actor: 'grandoll', dir: 'down', scene: s`> 태엽 할머니는 조용히 웃고 있다.` }],
  });
}

/** 사람 크기 다락방 (새벽) */
export function humanAttic(): RoomDef {
  return house('h_attic', 'attic', 18, 11, [
    ['window:dusk', 7, 0, 3, 2],
    ['boxes', 2, 3, 2, 2, true],
    ['boxes:tape', 4, 3, 2, 1, true],
    ['boxes:label', 8, 4, 2, 1, true],
    ['boxes', 13, 3, 3, 2, true],
    ['boxes', 14, 7, 2, 2, true],
    ['rug:#a88060', 6, 6, 6, 3],
  ]);
}

/** 새집 하루의 방 */
export function newRoom(): RoomDef {
  return house('h_newroom', 'newroom', 18, 11, [
    ['window:day', 8, 0, 3, 2],
    ['photo', 4, 0, 2, 2],
    ['shelf:jar', 8, 3, 3, 1, true],
    ['bed:#ffe08a', 14, 3, 3, 4, true],
    ['desk', 2, 3, 3, 1, true],
    ['rug:#e8b0a0', 6, 6, 6, 3],
    ['plant', 12, 3, 1, 1, true],
  ]);
}
