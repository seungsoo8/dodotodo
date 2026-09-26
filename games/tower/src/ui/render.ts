import { enemyCountForRound, incomePerSecond, rerollCost, type GameState } from '../core/game.ts';
import type { GameEvent, ItemDef, Point, WeaponType } from '../core/types.ts';
import type { Layout, Rect } from './layout.ts';

const FONT = '"Galmuri11", "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';

export const TYPE_INFO: Record<WeaponType, { label: string; color: string }> = {
  normal: { label: '일반', color: '#e8e1cf' },
  pierce: { label: '관통', color: '#8fd16a' },
  magic: { label: '마법', color: '#6fb7ff' },
  siege: { label: '공성', color: '#ff9d4d' },
  chaos: { label: '카오스', color: '#c77dff' },
};
const UPGRADE_COLOR = '#ffd75e';

export interface UiState {
  started: boolean;
  paused: boolean;
  speed: number;
  hover: number | null;
  message: { text: string; until: number } | null;
}

interface Effect {
  kind: 'line' | 'ring' | 'float' | 'flash';
  from?: Point;
  to?: Point;
  at?: Point;
  radius?: number;
  text?: string;
  color: string;
  born: number;
  life: number;
}

export class Renderer {
  private effects: Effect[] = [];
  private now = 0;
  private ctx: CanvasRenderingContext2D;
  private layout: Layout;

  constructor(ctx: CanvasRenderingContext2D, layout: Layout) {
    this.ctx = ctx;
    this.layout = layout;
  }

  /** 게임 이벤트를 연출 효과로 바꾼다 */
  consume(events: GameEvent[], ui: UiState): void {
    for (const ev of events) {
      switch (ev.kind) {
        case 'shot':
          this.add({ kind: 'line', from: ev.from, to: ev.to, color: TYPE_INFO[ev.weaponType].color, life: 0.12 });
          break;
        case 'splash':
          this.add({ kind: 'ring', at: ev.at, radius: ev.radius, color: TYPE_INFO.siege.color, life: 0.3 });
          break;
        case 'kill':
          this.add({ kind: 'float', at: ev.at, text: `+${Math.round(ev.bounty)}`, color: UPGRADE_COLOR, life: 0.8 });
          break;
        case 'towerHit':
          this.add({ kind: 'flash', color: '#ff4d4d', life: 0.15 });
          break;
        case 'round':
          ui.message = { text: `${ev.round} 라운드`, until: this.now + 1.5 };
          break;
        case 'boss':
          ui.message = { text: '보스 등장! 땅굴 군주', until: this.now + 2.5 };
          break;
        case 'hit':
          break;
      }
    }
    events.length = 0;
  }

  private add(e: Omit<Effect, 'born'>): void {
    this.effects.push({ ...e, born: this.now });
    if (this.effects.length > 400) this.effects.splice(0, this.effects.length - 400);
  }

  draw(state: GameState, ui: UiState, time: number): void {
    this.now = time;
    this.effects = this.effects.filter((e) => time - e.born < e.life);
    const { ctx } = this;
    ctx.save();
    this.drawField(state);
    this.drawEffects();
    this.drawHud(state);
    this.drawPanel(state, ui);
    if (ui.message && ui.message.until > time) this.banner(ui.message.text);
    if (!ui.started) this.overlayStart();
    else if (state.status === 'won') this.overlayEnd(state, true);
    else if (state.status === 'lost') this.overlayEnd(state, false);
    else if (ui.paused) this.overlayText('일시정지', 'Space 또는 ⏸ 버튼으로 계속');
    ctx.restore();
  }

  // ───────── 전장 ─────────

