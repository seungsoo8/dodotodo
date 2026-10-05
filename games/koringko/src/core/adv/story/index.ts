/** 「태엽이 멈추기 전에」 전체 이야기: 방과 장 */
import type { AdvData } from '../adv.ts';
import type { Chapter, RoomDef } from '../types.ts';
import { atticRoom, CH1 } from './ch1.ts';
import { CH2, grandRoom } from './ch2.ts';
import { CH3, underbedRoom } from './ch3.ts';
import { CH4, windowRoom } from './ch4.ts';
import { CH5, deskRoom } from './ch5.ts';
import { CH6, shelfRoom } from './ch6.ts';
import { CH7, drawerRoom } from './ch7.ts';
import { CH8, yardRoom } from './ch8.ts';
import { CH9, toyboxRoom } from './ch9.ts';
import { atticDawnRoom, END, humanAttic, newRoom } from './ending.ts';
import { MEMORY_ROOMS } from './memrooms.ts';

export const CHAPTERS: Chapter[] = [CH1, CH2, CH3, CH4, CH5, CH6, CH7, CH8, CH9, END];

export const ROOMS: Record<string, () => RoomDef> = {
  ...MEMORY_ROOMS,
  attic: atticRoom,
  grandroom: grandRoom,
  underbed: underbedRoom,
  window: windowRoom,
  desk: deskRoom,
  shelf: shelfRoom,
  drawer: drawerRoom,
  yard: yardRoom,
  toybox: toyboxRoom,
  attic_dawn: atticDawnRoom,
  h_attic: humanAttic,
  h_newroom: newRoom,
};

export const STORY: AdvData = { rooms: ROOMS, chapters: CHAPTERS };
