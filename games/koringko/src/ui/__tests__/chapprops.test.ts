/**
 * 장 소품 (props_a ~ props_e) 손찍기 격자 시험:
 * 모든 kind 가 손으로 찍은 격자로 그려지고(격자 검사 통과 · 빈 그림 아님), 원래 그림의 크기 계약(w · h · ox · oy · 나눔)을 지킨다.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { CLEAR, rgb, type Pix } from '../art/paint.ts';
import { checkGrid, gridSize } from '../art/px/grid.ts';
import { blank, hs, nine, put, tile, vs } from '../art/px/chapkit.ts';
import { PROPS_A_KINDS, propSpriteA } from '../art/props_a.ts';
import { PROPS_B, propsB } from '../art/props_b.ts';
import { PROPS_C_KINDS, propsC } from '../art/props_c.ts';
import { PROPS_D, propDSprite } from '../art/props_d.ts';
import { PROPS_E_KINDS, propSpriteE } from '../art/props_e.ts';
import { PX_A } from '../art/px/chapA.ts';
import { PX_B } from '../art/px/chapB.ts';
import { PX_C } from '../art/px/chapC.ts';
import { PX_D } from '../art/px/chapD.ts';
import { PX_E } from '../art/px/chapE.ts';

type Row = [string, number, number, string, number, number, number, number, number, string];
/** 원래 그림에서 잰 계약: kind · 칸 w · h · opt → 그림 폭 · 높이 · ox · oy · topSplitY · 나눔(w 벽 · t 윗층 · b 뒤 · f 앞 · F 3면) */
const CONTRACT: Record<string, Row[]> = {
  A: [
    ['haruBed', 3, 2, '', 72, 66, -10, -66, 0, 'bf'],
    ['haruBed', 4, 2, 'yarn', 96, 66, -10, -66, 0, 'bf'],
    ['haruBed', 4, 2, 'dawn', 96, 66, -10, -66, 0, 'bf'],
    ['haruBed', 4, 2, 'empty', 96, 66, -10, -66, 0, 'bf'],
    ['haruBed', 4, 2, '', 96, 66, -10, -66, 0, 'bf'],
    ['chairBag', 1, 1, '', 24, 46, 0, -46, 0, ''],
    ['chairBag', 1, 1, 'open', 24, 46, 0, -46, 0, ''],
    ['pencilFolks', 3, 1, '', 72, 32, 0, -32, 0, 'w'],
    ['pencilFolks', 3, 1, 'out', 72, 32, 0, -32, 0, ''],
    ['hangerRack', 1, 1, '', 24, 68, 0, -68, 20, 't'],
    ['boxMark', 1, 1, '', 24, 24, 0, -24, 0, 'w'],
    ['wasteBin', 1, 1, '', 24, 22, 0, -22, 0, ''],
    ['sockOne', 1, 1, '', 24, 24, 0, -24, 0, ''],
    ['sockOne', 1, 1, 'pair', 24, 24, 0, -24, 0, ''],
    ['dressBag', 1, 1, '', 24, 24, 0, -24, 0, ''],
    ['dustGhost', 1, 1, '', 24, 24, 0, -24, 0, 'w'],
    ['mugRings', 1, 1, '', 24, 24, 0, -24, 0, 'w'],
    ['breadTie', 1, 1, '', 24, 24, 0, -24, 0, ''],
    ['coat', 1, 1, '', 24, 28, 0, -28, 0, ''],
    ['crayonTin', 1, 1, '', 24, 24, 0, -24, 0, ''],
    ['stickerBag', 1, 1, '', 24, 24, 0, -24, 0, ''],
    ['blockBox', 1, 1, '', 24, 28, 0, -28, 0, ''],
    ['zipTab', 1, 1, '', 24, 24, 0, -24, 0, ''],
    ['zipTab', 1, 1, 'open', 24, 24, 0, -24, 0, ''],
    ['crayonScrap', 1, 1, '', 24, 24, 0, -24, 0, ''],
    ['glowStar', 1, 1, '', 24, 24, 0, -24, 0, 'w'],
    ['glowStar', 1, 1, 'many', 24, 24, 0, -24, 0, 'w'],
  ],
  B: [
    ['sheet', 2, 1, '', 48, 30, 0, -30, 0, ''],
    ['sheet', 2, 1, 'mid', 48, 36, 0, -36, 0, ''],
    ['sheet', 3, 1, 'tall', 72, 80, 0, -80, 32, 't'],
    ['sheet', 2, 1, 'mid,off', 48, 36, 0, -36, 0, ''],
    ['sheet', 3, 1, 'tall,off', 72, 80, 0, -80, 32, 't'],
    ['sheet', 2, 1, 'low', 48, 30, 0, -30, 0, ''],
    ['sheet', 2, 1, 'low,off', 48, 30, 0, -30, 0, ''],
    ['quilts', 2, 1, '', 48, 27, 0, -27, 0, ''],
    ['quilts', 3, 2, '2', 72, 20, 0, -20, 0, ''],
    ['quilts', 1, 1, '4', 24, 34, 0, -34, 0, ''],
    ['quilts', 2, 1, '2', 48, 20, 0, -20, 0, ''],
    ['quilts', 2, 1, '4', 48, 34, 0, -34, 0, ''],
    ['quilts', 1, 1, '3', 24, 27, 0, -27, 0, ''],
    ['quilts', 2, 1, '3', 48, 27, 0, -27, 0, ''],
    ['quilts', 1, 1, '2', 24, 20, 0, -20, 0, ''],
    ['quilts', 2, 1, '3,pouch', 48, 27, 0, -27, 0, ''],
    ['quilts', 2, 1, 'pouch', 48, 27, 0, -27, 0, ''],
    ['dustRing', 1, 1, '', 24, 24, 0, -24, 0, 'w'],
    ['dustRing', 1, 1, 'four', 24, 24, 0, -24, 0, 'w'],
    ['flashlight', 1, 1, '', 24, 24, 0, -24, 0, ''],
    ['glowStar', 1, 1, '', 24, 24, 0, -24, 0, 'w'],
    ['glowStar', 1, 1, 'many', 24, 24, 0, -24, 0, 'w'],
    ['fogPane', 1, 1, '', 24, 34, 0, -34, 0, ''],
    ['cordKnot', 1, 1, '', 24, 24, 0, -24, 0, 'w'],
    ['cordKnot', 1, 1, 'over', 24, 24, 0, -24, 0, 'w'],
    ['cordKnot', 1, 1, 'under', 24, 24, 0, -24, 0, 'w'],
    ['phoneCord', 1, 1, '', 24, 24, 0, -24, 0, 'w'],
    ['phoneCord', 1, 1, 'v', 24, 24, 0, -24, 0, 'w'],
    ['visitorPass', 1, 1, '', 24, 24, 0, -24, 0, ''],
    ['tickets', 1, 1, '', 24, 24, 0, -24, 0, ''],
  ],
  C: [
    ['fridge', 2, 1, '', 48, 78, 0, -78, 30, 'tF'],
    ['fridge', 2, 1, 'ajar', 48, 78, 0, -78, 30, 'tF'],
    ['kcounter', 6, 1, '', 144, 35, 0, -35, 0, 'F'],
    ['kcounter', 8, 1, 'stove@0,sink@3', 192, 35, 0, -35, 0, 'F'],
    ['kcounter', 4, 1, 'drawer@2', 96, 35, 0, -35, 0, 'F'],
    ['kcounter', 4, 1, 'drawer@2,open', 96, 45, 0, -35, 0, 'F'],
    ['kcounter', 6, 1, 'drawer@1,open', 144, 45, 0, -35, 0, 'F'],
    ['wallCab', 3, 2, '', 72, 56, 0, -56, 0, 'w'],
    ['wallCab', 4, 2, '', 96, 56, 0, -56, 0, 'w'],
    ['wallCab', 2, 2, '', 48, 56, 0, -56, 0, 'w'],
    ['wallCab', 4, 2, 'open', 96, 56, 0, -56, 0, 'w'],
    ['wallCab', 3, 2, 'open', 72, 56, 0, -56, 0, 'w'],
    ['shoeCabinet', 2, 1, '', 48, 74, 0, -74, 26, 'tF'],
    ['shoeCabinet', 2, 1, 'open', 48, 74, 0, -74, 26, 'tF'],
    ['drawerFront', 1, 1, '', 24, 22, 0, -22, 0, ''],
    ['drawerFront', 1, 1, 'open', 24, 22, 0, -22, 0, ''],
    ['drawerFront', 1, 1, 'dark', 24, 22, 0, -22, 0, ''],
    ['riceSack', 1, 1, '', 24, 30, 0, -30, 0, ''],
    ['ribbon', 1, 1, '', 24, 16, 0, -16, 0, ''],
    ['apron', 1, 1, '', 24, 30, 0, -30, 0, ''],
    ['jewelBox', 1, 1, '', 24, 24, 0, -24, 0, ''],
    ['jewelBox', 1, 1, 'open', 24, 24, 0, -24, 0, ''],
    ['dryRack', 2, 1, '', 48, 40, 0, -40, 0, ''],
    ['shoePair', 1, 1, '', 24, 16, 0, -16, 0, ''],
    ['shoePair', 1, 1, 'dad', 24, 16, 0, -16, 0, ''],
    ['shoePair', 1, 1, 'mom', 24, 16, 0, -16, 0, ''],
    ['shoePair', 1, 1, 'small', 24, 16, 0, -16, 0, ''],
    ['shoePair', 1, 1, 'fur', 24, 16, 0, -16, 0, ''],
    ['ceilLamp', 1, 1, '', 24, 46, 0, -46, 46, 't'],
    ['duck', 1, 1, '', 24, 18, 0, -18, 0, ''],
    ['towelPile', 1, 1, '', 24, 22, 0, -22, 0, ''],
    ['gourd', 1, 1, '', 24, 14, 0, -14, 0, ''],
    ['shelfBoard', 4, 1, '', 96, 12, 0, -12, 0, ''],
    ['shelfBoard', 12, 1, '', 288, 12, 0, -12, 0, ''],
    ['perfume', 1, 1, '', 24, 26, 0, -26, 0, ''],
    ['tileFloor', 4, 3, '', 96, 72, 0, -72, 0, 'w'],
    ['tileFloor', 10, 12, '', 240, 288, 0, -288, 0, 'w'],
    ['tileFloor', 14, 6, '', 336, 144, 0, -144, 0, 'w'],
    ['honeyJar', 1, 1, '', 24, 30, 0, -30, 0, ''],
    ['honeyJar', 1, 1, 'open', 24, 30, 0, -30, 0, ''],
    ['candyRed', 1, 1, '', 24, 14, 0, -14, 0, ''],
    ['bowlStack', 1, 1, '', 24, 32, 0, -32, 0, ''],
    ['bowlStack', 1, 1, 'one', 24, 14, 0, -14, 0, ''],
    ['bedMom', 4, 5, '', 96, 132, 0, -132, 0, ''],
    ['surfaceTop', 4, 2, '', 96, 48, 0, -48, 0, 'w'],
    ['surfaceTop', 6, 2, 'cloth', 144, 48, 0, -48, 0, 'w'],
    ['surfaceTop', 7, 1, 'marble', 168, 24, 0, -24, 0, 'w'],
    ['surfaceTop', 9, 2, 'wood', 216, 48, 0, -48, 0, 'w'],
    ['surfaceFront', 4, 1, '', 96, 26, 0, -26, 0, ''],
    ['surfaceFront', 6, 1, 'cloth', 144, 26, 0, -26, 0, ''],
    ['surfaceFront', 7, 1, 'sink', 168, 26, 0, -26, 0, ''],
    ['surfaceFront', 4, 1, 'vanity', 96, 26, 0, -26, 0, ''],
    ['surfaceFront', 3, 1, 'chest', 72, 26, 0, -26, 0, ''],
    ['surfaceFront', 2, 1, 'vanity', 48, 26, 0, -26, 0, ''],
    ['surfaceFront', 3, 1, 'chest,stairs', 72, 26, 0, -26, 0, ''],
    ['vanityMirror', 4, 3, '', 96, 72, 0, -72, 0, 'w'],
  ],
  D: [
    ['balconyWin', 4, 3, '', 96, 72, 0, -72, 0, 'w'],
    ['balconyWin', 4, 3, 'open', 96, 72, 0, -72, 0, 'w'],
    ['balconyWin', 1, 3, '', 24, 72, 0, -72, 0, 'w'],
    ['washer', 2, 1, '', 48, 45, 0, -45, 0, ''],
    ['pegTub', 1, 1, '', 24, 18, 0, -18, 0, ''],
    ['faucet', 1, 1, '', 24, 40, 0, -40, 0, ''],
    ['faucet', 1, 1, 'yard', 24, 34, 0, -34, 0, ''],
    ['dustpan', 1, 1, '', 24, 24, 0, -24, 0, 'w'],
    ['gloves', 1, 1, '', 24, 24, 0, -24, 0, 'w'],
    ['laundry', 3, 1, '', 72, 40, 0, -40, 40, 't'],
    ['laundry', 2, 1, 'towel', 48, 40, 0, -40, 40, 't'],
    ['dryingRack', 4, 1, '', 96, 44, 0, -44, 0, ''],
    ['haruFlower', 1, 1, '', 24, 34, 0, -34, 0, ''],
    ['haruFlower', 1, 1, 'up', 24, 34, 0, -34, 0, ''],
    ['chairFold', 1, 1, '', 24, 40, 0, -40, 0, ''],
    ['nameStick', 1, 1, '', 24, 30, 0, -30, 0, ''],
    ['feather', 1, 1, '', 24, 24, 0, -24, 0, 'w'],
    ['foxBag', 1, 1, '', 24, 24, 0, -24, 0, ''],
    ['trowel', 1, 1, '', 24, 24, 0, -24, 0, 'w'],
    ['watercan', 1, 1, '', 24, 22, 0, -22, 0, ''],
    ['eaves', 6, 1, '', 144, 18, 0, -30, 18, 't'],
    ['eaves', 19, 1, '', 456, 18, 0, -30, 18, 't'],
    ['downspout', 1, 2, '', 24, 52, 0, -52, 0, ''],
    ['boots', 1, 1, '', 24, 22, 0, -22, 0, ''],
    ['daetdol', 1, 1, '', 28, 20, -2, -20, 0, ''],
    ['tub', 1, 1, '', 24, 24, 0, -24, 0, 'w'],
    ['clothesline', 6, 1, '', 144, 46, 0, -42, 46, 't'],
    ['clothesline', 9, 1, '', 216, 46, 0, -42, 46, 't'],
    ['snail', 1, 1, '', 24, 24, 0, -24, 0, 'w'],
    ['raincoatButton', 1, 1, '', 24, 24, 0, -24, 0, 'w'],
    ['cotton', 1, 1, '', 24, 24, 0, -24, 0, 'w'],
    ['cotton', 2, 1, '', 48, 24, 0, -24, 0, 'w'],
    ['clothespin', 1, 1, '', 24, 24, 0, -24, 0, ''],
    ['looseStone', 1, 1, '', 24, 24, 0, -24, 0, ''],
    ['flashlight', 1, 1, '', 24, 24, 0, -24, 0, 'w'],
    ['brick', 1, 1, '', 24, 22, 0, -22, 0, ''],
    ['shrub', 3, 2, '', 72, 70, 0, -70, 22, 't'],
    ['shrub', 1, 2, '', 24, 70, 0, -70, 22, 't'],
    ['car', 4, 2, '', 96, 74, 0, -74, 26, 't'],
    ['milkCrate', 1, 1, '', 24, 24, 0, -24, 0, ''],
    ['milkCrate', 1, 1, 'stack', 24, 42, 0, -42, 0, ''],
    ['catBowl', 1, 1, '', 24, 24, 0, -24, 0, 'w'],
    ['vinylBag', 1, 1, '', 24, 24, 0, -24, 0, 'w'],
    ['flyer', 1, 1, '', 24, 24, 0, -24, 0, 'w'],
    ['ditch', 1, 1, '', 24, 24, 0, -24, 0, 'w'],
    ['wires', 10, 1, '', 240, 30, 0, -72, 30, 't'],
    ['wires', 30, 1, '', 720, 30, 0, -72, 30, 't'],
    ['sandCastle', 1, 1, '', 24, 24, 0, -24, 0, ''],
    ['palmPrint', 1, 1, '', 24, 30, 0, -30, 0, ''],
    ['footSticker', 1, 1, '', 24, 24, 0, -24, 0, 'w'],
    ['sticks2', 1, 1, '', 24, 24, 0, -24, 0, 'w'],
    ['skirtBoard', 8, 3, '', 192, 72, 0, -72, 0, 'w'],
    ['skirtBoard', 8, 3, 'outlet', 192, 72, 0, -72, 0, 'w'],
    ['sofaLeg', 2, 2, '', 48, 120, 0, -120, 84, 't'],
    ['sofaBottom', 10, 1, '', 240, 30, 0, -48, 30, 't'],
    ['sofaBottom', 20, 1, '', 480, 30, 0, -48, 30, 't'],
    ['spring', 1, 1, '', 24, 44, 0, -58, 44, 't'],
    ['fringe', 8, 1, '', 192, 46, 0, -30, 0, ''],
    ['fringe', 8, 1, 'gap', 192, 46, 0, -30, 0, ''],
    ['matchbox', 2, 2, '', 48, 44, 0, -44, 8, 't'],
    ['crumbHill', 2, 2, '', 48, 40, 0, -40, 0, ''],
    ['remoteGiant', 4, 2, '', 96, 58, 0, -58, 22, 't'],
    ['dustBunny', 2, 1, '', 48, 30, 0, -30, 0, ''],
    ['buttonGiant', 1, 1, '', 24, 22, 0, -22, 0, ''],
    ['buttonGiant', 2, 1, 'house', 48, 40, 0, -40, 0, ''],
    ['buttonGiant', 1, 1, 'house', 24, 40, 0, -40, 0, ''],
    ['candyWrap', 1, 1, '', 24, 24, 0, -24, 0, 'w'],
    ['furTuft', 1, 1, '', 24, 24, 0, -24, 0, 'w'],
    ['coinGiant', 1, 1, '', 24, 20, 0, -20, 0, ''],
    ['coinGiant', 1, 1, 'stack', 24, 54, 0, -54, 18, 't'],
    ['coinGiant', 1, 1, '10', 24, 20, 0, -20, 0, ''],
    ['coinGiant', 1, 1, '500', 24, 20, 0, -20, 0, ''],
    ['coinGiant', 1, 1, '100', 24, 20, 0, -20, 0, ''],
    ['lego', 1, 1, '', 24, 30, 0, -30, 0, ''],
    ['marble', 1, 1, '', 24, 22, 0, -22, 0, ''],
    ['sock', 3, 1, '', 72, 36, 0, -36, 0, ''],
    ['toothpicks', 1, 3, '', 24, 98, 0, -98, 62, 't'],
    ['toothpicks', 1, 4, '', 24, 122, 0, -122, 86, 't'],
    ['straw', 2, 1, '', 48, 20, 0, -20, 0, ''],
    ['bottleCap', 3, 1, '', 72, 40, 0, -40, 0, ''],
    ['capsule', 1, 1, '', 24, 24, 0, -24, 0, ''],
    ['scratcherTip', 1, 1, '', 24, 24, 0, -24, 0, 'w'],
    ['threadRed', 1, 1, '', 24, 24, 0, -24, 0, 'w'],
    ['penCap', 1, 1, '', 24, 24, 0, -24, 0, 'w'],
  ],
  E: [
    ['clothWall', 4, 3, '', 96, 72, 0, -72, 0, 'w'],
    ['clothWall', 4, 3, 'keyhole', 96, 72, 0, -72, 0, 'w'],
    ['clothWall', 2, 3, '', 48, 72, 0, -72, 0, 'w'],
    ['brassGear', 3, 2, '', 72, 56, 0, -56, 20, 't'],
    ['brassGear', 1, 1, 'rust,small', 24, 32, 0, -32, 0, ''],
    ['brassGear', 1, 1, 'small', 24, 32, 0, -32, 0, ''],
    ['brassGear', 3, 2, 'rust', 72, 56, 0, -56, 20, 't'],
    ['mainspring', 3, 2, '', 72, 54, 0, -54, 18, 't'],
    ['mainspring', 3, 2, 'wound', 72, 54, 0, -54, 18, 't'],
    ['pawl', 2, 1, '', 48, 38, 0, -38, 0, ''],
    ['screwBig', 2, 1, '', 48, 24, 0, -24, 0, ''],
    ['cotton', 2, 1, '', 48, 28, 0, -28, 0, ''],
    ['oilDrop', 1, 1, '', 24, 24, 0, -24, 0, 'w'],
    ['rustPatch', 2, 1, '', 48, 24, 0, -24, 0, 'w'],
    ['brokenKey', 2, 1, '', 48, 24, 0, -24, 0, 'w'],
    ['stitchPatch', 1, 1, '', 24, 28, 0, -28, 0, ''],
    ['lint', 1, 1, '', 24, 24, 0, -24, 0, ''],
    ['echo', 1, 1, '', 24, 40, 0, -40, 0, ''],
    ['echo', 1, 1, '5,faint', 24, 40, 0, -40, 0, ''],
    ['echo', 1, 1, '12', 24, 40, 0, -40, 0, ''],
    ['echo', 1, 1, '13', 24, 40, 0, -40, 0, ''],
    ['echo', 1, 1, '14', 24, 40, 0, -40, 0, ''],
    ['echo', 1, 1, '5,lit', 24, 40, 0, -40, 0, ''],
    ['echo', 1, 1, 'note', 24, 40, 0, -40, 0, ''],
    ['keyAxle', 1, 1, '', 24, 30, 0, -30, 0, ''],
    ['keyGiant', 2, 2, '', 48, 78, 0, -78, 42, 't'],
    ['counter', 2, 1, '', 48, 32, 0, -32, 0, ''],
    ['counter', 2, 1, '2917', 48, 32, 0, -32, 0, ''],
    ['axleBar', 6, 1, '', 144, 22, 0, -36, 22, 't'],
    ['axleBar', 8, 1, 'needle', 192, 22, 0, -36, 22, 't'],
    ['axleBar', 16, 1, '', 384, 22, 0, -36, 22, 't'],
    ['quiltWall', 4, 3, '', 96, 72, 0, -72, 0, 'w'],
    ['quiltWall', 4, 3, 'lid', 96, 72, 0, -72, 0, 'w'],
    ['quiltWall', 1, 3, 'lid', 24, 72, 0, -72, 0, 'w'],
    ['spoolBig', 2, 1, '', 48, 46, 0, -46, 10, 't'],
    ['spoolBig', 2, 1, 'yellow', 48, 46, 0, -46, 10, 't'],
    ['spoolBig', 2, 1, 'red', 48, 46, 0, -46, 10, 't'],
    ['spoolBig', 2, 1, 'blue', 48, 46, 0, -46, 10, 't'],
    ['spoolBig', 2, 1, 'purple', 48, 46, 0, -46, 10, 't'],
    ['spoolBig', 2, 1, 'cream', 48, 46, 0, -46, 10, 't'],
    ['pincushion', 3, 2, '', 72, 88, 0, -88, 52, 't'],
    ['buttonHill', 3, 2, '', 72, 66, 0, -66, 30, 't'],
    ['bigButton', 1, 1, '', 24, 26, 0, -26, 0, ''],
    ['bigButton', 1, 1, 'red4', 24, 26, 0, -26, 0, ''],
    ['bigButton', 1, 1, 'square', 24, 26, 0, -26, 0, ''],
    ['bigButton', 1, 1, 'black4', 24, 26, 0, -26, 0, ''],
    ['bigButton', 1, 1, 'cream', 24, 26, 0, -26, 0, ''],
    ['bigButton', 1, 1, 'black2', 24, 26, 0, -26, 0, ''],
    ['yarnLine', 1, 1, '', 24, 24, 0, -24, 0, 'w'],
    ['yarnLine', 1, 1, 'v', 24, 24, 0, -24, 0, 'w'],
    ['yarnLine', 1, 1, 'nw', 24, 24, 0, -24, 0, 'w'],
    ['yarnLine', 1, 1, 'h', 24, 24, 0, -24, 0, 'w'],
    ['yarnLine', 1, 1, 'se', 24, 24, 0, -24, 0, 'w'],
    ['yarnLine', 1, 1, 'ne', 24, 24, 0, -24, 0, 'w'],
    ['yarnLine', 1, 1, 'sw', 24, 24, 0, -24, 0, 'w'],
    ['yarnKnot', 1, 1, '', 24, 30, 0, -30, 0, ''],
    ['yarnKnot', 1, 1, 'loose', 24, 30, 0, -30, 0, ''],
    ['tapeMeasure', 1, 1, '', 24, 28, 0, -28, 0, ''],
    ['scissorsBig', 4, 1, '', 96, 24, 0, -24, 0, ''],
    ['thimbleCup', 2, 1, '', 48, 36, 0, -36, 0, ''],
    ['medPouch', 1, 1, '', 24, 24, 0, -24, 0, ''],
    ['clinicCard', 1, 1, '', 24, 24, 0, -24, 0, ''],
    ['crumpledLetters', 1, 1, '', 24, 28, 0, -28, 0, ''],
    ['whiteScrap', 1, 1, '', 24, 24, 0, -24, 0, ''],
    ['fabricHill', 3, 2, '', 72, 64, 0, -64, 28, 't'],
    ['fabricHill', 3, 1, '', 72, 40, 0, -40, 0, ''],
    ['oilBottle', 1, 1, '', 24, 38, 0, -38, 0, ''],
    ['lensShard', 1, 1, '', 24, 24, 0, -24, 0, 'w'],
    ['chalk', 2, 1, '', 48, 24, 0, -24, 0, 'w'],
    ['pinBig', 3, 1, '', 72, 24, 0, -24, 0, 'w'],
    ['divider', 1, 1, '', 24, 34, 0, -34, 0, ''],
    ['dawnPane', 4, 3, '', 96, 84, 0, -84, 0, 'w'],
  ],
};

