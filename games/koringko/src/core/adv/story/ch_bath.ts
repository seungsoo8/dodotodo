/** 욕실 (9살, 웃은 자국) */
import { s } from '../parse.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { grid, toyRoom } from './kit.ts';

const MAP = grid(28, 16, 'b', 'M', [
  ['~', 3, 2, 8, 4],
  ['M', 18, 6, 9, 1],
  ['M', 18, 1, 1, 6],
  ['b', 22, 6, 1, 1],
  ['v', 1, 10, 12, 1],
  ['~', 15, 12, 3, 2],
  ['K', 8, 7, 2, 1],
]);

export const CH_BATH: Chapter = {
  n: 0,
  title: '0장 · 욕실',
  sub: '9살, 웃은 자국',
  room: 'bath',
  start: [22, 13],
  party: ['toby', 'bori', 'ruru', 'nabi'],
  wind: 0.45,
  intro: s`
    @fade 1 0 white
    @bars on
    @music night
    @chtitle
    @fade 0 2
    > 불 꺼진 욕실. 수도꼭지에서 톡, 톡, 물방울이 떨어진다.
    @sfx drip
    @act nabi shiver nowait
    nabi: 으… 물. 고양이는 물을 싫어해.
    ruru: 그럼 넌 거기 있어. 우리끼리 갔다 올게.
    nabi: …같이 갈 거야. 내 등불 없으면 아래 칸은 하나도 안 보일걸.
    bori: 비누 냄새 좋다. 할머니가 쓰시던 장미 비누.
    toby: 욕조에 물이 고여 있으니까 조심해. 우리 솜은 젖으면 무거워져.
    @bars off
    @goal 욕실 어딘가에 숨은, 하루가 연습하던 토비 극장 대본을 찾자
  `,
};

