/** 곁가지 장 · 보리의 찬장 — 곰 인형 보리가 본 순이 (할머니) 의 예순 해 */
import { s } from '../parse.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { house, houseMap } from './kit.ts';
import { kitchenHouse } from './layout_c.ts';


export const CH_CUPBOARD: Chapter = {
  n: 0,
  title: '0장 · 보리의 찬장',
  sub: '순이와 곰돌이의 예순 해',
  room: 'cupboard',
  start: [2, 12],
  party: ['toby', 'bori', 'ruru', 'nabi'],
  wind: 0.13,
  intro: s`
    @fade 1 0 white
    @bars on
    @music memory
    @chtitle
    @fade 0 2
    > 다시 부엌. 창밖이 조금 푸르스름하다. 열어 둔 과자 서랍 위로, 찬장 문이 살짝 열려 있다.
    @emote bori ♥
    bori: 킁킁… 이 냄새. 할머니 꿀단지야.
    @act ruru giggle nowait
    ruru: 너 진짜 꿀 냄새 따라서 여기까지 온 거야?
    bori: 반은. …나머지 반은, 이 냄새를 맡으니까 아주 옛날 일이 생각나서.
    toby: 옛날? 하루가 네 살 때?
    bori: 아니. 그보다 훨씬 전. 하루가 태어나기도 전. 할머니가 아직 「순이」였을 때.
    @sfx windTick
    > 끼…릭. 토비의 태엽이 느리게 돈다.
    toby: …괜찮아. 보리 이야기는 꼭 듣고 갈래.
    nabi: 앞장서, 보리. 오늘은 네 찬장이야.
    bori: 응. 꿀단지 앞에서 안 멈춘다고 약속은… 못 하지만.
    @bars off
    @goal 꿀단지 밑에 있는 곰돌이의 첫 단추 눈을 찾자
  `,
};

