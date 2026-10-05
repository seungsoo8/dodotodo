/** 곁가지 장 · 엄마의 화장대 — 엄마도 엄마를 잃었다 (2장 할머니 방과 3장 침대 밑 사이) */
import { s } from '../parse.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { grid, house, toyRoom } from './kit.ts';

/**
 * 장난감 크기 화장대 위: 나무 상판(d), 가장자리는 화장품 상자들(K).
 * 아래 왼쪽(시작) → 서랍 틈(밧줄) 너머 위 왼쪽 / 보석함 아래로 가운데(손거울) → 분첩을 밀면 오른쪽.
 */
const MAP = grid(30, 18, 'd', 'K', [
  // 화장대 서랍 틈 (루루 밧줄)
  ['v', 1, 7, 9, 1],
  // 보석함 칸막이 (아래쪽 두 칸은 지나갈 수 있다)
  ['K', 10, 1, 1, 16],
  ['d', 10, 13, 1, 2],
  // 화장품 상자 칸막이 (가운데 한 칸은 분첩이 막고 있다 — 보리가 민다)
  ['K', 20, 1, 1, 16],
  ['d', 20, 9, 1, 1],
  // 눕혀 둔 손거울
  ['b', 12, 3, 6, 5],
  // 향수병 · 크림 통
  ['O', 3, 11, 1, 1],
  ['O', 8, 3, 1, 1],
  ['O', 15, 11, 1, 1],
  ['O', 18, 5, 1, 1],
  ['O', 24, 7, 1, 1],
  ['O', 27, 12, 1, 1],
  // 머리핀 · 립스틱
  ['G', 6, 14, 1, 1],
  ['G', 13, 14, 1, 1],
  ['G', 25, 3, 1, 1],
]);

export const CH_DRESSER: Chapter = {
  n: 0,
  title: '0장 · 엄마의 화장대',
  sub: '엄마도 엄마를 잃었다',
  room: 'dresser',
  start: [3, 15],
  party: ['toby', 'bori', 'ruru', 'nabi'],
  wind: 0.75,
  intro: s`
    @fade 1 0 white
    @bars on
    @music night
    @chtitle
    @fade 0 2
    > 엄마 방, 화장대 위. 향수병이 탑처럼 서 있고, 손거울이 호수처럼 누워 있다.
    ruru: 우와, 반짝반짝. 여기 냄새 장난 아니다. 코가 어지러워.
    bori: 킁킁… 꽃 냄새, 핸드크림 냄새. 그리고 아주 조금… 할머니 파스 냄새.
    toby: 엄마 화장대에 올라온 건 처음이야.
    nabi: 우린 늘 하루 방에만 있었으니까.
    @wait 0.8
    toby: …나비. 할머니가 떠났을 때, 우린 하루 걱정만 했지.
    nabi: 응.
    toby: 엄마 걱정은… 한 번도 안 했어.
    @emote bori …
    bori: 엄마는 늘 괜찮아 보였으니까.
    ruru: 괜찮아 「보였다」가 문제지. 보이는 거랑 진짜는 다르잖아. 나처럼.
    nabi: 루루가 오늘은 맞는 말을 하네.
    ruru: 오늘「도」야.
    @wait 0.6
    toby: 엄마도 엄마를 잃었어. 우리가 못 본 엄마를, 찾아보자.
    @bars off
    @goal 기억 조각 일곱 개를 찾자
  `,
};

