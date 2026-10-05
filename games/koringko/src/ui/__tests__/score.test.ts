import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { BAR, SONGS, songNotes, songSteps, THEME, songFor, type SongId } from '../audio/score.ts';

const all = Object.keys(SONGS) as SongId[];
const notesOf = (id: SongId, inst?: string) => {
  const out: { step: number; midi: number; inst: string; part: string }[] = [];
  for (let s = 0; s < songSteps(id); s++) for (const n of songNotes(id, s)) if (!inst || n.inst === inst) out.push({ step: s, midi: n.midi, inst: n.inst, part: n.part });
  return out;
};

describe('하루의 테마 (주제곡)', () => {
  test('주제 가락은 여덟 마디, 첫 소절은 미 · 솔 · 라', () => {
    assert.equal(Math.max(...THEME.map(([s, , l]) => s + l)) <= 8 * BAR, true);
    assert.deepEqual(THEME.slice(0, 3).map(([, m]) => m % 12), [4, 7, 9]);
  });

  test('주제곡 편곡들은 모두 같은 가락을 (조 · 옥타브만 바꿔) 연주한다: 첫 세 음의 음정 간격이 같다', () => {
    const themed = all.filter((id) => SONGS[id].theme);
    assert.ok(themed.length >= 6, `${themed.length}`);
    for (const id of themed) {
      const lead = notesOf(id).filter((n) => n.part === 'lead');
      assert.ok(lead.length >= THEME.length * 0.8, `${id} 가락 ${lead.length}`);
      const [a, b, c] = lead;
      assert.deepEqual([b.midi - a.midi, c.midi - b.midi], [3, 2], `${id}`);
      assert.ok(lead.every((n) => n.inst === SONGS[id].lead), `${id} 가락 악기`);
    }
  });

  test('편곡마다 악기 · 빠르기가 다르다 (오르골 · 피아노 · 단조 · 합주)', () => {
    assert.equal(SONGS.box.lead, 'box');
    assert.equal(SONGS.piano.lead, 'piano');
    assert.ok(SONGS.minor.minor);
    assert.ok(SONGS.minor.bpm < SONGS.piano.bpm);
    assert.ok(SONGS.waltz.bpm > SONGS.piano.bpm);
    const insts = new Set(notesOf('finale').map((n) => n.inst));
    for (const i of ['piano', 'box', 'pad', 'bass']) assert.ok(insts.has(i), `합주에 ${i}`);
  });

  test('단조 편곡의 화음은 단조 (첫 화음의 3음이 근음에서 단3도)', () => {
    const c = SONGS.minor.chords[0];
    assert.equal(c[1] - c[0], 3);
    const major = SONGS.piano.chords[0];
    assert.equal(major[1] - major[0], 4);
  });
});

describe('감정 곡 (주제와 다른 저마다의 가락)', () => {
  const MOODS = ['main', 'grandma', 'longing', 'sorrow', 'memory', 'hope'] as const;

  test('여섯 곡 모두 여덟 마디 가락이 있고, 주제 가락과 첫 소절이 다르다', () => {
    for (const id of MOODS) {
      const s = SONGS[id];
      assert.equal(s.chords.length, 8, id);
      const lead = notesOf(id).filter((n) => n.part === 'lead');
      assert.ok(lead.length >= 16, `${id} 가락 ${lead.length}`);
      assert.ok(Math.max(...lead.map((n) => n.step)) >= 7 * BAR, `${id} 여덟째 마디까지`);
      const [a, b, c] = lead;
      assert.notDeepEqual([b.midi - a.midi, c.midi - b.midi], [3, 2], `${id} 는 주제와 달라야`);
    }
  });

  test('마디 첫 박의 가락 음은 그 마디 화음의 음 (어울림)', () => {
    for (const id of MOODS) {
      const s = SONGS[id];
      for (const n of notesOf(id).filter((x) => x.part === 'lead' && x.step % BAR === 0)) {
        const chord = s.chords[n.step / BAR].map((m) => m % 12);
        assert.ok(chord.includes(n.midi % 12), `${id} ${n.step / BAR}마디 ${n.midi}`);
      }
    }
  });

  test('슬픔은 가장 느린 단조, 희망 · 할머니의 노래는 장조, 회상은 오르골', () => {
    for (const id of MOODS) if (id !== 'sorrow') assert.ok(SONGS.sorrow.bpm < SONGS[id].bpm, id);
    assert.ok(SONGS.sorrow.minor);
    const third = (c: number[]) => c[1] - c[0];
    assert.equal(third(SONGS.hope.chords[0]), 4);
    assert.equal(third(SONGS.grandma.chords[0]), 4);
    assert.equal(SONGS.memory.lead, 'box');
  });
});

describe('악보 일반', () => {
  test('모든 곡은 (마디 수 + 쉼 마디) × 16칸이고, 칸 번호가 넘어가면 처음으로 돈다', () => {
    for (const id of all) {
      const n = songSteps(id);
      const rest = 'rest' in SONGS[id] ? (SONGS[id] as { rest: number }).rest : 0;
      assert.equal(n, (SONGS[id].chords.length + rest) * BAR, id);
      assert.deepEqual(songNotes(id, n + 3), songNotes(id, 3), id);
    }
  });

  test('모든 음은 사람이 듣기 좋은 높이 (MIDI 28~100) 이고 길이가 있다', () => {
    for (const id of all)
      for (let s = 0; s < songSteps(id); s++)
        for (const n of songNotes(id, s)) {
          assert.ok(n.midi >= 28 && n.midi <= 100, `${id} ${s} ${n.midi}`);
          assert.ok(n.len > 0);
        }
  });

  test('긴장(발소리) 곡은 가락 없이 심장 소리만', () => {
    const insts = new Set(notesOf('tension').map((n) => n.inst));
    assert.ok(insts.has('heart'));
    assert.ok(!insts.has('piano') && !insts.has('box'));
  });
});

describe('곡 고르기', () => {
  test('발소리가 들리면 긴장 곡, 아니면 무대 음악 (없으면 고요)', () => {
    assert.equal(songFor('night', 'warn'), 'tension');
    assert.equal(songFor('night', 'hold'), 'tension');
    assert.equal(songFor('piano', 'calm'), 'piano');
    assert.equal(songFor(null, 'calm'), null);
    assert.equal(songFor('없는곡', 'calm'), null);
  });
});
