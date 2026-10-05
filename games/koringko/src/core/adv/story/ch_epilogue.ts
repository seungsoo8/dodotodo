/** 에필로그 · 새 방 (15살, 새집의 첫 겨울) — 다시 걷게 된 장난감들이 새집에서 쌓인 기억을 본다 */
import { s } from '../parse.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { grid, toyRoom } from './kit.ts';

const MAP = grid(30, 18, 'w', 'K', [
  // 책상 끝 낭떠러지 (루루 밧줄)
  ['v', 11, 1, 1, 16],
  // 선반 칸막이 (가운데 한 칸은 상자가 막고 있다 — 보리가 민다)
  ['K', 12, 9, 17, 1],
  ['w', 20, 9, 1, 1],
  ['O', 7, 8, 1, 1],
  ['O', 24, 3, 1, 1],
  ['O', 17, 12, 1, 1],
  ['K', 3, 11, 2, 2],
]);

export const EPILOGUE: Chapter = {
  n: 0,
  title: '에필로그 · 새 방',
  sub: '15살, 새집의 첫 겨울',
  room: 'newroom_toy',
  start: [4, 15],
  party: ['toby', 'bori', 'ruru', 'nabi'],
  wind: 1,
  intro: s`
    @fade 1 0 white
    @bars on
    @music box
    @chtitle
    @fade 0 2.5
    > 몇 주 뒤. 새집, 하루의 방. 창밖에 첫눈이 내린다.
    @sfx windTick
    @wait 0.5
    @emote toby !
    toby: …움직여. 태엽이 가득 차 있어!
    bori: 하루가 오늘 아침에도 감아 줬어. 하나, 둘, 셋.
    ruru: 매일 세 번! 하루도 안 빼먹었어!
    nabi: 그래서 우리가 이렇게 밤마다 깨어나는 거지.
    @face toby doll
    doll: 다들 잘 잤니.
    toby: 태엽 할머니!
    doll: 하루가 내 태엽도 매일 감아 준단다. 이 할머니, 덕분에 아직 한참 남았어.
    @emote ruru ♥
    doll: 이 방에도 벌써 기억이 쌓였단다. 몇 주 사이에. 보러 가렴.
    toby: 이번엔… 슬픈 기억이 아니었으면 좋겠다.
    doll: 직접 보렴.
    @bars off
    @goal 새 방의 기억 조각 여섯 개를 찾자
  `,
};