  private drawField(state: GameState): void {
    const { ctx } = this;
    const { width, fieldHeight } = this.layout;
    ctx.fillStyle = '#141824';
    ctx.fillRect(0, 0, width, fieldHeight);
    ctx.fillStyle = '#1a1f2e';
    for (let x = 0; x < width; x += 32) {
      for (let y = 0; y < fieldHeight; y += 32) {
        if (((x + y) / 32) % 2 === 0) ctx.fillRect(x, y, 32, 32);
      }
    }

    const t = state.tower;
    const maxRange = Math.max(0, ...state.weapons.map((w) => w.def.range));
    if (maxRange > 0) {
      ctx.strokeStyle = 'rgba(200, 208, 224, 0.12)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(t.x, t.y, maxRange, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    for (const e of state.enemies) {
      ctx.fillStyle = e.def.color;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();
      if (e.slowTimeLeft > 0) {
        ctx.strokeStyle = TYPE_INFO.magic.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.lineWidth = 1;
      }
      if (e.isBoss) {
        ctx.strokeStyle = '#ffd75e';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.lineWidth = 1;
      }
      const w = e.radius * 2 + 4;
      const ratio = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = '#000a';
      ctx.fillRect(e.x - w / 2, e.y - e.radius - 6, w, 3);
      ctx.fillStyle = ratio > 0.5 ? '#6fdc6f' : ratio > 0.25 ? '#ffd75e' : '#ff5c5c';
      ctx.fillRect(e.x - w / 2, e.y - e.radius - 6, w * ratio, 3);
    }

    this.drawTower(t.x, t.y, t.radius);
  }

