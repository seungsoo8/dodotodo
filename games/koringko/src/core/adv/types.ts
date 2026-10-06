/**
 * 이야기 어드벤처의 공용 모양: 무대(인물 · 화면 효과), 대본 명령, 방 · 장 정의.
 * 좌표: 대본은 타일 칸 (소수 가능), 무대는 픽셀 (발 위치).
 */
import type { MapDef } from '../maps.ts';
import type { HeroId } from '../types.ts';

export type Facing = 'down' | 'up' | 'left' | 'right' | 'downRight' | 'downLeft' | 'upRight' | 'upLeft';
/** 대사 표정 (대본 \`toby(sad): …\`) */
export type Mood = 'smile' | 'sad' | 'surprise' | 'angry' | 'tear';
export const MOODS: readonly Mood[] = ['smile', 'sad', 'surprise', 'angry', 'tear'];
export type Emote = '!' | '?' | '…' | '♪' | '♥' | 'sweat' | 'anger' | 'zz' | 'idea' | 'tear';
/** 타일 칸 */
export type Pt = readonly [number, number];
/** 네 방향 (시야 · 빛줄기 · 바람) */
export type Dir4 = 'up' | 'down' | 'left' | 'right';
/** 칸 영역 [x, y, 폭, 높이] */
export type Rect = readonly [number, number, number, number];

/**
 * 지켜보는 이(watcher)의 한 박자: s 초 동안 dir 쪽을 r 칸 · 반각 arc 도로 본다.
 * dir 이 없거나 null 이면 눈 감음(안 봄). at 이 있으면 그 칸으로 걸어간다 (순찰). pose · emote 는 그림.
 */
export interface WatchStep {
  s: number;
  dir?: Dir4 | null;
  /** 시야 반지름 (칸, 기본 4) */
  r?: number;
  /** 시야 반각 (도, 기본 40 · 180 이상이면 둘레 원) */
  arc?: number;
  at?: Pt;
  pose?: string;
  emote?: Emote;
}

