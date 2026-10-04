/** 메뉴: 상태 · 장비 · 스킬 · 퀘스트 · 시스템 */
import { canLearn, GROWTH, learn, skillLv } from '../../core/character.ts';
import { classSkills, CLASSES, expToNext } from '../../core/classes.ts';
import { refreshStats } from '../../core/combat.ts';
import { powerChange } from '../../core/compare.ts';
import { equip, equipCheck, unequip, BAG_MAX } from '../../core/inventory.ts';
import { SLOT_NAME } from '../../core/items.ts';
import { progress, QUESTS } from '../../core/quests.ts';
import { power } from '../../core/stats.ts';
import { NPCS } from '../../core/story.ts';
import { ATTRS, SLOTS, type Attr, type MatId, type Slot } from '../../core/types.ts';
import { pixCanvas } from '../art/canvas.ts';
import { heroSprite } from '../art/heroes.ts';
import { matIcon, potionIcon, skillIcon, SKILL_BG } from '../art/icons.ts';
import { drawBag, frame } from '../baggrid.ts';
import { drawItemIcon, drawItemInfo } from '../itemview.ts';
import { C } from '../kit.ts';
import type { App, Screen } from './screen.ts';
import { SettingsScreen } from './settings.ts';

export type Tab = 'status' | 'gear' | 'skills' | 'quests' | 'system';
const TABS: { id: Tab; name: string }[] = [
  { id: 'status', name: '상태' },
  { id: 'gear', name: '장비' },
  { id: 'skills', name: '스킬' },
  { id: 'quests', name: '퀘스트' },
  { id: 'system', name: '시스템' },
];

const ATTR_INFO: Record<Attr, { name: string; desc: string }> = {
  str: { name: '힘', desc: '근접 공격력' },
  vit: { name: '체력', desc: '최대 HP · 방어' },
  dex: { name: '민첩', desc: '원거리 공격력 · 치명타' },
  int: { name: '지능', desc: '마법 공격력 · SP · 스킬 피해' },
};
const MAT_NAME: Record<MatId, string> = { fluff: '솜 조각', gear: '톱니', sugar: '설탕 결정', dust: '별가루', star: '별 조각' };

type GearSel = { gear: Slot } | { bag: number } | null;

export class MenuScreen implements Screen {
  modal = true;
  tab: Tab;
  gsel: GearSel = null;
  qsel = 0;
  sksel = 0;

  constructor(tab: Tab = 'status') {
    this.tab = tab;
  }

  draw(app: App): void {
    const ui = app.ui;
    ui.dim(0.55);
    const F = frame(ui, 540, 344);
    ui.panel(F.px, F.py, F.pw, F.ph);
    const tw = Math.min(64, (F.pw - 16 - 30) / TABS.length);
    TABS.forEach((t, i) =>
      ui.button(`tab-${t.id}`, F.px + 6 + i * (tw + 2), F.py + 5, tw, 18, t.name, () => {
        this.tab = t.id;
        app.sfx('move');
      }, { active: this.tab === t.id, size: 10 }),
    );
    ui.button('close', F.px + F.pw - 26, F.py + 5, 20, 18, '✕', () => app.pop(), { size: 10 });
    const x = F.px + 8;
    const y = F.py + 30;
    const w = F.pw - 16;
    const h = F.ph - 36;
    if (this.tab === 'status') this.status(app, x, y, w, h);
    else if (this.tab === 'gear') this.gear(app, x, y, w, h, F.side);
    else if (this.tab === 'skills') this.skills(app, x, y, w, h);
    else if (this.tab === 'quests') this.quests(app, x, y, w, h, F.side);
    else this.system(app, x, y, w);
  }

  key(app: App, a: string): boolean {
    const order: Record<string, Tab> = { status: 'status', bag: 'gear', skills: 'skills', quests: 'quests' };
    if (order[a]) {
      if (this.tab === order[a]) app.pop();
      else this.tab = order[a];
      return true;
    }
    return false;
  }

