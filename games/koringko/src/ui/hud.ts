/** 놀이 화면 위 정보: 상태(HP · 태엽) · 탐험대 얼굴 · 미니맵 · 목표 · 보스 체력 · 단축칸 · 얼음 땡 · 알림 · 이름표 */
import { CLASSES, expToNext, LV_MAX, skillForKey } from '../core/classes.ts';
import { interactTarget, type Game } from '../core/game.ts';
import { TILE, type MapDef } from '../core/maps.ts';
import { NPCS } from '../core/story.ts';
import { currentGoal, errandsHere, questFor } from '../core/quests.ts';
import { castCheck } from '../core/player.ts';
import { skillLv } from '../core/character.ts';
import type { WorldEvent } from '../core/world.ts';
import { RULES } from '../core/riftrun.ts';
import { PARTS } from '../core/parts.ts';
import { heroState } from '../core/party.ts';
import { benchMaxHp, REVIVE } from '../core/tag.ts';
import { FREEZE } from '../core/freeze.ts';
import { RESCUE_WAVES, structureSpot } from '../core/rescue.ts';
import type { HeroId } from '../core/types.ts';
import { pixCanvas } from './art/canvas.ts';
import { heroSprite } from './art/heroes.ts';
import { candyIcon, skillIcon, SKILL_BG, goldIcon, windIcon } from './art/icons.ts';
import { C, type Ui } from './kit.ts';
import type { HudLayout } from './layout.ts';
import type { Label } from './render/scene.ts';
import type { Fx } from './render/fx.ts';

interface Toast {
  text: string;
  color: string;
  life: number;
  /** 같은 알림이 몇 번 겹쳤나 */
  n: number;
}

export const MAT_NAME: Record<string, string> = { fluff: '솜 조각', gear: '톱니', sugar: '설탕 결정', dust: '별가루', star: '별 조각' };
const WIND_COL = '#ffc83a';

export interface HudActions {
  menu: () => void;
  swap: (h: HeroId) => void;
}

export class Hud {
  toasts: Toast[] = [];
  banner: { title: string; sub: string; life: number } | null = null;
  /** 보스 등장 글씨 */
  bossBanner: { name: string; life: number } | null = null;
  levelUp = 0;
  /** 처음 안내 */
  hint: { text: string; life: number } | null = null;
  /** 균열 층에 들어오면 규칙을 알린다 */
  pendingRule = false;
  mini: { map: MapDef; img: HTMLCanvasElement } | null = null;

  toast(text: string, color = C.light, life = 2.6): void {
    const same = this.toasts.find((t) => t.text === text);
    if (same) {
      same.n++;
      same.life = Math.max(same.life, life);
      return;
    }
    this.toasts.push({ text, color, life, n: 1 });
    if (this.toasts.length > 5) this.toasts.shift();
  }