export function cupboardRoom(): RoomDef {
  const r = houseMap({
    ...kitchenHouse('cupboard'),
    things: [
      {
        kind: 'memory',
        id: 'mOa',
        at: [7, 15],
        name: '곰돌이',
        caption: '「꿀 좋아하는 곰이다. 꼭 너처럼」',
        scene: s`
          @room m_br_home
          @show gmom gmom 3 4 up sit
          @carry gmom bear bori
          @pose gmom sew
          @show suni suni7 9 7 up
          @music memory
          @sfx wind
          > 아주 오래전 겨울. 바느질하는 엄마 등 뒤에서, 일곱 살 순이가 발끝으로 서서 기웃거렸다.
          @act suni peek
          suni: 엄마, 아직이야? 아직이야?
          gmom: 조금만. 눈만 달면 된다.
          @sfx stitch
          @wait 1
          @sfx scissors
          @pose gmom sit
          > 마지막 바늘땀. 단추 눈 두 개가 달리고 — 나는, 처음으로 세상을 보았다.
          > 제일 먼저 보인 건, 동그랗게 커진 여자아이의 눈이었다.
          @face gmom right
          gmom: 자. 아버지 헌 외투로 만든 거라 색이 좀 바랬다만.
          @walk suni 5 5 60
          @face suni gmom
          @give gmom suni bori
          @sfx hug
          @emote suni ♥
          @act suni jump nowait
          suni: 곰이다! 곰돌이! 너는 곰돌이야!
          gmom: 곰돌이는 꿀을 아주 좋아한단다. 꼭 너처럼.
          @act suni clap nowait
          suni: 그럼 나랑 나눠 먹으면 되겠다!
          gmom: 그래. 속상한 날엔 둘이 꿀 한 숟갈씩. 꿀처럼 마음이 달콤해지라고.
          @wait 1
          suni: 곰돌아, 우리 평생 같이 살자.
          @wait 1.5
        `,
        after: s`
          @emote bori …
          bori: 나 꿀 좋아하는 거… 태어날 때부터 정해진 거였어.
          ruru: 먹보인 것도 설계였네. 순이 엄마가 책임지셔야겠다.
          toby: 순이가… 할머니 이름이야?
          bori: 응. 그때 할머니는 일곱 살이었어. 지금 하루보다 훨씬 작은.
          nabi: 「평생 같이」. 할머니 말버릇은 그때부터였구나.
        `,
      },
      {
        kind: 'memory',
        id: 'mOg',
        at: [7, 4],
        name: '까치밥',
        caption: '「하나는 남겨 둬라. 누가 배고플지 모르니까」',
        scene: s`
          @room m_out_village_d
          @show suni suni7 5 4 down sit
          @carry suni bear bori
          @show gmom gmom 12 4 up
          @music night
          @sfx wind
          > 내가 곰돌이가 된 지 이레째 되는 겨울 저녁. 순이는 어딜 가든 나를 안고 다녔다. 우물가에도, 장독대에도.
          suni: 엄마, 곰돌이 배고프대.
          @act gmom think nowait
          gmom: 곰돌이가 그러디?
          suni: 응. 아까부터 꼬르륵 했어.
          @face gmom suni
          gmom: 그건 네 배다.
          @sfx giggle
          @emote suni sweat
          @wait 0.8
          gmom: …옜다. 감기 들면 먹이려고 아껴 둔 꿀인데.
          @walk gmom 6 4 40
          @face gmom suni
          @face suni gmom
          @sfx spoon
          > 놋숟가락에 꿀 한 숟갈. 순이는 숟가락을 반만 핥고, 나머지 반을 내 입가에 콕 묻혔다.
          suni: 곰돌이 반, 나 반.
          gmom: 아이고, 곰돌이 털 다 끈적해지겠다.
          suni: 곰돌이는 꿀 좋아한댔잖아. 엄마가.
          @emote gmom ♪
          @wait 1
          @face suni right
          @act suni point nowait
          suni: 엄마. 감나무 꼭대기 감은 왜 안 땄어? 하나 남았어.
          gmom: 까치밥이다.
          suni: 까치밥?
          gmom: 다 따 먹으면 겨울에 새들이 굶잖니. 그래서 하나는 남겨 두는 거야.
          @emote suni ?
          @act suni think
          suni: …그럼 곰돌이 꿀도 까치 줘야 돼?
          gmom: 곰돌이 몫은 곰돌이 거지.
          gmom: 대신 순아. 너도 이다음에 크거든, 네 거 다 먹지 말고 하나는 남겨 둬라. 누가 배고플지 모르니까.
          suni: 누가?
          gmom: 그건 그때 가 봐야 알지.
          @wait 1
          > 창호지에 불이 들어왔다. 감나무 꼭대기 홍시 하나가 마지막 햇빛을 받아, 등불처럼 빛났다.
          gmom: 들어가자. 곰돌이 감기 든다.
          suni: 곰돌이는 털 있어서 괜찮아.
          @act gmom pat
          gmom: 너는 털 없잖니.
          @emote suni ♪
          > 그날 처음, 내 입가에 꿀이 묻었다. 달았다. …아마도.
          @wait 1.5
        `,
        explore: {
          enter: [10, 9],
          intro: s`
            bori: 여기는… 순이가 자란 마을. 내가 곰돌이가 된 지 이레째 되는 저녁이야.
            ruru: 흙길이다. 우리 발에 흙 묻으면 하루가 빨아 줘야 하는데.
            toby: 저 툇마루에 앉은 아이가… 순이구나.
          `,
          threads: [
            { at: [16, 5], text: s`
              > 우물가 두레박. 가장자리에 살얼음이 끼어 있다.
              ruru: 순이가 이걸로 물을 길었어? 일곱 살이?
              bori: 반 바가지씩. 나를 안은 채로. 그래서 그 겨울 내 발은 늘 축축했어.
            ` },
            { at: [19, 5], text: s`
              > 잎이 다 떨어진 감나무. 꼭대기에 빨간 홍시 하나만 덩그러니 남아 있다.
              toby: 왜 저거 하나만 안 땄을까.
              nabi: 손이 안 닿았거나… 일부러 남겼거나.
            ` },
            { at: [6, 8], text: s`
              > 빈 리어카. 바닥에 곶감 꼭지 몇 개가 굴러다닌다.
              bori: 순이 엄마는 장날마다 곶감을 팔러 갔어. 순이는 돌아오는 리어카 뒤에 타고, 나는 순이 품에 타고.
            ` },
          ],
          looks: [
            { at: [5, 5], text: s`
              > 툇마루 끝에 앉은 일곱 살 순이. 곰 인형을 꼭 안고, 발을 동동 구르다 멈춰 있다. 댓돌 위엔 작은 흰 고무신.
              bori: 저때는 발이 땅에 안 닿았어. 그래서 늘 동동.
            ` },
            { at: [12, 5], text: s`
              > 장독대 앞의 순이 엄마. 한 손에 놋숟가락을 들고 있다.
              ruru: 어, 저 숟가락! 찬장에 있던 반들반들한 거 아냐?
              bori: 응. 할머니 꿀 숟가락. 그때는 반들반들하지 않았지만.
            ` },
          ],
        },
        after: s`
          @emote bori ♥
          bori: 내 첫 꿀이었어. 반 숟갈.
          ruru: 일곱 살이 곰한테 반이나 줬다고? 너보다 통이 크네.
          bori: 나도 반은 줄 수 있어. …아마도.
          toby: 「하나는 남겨 둬라」… 할머니가 하루 소풍 도시락에 김밥을 두 줄 싸 준 거, 여기서 온 거구나.
          nabi: 그래서 할머니 찬장엔 늘 꿀이 한 숟갈쯤 남아 있었어. 누가 배고플지 모르니까.
        `,
      },
      {
        kind: 'memory',
        id: 'mOb',
        at: [2, 9],
        name: '가져가는 짐',
        caption: '「다른 건 다 두고 가도, 곰돌이는 데려갈래」',
        scene: s`
          @room m_br_home_n
          @show suni suni20 8 6 down
          @show gmom gmom 3 4 right sit
          @item bori bear 8 7
          @music night
          @sfx crickets
          > 순이, 스무 살. 시집가기 전날 밤.
          > 작은 보따리 하나에 옷 몇 벌. 순이는 짐을 쌌다가 풀고, 또 쌌다.
          @sfx clothes
          gmom: 그 보따리 하나면 되겠니?
          @act suni nod nowait
          suni: 응. 저쪽 집에 다 있대. 이불도, 그릇도.
          @take suni bori
          > 순이가 마지막으로 나를 집어 들어, 보따리 맨 위에 올렸다.
          @face suni right
          @put suni bori
          gmom: …곰돌이도 데려가니? 다 큰 색시가.
          suni: 다른 건 다 두고 가도, 곰돌이는 데려갈래.
          @emote gmom …
          gmom: 그래. 그럼 힘든 날엔 엄마 대신 곰돌이한테 말해라.
          @act suni shake nowait
          suni: 엄마 대신은 아무도 못 해.
          @wait 1
          suni: …그래도 꿀은 같이 먹을게. 엄마가 그랬잖아. 속상할 땐 꿀 한 숟갈.
          @walk suni 5 5 50
          @face suni gmom
          @face gmom suni
          @act suni bow
          gmom: 가서 잘 살아라, 순아.
          @act gmom pat
          @sfx pat
          @wait 1.5
        `,
        after: s`
          bori: 나는 그날 처음으로 「가져가는 짐」이 됐어.
          bori: 할머니는 그 뒤로 이사할 때마다, 나를 넣은 상자에 꼭 할머니 글씨로 썼어. 「가져가는 짐」.
          @emote toby …
          toby: 하루는 우리를 「두고 가는 짐」에 넣었는데.
          ruru: 아직 이사 안 갔어. 내일 아침까진 모르는 거야.
          bori: 응. 그 쪽지, 세 번이나 고쳐 썼잖아. 네 번째도 있을 거야.
        `,
      },
      {
        kind: 'memory',
        id: 'mOc',
        at: [4, 2],
        name: '꿀차와 그네',
        caption: '「그네도 매어 놨소. 나중에 우리 애 태워 주게」',
        scene: s`
          @room m_br_house
          @show suni suni20 5 6 right
          @show gpa gpa 12 6 left
          @music waltz
          @sfx birds
          > 새집에서 맞은 첫봄. 신랑은 말수가 적은 사람이었다.
          @act gpa shrug nowait
          gpa: …저기. 이거.
          @pose gpa hold
          suni: 꿀이네요? 웬 꿀을…
          gpa: 장모님이 그러시던데. 당신은 꿀만 있으면 운다고. 아니, 안 운다고.
          @act suni laugh nowait
          suni: 둘 다 맞는 말이에요.
          @pose gpa idle
          @walk suni 6 6 40
          @face suni right
          @sfx pour
          @sfx spoon
          > 순이가 꿀차를 두 잔 탔다. 그리고 몰래, 내 입가에도 꿀을 콕.
          @carry suni cup tea
          @walk suni 6 7 40
          @walk suni 11 7 40
          @face suni gpa
          @face gpa suni
          @give suni gpa tea
          @emote gpa ?
          gpa: …곰한테도 주오?
          suni: 곰돌이는 저보다 꿀을 더 좋아해요.
          gpa: 허. 그럼 꿀을 두 배로 사 와야겠군.
          @wait 1
          gpa: 그리고… 뒤뜰 감나무에 그네를 하나 매어 놨소.
          @act suni surprise nowait
          suni: 그네요?
          gpa: 나중에 우리 애 생기면 태워 주려고. 재봉틀도 하나 들였소. 헌 거지만.
          @emote suni ♥
          suni: …당신은 말은 없는데, 할 일은 다 해 놓네요.
          @pose gpa drink
          gpa: 말은 당신이 해 주면 되지.
          @wait 1.5
        `,
        explore: {
          enter: [2, 9],
          intro: s`
            bori: 여기는 순이가 시집와서 처음 산 집. 새집에서 맞은 첫봄이야.
            toby: 할머니가 하루보다 겨우 몇 살 많았을 때구나.
            nabi: 멈춘 순간 속에 기억의 실이 흩어져 있어. 다 이으면 이 봄이 흘러갈 거야.
          `,
          threads: [
            { at: [8, 4], text: s`
              > 탁자 위, 뚜껑이 반쯤 열린 꿀단지. 찻잔 두 개가 나란히 놓여 있다.
              @emote bori ♥
              bori: 할아버지가 처음 사 온 꿀이야. 그 뒤로 이 집 찬장엔 꿀이 떨어진 적이 없어.
            ` },
            { at: [14, 4], text: s`
              > 새로 들인 재봉틀. 헌 거라는데, 바늘판이 반짝반짝 닦여 있다.
              nabi: 누가 밤새 닦아 놓은 것 같아. 말없이.
              ruru: …저 바늘, 어디서 본 것 같은데. 내 꼬리가 기억하는 느낌이야.
            ` },
            { at: [5, 4], text: s`
              > 창밖 뒤뜰. 감나무 가지에 새 밧줄 두 가닥이 내려와 있다. 아직 아무도 앉지 않은 나무판.
              toby: 저건… 그네?
              bori: 탈 사람이 아직 안 생겼으니까. 할아버지는 늘 먼저 준비해 두는 사람이었어.
            ` },
          ],
          looks: [
            { at: [12, 7], text: s`
              > 할아버지. 한 손을 등 뒤로 감추고, 헛기침을 할까 말까 하는 얼굴이다.
              ruru: 저 얼굴, 선물 숨긴 얼굴이야. 하루 아빠가 인형 뽑기 끝나고 딱 저랬어.
            ` },
            { at: [5, 7], text: s`
              > 스무 살 순이. 앞치마에 밀가루가 묻었다.
              bori: 순이가 제일 많이 웃던 봄이야. 주름은… 아마 이때부터 생기기 시작했을걸.
            ` },
          ],
        },
        after: s`
          nabi: 할머니 재봉틀… 할아버지가 들여놓은 거였어.
          ruru: 내 꼬리도, 나비 너도, 다 그 재봉틀에서 나왔잖아.
          bori: 할아버지는 하루를 못 만나셨지만, 그 재봉틀로 우리를 조금씩 만나신 거야.
          toby: …그 그네는?
          bori: 은주가 제일 많이 탔지. 할아버지가 밀고, 할머니가 꿀차 들고 구경하고.
        `,
      },
      {
        kind: 'memory',
        id: 'mOd',
        at: [13, 3],
        name: '은주의 곰',
        caption: '「밤엔 은주 친구, 낮엔 엄마 친구」',
        scene: s`
          @room m_br_house
          @show suni suni40 5 8 right
          @show eunju eunju6 9 8 left hold
          @music waltz
          @sfx birds
          > 순이, 마흔 무렵. 여섯 살 은주가 나를 품에 안고 놓지 않았다.
          @act eunju stomp nowait
          eunju: 엄마, 이 곰 나 줘! 나 줘!
          suni: 곰돌이는 엄마 친구야. 엄마가 너만 할 때부터.
          eunju: 엄마는 다 컸잖아! 다 크면 곰 없어도 되잖아!
          @emote suni …
          suni: 다 커도… 친구는 필요하단다.
          @emote eunju tear
          eunju: 그럼 나는? 나 무서운 꿈 꾸면?
          @wait 1
          @walk suni 8 8 50
          @pose suni kneel
          @sfx pat
          suni: 그럼 이렇게 하자. 밤엔 은주 친구, 낮엔 엄마 친구.
          @emote eunju !
          @act eunju jump nowait
          eunju: 진짜? 오늘 밤부터?
          suni: 오늘 밤부터. 대신 곰돌이한테 꿀 나눠 줘야 한다.
          @sfx spoon
          > 그날 밤, 은주는 숟가락째 꿀을 내 귀에 발라 주었다. 왼쪽 귀의 얼룩은 그때 생겼다.
          suni: 아이고, 귀로 먹는 곰이 어디 있니.
          eunju: 귀가 배고프대!
          @sfx laugh
          @wait 1.5
        `,
        after: s`
          ruru: 잠깐. 엄마도 보리를 안고 잤다고? 하루 엄마가?
          bori: 은주는 열 살 넘어서까지 나를 안고 잤어. 비밀이야.
          nabi: 그런데 하루가 열세 살 때, 친척 어른이 「다 컸으니 정리해야지」 할 때는 아무 말도 못 했잖아.
          bori: 은주도 알아. 다 컸다고 다 잊는 건 아니라는 거. 그래서 그날 하루 얼굴을 못 봤던 거야.
          @emote bori ♪
          bori: 귀 얼룩은 지금도 있어. 가끔 꿀 냄새도 나.
        `,
      },
      {
        kind: 'memory',
        id: 'mOe',
        at: [22, 3],
        name: '빈 의자 앞의 꿀차',
        caption: '「꿀처럼… 마음이 달콤해지라고」',
        scene: s`
          @room m_br_house_n
          @show suni suni40 8 7 up sit
          @carry suni bear bori
          @music sorrow
          @sfx wind
          > 은주가 스무 살 되던 해 겨울. 할아버지는 긴 잠에 들었다.
          > 장례를 치르고 돌아온 밤. 사람들이 다 돌아간 집은 너무 넓었다.
          @show mom mom 1 3 right
          @sfx doorOpen
          mom: 엄마… 좀 누워요. 사흘을 못 잤잖아.
          suni: 그래. 너 먼저 자라. 엄마는 차 한 잔만.
          @hide mom
          @sfx doorClose
          @wait 1
          @sfx pour
          @wait 0.5
          @sfx spoon
          @pose suni lookDown
          > 순이는 꿀차를 두 잔 탔다. 한 잔은 자기 앞에, 한 잔은 빈 의자 앞에.
          @wait 1.5
          suni: …당신은 말이 없더니, 가는 것도 말없이 가네요.
          @emote suni tear
          @pose suni sit
          @sfx hug
          > 순이가 나를 끌어안았다. 그 오랜 세월 동안, 이렇게 세게 안은 적은 없었다.
          suni: 곰돌아. 엄마가 그랬지. 속상할 땐 꿀 한 숟갈.
          suni: 꿀처럼… 마음이 달콤해지라고.
          @pose suni cry
          @sfx sob
          @wait 1.5
          > 그날 밤 순이는 꿀차를 한 모금도 마시지 못했다. 나는 순이 눈물에 젖어, 아침까지 마르지 않았다.
          @wait 2
        `,
        explore: {
          enter: [2, 9],
          intro: s`
            bori: 같은 집. 그 봄에서 서른 해 넘게 지난 겨울밤. 할아버지를 보내고 온 날이야.
            @emote bori …
            bori: 이 밤은… 나도 오래 안 꺼내 본 밤이야.
            toby: 천천히 걷자, 보리. 우리가 옆에 있어.
          `,
          threads: [
            { at: [8, 4], text: s`
              > 탁자 위에 꿀차 두 잔. 한 잔은 빈 의자 앞에 놓여 있다. 김이 공중에 멈춰 있다.
              nabi: …두 잔. 이거, 어디서 본 것 같아.
              toby: 응. 나도.
            ` },
            { at: [10, 3], text: s`
              > 벽에 걸린 사진. 감나무 그네 위에서 어린 은주가 하늘로 발을 뻗고, 뒤에서 할아버지가 밀고 있다.
              ruru: 그 그네, 결국 엄청 탔구나. 신발 벗겨질 만큼.
            ` },
            { at: [12, 3], text: s`
              > 벽시계. 태엽이 다 풀려 바늘이 멈춰 있다.
              toby: 이 시계는 할아버지가 매일 감았대. …사흘 동안 아무도 감지 않았어.
              @emote toby …
            ` },
          ],
          looks: [
            { at: [8, 8], text: s`
              > 쉰을 넘긴 순이. 검은 옷 그대로, 무릎 위에 곰 한 마리를 올려 두었다.
              @emote bori tear
              bori: …그게 나야. 저 밤에 나는, 순이 무릎에서 아무것도 못 했어.
            ` },
            { at: [2, 3], text: s`
              > 문틈으로 복도 불빛. 누군가 자지 않고 서 있는 그림자.
              nabi: 은주야. 엄마가 걱정돼서, 들어가지도 못하고.
            ` },
          ],
        },
        after: s`
          @emote toby …
          toby: 두 잔의 꿀차… 하루도 똑같이 했어. 할머니 없는 방에서.
          nabi: 하루는 그걸 할머니한테 배운 적 없는데.
          bori: 응. 아무도 안 가르쳐 줬는데 똑같이 했어. 그날 하루 방에서, 나 깜짝 놀랐어.
          ruru: …꿀 얘기만 나오면 보리 목소리가 작아지네.
          bori: 꿀은 원래 조용히 먹는 거야.
        `,
      },
      {
        kind: 'memory',
        id: 'mOf',
        at: [26, 15],
        name: '곰돌이의 마지막 밤',
        caption: '「하루가 이름을 새로 지어 줄 거다」',
        scene: s`
          @room m_gm_n
          @show gm grandma 6 6 down sit
          @carry gm bear bori
          @music memory
          @sfx clock
          > 하루가 네 살 되던 해. 토비가 하루 품에 안긴 날 밤.
          > 할머니는 늦게까지 불을 켜 두고, 나를 무릎에 앉혔다.
          gm: 곰돌아. 오늘 하루가 토비를 얼마나 좋아하던지 봤니?
          gm: 이름을 부르고, 또 부르고. 백 번은 불렀을 거다.
          @pose gm sew
          @sfx stitch
          > 할머니가 헐거워진 내 단추 눈을 다시 단단히 꿰맸다.
          @act gm pat
          gm: 이제 눈 떨어질 걱정은 없다. 하루가 아무리 세게 끌어안아도.
          @wait 1
          @pose gm sit
          gm: 내일부턴 하루 친구 해 다오. 할머니 친구는 오늘까지다.
          gm: 하루는 어둠도 무섭고, 혼자 자는 것도 무섭고… 무서운 게 많은 애란다.
          gm: 그러니까 곰돌아. 이제 하루를 지켜 다오.
          @wait 1.5
          gm: 아마 하루가 이름을 새로 지어 줄 거다. 곰돌이보다 훨씬 예쁜 이름으로.
          @emote gm …
          gm: 서운해하지 마라. 곰돌이라는 이름은… 할머니가 가져가마.
          @sfx spoon
          > 할머니가 마지막으로 내 입가에 꿀을 콕 묻혔다. 예순 해 전, 그날처럼.
          gm: 맛있게 먹고, 하루 잘 부탁한다.
          @wait 2
        `,
        after: s`
          @emote bori tear
          bori: …그래서 하루가 「보리」라고 불렀을 때, 할머니가 그렇게 웃으셨구나.
          ruru: 곰돌이. 풉. …아니, 좋은 이름이야. 진짜로.
          toby: 할머니가 나한테 하루 태엽을 맡기셨듯이, 보리한테는 하루를 맡기셨네.
          bori: 응. 나는 약속을 두 번 받았어. 순이한테 한 번, 할머니한테 한 번.
          nabi: 같은 사람이잖아.
          bori: 응. 같은 사람. 일곱 살 때부터 쭉.
        `,
      },
      {
        kind: 'link',
        id: 'lO',
        at: [38, 13],
        name: '꿀단지와 단추',
        icon: 'jar',
        locked: s`bori: 아직 꿀 냄새가 남아 있어. 찬장 선반 구석구석 찾아보자.`,
        scene: s`
          @bars on
          > 찬장 맨 안쪽, 작은 꿀단지 하나. 뚜껑에 실로 묶인 단추 두 개가 매달려 있다.
          @emote bori !
          @act bori surprise nowait
          bori: 이거… 내 눈이랑 똑같은 단추야.
          nabi: 여벌 눈이네. 할머니가 혹시 몰라 남겨 두신 거야.
          bori: 할머니는 단추를 늘 재봉 상자에 모아 두셨어. 다락방 구석, 그 낡은 상자에.
          toby: 태엽 할머니도 거기서 기다리고 계셔.
          ruru: 하루 이야기, 보리 이야기… 이제 남은 건?
          toby: 할머니 이야기. 할머니가 아무한테도 말 안 하고 혼자 지킨 이야기.
          @emote bori …
          bori: 가자. 꿀단지는… 돌아와서 마저 볼게.
          > 상징물에 깃든 기억이 흐트러져 있다. 조각을 맞춰야 다음 기억으로 이어진다.
          @mini thread5
          @sfx open
          @flag chO_done
          @sfx memory
          @fade 1 1.4 white
          @next
        `,
      },
      // ── 놀이 1 · 찬장 위로: 「부엌」 상자를 열린 과자 서랍 옆에 밀어 디딤돌 → 루루 밧줄로 찬장 문까지
      {
        kind: 'trigger',
        id: 'cupboard_look',
        rect: [20, 4, 7, 4],
        unless: 'step_box',
        scene: s`
          > 오른쪽 벽 위 찬장 문이 조금 열려 있다. 그 아래, 아까 열어 둔 과자 서랍이 아직 빠져나와 있다.
          bori: 꿀 냄새… 저 위야. 찬장 속.
          toby: 서랍 옆에 상자를 하나 대면, 그걸 밟고 밧줄을 걸 수 있겠어.
          @goal 「부엌」 상자를 과자 서랍 옆에 밀어 대고, 찬장 위로 올라가자
        `,
      },
      { kind: 'push', id: 'step_box', at: [24, 7], look: 'cartonM:부엌' },
      { kind: 'pad', id: 'step_pad', at: [26, 5], accepts: ['step_box'], flag: 'step_box' },
      { kind: 'spot', id: 'box_undo', at: [19, 5], scene: s`
        @reset step_box
        > 「부엌」 상자를 처음 자리로 도로 끌어다 놓았다.
      ` },
      { kind: 'climb', id: 'to_shelf', at: [26, 4], to: [28, 2], who: 'ruru', when: 'step_box' },
      {
        kind: 'trigger',
        id: 'shelf_in',
        rect: [28, 1, 4, 3],
        scene: s`
          > 찬장 속. 맨 윗선반에서 내려다보니, 세 단 선반이 층층이 깜깜하게 이어진다.
          bori: 꿀단지는 맨 아랫단이야. 무거운 건 늘 아래에 두셨거든.
          @goal 그릇 탑을 지나, 맨 아랫단 꿀단지까지 내려가자
        `,
      },
      { kind: 'climb', id: 'shelf_down1', at: [37, 3], to: [37, 6], who: 'ruru' },
      // ── 놀이 2 · 그릇 탑: 밥그릇 · 국그릇 탑 사이에 낀 큰 그릇을 두 번 밀어 길을 낸다
      { kind: 'push', id: 'bowl_big', at: [33, 7], look: 'bowlStack:one' },
      { kind: 'pad', id: 'bowl_rest', at: [31, 7], accepts: ['bowl_big'], flag: 'bowls_moved' },
      { kind: 'climb', id: 'shelf_down2', at: [29, 8], to: [29, 11], who: 'ruru' },
      // 그릇 탑을 지나면, 루루가 맨 아랫단에서 부엌 바닥까지 밧줄을 드리워 둔다 (동료를 데리러 오가는 지름길)
      { kind: 'climb', id: 'shelf_rope', at: [26, 12], to: [28, 12], who: 'any', when: 'bowls_moved' },
      // ── 놀이 3 · 까치밥: 꿀 한 숟갈 먹을까, 남겨 둘까 → 넷이 함께 뚜껑을 돌린다
      {
        kind: 'trigger',
        id: 'honey_talk',
        rect: [32, 11, 6, 4],
        unless: 'kkachi_done',
        scene: s`
          @bars on
          > 맨 아랫단 한가운데 커다란 꿀단지. 가까이 가자, 느릿한 목소리가 들리는 것 같다.
          > 「곰돌아… 왔구나. 순이가 너한테 몰래 꿀 찍어 주던 거, 다 봤다.」
          @emote bori !
          bori: …꿀 할매. 나를 아직 곰돌이라고 불러.
          > 「한 숟갈 먹어도 된다. 오늘 밤은 특별하니까.」
          @choice kkachi | 꿀 한 숟갈만 먹는다 | 하나는 남겨 둔다
          @if kkachi_0
            @act bori jump nowait
            bori: 그럼… 딱 한 숟갈만!
            > 보리가 숟가락 끝으로 꿀을 찍어 코에 대 본다. 냄새만으로도 배가 부르다.
            @wait 0.6
            @emote bori …
            bori: …남겨 둘걸. 할머니는 늘 하나는 남겨 두셨는데.
          @else
            @act bori shake nowait
            bori: 아니야. 하나는 남겨 둘래. 누가 배고플지 모르니까.
            > 「…순이 말버릇이로구나.」
          @end
          > 「뚜껑 밑을 보려무나. 무거우니, 다 같이 돌려야 할 게다.」
          @flag kkachi_done
          @bars off
          @goal 다 같이 꿀단지 뚜껑을 돌려 열자
        `,
      },
      {
        kind: 'pull',
        id: 'honey_lid',
        at: [35, 12],
        look: 'honeyJar',
        look2: 'honeyJar:open',
        need: ['bori', 'ruru', 'nabi'],
        tugs: 3,
        flag: 'lid_open',
        when: 'kkachi_done',
        scene: s`
          > 끼이익— 무거운 뚜껑이 한 바퀴 돌아 열렸다. 뚜껑 밑에 작은 단추 통이 숨겨져 있다.
          @emote bori !
          bori: 단추 통이다. 할머니 단추 통.
          @goal 꿀단지와 단추에 닿자
        `,
      },
      // ── 종이별
      { kind: 'star', id: 'sOa', at: [39, 1], text: '꿀단지 뚜껑 위의 종이별.' },
      { kind: 'star', id: 'sOb', at: [30, 6], text: '밥그릇 사이에 낀 종이별.' },
      { kind: 'star', id: 'sOc', at: [24, 11], text: '보리차 깡통 뒤의 종이별.' },
      { kind: 'star', id: 'sOd', at: [39, 14], text: '쌀 포대 주름 사이의 종이별.' },
      // ── 살펴보기
      {
        kind: 'spot',
        id: 'o_honey',
        at: [34, 11],
        scene: s`
          > 커다란 꿀단지. 뚜껑 둘레에 꿀이 굳어 반짝인다.
          @emote bori ♥
          bori: 한 입만…
          nabi: 보리. 장난감은 꿀 못 먹어.
          bori: 알아. 냄새만 먹는 거야. 예순 해째 그렇게 먹고 있어.
        `,
      },
      {
        kind: 'spot',
        id: 'o_rice',
        at: [13, 4],
        scene: s`
          > 쌀 포대가 벽처럼 기대어 서 있다.
          ruru: 푹신해 보여. 보리 배만큼.
          bori: 내 배가 더 푹신해. 은주가 보증했어.
        `,
      },
      {
        kind: 'spot',
        id: 'o_bowls',
        at: [34, 6],
        scene: s`
          > 밥그릇이 탑처럼 쌓여 있다. 맨 위 작은 그릇에 삐뚤빼뚤한 글씨, 「하루」.
          toby: 하루 밥그릇이다.
          bori: 그 밑엔 은주 그릇, 그 밑엔 할머니 그릇. 맨 아래 있는 게 제일 오래된 거야.
          nabi: 그릇도 차례로 쌓이는구나. 사람처럼.
        `,
      },
      {
        kind: 'spot',
        id: 'o_tea',
        at: [30, 14],
        scene: s`
          > 보리차 깡통. 구수한 냄새가 난다.
          bori: 하루가 이거 보고 내 이름을 지었어. 내 색이랑 똑같다고.
          ruru: 나란히 서 봐. …어, 진짜 똑같네.
          toby: 곰돌이보다 보리가 더 보리 같아.
          bori: 그게 무슨 말이야…
        `,
      },
      {
        kind: 'spot',
        id: 'o_spoon',
        at: [35, 2],
        scene: s`
          > 오래된 놋숟가락 하나. 손잡이가 닳아 반들반들하다.
          bori: 할머니 꿀 숟가락. 순이 엄마가 쓰던 걸 할머니가 물려받으셨어.
          toby: 숟가락도 대물림하는구나.
          bori: 응. 꿀 한 숟갈도.
        `,
      },
    ],
  });
  return {
    ...r,
    toys: true,
    amb: [
      { name: 'fridgeHum', gain: 0.14 },
      { name: 'clockTick', gain: 0.08 },
    ],
    hangouts: {
      bori: { at: [12, 10], pose: 'chinRest', dir: 'up', talk: s`
        @act bori lookAround nowait
        bori: 꿀 냄새가 찬장에서 내려와. 아까 과자 서랍 열 때보다 진해.
        bori: 상자 밀 땐 불러. 오늘은 내 찬장이니까 내가 앞장설게.
      ` },
      ruru: { at: [6, 9], dir: 'right', talk: s`
        @act ruru point nowait
        ruru: 서랍 열어 둔 거 잘했네. 디딤돌로 딱이야.
        ruru: 찬장까지 밧줄 걸 땐 나를 불러.
      ` },
      nabi: { at: [22, 11], pose: 'sleepSit', dir: 'left', talk: s`
        @act nabi stretch nowait
        nabi: 창이 조금 밝아졌어. 새벽이 오나 봐.
        nabi: 찬장 속은 깜깜할 거야. 같이 가자고 하면 갈게.
      ` },
    },
  };
}