  // ───────── 상태
  status(app: App, x: number, y: number, w: number, h: number): void {
    const ui = app.ui;
    const g = app.g!;
    const s = g.save;
    const st = g.stats;
    const c = CLASSES[s.hero];
    ui.panel(x, y, 60, 76, '#4a3e66');
    ui.img(pixCanvas(heroSprite(s.hero, 'down', 'idle')), x + 30 - 19.5, y + 4, 39, 60);
    ui.text(`${s.name}`, x + 68, y + 2, c.color, 12);
    ui.text(`${c.title} · Lv ${s.lv}`, x + 68, y + 18, C.light, 10);
    const need = expToNext(s.lv);
    ui.bar(x + 68, y + 34, Math.min(160, w - 76), 5, s.exp / need, C.exp);
    ui.text(`경험치 ${s.exp} / ${need}`, x + 68, y + 42, C.dim, 9);
    ui.text(`전투력 ${power(st)}`, x + 68, y + 56, C.gold, 11);
    // 능력치
    let yy = y + 84;
    const grow = ATTRS.filter((a) => GROWTH[s.hero][a] > 0).map((a) => `${ATTR_INFO[a].name} +${GROWTH[s.hero][a]}`).join(' · ');
    ui.text(`레벨마다 저절로: ${grow}`, x, yy, C.dim, 9);
    yy += 16;
    const colW = Math.min(240, w);
    ATTRS.forEach((a) => {
      const main = c.main === a;
      ui.text(`${ATTR_INFO[a].name}${main ? ' ★' : ''}`, x, yy + 3, main ? C.gold : C.light, 10);
      ui.text(String(s.attrs[a]), x + 52, yy + 3, C.light, 10);
      ui.text(ATTR_INFO[a].desc, x + 80, yy + 4, C.dim, 8);
yy += 19;
    });
    // 세부
    const rows: [string, string][] = [
      ['HP', `${Math.ceil(s.hp)} / ${st.maxHp}`],
      ['SP', `${Math.ceil(s.sp)} / ${st.maxSp}`],
      ['공격력', `${Math.round(st.atk)}`],
      ['방어', `${Math.round(st.def)}`],
      ['치명타', `${Math.round(st.crit * 100)}% (×${st.critDmg.toFixed(2)})`],
      ['공격 속도', `×${st.aspd.toFixed(2)}`],
      ['이동 속도', `${Math.round(st.ms)}`],
      ['스킬 피해', `+${Math.round(st.skillPct)}%`],
      ['재사용 감소', `${Math.round(st.cdr * 100)}%`],
      ['생명 흡수', `${(st.leech * 100).toFixed(1)}%`],
    ];
    const sx = w >= 400 ? x + colW + 14 : x;
    let sy = w >= 400 ? y + 84 : yy + 6;
    const sw = w >= 400 ? w - colW - 14 : w;
    rows.forEach(([k, v], i) => {
      const cx = w >= 400 ? sx : sx + (i % 2) * (sw / 2);
      if (w < 400 && i % 2 === 1) sy -= 13;
      ui.text(k, cx, sy, C.dim, 9);
      ui.text(v, cx + (w >= 400 ? sw : sw / 2 - 8), sy, C.light, 9, 'right');
      sy += 13;
    });
    void h;
  }

  // ───────── 장비 · 가방
  gear(app: App, x: number, y: number, w: number, h: number, side: boolean): void {
    const ui = app.ui;
    const g = app.g!;
    const s = g.save;
    const cell = 24;
    const lw = side ? Math.floor(w * 0.52) : w;
    SLOTS.forEach((slot, i) => {
      const cx = x + i * (cell + 4);
      const it = s.gear[slot];
      const f = ui.hit(`g-${slot}`, cx, y + 10, cell, cell, () => this.pickGear(app, { gear: slot }), !!it);
      ui.text(SLOT_NAME[slot], cx + cell / 2, y, C.dim, 7, 'center');
      if (it) drawItemIcon(ui, it, cx, y + 10, cell);
      else {
        ui.ctx.fillStyle = '#211a2e';
        ui.ctx.fillRect(cx, y + 10, cell, cell);
      }
      if (this.gsel && 'gear' in this.gsel && this.gsel.gear === slot) {
        ui.ctx.strokeStyle = '#fff';
        ui.ctx.strokeRect(cx - 0.5, y + 9.5, cell + 1, cell + 1);
      }
      if (f || ui.hover === `g-${slot}`) ui.focusRing(cx, y + 10, cell, cell);
    });
    ui.text(`가방 ${s.bag.length}/${BAG_MAX}`, x, y + 40, C.dim, 9);
    const bh = drawBag(ui, s.bag, x, y + 52, lw, this.gsel && 'bag' in this.gsel ? this.gsel.bag : null, (i) => this.pickGear(app, { bag: i }), 'b', (it) => equipCheck(s, it).ok && powerChange(s, it) > 0);
    // 물약 · 재료
    let mx = x;
    const my = y + 56 + bh;
    const things: [HTMLCanvasElement, number][] = [
      [pixCanvas(potionIcon('hp')), s.potions.hp],
      [pixCanvas(potionIcon('sp')), s.potions.sp],
      ...(['fluff', 'gear', 'sugar', 'dust', 'star'] as MatId[]).map((m) => [pixCanvas(matIcon(m)), s.mats[m]] as [HTMLCanvasElement, number]),
    ];
    for (const [im, n] of things) {
      if (mx + 36 > x + lw) break;
      ui.img(im, mx, my, 12, 12);
      ui.text(String(n), mx + 14, my + 1, C.light, 9);
      mx += 36;
    }
    // 설명
    const ix = side ? x + lw + 10 : x;
    const iy = side ? y : my + 18;
    const iw = side ? w - lw - 10 : w;
    const sel = this.gsel;
    const it = sel ? ('gear' in sel ? s.gear[sel.gear] : s.bag[sel.bag]) : undefined;
    if (!it) {
      const hint = app.touch ? '장비를 누르면 설명이 보여요. 한 번 더 누르면 끼거나 빼요.' : '장비를 고르면 설명이 보여요. Z 를 한 번 더 누르면 끼거나 빼요. ▲ 표시는 더 센 장비예요.';
      ui.paragraph(hint, ix, iy, iw, C.dim, 9);
      if (MAT_NAME) ui.paragraph(`재료: ${(['fluff', 'gear', 'sugar', 'dust', 'star'] as MatId[]).map((m) => `${MAT_NAME[m]} ${s.mats[m]}`).join(', ')}`, ix, iy + 40, iw, C.dim, 9);
      return;
    }
    const used = drawItemInfo(ui, it, ix, iy, iw, s, !!sel && 'bag' in sel);
    const by = Math.min(iy + used + 4, y + h - 22);
    if (sel && 'bag' in sel) ui.button('equip', ix, by, 70, 20, '끼기', () => this.doGear(app), { enabled: equipCheck(s, it).ok, color: C.gold, size: 10 });
    else ui.button('unequip', ix, by, 70, 20, '빼기', () => this.doGear(app), { enabled: s.bag.length < BAG_MAX, size: 10 });
  }

