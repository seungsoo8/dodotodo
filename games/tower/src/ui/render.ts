import { DIFFICULTIES, findDifficulty, type DifficultyId, type GameMode } from '../core/config.ts';
import { canBuy, enemyCountForRound, incomePerSecond, mergesOnBuy, priceOf, rerollCost, sellPrice, type GameState } from '../core/game.ts';
import { findPerk } from '../core/perks.ts';
import {
  BASE_SKILLS,
  COMBOS,
  SKILL,
  TAG_INFO,
  comboReady,
  evolveCheck,
  evolveCost,
  findSkill,
  fuseCheck,
  learnCheck,
  ownedSkill,
  skillCooldownLeft,
  skillName,
} from '../core/skills.ts';
import { BOSS_PATTERN, LEGENDARY_WEAPONS, findEnemy, findItem } from '../core/data.ts';
import { ACHIEVEMENTS } from '../core/achievements.ts';
import { HEROES, findHero, type HeroId } from '../core/heroes.ts';
import { META_UPGRADES, heroUnlocked, metaLevel, nextCost, type MetaState } from '../core/meta.ts';
import type { RunReward } from '../core/progress.ts';
import { tutorialHint, type TutorialProgress } from './tutorial.ts';
import { createRng } from '../core/rng.ts';
import { SET_SPECIALS, WEAPON_TYPES, effectiveWeapon, setTier, weaponCounts } from '../core/sets.ts';
import type { Enemy, GameEvent, ItemDef, WeaponType } from '../core/types.ts';
import { Effects } from './effects.ts';
import { easeOutBack, easeOutCubic, formatNumber, skyAt, vignetteAlpha } from './fx.ts';
import { World } from './world.ts';
import { C, FONT, TYPE_INFO, bar, button, drawSprite, panel, spriteImage, text, type SpriteVariant } from './kit.ts';
import type { Layout, Rect, TreeHit } from './layout.ts';
import type { EndlessRecords, Records } from './records.ts';
import { OWNED, ownedGroups, ownedTileCount, setChipRect, tileRect, tileRows } from './owned.ts';
import { ENEMY_SPRITES, ICONS, SKILL_ICONS, TOWER_SPRITE, WEAPON_ICONS, facesLeft, walkFrame } from './sprites.ts';
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
  hoverButton: 'reroll' | 'speed' | 'pause' | 'mute' | 'skill' | 'tree' | null;
  hoverSkill: number | null;
  hoverOwned: number | null;
  /** 마우스가 올라간 세트 칩 */
  hoverChip: number | null;
  hoverChoice: number | null;
  /** 떨어뜨릴 곳을 고르는 중인 스킬 id (없으면 null) */
  aiming: string | null;
  /** 스킬 트리를 여는 중 (게임이 멈춘다) */
  treeOpen: boolean;
  hoverTree: TreeHit | null;
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

/** 보상 카드 모양: 아이콘 · 색 · 분류 */
const PERK_LOOK: Record<string, { icon: string; color: string; tag: string }> = {
  rapid_fire: { icon: 'normal', color: '#ff9d4d', tag: '공격' },
  sharpen: { icon: 'normal', color: '#ff9d4d', tag: '공격' },
  multishot: { icon: 'pierce', color: '#ff9d4d', tag: '공격' },
  giant_slayer: { icon: 'normal', color: '#ff9d4d', tag: '공격' },
  lucky: { icon: 'chaos', color: '#ff9d4d', tag: '공격' },
  corpse_blast: { icon: 'siege', color: '#ff9d4d', tag: '공격' },
  big_splash: { icon: 'siege', color: '#ff9d4d', tag: '공격' },
  conductor: { icon: 'magic', color: '#6fb7ff', tag: '마법' },
  skill_master: { icon: 'meteor', color: '#6fb7ff', tag: '마법' },
  frost_aura: { icon: 'snow', color: '#6fb7ff', tag: '마법' },
  vampiric: { icon: 'heart', color: '#6fdc6f', tag: '방어' },
  fortress: { icon: 'hammer', color: '#6fdc6f', tag: '방어' },
  interest: { icon: 'coin', color: C.gold, tag: '돈' },
  bounty_hunter: { icon: 'coin', color: C.gold, tag: '돈' },
  discount: { icon: 'coin', color: C.gold, tag: '돈' },
  free_reroll: { icon: 'upgrade', color: C.gold, tag: '돈' },
  gold_pouch: { icon: 'coin', color: C.gold, tag: '돈' },
};

/** 영구 강화 아이콘 */
const META_ICONS: Record<string, string> = { start_gold: 'coin', max_hp: 'heart', power: 'normal', income: 'coin', skill_cd: 'meteor' };

