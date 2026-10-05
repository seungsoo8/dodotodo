/** 곁가지 장 · 골목 끝 놀이터 — 장난감들이 처음으로 집 밖에 나간 밤 (비 오는 마당과 토비의 태엽 속 사이) */
import { s } from '../parse.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { grid, toyRoom } from './kit.ts';

/**
 * 장난감 크기 바깥 (40×22, 밤): 아스팔트(j) · 보도블록(h) · 놀이터 모래(s) · 벽돌 담(J) · 보도 연석(Z) · 쇠 기둥(I).
 * 왼쪽 아래 파란 대문 틈(시작) → 하루네 쪽 골목 → 하수구 도랑(루루 밧줄) → 구멍가게 앞 골목
 * → 놀이터 울타리 틈을 막은 운동화(보리가 민다) → 놀이터 (미끄럼틀 밑은 깜깜하다: 나비 등불).
 */
const MAP = grid(40, 22, 'j', 'J', [
  // 담 · 구멍가게 벽 (위)
  ['J', 1, 1, 25, 2],
  // 위쪽 보도
  ['h', 1, 3, 25, 4],
  // 보도 연석 (위) · 턱이 낮아진 자리
  ['Z', 1, 7, 25, 1],
  ['h', 4, 7, 1, 1],
  ['h', 10, 7, 1, 1],
  ['h', 18, 7, 1, 1],
  ['h', 24, 7, 1, 1],
  // 보도 연석 (아래)
  ['Z', 1, 15, 25, 1],
  ['h', 3, 15, 1, 1],
  ['h', 8, 15, 1, 1],
  ['h', 20, 15, 1, 1],
  // 아래쪽 보도 · 이웃 담
  ['h', 1, 16, 25, 2],
  ['J', 1, 18, 25, 3],
  // 하루네 파란 대문 아래 틈 (시작)
  ['h', 3, 18, 1, 1],
  // 골목을 가로지르는 하수구 도랑
  ['v', 13, 3, 1, 15],
  // 구멍가게 앞 냉장고 · 상자 자리
  ['Z', 15, 3, 2, 1],
  ['Z', 22, 3, 2, 1],
  // 가로등 · 전봇대
  ['I', 9, 6, 1, 1],
  ['I', 16, 6, 1, 1],
  // 웅덩이
  ['~', 18, 11, 2, 2],
  ['~', 6, 13, 1, 1],
  // 놀이터 울타리 (가운데 한 칸 틈)
  ['J', 26, 1, 1, 20],
  ['h', 26, 11, 1, 1],
  // 놀이터 모래
  ['s', 27, 1, 12, 20],
  // 미끄럼틀 다리
  ['I', 29, 2, 1, 1],
  ['I', 32, 2, 1, 1],
  ['I', 29, 5, 1, 1],
  ['I', 32, 5, 1, 1],
  // 그네 기둥
  ['I', 33, 8, 1, 1],
  ['I', 37, 8, 1, 1],
  // 놀이터 가로등
  ['I', 31, 11, 1, 1],
  // 벤치 다리
  ['I', 28, 16, 1, 1],
  ['I', 31, 16, 1, 1],
  // 놀이터 구석 덤불
  ['B', 37, 20, 2, 1],
]);

export const CH_OUTSIDE: Chapter = {
  n: 0,
  title: '0장 · 골목 끝 놀이터',
  sub: '하루와 할머니가 매일 걷던 길',
  room: 'outside',
  start: [3, 18],
  party: ['toby', 'bori', 'ruru', 'nabi'],
  wind: 0.22,
  intro: s`
    @fade 1 0 white
    @bars on
    @music night
    @chtitle
    @fade 0 2
    > 파란 대문 아래 틈을 빠져나왔다. 비는 그쳤고, 골목은 젖어 있다.
    @sfx wind
    @emote ruru !
    ruru: …뭐야. 하늘이 왜 이렇게 커?
    bori: 하늘만 큰 게 아니야. 다 커. 저 기둥 좀 봐. 끝이 안 보여.
    nabi: 전봇대야. 하루 키로는 세 걸음이면 지나가던 거.
    toby: 우리 키로는… 한참 걸리겠다.
    @wait 0.8
    > 멀리 가로등 불빛이 골목 끝까지 띄엄띄엄 이어진다. 그 끝에 놀이터가 있다.
    toby: 할머니랑 하루가 매일 걷던 길이야. 학교 갈 때도, 놀이터 갈 때도.
    nabi: 그 길에도 기억이 떨어져 있을 거야. 집 안에만 있는 게 아니니까.
    @bars off
    @goal 기억 조각 여섯 개를 찾자
  `,
};

