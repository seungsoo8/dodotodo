import { HEROES } from './heroes.ts';
import type { RunReport } from './progress.ts';
import type { WeaponType } from './types.ts';

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  /** 처음 얻을 때 받는 별조각 */
  reward: number;
  /** 이번 판 결과와 (이번 판을 뺀) 이겨 본 탑 목록으로 판정 */
  check(r: RunReport, heroWins: string[]): boolean;
}

const classicWin = (r: RunReport) => r.mode === 'classic' && r.won;

/** 무기로 준 피해가 있고, 모두 그 계열일 때 */
function onlyType(r: RunReport, type: WeaponType): boolean {
  const total = Object.values(r.weaponDamage).reduce((a, b) => a + b, 0);
  return total > 0 && r.weaponDamage[type] === total;
}

const only = (id: string, name: string, type: WeaponType, label: string): AchievementDef => ({
  id,
  name,
  desc: `${label} 무기로만 승리`,
  reward: 40,
  check: (r) => classicWin(r) && onlyType(r, type),
});

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_win', name: '첫 승리', desc: '클래식에서 보스를 잡고 승리', reward: 20, check: classicWin },
  only('normal_only', '기본에 충실', 'normal', '일반'),
  only('pierce_only', '바람의 궁수', 'pierce', '관통'),
  only('magic_only', '번개술사', 'magic', '마법'),
  only('siege_only', '포격 대장', 'siege', '공성'),
  only('chaos_only', '운명의 도박사', 'chaos', '카오스'),
  { id: 'no_skill', name: '맨손의 수호자', desc: '스킬을 한 번도 쓰지 않고 승리', reward: 30, check: (r) => classicWin(r) && r.skillsUsed === 0 },
  { id: 'hard_win', name: '강철 심장', desc: '어려움 난이도로 승리', reward: 60, check: (r) => classicWin(r) && r.difficulty === 'hard' },
  { id: 'flawless', name: '철벽', desc: '체력 80% 이상 남기고 승리', reward: 40, check: (r) => classicWin(r) && r.hpRatio >= 0.8 },
  { id: 'star3', name: '전설의 대장장이', desc: '★3 무기 만들기', reward: 20, check: (r) => r.maxStar >= 3 },
  { id: 'endless_30', name: '끝나지 않는 밤', desc: '무한 모드 30라운드 도달', reward: 30, check: (r) => r.mode === 'endless' && r.round >= 30 },
  { id: 'boss_slayer', name: '보스 사냥꾼', desc: '무한 모드 한 판에 보스 3마리 처치', reward: 50, check: (r) => r.mode === 'endless' && r.bossesKilled >= 3 },
  { id: 'rich', name: '부자 탑', desc: '골드 2000 이상 가진 채 판 끝내기', reward: 20, check: (r) => r.gold >= 2000 },
  {
    id: 'all_heroes',
    name: '다섯 등불',
    desc: '다섯 탑 모두로 클래식 승리',
    reward: 80,
    check: (r, heroWins) => {
      if (!classicWin(r) || !r.hero) return false;
      const wins = new Set([...heroWins, r.hero]);
      return HEROES.every((h) => wins.has(h.id));
    },
  },
];

/** 이번 판에서 조건을 채운 업적 id (이미 얻은 것 포함) */
export function checkAchievements(r: RunReport, heroWins: string[]): string[] {
  return ACHIEVEMENTS.filter((a) => a.check(r, heroWins)).map((a) => a.id);
}

export function findAchievement(id: string): AchievementDef {
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  if (!a) throw new Error(`알 수 없는 업적: ${id}`);
  return a;
}
