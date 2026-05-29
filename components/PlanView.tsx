'use client';

import { useState } from 'react';
import { Check, Crown, Zap } from 'lucide-react';
import { useSubscription, PRO_FEATURE_META, FREE_PROJECT_LIMIT, PricingPeriod } from '@/contexts/SubscriptionContext';

const PRICING: Record<PricingPeriod, { label: string; price: string; sub: string; badge?: string }> = {
  monthly:  { label: '월간',  price: '₩4,400',  sub: '매월 결제' },
  yearly:   { label: '연간',  price: '₩29,000', sub: '월 ₩2,417 · 45% 절약', badge: '인기' },
  lifetime: { label: '평생',  price: '₩66,000', sub: '한 번만 결제, 영구 이용', badge: '최고 혜택' },
};

const KEY_FEATURES = [
  { emoji: '✨', label: 'AI 어시스턴트' },
  { emoji: '📅', label: '캘린더 뷰' },
  { emoji: '📊', label: '상세 분석' },
  { emoji: '🎯', label: '매트릭스' },
  { emoji: '📋', label: '칸반 보드' },
  { emoji: '🔥', label: '습관 추적' },
  { emoji: '📁', label: '무제한 프로젝트' },
  { emoji: '🔄', label: '고급 반복' },
];

export default function PlanView() {
  const { isPro, purchasePackage, restorePurchases, downgradeFree, purchasing } = useSubscription();
  const [period, setPeriod] = useState<PricingPeriod>('yearly');
  const pricing = PRICING[period];

  if (isPro) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="rounded-2xl p-6 text-center mb-4"
          style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(251,191,36,0.06) 100%)', border: '1.5px solid rgba(245,158,11,0.3)' }}>
          <div className="text-4xl mb-2">👑</div>
          <p className="font-bold text-lg mb-1" style={{ color: 'var(--text)' }}>PRO 플랜 이용 중</p>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>모든 기능을 제한 없이 사용할 수 있어요.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {KEY_FEATURES.map(f => (
            <div key={f.label} className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <span className="text-sm">{f.emoji}</span>
              <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>{f.label}</span>
              <Check className="w-3 h-3 ml-auto flex-shrink-0" style={{ color: 'var(--success)' }} />
            </div>
          ))}
        </div>
        <button onClick={downgradeFree} className="w-full py-2.5 rounded-xl text-xs font-medium"
          style={{ color: 'var(--muted)', background: 'var(--border)' }}>
          무료 플랜으로 전환 (테스트용)
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto w-full px-4 flex flex-col" style={{ height: '100%', paddingTop: 20, paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>

      {/* 헤더 */}
      <div className="text-center mb-4">
        <p className="text-lg font-bold" style={{ color: 'var(--text)' }}>Plenio PRO</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>더 강력하게, 제한 없이</p>
      </div>

      {/* 기간 탭 */}
      <div className="flex rounded-xl p-1 mb-4" style={{ background: 'var(--border)' }}>
        {(Object.keys(PRICING) as PricingPeriod[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className="relative flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: period === p ? 'var(--card)' : 'transparent',
              color: period === p ? 'var(--accent)' : 'var(--muted)',
              boxShadow: period === p ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {PRICING[p].badge && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-white"
                style={{ background: 'var(--accent)', fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap' }}>
                {PRICING[p].badge}
              </span>
            )}
            {PRICING[p].label}
          </button>
        ))}
      </div>

      {/* 가격 */}
      <div className="rounded-2xl px-4 py-3 mb-4 text-center"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(129,140,248,0.06) 100%)', border: '1.5px solid rgba(99,102,241,0.25)' }}>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-3xl font-bold" style={{ color: 'var(--text)' }}>{pricing.price}</span>
          {period !== 'lifetime' && (
            <span className="text-sm" style={{ color: 'var(--muted)' }}>{period === 'monthly' ? '/월' : '/년'}</span>
          )}
        </div>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{pricing.sub}</p>
      </div>

      {/* PRO 기능 2열 그리드 */}
      <div className="grid grid-cols-2 gap-2 mb-4 flex-1">
        {KEY_FEATURES.map(f => (
          <div key={f.label} className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <span className="text-sm flex-shrink-0">{f.emoji}</span>
            <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>{f.label}</span>
          </div>
        ))}
      </div>

      {/* 무료 포함 한 줄 요약 */}
      <p className="text-center text-xs mb-4" style={{ color: 'var(--muted)' }}>
        무료: 오늘·목록 뷰, 할 일 무제한, 프로젝트 {FREE_PROJECT_LIMIT}개, 기본 반복·알림·포모도로
      </p>

      {/* CTA */}
      <button
        onClick={() => purchasePackage(period)}
        disabled={purchasing}
        className="w-full py-4 rounded-2xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-60"
        style={{
          background: 'linear-gradient(135deg, var(--accent) 0%, #818cf8 100%)',
          boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
        }}
      >
        <span className="flex items-center justify-center gap-2">
          {purchasing ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : <Zap className="w-4 h-4" />}
          {purchasing ? '처리 중...' : `${pricing.label} PRO 시작하기`}
        </span>
      </button>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs" style={{ color: 'var(--muted)' }}>언제든지 해지 가능 · 7일 환불 보장</p>
        <button onClick={restorePurchases} disabled={purchasing} className="text-xs underline" style={{ color: 'var(--muted)' }}>
          구매 복원
        </button>
      </div>
    </div>
  );
}
