/** 세계 그리기 (논리 해상도 캔버스): 땅 → 장판 → 떨어진 물건 → (소품·인물 y 순서) → 탄 → 효과 → 어둠 */
import { CLASSES } from '../../core/classes.ts';
import { hasPower } from '../../core/combat.ts';
import type { Game } from '../../core/game.ts';
import { TILE, type MapDef } from '../../core/maps.ts';
import type { Drop, Hazard, Monster, Projectile, World } from '../../core/world.ts';
import { pixCanvas } from '../art/canvas.ts';
import { HERO_FOOT, HERO_W, heroSprite, npcSprite, weaponSprite, type Dir, type Pose } from '../art/heroes.ts';
import { goldIcon, itemIcon, matIcon, potionIcon, RARITY_COLOR } from '../art/icons.ts';
import { monsterFrames } from '../art/monsters.ts';
import { Pix, CLEAR } from '../art/paint.ts';
import { structureSprite } from '../art/props.ts';
import { animFrame, buildMapLayer, type MapLayer } from './mapLayer.ts';
import type { Fx } from './fx.ts';

/** 글자는 화면 해상도로 따로 그린다 (세계 좌표) */
export interface Label {
  x: number;
  y: number;
  text: string;
  color: string;
  /** 작은 글씨 */
  small?: boolean;
}

export interface SceneOut {
  labels: Label[];
}

// ───────────────────────── 그림 저장소 ─────────────────────────

const HERO_CACHE = new Map<string, HTMLCanvasElement>();
function heroImg(key: string, make: () => Pix): HTMLCanvasElement {
  let c = HERO_CACHE.get(key);
  if (!c) {
    c = pixCanvas(make());
    HERO_CACHE.set(key, c);
  }
  return c;
}

const MON_CACHE = new Map<string, HTMLCanvasElement>();
/** 몬스터 그림 (뒤집기 · 하얗게 번쩍) */
function monImg(id: string, frame: number, flip: boolean, white: boolean): HTMLCanvasElement {
  const key = `${id}${frame}${flip ? 'f' : ''}${white ? 'w' : ''}`;
  let c = MON_CACHE.get(key);
  if (!c) {
    let p = monsterFrames(id)[frame];
    if (flip) p = p.flipped();
    if (white) {
      const q = new Pix(p.w, p.h);
      for (let i = 0; i < p.px.length; i++) if (p.px[i] !== CLEAR) q.px[i] = 0xffffff;
      p = q;
    }
    c = pixCanvas(p);
    MON_CACHE.set(key, c);
  }
  return c;
}

let layerFor: MapDef | null = null;
let layer: MapLayer | null = null;
let lights: { x: number; y: number; r: number; color: string }[] = [];

function mapLayer(m: MapDef): MapLayer {
  if (layerFor !== m || !layer) {
    layer = buildMapLayer(m);
    layerFor = m;
    lights = [];
    for (let ty = 0; ty < m.h; ty++)
      for (let tx = 0; tx < m.w; tx++) {
        const c = m.tiles[ty][tx];
        if (c === 'c') lights.push({ x: tx * TILE + 12, y: ty * TILE + 12, r: 46, color: '#7ad0ff' });
      }
    for (const s of m.structures) if (s.kind === 'altar' || s.kind === 'lamp' || s.kind === 'portal') lights.push({ x: (s.x + s.w / 2) * TILE, y: s.y * TILE + 6, r: 70, color: '#ffd84a' });
  }
  return layer;
}

export function preloadMap(m: MapDef): void {
  mapLayer(m);
}

// ───────────────────────── 그리기 ─────────────────────────

const SWING_COLOR: Record<string, string> = { toby: '#e8f4ff', bori: '#ffe0a0', ruru: '#d8ffd0', nabi: '#e8d0ff' };

export function swingColor(hero: string): string {
  return SWING_COLOR[hero] ?? '#ffffff';
}

