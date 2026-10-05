/**
 * 어드벤처 세계 그리기 (논리 해상도): 방 바닥 → (가구 · 소품 · 인물 · 물건 y 순서) → 빛 → 빛 먼지 → 가장자리.
 * 장난감 방은 기존 밤 방 그림(mapLayer)을, 사람 크기 기억 방은 house.ts 를 쓴다.
 */
import { FACE_VEC, toyWalk, type Adv } from '../../core/adv/adv.ts';
import { DUST_S, listenDir, px, slideAt } from '../../core/adv/stage.ts';
import { breathFrame, deadZone, gaitFrame, idleFidget, leanToward, lookAhead, markerPop, personBreath, phaseOf, talkBob } from './anim.ts';
import type { Actor, Facing, Furniture, Mood, RoomDef, Stage, Thing } from '../../core/adv/types.ts';
import { isSolidChar, TILE, type MapDef } from '../../core/maps.ts';
import type { HeroId } from '../../core/types.ts';
import { bossSprite } from '../art/bosses.ts';
import { pixCanvas } from '../art/canvas.ts';
import { HERO_ACT_RATE, HERO_ACTS, HERO_FOOT, HERO_W, heroActSprite, heroSprite, WALK_FRAMES, WALK_RATE, type Dir, type Pose } from '../art/heroes.ts';
import { lookOf } from '../art/house.ts';
import { abyssSprite } from '../art/abyss.ts';
import { residentSprite, type RDir } from '../art/houseProps.ts';
import { blockSprite, keepsakeSprite, paperStarSprite, shardSprite } from '../art/keepsakes.ts';
import { hash2, Pix } from '../art/paint.ts';
import { itemSprite } from '../art/items.ts';
import { isPerson, PERSON_FOOT_PAD, PERSON_POSES, PERSON_W, personFrame, personHand, personSprite, type PDir, type PPose, type PStep } from '../art/people.ts';
import { animFrame, buildMapLayer, type PropDraw } from '../render/mapLayer.ts';
import { AMBIENT, moonBeams, poolPanes, staticLights, type Beam, type Cone, type Light, type Pool, type RGB } from '../render/light.ts';
import { buildHousePlan, placeFurniture, type FurnitureLayers, type PlanSprite } from '../render/housePlan.ts';
import { orderDraws, planEntries, type DrawEntry } from '../render/order.ts';
import { drawFg } from '../render/fg.ts';
import { bridgeLook, lookPix, pushPix, raisedLookOf, stateGlow, stateSprite } from '../render/looks.ts';

export interface Bubble {
  x: number;
  y: number;
  e: string;
  life: number;
}

export interface Marker {
  x: number;
  y: number;
  text: string;
  /** 처음 뜰 때 튀는 크기 (0.6 → 1.1 → 1) */
  pop: number;
}

export interface AdvFrame {
  cam: { x: number; y: number };
  bubbles: Bubble[];
  marker: Marker | null;
  /** 말하는 인물 머리 위 (대화창 꼬리) */
  heads: Record<string, { x: number; y: number }>;
}

// ───────────────────────── 그림 저장소 ─────────────────────────

const IMG = new Map<string, HTMLCanvasElement>();
function img(key: string, make: () => Pix): HTMLCanvasElement {
  let c = IMG.get(key);
  if (!c) {
    c = pixCanvas(make());
    IMG.set(key, c);
  }
  return c;
}

/** 그리기 층 하나의 그림 (발 높이 foot, 가구면 f) */
interface LSprite {
  img: HTMLCanvasElement;
  x: number;
  y: number;
  foot: number;
  kind: string;
  f?: Furniture;
  anim?: PropDraw['anim'];
}

interface Layer {
  /** 바닥 · 벽 · 그림자 (한 번 구움) */
  back: HTMLCanvasElement;
  props: LSprite[];
  tops: LSprite[];
  over: LSprite[];
  fg: LSprite[];
  lights: Light[];
  beams: Beam[];
  pools: Pool[];
  cones: Cone[];
  ambient: RGB;
}

let layerFor: RoomDef | null = null;
let layer: Layer | null = null;

function roomLayer(r: RoomDef): Layer {
  if (layer && layerFor === r) return layer;
  layerFor = r;
  layer = r.scale === 'toy' ? toyLayer(r) : houseLayer(r);
  return layer;
}

function extraLights(r: RoomDef): { lights: Light[]; beams: Beam[] } {
  const lights: Light[] = (r.lights ?? []).map((l) => ({ x: px(l.at[0]), y: px(l.at[1]), r: l.r, color: l.color, k: l.k, glow: 0.25 }));
  const beams: Beam[] = (r.beams ?? []).map((b) => ({ x: b.x * TILE, y: 0, w: b.w * TILE, h: b.h * TILE, slant: b.slant * TILE, color: [150, 180, 255] as RGB, k: 0.42 }));
  return { lights, beams };
}

const toLS = (s: PlanSprite): LSprite => ({ img: pixCanvas(s.pix), x: s.x, y: s.y, foot: s.foot, kind: s.kind, f: s.f });

function toyLayer(r: RoomDef): Layer {
  const m = r as unknown as MapDef;
  // 근접 지도의 가구도 사람 크기 방과 같은 규칙 (발 정렬 · top · over · fg · 그림자)
  let furn: FurnitureLayers = { props: [], tops: [], over: [], fg: [] };
  const L = buildMapLayer(m, {
    abyss: !!r.abyss,
    raised: raisedLookOf(r),
    bake: (p) => {
      if (!r.furniture?.length) return;
      const floorAt = (x: number, y: number) => {
        const c = r.tiles[Math.floor(y / TILE)]?.[Math.floor(x / TILE)];
        return c !== undefined && c !== 'v' && !isSolidChar(c);
      };
      furn = placeFurniture(r.furniture, p, floorAt, () => lookOf(r.look));
    },
  });
  const ex = extraLights(r);
  const props: LSprite[] = [...L.props.map((d) => ({ ...d, kind: 'prop' })), ...furn.props.map(toLS)];
  return { back: L.ground, props, tops: furn.tops.map(toLS), over: furn.over.map(toLS), fg: furn.fg.map(toLS), lights: [...staticLights(m), ...ex.lights], beams: [...moonBeams(m), ...ex.beams], pools: [], cones: [], ambient: r.ambient ?? AMBIENT[r.theme] };
}

function houseLayer(r: RoomDef): Layer {
  const P = buildHousePlan(r);
  return { back: pixCanvas(P.back), props: P.props.map(toLS), tops: P.tops.map(toLS), over: P.over.map(toLS), fg: P.fg.map(toLS), lights: P.lights, beams: P.beams, pools: P.pools, cones: P.cones, ambient: P.ambient };
}

/** 근접 지도 아래 아득한 바닥 (패럴랙스 0.6, 화면 좌표) */
function drawAbyss(ctx: CanvasRenderingContext2D, name: string, cam: { x: number; y: number }, vw: number, vh: number): void {
  const im = img(`abyss:${name}`, () => abyssSprite(name));
  const S = im.width;
  const ox = -(((cam.x * 0.6) % S) + S) % S;
  const oy = -(((cam.y * 0.6) % S) + S) % S;
  for (let y = oy; y < vh; y += S) for (let x = ox; x < vw; x += S) ctx.drawImage(im, Math.round(x), Math.round(y));
  // 멀리 있으니 흐리고 어둡게
  ctx.fillStyle = 'rgba(14,10,24,0.3)';
  ctx.fillRect(0, 0, vw, vh);
}

// ───────────────────────── 카메라 ─────────────────────────

let camPos: { x: number; y: number } | null = null;
let camRoom: RoomDef | null = null;
/** 조종하는 인물을 따라갈 때: 데드존 가운데 · 앞서 보기 */
let camFocus: { x: number; y: number } | null = null;
let camLook = { x: 0, y: 0 };