  pickGear(app: App, sel: GearSel): void {
    if (JSON.stringify(sel) === JSON.stringify(this.gsel)) {
      this.doGear(app);
      return;
    }
    this.gsel = sel;
    app.sfx('move');
  }

  doGear(app: App): void {
    const g = app.g!;
    const sel = this.gsel;
    if (!sel) return;
    let ok = false;
    if ('bag' in sel) {
      const slot = g.save.bag[sel.bag]?.slot;
      ok = equip(g.save, sel.bag);
      if (ok && slot) this.gsel = { gear: slot };
    } else {
      ok = unequip(g.save, sel.gear);
      if (ok) this.gsel = null;
    }
    app.sfx(ok ? 'equip' : 'error');
    if (ok) {
      refreshStats(g);
      app.saveNow();
    }
  }

  // ───────── 스킬
  skills(app: App, x: number, y: number, w: number, h: number): void {
    const ui = app.ui;
    const g = app.g!;
    const s = g.save;
    ui.text(`스킬 점수: ${s.skillPts}`, x, y, s.skillPts ? C.good : C.dim, 10);
    const list = classSkills(s.hero);
    const rowH = Math.min(48, (h - 18) / list.length - 3);
    list.forEach((sk, i) => {
      const ry = y + 16 + i * (rowH + 3);
      const lv = skillLv(s, sk.id);
      ui.panel(x, ry, w, rowH, C.panel2);
      const ic = rowH - 8;
      ui.ctx.fillStyle = SKILL_BG[sk.id[0]];
      ui.ctx.fillRect(x + 4, ry + 4, ic, ic);
      ui.img(pixCanvas(skillIcon(sk.id)), x + 4 + ic * 0.1, ry + 4 + ic * 0.1, ic * 0.8, ic * 0.8);
      if (lv === 0) {
        ui.ctx.fillStyle = 'rgba(10,6,20,0.55)';
        ui.ctx.fillRect(x + 4, ry + 4, ic, ic);
      }
      const keyName = sk.key === 'P' ? '지속' : sk.key;
      ui.text(`[${keyName}] ${sk.name}`, x + ic + 10, ry + 3, lv ? C.light : C.dim, 10);
      ui.text(`Lv ${lv}/${sk.maxLv}${sk.key !== 'P' ? `  SP ${sk.sp} · ${sk.cd}초` : ''}`, x + w - 74, ry + 4, C.dim, 8, 'right');
      ui.paragraph(sk.desc(Math.max(1, lv)), x + ic + 10, ry + 17, w - ic - 90, C.dim, 8, 2);
      const chk = canLearn(s, sk.id);
      const label = chk.ok ? (lv ? '올리기' : '배우기') : chk.reason === 'level' ? `Lv${sk.req}` : chk.reason === 'max' ? '최고' : lv ? '올리기' : '배우기';
      ui.button(`sk-${sk.id}`, x + w - 64, ry + rowH / 2 - 9, 58, 18, label, () => {
        if (learn(s, sk.id)) {
          app.sfx('level');
          refreshStats(g);
          app.saveNow();
        } else app.sfx('error');
      }, { enabled: chk.ok, color: C.gold, size: 9 });
    });
  }

