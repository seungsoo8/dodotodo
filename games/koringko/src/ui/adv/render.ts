/**
 * 어드벤처 세계 그리기 (논리 해상도): 방 바닥 → (가구 · 소품 · 인물 · 물건 y 순서) → 빛 → 빛 먼지 → 가장자리.
 * 장난감 방은 기존 밤 방 그림(mapLayer)을, 사람 크기 기억 방은 house.ts 를 쓴다.
 */
import type { Adv } from '../../core/adv/adv.ts';
import { px } from '../../core/adv/stage.ts';
import type { Actor, Facing, RoomDef, Stage, Thing } from '../../core/adv/types.ts';
import { TILE, type MapDef } from '../../core/maps.ts';
import type { HeroId } from '../../core/types.ts';
import { bossSprite } from '../art/bosses.ts';
import { pixCanvas } from '../art/canvas.ts';
import { HERO_FOOT, HERO_W, heroSprite, WALK_FRAMES, WALK_RATE, type Dir, type Pose } from '../art/heroes.ts';
import { FLAT, floorTile, furnitureSprite, lookOf, wallTile } from '../art/house.ts';
import { blockSprite, keepsakeSprite, paperStarSprite, shardSprite } from '../art/keepsakes.ts';
import { hash2, Pix } from '../art/paint.ts';
import { isPerson, PERSON_FOOT_PAD, PERSON_W, personSprite, type PDir, type PPose } from '../art/people.ts';
import { animFrame, buildMapLayer, type PropDraw } from '../render/mapLayer.ts';
import { AMBIENT, moonBeams, staticLights, type Beam, type Light, type RGB } from '../render/light.ts';

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

