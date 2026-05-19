'use client';

import { useState } from 'react';
import { AppSettings } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';

const CURRENT_VERSION = '2.26'; // deploy:version
import { Priority, SortOrder, ViewType } from '@/types/todo';

interface Props {
  settings: AppSettings;
  onUpdate: <K extends keyof AppSettings>(section: K, values: Partial<AppSettings[K]>) => void;
  onReset: () => void;
  onClearCompleted: () => void;
  onClearAll?: () => void;
  onNavigate?: (v: ViewType) => void;
  trashCount?: number;
  userProfile?: { nickname: string; profileIcon: string };
  onEditProfile?: () => void;
}

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'high', label: '높음' },
  { value: 'medium', label: '보통' },
  { value: 'low', label: '낮음' },
];

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'manual', label: '직접 정렬' },
  { value: 'priority', label: '우선순위' },
  { value: 'dueDate', label: '마감일' },
  { value: 'createdAt', label: '생성일' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: 'var(--muted)' }}>
        {title}
      </h2>
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        {children}
      </div>
    </div>
  );
}

function Row({
  label,
  description,
  children,
  last,
  onClick,
}: {
  label: string;
  description?: string;
  children?: React.ReactNode;
  last?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 px-4 py-3"
      style={{
        borderBottom: last ? 'none' : '1px solid var(--border)',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</p>
        {description && <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{description}</p>}
      </div>
      {children && <div className="flex-shrink-0">{children}</div>}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onChange(!value); }}
      className="relative w-11 h-6 rounded-full transition-colors duration-200"
      style={{ background: value ? 'var(--accent)' : 'var(--border)' }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: value ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  );
}

function NumberStepper({
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        className="w-7 h-7 rounded-full flex items-center justify-center text-lg font-bold transition-colors"
        style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
      >
        −
      </button>
      <span className="text-sm font-semibold w-14 text-center" style={{ color: 'var(--text)' }}>
        {value}{unit}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + step))}
        className="w-7 h-7 rounded-full flex items-center justify-center text-lg font-bold transition-colors"
        style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
      >
        +
      </button>
    </div>
  );
}

// iOS 스타일 확인 시트
function ConfirmSheet({
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm mx-4 mb-8 rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 text-center" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>{message}</p>
        </div>
        <button
          onClick={onConfirm}
          className="w-full py-4 text-sm font-semibold transition-colors active:opacity-70"
          style={{ color: 'var(--destructive)', borderBottom: '1px solid var(--border)' }}
        >
          {confirmLabel}
        </button>
        <button
          onClick={onCancel}
          className="w-full py-4 text-sm font-medium transition-colors active:opacity-70"
          style={{ color: 'var(--muted)' }}
        >
          취소
        </button>
      </div>
    </div>
  );
}

type ConfirmType = 'clear' | 'reset' | 'logout' | 'clearAll' | 'deleteAccount';

const CONFIRM_CONFIG: Record<ConfirmType, { message: string; label: string }> = {
  clear:         { message: '완료된 할 일을 모두 삭제할까요?\n삭제 후 복구할 수 없어요.', label: '전체 삭제' },
  reset:         { message: '모든 설정을 초기값으로 되돌릴까요?', label: '설정 초기화' },
  logout:        { message: '로그아웃 하시겠어요?', label: '로그아웃' },
  clearAll:      { message: '계정의 모든 할 일과 기록을 삭제할까요?\n삭제 후 복구할 수 없어요.', label: '전체 초기화' },
  deleteAccount: { message: '계정을 영구 삭제할까요?\n모든 데이터가 즉시 삭제되며 복구할 수 없어요.', label: '회원 탈퇴' },
};

type PcTab = '계정' | '포모도로' | '알림' | '기본값' | '추가 뷰' | '데이터' | '앱 정보';

const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID ?? '';

