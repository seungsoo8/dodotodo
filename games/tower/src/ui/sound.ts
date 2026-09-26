import type { GameEvent, WeaponType } from '../core/types.ts';
import { Throttle } from './throttle.ts';

type Wave = OscillatorType;

interface Tone {
  freq: number;
  /** 끝 주파수 (미끄러지는 소리) */
  to?: number;
  dur: number;
  wave: Wave;
  gain: number;
  delay?: number;
}

const SHOT: Record<WeaponType, Tone> = {
  normal: { freq: 520, to: 380, dur: 0.05, wave: 'square', gain: 0.04 },
  pierce: { freq: 900, to: 600, dur: 0.06, wave: 'triangle', gain: 0.05 },
  magic: { freq: 1200, to: 1600, dur: 0.08, wave: 'sine', gain: 0.05 },
  siege: { freq: 140, to: 60, dur: 0.18, wave: 'sawtooth', gain: 0.06 },
  chaos: { freq: 300, to: 900, dur: 0.07, wave: 'square', gain: 0.035 },
};

/** Web Audio 로 즉석에서 만드는 효과음 (소리 파일 없음) */
export class Sound {
  private ctx: AudioContext | null = null;
  private throttle = new Throttle(0.05, { towerHit: 0.15, kill: 0.04, hit: 0.06 });
  muted = false;

  /** 브라우저는 사용자 입력 뒤에만 소리를 허용하므로 첫 클릭·키 입력 때 부른다 */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    try {
      this.ctx = new AudioContext();
    } catch {
      this.ctx = null;
    }
  }

  private play(key: string, tones: Tone[]): void {
    const ctx = this.ctx;
    if (this.muted || !ctx || ctx.state !== 'running') return;
    if (!this.throttle.allow(key, ctx.currentTime)) return;
    for (const t of tones) {
      const start = ctx.currentTime + (t.delay ?? 0);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = t.wave;
      osc.frequency.setValueAtTime(t.freq, start);
      if (t.to) osc.frequency.exponentialRampToValueAtTime(t.to, start + t.dur);
      gain.gain.setValueAtTime(t.gain, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + t.dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + t.dur + 0.02);
    }
  }

  /** 게임 이벤트에 맞는 소리를 낸다 */
  event(ev: GameEvent): void {
    switch (ev.kind) {
      case 'shot':
        this.play(`shot-${ev.weaponType}`, [SHOT[ev.weaponType]]);
        break;
      case 'hit':
        if (ev.crit) this.play('crit', [{ freq: 1800, to: 2400, dur: 0.05, wave: 'square', gain: 0.03 }]);
        break;
      case 'kill':
        this.play('kill', [{ freq: 1300, to: 1900, dur: 0.06, wave: 'triangle', gain: 0.04 }]);
        break;
      case 'towerHit':
        this.play('towerHit', [{ freq: 90, to: 50, dur: 0.12, wave: 'sawtooth', gain: 0.06 }]);
        break;
      case 'round':
        this.play('round', [
          { freq: 523, dur: 0.1, wave: 'triangle', gain: 0.06 },
          { freq: 784, dur: 0.14, wave: 'triangle', gain: 0.06, delay: 0.1 },
        ]);
        break;
      case 'elite':
        this.play('elite', [
          { freq: 220, dur: 0.18, wave: 'square', gain: 0.05 },
          { freq: 196, dur: 0.25, wave: 'square', gain: 0.05, delay: 0.18 },
        ]);
        break;
      case 'boss':
        this.play('boss', [
          { freq: 110, dur: 0.3, wave: 'sawtooth', gain: 0.07 },
          { freq: 104, dur: 0.3, wave: 'sawtooth', gain: 0.07, delay: 0.3 },
          { freq: 98, dur: 0.6, wave: 'sawtooth', gain: 0.07, delay: 0.6 },
        ]);
        break;
      case 'bossDown':
        this.play(
          'bossDown',
          [523, 659, 784, 1047, 1319].map((freq, i) => ({ freq, dur: 0.16, wave: 'square' as Wave, gain: 0.05, delay: i * 0.09 })),
        );
        break;
      case 'splash':
        this.play('splash', [{ freq: 120, to: 40, dur: 0.2, wave: 'sawtooth', gain: 0.035, delay: 0.1 }]);
        break;
    }
  }

  buy(): void {
    this.play('buy', [
      { freq: 988, dur: 0.06, wave: 'square', gain: 0.04 },
      { freq: 1319, dur: 0.1, wave: 'square', gain: 0.04, delay: 0.06 },
    ]);
  }

  reroll(): void {
    this.play('reroll', [{ freq: 400, to: 1200, dur: 0.12, wave: 'triangle', gain: 0.05 }]);
  }

  denied(): void {
    this.play('denied', [{ freq: 160, dur: 0.12, wave: 'square', gain: 0.04 }]);
  }

  end(won: boolean): void {
    const notes = won ? [523, 659, 784, 1047] : [392, 330, 262, 196];
    this.play(
      'end',
      notes.map((freq, i) => ({ freq, dur: 0.2, wave: 'triangle' as Wave, gain: 0.07, delay: i * 0.18 })),
    );
  }
}
