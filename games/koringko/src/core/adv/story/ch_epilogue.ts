/** 에필로그 · 새 방 (15살, 새집의 첫 겨울) — 다시 걷게 된 장난감들이 새집에서 쌓인 기억을 본다. 사람 크기 새 방 (houseMap), 첫눈 오는 낮 */
import { s } from '../parse.ts';
import type { Chapter, Cmd, RoomDef } from '../types.ts';
import { houseMap } from './kit.ts';
import { NEW, NEW_AMB, newRoomSpec } from './layout_a.ts';

/*
 * 새 하루 방 (22×15, 배치는 layout_a.ts newRoomSpec)
 *   (5~6,9) 「가져온 짐」 상자: 보리 · 루루와 테이프를 두 번 당겨 푼다 (5,10)
 *   (6~7,3) 선반 (장난감 자리 다섯): 동료들이 바라는 자리를 듣고 (자기 자리에서 처음 말을 걸면) 정해 준다 (6,4)
 *   (8~14,8~11) 러그 위 야광 별 일곱: 하루가 그린 북두칠성 도안대로 손잡이 끝부터 국자 끝까지
 *   (11,4) 창가의 「하루가 웃은 날」 새 유리병 → 크레디트
 */
const SPEC = newRoomSpec();

/** 북두칠성: 손잡이 끝 (요광) → 국자 끝 (천추) 차례 */
const DIPPER: readonly (readonly [number, number])[] = [[8, 9], [9, 9], [10, 10], [11, 10], [11, 11], [13, 11], [13, 10]];

/** 선반 자리 하나 묻기: 맞히면 place_<누구>, 틀리면 웃긴 한마디 (고른 깃발은 지워서 다시 물을 수 있게) */
function seat(who: 'bori' | 'ruru' | 'nabi', q: string, right: number, yes: Cmd[], no: Cmd[]): Cmd[] {
  const options = ['창가 칸 (햇빛)', '하루 침대가 보이는 칸', '문 쪽 칸 (부엌 냄새)', '맨 위 칸'];
  return [
    {
      t: 'if',
      flag: `place_${who}`,
      then: [],
      else: [
        { t: 'say', who: '', text: `${who === 'bori' ? '보리' : who === 'ruru' ? '루루' : '나비'} 자리는 어디로 할까?` },
        { t: 'choice', flag: q, options },
        { t: 'if', flag: `${q}_${right}`, then: [...yes, { t: 'flag', name: `place_${who}` }], else: no },
        ...options.map((_, i): Cmd => ({ t: 'flag', name: `${q}_${i}`, v: false })),
      ],
    },
  ];
}

const SHELF = [
  ...s`
    @if placed_all
      > 선반 칸마다 하루 글씨 이름표가 붙어 있다. 토비, 보리, 루루, 나비, 할머니.
      doll: 다들 제자리를 찾았구나.
    @else
      > 새 선반. 칸이 다섯이다. 맨 아래 창가 칸에는 벌써 토비 이름표가 붙어 있다.
      toby: 내 자리는 창가야. 햇빛이 제일 먼저 드는 데. 할머니 자리는 그 옆.
    @end
  `,
  ...seat('bori', 'seat_b', 2, s`bori: 킁킁… 미역국 냄새! 여기야, 여기!`, s`bori: 여긴… 배가 덜 고플 것 같아. 다른 데 없어?`),
  ...seat('nabi', 'seat_n', 1, s`nabi: …응. 여기면 하루 자는 얼굴이 보여.`, s`nabi: 고양이는 아무 데나 안 앉아. 다시.`),
  ...seat('ruru', 'seat_r', 3, s`ruru: 맨 위! 다 내려다보인다! 대장 자리야!`, s`ruru: 에이, 여긴 너무 낮아. 루루 님은 높은 데가 좋다고.`),
  ...s`
    @if place_bori
    @if place_nabi
    @if place_ruru
    @if placed_all
    @else
      @sfx chime
      > 다섯 칸이 다 찼다. 하루가 아침에 보면 그대로 놓아 줄 것이다.
      @flag placed_all
      @goal 하루의 천장에 야광 별을 붙이자 — 하루가 그린 북두칠성 차례대로
    @end
    @end
    @end
    @end
  `,
];

