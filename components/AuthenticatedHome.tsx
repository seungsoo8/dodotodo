'use client';

import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { User } from 'firebase/auth';
import { enableNetwork } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTodos } from '@/hooks/useTodos';
import { useProjects } from '@/hooks/useProjects';
import { usePomodoro } from '@/hooks/usePomodoro';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/useToast';
import ListView from '@/components/ListView';
import CalendarView from '@/components/CalendarView';
import MatrixView from '@/components/MatrixView';
import PomodoroTimer from '@/components/PomodoroTimer';
import { ViewType } from '@/types/todo';
import { hapticLight, hapticMedium, hapticSuccess } from '@/lib/haptics';
import QuickAddSheet from '@/components/QuickAddSheet';
import SettingsView from '@/components/SettingsView';
import TodayView from '@/components/TodayView';
import TrashView from '@/components/TrashView';
import AnalyticsView from '@/components/AnalyticsView';
import KanbanView from '@/components/KanbanView';
import HelpView from '@/components/HelpView';
import HabitView from '@/components/HabitView';
import PatchNotesView from '@/components/PatchNotesView';
import OnboardingView from '@/components/OnboardingView';
import BottomTabBar from '@/components/BottomTabBar';
import Sidebar from '@/components/Sidebar';
import GlobalSearchOverlay from '@/components/GlobalSearchOverlay';
import AdminView from '@/components/AdminView';
import WhatsNewModal from '@/components/WhatsNewModal';
import NicknameSetupModal from '@/components/NicknameSetupModal';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useSettings } from '@/hooks/useSettings';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useVersionCheck } from '@/hooks/useVersionCheck';
import { isOnboardingDone, markOnboardingDone } from '@/lib/onboarding';
import { getSeenVersion, markVersionSeen } from '@/lib/seenVersion';

interface Props {
  firebaseUser: User;
}

const isNative = Capacitor.isNativePlatform();

const TOAST_ICONS: Record<string, string> = { success: '✓', error: '✕', info: 'ℹ' };
const TOAST_COLORS: Record<string, string> = { success: '#10b981', error: '#ef4444', info: '#6366f1' };

const CURRENT_VERSION = '2.26'; // deploy:version
const LIST_SUB_VIEWS: ViewType[] = ['list', 'calendar', 'kanban', 'matrix'];
const WEB_BACK_VIEW: Partial<Record<ViewType, ViewType>> = { trash: 'settings', help: 'settings', patchnotes: 'settings' };
const MOBILE_HEADER: Partial<Record<ViewType, { title: string; backTo?: ViewType }>> = {
  analytics: { title: '분석' },
  trash: { title: '휴지통', backTo: 'settings' },
  help: { title: '사용 설명서', backTo: 'settings' },
  patchnotes: { title: '패치 노트', backTo: 'settings' },
  admin: { title: '관리자 대시보드', backTo: 'settings' },
  habit: { title: '습관 트래커' },
};

