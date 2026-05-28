'use client';

import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { User } from 'firebase/auth';
import { enableNetwork, doc, updateDoc, setDoc, arrayUnion } from 'firebase/firestore';
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
import PatchNotesView from '@/components/PatchNotesView';
import OnboardingView from '@/components/OnboardingView';
import BottomTabBar from '@/components/BottomTabBar';
import Sidebar from '@/components/Sidebar';
import GlobalSearchOverlay from '@/components/GlobalSearchOverlay';
import AdminView from '@/components/AdminView';
import ProjectsView from '@/components/ProjectsView';
import OverdueBadge from '@/components/OverdueBadge';
import WhatsNewModal from '@/components/WhatsNewModal';
import WeeklyReviewModal from '@/components/WeeklyReviewModal';
import NicknameSetupModal from '@/components/NicknameSetupModal';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useSettings } from '@/hooks/useSettings';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useVersionCheck } from '@/hooks/useVersionCheck';
import { useForceUpdate } from '@/hooks/useForceUpdate';
import ForceUpdateModal from '@/components/ForceUpdateModal';
import { isOnboardingDone, markOnboardingDone } from '@/lib/onboarding';
import { getSeenVersion, markVersionSeen } from '@/lib/seenVersion';
import { PATCH_NOTES } from '@/lib/patchnotes';
import { ChevronLeft, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getGreeting } from '@/lib/greeting';
import AIChatPanel from '@/components/AIChatPanel';
import { useWidgetSync } from '@/hooks/useWidgetSync';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import PaywallModal from '@/components/PaywallModal';
import PlanView from '@/components/PlanView';

interface Props {
  firebaseUser: User;
}

const isNative = Capacitor.isNativePlatform();

const TOAST_ICONS: Record<string, string> = { success: '✓', error: '✕', info: 'ℹ' };
const TOAST_COLORS: Record<string, string> = { success: '#10b981', error: '#ef4444', info: '#6366f1' };

const CURRENT_VERSION = '2.34'; // deploy:version
const LIST_SUB_VIEWS: ViewType[] = ['list', 'kanban', 'matrix', 'projects'];
const WEB_BACK_VIEW: Partial<Record<ViewType, ViewType>> = { trash: 'settings', help: 'settings', patchnotes: 'settings' };

