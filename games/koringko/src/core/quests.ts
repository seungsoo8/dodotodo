/** 퀘스트: 받기 · 진행 · 보고 · 보상 */
import { gainExp } from './character.ts';
import { makeItem } from './items.ts';
import { addItem, nextUid } from './inventory.ts';
import type { Rng } from './rng.ts';
import type { MatId, QuestProgress, Rarity, Save, Slot } from './types.ts';

export type QuestKind = 'kill' | 'collect' | 'boss' | 'rift' | 'forge' | 'elite';

export interface QuestDef {
  id: string;
  name: string;
  main: boolean;
  giver: string;
  kind: QuestKind;
  /** 몬스터 id · 재료 id · 보스 id · 균열 깊이 */
  target: string;
  count: number;
  /** 받을 수 있는 조건 */
  req: { lv?: number; quest?: string };
  /** 진행 상황에 붙는 설명 (퀘스트 창 · 목표) */
  goal: string;
  reward: { exp: number; gold: number; potions?: { hp?: number; sp?: number }; item?: { slot?: Slot; rarity: Rarity }; mats?: Partial<Record<MatId, number>> };
  /** 끝내면 켜지는 깃발 */
  flags?: string[];
  /** 대사: 줄 때 · 하는 중 · 다 했을 때 */
  talk: { offer: string[]; progress: string; done: string[] };
}

