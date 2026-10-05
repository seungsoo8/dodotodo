/** 4장 · 침대 밑 (13살, 할머니가 떠난 날 밤) — 사람 크기 하루 방 (houseMap), 01:20 하루가 잔다 */
import { s } from '../parse.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { houseMap } from './kit.ts';
import { HARU, haruAmb, haruRoomSpec } from './layout_a.ts';

/*
 * 하루 방 · 이삿날 밤 01:20 (배치는 layout_a.ts, 8 · 18장과 같은 방)
 *   하루는 침대 (18,3) 에 누워 뒤척이며 왼쪽(방 쪽)을 실눈으로 본다 — 숨바꼭질. 상자 · 가구가 시야를 가린다
 *   협탁 대신 놓인 상자 위 휴대폰: 알림이 오면 화면 빛이 둘레를 비춘다 (빛나는 동안 움직이면 들킴)
 *   침대 밑 (U) → 침대와 벽 사이 틈 (22~24, 3~4): 나비 · 더스티 · 짝잃이 · 접다 만 종이별. 나비 등불 자원
 *   짝잃이의 짝은 쓰레기통 옆 구긴 시험지 밑 (보리와 같이 든다)
 */
const SPEC = haruRoomSpec('ch4');

/** 더스티 설득이 끝나고, 짝잃이가 짝을 찾으면 */
const SOCK_DONE = s`
  @bars on
  @sfx chime
  > 두 짝이 나란히 눕자, 방울이 짤랑, 하고 함께 울렸다.
  > 짝잃이가 꼬물꼬물 몸을 비틀어 틈 맨 안쪽을 가리킨다. 먼지 속에서 노란 무언가가 반짝인다.
  @act ruru cheer nowait
  ruru: 찾았다, 짝! 두 해 만이래.
  @act bori nod nowait
  bori: 하루가 이거 찾는다고 온 집을 뒤집었었잖아. 여기 있었네.
  @emote nabi …
  nabi: 저 안쪽… 별이야. 반쯤 접힌.
  @bars off
  @goal 침대 밑 가장 깊은 곳, 반쯤 접힌 별에게 가자
`;

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
    > 새벽 한 시 이십 분. 하루의 방.
    > 침대 위에서 하루가 뒤척인다. 이불 가장자리로 노란 털실 한 가닥이 늘어져 있다.
    @cam 19 3 1.2
    @wait 1
    @sfx bed
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
    bori: 쉿. 하루 눈이 이쪽을 볼 땐 상자 그림자에 숨자. 깨우면 끝이야.
    @bars off
    @goal 하루를 깨우지 말고, 침대 밑으로 들어가 나비를 찾자
  `,
};

export function underbedRoom(): RoomDef {
  const r = houseMap({
    ...SPEC,
    id: 'underbed',
    name: '침대 밑',
    music: 'dark',
    things: [
      // ── 놀이 1 · 숨바꼭질: 잠든 하루가 뒤척이며 실눈으로 방을 본다
      {
        kind: 'watcher',
        id: 'haru_sleep',
        at: [HARU.haru[0], HARU.haru[1]],
        actor: 'haru15',
        dir: 'left',
        pattern: [
          { s: 3.4, dir: null, pose: 'sleep' },
          { s: 2.4, dir: 'left', r: 8, arc: 42, pose: 'lie', emote: '…' },
          { s: 2.8, dir: null, pose: 'sleep' },
          { s: 1.8, dir: 'left', r: 8, arc: 55, pose: 'lie' },
        ],
        // 행거에서 미끄러진 원피스 비닐 커버 속 · 침대 다리 그늘
        hide: [[14, 4], [17, 5]],
        caught: s`
          haru: …음…? 누구… 있어…?
          > 장난감들은 그 자리에 굳었다. 하루의 숨이 다시 고를 때까지.
        `,
        hint: s`bori: 하루 눈이 감길 때 건너. 상자 그림자에서 쉬고, 원피스 비닐 속에도 숨을 수 있어.`,
      },
      // 휴대폰 알림: 화면 빛이 켜진 동안 움직이면 들킨다
      {
        kind: 'watcher',
        id: 'phone_glow',
        at: [22, 5],
        actor: '',
        moveOnly: true,
        pattern: [
          { s: 5.5, dir: null },
          { s: 2.5, dir: 'left', r: 4.5, arc: 180 },
        ],
        caught: s`
          > 휴대폰 화면이 켜진 사이, 무언가 움직였다.
          haru: …으응… 엄마…?
        `,
        hint: s`ruru: 휴대폰이 빛나는 동안엔 꼼짝 마. 빛이 꺼지면 그때 뛰는 거야.`,
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
      // ── 놀이 2 · 나비 찾기 → 등불
      {
        kind: 'npc',
        id: 'nabi_lost',
        at: [22, 4],
        actor: 'nabi',
        dir: 'left',
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
          toby: 같이 가자, 나비. 네 등불이 있어야 기억 조각이 보여.
          @act nabi_lost shrug nowait
          nabi: …흥. 그렇게까지 부탁한다면.
          @flag found_nabi
          @join nabi
          @call nabi
          @goal 나비의 등불을 들고, 침대 밑에 가라앉은 그날 밤을 찾아가자
        `,
      },
      // ── 놀이 2½ · 더스티 설득 (틀리면 재채기)
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
            @if seen_dustbun
              dusty: 부스스… 또 왔구나. 그럼 다시 물어볼게.
            @else
              dusty: 부스스… 손님이네. 이 침대 밑에 누가 오는 건 정말 오랜만이야.
              toby: 누구세요?
              dusty: 나는 먼지 뭉치. 다들 더스티라고 부르지. 여기서 오래오래 쌓였어.
              dusty: 두 해 전 그날 밤, 침대가 밤새 흔들렸어. 하루가 울어서.
              dusty: 그다음부턴 아무도 여길 들여다보지 않았지. 그래서 이렇게 커졌어.
              @act bori surprise nowait
              bori: 엄청 크다…
              dusty: 이 안쪽은 아무나 못 들어와. 하나만 묻자. 하루가 왜 울었는지 알아?
              @goal 더스티를 설득해 침대 밑 안쪽으로 들어가자
            @end
            @choice dusty_q | 할머니가 돌아가셔서. | 우리를 두고 가려고. | 몰라도 돼. 같이 들어 줄게.
            @if dusty_q_2
              @emote dustbun …
              dusty: …부스스. 다들 이유부터 묻던데. 너희는 듣겠다고 하네.
              dusty: 너희가 찾는 건 저 안쪽에 있어. 짝 잃은 녀석이 지키고 있지. 등불을 들고 가렴.
              @flag dusty_ok
              @goal 짝잃이의 짝을 찾아 주자 — 쓰레기통 옆, 구긴 시험지 밑
            @else
              @sfx cough
              @shake 0.2
              > 더스티가 크게 재채기를 했다. 먼지가 풀썩 일어 장난감들 얼굴에 내려앉는다.
              @act ruru shiver nowait
              ruru: 에, 에취! 틀렸대. 아마도.
              dusty: 부스스… 그건 이유야. 하루한테 필요한 건 이유가 아니었어.
            @end
            @flag dusty_q_0 off
            @flag dusty_q_1 off
            @flag dusty_q_2 off
          @end
        `,
      },
      // ── 놀이 3 · 짝잃이의 짝 배달: 쓰레기통 옆 양말 (무거워서 보리와 함께 든다)
      {
        kind: 'spot',
        id: 'sock',
        at: [18, 13],
        unless: 'dusty_ok',
        scene: s`
          > 구긴 시험지 밑으로 별무늬 양말 끝이 삐죽 나와 있다.
          @act ruru shrug nowait
          ruru: 하루가 이거 찾는다고 온 집을 뒤집었었는데. 여기 있었네.
        `,
      },
      { kind: 'part', id: 'sock_mate', at: [18, 13], look: 'sockOne', set: 'sock', heavy: true, when: 'dusty_ok' },
      { kind: 'assemble', id: 'sock_pair', at: [22, 4], set: 'sock', look: 'sockOne', flag: 'sock_paired', when: 'dusty_ok', scene: SOCK_DONE },
      // 휴대폰 화면 곁에서는 나비 등불이 다시 찬다
      { kind: 'charge', id: 'phone_charge', at: [21, 5], r: 1.2 },
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
          @act toby surprise nowait
          toby: 침대 밑으로… 그럼 그 별이 지금 여기 어딘가에 있다는 거야?
          @act nabi nod nowait
          nabi: 내 등불로 비추면 찾을 수 있을 거야.
        `,
      },
      {
        kind: 'memory',
        id: 'm3c',
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
          @act toby shake nowait
          toby: 하루는 우리가 싫어진 게 아니었어. 우리를 보면 할머니가 생각나서… 너무 아파서.
          nabi: 슬픔이 너무 크면, 사랑하는 것까지 상자에 넣어 버리게 되는 거야.
          @act ruru shake nowait
          ruru: …그런 거 몰라. 몰라도 돼.
          @emote ruru tear
          @act ruru wipe
        `,
      },
      // ── 기억의 문: 침대와 벽 사이 틈 맨 안쪽, 짝잃이가 지키던 접다 만 종이별
      {
        kind: 'link',
        id: 'l3',
        at: [24, 3],
        name: '접다 만 종이별',
        icon: 'halfstar',
        locked: s`nabi: 아직 어둠 속에 기억이 남아 있어. 내 등불로 더 비춰 보자.`,
        scene: s`
          @if sock_paired
            @bars on
            > 먼지 속에 반쯤 접힌 노란 종이별이 떨어져 있다.
            @act toby jump
            toby: 찾았다… 하루가 접다 만 천 번째 별.
            toby: 이건 내가 가지고 갈게. 언젠가 하루에게 돌려줘야 하니까.
            @flag got_halfstar
            @sfx star
            @emote nabi …
            nabi: …저기. 다음은 내가 가 보고 싶은 데가 있어.
            @act ruru giggle nowait
            ruru: 나비가 먼저 말을 꺼내다니. 별일이네.
            nabi: 이불장. 하루가 날 넣어 두었던 곳.
            nabi: 하루가 깜깜한 걸 무서워하던 밤들… 내가 다 봤어. 거기 가면 보일 거야.
            @act toby nod
            toby: 가자, 나비. 이번엔 네가 앞장서.
            > 상징물에 깃든 기억이 흐트러져 있다. 조각을 맞춰야 다음 기억으로 이어진다.
            @mini photo1
            @sfx open
            @flag ch3_done
            @sfx memory
            @fade 1 1.4 white
            @next
          @else
            > 별 앞을 외짝 양말 하나가 꼭 막고 있다. 방울이 작게 짤랑거린다.
            nabi: 짝을 잃은 양말이야. 짝을 찾아 주기 전엔 안 비켜 줄 것 같아.
            @goal 짝잃이의 짝을 찾아 주자 — 쓰레기통 옆, 구긴 시험지 밑
          @end
        `,
      },
      // ── 종이별 (바닥 틈 · 구석에 끼인 종이 물건)
      { kind: 'star', id: 's3a', at: [9, 14], text: '먼지 속에서 빛나는 하얀 종이별.' },
      { kind: 'star', id: 's3b', at: [17, 4], text: '양말 속에 들어가 있던 종이별.', dark: true },
      { kind: 'star', id: 's3c', at: [1, 15], text: '구석에 끼어 있던 납작한 종이별.' },
      { kind: 'star', id: 's3d', at: [24, 15], text: '거미줄에 걸린 작은 종이별.' },
      // ── 살펴보기
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
    // 침대 밑 · 벽 틈에서만 나비 등불이 줄어든다 (휴대폰 화면 곁에서 다시 찬다)
    lantern: { max: 3.5, min: 1.6, drain: 0.12, zones: [[HARU.bed[0], HARU.bed[1], HARU.bed[2] + HARU.nook[2], HARU.bed[3]]] },
    hangouts: {
      bori: { at: [7, 6], pose: 'chinRest', dir: 'up', talk: s`
        @act bori think nowait
        bori: 하루 책상 밑이야. 여기선 하루 눈에 안 띄어.
        bori: 무거운 거 들 일 있으면 불러. 양말 같은 거라도.
      ` },
      ruru: { at: [14, 9], dir: 'left', talk: s`
        @act ruru peek nowait
        ruru: 상자 뒤가 명당이야. 하루가 실눈 떠도 여긴 안 보여.
        ruru: 휴대폰이 번쩍하면 얼음! 그것만 기억해.
      ` },
      nabi: { at: [16, 3], pose: 'sleepSit', dir: 'down', talk: s`
        @act nabi stretch nowait
        nabi: 창 밑 달빛 자리. 여기선 하루 숨소리가 잘 들려.
        nabi: 침대 밑에 들어갈 거면 나를 데려가. 깜깜한 데선 내가 앞장설게.
      ` },
    },
    // 다른 파일에서 더해지는 기억 → 이 방의 물건 (침대 밑 틈의 빵 끈만 어둠 속)
    keepsakes: {
      m3a: { at: [14, 4], look: 'dressBag' },
      m3b: { at: [6, 4], look: 'jar' },
      m3c: { at: [9, 6], look: 'boxMark' },
      m3d: { at: [21, 5], look: 'phone', dark: false },
      m3e: { at: [10, 4], look: 'dustGhost', dark: false },
      m3f: { at: [23, 3], look: 'breadTie', when: 'dusty_ok', dark: true },
      m3g: { at: [20, 6], look: 'mugRings', dark: false },
    },
  };
}
