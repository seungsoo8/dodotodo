/** 화면 효과: 세계의 사건을 받아 베기 자국 · 파편 · 숫자 · 흔들림을 만든다 */
import type { Vec } from '../../core/geom.ts';
import type { WorldEvent } from '../../core/world.ts';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 바닥에서 뜬 높이 (튀어 오르기) */
  z: number;
  vz: number;
  life: number;
  max: number;
  color: string;
  size: number;
  /** 떨어지는가 (없으면 공중에서 퍼진다) */
  fall: boolean;
}

export interface FloatText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  max: number;
  big: boolean;
}

export interface Swing {
  x: number;
  y: number;
  ang: number;
  reach: number;
  arc: number;
  /** 반대로 휘두르기 */
  rev: boolean;
  life: number;
  max: number;
  color: string;
}

export interface Ring {
  x: number;
  y: number;
  r: number;
  life: number;
  max: number;
  color: string;
  fill: boolean;
}

export interface Bolt {
  pts: Vec[];
  life: number;
  max: number;
  color: string;
}

export interface Corpse {
  defId: string;
  x: number;
  y: number;
  r: number;
  life: number;
  max: number;
}

const PICK_NAME: Record<string, string> = { fluff: '솜', gear: '톱니', sugar: '설탕', dust: '별가루', star: '별 조각' };

export class Fx {
  corpses: Corpse[] = [];
  /** 보스 등장: 카메라가 보스를 비추고 위아래 검은 띠 */
  cinema: { x: number; y: number; life: number; max: number } | null = null;
  particles: Particle[] = [];
  texts: FloatText[] = [];
  swings: Swing[] = [];
  rings: Ring[] = [];
  bolts: Bolt[] = [];
  shake = 0;
  /** 화면 번쩍임 (색 · 남은 시간) */
  flash: { color: string; life: number; max: number } | null = null;
  /** 잠깐 멈춤 (타격감) */
  hitstop = 0;
  /** 마지막 휘두르기 (무기 그림 각도) */
  lastSwing = { time: -9, step: 0 };
  /** 몬스터 피격 깜빡임은 세계의 hitAt 을 쓰고, 주인공 피격은 여기 */
  hurtAt = -9;
  private seed = 1;