interface Layer {
  ground: HTMLCanvasElement;
  props: PropDraw[];
  lights: Light[];
  beams: Beam[];
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

function toyLayer(r: RoomDef): Layer {
  const m = r as unknown as MapDef;
  const L = buildMapLayer(m);
  const ex = extraLights(r);
  return { ground: L.ground, props: L.props, lights: [...staticLights(m), ...ex.lights], beams: [...moonBeams(m), ...ex.beams], ambient: r.ambient ?? AMBIENT[r.theme] };
}

const SKY_AMBIENT: Record<string, RGB> = { day: [255, 250, 242], dusk: [255, 222, 196], rain: [206, 210, 222], night: [118, 116, 168] };

function houseLayer(r: RoomDef): Layer {
  const L = lookOf(r.look);
  const W = r.w * TILE;
  const H = r.h * TILE;
  const p = new Pix(W, H);
  const wall = (tx: number, ty: number) => r.tiles[ty]?.[tx] === 'W';
  for (let ty = 0; ty < r.h; ty++)
    for (let tx = 0; tx < r.w; tx++) {
      if (wall(tx, ty)) p.stamp(wallTile(L, tx, ty, !wall(tx, ty + 1) && ty + 1 < r.h, !wall(tx, ty - 1)), tx * TILE, ty * TILE);
      else {
        p.stamp(floorTile(L, tx, ty), tx * TILE, ty * TILE);
        // 벽 바로 아래 그늘
        if (wall(tx, ty - 1)) for (let y = 0; y < 5; y++) for (let x = 0; x < TILE; x++) {
          const c = p.get(tx * TILE + x, ty * TILE + y);
          p.set(tx * TILE + x, ty * TILE + y, shadeC(c, -0.25 + y * 0.05));
        }
      }
    }
  const props: PropDraw[] = [];
  const lights: Light[] = [];
  const beams: Beam[] = [];
  for (const f of r.furniture ?? []) {
    const [kind, opt] = f.kind.split(':');
    const s = furnitureSprite(kind, f.w, f.h, L, opt ?? '');
    const x = f.x * TILE + s.ox;
    const y = (f.y + f.h) * TILE + s.oy;
    if (FLAT.has(kind) || (s.wall && kind !== 'shelf' && kind !== 'wardrobe' && kind !== 'tv')) p.stamp(s.pix, x, y);
    else {
      // 바닥 그림자
      for (let yy = -3; yy <= 2; yy++)
        for (let xx = 2; xx < f.w * TILE - 2; xx++) {
          const gx = f.x * TILE + xx;
          const gy = (f.y + f.h) * TILE + yy;
          p.set(gx, gy, shadeC(p.get(gx, gy), -0.18));
        }
      props.push({ img: pixCanvas(s.pix), x, y, foot: (f.y + f.h) * TILE - 2 });
    }
    if (kind === 'window' && L.sky !== 'night') beams.push({ x: f.x * TILE + 4, y: (f.y + f.h) * TILE, w: f.w * TILE - 8, h: 5 * TILE, slant: 2 * TILE, color: L.sky === 'dusk' ? [255, 190, 130] : [255, 248, 220], k: 0.18 });
    if (kind === 'window' && L.sky === 'night') beams.push({ x: f.x * TILE + 4, y: (f.y + f.h) * TILE, w: f.w * TILE - 8, h: 5 * TILE, slant: 2 * TILE, color: [150, 180, 255], k: 0.34 });
    if (kind === 'desk') lights.push({ x: f.x * TILE + 8, y: (f.y + f.h) * TILE - 30, r: 70, color: [255, 214, 150], k: L.sky === 'night' ? 0.8 : 0.25, glow: 0.3 });
  }
  const ex = extraLights(r);
  return { ground: pixCanvas(p), props, lights: [...lights, ...ex.lights], beams: [...beams, ...ex.beams], ambient: r.ambient ?? SKY_AMBIENT[L.sky] };
}

function shadeC(c: number, k: number): number {
  if (c < 0) return c;
  const r = (c >> 16) & 255;
  const g = (c >> 8) & 255;
  const b = c & 255;
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  return (f(r) << 16) | (f(g) << 8) | f(b);
}

// ───────────────────────── 카메라 ─────────────────────────

let camPos: { x: number; y: number } | null = null;
let camRoom: RoomDef | null = null;

function camera(a: Adv, vw: number, vh: number, dt: number): { x: number; y: number } {
  const st = a.stage;
  const r = a.room;
  let tx: number;
  let ty: number;
  const target = st.cam;
  if (target && typeof target === 'object') {
    tx = target.x;
    ty = target.y;
  } else {
    const who = (typeof target === 'string' ? st.actors[target] : null) ?? st.actors[a.player] ?? Object.values(st.actors)[0];
    tx = who ? who.x : (r.w * TILE) / 2;
    ty = who ? who.y - 10 : (r.h * TILE) / 2;
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

function toyPose(a: Actor, time: number): Pose {
  if (a.moving) return WALK_FRAMES[Math.floor(a.walkT * WALK_RATE) % 4];
  if (a.pose === 'hurt') return 'hurt';
  if (a.pose === 'windup' || a.pose === 'attack') return a.pose;
  if ((time + hash2(a.x, 0, 1) * 3) % 3.4 < 0.12) return 'blink';
  return Math.floor(time * 1.4) % 2 ? 'idle2' : 'idle';
}

function pdir(d: Facing): PDir {
  if (d === 'up' || d === 'down' || d === 'left' || d === 'right') return d;
  return d.endsWith('Left') ? 'left' : 'right';
}

function personPose(a: Actor, time: number): PPose {
  if (a.moving) return (['walk1', 'walk2', 'walk3', 'walk4'] as PPose[])[Math.floor(a.walkT * 7) % 4];
  if (a.pose !== 'idle') return a.pose as PPose;
  return (time + hash2(a.x, 1, 2) * 3) % 3.8 < 0.14 ? 'blink' : 'idle';
}

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

function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a = 0.28): void {
  ctx.fillStyle = `rgba(20,10,30,${a})`;
  ctx.beginPath();
  ctx.ellipse(Math.round(x), Math.round(y), r, Math.max(2, r * 0.4), 0, 0, Math.PI * 2);
  ctx.fill();
}

/** 태엽 할머니 인형: 할머니를 닮은 작은 인형, 등에 태엽 */
function drawDoll(ctx: CanvasRenderingContext2D, a: Actor, x: number, foot: number, time: number): { x: number; y: number } {
  const d = pdir(a.dir);
  const stop = a.pose === 'stop';
  const pose: PPose = a.moving ? (['walk1', 'walk2', 'walk3', 'walk4'] as PPose[])[Math.floor(a.walkT * 5) % 4] : (time + 1.3) % 4.2 < 0.15 ? 'blink' : 'idle';
  const im = img(`doll${d}${pose}`, () => personSprite('grandoll', d, pose));
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
function drawActor(ctx: CanvasRenderingContext2D, a: Actor, time: number, wind: number): { x: number; y: number } {
  const x = a.x;
  const foot = a.y + 6 - (a.seat ? SEAT_LIFT : 0);
  if (a.kind === 'grandoll') return drawDoll(ctx, a, x, foot, time);
  if (HEROES.has(a.kind)) {
    const dir = a.dir as Dir;
    const lying = a.pose === 'sleep' || a.pose === 'stop';
    const pose = lying ? 'idle' : toyPose(a, time);
    const key = `${a.kind}${dir}${pose}`;
    const im = img(key, () => heroSprite(a.kind as HeroId, dir, pose));
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
  if (isPerson(a.kind)) {
    const d = pdir(a.dir);
    const pose = personPose(a, time);
    const im = img(`p${a.kind}${d}${pose}`, () => personSprite(a.kind, d, pose));
    if (pose === 'sleep') {
      ctx.drawImage(im, Math.round(x - im.width / 2), Math.round(foot - im.height));
      return { x, y: foot - im.height };
    }
    shadow(ctx, x, foot, 9);
    const top = Math.round(foot + PERSON_FOOT_PAD - im.height);
    ctx.drawImage(im, Math.round(x - PERSON_W / 2), top);
    return { x, y: top + 4 };
  }
  const boss = BOSS_KIND[a.kind];
  if (boss) {
    const im = img(`b${boss}`, () => bossSprite(boss, 'idle0', 1));
    shadow(ctx, x, foot, im.width * 0.35);
    ctx.drawImage(im, Math.round(x - im.width / 2), Math.round(foot - im.height + 4));
    return { x, y: foot - im.height + 6 };
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

function drawThing(ctx: CanvasRenderingContext2D, a: Adv, t: Thing, time: number, lights: Light[]): void {
  const bob = Math.round(Math.sin(time * 2.4 + hash2(t.id.length, 0, 3) * 6) * 2);
  if (t.kind === 'memory') {
    const x = px(t.at[0]);
    const y = px(t.at[1]);
    shadow(ctx, x, y + 6, 5, 0.2);
    const im = img(`shard${Math.floor(time * 6) % 4}`, () => shardSprite(Math.floor(time * 6) % 4));
    ctx.drawImage(im, Math.round(x - 8), Math.round(y - 14 + bob));
    lights.push({ x, y: y - 6, r: 46, color: [170, 220, 255], k: 0.8, glow: 0.45 });
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
  } else if (t.kind === 'block') {
    const [bx, by] = a.blockAt(t.id);
    const im = img(`blk${t.look}`, () => blockSprite(t.look));
    shadow(ctx, px(bx), (by + 1) * TILE - 2, 11, 0.3);
    ctx.drawImage(im, bx * TILE, (by + 1) * TILE - im.height);
  }
}

/** 놓인 밧줄 다리 */
function drawBridges(ctx: CanvasRenderingContext2D, a: Adv): void {
  for (const t of a.room.things) {
    if (t.kind !== 'gap' || !a.flags[`gap_${t.id}`]) continue;
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

// ───────────────────────── 빛 ─────────────────────────

let lightCanvas: HTMLCanvasElement | null = null;
const rgba = (c: readonly number[], al: number) => `rgba(${c[0]},${c[1]},${c[2]},${al})`;

function drawLighting(ctx: CanvasRenderingContext2D, ambient: RGB, all: Light[], beams: Beam[], ox: number, oy: number, vw: number, vh: number, time: number): void {
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
  ctx.globalCompositeOperation = 'source-over';
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

export function drawAdv(ctx: CanvasRenderingContext2D, a: Adv, vw: number, vh: number, time: number, dt: number): AdvFrame {
  const r = a.room;
  const L = roomLayer(r);
  const cam = camera(a, vw, vh, dt);
  const st = a.stage;
  const shake = st.shake > 0 ? { x: Math.round((hash2(time * 60, 1, 2) - 0.5) * 6 * st.shake), y: Math.round((hash2(time * 60, 3, 4) - 0.5) * 6 * st.shake) } : { x: 0, y: 0 };
  const ox = -cam.x + shake.x;
  const oy = -cam.y + shake.y;
  ctx.fillStyle = r.scale === 'toy' ? '#120a1e' : '#1a1210';
  ctx.fillRect(0, 0, vw, vh);
  ctx.save();
  ctx.translate(ox, oy);
  ctx.drawImage(L.ground, 0, 0);
  drawBridges(ctx, a);
  drawOpenDoors(ctx, r, st);

  const items: { y: number; draw: () => void }[] = [];
  const lights: Light[] = [];
  const inView = (x: number, y: number, m = 80) => x > cam.x - m && x < cam.x + vw + m && y > cam.y - m && y < cam.y + vh + m;
  for (const pd of L.props) if (inView(pd.x, pd.y, 140)) items.push({ y: pd.foot, draw: () => ctx.drawImage(animFrame(pd, time), pd.x, pd.y) });
  for (const t of a.things()) {
    if (t.kind === 'npc' || t.kind === 'spot' || t.kind === 'trigger' || t.kind === 'gap' || t.kind === 'dark') continue;
    const foot = t.kind === 'block' ? (a.blockAt(t.id)[1] + 1) * TILE - 2 : px(t.at[1]) + 4;
    items.push({ y: foot, draw: () => drawThing(ctx, a, t, time, lights) });
  }
  const heads: Record<string, { x: number; y: number }> = {};
  const bubbles: Bubble[] = [];
  for (const act of Object.values(st.actors)) {
    items.push({
      y: act.seat ? act.y + 12 : act.y + 6,
      draw: () => {
        const h = drawActor(ctx, act, time, a.save.wind);
        heads[act.id] = h;
        if (act.emote) bubbles.push({ x: h.x, y: h.y, e: act.emote.e, life: act.emote.life });
      },
    });
  }
  items.sort((p, q) => p.y - q.y);
  for (const it of items) it.draw();

  // 빛: 토비 불빛 · 나비 등불
  const p = st.actors[a.player];
  if (r.scale === 'toy' && p) {
    const flick = Math.sin(time * 3.1) * 2 + Math.sin(time * 7.3);
    lights.push({ x: p.x, y: p.y - 8, r: 96, color: [255, 196, 120], k: 0.75 + flick * 0.01, glow: 0.1 });
    const nabi = st.actors.nabi;
    if (nabi) lights.push({ x: nabi.x, y: nabi.y - 10, r: 130, color: [255, 220, 140], k: 0.9, glow: 0.35 });
  }
  // 켜진 텔레비전: 화면이 깜빡이며 방을 푸르게 비춘다
  for (const f of r.furniture ?? []) {
    if (f.kind.split(':')[0] !== 'tv' || st.props[`tv@${f.x},${f.y}`]?.state !== 'on') continue;
    const sx = f.x * TILE + 6;
    const sy = (f.y + f.h) * TILE - f.h * TILE - 16 + 2;
    const k = 0.7 + Math.sin(time * 9) * 0.15 + Math.sin(time * 23) * 0.1;
    ctx.fillStyle = `rgba(170,210,255,${k})`;
    ctx.fillRect(sx, sy, f.w * TILE - 12, 13);
    lights.push({ x: f.x * TILE + (f.w * TILE) / 2, y: (f.y + f.h) * TILE + 10, r: 110, color: [150, 190, 255], k: 0.55 * k, glow: 0.2 });
  }
  ctx.restore();
  // 방 불을 끄면 빛 없는 곳이 훨씬 어둡다
  const dark = st.props.light?.state === 'off';
  drawLighting(ctx, dark ? [Math.round(L.ambient[0] * 0.35), Math.round(L.ambient[1] * 0.35), Math.round(L.ambient[2] * 0.45)] : L.ambient, [...L.lights.filter(() => !dark), ...lights], dark ? [] : L.beams, ox, oy, vw, vh, time);
  ctx.save();
  ctx.translate(ox, oy);
  drawMotes(ctx, L.beams, cam, vw, vh, time);
  ctx.restore();
  if (r.rain) drawRain(ctx, vw, vh, time);
  drawVignette(ctx, vw, vh);

  let marker: Marker | null = null;
  if (a.prompt) {
    const t = a.prompt;
    const pos = t.kind === 'block' ? { x: px(a.blockAt(t.id)[0]), y: px(a.blockAt(t.id)[1]) - 22 } : t.kind === 'trigger' ? null : { x: px(t.at[0]), y: px(t.at[1]) - 22 };
    const label = { spot: '살펴보기', npc: '말 걸기', memory: '기억 조각', star: '줍기', block: '밀기', gap: '밧줄 걸기', link: t.kind === 'link' ? t.name : '', trigger: '', dark: '' }[t.kind];
    if (pos) marker = { x: pos.x - cam.x, y: pos.y - cam.y, text: label };
  }
  const toScreen = (q: { x: number; y: number }) => ({ x: q.x + ox, y: q.y + oy });
  for (const b of bubbles) Object.assign(b, toScreen(b));
  for (const k of Object.keys(heads)) heads[k] = toScreen(heads[k]);
  return { cam, bubbles, marker, heads };
}

/** 방이 바뀌면 그림을 새로 (미리 만들기) */
export function preloadRoom(r: RoomDef): void {
  roomLayer(r);
}
