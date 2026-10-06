import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { SONGS, songBar, songNotes, songSteps, songSeconds, type Song, type SongId, type SNote } from '../audio/score.ts';
import { TRACKS } from '../audio/tracks.ts';
import { parseTune } from '../audio/notation.ts';

const NEW = Object.keys(TRACKS) as SongId[];
const ALL = Object.keys(SONGS) as SongId[];
const def = (id: SongId) => SONGS[id] as Song;
const loopNotes = (id: SongId, loop = 0) => {
  const out: (SNote & { step: number })[] = [];
  for (let s = 0; s < songSteps(id); s++) for (const n of songNotes(id, s, loop)) out.push({ ...n, step: s });
  return out;
};
const lead = (id: SongId, loop = 0) => loopNotes(id, loop).filter((n) => n.part === 'lead');
const steps = (ns: { midi: number }[]) => ns.slice(1).map((n, i) => n.midi - ns[i].midi);

const REQUIRED = [
  // 메인 테마 「태엽이 멈추기 전에」 변주
  'orgel', 'main_hope', 'dawn_song', 'credits',
  // 인물
  'grandma_sepia', 'lullaby', 'haru_child', 'haru_teen', 'toby', 'bori', 'ruru', 'nabi', 'mom', 'dad', 'jiwoo',
  // 지금(밤) 탐험: 곳마다
  'ex_attic', 'ex_grandma', 'ex_hall', 'ex_living', 'ex_kitchen', 'ex_haru', 'ex_desk', 'ex_bath', 'ex_outside', 'ex_rain', 'ex_clock', 'ex_sewing', 'ex_dawn',
  // 신호
  'sting_memory', 'reveal', 'epilogue',
];

describe('곡 목록', () => {
  test('새 곡 31개가 모두 있고, 옛 곡과 합쳐 45곡이 넘는다', () => {
    for (const id of REQUIRED) assert.ok(id in SONGS, `없는 곡 ${id}`);
    assert.ok(NEW.length >= 30, `${NEW.length}`);
    assert.ok(ALL.length >= 45, `${ALL.length}`);
  });

  test('부드러운 악기를 고루 쓴다: 펠트 피아노 · 첼레스타 · 현 · 뜯는 줄 · 가벼운 타악기', () => {
    const used = new Set<string>();
    for (const id of NEW) for (const n of loopNotes(id, 1)) used.add(n.inst);
    for (const i of ['felt', 'celesta', 'strings', 'pluck', 'perc', 'box', 'piano', 'bass', 'pad']) assert.ok(used.has(i), `${i} 를 쓰는 곡이 없다`);
  });
});

describe('악보가 바르다 (모든 곡)', () => {
  test('가락 · 둘째 성부 · 베이스 적기의 마디 수가 화음 수와 같고, 마디마다 칸 합이 마디 길이와 같다', () => {
    for (const id of ALL) {
      const s = def(id);
      const L = songBar(id);
      for (const key of ['tune', 'voice', 'bassTune'] as const) {
        const src = s[key];
        if (!src) continue;
        const t = parseTune(src, L);
        assert.equal(t.bars.length, s.chords.length, `${id}.${key} 마디 ${t.bars.length} ≠ 화음 ${s.chords.length}`);
        t.bars.forEach((b, i) => assert.equal(b, L, `${id}.${key} ${i + 1}마디 ${b}칸`));
      }
      if (s.basses) assert.equal(s.basses.length, s.chords.length, `${id} 베이스 수`);
    }
  });

  test('모든 음은 MIDI 28~100, 길이가 있고, 칸은 고리 안에 있다', () => {
    for (const id of ALL)
      for (const loop of [0, 1])
        for (const n of loopNotes(id, loop)) {
          assert.ok(n.midi >= 28 && n.midi <= 100, `${id} ${n.step} ${n.inst} ${n.midi}`);
          assert.ok(n.len > 0, `${id} ${n.step}`);
        }
  });

  test('3/4 박자 곡은 마디가 12칸, 4/4 는 16칸', () => {
    assert.equal(songBar('lullaby'), 12);
    assert.equal(songBar('epilogue'), 12);
    assert.equal(songBar('night'), 16);
    for (const id of ALL) assert.equal(songSteps(id) % songBar(id), 0, id);
  });

  test('고리: 고리 칸 수를 더한 칸은 같은 음 (도는 곡), 한 번만 트는 신호는 둘째 고리부터 소리가 없다', () => {
    for (const id of ALL) {
      const n = songSteps(id);
      assert.deepEqual(songNotes(id, n + 5), songNotes(id, 5), id);
      if (def(id).once) assert.equal(loopNotes(id, 1).length, 0, `${id} 둘째 고리`);
      else assert.ok(loopNotes(id, 1).length > 0, `${id} 둘째 고리도 소리`);
    }
  });

  test('새 곡의 한 고리 길이: 신호는 10초 안, 인물 짧은 동기는 20초 이상, 그 밖은 40~150초', () => {
    const MOTIF = new Set(['bori', 'ruru', 'nabi', 'toby', 'dad']);
    for (const id of NEW) {
      const sec = songSeconds(id);
      if (def(id).once) assert.ok(sec <= 10, `${id} ${sec.toFixed(1)}초`);
      else if (MOTIF.has(id)) assert.ok(sec >= 20 && sec <= 150, `${id} ${sec.toFixed(1)}초`);
      else assert.ok(sec >= 40 && sec <= 150, `${id} ${sec.toFixed(1)}초`);
    }
  });

  test('새 곡에서 마디 첫 박의 가락 음은 열에 여덟 넘게 그 마디 화음의 음 (어울림)', () => {
    for (const id of NEW) {
      const s = def(id);
      const L = songBar(id);
      const down = lead(id).filter((n) => n.step % L === 0);
      if (!down.length) continue;
      const ok = down.filter((n) => s.chords[n.step / L].some((m) => m % 12 === n.midi % 12)).length;
      assert.ok(ok / down.length >= 0.8, `${id} 첫 박 어울림 ${ok}/${down.length}`);
    }
  });
});