export type Cmd =
  /** 대사 (who 가 '' 이면 해설). 누를 때까지 기다린다 */
  | { t: 'say'; who: string; text: string; /** 표정 (초상화 · 사람 얼굴): smile · sad · surprise · angry · tear */ mood?: Mood }
  /** 머리 위 감정 말풍선. 기본은 잠깐 멈춘다 */
  | { t: 'emote'; who: string; e: Emote; s?: number; wait?: boolean }
  /** 곧게 걸어간다 (speed: 초당 픽셀). 기본은 도착할 때까지 기다린다 */
  | { t: 'walk'; who: string; to: Pt; speed?: number; wait?: boolean }
  /** 방향, 또는 다른 인물 쪽으로 돌아본다 */
  | { t: 'face'; who: string; dir: Facing | string }
  | { t: 'pose'; who: string; pose: string }
  /** 한 번 하는 몸짓 (끄덕 · 도리도리 · 웃음 · 박수 · 폴짝 …): s 초 뒤 원래 자세로. 기본은 끝날 때까지 기다린다 */
  | { t: 'act'; who: string; name: string; s?: number; wait?: boolean }
  | { t: 'wait'; s: number }
  /** 화면 가리기 (0 = 보임 · 1 = 가림) */
  | { t: 'fade'; to: number; s?: number; color?: 'black' | 'white' }
  /** 위아래 검은 띠 */
  | { t: 'bars'; on: boolean }
  | { t: 'music'; track: string | null; fade?: number }
  | { t: 'sfx'; name: string }
  /** 카메라: 칸 · 인물 · null (조종하는 인물로 돌아옴) */
  | { t: 'cam'; to: Pt | string | null; s?: number }
  | { t: 'show'; who: string; kind: string; at: Pt; dir?: Facing; pose?: string }
  | { t: 'hide'; who: string }
  | { t: 'flag'; name: string; v?: boolean }
  /** 장 제목 카드 */
  | { t: 'title'; text: string; sub?: string; s?: number }
  /** 방 옮기기 (조종하는 인물을 at 에 세운다) */
  | { t: 'room'; id: string; at?: Pt; dir?: Facing }
  | { t: 'shake'; s: number }
  /** 물건 상태 바꾸기: 문 열기 · 텔레비전 켜기 · 방 불(light) 끄기 … (s 초 뒤 처음대로, 없으면 그대로) */
  | { t: 'prop'; what: string; state: string; s?: number }
  /** 물건: 바닥에 놓기 (칸이 없으면 종류만 바꾼다) · 숙여 들기 · 숙여 내려놓기 (칸이 없으면 바라보는 앞 칸) · 건네기 · 바로 손에 쥐기 (kind none 이면 치운다) */
  | { t: 'item'; id: string; kind: string; at?: Pt }
  | { t: 'take'; who: string; id: string }
  | { t: 'put'; who: string; id: string; at?: Pt }
  | { t: 'give'; from: string; to: string; id: string }
  | { t: 'carry'; who: string; kind: string; id: string }
  /** 밀 물건을 처음 자리로 (막다른 곳에 밀어 넣었을 때 다시 풀게) */
  | { t: 'reset'; ids: string[] }
  /** (안에서 씀) 기억 속을 걷기 시작 (mem) · 끝 (null) */
  | { t: 'wander'; mem: string | null }
  /** 동료가 줄에 끼거나 빠진다 */
  | { t: 'join'; who: HeroId }
  | { t: 'leave'; who: HeroId }
  /** 동료를 불러 함께 다니거나 (on) 자기 자리로 돌려보낸다 (all 이면 모두) */
  | { t: 'call'; who: HeroId | 'all'; on: boolean }
  /** 조종할 인물 (기억 속 어린 하루 · 토비) */
  | { t: 'control'; who: string }
  /** 지금 할 일 (화면 위 한 줄). null 이면 지운다 */
  | { t: 'goal'; text: string | null }
  /** 작은 놀이. 끝날 때까지 기다린다 */
  | { t: 'mini'; id: string }
  | { t: 'if'; flag: string; then: Cmd[]; else?: Cmd[] }
  /** 다음 장으로 */
  | { t: 'chapter'; n: number }
  /** 목록에서 다음 장으로 */
  | { t: 'next' }
  /** 지금 장의 제목 카드 */
  | { t: 'chtitle' }
  /** 토비 태엽 남은 양 (0~1) */
  | { t: 'wind'; v: number }
  /** 기억 장면 색 (세피아) 켜고 끄기 */
  | { t: 'tone'; v: 'memory' | 'now' | 'dawn'; /** 기억 id (기억 장면 머리에서 엔진이 붙인다: 음악 감독이 쓴다) */ mem?: string }
  /** 추억 앨범에 한 장 */
  | { t: 'album'; id: string }
  /** 엔딩 크레디트 */
  | { t: 'credits' }
  /** 고르기: 고른 번호 i 에 대해 깃발 `${flag}_${i}` 를 세운다 */
  | { t: 'choice'; flag: string; options: string[] };

export interface Actor {
  id: string;
  /** 그림 종류 (toby · haru7 · grandma …) */
  kind: string;
  x: number;
  y: number;
  dir: Facing;
  pose: string;
  walkT: number;
  moving: boolean;
  goal: { x: number; y: number; speed: number } | null;
  emote: { e: Emote; life: number } | null;
  /** 의자에 앉아 있다 (그림은 의자 위로) */
  seat?: boolean;
  /** 손에 든 물건 (stage.items 의 id) */
  carry?: string;
  /** 한 번 하는 몸짓: 남은 초 · 끝나면 돌아갈 자세 */
  act?: { life: number; back: string };
  /** 지난번 발소리를 셀 때의 walkT (발소리 박자 세기용) */
  stepT?: number;
  /** 서 있는 높이 (RoomDef.elev 의 칸 값, 그림은 그만큼 위로) */
  elev?: number;
  /** 대본이 일부러 돌려세웠다 (@face · @show 방향): 말하는 이를 자동으로 바라보지 않는다. 걸으면 풀린다 */
  faced?: boolean;
}

