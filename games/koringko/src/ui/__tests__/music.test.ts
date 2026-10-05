import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { BAR, SONGS, songNotes, songSteps, songFor, exploreSong, humanize, fadeTau, type SongId, type SNote } from '../audio/score.ts';
import { SongCursor } from '../audio/cursor.ts';

const EXPLORE = ['night', 'night2', 'night3'] as const;
const leadAt = (id: SongId, loop: number, from: number, to: number) => {
  const out: number[] = [];
  for (let s = from; s < to; s++) for (const n of songNotes(id, s, loop)) if (n.part === 'lead') out.push(s);
  return out;
};
const played = (id: SongId, from: number, to: number) => {
  let k = 0;
  for (let s = from; s < to; s++) k += songNotes(id, s).length;
  return k;
};

describe('탐험 곡: A(8마디) · B(8마디) · 쉼(2마디)', () => {
  test('세 탐험 곡은 16마디 화음 + 2마디 쉼이라 한 고리가 18마디 (70bpm 근처에서 40초 넘게)', () => {
    for (const id of EXPLORE) {
      assert.equal(SONGS[id].chords.length, 16, id);
      assert.equal(SONGS[id].rest, 2, id);
      assert.equal(songSteps(id), 18 * BAR, id);
      const secs = (songSteps(id) * 60) / SONGS[id].bpm / 4;
      assert.ok(secs >= 40, `${id} 한 고리 ${secs.toFixed(1)}초`);
    }
  });

  test('쉼 마디(17~18마디)에는 어떤 음도 나오지 않고, 그 앞 마디들에는 음이 있다', () => {
    for (const id of EXPLORE) {
      assert.equal(played(id, 16 * BAR, 18 * BAR), 0, `${id} 쉼`);
      assert.ok(played(id, 0, 8 * BAR) > 0 && played(id, 8 * BAR, 16 * BAR) > 0, `${id} A · B`);
    }
  });

  test('B 부분(9~16마디)에도 가락이 있고 A 와 다른 가락이다', () => {
    for (const id of EXPLORE) {
      const a = songNotes(id, 0).find((n) => n.part === 'lead');
      const bLead: SNote[] = [];
      for (let s = 8 * BAR; s < 16 * BAR; s++) bLead.push(...songNotes(id, s).filter((n) => n.part === 'lead'));
      assert.ok(bLead.length >= 8, `${id} B 가락 ${bLead.length}`);
      assert.ok(a, `${id} 첫 박 가락`);
      assert.notEqual(bLead[0].midi, a!.midi, `${id} B 첫 음은 A 와 다르게`);
    }
  });

  test('마디 첫 박의 가락 음은 그 마디 화음의 음 (탐험 곡도 어울림)', () => {
    for (const id of EXPLORE) {
      const s = SONGS[id];
      for (let step = 0; step < s.chords.length * BAR; step += BAR)
        for (const n of songNotes(id, step).filter((x) => x.part === 'lead')) {
          const chord = s.chords[step / BAR].map((m) => m % 12);
          assert.ok(chord.includes(n.midi % 12), `${id} ${step / BAR}마디 ${n.midi}`);
        }
    }
  });

  test('장 묶음마다 다른 성격: night 다장조 · night2 단조로 더 느리게 · night3 오르골 가락에 피아노 반주', () => {
    assert.equal(SONGS.night.chords[0][1] - SONGS.night.chords[0][0], 4);
    assert.equal(SONGS.night2.chords[0][1] - SONGS.night2.chords[0][0], 3);
    assert.ok(SONGS.night2.bpm < SONGS.night.bpm);
    assert.equal(SONGS.night3.lead, 'box');
    const insts = new Set<string>();
    for (let s = 0; s < songSteps('night3'); s++) for (const n of songNotes('night3', s)) insts.add(n.inst);
    assert.ok(insts.has('box') && insts.has('piano'), [...insts].join());
  });
});