  onEvent(e: WorldEvent): void {
    switch (e.kind) {
      case 'enter':
        this.banner = { title: e.name, sub: e.level, life: 2.6 };
        this.pendingRule = true;
        break;
      case 'pickup':
        if (e.drop === 'part' && e.part) this.toast(`부품 「${PARTS[e.part].name}」 획득!`, PARTS[e.part].color, 3);
        else if (e.drop === 'potion') this.toast('사탕 +1', C.hp, 1.6);
        else if (e.drop === 'mat' && e.mat) this.toast(`${MAT_NAME[e.mat]} +1`, '#d8c8ff', 1.6);
        break;
      case 'errand':
        this.toast(`${e.item} 찾았다! 부탁한 친구에게 알려 주자`, '#ffe08a', 3);
        break;
      case 'chest':
        this.toast(e.part ? `보물 상자! 부품 「${PARTS[e.part].name}」 · 단추 +${e.gold}` : `보물 상자! 단추 +${e.gold}`, C.gold, 3.5);
        break;
      case 'heroDown':
        this.toast(`${CLASSES[e.hero].name} 쓰러짐! ${REVIVE.time}초 쉬면 일어나요`, C.bad, 3);
        break;
      case 'heroUp':
        this.toast(`${CLASSES[e.hero].name} 다시 일어났어요`, C.good, 2.4);
        break;
      case 'duo':
        this.bossBanner = { name: `합동 기술 · ${e.name}!`, life: 1.6 };
        break;
      case 'link':
        this.toast('교대 연계! 태엽 없이 더 세게', '#9af0ff', 1.6);
        break;
      case 'windEmpty':
        this.toast('태엽이 다 풀렸다! 잠깐 느려져요 (멈춰서 W 로 감기)', WIND_COL, 2.6);
        break;
      case 'overwind':
        this.toast('태엽 가득! 잠깐 동안 피해 +30%', WIND_COL, 2.4);
        break;
      case 'friend':
        this.toast(`${e.name} 구출! 블록 마을 주민이 되었어요`, '#9af0c0', 3.2);
        break;
      case 'join':
        this.toast(`${CLASSES[e.hero].name} 합류! ${e.hero === 'bori' ? '2' : e.hero === 'ruru' ? '3' : '4'} 키 · E 로 교대`, C.gold, 4);
        break;
      case 'rescueStart':
        this.toast('먼지 무리가 몰려온다! 모두 물리치자', C.bad, 3);
        break;
      case 'rescueWave':
        this.toast(`먼지 무리 ${e.wave}/${e.of}`, C.bad, 2.4);
        break;
      case 'caught':
        this.toast(`들켰다! HP -${e.amount}, 장난감들이 화났어요`, C.bad, 3);
        break;
      case 'freezeOk':
        this.toast('들키지 않았다! HP 조금 회복', C.good, 2.6);
        break;
      case 'levelUp':
        this.levelUp = 2.4;
        this.toast(`탐험대 레벨 ${e.lv}! 모두 강해지고 스킬 점수를 얻었어요 (K)`, C.gold, 3);
        break;
      case 'noSp':
        this.toast('태엽이 모자라요 (멈춰서 W 로 감기)', WIND_COL, 1.6);
        break;
      case 'bossIntro':
        this.bossBanner = { name: e.name, life: 2.6 };
        break;
      case 'bossUnwound':
        this.toast('곰 대장의 태엽이 풀렸다! 지금 공격하면 두 배!', C.gold, 3);
        break;
      case 'bossRewound':
        this.toast('곰 대장이 태엽을 다시 감았다', C.dim, 2);
        break;
      case 'bossSplit':
        this.toast('젤리 여왕이 쪼개졌다! 조각이 돌아가기 전에 터뜨려요', '#ff9ad8', 3);
        break;
      case 'bossMerge':
        this.toast('젤리 조각이 여왕과 합쳐졌다…', C.bad, 2);
        break;
      case 'bossMove': {
        const say: Record<string, [string, string]> = {
          magnet: ['자석! 반대로 걷거나 굴러서 버텨요', '#9ad8ff'],
          lights: ['더스티가 불을 껐다!', '#c8b8e8'],
          clones: ['먼지 분신! 한 대만 때려도 터져요', '#c8b8e8'],
          freezeCall: ['먼지 왕: "얼음!" 움직이면 크게 다쳐요', '#d8f0ff'],
        };
        const t = say[e.move];
        if (t) this.toast(t[0], t[1], 2.6);
        break;
      }
      case 'bossDown':
        this.toast('보스를 쓰러뜨렸다!', C.gold, 3.5);
        break;
      case 'riftGuardian':
        this.toast(`상자 지킴이 ${e.name} 등장!`, '#d8c0ff', 3);
        break;
      case 'riftClear':
        this.toast(`다락방 상자 ${e.depth}층 정리! 돌아가는 문이 열렸어요`, '#d8c0ff', 3.5);
        break;
      case 'locked':
        this.toast(e.text, C.dim, 2.4);
        break;
      case 'phoenix':
        this.toast('불사조 깃털이 쓰러짐을 막았다!', '#ffb04a', 3);
        break;
      case 'respawn':
        this.toast(`탐험대가 모두 쓰러져 마을로… (단추 -${e.goldLost})`, C.bad, 3.5);
        break;
      case 'quest':
        if (e.state === 'ready') this.toast('퀘스트 목표 완료! 보고하러 가자', C.good, 3);
        break;
      default:
        break;
    }
  }

  update(dt: number): void {
    for (const t of this.toasts) t.life -= dt;
    this.toasts = this.toasts.filter((t) => t.life > 0);
    if (this.banner && (this.banner.life -= dt) <= 0) this.banner = null;
    if (this.bossBanner && (this.bossBanner.life -= dt) <= 0) this.bossBanner = null;
    this.levelUp = Math.max(0, this.levelUp - dt);
    if (this.hint && (this.hint.life -= dt) <= 0) this.hint = null;
  }

  // ───────────────────────── 그리기 ─────────────────────────