export const QUESTS: QuestDef[] = [
  {
    id: 'q_fluff',
    name: '솜뭉치 소동',
    main: true,
    giver: 'chief',
    kind: 'kill',
    target: 'fluff',
    count: 6,
    req: {},
    goal: '곰인형 숲의 솜뭉치를 고쳐 주자',
    reward: { exp: 60, gold: 80, potions: { hp: 3 } },
    talk: {
      offer: ['어서 오렴, 작은 탐험대야.', '요즘 숲의 솜뭉치들이 먼지를 뒤집어쓰고 사납게 굴어.', '동쪽 곰인형 숲에서 여섯 마리만 톡톡 두드려서 정신 차리게 해 주겠니?'],
      progress: '솜뭉치는 동쪽 곰인형 숲 입구에 많단다.',
      done: ['고맙구나! 숲이 한결 조용해졌어.', '이건 수고비야. 포션도 넉넉히 챙겨 가렴.'],
    },
  },
  {
    id: 'q_cloth',
    name: '솜 조각 모으기',
    main: false,
    giver: 'tailor',
    kind: 'collect',
    target: 'fluff',
    count: 5,
    req: { lv: 2 },
    goal: '솜뭉치·헝겊 늑대가 떨어뜨리는 솜 조각 모으기',
    reward: { exp: 90, gold: 60, item: { slot: 'armor', rarity: 'magic' } },
    talk: {
      offer: ['어머, 옷이 많이 해졌네!', '솜 조각을 다섯 개만 구해 오면 튼튼한 옷을 지어 줄게.'],
      progress: '솜 조각은 숲의 솜뭉치랑 헝겊 늑대한테서 나와.',
      done: ['폭신폭신 좋은 솜이야! 약속한 옷이란다.'],
    },
  },
  {
    id: 'q_wolf',
    name: '헝겊 늑대 떼',
    main: true,
    giver: 'chief',
    kind: 'kill',
    target: 'wolf',
    count: 6,
    req: { quest: 'q_fluff', lv: 3 },
    goal: '숲 깊은 곳의 헝겊 늑대 쓰러뜨리기',
    reward: { exp: 220, gold: 200, potions: { hp: 3, sp: 2 } },
    flags: ['cave_open', 'candy_open'],
    talk: {
      offer: ['숲 깊은 곳에서 헝겊 늑대들이 떼로 몰려다닌대.', '늑대들을 진정시키면… 그동안 숨겨 둔 이야기를 해 줄게.'],
      progress: '헝겊 늑대는 숲 동쪽 빈터에 있단다.',
      done: ['정말 해냈구나. 이제 말해 줄 때가 됐네.', '숲 북동쪽 태엽 동굴 깊은 곳에 코링코의 "태엽 심장"이 잠들어 있어.', '요즘 장난감들이 사나워진 건 심장이 먼지에 덮였기 때문이야. 태엽 열쇠를 줄게, 동굴을 살펴봐 주렴.', '아, 북쪽 과자 언덕 길도 열어 두마.'],
    },
  },
  {
    id: 'q_bear',
    name: '태엽 동굴의 주인',
    main: true,
    giver: 'chief',
    kind: 'boss',
    target: 'b_bear',
    count: 1,
    req: { quest: 'q_wolf' },
    goal: '태엽 동굴 깊은 곳의 태엽 곰 대장을 진정시키기',
    reward: { exp: 900, gold: 600, item: { rarity: 'rare' } },
    flags: ['rift_open'],
    talk: {
      offer: ['태엽 심장을 지키던 곰 대장이 먼지에 홀린 것 같아.', '조심하렴. 큰 덩치로 돌진해 온단다.'],
      progress: '태엽 동굴은 곰인형 숲 북동쪽 끝에 있어.',
      done: ['…그랬구나. "더스티"라는 먼지 사도가 심장을 가져갔다고?', '심장이 사라진 자리에 다락방으로 이어지는 균열이 열렸어. 광장의 균열지기가 길을 알려 줄 거야.', '그런데 더스티의 먼지가 과자 언덕에도 퍼졌다는구나. 먼저 그쪽을 살펴봐 주렴.'],
    },
  },
  {
    id: 'q_baker',
    name: '말썽쟁이 젤리',
    main: false,
    giver: 'baker',
    kind: 'kill',
    target: 'jelly',
    count: 8,
    req: { lv: 6 },
    goal: '과자 언덕의 젤리 진정시키기',
    reward: { exp: 380, gold: 300, potions: { hp: 4, sp: 3 } },
    talk: {
      offer: ['오븐 근처 젤리들이 자꾸 반죽을 훔쳐 가!', '여덟 마리만 혼내 주면 맛있는… 아니, 포션을 줄게!'],
      progress: '젤리는 언덕 곳곳에서 통통 튀어 다녀.',
      done: ['고마워! 이제 반죽을 마음 놓고 빚겠어.'],
    },
  },
  {
    id: 'q_sugar',
    name: '설탕 결정',
    main: false,
    giver: 'baker',
    kind: 'collect',
    target: 'sugar',
    count: 6,
    req: { quest: 'q_baker' },
    goal: '과자 언덕 몬스터가 떨어뜨리는 설탕 결정 모으기',
    reward: { exp: 450, gold: 200, item: { slot: 'ring', rarity: 'rare' } },
    talk: {
      offer: ['세상에서 제일 반짝이는 케이크를 굽고 싶어.', '설탕 결정 여섯 개만 모아 줄래? 아끼던 반지를 줄게.'],
      progress: '쿠키 병정이나 초콜릿 골렘이 설탕 결정을 갖고 다녀.',
      done: ['반짝반짝! 약속한 반지야. 잘 어울릴 거야.'],
    },
  },
  {
    id: 'q_forge',
    name: '처음 두드리는 망치',
    main: false,
    giver: 'forge',
    kind: 'forge',
    target: 'any',
    count: 1,
    req: { lv: 2 },
    goal: '대장간에서 장비를 한 번 강화하기',
    reward: { exp: 70, gold: 0, mats: { dust: 6 } },
    talk: {
      offer: ['어이, 꼬마 탐험대! 장비를 두드리면 훨씬 세진다고.', '별가루는 장비를 분해하면 나오지. 한 번 강화해 봐!'],
      progress: '강화할 장비를 골라 내 망치에 맡겨 봐.',
      done: ['좋은 소리가 났지? 별가루 좀 더 챙겨 가!'],
    },
  },
  {
    id: 'q_jelly',
    name: '젤리 여왕의 잠꼬대',
    main: true,
    giver: 'chief',
    kind: 'boss',
    target: 'b_jelly',
    count: 1,
    req: { quest: 'q_bear' },
    goal: '과자 언덕 꼭대기의 젤리 여왕을 깨우기',
    reward: { exp: 1400, gold: 900, item: { rarity: 'rare' } },
    flags: ['factory_open'],
    talk: {
      offer: ['과자 언덕 꼭대기의 젤리 여왕이 먼지를 먹고 잠꼬대를 한대.', '여왕이 몸을 나누면 작은 젤리들이 우르르 몰려오니 조심하렴.'],
      progress: '과자 언덕은 마을 북쪽이란다. 언덕 꼭대기로 올라가 보렴.',
      done: ['여왕이 깨어났구나! 고마워.', '여왕 말로는 더스티가 언덕 너머 태엽 공장으로 갔대. 공장 길이 열렸단다.'],
    },
  },
  {
    id: 'q_tin',
    name: '멈추지 않는 공장',
    main: true,
    giver: 'mole',
    kind: 'boss',
    target: 'b_tin',
    count: 1,
    req: { quest: 'q_jelly' },
    goal: '태엽 공장 안쪽의 깡통 대장을 멈추기',
    reward: { exp: 2000, gold: 1200, item: { rarity: 'unique' } },
    talk: {
      offer: ['어이쿠, 탐험대구먼! 공장 기계가 먼지 때문에 멈추질 않아.', '깡통 대장이 공장 안쪽에서 레이저를 마구 쏘고 있다네. 좀 멈춰 주게!'],
      progress: '깡통 대장은 공장 맨 안쪽 큰 방에 있어. 레이저 선을 잘 보고 피하게.',
      done: ['기계 소리가 잦아들었어! 정말 고맙네.', '깡통 대장이 그러는데, 더스티는 다락방 균열로 도망쳤다는구먼. 촌장님께 알려 드리게.'],
    },
  },
  {
    id: 'q_parts',
    name: '톱니 모으기',
    main: false,
    giver: 'mole',
    kind: 'collect',
    target: 'gear',
    count: 8,
    req: { lv: 14 },
    goal: '태엽 동굴 · 공장 몬스터가 떨어뜨리는 톱니 모으기',
    reward: { exp: 900, gold: 500, item: { slot: 'gloves', rarity: 'rare' } },
    talk: {
      offer: ['기계를 고치려면 톱니가 잔뜩 필요해.', '여덟 개만 모아 오면 튼튼한 장갑을 만들어 주지.'],
      progress: '깡통 병정이나 태엽 박쥐가 톱니를 잘 떨어뜨린다네.',
      done: ['딱 맞는 톱니들이군! 자, 약속한 장갑일세.'],
    },
  },
  {
    id: 'q_tinkill',
    name: '깡통 병정 정리',
    main: false,
    giver: 'mole',
    kind: 'kill',
    target: 'tin',
    count: 12,
    req: { lv: 14 },
    goal: '공장의 깡통 병정 쓰러뜨리기',
    reward: { exp: 1100, gold: 600, potions: { hp: 5, sp: 3 } },
    talk: {
      offer: ['깡통 병정들이 줄지어 행진하는 바람에 일을 할 수가 없어.', '열두 녀석만 쉬게 해 주게.'],
      progress: '깡통 병정은 공장 곳곳에 있다네.',
      done: ['이제 좀 조용하군. 물약을 넉넉히 챙겨 가게.'],
    },
  },
  {
    id: 'q_elite',
    name: '정예 사냥꾼',
    main: false,
    giver: 'riftkeeper',
    kind: 'elite',
    target: 'any',
    count: 5,
    req: { quest: 'q_bear' },
    goal: '아무 곳에서나 정예 몬스터 쓰러뜨리기',
    reward: { exp: 1500, gold: 800, item: { rarity: 'rare' } },
    talk: {
      offer: ['부엉… 몸에 빛이 도는 정예 몬스터를 본 적 있나?', '다섯 마리를 쓰러뜨리면 좋은 걸 주겠네. 성질을 잘 보고 싸우게.'],
      progress: '정예는 이름 앞에 성질이 붙어 있다네. 불꽃이면 발자국을, 서리면 쓰러질 때를 조심하게.',
      done: ['훌륭하군. 이건 균열에서 주운 물건일세.'],
    },
  },
  {
    id: 'q_rift10',
    name: '더 깊은 곳으로',
    main: false,
    giver: 'riftkeeper',
    kind: 'rift',
    target: '10',
    count: 1,
    req: { quest: 'q_dusty' },
    goal: '다락방 균열 10층 깨기',
    reward: { exp: 3000, gold: 2000, item: { rarity: 'unique' } },
    talk: {
      offer: ['10층까지 내려가 보겠나? 축복을 잘 고르면 생각보다 멀리 갈 수 있다네.'],
      progress: '6층부터 시작할 수 있다네. 5층을 깼다면 말이지.',
      done: ['10층이라니! 이건 상으로 주는 물건일세.'],
    },
  },
  {
    id: 'q_dusty',
    name: '먼지 사도 더스티',
    main: true,
    giver: 'chief',
    kind: 'rift',
    target: '5',
    count: 1,
    req: { quest: 'q_tin' },
    goal: '다락방 균열 5층에서 더스티를 쓰러뜨리기',
    reward: { exp: 2400, gold: 1500, item: { rarity: 'unique' } },
    talk: {
      offer: ['균열 깊은 곳에서 먼지 냄새가 짙어지고 있어.', '5층에서 더스티를 찾아 태엽 심장을 되찾아 오렴.'],
      progress: '광장의 균열지기에게 말을 걸면 균열에 들어갈 수 있단다.',
      done: ['심장 조각이 돌아왔어! 하지만 더스티는 "먼지 왕"의 심부름꾼일 뿐이었구나.', '먼지 왕은 다락방 가장 깊은 곳, 50층에 있다고 해.', '천천히 강해지렴. 코링코는 너희를 믿고 있어.'],
    },
  },
  {
    id: 'q_king',
    name: '먼지 왕',
    main: true,
    giver: 'chief',
    kind: 'rift',
    target: '50',
    count: 1,
    req: { quest: 'q_dusty' },
    goal: '다락방 균열 50층에서 먼지 왕을 쓰러뜨리기',
    reward: { exp: 0, gold: 10000, item: { rarity: 'legendary' } },
    flags: ['ending'],
    talk: {
      offer: ['먼지 왕을 쓰러뜨리면 코링코의 모든 장난감이 다시 깨어날 거야.'],
      progress: '다락방 균열 50층… 아주 깊은 곳이란다.',
      done: ['해냈구나, 탐험대! 태엽 심장이 다시 째깍째깍 뛰고 있어.', '이제 코링코의 장난감들은 모두 아이들 곁으로 돌아갈 수 있단다. 고마워.'],
    },
  },
];