describe('탐험 곡 변주: 고리마다 가락을 넣고 뺀다', () => {
  test('홀수 고리에는 A 부분 가락이 빠지고 (화음만), B 부분 가락은 남는다', () => {
    for (const id of EXPLORE) {
      assert.ok(leadAt(id, 0, 0, 8 * BAR).length > 0, `${id} 첫 고리 A 가락`);
      assert.deepEqual(leadAt(id, 1, 0, 8 * BAR), [], `${id} 둘째 고리 A 는 가락 없음`);
      assert.deepEqual(leadAt(id, 1, 8 * BAR, 16 * BAR), leadAt(id, 0, 8 * BAR, 16 * BAR), `${id} B 는 같다`);
      const pads = songNotes(id, 0, 1).filter((n) => n.part !== 'lead');
      assert.ok(pads.length > 0, `${id} 가락이 빠져도 화음은 난다`);
    }
  });

  test('짝수 고리는 첫 고리와 똑같다 (고리 2 = 고리 0)', () => {
    for (const id of EXPLORE) for (let s = 0; s < songSteps(id); s += 3) assert.deepEqual(songNotes(id, s, 2), songNotes(id, s, 0), `${id} ${s}`);
  });

  test('변주가 없는 곡은 고리 번호와 상관없이 같다', () => {
    for (const id of ['piano', 'main', 'sorrow'] as const) for (let s = 0; s < songSteps(id); s += 5) assert.deepEqual(songNotes(id, s, 1), songNotes(id, s, 0), id);
  });
});

describe('장 묶음마다 탐험 곡 고르기', () => {
  test('대본의 night 는 앞 1/3 장은 night, 가운데는 night2, 마지막 1/3 은 night3', () => {
    assert.equal(exploreSong(1, 21), 'night');
    assert.equal(exploreSong(7, 21), 'night');
    assert.equal(exploreSong(8, 21), 'night2');
    assert.equal(exploreSong(14, 21), 'night2');
    assert.equal(exploreSong(15, 21), 'night3');
    assert.equal(exploreSong(21, 21), 'night3');
  });

  test('결곗값: 장 번호가 0 이하 · 범위 밖 · 장 수가 0 이면 첫 곡/끝 곡으로 붙는다', () => {
    assert.equal(exploreSong(0, 21), 'night');
    assert.equal(exploreSong(-3, 21), 'night');
    assert.equal(exploreSong(99, 21), 'night3');
    assert.equal(exploreSong(1, 0), 'night');
    assert.equal(exploreSong(Number.NaN, 21), 'night');
  });

  test('songFor 에 장을 주면 night 를 장 묶음 곡으로 바꾸고, 다른 곡 · 긴장은 그대로', () => {
    assert.equal(songFor('night', 'calm', { n: 10, of: 21 }), 'night2');
    assert.equal(songFor('night', 'calm', { n: 20, of: 21 }), 'night3');
    assert.equal(songFor('night', 'calm'), 'night');
    assert.equal(songFor('piano', 'calm', { n: 20, of: 21 }), 'piano');
    assert.equal(songFor('night', 'warn', { n: 20, of: 21 }), 'tension');
    assert.equal(songFor('night2', 'calm', { n: 1, of: 21 }), 'night2', '대본이 곡을 집어 정하면 그대로');
  });
});

describe('곡 자리 기억: 기억에서 돌아오면 이어서', () => {
  test('탐험 곡으로 돌아오면 떠난 마디의 첫 칸부터 이어서 친다', () => {
    const c = new SongCursor();
    c.switchTo('night');
    for (let i = 0; i < 5 * BAR + 7; i++) c.next();
    c.switchTo('memory');
    for (let i = 0; i < 40; i++) c.next();
    c.switchTo('night');
    assert.equal(c.song, 'night');
    assert.equal(c.pos, 5 * BAR);
  });

  test('다음 칸의 음은 그 자리 악보와 같다 (이어 치기가 정말 그 마디 음을 낸다)', () => {
    const c = new SongCursor();
    c.switchTo('night');
    for (let i = 0; i < 9 * BAR + 3; i++) c.next();
    c.switchTo(null);
    c.switchTo('night');
    assert.deepEqual(c.next(), songNotes('night', 9 * BAR, 0));
  });

  test('감정 곡 (자리 기억 안 하는 곡) 은 늘 처음부터', () => {
    const c = new SongCursor();
    c.switchTo('memory');
    for (let i = 0; i < 3 * BAR; i++) c.next();
    c.switchTo('night');
    c.switchTo('memory');
    assert.equal(c.pos, 0);
  });

  test('쉼 마디에서 떠났다 돌아오면 쉼을 건너뛰고 다음 고리 처음부터', () => {
    const c = new SongCursor();
    c.switchTo('night');
    for (let i = 0; i < 16 * BAR + 5; i++) c.next();
    c.switchTo('dark');
    c.switchTo('night');
    assert.equal(c.pos, songSteps('night'));
    assert.equal(c.loop, 1);
    assert.equal(c.step, 0);
  });

  test('고리를 넘어가면 고리 번호가 오르고 변주가 적용된다', () => {
    const c = new SongCursor();
    c.switchTo('night');
    for (let i = 0; i < songSteps('night'); i++) c.next();
    assert.equal(c.loop, 1);
    assert.deepEqual(c.next(), songNotes('night', 0, 1));
  });

  test('같은 곡으로 다시 바꾸면 아무 일도 없다 · 곡이 없으면 음도 없다', () => {
    const c = new SongCursor();
    c.switchTo('night');
    for (let i = 0; i < 20; i++) c.next();
    c.switchTo('night');
    assert.equal(c.pos, 20);
    c.switchTo(null);
    assert.deepEqual(c.next(), []);
  });
});

