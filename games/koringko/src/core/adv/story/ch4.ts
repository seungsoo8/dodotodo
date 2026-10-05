/** 4장 · 거실 창가 (12살, 할머니가 병원에 계시던 겨울) — 사람 크기 거실 (livingHouse), 00:35 비 · 아빠는 소파에서 잔다 */
import { s } from '../parse.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { LIVING, livingMap } from './layout_b.ts';

export const CH4: Chapter = {
  n: 4,
  title: '4장 · 거실 창가',
  sub: '12살, 할머니가 병원에 계시던 겨울',
  room: 'window',
  start: [3, 14],
  party: ['toby', 'bori', 'ruru', 'nabi'],
  wind: 0.6,
  intro: s`
    @fade 1 0 white
    @bars on
    @music night
    @chtitle
    @fade 0 2
    @sfx rainRoof
    > 밤 열두 시 삼십오 분. 한밤의 거실. 커다란 창에 빗방울이 맺혀 있다.
    @prop tv on
    > 소파에서 아빠가 자고 있다. 켜 둔 TV 가 푸르게 깜빡이고, 배 위에 낡은 수첩 하나가 펼쳐진 채 오르내린다.
    ruru: 비 온다. 이삿날 전날인데.
    @act nabi shrug nowait
    nabi: 조심해. 저 아저씨, 자다가 꼭 냉장고에 가거든.
    ruru: 토비, 아까부터 왜 말이 없어?
    @sfx windTick
    toby: …태엽 소리 들으려고. 끼릭, 끼릭. 점점 느려져.
    @act bori cheer nowait
    bori: 내가 감아 줄까? 힘은 자신 있어.
    toby: 고마워, 보리. 근데 태엽은 감아 준 사람 마음까지 같이 감기는 거래. 하루가 감아 줘야 해.
    nabi: 할머니가 하던 말이네.
    toby: 응. 태엽 할머니한테 들었어. 아니… 할머니한테 들었던 것 같기도 하고.
    @wait 0.6
    nabi: 침대 밑에서 내가 무서워했던 거, 아무한테도 말하지 마.
    @act ruru giggle nowait
    ruru: 벌써 셋 다 들었는데?
    bori: 나비, 무서워해도 괜찮아. 나도 천둥 무서워.
    nabi: …곰이 천둥을 무서워해?
    bori: 곰이라도 무서운 건 무서운 거야.
    @bars off
    @goal 창가에 남은 그해 겨울을 따라, 빈 유리병 자리에 닿자
    @flag ch4_in
  `,
};

