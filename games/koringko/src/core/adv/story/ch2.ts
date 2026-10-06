/** 2장 · 할머니 방 (14살, 문을 닫아 버린 날) — 사람 크기 복도 + 할머니 방 (hallHouse), 23:25 */
import { s } from '../parse.ts';
import type { ChainStep, Chapter, RoomDef } from '../types.ts';
import { hallMap } from './layout_b.ts';

export const CH2: Chapter = {
  n: 2,
  title: '2장 · 할머니 방',
  sub: '14살, 문을 닫아 버린 날',
  room: 'grandroom',
  start: [5, 20],
  party: ['toby', 'bori', 'ruru', 'nabi'],
  wind: 0.8,
  intro: s`
    @fade 1 0 white
    @bars on
    @music night
    @chtitle
    @fade 0 2
    > 밤 열한 시 이십오 분. 사다리를 내려오자, 2층 복도. 할머니 방 문 위 채광창이 열려 있었다.
    > 복도 끝, 두 해 동안 잠겨 있던 할머니 방 문 앞.
    @act bori lookAround nowait
    bori: 킁킁… 꿀 냄새. 아직 조금 남아 있어.
    @act ruru shrug nowait
    ruru: 먼지 냄새밖에 안 나는데.
    nabi: 쉿.
    @wait 1.2
    @sfx clock
    > 문틈 너머에서 멈춘 시계 초침이 한 번 떨리다가, 그대로 섰다.
    @wait 1
    toby: 하루는 매일 이 방에 왔었어. 할머니 무릎에서 그림책 읽고.
    @act bori sigh nowait
    bori: 무릎은 원래 내 자리였는데.
    @emote bori …
    toby: 다들, 하루가 아직 깨어 있을지도 몰라. 조용히.
    @act ruru spin
    @sfx rope
    > 루루가 밧줄을 채광창에 걸었다. 하나씩, 넘어간다.
    @bars off
    @goal 할머니 방 문은 왜 두 해 동안 닫혀 있었을까?
    @flag ch2_in
  `,
};

