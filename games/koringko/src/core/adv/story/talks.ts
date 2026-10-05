/** 기억 사이를 건너가는 길: 동료들의 잡담 (장 시작에 덧붙인다) — 웃기고, 다투고, 조금씩 자란다 */
import { s } from '../parse.ts';
import type { Cmd } from '../types.ts';

/** 방 id → 그 장 들어갈 때의 잡담 */
export const ROAD: Record<string, Cmd[]> = {
  desk: s`
    ruru: 있잖아. 하루가 우리를 다시 데려가면… 새집에서도 같이 놀까?
    toby: 하루는 이제 열다섯 살이야. 예전처럼 놀지는 않을 거야.
    ruru: 그럼 뭐 해? 선반에 앉아만 있어?
    nabi: 앉아만 있어도 돼. 하루가 지나가다 한 번 보면 돼.
    @act bori nod nowait
    bori: 난 그게 좋아. 하루가 숙제하다 지쳐서 나를 꼭 안으면, 그걸로 충분해.
    ruru: …너희는 욕심이 없구나.
    toby: 루루는 욕심 있어?
    @act ruru point nowait
    ruru: 당연하지. 난 하루가 웃는 거 백 번 더 볼 거야. 천 번.
  `,
  shelf: s`
    bori: 토비, 걸음이 느려졌어.
    toby: 괜찮아.
    nabi: 괜찮다는 말, 하루한테서 옮았구나.
    @emote toby …
    @act toby shiver
    toby: …사실, 조금 무서워. 태엽이 멈추면 어떻게 되는지 모르니까.
    ruru: 멈추면 내가 등을 쿡쿡 찔러서 깨울게. 장난 전문이니까.
    @act toby laugh nowait
    toby: 하하. 그건 좀 아플 것 같은데.
    @act bori pat
    bori: 우리가 같이 있잖아. 멈추면 같이 기다릴게. 하루가 감아 줄 때까지.
  `,
  yard: s`
    nabi: 이제 거의 처음이야. 하루가 다섯 살, 네 살.
    toby: 내가 기억 못 하는 것들이 많아. 너무 오래돼서.
    ruru: 우리가 대신 기억하면 되지. 넷이니까 넷 배로.
    @act bori think nowait
    bori: 그건 계산이 이상한데.
    @act ruru shrug nowait
    ruru: 장난감 산수야.
    toby: …고마워. 루루.
    @act ruru surprise nowait
    ruru: 뭐, 뭐야 갑자기. 비 오는데 감기 걸리지 말라고.
  `,
  outside: s`
    @sfx wind
    @act bori shiver nowait
    bori: 나 지금 발이 좀 떨려.
    ruru: 곰이 떨긴. 그냥 밤공기가 차서 그래.
    bori: 루루 꼬리도 떨리는데.
    @act ruru tremble nowait
    ruru: 이건… 신나서 그런 거야.
    nabi: 하루가 처음 학교 가던 날 얼굴이네, 둘 다.
    toby: 괜찮아. 하루도 처음엔 이 길이 무서웠대. 그래서 할머니 손을 꼭 잡고 걸었지.
    ruru: 그럼 우리도 손 잡아. …아니, 발. 아니, 아무튼 잡아.
  `,
  balcony: s`
    bori: 이제 하루가 여섯 살이야. 우리가 넷이 되던 해.
    @act ruru jump nowait
    ruru: 나랑 나비가 온 해! 나 그때 엄청 새것이었어.
    nabi: 지금은?
    ruru: …빈티지.
    @act toby laugh nowait
    toby: 하하. 루루, 그 말 할머니가 했던 거지?
    ruru: 맞아. 꼬리 꿰매 주면서. "빈티지가 더 귀한 거란다."
  `,
};