export const EPILOGUE: Chapter = {
  n: 0,
  title: '에필로그 · 새 방',
  sub: '15살, 새집의 첫 겨울',
  room: 'newroom_toy',
  start: [NEW.start[0], NEW.start[1]],
  party: ['toby', 'bori', 'ruru', 'nabi'],
  wind: 1,
  intro: s`
    @fade 1 0 white
    @bars on
    @music hope
    @chtitle
    @fade 0 2.5
    > 몇 주 뒤. 새집, 하루의 방. 창밖에 첫눈이 내린다.
    @sfx windTick
    @wait 0.5
    @emote toby !
    @act toby jump
    toby: …움직여. 태엽이 가득 차 있어!
    bori: 하루가 오늘 아침에도 감아 줬어. 하나, 둘, 셋.
    @act ruru cheer nowait
    ruru: 매일 세 번! 하루도 안 빼먹었어!
    @act nabi nod nowait
    nabi: 그래서 우리가 이렇게 밤마다 깨어나는 거지.
    @face toby doll
    doll: 다들 잘 잤니.
    toby: 태엽 할머니!
    @act doll laugh nowait
    doll: 하루가 내 태엽도 매일 감아 준단다. 이 할머니, 덕분에 아직 한참 남았어.
    @emote ruru ♥
    doll: 이 방에도 벌써 기억이 쌓였단다. 몇 주 사이에. 보러 가렴.
    @act toby think
    toby: 이번엔… 슬픈 기억이 아니었으면 좋겠다.
    bori: 나는 맛있는 기억이었으면 좋겠다.
    @act ruru giggle nowait
    ruru: 돌아왔네, 보리.
    doll: 직접 보렴.
    @bars off
    @goal 새 방에서, 우리 각자의 자리를 찾자
  `,
};