export function grandRoom(): RoomDef {
  const r = hallMap('grand', [
      {
        kind: 'memory',
        id: 'm2a',
        at: [8, 9],
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
            > 할머니 방 냄새. 파스, 꿀, 재봉틀 기름.
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
        when: 'mem_m2f',
        at: [2, 4],
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
        when: 'mem_m2e',
        at: [16, 5],
        name: '태엽 할머니',
        caption: '할머니를 닮은 인형을 장난감 상자로',
        scene: s`
          @room m_gm14
          @show haru haru14 8 8 up
          @item gdoll doll 13 4
          @music minor
          > 할머니 기일을 며칠 앞둔 날. 할머니 물건을 상자에 담던 날.
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
          @walk haru 1 3 40
          @hide haru
          @sfx doorClose
          @wait 0.8
          > 하루는 「열지 마」 쪽지를 살짝 들고, 인형을 토비 바로 옆에 눕혔다. 그리고 뚜껑을 닫았다.
          @wait 0.8
          > 하루는 할머니 방으로 돌아와, 문을 잠갔다.
          @sfx click
          @wait 1
        `,
        after: s`
          toby: 그래서 태엽 할머니가 우리 상자에 계셨구나.
          bori: 태엽 할머니는 상자 안에서 늘 토비 쪽으로 기울어 있었어.
          @act ruru shrug nowait
          ruru: 자리가 좁아서겠지.
          @emote nabi …
          nabi: …
          bori: 나는 그날 밤 처음으로 꿀 냄새 말고 다른 냄새를 맡았어. 파스 냄새.
        `,
      },
      // ───── 채광창 길: 루루 밧줄로 넘어 문 안쪽 이불 위로 (의자 · 상자 계단은 이미 놓여 있다 — 막 preset)
      {
        kind: 'door',
        id: 'd_gr_dresser',
        at: [16, 18],
        rect: [16, 18, 2, 1],
        to: 'dresser',
        arrive: [2, 13],
        dir: 'right',
        when: 'mem_m2g',
        locked: s`toby: 할머니 방이… 아직 우리한테 할 말이 있는 것 같아.`,
        first: s`
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
          nabi: 엄마 화장대로 가 보자. 엄마는 매일 아침 거기서 얼굴을 고쳤어. 우는 얼굴도.
          > 복도 끝 안방 문틈으로, 노란 불빛이 가늘게 새어 나온다.
        `,
      },
      { kind: 'climb', id: 'transom', at: [11, 18], to: [10, 13], who: 'ruru' },
      { kind: 'climb', id: 'quilt_step', at: [12, 13], to: [11, 13], who: 'any' },
      {
        kind: 'trigger',
        id: 'room_in',
        rect: [9, 12, 3, 2],
        unless: 'room_in',
        scene: s`
          @bars on
          @sfx blanket
          > 폭신. 문 안쪽에 개어 둔 꽃무늬 이불 위로 내려섰다.
          > 방 안의 가구마다 흰 천이 씌워져 있다. 두 해 동안 아무도 걷지 않은 천.
          @act toby lookAround nowait
          toby: 할머니 방이야. …천을 걷으면, 할머니 물건들이 보일 거야.
          @flag room_in
          @bars off
        `,
      },
      // ───── 흰 천 걷기: 재봉틀 천은 보리가 물고, 장롱 천은 루루 밧줄을 다 같이 당긴다 (사슬 단계)
      {
        kind: 'spot',
        id: 'cloth_sew',
        at: [1, 4],
        when: 'mem_m2d',
        scene: s`
          @act bori stretch
          @prop sheet@2,3 off
          @sfx clothes
          > 보리가 천 자락을 물고 뒷걸음질 치자, 흰 천이 스르륵 미끄러져 내려간다. 먼지 앉은 재봉틀이 모습을 드러낸다.
          toby: 할머니 재봉틀… 바늘에 노란 실이 꿰인 채야.
          @sfx drawer
          > 드르륵— 재봉틀 서랍이 손가락 한 마디만큼 밀려 나와 있다.
          @flag cloth_sew
          @flag drawer_open
        `,
      },
      {
        kind: 'spot',
        id: 'cloth_ward',
        at: [18, 4],
        when: 'mem_m2b',
        scene: s`
          @act ruru spin nowait
          @sfx rope
          > 루루가 장롱 위에 밧줄을 걸었다. 넷이 한 줄로 서서, 하나, 둘, 셋.
          @act bori stretch
          @prop sheet@18,3 off
          @sfx clothes
          > 흰 천이 바닥으로 흘러내린다. 장롱 문틈에 보라색 소매 끝이 끼어 있다.
          @flag cloth_ward
        `,
      },
      // ───── 복도 · 방 살펴보기
      {
        kind: 'spot',
        id: 'mom_light',
        at: [17, 19],
        scene: s`
          > 안방 문틈으로 노란 불빛이 가늘게 새어 나온다. 아주 작게, 상자 테이프 뜯는 소리.
          toby: 엄마가 아직 안 주무셔. …조용히 가자.
        `,
      },
      {
        kind: 'spot',
        id: 'hanger',
        at: [21, 4],
        scene: s`
          > 장롱 옆 고리에 빈 옷걸이 하나. 할머니 보라 카디건이 늘 걸려 있던 자리다.
          @emote nabi …
          ruru: 옷걸이만 남았네.
        `,
      },
      { kind: 'star', id: 's2a', at: [8, 4], text: '할머니 달력 밑에 숨어 있던 종이별.' },
      { kind: 'star', id: 's2b', at: [1, 6], text: '재봉틀 서랍 뒤 연두색 종이별.' },
      { kind: 'star', id: 's2c', at: [14, 4], text: '창문 아래 떨어진 보라색 종이별.' },
      { kind: 'star', id: 's2d', at: [12, 7], text: '침대 다리 옆, 납작해진 종이별.' },
      {
        kind: 'spot',
        id: 'glasses',
        at: [5, 4],
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
        at: [21, 3],
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
        at: [12, 12],
        scene: s`
          > 할머니 털신 한 켤레. 지금의 하루 발보다 조금 작다.
          toby: 하루는 할머니 털신을 신고 방 안을 뛰어다니곤 했어. 그땐 털신이 하루 발보다 훨씬 컸는데.
        `,
      },
      {
        kind: 'spot',
        id: 'calendar',
        at: [10, 3],
        scene: s`
          > 벽 달력이 할머니가 병원에 가시던 겨울에 멈춰 있다.
          nabi: 그 뒤로는 아무도 넘기지 않았어. 하루도, 엄마도.
        `,
      },
      {
        kind: 'spot',
        id: 'photowall',
        at: [12, 3],
        scene: s`
          > 액자가 잔뜩 걸린 벽. 사진마다 하루가 있다. 갓난아기, 첫걸음, 노란 비옷, 생일 케이크…
          ruru: 하루 사진밖에 없네.
          toby: 할머니는 하루를 정말 좋아하셨으니까.
        `,
      },
      {
        kind: 'spot',
        id: 'gbed',
        at: [14, 8],
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
        at: [18, 10],
        scene: s`
          > 낡은 라디오. 할머니가 매일 아침 노래를 틀어 놓던 라디오.
          ruru: 할머니가 따라 부르면 하루가 화음 넣고 그랬잖아.
          @act bori giggle nowait
          bori: 둘 다 음이 하나도 안 맞았지.
          ruru: 그래서 좋았던 거야.
        `,
      },

  ]);
  return {
    ...r,
    toys: true,
    // 기억에서 돌아와도 걷은 천은 걷힌 그대로
    keepProps: [
      { key: 'sheet@2,3', flag: 'cloth_sew', state: 'off' },
      { key: 'sheet@18,3', flag: 'cloth_ward', state: 'off' },
    ],
    hangouts: {
      bori: { at: [3, 19], pose: 'chinRest', dir: 'right', talk: s`
        @act bori lookAround nowait
        bori: 복도 마루가 차가워. 할머니 방은 늘 따뜻했는데.
        bori: 할머니 무릎이 비면 하루가 앉고, 하루가 학교 가면 내가 앉았어. 그 무릎, 꿀 냄새가 났지.
      ` },
      ruru: { at: [21, 19], dir: 'left', talk: s`
        @act ruru giggle nowait
        ruru: 저 채광창, 하루가 숨바꼭질할 때 몰래 넘어가던 데야. 할머니는 알면서 모른 척했고.
        ruru: 그 숨바꼭질, 하루는 한 번도 진 적 없어. 할머니가 매번 못 찾는 척했으니까.
      ` },
      nabi: { at: [35, 19], pose: 'sleepSit', dir: 'up', talk: s`
        @act nabi stretch nowait
        nabi: 복도 끝 창은 할머니 방 창이랑 같은 달이 보여. …여기서 보면 조금 덜 쓸쓸해.
        nabi: 할머니는 밤마다 이 복도를 지나 하루 이불을 덮어 주러 갔어. 발소리 하나 안 내고.
      ` },
    },
  };
}

