/**
 * 이야기 소리: 효과음 + 악보 연주 (피아노 · 펠트 피아노 · 오르골 · 첼레스타 · 현 · 뜯는 줄 · 바탕 화음 · 베이스 · 심장 · 가벼운 타악기).
 * 음악은 크로스페이드 데크(audio/decks.ts)로: 곡이 바뀌면 옛 곡이 줄어드는 동안 새 곡이 올라오고, 탐험 곡은 떠난 마디부터 이어서.
 */
import { humanize, songBar, songSteps, SONGS, type SNote, type SongId } from './audio/score.ts';
import { SongCursor } from './audio/cursor.ts';
import { Decks } from './audio/decks.ts';
import type { Layer } from './audio/sfx.ts';
import { ambienceGain, type AmbLayer } from './audio/ambience.ts';
import { blipSpec, jitterSpec, lastVoiced, STORY_SFX, stepSpec, voiceSpec, type Floor } from './audio/storysfx.ts';

const LOOKAHEAD = 0.2;
const midiHz = (m: number) => 440 * 2 ** ((m - 69) / 12);

export class StorySound {
  private ctx: AudioContext | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private rain: { src: AudioBufferSourceNode; gain: GainNode; filter: BiquadFilterNode } | null = null;
  /** 바깥 소리: 버스(× 0.2, 효과음 버스를 지나 볼륨을 따름) → 먹먹함 필터 → 압축기, 고리마다 세기 */
  private amb: { bus: GainNode; muffle: BiquadFilterNode; loops: Map<string, GainNode>; once: Map<string, { gain: GainNode; at: number }>; tickAt: number; tick: number; key: string; layers: AmbLayer[] } | null = null;
  vol = { sfx: 0.8, bgm: 0.6 };
  /** 곡 데크들 (크로스페이드 · 이어 틀기) */
  private decks = new Decks();
  /** 데크마다 소리 세기 노드 · 다음 칸 시각 */
  private deckOut = new Map<number, { gain: GainNode; nextAt: number }>();
  /** 한 번만 트는 신호 (음악 위에 겹친다) */
  private stings: { cursor: SongCursor; gain: GainNode; nextAt: number }[] = [];
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
   * 바깥 소리 층 (매 프레임): 계속 흐르는 고리(잡음 · 발진기)는 세기만 옮기고, 가끔 나는 소리는 간격마다 한 번.
   * 시계 째깍은 1초마다 째 · 깍을 번갈아. 기억 방(muffle)은 높은 소리를 깎아 먹먹하게.
   */
  ambience(layers: AmbLayer[]): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.sfxBus || !this.noise) return;
    const now = ctx.currentTime;
    if (!this.amb) {
      const bus = ctx.createGain();
      bus.gain.value = ambienceGain(1, 1);
      const muffle = ctx.createBiquadFilter();
      muffle.type = 'lowpass';
      muffle.frequency.value = 18000;
      // 효과음 버스를 지나므로 효과음 볼륨 · 끄기를 그대로 따른다
      bus.connect(muffle).connect(this.sfxBus);
      this.amb = { bus, muffle, loops: new Map(), once: new Map(), tickAt: now, tick: 0, key: '', layers: [] };
    }
    const A = this.amb;
    const key = layers.map((l) => `${l.name}${l.gain}${l.muffle ? 'm' : ''}`).join('|');
    if (key !== A.key) {
      A.key = key;
      A.layers = layers;
      const want = new Map(layers.filter((l) => !l.every).map((l) => [l.name, l.gain]));
      for (const [name, g] of A.loops) if (!want.has(name)) g.gain.setTargetAtTime(0.0001, now, 0.8);
      for (const [name, v] of want) {
        if (name === 'clockTick') continue;
        let g = A.loops.get(name);
        if (!g) {
          g = this.ambLoop(ctx, name, A.bus) ?? undefined;
          if (!g) continue;
          A.loops.set(name, g);
        }
        g.gain.setTargetAtTime(Math.max(0.0001, v), now, 0.8);
      }
      A.muffle.frequency.setTargetAtTime(layers.some((l) => l.muffle) ? 650 : 18000, now, 0.4);
      for (const l of layers) if (l.every && !A.once.has(l.name)) {
        const gain = ctx.createGain();
        gain.connect(A.bus);
        A.once.set(l.name, { gain, at: now + l.every[0] * (0.3 + Math.random() * 0.7) });
      }
    }
    if (this.vol.sfx <= 0) return;
    // 시계: 째 · 깍
    const clock = A.layers.find((l) => l.name === 'clockTick');
    if (clock) {
      if (A.tickAt < now - 0.5) A.tickAt = now + 0.05;
      while (A.tickAt < now + LOOKAHEAD) {
        this.layer(ctx, { kind: 'noise', freq: A.tick % 2 ? 2600 : 3400, filter: 'bandpass', q: 6, dur: 0.035, gain: clock.gain * 0.9, attack: 0.002 }, A.tickAt, A.bus);
        A.tick++;
        A.tickAt += 1;
      }
    }
    for (const l of A.layers) {
      if (!l.every) continue;
      const o = A.once.get(l.name);
      if (!o || now < o.at) continue;
      o.at = now + l.every[0] + Math.random() * (l.every[1] - l.every[0]);
      const spec = this.specOf(l.name);
      if (!spec) continue;
      o.gain.gain.setValueAtTime(l.gain * 2, now);
      for (const s of spec) this.layer(ctx, s, now, o.gain);
    }
  }

  /** 계속 흐르는 고리 하나 (처음엔 소리 없음) */
  private ambLoop(ctx: AudioContext, name: string, bus: AudioNode): GainNode | null {
    const g = ctx.createGain();
    g.gain.value = 0.0001;
    g.connect(bus);
    const lfo = (rate: number, amount: number, param: AudioParam) => {
      const o = ctx.createOscillator();
      o.frequency.value = rate;
      const k = ctx.createGain();
      k.gain.value = amount;
      o.connect(k).connect(param);
      o.start();
    };
    const noise = (type: BiquadFilterType, hz: number, q: number) => {
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = hz;
      f.Q.value = q;
      const sg = ctx.createGain();
      src.connect(f).connect(sg).connect(g);
      src.start(ctx.currentTime, Math.random());
      return { f, sg };
    };
    switch (name) {
      case 'roomTone':
        noise('lowpass', 160, 0.5);
        break;
      case 'traffic': {
        // 먼 큰길: 낮은 웅웅이 천천히 밀려왔다 멀어진다
        const { sg } = noise('lowpass', 280, 0.6);
        sg.gain.value = 0.7;
        lfo(0.045, 0.3, sg.gain);
        break;
      }
      case 'wind': {
        const { f, sg } = noise('bandpass', 520, 0.8);
        lfo(0.11, 260, f.frequency);
        sg.gain.value = 0.75;
        lfo(0.07, 0.25, sg.gain);
        break;
      }
      case 'waterHum':
        noise('bandpass', 1300, 3);
        break;
      case 'fridgeHum':
        for (const [hz, k] of [[58, 0.6], [117, 0.3], [176, 0.12]] as const) {
          const o = ctx.createOscillator();
          o.type = 'sine';
          o.frequency.value = hz;
          const og = ctx.createGain();
          og.gain.value = k;
          o.connect(og).connect(g);
          o.start();
        }
        break;
      default:
        return null;
    }
    return g;
  }

  /**
   * 음악: 매 프레임. 곡이 바뀌면 옛 곡은 줄어들며 (fade 초, 없으면 짧게) 새 곡이 함께 올라온다.
   * 탐험 곡은 떠났던 마디부터 이어서, 연주는 세기 · 시각을 조금씩 흔든다. null 은 고요 (바깥 소리만).
   */
  music(id: SongId | null, fade?: number): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.musicBus) return;
    const now = ctx.currentTime;
    for (const e of this.decks.want(id, now, fade)) {
      let o = this.deckOut.get(e.deck.key);
      if (!o) {
        const gain = ctx.createGain();
        gain.gain.value = 0.0001;
        gain.connect(this.musicBus);
        o = { gain, nextAt: now + 0.05 };
        this.deckOut.set(e.deck.key, o);
      }
      const g = o.gain.gain;
      g.cancelScheduledValues(now);
      g.setValueAtTime(Math.max(0.0001, g.value), now);
      g.setTargetAtTime(e.target ? 1 : 0.0001, now, e.tau);
    }
    for (const d of this.decks.reap(now)) {
      this.deckOut.get(d.key)?.gain.disconnect();
      this.deckOut.delete(d.key);
    }
    for (const d of this.decks.all) {
      const o = this.deckOut.get(d.key);
      if (o && !d.done) this.play(ctx, d.cursor, o, now);
    }
    this.stings = this.stings.filter((st) => {
      const song = st.cursor.song;
      if (!song || st.cursor.pos >= songSteps(song)) {
        st.gain.disconnect();
        return false;
      }
      this.play(ctx, st.cursor, st, now);
      return true;
    });
  }

  /** 한 번만 트는 신호곡을 음악 위에 겹친다 (기억으로 들어가는 반짝임) */
  sting(id: SongId): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.musicBus || this.vol.bgm <= 0) return;
    const cursor = new SongCursor();
    cursor.switchTo(id);
    const gain = ctx.createGain();
    gain.gain.value = 0.8;
    gain.connect(this.musicBus);
    this.stings.push({ cursor, gain, nextAt: ctx.currentTime + 0.03 });
  }

  /** 자리표 하나를 앞서 보기 시간만큼 친다 */
  private play(ctx: AudioContext, c: SongCursor, out: { gain: GainNode; nextAt: number }, now: number): void {
    const song = c.song;
    if (!song) return;
    const dur = 60 / SONGS[song].bpm / 4;
    const bar = songBar(song);
    if (out.nextAt < now - 0.5) out.nextAt = now + 0.05;
    while (out.nextAt < now + LOOKAHEAD) {
      const pos = c.step;
      const notes = c.next();
      if (this.vol.bgm > 0)
        for (const n of notes) {
          const h = humanize(n, pos, Math.random, bar);
          this.note(ctx, out.gain, n, Math.max(now, out.nextAt + h.dt), dur, h.gain, h.len);
        }
      out.nextAt += dur;
    }
  }

  /** 발진기 하나: 빨리 올라와 hold 동안 40% 로 내려앉고 release 에 사그라든다. lp 가 있으면 낮은 통과 필터 (lpTo 로 닫힌다), vib 은 떨림 폭(Hz) */
  private osc(
    ctx: AudioContext,
    out: AudioNode,
    o: { wave: OscillatorType; hz: number; at: number; a: number; h: number; r: number; gain: number; lp?: number; lpTo?: number; vib?: number },
  ): void {
    const { at, a, h, r } = o;
    const end = at + a + h + r;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.gain), at + a);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, o.gain * 0.4), at + a + h);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    g.connect(out);
    const osc = ctx.createOscillator();
    osc.type = o.wave;
    osc.frequency.setValueAtTime(o.hz, at);
    let src: AudioNode = osc;
    if (o.lp) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.Q.value = 0.7;
      f.frequency.setValueAtTime(o.lp, at);
      if (o.lpTo) f.frequency.exponentialRampToValueAtTime(o.lpTo, at + a + Math.min(0.3, h + r * 0.3));
      osc.connect(f);
      src = f;
    }
    src.connect(g);
    if (o.vib) {
      const l = ctx.createOscillator();
      l.frequency.value = 5;
      const lg = ctx.createGain();
      lg.gain.setValueAtTime(0, at);
      lg.gain.linearRampToValueAtTime(o.vib, at + Math.min(0.6, a + h));
      l.connect(lg).connect(osc.frequency);
      l.start(at);
      l.stop(end + 0.05);
    }
    osc.start(at);
    osc.stop(end + 0.05);
  }

  /** 잡음 한 번 (솔 · 째깍) */
  private hit(ctx: AudioContext, out: AudioNode, at: number, type: BiquadFilterType, hz: number, q: number, dur: number, gain: number): void {
    if (!this.noise) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = hz;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(f).connect(g).connect(out);
    src.start(at, Math.random() * 0.5);
    src.stop(at + dur + 0.02);
  }

  /** k: 세기 배수 · lk: 길이 배수 (사람 손 흔들림) */
  private note(ctx: AudioContext, out: AudioNode, n: SNote, at: number, step: number, k = 1, lk = 1): void {
    const hz = midiHz(n.midi);
    const len = n.len * step * lk;
    const lead = n.part === 'lead';
    const counter = n.part === 'counter';
    const v = (wave: OscillatorType, f: number, a: number, h: number, r: number, gain: number, more: { lp?: number; lpTo?: number; vib?: number } = {}) =>
      this.osc(ctx, out, { wave, hz: f, at, a, h, r, gain: gain * k, ...more });
    switch (n.inst) {
      case 'piano':
        // 망치 소리처럼 빨리 올라와 천천히 사그라든다 (배음 하나 더)
        v('triangle', hz, 0.006, Math.min(0.5, len * 0.6), Math.min(1.6, 0.4 + len), lead ? 0.11 : 0.045);
        v('sine', hz * 2, 0.004, 0.08, Math.min(0.8, 0.2 + len * 0.5), lead ? 0.035 : 0.015);
        break;
      case 'felt':
        // 펠트 피아노: 둥근 망치, 높은 소리를 깎고 길게 남는다
        v('triangle', hz, 0.012, Math.min(0.45, len * 0.5), Math.min(1.9, 0.6 + len), lead ? 0.12 : counter ? 0.07 : 0.05, { lp: Math.min(2400, 700 + hz * 1.5), lpTo: Math.min(1400, 400 + hz) });
        v('sine', hz * 2.001, 0.01, 0.05, Math.min(0.6, 0.2 + len * 0.3), lead ? 0.012 : 0.006);
        break;
      case 'box':
        // 오르골: 높은 종소리
        v('sine', hz * 2, 0.003, 0.05, 0.9, n.part === 'comp' ? 0.03 : counter ? 0.05 : 0.07);
        v('sine', hz * 4 * 1.003, 0.002, 0.02, 0.35, 0.015);
        break;
      case 'celesta':
        // 첼레스타: 맑은 기음 + 짧게 반짝이는 높은 배음
        v('sine', hz, 0.002, 0.03, Math.min(1.4, 0.5 + len * 0.4), lead ? 0.075 : counter ? 0.05 : 0.03);
        v('sine', hz * 4.01, 0.001, 0.01, 0.25, lead ? 0.016 : 0.007);
        v('triangle', hz * 2, 0.002, 0.02, 0.4, lead ? 0.01 : 0.005);
        break;
      case 'strings': {
        // 현: 두 톱니파를 살짝 어긋나게, 높은 소리를 깎고 천천히 올라와 떤다
        const a = Math.min(0.35, Math.max(0.08, len * 0.3));
        const g = lead ? 0.05 : counter ? 0.026 : 0.014;
        for (const d of [0.997, 1.003]) v('sawtooth', hz * d, a, Math.max(0.05, len * 0.7), 0.6, g, { lp: Math.min(2200, 900 + hz * 1.2), vib: hz * 0.004 });
        break;
      }
      case 'pluck':
        // 뜯는 줄 (기타 · 피치카토): 밝게 튕겼다가 필터가 금세 닫힌다
        v('sawtooth', hz, 0.003, 0.02, Math.min(0.9, 0.3 + len * 0.3), lead ? 0.06 : 0.032, { lp: 3200, lpTo: 450 });
        v('triangle', hz, 0.003, 0.03, Math.min(0.7, 0.25 + len * 0.2), lead ? 0.03 : 0.018);
        break;
      case 'pad':
        v('triangle', hz, 0.5, len * 0.6, 0.8, 0.018);
        v('sine', hz * 1.004, 0.6, len * 0.6, 0.8, 0.014);
        break;
      case 'bass':
        v('triangle', hz, 0.01, len * 0.5, 0.4, 0.09);
        break;
      case 'perc':
        // 타악기: 낮으면 부드러운 북, 가운데는 솔, 높으면 째깍
        if (n.midi <= 40) this.thump(ctx, out, at, 90, 0.1 * k);
        else if (n.midi < 72) this.hit(ctx, out, at, 'highpass', 5200, 0.7, n.midi >= 46 ? 0.07 : 0.045, (n.midi >= 46 ? 0.04 : 0.025) * k);
        else this.hit(ctx, out, at, 'bandpass', n.midi >= 76 ? 3400 : 2500, 8, 0.03, 0.05 * k);
        break;
      case 'heart':
        this.thump(ctx, out, at, 70, 0.22 * k);
        break;
    }
  }

  /** 낮게 쿵 (심장 · 북): 높이가 뚝 떨어진다 */
  private thump(ctx: AudioContext, out: AudioNode, at: number, hz: number, gain: number): void {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
    g.connect(out);
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(hz, at);
    o.frequency.exponentialRampToValueAtTime(hz * 0.54, at + 0.2);
    o.connect(g);
    o.start(at);
    o.stop(at + 0.25);
  }
}