  draw(ui: Ui, g: Game, L: HudLayout, touch: boolean, labels: Label[], fx: Fx, cam: { x: number; y: number }, act: HudActions): void {
    const s = g.save;
    const w = g.world;
    const st = g.stats;
    if (this.pendingRule) {
      this.pendingRule = false;
      if (w.rift && w.rift.rule !== 'none') this.toast(`층 규칙 · ${RULES[w.rift.rule].name}: ${RULES[w.rift.rule].desc}`, '#d8c0ff', 4);
    }
    const toScreen = (x: number, y: number) => ({ x: x - cam.x, y: y - cam.y });

    // 세계 위 이름표
    for (const n of w.map.npcs) {
      if (n.id === 'riftkeeper' && !s.flags.rift_open) continue;
      const p = toScreen(n.x * TILE + 12, n.y * TILE + 12);
      if (p.x < -40 || p.x > ui.w + 40 || p.y < -40 || p.y > ui.h + 40) continue;
      const info = NPCS[n.id];
      ui.outlined(info.name, p.x, p.y - 36, info.color, 10);
      const q = questFor(s, n.id);
      if (q && q.mode !== 'progress') {
        const bob = Math.sin(ui.time * 5) * 2;
        ui.outlined(q.mode === 'done' ? '?' : '!', p.x, p.y - 50 + bob, q.mode === 'done' ? C.good : C.gold, 16);
      }
    }
    for (const l of labels) {
      const p = toScreen(l.x, l.y);
      ui.outlined(l.text, p.x, p.y, l.color, l.small ? 9 : 10);
    }
    // 말 걸기 안내
    const it = interactTarget(g);
    if (it && w.player.state !== 'dead') {
      let at: { x: number; y: number };
      let text: string;
      const z = touch ? '공격 단추' : 'Z';
      if (it.kind === 'npc') {
        const n = w.map.npcs.find((x) => x.id === it.id)!;
        at = toScreen(n.x * TILE + 12, n.y * TILE + 42);
        text = `${z} 말 걸기`;
      } else if (it.kind === 'portal') {
        at = toScreen(w.rift!.portal!.x, w.rift!.portal!.y + 30);
        text = `${z} 마을로 돌아가기`;
      } else {
        const st = w.map.structures.find((x) => x.kind === it.kind && x.id === (it.kind === 'cocoon' ? it.hero : it.part))!;
        const sp = structureSpot(st);
        at = toScreen(sp.x, sp.y + 14);
        text = it.kind === 'cocoon' ? (w.rescue ? '먼지 무리를 물리치자!' : `${z} 먼지 고치 털어 내기 (${CLASSES[it.hero].name})`) : `${z} 보물 상자 열기`;
      }
      ui.outlined(text, at.x, at.y, C.gold, 10);
    }
    // 피해 숫자
    for (const t of fx.texts) {
      const p = toScreen(t.x, t.y);
      ui.ctx.globalAlpha = Math.min(1, (t.life / t.max) * 2);
      const pop = t.big ? 1 + Math.max(0, (t.life - t.max + 0.15) * 4) : 1;
      ui.outlined(t.text, p.x, p.y, t.color, Math.round((t.big ? 14 : 10) * pop));
    }
    ui.ctx.globalAlpha = 1;

    // ── 상태창: 지금 싸우는 동료 · HP · 태엽
    const S = L.status;
    const over = w.player.buffs.overwind > 0;
    ui.panel(S.x, S.y, S.w, S.h, C.panel, over ? WIND_COL : C.edge);
    this.face(ui, s.hero, S.x + 3, S.y + 3, 34, '#4a3e66');
    ui.text(`Lv ${s.lv}`, S.x + 40, S.y + 3, C.gold, 10);
    ui.text(CLASSES[s.hero].name, S.x + 72, S.y + 3, C.light, 10);
    ui.bar(S.x + 40, S.y + 17, S.w - 44, 6, s.hp / st.maxHp, C.hp);
    ui.text(`${Math.ceil(s.hp)}/${st.maxHp}`, S.x + 42, S.y + 15.5, '#ffffff', 8);
    // 태엽: 감기는 중이면 반짝
    const wx = S.x + 52;
    ui.img(pixCanvas(windIcon()), S.x + 39, S.y + 25, 11, 11);
    const spin = w.player.winding ? 0.25 + 0.25 * Math.sin(ui.time * 20) : 0;
    ui.bar(wx, S.y + 28, S.w - 56, 5, s.sp / st.maxSp, over ? '#fff0a0' : w.player.windOut > 0 ? '#8a7a5a' : WIND_COL);
    if (w.player.windOut > 0) ui.outlined('풀림', wx + (S.w - 56) / 2, S.y + 30, '#ffb04a', 7);
    if (spin > 0) {
      ui.ctx.fillStyle = `rgba(255,240,160,${spin})`;
      ui.ctx.fillRect(wx, S.y + 28, S.w - 56, 5);
    }
    if (s.skillPts > 0) ui.outlined(`+${s.skillPts}`, S.x + S.w - 8, S.y + 8, C.good, 9);
    // 탐험대 얼굴 (누르면 교대)
    this.drawParty(ui, g, L, act);
    // 단추 · 친구
    const by = L.party[0].y + L.party[0].h + 2;
    ui.img(pixCanvas(goldIcon()), S.x + 2, by, 10, 10);
    ui.text(`${s.gold}`, S.x + 14, by, C.gold, 9);
    ui.text(`친구 ${s.rescued.length}`, S.x + 64, by, '#9af0c0', 9);

    // ── 목표
    const goal = currentGoal(s);
    if (goal) {
      const Q = L.quest;
      const q = goal.quest;
      const st2 = goal.state.state;
      const line = st2 === 'none' ? `${NPCS[q.giver].name}에게 말 걸기` : st2 === 'ready' ? `${NPCS[q.giver].name}에게 보고하기` : `${q.goal} (${goal.state.n}/${q.count})`;
      ui.ctx.fillStyle = 'rgba(20,10,30,0.45)';
      const lines = ui.wrap(line, Q.w - 8, 9);
      ui.ctx.fillRect(Q.x, Q.y, Q.w, 16 + lines.length * 11);
      ui.text(`★ ${q.name}`, Q.x + 4, Q.y + 3, C.gold, 9);
      lines.forEach((l, i) => ui.text(l, Q.x + 4, Q.y + 15 + i * 11, st2 === 'ready' ? C.good : C.light, 9));
    }

    // ── 미니맵
    this.drawMinimap(ui, g, L);
    ui.button('menu', L.menu.x, L.menu.y, L.menu.w, L.menu.h, '≡', act.menu, { size: 12 });

    // ── 보스 · 균열
    const boss = w.monsters.find((m) => m.boss && m.hp > 0);
    const B = L.boss;
    if (boss) {
      ui.text(boss.name, B.x + B.w / 2, B.y - 1, '#ffb0c0', 10, 'center');
      ui.bar(B.x, B.y + 12, B.w, B.h, boss.hp / boss.maxHp, '#ff4a6a');
      const ph = boss.boss!.phase;
      if (ph > 1) ui.text(`${ph}단계`, B.x + B.w + 4, B.y + 10, C.bad, 9);
      const bb = boss.boss!;
      if (bb.id === 'bear') {
        // 태엽 게이지 (다 풀리면 기회)
        ui.img(pixCanvas(windIcon()), B.x - 1, B.y + 21, 9, 9);
        ui.bar(B.x + 10, B.y + 23, B.w * 0.4, 4, bb.unwound > 0 ? 0 : bb.spring / 100, WIND_COL);
        if (bb.unwound > 0) ui.text('태엽 풀림!', B.x + 14 + B.w * 0.4, B.y + 20, C.gold, 9);
      } else if (bb.id === 'jelly') {
        const n = w.monsters.filter((x) => x.merge === boss.id && x.hp > 0).length;
        if (n) ui.text(`돌아가는 조각 ${n}`, B.x, B.y + 21, '#ff9ad8', 9);
      }
    } else if (w.rift) {
      const r = w.rift;
      ui.text(`다락방 상자 ${r.depth}층${r.rule !== 'none' ? ` · ${RULES[r.rule].name}` : ''}`, B.x + B.w / 2, B.y - 1, '#d8c0ff', 10, 'center');
      if (g.run?.blessings.length) ui.text(`축복 ${g.run.blessings.length}`, B.x + B.w + 4, B.y + 10, C.gold, 9);
      if (r.guardian === 'none') ui.bar(B.x, B.y + 12, B.w, 5, r.gauge / 100, '#a888ff');
      else ui.text(r.guardian === 'spawned' ? '상자 지킴이를 쓰러뜨려라!' : '돌아가는 문으로!', B.x + B.w / 2, B.y + 12, C.gold, 9, 'center');
    } else if (w.rescue) {
      const r = w.rescue;
      const left = w.monsters.filter((m) => r.ids.includes(m.id) && m.hp > 0).length;
      ui.text(`${CLASSES[r.hero].name} 구하기 · 먼지 무리 ${r.wave + 1}/${RESCUE_WAVES.length}`, B.x + B.w / 2, B.y - 1, '#ffd0a0', 10, 'center');
      ui.bar(B.x, B.y + 12, B.w, 5, left / RESCUE_WAVES[r.wave], '#c8a080');
    }

    // ── 단축칸 (키보드)
    if (!touch) {
      const keys = ['A', 'S', 'D', 'F'] as const;
      keys.forEach((k, i) => this.skillSlot(ui, g, k, L.quick[i].x, L.quick[i].y, L.quick[i].w, k));
      if (w.player.linkLeft > 0) {
        const a = L.quick[0];
        const b = L.quick[3];
        ui.ctx.strokeStyle = `rgba(154,240,255,${0.5 + Math.sin(ui.time * 10) * 0.3})`;
        ui.ctx.lineWidth = 2;
        ui.ctx.strokeRect(a.x - 2, a.y - 2, b.x + b.w - a.x + 4, a.h + 4);
        ui.outlined(`연계 ${w.player.linkLeft.toFixed(1)}`, (a.x + b.x + b.w) / 2, a.y - 8, '#9af0ff', 9);
      }
      const q = L.quick[4];
      ui.panel(q.x, q.y, q.w, q.h, C.panel2);
      ui.img(pixCanvas(candyIcon()), q.x + 4, q.y + 4, 16, 16);
      ui.outlined(String(s.potions.hp), q.x + q.w - 4, q.y + q.h - 4, '#ffffff', 9);
      ui.text('Q', q.x + 2, q.y + 1, C.dim, 8);
      if (w.player.potionCd > 0) {
        ui.ctx.fillStyle = 'rgba(10,6,20,0.6)';
        ui.ctx.fillRect(q.x + 1, q.y + 1, q.w - 2, (q.h - 2) * Math.min(1, w.player.potionCd));
      }
      const r = L.quick[5];
      ui.panel(r.x, r.y, r.w, r.h, w.player.winding ? '#5a4a20' : C.panel2, w.player.winding ? WIND_COL : C.edge);
      ui.ctx.save();
      ui.ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
      if (w.player.winding) ui.ctx.rotate(Math.sin(ui.time * 14) * 0.3);
      ui.img(pixCanvas(windIcon()), -8, -8, 16, 16);
      ui.ctx.restore();
      ui.text('W', r.x + 2, r.y + 1, C.dim, 8);
    } else this.drawTouch(ui, g, L);

    // ── 경험치
    const need = expToNext(s.lv);
    ui.ctx.fillStyle = '#1c1424';
    ui.ctx.fillRect(L.exp.x, L.exp.y, L.exp.w, L.exp.h);
    ui.ctx.fillStyle = C.exp;
    ui.ctx.fillRect(L.exp.x, L.exp.y, s.lv >= LV_MAX ? L.exp.w : (L.exp.w * s.exp) / need, L.exp.h);

    this.drawFreeze(ui, g, touch);

    // ── 알림
    const ty = boss || w.rift || w.rescue ? B.y + 30 : Math.max(B.y + 20, 52);
    this.toasts.forEach((t, i) => {
      ui.ctx.globalAlpha = Math.min(1, t.life * 2);
      ui.outlined(t.n > 1 ? `${t.text} ×${t.n}` : t.text, ui.w / 2, ty + i * 13, t.color, 10);
    });
    ui.ctx.globalAlpha = 1;
    if (this.banner) {
      const a = Math.min(1, this.banner.life * 1.5, (2.6 - this.banner.life) * 4);
      ui.ctx.globalAlpha = Math.max(0, a);
      ui.outlined(this.banner.title, ui.w / 2, ui.h * 0.3, '#ffffff', 20);
      ui.outlined(this.banner.sub, ui.w / 2, ui.h * 0.3 + 18, C.dim, 10);
      ui.ctx.globalAlpha = 1;
    }
    if (this.bossBanner) {
      const a = Math.min(1, this.bossBanner.life * 1.5, (2.6 - this.bossBanner.life) * 4);
      ui.ctx.globalAlpha = Math.max(0, a);
      ui.ctx.fillStyle = 'rgba(40,0,20,0.55)';
      ui.ctx.fillRect(0, ui.h * 0.56 - 18, ui.w, 36);
      ui.outlined(this.bossBanner.name, ui.w / 2, ui.h * 0.56, '#ff8aa0', 20);
      ui.ctx.globalAlpha = 1;
    }
    if (this.hint) {
      const hy = touch ? L.status.y + L.status.h + 70 : L.quick[0].y - 22;
      const tw = Math.min(ui.w - 16, ui.measure(this.hint.text, 10) + 20);
      ui.ctx.globalAlpha = Math.min(1, this.hint.life * 2);
      ui.panel(ui.w / 2 - tw / 2, hy, tw, 18, '#3a2a58', C.gold);
      ui.text(this.hint.text, ui.w / 2, hy + 4, C.light, 10, 'center');
      ui.ctx.globalAlpha = 1;
    }
    if (this.levelUp > 0) {
      const p = toScreen(w.player.x, w.player.y);
      ui.ctx.globalAlpha = Math.min(1, this.levelUp);
      ui.outlined('LEVEL UP!', p.x, p.y - 44 - (2.4 - this.levelUp) * 6, C.gold, 14);
      ui.ctx.globalAlpha = 1;
    }
  }