export function drawScene(ctx: CanvasRenderingContext2D, g: Game, cam: { x: number; y: number }, vw: number, vh: number, fx: Fx, time: number): SceneOut {
  const w = g.world;
  const L = mapLayer(w.map);
  const labels: Label[] = [];
  const shx = fx.shake > 0 ? Math.round((fx.rand() - 0.5) * fx.shake) : 0;
  const shy = fx.shake > 0 ? Math.round((fx.rand() - 0.5) * fx.shake) : 0;
  const ox = -cam.x + shx;
  const oy = -cam.y + shy;

  ctx.fillStyle = w.map.theme === 'rift' ? '#120a22' : w.map.theme === 'cave' ? '#1a1410' : '#000';
  ctx.fillRect(0, 0, vw, vh);
  ctx.save();
  ctx.translate(ox, oy);
  // 땅 (보이는 만큼만)
  const sx = Math.max(0, cam.x - 8);
  const sy = Math.max(0, cam.y - 8);
  const sw = Math.min(L.ground.width - sx, vw + 16);
  const sh = Math.min(L.ground.height - sy, vh + 16);
  if (sw > 0 && sh > 0) ctx.drawImage(L.ground, sx, sy, sw, sh, sx, sy, sw, sh);
  const inView = (x: number, y: number, m = 48) => x > cam.x - m && x < cam.x + vw + m && y > cam.y - m && y < cam.y + vh + m * 2;

  // 물 반짝임
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  for (const wt of L.water) {
    if (!inView(wt.x, wt.y)) continue;
    const ph = (time * 0.8 + (wt.x * 7 + wt.y * 13) * 0.001) % 1;
    const x = wt.x + ((wt.x * 3 + wt.y) % 17) + Math.round(ph * 4);
    ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.7;
    ctx.fillRect(x, wt.y + ((wt.x + wt.y * 5) % 19) + 2, 3, 1);
  }
  ctx.globalAlpha = 1;

  // 장판
  for (const h of w.hazards) drawHazard(ctx, h, time);

  // 떨어진 물건
  for (const d of w.drops) if (inView(d.x, d.y)) drawDrop(ctx, d, time, labels);

  // y 순서
  type Item = { y: number; draw: () => void };
  const items: Item[] = [];
  for (const pr of L.props) {
    if (pr.x > cam.x + vw + 8 || pr.x + pr.img.width < cam.x - 8 || pr.y > cam.y + vh + 8 || pr.foot < cam.y - 8) continue;
    items.push({ y: pr.foot, draw: () => ctx.drawImage(animFrame(pr, time), pr.x, pr.y) });
  }
  // 균열 귀환문
  if (w.rift?.portal) {
    const pt = w.rift.portal;
    items.push({
      y: pt.y + 10,
      draw: () => {
        const s = structureSprite('portal', 2, 2, Math.floor(time * 5) % 4);
        ctx.drawImage(pixCanvas(s.pix), Math.round(pt.x - TILE + s.ox), Math.round(pt.y - TILE + s.oy + 6));
      },
    });
    labels.push({ x: pt.x, y: pt.y - 40, text: '돌아가는 문', color: '#c8b0ff' });
  }
  // 마을 사람
  for (const n of w.map.npcs) {
    if (n.id === 'riftkeeper' && !g.save.flags.rift_open) continue;
    const x = n.x * TILE + TILE / 2;
    const y = n.y * TILE + TILE / 2;
    if (!inView(x, y)) continue;
    const dx = w.player.x - x;
    const dy = w.player.y - y;
    const near = Math.hypot(dx, dy) < 90;
    const dir: Dir = !near ? 'down' : Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
    const bob = Math.floor(time * 2 + n.x) % 2 === 0 ? 'idle' : 'idle';
    items.push({
      y,
      draw: () => {
        shadow(ctx, x, y + 6, 8);
        ctx.drawImage(heroImg(`npc${n.id}${dir}${bob}`, () => npcSprite(n.id, dir, bob as Pose)), Math.round(x - HERO_W / 2), Math.round(y + 6 - HERO_FOOT));
      },
    });
  }
  for (const m of w.monsters) {
    if (m.hp <= 0 || !inView(m.x, m.y, 80)) continue;
    items.push({ y: m.y, draw: () => drawMonster(ctx, m, w, time, labels) });
  }
  const p = w.player;
  items.push({ y: p.y, draw: () => drawPlayer(ctx, g, fx, time) });
  items.sort((a, b) => a.y - b.y);
  for (const it of items) it.draw();

  // 탄
  for (const pr of w.projectiles) if (pr.life > 0) drawProjectile(ctx, pr, time);

  // 효과
  drawFx(ctx, fx);

  ctx.restore();

  // 어둠 (동굴 · 균열)
  if (w.map.dark) drawDark(ctx, g, ox, oy, vw, vh, time);

  // 번쩍임
  if (fx.flash) {
    ctx.globalAlpha = (fx.flash.life / fx.flash.max) * 0.45;
    ctx.fillStyle = fx.flash.color;
    ctx.fillRect(0, 0, vw, vh);
    ctx.globalAlpha = 1;
  }
  // 다쳤을 때 가장자리 붉게
  const hurtT = time - fx.hurtAt;
  const low = g.save.hp / g.stats.maxHp;
  const edge = Math.max(hurtT < 0.35 ? (0.35 - hurtT) * 1.4 : 0, low < 0.3 && p.state !== 'dead' ? (0.3 - low) * (1.2 + Math.sin(time * 6) * 0.4) : 0);
  if (edge > 0) {
    const gr = ctx.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * 0.35, vw / 2, vh / 2, Math.max(vw, vh) * 0.7);
    gr.addColorStop(0, 'rgba(255,40,60,0)');
    gr.addColorStop(1, `rgba(255,40,60,${Math.min(0.5, edge)})`);
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, vw, vh);
  }
  return { labels };
}