/** 막 기억 사슬 (ACTS.md 막별 표): 이 방의 단계 차례 — 비어 있으면 사슬 없음 */
export const GRANDROOM_CHAIN: ChainStep[] = [
  { id: 'm2a', bridge: '목도리 바구니 옆, 찻잔 두 개가 먼지를 뒤집어쓰고 있다.' },
  { id: 'm2e', bridge: '찻잔 받침 너머 침대 머리맡, 먼지가 비켜 간 동그란 자리.' },
  { id: 'm2c', bridge: '인형이 서 있던 자리 위, 달력이 그해 그달에 멈춰 있다.' },
  { id: 'm2d', bridge: '미역국 냄새가 가신 자리. 재봉틀이 흰 천을 쓴 채 웅크렸다.' },
  { id: 'cloth_sew' },
  { id: 'm2f', gate: 'cloth_sew', bridge: '카드가 놓였던 재봉틀 서랍, 실패 위에 바늘이 꽂혀 있다.' },
  { id: 'm2b', bridge: '재봉틀 바늘 끝이 가리키는 쪽, 장롱이 흰 천을 쓰고 서 있다.' },
  { id: 'cloth_ward' },
  { id: 'm2g', gate: 'cloth_ward', bridge: '장롱 문틈의 보라 실밥. 복도 끝 안방 문 아래로 노란 불빛.' },
  { id: 'd_gr_dresser' },
];