  /** 동료 얼굴 (네모 칸 안) */
  private face(ui: Ui, h: HeroId, x: number, y: number, size: number, bg: string): void {
    ui.panel(x, y, size, size, bg);
    const face = pixCanvas(heroSprite(h, 'down', 'idle'));
    const k = size / 34;
    ui.ctx.save();
    ui.ctx.beginPath();
    ui.ctx.rect(x + 1, y + 1, size - 2, size - 2);
    ui.ctx.clip();
    ui.img(face, x + 1 - 6 * k, y + 1 - 2 * k, 26 * 1.6 * k, 40 * 1.6 * k);
    ui.ctx.restore();
  }

  private drawParty(ui: Ui, g: Game, L: HudLayout, act: HudActions): void {
    const s = g.save;
    if (s.party.length < 2) return;
    const tagCd = g.world.player.tagCd;
    s.party.forEach((h, i) => {
      const R = L.party[i];
      const cur = h === s.hero;
      const st = heroState(s, h);
      const down = st.down > 0;
      this.face(ui, h, R.x, R.y, R.w, cur ? '#6a5a30' : '#3a3050');
      const c = ui.ctx;
      if (cur) {
        c.strokeStyle = C.gold;
        c.lineWidth = 1;
        c.strokeRect(R.x + 0.5, R.y + 0.5, R.w - 1, R.h - 1);
      }
      const max = cur ? g.stats.maxHp : benchMaxHp(s, h);
      c.fillStyle = '#1c1424';
      c.fillRect(R.x + 1, R.y + R.h - 4, R.w - 2, 3);
      c.fillStyle = down ? '#6a5a70' : C.hp;
      c.fillRect(R.x + 1, R.y + R.h - 4, (R.w - 2) * Math.max(0, Math.min(1, st.hp / max)), 3);
      if (down) {
        c.fillStyle = 'rgba(20,10,30,0.7)';
        c.fillRect(R.x + 1, R.y + 1, R.w - 2, R.h - 5);
        ui.outlined(String(Math.ceil(st.down)), R.x + R.w / 2, R.y + R.h / 2 - 2, C.bad, 9);
      } else if (!cur && tagCd > 0) {
        c.fillStyle = 'rgba(10,6,20,0.55)';
        c.fillRect(R.x + 1, R.y + 1, R.w - 2, (R.h - 5) * Math.min(1, tagCd / 1.5));
      }
      ui.text(String(i + 1), R.x + 2, R.y + 1, '#ffffff', 7);
      if (!cur) ui.hit(`swap_${h}`, R.x, R.y, R.w, R.h, () => act.swap(h), !down);
    });
  }

