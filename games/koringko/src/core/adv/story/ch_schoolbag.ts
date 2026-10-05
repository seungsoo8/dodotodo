/** 곁가지 장 · 하루의 책가방 — 지우가 기억하는 할머니 (현관 다음, 책상 앞) */
import { s } from '../parse.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { grid, house, toyRoom } from './kit.ts';

/**
 * 장난감 크기 책가방 속: 안감(a) 바닥, 세워 꽂은 공책 · 교과서(E)가 벽과 칸막이.
 * 아래 큰 칸 왼쪽(시작) → 반쯤 열린 지퍼 틈(밧줄)을 건너 위 앞주머니,
 * 아래 칸 가운데 공책 칸막이의 빈 칸은 둘둘 만 공책이 막고 있다 (보리가 민다) → 아래 칸 오른쪽.
 */
const MAP = grid(30, 18, 'y', 'E', [
  // 큰 칸과 앞주머니 사이, 반쯤 열린 지퍼 (루루 밧줄)
  ['v', 1, 7, 28, 1],
  // 큰 칸 가운데 공책 칸막이, 한 칸은 둘둘 만 공책이 막고 있다
  ['E', 17, 8, 1, 9],
  ['y', 17, 12, 1, 1],
  // 큰 칸 왼쪽: 교과서 더미 · 지우개 · 굴러다니는 구슬
  ['E', 9, 10, 3, 2],
  ['G', 5, 10, 1, 1],
  ['O', 13, 15, 1, 1],
  // 큰 칸 오른쪽: 공책 더미 · 연필깎이 (가운데 줄은 비워 둔다 — 공책이 미끄러져 갈 자리)
  ['E', 21, 9, 2, 2],
  ['E', 24, 14, 2, 2],
  ['G', 27, 9, 1, 1],
  // 앞주머니: 필통 · 공책 · 지우개
  ['E', 5, 2, 2, 3],
  ['E', 12, 1, 1, 4],
  ['E', 19, 3, 3, 2],
  ['G', 9, 5, 1, 1],
  ['G', 25, 2, 1, 1],
  ['O', 15, 5, 1, 1],
]);

export const CH_SCHOOLBAG: Chapter = {
  n: 0,
  title: '0장 · 하루의 책가방',
  sub: '지우가 기억하는 할머니',
  room: 'schoolbag',
  start: [3, 15],
  party: ['toby', 'bori', 'ruru', 'nabi'],
  wind: 0.52,
  intro: s`
    @fade 1 0 white
    @bars on
    @music night
    @chtitle
    @fade 0 2
    > 하루 방 의자에 걸린 낡은 초등학교 책가방 속. 연필 가루, 공책 냄새, 그리고 오래된 우유 냄새.
    ruru: 으, 우유 냄새! 이거 몇 년 된 거야?
    nabi: 하루가 중학생이 되고도 안 버린 가방이야. 이사 짐에도 아직 안 넣었고.
    bori: 왜 안 버렸어?
    toby: 앞주머니에 뭐가 들어 있대. 하루가 절대 안 여는 거.
    ruru: 그럼 열어 봐야지!
    nabi: 루루.
    ruru: 농담이야. …반만.
    @wait 0.6
    toby: 그런데 여긴 할머니 냄새 말고, 다른 냄새도 나.
    bori: 딸기 지우개 냄새. …지우다!
    @emote ruru ?
    ruru: 지우개가 지우지 그럼 뭐가 지워.
    nabi: 지우개 말고, 지우. 하루 단짝.
    @bars off
    @goal 기억 조각 여섯 개를 찾자
  `,
};