const GROUPS = {
  A: { kinds: PROPS_A_KINDS, fn: propSpriteA, px: PX_A },
  B: { kinds: PROPS_B, fn: propsB, px: PX_B },
  C: { kinds: PROPS_C_KINDS, fn: propsC, px: PX_C },
  D: { kinds: PROPS_D, fn: propDSprite, px: PX_D },
  E: { kinds: PROPS_E_KINDS, fn: propSpriteE, px: PX_E },
} as const;

const lum = (c: number) => {
  const [r, g, b] = rgb(c);
  return r * 0.3 + g * 0.59 + b * 0.11;
};
const colors = (p: Pix) => new Set([...p.px].filter((c) => c !== CLEAR));
const has = (p: Pix, f: (c: number) => boolean) => [...p.px].some((c) => c !== CLEAR && f(c));
const isYellow = (c: number) => {
  const [r, g, b] = rgb(c);
  return r > 200 && g > 160 && b < 120;
};

describe('격자 늘이기 도구 (px/chapkit.ts)', () => {
  test('hs: 양 끝 열은 그대로, 가운데 열을 되풀이해 원하는 폭으로', () => {
    assert.deepEqual(hs(['abcd'], 7, 1, 1), ['abcbcbd']);
    assert.deepEqual(hs(['abcd'], 2, 1, 1), ['ad'], '폭이 양 끝 합과 같으면 가운데는 빠진다');
  });
  test('vs · nine: 위아래 줄을 지키고 가운데 줄을 되풀이', () => {
    assert.deepEqual(vs(['a', 'b', 'c'], 5, 1, 1), ['a', 'b', 'b', 'b', 'c']);
    assert.deepEqual(nine(['abc', 'def', 'ghi'], 4, 4, 1, 1, 1, 1), ['abbc', 'deef', 'deef', 'ghhi']);
  });
  test('tile: 무늬를 이음매 없이 되풀이하고, 밀어서 시작할 수 있다', () => {
    assert.deepEqual(tile(['ab', 'cd'], 3, 3), ['aba', 'cdc', 'aba']);
    assert.deepEqual(tile(['ab'], 3, 1, 1), ['bab']);
  });
  test('put: 투명 칸은 밑을 남기고, 판 밖으로 나간 칸은 버린다', () => {
    const g = put(blank(3, 2), ['x.y', 'zzzz'], 1, 0);
    assert.deepEqual(g, ['.x.', '.zz']);
  });
});

