import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { cueFor, exploreCue, HINTS, resolveCue, type CueCtx } from '../audio/cues.ts';
import { SONGS, type SongId } from '../audio/score.ts';
import { STORY } from '../../core/adv/story/index.ts';
import type { Cmd } from '../../core/adv/types.ts';

const ACT = { n: 5, of: 23 };
const room = (id: string) => STORY.rooms[id]();
const ctxIn = (roomId: string, track: string | null, more: Partial<CueCtx> = {}): CueCtx => {
  const r = room(roomId);
  return { track, steps: 'calm', tone: 'now', room: r.id, look: r.look, roomMusic: r.music, act: ACT, flags: {}, ...more };
};
const flat = (cmds: readonly Cmd[], out: Cmd[] = []): Cmd[] => {
  for (const c of cmds) {
    out.push(c);
    if (c.t === 'if') {
      flat(c.then, out);
      flat(c.else ?? [], out);
    }
  }
  return out;
};

describe('곡 고르기 우선순위', () => {
  test('발소리(얼음 땡)가 들리면 무엇보다 먼저 긴장 곡: 기억 · 명시 곡보다 앞선다', () => {
    for (const steps of ['warn', 'hold'] as const) {
      assert.deepEqual(resolveCue({ ...ctxIn('attic', 'night'), steps }), { id: 'tension', by: 'tension' });
      assert.equal(cueFor({ ...ctxIn('attic', 'toby'), steps }), 'tension');
    }
  });

  test('@music none(고요)은 어떤 문맥에서도 고요로 남는다', () => {
    assert.deepEqual(resolveCue(ctxIn('attic', null)), { id: null, by: 'silence' });
    assert.equal(cueFor({ ...ctxIn('m_room4', null), tone: 'memory', memory: 'm9a' }), null);
  });

  test('대본이 분위기 낱말이 아닌 곡 이름을 직접 적으면 그 곡 그대로 (기억 안에서도)', () => {
    assert.deepEqual(resolveCue({ ...ctxIn('m_room4', 'nabi'), tone: 'memory', memory: 'm9a' }), { id: 'nabi', by: 'explicit' });
    assert.equal(cueFor(ctxIn('attic', 'ex_bath')), 'ex_bath');
  });

  test('! 를 붙이면 분위기 낱말도 문맥으로 바꾸지 않고 그 곡 그대로', () => {
    assert.equal(cueFor({ ...ctxIn('m_tb_shop', 'box'), tone: 'memory', memory: 'mTa' }), 'toby');
    assert.deepEqual(resolveCue({ ...ctxIn('m_tb_shop', '!box'), tone: 'memory', memory: 'mTa' }), { id: 'box', by: 'explicit' });
  });

  test('모르는 곡 이름은 고요 (예전처럼)', () => {
    assert.equal(cueFor(ctxIn('attic', '없는곡')), null);
    assert.equal(cueFor(ctxIn('attic', '!없는곡')), null);
  });

  test('분위기 낱말은 모두 실제 곡이다 (문맥이 없으면 그 곡)', () => {
    for (const h of Object.keys(HINTS)) assert.ok(h in SONGS, h);
    assert.equal(cueFor({ track: 'sorrow' }), 'sorrow');
    assert.deepEqual(resolveCue({ track: 'waltz' }), { id: 'waltz', by: 'default' });
  });
});

