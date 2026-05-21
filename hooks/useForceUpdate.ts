import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

const APP_ID = '6770458340';
const IOS_STORE_URL = 'https://apps.apple.com/kr/app/dodotodo/id6770458340';

function isVersionLessThan(current: string, min: string): boolean {
  const a = current.split('.').map(Number);
  const b = min.split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av !== bv) return av < bv;
  }
  return false;
}

export function useForceUpdate(currentVersion: string) {
  const [needsUpdate, setNeedsUpdate] = useState(false);

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'ios') return;

    async function check() {
      try {
        const [appInfo, versionRes, storeRes] = await Promise.all([
          App.getInfo(),
          fetch('https://todo-vito.vercel.app/version.json?t=' + Date.now()),
          fetch(`https://itunes.apple.com/lookup?id=${APP_ID}`),
        ]);

        // version.json의 minVersion 체크 (배포 스크립트로 제어)
        if (versionRes.ok) {
          const { minVersion } = await versionRes.json();
          if (minVersion && isVersionLessThan(appInfo.version, minVersion)) {
            setNeedsUpdate(true);
            return;
          }
        }

        // App Store 최신 버전과도 비교 (스토어 배포 후 자동 감지)
        const json = await storeRes.json();
        const storeVersion: string | undefined = json?.results?.[0]?.version;
        if (storeVersion && isVersionLessThan(appInfo.version, storeVersion)) {
          setNeedsUpdate(true);
        }
      } catch {}
    }

    check();
  }, [currentVersion]);

  return { needsUpdate, storeUrl: IOS_STORE_URL };
}
