/**
 * 막(幕) 구성 (ACTS.md B-1 · D-3): 이웃한 옛 장의 방 2~3개를 한 막으로 묶는다.
 * 첫 방의 장 도입이 막 도입이 되고, 둘째 · 셋째 방의 옛 장 도입은 그 방에 처음 들어설 때(enter) 나온다.
 * 방 시각은 옛 장 시각 그대로 (23:10 → 04:40), 지운 놀이가 놓아 두던 길 · 계단은 방의 preset 깃발로 늘 서 있다.
 */
import type { HeroId } from '../../types.ts';
import type { ActRoom, ChainStep, Chapter, Pt } from '../types.ts';
import { nightClocks } from '../clock.ts';
import { ATTIC_CHAIN, CH1 } from './ch1.ts';
import { CH2, GRANDROOM_CHAIN } from './ch2.ts';
import { CH_DRESSER, DRESSER_CHAIN } from './ch_dresser.ts';
import { CH3, UNDERBED_CHAIN } from './ch3.ts';
import { CH_CLOSET, CLOSET_CHAIN } from './ch_closet.ts';
import { CH4, WINDOW_CHAIN } from './ch4.ts';
import { CH_ENTRANCE, ENTRANCE_CHAIN } from './ch_entrance.ts';
import { CH_SCHOOLBAG, SCHOOLBAG_CHAIN } from './ch_schoolbag.ts';
import { CH5, DESK_CHAIN } from './ch5.ts';
import { BATH_CHAIN, CH_BATH } from './ch_bath.ts';
import { CH6, SHELF_CHAIN } from './ch6.ts';
import { CH7, DRAWER_CHAIN } from './ch7.ts';
import { BALCONY_CHAIN, CH_BALCONY } from './ch_balcony.ts';
import { CH_SOFA, SOFA_CHAIN } from './ch_sofa.ts';
import { CH8, YARD_CHAIN } from './ch8.ts';
import { CH_OUTSIDE, OUTSIDE_CHAIN } from './ch_outside.ts';
import { CH_TOBYKEY, TOBYKEY_CHAIN } from './ch_tobykey.ts';
import { CH9, TOYBOX_CHAIN } from './ch9.ts';
import { CH_CUPBOARD, CUPBOARD_CHAIN } from './ch_cupboard.ts';
import { CH_GRANDMA, SEWBOX_CHAIN } from './ch_grandma.ts';

/** 옛 장 차례대로의 방 (이삿날 밤 시각을 이 차례로 나눈다) */
export const OLD_ORDER = ['attic', 'grandroom', 'dresser', 'underbed', 'closet', 'window', 'entrance', 'schoolbag', 'desk', 'bath', 'shelf', 'drawer', 'balcony', 'sofa', 'yard', 'outside', 'tobykey', 'toybox', 'cupboard', 'sewbox'] as const;

/** 방마다 이삿날 밤 시각 (옛 장 시각 그대로: 23:10 … 04:40) */
export const ROOM_CLOCK: Record<string, string> = Object.fromEntries(OLD_ORDER.map((r, i) => [r, nightClocks(OLD_ORDER.length)[i]]));

interface ActPart {
  /** 그 방의 옛 장 (방 · 시작 칸 · 도입) */
  ch: Chapter;
  name: string;
  preset?: string[];
  chain: ChainStep[];
}

/** 막 하나: 첫 방의 장이 막의 방 · 시작 · 무리 · 태엽 · 도입을 정하고, 나머지 방은 문으로 이어진다 */
export function act(title: string, sub: string, parts: ActPart[], o: { start?: Pt; party?: HeroId[] } = {}): Chapter {
  const head = parts[0].ch;
  const rooms: ActRoom[] = parts.map((p, i) => ({
    id: p.ch.room,
    name: p.name,
    ...(ROOM_CLOCK[p.ch.room] ? { clock: ROOM_CLOCK[p.ch.room] } : {}),
    ...(p.preset?.length ? { preset: [...p.preset] } : {}),
    ...(i ? { enter: p.ch.intro, start: p.ch.start } : {}),
  }));
  return {
    n: 0,
    title,
    sub,
    room: head.room,
    start: o.start ?? head.start,
    party: o.party ?? head.party,
    wind: head.wind,
    intro: head.intro,
    ...(ROOM_CLOCK[head.room] ? { clock: ROOM_CLOCK[head.room] } : {}),
    follow: true,
    rooms,
    chain: parts.flatMap((p) => p.chain),
  };
}

