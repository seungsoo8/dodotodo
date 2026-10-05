/**
 * 15장 · 비 오는 마당 (5살, 잃어버린 토비) — 사람 크기 마당 (houseMap, layout_d.ts), 03:15 밤비.
 * 집 뒷벽 · 처마 · 툇마루(높이 1, 댓돌로 오르내림) · 장독대 · 수돗가 · 빨랫줄 · 꽃밭과 낮은 돌담 · 큰 덤불 · 앞 담장과 파란 대문.
 *
 * 놀이 (REDESIGN §7 15장):
 *  1. 물길 바꾸기 — 처마 홈통 낙숫물이 마당을 가로질러 흘러 두 웅덩이를 채운다. 돌담 틈 웅덩이가 덤불 쪽 길을 막는다.
 *     보리가 벽돌을 밀어 아래 물길만 막으면 돌담 틈이 마르고 고무 대야는 그대로 찬다 (위 갈래를 막으면 대야만 마른다 → 홈통 옆에서 되돌리기).
 *  2. 개굴 형 따라가기 — 어두운 꽃밭에서 개구리를 네 번 따라붙으면 그날 이야기를 해 주고, 뒤집힌 우산(m8c)이 드러난다.
 *  3. 어린 하루 조종 — m8c 기억 속 (지금 것). 덤불 밑의 작은 노란 우산이 기억의 문.
 */
import { s } from '../parse.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { houseMap } from './kit.ts';
import { YARD_BRICK, YARD_CHANNEL, YARD_POOLS, YARD_SOURCE, YARD_STEP, withLooks, yardSpec } from './layout_d.ts';

export const CH8: Chapter = {
  n: 8,
  title: '8장 · 비 오는 마당',
  sub: '5살, 잃어버린 토비',
  room: 'yard',
  start: [2, 4],
  party: ['toby', 'bori', 'ruru', 'nabi'],
  wind: 0.24,
  intro: s`
    @fade 1 0 white
    @bars on
    @music rain
    @chtitle
    @fade 0 2
    > 새벽 세 시 십오 분. 고양이 문을 지나 마당으로. 밤비가 추적추적 내린다.
    @act ruru shiver nowait
    ruru: 으, 털 다 젖겠다.
    > 젖은 흙에 토비의 발이 자꾸 미끄러진다.
    bori: 나비, 등불은 괜찮아?
    nabi: 내 등불은 안 꺼져. 할머니가 만든 거니까.
    @emote toby …
    toby: 여기… 와 본 적 있어. 이 냄새. 젖은 흙.
    @cam 26 15 1.4
    @wait 1
    > 마당 끝 큰 덤불. 낙숫물이 흘러내려 돌담 틈에 물이 고였다.
    @cam off
    @bars off
    @goal 그날 토비가 떨어졌던 덤불 밑까지 가자 · 처마 물길을 돌려 돌담 틈 웅덩이를 비우자
  `,
};