describe('사람 손 같은 연주 (humanize)', () => {
  const lead: SNote = { inst: 'piano', midi: 72, len: 4, part: 'lead' };
  const longLead: SNote = { ...lead, len: 12 };
  const comp: SNote = { inst: 'piano', midi: 60, len: 2, part: 'comp' };
  const fixed = (v: number) => () => v;

  test('세기는 ±12%, 시각은 ±6ms 안에서 흔들린다 (양 끝값)', () => {
    const lo = humanize(comp, 3, fixed(0));
    const hi = humanize(comp, 3, fixed(1 - 1e-12));
    assert.ok(Math.abs(lo.gain - 0.88) < 1e-6 && Math.abs(hi.gain - 1.12) < 1e-6, `${lo.gain} ${hi.gain}`);
    assert.ok(Math.abs(lo.dt + 0.006) < 1e-6 && Math.abs(hi.dt - 0.006) < 1e-6, `${lo.dt} ${hi.dt}`);
  });

  test('마디 첫 박은 같은 흔들림에서 10% 세다', () => {
    const on = humanize(comp, 0, fixed(0.5));
    const off = humanize(comp, 5, fixed(0.5));
    assert.ok(Math.abs(on.gain / off.gain - 1.1) < 1e-9);
  });

  test('길이는 가락에서만 ±10% 바뀌고, 반주는 그대로', () => {
    assert.equal(humanize(comp, 3, fixed(0)).len, 1);
    assert.ok(Math.abs(humanize(lead, 3, fixed(0)).len - 0.9) < 1e-9);
    assert.ok(Math.abs(humanize(lead, 3, fixed(1 - 1e-12)).len - 1.1) < 1e-6);
  });

  test('가락의 긴 음 (8칸 이상) 은 끝을 살짝 일찍 뗀다', () => {
    const r = fixed(0.5);
    assert.ok(humanize(longLead, 3, r).len < humanize(lead, 3, r).len);
  });

  test('무작위가 같으면 결과도 같다 (흔들림은 주어진 난수만 쓴다)', () => {
    let k = 0;
    const seq = () => [0.1, 0.7, 0.3][k++ % 3];
    const a = humanize(lead, 3, seq);
    k = 0;
    assert.deepEqual(humanize(lead, 3, seq), a);
  });
});

describe('음악 페이드 시간', () => {
  test('페이드를 안 주면 0.25초 시간 상수, 주면 그 시간 동안 거의 다 바뀌도록 1/3', () => {
    assert.equal(fadeTau(undefined), 0.25);
    assert.ok(Math.abs(fadeTau(3) - 1) < 1e-9);
    assert.ok(Math.abs(fadeTau(0.6) - 0.2) < 1e-9);
  });

  test('결곗값: 0 · 음수 · NaN 은 기본값, 아주 긴 값은 4초 상수까지', () => {
    assert.equal(fadeTau(0), 0.25);
    assert.equal(fadeTau(-2), 0.25);
    assert.equal(fadeTau(Number.NaN), 0.25);
    assert.equal(fadeTau(60), 4);
  });
});