function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a = 0.28): void {
  ctx.fillStyle = `rgba(20,10,30,${a})`;
  ctx.beginPath();
  ctx.ellipse(Math.round(x), Math.round(y), r, Math.max(2, r * 0.4), 0, 0, Math.PI * 2);
  ctx.fill();
}

// ───────────────────────── 주인공 ─────────────────────────

function drawPlayer(ctx: CanvasRenderingContext2D, g: Game, fx: Fx, time: number): void {
  const p = g.world.player;
  const hero = g.save.hero;
  const footY = p.y + 6;
  if (p.state === 'dead') {
    ctx.globalAlpha = 0.7;
    ctx.save();
    ctx.translate(Math.round(p.x), Math.round(footY - 6));
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(heroImg(`h${hero}downidle`, () => heroSprite(hero, 'down', 'idle')), -HERO_W / 2, -HERO_FOOT + 6);
    ctx.restore();
    ctx.globalAlpha = 1;
    return;
  }
  shadow(ctx, p.x, footY, 8);
  // 깜빡임 (무적)
  if (p.iframes > 0 && p.state !== 'roll' && Math.floor(time * 20) % 2 === 0) ctx.globalAlpha = 0.45;
  const dir = p.face as Dir;
  let pose: Pose = 'idle';
  if (p.state === 'move') pose = Math.floor(p.walkT * 7) % 2 === 0 ? 'walkA' : 'walkB';
  else if (p.state === 'attack' || p.state === 'cast') pose = 'attack';
  const img = heroImg(`h${hero}${dir}${pose}`, () => heroSprite(hero, dir, pose));
  const weapon = CLASSES[hero].weapon;
  const facing = Math.atan2(p.dir.y, p.dir.x);
  // 무기 각도
  let wAng = facing + 0.9;
  let wDist = 6;
  if (p.state === 'attack' && (weapon === 'sword' || weapon === 'axe')) {
    const arc = 1.6;
    const rev = fx.lastSwing.step % 2 === 1;
    const since = time - fx.lastSwing.time;
    if (p.hitIn >= 0) wAng = facing + (rev ? arc / 2 + 0.3 : -arc / 2 - 0.3);
    else wAng = facing + (rev ? -1 : 1) * (-arc / 2 + arc * Math.min(1, since / 0.08));
    wDist = 8;
  } else if (weapon === 'bow' || weapon === 'staff') {
    wAng = p.state === 'attack' || p.state === 'cast' ? facing : facing + 0.6;
  }
  const behind = p.dir.y < -0.3;
  const drawWeapon = () => {
    const ws = heroImg(`w${weapon}`, () => weaponSprite(weapon));
    ctx.save();
    ctx.translate(Math.round(p.x + Math.cos(wAng) * wDist * 0.5), Math.round(p.y - 2 + Math.sin(wAng) * wDist * 0.4));
    if (weapon === 'bow') {
      ctx.rotate(wAng);
      ctx.drawImage(ws, 2, -ws.height / 2);
    } else {
      ctx.rotate(wAng);
      ctx.drawImage(ws, -2, -ws.height / 2);
    }
    ctx.restore();
  };
  if (p.state === 'roll') {
    // 구르기: 납작하게 돌며 잔상
    const k = 1 - p.stateLeft / 0.28;
    ctx.globalAlpha = 0.25;
    ctx.drawImage(img, Math.round(p.x - p.rollDir.x * 10 - HERO_W / 2), Math.round(footY - HERO_FOOT - p.rollDir.y * 10));
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.translate(Math.round(p.x), Math.round(footY - 12));
    ctx.rotate(k * Math.PI * 2 * (p.rollDir.x < 0 ? -1 : 1));
    ctx.drawImage(img, -HERO_W / 2, -HERO_FOOT + 12);
    ctx.restore();
  } else {
    if (behind) drawWeapon();
    ctx.drawImage(img, Math.round(p.x - HERO_W / 2), Math.round(footY - HERO_FOOT));
    if (!behind) drawWeapon();
  }
  ctx.globalAlpha = 1;
  // 별 위성
  if (hasPower(g, 'orbit')) {
    for (let i = 0; i < 2; i++) {
      const a = time * 5 + i * Math.PI;
      const sx = Math.round(p.x + Math.cos(a) * 30);
      const sy = Math.round(p.y - 4 + Math.sin(a) * 22);
      ctx.fillStyle = '#ffe07a';
      ctx.fillRect(sx - 1, sy - 3, 2, 6);
      ctx.fillRect(sx - 3, sy - 1, 6, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx, sy, 1, 1);
    }
  }
  // 버프 빛
  if (p.buffs.rage > 0 || p.buffs.roar > 0 || p.buffs.swift > 0 || p.buffs.frenzy > 0) {
    const c = p.buffs.rage > 0 || p.buffs.frenzy > 0 ? '255,90,60' : p.buffs.swift > 0 ? '120,220,255' : '255,210,80';
    for (let i = 0; i < 2; i++) {
      const a = time * 5 + i * Math.PI;
      ctx.fillStyle = `rgba(${c},0.8)`;
      ctx.fillRect(Math.round(p.x + Math.cos(a) * 10), Math.round(p.y - 8 + Math.sin(a * 0.7) * 10), 2, 2);
    }
  }
}

