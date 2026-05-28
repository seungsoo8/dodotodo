'use client';

import { useSubscription, PRO_FEATURE_META, ProFeature } from '@/contexts/SubscriptionContext';

const HIGHLIGHT_FEATURES: ProFeature[] = ['ai_chat', 'analytics', 'matrix', 'kanban', 'habit', 'calendar'];

export default function PaywallModal() {
  const { paywallState, hidePaywall, upgradeToPro } = useSubscription();
  const { open, feature } = paywallState;

  if (!open || !feature) return null;

  const meta = PRO_FEATURE_META[feature];

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
        onClick={hidePaywall}
      />

      {/* 모달 */}
      <div
        className="fixed z-50 left-1/2 bottom-0 md:bottom-auto md:top-1/2 w-full md:w-auto"
        style={{
          transform: 'translateX(-50%) translateY(0)',
          maxWidth: 420,
        }}
      >
        <div
          className="rounded-t-3xl md:rounded-3xl p-6 flex flex-col gap-5"
          style={{
            background: 'var(--card)',
            boxShadow: '0 -8px 48px rgba(0,0,0,0.18)',
            paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
          }}
        >
          {/* 핸들 (모바일) */}
          <div className="w-10 h-1 rounded-full mx-auto md:hidden" style={{ background: 'var(--border)' }} />

          {/* 트리거 기능 하이라이트 */}
          <div className="flex flex-col items-center text-center gap-2">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-1"
              style={{ background: 'var(--accent-muted)' }}
            >
              {meta.emoji}
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
              {meta.title}
            </h2>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {meta.desc}
            </p>
          </div>

          {/* PRO 포함 기능 목록 */}
          <div className="rounded-2xl p-4 flex flex-col gap-2.5" style={{ background: 'var(--bg)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>
              PRO에 포함된 기능
            </p>
            {HIGHLIGHT_FEATURES.map(f => {
              const m = PRO_FEATURE_META[f];
              const isThis = f === feature;
              return (
                <div key={f} className="flex items-center gap-3">
                  <span className="text-base w-6 text-center flex-shrink-0">{m.emoji}</span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: isThis ? 'var(--accent)' : 'var(--text)', fontWeight: isThis ? 700 : 500 }}
                  >
                    {m.title}
                  </span>
                  {isThis && (
                    <span
                      className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                      style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
                    >
                      이 기능
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* 가격 */}
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1 mb-1">
              <span className="text-3xl font-bold" style={{ color: 'var(--text)' }}>₩4,900</span>
              <span className="text-sm" style={{ color: 'var(--muted)' }}>/월</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              연간 구독 시 ₩29,900 · 평생 이용권 ₩69,900
            </p>
          </div>

          {/* CTA 버튼 */}
          <div className="flex flex-col gap-2">
            <button
              onClick={upgradeToPro}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, var(--accent) 0%, #818cf8 100%)',
                boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
              }}
            >
              ✨ PRO 시작하기
            </button>
            <button
              onClick={hidePaywall}
              className="w-full py-2.5 rounded-2xl text-sm font-medium"
              style={{ color: 'var(--muted)', background: 'transparent' }}
            >
              나중에 할게요
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
