/** 화면 하나 (타이틀 · 대화 · 상점 …) 와 그것을 담는 앱 */
import type { Game } from '../../core/game.ts';
import type { Save } from '../../core/types.ts';
import type { Ui } from '../kit.ts';

export type Sfx = 'click' | 'move' | 'back' | 'buy' | 'equip' | 'forgeOk' | 'forgeFail' | 'error' | 'quest' | 'level' | 'page' | 'sell';

export interface App {
  g: Game | null;
  ui: Ui;
  touch: boolean;
  push(s: Screen): void;
  pop(): void;
  /** 모든 창을 닫고 놀이 화면으로 */
  closeAll(): void;
  top(): Screen | null;
  startGame(save: Save, fresh: boolean): void;
  toTitle(): void;
  saveNow(): void;
  sfx(name: Sfx): void;
  /** 화면 가운데 알림 */
  toast(text: string, color?: string): void;
  /** 저장 내용이 바뀐 뒤 (능력치 다시 계산 · 레벨 오름 알림) */
  changed(lvBefore?: number): void;
  /** 소리 크기 0~1 */
  volume: { sfx: number; bgm: number };
  setVolume(kind: 'sfx' | 'bgm', v: number): void;
}

export interface Screen {
  /** 세계 시간을 멈추는가 */
  modal: boolean;
  draw(app: App, dt: number): void;
  /** 뒤로 (X · Esc). 없으면 창을 닫는다 */
  back?(app: App): void;
  /** 화면만의 키 (true 면 처리했음) */
  key?(app: App, action: string): boolean;
}
