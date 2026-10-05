/** 1장 · 다락방 (15살, 이삿짐을 싸던 밤) — 사람 크기 다락 (houseMap), 23:10 달빛 */
import { s } from '../parse.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { houseMap, type HouseSpec } from './kit.ts';

/*
 * 다락 (30×20, 사람 크기 · 장난감이 걷는 장 방)
 *   y0~2  뒷벽: 경사 천장 널 + 낮은 앞면, 가운데 둥근 박공 창 (x13~16), 뻐꾸기시계 (x22)
 *   x0~2 · x27~29  경사 천장이 바닥까지 내려온 낮은 구석 (벽 두께 X, 막힘)
 *   y6 · y11  가로지르는 들보 두 개 (윗층)
 *   (5~7, 4~5)  「두고 가는 짐」 상자 안 = 높은 층 (elev 1), 앞면 S. 테이프 자락 (8,5) 로 오르내림
 *   (3~6, 12~14)  책 더미로 막힌 구석 (할머니 의자). 입구 (7,13) 의 동화책 더미를 보리가 한 칸씩
 *   (13,13)  뚜껑문 (무게 2). 열면 사다리로 (13,18) 계단참 → 재봉 상자 틈의 바늘
 *   y15  다락 마루 끝 난간 (x13~14 은 계단 쪽으로 트임)
 *   (12~15, 17~18)  뚜껑문 아래 사다리 계단참 (사다리 끝 (13,18), 바늘 (15,18))
 */
/** 다락 배치 (1장 밤 · 마지막 장 새벽이 함께 쓴다: 새벽 상태는 story/layout_e.ts) */
export const ATTIC_HOUSE: HouseSpec = {
  id: 'attic',
  name: '다락방',
  w: 30,
  h: 20,
  rooms: [
    { id: 'loft', rect: [3, 0, 24, 16], look: 'attic', raised: [[5, 4, 3, 2]] },
    { id: 'ladder', rect: [12, 17, 4, 2], look: 'attic', wallH: 1 },
  ],
  furniture: [
    // ── 뒷벽: 경사 천장 + 둥근 박공 창 · 뻐꾸기시계
    { kind: 'atticWall', x: 3, y: 0, w: 10, h: 3 },
    { kind: 'atticWall:window', x: 13, y: 0, w: 4, h: 3 },
    { kind: 'atticWall', x: 17, y: 0, w: 10, h: 3 },
    { kind: 'cuckoo', x: 22, y: 1, w: 1, h: 2 },
    // ── 윗층: 들보 두 개 · 구석 거미줄
    { kind: 'beam', x: 3, y: 6, w: 24, h: 1, over: true },
    { kind: 'beam', x: 3, y: 11, w: 24, h: 1, over: true },
    { kind: 'cobweb', x: 3, y: 3, w: 1, h: 1, over: true },
    { kind: 'cobweb:right', x: 26, y: 3, w: 1, h: 1, over: true },
    { kind: 'cobweb:right', x: 26, y: 12, w: 1, h: 1, over: true },
    // ── 「두고 가는 짐」 상자 (안은 높은 층이라 막지 않음)
    { kind: 'boxes:label,open', x: 5, y: 4, w: 3, h: 2 },
    // ── 뒷벽 앞 이삿짐
    { kind: 'movingBoxes:하루 방,깨짐주의', x: 9, y: 3, w: 2, h: 1, solid: true },
    { kind: 'dresserCloth', x: 16, y: 3, w: 2, h: 1, solid: true },
    { kind: 'movingBoxes:깨짐주의,책', x: 19, y: 3, w: 2, h: 1, solid: true },
    // ── 가운데: 돗자리 · 크리스마스 장식 상자 · 선풍기 · 동화책 더미
    { kind: 'mat', x: 3, y: 8, w: 2, h: 1, solid: true },
    { kind: 'xmasbox', x: 9, y: 8, w: 2, h: 1, solid: true },
    { kind: 'fan', x: 12, y: 8, w: 1, h: 1, solid: true },
    { kind: 'bookbundle', x: 13, y: 9, w: 1, h: 1, solid: true },
    { kind: 'mousetrap', x: 24, y: 10, w: 1, h: 1, solid: true },
    // ── 할머니 의자 구석의 담: 세발자전거 · 우산꽂이 · 이삿짐
    { kind: 'tricycle', x: 3, y: 11, w: 2, h: 1, solid: true },
    { kind: 'umbrellaStand', x: 5, y: 11, w: 1, h: 1, solid: true },
    { kind: 'movingBoxes:옷,책', x: 6, y: 11, w: 2, h: 1, solid: true },
    { kind: 'boxes', x: 7, y: 12, w: 1, h: 1, solid: true },
    { kind: 'boxes:tape', x: 7, y: 14, w: 1, h: 1, solid: true },
    // ── 앞쪽: 재봉 상자 (20장 복선) · 이삿짐 · 난간
    { kind: 'sewbox', x: 11, y: 13, w: 1, h: 1, solid: true },
    { kind: 'movingBoxes:하루 방,옷', x: 16, y: 9, w: 2, h: 1, solid: true },
    { kind: 'movingBoxes:책,깨짐주의', x: 9, y: 11, w: 2, h: 1, solid: true },
    { kind: 'boxes:tape', x: 17, y: 14, w: 1, h: 1, solid: true },
    { kind: 'movingBoxes:옷,하루 방', x: 24, y: 14, w: 2, h: 1, solid: true },
    { kind: 'railing', x: 3, y: 15, w: 10, h: 1, solid: true },
    { kind: 'railing', x: 15, y: 15, w: 4, h: 1, solid: true },
    { kind: 'railing:yarn', x: 19, y: 15, w: 4, h: 1, solid: true },
    { kind: 'railing', x: 23, y: 15, w: 4, h: 1, solid: true },
    // ── 앞쪽 가림막: 화면 맨 앞을 스치는 이삿짐 상자 실루엣
    { kind: 'movingBoxes:깨짐주의,하루 방', x: 24, y: 16, w: 2, h: 1, fg: true },
  ],
  start: [6, 5],
  music: 'night',
  // 박공 창의 달빛 (창살 십자 웅덩이) · 뚜껑문 틈의 노란 불빛 (엄마가 아직 깨어 있다)
  beams: [{ x: 13, w: 4, h: 9, slant: -2 }],
  lights: [
    { at: [13, 13], r: 40, color: [255, 200, 120], k: 0.55 },
    { at: [15, 18], r: 56, color: [255, 206, 130], k: 0.5 },
  ],
  ambient: [128, 128, 184],
};

