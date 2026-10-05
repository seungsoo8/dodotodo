/**
 * 옛 장 방의 기억 → 물건 자리표: 공중에 떠 있던 기억 구슬을 그 기억에 어울리는 물건(keepsake)으로 바꾼다.
 * 자리는 구슬이 있던 칸 그대로 (길 · 닿기는 그대로), 그림만 그 기억의 물건으로.
 * 그림 이름은 물건(items) · 소품(props) · 가구 1칸 (PROPS.md 의 이름).
 */
import type { KeepsakePlace, Pt } from '../types.ts';

const at = (p: Pt, look: string): KeepsakePlace => ({ at: p, look });

export const OLD_KEEPSAKES: Record<string, Record<string, KeepsakePlace>> = {
  // 2장 · 할머니 방 (사람 크기 복도 + 방, layout_b.ts hallHouse)
  grandroom: {
    m2a: at([8, 9], 'basket'), // 반만 뜬 목도리 → 뜨개 바구니 (뜨개바늘 자리만 비었다)
    m2b: { at: [2, 4], look: 'scarf', when: 'drawer_open' }, // 재봉틀 앞에서 → 바늘 밑에 낀 노란 천 (서랍이 열린 뒤)
    m2c: at([16, 5], 'dustRing'), // 태엽 할머니 → 침대 머리맡의 먼지 없는 동그란 자국
    m2d: at([9, 3], 'calendar'), // 할머니 생신 → 멈춘 달력의 생신 동그라미
    m2e: at([5, 9], 'cup'), // 두 잔의 꿀차 → 소반 앞 찻잔
    m2f: { at: [1, 3], look: 'card', when: 'cloth_sew' }, // 답장은 안 해도 돼 → 재봉틀 천 밑 하얀 네모 자국과 카드
    m2g: { at: [19, 4], look: 'towel', when: 'cloth_ward' }, // 보라 카디건 → 장롱 문틈에 낀 소매
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
    mNa: at([35, 18], 'flashlight'), // 햇빛 먹은 등불 → 복도 끝 창가의 배터리 뺀 손전등
    mNb: at([31, 12], 'pen'), // 셋 세면 → 이불장 문 안쪽 연필 글씨 「하나 둘 셋」
    mNc: at([32, 7], 'quilts:pouch'), // 이불 속 비밀 → 꽃무늬 이불 귀퉁이에 꿰맨 주머니 (가운데 칸)
    mNd: at([6, 18], 'cup'), // 벽 너머의 기침 → 하루 방과 할머니 방 사이 벽에 대 본 컵
    mNe: at([34, 7], 'cat'), // 이불장에 넣은 날 → 이불 사이 나비 모양 눌린 자국 (깜깜한 가운데 칸)
    mNf: at([30, 4], 'sewing'), // 문 쪽을 보렴 → 맨 위 칸 반짝이 실 옆 할머니 바늘
  },
  // 거실 창가
  window: {
    m4a: at([5, 3], 'visitorPass'), // 병원 → 창턱의 병원 면회증 목걸이 (하루 이름)
    m4b: { at: [26, 12], look: 'table:phone', when: 'cord_free' }, // 비 오는 밤의 전화 → 전화선이 풀린 집 전화기
    m4c: at([9, 4], 'paperStrips'), // 구백구십구 번째 별 → 창턱 화분 흙에 꽂힌 마지막 종이띠
    m4d: { at: [7, 3], look: 'fogPane', dark: true }, // 할머니 지킴이 → 김 서린 유리의 손가락 글씨 (나비 등불 온기로)
    m4e: at([19, 12], 'letter'), // 할머니의 밤 → 탁자 위 병원 영수증 봉투
    m4f: at([19, 9], 'yarn'), // 다 나으면 → 소파 위 노란 털실 보푸라기
    m4g: at([14, 12], 'tray'), // 약불에 천천히 → 라면 그릇 옆 프라이팬 뚜껑
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
    m6a: at([22, 4], 'photo'), // 할머니의 곰 → 책장 앨범에서 삐져나온 흑백사진 (꼬마 순이와 곰돌이)
    m6b: at([22, 6], 'paperStrips'), // 서른 번의 인형 뽑기 → 놀이공원 동전 교환 영수증 뭉치
    m6c: { at: [33, 4], look: 'curtainPile', when: 'curtain_open' }, // 토비 극장 → 걷힌 무대의 빨간 천 커튼 (깜깜한 무대 칸)
    m6d: at([28, 5], 'card'), // 극장 포스터 → 책장 옆면에서 반쯤 떨어진 크레용 포스터
    m6e: at([30, 4], 'book'), // 할머니의 대본 → 무대 바닥 대본 공책 「4화」
    m6f: at([20, 4], 'tickets'), // 열 장의 표 → 고무줄로 묶은 표 열 장
    m6g: at([21, 6], 'dustRing:four'), // 놀림 받은 날 → 인형 자리의 먼지 없는 네 동그라미
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
  // 베란다
  balcony: {
    mVa: at([3, 3], 'pot'), // 하루 꽃
    mVb: at([9, 2], 'jarSmall'), // 첫 이 (작은 병)
    mVc: at([24, 15], 'flowers'), // 졸업 꽃다발
    mVd: at([27, 11], 'fox'), // 루루가 온 날
    mVe: at([21, 15], 'cat'), // 등불 고양이가 태어난 밤
    mVf: at([2, 15], 'photo'), // 거실 벽의 가족사진
    mVg: at([20, 7], 'bag'), // 「내일부터 오지 마」
  },
  // 루루의 소파 밑
  sofa: {
    mRa: at([3, 3], 'jar'), // 유리 상자 속
    mRb: at([13, 2], 'fox'), // 꼬리 세 번
    mRc: at([27, 6], 'cushion'), // 소파 밑 일주일
    mRd: at([15, 15], 'sewing'), // 두 번째 바느질
    mRe: at([22, 11], 'pen'), // 여우 수염 (매직펜)
    mRf: at([27, 15], 'card'), // 서른한 번째
  },
  // 비 오는 마당
  yard: {
    m8a: at([8, 11], 'puddle'), // 개구리를 쫓던 웅덩이
    m8b: at([26, 14], 'toby'), // 토비가 없어!
    m8c: at([20, 3], 'umbrella'), // 우산 속
    m8d: at([5, 11], 'towel'), // 빨랫줄
    m8e: at([24, 2], 'paperstar'), // 별이 되어서
    m8f: at([12, 12], 'bag'), // 돌담 위 걷기
    m8g: at([15, 10], 'key'), // 진흙 속 열쇠
  },
  // 골목 끝 놀이터
  outside: {
    mOUa: at([8, 5], 'basket'), // 가로등 밑 (장바구니)
    mOUb: at([5, 10], 'bag'), // 처음 학교 가던 날
    mOUc: at([19, 4], 'icecream'), // 반쪽
    mOUd: at([20, 13], 'phone'), // 세 번 깜빡
    mOUe: at([35, 8], 'scarf'), // 그네에 걸어 둔 목도리
    mOUf: at([30, 4], 'flowers'), // 할머니가 떠난 봄
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
