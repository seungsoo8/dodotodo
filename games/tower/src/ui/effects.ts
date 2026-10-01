import { createRng } from '../core/rng.ts';
import type { GameEvent, Point } from '../core/types.ts';
import { easeOutBack, easeOutCubic, formatNumber, lerp, lightningPath, projectilePos, shakeOffset } from './fx.ts';
import { C, FONT, TYPE_INFO, spriteImage } from './kit.ts';
import { PROJECTILES } from './sprites.ts';
import { travelAngle, type BeamKind, type ImpactKind, type ProjectileKind, type WeaponFx } from './weaponfx.ts';

type Kind =
  | 'projectile'
  | 'beam'
  | 'explosion'
  | 'particle'
  | 'number'
  | 'coin'
  | 'puff'
  | 'glow'
  | 'ring'
  | 'flash'
  | 'slash'
  | 'swirl'
  | 'flame'
  | 'implode';

interface Fx {
  kind: Kind;
  /** 시작 시각. 미래면 그때까지 보이지 않는다 (착탄 시각에 맞춘 효과) */
  born: number;
  life: number;
  color: string;
  color2?: string;
  from?: Point;
  to?: Point;
  at?: Point;
  vel?: Point;
  gravity?: number;
  size?: number;
  radius?: number;
  arc?: number;
  spin?: number;
  angle?: number;
  projectile?: ProjectileKind;
  beam?: BeamKind;
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

const MAX_FX = 1200;

/** 투사체 그림 배율 (작은 그림은 크게 그려야 날아가는 게 보인다) */
const PROJECTILE_SCALE: Record<ProjectileKind, number> = {
  stone: 3,
  dagger: 3,
  axe: 3,
  shell: 3,
  boulder: 3,
  pot: 3,
  frostOrb: 3,
  chaosOrb: 3,
  arrow: 2,
  galeArrow: 2,
  bolt: 2,
};
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

  shake(intensity: number, dur: number, delay = 0): void {
    this.shakes.push({ intensity, start: this.now + delay, dur, seed: this.seq++ });
  }

  shakeOffset(): Point {
    let x = 0;
    let y = 0;
    for (const s of this.shakes) {
      if (this.now < s.start) continue;
      const o = shakeOffset(s.intensity, this.now - s.start, s.dur, s.seed);
      x += o.x;
      y += o.y;
    }
    return { x: Math.round(x), y: Math.round(y) };
  }

  // ───────── 발사 ─────────

  /** 무기에 맞는 투사체·광선을 내보낸다 */
  shot(ev: Extract<GameEvent, { kind: 'shot' }>, fx: WeaponFx, towerTop: Point): void {
    const color = TYPE_INFO[ev.weaponType].color;
    const fromTower = Math.abs(ev.from.x - towerTop.x) < 1 && ev.from.y >= towerTop.y;
    const from = fromTower ? towerTop : ev.from;
    if (fromTower) this.add({ kind: 'glow', at: towerTop, color, life: 0.12, radius: 7 });

    if (fx.beam) {
      const life = { lightning: 0.2, storm: 0.3, eyeBeam: 0.12, voidBeam: 0.28 }[fx.beam];
      this.add({ kind: 'beam', beam: fx.beam, from, to: ev.to, color, life, seed: this.seq++ });
      if (fx.beam === 'voidBeam') {
        // 광선 주변 입자가 광선 쪽으로 빨려 든다
        for (let i = 0; i < 6; i++) {
          const t = this.rng.next();
          const at = { x: lerp(from.x, ev.to.x, t), y: lerp(from.y, ev.to.y, t) };
          this.add({ kind: 'particle', at, vel: { x: this.rng.range(-20, 20), y: this.rng.range(-20, 20) }, size: 2, color: '#2a0f3a', life: 0.3 });
        }
      }
      if (fx.beam === 'eyeBeam' && fromTower) this.add({ kind: 'glow', at: towerTop, color: '#ff7ad9', life: 0.1, radius: 4 });
      return;
    }

    const dist = Math.hypot(ev.to.x - from.x, ev.to.y - from.y);
    const life = Math.max(0.05, dist / fx.speed);
    const count = fx.count ?? 1;
    const len = dist || 1;
    for (let i = 0; i < count; i++) {
      // 여러 개면 진행 방향에 수직으로 벌려서 나란히
      const off = count > 1 ? (i - (count - 1) / 2) * 5 : 0;
      const nx = (-(ev.to.y - from.y) / len) * off;
      const ny = ((ev.to.x - from.x) / len) * off;
      this.add({
        kind: 'projectile',
        projectile: fx.projectile,
        from: { x: from.x + nx, y: from.y + ny },
        to: { x: ev.to.x + nx, y: ev.to.y + ny },
        color,
        life,
        arc: fx.arc,
        spin: fx.spin,
        seed: this.seq++,
      });
    }
  }

