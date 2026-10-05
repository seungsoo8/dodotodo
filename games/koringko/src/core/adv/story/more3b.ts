/** 장마다 일곱째 기억 조각 (8장~13장): 엄마 · 아빠의 눈, 할머니만 알던 밤들 */
import { s } from '../parse.ts';
import type { RoomDef, Thing } from '../types.ts';
import { house } from './kit.ts';

export const MORE3B: Record<string, Thing[]> = {
  shelf: [
    {
      kind: 'memory',
      id: 'm6g',
      at: [16, 12],
      name: '놀림 받은 날',
      caption: '「다 큰 사람도 인형이랑 놀아. 할머니 봐라」',
      scene: s`
        @room m_room8
        @show haru haru8 10 7 down
        @music grandma
        > 여덟 살 봄. 학교에서 돌아온 하루가 책장 맨 윗칸의 인형들을 한꺼번에 끌어내렸다.
        @sfx thud
        > 토비, 보리, 루루, 나비. 장난감 상자 속으로 툭, 툭.
        @show gm grandma 1 3 down
        @walk gm 7 6 40
        gm: 극장 문 닫았니?
        haru: 영원히 닫았어.
        gm: 저런. 표 열 장 산 사람은 어떡하라고.
        @emote haru anger
        haru: 민서가 그랬어. 아직도 인형 놀이 하는 건 아기래. 다들 웃었어.
        haru: 나 이제 인형 안 해.
        @emote gm …
        > 할머니는 아무 말 없이 상자에서 토비를 꺼냈다. 그리고 바닥에 털썩 앉았다.
        @pose gm sit
        @sfx windTick
        gm: 어흠. 토비 극장, 오늘의 공연. 「주인을 기다리는 토끼」.
        gm: (토비 목소리) 하루야, 여기 깜깜해. 태엽도 다 풀려 가.
        @emote haru …
        haru: …할머니 목소리 너무 굵어. 토비는 그렇게 안 해.
        gm: 그럼 감독님이 직접 해 보시든가.
        @wait 1
        @walk haru 8 6 30
        @pose haru sit
        haru: (토비 목소리) …하루야, 나 꺼내 줘. 깡충.
        @emote gm ♪
        gm: 하루야. 다 큰 사람도 인형이랑 놀아. 할머니 봐라. 이렇게 늙었는데도 놀잖니.
        haru: 할머니는 할머니니까 그렇지.
        gm: 좋아하는 걸 좋아한다고 말하는 게 제일 어른스러운 거란다. 숨기는 건 쉽지.
        @wait 1.2
        > 그날 저녁, 인형들은 책장 맨 윗칸으로 돌아갔다. 극장은 문을 닫지 않았다.
        @wait 1
      `,
      after: s`
        toby: 그날 상자 속은 깜깜했어. 처음으로.
        ruru: 민서라는 애, 나 기억해. 콧방귀 뀌어 줬어. 속으로.
        nabi: 열세 살 때 친척 어른이 "다 컸으니 정리해야지" 했을 때… 할머니가 계셨으면 뭐라고 하셨을까.
        bori: 아마 바닥에 털썩 앉아서, 토비 목소리를 내셨겠지. 굵게.
        toby: …그러니까 이번엔 우리가 내야 해. 우리 목소리로.
      `,
    },
  ],
  drawer: [
    {
      kind: 'memory',
      id: 'm7g',
      at: [7, 11],
      name: '할아버지의 열쇠',
      caption: '새 태엽 열쇠는 멈춘 회중시계에서 왔다',
      scene: s`
        @room m_gm_n
        @show gm grandma 3 4 up sit
        @music night
        > 일곱 살 생일 밤, 자정이 훨씬 넘은 시각. 할머니 방에만 불이 켜져 있다.
        @sfx click
        gm: 이것도 아니고… 이건 헐겁고.
        > 재봉틀 위에 열쇠 꾸러미, 단추 통, 부러진 태엽 열쇠. 그리고 등을 연 토비.
        @show dad dad 1 3 down
        @walk dad 1 5 40
        @walk dad 6 5 40
        dad: 어머님, 아직 안 주무세요?
        @face gm dad
        gm: 맞는 열쇠가 없네. 토비 구멍이 별나게 생겼어.
        dad: 내일 제가 시내 나가서 알아볼게요. 주무세요.
        gm: 내일이면 늦어. 하루가 눈 뜨자마자 토비부터 찾을 텐데.
        gm: 애들한테 하룻밤은 길다. 우리한텐 짧아도.
        @emote dad …
        > 할머니는 서랍 맨 안쪽에서 손수건에 싼 것을 꺼냈다. 멈춘 은빛 회중시계.
        dad: 그거… 아버님 시계 아니에요?
        gm: 멈춘 지 오래됐지. 고칠 사람도 없고.
        @sfx click
        gm: 시계는 멈췄어도, 열쇠는 아직 돌릴 게 남았잖니.
        @face gm up
        @sfx stitch
        > 할머니는 작은 줄칼로 열쇠 끝을 갈았다. 쓱, 쓱. 대 보고, 또 갈고.
        dad: 아버님이 서운해하시겠어요.
        gm: 그 양반이면 먼저 빼 줬을 거야. 은주 그네도 밤새 만든 사람이다.
        @wait 1
        @sfx windTick
        @wait 0.5
        @sfx windTick
        @wait 0.5
        @sfx windTick
        @emote gm !
        gm: …돌아간다.
        > 할머니는 빨간 리본을 꺼내 열쇠에 묶었다. 창밖이 희미하게 밝아 오고 있었다.
        gm: 하루한텐 그냥 새 열쇠라고 하자. 할아버지 얘기는… 나중에. 하루가 더 크면.
        @wait 1.5
      `,
      after: s`
        toby: 내 열쇠가… 할아버지 시계 열쇠였어?
        bori: 그래서 "천천히 감으렴" 하셨나 봐. 또 부러지면, 바꿔 줄 시계가 없으니까.
        ruru: 그 "나중에"는 결국 안 왔네. 하루는 아직 몰라.
        nabi: 그럼 우리가 전해 주면 돼. 토비 등에 할아버지 시간이 달려 있다고.
        @emote toby …
        toby: …조금 무거워졌어. 좋은 쪽으로.
      `,
    },
  ],
  balcony: [
    {
      kind: 'memory',
      id: 'mVg',
      at: [20, 7],
      name: '모퉁이에서 기다릴게',
      caption: '「내일부터 오지 마」 — 처음으로 할머니에게 소리친 날',
      scene: s`
        @room m_balcony
        @show gm grandma 13 4 up
        @music grandma
        > 여섯 살 가을, 해 질 녘. 할머니가 말없이 화분에 물을 주고 계신다.
        > 낮에 유치원 앞에서, 하루가 소리를 질렀다. "할머니 내일부터 오지 마! 다른 애들은 엄마가 온단 말이야!"
        @show haru haru6 3 6 right
        @wait 1
        @walk haru 9 6 25
        @emote haru …
        haru: …할머니.
        gm: 응.
        haru: 하루 꽃, 물 줬어?
        gm: 줬지. 하루 꽃은 매일 줘야지.
        @face gm haru
        gm: 할머니가 생각해 봤는데, 내일부턴 저 모퉁이 문방구 앞에서 기다릴게. 그럼 친구들 안 보지.
        @emote haru tear
        haru: …아니야.
        haru: 문 앞에서 기다려. 맨 앞에서.
        gm: 그래도 되겠니?
        haru: 응. 그리고 내가 제일 먼저 뛰어나올 거야.
        @walk haru 12 5 25
        @face haru up
        > 하루는 화분에서 막 핀 하루 꽃 한 송이를 똑 땄다.
        @sfx pop
        @face haru gm
        @pose haru hold
        haru: 미안해. 이거 첫 꽃이야. 할머니 거.
        @emote gm ♥
        gm: 아이고, 첫 꽃을 따 버렸네. …고맙다.
        > 할머니는 그 꽃을 수첩 사이에 끼워 말렸다. 하루가 다 잊어버린 뒤에도, 오래.
        @wait 1.2
      `,
      after: s`
        ruru: 하루가 할머니한테 소리 지른 적도 있었구나. 의외다.
        nabi: 여섯 살이잖아. 그래도 먼저 미안하다고 한 것도 하루였어. 첫 꽃까지 꺾어서.
        bori: 다음 날 할머니는 정말 문 앞 맨 앞에 서 계셨대.
        toby: 그리고 하루는 정말 제일 먼저 뛰어나왔지. 신발도 거꾸로 신고.
      `,
    },
  ],
  yard: [
    {
      kind: 'memory',
      id: 'm8g',
      at: [15, 10],
      name: '진흙 속 열쇠',
      caption: '비 오는 밤, 할머니와 엄마가 우산 하나로 마당을 뒤졌다',
      scene: s`
        @room m_7b_yard_rn
        @show gm grandma 16 7 left kneel
        @music rain
        > 토비를 찾은 그날 밤. 하루는 깨끗이 빤 토비 곁에서 잠들었다. 그런데 토비 등에 태엽 열쇠가 없었다.
        > 할머니가 큰 덤불 아래를 더듬고 있다. 손전등 하나 들고, 우산도 없이.
        @show mom mom 4 5 right umbrella
        mom: 어머니! 이 비에 뭐 하세요!
        @walk mom 15 7 40
        gm: 열쇠가 없어. 토비 열쇠.
        mom: 내일 찾아요. 날 밝으면. 감기 드세요.
        gm: 하루가 아침에 토비 등 보고 "열쇠 없다" 하면 또 울 거다. 오늘 많이 울었잖니.
        @emote mom …
        > 엄마는 우산을 할머니 쪽으로 기울였다. 자기 어깨가 젖는 것도 모르고.
        mom: …어머니는 나 어릴 때도 이랬어요. 내 고무신 한 짝 찾는다고 개울을 다 뒤지고.
        gm: 그랬나.
        mom: 그랬어요. 나는 그 고무신, 다음 날 또 잃어버렸는데.
        gm: 너는 잊어도 돼. 찾아 준 사람이 기억하면 되지.
        @wait 1
        @sfx sparkle
        @emote gm !
        gm: 여기 있다.
        > 진흙 속에서 작은 쇠붙이가 반짝였다.
        @pose gm idle
        gm: 은주야. 나중에 할머니 손이 굼떠지면, 이런 건 네가 찾아 줘라.
        mom: 어머니 손, 아직 나보다 빨라요.
        gm: 그러니까 나중에.
        @wait 1
        > 두 사람은 우산 하나를 쓰고 집으로 들어갔다. 엄마의 왼쪽 어깨가 흠뻑 젖어 있었다.
        @wait 1.2
      `,
      after: s`
        nabi: 그 열쇠, 일곱 살 생일에 부러진 첫 번째 열쇠야. 그 전에 한 번 잃어버릴 뻔했던 거네.
        toby: 몰랐어. 아침에 눈 떴을 땐 열쇠가 그냥 등에 있었으니까.
        bori: 하루 엄마 왼쪽 어깨… 하루한테 우산 씌워 줄 때도 맨날 젖어 있어.
        ruru: 유전이네. 젖는 쪽 어깨까지.
      `,
    },
  ],
  toybox: [
    {
      kind: 'memory',
      id: 'm9g',
      at: [3, 7],
      name: '어린이집 첫날',
      caption: '「토비가 열 번 걷고 멈추면, 할머니가 올게」',
      scene: s`
        @room m_7b_daycare
        @show haru haru4 8 6 down hold
        @show gm grandma 9 6 left kneel
        @music box
        > 네 살 봄. 어린이집 첫날. 하루는 토비를 안고 할머니 치마를 놓지 않는다.
        haru: 안 가. 할머니랑 집에 갈 거야.
        gm: 하루야, 할머니가 비밀 하나 알려 줄까.
        @emote haru ?
        gm: 토비 태엽을 세 번 감으면, 토비가 걷다가 멈추지?
        haru: 응.
        gm: 세 번 감고, 걷고, 멈추고. 그걸 열 번 하면, 할머니가 와.
        haru: 열 번이 몇 개야?
        gm: 하루 손가락 다 합친 만큼.
        @emote haru …
        haru: 그거 엄청 많잖아.
        gm: 그러니까 토비가 같이 있어야지. 혼자 세면 지루하니까.
        @sfx windTick
        @wait 0.5
        @sfx windTick
        @wait 0.5
        @sfx windTick
        haru: …하나.
        @pose gm idle
        @walk gm 1 3 30
        @hide gm
        @wait 1
        haru: 둘…
        @emote haru tear
        > 하루는 울면서 셌다. 셋, 넷… 다섯에서 울음을 그쳤고, 일곱에서 옆자리 아이에게 토비를 보여 주었다.
        @wait 1.2
        @show gm grandma 1 3 down
        > 열. 문이 열렸다.
        @emote haru !
        haru: 할머니! 진짜 왔어! 열 번 딱 맞았어!
        @walk gm 2 4 30
        @walk haru 3 4 40
        @face haru gm
        @pose haru hug
        gm: 할머니는 문 앞에서 기다렸단다. 처음부터.
        @wait 1.2
      `,
      after: s`
        toby: 내가 처음 해 본 일이… 시계 노릇이었구나.
        bori: 하루는 그 뒤로도 기다릴 때마다 태엽을 셌어. 병원 복도에서도.
        nabi: 할머니는 늘 문 앞에 계셨지. 하루가 모를 때도.
        ruru: 흥. 열 번쯤이야 나도 기다릴 수 있어. 하루가 상자를 열 때까지, 몇 번이든.
      `,
    },
  ],
  sewbox: [
    {
      kind: 'memory',
      id: 'mGg',
      at: [15, 7],
      name: '다시 뜨면 된다',
      caption: '하루가 잠든 밤마다, 할머니는 엄마에게 뜨개질을 다시 가르쳤다',
      scene: s`
        @room m_gm_n
        @show gm grandma 7 6 down sit
        @show mom mom 9 6 left sit
        @music box
        > 하루가 열두 살 되던 가을. 하루가 잠든 뒤, 할머니 방.
        > 둘 사이에 노란 털실 한 뭉치. 할머니가 바늘 두 개를 엄마 손에 쥐여 준다.
        mom: 어머니, 나 이런 거 못 하는 거 알잖아요. 어릴 때도 맨날 도망갔는데.
        gm: 그러니까 지금 배워. 바늘 걸고, 실 감고, 빼고.
        mom: 걸고… 감고… 아, 빠졌다.
        gm: 괜찮다. 다시 뜨면 된다.
        @wait 1
        mom: 이거 하루 목도리죠? 어머니가 떠 주시면 되잖아요.
        gm: 뜰 거다. 할 수 있는 데까지.
        gm: 근데 하루 성격 알잖니. 다 못 뜬 걸 보면, 지가 마저 뜨겠다고 할 거야.
        gm: 그때 옆에서 코 잡아 줄 사람이 있어야지.
        @emote mom …
        @sfx stitch
        > 엄마의 바늘이 한참 멈춰 있었다. 할머니는 그 손 위에 손을 얹고, 실을 한 번 감아 주었다.
        mom: …그럼 천천히 가르쳐 주세요. 나 엄청 느리게 배울 거예요.
        gm: 그래. 천천히.
        @wait 1
        gm: 아, 그리고 은주야. 하루한테 가르칠 땐 이렇게 말해라. "엄마도 맨날 빠뜨렸어."
        mom: 그건 진짜잖아요.
        gm: 그러니까. 진짜인 게 제일 잘 먹힌다.
        @emote gm ♪
        @wait 1.5
        > 그 가을, 할머니 방의 불은 매일 밤 조금씩 늦게 꺼졌다.
        @wait 1
      `,
      after: s`
        doll: 나는 재봉틀 위에서 다 보고 있었단다. 엄마는 정말 느리게 배웠어. 일부러.
        toby: 일부러?
        doll: 다 배우면… 수업이 끝나니까.
        bori: 나중에 하루가 나머지 반을 뜰 때, 엄마가 옆에서 "엄마도 맨날 빠뜨렸어" 하겠지. 할머니가 미리 써 준 대사구나.
        nabi: 할머니는 목도리 반쪽만 남기신 게 아니었어. 나머지 반을 뜰 손까지 남기셨어.
        ruru: …치. 이 집 사람들은 다 반칙이야.
      `,
    },
  ],
};