export function windowRoom(): RoomDef {
  const r = livingMap('window', [
      {
        kind: 'memory',
        id: 'm4a',
        at: [5, 3],
        name: '병원',
        caption: '「천 개 되면 할머니 다 나아」',
        scene: s`
          @room m_hospital
          @show haru haru12 4 8 right
          @carry haru jar hjar
          @music rain
          @sfx rainRoof
          > 할머니가 입원한 지 석 달째. 하루, 열두 살.
          @walk haru 7 6 40
          @face haru right
          @act haru hop nowait
          haru: 할머니! 나 왔어.
          gm: 아이고, 우리 하루 왔니. 학교는 잘 다녀왔고?
          @act haru nod nowait
          haru: 응! 할머니, 이거 봐. 종이별 구백 개 넘었어.
          @sfx paper
          gm: 벌써? 우리 하루 손 아프겠다.
          @act haru shake nowait
          haru: 하나도 안 아파. 천 개 되면 할머니 다 나아. 할머니가 그랬잖아, 천 개 접으면 소원 이루어진다고.
          @wait 0.8
          gm: …그럼. 우리 하루 소원인데, 하늘도 들어줘야지.
          gm: 하루야, 토비 태엽은 잘 감아 주고 있니?
          @act haru nod nowait
          haru: 매일매일! 할머니가 매일 감으랬잖아.
          gm: 잘했다. 태엽은 천천히 감아야 오래 간단다. 서두르지 말고.
          @act haru giggle nowait
          haru: 할머니, 그 말 백 번도 넘게 했어.
          gm: 그랬나? 허허. 할머니가 나이가 들어서 그렇지.
          > 창밖으로 비가 내렸다. 할머니는 하루가 돌아갈 때까지 내내 웃고 계셨다.
          @put haru hjar 7 5
          @emote haru ♥
          @wait 1
        `,
        explore: {
          enter: [2, 9],
          intro: s`
            toby: 여기는… 병원. 하루가 열두 살이던 겨울이야.
            ruru: 다들 멈춰 있어. 하루도, 할머니도, 빗방울도.
            > 링거 방울이 떨어지다 멈췄다.
          `,
          threads: [
            { at: [4, 3], text: s`
              > 창에 맺힌 빗방울이 공중에 멈춰 있다.
              toby: 그해 겨울은 비가 자주 왔어. 하루는 우산을 접으면서 늘 웃는 연습을 했어. 병실 문 앞에서.
            ` },
            { at: [12, 6], text: s`
              > 링거 줄. 할머니 손등에 파란 멍이 여러 개.
              nabi: 할머니는 하루가 오는 날이면 소매를 꼭 내려 입으셨어. 이걸 안 보이려고.
            ` },
            { at: [6, 8], text: s`
              > 하루 품에 안긴 유리병. 종이별이 목까지 차 있다.
              bori: 구백 개 넘게… 하루는 학교 쉬는 시간에도 접었어. 손가락에 종이에 벤 자국이 가득했지.
              @emote bori tear
            ` },
          ],
          looks: [
            { at: [4, 7], text: s`
              > 문가에 선 하루. 신이 난 얼굴이다.
              ruru: 저 표정 좀 봐. …저때는 아무것도 몰랐으니까.
            ` },
            { at: [9, 7], text: s`
              > 침대 위의 할머니. 웃고 있다.
              toby: 할머니 웃는 얼굴… 그런데 왜 이렇게 지쳐 보일까.
            ` },
          ],
        },
        after: s`
          bori: 할머니 목소리… 정말 오랜만에 들었어.
          nabi: 소매. 또 내리셨어.
          toby: 할머니는 알고 계셨던 거야. 천 개를 접어도…
          @act ruru stomp nowait
          ruru: 그만해, 토비.
          @wait 0.8
          @pose bori lookDown
          bori: …나는 그 겨울에 병원에 한 번도 못 갔어. 예순 해를 같이 살았는데.
          ruru: 보리.
          bori: 괜찮아. 하루 주머니엔 자리가 하나뿐이었으니까.
          @pose bori idle
        `,
      },
      {
        kind: 'memory',
        id: 'm4b',
        at: [26, 12],
        name: '비 오는 밤의 전화',
        caption: '「할머니가 없어도, 태엽은 꼭 감아 주렴」',
        scene: s`
          @room m_living
          @show haru haru12 14 7 up phone
          @music rain
          @sfx rainRoof
          > 비가 그치지 않던 밤. 하루가 병원에 전화를 걸었다.
          @sfx phone
          @wait 1
          gm: 여보세요… 하루니?
          haru: 할머니! 나 아직 안 자.
          gm: 이 시간에? 내일 학교 가야지.
          haru: 할머니한테 할 말 있어서.
          @choice call | 보고 싶어. 빨리 집에 와. | 별 이제 거의 다 접었어! | 할머니, 아프지 마.
          @if call_0
            gm: 할머니도 우리 하루 보고 싶지. 조금만 기다려 주렴.
          @end
          @if call_1
            gm: 벌써? 우리 하루 손이 아주 야무지구나.
          @end
          @if call_2
            gm: …그래. 하루가 그렇게 말해 주니 하나도 안 아프구나.
          @end
          @wait 0.6
          gm: 하루야. 할머니가 부탁 하나만 하자.
          @act haru nod nowait
          haru: 응.
          gm: 혹시라도 할머니가 없어도, 토비 태엽은 꼭 감아 주렴. 태엽이 멈추면 안 되잖니.
          @emote haru !
          @act haru shake nowait
          haru: 할머니가 왜 없어? 이상한 소리 하지 마.
          gm: …그래, 그래. 할머니가 괜한 말을 했구나.
          gm: 이제 자렴. 잘 자, 우리 강아지.
          haru: …할머니도 잘 자.
          @pose haru idle
          @sfx thud
          > 수화기를 내려놓은 하루는 한참 동안 빗소리를 들었다.
          @face haru up
          @act haru sigh
          @pose haru lookDown
          @wait 1.5
        `,
        after: s`
          ruru: 할머니가 부탁했어. 할머니가 없어도 태엽은 꼭 감아 달라고.
          toby: …그 약속, 하루는 지키지 못했어.
          @act bori shake nowait
          bori: 못 지킨 게 아니야. 지금은 잠깐 잊은 거야.
          @act nabi nod nowait
          nabi: 보리 말이 맞아. 우리가 하루한테 기억나게 해 주면 돼.
        `,
      },
      {
        kind: 'memory',
        id: 'm4c',
        at: [9, 4],
        name: '구백구십구 번째 별',
        caption: '마지막 별은 할머니 앞에서 접으려 했다',
        scene: s`
          @room m_room12
          @show haru haru12 3 5 up write
          @music rain
          @sfx rainRoof
          > 그날 밤도 하루는 책상 앞에서 별을 접었다.
          haru: 구백구십육, 구백구십칠…
          @mini stars
          haru: 구백구십구!
          @pose haru idle
          @act haru cheer
          @emote haru ♪
          haru: 하나만 더 접으면 천 개다. 내일 병원 가서, 할머니 앞에서 마지막 거 접어야지.
          > 하루는 마지막 종이띠 한 장을 남겨 두고 불을 껐다.
          @sfx switch
          @fade 1 1.2
          @wait 1
          @sfx phone
          @wait 2
          @sfx phone
          > 새벽에 전화벨이 울렸다.
          @sfx doorOpen
          @show mom mom 1 3 down
          @fade 0.4 1
          mom: 하루야… 일어나 봐. 병원에… 가야겠다.
          @act haru surprise
          @emote haru …
          @act haru tremble
          @wait 1.5
          > 하루는 그날, 마지막 별을 접지 못했다.
          @wait 1
        `,
        explore: {
          enter: [8, 9],
          intro: s`
            toby: 하루 방. 병원에 다녀온 밤이야.
            bori: 빗소리가 멈춰 있으니까… 더 조용하다.
          `,
          threads: [
            { at: [4, 4], text: s`
              > 벽의 달력. 지난 날짜마다 빨간 X. 내일 칸에만 동그라미가 그려져 있다.
              nabi: 동그라미 안에 「병원 — 천 번째 별」. 하루 글씨야.
            ` },
            { at: [8, 3], text: s`
              > 빗방울이 맺힌 창. 창틀 위에 종이띠 한 장이 따로 놓여 있다. 노란색이다.
              toby: 마지막 한 장은 노란색으로 남겨 뒀어. 할머니가 늘 하루 거라고 따로 챙겨 주던 색.
            ` },
            { at: [13, 5], text: s`
              > 침대 머리맡에 곱게 개어 둔 스웨터. 내일 병원에 입고 갈 옷이다.
              bori: 할머니가 예쁘다고 했던 그 스웨터야.
              ruru: …내일 입으려고 벌써 꺼내 놨네. 성격 급하긴.
            ` },
          ],
          looks: [
            { at: [2, 5], text: s`
              > 책상 앞의 하루. 입술이 움직이는 채로 멈춰 있다. 구백구십…
              nabi: 숫자를 셀 때 하루는 꼭 입술이 움직여. 어릴 때부터.
            ` },
            { at: [1, 4], text: s`
              > 방문. 바깥은 조용하다. 아직은.
              ruru: …왜 이렇게 조용하지. 기분 나쁘게.
            ` },
          ],
        },
        after: s`
          @emote toby …
          toby: 천 번째 별을… 할머니 앞에서 접고 싶었던 거구나.
          nabi: 그 뒤로도 끝내 못 접었어. 천 번째를 접었는데도 할머니가 안 나으면… 그게 진짜가 되니까.
          bori: 토비, 그 반쪽 별… 잘 가지고 있지?
          @act toby nod nowait
          toby: 응. 여기 있어.
        `,
      },
      {
        kind: 'link',
        id: 'l4',
        at: [10, 3],
        name: '빈 유리병 자리',
        icon: 'jar',
        locked: s`toby: 창가 위에도, 아직.`,
        scene: s`
          @bars on
          > 소파에서 아빠가 잠꼬대를 했다. 「…약불에… 한 번 더…」
          @act ruru giggle nowait
          ruru: 꿈에서도 토스트 굽나 봐.
          > 창가에 유리병이 놓여 있던 자리. 동그란 먼지 자국만 남아 있다.
          toby: 하루는 왜 천 개를 접으면 할머니가 나을 거라고 믿었을까.
          nabi: 누가 그렇게 알려 줬겠지. 처음 별 접는 법을 알려 준 사람이.
          @act bori jump nowait
          bori: 할머니! 할머니가 책상에서 알려 주셨어. 하루가 열 살 때.
          @sfx wind
          @sfx door
          > 현관 쪽에서, 바람에 신발장 문이 덜컹 흔들린다.
          @act ruru point nowait
          ruru: 어? 현관이다. 하루가 열한 살 때… 할머니는 매일 아침 거기서 하루를 배웅했어.
          toby: 현관부터 들르자. 할머니가 매일 아침 서 계시던 데.
          > 먼지 자국 둘레에 그해 겨울이 흩어져 있다.
          @mini order2
          @sfx open
          @flag ch4_done
          @sfx memory
          @fade 1 1.4 white
          @next
        `,
      },
      // ───── 소파의 아빠: TV 를 켜 둔 채 잔다. 이따금 뒤척이며 실눈을 뜬다 (그때 움직이면 들킨다). 괘종 씨에게 태엽을 나눠 주면 깊이 잠든다
      {
        kind: 'watcher',
        id: 'dad_sofa4',
        at: [16, 10],
        actor: 'dad',
        dir: 'down',
        moveOnly: true,
        pattern: [
          { s: 6, dir: null, pose: 'sleep' },
          { s: 2.5, dir: 'down', r: 5, arc: 55, pose: 'sleep', emote: '…' },
          { s: 5, dir: null, pose: 'sleep' },
          { s: 2.5, dir: 'left', r: 5, arc: 55, pose: 'sleep', emote: '…' },
        ],
        caught: s`
          dad: …음? 뭐가… 움직였나…
          > 아빠가 실눈을 떴다가, 다시 코를 골기 시작한다. 장난감들은 얼른 숨었던 자리로 돌아간다.
        `,
        hint: s`
          nabi: 아저씨가 「…」 할 때는 꼼짝 마. 소파 밑이나 탁자 밑 그늘에선 안 보여.
        `,
        until: 'windup_gclock',
      },
      // ───── 놀이 1 · 커튼 끈 오르기: 루루 밧줄로 창턱 위, 화분 사이를 지나간다
      { kind: 'climb', id: 'curtain_cord', at: [2, 4], to: [3, 4], who: 'ruru' },
      {
        kind: 'trigger',
        id: 'sill_hint',
        rect: [1, 3, 2, 5],
        unless: 'on_sill',
        scene: s`
          > 커튼은 떼어 냈지만, 창틀 고리에 커튼 끈 한 가닥이 늘어져 있다.
          @if with_ruru
            @act ruru hop nowait
            ruru: 끈이다! 저거 타고 창턱까지 금방이야.
          @else
            toby: 창턱이 높아. 루루 밧줄이면 저 끈에 걸어서 오를 수 있을 텐데.
          @end
          @goal 커튼 끈을 타고 창턱으로 올라가자
        `,
      },
      {
        kind: 'trigger',
        id: 'on_sill',
        rect: [3, 3, 8, 2],
        unless: 'on_sill',
        scene: s`
          > 창턱 위. 화분 셋 사이로 빗방울 그림자가 흘러내린다. 유리창 너머로 가로등이 번진다.
          toby: 하루가 앉아 있던 자리야. 그해 겨울, 여기서 매일 병원 쪽을 봤어.
          @goal 창턱 위를 살펴보고, 꼬인 전화선을 따라가 보자
          @flag on_sill
        `,
      },
      // ───── 놀이 2 · 전화선 따라가기: 꼬인 매듭 셋, 매듭마다 넘을지(위) 밑으로 지날지(아래) 골라 밟는다
      {
        kind: 'seq',
        id: 'cord',
        keys: [
          { at: [25, 10], look: 'cordKnot:over', label: '위' },
          { at: [25, 11], look: 'cordKnot:under', label: '아래' },
          { at: [19, 13], look: 'cordKnot:over', label: '위' },
          { at: [19, 14], look: 'cordKnot:under', label: '아래' },
          { at: [14, 10], look: 'cordKnot:over', label: '위' },
          { at: [14, 11], look: 'cordKnot:under', label: '아래' },
        ],
        order: [0, 3, 5],
        flag: 'cord_free',
        wrong: s`
          @sfx miss
          > 끼익— 전화선이 오히려 더 꼬여 버렸다. 처음 매듭부터 다시.
          @act ruru giggle nowait
          ruru: 수화기 줄은 원래 꼬이라고 있는 거야. 하루도 맨날 손가락에 감았잖아.
        `,
      },
      {
        kind: 'spot',
        id: 'cord_end',
        at: [26, 13],
        scene: s`
          > 수화기에서 나온 전화선이 바닥을 가로질러 간다. 러그 위로 넘어가고, 탁자 다리 밑으로 들어갔다가, 소파 다리 밑으로 사라진다.
          toby: 선이 지나간 대로 따라가면 풀리겠어. 위로, 밑으로, 밑으로.
          @goal 전화선이 지나간 대로 매듭을 넘거나 밑으로 지나 보자
        `,
      },
      {
        kind: 'trigger',
        id: 'cord_done',
        rect: [1, 3, 34, 14],
        when: 'cord_free',
        scene: s`
          @sfx chime
          > 꼬였던 전화선이 스르르 풀리며, 수화기 줄이 탁자 위까지 닿는다.
          toby: 「1번 할머니」. 하루가 붙인 스티커가 그대로야.
          @goal 종이 울리기 전에, 창가의 빈 유리병 자리로
        `,
      },
      // ───── 놀이 3 · 괘종 씨: 토비가 태엽을 나눠 주면 한 번만 작게 친다 (아빠가 깊이 잠든다)
      {
        kind: 'windup',
        id: 'gclock',
        at: [14, 4],
        cost: 0.1,
        scene: s`
          @bars on
          > 토비가 등의 태엽을 한 바퀴 풀어 괘종시계 태엽 구멍에 나눠 준다. 끼릭, 끼릭.
          @act toby tremble nowait
          @sfx clockChime
          > 댕— 아주 작게, 딱 한 번. 괘종시계가 숨을 고르듯 종을 쳤다.
          > 소파의 아빠가 몸을 돌려 눕더니, 깊은 숨을 내쉰다. 코 고는 소리가 고르다.
          @act nabi nod nowait
          nabi: 이제 아저씨는 아침까지 안 깨. …태엽 아까웠지?
          toby: 아니. 아빠는 내일 운전해야 하니까.
          @bars off
        `,
      },
      {
        kind: 'spot',
        id: 'dadnote',
        at: [17, 10],
        scene: s`
          > 아빠 배 위의 수첩. 삐뚤빼뚤한 글씨.
          > 「토스트 — 약불에. 한 번 더 기다리고. 버터 넉넉히. (하루는 짭짤한 거)」
          > 그 밑으로 날짜가 빼곡하다. 날마다 한 줄씩. 「탐」「조금 탐」「탐」「덜 탐」…
          ruru: 두 해 동안 매일 적었네. 「탐」만 백 번은 되겠다.
          bori: 맨 마지막 줄은?
          > 「내일 이사. 새 가스레인지는 불이 세다고 함. 주의.」
        `,
      },
      { kind: 'star', id: 's4a', at: [3, 3], text: '창틀 구석의 노란 종이별.' },
      { kind: 'star', id: 's4b', at: [2, 3], text: '커튼 자락에 걸린 종이별.' },
      { kind: 'star', id: 's4c', at: [15, 10], text: '소파 밑에서 굴러 나온 종이별.' },
      { kind: 'star', id: 's4d', at: [33, 16], text: '현관 쪽으로 굴러간 하늘색 종이별.' },
      {
        kind: 'spot',
        id: 'rainwin',
        at: [11, 4],
        scene: s`
          > 유리창을 타고 빗방울이 흘러내린다. 바깥은 깜깜하다.
          toby: 하루는 비 오는 날이면 여기 앉아서 별을 접었어. 병원 쪽 하늘을 보면서.
        `,
      },
      {
        kind: 'spot',
        id: 'tv',
        at: [18, 4],
        scene: s`
          > 꺼진 텔레비전.
          @act ruru giggle nowait
          ruru: 하루 아빠는 텔레비전 켜 놓고 맨날 졸아.
          bori: 하루가 다섯 살 때는 아빠 배 위에서 같이 잤대. 둘이 똑같이 코 골면서.
        `,
      },
      {
        kind: 'spot',
        id: 'phone4',
        at: [28, 12],
        scene: s`
          > 전화기. 수화기에 작은 스티커가 붙어 있다. 「1번 할머니 ♥」.
          nabi: 단축번호 1번. 하루가 직접 붙인 거야.
        `,
      },
      {
        kind: 'spot',
        id: 'crumbs',
        at: [20, 10],
        scene: s`
          > 소파 밑에 과자 부스러기.
          @act bori peek nowait
          bori: …냠.
          ruru: 방금 먹었지?
          @act bori shake nowait
          bori: 아니, 안 먹었어. 냄새만 맡았어.
        `,
      },
      {
        kind: 'spot',
        id: 'umbrella4',
        at: [34, 14],
        scene: s`
          > 우산꽂이에 꽂힌 작은 노란 우산. 손잡이에 「하루」.
          nabi: 할머니가 사 준 우산이야. 하루 다섯 살 때.
          toby: 다섯 살… 비 오는 날.
        `,
      },
      {
        kind: 'spot',
        id: 'family',
        at: [13, 4],
        scene: s`
          > 벽에 걸린 가족사진. 아빠, 엄마, 하루, 그리고 할머니.
          ruru: 할머니만 한복 입었네.
          bori: 그날 할머니 생신이었어. 하루가 케이크에 초를 꽂았지.
        `,
      },
  ]);
  return {
    ...r,
    toys: true,
    // 기억에서 돌아와도 TV 는 켜진 채
    keepProps: [{ key: `tv@${LIVING.tv[0]},${LIVING.tv[1]}`, flag: 'ch4_in', state: 'on' }],
    amb: [
      { name: 'roomTone', gain: 0.3 },
      { name: 'clockTick', gain: 0.25 },
      { name: 'rainRoof', gain: 0.3, every: [6, 12] },
    ],
    hangouts: {
      bori: { at: [6, 11], pose: 'chinRest', dir: 'right', talk: s`
        @act bori lookAround nowait
        bori: 아저씨 코 고는 소리, 하루가 「곰 소리」라고 했었어. 곰은 나인데.
        bori: 밀 거 있으면 불러. 아저씨 안 깨게 살살 밀게.
      ` },
      ruru: { at: [2, 7], dir: 'up', talk: s`
        @act ruru point nowait
        ruru: 커튼은 뗐는데 끈은 남았네. 저거면 창턱까지 한 번에 가.
        ruru: 높은 데 갈 거면 나를 불러. 끈 타기는 내 특기야.
      ` },
      nabi: { at: [12, 7], pose: 'sleepSit', dir: 'up', talk: s`
        @act nabi peek nowait
        nabi: 비 오는 밤엔 창가가 깜깜했어. 하루는 내 등불 옆에서 별을 접었지.
        nabi: 김 서린 유리는 내 등불 온기로 비추면 글씨가 보여. 데려가.
      ` },
    },
  };
}
