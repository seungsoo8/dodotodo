'use client';

import { useState } from 'react';
import { Check, Crown, Zap } from 'lucide-react';
import { useSubscription, PRO_FEATURE_META, ProFeature, FREE_PROJECT_LIMIT } from '@/contexts/SubscriptionContext';

type PricingPeriod = 'monthly' | 'yearly' | 'lifetime';

const PRICING: Record<PricingPeriod, { label: string; price: string; sub: string; badge?: string }> = {
  monthly:  { label: '월간',    price: '₩4,400',  sub: '매월 결제',                badge: undefined },
  yearly:   { label: '연간',    price: '₩29,000', sub: '월 ₩2,417 · 45% 절약',    badge: '인기' },
  lifetime: { label: '평생',    price: '₩66,000', sub: '한 번만 결제, 영구 이용',  badge: '최고 혜택' },
};

const FREE_FEATURES = [
  { label: '오늘 뷰 · 목록 뷰' },
  { label: '할 일 무제한' },
  { label: `프로젝트 ${FREE_PROJECT_LIMIT}개` },
  { label: '반복 설정 (매일·매주)' },
  { label: '기본 알림' },
  { label: '포모도로 타이머' },
  { label: '전체 검색' },
];

const PRO_FEATURE_LIST: ProFeature[] = [
  'calendar', 'analytics', 'matrix', 'kanban', 'habit',
  'ai_chat', 'weekly_review', 'unlimited_projects', 'advanced_recurring',
];

export default function PlanView() {
  const { isPro, plan, upgradeToPro, downgradeFree } = useSubscription();
  const [period, setPeriod] = useState<PricingPeriod>('yearly');

  const pricing = PRICING[period];

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-20 md:pb-6">

      {/* 현재 플랜 뱃지 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>플랜 관리</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            현재 플랜: <span style={{ color: isPro ? '#f59e0b' : 'var(--muted)', fontWeight: 600 }}>
              {isPro ? '✨ PRO' : '무료'}
            </span>
          </p>
        </div>
        {isPro && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}
          >
            <Crown className="w-3.5 h-3.5" />
            PRO 활성
          </div>
        )}
      </div>

      {!isPro ? (
        <>
          {/* 기간 선택 탭 */}
          <div
            className="flex rounded-xl p-1 mb-5"
            style={{ background: 'var(--border)' }}
          >
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
                  <span
                    className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-white"
                    style={{ background: 'var(--accent)', fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap' }}
                  >
                    {PRICING[p].badge}
                  </span>
                )}
                {PRICING[p].label}
              </button>
            ))}
          </div>

          {/* 가격 카드 */}
          <div
            className="rounded-2xl p-5 mb-5 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(129,140,248,0.06) 100%)',
              border: '1.5px solid rgba(99,102,241,0.25)',
            }}
          >
            <div className="flex items-baseline justify-center gap-1 mb-1">
              <span className="text-4xl font-bold" style={{ color: 'var(--text)' }}>{pricing.price}</span>
              {period !== 'lifetime' && (
                <span className="text-sm" style={{ color: 'var(--muted)' }}>
                  {period === 'monthly' ? '/월' : '/년'}
                </span>
              )}
            </div>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>{pricing.sub}</p>
          </div>

          {/* PRO 기능 목록 */}
          <div
            className="rounded-2xl p-4 mb-5"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
              PRO 전용 기능
            </p>
            <div className="flex flex-col gap-2.5">
              {PRO_FEATURE_LIST.map(f => {
                const m = PRO_FEATURE_META[f];
                return (
                  <div key={f} className="flex items-center gap-3">
                    <span className="text-base w-6 text-center flex-shrink-0">{m.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{m.title}</p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>{m.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 무료 포함 기능 */}
          <div
            className="rounded-2xl p-4 mb-6"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
              무료 플랜 포함
            </p>
            <div className="flex flex-col gap-2">
              {FREE_FEATURES.map(f => (
                <div key={f.label} className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--success)' }} />
                  <span className="text-sm" style={{ color: 'var(--text)' }}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={upgradeToPro}
            className="w-full py-4 rounded-2xl text-sm font-bold text-white transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, var(--accent) 0%, #818cf8 100%)',
              boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
            }}
          >
            <span className="flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" />
              {pricing.label} PRO 시작하기
            </span>
          </button>
          <p className="text-center text-xs mt-2" style={{ color: 'var(--muted)' }}>
            언제든지 해지 가능 · 7일 환불 보장
          </p>
        </>
      ) : (
        /* PRO 활성 상태 */
        <div className="flex flex-col gap-4">
          <div
            className="rounded-2xl p-5 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(251,191,36,0.06) 100%)',
              border: '1.5px solid rgba(245,158,11,0.3)',
            }}
          >
            <div className="text-4xl mb-3">👑</div>
            <p className="font-bold text-lg mb-1" style={{ color: 'var(--text)' }}>PRO 플랜 이용 중</p>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>모든 기능을 제한 없이 사용할 수 있어요.</p>
          </div>

          <div
            className="rounded-2xl p-4"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
              사용 가능한 기능
            </p>
            <div className="flex flex-col gap-2.5">
              {PRO_FEATURE_LIST.map(f => {
                const m = PRO_FEATURE_META[f];
                return (
                  <div key={f} className="flex items-center gap-3">
                    <span className="text-base w-6 text-center flex-shrink-0">{m.emoji}</span>
                    <span className="text-sm font-medium flex-1" style={{ color: 'var(--text)' }}>{m.title}</span>
                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--success)' }} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* 개발용: 무료로 다운그레이드 */}
          <button
            onClick={downgradeFree}
            className="w-full py-2.5 rounded-xl text-xs font-medium mt-2"
            style={{ color: 'var(--muted)', background: 'var(--border)' }}
          >
            무료 플랜으로 전환 (테스트용)
          </button>
        </div>
      )}
    </div>
  );
}
