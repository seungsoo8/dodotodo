/**
 * 곡 모음 (투더문처럼: 알아들을 수 있는 메인 테마와 변주, 인물 테마, 곳마다 탐험 곡, 감정 신호).
 * 가락 · 화음은 글자로 적는다 (notation.ts): 마디는 |, 음:길이(16분음표 칸), r 쉼, - 앞 음 늘이기.
 *
 * 테마 지도
 *   메인 테마 「태엽이 멈추기 전에」 = 할머니의 오르골 노래 (미 · 솔 · 라…, score.ts THEME)
 *     옛 편곡 title · box · piano · waltz · minor · rain · finale 에 더해
 *     orgel(핀이 빠져 끝을 못 부르는 오르골) · main_hope(희망) · dawn_song(새벽, 끝까지 부른다) · credits(끝 노래 메들리)
 *   하루의 테마 (라 · 도 · 미…): haru_child(어린 하루, 장조 · 통통) → haru_teen(열다섯, 단조 · 멀리)
 *   할머니의 노래 (파 · 미 · 파 · 라): grandma · grandma_sepia(기억 속 빛바랜) · lullaby(밤 자장가, 3/4) · ex_sewing
 *   토비 · 보리 · 루루 · 나비 동기, 엄마 · 아빠 · 지우 테마
 *   곳마다 밤 탐험 곡 ex_* (이어 틀기 · 쉼 마디 · 고리마다 가락을 덜어 낸다)
 *   신호: sting_memory(기억으로 들어가는 반짝임, 한 번) · reveal(반전) · epilogue(겨울, 3/4)
 */
import type { Song } from './score.ts';
import { parseChords } from './notation.ts';

type Opts = Omit<Song, 'chords' | 'basses' | 'theme' | 'oct'> & Partial<Pick<Song, 'theme' | 'oct'>>;

/** 화음 글자 + 나머지 → 곡 */
const song = (harmony: string, o: Opts): Song => {
  const h = parseChords(harmony);
  return { theme: false, oct: 0, ...o, chords: h.chords, basses: h.bass };
};

/** 메인 테마 여덟 마디 (다장조) */
const MAIN_A = 'E5:4 G5:4 A5:6 G5:2 | E5:4 D5:4 C5:8 | D5:4 E5:4 G5:4 E5:4 | D5:12 r:4 | E5:4 G5:4 A5:6 C6:2 | B5:4 A5:4 G5:8 | A5:4 G5:4 E5:4 D5:4 | C5:12 r:4';
/** 할머니의 노래 여덟 마디 (바장조) */
const GRANDMA_A = 'F5:4 E5:2 F5:2 A5:8 | G5:4 E5:4 C5:8 | D5:4 F5:4 A5:4 G5:4 | G5:12 F5:4 | F5:4 E5:2 F5:2 A5:6 C6:2 | C6:4 B5:4 G5:8 | G5:4 F5:4 E5:4 D5:4 | C5:16';
/** 어린 하루의 테마 여덟 마디 (다장조) */
const HARU_CHILD_A = 'C5:6 E5:2 G5:6 F5:2 | E5:8 C5:4 E5:4 | E5:4 G5:4 B5:6 A5:2 | F5:12 D5:4 | G5:6 A5:2 B5:6 A5:2 | A5:4 G5:4 E5:8 | F5:4 D5:4 F5:4 B5:4 | C6:12 G5:4';
const R8 = (n: number) => Array.from({ length: n }, () => 'r:16').join(' | ');