for (const [name, grp] of Object.entries(GROUPS)) {
  describe(`갈래 ${name} 소품: 손찍기 격자`, () => {
    test('모든 kind 에 격자가 있고, 모든 격자는 줄 폭이 고르고 팔레트에 있는 글자만 쓴다', () => {
      const keys = Object.keys(grp.px);
      for (const k of Object.keys(grp.kinds)) assert.ok(keys.some((x) => x === k || x.startsWith(k + '.')), `${k}: 격자 없음`);
      for (const [k, [g, p]] of Object.entries(grp.px)) {
        assert.doesNotThrow(() => gridSize(g), k);
        assert.deepEqual(checkGrid(g, p), [], `${k}: 팔레트에 없는 글자`);
        assert.ok(g.some((r) => /[^. ]/.test(r)), `${k}: 빈 격자`);
      }
    });

    test('크기 계약: 원래 그림과 같은 폭 · 높이 · 발 자리 · 윗층/뒤/앞 나눔, 그리고 빈 그림이 아니다', () => {
      for (const [k, w, h, opt, pw, ph, ox, oy, split, flags] of CONTRACT[name]) {
        const s = grp.fn(k, w, h, opt)!;
        const id = `${k} ${w}x${h} ${opt}`;
        assert.ok(s, id);
        assert.deepEqual([s.pix.w, s.pix.h, s.ox, s.oy, s.topSplitY ?? 0], [pw, ph, ox, oy, split], id);
        const got = (s.wall ? 'w' : '') + (s.top ? 't' : '') + (s.behind ? 'b' : '') + (s.front ? 'f' : '') + (s.faces ? 'F' : '');
        assert.equal(got, flags, `${id}: 나눔`);
        assert.ok(s.pix.count() >= 10, `${id}: 거의 빈 그림 (${s.pix.count()})`);
        if (s.top) {
          assert.equal(s.top.w, s.pix.w, id);
          assert.equal(s.top.h, split, id);
        }
        // 손찍기 도트는 명암 단계가 있다 (한 색 덩어리가 아니다)
        assert.ok(colors(s.pix).size >= 3, `${id}: 색이 ${colors(s.pix).size} 가지뿐`);
      }
    });

    test('서 있는 소품은 잘리지 않는다: 맨 윗줄 · 좌우 끝 열에는 외곽선(안쪽 이웃보다 훨씬 어두운 색)만 있다', () => {
      for (const [k, w, h, opt] of CONTRACT[name]) {
        const s = grp.fn(k, w, h, opt)!;
        if (s.wall || (s.top && s.topSplitY === s.pix.h) || s.ox !== 0 || s.oy !== -s.pix.h || s.behind) continue;
        const p = s.pix;
        const edge = (x: number, y: number, ix: number, iy: number) => {
          const c = p.get(x, y);
          if (c === CLEAR) return;
          const inner = p.get(ix, iy);
          assert.ok(inner === CLEAR || lum(c) < lum(inner) * 0.8, `${k} ${opt}: (${x},${y}) 가장자리에 그림이 닿았다`);
        };
        for (let x = 0; x < p.w; x++) edge(x, 0, x, 1);
        for (let y = 0; y < p.h; y++) {
          edge(0, y, 1, y);
          edge(p.w - 1, y, p.w - 2, y);
        }
      }
    });
  });
}