  rand(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  burst(x: number, y: number, n: number, colors: string[], speed = 60, fall = true, size = 2, life = 0.5): void {
    for (let i = 0; i < n; i++) {
      const a = this.rand() * Math.PI * 2;
      const s = speed * (0.4 + this.rand() * 0.8);
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s * 0.6,
        z: fall ? 4 : 0,
        vz: fall ? 40 + this.rand() * 60 : 0,
        life: life * (0.6 + this.rand() * 0.6),
        max: life,
        color: colors[i % colors.length],
        size,
        fall,
      });
    }
  }

  text(x: number, y: number, text: string, color: string, big = false, life = 0.8): void {
    // 겹치지 않게 살짝 흩뜨린다
    this.texts.push({ x: x + (this.rand() - 0.5) * 10, y, text, color, life, max: life, big });
  }

  ring(x: number, y: number, r: number, color: string, life = 0.35, fill = false): void {
    this.rings.push({ x, y, r, life, max: life, color, fill });
  }

  addShake(a: number): void {
    this.shake = Math.min(8, Math.max(this.shake, a));
  }

  /** 세계 사건 → 효과 */
  onEvent(e: WorldEvent, time: number, swingColor: string): void {
    switch (e.kind) {
      case 'swing':
        this.swings.push({ x: e.at.x, y: e.at.y - 4, ang: Math.atan2(e.dir.y, e.dir.x), reach: e.reach, arc: (e.arc * Math.PI) / 180, rev: e.step % 2 === 1, life: 0.16, max: 0.16, color: swingColor });
        this.lastSwing = { time, step: e.step };
        break;
      case 'hit':
        this.text(e.at.x, e.at.y - 14, String(e.amount), e.crit ? '#ffd84a' : e.skill ? '#9ad8ff' : '#ffffff', e.crit, e.crit ? 1 : 0.7);
        this.burst(e.at.x, e.at.y - 4, e.crit ? 7 : 4, e.crit ? ['#ffd84a', '#ffffff'] : ['#ffffff', '#ffe8c8'], e.crit ? 90 : 60, false, e.crit ? 2 : 1, 0.25);
        if (e.crit) {
          this.addShake(2);
          this.hitstop = Math.max(this.hitstop, 0.04);
        }
        break;
      case 'kill':
        if (!e.boss) this.corpses.push({ defId: e.defId, x: e.at.x, y: e.at.y, r: 8, life: 0.45, max: 0.45 });
        else this.corpses.push({ defId: e.defId, x: e.at.x, y: e.at.y, r: 20, life: 1.2, max: 1.2 });
        this.burst(e.at.x, e.at.y, e.boss ? 40 : e.rank === 'elite' ? 18 : 10, e.boss ? ['#ffd84a', '#ffffff', '#ff8ab8'] : ['#f4f0f8', '#c8c0d0', '#ffd84a'], e.boss ? 130 : 70, true, 2, 0.7);
        this.ring(e.at.x, e.at.y, e.boss ? 60 : 18, '#ffffff', 0.3);
        if (e.exp > 0) this.text(e.at.x, e.at.y - 24, `+${e.exp} EXP`, '#b8f070', false, 0.9);
        if (e.boss) {
          this.addShake(7);
          this.hitstop = 0.25;
          this.flash = { color: '#ffffff', life: 0.5, max: 0.5 };
        }
        break;
      case 'hurt':
        this.text(e.at.x, e.at.y - 20, String(e.amount), '#ff5a6a', false, 0.8);
        this.burst(e.at.x, e.at.y - 4, 5, ['#ff5a6a', '#ffffff'], 60, false, 1, 0.3);
        this.addShake(3);
        this.hurtAt = time;
        break;
      case 'roll':
        this.burst(e.at.x, e.at.y + 4, 6, ['#e8dcc8', '#c8b8a0'], 30, false, 2, 0.35);
        break;
      case 'explode':
        this.ring(e.at.x, e.at.y, e.r, e.tag === 'blink' ? '#c8a0ff' : '#ffb04a', 0.35, true);
        this.burst(e.at.x, e.at.y, 14, e.tag === 'blink' ? ['#c8a0ff', '#ffffff'] : ['#ffb04a', '#ff6a3a', '#ffe07a'], 110, false, 2, 0.45);
        this.addShake(e.tag === 'blink' ? 1 : 3);
        break;
      case 'chain': {
        const pts: Vec[] = [e.from];
        const n = 6;
        for (let i = 1; i < n; i++) {
          const t = i / n;
          pts.push({ x: e.from.x + (e.to.x - e.from.x) * t + (this.rand() - 0.5) * 12, y: e.from.y + (e.to.y - e.from.y) * t + (this.rand() - 0.5) * 12 - 4 });
        }
        pts.push(e.to);
        this.bolts.push({ pts, life: 0.22, max: 0.22, color: '#fff27a' });
        break;
      }
      case 'spawn':
        this.ring(e.at.x, e.at.y, e.rank === 'boss' ? 40 : 14, e.rank === 'elite' ? '#ffd84a' : '#c8b0ff', 0.4);
        break;
      case 'pickup':
        // 주운 것은 그 자리에 작게 떠오른다 (화면 가운데 알림 대신)
        if (e.drop === 'potion') this.text(e.at.x, e.at.y - 14, '사탕', '#ff8aa0', false, 0.8);
        else if (e.drop === 'mat' && e.mat) this.text(e.at.x, e.at.y - 14, PICK_NAME[e.mat] ?? '', '#d8c8ff', false, 0.8);
        if (e.drop === 'gold') this.text(e.at.x, e.at.y - 10, `+${e.gold}`, '#ffd84a', false, 0.7);
        this.burst(e.at.x, e.at.y, 4, ['#ffffff', '#ffd84a'], 30, false, 1, 0.3);
        break;
      case 'levelUp':
        this.flash = { color: '#fff4c0', life: 0.4, max: 0.4 };
        break;
      case 'heal':
        break;
      case 'phoenix':
        this.flash = { color: '#ffb04a', life: 0.6, max: 0.6 };
        break;
      case 'bossPhase':
        this.addShake(5);
        this.flash = { color: '#ff5a6a', life: 0.35, max: 0.35 };
        break;
      case 'riftClear':
        this.ring(e.at.x, e.at.y, 60, '#c8b0ff', 0.6);
        break;
      case 'tag': {
        // 바꿔 들기: 들어서는 동료 색 고리 + 별 가루
        const col = { toby: '#9ad8ff', bori: '#ffb070', ruru: '#9af0a0', nabi: '#d8b0ff' }[e.to];
        this.ring(e.at.x, e.at.y, e.forced ? 50 : 40, col, 0.35, true);
        this.ring(e.at.x, e.at.y, 26, '#ffffff', 0.25);
        this.burst(e.at.x, e.at.y - 6, 14, [col, '#ffffff', '#ffd84a'], 110, false, 2, 0.45);
        this.addShake(e.forced ? 4 : 2);
        break;
      }
      case 'freeze':
        this.flash = { color: '#c8ecff', life: 0.5, max: 0.5 };
        break;
      case 'caught':
        this.addShake(6);
        this.flash = { color: '#ff5a6a', life: 0.4, max: 0.4 };
        break;
      case 'friend':
        this.flash = { color: '#9af0c0', life: 0.3, max: 0.3 };
        break;
      default:
        break;
    }
  }

  update(dt: number): void {
    this.shake = Math.max(0, this.shake - dt * 20);
    this.hitstop = Math.max(0, this.hitstop - dt);
    if (this.flash) {
      this.flash.life -= dt;
      if (this.flash.life <= 0) this.flash = null;
    }
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const k = Math.exp(-3 * dt);
      p.vx *= k;
      p.vy *= k;
      if (p.fall) {
        p.vz -= 260 * dt;
        p.z += p.vz * dt;
        if (p.z < 0) {
          p.z = 0;
          p.vz *= -0.35;
        }
      }
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const t of this.texts) {
      t.life -= dt;
      t.y -= dt * (t.big ? 26 : 20);
    }
    this.texts = this.texts.filter((t) => t.life > 0);
    for (const c of this.corpses) c.life -= dt;
    this.corpses = this.corpses.filter((c) => c.life > 0);
    if (this.cinema && (this.cinema.life -= dt) <= 0) this.cinema = null;
    for (const s of this.swings) s.life -= dt;
    this.swings = this.swings.filter((s) => s.life > 0);
    for (const r of this.rings) r.life -= dt;
    this.rings = this.rings.filter((r) => r.life > 0);
    for (const b of this.bolts) b.life -= dt;
    this.bolts = this.bolts.filter((b) => b.life > 0);
    // 너무 많아지지 않게
    if (this.particles.length > 600) this.particles.splice(0, this.particles.length - 600);
    if (this.texts.length > 60) this.texts.splice(0, this.texts.length - 60);
  }

  clear(): void {
    this.particles = [];
    this.texts = [];
    this.swings = [];
    this.rings = [];
    this.bolts = [];
    this.shake = 0;
    this.flash = null;
    this.corpses = [];
    this.cinema = null;
  }
}
