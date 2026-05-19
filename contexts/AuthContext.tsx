'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  deleteUser,
  User,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithCredential,
} from 'firebase/auth';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { firebaseAuth, db } from '@/lib/firebase';
import { upsertUserProfile } from '@/lib/userProfile';
import { doc, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const PROVIDER_KEY = 'dodotodo_auth_provider';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 웹: 표준 Firebase auth state 리스너
    if (!Capacitor.isNativePlatform()) {
      return onAuthStateChanged(firebaseAuth, u => {
        setUser(u);
        setLoading(false);
        if (u) upsertUserProfile(u);
      });
    }

    // 네이티브: getCurrentUser로 즉시 결정, JS SDK user fire만 추적 (null fire 무시)
    let authListenerRef: { remove: () => void } | null = null;

    let resolveFirstUser: ((u: User | null) => void) | null = null;
    const firstUserPromise = new Promise<User | null>(res => {
      resolveFirstUser = res;
    });

    const unsub = onAuthStateChanged(firebaseAuth, u => {
      if (u) {
        if (resolveFirstUser) { resolveFirstUser(u); resolveFirstUser = null; }
        setUser(u);
        setLoading(false);
        upsertUserProfile(u);
      }
    });

    FirebaseAuthentication.addListener('authStateChange', async change => {
      if (!change.user) {
        setUser(null);
        setLoading(false);
      }
    }).then(l => { authListenerRef = l; });

    FirebaseAuthentication.getCurrentUser().then(async ({ user: nativeUser }) => {
      if (!nativeUser) {
        if (resolveFirstUser) { resolveFirstUser(null); resolveFirstUser = null; }
        setUser(null);
        setLoading(false);
        return;
      }

      // 저장된 provider 확인
      const { value: storedProvider } = await Preferences.get({ key: PROVIDER_KEY }).catch(() => ({ value: null }));

      if (storedProvider === 'apple.com') {
        // Apple 콜드 스타트: skipNativeAuth:true 로 credential만 받아 JS SDK 인증
        try {
          const appleResult = await FirebaseAuthentication.signInWithApple({
            skipNativeAuth: true,
          });
          if (appleResult.credential?.idToken) {
            const provider = new OAuthProvider('apple.com');
            const credential = provider.credential({
              idToken: appleResult.credential.idToken,
              rawNonce: appleResult.credential.nonce ?? undefined,
            });
            await signInWithCredential(firebaseAuth, credential);
          } else {
            setUser(null);
            setLoading(false);
          }
        } catch {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      // 기본 Google 콜드 스타트
      try {
        const { token: idToken } = await FirebaseAuthentication.getIdToken({ forceRefresh: false });
        const credential = GoogleAuthProvider.credential(idToken);
        const credentialPromise = signInWithCredential(firebaseAuth, credential)
          .catch(e => { console.error('[Auth] signInWithCredential:', (e as any)?.code); return null; });

        const jsUser = await Promise.race([
          firstUserPromise,
          new Promise<null>(res => setTimeout(() => res(null), 10000)),
        ]);
        if (!jsUser) {
          console.warn('[Auth] cold-start: timeout → require re-login');
          setUser(null);
          setLoading(false);
        }
        credentialPromise; // suppress unused warning
      } catch (e) {
        console.error('[Auth] cold-start getIdToken failed:', e);
        setUser(null);
        setLoading(false);
      }
    }).catch(() => {
      setUser(null);
      setLoading(false);
    });

    return () => {
      unsub();
      authListenerRef?.remove();
    };
  }, []);

  async function signInWithGoogle() {
    if (Capacitor.isNativePlatform()) {
      const result = await FirebaseAuthentication.signInWithGoogle();

      if (result.credential?.idToken) {
        const credential = GoogleAuthProvider.credential(
          result.credential.idToken,
          result.credential.accessToken ?? undefined,
        );

        const credentialPromise = signInWithCredential(firebaseAuth, credential)
          .catch(e => { console.error('[Auth] signInWithCredential:', (e as any)?.code, (e as any)?.message); return null; });

        const jsUserCred = await Promise.race([
          credentialPromise,
          new Promise<null>(res => setTimeout(() => res(null), 8000)),
        ]);

        if (jsUserCred) {
          setUser(jsUserCred.user);
        } else if (result.user) {
          setUser(result.user as unknown as User);
        } else {
          throw new Error('로그인에 실패했습니다. 네트워크를 확인하고 다시 시도해 주세요.');
        }
      } else if (result.user) {
        setUser(result.user as unknown as User);
      } else {
        throw new Error('로그인 정보를 가져올 수 없어요.');
      }

      await Preferences.set({ key: PROVIDER_KEY, value: 'google.com' }).catch(() => {});
    } else {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(firebaseAuth, provider);
    }
  }

  async function signInWithApple() {
    if (Capacitor.isNativePlatform()) {
      // skipNativeAuth:true — credential만 받아 JS SDK로 직접 인증
      const result = await FirebaseAuthentication.signInWithApple({
        skipNativeAuth: true,
      });

      if (!result.credential?.idToken) {
        throw new Error('Apple 로그인 정보를 가져올 수 없어요.');
      }

      // Apple JWT payload 디코딩 — nonce 클레임 확인
      let jwtNonce: string | undefined;
      try {
        const parts = result.credential.idToken.split('.');
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        jwtNonce = payload.nonce;
        console.log('[Auth] Apple JWT aud:', payload.aud, 'nonce present:', !!jwtNonce);
        console.log('[Auth] rawNonce from plugin:', result.credential.nonce ? 'present' : 'MISSING');
      } catch (e) {
        console.warn('[Auth] JWT decode failed', e);
      }

      // JWT에 nonce가 있는데 plugin이 rawNonce를 안 줬으면 signIn 불가
      if (jwtNonce && !result.credential.nonce) {
        throw Object.assign(new Error('Apple 로그인: nonce 불일치 (plugin 버전 확인 필요)'), { code: 'auth/missing-nonce' });
      }

      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken: result.credential.idToken,
        rawNonce: result.credential.nonce ?? undefined,
      });

      const userCred = await signInWithCredential(firebaseAuth, credential);
      setUser(userCred.user);
      await Preferences.set({ key: PROVIDER_KEY, value: 'apple.com' }).catch(() => {});
    } else {
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      await signInWithPopup(firebaseAuth, provider);
    }
  }

  async function signOut() {
    if (Capacitor.isNativePlatform()) {
      await FirebaseAuthentication.signOut();
    }
    await firebaseSignOut(firebaseAuth);
    setUser(null);
    router.replace('/login');
  }

  async function deleteAccount() {
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) return;
    const uid = currentUser.uid;

    // 1. Firestore 데이터 먼저 삭제
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (e) {
      console.error('[Auth] deleteDoc failed:', e);
    }

    // 2. Firebase Auth 계정 삭제 (세션이 오래됐으면 실패 가능)
    try {
      await deleteUser(currentUser);
    } catch (e) {
      const code = (e as { code?: string }).code ?? '';
      // requires-recent-login이면 데이터는 이미 삭제됐으므로 그냥 로그아웃
      if (code !== 'auth/requires-recent-login') {
        console.error('[Auth] deleteUser failed:', e);
      }
    }

    // 3. 로그아웃
    if (Capacitor.isNativePlatform()) {
      await FirebaseAuthentication.signOut().catch(() => {});
      await Preferences.remove({ key: PROVIDER_KEY }).catch(() => {});
    }
    await firebaseSignOut(firebaseAuth).catch(() => {});
    setUser(null);
    sessionStorage.setItem('account_deleted', '1');
    router.replace('/login');
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithApple, signOut, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