export function yardRoom(): RoomDef {
  const r = houseMap({
    ...yardSpec(),
    things: [
      {
        kind: 'memory',
        id: 'm8a',
        at: [8, 11],
        name: '노란 비옷',
        caption: '개구리를 쫓다 떨어뜨린 토비',
        scene: s`
          @room m_yard
          @show haru haru5 10 6 down
          @show gm grandma 3 3 down umbrella
          @carry haru toby toby8a
          @carry gm towel towel8a
          @music rain
          @sfx rainRoof
          > 하루, 다섯 살. 비 오는 날 마당.
          @act haru jump
          haru: 첨벙! 첨벙!
          @walk haru 7 6 60
          @sfx splash
          @walk haru 12 8 60
          @sfx splash
          @sfx laugh
          gm: 하루야, 감기 걸린다! 웅덩이는 살살 밟아야지.
          @pose haru hold
          haru: 할머니, 토비도 첨벙 좋아해! 그치, 토비야?
          @emote haru ♪
          > 하루는 토비를 안고 비 오는 마당을 뛰어다녔다. 노란 비옷이 빗속에서 반짝였다.
          @pose haru idle
          @emote haru !
          @act haru point
          haru: 앗, 개구리다! 기다려!
          @walk haru 18 9 70
          @sfx clothes
          @hide haru
          > 하루는 개구리를 쫓아 덤불 너머로 사라졌다. 토비를 품에 안은 채로.
          @wait 1.2
        `,
        explore: {
          enter: [1, 10],
          intro: s`
            toby: 마당이야. 하루가 다섯 살이던, 비 오는 날.
            nabi: 나랑 루루가 오기도 전이네. 실을 찾자. 다 이어지면 비가 다시 내릴 거야.
          `,
          threads: [
            { at: [7, 4], text: s`
              > 웅덩이마다 작은 장화 자국. 하나, 둘, 셋… 전부 한가운데다.
              bori: 하루는 웅덩이를 그냥 지나간 적이 한 번도 없어.
            ` },
            { at: [4, 4], text: s`
              > 할머니 팔에 걸린 마른 수건 한 장. 하루 머리 닦아 주려고 들고 나오셨다.
              ruru: 수건까지 챙겨 나오셨어? 젖을 줄 알고?
              nabi: 할머니는 늘 하루보다 한 발 먼저 계셨어.
            ` },
            { at: [16, 7], text: s`
              > 덤불 아래 개구리 한 마리. 누군가를 기다리는 것처럼 앉아 있다.
              toby: …저기야. 내가 떨어질 곳.
              ruru: 개구리 녀석. 다 너 때문이야.
            ` },
          ],
          looks: [
            { at: [10, 5], text: s`
              > 노란 비옷의 하루. 품에 토비를 꼭 안고 있다.
              toby: 저때 하루 품은… 세상에서 제일 따뜻했어.
            ` },
            { at: [2, 3], text: s`
              > 우산 아래 할머니. 웅덩이가 아니라 하루만 보고 계신다.
              bori: 할머니 어깨 좀 봐. 우산이 하루 쪽으로 기울어서 다 젖었어.
            ` },
          ],
        },
        after: s`
          bori: 개구리를 쫓아갔어. 토비를 안고.
          toby: …그리고 나는 그 덤불 아래 떨어졌어. 진흙 속에.
          ruru: 기억나?
          toby: 조금. 비가 얼굴에 떨어지던 거. 차갑고… 무서웠어.
        `,
      },
      {
        kind: 'memory',
        id: 'm8b',
        at: [26, 14],
        name: '토비가 없어!',
        caption: '어둠을 무서워하던 아이가 손전등 대신 할머니 손을 잡았다',
        scene: s`
          @room m_room5
          @show haru haru5 8 7 down
          @music rain
          @sfx rainRoof
          > 저녁이 되어서야 하루는 알았다.
          @act haru lookAround
          haru: 토비… 토비 어디 있어?
          @walk haru 13 5 60
          @face haru right
          @sfx blanket
          @wait 0.4
          @walk haru 10 7 60
          @face haru down
          @sfx cardboard
          @wait 0.4
          @walk haru 5 6 60
          @face haru down
          @sfx clothes
          @walk haru 8 7 60
          @emote haru !
          haru: 토비가 없어!
          @pose haru cry
          @sfx sob
          haru: 으아앙! 토비가 없어졌어! 할머니!
          @sfx doorOpen
          @show gm grandma 1 3 down
          @walk gm 6 7 40
          @face gm haru
          @sfx pat
          gm: 어디 보자. 마지막으로 토비랑 어디 있었니?
          haru: 마당… 개구리…
          gm: 그럼 마당에 있겠구나. 할머니랑 같이 찾으러 가자.
          @act haru shiver nowait
          haru: 밖에 깜깜하잖아… 비도 오고…
          @carry gm umbrella umb8b
          gm: 할머니가 우산 씌워 줄게. 하루는 할머니 손만 꼭 잡고 있으렴.
          @pose haru idle
          @emote haru …
          @act haru nod nowait
          haru: …응.
          @walk gm 1 4 40 nowait
          @walk haru 2 4 40
          @hide gm
          @hide haru
          @sfx doorClose
          @wait 1
        `,
        explore: {
          enter: [2, 9],
          intro: s`
            > 하루의 방. 창밖은 벌써 깜깜하다.
            toby: …그날 저녁이야. 나는 여기 없었어. 마당 덤불 아래 있었으니까.
          `,
          threads: [
            { at: [10, 9], text: s`
              > 활짝 열린 장난감 상자. 토비 자리만 비어 있다.
              bori: 나는 저 안에 있었어. 토비가 안 오길래… 계속 문 쪽만 봤지.
            ` },
            { at: [13, 4], text: s`
              > 베개 옆, 토끼 모양으로 꺼진 자국.
              toby: 내 자리야. 하루는 나 없으면 잠을 못 잤어.
              ruru: 그럼 오늘 밤은 큰일이네.
            ` },
            { at: [8, 3], text: s`
              > 비 내리는 창. 커튼이 반만 쳐져 있다.
              nabi: 하루는 해가 지면 창 쪽을 안 봤대. 깜깜한 게 무서워서.
              toby: 그런데 오늘은… 저 깜깜한 데로 나가야 해.
            ` },
          ],
          looks: [
            { at: [8, 6], text: s`
              > 하루. 방을 두리번거리다 멈춘 얼굴.
              ruru: 아직 모르는 얼굴이야. 곧 알게 되겠지만.
            ` },
            { at: [1, 3], text: s`
              > 방문이 조금 열려 있다. 복도 끝에서 부엌 불빛이 새어 든다.
              nabi: 하루가 울면, 저 문으로 제일 먼저 들어오는 사람은 늘 정해져 있었어.
            ` },
          ],
        },
        after: s`
          nabi: 하루는 어둠을 무서워했어. 그래도 너를 찾으러 나간 거야.
          toby: 나를…
          @act ruru wipe nowait
          ruru: 감동은 이따가 해. 아직 하나 남았잖아.
        `,
      },
      {
        kind: 'memory',
        id: 'm8c',
        at: [20, 3],
        name: '우산 속',
        caption: '「다시는 안 잃어버릴게. 평생」',
        scene: s`
          @room m_yard
          @show haru haru5 4 4 down
          @show gm grandma 3 4 right umbrella
          @music rain
          > 해가 지고, 비는 더 세차게 내렸다.
          @sfx umbrellaOpen
          @sfx wind
          gm: 하루야, 어디부터 찾아볼까?
          @act haru point nowait
          haru: 저쪽… 개구리 있던 데!
          @flag yard_search
          @control haru
          @goal 어린 하루가 되어 토비를 찾자 (꽃밭 · 웅덩이 · 덤불)
        `,
        after: s`
          toby: 하루가… 날 찾으러 와 줬어. 그 깜깜한 빗속을.
          bori: 다섯 살짜리가.
          nabi: 어둠을 그렇게 무서워하던 애가.
          ruru: …토비, 울어?
          toby: 태엽 인형은 안 울어.
          @emote toby tear
          @act ruru giggle nowait
          ruru: 거짓말.
        `,
      },
      {
        kind: 'link',
        id: 'l8',
        at: [26, 16],
        name: '작은 노란 우산',
        icon: 'umbrella',
        locked: s`toby: 아직 기억 조각이 남아 있어. 연못 건너편도 살펴보자.`,
        scene: s`
          @bars on
          @sfx rainRoof
          > 덤불 아래 작은 노란 우산이 쓰러져 있다.
          nabi: 할머니가 하루한테 사 준 우산.
          bori: 하루는 이 우산 쓰고 매일 골목을 걸었어. 어린이집 갈 때도, 학교 갈 때도. 할머니 손 잡고.
          toby: 골목…
          @sfx windTick
          > 우산 끝이 마당의 파란 대문을 가리키고 있다. 대문 아래 틈으로 젖은 밤바람이 새어 든다.
          ruru: 저 밖은… 우리끼리 나가 본 적 한 번도 없잖아.
          nabi: 늘 하루 가방에 매달려서, 하루 품에 안겨서만 나갔지.
          toby: 하루가 기억하는 할머니는 집 안에만 있는 게 아니야. 골목에도, 놀이터에도 있어.
          bori: 밖은 넓겠다. 장난감한테는 엄청.
          @act ruru shrug nowait
          ruru: 무서우면 내 꼬리 잡아.
          nabi: 그건 할머니가 하루한테 하던 말이야. 내 꼬리로.
          ruru: …그럼 둘 다 잡아.
          > 상징물에 깃든 기억이 흐트러져 있다. 조각을 맞춰야 다음 기억으로 이어진다.
          @mini thread4
          @sfx open
          @flag ch8_done
          @fade 1 1
          @room h_attic
          @music none
          @item ibox boxTaped 8 5
          @fade 0 1.2
          > 다락방. 테이프 붙인 상자 안에서, 아주 작게.
          @music box
          @wait 3
          @music none
          doll: …그다음은.
          @wait 1.2
          doll: 그다음은, 하루가 불러야지.
          @wait 1.5
          @fade 1 1.2
          @sfx memory
          @fade 1 1.4 white
          @next
        `,
      },
      // ── 툇마루 ↔ 마당: 댓돌을 디디고 오르내린다
      { kind: 'climb', id: 'daetdol', at: YARD_STEP.low, to: YARD_STEP.high, who: 'any' },
      // ── 놀이 1 · 물길: 홈통 낙숫물 → 아래 갈래 (돌담 틈 웅덩이) · 위 갈래 (고무 대야)
      {
        kind: 'flow',
        id: 'gutter',
        at: YARD_SOURCE,
        channel: YARD_CHANNEL,
        pools: [
          { at: YARD_POOLS[0], flag: 'tub_full' },
          { at: YARD_POOLS[1], flag: 'gap_pool' },
        ],
        fill: [0],
        dry: [1],
        flag: 'water_turned',
        scene: s`
          @sfx splash
          > 벽돌에 막힌 낙숫물이 위 갈래로만 흐른다. 고무 대야에 물이 찰랑찰랑 차고, 돌담 틈 웅덩이는 천천히 말라 간다.
          @act bori cheer nowait
          bori: 막혔다! 물이 대야로만 가.
          nabi: 할머니가 비 오는 날마다 저 대야에 빗물을 받았어. 화분 물 주려고.
          toby: 돌담 틈이 열렸어. 덤불 쪽으로 갈 수 있겠다.
          @sfx splash
          > …개굴. 어두운 꽃밭 쪽에서 개구리 소리가 난다.
          ruru: 저 소리. 따라가 볼까?
          @goal 그날 토비가 떨어졌던 덤불 밑까지 가자 · 어두운 꽃밭의 개굴 형을 따라가자
        `,
      },
      { kind: 'push', id: 'brick', at: YARD_BRICK, look: 'brick' },
      {
        kind: 'spot',
        id: 'undoBrick',
        at: [20, 4],
        unless: 'water_turned',
        scene: s`
          > 처마 홈통 밑. 낙숫물이 쉬지 않고 쏟아진다.
          toby: 물이 두 갈래로 흘러. 위로는 대야, 아래로는 돌담 틈.
          nabi: 대야는 채우고, 돌담 틈만 막으면 되겠다. 아래 갈래 어딘가를.
          bori: 벽돌을 엉뚱한 데로 밀었으면, 처음 자리로 굴려 놓을게.
          @reset brick
        `,
      },
      {
        kind: 'trigger',
        id: 't8pool',
        rect: [20, 10, 1, 5],
        unless: 'water_turned',
        scene: s`
          > 돌담 틈에 물이 고여 웅덩이가 되었다. 장난감 키로는 건널 수 없다.
          ruru: 수영은 못 해. 밧줄 걸 데도 없고.
          bori: 물이 저 위 홈통에서 흘러와. 내가 벽돌로 물길을 막아 볼게. 왼쪽 벽돌 보여?
        `,
      },
      // ── 놀이 2 · 개굴 형: 어두운 꽃밭에서 따라붙기
      {
        kind: 'chase',
        id: 'gaegul',
        actor: 'frogBro',
        path: [[4, 11], [3, 15], [8, 14], [11, 16]],
        laps: 4,
        flag: 'frog_met',
        scene: s`
          @sfx splash
          frog: 개굴. 끈질기네, 토끼.
          @emote toby !
          toby: …개구리가 말을 해?
          frog: 비 오는 밤엔 다들 말이 많아지지. 개굴 형이라 불러.
          frog: 너 그 토끼지? 노란 비옷 꼬마가 나를 쫓다가 떨어뜨린.
          @emote toby …
          frog: 그날 나는 덤불 밑으로 숨었고, 너는 덤불 앞에 떨어졌지. 꼬마는 울면서 우산을 내팽개치고 갔어.
          frog: 우산은 지금도 저기 뒤집혀 있다. 비 오면 내 집이 되지만.
          @act ruru stomp nowait
          ruru: 너 때문이잖아!
          frog: 개굴. 쫓아온 건 꼬마야.
          @goal 그날 토비가 떨어졌던 덤불 밑까지 가자 · 돌담 틈을 지나 덤불 밑으로
        `,
      },
      {
        kind: 'trigger',
        id: 't8thunder',
        rect: [9, 8, 3, 2],
        scene: s`
          @sfx thunder
          @shake 0.5
          @emote ruru !
          @emote bori !
          @act ruru surprise nowait
          ruru: 으악, 천둥!
          @act nabi tremble nowait
          nabi: …안 무서웠어. 진짜야.
        `,
      },
      { kind: 'star', id: 's8a', at: [2, 10], text: '꽃잎 사이에 숨은 종이별.' },
      { kind: 'star', id: 's8b', at: [30, 5], text: '나무 밑동에 걸린 젖은 종이별.' },
      { kind: 'star', id: 's8c', at: [1, 12], text: '빗물에 떠내려온 종이별.' },
      { kind: 'star', id: 's8d', at: [30, 17], text: '덤불 뒤에 숨은 종이별.' },
      {
        kind: 'spot',
        id: 'frog',
        at: [3, 7],
        scene: s`
          @sfx splash
          > 웅덩이 가에 개구리 한 마리가 웅크리고 있다. 개굴.
          ruru: 너구나, 범인이.
          bori: 이 개구리가 그때 그 개구리일까?
          nabi: 개구리는 그렇게 오래 안 살아.
        `,
      },
      {
        kind: 'spot',
        id: 'boots',
        at: [4, 4],
        scene: s`
          > 툇마루에 놓인 작은 노란 장화 한 켤레.
          toby: 비옷이랑 세트였어. 하루가 첨벙거릴 때마다 장화 속에 물이 들어갔지.
        `,
      },
      {
        kind: 'spot',
        id: 'swing',
        at: [24, 8],
        scene: s`
          @sfx swing
          > 녹슨 그네. 바람에 끼익, 끼익 흔들린다.
          bori: 할아버지가 만들어 주신 그네래. 할머니가 매일 밀어 주셨어.
          ruru: 하루가 더 높이! 하면 할머니가 깜짝 놀라 줄을 잡았지.
        `,
      },
      {
        kind: 'spot',
        id: 'garden',
        at: [6, 12],
        scene: s`
          > 할머니의 작은 꽃밭. 이름표가 꽂혀 있다. 「하루 꽃」.
          nabi: 하루가 씨앗 심은 자리. 할머니가 매일 물을 주셨대.
          toby: 꽃이… 아직 피어 있어.
        `,
      },
      {
        kind: 'spot',
        id: 'truckTracks',
        at: [15, 17],
        scene: s`
          > 대문 아래 틈으로 골목이 보인다. 젖은 흙에 커다란 바퀴 자국 두 줄. 어제 미리 다녀간 이삿짐 트럭이다.
          bori: 내일 아침엔 저 트럭에 다 실리겠지. 우리도.
          ruru: 상자에 실리는 거랑 「두고 가는 짐」이랑은 달라.
        `,
      },
    ],
  });
  return {
    ...withLooks(r, [{ rect: [3, 3, 16, 3], look: 'gmNight' }]),
    toys: true,
    weather: 'rain',
    hangouts: {
      bori: { at: [9, 6], pose: 'chinRest', dir: 'down', talk: s`
        @act bori shiver nowait
        bori: 털이 다 젖었어. 그래도 흙냄새는 좋다.
        bori: 무거운 거 밀 일 있으면 불러. 벽돌 같은 거.
      ` },
      ruru: { at: [15, 10], dir: 'left', talk: s`
        @act ruru shiver nowait
        ruru: 꼬리가 무거워. 물 먹었어.
        ruru: 갈 데 있으면 불러. 비 맞는 건 어차피 다 맞았어.
      ` },
      nabi: { at: [21, 4], pose: 'sleepSit', dir: 'down', talk: s`
        @act nabi stretch nowait
        nabi: 처마 밑이 제일 덜 젖어. 고양이는 이런 데를 알아.
        nabi: 어두운 데 갈 거면 불러. 꽃밭은 깜깜하니까.
      ` },
    },
  };
}
