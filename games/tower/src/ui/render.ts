import { DIFFICULTIES, findDifficulty, type DifficultyId } from '../core/config.ts';
import { enemyCountForRound, incomePerSecond, rerollCost, type GameState } from '../core/game.ts';
import { SET_SPECIALS, WEAPON_TYPES, effectiveWeapon, setTier, weaponCounts } from '../core/sets.ts';
import type { Enemy, GameEvent, ItemDef, Point, WeaponType } from '../core/types.ts';
import type { Layout, Rect } from './layout.ts';
import type { Records } from './records.ts';
import { ENEMY_SPRITES, TOWER_SPRITE, facesLeft, walkFrame, type Sprite } from './sprites.ts';
import { formatTime, topDamage } from './summary.ts';

const FONT = '"Galmuri11", "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';

export const TYPE_INFO: Record<WeaponType, { label: string; color: string }> = {
  normal: { label: '일반', color: '#e8e1cf' },
  pierce: { label: '관통', color: '#8fd16a' },
  magic: { label: '마법', color: '#6fb7ff' },
  siege: { label: '공성', color: '#ff9d4d' },
  chaos: { label: '카오스', color: '#c77dff' },
};
const GOLD = '#ffd75e';
const DIM = '#8a94a8';
const TEXT = '#c8d0e0';

export interface UiState {
  started: boolean;
  paused: boolean;
  speed: number;
  hover: number | null;
  message: { text: string; color: string; until: number } | null;
  difficulty: DifficultyId;
  muted: boolean;
  records: Records;
  /** 이번 판으로 최고 라운드나 최단 승리가 갱신됐는지 */
  newBest: boolean;
}

interface Effect {
  kind: 'line' | 'ring' | 'float' | 'flash' | 'particle';
  from?: Point;
  to?: Point;
  at?: Point;
  vel?: Point;
  radius?: number;
  text?: string;
  size?: number;
  color: string;
  born: number;
  life: number;
}

type SpriteVariant = 'normal' | 'frozen' | 'white';

