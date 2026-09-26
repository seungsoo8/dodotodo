import { DIFFICULTIES, findDifficulty, type DifficultyId, type GameMode } from '../core/config.ts';
import { enemyCountForRound, incomePerSecond, rerollCost, type GameState } from '../core/game.ts';
import { createRng } from '../core/rng.ts';
import { SET_SPECIALS, WEAPON_TYPES, effectiveWeapon, setTier, weaponCounts } from '../core/sets.ts';
import type { Enemy, ItemDef, WeaponType } from '../core/types.ts';
import { Effects } from './effects.ts';
import { easeOutBack, easeOutCubic, formatNumber, vignetteAlpha } from './fx.ts';
import { C, FONT, TYPE_INFO, bar, button, drawSprite, panel, spriteImage, text, type SpriteVariant } from './kit.ts';
import type { Layout, Rect } from './layout.ts';
import type { EndlessRecords, Records } from './records.ts';
import { ENEMY_SPRITES, ICONS, TOWER_SPRITE, facesLeft, walkFrame } from './sprites.ts';
import { formatTime, topDamage } from './summary.ts';

export { TYPE_INFO };

export interface UiState {
  started: boolean;
  paused: boolean;
  speed: number;
  hover: number | null;
  hoverButton: 'reroll' | 'speed' | 'pause' | 'mute' | null;
  difficulty: DifficultyId;
  mode: GameMode;
  muted: boolean;
  records: Records;
  endless: EndlessRecords;
  /** 이번 판으로 기록이 갱신됐는지 */
  newBest: boolean;
}

interface Banner {
  style: 'round' | 'boss' | 'elite' | 'set' | 'bossDown';
  title: string;
  sub?: string;
  color: string;
  born: number;
  life: number;
}

type CardAnim = { kind: 'buy' | 'deny' | 'flip'; at: number };

export class Renderer {
  readonly fx = new Effects();
  /** 결과 화면 위에 그리는 효과 (불꽃놀이) */
  private overlayFx = new Effects();
  private endAt = 0;
  private ctx: CanvasRenderingContext2D;
  private layout: Layout;
  private now = 0;
  private lastFrame = 0;
  private bg: HTMLCanvasElement | null = null;
  private banners: Banner[] = [];
  private cardAnims = new Map<number, CardAnim>();
  private hitAt = new Map<number, number>();
  private towerHitAt = -1;
  private shownGold = 0;
  private ghostHp = 1;
  private ghostHoldUntil = 0;
  private lastStatus: GameState['status'] = 'playing';
  private lastState: GameState | null = null;
  private nextFirework = 0;

  constructor(ctx: CanvasRenderingContext2D, layout: Layout) {
    this.ctx = ctx;
    this.layout = layout;
    this.fx.coinTarget = { x: 236, y: 12 };
  }

  // ───────── 입력 반응 (main.ts 가 부른다) ─────────

  onBuy(slot: number): void {
    this.cardAnims.set(slot, { kind: 'buy', at: this.now });
    const r = this.layout.cards[slot];
    this.fx.ring({ x: r.x + r.w / 2, y: r.y + r.h / 2 }, 40, C.gold, 0.35);
  }

  onDeny(slot: number | null): void {
    if (slot !== null) this.cardAnims.set(slot, { kind: 'deny', at: this.now });
  }

  onReroll(): void {
    this.layout.cards.forEach((_, i) => this.cardAnims.set(i, { kind: 'flip', at: this.now + i * 0.05 }));
  }

  onSetReached(state: GameState, type: WeaponType, tier: number): void {
    const color = TYPE_INFO[type].color;
    const t = state.tower;
    this.fx.ring({ x: t.x, y: t.y }, 120, color, 0.8);
    this.fx.ring({ x: t.x, y: t.y }, 70, '#ffffff', 0.5);
    this.fx.flash(color, 0.3);
    this.banner({
      style: 'set',
      title: `${TYPE_INFO[type].label} 세트 ${'★'.repeat(tier)} 달성!`,
      sub: tier === 2 ? SET_SPECIALS[type] : `${TYPE_INFO[type].label} 무기 피해 +${state.config.sets.damageBonus[0] * 100}%`,
      color,
      life: 2,
    });
  }

  private banner(b: Omit<Banner, 'born'>): void {
    this.banners = this.banners.filter((x) => x.style !== b.style);
    this.banners.push({ ...b, born: this.now });
  }

  // ───────── 게임 이벤트 → 연출 ─────────