export interface Stage {
  actors: Record<string, Actor>;
  fade: number;
  fadeTo: number;
  fadeRate: number;
  fadeColor: 'black' | 'white';
  bars: number;
  barsOn: boolean;
  music: string | null;
  /** 음악을 바꿀 때 페이드 초 (@music <곡> fade=2 · 없으면 기본) */
  musicFade?: number;
  /** 이번에 울릴 소리 (화면이 꺼낸다) */
  sfx: string[];
  /** 카메라 목표 (null = 조종하는 인물) */
  cam: { x: number; y: number } | string | null;
  /** 대사: 보인 글자 수 · 문장 부호 뒤 남은 멈춤(초) · 표정 */
  dialog: { who: string; text: string; shown: number; hold?: number; mood?: Mood } | null;
  title: { text: string; sub: string; life: number; max: number } | null;
  shake: number;
  tone: 'memory' | 'now' | 'dawn';
  /** 지금 보는 기억 id (기억 빛일 때만, 모르면 null) */
  mem?: string | null;
  goal: string | null;
  credits: number;
  choice: { flag: string; options: string[]; sel: number; picked: number | null } | null;
  /** 방 안 물건 상태 (열린 문 · 켜진 텔레비전 · 꺼진 불): '종류@x,y' 또는 'light' → 상태 · 남은 초 */
  props: Record<string, { state: string; life: number }>;
  /** 옮길 수 있는 물건: 종류 · 자리(픽셀, 발 기준) · 든 사람 (null 이면 바닥) */
  items: Record<string, { kind: string; x: number; y: number; on: string | null }>;
  /** 글자 속도 배율 (설정, 기본 1) */
  textSpeed: number;
  /** 화면 흔들림 끄기 (설정) */
  noShake?: boolean;
  /** 대사가 다 나오고 이만큼(초) 지나면 저절로 넘긴다 (0 · 없음 = 끔) */
  autoAdvance?: number;
  /** 대화창 대신 잠깐 뜨는 알림 (종이별 줍기): 글자 · 아랫줄 · 남은 초 · 처음 길이 · 주운 자리(픽셀) */
  toast?: { text: string; sub: string; life: number; max: number; x: number; y: number } | null;
  /** 밀거나 굴린 물건이 칸 사이를 미끄러지는 중: from → to (칸), t 초 지남 (음수면 아직 출발 전), dur 초 동안 */
  slides?: Record<string, { from: readonly [number, number]; to: readonly [number, number]; t: number; dur: number }>;
}

/** 걷는 기억: 들어설 자리 · 들어서서 나누는 말 · 실들 · 실이 아닌 살펴볼 것들 */
export interface Explore {
  enter: Pt;
  intro?: Cmd[];
  threads: { at: Pt; text: Cmd[] }[];
  looks?: { at: Pt; text: Cmd[] }[];
}

/** 기억 뒤로 미룬 감상: 누가(동료) · 무슨 말 (말을 걸면 한 번 듣는다) */
export interface Aside {
  who: 'bori' | 'ruru' | 'nabi';
  text: Cmd[];
}

