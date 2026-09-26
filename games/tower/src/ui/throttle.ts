/** 같은 이름의 요청이 최소 간격(초) 안에 다시 통과하지 못하게 한다 */
export class Throttle {
  private last = new Map<string, number>();
  private defaultGap: number;
  private gaps: Record<string, number>;

  constructor(defaultGap: number, gaps: Record<string, number> = {}) {
    this.defaultGap = defaultGap;
    this.gaps = gaps;
  }

  allow(key: string, now: number): boolean {
    const gap = this.gaps[key] ?? this.defaultGap;
    const prev = this.last.get(key);
    if (prev !== undefined && now - prev < gap - 1e-9) return false;
    this.last.set(key, now);
    return true;
  }
}
