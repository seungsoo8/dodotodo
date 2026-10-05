/** 서장 · 이삿날 전날 — 15살 하루가 되어 해 질 녘 앞마당을 걷는다. 장난감들의 밤이 시작되기 전, 이 집과 이 가족이 누구인지 */
import { s } from '../parse.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { house } from './kit.ts';

export const PROLOGUE: Chapter = {
  n: 0,
  title: '서장 · 이삿날 전날',
  sub: '15살, 하루',
  room: 'h_yard_eve',
  start: [9, 11],
  party: [],
  wind: 0.9,
  intro: s`
    @fade 1 0
    @bars on
    @music longing
    @show haru haru15 9 11 up
    @control haru
    @chtitle
    @fade 0 2.5
    > 이사 가기 하루 전. 해가 진다.
    > 이 집에서 열다섯 해를 산 아이, 하루. 그리고 두 해 전까지 이 집에 함께 살던 할머니.
    @wait 0.8
    @face haru up
    haru: …내일이면 끝이네.
    @show mom mom 6 10 up
    mom: 하루야, 남은 상자는 그것뿐이니?
    @face haru mom
    haru: 응. 다락방에 올려 둘 거.
    mom: 그 상자… 정말 두고 갈 거야?
    @emote haru …
    haru: …응.
    @hide mom
    @bars off
    @goal 「두고 가는 짐」 상자를 다락방에 올려놓자 (마당을 둘러봐도 좋아요)
  `,
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
          mom: 그 상자… 할머니가 주신 것들이잖아.
          haru: 그러니까 두고 가는 거야.
          @emote mom …
          mom: …그래. 하루가 정한 거면.
        @else
          mom: 상자는 엄마 옆에 있어. 테이프는 다락방에 하나 남겨 뒀고.
          haru: 응.
          mom: 하루야. 할머니 방 정리는… 엄마가 할게. 하루는 안 들어가도 돼.
          @emote haru …
          haru: …고마워.
        @end
      ` },
      { kind: 'npc', id: 'p_dad', at: [11, 11], actor: 'dad', dir: 'right', scene: s`
        dad: 휴, 거의 다 실었다. 할머니 의자도 실었어. 버리기엔… 좀 그렇잖아.
        haru: 아빠, 그 의자 무거운데.
        dad: 할머니 무릎에 앉아 있던 꼬맹이가 그걸 걱정하네. 하하.
        @emote haru …
        dad: …새집 가면 네 방 창문이 남쪽이래. 별 잘 보일 거야.
        haru: 별은 여기서도 잘 보였어.
        @emote dad sweat
      ` },
      { kind: 'spot', id: 'p_box', at: [4, 8], scene: s`
        @if box_got
          > 테이프가 붙은 다른 상자들. 「옷」 「그릇」 「하루 책」.
        @else
          > 다른 상자들보다 작은 상자 하나. 위에 아무것도 적혀 있지 않다.
          > 안에는 하얀 토끼, 갈색 곰, 주황 여우, 보라 고양이… 그리고 할머니를 닮은 작은 인형.
          @pose haru hold
          haru: …가자.
          @flag box_got
          @goal 상자를 안고 현관으로 들어가자
        @end
      ` },
      { kind: 'spot', id: 'p_swing', at: [3, 11], scene: s`
        > 낡은 나무 그네. 할아버지가 엄마 어릴 때 만들었다고 했다.
        haru: 할머니는 내가 그만 타겠다고 할 때까지 밀어 줬는데.
        haru: …한 번도 먼저 그만하자고 한 적이 없었어.
      ` },
      { kind: 'spot', id: 'p_pots', at: [6, 5], scene: s`
        > 말라 버린 화분 두 개. 이름표에 크레용 글씨. 「하루 꽃」.
        haru: 매일 물 줘야 피는 꽃이라고 했지. 태엽처럼.
        haru: …두 해 동안 아무도 물을 안 줬네.
      ` },
      { kind: 'spot', id: 'p_mail', at: [17, 5], scene: s`
        > 우편함. 문패에는 아직 네 사람의 이름이 적혀 있다. 아빠, 엄마, 하루, 그리고 할머니.
        @emote haru …
      ` },
      { kind: 'spot', id: 'p_truck', at: [14, 9], scene: s`
        > 이삿짐 트럭. 짐칸 맨 안쪽에 할머니의 나무 의자가 보인다.
        haru: 새집은 여기서 기차로 세 시간.
      ` },
      { kind: 'spot', id: 'p_door', at: [9, 4], scene: s`
        @if box_got
          @bars on
          > 하루는 상자를 안고 현관문을 열었다. 계단을 올라, 다락방으로.
          @sfx door
          @fade 1 1.2
          @room h_attic
          @show haru haru15 8 9 up hold
          @music none
          @fade 0 1.5
          @walk haru 8 6 30
          @pose haru idle
          > 상자를 내려놓는다. 뚜껑을 살짝 연다.
          > 맨 위에 하얀 토끼 인형. 등에 꽂힌 태엽 열쇠의 빨간 리본이 바래 있다.
          @wait 1
          haru: …토비.
          @wait 1.2
          > 하루는 손을 뻗어 태엽 열쇠를 잡았다가— 놓았다.
          @wait 1
          haru: 미안.
          @sfx tape
          > 찌익— 찌이익—
          haru: …이걸로 끝.
          > 매직펜이 상자 위를 지나간다.
          haru: 두고… 가는… 짐.
          @wait 1
          @walk haru 2 4 40
          @sfx click
          @prop light off
          > 딸깍. 다락방 불이 꺼졌다.
          @hide haru
          @sfx steps
          > 쿵, 쿵, 쿵… 발소리가 계단 아래로 멀어진다.
          @wait 1.5
          @fade 1 2
          @next
        @else
          haru: 상자부터 챙겨야지. 엄마 옆에 있던 거.
        @end
      ` },
    ],
  });
  // 해 질 녘: 노을빛이 마당을 물들인다
  return { ...r, ambient: [240, 176, 140], lights: [{ at: [9, 4], r: 70, color: [255, 214, 150], k: 0.5 }] };
}