describe('기억 장면: 기억 id → 앞머리 → 기억 방 꾸밈 → 기본', () => {
  const mem = (id: string, roomId: string, track: string) => resolveCue({ ...ctxIn(roomId, track), tone: 'memory', memory: id });

  test('기억 id 하나에 매긴 곡이 앞머리보다 앞선다: 토비의 「끝이 기억 안 나는 노래」는 못 다 부른 오르골', () => {
    assert.deepEqual(mem('mTe', 'm_room13', 'box'), { id: 'orgel', by: 'memory-id' });
    assert.deepEqual(mem('mTa', 'm_tb_shop', 'waltz'), { id: 'toby', by: 'memory-prefix' });
  });

  test('앞머리는 가장 긴 것이 이긴다: mOU(골목)는 mO(보리)가 아니다', () => {
    assert.equal(mem('mOa', 'm_br_home', 'memory').id, 'bori');
    assert.notEqual(mem('mOUc', 'm_out_alley', 'box').id, 'bori');
  });

  test('동료 · 가족 기억은 그 인물의 테마로', () => {
    assert.equal(mem('mNa', 'm_room6', 'night').id, 'nabi');
    assert.equal(mem('mRb', 'm_room6', 'box').id, 'ruru');
    assert.equal(mem('mMe', 'm_ms_room14', 'box').id, 'mom');
    assert.equal(mem('mJa', 'm_jw_picnic', 'waltz').id, 'jiwoo');
    assert.equal(mem('m3f', 'm_kitchen_d', 'piano').id, 'dad');
    assert.equal(mem('m9b', 'm_room4', 'box').id, 'toby');
  });

  test('슬픈 낱말(minor · sorrow)은 인물 테마로 덮지 않는다 (슬픔은 슬픔으로)', () => {
    assert.equal(mem('mRc', 'm_rr_living', 'minor').id, 'minor');
    assert.equal(mem('mOe', 'm_br_house_n', 'sorrow').id, 'sorrow');
  });

  test('할머니가 숨긴 병을 아는 기억은 반전 곡', () => {
    assert.equal(mem('mGa', 'm_clinic', 'minor').id, 'reveal');
    assert.equal(mem('mGb', 'm_gm_n', 'minor').id, 'reveal');
  });

  test('기억 id 를 모르면 기억 방 꾸밈으로: 옛집이면 보리, 할머니 방의 밤 낱말은 자장가', () => {
    assert.deepEqual(mem('zz', 'm_br_home', 'piano'), { id: 'bori', by: 'memory-look' });
    assert.equal(cueFor({ track: 'night', tone: 'memory', look: 'gmNight' }), 'lullaby');
  });

  test('지금 장면용 방 연출(ROOM_HINTS)은 같은 방을 쓰는 기억 속으로 새지 않는다', () => {
    assert.equal(cueFor(ctxIn('m_out_alley_d', 'longing', { tone: 'dawn' })), 'jiwoo', '새벽 골목의 지우');
    assert.notEqual(mem('mOUa', 'm_out_alley_d', 'longing').id, 'jiwoo', '할머니와 하루의 가로등 밑 기억');
    assert.equal(mem('mEPc', 'h_newroom', 'box').id, 'box', '새 방의 기억 속 오르골은 끝 노래가 아니다');
  });

  test('기억 안의 night 낱말은 탐험 곡이 아니다', () => {
    const c = mem('m3g', 'm_room13', 'night');
    assert.ok(!String(c.id).startsWith('ex_') && !String(c.id).startsWith('night'), String(c.id));
  });
});

describe('탐험: 방 id → 방 꾸밈 → 장(막) 묶음', () => {
  test('방의 탐험 낱말(night 또는 방 음악)이면 곳마다 다른 곡', () => {
    assert.deepEqual(resolveCue(ctxIn('attic', 'night')), { id: 'ex_attic', by: 'room' });
    assert.equal(cueFor(ctxIn('bath', 'night')), 'ex_bath');
    assert.equal(cueFor(ctxIn('tobykey', 'box')), 'ex_clock');
    assert.equal(cueFor(ctxIn('yard', 'rain')), 'ex_rain');
    assert.equal(cueFor(ctxIn('attic_dawn', 'night')), 'ex_dawn');
  });

  test('방 음악과 다른 낱말은 장면 연출로 존중: 찬장 장 머리의 memory 는 그대로', () => {
    assert.equal(cueFor(ctxIn('cupboard', 'memory')), 'memory');
    assert.equal(cueFor(ctxIn('cupboard', 'box')), 'ex_kitchen');
  });

  test('모르는 방은 꾸밈으로, 꾸밈도 모르면 장 묶음(앞 · 가운데 · 끝)의 밤 곡', () => {
    assert.deepEqual(resolveCue({ track: 'night', tone: 'now', room: 'new_room_x', look: 'kitchenNight' }), { id: 'ex_kitchen', by: 'look' });
    assert.deepEqual(resolveCue({ track: 'night', tone: 'now', room: 'zz', act: { n: 1, of: 9 } }), { id: 'night', by: 'act' });
    assert.equal(cueFor({ track: 'night', tone: 'now', room: 'zz', act: { n: 9, of: 9 } }), 'night3');
    assert.equal(cueFor({ track: 'night', tone: 'now', room: 'zz' }), 'night');
  });

  test('깃발: 토비의 태엽 속에서 「끝이 기억 안 나는 노래」를 보고 나면 태엽 속은 못 다 부른 오르골로', () => {
    assert.equal(cueFor(ctxIn('tobykey', 'box')), 'ex_clock');
    assert.deepEqual(resolveCue(ctxIn('tobykey', 'box', { flags: { mem_mTe: true } })), { id: 'orgel', by: 'flag' });
    assert.equal(cueFor(ctxIn('attic', 'night', { flags: { mem_mTe: true } })), 'ex_attic', '다른 방은 그대로');
  });

  test('새벽 · 끝: 새벽빛 속 finale 는 끝까지 부르는 새벽 노래, 끝 자막 뒤 새 방의 오르골은 끝 노래', () => {
    assert.equal(cueFor({ ...ctxIn('m_gm', 'finale'), tone: 'dawn' }), 'dawn_song');
    assert.equal(cueFor(ctxIn('h_newroom', 'box')), 'credits');
    assert.equal(cueFor(ctxIn('h_attic', 'box', { tone: 'dawn' })), 'orgel');
    assert.equal(cueFor(ctxIn('newroom_toy', 'hope')), 'epilogue');
  });

  test('exploreCue: 방 하나의 탐험 곡 (장 이음 검사 · 디버그용)', () => {
    assert.equal(exploreCue('attic', STORY), 'ex_attic');
  });
});

