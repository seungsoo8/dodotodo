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
import { C, FONT, TYPE_INFO, bar, button, drawSprite, panel, pill, roundRect, spriteImage, text, type SpriteVariant } from './kit.ts';
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
  hoverButton: 'reroll' | 'speed' | 'pause' | 'mute' | 'skill' | 'tree' | 'info' | null;
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
    this.fx.coinTarget = { x: 176, y: 15 };
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
    if (ui.started) this.drawSkills(state, ui);
    if (ui.started && !ui.treeOpen && !state.choice) this.drawBanners();
    if (ui.started && ui.tutorial && state.status === 'playing' && !state.choice && !ui.paused && ui.hoverSkill === null) this.drawHint(state, ui.tutorial);
    if (ui.started && !state.choice && !ui.treeOpen && state.status === 'playing') this.drawTip();
    else this.tip = null;

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

  // ───────── HUD (모두 전장 위에 떠 있는 작은 알약·아이콘) ─────────

  /** 이번 프레임 마지막에 그릴 말풍선 (다른 UI 위에 오도록) */
  private tip: { x: number; y: number; w: number; lines: [string, string, number?][]; above?: boolean } | null = null;

  private drawHud(state: GameState, ui: UiState): void {
    const { ctx, layout } = this;
    const c = state.config;
    const endless = state.mode === 'endless';

    // 라운드: 숫자 + 얇은 진행 막대 (막대 색은 하늘을 따라간다)
    const rp = { x: 6, y: 5, w: 112, h: 20 };
    pill(ctx, rp);
    const bossRound = !endless && state.round === c.totalRounds;
    const roundLabel = endless ? `${state.round}` : `${state.round}/${c.totalRounds}`;
    text(ctx, roundLabel, rp.x + 10, rp.y + 8.5, '#ffffff', 9, 'left', true);
    ctx.font = `700 9px ${FONT}`;
    text(ctx, '라운드', rp.x + 13 + ctx.measureText(roundLabel).width, rp.y + 8.5, C.dim, 7);
    if (bossRound) {
      text(ctx, '보스전', rp.x + rp.w - 10, rp.y + 8.5, Math.floor(this.now * 3) % 2 ? C.red : '#ffb0b0', 7.5, 'right', true);
    } else {
      text(ctx, `${Math.ceil(c.roundSeconds - state.roundTime)}초`, rp.x + rp.w - 10, rp.y + 8.5, C.dim, 7, 'right');
    }
    const sky = skyAt({ round: state.round, roundTime: state.roundTime, roundSeconds: c.roundSeconds, totalRounds: c.totalRounds, mode: state.mode });
    const barColor = bossRound ? C.red : sky.night > 0.5 ? '#a88bff' : sky.dusk > 0.5 ? '#ffae66' : C.accent;
    bar(ctx, rp.x + 10, rp.y + 14.5, rp.w - 20, 2, bossRound ? 1 : Math.min(1, state.roundTime / c.roundSeconds), barColor);

    // 남은 적
    const ep = { x: 122, y: 5, w: 40, h: 20 };
    pill(ctx, ep);
    const alive = state.enemies.filter((e) => e.hp > 0).length;
    drawSprite(ctx, ENEMY_SPRITES.goblin[0], ep.x + 5, ep.y + 4, 1);
    text(ctx, `${alive}`, ep.x + ep.w - 8, ep.y + 10.5, alive > 25 ? '#ffb0b0' : C.text, 8, 'right', true);

    // 골드 (코인이 도착하면 톡 튄다)
    const gp = { x: 166, y: 5, w: 84, h: 20 };
    pill(ctx, gp);
    drawSprite(ctx, ICONS.coin, gp.x + 6, gp.y + 5.5, 1);
    const bump = Math.max(0, 1 - (this.now - this.fx.goldBumpAt) / 0.15);
    const bumpScale = this.now >= this.fx.goldBumpAt ? 1 + 0.3 * bump : 1;
    ctx.save();
    ctx.translate(gp.x + 19, gp.y + 10.5);
    ctx.scale(bumpScale, bumpScale);
    text(ctx, `${Math.floor(this.shownGold)}`, 0, 0, C.gold, 9.5, 'left', true);
    ctx.restore();
    text(ctx, `+${incomePerSecond(state)}`, gp.x + gp.w - 8, gp.y + 10.5, C.dim, 7, 'right');

    // 체력
    const t = state.tower;
    const ratio = Math.max(0, t.hp / t.maxHp);
    const hp = { x: 254, y: 5, w: 150, h: 20 };
    pill(ctx, hp);
    const beat = ratio < 0.35 ? 1 + 0.25 * Math.max(0, Math.sin(this.now * 10)) : 1;
    ctx.save();
    ctx.translate(hp.x + 10.5, hp.y + 10);
    ctx.scale(beat, beat);
    drawSprite(ctx, ICONS.heart, -4.5, -4.5, 1);
    ctx.restore();
    bar(ctx, hp.x + 20, hp.y + 7, hp.w - 28, 6, ratio, ratio > 0.3 ? C.green : C.red, this.ghostHp);
    text(ctx, `${Math.ceil(t.hp)}`, hp.x + hp.w / 2 + 6, hp.y + 10.5, '#ffffff', 6.5, 'center', true);

    // 오른쪽 위 둥근 버튼: 정보 · 배속 · 정지 · 소리
    const hb = ui.hoverButton;
    this.iconButton(layout.info, 'i', hb === 'info', false);
    if (state.perks.length) this.badge(layout.info.x + layout.info.w - 2, layout.info.y + 2, `${state.perks.length}`, '#b48cff');
    this.iconButton(layout.speed, ui.speed === 2 ? '»' : '›', hb === 'speed', ui.speed === 2);
    this.iconButton(layout.pause, ui.paused ? '▶' : 'Ⅱ', hb === 'pause', ui.paused);
    this.iconButton(layout.mute, ui.muted ? '×' : '♪', hb === 'mute', false);

    this.drawOwned(state, ui);
    if (hb === 'info') this.drawStats(state);
  }

  private iconButton(r: Rect, label: string, hover: boolean, on: boolean): void {
    const { ctx } = this;
    ctx.save();
    ctx.beginPath();
    ctx.arc(r.x + r.w / 2, r.y + r.h / 2, r.w / 2, 0, Math.PI * 2);
    ctx.fillStyle = on ? 'rgba(255, 209, 102, 0.22)' : hover ? 'rgba(255, 255, 255, 0.16)' : C.glass;
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = on ? C.gold : C.glassHi;
    ctx.beginPath();
    ctx.arc(r.x + r.w / 2, r.y + r.h / 2, r.w / 2 - 0.5, 0, Math.PI * 2);
    ctx.stroke();
    text(this.ctx, label, r.x + r.w / 2, r.y + r.h / 2 + 0.5, on ? C.gold : C.text, 8, 'center', true);
  }

  /** 작은 숫자 배지 */
  private badge(x: number, y: number, label: string, color: string): void {
    const { ctx } = this;
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    text(ctx, label, x, y + 0.3, '#ffffff', 6, 'center', true);
  }

  /** 정보 버튼에 올리면: 고른 탑 · 능력치 · 특전 · 다음 보스 */
  private drawStats(state: GameState): void {
    const t = state.tower;
    const hero = state.hero ? findHero(state.hero) : null;
    const lines: [string, string, number?][] = [];
    lines.push([`${hero ? `${hero.name} · ` : ''}${findDifficulty(state.difficulty).name}${state.mode === 'endless' ? ' · 무한' : ''}`, hero ? hero.color : C.text, 8.5]);
    const items: string[] = [];
    if (t.armor) items.push(`방어 ${t.armor}`);
    if (t.regen) items.push(`재생 ${t.regen}`);
    if (t.damageMul !== 1) items.push(`피해 +${Math.round((t.damageMul - 1) * 100)}%`);
    if (t.attackSpeedMul !== 1) items.push(`공속 +${Math.round((t.attackSpeedMul - 1) * 100)}%`);
    if (t.critChance) items.push(`치명 ${Math.round(t.critChance * 100)}%`);
    if (t.thorns) items.push(`가시 ${t.thorns}`);
    if (t.rangeBonus) items.push(`사거리 +${t.rangeBonus}`);
    for (let k = 0; k < items.length; k += 4) lines.push([items.slice(k, k + 4).join(' · '), C.gold]);
    if (state.goldRushLeft > 0) lines.push([`골드 러시 ×${state.goldRushMul} · ${Math.ceil(state.goldRushLeft)}초`, C.gold]);
    if (state.shieldLeft > 0) lines.push([`얼음 성벽 · ${Math.ceil(state.shieldLeft)}초`, '#9fd8ff']);
    const perks = state.perks.map((id) => findPerk(id).name);
    for (let k = 0; k < perks.length; k += 4) lines.push([`${k === 0 ? '특전 ' : ''}${perks.slice(k, k + 4).join(' · ')}`, '#c9a8ff']);
    if (state.mode === 'endless') {
      const c = state.config;
      const left = c.endless.bossEvery - ((state.round - 1) % c.endless.bossEvery) - 1;
      lines.push([left === 0 ? '보스 라운드' : `다음 보스까지 ${left}라운드`, left === 0 ? C.red : C.dim]);
    }
    if (lines.length === 1) lines.push(['아직 강화·특전이 없다', C.dim]);
    const w = 196;
    this.tip = { x: this.layout.width - w - 6, y: 30, w, lines };
  }

  /** 왼쪽 위: 무기 아이콘 한 줄 (★·개수, 두 번 눌러 판매)과 세트 칩 */
  private drawOwned(state: GameState, ui: UiState): void {
    const { ctx } = this;
    const groups = ownedGroups(state);
    const tiles = ownedTileCount(state, groups);
    const counts = weaponCounts(state);
    const setTypes = WEAPON_TYPES.filter((type) => counts[type] > 0);

    for (let i = 0; i < tiles; i++) {
      const r = tileRect(i);
      const g = groups[i];
      if (!g) {
        roundRect(ctx, r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, 5);
        ctx.fillStyle = 'rgba(16, 20, 32, 0.35)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.stroke();
        continue;
      }
      const key = `${g.id}:${g.level}`;
      const armed = ui.sellArmed?.key === key && ui.sellArmed.until > this.now;
      const hover = ui.hoverOwned === i;
      const color = LEGENDARY.has(g.id) ? C.gold : TYPE_INFO[g.type].color;
      const lift = hover ? -1 : 0;
      panel(ctx, { ...r, y: r.y + lift }, armed ? 'rgba(120, 30, 40, 0.8)' : hover ? 'rgba(40, 48, 72, 0.9)' : C.glass, armed ? C.red : `${color}${hover ? 'cc' : '55'}`, undefined, 5);
      const icon = WEAPON_ICONS[g.id];
      if (icon) drawSprite(ctx, icon, r.x + 4.5, r.y + 4.5 + lift, 1);
      for (let k = 1; k < g.level; k++) {
        ctx.fillStyle = C.gold;
        ctx.beginPath();
        ctx.arc(r.x + r.w - 3.5 - (k - 1) * 4, r.y + 3.5 + lift, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      if (g.count > 1) this.badge(r.x + r.w - 2, r.y + r.h - 2 + lift, `${g.count}`, '#3a4a6e');
    }

    // 세트 칩: 계열 아이콘 + 다음 목표, 단계는 점
    const [t1, t2] = state.config.sets.thresholds;
    setTypes.forEach((type, j) => {
      const r = setChipRect(j, tiles);
      const n = counts[type];
      const tier = setTier(state.config, n);
      const color = TYPE_INFO[type].color;
      pill(ctx, r, tier === 2 ? 'rgba(255, 209, 102, 0.18)' : C.glass, tier > 0 ? `${color}aa` : C.glassHi);
      ctx.save();
      ctx.translate(r.x + 3, r.y + 2);
      ctx.scale(0.9, 0.9);
      drawSprite(ctx, ICONS[type], 0, 0, 1);
      ctx.restore();
      text(ctx, tier === 2 ? '완성' : `${n}/${tier === 0 ? t1 : t2}`, r.x + 14, r.y + r.h / 2 + 0.5, tier > 0 ? color : C.dim, 6.5, 'left', true);
      for (let k = 0; k < tier; k++) {
        ctx.fillStyle = C.gold;
        ctx.beginPath();
        ctx.arc(r.x + r.w - 5 - k * 4, r.y + r.h / 2, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 마우스를 올린 무기·세트 설명
    const below = (setTypes.length ? setChipRect(0, tiles).y + OWNED.chipH : tileRect(0).y + OWNED.tileH) + 5;
    const hovered = ui.hoverOwned !== null ? groups[ui.hoverOwned] : undefined;
    if (hovered) {
      const w = state.weapons[hovered.indices[0]];
      const st = effectiveWeapon(state, w.def, counts, w.level);
      const key = `${hovered.id}:${hovered.level}`;
      const armed = ui.sellArmed?.key === key && ui.sellArmed.until > this.now;
      this.tip = {
        x: OWNED.x,
        y: below,
        w: 190,
        lines: [
          [`${hovered.name} ${'★'.repeat(hovered.level)}${hovered.count > 1 ? ` ×${hovered.count}` : ''}`, TYPE_INFO[hovered.type].color, 8.5],
          [`피해 ${formatNumber(st.damage)} · ${st.cooldown.toFixed(2)}초 · 사거리 ${Math.round(st.range)}`, C.text],
          [armed ? `한 번 더 누르면 ${sellPrice(w)}G 에 판매` : `두 번 누르면 판매 · ${sellPrice(w)}G`, armed ? '#ff9a9a' : C.dim],
        ],
      };
    } else if (ui.hoverChip !== null && setTypes[ui.hoverChip]) {
      const type = setTypes[ui.hoverChip];
      const [b1, b2] = state.config.sets.damageBonus;
      const n = counts[type];
      this.tip = {
        x: OWNED.x,
        y: below,
        w: 190,
        lines: [
          [`${TYPE_INFO[type].label} 세트 · ${n}개`, TYPE_INFO[type].color, 8.5],
          [`${t1}개: 피해 +${b1 * 100}%`, n >= t1 ? C.gold : C.dim],
          [`${t2}개: 피해 +${b2 * 100}% · ${SET_SPECIALS[type]}`, n >= t2 ? C.gold : C.dim],
        ],
      };
    }
  }

  /** 말풍선: 글자 크기에 맞춰 줄 높이를 잡는다 */
  private drawTip(): void {
    const tip = this.tip;
    this.tip = null;
    if (!tip) return;
    const { ctx, layout } = this;
    const h = tip.lines.reduce((sum, [, , size]) => sum + (size ?? 7.5) + 4, 0) + 8;
    const x = Math.max(4, Math.min(layout.width - tip.w - 4, tip.x));
    const y = tip.above ? tip.y - h : tip.y;
    panel(ctx, { x, y, w: tip.w, h }, 'rgba(12, 15, 24, 0.94)', 'rgba(255,255,255,0.14)');
    let yy = y + 6;
    for (const [str, color, size] of tip.lines) {
      const sz = size ?? 7.5;
      text(ctx, str, x + 8, yy + sz / 2, color, sz, 'left', sz > 8);
      yy += sz + 4;
    }
  }

  // ───────── 스킬 바 (둥근 버튼) ─────────

  private drawSkills(state: GameState, ui: UiState): void {
    const { ctx, layout } = this;
    const keys = ['Q', 'W', 'E', 'D'];
    const circle = (r: Rect, fill: string, stroke: string, width = 1) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(r.x + r.w / 2, r.y + r.h / 2, r.w / 2, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();
      ctx.beginPath();
      ctx.arc(r.x + r.w / 2, r.y + r.h / 2, r.w / 2 - 0.5, 0, Math.PI * 2);
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.stroke();
      ctx.lineWidth = 1;
    };
    layout.skills.forEach((r, i) => {
      const owned = state.skills[i];
      const hover = ui.hoverSkill === i;
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      if (!owned) {
        // 빈 칸: 평소엔 작은 점, 스킬 포인트가 있으면 배울 수 있다는 + 표시
        if (state.skillPoints <= 0) {
          ctx.beginPath();
          ctx.arc(cx, cy, 2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.18)';
          ctx.fill();
          return;
        }
        const glow = 0.5 + 0.5 * Math.sin(this.now * 4);
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.arc(cx, cy, r.w / 2 - 1, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(159, 224, 255, ${0.35 + 0.4 * glow})`;
        ctx.stroke();
        ctx.setLineDash([]);
        text(ctx, '+', cx, cy, '#9fe0ff', 10, 'center', true);
        return;
      }
      const def = findSkill(owned.id);
      const cd = skillCooldownLeft(state, owned.id);
      const ready = cd <= 0;
      const color = TAG_INFO[def.tags[0]].color;
      const combo = ready ? comboReady(state, owned.id) : null;
      const aiming = ui.aiming === owned.id;
      circle(r, hover || aiming ? 'rgba(40, 48, 72, 0.95)' : 'rgba(16, 20, 32, 0.85)', ready ? `${color}cc` : 'rgba(255,255,255,0.12)', ready ? 1.5 : 1);
      const icon = SKILL_ICONS[owned.id];
      if (icon) drawSprite(ctx, icon, cx - 9, cy - 9, 2, false);
      if (cd > 0) {
        // 재사용 대기: 시계 방향으로 걷히는 그림자 + 남은 초
        const full = def.cooldown * (state.perks.includes('skill_master') ? 0.7 : 1) * state.skillCooldownMul;
        const frac = Math.min(1, cd / full);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r.w / 2 - 1, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = 'rgba(6, 8, 13, 0.68)';
        ctx.fill();
        text(ctx, `${Math.ceil(cd)}`, cx, cy + 0.5, '#ffffff', 9, 'center', true);
      } else if (combo) {
        const c = TAG_INFO[combo.to].color;
        ctx.strokeStyle = c;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r.w / 2 + 2 + Math.sin(this.now * 10) * 1.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
        const label = combo.name;
        ctx.font = `700 7px ${FONT}`;
        const lw = ctx.measureText(label).width + 10;
        pill(ctx, { x: cx - lw / 2, y: r.y - 14, w: lw, h: 11 }, 'rgba(12,15,24,0.9)', c);
        text(ctx, label, cx, r.y - 8.5, c, 7, 'center', true);
      }
      if (owned.evolved || def.tier === 'fused') {
        ctx.fillStyle = C.gold;
        ctx.beginPath();
        ctx.arc(r.x + r.w - 3, r.y + 3, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      // 단축키
      text(ctx, keys[i], r.x + r.w - 2, r.y + r.h - 1, ready ? C.text : C.dim, 6.5, 'center', true);
    });

    // 스킬 트리 버튼 (포인트가 있으면 반짝이는 배지)
    const b = layout.treeButton;
    const sp = state.skillPoints;
    circle(b, ui.hoverButton === 'tree' ? 'rgba(40, 48, 72, 0.95)' : 'rgba(16, 20, 32, 0.85)', sp > 0 ? '#9fe0ffcc' : 'rgba(255,255,255,0.12)', sp > 0 ? 1.5 : 1);
    // 가지 뻗은 나무 모양
    const bx = b.x + b.w / 2;
    const by = b.y + b.h / 2;
    ctx.strokeStyle = sp > 0 ? '#9fe0ff' : C.text;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(bx, by + 6);
    ctx.lineTo(bx, by - 1);
    ctx.moveTo(bx, by + 1);
    ctx.lineTo(bx - 5, by - 5);
    ctx.moveTo(bx, by + 1);
    ctx.lineTo(bx + 5, by - 5);
    ctx.stroke();
    ctx.lineWidth = 1;
    for (const [dx, dy] of [[0, -2], [-5, -6], [5, -6]]) {
      ctx.beginPath();
      ctx.arc(bx + dx, by + dy, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = sp > 0 ? '#9fe0ff' : C.text;
      ctx.fill();
    }
    text(ctx, 'T', b.x + b.w - 2, b.y + b.h - 1, C.dim, 6.5, 'center', true);
    if (sp > 0) this.badge(b.x + b.w - 3, b.y + 3, `${sp}`, C.red);

    const hovered = typeof ui.hoverSkill === 'number' ? state.skills[ui.hoverSkill] : undefined;
    if (hovered) {
      const def = findSkill(hovered.id);
      const r = layout.skills[ui.hoverSkill!];
      this.tip = {
        x: r.x + r.w / 2 - 95,
        y: r.y - 6,
        w: 190,
        above: true,
        lines: [
          [`${skillName(hovered.id, hovered.evolved)} · ${def.cooldown}초`, TAG_INFO[def.tags[0]].color, 8.5],
          [hovered.evolved && def.evolve ? def.evolve.desc : def.desc, C.text],
          [`속성 ${def.tags.map((tg) => TAG_INFO[tg].label).join(' · ')}`, C.dim],
        ],
      };
    } else if (ui.hoverButton === 'tree') {
      this.tip = { x: b.x + b.w / 2 - 80, y: b.y - 6, w: 160, above: true, lines: [['스킬 트리 [T]', '#9fe0ff', 8.5], [sp > 0 ? `스킬 포인트 ${sp} · 배우기·진화·합체` : '3라운드마다 스킬 포인트', C.dim]] };
    }
  }

  // ───────── 상점 (아래쪽 작은 카드 한 줄) ─────────

  private drawShop(state: GameState, ui: UiState): void {
    const { ctx, layout } = this;
    const counts = weaponCounts(state);
    layout.cards.forEach((r, i) => this.drawCard(r, state.shop[i], i, state, counts, ui.hover === i && ui.started));

    const cost = rerollCost(state);
    const can = state.gold >= cost;
    const rr = layout.reroll;
    const hover = ui.hoverButton === 'reroll';
    panel(ctx, { ...rr, y: rr.y - (hover && can ? 1 : 0) }, hover ? 'rgba(40, 48, 72, 0.92)' : C.glass, hover ? 'rgba(255,255,255,0.3)' : C.glassHi, undefined, 8);
    text(ctx, '⟳', rr.x + rr.w / 2, rr.y + 16, can ? C.text : C.dim, 14, 'center', true);
    text(ctx, cost === 0 ? '무료' : `${cost}`, rr.x + rr.w / 2, rr.y + 34, can ? C.gold : '#ff8080', 7.5, 'center', true);
    text(ctx, 'R', rr.x + rr.w - 6, rr.y + 7, C.dim, 6, 'center');
    if (hover) this.tip = { x: rr.x + rr.w / 2 - 60, y: rr.y - 6, w: 120, above: true, lines: [['새로 고침 [R]', C.text, 8.5], [cost === 0 ? '이번 라운드 첫 리롤은 공짜' : `${cost}G · 할 때마다 비싸짐`, C.dim]] };
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
    let dy = hover && item ? -3 : 0;
    let scaleX = 1;
    if (anim?.kind === 'deny' && age < 0.3) dx = Math.sin(age * 60) * 3 * (1 - age / 0.3);
    if (anim?.kind === 'flip' && age < 0.25) scaleX = age < 0 ? 1 : Math.abs(Math.cos((age / 0.25) * Math.PI));
    if (anim?.kind === 'buy' && age < 0.25) dy -= 5 * easeOutCubic(1 - age / 0.25);

    ctx.save();
    ctx.translate(r.x + r.w / 2 + dx, r.y + r.h / 2 + dy);
    ctx.scale(scaleX, 1);
    const box = { x: -r.w / 2, y: -r.h / 2, w: r.w, h: r.h };

    if (!item) {
      roundRect(ctx, box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1, 8);
      ctx.fillStyle = 'rgba(16, 20, 32, 0.35)';
      ctx.fill();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.stroke();
      ctx.setLineDash([]);
      const c = state.config;
      const last = state.mode === 'classic' && state.round >= c.totalRounds;
      text(ctx, last ? '품절' : `${Math.ceil(c.roundSeconds - state.roundTime)}초`, 0, 0, 'rgba(255,255,255,0.35)', 8, 'center', true);
      if (anim?.kind === 'buy' && age < 0.25) {
        ctx.globalAlpha = 1 - age / 0.25;
        roundRect(ctx, box.x, box.y, box.w, box.h, 8);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      return;
    }

    const legendary = LEGENDARY.has(item.id);
    const color = legendary ? C.gold : item.kind === 'weapon' ? TYPE_INFO[item.type].color : C.gold;
    const price = priceOf(state, item);
    const check = canBuy(state, index);
    const affordable = state.gold >= price;
    const noSlot = !check.ok && check.reason === 'slots';
    const merges = mergesOnBuy(state, item);
    const usable = affordable && !noSlot;
    panel(
      ctx,
      box,
      legendary ? 'rgba(60, 48, 20, 0.9)' : hover ? 'rgba(36, 44, 66, 0.94)' : 'rgba(16, 20, 32, 0.82)',
      hover || legendary ? `${color}dd` : 'rgba(255,255,255,0.10)',
      undefined,
      8,
    );
    // 위쪽 계열 색 띠
    roundRect(ctx, box.x + 8, box.y + 1, box.w - 16, 2, 1);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = usable ? 1 : 0.4;
    const art = item.kind === 'weapon' ? WEAPON_ICONS[item.id] : ICONS.upgrade;
    if (art) drawSprite(ctx, art, -art.width, box.y + 6 + (hover ? Math.round(Math.sin(this.now * 8)) : 0), 2);
    text(ctx, item.name, 0, box.y + box.h - 9, legendary ? C.gold : '#ffffff', 7.5, 'center', true);
    ctx.globalAlpha = 1;
    // 가격 (오른쪽 위)
    text(ctx, `${price}`, box.x + box.w - 5, box.y + 9, affordable ? (price < item.price ? '#8fd16a' : C.gold) : '#ff8080', 7, 'right', true);
    // 왼쪽 위: 번호 · 합성/칸 부족 알림
    const hasBadge = merges || noSlot || (item.kind === 'weapon' && state.config.sets.thresholds.includes(counts[item.type] + 1));
    if (!hasBadge) text(ctx, `${index + 1}`, box.x + 6, box.y + 9, 'rgba(255,255,255,0.35)', 6.5, 'left', true);
    const blink = Math.floor(this.now * 3) % 2 === 0;
    if (merges) this.badgeText(box.x + 3, box.y + 4, '★2', blink ? '#ffffff' : C.gold);
    else if (noSlot) this.badgeText(box.x + 3, box.y + 4, '칸 없음', '#ff8080');
    else if (item.kind === 'weapon' && state.config.sets.thresholds.includes(counts[item.type] + 1)) this.badgeText(box.x + 3, box.y + 4, '세트', blink ? '#ffffff' : color);
    ctx.restore();

    if (hover) {
      const lines: [string, string, number?][] = [[`${item.name}${legendary ? ' · 전설' : ''}`, color, 9]];
      if (item.kind === 'weapon') {
        lines.push([`${TYPE_INFO[item.type].label} · 피해 ${item.damage} · ${item.cooldown}초 · 사거리 ${item.range}`, C.text]);
        lines.push([item.desc, C.dim]);
        const after = counts[item.type] + 1;
        if (merges) lines.push(['사면 같은 무기 3개가 ★2 로 합쳐진다', C.gold]);
        else lines.push([`${TYPE_INFO[item.type].label} 세트 ${after}개째`, state.config.sets.thresholds.includes(after) ? C.gold : C.dim]);
      } else {
        lines.push([item.desc, C.text]);
      }
      if (noSlot) lines.push(['무기 칸이 꽉 찼다 · 팔거나 합성하자', '#ff8080']);
      else if (!affordable) lines.push([`골드가 ${price - Math.floor(state.gold)} 모자라다`, '#ff8080']);
      this.tip = { x: r.x + r.w / 2 - 105, y: r.y - 6, w: 210, above: true, lines };
    }
  }

  /** 카드 위 작은 글자 딱지 */
  private badgeText(x: number, y: number, label: string, color: string): void {
    const { ctx } = this;
    ctx.font = `700 6.5px ${FONT}`;
    const w = ctx.measureText(label).width + 6;
    pill(ctx, { x, y, w, h: 9 }, 'rgba(12,15,24,0.9)', `${color}99`);
    text(ctx, label, x + w / 2, y + 4.8, color, 6.5, 'center', true);
  }

  /** 띄어쓰기 단위로 줄을 바꾸고, 한 단어가 너무 길 때만 글자 단위로 자른다 */
  private wrap(str: string, x: number, y: number, maxW: number, lineH: number, color: string, maxLines = 2, size = 8, align: CanvasTextAlign = 'left'): void {
    const { ctx } = this;
    ctx.font = `500 ${size}px ${FONT}`;
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
    lines.slice(0, maxLines).forEach((l, k) => text(ctx, l, x, y + k * lineH, color, size, align));
  }

  // ───────── 첫 판 안내 ─────────

  private drawHint(state: GameState, progress: TutorialProgress): void {
    const hint = tutorialHint(state, progress);
    if (!hint) return;
    const { ctx, layout } = this;
    ctx.font = `500 7.5px ${FONT}`;
    const w = Math.max(ctx.measureText(hint.text).width, 60) + 24;
    const y = layout.skills[0].y - 30;
    const box = { x: layout.width / 2 - w / 2, y, w, h: 22 };
    const pulse = 0.5 + 0.5 * Math.sin(this.now * 4);
    panel(ctx, box, 'rgba(12, 15, 24, 0.9)', `rgba(255, 209, 102, ${0.4 + 0.4 * pulse})`, undefined, 11);
    text(ctx, hint.title, box.x + box.w / 2, box.y + 7, C.gold, 7.5, 'center', true);
    text(ctx, hint.text, box.x + box.w / 2, box.y + 16, C.text, 7, 'center');
  }

  // ───────── 배너 (위쪽 가운데 작은 알림, 최대 두 개) ─────────

  private drawBanners(): void {
    const { ctx, layout } = this;
    this.banners = this.banners.filter((b) => this.now - b.born < b.life);
    const cx = layout.width / 2;
    let slot = 0;
    const center = this.banners.filter((b) => b.style !== 'boss').slice(-2).reverse();
    for (const b of this.banners) {
      const age = this.now - b.born;
      const p = age / b.life;
      const fade = p > 0.8 ? (1 - p) / 0.2 : Math.min(1, age / 0.15);
      ctx.globalAlpha = fade;
      if (b.style === 'boss') {
        // 가운데를 가로지르는 얇은 경고 띠
        const slide = easeOutCubic(Math.min(1, age / 0.4));
        const y = 112;
        const g = ctx.createLinearGradient(0, 0, layout.width, 0);
        g.addColorStop(0, 'rgba(120, 10, 20, 0)');
        g.addColorStop(0.5, 'rgba(120, 10, 20, 0.75)');
        g.addColorStop(1, 'rgba(120, 10, 20, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, y - 20, layout.width, 40);
        ctx.fillStyle = 'rgba(255, 120, 120, 0.5)';
        ctx.fillRect(layout.width * 0.2, y - 20, layout.width * 0.6 * slide, 1);
        ctx.fillRect(layout.width * (0.8 - 0.6 * slide), y + 19, layout.width * 0.6 * slide, 1);
        text(ctx, b.title, cx + (1 - slide) * -80, y - 4, '#ffd6d6', 15, 'center', true);
        if (b.sub) text(ctx, b.sub, cx + (1 - slide) * 80, y + 10, '#ffb0b0', 7.5, 'center');
      } else {
        const i = center.indexOf(b);
        if (i < 0) continue;
        const drop = easeOutBack(Math.min(1, age / 0.3));
        ctx.font = `700 ${b.style === 'round' ? 11 : 9}px ${FONT}`;
        const tw = ctx.measureText(b.title).width;
        ctx.font = `500 7px ${FONT}`;
        const sw = b.sub ? ctx.measureText(b.sub).width : 0;
        const w = Math.max(tw, sw) + 28;
        const h = b.sub ? 28 : 20;
        const y = 76 + i * 34 - (1 - drop) * 10;
        panel(ctx, { x: cx - w / 2, y: y - h / 2, w, h }, 'rgba(12, 15, 24, 0.88)', `${b.color}88`, undefined, h / 2);
        text(ctx, b.title, cx, y - (b.sub ? 5 : 0), b.color, b.style === 'round' ? 11 : 9, 'center', true);
        if (b.sub) text(ctx, b.sub, cx, y + 7, C.text, 7, 'center');
        slot++;
      }
      ctx.globalAlpha = 1;
    }
    void slot;
  }

  // ───────── 오버레이 ─────────

  private dim(alpha: number): void {
    this.ctx.fillStyle = `rgba(6, 8, 13, ${alpha})`;
    this.ctx.fillRect(0, 0, this.layout.width, this.layout.height);
  }

  /** 보상 카드 3장 중 1장 고르기 (게임은 멈춰 있다) */
  private overlayChoice(state: GameState, ui: UiState): void {
    const { ctx, layout } = this;
    ctx.fillStyle = 'rgba(6, 8, 13, 0.72)';
    ctx.fillRect(0, 0, layout.width, layout.fieldHeight);
    text(ctx, `${state.round}라운드 보상`, layout.width / 2, layout.perkCards[0].y - 22, '#ffffff', 13, 'center', true);
    text(ctx, '하나 고르기 · 1 2 3', layout.width / 2, layout.perkCards[0].y - 9, C.dim, 7.5, 'center');
    const since = this.now - this.choiceAt(state);
    state.choice!.forEach((id, i) => {
      const perk = findPerk(id);
      const look = PERK_LOOK[id] ?? { icon: 'upgrade', color: '#c77dff', tag: '특전' };
      const r = layout.perkCards[i];
      const appear = easeOutCubic(Math.min(1, Math.max(0, (since - i * 0.07) / 0.3)));
      if (appear <= 0) return;
      const hover = ui.hoverChoice === i;
      ctx.save();
      ctx.globalAlpha = appear;
      ctx.translate(r.x + r.w / 2, r.y + r.h / 2 + (hover ? -5 : 0) + (1 - appear) * 16);
      const box = { x: -r.w / 2, y: -r.h / 2, w: r.w, h: r.h };
      panel(ctx, box, hover ? 'rgba(30, 34, 52, 0.96)' : 'rgba(18, 22, 34, 0.92)', hover ? `${look.color}dd` : C.glassHi, undefined, 14);
      // 아이콘 뒤 은은한 빛
      const g = ctx.createRadialGradient(0, box.y + 44, 4, 0, box.y + 44, 46);
      g.addColorStop(0, `${look.color}${hover ? '55' : '30'}`);
      g.addColorStop(1, `${look.color}00`);
      ctx.fillStyle = g;
      ctx.fillRect(box.x + 4, box.y + 4, box.w - 8, 84);
      const icon = ICONS[look.icon] ?? ICONS.upgrade;
      const bob = Math.round(Math.sin(this.now * 3 + i) * 2);
      drawSprite(ctx, icon, -icon.width * 1.5, box.y + 30 + bob, 3);
      ctx.font = `700 6.5px ${FONT}`;
      const tw = ctx.measureText(look.tag).width + 12;
      pill(ctx, { x: -tw / 2, y: box.y + 10, w: tw, h: 12 }, `${look.color}22`, `${look.color}66`);
      text(ctx, look.tag, 0, box.y + 16.5, look.color, 6.5, 'center', true);
      text(ctx, perk.name, 0, box.y + 86, '#ffffff', 11, 'center', true);
      this.wrap(perk.desc, 0, box.y + 102, box.w - 24, 10, C.dim, 3, 7.5, 'center');
      const evolves = BASE_SKILLS.find((k) => k.evolve?.perk === id && state.skills.some((o) => o.id === k.id && !o.evolved));
      if (evolves) text(ctx, `✦ ${evolves.name} → ${evolves.evolve!.name} 진화 무료`, 0, box.y + box.h - 12, C.gold, 7, 'center', true);
      text(ctx, `${i + 1}`, box.x + 10, box.y + 13, 'rgba(255,255,255,0.3)', 7, 'left', true);
      ctx.restore();
    });
  }

  /** 스킬 트리: 1단 배우기 · 2단 진화 · 3단 합체 (게임은 멈춰 있다) */
  private overlayTree(state: GameState, ui: UiState): void {
    const { ctx, layout } = this;
    const tr = layout.tree;
    ctx.fillStyle = 'rgba(6, 8, 13, 0.88)';
    ctx.fillRect(0, 0, layout.width, layout.fieldHeight);
    text(ctx, '스킬 트리', tr.base[0].rect.x, 20, '#ffffff', 13, 'left', true);
    text(ctx, `칸 ${state.skills.length}/${state.config.skills.slots} · 배우기 ${SKILL.learnCost} · 진화 ${SKILL.evolveCost}(짝 특전이 있으면 0) · 합체 ${SKILL.fuseCost}`, tr.base[0].rect.x + 70, 21, C.dim, 6.5);
    const sp = state.skillPoints;
    text(ctx, `스킬 포인트 ${sp}`, layout.width - tr.base[0].rect.x, 20, sp > 0 ? '#9fe0ff' : C.dim, 9, 'right', true);

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
      const fill = opts.state === 'done' ? 'rgba(255, 209, 102, 0.14)' : opts.state === 'ready' ? 'rgba(124, 196, 255, 0.14)' : 'rgba(16, 20, 32, 0.85)';
      const border = opts.state === 'done' ? `${C.gold}aa` : opts.state === 'ready' ? '#9fe0ffaa' : opts.hover ? 'rgba(255,255,255,0.3)' : C.glassHi;
      const lift = opts.hover && opts.state === 'ready' ? -1 : 0;
      ctx.globalAlpha = opts.state === 'gone' ? 0.35 : opts.state === 'locked' ? 0.6 : 1;
      panel(ctx, { ...r, y: r.y + lift }, fill, border, undefined, 8);
      def.tags.forEach((tag, k) => {
        ctx.fillStyle = TAG_INFO[tag].color;
        ctx.fillRect(r.x + 8 + k * ((r.w - 16) / def.tags.length), r.y + lift + 1, (r.w - 16) / def.tags.length, 1.5);
      });
      const icon = SKILL_ICONS[opts.id];
      if (icon) drawSprite(ctx, icon, r.x + 5, r.y + lift + Math.round((r.h - 9) / 2), 1);
      text(ctx, opts.title, r.x + 17, r.y + lift + r.h / 2 - 5, opts.state === 'done' ? C.gold : '#ffffff', 8, 'left', true);
      text(ctx, opts.sub, r.x + 17, r.y + lift + r.h / 2 + 6, opts.subColor, 6, 'left');
      if (opts.state === 'ready') {
        ctx.globalAlpha *= 0.4 + 0.4 * Math.sin(this.now * 4);
        roundRect(ctx, r.x - 1, r.y + lift - 1, r.w + 2, r.h + 2, 9);
        ctx.strokeStyle = main;
        ctx.stroke();
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
    panel(ctx, d, 'rgba(16, 20, 32, 0.9)', C.glassHi, undefined, 10);
    if (hov && 'id' in hov) {
      const def = findSkill(hov.id);
      const tags = def.tags.map((tg) => TAG_INFO[tg].label).join('·');
      if (hov.kind === 'evolve') {
        text(ctx, `${def.name} 진화 → ${def.evolve!.name}`, d.x + 10, d.y + 11, C.gold, 8.5, 'left', true);
        text(ctx, def.evolve!.desc, d.x + 10, d.y + 24, C.text, 7.5);
        text(ctx, `짝 특전 「${findPerk(def.evolve!.perk).name}」을 가지고 있으면 공짜`, d.x + 10, d.y + 37, C.dim, 6.5);
      } else {
        text(ctx, `${def.name} · ${tags} · 재사용 ${def.cooldown}초`, d.x + 10, d.y + 11, TAG_INFO[def.tags[0]].color, 8.5, 'left', true);
        text(ctx, def.desc, d.x + 10, d.y + 24, C.text, 7.5);
        if (def.recipe) {
          const [a, b] = def.recipe.map((r) => findSkill(r).name);
          text(ctx, `${a} 와 ${b} 를 가지고 있으면 합친다 · 칸이 하나 빈다 · 진화한 재료 하나당 +30%`, d.x + 10, d.y + 37, C.dim, 6.5);
        } else text(ctx, `배우면 빈 칸에 들어간다 · 합체 재료가 될 수 있다`, d.x + 10, d.y + 37, C.dim, 6.5);
      }
    } else {
      text(ctx, '콤보 · 속성이 이어지게 4초 안에 연달아 쓰면 추가 효과', d.x + 10, d.y + 11, C.text, 8, 'left', true);
      COMBOS.forEach((c, k) => {
        const x = d.x + 10 + (k % 3) * 190;
        const y = d.y + 25 + Math.floor(k / 3) * 12;
        text(ctx, `${TAG_INFO[c.from].label} → ${TAG_INFO[c.to].label}  ${c.name}`, x, y, TAG_INFO[c.to].color, 7);
      });
    }
    button(ctx, tr.close, '닫기', hov?.kind === 'close' ? 'hover' : 'normal');
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
    this.dim(0.5);
    const { width, height } = this.layout;
    const box = { x: width / 2 - 90, y: height / 2 - 26, w: 180, h: 52 };
    panel(this.ctx, box, 'rgba(12, 15, 24, 0.92)', C.glassHi, undefined, 12);
    text(this.ctx, '일시정지', width / 2, box.y + 19, '#ffffff', 13, 'center', true);
    text(this.ctx, 'Space 로 계속', width / 2, box.y + 36, C.dim, 7.5, 'center');
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
    // 전장이 비쳐 보이게, 위아래만 살짝 어둡게
    this.dim(0.28);
    const top = ctx.createLinearGradient(0, 0, 0, fieldHeight);
    top.addColorStop(0, 'rgba(6, 8, 13, 0.7)');
    top.addColorStop(0.45, 'rgba(6, 8, 13, 0.25)');
    top.addColorStop(1, 'rgba(6, 8, 13, 0.7)');
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, width, fieldHeight);

    // 적 행렬이 맨 아래를 지나간다
    const parade = ['goblin', 'wolf', 'slime', 'orc', 'bat', 'golem', 'thief', 'shield', 'boss_rhino'];
    parade.forEach((id, i) => {
      const frames = ENEMY_SPRITES[id];
      const f = frames[walkFrame(this.now, i, frames.length, 6)];
      const x = ((this.now * 24 + i * 78) % (width + 120)) - 60;
      ctx.globalAlpha = 0.85;
      drawSprite(ctx, f, x, fieldHeight - 4 - f.height, 1, false);
      ctx.globalAlpha = 1;
    });

    this.drawTitle(24, 28);
    this.drawShards(ui.meta.shards);

    // 탑 고르기
    for (const { id, rect } of layout.heroes) this.drawHeroCard(ui, id, rect);
    const hero = findHero(ui.hero);
    const weapon = findItem(hero.startWeapons[0]).name;
    text(ctx, `"${hero.quote}"`, width / 2, 158, hero.color, 8.5, 'center', true);
    text(ctx, `시작 무기 ${weapon} · ${hero.desc}`, width / 2, 170, C.dim, 7, 'center');

    // 모드: 두 칸짜리 토글
    const m0 = layout.modes[0].rect;
    const m1 = layout.modes[1].rect;
    pill(ctx, { x: m0.x, y: m0.y, w: m1.x + m1.w - m0.x, h: m0.h });
    for (const { id, rect } of layout.modes) {
      const sel = ui.mode === id;
      if (sel) pill(ctx, { x: rect.x + 2, y: rect.y + 2, w: rect.w - 4, h: rect.h - 4 }, 'rgba(255, 209, 102, 0.22)', `${C.gold}aa`);
      else if (ui.hoverStart === `mode:${id}`) pill(ctx, { x: rect.x + 2, y: rect.y + 2, w: rect.w - 4, h: rect.h - 4 }, 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0)');
      text(ctx, id === 'classic' ? '클래식' : '무한', rect.x + rect.w / 2, rect.y + rect.h / 2 + 0.5, sel ? C.gold : C.dim, 8.5, 'center', true);
    }
    text(ctx, ui.mode === 'classic' ? '15라운드 보스를 잡으면 끝' : '15라운드마다 보스, 끝없이', width / 2, m0.y + m0.h + 6, C.dim, 6.5, 'center');

    // 난이도 (누르면 바로 시작)
    layout.difficulty.forEach(({ id, rect }, i) => {
      const d = DIFFICULTIES[i];
      const sel = ui.difficulty === id;
      const r = { ...rect, y: rect.y + (sel ? -2 : 0) };
      panel(ctx, r, sel ? 'rgba(255, 209, 102, 0.16)' : 'rgba(16, 20, 32, 0.8)', sel ? `${C.gold}cc` : C.glassHi, undefined, 10);
      text(ctx, d.name, r.x + r.w / 2, r.y + 11, sel ? C.gold : '#ffffff', 10, 'center', true);
      text(ctx, d.desc, r.x + r.w / 2, r.y + 23, C.dim, 6.5, 'center');
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
      text(ctx, record, r.x + r.w / 2, r.y + 33, good ? C.gold : 'rgba(255,255,255,0.5)', 6.5, 'center');
      text(ctx, `${i + 1}`, r.x + 8, r.y + 9, 'rgba(255,255,255,0.3)', 6.5, 'left', true);
    });

    // 강화 상점 · 업적
    const buyable = META_UPGRADES.some((u) => {
      const c = nextCost(ui.meta, u.id);
      return c !== null && c <= ui.meta.shards;
    });
    const mb = layout.metaButton;
    button(ctx, mb, '', ui.hoverStart === 'meta' ? 'hover' : 'normal');
    text(ctx, '강화 상점', mb.x + mb.w / 2, mb.y + mb.h / 2 + 0.5, buyable ? C.gold : C.text, 8, 'center', true);
    if (buyable) this.badge(mb.x + mb.w - 6, mb.y + 5, '!', C.red);
    const ab = layout.achButton;
    button(ctx, ab, '', ui.hoverStart === 'achievements' ? 'hover' : 'normal');
    text(ctx, `업적 ${ui.meta.achievements.length}/${ACHIEVEMENTS.length}`, ab.x + ab.w / 2, ab.y + ab.h / 2 + 0.5, C.text, 8, 'center', true);

    this.overlayFx.draw(ctx, width, fieldHeight);
    const pulse = 0.55 + 0.45 * Math.sin(this.now * 3);
    ctx.globalAlpha = pulse;
    text(ctx, '난이도를 누르거나 Enter 로 시작', width / 2, 306, C.gold, 8, 'center', true);
    ctx.globalAlpha = 1;
    // 팁이 몇 초마다 바뀐다
    const tip = TIPS[Math.floor(this.now / 5) % TIPS.length];
    const phase = (this.now % 5) / 5;
    ctx.globalAlpha = Math.min(1, phase * 8, (1 - phase) * 8) * 0.9;
    text(ctx, tip, width / 2, 320, '#bfe3ff', 7, 'center');
    ctx.globalAlpha = 1;
    text(ctx, '←→ 탑 · ↑↓ 난이도 · Tab 모드 · S 강화 · A 업적', 10, fieldHeight - 30, 'rgba(255,255,255,0.35)', 6.5);
    if (ui.meta.runs > 0) text(ctx, `${ui.meta.runs}판째`, width - 10, fieldHeight - 30, 'rgba(255,255,255,0.35)', 6.5, 'right');
  }

  /** 제목: 금빛 그라데이션에 은은한 빛, 천천히 떠오른다 */
  private drawTitle(x: number, y: number): void {
    const { ctx } = this;
    const bob = Math.sin(this.now * 1.6) * 1.2;
    ctx.save();
    ctx.font = `800 20px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const g = ctx.createLinearGradient(0, y - 10, 0, y + 10);
    g.addColorStop(0, '#fff3c4');
    g.addColorStop(1, '#ffc24a');
    ctx.shadowColor = 'rgba(255, 190, 80, 0.45)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = g;
    ctx.fillText('탑 수호자', x, y + bob);
    const w = ctx.measureText('탑 수호자').width;
    ctx.restore();
    text(ctx, '사방에서 몰려오는 적, 가운데 탑 하나', x + w + 10, y + 2, 'rgba(255,255,255,0.6)', 7.5);
  }

  /** 오른쪽 위 별조각 */
  private drawShards(n: number): void {
    const { ctx, layout } = this;
    ctx.font = `700 8.5px ${FONT}`;
    const label = `✦ ${n}`;
    const w = ctx.measureText(label).width + 18;
    const r = { x: layout.width - w - 10, y: 16, w, h: 20 };
    pill(ctx, r);
    text(ctx, label, r.x + r.w / 2, r.y + 10.5, '#9fe0ff', 8.5, 'center', true);
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
    panel(ctx, r, sel ? 'rgba(30, 34, 50, 0.92)' : 'rgba(16, 20, 32, 0.78)', sel ? `${hero.color}dd` : hover ? 'rgba(255,255,255,0.3)' : C.glassHi, undefined, 12);
    const s = TOWER_SPRITE;
    const left = Math.round(r.x + r.w / 2 - s.width / 2);
    const top = Math.round(r.y + 10 + (sel ? Math.sin(this.now * 3) * 2 : 0));
    if (sel) {
      const g = ctx.createRadialGradient(r.x + r.w / 2, top + 24, 2, r.x + r.w / 2, top + 24, 40);
      g.addColorStop(0, `${hero.color}55`);
      g.addColorStop(1, `${hero.color}00`);
      ctx.fillStyle = g;
      ctx.fillRect(r.x + 2, r.y + 2, r.w - 4, 58);
      if (Math.random() < 0.15) this.overlayFx.sparkle({ x: r.x + 20 + Math.random() * (r.w - 40), y: top + 10 + Math.random() * 30 }, hero.color);
    }
    ctx.globalAlpha = unlocked ? 1 : 0.25;
    drawSprite(ctx, s, left, top, 1, false, 'normal');
    this.drawTowerTrim(left, top, 1, unlocked ? hero.color : '#5a6078');
    ctx.globalAlpha = 1;
    text(ctx, hero.name, r.x + r.w / 2, r.y + 64, unlocked ? (sel ? hero.color : '#ffffff') : 'rgba(255,255,255,0.4)', 9, 'center', true);
    if (!unlocked) {
      const cost = nextCost(ui.meta, `hero_${id}`);
      // 자물쇠
      const lx = r.x + r.w / 2;
      const ly = r.y + 32;
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(lx, ly - 2, 3.5, Math.PI, 0);
      ctx.stroke();
      ctx.lineWidth = 1;
      roundRect(ctx, lx - 5.5, ly - 2, 11, 8, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fill();
      text(ctx, `✦ ${cost}`, r.x + r.w / 2, r.y + 77, '#9fe0ff', 7, 'center', true);
      return;
    }
    const wins = ui.meta.heroWins.includes(id);
    text(ctx, findItem(hero.startWeapons[0]).name, r.x + r.w / 2, r.y + 76, C.dim, 6.5, 'center');
    if (wins) this.badge(r.x + r.w - 9, r.y + 9, '✓', '#3aa86b');
  }

  /** 강화 상점·업적 화면 공통 머리 */
  private screenHeader(title: string, sub: string): void {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(6, 8, 13, 0.82)';
    ctx.fillRect(0, 0, this.layout.width, this.layout.height);
    text(ctx, title, 24, 26, '#ffffff', 15, 'left', true);
    ctx.font = `700 15px ${FONT}`;
    const w = ctx.measureText(title).width;
    text(ctx, sub, 24 + w + 10, 27, C.dim, 7.5);
  }

  private overlayMeta(ui: UiState): void {
    const { ctx, layout } = this;
    this.screenHeader('강화 상점', '판이 끝날 때마다 별조각이 쌓인다 · 강화는 모든 판에 적용');
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
      const rr = { ...r, y: r.y - (hover && !maxed ? 1 : 0) };
      panel(ctx, rr, maxed ? 'rgba(30, 50, 36, 0.85)' : hover ? 'rgba(36, 44, 66, 0.94)' : 'rgba(16, 20, 32, 0.85)', maxed ? 'rgba(95, 214, 138, 0.5)' : hover ? `${color}cc` : C.glassHi, undefined, 10);
      if (flash > 0) {
        ctx.globalAlpha = flash * 0.4;
        roundRect(ctx, rr.x, rr.y, rr.w, rr.h, 10);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      // 오른쪽 그림: 탑이면 깃발 색 탑, 무기면 무기 아이콘, 강화면 효과 아이콘
      if (u.kind === 'hero') {
        const ts = TOWER_SPRITE;
        const sc = 0.7;
        const tl = Math.round(rr.x + rr.w - 30);
        const tt = Math.round(rr.y + 9);
        ctx.drawImage(spriteImage(ts), tl, tt, ts.width * sc, ts.height * sc);
        ctx.fillStyle = color;
        ctx.fillRect(tl + 10, tt - 3, 5, 3);
      } else {
        const art = u.kind === 'weapon' ? WEAPON_ICONS[u.id.slice(7)] : ICONS[META_ICONS[u.id] ?? 'upgrade'];
        if (art) drawSprite(ctx, art, rr.x + rr.w - 32, rr.y + 10, 2);
      }
      const tag = u.kind === 'hero' ? '탑' : u.kind === 'weapon' ? '전설 무기' : '강화';
      text(ctx, tag, rr.x + 10, rr.y + 10, color, 6.5, 'left', true);
      text(ctx, u.name, rr.x + 10, rr.y + 21, '#ffffff', 9.5, 'left', true);
      this.wrap(u.desc, rr.x + 10, rr.y + 32, rr.w - 48, 8, C.dim, 2, 6.5);
      // 단계 점
      for (let k = 0; k < u.costs.length; k++) {
        ctx.beginPath();
        ctx.arc(rr.x + 12 + k * 7, rr.y + 48, 2, 0, Math.PI * 2);
        ctx.fillStyle = k < lv ? C.gold : 'rgba(255,255,255,0.15)';
        ctx.fill();
      }
      if (maxed) text(ctx, u.kind === 'stat' ? '최고 단계' : '해금됨', rr.x + rr.w - 10, rr.y + 48, C.green, 7, 'right', true);
      else text(ctx, `✦ ${cost}`, rr.x + rr.w - 10, rr.y + 48, affordable ? '#9fe0ff' : '#ff8080', 8, 'right', true);
    });
    button(ctx, layout.back, '돌아가기', ui.hoverStart === 'back' ? 'hover' : 'normal');
    this.overlayFx.draw(ctx, layout.width, layout.height);
  }

  private overlayAchievements(ui: UiState): void {
    const { ctx, layout } = this;
    const got = new Set(ui.meta.achievements);
    this.screenHeader(`업적 ${got.size}/${ACHIEVEMENTS.length}`, '처음 달성하면 별조각을 준다');
    ACHIEVEMENTS.forEach((a, i) => {
      const r = layout.achRows[i];
      const done = got.has(a.id);
      panel(ctx, r, done ? 'rgba(255, 209, 102, 0.12)' : 'rgba(16, 20, 32, 0.8)', done ? `${C.gold}88` : C.glassHi, undefined, 10);
      ctx.beginPath();
      ctx.arc(r.x + 15, r.y + r.h / 2, 7, 0, Math.PI * 2);
      ctx.fillStyle = done ? C.gold : 'rgba(255,255,255,0.08)';
      ctx.fill();
      if (done) text(ctx, '✓', r.x + 15, r.y + r.h / 2 + 0.5, '#1b1522', 8, 'center', true);
      text(ctx, a.name, r.x + 28, r.y + 11, done ? C.gold : '#ffffff', 8.5, 'left', true);
      text(ctx, a.desc, r.x + 28, r.y + 22, C.dim, 6.5);
      text(ctx, done ? '받음' : `✦ ${a.reward}`, r.x + r.w - 10, r.y + r.h / 2, done ? C.green : '#9fe0ff', 7.5, 'right', true);
    });
    button(ctx, layout.back, '돌아가기', ui.hoverStart === 'back' ? 'hover' : 'normal');
  }

  private overlayEnd(state: GameState, ui: UiState): void {
    const { ctx, layout } = this;
    const won = state.status === 'won';
    const endless = state.mode === 'endless';
    this.dim(0.55 * Math.min(1, (this.now - this.endAt) / 0.6));
    if (won && this.now > this.nextFirework) {
      this.nextFirework = this.now + 0.35;
      this.overlayFx.firework({ x: 80 + Math.random() * (layout.width - 160), y: 40 + Math.random() * 120 });
    }
    this.overlayFx.draw(ctx, layout.width, layout.fieldHeight);

    const w = 320;
    const rows = topDamage(state.damageByWeapon, 5);
    const reward = ui.reward;
    const newAch = reward?.achieved ?? [];
    const h = 112 + rows.length * 13 + (reward ? 16 : 0) + newAch.length * 12;
    const x = layout.width / 2 - w / 2;
    const y = Math.max(8, layout.height / 2 - h / 2);
    // 끝난 뒤 잠깐 결과를 보여주고(탑 붕괴 연출), 창이 떠오른다
    const pop = easeOutCubic(Math.min(1, Math.max(0, (this.now - this.endAt - 0.6) / 0.35)));
    if (pop <= 0) return;
    ctx.save();
    ctx.globalAlpha = pop;
    ctx.translate(0, (1 - pop) * 12);
    const accent = won ? C.gold : endless ? C.accent : C.red;
    panel(ctx, { x, y, w, h }, 'rgba(12, 15, 24, 0.94)', `${accent}88`, undefined, 14);

    const cx = layout.width / 2;
    const title = won ? '탑을 지켰다' : endless ? `${state.round}라운드까지 버텼다` : '탑이 무너졌다';
    text(ctx, title, cx, y + 20, accent, 14, 'center', true);
    const hero = state.hero ? findHero(state.hero) : null;
    if (hero) text(ctx, `${hero.name} · "${won ? hero.winLine : hero.loseLine}"`, cx, y + 35, hero.color, 7.5, 'center');

    // 숫자 네 칸
    const stats: [string, string][] = [
      [`${state.round}`, '라운드'],
      [formatTime(state.time), '시간'],
      [`${state.kills}`, '처치'],
      [`${Math.floor(state.gold)}`, '남은 골드'],
    ];
    stats.forEach(([v, label], k) => {
      const sx = x + 16 + k * ((w - 32) / 4) + (w - 32) / 8;
      text(ctx, v, sx, y + 54, '#ffffff', 10, 'center', true);
      text(ctx, label, sx, y + 66, C.dim, 6.5, 'center');
    });

    let yy = y + 84;
    const barX = x + 96;
    const barW = w - 150;
    for (const row of rows) {
      const item = state.weapons.find((wp) => wp.def.id === row.id)?.def;
      const color = item ? TYPE_INFO[item.type].color : C.gold;
      const icon = WEAPON_ICONS[row.id];
      if (icon) drawSprite(ctx, icon, x + 16, yy - 5.5, 1);
      text(ctx, row.name, x + 31, yy, C.text, 7.5);
      bar(ctx, barX, yy - 2, barW, 4, row.percent / 100, color);
      text(ctx, `${row.percent}%`, x + w - 16, yy, C.dim, 7, 'right');
      yy += 13;
    }

    yy += 4;
    const recText = endless
      ? `무한 최고 ${ui.endless[state.difficulty].bestRound}라운드`
      : (() => {
          const rec = ui.records[state.difficulty];
          return `최고 ${rec.bestRound}라운드 · 승리 ${rec.wins}회${rec.fastestWin !== null ? ` · 최단 ${formatTime(rec.fastestWin)}` : ''}`;
        })();
    text(ctx, `${ui.newBest ? '새 기록! ' : ''}${findDifficulty(state.difficulty).name} ${recText}`, cx, yy, ui.newBest ? C.gold : C.dim, 7.5, 'center', ui.newBest);
    if (reward) {
      yy += 16;
      const bonus = newAch.reduce((sum, a) => sum + a.reward, 0);
      text(ctx, `✦ +${reward.shards + bonus}  (모은 별조각 ${reward.meta.shards})`, cx, yy, '#9fe0ff', 8, 'center', true);
      for (const a of newAch) {
        yy += 12;
        text(ctx, `업적 · ${a.name}`, cx, yy, '#ffe8a3', 7.5, 'center', true);
      }
    }
    const pulse = 0.5 + 0.5 * Math.sin(this.now * 3);
    ctx.globalAlpha = pop * (0.5 + 0.5 * pulse);
    text(ctx, '클릭 또는 Enter', cx, y + h - 11, C.text, 7.5, 'center');
    ctx.restore();
  }
}
