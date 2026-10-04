/** 블록 마을 시설: 친구가 늘어 마을 단계가 오르면 하나씩 생긴다 */
import { villageLevel } from './friends.ts';
import type { Game } from './game.ts';
import { benchMaxHp } from './tag.ts';
import type { Save } from './types.ts';

export const VILLAGE = { candy: 2, expPct: 0.1, goldPct: 15 };

export const FACILITIES: { lv: number; id: string; name: string; desc: string }[] = [
  { lv: 2, id: 'house', name: '친구들의 집', desc: '구한 친구들이 사는 블록 집이 생기고, 가게에 부품이 들어온다' },
  { lv: 3, id: 'rest', name: '쉼터 방석', desc: '방에서 돌아오면 탐험대 모두 HP · 태엽이 가득 찬다' },
  { lv: 4, id: 'candy', name: '사탕 공장', desc: `방에서 돌아올 때마다 사탕 ${VILLAGE.candy}개` },
  { lv: 5, id: 'gym', name: '놀이터', desc: `경험치 +${VILLAGE.expPct * 100}%` },
  { lv: 6, id: 'festival', name: '축제 무대', desc: `단추 +${VILLAGE.goldPct}%` },
];

/** 지금 있는 시설 */
export function facilities(save: Save): string[] {
  const lv = villageLevel(save);
  return FACILITIES.filter((f) => lv >= f.lv).map((f) => f.id);
}

export function hasFacility(save: Save, id: string): boolean {
  return facilities(save).includes(id);
}

/** 그 단계에 생기는 시설 */
export function facilityAt(lv: number): string | null {
  return FACILITIES.find((f) => f.lv === lv)?.id ?? null;
}

/** 방에서 마을로 돌아왔다: 쉼터 · 사탕 공장 */
export function arriveVillage(g: Game): void {
  const s = g.save;
  if (hasFacility(s, 'rest')) {
    s.hp = g.stats.maxHp;
    s.sp = g.stats.maxSp;
    for (const h of s.party) {
      const st = s.bench[h];
      if (!st) continue;
      st.hp = benchMaxHp(s, h);
      st.sp = 100;
      st.down = 0;
    }
  }
  if (hasFacility(s, 'candy')) {
    s.potions.hp += VILLAGE.candy;
    g.world.events.push({ kind: 'villageGift', candy: VILLAGE.candy });
  }
}
