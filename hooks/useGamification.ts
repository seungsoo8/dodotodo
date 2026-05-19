'use client';

import { useMemo } from 'react';
import { Todo } from '@/types/todo';

const XP_BY_PRIORITY = { high: 30, medium: 20, low: 10 };
const XP_PER_SUBTASK = 5;
const XP_PER_LEVEL = 150;

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export interface GamificationState {
  totalXP: number;
  level: number;
  rank: string;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  progressPercent: number;
  achievements: Achievement[];
  completedCount: number;
}

const RANKS = [
  { minLevel: 1,  label: '새싹' },
  { minLevel: 3,  label: '도전자' },
  { minLevel: 6,  label: '실천가' },
  { minLevel: 10, label: '마스터' },
  { minLevel: 15, label: '레전드' },
];

function getRank(level: number): string {
  let rank = RANKS[0].label;
  for (const r of RANKS) {
    if (level >= r.minLevel) rank = r.label;
  }
  return rank;
}

export function useGamification(allTodos: Todo[]): GamificationState {
  return useMemo(() => {
    const completed = allTodos.filter(t => t.completed && !t.deletedAt);
    const completedCount = completed.length;

    const totalXP = completed.reduce((sum, t) => {
      const base = XP_BY_PRIORITY[t.priority] ?? 20;
      const subtaskBonus = (t.subtasks?.filter(s => s.completed).length ?? 0) * XP_PER_SUBTASK;
      return sum + base + subtaskBonus;
    }, 0);

    const level = Math.floor(totalXP / XP_PER_LEVEL) + 1;
    const xpInCurrentLevel = totalXP % XP_PER_LEVEL;
    const xpToNextLevel = XP_PER_LEVEL;
    const progressPercent = Math.round((xpInCurrentLevel / xpToNextLevel) * 100);
    const rank = getRank(level);

    const achievements: Achievement[] = [
      {
        id: 'first',
        title: '첫 걸음',
        description: '첫 번째 할 일 완료',
        icon: '🌱',
        unlocked: completedCount >= 1,
      },
      {
        id: 'ten',
        title: '열 개 완주',
        description: '10개 할 일 완료',
        icon: '🎯',
        unlocked: completedCount >= 10,
      },
      {
        id: 'fifty',
        title: '꾸준함의 힘',
        description: '50개 할 일 완료',
        icon: '💪',
        unlocked: completedCount >= 50,
      },
      {
        id: 'hundred',
        title: '백의 기적',
        description: '100개 할 일 완료',
        icon: '🏆',
        unlocked: completedCount >= 100,
      },
      {
        id: 'high_prio',
        title: '우선순위 마스터',
        description: '높은 우선순위 할 일 10개 완료',
        icon: '🔥',
        unlocked: completed.filter(t => t.priority === 'high').length >= 10,
      },
      {
        id: 'subtask',
        title: '디테일의 달인',
        description: '서브태스크 포함 할 일 5개 완료',
        icon: '🧩',
        unlocked: completed.filter(t => t.subtasks?.some(s => s.completed)).length >= 5,
      },
    ];

    return {
      totalXP,
      level,
      rank,
      xpInCurrentLevel,
      xpToNextLevel,
      progressPercent,
      achievements,
      completedCount,
    };
  }, [allTodos]);
}
