/** 메뉴: 탐험대 · 스킬 · 부품 · 도감 · 퀘스트 · 시스템 */
import { canLearn, GROWTH, learn, skillLv } from '../../core/character.ts';
import { setVariant, VARIANTS, variantOf } from '../../core/variants.ts';
import { classSkills, CLASSES, expToNext } from '../../core/classes.ts';
import { refreshStats } from '../../core/combat.ts';
import { progress, QUESTS } from '../../core/quests.ts';
import { NPCS } from '../../core/story.ts';
import { HERO_SLOTS, heroState, withHero } from '../../core/party.ts';
import { PARTS, BASIC_PARTS, SPECIAL_PARTS, equipPart, partSlots, unequipPart, PART_MAX } from '../../core/parts.ts';
import { friendBonus, rescueNeed, villageLevel } from '../../core/friends.ts';
import { MONSTERS } from '../../core/monsters.ts';
import { FACILITIES, facilities } from '../../core/village.ts';
import { WEAPON_NAME } from '../../core/weapon.ts';
import { ATTRS, type Attr, type HeroId, type MatId } from '../../core/types.ts';
import { pixCanvas } from '../art/canvas.ts';
import { heroSprite } from '../art/heroes.ts';
import { candyIcon, matIcon, partIcon, skillIcon, SKILL_BG, weaponIcon } from '../art/icons.ts';
import { monsterFrames } from '../art/monsters.ts';
import { CLEAR, Pix } from '../art/paint.ts';
import { bookGroups } from '../book.ts';
import { C, frame } from '../kit.ts';
import { MAT_NAME } from '../hud.ts';
import type { App, Screen } from './screen.ts';
import { SettingsScreen } from './settings.ts';
import { DIFFICULTIES, DIFFICULTY, setDifficulty } from '../../core/difficulty.ts';
import type { Game } from '../../core/game.ts';

export type Tab = 'party' | 'skills' | 'parts' | 'book' | 'quests' | 'system';
const TABS: { id: Tab; name: string }[] = [
  { id: 'party', name: '탐험대' },
  { id: 'skills', name: '스킬' },
  { id: 'parts', name: '부품' },
  { id: 'book', name: '도감' },
  { id: 'quests', name: '퀘스트' },
  { id: 'system', name: '시스템' },
];

const ATTR_INFO: Record<Attr, { name: string; desc: string }> = {
  str: { name: '힘', desc: '근접 공격력' },
  vit: { name: '체력', desc: '최대 HP · 방어' },
  dex: { name: '민첩', desc: '원거리 공격력 · 치명타' },
  int: { name: '지능', desc: '마법 공격력 · 태엽 · 스킬 피해' },
};
/** 아직 구하지 않은 동료가 있는 곳 */
const WHERE: Record<HeroId, string> = { toby: '', bori: '장난감 상자의 먼지 고치', ruru: '과자 서랍의 먼지 고치', nabi: '책상 시계 공장의 먼지 고치' };

/** 실루엣 (아직 못 만난 장난감) */
const SIL = new Map<string, HTMLCanvasElement>();
function silhouette(id: string): HTMLCanvasElement {
  let c = SIL.get(id);
  if (!c) {
    const p = monsterFrames(id)[0];
    const q = new Pix(p.w, p.h);
    for (let i = 0; i < p.px.length; i++) if (p.px[i] !== CLEAR) q.px[i] = 0x3a3050;
    c = pixCanvas(q);
    SIL.set(id, c);
  }
  return c;
}

/** 동료 고르기 줄: 탐험대 4칸 (없는 동료는 잠김) */
function heroRow(app: App, x: number, y: number, sel: HeroId, pick: (h: HeroId) => void, onlyParty = false): number {
  const ui = app.ui;
  const s = app.g!.save;
  HERO_SLOTS.forEach((h, i) => {
    const have = s.party.includes(h);
    if (onlyParty && !have) return;
    const bx = x + i * 66;
    ui.button(`hero-${h}`, bx, y, 62, 18, have ? CLASSES[h].name : '???', () => pick(h), { active: sel === h, size: 9, enabled: have, color: have ? CLASSES[h].color : C.dim });
  });
  return 22;
}

export class MenuScreen implements Screen {
  modal = true;
  tab: Tab;
  qsel = 0;
  hero: HeroId;
  part: string | null = null;
  book: string | null = null;