function camera(a: Adv, vw: number, vh: number, dt: number): { x: number; y: number } {
  const st = a.stage;
  const r = a.room;
  let tx: number;
  let ty: number;
  const target = st.cam;
  if (camRoom !== r) {
    camFocus = null;
    camLook = { x: 0, y: 0 };
  }
  if (target && typeof target === 'object') {
    tx = target.x;
    ty = target.y;
    camFocus = null;
  } else {
    const named = typeof target === 'string' ? st.actors[target] : null;
    const who = named ?? st.actors[a.player] ?? Object.values(st.actors)[0];
    tx = who ? who.x : (r.w * TILE) / 2;
    ty = who ? who.y - 10 : (r.h * TILE) / 2;
    if (who && !named) {
      // 조종하는 인물: 가운데 32×20 데드존 안에서는 카메라가 가만히, 걷는 쪽으로 24px 앞서 본다
      camFocus = camFocus ? deadZone(camFocus, { x: tx, y: ty }) : { x: tx, y: ty };
      camLook = lookAhead(camLook, who.moving && !a.runner ? { x: FACE_VEC[who.dir][0], y: FACE_VEC[who.dir][1] } : null, dt);
      tx = camFocus.x + camLook.x;
      ty = camFocus.y + camLook.y;
    } else camFocus = null;
  }
  // 대화 중에는 말하는 이 쪽으로 조금 기운다
  const sp = st.dialog?.who ? st.actors[st.dialog.who] : null;
  if (sp) {
    const l = leanToward({ x: tx, y: ty }, { x: sp.x, y: sp.y - 10 });
    tx += l.x;
    ty += l.y;
  }
  const W = r.w * TILE;
  const H = r.h * TILE;
  const clamp = (v: number, size: number, view: number, extra = 0) => (size + extra <= view ? (size - view) / 2 + extra / 2 : Math.max(0, Math.min(size - view + extra, v)));
  // 대화창 · 검은 띠가 있으면 인물이 창에 가리지 않게 아래로 여유를 두고 조금 위를 비춘다
  const talk = st.dialog || st.barsOn ? Math.round(vh * 0.24) : 0;
  const want = { x: clamp(tx - vw / 2, W, vw), y: clamp(ty - vh / 2 + talk * 0.5, H, vh, talk) };
  if (!camPos || camRoom !== r) {
    camPos = { ...want };
    camRoom = r;
  } else {
    const k = 1 - Math.exp(-dt * 5);
    camPos.x += (want.x - camPos.x) * k;
    camPos.y += (want.y - camPos.y) * k;
  }
  return { x: Math.round(camPos.x), y: Math.round(camPos.y) };
}

// ───────────────────────── 인물 ─────────────────────────

const HEROES = new Set(['toby', 'bori', 'ruru', 'nabi']);
const BOSS_KIND: Record<string, string> = { bear: 'b_bear', jelly: 'b_jelly', tin: 'b_tin', dusty: 'b_dusty', king: 'b_king' };

/** 장난감이 따로 그림이 없는 사람 자세는 비슷한 몸짓 한 장으로 (프레임 -1 = 시간으로 돈다) */
const TOY_ALIAS: Record<string, [string, number]> = {
  cry: ['wipe', -1], wave: ['pat', -1], lookDown: ['nod', 1], sleepSit: ['nod', 1], hugKnees: ['shiver', 0], chinRest: ['think', 0],
  handsBack: ['shrug', 0], hipsHands: ['shrug', 0], read: ['nod', 1], write: ['nod', 1], kneel: ['bow', 0], carryBack: ['bow', 0],
};

/** 장난감 몸짓 (걷는 중이 아니면): 이름 · 프레임 */
function toyAct(a: Actor, time: number): { act: string; frame: number } | null {
  if (a.moving) return null;
  const al = TOY_ALIAS[a.pose];
  const act = al ? al[0] : a.pose;
  if (!HERO_ACTS[act]) return null;
  const fixed = al ? al[1] : -1;
  const frame = fixed >= 0 ? fixed : Math.floor((time + hash2(a.x, 2, 7)) * (HERO_ACT_RATE[act] ?? 4)) % HERO_ACTS[act].length;
  return { act, frame };
}

function toyPose(a: Actor, time: number, wind: number): Pose {
  // 태엽이 적은 토비는 가끔 멈칫한다 (박자 자체는 adv 가 walkT 를 느리게 쌓아 늦춘다)
  if (a.moving) return WALK_FRAMES[a.kind === 'toby' ? gaitFrame(a.walkT, wind) : Math.floor(a.walkT * WALK_RATE) % 4];
  if (a.pose === 'hurt') return 'hurt';
  if (a.pose === 'windup' || a.pose === 'attack') return a.pose;
  // 깜빡임 · 숨쉬기 모두 인물마다 어긋나게 (네 장난감이 함께 들썩이지 않게)
  if ((time + phaseOf(a.id) * 3) % 3.4 < 0.12) return 'blink';
  return breathFrame(a.id, a.kind, time) ? 'idle2' : 'idle';
}

/** 그리는 동안의 연기 (drawAdv 가 인물마다 정한다): 대기 몸짓 · 말하는 중 · 표정 */
let fidget: { act: string; t: number } | null = null;
let speaking = false;
let speakMood: Mood | undefined;
/** 인물이 마지막으로 움직이거나 몸짓한 시각 (대기 몸짓을 고르려고) */
const stillSince = new Map<string, number>();

function pdir(d: Facing): PDir {
  if (d === 'up' || d === 'down' || d === 'left' || d === 'right') return d;
  return d.endsWith('Left') ? 'left' : 'right';
}

/** 걸으면서도 그대로 두는 팔 자세 (든 것 · 우산 · 휴대폰). 나머지는 걸을 때 빈손 걸음 */
const WALK_KEEP = new Set(['hold', 'holdStar', 'holdPhoto', 'holdDoll', 'hug', 'umbrella', 'phone', 'cry', 'lookUp', 'read', 'drink', 'eat', 'handsBack', 'hipsHands', 'carryBack', 'lookDown']);
const PERSON_POSE_SET = new Set<string>(PERSON_POSES);

function personPose(a: Actor, time: number): { pose: PPose; step?: PStep; frame?: number } {
  if (a.moving) return { pose: WALK_KEEP.has(a.pose) ? (a.pose as PPose) : 'idle', step: (Math.floor(a.walkT * 7) % 4) as PStep };
  if (a.pose !== 'idle') {
    if (!PERSON_POSE_SET.has(a.pose)) return { pose: 'idle' };
    // 몸짓 · 움직이는 자세는 시간으로 프레임을 고른다 (사람마다 조금씩 어긋나게)
    return { pose: a.pose as PPose, frame: personFrame(a.pose, time + hash2(a.x, 3, 5)) };
  }
  return { pose: (time + phaseOf(a.id) * 3) % 3.8 < 0.14 ? 'blink' : 'idle' };
}

/** 물건 그림 (종류마다 한 장) */
function itemImg(kind: string): HTMLCanvasElement {
  return img(`it:${kind}`, () => itemSprite(kind));
}

/** 물건 하나를 아래 가운데 (cx, bottom) 에 */
function drawItemAt(ctx: CanvasRenderingContext2D, kind: string, cx: number, bottom: number): void {
  const im = itemImg(kind);
  ctx.drawImage(im, Math.round(cx - im.width / 2), Math.round(bottom - im.height));
}

/** 바닥에 놓인 물건 (발 기준 y) */
function drawFloorItem(ctx: CanvasRenderingContext2D, kind: string, x: number, y: number): void {
  const foot = y + 6;
  const im = itemImg(kind);
  shadow(ctx, x, foot - 1, Math.max(3, im.width * 0.42), 0.24);
  drawItemAt(ctx, kind, x, foot + 1);
}

/** 위(뒤)를 보면 든 물건은 몸에 가려진다 */
const facesAway = (d: Facing) => d === 'up' || d === 'upLeft' || d === 'upRight';

/** 토비 등의 태엽 열쇠 (태엽이 적을수록 천천히) */
function drawKey(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, speed: number): void {
  const k = Math.cos(time * speed);
  const w = Math.max(1, Math.round(Math.abs(k) * 5));
  const cx = Math.round(x);
  const cy = Math.round(y);
  ctx.fillStyle = '#1c1424';
  ctx.fillRect(cx - w - 1, cy - 5, w * 2 + 2, 5);
  ctx.fillRect(cx - 1, cy - 1, 3, 4);
  ctx.fillStyle = k > 0 ? '#ffc83a' : '#d8a028';
  ctx.fillRect(cx - w, cy - 4, w * 2, 3);
  ctx.fillRect(cx, cy - 1, 1, 3);
}

/** 높은 칸에 선 인물: 그림은 위로 올리고 그림자는 바닥에 (drawActor 가 정함) */
let shadowDrop = 0;
/** 그림자를 그리지 않음 (윤곽선 따기용) */
let noShadow = false;