export class Renderer {
  private effects: Effect[] = [];
  private spriteCache = new Map<Sprite, Map<string, HTMLCanvasElement>>();
  /** 적 id → 마지막으로 맞은 시각 (흰색 깜빡임) */
  private hitAt = new Map<number, number>();
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
        case 'hit':
          this.hitAt.set(ev.enemyId, this.now);
          if (ev.crit) this.add({ kind: 'float', at: ev.at, text: '치명타!', size: 9, color: '#ff6b6b', life: 0.6 });
          break;
        case 'kill':
          this.add({ kind: 'float', at: ev.at, text: `+${Math.round(ev.bounty)}`, size: 10, color: GOLD, life: 0.8 });
          for (let i = 0; i < 6; i++) {
            const a = (Math.PI * 2 * i) / 6 + Math.random();
            const v = 30 + Math.random() * 40;
            this.add({ kind: 'particle', at: ev.at, vel: { x: Math.cos(a) * v, y: Math.sin(a) * v - 20 }, color: '#e8e1cf', life: 0.45 });
          }
          break;
        case 'towerHit':
          this.add({ kind: 'flash', color: '#ff4d4d', life: 0.15 });
          break;
        case 'round':
          ui.message = { text: `${ev.round} 라운드`, color: GOLD, until: this.now + 1.5 };
          break;
        case 'elite':
          ui.message = { text: `정예 등장! 강화된 ${ev.name}`, color: '#ff9d4d', until: this.now + 2 };
          break;
        case 'boss':
          ui.message = { text: '보스 등장! 땅굴 군주', color: '#ff5c5c', until: this.now + 2.5 };
          break;
      }
    }
    events.length = 0;
    if (this.hitAt.size > 500) this.hitAt.clear();
  }

  private add(e: Omit<Effect, 'born'>): void {
    this.effects.push({ ...e, born: this.now });
    if (this.effects.length > 500) this.effects.splice(0, this.effects.length - 500);
  }

  draw(state: GameState, ui: UiState, time: number): void {
    this.now = time;
    this.effects = this.effects.filter((e) => time - e.born < e.life);
    const { ctx } = this;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    this.drawField(state);
    this.drawEffects();
    this.drawHud(state, ui);
    this.drawPanel(state, ui);
    if (ui.message && ui.message.until > time) this.banner(ui.message.text, ui.message.color);
    if (!ui.started) this.overlayStart(ui);
    else if (state.status === 'won') this.overlayEnd(state, ui, true);
    else if (state.status === 'lost') this.overlayEnd(state, ui, false);
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
    const counts = weaponCounts(state);
    const maxRange = Math.max(0, ...state.weapons.map((w) => effectiveWeapon(state, w.def, counts).range));
    if (maxRange > 0) {
      ctx.strokeStyle = 'rgba(200, 208, 224, 0.12)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(t.x, t.y, maxRange, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 아래쪽에 있는 것이 앞에 보이도록 y 순서로 그린다 (탑 포함)
    const ordered = [...state.enemies].sort((a, b) => a.y - b.y);
    const towerBase = t.y + t.radius;
    let towerDrawn = false;
    for (const e of ordered) {
      if (!towerDrawn && e.y + e.radius > towerBase) {
        this.drawTower(state);
        towerDrawn = true;
      }
      this.drawEnemy(e, t.x);
    }
    if (!towerDrawn) this.drawTower(state);
  }

  /** 도트 그림을 작은 캔버스에 한 번만 그려 두고 재사용한다 (좌우 반전·얼음색·흰색 버전 따로) */
  private spriteCanvas(sprite: Sprite, flip: boolean, variant: SpriteVariant): HTMLCanvasElement {
    const key = `${flip ? 'L' : 'R'}${variant}`;
    let variants = this.spriteCache.get(sprite);
    if (!variants) {
      variants = new Map();
      this.spriteCache.set(sprite, variants);
    }
    let canvas = variants.get(key);
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.width = sprite.width;
      canvas.height = sprite.height;
      const c = canvas.getContext('2d')!;
      for (const p of sprite.pixels) {
        c.fillStyle = p.color;
        c.fillRect(flip ? sprite.width - 1 - p.x : p.x, p.y, 1, 1);
      }
      if (variant !== 'normal') {
        c.globalCompositeOperation = 'source-atop';
        c.fillStyle = variant === 'frozen' ? 'rgba(111, 183, 255, 0.55)' : 'rgba(255, 255, 255, 0.85)';
        c.fillRect(0, 0, sprite.width, sprite.height);
      }
      variants.set(key, canvas);
    }
    return canvas;
  }

  private drawEnemy(e: Enemy, towerX: number): void {
    const { ctx } = this;
    const sprites = ENEMY_SPRITES[e.def.id];
    const slowed = e.slowTimeLeft > 0;
    if (!sprites) {
      ctx.fillStyle = e.def.color;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    const sprite = sprites[walkFrame(this.now, e.id, sprites.length, slowed ? 3 : 6)];
    const scale = e.isElite ? 1.5 : 1;
    const w = Math.round(sprite.width * scale);
    const h = Math.round(sprite.height * scale);
    const left = Math.round(e.x - w / 2);
    const top = Math.round(e.y - h / 2);

    // 발밑 그림자 (정예는 금빛 원)
    ctx.fillStyle = '#00000055';
    ctx.beginPath();
    ctx.ellipse(e.x, top + h - 1, w * 0.4, 2 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    if (e.isElite) {
      ctx.strokeStyle = GOLD;
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(this.now * 6);
      ctx.beginPath();
      ctx.ellipse(e.x, top + h - 1, w * 0.5, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    const flashing = this.now - (this.hitAt.get(e.id) ?? -1) < 0.07;
    const variant: SpriteVariant = flashing ? 'white' : slowed ? 'frozen' : 'normal';
    ctx.drawImage(this.spriteCanvas(sprite, facesLeft(e.x, towerX), variant), left, top, w, h);

    const ratio = Math.max(0, e.hp / e.maxHp);
    if (e.isBoss) {
      // 보스는 큰 체력바와 이름
      const bw = 60;
      ctx.fillStyle = '#000c';
      ctx.fillRect(e.x - bw / 2, top - 12, bw, 5);
      ctx.fillStyle = '#ff5c5c';
      ctx.fillRect(e.x - bw / 2, top - 12, bw * ratio, 5);
      ctx.font = `9px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = '#ffb3b3';
      ctx.fillText(`땅굴 군주 ${Math.ceil(Math.max(0, e.hp)).toLocaleString()}`, e.x, top - 13);
      return;
    }
    const bw = Math.max(12, w);
    ctx.fillStyle = '#000a';
    ctx.fillRect(e.x - bw / 2, top - 4, bw, 2);
    ctx.fillStyle = e.isElite ? GOLD : ratio > 0.5 ? '#6fdc6f' : ratio > 0.25 ? '#ffd75e' : '#ff5c5c';
    ctx.fillRect(e.x - bw / 2, top - 4, bw * ratio, 2);
  }

  private drawTower(state: GameState): void {
    const t = state.tower;
    const s = TOWER_SPRITE;
    const left = Math.round(t.x - s.width / 2);
    const top = Math.round(t.y + t.radius - s.height);
    const { ctx } = this;
    ctx.fillStyle = '#00000066';
    ctx.beginPath();
    ctx.ellipse(t.x, t.y + t.radius - 1, s.width * 0.55, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    const hurt = this.effects.some((e) => e.kind === 'flash') && t.hp < t.maxHp;
    ctx.drawImage(this.spriteCanvas(s, false, hurt ? 'white' : 'normal'), left, top);
  }

  private drawEffects(): void {
    const { ctx } = this;
    for (const e of this.effects) {
      const age = this.now - e.born;
      const p = age / e.life;
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
        ctx.font = `bold ${e.size ?? 10}px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(e.text, e.at.x, e.at.y - 8 - p * 14);
      } else if (e.kind === 'particle' && e.at && e.vel) {
        ctx.fillStyle = e.color;
        const x = e.at.x + e.vel.x * age;
        const y = e.at.y + e.vel.y * age + 60 * age * age;
        ctx.fillRect(Math.round(x), Math.round(y), 2, 2);
      } else if (e.kind === 'flash') {
        ctx.globalAlpha = (1 - p) * 0.12;
        ctx.fillStyle = e.color;
        ctx.fillRect(0, 0, this.layout.width, this.layout.fieldHeight);
      }
    }
    ctx.globalAlpha = 1;
  }

  // ───────── 상단 정보 ─────────

  private drawHud(state: GameState, ui: UiState): void {
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
    ctx.fillStyle = TEXT;
    ctx.fillText(`라운드 ${state.round}/${c.totalRounds}  ·  ${left}  ·  적 ${state.enemies.length}`, 8, 11);

    ctx.fillStyle = GOLD;
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
    ctx.fillStyle = DIM;
    ctx.fillText(findDifficulty(state.difficulty).name, width - 8, 11);

    // 탑 능력치 (0 이 아닌 것만)
    const stats: string[] = [];
    if (t.armor) stats.push(`방어 ${t.armor}`);
    if (t.regen) stats.push(`재생 ${t.regen}/초`);
    if (t.damageMul !== 1) stats.push(`피해 +${Math.round((t.damageMul - 1) * 100)}%`);
    if (t.attackSpeedMul !== 1) stats.push(`공속 +${Math.round((t.attackSpeedMul - 1) * 100)}%`);
    if (t.critChance) stats.push(`치명 ${Math.round(t.critChance * 100)}%`);
    if (t.thorns) stats.push(`가시 ${t.thorns}`);
    if (t.rangeBonus) stats.push(`사거리 +${t.rangeBonus}`);
    ctx.font = `10px ${FONT}`;
    ctx.fillStyle = GOLD;
    ctx.fillText(stats.join(' · '), width - 32, 34);
    if (!finalRound) {
      ctx.fillStyle = DIM;
      ctx.fillText(`이번 라운드 적 ${state.spawnedThisRound}/${enemyCountForRound(c, state.round)}`, width - 32, 48);
    }

    // 소리 버튼
    const m = this.layout.mute;
    ctx.fillStyle = '#0b0d14aa';
    ctx.fillRect(m.x, m.y, m.w, m.h);
    ctx.textAlign = 'center';
    ctx.font = `11px ${FONT}`;
    ctx.fillStyle = TEXT;
    ctx.fillText(ui.muted ? '🔇' : '🔊', m.x + m.w / 2, m.y + m.h / 2 + 1);

    this.drawOwned(state);
  }

  /** 왼쪽: 보유 무기(종류별 개수)와 세트 진행 */
  private drawOwned(state: GameState): void {
    const { ctx } = this;
    const owned = new Map<string, { name: string; type: WeaponType; n: number }>();
    for (const w of state.weapons) {
      const cur = owned.get(w.def.id);
      if (cur) cur.n++;
      else owned.set(w.def.id, { name: w.def.name, type: w.def.type, n: 1 });
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `10px ${FONT}`;
    let y = 34;
    for (const { name, type, n } of owned.values()) {
      ctx.fillStyle = TYPE_INFO[type].color;
      ctx.fillText(`${name}${n > 1 ? ` ×${n}` : ''}`, 8, y);
      y += 12;
    }

    const counts = weaponCounts(state);
    const [t1, t2] = state.config.sets.thresholds;
    const [b1, b2] = state.config.sets.damageBonus;
    const rows = WEAPON_TYPES.filter((type) => counts[type] > 0);
    if (rows.length === 0) return;
    y += 6;
    ctx.fillStyle = DIM;
    ctx.fillText('세트', 8, y);
    y += 12;
    for (const type of rows) {
      const n = counts[type];
      const tier = setTier(state.config, n);
      const stars = '★'.repeat(tier) + '☆'.repeat(2 - tier);
      const next =
        tier === 0
          ? `${n}/${t1} → 피해 +${b1 * 100}%`
          : tier === 1
            ? `${n}/${t2} → +${b2 * 100}% · ${SET_SPECIALS[type]}`
            : `피해 +${b2 * 100}% · ${SET_SPECIALS[type]}`;
      ctx.fillStyle = TYPE_INFO[type].color;
      ctx.globalAlpha = tier === 0 ? 0.6 : 1;
      ctx.fillText(`${stars} ${TYPE_INFO[type].label} ${next}`, 8, y);
      ctx.globalAlpha = 1;
      y += 12;
    }
  }

  // ───────── 상점 ─────────

  private drawPanel(state: GameState, ui: UiState): void {
    const { ctx, layout } = this;
    ctx.fillStyle = '#0b0d14';
    ctx.fillRect(0, layout.fieldHeight, layout.width, layout.height - layout.fieldHeight);
    ctx.fillStyle = '#2a3148';
    ctx.fillRect(0, layout.fieldHeight, layout.width, 1);

    const counts = weaponCounts(state);
    layout.cards.forEach((r, i) => this.drawCard(r, state.shop[i], i, state, counts, ui.hover === i));

    const cost = rerollCost(state);
    this.button(layout.reroll, `🎲 리롤 [R]  ${cost}G`, state.gold >= cost);
    this.button(layout.speed, ui.speed === 1 ? '▶ 1배' : '⏩ 2배', true);
    this.button(layout.pause, ui.paused ? '▶ 계속' : '⏸ 정지', true);
  }

  private drawCard(
    r: Rect,
    item: ItemDef | null,
    index: number,
    state: GameState,
    counts: Record<WeaponType, number>,
    hover: boolean,
  ): void {
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
    const color = item.kind === 'weapon' ? TYPE_INFO[item.type].color : GOLD;
    const affordable = state.gold >= item.price;
    ctx.strokeStyle = color;
    ctx.globalAlpha = affordable ? 1 : 0.4;
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);

    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.font = `9px ${FONT}`;
    ctx.fillStyle = DIM;
    ctx.fillText(`${index + 1}`, r.x + 4, r.y + 4);
    ctx.fillStyle = color;
    ctx.fillText(item.kind === 'weapon' ? TYPE_INFO[item.type].label : '강화', r.x + 14, r.y + 4);
    if (item.kind === 'weapon') {
      // 사면 세트 몇 개째가 되는지
      const after = counts[item.type] + 1;
      const reaches = state.config.sets.thresholds.includes(after);
      ctx.fillStyle = reaches ? GOLD : DIM;
      ctx.fillText(reaches ? `세트 ${after}개 달성!` : `세트 ${after}개째`, r.x + 44, r.y + 4);
    }
    ctx.textAlign = 'right';
    ctx.fillStyle = affordable ? GOLD : '#ff7070';
    ctx.fillText(`${item.price}G`, r.x + r.w - 4, r.y + 4);

    ctx.textAlign = 'left';
    ctx.font = `bold 12px ${FONT}`;
    ctx.fillStyle = '#fff';
    ctx.fillText(item.name, r.x + 4, r.y + 17);

    ctx.font = `9px ${FONT}`;
    ctx.fillStyle = '#b0b8c8';
    if (item.kind === 'weapon') {
      ctx.fillText(`피해 ${item.damage} · ${item.cooldown}초 · 사거리 ${item.range}`, r.x + 4, r.y + 33);
      ctx.fillStyle = DIM;
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

  private button(r: Rect, label: string, enabled: boolean, highlight = false): void {
    const { ctx } = this;
    ctx.fillStyle = highlight ? '#3a3320' : enabled ? '#2a3148' : '#1a1f2e';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = highlight ? GOLD : enabled ? '#4a5678' : '#2a3148';
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    ctx.fillStyle = enabled ? '#e8ecf4' : '#5a6078';
    ctx.font = `11px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2 + 1);
  }

  // ───────── 오버레이 ─────────

  private banner(text: string, color: string): void {
    const { ctx } = this;
    const y = this.layout.fieldHeight / 2 - 60;
    ctx.fillStyle = '#0b0d14aa';
    ctx.fillRect(0, y - 16, this.layout.width, 32);
    ctx.fillStyle = color;
    ctx.font = `bold 18px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, this.layout.width / 2, y);
  }

  private dim(): void {
    this.ctx.fillStyle = '#0b0d14e6';
    this.ctx.fillRect(0, 0, this.layout.width, this.layout.height);
  }

  private lines(rows: [string, string, number][], startY: number): number {
    const { ctx } = this;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let y = startY;
    for (const [text, color, size] of rows) {
      ctx.fillStyle = color;
      ctx.font = `${size >= 18 ? 'bold ' : ''}${size}px ${FONT}`;
      ctx.fillText(text, this.layout.width / 2, y);
      y += size + 9;
    }
    return y;
  }

  private overlayText(title: string, sub: string): void {
    this.dim();
    this.lines(
      [
        [title, GOLD, 24],
        [sub, TEXT, 12],
      ],
      this.layout.height / 2 - 20,
    );
  }

  private overlayStart(ui: UiState): void {
    this.dim();
    const { ctx } = this;
    const s = TOWER_SPRITE;
    ctx.drawImage(this.spriteCanvas(s, false, 'normal'), this.layout.width / 2 - s.width, 18, s.width * 2, s.height * 2);
    this.lines(
      [
        ['탑 수호자', GOLD, 30],
        ['사방에서 몰려오는 적으로부터 가운데 탑을 지키세요. 탑은 가진 무기로 자동 공격해요', TEXT, 11],
        ['상점에서 무기·강화를 사고 (클릭 · 1~4키), 같은 계열 무기를 3·6개 모으면 세트 보너스!', TEXT, 11],
        ['R 리롤 · Space 정지 · F 배속 · M 소리 · 15라운드 보스 「땅굴 군주」를 잡으면 승리', DIM, 10],
      ],
      118,
    );

    ctx.font = `11px ${FONT}`;
    ctx.fillStyle = GOLD;
    ctx.textAlign = 'center';
    ctx.fillText('난이도를 골라 시작하세요 (클릭 · 1/2/3 · Enter)', this.layout.width / 2, this.layout.fieldHeight - 84);
    this.layout.difficulty.forEach(({ id, rect }, i) => {
      const d = DIFFICULTIES[i];
      const rec = ui.records[id];
      this.button(rect, '', true, ui.difficulty === id);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold 13px ${FONT}`;
      ctx.fillStyle = ui.difficulty === id ? GOLD : '#fff';
      ctx.fillText(`${i + 1}. ${d.name}`, rect.x + rect.w / 2, rect.y + 11);
      ctx.font = `8px ${FONT}`;
      ctx.fillStyle = DIM;
      ctx.fillText(d.desc, rect.x + rect.w / 2, rect.y + 24);
      ctx.fillStyle = rec.wins > 0 ? GOLD : TEXT;
      const record =
        rec.plays === 0
          ? '기록 없음'
          : `최고 ${rec.bestRound}라운드 · 승리 ${rec.wins}${rec.fastestWin !== null ? ` · ${formatTime(rec.fastestWin)}` : ''}`;
      ctx.fillText(record, rect.x + rect.w / 2, rect.y + 36);
    });
  }

  private overlayEnd(state: GameState, ui: UiState, won: boolean): void {
    this.dim();
    const { ctx } = this;
    const d = findDifficulty(state.difficulty);
    let y = this.lines(
      [
        [won ? '승리! 탑을 지켜냈습니다' : '탑이 무너졌습니다', won ? GOLD : '#ff5c5c', 26],
        [`${d.name} · ${state.round} 라운드 · ${formatTime(state.time)} · 처치 ${state.kills}`, TEXT, 13],
        [`무기 ${state.weapons.length}개 · 남은 골드 ${Math.floor(state.gold)}`, DIM, 11],
      ],
      70,
    );

    const rows = topDamage(state.damageByWeapon, 5);
    if (rows.length > 0) {
      y += 6;
      ctx.font = `11px ${FONT}`;
      ctx.fillStyle = DIM;
      ctx.textAlign = 'center';
      ctx.fillText('무기별 피해', this.layout.width / 2, y);
      y += 16;
      const barX = this.layout.width / 2 - 60;
      const barW = 180;
      for (const row of rows) {
        const item = state.weapons.find((w) => w.def.id === row.id)?.def;
        const color = item ? TYPE_INFO[item.type].color : GOLD;
        ctx.textAlign = 'right';
        ctx.fillStyle = color;
        ctx.fillText(row.name, barX - 8, y);
        ctx.fillStyle = '#2a3148';
        ctx.fillRect(barX, y - 5, barW, 10);
        ctx.fillStyle = color;
        ctx.fillRect(barX, y - 5, (barW * row.percent) / 100, 10);
        ctx.textAlign = 'left';
        ctx.fillStyle = TEXT;
        ctx.fillText(`${row.percent}%  ${Math.round(row.damage).toLocaleString()}`, barX + barW + 8, y);
        y += 16;
      }
    }

    const rec = ui.records[state.difficulty];
    y += 8;
    this.lines(
      [
        [
          `${d.name} 최고 기록: ${rec.bestRound}라운드 · 승리 ${rec.wins}회${rec.fastestWin !== null ? ` · 최단 승리 ${formatTime(rec.fastestWin)}` : ''}`,
          ui.newBest ? GOLD : DIM,
          11,
        ],
        [ui.newBest ? '★ 새 기록! ★' : '', GOLD, 12],
        ['클릭하거나 Enter 를 눌러 처음 화면으로', GOLD, 13],
      ],
      y,
    );
  }
}
