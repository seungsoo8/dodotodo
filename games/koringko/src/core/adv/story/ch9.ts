/** 18장 · 장난감 상자 (4살, 첫 만남) — 사람 크기 하루 방 (houseMap), 04:05 새벽빛 · 하루는 다시 깊이 잠들었다 */
import { s } from '../parse.ts';
import type { ChainStep, Chapter, RoomDef, Thing } from '../types.ts';
import { houseMap } from './kit.ts';
import { HARU, haruAmb, haruRoomSpec } from './layout_a.ts';

/*
 * 하루 방 · 이삿날 밤 04:05 (배치는 layout_a.ts, 4 · 8장과 같은 방)
 *   창이 푸르스름하다. 하루는 깊이 잠들어 숨바꼭질이 없다 (머리맡에 가면 잠꼬대만)
 *   (15~16,4) 엄마가 옷장 옆에 옮겨 둔 빈 장난감 상자: 뚜껑은 넷이 같이 들어 올린다 (15,5)
 *   크레용 그림 조각 여섯이 방 곳곳 (책상 밑 · 침대 밑 앞 · 블록 상자 · 복도 …) → 상자 앞 (16,5) 에 맞춘다
 *   (12,4) 옷장 앞에서 자는 곰 대장: 하루 머리맡의 머리끈 (하루 냄새) 을 가져다주면 깬다 (12,5)
 */
const SPEC = haruRoomSpec('ch18');
const BOX: readonly [number, number] = [15, 4];

/** 크레용 그림 조각 여섯: 뚜껑을 열면 상자 바닥 그림이 찢겨 흩어져 있던 것이 보인다 */
const SCRAPS: readonly (readonly [number, number])[] = [[6, 4], [19, 6], [7, 13], [2, 8], [23, 9], [16, 8]];
const scraps: Thing[] = SCRAPS.map(([x, y], i): Thing => ({ kind: 'part', id: `scrap${i + 1}`, at: [x, y], look: 'crayonScrap', set: 'crayon', when: 'lid_open' }));

export const CH9: Chapter = {
  n: 9,
  title: '9장 · 장난감 상자',
  sub: '4살, 처음 만난 날',
  room: 'toybox',
  start: [HARU.start[0], HARU.start[1]],
  party: ['toby', 'bori', 'ruru', 'nabi'],
  wind: 0.16,
  intro: s`
    @fade 1 0 white
    @bars on
    @music box
    @chtitle
    @fade 0 2
    > 새벽 네 시 오 분. 하루의 방. 엄마가 옷장 옆에 옮겨 둔 장난감 상자. 텅 비었다.
    > 창밖이 아주 조금, 회색으로 묽어졌다.
    bori: 집이다…
    @act ruru lookAround nowait
    ruru: 다 비었네. 상자가 이렇게 넓었나?
    toby: 우리가 다 빠져서 그래.
    nabi: 곰 대장님은 아직 계시네. 너무 커서 안 들어갔나 봐.
    @sfx windTick
    @wait 0.8
    > 끼…릭. 토비의 태엽이 아주 느리게 돈다.
    @sfx bed
    haru: …토비…
    @wait 2
    > 침대 위, 하루가 돌아누웠다. 잠꼬대였다.
    @emote toby !
    toby: …불렀어.
    nabi: 잠꼬대야.
    toby: 알아. …그래도.
    @wait 1.2
    @act toby bow
    toby: 다들. 고마워. 여기까지 같이 와 줘서.
    nabi: 아직 끝 아니야. 고마운 말은 끝에 해.
    bori: 그래도 지금 들어도 좋은데.
    @bars off
    @goal 장난감 상자 밑바닥에서, 크레용 그림 속 약속을 다시 찾자
  `,
};