export function newroomToyRoom(): RoomDef {
  const r = houseMap({
    ...SPEC,
    id: 'newroom_toy',
    name: '새 방',
    things: [
      { kind: 'npc', id: 'doll', at: [8, 4], actor: 'grandoll', dir: 'down', scene: s`
        doll: 하루가 요즘 할머니 얘기를 자주 한단다. 웃으면서.
        doll: 슬픔을 천천히 풀고 있는 거야. 태엽처럼.
      ` },
      // ── 놀이 1 · 상자 풀기: 「가져온 짐」 테이프를 보리 · 루루와 두 번 당긴다
      {
        kind: 'trigger',
        id: 'box_hint',
        rect: [3, 9, 5, 3],
        unless: 'unpacked',
        scene: s`
          > 테이프로 꽁꽁 감은 상자. 옆구리에 하루 글씨. 「가져온 짐」.
          @act ruru hop nowait
          ruru: 우리가 이 안에 실려 왔잖아! 테이프 자락에 내 밧줄을 걸고, 보리가 같이 당기면 돼.
          @goal 「가져온 짐」 상자를 풀자 — 보리 · 루루와 같이 테이프를 당겨서
        `,
      },
      {
        kind: 'pull',
        id: 'unpack',
        at: [5, 10],
        look: 'tape',
        need: ['bori', 'ruru'],
        tugs: 2,
        flag: 'unpacked',
        scene: s`
          @sfx tapeRip
          > 찌이익— 테이프가 뜯기고, 상자 덮개가 벌어진다. 맨 위에 하루가 접어 넣은 쪽지 한 장. 「가져온 짐 — 하나도 두고 오지 않음」.
          @emote toby …
          toby: …하나도.
          @goal 선반에 각자의 자리를 정하자 — 다들 바라는 자리를 들어 보고
        `,
      },
      // ── 놀이 2 · 자리 정하기: 선반 칸 다섯 (토비 · 할머니 자리는 이미, 보리 · 나비 · 루루를 정한다)
      { kind: 'spot', id: 'shelf_place', at: [6, 4], when: 'unpacked', scene: SHELF },
      // ── 놀이 3 · 야광 별 북두칠성: 러그 위 별 도안을 손잡이 끝부터 차례로 밟아 붙인다
      {
        kind: 'spot',
        id: 'dipper_plan',
        at: [9, 8],
        scene: s`
          > 러그 위에 펼친 도화지. 하루 글씨로 「천장 별자리」. 국자 모양 일곱 개 점에 화살표가 이어져 있다.
          > 손잡이 끝에서 시작해, 국자 바닥을 돌아, 국자 끝에서 끝난다.
          nabi: 별 스티커를 이 차례대로 붙이면 돼. 어두워지면 빛날 거야.
        `,
      },
      {
        kind: 'seq',
        id: 'dipper',
        keys: DIPPER.map((at) => ({ at, look: 'glowStar' })),
        order: [0, 1, 2, 3, 4, 5, 6],
        flag: 'dipper_done',
        wrong: s`ruru: 어, 그 별 아니야. 손잡이 끝부터 다시!`,
      },
      {
        kind: 'trigger',
        id: 'dipper_lit',
        rect: [7, 8, 8, 4],
        when: 'dipper_done',
        scene: s`
          @sfx sparkle
          > 일곱 개의 별이 한꺼번에 연둣빛으로 빛났다. 국자 모양. 할머니 방 천장에 있던 것과 똑같다.
          @act ruru cheer nowait
          ruru: 북두칠성!
          @goal 창가의 「하루가 웃은 날」 유리병에게 가자
        `,
      },
      {
        kind: 'memory',
        id: 'mEPa',
        at: [5, 4],
        name: '가져온 짐',
        caption: '「가져온 짐」 상자에서 친구들이 나왔다',
        scene: s`
          @room h_newroom
          @show haru haru15 6 6 up
          @show mom mom 11 7 left
          @item ebox boxKeep 6 5
          @music piano
          > 이사 온 첫날 밤. 하루가 「가져온 짐」 상자를 연다.
          @pose haru kneel
          @sfx tapeRip
          @wait 0.4
          @sfx cardboard
          @item ebox boxOpen
          @pose haru idle
          @item etoby toby 6 5
          @take haru etoby
          > 토비, 보리, 루루, 나비, 그리고 태엽 할머니. 하나씩 선반에 앉힌다.
          mom: 하루야, 그 상자 두고 온다더니.
          @act haru shrug nowait
          haru: …마음 바뀌었어.
          @act mom nod nowait
          mom: 잘했어.
          @walk haru 9 4 30
          @face haru up
          @carry haru none
          @sfx put
          haru: 토비는 창가. 햇빛 제일 잘 드는 데.
          @item edoll doll 6 5
          @walk haru 6 6 30
          @face haru up
          @take haru edoll
          @walk haru 9 4 30
          @face haru up
          @carry haru none
          @sfx put
          haru: 할머니 인형은 그 옆. 둘이 같이 있어야 하니까.
          @act haru nod
          @emote mom ♥
          @wait 1.2
        `,
        after: s`
          ruru: 우리가 선반에 나란히 앉은 날이야!
          bori: 창가 자리. 하루가 직접 골라 줬어.
          toby: 「두고 가는 짐」이 「가져온 짐」이 된 날.
        `,
      },
      {
        kind: 'memory',
        id: 'mEPb',
        at: [8, 12],
        name: '할머니 맛',
        caption: '할머니에게 배운 미역국, 마음을 한 숟갈',
        scene: s`
          @room m_kitchen_n
          @show mom mom 8 4 down
          @show haru haru15 6 6 right
          @music waltz
          > 할머니 생신. 올해는 하루가 먼저 부엌에 왔다.
          > 엄마 머리에 빨간 동백꽃 머리핀이 꽂혀 있다.
          haru: 엄마. 올해 미역국은… 내가 끓여도 돼?
          mom: 하루가? 할 줄 알아?
          @act haru laugh nowait
          haru: 할머니가 알려 줬어. 열한 살 때. 그때는 엄청 짜게 만들었지만.
          @walk haru 5 6 30
          @walk haru 5 3 30
          @walk haru 12 3 30
          @walk haru 12 4 30
          @face haru up
          @sfx faucet
          @pose haru cook
          @sfx chop
          @wait 0.4
          @sfx sizzle
          > 참기름에 고기를 달달 볶고, 불린 미역을 넣고, 물을 붓는다.
          @sfx pour
          haru: 그리고 마지막에… 마음을 한 숟갈.
          @emote mom !
          @act mom surprise nowait
          mom: 그거… 할머니가 엄마한테도 하던 말인데.
          @wait 1
          @sfx bubbles
          > 보글보글. 부엌에 고소한 냄새가 퍼진다.
          @pose haru idle
          @sfx dish
          @carry haru bowl kbowl
          @sfx slurp
          @emote haru …
          haru: …아직 할머니 맛은 아니야.
          haru: 그래도 비슷해. 아주 조금.
          @walk mom 11 4 30
          @face mom haru
          @face haru mom
          @give haru mom kbowl
          @sfx slurp
          @act mom nod
          mom: 엄마도 처음엔 할머니 맛이 안 났어. 몇 년 걸렸어.
          haru: 그럼 몇 년 끓이면 되겠네.
          @act mom laugh nowait
          @wait 1
          > 엄마가 한 숟갈 더 떴다. 그리고 숟가락을 내려놓고, 고개를 숙였다.
          haru: …엄마. 짜?
          @wait 1.2
          mom(tear): …응. 짜서.
          > 하루는 아무 말 없이 휴지 한 장을 건넸다. 그리고 엄마 옆에 앉아, 자기 국을 마저 먹었다.
          haru: 응. 짠 거 때문이야.
          @wait 1.5
        `,
        explore: {
          enter: [2, 9],
          intro: s`
            toby: 새집 부엌. 할머니 생신날 저녁이야.
            ruru: 이제 익숙하지? 실 찾자, 실! 이번엔 맛있는 냄새 나는 실로.
          `,
          threads: [
            { at: [12, 4], text: s`
              > 도마 위에 불린 미역. 옆에 참기름 병, 뚜껑이 열려 있다.
              @emote bori ♥
              bori: 킁킁. 기억 속인데 냄새가 나. 고소한 냄새.
            ` },
            { at: [4, 3], text: s`
              > 창문에 붙은 메모지. 하루 글씨. 「참기름 → 고기 → 미역 → 물 → 마음 한 숟갈」.
              ruru: 마지막 재료가 제일 어렵겠다. 계량컵이 없잖아.
              nabi: 그건 재는 게 아니라, 넣는 사람이 아는 거야.
            ` },
            { at: [15, 3], text: s`
              > 벽시계 아래 달력. 오늘 날짜에 동그라미, 그리고 「할머니 생신」.
              toby: 작년엔 이 날, 하루가 혼자 식은 미역국을 먹었어.
              toby: 올해는 동그라미를 자기 손으로 그렸네.
            ` },
          ],
          looks: [
            { at: [6, 7], text: s`
              > 하루. 앞치마 끈을 두 번이나 고쳐 맸다.
              ruru: 긴장했네. 시험 볼 때보다 더.
            ` },
            { at: [8, 3], text: s`
              > 엄마. 하루 몰래 숟가락을 하나 더 꺼내 놓았다.
              nabi: 맛보려고? …아니면, 할머니 몫일지도.
            ` },
          ],
        },
        after: s`
          bori: 미역국 냄새가 여기까지 났었어. 나 그날 엄청 배고팠어.
          nabi: 작년엔 혼자 몰래 식은 걸 먹었잖아. 올해는 자기가 끓여서, 엄마랑 같이.
          ruru: 열한 살 때 그 짠 미역국! 그게 연습이었구나.
          toby: 몇 년 끓이면 된대. 하루는 이제 "몇 년"을 말할 수 있어.
        `,
      },
      {
        kind: 'memory',
        id: 'mEPc',
        at: [16, 4],
        name: '나머지 반',
        caption: '반은 할머니의 코, 반은 하루의 삐뚤빼뚤한 코',
        scene: s`
          @room h_newroom
          @show haru haru15 5 6 right sit
          @show mom mom 7 6 left sit
          @item escarf scarf 6 6
          @pose haru knit
          @pose mom knit
          @music box
          > 밤. 하루와 엄마가 노란 털실을 사이에 두고 앉았다.
          @sfx knit
          mom: 바늘을 이렇게 걸고, 실을 감고, 빼고.
          @sfx knit
          haru: 걸고, 감고…
          @act haru surprise
          haru: 아, 또 빠졌어!
          mom: 엄마도 할머니한테 이거 배울 때 맨날 빠뜨렸어.
          @act haru surprise nowait
          haru: 엄마도?
          mom: 그럼. 할머니가 그때마다 "괜찮다, 다시 뜨면 된다" 하셨지.
          @act mom pat
          @wait 1
          @sfx knit
          > 몇 줄을 더 떴다. 할머니가 뜬 반쪽 옆에, 삐뚤빼뚤한 줄이 이어진다.
          @act haru giggle nowait
          haru: …완전 티 나.
          @act mom laugh nowait
          mom: 티 나야지. 반은 할머니 거, 반은 하루 거니까.
          @emote haru ♪
          @wait 1
        `,
        explore: {
          enter: [2, 9],
          intro: s`
            nabi: 밤, 하루 방. 노란 털실 냄새가 나.
            bori: 할머니 목도리다. 다락방에서 가방 속으로, 가방 속에서 여기까지.
          `,
          threads: [
            { at: [6, 6], text: s`
              > 하루와 엄마 사이에 놓인 노란 목도리. 반은 고르고 촘촘한데, 이어진 몇 줄은 삐뚤빼뚤하다.
              toby: 할머니 코는 하나도 안 흐트러졌어. 몇 년이 지났는데도.
              ruru: 하루 코는… 음. 개성 있다고 해 두자.
            ` },
            { at: [9, 4], text: s`
              > 선반 위, 천 개의 종이별이 든 유리병. 그 옆에 작은 병이 하나 더 있다. 뚜껑에 뭐라고 쓰여 있다.
              ruru: 저 작은 병은 뭐지? 글씨가… 여기선 안 보여.
              bori: 나중에 가서 보자. 왠지 좋은 거 같아.
            ` },
            { at: [4, 4], text: s`
              > 책상 위 액자. 할머니와 하루가 볼을 맞대고 웃고 있다. 이사 전날 밤, 엎어서 가방 맨 밑에 넣었던 그 사진.
              nabi: 이제는 세워 놨어. 하루 쪽을 보게.
              toby: …할머니도 하루를 보고 계시네. 털실 엉키는 것까지 다.
            ` },
          ],
          looks: [
            { at: [5, 7], text: s`
              > 하루. 손가락에 털실이 세 번 감겨 엉켜 있다.
              ruru: 태엽 감듯이 감았네. 너무 많이 감으면 아프다니까.
            ` },
            { at: [7, 7], text: s`
              > 엄마. 하루 손보다 자기 손을 더 자주 본다. 엄마 바늘도 조금 서툴다.
              bori: 엄마도 할머니한테 배운 거니까. 다시 뜨면서.
            ` },
          ],
        },
        after: s`
          nabi: 할머니가 "나머지 반은 네가 떠라" 하셨잖아.
          ruru: 진짜로 뜨고 있어! 엄청 삐뚤빼뚤하게!
          toby: 그래서 좋은 거야. 할머니랑 하루가 한 목도리에 같이 있으니까.
        `,
      },
      {
        kind: 'memory',
        id: 'mEPd',
        at: [25, 6],
        name: '야광 별',
        caption: '"…붙여 줘. 옛날처럼."',
        scene: s`
          @room h_newroom
          @show dad dad 9 5 up lookUp
          @show haru haru15 6 7 up
          @music piano
          > 아빠가 의자 위에 올라가 천장을 올려다본다. 손에는 야광 별 스티커.
          dad: 이거… 이사 박스에서 나왔는데. 버릴까?
          @emote haru …
          @act haru nod
          haru: …붙여 줘.
          @act dad surprise nowait
          @emote dad !
          haru: 옛날처럼. 침대 위에. 북두칠성 모양으로.
          @act dad laugh nowait
          dad: 하하. 아빠가 북두칠성을 기억하나 모르겠다.
          @act haru point nowait
          haru: 내가 알려 줄게. 할머니가 알려 준 거야.
          @sfx paper
          @wait 0.5
          @sfx paper
          @walk haru 8 6 30
          @sfx switch
          @prop light off
          > 불을 끄자, 천장에 작은 별들이 초록빛으로 떠올랐다.
          @pose haru lookUp
          @emote haru ♪
          dad: 어때. 비슷해?
          haru: 하나 삐뚤어졌어. …그래도 좋아.
          @act haru giggle
          @wait 1.2
        `,
        after: s`
          toby: 이사 전날 밤에 아빠가 물어봤잖아. 별 스티커 붙여 줄까 하고.
          bori: 그땐 "애도 아니고" 했는데.
          nabi: 하나 삐뚤어진 거, 일부러 안 고쳤어. 하루가.
        `,
      },
      {
        kind: 'memory',
        id: 'mEPe',
        at: [15, 13],
        name: '할머니 의자',
        caption: '할머니 의자에서 하는 숙제',
        scene: s`
          @room h_newroom
          @show dad dad 12 7 left
          @show haru haru15 4 6 right
          @music waltz
          > 아빠가 낡은 나무 의자를 들고 들어온다. 부엌 식탁, 할머니 자리였던 의자.
          dad: 하루야, 이 의자 어디 둘까? 부엌엔 자리가 없어서.
          haru: …여기. 내 책상 앞에.
          dad: 할머니 의자인데, 괜찮겠어?
          @act haru nod
          haru: 할머니 의자니까.
          @walk dad 5 5 30
          @sfx chair
          > 하루가 의자에 앉는다. 등받이에는 할머니가 깔고 앉던 꽃무늬 방석.
          @pose haru sit
          haru: 여기서 숙제하면… 할머니가 옆에서 보는 것 같아.
          @pose haru chinRest
          haru: 받아쓰기 육십 점 맞아도 별 접어 주던 할머니.
          @act dad pat
          @wait 1
          @carry dad tray etoast
          dad: 그리고 이거. …오늘은 안 탔다.
          @emote haru !
          haru: …진짜네.
          dad: 약불에. 한 번 더 기다리고.
          haru: 그거 누가 알려 줬어?
          @wait 1
          @emote dad ♥
          dad: …비밀.
          @wait 1.2
        `,
        after: s`
          ruru: 아무도 안 앉던 의자! 이제 하루가 앉아!
          bori: 비어 있는 의자보다, 누가 앉아 있는 의자가 좋아.
          toby: 할머니 자리가… 하루 자리가 된 거야.
        `,
      },
      {
        kind: 'memory',
        id: 'mEPf',
        at: [26, 15],
        name: '할머니 얘기',
        caption: '지우에게 처음 한 할머니 이야기',
        scene: s`
          @room h_newroom
          @show haru haru15 9 6 down sit
          @carry haru phone ephone
          @music box
          @sfx crickets
          > 이사 오고 첫 주말 밤. 하루가 휴대폰을 귀에 댔다.
          haru: 지우야. 나야.
          haru: …응, 잘 왔어. 방 창문이 남쪽이야. 별 잘 보여.
          @wait 1
          @pose haru lookDown
          haru: 있잖아. 우리 할머니 얘기… 해도 돼?
          @wait 1.5
          > 「…응. 나 그거 삼 년 기다렸어.」
          @pose haru sit
          @emote haru ♪
          @act haru laugh nowait
          haru: 우리 할머니 진짜 웃긴 사람이었어. 내가 받아쓰기 망치면 시험지로 별을 접어 줬다니까? 사탕 훔쳐 먹으면 같이 먹었어. 공범이라고.
          > 「알아. 수박씨도 같이 먹었어. 너 아이스크림 사러 갔을 때.」
          @act haru surprise
          haru: …뭐? 그게 언제야?
          > 그날 밤 둘은 할머니 이야기를 오래 했다. 하루가 모르는 할머니도, 지우가 모르는 할머니도. 웃으면서. 가끔은 조금 울면서.
          @act haru wipe
          @wait 1.5
        `,
        after: s`
          @emote toby tear
          @act toby wipe
          toby: 하루가… 할머니 얘기를 해. 웃으면서.
          nabi: 지우 공책에, 한 줄 더 그어지겠다.
          bori: 할머니 소원이 그거였잖아. 「할머니 생각을 하면서 웃어 주렴.」
          ruru: 하루 소원은 안 이루어졌어도… 할머니 소원은 이루어졌네.
        `,
      },
      {
        kind: 'link',
        id: 'lEP',
        at: [11, 4],
        name: '새 유리병',
        icon: 'jar',
        locked: s`doll: 아직 이 방의 기억이 남아 있단다. 선반 너머, 상자 너머까지 가 보렴.`,
        scene: s`
          @bars on
          > 천 개의 별이 든 유리병 옆에, 작은 새 유리병이 하나. 별이 열두 개.
          > 뚜껑에 하루 글씨. 「하루가 웃은 날」.
          > 맨 밑의 첫 별만 노랗다. 가위 자국이 삐뚤빼뚤하다.
          @act ruru jump nowait
          ruru: 웃은 날마다 하나씩 접는 거야!
          nabi: 맨 밑 노란 거. …천 장 하고 한 장. 마지막 한 장이 여기 있었네.
          bori: 지우가 바를 정 자로 세던 걸, 이제 하루가 별로 세는 거야.
          doll: 할머니가 바라던 게 바로 이거란다.
          @face toby doll
          toby: 태엽 할머니. 저… 이제 알 것 같아요.
          doll: 뭘?
          toby: 감아 주는 손이 바뀌어도, 태엽은 같은 태엽이에요.
          @wait 1
          @act doll nod
          doll: …그래.
          @wait 1.5
          @sfx star
          > 창밖으로 눈이 그치고, 별이 떴다. 「하루 별」 옆의 작은 별 하나가 반짝였다.
          @act toby point
          toby: …할머니, 보고 계세요?
          @wait 2
          @fade 1 1.5
          @room h_newroom
          @tone now
          @show haru haru15 9 6 up
          @music none
          @fade 0 1.5
          > 그날 밤. 불 끄기 전.
          haru: 토비. 오늘 제일 좋았던 거.
          haru: 지우랑 통화한 거. 할머니 얘기 실컷 했어. …그리고 제일 싫었던 거는, 수학.
          @wait 1
          haru: 이제 토비 차례. 토비는 오늘 제일 좋았던 거 뭐야?
          @wait 2
          haru: …나랑 논 거? 알았어. 잘 자.
          @sfx switch
          @prop light off
          > 불이 꺼졌다. 창가 선반에서, 아주 작은 소리. 끼릭.
          toby: …이천구백십팔.
          @wait 2.5
          @fade 1 2.5
          @bars off
          @credits
          @room h_newroom
          @tone now
          @show haru haru15 9 7 up
          @music box
          @fade 0 2.5
          @sfx birds
          > 다음 날 아침. 하루의 방.
          > 창가 선반에 장난감들이 나란히 앉아 있다. 천 개의 종이별이 담긴 유리병과, 열두 개가 담긴 작은 유리병 옆에.
          > 책상 위에는 노란 목도리. 반은 할머니의 촘촘한 코, 나머지 반은 삐뚤빼뚤한 하루의 코.
          > 책상 앞에는 할머니 의자. 꽃무늬 방석.
          @wait 1
          @walk haru 9 4 30
          @face haru up
          @carry haru toby etoby
          @face haru down
          haru: 하나.
          @sfx windTick
          @wait 0.5
          haru: 둘.
          @sfx windTick
          @wait 0.5
          haru: 셋.
          @sfx windTick
          @wait 0.6
          haru: 매일 세 번. 너무 많이 감으면 아프고, 안 감으면 멈추니까.
          > 하루는 태엽 할머니도 집어, 세 번 감았다. 빨간 바늘땀이 난 소매를 한 번 쓰다듬고.
          @sfx windTick
          @wait 0.4
          @face haru up
          @carry haru none
          @sfx put
          @walk haru 12 4 30
          @face haru up
          > 창가에 작은 화분 하나. 크레용 이름표, 「하루 꽃」. 이삿날 아침, 마당에서 안고 온 것.
          @carry haru cup ewater
          @sfx pour
          > 하루가 물을 준다. 말랐던 흙 사이로, 연두색 싹 하나.
          @carry haru none
          @act haru nod
          haru: …매일 줄게. 태엽처럼.
          @wait 1.2
          @walk haru 9 5 30
          @face haru down
          @sfx clothes
          > 노란 목도리를 두른다. 반은 촘촘하고, 반은 삐뚤빼뚤하다.
          @act haru spin
          @walk haru 1 4 40
          @walk haru 1 3 40
          @face haru down
          @act haru bow
          haru: 다녀오겠습니다.
          @face haru up
          @sfx doorOpen
          @hide haru
          @sfx doorClose
          @wait 2
          doll: …차 조심하고.
          @wait 2.5
          @fade 1 3
          @title 끝 | 태엽이 멈추기 전에
          @flag ending
        `,
      },
      // ── 종이별
      { kind: 'star', id: 'sEPa', at: [1, 4], text: '책상 다리 옆에 떨어진 종이별. 「웃은 날」 병에서 굴러 나왔나 보다.' },
      { kind: 'star', id: 'sEPb', at: [10, 3], text: '창틀에 놓인 종이별. 노란색.' },
      { kind: 'star', id: 'sEPc', at: [20, 4], text: '선반 아래 종이별. 받아쓰기 시험지로 접은 것 같다.' },
      // ── 거둠 살펴보기: 물건이 이야기를 정리한다
      {
        kind: 'spot',
        id: 'epFrame',
        at: [19, 11],
        scene: s`
          > 새 방 문틀에 연필 줄 하나. 「하루 15살 · 이사 온 날」 지렁이 글씨. 그 밑, 아주 낮은 곳에 하루 글씨로 작게 「토비」.
          @emote toby ♪
          toby: …나도 재 줬어.
        `,
      },
      {
        kind: 'spot',
        id: 'epNabi',
        at: [7, 4],
        when: 'place_nabi',
        scene: s`
          > 선반 위 나비 자리. 나비의 등불에 새 바늘땀. 반짝이 실이다. 땀이 삐뚤빼뚤하다.
          nabi: 하루가 꿰매 줬어. 할머니 실로.
          nabi: 그리고 날 문 쪽으로 돌려놓더라. 「…왠지 그래야 할 것 같아서」래.
          @emote nabi tear
        `,
      },
      {
        kind: 'spot',
        id: 'epCoin',
        at: [19, 6],
        scene: s`
          > 침대 다리 옆에 100원짜리 하나. 이삿날 아빠 주머니에서 굴러 나왔다.
          @act ruru peek nowait
          ruru: …서른.
        `,
      },
      {
        kind: 'spot',
        id: 'epTea',
        at: [4, 4],
        scene: s`
          > 책상 위에 머그잔 두 개. 둘 다 바닥까지 비었다.
          bori: 두 숟갈 반씩. 이번엔 둘 다 마셨어.
        `,
      },
      {
        kind: 'spot',
        id: 'epNotebook',
        at: [2, 4],
        scene: s`
          > 지우의 공책. 맨 뒷장 바를 정 자 끝에, 새 획이 하루 글씨로 이어진다.
        `,
      },
      {
        kind: 'spot',
        id: 'scarfEP',
        at: [2, 7],
        scene: s`
          > 털실 바구니. 노란 실 뭉치가 반쯤 남았다.
          nabi: 실이 줄어드는 만큼 목도리가 길어지는 거야.
        `,
      },
      {
        kind: 'spot',
        id: 'cardEP',
        at: [15, 5],
        scene: s`
          > 벽에 압정으로 꽂힌 카드 한 장. 「할머니, 나 천 개 다 접었어. 이제 천천히 웃을게.」
          toby: 열네 살 생일에 재봉틀 위에 두고 온 카드에… 답장을 쓴 거야. 하루가 스스로.
        `,
      },
      {
        kind: 'spot',
        id: 'boxEP',
        at: [18, 10],
        scene: s`
          > 접힌 빈 상자. 옆구리에 매직펜 글씨가 남아 있다. 「가져온 짐」.
          bori: 이제 이 상자는 비었어. 우리가 다 나왔으니까.
        `,
      },
    ],
  });
  return {
    ...r,
    toys: true,
    amb: NEW_AMB,
    // 처음 말을 걸면 저마다 바라는 선반 자리를 말한다 (자리 정하기의 실마리)
    hangouts: {
      bori: { at: [18, 12], pose: 'chinRest', dir: 'right', talk: s`
        @act bori nod nowait
        bori: 문틈으로 부엌 냄새가 나. 미역국이야. 하루 엄마가 끓이나 봐.
        bori: 내 자리는 부엌 냄새 나는 쪽이면 좋겠다. 문 쪽 칸.
      ` },
      ruru: { at: [3, 12], dir: 'right', talk: s`
        @act ruru spin nowait
        ruru: 새 방 넓다! 근데 난 높은 데가 좋아. 선반 맨 위 칸 찜!
        ruru: 상자 풀 거면 불러. 테이프 자락은 내 밧줄로.
      ` },
      nabi: { at: [15, 8], pose: 'sleepSit', dir: 'up', talk: s`
        @act nabi stretch nowait
        nabi: 하루 침대 옆이 따뜻해. 밤에도 하루 자는 얼굴이 보이고.
        nabi: 선반에 앉는다면… 하루 침대가 보이는 칸이 좋아.
      ` },
    },
    // 기억 → 새 방의 물건
    keepsakes: {
      mEPa: { at: [7, 10], look: 'boxKeep', when: 'unpacked' },
      mEPb: { at: [19, 12], look: 'bowl' },
      mEPc: { at: [3, 5], look: 'scarf' },
      mEPd: { at: [8, 11], look: 'stickerBag' },
      mEPe: { at: [14, 5], look: 'cushion' },
      mEPf: { at: [17, 8], look: 'phone' },
    },
  };
}
