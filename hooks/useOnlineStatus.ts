import { useEffect, useState } from 'react';

async function pingOnline(): Promise<boolean> {
  try {
    const r = await fetch('/favicon.ico', {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    return r.status < 500;
  } catch {
    return false;
  }
}

export function useOnlineStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let mounted = true;

    const verify = async () => {
      if (!navigator.onLine) {
        const actually = await pingOnline();
        if (mounted) setOnline(actually);
      } else {
        if (mounted) setOnline(true);
      }
    };

    verify();

    const goOnline = () => { if (mounted) setOnline(true); };
    const goOffline = () => verify();

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      mounted = false;
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return online;
}
