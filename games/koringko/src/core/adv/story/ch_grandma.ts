/** 할머니의 재봉 상자 (할머니가 혼자 지킨 비밀) — 엔딩 바로 앞 */
import { s } from '../parse.ts';
import type { Chapter, Cmd, Pt, RoomDef, Thing } from '../types.ts';
import { toyRoom } from './kit.ts';
import { SB, SEWBOX_FURN, SEWBOX_LIGHTS, sewboxTiles } from './layout_e.ts';

/*
 * 근접 지도 (36×22, story/layout_e.ts): 재봉 상자 속. 나무 칸막이로 네 칸 — 실패 칸(시작) · 단추 칸 · 천 조각 칸 · 바늘 칸(깜깜).
 * 놀이 (REDESIGN §7 20장):
 *  1. 엉킨 실 따라가기 — 노란 실 한 가닥이 상자를 지난다. 매듭 다섯을 차례로, 실이 들어온 반대쪽으로 넘겨 푼다 (위로 넘기 · 밑으로 지나기).
 *     매듭을 풀 때마다 그 자리의 기억 물건이 드러난다 (골무 아재가 규칙을 귀띔: 한 땀 위, 한 땀 아래).
 *  2. 단추 맞추기 — 단추 칸의 단추 산에서 태엽 할머니의 여분 눈 단추(까맣고 동그란, 구멍 둘) 둘을 보리와 날라 맞춘다 (part · assemble).
 *     단추 칸 ↔ 바늘 칸 사이는 바닥 틈 (루루 밧줄), 바늘 칸은 깜깜해서 나비 등불 (lantern).
 *  3. 마지막 땀 — 실 끝을 바늘꽂이의 바늘에 묶는다 (@mini sew) → 노란 털실 끝 (mGg) → 할머니의 바늘 (link).
 */