  // ───────── 착탄 ─────────

  /** 광역 무기가 떨어진 자리 (한 번만) */
  splash(kind: ImpactKind, at: Point, radius: number, delay: number): void {
    const born = this.now + delay;
    if (kind === 'dustBlast') {
      for (let i = 0; i < 10; i++) {
        const a = this.rng.range(0, Math.PI * 2);
        const d = this.rng.range(0, radius * 0.6);
        this.add({
          kind: 'puff',
          at: { x: at.x + Math.cos(a) * d, y: at.y + Math.sin(a) * d * 0.6 },
          radius: this.rng.range(5, 11),
          color: '#9a8468',
          life: this.rng.range(0.5, 0.8),
          born,
        });
      }
      this.debris(at, born, 10, ['#8a7a66', '#6a5a48', '#b0a08a'], 130);
      this.add({ kind: 'ring', at, radius, color: '#c8b08a', life: 0.4, born });
      this.shake(3.5, 0.3, delay);
      return;
    }
    if (kind === 'fireBurst') {
      this.add({ kind: 'explosion', at, radius: radius * 0.8, color: '#ff4d2e', color2: '#ffd75e', life: 0.35, born, seed: this.seq++ });
      // 불이 붙은 자리에 한동안 불꽃이 남는다
      for (let i = 0; i < 12; i++) {
        const a = this.rng.range(0, Math.PI * 2);
        const d = this.rng.range(0, radius * 0.8);
        this.add({
          kind: 'flame',
          at: { x: at.x + Math.cos(a) * d, y: at.y + Math.sin(a) * d * 0.6 },
          color: '#ff9d4d',
          life: this.rng.range(0.8, 1.4),
          born: born + this.rng.range(0, 0.25),
          seed: this.seq++,
        });
      }
      this.shake(2, 0.2, delay);
      return;
    }
    // 박격포: 주황 폭발 + 파편
    this.add({ kind: 'explosion', at, radius, color: '#ff6b35', color2: '#fff4c2', life: 0.4, born, seed: this.seq++ });
    this.debris(at, born, 10, ['#ffd75e', '#ff6b35'], 110);
    this.shake(1.5, 0.12, delay);
  }

  /** 한 적을 맞힌 자리 (무기별) */
  impact(kind: ImpactKind, at: Point, delay: number, from?: Point): void {
    const born = this.now + delay;
    const angle = from ? Math.atan2(at.y - from.y, at.x - from.x) : this.rng.range(0, Math.PI);
    switch (kind) {
      case 'chips':
        this.debris(at, born, 4, ['#9aa0b0', '#6a7080'], 60);
        this.add({ kind: 'puff', at, radius: 3, color: '#b8bccb', life: 0.25, born });
        break;
      case 'slash':
        this.add({ kind: 'slash', at, angle: angle + Math.PI / 4, radius: 6, color: '#ffffff', life: 0.14, born });
        break;
      case 'bigSlash':
        this.add({ kind: 'slash', at, angle: angle + Math.PI / 3, radius: 11, color: '#fff4c2', life: 0.2, born });
        this.add({ kind: 'slash', at, angle: angle - Math.PI / 3, radius: 9, color: '#ffffff', life: 0.18, born: born + 0.03 });
        this.debris(at, born, 3, ['#dfe4f0'], 70);
        this.shake(1, 0.08, delay);
        break;
      case 'spark':
        this.debris(at, born, 3, ['#ffffff', '#ffd75e'], 70, 1);
        break;
      case 'wind':
        this.add({ kind: 'swirl', at, radius: 8, color: '#c8f0b0', life: 0.35, born, seed: this.seq++ });
        break;
      case 'heavySpark':
        this.debris(at, born, 7, ['#ffffff', '#ffd75e', '#c8ccd8'], 110, 2);
        this.add({ kind: 'ring', at, radius: 12, color: '#ffffff', life: 0.2, born });
        this.shake(1.2, 0.1, delay);
        break;
      case 'zap':
        this.debris(at, born, 4, ['#bfe0ff', '#ffffff'], 80, 1);
        break;
      case 'stormZap':
        this.debris(at, born, 5, ['#b9a3ff', '#ffffff', '#6fb7ff'], 90, 2);
        this.add({ kind: 'ring', at, radius: 9, color: '#b9a3ff', life: 0.18, born });
        break;
      case 'iceBurst':
        for (let i = 0; i < 8; i++) {
          const a = (Math.PI * 2 * i) / 8;
          this.add({ kind: 'particle', at, vel: { x: Math.cos(a) * 70, y: Math.sin(a) * 70 }, size: 2, color: i % 2 ? '#e8f6ff' : '#9fd8ff', life: 0.3, born });
        }
        this.add({ kind: 'ring', at, radius: 14, color: '#9fd8ff', life: 0.3, born });
        break;
      case 'chaosPop':
        this.add({ kind: 'implode', at, radius: 10, color: '#c77dff', color2: '#7a3fc0', life: 0.25, born });
        this.debris(at, born, 4, ['#c77dff', '#ff7ad9'], 80, 1);
        break;
      case 'eyeSpark':
        this.debris(at, born, 2, ['#ff7ad9', '#ffffff'], 60, 1);
        break;
      case 'voidImplode':
        this.add({ kind: 'implode', at, radius: 14, color: '#1a0826', color2: '#c77dff', life: 0.35, born });
        break;
      default:
        this.debris(at, born, 2, ['#ffffff'], 50, 1);
    }
  }

