'use client';

interface Props {
  storeUrl: string;
}

function openStore(url: string) {
  window.open(url, '_system');
}

export default function ForceUpdateModal({ storeUrl }: Props) {
  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.75)' }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-7 flex flex-col items-center text-center gap-4"
        style={{ background: 'var(--card)', boxShadow: '0 24px 80px rgba(0,0,0,0.4)' }}
      >
        <div className="text-5xl">🚀</div>

        <div>
          <h2 className="text-lg font-bold mb-1.5" style={{ color: 'var(--text)' }}>
            새 버전이 출시됐어요
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            더 나은 서비스를 위해 앱을 최신 버전으로 업데이트해 주세요.
          </p>
        </div>

        <button
          onClick={() => openStore(storeUrl)}
          className="w-full py-3.5 rounded-2xl text-sm font-bold text-white mt-1 transition-opacity active:opacity-80"
          style={{ background: 'var(--accent)' }}
        >
          App Store에서 업데이트하기
        </button>
      </div>
    </div>
  );
}
