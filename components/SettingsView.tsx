'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { User, Timer, Bell, SlidersHorizontal, Layers, Database, Info, HelpCircle, FileText, LogOut } from 'lucide-react';
import { AppSettings } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';

const CURRENT_VERSION = '2.33'; // deploy:version
import { SortOrder, ViewType } from '@/types/todo';

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
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm mx-4 mb-8 md:mb-0 rounded-2xl overflow-hidden"
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
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}

type ConfirmType = 'clear' | 'reset' | 'logout' | 'clearAll' | 'deleteAccount';

type PcTabKey = 'account' | 'pomodoro' | 'notifications' | 'defaults' | 'extraViews' | 'data' | 'appInfo';

type PcTab = PcTabKey;

const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID ?? '';

export default function SettingsView({ settings, onUpdate, onReset, onClearCompleted, onClearAll, onNavigate, trashCount = 0, userProfile, onEditProfile }: Props) {
  const { user, signOut, deleteAccount } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const isAdmin = !!user && !!ADMIN_UID && user.uid === ADMIN_UID;
  const [confirmType, setConfirmType] = useState<ConfirmType | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [pcTab, setPcTab] = useState<PcTab>('account');
  const [uidCopied, setUidCopied] = useState(false);
  const [notifGranted, setNotifGranted] = useState<boolean | null>(null);

  const isNativeApp = Capacitor.isNativePlatform();

  async function checkNotifPermission() {
    if (isNativeApp) {
      try {
        const perm = await LocalNotifications.checkPermissions();
        setNotifGranted(perm.display === 'granted');
      } catch {
        setNotifGranted(false);
      }
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifGranted(Notification.permission === 'granted');
    } else {
      setNotifGranted(null);
    }
  }

  useEffect(() => {
    checkNotifPermission();
    // 앱이 포그라운드로 돌아왔을 때 OS 설정 변경 반영
    let handle: { remove: () => void } | null = null;
    if (isNativeApp) {
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) checkNotifPermission();
      }).then(h => { handle = h; });
    } else {
      const onVisibility = () => { if (!document.hidden) checkNotifPermission(); };
      document.addEventListener('visibilitychange', onVisibility);
      return () => document.removeEventListener('visibilitychange', onVisibility);
    }
    return () => { handle?.remove(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openOsNotifSettings() {
    if (Capacitor.getPlatform() === 'ios') {
      window.open('app-settings:', '_system');
    } else {
      // Android: 앱 상세 설정 페이지로 이동
      window.open('intent:#Intent;action=android.settings.APP_NOTIFICATION_SETTINGS;i.android.provider.extra.APP_UID=vito.dodotodo.com;end', '_system');
    }
  }

  async function handleNotifToggle() {
    if (isNativeApp) {
      if (!notifGranted) {
        const result = await LocalNotifications.requestPermissions().catch(() => ({ display: 'denied' as const }));
        if (result.display === 'granted') {
          setNotifGranted(true);
        } else {
          // 이미 거부됨 → OS 설정으로 이동
          openOsNotifSettings();
        }
      } else {
        // 허용 상태 → OS 설정에서만 끌 수 있음
        openOsNotifSettings();
      }
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      if (!notifGranted) {
        const result = await Notification.requestPermission();
        setNotifGranted(result === 'granted');
      }
      // 웹에서 이미 허용 or 거부 → 브라우저 주소창 자물쇠 아이콘에서 변경 가능
    }
  }

  const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
    { value: 'manual', label: t.sort.manual },
    { value: 'dueDate', label: t.sort.dueDate },
    { value: 'createdAt', label: t.sort.createdAt },
  ];
  const CONFIRM_CONFIG: Record<ConfirmType, { message: string; label: string }> = {
    clear:         { message: t.settings.confirmDeleteCompleted, label: t.settings.deleteCompleted },
    reset:         { message: t.settings.confirmReset,           label: t.settings.resetSettings },
    logout:        { message: t.settings.confirmLogout,          label: t.settings.logout },
    clearAll:      { message: t.settings.confirmClearAll,        label: t.settings.clearAll },
    deleteAccount: { message: t.settings.confirmDeleteAccount,   label: t.settings.deleteAccount },
  };
  const PC_TABS: { key: PcTab; icon: React.ReactNode; label: string }[] = [
    { key: 'account',       icon: <User className="w-4 h-4" />,              label: t.settings.tabAccount },
    { key: 'pomodoro',      icon: <Timer className="w-4 h-4" />,             label: t.settings.tabPomodoro },
    { key: 'notifications', icon: <Bell className="w-4 h-4" />,              label: t.settings.tabNotifications },
    { key: 'defaults',      icon: <SlidersHorizontal className="w-4 h-4" />, label: t.settings.tabDefaults },
    { key: 'extraViews',    icon: <Layers className="w-4 h-4" />,            label: t.settings.tabExtraViews },
    { key: 'data',          icon: <Database className="w-4 h-4" />,          label: t.settings.tabData },
    { key: 'appInfo',       icon: <Info className="w-4 h-4" />,              label: t.settings.tabAppInfo },
  ];

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
    <Section title={t.settings.account}>
      {userProfile?.nickname && (
        <Row label={t.settings.nickname} description={t.settings.nicknameDesc}>
          <div className="flex items-center gap-2">
            <span className="text-base">{userProfile.profileIcon}</span>
            <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{userProfile.nickname}</span>
            {onEditProfile && (
              <button
                onClick={onEditProfile}
                className="text-xs px-2 py-1 rounded-lg"
                style={{ background: 'var(--accent-muted, rgba(99,102,241,0.1))', color: 'var(--accent)' }}
              >
                {t.settings.editLabel}
              </button>
            )}
          </div>
        </Row>
      )}
      <Row label={user?.displayName ?? user?.email ?? t.settings.defaultUser} description={user?.displayName ? (user?.email ?? '') : ''}>
        <div className="flex items-center gap-2">
          {user?.providerData[0]?.providerId === 'google.com' && <GoogleIcon />}
          {user?.providerData[0]?.providerId === 'apple.com' && <AppleIcon />}
          {user?.photoURL && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full" referrerPolicy="no-referrer" />
          )}
        </div>
      </Row>
      <Row label={t.settings.userId} onClick={handleCopyUid}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono break-all text-right" style={{ color: 'var(--muted)', maxWidth: 180 }}>{user?.uid ?? ''}</span>
          <span className="text-xs flex-shrink-0 transition-colors" style={{ color: uidCopied ? '#10b981' : 'var(--accent)' }}>
            {uidCopied ? t.settings.copied : t.settings.copy}
          </span>
        </div>
      </Row>
      <Row label={t.settings.deleteAccount} description={t.settings.confirmDeleteAccount} last>
        <button
          onClick={() => setConfirmType('deleteAccount')}
          disabled={deletingAccount}
          className="px-3 py-1 text-xs rounded-lg disabled:opacity-40"
          style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
        >
          {deletingAccount ? t.settings.processing : t.settings.withdraw}
        </button>
      </Row>
    </Section>
  );

  const pomodoroSection = (
    <Section title={t.settings.pomodoro}>
      <Row label={t.settings.workTime} description={t.settings.workTimeDesc}>
        <NumberStepper value={settings.pomodoro.work} min={5} max={90} step={5} unit={t.settings.minutes} onChange={v => onUpdate('pomodoro', { work: v })} />
      </Row>
      <Row label={t.settings.breakTime} description={t.settings.breakTimeDesc} last>
        <NumberStepper value={settings.pomodoro.break} min={1} max={30} step={1} unit={t.settings.minutes} onChange={v => onUpdate('pomodoro', { break: v })} />
      </Row>
    </Section>
  );

  const notifToggleDesc = notifGranted === null
    ? t.settings.notifDesc
    : notifGranted
      ? (isNativeApp ? t.settings.notifGrantedNative : t.settings.notifGrantedWeb)
      : (isNativeApp ? t.settings.notifDeniedNative : t.settings.notifDeniedWeb);

  const notificationSection = (
    <Section title={t.settings.notifications}>
      {notifGranted !== null && (
        <Row label={t.settings.enableNotifications} description={notifToggleDesc}>
          <button
            type="button"
            onClick={handleNotifToggle}
            className="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
            style={{ background: notifGranted ? 'var(--accent)' : 'var(--border)' }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
              style={{ transform: notifGranted ? 'translateX(20px)' : 'translateX(0)' }}
            />
          </button>
        </Row>
      )}
      <Row label={t.settings.notificationHour} description={t.settings.notifHourDesc}>
        <NumberStepper
          value={settings.notifications.notificationHour ?? 9}
          min={0} max={23} step={1} unit={t.settings.hoursUnit}
          onChange={v => onUpdate('notifications', { notificationHour: v })}
        />
      </Row>
      <Row label={t.settings.advanceNotice} description={t.settings.advanceDesc} last>
        <NumberStepper
          value={Math.round(settings.notifications.minutesBeforeDue / (60 * 24))}
          min={0} max={7} step={1} unit={t.settings.daysUnit}
          onChange={v => onUpdate('notifications', { minutesBeforeDue: v * 60 * 24 })}
        />
      </Row>
    </Section>
  );

  const defaultsSection = (
    <Section title={t.settings.defaults}>
      <Row label={t.settings.defaultSort} last>
        <select value={settings.defaults.sortOrder} onChange={e => onUpdate('defaults', { sortOrder: e.target.value as SortOrder })}
          onClick={e => e.stopPropagation()} className="text-sm rounded-lg px-2 py-1.5"
          style={{ background: 'var(--accent-muted)', color: 'var(--text)', border: 'none', outline: 'none' }}>
          {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </Row>
    </Section>
  );

  const viewsSection = (
    <Section title={t.settings.views}>
      <Row label={t.settings.matrixView} description={t.settings.matrixDesc}>
        <Toggle value={settings.views?.matrix ?? false} onChange={v => onUpdate('views', { matrix: v })} />
      </Row>
      <Row label={t.settings.kanbanView} description={t.settings.kanbanDesc} last>
        <Toggle value={settings.views?.kanban ?? false} onChange={v => onUpdate('views', { kanban: v })} />
      </Row>
    </Section>
  );

  const dataSection = (
    <Section title={t.settings.data}>
      <Row label={t.settings.deleteCompleted} description={t.settings.deleteCompletedDesc}>
        <button onClick={() => setConfirmType('clear')} className="px-3 py-1 text-xs rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>{t.settings.deleteLabel}</button>
      </Row>
      <Row label={t.settings.resetData} description={t.settings.resetDataDesc} last>
        <button onClick={() => setConfirmType('clearAll')} className="px-3 py-1 text-xs rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>{t.settings.resetLabel}</button>
      </Row>
    </Section>
  );

  const themeSection = (
    <Section title={t.settings.theme}>
      <Row label={t.settings.theme} description={t.settings.themeDesc} last>
        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
          {(['light', 'dark', 'system'] as const).map(mode => {
            const label = mode === 'light' ? t.settings.themeLight : mode === 'dark' ? t.settings.themeDark : t.settings.themeSystem;
            return (
              <button
                key={mode}
                onClick={() => setTheme(mode)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: theme === mode ? 'var(--accent)' : 'var(--accent-muted)',
                  color: theme === mode ? 'white' : 'var(--muted)',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </Row>
    </Section>
  );

  const languageSection = (
    <Section title={t.settings.language}>
      <Row label={t.settings.language} last>
        <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
          {(['ko', 'en'] as const).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: lang === l ? 'var(--accent)' : 'var(--accent-muted)',
                color: lang === l ? 'white' : 'var(--muted)',
              }}
            >
              {t.lang[l]}
            </button>
          ))}
        </div>
      </Row>
    </Section>
  );

  const navSection = onNavigate && (
    <Section title={t.settings.shortcuts}>
      <Row label={t.nav.trash} description={trashCount > 0 ? t.settings.trashCountDesc(trashCount) : t.settings.trashDesc} onClick={() => onNavigate('trash')}>
        <div className="flex items-center gap-2">
          {trashCount > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>{trashCount}</span>}
          <ChevronRight />
        </div>
      </Row>
      <Row label="PC에서 이용하기" last={!isAdmin}>
        <button
          onClick={() => window.open('https://todo-vito.vercel.app/', '_system')}
          className="flex items-center gap-1.5 text-sm active:opacity-60"
          style={{ color: 'var(--accent)' }}
        >
          todo-vito.vercel.app
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </button>
      </Row>
      {isAdmin && (
        <Row label={t.nav.admin} description={t.settings.adminDesc} last onClick={() => onNavigate('admin')}>
          <span style={{ color: '#f59e0b' }}>🛡️</span>
        </Row>
      )}
    </Section>
  );

  const actionButtons = (
    <div className="flex flex-wrap gap-3 mt-2">
      <button onClick={() => setConfirmType('reset')} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: 'var(--accent-muted)', color: 'var(--muted)' }}>{t.settings.resetSettings}</button>
    </div>
  );

  const actionButtonsMobile = (
    <div className="space-y-3 mt-2">
      <button onClick={() => setConfirmType('reset')} className="w-full py-3 rounded-xl text-sm font-medium" style={{ background: 'var(--accent-muted)', color: 'var(--muted)' }}>{t.settings.resetSettings}</button>
      <button onClick={() => setConfirmType('logout')} className="w-full py-3 rounded-xl text-sm font-medium" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>{t.settings.logout}</button>
    </div>
  );

  const pcContent: Record<PcTab, React.ReactNode> = {
    account:       <>{accountSection}{actionButtons}</>,
    pomodoro:      pomodoroSection,
    notifications: notificationSection,
    defaults:      <>{defaultsSection}{themeSection}{languageSection}</>,
    extraViews:    viewsSection,
    data:          dataSection,
    appInfo: (
      <Section title={t.settings.appInfo}>
        <Row label={t.settings.version}><span className="text-sm" style={{ color: 'var(--muted)' }}>ver {CURRENT_VERSION}</span></Row>
        {onNavigate && <Row label={t.nav.help} description={t.settings.helpDesc} onClick={() => onNavigate('help')}><ChevronRight /></Row>}
        {onNavigate && <Row label={t.nav.patchnotes} description={t.settings.patchnotesDesc} onClick={() => onNavigate('patchnotes')}><ChevronRight /></Row>}
        <Row label={t.settings.contact} last>
          <a href="mailto:firstedn@naver.com" className="text-sm" style={{ color: 'var(--accent)' }}>firstedn@naver.com</a>
        </Row>
      </Section>
    ),
  };

  const confirmSheet = confirmType && (
    <ConfirmSheet
      message={CONFIRM_CONFIG[confirmType].message}
      confirmLabel={CONFIRM_CONFIG[confirmType].label}
      cancelLabel={t.common.cancel}
      onConfirm={handleConfirm}
      onCancel={() => setConfirmType(null)}
    />
  );

  return (
    <>
      {/* 모바일 레이아웃 */}
      <div className="md:hidden max-w-lg mx-auto px-4 py-6">
        {navSection}
        {accountSection}
        {pomodoroSection}
        {notificationSection}
        {defaultsSection}
        {themeSection}
        {languageSection}
        {viewsSection}
        {dataSection}
        <Section title={t.settings.appInfo}>
          <Row label={t.settings.version}><span className="text-sm" style={{ color: 'var(--muted)' }}>ver {CURRENT_VERSION}</span></Row>
          {onNavigate && <Row label={t.nav.help} description={t.settings.helpDesc} onClick={() => onNavigate('help')}><ChevronRight /></Row>}
          {onNavigate && <Row label={t.nav.patchnotes} description={t.settings.patchnotesDesc} onClick={() => onNavigate('patchnotes')}><ChevronRight /></Row>}
          <Row label={t.settings.contact} last>
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
              <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full flex-shrink-0" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
                style={{ background: 'var(--accent)' }}>
                {(user?.displayName ?? user?.email ?? '?')[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{user?.displayName ?? t.settings.defaultUser}</p>
              <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>{user?.email ?? ''}</p>
            </div>
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-3" style={{ color: 'var(--muted)' }}>{t.settings.title}</p>
          <nav className="space-y-0.5">
            {PC_TABS.map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => setPcTab(key)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
                style={{
                  background: pcTab === key ? 'var(--accent-muted)' : 'transparent',
                  color: pcTab === key ? 'var(--accent)' : 'var(--text)',
                }}
              >
                {icon}
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="my-4 mx-3 h-px" style={{ background: 'var(--border)' }} />
          <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-3" style={{ color: 'var(--muted)' }}>바로가기</p>
          <button
            onClick={() => window.open('https://todo-vito.vercel.app/', '_blank')}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left transition-colors hover:opacity-80"
            style={{ color: 'var(--text)' }}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span>PC에서 이용하기</span>
          </button>

          {/* 하단 로그아웃 */}
          <div className="mt-6 mx-3 h-px mb-4" style={{ background: 'var(--border)' }} />
          <button onClick={() => setConfirmType('logout')} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left transition-colors"
            style={{ color: '#ef4444' }}>
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        </div>

        {/* 우측 내용 */}
        <div className="flex-1 overflow-y-auto">
          {/* 내용 헤더 */}
          <div className="flex items-center px-8 h-12 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{PC_TABS.find(t => t.key === pcTab)?.label ?? pcTab}</h2>
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