export function outsideRoom(): RoomDef {
  return toyRoom('outside', MAP, {
    name: '골목 끝 놀이터',
    theme: 'village',
    start: [3, 18],
    music: 'night',
    ambient: [62, 68, 112],
    lights: [
      { at: [9, 6], r: 130, color: [255, 214, 150], k: 0.6 },
      { at: [19, 3], r: 90, color: [200, 230, 255], k: 0.4 },
      { at: [31, 11], r: 140, color: [255, 214, 150], k: 0.6 },
      { at: [3, 18], r: 60, color: [255, 220, 170], k: 0.3 },
    ],
    things: [
      {
        kind: 'memory',
        id: 'mOUa',
        at: [8, 5],
        name: '가로등 밑',
        caption: '하루가 모퉁이를 돌기 전에, 할머니는 숨을 다 골라 두었다',
        scene: s`
          @room m_out_alley_d
          @show gm grandma 5 4 down
          @show haru haru11 20 8 left
          @carry haru bag
          @music longing
          @sfx wind
          > 열한 살 가을. 해가 부쩍 짧아진 무렵.
          > 할머니는 언제부턴가 교문 앞이 아니라, 골목 가로등 밑에서 하루를 기다렸다.
          @sfx cough
          @face gm up
          > 할머니가 가로등 기둥에 손을 짚고, 천천히 숨을 골랐다. 하나. 둘. 셋.
          @sfx sigh
          @wait 1
          @face gm right
          @emote gm !
          > 모퉁이에서 하루가 보이자, 할머니는 허리를 펴고 손을 흔들었다. 아무 일도 없었던 것처럼.
          @pose gm wave
          gm: 하루야!
          @walk haru 7 4 60
          @pose gm idle
          haru: 할머니, 또 나와 있어? 춥다니까.
          gm: 나와 있긴. 방금 나왔다.
          haru: 거짓말. 코끝 빨개.
          gm: 바람이 빨갛게 불어서 그래.
          haru: 바람이 무슨 색이 있어.
          @face haru gm
          haru: 근데 할머니, 이제 교문 앞엔 안 와?
          gm: 교문까지는 하루 다리로 가야 빠르지. 할머니 다리로 가면 해가 먼저 진다.
          gm: 그리고 여기가 좋아. 하루가 저 모퉁이 꺾어 들어오는 게 제일 먼저 보이거든.
          @emote haru …
          haru: …그럼 나 보이면 바로 손 흔들어 줘. 매일.
          gm: 그럼. 매일.
          @walk haru 7 3 50
          @sfx gate
          @hide haru
          @sfx doorClose
          @wait 0.8
          > 대문이 닫혔다. 할머니는 가로등에 한 번 더 손을 짚었다가, 천천히 그 뒤를 따랐다.
          @sfx cough
          @walk gm 7 4 25
          @sfx gate
          @hide gm
          @wait 1.2
        `,
        explore: {
          enter: [12, 6],
          intro: s`
            toby: 여기는… 방금 지나온 골목이야. 하루가 열한 살이던 가을, 해 질 녘.
            nabi: 집 밖에서도 기억은 멈춰 있네. 실을 찾자. 다 이어지면 이 순간이 흘러갈 거야.
          `,
          threads: [
            { at: [3, 5], text: s`
              > 담벼락 아래, 같은 자리에 발자국이 수북이 겹쳐 있다. 오래 서 있던 사람의 자리.
              bori: 할머니, 여기 매일 얼마나 서 계셨던 거야.
            ` },
            { at: [17, 6], text: s`
              > 구멍가게 평상 끝에 손수건 한 장이 반듯하게 개켜 있다. 할머니 손수건이다.
              nabi: 저기 앉아서 쉬셨나 봐. 하루가 오기 전에 일어나셨고.
              ruru: 하루는 할머니가 앉아 있는 걸 한 번도 못 봤겠네.
            ` },
            { at: [4, 6], text: s`
              > 가로등 불빛이 동그랗게 떨어져 있다. 할머니는 그 한가운데가 아니라, 가장자리에 서 있다.
              ruru: 왜 한가운데 안 서? 거기가 제일 밝은데.
              nabi: 밝으면 얼굴이 잘 보이니까. …안색 말이야.
            ` },
          ],
          looks: [
            { at: [5, 5], text: s`
              > 가로등 기둥을 짚은 할머니. 다른 손은 가슴께에 가만히 얹었다.
              toby: …숨을 고르고 계셔. 하루가 오기 전에, 다 고르려고.
            ` },
            { at: [19, 8], text: s`
              > 모퉁이를 막 돈 하루. 운동화 끈이 풀린 줄도 모르고 걷는다.
              ruru: 아직 할머니를 못 봤어. 할머니는 벌써 봤는데.
            ` },
          ],
        },
        after: s`
          bori: 할머니는 하루보다 먼저 숨을 다 골라 두셨어.
          ruru: 바람이 빨갛게 분다니. 세상에 그런 핑계가 어딨어.
          nabi: 하루는 믿었지. 열한 살이었으니까.
          toby: 매일 손 흔들어 준다고 했어. …매일.
        `,
      },
      {
        kind: 'memory',
        id: 'mOUb',
        at: [5, 10],
        name: '두 손 들고',
        caption: '「이 손은 할머니 거야」 — 처음 학교 가던 날의 횡단보도',
        scene: s`
          @room m_out_school
          @show gm grandma 10 9 up
          @show haru haru7 11 9 up
          @carry haru bag
          @music piano
          @sfx birds
          > 일곱 살 삼월. 처음 학교 가는 날 아침.
          gm: 하루야, 횡단보도는 어떻게 건넌다고 했지?
          haru: 초록불에! 손 들고!
          gm: 그렇지. 손은 어느 손?
          @pose haru wave
          haru: 이 손!
          > 하루는 오른손을 번쩍 들었다. 왼손은 할머니 손을 꼭 쥔 채로.
          gm: 할머니 손은 놓고 들어야지.
          haru: 싫어. 이 손은 할머니 거야.
          @emote gm ♥
          @sfx carPass
          @wait 0.6
          @sfx chime
          > 초록불. 할머니도 웃으며 한 손을 들었다. 둘은 나란히, 손을 번쩍 든 채로 흰 줄을 건넜다.
          @pose gm wave
          @walk gm 10 5 35 nowait
          @walk haru 11 5 35
          @pose gm idle
          @pose haru idle
          @face haru gm
          gm: 할머니는 여기까지다.
          haru: …교실까지 같이 가면 안 돼?
          gm: 교실은 하루 자리지. 할머니 자리는 여기.
          gm: 끝나면 이 자리에 그대로 있을게.
          haru: 진짜 그대로? 한 발짝도 안 움직이고?
          gm: 한 발짝도.
          @walk haru 11 4 50
          @face haru down
          haru: 할머니! 한 발짝도야!
          @hide haru
          @sfx bell
          @wait 1.2
          > 할머니는 정말로 한 발짝도 움직이지 않았다. 열두 시 십 분까지.
          @wait 1.2
        `,
        explore: {
          enter: [16, 9],
          intro: s`
            > 학교 가는 길. 찻길 건너편에 정문이 보인다.
            toby: 하루가 일곱 살. 처음으로 학교에 가던 날이야.
          `,
          threads: [
            { at: [7, 9], text: s`
              > 할머니 발치에 놓인 실내화 주머니. 「하루」 두 글자가 노란 실로 수놓여 있다.
              nabi: 노란 실. 할머니는 하루 물건엔 늘 노란 실을 썼어.
            ` },
            { at: [16, 5], text: s`
              > 정문 옆 담벼락에 붙은 안내문. 「1학년 하교 12시 10분」.
              ruru: 열두 시 십 분. 외워 둬. 나중에 중요할 거야.
              toby: 누가 그래?
              ruru: 내 꼬리가.
            ` },
            { at: [12, 7], text: s`
              > 아직 빨간불. 흰 줄이 찻길 저편까지 길게 누워 있다.
              toby: 일곱 살한테는 강처럼 넓었을 거야.
              bori: 우리한테도 넓어. 지금.
            ` },
          ],
          looks: [
            { at: [10, 10], text: s`
              > 하루 손을 쥔 할머니 손. 하루보다 더 꽉 쥐고 있다.
              bori: 떨리는 건 하루 손이 아니라 할머니 손 같아.
            ` },
            { at: [12, 9], text: s`
              > 새 책가방이 하루 등을 다 덮었다. 하루는 신호등만 노려보고 있다.
              ruru: 전쟁 나가는 얼굴이네.
            ` },
          ],
        },
        after: s`
          ruru: 할머니 손을 안 놓고 손을 들다니. 하루, 머리 좋다.
          nabi: 규칙을 어긴 거야. 근데 할머니가 같이 어겨 줬지.
          bori: 아침부터 열두 시 십 분까지 한자리에 서 계셨대. 다리 아프셨겠다.
          toby: 할머니는 약속을 그렇게 지켰어. 한 발짝도.
        `,
      },
      {
        kind: 'memory',
        id: 'mOUc',
        at: [19, 4],
        name: '반쪽',
        caption: '큰 쪽은 언제나 하루 손에 — 구멍가게 앞 아이스크림',
        scene: s`
          @room m_out_alley
          @show gm grandma 15 4 up
          @show haru haru9 16 4 up
          @music box
          @sfx cicada
          > 아홉 살 여름. 구멍가게 아이스크림 냉장고 앞.
          haru: 할머니, 나 이거! 아니, 이거! 아니…
          gm: 하나만 골라라. 해 지겠다.
          @sfx drawer
          > 하루는 결국 막대가 두 개 달린 아이스크림을 골랐다. 반으로 쪼개 먹는 것.
          @carry haru icecream ice
          @walk haru 19 4 50 nowait
          @walk gm 18 4 40
          @face gm haru
          @face haru gm
          @give haru gm ice
          @sfx pop
          > 똑. 할머니가 아이스크림을 쪼갰다. 한쪽은 컸고, 한쪽은 작았다.
          @give gm haru ice
          @carry gm icecream ice2
          > 큰 쪽이 하루 손에 쥐어졌다. 언제나처럼.
          @emote haru …
          haru: 할머니. 할머니는 왜 맨날 작은 쪽이야?
          gm: 할머니는 이가 시려서 작은 게 좋아.
          haru: 거짓말. 지난번에 내 거 반이나 먹었잖아.
          @emote gm sweat
          gm: 그건… 하루 거라서 맛있어 보여서 그랬지.
          @wait 0.8
          > 하루는 아이스크림을 바꿔 쥐었다. 큰 쪽을 할머니 손에.
          haru: 오늘은 할머니가 큰 거.
          gm: 이러면 하루 거라서 맛있어 보이는 게 없잖니.
          haru: 그럼 한 입씩 바꿔 먹자. 그러면 둘 다 하루 거고, 둘 다 할머니 거야.
          @emote gm ♥
          gm: …우리 하루, 장사해도 되겠다.
          @sfx laugh
          > 그해 여름 내내, 골목에는 「똑」 소리와 「한 입만」이 번갈아 들렸다.
          @wait 1.2
        `,
        explore: {
          enter: [9, 8],
          intro: s`
            > 낮의 골목. 매미 소리가 공중에 멈춰 있다.
            bori: 구멍가게다! 냉장고다! 아이스크림이다!
            nabi: 기억 속 아이스크림은 못 먹어, 보리.
          `,
          threads: [
            { at: [10, 6], text: s`
              > 골목 한가운데, 바닥에 말라붙은 아이스크림 자국 두 개. 큰 것 하나, 작은 것 하나.
              toby: 어제 거야. 큰 걸 떨어뜨린 사람은… 누군지 알 것 같아.
              ruru: 하루지 뭐.
            ` },
            { at: [3, 5], text: s`
              > 담 밑 그늘에 분필 그림. 막대 두 개짜리 아이스크림을 두 사람이 하나씩 쥐고 있다.
              nabi: 하루한테 아이스크림은 원래 둘이 먹는 거였나 봐.
            ` },
            { at: [17, 6], text: s`
              > 평상 위에 동전 몇 개. 반짝이는 오백 원짜리 하나에 돼지 저금통 테이프 자국이 남았다.
              bori: 하루가 자기 돈으로 내겠다고 했구나.
              ruru: 할머니는 받는 척만 하셨겠지. 저녁에 저금통에 도로 넣고.
            ` },
          ],
          looks: [
            { at: [15, 5], text: s`
              > 냉장고 앞에 허리를 숙인 할머니. 손끝이 벌써 한 아이스크림 위에 가 있다.
              ruru: 하루가 뭘 고를지 이미 아셨네. 매번.
            ` },
            { at: [16, 5], text: s`
              > 냉장고 유리에 코를 박은 하루. 유리에 하얗게 김이 서렸다.
              bori: …나도 저러고 싶다.
            ` },
          ],
        },
        after: s`
          bori: 한 입씩 바꿔 먹으면 둘 다 둘 거. …하루, 천재다.
          ruru: 보리, 지금 침 흘렸지.
          bori: 안 흘렸어. 조금.
          nabi: 할머니는 늘 작은 쪽이었어. 아이스크림도, 우산도.
          toby: 하루가 그걸 처음 알아챈 여름이야.
        `,
      },
      {
        kind: 'memory',
        id: 'mOUd',
        at: [20, 13],
        name: '세 번 깜빡',
        caption: '감기 때문에 들어가지 못한 밤, 삼 층 창의 불빛',
        scene: s`
          @room m_out_hosp
          @show haru haru13 17 9 up
          @show dad dad 11 4 down umbrella
          @music rain
          @sfx rainRoof
          > 열세 살, 마지막 겨울. 차가운 비가 내렸다.
          > 하루는 감기에 걸렸다. 감기에 걸린 사람은 병실에 들어갈 수 없었다. 할머니한테 옮으면 안 되니까.
          @sfx cough
          haru: 콜록.
          @walk dad 16 8 45
          @sfx carPass
          @face dad haru
          dad: 하루야, 정류장 지붕 밑에 있으랬지. 다 젖었잖아.
          haru: 여기가 잘 보여. 삼 층, 왼쪽에서 다섯 번째.
          @face dad up
          dad: …할머니한테 하루 왔다고 전했다. 창밖 좀 보시라고.
          @wait 1
          > 삼 층, 왼쪽에서 다섯 번째 창. 불이 꺼졌다.
          @emote haru !
          > 켜졌다. 꺼졌다. 켜졌다. 꺼졌다. 다시, 켜졌다.
          @sfx chime
          dad: …세 번.
          haru: 매일 세 번.
          > 태엽은 매일 세 번 감는 거라고, 할머니가 가르쳐 준 숫자였다.
          @pose haru phone
          > 하루는 휴대폰 불빛을 켜고 창을 향해 높이 들었다. 켰다, 껐다. 세 번.
          @sfx click
          @wait 0.4
          @sfx click
          @wait 0.4
          @sfx click
          @wait 1
          dad: 할머니가 보셨겠다.
          haru: 응. 할머니는 다 봐.
          @pose haru idle
          @walk dad 17 8 30
          > 아빠가 우산을 하루 쪽으로 기울였다. 할머니가 늘 그랬던 것처럼.
          @wait 1.5
        `,
        explore: {
          enter: [11, 6],
          intro: s`
            > 병원 앞. 비가 공중에 멈춰 있다.
            toby: 하루가 열세 살이던 겨울. …할머니의 마지막 겨울이야.
          `,
          threads: [
            { at: [8, 6], text: s`
              > 웅덩이에 병원 창들이 거꾸로 비친다. 불 켜진 창이 줄지어 있다.
              nabi: 다 똑같은 창이야. 하루는 어떻게 할머니 창을 알지?
              toby: 세어 봤겠지. 오는 날마다.
            ` },
            { at: [20, 7], text: s`
              > 길가에 떨어진 종이별 하나. 빗물에 반쯤 풀렸다.
              bori: 하루 주머니에서 떨어졌나 봐. 그 겨울엔 주머니마다 별이 들어 있었어.
            ` },
            { at: [16, 10], text: s`
              > 정류장 시간표. 「막차 21:40」 위에 연필로 동그라미가 쳐 있다.
              ruru: 아빠 글씨다. 하루가 집에 안 가겠다고 버틸 줄 알았나 봐.
            ` },
          ],
          looks: [
            { at: [18, 9], text: s`
              > 후드를 뒤집어쓴 하루. 우산도 없이, 고개를 젖혀 위만 본다.
              toby: 감기 걸렸는데…
              ruru: 그러니까 못 들어간 거잖아. 바보.
            ` },
            { at: [11, 5], text: s`
              > 유리문 앞의 아빠. 우산을 하나만 들고 나왔다.
              nabi: 하나면 된다는 얼굴이야. 누가 젖을지 벌써 정해 놓은 얼굴.
            ` },
          ],
        },
        after: s`
          toby: 세 번. 하루가 나한테 매일 감아 주던 수만큼.
          nabi: 할머니가 일부러 그 숫자를 고른 거야. 하루가 알아보라고.
          ruru: …감기 걸려서 못 들어갔는데, 오히려 더 잘 보였네.
          bori: 창문 하나 사이였어. 비 오는 밤에도.
          nabi: 할머니 창은 하루가 돌아설 때까지 꺼지지 않았어.
        `,
      },
      {
        kind: 'memory',
        id: 'mOUe',
        at: [35, 8],
        name: '그만할 때까지',
        caption: '「평생?」 「…평생.」 — 놀이터 그네',
        scene: s`
          @room m_out_park
          @show haru haru8 14 4 down sit
          @show gm grandma 14 4 up
          @music waltz
          > 여덟 살 가을. 학교가 끝나면, 놀이터.
          haru: 더 높이! 더 높이!
          @sfx swing
          gm: 영차. 영차.
          @sfx swing
          > 할머니는 하루 등을 밀고, 또 밀었다. 그네가 하늘에 닿을 것처럼 올라갔다.
          haru: 할머니, 팔 안 아파?
          gm: 안 아프다.
          haru: 언제까지 밀어 줄 거야?
          gm: 하루가 그만하자고 할 때까지.
          haru: 그럼 내가 계속 안 그만하면?
          gm: 그럼 계속 밀지.
          haru: 밤새도록?
          gm: 밤새도록.
          haru: …평생?
          @wait 1
          gm: 평생.
          @emote haru ♪
          @sfx swing
          > 해가 졌다. 가로등이 켜졌다. 하루는 끝내 그만하자고 하지 않았다.
          @sfx crickets
          > 대신 그네 위에서 꾸벅꾸벅 졸았다.
          @emote haru zz
          @wait 1
          > 할머니는 그네가 저절로 멈출 때까지 기다렸다가, 잠든 하루를 업었다. 먼저 그만하자는 말은, 끝까지 하지 않고.
          @wait 1.5
        `,
        explore: {
          enter: [11, 9],
          intro: s`
            > 낮의 놀이터. 그네가 하늘 높이 올라간 채 멈춰 있다.
            ruru: 놀이터다! 기억 속이 아니었으면 미끄럼틀부터 탔을 텐데.
          `,
          threads: [
            { at: [9, 6], text: s`
              > 모래밭에 작은 두꺼비집. 옆에 커다란 손바닥 자국 하나, 작은 손바닥 자국 하나.
              bori: 할머니도 같이 모래 놀이 하셨구나. 무릎 꿇고.
            ` },
            { at: [6, 3], text: s`
              > 미끄럼틀 끝에 벗겨진 운동화 한 짝.
              ruru: 그네 타다 날아간 거다. 하루 발차기 실력 알지?
            ` },
            { at: [11, 4], text: s`
              > 가로등. 아직 불이 꺼져 있다. 해가 지기 전이다.
              toby: 이 불이 켜지면 집에 가는 시간이었대. 원래는.
            ` },
          ],
          looks: [
            { at: [15, 4], text: s`
              > 하루 등을 미는 할머니. 소매를 팔꿈치까지 걷어붙였다.
              nabi: 할머니 팔, 생각보다 가늘어.
            ` },
            { at: [14, 2], text: s`
              > 그네 위의 하루. 두 발을 하늘로 쭉 뻗었다.
              ruru: 운동화 한 짝이 없는데?
            ` },
          ],
        },
        after: s`
          ruru: 평생이래. 그네를.
          bori: 할머니라면 진짜 하셨을 거야.
          nabi: 하루가 먼저 잠들어서 다행이지 뭐.
          toby: 하루는 할머니가 먼저 그만하자고 한 걸 한 번도 못 들었대. …한 번도.
        `,
      },
      {
        kind: 'memory',
        id: 'mOUf',
        at: [30, 4],
        dark: true,
        name: '대신 밀어 줄게',
        caption: '할머니가 떠난 봄, 지우는 큰 쪽을 내밀었다',
        scene: s`
          @room m_out_park_d
          @show haru haru13 15 4 down sit
          @show jiwoo jiwoo13 11 9 up
          @carry jiwoo icecream ice
          @music longing
          @sfx wind
          > 열세 살 봄. 할머니가 떠나고 두 달.
          > 하루는 학교가 끝나면 집 대신 놀이터에 왔다. 그네에 앉아, 움직이지 않았다.
          @walk jiwoo 15 5 55
          @face jiwoo haru
          jiwoo: 찾았다.
          haru: …어떻게 알았어.
          jiwoo: 너희 엄마가 전화했어. 하루 또 안 왔다고.
          @wait 1
          > 지우가 아이스크림을 내밀었다. 막대가 두 개 달린 것.
          haru: …그거, 반 쪼개 먹는 거야.
          jiwoo: 알아.
          @sfx pop
          @give jiwoo haru ice
          @carry jiwoo icecream ice2
          > 똑. 큰 쪽이 하루 손에 쥐어졌다.
          @emote haru …
          haru: 할머니도 맨날 큰 쪽 줬어.
          jiwoo: 그럼 나도 그럴래.
          @walk jiwoo 15 4 30
          @carry jiwoo none
          > 지우가 그네 줄을 잡고, 천천히 밀었다. 끼익. 끼익.
          @sfx swing
          @wait 0.6
          @sfx swing
          haru: 할머니는 내가 그만하자고 할 때까지 밀어 줬어.
          jiwoo: 그럼 나도.
          haru: 밤새도록일 수도 있어.
          jiwoo: 내일 학교 안 가지 뭐.
          @wait 1
          > 가로등이 켜졌다. 지우 팔이 조금씩 느려졌다. 그래도 멈추지 않았다.
          @sfx swing
          haru: …지우야. 팔 아프지.
          jiwoo: 아니.
          haru: 거짓말.
          @wait 1
          haru: …그만. 고마워.
          haru: 내일 또 밀어 줘.
          jiwoo: 응. 내일도.
          > 할머니가 떠난 뒤, 하루가 처음으로 「내일」이라는 말을 했다.
          @emote haru tear
          @wait 1.5
        `,
        explore: {
          enter: [5, 6],
          intro: s`
            > 해 질 녘 놀이터. 같은 그네, 다른 계절.
            nabi: 할머니가 떠난 다음 봄이야. 하루가 열세 살.
          `,
          threads: [
            { at: [9, 6], text: s`
              > 모래밭에 운동화 끝으로 그린 동그라미 두 개. 큰 것 하나, 작은 것 하나.
              nabi: 하루 별이랑 할머니 별이야. 아홉 살 때 마당에서 정한 거.
            ` },
            { at: [12, 4], text: s`
              > 가로등이 막 켜지려는 참이다. 깜빡, 하다 멈춰 있다.
              toby: …세 번 깜빡이면 좋겠다.
            ` },
            { at: [19, 9], text: s`
              > 정글짐 옆에 던져 둔 하루 책가방. 지퍼 틈으로 별 접는 종이가 비죽 나와 있다.
              bori: 할머니 떠나고는 한 번도 안 접었는데. …버리지는 못했구나.
            ` },
          ],
          looks: [
            { at: [14, 4], text: s`
              > 그네에 앉은 하루. 발끝을 땅에 꾹 대고 있다. 그네가 움직이지 않게.
              ruru: 그네를 저렇게 타는 사람은 처음 봐.
            ` },
            { at: [10, 9], text: s`
              > 놀이터 입구의 지우. 숨이 차다. 한 손에 아이스크림, 한 손에 휴대폰.
              toby: 학교에서부터 뛰어왔나 봐.
            ` },
          ],
        },
        after: s`
          ruru: 지우, 괜찮은 애네.
          nabi: 하루 단짝이니까.
          bori: 큰 쪽을 줬어. 할머니처럼.
          toby: 할머니가 밀던 그네를 이제 다른 사람이 밀어. …그래도 되는 거야. 할머니도 그걸 바랐을 거야.
        `,
      },
      {
        kind: 'link',
        id: 'lOut',
        at: [30, 17],
        name: '벤치 위의 두 별',
        icon: 'star',
        locked: s`toby: 아직 기억 조각이 남아 있어. 놀이터 구석까지 다 살펴보자.`,
        scene: s`
          @bars on
          > 벤치 밑에서 올려다본 밤하늘. 구름 사이로 별 두 개가 나란히 떠 있다. 큰 별 하나, 작은 별 하나.
          nabi: 하루 별이랑 할머니 별.
          bori: 집 밖에서 보니까 더 잘 보여.
          toby: 할머니는 저 별 옆에 있겠다고 했어. 이제 하나 남았어. 맨 처음. 내가 하루한테 온 날. 장난감 상자로…
          @sfx windTick
          @wait 0.8
          > 끼………… 토비가 한 걸음 내딛다가, 그대로 비틀거렸다.
          @emote bori !
          bori: 토비!
          @wait 1
          @sfx windTick
          > …릭. 아주 느리게, 태엽이 다시 돈다.
          toby: …괜찮아. 조금 느려졌을 뿐이야. 밖에 오래 있어서 그래.
          ruru: 조금이 아니던데.
          nabi: 토비. 장난감 상자로 가기 전에, 네 안으로 먼저 들어가 보자.
          toby: 내… 안으로?
          nabi: 넌 열한 해 동안 하루 곁에서 다 들었잖아. 네가 잊어버린 것까지, 전부 네 태엽 속에 감겨 있을 거야.
          bori: 그걸 찾으면, 태엽이 조금 더 버텨 줄지도 몰라.
          @emote toby sweat
          toby: …남의 속을 들여다보는 건 부끄러운데.
          ruru: 우리가 남이야?
          > 상징물에 깃든 기억이 흐트러져 있다. 조각을 맞춰야 다음 기억으로 이어진다.
          @mini memento16
          @sfx open
          @flag lOut_done
          @sfx memory
          @fade 1 1.4 white
          @next
        `,
      },
      { kind: 'gap', id: 'gOut', at: [12, 11], tiles: [[13, 11]] },
      { kind: 'block', id: 'bOut', at: [26, 11], look: 'shoe' },
      {
        kind: 'trigger',
        id: 'tOUdrain',
        rect: [10, 8, 3, 7],
        unless: 'gap_gOut',
        scene: s`
          > 골목을 가로지르는 하수구 도랑. 바닥이 까마득하다.
          ruru: 하루한테는 한 걸음, 우리한테는 낭떠러지네. 밧줄이면 돼! 도랑 앞에서 나를 불러.
          bori: 떨어지면 하수구 냄새 배겠다.
          nabi: 그러니까 떨어지지 마.
        `,
      },
      {
        kind: 'trigger',
        id: 'tOUshoe',
        rect: [22, 9, 4, 5],
        unless: 'mem_mOUe',
        scene: s`
          > 놀이터 울타리의 좁은 틈을 커다란 운동화 한 짝이 막고 있다.
          bori: 누가 잃어버린 운동화야. 왼쪽에서 밀면 놀이터 안으로 밀려 들어가겠다!
          ruru: 냄새 맡지 마, 보리.
        `,
      },
      {
        kind: 'trigger',
        id: 'tOUdark',
        rect: [27, 1, 7, 7],
        unless: 'mem_mOUf',
        scene: s`
          > 미끄럼틀 밑은 가로등 빛이 닿지 않는다. 깜깜하다.
          nabi: 내 등불 가까이 붙어. 어둠 속에 뭐가 있어.
        `,
      },
      {
        kind: 'trigger',
        id: 'tOUbike',
        rect: [15, 8, 2, 7],
        scene: s`
          @sfx carPass
          > 부르릉. 골목 끝에서 오토바이 불빛이 훑고 지나간다.
          @shake 0.4
          @emote ruru !
          @emote bori !
          ruru: 엎드려!
          bori: …벌써 지나갔어.
          nabi: 장난감은 원래 엎드려 있는 거야. 놀라지 마.
        `,
      },
      { kind: 'star', id: 'sOUa', at: [1, 3], text: '담벼락 틈에 끼어 있던 종이별.' },
      { kind: 'star', id: 'sOUb', at: [24, 17], text: '구멍가게 옆 보도블록 틈의 종이별.' },
      { kind: 'star', id: 'sOUc', at: [38, 1], text: '놀이터 울타리 구석, 바람에 날려 온 종이별.' },
      { kind: 'star', id: 'sOUd', at: [28, 20], text: '모래에 반쯤 묻힌 종이별. 등불에 반짝인다.', dark: true },
      {
        kind: 'spot',
        id: 'oGate',
        at: [2, 17],
        scene: s`
          > 파란 대문. 아래쪽에 장난감 하나가 겨우 지나갈 틈이 있다.
          ruru: 우리가 저기로 나왔다고? 배를 이렇게 넣고?
          bori: 나는 좀 끼었어.
          nabi: 돌아갈 때는 꿀 덜 먹고 가.
        `,
      },
      {
        kind: 'spot',
        id: 'oPole',
        at: [17, 6],
        scene: s`
          > 전봇대. 위를 올려다봐도 끝이 안 보인다. 「전단지 붙이지 마시오」 아래 전단지가 잔뜩 붙어 있다.
          ruru: 「잃어버린 고양이를 찾습니다」… 나비, 너 아니야?
          nabi: 나는 잃어버린 게 아니라 산책 중이야.
        `,
      },
      {
        kind: 'spot',
        id: 'oStick',
        at: [21, 5],
        scene: s`
          > 보도에 떨어진 아이스크림 막대. 「한 개 더」라고 찍혀 있다.
          bori: 당첨이다! 이거 가져가면 하나 더 준대!
          ruru: 우리 키보다 막대가 더 길어. 어떻게 들고 갈 건데.
          bori: …둘이 들면 되지.
        `,
      },
      {
        kind: 'spot',
        id: 'oPuddle',
        at: [17, 12],
        scene: s`
          > 웅덩이. 장난감 눈에는 호수만 하다. 가로등과 달이 한꺼번에 비친다.
          toby: 하루는 웅덩이를 그냥 지나간 적이 없었어. 다섯 살 때도, 열 살 때도.
          ruru: 열 살 때도?
          toby: 할머니가 안 볼 때만.
        `,
      },
      {
        kind: 'spot',
        id: 'oPaws',
        at: [23, 10],
        scene: s`
          > 젖은 아스팔트 위에 고양이 발자국이 점점이 이어진다. 놀이터 쪽으로.
          bori: 나비 친척이야?
          nabi: 나는 이불로 만들어졌어. 친척 없어.
          @wait 0.6
          nabi: …그래도 조금 반갑긴 하네.
        `,
      },
      {
        kind: 'spot',
        id: 'oSand',
        at: [34, 14],
        scene: s`
          > 놀이터 모래. 발이 푹푹 빠진다.
          ruru: 으악, 꼬리에 모래 들어갔어!
          bori: 모래 위에선 천천히 걸어야 돼. 태엽처럼.
          toby: 그건 내 대사야.
        `,
      },
      {
        kind: 'spot',
        id: 'oSwing',
        at: [35, 9],
        scene: s`
          @sfx swing
          > 빈 그네. 바람이 불 때마다 혼자 조금씩 흔들린다.
          bori: 누가 밀어 주는 것 같아.
          nabi: 바람이야.
          toby: …응. 바람이겠지.
        `,
      },
      {
        kind: 'spot',
        id: 'oShop',
        at: [20, 3],
        scene: s`
          > 구멍가게 셔터. 「내일 아침 일곱 시에 엽니다」. 셔터 틈으로 냉장고 불빛이 파랗게 새어 나온다.
          bori: 일곱 시면… 우리 이사 가는 날 아침이네.
          ruru: 마지막 아이스크림은 못 먹고 가겠다.
        `,
      },
    ],
  });
}
