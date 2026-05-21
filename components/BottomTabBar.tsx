'use client';

import { ClipboardList, FolderOpen, Calendar, BarChart2, Settings } from 'lucide-react';
import { ViewType } from '@/types/todo';
import { hapticLight } from '@/lib/haptics';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  view: ViewType;
  onViewChange: (v: ViewType) => void;
  onSearch?: () => void;
}

// Secondary views belong to a parent tab
const PARENT_TAB: Partial<Record<ViewType, ViewType>> = {
  kanban: 'list',
  matrix: 'list',
  today: 'list',
  trash: 'settings',
  help: 'settings',
};

const TAB_DEFS: { value: ViewType; icon: React.ReactNode; labelKey: 'list' | 'projects' | 'calendar' | 'analytics' | 'settings' }[] = [
  { value: 'list',      icon: <ClipboardList className="w-6 h-6" />, labelKey: 'list' },
  { value: 'calendar',  icon: <Calendar className="w-6 h-6" />,       labelKey: 'calendar' },
  { value: 'projects',  icon: <FolderOpen className="w-6 h-6" />,    labelKey: 'projects' },
  { value: 'analytics', icon: <BarChart2 className="w-6 h-6" />,      labelKey: 'analytics' },
  { value: 'settings',  icon: <Settings className="w-6 h-6" />,       labelKey: 'settings' },
];

export default function BottomTabBar({ view, onViewChange }: Props) {
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
          const isActive = activeTab === tab.value;
          const label = tab.labelKey === 'list' ? t.nav.list
            : tab.labelKey === 'projects' ? t.nav.projects
            : tab.labelKey === 'calendar' ? t.nav.calendar
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
      </div>
    </div>
  );
}
