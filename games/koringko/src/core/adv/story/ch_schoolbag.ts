/** 8장 · 하루의 책가방 — 지우가 기억하는 할머니 (현관 다음, 책상 앞) — 사람 크기 하루 방 (houseMap), 03:00 하루가 화장실에 간 사이 */
import { s } from '../parse.ts';
import type { ChainStep, Chapter, Cmd, RoomDef } from '../types.ts';
import { house, houseMap } from './kit.ts';
import { HARU, haruAmb, haruRoomSpec } from './layout_a.ts';

/*
 * 하루 방 · 이삿날 밤 03:00 (배치는 layout_a.ts, 4 · 18장과 같은 방)
 *   침대가 비었다 (이불 걷힘). 복도 끝 욕실에 불이 켜져 있고, 문틈으로 빛이 든다
 *   (7,4) 의자에 걸린 낡은 초등학교 책가방: 지퍼 (7,5) 를 루루 밧줄 + 보리 힘으로 세 번 당겨 연다
 *   (8~10,5) 쏟아진 필통 사람들 (몽당이 · 말랑이 · 반듯이): 셋 다 설득해야 앞주머니로
 *   (17,3) 침대 옆 의자에 걸친 겨울 외투 · (14,3) 옷걸이의 교복
 */
const SPEC = haruRoomSpec('ch8');
const BAG: readonly [number, number] = [HARU.chair[0], HARU.chair[1]];
const FOLKS: readonly [number, number] = [8, 5];

/** 필통 사람들 셋을 다 설득하면 (몽당이 · 말랑이 · 반듯이 누구를 마지막으로 설득해도) */
const ALL_PERSUADED = s`
  @if pc_mong
  @if pc_mal
  @if pc_ban
  @if pencils_ok
  @else
    @bars on
    > 필통 사람들이 한 줄로 비켜선다. 반듯이가 자 끝으로 앞주머니를 가리켰다.
    > 「허락한다. 단, 앞주머니 것은 하루 것이니 보기만 해.」
    @act ruru cheer nowait
    ruru: 셋 다 넘어왔다!
    @flag pencils_ok
    @bars off
  @end
  @end
  @end
  @end
`;

/** 필통 사람 하나와의 수다: 처음 말을 걸면 걱정을 듣고, 동료가 대답해 주면 마음을 연다 (고르기 · 틀린 답 없음) */
function folk(flag: string, done: Cmd[], ask: Cmd[], answer: Cmd[], yes: Cmd[]): Cmd[] {
  return [{ t: 'if', flag, then: done, else: [...ask, ...answer, ...yes, { t: 'flag', name: flag }] }, ...ALL_PERSUADED];
}

export const CH_SCHOOLBAG: Chapter = {
  n: 0,
  title: '0장 · 하루의 책가방',
  sub: '지우가 기억하는 할머니',
  room: 'schoolbag',
  start: [HARU.start[0], HARU.start[1]],
  party: ['toby', 'bori', 'ruru', 'nabi'],
  wind: 0.52,
  intro: s`
    @fade 1 0 white
    @bars on
    @music night
    @chtitle
    @fade 0 2
    > 다시 2층, 새벽 한 시 십 분. 하루 방 문이 반쯤 열려 있다.
    > 침대가 비어 있다. 복도 끝 욕실에 불이 켜져 있다.
    > 책상 의자에 걸린 낡은 초등학교 책가방. 연필 가루, 공책 냄새, 그리고 오래된 우유 냄새.
    ruru: 으, 우유 냄새! 이거 몇 년 된 거야?
    nabi: 하루가 중학생이 되고도 안 버린 가방이야. 이사 짐에도 아직 안 넣었고.
    bori: 왜 안 버렸어?
    toby: 앞주머니에 뭐가 들어 있대. 하루가 절대 안 여는 거.
    ruru: 그럼 열어 봐야지!
    nabi: 루루.
    ruru: 농담이야. …반만.
    @wait 0.6
    toby: 그런데 여긴 할머니 냄새 말고, 다른 냄새도 나.
    bori: 딸기 지우개 냄새. …지우다!
    @emote ruru ?
    ruru: 지우개가 지우지 그럼 뭐가 지워.
    nabi: 지우개 말고, 지우. 하루 단짝.
    @bars off
    @goal 종이별은 왜 구백구십구 개에서 멈춰 있을까?
  `,
};