// ───────────────────────── 몬스터 ─────────────────────────

function drawMonster(ctx: CanvasRenderingContext2D, m: Monster, w: World, time: number, labels: { x: number; y: number; text: string; color: string; small?: boolean }[]): void {
  const fly = m.def.fly;
  const frame = Math.floor(time * (m.def.ai === 'hopper' ? 3 : 4) + m.id * 0.37) % 2;
  const faceLeft = (m.ai.state === 'chase' || m.ai.state === 'dash' || m.ai.state === 'windup' ? w.player.x - m.x : m.ai.dir.x) < 0;
  const white = w.time - m.hitAt < 0.08;
  const img = monImg(m.def.id, frame, faceLeft, white);
  const foot = m.y + m.r * 0.6;
  let lift = fly ? 10 + Math.sin(time * 4 + m.id) * 3 : 0;
  if (m.def.ai === 'hopper' && m.ai.state === 'hop') lift += Math.abs(Math.sin(m.ai.timer * 8)) * 6;
  // 나타나는 중
  let alpha = 1;
  let rise = 0;
  if (m.spawnLeft > 0) {
    alpha = Math.max(0, 1 - m.spawnLeft / 0.6);
    rise = m.spawnLeft * 10;
  }
  shadow(ctx, m.x, foot, m.r * 0.9, fly ? 0.18 : 0.28);
  ctx.globalAlpha = alpha;
  // 정예 · 수호자 빛
  if (m.rank === 'elite' || m.guardian) {
    ctx.fillStyle = m.guardian ? 'rgba(200,160,255,0.35)' : 'rgba(255,216,74,0.35)';
    ctx.beginPath();
    ctx.ellipse(Math.round(m.x), Math.round(foot), m.r * 1.4, m.r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // 힘 모으기: 떨림
  const windup = m.ai.state === 'windup' || m.boss?.step === 'windup';
  const jit = windup ? Math.round(Math.sin(time * 60) * 1) : 0;
  const x = Math.round(m.x - img.width / 2 + jit);
  const y = Math.round(foot - img.height + 2 - lift + rise);
  ctx.drawImage(img, x, y);
  if (windup) {
    ctx.globalAlpha = alpha * (0.35 + Math.sin(time * 30) * 0.15);
    ctx.drawImage(monImg(m.def.id, frame, faceLeft, true), x, y);
  }
  ctx.globalAlpha = 1;
  // 상태
  if (m.status.stun > 0)
    for (let i = 0; i < 3; i++) {
      const a = time * 6 + (i * Math.PI * 2) / 3;
      ctx.fillStyle = '#ffe04a';
      ctx.fillRect(Math.round(m.x + Math.cos(a) * 7), Math.round(y - 3 + Math.sin(a) * 2), 2, 2);
    }
  if (m.status.burnLeft > 0 && Math.floor(time * 10 + m.id) % 3 === 0) {
    ctx.fillStyle = '#ff8a3a';
    ctx.fillRect(Math.round(m.x + Math.sin(time * 13 + m.id) * m.r * 0.6), Math.round(y + img.height * 0.3 - ((time * 20) % 8)), 2, 2);
  }
  if (m.status.slowLeft > 0) {
    ctx.fillStyle = 'rgba(122,208,255,0.35)';
    ctx.fillRect(x, y + img.height - 4, img.width, 3);
  }
  // 체력 (맞은 적만 · 보스는 화면 위에)
  if (!m.boss && (m.hp < m.maxHp || m.rank === 'elite' || m.guardian)) {
    const bw = Math.max(16, Math.round(m.r * 2));
    const bx = Math.round(m.x - bw / 2);
    const by = y - 5;
    ctx.fillStyle = '#1c1424';
    ctx.fillRect(bx - 1, by - 1, bw + 2, 4);
    ctx.fillStyle = '#4a2a3a';
    ctx.fillRect(bx, by, bw, 2);
    ctx.fillStyle = m.rank === 'elite' ? '#ffd84a' : m.guardian ? '#c8a0ff' : '#ff5a6a';
    ctx.fillRect(bx, by, Math.max(1, Math.round((bw * m.hp) / m.maxHp)), 2);
    if (m.rank === 'elite' || m.guardian) labels.push({ x: m.x, y: by - 6, text: `${m.guardian ? '수호자 ' : '정예 '}${m.name}`, color: m.guardian ? '#d8c0ff' : '#ffd84a', small: true });
  }
}

// ───────────────────────── 탄 ─────────────────────────

function drawProjectile(ctx: CanvasRenderingContext2D, pr: Projectile, time: number): void {
  const x = Math.round(pr.x);
  const y = Math.round(pr.y) - 6;
  const ang = Math.atan2(pr.vy, pr.vx);
  shadow(ctx, pr.x, pr.y + 2, 3, 0.18);
  ctx.save();
  ctx.translate(x, y);
  switch (pr.kind) {
    case 'arrow': {
      ctx.rotate(ang);
      ctx.fillStyle = '#8a5a32';
      ctx.fillRect(-8, -0.5, 10, 1);
      ctx.fillStyle = '#e8eef8';
      ctx.fillRect(2, -1, 3, 2);
      ctx.fillStyle = '#ff8ab8';
      ctx.fillRect(-9, -1.5, 3, 1);
      ctx.fillRect(-9, 0.5, 3, 1);
      break;
    }
    case 'axe': {
      ctx.rotate(time * 18);
      const ws = heroImg('waxe', () => weaponSprite('axe'));
      ctx.drawImage(ws, -ws.width / 2, -ws.height / 2);
      break;
    }
    case 'bomb':
      ctx.fillStyle = '#3a3a4a';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = Math.floor(time * 16) % 2 ? '#ffd84a' : '#ff6a3a';
      ctx.fillRect(2, -5, 2, 2);
      break;
    default: {
      const COL: Record<string, [string, string]> = {
        orb: ['#c890ff', '#ffffff'],
        fireball: ['#ff7a3a', '#ffe07a'],
        spit: ['#7ad070', '#e0ffd0'],
        bolt: ['#ffd84a', '#ffffff'],
        jellyShot: ['#ff7ab8', '#ffe0f0'],
        dustShot: ['#8a6ad0', '#e0d0ff'],
      };
      const [c1, c2] = COL[pr.kind] ?? (pr.from === 'monster' ? ['#ff6a8a', '#ffe0e8'] : ['#ffffff', '#ffffff']);
      const r = pr.r;
      // 꼬리
      ctx.rotate(ang);
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = c1;
      ctx.fillRect(-r * 2.4, -r * 0.5, r * 2, r);
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.arc(0.5, -0.5, r * 0.5, 0, Math.PI * 2);
      ctx.fill();
      if (pr.from === 'monster') {
        ctx.strokeStyle = 'rgba(40,10,30,0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, r + 0.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

// ───────────────────────── 장판 ─────────────────────────

const HAZ_COLOR: Record<string, string> = {
  frost: '122,208,255',
  rain: '160,240,140',
  meteor: '255,140,60',
  slam: '255,200,90',
  quake: '255,120,80',
  leap: '200,230,255',
  thunder: '255,240,120',
};

const ENEMY_HAZ: Record<string, string> = { dustRain: '170,120,255', fireTrail: '255,140,60', frostNova: '122,208,255', dashLine: '255,200,90', aim: '255,110,130' };

function drawHazard(ctx: CanvasRenderingContext2D, h: Hazard, time: number): void {
  const enemy = h.from === 'monster';
  const rgb = enemy ? (ENEMY_HAZ[h.kind] ?? '255,70,90') : (HAZ_COLOR[h.kind] ?? '255,255,255');
  if (h.shape.type === 'circle') {
    const { x, y, r } = h.shape;
    if (h.delay > 0) {
      // 예고: 테두리 + 차오르는 원
      const k = 1 - h.delay / Math.max(0.01, h.telegraph);
      ctx.fillStyle = `rgba(${rgb},${enemy ? 0.18 : 0.12})`;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(${rgb},${enemy ? 0.3 : 0.2})`;
      ctx.beginPath();
      ctx.ellipse(x, y, r * k, r * k * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(${rgb},0.85)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.75, 0, 0, Math.PI * 2);
      ctx.stroke();
      // 떨어지는 것 (운석 · 미사일 · 먼지비)
      if (h.kind === 'meteor' || h.kind === 'missile' || h.kind === 'dustRain') {
        const fall = (1 - k) * 120;
        ctx.fillStyle = h.kind === 'meteor' ? '#ff8a3a' : h.kind === 'missile' ? '#c8d2dc' : '#a888ff';
        ctx.beginPath();
        ctx.arc(x + fall * 0.4, y - fall, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,230,160,0.6)';
        ctx.fillRect(x + fall * 0.4 + 2, y - fall - 8, 2, 6);
      }
    } else if (h.life > 0) {
      // 남아 있는 장판
      const pulse = 0.18 + Math.sin(time * 6 + h.id) * 0.05;
      ctx.fillStyle = `rgba(${rgb},${pulse})`;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(${rgb},0.9)`;
      const n = h.kind === 'rain' ? 8 : 5;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + h.id;
        const rr = r * (0.2 + ((i * 37 + Math.floor(time * 8)) % 10) / 12);
        const px = x + Math.cos(a) * rr;
        const py = y + Math.sin(a) * rr * 0.75;
        if (h.kind === 'rain') ctx.fillRect(Math.round(px), Math.round(py - ((time * 120 + i * 13) % 14)), 1, 5);
        else ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
      }
    }
  } else {
    const { x1, y1, x2, y2, w } = h.shape;
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const len = Math.hypot(x2 - x1, y2 - y1);
    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(ang);
    if (h.delay > 0) {
      const k = 1 - h.delay / Math.max(0.01, h.telegraph);
      ctx.fillStyle = `rgba(${rgb},0.16)`;
      ctx.fillRect(0, -w / 2, len, w);
      ctx.fillStyle = `rgba(${rgb},0.3)`;
      ctx.fillRect(0, -w / 2, len * k, w);
      ctx.fillStyle = `rgba(${rgb},0.9)`;
      ctx.fillRect(0, -w / 2, len, 1);
      ctx.fillRect(0, w / 2 - 1, len, 1);
    } else {
      ctx.fillStyle = `rgba(${rgb},0.55)`;
      ctx.fillRect(0, -w / 2, len, w);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillRect(0, -w / 4, len, w / 2);
    }
    ctx.restore();
  }
}

// ───────────────────────── 떨어진 물건 ─────────────────────────

function drawDrop(ctx: CanvasRenderingContext2D, d: Drop, time: number, labels: Label[]): void {
  const pop = d.age < 0.4 ? Math.sin((d.age / 0.4) * Math.PI) * 10 : 0;
  const bob = d.age >= 0.4 ? Math.round(Math.sin(time * 4 + d.id) * 1.5) : 0;
  let icon: Pix;
  if (d.kind === 'gold') icon = goldIcon();
  else if (d.kind === 'potion') icon = potionIcon(d.potion ?? 'hp');
  else if (d.kind === 'mat') icon = matIcon(d.mat ?? 'fluff');
  else icon = itemIcon(d.item!.slot, d.item!.rarity, d.item!.hero ? CLASSES[d.item!.hero].weapon : 'sword');
  shadow(ctx, d.x, d.y + 4, 5, 0.25);
  if (d.kind === 'item' && d.item && d.item.rarity !== 'normal') {
    // 등급 빛기둥
    const c = RARITY_COLOR[d.item.rarity];
    ctx.globalAlpha = 0.25 + Math.sin(time * 4 + d.id) * 0.1;
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(d.x) - 2, Math.round(d.y) - 30, 4, 30);
    ctx.globalAlpha = 1;
    labels.push({ x: d.x, y: d.y - 18, text: d.item.name, color: c, small: true });
  }
  const s = d.kind === 'gold' ? 0.75 : 1;
  ctx.drawImage(pixCanvas(icon), Math.round(d.x - 8 * s), Math.round(d.y - 12 * s - pop + bob), 16 * s, 16 * s);
}

// ───────────────────────── 효과 ─────────────────────────

function drawFx(ctx: CanvasRenderingContext2D, fx: Fx): void {
  for (const r of fx.rings) {
    const k = 1 - r.life / r.max;
    ctx.globalAlpha = (1 - k) * 0.9;
    if (r.fill) {
      ctx.fillStyle = r.color;
      ctx.globalAlpha = (1 - k) * 0.5;
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, r.r * (0.5 + k * 0.5), r.r * (0.5 + k * 0.5) * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(r.x, r.y, r.r * (0.6 + k * 0.6), r.r * (0.6 + k * 0.6) * 0.75, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // 베기 자국: 초승달
  for (const s of fx.swings) {
    const k = 1 - s.life / s.max;
    const a0 = s.ang - s.arc / 2;
    const a1 = s.ang + s.arc / 2;
    const sweep = Math.min(1, k * 2.2);
    const from = s.rev ? a1 - (a1 - a0) * sweep : a0;
    const to = s.rev ? a1 : a0 + (a1 - a0) * sweep;
    ctx.globalAlpha = Math.max(0, 1 - k) * 0.95;
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.reach, from, to);
    ctx.arc(s.x + Math.cos(s.ang) * 4, s.y + Math.sin(s.ang) * 4, s.reach * 0.72, to, from, true);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const b of fx.bolts) {
    ctx.globalAlpha = b.life / b.max;
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(b.pts[0].x, b.pts[0].y - 6);
    for (const q of b.pts) ctx.lineTo(q.x, q.y - 6);
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (const p of fx.particles) {
    ctx.globalAlpha = Math.min(1, (p.life / p.max) * 1.5);
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(p.x), Math.round(p.y - p.z), p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

// ───────────────────────── 어둠 ─────────────────────────

let darkCanvas: HTMLCanvasElement | null = null;

function drawDark(ctx: CanvasRenderingContext2D, g: Game, ox: number, oy: number, vw: number, vh: number, time: number): void {
  if (!darkCanvas) darkCanvas = document.createElement('canvas');
  if (darkCanvas.width !== vw || darkCanvas.height !== vh) {
    darkCanvas.width = vw;
    darkCanvas.height = vh;
  }
  const d = darkCanvas.getContext('2d')!;
  d.globalCompositeOperation = 'source-over';
  d.clearRect(0, 0, vw, vh);
  d.fillStyle = g.world.map.theme === 'rift' ? 'rgba(10,4,24,0.62)' : 'rgba(8,4,2,0.72)';
  d.fillRect(0, 0, vw, vh);
  d.globalCompositeOperation = 'destination-out';
  const hole = (x: number, y: number, r: number, a = 1) => {
    const gr = d.createRadialGradient(x, y, r * 0.2, x, y, r);
    gr.addColorStop(0, `rgba(0,0,0,${a})`);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    d.fillStyle = gr;
    d.fillRect(x - r, y - r, r * 2, r * 2);
  };
  const p = g.world.player;
  hole(p.x + ox, p.y + oy - 6, 120 + Math.sin(time * 3) * 3);
  for (const l of lights) {
    const x = l.x + ox;
    const y = l.y + oy;
    if (x < -l.r || y < -l.r || x > vw + l.r || y > vh + l.r) continue;
    hole(x, y, l.r * (0.95 + Math.sin(time * 2 + l.x) * 0.05), 0.8);
  }
  for (const pr of g.world.projectiles) if (pr.kind === 'fireball' || pr.kind === 'orb') hole(pr.x + ox, pr.y + oy, 40, 0.8);
  for (const h of g.world.hazards) if (h.shape.type === 'circle' && h.from === 'player') hole(h.shape.x + ox, h.shape.y + oy, h.shape.r * 1.2, 0.6);
  for (const m of g.world.monsters) if (m.boss && m.hp > 0) hole(m.x + ox, m.y + oy, 70, 0.7);
  if (g.world.rift?.portal) hole(g.world.rift.portal.x + ox, g.world.rift.portal.y + oy, 80, 0.9);
  ctx.drawImage(darkCanvas, 0, 0);
}
