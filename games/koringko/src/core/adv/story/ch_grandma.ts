/** 할머니의 재봉 상자 (할머니가 혼자 지킨 비밀) — 엔딩 바로 앞 */
import { s } from '../parse.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { grid, toyRoom } from './kit.ts';

const MAP = grid(30, 18, 'a', 'K', [
  ['K', 9, 1, 1, 7],
  ['K', 9, 9, 1, 8],
  ['a', 9, 12, 1, 1],
  ['v', 20, 1, 1, 16],
  ['O', 4, 4, 2, 2],
  ['O', 14, 5, 1, 1],
  ['O', 15, 12, 2, 1],
  ['O', 25, 9, 1, 2],
]);

export const CH_GRANDMA: Chapter = {
  n: 0,
  title: '0장 · 할머니의 재봉 상자',
  sub: '할머니가 혼자 지킨 이야기',
  room: 'sewbox',
  start: [13, 15],
  party: ['toby', 'bori', 'ruru', 'nabi'],
  wind: 0.1,
  intro: s`
    @fade 1 0 white
    @bars on
    @music night
    @chtitle
    @fade 0 2
    > 다락방 구석, 할머니의 낡은 재봉 상자. 뚜껑 틈으로 들어오자 실패와 천 조각이 언덕처럼 쌓여 있다.
    doll: 잘 왔구나.
    @face toby doll
    toby: 태엽 할머니? 다락방에서 기다리신다더니.
    doll: 여긴 다락방 안이란다. 내가 태어난 곳이기도 하고.
    doll: 너희는 하루의 기억을 다 보았지. 그런데 하루가 모르는 기억이 아직 남아 있어.
    nabi: 하루가 모르는 기억?
    doll: 할머니의 기억. 할머니가 혼자 지킨 것들. 이 상자 안에 실처럼 감겨 있단다.
    doll: 하루에게 전해 줄 수 있는 건 너희뿐이야. 보고 오렴.
    @emote toby sweat
    > 토비의 태엽이 아주 느리게, 끼…릭, 끼…릭.
    bori: 토비, 괜찮아?
    toby: …응. 이번엔 정말 서두를게.
    @bars off
    @goal 할머니의 기억 일곱 개를 찾자
  `,
};

