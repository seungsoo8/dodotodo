import { createRng } from '../core/rng.ts';
import type { GameEvent, Point, WeaponType } from '../core/types.ts';
import { easeOutBack, easeOutCubic, formatNumber, lerp, lightningPath, projectilePos, shakeOffset } from './fx.ts';
import { C, FONT, TYPE_INFO } from './kit.ts';

type Style = 'dagger' | 'arrow' | 'bomb' | 'frost' | 'chaos';

interface Fx {
  kind: 'projectile' | 'lightning' | 'explosion' | 'particle' | 'number' | 'coin' | 'puff' | 'glow' | 'ring' | 'flash';
  /** 시작 시각. 미래면 그때까지 보이지 않는다 (착탄 후 폭발 등) */
  born: number;
  life: number;
  color: string;
  from?: Point;
  to?: Point;
  at?: Point;
  vel?: Point;
  gravity?: number;
  size?: number;
  radius?: number;
  arc?: number;
  style?: Style;
  text?: string;
  crit?: boolean;
  seed?: number;
}

interface Shake {
  intensity: number;
  start: number;
  dur: number;
  seed: number;
}

const MAX_FX = 900;
const MAX_NUMBERS = 50;

/** 화면 연출 효과 모음. 게임 로직과는 무관하게 시간(now)으로만 움직인다. */
export class Effects {
  private list: Fx[] = [];
  private shakes: Shake[] = [];
  private rng = createRng(20260926);
  private seq = 0;
  now = 0;
  /** 코인이 HUD 에 도착해 골드 숫자가 튀는 시각 */
  goldBumpAt = -1;
  /** 날아간 코인이 도착하는 HUD 위치 */
  coinTarget: Point = { x: 0, y: 0 };

  private add(fx: Omit<Fx, 'born'> & { born?: number }): void {
    this.list.push({ ...fx, born: fx.born ?? this.now });
  }

  update(now: number): void {
    this.now = now;
    this.list = this.list.filter((f) => now - f.born < f.life);
    if (this.list.length > MAX_FX) this.list.splice(0, this.list.length - MAX_FX);
    const numbers = this.list.filter((f) => f.kind === 'number');
    if (numbers.length > MAX_NUMBERS) {
      const drop = new Set(numbers.slice(0, numbers.length - MAX_NUMBERS));
      this.list = this.list.filter((f) => !drop.has(f));
    }
    this.shakes = this.shakes.filter((s) => now - s.start < s.dur);
  }

  shake(intensity: number, dur: number): void {
    this.shakes.push({ intensity, start: this.now, dur, seed: this.seq++ });
  }

  shakeOffset(): Point {
    let x = 0;
    let y = 0;
    for (const s of this.shakes) {
      const o = shakeOffset(s.intensity, this.now - s.start, s.dur, s.seed);
      x += o.x;
      y += o.y;
    }
    return { x: Math.round(x), y: Math.round(y) };
  }

  // ───────── 게임 이벤트 → 효과 ─────────

  /** 발사: 공격 방식에 맞는 투사체·번개 */
  shot(ev: Extract<GameEvent, { kind: 'shot' }>, towerTop: Point): void {
    const color = TYPE_INFO[ev.weaponType].color;
    const dist = Math.hypot(ev.to.x - ev.from.x, ev.to.y - ev.from.y);
    const isFromTower = Math.abs(ev.from.x - towerTop.x) < 1 && ev.from.y >= towerTop.y;
    const from = isFromTower ? towerTop : ev.from;
    if (isFromTower) this.add({ kind: 'glow', at: towerTop, color, life: 0.12, radius: 7 });

    if (ev.behavior === 'chain') {
      this.add({ kind: 'lightning', from, to: ev.to, color, life: 0.2, seed: this.seq++ });
      this.sparks(ev.to, color, 4);
      return;
    }
    const styles: Record<WeaponType, Style> = { normal: 'dagger', pierce: 'arrow', magic: 'frost', siege: 'bomb', chaos: 'chaos' };
    const style = ev.behavior === 'pierce' ? 'arrow' : ev.behavior === 'splash' ? 'bomb' : styles[ev.weaponType];
    const speed = { dagger: 700, arrow: 1100, bomb: 380, frost: 550, chaos: 520 }[style];
    const life = Math.max(0.06, dist / speed);
    const arc = style === 'bomb' ? Math.min(45, dist * 0.35) : 0;
    this.add({ kind: 'projectile', from, to: ev.to, color, life, arc, style, seed: this.seq++ });
  }

