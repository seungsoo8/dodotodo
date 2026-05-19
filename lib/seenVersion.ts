import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const KEY = 'dodotodo_seen_version';

export async function getSeenVersion(): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    const { value } = await Preferences.get({ key: KEY }).catch(() => ({ value: null }));
    return value;
  }
  try { return localStorage.getItem(KEY); } catch { return null; }
}

export async function markVersionSeen(version: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Preferences.set({ key: KEY, value: version }).catch(() => {});
  } else {
    try { localStorage.setItem(KEY, version); } catch {}
  }
}
