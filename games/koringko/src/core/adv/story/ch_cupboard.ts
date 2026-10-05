/** 곁가지 장 · 보리의 찬장 — 곰 인형 보리가 본 순이 (할머니) 의 예순 해 */
import { s } from '../parse.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { grid, house, toyRoom } from './kit.ts';

const MAP = grid(30, 18, 'w', 'K', [
  // 윗선반 끝 낭떠러지 (루루 밧줄)
  ['v', 1, 7, 9, 1],
  // 쌀 포대 칸막이 (아래쪽 두 칸은 지나갈 수 있다)
  ['K', 10, 1, 1, 16],
  ['w', 10, 13, 1, 2],
  // 그릇 칸막이 (가운데 한 칸은 냄비가 막고 있다 — 보리가 민다)
  ['K', 19, 1, 1, 16],
  ['w', 19, 9, 1, 1],
  // 꿀단지 · 양념 병
  ['O', 6, 12, 1, 1],
  ['O', 14, 11, 1, 1],
  ['O', 16, 4, 1, 1],
  ['O', 23, 6, 1, 1],
  ['O', 27, 13, 1, 1],
  ['k', 12, 15, 1, 1],
]);

export const CH_CUPBOARD: Chapter = {
  n: 0,
  title: '0장 · 보리의 찬장',
  sub: '순이와 곰돌이의 예순 해',
  room: 'cupboard',
  start: [3, 15],
  party: ['toby', 'bori', 'ruru', 'nabi'],
  wind: 0.13,
  intro: s`
    @fade 1 0 white
    @bars on
    @music box
    @chtitle
    @fade 0 2
    > 부엌 찬장 안. 꿀단지, 보리차 깡통, 쌀 포대, 겹겹이 쌓인 밥그릇.
    @emote bori ♥
    bori: 킁킁… 이 냄새. 할머니 꿀단지야.
    ruru: 너 진짜 꿀 냄새 따라서 여기까지 온 거야?
    bori: 반은. …나머지 반은, 이 냄새를 맡으니까 아주 옛날 일이 생각나서.
    toby: 옛날? 하루가 네 살 때?
    bori: 아니. 그보다 훨씬 전. 하루가 태어나기도 전. 할머니가 아직 「순이」였을 때.
    @sfx windTick
    > 끼…릭. 토비의 태엽이 느리게 돈다.
    toby: …괜찮아. 보리 이야기는 꼭 듣고 갈래.
    nabi: 앞장서, 보리. 오늘은 네 찬장이야.
    bori: 응. 꿀단지 앞에서 안 멈춘다고 약속은… 못 하지만.
    @bars off
    @goal 기억 조각 여섯 개를 찾자
  `,
};

