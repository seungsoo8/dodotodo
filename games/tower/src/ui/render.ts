import { DIFFICULTIES, findDifficulty, type DifficultyId, type GameMode } from '../core/config.ts';
import { canBuy, enemyCountForRound, incomePerSecond, mergesOnBuy, priceOf, rerollCost, sellPrice, type GameState } from '../core/game.ts';
import { findPerk } from '../core/perks.ts';
import { SKILL, SKILLS, findSkill, skillCooldownLeft, skillUnlocked } from '../core/skills.ts';
import { BOSS_PATTERN, LEGENDARY_WEAPONS, findEnemy, findItem } from '../core/data.ts';
import { ACHIEVEMENTS } from '../core/achievements.ts';
import { HEROES, findHero, type HeroId } from '../core/heroes.ts';
import { META_UPGRADES, heroUnlocked, metaLevel, nextCost, type MetaState } from '../core/meta.ts';
import type { RunReward } from '../core/progress.ts';
import { tutorialHint, type TutorialProgress } from './tutorial.ts';
import { createRng } from '../core/rng.ts';
import { SET_SPECIALS, WEAPON_TYPES, effectiveWeapon, setTier, weaponCounts } from '../core/sets.ts';
import type { Enemy, ItemDef, WeaponType } from '../core/types.ts';
import { Effects } from './effects.ts';
import { easeOutBack, easeOutCubic, formatNumber, vignetteAlpha } from './fx.ts';
import { C, FONT, TYPE_INFO, bar, button, drawSprite, panel, spriteImage, text, type SpriteVariant } from './kit.ts';
import type { Layout, Rect } from './layout.ts';
import type { EndlessRecords, Records } from './records.ts';
import { OWNED_ROW, ownedGroups } from './owned.ts';
import { ENEMY_SPRITES, ICONS, TOWER_SPRITE, facesLeft, walkFrame } from './sprites.ts';
import { METEOR_FALL, schedule } from './weaponfx.ts';
import { formatTime, topDamage } from './summary.ts';

export { TYPE_INFO };

/** 날아다니는 적은 이만큼 떠서 그린다 */
const FLY_HEIGHT = 8;

export interface UiState {
  started: boolean;
  paused: boolean;
  speed: number;
  hover: number | null;
  hoverButton: 'reroll' | 'speed' | 'pause' | 'mute' | 'skill' | null;
  hoverSkill: number | null;
  hoverOwned: number | null;
  hoverChoice: number | null;
  /** 메테오 떨어뜨릴 곳을 고르는 중 */
  aiming: boolean;
  /** 전장 위 마우스 위치 (없으면 null) */
  pointer: { x: number; y: number } | null;
  /** 한 번 더 누르면 팔리는 보유 무기 묶음 (id:레벨) */
  sellArmed: { key: string; until: number } | null;
  difficulty: DifficultyId;
  mode: GameMode;
  muted: boolean;
  records: Records;
  endless: EndlessRecords;
  /** 이번 판으로 기록이 갱신됐는지 */
  newBest: boolean;
  /** 시작 화면 · 강화 상점 · 업적 */
  screen: 'title' | 'meta' | 'achievements';
  hero: HeroId;
  meta: MetaState;
  /** 방금 끝난 판의 보상 */
  reward: RunReward | null;
  /** 첫 판 안내 (다 끝났으면 null) */
  tutorial: TutorialProgress | null;
  /** 시작 화면·강화 상점에서 마우스가 올라간 것 */
  hoverStart: string | null;
  hoverMeta: number | null;
}

const LEGENDARY = new Set(LEGENDARY_WEAPONS.map((w) => w.id));

interface Banner {
  style: 'round' | 'boss' | 'elite' | 'set' | 'bossDown' | 'merge' | 'perk' | 'info';
  title: string;
  sub?: string;
  color: string;
  born: number;
  life: number;
}

type CardAnim = { kind: 'buy' | 'deny' | 'flip'; at: number };

