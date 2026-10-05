/** 곁가지 장 · 토비의 태엽 속 — 토비가 열한 해 동안 들은 것들 (비 오는 마당과 장난감 상자 사이) */
import { s } from '../parse.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { grid, house, toyRoom } from './kit.ts';

/**
 * 장난감 크기 태엽 속: 쇠판 바닥(m) · 쇠판 벽(M) · 톱니(O).
 * 왼쪽(시작) → 톱니 구덩이(밧줄) → 가운데 → 실패가 막은 쇠판 틈(보리가 민다) → 오른쪽 안쪽(깜깜한 태엽 심).
 */
const MAP = grid(30, 18, 'm', 'M', [
  // 톱니가 돌아가는 깊은 구덩이 (루루 밧줄)
  ['v', 10, 1, 1, 16],
  // 가운데와 안쪽을 가르는 쇠판, 한 칸은 실패가 막고 있다 (보리가 민다)
  ['M', 19, 1, 1, 16],
  ['m', 19, 9, 1, 1],
  // 쇠판 · 톱니
  ['M', 3, 7, 4, 1],
  ['O', 6, 10, 1, 1],
  ['O', 2, 11, 1, 1],
  ['O', 13, 6, 1, 1],
  ['M', 12, 10, 4, 1],
  ['O', 16, 13, 1, 1],
  ['O', 24, 9, 1, 1],
  ['M', 22, 2, 1, 4],
  ['O', 27, 7, 1, 1],
  ['O', 22, 12, 1, 1],
]);

export const CH_TOBYKEY: Chapter = {
  n: 0,
  title: '0장 · 토비의 태엽 속',
  sub: '열한 해 동안 들은 것들',
  room: 'tobykey',
  start: [3, 15],
  party: ['toby', 'bori', 'ruru', 'nabi'],
  wind: 0.2,
  intro: s`
    @fade 1 0 white
    @bars on
    @music box
    @chtitle
    @fade 0 2
    > 쇠 냄새. 커다란 톱니바퀴들이 느리게 돈다. 끼… 릭. 끼…… 릭.
    @act bori lookAround nowait
    bori: 여기가… 토비 몸속이야?
    ruru: 우와, 생각보다 넓네. 머릿속은 텅 비어 있다더니.
    toby: 누가 그랬어.
    @act ruru giggle nowait
    ruru: 내가. 방금.
    @emote toby anger
    nabi: 저기, 저 큰 태엽 봐. 거의 다 풀렸어.
    @sfx windTick
    @wait 1.2
    > 끼…………릭. 톱니 하나가 넘어가는 데 한참이 걸린다.
    @emote toby sweat
    toby: …다들 너무 빤히 보지 마. 남의 속을 들여다보는 거잖아. 부끄러워.
    bori: 우린 남 아니잖아.
    nabi: 네가 잊어버린 기억도 다 여기 있을 거야. 그걸 찾으면 태엽이 조금은 버텨 줄지도 몰라.
    toby: 내가 잊어버린 거…? 나는 다 기억하는 줄 알았는데.
    ruru: 그러니까 「잊어버린」 거지. 앞장서, 주인님. 여긴 네 집이야.
    @bars off
    @goal 토비의 태엽 속, 멈춰 가는 기억들을 다시 맞물리자
  `,
};