  consume(state: GameState, time: number): void {
    this.now = time;
    this.fx.update(time);
    this.overlayFx.update(time);
    if (this.lastState !== state) {
      // 새 판: 연출 상태 초기화
      this.lastState = state;
      this.shownGold = state.gold;
      this.ghostHp = 1;
      this.lastStatus = state.status;
      this.banners = [];
    }
    const t = state.tower;
    const towerTop = { x: t.x, y: t.y + t.radius - TOWER_SPRITE.height + 3 };
    for (const ev of state.events) {
      switch (ev.kind) {
        case 'shot':
          this.fx.shot(ev, towerTop);
          break;
        case 'splash': {
          const d = Math.hypot(ev.at.x - t.x, ev.at.y - towerTop.y);
          this.fx.explosion(ev.at, ev.radius, Math.max(0.06, d / 380));
          break;
        }
        case 'hit': {
          this.hitAt.set(ev.enemyId, time);
          this.fx.hit(ev.at, ev.amount, ev.crit, '#f4f1e8');
          break;
        }
        case 'kill':
          this.fx.kill(ev.at, ev.bounty, ev.bounty >= 40);
          break;
        case 'towerHit':
          this.towerHitAt = time;
          this.fx.shake(1.5, 0.12);
          this.ghostHoldUntil = time + 0.4;
          break;
        case 'round':
          this.banner({ style: 'round', title: `${ev.round} 라운드`, color: C.gold, life: 1.6 });
          break;
        case 'elite':
          this.banner({ style: 'elite', title: '정예 등장!', sub: `강화된 ${ev.name}`, color: '#ff9d4d', life: 2 });
          this.fx.shake(3, 0.3);
          break;
        case 'boss':
          this.banner({
            style: 'boss',
            title: ev.n > 1 ? `보스 등장! 땅굴 군주 ${ev.n}번째` : '보스 등장! 땅굴 군주',
            sub: '모든 화력을 집중하세요',
            color: C.red,
            life: 3,
          });
          this.fx.shake(6, 0.9);
          this.fx.flash('#ff0000', 0.5);
          break;
        case 'bossDown':
          this.banner({ style: 'bossDown', title: '보스 격파!', sub: '무한 모드는 계속됩니다', color: C.gold, life: 2.5 });
          this.fx.ring(ev.at, 140, C.gold, 1);
          this.fx.firework(ev.at);
          this.fx.shake(6, 0.6);
          break;
      }
    }
    state.events.length = 0;
    if (this.hitAt.size > 800) this.hitAt.clear();

    if (state.status !== this.lastStatus) {
      this.lastStatus = state.status;
      this.endAt = time;
      if (state.status === 'lost') {
        this.fx.shatter(TOWER_SPRITE.pixels, { x: t.x - TOWER_SPRITE.width / 2, y: t.y + t.radius - TOWER_SPRITE.height });
        this.fx.shake(8, 1);
        this.fx.flash('#ff0000', 0.6);
      }
      if (state.status === 'won') this.fx.flash('#ffffff', 0.4);
    }
  }

  // ───────── 그리기 ─────────

  draw(state: GameState, ui: UiState, time: number): void {
    const dt = Math.min(0.1, Math.max(0, time - this.lastFrame));
    this.lastFrame = time;
    this.now = time;
    this.fx.update(time);
    this.overlayFx.update(time);
    this.tween(state, dt);

    const { ctx, layout } = this;
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // 전장 (흔들림 적용)
    const shake = this.fx.shakeOffset();
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, layout.width, layout.fieldHeight);
    ctx.clip();
    ctx.translate(shake.x, shake.y);
    this.drawField(state, ui, dt);
    this.fx.draw(ctx, layout.width, layout.fieldHeight);
    ctx.restore();

    if (ui.started) this.drawVignette(state);
    if (ui.started) this.drawHud(state, ui);
    if (ui.started) this.drawShop(state, ui);
    else panel(ctx, { x: -2, y: layout.fieldHeight, w: layout.width + 4, h: layout.height - layout.fieldHeight + 2 }, '#10141f');
    if (ui.started) this.drawBanners();

