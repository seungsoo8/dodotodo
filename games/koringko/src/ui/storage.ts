/** 브라우저 저장소 (막혀 있으면 메모리에만) */
export interface StorageLike {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

const mem = new Map<string, string>();

export const store: StorageLike & { removeItem(k: string): void } = {
  getItem(k) {
    try {
      return localStorage.getItem(k);
    } catch {
      return mem.get(k) ?? null;
    }
  },
  setItem(k, v) {
    mem.set(k, v);
    try {
      localStorage.setItem(k, v);
    } catch {
      /* 저장소가 막혀 있다 */
    }
  },
  removeItem(k) {
    mem.delete(k);
    try {
      localStorage.removeItem(k);
    } catch {
      /* 저장소가 막혀 있다 */
    }
  },
};