  constructor(app: App, tab: Tab = 'party') {
    this.tab = tab;
    this.hero = app.g?.save.hero ?? 'toby';
  }

  draw(app: App): void {
    const ui = app.ui;
    ui.dim(0.55);
    const F = frame(ui, 560, 350);
    ui.panel(F.px, F.py, F.pw, F.ph);
    const tw = Math.min(60, (F.pw - 16 - 30) / TABS.length);
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
    if (this.tab === 'party') this.party(app, x, y, w, h, F.side);
    else if (this.tab === 'skills') this.skills(app, x, y, w, h);
    else if (this.tab === 'parts') this.parts(app, x, y, w, h, F.side);
    else if (this.tab === 'book') this.bookTab(app, x, y, w, h, F.side);
    else if (this.tab === 'quests') this.quests(app, x, y, w, h, F.side);
    else this.system(app, x, y, w);
  }

  key(app: App, a: string): boolean {
    const order: Record<string, Tab> = { party: 'party', skills: 'skills', parts: 'parts', book: 'book', quests: 'quests' };
    if (order[a]) {
      if (this.tab === order[a]) app.pop();
      else this.tab = order[a];
      return true;
    }
    return false;
  }

  // ───────── 탐험대
  party(app: App, x: number, y: number, w: number, h: number, side: boolean): void {
    const ui = app.ui;
    const g = app.g!;
    const s = g.save;
    y += heroRow(app, x, y, this.hero, (hh) => (this.hero = hh));
    const hh = this.hero;
    const c = CLASSES[hh];
    if (!s.party.includes(hh)) {
      ui.paragraph(`아직 탐험대에 없어요. ${WHERE[hh]}에 갇혀 있대요.`, x, y + 6, w, C.dim, 10);
      return;
    }
    const st = heroState(s, hh);
    const stats = statsOf(g, hh);
    ui.panel(x, y, 60, 76, hh === s.hero ? '#5a4a30' : '#4a3e66');
    ui.img(pixCanvas(heroSprite(hh, 'down', 'idle')), x + 30 - 19.5, y + 4, 39, 60);
    ui.text(c.name, x + 68, y + 2, c.color, 12);
    ui.text(`${c.title}${hh === s.hero ? ' · 앞장서는 중' : st.down > 0 ? ` · 쓰러짐 (${Math.ceil(st.down)}초)` : ' · 쉬는 중'}`, x + 68, y + 18, C.light, 10);
    const need = expToNext(s.lv);
    ui.bar(x + 68, y + 34, Math.min(160, w - 76), 5, s.exp / need, C.exp);
    ui.text(`탐험대 Lv ${s.lv} · 경험치 ${s.exp} / ${need}`, x + 68, y + 42, C.dim, 9);
    ui.img(pixCanvas(weaponIcon(c.weapon)), x + 68, y + 55, 14, 14);
    ui.text(`${WEAPON_NAME[hh]} +${st.weaponLv - 1}`, x + 86, y + 57, C.gold, 10);
    // 능력치
    let yy = y + 84;
    const grow = ATTRS.filter((a) => GROWTH[hh][a] > 0).map((a) => `${ATTR_INFO[a].name} +${GROWTH[hh][a]}`).join(' · ');
    ui.text(`레벨마다 저절로: ${grow}`, x, yy, C.dim, 9);
    yy += 16;
    const colW = Math.min(240, w);
    ATTRS.forEach((a) => {
      const main = c.main === a;
      ui.text(`${ATTR_INFO[a].name}${main ? ' ★' : ''}`, x, yy + 3, main ? C.gold : C.light, 10);
      ui.text(String(st.attrs[a]), x + 52, yy + 3, C.light, 10);
      ui.text(ATTR_INFO[a].desc, x + 80, yy + 4, C.dim, 8);
      yy += 19;
    });
    const rows: [string, string][] = [
      ['HP', `${Math.ceil(Math.min(st.hp, stats.maxHp))} / ${stats.maxHp}`],
      ['태엽', `${Math.ceil(st.sp)} / ${stats.maxSp}`],
      ['공격력', `${Math.round(stats.atk)}`],
      ['방어', `${Math.round(stats.def)}`],
      ['치명타', `${Math.round(stats.crit * 100)}% (×${stats.critDmg.toFixed(2)})`],
      ['공격 속도', `×${stats.aspd.toFixed(2)}`],
      ['이동 속도', `${Math.round(stats.ms)}`],
      ['스킬 피해', `+${Math.round(stats.skillPct)}%`],
      ['재사용 감소', `${Math.round(stats.cdr * 100)}%`],
    ];
    const sx = side ? x + colW + 14 : x;
    let sy = side ? y + 84 : yy + 6;
    const sw = side ? w - colW - 14 : w;
    rows.forEach(([k, v], i) => {
      const cx = side ? sx : sx + (i % 2) * (sw / 2);
      if (!side && i % 2 === 1) sy -= 13;
      ui.text(k, cx, sy, C.dim, 9);
      ui.text(v, cx + (side ? sw : sw / 2 - 8), sy, C.light, 9, 'right');
      sy += 13;
    });
    const fb = friendBonus(s);
    ui.text(`친구 ${s.rescued.length} 명 보너스: 공격 · HP +${Math.round((fb.atkPct ?? 0) * 100)}%`, sx, sy + 6, '#9af0c0', 9);
    void h;
  }

