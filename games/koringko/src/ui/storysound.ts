/** 이야기 소리: 효과음 + 「하루의 테마」 악보 연주 (피아노 · 오르골 · 바탕 화음 · 베이스 · 심장) */
import { fadeTau, humanize, SONGS, type SNote, type SongId } from './audio/score.ts';
import { SongCursor } from './audio/cursor.ts';
import type { Layer } from './audio/sfx.ts';
import { blipSpec, jitterSpec, lastVoiced, STORY_SFX, stepSpec, voiceSpec, type Floor } from './audio/storysfx.ts';

const LOOKAHEAD = 0.2;
const midiHz = (m: number) => 440 * 2 ** ((m - 69) / 12);

export class StorySound {
  private ctx: AudioContext | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private songGain: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private rain: { src: AudioBufferSourceNode; gain: GainNode; filter: BiquadFilterNode } | null = null;
  vol = { sfx: 0.8, bgm: 0.6 };
  /** 지금 치는 곡과 자리 (탐험 곡은 돌아오면 이어서) */
  private cursor = new SongCursor();
  private pending: SongId | null = null;
  private fadeT = 0.25;
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

  /**
   * 효과음 하나. 말소리(voice:누구)는 지금 대사(line)를 주면 그 글자의 모음 · 문장 부호로 블립 높이를 정한다.
   * 그 밖의 소리는 되풀이돼도 똑같지 않게 조금씩 흔든다.
   */
  sfx(name: string, line?: { text: string; shown: number } | null): void {
    const ctx = this.ctx;
    const spec = this.specOf(name, line);
    if (!ctx || ctx.state !== 'running' || !this.sfxBus || !spec || this.vol.sfx <= 0) return;
    const t = this.last.get(name) ?? -1;
    if (ctx.currentTime - t < 0.04) return;
    this.last.set(name, ctx.currentTime);
    for (const l of spec) this.layer(ctx, l, ctx.currentTime, this.sfxBus);
  }

  private specOf(name: string, line?: { text: string; shown: number } | null) {
    if (name.startsWith('voice:')) {
      const who = name.slice(6);
      const at = line ? lastVoiced(line.text, line.shown) : -1;
      return at >= 0 && line ? blipSpec(who, line.text, at) : voiceSpec(who, Math.random());
    }
    if (name.startsWith('step:')) return stepSpec(this.floor, name.slice(5) === 'toy' ? 'toy' : 'human', Math.random());
    const spec = STORY_SFX[name];
    return spec ? jitterSpec(spec, Math.random) : undefined;
  }

  /** 비 소리 (0 = 그침 · 1 = 비 맞는 곳 · 그 사이는 창 너머로 먹먹하게) */
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
      this.rain = { src, gain, filter: f };
    }
    if (!this.rain) return;
    this.rain.gain.gain.setTargetAtTime(Math.max(0.0001, v * 0.05), ctx.currentTime, 0.4);
    // 창 너머 비는 높은 소리가 깎여 먹먹하다
    if (v > 0) this.rain.filter.frequency.setTargetAtTime(v >= 1 ? 2400 : 900, ctx.currentTime, 0.4);
  }

  /**
   * 음악: 매 프레임. 곡이 바뀌면 소리를 줄였다가 (fade 초, 없으면 짧게) 새 곡.
   * 탐험 곡은 떠났던 마디부터 이어서, 연주는 세기 · 시각을 조금씩 흔든다.
   */
  music(id: SongId | null, fade?: number): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.songGain) return;
    const now = ctx.currentTime;
    const g = this.songGain.gain;
    if (id !== this.pending) {
      this.pending = id;
      this.fadeT = fadeTau(fade);
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      // 줄이던 중에 지금 곡으로 되돌아오면 다시 키운다
      g.setTargetAtTime(id !== null && id === this.cursor.song ? 1 : 0.0001, now, this.fadeT);
    }
    const c = this.cursor;
    if (this.pending !== c.song && (c.song === null || g.value < 0.02)) {
      c.switchTo(this.pending);
      this.nextAt = now + 0.08;
      g.cancelScheduledValues(now);
      g.setValueAtTime(Math.max(0.0001, g.value), now);
      g.setTargetAtTime(1, now + 0.05, Math.max(0.3, this.fadeT));
    }
    if (!c.song) return;
    const dur = 60 / SONGS[c.song].bpm / 4;
    if (this.nextAt < now - 0.5) this.nextAt = now + 0.05;
    while (this.nextAt < now + LOOKAHEAD) {
      const pos = c.step;
      const notes = c.next();
      if (this.vol.bgm > 0)
        for (const n of notes) {
          const h = humanize(n, pos, Math.random);
          this.note(ctx, n, Math.max(now, this.nextAt + h.dt), dur, h.gain, h.len);
        }
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

  /** k: 세기 배수 · lk: 길이 배수 (사람 손 흔들림) */
  private note(ctx: AudioContext, n: SNote, at: number, step: number, k = 1, lk = 1): void {
    const hz = midiHz(n.midi);
    const len = n.len * step * lk;
    const lead = n.part === 'lead';
    switch (n.inst) {
      case 'piano':
        // 망치 소리처럼 빨리 올라와 천천히 사그라든다 (배음 하나 더)
        this.voice(ctx, 'triangle', hz, at, 0.006, Math.min(0.5, len * 0.6), Math.min(1.6, 0.4 + len), (lead ? 0.11 : 0.045) * k);
        this.voice(ctx, 'sine', hz * 2, at, 0.004, 0.08, Math.min(0.8, 0.2 + len * 0.5), (lead ? 0.035 : 0.015) * k);
        break;
      case 'box':
        // 오르골: 높은 종소리
        this.voice(ctx, 'sine', hz * 2, at, 0.003, 0.05, 0.9, (n.part === 'comp' ? 0.03 : 0.07) * k);
        this.voice(ctx, 'sine', hz * 4 * 1.003, at, 0.002, 0.02, 0.35, 0.015 * k);
        break;
      case 'pad':
        this.voice(ctx, 'triangle', hz, at, 0.5, len * 0.6, 0.8, 0.018 * k);
        this.voice(ctx, 'sine', hz * 1.004, at, 0.6, len * 0.6, 0.8, 0.014 * k);
        break;
      case 'bass':
        this.voice(ctx, 'triangle', hz, at, 0.01, len * 0.5, 0.4, 0.09 * k);
        break;
      case 'heart': {
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(0.22 * k, at + 0.01);
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
