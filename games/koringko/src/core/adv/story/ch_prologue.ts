/**
 * 프롤로그 · 이삿날 전날 — 먼저 보는 영상(prologue_film.ts: 하루가 태어난 밤부터 열다섯 이삿날 전날 낮까지)이 흐르고,
 * 영상이 끝나면 15살 하루가 되어 해 질 녘 앞마당을 걷는다 (투더문식 콜드 오픈: 제목 카드는 앞마당이 밝아질 때).
 */
import { s } from '../parse.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { house } from './kit.ts';
import { PROLOGUE_FILM } from './prologue_film.ts';

export const PROLOGUE: Chapter = {
  n: 0,
  title: '프롤로그 · 이삿날 전날',
  sub: '15살, 하루',
  room: 'h_yard_eve',
  start: [9, 11],
  party: [],
  wind: 0.9,
  intro: [
    ...PROLOGUE_FILM,
    // 영상은 하루 방(기억 방)에서 끝난다: 앞마당으로 돌아와서 서장
    ...s`
    @room h_yard_eve 9 11 up
    @fade 1 0
    @bars on
    @music longing
    @show haru haru15 9 11 up
    @item pbox box 5 9
    @control haru
    @chtitle
    @fade 0 2.5
    @sfx crickets
    > 이사 가기 하루 전. 해가 진다.
    @wait 0.8
    @face haru up
    @act haru sigh
    haru: …내일이면 끝이네.
    @show mom mom 6 10 up
    mom: 하루야, 남은 상자는 그것뿐이니?
    @face haru mom
    @act haru nod nowait
    haru: 응. 다락방에 올려 둘 거.
    @face mom left
    > 엄마가 발치의 작은 상자를 내려다보았다.
    @emote mom …
    @sfx sigh
    mom: …그래.
    @hide mom
    @bars off
    @goal 이 상자는… 정말 두고 가도 되는 걸까?
  `,
  ],
};

