/**
 * 화면 위 글자 · 창 · 단추 (논리 좌표, 화면 해상도로 그린다).
 * 단추는 그릴 때마다 다시 등록되고, 키보드(방향키 · Z) · 마우스 · 손가락이 같은 목록을 쓴다.
 */
import { pickNext, type Box } from './nav.ts';

export const FONT = "'Galmuri11', 'Pretendard Variable', Pretendard, sans-serif";
export const FONT_BOLD = "'Galmuri11', 'Pretendard Variable', Pretendard, sans-serif";

export const C = {
  ink: '#1c1424',
  panel: '#2a2238',
  panel2: '#352c48',
  edge: '#8a78b0',
  light: '#f4ecff',
  dim: '#a898c0',
  gold: '#ffd84a',
  hp: '#ff5a6a',
  sp: '#4a9aff',
  exp: '#b8f070',
  good: '#7ae08a',
  bad: '#ff6a7a',
  focus: '#ffd84a',
};

export interface Btn extends Box {
  id: string;
  press: () => void;
  enabled: boolean;
}

export class Ui {
  ctx!: CanvasRenderingContext2D;
  w = 0;
  h = 0;
  btns: Btn[] = [];
  prev: Btn[] = [];
  focus: string | null = null;
  /** 마우스가 올라간 단추 */
  hover: string | null = null;
  /** 이번 화면에서 키보드를 썼는가 (초점 테두리 표시) */
  keyboard = true;
  time = 0;

  begin(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
    this.ctx = ctx;
    this.w = w;
    this.h = h;
    this.time = time;
    this.prev = this.btns;
    this.btns = [];
  }

  end(): void {
    // 초점이 사라졌으면 첫 단추로
    if (this.btns.length && (!this.focus || !this.btns.some((b) => b.id === this.focus))) this.focus = this.btns.find((b) => b.enabled)?.id ?? this.btns[0].id;
  }

  // ───────── 글자
  font(size = 12, bold = false): void {
    this.ctx.font = `${bold ? 'bold ' : ''}${size}px ${bold ? FONT_BOLD : FONT}`;
  }

  text(s: string, x: number, y: number, color = C.light, size = 12, align: CanvasTextAlign = 'left', shadow = true): number {
    const c = this.ctx;
    this.font(size);
    c.textAlign = align;
    c.textBaseline = 'top';
    if (shadow) {
      c.fillStyle = 'rgba(20,10,30,0.85)';
      c.fillText(s, x + 1, y + 1);
    }
    c.fillStyle = color;
    c.fillText(s, x, y);
    return c.measureText(s).width;
  }

  /** 테두리 글자 (세계 위 이름표 · 숫자) */
  outlined(s: string, x: number, y: number, color: string, size = 12, align: CanvasTextAlign = 'center'): void {
    const c = this.ctx;
    this.font(size);
    c.textAlign = align;
    c.textBaseline = 'middle';
    c.lineJoin = 'round';
    c.lineWidth = Math.max(2, size / 4);
    c.strokeStyle = 'rgba(20,10,30,0.9)';
    c.strokeText(s, x, y);
    c.fillStyle = color;
    c.fillText(s, x, y);
  }

  measure(s: string, size = 12): number {
    this.font(size);
    return this.ctx.measureText(s).width;
  }

  /** 너비에 맞춰 줄바꿈 (글자 단위 · 띄어쓰기 우선) */
  wrap(s: string, width: number, size = 12): string[] {
    const out: string[] = [];
    for (const para of s.split('\n')) {
      let line = '';
      for (const word of para.split(' ')) {
        const tryLine = line ? `${line} ${word}` : word;
        if (this.measure(tryLine, size) <= width) {
          line = tryLine;
          continue;
        }
        if (line) out.push(line);
        // 한 단어가 너무 길면 글자로 자른다
        line = '';
        for (const ch of word) {
          if (this.measure(line + ch, size) > width && line) {
            out.push(line);
            line = '';
          }
          line += ch;
        }
      }
      out.push(line);
    }
    return out;
  }

  paragraph(s: string, x: number, y: number, width: number, color = C.light, size = 12, gap = 4): number {
    const lines = this.wrap(s, width, size);
    lines.forEach((l, i) => this.text(l, x, y + i * (size + gap), color, size));
    return lines.length * (size + gap);
  }

  // ───────── 창
  panel(x: number, y: number, w: number, h: number, fill = C.panel, edge = C.edge): void {
    const c = this.ctx;
    x = Math.round(x);
    y = Math.round(y);
    w = Math.round(w);
    h = Math.round(h);
    // 도트 창: 모서리를 한 칸 깎은 검은 테 · 색 테 · 안쪽 볼록 (위 · 왼쪽 밝게, 아래 · 오른쪽 어둡게)
    c.fillStyle = C.ink;
    c.fillRect(x - 1, y + 1, w + 2, h - 2);
    c.fillRect(x + 1, y - 1, w - 2, h + 2);
    c.fillRect(x, y, w, h);
    c.fillStyle = edge;
    c.fillRect(x + 1, y, w - 2, h);
    c.fillRect(x, y + 1, w, h - 2);
    c.fillStyle = fill;
    c.fillRect(x + 1, y + 1, w - 2, h - 2);
    c.fillStyle = 'rgba(255,255,255,0.1)';
    c.fillRect(x + 1, y + 1, w - 2, 1);
    c.fillRect(x + 1, y + 2, 1, h - 3);
    c.fillStyle = 'rgba(0,0,0,0.22)';
    c.fillRect(x + 2, y + h - 2, w - 3, 1);
    c.fillRect(x + w - 2, y + 2, 1, h - 4);
  }

