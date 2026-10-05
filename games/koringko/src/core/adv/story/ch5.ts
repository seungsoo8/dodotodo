/**
 * 5장 · 책상 위 (근접 지도) — 10살, 할머니가 종이별 접기를 알려 준 날.
 * 장난감 눈높이로 본 거대한 책상: 연필은 통나무 다리, 지우개는 계단, 공책은 흰 들판, 모서리 너머는 아득한 방바닥.
 *
 * 놀이 (REDESIGN §7 9장):
 *  1. 길 만들기 — 연필을 굴려(roll) 서랍장과 책상 사이 틈 가장자리 발판에 걸치면 gap_g9pencil → 연필 다리.
 *     밧줄 걸 데가 없는 틈이라 루루 밧줄로는 못 건넌다 (틈의 at 은 손이 닿지 않는 낭떠러지 끝).
 *  2. 깡 장군 암호 — 공책 위 숫자 발판 셋을 달력(7) → 시간표(2) → 시험지(6) 차례로 밟으면 code_ok.
 *     그 전에는 장군이 지키는 길목(자 차단기)에 들어서면 되돌려 보낸다. 토비가 태엽을 나눠 주면 차례 힌트.
 *  3. 스탠드 — 큰 지우개를 책 더미 앞에(er_big) → 책 더미 위로 오르기 → 작은 지우개를 스탠드 받침 앞에(er_small)
 *     → 받침 위로 오르기 → 보리가 엉덩이로 스위치(lamp_on) → 색종이 자매와 별 접기 연습(@mini stars, folded)
 *     → 노란 종이띠(m5g) → 인형극 무대(link, flip3).
 */
import { s } from '../parse.ts';
import type { ChainStep, Chapter, Furniture, RoomDef } from '../types.ts';
import { grid, toyRoom } from './kit.ts';

const W = 40;
const H = 22;

/**
 * 지도 글자: d 책상 바닥 · W 뒷벽(창틀 아래 · 메모지) · E 책꽂이 책등 벽 · v 낭떠러지(틈 · 책상 모서리)
 *   H 막힌 소품 발 자리 · ^ 높은 바닥(책 더미 위 elev 1 · 스탠드 받침 위 elev 2) · S 단 앞면
 */
const MAP = grid(W, H, 'd', 'v', [
  ['W', 0, 0, W, 3],
  // 왼쪽: 책꽂이 책등 벽, 맨 앞 두 줄은 모서리
  ['E', 0, 0, 2, 20],
  ['E', 2, 3, 9, 1],
  // 앞 · 오른쪽: 책상 모서리 너머 낭떠러지
  ['v', 0, 20, W, 2],
  ['v', 38, 3, 2, 17],
  // 서랍장과 책상 사이 틈 (연필 다리)
  ['v', 11, 3, 2, 17],
  // 서랍장 위: 연필꽂이 · 머리끈(굴러온 연필이 걸리는 턱) · 우유갑 · 사탕통
  ['H', 8, 5, 2, 2],
  ['H', 10, 6, 1, 1],
  ['H', 5, 5, 2, 2],
  ['H', 3, 9, 2, 2],
  // 공책 들판: 탁상 달력 · 테이프 커터
  ['H', 14, 3, 3, 1],
  ['H', 14, 16, 2, 1],
  // 본진 울타리: 시험지 더미 · 휴대폰 · (길목 10~11줄) · 세워 둔 교과서
  ['H', 24, 3, 3, 7],
  ['H', 24, 12, 3, 8],
  // 책 더미 (뒤는 막힘, 위는 elev 1)
  ['H', 27, 3, 4, 2],
  ['^', 27, 5, 4, 1],
  ['^', 27, 6, 2, 1],
  ['S', 29, 6, 2, 1],
  ['S', 27, 7, 2, 1],
  // 스탠드 받침 (위는 elev 2)
  ['H', 31, 3, 3, 1],
  ['^', 31, 4, 3, 2],
  ['S', 31, 6, 2, 1],
  ['^', 33, 6, 1, 1],
  // 종이별 유리병 · 색종이 묶음
  ['H', 34, 3, 4, 1],
  ['H', 34, 4, 3, 2],
  ['H', 34, 9, 3, 2],
]);

/** 높이: 책 더미 위 1 · 스탠드 받침 위 2 */
function elevRows(): string[] {
  const e = Array.from({ length: H }, () => Array.from({ length: W }, () => '0'));
  const set = (x: number, y: number, w: number, h: number, v: string) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) e[yy][xx] = v;
  };
  set(27, 5, 4, 1, '1');
  set(27, 6, 2, 1, '1');
  set(31, 4, 3, 2, '2');
  set(33, 6, 1, 1, '2');
  return e.map((r) => r.join(''));
}