/** 방에 놓인 것 */
export type Thing =
  /** 기억 조각: 살펴보면 기억 장면 */
  | { kind: 'memory'; id: string; at: Pt; name: string; scene: Cmd[]; when?: string; dark?: boolean; /** 돌아와서 동료들이 나누는 말 */ after?: Cmd[]; /** 앨범 한 줄 */ caption?: string; /** 기억 속을 걷기: 멈춘 순간 안에서 실을 모두 모으면 장면이 흐른다 */ explore?: Explore; /** 뒤로 미룬 감상: 기억을 본 뒤 그 동료에게 말을 걸면 듣는다 */ aside?: Aside }
  /** 숨은 종이별 (모으기) */
  | { kind: 'star'; id: string; at: Pt; text: string; when?: string; dark?: boolean }
  /** 살펴보기 (생각 · 동료 잡담) */
  | { kind: 'spot'; id: string; at: Pt; scene: Cmd[]; when?: string; unless?: string; r?: number }
  /** 말 걸 수 있는 인물 (actor 로 세운다) */
  | { kind: 'npc'; id: string; at: Pt; actor: string; dir?: Facing; pose?: string; scene: Cmd[]; when?: string; unless?: string; pal?: HeroId }
  /** 보리가 미는 덩어리 */
  | { kind: 'block'; id: string; at: Pt; look: 'cookie' | 'block' | 'book' | 'box' | 'spool' | 'pot' | 'shoe' | 'soap' }
  /** 루루가 밧줄을 거는 틈 (tiles 가 다리가 된다) */
  | { kind: 'gap'; id: string; at: Pt; tiles: Pt[] }
  /** 나비 불빛이 있어야 보이는 어둠 */
  | { kind: 'dark'; id: string; at: Pt; r: number }
  /** 기억의 문: 이 방의 기억 조각을 다 모으면 열린다 (when 은 타입에만 — 지금은 쓰지 않음) */
  | { kind: 'link'; id: string; at: Pt; name: string; icon: string; scene: Cmd[]; locked: Cmd[]; when?: string }
  /**
   * 막 안의 다른 방으로 가는 문 (깃발 door_<id>). rect 가 있으면 걸어 들어서는 순간 지나가고, 없으면 at 에서 살펴보면 지나간다.
   * when 이 서기 전(또는 unless 가 서면)에는 locked 를 말한다. 처음 지날 때만 first(떠나기 전 장면), 도착한 방이 그 막에서 처음이면 그 방의 enter.
   * to 방의 arrive 칸에 dir 쪽을 보고 선다
   */
  | { kind: 'door'; id: string; at: Pt; rect?: Rect; to: string; arrive: Pt; dir?: Facing; name?: string; when?: string; unless?: string; locked?: Cmd[]; first?: Cmd[] }
  /** 기억의 실 (걷는 기억 안에서만): 살펴보면 짧은 생각, 모두 모으면 기억이 흐른다 */
  | { kind: 'thread'; id: string; at: Pt; text: Cmd[] }
  /** 기억이 깃든 물건: memory 와 똑같이 동작 (그림만 look 물건 · 살펴본 뒤 look2) */
  | { kind: 'keepsake'; id: string; at: Pt; look: string; name: string; scene: Cmd[]; after?: Cmd[]; caption?: string; explore?: Explore; when?: string; dark?: boolean; look2?: string; aside?: Aside }
  /** 보리가 한 칸 미는 물건 (roll 이면 막힐 때까지 구름), weight 2 는 보리 말고 동료가 하나 더 있어야 */
  | { kind: 'push'; id: string; at: Pt; look: string; weight?: 1 | 2; roll?: boolean }
  /** 자리 맞추기: accepts 의 push 물건이 이 칸에 놓이면 flag */
  | { kind: 'pad'; id: string; at: Pt; accepts: string[]; flag: string }
  /** 토비가 태엽을 cost 만큼 나눠 주면 scene (깃발 windup_<id>) */
  | { kind: 'windup'; id: string; at: Pt; cost: number; scene: Cmd[]; when?: string; look?: string }
  /** at(낮은 층) ↔ to(높은 층) 오르내리기: 살펴보면 이동 */
  | { kind: 'climb'; id: string; at: Pt; to: Pt; who?: 'ruru' | 'any'; when?: string }
  /** 발판 순서 퍼즐: keys[order[0]] → keys[order[1]] … 차례로 밟으면 flag, 틀리면 처음부터 + wrong */
  | { kind: 'seq'; id: string; keys: { at: Pt; look: string; label?: string; /** 음 발판: 밟으면 그 음 (도 레 미 파 솔 라 시 높은도) */ note?: string }[]; order: number[]; flag: string; wrong?: Cmd[] }
  /** 쫓아가기: actor 가 path 를 따라 도망, near 칸(기본 1.2) 안에 들면 다음 점으로, laps 번 따라잡으면 flag + scene */
  | { kind: 'chase'; id: string; actor: string; path: Pt[]; laps: number; flag: string; near?: number; scene?: Cmd[] }
  /**
   * 숨바꼭질: actor 가 pattern 박자대로 시야를 바꾼다. 시야 칸에 숨지 않은 채 grace 초(기본 0.8) 머물면 들킴 → caught → 마지막 숨은 곳으로.
   * hide 칸 · 가구 밑 'U' 칸에서는 안 보인다. 벽 · 가구 · 밀 물건 · 'U' 는 시야를 가린다.
   * moveOnly 면 움직일 때만 들킴 (스탠드 · 잠결), motion 이면 시야 안에서 그 칸 수보다 많이 움직이면 들킴 (센서등).
   * 들킨 수는 watchState().caught, 세 번째부터 hint 를 덧붙인다. 장난감이 걷는 방에서 토비를 조종할 때만 돈다.
   */
  | { kind: 'watcher'; id: string; at: Pt; actor: string; dir?: Facing; pattern: WatchStep[]; hide?: Pt[]; caught: Cmd[]; hint?: Cmd[]; grace?: number; moveOnly?: boolean; motion?: number; when?: string; until?: string }
  /** 협동 당기기 (서랍 · 지퍼 · 천): need 동료가 모두 불려 와 있어야. tugs 번(기본 1) 당기면 flag + scene. 살펴본 뒤 look2 */
  | { kind: 'pull'; id: string; at: Pt; look?: string; look2?: string; need: HeroId[]; flag: string; tugs?: number; scene?: Cmd[]; when?: string }
  /** 맞출 조각: 살펴보면 줍는다 (깃발 got_<id>). heavy 는 보리가 있어야 들고, 들고 있는 동안 다른 것을 못 줍고 느려진다 */
  | { kind: 'part'; id: string; at: Pt; look: string; set: string; heavy?: boolean; when?: string; dark?: boolean }
  /** 조각 맞추는 자리: 들고 온 set 조각을 내려놓는다 (깃발 put_<조각 id>). need 개(기본 그 set 조각 수) 모이면 flag + scene */
  | { kind: 'assemble'; id: string; at: Pt; set: string; need?: number; flag: string; scene?: Cmd[]; look?: string; when?: string }
  /** 켜는 등 (스탠드 · 가로등 · 손전등): 살펴보면 켜진다 (깃발 lamp_<id>). 켜진 동안 반지름 r 칸 안의 어둠 속 물건이 보이고 나비 등불이 찬다. who 가 있으면 그 동료가 불려 와 있어야 */
  | { kind: 'lamp'; id: string; at: Pt; r: number; look?: string; who?: HeroId; when?: string }
  /** 등불 채우는 곳 (야광 스티커 · 창가): 나비가 r 칸(기본 1) 안에 있으면 초당 rate 칸(기본 2)씩 등불 반지름이 찬다 */
  | { kind: 'charge'; id: string; at: Pt; r?: number; rate?: number; when?: string }
  /** 빛줄기: at 에서 dir 로 곧게 나가 거울에서 꺾인다. target 칸에 닿으면 flag + scene. who 'nabi' 면 나비가 불려 와 있을 때만 빛난다 */
  | { kind: 'beam'; id: string; at: Pt; dir: Dir4; target: Pt; flag: string; who?: HeroId; scene?: Cmd[]; when?: string }
  /** 손거울: 살펴볼 때마다 face 0→1→2→3 (0 위↔오른쪽 · 1 오른쪽↔아래 · 2 아래↔왼쪽 · 3 왼쪽↔위). who 가 있으면 그 동료가 돌린다 */
  | { kind: 'mirror'; id: string; at: Pt; face?: number; look?: string; who?: HeroId; when?: string }
  /**
   * 톱니: at 의 톱니(동력)가 돌면 네 방향으로 맞닿은 톱니(gears: 밀 물건 id)를 따라 target 톱니까지 전해지면 flag + scene.
   * pegs 가 있으면 그 칸(축)에 놓인 톱니만 맞물린다. jam(녹슨 톱니) 칸이 이어지면 모두 멈춘다. when 깃발이 서야 동력이 돈다.
   */
  | { kind: 'gears'; id: string; at: Pt; target: Pt; gears: string[]; pegs?: Pt[]; jam?: Pt[]; flag: string; scene?: Cmd[]; when?: string }
  /**
   * 물길: at(수원)에서 channel 칸들을 따라 물이 흐른다. 밀 물건이 놓인 칸은 물을 막는다. pools 칸에 물이 닿으면 웅덩이가 차서 지나갈 수 없다
   * (그 웅덩이 flag 가 서 있음, 마르면 내려감). fill 의 웅덩이가 모두 차고 dry 의 웅덩이가 모두 마르면 flag + scene (한 번).
   */
  | { kind: 'flow'; id: string; at: Pt; channel: Rect[]; pools: { at: Pt; flag?: string }[]; fill?: number[]; dry?: number[]; flag?: string; scene?: Cmd[]; when?: string }
  /** 밟으면 한 번 (또는 깃발 조건) */
  | { kind: 'trigger'; id: string; rect: readonly [number, number, number, number]; scene: Cmd[]; when?: string; unless?: string; repeat?: boolean };