export const TRACKS = {
  // ───────── 메인 테마 「태엽이 멈추기 전에」 변주 ─────────
  // 못 다 부른 오르골: 여섯째 마디부터 핀이 빠진 듯 음이 비고, 솔(V) 화음에서 멈춘다. 두 번째 시도는 더 성글다
  orgel: song('C Am F G C Em Dm G C Am F G C Am Dm G', {
    bpm: 80, lead: 'box', comp: 'bell', bass: 'none', rest: 2,
    tune: `E5:4 G5:4 A5:6 G5:2 | E5:4 D5:4 C5:8 | D5:4 E5:4 G5:4 E5:4 | D5:12 r:4 | E5:4 G5:4 A5:6 C6:2 | B5:4 A5:4 G5:8 | A5:4 G5:4 r:4 E5:4 | r:4 D5:6 r:6
      | E5:4 G5:4 A5:8 | r:4 E5:4 D5:8 | r:16 | D5:8 r:8 | E5:4 r:4 G5:4 r:4 | A5:8 r:8 | r:16 | r:4 D5:4 r:8`,
  }),
  // 희망: 사장조로 옮겨 첼레스타가 노래하고 기타가 받친다. 두 번째 고리부터 현이 겹친다
  main_hope: song('G Em C D G Bm Am G G Em C D Em C D G', {
    bpm: 92, lead: 'celesta', comp: 'pluck', bass: 'root', perc: 'brush', pad: true, rest: 1,
    tune: `B4:4 D5:4 E5:6 D5:2 | B4:4 A4:4 G4:8 | A4:4 B4:4 D5:4 B4:4 | A4:12 r:4 | B4:4 D5:4 E5:6 G5:2 | F#5:4 E5:4 D5:8 | E5:4 D5:4 B4:4 A4:4 | G4:12 r:4
      | D5:4 G5:4 A5:6 G5:2 | E5:4 D5:4 B4:8 | C5:4 E5:4 G5:4 E5:4 | F#5:12 r:4 | G5:4 B5:4 A5:6 G5:2 | E5:4 G5:4 C6:8 | A5:4 B5:4 F#5:4 E5:4 | G5:12 r:4`,
    voice: 'B4:16 | G4:16 | E4:16 | F#4:16 | G4:16 | F#4:16 | E4:8 F#4:8 | G4:16 | G4:16 | B4:16 | C5:16 | A4:16 | B4:16 | C5:16 | D5:16 | B4:16',
    voiceInst: 'strings', voiceFrom: 1,
  }),
  // 새벽 노래: 오르골이 못 다 부른 자리까지 → 피아노가 받아 끝까지 → 높이 한 번 더 → 끝맺음 (으뜸음 도)
  dawn_song: song('C Am F G C Em Dm G C Am F G C Em Dm C C Am7 Fmaj7 G C Em Dm7 G F G C C', {
    bpm: 72, lead: 'piano', comp: 'sparse', bass: 'root', pad: true, padInst: 'strings',
    tune: `${R8(8)} | ${MAIN_A}
      | E5:4 G5:4 A5:6 G5:2 | E5:4 D5:4 C5:8 | F5:4 A5:4 C6:4 A5:4 | G5:12 r:4 | E5:4 G5:4 A5:6 C6:2 | B5:4 A5:4 G5:8 | A5:4 G5:4 E5:4 D5:4 | D5:4 E5:4 F5:4 B4:4
      | A5:4 C6:4 A5:4 G5:4 | G5:4 F5:4 E5:4 D5:4 | C5:16 | -:12 r:4`,
    voice: `E5:4 G5:4 A5:6 G5:2 | E5:4 D5:4 C5:8 | D5:4 E5:4 G5:4 E5:4 | D5:12 r:4 | E5:4 G5:4 A5:6 C6:2 | B5:4 A5:4 G5:8 | A5:4 G5:4 r:4 E5:4 | r:4 D5:6 r:6
      | ${R8(8)}
      | r:8 E6:4 r:4 | r:16 | r:8 A5:4 r:4 | r:16 | r:8 E6:4 r:4 | r:16 | r:8 G5:4 r:4 | r:16
      | r:16 | r:16 | C5:4 E5:4 G5:8 | C6:12 r:4`,
    voiceInst: 'box',
  }),
  // 끝 노래: 메인 테마 → 어린 하루 → 할머니의 노래 → 메인 테마(끝까지, 현과 함께)
  credits: song('C Am F G C Em Dm C C Am Em G7 C Am G7 C F C Dm G F C G C C Am7 Fmaj7 G C Em Dm7 C', {
    bpm: 76, lead: 'piano', comp: 'arp8', bass: 'root', pad: true, rest: 1,
    tune: `${MAIN_A} | ${HARU_CHILD_A} | ${GRANDMA_A}
      | E5:4 G5:4 A5:6 G5:2 | E5:4 D5:4 C5:8 | F5:4 A5:4 C6:4 A5:4 | G5:12 r:4 | E5:4 G5:4 A5:6 C6:2 | B5:4 A5:4 G5:8 | A5:4 G5:4 E5:4 D5:4 | C5:16`,
    voice: `${R8(16)} | A4:16 | G4:16 | F4:16 | B4:16 | A4:16 | E4:16 | D4:16 | E4:16 | G4:16 | A4:16 | A4:16 | B4:16 | G4:16 | B4:16 | A4:16 | C5:16`,
    voiceInst: 'strings',
  }),

  // ───────── 하루의 테마 ─────────
  // 어린 하루: 장조, 통통 튀는 피아노 + 기타 + 가벼운 북
  haru_child: song('C Am Em G7 C Am G7 C F G C Em F G C C', {
    bpm: 104, lead: 'piano', comp: 'pluck', bass: 'root', perc: 'soft', rest: 2,
    tune: `${HARU_CHILD_A}
      | A5:2 G5:2 E5:4 A5:2 G5:2 E5:4 | G5:2 F5:2 D5:4 G5:2 F5:2 D5:4 | E5:2 D5:2 C5:4 E5:2 G5:2 C6:4 | B5:8 A5:4 G5:4
      | A5:2 G5:2 E5:4 A5:2 C6:2 A5:4 | G5:4 B5:4 D6:8 | C6:4 B5:2 A5:2 G5:4 F5:2 D5:2 | C5:12 r:4`,
  }),
  // 열다섯 하루: 같은 리듬 · 윤곽을 단조로, 펠트 피아노가 멀리서. 현이 깔리고 고리마다 가락을 덜어 낸다
  haru_teen: song('Am F C G Am F G E F G Em Am F G E Am', {
    bpm: 64, lead: 'felt', comp: 'sparse', bass: 'root', pad: true, padInst: 'strings', rest: 2, vary: true,
    tune: `A4:6 C5:2 E5:6 D5:2 | C5:8 A4:4 C5:4 | C5:4 E5:4 G5:6 F5:2 | D5:12 B4:4 | E5:6 F5:2 G5:6 F5:2 | F5:4 E5:4 C5:8 | D5:4 B4:4 D5:4 G5:4 | E5:12 B4:4
      | A5:6 G5:2 F5:8 | G5:6 F5:2 D5:8 | E5:6 D5:2 B4:8 | C5:12 r:4 | A5:6 G5:2 F5:4 C6:4 | B5:8 G5:4 D5:4 | E5:4 C5:4 B4:4 G#4:4 | A4:16`,
  }),

  // ───────── 할머니 ─────────
  // 기억 속 빛바랜 할머니의 노래: 느리게, 펠트 피아노, 두 번째 고리부터 오르골이 반짝
  grandma_sepia: song('F C Dm G F C G C Dm Am Bb C F C C7 F', {
    bpm: 72, lead: 'felt', comp: 'sparse', bass: 'root', pad: true, padInst: 'strings', rest: 2, vary: true,
    tune: `${GRANDMA_A}
      | A5:6 G5:2 F5:8 | E5:6 D5:2 C5:8 | Bb4:4 D5:4 F5:4 A5:4 | G5:12 r:4 | A5:6 G5:2 F5:4 D5:4 | E5:4 G5:4 C6:8 | Bb5:4 A5:4 G5:4 E5:4 | F5:16`,
    voice: 'r:8 C6:8 | r:16 | r:8 F5:8 | r:16 | r:8 C6:8 | r:16 | r:8 D5:8 | r:16 | r:8 D6:8 | r:16 | r:8 F5:8 | r:16 | r:8 C6:8 | r:16 | r:8 G5:8 | r:16',
    voiceInst: 'box', voiceFrom: 1,
  }),
  // 자장가: 할머니의 노래를 3/4 로, 첼레스타 + 펠트 쿵짝짝
  lullaby: song('F C Dm G7 F C G C Dm Am Bb F F C C7 F', {
    bpm: 66, meter: 3, lead: 'celesta', comp: 'waltz', compInst: 'felt', bass: 'none', pad: true, rest: 1,
    tune: `F5:4 E5:2 F5:2 A5:4 | G5:4 E5:4 C5:4 | D5:4 F5:4 A5:4 | G5:8 F5:4 | F5:4 E5:2 F5:2 A5:4 | C6:4 B5:4 G5:4 | G5:4 F5:2 E5:2 D5:4 | C5:12
      | A5:4 G5:2 F5:2 D5:4 | C5:4 E5:4 A5:4 | Bb5:4 A5:4 G5:4 | A5:12 | F5:4 E5:2 F5:2 A5:4 | C6:6 B5:2 A5:4 | G5:4 E5:4 D5:4 | F5:12`,
  }),

  // ───────── 동료 · 가족 ─────────
  // 토비: 태엽 장난감의 행진. 첼레스타 + 기타, 째깍 타악기
  toby: song('G Em C D G G D7 G Em Am D G C G D G', {
    bpm: 104, lead: 'celesta', comp: 'pluck', bass: 'root', perc: 'clock', rest: 1,
    tune: `G5:2 B5:2 D6:4 B5:2 G5:2 A5:4 | B5:2 A5:2 G5:2 E5:2 D5:8 | E5:2 G5:2 C6:4 B5:2 A5:2 G5:4 | A5:4 B5:4 A5:8
      | G5:2 B5:2 D6:4 B5:2 G5:2 A5:4 | B5:2 C6:2 D6:2 E6:2 D6:8 | C6:4 B5:2 A5:2 B5:4 A5:4 | G5:12 r:4
      | E5:8 G5:4 B5:4 | A5:12 G5:4 | F#5:4 A5:4 D6:8 | B5:16 | C6:8 B5:4 A5:4 | G5:4 A5:4 B5:8 | A5:4 G5:4 F#5:4 A5:4 | G5:16`,
  }),
  // 보리: 낡은 곰 인형, 옛집의 느린 펠트 피아노
  bori: song('F C F C F Dm Bb F', {
    bpm: 72, lead: 'felt', comp: 'sparse', compInst: 'felt', bass: 'root', pad: true, padInst: 'strings', rest: 1,
    tune: 'C5:6 D5:2 F5:8 | E5:4 D5:4 C5:8 | A4:6 Bb4:2 C5:4 F5:4 | E5:12 r:4 | C5:6 D5:2 F5:8 | A5:4 G5:4 F5:8 | D5:4 E5:4 F5:4 G5:4 | F5:12 r:4',
  }),
  // 루루: 살금살금 고양이, 뜯는 줄 스타카토
  ruru: song('Dm Dm C7 A Dm Gm6 Dm A Dm C Bb A', {
    bpm: 120, lead: 'pluck', comp: 'bounce', compInst: 'felt', bass: 'none', perc: 'soft', rest: 1, vary: true,
    tune: `D5:2 r:2 F5:2 r:2 A5:2 G5:2 F5:2 E5:2 | D5:2 r:2 A4:4 r:8 | E5:2 r:2 G5:2 r:2 Bb5:2 A5:2 G5:2 F5:2 | E5:2 r:2 A4:4 r:8
      | F5:2 G5:2 A5:2 r:2 D6:4 C6:4 | Bb5:2 A5:2 G5:2 F5:2 E5:8 | F5:2 E5:2 D5:2 C#5:2 D5:2 E5:2 F5:2 G5:2 | A5:4 C#5:4 D5:8
      | A5:4 F5:4 D5:4 F5:4 | G5:4 E5:4 C5:4 E5:4 | F5:2 E5:2 D5:2 E5:2 F5:4 A5:4 | E5:8 r:8`,
  }),
  // 나비: 등불을 단 나비, 3/4 로 떠다니는 첼레스타
  nabi: song('D A Em D D Bm A7 D G Em A Bm G D A D', {
    bpm: 84, meter: 3, lead: 'celesta', comp: 'waltz', compInst: 'felt', bass: 'none', pad: true, rest: 1,
    tune: `F#5:4 A5:4 D6:4 | C#6:8 A5:4 | B5:4 G5:4 E5:4 | F#5:12 | F#5:4 A5:4 E6:4 | D6:8 B5:4 | A5:4 G5:4 E5:4 | D5:12
      | G5:4 B5:4 D6:4 | E6:8 D6:4 | C#6:4 B5:4 A5:4 | B5:12 | G5:4 B5:4 D6:4 | F#6:8 E6:4 | C#6:4 B5:4 E6:4 | D6:12`,
  }),
  // 엄마: 피아노와 현, 내림나장조의 다정한 노래
  mom: song('Bb Bb/D Eb F Bb Gm F7 Bb Eb Bb Cm F Eb Bb Eb Bb', {
    bpm: 70, lead: 'piano', comp: 'arp8', bass: 'root', rest: 2,
    tune: `F4:4 Bb4:4 D5:6 C5:2 | Bb4:4 C5:4 D5:8 | Eb5:4 D5:4 C5:4 Bb4:4 | C5:12 r:4 | F4:4 Bb4:4 D5:6 F5:2 | G5:4 F5:4 D5:8 | Eb5:4 D5:4 C5:6 Bb4:2 | Bb4:12 r:4
      | G5:6 F5:2 Eb5:8 | D5:6 C5:2 Bb4:8 | C5:4 D5:4 Eb5:4 G5:4 | F5:16 | G5:6 F5:2 Eb5:8 | D5:4 F5:4 Bb5:8 | G5:4 F5:4 Eb5:4 C5:4 | Bb4:16`,
    voice: 'D5:16 | F5:16 | G5:16 | A4:16 | D5:16 | Bb4:16 | A4:16 | F4:16 | Bb4:16 | F4:16 | G4:16 | A4:16 | Bb4:16 | D5:16 | G4:16 | F4:16',
    voiceInst: 'strings',
  }),
  // 아빠: 살짝 우스운, 통통 튀는 피아노와 걷는 베이스
  dad: song('F C C7 F F Dm7 C7 F F Dm C F', {
    bpm: 108, lead: 'piano', comp: 'bounce', compInst: 'pluck', bass: 'none', perc: 'soft', rest: 1,
    tune: `C5:2 r:2 C5:2 D5:2 F5:4 A5:4 | G5:2 F5:2 E5:2 F5:2 G5:8 | Bb5:2 r:2 Bb5:2 A5:2 G5:4 E5:4 | F5:2 G5:2 A5:2 G5:2 F5:8
      | C5:2 r:2 C5:2 D5:2 F5:4 A5:4 | C6:4 Bb5:2 A5:2 G5:8 | Bb5:2 A5:2 G5:2 F5:2 E5:2 F5:2 G5:2 E5:2 | F5:4 C5:4 F5:4 r:4
      | A5:4 F5:4 Bb5:4 G5:4 | A5:2 Bb5:2 A5:2 G5:2 F5:8 | G5:4 E5:4 C5:4 E5:4 | F5:8 r:8`,
  }),
  // 지우: 우정, 기타 펼침 위의 피아노, 솔질 북
  jiwoo: song('A F#m D E A F#m E7 A D A Bm E Bm A E E', {
    bpm: 100, lead: 'piano', comp: 'pluck', bass: 'root', perc: 'brush', rest: 2,
    tune: `E5:4 C#5:2 E5:2 A5:6 E5:2 | F#5:4 E5:4 C#5:8 | D5:4 F#5:2 A5:2 B5:6 A5:2 | G#5:4 F#5:4 E5:8 | E5:4 C#5:2 E5:2 A5:6 B5:2 | C#6:4 B5:4 A5:8 | E5:4 A5:2 F#5:2 E5:4 D5:4 | C#5:12 r:4
      | D5:4 F#5:4 A5:8 | C#5:4 E5:4 A5:8 | D5:4 F#5:4 B5:8 | G#5:12 r:4 | D5:4 F#5:4 B5:8 | C#6:4 B5:4 A5:8 | B5:4 A5:4 G#5:4 F#5:4 | E5:16`,
  }),

  // ───────── 지금(밤) 탐험: 곳마다 ─────────
  // 다락: 달빛 먼지, 메인 테마 조각이 오르골로 드문드문 (가단조)
  ex_attic: song('Am Am F F C C G G Am Am F F Dm Dm E E', {
    bpm: 66, lead: 'box', comp: 'sparse', bass: 'none', pad: true, rest: 2, vary: true, resume: true,
    tune: 'E5:4 G5:4 A5:8 | r:16 | A5:4 G5:4 F5:8 | r:16 | E5:4 G5:4 C6:8 | r:16 | B5:4 A5:4 G5:8 | r:16 | C6:8 B5:4 A5:4 | E5:16 | F5:4 A5:4 C6:8 | r:16 | D5:4 F5:4 A5:8 | r:16 | G#5:4 B5:4 E6:8 | r:16',
  }),
  // 할머니 방: 펠트 피아노 펼침, 할머니의 노래 첫 소절이 한 번 스친다
  ex_grandma: song('F F Dm Dm Bb Bb C C F F Am Am Bb C F F', {
    bpm: 64, lead: 'felt', comp: 'arp8', compInst: 'felt', bass: 'root', pad: true, padInst: 'strings', rest: 2, vary: true, resume: true,
    tune: 'A5:4 G5:2 A5:2 C6:8 | r:16 | F5:4 E5:2 F5:2 A5:8 | r:16 | D5:4 F5:4 Bb5:8 | r:16 | C5:4 E5:4 G5:8 | r:16 | A5:6 G5:2 F5:8 | C5:16 | E5:4 A5:4 C6:8 | A5:8 E5:8 | F5:4 D5:4 Bb4:8 | G5:4 E5:4 C5:8 | A5:4 G5:4 F5:8 | r:16',
  }),
  // 현관 · 복도: 라단조, 기타가 조용히 걷고 펠트 가락이 문 쪽을 본다
  ex_hall: song('Dm Dm Bb Bb Gm Gm A A Dm Dm F F Gm A Dm Dm', {
    bpm: 72, lead: 'felt', comp: 'pluck', bass: 'none', pad: true, padInst: 'strings', rest: 2, vary: true, resume: true,
    tune: 'D5:4 F5:4 A5:8 | r:16 | F5:4 D5:4 Bb4:8 | r:16 | Bb4:4 D5:4 G5:8 | r:16 | A4:4 C#5:4 E5:8 | r:16 | A5:6 G5:2 F5:4 D5:4 | F5:16 | C6:6 A5:2 F5:8 | r:16 | Bb5:4 A5:4 G5:8 | E5:4 C#5:4 A4:8 | D5:16 | r:16',
  }),
  // 거실: 창으로 든 달빛, 펠트 덩어리 화음 위 첼레스타 (사장조)
  ex_living: song('G G Em Em C C D D G G Bm Bm C D G G', {
    bpm: 70, lead: 'celesta', comp: 'block', bass: 'root', rest: 2, vary: true, resume: true,
    tune: 'B4:4 D5:4 G5:8 | r:16 | G5:4 F#5:4 E5:8 | r:16 | E5:4 G5:4 C6:8 | r:16 | F#5:4 A5:4 D6:8 | r:16 | D6:8 B5:4 G5:4 | B5:16 | F#5:4 D5:4 B4:8 | r:16 | C6:4 B5:4 G5:8 | A5:4 F#5:4 D5:8 | G5:16 | r:16',
  }),
  // 부엌 · 찬장: 냉장고 웅웅 사이로 살금살금 뜯는 줄, 가벼운 북
  ex_kitchen: song('F F C C Dm Dm Bb C F F Am Am Bb C F F', {
    bpm: 92, lead: 'pluck', comp: 'bounce', compInst: 'felt', bass: 'none', perc: 'soft', rest: 2, vary: true, resume: true,
    tune: `C5:2 r:2 F5:2 r:2 A5:2 r:2 G5:2 F5:2 | A5:4 G5:4 r:8 | G5:2 r:2 C5:2 r:2 E5:2 r:2 D5:2 C5:2 | E5:4 G5:4 r:8
      | F5:2 r:2 A5:2 r:2 D6:2 r:2 C6:2 A5:2 | r:16 | Bb5:4 A5:4 G5:4 F5:4 | E5:4 G5:4 C5:8
      | r:16 | A4:2 C5:2 F5:2 A5:2 C6:8 | r:16 | E5:2 A5:2 C6:2 E6:2 C6:8 | D6:4 Bb5:4 F5:8 | E5:4 G5:4 Bb5:8 | A5:4 F5:4 C5:4 F5:4 | r:16`,
  }),
  // 하루의 방: 열다섯 하루의 테마 조각, 펠트 피아노 오르내림 위로 현
  ex_haru: song('Am Am Fmaj7 Fmaj7 C C Em Em F F G G Am Am E E', {
    bpm: 62, lead: 'felt', comp: 'shimmer', compInst: 'felt', bass: 'root', pad: true, padInst: 'strings', rest: 2, vary: true, resume: true,
    tune: 'A4:6 C5:2 E5:6 D5:2 | C5:16 | r:16 | A4:6 C5:2 E5:8 | G5:6 F5:2 E5:8 | r:16 | B4:6 D5:2 G5:8 | r:16 | C5:6 F5:2 A5:6 G5:2 | F5:16 | D5:6 G5:2 B5:8 | r:16 | C6:8 B5:4 A5:4 | E5:16 | G#4:6 B4:2 E5:8 | r:16',
  }),
  // 책상 위: 스탠드 불빛, 종이별. 첼레스타 반짝임 위 피아노
  ex_desk: song('C C G/B G/B Am Am F F C C G G F F G G', {
    bpm: 80, lead: 'piano', comp: 'shimmer', bass: 'root', rest: 2, vary: true, resume: true,
    tune: 'G5:4 E5:4 C6:8 | r:16 | D5:4 G5:4 B5:8 | r:16 | C5:4 E5:4 A5:8 | r:16 | A5:4 G5:4 F5:8 | r:16 | E5:4 G5:4 C6:4 E6:4 | C6:12 r:4 | B5:4 G5:4 D5:8 | r:16 | A5:4 C6:4 F6:8 | C6:4 A5:4 F5:8 | G5:4 B5:4 D6:8 | r:16',
  }),
  // 욕실: 물방울처럼 떨어지는 높은 첼레스타, 바탕 화음만 (마단조)
  ex_bath: song('Em Em C C Am Am B B Em Em C C Am B Em Em', {
    bpm: 60, lead: 'celesta', comp: 'none', bass: 'none', pad: true, rest: 2, vary: true, resume: true,
    tune: 'B5:2 r:6 E6:2 r:6 | r:8 G5:2 r:6 | C6:2 r:6 G5:2 r:6 | E5:8 r:8 | A5:2 r:6 C6:2 r:6 | r:16 | B5:2 r:2 D#6:2 r:2 F#6:8 | r:16 | E6:2 r:6 B5:2 r:6 | G5:8 r:8 | G5:2 r:6 E5:2 r:6 | C6:16 | A5:2 r:2 C6:2 r:2 E6:8 | D#6:2 r:2 B5:2 r:2 F#5:8 | E5:16 | r:16',
  }),
  // 베란다 · 골목: 밤바람, 현이 길게 노래하고 기타가 받친다 (나단조)
  ex_outside: song('Bm Bm G G D D A A Bm Bm G G Em F# Bm Bm', {
    bpm: 76, lead: 'strings', comp: 'pluck', bass: 'none', rest: 2, vary: true, resume: true,
    tune: 'F#5:8 D5:8 | B4:16 | D5:8 G5:8 | B5:16 | A5:8 F#5:8 | D5:16 | E5:8 C#5:8 | A4:16 | D5:8 F#5:8 | B5:16 | B5:8 G5:8 | D6:16 | E6:8 B5:8 | C#6:8 A#5:8 | B5:16 | r:16',
  }),
  // 비 오는 마당: 가단조 피아노, 펠트 펼침이 빗방울처럼
  ex_rain: song('Am Am Dm Dm E E Am Am F F C C Dm E Am Am', {
    bpm: 66, lead: 'piano', comp: 'arp8', compInst: 'felt', bass: 'none', pad: true, rest: 2, vary: true, resume: true,
    tune: 'C5:4 B4:4 A4:8 | r:16 | F5:4 E5:4 D5:8 | r:16 | E5:4 G#5:4 B5:8 | r:16 | C6:4 B5:4 A5:8 | r:16 | A5:6 G5:2 F5:8 | r:16 | G5:6 E5:2 C5:8 | r:16 | D5:4 F5:4 A5:8 | G#5:4 B5:4 E5:8 | A4:16 | r:16',
  }),
  // 토비의 태엽 속: 톱니처럼 되풀이하는 오르골과 째깍, 펠트 가락
  ex_clock: song('Dm Dm C C Bb Bb A A Dm Dm C C Bb A Dm Dm', {
    bpm: 96, lead: 'felt', comp: 'clock', bass: 'root', perc: 'clock', rest: 2, vary: true, resume: true,
    tune: 'D5:8 F5:8 | A5:16 | G5:8 E5:8 | C5:16 | D5:8 F5:8 | Bb5:16 | A5:8 C#5:8 | E5:16 | F5:4 E5:4 D5:4 A5:4 | D6:16 | C6:4 Bb5:4 G5:4 E5:4 | G5:16 | F5:4 D5:4 Bb4:8 | E5:4 C#5:4 A4:8 | D5:16 | r:16',
  }),
  // 재봉 상자: 할머니의 노래를 3/4 오르골로 조각조각, 기타 펼침
  ex_sewing: song('F F C C Dm C C F F C Dm Bb F C Bb F', {
    bpm: 76, meter: 3, lead: 'box', comp: 'pluck', bass: 'none', rest: 2, vary: true, resume: true,
    tune: 'F5:4 E5:2 F5:2 A5:4 | -:12 | G5:4 E5:4 C5:4 | r:12 | D5:4 F5:4 A5:4 | G5:12 | r:12 | r:12 | A5:6 G5:2 F5:4 | E5:12 | F5:4 G5:4 A5:4 | Bb5:12 | A5:4 G5:4 F5:4 | E5:6 D5:2 C5:4 | D5:4 E5:4 G5:4 | F5:12',
  }),
  // 새벽: 현이 아래에서부터 천천히 올라오고, 메인 테마가 피아노로 돌아온다
  ex_dawn: song('C C G G Am Am F F C C G G F G C C', {
    bpm: 72, lead: 'piano', comp: 'sparse', bass: 'root', rest: 2, vary: true, resume: true,
    tune: 'E5:4 G5:4 A5:6 G5:2 | E5:16 | D5:4 G5:4 B5:8 | r:16 | C5:4 E5:4 A5:8 | r:16 | A5:4 G5:4 F5:8 | r:16 | E5:4 G5:4 A5:6 C6:2 | G5:16 | B5:4 A5:4 G5:4 D5:4 | r:16 | A5:4 G5:4 E5:4 D5:4 | D5:16 | C5:16 | r:16',
    voice: 'C4:16 | E4:16 | D4:16 | G4:16 | A4:16 | C5:16 | A4:16 | C5:16 | E5:16 | G5:16 | G5:16 | B5:16 | A5:16 | B5:16 | C6:16 | -:16',
    voiceInst: 'strings',
  }),

  // ───────── 신호 ─────────
  // 기억으로 들어가는 반짝임: 올라가는 첼레스타 한 번
  sting_memory: song('Cmaj7 Cmaj7', {
    bpm: 90, lead: 'celesta', comp: 'pad', bass: 'none', once: true,
    tune: 'C5:1 E5:1 G5:1 B5:1 C6:1 E6:1 G6:1 B6:1 C7:8 | -:16',
  }),
  // 반전: 할머니가 숨긴 것. 낮은 현의 맥박 위로 펠트 피아노 높은 음
  reveal: song('Dm Dm/C Bbmaj7 A Dm Dm/C Gm A7 Bb Gm A A', {
    bpm: 58, lead: 'felt', comp: 'pulse', bass: 'root', rest: 1,
    tune: 'A5:16 | F5:8 E5:8 | D5:16 | C#5:16 | A5:8 Bb5:8 | A5:8 G5:8 | G5:8 Bb5:8 | A5:16 | F5:8 D5:8 | Bb4:8 D5:8 | E5:8 C#5:8 | A4:16',
  }),
  // 에필로그 겨울: 3/4 첼레스타, 솔질 방울, 뒤에서 메인 테마 첫 소절(라 · 도 · 레)을 바장조로 인용
  epilogue: song('F C C F Gm F C7 F F Bb C7 F Dm C Bb C Dm F F Dm Bb F C F', {
    bpm: 92, meter: 3, lead: 'celesta', comp: 'pluck', bass: 'none', perc: 'soft', pad: true, padInst: 'strings', rest: 1,
    tune: `C5:4 F5:4 A5:4 | G5:8 F5:4 | E5:4 G5:4 C6:4 | A5:12 | Bb5:4 A5:4 G5:4 | A5:8 F5:4 | G5:4 A5:4 Bb5:4 | A5:12
      | C6:4 A5:4 F5:4 | D6:8 C6:4 | Bb5:4 G5:4 E5:4 | F5:12 | D5:4 F5:4 A5:4 | G5:8 E5:4 | F5:4 E5:4 D5:4 | C5:12
      | A5:4 C6:4 D6:4 | C6:4 A5:4 G5:4 | A5:4 C6:4 D6:4 | F6:8 E6:4 | D6:4 C6:4 A5:4 | C6:8 A5:4 | G5:4 A5:4 E5:4 | F5:12`,
  }),
} satisfies Record<string, Song>;