export default function SettingsView({ settings, onUpdate, onReset, onClearCompleted, onClearAll, onNavigate, trashCount = 0, userProfile, onEditProfile }: Props) {
  const { user, signOut, deleteAccount } = useAuth();
  const isAdmin = !!user && !!ADMIN_UID && user.uid === ADMIN_UID;
  const [confirmType, setConfirmType] = useState<ConfirmType | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [pcTab, setPcTab] = useState<PcTab>('계정');
  const [uidCopied, setUidCopied] = useState(false);

  function handleCopyUid() {
    if (!user?.uid) return;
    navigator.clipboard.writeText(user.uid).then(() => {
      setUidCopied(true);
      setTimeout(() => setUidCopied(false), 2000);
    }).catch(() => {});
  }

  async function handleConfirm() {
    if (!confirmType) return;
    if (confirmType === 'clear') onClearCompleted();
    else if (confirmType === 'reset') onReset();
    else if (confirmType === 'logout') signOut();
    else if (confirmType === 'clearAll') { onClearAll?.(); signOut(); }
    else if (confirmType === 'deleteAccount') {
      setConfirmType(null);
      setDeletingAccount(true);
      try {
        await deleteAccount();
      } catch {
        setDeletingAccount(false);
      }
      return;
    }
    setConfirmType(null);
  }

  const GoogleIcon = () => (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );

  const AppleIcon = () => (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--text)' }}>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.32.07 2.24.74 3.02.78 1.15-.21 2.24-.9 3.47-.77 1.47.16 2.57.71 3.29 1.81-3.01 1.81-2.3 5.77.49 6.9-.57 1.49-1.3 2.97-2.27 4.16zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );

  const ChevronRight = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--muted)', opacity: 0.5 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );

  const accountSection = (
    <Section title="계정">
      {userProfile?.nickname && (
        <Row label="닉네임" description="프로필에 표시되는 이름">
          <div className="flex items-center gap-2">
            <span className="text-base">{userProfile.profileIcon}</span>
            <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{userProfile.nickname}</span>
            {onEditProfile && (
              <button
                onClick={onEditProfile}
                className="text-xs px-2 py-1 rounded-lg"
                style={{ background: 'var(--accent-muted, rgba(99,102,241,0.1))', color: 'var(--accent)' }}
              >
                편집
              </button>
            )}
          </div>
        </Row>
      )}
      <Row label={user?.displayName ?? user?.email ?? '사용자'} description={user?.displayName ? (user?.email ?? '') : ''}>
        <div className="flex items-center gap-2">
          {user?.providerData[0]?.providerId === 'google.com' && <GoogleIcon />}
          {user?.providerData[0]?.providerId === 'apple.com' && <AppleIcon />}
          {user?.photoURL && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoURL} alt="프로필" className="w-9 h-9 rounded-full" referrerPolicy="no-referrer" />
          )}
        </div>
      </Row>
      <Row
        label="사용자 ID"
        onClick={handleCopyUid}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono break-all text-right" style={{ color: 'var(--muted)', maxWidth: 180 }}>{user?.uid ?? ''}</span>
          <span className="text-xs flex-shrink-0 transition-colors" style={{ color: uidCopied ? '#10b981' : 'var(--accent)' }}>
            {uidCopied ? '복사됨 ✓' : '복사'}
          </span>
        </div>
      </Row>
      <Row label="회원 탈퇴" description="계정과 모든 데이터를 영구 삭제합니다" last>
        <button
          onClick={() => setConfirmType('deleteAccount')}
          disabled={deletingAccount}
          className="px-3 py-1 text-xs rounded-lg disabled:opacity-40"
          style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
        >
          {deletingAccount ? '처리 중...' : '탈퇴'}
        </button>
      </Row>
    </Section>
  );

  const pomodoroSection = (
    <Section title="포모도로 타이머">
      <Row label="작업 시간" description="집중 세션 길이">
        <NumberStepper value={settings.pomodoro.work} min={5} max={90} step={5} unit="분" onChange={v => onUpdate('pomodoro', { work: v })} />
      </Row>
      <Row label="휴식 시간" description="짧은 휴식 길이" last>
        <NumberStepper value={settings.pomodoro.break} min={1} max={30} step={1} unit="분" onChange={v => onUpdate('pomodoro', { break: v })} />
      </Row>
    </Section>
  );

  const notificationSection = (
    <Section title="알림">
      <Row label="알림 활성화" description="마감일 기반 로컬 알림">
        <Toggle value={settings.notifications.enabled} onChange={v => onUpdate('notifications', { enabled: v })} />
      </Row>
      <Row label="알림 시간" description="마감 당일 알림을 받을 시각">
        <NumberStepper
          value={settings.notifications.notificationHour ?? 9}
          min={0} max={23} step={1} unit="시"
          onChange={v => onUpdate('notifications', { notificationHour: v })}
        />
      </Row>
      <Row label="사전 알림" description="마감 며칠 전에도 알릴지" last>
        <NumberStepper
          value={Math.round(settings.notifications.minutesBeforeDue / (60 * 24))}
          min={0} max={7} step={1} unit="일 전"
          onChange={v => onUpdate('notifications', { minutesBeforeDue: v * 60 * 24 })}
        />
      </Row>
    </Section>
  );

  const defaultsSection = (
    <Section title="새 할 일 기본값">
      <Row label="기본 우선순위">
        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
          {PRIORITY_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => onUpdate('defaults', { priority: opt.value })}
              className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
              style={{ background: settings.defaults.priority === opt.value ? 'var(--accent)' : 'var(--accent-muted)', color: settings.defaults.priority === opt.value ? 'white' : 'var(--muted)' }}>
              {opt.label}
            </button>
          ))}
        </div>
      </Row>
      <Row label="기본 정렬" last>
        <select value={settings.defaults.sortOrder} onChange={e => onUpdate('defaults', { sortOrder: e.target.value as SortOrder })}
          onClick={e => e.stopPropagation()} className="text-sm rounded-lg px-2 py-1.5"
          style={{ background: 'var(--accent-muted)', color: 'var(--text)', border: 'none', outline: 'none' }}>
          {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </Row>
    </Section>
  );

  const viewsSection = (
    <Section title="추가 뷰">
      <Row label="우선순위 매트릭스" description="긴급/중요 4분면으로 할 일 분류 (목록 탭에서 전환)">
        <Toggle value={settings.views?.matrix ?? false} onChange={v => onUpdate('views', { matrix: v })} />
      </Row>
      <Row label="칸반 보드" description="할 일 / 진행 중 / 완료 컬럼 뷰 (목록 탭에서 전환)" last>
        <Toggle value={settings.views?.kanban ?? false} onChange={v => onUpdate('views', { kanban: v })} />
      </Row>
    </Section>
  );

  const dataSection = (
    <Section title="데이터">
      <Row label="완료된 할 일 전체 삭제" description="복구 불가">
        <button onClick={() => setConfirmType('clear')} className="px-3 py-1 text-xs rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>삭제</button>
      </Row>
      <Row label="계정 데이터 전체 초기화" description="모든 할 일과 기록 삭제 · 복구 불가" last>
        <button onClick={() => setConfirmType('clearAll')} className="px-3 py-1 text-xs rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>초기화</button>
      </Row>
    </Section>
  );

  const navSection = onNavigate && (
    <Section title="바로가기">
      <Row label="휴지통" description={trashCount > 0 ? `${trashCount}개 항목` : '삭제된 할 일'} onClick={() => onNavigate('trash')}>
        <div className="flex items-center gap-2">
          {trashCount > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>{trashCount}</span>}
          <ChevronRight />
        </div>
      </Row>
      <Row label="사용 설명서" description="기능 안내 및 도움말" onClick={() => onNavigate('help')}><ChevronRight /></Row>
      <Row label="패치노트" description="버전별 업데이트 내역" last={!isAdmin} onClick={() => onNavigate('patchnotes')}><ChevronRight /></Row>
      {isAdmin && (
        <Row label="관리자 대시보드" description="유저 현황 및 통계" last onClick={() => onNavigate('admin')}>
          <span style={{ color: '#f59e0b' }}>🛡️</span>
        </Row>
      )}
    </Section>
  );

  const actionButtons = (
    <div className="flex flex-wrap gap-3 mt-2">
      <button onClick={() => setConfirmType('reset')} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: 'var(--accent-muted)', color: 'var(--muted)' }}>설정 초기화</button>
    </div>
  );

  const actionButtonsMobile = (
    <div className="space-y-3 mt-2">
      <button onClick={() => setConfirmType('reset')} className="w-full py-3 rounded-xl text-sm font-medium" style={{ background: 'var(--accent-muted)', color: 'var(--muted)' }}>설정 초기화</button>
      <button onClick={() => setConfirmType('logout')} className="w-full py-3 rounded-xl text-sm font-medium" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>로그아웃</button>
    </div>
  );

  const PC_TABS: { key: PcTab; icon: string }[] = [
    { key: '계정', icon: '👤' },
    { key: '포모도로', icon: '🍅' },
    { key: '알림', icon: '🔔' },
    { key: '기본값', icon: '⚙️' },
    { key: '추가 뷰', icon: '🗂️' },
    { key: '데이터', icon: '🗑️' },
    { key: '앱 정보', icon: 'ℹ️' },
  ];

  const pcContent: Record<PcTab, React.ReactNode> = {
    계정: <>{accountSection}{actionButtons}</>,
    포모도로: pomodoroSection,
    알림: notificationSection,
    기본값: defaultsSection,
    '추가 뷰': viewsSection,
    데이터: dataSection,
    '앱 정보': (
      <Section title="앱 정보">
        <Row label="버전"><span className="text-sm" style={{ color: 'var(--muted)' }}>ver {CURRENT_VERSION}</span></Row>
        <Row label="비즈니스 문의" last>
          <a href="mailto:firstedn@naver.com" className="text-sm" style={{ color: 'var(--accent)' }}>firstedn@naver.com</a>
        </Row>
      </Section>
    ),
  };

  const confirmSheet = confirmType && (
    <ConfirmSheet
      message={CONFIRM_CONFIG[confirmType].message}
      confirmLabel={CONFIRM_CONFIG[confirmType].label}
      onConfirm={handleConfirm}
      onCancel={() => setConfirmType(null)}
    />
  );

  return (
    <>
      {/* 모바일 레이아웃 */}
      <div className="md:hidden max-w-lg mx-auto px-4 py-6">
        <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--text)' }}>설정</h1>
        {navSection}
        {accountSection}
        {pomodoroSection}
        {notificationSection}
        {defaultsSection}
        {viewsSection}
        {dataSection}
        <Section title="앱 정보">
          <Row label="버전"><span className="text-sm" style={{ color: 'var(--muted)' }}>ver {CURRENT_VERSION}</span></Row>
          <Row label="비즈니스 문의" last>
            <a href="mailto:firstedn@naver.com" className="text-sm" style={{ color: 'var(--accent)' }}>firstedn@naver.com</a>
          </Row>
        </Section>
        {actionButtonsMobile}
        {confirmSheet}
      </div>

      {/* PC 웹 레이아웃: 좌측 탭 + 우측 내용 */}
      <div className="hidden md:flex h-full overflow-hidden">
        {/* 좌측 네비게이션 */}
        <div className="w-56 flex-shrink-0 overflow-y-auto py-8 px-3" style={{ borderRight: '1px solid var(--border)', background: 'var(--card)' }}>
          {/* 사용자 프로필 미니 카드 */}
          <div className="flex items-center gap-2.5 px-3 py-3 rounded-xl mb-4" style={{ background: 'var(--bg)' }}>
            {user?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoURL} alt="프로필" className="w-8 h-8 rounded-full flex-shrink-0" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
                style={{ background: 'var(--accent)' }}>
                {(user?.displayName ?? user?.email ?? '?')[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{user?.displayName ?? '사용자'}</p>
              <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>{user?.email ?? ''}</p>
            </div>
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-3" style={{ color: 'var(--muted)' }}>설정</p>
          <nav className="space-y-0.5">
            {PC_TABS.map(({ key, icon }) => (
              <button
                key={key}
                onClick={() => setPcTab(key)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
                style={{
                  background: pcTab === key ? 'var(--accent-muted)' : 'transparent',
                  color: pcTab === key ? 'var(--accent)' : 'var(--text)',
                }}
              >
                <span className="text-base">{icon}</span>
                <span>{key}</span>
              </button>
            ))}
          </nav>

          {onNavigate && (
            <>
              <div className="my-4 mx-3 h-px" style={{ background: 'var(--border)' }} />
              <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-3" style={{ color: 'var(--muted)' }}>바로가기</p>
              <button onClick={() => onNavigate('help')} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left transition-colors hover:opacity-80" style={{ color: 'var(--text)' }}>
                <span className="text-base">❓</span><span>사용 설명서</span>
              </button>
              <button onClick={() => onNavigate('patchnotes')} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left transition-colors hover:opacity-80" style={{ color: 'var(--text)' }}>
                <span className="text-base">📋</span><span>패치노트</span>
              </button>
            </>
          )}

          {/* 하단 로그아웃 */}
          <div className="mt-6 mx-3 h-px mb-4" style={{ background: 'var(--border)' }} />
          <button onClick={() => setConfirmType('logout')} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left transition-colors"
            style={{ color: '#ef4444' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            로그아웃
          </button>
        </div>

        {/* 우측 내용 */}
        <div className="flex-1 overflow-y-auto">
          {/* 내용 헤더 */}
          <div className="flex items-center px-8 h-12 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{pcTab}</h2>
          </div>
          <div className="px-8 py-7" style={{ maxWidth: 720 }}>
            {pcContent[pcTab]}
          </div>
        </div>

        {confirmSheet}
      </div>
    </>
  );
}
