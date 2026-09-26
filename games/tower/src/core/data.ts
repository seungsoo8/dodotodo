import type { EnemyDef, ItemDef, UpgradeDef, WeaponDef } from './types.ts';

export const WEAPONS: WeaponDef[] = [
  // 일반: 싸고 꾸준한 단일 공격
  { kind: 'weapon', id: 'sling', name: '돌팔매', desc: '가장 싼 기본 무기', type: 'normal', price: 100, damage: 20, cooldown: 1, range: 120, behavior: { kind: 'single' } },
  { kind: 'weapon', id: 'battle_axe', name: '전투 도끼', desc: '묵직한 한 방', type: 'normal', price: 600, damage: 75, cooldown: 1.2, range: 110, behavior: { kind: 'single' } },
  { kind: 'weapon', id: 'twin_daggers', name: '쌍단검', desc: '빠르게 던지는 단검', type: 'normal', price: 250, damage: 18, cooldown: 0.5, range: 100, behavior: { kind: 'single' } },
  // 관통: 일직선 위 적을 모두 꿰뚫음
  { kind: 'weapon', id: 'longbow', name: '장궁', desc: '일직선을 꿰뚫는 화살', type: 'pierce', price: 150, damage: 30, cooldown: 1.2, range: 180, behavior: { kind: 'pierce', width: 10 } },
  { kind: 'weapon', id: 'gale_bow', name: '질풍 활', desc: '쉴 새 없이 꿰뚫는 화살', type: 'pierce', price: 550, damage: 22, cooldown: 0.4, range: 170, behavior: { kind: 'pierce', width: 8 } },
  { kind: 'weapon', id: 'ballista', name: '노포', desc: '멀리까지 꿰뚫는 큰 화살', type: 'pierce', price: 350, damage: 80, cooldown: 2, range: 220, behavior: { kind: 'pierce', width: 14 } },
  // 마법: 연쇄 / 둔화
  { kind: 'weapon', id: 'chain_bolt', name: '연쇄 번개', desc: '적 사이를 세 번 튀는 번개', type: 'magic', price: 200, damage: 25, cooldown: 1.2, range: 150, behavior: { kind: 'chain', jumps: 3, jumpRange: 60 } },
  { kind: 'weapon', id: 'storm_crystal', name: '폭풍 수정', desc: '적 사이를 여섯 번 튀는 폭풍', type: 'magic', price: 700, damage: 40, cooldown: 1.5, range: 170, behavior: { kind: 'chain', jumps: 6, jumpRange: 70 } },
  { kind: 'weapon', id: 'frost_orb', name: '서리 구슬', desc: '맞은 적을 2초간 절반 속도로', type: 'magic', price: 300, damage: 20, cooldown: 1, range: 140, behavior: { kind: 'slow', factor: 0.5, duration: 2 } },
  // 공성: 광역
  { kind: 'weapon', id: 'mortar', name: '박격포', desc: '착탄 지점 주변을 폭파', type: 'siege', price: 200, damage: 40, cooldown: 2, range: 200, behavior: { kind: 'splash', radius: 40 } },
  { kind: 'weapon', id: 'catapult', name: '투석기', desc: '아주 멀리 날아가 크게 터진다', type: 'siege', price: 650, damage: 110, cooldown: 3, range: 240, behavior: { kind: 'splash', radius: 60 } },
  { kind: 'weapon', id: 'fire_pot', name: '화염 항아리', desc: '넓게 터지는 불 항아리', type: 'siege', price: 400, damage: 35, cooldown: 1.5, range: 150, behavior: { kind: 'splash', radius: 55 } },
  // 카오스: 피해가 매번 달라짐
  { kind: 'weapon', id: 'chaos_orb', name: '혼돈 구슬', desc: '피해가 50%~200% 사이로 요동', type: 'chaos', price: 150, damage: 30, cooldown: 1, range: 150, behavior: { kind: 'single' } },
  { kind: 'weapon', id: 'chaos_eye', name: '혼돈의 눈', desc: '미친 듯이 빠른 혼돈 광선', type: 'chaos', price: 600, damage: 22, cooldown: 0.3, range: 130, behavior: { kind: 'single' } },
  { kind: 'weapon', id: 'void_ray', name: '공허 광선', desc: '강력하지만 들쭉날쭉한 광선', type: 'chaos', price: 450, damage: 60, cooldown: 1, range: 170, behavior: { kind: 'single' } },
];

