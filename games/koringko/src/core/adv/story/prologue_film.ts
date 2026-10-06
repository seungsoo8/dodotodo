/**
 * 프롤로그 영상 「태엽 감는 소리」 (ACTS.md A-3): 조종 없이 보는 영상 (P0~P5). 영상이 끝나야 앞마당의 서장(P6)과 제목 카드가 뜬다.
 *
 * P0 검은 화면, 끼릭 세 번 · P1 하루가 태어난 밤 (할머니가 오르골에 노래를 짓는다) ·
 * P2 네 살 겨울, 선물 상자 (이름을 부르기 직전에 끊는다 → 9막 m9a 가 나머지) ·
 * P3 몽타주 여덟 컷 (5 · 6 · 7 · 8 · 9 · 10 · 11 · 12살, 나중 기억의 핵심 대사는 말하지 않는다) ·
 * P4 빈 의자 (13살) · 닫힌 문 (14살) · P5 열다섯, 이삿날 전날 낮: 장난감을 하나씩 상자에.
 * 음악: 태어난 밤의 노래는 끝 소절 전에 멈추는 오르골(orgel) — 끝은 새벽에야 듣는다. 나머지는 낱말 그대로 (감독이 기억 방 꾸밈으로 고른다).
 */
import { s } from '../parse.ts';
import type { Cmd } from '../types.ts';

