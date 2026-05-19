import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

const POLL_INTERVAL = 5 * 60 * 1000;

export function useVersionCheck(currentVersion: string): boolean {
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;

    async function check() {
      try {
        const res = await fetch('/version.json?t=' + Date.now());
        if (!res.ok) return;
        const { version } = await res.json();
        if (version && version !== currentVersion) setHasUpdate(true);
      } catch {}
    }

    const timer = setInterval(check, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [currentVersion]);

  return hasUpdate;
}