export function tobykeyRoom(): RoomDef {
  return toyRoom('tobykey', MAP, {
    name: '토비의 태엽 속',
    theme: 'factory',
    start: [3, 15],
    music: 'box',
    ambient: [110, 110, 140],
    beams: [{ x: 4, w: 3, h: 12, slant: 2 }],
    lights: [
      { at: [5, 13], r: 80, color: [255, 220, 160], k: 0.35 },
      { at: [14, 4], r: 70, color: [255, 200, 140], k: 0.3 },
    ],
    things: [
      {
        kind: 'memory',
        id: 'mTa',
        at: [5, 12],
        name: '짝짝이 귀',
        caption: '「반듯한 건 누구나 데려가지」',
        scene: s`
          @room m_tb_shop
          @show gm grandma 6 5 up
          @show mom mom 9 5 up
          @music waltz
          @sfx music
          > 하루가 네 살 되기 한 달 전. 시내 장난감 가게, 맨 위 칸.
          > 하얀 태엽 토끼가 열두 마리. 나는 그 맨 끝에 앉아 있었다. 왼쪽 귀가 반쯤 접힌 채로.
          @act mom shrug nowait
          mom: 엄마, 다 똑같은데요. 아무거나 골라요.
          @act gm shake nowait
          gm: 똑같긴. 다 다르게 생겼다.
          @sfx windTick
          > 할머니는 한 마리씩 들어서 태엽을 감아 보고, 내려놓았다. 끼릭. 또 내려놓았다.
          @wait 1
          > 그리고 나를 집었다.
          @carry gm toby
          @face mom gm
          mom: 그건 귀가 접혔잖아요. 불량이에요. 새 걸로 달라고 할게요.
          @act gm shake nowait
          gm: 아니. 이 녀석으로 하자.
          mom: 왜요?
          gm: 이 녀석은 귀가 한쪽 짝짝이네. 우리 하루랑 닮았구나.
          @act mom think nowait
          mom: 하루 귀는 멀쩡한데요?
          gm: 귀 말고. 하루도 아침마다 머리 한쪽이 이렇게 뻗쳐 있잖니.
          @emote mom sweat
          mom: …엄마, 그건 제가 머리를 못 빗겨서 그런 거예요.
          @act gm laugh nowait
          gm: 그러니까 닮았지.
          @wait 1
          gm: 그리고 반듯한 건 누구나 데려가지. 이런 녀석은 우리가 데려가야 한다.
          @sfx windTick
          > 할머니가 내 태엽을 감았다. 처음으로. 하루보다 먼저.
          gm: 잘 부탁한다, 토끼야. 이름은… 하루가 지어 줄 거다.
          @walk gm 12 5 40
          @face gm down
          @sfx paper
          > 할머니는 계산대에서 노란 리본을 직접 골라, 나를 포장지로 감쌌다.
          @wait 1.5
        `,
        explore: {
          enter: [14, 9],
          intro: s`
            toby: 여기… 장난감 가게야. 하루를 만나기도 전이야.
            nabi: 네 기억 속인데도 다 멈춰 있네. 실을 찾아 이어 보자. 그러면 흘러갈 거야.
            ruru: 토비 아기 시절 구경이다!
          `,
          threads: [
            { at: [8, 4], text: s`
              > 선반 맨 위 칸. 하얀 태엽 토끼 열두 마리가 줄지어 앉아 있다. 맨 끝 한 마리만 조금 기울었다.
              toby: 다른 애들은 다 반듯하게 앉아 있었어. 나만 저랬지.
              ruru: 어디 어디? 아, 저 꼬질한—
              toby: 그땐 새거였거든.
            ` },
            { at: [12, 7], text: s`
              > 계산대 위의 포장지. 노란 리본이 미리 잘려 있다.
              nabi: 할머니는 고르기도 전에 리본부터 골라 두셨네. 노란색으로.
            ` },
            { at: [4, 7], text: s`
              > 바닥 상자 속 곰 인형들. 꿀단지를 안은 새 곰이 하나.
              bori: 나보다 훨씬 새거다. …그래도 내가 더 푹신해.
            ` },
          ],
          looks: [
            { at: [6, 6], text: s`
              > 선반을 올려다보는 할머니. 돋보기를 코끝에 걸쳤다.
              bori: 할머니는 고를 때 오래 걸려. 붕어빵 고를 때도 그러셨어.
            ` },
            { at: [10, 5], text: s`
              > 팔짱 낀 엄마. 손목시계를 힐끔 보는 중이다.
              nabi: 엄마는 그때도 바빴어. 그래도 할머니 따라 가게까지 온 거야.
            ` },
          ],
        },
        after: s`
          @emote toby sweat
          toby: …그래. 나 귀 짝짝이야. 보지 마.
          ruru: 몰랐던 척해 줘? 처음 본 날부터 다 알았는데.
          bori: 난 그 귀가 제일 귀여운데.
          nabi: 할머니는 그 귀 때문에 너를 골랐어. 자랑해도 돼.
          toby: 하루보다 먼저 날 감아 준 사람이 할머니였구나. …그건 잊고 있었어.
        `,
      },
      {
        kind: 'memory',
        id: 'mTb',
        at: [3, 4],
        name: '오늘 제일 좋았던 거',
        caption: '「토비, 오늘 제일 좋았던 거는…」',
        scene: s`
          @room m_room6
          @show haru haru5 15 5 down sleep
          @item toby toby 13 5
          @music night
          @sfx crickets
          > 하루, 다섯 살. 불 끄기 전에 꼭 하는 일이 하나 있었다.
          haru: 토비. 오늘 제일 좋았던 거.
          @wait 0.8
          @act haru giggle nowait
          haru: 할머니랑 붕어빵 먹은 거. 나는 꼬리부터 먹고, 할머니는 머리부터.
          @act haru shake nowait
          haru: 그리고 제일 싫었던 거는… 당근.
          @wait 1
          haru: 이제 토비 차례. 토비는 오늘 제일 좋았던 거 뭐야?
          @wait 1.5
          haru: …나랑 논 거? 알았어. 잘 자.
          @emote haru zz
          @show gm grandma 1 3 right
          @sfx doorOpen
          > 문틈에서 할머니가 듣고 있었다. 하루는 몰랐다.
          @walk gm 12 5 40
          @face gm right
          @pose gm kneel
          @act gm peek
          gm: …토비야. 할머니도 해도 되니?
          @wait 1
          gm: 할머니 오늘 제일 좋았던 거는, 이거. 문 뒤에서 이거 들은 거.
          @emote gm ♪
          gm: 내일도 들려주렴. 하루가 깜빡하는 날엔, 네가 기다려 주고.
          @sfx pat
          @pose gm idle
          @walk gm 1 3 40
          @sfx switch
          @hide gm
          @sfx doorClose
          @wait 1.5
        `,
        after: s`
          toby: 그날부터 매일 밤이었어. 「토비, 오늘 제일 좋았던 거」.
          bori: 나도 옆에 있었어! 근데 맨날 토비한테만 물어봤지.
          ruru: 질투하는 거야? 곰이?
          bori: …조금.
          nabi: 몇 번이나 들었어, 토비?
          toby: 세어 봤어. 삼천 번 가까이. …열세 살 봄에서 멈췄지만.
        `,
      },
      {
        kind: 'memory',
        id: 'mTc',
        at: [14, 14],
        name: '계단에서',
        caption: '「할머니 앞에선 안 울 거야. 토비, 너만 알아」',
        scene: s`
          @room m_tb_hall
          @show haru haru12 8 6 down sit
          @music minor
          @sfx clock
          > 열두 살 겨울. 하루는 나를 외투 주머니에 넣고 병원에 다녔다. 할머니한테는 비밀로.
          > 병실 가는 계단참. 하루는 들어가기 전에 꼭 여기 앉았다.
          @sfx clothes
          @carry haru toby
          haru: 토비. 오늘은 할머니가 밥을 반 그릇 남겼대.
          @act haru sigh
          haru: 어제는 세 숟갈 남겼는데.
          @wait 1
          @pose haru cry
          @sfx sob
          > 하루가 무릎에 얼굴을 묻었다. 소리는 내지 않았다. 주머니 속의 나만 들을 수 있을 만큼만.
          @wait 1.5
          haru: …할머니 앞에선 안 울 거야. 할머니가 걱정하니까.
          haru: 그러니까 토비, 너만 알아.
          @pose haru sit
          @act haru wipe
          > 하루가 소매로 얼굴을 닦았다. 그리고 내 앞에서, 웃는 연습을 했다.
          haru: 이렇게? …이렇게.
          @act haru laugh nowait
          haru: 할머니, 나 왔어! …됐다. 안 이상하지?
          @wait 1
          > 그 웃음은 조금 이상했다. 그래도 할머니는 매번, 그 웃음을 보고 웃었다.
          @carry haru none
          @sfx clothes
          > 하루는 나를 주머니 깊숙이 넣고 일어섰다.
          @walk haru 14 3 50
          @face haru up
          @sfx knock
          @wait 0.5
          @sfx doorOpen
          @hide haru
          @sfx doorClose
          @wait 1.5
        `,
        explore: {
          enter: [2, 9],
          intro: s`
            toby: 병원 계단참. 열두 살 겨울이야.
            bori: 소독약 냄새… 여기는 멈춰 있어도 춥다.
          `,
          threads: [
            { at: [3, 3], text: s`
              > 창밖에 눈. 눈송이들이 공중에 그대로 걸려 있다.
              toby: 그해 첫눈이었어. 하루는 할머니한테 제일 먼저 말해 주려고 뛰어왔어.
            ` },
            { at: [9, 3], text: s`
              > 벽시계. 면회 시간 오 분 전.
              nabi: 하루는 늘 오 분 일찍 와서 여기 앉았어. 그 오 분이… 이 기억이야.
            ` },
            { at: [14, 3], text: s`
              > 병실 문 옆 작은 칠판. 「점심: 반 그릇」. 그 위에 할머니 글씨로 「다 먹음」.
              @emote bori …
              bori: …할머니가 고쳐 놨어. 하루 보라고.
              ruru: 또 거짓말이네. 하루 앞에서만 하는 거짓말.
            ` },
          ],
          looks: [
            { at: [7, 6], text: s`
              > 계단에 앉은 하루. 외투 주머니가 볼록하다. 손이 주머니 속 무언가를 꼭 쥐고 있다.
              toby: …나야. 저 주머니 속.
            ` },
          ],
        },
        after: s`
          @emote nabi …
          nabi: 하루가… 웃는 연습을 했어?
          bori: 할머니는 병을 숨기고, 하루는 눈물을 숨기고.
          ruru: 둘이 똑같아. 누가 누구한테 배운 건지.
          toby: 주머니 속은 따뜻했는데, 그 겨울엔 자꾸 젖었어.
        `,
      },
      {
        kind: 'memory',
        id: 'mTd',
        at: [16, 3],
        name: '뚜껑 너머',
        caption: '「오늘 제일 좋았던 거는… 없어」',
        scene: s`
          @room m_room13
          @show haru haru13 15 8 left
          @item lid box 11 7
          @music night
          @sfx clock
          > 「열지 마」 쪽지가 붙은 상자 속. 마지막 태엽을 감은 그다음 날 밤.
          > 상자 속은 깜깜했다. 뚜껑 너머에서 하루가 다가와 앉는 소리가 들렸다.
          @walk haru 12 7 30
          @face haru left
          @pose haru hugKnees
          @wait 1
          haru: …토비.
          @wait 1
          haru: 오늘 제일 좋았던 거.
          @wait 2
          > 하루는 버릇처럼 말을 꺼냈다가, 거기서 멈췄다.
          haru: …없어.
          @wait 1.5
          @act haru shake nowait
          haru: 내일도 없을 거야. 그러니까 이제 안 물어볼게.
          @emote haru tear
          @pose haru cry
          @sfx sob
          > 나는 대답하고 싶었다. 「오늘 제일 좋았던 거는, 그래도 네가 나한테 말을 걸어 준 거야」라고.
          > 하지만 태엽이 감기지 않은 토끼는 대답할 수 없다.
          @wait 2
        `,
        after: s`
          toby: 그게 마지막 「오늘 제일 좋았던 거」였어.
          @emote bori tear
          bori: 없다는 말도… 대답은 대답이야. 하루는 그래도 너한테 대답했어.
          ruru: 그 뒤로 이 년이야? 깜깜한 상자 속에서?
          toby: 응. 근데 이상해. 그동안 내 태엽은 아주 조금씩 돌았어. 아무도 안 감아 줬는데.
          nabi: …왜?
          toby: 몰라. 더 가 보자. 답은 아마 안쪽에 있어.
        `,
      },
      {
        kind: 'memory',
        id: 'mTe',
        at: [26, 4],
        dark: true,
        name: '끝이 기억 안 나는 노래',
        caption: '「할머니, 노래 끝이 어떻게 되더라」',
        scene: s`
          @room m_room13
          @show haru haru14 8 6 down sit
          @item lid box 9 7
          @music none
          @sfx clock
          > 열네 살 봄. 달력에 동그라미가 하나 쳐진 날. 「할머니 기일」.
          > 상자 속에서 듣는 세상은 뚜껑 하나 너머였다. 그날 밤은 유난히 조용했다.
          @wait 1.5
          > 그러다 하루가 흥얼거렸다. 아주 작게. 오르골 노래였다.
          @music box
          @wait 2.5
          @music none
          > 노래는 반쯤에서 멈췄다.
          @act haru think
          haru: …그다음이 뭐였지.
          @wait 1
          @pose haru lookUp
          haru: 할머니, 노래 끝이 어떻게 되더라.
          @wait 1.5
          haru: 이것도 까먹으면… 나 할머니를 다 까먹으면 어떡해.
          @pose haru cry
          @sfx sob
          > 하루가 울었다. 벽 너머 엄마 방까지는 들리지 않을 만큼, 작게.
          @wait 1.5
          @sfx windTick
          > 그때였다. 상자 속에서, 끼릭. 아무도 감지 않았는데 내 태엽이 한 칸 돌았다.
          @wait 2
        `,
        after: s`
          toby: 나는 그 노래 끝을 알아. 할머니가 매일 밤 오르골로 들려줬으니까.
          nabi: 그럼 불러 줘. 지금.
          @emote toby sweat
          toby: …토끼는 노래 못 해.
          ruru: 태엽 토끼가? 오르골이랑 사촌 아니었어?
          @emote toby ♪
          toby: 띠, 리, 리… 리이.
          bori: …그거면 됐어. 하루한테도 꼭 그렇게 불러 줘.
        `,
      },
      {
        kind: 'memory',
        id: 'mTf',
        at: [25, 14],
        name: '기다리는 사람',
        caption: '「태엽은 감는 사람만 있는 게 아니란다. 기다리는 사람도 있지」',
        scene: s`
          @room m_gm_n
          @show gm grandma 7 6 down sit
          @item toby toby 7 7
          @music night
          @sfx crickets
          > 하루가 열한 살 되던 해 가을. 하루는 이틀 밤 수련회를 갔다.
          > 그동안 나는 할머니 방에 있었다. 하루가 부탁하고 갔다. 「할머니, 토비 태엽 꼭 감아 줘」.
          @take gm toby
          @sfx windTick
          @wait 0.5
          @sfx windTick
          @wait 0.5
          @sfx windTick
          gm: 하나, 둘, 셋. 매일 세 번. 할머니가 하루한테 가르쳐 준 대로.
          @sfx cough
          @wait 0.8
          @sfx cough
          @act gm shiver
          gm: …괜찮다. 하루한텐 말하지 마라.
          @wait 1
          gm: 토비야. 언젠가 아무도 네 태엽을 감아 주지 않는 날이 올 거다.
          gm: 하루가 바빠서일 수도 있고, 슬퍼서일 수도 있고.
          gm: 그래도 너무 겁내지 마라.
          @wait 1
          gm: 태엽은 감는 사람만 있는 게 아니란다. 기다리는 사람도 있지.
          gm: 기다리는 동안엔 멈춘 게 아니야. 그냥… 기다리는 거란다.
          @wait 1.5
          gm: 할아버지 시계도 서랍 속에서 오래 기다렸다. 그러다 네 열쇠가 됐지.
          @put gm toby 7 7
          gm: 그러니 혹시 하루가 너를 오래 잊어버리더라도…
          @act gm pat
          gm: 그 애 우는 소리가 들리거든, 그게 너를 감는 소리인 줄 알아라.
          @wait 2
        `,
        after: s`
          @emote toby !
          toby: …그래서였어. 상자 속에서, 하루가 울 때마다 끼릭.
          toby: 나는 멈춘 게 아니었어. 기다리고 있었던 거야.
          @wait 1
          bori: 그럼 지금 태엽이 거의 없는 것도…
          @act toby tremble
          toby: 응. 무서워. 멈추는 거. 솔직히 아주 많이.
          nabi: 멈추면 기다리는 거래. 할머니가 그러셨잖아.
          ruru: 그리고 기다리는 건 혼자 안 해. 우리가 옆에서 같이 기다려 줄게.
          toby: …고마워. 귀 짝짝이라고 놀리지만 않으면.
          @act ruru shrug nowait
          ruru: 그건 약속 못 해.
        `,
      },
      {
        kind: 'link',
        id: 'lT',
        at: [27, 11],
        name: '빨간 리본 열쇠',
        icon: 'key',
        locked: s`toby: 아직이야. 내 안에… 잊어버린 게 더 있어. 톱니 너머도 살펴보자.`,
        scene: s`
          @bars on
          > 태엽 한가운데, 커다란 열쇠 하나가 꽂혀 있다. 손잡이에 빛바랜 빨간 리본.
          toby: 할아버지 시계에서 온 열쇠. 할머니가 묶어 준 리본.
          @sfx windTick
          @wait 0.8
          > 끼…릭. 열쇠가 아주 조금, 저 혼자 돌았다.
          @emote bori !
          @act bori jump nowait
          bori: 돌았어! 지금 돌았어!
          nabi: 하루가… 지금도 어디선가 울고 있나 봐.
          @emote toby …
          toby: 그럼 서두르자. 하나 남았어. 내가 처음 하루를 만난 날.
          ruru: 장난감 상자. 짝짝이 귀가 처음 「토비」가 된 날.
          toby: …놀리지 말라니까.
          > 상징물에 깃든 기억이 흐트러져 있다. 조각을 맞춰야 다음 기억으로 이어진다.
          @mini flip5
          @sfx open
          @flag chT_done
          @sfx memory
          @fade 1 1.4 white
          @next
        `,
      },
      { kind: 'gap', id: 'gT', at: [9, 13], tiles: [[10, 13]] },
      { kind: 'block', id: 'bT', at: [19, 9], look: 'spool' },
      {
        kind: 'trigger',
        id: 'tTgap',
        rect: [6, 12, 4, 3],
        unless: 'gap_gT',
        scene: s`
          ruru: 톱니 구덩이다. 떨어지면 토비 배 속 저 밑까지 굴러가겠는걸.
          ruru: 밧줄 건다! 구덩이 앞에서 나를 불러.
          toby: …내 배 속이라고 말하지 마.
        `,
      },
      {
        kind: 'trigger',
        id: 'tTspool',
        rect: [16, 8, 3, 3],
        unless: 'mem_mTe',
        scene: s`
          bori: 실패가 쇠판 틈에 끼었어. 토비, 이거 언제 삼킨 거야?
          toby: 안 삼켰어! 할머니가 등을 고치다 넣고 잊으신 거야, 아마.
          bori: 왼쪽에서 밀게!
        `,
      },
      {
        kind: 'trigger',
        id: 'tTslow',
        rect: [20, 6, 3, 6],
        scene: s`
          @sfx windTick
          @shake 0.4
          > 끼………… 톱니들이 한순간 멈칫했다.
          @emote toby sweat
          @emote nabi !
          nabi: 토비!
          @wait 0.8
          @sfx windTick
          > …릭. 다시 돈다.
          toby: 괜찮아. 아직이야. 아직.
        `,
      },
      { kind: 'star', id: 'sTa', at: [1, 1], text: '톱니 이빨 사이에 낀 종이별.' },
      { kind: 'star', id: 'sTb', at: [18, 16], text: '리벳 옆에 붙어 있던 종이별.' },
      { kind: 'star', id: 'sTc', at: [28, 1], text: '태엽 스프링 끝에 걸린 종이별.' },
      { kind: 'star', id: 'sTd', at: [28, 16], text: '숫자판 뒤에 숨은 종이별.', dark: true },
      {
        kind: 'spot',
        id: 'o_tb_gear',
        at: [12, 8],
        scene: s`
          > 커다란 톱니바퀴. 이빨 하나가 살짝 나가 있다.
          toby: 일곱 살 생일에 하루가 너무 많이 감아서. 그때 부러진 건 열쇠만이 아니었어.
          bori: 아팠어?
          toby: 조금. 그래도 하루가 그만큼 나랑 오래 놀고 싶었던 거니까.
        `,
      },
      {
        kind: 'spot',
        id: 'o_tb_spring',
        at: [23, 7],
        scene: s`
          > 태엽 스프링. 거의 다 풀려서, 느슨하게 늘어져 있다.
          nabi: …얼마나 남았어?
          toby: 몰라. 시계가 아니라서.
          ruru: 그럼 남은 만큼 다 쓰자. 아껴 봤자 소용없어.
          bori: 루루가 처음으로 맞는 말 했다.
        `,
      },
      {
        kind: 'spot',
        id: 'o_tb_count',
        at: [15, 16],
        scene: s`
          > 톱니 옆에 작은 숫자판이 있다. 「2917」에서 멈춰 있다.
          nabi: 이게 뭐야?
          toby: …나중에 말해 줄게.
          ruru: 비밀번호? 토비 속 금고?
          toby: 그런 거 아니야.
        `,
      },
      {
        kind: 'spot',
        id: 'o_tb_ear',
        at: [7, 2],
        scene: s`
          > 위쪽에 휘어진 철사 하나. 귀 속 뼈대다. 왼쪽만 반쯤 꺾여 있다.
          ruru: 여기가 짝짝이의 원인이구나.
          toby: 원인이라고 하지 마.
          nabi: 펴 줄까?
          toby: …아니. 그냥 둬. 할머니가 이걸 보고 나를 골랐어.
        `,
      },
      {
        kind: 'spot',
        id: 'o_tb_lint',
        at: [21, 15],
        scene: s`
          > 톱니 틈에 낀 보풀. 남색 외투 주머니의 실밥이다.
          toby: 하루 겨울 외투. 열두 살 겨울 내내 그 주머니 속에 있었어.
          bori: 지금도 하루 냄새 나?
          toby: …조금.
        `,
      },
    ],
  });
}