  private debris(at: Point, born: number, n: number, colors: string[], speed: number, size = 2): void {
    for (let i = 0; i < n; i++) {
      const a = this.rng.range(0, Math.PI * 2);
      const v = this.rng.range(speed * 0.4, speed);
      this.add({
        kind: 'particle',
        at,
        vel: { x: Math.cos(a) * v, y: Math.sin(a) * v - speed * 0.3 },
        gravity: 240,
        size,
        color: colors[this.rng.int(colors.length)],
        life: this.rng.range(0.3, 0.5),
        born,
      });
    }
  }

  number(at: Point, amount: number, crit: boolean, delay: number): void {
    if (amount < 1) return;
    this.add({
      kind: 'number',
      at: { x: at.x + this.rng.range(-4, 4), y: at.y - 6 },
      text: crit ? `${formatNumber(amount)}!` : formatNumber(amount),
      crit,
      color: crit ? '#ff6b6b' : '#f4f1e8',
      life: crit ? 0.8 : 0.55,
      born: this.now + delay,
    });
  }

  kill(at: Point, bounty: number, big: boolean, delay: number): void {
    const born = this.now + delay;
    for (let i = 0; i < (big ? 8 : 4); i++) {
      const a = this.rng.range(0, Math.PI * 2);
      const d = this.rng.range(2, big ? 12 : 6);
      this.add({
        kind: 'puff',
        at: { x: at.x + Math.cos(a) * d, y: at.y + Math.sin(a) * d },
        radius: this.rng.range(3, big ? 9 : 5),
        color: '#b8bccb',
        life: this.rng.range(0.3, 0.5),
        born,
      });
    }
    // 코인이 HUD 골드로 날아간다
    const life = 0.55;
    this.add({ kind: 'coin', from: at, to: this.coinTarget, color: C.gold, life, text: `+${Math.round(bounty)}`, born });
    this.goldBumpAt = born + life;
    if (big) this.shake(4, 0.35, delay);
  }

  /** 치명타: 맞은 자리에 붉은 빛과 고리 */
  critBurst(at: Point, delay: number): void {
    const born = this.now + delay;
    this.add({ kind: 'glow', at, color: '#ff6b6b', life: 0.12, radius: 12, born });
    this.add({ kind: 'ring', at, radius: 14, color: '#ffb0b0', life: 0.25, born });
  }

  /** 떠오르는 글자 (도둑질·판매·치유 등) */
  floatText(at: Point, text: string, color: string, size = 9, life = 1): void {
    this.add({ kind: 'number', at, text, color, crit: false, life, size });
  }

  // ───────── 스킬 ─────────