export function dresserRoom(): RoomDef {
  return toyRoom('dresser', MAP, {
    name: '엄마의 화장대',
    theme: 'village',
    start: [3, 15],
    music: 'night',
    ambient: [120, 108, 140],
    beams: [{ x: 13, w: 4, h: 10, slant: 2 }],
    lights: [{ at: [15, 5], r: 80, color: [230, 230, 255], k: 0.3 }],
    things: [
      {
        kind: 'memory',
        id: 'mMa',
        at: [7, 11],
        name: '동백꽃 머리핀',
        caption: '「엄마 앞에선 참지 마라」',
        scene: s`
          @room m_ms_oldhome
          @show suni suni40 3 4 up sit
          @music waltz
          @sfx birds
          > 순이, 마흔 무렵. 화장대 앞에서 머리를 빗고 있었다.
          @sfx doorOpen
          @show eunju eunju6 1 3 down
          @sfx doorClose
          > 여섯 살 은주가 무릎을 감싸 쥐고 들어왔다. 입술을 꼭 깨문 채.
          @face suni eunju
          suni: 은주야? 무릎이 왜 그래.
          @walk eunju 7 6 40
          eunju: 그네에서… 떨어졌어. 근데 안 울었어.
          suni: 안 울었어?
          eunju: 아빠가 그랬어. 은주는 씩씩하다고. 씩씩한 애는 안 운대.
          @emote suni …
          @pose suni idle
          @walk suni 6 6 40
          @face suni eunju
          @pose suni kneel
          suni: 아빠 말도 맞지. 그런데 엄마 말도 하나 들어 볼래?
          suni: 엄마 앞에선 참지 마라. 참은 울음은 속에 고여서, 나중에 더 아프단다.
          @wait 1
          @pose eunju cry
          @sfx sob
          > 은주가 으앙 울음을 터뜨렸다. 뒤뜰 감나무가 다 들을 만큼.
          @sfx hug
          @pose suni hug
          @sfx pat
          suni: 그래, 그래. 실컷 울어. 엄마가 다 받아 줄게.
          @wait 1.5
          @pose eunju idle
          suni: 다 울었니? 그럼 머리 다시 묶자. 울고 나면 머리부터 묶는 거다.
          @pose suni idle
          @sfx clothes
          > 순이는 자기 머리에서 동백꽃 머리핀을 빼서, 은주 머리에 꽂아 주었다.
          eunju: 이거 엄마 거잖아.
          suni: 오늘부턴 은주 거. 울고 싶은데 참고 있으면, 이게 콕 찌를 거다.
          eunju: …핀이 찔러?
          suni: 엄마 대신.
          @wait 1.5
        `,
        after: s`
          toby: 할머니한테도 저런 엄마 시절이 있었구나. 엄마한테도 저런 꼬마 시절이.
          ruru: 「씩씩한 애는 안 운대」. 어디서 많이 듣던 말인데.
          bori: 할아버지가 맨 그네에서 떨어졌나 봐. 할아버지, 말은 없어도 할 일은 다 하셨다더니.
          nabi: 저 동백꽃 핀… 지금도 엄마 보석함에 있어. 이사를 몇 번 해도 안 버리셨어.
        `,
      },
      {
        kind: 'memory',
        id: 'mMb',
        at: [3, 3],
        name: '연습한 웃음',
        caption: '병원 복도, 까만 창에 대고 「조금만 더」',
        scene: s`
          @room m_ms_hall_n
          @show mom mom 8 4 up
          @item mMbbag bag 3 4
          @item mMbstar paperstar 2 7
          @music minor
          @sfx clock
          > 하루가 열두 살이던 겨울. 병원 복도, 밤 아홉 시.
          > 의사 선생님의 말이 엄마 귓속에서 계속 울렸다. 「이번 겨울을 넘기시기 어려울 것 같습니다.」
          @wait 1.5
          > 엄마는 까만 복도 창에 비친 자기 얼굴을 보았다.
          mom: …웃자, 은주야. 웃어.
          @emote mom sweat
          > 입꼬리가 올라가다가, 떨렸다. 다시. 또다시.
          @sfx sigh
          @sfx steps
          @show haru haru12 1 6 right holdStar
          haru: 엄마! 여기 있었네.
          @walk haru 6 5 50
          @face mom haru
          > 돌아선 엄마 얼굴은 웃고 있었다. 연습한 대로.
          haru: 오늘 서른 개 접었어. 이제 몇 개 남았게?
          mom: 글쎄. 몇 개 남았을까.
          haru: 이백 개도 안 남았어! 조금만 더 하면 할머니 다 나아.
          @wait 1
          mom: …응. 조금만 더.
          haru: 할머니 깼나? 별 보여 줘야지.
          @walk haru 13 3 50
          @sfx doorOpen
          @hide haru
          @sfx doorClose
          > 병실 문이 닫히자, 엄마 얼굴에서 웃음이 미끄러져 내렸다.
          @face mom up
          @sfx sigh
          @wait 1
          mom: 엄마. …나 이거, 잘 못하겠어.
          @wait 2
        `,
        explore: {
          enter: [16, 8],
          intro: s`
            toby: 여기는… 병원 복도. 하루가 열두 살이던 겨울, 밤이야.
            ruru: 엄마 혼자네. 창 앞에 딱 멈춰 있어.
            nabi: 멈춘 기억 속이야. 흩어진 기억의 실을 모두 찾으면, 이 순간이 다시 흘러가.
          `,
          threads: [
            { at: [3, 4], text: s`
              > 복도 의자 위에 엄마 가방. 지퍼 사이로 병원 서류 봉투가 삐죽 나와 있다.
              toby: 의사 선생님을 만나고 나오는 길이야. 봉투를 끝까지 넣지도 못하고.
            ` },
            { at: [13, 3], text: s`
              > 병실 문. 문틈으로 가느다란 불빛. 안에서 할머니가 잠들어 있다.
              bori: 문 하나 사이야. 할머니랑 엄마.
              ruru: 엄마는 왜 안 들어가? …아, 얼굴부터 고치려고.
            ` },
            { at: [2, 7], text: s`
              > 복도 끝 바닥에 종이별 하나. 누가 흘리고 간 것처럼.
              nabi: 하루가 오고 있어. 주머니에서 별을 흘리면서.
            ` },
          ],
          looks: [
            { at: [8, 5], text: s`
              > 까만 창 앞에 선 엄마. 어깨가 잔뜩 굳어 있다.
              toby: 엄마 얼굴이 창에 비쳐. 웃는 것도, 우는 것도 아닌 얼굴.
            ` },
            { at: [11, 3], text: s`
              > 벽시계. 아홉 시에서 멈춰 있다. 면회가 거의 끝나 가는 시간.
              nabi: 하루는 늘 이 시간까지 별을 접다가 왔어.
            ` },
          ],
        },
        after: s`
          bori: 엄마는 알고 있었구나. 하루가 별 접는 걸 보면서.
          ruru: 알면서 「조금만 더」라니. …그 말 하기 진짜 힘들었겠다.
          nabi: 거짓말이 아니었을지도 몰라. 엄마도 믿고 싶었던 거야.
          toby: 웃는 얼굴을 연습하는 엄마. 하루는 몰랐어. 우리도.
        `,
      },
      {
        kind: 'memory',
        id: 'mMc',
        at: [15, 5],
        name: '검은 머리끈',
        caption: '「오늘은 우리 씩씩하게 하자」',
        scene: s`
          @room m_ms_bed_n
          @show mom mom 4 4 up sit
          @music night
          @sfx clock
          > 장례식 날 새벽. 장례식장에 가기 전.
          > 엄마는 불도 켜지 않고, 검은 옷을 입은 채 화장대 앞에 앉아 있었다.
          @wait 1
          > 거울 속 눈이 퉁퉁 부어 있었다. 엄마는 그 위에 분을 두드렸다. 한 번, 두 번, 세 번.
          @sfx pat
          @sfx doorOpen
          @show haru haru13 1 3 down
          haru: …엄마.
          @pose mom idle
          @face mom haru
          mom: 하루야. 벌써 일어났어?
          haru: 이거, 어떻게 묶어?
          > 하루 손에 검은 머리끈이 들려 있었다.
          mom: 이리 와. 엄마가 묶어 줄게.
          @walk haru 5 5 40
          @face haru up
          @face mom haru
          @sfx clothes
          > 엄마가 하루 머리를 빗었다. 할머니가 엄마 머리를 빗던 손길 그대로.
          @wait 1
          mom: 하루야. 오늘 사람 많이 오실 거야.
          mom: 그러니까 오늘은… 우리 씩씩하게 하자.
          @emote haru …
          haru: …응.
          @wait 1
          > 하루는 울지 않았다. 엄마도 울지 않았다.
          > 화장대 위 보석함 속에서, 동백꽃 머리핀이 가만히 엄마를 보고 있었다.
          @wait 1.5
        `,
        after: s`
          nabi: 「씩씩하게 하자」. 하루는 그 말을 오래 지켰어. 너무 오래.
          toby: 그날부터 하루는 엄마 앞에서 울지 않았어. 우는 건 밤에, 이불 속에서만.
          bori: 엄마는 하루를 지키려고 한 말이었을 거야.
          ruru: 알아. 그래서 더 속상해. …나쁜 사람이 아무도 없는데.
        `,
      },
      {
        kind: 'memory',
        id: 'mMd',
        at: [16, 15],
        name: '물소리',
        caption: '「당신도 오늘 엄마를 보냈잖아」',
        scene: s`
          @room m_ms_kitchen_n
          @show mom mom 4 4 up
          @music sorrow
          > 장례가 끝나고 친척들이 돌아간 밤. 개수대에 그릇이 산더미였다.
          @sfx drip
          @sfx faucet
          > 엄마는 수도꼭지를 끝까지 틀었다. 그릇 부딪는 소리, 물 쏟아지는 소리.
          @sfx dish
          > 그 소리 밑에서, 엄마 어깨가 들썩였다.
          @emote mom tear
          @sfx sob
          @sfx doorClose
          @show dad dad 16 6 left
          @walk dad 14 4 40
          @walk dad 6 4 40
          @face dad mom
          > 아빠가 손을 뻗어 물을 잠갔다.
          @sfx click
          mom: …왜. 설거지 아직 남았어.
          dad: 물소리로 가리지 마.
          @wait 1
          @face mom dad
          mom: 아까 큰고모님이 하루 인형 정리하라고 하셨을 때… 내가 「그냥 두세요」 한마디만 했으면 됐는데.
          mom: 하루가 「네」 하더라. 오늘 엄마 노릇을 하나도 못 했어.
          dad: 은주야.
          dad: 당신도 오늘 엄마를 보냈잖아.
          @emote mom …
          @wait 1
          mom: …그 말, 오늘 처음 들어.
          mom: 다들 「하루는 괜찮니?」만 물었어. 나도 그랬고.
          @pose mom cry
          @sfx hug
          @pose dad hug
          @sfx sob
          @wait 1.5
          > 하루 방 문은 닫혀 있었다. 부엌과 하루 방 사이엔, 복도 하나뿐이었는데.
          @wait 1.5
        `,
        explore: {
          enter: [15, 9],
          intro: s`
            toby: 부엌이야. 장례가 끝난 밤.
            ruru: 물소리가… 아니, 물소리도 멈춰 있어.
          `,
          threads: [
            { at: [6, 4], text: s`
              > 수도꼭지에서 쏟아지던 물줄기가, 유리 막대처럼 공중에 멈춰 있다.
              ruru: 물을 끝까지 틀어 놨네. 무슨 소리를 덮으려고.
              @emote nabi …
            ` },
            { at: [10, 7], text: s`
              > 식탁 위에 하얀 국화 한 송이. 장례식장에서 들고 온 것이다.
              toby: 오늘이었어. 할머니를 보낸 날.
              bori: 아무도 꽃병에 꽂을 생각을 못 했나 봐.
            ` },
            { at: [1, 7], text: s`
              > 부엌 문 너머로 긴 복도. 그 끝에 하루 방 문이 꼭 닫혀 있다.
              nabi: 우린 그날 밤 저 문 안에 있었어. 엄마가 여기 있는 줄도 모르고.
            ` },
          ],
          looks: [
            { at: [4, 5], text: s`
              > 개수대 앞의 엄마. 고무장갑 낀 손이 그릇을 쥔 채 멈춰 있다.
              bori: 어깨가… 들썩이다 만 모양이야.
            ` },
            { at: [14, 5], text: s`
              > 의자 등받이에 걸린 아빠의 검은 양복 윗도리.
              ruru: 아빠는 친척들 배웅하러 나갔나 봐. 곧 돌아오겠지.
            ` },
          ],
        },
        after: s`
          bori: 아빠가 물을 잠가 줬어. 탄 토스트 아빠가.
          ruru: 아빠 은근 멋있다니까. 인형 뽑기 서른 번 할 때부터 알아봤어.
          nabi: 큰고모 말에 다친 건 하루만이 아니었구나.
          toby: 엄마는 그날 엄마를 잃었는데, 다들 엄마한테 「엄마」로만 있으라고 했어. 엄마 자신도.
        `,
      },
      {
        kind: 'memory',
        id: 'mMg',
        at: [25, 10],
        name: '저장된 목소리',
        caption: '「은주야, 밥은 먹고 다니니」 — 놀이터 벤치의 음성 메시지',
        scene: s`
          @room m_out_park_d
          @show mom mom 8 3 down sit
          @item mMgbask basket 10 3
          @music longing
          @sfx carPass
          > 장례를 치르고 열흘째 되던 저녁. 엄마는 장을 보고 돌아오다가, 집 앞 놀이터 벤치에 앉았다.
          > 장바구니 속엔 미역 한 봉지. 왜 샀는지 엄마도 몰랐다.
          @pose mom phone
          > 휴대폰에 지우지 못한 음성 메시지가 하나 있었다. 보낸 사람, 「엄마」. 할머니가 병원에 계시던 겨울.
          mom: …한 번만.
          @sfx click
          @wait 0.8
          > 「은주야, 엄마다. 바쁘지? 그냥 했다. 하루가 오늘 별을 열 개나 더 접었단다.」
          > 「너는… 밥은 먹고 다니니. 끊는다.」
          @wait 1.2
          mom: …먹었어, 엄마.
          @wait 1
          mom: 엄마 앞에선 참지 말라며.
          mom: 엄마가 없으니까… 어디서 울어야 될지 모르겠어.
          @emote mom tear
          > 눈물이 한 줄 흘렀다. 소리는 나지 않았다.
          @wait 1.2
          @sfx wind
          @sfx swing
          > 바람이 불었다. 아무도 없는 그네가 혼자 끼익, 끼익 흔들렸다.
          @face mom right
          mom: …나 그네에서 떨어지고도 안 울었잖아. 엄마가 울라고 해서, 그때 처음 울었어.
          @wait 1
          @sfx phoneVibe
          @sfx phone
          > 손안의 휴대폰이 울렸다. 화면에 「하루」.
          > 엄마는 손등으로 눈가를 꾹 눌렀다. 목소리는 벌써 웃고 있었다.
          mom: 응, 하루야. 엄마 금방 가. 저녁? …미역국 끓여 줄게.
          @pose mom idle
          @wait 1
          @walk mom 10 4 30
          @face mom up
          @take mom mMgbask
          > 엄마는 장바구니를 들고 일어섰다. 빈 그네는 한참을 더 흔들렸다.
          @walk mom 20 5 30
          @hide mom
          @sfx swing
          @wait 1.5
        `,
        explore: {
          enter: [11, 9],
          intro: s`
            toby: 우리 집 앞 놀이터. 해 질 녘이야. 할머니를 보내고 열흘쯤 지난 날.
            ruru: 저기 벤치에… 엄마 혼자야.
          `,
          threads: [
            { at: [14, 4], text: s`
              > 빈 그네 하나가 앞으로 기운 채 공중에 멈춰 있다. 아무도 타지 않았는데.
              ruru: 바람이야. …바람이겠지.
            ` },
            { at: [9, 6], text: s`
              > 모래밭에 누가 두고 간 작은 삽 하나. 반쯤 무너진 두꺼비 집.
              bori: 하루도 여기서 두꺼비 집 많이 지었어. 할머니가 「두껍아 두껍아」 불러 주시면서.
            ` },
            { at: [10, 3], text: s`
              > 벤치 끝에 놓인 장바구니. 미역 한 봉지가 삐죽 나와 있다.
              nabi: 미역… 할머니가 「마음을 한 숟갈」 넣으라던 그 미역국.
              toby: 엄마는 왜 샀는지 모르는 얼굴이야. 손이 먼저 집었나 봐.
            ` },
          ],
          looks: [
            { at: [8, 3], text: s`
              > 벤치에 앉은 엄마. 휴대폰을 쥔 엄지가 화면 위에서 멈춰 있다. 화면엔 「엄마」.
              toby: 엄마가 「엄마」를 부르는 건… 처음 봐.
              @emote bori …
            ` },
          ],
        },
        after: s`
          ruru: 그네가 혼자 흔들렸어. …바람이었겠지?
          nabi: 바람이었어. 그래도 엄마한텐 바람이 아니었을 거야.
          bori: 엄마도 엄마한테 「밥 먹었어」 하고 싶었구나. 하루처럼.
          toby: 엄마는 그날도 울 곳을 못 찾았어. 하루 전화 한 통에, 다시 「엄마」가 됐으니까.
          @emote toby …
        `,
      },
      {
        kind: 'memory',
        id: 'mMe',
        at: [22, 3],
        name: '엄마 손으로는',
        caption: '「네 태엽은 하루가 감아야 하나 보다」',
        scene: s`
          @room m_ms_room14
          @show mom mom 1 3 down
          @music box
          @sfx birds
          > 하루, 열네 살 봄. 하루가 학교에 간 평일 오후.
          @sfx doorClose
          @walk mom 10 7 40
          @face mom down
          @sfx cardboard
          > 엄마가 장난감 상자를 열었다. 맨 위에 하얀 태엽 토끼가 누워 있었다.
          @pose mom kneel
          @wait 0.4
          @carry mom toby mMetoby
          @sfx lift
          @pose mom idle
          mom: 토비야. 오랜만이네.
          mom: 할머니가 그러셨지. 매일 조금씩 감아 주라고. 하루는 그걸 「매일 세 번」으로 정했고.
          mom: 하루가 요즘 안 감아 주지? …오늘은 엄마가 대신 감아 줄게.
          @sfx windTick
          > 끼릭. 끼릭. 엄마 손이 조심조심 태엽을 돌렸다. 너무 많이 감으면 아플까 봐.
          @wait 1
          @put mom mMetoby 9 7
          > 바닥에 내려놓자, 토비는 두 걸음 걷고… 멈췄다.
          @item mMetoby toby 8 7
          @emote mom …
          mom: 이상하다. 분명히 감았는데.
          @wait 1.2
          mom: …그렇구나. 네 태엽은 하루가 감아야 하나 보다.
          mom: 엄마 태엽도 그래. 감아 줄 사람이 따로 있었는데.
          @wait 1
          @walk mom 9 7 30
          @face mom left
          @take mom mMetoby
          @face mom down
          @pose mom kneel
          @wait 0.4
          @carry mom none
          @sfx cardboard
          @pose mom idle
          > 엄마는 토비를 상자 속 원래 자리에, 원래 모양 그대로 눕혔다. 하루가 모르게.
          @wait 1.5
        `,
        after: s`
          @emote toby !
          toby: …기억났어. 그날 누가 나를 감아 줬어. 따뜻한 손이었는데, 하루 손은 아니었어.
          ruru: 그래서 두 걸음만 갔어? 엄마 서운하게.
          toby: 일부러 그런 거 아니야. 태엽이… 하루 손을 기다리고 있었어.
          bori: 엄마 태엽은 할머니가 감아 줬구나. 그럼 이제 엄마 태엽은 누가 감아 주지?
          @emote nabi …
        `,
      },
      {
        kind: 'memory',
        id: 'mMf',
        at: [27, 15],
        name: '은주에게',
        caption: '재봉틀 서랍 속 두 통의 편지 · 「너도 좀 울어라」',
        scene: s`
          @room m_gm14
          @show mom mom 6 5 up
          @music piano
          @sfx clock
          > 하루가 할머니 방을 나가 버린 그날 오후. 엄마는 혼자 남았다.
          @walk mom 3 4 40
          @face mom up
          @sfx drawer
          > 재봉틀 서랍을 열자, 종이 두 장이 나란히 들어 있었다.
          @sfx paper
          @carry mom letter mMfletter
          > 하나는 봉투. 「열다섯 살 하루에게」. 하나는 반으로 접은 쪽지. 「은주에게」.
          @emote mom !
          @wait 1
          > 엄마는 하루의 봉투를 오래 들고 있다가, 서랍에 도로 넣었다.
          @carry mom none
          @sfx drawer
          mom: 열다섯 살 하루한테 온 거니까. 엄마가 대신 열 순 없지.
          mom: 하루가 직접 찾을 거야. 할머니 손녀니까.
          @wait 1
          @carry mom letter mMfnote
          @sfx paper
          > 그리고 자기 이름이 적힌 쪽지를 펼쳤다. 삐뚤빼뚤한 할머니 글씨.
          mom: 「은주야. 너는 어릴 때부터 참는 애였지.」
          mom: 「하루 앞에선 씩씩하려고 하겠지. 그 마음 고맙다. 그래도 너도 좀 울어라.」
          mom: 「엄마 앞에선 참지 말라고 했잖니. 엄마가 없어도, 그 말은 그대로다.」
          @wait 1.2
          @emote mom tear
          @sfx sob
          mom: …엄마. 나 그 핀, 아직 갖고 있어.
          @wait 1.5
          @sfx fold
          @carry mom none
          > 엄마는 쪽지를 접어, 화장대 보석함 속 동백꽃 머리핀 옆에 넣었다.
          > 그해 가을, 엄마는 할머니 장롱 앞에서 처음으로 소리 내어 울었다. 그리고 하루가 그걸 보았다.
          @wait 1.5
        `,
        after: s`
          ruru: 할머니는 다 알고 계셨네. 엄마가 참을 거라는 것까지.
          nabi: 엄마는 편지를 먼저 보고도 그대로 두셨어. 하루 손으로 열라고.
          toby: 그날 밤 하루가 서랍을 열었을 때, 편지는 거기서 기다리고 있었던 거야. 엄마가 지켜 준 자리에서.
          bori: 엄마도 할머니 딸이고, 하루도 할머니 손녀야. 둘 다 참는 걸 물려받았어. …우는 법도.
        `,
      },
      {
        kind: 'link',
        id: 'lM',
        at: [23, 13],
        name: '동백꽃 머리핀',
        icon: 'needle',
        locked: s`toby: 아직 기억 조각이 남아 있어. 엄마 화장대를 더 둘러보자.`,
        scene: s`
          @bars on
          > 보석함 뚜껑이 살짝 열려 있다. 빨간 동백꽃 머리핀 하나, 그 옆에 반으로 접은 쪽지 한 장.
          nabi: 엄마는 할머니를 보낸 뒤로 이 핀을 한 번도 안 꽂으셨어.
          ruru: 꽂으면 콕 찌를까 봐 그런가. 할머니 대신.
          @emote bori …
          bori: 엄마랑 하루. 같은 집에서, 둘이 따로따로 울었구나.
          toby: 하루는 그날 밤 어디서 울었을까. 「씩씩하게 하자」고 한 그날 밤.
          nabi: …침대. 그날 밤, 하루는 이불 속에서 울었어. 소리도 못 내고. 아무도 모르게.
          ruru: 거기 엄청 깜깜하잖아. 먼지투성이고.
          nabi: 걱정 마. 내 등불만 꼭 따라와. 고양이는 어둠 같은 거 안 무서워하니까.
          toby: 가자. 할머니를 보낸 날 밤, 하루 침대 밑으로.
          > 상징물에 깃든 기억이 흐트러져 있다. 조각을 맞춰야 다음 기억으로 이어진다.
          @mini memento3
          @sfx open
          @flag lM_done
          @sfx memory
          @fade 1 1.4 white
          @next
        `,
      },
      { kind: 'gap', id: 'gM', at: [5, 8], tiles: [[5, 7]] },
      { kind: 'block', id: 'bM', at: [20, 9], look: 'box' },
      {
        kind: 'trigger',
        id: 'tMgap',
        rect: [2, 8, 7, 2],
        unless: 'gap_gM',
        scene: s`
          ruru: 서랍 틈이다! 저 너머에 뭔가 반짝여.
          ruru: 밧줄 건다. 다들 비켜!
        `,
      },
      {
        kind: 'trigger',
        id: 'tMbox',
        rect: [17, 8, 3, 3],
        unless: 'mem_mMe',
        scene: s`
          bori: 분첩이 길을 막았네. 이건 내 일이지.
          bori: 분첩 왼쪽에 서서 밀게!
          ruru: 밀다가 분가루 뒤집어쓰지 마. 하얀 곰 되면 못 알아봐.
        `,
      },
      { kind: 'star', id: 'sMa', at: [1, 1], text: '서랍 틈 너머, 립스틱 뚜껑 안의 종이별.' },
      { kind: 'star', id: 'sMb', at: [17, 1], text: '손거울 손잡이 밑에 깔린 종이별.' },
      { kind: 'star', id: 'sMc', at: [28, 1], text: '머리끈 뭉치 속의 종이별.' },
      { kind: 'star', id: 'sMd', at: [11, 16], text: '보석함 그늘에 떨어진 종이별.' },
      {
        kind: 'spot',
        id: 'o_perfume',
        at: [3, 12],
        scene: s`
          > 커다란 향수병. 뚜껑에 먼지가 앉아 있다.
          ruru: 엄마 향수다. 하루 졸업식 때 뿌리던 거.
          nabi: 그 뒤로는 안 뿌리셨나 봐. 먼지가 이만큼.
          bori: 킁킁… 에취!
        `,
      },
      {
        kind: 'spot',
        id: 'o_lipstick',
        at: [6, 15],
        scene: s`
          > 립스틱 하나. 뚜껑에 작은 글씨로 「하루가 고른 색」.
          toby: 하루가 엄마 생일에 고른 거야. 열 살 때.
          ruru: 색이… 꽤 용감하네.
          nabi: 엄마는 그걸 아껴 바르셨어. 반도 안 썼어.
        `,
      },
      {
        kind: 'spot',
        id: 'o_mirror',
        at: [12, 8],
        scene: s`
          > 손거울에 장난감들의 얼굴이 비친다.
          ruru: 오, 잘생긴 여우 한 마리.
          toby: 엄마는 매일 아침 여기서 얼굴을 고쳤어.
          nabi: 웃는 얼굴로. 우는 얼굴 위에.
        `,
      },
      {
        kind: 'spot',
        id: 'o_cream',
        at: [15, 12],
        scene: s`
          > 쭈글쭈글하게 짜다 만 핸드크림. 할머니 이름표가 붙어 있다. 「순이」.
          bori: 할머니 핸드크림이야. 엄마가 가져다 놓으셨나 봐.
          toby: 다 쓴 것 같은데.
          bori: 응. 다 썼는데도 못 버리신 거야. 꿀단지처럼.
        `,
      },
      {
        kind: 'spot',
        id: 'o_photo',
        at: [26, 6],
        scene: s`
          > 거울 테두리에 꽂힌 작은 사진. 단발머리 소녀와 젊은 여자가 웃고 있다. 젊은 할머니와, 어린 엄마다.
          ruru: 엄마 어릴 때 하루랑 똑같이 생겼다!
          nabi: 웃는 거 봐. 할머니 눈 주름이 벌써 있어.
          toby: 웃은 자국이야. 은주 덕분에 생긴.
        `,
      },
    ],
  });
}

