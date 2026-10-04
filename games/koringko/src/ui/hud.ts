/** 놀이 화면 위 정보: 상태 · 미니맵 · 목표 · 보스 체력 · 단축칸 · 알림 · 이름표 */
import { CLASSES, expToNext, LV_MAX, skillForKey } from '../core/classes.ts';
import { interactTarget, type Game } from '../core/game.ts';
import { TILE, type MapDef } from '../core/maps.ts';
import { NPCS } from '../core/story.ts';
import { currentGoal, questFor } from '../core/quests.ts';
import { castCheck } from '../core/player.ts';
import { skillLv } from '../core/character.ts';
import { power } from '../core/stats.ts';
import type { WorldEvent } from '../core/world.ts';
import { RARITY } from '../core/items.ts';
import { pixCanvas } from './art/canvas.ts';
import { heroSprite } from './art/heroes.ts';
import { potionIcon, skillIcon, SKILL_BG, goldIcon } from './art/icons.ts';
import { C, type Ui } from './kit.ts';
import type { HudLayout } from './layout.ts';
import type { Label } from './render/scene.ts';
import type { Fx } from './render/fx.ts';

interface Toast {
  text: string;
  color: string;
  life: number;
}

const MAT_NAME: Record<string, string> = { fluff: '솜 조각', gear: '톱니', sugar: '설탕 결정', dust: '별가루', star: '별 조각' };

export class Hud {
  toasts: Toast[] = [];
  banner: { title: string; sub: string; life: number } | null = null;
  /** 보스 등장 글씨 */
  bossBanner: { name: string; life: number } | null = null;
  levelUp = 0;
  mini: { map: MapDef; img: HTMLCanvasElement } | null = null;

  toast(text: string, color = C.light, life = 2.6): void {
    this.toasts.push({ text, color, life });
    if (this.toasts.length > 5) this.toasts.shift();
  }