  /** 광역 폭발 (투사체가 도착하는 시각에 맞춰 늦게 시작) */
  explosion(at: Point, radius: number, delay: number): void {
    const born = this.now + delay;
    this.add({ kind: 'explosion', at, radius, color: TYPE_INFO.siege.color, life: 0.35, born });
    for (let i = 0; i < 10; i++) {
      const a = this.rng.range(0, Math.PI * 2);
      const v = this.rng.range(40, 110);
      this.add({
        kind: 'particle',
        at,
        vel: { x: Math.cos(a) * v, y: Math.sin(a) * v - 40 },
        gravity: 220,
        size: this.rng.next() < 0.3 ? 3 : 2,
        color: this.rng.next() < 0.5 ? '#ffd75e' : '#ff6b35',
        life: 0.5,
        born,
      });
    }
    this.shakeLater(1.5, 0.12, delay);
  }

  private shakeLater(intensity: number, dur: number, delay: number): void {
    this.shakes.push({ intensity, start: this.now + delay, dur, seed: this.seq++ });
  }

  hit(at: Point, amount: number, crit: boolean, color: string): void {
    this.sparks(at, crit ? '#ffffff' : color, crit ? 5 : 2);
    if (amount < 1) return;
    this.add({
      kind: 'number',
      at: { x: at.x + this.rng.range(-4, 4), y: at.y - 6 },
      text: crit ? `${formatNumber(amount)}!` : formatNumber(amount),
      crit,
      color: crit ? '#ff6b6b' : '#f4f1e8',
      life: crit ? 0.8 : 0.55,
    });
  }

  private sparks(at: Point, color: string, n: number): void {
    for (let i = 0; i < n; i++) {
      const a = this.rng.range(0, Math.PI * 2);
      const v = this.rng.range(30, 80);
      this.add({ kind: 'particle', at, vel: { x: Math.cos(a) * v, y: Math.sin(a) * v }, size: 1, color, life: 0.22 });
    }
  }

  kill(at: Point, bounty: number, big: boolean): void {
    for (let i = 0; i < (big ? 8 : 4); i++) {
      const a = this.rng.range(0, Math.PI * 2);
      const d = this.rng.range(2, big ? 12 : 6);
      this.add({
        kind: 'puff',
        at: { x: at.x + Math.cos(a) * d, y: at.y + Math.sin(a) * d },
        radius: this.rng.range(3, big ? 9 : 5),
        color: '#b8bccb',
        life: this.rng.range(0.3, 0.5),
      });
    }
    // 코인이 HUD 골드로 날아간다
    const life = 0.55;
    this.add({ kind: 'coin', from: at, to: this.coinTarget, color: C.gold, life, text: `+${Math.round(bounty)}` });
    this.goldBumpAt = this.now + life;
    if (big) this.shake(4, 0.35);
  }

  ring(at: Point, radius: number, color: string, life = 0.6): void {
    this.add({ kind: 'ring', at, radius, color, life });
  }

  /** 화면 전체 번쩍임 */
  flash(color: string, life = 0.15): void {
    this.add({ kind: 'flash', color, life });
  }

  /** 반짝이 한 점 (정예 주변, 얼음 등) */
  sparkle(at: Point, color: string): void {
    this.add({ kind: 'particle', at, vel: { x: this.rng.range(-8, 8), y: this.rng.range(-25, -10) }, size: 1, color, life: 0.5 });
  }

  /** 불꽃놀이 한 발 (승리 화면) */
  firework(at: Point): void {
    const colors = ['#ffd75e', '#6fb7ff', '#8fd16a', '#c77dff', '#ff9d4d', '#ff6b6b'];
    const color = colors[this.rng.int(colors.length)];
    for (let i = 0; i < 24; i++) {
      const a = (Math.PI * 2 * i) / 24;
      const v = this.rng.range(50, 90);
      this.add({ kind: 'particle', at, vel: { x: Math.cos(a) * v, y: Math.sin(a) * v }, gravity: 60, size: 2, color, life: 1 });
    }
  }

