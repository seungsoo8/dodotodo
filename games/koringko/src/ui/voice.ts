/**
 * 인물 대사 목소리: 기기의 한국어 음성 합성(Web Speech)으로 인물 대사를 읽는다.
 * 해설(독백 · 지문)은 읽지 않는다. 인물마다 높이 · 빠르기를 달리하고, 하루는 나이에 따라 높이가 달라진다.
 */

/** 합성기에 넘기는 한 줄 */
export interface Utter {
  text: string;
  lang: string;
  pitch: number;
  rate: number;
  /** 고른 목소리 이름 (없으면 기본) */
  voice: string | null;
}

/** 음성 합성기 (브라우저 speechSynthesis 를 감싼 것 · 시험에서는 가짜) */
export interface Synth {
  voices(): { name: string; lang: string }[];
  speak(u: Utter): void;
  cancel(): void;
}

export interface VoiceProfile {
  pitch: number;
  rate: number;
  /** 남자 목소리가 있으면 그것으로 */
  male?: boolean;
}

const PROFILES: Record<string, VoiceProfile> = {
  toby: { pitch: 1.35, rate: 1.0 },
  bori: { pitch: 0.75, rate: 0.9 },
  ruru: { pitch: 1.55, rate: 1.15 },
  nabi: { pitch: 1.7, rate: 1.05 },
  doll: { pitch: 1.05, rate: 0.85 },
  gm: { pitch: 0.85, rate: 0.82 },
  suni: { pitch: 1.6, rate: 1.05 },
  gmom: { pitch: 0.9, rate: 0.88 },
  mom: { pitch: 1.0, rate: 0.98 },
  eunju: { pitch: 1.7, rate: 1.05 },
  dad: { pitch: 0.6, rate: 0.95, male: true },
  gpa: { pitch: 0.5, rate: 0.85, male: true },
  jiwoo: { pitch: 1.45, rate: 1.05 },
};

/** 하루 나이 → 높이 (4살 1.9 → 15살 1.2) */
function haruPitch(kind: string): number {
  const age = Number(/^haru(\d+)$/.exec(kind)?.[1] ?? 12);
  return Math.round((1.9 - ((Math.min(15, Math.max(4, age)) - 4) / 11) * 0.7) * 100) / 100;
}

/** 순이 · 지우처럼 나이가 그림에 붙은 인물 (suni7 · suni20 · suni40 · jiwoo10 · jiwoo13) */
function agedPitch(base: number, kind: string): number {
  const age = Number(/(\d+)$/.exec(kind)?.[1] ?? NaN);
  if (!Number.isFinite(age)) return base;
  if (age >= 40) return Math.max(0.8, base - 0.6);
  if (age >= 20) return Math.max(0.9, base - 0.4);
  return base;
}

export function voiceProfile(who: string, kind: string): VoiceProfile {
  if (who === 'haru') return { pitch: haruPitch(kind), rate: 1.02 };
  const p = PROFILES[who];
  if (!p) return { pitch: 1, rate: 1 };
  return { ...p, pitch: agedPitch(p.pitch, kind) };
}

const LETTER = /[가-힣a-zA-Z0-9]/;

/** 읽을 글: 낫표 · 따옴표를 빼고, 말줄임은 쉼표로. 글자가 없으면 빈 글 */
export function speakable(text: string): string {
  if (!LETTER.test(text)) return '';
  return text
    .replace(/[「」『』"“”]/g, '')
    .replace(/^\s*[…．.]+\s*/, '')
    .replace(/\s*…+\s*/g, ', ')
    .replace(/,\s*([.!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

const MALE = /male|남|injoon|minjun|hyunsu/i;
const NATURAL = /natural|neural|online|google|premium|enhanced|향상/i;

export class VoiceActor {
  private on = true;
  private readonly synth: Synth | null;

  constructor(synth: Synth | null) {
    this.synth = synth;
  }

  /** 한국어 목소리가 있는가 */
  available(): boolean {
    return !!this.synth && this.korean().length > 0;
  }

  isOn(): boolean {
    return this.on;
  }

  setOn(v: boolean): void {
    this.on = v;
    if (!v) this.stop();
  }

  stop(): void {
    this.synth?.cancel();
  }

  /** 대사 한 줄: 읽었으면 true. 앞에서 읽던 것은 끊는다 */
  line(who: string, kind: string, text: string): boolean {
    if (!this.synth || !this.on) return false;
    const voices = this.korean();
    if (!voices.length) return false;
    this.synth.cancel();
    if (!who || who.endsWith('_sleep')) return false;
    const t = speakable(text);
    if (!t) return false;
    const p = voiceProfile(who, kind);
    const male = voices.find((v) => MALE.test(v.name));
    const female = voices.find((v) => !MALE.test(v.name)) ?? voices[0];
    const voice = p.male && male ? male : female;
    this.synth.speak({ text: t, lang: 'ko-KR', pitch: p.pitch, rate: p.rate, voice: voice.name });
    return true;
  }

  /** 한국어 목소리, 사람 같은 것(Natural · Neural · Online · Google · 향상됨)부터 */
  private korean(): { name: string; lang: string }[] {
    const ko = this.synth?.voices().filter((v) => /^ko/i.test(v.lang)) ?? [];
    const rank = (n: string) => (NATURAL.test(n) ? 0 : 1);
    return [...ko].sort((a, b) => rank(a.name) - rank(b.name));
  }
}

/** 브라우저 speechSynthesis 를 Synth 로 (없으면 null) */
export function browserSynth(): Synth | null {
  const ss = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
  if (!ss || typeof SpeechSynthesisUtterance === 'undefined') return null;
  return {
    voices: () => ss.getVoices().map((v) => ({ name: v.name, lang: v.lang })),
    cancel: () => ss.cancel(),
    speak: (u) => {
      const ut = new SpeechSynthesisUtterance(u.text);
      ut.lang = u.lang;
      ut.pitch = u.pitch;
      ut.rate = u.rate;
      const v = ss.getVoices().find((x) => x.name === u.voice);
      if (v) ut.voice = v;
      ss.speak(ut);
    },
  };
}
