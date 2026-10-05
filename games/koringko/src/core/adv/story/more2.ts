/** 장마다 여섯째 기억 조각: 앞뒤 장의 복선을 잇는 작은 장면들 */
import { s } from '../parse.ts';
import type { Thing } from '../types.ts';

export const MORE2: Record<string, Thing[]> = {
  attic: [
    {
      kind: 'memory',
      id: 'm1f',
      at: [20, 9],
      when: 'mem_m1e',
      name: '고쳐 쓴 쪽지',
      caption: '「두고 가는 짐」을 세 번 지웠다가 다시 썼다',
      scene: s`
        @room m_room15
        @show haru haru15 8 7 down
        @show mom mom 15 6 left
        @item box1f boxTaped 8 8
        @carry haru pen pen1f
        @music piano
        > 이삿날 사흘 전. 하루가 상자에 쪽지를 붙이고 있다.
        @sfx tapeStick
        mom: 하루야, 그 상자… 정말 두고 갈 거야? 다 할머니 손때 묻은 것들인데.
        @act haru nod
        haru: 응. 새집엔 자리도 없고.
        mom: 자리는 만들면 되는데.
        @act haru shake
        haru: …엄마. 그냥 둬.
        @emote mom …
        @act mom sigh
        @walk mom 1 3 50
        @hide mom
        @sfx doorClose
        @wait 1
        @face haru down
        @pose haru kneel
        @sfx tapeRip
        > 하루는 쪽지를 떼어 「두고 가는 짐」을 지웠다. 다시 썼다. 또 지웠다. 또 썼다. 한 번 더 지웠다.
        @sfx marker
        @wait 0.6
        @sfx marker
        @wait 0.6
        @sfx crumple
        @wait 0.6
        @sfx marker
        @pose haru idle
        > 문 밖에서 엄마 목소리가 들렸다.
        mom: 하루야? 왜 자꾸 고쳐 써?
        @emote haru …
        haru: …글씨가 마음에 안 들어서.
        @sfx tapeStick
        > 마지막으로 다시 쓴 쪽지는 글씨가 조금 번져 있었다.
        @act haru wipe
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
      when: 'cloth_sew',
      at: [23, 8],
      name: '답장은 안 해도 돼',
      caption: '열네 살 생일 밤, 할머니 재봉틀 위에 두고 온 카드',
      scene: s`
        @room m_gm_n
        @music minor
        @sfx clock
        > 하루의 열네 번째 생일 밤. 집 안은 조용하다.
        @wait 0.8
        > 할머니 방. 하루는 문고리를 한참 잡고 있다가, 소리 나지 않게 들어왔다.
        @show haru haru14 1 3 down
        @carry haru card card2f
        @walk haru 4 5 30
        @emote haru …
        @act haru lookAround
        haru: 할머니. 나 오늘 생일이야.
        haru: 할머니가 매년 써 주던 카드… 올해는 내가 썼어.
        @walk haru 3 4 30
        @face haru up
        @pose haru kneel
        @sfx paper
        @wait 0.4
        @carry haru none
        @pose haru lookDown
        > 재봉틀 위에 카드를 올려놓는다. 먼지 위에 하얀 네모 자국이 생겼다.
        @wait 1.2
        haru: 답장은… 안 해도 돼.
        @walk haru 1 3 50
        @hide haru
        @wait 1.5
        > 카드에는 한 줄만 적혀 있었다. 「할머니, 나 아직 별 다 못 접었어. 미안해.」
        @wait 1.5
      `,
      after: s`
        bori: 재봉틀 위에 카드… 아직 거기 있을까?
        nabi: 먼지 자국이 네모나게 남아 있었어. 아까 봤어.
        toby: 하루는 할머니 방에 안 들어간 게 아니었어. 문을 잠그기 전까지는, 아무도 모르게 들어갔던 거야.
        ruru: …나올 때는 문을 꼭 닫고.
      `,
    },
  ],
  underbed: [
    {
      kind: 'memory',
      id: 'm3f',
      when: 'mem_m3g',
      at: [13, 14],
      name: '탄 토스트',
      caption: '아빠의 탄 토스트, 하루가 한 입 먹었다',
      scene: s`
        @room m_kitchen_d
        @show dad dad 12 6 left
        @show haru haru13 7 7 up sit
        @carry dad tray tray3f
        @music piano
        @sfx sizzle
        > 장례식 다음 날 아침. 아빠가 처음으로 아침을 차렸다.
        @walk dad 8 7 30
        @face dad haru
        @give dad haru tray3f
        @sfx dish
        dad: 어… 조금 탔다. 할머니처럼은 못 하겠네.
        @act dad shrug
        @emote haru …
        @pose haru lookDown
        haru: 안 먹어.
        dad: 하루야. 할머니가 마지막에 아빠한테 부탁하신 게 있어.
        dad: "우리 하루 아침밥은 꼭 챙겨라. 그 애는 굶으면 하루 종일 울상이다."
        @wait 1.5
        @emote haru tear
        @pose haru eat
        > 하루는 탄 토스트를 한 입 베어 물었다.
        @sfx crunch
        haru: …써.
        dad: 그치? 아빠도 써.
        @pose haru cry
        @sfx sob
        haru: 써서… 우는 거야. 쓴 거 때문이야.
        @act dad pat
        @sfx pat
        dad: 응. 쓴 거 때문이야.
        @wait 1.5
      `,
      after: s`
        @act ruru shake nowait
        ruru: 하루 아빠, 요리 진짜 못하시네.
        bori: 그래도 그 뒤로 매일 아침 차려 주셨어. 매일 조금씩 덜 탔고.
        toby: 할머니 부탁을 지킨 사람이 하루 말고도 있었구나.
        @act ruru giggle nowait
        ruru: …토스트는 계속 좀 탔지만.
      `,
    },
  ],
  window: [
    {
      kind: 'memory',
      id: 'm4f',
      when: 'mem_m4b',
      at: [15, 8],
      name: '다 나으면',
      caption: '"나머지 반은 네가 떠라" — 노란 목도리',
      scene: s`
        @room m_gm_n
        @show gm grandma 7 6 down knit
        @show haru haru12 10 7 left
        @music box
        @sfx wind
        > 열두 살 초겨울. 할머니가 병원에 들어가시기 얼마 전. 요즘은 자주 누워 계셨는데, 오늘은 앉아서 노란 털실을 뜨고 계셨다.
        @sfx knit
        haru: 할머니, 그거 누구 거야?
        gm: 우리 하루 거지. 중학교 가면 추우니까.
        @act haru jump
        haru: 와! 언제 다 돼?
        gm: 글쎄다. 할머니 손이 요즘 느려서.
        @emote gm …
        @sfx cough
        gm: 하루야. 혹시 할머니가 다 못 뜨면, 나머지 반은 네가 떠라.
        @act haru shake
        haru: 에이, 나 뜨개질 못 해.
        gm: 배우면 되지. 별 접기도 처음엔 못 했잖니.
        @walk haru 8 7 30
        @face haru up
        haru: 그럼 할머니가 알려 줘. 다 나으면.
        @act gm nod
        gm: …그래. 다 나으면.
        @sfx knit
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
        @sfx crumple
        > 열 살 가을. 하루가 수학 시험지를 구겨 쥐고 있다. 빨간 비가 잔뜩.
        @pose haru lookDown
        haru: 엄마한테 말하지 마. 나 바보야.
        @walk gm 4 5 30
        @face gm haru
        @sfx paper
        gm: 어디 보자. 육십 점이네. 지난번엔 사십 점 아니었니?
        haru: …그래도 바보야.
        gm: 할머니가 마법 하나 보여 줄까.
        @sfx scissors
        > 할머니는 시험지를 길게 잘라 손가락으로 접기 시작했다. 접고, 끼우고, 꾹 누르고.
        @pose haru idle
        @face haru gm
        @sfx fold
        @wait 0.7
        @sfx fold
        @wait 0.8
        @carry gm paperstar star5f
        gm: 짜잔.
        @give gm haru star5f
        @act haru surprise
        @emote haru !
        haru: 별이다! 빨간 비가 별 무늬가 됐어!
        gm: 틀린 것도 접으면 별이 된단다. 버리지 말고 모아 두렴.
        haru: 그럼 나 많이 틀려야겠다!
        @act gm shake
        gm: 그건 또 아니고.
        @emote gm ♪
        @wait 1
      `,
      after: s`
        ruru: 유리병 별 중에 빨간 줄 그어진 거 있었어! 그게 시험지였구나.
        bori: 하루는 그 뒤로 틀린 걸 하나도 안 버렸대.
        nabi: 천 개 중에 몇 개는… 수학 육십 점이야.
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
        @carry haru card tix6f
        @music playful
        > 토요일 오후. 하루가 크레용으로 그린 표를 들고 거실을 돈다.
        @act haru hop
        haru: 토비 극장 표 팝니다! 한 장에 백 원!
        dad: 아빠는 한 장.
        @pose haru hipsHands
        haru: 아빠는 이백 원. 저번에 졸았잖아.
        @emote dad sweat
        @act dad shrug
        @walk haru 6 7 40
        @face haru gm
        haru: 할머니는?
        gm: 할머니는 열 장 주렴.
        haru: 열 장? 할머니 혼자 열 번 봐?
        gm: 그럼. 우리 하루 극장은 열 번 봐도 재밌으니까.
        @emote haru ♥
        @give haru gm tix6f
        @act haru cheer
        haru: 그럼 할머니는 평생 공짜야! 평생 이용권!
        @act gm laugh nowait
        gm: 평생이라. 그거 좋구나.
        @wait 1.2
      `,
      after: s`
        bori: 평생 이용권… 할머니가 지갑에 넣고 다니셨어. 크레용 표.
        @act ruru surprise nowait
        ruru: 진짜? 백 원짜리 표를?
        nabi: 할머니 지갑에서 제일 비싼 거였을걸.
        toby: 그 표, 할머니 지갑에서 나온 걸 엄마가 봤어. 장례식 날.
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
        @sfx clock
        > 일곱 살. 저녁 먹기 전. 부엌엔 아무도 없다.
        @act haru lookAround
        @walk haru 12 7 30
        @face haru up
        @emote haru ♪
        @sfx drawer
        > 과자 서랍을 살금살금 연다. 딸기 사탕 하나.
        @sfx paper
        @pose haru hold
        @show gm grandma 4 8 right
        gm: 어허.
        @act haru surprise
        @emote haru !
        haru: 할, 할머니! 이거 그냥… 구경한 거야.
        @walk gm 11 7 30
        @face gm haru
        @pose gm hipsHands
        gm: 구경을 입으로 하니?
        @emote haru sweat
        @pose haru lookDown
        @pose gm idle
        gm: …하나만이다. 엄마한테는 비밀.
        @sfx paper
        > 할머니도 서랍에서 사탕 하나를 꺼내 입에 넣었다.
        haru: 할머니도 먹어?
        gm: 이제 할머니도 공범이지. 그러니까 둘이 비밀.
        @act haru giggle
        @emote haru ♥
        @wait 1
      `,
      after: s`
        bori: 그 서랍에서 제일 단 건 사탕이 아니었어. 할머니랑 비밀이었지.
        ruru: 보리, 그 말 멋있다. 근데 배고파서 하는 말이지?
        @act bori shrug nowait
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
        @sfx birds
        > 다섯 살 봄. 마당 꽃밭을 두른 낮은 돌담 위를 하루가 걷는다. 할머니 손을 꼭 잡고.
        haru: 할머니, 손 놓지 마!
        gm: 안 놓을게.
        @walk haru 8 6 20 nowait
        @walk gm 7 6 20
        haru: 진짜 안 놓을 거지?
        gm: 그럼. 아프게 꽉 잡아도 돼.
        @walk haru 12 6 20 nowait
        @walk gm 11 6 20
        @sfx thud
        > 돌 하나가 덜컥 흔들렸다. 하루가 휘청하자, 할머니 손에 힘이 꽉 들어갔다.
        @act haru tremble nowait
        @sfx heartbeat
        @emote haru !
        @wait 1
        haru: …안 넘어졌다.
        gm: 거봐. 안 놓는다고 했지.
        @walk haru 15 6 20 nowait
        @walk gm 14 6 20
        @act haru cheer
        @sfx laugh
        haru: 끝까지 왔다!
        haru: 할머니, 내일은 혼자 해 볼래. 그래도 손은… 옆에 둬.
        gm: 그래. 할머니 손은 늘 하루 옆에 있을게.
        @emote gm ♥
        @wait 1.2
      `,
      after: s`
        nabi: 이때는 정말 안 놓으셨어. 끝까지.
        toby: 현관에서 본 자전거 날은 달랐지. "안 놨어" 하고 놓아주셨어.
        ruru: 그럼 이건 그 착한 거짓말 전의… 진짜 약속이네.
        bori: 진짜로 잡아 줘 봤으니까, 나중에 놓아줄 수도 있었던 거야.
      `,
    },
  ],
  toybox: [
    {
      kind: 'memory',
      id: 'm9f',
      at: [13, 12],
      name: '토비의 심장 소리',
      caption: '"토비 심장 소리 들리지? 끼릭, 끼릭"',
      scene: s`
        @room m_room4
        @show haru haru4 15 5 down sleep
        @item toby9f toby 12 7
        @music none
        @sfx crickets
        > 토비가 온 지 며칠 뒤, 한밤중.
        @emote haru !
        @pose haru cry
        @sfx sob
        haru: 할머니이…!
        @sfx doorOpen
        @show gm grandma 1 3 down
        @music box
        @walk gm 12 6 60
        @face gm down
        @take gm toby9f
        @walk gm 13 5 30
        @face gm haru
        gm: 무서운 꿈 꿨니.
        @act haru shiver
        haru: 괴물이… 깜깜한 데서…
        @act gm pat
        @sfx pat
        gm: 그래, 그래. 자, 토비 안아 보렴. 귀를 토비 등에 대 봐.
        @give gm haru toby9f
        @pose haru hold
        @sfx windTick
        > 태엽이 풀리는 소리. 끼릭… 끼릭… 아주 작게.
        @sfx heartbeat
        gm: 들리지? 토비 심장 소리야.
        haru: …끼릭끼릭.
        gm: 토비 심장이 뛰는 동안은 토비가 하루를 지켜 준단다. 괴물도 못 와.
        haru: 그럼 토비 심장 안 멈추게, 내가 매일 감아 줄게.
        gm: 그래. 그럼 하루도 토비도 안 무섭지.
        @pose haru sleep
        @sfx blanket
        @wait 1.5
        > 하루는 토비를 품에 안고, 끼릭끼릭 소리를 세다가 잠들었다.
        @wait 1.2
      `,
      after: s`
        @emote toby …
        toby: 내 태엽 소리가… 하루한테는 심장 소리였구나.
        nabi: 그래서 하루가 열세 살까지 매일 밤 너를 안고 잤던 거야.
        bori: 그리고 태엽을 안 감은 뒤로는… 밤에 잘 못 잤지.
        @act toby nod
        toby: 이번엔 내가 하루 심장 소리를 들어 줄 거야.
      `,
    },
  ],
};
