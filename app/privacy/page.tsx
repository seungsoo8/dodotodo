export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px', fontFamily: 'sans-serif', lineHeight: 1.8, color: '#222' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>개인정보처리방침</h1>
      <p style={{ color: '#666', marginBottom: 40 }}>시행일: 2026년 5월 18일</p>

      <p>
        DoDoTODO(이하 "앱")는 이용자의 개인정보를 소중히 여기며, 개인정보 보호법 및 관련 법령을 준수합니다.
        본 방침은 앱이 수집하는 정보와 그 사용 방법을 설명합니다.
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 40, marginBottom: 12 }}>1. 수집하는 정보</h2>
      <p>앱은 Google 계정으로 로그인 시 다음 정보를 수집합니다:</p>
      <ul>
        <li>Google 계정 이름</li>
        <li>이메일 주소</li>
        <li>프로필 사진</li>
      </ul>
      <p>또한 앱 사용 중 생성되는 다음 데이터를 저장합니다:</p>
      <ul>
        <li>할 일 목록, 프로젝트, 태그, 설정 등 앱 내 데이터</li>
      </ul>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 40, marginBottom: 12 }}>2. 정보 이용 목적</h2>
      <ul>
        <li>회원 식별 및 로그인 서비스 제공</li>
        <li>기기 간 데이터 실시간 동기화</li>
        <li>앱 기능 제공 및 개선</li>
      </ul>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 40, marginBottom: 12 }}>3. 정보 저장 및 보호</h2>
      <p>
        수집된 정보는 Google Firebase(Firestore)에 저장되며, Google의 보안 정책에 따라 보호됩니다.
        앱은 이용자의 개인정보를 제3자에게 판매하거나 공유하지 않습니다.
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 40, marginBottom: 12 }}>4. 제3자 서비스</h2>
      <p>앱은 다음 제3자 서비스를 사용합니다:</p>
      <ul>
        <li>
          <strong>Google Firebase</strong> — 인증 및 데이터 저장
          <br />
          <a href="https://firebase.google.com/support/privacy" style={{ color: '#6366f1' }} target="_blank" rel="noreferrer">
            Firebase 개인정보처리방침
          </a>
        </li>
        <li>
          <strong>Google Sign-In</strong> — 소셜 로그인
          <br />
          <a href="https://policies.google.com/privacy" style={{ color: '#6366f1' }} target="_blank" rel="noreferrer">
            Google 개인정보처리방침
          </a>
        </li>
      </ul>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 40, marginBottom: 12 }}>5. 데이터 삭제</h2>
      <p>
        이용자는 언제든지 앱 내 설정에서 계정 데이터를 삭제하거나,
        아래 이메일로 삭제를 요청할 수 있습니다.
        요청 후 30일 이내에 처리됩니다.
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 40, marginBottom: 12 }}>6. 문의</h2>
      <p>
        개인정보 관련 문의사항은 아래로 연락해 주세요.
        <br />
        이메일:{' '}
        <a href="mailto:firstedn@naver.com" style={{ color: '#6366f1' }}>
          firstedn@naver.com
        </a>
      </p>

      <p style={{ marginTop: 48, color: '#999', fontSize: 14 }}>
        본 방침은 서비스 변경에 따라 업데이트될 수 있으며, 변경 시 앱 내 공지를 통해 안내합니다.
      </p>
    </main>
  );
}