/** 거대한 소품 (장난감 눈높이) */
const FURNITURE: Furniture[] = [
  // 뒷벽: 메모지 · 시간표
  { kind: 'memoWall', x: 5, y: 0, w: 4, h: 2 },
  { kind: 'memoWall', x: 17, y: 0, w: 4, h: 2 },
  { kind: 'memoWall', x: 29, y: 0, w: 4, h: 2 },
  // 왼쪽 책등 벽 (세 번째 책 뒤에 틈)
  { kind: 'bookspines:수학 4-2,어린 왕자,중3 영어,종이접기 백과,gap', x: 0, y: 3, w: 10, h: 1 },
  // 서랍장 위
  { kind: 'pencilCup:yarn', x: 8, y: 5, w: 2, h: 2 },
  { kind: 'milkCarton', x: 5, y: 5, w: 2, h: 2 },
  { kind: 'candyTin', x: 3, y: 9, w: 2, h: 2 },
  { kind: 'hairTie', x: 10, y: 6, w: 1, h: 1 },
  { kind: 'eraserDust', x: 6, y: 17, w: 2, h: 1 },
  // 공책 들판
  { kind: 'calendarDesk:7', x: 14, y: 3, w: 3, h: 1 },
  { kind: 'notebook', x: 14, y: 8, w: 8, h: 5 },
  { kind: 'pencil:red', x: 16, y: 6, w: 5, h: 1 },
  { kind: 'eraserDust', x: 19, y: 4, w: 2, h: 1 },
  { kind: 'tapeCutter', x: 14, y: 16, w: 2, h: 1 },
  { kind: 'ruler', x: 15, y: 18, w: 6, h: 1 },
  // 본진 울타리
  { kind: 'testPapers:60', x: 24, y: 3, w: 3, h: 2 },
  { kind: 'phoneGiant:dim', x: 24, y: 5, w: 3, h: 5 },
  { kind: 'bookspines:3', x: 24, y: 15, w: 3, h: 1 },
  { kind: 'bookspines:11', x: 24, y: 19, w: 3, h: 1 },
  // 깡 장군의 차단기: 길목 위에 걸친 자 (윗층)
  { kind: 'ruler', x: 23, y: 9, w: 5, h: 1, over: true },
  // 본진: 책 더미 · 스탠드 · 유리병 · 색종이 묶음
  { kind: 'bookspines:7', x: 27, y: 4, w: 4, h: 1 },
  { kind: 'lampBase', x: 31, y: 4, w: 3, h: 2 },
  { kind: 'starJarGiant:glow', x: 34, y: 4, w: 3, h: 2 },
  { kind: 'paperStrips', x: 34, y: 9, w: 3, h: 2 },
  { kind: 'hairTie', x: 30, y: 15, w: 1, h: 1 },
  { kind: 'pencil:green', x: 30, y: 18, w: 5, h: 1 },
  // 책상 모서리 (앞쪽 · 오른쪽)
  { kind: 'deskEdge', x: 2, y: 20, w: 4, h: 1 },
  { kind: 'deskEdge', x: 6, y: 20, w: 4, h: 1 },
  { kind: 'deskEdge', x: 13, y: 20, w: 4, h: 1 },
  { kind: 'deskEdge', x: 17, y: 20, w: 4, h: 1 },
  { kind: 'deskEdge', x: 21, y: 20, w: 3, h: 1 },
  { kind: 'deskEdge', x: 27, y: 20, w: 4, h: 1 },
  { kind: 'deskEdge', x: 31, y: 20, w: 4, h: 1 },
  { kind: 'deskEdge', x: 35, y: 20, w: 3, h: 1 },
  // 앞쪽 가림막: 카메라 가까이 스치는 연필 끝
  { kind: 'pencil', x: 18, y: 21, w: 5, h: 1, fg: true },
];

export const CH5: Chapter = {
  n: 5,
  title: '5장 · 책상 위',
  sub: '10살, 종이별을 처음 배운 날',
  room: 'desk',
  start: [4, 18],
  party: ['toby', 'bori', 'ruru', 'nabi'],
  wind: 0.5,
  intro: s`
    @fade 1 0 white
    @bars on
    @music night
    @chtitle
    @fade 0 2
    > 새벽 한 시 반. 의자 등받이에서 던진 루루의 밧줄이 서랍장 모서리에 휙 걸렸다.
    @sfx rope
    @act ruru cheer nowait
    ruru: 도착! 책상 탐험대, 전원 무사!
    @act bori lookAround nowait
    bori: 우와… 하루 책상이 이렇게 넓었어? 연필이 통나무만 해.
    nabi: 저기, 창가 쪽. 달빛 받는 큰 유리병 보여?
    @emote toby …
    toby: 종이별 유리병이야. 999개. 하루가 열두 살 겨울에 멈춘 그대로.
    toby: 천 번째 별이 될 종이가 저 근처 어딘가에 있을 거야. 접지 못한 마지막 한 장.
    @emote toby sweat
    toby: …다들, 조금만 서두르자.
    @act bori surprise nowait
    bori: 토비? 왜?
    @act toby shake nowait
    toby: 아무것도 아니야. 태엽이 조금 느려진 것 같아서.
    @act ruru point nowait
    ruru: 근데 저 앞에 틈이 있어. 서랍장이랑 책상 사이가 벌어졌네.
    @bars off
    @goal 마지막 한 장까지 · 연필을 굴려 틈에 다리를 놓자
    @flag ch5_in
  `,
};