/** 순이가 자란 옛집과, 시집가서 살던 집 (사람 크기) */
const W = 18;
const H = 11;

export const CUPBOARD_MEMROOMS: Record<string, () => RoomDef> = {
  // 순이의 옛집 (낮): 순이 엄마의 바느질 자리
  m_br_home: () =>
    house('m_br_home', 'oldhome', W, H, [
      ['door', 1, 1, 1, 2],
      ['window:day', 7, 0, 3, 2],
      ['sewing:thread', 2, 3, 3, 1, true],
      ['wardrobe', 13, 3, 2, 1, true],
      ['rug:#c89a6a', 5, 5, 6, 3],
      ['cushion', 12, 7, 2, 2],
      ['plant', 16, 3, 1, 1, true],
    ]),
  // 순이의 옛집 (밤): 시집가기 전날
  m_br_home_n: () =>
    house('m_br_home_n', 'oldhomeNight', W, H, [
      ['door', 1, 1, 1, 2],
      ['window:night', 7, 0, 3, 2],
      ['sewing:thread', 2, 3, 3, 1, true],
      ['wardrobe', 13, 3, 2, 1, true],
      ['rug:#a8805a', 5, 5, 6, 3],
      ['boxes:tape', 12, 7, 1, 1, true],
    ]),
  // 순이와 할아버지의 집 (낮): 꿀차 상 · 새로 들인 재봉틀
  m_br_house: () =>
    house('m_br_house', 'oldhome', W, H, [
      ['door', 1, 1, 1, 2],
      ['window:day', 4, 0, 3, 2],
      ['clock', 12, 0, 2, 2],
      ['table:tea', 7, 5, 4, 2, true],
      ['sewing:thread', 13, 3, 3, 1, true],
      ['rug:#b88a5a', 6, 7, 6, 2],
      ['plant', 16, 3, 1, 1, true],
    ]),
  // 같은 집 (밤): 할아버지가 떠난 날
  m_br_house_n: () =>
    house('m_br_house_n', 'oldhomeNight', W, H, [
      ['door', 1, 1, 1, 2],
      ['window:night', 4, 0, 3, 2],
      ['clock', 12, 0, 2, 2],
      ['photo', 9, 0, 2, 2],
      ['table:tea', 7, 5, 4, 2, true],
      ['sewing:thread', 13, 3, 3, 1, true],
      ['rug:#8a6a4a', 6, 7, 6, 2],
    ]),
};