export const UPGRADES: UpgradeDef[] = [
  { kind: 'upgrade', id: 'wall', name: '튼튼한 벽', desc: '최대 체력 +300 (그만큼 회복)', price: 100, effect: { stat: 'maxHp', amount: 300 } },
  { kind: 'upgrade', id: 'regen_rune', name: '재생의 룬', desc: '초당 체력 재생 +5', price: 150, effect: { stat: 'regen', amount: 5 } },
  { kind: 'upgrade', id: 'iron_plate', name: '강철판', desc: '방어력 +2 (받는 피해 감소)', price: 150, effect: { stat: 'armor', amount: 2 } },
  { kind: 'upgrade', id: 'war_manual', name: '전투 교본', desc: '모든 무기 피해 +10%', price: 200, effect: { stat: 'damage', amount: 0.1 } },
  { kind: 'upgrade', id: 'gold_coin', name: '황금 동전', desc: '초당 골드 +3', price: 200, effect: { stat: 'income', amount: 3 } },
  { kind: 'upgrade', id: 'swift_rune', name: '신속의 룬', desc: '모든 무기 공격 속도 +25%', price: 350, effect: { stat: 'attackSpeed', amount: 0.25 } },
  { kind: 'upgrade', id: 'keen_edge', name: '예리한 칼날', desc: '치명타 확률 +10% (치명타는 2배)', price: 250, effect: { stat: 'crit', amount: 0.1 } },
  { kind: 'upgrade', id: 'thorn_mail', name: '가시 갑옷', desc: '탑을 때린 적에게 15 피해', price: 150, effect: { stat: 'thorns', amount: 15 } },
  { kind: 'upgrade', id: 'spyglass', name: '망원경', desc: '모든 무기 사거리 +15', price: 200, effect: { stat: 'range', amount: 15 } },
];

/** 전설 무기: 영구 성장으로 해금해야 상점에 나온다 */
export const LEGENDARY_WEAPONS: WeaponDef[] = [
  { kind: 'weapon', id: 'thunder_hammer', name: '천둥 망치', desc: '맞으면 벼락이 떨어지는 큰 망치', type: 'normal', price: 900, damage: 150, cooldown: 1.6, range: 125, behavior: { kind: 'single' } },
  { kind: 'weapon', id: 'phoenix_bow', name: '불사조 활', desc: '불붙은 화살이 줄줄이 꿰뚫는다', type: 'pierce', price: 850, damage: 42, cooldown: 0.5, range: 210, behavior: { kind: 'pierce', width: 14 } },
  { kind: 'weapon', id: 'meteor_staff', name: '유성 지팡이', desc: '작은 유성을 떨궈 넓게 터뜨린다', type: 'siege', price: 1000, damage: 190, cooldown: 3, range: 230, behavior: { kind: 'splash', radius: 70 } },
];

export const SHOP_POOL: ItemDef[] = [...WEAPONS, ...UPGRADES, ...LEGENDARY_WEAPONS];

export const ENEMIES: EnemyDef[] = [
  { id: 'goblin', name: '고블린', hp: 40, speed: 40, atk: 5, atkInterval: 1, bounty: 5, radius: 6, minRound: 1, weight: 10, color: '#7bc96f' },
  { id: 'wolf', name: '늑대', hp: 60, speed: 70, atk: 6, atkInterval: 0.8, bounty: 8, radius: 6, minRound: 3, weight: 6, color: '#a8a8b8' },
  { id: 'orc', name: '오크', hp: 120, speed: 28, atk: 12, atkInterval: 1.2, bounty: 12, radius: 8, minRound: 4, weight: 5, color: '#c98a4b' },
  { id: 'slime', name: '분열 슬라임', hp: 90, speed: 30, atk: 8, atkInterval: 1, bounty: 6, radius: 7, minRound: 3, weight: 4, color: '#6fdc6f', ability: 'split' },
  { id: 'thief', name: '도둑 고블린', hp: 50, speed: 75, atk: 0, atkInterval: 1, bounty: 15, radius: 6, minRound: 4, weight: 2, color: '#c9a24b', ability: 'thief' },
  { id: 'shield', name: '방패병', hp: 200, speed: 22, atk: 14, atkInterval: 1.3, bounty: 18, radius: 8, minRound: 5, weight: 3, color: '#9aa0b0', ability: 'shield' },
  { id: 'shaman', name: '주술사', hp: 150, speed: 25, atk: 10, atkInterval: 1.5, bounty: 20, radius: 7, minRound: 6, weight: 2, color: '#6fb7ff', ability: 'healer' },
  { id: 'bat', name: '박쥐', hp: 45, speed: 65, atk: 7, atkInterval: 0.8, bounty: 9, radius: 5, minRound: 8, weight: 4, color: '#7a5cff', ability: 'flying' },
  { id: 'golem', name: '돌 골렘', hp: 400, speed: 18, atk: 30, atkInterval: 1.5, bounty: 40, radius: 11, minRound: 7, weight: 2, color: '#8e7cc3' },
];