export const CH_GRANDMA: Chapter = {
  n: 0,
  title: '0장 · 할머니의 재봉 상자',
  sub: '할머니가 혼자 지킨 이야기',
  room: 'sewbox',
  start: SB.start,
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
    @sfx windTick
    > 토비의 태엽이 아주 느리게, 끼…릭, 끼…릭.
    @act toby tremble
    bori: 토비, 괜찮아?
    @act toby nod nowait
    toby: …응. 이번엔 정말 서두를게.
    @bars off
    @goal 할머니가 혼자 엉킨 실을 풀어, 마지막 바늘땀까지 가자 · 노란 실을 따라가자
  `,
};

export function sewboxRoom(): RoomDef {
  const room = toyRoom('sewbox', sewboxTiles(), {
    name: '할머니의 재봉 상자',
    theme: 'village',
    start: SB.start,
    music: 'longing',
    ambient: [104, 84, 110],
    // 뚜껑 틈의 새벽빛 줄기 (분홍 · 푸름)
    beams: [
      { x: 6, w: 3, h: 7, slant: 2 },
      { x: 24, w: 3, h: 7, slant: 2 },
    ],
    lights: SEWBOX_LIGHTS,
    things: [
      {
        kind: 'npc',
        id: 'doll',
        at: SB.doll,
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
        at: [2, 6],
        name: '진찰실',
        caption: '「손녀가 열한 살이에요. 중학교 들어가는 건 보고 싶네요」',
        scene: s`
          @room m_clinic
          @show gm grandma 8 5 up sit
          @music minor
          @sfx clock
          > 동네 의원, 진찰실 안. 하루가 문밖 의자에서 기다리던 그날.
          @sfx paper
          > 의사 선생님이 사진을 오래 들여다보다가, 낮은 목소리로 말했다.
          > 「큰 병원에 가 보셔야겠습니다. 폐에…」
          @sfx heartbeat
          @pose gm lookDown
          @wait 1.5
          gm: …얼마나 남았나요.
          > 선생님은 바로 대답하지 못했다.
          @wait 1.5
          @pose gm sit
          @act gm point
          gm: 손녀가 열한 살이에요. 문밖에 앉아 있어요.
          gm: 중학교 들어가는 건… 보고 싶네요. 교복 입은 거.
          @wait 1.5
          @act gm bow
          gm: 그리고 선생님. 저 애한테는, 감기라고 해 주세요.
          @sfx cough
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
        at: [13, 8],
        name: '비밀로 해 다오',
        caption: '「하루 웃는 얼굴, 조금만 더 오래 보고 싶다」',
        scene: s`
          @room m_gm_n
          @show gm grandma 7 6 down sit
          @show mom mom 9 6 left
          @music minor
          @sfx clock
          > 그날 밤. 할머니 방.
          @act mom stomp
          mom: 엄마, 왜 이제 말해… 큰 병원 가, 내일 당장.
          gm: 갈게. 가 볼게. 대신 하나만.
          gm: 하루한텐 말하지 마라.
          @act mom shake
          mom: 엄마…
          gm: 그 애는 다 얼굴에 써 있는 애야. 알면 매일 울 거다. 학교 가서도, 밥 먹다가도.
          gm: 할머니는… 그 애 웃는 얼굴, 조금만 더 오래 보고 싶다.
          @wait 1.5
          @act mom wipe
          @sfx sob
          mom: …알았어.
          @act gm pat
          @sfx pat
          gm: 고맙다. 그리고 미안하다. 너한테만 짐을 지워서.
          @pose mom lookDown
          @wait 1.5
        `,
        explore: {
          enter: [2, 9],
          intro: s`
            toby: 할머니 방. 하루가 열한 살이던 해, 의원에 다녀온 그날 밤이야.
            nabi: 할머니 혼자 지킨 기억에도 실이 있어. 하루가 못 본 실들.
          `,
          threads: [
            { at: [3, 4], text: s`
              > 재봉틀 옆, 천 조각 밑에 흰 약봉지가 반쯤 숨겨져 있다.
              ruru: 저 약봉지… 하루 눈에 띌 때마다 할머니가 "별거 아니다" 하던 거.
              nabi: 재봉틀 밑에 두셨구나. 하루가 혼자서는 절대 안 만지는 데.
            ` },
            { at: [12, 4], text: s`
              > 옷장 문에 걸린 작은 달력. 다음 주에 빨간 동그라미 하나. 글씨는 없다.
              bori: 그 동그라미, 하루가 물어본 적 있어. 할머니는 "할머니 계모임" 하고 웃으셨지.
              ruru: 할머니, 숨기는 거 진짜 잘하셨네. …숨바꼭질만 빼고.
            ` },
            { at: [1, 3], text: s`
              > 문틈으로 복도 끝, 하루 방의 불빛이 새어 든다. 아직 안 잤다.
              toby: 하루는 문 하나 너머에 있었어. 아무것도 모르고.
              @emote toby …
            ` },
          ],
          looks: [
            { at: [7, 5], text: s`
              > 할머니. 의원 봉투를 무릎 밑에 깔고 앉아 있다. 그래도 입꼬리는 올라가 있다.
              bori: 웃고 있어. 이런 밤에도.
            ` },
            { at: [9, 7], text: s`
              > 엄마. 입술을 꼭 깨문 채, 아직 아무 말도 하지 못했다.
              nabi: 하루 엄마가 저렇게 어린 딸 얼굴을 한 건… 처음 봐.
            ` },
          ],
        },
        after: s`
          ruru: 엄마는 알고 있었어. 처음부터.
          nabi: 그래서 엄마는 병원 복도에서 웃는 연습을 했던 거야. 하루 앞에서 들키지 않으려고.
          bori: 다들 서로를 위해서 숨겼어.
          toby: 숨기는 건… 사랑이었구나. 그런데 너무 무거운 사랑.
        `,
      },
      {
        kind: 'memory',
        id: 'mGc',
        at: [7, 6],
        name: '눈을 뜬 인형',
        caption: '「너는 내가 없을 때 하루 곁에 있어 다오」',
        scene: s`
          @room m_gm_n
          @show gm grandma 3 4 up sit
          @pose gm sew
          @music box
          @sfx clock
          > 하루가 태엽 할머니라고 이름을 지어 준 그날 밤. 하루가 잠든 뒤, 재봉틀 등불 아래서 할머니가 인형에 마지막 바늘땀을 넣었다.
          @sfx stitch
          @sfx cough
          @act gm shiver
          gm: 콜록… 콜록. 다 됐다.
          @sfx scissors
          @pose gm sit
          @carry gm doll
          @face gm down
          gm: 희끗한 쪽머리, 동그란 안경, 보라 카디건. 할머니랑 똑같지?
          @wait 1
          gm: 너는 내가 없을 때 하루 곁에 있어 다오.
          gm: 그리고 저 장난감 녀석들. 하루가 태엽 감는 걸 잊으면… 네가 대신 감아 주렴.
          @wait 1.5
          gm: 마음이 있으면 다 할 수 있단다. 할머니 마음, 여기 다 꿰매 넣었으니까.
          @sfx sparkle
          > 그 순간, 인형의 단추 눈이 반짝— 하고 빛났다.
          @act gm surprise
          gm: …허허. 눈을 떴구나.
          @act gm laugh nowait
          @wait 2
        `,
        explore: {
          enter: [8, 8],
          intro: s`
            toby: 또 할머니 방… 그런데 더 옛날이야. 하루가 열 살, 태엽 할머니한테 이름을 지어 준 날 밤.
            bori: 재봉틀 등불만 켜져 있어. 할머니가 뭘 만들고 계셔.
          `,
          threads: [
            { at: [5, 3], text: s`
              > 재봉틀 위, 거의 다 된 작은 인형. 희끗한 쪽머리, 동그란 안경, 보라 카디건. 단추 눈은 아직 흐릿하다.
              toby: 태엽 할머니다. …아직 눈을 안 떴어.
              ruru: 지금보다 머리카락이 훨씬 많네. 하루가 그동안 엄청 쓰다듬었구나.
            ` },
            { at: [2, 4], text: s`
              > 뒤집어 놓은 인형 카디건 안쪽. 바늘땀만큼 작은 글씨가 수놓여 있다. 「하루 곁에」— 그 뒤는 아직 꿰매는 중이다.
              nabi: 겉에서는 절대 안 보이는 자리야.
              bori: 할머니는 제일 중요한 말은 늘 안쪽에 쓰셨어. 하루 도시락 주머니 안쪽에도.
              ruru: 다 못 꿰매셨네. …누가 마저 꿰매 주려나.
            ` },
            { at: [1, 5], text: s`
              > 인형을 세워 둘 작은 받침대. 일부러 문 쪽으로 돌려 놓았다. 문 너머 복도 끝은 하루 방이다.
              toby: 태엽 할머니는… 늘 하루 쪽을 보고 있었어. 선반에서도, 상자 안에서도.
              ruru: 우연인 줄 알았는데. 처음부터 그쪽을 보게 만드신 거네.
            ` },
          ],
          looks: [
            { at: [3, 5], text: s`
              > 할머니. 안경을 코끝까지 내리고, 실을 입으로 끊으려던 참이다. 손수건 하나가 무릎에 구겨져 있다.
              bori: 그해부터였어. 하루가 감기라고 믿었던 그 기침.
            ` },
            { at: [9, 3], text: s`
              > 창밖 하늘에 별 둘. 하나는 작고, 하나는 그 옆에 바짝 붙어 있다.
              nabi: 하루 별이랑, 할머니 별.
            ` },
          ],
        },
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
        at: [2, 17],
        dark: true,
        name: '찢어진 편지지',
        caption: '쓰고 구기고, 또 쓰고',
        scene: s`
          @room m_hospital_n
          @show gm grandma 6 6 up sit
          @pose gm write
          @music sorrow
          @sfx clock
          > 그 뒤로 여러 밤. 처음 펼친 편지지는 끝을 맺지 못했다. 병실 탁자에 구겨진 편지지가 쌓여 간다.
          gm: 열다섯 살 하루에게. 할머니가 없어도 슬퍼하지 마라…
          gm: …아니야. 슬퍼하지 말라니. 그건 너무 어려운 부탁이지.
          @sfx crumple
          > 구깃.
          @sfx paper
          gm: 열다섯 살 하루에게. 할머니는 하늘에서…
          @act gm shake
          gm: …아니야. 하늘 얘기는 그 애 더 울린다.
          @sfx crumple
          > 구깃.
          @act gm sigh
          @sfx cough
          @wait 1.5
          @act gm think
          gm: 그냥… 하고 싶은 말을 쓰자.
          gm: 태엽은 천천히 감아야 오래 간단다. 슬픔도 그래…
          > 이번 편지는, 구기지 않았다.
          @sfx fold
          @pose gm sit
          @carry gm letter
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
        at: [20, 18],
        dark: true,
        name: '토비에게',
        caption: '「내 태엽은 곧 멈출 거란다. 하루 태엽은 네가 감아 주렴」',
        scene: s`
          @room m_room12
          @show gm grandma 11 7 down
          @music box
          @sfx rainRoof
          > 하루가 학교에 간 오후. 큰 병원에 입원하기 며칠 전. 할머니가 하루 방 장난감 상자 앞에 앉았다.
          @pose gm kneel
          @sfx cardboard
          @carry gm toby
          @face gm up
          gm: 토비야.
          @wait 1
          gm: 할머니 태엽은 이제 곧 멈출 거란다. 의사 선생님이 그러더라. 이번 겨울은 넘기기 어렵겠다고.
          gm: 할머니는 괜찮아. 많이 웃었으니까. 주름이 이렇게 많잖니.
          @act gm laugh nowait
          @wait 1.5
          gm: 그런데 하루 태엽은… 할머니가 없으면 멈춰 버릴지도 몰라.
          gm: 그 애는 슬프면 다 상자에 넣어 버리는 애거든. 자기 마음까지.
          @wait 1.5
          gm: 그러니까 토비야. 하루 태엽은 네가 감아 주렴.
          gm: 매일이 아니어도 돼. 그 애가 잊어버렸을 때, 한 번만.
          @sfx windTick
          @wait 1
          @face gm down
          @carry gm none
          @sfx cardboard
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
        at: [12, 18],
        name: '마지막 산책',
        caption: '「밥 잘 먹고, 잘 웃고, 가끔 울고」',
        scene: s`
          @room m_yard_d
          @show gm grandma 6 6 right
          @show haru haru12 7 6 right
          @music grandma
          @sfx wind
          > 입원하기 전, 마지막 가을. 볕이 좋은 오후, 할머니가 하루의 팔짱을 꼈다.
          @walk gm 12 6 20 nowait
          @walk haru 13 6 20
          gm: 하루야.
          @act haru nod nowait
          haru: 응.
          gm: 할머니가 없어도, 밥 잘 먹고.
          @face haru gm
          @act haru shake
          haru: …왜 그런 말 해.
          gm: 잘 웃고. 가끔은 울고.
          haru: 할머니.
          @face gm haru
          @act gm pat
          gm: 우는 것도 중요해. 다 참으면 마음이 녹슬거든. 태엽처럼.
          @wait 1.2
          haru: 할머니 어디 가?
          @act gm shrug
          gm: 그냥. 오늘 날씨가 너무 좋아서. 하고 싶은 말이 생각났어.
          @face gm right
          @face haru right
          @wait 1
          > 낙엽이 하나, 둘. 둘은 아주 천천히 마당을 한 바퀴 더 걸었다.
          @walk gm 16 6 15 nowait
          @walk haru 17 6 15
          @wait 2
        `,
        explore: {
          enter: [2, 4],
          intro: s`
            bori: 마당이다. 할머니가 입원하시기 전, 마지막 가을. 하루는 열두 살.
            ruru: 해가 좋다. …기억 속인데도 따뜻해.
          `,
          threads: [
            { at: [6, 5], text: s`
              > 할머니 손등. 카디건 소매를 끝까지 끌어내렸는데도, 파란 멍이 살짝 비친다.
              nabi: 병원에서 하루가 오는 날마다 소매를 내리셨잖아. 그 버릇, 입원하기 전부터였구나.
              ruru: 하루랑 팔짱 낀 쪽 팔만. 하루 눈에 안 띄게.
            ` },
            { at: [5, 6], text: s`
              > 할머니 카디건 주머니가 불룩하다. 사탕 두 알, 그리고 네 번 접은 쪽지 한 장.
              ruru: 사탕은 하루 거고… 쪽지는 뭐야?
              toby: 「밥」「웃기」「울기」. 할머니 글씨야. 오늘 할 말을 미리 적어 두셨어.
              bori: "날씨가 좋아서 생각났다"더니. …그래서였구나.
            ` },
            { at: [12, 4], text: s`
              > 공중에 멈춘 낙엽 한 장. 땅에 닿기 직전이다.
              toby: 이 낙엽이 떨어지면, 둘이 걷기 시작해. 마당을 두 바퀴.
              @emote toby …
            ` },
          ],
          looks: [
            { at: [7, 7], text: s`
              > 하루. 할머니 팔에 매달린 채, 발끝으로 낙엽을 차려던 참이다.
              bori: 할머니 팔이 이렇게 가는 줄… 하루는 몰랐어. 팔짱을 끼고도.
            ` },
          ],
        },
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
        at: SB.link,
        name: '할머니의 바늘',
        icon: 'needle',
        locked: s`doll: 아직 할머니의 기억이 남아 있단다. 깜깜한 데까지 찾아보렴.`,
        scene: s`
          @bars on
          doll: 다 보았구나.
          @act toby wipe nowait
          toby: 할머니는… 다 알고 계셨어요. 그래도 끝까지 웃으셨어요.
          @act doll nod nowait
          doll: 그래. 그게 할머니란다.
          doll: 이제 새벽이 온다. 하루가 마지막 짐을 가지러 올 거야.
          doll: 가자, 다락방으로. 내 태엽도 이제 얼마 남지 않았지만… 할 일이 하나 남았단다.
          @emote toby ?
          > 상징물에 깃든 기억이 흐트러져 있다. 조각을 맞춰야 다음 기억으로 이어진다.
          @mini photo5
          @sfx open
          @flag chg_done
          @sfx memory
          @fade 1 1.6 white
          @next
        `,
      },
      // ───────── 주민: 골무 아재 (할머니 손가락을 예순 해 지킨 골무, 할머니 병을 알던 증인)
      {
        kind: 'npc',
        id: 'thimble',
        at: SB.thimble,
        actor: 'thimbleMan',
        dir: 'down',
        scene: s`
          @if knot1
            thimble: 어흠. 들어온 반대쪽으로. 밑으로 들어왔으면 위로 넘기고, 위로 넘어왔으면 밑으로 지나게.
            thimble: 할머니는 그걸 혼자 밤마다 했지. 아무한테도 안 보이고.
          @else
            thimble: 어흠. 골무 아재라 부르게. 할머니 손가락을 예순 해 지켰지.
            thimble: 바늘이 찔러도 나는 안 아파. 그게 내 일이었지.
            thimble: 저 노란 실 말이다. 할머니가 혼자 엉킨 걸 풀다 만 거야.
            thimble: 매듭은 실이 들어온 반대쪽으로 넘겨야 풀린다. 한 땀 위, 한 땀 아래. 할머니 바느질이 늘 그랬지.
          @end
        `,
      },
      // ───────── 놀이 1: 엉킨 실 따라가기 (매듭 다섯, 차례로)
      ...SB.knots.map((at, i): Thing => knotSpot(i, at)),
      // ───────── 놀이 2: 단추 맞추기 (까맣고 동그란, 구멍 둘 · 무거워서 보리가 든다)
      { kind: 'part', id: 'eyeA', at: [23, 7], look: 'bigButton:black2', set: 'eyes', heavy: true },
      { kind: 'part', id: 'eyeB', at: [32, 6], look: 'bigButton:black2', set: 'eyes', heavy: true },
      {
        kind: 'assemble',
        id: 'dollEyes',
        at: SB.eyes,
        set: 'eyes',
        flag: 'doll_eyes',
        scene: s`
          @sfx put
          @face doll down
          doll: 그래, 이 단추들이란다. 할머니가 내 눈을 고를 때 제일 오래 고르신 단추.
          > 까맣고 동그란 단추 두 알이 나란히 놓였다. 할머니가 여분으로 남겨 둔 눈이다.
          @goal 마지막 바늘땀까지 · 실을 따라 바늘 칸으로
        `,
      },
      { kind: 'spot', id: 'btnRed', at: [19, 8], scene: s`
        > 빨간 단추. 구멍이 넷이다.
        nabi: 인형 눈은 까만색이었어.
      ` },
      { kind: 'spot', id: 'btnSquare', at: [24, 4], scene: s`
        > 까만 단추… 그런데 네모나다.
        ruru: 네모 눈은 좀 무섭다.
      ` },
      { kind: 'spot', id: 'btnFour', at: [33, 8], scene: s`
        > 까맣고 동그란 단추. 구멍이 넷.
        toby: 아깝다. 구멍이 둘이어야 해.
      ` },
      // ───────── 단추 칸 ↔ 바늘 칸: 바닥 틈 (루루 밧줄) · 바늘 칸은 깜깜 (나비 등불)
      { kind: 'gap', id: 'gG', at: SB.crack, tiles: [SB.crack] },
      {
        kind: 'trigger',
        id: 'tGgap',
        rect: [SB.crack[0] - 1, SB.crack[1] - 2, 3, 2],
        unless: 'gap_gG',
        scene: s`
          ruru: 천 조각 사이 틈. 마지막 밧줄이다!
          nabi: 저 너머는 깜깜해. 내 등불, 마지막까지 밝힐게.
        `,
      },
      // ───────── 놀이 3: 마지막 땀 (실 끝을 바늘꽂이의 바늘에)
      {
        kind: 'spot',
        id: 'lastStitch',
        at: SB.sew,
        when: 'knot5',
        unless: 'sewn',
        scene: s`
          @if doll_eyes
            > 바늘꽂이의 바늘. 빨간 실이 한 뼘 꿰인 채, 엉켰던 노란 실 끝이 그 옆에 매달려 있다.
            toby: 실 끝을 여기 묶어 주자. 할머니가 하던 대로. 한 땀 위, 한 땀 아래.
            bori: 다 같이 잡아. 바늘은 무거우니까.
            @mini sew
            @sfx stitch
            > 노란 실 끝이 바늘땀 하나로 단단히 묶였다. 상자를 가로지르던 엉킨 실이 한 줄로 팽팽해진다.
            @goal 마지막 바늘땀까지 · 할머니의 바늘에게
            @flag sewn
          @else
            doll: 그 전에… 내 눈 단추부터 찾아 주련? 단추 칸 어딘가에 있을 게다.
          @end
        `,
      },
      { kind: 'star', id: 'sGa', at: [34, 10], text: '단추 상자 속 종이별.' },
      { kind: 'star', id: 'sGb', at: [21, 20], text: '골무 안에 들어 있던 종이별.', dark: true },
      { kind: 'star', id: 'sGc', at: [1, 16], text: '천 조각 사이 종이별.' },
      { kind: 'star', id: 'sGd', at: [34, 20], text: '할머니 안경집 속 종이별.', dark: true },
      {
        kind: 'spot',
        id: 'buttons',
        at: [21, 6],
        scene: s`
          > 단추 상자. 짝 잃은 단추들 사이에, 토끼 모양 단추 하나.
          toby: 내 눈 단추 예비야. 할머니는 늘 하나씩 남겨 두셨어.
        `,
      },
      {
        kind: 'spot',
        id: 'measure',
        at: [14, 18],
        scene: s`
          > 줄자에 볼펜으로 표시가 잔뜩 되어 있다. 「하루 4살」 「하루 7살」 「하루 10살」 「하루 12살」…
          bori: 하루 키 잰 거야. 할머니가 매년.
          @act nabi lookAround
          nabi: 12살 다음은… 없어.
        `,
      },
      {
        kind: 'spot',
        id: 'scrap',
        at: [7, 17],
        scene: s`
          > 노란 천 조각. 하루 비옷이랑 같은 천이다.
          ruru: 할머니는 하루 옷 남은 천으로 우리 옷을 기워 주셨지. 나비 모자 안감도 이거야.
          nabi: …몰랐어.
        `,
      },
      {
        kind: 'spot',
        id: 'pincushion',
        at: [33, 13],
        scene: s`
          > 토마토 모양 바늘꽂이. 바늘 하나에 빨간 실이 꿰어진 채다.
          doll: 할머니가 마지막으로 꿴 실이란다. 아무도 빼지 못했지.
        `,
      },
    ],
  });
  return {
    ...room,
    furniture: SEWBOX_FURN,
    // 바늘 칸은 깜깜하다: 나비 등불이 천천히 줄어든다 (깜깜한 데만)
    lantern: { max: 4.5, min: 1.6, drain: 0.04, zones: [SB.needleRoom] },
    amb: [
      { name: 'roomTone', gain: 0.25 },
      { name: 'clockTick', gain: 0.12 },
      { name: 'birds', gain: 0.12, every: [9, 20] },
    ],
    // 푼 매듭은 풀린 고리로
    keepProps: SB.knots.map(([x, y], i) => ({ key: `yarnKnot@${x},${y}`, flag: `knot${i + 1}`, state: 'loose' })),
    hangouts: {
      bori: { at: [3, 8], pose: 'chinRest', dir: 'right', talk: s`
        @act bori lookAround nowait
        bori: 실패가 내 키만 해. 할머니 냄새가 나. 박하사탕 냄새.
        bori: 무거운 거 들 일 있으면 불러. 단추든 실패든.
      ` },
      ruru: { at: [25, 7], dir: 'down', talk: s`
        @act ruru peek nowait
        ruru: 이 상자, 바닥에 금이 갔어. 저 아래 바늘 칸으로 건너가야 할걸.
        ruru: 밧줄 필요하면 불러. 이번이 진짜 마지막 밧줄일지도.
      ` },
      nabi: { at: [9, 16], pose: 'sleepSit', dir: 'down', talk: s`
        @act nabi stretch nowait
        nabi: 천 조각 위는 푹신해. 할머니 무릎 같아.
        nabi: 깜깜한 데 갈 거면 불러. 등불은 아직 남았어.
      ` },
    },
  };
}