  // ───────── 스킬 (동료마다)
  skills(app: App, x: number, y: number, w: number, h: number): void {
    const ui = app.ui;
    const g = app.g!;
    const s = g.save;
    if (!s.party.includes(this.hero)) this.hero = s.hero;
    y += heroRow(app, x, y, this.hero, (hh) => (this.hero = hh), true);
    const hh = this.hero;
    const town = !!g.world.map.safe;
    const pts = heroState(s, hh).skillPts;
    ui.text(`${CLASSES[hh].name} 스킬 점수: ${pts}`, x, y, pts ? C.good : C.dim, 10);
    ui.text(town ? '변형은 마을에서 언제든 바꿀 수 있어요' : '변형은 마을에서 바꿀 수 있어요', x + w, y, C.dim, 8, 'right');
    const list = classSkills(hh);
    const rowH = Math.min(56, (h - 40) / list.length - 3);
    list.forEach((sk, i) => {
      const ry = y + 16 + i * (rowH + 3);
      const lv = withHero(s, hh, () => skillLv(s, sk.id)) ?? 0;
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
      ui.text(`Lv ${lv}/${sk.maxLv}${sk.key !== 'P' ? `  태엽 ${sk.sp} · ${sk.cd}초` : ''}`, x + w - 74, ry + 4, C.dim, 8, 'right');
      const vars = VARIANTS[sk.id];
      const cur = withHero(s, hh, () => variantOf(s, sk.id)) ?? 0;
      const desc = cur > 0 ? `${vars[cur].name}: ${vars[cur].desc}` : sk.desc(Math.max(1, lv));
      ui.paragraph(desc, x + ic + 10, ry + 16, w - ic - 90, cur > 0 ? '#c8b0ff' : C.dim, 8, 2);
      if (vars && lv > 0) {
        const bw = Math.min(78, (w - ic - 90) / 3 - 3);
        vars.forEach((vv, k) =>
          ui.button(`v-${sk.id}-${k}`, x + ic + 10 + k * (bw + 3), ry + rowH - 17, bw, 14, vv.name, () => {
            const r = withHero(s, hh, () => setVariant(s, sk.id, k, town));
            if (r?.ok) app.sfx('equip');
            else {
              app.sfx('error');
              app.toast('변형은 마을에서만 바꿀 수 있어요', C.bad);
            }
            app.saveNow();
          }, { active: cur === k, size: 8, enabled: town || cur === k }),
        );
      }
      const chk = withHero(s, hh, () => canLearn(s, sk.id))!;
      const label = chk.ok ? (lv ? '올리기' : '배우기') : chk.reason === 'level' ? `Lv${sk.req}` : chk.reason === 'max' ? '최고' : lv ? '올리기' : '배우기';
      ui.button(`sk-${sk.id}`, x + w - 64, ry + rowH / 2 - 9, 58, 18, label, () => {
        if (withHero(s, hh, () => learn(s, sk.id))) {
          app.sfx('level');
          refreshStats(g);
          app.saveNow();
        } else app.sfx('error');
      }, { enabled: chk.ok, color: C.gold, size: 9 });
    });
  }

