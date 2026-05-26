'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts';
import {
  Clock, ClipboardList, Calendar, BarChart2, LayoutGrid, Columns2,
  Trash2, HelpCircle, Activity, Settings, ShieldCheck, FolderOpen, Search, Flame,
} from 'lucide-react';
import { ViewType, Project, Todo, WeeklyData } from '@/types/todo';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { useGamification } from '@/hooks/useGamification';
import { useLanguage } from '@/contexts/LanguageContext';
import IconPickerPopover from './IconPickerPopover';

const CURRENT_VERSION = '2.34'; // deploy:version

interface SidebarProps {
  view: ViewType;
  onViewChange: (v: ViewType) => void;
  projects: Project[];
  activeProjectId: string | null;
  onProjectSelect: (id: string | null) => void;
  stats: { total: number; active: number; completed: number };
  streak: number;
  weeklyData: WeeklyData[];
  allTodos: Todo[];
  onAddProject: (data: Omit<Project, 'id'>) => void;
  onUpdateProject: (id: string, updates: Partial<Omit<Project, 'id'>>) => void;
  onDeleteProject: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  trashCount?: number;
  enableMatrix?: boolean;
  enableKanban?: boolean;
  onSearch?: () => void;
  userProfile?: { nickname: string; profileIcon: string };
  onEditProfile?: () => void;
}


const NAV_ICONS: Record<ViewType, React.ReactNode> = {
  today:      <Clock className="w-4 h-4 flex-shrink-0" />,
  list:       <ClipboardList className="w-4 h-4 flex-shrink-0" />,
  calendar:   <Calendar className="w-4 h-4 flex-shrink-0" />,
  analytics:  <BarChart2 className="w-4 h-4 flex-shrink-0" />,
  matrix:     <LayoutGrid className="w-4 h-4 flex-shrink-0" />,
  kanban:     <Columns2 className="w-4 h-4 flex-shrink-0" />,
  trash:      <Trash2 className="w-4 h-4 flex-shrink-0" />,
  help:       <HelpCircle className="w-4 h-4 flex-shrink-0" />,
  habit:      <Activity className="w-4 h-4 flex-shrink-0" />,
  settings:   <Settings className="w-4 h-4 flex-shrink-0" />,
  patchnotes:     null,
  admin:          <ShieldCheck className="w-4 h-4 flex-shrink-0" />,
  projects:       <FolderOpen className="w-4 h-4 flex-shrink-0" />,
};

const PROJECT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6'];

