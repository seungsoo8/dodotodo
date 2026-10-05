/** 이야기 소리: 효과음 + 「하루의 테마」 악보 연주 (피아노 · 오르골 · 바탕 화음 · 베이스 · 심장) */
import { songNotes, songSteps, SONGS, type SNote, type SongId } from './audio/score.ts';
import type { Layer } from './audio/sfx.ts';
import { STORY_SFX, stepSpec, voiceSpec, type Floor } from './audio/storysfx.ts';

const LOOKAHEAD = 0.2;
const midiHz = (m: number) => 440 * 2 ** ((m - 69) / 12);

export class StorySound {
  private ctx: AudioContext | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private songGain: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private rain: { src: AudioBufferSourceNode; gain: GainNode } | null = null;
  vol = { sfx: 0.8, bgm: 0.6 };
  private song: SongId | null = null;
  private pending: SongId | null = null;
  private step = 0;
  private nextAt = 0;
  private last = new Map<string, number>();

  setVolume(v: { sfx: number; bgm: number }): void {
    this.vol = { ...v };
    const ctx = this.ctx;
    if (!ctx || !this.sfxBus || !this.musicBus) return;
    this.sfxBus.gain.setTargetAtTime(this.vol.sfx, ctx.currentTime, 0.02);
    this.musicBus.gain.setTargetAtTime(this.vol.bgm * 0.7, ctx.currentTime, 0.05);
  }

  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    try {
      const ctx = new AudioContext();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.ratio.value = 3;
      comp.connect(ctx.destination);
      // 아주 짧은 잔향 (방 울림)
      const verb = ctx.createConvolver();
      const len = Math.floor(ctx.sampleRate * 1.6);
      const ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
      }
      verb.buffer = ir;
      const wet = ctx.createGain();
      wet.gain.value = 0.28;
      verb.connect(wet).connect(comp);
      this.sfxBus = ctx.createGain();
      this.sfxBus.connect(comp);
      this.musicBus = ctx.createGain();
      this.musicBus.connect(comp);
      this.musicBus.connect(verb);
      this.songGain = ctx.createGain();
      this.songGain.connect(this.musicBus);
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
    const attack = l.attack ?? Math.min(0.006, l.dur / 4);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(l.gain, start + attack);
    if (l.release !== undefined) gain.gain.setValueAtTime(l.gain, Math.max(start + attack, end - l.release));
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    let out: AudioNode = gain;
    const lfos: OscillatorNode[] = [];
    /** 느린 발진기 하나를 param 에 더한다 (떨림 · 흔들림) */
    const lfo = (rate: number, amount: number, param: AudioParam) => {
      const o = ctx.createOscillator();
      o.frequency.value = rate;
      const g = ctx.createGain();
      g.gain.value = amount;
      o.connect(g).connect(param);
      lfos.push(o);
    };
    if (l.trem) {
      // 세기를 (1 - 깊이) ~ 1 사이로 흔든다
      const tg = ctx.createGain();
      tg.gain.value = 1 - l.trem.depth / 2;
      lfo(l.trem.rate, l.trem.depth / 2, tg.gain);
      gain.connect(tg);
      out = tg;
    }
    out.connect(bus);
    const run = (src: AudioScheduledSourceNode, offset?: number) => {
      if (offset === undefined) src.start(start);
      else (src as AudioBufferSourceNode).start(start, offset);
      src.stop(end + 0.02);
      for (const o of lfos) {
        o.start(start);
        o.stop(end + 0.02);
      }
    };
    if (l.kind === 'noise' && this.noise) {
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = l.filter ?? 'lowpass';
      f.Q.value = l.q ?? 1;
      f.frequency.setValueAtTime(l.freq, start);
      if (l.to) f.frequency.exponentialRampToValueAtTime(l.to, end);
      if (l.vib) lfo(l.vib.rate, l.vib.depth, f.frequency);
      src.connect(f).connect(gain);
      run(src, Math.random() * 0.5);
      return;
    }
    const osc = ctx.createOscillator();
    osc.type = l.wave ?? 'square';
    osc.frequency.setValueAtTime(l.freq, start);
    if (l.to) osc.frequency.exponentialRampToValueAtTime(l.to, end);
    if (l.vib) lfo(l.vib.rate, l.vib.depth, osc.frequency);
    osc.connect(gain);
    run(osc);
  }

  /** 발소리 바닥 (화면이 지금 방을 보고 정한다) */
  floor: Floor = 'toy';

  sfx(name: string): void {
    const ctx = this.ctx;
    const spec = name.startsWith('voice:') ? voiceSpec(name.slice(6), Math.random()) : name.startsWith('step:') ? stepSpec(this.floor, name.slice(5) === 'toy' ? 'toy' : 'human', Math.random()) : STORY_SFX[name];
    if (!ctx || ctx.state !== 'running' || !this.sfxBus || !spec || this.vol.sfx <= 0) return;
    const t = this.last.get(name) ?? -1;
    if (ctx.currentTime - t < 0.04) return;
    this.last.set(name, ctx.currentTime);
    for (const l of spec) this.layer(ctx, l, ctx.currentTime, this.sfxBus);
  }

  /** 비 소리 (0 = 그침) */
  rainLevel(v: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.noise || !this.sfxBus) return;
    if (v > 0 && !this.rain) {
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 2400;
      f.Q.value = 0.4;
      const gain = ctx.createGain();
      gain.gain.value = 0.0001;
      src.connect(f).connect(gain).connect(this.sfxBus);
      src.start();
      this.rain = { src, gain };
    }
    if (this.rain) this.rain.gain.gain.setTargetAtTime(Math.max(0.0001, v * 0.05), ctx.currentTime, 0.4);
  }

  /** 음악: 매 프레임 (곡이 바뀌면 마디 끝에서 넘어간다 · 소리를 줄였다가 새 곡) */
  music(id: SongId | null): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.songGain) return;
    const now = ctx.currentTime;
    if (id !== this.pending) {
      this.pending = id;
      this.songGain.gain.setTargetAtTime(0.0001, now, 0.25);
    }
    if (this.pending !== this.song && (this.song === null || this.nextAt - now < 0.05 || this.songGain.gain.value < 0.02)) {
      this.song = this.pending;
      this.step = 0;
      this.nextAt = now + 0.08;
      this.songGain.gain.cancelScheduledValues(now);
      this.songGain.gain.setTargetAtTime(1, now + 0.05, 0.3);
    }
    if (!this.song) return;
    const dur = 60 / SONGS[this.song].bpm / 4;
    if (this.nextAt < now - 0.5) this.nextAt = now + 0.05;
    while (this.nextAt < now + LOOKAHEAD) {
      if (this.vol.bgm > 0) for (const n of songNotes(this.song, this.step)) this.note(ctx, n, this.nextAt, dur);
      this.step = (this.step + 1) % songSteps(this.song);
      this.nextAt += dur;
    }
  }

  private voice(ctx: AudioContext, wave: OscillatorType, hz: number, at: number, attack: number, hold: number, release: number, gain: number): void {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + attack);
    g.gain.exponentialRampToValueAtTime(gain * 0.4, at + attack + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, at + attack + hold + release);
    g.connect(this.songGain!);
    const o = ctx.createOscillator();
    o.type = wave;
    o.frequency.setValueAtTime(hz, at);
    o.connect(g);
    o.start(at);
    o.stop(at + attack + hold + release + 0.05);
  }

  private note(ctx: AudioContext, n: SNote, at: number, step: number): void {
    const hz = midiHz(n.midi);
    const len = n.len * step;
    const lead = n.part === 'lead';
    switch (n.inst) {
      case 'piano':
        // 망치 소리처럼 빨리 올라와 천천히 사그라든다 (배음 하나 더)
        this.voice(ctx, 'triangle', hz, at, 0.006, Math.min(0.5, len * 0.6), Math.min(1.6, 0.4 + len), lead ? 0.11 : 0.045);
        this.voice(ctx, 'sine', hz * 2, at, 0.004, 0.08, Math.min(0.8, 0.2 + len * 0.5), lead ? 0.035 : 0.015);
        break;
      case 'box':
        // 오르골: 높은 종소리
        this.voice(ctx, 'sine', hz * 2, at, 0.003, 0.05, 0.9, n.part === 'comp' ? 0.03 : 0.07);
        this.voice(ctx, 'sine', hz * 4 * 1.003, at, 0.002, 0.02, 0.35, 0.015);
        break;
      case 'pad':
        this.voice(ctx, 'triangle', hz, at, 0.5, len * 0.6, 0.8, 0.018);
        this.voice(ctx, 'sine', hz * 1.004, at, 0.6, len * 0.6, 0.8, 0.014);
        break;
      case 'bass':
        this.voice(ctx, 'triangle', hz, at, 0.01, len * 0.5, 0.4, 0.09);
        break;
      case 'heart': {
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(0.22, at + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
        g.connect(this.songGain!);
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(70, at);
        o.frequency.exponentialRampToValueAtTime(38, at + 0.2);
        o.connect(g);
        o.start(at);
        o.stop(at + 0.25);
        break;
      }
    }
  }
}
