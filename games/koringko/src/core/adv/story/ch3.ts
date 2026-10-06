/** 4장 · 침대 밑 (13살, 할머니가 떠난 날 밤) — 사람 크기 하루 방 (houseMap), 00:00 하루가 잔다 */
import { s } from '../parse.ts';
import type { ChainStep, Chapter, RoomDef } from '../types.ts';
import { houseMap } from './kit.ts';
import { HARU, haruAmb, haruRoomSpec } from './layout_a.ts';

/*
 * 하루 방 · 이삿날 밤 00:00 (배치는 layout_a.ts, 8 · 18장과 같은 방)
 *   하루는 침대 (18,3) 에 누워 뒤척이며 왼쪽(방 쪽)을 실눈으로 본다 — 숨바꼭질. 상자 · 가구가 시야를 가린다
 *   협탁 대신 놓인 상자 위 휴대폰: 알림이 오면 화면 빛이 둘레를 비춘다 (빛나는 동안 움직이면 들킴)
 *   침대 밑 (U) → 침대와 벽 사이 틈 (22~24, 3~4): 나비 · 더스티 · 짝잃이 · 접다 만 종이별. 나비 등불 자원
 *   짝잃이의 짝은 쓰레기통 옆 구긴 시험지 밑 (보리와 같이 든다)
 */
const SPEC = haruRoomSpec('ch4');

export const CH3: Chapter = {
  n: 3,
  title: '3장 · 침대 밑',
  sub: '13살, 할머니가 떠난 날 밤',
  room: 'underbed',
  start: [HARU.start[0], HARU.start[1]],
  party: ['toby', 'bori', 'ruru'],
  wind: 0.7,
  intro: s`
    @fade 1 0 white
    @bars on
    @music dark
    @chtitle
    @fade 0 2
    > 밤 열두 시. 하루의 방.
    > 침대 위에서 하루가 뒤척인다. 이불 가장자리로 노란 털실 한 가닥이 늘어져 있다.
    @cam 19 3 1.2
    @wait 1
    @sfx bed
    toby: …가방에 넣었던 목도리야. 꺼내서 안고 자.
    haru: …하나… 둘…
    @wait 1.5
    > 셋은 오지 않았다. 숨소리가 다시 고르게 이어졌다.
    @wait 1
    @cam off
    @act toby lookAround nowait
    toby: 침대 밑은 깜깜해… 아무것도 안 보여.
    bori: 나비! 등불 좀 켜 줘.
    @wait 0.6
    @emote bori ?
    @act bori lookAround nowait
    bori: 나비? 나비 어디 갔어?
    @act ruru surprise nowait
    ruru: 방금까지 맨 뒤에 있었는데!
    toby: 침대 밑으로 들어가다가 길을 잃었나 봐. 찾아야 해.
    bori: 쉿. 하루 깨면 안 돼. 발끝으로.
    @bars off
    @goal 할머니가 떠난 밤, 하루는 무엇을 상자에 넣었을까?
  `,
};