  // ───────── 부품
  parts(app: App, x: number, y: number, w: number, h: number, side: boolean): void {
    const ui = app.ui;
    const g = app.g!;
    const s = g.save;
    const vlv = villageLevel(s);
    const n = partSlots(s, vlv);
    ui.text(`부품 칸 ${s.slots.length}/${n}  (블록 마을 ${vlv}단계${vlv < 6 ? ' · 친구가 늘면 칸이 늘어요' : ''})`, x, y, C.dim, 9);
    // 낀 부품
    const cell = 26;
    for (let i = 0; i < 6; i++) {
      const cx = x + i * (cell + 4);
      const cy = y + 14;
      const id = s.slots[i];
      const locked = i >= n;
      ui.panel(cx, cy, cell, cell, locked ? '#1a1424' : '#211a2e', id ? PARTS[id].color : C.edge);
      if (locked) ui.text('🔒', cx + cell / 2, cy + 7, C.dim, 9, 'center');
      if (id) {
        const f = ui.hit(`slot-${i}`, cx, cy, cell, cell, () => this.pickPart(app, id));
        ui.img(pixCanvas(partIcon(id, PARTS[id].color)), cx + 3, cy + 3, cell - 6, cell - 6);
        if (f || ui.hover === `slot-${i}`) ui.focusRing(cx, cy, cell, cell);
      }
    }
    // 가진 부품 · 못 가진 부품
    const lw = side ? Math.floor(w * 0.56) : w;
    const all = [...BASIC_PARTS, ...SPECIAL_PARTS];
    const cols = Math.max(6, Math.floor(lw / (cell + 3)));
    const gy = y + 50;
    all.forEach((id, i) => {
      const cx = x + (i % cols) * (cell + 3);
      const cy = gy + Math.floor(i / cols) * (cell + 3);
      const lv = s.parts[id] ?? 0;
      const on = s.slots.includes(id);
      const f = ui.hit(`part-${id}`, cx, cy, cell, cell, () => this.pickPart(app, id));
      ui.panel(cx, cy, cell, cell, this.part === id ? '#4a3e66' : '#211a2e', on ? C.gold : id.startsWith('p_') ? '#c890ff' : C.edge);
      if (lv) {
        ui.img(pixCanvas(partIcon(id, PARTS[id].color)), cx + 3, cy + 3, cell - 6, cell - 6);
        if (!id.startsWith('p_')) ui.outlined(String(lv), cx + cell - 4, cy + cell - 5, '#ffffff', 8);
      } else ui.text('?', cx + cell / 2, cy + 7, '#4a3e66', 11, 'center');
      if (f || ui.hover === `part-${id}`) ui.focusRing(cx, cy, cell, cell);
    });
    const rows = Math.ceil(all.length / cols);
    // 설명
    const ix = side ? x + lw + 10 : x;
    const iy = side ? gy : gy + rows * (cell + 3) + 6;
    const iw = side ? w - lw - 10 : w;
    const id = this.part;
    if (!id) {
      ui.paragraph(app.touch ? '부품을 누르면 설명이 보여요. 한 번 더 누르면 끼우거나 빼요.' : '부품을 고르면 설명이 보여요. Z 를 한 번 더 누르면 끼우거나 빼요.', ix, iy, iw, C.dim, 9);
      ui.paragraph('부품은 탐험대 모두에게 효과가 있어요. 재봉 토끼가 만들고 꿰매 주고, 보스 · 보물 상자 · 정예에서도 나와요.', ix, iy + 34, iw, C.dim, 9);
      return;
    }
    const p = PARTS[id];
    const lv = s.parts[id] ?? 0;
    let yy = iy;
    ui.text(lv ? p.name : '??? (아직 없음)', ix, yy, lv ? p.color : C.dim, 12);
    yy += 16;
    const special = id.startsWith('p_');
    ui.text(special ? '특별한 부품 · 능력' : `보통 부품 · ${lv ? `${lv}단계` : '0단계'} / ${PART_MAX}`, ix, yy, special ? '#c890ff' : C.dim, 9);
    yy += 14;
    yy += ui.paragraph(p.desc(Math.max(1, lv)), ix, yy, iw, C.light, 10);
    if (!special && lv && lv < PART_MAX) yy += ui.paragraph(`다음 단계: ${p.desc(lv + 1)}`, ix, yy, iw, C.dim, 9);
    if (!lv) yy += ui.paragraph(p.craft ? '재봉 토끼가 만들어 줄 수 있어요.' : '보스 · 보물 상자 · 정예 · 퀘스트에서 얻어요.', ix, yy + 2, iw, C.dim, 9);
    const on = s.slots.includes(id);
    if (lv) ui.button('wear', ix, Math.min(yy + 6, y + h - 22), 80, 20, on ? '빼기' : '끼우기', () => this.toggle(app, id), { color: on ? C.light : C.gold, size: 10, enabled: on || s.slots.length < n });
  }