function NavButton({ item, active, onClick }: { item: { value: ViewType; icon: React.ReactNode; label: string }; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium mb-0.5 transition-all text-left"
      style={{
        background: active ? 'var(--sidebar-active)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--sidebar-muted)',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--sidebar-hover)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {item.icon}
      {item.label}
    </button>
  );
}

export default function Sidebar({
  view,
  onViewChange,
  projects,
  activeProjectId,
  onProjectSelect,
  stats,
  streak,
  weeklyData,
  allTodos,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  isOpen,
  onToggle,
  trashCount = 0,
  enableMatrix = false,
  enableKanban = false,
  onSearch,
  userProfile,
  onEditProfile,
}: SidebarProps) {
  const { t, lang } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user: session, signOut } = useAuth();
  const isAdmin = !!session && !!(process.env.NEXT_PUBLIC_ADMIN_UID) && session.uid === process.env.NEXT_PUBLIC_ADMIN_UID;
  const [mounted, setMounted] = useState(false);

  const ALL_NAV_ITEMS: { value: ViewType; icon: React.ReactNode; label: string; optional?: boolean }[] = [
    { value: 'today', label: t.nav.todayFull, icon: NAV_ICONS.today },
    { value: 'list', label: t.nav.listFull, icon: NAV_ICONS.list },
    { value: 'calendar', label: t.nav.calendar, icon: NAV_ICONS.calendar },
    { value: 'analytics', label: t.nav.analytics, icon: NAV_ICONS.analytics },
    { value: 'matrix', label: t.nav.matrix, optional: true, icon: NAV_ICONS.matrix },
    { value: 'kanban', label: t.nav.kanban, optional: true, icon: NAV_ICONS.kanban },
    { value: 'trash', label: t.nav.trash, icon: NAV_ICONS.trash },
    { value: 'help', label: t.nav.help, icon: NAV_ICONS.help },
  ];
  const [showAddProject, setShowAddProject] = useState(false);
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('💼');
  const [editColor, setEditColor] = useState('#6366f1');
  const [isMobile, setIsMobile] = useState(false);
  const [appVersion, setAppVersion] = useState(CURRENT_VERSION);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      App.getInfo().then(info => setAppVersion(info.version)).catch(() => {});
    }
  }, []);

  const NAV_ITEMS = ALL_NAV_ITEMS.filter(item => {
    if (item.value === 'matrix') return enableMatrix;
    if (item.value === 'kanban') return enableKanban;
    return true;
  });
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectIcon, setNewProjectIcon] = useState('💼');
  const [newProjectColor, setNewProjectColor] = useState('#6366f1');

  useEffect(() => setMounted(true), []);

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const gami = useGamification(allTodos);

  function handleAddProject() {
    if (!newProjectName.trim()) return;
    onAddProject({ name: newProjectName.trim(), icon: newProjectIcon, color: newProjectColor });
    setNewProjectName('');
    setShowAddProject(false);
  }

  function projectTodoCount(id: string) {
    return allTodos.filter(todo => todo.projectId === id && !todo.completed).length;
  }

  const locale = lang === 'ko' ? 'ko-KR' : 'en-US';
  const today = new Date().toLocaleDateString(locale, { month: 'long', day: 'numeric', weekday: 'short' });

  return (
    <>
    <aside
      className="flex-shrink-0 flex flex-col h-full overflow-hidden transition-all duration-300"
      style={{
        width: isOpen ? '256px' : '52px',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        position: 'relative',
        zIndex: 20,
      }}
    >
      {/* Toggle button + logo row */}
      <div
        className="flex items-center flex-shrink-0"
        style={{
          minHeight: '56px',
          paddingLeft: isOpen ? '16px' : '10px',
          paddingRight: isOpen ? '12px' : '10px',
          paddingBottom: '8px',
          borderBottom: '1px solid var(--sidebar-border)',
          justifyContent: isOpen ? 'space-between' : 'center',
          alignItems: 'flex-end',
        }}
      >
        {isOpen && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(145deg, var(--accent), #7c7af8)' }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-semibold text-sm whitespace-nowrap" style={{ color: 'var(--sidebar-text)' }}>Plenio</span>
            <span className="text-xs whitespace-nowrap" style={{ color: 'var(--sidebar-muted)' }}>ver {appVersion}</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg transition-colors flex-shrink-0"
          style={{ color: 'var(--sidebar-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--sidebar-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          title={isOpen ? t.sidebar.collapse : t.sidebar.expand}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M6 5l7 7-7 7" />
            )}
          </svg>
        </button>
      </div>

      {/* Collapsed: icon-only nav */}
      {!isOpen && (
        <nav className="flex flex-col items-center gap-1 pt-3 px-1.5 flex-1 overflow-y-auto">
          {/* 검색 아이콘 */}
          <button
            onClick={onSearch}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all flex-shrink-0"
            style={{ color: 'var(--sidebar-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--sidebar-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            title={t.sidebar.search}
          >
            <Search className="w-4 h-4" />
          </button>
          {NAV_ITEMS.filter(i => i.value !== 'trash' && i.value !== 'help').map(item => (
            <button
              key={item.value}
              onClick={() => onViewChange(item.value)}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all flex-shrink-0"
              style={{
                background: view === item.value ? 'var(--sidebar-active)' : 'transparent',
                color: view === item.value ? 'var(--accent)' : 'var(--sidebar-muted)',
              }}
              onMouseEnter={e => { if (view !== item.value) e.currentTarget.style.background = 'var(--sidebar-hover)'; }}
              onMouseLeave={e => { if (view !== item.value) e.currentTarget.style.background = 'transparent'; }}
              title={item.label}
            >
              {item.icon}
            </button>
          ))}
          {/* 휴지통 (뱃지 포함) */}
          <div className="relative">
            <button
              onClick={() => onViewChange('trash')}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
              style={{
                background: view === 'trash' ? 'var(--sidebar-active)' : 'transparent',
                color: view === 'trash' ? 'var(--accent)' : 'var(--sidebar-muted)',
              }}
              onMouseEnter={e => { if (view !== 'trash') e.currentTarget.style.background = 'var(--sidebar-hover)'; }}
              onMouseLeave={e => { if (view !== 'trash') e.currentTarget.style.background = 'transparent'; }}
              title={t.nav.trash}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            {trashCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full text-white flex items-center justify-center" style={{ background: '#ef4444', fontSize: 8, fontWeight: 700 }}>
                {trashCount > 9 ? '9+' : trashCount}
              </span>
            )}
          </div>
          {/* 관리자 대시보드 (어드민만) */}
          {isAdmin && (
            <button
              onClick={() => onViewChange('admin')}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
              style={{
                background: view === 'admin' ? 'var(--sidebar-active)' : 'transparent',
                color: view === 'admin' ? '#f59e0b' : 'var(--sidebar-muted)',
              }}
              onMouseEnter={e => { if (view !== 'admin') e.currentTarget.style.background = 'var(--sidebar-hover)'; }}
              onMouseLeave={e => { if (view !== 'admin') e.currentTarget.style.background = 'transparent'; }}
              title={t.nav.admin}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </button>
          )}
          {/* 레벨 뱃지 (접힌 상태) */}
          <div
            className="w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 font-bold text-white text-xs"
            style={{ background: 'linear-gradient(135deg, var(--accent), #7c7af8)' }}
            title={`Lv.${gami.level} ${gami.rank} · ${gami.totalXP} XP`}
          >
            {gami.level}
          </div>

          {/* 설정/도움말 아이콘 (접힌 상태 하단) */}
          <div className="flex-1" />
          <button
            onClick={() => onViewChange('help')}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
            style={{
              background: view === 'help' ? 'var(--sidebar-active)' : 'transparent',
              color: view === 'help' ? 'var(--accent)' : 'var(--sidebar-muted)',
            }}
            onMouseEnter={e => { if (view !== 'help') e.currentTarget.style.background = 'var(--sidebar-hover)'; }}
            onMouseLeave={e => { if (view !== 'help') e.currentTarget.style.background = 'transparent'; }}
            title={t.nav.help}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
            </svg>
          </button>
          <button
            onClick={() => onViewChange('settings')}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all mb-3"
            style={{
              background: view === 'settings' ? 'var(--sidebar-active)' : 'transparent',
              color: view === 'settings' ? 'var(--accent)' : 'var(--sidebar-muted)',
            }}
            onMouseEnter={e => { if (view !== 'settings') e.currentTarget.style.background = 'var(--sidebar-hover)'; }}
            onMouseLeave={e => { if (view !== 'settings') e.currentTarget.style.background = 'transparent'; }}
            title={t.nav.settings}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </nav>
      )}

      {/* Expanded: full sidebar content */}
      {isOpen && (
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {/* Header info */}
          <div className="px-4 pt-3 pb-4" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
            <div className="flex items-center justify-between">
              <p className="text-xs" style={{ color: 'var(--sidebar-muted)' }}>{today}</p>
              {mounted && (
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--sidebar-muted)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--sidebar-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  title={theme === 'dark' ? t.sidebar.lightMode : t.sidebar.darkMode}
                >
                  {theme === 'dark' ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="5" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                    </svg>
                  )}
                </button>
              )}
            </div>

            {/* Completion ring + stats */}
            <div className="flex items-center gap-3 mt-3">
              <div className="relative w-12 h-12 flex-shrink-0">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.5" fill="none"
                    stroke="var(--accent)" strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${completionRate * 0.974} 97.4`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: 'var(--sidebar-text)' }}>
                  {completionRate}%
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span className="text-xs" style={{ color: 'var(--sidebar-muted)' }}>{t.sidebar.inProgress} <b style={{ color: 'var(--sidebar-text)' }}>{stats.active}</b></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-xs" style={{ color: 'var(--sidebar-muted)' }}>{t.sidebar.completed} <b style={{ color: 'var(--sidebar-text)' }}>{stats.completed}</b></span>
                </div>
                {streak > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold" style={{ color: '#f59e0b' }}>{t.sidebar.streakDays(streak)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* XP 레벨 바 */}
            <div className="mt-3 flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--accent), #7c7af8)', fontSize: 11 }}
                title={`Lv.${gami.level} ${gami.rank}`}
              >
                {gami.level}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--sidebar-muted)' }}>{gami.rank}</span>
                  <span style={{ color: 'var(--sidebar-muted)', fontSize: 10 }}>{gami.xpInCurrentLevel}/{gami.xpToNextLevel} XP</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${gami.progressPercent}%`, background: 'linear-gradient(90deg, var(--accent), #7c7af8)' }}
                  />
                </div>
              </div>
            </div>

            {/* 마감일 현황 뱃지 */}
            {(() => {
              const today = new Date().toISOString().slice(0, 10);
              const nowStr = new Date().toISOString().slice(0, 10);
              const dueToday = allTodos.filter(todo => !todo.completed && todo.dueDate === nowStr).length;
              const overdue = allTodos.filter(todo => !todo.completed && todo.dueDate && todo.dueDate < nowStr).length;
              if (dueToday === 0) return null;
              return (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {dueToday > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>
                      {t.sidebar.todayBadge(dueToday)}
                    </span>
                  )}
                </div>
              );
            })()}
          </div>

          {/* 검색 버튼 */}
          <div className="px-3 pt-3">
            <button
              onClick={onSearch}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all"
              style={{ background: 'var(--sidebar-hover)', color: 'var(--sidebar-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--sidebar-hover)')}
            >
              <Search className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">{t.common.search}</span>
              <kbd className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--sidebar-muted)', fontSize: 10 }}>⌘K</kbd>
            </button>
          </div>

          {/* Navigation */}
          <nav className="px-3 pt-3 space-y-3">
            {/* 기본 뷰 */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider px-2 mb-1" style={{ color: 'var(--sidebar-muted)', opacity: 0.6 }}>{t.sidebar.basicSection}</p>
              {NAV_ITEMS.filter(i => ['today', 'list', 'kanban'].includes(i.value)).map(item => (
                <NavButton key={item.value} item={item} active={view === item.value} onClick={() => onViewChange(item.value)} />
              ))}
            </div>

            {/* 분석 & 도구 */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider px-2 mb-1" style={{ color: 'var(--sidebar-muted)', opacity: 0.6 }}>{t.sidebar.analyticsSection}</p>
              {NAV_ITEMS.filter(i => ['calendar', 'matrix', 'analytics'].includes(i.value)).map(item => (
                <NavButton key={item.value} item={item} active={view === item.value} onClick={() => onViewChange(item.value)} />
              ))}
            </div>

            {/* 관리 */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider px-2 mb-1" style={{ color: 'var(--sidebar-muted)', opacity: 0.6 }}>{t.sidebar.manageSection}</p>
              <button
                onClick={() => onViewChange('trash')}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium mb-0.5 transition-all text-left"
                style={{
                  background: view === 'trash' ? 'var(--sidebar-active)' : 'transparent',
                  color: view === 'trash' ? 'var(--accent)' : 'var(--sidebar-muted)',
                }}
                onMouseEnter={e => { if (view !== 'trash') e.currentTarget.style.background = 'var(--sidebar-hover)'; }}
                onMouseLeave={e => { if (view !== 'trash') e.currentTarget.style.background = 'transparent'; }}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="flex-1">{t.nav.trash}</span>
                {trashCount > 0 && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>
                    {trashCount}
                  </span>
                )}
              </button>
              <NavButton
                item={ALL_NAV_ITEMS.find(i => i.value === 'help')!}
                active={view === 'help'}
                onClick={() => onViewChange('help')}
              />
              {isAdmin && (
                <button
                  onClick={() => onViewChange('admin')}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium mb-0.5 transition-all text-left"
                  style={{
                    background: view === 'admin' ? 'rgba(245,158,11,0.12)' : 'transparent',
                    color: view === 'admin' ? '#f59e0b' : 'var(--sidebar-muted)',
                  }}
                  onMouseEnter={e => { if (view !== 'admin') e.currentTarget.style.background = 'var(--sidebar-hover)'; }}
                  onMouseLeave={e => { if (view !== 'admin') e.currentTarget.style.background = 'transparent'; }}
                >
                  {NAV_ICONS.admin}
                  {t.nav.admin}
                </button>
              )}
            </div>
          </nav>

          {/* Projects */}
          <div className="px-3 pt-5">
            <div className="flex items-center justify-between px-2 mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--sidebar-muted)' }}>{t.sidebar.projectSection}</p>
              {isMobile ? (
                <button
                  onClick={() => { setEditMode(v => !v); setShowAddProject(false); }}
                  className="text-xs px-2 py-0.5 rounded-md transition-all"
                  style={{ color: editMode ? 'var(--accent)' : 'var(--sidebar-muted)', background: editMode ? 'rgba(99,102,241,0.12)' : 'transparent' }}
                >
                  {editMode ? t.sidebar.doneEdit : t.sidebar.editProject}
                </button>
              ) : (
                <button
                  onClick={() => setShowAddProject(v => !v)}
                  className="w-4 h-4 flex items-center justify-center rounded transition-opacity hover:opacity-60"
                  style={{ color: 'var(--sidebar-muted)' }}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
            </div>

            <button
              onClick={() => onProjectSelect(null)}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm mb-0.5 transition-all text-left"
              style={{
                background: activeProjectId === null ? 'var(--sidebar-active)' : 'transparent',
                color: activeProjectId === null ? 'var(--accent)' : 'var(--sidebar-muted)',
              }}
              onMouseEnter={e => { if (activeProjectId !== null) e.currentTarget.style.background = 'var(--sidebar-hover)'; }}
              onMouseLeave={e => { if (activeProjectId !== null) e.currentTarget.style.background = 'transparent'; }}
            >
              <span className="text-xs">📋</span>
              <span className="flex-1">{t.sidebar.allProjects}</span>
              <span className="text-xs tabular-nums px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--sidebar-muted)' }}>
                {allTodos.filter(todo => !todo.completed).length}
              </span>
            </button>

            {projects.map(p => {
              const count = projectTodoCount(p.id);
              const isHovered = hoveredProjectId === p.id;
              return (
                <div
                  key={p.id}
                  className="relative flex items-center rounded-lg mb-0.5 group"
                  style={{ background: activeProjectId === p.id ? 'var(--sidebar-active)' : isHovered ? 'var(--sidebar-hover)' : 'transparent' }}
                  onMouseEnter={() => setHoveredProjectId(p.id)}
                  onMouseLeave={() => setHoveredProjectId(null)}
                >
                  <button
                    onClick={() => onProjectSelect(p.id)}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 text-sm text-left flex-1 min-w-0"
                    style={{ color: activeProjectId === p.id ? p.color : 'var(--sidebar-muted)' }}
                  >
                    <span className="text-xs w-3.5 flex-shrink-0">{p.icon}</span>
                    <span className="flex-1 truncate">{p.name}</span>
                    {count > 0 && !isHovered && (
                      <span className="text-xs tabular-nums px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--sidebar-muted)' }}>
                        {count}
                      </span>
                    )}
                  </button>
                  {(isHovered || (isMobile && editMode)) && (
                    <div className="flex items-center gap-0.5 mr-1.5">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setEditingProject(p);
                          setEditName(p.name);
                          setEditIcon(p.icon);
                          setEditColor(p.color);
                        }}
                        className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-md transition-all hover:bg-white/10"
                        style={{ color: 'var(--sidebar-muted)' }}
                        title="편집"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); onDeleteProject(p.id); }}
                        className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-md transition-all hover:bg-red-500/20"
                        style={{ color: 'var(--sidebar-muted)' }}
                        title={t.sidebar.deleteProject}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* 미지정 프로젝트 */}
            {(() => {
              const unassignedCount = allTodos.filter(todo => !todo.projectId && !todo.completed && !todo.deletedAt).length;
              const isActive = activeProjectId === '__unassigned__';
              return (
                <div
                  className="relative flex items-center rounded-lg mb-0.5"
                  style={{ background: isActive ? 'var(--sidebar-active)' : 'transparent' }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--sidebar-hover)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <button
                    onClick={() => onProjectSelect('__unassigned__')}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 text-sm text-left flex-1 min-w-0"
                    style={{ color: isActive ? 'var(--sidebar-muted)' : 'var(--sidebar-muted)' }}
                  >
                    <span className="text-xs w-3.5 flex-shrink-0">📂</span>
                    <span className="flex-1 truncate">{t.projects.unassigned}</span>
                    {unassignedCount > 0 && (
                      <span className="text-xs tabular-nums px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--sidebar-muted)' }}>
                        {unassignedCount}
                      </span>
                    )}
                  </button>
                </div>
              );
            })()}

            {isMobile && editMode && !showAddProject && (
              <button
                onClick={() => setShowAddProject(true)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs mt-1 transition-all"
                style={{ color: 'var(--accent)', border: '1px dashed rgba(99,102,241,0.4)' }}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                {t.sidebar.newProject}
              </button>
            )}

            {showAddProject && (
              <div className="mt-2 p-3 rounded-xl space-y-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--sidebar-border)' }}>
                <input
                  type="text"
                  placeholder={t.sidebar.projectName}
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddProject(); if (e.key === 'Escape') setShowAddProject(false); }}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--sidebar-text)', border: '1px solid var(--sidebar-border)' }}
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--sidebar-muted)' }}>아이콘</span>
                  <IconPickerPopover value={newProjectIcon} onChange={setNewProjectIcon} size="sm" />
                </div>
                <div className="flex gap-1 flex-wrap">
                  {PROJECT_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewProjectColor(color)}
                      className="w-5 h-5 rounded-full transition-transform"
                      style={{ background: color, transform: newProjectColor === color ? 'scale(1.25)' : 'scale(1)' }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddProject}
                    className="flex-1 py-1 text-xs font-medium rounded-lg text-white transition-opacity hover:opacity-80"
                    style={{ background: 'var(--accent)' }}
                  >
                    {t.sidebar.addProject}
                  </button>
                  <button
                    onClick={() => setShowAddProject(false)}
                    className="px-3 py-1 text-xs rounded-lg transition-opacity hover:opacity-60"
                    style={{ color: 'var(--sidebar-muted)' }}
                  >
                    {t.common.cancel}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Weekly chart */}
          <div className="px-3 pt-5 mt-auto">
            <p className="text-xs font-semibold uppercase tracking-wider px-2 mb-3" style={{ color: 'var(--sidebar-muted)' }}>
              {t.analytics.weeklyCompleted}
            </p>
            <div style={{ height: 60 }}>
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} barSize={14} margin={{ top: 2, right: 4, left: 4, bottom: 0 }}>
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 9, fill: 'var(--sidebar-muted)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Bar dataKey="completed" radius={[3, 3, 0, 0]}>
                      {weeklyData.map((entry, i) => (
                        <Cell key={i} fill={entry.completed > 0 ? 'var(--accent)' : 'rgba(99,102,241,0.12)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Settings button */}
          <button
            onClick={() => onViewChange('settings')}
            className="mx-3 mb-1 flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all text-left w-[calc(100%-24px)]"
            style={{
              background: view === 'settings' ? 'var(--sidebar-active)' : 'transparent',
              color: view === 'settings' ? 'var(--accent)' : 'var(--sidebar-muted)',
            }}
            onMouseEnter={e => { if (view !== 'settings') e.currentTarget.style.background = 'var(--sidebar-hover)'; }}
            onMouseLeave={e => { if (view !== 'settings') e.currentTarget.style.background = 'transparent'; }}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {t.nav.settings}
          </button>

          {/* User info + logout */}
          {session && (
            <div
              className="px-3 py-3 mx-3 mb-3 mt-4 rounded-xl flex items-center gap-2.5 cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--sidebar-border)' }}
              onClick={onEditProfile}
              title={onEditProfile ? t.settings.editProfile : undefined}
            >
              {userProfile?.profileIcon ? (
                <div
                  className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-base"
                  style={{ background: 'rgba(99,102,241,0.12)' }}
                >
                  {userProfile.profileIcon}
                </div>
              ) : session.photoURL ? (
                <img
                  src={session.photoURL}
                  alt="avatar"
                  className="w-7 h-7 rounded-full flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: 'var(--accent)' }}
                >
                  {session.displayName?.[0] ?? session.email?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--sidebar-text)' }}>
                  {userProfile?.nickname || session.displayName || session.email || t.sidebar.appleUser}
                </p>
              </div>
              <button
                onClick={() => signOut()}
                title={t.settings.logout}
                className="p-1.5 rounded-lg transition-colors flex-shrink-0"
                style={{ color: 'var(--sidebar-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--sidebar-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </aside>

      {/* 프로젝트 편집 모달 */}
      {editingProject && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={e => { if (e.target === e.currentTarget) setEditingProject(null); }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5 flex flex-col gap-4"
            style={{ background: 'var(--card)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', border: '1px solid var(--border)' }}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{editIcon}</span>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>그룹 편집</h3>
              </div>
              <button
                onClick={() => setEditingProject(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'var(--border)', color: 'var(--muted)' }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 이름 입력 */}
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && editName.trim()) {
                  onUpdateProject(editingProject.id, { name: editName.trim(), icon: editIcon, color: editColor });
                  setEditingProject(null);
                }
                if (e.key === 'Escape') setEditingProject(null);
              }}
              autoFocus
              className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
              style={{ background: 'var(--hover)', color: 'var(--text)', border: '1.5px solid var(--border)' }}
              placeholder="그룹 이름"
            />

            {/* 아이콘 선택 */}
            <div>
              <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--muted)' }}>아이콘</p>
              <IconPickerPopover value={editIcon} onChange={setEditIcon} />
            </div>

            {/* 색상 선택 */}
            <div>
              <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--muted)' }}>색상</p>
              <div className="flex gap-2 flex-wrap">
                {PROJECT_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setEditColor(color)}
                    className="w-7 h-7 rounded-full transition-transform"
                    style={{
                      background: color,
                      transform: editColor === color ? 'scale(1.3)' : 'scale(1)',
                      boxShadow: editColor === color ? `0 0 0 2px var(--card), 0 0 0 3.5px ${color}` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* 저장 버튼 */}
            <button
              onClick={() => {
                if (!editName.trim()) return;
                onUpdateProject(editingProject.id, { name: editName.trim(), icon: editIcon, color: editColor });
                setEditingProject(null);
              }}
              disabled={!editName.trim()}
              className="w-full py-2.5 text-sm font-semibold rounded-xl text-white disabled:opacity-40"
              style={{ background: 'var(--accent)' }}
            >
              저장
            </button>
          </div>
        </div>
      )}
    </>
  );
}