    if (!ui.started) this.overlayStart(ui);
    else if (state.status !== 'playing') this.overlayEnd(state, ui);
    else if (ui.paused) this.overlayPause();
    ctx.restore();
  }

  private tween(state: GameState, dt: number): void {
    this.shownGold += (state.gold - this.shownGold) * Math.min(1, dt * 12);
    const ratio = Math.max(0, state.tower.hp / state.tower.maxHp);
    if (ratio >= this.ghostHp) this.ghostHp = ratio;
    else if (this.now > this.ghostHoldUntil) this.ghostHp = Math.max(ratio, this.ghostHp - dt * 0.8);
  }

  private background(): HTMLCanvasElement {
    if (this.bg) return this.bg;
    const { width, fieldHeight } = this.layout;
    const c = document.createElement('canvas');
    c.width = width;
    c.height = fieldHeight;
    const g = c.getContext('2d')!;
    const rng = createRng(7);
    g.fillStyle = C.field;
    g.fillRect(0, 0, width, fieldHeight);
    // 은은한 바둑판
    g.fillStyle = '#1b2433';
    for (let x = 0; x < width; x += 16) for (let y = 0; y < fieldHeight; y += 16) if (((x + y) / 16) % 2 === 0) g.fillRect(x, y, 16, 16);
    // 탑 둘레 흙바닥
    const cx = width / 2;
    const cy = fieldHeight / 2;
    for (let i = 0; i < 900; i++) {
      const a = rng.range(0, Math.PI * 2);
      const d = Math.sqrt(rng.next()) * 58;
      g.fillStyle = rng.next() < 0.5 ? '#2a2630' : '#241f2a';
      g.fillRect(Math.round(cx + Math.cos(a) * d), Math.round(cy + 10 + Math.sin(a) * d * 0.6), 2, 2);
    }
    // 풀·돌·꽃
    for (let i = 0; i < 260; i++) {
      const x = Math.round(rng.range(0, width));
      const y = Math.round(rng.range(0, fieldHeight));
      if (Math.hypot(x - cx, (y - cy - 10) / 0.6) < 62) continue;
      const r = rng.next();
      if (r < 0.6) {
        g.fillStyle = r < 0.3 ? '#2c4a3a' : '#253e32';
        g.fillRect(x, y, 1, 2);
        g.fillRect(x + 2, y + 1, 1, 1);
      } else if (r < 0.9) {
        g.fillStyle = '#2b3140';
        g.fillRect(x, y, 2, 1);
        g.fillStyle = '#3a4152';
        g.fillRect(x, y - 1, 1, 1);
      } else {
        g.fillStyle = ['#c77dff', '#ffd75e', '#ff9db5'][rng.int(3)];
        g.fillRect(x, y, 1, 1);
      }
    }
    // 가장자리 어둡게
    const grad = g.createRadialGradient(cx, cy, fieldHeight * 0.35, cx, cy, width * 0.62);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.45)');
    g.fillStyle = grad;
    g.fillRect(0, 0, width, fieldHeight);
    this.bg = c;
    return c;
  }

  private drawField(state: GameState, ui: UiState, dt: number): void {
    const { ctx } = this;
    ctx.drawImage(this.background(), 0, 0);
    const t = state.tower;

    if (ui.started && state.weapons.length > 0) {
      const counts = weaponCounts(state);
      const maxRange = Math.max(...state.weapons.map((w) => effectiveWeapon(state, w.def, counts).range));
      ctx.strokeStyle = 'rgba(216, 222, 240, 0.10)';
      ctx.setLineDash([3, 5]);
      ctx.lineDashOffset = -this.now * 8;
      ctx.beginPath();
      ctx.arc(t.x, t.y, maxRange, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // y 순서로 그린다 (탑 포함)
    const ordered = [...state.enemies].sort((a, b) => a.y - b.y);
    const towerBase = t.y + t.radius;
    let towerDrawn = false;
    for (const e of ordered) {
      if (!towerDrawn && e.y + e.radius > towerBase) {
        if (ui.started) this.drawTower(state);
        towerDrawn = true;
      }
      this.drawEnemy(e, t.x, dt);
    }
    if (!towerDrawn && ui.started) this.drawTower(state);
  }

  private drawEnemy(e: Enemy, towerX: number, dt: number): void {
    const { ctx } = this;
    const sprites = ENEMY_SPRITES[e.def.id];
    if (!sprites) return;
    const slowed = e.slowTimeLeft > 0;
    const sprite = sprites[walkFrame(this.now, e.id, sprites.length, slowed ? 3 : 6)];
    const scale = e.isElite ? 1.5 : 1;
    const w = sprite.width * scale;
    const h = sprite.height * scale;
    const left = Math.round(e.x - w / 2);
    const top = Math.round(e.y - h / 2);

    if (e.isBoss) {
      ctx.globalAlpha = 0.35 + 0.15 * Math.sin(this.now * 4);
      ctx.fillStyle = '#6b0f1a';
      ctx.beginPath();
      ctx.ellipse(e.x, top + h - 2, w * 0.75, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = '#00000066';
    ctx.beginPath();
    ctx.ellipse(e.x, top + h - 1, w * 0.4, 2 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    if (e.isElite) {
      ctx.strokeStyle = C.gold;
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(this.now * 6);
      ctx.beginPath();
      ctx.ellipse(e.x, top + h - 1, w * 0.5, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      if (Math.random() < dt * 8) this.fx.sparkle({ x: e.x + (Math.random() - 0.5) * w, y: e.y + (Math.random() - 0.5) * h }, C.gold);
    }
    if (slowed && Math.random() < dt * 4) this.fx.sparkle({ x: e.x + (Math.random() - 0.5) * w, y: top }, '#bfe0ff');

    const flashing = this.now - (this.hitAt.get(e.id) ?? -1) < 0.045;
    const variant: SpriteVariant = flashing ? 'white' : slowed ? 'frozen' : 'normal';
    drawSprite(ctx, sprite, left, top, scale, facesLeft(e.x, towerX), variant);

    const ratio = Math.max(0, e.hp / e.maxHp);
    if (e.isBoss) {
      const bw = 64;
      bar(ctx, e.x - bw / 2, top - 10, bw, 4, ratio, C.red);
      text(ctx, `땅굴 군주 ${formatNumber(Math.max(0, e.hp))}`, e.x, top - 17, '#ffb3b3', 8, 'center');
      return;
    }
    if (ratio >= 1) return; // 다치지 않은 적은 체력바를 숨겨 화면을 깔끔하게
    const bw = Math.max(10, Math.round(w * 0.9));
    ctx.fillStyle = C.ink;
    ctx.fillRect(Math.round(e.x - bw / 2) - 1, top - 5, bw + 2, 4);
    ctx.fillStyle = e.isElite ? C.gold : ratio > 0.5 ? C.green : ratio > 0.25 ? C.gold : C.red;
    ctx.fillRect(Math.round(e.x - bw / 2), top - 4, Math.round(bw * ratio), 2);
  }

  private drawTower(state: GameState): void {
    if (state.status === 'lost') return; // 무너진 뒤에는 조각만 남는다
    const { ctx } = this;
    const t = state.tower;
    const s = TOWER_SPRITE;
    const left = Math.round(t.x - s.width / 2);
    const top = Math.round(t.y + t.radius - s.height);
    ctx.fillStyle = '#00000077';
    ctx.beginPath();
    ctx.ellipse(t.x, t.y + t.radius - 1, s.width * 0.6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    const hurt = this.now - this.towerHitAt < 0.08;
    drawSprite(ctx, s, left, top, 1, false, hurt ? 'red' : 'normal');
    // 꼭대기 구슬이 은은하게 빛난다
    const glow = 0.35 + 0.2 * Math.sin(this.now * 3);
    ctx.globalAlpha = glow;
    ctx.fillStyle = C.gold;
    ctx.beginPath();
    ctx.arc(t.x, top + 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  private drawVignette(state: GameState): void {
    const a = vignetteAlpha(state.tower.hp / state.tower.maxHp);
    if (a <= 0 || state.status !== 'playing') return;
    const { ctx } = this;
    const { width, fieldHeight } = this.layout;
    const pulse = a * (0.75 + 0.25 * Math.sin(this.now * 6));
    const g = ctx.createRadialGradient(width / 2, fieldHeight / 2, fieldHeight * 0.3, width / 2, fieldHeight / 2, width * 0.6);
    g.addColorStop(0, 'rgba(255,0,0,0)');
    g.addColorStop(1, `rgba(200,0,0,${pulse})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, fieldHeight);
  }

  // ───────── HUD ─────────

  private drawHud(state: GameState, ui: UiState): void {
    const { ctx, layout } = this;
    const { width } = layout;
    const c = state.config;
    panel(ctx, { x: -2, y: -2, w: width + 4, h: 26 }, '#0f1320ee');

    // 라운드 + 진행 막대
    const endless = state.mode === 'endless';
    const bossRound = !endless && state.round === c.totalRounds;
    const roundLabel = endless ? `라운드 ${state.round} · 무한` : `라운드 ${state.round}/${c.totalRounds}`;
    text(ctx, roundLabel, 8, 9, C.text, 11, 'left', true);
    if (bossRound) text(ctx, '보스전', 8, 19, C.red, 8);
    else {
      const p = Math.min(1, state.roundTime / c.roundSeconds);
      bar(ctx, 8, 17, 110, 2, p, '#6fb7ff');
      text(ctx, `${Math.ceil(c.roundSeconds - state.roundTime)}초`, 124, 18, C.dim, 8);
    }

    // 골드 (코인이 도착하면 톡 튄다)
    const bump = Math.max(0, 1 - (this.now - this.fx.goldBumpAt) / 0.15);
    const bumpScale = this.now >= this.fx.goldBumpAt ? 1 + 0.35 * bump : 1;
    drawSprite(ctx, ICONS.coin, 226, 3, 2);
    ctx.save();
    ctx.translate(250, 11);
    ctx.scale(bumpScale, bumpScale);
    text(ctx, `${Math.floor(this.shownGold)}`, 0, 0, C.gold, 12, 'left', true);
    ctx.restore();
    text(ctx, `+${incomePerSecond(state)}/초`, 305, 12, C.dim, 9);

    // 체력 (잔상 막대)
    const t = state.tower;
    drawSprite(ctx, ICONS.heart, 368, 3, 2);
    const ratio = Math.max(0, t.hp / t.maxHp);
    bar(ctx, 390, 6, 150, 10, ratio, ratio > 0.3 ? '#4fc36a' : C.red, this.ghostHp);
    text(ctx, `${Math.ceil(t.hp)} / ${t.maxHp}`, 465, 11.5, '#ffffff', 9, 'center');

    const d = findDifficulty(state.difficulty).name;
    text(ctx, endless ? `${d} · 무한` : d, width - 32, 11, C.dim, 9, 'right');
    const m = layout.mute;
    button(ctx, m, ui.muted ? '♪×' : '♪', ui.hoverButton === 'mute' ? 'hover' : 'normal');

    this.drawStats(state);
    this.drawOwned(state);
  }

  private drawStats(state: GameState): void {
    const t = state.tower;
    const stats: string[] = [];
    if (t.armor) stats.push(`방어 ${t.armor}`);
    if (t.regen) stats.push(`재생 ${t.regen}`);
    if (t.damageMul !== 1) stats.push(`피해 +${Math.round((t.damageMul - 1) * 100)}%`);
    if (t.attackSpeedMul !== 1) stats.push(`공속 +${Math.round((t.attackSpeedMul - 1) * 100)}%`);
    if (t.critChance) stats.push(`치명 ${Math.round(t.critChance * 100)}%`);
    if (t.thorns) stats.push(`가시 ${t.thorns}`);
    if (t.rangeBonus) stats.push(`사거리 +${t.rangeBonus}`);
    const { width } = this.layout;
    const c = state.config;
    const lines: [string, string][] = [];
    if (stats.length) lines.push([stats.join(' · '), C.gold]);
    const endlessBoss = state.mode === 'endless' ? c.endless.bossEvery - ((state.round - 1) % c.endless.bossEvery) - 1 : -1;
    if (state.mode === 'classic' && state.round < c.totalRounds) {
      lines.push([`이번 라운드 적 ${state.spawnedThisRound}/${enemyCountForRound(c, state.round)}`, C.dim]);
    } else if (endlessBoss >= 0) {
      lines.push([endlessBoss === 0 ? '보스 라운드!' : `다음 보스까지 ${endlessBoss}라운드`, endlessBoss === 0 ? C.red : C.dim]);
    }
    lines.forEach(([s, color], i) => text(this.ctx, s, width - 32, 34 + i * 12, color, 9, 'right'));
  }

  /** 왼쪽: 보유 무기(아이콘·개수)와 세트 진행 */
  private drawOwned(state: GameState): void {
    const { ctx } = this;
    const owned = new Map<string, { name: string; type: WeaponType; n: number }>();
    for (const w of state.weapons) {
      const cur = owned.get(w.def.id);
      if (cur) cur.n++;
      else owned.set(w.def.id, { name: w.def.name, type: w.def.type, n: 1 });
    }
    const counts = weaponCounts(state);
    const setRows = WEAPON_TYPES.filter((type) => counts[type] > 0);
    const rows = owned.size + setRows.length;
    if (rows === 0) return;
    panel(ctx, { x: 4, y: 28, w: 196, h: rows * 11 + (setRows.length ? 12 : 8) }, '#0f1320cc', '#2a3350', '#0a0d16');
    let y = 36;
    for (const { name, type, n } of owned.values()) {
      drawSprite(ctx, ICONS[type], 9, y - 4, 1);
      text(ctx, `${name}${n > 1 ? ` ×${n}` : ''}`, 21, y, TYPE_INFO[type].color, 9);
      y += 11;
    }
    if (!setRows.length) return;
    ctx.fillStyle = '#2a3350';
    ctx.fillRect(9, y - 4, 186, 1);
    y += 2;
    const [t1, t2] = state.config.sets.thresholds;
    const [b1, b2] = state.config.sets.damageBonus;
    for (const type of setRows) {
      const n = counts[type];
      const tier = setTier(state.config, n);
      const next =
        tier === 0
          ? `${n}/${t1} → +${b1 * 100}%`
          : tier === 1
            ? `${n}/${t2} → +${b2 * 100}% ${SET_SPECIALS[type]}`
            : `+${b2 * 100}% ${SET_SPECIALS[type]}`;
      ctx.globalAlpha = tier === 0 ? 0.6 : 1;
      text(ctx, '★'.repeat(tier) + '☆'.repeat(2 - tier), 9, y + 1, C.gold, 8);
      text(ctx, `${TYPE_INFO[type].label} ${next}`, 34, y + 1, TYPE_INFO[type].color, 8);
      ctx.globalAlpha = 1;
      y += 11;
    }
  }

  // ───────── 상점 ─────────

  private drawShop(state: GameState, ui: UiState): void {
    const { ctx, layout } = this;
    panel(ctx, { x: -2, y: layout.fieldHeight, w: layout.width + 4, h: layout.height - layout.fieldHeight + 2 }, '#10141f');
    const counts = weaponCounts(state);
    layout.cards.forEach((r, i) => this.drawCard(r, state.shop[i], i, state, counts, ui.hover === i && ui.started));

    const cost = rerollCost(state);
    const canReroll = state.gold >= cost;
    const hb = ui.hoverButton;
    button(ctx, layout.reroll, '', !canReroll ? 'disabled' : hb === 'reroll' ? 'hover' : 'normal');
    text(ctx, '리롤 [R]', layout.reroll.x + 12, layout.reroll.y + layout.reroll.h / 2 + 1, canReroll ? C.text : '#5a6078', 11);
    drawSprite(ctx, ICONS.coin, layout.reroll.x + layout.reroll.w - 44, layout.reroll.y + 8, 1);
    text(ctx, `${cost}`, layout.reroll.x + layout.reroll.w - 32, layout.reroll.y + layout.reroll.h / 2 + 1, canReroll ? C.gold : '#ff7070', 10);
    button(ctx, layout.speed, ui.speed === 1 ? '▶ 1배' : '▶▶ 2배', ui.speed === 2 ? 'selected' : hb === 'speed' ? 'hover' : 'normal', '#6fb7ff');
    button(ctx, layout.pause, ui.paused ? '▶ 계속' : 'Ⅱ 정지', ui.paused ? 'selected' : hb === 'pause' ? 'hover' : 'normal');
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
    const anim = this.cardAnims.get(index);
    const age = anim ? this.now - anim.at : Infinity;
    let dx = 0;
    let dy = hover && item ? -2 : 0;
    let scaleX = 1;
    if (anim?.kind === 'deny' && age < 0.3) dx = Math.sin(age * 60) * 3 * (1 - age / 0.3);
    if (anim?.kind === 'flip' && age < 0.25) scaleX = age < 0 ? 1 : Math.abs(Math.cos((age / 0.25) * Math.PI));
    if (anim?.kind === 'buy' && age < 0.25) dy -= 4 * easeOutCubic(1 - age / 0.25);

    ctx.save();
    ctx.translate(r.x + r.w / 2 + dx, r.y + r.h / 2 + dy);
    ctx.scale(scaleX, 1);
    const box = { x: -r.w / 2, y: -r.h / 2, w: r.w, h: r.h };

    if (!item) {
      panel(ctx, box, '#121622', '#1c2233', '#0a0d16');
      text(ctx, '구매 완료', 0, 0, '#3a4260', 10, 'center');
      if (anim?.kind === 'buy' && age < 0.25) {
        ctx.globalAlpha = 1 - age / 0.25;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(box.x, box.y, box.w, box.h);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      return;
    }

    const color = item.kind === 'weapon' ? TYPE_INFO[item.type].color : C.gold;
    const affordable = state.gold >= item.price;
    panel(ctx, box, hover ? '#232b42' : '#1a2032', hover ? color : C.panelHi);
    ctx.globalAlpha = affordable ? 1 : 0.45;
    // 계열 색 띠 + 아이콘
    ctx.fillStyle = color;
    ctx.fillRect(box.x + 2, box.y + 2, box.w - 4, 2);
    drawSprite(ctx, ICONS[item.kind === 'weapon' ? item.type : 'upgrade'], box.x + 4, box.y + 7, 1);
    text(ctx, `${index + 1}`, box.x + 16, box.y + 11, C.dim, 8);
    text(ctx, item.kind === 'weapon' ? TYPE_INFO[item.type].label : '강화', box.x + 24, box.y + 11, color, 8);
    if (item.kind === 'weapon') {
      const after = counts[item.type] + 1;
      const reaches = state.config.sets.thresholds.includes(after);
      const blink = reaches && Math.floor(this.now * 3) % 2 === 0;
      text(ctx, reaches ? `세트 ${after}개!` : `세트 ${after}`, box.x + 52, box.y + 11, reaches ? (blink ? '#ffffff' : C.gold) : C.dim, 8);
    }
    drawSprite(ctx, ICONS.coin, box.x + box.w - 30, box.y + 7, 1);
    text(ctx, `${item.price}`, box.x + box.w - 5, box.y + 11, affordable ? C.gold : '#ff7070', 9, 'right');

    text(ctx, item.name, box.x + 5, box.y + 24, '#ffffff', 12, 'left', true);
    ctx.font = `8px ${FONT}`;
    if (item.kind === 'weapon') {
      text(ctx, `피해 ${item.damage} · ${item.cooldown}초 · 사거리 ${item.range}`, box.x + 5, box.y + 37, '#b0b8c8', 8);
      this.wrap(item.desc, box.x + 5, box.y + 48, box.w - 10, 10, C.dim);
    } else {
      this.wrap(item.desc, box.x + 5, box.y + 38, box.w - 10, 10, '#b0b8c8');
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private wrap(str: string, x: number, y: number, maxW: number, lineH: number, color: string): void {
    const { ctx } = this;
    ctx.font = `8px ${FONT}`;
    let line = '';
    let lines = 0;
    for (const ch of str) {
      if (ctx.measureText(line + ch).width > maxW && line) {
        text(ctx, line, x, y, color, 8);
        y += lineH;
        line = ch.trimStart();
        if (++lines >= 2) return;
      } else line += ch;
    }
    if (line) text(ctx, line, x, y, color, 8);
  }

  // ───────── 배너 ─────────

  private drawBanners(): void {
    const { ctx, layout } = this;
    this.banners = this.banners.filter((b) => this.now - b.born < b.life);
    for (const b of this.banners) {
      const age = this.now - b.born;
      const p = age / b.life;
      const fadeOut = p > 0.8 ? (1 - p) / 0.2 : 1;
      ctx.globalAlpha = fadeOut;
      const cx = layout.width / 2;
      if (b.style === 'boss') {
        // 경고 띠가 옆에서 밀려 들어온다
        const slide = easeOutCubic(Math.min(1, age / 0.4));
        const y = layout.fieldHeight / 2 - 70;
        ctx.fillStyle = '#000000cc';
        ctx.fillRect(0, y - 22, layout.width, 44);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, y - 22, layout.width, 44);
        ctx.clip();
        ctx.fillStyle = '#8e2632';
        for (let x = -40 + ((this.now * 60) % 20); x < layout.width; x += 20) {
          ctx.fillRect(x, y - 22, 10, 4);
          ctx.fillRect(x + 10, y + 18, 10, 4);
        }
        ctx.restore();
        text(ctx, `⚠ ${b.title} ⚠`, cx + (1 - slide) * -layout.width, y - 3, b.color, 18, 'center', true);
        if (b.sub) text(ctx, b.sub, cx + (1 - slide) * layout.width, y + 12, C.text, 9, 'center');
      } else {
        const drop = easeOutBack(Math.min(1, age / 0.35));
        const y = -20 + drop * (b.style === 'set' ? 118 : 88);
        const w = b.style === 'round' ? 150 : 230;
        const h = b.sub ? 36 : 26;
        panel(ctx, { x: cx - w / 2, y: y - h / 2, w, h }, '#161b2aee', b.color);
        text(ctx, b.title, cx, y - (b.sub ? 6 : 0), b.color, b.style === 'round' ? 15 : 13, 'center', true);
        if (b.sub) text(ctx, b.sub, cx, y + 9, C.text, 9, 'center');
      }
      ctx.globalAlpha = 1;
    }
  }

  // ───────── 오버레이 ─────────

  private dim(alpha: number): void {
    this.ctx.fillStyle = `rgba(6, 8, 13, ${alpha})`;
    this.ctx.fillRect(0, 0, this.layout.width, this.layout.height);
  }

  private overlayPause(): void {
    this.dim(0.6);
    const { width, height } = this.layout;
    panel(this.ctx, { x: width / 2 - 110, y: height / 2 - 40, w: 220, h: 64 });
    text(this.ctx, 'Ⅱ 일시정지', width / 2, height / 2 - 18, C.gold, 18, 'center', true);
    text(this.ctx, 'Space 또는 정지 버튼으로 계속', width / 2, height / 2 + 6, C.text, 10, 'center');
  }

  private overlayStart(ui: UiState): void {
    const { ctx, layout } = this;
    const { width, fieldHeight } = layout;
    this.dim(0.55);

    // 적 행렬이 아래쪽을 지나간다
    const parade = ['goblin', 'wolf', 'goblin', 'orc', 'goblin', 'golem', 'wolf', 'orc', 'boss'];
    parade.forEach((id, i) => {
      const frames = ENEMY_SPRITES[id];
      const f = frames[walkFrame(this.now, i, frames.length, 6)];
      const x = ((this.now * 28 + i * 78) % (width + 120)) - 60;
      drawSprite(ctx, f, x, fieldHeight - 26 - f.height, 1, false);
    });

    // 탑과 제목 (살짝 떠다닌다)
    const bob = Math.sin(this.now * 2) * 2;
    const s = TOWER_SPRITE;
    ctx.drawImage(spriteImage(s), Math.round(width / 2 - s.width), Math.round(10 + bob), s.width * 2, s.height * 2);
    text(ctx, '탑 수호자', width / 2, 112 + bob / 2, C.gold, 30, 'center', true);
    text(ctx, '사방에서 몰려오는 적으로부터 가운데 탑을 지키세요 · 탑은 가진 무기로 자동 공격해요', width / 2, 138, C.text, 10, 'center');
    text(ctx, '상점에서 무기·강화를 사고, 같은 계열 무기를 3·6개 모으면 세트 보너스!', width / 2, 152, C.text, 10, 'center');

    // 모드 탭
    for (const { id, rect } of layout.modes) {
      const sel = ui.mode === id;
      button(ctx, rect, '', sel ? 'selected' : 'normal');
      text(ctx, id === 'classic' ? '클래식' : '무한 모드', rect.x + rect.w / 2, rect.y + 9, sel ? C.gold : C.text, 11, 'center', true);
      text(ctx, id === 'classic' ? '15라운드 보스를 잡으면 승리' : '끝없이 · 15라운드마다 보스', rect.x + rect.w / 2, rect.y + 19, C.dim, 7, 'center');
    }

    // 난이도 카드 (기록 포함)
    layout.difficulty.forEach(({ id, rect }, i) => {
      const d = DIFFICULTIES[i];
      const sel = ui.difficulty === id;
      const lift = sel ? -2 : 0;
      const r = { ...rect, y: rect.y + lift };
      button(ctx, r, '', sel ? 'selected' : 'normal');
      text(ctx, `${i + 1}. ${d.name}`, r.x + r.w / 2, r.y + 10, sel ? C.gold : '#ffffff', 12, 'center', true);
      text(ctx, d.desc, r.x + r.w / 2, r.y + 23, C.dim, 8, 'center');
      let record: string;
      let good = false;
      if (ui.mode === 'endless') {
        const rec = ui.endless[id];
        record = rec.plays === 0 ? '무한 기록 없음' : `최고 ${rec.bestRound}라운드 · 처치 ${formatNumber(rec.bestKills)}`;
        good = rec.bestRound >= 15;
      } else {
        const rec = ui.records[id];
        record =
          rec.plays === 0
            ? '기록 없음'
            : `최고 ${rec.bestRound}R · 승리 ${rec.wins}${rec.fastestWin !== null ? ` · ${formatTime(rec.fastestWin)}` : ''}`;
        good = rec.wins > 0;
      }
      text(ctx, record, r.x + r.w / 2, r.y + 35, good ? C.gold : C.text, 8, 'center');
    });

    const blink = Math.floor(this.now * 2) % 2 === 0;
    text(ctx, '클릭하거나 1/2/3 · Enter 로 시작  ·  ↑↓ 모드  ←→ 난이도', width / 2, fieldHeight - 8, blink ? C.gold : C.dim, 9, 'center');
    text(ctx, '게임 중: 1~4 구매 · R 리롤 · Space 정지 · F 배속 · M 소리', width / 2, fieldHeight + 26, C.text, 10, 'center');
    text(ctx, '같은 계열 3개 → 피해 +20%   6개 → +50% + 특수 효과', width / 2, fieldHeight + 46, C.dim, 9, 'center');
  }

  private overlayEnd(state: GameState, ui: UiState): void {
    const { ctx, layout } = this;
    const won = state.status === 'won';
    const endless = state.mode === 'endless';
    this.dim(0.6 * Math.min(1, (this.now - this.endAt) / 0.6));
    if (won && this.now > this.nextFirework) {
      this.nextFirework = this.now + 0.35;
      this.overlayFx.firework({ x: 80 + Math.random() * (layout.width - 160), y: 40 + Math.random() * 120 });
    }
    this.overlayFx.draw(ctx, layout.width, layout.fieldHeight);

    const w = 360;
    const rows = topDamage(state.damageByWeapon, 5);
    const h = 150 + rows.length * 14;
    const x = layout.width / 2 - w / 2;
    const y = Math.max(8, layout.height / 2 - h / 2 - 10);
    // 끝난 뒤 잠깐 결과를 보여주고(탑 붕괴 연출), 창이 튀어나온다
    const pop = easeOutBack(Math.min(1, Math.max(0, (this.now - this.endAt - 0.6) / 0.35)));
    if (pop <= 0) return;
    ctx.save();
    ctx.translate(layout.width / 2, y + h / 2);
    ctx.scale(pop, pop);
    ctx.translate(-layout.width / 2, -(y + h / 2));
    panel(ctx, { x, y, w, h }, '#141a29f2', won ? C.gold : endless ? '#6fb7ff' : C.red);

    const cx = layout.width / 2;
    const title = won ? '승리! 탑을 지켜냈습니다' : endless ? `무한 모드 종료 · ${state.round}라운드` : '탑이 무너졌습니다';
    text(ctx, title, cx, y + 20, won ? C.gold : endless ? '#6fb7ff' : C.red, 18, 'center', true);
    const d = findDifficulty(state.difficulty).name;
    text(ctx, `${d}${endless ? ' · 무한' : ''} · ${state.round}라운드 · ${formatTime(state.time)} · 처치 ${state.kills}`, cx, y + 42, C.text, 10, 'center');
    text(ctx, `무기 ${state.weapons.length}개 · 남은 골드 ${Math.floor(state.gold)}`, cx, y + 56, C.dim, 9, 'center');

    let yy = y + 74;
    if (rows.length) {
      text(ctx, '무기별 피해', cx, yy, C.dim, 9, 'center');
      yy += 13;
      const barX = cx - 50;
      for (const row of rows) {
        const item = state.weapons.find((wp) => wp.def.id === row.id)?.def;
        const color = item ? TYPE_INFO[item.type].color : C.gold;
        text(ctx, row.name, barX - 6, yy, color, 9, 'right');
        bar(ctx, barX, yy - 3, 130, 6, row.percent / 100, color);
        text(ctx, `${row.percent}% ${formatNumber(row.damage)}`, barX + 138, yy, C.text, 8);
        yy += 14;
      }
    }

    yy += 6;
    if (endless) {
      const rec = ui.endless[state.difficulty];
      text(ctx, `무한 최고 기록: ${rec.bestRound}라운드 · 최다 처치 ${formatNumber(rec.bestKills)}`, cx, yy, ui.newBest ? C.gold : C.dim, 9, 'center');
    } else {
      const rec = ui.records[state.difficulty];
      text(
        ctx,
        `최고 기록: ${rec.bestRound}라운드 · 승리 ${rec.wins}회${rec.fastestWin !== null ? ` · 최단 ${formatTime(rec.fastestWin)}` : ''}`,
        cx,
        yy,
        ui.newBest ? C.gold : C.dim,
        9,
        'center',
      );
    }
    if (ui.newBest) {
      const s = 1 + 0.08 * Math.sin(this.now * 8);
      ctx.save();
      ctx.translate(cx, yy + 15);
      ctx.scale(s, s);
      text(ctx, '★ 새 기록! ★', 0, 0, C.gold, 12, 'center', true);
      ctx.restore();
    }
    const blink = Math.floor(this.now * 2) % 2 === 0;
    text(ctx, '클릭하거나 Enter 를 눌러 처음 화면으로', cx, y + h - 12, blink ? C.gold : C.dim, 10, 'center');
    ctx.restore();
  }
}