/** 엉킨 매듭: 실이 들어온 쪽 (0 위로 넘기 · 1 밑으로 지나기 가 정답), 풀면 드러나는 것, 바뀌는 목표 */
const KNOTS: { look: string; answer: 0 | 1; open: Cmd[] }[] = [
  {
    look: '> 노란 실이 실패에서 풀려 나와, 시침핀 밑으로 빠져나간 자리에서 엉켰다.',
    answer: 0,
    open: s`
      > 풀린 실 밑에서 접힌 흰 약봉지가 보인다.
    `,
  },
  {
    look: '> 실이 천 조각 위로 넘어와서, 여기서 매듭에 걸렸다.',
    answer: 1,
    open: s`
      > 천 조각 밑에 구겨진 편지지가 수북하다.
    `,
  },
  {
    look: '> 줄자 밑으로 들어간 실이, 눈금 하나에 꽁꽁 묶여 있다.',
    answer: 0,
    open: s`
      > 줄자가 스르르 풀리며 볼펜 눈금이 드러났다.
      doll: 얘들아. 단추 칸에 내 여분 눈 단추가 있을 게다. 까맣고 동그랗고, 구멍이 둘.
      doll: 무거우니 보리랑 같이 가렴.
      @goal 마지막 바늘땀까지 · 태엽 할머니의 여분 눈 단추를 찾자
    `,
  },
  {
    look: '> 바늘 칸 바닥. 실이 시침핀 위로 넘어와 엉켰다.',
    answer: 1,
    open: s`
      > 등불 아래, 하얀 천 조각 하나가 실에 걸려 있다.
    `,
  },
  {
    look: '> 바늘꽂이 바로 앞. 실이 바늘 밑으로 들어가 마지막 매듭을 지었다.',
    answer: 0,
    open: s`
      > 실 끝이 바늘꽂이의 바늘까지 이어져 있다.
      @goal 마지막 바늘땀까지 · 실 끝에 마지막 땀을 놓자
    `,
  },
];

/** 매듭 i (0부터): 앞 매듭을 풀어야 보이고, 고르기 (위로 넘기 · 밑으로 지나기) 로 푼다. 틀리면 더 엉키고 다시 */
function knotSpot(i: number, at: Pt): Thing {
  const k = KNOTS[i];
  const n = i + 1;
  return {
    kind: 'spot',
    id: `knot${n}_spot`,
    at,
    ...(i > 0 ? { when: `knot${i}` } : {}),
    unless: `knot${n}`,
    scene: [
      { t: 'say', who: '', text: k.look.slice(1).trim() },
      { t: 'choice', flag: `kn${n}`, options: ['위로 넘기', '밑으로 지나기'] },
      {
        t: 'if',
        flag: `kn${n}_${k.answer}`,
        then: [
          ...s`
            @sfx clothes
            @prop yarnKnot@${at[0]},${at[1]} loose
            > 실이 스르르 풀렸다.
            @flag knot${n}
          `,
          ...k.open,
        ],
        else: s`
          @shake 0.2
          @act ruru stomp nowait
          ruru: 으악, 더 엉켰어!
          toby: 다시. 실이 어디로 들어왔는지 잘 보자.
        `,
      },
    ],
  };
}
