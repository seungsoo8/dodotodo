/**
 * 실패 대사 돌려 쓰기: 같은 실패를 거듭해도 같은 한 줄이 되풀이되지 않게 차례로 돌린다.
 * 두 번째 실패부터는 다른 동료가 한마디 거든다 (루루 놀림 → 보리 다독임 → 나비 귀띔, 말한 이는 빼고).
 */
import type { HeroId } from '../types.ts';
import type { Cmd } from './types.ts';

export type Fail = 'blocked' | 'gap' | 'gapCall' | 'wind' | 'noBori' | 'noBoriCall';

/** 상황마다 말하는 이와 대사들 (첫 줄이 처음 실패) */
export const FAILS: Record<Fail, { who: HeroId; lines: readonly string[] }> = {
  /** 밀 물건이 막힌 쪽으로 */
  blocked: {
    who: 'bori',
    lines: [
      '으라차… 저쪽은 막혀서 안 밀려.',
      '끄응… 저쪽은 벽이야. 다른 쪽에서 밀어 볼까?',
      '안 돼, 꽉 막혔어. 방향을 바꿔 보자.',
      '아무리 힘이 세도 벽은 못 밀어. 자리가 있는 쪽으로!',
      '휴… 막힌 데로는 꿀단지를 걸어도 안 가.',
    ],
  },
  /** 틈: 루루가 무리에 없다 */
  gap: {
    who: 'toby',
    lines: [
      '건너기엔 너무 멀어. 밧줄이 있으면 좋을 텐데…',
      '폴짝 뛰어도 안 닿겠어. 다른 길이 있을까?',
      '아래가 까마득해… 걸어서는 못 건너.',
      '저쪽까지 줄 하나만 걸 수 있으면 되는데.',
    ],
  },
  /** 틈: 루루가 자기 자리에 있다 */
  gapCall: {
    who: 'toby',
    lines: [
      '건너기엔 너무 멀어. 루루를 불러 와야겠어. 루루 밧줄이면 건널 수 있어.',
      '역시 너무 멀어. 루루한테 말을 걸어서 데려오자.',
      '이런 틈은 루루 담당이야. 루루가 어디 있더라?',
      '루루 밧줄 없이는 무리야. 가서 불러 오자.',
    ],
  },
  /** 태엽을 나눠 주기엔 모자라다 */
  wind: {
    who: 'toby',
    lines: [
      '태엽이 모자라… 지금은 나눠 줄 수가 없어.',
      '끼릭… 내 태엽도 얼마 안 남았어. 지금은 안 돼.',
      '나눠 주고 싶은데, 태엽이 바닥이야.',
      '조금만 더 감겨 있었으면 좋았을 텐데…',
    ],
  },
  /** 밀 물건: 보리가 무리에 없다 */
  noBori: {
    who: 'toby',
    lines: [
      '끙… 꿈쩍도 안 해. 힘센 보리라면 밀 수 있을 텐데.',
      '으윽… 토끼 앞발로는 무리야.',
      '꿈쩍도 안 하네. 이건 힘센 누군가의 일이야.',
      '끄응… 내 솜이 다 납작해지겠어.',
    ],
  },
  /** 밀 물건: 보리가 자기 자리에 있다 */
  noBoriCall: {
    who: 'toby',
    lines: [
      '끙… 꿈쩍도 안 해. 보리를 불러 와야겠어.',
      '안 되겠다. 보리한테 말을 걸어서 데려오자.',
      '이런 건 보리 담당이지. 보리가 어디 있더라?',
      '으윽… 보리 힘이 필요해. 가서 불러 오자.',
    ],
  },
};

/** 거드는 동료 차례와 말투 (몸짓 · 대사) */
const CHIME_ORDER = ['ruru', 'bori', 'nabi'] as const;
const CHIME: Record<(typeof CHIME_ORDER)[number], { act: string; lines: readonly string[] }> = {
  ruru: { act: 'giggle', lines: ['또야? 토비, 오늘 좀 덜렁대는데~', '푸핫, 그 표정 뭐야. 한 번 더 해 봐.', '내가 했으면 벌써 끝났지. …아마도.'] },
  bori: { act: 'pat', lines: ['괜찮아, 천천히 하자. 길은 꼭 있어.', '조급해하지 마. 다른 쪽을 보자.', '잠깐 숨 돌리자. 배고프면 생각도 안 나.'] },
  nabi: { act: 'think', lines: ['같은 걸 되풀이하면 같은 결과야. 둘러봐.', '…생각부터 해. 몸은 그다음.', '답은 대개 바로 옆에 있어.'] },
};

/**
 * n 번째(0부터) 같은 실패의 대사: 말하는 이의 줄은 차례로 돌고,
 * 두 번째부터는 무리(party)에 있는 다른 동료가 차례로 한마디 거든다.
 */
export function failCmds(kind: Fail, n: number, party: readonly HeroId[]): Cmd[] {
  const f = FAILS[kind];
  const out: Cmd[] = [{ t: 'say', who: f.who, text: f.lines[n % f.lines.length] }];
  if (n < 1) return out;
  for (let k = 0; k < CHIME_ORDER.length; k++) {
    const p = CHIME_ORDER[(n - 1 + k) % CHIME_ORDER.length];
    if (p === f.who || !party.includes(p)) continue;
    const c = CHIME[p];
    const round = Math.floor((n - 1) / CHIME_ORDER.length);
    out.push({ t: 'act', who: p, name: c.act, wait: false }, { t: 'say', who: p, text: c.lines[round % c.lines.length] });
    break;
  }
  return out;
}