export function underbedRoom(): RoomDef {
  const r = houseMap({
    ...SPEC,
    id: 'underbed',
    name: '침대 밑',
    music: 'dark',
    things: [
      // ── 잠든 하루: 뒤척이며 잠꼬대 (숨바꼭질은 없다)
      {
        kind: 'npc',
        id: 'haru_sleep',
        at: [HARU.haru[0], HARU.haru[1]],
        actor: 'haru15',
        dir: 'left',
        pose: 'sleep',
        scene: s`
          > 하루가 뒤척였다. 「…하나… 둘…」 셋에서 멈췄다.
        `,
      },
      // ── 침대 밑에 들어서면
      {
        kind: 'trigger',
        id: 'bed_in',
        rect: [HARU.bed[0], HARU.bed[1], HARU.bed[2], HARU.bed[3]],
        scene: s`
          > 침대 밑. 매트리스 아래로 하루의 숨이 느리게 오르내린다.
          @act ruru lookAround nowait
          ruru: 먼지 냄새… 저 안쪽, 벽 틈에서 뭔가 움직였어.
        `,
      },
      // ── 놀이 (이 막에 남기는 하나) · 어두운 침대 밑에서 나비 찾기 → 등불
      {
        kind: 'npc',
        id: 'nabi_lost',
        at: [22, 4],
        actor: 'nabi',
        dir: 'left',
        when: 'mem_m3a',
        unless: 'found_nabi',
        scene: s`
          @emote nabi_lost !
          @act nabi_lost surprise nowait
          nabi: 누, 누구야!
          toby: 나야, 토비. 괜찮아?
          @act nabi_lost shrug nowait
          nabi: 괜찮아. 당연히 괜찮지. 고양이는 어둠을 무서워하지 않아.
          @act ruru point nowait
          ruru: 꼬리가 바들바들 떨리는데?
          @act nabi_lost shiver nowait
          nabi: 추워서 그래!
          @emote nabi_lost …
          nabi: …사실, 여기 너무 조용해서. 하루가 울던 소리가 아직 남아 있는 것 같아.
          toby: 같이 가자, 나비. 네 등불이 있어야 깜깜한 데가 보여.
          @act nabi_lost shrug nowait
          nabi: …흥. 그렇게까지 부탁한다면.
          @flag found_nabi
          @join nabi
          @call nabi
        `,
      },
      // ── 더스티: 침대 밑에 오래 쌓인 먼지 뭉치와 짧은 수다
      {
        kind: 'npc',
        id: 'dustbun',
        at: [23, 4],
        actor: 'dusty',
        dir: 'left',
        scene: s`
          @if dusty_ok
            dusty: 부스스… 여기 먼지는 다 하루의 한숨이야. 하나하나 다 기억하지.
          @else
            dusty: 부스스… 손님이네. 이 침대 밑에 누가 오는 건 정말 오랜만이야.
            toby: 누구세요?
            dusty: 나는 먼지 뭉치. 다들 더스티라고 부르지. 여기서 오래오래 쌓였어.
            dusty: 두 해 전 그날 밤, 침대가 밤새 흔들렸어. 하루가 울어서.
            dusty: 그다음부턴 아무도 여길 들여다보지 않았지. 그래서 이렇게 커졌어.
            @act bori surprise nowait
            bori: 엄청 크다…
            dusty: 다들 이유부터 묻더라. 하루가 왜 울었냐고.
            toby: …이유는 몰라도 돼요. 같이 들어 줄게요.
            @emote dustbun …
            dusty: …부스스. 너희는 듣겠다고 하네. 안쪽까지 들어가 보렴.
            @flag dusty_ok
          @end
        `,
      },
      // ── 짝잃이의 짝: 구긴 시험지 밑 별무늬 양말
      {
        kind: 'spot',
        id: 'sock',
        at: [18, 13],
        scene: s`
          > 구긴 시험지 밑으로 별무늬 양말 끝이 삐죽 나와 있다. 방울이 작게 짤랑거린다.
          @act ruru shrug nowait
          ruru: 하루가 이거 찾는다고 온 집을 뒤집었었는데. 여기 있었네.
          bori: 짝은 침대 밑 안쪽에 있대. 두 해 동안 따로따로.
        `,
      },
      {
        kind: 'memory',
        id: 'm3a',
        at: [14, 4],
        name: '검은 옷',
        caption: '장례식에서 돌아온 밤, 하루는 밥을 먹지 않았다',
        scene: s`
          @room m_room13
          @show haru haru13 13 7 down sit
          @music sorrow
          @sfx clock
          > 장례식장에서 할머니를 보내고 돌아온 밤.
          > 하루는 검은 옷을 갈아입지도 않고 침대 끝에 앉아 있다.
          @sfx knock
          @show mom mom 1 3 down
          @carry mom bowl mbowl
          mom: 하루야… 밥 조금이라도 먹자.
          @act haru shake nowait
          haru: 안 먹어.
          mom: 하루야.
          @pose haru hugKnees
          haru: 안 먹는다고.
          @wait 1
          @act mom sigh
          mom: …문 열어 둘게. 배고프면 나와.
          @hide mom
          @face haru left
          > 하루는 대답하지 않았다. 책상 위, 종이별이 가득한 유리병만 바라보고 있었다.
          @wait 1.2
        `,
        explore: {
          enter: [4, 9],
          intro: s`
            toby: 하루 방이야. 할머니를 보내고… 장례식에서 돌아온 밤.
            bori: 하루가 침대 끝에 앉아서 멈춰 있어. 기억의 실도 여기저기 떨어져 있고.
            ruru: …빨리 찾자. 이 방, 너무 조용해.
          `,
          threads: [
            { at: [4, 4], text: s`
              > 책상 위 유리병. 종이별이 목까지 차 있다. 옆에 접지 않은 종이띠가 한 장.
              toby: 저 병… 하나가 모자라. 딱 하나.
            ` },
            { at: [12, 3], text: s`
              > 벽에 걸린 사진 액자가 비뚤게 기울어 있다. 할머니와 하루가 웃는 사진.
              ruru: 하루가 만지작거리다가 그냥 둔 거야. 바로 걸지도, 떼지도 못하고.
            ` },
            { at: [1, 4], text: s`
              > 닫힌 방문. 문 너머에서 발소리가 멈춰 있다. 누군가 문 앞에서 망설이는 중이다.
              bori: 엄마야. 아까부터 문 앞을 왔다 갔다 했어. 이번이 세 번째야.
              ruru: 세 번이나 세고 있었냐.
            ` },
          ],
          looks: [
            { at: [12, 7], text: s`
              > 침대 끝에 앉은 하루. 검은 옷 소매를 꼭 쥐고 있다.
              bori: 하루 손… 아침부터 계속 저렇게 쥐고 있었어.
            ` },
          ],
        },
        after: s`
          bori: 하루가 밥을 안 먹었어. 하루가 밥을 안 먹은 날은 처음이야.
          ruru: 너는 꼭 그런 것만 기억하더라.
          @act bori stomp nowait
          bori: 중요한 거야! 밥을 안 먹는 건 정말 슬프다는 거야.
          @emote ruru …
          @act ruru nod
          ruru: …그러네.
        `,
      },
      {
        kind: 'memory',
        id: 'm3b',
        when: 'mem_m3d',
        at: [6, 4],
        name: '구백구십구',
        caption: '하나만 더 접으면 천 개였다',
        scene: s`
          @room m_room13
          @show haru haru13 3 5 up
          @music sorrow
          @pose haru write
          @sfx paper
          > 하루가 유리병을 쏟았다. 별들이 책상 위로 와르르 흩어진다.
          haru: 구백구십칠, 구백구십팔… 구백구십구.
          @wait 1
          @act haru sigh
          haru: 천 개 접으면 소원 하나 이루어진다고 했잖아.
          haru: 하나만… 딱 하나만 더 접으면 됐는데.
          @pose haru holdStar
          @sfx fold
          > 하루가 마지막 종이띠를 집었다. 접고, 또 접다가—
          @wait 1.2
          @pose haru lookDown
          @emote haru …
          haru: …이제 접어서 뭐 해.
          @sfx pop
          @item s3star paperstar 4 6
          @wait 0.3
          @item s3star paperstar 7 7
          @wait 0.3
          @item s3star paperstar 10 7
          @wait 0.3
          @item s3star paperstar 13 6
          > 반쯤 접힌 종이별이 하루의 손에서 미끄러져, 침대 밑으로 굴러 들어갔다.
          @pose haru idle
          @wait 1.2
        `,
        after: s`
          bori: 하나만 더 접으면 천 개였는데.
          ruru: …하나가, 제일 무거웠나 봐.
        `,
      },
      {
        kind: 'memory',
        id: 'm3c',
        when: 'mem_m3e',
        at: [9, 6],
        name: '마지막 태엽',
        caption: '하루가 토비의 태엽을 마지막으로 감던 새벽',
        scene: s`
          @room m_room13
          @show haru haru13 11 6 down
          @item ttoby toby 12 8
          @music sorrow
          @walk haru 12 7 30
          @face haru down
          @pose haru kneel
          @sfx cardboard
          > 새벽. 하루는 잠들지 못하고 장난감 상자를 열었다.
          @pose haru idle
          @take haru ttoby
          haru: …토비야.
          @pose haru hug
          @sfx hug
          > 하루가 토비를 꼭 끌어안는다.
          haru: 할머니가… 이제 없대. 아무리 불러도 대답을 안 해.
          haru: 할머니가 그랬잖아. 태엽이 멈추지 않게 매일 감아 주라고.
          @pose haru hold
          @sfx windTick
          @wait 0.35
          @sfx windTick
          @wait 0.35
          @sfx windTick
          > 끼릭, 끼릭. 하루가 토비의 태엽을 감는다. 천천히, 아주 천천히.
          haru: 그런데 할머니 태엽은… 누가 감아 줬어야 했던 거야?
          @pose haru cry
          @sfx sob
          @wait 1.5
          @act haru wipe
          haru: 이게 마지막이야, 토비.
          haru: 너를 보면… 자꾸 할머니가 생각나.
          @pose haru kneel
          @carry haru none
          @sfx put
          @wait 0.3
          @sfx cardboard
          @wait 0.4
          @sfx paper
          @sfx tapeStick
          > 하루는 토비를 상자에 넣고, 뚜껑 위에 쪽지를 붙였다. 「열지 마」.
          @pose haru idle
          @wait 1.2
        `,
        explore: {
          enter: [4, 9],
          intro: s`
            toby: 같은 방, 새벽이야. …이 기억은 나도 알아. 알 것 같아.
            ruru: 토비, 괜찮아? 귀가 떨려.
          `,
          threads: [
            { at: [12, 8], text: s`
              > 뚜껑이 열린 장난감 상자. 그 안에 하얀 토끼 인형이 누워 있다. 등의 태엽이 거의 풀렸다.
              toby: …나야. 하루가 날 꺼내기 바로 전.
              bori: 우리도 다 저 안에 있었어. 하루가 우는 소리, 다 들렸지.
            ` },
            { at: [8, 3], text: s`
              > 창밖이 희뿌옇게 밝아 온다. 새벽 다섯 시쯤.
              ruru: 한숨도 안 잤어, 하루. 밤새 이불 속에서 훌쩍이는 소리가 났거든.
            ` },
            { at: [4, 4], text: s`
              > 책상 옆에 붙은 낡은 쪽지. 삐뚤빼뚤한 글씨로 「토비 태엽 매일 세 번」.
              toby: 일곱 살 하루가 쓴 거야. 할머니한테 새 열쇠를 받은 날.
              bori: 그 뒤로 한 번도 안 뗐어. 이 쪽지.
            ` },
          ],
          looks: [
            { at: [11, 5], text: s`
              > 잠옷 차림의 하루. 눈이 퉁퉁 부었다.
              ruru: …저 얼굴로 아침까지 버틴 거야. 바보.
            ` },
          ],
        },
        after: s`
          @emote toby …
          toby: …기억났어. 그날 새벽.
          toby: 하루가 날 안고 울었어. 그리고 태엽을 감아 줬어. 그게 마지막이었어.
          bori: 토비…
          @pose toby lookDown
          toby: 「너를 보면… 자꾸 할머니가 생각나.」
          @wait 1
          toby: …나 때문이었어. 하루가 아픈 거.
          @act ruru stomp nowait
          ruru: 그만. 그런 계산은 하지 마.
          @emote ruru tear
          @act ruru wipe
          @pose toby idle
        `,
      },
      // ── 이불장으로 가는 문 (복도 아래): 떠나기 전, 짝잃이가 지키던 접다 만 종이별
      {
        kind: 'door',
        id: 'd_ub_closet',
        at: [1, 15],
        rect: [1, 15, 3, 1],
        to: 'closet',
        arrive: [4, 19],
        dir: 'right',
        when: 'mem_m3c',
        locked: s`nabi: …하루가 뒤척여. 조금만 더 있자.`,
        first: s`
          @bars on
          > 먼지 속에 반쯤 접힌 노란 종이별이 떨어져 있다. 짝을 찾은 양말 둘이 그 곁을 지키고 있었다.
          @act toby jump
          toby: 찾았다… 하루가 접다 만 천 번째 별.
          toby: 이건 내가 가지고 갈게. 언젠가 하루에게 돌려줘야 하니까.
          @flag got_halfstar
          @sfx star
          @wait 0.6
          @sfx bed
          > 위에서, 하루가 잠결에 중얼거렸다. 「…할머니.」
          @wait 2
          > 아무도 움직이지 않았다. 나비 등불만 아주 조금 떨렸다.
          @wait 1
          @emote nabi …
          nabi: …저기. 다음은 내가 가 보고 싶은 데가 있어.
          @act ruru giggle nowait
          ruru: 나비가 먼저 말을 꺼내다니. 별일이네.
          nabi: 이불장. 하루가 날 넣어 두었던 곳.
          nabi: 하루가 깜깜한 걸 무서워하던 밤들… 내가 다 봤어. 거기 가면 보일 거야.
          @act toby nod
          toby: 가자, 나비. 이번엔 네가 앞장서.
        `,
      },
      // ── 종이별 (바닥 틈 · 구석에 끼인 종이 물건)
      { kind: 'star', id: 's3a', at: [9, 14], text: '먼지 속에서 빛나는 하얀 종이별.' },
      { kind: 'star', id: 's3b', at: [17, 4], text: '양말 속에 들어가 있던 종이별.', dark: true },
      { kind: 'star', id: 's3c', at: [3, 13], text: '구석에 끼어 있던 납작한 종이별.' },
      { kind: 'star', id: 's3d', at: [24, 15], text: '거미줄에 걸린 작은 종이별.' },
      // ── 살펴보기
      {
        kind: 'spot',
        id: 'boxmark',
        at: [8, 7],
        scene: s`
          > 장난감 상자 자국 옆, 먼지 위에 「열지 마」 쪽지가 뒤집힌 채 떨어져 있다.
          bori: 우리 저기 있었잖아. 「열지 마」 쪽지 아래.
          bori: 근데 토비. 밤마다 네 쪽에서 끼릭 소리가 났어. 나는 네가 자면서 걷는 줄 알았어.
          @emote toby …
          toby: …나는 안 걸었는데.
        `,
      },
      {
        kind: 'spot',
        id: 'car',
        at: [18, 6],
        scene: s`
          > 바퀴 하나가 빠진 장난감 자동차.
          bori: 이 친구도 상자에 못 들어갔구나.
          toby: 침대 밑에서 혼자… 얼마나 오래 있었을까.
        `,
      },
      {
        kind: 'spot',
        id: 'drawing',
        at: [5, 4],
        scene: s`
          > 구겨진 그림 한 장. 「할머니 빨리 나아」. 별 스티커가 잔뜩 붙어 있다.
          toby: 병원에 가져가려던 그림이었나 봐.
          @if found_nabi
            @emote nabi …
          @end
        `,
      },
      {
        kind: 'spot',
        id: 'crayon3',
        at: [10, 9],
        scene: s`
          > 반으로 부러진 노란 크레용.
          bori: 하루는 노란색을 제일 좋아했어. 그래서 노란 크레용이 제일 먼저 닳았지.
        `,
      },
      {
        kind: 'spot',
        id: 'tissue',
        at: [17, 12],
        scene: s`
          > 똘똘 뭉친 휴지 뭉치가 여러 개.
          @if found_nabi
            nabi: …눈물 닦은 휴지야.
            @act ruru surprise nowait
            ruru: 이렇게나 많이?
          @else
            bori: …눈물 닦은 휴지야.
            ruru: 이렇게나 많이?
          @end
        `,
      },
    ],
  });
  return {
    ...r,
    toys: true,
    amb: haruAmb('ch4'),
    // 침대 밑 · 벽 틈은 나비 등불 곁에서만 보인다 (등불은 줄지 않는다)
    lantern: { max: 3.5, min: 1.6, drain: 0, zones: [[HARU.bed[0], HARU.bed[1], HARU.bed[2] + HARU.nook[2], HARU.bed[3]]] },
    hangouts: {
      bori: { at: [7, 6], pose: 'chinRest', dir: 'up', talk: s`
        @act bori think nowait
        bori: 하루 책상 밑이야. 여기선 하루 눈에 안 띄어.
        bori: 하루는 숙제하다 졸리면 발을 여기 넣고 날 베개 삼았어. 그날 밤만은 안 그랬지만.
      ` },
      ruru: { at: [14, 9], dir: 'left', talk: s`
        @act ruru peek nowait
        ruru: 상자 뒤가 명당이야. 하루가 실눈 떠도 여긴 안 보여.
        ruru: 그날 밤 하루 휴대폰이 밤새 번쩍였어. 다 「괜찮니?」였는데, 하나도 답장 안 했어.
      ` },
      nabi: { at: [16, 3], pose: 'sleepSit', dir: 'down', talk: s`
        @act nabi stretch nowait
        nabi: 창 밑 달빛 자리. 여기선 하루 숨소리가 잘 들려.
        nabi: 하루는 울 때 숨을 세. 하나, 둘… 할머니가 가르쳐 준 대로. 셋까지는 잘 안 가.
      ` },
    },
    // 다른 파일에서 더해지는 기억 → 이 방의 물건 (침대 밑 틈의 빵 끈만 어둠 속)
    keepsakes: {
      m3a: { at: [14, 4], look: 'dressBag' },
      m3b: { at: [6, 4], look: 'jar' },
      m3c: { at: [9, 6], look: 'boxMark' },
      m3d: { at: [21, 5], look: 'phone', dark: false },
      m3e: { at: [10, 4], look: 'dustGhost', dark: false },
      m3f: { at: [23, 3], look: 'breadTie', dark: true },
      m3g: { at: [20, 6], look: 'mugRings', dark: false },
    },
  };
}

/** 막 기억 사슬 (ACTS.md 막별 표): 이 방의 단계 차례 — 비어 있으면 사슬 없음 */
export const UNDERBED_CHAIN: ChainStep[] = [
  { id: 'm3a', bridge: '이불 끝이 침대 밑으로 늘어졌다. 안쪽에서 불빛이 깜빡였다.' },
  { id: 'nabi_lost' },
  { id: 'm3g', bridge: '머그잔 자국 옆, 빵 끈 하나가 어둠 속에 떨어져 있다.' },
  { id: 'm3f', bridge: '빵 끈 너머, 엎어진 휴대폰 화면이 희미하게 빛난다.' },
  { id: 'm3d', bridge: '휴대폰 불빛이 닿는 책상 위, 종이별이 가득 든 유리병.' },
  { id: 'm3b', bridge: '유리병 그림자 아래, 먼지가 네모나게 비켜 간 자리.' },
  { id: 'm3e', bridge: '네모난 자국 끝, 장난감 상자가 있던 자리가 눌려 있다.' },
  { id: 'm3c', bridge: '하루가 뒤척였다. 「…할머니.」 복도 쪽 문틈으로 바람이 든다.' },
  { id: 'd_ub_closet' },
];