  private drawTower(x: number, y: number, r: number): void {
    const { ctx } = this;
    ctx.fillStyle = '#5a6078';
    ctx.fillRect(x - r, y - r * 0.4, r * 2, r * 1.4);
    ctx.fillStyle = '#7a8098';
    for (let i = 0; i < 4; i++) ctx.fillRect(x - r + i * (r / 2) + 1, y - r * 0.4 - 5, r / 2 - 3, 5);
    ctx.fillStyle = '#8a5cd6';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.7, y - r * 0.45);
    ctx.lineTo(x, y - r * 1.5);
    ctx.lineTo(x + r * 0.7, y - r * 0.45);
    ctx.fill();
    ctx.fillStyle = '#ffd75e';
    ctx.fillRect(x - 3, y + 1, 6, 8);
  }

  private drawEffects(): void {
    const { ctx } = this;
    for (const e of this.effects) {
      const p = (this.now - e.born) / e.life;
      ctx.globalAlpha = 1 - p;
      if (e.kind === 'line' && e.from && e.to) {
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(e.from.x, e.from.y);
        ctx.lineTo(e.to.x, e.to.y);
        ctx.stroke();
        ctx.lineWidth = 1;
      } else if (e.kind === 'ring' && e.at && e.radius) {
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.at.x, e.at.y, e.radius * (0.5 + p * 0.5), 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
      } else if (e.kind === 'float' && e.at && e.text) {
        ctx.fillStyle = e.color;
        ctx.font = `bold 10px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText(e.text, e.at.x, e.at.y - 8 - p * 14);
      } else if (e.kind === 'flash') {
        ctx.globalAlpha = (1 - p) * 0.12;
        ctx.fillStyle = e.color;
        ctx.fillRect(0, 0, this.layout.width, this.layout.fieldHeight);
      }
    }
    ctx.globalAlpha = 1;
  }

  // ───────── 상단 정보 ─────────

  private drawHud(state: GameState): void {
    const { ctx } = this;
    const { width } = this.layout;
    const c = state.config;
    ctx.fillStyle = '#0b0d14cc';
    ctx.fillRect(0, 0, width, 22);
    ctx.font = `12px ${FONT}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';

    const finalRound = state.round === c.totalRounds;
    const left = finalRound ? '보스전' : `${Math.ceil(c.roundSeconds - state.roundTime)}초`;
    ctx.fillStyle = '#c8d0e0';
    ctx.fillText(`라운드 ${state.round}/${c.totalRounds}  ·  ${left}  ·  적 ${state.enemies.length}`, 8, 11);

    ctx.fillStyle = UPGRADE_COLOR;
    ctx.fillText(`💰 ${Math.floor(state.gold)}  (+${incomePerSecond(state)}/초)`, 230, 11);

    const t = state.tower;
    const barX = 400;
    const barW = 150;
    ctx.fillStyle = '#000';
    ctx.fillRect(barX, 5, barW, 12);
    ctx.fillStyle = t.hp / t.maxHp > 0.3 ? '#4fc36a' : '#ff5c5c';
    ctx.fillRect(barX, 5, (barW * t.hp) / t.maxHp, 12);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = `10px ${FONT}`;
    ctx.fillText(`${Math.ceil(t.hp)} / ${t.maxHp}`, barX + barW / 2, 11.5);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#8a94a8';
    ctx.fillText(`방어 ${t.armor} · 재생 ${t.regen}`, width - 8, 11);

    // 보유 무기 목록 (종류별 개수)
    const counts = new Map<string, { name: string; type: WeaponType; n: number }>();
    for (const w of state.weapons) {
      const cur = counts.get(w.def.id);
      if (cur) cur.n++;
      else counts.set(w.def.id, { name: w.def.name, type: w.def.type, n: 1 });
    }
    ctx.textAlign = 'left';
    ctx.font = `10px ${FONT}`;
    let y = 34;
    for (const { name, type, n } of counts.values()) {
      ctx.fillStyle = TYPE_INFO[type].color;
      ctx.fillText(`${name}${n > 1 ? ` ×${n}` : ''}`, 8, y);
      y += 13;
    }
    if (t.damageMul !== 1) {
      ctx.fillStyle = UPGRADE_COLOR;
      ctx.fillText(`피해 +${Math.round((t.damageMul - 1) * 100)}%`, 8, y);
    }

    if (!finalRound) {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#8a94a8';
      ctx.fillText(`이번 라운드 적 ${state.spawnedThisRound}/${enemyCountForRound(c, state.round)}`, width - 8, 34);
    }
  }

  // ───────── 상점 ─────────

  private drawPanel(state: GameState, ui: UiState): void {
    const { ctx, layout } = this;
    ctx.fillStyle = '#0b0d14';
    ctx.fillRect(0, layout.fieldHeight, layout.width, layout.height - layout.fieldHeight);
    ctx.fillStyle = '#2a3148';
    ctx.fillRect(0, layout.fieldHeight, layout.width, 1);

    layout.cards.forEach((r, i) => this.drawCard(r, state.shop[i], i, state, ui.hover === i));

    const cost = rerollCost(state);
    this.button(layout.reroll, `🎲 리롤 [R]  ${cost}G`, state.gold >= cost);
    this.button(layout.speed, ui.speed === 1 ? '▶ 1배' : '⏩ 2배', true);
    this.button(layout.pause, ui.paused ? '▶ 계속' : '⏸ 정지', true);
  }

  private drawCard(r: Rect, item: ItemDef | null, index: number, state: GameState, hover: boolean): void {
    const { ctx } = this;
    ctx.fillStyle = hover && item ? '#262d42' : '#1a1f2e';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    if (!item) {
      ctx.fillStyle = '#3a4260';
      ctx.font = `11px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('구매 완료', r.x + r.w / 2, r.y + r.h / 2);
      return;
    }
    const color = item.kind === 'weapon' ? TYPE_INFO[item.type].color : UPGRADE_COLOR;
    const affordable = state.gold >= item.price;
    ctx.strokeStyle = color;
    ctx.globalAlpha = affordable ? 1 : 0.4;
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);

    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.font = `9px ${FONT}`;
    ctx.fillStyle = '#8a94a8';
    ctx.fillText(`${index + 1}`, r.x + 4, r.y + 4);
    ctx.fillStyle = color;
    ctx.fillText(item.kind === 'weapon' ? TYPE_INFO[item.type].label : '강화', r.x + 14, r.y + 4);
    ctx.textAlign = 'right';
    ctx.fillStyle = affordable ? UPGRADE_COLOR : '#ff7070';
    ctx.fillText(`${item.price}G`, r.x + r.w - 4, r.y + 4);

    ctx.textAlign = 'left';
    ctx.font = `bold 12px ${FONT}`;
    ctx.fillStyle = '#fff';
    ctx.fillText(item.name, r.x + 4, r.y + 17);

    ctx.font = `9px ${FONT}`;
    ctx.fillStyle = '#b0b8c8';
    if (item.kind === 'weapon') {
      ctx.fillText(`피해 ${item.damage} · ${item.cooldown}초 · 사거리 ${item.range}`, r.x + 4, r.y + 33);
      ctx.fillStyle = '#8a94a8';
      this.wrap(item.desc, r.x + 4, r.y + 46, r.w - 8, 11);
    } else {
      this.wrap(item.desc, r.x + 4, r.y + 33, r.w - 8, 11);
    }
    ctx.globalAlpha = 1;
  }

  private wrap(text: string, x: number, y: number, maxW: number, lineH: number): void {
    const { ctx } = this;
    let line = '';
    for (const ch of text) {
      if (ctx.measureText(line + ch).width > maxW && line) {
        ctx.fillText(line, x, y);
        y += lineH;
        line = ch.trimStart();
      } else line += ch;
    }
    if (line) ctx.fillText(line, x, y);
  }

  private button(r: Rect, label: string, enabled: boolean): void {
    const { ctx } = this;
    ctx.fillStyle = enabled ? '#2a3148' : '#1a1f2e';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = enabled ? '#4a5678' : '#2a3148';
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    ctx.fillStyle = enabled ? '#e8ecf4' : '#5a6078';
    ctx.font = `11px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2 + 1);
  }

  // ───────── 오버레이 ─────────

  private banner(text: string): void {
    const { ctx } = this;
    const y = this.layout.fieldHeight / 2 - 60;
    ctx.fillStyle = '#0b0d14aa';
    ctx.fillRect(0, y - 16, this.layout.width, 32);
    ctx.fillStyle = '#ffd75e';
    ctx.font = `bold 18px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, this.layout.width / 2, y);
  }

  private dim(): void {
    this.ctx.fillStyle = '#0b0d14dd';
    this.ctx.fillRect(0, 0, this.layout.width, this.layout.height);
  }

  private lines(rows: [string, string, number][], startY: number): void {
    const { ctx } = this;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let y = startY;
    for (const [text, color, size] of rows) {
      ctx.fillStyle = color;
      ctx.font = `${size >= 18 ? 'bold ' : ''}${size}px ${FONT}`;
      ctx.fillText(text, this.layout.width / 2, y);
      y += size + 10;
    }
  }

  private overlayText(title: string, sub: string): void {
    this.dim();
    this.lines(
      [
        [title, '#ffd75e', 24],
        [sub, '#c8d0e0', 12],
      ],
      this.layout.height / 2 - 20,
    );
  }

  private overlayStart(): void {
    this.dim();
    this.lines(
      [
        ['탑 수호자', '#ffd75e', 32],
        ['사방에서 몰려오는 적으로부터 가운데 탑을 지키세요', '#c8d0e0', 12],
        ['탑은 가진 무기로 자동 공격합니다 · 적을 잡고 시간이 흐르면 골드가 쌓여요', '#c8d0e0', 12],
        ['아래 상점에서 무기와 강화를 사세요 (클릭 또는 1~4키) · R 리롤 · Space 정지 · F 배속', '#8a94a8', 11],
        ['15라운드에 나오는 보스 「땅굴 군주」를 잡으면 승리!', '#ff9d4d', 12],
        ['', '#fff', 4],
        ['클릭하거나 Enter 를 눌러 시작', '#ffd75e', 14],
      ],
      110,
    );
  }

  private overlayEnd(state: GameState, won: boolean): void {
    this.dim();
    const minutes = Math.floor(state.time / 60);
    const seconds = Math.floor(state.time % 60);
    this.lines(
      [
        [won ? '승리! 탑을 지켜냈습니다' : '탑이 무너졌습니다', won ? '#ffd75e' : '#ff5c5c', 26],
        [`${state.round} 라운드 · ${minutes}분 ${seconds}초 · 처치 ${state.kills}`, '#c8d0e0', 13],
        [`무기 ${state.weapons.length}개 · 남은 골드 ${Math.floor(state.gold)}`, '#8a94a8', 12],
        ['', '#fff', 4],
        ['클릭하거나 Enter 를 눌러 다시 시작', '#ffd75e', 14],
      ],
      150,
    );
  }
}