export type ThingKind = Thing['kind'];

export interface FreezeDef {
  /** 조용한 시간 [최소, 최대] 초 */
  calm: readonly [number, number];
  warn: number;
  hold: number;
  /** 이 깃발이 있을 때만 */
  when?: string;
  /** 이 깃발이 서면 끝 */
  until?: string;
  /** 들켰을 때 하는 말 (돌아가며) */
  caught: Cmd[][];
}

export interface RoomDef extends MapDef {
  /** 장난감 크기 방 · 사람 크기 기억 방 */
  scale: 'toy' | 'human';
  things: Thing[];
  /** 발소리 (얼음 땡) */
  steps?: FreezeDef;
  /** 사람 크기 방의 가구 (그림만) */
  furniture?: Furniture[];
  /** 방 꾸밈 (나이마다 다른 하루의 방) */
  look?: string;
  /** 들어오면 트는 음악 */
  music?: string;
  /** 창문 빛살 (칸 단위: 위 가장자리 x, 폭, 길이, 기울기) */
  beams?: { x: number; w: number; h: number; slant: number }[];
  /** 붙박인 빛 (칸 · 반지름 px · 색) */
  lights?: { at: Pt; r: number; color: readonly [number, number, number]; k: number }[];
  /** 비가 온다 (빗줄기 · 빗소리) */
  rain?: boolean;
  /** 날씨 (파티클 · 소리): 없으면 rain → 'rain', 창밖은 window:rain · window:snow 가구로 */
  weather?: 'rain' | 'snow' | 'drizzle';
  /** 바깥 소리 층 (없으면 ui/audio/ambience.ts 가 방의 꾸밈 · 가구로 고른다) */
  amb?: { name: string; gain: number; every?: readonly [number, number] }[];
  /** 밤의 어둠 (곱하기 색). 없으면 테마 기본 */
  ambient?: readonly [number, number, number];
  /** 여러 방 지도: 칸 영역마다 다른 꾸밈 (없으면 look) */
  looks?: { rect: readonly [number, number, number, number]; look: string }[];
  /** 칸마다 높이 ('0' 바닥 · '1' 단 · 가구 윗면). 없으면 모두 0 */
  elev?: string[];
  /** 근접(장난감 크기) 지도: 지도 밖 · 낭떠러지 아래로 보이는 흐린 사람 크기 바닥 그림 이름 */
  abyss?: string;
  /** 방에 들어올 때 깃발이 서 있으면 되살리는 물건 상태 (켠 스탠드 · 연 뚜껑문) */
  keepProps?: { key: string; flag: string; state: string }[];
  /** 사람 크기 방이지만 장난감들이 걸어 다니는 장 방 (토비 · 동료를 세우고 저장할 수 있음) */
  toys?: boolean;
  /** 기억 → 물건 자리표: 이 방에 들어오는 기억(다른 파일에서 더해진 것 포함)을 그 물건으로 바꿔 놓는다 */
  keepsakes?: Record<string, KeepsakePlace>;
  /** 나비 등불 밝기 자원: 반지름(칸)이 max 에서 초당 drain 씩 줄어 min 까지. zones 가 있으면 그 안(어두운 곳)에서만 준다. dark 물건은 반지름 안에서만 보인다 */
  lantern?: { max: number; min: number; drain: number; zones?: Rect[] };
  /** 젖은 타일: 들어서면 막히거나 마른 칸에 닿을 때까지 미끄러진다. grip 칸(때수건 · 매트)은 마른 칸 */
  slip?: Rect[];
  grip?: Pt[];
  /**
   * 바람: period 초마다 gust 초 동안 rect 안에서 dir 쪽으로 분다 (phase 초만큼 늦게 시작). 부는 동안 force 칸/초(기본 6)로 밀려난다.
   * shelter 칸(빨래 그늘)에서는 안 밀린다. blows 의 밀 물건은 바람이 일 때마다 한 칸 굴러간다. 불기 0.8초 전은 예고 (windState().warn)
   */
  winds?: WindDef[];
  /** 낮은 천장: 보리가 함께 있거나 사람이 조종하면 못 지나간다 (when · unless 깃발로 내려앉음) */
  low?: { rect: Rect; when?: string; unless?: string }[];
  /** 동료가 이 방에서 지내는 자리 (없으면 엔진이 고른다): 칸 · 자세 · 보는 쪽 · 처음 말을 걸면 하는 대사 */
  hangouts?: Partial<Record<'bori' | 'ruru' | 'nabi', Hangout>>;
}