  /** 운석이 오른쪽 위 하늘에서 떨어져 터진다 (fall 초 뒤 착탄). tint 로 불·얼음·금 운석 */
  meteor(at: Point, radius: number, fall: number, tint: 'fire' | 'ice' | 'gold' = 'fire'): void {
    const pal = {
      fire: { rock: '#ff6b35', trail: ['#ff9d4d', '#ffd75e'], boom: '#ff4d2e', ring: '#ffd75e', bits: ['#ffd75e', '#ff6b35', '#8a7a66'], flash: '#ff9d4d' },
      ice: { rock: '#9fd8ff', trail: ['#bfe0ff', '#ffffff'], boom: '#5aa0e0', ring: '#e8f6ff', bits: ['#bfe0ff', '#ffffff', '#5aa0e0'], flash: '#bfe0ff' },
      gold: { rock: '#ffd75e', trail: ['#ffd75e', '#fff6d0'], boom: '#ffb000', ring: '#ffd75e', bits: ['#ffd75e', '#fff6d0', '#c9962c'], flash: '#ffd75e' },
    }[tint];
    const from = { x: at.x + 120, y: at.y - 260 };
    this.add({ kind: 'projectile', projectile: 'boulder', from, to: at, color: pal.rock, life: fall, arc: 0, spin: 1.5, seed: this.seq++, size: 3 });
    // 떨어지는 동안 꼬리
    for (let i = 0; i < 14; i++) {
      const t = i / 14;
      this.add({
        kind: 'puff',
        at: { x: lerp(from.x, at.x, t), y: lerp(from.y, at.y, t) },
        radius: 3 + t * 3,
        color: pal.trail[i % 2],
        life: 0.25,
        born: this.now + fall * t,
      });
    }
    this.add({ kind: 'explosion', at, radius, color: pal.boom, color2: '#ffffff', life: 0.5, born: this.now + fall, seed: this.seq++ });
    this.add({ kind: 'ring', at, radius: radius * 1.4, color: pal.ring, life: 0.45, born: this.now + fall });
    for (let i = 0; i < 16; i++) {
      const a = this.rng.range(0, Math.PI * 2);
      const v = this.rng.range(60, 160);
      this.add({
        kind: 'particle',
        at,
        vel: { x: Math.cos(a) * v, y: Math.sin(a) * v - 60 },
        gravity: 260,
        size: this.rng.next() < 0.4 ? 3 : 2,
        color: pal.bits[this.rng.int(3)],
        life: 0.7,
        born: this.now + fall,
      });
    }
    this.shake(7, 0.45, fall);
    this.add({ kind: 'flash', color: pal.flash, life: 0.25, born: this.now + fall });
  }

  /** 하늘에서 벼락이 내리꽂힌다 */
  strike(at: Point, color: string, delay = 0): void {
    const born = this.now + delay;
    this.add({ kind: 'beam', beam: 'lightning', from: { x: at.x + this.rng.range(-10, 10), y: at.y - 140 }, to: at, color, life: 0.25, seed: this.seq++, born });
    this.add({ kind: 'glow', at, color, life: 0.2, radius: 12, born });
    this.add({ kind: 'ring', at, radius: 18, color: '#ffffff', life: 0.3, born });
    for (let i = 0; i < 6; i++) {
      const a = this.rng.range(0, Math.PI * 2);
      this.add({ kind: 'particle', at, vel: { x: Math.cos(a) * 70, y: Math.sin(a) * 70 - 30 }, gravity: 120, size: 1, color, life: 0.4, born });
    }
  }

  /** 돌풍: 탑에서 바람 고리가 퍼지고 잎이 날린다 */
  gust(at: Point): void {
    this.add({ kind: 'ring', at, radius: 90, color: '#c8f0d8', life: 0.45 });
    this.add({ kind: 'ring', at, radius: 150, color: '#9fe0b0', life: 0.7 });
    for (let i = 0; i < 28; i++) {
      const a = (Math.PI * 2 * i) / 28 + this.rng.range(-0.1, 0.1);
      const v = this.rng.range(140, 220);
      this.add({
        kind: 'particle',
        at: { x: at.x + Math.cos(a) * 20, y: at.y + Math.sin(a) * 14 },
        vel: { x: Math.cos(a) * v, y: Math.sin(a) * v * 0.7 },
        size: this.rng.next() < 0.3 ? 2 : 1,
        color: ['#c8f0d8', '#9fe0b0', '#6fb86f'][this.rng.int(3)],
        life: 0.6,
      });
    }
    this.shake(3, 0.25);
  }