describe('지금 이야기의 모든 방 · 기억이 실제 곡으로 풀린다', () => {
  const chapterRooms = STORY.chapters.map((c) => c.room);

  test('장마다 탐험 곡이 있고 (night · 방 음악 낱말 모두), 이어지는 두 장이 같은 곡을 억지로 쓰지 않는다', () => {
    const seq: string[] = [];
    for (const id of chapterRooms) {
      const r = room(id);
      for (const t of ['night', r.music ?? 'night']) {
        const c = cueFor(ctxIn(id, t));
        assert.ok(c && c in SONGS, `${id} ${t} → ${c}`);
      }
      seq.push(exploreCue(id, STORY)!);
    }
    for (let i = 1; i < seq.length; i++) assert.notEqual(seq[i], seq[i - 1], `${chapterRooms[i - 1]} → ${chapterRooms[i]} 둘 다 ${seq[i]}`);
  });

  test('열세 곳 탐험 곡이 모두 어느 장에서 쓰인다', () => {
    const used = new Set(chapterRooms.map((id) => exploreCue(id, STORY)));
    for (const id of Object.keys(SONGS).filter((k) => k.startsWith('ex_'))) assert.ok(used.has(id as SongId), `${id} 안 쓰임`);
  });

  test('모든 기억 장면의 모든 @music 이 있는 곡(또는 고요)으로 풀리고, 인물 테마가 고루 쓰인다', () => {
    const used = new Map<string, number>();
    let n = 0;
    for (const rid of Object.keys(STORY.rooms)) {
      const r = room(rid);
      for (const t of r.things) {
        if ((t.kind !== 'memory' && t.kind !== 'keepsake') || !('scene' in t)) continue;
        let where = rid;
        for (const c of flat(t.scene)) {
          if (c.t === 'room') where = c.id;
          if (c.t !== 'music') continue;
          const wr = room(where);
          const got = resolveCue({ track: c.track, steps: 'calm', tone: 'memory', memory: t.id, room: wr.id, look: wr.look, roomMusic: wr.music, act: ACT, flags: {} });
          if (c.track === null) assert.equal(got.id, null, `${t.id} 고요`);
          else {
            assert.ok(got.id && got.id in SONGS, `${t.id} ${c.track} → ${got.id}`);
            used.set(got.id, (used.get(got.id) ?? 0) + 1);
            n++;
          }
        }
      }
    }
    assert.ok(n >= 140, `${n}`);
    for (const id of ['toby', 'bori', 'ruru', 'nabi', 'mom', 'dad', 'jiwoo', 'grandma', 'grandma_sepia', 'lullaby', 'haru_child', 'haru_teen', 'orgel', 'reveal', 'box', 'sorrow', 'rain'])
      assert.ok(used.get(id), `${id} 가 어느 기억에도 안 쓰임`);
    assert.ok(used.size >= 18, `기억에 쓰인 곡 ${used.size}가지`);
    const top = Math.max(...used.values());
    assert.ok(top / n < 0.25, `한 곡이 기억의 ${Math.round((top / n) * 100)}% 를 차지`);
  });

  test('장 머리 · 길목 장면의 @music 도 모두 있는 곡으로 풀린다', () => {
    for (const ch of STORY.chapters) {
      let where = ch.room;
      let tone: CueCtx['tone'] = 'now';
      for (const c of flat(ch.intro)) {
        if (c.t === 'room') where = c.id;
        if (c.t === 'tone') tone = c.v;
        if (c.t !== 'music' || c.track === null) continue;
        const got = cueFor({ ...ctxIn(where, c.track), tone, act: { n: ch.n, of: STORY.chapters.length } });
        assert.ok(got && got in SONGS, `${ch.room} ${c.track} → ${got}`);
      }
    }
  });
});
