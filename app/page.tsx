'use client';

import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import AuthenticatedHome from '@/components/AuthenticatedHome';
import LoginPage from '@/app/login/page';

const isNative = Capacitor.isNativePlatform();

export default function Home() {
  const { firebaseUser, authReady } = useFirebaseAuth();
  const [minElapsed, setMinElapsed] = useState(!isNative);

  useEffect(() => {
    if (!isNative) return;
    const t = setTimeout(() => setMinElapsed(true), 600);
    return () => clearTimeout(t);
  }, []);

  const isLoading = !authReady || !minElapsed;

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-6"
        style={{ background: 'var(--bg)' }}
      >
        {/* App icon */}
        <div
          className="w-24 h-24 rounded-[28px] flex items-center justify-center"
          style={{
            background: 'linear-gradient(145deg, var(--accent), #7c7af8)',
            boxShadow: '0 20px 48px rgba(88,86,214,0.4)',
          }}
        >
          <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* App name */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Plenio</h1>
          <p className="text-sm mt-1.5" style={{ color: 'var(--muted)' }}>오늘도 하나씩 해내봐요</p>
        </div>

        {/* Dot loader */}
        <div className="flex items-center gap-2">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: 'var(--accent)',
                animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>

        <style>{`
          @keyframes pulse {
            0%, 60%, 100% { transform: scale(0.5); opacity: 0.3; }
            30% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  if (!firebaseUser) {
    return <LoginPage />;
  }

  return <AuthenticatedHome firebaseUser={firebaseUser} />;
}