  /** 눈보라: 화면에 눈이 쏟아지고 푸르게 번쩍 */
  blizzard(width: number, height: number, seconds: number): void {
    this.add({ kind: 'flash', color: '#bfe0ff', life: 0.5 });
    for (let i = 0; i < 90; i++) {
      this.add({
        kind: 'particle',
        at: { x: this.rng.range(-40, width), y: this.rng.range(-60, 0) },
        vel: { x: this.rng.range(15, 35), y: this.rng.range(60, 120) },
        size: this.rng.next() < 0.3 ? 2 : 1,
        color: '#e8f6ff',
        life: this.rng.range(1.5, seconds),
        born: this.now + this.rng.range(0, 1),
      });
    }
  }

  /** 수리: 탑에서 초록 십자가 떠오른다 */
  repair(at: Point, amount: number): void {
    this.add({ kind: 'ring', at, radius: 40, color: '#6fdc6f', life: 0.6 });
    for (let i = 0; i < 12; i++) {
      this.add({
        kind: 'particle',
        at: { x: at.x + this.rng.range(-14, 14), y: at.y + this.rng.range(-10, 10) },
        vel: { x: 0, y: this.rng.range(-40, -20) },
        size: 2,
        color: i % 2 ? '#6fdc6f' : '#c8f0b0',
        life: 0.9,
        born: this.now + this.rng.range(0, 0.3),
      });
    }
    this.floatText({ x: at.x, y: at.y - 30 }, `+${formatNumber(amount)}`, '#6fdc6f', 12);
  }

  /** 골드 러시: 탑 주변으로 금빛 고리와 코인 반짝이 */
  goldRush(at: Point): void {
    this.add({ kind: 'ring', at, radius: 80, color: C.gold, life: 0.7 });
    this.add({ kind: 'flash', color: C.gold, life: 0.3 });
  }

  /** 주술사 치유 파동 */
  heal(at: Point, radius: number): void {
    this.add({ kind: 'ring', at, radius, color: '#6fdc6f', life: 0.5 });
    for (let i = 0; i < 5; i++) this.sparkle({ x: at.x + this.rng.range(-radius / 2, radius / 2), y: at.y + this.rng.range(-radius / 3, radius / 3) }, '#9fe89a');
  }

  /** 합성: 탑에서 금빛 폭발 */
  mergeBurst(at: Point, level: number): void {
    this.add({ kind: 'ring', at, radius: 50 + level * 20, color: C.gold, life: 0.6 });
    this.add({ kind: 'ring', at, radius: 30 + level * 10, color: '#ffffff', life: 0.4 });
    for (let i = 0; i < 12 + level * 6; i++) {
      const a = (Math.PI * 2 * i) / (12 + level * 6);
      this.add({ kind: 'particle', at, vel: { x: Math.cos(a) * 80, y: Math.sin(a) * 80 }, gravity: 40, size: 2, color: i % 2 ? C.gold : '#ffffff', life: 0.6 });
    }
  }

  // ───────── 보스 ─────────