/** 인물 그림자 (E8): 빛(기본 왼쪽 위) 반대쪽으로 2px 치우친 타원 + 오른쪽 아래 작은 꼬리 */
function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a = 0.28): void {
  if (noShadow) return;
  y += shadowDrop;
  ctx.fillStyle = `rgba(20,10,30,${a})`;
  ctx.beginPath();
  ctx.ellipse(Math.round(x + 1), Math.round(y), r, Math.max(2, r * 0.4), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(20,10,30,${a * 0.6})`;
  ctx.beginPath();
  ctx.ellipse(Math.round(x + r * 0.55 + 2), Math.round(y + 1.5), r * 0.55, Math.max(1.5, r * 0.22), 0.25, 0, Math.PI * 2);
  ctx.fill();
}

/** 태엽 할머니 인형: 할머니를 닮은 작은 인형, 등에 태엽 */
function drawDoll(ctx: CanvasRenderingContext2D, a: Actor, x: number, foot: number, time: number): { x: number; y: number } {
  const d = pdir(a.dir);
  const stop = a.pose === 'stop';
  const own = !a.moving && a.pose !== 'idle' && PERSON_POSE_SET.has(a.pose);
  const pose: PPose = a.moving ? (['walk1', 'walk2', 'walk3', 'walk4'] as PPose[])[Math.floor(a.walkT * 5) % 4] : own ? (a.pose as PPose) : (time + 1.3) % 4.2 < 0.15 ? 'blink' : 'idle';
  const frame = own ? personFrame(pose, time) : 0;
  const im = img(`doll${d}${pose}${frame}`, () => personSprite('grandoll', d, pose, { frame }));
  shadow(ctx, x, foot, 8);
  if (stop) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(foot - 4));
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(im, -PERSON_W / 2, -im.height + 6);
    ctx.restore();
    return { x, y: foot - 16 };
  }
  const top = Math.round(foot + PERSON_FOOT_PAD - im.height);
  if (d !== 'up') drawKey(ctx, x + (d === 'left' ? 5 : d === 'right' ? -5 : 0), top + 20, time, 1.2);
  ctx.drawImage(im, Math.round(x - PERSON_W / 2), top);
  if (d === 'up') drawKey(ctx, x, top + 21, time, 1.2);
  return { x, y: top + 4 };
}

/** 의자에 앉으면 앉는 면 높이만큼 위로 (px) */
const SEAT_LIFT = 7;

/** 인물 하나. 머리 꼭대기 자리를 돌려준다 */
/** 주민 그림이 없는 kind (다시 찾지 않음) */
const NO_RES = new Set<string>();

/** 높이 한 단 (px) */
const ELEV_PX = 12;

/** 다른 그림 모음의 주민 그림 (tinSoldier · paperSisters …): 자리만 — 연결은 setResidentSprite 로 */
export type ResidentSprite = (kind: string, dir: string, frame: number) => Pix | null;
/** 기본: 다락방 · 책상 위 주민 (houseProps.ts) */
let resident: ResidentSprite | null = (kind, dir, frame) => residentSprite(kind, dir as RDir, frame);
export function setResidentSprite(f: ResidentSprite | null): void {
  resident = f;
}

/** 인물 하나 (높은 칸이면 elev × 12px 위로, 그림자는 바닥). 머리 꼭대기 자리를 돌려준다 */
function drawActor(ctx: CanvasRenderingContext2D, a: Actor, time: number, wind: number, held: string | null): { x: number; y: number } {
  const lift = (a.elev ?? 0) * ELEV_PX;
  if (!lift) return drawActorAt(ctx, a, time, wind, held);
  ctx.save();
  ctx.translate(0, -lift);
  shadowDrop = lift;
  const h = drawActorAt(ctx, a, time, wind, held);
  shadowDrop = 0;
  ctx.restore();
  return { x: h.x, y: h.y - lift };
}

function drawActorAt(ctx: CanvasRenderingContext2D, a: Actor, time: number, wind: number, held: string | null): { x: number; y: number } {
  const x = a.x;
  const foot = a.y + 6 - (a.seat ? SEAT_LIFT : 0);
  if (isPerson(a.kind) && a.kind !== 'grandoll') return drawPerson(ctx, a, x, foot, time, held);
  // 장난감 크기 인물이 든 물건: 크기 그대로, 몸 앞 아래쪽에
  const toyHeld = (front: boolean) => {
    if (!held || facesAway(a.dir) === front) return;
    const side = a.dir.includes('ight') ? 6 : a.dir.includes('eft') ? -6 : 0;
    const bob = a.moving ? Math.floor(a.walkT * 7) % 2 : 0;
    drawItemAt(ctx, held, x + side, foot - 2 - bob);
  };
  toyHeld(false);
  const head = drawToy(ctx, a, x, foot, time, wind);
  toyHeld(true);
  return head;
}

/** 사람 크기 인물: 걸음과 팔 자세를 따로, 든 물건은 손 자리에 (위를 보면 몸 뒤로) */
function drawPerson(ctx: CanvasRenderingContext2D, a: Actor, x: number, foot: number, time: number, held: string | null): { x: number; y: number } {
  const d = pdir(a.dir);
  const { pose, step, frame } = personPose(a, time);
  const carry = !!held;
  // 말하는 동안 입을 벌렸다 다물고, 대사 표정을 짓는다. 가만히 서 있으면 3.8초마다 숨 (1px)
  const talk = speaking && talkBob(time) === 1;
  const mood = speaking || speakMood ? speakMood : undefined;
  const bob = !a.moving && (pose === 'idle' || pose === 'blink') ? -personBreath(a.id, time) : 0;
  const im = img(`p${a.kind}${d}${pose}${step ?? ''}${carry ? 'c' : ''}f${frame ?? 0}${talk ? 't' : ''}${mood ?? ''}${bob}`, () => personSprite(a.kind, d, pose, { step, carry, frame, talk, mood, bob }));
  if (pose === 'sleep' || pose === 'lie') {
    ctx.drawImage(im, Math.round(x - im.width / 2), Math.round(foot - im.height));
    return { x, y: foot - im.height };
  }
  shadow(ctx, x, foot, 9);
  const left = Math.round(x - PERSON_W / 2);
  const top = Math.round(foot + PERSON_FOOT_PAD - im.height);
  const drawHeld = () => {
    if (!held) return;
    const hand = personHand(a.kind, d, pose, { step, carry, frame });
    const h = itemImg(held).height;
    // 손이 물건 아래 1/3 쯤을 받친다. 숙였을 때는 발치 바닥보다 내려가지 않는다
    const bottom = Math.min(top + hand.y + Math.round(h * 0.35), foot + 1);
    drawItemAt(ctx, held, left + hand.x + 0.5, bottom);
  };
  const behind = d === 'up';
  if (behind) drawHeld();
  ctx.drawImage(im, left, top);
  if (!behind) drawHeld();
  return { x, y: top + 4 };
}

function drawToy(ctx: CanvasRenderingContext2D, a: Actor, x: number, foot: number, time: number, wind: number): { x: number; y: number } {
  if (a.kind === 'grandoll') return drawDoll(ctx, a, x, foot, time);
  if (HEROES.has(a.kind)) {
    const dir = a.dir as Dir;
    const lying = a.pose === 'sleep' || a.pose === 'stop';
    const act = lying ? null : (toyAct(a, time) ?? (fidget && HERO_ACTS[fidget.act] ? { act: fidget.act, frame: Math.floor(fidget.t * (HERO_ACT_RATE[fidget.act] ?? 4)) % HERO_ACTS[fidget.act].length } : null));
    const pose = lying ? 'idle' : toyPose(a, time, wind);
    const key = act ? `${a.kind}${dir}@${act.act}${act.frame}` : `${a.kind}${dir}${pose}`;
    const im = img(key, () => (act && heroActSprite(a.kind as HeroId, dir, act.act, act.frame)) || heroSprite(a.kind as HeroId, dir, pose));
    shadow(ctx, x, foot, lying ? 12 : 8);
    if (lying) {
      ctx.save();
      ctx.translate(Math.round(x), Math.round(foot - 6));
      ctx.rotate(a.pose === 'stop' ? Math.PI / 2 : -Math.PI / 2);
      ctx.drawImage(im, -HERO_W / 2, -HERO_FOOT + 6);
      ctx.restore();
      return { x, y: foot - 18 };
    }
    const hx = Math.round(x - HERO_W / 2);
    const hy = Math.round(foot - HERO_FOOT);
    const isToby = a.kind === 'toby';
    const keyFront = dir === 'up' || dir === 'upLeft' || dir === 'upRight';
    const spin = 0.6 + wind * 3;
    if (isToby && !keyFront) drawKey(ctx, x - (dir.includes('Right') || dir === 'right' ? 6 : dir.includes('Left') || dir === 'left' ? -6 : 0), hy + 26, time, spin);
    ctx.drawImage(im, hx, hy);
    if (isToby && keyFront) drawKey(ctx, x, hy + 27, time, spin);
    return { x, y: hy + 6 };
  }
  const boss = BOSS_KIND[a.kind];
  if (boss) {
    const im = img(`b${boss}`, () => bossSprite(boss, 'idle0', 1));
    shadow(ctx, x, foot, im.width * 0.35);
    ctx.drawImage(im, Math.round(x - im.width / 2), Math.round(foot - im.height + 4));
    return { x, y: foot - im.height + 6 };
  }
  const frame = a.moving ? Math.floor(a.walkT * 6) % 4 : Math.floor(time * 2) % 2;
  const rkey = `res:${a.kind}:${pdir(a.dir)}:${frame}`;
  if (!NO_RES.has(rkey)) {
    let im = IMG.get(rkey);
    if (!im) {
      const rs = resident?.(a.kind, pdir(a.dir), frame);
      if (rs) im = img(rkey, () => rs);
      else NO_RES.add(rkey);
    }
    if (im) {
      shadow(ctx, x, foot, Math.max(4, im.width * 0.35));
      ctx.drawImage(im, Math.round(x - im.width / 2), Math.round(foot - im.height + 2));
      return { x, y: foot - im.height + 4 };
    }
  }
  // 알 수 없는 그림: 작은 점
  ctx.fillStyle = '#fff';
  ctx.fillRect(Math.round(x) - 2, Math.round(foot) - 6, 4, 6);
  return { x, y: foot - 10 };
}

/** 열린 문: 문틀 안은 어두운 복도, 문짝은 안쪽으로 젖혀진 얇은 판 */
function drawOpenDoors(ctx: CanvasRenderingContext2D, r: RoomDef, st: Stage): void {
  for (const f of r.furniture ?? []) {
    if (f.kind.split(':')[0] !== 'door' || st.props[`door@${f.x},${f.y}`]?.state !== 'open') continue;
    const x = f.x * TILE;
    const y = f.y * TILE;
    const w = f.w * TILE;
    const h = f.h * TILE;
    ctx.fillStyle = '#1a1210';
    ctx.fillRect(x + 2, y + 2, w - 4, h - 2);
    // 복도 불빛이 바닥으로 길게
    ctx.fillStyle = 'rgba(255,214,150,0.18)';
    ctx.fillRect(x + 3, y + h - 6, w - 6, 6);
    // 젖혀진 문짝
    ctx.fillStyle = '#8a5a34';
    ctx.fillRect(x + w - 6, y + 1, 5, h - 1);
    ctx.fillStyle = '#c08a58';
    ctx.fillRect(x + w - 6, y + 1, 1, h - 1);
  }
}

// ───────────────────────── 물건 ─────────────────────────

/** 물건 그림 (look 이름): 물건(items) → 가구(house) → 없으면 null */
function lookImg(look: string, room: RoomDef): HTMLCanvasElement | null {
  const key = `look:${look}:${room.look ?? ''}`;
  if (IMG.has(key)) return IMG.get(key)!;
  const p = lookPix(look, room.look);
  return p ? img(key, () => p) : null;
}

/** 밀 물건 그림 (연필 · 지우개는 진짜 크기) */
function pushImg(look: string, room: RoomDef): HTMLCanvasElement | null {
  const key = `push:${look}:${room.look ?? ''}`;
  if (IMG.has(key)) return IMG.get(key)!;
  const p = pushPix(look, room.look);
  return p ? img(key, () => p) : null;
}

/** 벽 (뒷벽 · 옆벽 두께 · 책등 벽): 긴 밀 물건 그림이 넘어가지 않게 */
const WALL_CH = new Set(['W', 'X', 'E', 'K']);

/** 긴 밀 물건 그림의 가운데: 칸 가운데에 두되, 같은 줄의 벽을 넘으면 안쪽으로 민다 (낭떠러지 위로는 걸쳐도 된다) */
function pushCenter(r: RoomDef, bx: number, by: number, w: number): number {
  let cx = px(bx);
  if (w <= TILE) return cx;
  const row = r.tiles[by] ?? '';
  let l = bx;
  while (l > 0 && !WALL_CH.has(row[l - 1])) l--;
  let rr = bx;
  while (rr < row.length - 1 && !WALL_CH.has(row[rr + 1])) rr++;
  const minC = l * TILE + w / 2;
  const maxC = (rr + 1) * TILE - w / 2;
  if (minC <= maxC) cx = Math.min(maxC, Math.max(minC, cx));
  return cx;
}

/** 미끄러지는 중인 물건은 아직 다리가 아니다 (도착한 뒤에 다리로 바뀐다) */
function restAt(a: Adv, id: string): [number, number] {
  const s = a.stage.slides?.[id];
  return s && s.t < s.dur ? [-99, -99] : a.blockAt(id);
}

/** 미끄러져 멈춘 물건 발치에 이는 먼지 */
function drawDust(ctx: CanvasRenderingContext2D, st: Stage, id: string, cx: number, foot: number, w: number): void {
  const s = st.slides?.[id];
  if (!s || s.t < s.dur) return;
  const k = Math.min(1, (s.t - s.dur) / DUST_S);
  ctx.fillStyle = `rgba(210,200,190,${0.55 * (1 - k)})`;
  for (let i = 0; i < 4; i++) {
    const side = i % 2 ? 1 : -1;
    const r = 1.5 + k * 3 + (i >> 1);
    ctx.beginPath();
    ctx.arc(Math.round(cx + side * (w / 2 + k * 6 + (i >> 1) * 3)), Math.round(foot - 1 - k * 3 - (i >> 1) * 2), r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** 이 밀 물건이 지금 틈을 잇는 다리가 되어 있나 (그러면 drawBridges 가 다리로 그린다) */
function isBridge(a: Adv, id: string): boolean {
  for (const t of a.room.things) {
    if (t.kind !== 'gap' || !a.flags[`gap_${t.id}`]) continue;
    const pad = a.room.things.find((p) => p.kind === 'pad' && p.flag === `gap_${t.id}`);
    if (!pad || pad.kind !== 'pad' || !pad.accepts.includes(id)) continue;
    const [bx, by] = restAt(a, id);
    if (bx === pad.at[0] && by === pad.at[1] && bridgeLook(a.room, t.id, (q) => restAt(a, q))) return true;
  }
  return false;
}

/** 그림 둘레 금빛 테두리 (한 번 만들어 둠) */
const RIMS = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();
function goldRim(im: HTMLCanvasElement): HTMLCanvasElement {
  const hit = RIMS.get(im);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = im.width + 4;
  c.height = im.height + 4;
  const d = c.getContext('2d')!;
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) d.drawImage(im, 2 + dx, 2 + dy);
  d.globalCompositeOperation = 'source-in';
  d.fillStyle = '#ffd86a';
  d.fillRect(0, 0, c.width, c.height);
  d.globalCompositeOperation = 'destination-out';
  d.drawImage(im, 2, 2);
  RIMS.set(im, c);
  return c;
}

/** 바닥에 놓인 물건 그림 하나 (발 = 칸 아래쪽) */
function drawLook(ctx: CanvasRenderingContext2D, im: HTMLCanvasElement, cx: number, foot: number, rim = 0): void {
  if (im.width > TILE * 1.5) {
    // 길쭉한 물건 (연필 · 지우개): 납작한 띠 그림자
    if (!noShadow) {
      ctx.fillStyle = 'rgba(20,10,30,0.26)';
      ctx.beginPath();
      ctx.ellipse(Math.round(cx + 2), Math.round(foot + shadowDrop), im.width * 0.46, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else shadow(ctx, cx, foot - 1, Math.max(4, im.width * 0.42), 0.24);
  const x = Math.round(cx - im.width / 2);
  const y = Math.round(foot + 1 - im.height);
  ctx.drawImage(im, x, y);
  if (rim > 0) {
    ctx.globalAlpha = rim;
    ctx.drawImage(goldRim(im), x - 2, y - 2);
    ctx.globalAlpha = 1;
  }
}

/** 발판 (pad · seq): 바닥에 납작한 판. on 이면 빛남 */
function drawPlate(ctx: CanvasRenderingContext2D, x: number, y: number, on: boolean, label?: string): void {
  const l = Math.round(x - 9);
  const t = Math.round(y - 5);
  ctx.fillStyle = 'rgba(20,10,30,0.3)';
  ctx.fillRect(l + 1, t + 2, 19, 11);
  ctx.fillStyle = on ? '#f0c860' : '#b8a488';
  ctx.fillRect(l, t, 18, 10);
  ctx.fillStyle = on ? '#fff0b8' : '#d8c8a8';
  ctx.fillRect(l, t, 18, 1);
  ctx.fillStyle = on ? '#b08830' : '#8a7458';
  ctx.fillRect(l, t + 9, 18, 1);
  ctx.fillRect(l + 17, t, 1, 10);
  if (label) {
    ctx.fillStyle = on ? '#5a3a10' : '#4a3a2a';
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, l + 9, t + 5);
  }
}

/** 바닥에 납작하게 깔리는 것 (발 정렬 전에): 자리 맞추기 발판 · 순서 발판 */
function drawFloorThings(ctx: CanvasRenderingContext2D, a: Adv, lights: Light[]): void {
  for (const t of a.things()) {
    if (t.kind === 'pad') {
      const on = !!a.flags[t.flag];
      // 다리가 놓인 발판은 다리 그림 아래로 숨는다
      if (on && t.flag.startsWith('gap_') && bridgeLook(a.room, t.flag.slice(4), (q) => restAt(a, q))) continue;
      drawPlate(ctx, px(t.at[0]), px(t.at[1]) + 4, on);
      if (on) lights.push({ x: px(t.at[0]), y: px(t.at[1]) + 4, r: 22, color: [255, 220, 140], k: 0.4 });
    } else if (t.kind === 'seq') {
      const st = a.seqState(t.id);
      t.keys.forEach((k, i) => {
        const on = !!st && (st.done || st.pressed.includes(i));
        const im = k.look ? lookImg(k.look, a.room) : null;
        if (im && !on) ctx.drawImage(im, Math.round(px(k.at[0]) - im.width / 2), Math.round(px(k.at[1]) + 6 - im.height));
        else drawPlate(ctx, px(k.at[0]), px(k.at[1]) + 4, on, k.label);
        if (on) lights.push({ x: px(k.at[0]), y: px(k.at[1]) + 4, r: 20, color: [255, 220, 140], k: 0.45 });
      });
    }
  }
}

/** 오르기 자리: 낮은 칸에서 높은 칸으로 늘어진 밧줄 (매듭) */
function drawRope(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number): void {
  const n = Math.max(3, Math.round(Math.hypot(x1 - x0, y1 - y0) / 4));
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const x = x0 + (x1 - x0) * u + Math.sin(u * Math.PI) * 2;
    const y = y0 + (y1 - y0) * u;
    ctx.fillStyle = i % 3 === 0 ? '#8a6a3a' : '#c8a060';
    ctx.fillRect(Math.round(x), Math.round(y), 2, 3);
  }
}

function drawThing(ctx: CanvasRenderingContext2D, a: Adv, t: Thing, time: number, lights: Light[]): void {
  const bob = Math.round(Math.sin(time * 2.4 + hash2(t.id.length, 0, 3) * 6) * 2);
  if (t.kind === 'memory') {
    const x = px(t.at[0]);
    const y = px(t.at[1]);
    shadow(ctx, x, y + 6, 5, 0.2);
    const im = img(`shard${Math.floor(time * 6) % 4}`, () => shardSprite(Math.floor(time * 6) % 4));
    ctx.drawImage(im, Math.round(x - 8), Math.round(y - 14 + bob));
    lights.push({ x, y: y - 6, r: 46, color: [170, 220, 255], k: 0.8, glow: 0.45 });
  } else if (t.kind === 'keepsake') {
    // 기억이 깃든 물건: 바닥에 놓인 그림, 가까이 오면 금빛 테두리가 숨 쉰다 (살펴본 뒤엔 look2)
    const x = px(t.at[0]);
    const y = px(t.at[1]);
    const seen = !!a.flags[`mem_${t.id}`];
    const im = lookImg(seen ? (t.look2 ?? t.look) : t.look, a.room) ?? itemImg('parcel');
    const p = a.stage.actors[a.player];
    const near = !seen && (a.prompt?.id === t.id || (!!p && Math.hypot(p.x - x, p.y - y) < TILE * 1.6));
    const breath = near ? 0.55 + Math.sin(time * 3.2) * 0.35 : 0;
    drawLook(ctx, im, x, y + 6, breath);
    if (near) lights.push({ x, y: y - 4, r: 34, color: [255, 220, 150], k: 0.35 + breath * 0.3, glow: 0.25 });
  } else if (t.kind === 'push') {
    if (isBridge(a, t.id)) return;
    const [bx, by] = slideAt(a.stage, t.id, a.blockAt(t.id));
    const im = pushImg(t.look, a.room) ?? img(`blk${t.look}`, () => blockSprite(t.look));
    const x0 = Math.floor(bx);
    const fx = bx - x0;
    const cx = pushCenter(a.room, x0, Math.round(by), im.width) * (1 - fx) + (fx ? pushCenter(a.room, x0 + 1, Math.round(by), im.width) * fx : 0);
    drawLook(ctx, im, cx, (by + 1) * TILE - 2);
    drawDust(ctx, a.stage, t.id, cx, (by + 1) * TILE - 2, im.width);
  } else if (t.kind === 'windup') {
    const x = px(t.at[0]);
    const y = px(t.at[1]);
    const used = !!a.flags[`windup_${t.id}`];
    const im = (t.look && lookImg(t.look, a.room)) || img('ks:key', () => keepsakeSprite('key'));
    drawLook(ctx, im, x, y + 6);
    if (!used) {
      // 태엽 구멍이 반짝 (토비가 나눠 줄 수 있음)
      ctx.fillStyle = Math.floor(time * 3) % 2 ? '#ffe08a' : '#ffc83a';
      ctx.fillRect(Math.round(x + im.width / 2 - 3), Math.round(y + 6 - im.height * 0.6), 2, 2);
    }
  } else if (t.kind === 'climb') {
    drawRope(ctx, px(t.to[0]), px(t.to[1]) - (a.elevAt(t.to[0], t.to[1]) * ELEV_PX) + 4, px(t.at[0]), px(t.at[1]) + 4);
  } else if (t.kind === 'block') {
    const [bx, by] = slideAt(a.stage, t.id, a.blockAt(t.id));
    const im = img(`blk${t.look}`, () => blockSprite(t.look));
    shadow(ctx, px(bx), (by + 1) * TILE - 2, 11, 0.3);
    ctx.drawImage(im, Math.round(bx * TILE), Math.round((by + 1) * TILE - im.height));
    drawDust(ctx, a.stage, t.id, px(bx), (by + 1) * TILE - 2, im.width);
  } else if (t.kind === 'star') {
    const x = px(t.at[0]);
    const y = px(t.at[1]);
    const im = img('pstar', paperStarSprite);
    ctx.drawImage(im, Math.round(x - 5), Math.round(y - 6));
    if (Math.floor(time * 3 + t.at[0]) % 5 === 0) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(Math.round(x + 3), Math.round(y - 7), 1, 1);
    }
    lights.push({ x, y, r: 18, color: [255, 230, 140], k: 0.45 });
  } else if (t.kind === 'link') {
    const x = px(t.at[0]);
    const y = px(t.at[1]);
    const m = a.memories();
    const open = m.got >= m.total;
    const im = img(`ks${t.icon}`, () => keepsakeSprite(t.icon));
    shadow(ctx, x, y + 6, 8, 0.25);
    if (!open) ctx.globalAlpha = 0.55;
    ctx.drawImage(im, Math.round(x - 11), Math.round(y - 18 + (open ? bob : 0)));
    ctx.globalAlpha = 1;
    if (open) lights.push({ x, y: y - 8, r: 70, color: [255, 228, 150], k: 0.95, glow: 0.6 });
  } else if (t.kind === 'thread') {
    // 기억의 실: 공중에 떠 있는 금빛 실 한 가닥 (천천히 물결친다)
    const x = px(t.at[0]);
    const y = px(t.at[1]) - 8 + bob;
    for (const [lw, col] of [[5, 'rgba(255,214,140,0.3)'], [2, 'rgba(255,236,180,1)']] as const) {
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.beginPath();
      for (let i = 0; i <= 14; i++) {
        const u = i / 14;
        const qx = x - 11 + u * 22;
        const qy = y + Math.sin(u * Math.PI * 2 + time * 3) * 4 * Math.sin(u * Math.PI);
        if (i) ctx.lineTo(qx, qy);
        else ctx.moveTo(qx, qy);
      }
      ctx.stroke();
    }
    ctx.fillStyle = '#fff6d8';
    const sp = (time * 0.7) % 1;
    ctx.fillRect(Math.round(x - 11 + sp * 22), Math.round(y - 1), 2, 2);
    lights.push({ x, y, r: 40, color: [255, 220, 150], k: 0.75 + Math.sin(time * 2.2) * 0.15, glow: 0.5 });
  }
}

/** 놓인 다리: 밀어 놓은 연필이면 틈을 가로지른 연필 통나무, 아니면 밧줄 다리 나무판 */
function drawBridges(ctx: CanvasRenderingContext2D, a: Adv): void {
  for (const t of a.room.things) {
    if (t.kind !== 'gap' || !a.flags[`gap_${t.id}`]) continue;
    // 다리가 될 물건이 아직 미끄러지는 중이면 도착한 뒤에
    const pad = a.room.things.find((q) => q.kind === 'pad' && q.flag === `gap_${t.id}`);
    if (pad?.kind === 'pad' && pad.accepts.some((id) => restAt(a, id)[0] === -99)) continue;
    const look = bridgeLook(a.room, t.id, (q) => restAt(a, q));
    const im = look ? pushImg(look, a.room) : null;
    if (im) {
      // 틈 칸들을 감싸는 상자 가운데에, 두께를 길 폭에 맞춰 세로로 늘린 연필 (길이는 그대로)
      const xs = t.tiles.map(([x]) => x);
      const ys = t.tiles.map(([, y]) => y);
      const cx = ((Math.min(...xs) + Math.max(...xs) + 1) * TILE) / 2;
      const top = Math.min(...ys) * TILE;
      const rows = Math.max(...ys) - Math.min(...ys) + 1;
      // 연필 몸통 줄 (외곽선 포함 그림 아래쪽 13px) 만 정수 배로 늘린다
      const bodyH = Math.min(13, im.height);
      const sy = Math.max(0, im.height - bodyH - 2);
      const k = Math.max(1, Math.min(2, Math.floor((rows * TILE - 4) / bodyH)));
      const dh = bodyH * k;
      const dy = Math.round(top + (rows * TILE - dh) / 2);
      const dx = Math.round(cx - im.width / 2);
      // 아득한 바닥에 떨어진 그림자
      ctx.fillStyle = 'rgba(10,6,20,0.4)';
      ctx.fillRect(dx + 8, dy + dh, im.width - 12, 4);
      ctx.drawImage(im, 0, sy, im.width, bodyH, dx, dy, im.width, dh);
      continue;
    }
    for (const [tx, ty] of t.tiles) {
      const x = tx * TILE;
      const y = ty * TILE;
      ctx.fillStyle = '#6a4a2a';
      ctx.fillRect(x, y + 4, TILE, 1);
      ctx.fillRect(x, y + TILE - 5, TILE, 1);
      for (let i = 0; i < TILE; i += 5) {
        ctx.fillStyle = '#b8864a';
        ctx.fillRect(x + i, y + 5, 4, TILE - 10);
        ctx.fillStyle = '#8a5a30';
        ctx.fillRect(x + i + 3, y + 5, 1, TILE - 10);
      }
    }
  }
}

// ───────────────────────── 소품 상태 ─────────────────────────

/** 문 · 텔레비전은 따로 그린다 (열린 문틈 · 화면 빛) */
const OWN_STATE = new Set(['door', 'tv']);

/** 대본 @prop 으로 상태가 붙은 가구들 */
function propStates(r: RoomDef, st: Stage): { f: Furniture; state: string }[] {
  const out: { f: Furniture; state: string }[] = [];
  if (!Object.keys(st.props).length) return out;
  for (const f of r.furniture ?? []) {
    const kind = f.kind.split(':')[0];
    if (OWN_STATE.has(kind)) continue;
    const p = st.props[`${kind}@${f.x},${f.y}`];
    if (p) out.push({ f, state: p.state });
  }
  return out;
}

/** 상태 그림 한 부분 (pix 전체 · 발 쪽 base · 뒷부분 behind · 윗부분 top) 과 그 자리 */
function stateImg(r: RoomDef, f: Furniture, state: string, part: 'pix' | 'base' | 'behind' | 'top'): { img: HTMLCanvasElement; x: number; y: number } | null {
  const key = `state:${r.id}:${f.kind}@${f.x},${f.y}:${state}`;
  let sp = STATE_SPR.get(key);
  if (!sp) {
    sp = stateSprite(f, state, lookOf(r.look));
    STATE_SPR.set(key, sp);
  }
  const pix = part === 'pix' ? sp.pix : part === 'top' ? sp.top : part === 'behind' ? sp.behind : sp.base;
  if (!pix) return null;
  return { img: img(`${key}:${part}`, () => pix), x: f.x * TILE + sp.ox, y: (f.y + f.h) * TILE + sp.oy };
}
const STATE_SPR = new Map<string, ReturnType<typeof stateSprite>>();

// ───────────────────────── 빛 ─────────────────────────

let lightCanvas: HTMLCanvasElement | null = null;
const rgba = (c: readonly number[], al: number) => `rgba(${c[0]},${c[1]},${c[2]},${al})`;

function drawLighting(ctx: CanvasRenderingContext2D, ambient: RGB, all: Light[], beams: Beam[], pools: Pool[], cones: Cone[], ox: number, oy: number, vw: number, vh: number, time: number): void {
  if (!lightCanvas) lightCanvas = document.createElement('canvas');
  if (lightCanvas.width !== vw || lightCanvas.height !== vh) {
    lightCanvas.width = vw;
    lightCanvas.height = vh;
  }
  const d = lightCanvas.getContext('2d')!;
  d.globalCompositeOperation = 'source-over';
  d.fillStyle = rgba(ambient, 1);
  d.fillRect(0, 0, vw, vh);
  d.globalCompositeOperation = 'lighter';
  const seen: Light[] = [];
  for (const l of all) {
    const x = l.x + ox;
    const y = l.y + oy;
    if (x < -l.r || y < -l.r || x > vw + l.r || y > vh + l.r) continue;
    seen.push(l);
    const k = Math.min(1, l.k);
    const gr = d.createRadialGradient(x, y, 0, x, y, l.r);
    gr.addColorStop(0, rgba(l.color, k));
    gr.addColorStop(0.45, rgba(l.color, k * 0.55));
    gr.addColorStop(1, rgba(l.color, 0));
    d.fillStyle = gr;
    d.fillRect(x - l.r, y - l.r, l.r * 2, l.r * 2);
  }
  for (const b of beams) beamPath(d, b, ox, oy, rgba(b.color, b.k * (0.92 + Math.sin(time * 0.7) * 0.08)));
  for (const p of pools) poolPath(d, p, ox, oy, rgba(p.color, p.k * (0.94 + Math.sin(time * 0.6) * 0.06)));
  for (const c of cones) conePath(d, c, ox, oy, c.k);
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(lightCanvas, 0, 0);
  ctx.globalCompositeOperation = 'lighter';
  for (const l of seen) {
    if (!l.glow) continue;
    const x = l.x + ox;
    const y = l.y + oy;
    const r = l.r * 0.45;
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, rgba(l.color, l.glow * 0.5));
    gr.addColorStop(1, rgba(l.color, 0));
    ctx.fillStyle = gr;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (const b of beams) beamPath(ctx, b, ox, oy, rgba(b.color, 0.05));
  for (const p of pools) poolPath(ctx, p, ox, oy, rgba(p.color, 0.07));
  for (const c of cones) conePath(ctx, c, ox, oy, 0.12);
  ctx.globalCompositeOperation = 'source-over';
}

/** 창 모양 빛 웅덩이: 창유리 칸마다 평행사변형 (창살 자리는 어둡게 남는다) */
function poolPath(c: CanvasRenderingContext2D, p: Pool, ox: number, oy: number, color: string): void {
  c.fillStyle = color;
  for (const q of poolPanes(p)) {
    c.beginPath();
    c.moveTo(q[0][0] + ox, q[0][1] + oy);
    for (let i = 1; i < 4; i++) c.lineTo(q[i][0] + ox, q[i][1] + oy);
    c.closePath();
    c.fill();
  }
}

/** 스탠드 원뿔: 꼭짓점에서 아래로 퍼지는 빛 (아래로 갈수록 옅게) */
function conePath(c: CanvasRenderingContext2D, k: Cone, ox: number, oy: number, al: number): void {
  const x = k.x + ox;
  const y = k.y + oy;
  const gr = c.createLinearGradient(x, y, x, y + k.len);
  gr.addColorStop(0, rgba(k.color, al));
  gr.addColorStop(1, rgba(k.color, al * 0.25));
  c.fillStyle = gr;
  c.beginPath();
  c.moveTo(x - 3, y);
  c.lineTo(x + 3, y);
  c.lineTo(x + k.spread / 2 + 3, y + k.len);
  c.lineTo(x - k.spread / 2 + 3, y + k.len);
  c.closePath();
  c.fill();
  c.beginPath();
  c.ellipse(x + 3, y + k.len, k.spread / 2, Math.max(3, k.spread / 6), 0, 0, Math.PI * 2);
  c.fill();
}

function beamPath(c: CanvasRenderingContext2D, b: Beam, ox: number, oy: number, color: string): void {
  const x = b.x + ox;
  const y = b.y + oy;
  const gr = c.createLinearGradient(x, y, x + b.slant, y + b.h);
  gr.addColorStop(0, color);
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = gr;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x + b.w, y);
  c.lineTo(x + b.w + b.slant, y + b.h);
  c.lineTo(x + b.slant, y + b.h);
  c.closePath();
  c.fill();
}

function drawMotes(ctx: CanvasRenderingContext2D, beams: Beam[], cam: { x: number; y: number }, vw: number, vh: number, time: number): void {
  for (const b of beams) {
    for (let i = 0; i < 22; i++) {
      const t = (hash2(i, b.x, 3) + time * (0.012 + hash2(i, b.y, 4) * 0.02)) % 1;
      const y = b.y + t * b.h;
      const x = b.x + hash2(i, b.x, 5) * b.w + t * b.slant + Math.sin(time * 0.8 + i) * 4;
      if (x < cam.x - 4 || x > cam.x + vw + 4 || y < cam.y - 4 || y > cam.y + vh + 4) continue;
      ctx.globalAlpha = Math.sin(t * Math.PI) * (0.35 + hash2(i, 9, b.x) * 0.4);
      ctx.fillStyle = '#e8eeff';
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
  }
  ctx.globalAlpha = 1;
}

/** 빗줄기 (화면 좌표) */
function drawRain(ctx: CanvasRenderingContext2D, vw: number, vh: number, time: number): void {
  ctx.fillStyle = 'rgba(190,210,240,0.35)';
  const n = Math.floor((vw * vh) / 2600);
  for (let i = 0; i < n; i++) {
    const sp = 260 + hash2(i, 1, 9) * 120;
    const x = (hash2(i, 2, 9) * (vw + 60) - time * 40 * (0.5 + hash2(i, 5, 9))) % (vw + 60);
    const y = (hash2(i, 3, 9) * (vh + 40) + time * sp) % (vh + 40);
    const xx = x < 0 ? x + vw + 60 : x;
    ctx.fillRect(Math.round(xx - 30), Math.round(y - 20), 1, 6);
  }
}

let vignette: { w: number; h: number; c: HTMLCanvasElement } | null = null;
function drawVignette(ctx: CanvasRenderingContext2D, vw: number, vh: number): void {
  if (!vignette || vignette.w !== vw || vignette.h !== vh) {
    const c = document.createElement('canvas');
    c.width = vw;
    c.height = vh;
    const d = c.getContext('2d')!;
    const gr = d.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * 0.42, vw / 2, vh / 2, Math.hypot(vw, vh) * 0.58);
    gr.addColorStop(0, 'rgba(8,6,20,0)');
    gr.addColorStop(1, 'rgba(8,6,20,0.5)');
    d.fillStyle = gr;
    d.fillRect(0, 0, vw, vh);
    vignette = { w: vw, h: vh, c };
  }
  ctx.drawImage(vignette.c, 0, 0);
}

// ───────────────────────── 한 장 ─────────────────────────

/** 장난감 크기 인물인가 (가구 밑을 걷는 쪽) */
const isToy = (a: Actor) => !isPerson(a.kind) || a.kind === 'grandoll';

/** 가구 밑 장난감 윤곽 (1px 밝은 선): 인물을 따로 그려 둘레만 남긴다 */
let outlineCanvas: HTMLCanvasElement | null = null;
let ringCanvas: HTMLCanvasElement | null = null;
function drawToyOutline(ctx: CanvasRenderingContext2D, act: Actor, paint: (c: CanvasRenderingContext2D) => void): void {
  const W = 64;
  const H = 72;
  if (!outlineCanvas) {
    outlineCanvas = document.createElement('canvas');
    ringCanvas = document.createElement('canvas');
    outlineCanvas.width = ringCanvas.width = W;
    outlineCanvas.height = ringCanvas.height = H;
  }
  const o = outlineCanvas.getContext('2d')!;
  const r = ringCanvas!.getContext('2d')!;
  o.clearRect(0, 0, W, H);
  r.clearRect(0, 0, W, H);
  const fx = Math.round(act.x) - W / 2;
  const fy = Math.round(act.y) + 10 - H;
  o.save();
  o.translate(-fx, -fy);
  noShadow = true;
  paint(o);
  noShadow = false;
  o.restore();
  r.globalCompositeOperation = 'source-over';
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) r.drawImage(outlineCanvas, dx, dy);
  r.globalCompositeOperation = 'source-in';
  r.fillStyle = 'rgba(255,240,206,0.95)';
  r.fillRect(0, 0, W, H);
  r.globalCompositeOperation = 'destination-out';
  r.drawImage(outlineCanvas, 0, 0);
  r.globalCompositeOperation = 'source-over';
  ctx.drawImage(ringCanvas!, fx, fy);
}

/** 살펴보기 표시: 지금 표시한 것 · 처음 뜬 시각 (팝) */
let markerId: string | null = null;
let markerT = 0;

/** 주운 종이별 여섯 조각이 토비 머리 위로 빨려 들어간다 (알림이 뜬 뒤 0.6초) */
function drawStarPickup(ctx: CanvasRenderingContext2D, st: Stage, player: string): void {
  const t = st.toast;
  const p = st.actors[player];
  if (!t || !p) return;
  const age = t.max - t.life;
  for (let i = 0; i < 6; i++) {
    const k = (age - i * 0.05) / 0.4;
    if (k < 0 || k > 1) continue;
    const e = k * k;
    const ang = (i / 6) * Math.PI * 2;
    // 별 자리에서 둥글게 퍼졌다가 머리로
    const sx = t.x + Math.cos(ang) * 10 * Math.sin(k * Math.PI);
    const sy = t.y - 6 + Math.sin(ang) * 6 * Math.sin(k * Math.PI);
    const x = sx + (p.x - sx) * e;
    const y = sy + (p.y - 26 - sy) * e;
    ctx.fillStyle = i % 2 ? '#ffe08a' : '#fff4c8';
    ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
  }
}

export function drawAdv(ctx: CanvasRenderingContext2D, a: Adv, vw: number, vh: number, time: number, dt: number): AdvFrame {
  const r = a.room;
  const L = roomLayer(r);
  const cam = camera(a, vw, vh, dt);
  const st = a.stage;
  const shake = st.shake > 0 && !st.noShake ? { x: Math.round((hash2(time * 60, 1, 2) - 0.5) * 6 * st.shake), y: Math.round((hash2(time * 60, 3, 4) - 0.5) * 6 * st.shake) } : { x: 0, y: 0 };
  const ox = -cam.x + shake.x;
  const oy = -cam.y + shake.y;
  ctx.fillStyle = r.scale === 'toy' ? '#120a1e' : '#1a1210';
  ctx.fillRect(0, 0, vw, vh);
  if (r.abyss) drawAbyss(ctx, r.abyss, cam, vw, vh);
  ctx.save();
  ctx.translate(ox, oy);
  ctx.drawImage(L.back, 0, 0);
  // 대본이 바꾼 소품 상태 (@prop cuckoo bird · lampBase on): 바닥에 구운 벽 붙박이는 그 위에 새 그림을 덧그린다
  const states = propStates(r, st);
  const cones: Cone[] = [];
  const stateLights: Light[] = [];
  for (const { f, state } of states) {
    const g = stateGlow(f, state);
    cones.push(...g.cones);
    stateLights.push(...g.lights);
    if (f.over || f.fg || L.props.some((q) => q.f === f)) continue;
    const sp = stateImg(r, f, state, 'pix');
    if (sp) ctx.drawImage(sp.img, sp.x, sp.y);
  }
  drawBridges(ctx, a);
  drawOpenDoors(ctx, r, st);
  const lights: Light[] = [...stateLights];
  drawFloorThings(ctx, a, lights);

  const inView = (x: number, y: number, m = 80) => x > cam.x - m && x < cam.x + vw + m && y > cam.y - m && y < cam.y + vh + m;
  const heads: Record<string, { x: number; y: number }> = {};
  const bubbles: Bubble[] = [];
  const actorPaint = (act: Actor, held: string | null) => (c: CanvasRenderingContext2D) => drawActor(c, act, time, a.save.wind, held);
  const heldOf = (act: Actor) => (act.carry && st.items[act.carry]?.on === act.id ? st.items[act.carry].kind : null);

  // 방 그림 층: 가구 아랫부분(props) · 윗부분(top) · 윗층(over) · 앞쪽 가림막(fg, 빛 다음에)
  const fgItems: LSprite[] = [];
  const entries: DrawEntry[] = planEntries(L, (s, layer) => {
    if (layer === 'fg') {
      fgItems.push(s);
      return;
    }
    if (s.x > cam.x + vw || s.y > cam.y + vh || s.x + s.img.width < cam.x || s.y + s.img.height < cam.y) return;
    const f = s.f;
    // 상태가 바뀐 소품: 같은 부분(아랫부분 · 뒷부분 · 윗부분)의 상태 그림으로
    const state = f ? states.find((q) => q.f === f)?.state : undefined;
    if (f && state && (layer === 'props' || layer === 'top')) {
      const part = layer === 'top' ? 'top' : s.foot < (f.y + f.h) * TILE - 2 ? 'behind' : 'base';
      const sp = stateImg(r, f, state, part);
      if (sp) {
        ctx.drawImage(sp.img, sp.x, sp.y);
        return;
      }
    }
    // 윗층(들보 · 차단기 자)은 장난감이 밑을 지나면 살짝 비친다
    if (layer === 'over' && f) {
      const hit = Object.values(st.actors).some((act) => {
        if (!isToy(act)) return false;
        const lift = (act.elev ?? 0) * ELEV_PX;
        return act.x + 8 > s.x && act.x - 8 < s.x + s.img.width && act.y + 6 - lift > s.y && act.y - 26 - lift < s.y + s.img.height;
      });
      if (hit) {
        ctx.globalAlpha = 0.55;
        ctx.drawImage(s.img, s.x, s.y);
        ctx.globalAlpha = 1;
        return;
      }
    }
    if (layer === 'props' && f?.under) {
      // 장난감이 가구 밑에 있으면 윗판을 60% 로 비치고 장난감 윤곽선을 보인다
      const x0 = f.x * TILE;
      const x1 = (f.x + f.w) * TILE;
      const y0 = f.y * TILE;
      const y1 = (f.y + f.h) * TILE;
      const under = Object.values(st.actors).filter((act) => isToy(act) && act.x >= x0 && act.x < x1 && act.y >= y0 && act.y < y1);
      if (under.length) {
        ctx.globalAlpha = 0.6;
        ctx.drawImage(s.img, s.x, s.y);
        ctx.globalAlpha = 1;
        for (const act of under) drawToyOutline(ctx, act, actorPaint(act, heldOf(act)));
        return;
      }
    }
    ctx.drawImage(s.anim ? animFrame(s as PropDraw, time) : s.img, s.x, s.y);
  });
  let n = 0;
  for (const t of a.things()) {
    if (t.kind === 'npc' || t.kind === 'spot' || t.kind === 'trigger' || t.kind === 'gap' || t.kind === 'dark' || t.kind === 'pad' || t.kind === 'seq' || t.kind === 'chase') continue;
    const foot = t.kind === 'block' || t.kind === 'push' ? (slideAt(st, t.id, a.blockAt(t.id))[1] + 1) * TILE - 2 : px(t.at[1]) + 4;
    entries.push({ layer: 'props', foot, id: `t${n++}`, draw: () => drawThing(ctx, a, t, time, lights) });
  }
  // 살펴본 기억 물건은 things() 에서 빠지지만 look2(없으면 look) 그림으로 그 자리에 남는다
  const shown = new Set(a.things().map((t) => t.id));
  for (const t of r.things) if (t.kind === 'keepsake' && !shown.has(t.id) && a.flags[`mem_${t.id}`]) entries.push({ layer: 'props', foot: px(t.at[1]) + 4, id: `k${n++}`, draw: () => drawThing(ctx, a, t, time, lights) });
  // 바닥에 놓인 물건: 인물과 함께 발 자리로 앞뒤를 가린다 (같은 줄이면 인물이 앞)
  for (const it of Object.values(st.items)) {
    if (it.on !== null || !inView(it.x, it.y)) continue;
    entries.push({ layer: 'props', foot: it.y + 5.9, id: `i${n++}`, draw: () => drawFloorItem(ctx, it.kind, it.x, it.y) });
  }
  // 말하는 이 · 듣는 이: 말하는 동안 들썩이고 (사람은 입을 벌리고), 가까운 이들은 말하는 쪽을 본다
  const dl = st.dialog;
  const speaker = dl?.who ? st.actors[dl.who] : undefined;
  const revealing = !!dl && dl.shown < dl.text.length;
  for (const act of Object.values(st.actors)) {
    const held = heldOf(act);
    // 대기 몸짓: 자유롭게 걷는 동안 오래 서 있던 동료 · 토비만
    if (act.moving || act.act || act.pose !== 'idle' || a.runner || a.mini || !stillSince.has(act.id)) stillSince.set(act.id, time);
    entries.push({
      layer: 'props',
      foot: act.seat ? act.y + 12 : act.y + 6,
      id: `a:${act.id}`,
      draw: () => {
        const talking = act === speaker;
        const turn = speaker && !talking ? listenDir(act, speaker) : null;
        const dir = act.dir;
        if (turn) act.dir = turn;
        speaking = talking && revealing;
        speakMood = talking ? dl?.mood : undefined;
        fidget = idleFidget(act.id, act.kind, time - (stillSince.get(act.id) ?? time));
        const lift = speaking && !isPerson(act.kind) ? talkBob(time) : 0;
        if (lift) {
          ctx.save();
          ctx.translate(0, -lift);
        }
        const h = drawActor(ctx, act, time, a.save.wind, held);
        if (lift) ctx.restore();
        act.dir = dir;
        speaking = false;
        speakMood = undefined;
        fidget = null;
        heads[act.id] = h;
        if (act.emote) bubbles.push({ x: h.x, y: h.y, e: act.emote.e, life: act.emote.life });
      },
    });
  }
  for (const e of orderDraws(entries)) e.draw();
  drawStarPickup(ctx, st, a.player);

  // 빛: 토비 불빛 · 나비 등불 (장난감이 걷는 방)
  const p = st.actors[a.player];
  if (toyWalk(r) && p) {
    const flick = Math.sin(time * 3.1) * 2 + Math.sin(time * 7.3);
    lights.push({ x: p.x, y: p.y - 8, r: 96, color: [255, 196, 120], k: 0.75 + flick * 0.01, glow: 0.1 });
    const nabi = st.actors.nabi;
    if (nabi) lights.push({ x: nabi.x, y: nabi.y - 10, r: 130, color: [255, 220, 140], k: 0.9, glow: 0.35 });
  }
  // 켜진 텔레비전: 화면이 깜빡이며 방을 푸르게 비춘다
  for (const f of r.furniture ?? []) {
    if (f.kind.split(':')[0] !== 'tv' || st.props[`tv@${f.x},${f.y}`]?.state !== 'on') continue;
    const top = (f.y + f.h) * TILE - (Math.max(8, f.h * TILE - 8) + 36);
    const k = 0.7 + Math.sin(time * 9) * 0.15 + Math.sin(time * 23) * 0.1;
    ctx.fillStyle = `rgba(170,210,255,${k})`;
    ctx.fillRect(f.x * TILE + 7, top + 7, f.w * TILE - 19, 14);
    lights.push({ x: f.x * TILE + (f.w * TILE) / 2, y: (f.y + f.h) * TILE + 10, r: 110, color: [150, 190, 255], k: 0.55 * k, glow: 0.2 });
  }
  ctx.restore();
  // 방 불을 끄면 빛 없는 곳이 훨씬 어둡다
  const dark = st.props.light?.state === 'off';
  drawLighting(ctx, dark ? [Math.round(L.ambient[0] * 0.35), Math.round(L.ambient[1] * 0.35), Math.round(L.ambient[2] * 0.45)] : L.ambient, [...L.lights.filter(() => !dark), ...lights], dark ? [] : L.beams, dark ? [] : L.pools, [...(dark ? [] : L.cones), ...cones], ox, oy, vw, vh, time);
  ctx.save();
  ctx.translate(ox, oy);
  drawMotes(ctx, L.beams, cam, vw, vh, time);
  // 앞쪽 가림막: 살펴볼 물건과 겹치면 옅게
  const spots = a.things().flatMap((t) => (t.kind === 'trigger' || t.kind === 'chase' ? [] : t.kind === 'seq' ? t.keys.map((k) => k.at) : [t.at]));
  for (const s of fgItems)
    drawFg(ctx, s, cam, vw, vh, (x, y, w, h) => spots.some(([tx, ty]) => px(tx) > x && px(tx) < x + w && px(ty) > y && px(ty) < y + h));
  ctx.restore();
  if (r.rain) drawRain(ctx, vw, vh, time);
  drawVignette(ctx, vw, vh);

  let marker: Marker | null = null;
  if (a.prompt) {
    const t = a.prompt;
    const pos = t.kind === 'block' || t.kind === 'push' ? { x: px(a.blockAt(t.id)[0]), y: px(a.blockAt(t.id)[1]) - 22 } : t.kind === 'trigger' || t.kind === 'seq' || t.kind === 'chase' ? null : { x: px(t.at[0]), y: px(t.at[1]) - 22 };
    const label: Record<Thing['kind'], string> = {
      spot: '살펴보기', npc: '말 걸기', memory: '기억 조각', keepsake: '살펴보기', star: '줍기', block: '밀기', push: '밀기', gap: '밧줄 걸기', thread: '기억의 실',
      link: t.kind === 'link' ? t.name : '', trigger: '', dark: '', pad: '', windup: '태엽 나눠 주기', climb: '오르기', seq: '', chase: '',
    };
    if (t.id !== markerId) {
      markerId = t.id;
      markerT = time;
    }
    if (pos) marker = { x: pos.x - cam.x, y: pos.y - cam.y, text: label[t.kind], pop: markerPop(time - markerT) };
  } else markerId = null;
  const toScreen = (q: { x: number; y: number }) => ({ x: q.x + ox, y: q.y + oy });
  for (const b of bubbles) Object.assign(b, toScreen(b));
  for (const k of Object.keys(heads)) heads[k] = toScreen(heads[k]);
  return { cam, bubbles, marker, heads };
}

/** 방이 바뀌면 그림을 새로 (미리 만들기) */
export function preloadRoom(r: RoomDef): void {
  roomLayer(r);
}