export const QUEST_BY_ID: Record<string, QuestDef> = Object.fromEntries(QUESTS.map((q) => [q.id, q]));

export function progress(save: Save, id: string): QuestProgress {
  return save.quests[id] ?? { state: 'none', n: 0 };
}

export function canAccept(save: Save, q: QuestDef): boolean {
  if (progress(save, q.id).state !== 'none') return false;
  if (q.req.lv && save.lv < q.req.lv) return false;
  if (q.req.quest && progress(save, q.req.quest).state !== 'done') return false;
  return true;
}

export function accept(save: Save, id: string): boolean {
  const q = QUEST_BY_ID[id];
  if (!q || !canAccept(save, q)) return false;
  save.quests[id] = { state: 'active', n: 0 };
  refreshCollect(save);
  return true;
}

/** 모으기 퀘스트는 가진 재료로 다 했는지 본다 */
export function refreshCollect(save: Save): void {
  for (const q of QUESTS) {
    if (q.kind !== 'collect') continue;
    const p = save.quests[q.id];
    if (!p || (p.state !== 'active' && p.state !== 'ready')) continue;
    p.n = Math.min(q.count, save.mats[q.target as MatId] ?? 0);
    p.state = p.n >= q.count ? 'ready' : 'active';
  }
}

function bump(save: Save, kind: QuestKind, target: string): string[] {
  const changed: string[] = [];
  for (const q of QUESTS) {
    if (q.kind !== kind || (q.target !== target && q.target !== 'any')) continue;
    const p = save.quests[q.id];
    if (!p || p.state !== 'active') continue;
    p.n = Math.min(q.count, p.n + 1);
    if (p.n >= q.count) p.state = 'ready';
    changed.push(q.id);
  }
  return changed;
}