export function cupboardRoom(): RoomDef {
  return toyRoom('cupboard', MAP, {
    name: '보리의 찬장',
    theme: 'village',
    start: [3, 15],
    music: 'box',
    ambient: [150, 122, 92],
    beams: [{ x: 11, w: 5, h: 12, slant: 2 }],
    lights: [{ at: [2, 4], r: 70, color: [255, 210, 120], k: 0.35 }],
    things: [
      {
        kind: 'memory',
        id: 'mOa',
        at: [7, 15],
        name: '곰돌이',
        caption: '「꿀 좋아하는 곰이다. 꼭 너처럼」',
        scene: s`
          @room m_br_home
          @show gmom gmom 3 4 up sit
          @show suni suni7 9 7 up
          @music box
          > 아주 오래전 겨울. 바느질하는 엄마 등 뒤에서, 일곱 살 순이가 발끝으로 서서 기웃거렸다.
          suni: 엄마, 아직이야? 아직이야?
          gmom: 조금만. 눈만 달면 된다.
          @sfx stitch
          @wait 1
          > 마지막 바늘땀. 단추 눈 두 개가 달리고 — 나는, 처음으로 세상을 보았다.
          > 제일 먼저 보인 건, 동그랗게 커진 여자아이의 눈이었다.
          @face gmom right
          gmom: 자. 아버지 헌 외투로 만든 거라 색이 좀 바랬다만.
          @walk suni 5 5 60
          @pose suni hold
          @emote suni ♥
          suni: 곰이다! 곰돌이! 너는 곰돌이야!
          gmom: 곰돌이는 꿀을 아주 좋아한단다. 꼭 너처럼.
          suni: 그럼 나랑 나눠 먹으면 되겠다!
          gmom: 그래. 속상한 날엔 둘이 꿀 한 숟갈씩. 꿀처럼 마음이 달콤해지라고.
          @wait 1
          suni: 곰돌아, 우리 평생 같이 살자.
          @wait 1.5
        `,
        after: s`
          @emote bori …
          bori: 나 꿀 좋아하는 거… 태어날 때부터 정해진 거였어.
          ruru: 먹보인 것도 설계였네. 순이 엄마가 책임지셔야겠다.
          toby: 순이가… 할머니 이름이야?
          bori: 응. 그때 할머니는 일곱 살이었어. 지금 하루보다 훨씬 작은.
          nabi: 「평생 같이」. 할머니 말버릇은 그때부터였구나.
        `,
      },
      {
        kind: 'memory',
        id: 'mOb',
        at: [2, 9],
        name: '가져가는 짐',
        caption: '「다른 건 다 두고 가도, 곰돌이는 데려갈래」',
        scene: s`
          @room m_br_home_n
          @show suni suni20 8 6 down
          @show gmom gmom 3 4 right sit
          @music night
          > 순이, 스무 살. 시집가기 전날 밤.
          > 작은 보따리 하나에 옷 몇 벌. 순이는 짐을 쌌다가 풀고, 또 쌌다.
          gmom: 그 보따리 하나면 되겠니?
          suni: 응. 저쪽 집에 다 있대. 이불도, 그릇도.
          @pose suni hold
          > 순이가 마지막으로 나를 집어 들어, 보따리 맨 위에 올렸다.
          gmom: …곰돌이도 데려가니? 다 큰 색시가.
          suni: 다른 건 다 두고 가도, 곰돌이는 데려갈래.
          @emote gmom …
          gmom: 그래. 그럼 힘든 날엔 엄마 대신 곰돌이한테 말해라.
          suni: 엄마 대신은 아무도 못 해.
          @wait 1
          suni: …그래도 꿀은 같이 먹을게. 엄마가 그랬잖아. 속상할 땐 꿀 한 숟갈.
          @walk suni 5 5 50
          @face suni gmom
          @face gmom suni
          gmom: 가서 잘 살아라, 순아.
          @wait 1.5
        `,
        after: s`
          bori: 나는 그날 처음으로 「가져가는 짐」이 됐어.
          @emote toby …
          toby: 하루는 우리를 「두고 가는 짐」에 넣었는데.
          ruru: 아직 이사 안 갔어. 내일 아침까진 모르는 거야.
          bori: 응. 그 쪽지, 세 번이나 고쳐 썼잖아. 네 번째도 있을 거야.
        `,
      },
      {
        kind: 'memory',
        id: 'mOc',
        at: [4, 2],
        name: '꿀차와 그네',
        caption: '「그네도 매어 놨소. 나중에 우리 애 태워 주게」',
        scene: s`
          @room m_br_house
          @show suni suni20 5 6 right
          @show gpa gpa 12 6 left
          @music waltz
          > 새집에서 맞은 첫봄. 신랑은 말수가 적은 사람이었다.
          gpa: …저기. 이거.
          @pose gpa hold
          suni: 꿀이네요? 웬 꿀을…
          gpa: 장모님이 그러시던데. 당신은 꿀만 있으면 운다고. 아니, 안 운다고.
          suni: 둘 다 맞는 말이에요.
          @pose gpa idle
          > 순이가 꿀차를 두 잔 탔다. 그리고 몰래, 내 입가에도 꿀을 콕.
          @emote gpa ?
          gpa: …곰한테도 주오?
          suni: 곰돌이는 저보다 꿀을 더 좋아해요.
          gpa: 허. 그럼 꿀을 두 배로 사 와야겠군.
          @wait 1
          gpa: 그리고… 뒤뜰 감나무에 그네를 하나 매어 놨소.
          suni: 그네요?
          gpa: 나중에 우리 애 생기면 태워 주려고. 재봉틀도 하나 들였소. 헌 거지만.
          @emote suni ♥
          suni: …당신은 말은 없는데, 할 일은 다 해 놓네요.
          gpa: 말은 당신이 해 주면 되지.
          @wait 1.5
        `,
        after: s`
          nabi: 할머니 재봉틀… 할아버지가 들여놓은 거였어.
          ruru: 내 꼬리도, 나비 너도, 다 그 재봉틀에서 나왔잖아.
          bori: 할아버지는 하루를 못 만나셨지만, 그 재봉틀로 우리를 조금씩 만나신 거야.
          toby: …그 그네는?
          bori: 은주가 제일 많이 탔지. 할아버지가 밀고, 할머니가 꿀차 들고 구경하고.
        `,
      },
      {
        kind: 'memory',
        id: 'mOd',
        at: [13, 3],
        name: '은주의 곰',
        caption: '「밤엔 은주 친구, 낮엔 엄마 친구」',
        scene: s`
          @room m_br_house
          @show suni suni40 5 8 right
          @show eunju eunju6 9 8 left hold
          @music waltz
          > 순이, 마흔 무렵. 여섯 살 은주가 나를 품에 안고 놓지 않았다.
          eunju: 엄마, 이 곰 나 줘! 나 줘!
          suni: 곰돌이는 엄마 친구야. 엄마가 너만 할 때부터.
          eunju: 엄마는 다 컸잖아! 다 크면 곰 없어도 되잖아!
          @emote suni …
          suni: 다 커도… 친구는 필요하단다.
          @emote eunju tear
          eunju: 그럼 나는? 나 무서운 꿈 꾸면?
          @wait 1
          @walk suni 8 8 50
          suni: 그럼 이렇게 하자. 밤엔 은주 친구, 낮엔 엄마 친구.
          @emote eunju !
          eunju: 진짜? 오늘 밤부터?
          suni: 오늘 밤부터. 대신 곰돌이한테 꿀 나눠 줘야 한다.
          > 그날 밤, 은주는 숟가락째 꿀을 내 귀에 발라 주었다. 왼쪽 귀의 얼룩은 그때 생겼다.
          suni: 아이고, 귀로 먹는 곰이 어디 있니.
          eunju: 귀가 배고프대!
          @wait 1.5
        `,
        after: s`
          ruru: 잠깐. 엄마도 보리를 안고 잤다고? 하루 엄마가?
          bori: 은주는 열 살 넘어서까지 나를 안고 잤어. 비밀이야.
          nabi: 그런데 하루한테는 「다 컸으니 인형은 정리해야지」라고 했잖아.
          bori: 은주도 알아. 다 컸다고 다 잊는 건 아니라는 거. 그래서 그 말 할 때, 하루 얼굴을 못 봤던 거야.
          @emote bori ♪
          bori: 귀 얼룩은 지금도 있어. 가끔 꿀 냄새도 나.
        `,
      },
      {
        kind: 'memory',
        id: 'mOe',
        at: [22, 3],
        name: '빈 의자 앞의 꿀차',
        caption: '「꿀처럼… 마음이 달콤해지라고」',
        scene: s`
          @room m_br_house_n
          @show suni suni40 8 7 up sit
          @music minor
          > 은주가 스무 살 되던 해 겨울. 할아버지는 긴 잠에 들었다.
          > 장례를 치르고 돌아온 밤. 사람들이 다 돌아간 집은 너무 넓었다.
          @show mom mom 2 4 right
          mom: 엄마… 좀 누워요. 사흘을 못 잤잖아.
          suni: 그래. 너 먼저 자라. 엄마는 차 한 잔만.
          @hide mom
          @wait 1
          > 순이는 꿀차를 두 잔 탔다. 한 잔은 자기 앞에, 한 잔은 빈 의자 앞에.
          @wait 1.5
          suni: …당신은 말이 없더니, 가는 것도 말없이 가네요.
          @emote suni tear
          @pose suni hold
          > 순이가 나를 끌어안았다. 그 오랜 세월 동안, 이렇게 세게 안은 적은 없었다.
          suni: 곰돌아. 엄마가 그랬지. 속상할 땐 꿀 한 숟갈.
          suni: 꿀처럼… 마음이 달콤해지라고.
          @pose suni cry
          @wait 1.5
          > 그날 밤 순이는 꿀차를 한 모금도 마시지 못했다. 나는 순이 눈물에 젖어, 아침까지 마르지 않았다.
          @wait 2
        `,
        after: s`
          @emote toby …
          toby: 두 잔의 꿀차… 하루도 똑같이 했어. 할머니 없는 방에서.
          nabi: 하루는 그걸 할머니한테 배운 적 없는데.
          bori: 응. 아무도 안 가르쳐 줬는데 똑같이 했어. 그날 하루 방에서, 나 깜짝 놀랐어.
          ruru: …꿀 얘기만 나오면 보리 목소리가 작아지네.
          bori: 꿀은 원래 조용히 먹는 거야.
        `,
      },
      {
        kind: 'memory',
        id: 'mOf',
        at: [26, 15],
        name: '곰돌이의 마지막 밤',
        caption: '「하루가 이름을 새로 지어 줄 거다」',
        scene: s`
          @room m_gm_n
          @show gm grandma 6 6 down sit
          @music box
          > 하루가 네 살 되던 해. 토비가 하루 품에 안긴 날 밤.
          > 할머니는 늦게까지 불을 켜 두고, 나를 무릎에 앉혔다.
          gm: 곰돌아. 오늘 하루가 토비를 얼마나 좋아하던지 봤니?
          gm: 이름을 부르고, 또 부르고. 백 번은 불렀을 거다.
          @sfx stitch
          > 할머니가 헐거워진 내 단추 눈을 다시 단단히 꿰맸다.
          gm: 이제 눈 떨어질 걱정은 없다. 하루가 아무리 세게 끌어안아도.
          @wait 1
          gm: 내일부턴 하루 친구 해 다오. 할머니 친구는 오늘까지다.
          gm: 하루는 어둠도 무섭고, 혼자 자는 것도 무섭고… 무서운 게 많은 애란다.
          gm: 그러니까 곰돌아. 이제 하루를 지켜 다오.
          @wait 1.5
          gm: 아마 하루가 이름을 새로 지어 줄 거다. 곰돌이보다 훨씬 예쁜 이름으로.
          @emote gm …
          gm: 서운해하지 마라. 곰돌이라는 이름은… 할머니가 가져가마.
          > 할머니가 마지막으로 내 입가에 꿀을 콕 묻혔다. 예순 해 전, 그날처럼.
          gm: 맛있게 먹고, 하루 잘 부탁한다.
          @wait 2
        `,
        after: s`
          @emote bori tear
          bori: …그래서 하루가 「보리」라고 불렀을 때, 할머니가 그렇게 웃으셨구나.
          ruru: 곰돌이. 풉. …아니, 좋은 이름이야. 진짜로.
          toby: 할머니가 나한테 하루 태엽을 맡기셨듯이, 보리한테는 하루를 맡기셨네.
          bori: 응. 나는 약속을 두 번 받았어. 순이한테 한 번, 할머니한테 한 번.
          nabi: 같은 사람이잖아.
          bori: 응. 같은 사람. 일곱 살 때부터 쭉.
        `,
      },
      {
        kind: 'link',
        id: 'lO',
        at: [24, 12],
        name: '꿀단지와 단추',
        icon: 'jar',
        locked: s`bori: 아직 꿀 냄새가 남아 있어. 냄비 너머, 찬장 구석구석 찾아보자.`,
        scene: s`
          @bars on
          > 찬장 맨 안쪽, 작은 꿀단지 하나. 뚜껑에 실로 묶인 단추 두 개가 매달려 있다.
          @emote bori !
          bori: 이거… 내 눈이랑 똑같은 단추야.
          nabi: 여벌 눈이네. 할머니가 혹시 몰라 남겨 두신 거야.
          bori: 할머니는 단추를 늘 재봉 상자에 모아 두셨어. 다락방 구석, 그 낡은 상자에.
          toby: 태엽 할머니도 거기서 기다리고 계셔.
          ruru: 하루 이야기, 보리 이야기… 이제 남은 건?
          toby: 할머니 이야기. 할머니가 아무한테도 말 안 하고 혼자 지킨 이야기.
          @emote bori …
          bori: 가자. 꿀단지는… 돌아와서 마저 볼게.
          > 상징물에 깃든 기억이 흐트러져 있다. 조각을 맞춰야 다음 기억으로 이어진다.
          @mini memento15
          @sfx open
          @flag chO_done
          @sfx memory
          @fade 1 1.4 white
          @next
        `,
      },
      { kind: 'gap', id: 'gO', at: [5, 8], tiles: [[5, 7]] },
      { kind: 'block', id: 'bO', at: [19, 9], look: 'pot' },
      {
        kind: 'trigger',
        id: 'tOgap',
        rect: [2, 8, 7, 2],
        unless: 'gap_gO',
        scene: s`ruru: 꿀단지가 저 위 선반에 있어. 틈에 밧줄 건다!`,
      },
      {
        kind: 'trigger',
        id: 'tOpot',
        rect: [16, 8, 3, 3],
        unless: 'mem_mOe',
        scene: s`
          bori: 냄비가 길을 막았네. 이건 내 일이지.
          bori: 냄비 왼쪽에서 밀게!
        `,
      },
      { kind: 'star', id: 'sOa', at: [8, 1], text: '꿀단지 뚜껑 위의 종이별.' },
      { kind: 'star', id: 'sOb', at: [17, 16], text: '밥그릇 사이에 낀 종이별.' },
      { kind: 'star', id: 'sOc', at: [28, 1], text: '보리차 깡통 뒤의 종이별.' },
      { kind: 'star', id: 'sOd', at: [28, 16], text: '쌀 포대 주름 사이의 종이별.' },
      {
        kind: 'spot',
        id: 'o_honey',
        at: [2, 4],
        scene: s`
          > 커다란 꿀단지. 뚜껑이 살짝 열려 있다.
          @emote bori ♥
          bori: 한 입만…
          nabi: 보리. 장난감은 꿀 못 먹어.
          bori: 알아. 냄새만 먹는 거야. 예순 해째 그렇게 먹고 있어.
        `,
      },
      {
        kind: 'spot',
        id: 'o_rice',
        at: [8, 12],
        scene: s`
          > 쌀 포대가 벽처럼 기대어 서 있다.
          ruru: 푹신해 보여. 보리 배만큼.
          bori: 내 배가 더 푹신해. 은주가 보증했어.
        `,
      },
      {
        kind: 'spot',
        id: 'o_bowls',
        at: [15, 7],
        scene: s`
          > 밥그릇이 탑처럼 쌓여 있다. 맨 위 작은 그릇에 삐뚤빼뚤한 글씨, 「하루」.
          toby: 하루 밥그릇이다.
          bori: 그 밑엔 은주 그릇, 그 밑엔 할머니 그릇. 맨 아래 있는 게 제일 오래된 거야.
          nabi: 그릇도 차례로 쌓이는구나. 사람처럼.
        `,
      },
      {
        kind: 'spot',
        id: 'o_tea',
        at: [21, 16],
        scene: s`
          > 보리차 깡통. 구수한 냄새가 난다.
          bori: 하루가 이거 보고 내 이름을 지었어. 내 색이랑 똑같다고.
          ruru: 나란히 서 봐. …어, 진짜 똑같네.
          toby: 곰돌이보다 보리가 더 보리 같아.
          bori: 그게 무슨 말이야…
        `,
      },
      {
        kind: 'spot',
        id: 'o_spoon',
        at: [26, 6],
        scene: s`
          > 오래된 놋숟가락 하나. 손잡이가 닳아 반들반들하다.
          bori: 할머니 꿀 숟가락. 순이 엄마가 쓰던 걸 할머니가 물려받으셨어.
          toby: 숟가락도 대물림하는구나.
          bori: 응. 꿀 한 숟갈도.
        `,
      },
    ],
  });
}