export function yardEveRoom(): RoomDef {
  const r = house('h_yard_eve', 'yardDusk', 20, 14, [
    ['facade', 1, 2, 18, 3, true],
    ['pots', 6, 5, 2, 1, true],
    ['mailbox', 17, 5, 1, 1, true],
    ['boxes', 3, 7, 2, 2, true],
    ['boxes:tape', 5, 8, 1, 1, true],
    ['truck', 12, 8, 6, 2, true],
    ['swing', 2, 11, 3, 1, true],
    ['bush', 17, 11, 2, 2, true],
    ['flowers', 8, 12, 3, 1],
  ], {
    wallH: 1,
    music: 'longing',
    start: [9, 11],
    things: [
      { kind: 'npc', id: 'p_mom', at: [6, 10], actor: 'mom', dir: 'up', scene: s`
        @if box_got
          mom: 그 상자… 다 할머니 손때 묻은 것들이잖아.
          @act haru shrug nowait
          haru: 그러니까 두고 가는 거야.
          > 하루는 상자를 고쳐 안았다.
          @emote mom …
          @sfx sigh
          @pose mom lookDown
          mom: …그래. 하루가 정한 거면.
          @pose mom idle
        @else
          mom: 상자는 엄마 옆에 있어. 테이프는 다락방에 하나 남겨 뒀고.
          @act haru nod nowait
          haru: 응.
          mom: 하루야. 할머니 방 정리는… 엄마가 할게. 하루는 안 들어가도 돼.
          @emote haru …
          @act haru nod
          haru: …고마워.
        @end
      ` },
      { kind: 'npc', id: 'p_dad', at: [11, 11], actor: 'dad', dir: 'right', scene: s`
        @sfx boxDrag
        @act dad stretch
        dad: 휴, 거의 다 실었다. …할머니 의자만 아직 못 정했어. 일단 다락에 올려 뒀다.
        haru: 버려. 자리도 없는데.
        @act dad laugh nowait
        dad: 할머니 무릎에 앉아 있던 꼬맹이가 그런 말을 하네. 하하.
        @emote haru …
        dad: …새집 가면 네 방 창문이 남쪽이래. 별 잘 보일 거야.
        @act haru shrug nowait
        haru: 별은 여기서도 잘 보였어.
        @emote dad sweat
      ` },
      { kind: 'spot', id: 'p_box', at: [4, 8], scene: s`
        @if box_got
          > 테이프가 붙은 다른 상자들. 「옷」 「그릇」 「하루 책」.
        @else
          @item pbox box 5 9
          @walk haru 4 9 40
          @face haru right
          > 엄마 발치, 다른 상자들보다 작은 상자 하나. 위에 노란 쪽지가 얹혀 있다. 「두고 가는 짐」.
          @pose haru kneel
          @sfx cardboard
          > 뚜껑 틈으로 안이 보인다. 하얀 토끼, 갈색 곰, 주황 여우, 보라 고양이…
          > 맨 아래, 할머니를 닮은 작은 인형이 토끼 쪽으로 기울어 있다.
          @wait 0.8
          @pose haru idle
          @take haru pbox
          @sfx phoneVibe
          > 주머니 속 휴대폰이 떨렸다. 「지우: 내일 몇 시에 가?」
          @pose haru phone
          > 하루는 「오지 마」라고 썼다가, 보내지 않고 화면을 껐다.
          @wait 0.8
          @pose haru idle
          haru: …가자.
          @flag box_got
        @end
      ` },
      { kind: 'spot', id: 'p_swing', at: [3, 11], scene: s`
        @sfx swing
        @pose haru lookDown
        > 낡은 나무 그네. 할아버지가 만든 그네라고 했다. 엄마가 어릴 때 제일 많이 탔다고.
        haru: 할아버지 얼굴은 사진으로밖에 몰라.
        haru: …그래도 이 그네는 알아. 할머니가 몇 번이고 밀어 줬으니까.
        @pose haru idle
      ` },
      { kind: 'spot', id: 'p_pots', at: [6, 5], scene: s`
        > 말라 버린 화분 두 개. 할머니가 베란다에서 마당으로 내려놓은 것이다. 이름표에 크레용 글씨. 「하루 꽃」.
        haru: 매일 물 줘야 피는 꽃이라고 했지. 태엽처럼.
        @act haru sigh
        haru: …두 해 동안 아무도 물을 안 줬네.
      ` },
      { kind: 'spot', id: 'p_mail', at: [17, 5], scene: s`
        > 우편함. 문패에는 아직 네 사람의 이름이 적혀 있다. 아빠, 엄마, 하루, 그리고 할머니.
        @emote haru …
      ` },
      { kind: 'spot', id: 'p_truck', at: [14, 9], scene: s`
        > 이삿짐 트럭. 짐칸이 거의 찼다. 맨 안쪽에 하루 책상이 거꾸로 실려 있다.
        @act haru lookAround
        haru: 새집은 여기서 기차로 세 시간.
      ` },
      { kind: 'spot', id: 'p_door', at: [9, 4], scene: s`
        @if box_got
          @bars on
          @walk haru 9 5 40
          @face haru up
          > 하루는 상자를 안고 현관문을 열었다.
          @sfx doorOpen
          @hide haru
          @wait 0.3
          @sfx doorClose
          @fade 1 1.2
          @room h_attic
          @music none
          @item ptape tape 7 5
          @sfx stairs
          > 삐걱, 삐걱. 계단을 올라, 다락방으로.
          @fade 0 1.5
          @sfx doorOpen
          @show haru haru15 1 3 down
          @carry haru box pbox
          @wait 0.4
          @walk haru 1 5 30
          @sfx doorClose
          @walk haru 8 6 30
          @face haru up
          @put haru pbox 8 5
          > 상자를 내려놓는다.
          @wait 0.6
          @pose haru kneel
          @sfx cardboard
          @item pbox boxOpen
          > 뚜껑을 살짝 연다.
          @pose haru idle
          > 맨 위에 하얀 토끼 인형. 등에 꽂힌 태엽 열쇠의 빨간 리본이 바래 있다.
          > 인형 하나가 토끼에게 기대어 쓰러져 있다. 하루는 바로 세워 주려고 손을 뻗었다가— 그냥 두었다.
          @wait 1
          haru: …토비.
          @wait 1.2
          @pose haru kneel
          > 하루는 손을 뻗어 태엽 열쇠를 잡았다가— 놓았다.
          @wait 1.6
          @pose haru idle
          haru: …잘 자, 토비.
          @sfx cardboard
          @item pbox box
          > 뚜껑을 닫는다.
          @wait 0.5
          @face haru left
          @take haru ptape
          @face haru up
          @sfx tapeRip
          > 찌익— 찌이익—
          @sfx tapeStick
          @item pbox boxTaped
          @act haru sigh
          haru: …이걸로 끝.
          @face haru left
          @put haru ptape 7 5
          @face haru up
          @pose haru kneel
          @sfx paper
          > 상자 위의 쪽지를 옆면에 대고, 손바닥으로 꾹 눌러 붙인다.
          @pose haru idle
          haru: 두고… 가는… 짐.
          @wait 1
          @walk haru 1 5 40
          @walk haru 1 4 40
          @face haru up
          @sfx switch
          @prop light off
          > 딸깍. 다락방 불이 꺼졌다.
          @wait 0.6
          @sfx doorOpen
          @hide haru
          @sfx doorClose
          @wait 0.5
          @sfx stairs
          > 쿵, 쿵, 쿵… 발소리가 계단 아래로 멀어진다.
          @wait 1.5
          @fade 1 2
          @next
        @else
          @act haru point nowait
          haru: 상자부터 챙겨야지. 엄마 옆에 있던 거.
        @end
      ` },
    ],
  });
  // 해 질 녘: 노을빛이 마당을 물들인다
  return { ...r, ambient: [240, 176, 140], lights: [{ at: [9, 4], r: 70, color: [255, 214, 150], k: 0.5 }] };
}