export default function AuthenticatedHome({ firebaseUser }: Props) {
  const [view, setView] = useState<ViewType>('today');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileProjectEditMode, setMobileProjectEditMode] = useState(false);
  const [showMobileAddProject, setShowMobileAddProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectIcon, setNewProjectIcon] = useState('💼');
  const [newProjectColor, setNewProjectColor] = useState('#6366f1');
  const [isMobileScreen, setIsMobileScreen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showNicknameSetup, setShowNicknameSetup] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const { profile, loaded: profileLoaded, saveProfile } = useUserProfile(firebaseUser.uid);
  const [subtaskPromptTodoId, setSubtaskPromptTodoId] = useState<string | null>(null);

  useEffect(() => {
    isOnboardingDone(firebaseUser.uid).then(done => {
      if (!done) setShowOnboarding(true);
    });
  }, [firebaseUser.uid]);

  useEffect(() => {
    if (profileLoaded && !profile.nickname) {
      setShowNicknameSetup(true);
    }
  }, [profileLoaded, profile.nickname]);

  useEffect(() => {
    const timer = setTimeout(() => {
      getSeenVersion().then(seen => {
        if (seen !== CURRENT_VERSION) setShowWhatsNew(true);
      });
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const check = () => setIsMobileScreen(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(v => !v);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 앱 포그라운드 복귀 시 Firestore 연결 복구 (모바일 WKWebView)
  useEffect(() => {
    const handleResume = () => enableNetwork(db).catch(console.error);
    document.addEventListener('resume', handleResume);
    window.addEventListener('focus', handleResume);
    return () => {
      document.removeEventListener('resume', handleResume);
      window.removeEventListener('focus', handleResume);
    };
  }, []);

  const isMobileLayout = isNative || isMobileScreen;
  const isOnline = useOnlineStatus();
  const hasUpdate = useVersionCheck(CURRENT_VERSION);
  const { settings, update: updateSettings, resetSettings } = useSettings(firebaseUser.uid);
  const { toasts, showToast, dismiss } = useToast();

  const projectsHook = useProjects(firebaseUser.uid);
  const todosHook = useTodos(firebaseUser, projectsHook.projects);
  const pomodoro = usePomodoro(
    (id) => {
      todosHook.incrementPomodoro(id);
      showToast('🍅 포모도로 완료!', 'success');
    },
    settings.pomodoro.work,
    settings.pomodoro.break,
  );

  useNotifications(todosHook.allTodos, settings.notifications.notificationHour ?? 9);

  const activeTodo = pomodoro.selectedTodoId
    ? todosHook.allTodos.find(t => t.id === pomodoro.selectedTodoId) ?? null
    : null;

  function handleToggleComplete(id: string) {
    const todo = todosHook.allTodos.find(t => t.id === id);
    if (todo?.completed) { hapticLight(); } else { hapticSuccess(); showToast('할 일 완료! 🎉', 'success'); }
    todosHook.toggleComplete(id);
  }

  function handleAddTodo(...args: Parameters<typeof todosHook.addTodo>) {
    hapticMedium();
    todosHook.addTodo(...args);
    showToast('할 일이 추가됐어요', 'success');
  }

  function handleDeleteTodo(id: string) {
    todosHook.deleteTodo(id);
    showToast('휴지통으로 이동했어요', 'info');
  }

  function handleToggleSubtask(todoId: string, subtaskId: string) {
    const todo = todosHook.allTodos.find(t => t.id === todoId);
    if (todo && !todo.completed) {
      const subtask = todo.subtasks.find(s => s.id === subtaskId);
      const completing = !subtask?.completed;
      const allWillBeComplete = completing &&
        todo.subtasks.every(s => s.id === subtaskId ? true : s.completed);
      if (allWillBeComplete) setSubtaskPromptTodoId(todoId);
    }
    todosHook.toggleSubtask(todoId, subtaskId);
  }

  function handleRestoreTodo(id: string) {
    todosHook.restoreTodo(id);
    showToast('복구됐어요', 'success');
  }

  function handleViewChange(v: ViewType) {
    setView(v);
  }

  const enableMatrix = settings.views?.matrix ?? false;
  const enableKanban = settings.views?.kanban ?? false;
  const isListTab = LIST_SUB_VIEWS.includes(view);
  const showFab = view === 'list' || view === 'today';

  const listModeOptions: { value: ViewType; label: string }[] = [
    { value: 'list', label: '목록' },
    { value: 'calendar', label: '캘린더' },
    ...(enableKanban ? [{ value: 'kanban' as ViewType, label: '칸반' }] : []),
    ...(enableMatrix ? [{ value: 'matrix' as ViewType, label: '매트릭스' }] : []),
  ];

  // 뷰 컨텐츠 (모바일/웹 공통)
  const viewContent = (
    <>
      {view === 'today' && (
        <TodayView
          allTodos={todosHook.allTodos}
          onToggle={handleToggleComplete}
          onUpdate={todosHook.updateTodo}
          onDelete={handleDeleteTodo}
          onAddSubtask={todosHook.addSubtask}
          onToggleSubtask={handleToggleSubtask}
          onDeleteSubtask={todosHook.deleteSubtask}
          pomodoro={pomodoro}
          onOpenAdd={() => setFabOpen(true)}
          compact={!isMobileLayout}
        />
      )}
      {view === 'list' && (
        <ListView
          todos={todosHook.todos}
          allTodos={todosHook.allTodos}
          stats={todosHook.stats}
          searchQuery={todosHook.searchQuery}
          setSearchQuery={todosHook.setSearchQuery}
          filterStatus={todosHook.filterStatus}
          setFilterStatus={todosHook.setFilterStatus}
          filterPriority={todosHook.filterPriority}
          setFilterPriority={todosHook.setFilterPriority}
          sortOrder={todosHook.sortOrder}
          setSortOrder={todosHook.setSortOrder}
          addTodo={handleAddTodo}
          updateTodo={todosHook.updateTodo}
          deleteTodo={handleDeleteTodo}
          toggleComplete={handleToggleComplete}
          clearCompleted={todosHook.clearCompleted}
          reorderTodos={todosHook.reorderTodos}
          bulkComplete={todosHook.bulkComplete}
          bulkDelete={todosHook.bulkDelete}
          addSubtask={todosHook.addSubtask}
          toggleSubtask={handleToggleSubtask}
          deleteSubtask={todosHook.deleteSubtask}
          projects={projectsHook.projects}
          activeProjectId={activeProjectId}
          pomodoro={pomodoro}
          allTags={todosHook.allTags}
          filterTags={todosHook.filterTags}
          onTagToggle={tag => todosHook.setFilterTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
          )}
          filterDateFrom={todosHook.filterDateFrom}
          filterDateTo={todosHook.filterDateTo}
          onDateFromChange={todosHook.setFilterDateFrom}
          onDateToChange={todosHook.setFilterDateTo}
          compact={!isMobileLayout}
        />
      )}
      {view === 'kanban' && (
        <KanbanView
          allTodos={todosHook.allTodos}
          onUpdate={todosHook.updateTodo}
          onToggle={handleToggleComplete}
          onDelete={handleDeleteTodo}
          addTodo={handleAddTodo}
        />
      )}
      {view === 'calendar' && (
        <CalendarView
          allTodos={todosHook.allTodos}
          onToggle={handleToggleComplete}
          onUpdate={todosHook.updateTodo}
        />
      )}
      {view === 'matrix' && (
        <MatrixView
          allTodos={todosHook.allTodos}
          onUpdate={todosHook.updateTodo}
          onToggle={handleToggleComplete}
        />
      )}
      {view === 'analytics' && (
        <AnalyticsView
          allTodos={todosHook.allTodos}
          weeklyData={todosHook.weeklyData}
          history={todosHook.history}
        />
      )}
      {view === 'trash' && (
        <TrashView
          trashedTodos={todosHook.trashedTodos}
          onRestore={handleRestoreTodo}
          onPermanentDelete={todosHook.permanentlyDeleteTodo}
          onEmptyTrash={todosHook.emptyTrash}
          onBack={() => setView('settings')}
        />
      )}
      {view === 'settings' && (
        <SettingsView
          settings={settings}
          onUpdate={updateSettings}
          onReset={resetSettings}
          onClearCompleted={todosHook.clearCompleted}
          onClearAll={todosHook.clearAllData}
          onNavigate={setView}
          trashCount={todosHook.trashedTodos.length}
          userProfile={profile}
          onEditProfile={() => setShowNicknameSetup(true)}
        />
      )}
      {view === 'help' && <HelpView onBack={() => setView('settings')} />}
      {view === 'patchnotes' && <PatchNotesView onBack={() => setView('settings')} currentVersion={CURRENT_VERSION} />}
      {view === 'admin' && <AdminView />}
      {view === 'habit' && (
        <HabitView
          allTodos={todosHook.allTodos}
          weeklyData={todosHook.weeklyData}
          history={todosHook.history}
        />
      )}
    </>
  );

  // 업데이트 배너 (웹 전용)
  const updateBanner = hasUpdate && !isMobileLayout && (
    <div
      className="fixed left-0 right-0 z-[200] flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium cursor-pointer transition-opacity hover:opacity-90"
      style={{ top: 0, background: 'var(--accent)', color: 'white' }}
      onClick={() => window.location.reload()}
    >
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      새 버전이 있어요 — 클릭해서 업데이트
    </div>
  );

  // 오프라인 배너
  const offlineBanner = !isOnline && (
    <div
      className="fixed left-0 right-0 z-[150] flex items-center justify-center gap-2 py-2 px-4 text-xs font-medium"
      style={{
        top: isMobileLayout ? 'env(safe-area-inset-top)' : 0,
        background: 'rgba(255,149,0,0.95)',
        color: 'white',
        backdropFilter: 'blur(8px)',
      }}
    >
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M12 12h.01M3 3l18 18" />
      </svg>
      오프라인 — 변경사항은 연결 시 자동 동기화됩니다
    </div>
  );

  // 플로팅 요소 (공통)
  const floatingElements = (
    <>
      {pomodoro.selectedTodoId && (
        <PomodoroTimer
          pomodoro={pomodoro}
          todo={activeTodo}
          onClose={() => pomodoro.selectTodo(null)}
        />
      )}

      {subtaskPromptTodoId && (() => {
        const todo = todosHook.allTodos.find(t => t.id === subtaskPromptTodoId);
        if (!todo) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div
              className="w-full max-w-sm rounded-t-3xl p-6 flex flex-col gap-4"
              style={{
                background: 'var(--card)',
                paddingBottom: isMobileLayout ? 'calc(env(safe-area-inset-bottom) + 24px)' : '24px',
                boxShadow: 'var(--shadow-float)',
              }}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">🎉</div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  모든 서브태스크 완료!
                </p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>
                  <span className="font-medium" style={{ color: 'var(--text)' }}>{todo.title}</span>도 완료 처리할까요?
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSubtaskPromptTodoId(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: 'var(--border)', color: 'var(--muted)' }}
                >
                  나중에
                </button>
                <button
                  onClick={() => {
                    handleToggleComplete(subtaskPromptTodoId);
                    setSubtaskPromptTodoId(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'var(--accent)' }}
                >
                  완료 처리
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {showFab && (
        <button
          onClick={() => { hapticMedium(); setFabOpen(true); }}
          className="fixed z-30 flex items-center justify-center rounded-full transition-transform active:scale-90"
          style={{
            width: 52, height: 52,
            background: 'var(--accent)',
            boxShadow: '0 4px 20px rgba(88,86,214,0.4)',
            bottom: isMobileLayout
              ? `calc(env(safe-area-inset-bottom) + 56px + 16px)`
              : '24px',
            right: 20,
          }}
          aria-label="빠른 추가"
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {fabOpen && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={e => { if (e.target === e.currentTarget) setFabOpen(false); }}
        >
          <div
            className="w-full max-w-lg rounded-t-3xl p-5"
            style={{
              background: 'var(--card)',
              paddingBottom: isMobileLayout
                ? `calc(env(safe-area-inset-bottom) + 56px + 16px)`
                : '24px',
              boxShadow: 'var(--shadow-float)',
            }}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'var(--border)' }} />
            <QuickAddSheet
              onSubmit={(title, priority, dueDate, projectId) => {
                handleAddTodo({ title, priority, urgency: 'not-urgent', recurring: 'none', ...(dueDate && { dueDate }), ...(projectId && { projectId }) });
                setFabOpen(false);
              }}
              onCancel={() => setFabOpen(false)}
              projects={projectsHook.projects}
            />
          </div>
        </div>
      )}

      <div
        className="fixed left-0 right-0 flex flex-col items-center gap-2 z-[100] pointer-events-none"
        style={{
          bottom: isMobileLayout
            ? `calc(env(safe-area-inset-bottom) + 56px + 16px)`
            : '24px',
        }}
      >
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl pointer-events-auto"
            style={{
              background: 'var(--card)',
              border: `1px solid ${TOAST_COLORS[toast.type]}40`,
              color: 'var(--text)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}
            onClick={() => dismiss(toast.id)}
          >
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: TOAST_COLORS[toast.type] }}
            >
              {TOAST_ICONS[toast.type]}
            </span>
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        ))}
      </div>
    </>
  );

  // ─── 글로벌 검색 오버레이 ───
  const searchOverlay = showSearch && (
    <GlobalSearchOverlay
      allTodos={todosHook.allTodos}
      onClose={() => setShowSearch(false)}
      onToggle={handleToggleComplete}
      onDelete={handleDeleteTodo}
    />
  );

  // ─── 업데이트 팝업 ───
  const nicknameModal = showNicknameSetup && (
    <NicknameSetupModal
      initialNickname={profile.nickname}
      initialIcon={profile.profileIcon}
      onSave={async (nick, icon) => {
        await saveProfile(nick, icon);
        setShowNicknameSetup(false);
      }}
      onCancel={profile.nickname ? () => setShowNicknameSetup(false) : undefined}
    />
  );

  const whatsNewModal = showWhatsNew && !showOnboarding && !showNicknameSetup && (
    <WhatsNewModal
      version={CURRENT_VERSION}
      onClose={() => {
        markVersionSeen(CURRENT_VERSION);
        setShowWhatsNew(false);
      }}
    />
  );

  // ─── 온보딩 오버레이 (최초 로그인 후 1회) ───
  if (showOnboarding) {
    return (
      <OnboardingView
        onDone={() => {
          markOnboardingDone(firebaseUser.uid).catch(console.error);
          setShowOnboarding(false);
        }}
      />
    );
  }

  // ─── 모바일 레이아웃 (Capacitor 또는 모바일 브라우저) ───
  if (isMobileLayout) {
    return (
      <div className="flex flex-col h-screen" style={{ background: 'var(--bg)' }}>
        <div style={{ height: 'env(safe-area-inset-top)', background: 'var(--card)', flexShrink: 0 }} />

        {/* 모바일 네비게이션 헤더 */}
        {MOBILE_HEADER[view] && (
          <div
            className="flex-shrink-0 relative flex items-center h-12 px-4"
            style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}
          >
            {MOBILE_HEADER[view]!.backTo ? (
              <>
                <button
                  onClick={() => setView(MOBILE_HEADER[view]!.backTo!)}
                  className="flex items-center gap-1 text-sm font-medium z-10 active:opacity-60 transition-opacity"
                  style={{ color: 'var(--accent)' }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  설정
                </button>
                <span
                  className="absolute inset-0 flex items-center justify-center text-sm font-semibold pointer-events-none"
                  style={{ color: 'var(--text)' }}
                >
                  {MOBILE_HEADER[view]!.title}
                </span>
              </>
            ) : (
              <h1 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
                {MOBILE_HEADER[view]!.title}
              </h1>
            )}
          </div>
        )}

        {/* 목록 탭 헤더: 뷰 탭 + 프로젝트 필터 */}
        {isListTab && (
          <div className="flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
            {/* 뷰 모드 탭 */}
            {listModeOptions.length > 1 && (
              <div className="flex items-center px-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {listModeOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setView(opt.value)}
                    className="flex-shrink-0 py-3 px-3 text-sm font-medium transition-all relative"
                    style={{ color: view === opt.value ? 'var(--accent)' : 'var(--muted)' }}
                  >
                    {opt.label}
                    {view === opt.value && (
                      <span
                        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                        style={{ background: 'var(--accent)' }}
                      />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* 프로젝트 칩 */}
            <div className="flex items-center gap-1.5 px-4 pb-2.5 pt-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {!mobileProjectEditMode && (
                <button
                  onClick={() => { setActiveProjectId(null); todosHook.setFilterProjectId(null); }}
                  className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: activeProjectId === null ? 'var(--accent)' : 'var(--accent-muted)',
                    color: activeProjectId === null ? '#fff' : 'var(--muted)',
                  }}
                >
                  전체
                </button>
              )}
              {projectsHook.projects.map(p => (
                <div key={p.id} className="flex-shrink-0 flex items-center gap-1 rounded-full text-xs font-medium"
                  style={{
                    background: !mobileProjectEditMode && activeProjectId === p.id ? p.color + '22' : 'var(--accent-muted)',
                    color: !mobileProjectEditMode && activeProjectId === p.id ? p.color : 'var(--muted)',
                    border: !mobileProjectEditMode && activeProjectId === p.id ? `1px solid ${p.color}44` : '1px solid transparent',
                  }}
                >
                  <button
                    className="flex items-center gap-1 pl-2.5 py-1"
                    style={{ paddingRight: mobileProjectEditMode ? '4px' : '10px' }}
                    onClick={() => {
                      if (mobileProjectEditMode) return;
                      setActiveProjectId(p.id); todosHook.setFilterProjectId(p.id); setView('list');
                    }}
                  >
                    <span>{p.icon}</span>
                    <span>{p.name}</span>
                  </button>
                  {mobileProjectEditMode && (
                    <button
                      onClick={() => projectsHook.deleteProject(p.id)}
                      className="pr-2 pl-0.5 py-1 text-red-400 font-bold"
                    >×</button>
                  )}
                </div>
              ))}
              {mobileProjectEditMode && !showMobileAddProject && (
                <button
                  onClick={() => setShowMobileAddProject(true)}
                  className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ border: '1px dashed var(--accent)', color: 'var(--accent)' }}
                >
                  + 추가
                </button>
              )}
              <button
                onClick={() => { setMobileProjectEditMode(v => !v); setShowMobileAddProject(false); setNewProjectName(''); }}
                className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ml-auto"
                style={{
                  background: mobileProjectEditMode ? 'rgba(99,102,241,0.15)' : 'var(--accent-muted)',
                  color: mobileProjectEditMode ? 'var(--accent)' : 'var(--muted)',
                }}
              >
                {mobileProjectEditMode ? '완료' : '편집'}
              </button>
            </div>
            {showMobileAddProject && (
              <div className="px-4 pb-3 flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="프로젝트 이름"
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newProjectName.trim()) {
                      projectsHook.addProject({ name: newProjectName.trim(), icon: newProjectIcon, color: newProjectColor });
                      setNewProjectName(''); setShowMobileAddProject(false);
                    }
                  }}
                  autoFocus
                  className="w-full text-sm px-3 py-2 rounded-xl outline-none"
                  style={{ background: 'var(--accent-muted)', color: 'var(--text)', border: '1px solid var(--border)' }}
                />
                <div className="flex gap-1 flex-wrap">
                  {['💼','🏠','📚','🎯','💡','🎨','🚀','🌿'].map(icon => (
                    <button key={icon} onClick={() => setNewProjectIcon(icon)}
                      className="text-sm p-1.5 rounded-lg"
                      style={{ background: newProjectIcon === icon ? 'var(--accent-muted)' : 'transparent', border: newProjectIcon === icon ? '1px solid var(--accent)' : '1px solid transparent' }}
                    >{icon}</button>
                  ))}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#14b8a6'].map(color => (
                    <button key={color} onClick={() => setNewProjectColor(color)}
                      className="w-6 h-6 rounded-full transition-transform"
                      style={{ background: color, transform: newProjectColor === color ? 'scale(1.25)' : 'scale(1)' }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { if (!newProjectName.trim()) return; projectsHook.addProject({ name: newProjectName.trim(), icon: newProjectIcon, color: newProjectColor }); setNewProjectName(''); setShowMobileAddProject(false); }}
                    className="flex-1 py-1.5 text-xs font-medium rounded-xl text-white"
                    style={{ background: 'var(--accent)' }}
                  >추가</button>
                  <button onClick={() => { setShowMobileAddProject(false); setNewProjectName(''); }}
                    className="px-4 py-1.5 text-xs rounded-xl"
                    style={{ background: 'var(--accent-muted)', color: 'var(--muted)' }}
                  >취소</button>
                </div>
              </div>
            )}
          </div>
        )}

        <main
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 56px)' }}
        >
          {viewContent}
        </main>

        {offlineBanner}
        {floatingElements}
        {searchOverlay}
        {whatsNewModal}
        {nicknameModal}
        <BottomTabBar view={view} onViewChange={handleViewChange} onSearch={() => setShowSearch(true)} />
      </div>
    );
  }

  // ─── 웹 레이아웃 (사이드바) ───
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar
        view={view}
        onViewChange={handleViewChange}
        projects={projectsHook.projects}
        activeProjectId={activeProjectId}
        onProjectSelect={(id) => {
          setActiveProjectId(id);
          todosHook.setFilterProjectId(id);
          if (id !== null) setView('list');
        }}
        stats={todosHook.stats}
        streak={todosHook.streak}
        weeklyData={todosHook.weeklyData}
        allTodos={todosHook.allTodos}
        onAddProject={projectsHook.addProject}
        onDeleteProject={projectsHook.deleteProject}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(v => !v)}
        onSearch={() => setShowSearch(true)}
        trashCount={todosHook.trashedTodos.length}
        enableMatrix={enableMatrix}
        enableKanban={enableKanban}
        userProfile={profile}
        onEditProfile={() => setShowNicknameSetup(true)}
      />

      {updateBanner}
      {offlineBanner}
      {searchOverlay}
      <div className="flex flex-col flex-1 overflow-hidden" style={{ marginTop: hasUpdate ? 40 : 0 }}>

        {/* 뷰 모드 전환 (목록 서브뷰, 웹) */}
        {isListTab && listModeOptions.length > 1 && (
          <div
            className="flex-shrink-0 flex items-center gap-1.5 px-4 pt-3 pb-2 overflow-x-auto"
            style={{ scrollbarWidth: 'none', borderBottom: '1px solid var(--border)' }}
          >
            {listModeOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setView(opt.value)}
                className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all"
                style={{
                  background: view === opt.value ? 'var(--accent)' : 'var(--card)',
                  color: view === opt.value ? '#fff' : 'var(--muted)',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {viewContent}
        </main>
      </div>

      {floatingElements}
      {whatsNewModal}
      {nicknameModal}
    </div>
  );
}