/** 이 장에서만 쓰는 사람 크기 기억 방 */
const W = 18;
const H = 11;

export const DRESSER_MEMROOMS: Record<string, () => RoomDef> = {
  // 은주가 자란 옛집 (낮): 순이의 화장대
  m_ms_oldhome: () =>
    house('m_ms_oldhome', 'oldhome', W, H, [
      ['door', 1, 1, 1, 2],
      ['window:day', 7, 0, 3, 2],
      ['desk', 2, 3, 3, 1, true],
      ['sewing:thread', 13, 3, 3, 1, true],
      ['rug:#c89a6a', 6, 5, 6, 3],
      ['plant', 16, 3, 1, 1, true],
    ]),
  // 병원 복도 (밤): 의자 줄 · 병실 문
  m_ms_hall_n: () =>
    house('m_ms_hall_n', 'hospitalNight', W, H, [
      ['window:night', 3, 0, 3, 2],
      ['window:night', 7, 0, 3, 2],
      ['clock', 10, 0, 2, 2],
      ['door', 13, 1, 1, 2],
      ['chair', 2, 3, 1, 1, true],
      ['chair', 3, 3, 1, 1, true],
      ['chair', 4, 3, 1, 1, true],
      ['plant', 16, 3, 1, 1, true],
    ]),
  // 엄마 아빠 방 (새벽): 화장대 · 장롱
  m_ms_bed_n: () =>
    house('m_ms_bed_n', 'haru15', W, H, [
      ['door', 1, 1, 1, 2],
      ['window:night', 7, 0, 3, 2],
      ['photo', 11, 0, 2, 2],
      ['desk', 3, 3, 3, 1, true],
      ['wardrobe', 10, 3, 2, 1, true],
      ['bed:#a8a8c0', 14, 3, 3, 4, true],
      ['rug:#8a8098', 6, 6, 6, 3],
    ]),
  // 부엌 (장례 끝난 밤): 개수대
  m_ms_kitchen_n: () =>
    house('m_ms_kitchen_n', 'kitchenNight', W, H, [
      ['window:night', 3, 0, 3, 2],
      ['clock', 13, 0, 2, 2],
      ['sink', 2, 3, 4, 1, true],
      ['table:cloth', 9, 5, 4, 2, true],
      ['chair', 8, 5, 1, 1, true],
      ['chair', 13, 5, 1, 1, true],
      ['plant', 16, 3, 1, 1, true],
    ]),
  // 하루 방 (14살 봄 · 낮): 장난감 상자
  m_ms_room14: () =>
    house('m_ms_room14', 'haru14', W, H, [
      ['window:day', 7, 0, 3, 2],
      ['door', 1, 1, 1, 2],
      ['photo', 11, 0, 2, 2],
      ['bed:#9aa8b8', 14, 3, 3, 4, true],
      ['desk', 2, 3, 3, 1, true],
      ['chair', 3, 4, 1, 1, true],
      ['toybox:label', 10, 8, 2, 1, true],
      ['rug:#b0a0a8', 5, 5, 4, 2],
    ]),
};
