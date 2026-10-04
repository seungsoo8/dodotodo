/** 망치 너구리의 무기 손질: 동료마다 무기 Lv 1~20 */
import { CLASSES } from '../../core/classes.ts';
import { refreshStats } from '../../core/combat.ts';
import { HERO_SLOTS, heroState, withHero } from '../../core/party.ts';
import { upgradeWeapon, WEAPON_MAX, WEAPON_NAME, weaponCost, weaponDamage } from '../../core/weapon.ts';
import type { HeroId, MatId } from '../../core/types.ts';
import { pixCanvas } from '../art/canvas.ts';
import { goldIcon, matIcon, weaponIcon } from '../art/icons.ts';
import { C, frame } from '../kit.ts';
import { MAT_NAME } from '../hud.ts';
import type { App, Screen } from './screen.ts';

export class ForgeScreen implements Screen {
  modal = true;
  hero: HeroId;
  /** 막 손질한 반짝임 */
  flash = 0;

  constructor(app: App) {
    this.hero = app.g?.save.hero ?? 'toby';
  }

  draw(app: App, dt: number): void {
    const ui = app.ui;
    const g = app.g!;
    const s = g.save;
    this.flash = Math.max(0, this.flash - dt);
    ui.dim(0.5);
    const F = frame(ui, 440, 260);
    ui.panel(F.px, F.py, F.pw, F.ph);
    ui.text('망치 너구리의 무기 손질', F.px + 8, F.py + 6, C.gold, 12);
    ui.img(pixCanvas(goldIcon()), F.px + F.pw - 70, F.py + 6, 11, 11);
    ui.text(`${s.gold}`, F.px + F.pw - 8, F.py + 7, C.gold, 10, 'right');
    ui.button('close', F.px + F.pw - 26, F.py + F.ph - 24, 20, 18, '✕', () => app.pop(), { size: 10 });
    const x = F.px + 10;
    let y = F.py + 26;
    // 동료 고르기
    HERO_SLOTS.filter((h) => s.party.includes(h)).forEach((h, i) =>
      ui.button(`fh-${h}`, x + i * 66, y, 62, 18, CLASSES[h].name, () => (this.hero = h), { active: this.hero === h, size: 9, color: CLASSES[h].color }),
    );
    y += 28;
    const h = this.hero;
    const wlv = heroState(s, h).weaponLv;
    const k = 1 + this.flash * 2;
    ui.panel(x, y, 56, 56, this.flash > 0 ? '#6a5a30' : '#4a3e66');
    ui.img(pixCanvas(weaponIcon(CLASSES[h].weapon)), x + 28 - 20 * k, y + 28 - 20 * k, 40 * k, 40 * k);
    ui.text(`${WEAPON_NAME[h]} +${wlv - 1}`, x + 66, y + 2, C.gold, 12);
    ui.text(`${CLASSES[h].name}의 무기 · Lv ${wlv} / ${WEAPON_MAX}`, x + 66, y + 20, C.dim, 9);
    const now = weaponDamage(h, wlv, s.lv).toFixed(1);
    if (wlv < WEAPON_MAX) {
      const next = weaponDamage(h, wlv + 1, s.lv).toFixed(1);
      ui.text(`무기 피해 ${now} → ${next}`, x + 66, y + 36, C.good, 10);
    } else ui.text(`무기 피해 ${now} (최고 단계)`, x + 66, y + 36, C.light, 10);
    y += 66;
    if (wlv >= WEAPON_MAX) {
      ui.paragraph('더 손질할 곳이 없을 만큼 반짝반짝해요!', x, y, F.pw - 20, C.light, 10);
      return;
    }
    const c = weaponCost(wlv);
    ui.text('손질 비용', x, y, C.light, 10);
    y += 16;
    let cx = x;
    const need: [HTMLCanvasElement, string, number, number][] = [[pixCanvas(goldIcon()), '단추', c.gold, s.gold]];
    for (const m of ['gear', 'dust', 'star'] as MatId[]) if (c[m as 'gear']) need.push([pixCanvas(matIcon(m)), MAT_NAME[m], c[m as 'gear'], s.mats[m]]);
    for (const [im, name, n, have] of need) {
      ui.img(im, cx, y, 12, 12);
      ui.text(`${name} ${n} (${have})`, cx + 14, y + 1, have >= n ? C.light : C.bad, 9);
      cx += ui.measure(`${name} ${n} (${have})`, 9) + 26;
    }
    y += 22;
    const ok = s.gold >= c.gold && s.mats.gear >= c.gear && s.mats.dust >= c.dust && s.mats.star >= c.star;
    ui.button('upgrade', x, y, 120, 24, '손질하기!', () => {
      if (withHero(s, h, () => upgradeWeapon(s))) {
        this.flash = 0.5;
        app.sfx('forgeOk');
        refreshStats(g);
        app.toast(`${WEAPON_NAME[h]} +${heroState(s, h).weaponLv - 1}!`, C.gold);
        app.saveNow();
      } else app.sfx('error');
    }, { enabled: ok, color: C.gold });
    ui.paragraph('손질은 실패하지 않아요. 톱니는 태엽 장난감에게서, 별가루 · 별 조각은 먼지 장난감과 보스에게서 얻어요.', x, y + 32, F.pw - 20, C.dim, 9);
  }
}