export function onKill(save: Save, defId: string): string[] {
  return [...bump(save, 'kill', defId), ...bump(save, 'boss', defId)];
}

/** 균열 층을 깼다: 그 층보다 얕은 목표는 모두 채운다 */
export function onRiftClear(save: Save, depth: number): string[] {
  const out: string[] = [];
  for (const q of QUESTS) {
    if (q.kind !== 'rift' || Number(q.target) > depth) continue;
    out.push(...bump(save, 'rift', q.target));
  }
  return out;
}

export function onEliteKill(save: Save): string[] {
  return bump(save, 'elite', 'any');
}

export function onForge(save: Save): string[] {
  return bump(save, 'forge', 'any');
}

/** 보고하고 보상을 받는다 */
export function complete(save: Save, id: string, rng: Rng): boolean {
  const q = QUEST_BY_ID[id];
  refreshCollect(save);
  const p = save.quests[id];
  if (!q || !p || p.state !== 'ready') return false;
  if (q.kind === 'collect') save.mats[q.target as MatId] -= q.count;
  p.state = 'done';
  const r = q.reward;
  save.gold += r.gold;
  gainExp(save, r.exp);
  if (r.potions?.hp) save.potions.hp += r.potions.hp;
  if (r.potions?.sp) save.potions.sp += r.potions.sp;
  for (const [k, v] of Object.entries(r.mats ?? {})) save.mats[k as MatId] += v!;
  if (r.item) {
    const it = makeItem(rng, { ilvl: Math.max(save.lv, 2), rarity: r.item.rarity, slot: r.item.slot, hero: save.hero, uid: nextUid(save) });
    // 가방이 꽉 차 있으면 장착 칸 대신 골드로 (아이템 값의 두 배)
    if (!addItem(save, it)) save.gold += 100 * save.lv;
  }
  for (const f of q.flags ?? []) save.flags[f] = true;
  refreshCollect(save);
  return true;
}

