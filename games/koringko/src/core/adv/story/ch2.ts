/** 2장 · 할머니 방 (14살, 문을 닫아 버린 날) */
import { s } from '../parse.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { toyRoom } from './kit.ts';

const MAP = [
  'EEEEEEEEEEEEEEEEEEEEEEEEEEEE',
  'EaaaaaaaaaaaaaaaaaaaaaaaaaaE',
  'EaaaaKKaaaaaaaaaaaaKKKaaaaaE',
  'EaaaaKKaaaaaaaaaaaaKKKaaaaaE',
  'EaaaaaaaaaaaaaaaaaaaaaaaaaaE',
  'EaaEEEEEEaaaaaaaaaaaaaKKaaaE',
  'EaaEaaaaEaaaaOOaaaaaaaKKaaaE',
  'EaaEaaaaEaaaaOOaaaaaaaaaaaaE',
  'EaaEaaaaEEEaaaaaaaaaaaaaaaaE',
  'EaaEaaaaaaEaaaaaaaaaKKKaaaaE',
  'EaaEEEaEEEEaaaaaaaaaKKKavvEE',
  'EaaaaaaaaaaaaaaaaaaaaaaavvaE',
  'EaaaaaaaaaaaKKaaaaaaaaaavvaE',
  'EaaaaaaaaaaaKKaaaaaaaaaavvaE',
  'EaaaaaaaaaaaaaaaaaaaaaaavvaE',
  'EEEEEEEEEEEEEEEEEEEEEEEEEEEE',
];

export const CH2: Chapter = {
  n: 2,
  title: '2장 · 할머니 방',
  sub: '14살, 문을 닫아 버린 날',
  room: 'grandroom',
  start: [13, 14],
  party: ['toby', 'bori', 'ruru', 'nabi'],
  wind: 0.8,
  intro: s`
    @fade 1 0 white
    @bars on
    @music night
    @chtitle
    @fade 0 2
    > 문틈으로 기어 들어온 할머니 방. 두 해 동안 멈춰 있던 공기.
    @act bori lookAround nowait
    bori: 킁킁… 꿀 냄새. 아직도 조금 남아 있어.
    @act ruru shrug nowait
    ruru: 먼지 냄새밖에 안 나는데.
    nabi: 쉿. 여긴… 함부로 떠들면 안 될 것 같아.
    toby: 하루는 우리를 데리고 매일 이 방에 놀러 왔었어. 할머니 무릎에 앉아서 그림책도 읽고.
    @emote toby …
    @act toby sigh
    toby: 정말 오랜만이다. …기억 조각을 찾자.
    @bars off
    @goal 잠겨 있던 할머니 방에서, 할머니가 하루에게 남긴 것을 찾자
    @flag ch2_in
  `,
};