/** 순이가 자란 옛집과, 시집가서 살던 집 (사람 크기) */
const W = 18;
const H = 11;

export const CUPBOARD_MEMROOMS: Record<string, () => RoomDef> = {
  // 순이의 옛집 (낮): 순이 엄마의 바느질 자리
  m_br_home: () =>
    house('m_br_home', 'oldhome', W, H, [
      ['door', 1, 1, 1, 2],
      ['window:day', 7, 0, 3, 2],
      ['sewing:thread', 2, 3, 3, 1, true],
      ['wardrobe', 13, 3, 2, 1, true],
      ['rug:#c89a6a', 5, 5, 6, 3],
      ['cushion', 12, 7, 2, 2],
      ['plant', 16, 3, 1, 1, true],
    ]),
  // 순이의 옛집 (밤): 시집가기 전날
  m_br_home_n: () =>
    house('m_br_home_n', 'oldhomeNight', W, H, [
      ['door', 1, 1, 1, 2],
      ['window:night', 7, 0, 3, 2],
      ['sewing:thread', 2, 3, 3, 1, true],
      ['wardrobe', 13, 3, 2, 1, true],
      ['rug:#a8805a', 5, 5, 6, 3],
      ['boxes:tape', 12, 7, 1, 1, true],
    ]),
  // 순이와 할아버지의 집 (낮): 꿀차 상 · 새로 들인 재봉틀
  m_br_house: () =>
    house('m_br_house', 'oldhome', W, H, [
      ['door', 1, 1, 1, 2],
      ['window:day', 4, 0, 3, 2],
      ['clock', 12, 0, 2, 2],
      ['table:tea', 7, 5, 4, 2, true],
      ['sewing:thread', 13, 3, 3, 1, true],
      ['rug:#b88a5a', 6, 7, 6, 2],
      ['plant', 16, 3, 1, 1, true],
    ]),
  // 같은 집 (밤): 할아버지가 떠난 날
  m_br_house_n: () =>
    house('m_br_house_n', 'oldhomeNight', W, H, [
      ['door', 1, 1, 1, 2],
      ['window:night', 4, 0, 3, 2],
      ['clock', 12, 0, 2, 2],
      ['photo', 9, 0, 2, 2],
      ['table:tea', 7, 5, 4, 2, true],
      ['sewing:thread', 13, 3, 3, 1, true],
      ['rug:#8a6a4a', 6, 7, 6, 2],
    ]),
};
