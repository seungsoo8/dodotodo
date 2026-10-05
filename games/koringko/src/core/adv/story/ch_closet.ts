/** 곁가지 장 · 나비의 이불장 — 나비가 하루 곁에서 지켜본 밤들 (3장 침대 밑과 4장 거실 창가 사이) */
import { s } from '../parse.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { grid, house, toyRoom } from './kit.ts';

/**
 * 장난감 크기 이불장: 개어 쌓은 이불 더미(E)가 벽과 칸막이.
 * 아래 칸 왼쪽(시작) → 실패 상자를 밀면 아래 칸 오른쪽 → 이불 사이 틈(밧줄) → 깜깜한 위 칸.
 */
const MAP = grid(30, 18, 'n', 'F', [
  // 아래 칸과 위 칸을 가르는 이불 선반
  ['F', 1, 9, 28, 1],
  // 선반 사이 틈 (루루 밧줄)
  ['v', 24, 9, 1, 1],
  // 아래 칸 가운데 칸막이, 한 칸은 상자가 막고 있다 (보리가 민다)
  ['F', 18, 10, 1, 7],
  ['n', 18, 13, 1, 1],
  // 아래 칸 이불 더미 · 좀약
  ['F', 8, 11, 3, 2],
  ['O', 4, 13, 1, 1],
  ['F', 22, 13, 2, 2],
  // 위 칸 (깜깜한 안쪽) 이불 더미 · 좀약
  ['F', 5, 4, 3, 2],
  ['F', 12, 1, 2, 4],
  ['F', 18, 3, 3, 3],
  ['O', 9, 2, 1, 1],
  ['O', 25, 6, 1, 1],
]);

export const CH_CLOSET: Chapter = {
  n: 0,
  title: '0장 · 나비의 이불장',
  sub: '나비가 지켜본 밤들',
  room: 'closet',
  start: [3, 15],
  party: ['toby', 'bori', 'ruru', 'nabi'],
  wind: 0.65,
  intro: s`
    @fade 1 0 white
    @bars on
    @music night
    @chtitle
    @fade 0 2
    > 이불장 안. 차곡차곡 개어 둔 이불들이 성벽처럼 쌓여 있다. 좀약 냄새가 난다.
    bori: 우와, 폭신폭신해. 여기 누우면 바로 잠들 것 같아.
    ruru: 좀약 냄새! 코가 찡해.
    @wait 0.6
    nabi: …여기선 내가 앞장설게.
    @emote toby ?
    toby: 나비가? 웬일이야.
    nabi: 여기 이불들, 다 하루가 덮던 거야. 나도… 원래는 이불이었고.
    nabi: 그러니까 여긴 내 기억이야. 내가 제일 잘 알아.
    ruru: 오~ 우리 나비 대장님.
    nabi: 대, 대장은 무슨. 길만 안내하는 거야. 따라오기나 해.
    @emote nabi sweat
    bori: 나비 귀가 빨개졌어.
    nabi: 등불 때문에 그렇게 보이는 거야!
    @bars off
    @goal 기억 조각 여섯 개를 찾자
  `,
};