  /** 마녀의 불덩이: 꼬리를 끌며 날아가 탑에서 터진다 */
  fireball(from: Point, to: Point, dur = 0.35): void {
    for (let i = 0; i < 10; i++) {
      const t = i / 10;
      this.add({
        kind: 'puff',
        at: { x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t) - Math.sin(t * Math.PI) * 14 },
        radius: 2 + t * 2,
        color: i % 2 ? '#ff9d4d' : '#ffd75e',
        life: 0.18,
        born: this.now + dur * t,
      });
    }
    this.add({ kind: 'explosion', at: to, radius: 12, color: '#ff4d2e', color2: '#ffd75e', life: 0.3, born: this.now + dur, seed: this.seq++ });
  }

  /** 화염 폭풍: 탑을 중심으로 큰 불기둥 */
  firestorm(at: Point): void {
    this.add({ kind: 'explosion', at, radius: 62, color: '#ff4d2e', color2: '#ffd75e', life: 0.6, seed: this.seq++ });
    this.add({ kind: 'ring', at, radius: 95, color: '#ff9d4d', life: 0.5 });
    for (let i = 0; i < 26; i++) {
      const a = this.rng.range(0, Math.PI * 2);
      const v = this.rng.range(50, 140);
      this.add({
        kind: 'particle',
        at,
        vel: { x: Math.cos(a) * v, y: Math.sin(a) * v - 50 },
        gravity: 120,
        size: this.rng.next() < 0.4 ? 3 : 2,
        color: ['#ffd75e', '#ff6b35', '#ff4d2e'][this.rng.int(3)],
        life: 0.8,
      });
    }
    this.shake(7, 0.6);
    this.flash('#ff6b35', 0.3);
  }

  /** 돌진 충돌: 흙먼지와 충격파 */
  slam(at: Point): void {
    this.add({ kind: 'ring', at, radius: 55, color: '#ffffff', life: 0.35 });
    this.add({ kind: 'ring', at, radius: 80, color: '#8a93a6', life: 0.55 });
    for (let i = 0; i < 18; i++) {
      const a = this.rng.range(Math.PI, Math.PI * 2);
      const v = this.rng.range(40, 120);
      this.add({ kind: 'particle', at, vel: { x: Math.cos(a) * v, y: Math.sin(a) * v }, gravity: 220, size: 2, color: i % 2 ? '#8a7a66' : '#5b6273', life: 0.7 });
    }
    this.shake(9, 0.5);
    this.flash('#ff0000', 0.2);
  }

  /** 소환: 땅에서 흙이 솟는다 */
  summon(at: Point, radius: number): void {
    this.add({ kind: 'ring', at, radius, color: '#c98a4b', life: 0.5 });
    for (let i = 0; i < 12; i++) {
      const a = (Math.PI * 2 * i) / 12;
      this.add({
        kind: 'puff',
        at: { x: at.x + Math.cos(a) * radius, y: at.y + Math.sin(a) * radius * 0.6 },
        radius: 4,
        color: i % 2 ? '#6b5236' : '#8a6a44',
        life: 0.5,
      });
    }
    this.shake(3, 0.3);
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
  shatter(pixels: { x: number; y: number; color: string }[], origin: Point, scale = 1): void {
    for (const p of pixels) {
      if (this.rng.next() < 0.5) continue;
      this.add({
        kind: 'particle',
        at: { x: origin.x + p.x * scale, y: origin.y + p.y * scale },
        vel: { x: this.rng.range(-60, 60), y: this.rng.range(-90, -10) },
        gravity: 260,
        size: Math.max(2, Math.round(2 * scale)),
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
        case 'beam':
          this.drawBeam(ctx, f, p);
          break;
        case 'explosion': {
          // 픽셀 불덩이: 짧은 섬광 → 불덩이 여러 개가 퍼지며 연기로 변함 → 가는 충격파 고리
          const R = f.radius ?? 20;
          const at = f.at!;
          if (age < 0.07) {
            ctx.fillStyle = f.color2 ?? '#fff4c2';
            ctx.beginPath();
            ctx.arc(at.x, at.y, R * 0.3, 0, Math.PI * 2);
            ctx.fill();
          }
          const spread = easeOutCubic(Math.min(1, p * 2));
          for (let i = 0; i < 7; i++) {
            const a = (Math.PI * 2 * i) / 7 + (f.seed ?? 0);
            const d = R * 0.4 * spread * (0.6 + ((i * 37) % 10) / 25);
            const br = R * 0.2 * (1 - p * 0.6);
            ctx.globalAlpha = Math.max(0, 1 - p);
            ctx.fillStyle = p < 0.3 ? '#ffd75e' : p < 0.6 ? f.color : '#6a5a5a';
            ctx.beginPath();
            ctx.arc(at.x + Math.cos(a) * d, at.y + Math.sin(a) * d * 0.7 - p * 6, br, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = (1 - p) * 0.6;
          ctx.strokeStyle = f.color;
          ctx.beginPath();
          ctx.arc(at.x, at.y, R * easeOutCubic(p), 0, Math.PI * 2);
          ctx.stroke();
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
          ctx.font = `bold ${Math.round((f.crit ? 11 : (f.size ?? 8)) * scale)}px ${FONT}`;
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
        case 'slash': {
          // 칼날이 지나간 흰 자국: 짧게 그어졌다 사라진다
          const r = f.radius ?? 6;
          const a = f.angle ?? 0;
          const grow = easeOutCubic(Math.min(1, p * 3));
          ctx.globalAlpha = 1 - p;
          ctx.strokeStyle = f.color;
          ctx.lineWidth = r > 8 ? 2 : 1.5;
          ctx.beginPath();
          ctx.moveTo(f.at!.x - Math.cos(a) * r, f.at!.y - Math.sin(a) * r);
          ctx.lineTo(f.at!.x - Math.cos(a) * r + Math.cos(a) * 2 * r * grow, f.at!.y - Math.sin(a) * r + Math.sin(a) * 2 * r * grow);
          ctx.stroke();
          ctx.lineWidth = 1;
          break;
        }
        case 'swirl': {
          // 바람 소용돌이: 점들이 돌며 퍼진다
          ctx.globalAlpha = 1 - p;
          ctx.fillStyle = f.color;
          const r = (f.radius ?? 8) * (0.4 + p);
          for (let i = 0; i < 6; i++) {
            const a = (Math.PI * 2 * i) / 6 + p * Math.PI * 3 + (f.seed ?? 0);
            ctx.fillRect(Math.round(f.at!.x + Math.cos(a) * r), Math.round(f.at!.y + Math.sin(a) * r * 0.6), 2, 1);
          }
          break;
        }
        case 'flame': {
          // 남은 불꽃: 흔들리며 올라가다 꺼진다
          const flick = Math.floor(this.now * 12 + (f.seed ?? 0)) % 3;
          const h = 3 + flick;
          ctx.globalAlpha = p > 0.7 ? (1 - p) / 0.3 : 1;
          const x = Math.round(f.at!.x + Math.sin(this.now * 8 + (f.seed ?? 0)) * 1);
          const y = Math.round(f.at!.y - p * 4);
          ctx.fillStyle = '#ff6b35';
          ctx.fillRect(x - 1, y - h, 3, h);
          ctx.fillStyle = '#ffd75e';
          ctx.fillRect(x, y - h + 1, 1, h - 1);
          break;
        }
        case 'implode': {
          // 안쪽으로 빨려 들어가는 원
          const r = (f.radius ?? 10) * (1 - easeOutCubic(p));
          ctx.globalAlpha = 1 - p * 0.5;
          ctx.fillStyle = f.color;
          ctx.beginPath();
          ctx.arc(f.at!.x, f.at!.y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = f.color2 ?? f.color;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.lineWidth = 1;
          break;
        }
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
    const arc = f.arc ?? 0;
    const pos = (t: number) => projectilePos(f.from!, f.to!, t, arc);
    const cur = pos(p);
    const kind = f.projectile ?? 'stone';
    const sprite = PROJECTILES[kind];

    // 꼬리
    switch (kind) {
      case 'arrow':
      case 'bolt':
        this.trailLine(ctx, pos, p, kind === 'bolt' ? '#ffffff' : '#d8def0', kind === 'bolt' ? 2 : 1, 0.08);
        break;
      case 'galeArrow': {
        this.trailLine(ctx, pos, p, '#c8f0b0', 1, 0.12);
        // 바람 줄기 두 가닥
        const a = travelAngle(f.from!, f.to!, p, arc);
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#8fd16a';
        for (const side of [-1, 1]) {
          const wob = Math.sin(this.now * 40 + side) * 1.5;
          const bx = cur.x - Math.cos(a) * 8 + -Math.sin(a) * (3 * side + wob);
          const by = cur.y - Math.sin(a) * 8 + Math.cos(a) * (3 * side + wob);
          ctx.fillRect(Math.round(bx), Math.round(by), 3, 1);
        }
        ctx.globalAlpha = 1;
        break;
      }
      case 'frostOrb':
        if (Math.random() < 0.5) this.sparkle({ x: cur.x + this.rng.range(-2, 2), y: cur.y + this.rng.range(-2, 2) }, '#e8f6ff');
        break;
      case 'chaosOrb':
        this.trailDots(ctx, pos, p, '#c77dff', 3, 0.07);
        break;
      case 'shell':
      case 'boulder':
        this.trailDots(ctx, pos, p, '#8a8e9e', 3, 0.05);
        break;
      case 'pot':
        if (Math.random() < 0.6) this.add({ kind: 'particle', at: { ...cur }, vel: { x: this.rng.range(-10, 10), y: -20 }, size: 1, color: '#ffd75e', life: 0.25 });
        break;
      default:
        this.trailDots(ctx, pos, p, '#b8bccb', 2, 0.1);
    }

    // 몸통: 회전하는 것은 빙글빙글, 아니면 날아가는 방향을 향해
    let angle = travelAngle(f.from!, f.to!, p, arc);
    const spin = f.spin ?? 0;
    if (spin > 0) angle = (this.now - f.born) * spin * Math.PI * 2 + (f.seed ?? 0);
    let dx = 0;
    let dy = 0;
    if (kind === 'chaosOrb') {
      // 혼돈 구슬은 좌우로 요동친다
      const a = travelAngle(f.from!, f.to!, p, arc);
      const wob = Math.sin(p * Math.PI * 6) * 4;
      dx = -Math.sin(a) * wob;
      dy = Math.cos(a) * wob;
      angle = 0;
    }
    if (kind === 'frostOrb') angle = 0;
    ctx.save();
    ctx.translate(Math.round(cur.x + dx), Math.round(cur.y + dy));
    ctx.rotate(angle);
    const sc = f.size ?? PROJECTILE_SCALE[kind];
    ctx.drawImage(spriteImage(sprite), -Math.floor((sprite.width * sc) / 2), -Math.floor((sprite.height * sc) / 2), sprite.width * sc, sprite.height * sc);
    ctx.restore();
    if (kind === 'shell' && Math.floor(this.now * 20) % 2 === 0) {
      // 포탄 심지 불꽃
      ctx.fillStyle = '#ffd75e';
      ctx.fillRect(Math.round(cur.x) + 1, Math.round(cur.y) - 4, 2, 2);
    }
  }

  private trailLine(ctx: CanvasRenderingContext2D, pos: (t: number) => Point, p: number, color: string, width: number, span: number): void {
    const a = pos(Math.max(0, p - span * 3));
    const b = pos(p);
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.globalAlpha = 1;
  }

  private trailDots(ctx: CanvasRenderingContext2D, pos: (t: number) => Point, p: number, color: string, n: number, span: number): void {
    ctx.fillStyle = color;
    for (let i = 1; i <= n; i++) {
      const t = pos(Math.max(0, p - i * span));
      ctx.globalAlpha = 0.4 - i * (0.3 / n);
      ctx.fillRect(Math.round(t.x) - 1, Math.round(t.y) - 1, 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  private drawBeam(ctx: CanvasRenderingContext2D, f: Fx, p: number): void {
    const from = f.from!;
    const to = f.to!;
    const frame = Math.floor((this.now - f.born) * 40);
    const stroke = (pts: Point[], color: string, width: number, alpha: number) => {
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (const q of pts.slice(1)) ctx.lineTo(q.x, q.y);
      ctx.stroke();
    };
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    switch (f.beam) {
      case 'lightning': {
        // 지그재그 번개: 매 프레임 모양이 바뀌며 깜빡인다
        const pts = lightningPath(from, to, Math.max(3, Math.round(dist / 12)), 5, createRng((f.seed ?? 0) * 131 + frame));
        stroke(pts, '#6fb7ff', 4, 0.45 * (1 - p));
        stroke(pts, '#ffffff', 1.5, 1 - p);
        break;
      }
      case 'storm': {
        // 폭풍 수정: 굵은 보라 번개 + 갈라지는 가지
        const rng = createRng((f.seed ?? 0) * 71 + frame);
        const pts = lightningPath(from, to, Math.max(4, Math.round(dist / 10)), 8, rng);
        stroke(pts, '#7a5cff', 6, 0.35 * (1 - p));
        stroke(pts, '#b9a3ff', 3, 0.8 * (1 - p));
        stroke(pts, '#ffffff', 1, 1 - p);
        for (let i = 1; i < pts.length - 1; i += 2) {
          const end = { x: pts[i].x + rng.range(-12, 12), y: pts[i].y + rng.range(-12, 12) };
          stroke(lightningPath(pts[i], end, 3, 3, rng), '#b9a3ff', 1, 0.7 * (1 - p));
        }
        break;
      }
      case 'eyeBeam': {
        // 혼돈의 눈: 가늘고 빠른 분홍 광선
        stroke([from, to], '#ff7ad9', 3, 0.35 * (1 - p));
        stroke([from, to], '#ffe0f4', 1, 1 - p);
        break;
      }
      case 'voidBeam': {
        // 공허 광선: 검은 심과 보라 테두리가 굵어졌다 가늘어진다
        const w = 7 * Math.sin(Math.min(1, p * 1.2) * Math.PI) + 1;
        stroke([from, to], '#c77dff', w + 3, 0.6 * (1 - p * 0.5));
        stroke([from, to], '#12061c', w, 1);
        stroke([from, to], '#e8ccff', 1, 0.6 * (1 - p));
        break;
      }
    }
    ctx.lineWidth = 1;
    ctx.globalAlpha = 1;
  }
}

