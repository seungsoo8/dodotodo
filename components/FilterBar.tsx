'use client';

import { useState } from 'react';
import { FilterStatus, Priority, SortOrder } from '@/types/todo';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterStatus: FilterStatus;
  onStatusChange: (s: FilterStatus) => void;
  filterPriority: Priority | 'all';
  onPriorityChange: (p: Priority | 'all') => void;
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

const STATUS_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'active', label: '진행 중' },
  { value: 'completed', label: '완료' },
];

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'manual', label: '수동' },
  { value: 'priority', label: '우선순위' },
  { value: 'dueDate', label: '마감일' },
  { value: 'createdAt', label: '생성일' },
];

export default function FilterBar({
  searchQuery, onSearchChange,
  filterStatus, onStatusChange,
  filterPriority, onPriorityChange,
  sortOrder, onSortChange,
  completedCount, onClearCompleted,
  allTags = [], filterTags = [], onTagToggle,
  filterDateFrom = '', filterDateTo = '',
  onDateFromChange, onDateToChange,
}: FilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const hasActiveAdvanced = filterTags.length > 0 || !!filterDateFrom || !!filterDateTo;
  const hasActiveFilter = filterStatus !== 'all' || filterPriority !== 'all' || hasActiveAdvanced;

  return (
    <div className="space-y-2">
      {/* 검색바 */}
      <div className="relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: 'var(--muted)' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="검색..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl outline-none transition-all"
          style={{
            background: 'var(--card)',
            boxShadow: 'var(--shadow-xs)',
            border: `1.5px solid ${searchQuery ? 'var(--accent)' : 'transparent'}`,
            color: 'var(--text)',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onBlur={e => (e.currentTarget.style.borderColor = searchQuery ? 'var(--accent)' : 'transparent')}
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: 'var(--muted)', color: 'white' }}
          >
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 필터 행 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
        {/* 상태 세그먼트 */}
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

        {/* 우선순위 칩 */}
        {(['all', 'high', 'medium', 'low'] as const).map(p => {
          const colors: Record<string, string> = { high: '#ff3b30', medium: '#ff9500', low: '#34c759', all: 'var(--muted)' };
          const labels: Record<string, string> = { high: '높음', medium: '보통', low: '낮음', all: '전체' };
          const active = filterPriority === p;
          if (p === 'all' && filterPriority !== 'all') return null;
          return (
            <button
              key={p}
              onClick={() => onPriorityChange(p === filterPriority ? 'all' : p)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{
                background: active && p !== 'all' ? `${colors[p]}18` : 'var(--card)',
                boxShadow: 'var(--shadow-xs)',
                color: active && p !== 'all' ? colors[p] : 'var(--muted)',
                border: active && p !== 'all' ? `1px solid ${colors[p]}40` : '1px solid transparent',
              }}
            >
              {p !== 'all' && <span className="w-2 h-2 rounded-full" style={{ background: colors[p] }} />}
              {labels[p]}
            </button>
          );
        })}

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
          title="고급 필터"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
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
              완료 삭제 ({completedCount})
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
              <p className="text-xs font-semibold mb-2.5 uppercase tracking-wide" style={{ color: 'var(--muted)' }}>태그</p>
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
              <p className="text-xs font-semibold mb-2.5 uppercase tracking-wide" style={{ color: 'var(--muted)' }}>마감일 범위</p>
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
              고급 필터 초기화
            </button>
          )}
        </div>
      )}
    </div>
  );
}