/** 시작 화면에 돌아가며 보여 주는 팁 */
const TIPS = [
  '같은 무기 3개를 모으면 ★2 로 합쳐진다',
  '보스가 기를 모을 때 눈보라(W)로 얼리면 기술이 끊긴다',
  '박쥐는 날아다녀서 공성 무기에 맞지 않는다',
  '방패병은 일반·관통 피해를 절반만 받는다',
  '도둑 고블린을 잡으면 훔친 골드를 되찾는다',
  '같은 계열 무기를 3개, 6개 모으면 세트 효과가 붙는다',
  '라운드가 지날수록 해가 지고, 마지막 라운드는 밤이다',
  '3라운드마다 스킬 포인트가 생긴다 (정예를 잡아도) · T 로 스킬 트리를 연다',
  '얼음 스킬 다음에 불 스킬을 쓰면 빙쇄 콤보가 터진다',
  '두 스킬을 합체하면 칸이 하나 빈다',
];

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
  private world: World;
  /** 적 id → 처음 본 시각 (등장 연출) */
  private firstSeen = new Map<number, number>();
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
    this.world = new World(layout.width, layout.fieldHeight);
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
      // 새 판은 적 번호가 1 부터 다시 시작하니 지난 판 기록을 지운다
      this.firstSeen.clear();
      this.hitAt.clear();
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
          this.banner({
            style: 'round',
            title: `${ev.round} 라운드`,
            sub: state.mode === 'classic' && ev.round === state.config.totalRounds ? '마지막 라운드' : `적 ${enemyCountForRound(state.config, ev.round)}마리`,
            color: C.gold,
            life: 1.8,
          });
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
          this.skillFx(ev, state);
          break;
        case 'combo': {
          const combo = COMBOS.find((c) => c.id === ev.id)!;
          this.fx.combo({ x: t.x, y: t.y }, combo.name, TAG_INFO[combo.to].color);
          break;
        }
        case 'skillPoint': {
          const b = this.layout.treeButton;
          this.fx.floatText({ x: b.x + b.w / 2, y: b.y - 6 }, '+1 스킬 포인트', '#9fe0ff', 9, 1.4);
          this.fx.ring({ x: b.x + b.w / 2, y: b.y + b.h / 2 }, 30, '#9fe0ff', 0.5);
          break;
        }
        case 'learn': {
          const k = findSkill(ev.id);
          this.banner({ style: 'perk', title: `새 스킬: ${k.name}`, sub: k.desc, color: TAG_INFO[k.tags[0]].color, life: 2 });
          break;
        }
        case 'evolve': {
          const k = findSkill(ev.id);
          this.banner({ style: 'merge', title: `${k.name} → ${k.evolve!.name}`, sub: k.evolve!.desc, color: C.gold, life: 2.2 });
          this.fx.mergeBurst({ x: t.x, y: t.y - 10 }, 2);
          break;
        }
        case 'fuse': {
          const k = findSkill(ev.id);
          this.banner({
            style: 'merge',
            title: `${findSkill(ev.from[0]).name} + ${findSkill(ev.from[1]).name} = ${k.name}`,
            sub: k.desc,
            color: C.gold,
            life: 2.6,
          });
          this.fx.mergeBurst({ x: t.x, y: t.y - 10 }, 3);
          for (const tag of k.tags) this.fx.ring({ x: t.x, y: t.y }, 110, TAG_INFO[tag].color, 0.8);
          break;
        }
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
    if (ui.started && ui.aiming && ui.pointer) this.drawAim(ui.pointer, ui.aiming);
    ctx.restore();

    if (ui.started) this.drawVignette(state);
    if (ui.started) this.drawHud(state, ui);
    if (ui.started) this.drawShop(state, ui);
    else panel(ctx, { x: -2, y: layout.fieldHeight, w: layout.width + 4, h: layout.height - layout.fieldHeight + 2 }, '#10141f');
    if (ui.started) this.drawSkills(state, ui);
    if (ui.started && !ui.treeOpen) this.drawBanners();
    if (ui.started && ui.tutorial && state.status === 'playing' && !state.choice && !ui.paused && ui.hoverSkill === null) this.drawHint(state, ui.tutorial);

    const scene = `${ui.started}:${ui.screen}`;
    if (scene !== this.scene) {
      this.scene = scene;
      this.sceneAt = time;
    }
    if (!ui.started) {
      if (ui.screen === 'meta') this.overlayMeta(ui);
      else if (ui.screen === 'achievements') this.overlayAchievements(ui);
      else this.overlayStart(ui);
    }
    else if (state.status !== 'playing') this.overlayEnd(state, ui);
    else if (state.choice) this.overlayChoice(state, ui);
    else if (ui.treeOpen) this.overlayTree(state, ui);
    else if (ui.paused) this.overlayPause();
    const fade = 1 - (time - this.sceneAt) / 0.35;
    if (fade > 0) {
      ctx.fillStyle = `rgba(6, 8, 13, ${fade})`;
      ctx.fillRect(0, 0, layout.width, layout.height);
    }
    ctx.restore();
  }

  private scene = '';
  private sceneAt = -1;

  private tween(state: GameState, dt: number): void {
    this.shownGold += (state.gold - this.shownGold) * Math.min(1, dt * 12);
    const ratio = Math.max(0, state.tower.hp / state.tower.maxHp);
    if (ratio >= this.ghostHp) this.ghostHp = ratio;
    else if (this.now > this.ghostHoldUntil) this.ghostHp = Math.max(ratio, this.ghostHp - dt * 0.8);
  }

  private drawField(state: GameState, ui: UiState, dt: number): void {
    const { ctx } = this;
    this.world.drawGround(ctx, this.now);
    const t = state.tower;

    if (ui.started && state.weapons.length > 0) {
      const counts = weaponCounts(state);
      const maxRange = Math.max(...state.weapons.map((w) => effectiveWeapon(state, w.def, counts).range));
      ctx.strokeStyle = 'rgba(255, 244, 208, 0.16)';
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
    for (const e of state.enemies) {
      if (this.firstSeen.has(e.id)) continue;
      this.firstSeen.set(e.id, this.now);
      // 땅에서 흙먼지를 일으키며 나타난다
      for (let k = 0; k < 4; k++) this.fx.sparkle({ x: e.x + (Math.random() - 0.5) * 12, y: e.y + 4 }, '#8a7a66');
    }
    if (this.firstSeen.size > 600) {
      const alive = new Set(state.enemies.map((e) => e.id));
      for (const id of this.firstSeen.keys()) if (!alive.has(id)) this.firstSeen.delete(id);
    }
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
      this.drawEnemy(e, state, dt);
    }
    if (!towerDrawn && ui.started) this.drawTower(state);

    // 낮 → 노을 → 밤. 체력바·이름은 어두워지지 않게 그 뒤에
    const c = state.config;
    const sky = ui.started
      ? skyAt({ round: state.round, roundTime: state.roundTime, roundSeconds: c.roundSeconds, totalRounds: c.totalRounds, mode: state.mode })
      : { night: 0, dusk: 0 };
    this.world.drawSky(ctx, sky, { tower: { x: t.x, y: t.y - 4 }, boss: ui.started && state.enemies.some((e) => e.isBoss), now: this.now });
    for (const e of ordered) this.drawEnemyOverlay(e);
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

  /** 적의 그림 위치·크기 (등장·피격·걸음·공격 동작 반영) */
  private enemyPose(e: Enemy, state?: GameState): { left: number; top: number; w: number; h: number; sx: number; sy: number; scale: number } {
    const sprites = ENEMY_SPRITES[e.def.id];
    const base = sprites[0];
    const scale = e.isElite ? 1.5 : 1;
    const w = base.width * scale;
    const h = base.height * scale;
    const flying = e.def.ability === 'flying';
    const lift = flying ? FLY_HEIGHT + Math.sin(this.now * 8 + e.id) * 2 : 0;
    const slowed = e.slowTimeLeft > 0;
    const frozen = slowed && e.slowFactor === 0;
    // 걸을 때 한 칸씩 통통 튄다
    const bob = !flying && !frozen && walkFrame(this.now, e.id, 2, slowed ? 3 : 6) === 1 ? -1 : 0;
    // 공격하는 순간 탑 쪽으로 몸을 던진다
    let lx = 0;
    let ly = 0;
    if (state && e.def.atk > 0 && !frozen) {
      const since = e.def.atkInterval - e.attackCooldown;
      const t = state.tower;
      const d = Math.hypot(e.x - t.x, e.y - t.y) || 1;
      if (since >= 0 && since < 0.18 && d <= t.radius + e.radius + 1) {
        const k = Math.sin((since / 0.18) * Math.PI) * 4;
        lx = ((t.x - e.x) / d) * k;
        ly = ((t.y - e.y) / d) * k;
      }
    }
    // 등장: 튕기며 커진다 / 피격: 잠깐 납작해진다
    const born = this.firstSeen.get(e.id) ?? -Infinity;
    const grow = easeOutBack(Math.min(1, (this.now - born) / 0.3));
    const hit = this.hitAt.get(e.id);
    const squash = hit !== undefined && this.now >= hit && this.now - hit < 0.09 ? 1 : 0;
    return {
      left: Math.round(e.x - w / 2 + lx),
      top: Math.round(e.y - h / 2 - lift + bob + ly),
      w,
      h,
      sx: grow * (1 + 0.2 * squash),
      sy: grow * (1 - 0.2 * squash),
      scale,
    };
  }

  private drawEnemy(e: Enemy, state: GameState, dt: number): void {
    const { ctx } = this;
    const towerX = state.tower.x;
    const sprites = ENEMY_SPRITES[e.def.id];
    if (!sprites) return;
    const slowed = e.slowTimeLeft > 0;
    const sprite = sprites[walkFrame(this.now, e.id, sprites.length, slowed ? 3 : 6)];
    const { left, top, w, h, sx, sy, scale } = this.enemyPose(e, state);
    const flying = e.def.ability === 'flying';
    const ground = Math.round(e.y + h / 2);

    if (e.def.ability === 'healer') {
      const pulse = 0.5 + 0.5 * Math.sin(this.now * 3);
      ctx.strokeStyle = `rgba(111, 220, 111, ${0.25 + 0.2 * pulse})`;
      ctx.setLineDash([2, 3]);
      ctx.lineDashOffset = -this.now * 10;
      ctx.beginPath();
      ctx.ellipse(e.x, e.y + 4, 70, 45, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = `rgba(111, 220, 111, ${0.05 + 0.04 * pulse})`;
      ctx.fill();
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
      if (enraged && Math.random() < dt * 20) this.fx.sparkle({ x: e.x + (Math.random() - 0.5) * w, y: top + Math.random() * h }, '#ff5a4d');
    }
    ctx.fillStyle = flying ? '#00000044' : '#00000066';
    ctx.beginPath();
    ctx.ellipse(e.x, ground - 1, w * (flying ? 0.3 : 0.4) * sx, 2 * scale, 0, 0, Math.PI * 2);
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
    if (sx !== 1 || sy !== 1) {
      // 발밑을 기준으로 늘이고 줄인다
      ctx.save();
      ctx.translate(left + w / 2, top + h);
      ctx.scale(sx, sy);
      drawSprite(ctx, shown, -w / 2, -h, scale, facesLeft(e.x, towerX), variant);
      ctx.restore();
    } else drawSprite(ctx, shown, left, top, scale, facesLeft(e.x, towerX), variant);
    if (frozen) {
      ctx.fillStyle = 'rgba(191, 224, 255, 0.25)';
      ctx.fillRect(left - 1, top - 1, w + 2, h + 2);
      ctx.strokeStyle = 'rgba(232, 246, 255, 0.8)';
      ctx.strokeRect(left - 1.5, top - 1.5, w + 3, h + 3);
    }
    if (e.stolen > 0) {
      // 훔친 금화 주머니
      drawSprite(ctx, ICONS.coin, Math.round(e.x - 4), top - 10 + Math.round(Math.sin(this.now * 10) * 1), 1);
    }
  }

  /** 체력바·보스 이름 (밤에도 어두워지지 않게 하늘색을 입힌 뒤 그린다) */
  private drawEnemyOverlay(e: Enemy): void {
    const { ctx } = this;
    if (!ENEMY_SPRITES[e.def.id]) return;
    const { top, w } = this.enemyPose(e);
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

  /** 스킬 이벤트 → 연출 */
  private skillFx(ev: Extract<GameEvent, { kind: 'skill' }>, state: GameState): void {
    const t = state.tower;
    const tower = { x: t.x, y: t.y };
    const { width, fieldHeight } = this.layout;
    const bolts = (color: string) => (ev.targets ?? []).forEach((p, i) => this.fx.strike(p, color, i * 0.05));
    switch (ev.id) {
      case 'meteor':
        if (ev.at) this.fx.meteor(ev.at, SKILL.meteorRadius, METEOR_FALL);
        for (const p of ev.targets ?? []) this.fx.meteor(p, SKILL.meteorRadius, METEOR_FALL);
        break;
      case 'comet':
        if (ev.at) this.fx.meteor(ev.at, SKILL.cometRadius, METEOR_FALL, 'ice');
        break;
      case 'golden_meteor':
        if (ev.at) this.fx.meteor(ev.at, SKILL.meteorRadius, METEOR_FALL, 'gold');
        this.fx.goldRush(tower);
        break;
      case 'blizzard':
        this.fx.blizzard(width, fieldHeight, ev.evolved ? SKILL.freezeEvolved : SKILL.freezeSeconds);
        break;
      case 'repair':
        this.fx.repair({ x: t.x, y: t.y - 10 }, t.maxHp * (ev.evolved ? SKILL.repairEvolved : SKILL.repairPct));
        break;
      case 'gold_rush':
        this.fx.goldRush(tower);
        break;
      case 'thunder':
        bolts('#ffe066');
        break;
      case 'judgement':
        bolts('#ff9d4d');
        this.fx.flash('#ff9d4d', 0.2);
        break;
      case 'gust':
        this.fx.gust(tower);
        break;
      case 'tempest':
        this.fx.gust(tower);
        bolts('#ffe066');
        break;
      case 'frost_gale':
        this.fx.gust(tower);
        this.fx.blizzard(width, fieldHeight, SKILL.galeFreeze);
        break;
      case 'ice_wall':
        this.fx.blizzard(width, fieldHeight, SKILL.freezeSeconds);
        this.fx.repair({ x: t.x, y: t.y - 10 }, t.maxHp * SKILL.repairPct);
        this.fx.ring(tower, 40, '#9fd8ff', 0.8);
        break;
      case 'alchemy':
        this.fx.repair({ x: t.x, y: t.y - 10 }, t.maxHp * SKILL.repairPct);
        this.fx.goldRush(tower);
        break;
    }
    // 스킬 이름은 배너 대신 탑 위에 짧게 (배너가 쌓여 콤보를 가리지 않게)
    const k = findSkill(ev.id);
    this.fx.floatText({ x: t.x, y: t.y - 36 }, skillName(ev.id, !!ev.evolved), TAG_INFO[k.tags[0]].color, 10, 0.9);
  }

  /** 떨어뜨릴 곳 조준 원 */
  private drawAim(p: { x: number; y: number }, id: string): void {
    const { ctx } = this;
    const radius = id === 'comet' ? SKILL.cometRadius : SKILL.meteorRadius;
    const color = id === 'comet' ? '#9fd8ff' : id === 'golden_meteor' ? '#ffd75e' : '#ff6b35';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.lineDashOffset = -this.now * 20;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;
    text(ctx, `클릭: ${findSkill(id).name} · 우클릭/Esc: 취소`, p.x, p.y + radius + 8, color, 8, 'center');
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
    const since = this.now - this.towerHitAt;
    const hurt = since < 0.08;
    const shudder = since < 0.2 ? Math.round(Math.sin(since * 90) * 1.5) : 0;
    drawSprite(ctx, s, left + shudder, top, 1, false, hurt ? 'red' : 'normal');
    if (state.shieldLeft > 0) {
      const a = Math.min(1, state.shieldLeft) * (0.45 + 0.15 * Math.sin(this.now * 6));
      ctx.strokeStyle = `rgba(159, 216, 255, ${a})`;
      ctx.fillStyle = `rgba(159, 216, 255, ${a * 0.25})`;
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const ang = (Math.PI / 3) * k + this.now * 0.5;
        const px = t.x + Math.cos(ang) * 26;
        const py = t.y - 4 + Math.sin(ang) * 30;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    this.drawTowerTrim(left + shudder, top, 1, state.hero ? findHero(state.hero).color : C.gold);
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
    panel(ctx, { x: -2, y: -2, w: width + 4, h: 26 }, '#0f1320f2');
    ctx.fillStyle = '#2a3350';
    ctx.fillRect(0, 23, width, 1);

    // 라운드 + 진행 막대 (막대 색은 하늘을 따라 낮 파랑 → 노을 주황 → 밤 보라)
    const endless = state.mode === 'endless';
    const bossRound = !endless && state.round === c.totalRounds;
    text(ctx, endless ? `${state.round} 라운드` : `${state.round}/${c.totalRounds} 라운드`, 8, 9, '#ffffff', 11, 'left', true);
    if (bossRound) {
      const pulse = Math.floor(this.now * 3) % 2 === 0;
      text(ctx, '보스전', 8, 19, pulse ? C.red : '#ff9a9a', 8, 'left', true);
    } else {
      const sky = skyAt({ round: state.round, roundTime: state.roundTime, roundSeconds: c.roundSeconds, totalRounds: c.totalRounds, mode: state.mode });
      const barColor = sky.night > 0.5 ? '#9a7dff' : sky.dusk > 0.5 ? '#ff9d4d' : '#6fb7ff';
      bar(ctx, 8, 17, 96, 3, Math.min(1, state.roundTime / c.roundSeconds), barColor);
      text(ctx, `${Math.ceil(c.roundSeconds - state.roundTime)}초`, 108, 18.5, C.dim, 8);
    }
    // 이번 라운드 남은 적
    const alive = state.enemies.filter((e) => e.hp > 0).length;
    drawSprite(ctx, ENEMY_SPRITES.goblin[0], 136, 6, 1);
    text(ctx, `${alive}`, 151, 12, alive > 25 ? '#ff9a9a' : C.text, 10, 'left', true);

    // 골드 (코인이 도착하면 톡 튄다)
    const bump = Math.max(0, 1 - (this.now - this.fx.goldBumpAt) / 0.15);
    const bumpScale = this.now >= this.fx.goldBumpAt ? 1 + 0.35 * bump : 1;
    drawSprite(ctx, ICONS.coin, 226, 3, 2);
    ctx.save();
    ctx.translate(250, 11);
    ctx.scale(bumpScale, bumpScale);
    text(ctx, `${Math.floor(this.shownGold)}`, 0, 0, C.gold, 12, 'left', true);
    ctx.restore();
    text(ctx, `+${incomePerSecond(state)}/초`, 300, 12, C.dim, 8);

    // 체력 (잔상 막대, 낮으면 하트가 뛴다)
    const t = state.tower;
    const ratio = Math.max(0, t.hp / t.maxHp);
    const beat = ratio < 0.35 ? 1 + 0.2 * Math.max(0, Math.sin(this.now * 10)) : 1;
    ctx.save();
    ctx.translate(376, 12);
    ctx.scale(beat, beat);
    drawSprite(ctx, ICONS.heart, -9, -9, 2);
    ctx.restore();
    bar(ctx, 392, 6, 150, 10, ratio, ratio > 0.3 ? '#4fc36a' : C.red, this.ghostHp);
    text(ctx, `${Math.ceil(t.hp)} / ${Math.round(t.maxHp)}`, 467, 11.5, '#ffffff', 9, 'center');

    // 고른 탑 · 난이도
    const hero = state.hero ? findHero(state.hero) : null;
    const d = findDifficulty(state.difficulty).name;
    const label = hero ? hero.name : d;
    ctx.font = `bold 9px ${FONT}`;
    const lw = ctx.measureText(label).width;
    if (hero) {
      ctx.fillStyle = hero.color;
      ctx.fillRect(Math.round(width - 32 - lw - 8), 7, 5, 5);
    }
    text(ctx, label, width - 32, 9, hero ? hero.color : C.dim, 9, 'right', true);
    text(ctx, hero ? `${d}${endless ? ' · 무한' : ''}` : endless ? '무한' : '', width - 32, 19, C.dim, 7, 'right');
    const m = layout.mute;
    button(ctx, m, ui.muted ? '♪×' : '♪', ui.hoverButton === 'mute' ? 'hover' : 'normal');

    this.drawStats(state);
    this.drawOwned(state, ui);
  }

  /** 오른쪽 위: 탑 능력치 · 특전 · 다음 보스 (배경이 있는 작은 창) */
  private drawStats(state: GameState): void {
    const { ctx, layout } = this;
    const t = state.tower;
    const items: string[] = [];
    if (t.armor) items.push(`방어 ${t.armor}`);
    if (t.regen) items.push(`재생 ${t.regen}`);
    if (t.damageMul !== 1) items.push(`피해 +${Math.round((t.damageMul - 1) * 100)}%`);
    if (t.attackSpeedMul !== 1) items.push(`공속 +${Math.round((t.attackSpeedMul - 1) * 100)}%`);
    if (t.critChance) items.push(`치명 ${Math.round(t.critChance * 100)}%`);
    if (t.thorns) items.push(`가시 ${t.thorns}`);
    if (t.rangeBonus) items.push(`사거리 +${t.rangeBonus}`);
    const c = state.config;
    const w = 172;
    const x = layout.width - w - 4;
    ctx.font = `8px ${FONT}`;
    // 칸 폭에 맞춰 줄 바꿈
    const lines: [string, string][] = [];
    const pack = (words: string[], color: string) => {
      let line = '';
      for (const word of words) {
        const next = line ? `${line} · ${word}` : word;
        if (ctx.measureText(next).width > w - 10 && line) {
          lines.push([line, color]);
          line = word;
        } else line = next;
      }
      if (line) lines.push([line, color]);
    };
    pack(items, C.gold);
    if (state.goldRushLeft > 0) lines.push([`골드 러시 ×${state.goldRushMul} · ${Math.ceil(state.goldRushLeft)}초`, C.gold]);
    if (state.shieldLeft > 0) lines.push([`얼음 성벽 · ${Math.ceil(state.shieldLeft)}초`, '#9fd8ff']);
    pack(state.perks.map((id) => findPerk(id).name), '#d6a8ff');
    if (state.mode === 'endless') {
      const left = c.endless.bossEvery - ((state.round - 1) % c.endless.bossEvery) - 1;
      lines.push([left === 0 ? '보스 라운드' : `다음 보스까지 ${left}라운드`, left === 0 ? C.red : C.dim]);
    }
    if (!lines.length) return;
    const h = lines.length * 10 + 6;
    ctx.globalAlpha = 0.9;
    panel(ctx, { x, y: 27, w, h }, '#0f1320', '#2a3350', '#0a0d16');
    ctx.globalAlpha = 1;
    lines.forEach(([str, color], i) => text(ctx, str, x + w - 5, 33 + i * 10, color, 8, 'right'));
  }

  /** 왼쪽 위: 보유 무기 칸(아이콘·★·개수, 두 번 눌러 판매)과 세트 칩 */
  private drawOwned(state: GameState, ui: UiState): void {
    const { ctx } = this;
    const groups = ownedGroups(state);
    const tiles = ownedTileCount(state, groups);
    const counts = weaponCounts(state);
    const setTypes = WEAPON_TYPES.filter((type) => counts[type] > 0);
    const chipRows = setTypes.length ? Math.ceil(setTypes.length / OWNED.cols) : 0;
    const h = OWNED.top + tileRows(tiles) * (OWNED.tileH + OWNED.gap) + chipRows * (OWNED.chipH + OWNED.gap) + (chipRows ? 5 : 3);
    ctx.globalAlpha = 0.92;
    panel(ctx, { x: OWNED.x, y: OWNED.y, w: OWNED.w, h }, '#0f1320', '#2a3350', '#0a0d16');
    ctx.globalAlpha = 1;
    const slots = state.config.tower.weaponSlots;
    const full = state.weapons.length >= slots;
    text(ctx, `무기 ${state.weapons.length}/${slots}`, OWNED.x + 5, OWNED.y + 7, full ? '#ff9d4d' : C.dim, 8);
    if (groups.length) text(ctx, '두 번 눌러 판매', OWNED.x + OWNED.w - 5, OWNED.y + 7, '#5a6078', 7, 'right');

    for (let i = 0; i < tiles; i++) {
      const r = tileRect(i);
      const g = groups[i];
      if (!g) {
        // 빈 무기 칸
        ctx.strokeStyle = '#232a40';
        ctx.setLineDash([2, 2]);
        ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
        ctx.setLineDash([]);
        continue;
      }
      const key = `${g.id}:${g.level}`;
      const armed = ui.sellArmed?.key === key && ui.sellArmed.until > this.now;
      const hover = ui.hoverOwned === i;
      const color = LEGENDARY.has(g.id) ? C.gold : TYPE_INFO[g.type].color;
      const fill = armed ? '#3a1a22' : hover ? '#232b42' : g.level > 1 ? '#221f18' : '#171c2b';
      panel(ctx, { ...r, y: r.y - (hover ? 1 : 0) }, fill, hover || armed ? color : '#2e3754', '#0a0d16');
      ctx.fillStyle = color;
      ctx.fillRect(r.x + 2, r.y + r.h - 3, r.w - 4, 1);
      const icon = WEAPON_ICONS[g.id];
      if (icon) drawSprite(ctx, icon, r.x + 3, r.y + Math.round((r.h - icon.height) / 2) - (hover ? 1 : 0), 1);
      if (g.level > 1) text(ctx, '★'.repeat(g.level - 1), r.x + r.w - 3, r.y + 6, C.gold, 7, 'right');
      if (g.count > 1) text(ctx, `×${g.count}`, r.x + r.w - 3, r.y + 15, '#ffffff', 8, 'right', true);
      if (armed) text(ctx, '판매?', r.x + r.w / 2, r.y + r.h / 2, '#ff8a8a', 8, 'center', true);
    }

    // 세트 칩: 아이콘 + 개수/다음 목표, 단계만큼 별
    const [t1, t2] = state.config.sets.thresholds;
    setTypes.forEach((type, j) => {
      const r = setChipRect(j, tiles);
      const n = counts[type];
      const tier = setTier(state.config, n);
      const color = TYPE_INFO[type].color;
      ctx.fillStyle = tier === 2 ? '#2e2616' : '#141824';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = tier > 0 ? color : '#2e3754';
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
      drawSprite(ctx, ICONS[type], r.x + 2, r.y + 2, 1);
      text(ctx, tier === 2 ? '완성' : `${n}/${tier === 0 ? t1 : t2}`, r.x + 13, r.y + 7, tier > 0 ? color : C.dim, 7);
      for (let k = 0; k < tier; k++) {
        ctx.fillStyle = C.gold;
        ctx.fillRect(r.x + r.w - 5 - k * 4, r.y + 3, 2, 2);
      }
    });

    // 마우스를 올린 무기·세트 설명
    const tipY = OWNED.y + h + 3;
    const hovered = ui.hoverOwned !== null ? groups[ui.hoverOwned] : undefined;
    if (hovered) {
      const w = state.weapons[hovered.indices[0]];
      const st = effectiveWeapon(state, w.def, counts, w.level);
      const key = `${hovered.id}:${hovered.level}`;
      const armed = ui.sellArmed?.key === key && ui.sellArmed.until > this.now;
      this.tooltip(OWNED.x, tipY, OWNED.w, [
        [`${hovered.name} ${'★'.repeat(hovered.level)}${hovered.count > 1 ? ` ×${hovered.count}` : ''}`, TYPE_INFO[hovered.type].color],
        [`피해 ${formatNumber(st.damage)} · ${st.cooldown.toFixed(2)}초 · 사거리 ${Math.round(st.range)}`, C.text],
        [armed ? `한 번 더 누르면 +${sellPrice(w)}G 에 판매` : `판매 가격 ${sellPrice(w)}G`, armed ? '#ff8a8a' : C.dim],
      ]);
    } else if (ui.hoverChip !== null && setTypes[ui.hoverChip]) {
      const type = setTypes[ui.hoverChip];
      const [b1, b2] = state.config.sets.damageBonus;
      const n = counts[type];
      this.tooltip(OWNED.x, tipY, OWNED.w, [
        [`${TYPE_INFO[type].label} 세트 · ${n}개`, TYPE_INFO[type].color],
        [`${t1}개: ${TYPE_INFO[type].label} 피해 +${b1 * 100}%`, n >= t1 ? C.gold : C.dim],
        [`${t2}개: +${b2 * 100}% · ${SET_SPECIALS[type]}`, n >= t2 ? C.gold : C.dim],
      ]);
    }
  }

  private tooltip(x: number, y: number, w: number, lines: [string, string][]): void {
    const { ctx } = this;
    const h = lines.length * 11 + 6;
    panel(ctx, { x, y, w, h }, '#141a29f4');
    lines.forEach(([str, color], i) => text(ctx, str, x + 6, y + 8 + i * 11, color, 8));
  }

  // ───────── 스킬 바 ─────────

  private drawSkills(state: GameState, ui: UiState): void {
    const { ctx, layout } = this;
    const keys = ['Q', 'W', 'E', 'D'];
    layout.skills.forEach((r, i) => {
      const owned = state.skills[i];
      const hover = ui.hoverSkill === i;
      if (!owned) {
        // 빈 칸: 스킬 포인트가 있으면 반짝이며 트리로 이끈다
        ctx.strokeStyle = state.skillPoints > 0 && Math.floor(this.now * 2) % 2 === 0 ? '#9fe0ff' : '#2e3754';
        ctx.setLineDash([2, 2]);
        ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
        ctx.setLineDash([]);
        text(ctx, '+', r.x + r.w / 2, r.y + r.h / 2, '#4a5270', 12, 'center', true);
        text(ctx, keys[i], r.x + 4, r.y + r.h - 5, '#3a4260', 7);
        return;
      }
      const def = findSkill(owned.id);
      const cd = skillCooldownLeft(state, owned.id);
      const ready = cd <= 0;
      const color = TAG_INFO[def.tags[0]].color;
      const combo = ready ? comboReady(state, owned.id) : null;
      button(ctx, r, '', ui.aiming === owned.id ? 'selected' : hover ? 'hover' : 'normal', color);
      // 속성 색 띠 (합체 스킬은 두 색)
      def.tags.forEach((tag, k) => {
        ctx.fillStyle = TAG_INFO[tag].color;
        ctx.fillRect(r.x + 2 + k * ((r.w - 4) / def.tags.length), r.y + 2, (r.w - 4) / def.tags.length, 2);
      });
      const icon = SKILL_ICONS[owned.id];
      if (icon) drawSprite(ctx, icon, r.x + 6, r.y + 6, 2, false);
      if (owned.evolved || def.tier === 'fused') text(ctx, def.tier === 'fused' ? '◆' : '★', r.x + r.w - 4, r.y + 8, C.gold, 7, 'right');
      if (cd > 0) {
        // 남은 시간만큼 위에서부터 어둡게
        const full = def.cooldown * (state.perks.includes('skill_master') ? 0.7 : 1) * state.skillCooldownMul;
        ctx.fillStyle = 'rgba(6, 8, 13, 0.7)';
        ctx.fillRect(r.x + 2, r.y + 2, r.w - 4, (r.h - 4) * Math.min(1, cd / full));
        text(ctx, `${Math.ceil(cd)}`, r.x + r.w / 2, r.y + r.h / 2, '#ffffff', 11, 'center', true);
      } else if (combo) {
        // 지금 쓰면 콤보!
        const c = TAG_INFO[combo.to].color;
        ctx.strokeStyle = c;
        ctx.lineWidth = 2;
        const grow = Math.sin(this.now * 10) * 1.5;
        ctx.strokeRect(r.x - 1 - grow, r.y - 1 - grow, r.w + 2 + grow * 2, r.h + 2 + grow * 2);
        ctx.lineWidth = 1;
        text(ctx, combo.name, r.x + r.w / 2, r.y - 7, c, 8, 'center', true);
      } else if (Math.floor(this.now * 2) % 2 === 0) {
        ctx.strokeStyle = 'rgba(255, 215, 94, 0.5)';
        ctx.strokeRect(r.x + 1.5, r.y + 1.5, r.w - 3, r.h - 3);
      }
      text(ctx, keys[i], r.x + 4, r.y + r.h - 5, ready ? C.gold : '#5a6078', 7);
    });

    // 스킬 트리 버튼 + 스킬 포인트
    const b = layout.treeButton;
    const sp = state.skillPoints;
    button(ctx, b, '', ui.hoverButton === 'tree' ? 'hover' : sp > 0 ? 'selected' : 'normal', '#9fe0ff');
    text(ctx, '트리', b.x + b.w / 2, b.y + 11, sp > 0 ? '#9fe0ff' : C.text, 9, 'center', true);
    text(ctx, 'T', b.x + 4, b.y + b.h - 5, C.dim, 7);
    if (sp > 0) {
      const pulse = 1 + 0.15 * Math.sin(this.now * 8);
      ctx.save();
      ctx.translate(b.x + b.w - 4, b.y + 3);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = C.red;
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, `${sp}`, 0, 0.5, '#ffffff', 8, 'center', true);
      ctx.restore();
    }
    text(ctx, sp > 0 ? `SP ${sp}` : '', b.x + b.w / 2, b.y + 22, '#9fe0ff', 7, 'center');

    const hovered = typeof ui.hoverSkill === 'number' ? state.skills[ui.hoverSkill] : undefined;
    if (hovered) {
      const def = findSkill(hovered.id);
      const r0 = layout.skills[0];
      const w = 230;
      const box = { x: layout.width / 2 - w / 2, y: r0.y - 46, w, h: 40 };
      panel(ctx, box, '#141a29f2');
      const desc = hovered.evolved && def.evolve ? def.evolve.desc : def.desc;
      text(ctx, `${skillName(hovered.id, hovered.evolved)} [${keys[ui.hoverSkill!]}] · ${def.cooldown}초`, box.x + 6, box.y + 8, C.gold, 9);
      text(ctx, desc, box.x + 6, box.y + 20, C.text, 8);
      text(ctx, `속성: ${def.tags.map((tg) => TAG_INFO[tg].label).join(' · ')}`, box.x + 6, box.y + 32, C.dim, 8);
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
      const c = state.config;
      const last = state.mode === 'classic' && state.round >= c.totalRounds;
      text(ctx, last ? '품절' : '다음 라운드에 새 물건', 0, -5, '#4a5270', 9, 'center');
      if (!last) text(ctx, `${Math.ceil(c.roundSeconds - state.roundTime)}초`, 0, 8, '#5a6488', 10, 'center', true);
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
    // 오른쪽에 큰 그림 (마우스를 올리면 살짝 흔들린다)
    const art = item.kind === 'weapon' ? WEAPON_ICONS[item.id] : ICONS.upgrade;
    if (art) {
      const wob = hover ? Math.round(Math.sin(this.now * 8) * 1) : 0;
      ctx.globalAlpha *= 0.95;
      drawSprite(ctx, art, box.x + box.w - 27, box.y + 17 + wob, 2);
    }
    ctx.font = `8px ${FONT}`;
    if (item.kind === 'weapon') {
      text(ctx, `피해 ${item.damage} · ${item.cooldown}초`, box.x + 5, box.y + 36, '#b0b8c8', 8);
      text(ctx, `사거리 ${item.range}`, box.x + 5, box.y + 46, '#8a94a8', 8);
      this.wrap(item.desc, box.x + 5, box.y + 57, box.w - 10, 10, C.dim, 1);
    } else {
      this.wrap(item.desc, box.x + 5, box.y + 37, box.w - 34, 10, '#b0b8c8');
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  /** 띄어쓰기 단위로 줄을 바꾸고, 한 단어가 너무 길 때만 글자 단위로 자른다 */
  private wrap(str: string, x: number, y: number, maxW: number, lineH: number, color: string, maxLines = 2): void {
    const { ctx } = this;
    ctx.font = `8px ${FONT}`;
    const fits = (t: string) => ctx.measureText(t).width <= maxW;
    const lines: string[] = [];
    let line = '';
    for (const word of str.split(' ')) {
      const next = line ? `${line} ${word}` : word;
      if (fits(next)) {
        line = next;
        continue;
      }
      if (line) lines.push(line);
      line = '';
      for (const ch of word) {
        if (!fits(line + ch) && line) {
          lines.push(line);
          line = ch;
        } else line += ch;
      }
    }
    if (line) lines.push(line);
    lines.slice(0, maxLines).forEach((l, k) => text(ctx, l, x, y + k * lineH, color, 8));
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
    let slot = 0;
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
        // 먼저 뜬 배너 아래로 차례차례 쌓는다
        const drop = easeOutBack(Math.min(1, age / 0.35));
        const h = b.sub ? 36 : 26;
        const y = -20 + drop * (62 + slot * 42);
        slot++;
        const w = b.style === 'round' ? 170 : 220;
        panel(ctx, { x: cx - w / 2, y: y - h / 2, w, h }, '#161b2aee', b.color);
        // 반짝임이 한 번 훑고 지나간다
        const sweep = (age - 0.2) / 0.5;
        if (sweep > 0 && sweep < 1) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(cx - w / 2 + 2, y - h / 2 + 2, w - 4, h - 4);
          ctx.clip();
          ctx.fillStyle = 'rgba(255,255,255,0.12)';
          const sx = cx - w / 2 + sweep * (w + 40) - 20;
          ctx.beginPath();
          ctx.moveTo(sx, y - h / 2);
          ctx.lineTo(sx + 14, y - h / 2);
          ctx.lineTo(sx - 4, y + h / 2);
          ctx.lineTo(sx - 18, y + h / 2);
          ctx.fill();
          ctx.restore();
        }
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
      const look = PERK_LOOK[id] ?? { icon: 'upgrade', color: '#c77dff', tag: '특전' };
      const r = layout.perkCards[i];
      const appear = easeOutBack(Math.min(1, Math.max(0, (since - i * 0.08) / 0.3)));
      if (appear <= 0) return;
      const hover = ui.hoverChoice === i;
      ctx.save();
      ctx.translate(r.x + r.w / 2, r.y + r.h / 2 + (hover ? -5 : 0) + Math.sin(this.now * 2 + i) * 1.5);
      ctx.scale(appear, appear);
      const box = { x: -r.w / 2, y: -r.h / 2, w: r.w, h: r.h };
      panel(ctx, box, hover ? '#262036' : '#1a1628', hover ? look.color : '#4a3f6a');
      // 위쪽 색 띠와 은은한 빛
      ctx.fillStyle = look.color;
      ctx.fillRect(box.x + 2, box.y + 2, box.w - 4, 3);
      const g = ctx.createRadialGradient(0, box.y + 42, 4, 0, box.y + 42, 50);
      g.addColorStop(0, `${look.color}${hover ? '55' : '33'}`);
      g.addColorStop(1, `${look.color}00`);
      ctx.fillStyle = g;
      ctx.fillRect(box.x + 2, box.y + 6, box.w - 4, 80);
      const icon = ICONS[look.icon] ?? ICONS.upgrade;
      const bob = Math.round(Math.sin(this.now * 3 + i) * 2);
      drawSprite(ctx, icon, -icon.width * 2, box.y + 24 + bob, 4);
      text(ctx, `${i + 1}`, box.x + 8, box.y + 13, C.dim, 9);
      text(ctx, look.tag, box.x + box.w - 8, box.y + 13, look.color, 8, 'right');
      text(ctx, perk.name, 0, box.y + 84, '#ffffff', 14, 'center', true);
      ctx.font = `9px ${FONT}`;
      let line = '';
      let y = box.y + 104;
      for (const word of perk.desc.split(' ')) {
        const next = line ? `${line} ${word}` : word;
        if (ctx.measureText(next).width > box.w - 20 && line) {
          text(ctx, line, 0, y, C.text, 9, 'center');
          y += 13;
          line = word;
        } else line = next;
      }
      if (line) text(ctx, line, 0, y, C.text, 9, 'center');
      const evolves = BASE_SKILLS.find((k) => k.evolve?.perk === id && state.skills.some((o) => o.id === k.id && !o.evolved));
      if (evolves) {
        const blink = Math.floor(this.now * 3) % 2 === 0;
        text(ctx, `${evolves.name} → ${evolves.evolve!.name} 진화 무료`, 0, box.y + box.h - 24, blink ? '#ffffff' : C.gold, 8, 'center', true);
      }
      if (hover) text(ctx, '클릭해서 받기', 0, box.y + box.h - 10, look.color, 8, 'center');
      ctx.restore();
    });
  }

  /** 스킬 트리: 1단 배우기 · 2단 진화 · 3단 합체 (게임은 멈춰 있다) */
  private overlayTree(state: GameState, ui: UiState): void {
    const { ctx, layout } = this;
    const tr = layout.tree;
    ctx.fillStyle = 'rgba(6, 8, 13, 0.86)';
    ctx.fillRect(0, 0, layout.width, layout.fieldHeight);
    text(ctx, '스킬 트리', tr.base[0].rect.x, 18, '#9fe0ff', 16, 'left', true);
    text(ctx, `칸 ${state.skills.length}/${state.config.skills.slots} · 배우기 ${SKILL.learnCost} · 진화 ${SKILL.evolveCost}(짝 특전이 있으면 0) · 합체 ${SKILL.fuseCost}`, tr.base[0].rect.x + 86, 19, C.dim, 8);
    const sp = state.skillPoints;
    text(ctx, `스킬 포인트 ${sp}`, layout.width - tr.base[0].rect.x, 18, sp > 0 ? '#9fe0ff' : C.dim, 12, 'right', true);

    const center = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
    const hov = ui.hoverTree;
    // 연결선: 기본 → 진화, 기본 → 합체
    for (const f of tr.fused) {
      const def = findSkill(f.id);
      const both = def.recipe!.every((r) => ownedSkill(state, r));
      const owned = !!ownedSkill(state, f.id);
      const focus = hov && 'id' in hov && (hov.id === f.id || def.recipe!.includes(hov.id));
      for (const part of def.recipe!) {
        const from = tr.base.find((n) => n.id === part)!.rect;
        const a = { x: from.x + from.w / 2, y: from.y + from.h };
        const b = { x: f.rect.x + f.rect.w / 2, y: f.rect.y };
        ctx.strokeStyle = owned ? C.gold : both ? '#9fe0ff' : focus ? '#8a94a8' : '#2a3350';
        ctx.lineWidth = focus || both || owned ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.bezierCurveTo(a.x, a.y + 60, b.x, b.y - 40, b.x, b.y);
        ctx.stroke();
      }
    }
    ctx.lineWidth = 1;

    const node = (r: Rect, opts: { id: string; title: string; sub: string; subColor: string; state: 'done' | 'ready' | 'open' | 'locked' | 'gone'; hover: boolean }) => {
      const def = findSkill(opts.id);
      const main = TAG_INFO[def.tags[0]].color;
      const fill = opts.state === 'done' ? '#2a2616' : opts.state === 'ready' ? '#16263a' : '#141824';
      const border = opts.state === 'done' ? C.gold : opts.state === 'ready' ? '#9fe0ff' : opts.hover ? C.text : '#2e3754';
      const lift = opts.hover && opts.state === 'ready' ? -1 : 0;
      ctx.globalAlpha = opts.state === 'gone' ? 0.35 : opts.state === 'locked' ? 0.6 : 1;
      panel(ctx, { ...r, y: r.y + lift }, fill, border, '#0a0d16');
      def.tags.forEach((tag, k) => {
        ctx.fillStyle = TAG_INFO[tag].color;
        ctx.fillRect(r.x + 2 + k * ((r.w - 4) / def.tags.length), r.y + lift + 2, (r.w - 4) / def.tags.length, 2);
      });
      const icon = SKILL_ICONS[opts.id];
      if (icon) drawSprite(ctx, icon, r.x + 5, r.y + lift + Math.round((r.h - 9) / 2), 1);
      text(ctx, opts.title, r.x + 17, r.y + lift + r.h / 2 - 5, opts.state === 'done' ? C.gold : '#ffffff', 9, 'left', true);
      text(ctx, opts.sub, r.x + 17, r.y + lift + r.h / 2 + 7, opts.subColor, 7);
      if (opts.state === 'ready' && Math.floor(this.now * 2) % 2 === 0) {
        ctx.strokeStyle = main;
        ctx.strokeRect(r.x - 0.5, r.y + lift - 0.5, r.w + 1, r.h + 1);
      }
      ctx.globalAlpha = 1;
    };

    const isHover = (kind: string, id: string) => !!hov && hov.kind === kind && 'id' in hov && hov.id === id;
    for (const n of tr.base) {
      const def = findSkill(n.id);
      const owned = !!ownedSkill(state, n.id);
      const gone = state.consumedSkills.includes(n.id);
      const check = learnCheck(state, n.id);
      const st = owned ? 'done' : gone ? 'gone' : check.ok ? 'ready' : 'locked';
      const sub = owned ? '배움' : gone ? '합체에 씀' : !check.ok && check.reason === 'slots' ? '칸 없음 · 합체로 비우기' : `${SKILL.learnCost} SP`;
      node(n.rect, { id: n.id, title: def.name, sub, subColor: st === 'ready' ? '#9fe0ff' : C.dim, state: st, hover: isHover('learn', n.id) });
    }
    for (const n of tr.evolve) {
      const def = findSkill(n.id);
      const owned = ownedSkill(state, n.id);
      const cost = evolveCost(state, n.id);
      const check = evolveCheck(state, n.id);
      const st = owned?.evolved ? 'done' : state.consumedSkills.includes(n.id) ? 'gone' : check.ok ? 'ready' : 'locked';
      const perk = findPerk(def.evolve!.perk).name;
      const sub = owned?.evolved ? '진화함' : cost === 0 ? `무료 (${perk})` : `${cost} SP · ${perk} 있으면 0`;
      node(n.rect, { id: n.id, title: def.evolve!.name, sub, subColor: cost === 0 ? C.gold : st === 'ready' ? '#9fe0ff' : C.dim, state: st, hover: isHover('evolve', n.id) });
    }
    for (const n of tr.fused) {
      const def = findSkill(n.id);
      const owned = !!ownedSkill(state, n.id);
      const check = fuseCheck(state, n.id);
      const st = owned ? 'done' : check.ok ? 'ready' : 'locked';
      const [a, b] = def.recipe!.map((r) => findSkill(r).name);
      node(n.rect, { id: n.id, title: def.name, sub: owned ? '합체함' : `${a}+${b}`, subColor: st === 'ready' ? '#9fe0ff' : C.dim, state: st, hover: isHover('fuse', n.id) });
    }

    // 설명 칸: 마우스를 올린 칸, 없으면 콤보 목록
    const d = tr.detail;
    panel(ctx, d, '#10141f', '#2a3350', '#0a0d16');
    if (hov && 'id' in hov) {
      const def = findSkill(hov.id);
      const tags = def.tags.map((tg) => TAG_INFO[tg].label).join('·');
      if (hov.kind === 'evolve') {
        text(ctx, `${def.name} 진화 → ${def.evolve!.name}`, d.x + 8, d.y + 10, C.gold, 10, 'left', true);
        text(ctx, def.evolve!.desc, d.x + 8, d.y + 24, C.text, 9);
        text(ctx, `짝 특전 「${findPerk(def.evolve!.perk).name}」을 가지고 있으면 공짜`, d.x + 8, d.y + 38, C.dim, 8);
      } else {
        text(ctx, `${def.name} · ${tags} · 재사용 ${def.cooldown}초`, d.x + 8, d.y + 10, TAG_INFO[def.tags[0]].color, 10, 'left', true);
        text(ctx, def.desc, d.x + 8, d.y + 24, C.text, 9);
        if (def.recipe) {
          const [a, b] = def.recipe.map((r) => findSkill(r).name);
          text(ctx, `${a} 와 ${b} 를 가지고 있으면 합친다 · 칸이 하나 빈다 · 진화한 재료 하나당 +30%`, d.x + 8, d.y + 38, C.dim, 8);
        } else text(ctx, `배우면 빈 칸에 들어간다 · 합체 재료가 될 수 있다`, d.x + 8, d.y + 38, C.dim, 8);
      }
    } else {
      text(ctx, '콤보: 속성이 이어지게 4초 안에 연달아 쓰면 추가 효과', d.x + 8, d.y + 10, C.gold, 9, 'left', true);
      COMBOS.forEach((c, k) => {
        const x = d.x + 8 + (k % 3) * 200;
        const y = d.y + 24 + Math.floor(k / 3) * 13;
        text(ctx, `${TAG_INFO[c.from].label}→${TAG_INFO[c.to].label} ${c.name}`, x, y, TAG_INFO[c.to].color, 8);
      });
    }
    button(ctx, tr.close, '닫기 [T · Esc]', hov?.kind === 'close' ? 'hover' : 'normal');
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
    // 전장이 비쳐 보이게 옅게 덮고, 위쪽은 제목이 잘 보이게 더 어둡게
    this.dim(0.35);
    const top = ctx.createLinearGradient(0, 0, 0, 150);
    top.addColorStop(0, 'rgba(6, 8, 13, 0.75)');
    top.addColorStop(1, 'rgba(6, 8, 13, 0.2)');
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, width, 150);

    // 적 행렬이 아래쪽을 지나간다
    const parade = ['goblin', 'wolf', 'slime', 'orc', 'bat', 'golem', 'thief', 'shield', 'boss_rhino'];
    parade.forEach((id, i) => {
      const frames = ENEMY_SPRITES[id];
      const f = frames[walkFrame(this.now, i, frames.length, 6)];
      const x = ((this.now * 28 + i * 78) % (width + 120)) - 60;
      drawSprite(ctx, f, x, fieldHeight - 22 - f.height, 1, false);
    });

    this.drawTitle(16, 22);
    this.drawShards(ui.meta.shards);

    // 탑 고르기
    for (const { id, rect } of layout.heroes) this.drawHeroCard(ui, id, rect);
    const hero = findHero(ui.hero);
    const weapon = findItem(hero.startWeapons[0]).name;
    const band = ctx.createLinearGradient(0, 0, width, 0);
    band.addColorStop(0, 'rgba(6, 8, 13, 0)');
    band.addColorStop(0.2, 'rgba(6, 8, 13, 0.7)');
    band.addColorStop(0.8, 'rgba(6, 8, 13, 0.7)');
    band.addColorStop(1, 'rgba(6, 8, 13, 0)');
    ctx.fillStyle = band;
    ctx.fillRect(0, 146, width, 32);
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
        record = rec.plays === 0 ? '첫 도전' : `최고 ${rec.bestRound}R · 처치 ${formatNumber(rec.bestKills)}`;
        good = rec.bestRound >= 15;
      } else {
        const rec = ui.records[id];
        record = rec.plays === 0 ? '첫 도전' : `최고 ${rec.bestRound}R · 승 ${rec.wins}${rec.fastestWin !== null ? ` · ${formatTime(rec.fastestWin)}` : ''}`;
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

    this.overlayFx.draw(ctx, width, fieldHeight);
    const blink = Math.floor(this.now * 2) % 2 === 0;
    text(ctx, '클릭 또는 Enter 로 시작 · ←→ 탑 · ↑↓ 난이도 · Tab 모드', width / 2, fieldHeight - 8, blink ? C.gold : C.dim, 9, 'center');
    text(ctx, '1~4 구매  R 리롤  Q W E D 스킬  T 스킬 트리  Space 정지  F 배속  M 소리', width / 2, fieldHeight + 24, C.text, 10, 'center');
    // 팁이 몇 초마다 바뀐다
    const tip = TIPS[Math.floor(this.now / 5) % TIPS.length];
    const phase = (this.now % 5) / 5;
    ctx.globalAlpha = Math.min(1, phase * 8, (1 - phase) * 8);
    text(ctx, `팁 · ${tip}`, width / 2, fieldHeight + 46, '#9fe0ff', 9, 'center');
    ctx.globalAlpha = 1;
    if (ui.meta.runs > 0) text(ctx, `${ui.meta.runs}판째`, width - 10, layout.height - 8, '#4a5270', 8, 'right');
  }

  /** 글자마다 물결치듯 튀고, 반짝임이 훑고 지나가는 제목 */
  private drawTitle(x: number, y: number): void {
    const { ctx } = this;
    const title = '탑 수호자';
    ctx.font = `bold 22px ${FONT}`;
    let cx = x;
    [...title].forEach((ch, i) => {
      const w = ctx.measureText(ch).width;
      const dy = Math.round(Math.sin(this.now * 3 - i * 0.7) * 2);
      text(ctx, ch, cx + 2, y + dy + 2, '#5a3a10', 22, 'left', true);
      const shine = Math.abs(((this.now * 0.6) % 3) - (i / title.length) * 1.2 - 0.4) < 0.12;
      text(ctx, ch, cx, y + dy, shine ? '#fff6d0' : C.gold, 22, 'left', true);
      cx += w;
    });
    text(ctx, '사방에서 몰려오는 적, 가운데 탑 하나', cx + 12, y + 3, '#c8d0e0', 9);
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
    const top = Math.round(r.y + 14 + (sel ? Math.sin(this.now * 3) * 2 : 0));
    if (sel) {
      const g = ctx.createRadialGradient(r.x + r.w / 2, top + 24, 2, r.x + r.w / 2, top + 24, 40);
      g.addColorStop(0, `${hero.color}55`);
      g.addColorStop(1, `${hero.color}00`);
      ctx.fillStyle = g;
      ctx.fillRect(r.x + 2, r.y + 2, r.w - 4, 60);
      if (Math.random() < 0.15) this.overlayFx.sparkle({ x: r.x + 20 + Math.random() * (r.w - 40), y: top + 10 + Math.random() * 30 }, hero.color);
    }
    ctx.globalAlpha = unlocked ? 1 : 0.3;
    drawSprite(ctx, s, left, top, scale, false, 'normal');
    this.drawTowerTrim(left, top, scale, unlocked ? hero.color : '#5a6078');
    ctx.globalAlpha = 1;
    text(ctx, hero.name, r.x + r.w / 2, r.y + 66, unlocked ? (sel ? hero.color : '#ffffff') : '#5a6078', 11, 'center', true);
    if (!unlocked) {
      const cost = nextCost(ui.meta, `hero_${id}`);
      // 자물쇠
      const lx = Math.round(r.x + r.w / 2 - 4);
      const ly = Math.round(r.y + 30);
      ctx.fillStyle = '#8a94a8';
      ctx.fillRect(lx + 1, ly, 6, 1);
      ctx.fillRect(lx, ly + 1, 1, 4);
      ctx.fillRect(lx + 7, ly + 1, 1, 4);
      ctx.fillStyle = '#c9962c';
      ctx.fillRect(lx - 1, ly + 5, 10, 7);
      ctx.fillStyle = '#1b1522';
      ctx.fillRect(lx + 3, ly + 7, 2, 3);
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
      // 오른쪽 그림: 탑이면 깃발 색 탑, 무기면 무기 아이콘, 강화면 효과 아이콘
      if (u.kind === 'hero') {
        const ts = TOWER_SPRITE;
        const sc = 0.75;
        const tl = Math.round(r.x + r.w - 32);
        const tt = Math.round(r.y + 10);
        ctx.drawImage(spriteImage(ts), tl, tt, ts.width * sc, ts.height * sc);
        ctx.fillStyle = color;
        ctx.fillRect(tl + 11, tt - 3, 5, 3);
      } else {
        const art = u.kind === 'weapon' ? WEAPON_ICONS[u.id.slice(7)] : ICONS[META_ICONS[u.id] ?? 'upgrade'];
        if (art) drawSprite(ctx, art, r.x + r.w - 34, r.y + 8, 2);
      }
      const tag = u.kind === 'hero' ? '탑' : u.kind === 'weapon' ? '전설 무기' : '강화';
      text(ctx, tag, r.x + 10, r.y + 10, color, 8);
      text(ctx, u.name, r.x + 10, r.y + 22, '#ffffff', 12, 'left', true);
      this.wrap(u.desc, r.x + 10, r.y + 34, r.w - 50, 9, C.text, 2);
      // 단계 칸
      for (let k = 0; k < u.costs.length; k++) {
        ctx.fillStyle = k < lv ? C.gold : '#2a3350';
        ctx.fillRect(r.x + 10 + k * 9, r.y + 50, 7, 4);
      }
      if (maxed) text(ctx, u.kind === 'stat' ? '최고 단계' : '해금됨', r.x + r.w - 8, r.y + 51, '#8fd16a', 9, 'right');
      else text(ctx, `${cost}`, r.x + r.w - 8, r.y + 51, affordable ? C.gold : '#ff7070', 11, 'right', true);
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
        text(ctx, row.name, barX - 17, yy, color, 9, 'right');
        const icon = WEAPON_ICONS[row.id];
        if (icon) drawSprite(ctx, icon, barX - 14, yy - 6, 1);
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