  /** 얼음 땡: 경고 · 얼음 */
  private drawFreeze(ui: Ui, g: Game, touch: boolean): void {
    const f = g.world.freeze;
    if (f.phase === 'none') return;
    const c = ui.ctx;
    if (f.phase === 'warn') {
      const blink = Math.sin(ui.time * 12) > 0;
      c.fillStyle = 'rgba(255,200,80,0.12)';
      c.fillRect(0, 0, ui.w, ui.h);
      ui.outlined(blink ? '쿵… 쿵… 발소리!' : '쿵… 쿵…', ui.w / 2, ui.h * 0.36, '#ffe08a', 18);
      ui.outlined(`${Math.ceil(f.t)}초 뒤 얼음! 그 자리에서 멈춰요`, ui.w / 2, ui.h * 0.36 + 20, C.light, 10);
      return;
    }
    const k = Math.min(1, (FREEZE.freeze - f.t) * 4);
    c.fillStyle = f.caught ? `rgba(255,60,80,${0.18 * k})` : `rgba(120,200,255,${0.22 * k})`;
    c.fillRect(0, 0, ui.w, ui.h);
    // 화면 가장자리에 서리
    c.strokeStyle = `rgba(220,240,255,${0.5 * k})`;
    c.lineWidth = 4;
    c.strokeRect(2, 2, ui.w - 4, ui.h - 4);
    ui.outlined(f.caught ? '들켰다!' : '얼음!', ui.w / 2, ui.h * 0.34, f.caught ? C.bad : '#d8f0ff', 26);
    if (!f.caught) ui.outlined(touch ? '움직이지 마요 · 태엽 단추로 감기는 괜찮아요' : '움직이지 마요 · W 태엽 감기는 괜찮아요', ui.w / 2, ui.h * 0.34 + 24, C.light, 10);
    ui.bar(ui.w / 2 - 50, ui.h * 0.34 + 40, 100, 4, f.t / FREEZE.freeze, '#9ad8ff');
  }