export function bathRoom(): RoomDef {
  return toyRoom('bath', MAP, {
    name: '욕실',
    theme: 'cave',
    start: [22, 13],
    music: 'night',
    ambient: [70, 80, 110],
    lights: [{ at: [22, 13], r: 70, color: [200, 220, 255], k: 0.3 }],
    things: [
      {
        kind: 'memory',
        id: 'mBa',
        at: [13, 3],
        name: '웃은 자국',
        caption: '「주름은 웃은 자국이란다. 하루 덕분에 많이 생겼지」',
        scene: s`
          @room m_bath
          @show gm grandma 7 7 left
          @show haru haru9 5 7 right
          @item towel towel 9 8
          @music box
          @sfx bubbles
          > 하루, 아홉 살. 할머니랑 거품 목욕.
          @emote haru ♪
          haru: 할머니, 거품 수염! 할아버지 같지?
          @sfx laugh
          @act gm laugh nowait
          gm: 아이고, 우리 하루 할아버지 됐네.
          @emote haru ?
          haru: 할머니는 왜 얼굴에 주름이 있어?
          gm: 주름? 이건 웃은 자국이란다.
          @act haru think nowait
          haru: 웃은 자국?
          gm: 많이 웃으면 생기지. 하루 태어나고 엄청 많이 생겼어. 하루 덕분이야.
          haru: 그럼 나도 많이 웃으면 생겨?
          gm: 그럼. 할머니만큼 웃으려면 아직 멀었다.
          @act haru laugh nowait
          haru: 그럼 엄청 웃어야지! 하하하하!
          @sfx laugh
          @emote gm ♥
          > 할머니가 웃으며 수건을 집어 하루를 폭 감쌌다.
          @walk gm 8 8
          @face gm right
          @take gm towel
          @walk gm 6 8
          @face gm haru
          @give gm haru towel
          @sfx hug
          @wait 1.5
        `,
        after: s`
          ruru: 웃은 자국이래. 할머니 주름 엄청 많았는데.
          @act bori nod nowait
          bori: 그럼 그만큼 웃으셨다는 거야.
          nabi: 대부분 하루 때문에.
          toby: 하루는 지금… 웃은 자국이 생길까?
          @emote toby …
        `,
      },
      {
        kind: 'memory',
        id: 'mBb',
        at: [5, 13],
        dark: true,
        name: '우리 할머니',
        caption: '하루의 작문 「우리 할머니」',
        scene: s`
          @room m_room9
          @show haru haru9 8 6 down
          @show gm grandma 8 8 up sit
          @music grandma
          @sfx crickets
          > 내일은 학교 공개 수업. 엄마 아빠는 일하러 가고, 할머니가 오시기로 했다.
          haru: 할머니, 내가 발표할 거 미리 들어 봐. 제목은 「우리 할머니」.
          gm: 할머니 얘기야? 떨리네.
          @sfx paper
          @act haru bow
          haru: 에헴.
          @pose haru read
          > 「우리 할머니는 태엽을 잘 감습니다. 토비 태엽도, 시계 태엽도, 내 마음 태엽도 잘 감습니다.」
          > 「우리 할머니는 거짓말을 못합니다. 그런데 숨바꼭질은 더 못합니다. 웃음소리 때문에 다 들킵니다.」
          > 「우리 할머니 미역국은 세상에서 제일 맛있습니다. 마음을 한 숟갈 넣기 때문입니다.」
          > 「나는 커서 할머니처럼 되고 싶습니다. 주름이 많은 사람이 되고 싶습니다. 웃어서 생긴 주름이요.」
          @pose haru idle
          @act haru bow nowait
          haru: 끝! 어때?
          @act gm clap
          @sfx clap
          @wait 1.2
          @emote gm tear
          @act gm wipe
          gm: …아이고. 우리 하루, 할머니 울리네.
          @act haru surprise nowait
          haru: 할머니 울어? 왜 울어? 슬픈 거 아닌데!
          gm: 좋아서 우는 거야. 이런 눈물도 있단다.
          @wait 1.5
        `,
        explore: {
          enter: [2, 8],
          intro: s`
            toby: 하루 방이야. 아홉 살, 공개 수업 전날 밤.
            nabi: 다들 멈춰 있어. 기억의 실을 찾자. 실이 다 이어지면 이 밤이 다시 흘러갈 거야.
          `,
          threads: [
            { at: [3, 5], text: s`
              > 책상 위의 원고지. 지우개 자국 사이로 「우리 할머니」 제목만 또박또박하다.
              ruru: 제목 쓰는 데만 한 시간 걸렸어. 「우리 할머니 최고」로 할까 하다가.
              bori: 「최고」는 내용에 다 들어 있으니까 뺐대.
            ` },
            { at: [11, 3], text: s`
              > 벽에 붙은 사진. 할머니와 하루가 똑같이 눈을 찡그리고 웃고 있다.
              nabi: 웃는 모양이 똑같아. 눈가에 주름 지는 자리까지.
            ` },
            { at: [10, 7], text: s`
              > 장난감 상자 뚜껑 위에 장난감들이 나란히 앉혀져 있다. 맨 앞자리에 토비.
              toby: 우리가 첫 번째 청중이었어. 하루는 우리 앞에서 세 번 연습하고 나서야 할머니를 불렀지.
              ruru: 세 번 다 「주름」에서 틀렸어.
            ` },
          ],
          looks: [
            { at: [8, 5], text: s`
              > 원고지를 든 하루. 에헴, 하려고 숨을 크게 들이켠 얼굴.
              bori: 잔뜩 어른인 척하는 중이야.
            ` },
            { at: [9, 8], text: s`
              > 방바닥에 앉은 할머니. 무릎 위에 두 손을 모았다. 눈가가 벌써 촉촉하다.
              nabi: …아직 첫 줄도 안 들었는데.
            ` },
          ],
        },
        after: s`
          @emote bori tear
          bori: 마음 태엽도 잘 감는대…
          toby: 할머니 미역국… 마음 한 숟갈… 하루는 그걸 다 기억하고 있었어.
          nabi: 기억하고 있으니까 더 아픈 거야.
          ruru: 좋아서 우는 눈물도 있대. 그런 거면 울어도 괜찮겠다.
        `,
      },
      {
        kind: 'memory',
        id: 'mBc',
        at: [10, 12],
        dark: true,
        name: '깨진 안경',
        caption: '「안경은 또 사면 되지만, 정직한 우리 하루는 못 사」',
        scene: s`
          @room m_gm
          @show haru haru9 6 6 down
          @show gm grandma 13 6 left
          @music grandma
          @pose haru sit
          @sfx thud
          > 우지끈. 하루가 방석 위에 털썩 앉았는데— 할머니 안경이었다.
          @emote haru !
          @act haru lookAround
          haru: …큰일 났다.
          @act gm lookAround nowait
          gm: 하루야, 할머니 안경 못 봤니? 아까 여기 뒀는데.
          @act haru shake nowait
          haru: 모, 못 봤어!
          @pose haru idle
          @sfx clothes
          > 하루는 깨진 안경을 등 뒤에 숨겼다.
          @flag glass_go
          @control haru
          @goal 어떻게 하지… (숨기기? 말하기?)
        `,
        after: s`
          ruru: 나 같으면 끝까지 숨겼을 텐데.
          nabi: 그래서 너는 할머니한테 칭찬 못 받는 거야.
          bori: 할머니는 안경보다 하루 마음이 더 중요했던 거야.
          toby: "정직한 우리 하루는 못 사." …지금 하루도 정직할까. 자기 마음한테.
        `,
      },
      {
        kind: 'memory',
        id: 'mBd',
        at: [24, 2],
        name: '하루 별',
        caption: '「할머니는 나중에 저 별 옆에 있을게」',
        scene: s`
          @room m_yard_n
          @show haru haru9 10 6 up sit
          @show gm grandma 11 6 up sit
          @pose haru lie
          @pose gm lie
          @item tray tray 12 7
          @music grandma
          @sfx crickets
          > 여름밤. 할머니와 마당에 돗자리를 깔고 누웠다.
          haru: 별 진짜 많다.
          @act gm point nowait
          gm: 저기 제일 반짝이는 거 보이니? 할머니가 저 별 이름 지어 줄게. 「하루 별」.
          haru: 하루 별! 그럼 그 옆에 작은 거는?
          gm: 음… 저건 「할머니 별」 하자.
          haru: 할머니 별은 왜 작아?
          gm: 할머니는 늙어서 그래. 허허.
          @wait 1
          gm: 하루야. 할머니가 나중에, 아주 나중에 하늘에 가면… 저 별 옆에 있을게.
          @act haru shake nowait
          haru: 하늘 가지 마.
          gm: 아주 나중에.
          @act haru point nowait
          haru: …그럼 나는 매일 밤 인사할게. 할머니 별한테.
          gm: 그래. 그럼 할머니도 반짝 하고 대답하마.
          @sfx sparkle
          @wait 2
        `,
        explore: {
          enter: [5, 10],
          intro: s`
            toby: 마당이야. 아홉 살 여름밤.
            bori: 풀벌레 소리까지 멈춰 있어. 귀가 먹먹해.
          `,
          threads: [
            { at: [6, 2], text: s`
              > 울타리 너머 하늘. 큰 별 하나가 반짝이고, 그 옆에 작은 별 하나.
              toby: 저 작은 별… 아직 이름이 없어. 이 밤이 흐르면 생길 거야.
            ` },
            { at: [13, 7], text: s`
              > 돗자리 옆 쟁반. 수박 두 조각. 하나는 씨가 하나도 없다.
              bori: 할머니가 씨를 다 발라서 하루 쪽에 놔 주신 거야. 자기 건 그대로 두고.
              ruru: 너는 수박 얘기만 나오면 눈이 반짝이더라.
            ` },
            { at: [10, 8], text: s`
              > 돗자리 끝에 벗어 둔 신발 두 켤레. 큰 고무신이 작은 운동화 쪽으로 돌려져 있다.
              nabi: 하루가 일어나면 바로 신겨 주려고. 할머니는 늘 그렇게 벗어 두셨어.
            ` },
          ],
          looks: [
            { at: [10, 5], text: s`
              > 돗자리에 누운 하루. 손가락으로 하늘을 가리키다 멈췄다.
              ruru: 손가락 끝으로 별을 콕 찍은 것 같네.
            ` },
            { at: [12, 6], text: s`
              > 할머니는 하늘이 아니라 하루를 보고 있다.
              nabi: 별 보러 나와서는… 할머니는 줄곧 하루만 봤어.
            ` },
          ],
        },
        after: s`
          nabi: 하루 별, 할머니 별.
          toby: 하루는 요즘도 밤에 하늘을 볼까.
          ruru: 다락방 창으로 보면 보이겠다. 오늘 밤.
          bori: 새집에서도 보일까? 할머니 별.
          nabi: 별은 이사 안 가. 어디서 올려다봐도 그 자리야.
        `,
      },
      {
        kind: 'memory',
        id: 'mBe',
        at: [20, 4],
        name: '먼저 감는 사람',
        caption: '「미안하다는 말은 태엽 같은 거야. 먼저 감아 주는 사람이 이긴다」',
        scene: s`
          @room m_room9
          @show haru haru9 14 6 left sit
          @music grandma
          > 학교에서 짝꿍과 싸운 날. 하루는 저녁도 안 먹고 침대에 앉아 있었다.
          @pose haru hugKnees
          @act haru sigh
          @sfx sigh
          @sfx knock
          @wait 0.6
          @show gm grandma 1 3 down
          @sfx doorOpen
          @carry gm cup tea
          @walk gm 13 6 40
          @sfx doorClose
          @face gm haru
          gm: 꿀차 타 왔다. 무슨 일이니.
          @give gm haru tea
          haru: 서윤이가 먼저 내 지우개 가져갔어. 근데 내가 소리 질렀다고 나만 혼났어.
          gm: 그래서 화가 났구나.
          @act haru shake nowait
          haru: 내가 먼저 사과 안 할 거야.
          gm: …하루야. 미안하다는 말은 태엽 같은 거란다.
          @act haru think nowait
          haru: 태엽?
          gm: 서로 멈춰서 기다리기만 하면 둘 다 영영 안 움직여. 누가 먼저 감아 줘야 다시 걷지.
          gm: 그러니까 먼저 감아 주는 사람이 이기는 거야.
          @wait 1
          @pose haru drink
          @sfx slurp
          haru: …내일 서윤이한테 지우개 하나 줄래. 내 거 새것.
          gm: 그래. 그게 이기는 거다.
          @act gm pat
          @sfx pat
          @wait 1.5
        `,
        after: s`
          toby: 먼저 감아 주는 사람이 이긴다.
          ruru: 우리가 먼저 감으러 가는 거야. 하루 마음을.
          bori: 루루, 오늘 진짜 멋있는 말 많이 한다.
          @act ruru shrug nowait
          ruru: 원래 멋있었거든.
        `,
      },
      {
        kind: 'memory',
        id: 'mBf',
        at: [2, 8],
        name: '할머니 머리 감기',
        caption: '이번엔 하루가 할머니 머리를 감겨 드렸다',
        scene: s`
          @room m_bath
          @show gm grandma 5 7 right sit
          @show haru haru9 7 7 left
          @item towel towel 9 8
          @music box
          > 할머니가 팔이 아프다고 한 날. 하루가 샴푸를 들었다.
          @act haru cheer nowait
          haru: 오늘은 내가 할머니 머리 감겨 줄게!
          @sfx faucet
          @sfx bubbles
          gm: 아이고, 시원하다. 우리 하루 손이 약손이네.
          haru: 할머니 머리 하얗다. 눈 같아.
          gm: 눈이 많이 내렸지. 할머니 머리에.
          @act haru think nowait
          haru: 그럼 나중에 내 머리에도 내려?
          gm: 아주 나중에. 할머니만큼 살면.
          haru: 그럼 그때 내가 할머니 머리 또 감겨 줄게. 둘 다 하얀 머리로.
          gm: …허허. 그래, 그러자꾸나.
          @walk haru 8 8
          @face haru right
          @take haru towel
          @walk haru 6 8
          @face haru gm
          @give haru gm towel
          @sfx clothes
          > 하루는 할머니의 하얀 머리를 수건으로 꼭꼭 눌러 닦았다.
          @wait 1.5
        `,
        after: s`
          nabi: 둘 다 하얀 머리로…
          toby: 그 약속도 못 지키게 됐네.
          bori: 아니야. 하루가 할머니 나이가 되면, 그때 할머니 생각하면서 머리 감을 거야. 그럼 지킨 거야.
          ruru: 보리 계산도 할머니처럼 이상해졌다.
          @act bori nod nowait
          bori: 좋은 계산이야.
        `,
      },
      {
        kind: 'link',
        id: 'lB',
        at: [24, 13],
        name: '토비 극장 대본',
        icon: 'puppet',
        locked: s`nabi: 아직이야. 어둠 속 아래 칸도, 비누 뒤 칸도 살펴봐.`,
        scene: s`
          @bars on
          > 욕조 옆 선반에 젖었다 마른 종이 한 장. 크레용 글씨: 「토비 극장 1화」.
          @sfx paper
          @act ruru jump nowait
          ruru: 하루가 목욕하면서 대본 연습했었어!
          bori: 토비 극장은 한 해 전, 여덟 살 때 시작했지. 할머니랑 매주 토요일마다.
          nabi: 책장으로 가자. 무대가 아직 거기 있어.
          > 상징물에 깃든 기억이 흐트러져 있다. 조각을 맞춰야 다음 기억으로 이어진다.
          @mini order3
          @sfx open
          @flag chb_done
          @sfx memory
          @fade 1 1.4 white
          @next
        `,
      },
      { kind: 'block', id: 'bB', at: [22, 6], look: 'soap' },
      { kind: 'gap', id: 'gB', at: [6, 9], tiles: [[6, 10]] },
      {
        kind: 'trigger',
        id: 'tBsoap',
        rect: [20, 7, 5, 2],
        unless: 'mem_mBe',
        scene: s`bori: 커다란 비누가 선반 칸을 막고 있어. 아래에서 밀어 볼게!`,
      },
      {
        kind: 'trigger',
        id: 'tBgap',
        rect: [3, 8, 7, 2],
        unless: 'gap_gB',
        scene: s`
          ruru: 배수구 틈이다. 밧줄 걸게!
          nabi: 아래 칸은 깜깜해. 내려가면 내 옆에 붙어 있어.
        `,
      },
      { kind: 'star', id: 'sBa', at: [1, 1], text: '수건 사이에 낀 종이별.' },
      { kind: 'star', id: 'sBb', at: [26, 1], text: '비누 받침 뒤의 분홍 종이별.' },
      { kind: 'star', id: 'sBc', at: [1, 14], text: '어둠 속 배수구 옆 종이별.', dark: true },
      { kind: 'star', id: 'sBd', at: [26, 14], text: '젖었다 마른 쭈글쭈글한 종이별.' },
      {
        kind: 'spot',
        id: 'duck',
        at: [12, 7],
        scene: s`
          @sfx pop
          > 고무 오리 하나. 꽥.
          ruru: 이 친구는 우리랑 같이 상자에 안 들어갔네.
          bori: 욕실 담당이니까. 이사 가면 새 욕실에서 일하겠지.
        `,
      },
      {
        kind: 'spot',
        id: 'toothbrush',
        at: [16, 3],
        scene: s`
          > 칫솔꽂이. 칫솔이 셋. 한 자리가 비어 있다.
          nabi: 할머니 칫솔 자리.
          toby: 하루네는 빈자리를 잘 못 치우는구나. 열쇠 고리도, 의자도, 칫솔꽂이도.
        `,
      },
      {
        kind: 'spot',
        id: 'rosesoap',
        at: [14, 9],
        scene: s`
          > 장미 비누. 반쯤 닳았다.
          bori: 할머니 비누. 이 냄새만 맡으면 할머니가 옆에 있는 것 같아.
          ruru: 그래서 하루가 아직 이 비누 안 버린 거구나.
        `,
      },
      {
        kind: 'spot',
        id: 'mirror',
        at: [25, 8],
        scene: s`
          > 김 서린 거울에 손가락으로 쓴 글씨가 희미하게 남아 있다. 「할머니 보고 싶어」.
          @emote toby …
          toby: …최근 글씨야.
          nabi: 하루는 거울한테만 말했구나.
        `,
      },
    ],
  });
}
