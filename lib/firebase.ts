import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, getFirestore, persistentLocalCache, memoryLocalCache } from 'firebase/firestore';
import { getAuth, initializeAuth, browserLocalPersistence, browserPopupRedirectResolver, inMemoryPersistence } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// WKWebView(iOS)에서 gRPC/WebSocket 연결 실패(DownloadFailed) 방지: long-polling 강제 사용
// 웹 브라우저에서는 IndexedDB 기반 persistentLocalCache로 오프라인 지원
const db = (() => {
  try {
    const isNative = Capacitor.isNativePlatform();
    const isBrowser = typeof window !== 'undefined';
    return initializeFirestore(app, {
      ...(isNative ? { experimentalForceLongPolling: true } : {}),
      localCache: isBrowser && !isNative ? persistentLocalCache() : memoryLocalCache(),
    });
  } catch {
    return getFirestore(app);
  }
})();

export { db };

// Native(WKWebView): inMemoryPersistence로 signInWithCredential 즉시 완료
// (localStorage 쓰기가 WKWebView에서 blocking되어 hang 발생하던 문제 해결)
// 콜드 스타트 시 AuthContext에서 getIdToken → signInWithCredential로 JS 세션 재복구
export const firebaseAuth = (() => {
  try {
    if (Capacitor.isNativePlatform()) {
      return initializeAuth(app, { persistence: inMemoryPersistence });
    }
    return initializeAuth(app, { persistence: browserLocalPersistence, popupRedirectResolver: browserPopupRedirectResolver });
  } catch {
    return getAuth(app);
  }
})();