  private skillSlot(ui: Ui, g: Game, key: 'A' | 'S' | 'D' | 'F', x: number, y: number, size: number, label: string, round = false): void {
    const def = skillForKey(g.save.hero, key);
    const lv = def ? skillLv(g.save, def.id) : 0;
    const c = ui.ctx;
    if (round) {
      c.fillStyle = 'rgba(20,10,30,0.55)';
      c.beginPath();
      c.arc(x, y, size, 0, Math.PI * 2);
      c.fill();
    } else ui.panel(x, y, size, size, C.panel2);
    const box = round ? { x: x - size * 0.7, y: y - size * 0.7, s: size * 1.4 } : { x: x + 2, y: y + 2, s: size - 4 };
    if (def && lv > 0) {
      c.fillStyle = SKILL_BG[def.id[0]];
      c.fillRect(box.x, box.y, box.s, box.s);
      ui.img(pixCanvas(skillIcon(def.id)), box.x + box.s * 0.1, box.y + box.s * 0.1, box.s * 0.8, box.s * 0.8);
      const cd = g.world.player.skillCd[def.id] ?? 0;
      const check = castCheck(g, def.id);
      if (cd > 0) {
        const cdMax = Math.max(cd, def.cd);
        c.fillStyle = 'rgba(10,6,20,0.7)';
        c.fillRect(box.x, box.y + box.s * (1 - cd / cdMax), box.s, box.s * (cd / cdMax));
        ui.outlined(cd >= 1 ? String(Math.ceil(cd)) : cd.toFixed(1), box.x + box.s / 2, box.y + box.s / 2, '#ffffff', 9);
      } else if (!check.ok && check.reason === 'sp') {
        c.fillStyle = 'rgba(40,60,140,0.55)';
        c.fillRect(box.x, box.y, box.s, box.s);
      }
    } else {
      c.fillStyle = 'rgba(10,6,20,0.5)';
      c.fillRect(box.x, box.y, box.s, box.s);
      if (def) ui.outlined(`Lv${def.req}`, box.x + box.s / 2, box.y + box.s / 2, C.dim, 8);
    }
    if (!round) ui.text(label, x + 2, y + 1, '#ffffff', 8);
  }