describe('주제와 변주 (투더문처럼 같은 가락이 장면마다 옷을 바꾼다)', () => {
  test('메인 테마의 변주(오르골 · 희망 · 새벽 · 끝 노래)는 모두 미 · 솔 · 라 (단3 · 장2)로 시작한다', () => {
    for (const id of ['orgel', 'main_hope', 'dawn_song', 'credits', 'box', 'minor', 'finale'] as SongId[]) {
      const l = lead(id);
      assert.deepEqual(steps(l.slice(0, 3)), [3, 2], id);
    }
  });

  test('오르골(못 다 부른 노래)은 으뜸음으로 끝나지 않고 V 화음에서 멈춘다; 새벽 노래는 으뜸음으로 끝까지 부른다', () => {
    const o = lead('orgel');
    const last = o.at(-1)!;
    assert.notEqual(last.midi % 12, 0, '오르골 끝 음이 도면 안 된다');
    const lastChord = def('orgel').chords.at(-1)!;
    assert.equal(lastChord[0] % 12, 7, '마지막 화음은 솔(G) 위');
    const d = lead('dawn_song');
    assert.equal(d.at(-1)!.midi % 12, 0, '새벽 노래 끝 음은 도');
    assert.ok(d.length > o.length, '새벽 노래는 오르골보다 길게 (빠진 끝을 채운다)');
  });

  test('하루의 테마: 어린 하루(장조 · 빠르게 · 타악기)와 열다섯 하루(단조 · 느리게 · 멀게)는 같은 리듬 · 윤곽', () => {
    const c = lead('haru_child');
    const t = lead('haru_teen');
    assert.deepEqual(c.slice(0, 6).map((n) => n.step), t.slice(0, 6).map((n) => n.step), '같은 리듬');
    assert.deepEqual(steps(c.slice(0, 4)).map(Math.sign), steps(t.slice(0, 4)).map(Math.sign), '같은 오르내림');
    assert.ok(def('haru_child').bpm > def('haru_teen').bpm);
    const third = (id: SongId) => def(id).chords[0][1] - def(id).chords[0][0];
    assert.equal(third('haru_child'), 4);
    assert.equal(third('haru_teen'), 3);
    assert.ok(loopNotes('haru_child').some((n) => n.inst === 'perc'));
    assert.ok(!loopNotes('haru_teen').some((n) => n.inst === 'perc'));
  });

  test('할머니의 노래 · 세피아 · 자장가는 같은 첫 소절 (파 미 파 라), 자장가는 3/4 첼레스타', () => {
    for (const id of ['grandma', 'grandma_sepia', 'lullaby', 'ex_sewing'] as SongId[]) {
      const l = lead(id);
      assert.deepEqual(steps(l.slice(0, 4)), [-1, 1, 4], id);
    }
    assert.equal(def('lullaby').meter, 3);
    assert.equal(def('lullaby').lead, 'celesta');
    assert.ok(def('grandma_sepia').bpm < def('grandma').bpm);
  });

  test('끝 노래(credits)는 메인 테마 · 하루의 테마 · 할머니의 노래를 차례로 잇는 메들리 (90초 넘게)', () => {
    assert.ok(songSeconds('credits') >= 90);
    const l = lead('credits');
    const L = songBar('credits');
    const at = (bar: number) => l.filter((n) => n.step >= bar * L).slice(0, 4);
    assert.deepEqual(steps(at(0).slice(0, 3)), [3, 2], '처음은 메인 테마');
    assert.deepEqual(steps(at(16)), [-1, 1, 4], '17마디부터 할머니의 노래');
  });
});