/** 이 장에서만 쓰는 사람 크기 기억 방 */
const W = 18;
const H = 11;

export const TOBYKEY_MEMROOMS: Record<string, () => RoomDef> = {
  // 시내 장난감 가게: 선반 가득한 인형들
  m_tb_shop: () =>
    house('m_tb_shop', 'living8', W, H, [
      ['door', 16, 1, 1, 2],
      ['window:day', 12, 0, 3, 2],
      ['shelf:toys', 2, 3, 2, 1, true],
      ['shelf:toys', 5, 3, 2, 1, true],
      ['shelf:toys', 8, 3, 2, 1, true],
      ['table', 11, 6, 3, 1, true],
      ['toybox:open', 3, 8, 2, 1, true],
      ['boxes', 15, 7, 1, 1, true],
      ['plant', 1, 8, 1, 1, true],
    ]),
  // 병원 계단참 (하루 열두 살 겨울)
  m_tb_hall: () =>
    house('m_tb_hall', 'hospital', W, H, [
      ['window:day', 3, 0, 3, 2],
      ['clock', 9, 0, 2, 2],
      ['door', 14, 1, 1, 2],
      ['chair', 4, 4, 1, 1, true],
      ['chair', 5, 4, 1, 1, true],
      ['chair', 6, 4, 1, 1, true],
      ['plant', 1, 3, 1, 1, true],
      ['railing', 10, 7, 5, 1, true],
    ]),
};