export const PROLOGUE_FILM: Cmd[] = s`
  @fade 1 0
  @bars on
  @music none
  @wait 1.2
  @sfx windTick
  @wait 0.7
  @sfx windTick
  @wait 0.7
  @sfx windTick
  @wait 1
  > 어떤 집에는, 태엽 감는 소리가 산다.
  @wait 1.5

  @room m_gm_n
  @tone memory
  @show gm grandma 7 6 down sit
  @pose gm sew
  @fade 0 2
  @sfx crickets
  > 열다섯 해 전, 겨울밤.
  @wait 1.5
  @sfx phone
  @pose gm idle
  @act gm surprise nowait
  @wait 0.6
  @pose gm phone
  gm: 여보세요. …은주야?
  @wait 1.2
  gm: …그래. 그래. 딸이라고?
  @emote gm ♥
  @wait 0.8
  gm: 하루. 하루라고 지었구나. …좋다. 매일매일, 하루.
  @pose gm idle
  @wait 1
  @item mbox musicbox 8 7
  > 할머니는 재봉틀 서랍에서 작은 오르골을 꺼냈다. 아직 아무 노래도 들어 있지 않은.
  @pose gm sew
  @music orgel fade=1
  > 그날 밤, 할머니는 노래 하나를 지었다.
  @wait 4
  @music none
  @wait 1
  @fade 1 1 white

  @room m_room4
  @show gm grandma 9 7 left sit
  @show haru haru4 7 7 right
  @item gift box 8 8
  @music grandma fade=1
  @fade 0 1.2
  > 네 살 겨울.
  @wait 0.8
  gm: 하루야. 할머니가 줄 게 있어.
  @act haru jump nowait
  @wait 0.5
  @sfx cardboard
  @item gift boxOpen
  > 상자 속에서, 짝짝이 귀 하나가 삐죽 나와 있었다.
  @emote haru !
  @wait 0.8
  gm: 등에 열쇠가 있지? 이렇게… 천천히.
  @sfx windTick
  @wait 0.5
  @sfx windTick
  @wait 0.5
  @sfx windTick
  gm: 하나, 둘, 셋.
  @wait 0.8
  haru: 토…
  @fade 1 0.5 white
  @music none
  @wait 1

  @music waltz fade=1
  @room m_yard_d
  @show gm grandma 8 7 right
  @show haru haru5 10 6 right
  @fade 0 0.5
  > 다섯 살. 돌담은 하늘만큼 높았다.
  @act gm laugh nowait
  @walk haru 13 6 30 nowait
  @walk gm 11 7 30
  @wait 0.8
  @fade 1 0.4 white

  @room m_balcony
  @show haru haru6 9 5 down
  @show gm grandma 7 5 down
  @item can pot 8 6
  @fade 0 0.5
  @pose haru kneel
  > 여섯 살. 크레용 이름표, 「하루 꽃」.
  @act gm nod
  @wait 0.8
  @fade 1 0.4 white

  @room m_kitchen
  @show haru haru7 8 8 up
  @show gm grandma 6 8 up
  @show mom mom 10 8 up
  @show dad dad 12 7 left
  @item ck cake 8 7
  @fade 0 0.5
  > 일곱 살. 초가 일곱 개.
  @sfx candle
  @act haru wipe
  @sfx clap
  @wait 0.6
  @fade 1 0.4 white

  @room m_living8
  @show gm grandma 5 8 up sit
  @show haru haru8 9 8 up sit
  @item tb toby 9 6
  @fade 0 0.5
  > 여덟 살. 맨 앞자리 관객은 늘 같은 사람이었다.
  @act gm clap
  @sfx clap
  @wait 0.6
  @fade 1 0.4 white

  @room m_yard_n
  @show haru haru9 10 6 up sit
  @show gm grandma 11 6 up sit
  @pose haru lie
  @pose gm lie
  @fade 0 0.5
  @sfx crickets
  @act gm point
  > 아홉 살. 별 하나에 이름을 붙였다.
  @wait 1
  @fade 1 0.4 white

  @room m_room10
  @show haru haru10 3 5 up
  @show gm grandma 5 5 left
  @item ps paperstar 4 6
  @fade 0 0.5
  @sfx fold
  > 열 살. 첫 번째 종이별.
  @wait 1
  @fade 1 0.4 white

  @music piano fade=1.5
  @room m_out_alley_d
  @show gm grandma 5 4 down
  @fade 0 0.5
  @face gm left
  @sfx cough
  @wait 0.6
  @face gm right
  @show haru haru11 16 6 left
  @walk haru 7 5 60
  @act gm laugh nowait
  > 열한 살. 할머니는 언제나 모퉁이에서 기다렸다.
  @wait 0.8
  @fade 1 0.4 white

  @music minor fade=1.5
  @room m_hospital
  @show haru haru12 7 6 right
  @item jr jar 7 7
  @fade 0 0.6
  > 열두 살. 유리병 속 별은 구백구십구 개.
  @wait 1.5
  @fade 1 1

  @music none
  @room m_kitchen_n
  @show mom mom 6 6 right sit
  @show dad dad 11 6 left sit
  @show haru haru13 8 8 up sit
  @sfx clock
  @fade 0 1.5
  > 열세 살 봄.
  @wait 2.5
  mom: …먹자.
  haru: …응.
  @sfx spoon
  @wait 1.5
  > 식탁에는 의자가 넷. 하나에는 아무도 앉지 않았다.
  @wait 1.5
  @fade 1 1.2
  > 열네 살. 할머니 방 문이 닫혔다.
  @sfx doorClose
  @wait 1.5

  @room m_room15
  @tone now
  @show haru haru15 8 7 down
  @item pb box 8 8
  @music longing fade=2
  @fade 0 1.5
  > 열다섯 살. 이삿날 전날, 낮.
  @pose haru kneel
  @wait 0.8
  @item p1 toby 7 8
  > 하얀 토끼 인형, 토비.
  @item p1 none
  @sfx cardboard
  @wait 0.5
  @item p2 bear 9 8
  > 갈색 곰, 보리.
  @item p2 none
  @sfx cardboard
  @wait 0.5
  @item p3 fox 7 8
  > 주황 여우, 루루.
  @item p3 none
  @sfx cardboard
  @wait 0.5
  @item p4 cat 9 8
  > 보라 고양이, 나비.
  @item p4 none
  @sfx cardboard
  @wait 0.5
  @item p5 doll 7 8
  > 그리고 할머니를 닮은 작은 인형.
  @item p5 none
  @sfx cardboard
  @wait 1
  mom: 하루야, 다 쌌니?
  @wait 1.2
  @pose haru idle
  haru: …응. 다.
  @wait 0.8
  @fade 1 1.5
  @music none
`;