export interface WindDef {
  id: string;
  rect: Rect;
  dir: Dir4;
  period: number;
  gust: number;
  phase?: number;
  force?: number;
  shelter?: Pt[];
  blows?: string[];
  when?: string;
  until?: string;
}

export interface Hangout {
  at: Pt;
  pose?: string;
  dir?: Facing;
  talk?: Cmd[];
}

export interface KeepsakePlace {
  at: Pt;
  look: string;
  look2?: string;
  when?: string;
  dark?: boolean;
}

export interface Furniture {
  kind: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** 인물 위에 늘 그리는 윗층 (들보 · 문 인방 · 처마 · 전등갓 · 커튼 봉 · 빨랫줄) */
  over?: boolean;
  /** 가구 밑을 장난감이 지나갈 수 있음 (그 칸은 지도에서 'U') */
  under?: boolean;
  /** 앞쪽 가림막 (화면 맨 앞 실루엣) */
  fg?: boolean;
}

/** 막의 기억 사슬 한 단계: 이 Thing 을 마치면 bridge 지문과 함께 다음 단계로 카메라가 간다 */
export interface ChainStep {
  id: string;
  /** 이 단계를 마친 뒤 다음 단계로 카메라가 가며 나오는 해설 한 줄 */
  bridge?: string;
  /** 이 단계 Thing 의 when (없으면 앞 단계의 끝 깃발) */
  gate?: string;
}