  private drawTouch(ui: Ui, g: Game, L: HudLayout): void {
    const c = ui.ctx;
    const T = L.touch;
    const circle = (x: number, y: number, r: number, fill: string, edge = 'rgba(255,255,255,0.5)') => {
      c.fillStyle = fill;
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = edge;
      c.lineWidth = 1;
      c.stroke();
    };
    circle(T.attack.x, T.attack.y, T.attack.r, 'rgba(255,120,120,0.35)');
    ui.outlined(CLASSES[g.save.hero].weapon === 'bow' || CLASSES[g.save.hero].weapon === 'staff' ? '쏘기' : '공격', T.attack.x, T.attack.y, '#ffffff', 11);
    circle(T.roll.x, T.roll.y, T.roll.r, 'rgba(160,220,255,0.3)');
    ui.outlined('구르기', T.roll.x, T.roll.y, '#ffffff', 9);
    for (const k of ['A', 'S', 'D', 'F'] as const) this.skillSlot(ui, g, k, T[k].x, T[k].y, T[k].r, k, true);
    circle(T.hp.x, T.hp.y, T.hp.r, 'rgba(20,10,30,0.5)');
    ui.img(pixCanvas(candyIcon()), T.hp.x - 8, T.hp.y - 8, 16, 16);
    ui.outlined(String(g.save.potions.hp), T.hp.x + T.hp.r - 2, T.hp.y + T.hp.r - 3, '#ffffff', 8);
    const wd = g.world.player.winding;
    circle(T.wind.x, T.wind.y, T.wind.r, wd ? 'rgba(255,200,60,0.45)' : 'rgba(20,10,30,0.5)', wd ? WIND_COL : undefined);
    ui.img(pixCanvas(windIcon()), T.wind.x - 8, T.wind.y - 8, 16, 16);
  }

