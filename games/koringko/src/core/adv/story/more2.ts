/** 장마다 여섯째 기억 조각: 앞뒤 장의 복선을 잇는 작은 장면들 */
import { s } from '../parse.ts';
import type { Thing } from '../types.ts';

export const MORE2: Record<string, Thing[]> = {
  attic: [
    {
      kind: 'memory',
      id: 'm1f',
      at: [20, 9],
      when: 'woke_all',
      name: '고쳐 쓴 쪽지',
      caption: '「두고 가는 짐」을 세 번 지웠다가 다시 썼다',
      scene: s`
        @room m_room15
        @show haru haru15 8 7 down
        @show mom mom 15 6 left
        @music piano
        > 이삿날 사흘 전. 하루가 상자에 쪽지를 붙이고 있다.
        mom: 하루야, 그 상자… 정말 두고 갈 거야? 할머니가 주신 것들이잖아.
        haru: 응. 새집엔 자리도 없고.
        mom: 자리는 만들면 되는데.
        haru: …엄마. 그냥 둬.
        @emote mom …
        @walk mom 17 6 40
        @hide mom
        @wait 1
        @face haru up
        > 하루는 쪽지를 떼어 「두고 가는 짐」을 지웠다. 다시 썼다. 또 지웠다.
        @wait 1.2
        haru: 가져가면… 매일 보잖아.
        haru: 매일 보면… 매일 생각나잖아.
        > 세 번째로 쓴 쪽지는 글씨가 조금 번져 있었다.
        @wait 1.5
      `,
      after: s`
        toby: 하루가 쪽지를 세 번이나 고쳐 썼대.
        nabi: 정말 두고 가고 싶었으면 한 번에 썼겠지.
        ruru: 그럼 하루는… 사실 우리를 데려가고 싶은 거야?
        bori: 데려가고 싶은데 무서운 거야. 그건 달라.
      `,
    },
  ],
  grandroom: [
    {
      kind: 'memory',
      id: 'm2f',
      at: [23, 8],
      name: '문틈의 카드',
      caption: '열지 못한 문 아래로 생일 카드를 밀어 넣었다',
      scene: s`
        @room m_gm_n
        @show haru haru14 15 7 left
        @music minor
        > 하루의 열네 번째 생일 밤. 집 안은 조용하다.
        @walk haru 11 7 30
        @emote haru …
        > 할머니 방. 하루는 한 번도 혼자 들어온 적이 없다. 그날 이후로는.
        @pose haru hold
        haru: 할머니. 나 오늘 생일이야.
        haru: 할머니가 매년 써 주던 카드… 올해는 내가 썼어.
        @pose haru idle
        @walk haru 8 6 30
        > 재봉틀 위에 카드를 올려놓는다. 먼지 위에 하얀 네모 자국이 생겼다.
        @wait 1.2
        haru: 답장은… 안 해도 돼.
        @walk haru 16 7 50
        @hide haru
        @wait 1.5
        > 카드에는 한 줄만 적혀 있었다. 「할머니, 나 아직 별 다 못 접었어. 미안해.」
        @wait 1.5
      `,
      after: s`
        bori: 재봉틀 위에 카드… 아직 거기 있을까?
        nabi: 먼지 자국이 네모나게 남아 있었어. 아까 봤어.
        toby: 하루는 할머니 방에 안 들어간 게 아니었어. 아무도 모르게 들어갔던 거야.
        ruru: …딱 한 번.
      `,
    },
  ],
  underbed: [
    {
      kind: 'memory',
      id: 'm3f',
      at: [13, 14],
      name: '탄 토스트',
      caption: '아빠의 탄 토스트, 하루가 한 입 먹었다',
      scene: s`
        @room m_kitchen_d
        @show dad dad 12 6 left
        @show haru haru13 7 7 up
        @music piano
        > 장례식 다음 날 아침. 아빠가 처음으로 아침을 차렸다.
        dad: 어… 조금 탔다. 할머니처럼은 못 하겠네.
        @emote haru …
        haru: 안 먹어.
        dad: 하루야. 할머니가 마지막에 아빠한테 부탁하신 게 있어.
        dad: "우리 하루 아침밥은 꼭 챙겨라. 그 애는 굶으면 하루 종일 울상이다."
        @wait 1.5
        @emote haru tear
        > 하루는 탄 토스트를 한 입 베어 물었다.
        haru: …써.
        dad: 그치? 아빠도 써.
        @pose haru cry
        haru: 써서… 우는 거야. 쓴 거 때문이야.
        dad: 응. 쓴 거 때문이야.
        @wait 1.5
      `,
      after: s`
        ruru: 하루 아빠, 요리 진짜 못하시네.
        bori: 그래도 그 뒤로 매일 아침 차려 주셨어. 매일 조금씩 덜 탔고.
        nabi: 할머니 부탁을 지킨 사람이 하루 말고도 있었구나.
        toby: …응.
      `,
    },
  ],
  window: [
    {
      kind: 'memory',
      id: 'm4f',
      at: [15, 8],
      name: '반만 뜬 목도리',
      caption: '"나머지 반은 네가 떠라" — 노란 목도리',
      scene: s`
        @room m_gm_n
        @show gm grandma 7 6 down sit
        @show haru haru12 10 7 left
        @music box
        > 열두 살 겨울. 할머니는 요즘 자주 누워 계신다. 오늘은 앉아서 노란 털실을 뜨고 계셨다.
        haru: 할머니, 그거 누구 거야?
        gm: 우리 하루 거지. 중학교 가면 추우니까.
        haru: 와! 언제 다 돼?
        gm: 글쎄다. 할머니 손이 요즘 느려서.
        @emote gm …
        gm: 하루야. 혹시 할머니가 다 못 뜨면, 나머지 반은 네가 떠라.
        haru: 에이, 나 뜨개질 못 해.
        gm: 배우면 되지. 별 접기도 처음엔 못 했잖니.
        @walk haru 8 7 30
        @face haru up
        haru: 그럼 할머니가 알려 줘. 다 나으면.
        gm: …그래. 다 나으면.
        @wait 1.5
      `,
      after: s`
        toby: 그 목도리… 하루가 가방에 몰래 넣은 거.
        bori: 반만 떠진 채로. 할머니가 끝내 못 뜨신 거야.
        nabi: "다 나으면"이라는 약속은… 지킬 수 없었지.
        ruru: 그럼 하루가 마저 뜨면 되잖아. 할머니가 그러라고 했잖아.
      `,
    },
  ],
  desk: [
    {
      kind: 'memory',
      id: 'm5f',
      at: [6, 5],
      name: '틀린 시험지',
      caption: '틀린 시험지도 접으면 별이 된다',
      scene: s`
        @room m_room10
        @show haru haru10 3 5 up
        @show gm grandma 6 6 left
        @music waltz
        > 열 살 가을. 하루가 받아쓰기 시험지를 구겨 쥐고 있다. 빨간 비가 잔뜩.
        haru: 엄마한테 말하지 마. 나 바보야.
        gm: 어디 보자. 육십 점이네. 지난번엔 사십 점 아니었니?
        haru: …그래도 바보야.
        gm: 할머니가 마법 하나 보여 줄까.
        > 할머니는 시험지를 길게 잘라 손가락으로 접기 시작했다. 접고, 끼우고, 꾹 누르고.
        @wait 1.5
        gm: 짜잔.
        @pose haru holdStar
        @emote haru !
        haru: 별이다! 빨간 비가 별 무늬가 됐어!
        gm: 틀린 것도 접으면 별이 된단다. 버리지 말고 모아 두렴.
        haru: 그럼 나 많이 틀려야겠다!
        gm: 그건 또 아니고.
        @emote gm ♪
        @wait 1
      `,
      after: s`
        ruru: 유리병 별 중에 빨간 줄 그어진 거 있었어! 그게 시험지였구나.
        bori: 하루는 그 뒤로 틀린 걸 하나도 안 버렸대.
        nabi: 천 개 중에 몇 개는… 받아쓰기 육십 점이야.
        toby: 그래서 더 소중한 별이야.
      `,
    },
  ],
  shelf: [
    {
      kind: 'memory',
      id: 'm6f',
      at: [15, 6],
      name: '열 장의 표',
      caption: '할머니는 토비 극장 표를 열 장 샀다',
      scene: s`
        @room m_living8
        @show haru haru8 10 5 down
        @show dad dad 13 6 left
        @show gm grandma 5 8 up sit
        @music playful
        > 토요일 오후. 하루가 크레용으로 그린 표를 들고 거실을 돈다.
        haru: 토비 극장 표 팝니다! 한 장에 백 원!
        dad: 아빠는 한 장.
        haru: 아빠는 이백 원. 저번에 졸았잖아.
        @emote dad sweat
        @walk haru 6 7 40
        haru: 할머니는?
        gm: 할머니는 열 장 주렴.
        haru: 열 장? 할머니 혼자 열 번 봐?
        gm: 그럼. 우리 하루 극장은 열 번 봐도 재밌으니까.
        @emote haru ♥
        haru: 그럼 할머니는 평생 공짜야! 평생 이용권!
        gm: 평생이라. 그거 좋구나.
        @wait 1.2
      `,
      after: s`
        bori: 평생 이용권… 할머니가 지갑에 넣고 다니셨어. 크레용 표.
        ruru: 진짜? 백 원짜리 표를?
        nabi: 할머니 지갑에서 제일 비싼 거였을걸.
        toby: 평생… 할머니는 그 말을 정말 좋아하셨구나.
      `,
    },
  ],
  drawer: [
    {
      kind: 'memory',
      id: 'm7f',
      at: [9, 6],
      name: '서랍 속 비밀',
      caption: '저녁 전에 먹은 사탕 하나, 할머니와의 비밀',
      scene: s`
        @room m_kitchen
        @show haru haru7 8 8 up
        @music playful
        > 일곱 살. 저녁 먹기 전. 부엌엔 아무도 없다.
        @walk haru 10 6 30
        @emote haru ♪
        > 과자 서랍을 살금살금 연다. 딸기 사탕 하나.
        @pose haru hold
        @show gm grandma 4 8 right
        gm: 어허.
        @emote haru !
        haru: 할, 할머니! 이거 그냥… 구경한 거야.
        @walk gm 8 7 30
        gm: 구경을 입으로 하니?
        @emote haru sweat
        gm: …하나만이다. 엄마한테는 비밀.
        > 할머니도 서랍에서 사탕 하나를 꺼내 입에 넣었다.
        haru: 할머니도 먹어?
        gm: 이제 할머니도 공범이지. 그러니까 둘이 비밀.
        @emote haru ♥
        @wait 1
      `,
      after: s`
        bori: 그 서랍에서 제일 단 건 사탕이 아니었어. 할머니랑 비밀이었지.
        ruru: 보리, 그 말 멋있다. 근데 배고파서 하는 말이지?
        bori: …반은.
        nabi: 하루는 지금도 딸기 사탕만 보면 웃어. 몰래.
      `,
    },
  ],
  yard: [
    {
      kind: 'memory',
      id: 'm8f',
      at: [12, 12],
      name: '돌담 위 걷기',
      caption: '"손 놓지 마" "안 놓을게"',
      scene: s`
        @room m_yard_d
        @show gm grandma 3 6 right
        @show haru haru5 4 6 right
        @music waltz
        > 다섯 살 봄. 마당 꽃밭 돌 테두리 위를 하루가 걷는다. 할머니 손을 꼭 잡고.
        haru: 할머니, 손 놓지 마!
        gm: 안 놓을게.
        @walk haru 8 6 20 nowait
        @walk gm 7 6 20
        haru: 진짜 안 놓을 거지?
        gm: 그럼.
        @walk haru 12 6 20 nowait
        @walk gm 11 6 20
        > 하루는 몰랐다. 반쯤 왔을 때부터 할머니 손이 하루 손에서 살짝 떨어져 있었다는 걸.
        @wait 1
        @walk haru 15 6 20
        @emote haru !
        haru: 끝까지 왔다! 할머니 손 잡고!
        gm: 그래. 우리 하루 혼자서도 잘 걷네.
        haru: 혼자 아니야. 할머니랑 같이 걸었잖아.
        @emote gm ♥
        @wait 1.2
      `,
      after: s`
        nabi: 할머니는 그때도 손을 놓고 계셨어. 하루가 혼자 걸을 수 있게.
        toby: 현관에서 본 운동회 날이랑 똑같아. "안 놓을게" 하고 놓아주셨지.
        ruru: 그거 거짓말 아니야?
        bori: 좋은 거짓말이야. 하루가 넘어지지 않을 때까지만 하는 거짓말.
      `,
    },
  ],
  toybox: [
    {
      kind: 'memory',
      id: 'm9f',
      at: [13, 12],
      name: '처음 감은 태엽',
      caption: '"하나, 둘, 셋. 매일 세 번"',
      scene: s`
        @room m_room4
        @show haru haru4 7 7 down sit
        @show gm grandma 9 7 left sit
        @music box
        > 토비가 온 날 저녁. 할머니가 하루의 작은 손을 토비 등에 얹어 준다.
        gm: 여기 열쇠 보이지? 이걸 돌리면 토비가 걸어.
        haru: 내가 해도 돼?
        gm: 그럼. 이제 하루 친구니까. 자, 하나.
        @sfx windTick
        haru: 둘!
        @sfx windTick
        haru: 셋!
        @sfx windTick
        @emote haru !
        > 토비가 탈칵탈칵, 하루 무릎 위를 걸었다.
        haru: 걸었어! 할머니, 토비가 걸었어!
        gm: 매일 세 번씩만 감아 주렴. 너무 많이 감으면 아프고, 안 감으면 멈추니까.
        haru: 매일 세 번! 약속!
        @wait 1.5
      `,
      after: s`
        @emote toby …
        toby: …하나, 둘, 셋.
        toby: 내가 처음 걸은 게 하루 무릎 위였구나.
        nabi: 그래서 넌 늘 하루 무릎 위가 제일 좋다고 했어.
        bori: 매일 세 번. 하루는 그 숫자를 아직 기억할까?
      `,
    },
  ],
};