export function toyboxRoom(): RoomDef {
  const r = houseMap({
    ...SPEC,
    id: 'toybox',
    name: '장난감 상자',
    music: 'box',
    things: [
      // 깊이 잠든 하루 (눈을 뜨지 않는다 — 이 장은 숨바꼭질이 없는 쉬는 장)
      { kind: 'watcher', id: 'haru_dawn', at: [HARU.haru[0], HARU.haru[1]], actor: 'haru15', dir: 'left', pattern: [{ s: 60, dir: null, pose: 'sleep' }], caught: [] },
      {
        kind: 'trigger',
        id: 'haru_mumble',
        rect: [HARU.haru[0] - 1, HARU.haru[1], 1, 2],
        scene: s`
          @sfx bed
          > 하루가 돌아누웠다. 「…음…」
          @wait 1
          > 잠꼬대였다. 숨소리가 다시 고르게 이어진다.
          @act ruru peek nowait
          ruru: …휴. 발소리 죽여.
        `,
      },
      {
        kind: 'npc',
        id: 'bearboss',
        at: [12, 4],
        actor: 'bear',
        dir: 'down',
        scene: s`
          @if bear_awake
            bear: 하루 냄새를 맡으니 정신이 번쩍 드는구나. 꼬마들, 장하다.
          @else
          @if seen_bearboss
            bear: 쿨… 쿨… 하루야, 숙제는 했니… 쿨…
            @if crayon_done
              nabi: 곰 대장님은 하루 냄새가 나야 깨셔. 하루 머리맡에 머리끈이 있었지.
            @end
          @else
            bear: 쿠울… 으응? 누구냐… 오, 꼬마들이구나.
            toby: 곰 대장님! 아직 여기 계셨어요?
            bear: 이 몸은 상자에 들어가기엔 너무 크지. 하루가 처음 산 장난감이 나였다는 걸 아느냐? 아니, 사실은 할머니가 산 거지만.
            bear: 하루가 갓난아기 때부터 이 방을 지켰다. 밤마다 하루가 무서운 꿈을 꾸면, 나를 꼭 끌어안았지.
            bear: 요즘은… 아무도 안지 않는구나.
            @emote bear zz
            bori: 다시 잠드셨어.
            ruru: 곰은 원래 잠이 많아. 보리 너처럼.
            @act bori stomp nowait
            bori: 난 곰 대장님만큼은 아니야!
          @end
          @end
        `,
      },
      // ── 놀이 1 · 상자 뚜껑: 넷이 같이 들어 올린다 (보리 · 루루 · 나비를 모두 불러)
      {
        kind: 'trigger',
        id: 'box_near',
        rect: [BOX[0] - 2, BOX[1], 5, 3],
        unless: 'lid_open',
        scene: s`
          > 장난감 상자. 뚜껑 모서리에 테이프 자락이 늘어져 있다. 엄마가 옮기면서 붙였나 보다.
          @act bori think nowait
          bori: 뚜껑이 무거워. 한 귀퉁이씩, 넷이 같이 들어야 해.
          @goal 상자 뚜껑을 열자 — 보리 · 루루 · 나비를 불러 넷이 함께
        `,
      },
      {
        kind: 'pull',
        id: 'lid',
        at: [BOX[0], BOX[1] + 1],
        look: 'tape',
        need: ['bori', 'ruru', 'nabi'],
        flag: 'lid_open',
        scene: s`
          @sfx cardboard
          @prop toybox@${BOX[0]},${BOX[1]} open
          @shake 0.2
          > 끼익— 뚜껑이 뒤로 넘어갔다. 텅 빈 상자 바닥에 크레용 그림이 붙어 있던 자국만 남았다.
          @act bori surprise nowait
          bori: 그림이… 찢겨 있어.
          nabi: 상자를 옮길 때 떨어져 나갔나 봐. 조각이 방 여기저기 흩어졌어.
          @goal 흩어진 크레용 그림 조각을 모아, 상자 앞에 다시 맞추자
        `,
      },
      // ── 놀이 2 · 크레용 그림 맞추기: 여섯 조각
      ...scraps,
      {
        kind: 'assemble',
        id: 'crayon_pic',
        at: [BOX[0] + 1, BOX[1] + 1],
        set: 'crayon',
        flag: 'crayon_done',
        when: 'lid_open',
        scene: s`
          @bars on
          > 여섯 조각이 맞춰졌다. 할머니와 아이, 그리고 하얀 토끼 한 마리.
          > 삐뚤빼뚤한 글씨가 이어진다. 「평생 같이 놀자」.
          @emote toby …
          toby: …다 모였어.
          @act ruru point nowait
          ruru: 근데 곰 대장님은 아직도 코 골아. 이 그림, 대장님도 봐야 하는데.
          @bars off
          @goal 하루 냄새로 곰 대장을 깨우자 — 하루 머리맡의 머리끈
        `,
      },
      // ── 놀이 3 · 곰 대장 깨우기 (배달): 하루 머리맡의 머리끈
      { kind: 'part', id: 'hairtie', at: [HARU.haru[0] - 1, HARU.haru[1]], look: 'hairBand', set: 'smell', when: 'crayon_done' },
      {
        kind: 'assemble',
        id: 'bear_wake',
        at: [12, 5],
        set: 'smell',
        flag: 'bear_awake',
        when: 'crayon_done',
        scene: s`
          @bars on
          @emote bearboss !
          bear: 킁, 킁… 이 냄새는… 하루다!
          @act bearboss stretch
          bear: 쿠아아… 잘 잤다. 꼬마들, 이 몸을 깨운 게 너희냐?
          toby: 곰 대장님, 이거 보세요. 할머니하고 하루하고… 저요.
          bear: …「평생 같이 놀자」라. 이 글씨, 이 몸도 기억하지. 상자에 붙이던 날 할머니가 옆에 계셨다.
          bear: 가거라. 이 방은 이 몸이 지키마. 새벽이 오기 전에.
          @bars off
          @goal 상자 앞의 크레용 그림에서, 그 약속의 날로 가자
        `,
      },
      {
        kind: 'memory',
        id: 'm9a',
        at: [4, 3],
        name: '선물 상자',
        caption: '「토비! 토비야!」 하루가 처음 부른 이름',
        scene: s`
          @room m_room4
          @show haru haru4 8 7 up
          @show gm grandma 10 6 left
          @carry gm box gift9a
          @music box
          @sfx birds
          > 하루, 네 살. 할머니가 커다란 선물 상자를 들고 오셨다.
          gm: 하루야, 할머니가 뭐 가져왔게?
          @act haru hop nowait
          haru: 과자!
          @act gm shake nowait
          gm: 땡.
          haru: 사탕!
          @put gm gift9a 9 7
          gm: 땡. 열어 보렴.
          @face haru right
          @sfx tapeRip
          @wait 0.5
          @item gift9a boxOpen
          @sfx cardboard
          > 상자 안에서, 하얀 토끼 인형이 나왔다. 등에 작은 태엽 열쇠가 달린.
          @item toby9a toby 9 7
          @take haru toby9a
          @pose haru hold
          @emote haru !
          @act haru jump nowait
          haru: 토끼다!
          gm: 이름 지어 줄래?
          @act haru think
          haru: 음… 토… 토…
          @emote haru ?
          @act haru cheer nowait
          haru: 토비! 토비야!
          gm: 토비. 좋은 이름이구나.
          @wait 1
        `,
        explore: {
          enter: [2, 9],
          intro: s`
            toby: 하루 방이야. 하루가 네 살이던 날… 내가 처음 온 날.
            ruru: 나 이 방은 처음 봐. …작다.
          `,
          threads: [
            { at: [11, 6], text: s`
              > 할머니가 든 커다란 선물 상자. 안에서 아주 작게, 끼릭.
              toby: 할머니가… 나를 미리 한 번 감아 두셨구나. 하루를 처음 볼 때 걸을 수 있게.
            ` },
            { at: [12, 4], text: s`
              > 화분 옆 바닥에 크레용 몇 자루. 노란색만 몽당하다.
              nabi: 하루는 그때부터 노란색을 좋아했구나.
              bori: 할머니 목도리도 노란색이었지.
            ` },
            { at: [10, 9], text: s`
              > 새로 산 장난감 상자. 텅 빈 바닥에 할머니 글씨로 「하루의 친구들 집」.
              bori: 나는 이날 아직 할머니 방에 있었어. 다음 날 여기로 왔지.
              toby: 그러니까 이 상자에 제일 먼저 들어간 건… 나였구나.
            ` },
          ],
          looks: [
            { at: [8, 6], text: s`
              > 네 살 하루. 발뒤꿈치를 들고 상자 안을 들여다보려 한다.
              ruru: 작다. 진짜 작다.
            ` },
            { at: [10, 5], text: s`
              > 할머니. 상자보다 하루 얼굴을 보고 계신다.
              toby: 처음 만난 날, 먼저 웃고 계셨던 건 할머니였어.
            ` },
          ],
        },
        after: s`
          toby: …토비.
          toby: 하루가 처음으로 불러 준 내 이름이야.
          bori: 이름 엄청 빨리 정해졌네.
          @act ruru laugh nowait
          ruru: 토끼라서 토비. 단순하다, 하루.
          nabi: 네 살이잖아.
        `,
      },
      {
        kind: 'memory',
        id: 'm9b',
        at: [24, 4],
        name: '처음 감은 태엽',
        caption: '「하루가 감아 준 만큼 걷는 거란다」',
        scene: s`
          @room m_room4
          @show haru haru4 7 7 down sit
          @show gm grandma 9 7 left sit
          @carry haru toby toby9b
          @music box
          @sfx birds
          gm: 토비 등에 있는 열쇠 보이지? 이걸 돌리면 토비가 걷는단다.
          @act haru hop
          haru: 내가! 내가 할래!
          @pose haru hold
          @sfx windTick
          @wait 0.6
          @sfx windTick
          @wait 0.6
          @sfx windTick
          > 작은 손으로, 서툴게. 끼릭, 끼릭.
          haru: 됐다!
          @put haru toby9b 7 8
          @pose haru sit
          > 토비가 바닥 위를 아장아장 걸었다. 하루보다도 서툰 걸음으로.
          @sfx windTick
          @item toby9b toby 8 8
          @wait 0.5
          @sfx windTick
          @item toby9b toby 9 8
          @wait 0.3
          @sfx clap
          @emote haru ♪
          @act haru point nowait
          haru: 걷는다! 할머니, 토비가 걸어!
          gm: 그래. 하루가 감아 준 만큼 걷는 거란다.
          haru: 그럼 많이 감아 줄게! 계속계속 걷게!
          gm: 허허. 계속계속 걷게 하려면, 매일 조금씩 감아 주면 된단다.
          @wait 1
        `,
        after: s`
          toby: 하루가 감아 준 만큼 걷는다.
          toby: …그래서 이제 태엽이 거의 없는 거야. 하루가 감아 주지 않아서.
          @emote toby …
          nabi: 토비. 아직 시간 있어.
          bori: 우리 다 같이 있잖아.
        `,
      },
      {
        kind: 'memory',
        id: 'm9c',
        at: [25, 13],
        name: '평생 같이 놀자',
        caption: '「토비가 할머니 대신 평생 같이 놀아 줄 거야」',
        dark: true,
        scene: s`
          @room m_room4
          @show haru haru4 15 5 down sleep
          @show gm grandma 13 6 right
          @music box
          @sfx crickets
          > 그날 밤. 하루는 토비를 꼭 안고 침대에 누웠다.
          haru: 할머니, 토비랑 나랑 평생 같이 놀 거야.
          gm: 평생이라. 그거 아주 긴 약속이구나.
          @act haru nod nowait
          haru: 응! 할머니도 평생!
          @wait 1.8
          gm: …그래. 할머니도.
          haru: 약속!
          gm: 약속.
          > 할머니는 하루가 잠들 때까지 이불을 토닥였다. 토닥, 토닥.
          @sfx blanket
          @sfx pat
          @wait 0.8
          @sfx pat
          @wait 0.7
          gm: 우리 하루. 할머니가 평생은 못 있어 줘도…
          gm: 토비가 있잖니.
          gm: 토비야. 할머니 대신, 우리 하루랑 평생 같이 놀아 주렴.
          @wait 1.5
        `,
        explore: {
          enter: [2, 9],
          intro: s`
            > 그날 밤. 작은 스탠드 하나만 켜져 있다.
            toby: 이 밤은… 나도 잘 기억이 안 나. 하루 품에서 꾸벅꾸벅 졸았거든.
          `,
          threads: [
            { at: [8, 3], text: s`
              > 창밖에 별 하나가 유난히 밝다.
              nabi: 저 별… 나중에 하루가 「하루 별」이라고 부르게 되는 별이야.
            ` },
            { at: [10, 9], text: s`
              > 장난감 상자 뚜껑이 닫혀 있다. 첫날 밤부터 토비는 상자가 아니라 하루 품이다.
              bori: 이 시간에 나는 할머니 무릎 위에 있었어. 할머니가 내 단추 눈을 단단히 꿰매 주셨지. 내일부터 하루 친구 하라고.
            ` },
            { at: [13, 7], text: s`
              > 바닥에 할머니 실내화 한 짝. 발소리 안 나게 벗어 두고 들어오셨나 보다.
              ruru: 할머니, 은근히 작전가라니까.
            ` },
          ],
          looks: [
            { at: [13, 5], text: s`
              > 할머니. 이불 위에 얹은 손이 토닥이던 그대로 멈춰 있다.
              toby: 할머니 손은… 늘 따뜻했어.
            ` },
            { at: [15, 7], text: s`
              > 침대 위 하루. 토비를 안은 채 눈이 반쯤 감겼다.
              bori: 졸린 얼굴이다. 꿀 먹은 것처럼.
            ` },
          ],
        },
        after: s`
          @emote toby …
          toby: 기억났어. 전부.
          toby: 할머니가 나한테 부탁하셨어. "하루랑 평생 같이 놀아 주렴." 그날 밤, 하루가 잠든 뒤에.
          toby: 「할머니 대신」이래. …할머니는 그때부터 알았을까.
          nabi: 네 살 때? 설마.
          bori: …할머니는 늘 하루보다 한 발 먼저 계셨어.
          @act ruru point nowait
          ruru: 하루한테 가자. 상자가 차에 실리기 전에.
          nabi: 새벽이 오고 있어.
        `,
      },
      {
        kind: 'link',
        id: 'l9',
        at: [14, 7],
        name: '크레용 그림',
        icon: 'photo',
        locked: s`toby: 아직이야. 마지막 기억까지… 조금만 더.`,
        scene: s`
          @bars on
          > 장난감 상자 바닥에 크레용 그림이 붙어 있다. 할머니, 하루, 그리고 하얀 토끼. 「평생 같이 놀자」.
          @emote bori !
          bori: …킁킁. 이거 꿀 냄새다.
          @act ruru shrug nowait
          ruru: 지금? 이 와중에?
          bori: 상자 틈으로 들어와. 부엌 찬장 쪽이야. 할머니 꿀단지 냄새.
          bori: 다락방 가기 전에… 너희한테 보여 주고 싶은 게 있어. 하루보다 더 옛날 이야기.
          toby: 보리가 먼저 가자고 하는 건 처음이네. 가자, 찬장으로.
          > 크레용 가루가 흩어져 있다. 그림을 다시 그려 본다.
          @mini order5
          @sfx open
          @flag ch9_done
          @sfx memory
          @fade 1 1.6 white
          @next
        `,
      },
      // ── 종이별
      { kind: 'star', id: 's9a', at: [5, 6], text: '블록 틈에 낀 종이별.' },
      { kind: 'star', id: 's9b', at: [24, 14], text: '구슬 옆의 종이별.' },
      { kind: 'star', id: 's9c', at: [1, 13], text: '상자 모서리의 종이별.' },
      { kind: 'star', id: 's9d', at: [24, 3], text: '어둠 속에서 빛나는 마지막 종이별.', dark: true },
      {
        kind: 'spot',
        id: 'blocks9',
        at: [9, 12],
        scene: s`
          @sfx thud
          > 「ㅎ ㅏ ㄹ ㅜ」 글자 블록이 나란히 놓여 있다.
          ruru: 하루가 처음 쓴 자기 이름이야. 「ㄹ」을 거꾸로 놓아서 할머니가 웃으셨지.
        `,
      },
      {
        kind: 'spot',
        id: 'pacifier',
        at: [2, 11],
        scene: s`
          @sfx chime
          > 조그만 딸랑이.
          bori: 하루 아기 때 거야. 할머니가 흔들면 하루가 꺄르르 웃었대.
        `,
      },
      {
        kind: 'spot',
        id: 'marbles9',
        at: [17, 7],
        scene: s`
          > 구슬 주머니. 구슬이 몇 개 굴러 나와 있다.
          nabi: 구슬 하나하나에 하루 얼굴이 비쳐 있던 시절이 있었지.
        `,
      },
      {
        kind: 'spot',
        id: 'note9',
        at: [14, 4],
        scene: s`
          > 상자 안쪽 벽에 할머니 글씨. 「하루의 친구들 집」.
          toby: …할머니가 써 주신 거야. 우리 집이라고.
        `,
      },
    ],
  });
  return {
    ...r,
    toys: true,
    amb: haruAmb('ch18'),
    keepProps: [{ key: `toybox@${BOX[0]},${BOX[1]}`, flag: 'lid_open', state: 'open' }],
    hangouts: {
      bori: { at: [9, 9], pose: 'chinRest', dir: 'up', talk: s`
        @act bori nod nowait
        bori: 블록 상자 옆이 내 자리였어. 하루가 블록으로 내 집을 지어 줬거든.
        bori: 뚜껑 들 때 불러. 넷이 같이 들어야 해.
      ` },
      ruru: { at: [20, 8], dir: 'left', talk: s`
        @act ruru giggle nowait
        ruru: 하루 잠꼬대 들었어? 「토비」 래. 너 인기 많다.
        ruru: 조각 찾는 건 나한테 맡겨. 아니, 같이 찾자.
      ` },
      nabi: { at: [16, 3], pose: 'sleepSit', dir: 'down', talk: s`
        @act nabi stretch nowait
        nabi: 창이 푸르스름해졌어. 새벽이 오고 있어.
        nabi: 침대 밑 틈은 깜깜해. 거기 갈 땐 나를 데려가.
      ` },
    },
    // 기억 → 이 방의 물건 (상자 안쪽 손 그림은 뚜껑을 열어야, 맞춘 그림은 맞춘 뒤)
    keepsakes: {
      m9a: { at: [14, 5], look: 'xmasbox' },
      m9b: { at: [17, 5], look: 'card', when: 'lid_open' },
      m9c: { at: [16, 6], look: 'photo', when: 'crayon_done' },
      m9d: { at: [8, 11], look: 'cup' },
      m9e: { at: [10, 8], look: 'pen', dark: false },
      m9f: { at: [HARU.haru[0] - 1, HARU.haru[1] + 2], look: 'cushion' },
      m9g: { at: [13, 4], look: 'letter' },
    },
  };
}

/** 막 기억 사슬 (ACTS.md 막별 표): 이 방의 단계 차례 — 비어 있으면 사슬 없음 */
export const TOYBOX_CHAIN: ChainStep[] = [];
