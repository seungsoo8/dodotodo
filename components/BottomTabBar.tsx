'use client';

import { ClipboardList, Calendar, BarChart2, Settings, Sparkles, Sun } from 'lucide-react';
import { ViewType } from '@/types/todo';
import { hapticLight } from '@/lib/haptics';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  view: ViewType;
  onViewChange: (v: ViewType) => void;
  onSearch?: () => void;
  enableAiChat?: boolean;
  onAiChat?: () => void;
  aiChatOpen?: boolean;
}

// Secondary views belong to a parent tab
const PARENT_TAB: Partial<Record<ViewType, ViewType>> = {
  kanban:     'list',
  matrix:     'list',
  projects:   'list',
  trash:      'settings',
  help:       'settings',
  patchnotes: 'settings',
  admin:      'settings',
};

const TAB_DEFS: { value: ViewType; icon: React.ReactNode; labelKey: 'today' | 'todos' | 'calendar' | 'analytics' | 'settings' }[] = [
  { value: 'today',     icon: <Sun className="w-6 h-6" />,          labelKey: 'today' },
  { value: 'list',      icon: <ClipboardList className="w-6 h-6" />, labelKey: 'todos' },
  { value: 'calendar',  icon: <Calendar className="w-6 h-6" />,      labelKey: 'calendar' },
  { value: 'analytics', icon: <BarChart2 className="w-6 h-6" />,     labelKey: 'analytics' },
  { value: 'settings',  icon: <Settings className="w-6 h-6" />,      labelKey: 'settings' },
];

export default function BottomTabBar({ view, onViewChange, enableAiChat, onAiChat, aiChatOpen }: Props) {
  const { t } = useLanguage();
  const activeTab = (PARENT_TAB[view] ?? view) as ViewType;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30"
      style={{
        background: 'var(--card)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex h-14">
        {TAB_DEFS.map(tab => {
          const isActive = activeTab === tab.value && !aiChatOpen;
          const label = tab.labelKey === 'today'     ? t.nav.today
            : tab.labelKey === 'todos'     ? t.nav.todos
            : tab.labelKey === 'calendar'  ? t.nav.calendar
            : tab.labelKey === 'analytics' ? t.nav.analytics
            : t.nav.settings;
          return (
            <button
              key={tab.value}
              onClick={() => { hapticLight(); onViewChange(tab.value); }}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90"
              style={{ color: isActive ? 'var(--accent)' : 'var(--muted)' }}
            >
              {tab.icon}
              <span className="text-xs font-medium" style={{ fontSize: '10px', fontWeight: isActive ? 600 : 400 }}>
                {label}
              </span>
            </button>
          );
        })}

        {enableAiChat && (
          <button
            onClick={() => { hapticLight(); onAiChat?.(); }}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90"
            style={{ color: aiChatOpen ? 'var(--accent)' : 'var(--muted)' }}
          >
            <div className="relative">
              <Sparkles className="w-6 h-6" />
              {!aiChatOpen && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
                  style={{ background: '#a78bfa' }}
                />
              )}
            </div>
            <span className="text-xs font-medium" style={{ fontSize: '10px', fontWeight: aiChatOpen ? 600 : 400 }}>
              AI
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
