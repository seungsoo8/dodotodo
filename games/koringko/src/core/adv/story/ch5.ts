/**
 * 5장 · 책상 위 (근접 지도) — 10살, 할머니가 종이별 접기를 알려 준 날.
 * 장난감 눈높이로 본 거대한 책상: 연필은 통나무, 지우개는 계단, 공책은 흰 들판, 모서리 너머는 아득한 방바닥.
 *
 * 5막의 둘째 방 (책가방에서 「책상 위로」 문으로 올라온다). 놀이는 없다: 자 다리 · 지우개 계단 · 깡 장군 길목은
 * 늘 놓여 있고 (acts.ts preset), 기억 사슬(DESK_CHAIN)을 따라 유리병 → 시험지 → 사진 → 꿀사탕 → 털실 → 노란 종이띠로 간다.
 * 노란 띠 앞에서 색종이 자매와 별 하나를 접어 보고(@mini stars, folded) → 천 장 하고 한 장(m5g) → 인형극 무대(l5, flip2 · 막간 ②).
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
  // 서랍장과 책상 사이 틈 (나무 자 다리)
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
    @title 책상 위 | 01:30
    @wind 0.5
    @bars on
    @music night
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
    ruru: 저 앞에 틈! …아, 나무 자 하나가 걸쳐 있네. 다리다.
    @bars off
    @goal 천 번째 별에, 하루는 무엇을 빌려고 했을까?
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
        // 유리병 맨 밑, 유리 너머로 보이는 삐뚤어진 첫 별 (책가방에서 올라오면 사슬 첫 단계)
        at: [34, 6],
        when: 'door_d_bag_desk',
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
        when: 'mem_m5c',
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
        when: 'mem_m5e',
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
      // ───────── 주민: 깡 장군 (태엽 깡통 병정) — 하루 일병의 책상 본진을 지킨다
      {
        kind: 'npc',
        id: 'tin',
        at: [23, 10],
        actor: 'tinSoldier',
        dir: 'left',
        scene: s`
          @if met_tin
            @act tin bow nowait
            tin: 충성! 숙제는 끝까지! 종이별도 끝까지!
          @else
            @face tin toby
            @sfx windTick
            @emote tin !
            tin: 정지! 누구냐! 이 너머는 하루 일병의 책상 본진이다!
            @act toby jump nowait
            toby: 깡통 장군님! 저예요, 토비! 장난감 상자 친구들이요.
            tin: …토비 이병? 오랜만이군. 오늘 밤은 특별히 통과를 허락한다.
            tin: 나는 하루 일병이 숙제를 다 할 때까지 자리를 지킨다. 그것이 내 임무다.
            tin: 그런데… 하루 일병은 요즘 숙제를 할 때 나를 보지 않더군. 대신 자꾸 창밖을 본다.
            nabi: 할머니 생각을 하는 거예요.
            @wait 0.6
            tin: …그렇군. 그렇다면 더 잘 지켜야겠군. 충성!
            @flag met_tin
          @end
        `,
      },
      // ───────── 주민: 색종이 자매 (접히기를 기다리는 종이띠 묶음)
      {
        kind: 'npc',
        id: 'paper',
        at: [33, 9],
        when: 'mem_m5b',
        actor: 'paperSisters',
        dir: 'down',
        scene: s`
          @if folded
            @sfx paper
            > 「접히는 건 간지러워.」 색종이 자매가 바스락거린다. 「그래도 또 와.」
          @else
            @if lamp_on
            @else
              @sfx paper
              > 종이띠 묶음 속에서 색종이 자매가 바스락거린다. 「누구야? 우리 접으러 왔어?」
              nabi: 어두워서 안 보여.
              @act bori point nowait
              bori: 저 스탠드! 내가 켤게.
              @act bori jump
              @sfx switch
              @prop lampBase on
              @flag lamp_on
              > 스탠드 받침 위로 기어오른 보리가 엉덩이로 털썩. 딸깍!
            @end
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
          @mini flip2
          @sfx open
          @flag ch5_done
          @fade 1 1
          @room h_attic
          @music none
          @item ibox boxTaped 8 5
          @fade 0 1.2
          > 다락방. 테이프를 붙인 상자 안.
          doll: 토비 녀석, 잘 걷고 있으려나.
          @sfx windTick
          > 끼…릭.
          @wait 1.5
          > 그리고 한참 동안, 아무 소리도 나지 않았다.
          @fade 1 1.2
          @sfx memory
          @fade 1 1.4 white
          @next
        `,
      },
      // ───────── 자 다리 · 깡 장군의 길목 · 지우개 계단 (늘 놓여 있다: acts.ts preset)
      // 밧줄 걸 데가 없는 틈: at 은 손이 닿지 않는 모서리 너머, 나무 자가 걸쳐 있어 다리가 된다
      { kind: 'gap', id: 'g9pencil', at: [11, 21], tiles: [[11, 7], [12, 7], [11, 8], [12, 8]] },
      // 루루 밧줄을 타고 책가방으로 되돌아가는 문 (올라온 자리 바로 아래)
      { kind: 'door', id: 'd_desk_bag', at: [3, 19], rect: [2, 19, 3, 1], to: 'schoolbag', arrive: [6, 6], dir: 'down' },
      {
        kind: 'trigger',
        id: 't9bridge',
        rect: [7, 4, 4, 16],
        when: 'gap_g9pencil',
        scene: s`
          > 틈 위에 나무 자 하나가 턱 걸쳐 있다. 자 끝이 건너편 공책에 닿았다.
          @act ruru clap nowait
          ruru: 자 다리! 하루가 걸쳐 놓고 잊어버렸나 봐.
          @act bori hop nowait
          bori: 하루는 숙제하기 싫을 때 자로 책상 틈을 재곤 했어. 몇 센티 벌어졌나.
        `,
      },
      {
        kind: 'trigger',
        id: 't9code',
        rect: [13, 8, 10, 6],
        when: 'code_ok',
        scene: s`
          > 자 차단기가 들려 있다. 깡 장군이 길목 옆에서 꼿꼿이 경례한다.
          @act ruru cheer nowait
          ruru: 통과! 장군님, 오늘은 너그러우시네.
          nabi: 저 안쪽에 스탠드가 있어. 유리병 근처가 제일 어두워.
        `,
      },
      { kind: 'climb', id: 'c9pile', at: [28, 8], to: [28, 6] },
      { kind: 'climb', id: 'c9lamp', at: [28, 5], to: [31, 5] },
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
          ruru: 이사라고 쓴 글씨가 제일 작아. 쓰기 싫었나 봐.
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
          ruru: 육십 점! 하루는 이런 걸 맨 위에 두는 애가 아닌데.
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
        bori: 연필이 통나무만 해. 하루는 이 책상에서 별 접을 때 나를 무릎에 앉혔어.
        bori: 삐뚤어진 별이 나올 때마다 내 귀에 대고 「쉿」 했지.
      ` },
      ruru: { at: [10, 10], dir: 'right', talk: s`
        @act ruru peek nowait
        ruru: 틈 아래 봤어? 까마득해. …좀 재밌겠다.
        ruru: 구백구십구 개. 나 같으면 하나 더 접고 말았을 텐데. 하루는 왜 멈췄을까.
      ` },
      nabi: { at: [5, 8], pose: 'sleepSit', dir: 'down', talk: s`
        @act nabi stretch nowait
        nabi: 여기 달빛이 제일 잘 들어. 할머니는 이 빛에 기대서 하루 별을 세셨어.
        nabi: 백 개 될 때마다 「백 개!」 하고 박수를. …토비, 네 태엽 소리가 느려졌어.
      ` },
    },
    // 기억 사슬 차례대로 하나씩 드러난다 (DESK_CHAIN)
    keepsakes: {
      m5d: { at: [36, 6], look: 'paperstar', when: 'mem_m5a' },
      m5e: { at: [2, 4], look: 'photo', when: 'mem_m5f' },
      m5f: { at: [23, 5], look: 'testPapers:60', when: 'mem_m5d' },
      m5g: { at: [37, 8], look: 'paperStrips', when: 'folded' },
    },
  };
}

/** 5막 기억 사슬 (책상 위): 유리병의 첫 별 → 백 개 → 시험지 → 숨바꼭질 → 기침 → 태엽 할머니 → 노란 종이띠 → 천 장 하고 한 장 */
export const DESK_CHAIN: ChainStep[] = [
  { id: 'm5a', gate: 'door_d_bag_desk', bridge: '첫 별이 유리병 바닥에 떨어졌다. 그 옆, 백 개쯤 쌓인 자리.' },
  { id: 'm5d', bridge: '「천 개 되면.」 별 무더기 아래 시험지 한 장, 빨간 비 표시.' },
  { id: 'm5f', bridge: '시험지를 접던 손이 멈췄다. 저쪽 사진 속, 장롱 뒤의 할머니.' },
  { id: 'm5e', bridge: '숨바꼭질은 기침 소리로 끝났다. 책상 모서리에 꿀사탕 하나.' },
  { id: 'm5c', bridge: '꿀사탕 껍질 옆, 털실 한 올이 연필꽂이까지 이어진다.' },
  { id: 'm5b', bridge: '털실 끝, 스탠드 아래에 접히지 않은 노란 종이띠 하나.' },
  { id: 'paper' },
  { id: 'm5g', gate: 'folded', bridge: '노란 종이 묶음 아래, 인형극 무대의 커튼 끈이 늘어져 있다.' },
];
