/** 장마다 더해지는 기억 조각 둘 (넷째 · 다섯째): 기억 속 하루를 직접 움직이는 장면 포함 */
import { s } from '../parse.ts';
import type { Thing } from '../types.ts';

export const MORE: Record<string, Thing[]> = {
  attic: [
    {
      kind: 'memory',
      id: 'm1d',
      at: [16, 13],
      when: 'woke_all',
      name: '마지막 저녁',
      caption: '이 집에서의 마지막 저녁, 비어 있는 의자 하나',
      scene: s`
        @room m_kitchen_n
        @show dad dad 11 6 left sit
        @show mom mom 6 6 right sit
        @show haru haru15 9 8 up sit
        @music piano
        > 이삿날 전날 저녁. 이 집 부엌에서 먹는 마지막 밥.
        dad: 새집 가면 하루 방에 야광 별 스티커 붙여 줄까? 옛날처럼.
        haru: …됐어. 애도 아니고.
        dad: 하하, 그래, 그래.
        mom: 하루야, 반찬 좀 더 먹어.
        @emote haru …
        > 식탁 한쪽, 아무도 앉지 않은 의자 하나. 할머니 자리였다.
        @face haru up
        @wait 1.5
        haru: 잘 먹었습니다.
        @walk haru 9 10 40
        @hide haru
        @wait 0.8
        mom: …하루 저 의자 계속 보던데.
        dad: 그 의자도 가져가자. 버리지 말고.
        @wait 1
      `,
      after: s`
        bori: 할머니 의자… 하루가 몰래 보고 있었어.
        nabi: 하루는 아무렇지 않은 척을 너무 잘해. 그게 문제야.
        toby: 아빠는 의자를 가져간대. 그럼 우리도…
        ruru: 우리는 의자가 아니잖아. 상자에 있다고.
      `,
    },
    {
      kind: 'memory',
      id: 'm1e',
      at: [24, 15],
      when: 'woke_all',
      name: '몰래 챙긴 목도리',
      caption: '하루는 반만 뜬 노란 목도리를 가방에 넣었다',
      scene: s`
        @room m_room15
        @show haru haru15 5 6 down
        @music piano
        > 한밤중. 잠 못 든 하루가 상자를 다시 열었다.
        @walk haru 3 6 30
        @face haru up
        > 상자 맨 밑에서 노란 털실 뭉치를 꺼냈다. 반만 뜬 목도리. 뜨개바늘이 그대로 꽂혀 있다.
        @pose haru hold
        haru: …이건 두고 갈 수 없어.
        @wait 1
        > 하루는 목도리를 자기 가방 깊숙이 넣었다. 아무도 못 보게.
        @pose haru idle
        haru: 장난감은 두고 가도… 이건 안 돼.
        @wait 1
      `,
      after: s`
        ruru: 목도리는 챙기고 우리는 두고 간다고? 너무해!
        nabi: 아니야, 루루. 하루는 할머니 것만 챙긴 거야.
        toby: 우리도… 할머니가 준 거잖아.
        bori: 그럼 하루한테 우리도 할머니 거라고 알려 주자.
      `,
    },
  ],
  grandroom: [
    {
      kind: 'memory',
      id: 'm2d',
      at: [3, 12],
      name: '할머니 생신',
      caption: '할머니 없는 첫 생신, 식은 미역국',
      scene: s`
        @room m_kitchen_n
        @show mom mom 8 4 down
        @show haru haru14 3 8 right
        @music minor
        > 할머니가 떠나고 처음 맞는 할머니 생신.
        mom: 하루야, 할머니 생신이라 미역국 끓였어. 같이 먹자.
        haru: …배 안 고파.
        mom: 할머니 좋아하시던 거야.
        haru: 그러니까 안 먹는다고.
        @walk haru 1 6 50
        @hide haru
        @wait 1.2
        @emote mom …
        > 밤 열두 시. 부엌 불이 다시 켜졌다.
        @show haru haru14 9 7 up sit
        @wait 0.6
        > 하루가 혼자 식은 미역국을 데우지도 않고 떠먹었다.
        haru: …할머니 맛이랑 달라.
        @pose haru cry
        haru: 할머니가 끓인 거랑… 하나도 안 똑같아.
        @wait 1.5
      `,
      after: s`
        bori: 하루는 몰래 먹었어. 혼자서.
        ruru: 왜 같이 안 먹고?
        nabi: 같이 먹으면 울 것 같으니까. 엄마 앞에서는 울기 싫으니까.
        toby: 하루는 혼자서만 울어. 늘.
      `,
    },
    {
      kind: 'memory',
      id: 'm2e',
      at: [21, 8],
      name: '두 잔의 꿀차',
      caption: '빈 의자 앞에도 꿀차를 한 잔',
      scene: s`
        @room m_gm14
        @show haru haru14 1 3 down
        @music piano
        > 하루, 열네 살. 겨울밤, 몰래 할머니 방에 들어왔다.
        haru: 할머니가 타 주던 꿀차… 나도 탈 수 있어.
        @flag tea_go
        @control haru
        @goal 꿀단지를 찾자 (장롱 옆)
      `,
      after: s`
        bori: 꿀차…
        @emote bori tear
        bori: 할머니 꿀차는 꿀이 반이었어. 하루도 꿀을 반이나 넣었네.
        ruru: 그걸 어떻게 알아?
        bori: 꿀 냄새로 알지. 곰이니까.
      `,
    },
  ],
  underbed: [
    {
      kind: 'memory',
      id: 'm3d',
      at: [10, 5],
      dark: true,
      name: '괜찮아',
      caption: '「괜찮아」를 쓰고 지우고, 결국 「응」',
      scene: s`
        @room m_room13
        @show haru haru13 15 7 left sit
        @music sorrow
        > 휴대폰 화면이 밝아졌다. 친구에게서 온 문자.
        > 「하루야 괜찮아? 내일 학교 올 수 있어?」
        @emote haru …
        > 하루가 답장을 쓴다. 「괜찮아」. 지운다.
        @wait 1
        > 「나 괜찮」. 지운다.
        @wait 1
        > 「안 괜찮아」. 한참 바라보다가… 지운다.
        @wait 1.5
        > 「응」.
        @sfx pop
        > 전송.
        haru: …응.
        @wait 1.2
      `,
      after: s`
        ruru: 안 괜찮다고 쓰지. 왜 지워.
        nabi: 하루는 다른 사람이 걱정하는 게 더 싫은 거야.
        toby: 그래서 우리한테도 말을 안 했던 거야. 우리는 들어 줄 수 있는데.
      `,
    },
    {
      kind: 'memory',
      id: 'm3e',
      at: [20, 12],
      dark: true,
      name: '다 컸네',
      caption: '「이제 다 컸으니 인형은 정리해야지」',
      scene: s`
        @room m_living
        @show haru haru13 8 7 down
        @show mom mom 4 5 right
        @music sorrow
        > 장례식이 끝나고 친척들이 집에 모였다.
        mom: 하루야, 큰고모 오셨다. 인사드려.
        haru: …안녕하세요.
        > 친척 어른이 하루의 방을 들여다보고 말했다.
        > 「아이고, 하루 인형이 아직도 이렇게 많네. 이제 중학생인데 다 컸지. 이런 건 정리해야지.」
        @emote haru …
        haru: …네.
        > 어른들은 금방 다른 이야기로 넘어갔다. 하루만 오래도록 그 말을 붙잡고 있었다.
        @wait 1.5
      `,
      after: s`
        ruru: "다 컸으니 정리해야지." 누구 맘대로!
        bori: 그래서 하루가 "인형 가지고 놀 나이 아니야"라고 했구나. 그 말… 하루 말이 아니었어.
        toby: 남의 말을 빌려서 슬픈 걸 덮은 거야.
        nabi: 어른들은 가끔 아무 생각 없이 상자 뚜껑을 닫아 버려.
      `,
    },
  ],
  window: [
    {
      kind: 'memory',
      id: 'm4d',
      at: [2, 5],
      name: '할머니 지킴이',
      caption: '종이별 유리병을 할머니 머리맡에',
      scene: s`
        @room m_hospital
        @show haru haru12 15 8 left holdStar
        @music rain
        > 하루, 열두 살. 학교가 끝나자마자 병원으로 달려왔다.
        haru: 할머니 자고 있네. 깨우지 말아야지.
        @flag hos_go
        @control haru
        @goal 병실을 둘러보자 (창문 · 꽃병)
      `,
      after: s`
        nabi: 별 지킴이. 하루다운 생각이야.
        bori: 그 유리병… 지금은 하루 책상에 있지?
        toby: 응. 구백구십구 개 든 채로.
      `,
    },
    {
      kind: 'memory',
      id: 'm4e',
      at: [23, 2],
      name: '할머니의 밤',
      caption: '아무도 없는 병실, 할머니가 쓰던 편지',
      scene: s`
        @room m_hospital_n
        @music sorrow
        > 같은 날 밤. 하루가 돌아간 뒤의 병실.
        > 할머니가 힘겹게 몸을 일으켜, 머리맡 유리병 옆에서 편지지를 펼쳤다.
        gm: 콜록… 콜록.
        gm: 열다섯 살… 하루에게.
        @wait 1
        gm: 하루가 열다섯 살이면… 할머니는 없겠지.
        gm: 그때 우리 하루는 울고 있을까. 웃고 있을까.
        @wait 1.5
        gm: 울고 있으면… 이 편지가 조금 닦아 주면 좋겠구나.
        > 펜이 종이 위를 천천히 지나간다. 사각, 사각.
        gm: 토비야. 보리야. 루루야. 나비야.
        gm: 할머니가 못 하는 거, 너희가 해 주렴.
        @wait 1.5
      `,
      after: s`
        @emote toby !
        toby: 할머니가… 우리 이름을 불렀어.
        ruru: 할머니는 알고 계셨던 거야? 우리가 깨어 있다는 거?
        nabi: 할머니는 다 알고 계셨어. 처음부터.
        bori: "할머니가 못 하는 거, 너희가 해 주렴."
        toby: …응. 할게요, 할머니.
      `,
    },
  ],
  desk: [
    {
      kind: 'memory',
      id: 'm5d',
      at: [7, 6],
      name: '백 개',
      caption: '「천 개 되면 내 소원 들어줄 거지?」',
      scene: s`
        @room m_room10
        @show haru haru10 3 5 up holdStar
        @show gm grandma 6 6 left
        @music grandma
        > 종이별을 접기 시작한 지 한 달.
        @face haru gm
        haru: 할머니! 백 개 됐어!
        gm: 벌써? 우리 하루 대단하네. 상으로 꿀사탕 하나.
        @emote haru ♪
        haru: 할머니, 천 개 되면 내 소원 꼭 들어줘야 해. 약속!
        gm: 할머니가 들어주는 게 아니라 하늘이 들어주는 거란다.
        haru: 그럼 하늘이 안 들어주면 할머니가 들어줘.
        gm: 허허. 그래, 약속.
        @wait 1
      `,
      after: s`
        bori: 꿀사탕! 할머니 상은 늘 꿀사탕이었어.
        ruru: 하늘이 안 들어주면 할머니가 들어준다… 그 약속도 못 지키셨네.
        nabi: 아직 몰라. 하루 소원이 뭐였는지에 따라서.
      `,
    },
    {
      kind: 'memory',
      id: 'm5e',
      at: [20, 13],
      name: '숨바꼭질',
      caption: '기침 소리 때문에 들킨 할머니',
      scene: s`
        @room m_gm
        @show haru haru10 6 8 up
        @music box
        > 일요일 오후. 할머니 방에서 숨바꼭질.
        haru: 아홉, 열! 다 숨었지? 찾는다!
        @flag hide_go
        @control haru
        @goal 할머니를 찾자 (침대 쪽부터)
      `,
      after: s`
        ruru: 할머니 엄청 못 숨으신다.
        nabi: 일부러 들킨 거야. 하루가 금방 찾게.
        toby: 기침도… 일부러였을까.
        @emote toby …
        bori: 아닐 거야. 그때부터 아프셨던 거야.
      `,
    },
  ],
  shelf: [
    {
      kind: 'memory',
      id: 'm6d',
      at: [9, 12],
      name: '극장 포스터',
      caption: '「토비 극장 — 출연: 토비 · 보리 · 루루 · 나비」',
      scene: s`
        @room m_room8
        @show haru haru8 8 6 up sit
        @show gm grandma 10 6 left sit
        @music waltz
        > 하루가 크레용으로 포스터를 그린다.
        haru: 할머니, 「출연」은 어떻게 써?
        gm: 출, 연. 이렇게.
        haru: 출연… 토비, 보리, 루루, 나비. 그리고 특별 출연 할머니!
        gm: 할머니는 목소리만 나오는데?
        haru: 그러니까 특별 출연이지!
        @emote gm ♥
        @wait 1
      `,
      after: s`
        ruru: 특별 출연 할머니. 그 포스터 아직 있을까?
        bori: 다락방 상자에 있었어. 접힌 채로.
        toby: 그럼 그것도 챙겨 가야 해. 다.
      `,
    },
    {
      kind: 'memory',
      id: 'm6e',
      at: [18, 2],
      name: '할머니의 대본',
      caption: '「하루가 커서 극장이 끝나도, 너희가 기억해 주렴」',
      scene: s`
        @room m_living8
        @show gm grandma 8 5 down sit
        @music box
        > 그날 밤. 하루가 잠든 뒤, 할머니 혼자 거실에 남았다.
        > 할머니는 다음 주 「토비 극장」 대본을 쓰고 있었다.
        gm: 4화… 토비, 별을 따러 가다.
        @wait 1
        > 할머니가 무대 위 인형들을 하나씩 바라보았다.
        gm: 너희들, 듣고 있지?
        gm: 우리 하루가 크면 이 극장도 언젠가 끝나겠지. 그건 슬픈 게 아니란다. 다 크는 거니까.
        gm: 그래도 너희는 기억해 주렴. 하루가 얼마나 크게 웃었는지.
        @wait 1.5
        gm: …그리고 하루가 울 때는, 옆에 있어 주렴.
        @wait 1.5
      `,
      after: s`
        @emote nabi …
        nabi: 할머니는 정말 우리한테 말하고 있었어.
        toby: "하루가 울 때는, 옆에 있어 주렴."
        ruru: 근데 하루가 우리를 상자에 넣었는데 어떻게 옆에 있어!
        bori: 그러니까 상자에서 나온 거잖아, 지금.
        @emote ruru !
        ruru: …아.
      `,
    },
  ],
  drawer: [
    {
      kind: 'memory',
      id: 'm7d',
      at: [10, 13],
      name: '오르골',
      caption: '「하루가 태어난 날 할머니가 지은 노래란다」',
      scene: s`
        @room m_room7
        @show haru haru7 8 6 down
        @show gm grandma 10 6 left hold
        @music none
        > 생일 밤. 할머니가 작은 상자 하나를 내밀었다.
        gm: 할머니 선물은 이거란다.
        @pose gm idle
        @sfx open
        @music box
        > 뚜껑을 열자, 맑은 노래가 흘러나왔다. 미, 솔, 라…
        @emote haru !
        haru: 오르골이다! 이거 무슨 노래야?
        gm: 하루가 태어난 날, 할머니가 지은 노래란다. 하루의 노래.
        haru: 내 노래?
        gm: 그래. 하루가 슬플 때 열어 보렴. 할머니가 옆에서 불러 주는 거라고 생각하고.
        @emote haru ♥
        @wait 2
      `,
      after: s`
        toby: 이 노래…
        nabi: 이 집에서 늘 들리던 노래야. 하루가 슬플 때마다 오르골을 열었어.
        bori: 요즘은 안 들렸어. 두 해 동안.
        ruru: 오르골도… 상자 안에 있는 거 아냐?
        toby: …찾아야 해. 그것도.
      `,
    },
    {
      kind: 'memory',
      id: 'm7e',
      at: [17, 8],
      name: '설거지하던 밤',
      caption: '하루가 처음 들은 「병원」이라는 말',
      scene: s`
        @room m_kitchen_n
        @show mom mom 4 4 up
        @show gm grandma 6 4 up
        @show haru haru7 15 8 left
        @music grandma
        > 생일 파티가 끝난 밤. 물 마시러 나온 하루가 부엌 앞에서 멈췄다.
        mom: 어머니, 요즘 기침이 너무 잦으세요. 병원 한번 가 보세요.
        gm: 괜찮다. 하루 생일인데 무슨 병원 얘기니.
        mom: 그래도요…
        gm: 하루 들을라. 다음 주에 갈게.
        @emote haru ?
        haru: …병원?
        > 하루는 물을 마시지 않고 방으로 돌아갔다. 그날 처음, 할머니의 기침 소리가 무섭게 들렸다.
        @walk haru 16 9 40
        @hide haru
        @wait 1.2
      `,
      after: s`
        ruru: 일곱 살 때부터였어? 할머니가 아프셨던 게?
        nabi: 처음엔 조금. 그러다 점점.
        toby: 하루는 그때부터 알았던 거야. 그래서 열 살에 소원을 정한 거고.
        bori: 감기 낫게 해 달라는 소원…
      `,
    },
  ],
  yard: [
    {
      kind: 'memory',
      id: 'm8d',
      at: [5, 11],
      name: '빨랫줄',
      caption: '「토비야, 빨리 말라라」',
      scene: s`
        @room m_room5
        @show gm grandma 8 6 down
        @show haru haru5 10 7 left
        @music box
        > 그날 밤. 할머니가 진흙투성이 토비를 비누로 빡빡 빨았다.
        gm: 자, 깨끗해졌다. 이제 하룻밤 말리면 돼.
        haru: 토비 춥겠다.
        gm: 수건으로 꼭 짜 줬으니 괜찮아.
        @pose haru sit
        haru: 그럼 나 여기서 토비 마를 때까지 기다릴래.
        gm: 하루 잠 오는데?
        haru: 안 졸려…
        @wait 1.5
        @pose haru sleep
        > 하루는 오 분도 안 돼서 잠들었다. 할머니가 이불을 덮어 주었다.
        gm: 토비야, 빨리 말라라. 우리 하루가 기다린단다.
        @wait 1.5
      `,
      after: s`
        toby: 빨랫줄에 매달려서… 밤새 하루 자는 얼굴을 봤어.
        bori: 좋았겠다.
        toby: 응. 추웠는데, 좋았어.
      `,
    },
    {
      kind: 'memory',
      id: 'm8e',
      at: [24, 2],
      name: '별이 되어서',
      caption: '「하늘에 가면, 별이 되어서 내려다본단다」',
      scene: s`
        @room m_gm
        @show gm grandma 4 6 down sit
        @show haru haru5 5 7 up sit
        @music box
        > 비가 그친 밤. 하루는 할머니 무릎에 앉아 옛날이야기를 들었다.
        haru: 할머니도 엄마 있어?
        gm: 있었지. 할머니의 엄마. 지금은 하늘에 계신단다.
        haru: 하늘에 가면 못 와?
        gm: 못 오지. 대신… 별이 되어서 내려다본단다.
        haru: 그럼 별한테 말하면 들려?
        gm: 그럼, 다 들리지.
        @wait 1
        haru: 할머니는 하늘에 가지 마. 별 하지 마.
        gm: …허허. 하루가 다 클 때까지는 안 가마.
        haru: 나 안 클 거야!
        @wait 1.5
      `,
      after: s`
        nabi: 별이 되어서 내려다본다…
        ruru: 그래서 종이별이었어? 천 개나?
        toby: 하루는 알았던 걸까. 할머니가 별이 될 거라는 걸.
        bori: 아니면… 별을 많이 접으면, 할머니가 별이 안 되고 여기 있을 거라고 생각했을지도.
        @emote toby …
      `,
    },
  ],
  toybox: [
    {
      kind: 'memory',
      id: 'm9d',
      at: [12, 6],
      name: '할머니의 곰',
      caption: '「이 곰은 할머니 친구였는데, 이제 하루 친구 하렴」',
      scene: s`
        @room m_room4
        @show haru haru4 8 7 up hold
        @show gm grandma 10 6 left
        @music box
        > 토비가 온 다음 날. 할머니가 낡은 곰 인형 하나를 더 가져왔다.
        gm: 토비 혼자 심심하겠다 싶어서. 이 곰은 할머니 어릴 적 친구란다.
        haru: 곰 할아버지네!
        gm: 이제 하루 친구 하렴. 이름은 하루가 지어 주고.
        haru: 음… 보리! 보리차 색깔이니까!
        gm: 보리. 할머니는 곰돌이라고만 불렀는데, 보리가 훨씬 좋구나.
        @wait 1
      `,
      after: s`
        @emote bori ♥
        bori: 보리차 색깔이라서 보리였구나…
        ruru: 토끼라서 토비, 보리차라서 보리. 하루 작명 실력 일관성 있네.
        bori: 난 좋아. 아주 좋아.
      `,
    },
    {
      kind: 'memory',
      id: 'm9e',
      at: [19, 13],
      dark: true,
      name: '크레용 글씨',
      caption: '그림의 「평생 같이 놀자」는 할머니 글씨였다',
      scene: s`
        @room m_room4
        @show haru haru4 7 7 up sit
        @show gm grandma 9 7 left sit
        @music box
        > 하루가 크레용으로 그림을 그렸다. 할머니, 하루, 그리고 하얀 토끼.
        haru: 할머니, 여기 글씨 써 줘. 나 아직 글씨 못 써.
        gm: 뭐라고 써 줄까?
        haru: 평생 같이 놀자!
        > 할머니는 크레용을 받아 들고, 삐뚤빼뚤하게 썼다. 일부러 아이 글씨처럼.
        gm: 평생… 같이… 놀자.
        haru: 할머니 글씨 나보다 못 쓴다!
        gm: 그러게 말이다. 허허.
        @wait 1.5
      `,
      after: s`
        toby: 다락방 크레용 그림… 그 글씨, 할머니 글씨였구나.
        nabi: 하루한테 하는 약속이 아니라, 할머니가 하는 약속이었던 거야.
        ruru: 평생 같이 놀자. 할머니가.
        bori: 할머니는 지금도 그 약속 지키고 계신 거야. 태엽 할머니로. 그리고 우리로.
      `,
    },
  ],
};
