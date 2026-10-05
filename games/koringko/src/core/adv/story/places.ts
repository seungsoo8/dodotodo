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
    m2b: at([2, 4], 'scarf'), // 재봉틀 앞에서 → 바늘 밑에 낀 노란 천 (나오는 차례는 막 사슬 GRANDROOM_CHAIN 이 기억의 when 으로 정한다)
    m2c: at([16, 5], 'dustRing'), // 태엽 할머니 → 침대 머리맡의 먼지 없는 동그란 자국
    m2d: at([9, 3], 'calendar'), // 할머니 생신 → 멈춘 달력의 생신 동그라미
    m2e: at([5, 9], 'cup'), // 두 잔의 꿀차 → 소반 앞 찻잔
    m2f: at([1, 3], 'card'), // 답장은 안 해도 돼 → 재봉틀 천 밑 하얀 네모 자국과 카드 (천을 걷은 뒤)
    m2g: at([19, 4], 'towel'), // 보라 카디건 → 장롱 문틈에 낀 소매 (천을 걷은 뒤)
  },
  // 엄마의 화장대 (안방 houseMap · layout_c.ts)
  dresser: {
    mMa: at([3, 3], 'flowers'), // 동백꽃 머리핀 (보석함 속 — 「은주에게」 쪽지 뒤에 보석함이 열린다)
    mMb: at([4, 4], 'card'), // 연습한 웃음 (거울 귀퉁이의 병원 주차권)
    mMc: at([5, 6], 'hairTie'), // 검은 머리끈 (서랍 손잡이)
    mMd: at([13, 8], 'towel'), // 물소리 (건조대의 아빠 수건)
    mMg: at([21, 5], 'phone'), // 저장된 목소리 (머리맡의 엄마 휴대폰 — 가져다 놓은 뒤)
    mMe: at([22, 5], 'bag'), // 엄마 손으로는 (가방 옆 주머니의 반창고)
    mMf: at([23, 5], 'letter'), // 은주에게 (가방 속 쪽지)
  },
  // 4장 침대 밑 · 8장 책가방 · 18장 장난감 상자 · 에필로그 새 방: 사람 크기 집 지도로 옮겨 자리표가 그 방(RoomDef.keepsakes)에 있다 (ch3 · ch_schoolbag · ch9 · ch_epilogue)
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
    m4b: at([26, 12], 'table:phone'), // 비 오는 밤의 전화 → 수화기 줄이 바닥을 가로지르는 집 전화기
    m4c: at([9, 4], 'paperStrips'), // 구백구십구 번째 별 → 창턱 화분 흙에 꽂힌 마지막 종이띠
    m4d: { at: [7, 3], look: 'fogPane', dark: true }, // 할머니 지킴이 → 김 서린 유리의 손가락 글씨 (나비 등불 온기로)
    m4e: at([19, 12], 'letter'), // 할머니의 밤 → 탁자 위 병원 영수증 봉투
    m4f: at([19, 9], 'yarn'), // 다 나으면 → 소파 위 노란 털실 보푸라기
    m4g: at([14, 12], 'tray'), // 약불에 천천히 → 라면 그릇 옆 프라이팬 뚜껑
  },
  // 현관 (houseMap · layout_c.ts): 마루 → 한 단 아래 현관 바닥
  entrance: {
    mEa: at([22, 6], 'tape'), // 「놓지 마」 (자전거 뒷자리 손잡이에 감긴 테이프)
    mEb: at([17, 3], 'basket'), // 미역국 배우기 (신발장 위 장바구니 속 미역)
    mEc: at([13, 5], 'tray'), // 짠 미역국 (「부엌」 상자 틈의 국자)
    mEd: at([21, 4], 'shoePair:small'), // 운동회 (작아진 운동화 — 신발 짝을 맞춘 뒤)
    mEe: at([17, 4], 'card'), // 의원 앞 의자 (신발장 서랍 속 진료 카드)
    mEf: at([16, 4], 'shoePair:fur'), // 다녀오겠습니다 (할머니 털신 — 신발장 맨 아래 칸이 열린 뒤)
    mEg: at([23, 3], 'umbrella'), // 교문 앞 말고 (우산꽂이의 작은 노란 우산)
  },
  // (하루의 책가방 → ch_schoolbag.ts)
  // 욕실 (houseMap · layout_c.ts): 세면대 위 · 욕조 둘레. 6막 기억 사슬 차례대로 하나씩 드러난다 (BATH_CHAIN)
  bath: {
    mBa: { at: [12, 3], look: 'photo', dark: true, when: 'mem_mBg' }, // 웃은 자국 (김 서린 거울, 나비 등불 온기로 드러남)
    mBb: { at: [9, 4], look: 'book', dark: false }, // 작문 「우리 할머니」 (수건 더미 사이 비닐에 싼 공책) — 사슬 머리
    mBc: { at: [10, 3], look: 'tray', dark: false, when: 'mem_mBa' }, // 깨진 안경 (세면대 위 빈 돋보기 받침)
    mBd: { at: [1, 3], look: 'paperstar', when: 'mem_mBe' }, // 하루 별 (환기창 아래 떨어진 야광 별)
    mBe: { at: [14, 3], look: 'cup', when: 'mem_mBc' }, // 먼저 감는 사람 (칫솔 컵의 빈자리)
    mBf: { at: [8, 4], look: 'gourd', when: 'mem_mBb' }, // 할머니 머리 감기 (꽃무늬 바가지)
    mBg: { at: [10, 5], look: 'pen', when: 'mem_mBf' }, // 눈썹 연필 주름 (세면대 밑 틈)
  },
  // 책장: 욕실에서 계단을 내려와 (SHELF_CHAIN)
  shelf: {
    m6a: { at: [22, 4], look: 'photo', when: 'door_d_bath_shelf' }, // 할머니의 곰 → 책장 앨범에서 삐져나온 흑백사진 (꼬마 순이와 곰돌이)
    m6b: { at: [22, 6], look: 'paperStrips', when: 'mem_m6a' }, // 서른 번의 인형 뽑기 → 놀이공원 동전 교환 영수증 뭉치
    m6c: { at: [33, 4], look: 'curtainPile', when: 'lamp_stage_lamp' }, // 토비 극장 → 걷힌 무대의 빨간 천 커튼 (무대 불을 켜면)
    m6d: { at: [28, 5], look: 'card', when: 'mem_m6f' }, // 극장 포스터 → 책장 옆면에서 반쯤 떨어진 크레용 포스터
    m6e: { at: [30, 4], look: 'book', when: 'mem_m6d' }, // 할머니의 대본 → 무대 바닥 대본 공책 「4화」
    m6f: { at: [20, 4], look: 'tickets', when: 'mem_m6g' }, // 열 장의 표 → 고무줄로 묶은 표 열 장
    m6g: { at: [21, 6], look: 'dustRing:four', when: 'mem_m6b' }, // 놀림 받은 날 → 인형 자리의 먼지 없는 네 동그라미
  },
  // 부엌 과자 서랍 (houseMap · layout_c.ts kitchenHouse('drawer')): 부엌 + 과자 서랍 속 단면 (DRAWER_CHAIN)
  drawer: {
    m7a: { at: [34, 7], look: 'cake', when: 'mem_m7f' }, // 일곱 개의 초 (서랍 안쪽 녹다 만 케이크 장식)
    m7b: { at: [37, 5], look: 'key', when: 'mem_m7a' }, // 멈춘 태엽 (서랍 구석의 부러진 열쇠 반쪽)
    m7c: { at: [1, 3], look: 'ribbon', when: 'mem_m7g' }, // 새 열쇠와 약속 (냉장고 옆면 자석 밑 빨간 리본)
    m7d: { at: [17, 9], look: 'xmasbox', when: 'musicbox_half' }, // 오르골 (식탁 위, 노래를 다시 울리면)
    m7e: { at: [9, 4], look: 'cup', when: 'mem_m7c' }, // 설거지하던 밤 (개수대 앞 신문지에 싼 할머니 머그)
    m7f: { at: [32, 9], look: 'honeycandy', when: 'drawer_open' }, // 서랍 속 비밀 (사탕 봉지)
    m7g: { at: [22, 3], look: 'apron', when: 'mem_m7b' }, // 할아버지의 열쇠 (앞치마 주머니 속 열쇠 꾸러미)
  },
  // 베란다 (13장 사람 크기 베란다: layout_d.ts) (BALCONY_CHAIN)
  balcony: {
    mVa: { at: [30, 6], look: 'nameStick', when: 'flower_watered' }, // 하루 꽃 (물을 주면 드러나는 할머니의 이름표)
    mVb: { at: [32, 3], look: 'feather', when: 'mem_mVa' }, // 까치야 까치야 (난간 밑 까치 깃털)
    mVc: { at: [22, 10], look: 'flowers', when: 'mem_mVe' }, // 졸업 꽃다발 (신문지 더미 사이 마른 리본)
    mVd: { at: [10, 4], look: 'foxBag', when: 'bag_down' }, // 서른 번째 (세탁기 위 놀이공원 여우 비닐봉지)
    mVe: { at: [19, 4], look: 'towel', when: 'mem_mVf' }, // 해진 이불 (건조대의 행주가 된 아기 이불 조각)
    mVf: { at: [15, 4], look: 'photo', when: 'mem_mVd' }, // 한복 입은 날 (「거실」 상자 속 가족사진 액자)
    mVg: { at: [29, 9], look: 'trowel', when: 'mem_mVb' }, // 모퉁이에서 기다릴게 (할머니 손때 묻은 꽃삽)
  },
  // 루루의 소파 밑 (14장 근접 지도: layout_d.ts) (SOFA_CHAIN)
  sofa: {
    mRa: { at: [5, 5], look: 'capsule', when: 'ruru_led' }, // 유리 상자 속 (보물 상자 속 뽑기 캡슐 — 루루가 아지트를 보여 주면)
    mRb: { at: [4, 7], look: 'furTuft', when: 'mem_mRa' }, // 꼬리 세 번 (빨간 실로 묶은 여우 털 세 가닥)
    mRc: { at: [37, 4], look: 'scratcherTip', when: 'mem_mRe' }, // 소파 밑 일주일 (효자손 끝 고무)
    mRd: { at: [19, 4], look: 'threadRed', when: 'mem_mRc' }, // 두 번째 바느질 (빨간 실 한 토막)
    mRe: { at: [25, 16], look: 'penCap', when: 'mem_mRb' }, // 루루가 그랬어 (수성펜 뚜껑)
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
  // 토비의 태엽 속 (근접 · 환상 지도, layout_e.ts): 메아리를 따라가면 그 나이의 물건이 드러난다
  tobykey: {
    mTa: at([2, 8], 'stitchPatch'), // 짝짝이 귀 (반쯤 접힌 귀 안쪽 바느질 땀)
    mTb: { at: [19, 10], look: 'echo:5,lit', when: 'echo_5' }, // 오늘 제일 좋았던 거 (다섯 살 메아리)
    mTc: { at: [26, 13], look: 'lint', when: 'echo_12' }, // 계단에서 (외투 주머니 실밥)
    mTd: { at: [29, 7], look: 'tape', when: 'echo_13' }, // 뚜껑 너머 (「열지 마」 쪽지 테이프 자국)
    mTe: { at: [22, 15], look: 'echo:note,lit', when: 'echo_14', dark: false }, // 끝이 기억 안 나는 노래 (오르골 음의 메아리)
    mTf: { at: [18, 4], look: 'keyAxle', when: 'tb_wound' }, // 기다리는 사람 (할머니가 고친 새 열쇠 축)
  },
  // (장난감 상자 → ch9.ts)
  // 보리의 찬장 (houseMap · layout_c.ts kitchenHouse('cupboard')): 부엌 + 찬장 속 3단 선반 단면
  cupboard: {
    mOa: { at: [36, 13], look: 'button', when: 'honey_open' }, // 곰돌이 (단추 통의 낡은 검은 단추 하나)
    mOg: at([31, 2], 'basket'), // 까치밥 (말린 감 껍질 봉지)
    mOb: at([31, 13], 'lunchbox'), // 가져가는 짐 (옛 양철 도시락)
    mOc: at([37, 12], 'cup'), // 꿀차와 그네 (꿀단지 옆 꿀차 잔)
    mOd: at([35, 8], 'bowl'), // 은주의 곰 (그릇 탑 맨 밑 어린이 밥그릇)
    mOe: at([34, 2], 'tray'), // 빈 의자 앞의 꿀차 (놋수저 두 벌)
    mOf: at([33, 14], 'sewing'), // 곰돌이의 마지막 밤 (참기름병 옆 실패)
  },
  // 할머니의 재봉 상자 (근접 지도, layout_e.ts): 엉킨 실의 매듭을 풀 때마다 드러난다
  sewbox: {
    mGa: at([2, 6], 'clinicCard'), // 진찰실 (진료 카드)
    mGb: { at: [13, 8], look: 'medPouch', when: 'knot1' }, // 비밀로 해 다오 (접힌 약봉지)
    mGc: { at: [7, 6], look: 'button', when: 'doll_eyes' }, // 눈을 뜬 인형 (여분 눈 단추)
    mGd: { at: [2, 17], look: 'crumpledLetters', when: 'knot2', dark: false }, // 찢어진 편지지
    mGe: { at: [20, 18], look: 'whiteScrap', when: 'knot4', dark: true }, // 토비에게 (토비 털 같은 하얀 천 조각)
    mGf: { at: [12, 18], look: 'tapeMeasure', when: 'knot3' }, // 마지막 산책 (하루 키 눈금에 실 매듭)
    mGg: { at: [28, 17], look: 'yarn', when: 'sewn' }, // 다시 뜨면 된다 (목도리와 이어진 노란 털실 끝)
  },
  // (에필로그 · 새 방 → ch_epilogue.ts)
};