export function deskRoom(): RoomDef {
  const room = toyRoom('desk', MAP, {
    name: '책상 위',
    theme: 'factory',
    start: [4, 18],
    music: 'night',
    ambient: [84, 92, 146],
    beams: [
      { x: 14, w: 4, h: 13, slant: 3 },
      { x: 33, w: 4, h: 10, slant: 3 },
    ],
    lights: [
      // 충전 중인 휴대폰 화면 · 유리병에 꺾인 달빛
      { at: [25, 8], r: 46, color: [150, 200, 255], k: 0.35 },
      { at: [35, 5], r: 64, color: [255, 228, 170], k: 0.3 },
    ],
    things: [
      {
        kind: 'keepsake',
        id: 'm5a',
        // 유리병 맨 밑, 유리 너머로 보이는 삐뚤어진 첫 별
        at: [34, 6],
        look: 'paperstar',
        name: '종이별 접는 법',
        caption: '「천 개를 접으면 소원이 하나 이루어진단다」',
        scene: s`
          @room m_room10
          @show haru haru10 3 5 up
          @show gm grandma 5 5 left
          @music grandma
          @sfx paper
          > 하루, 열 살. 할머니가 알록달록한 종이띠를 한 묶음 가져오셨다.
          gm: 하루야, 할머니가 재밌는 거 알려 줄까?
          @face haru gm
          haru: 뭔데?
          @pose gm write
          @sfx fold
          gm: 종이별. 이 띠를 이렇게 묶고… 접고, 또 접고… 그리고 살짝 눌러 주면.
          @sfx pop
          @pose gm idle
          gm: 짠. 별이 되지.
          @emote haru !
          @act haru jump nowait
          haru: 우와! 나도 할래!
          gm: 그래, 할머니 손을 잘 보렴.
          @face haru up
          @pose haru write
          @mini stars
          @pose haru idle
          @act gm clap nowait
          gm: 아이고, 우리 하루 손이 야무지네. 할머니보다 예쁘게 접었구나.
          @face haru gm
          haru: 할머니, 이거 몇 개 접어야 돼?
          gm: 천 개를 접으면 소원이 하나 이루어진단다.
          @act haru surprise nowait
          haru: 진짜? 천 개?
          gm: 그럼. 대신 한 개 한 개 마음을 담아서 접어야 해. 대충 접으면 하늘이 다 알아.
          @act haru think
          haru: 그럼 뭐 빌지…
          @emote haru ?
          @act haru giggle nowait
          haru: 비밀! 천 개 다 접으면 알려 줄게.
          @act gm laugh nowait
          gm: 허허, 그래. 기다리마.
          @wait 1
        `,
        after: s`
          ruru: 할머니가 처음 알려 줬구나, 종이별.
          @act bori think nowait
          bori: 하루 첫 소원은 뭐였을까?
          toby: …천 개 다 접으면 알려 준댔잖아.
        `,
      },
      {
        kind: 'keepsake',
        id: 'm5b',
        // 연필꽂이 속 보라색 털실 자투리 (인형 카디건을 뜨고 남은)
        at: [7, 5],
        look: 'yarn',
        name: '할머니를 닮은 인형',
        caption: '할머니가 손수 만든 태엽 할머니',
        scene: s`
          @room m_gm
          @show gm grandma 3 4 up sit
          @pose gm sew
          @show haru haru10 1 3 down
          @music box
          @sfx sewing
          > 할머니 방에서 재봉틀 소리가 났다. 드르륵, 드르륵.
          @walk haru 6 5 40
          @face haru gm
          haru: 할머니, 뭐 만들어?
          @pose gm sit
          @act gm laugh nowait
          gm: 쉿, 비밀이었는데. 들켰네.
          @face gm haru
          @carry gm doll gdoll5
          gm: 짠. 할머니를 꼭 닮은 인형이란다.
          @emote haru !
          @walk haru 4 5 40
          @face haru gm
          @act haru jump nowait
          haru: 진짜 할머니 같아! 안경도 있고, 머리도 동그랗고!
          gm: 할머니가 바빠서 못 놀아 줄 때 이 인형이 대신 놀아 줄 거야. 토비 태엽도 대신 감아 주고.
          @act haru think nowait
          haru: 인형이 어떻게 태엽을 감아?
          gm: 마음이 있으면 다 할 수 있지. 장난감도, 사람도.
          haru: 그럼 이름은… 태엽 할머니!
          gm: 태엽 할머니? 허허, 그거 좋구나.
          @give gm haru gdoll5
          @sfx hug
          @act gm pat
          gm: 하루야. 할머니가 혹시 멀리 가더라도, 태엽 할머니가 하루랑 토비 곁에 있어 줄 거야.
          @act haru shake nowait
          haru: 할머니가 어딜 가. 할머니는 맨날 여기 있잖아.
          @wait 1
          @act gm nod
          gm: …그래. 맨날 여기 있지.
          @wait 1
        `,
        explore: {
          enter: [9, 9],
          intro: s`
            toby: 할머니 방. 하루가 열 살 때야. 재봉틀 소리가 멈춰 있어.
            nabi: 실은 재봉틀 쪽에서 반짝여. 할머니가 뭘 만들고 계셨는지, 실을 따라가 보자.
          `,
          threads: [
            { at: [4, 4], text: s`
              > 재봉틀 바늘 아래, 회색 털실을 동그랗게 틀어 올린 작은 머리 뭉치.
              bori: 할머니 쪽머리랑 똑같아! 거울 보면서 만드셨나 봐.
            ` },
            { at: [7, 6], text: s`
              > 찻상 위 반짇고리. 까만 단추 두 개가 나란히 놓여 있다. 그 옆에 작은 철사 안경테.
              nabi: 단추는 눈이 될 거야. 할머니는 눈을 제일 오래 고르셨어.
              nabi: …어느 쪽을 바라보게 달까, 하고.
            ` },
            { at: [12, 4], text: s`
              > 장롱 문틈에 보라색 자투리 천. 할머니가 즐겨 입는 카디건과 꼭 같은 색이다.
              ruru: 인형 옷도 똑같은 천으로? …진짜 할머니처럼 만들 작정이었네.
            ` },
          ],
          looks: [
            { at: [1, 4], text: s`
              > 문가에 선 하루. 발뒤꿈치를 들고 몰래 들여다보는 중이다.
              ruru: 숨까지 참고 있어. 어차피 들킬 거면서.
            ` },
            { at: [3, 5], text: s`
              > 재봉틀 앞의 할머니. 안경을 코끝까지 내려 쓰고 있다.
              bori: 저 안경, 하루가 아홉 살 때 깨뜨려서 새로 맞추신 거야.
            ` },
          ],
        },
        after: s`
          toby: 「토비 태엽도 대신 감아 주고.」 …할머니가 그런 말을 했었네.
          @act ruru laugh nowait
          ruru: 인형이 어떻게 태엽을 감아. 하루 말이 맞지.
          @emote nabi …
          bori: 태엽 할머니 손, 실밥이 반들반들했어. 뭘 그렇게 만졌을까.
          ruru: 뜨개바늘이겠지. 할머니 닮았으면.
          nabi: …
        `,
      },
      {
        kind: 'keepsake',
        id: 'm5c',
        // 사탕통 속 도라지 사탕 봉지
        at: [3, 11],
        look: 'honeycandy',
        name: '기침',
        caption: '하루의 소원: 「할머니 감기 낫게 해 주세요」',
        scene: s`
          @room m_room10
          @show haru haru10 3 5 up
          @show gm grandma 5 5 left
          @music grandma
          @pose haru write
          @pose gm write
          @sfx fold
          > 저녁. 둘은 나란히 앉아 별을 접었다.
          @sfx cough
          gm: 콜록, 콜록.
          @emote haru ?
          @pose haru idle
          @face haru gm
          haru: 할머니, 감기야?
          gm: 응, 감기란다. 금방 낫지.
          @sfx cough
          gm: 콜록… 콜록콜록.
          @emote haru …
          @pose haru lookDown
          haru: 할머니 요즘 맨날 기침해.
          gm: 날이 추워서 그래. 걱정 마.
          @wait 1
          @pose haru idle
          @act haru think
          haru: …정했다.
          gm: 응?
          haru: 소원. 천 개 다 접으면 할머니 감기 낫게 해 달라고 빌 거야.
          @wait 1.5
          gm: …우리 하루. 그럼 할머니가 천 개 될 때까지 기다려야겠네.
          @act haru cheer nowait
          haru: 응! 금방 접을게. 일 년이면 돼!
          @pose gm idle
          @walk gm 4 5 30
          @act gm pat 2
          > 할머니는 하루의 머리를 오래오래 쓰다듬었다.
          @wait 1.2
        `,
        explore: {
          enter: [8, 9],
          intro: s`
            toby: 하루 방. 저녁이야. 하루랑 할머니가 나란히 앉아 있어.
            bori: 별 접던 저녁이다. 이때 하루는 맨날 나를 무릎에 앉혀 놨는데.
          `,
          threads: [
            { at: [4, 4], text: s`
              > 책상 위 유리병. 종이별이 바닥에 겨우 한 줌.
              toby: 하루는 일 년이면 된다고 생각했어. …천 개는 생각보다 멀었지.
            ` },
            { at: [8, 3], text: s`
              > 해 지는 창. 유리에 하얗게 김이 서려 있다.
              nabi: 할머니는 날이 추워서 기침이 난다고 하셨어. …창밖은 그렇게 춥지 않았는데.
            ` },
            { at: [6, 5], text: s`
              > 할머니 무릎 위의 손수건. 한 손에 꼭 쥐여 있다.
              ruru: 요즘 할머니 주머니엔 늘 손수건이 있었어. 예전엔 사탕이 있던 자리에.
            ` },
          ],
          looks: [
            { at: [3, 6], text: s`
              > 할머니 쪽으로 몸을 반쯤 돌린 하루. 손가락에 종이띠가 감겨 있다.
              bori: 하루는 별 접을 때도 할머니 얼굴만 봤어. 그래서 자꾸 삐뚤어졌지.
            ` },
            { at: [5, 6], text: s`
              > 하루를 보며 웃는 할머니. 다른 손은 입가로 올라가다 멈춰 있다.
              toby: …기침이 나오려는 거야. 하루 앞에서는 참으려고.
            ` },
          ],
        },
        after: s`
          toby: 그게 하루의 소원이었어. 할머니 감기가 낫는 것.
          ruru: 감기가 아니었잖아.
          @emote ruru anger
          @act ruru stomp nowait
          ruru: 할머니는 나중에 다 알고도 말 안 했잖아! 그랬으면 하루가…
          nabi: 루루.
          ruru: …그랬으면 하루가 그렇게까지 아프진 않았을 거 아냐.
          @wait 1.2
          toby: …모르겠어. 나도.
          @emote ruru …
          @act ruru sigh
        `,
      },
      // ───────── 주민: 깡 장군 (태엽 깡통 병정)
      {
        kind: 'npc',
        id: 'tin',
        at: [23, 10],
        actor: 'tinSoldier',
        dir: 'left',
        scene: s`
          @if seen_tin
            @if code_ok
              @act tin bow nowait
              tin: 충성! 숙제는 끝까지! 종이별도 끝까지!
            @else
              tin: 암호는 하루 일병이 매일 보는 숫자 셋이다. 공책 위 숫자 발판을 맞는 차례로 밟아라!
              nabi: 숫자가 적힌 걸 찾아보자. 달력, 벽에 붙은 시간표, 시험지…
            @end
          @else
            @face tin toby
            @sfx windTick
            @emote tin !
            tin: 정지! 누구냐! 이 너머는 하루 일병의 책상 본진이다!
            @act toby jump nowait
            toby: 깡통 장군님! 저예요, 토비! 장난감 상자 친구들이요.
            tin: …토비 이병? 오랜만이군. 하지만 규칙은 규칙이다. 암호를 대라!
            tin: 암호는 하루 일병이 매일 보는 숫자 셋. 공책 위 숫자 발판을 맞는 차례로 밟아라.
            @act bori think nowait
            bori: 하루가 매일 보는 숫자…?
            tin: 나는 하루 일병이 숙제를 다 할 때까지 자리를 지킨다. 그것이 내 임무다.
            tin: 그런데… 하루 일병은 요즘 숙제를 할 때 나를 보지 않더군. 대신 자꾸 창밖을 본다.
            nabi: 할머니 생각을 하는 거예요.
            @wait 0.6
            tin: …그렇군. 그렇다면 더 잘 지켜야겠군. 충성!
            @goal 마지막 한 장까지 · 깡 장군의 암호를 풀자
          @end
        `,
      },
      {
        kind: 'windup',
        id: 'tinkey',
        at: [23, 11],
        cost: 0.15,
        when: 'seen_tin',
        scene: s`
          > 토비가 깡 장군 등의 태엽 열쇠를 천천히, 세 번 감았다.
          @sfx windTick
          @emote tin ♪
          tin: 오오… 등이 따뜻하다. 몇 해 만인가. 고맙다, 토비 이병!
          @emote toby sweat
          nabi: 토비, 너무 많이 나눠 주면 안 돼.
          toby: 조금이야. 괜찮아.
          @act tin bow nowait
          tin: 답례로 비밀 하나! 암호의 차례는 달력, 시간표, 시험지다. 충성!
        `,
      },
      {
        kind: 'seq',
        id: 'code',
        keys: [
          { at: [15, 9], look: 'numberPad:2', label: '2' },
          { at: [20, 9], look: 'numberPad:6', label: '6' },
          { at: [17, 12], look: 'numberPad:7', label: '7' },
        ],
        order: [2, 0, 1],
        flag: 'code_ok',
        wrong: s`
          @if code_miss1
            @if code_miss2
              @emote tin anger
              tin: 틀렸다! 처음부터!
              @act nabi think nowait
              nabi: 차례가 문제야. 달력, 시간표, 시험지… 장군님 태엽을 감아 드리면 알려 주실지도.
            @else
              @emote tin anger
              tin: 틀렸다! 하루 일병은 숫자를 아무렇게나 보지 않는다!
              @act bori sigh nowait
              bori: 발판이 다시 다 꺼졌어. 처음부터야.
              @flag code_miss2
            @end
          @else
            @emote tin !
            tin: 틀렸다! 암호를 대라!
            @act ruru think nowait
            ruru: 암호? 음… 꿀?
            tin: …그건 보리 장군 시절 암호다! 지금은 아니다! 처음부터!
            @emote bori ♥
            bori: 내가 장군이었어? 암호가 꿀이었고?
            @act ruru giggle nowait
            ruru: 거봐, 반은 맞았잖아.
            @flag code_miss1
          @end
        `,
      },
      // ───────── 주민: 색종이 자매 (접히기를 기다리는 종이띠 묶음)
      {
        kind: 'npc',
        id: 'paper',
        at: [33, 9],
        actor: 'paperSisters',
        dir: 'down',
        scene: s`
          @if folded
            @sfx paper
            > 「접히는 건 간지러워.」 색종이 자매가 바스락거린다. 「그래도 또 와.」
          @else
            @if lamp_on
              @sfx paper
              > 노란 빛 속에서 색종이 자매가 바스락바스락 몸을 떤다. 「눈부셔! 그런데… 저기 봐, 우리 막내.」
              > 고무줄로 따로 묶은 노란 종이띠. 다른 띠보다 조금 길고, 가위 자국이 삐뚤빼뚤하다.
              @wait 1
              @emote toby !
              toby: 이게… 마지막 한 장이야.
              @act ruru think nowait
              ruru: 그럼 우리가 접어 버리면? 천 개 되잖아!
              @act nabi shake nowait
              nabi: 안 돼. 천 번째 별은 하루가 접어야 해. 소원은 접는 사람 거니까.
              bori: 그럼… 연습만 하자. 하루한테 접는 법 다시 보여 줄 수 있게. 다른 색 띠로.
              > 「언니들 띠를 써!」 색종이 자매가 빨강 · 파랑 띠를 하나씩 내밀었다.
              @sfx fold
              @mini stars
              @sfx sparkle
              > 장난감 넷이 매달려 별 하나를 접었다. 조금 삐뚤어졌다.
              @act bori cheer nowait
              bori: 됐다! 우리 별!
              toby: 하루 첫 별도 이렇게 삐뚤었어.
              @flag folded
              @goal 마지막 한 장까지 · 노란 종이띠를 들여다보자
            @else
              @sfx paper
              > 종이띠 묶음 속에서 색종이 자매가 바스락거린다. 「누구야? 우리 접으러 왔어?」
              > 「…그런데 우리 막내는 왜 따로 묶여 있는지 몰라. 노란 애. 저기 어두운 데.」
              nabi: 어두워서 안 보여. 불빛이 있으면 좋을 텐데.
              @act bori point nowait
              bori: 저 스탠드! 켜 보자.
            @end
          @end
        `,
      },
      {
        kind: 'link',
        id: 'l5',
        at: [35, 16],
        name: '인형극 무대',
        icon: 'puppet',
        locked: s`toby: 아직이야. 이 책상 어딘가에 기억이 더 남아 있어.`,
        scene: s`
          @bars on
          > 책상 구석, 종이 상자로 만든 인형극 무대. 빨간 색종이 커튼이 스탠드 불빛에 물들었다.
          @act ruru cheer nowait
          ruru: 토비 극장이다! 하루가 여기 두고 있었네.
          bori: 하루가 여덟 살 때, 할머니랑 매주 토요일마다 했잖아.
          nabi: 그날… 할머니가 우리 이야기를 해 줬어. 우리가 어디서 왔는지.
          @act toby nod nowait
          toby: 노란 띠는 저기 그대로 두자. 하루가 찾을 수 있게.
          @sfx drip
          > 어디선가 톡, 톡. 욕실 수도꼭지 소리.
          @act bori point nowait
          bori: 그 전에 욕실! 아홉 살 하루가 거기서 대본 연습을 했잖아. 비누 거품 수염 붙이고.
          toby: 가자. 웃음소리가 남은 곳부터.
          > 무대 뒤 대본 쪽들이 뒤섞여 있다.
          @mini flip3
          @sfx open
          @flag ch5_done
          @sfx memory
          @fade 1 1.4 white
          @next
        `,
      },
      // ───────── 놀이 1: 연필 다리
      // 밧줄 걸 데가 없는 틈: at 은 손이 닿지 않는 모서리 너머 (연필이 발판에 걸치면 gap_g9pencil)
      { kind: 'gap', id: 'g9pencil', at: [11, 21], tiles: [[11, 7], [12, 7], [11, 8], [12, 8]] },
      // 막다른 곳에 굴렸을 때: 연필을 처음 자리로
      { kind: 'spot', id: 'undoPencil', at: [2, 13], unless: 'gap_g9pencil', scene: s`
        > 지우개 가루가 소복한 자리. 여기서 보면 연필들이 처음 어디 있었는지 다 보인다.
        bori: 연필 셋, 처음 자리로 다시 굴려 놓을까?
        @sfx roll
        @reset pencil1 pencil2 pencil3
        @act bori nod
        bori: 됐다. 다시 해 보자.
      ` },
      { kind: 'push', id: 'pencil1', at: [5, 11], look: 'pencil', roll: true },
      { kind: 'push', id: 'pencil2', at: [8, 14], look: 'pencil:red', roll: true },
      { kind: 'push', id: 'pencil3', at: [3, 16], look: 'pencil:green', roll: true },
      { kind: 'pad', id: 'pencilrest', at: [10, 7], accepts: ['pencil1', 'pencil2', 'pencil3'], flag: 'gap_g9pencil' },
      {
        kind: 'trigger',
        id: 't9crack',
        rect: [7, 4, 4, 16],
        unless: 'gap_g9pencil',
        scene: s`
          @act ruru think nowait
          ruru: 밧줄 걸 데가 없어. 건너편은 반질반질한 공책뿐이라 고리가 안 걸려.
          @act bori point nowait
          bori: 저기 굴러다니는 연필! 연필을 틈 끝까지 굴리면 다리처럼 걸치지 않을까?
          nabi: 연필은 한번 구르면 막힐 때까지 굴러가. 어디서 멈출지 먼저 봐 둬.
        `,
      },
      {
        kind: 'trigger',
        id: 't9bridge',
        rect: [2, 4, 9, 16],
        when: 'gap_g9pencil',
        scene: s`
          @sfx thud
          > 데구루루… 연필이 틈 가장자리에 턱 걸치며 멈췄다. 연필 끝이 건너편 공책에 닿았다.
          @act ruru clap nowait
          ruru: 다리 완성! 연필 다리!
          @act bori hop nowait
          bori: 내가 굴렸어. 내가.
          @goal 마지막 한 장까지 · 공책 들판을 건너자
        `,
      },
      // ───────── 놀이 2: 깡 장군의 길목
      {
        kind: 'trigger',
        id: 't9guard',
        rect: [24, 10, 3, 2],
        unless: 'code_ok',
        repeat: true,
        scene: s`
          @emote tin !
          @sfx windTick
          tin: 정지! 암호 없이는 한 발짝도 못 지나간다!
          @walk toby 22 10.5
        `,
      },
      {
        kind: 'trigger',
        id: 't9code',
        rect: [13, 8, 10, 6],
        when: 'code_ok',
        scene: s`
          @sfx chime
          @emote tin !
          tin: …암호 확인! 칠, 이, 육! 통과를 허락한다!
          @act tin bow nowait
          tin: 하루 일병의 별을 지켜 다오. 나는 여기서 숙제를 지키겠다. 충성!
          @act ruru cheer nowait
          ruru: 해냈다!
          nabi: 저 안쪽에 스탠드가 있어. 불을 켜면 유리병 근처가 보일 거야.
          @goal 마지막 한 장까지 · 스탠드를 켜자
        `,
      },
      // ───────── 놀이 3: 지우개 계단 · 스탠드
      // 지우개를 엉뚱한 데로 밀었을 때: 처음 자리로
      { kind: 'spot', id: 'undoEraser', at: [36, 12], unless: 'lamp_on', scene: s`
        > 지우개 가루 자국이 길게 나 있다. 지우개가 어디서부터 밀려 왔는지 보인다.
        bori: 지우개를 처음 자리로 돌려놓을까?
        @sfx boxDrag
        @reset erBig erSmall
        @act bori nod
      ` },
      { kind: 'push', id: 'erBig', at: [29, 10], look: 'eraser:big', weight: 2 },
      { kind: 'pad', id: 'erBigRest', at: [29, 7], accepts: ['erBig'], flag: 'er_big' },
      { kind: 'climb', id: 'c9pile', at: [28, 8], to: [28, 6], when: 'er_big' },
      { kind: 'push', id: 'erSmall', at: [29, 5], look: 'eraser:small' },
      { kind: 'pad', id: 'erSmallRest', at: [30, 5], accepts: ['erSmall'], flag: 'er_small' },
      { kind: 'climb', id: 'c9lamp', at: [28, 5], to: [31, 5], when: 'er_small' },
      {
        kind: 'trigger',
        id: 't9stair',
        rect: [27, 8, 6, 4],
        unless: 'er_big',
        scene: s`
          @act bori think nowait
          bori: 스탠드 받침이 너무 높아. 책 더미를 밟고 올라가야겠어.
          nabi: 저 지우개들, 계단으로 쓰면 되겠다. 큰 것부터 책 더미 앞에. 그다음 작은 것.
          ruru: 큰 지우개는 무거워 보이는데. 다 같이 밀자.
        `,
      },
      {
        kind: 'trigger',
        id: 't9step',
        rect: [27, 5, 4, 2],
        when: 'er_small',
        scene: s`
          @act ruru cheer nowait
          ruru: 계단 완성! 이제 스탠드 받침 위로!
          @if with_bori
          @else
            @act bori hop nowait
            bori: 아, 잠깐! 나도 같이 올라갈래. 저 스위치, 왠지 내가 필요할 것 같아.
            @call bori
          @end
        `,
      },
      {
        kind: 'spot',
        id: 'lampbtn',
        at: [32, 4],
        scene: s`
          @if lamp_on
            > 스탠드 불빛이 노랗게 책상을 덮고 있다. 받침이 아직 따뜻하다.
          @else
            > 스탠드 받침 위 둥근 스위치. 토비가 눌러도, 루루가 뛰어도 꿈쩍하지 않는다.
            @act ruru stomp nowait
            ruru: 이거 고장 난 거 아니야?
            @call bori
            @act bori stretch
            bori: 비켜 봐. 이런 건… 무게로 하는 거야.
            @act bori jump
            @sfx switch
            @shake 0.3
            > 보리가 엉덩이로 털썩. 딸깍!
            @prop lampBase on
            @flag lamp_on
            @act ruru laugh nowait
            ruru: 엉덩방아 스위치! 하하하!
            bori: 웃지 마. 이것도 기술이야.
            > 노란 원뿔 빛이 쏟아진다. 유리병 옆 종이띠 묶음 사이에서 노란 띠 하나가 반짝 빛났다.
            nabi: 저기… 노란 띠만 따로 묶여 있어.
            @goal 마지막 한 장까지 · 노란 종이띠에게 가 보자
          @end
        `,
      },
      // ───────── 살펴보기: 암호의 숫자들
      {
        kind: 'spot',
        id: 'desk_cal',
        at: [15, 4],
        scene: s`
          > 탁상 달력. 오늘 날짜 「7」에 빨간 동그라미, 그 아래 「이사」.
          @act ruru point nowait
          ruru: 칠! 숫자 하나 찾았다.
          nabi: 오늘이 이삿날이구나. …벌써 새벽이니까.
        `,
      },
      {
        kind: 'spot',
        id: 'desk_timetable',
        at: [19, 3],
        scene: s`
          > 벽에 붙은 시간표. 「수요일 2교시 · 미술」 칸에만 연필로 작은 별이 그려져 있다.
          bori: 둘째 시간에 별표. 하루는 미술 시간을 제일 좋아했어.
          toby: 별 접는 손이니까.
        `,
      },
      {
        kind: 'spot',
        id: 'desk_tests',
        at: [23, 3],
        scene: s`
          @sfx paper
          > 시험지 더미. 맨 위에 빨간 색연필로 크게 「60」. 열 살 때 시험지가 맨 위에 올라와 있다.
          ruru: 육십 점! 암호에 쓰는 건 앞자리 「6」이겠지?
          @act nabi shrug nowait
          nabi: 하루는 이걸 버리지 않았어. 맨 위에 둘 만큼.
        `,
      },
      {
        kind: 'spot',
        id: 'desk_phone',
        at: [23, 7],
        scene: s`
          > 충전 중인 휴대폰. 화면 귀퉁이에 「01:30」. 알림 하나. 「지우: 몇 시에 가? 모퉁이에 있을게」
          > 그 밑 입력칸에, 쓰다 만 두 글자. 「오지」
          nabi: 「오지 마」라고 쓰다가 멈췄네.
          ruru: 「오지」에서 멈췄으면… 「오지 마」야, 「와 줘」야?
          toby: …하루도 모르는 것 같아.
        `,
      },
      // ───────── 살펴보기
      {
        kind: 'spot',
        id: 'homework',
        at: [19, 12],
        scene: s`
          > 펼쳐진 공책 들판. 귀퉁이에 낙서가 있다. 토끼, 곰, 여우, 고양이.
          @act bori jump nowait
          bori: 우리다!
          @act ruru stomp nowait
          ruru: 내 꼬리가 너무 짧게 그려졌는데.
          @act nabi shrug nowait
          nabi: 나는 예쁘게 그렸네. 역시 하루는 보는 눈이 있어.
        `,
      },
      {
        kind: 'spot',
        id: 'diary',
        at: [7, 10],
        scene: s`
          > 「일기장」. 자물쇠가 잠겨 있다.
          @act ruru giggle nowait
          ruru: 열어 볼까?
          nabi: 루루.
          @act ruru shrug nowait
          ruru: 농담이야, 농담.
        `,
      },
      {
        kind: 'spot',
        id: 'sticker',
        at: [14, 14],
        scene: s`
          > 책상에 붙은 별 스티커. 「참 잘했어요」.
          bori: 할머니가 하루 숙제 다 하면 붙여 주던 스티커야.
        `,
      },
      {
        kind: 'spot',
        id: 'desk_milk',
        at: [7, 6],
        scene: s`
          > 반쯤 마신 우유갑. 빨대가 꽂힌 채 식어 있다.
          @act bori think nowait
          bori: 하루는 밤새 숙제할 때 꼭 우유를 마셨어. 할머니가 데워 주던 거.
          ruru: 오늘은 식은 거네.
        `,
      },
      {
        kind: 'spot',
        id: 'desk_jar',
        at: [35, 7],
        scene: s`
          > 거대한 유리 기둥 같은 종이별 유리병. 달빛이 유리에 꺾여 책상 위에 무지개 얼룩을 떨군다.
          toby: 999개. 하루는 이 병을 이삿짐 상자에 넣지 않았어.
          nabi: 넣지도, 버리지도 못한 거야.
        `,
      },
      { kind: 'star', id: 's5a', at: [2, 8], text: '책등 아래, 지우개 가루 속의 종이별.' },
      { kind: 'star', id: 's5b', at: [21, 17], text: '자 눈금 옆에 떨어진 종이별.' },
      { kind: 'star', id: 's5c', at: [37, 13], text: '책상 모서리 끝에 아슬아슬 걸린 종이별.' },
      { kind: 'star', id: 's5d', at: [9, 18], text: '연필밥 더미에 묻혀 있던 반짝이 종이별.' },
    ],
  });
  return {
    ...room,
    furniture: FURNITURE,
    elev: elevRows(),
    abyss: 'roomFloor',
    keepProps: [{ key: 'lampBase@31,4', flag: 'lamp_on', state: 'on' }],
    // 다른 파일(more*.ts)에서 들어오는 기억 → 책상 위 물건
    hangouts: {
      bori: { at: [9, 16], pose: 'chinRest', dir: 'up', talk: s`
        @act bori lookAround nowait
        bori: 연필이 통나무만 해. 이걸 굴리려면 아무래도 내가 있어야겠지?
        bori: 굴릴 거 있으면 불러, 토비.
      ` },
      ruru: { at: [10, 10], dir: 'right', talk: s`
        @act ruru peek nowait
        ruru: 틈 아래 봤어? 까마득해. …좀 재밌겠다.
        ruru: 건너편 가면 불러. 내가 제일 먼저 가 볼 거야.
      ` },
      nabi: { at: [5, 8], pose: 'sleepSit', dir: 'down', talk: s`
        @act nabi stretch nowait
        nabi: 여기 달빛이 제일 잘 들어. …조금만 쉴게.
        nabi: 급하면 불러. 네 태엽 소리, 여기서도 다 들리니까.
      ` },
    },
    keepsakes: {
      m5d: { at: [36, 6], look: 'paperstar' },
      m5e: { at: [2, 4], look: 'photo' },
      m5f: { at: [23, 5], look: 'testPapers:60' },
      m5g: { at: [37, 8], look: 'paperStrips', when: 'folded' },
    },
  };
}

/** 막 기억 사슬 (ACTS.md 막별 표): 이 방의 단계 차례 — 비어 있으면 사슬 없음 */
export const DESK_CHAIN: ChainStep[] = [];