export function grandRoom(): RoomDef {
  return toyRoom('grandroom', MAP, {
    name: '할머니 방',
    theme: 'village',
    start: [13, 14],
    music: 'night',
    beams: [{ x: 11, w: 5, h: 10, slant: 3 }],
    lights: [{ at: [13, 6], r: 40, color: [255, 200, 140], k: 0.25 }],
    things: [
      {
        kind: 'memory',
        id: 'm2a',
        at: [17, 3],
        name: '반만 뜬 목도리',
        caption: '할머니가 뜨다 만 노란 목도리',
        scene: s`
          @room m_gm14
          @show mom mom 1 3 down
          @show haru haru14 2 4 right
          @sfx doorOpen
          @music minor
          > 할머니가 떠나고 한 해. 하루, 열네 살.
          mom: 하루야, 오늘은 할머니 방 좀 같이 정리하자.
          @walk mom 6 5 40
          @act haru nod nowait
          haru: …응.
          @walk haru 4 5 30
          @face haru up
          > 재봉틀 위에 할머니의 돋보기안경이 놓여 있다. 한 해 전 그대로.
          @walk mom 10 5 40
          @face mom up
          @sfx drawer
          @carry mom scarf gscarf
          @face mom haru
          mom: 이거 봐, 하루야. 할머니가 너 주려고 뜨던 목도리야.
          @emote haru …
          @pose haru lookDown
          haru: …알아.
          mom: 노란색. 네가 제일 좋아하는 색이라고, 겨울 오기 전에 다 뜬다고 하셨는데.
          @pose haru idle
          @face haru mom
          haru: …다 못 떴네.
          @pose mom lookDown
          mom: 응. 반밖에 못 뜨셨어.
          @wait 1
          haru: 엄마, 나 숙제 있어서.
          @walk haru 1 3 50
          @hide haru
          @sfx doorClose
          > 하루는 뒤도 돌아보지 않고 할머니 방을 나갔다.
          @pose mom idle
          @act mom sigh
          @emote mom …
          mom: …하루야.
          @wait 1
        `,
        explore: {
          enter: [9, 9],
          intro: s`
            toby: 할머니 방이야. 할머니가 떠나고 한 해 뒤, 하루가 열네 살 때.
            nabi: 반짝이는 실이 보이지? 기억의 실이야. 실을 다 이으면 이 순간이 흐를 거야.
            bori: 엄마랑 하루가… 문 앞에 서 있어. 둘 다 들어오기 싫은 얼굴로.
          `,
          threads: [
            { at: [4, 4], text: s`
              > 재봉틀 위의 돋보기안경. 안경알에 먼지가 얇게 앉았다.
              bori: 할머니는 저 안경을 쓰고 내 떨어진 단추를 달아 주셨어. 몇 번이나.
            ` },
            { at: [12, 4], text: s`
              > 장롱 문이 손가락 하나만큼 열려 있다. 틈으로 노란 털실 끝이 삐져나와 있다.
              ruru: 숨겨 둔 거네. 하루가 찾을까 봐.
              nabi: 숨긴 게 아니야. 반밖에 못 뜬 걸 하루한테 보이기 싫으셨던 거지.
            ` },
            { at: [13, 5], text: s`
              > 할머니 침대. 베개가 누가 누웠던 모양 그대로 오목하다.
              toby: 한 해 동안 아무도 베개를 펴지 않았어. 엄마도.
              nabi: 엄마도 이 방에 혼자는 못 들어왔던 거야.
            ` },
          ],
          looks: [
            { at: [1, 4], text: s`
              > 문가의 엄마. 소매를 걷어붙였다. 그런데 눈가가 빨갛다.
              bori: 씩씩한 척하는 얼굴이야. 하루랑 똑같아.
            ` },
            { at: [2, 5], text: s`
              > 엄마 옆의 하루. 발끝이 문 쪽을 향해 있다.
              ruru: 벌써 나갈 준비하는 발이야, 저거.
            ` },
          ],
        },
        after: s`
          nabi: 노란 목도리… 반만 뜬.
          ruru: 반만 뜬 목도리. 이 집엔 끝나지 않은 게 너무 많아.
          toby: 끝나지 않은 거?
          @act ruru shake nowait
          ruru: 아, 아니야. 그냥 그런 느낌이 든다고.
        `,
      },
      {
        kind: 'memory',
        id: 'm2b',
        at: [5, 7],
        name: '재봉틀 앞에서',
        caption: '할머니처럼 바느질해 보려던 밤 · 「열다섯 살 하루에게」',
        scene: s`
          @room m_gm14
          @show haru haru14 3 4 up sit
          @carry haru scarf gscarf
          @item gyarn yarn 13 6
          @music piano
          > 그날 밤. 모두 잠든 뒤, 하루가 몰래 할머니 방에 들어왔다.
          > 반쯤 뜬 노란 목도리를 안고, 하루는 재봉틀 앞에 앉았다.
          haru: 할머니가 하던 거… 나도 할 수 있을 거야.
          @pose haru sew
          @sfx sewing
          @mini sew
          @emote haru sweat
          > 바늘땀이 삐뚤빼뚤하다. 할머니의 바늘땀처럼 고르지 않다.
          @act haru sigh
          haru: …왜 이렇게 안 돼.
          haru: 할머니는 눈 감고도 했는데.
          @wait 1
          @face haru left
          @put haru gscarf 2 4
          @face haru up
          @sfx drawer
          @carry haru letter gletter
          > 재봉틀 서랍 안에 봉투 하나가 있다. 할머니 글씨. 「열다섯 살 하루에게」.
          @emote haru !
          @act haru surprise nowait
          haru: …열다섯 살?
          @wait 1.2
          @act haru shake nowait
          haru: 아직 열네 살이니까. …아직은 못 열어.
          @carry haru none
          @sfx drawer
          > 하루는 편지를 서랍에 도로 넣었다.
          @wait 1
        `,
        explore: {
          enter: [9, 9],
          intro: s`
            toby: 같은 날 밤이야. 모두 잠든 뒤.
            ruru: 하루가 재봉틀 앞에 앉아 있어. 몰래 들어온 거지? 딱 보니까 알겠네.
          `,
          threads: [
            { at: [1, 4], text: s`
              > 문 앞에 가지런히 벗어 둔 실내화 한 켤레.
              toby: 발소리가 날까 봐 맨발로 들어왔어. 할머니 방에 오는 게 비밀인 것처럼.
            ` },
            { at: [4, 4], text: s`
              > 재봉틀 서랍이 손가락 한 마디만큼 열려 있다. 틈으로 하얀 종이 끝이 보인다.
              nabi: 할머니 서랍이야. 할머니는 소중한 건 늘 저기에 넣어 두셨어.
              ruru: 뭔데, 뭔데? …아, 앞발이 안 들어가.
            ` },
            { at: [13, 6], text: s`
              > 노란 털실 뭉치가 침대 밑까지 굴러가 풀려 있다. 실 한 가닥이 재봉틀까지 길게 이어진다.
              bori: 하루가 목도리를 꺼내다가 떨어뜨렸나 봐. 실이… 할머니 침대랑 하루를 잇고 있어.
            ` },
          ],
          looks: [
            { at: [3, 5], text: s`
              > 재봉틀 앞에 앉은 하루. 등을 동그랗게 구부리고 있다.
              toby: 할머니가 앉던 모양이랑 똑같아. …하루는 모르겠지만.
            ` },
          ],
        },
        after: s`
          @act bori jump nowait
          bori: 편지! 할머니가 하루한테 쓴 편지가 있어!
          @act ruru point nowait
          ruru: 「열다섯 살 하루에게」라며. 하루 지금 열다섯 살이잖아!
          nabi: 그런데 하루는 아직도 안 열었어. 아마… 무서운 걸 거야.
          @act toby surprise nowait
          toby: 무서워?
          nabi: 마지막 편지니까. 열면 정말로 마지막이 되니까.
          @emote toby …
        `,
      },
      {
        kind: 'memory',
        id: 'm2c',
        at: [26, 13],
        name: '태엽 할머니',
        caption: '할머니를 닮은 인형을 장난감 상자로',
        scene: s`
          @room m_gm14
          @show haru haru14 8 8 up
          @item gdoll doll 13 4
          @music minor
          > 할머니 물건을 상자에 담던 날.
          @walk haru 13 5 30
          @face haru up
          > 할머니 침대 머리맡에, 할머니를 꼭 닮은 인형이 앉아 있다.
          haru: …태엽 할머니.
          @take haru gdoll
          @pose haru lookDown
          @wait 1
          haru: 너까지 여기 있으면… 이 방에 아직 할머니가 계신 것 같아서 안 돼.
          @pose haru idle
          haru: 다른 애들이랑 같이 있어. 장난감 상자에.
          > 하루는 인형을 품에 안고 방을 나갔다. 그리고 문을 잠갔다.
          @walk haru 1 3 40
          @hide haru
          @sfx doorClose
          @sfx click
          @wait 1
        `,
        after: s`
          toby: 그래서 태엽 할머니가 우리 상자에 계셨구나.
          bori: 태엽 할머니는 하루의 할머니를 닮았어. 아주 많이.
          @act nabi shake nowait
          nabi: 닮은 게 아니라… 아니, 아니다.
          @act ruru stomp nowait
          ruru: 뭐야, 나비. 말을 하다 말아.
          nabi: 기억을 더 거슬러 가 보면 알게 될 거야. 아마도.
        `,
      },
      {
        kind: 'link',
        id: 'l2',
        at: [13, 8],
        name: '할머니의 편지',
        icon: 'letter',
        locked: s`toby: 아직 기억 조각이 남아 있어. 할머니 방을 더 둘러보자.`,
        scene: s`
          @bars on
          > 서랍 틈으로 하얀 봉투 끝이 보인다. 「열다섯 살 하루에게」.
          toby: 이 편지… 하루가 꼭 읽어야 하는데.
          @act ruru giggle nowait
          ruru: 우리가 열어 볼까? 몰래?
          @act toby shake nowait
          toby: 안 돼. 이건 하루 거야.
          nabi: 그럼 하루가 열 수 있게 해 주자. 하루가 왜 열지 못하는지부터 알아야 해.
          @act toby nod
          toby: 할머니가 떠나던 날… 그날로 가 보자.
          @wait 0.6
          nabi: …그 전에. 이 방에서 운 사람이 하루만은 아니었어.
          bori: 엄마. 보라 카디건 앞에서.
          @act ruru sigh nowait
          ruru: 엄마도 할머니 딸이랬지. 우린 맨날 하루만 봤네.
          toby: 엄마 마음은… 한 번도 들여다본 적이 없어.
          nabi: 엄마 화장대로 가 보자. 엄마는 매일 아침 거기서 얼굴을 고쳤어. 우는 얼굴도.
          > 상징물에 깃든 기억이 흐트러져 있다. 조각을 맞춰야 다음 기억으로 이어진다.
          @mini order1
          @sfx open
          @flag ch2_done
          @sfx memory
          @fade 1 1.4 white
          @next
        `,
      },
      { kind: 'block', id: 'b2', at: [6, 10], look: 'spool' },
      { kind: 'gap', id: 'g2', at: [23, 12], tiles: [[24, 12], [25, 12]] },
      {
        kind: 'trigger',
        id: 't2spool',
        rect: [4, 11, 5, 2],
        unless: 'mem_m2b',
        scene: s`
          toby: 저 실패 뒤에서 뭔가 반짝여.
          @act bori hop nowait
          bori: 내 차례군! 실패 앞에 서서 밀어 볼게.
        `,
      },
      {
        kind: 'trigger',
        id: 't2gap',
        rect: [21, 11, 3, 4],
        unless: 'gap_g2',
        scene: s`
          @act ruru jump nowait
          ruru: 오, 낭떠러지! 드디어 내 밧줄 솜씨를 보여 줄 때가 왔군.
          toby: 루루, 저 건너편에 걸 수 있겠어?
          @act ruru shrug nowait
          ruru: 누구한테 묻는 거야? 끝에 서서 나를 불러.
        `,
      },
      { kind: 'star', id: 's2a', at: [1, 1], text: '할머니 달력 밑에 숨어 있던 종이별.' },
      { kind: 'star', id: 's2b', at: [9, 9], text: '재봉틀 서랍 뒤 연두색 종이별.' },
      { kind: 'star', id: 's2c', at: [26, 1], text: '창문 아래 떨어진 보라색 종이별.' },
      { kind: 'star', id: 's2d', at: [1, 14], text: '침대 다리 옆, 납작해진 종이별.' },
      {
        kind: 'spot',
        id: 'glasses',
        at: [7, 4],
        scene: s`
          > 재봉틀 다리 옆에 돋보기안경 다리 한 짝이 떨어져 있다.
          bori: 할머니는 이 안경을 머리에 얹어 놓고 안경을 찾으셨지.
          @act ruru laugh nowait
          ruru: 그거 진짜 웃겼는데. 하루가 "할머니, 머리 위!" 하고 소리치고.
        `,
      },
      {
        kind: 'spot',
        id: 'honey',
        at: [22, 4],
        scene: s`
          > 꿀단지. 뚜껑이 꽉 닫혀 있다.
          @act bori jump nowait
          bori: 꿀…!
          @emote bori ♥
          @act bori shake nowait
          bori: …아니야. 지금은 참을게. 할머니 꿀이니까.
          @act ruru surprise nowait
          ruru: 보리가 꿀을 참았어. 오늘 무슨 날이야?
        `,
      },
      {
        kind: 'spot',
        id: 'slippers',
        at: [16, 14],
        scene: s`
          > 할머니 털신 한 켤레. 지금의 하루 발보다 조금 작다.
          toby: 하루는 할머니 털신을 신고 방 안을 뛰어다니곤 했어. 그땐 털신이 하루 발보다 훨씬 컸는데.
        `,
      },
      {
        kind: 'spot',
        id: 'calendar',
        at: [3, 1],
        scene: s`
          > 벽 달력이 할머니가 병원에 가시던 겨울에 멈춰 있다.
          nabi: 그 뒤로는 아무도 넘기지 않았어. 하루도, 엄마도.
        `,
      },
      {
        kind: 'spot',
        id: 'photowall',
        at: [14, 1],
        scene: s`
          > 액자가 잔뜩 걸린 벽. 사진마다 하루가 있다. 갓난아기, 첫걸음, 노란 비옷, 생일 케이크…
          ruru: 하루 사진밖에 없네.
          toby: 할머니는 하루를 정말 좋아하셨으니까.
        `,
      },
      {
        kind: 'spot',
        id: 'gbed',
        at: [25, 4],
        scene: s`
          > 할머니 침대. 이불이 반듯하게 개어져 있다.
          nabi: 여기서 낮잠 자면 따뜻했는데. 할머니가 등을 토닥토닥해 주시고.
          @emote nabi zz
          @act ruru stomp nowait
          ruru: 나비, 지금 자면 안 돼!
        `,
      },
      {
        kind: 'spot',
        id: 'radio',
        at: [10, 13],
        scene: s`
          > 낡은 라디오. 할머니가 매일 아침 노래를 틀어 놓던 라디오.
          ruru: 할머니가 따라 부르면 하루가 화음 넣고 그랬잖아.
          @act bori giggle nowait
          bori: 둘 다 음이 하나도 안 맞았지.
          ruru: 그래서 좋았던 거야.
        `,
      },
    ],
  });
}
