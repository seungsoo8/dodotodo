/**
 * 분위기 그리기 (캔버스): 움직이는 부분(추 · 바늘 · 창유리 날씨 · 커튼 자락 · 물방울), 파티클, 계단 디더 빛 가면,
 * 창 빛 웅덩이에 흔들리는 나뭇가지 그림자. 계산은 particles.ts · lightBake.ts · nightClock.ts 에.
 */
import { hash2 } from '../art/paint.ts';
import type { LivePart } from './housePlan.ts';
import { lightMask } from './lightBake.ts';
import type { Pool, RGB } from './light.ts';
import { poolPanes } from './light.ts';
import { ParticlePool, weatherRate, type Weather } from './particles.ts';

const css = (c: number, a = 1) => `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;

// ───────────────────────── 빛 가면 (계단 + 디더) ─────────────────────────

const MASKS = new Map<string, HTMLCanvasElement>();

/** 반지름 r · 색 color 의 빛 그림 (한 번 굽는다). 반지름은 4px 단위로 묶어 캐시를 줄인다 */
export function lightSprite(r: number, color: RGB): HTMLCanvasElement {
  const R = Math.max(4, Math.round(r / 4) * 4);
  const key = `${R}:${color.join(',')}`;
  let c = MASKS.get(key);
  if (c) return c;
  const m = lightMask(R);
  c = document.createElement('canvas');
  c.width = c.height = m.size;
  const d = c.getContext('2d')!;
  const img = d.createImageData(m.size, m.size);
  for (let i = 0; i < m.data.length; i++) {
    const v = m.data[i];
    img.data[i * 4] = color[0];
    img.data[i * 4 + 1] = color[1];
    img.data[i * 4 + 2] = color[2];
    img.data[i * 4 + 3] = Math.round(v * 255);
  }
  d.putImageData(img, 0, 0);
  MASKS.set(key, c);
  return c;
}

// ───────────────────────── 창 빛 웅덩이의 나뭇가지 그림자 ─────────────────────────

/** 달빛 웅덩이 위로 창밖 나뭇가지 그림자가 천천히 흔들린다 (빛 캔버스에 어둠 색으로 덧칠) */
export function poolBranches(d: CanvasRenderingContext2D, pools: readonly Pool[], ambient: RGB, ox: number, oy: number, time: number): void {
  d.save();
  d.globalCompositeOperation = 'source-over';
  d.strokeStyle = `rgba(${ambient[0]},${ambient[1]},${ambient[2]},0.55)`;
  d.lineWidth = 2;
  for (const p of pools) {
    if (!p.moon) continue;
    d.save();
    d.beginPath();
    for (const q of poolPanes(p)) {
      d.moveTo(q[0][0] + ox, q[0][1] + oy);
      for (let i = 1; i < 4; i++) d.lineTo(q[i][0] + ox, q[i][1] + oy);
      d.closePath();
    }
    d.clip();
    const sway = Math.sin(time * 0.7 + p.x * 0.01) * 3 + Math.sin(time * 1.9) * 1;
    // 굵은 가지 하나 + 잔가지 셋 (웅덩이 오른쪽 위에서 비스듬히)
    const x0 = p.x + p.w * 0.75 + ox;
    const y0 = p.y + oy;
    d.beginPath();
    d.moveTo(x0 + sway * 0.3, y0);
    const xm = x0 - p.w * 0.35 + sway;
    const ym = y0 + p.h * 0.55;
    d.quadraticCurveTo(x0 - p.w * 0.1 + sway * 0.6, y0 + p.h * 0.3, xm, ym);
    d.stroke();
    d.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const u = 0.25 + i * 0.22;
      const bx = x0 + (xm - x0) * u;
      const by = y0 + (ym - y0) * u;
      const s2 = sway * (1.2 + i * 0.3);
      d.beginPath();
      d.moveTo(bx, by);
      d.lineTo(bx - 6 - i * 2 + s2, by + 4 + i);
      d.stroke();
      // 잎 몇 장
      d.fillStyle = d.strokeStyle;
      d.fillRect(Math.round(bx - 7 - i * 2 + s2), Math.round(by + 4 + i), 2, 2);
    }
    d.lineWidth = 2;
    d.restore();
  }
  d.restore();
}

// ───────────────────────── 움직이는 부분 ─────────────────────────

/** 시계 바늘: minutes = 이어지는 분 (23:10 = 1390) */
function hands(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, minutes: number): void {
  const m = minutes % 60;
  const h = (minutes / 60) % 12;
  const line = (ang: number, len: number, w: number) => {
    const ex = x + Math.sin(ang) * len;
    const ey = y - Math.cos(ang) * len;
    const n = Math.max(1, Math.ceil(len));
    for (let i = 0; i <= n; i++) ctx.fillRect(Math.round(x + ((ex - x) * i) / n - (w > 1 ? 0.5 : 0)), Math.round(y + ((ey - y) * i) / n), w, 1);
  };
  ctx.fillStyle = '#2a1c24';
  line((h / 12) * Math.PI * 2, r * 0.55, 1);
  line((m / 60) * Math.PI * 2, r * 0.85, 1);
}

export interface LiveCtx {
  time: number;
  /** 시계가 가리킬 시각 (이어지는 분) */
  minutes: number;
  weather: Weather | null;
  pool: ParticlePool;
  dt: number;
}

/** 움직이는 부분을 세계 좌표 ctx 에 (벽 · 가구에 붙은 것이라 인물보다 먼저 그린다) */
export function drawLive(ctx: CanvasRenderingContext2D, parts: readonly LivePart[], L: LiveCtx): void {
  const { time } = L;
  for (const p of parts) {
    switch (p.kind) {
      case 'pendulum': {
        // 2초에 한 번 왕복, 끝에서 잠깐 머무는 진자
        const a = Math.sin(time * Math.PI) * 0.3;
        const len = p.len ?? 10;
        const ex = p.x + Math.sin(a) * len;
        const ey = p.y + Math.cos(a) * len;
        ctx.fillStyle = '#8a7040';
        for (let i = 0; i <= len; i++) ctx.fillRect(Math.round(p.x + ((ex - p.x) * i) / len), Math.round(p.y + ((ey - p.y) * i) / len), 1, 1);
        const r = p.r ?? 2.5;
        ctx.fillStyle = '#2a1c24';
        ctx.beginPath();
        ctx.arc(Math.round(ex) + 0.5, Math.round(ey) + 0.5, r + 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e8c060';
        ctx.beginPath();
        ctx.arc(Math.round(ex) + 0.5, Math.round(ey) + 0.5, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff0b0';
        ctx.fillRect(Math.round(ex - r * 0.4), Math.round(ey - r * 0.4), 1, 1);
        break;
      }
      case 'hands':
        hands(ctx, p.x, p.y, p.r ?? 4, L.minutes);
        break;
      case 'pane': {
        const w = p.w ?? 0;
        const h = p.h ?? 0;
        ctx.save();
        ctx.beginPath();
        ctx.rect(p.x, p.y, w, h);
        ctx.clip();
        const sky = p.sky ?? '';
        const wet = sky === 'rain' || L.weather === 'rain' || L.weather === 'drizzle';
        const snow = sky === 'snow' || L.weather === 'snow';
        if (wet) {
          // 유리를 타고 내리는 빗줄기 + 맺힌 물방울
          ctx.fillStyle = 'rgba(214,228,244,0.75)';
          for (let i = 0; i < 9; i++) {
            const sp = 30 + hash2(i, 2, 3) * 40;
            const x = p.x + 1 + Math.floor(hash2(i, p.x, 5) * (w - 2));
            const y = p.y + ((hash2(i, 7, p.y) * (h + 6) + time * sp) % (h + 6)) - 3;
            ctx.fillRect(x, Math.round(y), 1, 3);
          }
          ctx.fillStyle = 'rgba(230,240,250,0.6)';
          for (let i = 0; i < 4; i++) {
            const slow = (hash2(i, 9, p.x) * h + time * (2 + i)) % h;
            ctx.fillRect(p.x + Math.floor(hash2(i, 4, p.y) * (w - 2)), Math.round(p.y + slow), 1, 1);
          }
        } else if (snow) {
          ctx.fillStyle = 'rgba(244,248,252,0.95)';
          for (let i = 0; i < 10; i++) {
            const sp = 6 + hash2(i, 3, 1) * 8;
            const y = p.y + ((hash2(i, 1, p.y) * h + time * sp) % h);
            const x = p.x + ((hash2(i, 5, p.x) * w + Math.sin(time * 1.3 + i) * 2 + w) % w);
            ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
          }
        } else if (sky === 'night' || sky === 'dusk') {
          // 달 앞을 천천히 지나는 구름 한 줄기 (6초에 1px)
          const cw = Math.max(10, w * 0.6);
          const cx = p.x - cw + ((time / 6) % (w + cw));
          ctx.fillStyle = sky === 'night' ? 'rgba(120,128,180,0.55)' : 'rgba(255,214,180,0.5)';
          ctx.fillRect(Math.round(cx), Math.round(p.y + h * 0.28), Math.round(cw), 2);
          ctx.fillRect(Math.round(cx + cw * 0.2), Math.round(p.y + h * 0.28 - 1), Math.round(cw * 0.5), 1);
        }
        ctx.restore();
        break;
      }
      case 'curtain': {
        // 커튼 아랫단이 숨처럼 살짝 (바람 · 사람이 지나간 뒤)
        const h = p.h ?? 0;
        const sway = Math.sin(time * 0.9 + (p.side === 'l' ? 0 : 1.7)) * 1.4;
        const dx = Math.round(sway);
        if (!dx) break;
        const c = p.color ?? 0xb08898;
        const edge = p.side === 'l' ? p.x + (p.w ?? 6) : p.x - 1;
        ctx.fillStyle = css(c);
        const y0 = p.y + Math.round(h * 0.55);
        for (let y = y0; y < p.y + h; y++) {
          const k = (y - y0) / (p.y + h - y0);
          const off = Math.round(dx * k);
          if (!off) continue;
          const toward = p.side === 'l' ? off : -off;
          if (toward > 0) ctx.fillRect(p.side === 'l' ? edge : edge - toward + 1, y, toward, 1);
        }
        break;
      }
      case 'drip':
        // 1.5 ~ 4초에 한 방울
        if (L.dt > 0 && Math.random() < L.dt / 2.6) L.pool.emit('drip', p.x, p.y, 0, 0, 2, p.y + (p.len ?? 5));
        break;
    }
  }
}

// ───────────────────────── 파티클 ─────────────────────────

/** 화면에 날씨 파티클을 내보낸다 (세계 좌표, 카메라 둘레). 실외(outdoor) 만: 실내 날씨는 창유리(pane) 가 맡는다 */
export function spawnWeather(pool: ParticlePool, w: Weather | null, cam: { x: number; y: number }, vw: number, vh: number, dt: number, time: number): void {
  if (!w || dt <= 0) return;
  const want = weatherRate(w, vw * vh) * dt;
  let n = Math.floor(want);
  if (hash2(time * 60, 3, 7) < want - n) n++;
  for (let i = 0; i < n; i++) {
    const u = hash2(time * 97 + i, 11, 13);
    const v = hash2(time * 53 + i, 17, 19);
    const x = cam.x + u * (vw + 40) - 20;
    // 땅에 닿는 자리: 화면 안 어딘가 (위에서 떨어지기 시작)
    const floor = cam.y + 20 + v * (vh - 20);
    if (w === 'snow') {
      const far = v < 0.45;
      pool.emit('snow', x, cam.y - 6, far ? -3 : -6, far ? 10 : 18 + u * 8, 30, floor);
    } else {
      const drop = pool.emit('rain', x, cam.y - 10 - v * 40, -30, w === 'drizzle' ? 150 : 230, 3, floor);
      drop.seed = u;
    }
  }
}

/** 파티클 그리기 (세계 좌표). onlyWeather: 빛 다음에 그리는 비 · 눈 · 튄 물만, 아니면 나머지 */
export function drawParticles(ctx: CanvasRenderingContext2D, pool: ParticlePool, cam: { x: number; y: number }, vw: number, vh: number, onlyWeather: boolean): void {
  for (const p of pool.list()) {
    const weather = p.kind === 'rain' || p.kind === 'snow' || p.kind === 'splash';
    if (weather !== onlyWeather) continue;
    if (p.x < cam.x - 8 || p.x > cam.x + vw + 8 || p.y < cam.y - 50 || p.y > cam.y + vh + 8) continue;
    const a = p.fade();
    const x = Math.round(p.x);
    const y = Math.round(p.y);
    switch (p.kind) {
      case 'rain':
        ctx.fillStyle = 'rgba(196,214,240,0.5)';
        ctx.fillRect(x, y - 5, 1, 5);
        ctx.fillRect(x + 1, y - 7, 1, 2);
        break;
      case 'snow': {
        const far = Math.abs(p.vx) < 4;
        ctx.fillStyle = far ? 'rgba(220,228,244,0.55)' : 'rgba(248,250,255,0.92)';
        ctx.fillRect(x, y, far ? 1 : 2, far ? 1 : 2);
        break;
      }
      case 'splash':
        ctx.fillStyle = `rgba(214,228,250,${0.7 * a})`;
        ctx.fillRect(x, y, 1, 1);
        break;
      case 'drip':
        ctx.fillStyle = 'rgba(200,226,250,0.9)';
        ctx.fillRect(x, y - 1, 1, 2);
        break;
      case 'steam':
        ctx.fillStyle = `rgba(240,236,228,${0.28 * a})`;
        ctx.fillRect(x - 1, y, 3, 2);
        ctx.fillRect(x, y - 1, 1, 1);
        break;
      case 'dust':
        ctx.fillStyle = `rgba(220,206,190,${0.5 * a})`;
        ctx.fillRect(x, y, 1, 1);
        break;
      case 'sparkle':
        ctx.fillStyle = `rgba(255,240,190,${a})`;
        ctx.fillRect(x, y, 1, 1);
        break;
      case 'mote':
        // 나타났다 사라지는 먼지 (빛 캔버스가 곱해져 어두운 데선 안 보인다)
        ctx.fillStyle = `rgba(255,246,226,${0.75 * Math.sin(a * Math.PI)})`;
        ctx.fillRect(x, y, 1, 1);
        break;
      case 'ripple': {
        const k = 1 - a;
        ctx.strokeStyle = `rgba(214,236,255,${0.55 * a})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(x + 0.5, y + 0.5, 1 + k * 7, 0.5 + k * 3, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      default:
        ctx.fillStyle = `rgba(230,160,170,${a})`;
        ctx.fillRect(x, y, 2, 1);
    }
  }
}
