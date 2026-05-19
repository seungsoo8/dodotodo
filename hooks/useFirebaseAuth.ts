'use client';

import { useAuth } from '@/contexts/AuthContext';

// AuthContext로 통합 — 기존 호출부 호환을 위해 firebaseUser/authReady 형태로 re-export
export function useFirebaseAuth() {
  const { user, loading } = useAuth();
  return { firebaseUser: user, authReady: !loading };
}
