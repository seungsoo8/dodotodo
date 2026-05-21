export default function SupportPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px', fontFamily: 'sans-serif', lineHeight: 1.8, color: '#222' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Plenio 고객지원</h1>
      <p style={{ color: '#666', marginBottom: 40 }}>문의사항이 있으시면 아래 이메일로 연락해 주세요.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 12 }}>일반 문의</h2>
      <p>
        이메일:{' '}
        <a href="mailto:firstedn@naver.com" style={{ color: '#6366f1' }}>
          firstedn@naver.com
        </a>
      </p>
      <p>문의 후 영업일 기준 1~2일 내로 답변드립니다.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 40, marginBottom: 12 }}>비즈니스 문의</h2>
      <p>제휴, 광고, 협업 등 비즈니스 관련 문의는 아래로 연락해 주세요.</p>
      <p>
        이메일:{' '}
        <a href="mailto:firstedn@naver.com" style={{ color: '#6366f1' }}>
          firstedn@naver.com
        </a>
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 40, marginBottom: 12 }}>계정 및 데이터 삭제</h2>
      <p>계정과 모든 관련 데이터를 삭제하려면 아래 방법 중 하나를 이용해 주세요.</p>
      <ul style={{ paddingLeft: 20, marginTop: 12, marginBottom: 12 }}>
        <li style={{ marginBottom: 8 }}>
          <strong>앱 내 삭제:</strong> 설정 → 계정 → 회원 탈퇴
        </li>
        <li style={{ marginBottom: 8 }}>
          <strong>이메일 요청:</strong>{' '}
          <a href="mailto:firstedn@naver.com?subject=계정 삭제 요청" style={{ color: '#6366f1' }}>
            firstedn@naver.com
          </a>
          으로 "계정 삭제 요청" 제목으로 보내주세요.
        </li>
      </ul>
      <p style={{ color: '#666', fontSize: 14 }}>삭제 요청 시 계정, 할 일, 습관, 통계 등 모든 데이터가 영구적으로 삭제됩니다.</p>

      <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 40, marginBottom: 12 }}>자주 묻는 질문</h2>

      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Q. 로그인이 안 돼요.</h3>
      <p style={{ marginBottom: 24 }}>Google 계정으로만 로그인할 수 있습니다. 인터넷 연결 상태를 확인하고 다시 시도해 주세요.</p>

      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Q. 다른 기기에서 데이터가 보이지 않아요.</h3>
      <p style={{ marginBottom: 24 }}>같은 Google 계정으로 로그인하면 실시간으로 동기화됩니다. 로그인 여부를 확인해 주세요.</p>

      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Q. 데이터를 삭제하고 싶어요.</h3>
      <p style={{ marginBottom: 24 }}>설정 → 데이터 초기화에서 모든 데이터를 삭제할 수 있습니다. 또는 위 이메일로 삭제 요청을 보내주세요.</p>

      <p style={{ marginTop: 48 }}>
        <a href="/privacy" style={{ color: '#6366f1' }}>개인정보처리방침 보기</a>
      </p>
    </main>
  );
}
