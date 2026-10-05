/** 장마다 일곱째 기억 조각: 다른 사람의 눈으로 본 빈칸들 (1장 ~ 7장) */
import { s } from '../parse.ts';
import type { RoomDef, Thing } from '../types.ts';
import { house } from './kit.ts';

export const MORE3A: Record<string, Thing[]> = {
  attic: [
    {
      kind: 'memory',
      id: 'm1g',
      at: [8, 10],
      when: 'woke_all',
      name: '문틀의 연필 줄',
      caption: '열두 살 줄과 열다섯 살 줄 사이, 아무도 재 주지 않은 빈칸',
      scene: s`
        @room m_room15
        @show dad dad 1 3 up kneel
        @show haru haru15 9 8 up
        @item m1box boxOpen 9 7
        @carry haru tape m1tape
        @music piano
        @sfx crickets
        > 이삿짐을 싸던 밤. 불 꺼진 하루 방 문간에 아빠가 쪼그려 앉아 있다. 손에는 하얀 페인트 붓.
        @sfx cardboard
        @sfx tapeRip
        @item m1box boxTaped
        @sfx tapeStick
        haru: 아빠? 거기서 뭐 해?
        dad: 어, 하루야. 집주인이 문틀 좀 칠해 놓고 가라고 해서.
        @put haru m1tape 8 8
        @walk haru 3 3 40
        @face haru left
        > 문틀 안쪽에 연필 줄이 촘촘하다. 줄마다 작은 글씨. 「하루 4살」, 「하루 5살」 … 「하루 12살」.
        haru: …이거 아직 있었어?
        dad: 할머니 글씨야. 생일마다 재셨잖아. 너 까치발 든다고 머리 꾹 누르시면서.
        haru: 열두 살에서 끝났네.
        dad: 응.
        @wait 1
        @act dad sigh
        dad: 붓을 들었는데… 아빠가 못 하겠더라. 이것만 한 시간째야.
        @emote haru …
        haru: 그럼 칠하지 마.
        dad: 그래도 남의 집 되는데.
        haru: 그 사람들도 보라고 해. 여기 하루라는 애가 살았다고.
        @pose dad idle
        dad: …그럼 하나만 더 그을까. 서 봐.
        @walk dad 1 4 30
        @face dad up
        @walk haru 1 3 30
        @face haru down
        > 연필이 정수리 위를 스윽 지나간다.
        @sfx marker
        @act dad pat nowait
        dad: 열다섯 살. 와, 많이 컸네.
        @face haru dad
        @sfx marker
        dad: 할머니 글씨 흉내 내 볼까. 「하루 15살」… 에이, 아빠 글씨는 지렁이다.
        haru: 할머니 글씨도 지렁이였어.
        @act haru laugh nowait
        @sfx laugh
        @emote dad ♪
        dad: 그건 할머니한테 이르면 안 된다.
        @wait 1.2
        > 열두 살 줄과 열다섯 살 줄 사이에는 손가락 두 마디만큼 빈칸이 남았다.
        > 그 사이에도 하루는 자랐다. 아무도 재 주지 않았을 뿐.
        @wait 1.5
      `,
      after: s`
        ruru: 열두 살이랑 열다섯 살 사이, 빈칸 봤어? 누가 좀 재 주지.
        bori: 아빠가 재 줬잖아. 지렁이 글씨로.
        nabi: 칠하지 않은 문틀은 이 집에 남아. 하루는 그걸 알고 떠나는 거야.
        toby: 하루는 자라는 걸 멈춘 적이 없어. 멈춘 건… 내 태엽뿐이야.
      `,
    },
  ],
  grandroom: [
    {
      kind: 'memory',
      id: 'm2g',
      at: [19, 13],
      name: '보라 카디건',
      caption: '장롱 앞에서, 하루는 엄마가 우는 걸 처음 보았다',
      scene: s`
        @room m_gm14
        @show mom mom 11 4 up cry
        @show haru haru14 1 3 right
        @music minor
        @sfx clock
        > 열네 살 가을 밤. 닫혀 있어야 할 할머니 방 문이 한 뼘쯤 열려 있다.
        > 장롱 앞에 엄마가 서 있다. 할머니의 보라색 카디건에 얼굴을 묻고.
        @emote haru !
        haru: …엄마?
        @pose mom idle
        @face mom haru
        @act mom wipe nowait
        mom: 어, 하루야. 아니야. 먼지가 들어가서.
        @sfx doorOpen
        @walk haru 9 5 40
        @face haru mom
        haru: 할머니 카디건이네.
        mom: 응. 아직 할머니 냄새가 나. 파스 냄새랑, 꿀 냄새랑.
        @wait 1
        mom: 엄마는 네 앞에선 안 울려고 했어. 엄마가 울면 하루가 더 못 울 것 같아서.
        haru: …나는 엄마는 안 슬픈 줄 알았어.
        mom: 엄마도 할머니 딸이야. 마흔이 넘어서도 "엄마" 하고 부를 사람이 있었는데.
        @emote mom tear
        @sfx sob
        > 엄마가 카디건 주머니에 손을 넣었다가, 멈췄다.
        @sfx clothes
        @sfx paper
        @carry mom paperstar m2star
        mom: …이것 봐.
        > 주머니 속에 꼬깃꼬깃한 종이별 하나. 그리고 껍질째 굳어 버린 꿀 사탕 하나.
        mom: 네가 처음 접은 별일걸. 모양이 제일 엉망이잖아.
        haru: 할머니가… 이걸 계속 갖고 다녔어?
        mom: 할머니 주머니엔 늘 네 거가 하나씩 들어 있었어.
        @walk haru 10 4 30
        @face haru mom
        @sfx hug
        @pose haru hug
        @wait 0.8
        @sfx sob
        @emote haru …
        @act mom pat
        @wait 1.2
        > 그날 하루는 엄마가 우는 걸 처음 보았다.
        > 하루는 엄마 등에 가만히 손을 얹었다. 울지는 않았다. 하루까지 울면, 정말이 될 것 같았다.
        @wait 1.5
      `,
      after: s`
        nabi: 카디건 주머니의 별… 할머니는 하루가 처음 접은 걸 늘 지니고 다니셨구나.
        bori: 꿀 사탕도! …그건 할머니 간식이었을 거야.
        ruru: 보리, 지금 그게 중요해?
        bori: 중요해. 단 걸 좋아하는 건 하루가 할머니를 닮은 거니까.
        toby: 엄마도 혼자 저 문을 열고 들어가 울었구나. 이 집엔 닫힌 문이 너무 많았어.
      `,
    },
  ],
  underbed: [
    {
      kind: 'memory',
      id: 'm3g',
      at: [18, 11],
      dark: true,
      name: '두 숟갈 반',
      caption: '엄마가 처음 타 준 꿀차는 너무 달았다',
      scene: s`
        @room m_room13
        @show haru haru13 16 8 left sit
        @pose haru hugKnees
        @music night
        @sfx clock
        > 장례식이 끝나고 사흘째 밤. 새벽 두 시. 하루 방 불은 꺼져 있다.
        > 하루는 침대가 아니라 침대 발치 바닥에 웅크려 앉아 있었다.
        @sfx doorOpen
        @show mom mom 1 3 down
        @carry mom cup m3cup
        mom: …안 자고 있었구나.
        haru: 불 켜지 마.
        mom: 안 켤게.
        @sfx doorClose
        @walk mom 15 8 40
        @face mom haru
        @pose mom sit
        > 엄마가 머그잔 두 개를 들고 하루 옆 바닥에 앉았다.
        @sfx dish
        @give mom haru m3cup
        @carry mom cup m3cup2
        @pose mom drink
        mom: 꿀차. 할머니가 너 잠 못 잘 때 타 주던 거.
        @pose haru drink
        @wait 0.8
        @sfx slurp
        > 한 모금. 하루가 얼굴을 찡그렸다.
        haru: …너무 달아.
        mom: 그치. 엄마는 꿀을 몇 숟갈 넣는지 몰라. 한 번도 안 물어봤거든.
        mom: 맨날 할머니가 해 줬으니까. 물어볼 시간은 많을 줄 알았지.
        @wait 1.2
        @act haru think nowait
        haru: 두 숟갈. 그리고 반 숟갈 더.
        @face mom haru
        mom: 응?
        haru: 할머니는 두 숟갈 반 넣었어. 반 숟갈은 "잠 잘 오는 숟갈"이래.
        @emote mom …
        mom: …그렇구나. 엄마가 하루한테 배우네.
        @wait 1.2
        @sfx slurp
        > 둘은 너무 단 꿀차를 끝까지 마셨다. 창밖이 파랗게 밝아 올 때까지, 아무 말 없이.
        @put haru m3cup 16 9
        @sfx birds
        @pose haru sleepSit
        @act mom pat
        @wait 1.5
      `,
      after: s`
        @act bori jump nowait
        bori: 두 숟갈 반! 반 숟갈은 잠 잘 오는 숟갈이었구나. 나도 몰랐어.
        ruru: 너는 꿀 얘기만 나오면 귀가 쫑긋하더라.
        ruru: 우리는 그때 상자 안에 있었어. 「열지 마」 쪽지 아래서, 꿀 냄새만 맡았지.
        toby: 하루가 할머니 방에서 꿀차 두 잔을 탄 게 그다음 해였어. 두 숟갈 반씩.
      `,
    },
  ],
  window: [
    {
      kind: 'memory',
      id: 'm4g',
      at: [16, 7],
      name: '약불에 천천히',
      caption: '할머니가 아빠에게 몰래 가르친 토스트 굽는 법',
      scene: s`
        @room m_hospital
        @show dad dad 7 5 right
        @music rain
        @sfx rainRoof
        > 열두 살 겨울. 하루가 학교에 간 오후, 병실엔 아빠가 와 있다.
        > 아빠가 사과를 깎는다. 껍질이 자꾸 뚝뚝 끊어진다.
        gm: 자네는 사과도 그렇게 깎나.
        @emote dad sweat
        dad: 하하… 어머니, 저 손재주 없는 거 아시잖아요.
        gm: 알지. 그래서 부탁할 게 있네.
        @emote dad ?
        gm: 하루 아침밥 말일세. 그 애는 아침을 굶으면 하루 종일 울상이야.
        dad: 에이, 그건 어머니가 퇴원하셔서 해 주셔야죠.
        @wait 1
        gm: …그래도 배워 두게. 토스트는 약불에. 뒤집기 전에 한 번 더 기다리고.
        gm: 버터는 넉넉히. 하루는 짭짤한 걸 좋아해.
        @act dad nod nowait
        dad: 약불, 한 번 더 기다리고, 버터 넉넉히.
        @sfx dish
        @carry dad book m4note
        @sfx paper
        @pose dad write
        > 아빠는 사과를 내려놓고 수첩에 받아 적었다. 글씨가 삐뚤빼뚤했다.
        gm: 처음엔 태울 거야. 괜찮네. 하루는 탄 것도 먹을 거야. 아빠가 해 준 거면.
        @wait 1.2
        dad: 어머니. 이런 얘기… 하루한테도 하셨어요?
        gm: 하루한텐 다 나아서 집에 간다고 했지. 그 애가 별을 접고 있잖나.
        @emote dad …
        gm: 별 접는 손은 가볍게 해 줘야지. 무거운 건 어른들이 들고.
        @wait 1.5
        dad: …약불에. 한 번 더 기다리고.
        @sfx fold
        @carry dad none
        @pose dad lookDown
        @sfx clock
        > 그날 저녁, 아빠는 아무도 없는 부엌에서 토스트를 세 장 태웠다. 하루는 아무것도 몰랐다.
        @wait 1.5
      `,
      after: s`
        ruru: 그 탄 토스트, 일 년 전부터 연습한 거였어? 그런데도 탔어?
        bori: 세 장 태우고, 수첩에 적고… 그래도 그날 아침엔 또 탔지. 맛있었을 거야.
        ruru: 그 수첩, 아까 아빠 배 위에 있던 거잖아.
        nabi: 첫 줄이 이거였구나. 「약불에」.
        toby: 약불에, 천천히. …할머니는 뭐든 태엽처럼 가르치셨어.
      `,
    },
  ],
  entrance: [
    {
      kind: 'memory',
      id: 'mEg',
      at: [10, 9],
      name: '교문 앞 말고',
      caption: '"교문 앞엔 오지 말라며. 여긴 교문 앞 아니잖니"',
      scene: s`
        @room m_7a_street
        @show gm grandma 4 5 right umbrella
        @carry gm umbrella mEumb
        @show haru haru11 19 4 left
        @music rain
        @sfx rainRoof
        > 열한 살 봄. 며칠 전 하루는 할머니에게 말했다. "학교 앞에 오지 마. 애들이 할머니가 데리러 온다고 놀려."
        @sfx bell
        > 갑자기 비가 쏟아진 하굣길. 교문을 나선 하루가 멈춰 섰다.
        > 교문에서 한참 떨어진 골목 모퉁이. 할머니가 우산을 쓰고 서 있었다. 손에는 접힌 우산이 하나 더.
        @emote haru !
        @walk haru 6 5 60
        @sfx splash
        @face haru gm
        haru: 할머니! 왜 여기 있어?
        gm: 교문 앞엔 오지 말라며. 여긴 교문 앞 아니잖니.
        haru: …언제부터 있었어?
        gm: 조금. 아주 조금.
        > 할머니 어깨 한쪽이 흠뻑 젖어 있었다. 하루 몫의 우산은 조금도 젖지 않았다.
        @emote haru …
        haru: 그 우산은 왜 안 썼어?
        gm: 이건 하루 거지. 할머니가 쓰면 축축해지잖니.
        @give gm haru mEumb
        @face gm up
        @sfx cough
        @act gm tremble nowait
        gm: 콜록… 아이고, 비 냄새가 맵다.
        haru: 할머니, 감기 걸렸어?
        @face gm haru
        gm: 아니. 우리 하루 놀리는 녀석들 흉보다가 사레들렸지.
        @wait 1
        haru: …내일부터는 교문 앞에 있어.
        gm: 애들이 놀린다며.
        @act haru point nowait
        haru: 놀리라고 해. 맨 앞에 있어. 내가 제일 먼저 찾게.
        @act gm laugh nowait
        gm: 허허. 너 여섯 살 때도 그랬다. 유치원 앞에서 오지 말라고 소리치고는, 저녁엔 맨 앞에서 기다리라고.
        @act haru surprise nowait
        haru: …내가?
        gm: 그럼. 할머니는 다 기억하지. 하루가 잊어버린 것까지.
        @emote gm ♥
        > 그날 하루는 자기 우산을 펴지 않았다. 할머니 우산 속으로, 어깨를 붙이고 들어갔다.
        @walk haru 5 5 30
        @face haru right
        @face gm right
        @walk gm 9 5 20 nowait
        @walk haru 10 5 20
        @wait 1.5
      `,
      after: s`
        ruru: 열한 살 하루, 좀 건방졌네. 학교 앞에 오지 말라니.
        nabi: 그 나이엔 다 그래. 창피한 게 하나둘 생기는 나이야.
        bori: 여섯 살 때랑 똑같은 싸움을 또 했대. 그리고 똑같이 화해했고.
        bori: 할머니는 그 뒤로 매일 교문 맨 앞에 서 계셨대. 비가 안 와도.
        toby: 그 기침… 사레들린 게 아니었을지도 몰라. 할머니가 동네 의원에 가신 건, 그해 가을이었어.
      `,
    },
  ],
  desk: [
    {
      kind: 'memory',
      id: 'm5g',
      at: [5, 9],
      name: '천 장 하고 한 장',
      caption: '할머니는 밤마다 별 종이를 잘랐다. 노란 것만 따로',
      scene: s`
        @room m_gm_n
        @show gm grandma 6 5 down sit
        @pose gm sew
        @item m5yel paperstar 5 6
        @item m5sew sewing 7 6
        @music night
        @sfx clock
        > 하루가 종이별을 처음 배운 그 주. 밤 열한 시, 할머니 방에만 불이 켜져 있다.
        @sfx scissors
        > 사각, 사각. 할머니가 색종이를 가늘고 길게 자른다.
        @sfx doorOpen
        @show mom mom 1 3 down
        mom: 엄마, 아직 안 자?
        gm: 쉿. 하루 깰라.
        @sfx doorClose
        @walk mom 7 4 30
        @face mom gm
        mom: 그게 다 뭐예요?
        gm: 별 종이. 하루가 천 개 접는다잖니. 그럼 종이가 천 장은 있어야지.
        mom: 문방구에 잘라서 파는 거 있어요. 내일 사 올게요.
        gm: 그건 색이 다 똑같아. 하루는 노란색을 제일 좋아하는데, 노란 건 조금밖에 안 들었더라.
        > 할머니 무릎 옆에, 노란 종이만 따로 수북하게 쌓여 있다.
        @emote mom …
        @act mom sigh
        mom: 손도 떨리시는데. 기침도 하시고.
        gm: 접는 손은 하루 손이고, 자르는 손은 할머니 손이지. 둘이 같이 접는 거다.
        @sfx cough
        @act gm tremble nowait
        @wait 1
        mom: …몇 장째예요?
        @sfx scissors
        gm: 이백… 서른하나. 천 장 하고 한 장 자를 거다.
        mom: 한 장은 왜요?
        gm: 혹시 모자랄까 봐. 마지막 한 장이 없어서 소원을 못 빌면, 얼마나 억울하겠니.
        @emote gm ♪
        @act gm laugh nowait
        @wait 1.5
        > 그 노란 종이들은 몇 년 동안, 하루의 책상 서랍에서 조금씩 줄어들었다.
        @wait 1.2
      `,
      after: s`
        ruru: 별 종이를 할머니가 다 자르신 거였어? 나는 하루가 사 온 줄 알았는데.
        toby: 하루는 아직 몰라. 별 하나하나에 할머니 가위 자국이 있다는 걸.
        bori: 천 장 하고 한 장… 그럼 하나 남는 거네.
        nabi: 남는 게 아니야. 기다리는 거지. 노란 한 장이.
      `,
    },
  ],
  bath: [
    {
      kind: 'memory',
      id: 'mBg',
      at: [17, 9],
      name: '눈썹 연필 주름',
      caption: '"웃은 자국은 그리는 게 아니라 쌓이는 거란다"',
      scene: s`
        @room m_bath
        @show haru haru9 11 4 up
        @carry haru pen mBpen
        @music waltz
        @sfx birds
        > 아홉 살, 일요일 아침. 세면대 거울 앞에서 하루가 무언가를 열심히 그리고 있다.
        > 엄마 화장대에서 몰래 가져온 갈색 눈썹 연필.
        @sfx marker
        haru: 여기 한 줄… 눈 옆에도 한 줄… 입 옆에도…
        @show mom mom 7 8 up
        mom: 하루야, 엄마 눈썹 연필 못 봤…
        @face haru down
        @emote mom !
        > 하루 얼굴에 갈색 줄이 스무 개쯤 그어져 있었다.
        mom: 너 얼굴이 왜 그래!
        @act haru jump nowait
        haru: 주름이야! 할머니가 주름은 웃은 자국이랬어. 나도 웃은 자국 많이 만들 거야.
        mom: 그건 그리는 게 아니라…
        @show gm grandma 3 7 right
        gm: 무슨 일이니, 아침부터.
        @face haru gm
        @sfx giggle
        @act gm laugh 1.5 nowait
        > 할머니는 하루 얼굴을 보더니, 벽을 짚고 웃기 시작했다. 소리도 안 나게, 어깨만 들썩들썩.
        @emote gm ♪
        gm: 아이고, 아이고, 배야.
        @act haru stomp nowait
        haru: 왜 웃어! 할머니 따라 한 건데.
        gm: 그래, 그래. 고맙다. 근데 하루야, 할머니 주름보다 훨씬 많구나.
        @walk gm 10 4 30
        @face gm up
        @sfx faucet
        @carry gm towel mBtowel
        @face gm haru
        gm: 웃은 자국은 그리는 게 아니라 쌓이는 거란다. 하루에 하나씩, 아주 천천히.
        @act haru think nowait
        haru: 천천히? 태엽처럼?
        @act gm nod nowait
        gm: 그래. 태엽처럼.
        @sfx clothes
        > 할머니가 따뜻한 수건으로 하루 얼굴을 닦는다. 갈색 줄이 하나씩 지워진다.
        @act gm pat nowait
        gm: 대신 오늘 할머니한테 웃은 자국이 하나 더 생겼다. 우리 하루 덕분에.
        @walk mom 11 5 30
        @face mom haru
        @face haru mom
        @give haru mom mBpen
        @emote mom sweat
        mom: 엄마, 칭찬하면 안 돼. 그거 제일 비싼 연필이야.
        @emote haru ♥
        @act haru giggle nowait
        @wait 1.2
      `,
      after: s`
        @act ruru laugh nowait
        ruru: 얼굴에 스무 줄! 아, 나도 봤어야 했는데.
        nabi: 넌 다 들었잖아. 하루 방 선반에서 웃다가 굴러떨어졌고.
        ruru: …그건 비밀이랬잖아.
        bori: 할머니 주름 중에 하나는 그날 생긴 거야. 눈썹 연필 날.
        toby: 하루 얼굴에도 이제 하나둘 생기겠지. 그려서가 아니라, 쌓여서.
      `,
    },
  ],
};

/** 일곱째 기억에서만 쓰는 사람 크기 기억 방 */
export const MEMROOMS3A: Record<string, () => RoomDef> = {
  // 학교 앞 골목 (11살 · 봄비)
  m_7a_street: () =>
    house(
      'm_7a_street',
      'yard',
      22,
      12,
      [
        ['fence', 1, 1, 20, 1],
        ['bush', 2, 8, 2, 2, true],
        ['bush', 17, 7, 3, 2, true],
        ['puddle', 9, 6, 3, 2],
        ['puddle', 14, 3, 2, 1],
        ['flowers', 6, 2, 4, 1],
      ],
      { wallH: 1, rain: true, music: 'rain' },
    ),
};