  onEvent(e: WorldEvent): void {
    switch (e.kind) {
      case 'enter':
        this.banner = { title: e.name, sub: e.level, life: 2.6 };
        break;
      case 'pickup':
        if (e.drop === 'item' && e.item) this.toast(`${e.item.name} 획득`, RARITY[e.item.rarity].color);
        else if (e.drop === 'potion') this.toast(e.potion === 'hp' ? '빨간 물약 +1' : '파란 물약 +1', e.potion === 'hp' ? C.hp : C.sp, 1.6);
        else if (e.drop === 'mat' && e.mat) this.toast(`${MAT_NAME[e.mat]} +1`, '#d8c8ff', 1.6);
        break;
      case 'bagFull':
        this.toast('가방이 가득 찼어요!', C.bad);
        break;
      case 'levelUp':
        this.levelUp = 2.4;
        this.toast(`레벨 ${e.lv}! 능력치가 오르고 스킬 점수를 얻었어요 (K)`, C.gold, 3);
        break;
      case 'noSp':
        this.toast('SP 가 모자라요', C.sp, 1.2);
        break;
      case 'bossIntro':
        this.bossBanner = { name: e.name, life: 2.6 };
        break;
      case 'bossDown':
        this.toast('보스를 쓰러뜨렸다!', C.gold, 3.5);
        break;
      case 'riftGuardian':
        this.toast(`균열 수호자 ${e.name} 등장!`, '#d8c0ff', 3);
        break;
      case 'riftClear':
        this.toast(`균열 ${e.depth}층 정화! 돌아가는 문이 열렸어요`, '#d8c0ff', 3.5);
        break;
      case 'locked':
        this.toast(e.text, C.dim, 2.4);
        break;
      case 'phoenix':
        this.toast('불사조 깃털이 쓰러짐을 막았다!', '#ffb04a', 3);
        break;
      case 'respawn':
        this.toast(`마을에서 깨어났다… (골드 -${e.goldLost})`, C.bad, 3.5);
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
  }

  // ───────────────────────── 그리기 ─────────────────────────

  draw(ui: Ui, g: Game, L: HudLayout, touch: boolean, labels: Label[], fx: Fx, cam: { x: number; y: number }, openMenu: () => void): void {
    const s = g.save;
    const w = g.world;
    const st = g.stats;
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
      const at = it.kind === 'npc' ? w.map.npcs.find((n) => n.id === it.id)! : null;
      const p = at ? toScreen(at.x * TILE + 12, at.y * TILE + 12 + 30) : toScreen(w.rift!.portal!.x, w.rift!.portal!.y + 30);
      const label = touch ? '공격 단추: 말 걸기' : 'Z 말 걸기';
      ui.outlined(it.kind === 'portal' ? (touch ? '공격 단추: 돌아가기' : 'Z 마을로 돌아가기') : label, p.x, p.y, C.gold, 10);
    }
    // 피해 숫자
    for (const t of fx.texts) {
      const p = toScreen(t.x, t.y);
      ui.ctx.globalAlpha = Math.min(1, (t.life / t.max) * 2);
      const pop = t.big ? 1 + Math.max(0, (t.life - t.max + 0.15) * 4) : 1;
      ui.outlined(t.text, p.x, p.y, t.color, Math.round((t.big ? 14 : 10) * pop));
    }
    ui.ctx.globalAlpha = 1;

    // ── 상태창
    const S = L.status;
    ui.panel(S.x, S.y, S.w, S.h);
    ui.panel(S.x + 3, S.y + 3, 34, 34, '#4a3e66');
    const face = pixCanvas(heroSprite(s.hero, 'down', 'idle'));
    ui.ctx.save();
    ui.ctx.beginPath();
    ui.ctx.rect(S.x + 4, S.y + 4, 32, 32);
    ui.ctx.clip();
    ui.img(face, S.x + 4 - 6, S.y + 4 - 2, 26 * 1.6, 40 * 1.6);
    ui.ctx.restore();
    ui.text(`Lv ${s.lv}`, S.x + 40, S.y + 3, C.gold, 10);
    ui.text(CLASSES[s.hero].name, S.x + 72, S.y + 3, C.light, 10);
    ui.bar(S.x + 40, S.y + 17, S.w - 44, 6, s.hp / st.maxHp, C.hp);
    ui.bar(S.x + 40, S.y + 28, S.w - 44, 5, s.sp / st.maxSp, C.sp);
    ui.text(`${Math.ceil(s.hp)}/${st.maxHp}`, S.x + 42, S.y + 15.5, '#ffffff', 8);
    const pts = s.skillPts;
    if (pts > 0) ui.outlined(`+${pts}`, S.x + S.w - 8, S.y + 8, C.good, 9);
    // 골드 · 전투력
    ui.img(pixCanvas(goldIcon()), S.x + 2, S.y + S.h + 3, 10, 10);
    ui.text(`${s.gold}`, S.x + 14, S.y + S.h + 3, C.gold, 9);
    ui.text(`전투력 ${power(st)}`, S.x + 64, S.y + S.h + 3, C.dim, 9);

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
    ui.button('menu', L.menu.x, L.menu.y, L.menu.w, L.menu.h, '≡', openMenu, { size: 12 });

    // ── 보스 · 균열
    const boss = w.monsters.find((m) => m.boss && m.hp > 0);
    const B = L.boss;
    if (boss) {
      ui.text(boss.name, B.x + B.w / 2, B.y - 1, '#ffb0c0', 10, 'center');
      ui.bar(B.x, B.y + 12, B.w, B.h, boss.hp / boss.maxHp, '#ff4a6a');
      const ph = boss.boss!.phase;
      if (ph > 1) ui.text(`${ph}단계`, B.x + B.w + 4, B.y + 10, C.bad, 9);
    } else if (w.rift) {
      const r = w.rift;
      ui.text(`다락방 균열 ${r.depth}층`, B.x + B.w / 2, B.y - 1, '#d8c0ff', 10, 'center');
      if (r.guardian === 'none') ui.bar(B.x, B.y + 12, B.w, 5, r.gauge / 100, '#a888ff');
      else ui.text(r.guardian === 'spawned' ? '수호자를 쓰러뜨려라!' : '돌아가는 문으로!', B.x + B.w / 2, B.y + 12, C.gold, 9, 'center');
    }

    // ── 단축칸 (키보드)
    if (!touch) {
      const keys = ['A', 'S', 'D', 'F'] as const;
      keys.forEach((k, i) => this.skillSlot(ui, g, k, L.quick[i].x, L.quick[i].y, L.quick[i].w, k));
      (['hp', 'sp'] as const).forEach((k, i) => {
        const r = L.quick[4 + i];
        ui.panel(r.x, r.y, r.w, r.h, C.panel2);
        ui.img(pixCanvas(potionIcon(k)), r.x + 4, r.y + 4, 16, 16);
        ui.outlined(String(s.potions[k]), r.x + r.w - 4, r.y + r.h - 4, '#ffffff', 9);
        ui.text(k === 'hp' ? 'Q' : 'W', r.x + 2, r.y + 1, C.dim, 8);
        if (w.player.potionCd > 0) {
          ui.ctx.fillStyle = 'rgba(10,6,20,0.6)';
          ui.ctx.fillRect(r.x + 1, r.y + 1, r.w - 2, (r.h - 2) * Math.min(1, w.player.potionCd));
        }
      });
    } else this.drawTouch(ui, g, L);

    // ── 경험치
    const need = expToNext(s.lv);
    ui.ctx.fillStyle = '#1c1424';
    ui.ctx.fillRect(L.exp.x, L.exp.y, L.exp.w, L.exp.h);
    ui.ctx.fillStyle = C.exp;
    ui.ctx.fillRect(L.exp.x, L.exp.y, s.lv >= LV_MAX ? L.exp.w : (L.exp.w * s.exp) / need, L.exp.h);

    // ── 알림
    const ty = boss || w.rift ? B.y + 30 : Math.max(B.y + 20, 52);
    this.toasts.forEach((t, i) => {
      ui.ctx.globalAlpha = Math.min(1, t.life * 2);
      ui.outlined(t.text, ui.w / 2, ty + i * 13, t.color, 10);
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
      ui.ctx.fillRect(0, ui.h * 0.4 - 18, ui.w, 36);
      ui.outlined(this.bossBanner.name, ui.w / 2, ui.h * 0.4, '#ff8aa0', 20);
      ui.ctx.globalAlpha = 1;
    }
    if (this.levelUp > 0) {
      const p = toScreen(w.player.x, w.player.y);
      ui.ctx.globalAlpha = Math.min(1, this.levelUp);
      ui.outlined('LEVEL UP!', p.x, p.y - 44 - (2.4 - this.levelUp) * 6, C.gold, 14);
      ui.ctx.globalAlpha = 1;
    }
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
    for (const k of ['hp', 'sp'] as const) {
      const b = T[k];
      circle(b.x, b.y, b.r, 'rgba(20,10,30,0.5)');
      ui.img(pixCanvas(potionIcon(k)), b.x - 8, b.y - 8, 16, 16);
      ui.outlined(String(g.save.potions[k]), b.x + b.r - 2, b.y + b.r - 3, '#ffffff', 8);
    }
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
  };
  for (let y = 0; y < m.h; y++)
    for (let x = 0; x < m.w; x++) {
      const ch = m.tiles[y][x];
      const col = COL[ch] ?? (m.theme === 'cave' || m.theme === 'rift' ? [40, 30, 40] : m.theme === 'candy' ? [150, 90, 120] : [30, 70, 35]);
      const i = (y * m.w + x) * 4;
      img.data[i] = col[0];
      img.data[i + 1] = col[1];
      img.data[i + 2] = col[2];
      img.data[i + 3] = 255;
    }
  c.putImageData(img, 0, 0);
  return cv;
}