describe('인물 동기 · 탐험 곡 · 신호', () => {
  test('탐험 곡은 모두 이어 틀기(resume), 고리 끝에 쉼 마디, 짝수 고리마다 가락을 덜어 낸다', () => {
    for (const id of NEW.filter((k) => k.startsWith('ex_'))) {
      const s = def(id);
      assert.ok(s.resume, `${id} resume`);
      assert.ok((s.rest ?? 0) >= 1, `${id} 쉼`);
      assert.ok(s.vary, `${id} 변주`);
      assert.ok(lead(id, 1).length < lead(id, 0).length, `${id} 둘째 고리 가락이 줄어야`);
    }
  });

  test('탐험 곡 열세 곡의 가락은 서로 다르다', () => {
    const ex = NEW.filter((k) => k.startsWith('ex_'));
    assert.equal(ex.length, 13);
    const sig = new Set(ex.map((id) => lead(id).slice(0, 6).map((n) => `${n.step}:${n.midi}`).join(',')));
    assert.equal(sig.size, ex.length);
  });

  test('태엽 속은 째깍 타악기와 오르골 반주, 비 마당은 단조, 새벽은 현이 깔린다', () => {
    assert.ok(loopNotes('ex_clock').some((n) => n.inst === 'perc'));
    assert.ok(loopNotes('ex_clock').some((n) => n.inst === 'box'));
    assert.equal(def('ex_rain').chords[0][1] - def('ex_rain').chords[0][0], 3);
    assert.ok(loopNotes('ex_dawn').some((n) => n.inst === 'strings'));
  });

  test('동료 동기는 서로 다른 악기 · 빠르기: 루루(뜯는 줄 · 빠름) · 나비(첼레스타 · 3/4) · 보리(펠트 · 느림) · 토비(째깍)', () => {
    assert.equal(def('ruru').lead, 'pluck');
    assert.equal(def('nabi').lead, 'celesta');
    assert.equal(def('nabi').meter, 3);
    assert.equal(def('bori').lead, 'felt');
    assert.ok(def('ruru').bpm > def('bori').bpm + 30);
    assert.ok(loopNotes('toby').some((n) => n.inst === 'perc' && n.midi >= 72), '토비는 태엽 째깍');
  });

  test('기억 들어가는 신호(sting_memory)는 한 번만, 위로 올라가는 첼레스타', () => {
    assert.ok(def('sting_memory').once);
    const l = lead('sting_memory');
    assert.equal(l[0].inst, 'celesta');
    assert.ok(steps(l.slice(0, 6)).every((d) => d > 0), '올라가는 음들');
  });

  test('반전(reveal)은 단조 · 느림, 아빠 테마는 장조 · 통통 튐(타악기)', () => {
    assert.equal(def('reveal').chords[0][1] - def('reveal').chords[0][0], 3);
    assert.ok(def('reveal').bpm <= 64);
    assert.equal(def('dad').chords[0][1] - def('dad').chords[0][0], 4);
    assert.ok(loopNotes('dad').some((n) => n.inst === 'perc'));
  });

  test('긴장(숨기)은 여전히 가락 없이 심장 소리, 발끝 걸음(뜯는 줄)이 더해진다', () => {
    const ins = new Set(loopNotes('tension').map((n) => n.inst));
    assert.ok(ins.has('heart') && ins.has('pluck'));
    assert.ok(!ins.has('piano') && !ins.has('box'));
  });
});