/** 이 NPC 와 이야기할 때 보여 줄 퀘스트 (보고할 것 → 새로 받을 것 → 하는 중인 것) */
export function questFor(save: Save, npc: string): { quest: QuestDef; mode: 'done' | 'offer' | 'progress' } | null {
  refreshCollect(save);
  const mine = QUESTS.filter((q) => q.giver === npc);
  const ready = mine.find((q) => progress(save, q.id).state === 'ready');
  if (ready) return { quest: ready, mode: 'done' };
  const offer = mine.find((q) => canAccept(save, q));
  if (offer) return { quest: offer, mode: 'offer' };
  const active = mine.find((q) => progress(save, q.id).state === 'active');
  if (active) return { quest: active, mode: 'progress' };
  return null;
}

/** 지금 할 일 (화면 오른쪽 위 목표): 주 퀘스트 우선 */
export function currentGoal(save: Save): { quest: QuestDef; state: QuestProgress } | null {
  refreshCollect(save);
  for (const q of QUESTS.filter((x) => x.main)) {
    const p = progress(save, q.id);
    if (p.state === 'active' || p.state === 'ready') return { quest: q, state: p };
  }
  for (const q of QUESTS.filter((x) => x.main)) if (canAccept(save, q)) return { quest: q, state: progress(save, q.id) };
  return null;
}
