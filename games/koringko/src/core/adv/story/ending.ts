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
    > 태엽 할머니는 계단 쪽을 향한 채 멈췄다. 하루가 올라올 쪽이었다.
    @wait 2
    toby: 태엽 할머니…!
    nabi: …멈췄어.
    @emote bori tear
    @emote ruru tear
    @sfx sob
    @wait 1.5
    @sfx stairs
    > 쿵, 쿵, 쿵. 계단을 오르는 발소리.
    ruru: 하루야! 하루가 와!
    toby: 다들, 자리로! 별을 상자 위에!
    @sfx pop
    > 토비가 반쪽 별을 상자 위에 올려놓았다. 그리고—
    toby: 얼음!
    @fade 1 1.2
    @room h_attic
    @tone dawn
    @item hbox boxTaped 8 5
    @item hstar paperstar 8 5
    @item hsew sewing 2 5
    @music longing
    @fade 0 2
    @sfx birds
    @sfx stairs
    @wait 0.8
    @sfx doorOpen
    @show haru haru15 1 3 down
    > 하루가 다락방에 올라왔다. 마지막 짐을 내리러.
    @walk haru 1 5 30
    @sfx doorClose
    @walk haru 8 6 30
    @face haru up
    haru: …이것만 내리면 끝.
    @emote haru ?
    > 상자 위에 무언가 놓여 있다. 노란 종이별. 반쯤 접힌.
    @take haru hstar
    haru: 이거…
    haru: 내가 접다 만…
    @wait 1.2
    @face haru up
    > 둥근 창 너머, 밝아 오는 하늘에 별이 둘 남아 있다. 작은 별 하나, 그 옆에 바짝 붙은 별 하나.
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
    @face haru left
    @put haru hstar 7 5
    @face haru up
    @pose haru phone
    > 하루는 휴대폰 불빛을 켜고, 둥근 창을 향해 높이 들었다.
    @sfx click
    > 켰다, 껐다.
    @sfx click
    > 켰다, 껐다.
    @sfx click
    > 켰다, 껐다. 세 번.
    @wait 1.5
    > 작은 별이 먼저 새벽빛 속으로 흐려졌다. 옆의 별은 조금 더 오래 남아 있었다.
    @pose haru kneel
    @wait 0.4
    @sfx tapeRip
    > 찌이이익— 하루가 상자 테이프를 뜯었다.
    @wait 0.5
    @sfx cardboard
    @item hbox boxOpen
    @pose haru idle
    > 뚜껑을 연다. 토비, 보리, 루루, 나비. 그리고 태엽 할머니.
    @music grandma
    @item htoby toby 8 5
    @take haru htoby
    @sfx hug
    haru: …토비.
    > 등에 달린 태엽 열쇠. 빨간 리본은 바랬지만 그대로였다.
    haru: 미안해. 너무 오래 기다리게 해서.
    @mini wind
    @sfx windTick
    haru: 태엽이 멈추지 않게. 매일 세 번. 이번엔 진짜로.
    @face haru left
    @put haru htoby 7 6
    @face haru up
    > 보리, 루루, 나비도 하나씩 꺼내, 토비 곁에 나란히 앉힌다.
    @item hbear bear 8 5
    @take haru hbear
    @sfx pat
    @put haru hbear 7 7
    @item hfox fox 8 5
    @take haru hfox
    @sfx pat
    @put haru hfox 9 6
    @item hcat cat 8 5
    @take haru hcat
    @sfx pat
    @put haru hcat 9 7
    @face haru up
    @item hdoll doll 8 5
    @take haru hdoll
    > 태엽 할머니를 꺼내자, 보라 카디건 자락이 살짝 뒤집혔다.
    > 안쪽에 바늘땀만 한 글씨가 있다. 「하루 곁에」.
    > 그 뒤로는 실이 끊긴 채, 바늘구멍만 몇 개.
    @emote haru …
    haru: …할머니 글씨.
    @wait 1.2
    @walk haru 8 8 30
    @walk haru 3 8 30
    @walk haru 3 5 30
    @face haru left
    > 다락방 구석, 할머니의 낡은 재봉 상자. 토마토 바늘꽂이에 바늘 하나가 빨간 실을 꿴 채 꽂혀 있다.
    @pose haru sit
    @sfx stitch
    @wait 0.8
    @sfx stitch
    @wait 0.8
    @sfx stitch
    @wait 0.5
    @sfx scissors
    > 삐뚤빼뚤, 두 글자.
    > 「하루 곁에 있어」.
    @wait 1.5
    @pose haru idle
    @sfx windTick
    @wait 0.5
    @sfx windTick
    @wait 0.5
    @sfx windTick
    > 끼릭, 끼릭, 끼릭. 아주 천천히.
    @sfx sparkle
    > 단추 눈에 새벽빛이 반짝, 하고 비쳤다.
    @wait 1.5
    @walk haru 3 8 30
    @walk haru 8 8 30
    @walk haru 8 6 30
    @face haru up
    > 하나씩, 다시 상자 안으로. 이번에는 맨 위에.
    @pose haru kneel
    @carry haru none
    @sfx put
    @wait 0.3
    @face haru left
    @take haru htoby
    @face haru up
    @pose haru kneel
    @carry haru none
    @sfx put
    @face haru left
    @take haru hbear
    @face haru up
    @pose haru kneel
    @carry haru none
    @sfx put
    @face haru right
    @take haru hfox
    @face haru up
    @pose haru kneel
    @carry haru none
    @sfx put
    @face haru right
    @take haru hcat
    @face haru up
    @pose haru kneel
    @carry haru none
    @sfx put
    @face haru left
    @take haru hstar
    @face haru up
    @pose haru kneel
    @carry haru none
    @sfx star
    > 천 번째 별도, 맨 위에.
    @wait 0.3
    @sfx cardboard
    @item hbox box
    @sfx tapeStick
    @wait 0.4
    @sfx paper
    > 하루는 「두고 가는 짐」 쪽지를 떼어 내고, 매직펜으로 새로 적었다.
    @sfx marker
    @wait 0.6
    @item hbox boxKeep
    @pose haru idle
    haru: 가져가는… 짐.
    @wait 0.8
    @take haru hbox
    haru: …아, 그리고 하나만 더.
    @walk haru 1 5 40
    @walk haru 1 4 40
    @face haru up
    @sfx doorOpen
    @hide haru
    @sfx doorClose
    @sfx stairs
    @fade 1 1.2
    @room m_gm
    @tone dawn
    @music finale
    @fade 0 2
    @sfx doorOpen
    @show haru haru15 1 3 down
    @carry haru boxKeep hbox
    > 두 해 만에, 하루가 할머니 방 문을 열었다.
    @walk haru 1 4 30
    @face haru right
    @put haru hbox 2 4
    @walk haru 3 4 30
    @face haru up
    > 재봉틀 서랍. 「열다섯 살 하루에게」.
    @sfx drawer
    @carry haru letter hletter
    @wait 0.6
    @sfx letterOpen
    @wait 1.5
    > 「열다섯 살 하루에게.」
    > 「이 편지를 열었다면, 우리 하루는 벌써 열다섯 살이 되었겠구나.」
    > 「할머니는 아마 곁에 없겠지. 미안하구나. 평생 같이 있자는 약속을 다 못 지켜서.」
    @sfx paper
    > 「그래도 그네 기억나니. 할머니는 한 번도 먼저 그만하자고 안 했지. 이번에도 안 할 거란다.」
    > 「할머니는 하루 등 뒤에서 계속 밀고 있을게. 토비 태엽 속에서도, 종이별 속에서도.」
    > 「태엽은 천천히 감아야 오래 간단다. 슬픔도 그래. 한꺼번에 말고, 천천히, 조금씩 풀어 주렴.」
    > 「그리고 가끔은 할머니 생각을 하면서 웃어 주렴. 할머니 소원은 그거 하나란다.」
    > 「사랑한다, 우리 하루. — 할머니가」
    @wait 1.8
    @pose haru cry
    @sfx sob
    haru: …응.
    haru: 응, 할머니.
    @wait 2
    dad: 하루야! 출발하자!
    @pose haru idle
    @sfx fold
    > 하루는 편지를 곱게 접어, 「가져가는 짐」 상자 맨 위에 넣었다.
    @face haru left
    @pose haru kneel
    @carry haru none
    @sfx cardboard
    @pose haru idle
    @take haru hbox
    @walk haru 1 4 30
    @walk haru 1 3 30
    > 하루는 문틀에 손을 짚고, 숨을 골랐다. 하나. 둘. 셋.
    @wait 1
    > 눈가는 아직 빨갰다. 감추지는 않았다.
    @emote haru ♪
    haru: 응! 지금 가!
    @sfx doorOpen
    @hide haru
    @sfx doorClose
    > 하루는 문을 닫았다. 이번에는 잠그지 않았다.
    @wait 1
    > 마당을 지나며, 하루는 말라 버린 화분 하나를 상자 위에 얹었다. 크레용 이름표. 「하루 꽃」.
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
    ['door', 1, 1, 1, 2],
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
