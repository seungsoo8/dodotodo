/**
 * 이야기 어드벤처의 공용 모양: 무대(인물 · 화면 효과), 대본 명령, 방 · 장 정의.
 * 좌표: 대본은 타일 칸 (소수 가능), 무대는 픽셀 (발 위치).
 */
import type { MapDef } from '../maps.ts';
import type { HeroId } from '../types.ts';

export type Facing = 'down' | 'up' | 'left' | 'right' | 'downRight' | 'downLeft' | 'upRight' | 'upLeft';
export type Emote = '!' | '?' | '…' | '♪' | '♥' | 'sweat' | 'anger' | 'zz' | 'idea' | 'tear';
/** 타일 칸 */
export type Pt = readonly [number, number];

export type Cmd =
  /** 대사 (who 가 '' 이면 해설). 누를 때까지 기다린다 */
  | { t: 'say'; who: string; text: string }
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
  | { t: 'music'; track: string | null }
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
  | { t: 'tone'; v: 'memory' | 'now' | 'dawn' }
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
  /** 이번에 울릴 소리 (화면이 꺼낸다) */
  sfx: string[];
  /** 카메라 목표 (null = 조종하는 인물) */
  cam: { x: number; y: number } | string | null;
  dialog: { who: string; text: string; shown: number } | null;
  title: { text: string; sub: string; life: number; max: number } | null;
  shake: number;
  tone: 'memory' | 'now' | 'dawn';
  goal: string | null;
  credits: number;
  choice: { flag: string; options: string[]; sel: number; picked: number | null } | null;
  /** 방 안 물건 상태 (열린 문 · 켜진 텔레비전 · 꺼진 불): '종류@x,y' 또는 'light' → 상태 · 남은 초 */
  props: Record<string, { state: string; life: number }>;
  /** 옮길 수 있는 물건: 종류 · 자리(픽셀, 발 기준) · 든 사람 (null 이면 바닥) */
  items: Record<string, { kind: string; x: number; y: number; on: string | null }>;
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
  /** 기억의 문: 이 방의 기억 조각을 다 모으면 열린다 */
  | { kind: 'link'; id: string; at: Pt; name: string; icon: string; scene: Cmd[]; locked: Cmd[] }
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
  | { kind: 'seq'; id: string; keys: { at: Pt; look: string; label?: string }[]; order: number[]; flag: string; wrong?: Cmd[] }
  /** 쫓아가기: actor 가 path 를 따라 도망, near 칸(기본 1.2) 안에 들면 다음 점으로, laps 번 따라잡으면 flag + scene */
  | { kind: 'chase'; id: string; actor: string; path: Pt[]; laps: number; flag: string; near?: number; scene?: Cmd[] }
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
  /** 동료가 이 방에서 지내는 자리 (없으면 엔진이 고른다): 칸 · 자세 · 보는 쪽 · 처음 말을 걸면 하는 대사 */
  hangouts?: Partial<Record<'bori' | 'ruru' | 'nabi', Hangout>>;
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
}