  pickPart(app: App, id: string): void {
    if (this.part === id && app.g!.save.parts[id]) {
      this.toggle(app, id);
      return;
    }
    this.part = id;
    app.sfx('move');
  }

  toggle(app: App, id: string): void {
    const g = app.g!;
    const s = g.save;
    const ok = s.slots.includes(id) ? unequipPart(s, id) : equipPart(s, id, villageLevel(s));
    if (!ok) app.toast('부품 칸이 가득 찼어요', C.bad);
    app.sfx(ok ? 'equip' : 'error');
    if (ok) {
      refreshStats(g);
      app.saveNow();
    }
  }

  // ───────── 도감
  bookTab(app: App, x: number, y: number, w: number, h: number, side: boolean): void {
    const ui = app.ui;
    const s = app.g!.save;
    const total = Object.keys(MONSTERS).length;
    ui.text(`구한 친구 ${s.rescued.length} / ${total} · 블록 마을 ${villageLevel(s)}단계`, x, y, '#9af0c0', 10);
    const lw = side ? Math.floor(w * 0.62) : w;
    const cell = 24;
    let yy = y + 16;
    for (const grp of bookGroups()) {
      ui.text(grp.name, x, yy, C.dim, 8);
      yy += 10;
      const cols = Math.floor(lw / (cell + 2));
      grp.ids.forEach((id, i) => {
        const cx = x + (i % cols) * (cell + 2);
        const cy = yy + Math.floor(i / cols) * (cell + 2);
        const met = (s.friends[id] ?? 0) > 0 || s.rescued.includes(id);
        const done = s.rescued.includes(id);
        const f = ui.hit(`book-${id}`, cx, cy, cell, cell, () => (this.book = id));
        ui.panel(cx, cy, cell, cell, this.book === id ? '#4a3e66' : '#211a2e', done ? '#9af0c0' : C.edge);
        const im = met ? pixCanvas(monsterFrames(id)[0]) : silhouette(id);
        const k = Math.min((cell - 4) / im.width, (cell - 4) / im.height);
        ui.img(im, cx + cell / 2 - (im.width * k) / 2, cy + cell / 2 - (im.height * k) / 2, im.width * k, im.height * k);
        if (done) ui.outlined('♥', cx + cell - 4, cy + 5, '#ff7a9a', 8);
        if (f || ui.hover === `book-${id}`) ui.focusRing(cx, cy, cell, cell);
      });
      yy += Math.ceil(grp.ids.length / cols) * (cell + 2) + 2;
    }
    const ix = side ? x + lw + 10 : x;
    const iy = side ? y + 16 : yy + 4;
    const iw = side ? w - lw - 10 : w;
    const id = this.book;
    if (!id) {
      let yy = iy + ui.paragraph('같은 장난감을 여러 번 깨끗하게 하면 블록 마을 친구가 돼요. 친구 하나마다 공격 · HP +1%, 셋마다 마을이 커져요.', ix, iy, iw, C.dim, 9) + 4;
      ui.text('마을 시설', ix, yy, C.light, 10);
      yy += 14;
      const have = facilities(s);
      for (const f of FACILITIES) {
        const on = have.includes(f.id);
        ui.text(`${on ? '●' : '○'} ${f.lv}단계 ${f.name}`, ix, yy, on ? C.gold : C.dim, 9);
        yy += 11;
        yy += ui.paragraph(f.desc, ix + 10, yy, iw - 10, on ? C.light : '#6a5a80', 8, 2) + 2;
      }
      return;
    }
    const d = MONSTERS[id];
    const met = (s.friends[id] ?? 0) > 0 || s.rescued.includes(id);
    const need = rescueNeed(id);
    ui.text(met ? d.name : '???', ix, iy, met ? C.light : C.dim, 12);
    if (s.rescued.includes(id)) ui.text('블록 마을에 살아요 ♥', ix, iy + 16, '#9af0c0', 10);
    else {
      ui.text(`깨끗하게 한 횟수 ${s.friends[id] ?? 0} / ${need}`, ix, iy + 16, C.light, 10);
      ui.bar(ix, iy + 30, Math.min(120, iw), 5, (s.friends[id] ?? 0) / need, '#9af0c0');
    }
    if (met) ui.text(`Lv ${d.lv}${d.boss ? ' · 보스' : ''}`, ix, iy + 42, C.dim, 9);
    void h;
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
    ui.paragraph(`보상: ${rewardText(q.reward)}`, ix, iy, iw, C.dim, 9);
  }

