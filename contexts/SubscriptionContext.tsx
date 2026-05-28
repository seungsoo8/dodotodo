'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type Plan = 'free' | 'pro';

export type ProFeature =
  | 'calendar'
  | 'analytics'
  | 'matrix'
  | 'kanban'
  | 'habit'
  | 'ai_chat'
  | 'weekly_review'
  | 'unlimited_projects'
  | 'advanced_recurring';

export const PRO_FEATURE_META: Record<ProFeature, { title: string; desc: string; emoji: string }> = {
  calendar:            { emoji: '📅', title: '캘린더 뷰',       desc: '날짜별로 할 일을 한눈에 보고 일정 기간을 시각화하세요.' },
  analytics:           { emoji: '📊', title: '상세 분석',        desc: '완료 히트맵, 스트릭, 우선순위별 통계로 생산성을 파악하세요.' },
  matrix:              { emoji: '🎯', title: '아이젠하워 매트릭스', desc: '긴급성과 중요도로 할 일을 4사분면에 정리하세요.' },
  kanban:              { emoji: '📋', title: '칸반 보드',         desc: '카드를 드래그해 진행 상태를 시각적으로 관리하세요.' },
  habit:               { emoji: '🔥', title: '습관 추적',         desc: '연간 완료 히트맵으로 꾸준함을 확인하세요.' },
  ai_chat:             { emoji: '✨', title: 'AI 어시스턴트',     desc: '자연어로 할 일을 추가하고 AI의 추천을 받아보세요.' },
  weekly_review:       { emoji: '🗓', title: '주간 회고',         desc: '한 주를 돌아보고 성과를 기록해 공유하세요.' },
  unlimited_projects:  { emoji: '📁', title: '무제한 프로젝트',   desc: '자유 플랜은 프로젝트 3개까지 사용할 수 있어요.' },
  advanced_recurring:  { emoji: '🔄', title: '고급 반복 설정',    desc: '매월·매년·특정 요일 반복 등 상세하게 설정하세요.' },
};

export const FREE_PROJECT_LIMIT = 3;

const STORAGE_KEY = 'subscription-plan';

function loadPlan(): Plan {
  if (typeof window === 'undefined') return 'free';
  return (localStorage.getItem(STORAGE_KEY) as Plan) ?? 'free';
}

interface PaywallState {
  open: boolean;
  feature: ProFeature | null;
}

interface SubscriptionContextValue {
  plan: Plan;
  isPro: boolean;
  showPaywall: (feature: ProFeature) => void;
  hidePaywall: () => void;
  paywallState: PaywallState;
  upgradeToPro: () => void;
  downgradeFree: () => void;
  canUse: (feature: ProFeature) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<Plan>(loadPlan);
  const [paywallState, setPaywallState] = useState<PaywallState>({ open: false, feature: null });

  const isPro = plan === 'pro';

  const canUse = useCallback((feature: ProFeature) => isPro, [isPro]);

  const showPaywall = useCallback((feature: ProFeature) => {
    setPaywallState({ open: true, feature });
  }, []);

  const hidePaywall = useCallback(() => {
    setPaywallState({ open: false, feature: null });
  }, []);

  const upgradeToPro = useCallback(() => {
    setPlan('pro');
    localStorage.setItem(STORAGE_KEY, 'pro');
    setPaywallState({ open: false, feature: null });
  }, []);

  const downgradeFree = useCallback(() => {
    setPlan('free');
    localStorage.setItem(STORAGE_KEY, 'free');
  }, []);

  return (
    <SubscriptionContext.Provider value={{ plan, isPro, showPaywall, hidePaywall, paywallState, upgradeToPro, downgradeFree, canUse }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