/** 화면에 보였던 적의 마지막 모습 (투사체가 닿기 전에 죽은 적을 잠깐 남겨 두려고) */
interface EnemyLook {
  defId: string;
  x: number;
  y: number;
  isElite: boolean;
  id: number;
  flying: boolean;
}

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
  /** 적 id → 흰색으로 번쩍일 시각 (착탄 시각) */
  private hitAt = new Map<number, number>();
  private lastSeen = new Map<number, EnemyLook>();
  /** 로직에서는 이미 죽었지만 투사체가 아직 닿지 않은 적 */
  private ghosts: { look: EnemyLook; until: number }[] = [];
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

  /** 짧은 안내 (칸 부족 등) */
  info(title: string, sub?: string): void {
    this.banner({ style: 'info', title, sub, color: '#ff9d4d', life: 1.8 });
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
      title: `${TYPE_INFO[type].label} 세트 ${'★'.repeat(tier)}`,
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
      this.ghosts = [];
      this.lastSeen.clear();
    }
    const t = state.tower;
    const towerTop = { x: t.x, y: t.y + t.radius - TOWER_SPRITE.height + 3 };
    for (const { event: ev, delay, fx } of schedule(state.events)) {
      switch (ev.kind) {
        case 'shot':
          if (fx) this.fx.shot(ev, fx, towerTop);
          break;
        case 'splash':
          if (fx) this.fx.splash(fx.impact, ev.at, ev.radius, delay);
          break;
        case 'hit': {
          this.hitAt.set(ev.enemyId, Math.max(this.hitAt.get(ev.enemyId) ?? -1, time + delay));
          // 광역 무기는 떨어진 자리 효과(splash)로 충분하고, 나머지는 맞은 자리마다
          if (fx && fx.timing !== 'impact') this.fx.impact(fx.impact, ev.at, delay, towerTop);
          this.fx.number(ev.at, ev.amount, ev.crit, delay);
          break;
        }
        case 'kill': {
          const look = this.lastSeen.get(ev.enemyId);
          if (look && delay > 0.01) this.ghosts.push({ look: { ...look, x: ev.at.x, y: ev.at.y }, until: time + delay });
          this.fx.kill(ev.at, ev.bounty, ev.bounty >= 40, delay);
          break;
        }
        case 'towerHit':
          this.towerHitAt = time;
          this.fx.shake(1.5, 0.12);
          this.ghostHoldUntil = time + 0.4;
          break;
        case 'round':
          this.banner({ style: 'round', title: `${ev.round} 라운드`, color: C.gold, life: 1.6 });
          break;
        case 'elite':
          this.banner({ style: 'elite', title: `정예 ${ev.name}`, sub: '크고 단단하다. 현상금도 두둑', color: '#ff9d4d', life: 2 });
          this.fx.shake(3, 0.3);
          break;
        case 'boss': {
          const def = findEnemy(ev.id);
          this.banner({
            style: 'boss',
            title: ev.n > 1 ? `${def.name} (${ev.n}번째)` : def.name,
            sub: `"${def.boss?.line ?? ''}"`,
            color: C.red,
            life: 3.2,
          });
          this.fx.shake(6, 0.9);
          this.fx.flash('#ff0000', 0.5);
          break;
        }
        case 'bossWindup':
          this.fx.floatText({ x: ev.at.x, y: ev.at.y - 30 }, '!', '#ff5a4d', 16, ev.duration);
          break;
        case 'bossCancel':
          this.fx.floatText({ x: ev.at.x, y: ev.at.y - 48 }, '끊었다!', '#9fe0ff', 12, 1.2);
          this.fx.ring(ev.at, 44, '#9fe0ff', 0.5);
          this.fx.shake(3, 0.2);
          break;
        case 'bossSummon':
          this.fx.summon(ev.at, BOSS_PATTERN.summonSpread + 6);
          break;
        case 'bossSlam':
          this.towerHitAt = time;
          this.ghostHoldUntil = time + 0.6;
          this.fx.slam({ x: t.x, y: t.y + t.radius - 4 });
          this.fx.floatText({ x: t.x, y: t.y - 44 }, `-${Math.round(ev.amount)}`, '#ff5a4d', 13, 1);
          break;
        case 'bossNova':
          this.towerHitAt = time;
          this.ghostHoldUntil = time + 0.6;
          this.fx.firestorm({ x: t.x, y: t.y });
          this.fx.floatText({ x: t.x, y: t.y - 44 }, `-${Math.round(ev.amount)}`, '#ff5a4d', 13, 1);
          break;
        case 'bossShot':
          this.fx.fireball({ x: ev.from.x, y: ev.from.y - 10 }, { x: t.x, y: t.y - 6 });
          break;
        case 'bossEnrage':
          this.banner({ style: 'elite', title: '보스가 날뛰기 시작했다', sub: '더 빠르고, 기술을 더 자주 쓴다', color: C.red, life: 2 });
          this.fx.ring(ev.at, 60, C.red, 0.6);
          this.fx.shake(4, 0.4);
          break;
        case 'bossDown':
          this.banner({ style: 'bossDown', title: '보스 처치', sub: '다음 보스까지 버티자', color: C.gold, life: 2.5 });
          this.fx.ring(ev.at, 140, C.gold, 1);
          this.fx.firework(ev.at);
          this.fx.shake(6, 0.6);
          break;
        case 'steal':
          this.fx.floatText({ x: ev.at.x, y: ev.at.y - 12 }, `-${ev.amount}G 도둑!`, '#ff6b6b', 9, 1.2);
          this.fx.ring(ev.at, 16, '#ff6b6b', 0.4);
          break;
        case 'escape':
          if (ev.amount > 0) this.banner({ style: 'info', title: `도둑이 ${ev.amount}G 를 들고 튀었다`, color: '#ff6b6b', life: 1.8 });
          break;
        case 'heal':
          this.fx.heal(ev.at, ev.radius);
          break;
        case 'merge': {
          const name = findItem(ev.weaponId).name;
          this.banner({ style: 'merge', title: `${name} ${'★'.repeat(ev.level)}`, sub: `피해 ×${state.config.merge.damageMul[ev.level - 1]}`, color: C.gold, life: 1.8 });
          this.fx.mergeBurst({ x: t.x, y: t.y - 10 }, ev.level);
          break;
        }
        case 'sell':
          this.fx.floatText({ x: t.x, y: t.y - 36 }, `+${ev.amount}G 판매`, C.gold, 10, 1);
          break;
        case 'perk': {
          const perk = findPerk(ev.id);
          this.banner({ style: 'perk', title: `특전: ${perk.name}`, sub: perk.desc, color: '#c77dff', life: 2 });
          this.fx.ring({ x: t.x, y: t.y }, 90, '#c77dff', 0.6);
          break;
        }
        case 'skill':
          if (ev.id === 'meteor' && ev.at) this.fx.meteor(ev.at, SKILL.meteorRadius, METEOR_FALL);
          if (ev.id === 'blizzard') this.fx.blizzard(this.layout.width, this.layout.fieldHeight, SKILL.freezeSeconds);
          if (ev.id === 'repair') this.fx.repair({ x: t.x, y: t.y - 10 }, t.maxHp * SKILL.repairPct);
          if (ev.id === 'gold_rush') this.fx.goldRush({ x: t.x, y: t.y });
          this.banner({ style: 'info', title: findSkill(ev.id).name, color: C.gold, life: 1 });
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
    if (ui.started && ui.aiming && ui.pointer) this.drawAim(ui.pointer);
    ctx.restore();

    if (ui.started) this.drawVignette(state);
    if (ui.started) this.drawHud(state, ui);
    if (ui.started) this.drawShop(state, ui);
    else panel(ctx, { x: -2, y: layout.fieldHeight, w: layout.width + 4, h: layout.height - layout.fieldHeight + 2 }, '#10141f');
    if (ui.started) this.drawSkills(state, ui);
    if (ui.started) this.drawBanners();
    if (ui.started && ui.tutorial && state.status === 'playing' && !state.choice && !ui.paused && ui.hoverSkill === null) this.drawHint(state, ui.tutorial);

    if (!ui.started) {
      if (ui.screen === 'meta') this.overlayMeta(ui);
      else if (ui.screen === 'achievements') this.overlayAchievements(ui);
      else this.overlayStart(ui);
    }
    else if (state.status !== 'playing') this.overlayEnd(state, ui);
    else if (state.choice) this.overlayChoice(state, ui);
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

    if (ui.started && state.perks.includes('frost_aura')) {
      ctx.strokeStyle = 'rgba(159, 216, 255, 0.35)';
      ctx.beginPath();
      ctx.arc(t.x, t.y, 70, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (state.goldRushLeft > 0 && Math.random() < dt * 20) {
      const a = Math.random() * Math.PI * 2;
      this.fx.sparkle({ x: t.x + Math.cos(a) * 30, y: t.y + Math.sin(a) * 20 }, C.gold);
    }

    this.lastSeen = new Map(
      state.enemies.map((e) => [e.id, { defId: e.def.id, x: e.x, y: e.y, isElite: e.isElite, id: e.id, flying: e.def.ability === 'flying' }]),
    );
    this.ghosts = this.ghosts.filter((g) => g.until > this.now);
    for (const g of this.ghosts) this.drawGhost(g.look, t.x);

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

  /** 이미 죽었지만 투사체가 닿을 때까지 보여주는 적 */
  private drawGhost(g: EnemyLook, towerX: number): void {
    const sprites = ENEMY_SPRITES[g.defId];
    if (!sprites) return;
    const sprite = sprites[walkFrame(this.now, g.id, sprites.length, 6)];
    const scale = g.isElite ? 1.5 : 1;
    const flashing = this.isFlashing(g.id);
    drawSprite(
      this.ctx,
      sprite,
      Math.round(g.x - (sprite.width * scale) / 2),
      Math.round(g.y - (sprite.height * scale) / 2) - (g.flying ? FLY_HEIGHT : 0),
      scale,
      facesLeft(g.x, towerX),
      flashing ? 'white' : 'normal',
    );
  }

  private isFlashing(id: number): boolean {
    const at = this.hitAt.get(id);
    return at !== undefined && this.now >= at && this.now - at < 0.05;
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
    const flying = e.def.ability === 'flying';
    const lift = flying ? FLY_HEIGHT + Math.sin(this.now * 8 + e.id) * 2 : 0;
    const left = Math.round(e.x - w / 2);
    const top = Math.round(e.y - h / 2 - lift);
    const ground = Math.round(e.y + h / 2);

    if (e.def.ability === 'healer') {
      ctx.globalAlpha = 0.15 + 0.08 * Math.sin(this.now * 3);
      ctx.fillStyle = '#6fdc6f';
      ctx.beginPath();
      ctx.ellipse(e.x, e.y, 70, 45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (e.isBoss) {
      this.drawBossTelegraph(e);
      const enraged = e.pattern?.enraged;
      ctx.globalAlpha = (enraged ? 0.55 : 0.35) + 0.15 * Math.sin(this.now * (enraged ? 9 : 4));
      ctx.fillStyle = enraged ? '#b3121f' : '#6b0f1a';
      ctx.beginPath();
      ctx.ellipse(e.x, top + h - 2, w * 0.75, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = flying ? '#00000044' : '#00000066';
    ctx.beginPath();
    ctx.ellipse(e.x, ground - 1, w * (flying ? 0.3 : 0.4), 2 * scale, 0, 0, Math.PI * 2);
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

    const frozen = slowed && e.slowFactor === 0;
    const flashing = this.isFlashing(e.id);
    const variant: SpriteVariant = flashing ? 'white' : slowed ? 'frozen' : 'normal';
    // 얼어붙은 적은 걷지 않는다
    const shown = frozen ? sprites[0] : sprite;
    drawSprite(ctx, shown, left, top, scale, facesLeft(e.x, towerX), variant);
    if (frozen) {
      ctx.strokeStyle = 'rgba(232, 246, 255, 0.8)';
      ctx.strokeRect(left - 1.5, top - 1.5, w + 3, h + 3);
    }
    if (e.stolen > 0) {
      // 훔친 금화 주머니
      drawSprite(ctx, ICONS.coin, Math.round(e.x - 4), top - 10, 1);
    }

    const ratio = Math.max(0, e.hp / e.maxHp);
    if (e.isBoss) {
      const bw = 64;
      bar(ctx, e.x - bw / 2, top - 10, bw, 4, ratio, C.red);
      text(ctx, `${e.def.name} ${formatNumber(Math.max(0, e.hp))}`, e.x, top - 17, '#ffb3b3', 8, 'center');
      const p = e.pattern;
      if (p?.phase === 'windup') {
        // 기 모으기 막대: 차오르면 발동. 끊으려면 이 동안 얼리거나 크게 때린다
        const full = BOSS_PATTERN.windup[p.kind];
        bar(ctx, e.x - bw / 2, top - 5, bw, 3, 1 - p.phaseLeft / full, '#ff9d4d');
        const stagger = Math.min(1, p.staggerDamage / (e.maxHp * BOSS_PATTERN.staggerPct));
        if (stagger > 0) bar(ctx, e.x - bw / 2, top - 1, bw, 2, stagger, '#9fe0ff');
      }
      return;
    }
    if (ratio >= 1) return; // 다치지 않은 적은 체력바를 숨겨 화면을 깔끔하게
    const bw = Math.max(10, Math.round(w * 0.9));
    ctx.fillStyle = C.ink;
    ctx.fillRect(Math.round(e.x - bw / 2) - 1, top - 5, bw + 2, 4);
    ctx.fillStyle = e.isElite ? C.gold : ratio > 0.5 ? C.green : ratio > 0.25 ? C.gold : C.red;
    ctx.fillRect(Math.round(e.x - bw / 2), top - 4, Math.round(bw * ratio), 2);
  }

  /** 보스가 기를 모을 때 무엇이 올지 미리 보여준다 */
  private drawBossTelegraph(e: Enemy): void {
    const p = e.pattern;
    if (!p || (p.phase !== 'windup' && p.phase !== 'dash')) return;
    const { ctx } = this;
    const t = this.lastState!.tower;
    const pulse = 0.5 + 0.5 * Math.sin(this.now * 18);
    ctx.save();
    if (p.kind === 'charge') {
      // 돌진 경로
      ctx.strokeStyle = `rgba(255, 70, 60, ${0.35 + 0.35 * pulse})`;
      ctx.lineWidth = e.radius * 1.4;
      ctx.setLineDash([6, 6]);
      ctx.lineDashOffset = -this.now * 60;
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(t.x, t.y);
      ctx.stroke();
      if (p.phase === 'dash' && Math.random() < 0.8) this.fx.sparkle({ x: e.x + (Math.random() - 0.5) * 20, y: e.y + 8 }, '#8a7a66');
    } else if (p.kind === 'nova') {
      // 탑 둘레로 불길이 모인다
      const k = 1 - p.phaseLeft / BOSS_PATTERN.windup.nova;
      ctx.strokeStyle = `rgba(255, 110, 50, ${0.4 + 0.4 * pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 90 - 55 * k, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgba(255, 80, 30, ${0.08 + 0.12 * k})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 180, 80, ${0.6 * pulse})`;
      ctx.beginPath();
      ctx.moveTo(e.x, e.y - 12);
      ctx.lineTo(t.x, t.y);
      ctx.stroke();
    } else {
      // 소환: 보스 주변 땅이 흔들린다
      ctx.strokeStyle = `rgba(201, 138, 75, ${0.4 + 0.4 * pulse})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.ellipse(e.x, e.y + 8, BOSS_PATTERN.summonSpread + 10, (BOSS_PATTERN.summonSpread + 10) * 0.6, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  /** 메테오 조준 원 */
  private drawAim(p: { x: number; y: number }): void {
    const { ctx } = this;
    ctx.strokeStyle = '#ff6b35';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.lineDashOffset = -this.now * 20;
    ctx.beginPath();
    ctx.arc(p.x, p.y, SKILL.meteorRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(255, 107, 53, 0.12)';
    ctx.fill();
    text(ctx, '클릭: 메테오 · 우클릭/Esc: 취소', p.x, p.y + SKILL.meteorRadius + 8, '#ffb38a', 8, 'center');
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
    this.drawTowerTrim(left, top, 1, state.hero ? findHero(state.hero).color : C.gold);
  }

  /** 탑 꼭대기 깃발과 빛나는 구슬 (고른 탑의 색) */
  private drawTowerTrim(left: number, top: number, scale: number, color: string): void {
    const { ctx } = this;
    const s = TOWER_SPRITE;
    const cx = left + (s.width * scale) / 2;
    const glow = 0.35 + 0.2 * Math.sin(this.now * 3);
    ctx.globalAlpha = glow;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, top + 2 * scale, 5 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // 깃대와 펄럭이는 깃발
    const px = Math.round(cx + 1 * scale);
    const py = Math.round(top - 9 * scale);
    ctx.fillStyle = '#1b1522';
    ctx.fillRect(px, py, scale, 9 * scale);
    const wave = Math.floor(this.now * 4) % 2;
    ctx.fillStyle = color;
    ctx.fillRect(px + scale, py, 6 * scale, 2 * scale);
    ctx.fillRect(px + scale, py + 2 * scale, (5 + wave) * scale, 2 * scale);
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
    this.drawOwned(state, ui);
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
    if (state.goldRushLeft > 0) lines.push([`골드 러시 ×2 · ${Math.ceil(state.goldRushLeft)}초`, C.gold]);
    if (state.perks.length) lines.push([`특전 ${state.perks.map((id) => findPerk(id).name).join(' · ')}`, '#c77dff']);
    const endlessBoss = state.mode === 'endless' ? c.endless.bossEvery - ((state.round - 1) % c.endless.bossEvery) - 1 : -1;
    if (state.mode === 'classic' && state.round < c.totalRounds) {
      lines.push([`이번 라운드 적 ${state.spawnedThisRound}/${enemyCountForRound(c, state.round)}`, C.dim]);
    } else if (endlessBoss >= 0) {
      lines.push([endlessBoss === 0 ? '보스 라운드!' : `다음 보스까지 ${endlessBoss}라운드`, endlessBoss === 0 ? C.red : C.dim]);
    }
    lines.forEach(([s, color], i) => text(this.ctx, s, width - 32, 34 + i * 12, color, 9, 'right'));
  }

  /** 왼쪽: 보유 무기(★·개수, 눌러서 판매)와 세트 진행 */
  private drawOwned(state: GameState, ui: UiState): void {
    const { ctx } = this;
    const groups = ownedGroups(state);
    const counts = weaponCounts(state);
    const setRows = WEAPON_TYPES.filter((type) => counts[type] > 0);
    const slots = state.config.tower.weaponSlots;
    const rows = groups.length + setRows.length;
    const h = rows * OWNED_ROW.h + (setRows.length ? 18 : 14);
    panel(ctx, { x: OWNED_ROW.x, y: OWNED_ROW.y - 9, w: OWNED_ROW.w, h }, '#0f1320cc', '#2a3350', '#0a0d16');
    const full = state.weapons.length >= slots;
    text(ctx, `무기 ${state.weapons.length}/${slots}`, OWNED_ROW.x + 5, OWNED_ROW.y - 3, full ? '#ff9d4d' : C.dim, 8);
    text(ctx, groups.length ? '누르면 판매' : '', OWNED_ROW.x + OWNED_ROW.w - 5, OWNED_ROW.y - 3, '#5a6078', 7, 'right');
    groups.forEach((g, i) => {
      const y = OWNED_ROW.y + i * OWNED_ROW.h + OWNED_ROW.h / 2 + 1;
      const key = `${g.id}:${g.level}`;
      const armed = ui.sellArmed?.key === key && ui.sellArmed.until > this.now;
      if (ui.hoverOwned === i || armed) {
        ctx.fillStyle = armed ? 'rgba(255, 92, 92, 0.25)' : 'rgba(255, 255, 255, 0.07)';
        ctx.fillRect(OWNED_ROW.x + 2, OWNED_ROW.y + i * OWNED_ROW.h + 1, OWNED_ROW.w - 4, OWNED_ROW.h);
      }
      drawSprite(ctx, ICONS[g.type], OWNED_ROW.x + 5, y - 4, 1);
      text(ctx, `${g.name}${g.count > 1 ? ` ×${g.count}` : ''}`, OWNED_ROW.x + 17, y, TYPE_INFO[g.type].color, 9);
      if (g.level > 1) text(ctx, '★'.repeat(g.level), OWNED_ROW.x + 110, y, C.gold, 8);
      if (armed) text(ctx, `판매 +${sellPrice(state.weapons[g.indices[0]])}G?`, OWNED_ROW.x + OWNED_ROW.w - 5, y, '#ff8a8a', 8, 'right');
    });
    if (!setRows.length) return;
    let y = OWNED_ROW.y + groups.length * OWNED_ROW.h + 4;
    ctx.fillStyle = '#2a3350';
    ctx.fillRect(OWNED_ROW.x + 5, y - 2, OWNED_ROW.w - 10, 1);
    y += 5;
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
      text(ctx, '★'.repeat(tier) + '☆'.repeat(2 - tier), OWNED_ROW.x + 5, y, C.gold, 8);
      text(ctx, `${TYPE_INFO[type].label} ${next}`, OWNED_ROW.x + 30, y, TYPE_INFO[type].color, 8);
      ctx.globalAlpha = 1;
      y += OWNED_ROW.h;
    }
  }

  // ───────── 스킬 바 ─────────

  private drawSkills(state: GameState, ui: UiState): void {
    const { ctx, layout } = this;
    const icons: Record<string, keyof typeof ICONS> = { meteor: 'meteor', blizzard: 'snow', repair: 'hammer', gold_rush: 'coin' };
    SKILLS.forEach((skill, i) => {
      const r = layout.skills[i];
      const unlocked = skillUnlocked(state, skill.id);
      const cd = skillCooldownLeft(state, skill.id);
      const ready = unlocked && cd <= 0;
      const hover = ui.hoverSkill === i;
      const aimingThis = ui.aiming && skill.id === 'meteor';
      button(ctx, r, '', !unlocked ? 'disabled' : aimingThis ? 'selected' : hover ? 'hover' : 'normal', '#ff6b35');
      if (unlocked) {
        drawSprite(ctx, ICONS[icons[skill.id]], r.x + 6, r.y + 5, 2, false);
        if (cd > 0) {
          // 남은 시간만큼 위에서부터 어둡게
          const frac = cd / (skill.cooldown * (state.perks.includes('skill_master') ? 0.7 : 1) * state.skillCooldownMul);
          ctx.fillStyle = 'rgba(6, 8, 13, 0.7)';
          ctx.fillRect(r.x + 2, r.y + 2, r.w - 4, (r.h - 4) * Math.min(1, frac));
          text(ctx, `${Math.ceil(cd)}`, r.x + r.w / 2, r.y + r.h / 2, '#ffffff', 11, 'center', true);
        } else if (Math.floor(this.now * 2) % 2 === 0) {
          ctx.strokeStyle = 'rgba(255, 215, 94, 0.5)';
          ctx.strokeRect(r.x + 1.5, r.y + 1.5, r.w - 3, r.h - 3);
        }
      } else {
        text(ctx, `R${skill.unlockRound}`, r.x + r.w / 2, r.y + r.h / 2, '#5a6078', 9, 'center');
      }
      text(ctx, skill.key, r.x + 4, r.y + r.h - 5, ready ? C.gold : '#5a6078', 7);
    });
    const hovered = typeof ui.hoverSkill === 'number' ? SKILLS[ui.hoverSkill] : undefined;
    if (hovered) {
      const skill = hovered;
      const unlocked = skillUnlocked(state, skill.id);
      const r0 = layout.skills[0];
      const w = 200;
      const box = { x: layout.width / 2 - w / 2, y: r0.y - 34, w, h: 28 };
      panel(ctx, box, '#141a29f2');
      text(ctx, `${skill.name} [${skill.key}] · ${skill.cooldown}초`, box.x + 6, box.y + 8, C.gold, 9);
      text(ctx, unlocked ? skill.desc : `${skill.unlockRound}라운드에 열림`, box.x + 6, box.y + 20, C.text, 8);
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
    const price = priceOf(state, item);
    const check = canBuy(state, index);
    const affordable = state.gold >= price;
    const noSlot = !check.ok && check.reason === 'slots';
    const merges = mergesOnBuy(state, item);
    const legendary = LEGENDARY.has(item.id);
    panel(ctx, box, legendary ? '#2a2414' : hover ? '#232b42' : '#1a2032', legendary ? C.gold : hover ? color : C.panelHi);
    if (legendary && Math.random() < 0.08) this.fx.sparkle({ x: r.x + Math.random() * r.w, y: r.y + Math.random() * r.h }, C.gold);
    ctx.globalAlpha = affordable && !noSlot ? 1 : 0.45;
    // 계열 색 띠 + 아이콘
    ctx.fillStyle = color;
    ctx.fillRect(box.x + 2, box.y + 2, box.w - 4, 2);
    drawSprite(ctx, ICONS[item.kind === 'weapon' ? item.type : 'upgrade'], box.x + 4, box.y + 7, 1);
    text(ctx, `${index + 1}`, box.x + 16, box.y + 11, C.dim, 8);
    text(ctx, item.kind === 'weapon' ? TYPE_INFO[item.type].label : '강화', box.x + 24, box.y + 11, color, 8);
    const blink = Math.floor(this.now * 3) % 2 === 0;
    if (item.kind === 'weapon') {
      if (merges) {
        text(ctx, '합성 ★2!', box.x + 52, box.y + 11, blink ? '#ffffff' : C.gold, 8);
      } else if (noSlot) {
        text(ctx, '칸 부족', box.x + 52, box.y + 11, '#ff7070', 8);
      } else {
        const after = counts[item.type] + 1;
        const reaches = state.config.sets.thresholds.includes(after);
        text(ctx, reaches ? `세트 ${after}개!` : `세트 ${after}`, box.x + 52, box.y + 11, reaches ? (blink ? '#ffffff' : C.gold) : C.dim, 8);
      }
    }
    drawSprite(ctx, ICONS.coin, box.x + box.w - 30, box.y + 7, 1);
    text(ctx, `${price}`, box.x + box.w - 5, box.y + 11, affordable ? (price < item.price ? '#8fd16a' : C.gold) : '#ff7070', 9, 'right');

    text(ctx, item.name, box.x + 5, box.y + 24, legendary ? C.gold : '#ffffff', 12, 'left', true);
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

  // ───────── 첫 판 안내 ─────────

  private drawHint(state: GameState, progress: TutorialProgress): void {
    const hint = tutorialHint(state, progress);
    if (!hint) return;
    const { ctx, layout } = this;
    const w = 300;
    const box = { x: layout.width / 2 - w / 2, y: layout.skills[0].y - 38, w, h: 30 };
    const pulse = 0.6 + 0.4 * Math.sin(this.now * 4);
    ctx.globalAlpha = 0.95;
    panel(ctx, box, '#141a29', C.gold);
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = C.gold;
    ctx.strokeRect(box.x - 1.5, box.y - 1.5, box.w + 3, box.h + 3);
    ctx.globalAlpha = 1;
    text(ctx, hint.title, box.x + box.w / 2, box.y + 10, C.gold, 10, 'center', true);
    text(ctx, hint.text, box.x + box.w / 2, box.y + 22, C.text, 8, 'center');
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
        text(ctx, b.title, cx + (1 - slide) * -layout.width, y - 3, b.color, 18, 'center', true);
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

  /** 보상 카드 3장 중 1장 고르기 (게임은 멈춰 있다) */
  private overlayChoice(state: GameState, ui: UiState): void {
    const { ctx, layout } = this;
    ctx.fillStyle = 'rgba(6, 8, 13, 0.7)';
    ctx.fillRect(0, 0, layout.width, layout.fieldHeight);
    text(ctx, `${state.round}라운드 보상 · 하나 고르기`, layout.width / 2, layout.perkCards[0].y - 22, C.gold, 14, 'center', true);
    text(ctx, '클릭하거나 1 · 2 · 3', layout.width / 2, layout.perkCards[0].y - 8, C.dim, 9, 'center');
    const since = this.now - this.choiceAt(state);
    state.choice!.forEach((id, i) => {
      const perk = findPerk(id);
      const r = layout.perkCards[i];
      const appear = easeOutBack(Math.min(1, Math.max(0, (since - i * 0.08) / 0.3)));
      if (appear <= 0) return;
      const hover = ui.hoverChoice === i;
      ctx.save();
      ctx.translate(r.x + r.w / 2, r.y + r.h / 2 + (hover ? -4 : 0));
      ctx.scale(appear, appear);
      const box = { x: -r.w / 2, y: -r.h / 2, w: r.w, h: r.h };
      panel(ctx, box, hover ? '#2a2140' : '#1c1830', hover ? '#e0b0ff' : '#7a5cc0');
      ctx.fillStyle = '#c77dff';
      ctx.fillRect(box.x + 2, box.y + 2, box.w - 4, 3);
      drawSprite(ctx, ICONS.upgrade, -9, box.y + 14, 2);
      text(ctx, `${i + 1}`, box.x + 8, box.y + 12, C.dim, 9);
      text(ctx, perk.name, 0, box.y + 48, '#ffffff', 14, 'center', true);
      ctx.font = `9px ${FONT}`;
      let line = '';
      let y = box.y + 70;
      for (const ch of perk.desc) {
        if (ctx.measureText(line + ch).width > box.w - 18 && line) {
          text(ctx, line, 0, y, C.text, 9, 'center');
          y += 13;
          line = ch.trimStart();
        } else line += ch;
      }
      if (line) text(ctx, line, 0, y, C.text, 9, 'center');
      ctx.restore();
    });
  }

  private choiceShownFor: string[] | null = null;
  private choiceShownAt = 0;
  private choiceAt(state: GameState): number {
    if (this.choiceShownFor !== state.choice) {
      this.choiceShownFor = state.choice;
      this.choiceShownAt = this.now;
    }
    return this.choiceShownAt;
  }

  private overlayPause(): void {
    this.dim(0.6);
    const { width, height } = this.layout;
    panel(this.ctx, { x: width / 2 - 110, y: height / 2 - 40, w: 220, h: 64 });
    text(this.ctx, 'Ⅱ 일시정지', width / 2, height / 2 - 18, C.gold, 18, 'center', true);
    text(this.ctx, 'Space 또는 정지 버튼으로 계속', width / 2, height / 2 + 6, C.text, 10, 'center');
  }

  /** 잠긴 탑 카드를 눌렀을 때 흔들기 */
  private deniedHero: { id: HeroId; at: number } | null = null;
  onDenyHero(id: HeroId): void {
    this.deniedHero = { id, at: this.now };
  }

  /** 강화를 샀을 때 그 칸이 반짝 */
  private boughtMeta: { index: number; at: number } | null = null;
  onMetaBought(index: number): void {
    this.boughtMeta = { index, at: this.now };
    const r = this.layout.metaCards[index];
    this.overlayFx.ring({ x: r.x + r.w / 2, y: r.y + r.h / 2 }, 60, C.gold, 0.4);
  }

  private overlayStart(ui: UiState): void {
    const { ctx, layout } = this;
    const { width, fieldHeight } = layout;
    this.dim(0.55);

    // 적 행렬이 아래쪽을 지나간다
    const parade = ['goblin', 'wolf', 'slime', 'orc', 'bat', 'golem', 'thief', 'shield', 'boss_rhino'];
    parade.forEach((id, i) => {
      const frames = ENEMY_SPRITES[id];
      const f = frames[walkFrame(this.now, i, frames.length, 6)];
      const x = ((this.now * 28 + i * 78) % (width + 120)) - 60;
      drawSprite(ctx, f, x, fieldHeight - 22 - f.height, 1, false);
    });

    text(ctx, '탑 수호자', 16, 22, C.gold, 22, 'left', true);
    this.drawShards(ui.meta.shards);

    // 탑 고르기
    for (const { id, rect } of layout.heroes) this.drawHeroCard(ui, id, rect);
    const hero = findHero(ui.hero);
    const weapon = findItem(hero.startWeapons[0]).name;
    text(ctx, `"${hero.quote}"`, width / 2, 156, hero.color, 10, 'center');
    text(ctx, `${hero.name} · 시작 무기 ${weapon} · ${hero.desc}`, width / 2, 170, C.dim, 8, 'center');

    // 모드 탭
    for (const { id, rect } of layout.modes) {
      const sel = ui.mode === id;
      button(ctx, rect, '', sel ? 'selected' : ui.hoverStart === `mode:${id}` ? 'hover' : 'normal');
      text(ctx, id === 'classic' ? '클래식' : '무한', rect.x + rect.w / 2, rect.y + 9, sel ? C.gold : C.text, 11, 'center', true);
      text(ctx, id === 'classic' ? '15라운드 보스를 잡으면 끝' : '15라운드마다 보스', rect.x + rect.w / 2, rect.y + 19, C.dim, 7, 'center');
    }

    // 난이도 카드 (기록 포함)
    layout.difficulty.forEach(({ id, rect }, i) => {
      const d = DIFFICULTIES[i];
      const sel = ui.difficulty === id;
      const r = { ...rect, y: rect.y + (sel ? -2 : 0) };
      button(ctx, r, '', sel ? 'selected' : 'normal');
      text(ctx, `${i + 1}. ${d.name}`, r.x + r.w / 2, r.y + 10, sel ? C.gold : '#ffffff', 12, 'center', true);
      text(ctx, d.desc, r.x + r.w / 2, r.y + 22, C.dim, 8, 'center');
      let record: string;
      let good = false;
      if (ui.mode === 'endless') {
        const rec = ui.endless[id];
        record = rec.plays === 0 ? '-' : `최고 ${rec.bestRound}R · 처치 ${formatNumber(rec.bestKills)}`;
        good = rec.bestRound >= 15;
      } else {
        const rec = ui.records[id];
        record = rec.plays === 0 ? '-' : `최고 ${rec.bestRound}R · 승 ${rec.wins}${rec.fastestWin !== null ? ` · ${formatTime(rec.fastestWin)}` : ''}`;
        good = rec.wins > 0;
      }
      text(ctx, record, r.x + r.w / 2, r.y + 34, good ? C.gold : C.text, 8, 'center');
    });

    // 강화 상점 · 업적
    const buyable = META_UPGRADES.some((u) => {
      const c = nextCost(ui.meta, u.id);
      return c !== null && c <= ui.meta.shards;
    });
    const mb = layout.metaButton;
    button(ctx, mb, '', ui.hoverStart === 'meta' ? 'hover' : 'normal');
    text(ctx, '강화 상점 [S]', mb.x + mb.w / 2, mb.y + mb.h / 2 + 1, buyable ? C.gold : C.text, 10, 'center', true);
    if (buyable && Math.floor(this.now * 2) % 2 === 0) {
      ctx.fillStyle = C.red;
      ctx.fillRect(mb.x + mb.w - 9, mb.y + 4, 5, 5);
    }
    const ab = layout.achButton;
    button(ctx, ab, '', ui.hoverStart === 'achievements' ? 'hover' : 'normal');
    text(ctx, `업적 ${ui.meta.achievements.length}/${ACHIEVEMENTS.length} [A]`, ab.x + ab.w / 2, ab.y + ab.h / 2 + 1, C.text, 10, 'center', true);

    const blink = Math.floor(this.now * 2) % 2 === 0;
    text(ctx, '클릭 또는 Enter 로 시작 · ←→ 탑 · ↑↓ 난이도 · Tab 모드', width / 2, fieldHeight - 8, blink ? C.gold : C.dim, 9, 'center');
    text(ctx, '1~4 구매  R 리롤  Q W E D 스킬  Space 정지  F 배속  M 소리', width / 2, fieldHeight + 30, C.text, 10, 'center');
    if (!ui.meta.tutorialDone) text(ctx, '첫 판은 화면 위에 짧은 안내가 나와요', width / 2, fieldHeight + 50, C.dim, 9, 'center');
    else text(ctx, `지금까지 ${ui.meta.runs}판`, width / 2, fieldHeight + 50, C.dim, 9, 'center');
  }

  /** 오른쪽 위 별조각 */
  private drawShards(n: number): void {
    const { ctx, layout } = this;
    text(ctx, `✦ 별조각 ${n}`, layout.width - 16, 18, '#9fe0ff', 11, 'right', true);
  }

  private drawHeroCard(ui: UiState, id: HeroId, rect: Rect): void {
    const { ctx } = this;
    const hero = findHero(id);
    const unlocked = heroUnlocked(ui.meta, id);
    const sel = ui.hero === id;
    const hover = ui.hoverStart === `hero:${id}`;
    const denied = this.deniedHero?.id === id ? this.now - this.deniedHero.at : Infinity;
    const dx = denied < 0.3 ? Math.sin(denied * 60) * 3 * (1 - denied / 0.3) : 0;
    const r = { ...rect, x: rect.x + dx, y: rect.y + (sel ? -3 : hover ? -1 : 0) };
    panel(ctx, r, sel ? '#2a2616' : '#1a2032', sel ? hero.color : hover ? C.text : C.panelHi);
    const s = TOWER_SPRITE;
    const scale = 1;
    const left = Math.round(r.x + r.w / 2 - (s.width * scale) / 2);
    const top = Math.round(r.y + 14);
    ctx.globalAlpha = unlocked ? 1 : 0.3;
    drawSprite(ctx, s, left, top, scale, false, 'normal');
    this.drawTowerTrim(left, top, scale, unlocked ? hero.color : '#5a6078');
    ctx.globalAlpha = 1;
    text(ctx, hero.name, r.x + r.w / 2, r.y + 66, unlocked ? (sel ? hero.color : '#ffffff') : '#5a6078', 11, 'center', true);
    if (!unlocked) {
      const cost = nextCost(ui.meta, `hero_${id}`);
      text(ctx, '잠김', r.x + r.w / 2, r.y + 79, '#8a94a8', 8, 'center');
      text(ctx, `별조각 ${cost}`, r.x + r.w / 2, r.y + 89, C.gold, 8, 'center');
      return;
    }
    const wins = ui.meta.heroWins.includes(id);
    text(ctx, findItem(hero.startWeapons[0]).name, r.x + r.w / 2, r.y + 79, C.dim, 8, 'center');
    if (wins) text(ctx, '승리 ✓', r.x + r.w / 2, r.y + 89, C.gold, 8, 'center');
  }

  private overlayMeta(ui: UiState): void {
    const { ctx, layout } = this;
    this.dim(0.8);
    text(ctx, '강화 상점', 16, 20, C.gold, 18, 'left', true);
    text(ctx, '판이 끝날 때마다 별조각이 쌓인다. 강화는 모든 판에 계속 적용', 120, 21, C.dim, 8);
    this.drawShards(ui.meta.shards);
    META_UPGRADES.forEach((u, i) => {
      const r = layout.metaCards[i];
      const lv = metaLevel(ui.meta, u.id);
      const cost = nextCost(ui.meta, u.id);
      const maxed = cost === null;
      const affordable = cost !== null && cost <= ui.meta.shards;
      const hover = ui.hoverMeta === i;
      const color =
        u.kind === 'hero' ? findHero(u.id.slice(5) as HeroId).color : u.kind === 'weapon' ? TYPE_INFO[(findItem(u.id.slice(7)) as { type: WeaponType }).type].color : C.gold;
      const flash = this.boughtMeta?.index === i ? Math.max(0, 1 - (this.now - this.boughtMeta.at) / 0.4) : 0;
      panel(ctx, { ...r, y: r.y - (hover && !maxed ? 1 : 0) }, maxed ? '#1d2418' : hover ? '#232b42' : '#1a2032', maxed ? '#4f7a3a' : hover ? color : C.panelHi);
      if (flash > 0) {
        ctx.globalAlpha = flash * 0.5;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = color;
      ctx.fillRect(r.x + 2, r.y + 2, 3, r.h - 4);
      const tag = u.kind === 'hero' ? '탑' : u.kind === 'weapon' ? '전설 무기' : '강화';
      text(ctx, tag, r.x + 10, r.y + 10, color, 8);
      text(ctx, u.name, r.x + 10, r.y + 24, '#ffffff', 12, 'left', true);
      text(ctx, u.desc, r.x + 10, r.y + 38, C.text, 8);
      // 단계 칸
      for (let k = 0; k < u.costs.length; k++) {
        ctx.fillStyle = k < lv ? C.gold : '#2a3350';
        ctx.fillRect(r.x + 10 + k * 9, r.y + 47, 7, 5);
      }
      if (maxed) text(ctx, u.kind === 'stat' ? '최고 단계' : '해금됨', r.x + r.w - 8, r.y + 50, '#8fd16a', 9, 'right');
      else text(ctx, `${cost}`, r.x + r.w - 8, r.y + 50, affordable ? C.gold : '#ff7070', 11, 'right', true);
    });
    const b = layout.back;
    button(ctx, b, '돌아가기 [Esc]', ui.hoverStart === 'back' ? 'hover' : 'normal');
    this.overlayFx.draw(ctx, layout.width, layout.height);
  }

  private overlayAchievements(ui: UiState): void {
    const { ctx, layout } = this;
    this.dim(0.8);
    const got = new Set(ui.meta.achievements);
    text(ctx, `업적 ${got.size}/${ACHIEVEMENTS.length}`, 16, 20, C.gold, 18, 'left', true);
    text(ctx, '처음 달성하면 별조각을 준다', 130, 21, C.dim, 8);
    ACHIEVEMENTS.forEach((a, i) => {
      const r = layout.achRows[i];
      const done = got.has(a.id);
      panel(ctx, r, done ? '#2a2616' : '#161b2a', done ? C.gold : C.panelHi);
      ctx.fillStyle = done ? C.gold : '#2a3350';
      ctx.fillRect(r.x + 7, r.y + 11, 12, 12);
      if (done) text(ctx, '✓', r.x + 13, r.y + 17.5, '#1b1522', 10, 'center', true);
      text(ctx, a.name, r.x + 26, r.y + 11, done ? C.gold : '#ffffff', 10, 'left', true);
      text(ctx, a.desc, r.x + 26, r.y + 24, done ? C.text : C.dim, 8);
      text(ctx, done ? '받음' : `+${a.reward}`, r.x + r.w - 8, r.y + 17, done ? '#8fd16a' : C.gold, 9, 'right');
    });
    button(ctx, layout.back, '돌아가기 [Esc]', ui.hoverStart === 'back' ? 'hover' : 'normal');
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

    const w = 380;
    const rows = topDamage(state.damageByWeapon, 5);
    const reward = ui.reward;
    const newAch = reward?.achieved ?? [];
    const h = 150 + rows.length * 14 + (ui.newBest ? 16 : 0) + (reward ? 18 : 0) + newAch.length * 13;
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
    const title = won ? '탑을 지켰다' : endless ? `${state.round}라운드까지 버텼다` : '탑이 무너졌다';
    text(ctx, title, cx, y + 20, won ? C.gold : endless ? '#6fb7ff' : C.red, 18, 'center', true);
    const hero = state.hero ? findHero(state.hero) : null;
    if (hero) text(ctx, `${hero.name}: "${won ? hero.winLine : hero.loseLine}"`, cx, y + 38, hero.color, 9, 'center');
    const d = findDifficulty(state.difficulty).name;
    text(ctx, `${d}${endless ? ' · 무한' : ''} · ${state.round}라운드 · ${formatTime(state.time)} · 처치 ${state.kills}`, cx, y + 54, C.text, 10, 'center');
    text(ctx, `무기 ${state.weapons.length}개 · 남은 골드 ${Math.floor(state.gold)}`, cx, y + 67, C.dim, 9, 'center');

    let yy = y + 86;
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
      text(ctx, '새 기록', 0, 0, C.gold, 12, 'center', true);
      ctx.restore();
    }
    if (reward) {
      yy += ui.newBest ? 32 : 16;
      const bonus = newAch.reduce((sum, a) => sum + a.reward, 0);
      text(ctx, `✦ 별조각 +${reward.shards}${bonus ? ` · 업적 +${bonus}` : ''}  (모은 별조각 ${reward.meta.shards})`, cx, yy, '#9fe0ff', 9, 'center');
      for (const a of newAch) {
        yy += 13;
        text(ctx, `업적 달성: ${a.name} (${a.desc})`, cx, yy, '#ffe8a3', 9, 'center');
      }
    }
    const blink = Math.floor(this.now * 2) % 2 === 0;
    text(ctx, '클릭 또는 Enter', cx, y + h - 12, blink ? C.gold : C.dim, 10, 'center');
    ctx.restore();
  }
}

