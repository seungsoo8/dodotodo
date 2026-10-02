import { DIFFICULTIES, findDifficulty, type DifficultyId, type GameMode } from '../core/config.ts';
import { canBuy, enemyCountForRound, faceWeaponCount, incomePerSecond, mergesOnBuy, priceOf, rerollCost, sellPrice, type GameState } from '../core/game.ts';
import { FACES, FACE_INFO, faceOf, mainFace, type Face } from '../core/faces.ts';
import type { RewardCard } from '../core/rewards.ts';
import { PERK, findPerk } from '../core/perks.ts';
import { SKILL, TAG_INFO, findSkill, skillCooldownLeft, skillCooldownOf, skillName } from '../core/skills.ts';
import { BOSS_PATTERN, LEGENDARY_WEAPONS, findEnemy, findItem } from '../core/data.ts';
import { ACHIEVEMENTS } from '../core/achievements.ts';
import { HEROES, findHero, type HeroId } from '../core/heroes.ts';
import { META_UPGRADES, heroUnlocked, metaLevel, nextCost, type MetaState } from '../core/meta.ts';
import type { RunReward } from '../core/progress.ts';
import { CHAPTERS, storyPages, unreadCount, type StoryPage } from '../core/story.ts';
import { cardPage, shownLines, type StoryCard } from './storycard.ts';
import { portraitFor } from './portraits.ts';
import { splashFrame } from './splash.ts';
import type { Beat } from './storybeats.ts';
import { tutorialHint, type TutorialProgress } from './tutorial.ts';
import { createRng } from '../core/rng.ts';
import { SET_SPECIALS, WEAPON_TYPES, effectiveWeapon, setTier, weaponCounts } from '../core/sets.ts';
import type { Enemy, GameEvent, ItemDef, WeaponType } from '../core/types.ts';
import { Effects } from './effects.ts';
import { easeOutBack, easeOutCubic, formatNumber, skyAt, vignetteAlpha } from './fx.ts';
import { World } from './world.ts';
import { C, FONT, TYPE_INFO, bar, button, drawSprite, panel, pill, roundRect, spriteImage, text, type SpriteVariant } from './kit.ts';
import { WORLD_H, WORLD_W, toScreen, toWorld, visibleWorld, type AudioPanel, type Layout, type Rect } from './layout.ts';
import type { AudioSettings, EndlessRecords, Records } from './records.ts';
import { sellButtonRect, slotRect, weaponsOn, type FaceHit } from './faceslots.ts';
import { forecastVisible, nextBig, nextIncidentShown, roadShares, timeLeftLabel } from './forecast.ts';
import { INCIDENTS, type IncidentId } from '../core/incidents.ts';
import { ENCOUNTERS, ROUTE, ROUTE_NODES, canChooseEncounter, canForge, forgeTarget, peddlerCost, starshardGold, type RouteNodeId } from '../core/route.ts';
import { COMBO, ULT, ultimateFor, ultReady } from '../core/ultimate.ts';
import { activePick } from './picks.ts';
import { bossBar, comboView } from './feel.ts';
import { emptyFaceHits, shouldWarn } from './warnings.ts';
import { LESSON_PARTS, LESSON_STEPS, lessonPart, lessonText, type Lesson } from './lesson.ts';
import { ENEMY_SCALE, ENEMY_SPRITES, ICONS, type Sprite, SKILL_ICONS, TOWER_SCALE, TOWER_SPRITE, WEAPON_ICONS, facesLeft, walkFrame } from './sprites.ts';
import { METEOR_FALL, schedule } from './weaponfx.ts';
import { formatTime, topDamage } from './summary.ts';

export { TYPE_INFO };

/** 날아다니는 적은 이만큼 떠서 그린다 */
const FLY_HEIGHT = 14;

export interface UiState {
  started: boolean;
  paused: boolean;
  speed: number;
  hover: number | null;
  hoverButton: 'reroll' | 'speed' | 'pause' | 'mute' | 'skill' | 'info' | 'rotate' | 'face' | 'ult' | null;
  /** 마우스가 올라간 탑 돌리기 버튼 방향 */
  hoverRotate: 1 | -1 | null;
  hoverSkill: number | null;
  /** 마우스가 올라간 탑 둘레 칸 */
  hoverFace: FaceHit | null;
  /** 옮기거나 팔려고 집은 무기 번호 (state.weapons) */
  picked: number | null;
  /** 집은 무기의 판매 버튼 위 */
  hoverSell: boolean;
  hoverChoice: number | null;
  /** 떨어뜨릴 곳을 고르는 중인 스킬 id (없으면 null) */
  aiming: string | null;
  /** 전장 위 마우스 위치 (없으면 null) */
  pointer: { x: number; y: number } | null;
  difficulty: DifficultyId;
  mode: GameMode;
  records: Records;
  endless: EndlessRecords;
  /** 이번 판으로 기록이 갱신됐는지 */
  newBest: boolean;
  /** 타이틀(연출) · 메뉴(탑·난이도 고르기, 'title') · 강화 상점 · 업적 · 이야기 */
  screen: 'splash' | 'title' | 'meta' | 'achievements' | 'story';
  /** 타이틀 연출을 시작한 시각 (초). null 이면 아직 시작 전 (소리를 켜려면 한 번 눌러야 한다) */
  splashAt: number | null;
  /** 포기를 한 번 누른 시각 (다시 누르면 확정, 없으면 null) */
  giveUpArmed: number | null;
  /** 초기화를 한 번 누른 시각 (다시 누르면 확정, 없으면 null) */
  resetArmed: number | null;
  /** 마우스(손가락)가 올라간 면 고르기 버튼 */
  hoverFacePad: Face | null;
  /** 이야기 화면에서 고른 쪽 */
  storyPage: number;
  /** 판 위에 뜬 이야기 카드 (서장·결말) */
  storyCard: StoryCard | null;
  hero: HeroId;
  meta: MetaState;
  /** 방금 끝난 판의 보상 */
  reward: RunReward | null;
  /** 첫 판 안내 (다 끝났으면 null) */
  tutorial: TutorialProgress | null;
  /** 시작 화면·강화 상점에서 마우스가 올라간 것 */
  hoverStart: string | null;
  hoverMeta: number | null;
  /** 터치: 누른 정보 버튼으로 능력치 창을 켜 둠 */
  infoOpen: boolean;
  /** 연습 판 진행 (연습 중이 아니면 null) */
  lesson: Lesson | null;
  hoverLesson: 'next' | 'skip' | null;
  /** 소리 설정 (♪ 버튼 창) */
  audio: AudioSettings;
  audioOpen: boolean;
}

const LEGENDARY = new Set(LEGENDARY_WEAPONS.map((w) => w.id));

/** 보상 카드 모양: 아이콘 · 색 · 분류 */

/** 재사용 대기 표시: 정수면 그대로, 아니면 소수 한 자리 */
function cooldownLabel(sec: number): string {
  return Number.isInteger(sec) ? `${sec}` : sec.toFixed(1);
}

const PERK_LOOK: Record<string, { icon: string; color: string; tag: string }> = {
  multishot: { icon: 'pierce', color: '#ff9d4d', tag: '공격' },
  giant_slayer: { icon: 'normal', color: '#ff9d4d', tag: '공격' },
  corpse_blast: { icon: 'siege', color: '#ff9d4d', tag: '공격' },
  big_splash: { icon: 'siege', color: '#ff9d4d', tag: '공격' },
  conductor: { icon: 'magic', color: '#6fb7ff', tag: '마법' },
  skill_master: { icon: 'meteor', color: '#6fb7ff', tag: '마법' },
  frost_aura: { icon: 'snow', color: '#6fb7ff', tag: '마법' },
  vampiric: { icon: 'heart', color: '#6fdc6f', tag: '방어' },
  interest: { icon: 'coin', color: C.gold, tag: '돈' },
  bounty_hunter: { icon: 'coin', color: C.gold, tag: '돈' },
  discount: { icon: 'coin', color: C.gold, tag: '돈' },
  free_reroll: { icon: 'upgrade', color: C.gold, tag: '돈' },
  gold_pouch: { icon: 'coin', color: C.gold, tag: '돈' },
};

/** 영구 강화 아이콘 */
const META_ICONS: Record<string, string> = { start_gold: 'coin', max_hp: 'heart', power: 'normal' };

/** 시작 화면에 돌아가며 보여 주는 팁 */
const TIPS = [
  '탑마다 수호자와 이야기가 있다. 그 탑으로 처음 이기면 결말이 열린다',
  '다섯 탑의 결말을 모두 보면 마지막 이야기가 열린다 (T 이야기)',
  '같은 무기 3개를 모으면 ★2 로 합쳐진다',
  '보스가 기를 모을 때 그 길에 눈보라를 쓰면 기술이 끊긴다',
  '박쥐는 날아다녀서 공성 무기에 맞지 않는다',
  '방패병은 일반·관통 피해를 절반만 받는다',
  '도둑 고블린을 잡으면 훔친 골드를 되찾는다',
  '한 면에 같은 계열 무기를 2개, 3개 달면 면 세트 효과가 붙는다',
  '라운드가 끝나기 6초 전에 다음 라운드에 적이 올 길이 뜬다',
  '무기를 다른 면으로 옮기면 3초 동안 쏘지 않는다. 미리 옮겨 두자',
  '동·서 길은 길고 북·남 길은 짧다. 짧은 길에는 빠른 무기를',
  '바리케이드로 한 길을 막아 두면 다른 길에 집중할 수 있다',
  '라운드가 지날수록 해가 지고, 마지막 라운드는 밤이다',
  '3라운드마다 밤 지도가 펼쳐진다. 모루·상인·모닥불 중 지금 필요한 길을',
  '부관·정예를 잡으면 보상 카드가 나온다 (특전 또는 스킬)',
  '궁극기 게이지가 차면 G (또는 ★ 버튼). 탑마다 궁극기가 다르다',
  '전장의 적을 직접 눌러 때릴 수 있다. 약하지만 궁극기 게이지가 찬다',
  '사건은 한 라운드 전에 예보된다. 박쥐 떼가 오면 공성 무기는 쉬게 된다',
  '두 스킬을 합체하면 칸이 하나 빈다',
];

/** 보상 카드 한 장의 모양: 아이콘 · 딱지 · 제목 · 설명 · 아랫줄 */
const NODE_COLORS: Record<RouteNodeId, string> = {
  elite: '#ff9d4d',
  merchant: '#ffd166',
  campfire: '#ff7a4d',
  forge: '#9fe0ff',
  gamble: '#c77dff',
  mystery: '#b48cff',
};

