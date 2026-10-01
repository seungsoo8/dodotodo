import type { Face } from '../core/faces.ts';
import type { GameEvent } from '../core/types.ts';
import { facePan, heartbeatInterval, panForX } from './audio/mix.ts';
import { STEPS, TRACKS, stepNotes, type Note, type TrackId } from './audio/music.ts';
import { UI_SOUNDS, impactSound, shotSound, skillSound, ultSound, type Layer, type SoundSpec } from './audio/sfx.ts';
import { DEFAULT_AUDIO, type AudioSettings } from './records.ts';
import { Throttle } from './throttle.ts';
import { schedule } from './weaponfx.ts';

/** 음악 음을 미리 예약해 두는 시간 (초). 프레임이 늦어도 박자가 밀리지 않게 */
const LOOKAHEAD = 0.15;

const midiHz = (m: number) => 440 * 2 ** ((m - 69) / 12);

/**
 * Web Audio 로 즉석에서 만드는 소리 (소리 파일 없음).
 * 효과음 · 음악 → 각자 크기 → 전체 음량 정리기(압축기) → 스피커
 */
export class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private throttle = new Throttle(0.05, { towerHit: 0.15, kill: 0.04, crit: 0.06, heartbeat: 0.3, 'empty-n': 4, 'empty-e': 4, 'empty-s': 4, 'empty-w': 4, forecast: 3, speech: 0.5 });
  private settings: AudioSettings = { ...DEFAULT_AUDIO };

  // 음악 진행
  private track: TrackId | null = null;
  private pendingTrack: TrackId | null = null;
  private level = 0;
  private step = 0;
  private nextStepAt = 0;
  private nextBeatAt = 0;

  get muted(): boolean {
    return this.settings.muted;
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  setSettings(s: AudioSettings): void {
    this.settings = { ...s };
    this.applyVolumes();
  }

  private applyVolumes(): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.sfxBus || !this.musicBus) return;
    const t = ctx.currentTime;
    this.master.gain.setTargetAtTime(this.settings.muted ? 0 : 1, t, 0.02);
    this.sfxBus.gain.setTargetAtTime(this.settings.sfx, t, 0.02);
    this.musicBus.gain.setTargetAtTime(this.settings.music * 0.6, t, 0.05);
  }

  /** 브라우저는 사용자 입력 뒤에만 소리를 허용하므로 첫 클릭·키 입력 때 부른다 */
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
      comp.attack.value = 0.003;
      comp.release.value = 0.15;
      comp.connect(ctx.destination);
      this.master = ctx.createGain();
      this.master.connect(comp);
      this.sfxBus = ctx.createGain();
      this.sfxBus.connect(this.master);
      this.musicBus = ctx.createGain();
      this.musicBus.connect(this.master);
      // 1초짜리 잡음 (폭발·바람·타격 질감)
      this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this.ctx = ctx;
      this.applyVolumes();
    } catch {
      this.ctx = null;
    }
  }

  private ready(): AudioContext | null {
    const ctx = this.ctx;
    return ctx && ctx.state === 'running' && !this.settings.muted ? ctx : null;
  }

  /** 한 겹을 at 시각에 bus 로 울린다 */
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

  /** 효과음 하나 (pan: -1 왼쪽 ~ 1 오른쪽, delay: 초 뒤에) */
  play(key: string, spec: SoundSpec, pan = 0, delay = 0): void {
    const ctx = this.ready();
    if (!ctx || !this.sfxBus) return;
    if (!this.throttle.allow(key, ctx.currentTime + delay)) return;
    let bus: AudioNode = this.sfxBus;
    if (pan !== 0) {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      p.connect(this.sfxBus);
      bus = p;
    }
    const at = ctx.currentTime + delay;
    for (const l of spec) this.layer(ctx, l, at, bus);
  }

  /**
   * 이번 프레임의 게임 이벤트 소리. 맞는 소리는 투사체가 닿는 시각에,
   * 소리가 난 자리에 따라 왼쪽·오른쪽에서 들린다.
   */
  events(events: GameEvent[], width: number): void {
    const pan = (x: number) => panForX(x, width);
    for (const { event: ev, delay, fx } of schedule(events)) {
      switch (ev.kind) {
        case 'shot':
          this.play(`shot-${ev.weaponId}`, shotSound(ev.weaponId), pan(ev.to.x) * 0.3);
          break;
        case 'hit':
          if (fx && fx.timing !== 'impact') this.play(`impact-${fx.impact}`, impactSound(fx.impact), pan(ev.at.x), delay);
          if (ev.crit) this.play('crit', UI_SOUNDS.crit, pan(ev.at.x), delay);
          break;
        case 'splash':
          if (fx) this.play(`impact-${fx.impact}`, impactSound(fx.impact), pan(ev.at.x), delay);
          break;
        case 'kill':
          this.play('kill', UI_SOUNDS.kill, pan(ev.at.x), delay);
          break;
        case 'towerHit':
          this.play('towerHit', UI_SOUNDS.towerHit, facePan(ev.face));
          break;
        case 'round':
          this.play('round', UI_SOUNDS.round);
          break;
        case 'elite':
          this.play('elite', UI_SOUNDS.elite);
          break;
        case 'boss':
          this.play('boss', UI_SOUNDS.boss);
          break;
        case 'bossDown':
          this.play('bossDown', UI_SOUNDS.bossDown, pan(ev.at.x));
          break;
        case 'merge':
          this.play('merge', UI_SOUNDS.merge);
          break;
        case 'steal':
          this.play('steal', UI_SOUNDS.steal, pan(ev.at.x));
          break;
        case 'choice':
          this.play('choice', UI_SOUNDS.choice);
          break;
        case 'bossWindup':
          // 기 모으는 경고음: 점점 높아진다
          this.play(
            'bossWindup',
            [
              { kind: 'tone', wave: 'sawtooth', freq: 220, to: 660, dur: ev.duration, gain: 0.035 },
              { kind: 'tone', wave: 'square', freq: 880, dur: 0.08, gain: 0.04 },
            ],
            pan(ev.at.x),
          );
          break;
        case 'bossCancel':
          this.play('bossCancel', UI_SOUNDS.bossCancel, pan(ev.at.x));
          break;
        case 'bossSlam':
          this.play('bossImpact', UI_SOUNDS.bossImpact, facePan(ev.face));
          break;
        case 'bossNova':
          this.play('bossImpact', UI_SOUNDS.bossImpact, pan(ev.at.x));
          break;
        case 'bossSummon':
          this.play('bossSummon', UI_SOUNDS.bossSummon, pan(ev.at.x));
          break;
        case 'bossShot':
          this.play('bossShot', UI_SOUNDS.bossShot, pan(ev.from.x));
          break;
        case 'bossEnrage':
          this.play('bossEnrage', UI_SOUNDS.bossEnrage, pan(ev.at.x));
          break;
        case 'learn':
          this.play('learn', UI_SOUNDS.learn);
          break;
        case 'move':
          this.play('move', UI_SOUNDS.move, facePan(ev.face));
          break;
        case 'fuse':
        case 'evolve':
          this.play('fuse', UI_SOUNDS.fuse);
          break;
        case 'ultimate':
          this.play(`ult-${ev.id}`, ultSound(ev.id));
          break;
        case 'combo':
          this.play('combo', UI_SOUNDS.combo, pan(ev.at.x));
          break;
        case 'incident':
          this.play('incident', UI_SOUNDS.incident);
          break;
        case 'officer':
          this.play('officer', UI_SOUNDS.officer);
          break;
        case 'route':
          this.play('route', UI_SOUNDS.route);
          break;
        case 'forge':
          this.play('forge', UI_SOUNDS.forge);
          break;
        case 'gamble':
          this.play('gamble', ev.win > ev.bet ? UI_SOUNDS.gambleWin : UI_SOUNDS.gambleLose);
          break;
        case 'encounter':
          this.play('encounter', UI_SOUNDS.encounter);
          break;
        case 'peddler':
          this.play('buy', UI_SOUNDS.buy);
          break;
      }
    }
  }

  skill(id: string, x?: number, width?: number): void {
    this.play(`skill-${id}`, skillSound(id), x !== undefined && width ? panForX(x, width) : 0);
  }

  perk(): void {
    this.play('perk', UI_SOUNDS.perk);
  }

  rotate(): void {
    this.play('rotate', UI_SOUNDS.rotate);
  }

  tick(): void {
    this.play('tick', UI_SOUNDS.tick);
  }

  sell(): void {
    this.play('sell', UI_SOUNDS.sell);
  }

  buy(): void {
    this.play('buy', UI_SOUNDS.buy);
  }

  reroll(): void {
    this.play('reroll', UI_SOUNDS.reroll);
  }

  /** 영구 강화·해금 */
  upgrade(): void {
    this.play('upgrade', UI_SOUNDS.upgrade);
  }

  denied(): void {
    this.play('denied', UI_SOUNDS.denied);
  }

  /** 무기가 없는 면으로 맞았다 (그쪽에서 들린다) */
  emptyFace(face: Face): void {
    this.play(`empty-${face}`, UI_SOUNDS.emptyFace, facePan(face));
  }

  /** 다음 라운드 예보가 떴다 (가장 많이 올 쪽에서 들린다) */
  forecast(face: Face): void {
    this.play('forecast', UI_SOUNDS.forecast, facePan(face));
  }

  /** 이름으로 고르는 화면 소리 (타이틀·이야기·설정 등) */
  ui(name: keyof typeof UI_SOUNDS): void {
    this.play(name, UI_SOUNDS[name]);
  }

  lessonStep(): void {
    this.play('lessonStep', UI_SOUNDS.lessonStep);
  }

  end(won: boolean): void {
    this.play('end', won ? UI_SOUNDS.win : UI_SOUNDS.lose);
  }

  // ───────── 음악 · 심장 박동 (매 프레임) ─────────

  /** 곡과 세기를 맞추고 다음 음들을 예약한다. hpRatio 가 낮으면 심장이 뛴다 */
  update(track: TrackId | null, level: number, hpRatio: number | null): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.musicBus) return;
    const now = ctx.currentTime;

    // 곡 바꾸기: 처음이면 바로, 아니면 마디가 바뀔 때
    if (track !== this.track) this.pendingTrack = track;
    if (this.pendingTrack !== this.track && (this.track === null || this.step % 16 === 0)) {
      this.track = this.pendingTrack;
      this.step = 0;
      this.nextStepAt = Math.max(this.nextStepAt, now + 0.05);
    }
    this.level = level;
    if (this.track) {
      const t = TRACKS[this.track];
      const stepDur = 60 / t.bpm / 4;
      if (this.nextStepAt < now - 0.5) this.nextStepAt = now + 0.05; // 탭을 떠났다 온 경우
      while (this.nextStepAt < now + LOOKAHEAD) {
        if (!this.settings.muted && this.settings.music > 0) {
          for (const n of stepNotes(this.track, this.step, this.level)) this.note(ctx, n, this.nextStepAt, stepDur);
        }
        this.step = (this.step + 1) % STEPS;
        this.nextStepAt += stepDur;
        if (this.pendingTrack !== this.track && this.step % 16 === 0) break;
      }
    }

    const beat = hpRatio === null ? null : heartbeatInterval(hpRatio);
    if (beat !== null && now >= this.nextBeatAt) {
      this.play('heartbeat', UI_SOUNDS.heartbeat);
      this.nextBeatAt = now + beat;
    }
  }

  /** 악기 하나를 울린다 */
  private note(ctx: AudioContext, n: Note, at: number, stepDur: number): void {
    const bus = this.musicBus!;
    const hz = n.midi !== undefined ? midiHz(n.midi) : 0;
    switch (n.inst) {
      case 'bass':
        this.layer(ctx, { kind: 'tone', wave: 'triangle', freq: hz, dur: stepDur * 1.8, gain: 0.16 }, at, bus);
        break;
      case 'arp':
        this.layer(ctx, { kind: 'tone', wave: 'square', freq: hz, dur: stepDur * 0.9, gain: 0.025 }, at, bus);
        break;
      case 'lead':
        this.layer(ctx, { kind: 'tone', wave: 'square', freq: hz, dur: stepDur * 1.7, gain: 0.05 }, at, bus);
        this.layer(ctx, { kind: 'tone', wave: 'triangle', freq: hz * 2, dur: stepDur * 1.2, gain: 0.015 }, at, bus);
        break;
      case 'kick':
        this.layer(ctx, { kind: 'tone', wave: 'sine', freq: 150, to: 40, dur: 0.12, gain: 0.2 }, at, bus);
        break;
      case 'snare':
        this.layer(ctx, { kind: 'noise', filter: 'bandpass', freq: 1800, to: 900, q: 0.8, dur: 0.1, gain: 0.08 }, at, bus);
        break;
      case 'hat':
        this.layer(ctx, { kind: 'noise', filter: 'highpass', freq: 7000, dur: 0.035, gain: 0.03 }, at, bus);
        break;
    }
  }
}
