'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Capacitor } from '@capacitor/core';

export type Plan = 'free' | 'pro';
export type PricingPeriod = 'monthly' | 'yearly' | 'lifetime';

export type ProFeature =
  | 'calendar' | 'analytics' | 'matrix' | 'kanban' | 'habit'
  | 'ai_chat' | 'weekly_review' | 'unlimited_projects' | 'advanced_recurring';

export const PRO_FEATURE_META: Record<ProFeature, { title: string; desc: string; emoji: string }> = {
  calendar:           { emoji: '📅', title: '캘린더 뷰',        desc: '날짜별로 할 일을 한눈에 보고 일정 기간을 시각화하세요.' },
  analytics:          { emoji: '📊', title: '상세 분석',         desc: '완료 히트맵, 스트릭, 우선순위별 통계로 생산성을 파악하세요.' },
  matrix:             { emoji: '🎯', title: '아이젠하워 매트릭스', desc: '긴급성과 중요도로 할 일을 4사분면에 정리하세요.' },
  kanban:             { emoji: '📋', title: '칸반 보드',          desc: '카드를 드래그해 진행 상태를 시각적으로 관리하세요.' },
  habit:              { emoji: '🔥', title: '습관 추적',          desc: '연간 완료 히트맵으로 꾸준함을 확인하세요.' },
  ai_chat:            { emoji: '✨', title: 'AI 어시스턴트',      desc: '자연어로 할 일을 추가하고 AI의 추천을 받아보세요.' },
  weekly_review:      { emoji: '🗓', title: '주간 회고',          desc: '한 주를 돌아보고 성과를 기록해 공유하세요.' },
  unlimited_projects: { emoji: '📁', title: '무제한 프로젝트',    desc: '자유 플랜은 프로젝트 3개까지 사용할 수 있어요.' },
  advanced_recurring: { emoji: '🔄', title: '고급 반복 설정',     desc: '매월·매년·특정 요일 반복 등 상세하게 설정하세요.' },
};

export const FREE_PROJECT_LIMIT = 3;

const PERIOD_TO_PACKAGE: Record<PricingPeriod, string> = {
  monthly:  '$rc_monthly',
  yearly:   '$rc_annual',
  lifetime: '$rc_lifetime',
};

interface PaywallState { open: boolean; feature: ProFeature | null; }

interface SubscriptionContextValue {
  plan: Plan;
  isPro: boolean;
  loaded: boolean;
  purchasing: boolean;
  showPaywall: (feature: ProFeature) => void;
  hidePaywall: () => void;
  paywallState: PaywallState;
  purchasePackage: (period: PricingPeriod) => Promise<void>;
  restorePurchases: () => Promise<void>;
  upgradeToPro: () => Promise<void>;
  downgradeFree: () => Promise<void>;
  canUse: (feature: ProFeature) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

async function syncProToFirebase(uid: string, grantedBy: 'revenuecat' | 'self') {
  await updateDoc(doc(db, 'users', uid), {
    plan: 'pro',
    planGrantedBy: grantedBy,
    planGrantedAt: serverTimestamp(),
  }).catch(console.error);
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<Plan>('free');
  const [loaded, setLoaded] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [paywallState, setPaywallState] = useState<PaywallState>({ open: false, feature: null });

  // Firebase 플랜 실시간 구독
  useEffect(() => {
    if (!user) { setPlan('free'); setLoaded(true); return; }
    const unsub = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => { setPlan(snap.data()?.plan === 'pro' ? 'pro' : 'free'); setLoaded(true); },
      (err) => { console.error('[Subscription]', err); setLoaded(true); }
    );
    return unsub;
  }, [user?.uid]);

  // RevenueCat 초기화 (네이티브 앱 전용)
  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return;

    let callbackId: string | null = null;
    const uid = user.uid;

    (async () => {
      try {
        const { Purchases } = await import('@revenuecat/purchases-capacitor');
        await Purchases.configure({
          apiKey: process.env.NEXT_PUBLIC_REVENUECAT_IOS_KEY!,
          appUserID: uid,
        });

        // 기존 구독 상태 확인
        const result = await Purchases.getCustomerInfo();
        if (result.customerInfo.entitlements.active['pro']) {
          setPlan('pro');
          await syncProToFirebase(uid, 'revenuecat');
        }

        // 구독 상태 변경 리스너 (콜백은 CustomerInfo 직접 수신)
        callbackId = await Purchases.addCustomerInfoUpdateListener(async (customerInfo) => {
          const hasPro = !!customerInfo.entitlements.active['pro'];
          setPlan(hasPro ? 'pro' : 'free');
          if (hasPro) await syncProToFirebase(uid, 'revenuecat');
        });
      } catch (e) {
        console.error('[RevenueCat] init failed:', e);
      }
    })();

    return () => {
      if (!callbackId) return;
      (async () => {
        const { Purchases } = await import('@revenuecat/purchases-capacitor');
        Purchases.removeCustomerInfoUpdateListener({ listenerToRemove: callbackId! }).catch(() => {});
      })();
    };
  }, [user?.uid]);

  const isPro = plan === 'pro';
  const canUse = useCallback((feature: ProFeature) => isPro, [isPro]);

  const showPaywall = useCallback((feature: ProFeature) => setPaywallState({ open: true, feature }), []);
  const hidePaywall = useCallback(() => setPaywallState({ open: false, feature: null }), []);

  // 실제 인앱 결제 (iOS)
  const purchasePackage = useCallback(async (period: PricingPeriod) => {
    if (!user) return;

    // 웹: 아직 Stripe 미연동 → mock
    if (!Capacitor.isNativePlatform()) {
      await upgradeToPro();
      return;
    }

    setPurchasing(true);
    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages.find(
        (p: import('@revenuecat/purchases-capacitor').PurchasesPackage) => p.identifier === PERIOD_TO_PACKAGE[period]
      );
      if (!pkg) throw new Error('패키지를 찾을 수 없어요.');

      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
      if (customerInfo.entitlements.active['pro']) {
        setPlan('pro');
        setPaywallState({ open: false, feature: null });
        await syncProToFirebase(user.uid, 'revenuecat');
      }
    } catch (e: unknown) {
      const err = e as { userCancelled?: boolean; message?: string };
      if (!err.userCancelled) console.error('[RevenueCat] purchase failed:', e);
    } finally {
      setPurchasing(false);
    }
  }, [user]);

  // 구매 복원
  const restorePurchases = useCallback(async () => {
    if (!user || !Capacitor.isNativePlatform()) return;
    setPurchasing(true);
    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      const { customerInfo } = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active['pro']) {
        setPlan('pro');
        await syncProToFirebase(user.uid, 'revenuecat');
      }
    } catch (e) {
      console.error('[RevenueCat] restore failed:', e);
    } finally {
      setPurchasing(false);
    }
  }, [user]);

  // 테스트/관리자용 mock (웹 전용)
  const upgradeToPro = useCallback(async () => {
    setPlan('pro');
    setPaywallState({ open: false, feature: null });
    if (user) await syncProToFirebase(user.uid, 'self');
  }, [user]);

  const downgradeFree = useCallback(async () => {
    setPlan('free');
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), {
        plan: 'free', planGrantedBy: null, planGrantedAt: null,
      }).catch(console.error);
    }
  }, [user]);

  return (
    <SubscriptionContext.Provider value={{
      plan, isPro, loaded, purchasing,
      showPaywall, hidePaywall, paywallState,
      purchasePackage, restorePurchases, upgradeToPro, downgradeFree, canUse,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
