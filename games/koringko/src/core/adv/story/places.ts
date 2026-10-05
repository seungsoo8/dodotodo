/**
 * 옛 장 방의 기억 → 물건 자리표: 공중에 떠 있던 기억 구슬을 그 기억에 어울리는 물건(keepsake)으로 바꾼다.
 * 자리는 구슬이 있던 칸 그대로 (길 · 닿기는 그대로), 그림만 그 기억의 물건으로.
 * 그림 이름은 물건(items) · 소품(props) · 가구 1칸 (PROPS.md 의 이름).
 */
import type { KeepsakePlace, Pt } from '../types.ts';

const at = (p: Pt, look: string): KeepsakePlace => ({ at: p, look });

export const OLD_KEEPSAKES: Record<string, Record<string, KeepsakePlace>> = {
  // 2장 · 할머니 방
  grandroom: {
    m2a: at([17, 3], 'scarf'), // 반만 뜬 목도리
    m2b: at([5, 7], 'letter'), // 「열다섯 살 하루에게」
    m2c: at([26, 13], 'doll'), // 태엽 할머니
    m2d: at([3, 12], 'bowl'), // 식은 미역국
    m2e: at([21, 8], 'cup'), // 두 잔의 꿀차
    m2f: at([23, 8], 'card'), // 재봉틀 위에 두고 온 카드
    m2g: at([19, 13], 'towel'), // 보라 카디건 (개켜 둔 옷)
  },
  // 엄마의 화장대
  dresser: {
    mMa: at([7, 11], 'flowers'), // 동백꽃 머리핀
    mMb: at([3, 3], 'photo'), // 연습한 웃음 (까만 창에 비친 얼굴)
    mMc: at([15, 5], 'hairTie'), // 검은 머리끈
    mMd: at([16, 15], 'towel'), // 물소리
    mMg: at([25, 10], 'phone'), // 저장된 목소리
    mMe: at([22, 3], 'key'), // 「네 태엽은 하루가 감아야 하나 보다」
    mMf: at([27, 15], 'letter'), // 재봉틀 서랍 속 두 통의 편지
  },
  // 침대 밑
  underbed: {
    m3a: at([5, 2], 'bowl'), // 먹지 않은 밥
    m3b: at([14, 7], 'jar'), // 구백구십구
    m3c: at([27, 15], 'key'), // 마지막 태엽
    m3d: at([10, 5], 'phone'), // 「괜찮아」를 쓰고 지우고
    m3e: at([20, 12], 'boxTaped'), // 「인형은 정리해야지」
    m3f: at([13, 14], 'tray'), // 탄 토스트
    m3g: at([18, 11], 'cup'), // 너무 달았던 꿀차
  },
  // 나비의 이불장
  closet: {
    mNa: at([6, 11], 'jarSmall'), // 햇빛 먹은 등불
    mNb: at([14, 15], 'cat'), // 나비 꼬리를 잡고 셋
    mNc: at([21, 11], 'towel'), // 이불 속 비밀
    mNd: at([27, 15], 'cushion'), // 벽 너머의 기침 (베개)
    mNe: at([3, 2], 'boxOpen'), // 「상자 말고, 이불 사이에」
    mNf: at([10, 6], 'sewing'), // 할머니의 반짇고리
  },
  // 거실 창가
  window: {
    m4a: at([20, 1], 'flowers'), // 병원
    m4b: at([24, 8], 'phone'), // 비 오는 밤의 전화
    m4c: at([14, 13], 'paperstar'), // 구백구십구 번째 별
    m4d: at([2, 5], 'jar'), // 머리맡의 종이별 유리병
    m4e: at([23, 2], 'letter'), // 편지 끝에 덧붙인 한 줄
    m4f: at([15, 8], 'scarf'), // 「나머지 반은 네가 떠라」
    m4g: at([16, 7], 'tray'), // 약불에 천천히 (토스트)
  },
  // 현관
  entrance: {
    mEa: at([9, 14], 'basket'), // 「놓지 마」 (자전거 앞바구니)
    mEb: at([26, 2], 'bowl'), // 미역국 배우기
    mEc: at([27, 15], 'tray'), // 짠 미역국 (밥상)
    mEd: at([16, 2], 'lunchbox'), // 운동회
    mEe: at([3, 2], 'cushion'), // 의원 앞 의자 (방석)
    mEf: at([24, 14], 'bag'), // 다녀오겠습니다
    mEg: at([10, 9], 'umbrella'), // 교문 앞 말고
  },
  // 하루의 책가방
  schoolbag: {
    mJa: at([4, 13], 'lunchbox'), // 김밥 두 줄
    mJb: at([13, 9], 'paperstar'), // 만두 별
    mJc: at([26, 11], 'book'), // 비밀 하나씩
    mJg: at([23, 12], 'umbrella'), // 오늘만 이 길
    mJd: at([3, 2], 'jarSmall'), // 주머니 속 별
    mJe: at([16, 2], 'scarf'), // 소매
    mJf: at([27, 5], 'letter'), // 앞주머니 편지
  },
  // 욕실
  bath: {
    mBa: at([13, 3], 'photo'), // 웃은 자국 (거울)
    mBb: at([5, 13], 'book'), // 작문 「우리 할머니」
    mBc: at([10, 12], 'photo:down'), // 깨진 안경 (엎어진 유리)
    mBd: at([24, 2], 'paperstar'), // 하루 별
    mBe: at([20, 4], 'key'), // 먼저 감는 사람
    mBf: at([2, 8], 'towel'), // 할머니 머리 감기
    mBg: at([17, 9], 'pen'), // 눈썹 연필 주름
  },
  // 책장
  shelf: {
    m6a: at([2, 2], 'bear'), // 할머니의 곰
    m6b: at([24, 13], 'fox'), // 서른 번의 인형 뽑기
    m6c: at([24, 2], 'toby'), // 토비 극장
    m6d: at([9, 12], 'card'), // 극장 포스터
    m6e: at([18, 2], 'book'), // 할머니의 대본
    m6f: at([15, 6], 'letter'), // 열 장의 표
    m6g: at([16, 12], 'doll'), // 「할머니 봐라」
  },
  // 과자 서랍
  drawer: {
    m7a: at([3, 2], 'cake'), // 일곱 개의 초
    m7b: at([22, 3], 'key'), // 부러진 태엽 열쇠
    m7c: at([24, 13], 'toby'), // 「매일 감아 주렴」
    m7d: at([10, 13], 'xmasbox'), // 오르골
    m7e: at([17, 8], 'bowl'), // 설거지하던 밤
    m7f: at([9, 6], 'honeycandy'), // 서랍 속 사탕
    m7g: at([7, 11], 'clock'), // 할아버지의 회중시계
  },
  // 베란다 (13장 사람 크기 베란다: layout_d.ts)
  balcony: {
    mVa: { at: [30, 6], look: 'nameStick', when: 'flower_watered' }, // 하루 꽃 (물을 주면 드러나는 할머니의 이름표)
    mVb: at([32, 3], 'feather'), // 까치야 까치야 (난간 밑 까치 깃털)
    mVc: at([22, 10], 'flowers'), // 졸업 꽃다발 (신문지 더미 사이 마른 리본)
    mVd: { at: [10, 4], look: 'foxBag', when: 'bag_down' }, // 서른 번째 (세탁기 위 놀이공원 여우 비닐봉지)
    mVe: at([19, 4], 'towel'), // 해진 이불 (건조대의 행주가 된 아기 이불 조각)
    mVf: at([15, 4], 'photo'), // 한복 입은 날 (「거실」 상자 속 가족사진 액자)
    mVg: at([29, 9], 'trowel'), // 모퉁이에서 기다릴게 (할머니 손때 묻은 꽃삽)
  },
  // 루루의 소파 밑 (14장 근접 지도: layout_d.ts)
  sofa: {
    mRa: { at: [5, 5], look: 'capsule', when: 'ruru_led' }, // 유리 상자 속 (보물 상자 속 뽑기 캡슐 — 루루가 아지트를 보여 주면)
    mRb: at([4, 7], 'furTuft'), // 꼬리 세 번 (빨간 실로 묶은 여우 털 세 가닥)
    mRc: at([37, 4], 'scratcherTip'), // 소파 밑 일주일 (효자손 끝 고무)
    mRd: at([19, 4], 'threadRed'), // 두 번째 바느질 (빨간 실 한 토막)
    mRe: at([25, 16], 'penCap'), // 루루가 그랬어 (수성펜 뚜껑)
    mRf: { at: [34, 9], look: 'coinGiant:100', when: 'tower_done' }, // 서른한 번째 (동전 탑 꼭대기의 백원 할배)
  },
  // 비 오는 마당 (15장 사람 크기 마당: layout_d.ts)
  yard: {
    m8a: at([10, 10], 'raincoatButton'), // 노란 비옷 (웅덩이 옆 비옷 단추)
    m8b: at([28, 16], 'cotton'), // 토비가 없어! (덤불 밑 하얀 솜 한 줌)
    m8c: { at: [13, 14], look: 'umbrella', when: 'frog_met' }, // 우산 속 (개굴 형이 알려 준 뒤집힌 우산)
    m8d: at([6, 8], 'clothespin'), // 빨랫줄 (빈 빨랫줄의 토끼 귀 집게 자국)
    m8e: at([8, 3], 'cushion'), // 별이 되어서 (툇마루 할머니 방석 자국)
    m8f: at([11, 12], 'looseStone'), // 돌담 위 걷기 (덜컥이는 돌)
    m8g: at([23, 16], 'flashlight'), // 진흙 속 열쇠 (덤불 밑 진흙 속 꺼진 손전등)
  },
  // 골목 끝 놀이터 (16장 사람 크기 골목 + 놀이터: layout_d.ts)
  outside: {
    mOUa: at([5, 4], 'palmPrint'), // 가로등 밑 (첫 가로등 기둥, 할머니가 짚던 손바닥 자리)
    mOUb: at([7, 16], 'footSticker'), // 두 손 들고 (횡단보도 앞 노란 발자국 스티커)
    mOUc: at([16, 4], 'icecream'), // 반쪽 (구멍가게 냉장고 앞 막대 두 개짜리 아이스크림 껍질)
    mOUd: { at: [28, 16], look: 'bench', dark: true }, // 세 번 깜빡 (어두운 버스 정류장 의자)
    mOUe: { at: [46, 4], look: 'scarf', when: 'swing_pushed' }, // 그만할 때까지 (그네 줄에 걸린 노란 목도리)
    mOUf: { at: [39, 4], look: 'sticks2', dark: true }, // 대신 밀어 줄게 (어두운 벤치 위 아이스크림 막대 둘)
  },
  // 토비의 태엽 속
  tobykey: {
    mTa: at([5, 12], 'toby'), // 짝짝이 귀
    mTb: at([3, 4], 'cushion'), // 오늘 제일 좋았던 거 (잠자리)
    mTc: at([14, 14], 'card'), // 계단에서
    mTd: at([16, 3], 'boxOpen'), // 뚜껑 너머
    mTe: at([26, 4], 'xmasbox'), // 끝이 기억 안 나는 노래 (오르골)
    mTf: at([25, 14], 'key'), // 기다리는 사람
  },
  // 장난감 상자
  toybox: {
    m9a: at([4, 3], 'xmasbox'), // 선물 상자
    m9b: at([24, 4], 'key'), // 처음 감은 태엽
    m9c: at([25, 13], 'toby'), // 평생 같이 놀자
    m9d: at([12, 6], 'bear'), // 보리차 색
    m9e: at([19, 13], 'card'), // 크레용 글씨
    m9f: at([13, 12], 'clock'), // 토비의 심장 소리
    m9g: at([3, 7], 'bag'), // 어린이집 첫날
  },
  // 보리의 찬장
  cupboard: {
    mOa: at([7, 15], 'honeycandy'), // 꿀 좋아하는 곰
    mOg: at([7, 4], 'basket'), // 까치밥
    mOb: at([2, 9], 'boxKeep'), // 가져가는 짐
    mOc: at([4, 2], 'cup'), // 꿀차와 그네
    mOd: at([13, 3], 'bear'), // 은주의 곰
    mOe: at([22, 3], 'jarSmall'), // 빈 의자 앞의 꿀차 (작은 꿀단지)
    mOf: at([26, 15], 'card'), // 곰돌이의 마지막 밤
  },
  // 할머니의 재봉 상자
  sewbox: {
    mGa: at([3, 2], 'calendar'), // 진찰실 (달력의 동그라미)
    mGb: at([6, 14], 'phone'), // 비밀로 해 다오
    mGc: at([16, 2], 'doll'), // 눈을 뜬 인형
    mGd: at([24, 3], 'paperStrips'), // 찢어진 편지지
    mGe: at([26, 15], 'letter'), // 토비에게
    mGf: at([27, 7], 'flowers'), // 마지막 산책
    mGg: at([15, 7], 'yarn'), // 다시 뜨면 된다
  },
  // 에필로그 · 새 방
  newroom_toy: {
    mEPa: at([5, 4], 'boxKeep'), // 가져온 짐
    mEPb: at([8, 12], 'bowl'), // 할머니 맛 미역국
    mEPc: at([16, 4], 'scarf'), // 나머지 반
    mEPd: at([25, 6], 'paperstar'), // 야광 별
    mEPe: at([15, 13], 'cushion'), // 할머니 의자의 방석
    mEPf: at([26, 15], 'photo'), // 할머니 얘기
  },
};