  // ───────── 퀘스트
  quests(app: App, x: number, y: number, w: number, h: number, side: boolean): void {
    const ui = app.ui;
    const s = app.g!.save;
    const list = QUESTS.filter((q) => progress(s, q.id).state !== 'none');
    if (!list.length) {
      ui.paragraph('아직 받은 퀘스트가 없어요. 머리 위에 ! 가 있는 주민에게 말을 걸어 보세요.', x, y, w, C.dim, 10);
      return;
    }
    const lw = side ? Math.floor(w * 0.45) : w;
    const rowH = 18;
    const maxRows = side ? Math.floor(h / (rowH + 2)) : Math.min(list.length, 6);
    const start = Math.max(0, Math.min(this.qsel - maxRows + 1, list.length - maxRows));
    list.slice(start, start + maxRows).forEach((q, k) => {
      const i = start + k;
      const p = progress(s, q.id);
      const ry = y + k * (rowH + 2);
      const f = ui.hit(`q${i}`, x, ry, lw, rowH, () => (this.qsel = i));
      ui.panel(x, ry, lw, rowH, this.qsel === i ? '#4a3e66' : C.panel2, f ? C.focus : C.edge);
      const mark = p.state === 'done' ? '✓' : p.state === 'ready' ? '!' : '·';
      ui.text(`${mark} ${q.main ? '★ ' : ''}${q.name}`, x + 4, ry + 4, p.state === 'done' ? C.dim : p.state === 'ready' ? C.good : C.light, 9);
    });
    const q = list[Math.min(this.qsel, list.length - 1)];
    const p = progress(s, q.id);
    const ix = side ? x + lw + 10 : x;
    let iy = side ? y : y + maxRows * (rowH + 2) + 8;
    const iw = side ? w - lw - 10 : w;
    ui.text(q.name, ix, iy, q.main ? C.gold : C.light, 12);
    iy += 18;
    ui.text(`맡긴 이: ${NPCS[q.giver].name}`, ix, iy, C.dim, 9);
    iy += 14;
    iy += ui.paragraph(q.goal, ix, iy, iw, C.light, 10);
    if (p.state !== 'done') ui.text(p.state === 'ready' ? '다 했어요! 보고하러 가요' : `진행 ${p.n} / ${q.count}`, ix, iy + 4, p.state === 'ready' ? C.good : C.light, 10);
    else ui.text('완료', ix, iy + 4, C.dim, 10);
    iy += 20;
    ui.paragraph(`보상: 경험치 ${q.reward.exp} · 골드 ${q.reward.gold}${q.reward.item ? ' · 장비' : ''}`, ix, iy, iw, C.dim, 9);
  }

  // ───────── 시스템
  system(app: App, x: number, y: number, w: number): void {
    const ui = app.ui;
    const bw = Math.min(160, w);
    const s = app.g!.save;
    ui.text(`놀이 시간 ${Math.floor(s.playTime / 60)}분 · 쓰러뜨린 적 ${s.kills} · 균열 최고 ${s.riftBest}층`, x, y, C.dim, 9);
    ui.button('save', x, y + 18, bw, 22, '지금 저장하기', () => {
      app.saveNow();
      app.toast('저장했어요', C.good);
      app.sfx('click');
    });
    ui.button('settings', x, y + 46, bw, 22, '소리 설정', () => app.push(new SettingsScreen()));
    ui.button('title', x, y + 74, bw, 22, '저장하고 타이틀로', () => {
      app.saveNow();
      app.toTitle();
    }, { color: C.bad });
    const keys = app.touch
      ? ['왼쪽 화면을 끌어 이동', '오른쪽 큰 단추: 공격 · 말 걸기', '구르기: 잠깐 무적', 'A S D F: 스킬 · 물약 단추']
      : ['방향키: 이동', 'Z / 스페이스: 공격 · 말 걸기 · 확인', 'X: 구르기 (잠깐 무적) · 창 닫기', 'A S D F: 스킬    Q W: 물약', 'Esc: 메뉴   C 상태 · I 장비 · K 스킬 · J 퀘스트'];
    keys.forEach((k, i) => ui.text(k, x, y + 108 + i * 13, C.dim, 9));
  }
}