const DOLL_HINT = s`
  @if woke_all
    @if trap_open
      doll: 사다리 아래에 반짝이는 게 보이니? 기억을 다 보았다면, 내려가 보렴.
    @else
      doll: 저 뚜껑문은 무거워서 하나로는 안 열린단다. 보리하고 한 사람 더, 말을 걸어 데려와서 같이 밀어 보렴.
    @end
  @else
    @if out_box
      doll: 보리는 꿀 냄새, 루루는 장난, 나비는 큰 소리. 저마다 깨는 법이 다르단다.
    @else
      doll: 테이프 자락이 늘어진 쪽으로 가 보렴. 그걸 붙잡고 넘어가면 된단다.
    @end
  @end
`;

const ALL_AWAKE = s`
  @if woke_bori
  @if woke_ruru
  @if woke_nabi
    @wait 0.4
    @bars on
    doll: 다들 모였구나.
    @face toby doll
    doll: 하나 더 알려 주마. 우리가 움직이는 건 이 밤뿐이란다. 해가 뜨면 다시 장난감이 되지.
    @act ruru cheer nowait
    ruru: 그럼 밤새 놀 수 있는 거네!
    @act bori think nowait
    bori: 밤새 걸으면 배고플 텐데.
    @act nabi shake nowait
    nabi: 그건 자랑이 아니야, 보리.
    doll: 다들 저마다 좋아하는 자리가 있구나. 쉬고 싶으면 쉬고, 토비가 부르면 같이 가렴.
    doll: 하루 손때가 묻은 물건은, 가만히 들여다보면 그날 냄새가 난단다.
    @cam 13 13 1.2
    @wait 1.8
    doll: 다 보고 나면, 저 뚜껑문을 열고 아래층으로 내려가렴. 하루의 마음은 이 다락보다 아래에 있단다.
    @cam off
    @bars off
    @goal 뚜껑문을 열고 아래층으로 내려가자
    @flag woke_all
  @end
  @end
  @end
`;

export const CH1: Chapter = {
  n: 1,
  title: '1장 · 다락방',
  sub: '15살, 이삿짐을 싸던 밤',
  room: 'attic',
  start: [6, 5],
  party: ['toby'],
  wind: 0.9,
  intro: s`
    @fade 1 0
    @bars on
    @music none
    @pose toby stop
    @pose ruru_sleep sleep
    @wait 1
    > 그날 밤 열한 시 십 분. 불 꺼진 다락방, 「두고 가는 짐」 상자 안.
    @wait 1.5
    @sfx windTick
    @wait 0.25
    @sfx windTick
    @wait 0.25
    @sfx windTick
    > 끼릭. 끼릭. 끼릭. 어딘가에서 태엽 감기는 소리.
    @wait 0.8
    doll: …토비야.
    doll: 일어나렴, 토비야.
    @fade 0 3
    @wait 0.5
    @pose toby idle
    @act toby stretch
    @emote toby ?
    @act toby lookAround nowait
    toby: …으음. 여기가… 어디지?
    @act toby lookAround nowait
    toby: …방금, 누가 제 태엽 감았어요? 세 번.
    @face toby doll
    doll: 꿈꿨나 보구나. 감아 줄 사람이 어디 있다고.
    @wait 0.6
    doll: 다락방이란다. 하루가 우리를 상자에 담아 이리로 올려 보냈어.
    toby: 태엽 할머니! 하루가? 우리를… 왜요?
    doll: 내일 이 집을 떠난대. 그리고 이 상자에는 쪽지가 붙었지. 「두고 가는 짐」.
    @emote toby !
    @act toby surprise nowait
    toby: 두고… 간다고요? 우리를?
    doll: 쉿. 크게 말하면 아래층까지 들린단다.
    @act toby shake nowait
    toby: 말도 안 돼. 하루는 매일 밤 내 태엽을 감아 줬어요. "태엽이 멈추지 않게"라면서…
    doll: 그건 아주 오래전 일이지. 네 등을 만져 보렴.
    @sfx windTick
    > 끼릭… 끼…릭. 등의 태엽이 느리게, 아주 느리게 돌고 있다.
    @act toby tremble
    toby: 태엽이… 거의 다 풀렸어.
    doll: 하루가 마지막으로 네 태엽을 감아 준 게 두 해 전이란다. 태엽이 다 풀리면, 우리 같은 장난감은 다시 깨어나지 못해.
    @emote toby …
    doll: 그러니 태엽이 멈추기 전에, 하루의 마음을 찾아오렴.
    toby: 하루의 마음이요?
    doll: 하루가 이 집에 두고 가려는 게, 우리만은 아니란다.
    doll: 따라가 보렴. 하루가 무엇을 상자에 넣었는지.
    @act toby lookAround nowait
    toby: 그런데… 보리는요? 루루랑 나비는?
    doll: 하루가 테이프를 붙이다 말았지. 그 틈으로 다들 잠결에 기어 나갔단다. 저 녀석들은 꿈속에서도 제멋대로야.
    doll: 태엽이 없는 아이들은 누가 깨워 줘야 깬단다.
    @act toby point nowait
    toby: 할머니도 같이 가요.
    @act doll shake nowait
    doll: 이 할머니는 태엽이 너무 낡아서 오래 걷지 못한단다. 여기서 기다리마.
    doll: 먼저 이 상자부터 나가렴. 늘어진 테이프 자락을 붙잡으면 넘어갈 수 있을 게다.
    @bars off
    @title 태엽이 멈추기 전에 |
    @music night
    @chtitle
    @goal 상자 밖으로 나가자
  `,
};