export function sewboxRoom(): RoomDef {
  return toyRoom('sewbox', MAP, {
    name: '할머니의 재봉 상자',
    theme: 'village',
    start: [13, 15],
    music: 'night',
    ambient: [110, 92, 120],
    lights: [{ at: [11, 13], r: 70, color: [255, 200, 160], k: 0.35 }],
    things: [
      {
        kind: 'npc',
        id: 'doll',
        at: [11, 13],
        actor: 'grandoll',
        dir: 'down',
        scene: s`
          @if seen_doll
            doll: 실패 너머, 깜깜한 데까지 다 둘러보렴. 할머니는 숨기는 걸 잘했단다. …숨바꼭질만 빼고.
          @else
            doll: 이 상자는 할머니가 마흔 해 동안 쓰신 상자란다. 하루 옷도, 너희 꼬리도, 다 여기서 꿰맸지.
          @end
        `,
      },
      {
        kind: 'memory',
        id: 'mGa',
        at: [3, 2],
        name: '진찰실',
        caption: '「손녀가 열한 살이에요. 중학교 들어가는 건 보고 싶네요」',
        scene: s`
          @room m_clinic
          @show gm grandma 8 5 up sit
          @music minor
          > 동네 의원, 진찰실 안. 하루가 문밖 의자에서 기다리던 그날.
          > 의사 선생님이 사진을 오래 들여다보다가, 낮은 목소리로 말했다.
          > 「큰 병원에 가 보셔야겠습니다. 폐에…」
          @wait 1.5
          gm: …얼마나 남았나요.
          > 선생님은 바로 대답하지 못했다.
          @wait 1.5
          gm: 손녀가 열한 살이에요. 문밖에 앉아 있어요.
          gm: 중학교 들어가는 건… 보고 싶네요. 교복 입은 거.
          @wait 1.5
          gm: 그리고 선생님. 저 애한테는, 감기라고 해 주세요.
          @wait 1.5
        `,
        after: s`
          @emote toby …
          toby: 그날… 하루는 문밖에서 떡볶이 생각을 하고 있었어.
          nabi: 할머니는 문 안에서 다 들으셨고.
          ruru: 그러고 나와서 "괜찮대"라고… 웃으면서.
          bori: 떡볶이 한 입도 안 드신 이유가 그거였구나.
        `,
      },
      {
        kind: 'memory',
        id: 'mGb',
        at: [6, 14],
        name: '비밀로 해 다오',
        caption: '「하루 웃는 얼굴, 조금만 더 오래 보고 싶다」',
        scene: s`
          @room m_gm_n
          @show gm grandma 7 6 down sit
          @show mom mom 9 6 left
          @music minor
          > 그날 밤. 할머니 방.
          mom: 어머니, 왜 이제 말씀하세요… 큰 병원 가요, 내일 당장.
          gm: 갈게. 가 볼게. 대신 하나만.
          gm: 하루한텐 말하지 마라.
          mom: 어머니…
          gm: 그 애는 다 얼굴에 써 있는 애야. 알면 매일 울 거다. 학교 가서도, 밥 먹다가도.
          gm: 할머니는… 그 애 웃는 얼굴, 조금만 더 오래 보고 싶다.
          @wait 1.5
          mom: …알겠어요.
          gm: 고맙다. 그리고 미안하다. 너한테만 짐을 지워서.
          @wait 1.5
        `,
        after: s`
          ruru: 엄마는 알고 있었어. 처음부터.
          nabi: 그래서 엄마가 하루한테 "할머니 방 정리할까?"라고 몇 번이나 물었던 거야. 엄마도 같이 아팠으니까.
          bori: 다들 서로를 위해서 숨겼어.
          toby: 숨기는 건… 사랑이었구나. 그런데 너무 무거운 사랑.
        `,
      },
      {
        kind: 'memory',
        id: 'mGc',
        at: [16, 2],
        name: '눈을 뜬 인형',
        caption: '「너는 내가 없을 때 하루 곁에 있어 다오」',
        scene: s`
          @room m_gm_n
          @show gm grandma 3 4 up sit
          @music box
          > 한밤중. 재봉틀 등불 아래, 할머니가 작은 인형에 마지막 바늘땀을 넣었다.
          gm: 콜록… 콜록. 다 됐다.
          gm: 하얀 머리, 동그란 안경, 보라 카디건. 할머니랑 똑같지?
          @wait 1
          gm: 너는 내가 없을 때 하루 곁에 있어 다오.
          gm: 그리고 저 장난감 녀석들. 하루가 태엽 감는 걸 잊으면… 네가 대신 감아 주렴.
          @wait 1.5
          gm: 마음이 있으면 다 할 수 있단다. 할머니 마음, 여기 다 꿰매 넣었으니까.
          @sfx sparkle
          > 그 순간, 인형의 단추 눈이 반짝— 하고 빛났다.
          gm: …허허. 눈을 떴구나.
          @wait 2
        `,
        after: s`
          @face toby doll
          toby: 태엽 할머니…
          doll: 그래. 그날 밤 내가 처음 본 건 할머니 얼굴이었단다. 웃고 있었지. 기침을 하면서.
          doll: 그때부터 나는 할머니의 마음이야. 조금이지만.
          ruru: 그래서 우리를 깨운 거예요? 할머니 대신?
          doll: 할머니가 부탁하셨으니까. "태엽 좀 감아 주렴."
        `,
      },
      {
        kind: 'memory',
        id: 'mGd',
        at: [24, 3],
        dark: true,
        name: '찢어진 편지지',
        caption: '쓰고 구기고, 또 쓰고',
        scene: s`
          @room m_hospital_n
          @music minor
          > 병실의 밤. 침대 위 탁자에 구겨진 편지지가 쌓여 간다.
          gm: 열다섯 살 하루에게. 할머니가 없어도 슬퍼하지 마라…
          gm: …아니야. 슬퍼하지 말라니. 그건 너무 어려운 부탁이지.
          @sfx tape
          > 구깃.
          gm: 열다섯 살 하루에게. 할머니는 하늘에서…
          gm: …아니야. 하늘 얘기는 그 애 더 울린다.
          > 구깃.
          @wait 1.5
          gm: 그냥… 하고 싶은 말을 쓰자.
          gm: 태엽은 천천히 감아야 오래 간단다. 슬픔도 그래…
          > 이번 편지는, 구기지 않았다.
          @wait 2
        `,
        after: s`
          bori: 할머니도 몇 번이나 다시 썼구나.
          nabi: 하루가 열지 못한 그 편지. 할머니가 제일 오래 쓴 편지였어.
          toby: 하루가 읽어야 해. 꼭.
        `,
      },
      {
        kind: 'memory',
        id: 'mGe',
        at: [26, 15],
        dark: true,
        name: '토비에게',
        caption: '「내 태엽은 곧 멈출 거란다. 하루 태엽은 네가 감아 주렴」',
        scene: s`
          @room m_room12
          @show gm grandma 11 7 up
          @music box
          > 하루가 학교에 간 오후. 퇴원했던 짧은 며칠. 할머니가 하루 방 장난감 상자 앞에 앉았다.
          @pose gm hold
          gm: 토비야.
          @wait 1
          gm: 할머니 태엽은 이제 곧 멈출 거란다. 의사 선생님이 그러더라. 이번 겨울은 넘기기 어렵겠다고.
          gm: 할머니는 괜찮아. 많이 웃었으니까. 주름이 이렇게 많잖니.
          @wait 1.5
          gm: 그런데 하루 태엽은… 할머니가 없으면 멈춰 버릴지도 몰라.
          gm: 그 애는 슬프면 다 상자에 넣어 버리는 애거든. 자기 마음까지.
          @wait 1.5
          gm: 그러니까 토비야. 하루 태엽은 네가 감아 주렴.
          gm: 매일이 아니어도 돼. 그 애가 잊어버렸을 때, 한 번만.
          @pose gm idle
          @wait 2
        `,
        after: s`
          @emote toby !
          toby: …"하루 태엽은 네가 감아 주렴."
          toby: 그래서였어. 태엽이 거의 다 풀렸는데도 내가 깨어난 건.
          toby: 내 태엽이 멈추기 전에… 하루 태엽을 감아 줘야 해서.
          nabi: 「태엽이 멈추기 전에」. 할머니의 부탁이었구나.
          bori: 우리 할 일, 이제 확실해졌다.
          ruru: 가자. 새벽이 오기 전에.
        `,
      },
      {
        kind: 'memory',
        id: 'mGf',
        at: [27, 7],
        name: '마지막 산책',
        caption: '「밥 잘 먹고, 잘 웃고, 가끔 울고」',
        scene: s`
          @room m_yard_d
          @show gm grandma 6 6 right
          @show haru haru12 7 6 right
          @music piano
          > 퇴원했던 며칠 중 하루. 가을볕이 좋은 오후, 할머니가 하루의 팔짱을 꼈다.
          @walk gm 12 6 20 nowait
          @walk haru 13 6 20
          gm: 하루야.
          haru: 응.
          gm: 할머니가 없어도, 밥 잘 먹고.
          haru: …왜 그런 말 해.
          gm: 잘 웃고. 가끔은 울고.
          haru: 할머니.
          gm: 우는 것도 중요해. 다 참으면 마음이 녹슬거든. 태엽처럼.
          @wait 1.2
          haru: 할머니 어디 가?
          gm: 그냥. 오늘 날씨가 너무 좋아서. 하고 싶은 말이 생각났어.
          @wait 1
          > 낙엽이 하나, 둘. 둘은 아주 천천히 마당을 한 바퀴 더 걸었다.
          @walk gm 16 6 15 nowait
          @walk haru 17 6 15
          @wait 2
        `,
        after: s`
          nabi: 가끔은 울고.
          toby: 하루는 그 말을 반만 지켰어. 혼자서만 울었으니까.
          bori: 누구 앞에서 울어도 괜찮다는 걸 알려 주자. 우리 앞에서.
          ruru: 그리고 웃는 것도. 둘 다.
        `,
      },
      {
        kind: 'link',
        id: 'lG',
        at: [11, 10],
        name: '할머니의 바늘',
        icon: 'needle',
        locked: s`doll: 아직 할머니의 기억이 남아 있단다. 깜깜한 데까지 찾아보렴.`,
        scene: s`
          @bars on
          doll: 다 보았구나.
          toby: 할머니는… 다 알고 계셨어요. 그래도 끝까지 웃으셨어요.
          doll: 그래. 그게 할머니란다.
          doll: 이제 새벽이 온다. 하루가 마지막 짐을 가지러 올 거야.
          doll: 가자, 다락방으로. 내 태엽도 이제 얼마 남지 않았지만… 할 일이 하나 남았단다.
          @emote toby ?
          > 상징물에 깃든 기억이 흐트러져 있다. 조각을 맞춰야 다음 기억으로 이어진다.
          @mini memento19
          @sfx open
          @flag chg_done
          @sfx memory
          @fade 1 1.6 white
          @next
        `,
      },
      { kind: 'block', id: 'bG', at: [9, 12], look: 'spool' },
      { kind: 'gap', id: 'gG', at: [19, 8], tiles: [[20, 8]] },
      {
        kind: 'trigger',
        id: 'tGspool',
        rect: [10, 11, 3, 3],
        unless: 'mem_mGb',
        scene: s`bori: 실패가 왼쪽 칸을 막고 있어. 오른쪽에서 밀게!`,
      },
      {
        kind: 'trigger',
        id: 'tGgap',
        rect: [17, 6, 3, 5],
        unless: 'gap_gG',
        scene: s`
          ruru: 천 조각 사이 틈. 마지막 밧줄이다!
          nabi: 저 너머는 깜깜해. 내 등불, 마지막까지 밝힐게.
        `,
      },
      { kind: 'star', id: 'sGa', at: [1, 1], text: '단추 상자 속 종이별.' },
      { kind: 'star', id: 'sGb', at: [28, 1], text: '골무 안에 들어 있던 종이별.', dark: true },
      { kind: 'star', id: 'sGc', at: [1, 16], text: '천 조각 사이 종이별.' },
      { kind: 'star', id: 'sGd', at: [28, 16], text: '할머니 안경집 속 종이별.', dark: true },
      {
        kind: 'spot',
        id: 'buttons',
        at: [13, 3],
        scene: s`
          > 단추 상자. 짝 잃은 단추들 사이에, 토끼 모양 단추 하나.
          toby: 내 눈 단추 예비야. 할머니는 늘 하나씩 남겨 두셨어.
        `,
      },
      {
        kind: 'spot',
        id: 'measure',
        at: [16, 9],
        scene: s`
          > 줄자에 볼펜으로 표시가 잔뜩 되어 있다. 「하루 4살」 「하루 7살」 「하루 10살」 「하루 12살」…
          bori: 하루 키 잰 거야. 할머니가 매년.
          nabi: 12살 다음은… 없어.
        `,
      },
      {
        kind: 'spot',
        id: 'scrap',
        at: [5, 9],
        scene: s`
          > 노란 천 조각. 하루 비옷이랑 같은 천이다.
          ruru: 할머니는 하루 옷 남은 천으로 우리 옷을 기워 주셨지. 나비 모자 안감도 이거야.
          nabi: …몰랐어.
        `,
      },
      {
        kind: 'spot',
        id: 'pincushion',
        at: [23, 13],
        scene: s`
          > 토마토 모양 바늘꽂이. 바늘 하나에 빨간 실이 꿰어진 채다.
          doll: 할머니가 마지막으로 꿴 실이란다. 아무도 빼지 못했지.
        `,
      },
    ],
  });
}