  dim(a = 0.55): void {
    this.ctx.fillStyle = `rgba(10,6,20,${a})`;
    this.ctx.fillRect(0, 0, this.w, this.h);
  }

  bar(x: number, y: number, w: number, h: number, ratio: number, color: string, back = '#3a2a3a'): void {
    const c = this.ctx;
    c.fillStyle = C.ink;
    c.fillRect(Math.round(x) - 1, Math.round(y) - 1, Math.round(w) + 2, Math.round(h) + 2);
    c.fillStyle = back;
    c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(y), Math.round(w * Math.max(0, Math.min(1, ratio))), Math.round(h));
    c.fillStyle = 'rgba(255,255,255,0.25)';
    c.fillRect(Math.round(x), Math.round(y), Math.round(w * Math.max(0, Math.min(1, ratio))), 1);
  }

  /**
   * 도트 그림을 (x, y, w, h) 칸 안에 그린다. 키울 때만 그림 한 점이 화면 픽셀 정수 칸이 되게 배율을 내려 맞추고
   * (1.5배처럼 굵기가 들쭉날쭉한 점이 생기지 않게) 칸 가운데에 둔다. 자리도 화면 픽셀 칸에 맞춘다.
   */
  img(im: CanvasImageSource, x: number, y: number, w: number, h: number): void {
    const c = this.ctx;
    c.imageSmoothingEnabled = false;
    const s = c.getTransform?.().a || 1;
    const iw = (im as { width: number }).width;
    const ih = (im as { height: number }).height;
    if (iw > 0 && ih > 0) {
      const k = Math.min(w / iw, h / ih);
      if (k >= 1) {
        const e = Math.max(1, Math.floor(k * s + 1e-6)) / s;
        const nw = iw * e;
        const nh = ih * e;
        x += (w - nw) / 2;
        y += (h - nh) / 2;
        w = nw;
        h = nh;
      }
    }
    const snap = (v: number) => Math.round(v * s) / s;
    c.drawImage(im, snap(x), snap(y), w, h);
  }

  // ───────── 단추
  /** 단추 영역만 등록 (그림은 직접) */
  hit(id: string, x: number, y: number, w: number, h: number, press: () => void, enabled = true): boolean {
    this.btns.push({ id, x, y, w, h, press, enabled });
    return this.focus === id && this.keyboard;
  }

  isFocused(id: string): boolean {
    return this.focus === id && this.keyboard;
  }

  button(id: string, x: number, y: number, w: number, h: number, label: string, press: () => void, o: { enabled?: boolean; color?: string; size?: number; active?: boolean } = {}): void {
    const enabled = o.enabled ?? true;
    const focused = this.hit(id, x, y, w, h, press, enabled) || this.hover === id;
    const fill = o.active ? '#5a4a80' : focused ? '#4a3e66' : C.panel2;
    this.panel(x, y, w, h, fill, focused ? C.focus : C.edge);
    const size = o.size ?? 12;
    this.text(label, x + w / 2, y + (h - size) / 2, enabled ? (o.color ?? C.light) : '#6a5a80', size, 'center');
  }

  focusRing(x: number, y: number, w: number, h: number): void {
    const c = this.ctx;
    c.strokeStyle = C.focus;
    c.lineWidth = 1;
    const k = Math.sin(this.time * 6) * 0.5 + 0.5;
    c.globalAlpha = 0.6 + k * 0.4;
    c.strokeRect(Math.round(x) - 1.5, Math.round(y) - 1.5, Math.round(w) + 3, Math.round(h) + 3);
    c.globalAlpha = 1;
  }

  // ───────── 입력
  move(dx: number, dy: number): void {
    this.keyboard = true;
    const list = this.prev.filter((b) => b.enabled);
    const cur = list.find((b) => b.id === this.focus);
    const next = pickNext(list, cur ?? null, dx, dy);
    if (next) this.focus = (next as Btn).id;
  }

  activate(): boolean {
    this.keyboard = true;
    const b = this.prev.find((x) => x.id === this.focus);
    if (b && b.enabled) {
      b.press();
      return true;
    }
    return false;
  }

  /** 누른 자리의 단추 */
  at(x: number, y: number): Btn | null {
    for (let i = this.prev.length - 1; i >= 0; i--) {
      const b = this.prev[i];
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b;
    }
    return null;
  }

  click(x: number, y: number): boolean {
    const b = this.at(x, y);
    if (!b) return false;
    this.focus = b.id;
    if (b.enabled) b.press();
    return true;
  }

  pointer(x: number, y: number): void {
    this.hover = this.at(x, y)?.id ?? null;
  }
}

/** 창 크기와 두 칸 나누기 (가로 화면은 좌우, 세로 화면은 위아래) */
export function frame(ui: Ui, maxW = 520, maxH = 340): { px: number; py: number; pw: number; ph: number; side: boolean } {
  const pw = Math.min(ui.w - 8, maxW);
  const side = ui.w >= 440;
  const ph = Math.min(ui.h - 8, side ? maxH : 640);
  return { px: Math.round((ui.w - pw) / 2), py: Math.round((ui.h - ph) / 2), pw, ph, side };
}