/** 막 안의 방 */
export interface ActRoom {
  id: string;
  /** 방 이름 (앨범 쪽 제목 · 일시 정지 메뉴) */
  name: string;
  /** 이삿날 밤 시각 (옛 장 시각 그대로) */
  clock?: string;
  /** 이 방에 들어올 때마다 세우는 깃발 (지운 놀이가 놓아 두던 길 · 계단) */
  preset?: string[];
  /** 이 방에 처음 들어설 때 (옛 장 도입) */
  enter?: Cmd[];
  /** 문 없이 들어설 때(옛 기억의 문 @next) · 옛 저장을 옮길 때 서는 칸 (없으면 그 방의 지도 시작 칸) */
  start?: Pt;
}

export interface Chapter {
  n: number;
  title: string;
  sub: string;
  room: string;
  start: Pt;
  party: HeroId[];
  wind: number;
  /** 들어오면 */
  intro: Cmd[];
  /** 이삿날 밤의 시각 'HH:MM' (1막 23:10 → 04:40, 새벽 05:00). 없으면 밤 시계 밖 (프롤로그 · 에필로그) */
  clock?: string;
  /** 막의 방들 (차례대로, 첫 방 = room). 문(door)으로 잇는다 */
  rooms?: ActRoom[];
  /** 동료가 늘 따라다님 (막 · 에필로그): 자기 자리로 흩어지지 않고, 말을 걸어도 고르기가 없다 */
  follow?: boolean;
  /** 막 전체 기억 사슬 (방 차례대로 이어 붙인 것) */
  chain?: ChainStep[];
}
