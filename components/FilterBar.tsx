'use client';

import { useState } from 'react';
import { FilterStatus, SortOrder } from '@/types/todo';
import { useLanguage } from '@/contexts/LanguageContext';

interface FilterBarProps {
  filterStatus: FilterStatus;
  onStatusChange: (s: FilterStatus) => void;
  sortOrder: SortOrder;
  onSortChange: (s: SortOrder) => void;
  completedCount: number;
  onClearCompleted: () => void;
  allTags?: string[];
  filterTags?: string[];
  onTagToggle?: (tag: string) => void;
  filterDateFrom?: string;
  filterDateTo?: string;
  onDateFromChange?: (d: string) => void;
  onDateToChange?: (d: string) => void;
}

export default function FilterBar({
  filterStatus, onStatusChange,
  sortOrder, onSortChange,
  completedCount, onClearCompleted,
  allTags = [], filterTags = [], onTagToggle,
  filterDateFrom = '', filterDateTo = '',
  onDateFromChange, onDateToChange,
}: FilterBarProps) {
  const { t } = useLanguage();
  const STATUS_OPTIONS: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: t.status.all },
    { value: 'active', label: t.status.inProgress },
    { value: 'completed', label: t.status.completed },
  ];
  const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
    { value: 'manual', label: t.sort.manual },
    { value: 'dueDate', label: t.sort.dueDate },
    { value: 'createdAt', label: t.sort.createdAt },
  ];
  const [showAdvanced, setShowAdvanced] = useState(false);
  const hasActiveAdvanced = filterTags.length > 0 || !!filterDateFrom || !!filterDateTo;
  const hasActiveFilter = filterStatus !== 'all' || hasActiveAdvanced;

  return (
    <div className="space-y-1.5">
      {/* 상태 + 정렬 + 고급 필터 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
        <div
          className="flex items-center rounded-xl p-0.5 flex-shrink-0"
          style={{ background: 'var(--card)', boxShadow: 'var(--shadow-xs)' }}
        >
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onStatusChange(opt.value)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
              style={{
                background: filterStatus === opt.value ? 'var(--accent)' : 'transparent',
                color: filterStatus === opt.value ? '#ffffff' : 'var(--muted)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* 정렬 */}
        <div className="ml-auto flex-shrink-0">
          <select
            value={sortOrder}
            onChange={e => onSortChange(e.target.value as SortOrder)}
            className="text-xs py-1.5 pl-2.5 pr-6 rounded-xl outline-none appearance-none cursor-pointer"
            style={{
              background: 'var(--card)',
              boxShadow: 'var(--shadow-xs)',
              color: 'var(--muted)',
              border: 'none',
            }}
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* 고급 필터 토글 */}
        <button
          onClick={() => setShowAdvanced(v => !v)}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl transition-all relative"
          style={{
            background: hasActiveAdvanced ? 'var(--accent-muted)' : 'var(--card)',
            boxShadow: 'var(--shadow-xs)',
            color: hasActiveAdvanced ? 'var(--accent)' : 'var(--muted)',
          }}
          title={t.filter.advancedFilter}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          {hasActiveAdvanced && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
          )}
        </button>
      </div>

      {/* 완료 삭제 + 필터 초기화 */}
      {(completedCount > 0 || hasActiveFilter) && (
        <div className="flex items-center gap-2">
          {completedCount > 0 && (
            <button
              onClick={onClearCompleted}
              className="text-xs px-3 py-1.5 rounded-xl transition-colors"
              style={{ color: 'var(--destructive)', background: 'rgba(255,59,48,0.08)' }}
            >
              {t.filter.deleteCompletedCount(completedCount)}
            </button>
          )}
        </div>
      )}

      {/* 고급 필터 패널 */}
      {showAdvanced && (
        <div
          className="rounded-2xl p-4 space-y-4"
          style={{ background: 'var(--card)', boxShadow: 'var(--shadow-sm)' }}
        >
          {allTags.length > 0 && onTagToggle && (
            <div>
              <p className="text-xs font-semibold mb-2.5 uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{t.filter.tags}</p>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map(tag => {
                  const active = filterTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => onTagToggle(tag)}
                      className="text-xs px-2.5 py-1 rounded-full font-medium transition-all"
                      style={{
                        background: active ? 'var(--accent)' : 'var(--border)',
                        color: active ? 'white' : 'var(--muted)',
                      }}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {(onDateFromChange || onDateToChange) && (
            <div>
              <p className="text-xs font-semibold mb-2.5 uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{t.filter.dateRange}</p>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={e => onDateFromChange?.(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 rounded-xl outline-none"
                  style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                />
                <span className="text-xs" style={{ color: 'var(--muted)' }}>~</span>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={e => onDateToChange?.(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 rounded-xl outline-none"
                  style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                />
              </div>
            </div>
          )}

          {hasActiveAdvanced && (
            <button
              onClick={() => {
                filterTags.forEach(t => onTagToggle?.(t));
                onDateFromChange?.('');
                onDateToChange?.('');
              }}
              className="text-xs font-medium"
              style={{ color: 'var(--destructive)' }}
            >
              {t.filter.clearAdvanced}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