describe('소품마다의 특징 (상태 그림)', () => {
  test('하루 침대: yarn 이면 노란 털실이 앞판에, dawn 이불은 기본 이불보다 푸르다', () => {
    assert.ok(has(propSpriteA('haruBed', 4, 2, 'yarn')!.front!, isYellow));
    assert.ok(!has(propSpriteA('haruBed', 4, 2, '')!.front!, isYellow));
    const blue = (p: Pix) => [...p.px].filter((c) => c !== CLEAR && rgb(c)[2] > rgb(c)[0] + 10).length;
    assert.ok(blue(propSpriteA('haruBed', 4, 2, 'dawn')!.pix) > blue(propSpriteA('haruBed', 4, 2, '')!.pix) + 200);
  });
  test('필통: out 이면 몽당연필 · 지우개 · 자가 서 있어 칠한 칸이 훨씬 많다', () => {
    assert.ok(propSpriteA('pencilFolks', 3, 1, 'out')!.pix.count() > propSpriteA('pencilFolks', 3, 1, '')!.pix.count() + 150);
  });
  test('흰 천: off(걷힘)는 덮인 천보다 칠한 칸이 적고, 윗층(top)이 비어 원래 윗부분을 지운다', () => {
    const on = propsB('sheet', 3, 1, 'tall')!;
    const off = propsB('sheet', 3, 1, 'tall,off')!;
    assert.ok(off.pix.count() < on.pix.count() / 2);
    assert.equal(off.top!.count(), 0);
    assert.ok(on.top!.count() > 100);
  });
  test('이불 더미: 단 수가 늘면 높아지고, pouch 면 빨간 바늘땀이 생긴다', () => {
    assert.ok(propsB('quilts', 2, 1, '4')!.pix.h > propsB('quilts', 2, 1, '2')!.pix.h);
    const red = (c: number) => rgb(c)[0] > 170 && rgb(c)[1] < 90;
    assert.ok(has(propsB('quilts', 2, 1, '3,pouch')!.pix, red));
  });
  test('냉장고: ajar 면 문틈에 밝은 빛 줄이 생긴다', () => {
    const lit = (p: Pix) => [...p.px].filter((c) => c !== CLEAR && lum(c) > 235).length;
    assert.ok(lit(propsC('fridge', 2, 1, 'ajar')!.pix) > lit(propsC('fridge', 2, 1, '')!.pix) + 20);
  });
  test('조리대: 서랍이 열리면(open) 그림이 아래로 10칸 늘고, 늘어난 곳에 서랍이 있다', () => {
    const s = propsC('kcounter', 4, 1, 'drawer@2,open')!;
    let n = 0;
    for (let y = 35; y < s.pix.h; y++) for (let x = 48; x < 72; x++) if (s.pix.get(x, y) !== CLEAR) n++;
    assert.ok(n > 60, `${n}`);
  });
  test('보석함 · 신발장 · 찬장: open 이면 닫힌 그림과 다르다', () => {
    const diff = (a: Pix, b: Pix) => a.px.reduce((n, c, i) => n + (c !== b.px[i] ? 1 : 0), 0);
    assert.ok(diff(propsC('jewelBox', 1, 1, 'open')!.pix, propsC('jewelBox', 1, 1, '')!.pix) > 40);
    assert.ok(diff(propsC('shoeCabinet', 2, 1, 'open')!.pix, propsC('shoeCabinet', 2, 1, '')!.pix) > 100);
    assert.ok(diff(propsC('wallCab', 4, 2, 'open')!.pix, propsC('wallCab', 4, 2, '')!.pix) > 100);
  });
  test('하루 꽃: up(물 받음)이면 노란 꽃이 피고 기본은 시든 빛', () => {
    assert.ok(has(propDSprite('haruFlower', 1, 1, 'up')!.pix, isYellow));
    assert.ok(!has(propDSprite('haruFlower', 1, 1, '')!.pix, isYellow));
  });
  test('메아리 글자: lit 은 기본보다 밝다', () => {
    const avg = (p: Pix) => {
      const cs = [...p.px].filter((c) => c !== CLEAR);
      return cs.reduce((a, c) => a + lum(c), 0) / cs.length;
    };
    assert.ok(avg(propSpriteE('echo', 1, 1, '5,lit')!.pix) > avg(propSpriteE('echo', 1, 1, '5')!.pix) + 20);
  });
  test('늘이는 소품: 폭이 늘면 같은 격자가 가운데를 되풀이해 늘어난다 (끝 모양은 그대로)', () => {
    const a = propDSprite('eaves', 6, 1)!.pix;
    const b = propDSprite('eaves', 19, 1)!.pix;
    for (let y = 0; y < a.h; y++) for (let x = 0; x < 8; x++) assert.equal(a.get(x, y), b.get(x, y), `왼쪽 끝 ${x},${y}`);
  });
});