export function atticRoom(): RoomDef {
  const r = houseMap({
    ...ATTIC_HOUSE,
    things: [
      { kind: 'npc', id: 'doll', at: [5, 4], actor: 'grandoll', dir: 'down', scene: DOLL_HINT },
      // ── 놀이 1 · 상자 탈출: 늘어진 테이프 자락을 붙잡고 상자 벽을 넘는다 (토비 혼자)
      { kind: 'climb', id: 'box_tape', at: [8, 5], to: [7, 5], who: 'any' },
      {
        kind: 'trigger',
        id: 'out_box',
        rect: [8, 3, 2, 4],
        unless: 'out_box',
        scene: s`
          @sfx thud
          @act toby jump
          toby: …나왔다.
          @emote toby !
          doll: 잘했다, 토비야.
          @act toby lookAround nowait
          toby: 다락이 이렇게 컸나. 하루 방에서 올려다볼 땐 몰랐어.
          doll: 그 테이프 자락은 하루가 붙이다 만 거란다. 하루의 손이 오래 닿은 물건에는 하루의 기억이 깃들지.
          doll: 살펴보면, 그날로 돌아가 볼 수 있을 게다.
          doll: 그리고 친구들을 깨우렴. 혼자서는 못 해낼 일이니까.
          @goal 잠든 친구들을 깨우자 (보리 · 루루 · 나비)
          @flag out_box
        `,
      },
      // ── 놀이 2 · 보리 깨우기: 장식 상자의 꿀사탕 → 책 더미에 걸림 → 선풍기 바람으로 보리 코앞까지
      {
        kind: 'npc',
        id: 'bori_sleep',
        at: [15, 10],
        actor: 'bori',
        pose: 'sleep',
        unless: 'woke_bori',
        scene: s`
          @emote bori_sleep zz
          toby: 보리야, 일어나!
          bori: 으음… 꿀 한 숟갈만 더…
          @if candy_out
            toby: 꿀사탕이 저기 있는데. 책 더미에 걸려서 여기까지 안 와.
            @act toby think nowait
            toby: 밀 수는 없고… 바람이라도 불면 굴러올 텐데.
          @else
            @act toby think nowait
            toby: 꿀…? 그래. 보리는 꿀 냄새가 나야 일어나지.
          @end
        `,
      },
      {
        kind: 'spot',
        id: 'candy',
        at: [10, 9],
        scene: s`
          @if candy_out
            > 장식 상자 안에는 꿀사탕이 몇 알 더 남아 있다. 반짝이 줄에 단단히 끼여 있다.
            toby: 하나면 충분해. 보리가 다 먹으면 배탈 나.
          @else
            > 크리스마스 장식 상자. 반짝이 줄 사이에 노란 꿀사탕이 끼여 있다.
            toby: 꿀사탕이다! 하루가 트리에 매달던 거.
            @act toby stretch
            @sfx paper
            > 토비가 반짝이 줄을 힘껏 잡아당긴다.
            @item candy honeycandy 11 9
            @sfx pop
            @shake 0.2
            > 톡. 꿀사탕 하나가 튀어나와 마루를 데구루루 구른다.
            @sfx thud
            > …그리고 동화책 더미에 걸려 멈췄다.
            @emote toby sweat
            toby: 아, 아깝다. 조금만 더 가면 보리 코앞인데.
            @flag candy_out
          @end
        `,
      },
      {
        kind: 'spot',
        id: 'fan',
        at: [12, 9],
        scene: s`
          @if woke_bori
            > 낡은 선풍기. 날개가 아직도 아주 조금씩 돈다.
            bori: 선풍기 덕분에 꿀 냄새 맡았어. 고마워, 선풍기.
          @else
            @if candy_out
              > 낡은 선풍기. 앞판에 커다란 단추가 있다.
              toby: 바람이면… 굴릴 수 있을지도.
              @act toby jump
              @sfx click
              > 토비가 폴짝 뛰어 단추를 누른다. 위잉— 선풍기가 돌기 시작한다.
              @sfx wind
              @item candy honeycandy 14 10
              > 바람에 밀린 꿀사탕이 책 더미를 비껴 데구루루— 보리 코앞에서 멈췄다.
              @sfx click
              > 딸깍. 선풍기가 다시 멈춘다.
              @wait 0.6
              @emote bori_sleep …
              @wait 0.4
              @emote bori_sleep !
              @pose bori_sleep idle
              @act bori_sleep surprise
              bori: 꿀! 꿀 냄새!
              @take bori_sleep candy
              @act bori_sleep lookAround nowait
              bori: 어, 어? 토비? 여기 어디야? 깜깜해.
              @emote bori_sleep …
              > 보리는 꿀사탕을 입가까지 가져갔다가, 멈췄다. 그리고 앞발 안에 꼭 쥐었다.
              toby: …안 먹어? 보리가?
              bori: 나중에. …왠지 그래야 할 것 같아.
              @carry bori_sleep none
              toby: 다락방이야. 설명은 이따가 할게. 같이 가자.
              bori: 다락방…? 하루는? 하루가 아침 먹으러 오라고 했어?
              toby: …아니. 그냥 따라와.
              @act bori sigh nowait
              bori: 조금만 여기 있을래. 꿀 냄새가 아직 남았어.
              toby: …알았어. 힘쓸 일 생기면 부를게.
              > 동료에게 말을 걸면 같이 데려가거나, 그 자리에서 쉬게 할 수 있다.
              @flag woke_bori
              @join bori
            @else
              > 낡은 선풍기. 단추를 누르자 먼지만 풀썩 날린다.
              @sfx wind
              toby: 콜록. 바람은 잘 나오네. 날릴 게 먼지뿐이라 그렇지.
            @end
          @end
        `,
      },
      // ── 놀이 2½ · 보리의 첫 밀기: 동화책 더미를 한 칸씩 밀어 할머니 의자 구석으로
      { kind: 'push', id: 'books_gate', at: [7, 13], look: 'bookbundle' },
      {
        kind: 'trigger',
        id: 'gate_hint',
        rect: [8, 12, 2, 3],
        when: 'woke_bori',
        unless: 'mem_m1d',
        scene: s`
          toby: 책 더미 너머에 의자가 하나 있어. 저기 들어가려면…
          @if with_bori
            @act bori jump nowait
            bori: 나한테 맡겨! 밀기는 자신 있어. 한 칸씩, 천천히.
          @else
            @act toby think nowait
            toby: 보리 힘이 필요해. 보리한테 가서 같이 가자고 하자.
          @end
        `,
      },
      // ── 놀이 3 · 루루 깨우기: 이삿짐 사이로 도망치는 루루를 세 번 따라잡기
      {
        kind: 'trigger',
        id: 'ruru_wake',
        rect: [16, 11, 5, 4],
        unless: 'woke_ruru',
        scene: s`
          toby: 루루, 일어나.
          > …대답이 없다.
          toby: 루루?
          @emote ruru_sleep !
          @pose ruru_sleep idle
          @act ruru_sleep jump nowait
          ruru: 왁!!
          @shake 0.3
          @act toby surprise nowait
          @emote toby !
          toby: 으악!
          @act ruru_sleep laugh nowait
          ruru: 히히히! 속았지? 너희 올라올 때부터 깨어 있었다구.
          toby: 지금 장난칠 때가 아니야, 루루.
          @act ruru_sleep hop nowait
          ruru: 같이 가 달라고? 그럼 잡아 봐라~ 세 번 잡으면 생각해 볼게!
        `,
      },
      {
        kind: 'chase',
        id: 'ruru_sleep',
        actor: 'ruru',
        path: [[18, 13], [23, 8], [21, 13]],
        laps: 3,
        flag: 'woke_ruru',
        scene: [
          ...s`
            @act ruru_sleep surprise nowait
            ruru: 으앗, 잡혔다!
            @act ruru_sleep stomp nowait
            ruru: 칫. 토끼 주제에 빠르네.
            toby: 루루. 「두고 가는 짐」 얘기… 들었지?
            ruru: 알아, 알아. 다 들었어.
            @emote ruru_sleep …
            @act ruru_sleep shrug nowait
            ruru: …뭐, 상관없어. 난 원래 혼자서도 잘 놀거든.
            toby: 루루 귀가 축 처졌는데.
            @act ruru_sleep stomp nowait
            ruru: 안 처졌거든!
            @join ruru
          `,
          ...ALL_AWAKE,
        ],
      },
      // ── 놀이 4 · 나비 깨우기: 뻐꾹 영감에게 토비의 태엽을 나눠 준다
      {
        kind: 'trigger',
        id: 'cuckoo_meet',
        rect: [20, 3, 5, 2],
        scene: s`
          @sfx clock
          cuckoo: …뻐, 뻐.
          @emote toby ?
          toby: 뻐꾸기시계가… 말을 해?
          cuckoo: 에헴. 뻐꾹 영감이라 부르게. 이 다락에서 제일 오래 묵은 몸이지.
          cuckoo: 말은 정각에만 하는 법이야. 지금은 열한 시 십 분. 정각까지 오십 분이나 남았어… 뻐, 뻐.
          @if woke_nabi
            cuckoo: 아까 그 한 번은 특별히 울어 준 거야. 다음 정각까지 다시는 안 울 테다.
          @else
            toby: 영감님, 저쪽 구석에 나비가 자요. 큰 소리가 나야 깨는 고양이예요.
            cuckoo: 태엽이 다 풀려서 울 기운이 없어. 누가 한 바퀴만 감아 주면 모를까.
            @emote toby …
            @act toby think
            toby: 태엽이라면… 나한테 조금 있어.
          @end
        `,
      },
      {
        kind: 'windup',
        id: 'cuckoo',
        at: [22, 3],
        cost: 0.15,
        scene: [
          ...s`
            @bars on
            @act toby stretch
            @sfx windTick
            > 토비가 자기 등의 태엽을 한 바퀴 풀어, 뻐꾸기시계 태엽 구멍에 나눠 준다.
            @sfx windTick
            > 끼릭, 끼릭. 토비의 등이 조금 가벼워진다.
            @act toby tremble nowait
            @prop cuckoo bird 2
            @sfx clockChime
            cuckoo: 뻐꾹! 뻐꾹!
            @shake 0.3
            @wait 0.4
            @emote nabi_sleep !
            @pose nabi_sleep idle
            nabi: …시끄러워. 다 들려.
            toby: 나비! 깼구나.
            @act nabi_sleep stretch nowait
            nabi: 고양이는 원래 밤에 깨어 있는 거야. 방금 그 소리는… 상식 밖이었지만.
            cuckoo: 에헴. 정각이 아니어도 울 수 있다니. 오래 살고 볼 일이군.
            doll: 토비야. 태엽은 나눠 줄수록 네 몫이 줄어든단다. 아껴 쓰렴.
            @act toby nod nowait
            toby: …네. 그래도 나비를 깨우는 데 쓴 건 아깝지 않아요.
            nabi: 그래서, 하루의 기억을 찾으러 간다고? 깜깜한 데를 헤맬 거면 등불이 있어야 할 텐데.
            @if woke_ruru
              ruru: 같이 가고 싶으면 그냥 같이 가고 싶다고 해.
            @end
            @act nabi_sleep shrug nowait
            nabi: …흥. 너희가 길을 잃으면 하루가 슬퍼할 테니까. 그것뿐이야.
            @flag woke_nabi
            @join nabi
            @bars off
          `,
          ...ALL_AWAKE,
        ],
      },
      {
        kind: 'npc',
        id: 'nabi_sleep',
        at: [25, 12],
        actor: 'nabi',
        pose: 'sleep',
        unless: 'woke_nabi',
        scene: s`
          @emote nabi_sleep zz
          toby: 나비야. 나비!
          > 들보 밑 깜깜한 구석에서 동그랗게 몸을 말고 잔다. 꼬리 끝도 움직이지 않는다.
          toby: 웬만한 소리로는 안 깨겠어. 아주 큰 소리가 나야 해.
        `,
      },
      // ── 놀이 5 · 뚜껑문: 보리와 동료 하나가 같이 밀어 연다 (무게 2) → 루루 밧줄로 사다리
      { kind: 'push', id: 'trapdoor', at: [13, 13], look: 'trapdoor', weight: 2 },
      { kind: 'pad', id: 'trap_r', at: [14, 13], accepts: ['trapdoor'], flag: 'trap_open' },
      { kind: 'pad', id: 'trap_d', at: [13, 14], accepts: ['trapdoor'], flag: 'trap_open' },
      { kind: 'pad', id: 'trap_u', at: [13, 12], accepts: ['trapdoor'], flag: 'trap_open' },
      {
        kind: 'trigger',
        id: 'hatch_hint',
        rect: [12, 12, 4, 1],
        when: 'woke_bori',
        unless: 'trap_open',
        scene: s`
          > 마루 한가운데 네모난 뚜껑문. 틈으로 노란 불빛이 가늘게 새어 나온다.
          toby: 아래층으로 가는 문이야. 엄마 방 불빛이 아직 켜져 있어.
          @if with_bori
            @act bori think nowait
            bori: 이건 나 혼자는 무거워. 누가 같이 밀어 줘야 해.
          @else
            @act toby think nowait
            toby: 무거워 보여. 보리하고 친구 하나가 더 있어야 밀 수 있겠어.
          @end
        `,
      },
      {
        kind: 'trigger',
        id: 'hatch_open',
        rect: [11, 11, 6, 4],
        when: 'trap_open',
        scene: s`
          @bars on
          @sfx open
          > 끼이익— 뚜껑문이 밀려나고, 네모난 구멍 아래로 사다리가 보인다.
          > 아래층 복도에서 노란 불빛이 새어 올라온다.
          @if woke_nabi
            @act nabi peek nowait
            nabi: 엄마 방 불이야. 엄마는 아직 안 주무시나 봐.
          @else
            toby: 엄마 방 불빛이야. 엄마는 아직 안 주무시나 봐.
          @end
          @if woke_ruru
            @act ruru point nowait
            ruru: 사다리 첫 칸에 뭐가 걸려 있는데? 반짝, 했어.
            toby: 너무 깊어. 우리 키로는 못 내려가.
            @act ruru hop nowait
            ruru: 그러니까 밧줄이지! 사다리에 걸고 내려가면 돼. 나만 믿어.
            @call ruru
          @else
            toby: 너무 깊어. 우리 키로는 못 내려가. 밧줄이 있으면 좋을 텐데…
          @end
          @if woke_nabi
            nabi: 내가 등불로 비출게. 발 조심해.
          @end
          @bars off
        `,
      },
      { kind: 'climb', id: 'ladder', at: [13, 13], to: [13, 18], who: 'ruru', when: 'trap_open' },
      // ── 기억이 깃든 물건 (m1d~m1g 는 다른 파일에서 더해져 아래 자리표로 놓인다)
      {
        kind: 'keepsake',
        id: 'm1a',
        at: [8, 4],
        look: 'tape',
        name: '테이프 소리',
        caption: '하루는 토비를 상자에 넣고 「미안」이라 했다',
        when: 'out_box',
        scene: s`
          @room m_room15
          @show haru haru15 12 8 left
          @carry haru toby rtoby
          @item rbox boxOpen 9 8
          @music piano
          > 이삿날 전날 낮. 하루의 방.
          @wait 0.8
          > 하루가 토비 인형을 한참 내려다본다.
          @emote haru …
          @wait 0.8
          mom: 하루야, 다 쌌니? 내일 아침 일찍 출발이야.
          @act haru nod nowait
          haru: …거의.
          mom: 토비도… 그 상자에 넣는 거야?
          @emote haru …
          haru: 응. 다락방에 올려 둘 거야. 새집은 내 방이 좁대.
          mom: 그래도…
          @act haru shrug nowait
          haru: 엄마. 나 이제 열다섯 살이야. 인형 가지고 놀 나이 아니야.
          > 엄마는 더 말하지 않았다.
          @wait 1
          @walk haru 12 9 30
          @walk haru 10 9 30
          @face haru left
          @pose haru kneel
          @carry haru none
          @sfx put
          @wait 0.4
          @sfx cardboard
          @item rbox box
          @pose haru idle
          > 하루는 토비 인형을 상자에 넣고, 뚜껑을 닫았다.
          @wait 1
          @pose haru lookDown
          haru: …미안.
          > 아주 작은 목소리였다.
          @wait 1
        `,
        explore: {
          enter: [2, 9],
          intro: s`
            toby: 여기는… 하루 방. 이삿날 전날 낮. 하루가 우리를 다락방에 올려 두기 몇 시간 전이야.
            > 발밑에서 가느다란 빛줄기가 반짝인다. 실이다.
            toby: 기억의 실…? 흩어진 실을 다 찾아 이으면, 멈춘 이 순간이 다시 흐를 것 같아.
          `,
          threads: [
            { at: [3, 6], text: s`
              > 테이프로 꽁꽁 감은 상자들. 매직으로 「책」, 「겨울옷」, 「부엌」.
              toby: 하루 글씨야. 줄을 맞춰서 반듯하게. 할머니가 쓰던 글씨랑 꼭 닮았어.
            ` },
            { at: [9, 8], text: s`
              > 뚜껑이 열린 빈 상자 하나. 옆면에 아무것도 쓰여 있지 않다.
              toby: 옆에 쪽지 한 장이 뒤집힌 채 놓여 있어. 「두고 가는 짐」… 사흘 전에 써 둔 거야.
            ` },
            { at: [13, 5], text: s`
              > 비닐을 씌운 침대. 머리맡이 텅 비어 있다.
              toby: 저기가 내 자리였어. 베개 옆, 하루 얼굴이 제일 잘 보이는 자리.
              @emote toby …
            ` },
          ],
          looks: [
            { at: [12, 7], text: s`
              > 하루 품에 안긴 하얀 토끼 인형. 등의 태엽이 멈춰 있다. 빨간 리본에 보라색 보풀 한 올이 엉켜 있다.
              toby: …나다. 이렇게 보니까 생각보다 작네. …보풀은 언제 묻었지.
            ` },
            { at: [1, 3], text: s`
              > 문 너머 복도. 계단을 오르던 발소리가 멈춰 있다.
              toby: 엄마가 올라오는 중이었구나. 하루는… 그 소리를 듣고 있었을까.
            ` },
          ],
        },
        after: s`
          @if woke_all
            bori: 하루가… 미안하다고 했어.
            @act ruru stomp nowait
            ruru: 미안하면 안 두고 가면 되잖아. 쳇.
            nabi: 그 얼굴 봤어? 아무렇지 않은 척하는 얼굴이었어.
            @act toby nod nowait
            toby: …응. 하루는 거짓말할 때 꼭 저렇게 입술을 깨물어.
          @else
            @emote toby …
            toby: 하루가… 미안하다고 했어.
            @act toby stomp nowait
            toby: 미안하면… 안 두고 가면 되잖아.
            doll: 그 얼굴을 보았니? 아무렇지 않은 척하는 얼굴이었지.
            @act toby nod nowait
            toby: …네. 하루는 거짓말할 때 꼭 저렇게 입술을 깨물어요.
          @end
        `,
      },
      {
        kind: 'keepsake',
        id: 'm1b',
        at: [17, 4],
        look: 'photo:down',
        look2: 'photo',
        name: '엎어 놓은 사진',
        caption: '할머니와 찍은 사진을 엎어 두었다',
        when: 'woke_all',
        scene: s`
          @room m_room15
          @show haru haru15 8 7 down
          @carry haru photo rphoto
          @item rbag bag 7 8
          @music piano
          @sfx drawer
          > 하루가 책상 서랍 깊은 곳에서 액자 하나를 꺼냈다.
          @wait 0.6
          @pose haru lookDown
          haru: …할머니.
          > 사진 속에서 할머니와 네 살짜리 하루가 웃고 있다. 하루의 품에는 하얀 토끼 인형.
          @wait 1.2
          @pose haru idle
          @act haru think
          haru: 이것도 상자에 넣어야 하나.
          @emote haru …
          @wait 1.2
          @face haru left
          @pose haru kneel
          @sfx zipper
          @carry haru none
          > 하루는 사진을 상자에 넣지 않았다. 대신 엎어서, 가방 맨 밑에 넣었다.
          @sfx zipper
          @pose haru idle
          haru: 보면… 또 생각나니까.
          @wait 1
        `,
        after: s`
          @act toby surprise nowait
          toby: 사진 속 토끼… 나였어.
          bori: 할머니가 하루를 안고 있었어. 하루는 토비를 안고 있었고.
          nabi: 할머니… 하루의 진짜 할머니 말이야. 언제부터 안 보이셨더라.
          ruru: 쉿, 나비.
          @emote nabi …
        `,
      },
      {
        kind: 'keepsake',
        id: 'm1c',
        at: [13, 12],
        look: 'crack',
        name: '닫힌 방문',
        caption: '할머니 방 문을 또 닫았다',
        when: 'woke_all',
        dark: true,
        scene: s`
          @room m_gm14
          @show haru haru15 1 3 down
          @music minor
          @sfx doorOpen
          > 복도 끝, 할머니 방.
          @wait 0.6
          @walk haru 2 4 30
          @face haru right
          @emote haru …
          > 한 해 넘게 하루가 열지 않은 방. 재봉틀 위에 먼지가 소복하다.
          @act haru sigh
          mom: 하루야, 할머니 방 짐은 엄마가 정리할까?
          @act haru shake nowait
          haru: …아니.
          haru: 내가 할게. 나중에.
          mom: 내일 떠나는데, 나중이 언제야.
          @wait 1.2
          @act haru shrug nowait
          haru: …모르겠어.
          @walk haru 1 3 30
          @hide haru
          @sfx doorClose
          > 하루는 문을 닫았다. 열네 살의 그날처럼.
          @wait 1
        `,
        explore: {
          enter: [9, 9],
          intro: s`
            toby: 복도 끝, 할머니 방. 하루가 문고리를 잡은 채 멈춰 있어.
            toby: 여기에도 기억의 실이 흩어져 있어. 하나씩 이어 보자.
          `,
          threads: [
            { at: [3, 4], text: s`
              > 먼지 쌓인 재봉틀. 바늘에 노란 실이 꿰인 채 그대로다.
              toby: 열네 살 하루가 꿴 실이야. 할머니처럼 해 보겠다고. 그 뒤로 아무도 빼지 않았어.
            ` },
            { at: [13, 3], text: s`
              > 벽시계. 바늘이 멈춰 있다. 기억 속이라서가 아니라, 정말로 멈춘 시계다.
              toby: 할머니가 떠난 뒤로 아무도 건전지를 갈지 않았어. 이 방의 시간은 거기서 멈춘 거야.
            ` },
            { at: [6, 8], text: s`
              > 방 한가운데 빈 상자 두 개. 엄마가 가져다 놓은 것이다. 아직 텅 비어 있다.
              toby: 엄마도 이 방을 정리하고 싶었던 거야. 그래도 하루가 할 때까지… 기다렸어.
            ` },
          ],
          looks: [
            { at: [1, 4], text: s`
              > 문고리에 손을 얹은 하루. 문을 닫으려는 건지, 열려는 건지 알 수 없다.
              toby: …하루도 모르는 것 같아.
            ` },
          ],
        },
        after: s`
          @act ruru shrug nowait
          ruru: 한 해 넘게 안 열었대.
          @act bori think nowait
          bori: 할머니 방에 가면 꿀 냄새가 났는데. 할머니가 타 주시던 꿀차.
          toby: 할머니 방에… 무슨 일이 있었던 걸까.
        `,
      },
      // ── 기억의 문: 재봉 상자 틈에서 빠져나와 사다리 첫 칸에 걸린 바늘
      {
        kind: 'link',
        id: 'l1',
        at: [15, 18],
        name: '재봉 상자 틈의 바늘',
        icon: 'needle',
        locked: s`
          nabi: 바늘이 반짝이긴 하는데… 아직 위에서 못 본 기억이 남았어.
          toby: 다락의 물건들을 더 살펴보고 오자.
        `,
        scene: s`
          @bars on
          > 사다리 첫 칸, 나무 틈에 바늘 하나가 꽂혀 있다. 빨간 실이 한 뼘 꿰인 채.
          toby: 바늘…?
          nabi: 저 위, 뚜껑문 옆 재봉 상자 틈으로 빠져나왔나 봐.
          doll: 할머니가 평생 쓰시던 바늘이란다.
          @emote toby !
          doll: 기억을 다 보았구나. 하루의 마음은 아직 닫힌 문 너머에 있단다. 할머니 방… 그 문을 열어 보렴.
          @act toby think nowait
          toby: 할머니 방으로는 어떻게 가요?
          doll: 이 바늘을 따라가렴.
          nabi: 태엽 할머니는… 하루의 할머니를 잘 알아요?
          @act doll nod
          doll: …그럼. 아주 잘 알지.
          > 바늘이 은은하게 빛나며, 복도 끝 닫힌 문을 비춘다—
          > 바늘 끝 빨간 실이 엉켜 있다. 풀어야 따라갈 수 있다.
          @mini flip1
          @sfx open
          @flag ch1_done
          @sfx memory
          @fade 1 1.4 white
          @next
        `,
      },
      // ── 종이별 (바닥 틈에 끼인 종이 물건)
      { kind: 'star', id: 's1a', at: [3, 4], text: '상자 틈에 끼어 있던 노란 종이별.' },
      { kind: 'star', id: 's1b', at: [3, 14], text: '먼지 속에서 분홍 종이별을 찾았다.' },
      { kind: 'star', id: 's1c', at: [16, 6], text: '창틀 아래 떨어진 하늘색 종이별.' },
      // ── 살펴보기
      {
        kind: 'spot',
        id: 'label',
        at: [8, 6],
        scene: s`
          > 상자 옆면에 노란 쪽지가 붙어 있다. 「두고 가는 짐」.
          @if woke_bori
            bori: 두고 가는… 짐. 우리가 짐이야?
            @if woke_ruru
              @act ruru giggle nowait
              ruru: 짐 맞지 뭐. 무겁잖아, 보리 너.
              @act bori stomp nowait
              bori: 나 안 무거워! 솜이야!
            @end
          @else
            toby: 하루 글씨다. 동그랗게 말린 ㄹ… 하루 글씨가 맞아.
          @end
        `,
      },
      {
        kind: 'spot',
        id: 'window',
        at: [14, 4],
        scene: s`
          @sfx wind
          > 둥근 창으로 달빛이 쏟아진다. 마루에 창살 그림자가 십자로 찍혀 있다.
          toby: 하루 방 창문에서도 이 달이 보일까.
          @if woke_nabi
            nabi: 하루는 보름달이 뜨면 꼭 소원을 빌었어. 무슨 소원인지는 끝까지 안 알려 줬지만.
          @end
        `,
      },
      {
        kind: 'spot',
        id: 'raincoat',
        at: [21, 5],
        scene: s`
          > 작아진 노란 비옷이 상자 밖으로 삐져나와 있다.
          @if woke_bori
            bori: 이거 하루가 다섯 살 때 입던 거다! 비 오는 날 마당에서…
            @emote bori ?
            bori: …마당에서 뭐 했더라? 기억이 안 나.
            toby: …나도.
          @else
            toby: 하루의 노란 비옷. 이렇게 작았구나.
          @end
        `,
      },
      {
        kind: 'spot',
        id: 'sewing',
        at: [11, 14],
        scene: s`
          > 할머니의 낡은 재봉 상자. 뚜껑이 꼭 닫혀 있고, 이음매 틈으로 빨간 실 끝이 삐죽 나와 있다.
          @if woke_nabi
            nabi: 할머니 재봉 상자야. 루루 꼬리를 꿰맨 것도 이 상자 실이었을걸.
            @if woke_ruru
              ruru: 그 얘긴 왜 꺼내.
              nabi: 꼬리가 흔들리길래.
              @emote ruru sweat
            @end
          @else
            toby: 할머니 재봉 상자가 왜 여기에… 뚜껑이 안 열려.
          @end
        `,
      },
      {
        kind: 'spot',
        id: 'hat',
        at: [20, 7],
        scene: s`
          > 구겨진 고깔모자. 「7」이라고 적혀 있다.
          @if woke_ruru
            @act ruru cheer nowait
            ruru: 일곱 살 생일! 초 일곱 개를 한 번에 다 껐잖아. 아빠가 하루보다 더 크게 소리 질렀지.
          @else
            toby: 일곱 살 생일 모자다.
          @end
        `,
      },
      {
        kind: 'spot',
        id: 'crayon',
        at: [7, 9],
        scene: s`
          > 크레용 그림 한 장. 할머니와 아이, 그리고 하얀 토끼 한 마리.
          > 삐뚤빼뚤한 글씨: 「평생 같이 놀자」
          toby: …평생.
          @if woke_ruru
            ruru: 평생이 이렇게 짧은 줄 알았나.
            @if woke_bori
              bori: 루루…
            @end
          @end
        `,
      },
      {
        kind: 'spot',
        id: 'tricycle',
        at: [4, 10],
        scene: s`
          > 녹슨 세발자전거. 손잡이 술이 다 빠지고, 바구니에 마른 나뭇잎 한 장.
          toby: 하루가 이걸 타고 마당을 빙빙 돌았어. 나는 바구니에 타고.
          @if woke_bori
            bori: 나도 탔어! 바구니가 좁아서 토비를 깔고 앉았지만.
            toby: …그건 기억 안 해도 돼.
          @end
        `,
      },
      {
        kind: 'spot',
        id: 'mousetrap',
        at: [23, 10],
        scene: s`
          > 빈 쥐덫. 치즈 대신 오래된 과자 부스러기가 붙어 있다.
          @if woke_bori
            @act bori think nowait
            bori: 저 과자… 아직 먹을 수 있을까?
            toby: 보리. 안 돼.
          @else
            toby: 쥐덫이다. 가까이 가지 말자.
          @end
        `,
      },
      {
        kind: 'spot',
        id: 'stage',
        at: [24, 7],
        scene: s`
          > 상자를 오려 만든 작은 인형극 무대. 빨간 커튼이 반쯤 떨어져 있다.
          @if woke_ruru
            @act ruru spin nowait
            ruru: 토비 극장! 우리가 주인공이었잖아. 할머니가 목소리 연기를 진짜 잘하셨는데.
          @else
            toby: 토비 극장… 오랜만이다.
          @end
        `,
      },
    ],
  });
  return {
    ...r,
    toys: true,
    hangouts: {
      bori: { at: [15, 10], pose: 'chinRest', dir: 'left', talk: s`
        @act bori nod nowait
        bori: 여기가 내가 자던 자리야. 아직 꿀 냄새가 나.
        bori: 무거운 거 밀 일 있으면 불러, 토비. 힘은 자신 있어.
      ` },
      ruru: { at: [19, 12], dir: 'down', talk: s`
        @act ruru giggle nowait
        ruru: 이삿짐 사이가 숨기 딱 좋아. 아까도 여기서 너희 다 보고 있었다?
        ruru: 높은 데 갈 일 있으면 불러. 밧줄은 나밖에 없잖아.
      ` },
      nabi: { at: [18, 7], pose: 'sleepSit', dir: 'left', talk: s`
        @act nabi stretch nowait
        nabi: …여기 조용해서 좋아. 창으로 달도 보이고.
        nabi: 깜깜한 데 갈 거면 나를 데려가. 내 눈이 밝으니까.
      ` },
    },
    // 다른 파일에서 더해지는 기억 → 이 다락의 물건
    keepsakes: {
      m1d: { at: [3, 12], look: 'chairOld' },
      m1e: { at: [21, 14], look: 'yarn' },
      m1f: { at: [4, 5], look: 'letter' },
      m1g: { at: [25, 4], look: 'paintcan' },
    },
  };
}
