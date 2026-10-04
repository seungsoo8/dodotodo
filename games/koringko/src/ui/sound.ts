/** Web Audio 로 즉석에서 만드는 소리 (소리 파일 없음) */
import type { HeroId } from '../core/types.ts';
import type { WorldEvent } from '../core/world.ts';
import { STEPS, TRACKS, stepNotes, type Note, type TrackId } from './audio/music.ts';
import { SFX, skillSound, type Layer, type SfxId, type SoundSpec } from './audio/sfx.ts';
import { Throttle } from './throttle.ts';

const LOOKAHEAD = 0.15;
const midiHz = (m: number) => 440 * 2 ** ((m - 69) / 12);

export class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private throttle = new Throttle(0.04, { hit: 0.05, crit: 0.06, kill: 0.05, gold: 0.06, monsterShot: 0.12, windup: 0.3, explode: 0.08, move: 0.03 });
  vol = { sfx: 0.8, bgm: 0.5 };
  private track: TrackId | null = null;
  private pending: TrackId | null = null;
  private level = 0;
  private step = 0;
  private nextAt = 0;

  setVolume(v: { sfx: number; bgm: number }): void {
    this.vol = { ...v };
    const ctx = this.ctx;
    if (!ctx || !this.sfxBus || !this.musicBus) return;
    this.sfxBus.gain.setTargetAtTime(this.vol.sfx, ctx.currentTime, 0.02);
    this.musicBus.gain.setTargetAtTime(this.vol.bgm * 0.55, ctx.currentTime, 0.05);
  }

  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    try {
      const ctx = new AudioContext();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 12;
      comp.ratio.value = 4;
      comp.connect(ctx.destination);
      this.master = ctx.createGain();
      this.master.connect(comp);
      this.sfxBus = ctx.createGain();
      this.sfxBus.connect(this.master);
      this.musicBus = ctx.createGain();
      this.musicBus.connect(this.master);
      this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.ctx = ctx;
      this.setVolume(this.vol);
    } catch {
      this.ctx = null;
    }
  }

  private layer(ctx: AudioContext, l: Layer, at: number, bus: AudioNode): void {
    const start = at + (l.delay ?? 0);
    const end = start + l.dur;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(l.gain, start + Math.min(0.005, l.dur / 4));
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    gain.connect(bus);
    if (l.kind === 'noise' && this.noise) {
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = l.filter ?? 'lowpass';
      f.Q.value = l.q ?? 1;
      f.frequency.setValueAtTime(l.freq, start);
      if (l.to) f.frequency.exponentialRampToValueAtTime(l.to, end);
      src.connect(f).connect(gain);
      src.start(start, Math.random() * 0.5);
      src.stop(end + 0.02);
      return;
    }
    const osc = ctx.createOscillator();
    osc.type = l.wave ?? 'square';
    osc.frequency.setValueAtTime(l.freq, start);
    if (l.to) osc.frequency.exponentialRampToValueAtTime(l.to, end);
    osc.connect(gain);
    osc.start(start);
    osc.stop(end + 0.02);
  }

  play(key: string, spec: SoundSpec, pan = 0): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.sfxBus || this.vol.sfx <= 0) return;
    if (!this.throttle.allow(key, ctx.currentTime)) return;
    let bus: AudioNode = this.sfxBus;
    if (pan) {
      const p = ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan));
      p.connect(this.sfxBus);
      bus = p;
    }
    for (const l of spec) this.layer(ctx, l, ctx.currentTime, bus);
  }

  sfx(id: SfxId, pan = 0): void {
    this.play(id, SFX[id], pan);
  }

  /** 세계 사건 소리. px: 주인공 x (좌우 위치) */
  events(evs: WorldEvent[], hero: HeroId, px: number): void {
    const pan = (x: number) => (x - px) / 240;
    for (const e of evs) {
      switch (e.kind) {
        case 'swing':
          this.sfx(hero === 'bori' ? 'axeSwing' : 'swordSwing');
          break;
        case 'shot':
          if (e.projectile === 'arrow') this.sfx('bowShot');
          else if (e.projectile === 'orb') this.sfx('orbShot');
          break;
        case 'hit':
          this.sfx(e.crit ? 'crit' : 'hit', pan(e.at.x));
          break;
        case 'kill':
          this.sfx(e.rank === 'normal' ? 'kill' : 'eliteKill', pan(e.at.x));
          break;
        case 'hurt':
          this.sfx('hurt');
          break;
        case 'roll':
          this.sfx('roll');
          break;
        case 'skill':
          this.play(`skill-${e.id}`, skillSound(e.id));
          break;
        case 'explode':
          this.sfx('explode', pan(e.at.x));
          break;
        case 'chain':
          this.sfx('chain');
          break;
        case 'monsterShot':
          this.sfx('monsterShot', pan(e.at.x));
          break;
        case 'windup':
          this.sfx('windup', pan(e.at.x));
          break;
        case 'spawn':
          if (e.rank !== 'normal') this.sfx('spawnElite', pan(e.at.x));
          break;
        case 'pickup':
          if (e.drop === 'gold') this.sfx('gold');
          else if (e.drop === 'part') this.sfx('rareItem');
          else this.sfx('item');
          break;
        case 'potion':
          this.sfx('potion');
          break;
        case 'levelUp':
          this.sfx('levelUp');
          break;
        case 'bossIntro':
          this.sfx('bossIntro');
          break;
        case 'bossPhase':
          this.sfx('bossPhase');
          break;
        case 'bossDown':
          this.sfx('bossDown');
          break;
        case 'riftGuardian':
          this.sfx('spawnElite');
          break;
        case 'riftClear':
          this.sfx('riftClear');
          break;
        case 'phoenix':
          this.sfx('phoenix');
          break;
        case 'died':
          this.sfx('died');
          break;
        case 'noSp':
          this.sfx('noSp');
          break;
        case 'portal':
        case 'enter':
          this.sfx('portal');
          break;
        case 'locked':
          this.sfx('locked');
          break;
        case 'quest':
          if (e.state === 'ready') this.sfx('quest');
          break;
        case 'tag':
          this.sfx('tag');
          break;
        case 'duo':
          this.sfx('duo');
          break;
        case 'link':
          this.sfx('link');
          break;
        case 'windEmpty':
          this.sfx('windEmpty');
          break;
        case 'bossUnwound':
          this.sfx('unwind');
          break;
        case 'bossRewound':
          this.sfx('rewind');
          break;
        case 'bossSplit':
          this.sfx('split');
          break;
        case 'bossMerge':
          this.sfx('merge');
          break;
        case 'heroDown':
          this.sfx('heroDown');
          break;
        case 'heroUp':
          this.sfx('heroUp');
          break;
        case 'overwind':
          this.sfx('overwind');
          break;
        case 'friend':
          this.sfx('friend');
          break;
        case 'join':
          this.sfx('join');
          break;
        case 'chest':
          this.sfx('chest');
          break;
        case 'errand':
          this.sfx('item');
          break;
        case 'rescueStart':
        case 'rescueWave':
          this.sfx('rescueStart');
          break;
        case 'freezeWarn':
          // 쿵 · 쿵 · 쿵 다가오는 발소리
          for (let i = 0; i < 3; i++) this.play(`footstep${i}`, SFX.footstep.map((l) => ({ ...l, delay: i * 0.9, gain: l.gain * (0.6 + i * 0.25) })));
          break;
        case 'freeze':
          this.sfx(e.type === 'alarm' ? 'alarm' : 'freeze');
          break;
        case 'caught':
          this.sfx('caught');
          break;
        case 'freezeOk':
          this.sfx('freezeOk');
          break;
        default:
          break;
      }
    }
  }

  /** 음악: 매 프레임 */
  music(track: TrackId | null, level: number): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.musicBus) return;
    const now = ctx.currentTime;
    if (track !== this.track) this.pending = track;
    if (this.pending !== this.track && (this.track === null || this.step % 16 === 0)) {
      this.track = this.pending;
      this.step = 0;
      this.nextAt = Math.max(this.nextAt, now + 0.05);
    }
    this.level = level;
    if (!this.track) return;
    const t = TRACKS[this.track];
    const dur = 60 / t.bpm / 4;
    if (this.nextAt < now - 0.5) this.nextAt = now + 0.05;
    while (this.nextAt < now + LOOKAHEAD) {
      if (this.vol.bgm > 0) for (const n of stepNotes(this.track, this.step, this.level)) this.note(ctx, n, this.nextAt, dur);
      this.step = (this.step + 1) % STEPS;
      this.nextAt += dur;
      if (this.pending !== this.track && this.step % 16 === 0) break;
    }
  }

  private note(ctx: AudioContext, n: Note, at: number, d: number): void {
    const bus = this.musicBus!;
    const hz = n.midi !== undefined ? midiHz(n.midi) : 0;
    switch (n.inst) {
      case 'bass':
        this.layer(ctx, { kind: 'tone', wave: 'triangle', freq: hz, dur: d * 1.8, gain: 0.16 }, at, bus);
        break;
      case 'arp':
        this.layer(ctx, { kind: 'tone', wave: 'square', freq: hz, dur: d * 0.9, gain: 0.022 }, at, bus);
        break;
      case 'lead':
        this.layer(ctx, { kind: 'tone', wave: 'square', freq: hz, dur: d * 1.7, gain: 0.045 }, at, bus);
        this.layer(ctx, { kind: 'tone', wave: 'triangle', freq: hz * 2, dur: d * 1.2, gain: 0.014 }, at, bus);
        break;
      case 'kick':
        this.layer(ctx, { kind: 'tone', wave: 'sine', freq: 150, to: 40, dur: 0.12, gain: 0.18 }, at, bus);
        break;
      case 'snare':
        this.layer(ctx, { kind: 'noise', filter: 'bandpass', freq: 1800, to: 900, q: 0.8, dur: 0.1, gain: 0.07 }, at, bus);
        break;
      case 'hat':
        this.layer(ctx, { kind: 'noise', filter: 'highpass', freq: 7000, dur: 0.035, gain: 0.025 }, at, bus);
        break;
    }
  }
}
