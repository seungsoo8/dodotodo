'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const { user, loading, signInWithGoogle, signInWithApple } = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);
  const [signingInApple, setSigningInApple] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(0);
  const [deletedNotice, setDeletedNotice] = useState(false);

  useEffect(() => {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('account_deleted')) {
      sessionStorage.removeItem('account_deleted');
      setDeletedNotice(true);
      setTimeout(() => setDeletedNotice(false), 5000);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => setHighlight(h => (h + 1) % 3), 2200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (user && typeof window !== 'undefined' && window.location.pathname !== '/') {
      router.replace('/');
    }
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div
          className="w-7 h-7 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  function handleAuthError(e: unknown, setLoading: (v: boolean) => void) {
    const code = (e as { code?: string }).code ?? '';
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[Login] auth error code:', code, 'msg:', msg, 'full:', e);
    if (msg.includes('cancelled') || msg.includes('canceled') || msg.includes('dismissed') || code === 'auth/popup-closed-by-user') {
      // 취소 — 에러 표시 안 함
    } else if (code === 'auth/unauthorized-domain') {
      setError('이 도메인이 Firebase에 등록되어 있지 않습니다.');
    } else if (code === 'auth/popup-blocked') {
      setError('팝업이 차단됐습니다. 브라우저 팝업 차단을 해제하고 다시 시도해 주세요.');
    } else {
      setError(`로그인에 실패했습니다. (${code || msg})`);
    }
    setLoading(false);
  }

  async function handleSignIn() {
    setSigningIn(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      handleAuthError(e, setSigningIn);
    }
  }

  async function handleAppleSignIn() {
    setSigningInApple(true);
    setError(null);
    try {
      await signInWithApple();
    } catch (e) {
      handleAuthError(e, setSigningInApple);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      <style>{`
        @keyframes loginFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes loginGlow {
          0%, 100% { box-shadow: 0 20px 40px rgba(88,86,214,0.35), 0 0 0 0 rgba(88,86,214,0); }
          50% { box-shadow: 0 28px 56px rgba(88,86,214,0.5), 0 0 32px 8px rgba(88,86,214,0.18); }
        }
        @keyframes loginCheckDraw {
          0% { stroke-dashoffset: 40; opacity: 0; }
          30% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        .login-icon {
          animation: loginFloat 3.2s ease-in-out infinite, loginGlow 3.2s ease-in-out infinite;
        }
        .login-check {
          stroke-dasharray: 40;
          stroke-dashoffset: 40;
          animation: loginCheckDraw 0.8s cubic-bezier(0.22,1,0.36,1) 0.3s forwards;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
        .fade-up-1 { animation-delay: 0.1s; opacity: 0; }
        .fade-up-2 { animation-delay: 0.2s; opacity: 0; }
        .fade-up-3 { animation-delay: 0.3s; opacity: 0; }
        @keyframes featureIconFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-4px) scale(1.08); }
        }
        .feature-icon-active {
          animation: featureIconFloat 1.6s ease-in-out infinite;
        }
      `}</style>

      {/* ── 모바일 레이아웃 (768px 미만) ── */}
      <div
        className="md:hidden flex flex-col w-full"
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-8">
          <div
            className="login-icon w-20 h-20 rounded-[22px] flex items-center justify-center mb-5"
            style={{ background: 'linear-gradient(145deg, var(--accent), #7c7af8)' }}
          >
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" className="login-check" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: 'var(--text)' }}>DoDoTODO</h1>
          <p className="text-base text-center leading-relaxed" style={{ color: 'var(--muted)', maxWidth: 260 }}>
            할 일을 정리하고,<br />오늘 하루를 더 가볍게
          </p>
        </div>
        <div className="mx-4 mb-6 rounded-3xl p-6 space-y-3" style={{ background: 'var(--card)', boxShadow: 'var(--shadow-lg)' }}>
          {deletedNotice && (
            <div className="px-4 py-3 rounded-2xl flex items-center gap-2" style={{ background: 'rgba(16,185,129,0.1)', border: '1.5px solid rgba(16,185,129,0.3)' }}>
              <span className="text-base flex-shrink-0">✅</span>
              <p className="text-xs font-medium" style={{ color: '#10b981' }}>회원 탈퇴가 완료되었습니다</p>
            </div>
          )}
          <div className="text-center mb-1">
            <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>계속하려면 로그인하세요</p>
          </div>
          <LoginButton signingIn={signingIn} onClick={handleSignIn} />
          <AppleButton signingIn={signingInApple} onClick={handleAppleSignIn} />
          {error && <ErrorBox message={error} />}
          <p className="text-xs text-center pt-1" style={{ color: 'var(--muted)', opacity: 0.7 }}>
            로그인 시 모든 기기에서 동기화됩니다
          </p>
        </div>
      </div>

      {/* ── PC 웹 레이아웃 (768px 이상) ── */}
      <div className="hidden md:flex w-full">

        {/* 왼쪽: 브랜딩 */}
        <div
          className="flex flex-col justify-between w-1/2 p-16"
          style={{ background: 'linear-gradient(145deg, var(--accent) 0%, #7c7af8 100%)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">DoDoTODO</span>
          </div>

          <div>
            <h1 className="text-5xl font-bold text-white leading-tight mb-4 tracking-tight">
              할 일을 정리하고,<br />오늘 하루를<br />더 가볍게
            </h1>
            <p className="text-white text-lg leading-relaxed" style={{ opacity: 0.85 }}>
              모든 기기에서 실시간 동기화되는<br />나만의 스마트 할 일 관리
            </p>

            <div className="mt-12 space-y-3">
              {[
                { icon: '⚡', title: '실시간 동기화', desc: '앱, 웹 어디서든 즉시 반영' },
                { icon: '🍅', title: '포모도로 타이머', desc: '집중력을 높이는 시간 관리' },
                { icon: '📊', title: '생산성 분석', desc: '완료 추이와 스트릭 통계' },
              ].map((f, i) => {
                const active = highlight === i;
                return (
                  <div
                    key={f.title}
                    className={`flex items-center gap-4 fade-up fade-up-${i + 1} rounded-2xl`}
                    style={{
                      padding: '10px 12px',
                      background: active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)',
                      transform: active ? 'scale(1.03)' : 'scale(1)',
                      opacity: active ? 1 : 0.65,
                      transition: 'all 0.45s cubic-bezier(0.22,1,0.36,1)',
                      boxShadow: active ? '0 4px 20px rgba(0,0,0,0.12)' : 'none',
                    }}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${active ? 'feature-icon-active' : ''}`}
                      style={{
                        background: active ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.15)',
                        transition: 'background 0.45s ease',
                      }}
                    >
                      {f.icon}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{f.title}</p>
                      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            © 2026 DoDoTodo. All rights reserved.
          </p>
        </div>

        {/* 오른쪽: 로그인 폼 */}
        <div className="flex flex-col items-center justify-center w-1/2 p-16">
          <div className="w-full" style={{ maxWidth: 400 }}>
            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight mb-2" style={{ color: 'var(--text)' }}>
                시작하기
              </h2>
              <p className="text-base" style={{ color: 'var(--muted)' }}>
                Google 계정으로 바로 로그인하세요
              </p>
            </div>

            {deletedNotice && (
              <div className="mb-4 px-4 py-3 rounded-2xl flex items-center gap-2" style={{ background: 'rgba(16,185,129,0.1)', border: '1.5px solid rgba(16,185,129,0.3)' }}>
                <span className="text-base flex-shrink-0">✅</span>
                <p className="text-sm font-medium" style={{ color: '#10b981' }}>회원 탈퇴가 완료되었습니다</p>
              </div>
            )}
            <LoginButton signingIn={signingIn} onClick={handleSignIn} pc />
            <div className="mt-3">
              <AppleButton signingIn={signingInApple} onClick={handleAppleSignIn} pc />
            </div>

            {error && <div className="mt-4"><ErrorBox message={error} /></div>}

            <div className="flex items-center gap-3 mt-8">
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              <span className="text-xs" style={{ color: 'var(--muted)' }}>안전하게 보호됩니다</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </div>

            <p className="text-xs text-center mt-6 leading-relaxed" style={{ color: 'var(--muted)', opacity: 0.7 }}>
              로그인하면 모든 기기에서 데이터가 자동으로<br />동기화됩니다. 별도 회원가입이 필요 없어요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginButton({ signingIn, onClick, pc }: { signingIn: boolean; onClick: () => void; pc?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={signingIn}
      className="w-full flex items-center justify-center gap-3 font-semibold transition-all disabled:opacity-60"
      style={{
        padding: pc ? '14px 24px' : '16px 24px',
        borderRadius: pc ? 12 : 16,
        fontSize: pc ? 15 : 14,
        background: signingIn ? 'var(--border)' : 'var(--text)',
        color: 'var(--card)',
        boxShadow: pc ? 'none' : 'var(--shadow-sm)',
        border: pc ? '1px solid var(--border)' : 'none',
      }}
    >
      {signingIn ? (
        <>
          <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--card)', borderTopColor: 'transparent' }} />
          <span>로그인 중...</span>
        </>
      ) : (
        <>
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google로 계속하기
        </>
      )}
    </button>
  );
}

function AppleButton({ signingIn, onClick, pc }: { signingIn: boolean; onClick: () => void; pc?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={signingIn}
      className="w-full flex items-center justify-center gap-3 font-semibold transition-all disabled:opacity-60"
      style={{
        padding: pc ? '14px 24px' : '16px 24px',
        borderRadius: pc ? 12 : 16,
        fontSize: pc ? 15 : 14,
        background: '#000',
        color: '#fff',
        boxShadow: pc ? 'none' : 'var(--shadow-sm)',
        border: pc ? '1px solid #000' : 'none',
      }}
    >
      {signingIn ? (
        <>
          <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} />
          <span>로그인 중...</span>
        </>
      ) : (
        <>
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="white">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          Apple로 계속하기
        </>
      )}
    </button>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="text-sm px-4 py-3 rounded-xl" style={{ background: 'rgba(255,59,48,0.08)', color: 'var(--destructive)' }}>
      {message}
    </div>
  );
}