export const BOSS: EnemyDef = {
  id: 'boss', name: '땅굴 군주', hp: 105000, speed: 15, atk: 150, atkInterval: 1.5, bounty: 1000, radius: 16, minRound: Infinity, weight: 0, color: '#e05260',
  boss: { pattern: 'summon', line: '얘들아, 밥 먹을 시간이다!' },
};

export const BOSS_RHINO: EnemyDef = {
  id: 'boss_rhino', name: '강철 뿔', hp: 90000, speed: 15, atk: 140, atkInterval: 1.5, bounty: 1000, radius: 16, minRound: Infinity, weight: 0, color: '#8a93a6',
  boss: { pattern: 'charge', line: '비켜라! 들이받는다!' },
};

export const BOSS_WITCH: EnemyDef = {
  id: 'boss_witch', name: '불꽃 마녀', hp: 80000, speed: 20, atk: 70, atkInterval: 1.2, bounty: 1000, radius: 14, minRound: Infinity, weight: 0, color: '#ff7a3d',
  boss: { pattern: 'nova', line: '돌탑도 잘 타려나?' },
};

export const BOSSES: EnemyDef[] = [BOSS, BOSS_RHINO, BOSS_WITCH];

/** 보스 패턴 수치 (한곳에서 조정) */
export const BOSS_PATTERN = {
  /** 패턴 주기 (초) */
  interval: { summon: 5, charge: 5, nova: 6 },
  /** 기 모으는 시간 (초) — 이 동안 얼리거나 크게 때리면 끊긴다 */
  windup: { summon: 1, charge: 1.2, nova: 2 },
  /** 기 모으는 동안 최대 체력의 이 비율 이상 맞으면 끊긴다 */
  staggerPct: 0.04,
  summonCount: 6,
  summonIds: ['wolf', 'orc'],
  summonSpread: 18,
  chargeSpeed: 220,
  chargeHitMul: 3,
  novaMul: 8,
  /** 마녀가 멈춰 서는 탑과의 거리 */
  novaStandoff: 115,
  /** 체력이 이 비율 아래로 떨어지면 광폭화 */
  enrageAt: 0.5,
  enrageSpeed: 1.3,
  enrageInterval: 0.6,
};

/** 분열 슬라임이 죽으면 나오는 새끼 (스스로는 나오지 않음) */
export const SLIMELET: EnemyDef = {
  id: 'slimelet', name: '새끼 슬라임', hp: 35, speed: 45, atk: 4, atkInterval: 1, bounty: 2, radius: 4, minRound: Infinity, weight: 0, color: '#9fe89a',
};

/** 분열: 새끼 수와 퍼지는 거리 */
export const SPLIT = { count: 2, spread: 6 };
/** 도둑: 훔치는 골드 = baseSteal + perRound × 라운드 */
export const THIEF = { baseSteal: 25, perRound: 5, escapeMargin: 20 };
/** 주술사: 멈추는 거리, 치유 주기·범위·비율 */
export const SHAMAN = { stopDistance: 130, interval: 2, radius: 70, healPct: 0.12 };
/** 방패병: 이 계열 무기 피해를 줄인다 */
export const SHIELD = { reduction: 0.5, types: ['normal', 'pierce'] as string[] };

/** 무기를 팔 때 돌려받는 비율 (★ 레벨만큼 산 개수 기준) */
export const SELL_REFUND = 0.5;

/** 정예 배율 */
export const ELITE = { hpMul: 6, atkMul: 2, bountyMul: 8, radiusBonus: 3 };

export function findItem(id: string): ItemDef {
  const item = SHOP_POOL.find((i) => i.id === id);
  if (!item) throw new Error(`알 수 없는 아이템: ${id}`);
  return item;
}

export function findEnemy(id: string): EnemyDef {
  const def = id === SLIMELET.id ? SLIMELET : [...BOSSES, ...ENEMIES].find((e) => e.id === id);
  if (!def) throw new Error(`알 수 없는 적: ${id}`);
  return def;
}