function rewardLook(card: RewardCard, state: GameState): { icon: Sprite; color: string; tag: string; title: string; desc: string; foot?: string; footColor?: string } {
  if (card.kind === 'perk') {
    const perk = findPerk(card.id);
    const look = PERK_LOOK[card.id] ?? { icon: 'upgrade', color: '#c77dff', tag: '특전' };
    return { icon: ICONS[look.icon] ?? ICONS.upgrade, color: look.color, tag: `특전 · ${look.tag}`, title: perk.name, desc: perk.desc };
  }
  const def = findSkill(card.id);
  const color = TAG_INFO[def.tags[0]].color;
  const icon = SKILL_ICONS[card.id] ?? ICONS.meteor;
  const tags = def.tags.map((tg) => TAG_INFO[tg].label).join('·');
  switch (card.kind) {
    case 'learn':
      return { icon, color, tag: '새 스킬', title: def.name, desc: def.desc, foot: `${tags} · 재사용 ${cooldownLabel(skillCooldownOf(state, card.id))}초` };
    case 'evolve':
      return { icon, color: C.gold, tag: '스킬 진화', title: `${def.name} → ${def.evolve!.name}`, desc: def.evolve!.desc, foot: '가진 스킬이 더 세진다', footColor: C.gold };
    case 'fuse': {
      const [a, b] = def.recipe!.map((r) => findSkill(r).name);
      return { icon, color: C.gold, tag: '스킬 합체', title: def.name, desc: def.desc, foot: `${a} + ${b} → 칸 하나가 빈다`, footColor: C.gold };
    }
  }
}

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
  /** 탑(수호자)이 하는 말 */
  private speech: { beat: Beat; born: number } | null = null;

  constructor(ctx: CanvasRenderingContext2D, layout: Layout) {
    this.ctx = ctx;
    this.layout = layout;
    this.world = new World(WORLD_W, WORLD_H);
    this.setLayout(layout);
  }

  /** 화면 크기가 바뀌면 배치를 바꾸고, 보이는 만큼 숲을 다시 그린다 */
  setLayout(layout: Layout): void {
    this.layout = layout;
    // 메뉴에서는 화면 전체가 배경이니 화면 전체만큼 그린다
    const v = visibleWorld(layout, { x: 0, y: 0, w: layout.width, h: layout.height });
    this.world = new World(WORLD_W, WORLD_H, { x: v.x - 8, y: v.y - 8, w: v.w + 16, h: v.h + 16 });
    const g = layout.hud.gold;
    this.fx.coinTarget = toWorld(layout, { x: g.x + 10, y: g.y + g.h / 2 });
    this.vignette = null;
  }

  /** 그리기 시작할 때의 변환 (화면 전체를 덮을 때 되돌린다) */
  private base: DOMMatrix | null = null;

  /** 전장 좌표로 그리기 시작 */
  private useCamera(): void {
    const { x, y, s } = this.layout.cam;
    this.ctx.translate(x, y);
    this.ctx.scale(s, s);
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

  onSetReached(state: GameState, type: WeaponType, tier: number, face: Face): void {
    const color = TYPE_INFO[type].color;
    const t = state.tower;
    this.fx.ring({ x: t.x, y: t.y }, 120, color, 0.8);
    this.fx.ring({ x: t.x, y: t.y }, 70, '#ffffff', 0.5);
    this.fx.flash(color, 0.3);
    this.banner({
      style: 'set',
      title: `${FACE_INFO[face].label}쪽 ${TYPE_INFO[type].label} 세트 ${'★'.repeat(tier)}`,
      sub: tier === 2 ? SET_SPECIALS[type] : `${TYPE_INFO[type].label} 무기 피해 +${state.config.sets.damageBonus[0] * 100}%`,
      color,
      life: 2,
    });
  }

  /** 수호자 말풍선 (앞의 말은 밀어낸다) */
  /** 새 기능 첫 안내 (intro.ts) */
  private introShown: { hint: { title: string; text: string }; born: number } | null = null;
  private static readonly INTRO_LIFE = 7;
  intro(hint: { title: string; text: string }): void {
    this.introShown = { hint, born: this.now };
  }
  introShowing(): boolean {
    return !!this.introShown && this.now - this.introShown.born < Renderer.INTRO_LIFE;
  }

  say(beat: Beat): void {
    this.speech = { beat, born: this.now };
  }

  private banner(b: Omit<Banner, 'born'>): void {
    this.banners = this.banners.filter((x) => x.style !== b.style);
    this.banners.push({ ...b, born: this.now });
  }

  // ───────── 게임 이벤트 → 연출 ─────────

  /** main.ts 가 이번 프레임에 꺼낸 게임 이벤트를 연출로 바꾼다 */
  consume(state: GameState, events: GameEvent[], time: number): void {
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
      this.speech = null;
      this.ghosts = [];
      this.lastSeen.clear();
      // 새 판은 적 번호가 1 부터 다시 시작하니 지난 판 기록을 지운다
      this.firstSeen.clear();
      this.hitAt.clear();
    }
    const t = state.tower;
    const towerTop = { x: t.x, y: t.y + t.radius - TOWER_SPRITE.height * TOWER_SCALE + 4 };
    for (const { event: ev, delay, fx } of schedule(events)) {
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
          // 치명타: 맞은 자리에 붉은 번쩍임
          if (ev.crit) this.fx.critBurst(ev.at, delay);
          break;
        }
        case 'tap':
          this.fx.ring(ev.at, 12, '#ffffff', 0.2);
          this.fx.sparkle(ev.at, '#ffffff');
          break;
        case 'combo':
          this.fx.floatText({ x: ev.at.x, y: ev.at.y - 22 }, `${ev.count} 연속! +${ev.bonus}G`, C.gold, 10, 1.2);
          break;
        case 'ultimate':
          this.ultFx(ev, state);
          break;
        case 'incident': {
          const d = INCIDENTS[ev.id as IncidentId];
          this.banner({ style: 'elite', title: `사건: ${d.name}`, sub: d.desc, color: '#c77dff', life: 2.6 });
          break;
        }
        case 'officer':
          this.banner({ style: 'elite', title: ev.name, sub: '장수의 기술을 쓴다 · 잡으면 보상 카드', color: '#ff9d4d', life: 2.4 });
          this.fx.shake(4, 0.4);
          break;
        case 'node': {
          const n = ROUTE_NODES[ev.id as RouteNodeId];
          if (ev.id !== 'mystery' && ev.id !== 'forge' && ev.id !== 'gamble') this.banner({ style: 'info', title: `${n.icon} ${n.name}`, sub: n.desc, color: '#9fe0ff', life: 2 });
          if (ev.id === 'campfire') this.fx.heal({ x: t.x, y: t.y }, 60);
          break;
        }
        case 'forge':
          this.banner({ style: 'merge', title: `⚒ ${findItem(ev.weaponId).name} ${'★'.repeat(ev.level)}`, sub: '모루에서 두드려 한 단계 올렸다', color: C.gold, life: 2 });
          this.fx.mergeBurst({ x: t.x, y: t.y - 10 }, ev.level);
          break;
        case 'gamble': {
          const won = ev.win - ev.bet;
          this.banner({ style: 'info', title: `🎲 주사위 ${ev.roll}`, sub: won >= 0 ? `+${won}G` : `${won}G`, color: won > 0 ? C.gold : won < 0 ? C.red : C.text, life: 2 });
          break;
        }
        case 'peddler':
          this.banner({ style: 'perk', title: '행상의 물건', sub: ev.items.map((id) => findItem(id).name).join(' · '), color: '#c77dff', life: 2.2 });
          break;
        case 'kill': {
          // 클래식 마지막 장수: 승리 화면 전에 마지막 일격
          if (ev.rank === 'boss' && state.mode === 'classic') {
            this.banner({ style: 'bossDown', title: '마지막 일격!', sub: '장수를 쓰러뜨렸다', color: C.gold, life: 2 });
            this.fx.ring(ev.at, 160, C.gold, 1.2);
            this.fx.firework(ev.at);
            this.fx.flash('#fff4c2', 0.35);
            this.fx.shake(7, 0.8);
          }
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
          this.fx.floatText({ x: t.x + FACE_INFO[ev.face].dx * 60, y: t.y + FACE_INFO[ev.face].dy * 60 }, `${FACE_INFO[ev.face].label}쪽 무기 기절`, '#ff9d4d', 8, 1.6);
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
          this.banner({ style: 'bossDown', title: '장수 처치', sub: '다음 장수까지 버티자', color: C.gold, life: 2.5 });
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
        case 'rotate':
          this.rotateAnim = { at: time, dir: ev.dir };
          this.fx.ring({ x: t.x, y: t.y - 10 }, 70, C.gold, 0.4);
          this.fx.floatText({ x: t.x, y: t.y - 60 }, ev.dir === 1 ? '⟳ 시계 방향' : '⟲ 반시계 방향', C.gold, 9, 0.8);
          break;
        case 'move': {
          const f = FACE_INFO[ev.face];
          this.fx.floatText({ x: t.x + f.dx * 50, y: t.y + f.dy * 50 - 10 }, `→ ${f.label}`, '#9fe0ff', 9, 0.9);
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
    if (this.hitAt.size > 800) this.hitAt.clear();

    // 무기가 없는 면으로 맞으면 그 면 칸이 빨갛게 번쩍이고, 가끔 말로도 알려 준다
    for (const f of emptyFaceHits(state, events)) {
      this.faceAlarm[f] = time;
      if (!shouldWarn(this.faceWarned, f, time)) continue;
      this.faceWarned[f] = time;
      const info = FACE_INFO[f];
      this.fx.floatText({ x: t.x + info.dx * 70, y: t.y + info.dy * 62 - 8 }, `${info.label}쪽이 비었다!`, '#ff6b6b', 10, 1.4);
    }

    if (state.status !== this.lastStatus) {
      this.lastStatus = state.status;
      this.endAt = time;
      if (state.status === 'lost') {
        this.fx.shatter(TOWER_SPRITE.pixels, { x: t.x - (TOWER_SPRITE.width * TOWER_SCALE) / 2, y: t.y + t.radius - TOWER_SPRITE.height * TOWER_SCALE }, TOWER_SCALE);
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
    this.tween(state, dt);

    const { ctx, layout } = this;
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    this.base = ctx.getTransform();

    // 전장 (흔들림 적용). 전장 좌표로 그린다
    const shake = this.fx.shakeOffset();
    const f = ui.started ? layout.field : { x: 0, y: 0, w: layout.width, h: layout.height };
    ctx.save();
    ctx.beginPath();
    ctx.rect(f.x, f.y, f.w, f.h);
    ctx.clip();
    ctx.translate(shake.x, shake.y);
    this.useCamera();
    this.drawField(state, ui, dt);
    this.fx.draw(ctx, WORLD_W, WORLD_H);
    if (ui.started && ui.aiming && ui.pointer) this.drawAim(state, toWorld(layout, ui.pointer), ui.aiming);
    ctx.restore();

    if (ui.started) this.drawVignette(state);
    if (ui.started && layout.portrait) this.drawButtonDock();
    if (ui.started && state.status === 'playing') {
      this.drawRoads(state);
      ctx.save();
      this.useCamera();
      const before = this.tip;
      this.drawFaces(state, ui);
      // 칸 설명은 전장 좌표로 잡았으니 화면 좌표로 옮긴다
      if (this.tip && this.tip !== before) {
        const at = toScreen(layout, this.tip);
        this.tip = { ...this.tip, x: at.x, y: at.y };
      }
      if (!activePick(state)) this.drawSpeech(state);
      ctx.restore();
    }
    if (ui.started) this.drawHud(state, ui);
    if (ui.started) this.drawShop(state, ui);
    if (ui.started) this.drawSkills(state, ui);
    if (ui.started && state.status === 'playing') this.drawFacePad(state, ui);
    if (ui.started && state.status === 'playing' && !activePick(state)) this.drawFeel(state);
    if (ui.started && !activePick(state)) this.drawBanners();
    if (ui.started && ui.lesson) this.drawLesson(state, ui, ui.lesson);
    if (ui.started && ui.tutorial && !this.introShowing() && state.status === 'playing' && !activePick(state) && !ui.paused && ui.hoverSkill === null) this.drawHint(state, ui.tutorial);
    if (ui.started && !activePick(state) && state.status === 'playing') this.drawTip();
    else this.tip = null;

    const scene = `${ui.started}:${ui.screen}`;
    if (scene !== this.scene) {
      this.scene = scene;
      this.sceneAt = time;
    }
    if (!ui.started) {
      if (ui.screen === 'splash') this.overlaySplash(ui);
      else {
        // 메뉴 화면은 메뉴 상자 기준 (가로: 가운데 640×360)
        ctx.save();
        ctx.translate(layout.menu.x, layout.menu.y);
        if (ui.screen === 'meta') this.overlayMeta(ui);
        else if (ui.screen === 'achievements') this.overlayAchievements(ui);
        else if (ui.screen === 'story') this.overlayStory(ui);
        else this.overlayStart(ui);
        ctx.restore();
      }
    }
    else if (state.status !== 'playing') this.overlayEnd(state, ui);
    else if (state.encounter) this.overlayEncounter(state, ui);
    else if (state.forging) this.overlayForge(state, ui);
    else if (state.route) this.overlayRoute(state, ui);
    else if (state.choice) this.overlayChoice(state, ui);
    else if (ui.paused) this.overlayPause(ui);
    if (ui.started && state.status === 'playing' && !ui.paused) this.drawIntro(state);
    if (ui.started && ui.storyCard) this.drawStoryCard(ui.storyCard);
    const fade = 1 - (time - this.sceneAt) / 0.35;
    if (fade > 0) this.dim(fade);
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

    if (ui.started && state.status === 'playing') {
      this.drawRoadFlashes(t);
      // 고른 면(또는 마우스를 올린 면·집은 무기의 면)이 쏘는 부채꼴
      const pickedFace = ui.picked !== null ? state.weapons[ui.picked]?.face : undefined;
      const shown = ui.hoverFace?.face ?? pickedFace ?? state.face;
      this.drawFaceWedge(state, shown, shown === state.face ? 1 : 0.7);
      this.drawBarricades(state);
    }

    if (ui.started && state.perks.includes('frost_aura')) {
      ctx.strokeStyle = 'rgba(159, 216, 255, 0.35)';
      ctx.beginPath();
      ctx.arc(t.x, t.y, PERK.frostAuraRadius, 0, Math.PI * 2);
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
    if (ui.started && state.incident === 'fog') this.drawFog(state);
    for (const e of ordered) this.drawEnemyOverlay(e);
  }

  /** 짙은 안개: 탑 둘레만 맑고 멀리는 뿌옇다 */
  private drawFog(state: GameState): void {
    const { ctx } = this;
    const t = state.tower;
    const g = ctx.createRadialGradient(t.x, t.y, 70, t.x, t.y, 260);
    g.addColorStop(0, 'rgba(190, 200, 215, 0)');
    g.addColorStop(1, 'rgba(190, 200, 215, 0.55)');
    ctx.fillStyle = g;
    const v = visibleWorld(this.layout);
    ctx.fillRect(v.x, v.y, v.w, v.h);
  }

  // ───────── 네 방향: 부채꼴 · 길 · 바리케이드 · 탑 둘레 칸 ─────────

  /** 그 면 무기가 쏘는 부채꼴 (무기가 없으면 점선만) */
  private drawFaceWedge(state: GameState, face: Face, alpha: number): void {
    const { ctx } = this;
    const t = state.tower;
    const counts = weaponCounts(state, face);
    const stats = weaponsOn(state, face).map((i) => effectiveWeapon(state, state.weapons[i].def, counts, state.weapons[i].level));
    const range = stats.length ? Math.max(...stats.map((st) => st.range)) : 90;
    const arc = stats.length ? Math.max(...stats.map((st) => st.arc)) : state.config.tower.arc;
    const half = ((arc / 2) * Math.PI) / 180;
    const a0 = FACE_INFO[face].angle;
    ctx.beginPath();
    ctx.moveTo(t.x, t.y);
    ctx.arc(t.x, t.y, range, a0 - half, a0 + half);
    ctx.closePath();
    ctx.fillStyle = `rgba(255, 209, 102, ${(stats.length ? 0.08 : 0.03) * alpha})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 209, 102, ${0.4 * alpha})`;
    ctx.setLineDash([3, 4]);
    ctx.lineDashOffset = -this.now * 8;
    ctx.beginPath();
    ctx.arc(t.x, t.y, range, a0 - half, a0 + half);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /** 길 스킬이 닿은 쪽을 잠깐 물들인다 */
  private roadFlashes: { face: Face; color: string; born: number }[] = [];
  private roadCone(t: { x: number; y: number }, face: Face): void {
    const { ctx } = this;
    const a0 = FACE_INFO[face].angle;
    const far = 900;
    ctx.beginPath();
    ctx.moveTo(t.x, t.y);
    ctx.lineTo(t.x + Math.cos(a0 - Math.PI / 4) * far, t.y + Math.sin(a0 - Math.PI / 4) * far);
    ctx.lineTo(t.x + Math.cos(a0 + Math.PI / 4) * far, t.y + Math.sin(a0 + Math.PI / 4) * far);
    ctx.closePath();
  }

  private drawRoadFlashes(t: { x: number; y: number }): void {
    const { ctx } = this;
    this.roadFlashes = this.roadFlashes.filter((f) => this.now - f.born < 0.8);
    for (const f of this.roadFlashes) {
      const k = 1 - (this.now - f.born) / 0.8;
      this.roadCone(t, f.face);
      ctx.globalAlpha = 0.28 * k;
      ctx.fillStyle = f.color;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  /** 길을 가로막은 나무 울타리 (철벽은 가시가 박힌다) */
  private drawBarricades(state: GameState): void {
    const { ctx } = this;
    const t = state.tower;
    for (const b of state.barricades) {
      if (b.left < 1 && Math.floor(this.now * 8) % 2 === 0) continue; // 곧 풀린다
      const f = FACE_INFO[b.face];
      const cx = t.x + f.dx * SKILL.barricadeDist;
      const cy = t.y + f.dy * SKILL.barricadeDist;
      ctx.save();
      ctx.translate(Math.round(cx), Math.round(cy));
      ctx.rotate(f.angle + Math.PI / 2);
      ctx.fillStyle = '#00000055';
      ctx.fillRect(-24, 2, 48, 5);
      for (let k = -3; k <= 3; k++) {
        ctx.fillStyle = k % 2 ? '#8a5a2b' : '#a0703a';
        ctx.fillRect(k * 7 - 3, -7, 6, 12);
        ctx.fillStyle = '#3a2412';
        ctx.fillRect(k * 7 - 3, -7, 6, 1);
      }
      ctx.fillStyle = '#6b4220';
      ctx.fillRect(-24, -3, 48, 3);
      if (b.evolved) {
        ctx.fillStyle = '#c9ccd6';
        for (let k = -3; k <= 3; k++) ctx.fillRect(k * 7 - 1, -11, 2, 4);
      }
      ctx.restore();
    }
  }

  /** 길 끝 표시 자리 (화면 좌표). 위쪽 바·스킬 바를 피하고, 잘린 길은 보이는 끝에 */
  private roadMarker(state: GameState, face: Face): { x: number; y: number } {
    const L = this.layout;
    const t = toScreen(L, state.tower);
    const topY = L.hud.hp.y + L.hud.hp.h;
    const bottomY = L.portrait ? L.fieldHeight : L.skills[0].y;
    const worldTop = toScreen(L, { x: 0, y: 0 });
    const worldEnd = toScreen(L, { x: WORLD_W, y: WORLD_H });
    switch (face) {
      case 'n':
        return { x: t.x, y: Math.max(topY + 12, worldTop.y + 40 * L.cam.s) };
      case 's':
        return { x: t.x, y: Math.min(bottomY - 14, worldEnd.y - 14) };
      case 'e':
        return { x: Math.min(L.width, worldEnd.x) - 30, y: t.y };
      case 'w':
        return { x: Math.max(0, worldTop.x) + 30, y: t.y };
    }
  }

  /** 지금 오는 길 (작게), 라운드 끝 무렵에는 다음 라운드 예보 (크게) */
  private drawRoads(state: GameState): void {
    const { ctx } = this;
    const arrow: Record<Face, string> = { n: '▼', e: '◀', s: '▲', w: '▶' };
    const forecast = forecastVisible(state);
    const shares = roadShares(forecast ? state.nextPlan : state.plan);
    // 보스·정예는 그 라운드에 가장 많이 오는 길로 온다
    const kind = nextBig(state);
    const big = forecast && kind ? mainFace(state.nextPlan) : null;
    const bigLabel = kind === 'boss' ? '보스' : kind === 'officer' ? '부관' : '정예';
    const pulse = 0.5 + 0.5 * Math.sin(this.now * 6);
    for (const { face, pct } of shares) {
      const p = this.roadMarker(state, face);
      const label = forecast ? `다음 ${pct}%` : `${pct}%`;
      const color = big === face ? C.red : forecast ? C.gold : '#ff9a8a';
      ctx.font = `700 ${forecast ? 8 : 7}px ${FONT}`;
      const w = ctx.measureText(label).width + (forecast ? 22 : 18);
      const h = forecast ? 15 : 12;
      ctx.globalAlpha = forecast ? 0.75 + 0.25 * pulse : 0.8;
      pill(ctx, { x: p.x - w / 2, y: p.y - h / 2, w, h }, 'rgba(12, 15, 24, 0.85)', `${color}${forecast ? 'cc' : '66'}`);
      text(ctx, arrow[face], p.x - w / 2 + 7, p.y + 0.5, color, forecast ? 7 : 6, 'center', true);
      text(ctx, label, p.x + 4, p.y + 0.5, color, forecast ? 8 : 7, 'center', true);
      if (big === face) {
        const bw = 30;
        pill(ctx, { x: p.x - bw / 2, y: p.y + h / 2 + 2, w: bw, h: 11 }, 'rgba(90, 10, 20, 0.9)', C.red);
        text(ctx, bigLabel, p.x, p.y + h / 2 + 7.5, '#ffd6d6', 7, 'center', true);
      }
      ctx.globalAlpha = 1;
    }
  }

  /** 면마다 빈 채로 맞은 마지막 시각 (빨간 번쩍임) · 말로 알린 시각 */
  private faceAlarm: Partial<Record<Face, number>> = {};
  private faceWarned: Partial<Record<Face, number>> = {};

  /** 탑을 돌린 순간과 방향 (칸이 휙 도는 연출) */
  private rotateAnim: { at: number; dir: 1 | -1 } | null = null;

  /** 탑 둘레 무기 칸: 면마다 가로·세로 한 줄 */
  private drawFaces(state: GameState, ui: UiState): void {
    const { ctx } = this;
    const t = state.tower;
    const n = state.config.tower.faceSlots;
    // 돌린 직후 0.25초 동안은 칸들이 앞 자리에서 새 자리로 돌아 들어온다
    const spin = this.rotateAnim ? Math.min(1, (this.now - this.rotateAnim.at) / 0.25) : 1;
    ctx.save();
    if (spin < 1) {
      const cy = t.y - 12;
      ctx.translate(t.x, cy);
      ctx.rotate(-this.rotateAnim!.dir * (Math.PI / 2) * (1 - easeOutCubic(spin)));
      ctx.translate(-t.x, -cy);
    }
    const picked = ui.picked !== null ? state.weapons[ui.picked] : undefined;
    for (const face of FACES) {
      const list = weaponsOn(state, face);
      const counts = weaponCounts(state, face);
      const selected = face === state.face;
      const moveTarget = !!picked && picked.face !== face;
      const alarmAge = this.now - (this.faceAlarm[face] ?? -99);
      const alarm = alarmAge < 0.6 ? 1 - alarmAge / 0.6 : 0;
      for (let k = 0; k < n; k++) {
        const r = slotRect(t, face, k, n);
        const idx = list[k];
        const hover = ui.hoverFace?.face === face && ui.hoverFace.slot === k;
        if (idx === undefined) {
          roundRect(ctx, r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, 4);
          ctx.fillStyle = hover ? 'rgba(40, 48, 72, 0.8)' : 'rgba(12, 15, 24, 0.45)';
          ctx.fill();
          if (selected || moveTarget || hover) ctx.setLineDash([2, 2]);
          ctx.strokeStyle = moveTarget ? 'rgba(159, 224, 255, 0.8)' : selected ? 'rgba(255, 209, 102, 0.8)' : 'rgba(255,255,255,0.14)';
          ctx.stroke();
          ctx.setLineDash([]);
          if (selected && !picked) text(ctx, '+', r.x + r.w / 2, r.y + r.h / 2, 'rgba(255, 209, 102, 0.7)', 8, 'center', true);
          if (alarm > 0) {
            roundRect(ctx, r.x - 1, r.y - 1, r.w + 2, r.h + 2, 5);
            ctx.fillStyle = `rgba(255, 70, 70, ${0.55 * alarm})`;
            ctx.fill();
          }
          continue;
        }
        const w = state.weapons[idx];
        const isPicked = ui.picked === idx;
        const lift = isPicked ? -2 : hover ? -1 : 0;
        const color = LEGENDARY.has(w.def.id) ? C.gold : TYPE_INFO[w.def.type].color;
        const border = isPicked ? '#ffffff' : selected ? 'rgba(255, 209, 102, 0.85)' : `${color}88`;
        panel(ctx, { ...r, y: r.y + lift }, hover || isPicked ? 'rgba(40, 48, 72, 0.95)' : 'rgba(16, 20, 32, 0.85)', border, undefined, 4);
        const icon = WEAPON_ICONS[w.def.id];
        if (icon) drawSprite(ctx, icon, r.x + 2.5, r.y + 2.5 + lift, 1);
        for (let s = 1; s < w.level; s++) {
          ctx.fillStyle = C.gold;
          ctx.beginPath();
          ctx.arc(r.x + r.w - 2.5 - (s - 1) * 3.5, r.y + 2.5 + lift, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
        // 면 세트: 같은 계열이 모이면 아래에 계열 색 줄
        if (setTier(state.config, counts[w.def.type]) > 0) {
          ctx.fillStyle = color;
          ctx.fillRect(r.x + 3, r.y + r.h - 2 + lift, r.w - 6, 1.5);
        }
        if (w.restLeft > 0) {
          ctx.fillStyle = 'rgba(6, 8, 13, 0.7)';
          roundRect(ctx, r.x, r.y + lift, r.w, r.h, 4);
          ctx.fill();
          text(ctx, `${Math.ceil(w.restLeft)}`, r.x + r.w / 2, r.y + r.h / 2 + lift, '#9fe0ff', 7.5, 'center', true);
        }
      }
      // 면 이름: 고른 면은 금색
      const first = slotRect(t, face, 0, n);
      const lp = face === 'n' || face === 's' ? { x: first.x - 7, y: first.y + first.h / 2 } : { x: first.x + first.w / 2, y: first.y - 6 };
      text(ctx, FACE_INFO[face].label, lp.x, lp.y, selected ? C.gold : 'rgba(255,255,255,0.4)', 6.5, 'center', true);
    }

    ctx.restore();

    // 집은 무기: 판매 버튼
    if (picked) {
      const k = weaponsOn(state, picked.face).indexOf(ui.picked!);
      const b = sellButtonRect(t, picked.face, k, n);
      pill(ctx, b, ui.hoverSell ? 'rgba(120, 30, 40, 0.95)' : 'rgba(60, 16, 24, 0.9)', C.red);
      text(ctx, `팔기 ${sellPrice(picked)}`, b.x + b.w / 2, b.y + b.h / 2 + 0.5, '#ffd6d6', 6.5, 'center', true);
    }

    // 설명
    const hf = ui.hoverFace;
    if (!hf) return;
    const r = slotRect(t, hf.face, hf.slot, n);
    const idx = weaponsOn(state, hf.face)[hf.slot];
    const label = FACE_INFO[hf.face].label;
    // 탑을 가리지 않게 바깥쪽으로 (북: 위, 남·동: 오른쪽, 서: 왼쪽)
    const last = slotRect(t, hf.face, n - 1, n);
    const tipAt =
      hf.face === 'n'
        ? { x: r.x + r.w / 2 - 95, y: r.y - 6, w: 190, above: true }
        : hf.face === 's'
          ? { x: last.x + last.w + 8, y: r.y - 14, w: 190 }
          : hf.face === 'e'
            ? { x: r.x + r.w + 8, y: r.y - 10, w: 190 }
            : { x: r.x - 8 - 190, y: r.y - 10, w: 190 };
    if (picked && picked.face !== hf.face) {
      this.tip = { ...tipAt, lines: [[`${label}쪽으로 옮기기`, '#9fe0ff', 8.5], [faceWeaponCount(state, hf.face) >= n ? '이 면은 꽉 찼다' : `옮긴 뒤 ${state.config.tower.moveRest}초 동안 쏘지 않는다`, C.dim]] };
      return;
    }
    if (idx === undefined) {
      this.tip = { ...tipAt, lines: [[`${label}쪽 면 · 빈 칸`, C.gold, 8.5], [hf.face === state.face ? '지금 고른 면 · 산 무기가 여기 붙는다' : '누르면 이 면을 고른다 (산 무기가 여기 붙는다)', C.dim]] };
      return;
    }
    const w = state.weapons[idx];
    const counts = weaponCounts(state, hf.face);
    const st = effectiveWeapon(state, w.def, counts, w.level);
    const tier = setTier(state.config, counts[w.def.type]);
    const lines: [string, string, number?][] = [
      [`${w.def.name} ${'★'.repeat(w.level)} · ${label}쪽`, TYPE_INFO[w.def.type].color, 8.5],
      [`피해 ${formatNumber(st.damage)} · ${st.cooldown.toFixed(2)}초 · 사거리 ${Math.round(st.range)} · ${st.arc}°`, C.text],
    ];
    const [t1, t2] = state.config.sets.thresholds;
    lines.push([
      tier === 2 ? `면 세트 완성: ${SET_SPECIALS[w.def.type]}` : `면 세트 ${counts[w.def.type]}/${tier === 0 ? t1 : t2} (같은 면에 같은 계열)`,
      tier > 0 ? C.gold : C.dim,
    ]);
    lines.push([ui.picked === idx ? '다른 면 칸을 누르면 옮긴다 · 다시 누르면 내려놓기' : '누르면 집기 → 옮기거나 팔기', C.dim]);
    this.tip = { ...tipAt, lines };
  }

  /** 이미 죽었지만 투사체가 닿을 때까지 보여주는 적 */
  private drawGhost(g: EnemyLook, towerX: number): void {
    const sprites = ENEMY_SPRITES[g.defId];
    if (!sprites) return;
    const sprite = sprites[walkFrame(this.now, g.id, sprites.length, 6)];
    const scale = ENEMY_SCALE * (g.isElite ? 1.5 : 1);
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
    const scale = ENEMY_SCALE * (e.isElite ? 1.5 : 1);
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
    if (e.isBoss || e.isOfficer) {
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
    if (e.isBoss || e.isOfficer) {
      const bw = e.isOfficer ? 48 : 64;
      bar(ctx, e.x - bw / 2, top - 10, bw, 4, ratio, e.isOfficer ? '#ff9d4d' : C.red);
      text(ctx, `${e.isOfficer ? `${e.def.name}의 부관` : e.def.name} ${formatNumber(Math.max(0, e.hp))}`, e.x, top - 17, e.isOfficer ? '#ffd0a8' : '#ffb3b3', 8, 'center');
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
      ctx.lineWidth = 14;
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
    if (ev.road) this.roadFlashes.push({ face: ev.road, color: TAG_INFO[findSkill(ev.id).tags[0]].color, born: this.now });
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
        this.fx.blizzard(width, fieldHeight, 1.2);
        break;
      case 'barricade':
        this.fx.ring({ x: t.x + FACE_INFO[ev.road!].dx * SKILL.barricadeDist, y: t.y + FACE_INFO[ev.road!].dy * SKILL.barricadeDist }, 30, '#c9a26b', 0.5);
        this.fx.shake(2, 0.15);
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
    // 스킬 이름은 배너 대신 탑 위에 짧게 (배너가 쌓이지 않게)
    const k = findSkill(ev.id);
    this.fx.floatText({ x: t.x, y: t.y - 36 }, skillName(ev.id, !!ev.evolved), TAG_INFO[k.tags[0]].color, 10, 0.9);
  }

  /** 떨어뜨릴 곳 조준 원 (길 스킬은 마우스가 있는 길 전체) */
  private drawAim(state: GameState, p: { x: number; y: number }, id: string): void {
    const { ctx } = this;
    const def = findSkill(id);
    if (def.road) {
      const t = state.tower;
      const face = faceOf(p.x - t.x, p.y - t.y);
      const color = TAG_INFO[def.tags[0]].color;
      this.roadCone(t, face);
      ctx.globalAlpha = 0.14 + 0.06 * Math.sin(this.now * 6);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = color;
      ctx.setLineDash([4, 3]);
      ctx.lineDashOffset = -this.now * 20;
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, `클릭: ${FACE_INFO[face].label}쪽 길에 ${def.name} · 우클릭/Esc: 취소`, p.x, p.y + 14, color, 8, 'center');
      return;
    }
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
    const sc = TOWER_SCALE;
    const left = Math.round(t.x - (s.width * sc) / 2);
    const top = Math.round(t.y + t.radius - s.height * sc);
    ctx.fillStyle = '#00000077';
    ctx.beginPath();
    ctx.ellipse(t.x, t.y + t.radius - 1, s.width * sc * 0.6, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    const since = this.now - this.towerHitAt;
    const hurt = since < 0.08;
    const shudder = since < 0.2 ? Math.round(Math.sin(since * 90) * 1.5) : 0;
    drawSprite(ctx, s, left + shudder, top, sc, false, hurt ? 'red' : 'normal');
    if (state.shieldLeft > 0) {
      const a = Math.min(1, state.shieldLeft) * (0.45 + 0.15 * Math.sin(this.now * 6));
      ctx.strokeStyle = `rgba(159, 216, 255, ${a})`;
      ctx.fillStyle = `rgba(159, 216, 255, ${a * 0.25})`;
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const ang = (Math.PI / 3) * k + this.now * 0.5;
        const px = t.x + Math.cos(ang) * 38;
        const py = t.y - 10 + Math.sin(ang) * 44;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    this.drawTowerTrim(left + shudder, top, sc, state.hero ? findHero(state.hero).color : C.gold);
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
    const width = this.layout.width;
    const fieldHeight = this.layout.fieldHeight;
    const pulse = a * (0.75 + 0.25 * Math.sin(this.now * 6));
    // 그라디언트는 한 번만 만들고 세기는 투명도로 조절한다
    if (!this.vignette) {
      this.vignette = ctx.createRadialGradient(width / 2, fieldHeight / 2, fieldHeight * 0.3, width / 2, fieldHeight / 2, width * 0.6);
      this.vignette.addColorStop(0, 'rgba(200,0,0,0)');
      this.vignette.addColorStop(1, 'rgba(200,0,0,1)');
    }
    ctx.globalAlpha = Math.min(1, pulse);
    ctx.fillStyle = this.vignette;
    ctx.fillRect(0, 0, width, fieldHeight);
    ctx.globalAlpha = 1;
  }
  private vignette: CanvasGradient | null = null;

  // ───────── HUD (모두 전장 위에 떠 있는 작은 알약·아이콘) ─────────

  /** 이번 프레임 마지막에 그릴 말풍선 (다른 UI 위에 오도록) */
  private tip: { x: number; y: number; w: number; lines: [string, string, number?][]; above?: boolean } | null = null;

  /** 세로 화면: 전장 아래 버튼 칸 바탕 */
  private drawButtonDock(): void {
    const { ctx, layout } = this;
    const y = layout.fieldHeight;
    const g = ctx.createLinearGradient(0, y, 0, layout.height);
    g.addColorStop(0, '#141a26');
    g.addColorStop(1, '#0b0d14');
    ctx.fillStyle = g;
    ctx.fillRect(0, y, layout.width, layout.height - y);
    ctx.fillStyle = 'rgba(255, 209, 102, 0.25)';
    ctx.fillRect(0, y, layout.width, 1);
  }

  /** 면 고르기 십자: 북·동·남·서 (무기 수 / 칸 수). 고른 면은 금색, 무기를 집었으면 옮길 곳은 하늘색 */
  private drawFacePad(state: GameState, ui: UiState): void {
    const { ctx, layout } = this;
    const n = state.config.tower.faceSlots;
    const picked = ui.picked !== null ? state.weapons[ui.picked] : undefined;
    const next = forecastVisible(state) ? mainFace(state.nextPlan) : null;
    const pulse = 0.5 + 0.5 * Math.sin(this.now * 6);
    for (const face of FACES) {
      const r = layout.facePad[face];
      const selected = face === state.face;
      const moveTarget = !!picked && picked.face !== face;
      const count = faceWeaponCount(state, face);
      const hover = ui.hoverButton === 'face' && ui.hoverFacePad === face;
      const alarmAge = this.now - (this.faceAlarm[face] ?? -99);
      const alarm = alarmAge < 0.6 ? 1 - alarmAge / 0.6 : 0;
      const border = moveTarget ? 'rgba(159, 224, 255, 0.9)' : selected ? `${C.gold}dd` : hover ? 'rgba(255,255,255,0.35)' : C.glassHi;
      panel(ctx, r, selected ? 'rgba(255, 209, 102, 0.2)' : hover ? 'rgba(40, 48, 72, 0.92)' : 'rgba(16, 20, 32, 0.82)', border, undefined, 7);
      if (alarm > 0) {
        roundRect(ctx, r.x, r.y, r.w, r.h, 7);
        ctx.fillStyle = `rgba(255, 70, 70, ${0.5 * alarm})`;
        ctx.fill();
      }
      if (next === face) {
        roundRect(ctx, r.x - 1.5, r.y - 1.5, r.w + 3, r.h + 3, 8);
        ctx.strokeStyle = `rgba(255, 209, 102, ${0.35 + 0.5 * pulse})`;
        ctx.stroke();
      }
      const big = r.w >= 30;
      text(ctx, FACE_INFO[face].label, r.x + r.w / 2, r.y + r.h / 2 - (big ? 4 : 3), selected ? C.gold : moveTarget ? '#9fe0ff' : '#ffffff', big ? 9.5 : 8, 'center', true);
      text(ctx, `${count}/${n}`, r.x + r.w / 2, r.y + r.h / 2 + (big ? 7 : 6), count === 0 ? '#ff9d9d' : C.dim, big ? 6.5 : 6, 'center');
    }
  }

  private drawHud(state: GameState, ui: UiState): void {
    const { ctx, layout } = this;
    const c = state.config;
    const endless = state.mode === 'endless';

    // 라운드: 숫자 + 얇은 진행 막대 (막대 색은 하늘을 따라간다)
    const rp = layout.hud.round;
    pill(ctx, rp);
    const bossRound = !endless && state.round === c.totalRounds;
    const roundLabel = endless ? `${state.round}` : `${state.round}/${c.totalRounds}`;
    text(ctx, roundLabel, rp.x + 10, rp.y + 8.5, '#ffffff', 9, 'left', true);
    ctx.font = `700 9px ${FONT}`;
    text(ctx, '라운드', rp.x + 13 + ctx.measureText(roundLabel).width, rp.y + 8.5, C.dim, 7);
    if (bossRound) {
      text(ctx, '보스전', rp.x + rp.w - 10, rp.y + 8.5, Math.floor(this.now * 3) % 2 ? C.red : '#ffb0b0', 7.5, 'right', true);
    } else {
      text(ctx, timeLeftLabel(state), rp.x + rp.w - 10, rp.y + 8.5, C.dim, 7, 'right');
    }
    const sky = skyAt({ round: state.round, roundTime: state.roundTime, roundSeconds: c.roundSeconds, totalRounds: c.totalRounds, mode: state.mode });
    const barColor = bossRound ? C.red : sky.night > 0.5 ? '#a88bff' : sky.dusk > 0.5 ? '#ffae66' : C.accent;
    bar(ctx, rp.x + 10, rp.y + 14.5, rp.w - 20, 2, bossRound ? 1 : Math.min(1, state.roundTime / c.roundSeconds), barColor);

    // 남은 적
    const ep = layout.hud.enemies;
    pill(ctx, ep);
    const alive = state.enemies.filter((e) => e.hp > 0).length;
    drawSprite(ctx, ENEMY_SPRITES.goblin[0], ep.x + 5, ep.y + 4, 1);
    text(ctx, `${alive}`, ep.x + ep.w - 8, ep.y + 10.5, alive > 25 ? '#ffb0b0' : C.text, 8, 'right', true);

    // 골드 (코인이 도착하면 톡 튄다)
    const gp = layout.hud.gold;
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
    const hp = layout.hud.hp;
    const mid = hp.y + hp.h / 2;
    pill(ctx, hp);
    const beat = ratio < 0.35 ? 1 + 0.25 * Math.max(0, Math.sin(this.now * 10)) : 1;
    ctx.save();
    ctx.translate(hp.x + 10.5, mid);
    ctx.scale(beat, beat);
    drawSprite(ctx, ICONS.heart, -4.5, -4.5, 1);
    ctx.restore();
    bar(ctx, hp.x + 20, mid - 3, hp.w - 28, 6, ratio, ratio > 0.3 ? C.green : C.red, this.ghostHp);
    text(ctx, `${Math.ceil(t.hp)}`, hp.x + hp.w / 2 + 6, mid + 0.5, '#ffffff', 6.5, 'center', true);

    // 오른쪽 위 둥근 버튼: 정보 · 배속 · 정지 · 소리
    const hb = ui.hoverButton;
    this.iconButton(layout.info, 'i', hb === 'info' || ui.infoOpen, ui.infoOpen);
    if (state.perks.length) this.badge(layout.info.x + layout.info.w - 2, layout.info.y + 2, `${state.perks.length}`, '#b48cff');
    this.iconButton(layout.speed, ui.speed === 2 ? '»' : '›', hb === 'speed', ui.speed === 2);
    this.iconButton(layout.pause, ui.paused ? '▶' : 'Ⅱ', hb === 'pause', ui.paused);
    this.iconButton(layout.mute, ui.audio.muted ? '×' : '♪', hb === 'mute' || ui.audioOpen, ui.audioOpen);
    if (ui.audioOpen) this.drawAudioPanel(ui, layout.audio);

    if (hb === 'info' || ui.infoOpen) this.drawStats(state);
  }

  /** 소리 설정 창: 효과음 · 음악 막대, 끄기 */
  private drawAudioPanel(ui: UiState, L: AudioPanel): void {
    const { ctx } = this;
    const a: AudioSettings = ui.audio;
    panel(ctx, L.panel, 'rgba(12, 15, 24, 0.95)', C.glassHi, undefined, 10);
    const row = (label: string, r: Rect, v: number) => {
      text(ctx, label, L.panel.x + 10, r.y + r.h / 2 + 0.5, C.text, 7.5, 'left', true);
      bar(ctx, r.x, r.y + 3, r.w, 4, a.muted ? 0 : v, a.muted ? C.dim : C.gold);
      const kx = r.x + r.w * v;
      ctx.beginPath();
      ctx.arc(kx, r.y + r.h / 2, 4, 0, Math.PI * 2);
      ctx.fillStyle = a.muted ? C.dim : '#ffffff';
      ctx.fill();
      text(ctx, `${Math.round(v * 100)}`, r.x + r.w + 4, r.y + r.h / 2 + 0.5, C.dim, 6.5, 'left');
    };
    row('효과음', L.sfx, a.sfx);
    row('음악', L.music, a.music);
    pill(ctx, L.mute, a.muted ? 'rgba(120, 30, 40, 0.8)' : 'rgba(16, 20, 32, 0.8)', a.muted ? C.red : C.glassHi);
    text(ctx, a.muted ? '소리 꺼짐 · 눌러서 켜기 (M)' : '소리 모두 끄기 (M)', L.mute.x + L.mute.w / 2, L.mute.y + L.mute.h / 2 + 0.5, a.muted ? '#ffd6d6' : C.text, 7, 'center', true);
    if (L.lesson) {
      pill(ctx, L.lesson, ui.hoverStart === 'set:lesson' ? 'rgba(40, 48, 72, 0.95)' : 'rgba(16, 20, 32, 0.8)', C.glassHi);
      text(ctx, '튜토리얼 다시 하기', L.lesson.x + L.lesson.w / 2, L.lesson.y + L.lesson.h / 2 + 0.5, C.text, 7, 'center', true);
    }
    if (L.reset) {
      const armed = ui.resetArmed !== null;
      pill(ctx, L.reset, armed ? 'rgba(150, 30, 40, 0.9)' : ui.hoverStart === 'set:reset' ? 'rgba(70, 30, 40, 0.9)' : 'rgba(16, 20, 32, 0.8)', armed ? C.red : 'rgba(255, 107, 107, 0.4)');
      text(ctx, armed ? '정말 지울까? 한 번 더 누르면 초기화' : '게임 초기화 (진행 모두 지우기)', L.reset.x + L.reset.w / 2, L.reset.y + L.reset.h / 2 + 0.5, armed ? '#ffffff' : '#ff9d9d', 7, 'center', true);
    }
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
    const hud = this.layout.hud.hp;
    this.tip = { x: this.layout.width - w - 6, y: hud.y + hud.h + 5, w, lines };
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
        // 빈 칸: 보상 카드로 새 스킬을 배우면 채워진다
        ctx.beginPath();
        ctx.arc(cx, cy, hover ? 3 : 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fill();
        return;
      }
      const def = findSkill(owned.id);
      const cd = skillCooldownLeft(state, owned.id);
      const ready = cd <= 0;
      const color = TAG_INFO[def.tags[0]].color;
      const aiming = ui.aiming === owned.id;
      circle(r, hover || aiming ? 'rgba(40, 48, 72, 0.95)' : 'rgba(16, 20, 32, 0.85)', ready ? `${color}cc` : 'rgba(255,255,255,0.12)', ready ? 1.5 : 1);
      const icon = SKILL_ICONS[owned.id];
      if (icon) drawSprite(ctx, icon, cx - 9, cy - 9, 2, false);
      if (cd > 0) {
        // 재사용 대기: 시계 방향으로 걷히는 그림자 + 남은 초
        const full = skillCooldownOf(state, owned.id);
        const frac = Math.min(1, cd / full);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r.w / 2 - 1, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = 'rgba(6, 8, 13, 0.68)';
        ctx.fill();
        text(ctx, `${Math.ceil(cd)}`, cx, cy + 0.5, '#ffffff', 9, 'center', true);
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

    // 스킬 바 양옆: 탑 돌리기 (Z 반시계 · X 시계)
    const cdFull = state.config.tower.rotateCooldown;
    const cdLeft = state.rotateLeft;
    for (const [r, dir, key] of [[layout.rotateLeft, -1, 'Z'], [layout.rotateRight, 1, 'X']] as const) {
      const hover = ui.hoverRotate === dir;
      const ready = cdLeft <= 0;
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      circle(r, hover ? 'rgba(40, 48, 72, 0.95)' : 'rgba(16, 20, 32, 0.85)', ready ? `${C.gold}cc` : 'rgba(255,255,255,0.12)', ready ? 1.5 : 1);
      // 둥근 화살표
      ctx.strokeStyle = ready ? C.gold : C.dim;
      ctx.lineWidth = 2;
      ctx.beginPath();
      const start = dir === 1 ? -Math.PI * 0.9 : -Math.PI * 0.1;
      const end = dir === 1 ? Math.PI * 0.4 : -Math.PI * 1.4;
      ctx.arc(cx, cy, 7, start, end, dir !== 1);
      ctx.stroke();
      ctx.lineWidth = 1;
      const tip = { x: cx + Math.cos(end) * 7, y: cy + Math.sin(end) * 7 };
      const tangent = end + (dir === 1 ? Math.PI / 2 : -Math.PI / 2);
      ctx.fillStyle = ready ? C.gold : C.dim;
      ctx.beginPath();
      ctx.moveTo(tip.x + Math.cos(tangent) * 4, tip.y + Math.sin(tangent) * 4);
      ctx.lineTo(tip.x + Math.cos(tangent + 2.3) * 4, tip.y + Math.sin(tangent + 2.3) * 4);
      ctx.lineTo(tip.x + Math.cos(tangent - 2.3) * 4, tip.y + Math.sin(tangent - 2.3) * 4);
      ctx.closePath();
      ctx.fill();
      if (!ready) {
        const frac = Math.min(1, cdLeft / cdFull);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r.w / 2 - 1, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = 'rgba(6, 8, 13, 0.68)';
        ctx.fill();
        text(ctx, `${Math.ceil(cdLeft)}`, cx, cy + 0.5, '#ffffff', 9, 'center', true);
      }
      text(ctx, key, r.x + r.w - 2, r.y + r.h - 1, ready ? C.text : C.dim, 6.5, 'center', true);
      if (hover) {
        this.tip = {
          x: cx - 90,
          y: r.y - 6,
          w: 180,
          above: true,
          lines: [
            [`탑 돌리기 · ${dir === 1 ? '시계' : '반시계'} 방향 [${key}]`, C.gold, 8.5],
            ['모든 무기가 한 칸씩 돌아간다 · 쉬지 않고 바로 쏜다', C.text],
            [`다시 돌리려면 ${cdFull}초`, C.dim],
          ],
        };
      }
    }

    this.drawUltButton(state, ui, circle);

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
          [`${skillName(hovered.id, hovered.evolved)} · 재사용 ${cooldownLabel(skillCooldownOf(state, hovered.id))}초`, TAG_INFO[def.tags[0]].color, 8.5],
          [hovered.evolved && def.evolve ? def.evolve.desc : def.desc, C.text],
          ...(def.road ? [['길 스킬: 마우스가 있는 길(없으면 적이 가장 많은 길)', C.dim] as [string, string]] : []),
          [`속성 ${def.tags.map((tg) => TAG_INFO[tg].label).join(' · ')}`, C.dim],
        ],
      };
    } else if (typeof ui.hoverSkill === 'number') {
      const r = layout.skills[ui.hoverSkill];
      this.tip = { x: r.x + r.w / 2 - 80, y: r.y - 6, w: 160, above: true, lines: [['빈 스킬 칸', C.text, 8.5], ['보상 카드에서 새 스킬을 배우면 채워진다', C.dim]] };
    }
  }

  /** 궁극기 버튼: 둘레에 게이지가 차고, 가득 차면 빛난다 */
  private drawUltButton(state: GameState, ui: UiState, circle: (r: Rect, fill: string, stroke: string, width?: number) => void): void {
    const { ctx, layout } = this;
    const r = layout.ult;
    const def = ultimateFor(state.hero);
    const ready = ultReady(state);
    const hover = ui.hoverButton === 'ult';
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    const pulse = 0.5 + 0.5 * Math.sin(this.now * 6);
    if (ready) {
      const g = ctx.createRadialGradient(cx, cy, r.w / 4, cx, cy, r.w);
      g.addColorStop(0, `rgba(255, 209, 102, ${0.35 + 0.25 * pulse})`);
      g.addColorStop(1, 'rgba(255, 209, 102, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(cx - r.w, cy - r.h, r.w * 2, r.h * 2);
    }
    circle(r, hover ? 'rgba(48, 40, 24, 0.95)' : 'rgba(24, 20, 14, 0.9)', ready ? C.gold : 'rgba(255,255,255,0.12)', ready ? 2 : 1);
    // 게이지 (12시부터 시계 방향)
    const frac = Math.min(1, state.ult / ULT.max);
    if (frac > 0) {
      ctx.strokeStyle = ready ? '#fff1b8' : C.gold;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, r.w / 2 - 2, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    }
    text(ctx, '★', cx, cy - 1, ready ? '#fff1b8' : C.dim, ready ? 13 + pulse : 11, 'center', true);
    text(ctx, ready ? '궁극기' : `${Math.floor(frac * 100)}%`, cx, cy + 9, ready ? C.gold : C.dim, 6, 'center', true);
    if (!layout.portrait) text(ctx, 'G', r.x + r.w - 2, r.y + r.h - 1, ready ? C.text : C.dim, 6.5, 'center', true);
    if (hover) {
      this.tip = {
        x: Math.min(layout.width - 196, cx - 95),
        y: r.y - 6,
        w: 190,
        above: true,
        lines: [
          [`궁극기 · ${def.name}${layout.portrait ? '' : ' [G]'}`, C.gold, 8.5],
          [def.desc, C.text],
          ['적을 잡거나 탑이 맞으면 찬다 · 전장을 눌러 직접 때려도 조금', C.dim],
        ],
      };
    }
  }

  /** 장수 체력바 · 연속 처치 · 지금 사건과 다음 사건 예보 */
  private drawFeel(state: GameState): void {
    const { ctx, layout } = this;
    const top = layout.hud.hp.y + layout.hud.hp.h + 4;
    // 사건 칩 (왼쪽)
    let chipY = layout.portrait ? top : layout.hud.round.y + layout.hud.round.h + 3;
    const chip = (label: string, color: string) => {
      ctx.font = `700 7px ${FONT}`;
      const w = ctx.measureText(label).width + 14;
      pill(ctx, { x: layout.hud.round.x, y: chipY, w, h: 12 }, 'rgba(30, 16, 44, 0.85)', `${color}99`);
      text(ctx, label, layout.hud.round.x + 7, chipY + 6.5, color, 7, 'left', true);
      chipY += 14;
    };
    if (state.incident) chip(`사건 · ${INCIDENTS[state.incident].name}`, '#d9a8ff');
    const next = nextIncidentShown(state);
    if (forecastVisible(state) && next) chip(next === 'hidden' ? '다음 · 안개에 가려 보이지 않는다' : `다음 · ${INCIDENTS[next].name}`, '#b48cff');

    // 장수 체력바 (가운데 위)
    const b = bossBar(state);
    // 세로 화면은 사건 칩 아래로 내린다
    const barY = layout.portrait ? Math.max(top + 16, chipY + 2) : top + 2;
    if (b) {
      const w = layout.portrait ? layout.width - 40 : 240;
      const x = (layout.width - w) / 2;
      const color = b.officer ? '#ff9d4d' : b.enraged ? '#ff3b3b' : C.red;
      panel(ctx, { x: x - 4, y: barY - 2, w: w + 8, h: 20 }, 'rgba(12, 10, 16, 0.82)', `${color}88`, undefined, 6);
      text(ctx, b.name, x, barY + 4, b.officer ? '#ffd0a8' : '#ffd6d6', 7.5, 'left', true);
      text(ctx, `${Math.ceil(b.frac * 100)}%${b.enraged ? ' · 날뛴다' : ''}`, x + w, barY + 4, C.dim, 7, 'right', true);
      bar(ctx, x, barY + 9, w, 5, b.frac, color);
      for (const m of b.marks) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillRect(Math.round(x + w * m), barY + 8, 1, 7);
      }
      if (b.windup !== null) bar(ctx, x, barY + 15, w, 2, b.windup, '#ff9d4d');
    }

    // 연속 처치 (오른쪽)
    const combo = comboView(state.combo.count);
    if (combo) {
      const fade = Math.min(1, (state.combo.left / COMBO.window) * 2);
      ctx.globalAlpha = fade;
      const y = (b ? barY + 30 : barY + 8) + combo.size / 2;
      text(ctx, combo.text, layout.width - 10, y, combo.color, combo.size, 'right', true);
      ctx.globalAlpha = 1;
    }
  }

  // ───────── 상점 (아래쪽 작은 카드 한 줄) ─────────

  private drawShop(state: GameState, ui: UiState): void {
    const { ctx, layout } = this;
    const counts = weaponCounts(state, state.face);
    layout.cards.forEach((r, i) => this.drawCard(r, state.shop[i], i, state, counts, ui.hover === i && ui.started));

    const cost = rerollCost(state);
    const can = state.gold >= cost;
    const rr = layout.reroll;
    const hover = ui.hoverButton === 'reroll';
    panel(ctx, { ...rr, y: rr.y - (hover && can ? 1 : 0) }, hover ? 'rgba(40, 48, 72, 0.92)' : C.glass, hover ? 'rgba(255,255,255,0.3)' : C.glassHi, undefined, 8);
    if (rr.h < 40) {
      // 세로 화면: 넓고 낮은 버튼 한 줄
      text(ctx, '⟳ 새로 고침', rr.x + rr.w / 2 - 14, rr.y + rr.h / 2 + 0.5, can ? C.text : C.dim, 9, 'center', true);
      text(ctx, cost === 0 ? '무료' : `${cost}G`, rr.x + rr.w / 2 + 34, rr.y + rr.h / 2 + 0.5, can ? C.gold : '#ff8080', 8.5, 'center', true);
    } else {
      text(ctx, '⟳', rr.x + rr.w / 2, rr.y + 16, can ? C.text : C.dim, 14, 'center', true);
      text(ctx, cost === 0 ? '무료' : `${cost}`, rr.x + rr.w / 2, rr.y + 34, can ? C.gold : '#ff8080', 7.5, 'center', true);
      text(ctx, 'R', rr.x + rr.w - 6, rr.y + 7, C.dim, 6, 'center');
    }
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
      text(ctx, last ? '품절' : timeLeftLabel(state), 0, 0, 'rgba(255,255,255,0.35)', 8, 'center', true);
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
    else if (noSlot) this.badgeText(box.x + 3, box.y + 4, '면 꽉 참', '#ff8080');
    else if (item.kind === 'weapon' && state.config.sets.thresholds.includes(counts[item.type] + 1)) this.badgeText(box.x + 3, box.y + 4, '세트', blink ? '#ffffff' : color);
    ctx.restore();

    if (hover) {
      const lines: [string, string, number?][] = [[`${item.name}${legendary ? ' · 전설' : ''}`, color, 9]];
      if (item.kind === 'weapon') {
        lines.push([`${TYPE_INFO[item.type].label} · 피해 ${item.damage} · ${item.cooldown}초 · 사거리 ${item.range}`, C.text]);
        lines.push([item.desc, C.dim]);
        const after = counts[item.type] + 1;
        const face = FACE_INFO[state.face].label;
        if (merges) lines.push(['사면 같은 무기 3개가 ★2 로 합쳐진다', C.gold]);
        else lines.push([`${face}쪽 면에 붙는다 · ${TYPE_INFO[item.type].label} 면 세트 ${after}개째`, state.config.sets.thresholds.includes(after) ? C.gold : C.dim]);
      } else {
        lines.push([item.desc, C.text]);
      }
      if (noSlot) lines.push([`${FACE_INFO[state.face].label}쪽 면이 꽉 찼다 · 다른 면을 고르거나 옮기자`, '#ff8080']);
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

  // ───────── 튜토리얼 판 ─────────

  /** 위쪽 안내 창 + 지금 눌러야 할 곳 반짝이기 */
  private drawLesson(state: GameState, ui: UiState, lesson: Lesson): void {
    const { ctx, layout } = this;
    const st = LESSON_STEPS[lesson.step];
    const pulse = 0.5 + 0.5 * Math.sin(this.now * 5);
    const glow = (r: Rect, radius = 8) => {
      roundRect(ctx, r.x - 3, r.y - 3, r.w + 6, r.h + 6, radius);
      ctx.strokeStyle = `rgba(255, 209, 102, ${0.45 + 0.5 * pulse})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.lineWidth = 1;
    };
    const t = state.tower;
    const n = state.config.tower.faceSlots;
    const faceGlow = (face: Face) => {
      // 탑 둘레 칸(전장 좌표)과 면 고르기 버튼(화면 좌표)을 함께 반짝인다
      const a = slotRect(t, face, 0, n);
      const b = slotRect(t, face, n - 1, n);
      ctx.save();
      this.useCamera();
      glow({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.max(a.x + a.w, b.x + b.w) - Math.min(a.x, b.x), h: Math.max(a.y + a.h, b.y + b.h) - Math.min(a.y, b.y) }, 6);
      ctx.restore();
      glow(layout.facePad[face], 6);
    };
    switch (st.target) {
      case 'cards':
        for (const c of layout.cards) glow(c);
        break;
      case 'face':
        faceGlow(state.weapons[0]?.face ?? lesson.face);
        break;
      case 'otherFace':
        faceGlow(lesson.otherFace);
        if (!state.weapons.some((w) => w.face === lesson.otherFace)) for (const c of layout.cards) glow(c);
        break;
      case 'rotate':
        glow(layout.rotateLeft, 16);
        glow(layout.rotateRight, 16);
        break;
      case 'skill':
        glow(layout.skills[0], 16);
        break;
      case 'forecast':
        for (const f of FACES) {
          if (state.nextPlan[f] <= 0) continue;
          const p = this.roadMarker(state, f);
          glow({ x: p.x - 30, y: p.y - 9, w: 60, h: 18 }, 9);
        }
        break;
    }

    const p = layout.lessonPanel;
    panel(ctx, p, 'rgba(12, 15, 24, 0.94)', `rgba(255, 209, 102, ${0.5 + 0.3 * pulse})`, undefined, 12);
    const part = lessonPart(lesson);
    text(ctx, part ? `튜토리얼 ${part}/${LESSON_PARTS}` : '튜토리얼 끝', p.x + 12, p.y + 12, C.dim, 7, 'left', true);
    text(ctx, st.title, p.x + 72, p.y + 12, C.gold, 10, 'left', true);
    this.wrap(lessonText(st, lesson), p.x + 12, p.y + 27, p.w - 24, 10, C.text, layout.portrait ? 3 : 2, 8);
    const skip = layout.lessonSkip;
    pill(ctx, skip, ui.hoverLesson === 'skip' ? 'rgba(40, 48, 72, 0.95)' : 'rgba(16, 20, 32, 0.8)', C.glassHi);
    text(ctx, '건너뛰기', skip.x + skip.w / 2, skip.y + skip.h / 2 + 0.5, C.dim, 7, 'center', true);
    const next = layout.lessonNext;
    if (st.next) {
      pill(ctx, next, ui.hoverLesson === 'next' ? 'rgba(255, 209, 102, 0.35)' : 'rgba(255, 209, 102, 0.2)', C.gold);
      text(ctx, st.id === 'done' ? '메뉴로 ▶' : '다음 ▶', next.x + next.w / 2, next.y + next.h / 2 + 0.5, C.gold, 7.5, 'center', true);
    } else {
      text(ctx, '해 보면 넘어간다', next.x + next.w / 2, next.y + next.h / 2 + 0.5, `rgba(255, 209, 102, ${0.5 + 0.5 * pulse})`, 7, 'center', true);
    }
  }

  // ───────── 첫 판 안내 ─────────

  private drawHint(state: GameState, progress: TutorialProgress): void {
    const hint = tutorialHint(state, progress);
    if (!hint) return;
    const { ctx, layout } = this;
    ctx.font = `500 7.5px ${FONT}`;
    const w = Math.max(ctx.measureText(hint.text).width, 60) + 24;
    // 가운데 아래는 남쪽 길 표시와 스킬 바가 있으니 왼쪽 아래에 (세로는 전장 아래 끝)
    const y = layout.portrait ? layout.fieldHeight - 28 : Math.min(layout.skills[0].y, layout.facePad.n.y) - 30;
    const box = { x: 8, y, w: Math.min(w, layout.width - 16), h: 22 };
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
      }
      ctx.globalAlpha = 1;
    }
  }

  // ───────── 오버레이 ─────────

  /** 화면 전체를 어둡게 (메뉴 상자 안에서 불러도 화면 끝까지) */
  private dim(alpha: number): void {
    const { ctx } = this;
    ctx.save();
    if (this.base) ctx.setTransform(this.base);
    ctx.fillStyle = `rgba(6, 8, 13, ${alpha})`;
    ctx.fillRect(0, 0, this.layout.width, this.layout.height);
    ctx.restore();
  }

  /** 탑별 궁극기 연출 */
  private ultFx(ev: Extract<GameEvent, { kind: 'ultimate' }>, state: GameState): void {
    const t = state.tower;
    const def = ultimateFor(state.hero);
    const alive = state.enemies.filter((e) => e.hp > 0).slice(0, 40);
    this.banner({ style: 'merge', title: `★ ${def.name}`, sub: ev.id === 'dice' ? `주사위 ${ev.roll}${ev.roll === 1 ? ' · 위로금' : ''}` : def.desc, color: C.gold, life: 1.8 });
    this.fx.shake(5, 0.4);
    switch (ev.id) {
      case 'gate':
        this.fx.ring({ x: t.x, y: t.y }, ULT.gatePush, C.gold, 0.6);
        this.fx.ring({ x: t.x, y: t.y }, ULT.gatePush * 0.7, '#fff1b8', 0.4);
        this.fx.flash('#ffd166', 0.2);
        break;
      case 'volley':
        for (const f of FACES) {
          const d = FACE_INFO[f];
          for (let k = 1; k <= 6; k++) this.fx.strike({ x: t.x + d.dx * k * 45, y: t.y + d.dy * k * 45 }, '#8fd16a', k * 0.03);
        }
        break;
      case 'starfall':
        for (const e of alive) this.fx.strike({ x: e.x, y: e.y }, '#9fe0ff', Math.random() * 0.2);
        this.fx.flash('#9fe0ff', 0.25);
        break;
      case 'barrage': {
        const d = FACE_INFO[ev.face];
        ULT.barrageAt.forEach((dist, i) => this.fx.meteor({ x: t.x + d.dx * dist, y: t.y + d.dy * dist }, ULT.barrageRadius, 0.25 + i * 0.12));
        break;
      }
      case 'dice':
        this.fx.floatText({ x: t.x, y: t.y - 60 }, `🎲 ${ev.roll}`, ev.roll === 6 ? C.gold : ev.roll === 1 ? C.red : '#ffffff', 22, 1.4);
        for (const e of alive) this.fx.ring({ x: e.x, y: e.y }, 10 + (ev.roll ?? 1) * 3, '#c77dff', 0.4);
        this.fx.flash(ev.roll === 6 ? '#ffd166' : '#c77dff', 0.2);
        break;
      case 'lantern':
        this.fx.ring({ x: t.x, y: t.y }, 260, '#fff4c2', 0.8);
        for (const e of alive) this.fx.sparkle({ x: e.x, y: e.y }, '#fff4c2');
        this.fx.flash('#fff4c2', 0.3);
        break;
    }
  }

  /** 밤 지도 갈림길: 길 셋 중 하나 (게임은 멈춰 있다) */
  private overlayRoute(state: GameState, ui: UiState): void {
    const { ctx, layout } = this;
    this.dim(0.78);
    text(ctx, '🌙 밤 지도', layout.width / 2, layout.perkCards[0].y - 22, '#ffffff', 13, 'center', true);
    text(ctx, `갈 길을 하나 고르기${layout.portrait ? '' : ' · 1 2 3'}`, layout.width / 2, layout.perkCards[0].y - 9, C.dim, 7.5, 'center');
    const since = this.now - this.choiceAt(state.route);
    state.route!.forEach((id, i) => {
      const n = ROUTE_NODES[id];
      let foot = '';
      if (id === 'elite') foot = `보상 카드 ×${ROUTE.eliteCards}`;
      if (id === 'forge') {
        const w = forgeTarget(state);
        if (w) foot = `추천: ${w.def.name} ${'★'.repeat(w.level)} → ${'★'.repeat(w.level + 1)}`;
      }
      if (id === 'gamble') foot = `${Math.floor(state.gold / 2)}G 를 건다`;
      if (id === 'campfire') foot = `체력 ${Math.ceil(state.tower.hp)} / ${Math.ceil(state.tower.maxHp)}`;
      this.drawPickCard(i, since, ui.hoverChoice === i, { icon: n.icon, color: NODE_COLORS[id], tag: '갈림길', title: n.name, desc: n.desc, foot });
    });
  }

  /** 안개 속 사건: 가운데 이야기, 양옆 두 선택지 */
  private overlayEncounter(state: GameState, ui: UiState): void {
    const { ctx, layout } = this;
    const id = state.encounter!;
    const def = ENCOUNTERS[id];
    this.dim(0.8);
    text(ctx, `❓ ${def.name}`, layout.width / 2, layout.perkCards[0].y - 22, '#ffffff', 13, 'center', true);
    text(ctx, `두 갈래 중 하나${layout.portrait ? '' : ' · 1 2'}`, layout.width / 2, layout.perkCards[0].y - 9, C.dim, 7.5, 'center');
    const since = this.now - this.choiceAt(state.encounter);
    this.drawPickCard(1, since, false, { icon: '❓', color: '#b48cff', tag: '안개 속 사건', title: def.name, desc: def.desc, foot: '' });
    def.options.forEach((o, k) => {
      const card = k === 0 ? 0 : 2;
      let foot = '';
      if (id === 'peddler' && k === 0) foot = `${peddlerCost(state)}G`;
      if (id === 'starshard' && k === 1) foot = `+${starshardGold(state)}G`;
      const ok = canChooseEncounter(state, k);
      this.drawPickCard(card, since, ui.hoverChoice === card && ok, { icon: k === 0 ? '✋' : '👣', color: ok ? '#9fe0ff' : '#6b7280', tag: `선택 ${k + 1}`, title: o.label, desc: o.desc, foot: ok ? foot : `${foot} · 골드가 모자라다`, dim: !ok });
    });
  }

  /** 새 기능 첫 안내: 고르는 창이 떠 있으면 카드 아래, 아니면 위쪽 가운데 */
  private drawIntro(state: GameState): void {
    const shown = this.introShown;
    if (!shown) return;
    const age = this.now - shown.born;
    if (age > Renderer.INTRO_LIFE) {
      this.introShown = null;
      return;
    }
    const { ctx, layout } = this;
    const pick = activePick(state);
    ctx.font = `500 7.5px ${FONT}`;
    const w = Math.min(layout.width - 16, Math.max(ctx.measureText(shown.hint.text).width, 80) + 28);
    const h = 30;
    const cards = layout.perkCards[0];
    // 모루는 탑 둘레 칸을 가리지 않게 제목 바로 아래
    const y = pick === 'forge' ? (layout.portrait ? 60 : 40) + 22 : pick ? Math.min(layout.height - h - 6, cards.y + cards.h + 10) : layout.portrait ? 96 : 62;
    const pop = easeOutBack(Math.min(1, age / 0.3));
    const fade = Math.min(1, (Renderer.INTRO_LIFE - age) / 0.5);
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(layout.width / 2, y + h / 2);
    ctx.scale(pop, pop);
    const pulse = 0.5 + 0.5 * Math.sin(this.now * 4);
    panel(ctx, { x: -w / 2, y: -h / 2, w, h }, 'rgba(12, 15, 24, 0.94)', `rgba(255, 209, 102, ${0.5 + 0.4 * pulse})`, undefined, 12);
    text(ctx, `✦ ${shown.hint.title}`, 0, -5, C.gold, 8.5, 'center', true);
    text(ctx, shown.hint.text, 0, 7, C.text, 7.5, 'center');
    ctx.restore();
  }

  /** 모루: 탑 둘레 무기 칸을 눌러 올릴 무기 고르기 (게임은 멈춰 있다) */
  private overlayForge(state: GameState, ui: UiState): void {
    const { ctx, layout } = this;
    this.dim(0.62);
    const top = layout.portrait ? 60 : 40;
    text(ctx, '⚒ 모루', layout.width / 2, top, '#ffffff', 13, 'center', true);
    text(ctx, `★ 를 올릴 무기를 누르기${layout.portrait ? '' : ' · Enter 는 추천 무기'}`, layout.width / 2, top + 13, C.dim, 7.5, 'center');
    // 무기 칸을 어둠 위에 다시 그리고, 올릴 수 있는 칸을 빛낸다
    ctx.save();
    this.useCamera();
    this.drawFaces(state, ui);
    const t = state.tower;
    const n = state.config.tower.faceSlots;
    const best = forgeTarget(state);
    const pulse = 0.5 + 0.5 * Math.sin(this.now * 5);
    let hoverTip: { x: number; y: number; label: string } | null = null;
    for (const face of FACES) {
      weaponsOn(state, face).forEach((idx, k) => {
        if (!canForge(state, idx)) return;
        const r = slotRect(t, face, k, n);
        const w = state.weapons[idx];
        const isBest = w === best;
        const hover = ui.hoverFace?.face === face && ui.hoverFace.slot === k;
        ctx.strokeStyle = isBest || hover ? `rgba(255, 241, 184, ${0.6 + 0.4 * pulse})` : `rgba(159, 224, 255, ${0.35 + 0.35 * pulse})`;
        ctx.lineWidth = isBest || hover ? 2 : 1;
        roundRect(ctx, r.x - 2, r.y - 2, r.w + 4, r.h + 4, 5);
        ctx.stroke();
        ctx.lineWidth = 1;
        if (isBest) text(ctx, '추천', r.x + r.w / 2, r.y - 6, C.gold, 6, 'center', true);
        if (hover) hoverTip = { x: r.x + r.w / 2, y: r.y + r.h + 10, label: `${w.def.name} ${'★'.repeat(w.level)} → ${'★'.repeat(w.level + 1)}` };
      });
    }
    if (hoverTip) {
      const tip = hoverTip as { x: number; y: number; label: string };
      ctx.font = `700 8px ${FONT}`;
      const tw = ctx.measureText(tip.label).width + 14;
      pill(ctx, { x: tip.x - tw / 2, y: tip.y - 7, w: tw, h: 14 }, 'rgba(12, 15, 24, 0.95)', C.gold);
      text(ctx, tip.label, tip.x, tip.y + 0.5, C.gold, 8, 'center', true);
    }
    ctx.restore();
  }

  /** 고르는 카드 한 장 (그림 대신 큰 기호) */
  private drawPickCard(i: number, since: number, hover: boolean, look: { icon: string; color: string; tag: string; title: string; desc: string; foot: string; dim?: boolean }): void {
    const { ctx, layout } = this;
    const r = layout.perkCards[i];
    const appear = easeOutCubic(Math.min(1, Math.max(0, (since - i * 0.07) / 0.3)));
    if (appear <= 0) return;
    ctx.save();
    ctx.globalAlpha = appear * (look.dim ? 0.6 : 1);
    ctx.translate(r.x + r.w / 2, r.y + r.h / 2 + (hover ? -5 : 0) + (1 - appear) * 16);
    const box = { x: -r.w / 2, y: -r.h / 2, w: r.w, h: r.h };
    panel(ctx, box, hover ? 'rgba(30, 34, 52, 0.96)' : 'rgba(18, 22, 34, 0.92)', hover ? `${look.color}dd` : C.glassHi, undefined, 14);
    const g = ctx.createRadialGradient(0, box.y + 44, 4, 0, box.y + 44, 46);
    g.addColorStop(0, `${look.color}${hover ? '55' : '30'}`);
    g.addColorStop(1, `${look.color}00`);
    ctx.fillStyle = g;
    ctx.fillRect(box.x + 4, box.y + 4, box.w - 8, 84);
    const bob = Math.round(Math.sin(this.now * 3 + i) * 2);
    text(ctx, look.icon, 0, box.y + 46 + bob, '#ffffff', 26, 'center');
    ctx.font = `700 6.5px ${FONT}`;
    const tw = ctx.measureText(look.tag).width + 12;
    pill(ctx, { x: -tw / 2, y: box.y + 10, w: tw, h: 12 }, `${look.color}22`, `${look.color}66`);
    text(ctx, look.tag, 0, box.y + 16.5, look.color, 6.5, 'center', true);
    text(ctx, look.title, 0, box.y + 86, '#ffffff', look.title.length > 9 ? 9.5 : 11, 'center', true);
    this.wrap(look.desc, 0, box.y + 102, box.w - 24, 10, C.dim, 4, 7.5, 'center');
    if (look.foot) text(ctx, look.foot, 0, box.y + box.h - 12, look.color, 7, 'center', true);
    ctx.restore();
  }

  /** 보상 카드 3장 중 1장 고르기 (게임은 멈춰 있다) */
  private overlayChoice(state: GameState, ui: UiState): void {
    const { ctx, layout } = this;
    this.dim(0.72);
    text(ctx, '보상 카드', layout.width / 2, layout.perkCards[0].y - 22, '#ffffff', 13, 'center', true);
    text(ctx, '특전 또는 스킬 · 하나 고르기 · 1 2 3', layout.width / 2, layout.perkCards[0].y - 9, C.dim, 7.5, 'center');
    const since = this.now - this.choiceAt(state.choice);
    state.choice!.forEach((card, i) => {
      const look = rewardLook(card, state);
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
      const bob = Math.round(Math.sin(this.now * 3 + i) * 2);
      drawSprite(ctx, look.icon, -look.icon.width * 1.5, box.y + 30 + bob, 3);
      ctx.font = `700 6.5px ${FONT}`;
      const tw = ctx.measureText(look.tag).width + 12;
      pill(ctx, { x: -tw / 2, y: box.y + 10, w: tw, h: 12 }, `${look.color}22`, `${look.color}66`);
      text(ctx, look.tag, 0, box.y + 16.5, look.color, 6.5, 'center', true);
      text(ctx, look.title, 0, box.y + 86, '#ffffff', look.title.length > 9 ? 9.5 : 11, 'center', true);
      this.wrap(look.desc, 0, box.y + 102, box.w - 24, 10, C.dim, 3, 7.5, 'center');
      if (look.foot) text(ctx, look.foot, 0, box.y + box.h - 12, look.footColor ?? C.dim, 7, 'center', true);
      text(ctx, `${i + 1}`, box.x + 10, box.y + 13, 'rgba(255,255,255,0.3)', 7, 'left', true);
      ctx.restore();
    });
  }

  private choiceShownFor: unknown = null;
  private choiceShownAt = 0;
  /** 고르는 창이 처음 뜬 시각 (카드가 하나씩 떠오르는 연출) */
  private choiceAt(open: unknown): number {
    if (this.choiceShownFor !== open) {
      this.choiceShownFor = open;
      this.choiceShownAt = this.now;
    }
    return this.choiceShownAt;
  }

  private overlayPause(ui: UiState): void {
    this.dim(0.5);
    const { ctx, layout } = this;
    const box = layout.pausePanel;
    const cx = box.x + box.w / 2;
    panel(ctx, box, 'rgba(12, 15, 24, 0.92)', C.glassHi, undefined, 12);
    text(ctx, '일시정지', cx, box.y + 17, '#ffffff', 13, 'center', true);
    const sub = this.layout.portrait ? '계속하기를 누르면 이어서' : 'Space · 오른쪽 위 ▶ · 계속하기';
    text(ctx, sub, cx, box.y + 33, C.dim, 7.5, 'center');
    const r = layout.pauseResume;
    pill(ctx, r, ui.hoverStart === 'pause:resume' ? 'rgba(255, 209, 102, 0.35)' : 'rgba(255, 209, 102, 0.2)', C.gold);
    text(ctx, '계속하기', r.x + r.w / 2, r.y + r.h / 2 + 0.5, C.gold, 8, 'center', true);
    // 튜토리얼은 건너뛰기가 따로 있다
    if (ui.lesson) return;
    const g = layout.pauseGiveUp;
    const armed = ui.giveUpArmed !== null;
    pill(ctx, g, armed ? 'rgba(150, 30, 40, 0.9)' : ui.hoverStart === 'pause:giveUp' ? 'rgba(70, 30, 40, 0.9)' : 'rgba(16, 20, 32, 0.8)', armed ? C.red : 'rgba(255, 107, 107, 0.4)');
    text(ctx, armed ? '정말? 한 번 더' : '포기하기', g.x + g.w / 2, g.y + g.h / 2 + 0.5, armed ? '#ffffff' : '#ff9d9d', 8, 'center', true);
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

  /** 별 70개 (자리·반짝임 박자 고정) */
  private splashStars = (() => {
    const rng = createRng(11);
    return Array.from({ length: 70 }, () => ({ x: rng.next(), y: rng.next() * 0.7, r: rng.range(0.4, 1.3), p: rng.range(0, 6.28) }));
  })();

  /** 타이틀: 길잡이별이 떨어지고 안개가 차오른 뒤, 탑 등불이 켜지며 로고 */
  private overlaySplash(ui: UiState): void {
    const { ctx, layout } = this;
    const W = layout.width;
    const H = layout.height;
    const t = ui.splashAt === null ? 0 : this.now - ui.splashAt;
    const f = splashFrame(t);
    const horizon = H * 0.74;

    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#03050c');
    sky.addColorStop(0.6, '#0b1226');
    sky.addColorStop(1, '#151b2c');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    for (const st of this.splashStars) {
      ctx.globalAlpha = (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(this.now * 1.7 + st.p))) * (1 - f.fog * 0.4);
      ctx.fillStyle = '#dfe8ff';
      ctx.fillRect(st.x * W, st.y * H, st.r, st.r);
    }
    ctx.globalAlpha = 1;

    // 떨어지는 길잡이별: 오른쪽 위에서 왼쪽 지평선으로
    const from = { x: W * 0.86, y: -12 };
    const to = { x: W * 0.2, y: horizon - 4 };
    if (f.fall < 1) {
      const p = f.fall ** 1.6;
      const x = from.x + (to.x - from.x) * p;
      const y = from.y + (to.y - from.y) * p;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.hypot(dx, dy);
      const tail = 70;
      const g = ctx.createLinearGradient(x, y, x - (dx / len) * tail, y - (dy / len) * tail);
      g.addColorStop(0, 'rgba(255, 243, 196, 0.95)');
      g.addColorStop(1, 'rgba(255, 209, 102, 0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - (dx / len) * tail, y - (dy / len) * tail);
      ctx.stroke();
      ctx.lineWidth = 1;
      const head = ctx.createRadialGradient(x, y, 0, x, y, 12);
      head.addColorStop(0, 'rgba(255, 255, 255, 1)');
      head.addColorStop(1, 'rgba(255, 209, 102, 0)');
      ctx.fillStyle = head;
      ctx.fillRect(x - 12, y - 12, 24, 24);
    }

    // 언덕 그림자
    ctx.fillStyle = '#070a12';
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    for (let x = 0; x <= W; x += 16) ctx.lineTo(x, horizon + Math.sin(x * 0.021) * 6 + Math.sin(x * 0.057) * 3);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    // 떨어진 자리 번쩍
    if (f.burst > 0) {
      const rad = 30 + 170 * (1 - f.burst);
      const b = ctx.createRadialGradient(to.x, to.y, 0, to.x, to.y, rad);
      b.addColorStop(0, `rgba(255, 243, 196, ${f.burst})`);
      b.addColorStop(1, 'rgba(255, 209, 102, 0)');
      ctx.fillStyle = b;
      ctx.fillRect(to.x - rad, to.y - rad, rad * 2, rad * 2);
      ctx.fillStyle = `rgba(255, 240, 200, ${f.burst * 0.25})`;
      ctx.fillRect(0, 0, W, H);
    }

    // 가운데 탑
    const scale = 2;
    const s = TOWER_SPRITE;
    const left = Math.round(W / 2 - (s.width * scale) / 2);
    const top = Math.round(horizon + 10 - s.height * scale);
    ctx.globalAlpha = 0.55 + 0.45 * f.logo;
    drawSprite(ctx, s, left, top, scale, false, 'normal');
    this.drawTowerTrim(left, top, scale, C.gold);
    ctx.globalAlpha = 1;

    // 잿빛 안개: 아래에서 차오르며 천천히 흐른다
    if (f.fog > 0) {
      for (let i = 0; i < 5; i++) {
        const y = H - f.fog * (40 + i * 22);
        const x = ((this.now * (8 + i * 3) + i * 140) % (W + 300)) - 150;
        const g = ctx.createRadialGradient(x, y, 10, x, y, 160);
        g.addColorStop(0, `rgba(150, 158, 178, ${0.22 * f.fog})`);
        g.addColorStop(1, 'rgba(150, 158, 178, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - 160, y - 160, 320, 320);
        const x2 = W - x;
        const g2 = ctx.createRadialGradient(x2, y + 10, 10, x2, y + 10, 140);
        g2.addColorStop(0, `rgba(130, 138, 160, ${0.18 * f.fog})`);
        g2.addColorStop(1, 'rgba(130, 138, 160, 0)');
        ctx.fillStyle = g2;
        ctx.fillRect(x2 - 140, y - 130, 280, 280);
      }
    }

    // 탑 등불이 켜지며 안개를 밀어낸다
    if (f.logo > 0) {
      const cx = W / 2;
      const cy = top + 14;
      const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 70 + 10 * Math.sin(this.now * 2));
      glow.addColorStop(0, `rgba(255, 209, 102, ${0.55 * f.logo})`);
      glow.addColorStop(1, 'rgba(255, 209, 102, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(cx - 90, cy - 90, 180, 180);
      ctx.save();
      ctx.globalAlpha = f.logo;
      const ly = H * 0.26 - (1 - f.logo) * 10 + Math.sin(this.now * 1.4) * 1.5;
      ctx.font = `800 36px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const g = ctx.createLinearGradient(0, ly - 18, 0, ly + 18);
      g.addColorStop(0, '#fff3c4');
      g.addColorStop(1, '#ffc24a');
      ctx.shadowColor = 'rgba(255, 190, 80, 0.55)';
      ctx.shadowBlur = 18;
      ctx.fillStyle = g;
      ctx.fillText('탑 수호자', W / 2, ly);
      ctx.restore();
      ctx.globalAlpha = f.logo;
      text(ctx, '별이 떨어진 밤', W / 2, H * 0.26 + 28, 'rgba(223, 232, 255, 0.85)', 10, 'center', true);
      text(ctx, '마지막 등불을 지켜라', W / 2, H * 0.26 + 42, 'rgba(223, 232, 255, 0.5)', 7.5, 'center');
      ctx.globalAlpha = 1;
    }
    if (ui.splashAt === null) {
      // 브라우저는 누르기 전엔 소리를 막는다: 한 번 눌러야 연출과 음악이 시작된다
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(this.now * 3);
      text(ctx, '화면을 누르거나 아무 키나 누르세요', W / 2, H * 0.3, C.gold, 10, 'center', true);
      ctx.globalAlpha = 1;
      text(ctx, '♪ 소리가 켜집니다', W / 2, H * 0.3 + 16, 'rgba(223, 232, 255, 0.45)', 7.5, 'center');
    } else if (f.prompt) {
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(this.now * 3);
      text(ctx, '아무 키나 누르거나 화면을 눌러 시작', W / 2, H * 0.9, C.gold, 9, 'center', true);
      ctx.globalAlpha = 1;
    }
  }

  private overlayStart(ui: UiState): void {
    const { ctx, layout } = this;
    const { w: width, h: fieldHeight } = layout.menu;
    const mt = layout.menuText;
    // 전장이 비쳐 보이게, 위아래만 살짝 어둡게
    this.dim(layout.portrait ? 0.45 : 0.28);
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
      const x = ((this.now * 24 + i * 90) % (width + 160)) - 80;
      ctx.globalAlpha = 0.85;
      drawSprite(ctx, f, x, fieldHeight - 4 - f.height * 2, 2, false);
      ctx.globalAlpha = 1;
    });

    this.drawTitle(mt.titleX, mt.titleY, mt.titleCenter);
    this.drawShards(ui.meta.shards, 36);

    // 탑 고르기
    for (const { id, rect } of layout.heroes) this.drawHeroCard(ui, id, rect);
    const hero = findHero(ui.hero);
    const weapon = findItem(hero.startWeapons[0]).name;
    text(ctx, `${CHAPTERS[hero.id].keeper} · "${hero.quote}"`, width / 2, mt.quoteY, hero.color, 8.5, 'center', true);
    this.wrap(`시작 무기 ${weapon} · ${hero.desc}`, width / 2, mt.descY, width - 20, 10, C.dim, 2, 7, 'center');

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
    text(ctx, ui.mode === 'classic' ? '15라운드 장수를 잡으면 끝' : '15라운드마다 장수, 끝없이', width / 2, mt.modeHintY, C.dim, 6.5, 'center');

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
    const sb = layout.storyButton;
    const unread = unreadCount(ui.meta);
    button(ctx, sb, '', ui.hoverStart === 'story' ? 'hover' : 'normal');
    text(ctx, '이야기 (T)', sb.x + sb.w / 2, sb.y + sb.h / 2 + 0.5, unread ? C.gold : C.text, 8, 'center', true);
    if (unread) this.badge(sb.x + sb.w - 6, sb.y + 5, `${unread}`, C.red);
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
    text(ctx, layout.portrait ? '난이도를 눌러 시작' : '난이도를 누르거나 Enter 로 시작', width / 2, mt.promptY, C.gold, 8, 'center', true);
    ctx.globalAlpha = 1;
    // 팁이 몇 초마다 바뀐다
    const tip = TIPS[Math.floor(this.now / 5) % TIPS.length];
    const phase = (this.now % 5) / 5;
    ctx.globalAlpha = Math.min(1, phase * 8, (1 - phase) * 8) * 0.9;
    this.wrap(tip, width / 2, mt.tipY, width - 20, 10, '#bfe3ff', 2, 7, 'center');
    ctx.globalAlpha = 1;
    if (mt.footY !== null) {
      text(ctx, '←→ 탑 · ↑↓ 난이도 · Tab 모드 · T 이야기 · S 강화 · A 업적', 10, mt.footY, 'rgba(255,255,255,0.35)', 6.5);
      if (ui.meta.runs > 0) text(ctx, `${ui.meta.runs}판째`, width - 10, mt.footY, 'rgba(255,255,255,0.35)', 6.5, 'right');
    }
    // 오른쪽 위 ⚙: 소리 · 튜토리얼 다시 하기 · 초기화
    this.iconButton(layout.gear, '⚙', ui.hoverStart === 'settings' || ui.audioOpen, ui.audioOpen);
    if (ui.audioOpen) this.drawAudioPanel(ui, layout.menuAudio);
  }

  /** 제목: 금빛 그라데이션에 은은한 빛, 천천히 떠오른다 */
  private drawTitle(x: number, y: number, center = false): void {
    const { ctx } = this;
    const bob = Math.sin(this.now * 1.6) * 1.2;
    ctx.save();
    ctx.font = `800 20px ${FONT}`;
    ctx.textAlign = center ? 'center' : 'left';
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
    if (center) text(ctx, '별이 떨어진 밤, 마지막 등불을 지켜라', x, y + 18, 'rgba(255,255,255,0.6)', 7.5, 'center');
    else text(ctx, '별이 떨어진 밤, 마지막 등불을 지켜라', x + w + 10, y + 2, 'rgba(255,255,255,0.6)', 7.5);
  }

  /** 오른쪽 위 별조각 */
  private drawShards(n: number, right = 10): void {
    const { ctx, layout } = this;
    ctx.font = `700 8.5px ${FONT}`;
    const label = `✦ ${n}`;
    const w = ctx.measureText(label).width + 18;
    const r = { x: layout.menu.w - w - right, y: 16, w, h: 20 };
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
    if (unlocked) text(ctx, CHAPTERS[id].keeper, r.x + 9, r.y + 9, 'rgba(255,255,255,0.45)', 6.5, 'left', true);
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
    this.dim(0.82);
    if (this.layout.portrait) {
      // 세로: 부제는 제목 아래 줄
      text(ctx, title, 12, 22, '#ffffff', 15, 'left', true);
      this.wrap(sub, 12, 40, this.layout.menu.w - 24, 9, C.dim, 1, 7);
      return;
    }
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
    this.overlayFx.draw(ctx, layout.menu.w, layout.menu.h);
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

  /** 이야기 책: 왼쪽 목록, 오른쪽 본문 */
  private overlayStory(ui: UiState): void {
    const { ctx, layout } = this;
    const pages = storyPages(ui.meta);
    const pieces = pages.filter((p) => p.kind === 'ending' && p.unlocked).length;
    this.screenHeader('이야기', `별이 떨어진 밤 · 진실 조각 ${pieces}/${HEROES.length}`);
    pages.forEach((p, i) => {
      const r = layout.storyTabs[i];
      const sel = ui.storyPage === i;
      const color = p.hero ? findHero(p.hero).color : C.gold;
      panel(ctx, r, sel ? 'rgba(255, 209, 102, 0.16)' : 'rgba(16, 20, 32, 0.8)', sel ? `${C.gold}cc` : ui.hoverStart === `page:${i}` ? 'rgba(255,255,255,0.3)' : C.glassHi, undefined, 8);
      const label = p.kind === 'world' ? '서막' : p.kind === 'true' ? '마지막 이야기' : `${findHero(p.hero!).name} ${p.kind === 'prologue' ? '서장' : '결말'}`;
      if (p.hero) {
        ctx.fillStyle = p.unlocked ? color : 'rgba(255,255,255,0.15)';
        ctx.fillRect(r.x + 7, r.y + 7, 6, 6);
      }
      text(ctx, p.unlocked ? label : `${label} · 잠김`, r.x + (p.hero ? 18 : 9), r.y + r.h / 2 + 0.5, p.unlocked ? (sel ? C.gold : C.text) : 'rgba(255,255,255,0.35)', 7.5, 'left', true);
      if (p.unlocked && !p.seen) this.badge(r.x + r.w - 8, r.y + r.h / 2, 'N', C.red);
    });
    const page = pages[ui.storyPage] ?? pages[0];
    const t = layout.storyText;
    panel(ctx, t, 'rgba(12, 15, 24, 0.9)', C.glassHi, undefined, 12);
    if (!page.unlocked) {
      text(ctx, '아직 열리지 않은 이야기', t.x + t.w / 2, t.y + t.h / 2 - 8, C.dim, 10, 'center', true);
      text(ctx, lockHint(page), t.x + t.w / 2, t.y + t.h / 2 + 8, 'rgba(255,255,255,0.45)', 7.5, 'center');
    } else {
      this.drawPageText(page, t, page.lines.length, 1);
      if (page.kind === 'ending') text(ctx, `진실 조각 · ${CHAPTERS[page.hero!].ending.piece}`, t.x + 16, t.y + t.h - 16, '#9fe0ff', 7.5, 'left', true);
    }
    button(ctx, layout.back, '돌아가기', ui.hoverStart === 'back' ? 'hover' : 'normal');
  }

  /** 쪽 제목과 본문 (보이는 줄 수만큼, 마지막 줄은 fade 로 떠오른다) */
  private drawPageText(page: StoryPage, r: Rect, shown: number, fade: number): void {
    const { ctx } = this;
    const color = page.hero ? findHero(page.hero).color : C.gold;
    text(ctx, page.title, r.x + 16, r.y + 20, color, 11, 'left', true);
    ctx.fillStyle = `${color}55`;
    ctx.fillRect(r.x + 16, r.y + 31, r.w - 32, 1);
    // 수호자(서막·마지막은 길잡이별) 초상화, 천천히 숨 쉬듯. 좁으면 위에 작게, 글은 그 아래
    const narrow = r.w < 400;
    const size = narrow ? 56 : 76;
    const scale = narrow ? 3 : 4;
    const frame = { x: r.x + 16, y: r.y + (narrow ? 40 : 42), w: size, h: size };
    panel(ctx, frame, 'rgba(255, 255, 255, 0.04)', `${color}88`, undefined, 10);
    const glow = ctx.createRadialGradient(frame.x + size / 2, frame.y + size * 0.58, 4, frame.x + size / 2, frame.y + size * 0.58, size * 0.53);
    glow.addColorStop(0, `${color}44`);
    glow.addColorStop(1, `${color}00`);
    ctx.fillStyle = glow;
    ctx.fillRect(frame.x + 2, frame.y + 2, frame.w - 4, frame.h - 4);
    const bob = Math.round(Math.sin(this.now * 2) * 1);
    const inset = (size - 16 * scale) / 2;
    drawSprite(ctx, portraitFor(page.hero), frame.x + inset, frame.y + inset + bob, scale);
    const name = page.hero ? CHAPTERS[page.hero].keeper : '길잡이별';
    if (narrow) text(ctx, name, frame.x + frame.w + 10, frame.y + frame.h / 2, color, 10, 'left', true);
    else text(ctx, name, frame.x + frame.w / 2, frame.y + frame.h + 10, color, 8, 'center', true);
    const tx = narrow ? r.x + 16 : r.x + 104;
    const ty = narrow ? frame.y + frame.h + 16 : r.y + 50;
    page.lines.slice(0, shown).forEach((line, k) => {
      ctx.globalAlpha = k === shown - 1 ? fade : 1;
      text(ctx, line, tx, ty + k * (narrow ? 16 : 17), C.text, 8.5);
      ctx.globalAlpha = 1;
    });
  }

  /** 판 위 이야기 카드 (서장·결말). 떠 있는 동안 판은 멈춘다 */
  private drawStoryCard(card: StoryCard): void {
    const { ctx, layout } = this;
    const page = cardPage(card);
    const age = this.now - card.openedAt;
    this.dim(0.7);
    const r = layout.storyCard;
    const color = page.hero ? findHero(page.hero).color : C.gold;
    panel(ctx, r, 'rgba(12, 15, 24, 0.96)', `${color}aa`, undefined, 14);
    const shown = shownLines(card, this.now);
    const fade = card.revealed ? 1 : Math.min(1, ((age % 0.45) / 0.3));
    this.drawPageText(page, r, shown, shown === page.lines.length && age > page.lines.length * 0.45 ? 1 : fade);
    if (card.pages.length > 1) text(ctx, `${card.index + 1}/${card.pages.length}`, r.x + r.w - 16, r.y + 20, C.dim, 7, 'right', true);
    const skip = layout.storyCardSkip;
    pill(ctx, skip, 'rgba(16, 20, 32, 0.8)', C.glassHi);
    text(ctx, '건너뛰기 (Esc)', skip.x + skip.w / 2, skip.y + skip.h / 2 + 0.5, C.dim, 6.5, 'center', true);
    const done = shown === page.lines.length;
    const pulse = 0.5 + 0.5 * Math.sin(this.now * 4);
    ctx.globalAlpha = done ? 0.55 + 0.45 * pulse : 0.4;
    const last = card.index === card.pages.length - 1;
    text(ctx, done ? (last ? '클릭 또는 Enter ▶' : '다음 ▶') : '클릭하면 한 번에', r.x + r.w - 16, skip.y + skip.h / 2 + 0.5, done ? C.gold : C.dim, 7.5, 'right', true);
    ctx.globalAlpha = 1;
  }

  /** 탑 위 말풍선 */
  private drawSpeech(state: GameState): void {
    const sp = this.speech;
    if (!sp) return;
    const life = 4.5;
    const age = this.now - sp.born;
    if (age > life) {
      this.speech = null;
      return;
    }
    const { ctx } = this;
    const t = state.tower;
    const top = slotRect(t, 'n', 0, state.config.tower.faceSlots).y - 10;
    ctx.font = `600 8px ${FONT}`;
    const w = Math.max(ctx.measureText(sp.beat.text).width, 30) + 20;
    const h = 26;
    const pop = easeOutBack(Math.min(1, age / 0.25));
    const fade = age > life - 0.5 ? (life - age) / 0.5 : 1;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(t.x, top);
    ctx.scale(pop, pop);
    const x = -w / 2;
    const y = -h - 5;
    roundRect(ctx, x, y, w, h, 8);
    ctx.fillStyle = 'rgba(12, 15, 24, 0.9)';
    ctx.fill();
    ctx.strokeStyle = `${sp.beat.color}bb`;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-5, y + h);
    ctx.lineTo(0, y + h + 5);
    ctx.lineTo(5, y + h);
    ctx.closePath();
    ctx.fillStyle = 'rgba(12, 15, 24, 0.9)';
    ctx.fill();
    text(ctx, sp.beat.keeper, x + 10, y + 8, sp.beat.color, 6.5, 'left', true);
    text(ctx, sp.beat.text, x + 10, y + 18, '#ffffff', 8, 'left', true);
    ctx.restore();
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
    const title = state.gaveUp ? (endless ? `${state.round}라운드에서 멈췄다` : '포기했다') : won ? '등불을 지켰다' : endless ? `${state.round}라운드까지 버텼다` : '탑이 무너졌다';
    text(ctx, title, cx, y + 20, accent, 14, 'center', true);
    const hero = state.hero ? findHero(state.hero) : null;
    if (hero) text(ctx, `${hero.name} ${CHAPTERS[hero.id].keeper} · "${won ? hero.winLine : hero.loseLine}"`, cx, y + 35, hero.color, 7.5, 'center');

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

/** 잠긴 쪽을 여는 방법 */
function lockHint(page: StoryPage): string {
  if (page.kind === 'true') return '다섯 탑 모두로 클래식을 이기면 열린다';
  const name = findHero(page.hero!).name;
  // 받침이 있으면 을·으로, 없으면 를·로 (ㄹ 받침도 로)
  const code = name.charCodeAt(name.length - 1) - 0xac00;
  const final = code >= 0 && code < 11172 ? code % 28 : 0;
  const obj = final ? '을' : '를';
  const by = final && final !== 8 ? '으로' : '로';
  return page.kind === 'prologue' ? `강화 상점에서 ${name}${obj} 열면 읽을 수 있다` : `${name}${by} 클래식을 이기면 열린다`;
}
