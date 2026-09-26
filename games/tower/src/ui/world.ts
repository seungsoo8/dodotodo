import { createRng, type Rng } from '../core/rng.ts';
import type { Sky } from './fx.ts';
import { drawSprite } from './kit.ts';
import { PROPS } from './sprites.ts';

interface Tuft {
  x: number;
  y: number;
  h: number;
  color: string;
}

interface Cloud {
  x: number;
  y: number;
  rx: number;
  ry: number;
  speed: number;
}

interface Mote {
  x: number;
  y: number;
  phase: number;
  speed: number;
  color: string;
}

export interface Lights {
  /** 탑 불빛 중심 */
  tower: { x: number; y: number };
  /** 보스가 나와 있으면 핏빛 */
  boss: boolean;
  now: number;
}

/**
 * 전장 배경: 한 번 그려 두는 땅(풀밭·광장·길·나무)과
 * 매 프레임 움직이는 것(풀 흔들림·구름 그림자·나비·반딧불), 낮밤 색.
 */
export class World {
  private ground: HTMLCanvasElement | null = null;
  private tufts: Tuft[] = [];
  private clouds: Cloud[] = [];
  private motes: Mote[] = [];
  private width: number;
  private height: number;
  private cx: number;
  private cy: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.cx = width / 2;
    this.cy = height / 2 + 12;
    const rng = createRng(4242);
    for (let i = 0; i < 220; i++) {
      const x = Math.round(rng.range(4, width - 4));
      const y = Math.round(rng.range(8, height - 4));
      if (this.inPlaza(x, y, 12)) continue;
      this.tufts.push({ x, y, h: 2 + rng.int(3), color: rng.next() < 0.5 ? '#3f7a4e' : '#4a8a58' });
    }
    for (let i = 0; i < 3; i++) {
      this.clouds.push({ x: rng.range(0, width), y: rng.range(40, height - 40), rx: rng.range(70, 120), ry: rng.range(30, 50), speed: rng.range(5, 9) });
    }
    for (let i = 0; i < 28; i++) {
      this.motes.push({
        x: rng.range(0, width),
        y: rng.range(20, height),
        phase: rng.range(0, Math.PI * 2),
        speed: rng.range(0.4, 1),
        color: ['#ffe8a3', '#f7b2d9', '#bfe0ff', '#fff'][rng.int(4)],
      });
    }
  }

  private inPlaza(x: number, y: number, pad = 0): boolean {
    const dx = (x - this.cx) / (62 + pad);
    const dy = (y - this.cy) / (40 + pad);
    return dx * dx + dy * dy < 1;
  }

  // ───────── 한 번 그리는 땅 ─────────

  private buildGround(): HTMLCanvasElement {
    const { width, height, cx, cy } = this;
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const g = c.getContext('2d')!;
    const rng = createRng(7);

    // 풀밭: 바탕 + 큰 얼룩 + 잔 점
    g.fillStyle = '#25442e';
    g.fillRect(0, 0, width, height);
    for (let i = 0; i < 70; i++) {
      const bx = rng.range(0, width);
      const by = rng.range(0, height);
      const r = rng.range(14, 46);
      g.fillStyle = rng.next() < 0.5 ? '#2a4c33' : '#213d2a';
      for (let x = -r; x < r; x += 4) {
        for (let y = -r; y < r; y += 4) {
          if (x * x + y * y < r * r * (0.75 + rng.next() * 0.3)) g.fillRect(Math.round((bx + x) / 4) * 4, Math.round((by + y) / 4) * 4, 4, 4);
        }
      }
    }
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = ['#2f5639', '#1d3826', '#34603f'][rng.int(3)];
      g.fillRect(Math.round(rng.range(0, width)), Math.round(rng.range(0, height)), rng.next() < 0.3 ? 2 : 1, 1);
    }

    // 사방으로 난 흙길 (밟혀서 풀이 벗겨진 자국)
    this.path(g, rng, cx, cy, cx, 0);
    this.path(g, rng, cx, cy, cx, height);
    this.path(g, rng, cx, cy, 0, cy);
    this.path(g, rng, cx, cy, width, cy);

    // 탑 광장: 풀과 섞이는 흙 테두리 + 작고 둥근 자갈 바닥
    for (let i = 0; i < 700; i++) {
      const a = rng.range(0, Math.PI * 2);
      const d = Math.sqrt(rng.next());
      const x = cx + Math.cos(a) * d * 50;
      const y = cy + Math.sin(a) * d * 32;
      g.fillStyle = d > 0.8 ? (rng.next() < 0.5 ? '#2f3a28' : '#3a3a2c') : rng.next() < 0.5 ? '#3f3a30' : '#453e33';
      g.fillRect(Math.round(x), Math.round(y), 2, 2);
    }
    this.blob(g, cx, cy, 38, 24, '#3a342c');
    for (let y = -22; y <= 20; y += 4) {
      const row = Math.round((y + 22) / 4);
      for (let x = -36 + (row % 2) * 3; x <= 34; x += 6) {
        const dx = (x + 2) / 37;
        const dy = (y + 1) / 23;
        if (dx * dx + dy * dy > 1) continue;
        const px = Math.round(cx + x);
        const py = Math.round(cy + y);
        g.fillStyle = ['#6a655c', '#5f5a52', '#726c62', '#5a5048'][rng.int(4)];
        g.fillRect(px + 1, py, 3, 3);
        g.fillRect(px, py + 1, 5, 1);
        g.fillStyle = '#8a8478';
        g.fillRect(px + 1, py, 2, 1);
      }
    }

    // 꽃·버섯·바위·덤불
    for (let i = 0; i < 90; i++) {
      const x = Math.round(rng.range(10, width - 10));
      const y = Math.round(rng.range(20, height - 10));
      if (this.inPlaza(x, y, 10)) continue;
      const r = rng.next();
      if (r < 0.55) {
        g.fillStyle = ['#ffd75e', '#f7b2d9', '#e8e1cf', '#9fd8ff'][rng.int(4)];
        g.fillRect(x, y, 1, 1);
        g.fillRect(x + 2, y + 1, 1, 1);
        g.fillStyle = '#3f7a4e';
        g.fillRect(x, y + 1, 1, 1);
      } else if (r < 0.7) drawSprite(g, PROPS.rock, x, y);
      else if (r < 0.85) drawSprite(g, PROPS.bush, x, y);
      else if (r < 0.93) drawSprite(g, PROPS.mushroom, x, y);
      else drawSprite(g, PROPS.stump, x, y);
    }

    // 가장자리 숲: 나무를 두세 겹 둘러 전장을 감싼다
    const trees: { x: number; y: number; pine: boolean }[] = [];
    const edge = (n: number, place: (t: number, depth: number) => [number, number]) => {
      for (let i = 0; i < n; i++) {
        const [x, y] = place(rng.next(), rng.range(-6, 16));
        trees.push({ x, y, pine: rng.next() < 0.45 });
      }
    };
    edge(34, (t, d) => [t * width, d - 4]);
    edge(34, (t, d) => [t * width, height - d - 8]);
    edge(20, (t, d) => [d - 4, t * height]);
    edge(20, (t, d) => [width - d - 6, t * height]);
    trees.sort((a, b) => a.y - b.y);
    for (const t of trees) {
      const s = t.pine ? PROPS.pine : PROPS.tree;
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.beginPath();
      g.ellipse(t.x + s.width / 2, t.y + s.height - 1, s.width * 0.45, 2, 0, 0, Math.PI * 2);
      g.fill();
      drawSprite(g, s, Math.round(t.x), Math.round(t.y));
    }

    // 가장자리 어둡게
    const grad = g.createRadialGradient(cx, cy, height * 0.32, cx, cy, width * 0.62);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.4)');
    g.fillStyle = grad;
    g.fillRect(0, 0, width, height);
    return c;
  }

  /** 도트 느낌 타원 채우기 */
  private blob(g: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, color: string): void {
    g.fillStyle = color;
    for (let y = -ry; y <= ry; y += 2) {
      const w = rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry)));
      g.fillRect(Math.round(cx - w), Math.round(cy + y), Math.round(w * 2), 2);
    }
  }

  private path(g: CanvasRenderingContext2D, rng: Rng, x0: number, y0: number, x1: number, y1: number): void {
    const len = Math.hypot(x1 - x0, y1 - y0);
    for (let d = 0; d < len; d += 2) {
      const t = d / len;
      const wobble = Math.sin(d * 0.05) * 4;
      const nx = -(y1 - y0) / len;
      const ny = (x1 - x0) / len;
      const x = x0 + (x1 - x0) * t + nx * wobble;
      const y = y0 + (y1 - y0) * t + ny * wobble;
      // 광장에서 멀어질수록 흐려진다
      const fade = 1 - t * 0.7;
      for (let k = -4; k <= 4; k += 2) {
        if (rng.next() > fade * (0.75 - (Math.abs(k) / 4) * 0.45)) continue;
        g.fillStyle = rng.next() < 0.5 ? '#343a2a' : '#30362a';
        g.fillRect(Math.round(x + nx * k), Math.round(y + ny * k), 2, 2);
      }
    }
  }

  // ───────── 매 프레임 ─────────

  /** 땅 + 구름 그림자 + 바람에 흔들리는 풀 */
  drawGround(ctx: CanvasRenderingContext2D, now: number): void {
    this.ground ??= this.buildGround();
    ctx.drawImage(this.ground, 0, 0);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.09)';
    for (const c of this.clouds) {
      const span = this.width + c.rx * 2;
      const x = ((c.x + now * c.speed) % span) - c.rx;
      ctx.beginPath();
      ctx.ellipse(x, c.y, c.rx, c.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const t of this.tufts) {
      // 바람이 왼쪽에서 오른쪽으로 물결치며 지나간다
      const sway = Math.round(Math.sin(now * 1.8 - t.x * 0.03) * 1.2);
      ctx.fillStyle = t.color;
      ctx.fillRect(t.x, t.y - t.h, 1, t.h);
      ctx.fillRect(t.x - 1 + sway, t.y - t.h - 1, 1, 2);
      ctx.fillRect(t.x + 2, t.y - t.h + 1, 1, t.h - 1);
      ctx.fillRect(t.x + 2 + sway, t.y - t.h, 1, 1);
    }
  }

  /** 낮밤 색을 입히고, 밤에는 탑 불빛·반딧불, 낮에는 나비와 햇살 */
  drawSky(ctx: CanvasRenderingContext2D, sky: Sky, lights: Lights): void {
    const { width, height } = this;
    const { now } = lights;
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    if (sky.dusk > 0) {
      ctx.globalAlpha = 0.5 * sky.dusk;
      ctx.fillStyle = '#ffb48a';
      ctx.fillRect(0, 0, width, height);
    }
    if (sky.night > 0) {
      ctx.globalAlpha = 0.65 * sky.night;
      ctx.fillStyle = '#4a5aa8';
      ctx.fillRect(0, 0, width, height);
    }
    if (lights.boss) {
      ctx.globalAlpha = 0.18 + 0.06 * Math.sin(now * 2);
      ctx.fillStyle = '#ff6a6a';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 1;
    const day = 1 - sky.night;
    if (day > 0.2) {
      // 비스듬한 햇살 줄기
      ctx.globalAlpha = 0.035 * day * (1 - sky.dusk * 0.5);
      ctx.fillStyle = '#fff4d0';
      for (let i = 0; i < 4; i++) {
        const x = ((i * 190 + now * 8) % (width + 200)) - 100;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 50, 0);
        ctx.lineTo(x - 70, height);
        ctx.lineTo(x - 120, height);
        ctx.fill();
      }
    }
    if (sky.night > 0 || sky.dusk > 0.3) {
      // 탑 불빛
      const glow = Math.max(sky.night, sky.dusk * 0.4);
      const flicker = 0.9 + 0.1 * Math.sin(now * 9) * Math.sin(now * 3.3);
      const r = 80;
      const g = ctx.createRadialGradient(lights.tower.x, lights.tower.y, 4, lights.tower.x, lights.tower.y, r);
      g.addColorStop(0, `rgba(255, 190, 110, ${0.4 * glow * flicker})`);
      g.addColorStop(1, 'rgba(255, 190, 110, 0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.fillRect(lights.tower.x - r, lights.tower.y - r, r * 2, r * 2);
    }
    // 반딧불 (밤) · 꽃가루 (낮)
    for (const m of this.motes) {
      const x = (m.x + Math.sin(now * m.speed + m.phase) * 14 + now * 3 * m.speed) % width;
      const y = m.y + Math.sin(now * m.speed * 1.3 + m.phase * 2) * 8;
      if (sky.night > 0.15) {
        const blink = 0.5 + 0.5 * Math.sin(now * 3 + m.phase * 5);
        ctx.globalAlpha = sky.night * blink;
        ctx.fillStyle = '#d8ff8a';
        ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
        ctx.globalAlpha = sky.night * blink * 0.35;
        ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
      } else {
        ctx.globalAlpha = 0.35 * day;
        ctx.fillStyle = m.color;
        ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
      }
    }
    ctx.restore();
    if (day > 0.3) this.drawButterflies(ctx, now, day);
  }

  private drawButterflies(ctx: CanvasRenderingContext2D, now: number, alpha: number): void {
    const colors = ['#ffd75e', '#f7b2d9', '#9fd8ff'];
    ctx.globalAlpha = alpha;
    for (let i = 0; i < 3; i++) {
      const t = now * 0.25 + i * 2.1;
      const x = this.width * (0.2 + 0.3 * i) + Math.sin(t) * 60 + Math.sin(t * 2.7) * 10;
      const y = this.height * (0.3 + 0.2 * ((i + 1) % 3)) + Math.cos(t * 1.3) * 30;
      const open = Math.floor(now * 10 + i) % 2 === 0;
      ctx.fillStyle = colors[i];
      if (open) {
        ctx.fillRect(Math.round(x) - 2, Math.round(y) - 1, 2, 2);
        ctx.fillRect(Math.round(x) + 1, Math.round(y) - 1, 2, 2);
      } else {
        ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 1, 2);
        ctx.fillRect(Math.round(x) + 1, Math.round(y) - 1, 1, 2);
      }
      ctx.fillStyle = '#1b1522';
      ctx.fillRect(Math.round(x), Math.round(y) - 1, 1, 2);
    }
    ctx.globalAlpha = 1;
  }
}