export function newroomToyRoom(): RoomDef {
  return toyRoom('newroom_toy', MAP, {
    name: '새 방',
    theme: 'village',
    start: [4, 15],
    music: 'box',
    ambient: [150, 150, 190],
    beams: [{ x: 14, w: 5, h: 8, slant: -2 }],
    lights: [{ at: [26, 14], r: 80, color: [255, 220, 150], k: 0.4 }],
    things: [
      { kind: 'npc', id: 'doll', at: [6, 14], actor: 'grandoll', dir: 'right', scene: s`
        doll: 하루가 요즘 할머니 얘기를 자주 한단다. 웃으면서.
        doll: 슬픔을 천천히 풀고 있는 거야. 태엽처럼.
      ` },
      {
        kind: 'memory',
        id: 'mEPa',
        at: [5, 4],
        name: '가져온 짐',
        caption: '「가져온 짐」 상자에서 친구들이 나왔다',
        scene: s`
          @room h_newroom
          @show haru haru15 6 6 up
          @show mom mom 11 7 left
          @music piano
          > 이사 온 첫날 밤. 하루가 「가져온 짐」 상자를 연다.
          @pose haru hold
          > 토비, 보리, 루루, 나비, 그리고 태엽 할머니. 하나씩 선반에 앉힌다.
          mom: 하루야, 그 상자 두고 온다더니.
          haru: …마음 바뀌었어.
          mom: 잘했어.
          @pose haru idle
          @walk haru 9 5 30
          @face haru up
          haru: 토비는 창가. 햇빛 제일 잘 드는 데.
          haru: 할머니 인형은 그 옆. 둘이 같이 있어야 하니까.
          @emote mom ♥
          @wait 1.2
        `,
        after: s`
          ruru: 우리가 선반에 나란히 앉은 날이야!
          bori: 창가 자리. 하루가 직접 골라 줬어.
          toby: 「두고 가는 짐」이 「가져온 짐」이 된 날.
        `,
      },
      {
        kind: 'memory',
        id: 'mEPb',
        at: [8, 12],
        name: '할머니 맛',
        caption: '할머니에게 배운 미역국, 마음을 한 숟갈',
        scene: s`
          @room m_kitchen_n
          @show mom mom 8 4 down
          @show haru haru15 6 6 right
          @music waltz
          > 할머니 생신. 올해는 하루가 먼저 부엌에 왔다.
          haru: 엄마. 올해 미역국은… 내가 끓여도 돼?
          mom: 하루가? 할 줄 알아?
          haru: 할머니가 알려 줬어. 열한 살 때. 그때는 엄청 짜게 만들었지만.
          @walk haru 8 6 30
          > 참기름에 고기를 달달 볶고, 불린 미역을 넣고, 물을 붓는다.
          haru: 그리고 마지막에… 마음을 한 숟갈.
          @emote mom !
          mom: 그거… 할머니가 엄마한테도 하던 말인데.
          @wait 1
          > 보글보글. 부엌에 고소한 냄새가 퍼진다.
          @emote haru …
          haru: …아직 할머니 맛은 아니야.
          haru: 그래도 비슷해. 아주 조금.
          mom: 엄마도 처음엔 할머니 맛이 안 났어. 몇 년 걸렸어.
          haru: 그럼 몇 년 끓이면 되겠네.
          @emote mom ♥
          @wait 1
        `,
        after: s`
          bori: 미역국 냄새가 여기까지 났었어. 나 그날 엄청 배고팠어.
          nabi: 작년엔 혼자 몰래 식은 걸 먹었잖아. 올해는 자기가 끓여서, 엄마랑 같이.
          ruru: 열한 살 때 그 짠 미역국! 그게 연습이었구나.
          toby: 몇 년 끓이면 된대. 하루는 이제 "몇 년"을 말할 수 있어.
        `,
      },
      {
        kind: 'memory',
        id: 'mEPc',
        at: [16, 4],
        name: '나머지 반',
        caption: '반은 할머니의 코, 반은 하루의 삐뚤빼뚤한 코',
        scene: s`
          @room h_newroom
          @show haru haru15 5 6 right sit
          @show mom mom 7 6 left sit
          @music box
          > 밤. 하루와 엄마가 노란 털실을 사이에 두고 앉았다.
          mom: 바늘을 이렇게 걸고, 실을 감고, 빼고.
          haru: 걸고, 감고… 아, 또 빠졌어!
          mom: 엄마도 할머니한테 이거 배울 때 맨날 빠뜨렸어.
          haru: 엄마도?
          mom: 그럼. 할머니가 그때마다 "괜찮다, 다시 뜨면 된다" 하셨지.
          @wait 1
          > 몇 줄을 더 떴다. 할머니가 뜬 반쪽 옆에, 삐뚤빼뚤한 줄이 이어진다.
          haru: …완전 티 나.
          mom: 티 나야지. 반은 할머니 거, 반은 하루 거니까.
          @emote haru ♪
          @wait 1
        `,
        after: s`
          nabi: 할머니가 "나머지 반은 네가 떠라" 하셨잖아.
          ruru: 진짜로 뜨고 있어! 엄청 삐뚤빼뚤하게!
          toby: 그래서 좋은 거야. 할머니랑 하루가 한 목도리에 같이 있으니까.
        `,
      },
      {
        kind: 'memory',
        id: 'mEPd',
        at: [25, 6],
        name: '야광 별',
        caption: '"…붙여 줘. 옛날처럼."',
        scene: s`
          @room h_newroom
          @show dad dad 9 5 up
          @show haru haru15 6 7 up
          @music piano
          > 아빠가 의자 위에 올라가 천장을 올려다본다. 손에는 야광 별 스티커.
          dad: 이거… 이사 박스에서 나왔는데. 버릴까?
          @emote haru …
          haru: …붙여 줘.
          @emote dad !
          haru: 옛날처럼. 침대 위에. 북두칠성 모양으로.
          dad: 하하. 아빠가 북두칠성을 기억하나 모르겠다.
          haru: 내가 알려 줄게. 할머니가 알려 준 거야.
          @walk haru 8 6 30
          > 불을 끄자, 천장에 작은 별들이 초록빛으로 떠올랐다.
          @emote haru ♪
          dad: 어때. 비슷해?
          haru: 하나 삐뚤어졌어. …그래도 좋아.
          @wait 1.2
        `,
        after: s`
          toby: 이사 전날 밤에 아빠가 물어봤잖아. 별 스티커 붙여 줄까 하고.
          bori: 그땐 "애도 아니고" 했는데.
          nabi: 그때는 별을 보면 아팠고, 지금은 별을 보면 웃는 거야.
        `,
      },
      {
        kind: 'memory',
        id: 'mEPe',
        at: [15, 13],
        name: '할머니 의자',
        caption: '할머니 의자에서 하는 숙제',
        scene: s`
          @room h_newroom
          @show dad dad 12 7 left
          @show haru haru15 4 6 right
          @music waltz
          > 아빠가 낡은 나무 의자를 들고 들어온다. 부엌 식탁, 할머니 자리였던 의자.
          dad: 하루야, 이 의자 어디 둘까? 부엌엔 자리가 없어서.
          haru: …여기. 내 책상 앞에.
          dad: 할머니 의자인데, 괜찮겠어?
          haru: 할머니 의자니까.
          @walk dad 5 5 30
          > 하루가 의자에 앉는다. 등받이에는 할머니가 깔고 앉던 꽃무늬 방석.
          @pose haru sit
          haru: 여기서 숙제하면… 할머니가 옆에서 보는 것 같아.
          haru: 받아쓰기 육십 점 맞아도 별 접어 주던 할머니.
          @emote dad ♥
          @wait 1.2
        `,
        after: s`
          ruru: 아무도 안 앉던 의자! 이제 하루가 앉아!
          bori: 비어 있는 의자보다, 누가 앉아 있는 의자가 좋아.
          toby: 할머니 자리가… 하루 자리가 된 거야.
        `,
      },
      {
        kind: 'memory',
        id: 'mEPf',
        at: [26, 15],
        name: '할머니 얘기',
        caption: '새 친구에게 처음 한 할머니 이야기',
        scene: s`
          @room h_newroom
          @show haru haru15 9 6 down sit
          @music box
          > 새 학교에서 사귄 친구와 전화하는 밤.
          haru: 응, 창가에 있는 토끼? 우리 할머니가 준 거야. 네 살 때.
          @wait 0.8
          haru: …응. 돌아가셨어. 2년 전에.
          @wait 1
          haru: 아니야, 괜찮아. 미안해할 거 없어.
          haru: 우리 할머니 얘기 해 줄까? 진짜 웃긴 사람이었어.
          @emote haru ♪
          haru: 내가 받아쓰기 망치면 시험지로 별을 접어 줬다니까? 그리고 사탕 훔쳐 먹으면 같이 먹었어. 공범이라고.
          > 하루는 한참 동안 할머니 이야기를 했다. 웃으면서. 가끔은 조금 울면서.
          @wait 1.5
        `,
        after: s`
          @emote toby tear
          toby: 하루가… 할머니 얘기를 해. 웃으면서.
          nabi: 2년 동안 한 번도 못 했던 거야.
          bori: 할머니 소원이 그거였잖아. "할머니 생각을 하면서 웃어 주렴."
          ruru: 이루어졌네. 소원.
        `,
      },
      {
        kind: 'link',
        id: 'lEP',
        at: [23, 12],
        name: '새 유리병',
        icon: 'jar',
        locked: s`doll: 아직 이 방의 기억이 남아 있단다. 선반 너머, 상자 너머까지 가 보렴.`,
        scene: s`
          @bars on
          > 천 개의 별이 든 유리병 옆에, 작은 새 유리병이 하나 놓여 있다. 별이 열두 개.
          > 뚜껑에 하루 글씨. 「하루가 웃은 날」.
          ruru: 웃은 날마다 하나씩 접는 거야!
          bori: 벌써 열두 개. 이사 오고 몇 주밖에 안 됐는데.
          nabi: 처음 천 개는 할머니가 낫기를 바라며 접었지. 이번엔… 하루 자신을 위해서.
          doll: 할머니가 바라던 게 바로 이거란다.
          @face toby doll
          toby: 태엽 할머니. 저… 이제 알 것 같아요.
          toby: 태엽은 멈추지 않는 게 중요한 게 아니었어요. 누군가 매일 감아 준다는 게 중요한 거였어요.
          doll: 그래. 하루가 매일 너를 감아 주고, 너는 매일 하루 곁에 있고.
          doll: 그게 할머니가 말한 "평생"이란다.
          @wait 1.5
          @sfx star
          > 창밖으로 눈이 그치고, 별이 떴다. 「하루 별」 옆의 작은 별 하나가 반짝였다.
          toby: …할머니, 보고 계세요?
          @wait 2
          @fade 1 2.5
          @bars off
          @credits
          @room h_newroom
          @tone now
          @show haru haru15 9 7 up
          @music box
          @fade 0 2.5
          > 다음 날 아침. 하루의 방.
          > 창가 선반에 장난감들이 나란히 앉아 있다. 천 개의 종이별이 담긴 유리병과, 열두 개가 담긴 작은 유리병 옆에.
          > 책상 위에는 노란 목도리. 반은 할머니의 촘촘한 코, 나머지 반은 삐뚤빼뚤한 하루의 코.
          > 책상 앞에는 할머니 의자. 꽃무늬 방석.
          @wait 1
          @pose haru hold
          haru: 하나.
          @sfx windTick
          @wait 0.5
          haru: 둘.
          @sfx windTick
          @wait 0.5
          haru: 셋.
          @sfx windTick
          @wait 0.6
          haru: 매일 세 번. 너무 많이 감으면 아프고, 안 감으면 멈추니까.
          haru: 오늘도. 태엽이 멈추지 않게.
          @wait 1.5
          toby: …고마워, 하루.
          @emote haru ?
          haru: …방금 토비가 말한 것 같은데.
          @wait 1
          @emote haru ♪
          haru: 설마.
          @wait 1.5
          @fade 1 3
          @title 끝 | 태엽이 멈추기 전에
          @flag ending
        `,
      },
      { kind: 'gap', id: 'gEP', at: [10, 6], tiles: [[11, 6]] },
      { kind: 'block', id: 'bEP', at: [20, 9], look: 'box' },
      {
        kind: 'trigger',
        id: 'tEPgap',
        rect: [8, 4, 3, 5],
        unless: 'gap_gEP',
        scene: s`ruru: 책상 끝이야! 이번엔 밧줄 안 떨어뜨릴게. 아마도!`,
      },
      {
        kind: 'trigger',
        id: 'tEPblock',
        rect: [18, 7, 5, 2],
        unless: 'mem_mEPe',
        scene: s`bori: 이삿짐 상자가 선반 길을 막고 있네. 위에서 아래로 밀자!`,
      },
      { kind: 'star', id: 'sEPa', at: [2, 2], text: '책상 다리 옆에 떨어진 종이별. 「웃은 날」 병에서 굴러 나왔나 보다.' },
      { kind: 'star', id: 'sEPb', at: [27, 2], text: '창틀에 놓인 종이별. 노란색.' },
      { kind: 'star', id: 'sEPc', at: [13, 16], text: '선반 아래 종이별. 받아쓰기 시험지로 접은 것 같다.' },
      {
        kind: 'spot',
        id: 'scarfEP',
        at: [2, 7],
        scene: s`
          > 털실 바구니. 노란 실 뭉치가 반쯤 남았다.
          nabi: 실이 줄어드는 만큼 목도리가 길어지는 거야.
        `,
      },
      {
        kind: 'spot',
        id: 'cardEP',
        at: [14, 2],
        scene: s`
          > 벽에 압정으로 꽂힌 카드 한 장. 「할머니, 나 천 개 다 접었어. 이제 천천히 웃을게.」
          toby: 열네 살 생일에 재봉틀 위에 두고 온 카드에… 답장을 쓴 거야. 하루가 스스로.
        `,
      },
      {
        kind: 'spot',
        id: 'boxEP',
        at: [27, 11],
        scene: s`
          > 접힌 빈 상자. 옆구리에 매직펜 글씨가 남아 있다. 「가져온 짐」.
          bori: 이제 이 상자는 비었어. 우리가 다 나왔으니까.
        `,
      },
    ],
  });
}