export function schoolbagRoom(): RoomDef {
  const r = houseMap({
    ...SPEC,
    id: 'schoolbag',
    name: '하루의 책가방',
    things: [
      // ── 놀이 1 · 협동 당기기: 지퍼 고리에 루루 밧줄, 보리와 셋이 「하나, 둘, 셋」
      {
        kind: 'trigger',
        id: 'bag_near',
        rect: [5, 4, 6, 4],
        unless: 'zip_open',
        scene: s`
          > 가방 지퍼가 꽉 물려 있다. 지퍼 고리가 장난감 손이 겨우 닿는 높이에 매달려 있다.
          ruru: 지퍼 고리에 내 밧줄을 걸고, 보리가 같이 당기면 될 거야.
        `,
      },
      {
        kind: 'pull',
        id: 'zipper',
        at: [BAG[0], BAG[1] + 1],
        look: 'zipTab',
        look2: 'zipTab:open',
        need: ['ruru', 'bori'],
        tugs: 3,
        flag: 'zip_open',
        scene: s`
          @sfx zipper
          @prop chairBag@${BAG[0]},${BAG[1]} open
          @shake 0.2
          > 지이익— 가방이 입을 벌리자, 필통이 굴러떨어져 뚜껑이 열렸다.
          @sfx thud
          @prop pencilFolks@${FOLKS[0]},${FOLKS[1]} out
          > 필통 속에서 몽당연필, 분홍 지우개, 30cm 자가 줄줄이 기어 나온다.
          > 「누구야! 남의 가방을!」
          @act bori surprise nowait
          bori: 필통 사람들이다…
        `,
      },
      // ── 놀이 2 · 필통 사람들 설득: 몽당이 (공감) · 말랑이 (지우면 웃은 것도) · 반듯이 (허락)
      {
        kind: 'spot',
        id: 'pc_mong',
        at: [FOLKS[0], FOLKS[1]],
        when: 'zip_open',
        scene: folk(
          'pc_mong',
          s`> 몽당이가 필통 모서리에 기대어 꾸벅 존다. 안심한 얼굴이다.`,
          s`
            > 몽당연필이 필통 끝에 웅크려 떨고 있다.
            > 「이사 가면… 나 같은 몽당이는 버리겠지? 하루 손에 쥐기도 힘든데.」
          `,
          s`toby: 작아져도 버리지 않을 거야.`,
          s`
            > 「…정말? 하루가 그랬어?」 몽당이가 조금 몸을 편다.
            toby: 하루는 크레용도 손톱만 해질 때까지 썼어. 할머니가 그렇게 가르쳤거든.
          `,
        ),
      },
      {
        kind: 'spot',
        id: 'pc_mal',
        at: [FOLKS[0] + 1, FOLKS[1]],
        when: 'zip_open',
        scene: folk(
          'pc_mal',
          s`> 말랑이가 제 몸에 묻은 연필 자국을 내려다보며 조용히 있다.`,
          s`
            > 분홍 지우개가 앞주머니 앞을 가로막는다. 딸기 냄새가 훅 난다.
            > 「슬픈 건 다 지우면 돼. 할머니 기억도 내가 싹싹 지워 줄게. 그럼 하루도 안 울잖아?」
          `,
          s`toby: 지우면 웃은 것도 같이 지워져.`,
          s`
            > 말랑이가 멈칫한다. 「…웃은 것도?」
            nabi: 만두 별도, 김밥 두 줄도. 다 같은 종이에 쓰여 있어.
            > 「…그럼 안 지울래.」
          `,
        ),
      },
      {
        kind: 'spot',
        id: 'pc_ban',
        at: [FOLKS[0] + 2, FOLKS[1]],
        when: 'zip_open',
        scene: folk(
          'pc_ban',
          s`> 반듯이가 차렷 자세로 서 있다. 눈금 하나 흐트러짐이 없다.`,
          s`
            > 30cm 자가 꼿꼿이 서서 장난감들을 내려다본다.
            > 「규칙 제1조. 남의 가방을 함부로 여는 건 반칙이다.」
          `,
          s`toby: 친구 물건은 허락 받고 볼게.`,
          s`
            > 「…허락이라. 좋다. 규칙을 아는 녀석들이군.」
            bori: 하루도 지우 물건은 꼭 물어보고 만졌어.
          `,
        ),
      },
      {
        kind: 'memory',
        id: 'mJa',
        at: [4, 13],
        name: '김밥 두 줄',
        caption: '「하나는 친구 주렴」 — 할머니가 싸 준 소풍 도시락',
        scene: s`
          @room m_jw_picnic
          @show haru haru10 7 5 down sit
          @show jiwoo jiwoo10 14 4 left sit
          @pose jiwoo hugKnees
          @item mJalunch lunchbox 8 5
          @music waltz
          @sfx birds
          > 하루, 열 살. 4학년 봄 소풍. 반이 바뀌고 한 달째, 하루는 아직 같이 앉을 친구가 없었다.
          @sfx zipper
          > 할머니가 싸 준 도시락을 열자, 김밥이 두 줄. 그리고 쪽지 한 장.
          @sfx paper
          haru: 「하나는 친구 주렴. — 할머니」
          @emote haru sweat
          @act haru sigh
          haru: …친구 없는데.
          @wait 0.8
          @face haru right
          > 저쪽 덤불 옆. 지난주에 전학 온 아이가 무릎을 끌어안고 혼자 앉아 있다. 도시락이 없다.
          @wait 1
          @pose haru idle
          @face haru right
          @take haru mJalunch
          @walk haru 12 4 40
          @face haru jiwoo
          haru: 저기… 너 지우지? 전학 온.
          @face jiwoo haru
          jiwoo: …응.
          haru: 너 도시락 없어?
          jiwoo: …응.
          haru: 우리 할머니가 하나는 친구 주래. 근데 나 친구 없어.
          @wait 0.6
          @give haru jiwoo mJalunch
          haru: 그러니까… 네가 먹어.
          @act jiwoo surprise nowait
          @emote jiwoo !
          jiwoo: 그럼 나 이제 네 친구야?
          @act haru shrug nowait
          haru: …김밥 먹으면 친구야.
          @act jiwoo nod nowait
          jiwoo: 그럼 먹을래.
          @sfx zipper
          @pose jiwoo eat
          > 지우는 김밥 한 줄을 다 먹었다. 꽁다리까지.
          @pose jiwoo sit
          jiwoo: 너네 할머니 김밥, 세상에서 제일 맛있다.
          @emote haru ♪
          @act haru laugh nowait
          @sfx laugh
          haru: 당연하지. 우리 할머니가 싼 건데.
          @wait 1.5
        `,
        after: s`
          bori: 김밥 두 줄! 할머니는 처음부터 알았던 거야. 하루한테 친구가 없다는 거.
          @act ruru shrug nowait
          ruru: 다른 애한테 도시락이 없을 거라는 것까지? 할머니 무슨 점쟁이야?
          nabi: 아니. 그냥 매번 두 줄 쌌을 거야. 친구가 생길 때까지.
          toby: …그게 할머니 방식이지.
        `,
      },
      {
        kind: 'memory',
        id: 'mJb',
        at: [13, 9],
        name: '만두 별',
        caption: '「삐뚤어진 별도 별이다」 — 유리병 속 지우의 별',
        scene: s`
          @room m_room10
          @show haru haru10 7 6 right sit
          @show jiwoo jiwoo10 10 6 left sit
          @show gm grandma 8 4 down sit
          @pose haru write
          @pose jiwoo write
          @music box
          @sfx crickets
          > 그해 가을. 지우가 처음으로 하루네 집에 놀러 왔다.
          @sfx paper
          haru: 봐 봐. 띠를 이렇게 묶고, 감고, 감고… 모서리를 꾹 누르면.
          @sfx fold
          haru: 별!
          jiwoo: 우와. 나도 할래.
          @sfx fold
          @wait 1
          jiwoo: …이거 별 맞아?
          > 지우의 별은 한쪽이 푹 찌그러져 있었다. 별이라기보다는 납작한 만두.
          @pose haru sit
          @act haru laugh nowait
          @sfx laugh
          haru: 푸하하! 만두다!
          @emote jiwoo anger
          @act jiwoo stomp
          jiwoo: 웃지 마!
          @carry gm paperstar mJbstar
          gm: 어디 보자.
          @wait 0.6
          gm: 아이고, 잘 접었네. 이건 지우 별이다.
          haru: 할머니, 그거 찌그러졌는데?
          gm: 삐뚤어진 별도 별이다. 접은 사람 마음은 똑같이 들어가거든.
          @walk gm 4 4 30
          @face gm up
          @carry gm none
          @sfx star
          > 할머니는 찌그러진 별을, 하루 책상 위 종이별 유리병에 쏙 넣었다.
          @face gm haru
          @act haru surprise nowait
          @emote haru !
          haru: 어! 그거 내 병인데! 천 개는 내가 접어야 되는데!
          gm: 소원은 여럿이 빌면 더 잘 닿는단다. 그렇지, 지우야?
          @act jiwoo nod nowait
          jiwoo: …네!
          @emote jiwoo ♪
          jiwoo: 하루야, 너 소원 뭐야?
          @act haru shake nowait
          haru: 비밀.
          @wait 1.2
        `,
        after: s`
          @act ruru laugh nowait
          ruru: 만두 별! 하루 웃는 거 오랜만에 봤다.
          nabi: 그 별, 아직 유리병 안에 있어. 바닥 근처에. 찌그러져서 금방 찾아.
          toby: 구백구십구 개 중에 하나는 지우 거였구나.
          bori: 그럼 하루는… 혼자 접은 게 아니었네.
        `,
      },
      {
        kind: 'memory',
        id: 'mJc',
        at: [26, 11],
        name: '비밀 하나씩',
        caption: '할머니 기침을 먼저 알아챈 건 지우였다',
        scene: s`
          @room m_kitchen_d
          @show gm grandma 5 4 right
          @show jiwoo jiwoo10 13 7 left
          @item mJctray tray 8 7
          @music box
          @sfx cicada
          > 하루, 열한 살. 여름 방학. 하루가 아이스크림을 사러 나간 사이, 지우는 부엌에서 할머니와 단둘이 남았다.
          gm: 지우는 수박 좋아하니?
          jiwoo: 네! 씨까지 먹어요.
          gm: 허허, 하루랑 똑같네.
          @sfx cough
          gm: 콜록, 콜록… 콜록.
          @emote gm sweat
          @pose gm lookDown
          > 기침이 길었다. 할머니는 싱크대를 붙잡고 한참을 서 있었다.
          @act jiwoo surprise nowait
          @emote jiwoo !
          @walk jiwoo 6 7 50
          @walk jiwoo 6 5 40
          @face jiwoo gm
          jiwoo: 할머니, 아파요?
          @pose gm idle
          @face gm jiwoo
          gm: 아니, 아니. 감기가 좀 오래가서 그래.
          jiwoo: 하루가 그러는데, 할머니 작년부터 감기래요.
          @wait 1
          gm: …지우는 눈이 밝구나.
          gm: 지우야. 이건 하루한테 비밀로 해 줄래? 우리 하루, 걱정이 많은 애라.
          @emote jiwoo …
          jiwoo: …그럼 저도 비밀 하나 말해도 돼요?
          gm: 그럼. 비밀은 하나씩 바꾸는 거지.
          jiwoo: 소풍 날요. 저 사실 도시락 있었어요. 가방에. 삼각김밥.
          @emote gm ?
          @act jiwoo shrug nowait
          jiwoo: 근데 하루랑 친구 하고 싶어서… 안 꺼냈어요.
          @wait 0.8
          @emote gm ♪
          @act gm laugh nowait
          gm: 허허허! 그럼 그날 김밥은 제 주인을 제대로 찾아간 거구나.
          @sfx doorOpen
          > 현관에서 하루 목소리. "할머니! 지우야! 수박바 샀어!"
          gm: 쉿.
          jiwoo: 쉿.
          @act gm point nowait
          @act jiwoo point
          > 둘은 동시에 입술에 손가락을 댔다.
          @wait 1.2
        `,
        explore: {
          enter: [2, 9],
          intro: s`
            toby: 할머니네 부엌. 하루가 열한 살이던 여름 방학이야.
            ruru: 어, 하루가 없네? 지우만 있어.
            nabi: 이건 지우가 본 할머니야.
          `,
          threads: [
            { at: [8, 7], text: s`
              > 식탁 위 쟁반에 잘라 둔 수박. 씨가 송송 박혀 있다.
              bori: 수박! …한 조각만.
              ruru: 기억 속 수박 먹으면 기억이 상해.
              bori: 그런 게 어딨어.
              ruru: 몰라. 방금 지어냈어.
            ` },
            { at: [4, 4], text: s`
              > 한여름인데 할머니는 긴소매다. 앞치마 주머니에 손수건이 불룩하다.
              nabi: 긴소매는 할머니 버릇이야. 여름에도 늘. …손수건을 저렇게 챙기신 건 요즘이고.
            ` },
            { at: [14, 3], text: s`
              > 벽 달력. 방학 칸 여기저기에 할머니 글씨로 작은 동그라미. 「의원」, 「의원」.
              toby: 하나같이 하루가 지우랑 수영장 간 날이야. 하루가 집에 없는 날만 골랐어.
            ` },
          ],
          looks: [
            { at: [13, 8], text: s`
              > 지우. 부엌 문가에서 할머니 쪽을 보고 있다.
              toby: 지우는 하루네 집에 오면 늘 부엌부터 들렀어. 할머니한테 인사하러.
              ruru: 수박 보러겠지.
            ` },
            { at: [5, 5], text: s`
              > 할머니. 수박 자르던 칼을 막 내려놓았다. 숨이 조금 가쁘다.
              bori: 웃고 계신데… 어깨가 들썩여.
            ` },
          ],
        },
        after: s`
          ruru: 삼각김밥을 숨겼다고? 친구 하려고? 지우 완전 작전가네.
          bori: 나 같으면 김밥이랑 삼각김밥 둘 다 먹었을 텐데.
          nabi: 지우는 그때부터 알았던 거야. 그 기침이 그냥 감기가 아니라는 거. 하루보다 먼저.
          toby: 그리고 끝까지 말 안 했어. 약속이니까.
          @emote toby …
          toby: …그게 고마운 건지, 서운한 건지 모르겠어.
        `,
      },
      {
        kind: 'memory',
        id: 'mJg',
        at: [23, 12],
        name: '오늘만 이 길',
        caption: '「오늘 하루 학교에서 웃었니?」',
        scene: s`
          @room m_out_alley_d
          @show gm grandma 16 4 down sit
          @show jiwoo jiwoo10 1 8 right
          @music longing
          @sfx carPass
          > 하루, 열한 살. 2학기가 막 시작된 초가을, 해가 기울기 시작한 오후.
          > 하루가 청소 당번으로 남은 날, 지우는 혼자 큰길을 건너 하루네 골목으로 들어섰다.
          > 구멍가게 평상 끝에 할머니가 앉아 있었다. 교문 쪽으로 가던 차림 그대로, 무릎에 두 손을 얹고.
          @walk jiwoo 14 5 50
          @face jiwoo gm
          jiwoo: 할머니! 하루 청소 당번이에요. 좀 늦어요.
          @face gm jiwoo
          gm: 아이고, 지우구나. 그거 알려 주러 이 길로 왔니?
          jiwoo: …원래 이 길이에요.
          gm: 지우네 집은 저 큰길 건너잖니.
          @emote jiwoo sweat
          @act jiwoo shrug nowait
          jiwoo: …오늘만 이 길이에요.
          @wait 0.8
          @sfx sigh
          > 할머니 숨이 조금 길었다. 들이쉬고, 한참 있다가 내쉬고.
          jiwoo: 할머니, 교문까지 가시던 거예요?
          gm: 가다가 잠깐 앉았다. 오늘은 다리가 말을 안 듣네.
          gm: 하루한테는 말하지 마라. 할머니가 평상에 앉아 있더라, 그런 거.
          @wait 1
          gm: 지우야. 오늘 하루 학교에서 웃었니?
          @act jiwoo think nowait
          jiwoo: 네? …음. 급식에 떡볶이 나와서 웃었고요. 제가 우유 쏟아서 웃었고요.
          gm: 두 번이네.
          jiwoo: 세 번요. 체육 시간에 선생님 바지가…
          @emote gm ♪
          @act gm laugh nowait
          gm: 허허허. 세 번이나.
          @sfx cough
          > 웃음 끝에 짧은 기침. 할머니는 손등으로 입을 막았다가, 얼른 주머니에 넣었다.
          @emote jiwoo …
          gm: 학교에서 웃는 얼굴은 할머니가 못 보니까. 지우가 대신 봐 주렴. 가끔 이렇게 알려 주고.
          @act jiwoo nod nowait
          jiwoo: …매일 세어 올까요?
          gm: 매일은 힘들지. 생각날 때만.
          @wait 1
          @sfx paper
          > 그날부터 지우는 하루가 웃은 횟수를 세었다. 공책 맨 뒷장에, 바를 정 자로.
          > 골목 모퉁이 너머에서 하루 목소리가 들렸다. "할머니! 어, 지우야!"
          @pose gm idle
          > 할머니는 평상을 짚고 일어났다. 그리고 가로등 밑까지 걸어가, 허리를 쭉 폈다.
          @walk gm 5 4 25
          @act gm stretch
          @face gm right
          @pose gm wave
          > 하루가 본 건 가로등 밑에서 손을 흔드는 할머니였다. 평상에 앉아 있던 할머니는, 지우만 보았다.
          @wait 1.5
        `,
        explore: {
          enter: [7, 6],
          intro: s`
            toby: 하루네 골목이야. 하루가 열한 살, 2학기가 막 시작된 무렵.
            bori: 할머니가… 가게 평상에 앉아 계셔. 그런데 하루가 아니라 지우가 오고 있어.
          `,
          threads: [
            { at: [4, 4], text: s`
              > 가로등 밑이 비어 있다. 모퉁이를 돌면 늘 할머니가 서 있던 자리.
              nabi: 오늘은 할머니가 아직 저기까지 못 가셨어.
            ` },
            { at: [7, 4], text: s`
              > 하루네 파란 대문. 빗장을 걸지 않고 반쯤 열어 두었다. 안에서 된장국 냄새.
              bori: 하루 올 시간이면 할머니는 대문을 꼭 열어 두셨어. 하루가 밀기만 하면 되게.
            ` },
            { at: [19, 4], text: s`
              > 구멍가게 창문에 걸린 외상 장부. 「하루 할머니 — 우유 둘, 수박바 둘」.
              ruru: 할머니도 외상을 하시네?
              toby: 다 두 개씩이야. 지우 몫까지. 처음부터.
            ` },
          ],
          looks: [
            { at: [16, 5], text: s`
              > 평상 끝에 앉은 할머니. 무릎에 두 손을 얹고, 교문 쪽 길을 보고 있다.
              bori: 다리가 아프신가 봐. 교문까진 아직 한참인데.
            ` },
            { at: [2, 8], text: s`
              > 큰길 쪽에서 막 골목에 들어선 지우. 할머니를 보자마자 걸음이 빨라지려던 참이다.
              ruru: 지우네 집, 이쪽 아니지 않아? 한참 돌아오는 길인데.
              nabi: 응. 그래서 왔겠지.
            ` },
          ],
        },
        after: s`
          ruru: 「오늘만 이 길」. 거짓말 싫어하는 애가 거짓말하니까 티가 팍 나네.
          bori: 외상 장부에 우유가 두 개씩… 할머니는 지우 몫까지 늘 사 두셨던 거야.
          nabi: 웃은 횟수를 셌대. 바를 정 자로. 하루는 꿈에도 몰랐겠지.
          toby: 할머니가 못 보는 데서도, 누군가 하루 웃음을 세고 있었어.
        `,
      },
      {
        kind: 'memory',
        id: 'mJd',
        at: [3, 2],
        name: '주머니 속 별',
        caption: '「지우는 거짓말 싫어하지? 그럼 대답 안 할게」',
        scene: s`
          @room m_hospital
          @show jiwoo jiwoo13 4 8 right
          @music rain
          @sfx rainRoof
          > 하루, 열두 살. 겨울. 하루 몰래, 지우 혼자 병원에 왔다. 엄마를 한참 졸라서.
          @walk jiwoo 7 6 40
          @face jiwoo right
          @act jiwoo bow
          jiwoo: 할머니, 저 지우예요.
          gm: 아이고, 지우 왔니. 하루는?
          jiwoo: 하루는 몰라요. 하루한테는 비밀요.
          gm: 또 비밀이네. 우리 둘은 비밀이 많구나.
          jiwoo: 하루 요즘 쉬는 시간에도 별만 접어요. 수업 시간에 책상 밑에서 접다가 선생님한테 걸렸어요.
          gm: 허허… 그 녀석.
          @act jiwoo lookAround nowait
          jiwoo: 그래서 이제 제가 망 봐 줘요.
          @pose jiwoo holdStar
          jiwoo: 그리고 이거… 제가 접은 거예요. 이번 건 안 찌그러졌어요. 엄청 연습했어요.
          gm: 어디 보자… 정말이네. 반듯하다.
          @sfx clothes
          > 할머니는 그 별을 환자복 주머니에 넣었다.
          gm: 이건 하루 병 말고, 할머니 주머니에 넣어 두마.
          @pose jiwoo idle
          @wait 1
          jiwoo: 할머니… 나아요?
          @wait 1.2
          gm: 지우는 거짓말 싫어하지?
          @emote jiwoo …
          @act jiwoo nod
          jiwoo: …네.
          gm: 그럼 대답 안 할게.
          @pose jiwoo lookDown
          @wait 1.5
          @act jiwoo wipe
          @pose jiwoo idle
          gm: 지우야, 하나만 부탁하자. 나중에 하루가 할머니 얘기를 안 하거든, 억지로 묻지 마라.
          gm: 그냥 옆에 있어 주렴. 하루는… 하고 싶을 때 할 거다.
          @act jiwoo nod
          jiwoo: …네.
          @sfx clock
          @wait 1.5
        `,
        after: s`
          nabi: 할머니가 지우한테는 대답을 안 했어. 거짓말을 안 하려고.
          ruru: 하루한텐 "괜찮대" 했잖아. 왜 지우한텐…
          toby: 하루한텐 웃는 얼굴을 지켜야 했고, 지우한텐 부탁을 해야 했으니까. 거짓말로는 부탁을 못 하잖아.
          bori: 그 반듯한 별은 어디 갔을까.
          @wait 0.8
          toby: …할머니 주머니에. 끝까지.
        `,
      },
      {
        kind: 'memory',
        id: 'mJe',
        at: [16, 2],
        name: '소매',
        caption: '아무것도 묻지 않고, 소매 끝을 꼭 잡았다',
        scene: s`
          @room m_jw_class
          @show haru haru13 6 5 down sit
          @show jiwoo jiwoo13 7 5 down sit
          @music sorrow
          @sfx bell
          > 하루, 열세 살. 장례식이 끝나고 처음 학교에 간 날.
          > 쉬는 시간. 교실은 시끄러운데, 하루 자리만 조용하다.
          > 앞자리 아이가 돌아본다. "하루야, 너네 할머니 돌아가셨다며? 어떻게 돌아가—"
          @face jiwoo up
          jiwoo: 하루 오늘 피곤해.
          > "아니, 나는 그냥 궁금해서—"
          @act jiwoo shake nowait
          jiwoo: 나중에 물어. …아니, 묻지 마.
          @emote jiwoo anger
          > 아이가 머쓱하게 돌아앉았다.
          @wait 1
          @face jiwoo down
          @sfx clothes
          > 지우는 더 아무 말도 하지 않았다. 대신 책상 밑으로, 하루의 소매 끝을 꼭 잡았다.
          @emote haru …
          @pose haru lookDown
          @wait 1.5
          haru: …어젯밤 문자.
          jiwoo: 응.
          haru: 「응」이라고 보낸 거.
          @act jiwoo nod nowait
          jiwoo: 알아. 응 아닌 거.
          @act haru wipe
          @wait 1.5
          > 그날 하루는 할머니 얘기를 한 마디도 하지 않았다. 지우도 묻지 않았다.
          @sfx bell
          > 마지막 종이 칠 때까지, 지우는 소매를 놓지 않았다.
          @wait 1.5
        `,
        after: s`
          bori: 소매 잡는 거… 나도 하루한테 늘 해 주고 싶었어. 팔이 짧아서 못 했지만.
          ruru: 지우 화낼 줄도 아네. 「묻지 마」. 좀 멋있다.
          nabi: 할머니 부탁을 지킨 거야. 자기도 안 묻고, 남들도 못 묻게.
          toby: 말 안 해도 알아주는 사람이… 우리 말고도 있었구나.
        `,
      },
      {
        kind: 'memory',
        id: 'mJf',
        at: [27, 5],
        name: '앞주머니 편지',
        caption: '「내가 먼저 감을게」 — 지우가 남긴 노란 별과 편지',
        scene: s`
          @room m_jw_room14
          @show haru haru14 11 6 left
          @show jiwoo jiwoo13 7 6 right
          @item mJfbag bag 3 4
          @music minor
          @sfx crickets
          > 하루, 열네 살 가을. 할머니 없는 첫 생신날. 지우가 오랜만에 하루 방에 왔다.
          jiwoo: 하루야. 오늘 할머니 생신이지.
          @emote haru …
          jiwoo: 나 미역국은 못 끓이니까… 이거.
          @carry jiwoo paperstar mJfstar
          jiwoo: 노란 별. 할머니 노란색 좋아하셨잖아. 할머니 방에 놓아 드려도 돼?
          @act haru shake nowait
          haru: …안 돼.
          jiwoo: 문 앞에만이라도—
          haru: 하지 마.
          @face haru right
          haru: 너 왜 자꾸 할머니 얘기 해?
          jiwoo: …나도 할머니 보고 싶어서.
          @act haru stomp nowait
          haru: 네 할머니 아니잖아!
          @act jiwoo surprise nowait
          @emote jiwoo !
          @wait 1.5
          haru: …이제 나 혼자 있고 싶어. 가.
          @wait 1.5
          @walk jiwoo 4 5 30
          @face jiwoo up
          @sfx zipper
          @carry jiwoo none
          @walk jiwoo 2 5 30
          > 지우는 아무 말 없이, 의자에 걸린 옛날 책가방 앞주머니에 무언가를 넣었다. 4학년 때부터 쪽지를 넣던 자리.
          @walk jiwoo 1 3 40
          @sfx doorOpen
          @hide jiwoo
          @sfx doorClose
          @fade 1 0.6 black
          @show haru haru14 3 5 up sit
          @fade 0 0.8
          @sfx crickets
          @sfx zipper
          @carry haru letter mJfnote
          @sfx letterOpen
          > 그날 밤. 하루는 앞주머니에서 노란 별 하나와 접힌 쪽지를 꺼냈다.
          > 「하루야. 미안해. 내가 먼저 감을게.」
          > 「너네 할머니가 그랬어. 미안하다는 말은 태엽 같은 거라고. 먼저 감는 사람이 이기는 거래.」
          > 「할머니 얘기 안 해도 돼. 나도 이제 안 할게. 근데 나 안 가. 계속 옆자리야. — 지우」
          @emote haru tear
          @sfx sob
          @act haru wipe
          @wait 1.5
          @carry haru none
          @pose haru phone
          > 하루는 휴대폰을 들었다. 「미안」. 썼다가, 지운다.
          @wait 1
          > 「내일 모퉁이에서 기다릴게」.
          @sfx pop
          > 전송. 답장은 금방 왔다. 「응」.
          @sfx phoneVibe
          @wait 1
          @pose haru sit
          @sfx zipper
          > 하루는 별과 쪽지를 앞주머니에 도로 넣었다. 그 뒤로 한 번도 꺼내지 않았다. 버리지도 않았다.
          @wait 1.5
        `,
        explore: {
          enter: [15, 8],
          intro: s`
            toby: 하루 방이야. 열네 살 가을, 할머니 없는 첫 생신날.
            ruru: 지우다. 키 많이 컸네.
            bori: 둘 다 표정이… 실부터 찾자.
          `,
          threads: [
            { at: [3, 5], text: s`
              > 의자 등받이에 걸린 낡은 초등학교 책가방. 앞주머니 지퍼가 반쯤 열려 있다.
              toby: 우리가 방금까지 있던 가방이야.
              ruru: 밖에서 보니까 쪼그맣네. 안에선 그렇게 넓더니.
            ` },
            { at: [12, 3], text: s`
              > 벽에 걸린 운동회 사진. 반창고 붙인 하루와 할머니. 귀퉁이에 「하루 화이팅」 종이.
              ruru: 저 종이 든 애, 지우잖아.
              nabi: 그날 하루 무릎에 반창고 붙여 준 것도 지우였어.
            ` },
            { at: [10, 7], text: s`
              > 장난감 상자. 뚜껑에 엄마 글씨로 「장난감」.
              toby: 우린 저 안에 있었어. 나비만 빼고.
              nabi: 난 이불장. …둘 다 깜깜하긴 마찬가지였어.
            ` },
          ],
          looks: [
            { at: [7, 7], text: s`
              > 열세 살 지우. 등 뒤로 감춘 손에 노란 종이별 하나. 모서리가 반듯하다.
              bori: 할머니가 노란색 좋아하셨지.
            ` },
            { at: [11, 7], text: s`
              > 열네 살 하루. 입을 꾹 다물고 있다. 오늘이 무슨 날인지 아는 얼굴.
              toby: 아침에 엄마가 미역국을 끓였어. 하루는 한 숟갈도 안 떴고.
            ` },
            { at: [4, 4], text: s`
              > 책상 위 종이별 유리병. 뚜껑에 먼지가 앉았다. 바닥 근처에 찌그러진 별 하나.
              nabi: 만두 별이야. 하루는 저 병을 일 년 넘게 안 열었어.
            ` },
          ],
        },
        after: s`
          ruru: 「응」. 이번 응은 진짜 응이네.
          nabi: 둘은 다음 날 모퉁이에서 만나서, 아무 말 없이 학교에 갔어. 그다음 날도.
          toby: 하루는 그 뒤로도 할머니 얘기를 안 했어. 지우한테도.
          bori: 지우는 하루가 이사 가는 것도 알아?
          nabi: 알아. 하루가 말 안 해도.
          ruru: 그럼 내일 아침, 모퉁이에 오겠네.
          @emote toby …
          toby: …지우는 늘 그랬지. 말 안 해도 아는 애.
        `,
      },
      // ── 책상 위로 가는 문: 앞주머니 편지까지 보면 열린다 (옛 기억의 문 lJ 의 대사는 떠나기 전 장면으로, 다락의 막간 ② 는 책상의 무대 l5 로)
      {
        kind: 'door',
        id: 'd_bag_desk',
        at: [5, 5],
        name: '책상 위로',
        to: 'desk',
        arrive: [4, 18],
        dir: 'up',
        when: 'mem_mJf',
        locked: s`ruru: 가방 속 얘기가 아직 남았어.`,
        first: s`
          @bars on
          > 앞주머니 맨 안쪽. 반듯하게 접힌 노란 별 하나와, 여러 번 접었다 편 쪽지.
          bori: 지우 별이다. 이번엔 하나도 안 찌그러졌어.
          ruru: 만두에서 별까지. 오래도 걸렸네.
          nabi: 지우는 하루한테 별 접기를 배웠고.
          toby: 하루는 할머니한테 배웠지. 열 살, 책상 앞에서.
          @emote toby …
          toby: 거기서부터야. 별도, 소원도.
          bori: 가자, 책상으로!
          @bars off
        `,
      },
      // ── 종이별
      { kind: 'star', id: 'sJa', at: [2, 6], text: '가방 안감 솔기에 끼어 있던 종이별.' },
      { kind: 'star', id: 'sJb', at: [24, 8], text: '큰 칸 구석, 지우개 가루 속에 묻힌 종이별.' },
      { kind: 'star', id: 'sJc', at: [5, 15], text: '필통 지퍼 고리에 걸린 종이별.' },
      { kind: 'star', id: 'sJd', at: [19, 15], text: '앞주머니 꼭대기, 접힌 가정 통신문 사이의 종이별.' },
      {
        kind: 'spot',
        id: 'jw_nametag',
        at: [9, 4],
        scene: s`
          > 비닐 이름표. 「4학년 2반 하루」. 그 밑에 삐뚤빼뚤한 다른 글씨로 「+지우」.
          ruru: 남의 이름표에 낙서를?
          nabi: 지우 글씨야. 하루가 끝까지 안 지웠어.
          ruru: 지우를 안 지웠네.
          @emote bori sweat
          bori: …방금 그 말장난 누가 했어?
        `,
      },
      {
        kind: 'spot',
        id: 'jw_pencils',
        at: [12, 5],
        scene: s`
          > 자석 필통. 연필 두 자루에 서로의 이름이 바뀌어 쓰여 있다.
          toby: 서로 연필을 바꿔 쓴 거야. 그러면 시험을 잘 본대서.
          nabi: 둘 다 시험은 그냥 그랬어.
        `,
      },
      {
        kind: 'spot',
        id: 'jw_lunchbag',
        at: [5, 6],
        scene: s`
          > 꽃무늬 도시락 주머니. 안쪽에 할머니 바느질 글씨로 「하루」. 구겨진 쪽지가 하나 더 들어 있다.
          > 「오늘은 유부초밥. 하나는 친구 주렴.」
          bori: 정말로 매번 두 개였구나.
          nabi: 소풍 날마다. 6학년 가을 소풍까지.
          ruru: …그다음 소풍은?
          @emote toby …
          toby: 그다음 소풍엔, 지우가 두 개 싸 왔어.
        `,
      },
      {
        kind: 'spot',
        id: 'jw_milk',
        at: [9, 9],
        scene: s`
          > 납작하게 접힌 흰 우유 팩.
          ruru: 냄새 범인 찾았다!
          bori: 하루는 우유 싫어해서, 지우가 매일 대신 마셔 줬대.
          toby: 팩은 하루 가방에 숨기고. 증거 인멸 실패.
        `,
      },
      {
        kind: 'spot',
        id: 'jw_dictation',
        at: [19, 12],
        scene: s`
          > 받아쓰기 공책. 빨간 색연필로 60점. 그 옆에 연필 글씨: 「나는 55점. 너 이김. — 지우」
          ruru: 위로하는 방법 한번 독특하네.
          nabi: 하루는 그날 이 공책을 할머니한테 자랑했어. 「나 이겼어!」
          bori: 할머니는 뭐라고 했어?
          nabi: 「그럼 오늘은 둘 다 떡볶이다.」
        `,
      },
    ],
  });
  return {
    ...r,
    toys: true,
    amb: haruAmb('ch8'),
    // 지퍼를 열면 (다른 방 · 기억에서 돌아와도) 가방은 열린 채, 필통 사람들은 나와 있다
    keepProps: [
      { key: `chairBag@${BAG[0]},${BAG[1]}`, flag: 'zip_open', state: 'open' },
      { key: `pencilFolks@${FOLKS[0]},${FOLKS[1]}`, flag: 'zip_open', state: 'out' },
    ],
    hangouts: {
      bori: { at: [11, 8], pose: 'chinRest', dir: 'left', talk: s`
        @act bori think nowait
        bori: 하루 이불이 걷혀 있어. 화장실 갔나 봐. 금방 올 거야.
        bori: 소풍 날 도시락 주머니, 하루는 나도 넣어 갔어. 김밥 냄새 맡으라고.
      ` },
      ruru: { at: [20, 7], dir: 'left', talk: s`
        @act ruru hop nowait
        ruru: 하루 침대 위에 올라가 보고 싶다. …안 돼? 알았어.
        ruru: 지우 글씨는 하루보다 삐뚤어. 근데 하루는 그 글씨를 하나도 안 지웠더라.
      ` },
      nabi: { at: [16, 3], pose: 'sleepSit', dir: 'down', talk: s`
        @act nabi peek nowait
        nabi: 복도에서 물소리가 나면 하루가 돌아오는 거야. 귀 기울이고 있을게.
        nabi: 지우가 처음 놀러 온 날, 나도 이불장 틈으로 봤어. 만두 별 접던 날.
      ` },
    },
    // 기억 → 이 방의 물건: 가방에서 쏟아진 것 (지퍼를 열어야) · 앞주머니 편지 (필통 사람들이 비켜야) · 외투 · 교복
    // 기억 사슬 차례대로 하나씩 드러난다 (SCHOOLBAG_CHAIN: 지퍼를 열면 도시락부터)
    keepsakes: {
      mJa: { at: [6, 5], look: 'lunchbox', when: 'zip_open' },
      mJb: { at: [11, 5], look: 'paperstar', when: 'mem_mJa' },
      mJc: { at: [8, 4], look: 'book', when: 'mem_mJb' },
      mJg: { at: [9, 7], look: 'hairBand:yellow', when: 'mem_mJc' },
      mJd: { at: [17, 4], look: 'coat', when: 'mem_mJg' },
      mJe: { at: [14, 4], look: 'button', when: 'mem_mJd' },
      mJf: { at: [6, 4], look: 'letter', when: 'mem_mJe' },
    },
  };
}