  /** 도트 그림을 조각내 흩뿌린다 (탑 붕괴) */
  shatter(pixels: { x: number; y: number; color: string }[], origin: Point): void {
    for (const p of pixels) {
      if (this.rng.next() < 0.5) continue;
      this.add({
        kind: 'particle',
        at: { x: origin.x + p.x, y: origin.y + p.y },
        vel: { x: this.rng.range(-60, 60), y: this.rng.range(-90, -10) },
        gravity: 260,
        size: 2,
        color: p.color,
        life: this.rng.range(0.8, 1.4),
      });
    }
  }

  // ───────── 그리기 ─────────

  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    for (const f of this.list) {
      const age = this.now - f.born;
      if (age < 0) continue;
      const p = age / f.life;
      ctx.globalAlpha = 1;
      switch (f.kind) {
        case 'projectile':
          this.drawProjectile(ctx, f, p);
          break;
        case 'lightning':
          this.drawLightning(ctx, f, p);
          break;
        case 'explosion': {
          const r = (f.radius ?? 20) * easeOutCubic(p * 1.6);
          ctx.globalAlpha = Math.max(0, 1 - p);
          ctx.fillStyle = p < 0.25 ? '#fff4c2' : '#ff9d4d';
          ctx.beginPath();
          ctx.arc(f.at!.x, f.at!.y, r * 0.55, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ff6b35';
          ctx.lineWidth = 3 * (1 - p) + 1;
          ctx.beginPath();
          ctx.arc(f.at!.x, f.at!.y, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.lineWidth = 1;
          break;
        }
        case 'particle': {
          const g = f.gravity ?? 0;
          const x = f.at!.x + f.vel!.x * age;
          const y = f.at!.y + f.vel!.y * age + 0.5 * g * age * age;
          ctx.globalAlpha = Math.max(0, 1 - p * p);
          ctx.fillStyle = f.color;
          const s = f.size ?? 1;
          ctx.fillRect(Math.round(x), Math.round(y), s, s);
          break;
        }
        case 'number': {
          const rise = easeOutCubic(p) * 14;
          const scale = f.crit ? 0.6 + 0.6 * easeOutBack(Math.min(1, p * 4)) : 1;
          ctx.globalAlpha = p > 0.7 ? (1 - p) / 0.3 : 1;
          ctx.font = `bold ${Math.round((f.crit ? 11 : 8) * scale)}px ${FONT}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = C.ink;
          ctx.fillText(f.text!, f.at!.x + 1, f.at!.y - rise + 1);
          ctx.fillStyle = f.color;
          ctx.fillText(f.text!, f.at!.x, f.at!.y - rise);
          break;
        }
        case 'coin': {
          // 처음엔 살짝 튀어 올랐다가 HUD 로 빨려 들어간다
          const up = Math.min(1, p * 3);
          const pull = Math.max(0, (p - 0.25) / 0.75);
          const start = { x: f.from!.x, y: f.from!.y - 14 * easeOutCubic(up) };
          const x = lerp(start.x, f.to!.x, pull * pull);
          const y = lerp(start.y, f.to!.y, pull * pull);
          ctx.fillStyle = C.ink;
          ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 5, 5);
          ctx.fillStyle = C.gold;
          ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
          if (p < 0.4) {
            ctx.globalAlpha = 1 - p / 0.4;
            ctx.font = `bold 8px ${FONT}`;
            ctx.textAlign = 'center';
            ctx.fillStyle = C.gold;
            ctx.fillText(f.text!, f.from!.x, f.from!.y - 18 - p * 10);
          }
          break;
        }
        case 'puff':
          ctx.globalAlpha = 0.6 * (1 - p);
          ctx.fillStyle = f.color;
          ctx.beginPath();
          ctx.arc(f.at!.x, f.at!.y - p * 6, (f.radius ?? 4) * (0.5 + p), 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'glow':
          ctx.globalAlpha = 0.7 * (1 - p);
          ctx.fillStyle = f.color;
          ctx.beginPath();
          ctx.arc(f.at!.x, f.at!.y, (f.radius ?? 6) * (0.6 + p * 0.6), 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'ring':
          ctx.globalAlpha = 1 - p;
          ctx.strokeStyle = f.color;
          ctx.lineWidth = 3 * (1 - p) + 1;
          ctx.beginPath();
          ctx.arc(f.at!.x, f.at!.y, (f.radius ?? 40) * easeOutCubic(p), 0, Math.PI * 2);
          ctx.stroke();
          ctx.lineWidth = 1;
          break;
        case 'flash':
          ctx.globalAlpha = 0.15 * (1 - p);
          ctx.fillStyle = f.color;
          ctx.fillRect(0, 0, width, height);
          break;
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawProjectile(ctx: CanvasRenderingContext2D, f: Fx, p: number): void {
    const pos = (t: number) => projectilePos(f.from!, f.to!, t, f.arc ?? 0);
    const cur = pos(p);
    const dx = f.to!.x - f.from!.x;
    const dy = f.to!.y - f.from!.y;
    const len = Math.hypot(dx, dy) || 1;
    ctx.fillStyle = f.color;
    ctx.strokeStyle = f.color;
    switch (f.style) {
      case 'arrow': {
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cur.x - (dx / len) * 14, cur.y - (dy / len) * 14);
        ctx.lineTo(cur.x, cur.y);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.round(cur.x) - 1, Math.round(cur.y) - 1, 2, 2);
        break;
      }
      case 'bomb': {
        for (let i = 1; i <= 3; i++) {
          const t = pos(Math.max(0, p - i * 0.06));
          ctx.globalAlpha = 0.35 - i * 0.08;
          ctx.fillStyle = '#b8bccb';
          ctx.fillRect(Math.round(t.x) - 1, Math.round(t.y) - 1, 2, 2);
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = C.ink;
        ctx.fillRect(Math.round(cur.x) - 3, Math.round(cur.y) - 3, 6, 6);
        ctx.fillStyle = '#4a4658';
        ctx.fillRect(Math.round(cur.x) - 2, Math.round(cur.y) - 2, 4, 4);
        ctx.fillStyle = (Math.floor(this.now * 20) % 2) === 0 ? '#ffd75e' : '#ff6b35';
        ctx.fillRect(Math.round(cur.x) + 1, Math.round(cur.y) - 4, 2, 2);
        break;
      }
      case 'chaos': {
        const wob = Math.sin(p * Math.PI * 6) * 4;
        const x = cur.x + (-dy / len) * wob;
        const y = cur.y + (dx / len) * wob;
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 1, 1);
        break;
      }
      case 'frost': {
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(cur.x, cur.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#e8f6ff';
        ctx.fillRect(Math.round(cur.x) - 1, Math.round(cur.y) - 2, 2, 4);
        ctx.fillRect(Math.round(cur.x) - 2, Math.round(cur.y) - 1, 4, 2);
        break;
      }
      default: {
        // 단검·돌: 회전하는 작은 조각 + 잔상
        for (let i = 1; i <= 2; i++) {
          const t = pos(Math.max(0, p - i * 0.12));
          ctx.globalAlpha = 0.3 / i;
          ctx.fillRect(Math.round(t.x) - 1, Math.round(t.y) - 1, 2, 2);
        }
        ctx.globalAlpha = 1;
        const spin = Math.floor(this.now * 30) % 2 === 0;
        ctx.fillRect(Math.round(cur.x) - (spin ? 2 : 1), Math.round(cur.y) - (spin ? 1 : 2), spin ? 4 : 2, spin ? 2 : 4);
      }
    }
  }

  private drawLightning(ctx: CanvasRenderingContext2D, f: Fx, p: number): void {
    // 매 프레임 조금씩 모양이 바뀌며 깜빡인다
    const frame = Math.floor((this.now - f.born) * 40);
    const dist = Math.hypot(f.to!.x - f.from!.x, f.to!.y - f.from!.y);
    const pts = lightningPath(f.from!, f.to!, Math.max(3, Math.round(dist / 12)), 5, createRng((f.seed ?? 0) * 131 + frame));
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (const q of pts.slice(1)) ctx.lineTo(q.x, q.y);
    };
    ctx.globalAlpha = 0.45 * (1 - p);
    ctx.strokeStyle = f.color;
    ctx.lineWidth = 4;
    path();
    ctx.stroke();
    ctx.globalAlpha = 1 - p;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    path();
    ctx.stroke();
    ctx.lineWidth = 1;
  }
}