export const ACT1 = act('1막 · 두고 가는 짐', '15살 · 다락방', [{ ch: CH1, name: '다락방', chain: ATTIC_CHAIN }]);
export const ACT2 = act('2막 · 닫힌 문', '14살 · 할머니 방, 엄마의 화장대', [
  { ch: CH2, name: '할머니 방', preset: ['stack_ok', 'chair_set', 'box_set'], chain: GRANDROOM_CHAIN },
  { ch: CH_DRESSER, name: '엄마의 화장대', preset: ['steps_ok'], chain: DRESSER_CHAIN },
]);
export const ACT3 = act('3막 · 상자에 넣은 밤', '13살 · 하루 방, 나비의 이불장', [
  { ch: CH3, name: '침대 밑', chain: UNDERBED_CHAIN },
  { ch: CH_CLOSET, name: '나비의 이불장', preset: ['pillow_set'], chain: CLOSET_CHAIN },
]);
export const ACT4 = act('4막 · 괜찮다는 말', '12·11살 · 거실 창가, 현관', [
  { ch: CH4, name: '거실 창가', chain: WINDOW_CHAIN },
  { ch: CH_ENTRANCE, name: '현관', chain: ENTRANCE_CHAIN },
]);
export const ACT5 = act('5막 · 노란 별', '10살 · 하루의 책가방, 책상 위', [
  { ch: CH_SCHOOLBAG, name: '하루의 책가방', chain: SCHOOLBAG_CHAIN },
  { ch: CH5, name: '책상 위', preset: ['gap_g9pencil', 'er_big', 'er_small', 'code_ok', 'seen_tin'], chain: DESK_CHAIN },
]);
export const ACT6 = act(
  '6막 · 웃은 자국',
  '9·8살 · 욕실, 거실 책장',
  [
    { ch: CH_BATH, name: '욕실', chain: BATH_CHAIN },
    { ch: CH6, name: '거실 책장', preset: ['st1', 'st2', 'st3', 'stairs_done'], chain: SHELF_CHAIN },
  ],
  // 욕실의 옛 시작 칸 [10,14] 은 계단으로 가는 문 자리라 두 칸 위에서 시작한다
  { start: [10, 12] },
);
export const ACT7 = act('7막 · 매일 해 주던 일', '7·6살 · 과자 서랍, 베란다, 소파 밑', [
  { ch: CH7, name: '과자 서랍', chain: DRAWER_CHAIN },
  { ch: CH_BALCONY, name: '베란다', chain: BALCONY_CHAIN },
  { ch: CH_SOFA, name: '소파 밑', chain: SOFA_CHAIN },
]);
export const ACT8 = act('8막 · 매일 걷던 길', '5살 · 비 오는 마당, 골목 끝 놀이터', [
  { ch: CH8, name: '비 오는 마당', chain: YARD_CHAIN },
  { ch: CH_OUTSIDE, name: '골목 끝 놀이터', preset: ['gap_gOut'], chain: OUTSIDE_CHAIN },
]);
export const ACT9 = act('9막 · 감는 사람, 기다리는 사람', '4살 · 토비의 태엽 속, 장난감 상자', [
  { ch: CH_TOBYKEY, name: '토비의 태엽 속', preset: ['gap_gTbridge'], chain: TOBYKEY_CHAIN },
  { ch: CH9, name: '장난감 상자', chain: TOYBOX_CHAIN },
]);
export const ACT10 = act('10막 · 맡겨진 것들', '순이 · 보리의 찬장, 할머니의 재봉 상자', [
  { ch: CH_CUPBOARD, name: '보리의 찬장', preset: ['step_box', 'bowls_moved'], chain: CUPBOARD_CHAIN },
  { ch: CH_GRANDMA, name: '할머니의 재봉 상자', preset: ['gap_gG'], chain: SEWBOX_CHAIN },
]);

/** 1막 → 10막 */
export const ACTS: Chapter[] = [ACT1, ACT2, ACT3, ACT4, ACT5, ACT6, ACT7, ACT8, ACT9, ACT10];

/** 방마다 옛 장의 태엽 (막의 둘째 · 셋째 방 enter 첫머리의 @wind 가 이 값이다) */
export const ROOM_WIND: Record<string, number> = Object.fromEntries(
  [CH1, CH2, CH_DRESSER, CH3, CH_CLOSET, CH4, CH_ENTRANCE, CH_SCHOOLBAG, CH5, CH_BATH, CH6, CH7, CH_BALCONY, CH_SOFA, CH8, CH_OUTSIDE, CH_TOBYKEY, CH9, CH_CUPBOARD, CH_GRANDMA].map((c) => [c.room, c.wind]),
);