/** 일곱째 기억에서만 쓰는 사람 크기 기억 방 */
export const MEMROOMS3B: Record<string, () => RoomDef> = {
  // 마당 (5살 · 비 오는 밤): 토비를 찾은 그날 밤
  m_7b_yard_rn: () =>
    house('m_7b_yard_rn', 'yardNight', 22, 12, [
      ['fence', 1, 1, 20, 1],
      ['flowers', 2, 2, 6, 1],
      ['flowers', 14, 2, 6, 1],
      ['bush', 17, 7, 3, 2, true],
      ['bush', 2, 8, 2, 2, true],
      ['puddle', 6, 5, 3, 2],
      ['puddle', 12, 8, 3, 2],
      ['mud', 15, 4, 3, 2],
    ], { wallH: 1, rain: true, music: 'rain' }),
  // 어린이집 (4살 · 첫날)
  m_7b_daycare: () =>
    house('m_7b_daycare', 'haru4', 18, 11, [
      ['door', 1, 1, 1, 2],
      ['window:day', 4, 0, 4, 2],
      ['garland', 10, 0, 6, 2],
      ['toybox:open', 13, 3, 2, 1, true],
      ['shelf', 15, 3, 2, 1, true],
      ['rug:#f0c890', 5, 5, 7, 3],
      ['cushion', 3, 7, 2, 2],
      ['cushion', 12, 7, 2, 2],
      ['table', 14, 6, 3, 2, true],
    ], { music: 'box' }),
};