export function schoolbagRoom(): RoomDef {
  return toyRoom('schoolbag', MAP, {
    name: '하루의 책가방',
    theme: 'village',
    start: [3, 15],
    music: 'night',
    ambient: [104, 98, 132],
    beams: [{ x: 8, w: 4, h: 18, slant: 1 }, { x: 22, w: 3, h: 7, slant: 1 }],
    lights: [{ at: [15, 1], r: 90, color: [255, 220, 170], k: 0.35 }],
    things: [
      {
        kind: 'memory',
        id: 'mJa',
        at: [4, 13],
        name: '김밥 두 줄',
        caption: '「하나는 친구 주렴」 — 할머니가 싸 준 소풍 도시락',
        scene: s`
          @room m_jw_picnic
          @show haru haru10 7 5 down sit
          @show jiwoo jiwoo10 14 4 left sit
          @music waltz
          > 하루, 열 살. 4학년 봄 소풍. 반이 바뀌고 한 달째, 하루는 아직 같이 앉을 친구가 없었다.
          > 할머니가 싸 준 도시락을 열자, 김밥이 두 줄. 그리고 쪽지 한 장.
          haru: 「하나는 친구 주렴. — 할머니」
          @emote haru sweat
          haru: …친구 없는데.
          @wait 0.8
          @face haru right
          > 저쪽 덤불 옆. 지난주에 전학 온 아이가 무릎을 끌어안고 혼자 앉아 있다. 도시락이 없다.
          @wait 1
          @pose haru idle
          @walk haru 12 4 40
          haru: 저기… 너 지우지? 전학 온.
          @face jiwoo haru
          jiwoo: …응.
          haru: 너 도시락 없어?
          jiwoo: …응.
          haru: 우리 할머니가 하나는 친구 주래. 근데 나 친구 없어.
          @wait 0.6
          haru: 그러니까… 네가 먹어.
          @emote jiwoo !
          jiwoo: 그럼 나 이제 네 친구야?
          haru: …김밥 먹으면 친구야.
          jiwoo: 그럼 먹을래.
          > 지우는 김밥 한 줄을 다 먹었다. 꽁다리까지.
          jiwoo: 너네 할머니 김밥, 세상에서 제일 맛있다.
          @emote haru ♪
          haru: 당연하지. 우리 할머니가 싼 건데.
          @wait 1.5
        `,
        after: s`
          bori: 김밥 두 줄! 할머니는 처음부터 알았던 거야. 하루한테 친구가 없다는 거.
          ruru: 다른 애한테 도시락이 없을 거라는 것까지? 할머니 무슨 점쟁이야?
          nabi: 아니. 그냥 매번 두 줄 쌌을 거야. 친구가 생길 때까지.
          toby: …그게 할머니 방식이지.
        `,
      },
      {
        kind: 'memory',
        id: 'mJb',
        at: [13, 9],
        name: '만두 별',
        caption: '「삐뚤어진 별도 별이다」 — 유리병 속 지우의 별',
        scene: s`
          @room m_room10
          @show haru haru10 7 6 right sit
          @show jiwoo jiwoo10 10 6 left sit
          @show gm grandma 8 4 down sit
          @music box
          > 그해 가을. 지우가 처음으로 하루네 집에 놀러 왔다.
          haru: 봐 봐. 띠를 이렇게 묶고, 감고, 감고… 모서리를 꾹 누르면.
          @sfx fold
          haru: 별!
          jiwoo: 우와. 나도 할래.
          @sfx fold
          @wait 1
          jiwoo: …이거 별 맞아?
          > 지우의 별은 한쪽이 푹 찌그러져 있었다. 별이라기보다는 납작한 만두.
          haru: 푸하하! 만두다!
          @emote jiwoo anger
          jiwoo: 웃지 마!
          gm: 어디 보자.
          @wait 0.6
          gm: 아이고, 잘 접었네. 이건 지우 별이다.
          haru: 할머니, 그거 찌그러졌는데?
          gm: 삐뚤어진 별도 별이다. 접은 사람 마음은 똑같이 들어가거든.
          @sfx star
          > 할머니는 찌그러진 별을, 하루 책상 위 종이별 유리병에 쏙 넣었다.
          @emote haru !
          haru: 어! 그거 내 병인데! 천 개는 내가 접어야 되는데!
          gm: 소원은 여럿이 빌면 더 잘 닿는단다. 그렇지, 지우야?
          jiwoo: …네!
          @emote jiwoo ♪
          jiwoo: 하루야, 너 소원 뭐야?
          haru: 비밀.
          @wait 1.2
        `,
        after: s`
          ruru: 만두 별! 하루 웃는 거 오랜만에 봤다.
          nabi: 그 별, 아직 유리병 안에 있어. 바닥 근처에. 찌그러져서 금방 찾아.
          toby: 구백구십구 개 중에 하나는 지우 거였구나.
          bori: 그럼 하루는… 혼자 접은 게 아니었네.
        `,
      },
      {
        kind: 'memory',
        id: 'mJc',
        at: [26, 11],
        name: '비밀 하나씩',
        caption: '할머니 기침을 먼저 알아챈 건 지우였다',
        scene: s`
          @room m_kitchen_d
          @show gm grandma 5 4 right
          @show jiwoo jiwoo10 13 7 left
          @music box
          > 하루, 열한 살. 여름 방학. 하루가 아이스크림을 사러 나간 사이, 지우는 부엌에서 할머니와 단둘이 남았다.
          gm: 지우는 수박 좋아하니?
          jiwoo: 네! 씨까지 먹어요.
          gm: 허허, 하루랑 똑같네.
          @sfx cough
          gm: 콜록, 콜록… 콜록.
          @emote gm sweat
          > 기침이 길었다. 할머니는 싱크대를 붙잡고 한참을 서 있었다.
          @emote jiwoo !
          @walk jiwoo 6 7 50
          @walk jiwoo 6 5 40
          @face jiwoo gm
          jiwoo: 할머니, 아파요?
          gm: 아니, 아니. 감기가 좀 오래가서 그래.
          jiwoo: 하루가 그러는데, 할머니 작년부터 감기래요.
          @wait 1
          gm: …지우는 눈이 밝구나.
          gm: 지우야. 이건 하루한테 비밀로 해 줄래? 우리 하루, 걱정이 많은 애라.
          @emote jiwoo …
          jiwoo: …그럼 저도 비밀 하나 말해도 돼요?
          gm: 그럼. 비밀은 하나씩 바꾸는 거지.
          jiwoo: 소풍 날요. 저 사실 도시락 있었어요. 가방에. 삼각김밥.
          @emote gm ?
          jiwoo: 근데 하루랑 친구 하고 싶어서… 안 꺼냈어요.
          @wait 0.8
          @emote gm ♪
          gm: 허허허! 그럼 그날 김밥은 제 주인을 제대로 찾아간 거구나.
          @sfx door
          > 현관에서 하루 목소리. "할머니! 지우야! 수박바 샀어!"
          gm: 쉿.
          jiwoo: 쉿.
          > 둘은 동시에 입술에 손가락을 댔다.
          @wait 1.2
        `,
        explore: {
          enter: [2, 9],
          intro: s`
            toby: 할머니네 부엌. 하루가 열한 살이던 여름 방학이야.
            ruru: 어, 하루가 없네? 지우만 있어.
            nabi: 이건 지우가 본 할머니야. 기억의 실을 찾으면 이 순간이 흘러가.
          `,
          threads: [
            { at: [8, 7], text: s`
              > 식탁 위 쟁반에 잘라 둔 수박. 씨가 송송 박혀 있다.
              bori: 수박! …한 조각만.
              ruru: 기억 속 수박 먹으면 기억이 상해.
              bori: 그런 게 어딨어.
              ruru: 몰라. 방금 지어냈어.
            ` },
            { at: [4, 4], text: s`
              > 한여름인데 할머니는 긴소매다. 앞치마 주머니에 손수건이 불룩하다.
              nabi: 그해 여름부터였어. 할머니가 소매를 안 걷으신 거.
            ` },
            { at: [14, 3], text: s`
              > 벽 달력. 방학 칸 여기저기에 할머니 글씨로 작은 동그라미. 「병원」, 「병원」.
              toby: 하나같이 하루가 지우랑 수영장 간 날이야. 하루가 집에 없는 날만 골랐어.
            ` },
          ],
          looks: [
            { at: [13, 8], text: s`
              > 지우. 부엌 문가에서 할머니 쪽을 보고 있다.
              toby: 지우는 하루네 집에 오면 늘 부엌부터 들렀어. 할머니한테 인사하러.
              ruru: 수박 보러겠지.
            ` },
            { at: [5, 5], text: s`
              > 할머니. 수박 자르던 칼을 막 내려놓았다. 숨이 조금 가쁘다.
              bori: 웃고 계신데… 어깨가 들썩여.
            ` },
          ],
        },
        after: s`
          ruru: 삼각김밥을 숨겼다고? 친구 하려고? 지우 완전 작전가네.
          bori: 나 같으면 김밥이랑 삼각김밥 둘 다 먹었을 텐데.
          nabi: 지우는 그때부터 알았던 거야. 할머니 기침. 하루보다 먼저.
          toby: 그리고 끝까지 말 안 했어. 약속이니까.
          @emote toby …
          toby: …그게 고마운 건지, 서운한 건지 모르겠어.
        `,
      },
      {
        kind: 'memory',
        id: 'mJd',
        at: [3, 2],
        name: '주머니 속 별',
        caption: '「지우는 거짓말 싫어하지? 그럼 대답 안 할게」',
        scene: s`
          @room m_hospital
          @show jiwoo jiwoo13 4 8 right
          @music rain
          > 하루, 열두 살. 겨울. 하루 몰래, 지우 혼자 병원에 왔다. 엄마를 한참 졸라서.
          @walk jiwoo 7 6 40
          @face jiwoo right
          jiwoo: 할머니, 저 지우예요.
          gm: 아이고, 지우 왔니. 하루는?
          jiwoo: 하루는 몰라요. 하루한테는 비밀요.
          gm: 또 비밀이네. 우리 둘은 비밀이 많구나.
          jiwoo: 하루 요즘 쉬는 시간에도 별만 접어요. 수업 시간에 책상 밑에서 접다가 선생님한테 걸렸어요.
          gm: 허허… 그 녀석.
          jiwoo: 그래서 이제 제가 망 봐 줘요.
          @pose jiwoo holdStar
          jiwoo: 그리고 이거… 제가 접은 거예요. 이번 건 안 찌그러졌어요. 엄청 연습했어요.
          gm: 어디 보자… 정말이네. 반듯하다.
          > 할머니는 그 별을 환자복 주머니에 넣었다.
          gm: 이건 하루 병 말고, 할머니 주머니에 넣어 두마.
          @pose jiwoo idle
          @wait 1
          jiwoo: 할머니… 나아요?
          @wait 1.2
          gm: 지우는 거짓말 싫어하지?
          @emote jiwoo …
          jiwoo: …네.
          gm: 그럼 대답 안 할게.
          @wait 1.5
          gm: 지우야, 하나만 부탁하자. 나중에 하루가 할머니 얘기를 안 하거든, 억지로 묻지 마라.
          gm: 그냥 옆에 있어 주렴. 하루는… 하고 싶을 때 할 거다.
          jiwoo: …네.
          @wait 1.5
        `,
        after: s`
          nabi: 할머니가 지우한테는 대답을 안 했어. 거짓말을 안 하려고.
          ruru: 하루한텐 "괜찮대" 했잖아. 왜 지우한텐…
          toby: 하루한텐 웃는 얼굴을 지켜야 했고, 지우한텐 부탁을 해야 했으니까. 거짓말로는 부탁을 못 하잖아.
          bori: 그 반듯한 별은 어디 갔을까.
          @wait 0.8
          toby: …할머니 주머니에. 끝까지.
        `,
      },
      {
        kind: 'memory',
        id: 'mJe',
        at: [16, 2],
        name: '소매',
        caption: '아무것도 묻지 않고, 소매 끝을 꼭 잡았다',
        scene: s`
          @room m_jw_class
          @show haru haru13 6 5 down sit
          @show jiwoo jiwoo13 7 5 down sit
          @music sorrow
          > 하루, 열세 살. 장례식이 끝나고 처음 학교에 간 날.
          > 쉬는 시간. 교실은 시끄러운데, 하루 자리만 조용하다.
          > 앞자리 아이가 돌아본다. "하루야, 너네 할머니 돌아가셨다며? 어떻게 돌아가—"
          @face jiwoo up
          jiwoo: 하루 오늘 피곤해.
          > "아니, 나는 그냥 궁금해서—"
          jiwoo: 나중에 물어. …아니, 묻지 마.
          @emote jiwoo anger
          > 아이가 머쓱하게 돌아앉았다.
          @wait 1
          @face jiwoo down
          > 지우는 더 아무 말도 하지 않았다. 대신 책상 밑으로, 하루의 소매 끝을 꼭 잡았다.
          @emote haru …
          @wait 1.5
          haru: …어젯밤 문자.
          jiwoo: 응.
          haru: 「응」이라고 보낸 거.
          jiwoo: 알아. 응 아닌 거.
          @wait 1.5
          > 그날 하루는 할머니 얘기를 한 마디도 하지 않았다. 지우도 묻지 않았다.
          > 마지막 종이 칠 때까지, 지우는 소매를 놓지 않았다.
          @wait 1.5
        `,
        after: s`
          bori: 소매 잡는 거… 나도 하루한테 늘 해 주고 싶었어. 팔이 짧아서 못 했지만.
          ruru: 지우 화낼 줄도 아네. 「묻지 마」. 좀 멋있다.
          nabi: 할머니 부탁을 지킨 거야. 자기도 안 묻고, 남들도 못 묻게.
          toby: 말 안 해도 알아주는 사람이… 우리 말고도 있었구나.
        `,
      },
      {
        kind: 'memory',
        id: 'mJf',
        at: [27, 5],
        name: '앞주머니 편지',
        caption: '「내가 먼저 감을게」 — 지우가 남긴 노란 별과 편지',
        scene: s`
          @room m_jw_room14
          @show haru haru14 11 6 left
          @show jiwoo jiwoo13 7 6 right
          @music minor
          > 하루, 열네 살 가을. 할머니 없는 첫 생신날. 지우가 오랜만에 하루 방에 왔다.
          jiwoo: 하루야. 오늘 할머니 생신이지.
          @emote haru …
          jiwoo: 나 미역국은 못 끓이니까… 이거.
          @pose jiwoo holdStar
          jiwoo: 노란 별. 할머니 노란색 좋아하셨잖아. 할머니 방에 놓아 드려도 돼?
          haru: …안 돼.
          jiwoo: 문 앞에만이라도—
          haru: 하지 마.
          @face haru right
          haru: 너 왜 자꾸 할머니 얘기 해?
          jiwoo: …나도 할머니 보고 싶어서.
          haru: 네 할머니 아니잖아!
          @emote jiwoo !
          @wait 1.5
          haru: …이제 나 혼자 있고 싶어. 가.
          @wait 1.5
          @pose jiwoo idle
          > 지우는 아무 말 없이, 의자에 걸린 옛날 책가방 앞주머니에 무언가를 넣었다. 4학년 때부터 쪽지를 넣던 자리.
          @walk jiwoo 1 3 40
          @sfx door
          @hide jiwoo
          @fade 1 0.6 black
          @show haru haru14 3 5 up sit
          @fade 0 0.8
          > 그날 밤. 하루는 앞주머니에서 노란 별 하나와 접힌 쪽지를 꺼냈다.
          > 「하루야. 미안해. 내가 먼저 감을게.」
          > 「너네 할머니가 그랬어. 미안하다는 말은 태엽 같은 거라고. 먼저 감는 사람이 이기는 거래.」
          > 「할머니 얘기 안 해도 돼. 나도 이제 안 할게. 근데 나 안 가. 계속 옆자리야. — 지우」
          @emote haru tear
          @wait 1.5
          @pose haru phone
          > 하루는 휴대폰을 들었다. 「미안」. 썼다가, 지운다.
          @wait 1
          > 「내일 모퉁이에서 기다릴게」.
          @sfx pop
          > 전송. 답장은 금방 왔다. 「응」.
          @wait 1
          > 하루는 별과 쪽지를 앞주머니에 도로 넣었다. 그 뒤로 한 번도 꺼내지 않았다. 버리지도 않았다.
          @wait 1.5
        `,
        explore: {
          enter: [15, 8],
          intro: s`
            toby: 하루 방이야. 열네 살 가을, 할머니 없는 첫 생신날.
            ruru: 지우다. 키 많이 컸네.
            bori: 둘 다 표정이… 실부터 찾자.
          `,
          threads: [
            { at: [3, 5], text: s`
              > 의자 등받이에 걸린 낡은 초등학교 책가방. 앞주머니 지퍼가 반쯤 열려 있다.
              toby: 우리가 방금까지 있던 가방이야.
              ruru: 밖에서 보니까 쪼그맣네. 안에선 그렇게 넓더니.
            ` },
            { at: [12, 3], text: s`
              > 벽에 걸린 운동회 사진. 반창고 붙인 하루와 할머니. 귀퉁이에 「하루 화이팅」 종이.
              ruru: 저 종이 든 애, 지우잖아.
              nabi: 그날 하루 무릎에 반창고 붙여 준 것도 지우였어.
            ` },
            { at: [10, 7], text: s`
              > 장난감 상자. 뚜껑에 엄마 글씨로 「장난감」.
              toby: 우린 저 안에 있었어. 나비만 빼고.
              nabi: 난 이불장. …둘 다 깜깜하긴 마찬가지였어.
            ` },
          ],
          looks: [
            { at: [7, 7], text: s`
              > 열세 살 지우. 등 뒤로 감춘 손에 노란 종이별 하나. 모서리가 반듯하다.
              bori: 할머니가 노란색 좋아하셨지.
            ` },
            { at: [11, 7], text: s`
              > 열네 살 하루. 입을 꾹 다물고 있다. 오늘이 무슨 날인지 아는 얼굴.
              toby: 아침에 엄마가 미역국을 끓였어. 하루는 한 숟갈도 안 떴고.
            ` },
            { at: [4, 4], text: s`
              > 책상 위 종이별 유리병. 뚜껑에 먼지가 앉았다. 바닥 근처에 찌그러진 별 하나.
              nabi: 만두 별이야. 하루는 저 병을 일 년 넘게 안 열었어.
            ` },
          ],
        },
        after: s`
          ruru: 「응」. 이번 응은 진짜 응이네.
          nabi: 둘은 다음 날 모퉁이에서 만나서, 아무 말 없이 학교에 갔어. 그다음 날도.
          toby: 하루는 그 뒤로도 할머니 얘기를 안 했어. 지우한테도.
          bori: 지우는 하루가 이사 가는 것도 알아?
          nabi: 알아. 하루가 말 안 해도.
          @emote toby …
          toby: …지우는 늘 그랬지. 말 안 해도 아는 애.
        `,
      },
      {
        kind: 'link',
        id: 'lJ',
        at: [23, 2],
        name: '노란 별',
        icon: 'star',
        locked: s`nabi: 아직 기억 조각이 남아 있어. 큰 칸 안쪽도, 앞주머니 구석도 살펴보자.`,
        scene: s`
          @bars on
          > 앞주머니 맨 안쪽. 반듯하게 접힌 노란 별 하나와, 여러 번 접었다 편 쪽지.
          bori: 지우 별이다. 이번엔 하나도 안 찌그러졌어.
          ruru: 만두에서 별까지. 오래도 걸렸네.
          nabi: 지우는 하루한테 별 접기를 배웠고.
          toby: 하루는 할머니한테 배웠지. 열 살, 책상 앞에서.
          @emote toby …
          toby: 거기서부터야. 별도, 소원도.
          bori: 가자, 책상으로!
          > 상징물에 깃든 기억이 흐트러져 있다. 조각을 맞춰야 다음 기억으로 이어진다.
          @mini memento8
          @sfx open
          @flag chj_done
          @sfx memory
          @fade 1 1.4 white
          @next
        `,
      },
      { kind: 'gap', id: 'gJ', at: [6, 8], tiles: [[6, 7]] },
      { kind: 'block', id: 'bJ', at: [17, 12], look: 'book' },
      {
        kind: 'trigger',
        id: 'tJgap',
        rect: [3, 8, 7, 2],
        unless: 'gap_gJ',
        scene: s`
          ruru: 지퍼가 반쯤 열려서 틈이 생겼네. 저 위가 앞주머니야.
          ruru: 틈 앞에서 나 불러. 지퍼 고리에 밧줄 걸면 끝이지.
        `,
      },
      {
        kind: 'trigger',
        id: 'tJbook',
        rect: [13, 11, 4, 3],
        unless: 'mem_mJc',
        scene: s`bori: 둘둘 만 공책이 칸막이 사이를 막고 있어. 왼쪽에서 내가 밀게!`,
      },
      { kind: 'star', id: 'sJa', at: [1, 8], text: '가방 안감 솔기에 끼어 있던 종이별.' },
      { kind: 'star', id: 'sJb', at: [28, 16], text: '큰 칸 구석, 지우개 가루 속에 묻힌 종이별.' },
      { kind: 'star', id: 'sJc', at: [13, 1], text: '필통 지퍼 고리에 걸린 종이별.' },
      { kind: 'star', id: 'sJd', at: [28, 1], text: '앞주머니 꼭대기, 접힌 가정 통신문 사이의 종이별.' },
      {
        kind: 'spot',
        id: 'jw_nametag',
        at: [2, 11],
        scene: s`
          > 비닐 이름표. 「4학년 2반 하루」. 그 밑에 삐뚤빼뚤한 다른 글씨로 「+지우」.
          ruru: 남의 이름표에 낙서를?
          nabi: 지우 글씨야. 하루가 끝까지 안 지웠어.
          ruru: 지우를 안 지웠네.
          @emote bori sweat
          bori: …방금 그 말장난 누가 했어?
        `,
      },
      {
        kind: 'spot',
        id: 'jw_pencils',
        at: [14, 15],
        scene: s`
          > 자석 필통. 연필 두 자루에 서로의 이름이 바뀌어 쓰여 있다.
          toby: 서로 연필을 바꿔 쓴 거야. 그러면 시험을 잘 본대서.
          nabi: 둘 다 시험은 그냥 그랬어.
        `,
      },
      {
        kind: 'spot',
        id: 'jw_lunchbag',
        at: [22, 14],
        scene: s`
          > 꽃무늬 도시락 주머니. 안쪽에 할머니 바느질 글씨로 「하루」. 구겨진 쪽지가 하나 더 들어 있다.
          > 「오늘은 유부초밥. 하나는 친구 주렴.」
          bori: 정말로 매번 두 개였구나.
          nabi: 소풍 날마다. 6학년 가을 소풍까지.
          ruru: …그다음 소풍은?
          @emote toby …
          toby: 그다음 소풍엔, 지우가 두 개 싸 왔어.
        `,
      },
      {
        kind: 'spot',
        id: 'jw_milk',
        at: [9, 2],
        scene: s`
          > 납작하게 접힌 흰 우유 팩.
          ruru: 냄새 범인 찾았다!
          bori: 하루는 우유 싫어해서, 지우가 매일 대신 마셔 줬대.
          toby: 팩은 하루 가방에 숨기고. 증거 인멸 실패.
        `,
      },
      {
        kind: 'spot',
        id: 'jw_dictation',
        at: [24, 6],
        scene: s`
          > 받아쓰기 공책. 빨간 색연필로 60점. 그 옆에 연필 글씨: 「나는 55점. 너 이김. — 지우」
          ruru: 위로하는 방법 한번 독특하네.
          nabi: 하루는 그날 이 공책을 할머니한테 자랑했어. 「나 이겼어!」
          bori: 할머니는 뭐라고 했어?
          nabi: 「그럼 오늘은 둘 다 떡볶이다.」
        `,
      },
    ],
  });
}