export function closetRoom(): RoomDef {
  return toyRoom('closet', MAP, {
    name: '나비의 이불장',
    theme: 'village',
    start: [3, 15],
    music: 'night',
    ambient: [92, 96, 150],
    beams: [{ x: 25, w: 2, h: 9, slant: 1 }],
    lights: [{ at: [3, 15], r: 70, color: [255, 214, 150], k: 0.3 }],
    things: [
      {
        kind: 'memory',
        id: 'mNa',
        at: [6, 11],
        name: '햇빛 먹은 등불',
        caption: '「낮에 햇빛을 먹여 두면, 밤새 켜져 있단다」',
        scene: s`
          @room m_room6
          @show haru haru6 12 6 left hold
          @show gm grandma 8 6 right
          @music night
          @sfx crickets
          > 등불 고양이가 생긴 다음 날 밤. 하루는 나비를 안고 이불 앞에 서 있었다.
          haru: 할머니, 불 끄면 나비 등불도 꺼져?
          gm: 글쎄다. 한번 꺼 볼까?
          @sfx switch
          @fade 0.6 0.5
          > 방이 깜깜해졌다. 그런데 하루 품에서, 무언가 노르스름하게 빛났다.
          @emote haru !
          haru: 켜졌어! 나비 등불 켜졌어!
          gm: 할머니가 등불에 반짝이 실로 수를 놓았거든.
          gm: 낮에 햇빛을 잔뜩 먹여 두면, 밤새 켜져 있단다.
          haru: 햇빛 먹는 고양이!
          gm: 그러니 아침마다 창가에 앉혀 줘야 한다. 밥 주듯이.
          haru: 응. 나비야, 내일 아침밥은 햇빛이야.
          @sfx hug
          @pose haru hug
          haru: …이제 하나도 안 무서워.
          @fade 0 1
          gm: 잘 자라, 하루야. 나비도 잘 자고.
          @walk gm 1 3 30
          @sfx doorOpen
          @hide gm
          @sfx doorClose
          @wait 1.5
        `,
        explore: {
          enter: [2, 8],
          intro: s`
            nabi: 여기는… 하루 방. 하루가 여섯 살, 내가 생긴 다음 날 밤이야.
            toby: 멈춘 기억이야. 기억의 실을 모두 찾으면 이 순간이 다시 흘러가.
            nabi: 내 기억이니까, 내가 앞장설게.
          `,
          threads: [
            { at: [8, 3], text: s`
              > 창밖은 벌써 깜깜하다. 오늘 낮엔 해가 쨍쨍했다.
              nabi: 그날 하루는 나를 안고 하루 종일 창가에 있었어. 해님 구경시켜 준다고.
              toby: 그게 나중에 무슨 일을 하는지도 모르고.
            ` },
            { at: [10, 7], text: s`
              > 뚜껑이 열린 장난감 상자. 토비와 보리 사이가 한 칸 비어 있다.
              bori: 나비 자리야. 그런데 나비는 그날 밤 상자에 안 들어왔어.
              nabi: 하루가 놔주질 않았거든.
            ` },
            { at: [5, 7], text: s`
              > 방석 위에 반짝이 실 부스러기. 어둠 속에서 아주 희미하게 빛난다.
              ruru: 이거 뭐야? 반딧불 똥?
              nabi: …실밥이야. 내 등불 꿰매고 남은.
            ` },
          ],
          looks: [
            { at: [12, 7], text: s`
              > 나비를 꼭 안은 여섯 살 하루. 반은 졸리고, 반은 겁난 얼굴.
              toby: 하루는 불 끄는 걸 제일 무서워했어.
            ` },
            { at: [8, 7], text: s`
              > 할머니. 손가락 끝마다 반창고가 감겨 있다.
              bori: 밤새 바느질하셨구나. 반짝이 실은 미끄러워서 바늘에 잘 안 꿰어진대.
            ` },
          ],
        },
        after: s`
          nabi: 그다음 날부터 매일 아침 창가에 앉아 있었어. 햇빛 먹으러.
          ruru: 그래서 나비는 맨날 창가 자리였구나. 난 잘난 척하는 줄 알았지.
          nabi: 밥 먹는 중이었어. 방해하지 마.
          bori: 햇빛 밥… 맛있어?
          nabi: 꿀보다는 싱거워.
        `,
      },
      {
        kind: 'memory',
        id: 'mNb',
        at: [14, 15],
        name: '셋 세면',
        caption: '「무서울 땐 나비 꼬리를 꼭 잡고 셋을 세렴」',
        scene: s`
          @room m_room8
          @show haru haru8 13 6 left sit
          @music dark
          @sfx rainRoof
          > 비가 오래 온 주였다. 나비는 며칠째 햇빛을 먹지 못했다.
          @sfx thunder
          @shake 0.4
          @emote haru !
          haru: 나비야… 등불 켜 줘. 왜 안 켜져?
          > 등불 실은 희미하게 깜박이다가, 꺼져 버렸다.
          @pose haru hug
          haru: 할머니…
          @sfx doorOpen
          @show gm grandma 1 3 down
          gm: 아이고, 천둥소리에 깼구나.
          @sfx doorClose
          @walk gm 11 6 40
          @face gm haru
          haru: 꿈에서 깜깜한 데 혼자 있었어. 나비도 없고. 깨 보니까 진짜로 깜깜해.
          gm: 나비 등불이 배가 고팠나 보다. 해님이 며칠이나 안 나왔잖니.
          haru: 그럼 이제 어떡해?
          gm: 등불이 꺼진 날엔 이렇게 하는 거야. 나비 꼬리를 꼭 잡고… 셋을 세.
          @sfx heartbeat
          haru: …하나.
          gm: 둘.
          haru: 셋.
          @wait 1
          gm: 어떠니.
          haru: …손이 따뜻해.
          gm: 그게 나비 등불이란다. 실은 꺼져도, 하루가 꼭 쥔 건 안 꺼져.
          @emote haru …
          haru: 할머니도 셋 세면 와?
          gm: 그럼. 하나, 둘, 셋 하면 할머니가 온다.
          @sfx pat
          @emote haru ♥
          @wait 1.5
        `,
        after: s`
          nabi: 그날 꼬리 엄청 꽉 잡혔어. 실밥 터지는 줄 알았어.
          ruru: 나도 꼬리 뜯어져 봐서 알아. 그거 아파.
          toby: 하나, 둘, 셋. 내 태엽 감을 때랑 똑같네.
          nabi: …할머니는 뭐든 셋이었어. 그래야 하루가 외우니까.
        `,
      },
      {
        kind: 'memory',
        id: 'mNc',
        at: [21, 11],
        name: '이불 속 비밀',
        caption: '하루는 이불을 뒤집어쓰고 나비에게만 비밀을 말했다',
        scene: s`
          @room m_room10
          @show haru haru10 15 5 down sleep
          @music box
          @sfx crickets
          @sfx blanket
          > 열 살. 하루는 밤마다 이불을 머리끝까지 뒤집어썼다. 나비와 둘만의 시간.
          haru: 나비야, 오늘 비밀은 세 개야. 잘 들어.
          haru: 하나. 오늘 급식 시금치, 짝꿍 줬어. 할머니한테는 다 먹었다고 했어.
          haru: 둘. 나 커서 할머니처럼 재봉틀 하는 사람 될 거야. 근데 할머니한테는 비밀.
          haru: 할머니가 알면 너무 좋아서 울 거야. 할머니는 좋아도 울어.
          @wait 0.8
          haru: 셋.
          @wait 1
          haru: 나는 할머니가 세상에서 제일 좋아. 엄마보다 쪼끔 더.
          haru: 이건 엄마한테 비밀. 절대.
          @wait 0.8
          @sfx blanket
          @emote haru zz
          > 소곤소곤하던 목소리가 점점 작아졌다. 셋째 비밀을 말하고, 하루는 잠이 들었다.
          @wait 1.5
        `,
        after: s`
          ruru: 잠깐, 나비. 너 이런 걸 몇 년 동안 혼자 알고 있었던 거야?
          nabi: 하루 비밀은 백 개도 넘어. 하나도 안 샜어.
          bori: 시금치 얘기는 할머니도 아셨을걸. 하루 이에 초록색이 끼어 있었거든.
          toby: 그래도 셋째 비밀은 지켜 주자. 엄마한텐.
          nabi: 당연하지. 고양이는 입이 무거워.
        `,
      },
      {
        kind: 'memory',
        id: 'mNd',
        at: [27, 15],
        name: '벽 너머의 기침',
        caption: '「괜찮은 사람도 밤에 저렇게 기침해?」',
        scene: s`
          @room m_room11
          @show haru haru11 15 5 down sleep
          @music minor
          @sfx clock
          > 열한 살 가을. 할머니가 「괜찮대」라고 말한 지 며칠 뒤의 밤.
          @sfx cough
          @wait 0.8
          @sfx cough
          @emote haru …
          haru: 나비야. 깼어?
          > 벽 너머에서 기침 소리가 또 들려왔다. 길고, 오래.
          haru: 할머니가 괜찮대. 의원 선생님이 그랬대.
          haru: 근데 나비야. 괜찮은 사람도… 밤에 저렇게 기침해?
          @wait 1.2
          @sfx cough
          haru: 가 볼까.
          @wait 0.8
          haru: …아냐. 가면 할머니가 「괜찮아」 할 거야. 그럼 또 믿어야 하잖아.
          haru: 그냥 여기서 같이 듣자. 기침 멈출 때까지.
          @sfx blanket
          @item mNdcat cat 15 4
          > 하루는 나비를 베개 위에 앉히고, 등불이 할머니 방 쪽 벽을 보게 돌려 놓았다.
          haru: 할머니 방 쪽 잘 비춰 줘. 할머니 안 무섭게.
          @wait 1.2
          @sfx cough
          > 기침 소리는 새벽이 다 되어서야 멎었다.
          @sfx birds
          @wait 1.2
        `,
        after: s`
          @emote nabi …
          nabi: 하루는 몰랐어. 근데 전혀 모른 것도 아니었어.
          bori: 알고 싶지 않은 거랑 모르는 거는, 다른 거구나.
          ruru: …그날 밤 하루 안 잤어. 나 상자 안에서 다 들었어.
          toby: 나비 등불이 밤새 할머니 방 쪽을 비췄구나.
          nabi: 벽에 막혀서 하나도 안 닿았겠지만.
        `,
      },
      {
        kind: 'memory',
        id: 'mNe',
        at: [3, 2],
        name: '이불장에 넣은 날',
        caption: '「춥지 말라고. 상자 말고, 이불 사이에」',
        dark: true,
        scene: s`
          @room m_nb_room13
          @show haru haru13 9 6 right hold
          @music sorrow
          @sfx clock
          > 할머니가 떠나고 며칠 뒤. 하루는 매일 밤 나비를 안고 잤다. 그리고 매일 밤 울었다.
          @pose haru hug
          haru: 너한테서 할머니 냄새 나.
          haru: 재봉틀 기름 냄새. 할머니 방 냄새.
          @pose haru cry
          @sfx sob
          @wait 1.2
          haru: 너 안고 있으면… 할머니가 옆에 있는 것 같아서, 잠이 안 와.
          haru: 할머니가 없다는 게 자꾸 생각나서.
          @wait 1
          @pose haru hold
          @walk haru 12 4 30
          @face haru up
          @sfx doorOpen
          > 하루가 이불장 문을 열었다. 개어 둔 이불이 층층이 쌓여 있다.
          haru: 토비는 상자에 넣었는데… 너는 상자 싫지?
          haru: 너는 원래 이불이었으니까. 이불 사이에 있어. 춥지 말라고.
          @pose haru kneel
          @wait 0.4
          @sfx blanket
          @pose haru idle
          @wait 0.8
          haru: 등불은… 이제 안 켜도 돼.
          haru: 나 이제 깜깜한 거 안 무서워. 다 컸어.
          @sfx doorClose
          > 이불장 문이 닫혔다. 문틈으로 들어오던 빛이 가늘어지다가, 사라졌다.
          @wait 1.5
        `,
        after: s`
          @emote nabi …
          nabi: 여기야. 내가 오랫동안 있던 곳.
          toby: 나비… 혼자 이 깜깜한 데서?
          nabi: 이불들이랑 같이. 하나도 안 추웠어. 하루 말대로.
          ruru: 거짓말. 꼬리 떨잖아.
          nabi: …조금 추웠어. 하루가 없어서.
        `,
      },
      {
        kind: 'memory',
        id: 'mNf',
        at: [10, 6],
        name: '문 쪽을 보렴',
        caption: '「나비야. 우리 하루 잘 부탁한다」',
        dark: true,
        scene: s`
          @room m_room12
          @show haru haru12 15 5 down sleep
          @item mNfcat cat 13 5
          @music box
          @sfx rainRoof
          > 하루 열두 살, 늦가을. 할머니가 병원에 들어가기 며칠 전 밤.
          @show gm grandma 1 3 down
          > 문이 소리 없이 열리고, 할머니가 들어왔다. 늘 그랬듯이.
          @walk gm 13 6 25
          @face gm right
          gm: 이불 또 다 걷어찼구나, 우리 하루.
          @sfx blanket
          > 할머니가 이불을 끌어 올려 덮어 준다. 그리고 베개 옆 고양이 인형을 집어 들었다.
          @face gm up
          @take gm mNfcat
          @face gm right
          gm: 나비야. 등불 실이 또 바랬네.
          @sfx stitch
          @wait 0.4
          @sfx stitch
          > 할머니는 앞치마 주머니에서 바늘을 꺼내, 반짝이 실로 등불을 한 땀 한 땀 다시 꿰맸다.
          gm: 해님이 아무리 밥을 줘도, 실이 낡으면 빛을 못 담는단다. 그래서 할머니가 가끔 갈아 줬지.
          gm: 하루는 모른다. 비밀이다.
          @wait 1
          gm: 할머니가 이제 병원에 좀 가야 한단다. 오래 걸릴지도 몰라.
          gm: 그럼 밤마다 못 오지.
          @face gm up
          @put gm mNfcat 13 5
          @face gm right
          > 할머니가 나비를 베개 옆에 앉히고, 등불이 문 쪽을 보게 돌려 놓았다.
          gm: 무서운 건 다 문으로 들어오니까. 너는 늘 문 쪽을 보고 있어라.
          gm: 이제부터는 네가 혼자 해야 한다. 할머니 대신.
          @wait 1.2
          gm: 나비야. 우리 하루 잘 부탁한다.
          @emote haru zz
          > 할머니는 한참을 서 있다가, 들어올 때처럼 소리 없이 나갔다.
          @walk gm 1 3 25
          @hide gm
          @wait 1.5
        `,
        explore: {
          enter: [8, 9],
          intro: s`
            nabi: 하루 방이야. 열두 살, 늦가을 밤.
            ruru: 깜깜해. 나비, 등불 좀.
            nabi: …켜고 있어. 실이 바래서 그래.
          `,
          threads: [
            { at: [13, 5], text: s`
              > 베개 옆의 나비. 등불 실은 희미하게 바랬고, 고개는 창 쪽을 보고 있다.
              @emote nabi ?
              nabi: …창 쪽? 난 아침마다 문 쪽을 보고 있었는데.
            ` },
            { at: [5, 4], text: s`
              > 벽 달력. 다음 주 칸에 하루 글씨로 「할머니 병원 — 금방 옴」.
              toby: 하루는 「금방」이라고 믿었어. 할머니가 그렇게 말했으니까.
            ` },
            { at: [2, 4], text: s`
              > 방문이 손가락 하나만큼 열려 있다. 복도 불빛이 실처럼 새어 든다.
              ruru: 누가 열어 놨어? 하루는 문 꼭 닫고 자잖아.
              bori: …누가 오려나 봐.
            ` },
          ],
          looks: [
            { at: [15, 7], text: s`
              > 이불을 다 걷어찬 열두 살 하루. 한쪽 발이 침대 밖으로 나와 있다.
              bori: 잠버릇은 네 살 때랑 똑같네.
            ` },
            { at: [10, 7], text: s`
              > 장난감 상자. 토비와 보리와 루루가 나란히 누워 있다.
              toby: 우린 그날 밤 상자 안에 있었어. 아무것도 못 봤지.
            ` },
          ],
        },
        after: s`
          @emote nabi tear
          nabi: …몰랐어.
          nabi: 아침마다 눈 뜨면 내가 문 쪽을 보고 있었어. 난 내가 밤새 지킨 줄 알았어.
          nabi: 날 돌려놓은 건 할머니였어. 매일 밤. 등불 실도.
          toby: 할머니는 나한테도 부탁했어. 하루랑 평생 같이 놀아 달라고.
          bori: 할머니는 우리한테 하루를 맡기고 가셨구나. 한 명씩, 몰래.
          ruru: …그럼 우리 전부 책임이 막중하네.
        `,
      },
      {
        kind: 'link',
        id: 'lN',
        at: [15, 3],
        name: '반짝이 실 한 타래',
        icon: 'needle',
        locked: s`nabi: 아직이야. 이불장 안쪽, 깜깜한 데까지 내 등불로 비춰 봐야 해.`,
        scene: s`
          @bars on
          > 이불 사이에 작은 실패 하나가 끼어 있다. 반짝이 실이 감겨 있다. 할머니 반짇고리에 있던 것이다.
          nabi: 할머니가 내 등불 꿰매던 실이야. 여기 넣어 두셨나 봐.
          toby: 가져가자, 나비.
          nabi: …응. 언젠가 하루가 내 등불을 다시 꿰매 줬으면 좋겠어. 할머니처럼.
          bori: 할머니가 병원에 들어가신 게 그 겨울이지?
          nabi: 응. 그 겨울엔 하루가 밤마다 날 안고 거실 창가로 나갔어. 거기서 별을 접었거든. 할머니 다 나으라고.
          ruru: 천 개 접으면 낫는다던 그 별.
          nabi: 비 오는 밤엔 창가가 깜깜했으니까. 내 등불 옆에서, 그 겨울 내내.
          toby: 그때로 가 보자. 거실 창가로.
          nabi: …이번엔 내가 앞에서 비출게. 끝까지.
          > 상징물에 깃든 기억이 흐트러져 있다. 조각을 맞춰야 다음 기억으로 이어진다.
          @mini memento5
          @sfx open
          @flag lN_done
          @sfx memory
          @fade 1 1.4 white
          @next
        `,
      },
      { kind: 'gap', id: 'gN', at: [24, 10], tiles: [[24, 9]] },
      { kind: 'block', id: 'bN', at: [18, 13], look: 'box' },
      {
        kind: 'trigger',
        id: 'tNbox',
        rect: [14, 12, 4, 3],
        unless: 'mem_mNc',
        scene: s`
          bori: 이불 더미 사이에 상자가 끼어 있어. 내가 왼쪽에서 밀게!
          nabi: 그 너머에 하루 열 살, 열한 살 때 이불이 있어.
        `,
      },
      {
        kind: 'trigger',
        id: 'tNgap',
        rect: [22, 10, 5, 3],
        unless: 'gap_gN',
        scene: s`
          nabi: 저 위가 이불장 안쪽이야. 선반 사이에 틈이 벌어져 있어.
          ruru: 틈이라면 내 전문이지. 밧줄 건다!
        `,
      },
      {
        kind: 'trigger',
        id: 'tNdark',
        rect: [22, 6, 6, 3],
        unless: 'mem_mNf',
        scene: s`
          > 위 칸은 문틈 빛도 닿지 않는다. 나비의 등불만이 이불 더미를 비춘다.
          nabi: 여기서부턴 깜깜해. 내 뒤에 바짝 붙어.
          toby: 나비, 떨려?
          nabi: 안 떨려. …조금.
        `,
      },
      { kind: 'star', id: 'sNa', at: [16, 10], text: '개어 둔 수건 사이에 끼어 있던 종이별.' },
      { kind: 'star', id: 'sNb', at: [28, 10], text: '이불 솔기에 걸린 노란 종이별.' },
      { kind: 'star', id: 'sNc', at: [1, 8], text: '이불장 가장 깊은 구석, 먼지 쌓인 종이별.', dark: true },
      { kind: 'star', id: 'sNd', at: [27, 1], text: '좀약 봉지 옆에서 희미하게 빛나는 종이별.', dark: true },
      {
        kind: 'spot',
        id: 'mothball',
        at: [2, 11],
        scene: s`
          > 하얀 좀약 한 알. 코가 찡하다.
          bori: 이거 사탕이야?
          nabi: 먹지 마.
          ruru: 에취! …나 여우라서 코가 예민하단 말이야.
        `,
      },
      {
        kind: 'spot',
        id: 'babyquilt',
        at: [11, 12],
        scene: s`
          > 맨 아래 칸에 작은 아기 이불이 개어 있다. 한쪽 귀퉁이가 네모나게 잘려 나갔다.
          @emote nabi …
          nabi: …저기가 나야. 잘려 나간 데.
          bori: 그럼 이 이불이 나비 엄마네?
          nabi: 엄마는 무슨. …음. 그런 셈인가.
        `,
      },
      {
        kind: 'spot',
        id: 'flowersheet',
        at: [25, 15],
        scene: s`
          > 노란 꽃무늬 홑이불. 할머니가 여름마다 꺼내 주던 것.
          bori: 이거 덮으면 할머니 냄새 난다고, 하루가 여름 내내 끌고 다녔어.
          toby: 땀 범벅이 돼도 안 놨지.
        `,
      },
      {
        kind: 'spot',
        id: 'doorcrack',
        at: [26, 4],
        scene: s`
          > 이불장 문틈. 바깥 복도 불빛이 실처럼 가늘게 새어 든다.
          nabi: 이불장 문은 안에서 안 열려. 그래서 매일 이 틈만 봤어.
          toby: …오래 봤겠다.
          nabi: 문 쪽 보는 건 내가 제일 잘하는 거니까.
        `,
      },
      {
        kind: 'spot',
        id: 'winterquilt',
        at: [8, 1],
        scene: s`
          > 두꺼운 솜이불. 겨울에만 꺼내던 것이다.
          ruru: 여기 들어가면 겨울잠 자겠다.
          @emote bori zz
          toby: …보리는 벌써 들어갔어.
        `,
      },
    ],
  });
}

/** 이 장에서만 쓰는 사람 크기 기억 방 */
export const CLOSET_MEMROOMS: Record<string, () => RoomDef> = {
  // 13살 하루의 방, 밤: 이불장(벽장)이 보이는 쪽
  m_nb_room13: () =>
    house('m_nb_room13', 'haru13', 18, 11, [
      ['window:night', 7, 0, 3, 2],
      ['door', 1, 1, 1, 2],
      ['photo', 4, 0, 2, 2],
      ['bed:#6a7a9a', 14, 3, 3, 4, true],
      ['rug:#c8a0b0', 6, 5, 6, 3],
      ['desk:jar', 2, 3, 3, 1, true],
      ['chair', 3, 4, 1, 1, true],
      ['wardrobe', 11, 3, 2, 1, true],
      ['toybox:label', 10, 8, 2, 1, true],
    ], { music: 'minor' }),
};