  private drawMinimap(ui: Ui, g: Game, L: HudLayout): void {
    const m = g.world.map;
    if (!this.mini || this.mini.map !== m) this.mini = { map: m, img: miniImage(m) };
    const R = L.minimap;
    ui.panel(R.x, R.y, R.w, R.h, '#141020');
    const k = Math.min((R.w - 4) / m.w, (R.h - 4) / m.h);
    const ox = R.x + (R.w - m.w * k) / 2;
    const oy = R.y + (R.h - m.h * k) / 2;
    ui.img(this.mini.img, ox, oy, m.w * k, m.h * k);
    const c = ui.ctx;
    const dot = (x: number, y: number, col: string, r = 1.5) => {
      c.fillStyle = col;
      c.fillRect(ox + (x / TILE) * k - r, oy + (y / TILE) * k - r, r * 2, r * 2);
    };
    for (const wp of m.warps) {
      c.fillStyle = wp.need && !g.save.flags[wp.need] ? '#6a5a80' : '#7ad0ff';
      c.fillRect(ox + wp.x * k, oy + wp.y * k, Math.max(2, wp.w * k), Math.max(2, wp.h * k));
    }
    for (const n of m.npcs) if (n.id !== 'riftkeeper' || g.save.flags.rift_open) dot(n.x * TILE + 12, n.y * TILE + 12, C.gold);
    for (const mo of g.world.monsters) if (mo.hp > 0) dot(mo.x, mo.y, mo.boss ? '#ff4aff' : mo.rank === 'elite' ? C.gold : C.bad, mo.boss ? 2.5 : 1);
    if (g.world.rift?.portal) dot(g.world.rift.portal.x, g.world.rift.portal.y, '#c8a0ff', 2.5);
    for (const q of errandsHere(g.save, m.id)) if (Math.floor(ui.time * 2) % 2) dot(q.fetch!.x * TILE + 12, q.fetch!.y * TILE + 12, '#ffe08a', 2);
    if (Math.floor(ui.time * 3) % 3 !== 0) dot(g.world.player.x, g.world.player.y, '#ffffff', 2);
    ui.text(m.name, R.x + R.w / 2, R.y + R.h + 3, C.light, 9, 'center');
  }
}

/** 지도 한 칸 = 한 점 */
function miniImage(m: MapDef): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = m.w;
  cv.height = m.h;
  const c = cv.getContext('2d')!;
  const img = c.createImageData(m.w, m.h);
  const COL: Record<string, number[]> = {
    '.': [70, 130, 60],
    ',': [70, 130, 60],
    g: [60, 120, 55],
    ':': [170, 130, 85],
    '#': [190, 180, 160],
    '=': [150, 100, 55],
    _: [100, 90, 85],
    p: [220, 160, 190],
    q: [210, 175, 110],
    r: [90, 70, 130],
    '~': [70, 140, 210],
    v: [20, 12, 34],
    H: [200, 120, 80],
    m: [120, 124, 138],
    a: [170, 90, 100],
    w: [170, 120, 70],
    Q: [80, 120, 200],
    O: [120, 200, 240],
    d: [140, 85, 50],
    u: [90, 82, 98],
    E: [70, 60, 110],
    Y: [50, 45, 60],
  };
  for (let y = 0; y < m.h; y++)
    for (let x = 0; x < m.w; x++) {
      const ch = m.tiles[y][x];
      const col = COL[ch] ?? (m.theme === 'cave' || m.theme === 'rift' || m.theme === 'factory' ? [40, 30, 40] : m.theme === 'candy' ? [150, 90, 120] : [60, 50, 70]);
      const i = (y * m.w + x) * 4;
      img.data[i] = col[0];
      img.data[i + 1] = col[1];
      img.data[i + 2] = col[2];
      img.data[i + 3] = 255;
    }
  c.putImageData(img, 0, 0);
  return cv;
}