/** 이 장에서만 쓰는 사람 크기 기억 방 */
export const SCHOOLBAG_MEMROOMS: Record<string, () => RoomDef> = {
  // 봄 소풍 공원: 덤불 · 꽃밭 · 돗자리
  m_jw_picnic: () =>
    house('m_jw_picnic', 'yardDay', 18, 11, [
      ['fence', 1, 1, 16, 1],
      ['flowers', 2, 2, 4, 1],
      ['flowers', 11, 2, 5, 1],
      ['bush', 15, 4, 2, 2, true],
      ['bush', 1, 7, 2, 2, true],
      ['bush', 13, 7, 3, 2, true],
      ['rug:#e86a6a', 5, 5, 5, 2],
    ], { wallH: 1, music: 'waltz' }),
  // 교실: 책상 두 줄 · 창 · 시계 · 달력
  m_jw_class: () =>
    house('m_jw_class', 'haru10', 18, 11, [
      ['window:day', 2, 0, 3, 2],
      ['window:day', 7, 0, 3, 2],
      ['clock', 11, 0, 2, 2],
      ['calendar', 14, 0, 2, 2],
      ['desk', 2, 4, 2, 1, true],
      ['desk', 6, 4, 2, 1, true],
      ['desk', 10, 4, 2, 1, true],
      ['desk', 2, 7, 2, 1, true],
      ['desk', 6, 7, 2, 1, true],
      ['desk', 10, 7, 2, 1, true],
      ['shelf', 15, 3, 2, 1, true],
    ], { music: 'minor' }),
  // 14살 하루의 방 (해 질 녘): 책상 · 침대 · 의자에 걸린 옛날 책가방
  m_jw_room14: () =>
    house('m_jw_room14', 'haru14', 18, 11, [
      ['window', 7, 0, 3, 2],
      ['door', 1, 1, 1, 2],
      ['photo', 11, 0, 2, 2],
      ['bed:#7a8aa8', 14, 3, 3, 4, true],
      ['rug:#b8a0a8', 6, 5, 6, 3],
      ['desk:jar', 2, 3, 3, 1, true],
      ['chair', 3, 4, 1, 1, true],
      ['toybox:label', 10, 8, 2, 1, true],
    ], { music: 'minor' }),
};

/** 5막 기억 사슬 (책가방): 다 같이 지퍼를 열면 가방 속 지우의 기억이 하나씩, 앞주머니 편지 뒤 책상 위로 */
export const SCHOOLBAG_CHAIN: ChainStep[] = [
  { id: 'zipper' },
  { id: 'mJa', gate: 'zip_open', bridge: '도시락 주머니 밑에 깔린 삐뚤어진 종이별 하나.' },
  { id: 'mJb', bridge: '별 모서리에 낀 공책 한 권. 표지에 「비밀」, 지우 글씨.' },
  { id: 'mJc', bridge: '공책 사이에서 노란 머리끈이 흘러내렸다.' },
  { id: 'mJg', bridge: '머리끈이 걸린 외투 주머니가 불룩하다.' },
  { id: 'mJd', bridge: '외투 소매 끝에 교복 단추 하나가 달랑거린다.' },
  { id: 'mJe', bridge: '단추 너머 앞주머니, 노란 별 하나가 반쯤 삐져나와 있다.' },
  { id: 'mJf', bridge: '편지를 접어 넣자, 책상 위 스탠드 불빛이 깜빡였다.' },
  { id: 'd_bag_desk' },
];
