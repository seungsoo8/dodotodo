import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, getFirestore, persistentLocalCache, memoryLocalCache, terminate } from 'firebase/firestore';
import { getAuth, initializeAuth, browserLocalPersistence, browserPopupRedirectResolver, indexedDBLocalPersistence } from 'firebase/auth';
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

// WKWebView에서 Firestore 내부 assertion 실패 시 terminate + reload로 복구
// "Target ID already exists" 오류는 WKWebView가 네트워크를 끊었다 재연결할 때 발생하는 Firebase SDK 버그
if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
  let recovering = false;
  window.addEventListener('unhandledrejection', async (event) => {
    const msg: string = event.reason?.message ?? '';
    if (!recovering && (msg.includes('INTERNAL ASSERTION FAILED') || msg.includes('Target ID already exists'))) {
      recovering = true;
      event.preventDefault();
      try { await terminate(db); } catch { /* ignore */ }
      window.location.reload();
    }
  });
}

export { db };

export const firebaseAuth = (() => {
  try {
    if (Capacitor.isNativePlatform()) {
      return initializeAuth(app, { persistence: indexedDBLocalPersistence });
    }
    return initializeAuth(app, { persistence: browserLocalPersistence, popupRedirectResolver: browserPopupRedirectResolver });
  } catch {
    return getAuth(app);
  }
})();
