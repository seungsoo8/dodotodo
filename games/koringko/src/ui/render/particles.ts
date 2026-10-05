/**
 * 작은 파티클 풀 (QUALITY C4): 빛 속 먼지 · 반짝임 · 김 · 눈 · 빗물 · 물방울 · 튀는 물 · 꽃잎 · 잎.
 * 세계 좌표(px)로 움직인다. 최대 개수를 넘치면 가장 오래된 것을 다시 쓴다. 화면과 무관 (그리기는 render.ts).
 */

export type ParticleKind = 'dust' | 'sparkle' | 'steam' | 'snow' | 'rain' | 'drip' | 'splash' | 'petal' | 'leaf' | 'mote' | 'ripple';
export type Weather = 'rain' | 'snow' | 'drizzle';

export const PARTICLE_MAX = 200;
/** 중력 (px/s²) */
const G = 520;

export class Particle {
  kind: ParticleKind = 'dust';
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  age = 0;
  life = 1;
  /** 이 y 에 닿으면 (떨어지는 것) 튀거나 사라진다. 없으면 Infinity */
  floor = Infinity;
  /** 그림 고르기용 씨앗 (0..1) */
  seed = 0;
  /** 남은 수명 비율 1 → 0 */
  fade(): number {
    return Math.max(0, 1 - this.age / this.life);
  }
}

export class ParticlePool {
  private live: Particle[] = [];
  private free: Particle[] = [];
  private n = 0;
  /** 지금까지 바닥에 닿아 튄 물 수 */
  splashes = 0;
  readonly max: number;

  constructor(max = PARTICLE_MAX) {
    this.max = Math.max(1, max);
  }

  emit(kind: ParticleKind, x: number, y: number, vx: number, vy: number, life: number, floor = Infinity): Particle {
    const p = this.live.length >= this.max ? this.live.shift()! : (this.free.pop() ?? new Particle());
    p.kind = kind;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.age = 0;
    p.life = life;
    p.floor = floor;
    p.seed = ((this.n++ * 0.6180339887) % 1 + 1) % 1;
    this.live.push(p);
    return p;
  }

  step(dt: number): void {
    const keep: Particle[] = [];
    const born: [number, number, number][] = [];
    for (const p of this.live) {
      p.age += dt;
      switch (p.kind) {
        case 'rain':
        case 'drip':
        case 'splash':
          p.vy += G * dt;
          break;
        case 'snow':
        case 'petal':
        case 'leaf':
          // 흔들리며 일정하게 (속도는 그대로, 옆으로만 살랑)
          p.x += Math.sin(p.age * 1.7 + p.seed * 6.28) * 6 * dt;
          break;
        case 'steam':
          p.vx *= 1 - Math.min(1, dt * 0.8);
          p.x += Math.sin(p.age * 2.3 + p.seed * 6.28) * 3 * dt;
          break;
        case 'dust':
          p.vx *= 1 - Math.min(1, dt * 1.5);
          p.vy *= 1 - Math.min(1, dt * 1.5);
          break;
        case 'mote':
          // 빛 속 먼지: 거의 떠 있다가 천천히 맴돈다
          p.x += Math.sin(p.age * 0.9 + p.seed * 6.28) * 2 * dt;
          break;
        default:
          break;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.y >= p.floor && p.vy > 0) {
        if (p.kind === 'rain' || p.kind === 'drip') {
          this.splashes++;
          born.push([p.x, p.floor, p.seed]);
        }
        if (p.kind !== 'splash' || p.y > p.floor + 2) {
          this.free.push(p);
          continue;
        }
      }
      if (p.age >= p.life) {
        this.free.push(p);
        continue;
      }
      keep.push(p);
    }
    this.live = keep;
    for (const [x, y, s] of born) {
      const side = s < 0.5 ? -1 : 1;
      this.emit('splash', x, y - 0.5, side * (14 + s * 10), -40 - s * 20, 0.28, y);
    }
  }

  alive(): number {
    return this.live.length;
  }

  list(): readonly Particle[] {
    return this.live;
  }

  clear(): void {
    this.free.push(...this.live);
    this.live = [];
  }
}

interface WeatherRoom {
  weather?: Weather;
  rain?: boolean;
  furniture?: readonly { kind: string }[];
}

/** 방의 날씨: weather → rain → 창밖 (window:rain · window:snow) → null */
export function weatherOf(r: WeatherRoom | null | undefined): Weather | null {
  if (!r) return null;
  if (r.weather) return r.weather;
  if (r.rain) return 'rain';
  for (const f of r.furniture ?? []) {
    if (f.kind === 'window:snow') return 'snow';
    if (f.kind === 'window:rain') return 'rain';
  }
  return null;
}

/** 넓이 (px²) 의 화면에 초당 내보낼 수 */
export function weatherRate(w: Weather, area: number): number {
  const per = w === 'rain' ? 1 / 900 : w === 'drizzle' ? 1 / 2600 : 1 / 2000;
  return Math.max(0, area) * per;
}