/** 이 장에서만 쓰는 사람 크기 기억 방 */
export const SCHOOLBAG_MEMROOMS: Record<string, () => RoomDef> = {
  // 봄 소풍 공원: 덤불 · 꽃밭 · 돗자리
  m_jw_picnic: () =>
    house('m_jw_picnic', 'yardDay', 18, 11, [
      ['fence', 1, 1, 16, 1],
      ['flowers', 2, 2, 4, 1],
      ['flowers', 11, 2, 5, 1],
      ['bush', 15, 4, 2, 2, true],
      ['bush', 1, 7, 2, 2, true],
      ['bush', 13, 7, 3, 2, true],
      ['rug:#e86a6a', 5, 5, 5, 2],
    ], { wallH: 1, music: 'waltz' }),
  // 교실: 책상 두 줄 · 창 · 시계 · 달력
  m_jw_class: () =>
    house('m_jw_class', 'haru10', 18, 11, [
      ['window:day', 2, 0, 3, 2],
      ['window:day', 7, 0, 3, 2],
      ['clock', 11, 0, 2, 2],
      ['calendar', 14, 0, 2, 2],
      ['desk', 2, 4, 2, 1, true],
      ['desk', 6, 4, 2, 1, true],
      ['desk', 10, 4, 2, 1, true],
      ['desk', 2, 7, 2, 1, true],
      ['desk', 6, 7, 2, 1, true],
      ['desk', 10, 7, 2, 1, true],
      ['shelf', 15, 3, 2, 1, true],
    ], { music: 'minor' }),
  // 14살 하루의 방 (해 질 녘): 책상 · 침대 · 의자에 걸린 옛날 책가방
  m_jw_room14: () =>
    house('m_jw_room14', 'haru14', 18, 11, [
      ['window', 7, 0, 3, 2],
      ['door', 1, 1, 1, 2],
      ['photo', 11, 0, 2, 2],
      ['bed:#7a8aa8', 14, 3, 3, 4, true],
      ['rug:#b8a0a8', 6, 5, 6, 3],
      ['desk:jar', 2, 3, 3, 1, true],
      ['chair', 3, 4, 1, 1, true],
      ['toybox:label', 10, 8, 2, 1, true],
    ], { music: 'minor' }),
};