  // ───────── 시스템
  system(app: App, x: number, y: number, w: number): void {
    const ui = app.ui;
    const bw = Math.min(160, w);
    const s = app.g!.save;
    ui.text(`놀이 시간 ${Math.floor(s.playTime / 60)}분 · 깨끗하게 한 장난감 ${s.kills} · 다락방 상자 최고 ${s.riftBest}층`, x, y, C.dim, 9);
    ui.button('save', x, y + 18, bw, 22, '지금 저장하기', () => {
      app.saveNow();
      app.toast('저장했어요', C.good);
      app.sfx('click');
    });
    ui.button('settings', x, y + 46, bw, 22, '소리 · 놀이 설정', () => app.push(new SettingsScreen()));
    ui.button('title', x, y + 74, bw, 22, '저장하고 타이틀로', () => {
      app.saveNow();
      app.toTitle();
    }, { color: C.bad });
    ui.text('난이도', x + bw + 12, y + 22, C.light, 10);
    DIFFICULTIES.forEach((d, i) =>
      ui.button(`diff-${d}`, x + bw + 12 + i * 54, y + 36, 50, 18, DIFFICULTY[d].name, () => {
        setDifficulty(app.g!, d);
        app.toast(`난이도: ${DIFFICULTY[d].name} (새로 나오는 몬스터부터)`, C.gold);
        app.saveNow();
      }, { active: s.difficulty === d, size: 9 }),
    );
    // 가진 것
    let mx = x + bw + 12;
    const my = y + 64;
    const things: [HTMLCanvasElement, number][] = [[pixCanvas(candyIcon()), s.potions.hp], ...(['fluff', 'gear', 'sugar', 'dust', 'star'] as MatId[]).map((m) => [pixCanvas(matIcon(m)), s.mats[m]] as [HTMLCanvasElement, number])];
    for (const [im, n] of things) {
      if (mx + 34 > x + w) break;
      ui.img(im, mx, my, 12, 12);
      ui.text(String(n), mx + 14, my + 1, C.light, 9);
      mx += 34;
    }
    const keys = app.touch
      ? ['왼쪽 화면을 끌어 이동', '오른쪽 큰 단추: 공격 · 말 걸기', '구르기: 잠깐 무적 · A S D F: 스킬', '사탕: HP 회복 · 얼음 땡 동안 가만히 있으면 태엽이 감긴다', '왼쪽 위 동료 얼굴을 누르면 교대']
      : ['방향키: 이동    Z / 스페이스: 공격 · 말 걸기 · 확인', 'X: 구르기 (잠깐 무적) · 창 닫기', 'A S D F: 스킬    Q: 사탕    얼음 땡: 가만히 있으면 태엽이 감긴다', 'E: 다음 동료로 교대    1~4: 그 동료로 교대', 'Esc 메뉴 · C 탐험대 · K 스킬 · I 부품 · B 도감 · J 퀘스트'];
    keys.forEach((k, i) => ui.text(k, x, y + 108 + i * 13, C.dim, 9));
  }
}

/** 그 동료의 능력 (부품 · 친구 보너스 포함) */
function statsOf(g: Game, h: HeroId): Game['stats'] {
  if (h === g.save.hero) return g.stats;
  const st = withHero(g.save, h, () => refreshStats(g))!;
  refreshStats(g);
  return st;
}

export function rewardText(r: (typeof QUESTS)[number]['reward']): string {
  const out = [`경험치 ${r.exp}`];
  if (r.gold) out.push(`단추 ${r.gold}`);
  if (r.potions?.hp) out.push(`사탕 ${r.potions.hp}`);
  if (r.part) out.push(`부품 「${PARTS[r.part].name}」`);
  for (const [m, n] of Object.entries(r.mats ?? {})) out.push(`${MAT_NAME[m]} ${n}`);
  return out.join(' · ');
}