export default function AuthenticatedHome({ firebaseUser }: Props) {
  const { t, lang } = useLanguage();
  const [view, setView] = useState<ViewType>(isNative ? 'today' : 'list');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [fabInitialDate, setFabInitialDate] = useState<string | undefined>(undefined);
  const [fabProjectId, setFabProjectId] = useState<string | undefined>(undefined);
  const [projectsSelectedId, setProjectsSelectedId] = useState<string | null>(null);
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
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [showWeeklyReview, setShowWeeklyReview] = useState(false);
  const { profile, loaded: profileLoaded, saveProfile } = useUserProfile(firebaseUser.uid);
  const [subtaskPromptTodoId, setSubtaskPromptTodoId] = useState<string | null>(null);
  const [autoEditTodoId, setAutoEditTodoId] = useState<string | null>(null);
  const [fabHover, setFabHover] = useState(false);

  useEffect(() => {
    if (isNative) {
      LocalNotifications.requestPermissions().catch(() => {});
    }
  }, []);

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
        if (seen !== CURRENT_VERSION) {
          const hasNote = PATCH_NOTES.some(n => n.version === CURRENT_VERSION);
          if (hasNote) {
            setShowWhatsNew(true);
          } else {
            markVersionSeen(CURRENT_VERSION);
          }
        }
      });
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const check = () => setIsMobileScreen(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // 웹에서 새로고침 시 현재 뷰 유지
  useEffect(() => {
    if (isNative) return;
    const hash = window.location.hash.slice(1) as ViewType;
    const HASHABLE: ViewType[] = ['list', 'calendar', 'analytics', 'settings', 'help', 'patchnotes', 'projects', 'today', 'trash', 'kanban', 'matrix'];
    if (HASHABLE.includes(hash)) setView(hash);
  }, []);

  useEffect(() => {
    if (isNative) return;
    window.history.replaceState(null, '', view === 'list' ? window.location.pathname : `#${view}`);
  }, [view]);

  // 일요일 저녁 주간 회고 자동 제안
  useEffect(() => {
    const d = new Date();
    if (d.getDay() !== 0 || d.getHours() < 17) return;
    const key = `weekly-review-prompted-${d.toISOString().split('T')[0]}`;
    if (localStorage.getItem(key)) return;
    const timer = setTimeout(() => {
      localStorage.setItem(key, '1');
      setShowWeeklyReview(true);
    }, 3000);
    return () => clearTimeout(timer);
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
  const { needsUpdate, storeUrl } = useForceUpdate(CURRENT_VERSION);
  const { toasts, showToast, dismiss } = useToast();
  const { settings, update: updateSettings, setKanbanColumns, resetSettings } = useSettings(
    firebaseUser.uid,
    () => showToast('설정 저장 실패', 'error'),
  );
  const projectsHook = useProjects(firebaseUser.uid, () => showToast('저장 실패', 'error'));
  const todosHook = useTodos(firebaseUser, projectsHook.projects, () => showToast('저장 실패', 'error'));
  const pomodoro = usePomodoro(
    (id) => {
      todosHook.incrementPomodoro(id);
      showToast(t.pomodoro.completed, 'success');
    },
    settings.pomodoro.work,
    settings.pomodoro.break,
  );

  useNotifications(todosHook.allTodos, settings.notifications.notificationHour ?? 9);
  useWidgetSync(todosHook.allTodos);

  const activeTodo = pomodoro.selectedTodoId
    ? todosHook.allTodos.find(todo => todo.id === pomodoro.selectedTodoId) ?? null
    : null;

  const todayStr = new Date().toISOString().slice(0, 10);
  const overdueTodos = todosHook.allTodos.filter(
    todo => !todo.completed && !todo.deletedAt && todo.dueDate && todo.dueDate < todayStr
  );

  function handleToggleComplete(id: string) {
    const todo = todosHook.allTodos.find(todo => todo.id === id);
    if (todo?.completed) { hapticLight(); } else { hapticSuccess(); showToast(t.todo.completed, isOnline ? 'success' : 'info'); }
    todosHook.toggleComplete(id);
  }

  function handleAddTodo(...args: Parameters<typeof todosHook.addTodo>) {
    hapticMedium();
    todosHook.addTodo(...args);
    showToast(isOnline ? t.todo.added : `${t.todo.added} · 오프라인`, isOnline ? 'success' : 'info');
  }

  function handleDeleteTodo(id: string) {
    todosHook.deleteTodo(id);
    showToast(
      isOnline ? t.todo.movedToTrash : `${t.todo.movedToTrash} · 오프라인`,
      'info',
      { label: '실행 취소', onClick: () => todosHook.restoreTodo(id) },
    );
  }

  function handleToggleSubtask(todoId: string, subtaskId: string) {
    const todo = todosHook.allTodos.find(todo => todo.id === todoId);
    if (todo && !todo.completed) {
      const subtask = todo.subtasks.find(s => s.id === subtaskId);
      const completing = !subtask?.completed;
      const allWillBeComplete = completing &&
        todo.subtasks.every(s => s.id === subtaskId ? true : s.completed);
      if (allWillBeComplete) setSubtaskPromptTodoId(todoId);
    }
    todosHook.toggleSubtask(todoId, subtaskId);
  }

  function handleDeleteProject(id: string) {
    todosHook.allTodos
      .filter(t => t.projectId === id && !t.deletedAt)
      .forEach(t => todosHook.updateTodo(t.id, { projectId: undefined }));
    projectsHook.deleteProject(id);
  }

  function handleRestoreTodo(id: string) {
    todosHook.restoreTodo(id);
    showToast(t.todo.restored, 'success');
  }

  function handleViewChange(v: ViewType) {
    if (v === 'list') {
      setActiveProjectId(null);
      todosHook.setFilterProjectId(null);
    }
    setView(v);
  }

  const enableMatrix = settings.views?.matrix ?? false;
  const enableKanban = settings.views?.kanban ?? false;
  const enableAiChat = settings.views?.aiChat ?? false;
  const isListTab = LIST_SUB_VIEWS.includes(view);
  const showFab = view !== 'calendar' && view !== 'kanban' && view !== 'matrix' && view !== 'today';

  const mobileSegmentBar = (
    <div className="flex items-center gap-0.5 mt-2.5 p-0.5 rounded-xl" style={{ background: 'rgba(0,0,0,0.07)' }}>
      {([
        { key: 'list',     label: lang === 'ko' ? '목록'    : 'List' },
        { key: 'projects', label: lang === 'ko' ? '그룹'    : 'Groups' },
        ...(enableKanban ? [{ key: 'kanban',  label: lang === 'ko' ? '칸반'    : 'Kanban' }] : []),
        ...(enableMatrix ? [{ key: 'matrix',  label: lang === 'ko' ? '매트릭스' : 'Matrix' }] : []),
      ] as { key: ViewType; label: string }[]).map(seg => (
        <button
          key={seg.key}
          onClick={() => { if (seg.key === 'projects') setProjectsSelectedId(null); setView(seg.key); }}
          className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
          style={{
            background: view === seg.key ? 'var(--card)' : 'transparent',
            color: view === seg.key ? 'var(--text)' : 'var(--muted)',
            boxShadow: view === seg.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          {seg.label}
        </button>
      ))}
    </div>
  );

  const MOBILE_HEADER: Partial<Record<ViewType, { title: string; backTo?: ViewType; showSearch?: boolean }>> = {
    trash:      { title: t.nav.trash,      backTo: 'settings' },
    help:       { title: t.nav.help,       backTo: 'settings' },
    patchnotes: { title: t.nav.patchnotes, backTo: 'settings' },
    admin:      { title: t.nav.admin,      backTo: 'settings' },
  };

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
          streak={todosHook.streak}
          totalCompleted={todosHook.stats.completed}
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
          autoEditTodoId={autoEditTodoId}
          onAutoEditDone={() => setAutoEditTodoId(null)}
          onSearch={isMobileLayout ? () => setShowSearch(true) : undefined}
          segmentBar={isMobileLayout ? mobileSegmentBar : undefined}
        />
      )}
      {view === 'kanban' && (
        <KanbanView
          allTodos={todosHook.allTodos}
          onUpdate={todosHook.updateTodo}
          onToggle={handleToggleComplete}
          onDelete={handleDeleteTodo}
          addTodo={handleAddTodo}
          projects={projectsHook.projects}
          kanbanColumns={settings.kanbanColumns ?? []}
          onUpdateColumns={setKanbanColumns}
        />
      )}
      {view === 'calendar' && (
        <CalendarView
          allTodos={todosHook.allTodos}
          projects={projectsHook.projects}
          onToggle={handleToggleComplete}
          onUpdate={todosHook.updateTodo}
          onAdd={date => { setFabInitialDate(date); setFabOpen(true); }}
          onToggleSubtask={handleToggleSubtask}
          onStartPomodoro={pomodoro.selectTodo}
        />
      )}
      {view === 'matrix' && (
        <MatrixView
          allTodos={todosHook.allTodos}
          onUpdate={todosHook.updateTodo}
          onToggle={handleToggleComplete}
          onAdd={data => handleAddTodo({ ...data })}
        />
      )}
      {view === 'analytics' && (
        <AnalyticsView
          allTodos={todosHook.allTodos}
          weeklyData={todosHook.weeklyData}
          history={todosHook.history}
          onWeeklyReview={() => setShowWeeklyReview(true)}
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
      {view === 'plan' && <PlanView />}
      {view === 'projects' && (
        <ProjectsView
          projects={projectsHook.projects}
          allTodos={todosHook.allTodos}
          onToggleFavorite={(projectId) => {
            const project = projectsHook.projects.find(p => p.id === projectId);
            if (project) projectsHook.updateProject(projectId, { favorite: !project.favorite });
          }}
          onAddProject={projectsHook.addProject}
          onUpdateProject={projectsHook.updateProject}
          onDeleteProject={handleDeleteProject}
          onReorderProjects={projectsHook.reorderProjects}
          onToggleTodo={handleToggleComplete}
          onUpdateTodo={todosHook.updateTodo}
          onDeleteTodo={handleDeleteTodo}
          onAddSubtask={todosHook.addSubtask}
          onToggleSubtask={handleToggleSubtask}
          onDeleteSubtask={todosHook.deleteSubtask}
          pomodoro={pomodoro}
          selectedProjectId={projectsSelectedId}
          onSelectProject={setProjectsSelectedId}
          editMode={mobileProjectEditMode}
          onToggleEditMode={() => setMobileProjectEditMode(v => !v)}
          segmentBar={isMobileLayout ? mobileSegmentBar : undefined}
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
      {t.banner.newVersion}
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
      {t.banner.offline}
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
        const todo = todosHook.allTodos.find(item => item.id === subtaskPromptTodoId);
        if (!todo) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div
              className="w-full max-w-sm rounded-t-3xl md:rounded-3xl p-6 flex flex-col gap-4"
              style={{
                background: 'var(--card)',
                paddingBottom: isMobileLayout ? 'calc(env(safe-area-inset-bottom) + 24px)' : '24px',
                boxShadow: 'var(--shadow-float)',
              }}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">🎉</div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  {t.todo.subtasksAllDone}
                </p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {t.todo.subtasksCompleteParent(todo.title)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSubtaskPromptTodoId(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: 'var(--border)', color: 'var(--muted)' }}
                >
                  {t.common.later}
                </button>
                <button
                  onClick={() => {
                    handleToggleComplete(subtaskPromptTodoId);
                    setSubtaskPromptTodoId(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'var(--accent)' }}
                >
                  {t.common.complete}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {showFab && (
        <button
          onClick={() => { hapticMedium(); setFabOpen(true); }}
          onMouseEnter={() => { if (!isMobileLayout) setFabHover(true); }}
          onMouseLeave={() => { if (!isMobileLayout) setFabHover(false); }}
          className="fixed z-30 flex items-center justify-center rounded-full active:scale-90"
          style={{
            width: isMobileLayout ? 52 : 64,
            height: isMobileLayout ? 52 : 64,
            background: 'var(--accent)',
            boxShadow: fabHover ? '0 16px 36px rgba(88,86,214,0.65)' : '0 4px 20px rgba(88,86,214,0.4)',
            bottom: isMobileLayout
              ? `calc(env(safe-area-inset-bottom) + 56px + 16px)`
              : '28px',
            right: isMobileLayout ? 20 : 28,
            transform: fabHover ? 'translateY(-7px) scale(1.1)' : 'translateY(0) scale(1)',
            transition: isMobileLayout ? undefined : 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease',
          }}
          aria-label={t.todo.addTodo}
        >
          <svg className={isMobileLayout ? 'w-6 h-6 text-white' : 'w-7 h-7 text-white'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {fabOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={e => { if (e.target === e.currentTarget) { setFabOpen(false); setFabInitialDate(undefined); setFabProjectId(undefined); } }}
        >
          <div
            className="w-full max-w-lg rounded-3xl p-5"
            style={{
              background: 'var(--card)',
              boxShadow: 'var(--shadow-float)',
            }}
          >
            <QuickAddSheet
              onSubmit={(title, priority, dueDate, projectId, startDate, recurring, weekDays, dueTime, reminderMinutes, colorTag, subtasks) => {
                handleAddTodo({ title, priority, urgency: 'not-urgent', recurring: recurring ?? 'none', ...(startDate && { startDate }), ...(dueDate && { dueDate }), ...(projectId && { projectId }), ...(weekDays && { weekDays }), ...(dueTime && { dueTime }), ...(reminderMinutes !== undefined && { reminderMinutes }), ...(colorTag && { colorTag }) }, subtasks);
                setFabOpen(false);
                setFabInitialDate(undefined);
                setFabProjectId(undefined);
              }}
              onCancel={() => { setFabOpen(false); setFabInitialDate(undefined); setFabProjectId(undefined); }}
              projects={projectsHook.projects}
              initialDate={fabInitialDate}
              initialProjectId={view === 'projects' && projectsSelectedId && projectsSelectedId !== '__unassigned__' ? projectsSelectedId : fabProjectId}
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
            {toast.action && (
              <button
                onClick={e => { e.stopPropagation(); toast.action!.onClick(); dismiss(toast.id); }}
                className="text-xs font-semibold px-2 py-0.5 rounded-lg flex-shrink-0 transition-opacity hover:opacity-75"
                style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
              >
                {toast.action.label}
              </button>
            )}
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
      onSelect={todo => {
        setShowSearch(false);
        setView('list');
        setAutoEditTodoId(todo.id);
      }}
      userId={firebaseUser.uid}
    />
  );

  // ─── 강제 업데이트 모달 ───
  const forceUpdateModal = needsUpdate && <ForceUpdateModal storeUrl={storeUrl} />;

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

  function handleSaveWeeklyReview(data: { date: string; topThree: string[]; note: string; completedCount: number }) {
    const uid = firebaseUser.uid;
    const ref = doc(db, 'users', uid);
    updateDoc(ref, { weeklyReviews: arrayUnion(data) }).catch(() =>
      setDoc(ref, { weeklyReviews: [data] }, { merge: true }).catch(console.error)
    );
  }

  const weeklyReviewModal = showWeeklyReview && (
    <WeeklyReviewModal
      todos={todosHook.allTodos}
      history={todosHook.history}
      streak={todosHook.streak}
      weeklyData={todosHook.weeklyData}
      onClose={() => setShowWeeklyReview(false)}
      onSave={handleSaveWeeklyReview}
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
      <SubscriptionProvider>
      <div className="flex flex-col h-screen" style={{ background: 'var(--bg)' }}>
        <div style={{ height: 'env(safe-area-inset-top)', background: 'var(--card)', flexShrink: 0 }} />

        {/* 모바일 네비게이션 헤더 */}
        {view === 'projects' && projectsSelectedId !== null ? (
          <div
            className="flex-shrink-0 relative flex items-center h-11 px-4"
            style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}
          >
            <button
              onClick={() => setProjectsSelectedId(null)}
              className="flex items-center gap-1 text-sm font-medium z-10 active:opacity-60 transition-opacity"
              style={{ color: 'var(--accent)' }}
            >
              <ChevronLeft className="w-4 h-4" />
              {t.nav.projects}
            </button>
            <span
              className="absolute inset-x-0 flex items-center justify-center text-sm font-semibold pointer-events-none"
              style={{ color: 'var(--text)' }}
            >
              {projectsSelectedId === '__unassigned__'
                ? t.projects.unassigned
                : (projectsHook.projects.find(p => p.id === projectsSelectedId)?.name ?? '')}
            </span>
          </div>
        ) : (view === 'kanban' || view === 'matrix') ? (
          <div
            className="flex-shrink-0 flex items-center px-4 gap-3"
            style={{ height: 52, background: 'var(--card)', borderBottom: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--border)' }}>
              {([
                { key: 'list',     label: lang === 'ko' ? '목록'    : 'List' },
                { key: 'projects', label: lang === 'ko' ? '그룹'    : 'Groups' },
                ...(enableKanban ? [{ key: 'kanban',  label: lang === 'ko' ? '칸반'    : 'Kanban' }] : []),
                ...(enableMatrix ? [{ key: 'matrix',  label: lang === 'ko' ? '매트릭스' : 'Matrix' }] : []),
              ] as { key: ViewType; label: string }[]).map(seg => (
                <button
                  key={seg.key}
                  onClick={() => { if (seg.key === 'projects') setProjectsSelectedId(null); setView(seg.key); }}
                  className="px-3 py-1 rounded-lg text-sm font-semibold transition-all active:scale-95"
                  style={{
                    background: view === seg.key ? 'var(--card)' : 'transparent',
                    color: view === seg.key ? 'var(--text)' : 'var(--muted)',
                    boxShadow: view === seg.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {seg.label}
                </button>
              ))}
            </div>
          </div>
        ) : MOBILE_HEADER[view] ? (
          <div
            className="flex-shrink-0 relative flex items-center h-11 px-4"
            style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}
          >
            {MOBILE_HEADER[view]!.backTo ? (
              <>
                <button
                  onClick={() => setView(MOBILE_HEADER[view]!.backTo!)}
                  className="flex items-center gap-1 text-sm font-medium z-10 active:opacity-60 transition-opacity"
                  style={{ color: 'var(--accent)' }}
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t.common.back}
                </button>
                <span
                  className="absolute inset-0 flex items-center justify-center text-sm font-semibold pointer-events-none"
                  style={{ color: 'var(--text)' }}
                >
                  {MOBILE_HEADER[view]!.title}
                </span>
              </>
            ) : (
              <>
                <h1 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
                  {MOBILE_HEADER[view]!.title}
                </h1>
                {MOBILE_HEADER[view]!.showSearch && (
                  <button
                    onClick={() => setShowSearch(true)}
                    className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg active:opacity-60"
                    style={{ color: 'var(--muted)' }}
                  >
                    <Search className="w-5 h-5" />
                  </button>
                )}
              </>
            )}
          </div>
        ) : null}

        <main
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 56px)' }}
        >
          <div key={(['list','projects','kanban','matrix'] as ViewType[]).includes(view) ? 'hailtab' : view} className="view-enter">{viewContent}</div>
        </main>

        {offlineBanner}
        {forceUpdateModal}
        {floatingElements}
        {searchOverlay}
        {whatsNewModal}
        {nicknameModal}
        {weeklyReviewModal}
        <OverdueBadge
          overdueTodos={overdueTodos}
          onToggle={handleToggleComplete}
          onEditTodo={id => { handleViewChange('list'); setAutoEditTodoId(id); }}
          bottomOffset={showFab ? 140 : 72}
          align="right"
          sideOffset={20}
        />
        <BottomTabBar
          view={view}
          onViewChange={handleViewChange}
          enableAiChat={enableAiChat}
          onAiChat={() => setAiChatOpen(true)}
          aiChatOpen={aiChatOpen}
        />
        {enableAiChat && (
          <AIChatPanel
            onAddTodo={handleAddTodo}
            onUpdateTodo={todosHook.updateTodo}
            onAddSubtask={todosHook.addSubtask}
            todos={todosHook.allTodos}
            isMobile={true}
            mobileOpen={aiChatOpen}
            onMobileClose={() => setAiChatOpen(false)}
          />
        )}
        <PaywallModal />
      </div>
      </SubscriptionProvider>
    );
  }

  // ─── 웹 레이아웃 (사이드바) ───
  return (
    <SubscriptionProvider>
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar
        view={view}
        onViewChange={handleViewChange}
        projects={projectsHook.projects}
        activeProjectId={activeProjectId}
        onProjectSelect={(id) => {
          if (id === '__unassigned__') {
            setProjectsSelectedId('__unassigned__');
            setView('projects');
          } else {
            setActiveProjectId(id);
            todosHook.setFilterProjectId(id);
            if (id !== null) setView('list');
          }
        }}
        stats={todosHook.stats}
        streak={todosHook.streak}
        weeklyData={todosHook.weeklyData}
        allTodos={todosHook.allTodos}
        onAddProject={projectsHook.addProject}
        onUpdateProject={projectsHook.updateProject}
        onDeleteProject={handleDeleteProject}
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

        {/* 뷰 모드 전환 (목록 서브뷰, 웹) - 캘린더는 사이드바에서 직접 이동 */}
        {false && (
          <div
            className="flex-shrink-0 flex items-center gap-1.5 px-4 pt-3 pb-2 overflow-x-auto"
            style={{ scrollbarWidth: 'none', borderBottom: '1px solid var(--border)' }}
          >
            {[].map((opt: { value: ViewType; label: string }) => (
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
          <div key={(['list','projects','kanban','matrix'] as ViewType[]).includes(view) ? 'hailtab' : view} className="view-enter">{viewContent}</div>
        </main>
      </div>

      {forceUpdateModal}
      {floatingElements}
      {whatsNewModal}
      {nicknameModal}
      {weeklyReviewModal}
      {enableAiChat && (
        <AIChatPanel
          onAddTodo={handleAddTodo}
          onUpdateTodo={todosHook.updateTodo}
          onAddSubtask={todosHook.addSubtask}
          todos={todosHook.allTodos}
          isMobile={isMobileLayout}
          mobileOpen={isMobileLayout ? aiChatOpen : undefined}
          onMobileClose={isMobileLayout ? () => setAiChatOpen(false) : undefined}
        />
      )}
      <OverdueBadge
        overdueTodos={overdueTodos}
        onToggle={handleToggleComplete}
        onEditTodo={id => { handleViewChange('list'); setAutoEditTodoId(id); }}
        bottomOffset={showFab ? 104 : 28}
        align="right"
        sideOffset={28}
      />
      <PaywallModal />
    </div>
    </SubscriptionProvider>
  );
}
