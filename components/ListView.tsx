'use client';

import { useState, useRef, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Todo, Project, SortOrder, FilterStatus, Priority } from '@/types/todo';
import { usePomodoro } from '@/hooks/usePomodoro';
import { useLanguage } from '@/contexts/LanguageContext';
import TodoItem from './TodoItem';
import FilterBar from './FilterBar';

interface ListViewProps {
  todos: Todo[];
  allTodos: Todo[];
  stats: { total: number; active: number; completed: number };
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterStatus: FilterStatus;
  setFilterStatus: (s: FilterStatus) => void;
  sortOrder: SortOrder;
  setSortOrder: (s: SortOrder) => void;
  allTags?: string[];
  filterTags?: string[];
  onTagToggle?: (tag: string) => void;
  filterDateFrom?: string;
  filterDateTo?: string;
  onDateFromChange?: (d: string) => void;
  onDateToChange?: (d: string) => void;
  addTodo?: (data: Omit<Todo, 'id' | 'createdAt' | 'completed' | 'completedAt' | 'subtasks' | 'pomodoroCount'>) => void;
  updateTodo: (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => void;
  deleteTodo: (id: string) => void;
  toggleComplete: (id: string) => void;
  clearCompleted: () => void;
  reorderTodos: (activeId: string, overId: string) => void;
  bulkComplete?: (ids: string[]) => void;
  bulkDelete?: (ids: string[]) => void;
  addSubtask: (todoId: string, title: string) => void;
  toggleSubtask: (todoId: string, subtaskId: string) => void;
  deleteSubtask: (todoId: string, subtaskId: string) => void;
  projects: Project[];
  activeProjectId: string | null;
  pomodoro: ReturnType<typeof usePomodoro>;
  compact?: boolean;
  autoEditTodoId?: string | null;
  onAutoEditDone?: () => void;
  onSearch?: () => void;
  segmentBar?: React.ReactNode;
}

export default function ListView({
  todos,
  allTodos,
  stats,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  sortOrder,
  setSortOrder,
  addTodo,
  updateTodo,
  deleteTodo,
  toggleComplete,
  clearCompleted,
  reorderTodos,
  bulkComplete,
  bulkDelete,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  projects,
  activeProjectId,
  pomodoro,
  allTags,
  filterTags,
  onTagToggle,
  filterDateFrom,
  filterDateTo,
  onDateFromChange,
  onDateToChange,
  autoEditTodoId,
  onAutoEditDone,
  onSearch,
  segmentBar,
}: ListViewProps) {
  const { t, lang } = useLanguage();
  const [activeId, setActiveId] = useState<string | null>(null);
  const prevTodoIdsRef = useRef<Set<string>>(new Set());
  const [newTodoIds, setNewTodoIds] = useState<Set<string>>(new Set());
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const currentIds = new Set(todos.map(t => t.id));
    if (prevTodoIdsRef.current.size > 0) {
      const added = new Set<string>();
      currentIds.forEach(id => {
        if (!prevTodoIdsRef.current.has(id)) added.add(id);
      });
      if (added.size > 0) {
        setNewTodoIds(added);
        setTimeout(() => setNewTodoIds(new Set()), 400);
      }
    }
    prevTodoIdsRef.current = currentIds;
  }, [todos]);

  useEffect(() => {
    if (newTodoIds.size === 0) return;
    const id = [...newTodoIds][0];
    requestAnimationFrame(() => {
      document.querySelector(`[data-todo-id="${id}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, [newTodoIds]);

  function wrappedToggleComplete(id: string) {
    const todo = todos.find(t => t.id === id);
    const willDisappear =
      (filterStatus === 'active' && !todo?.completed) ||
      (filterStatus === 'completed' && todo?.completed);
    if (todo && willDisappear) {
      setExitingIds(prev => new Set([...prev, id]));
      setTimeout(() => {
        toggleComplete(id);
        setExitingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
      }, 220);
    } else {
      toggleComplete(id);
    }
  }
  const [filterImportant, setFilterImportant] = useState(false);
  const [showPcAdvanced, setShowPcAdvanced] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  function handleBulkComplete() {
    bulkComplete?.([...selectedIds]);
    exitSelectMode();
  }

  function handleBulkDelete() {
    bulkDelete?.([...selectedIds]);
    exitSelectMode();
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (over && active.id !== over.id) {
      reorderTodos(active.id as string, over.id as string);
    }
  }

  const activeTodo = activeId ? allTodos.find(t => t.id === activeId) ?? null : null;

  const activeProject = activeProjectId ? projects.find(p => p.id === activeProjectId) : null;

  const displayedTodos = filterImportant ? todos.filter(t => t.important) : todos;

  const locale = lang === 'ko' ? 'ko-KR' : 'en-US';
  const today = new Date().toLocaleDateString(locale, {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });

  const filterBar = (
    <FilterBar
      filterStatus={filterStatus}
      onStatusChange={setFilterStatus}
      sortOrder={sortOrder}
      onSortChange={setSortOrder}
      completedCount={stats.completed}
      onClearCompleted={clearCompleted}
      allTags={allTags}
      filterTags={filterTags}
      onTagToggle={onTagToggle}
      filterDateFrom={filterDateFrom}
      filterDateTo={filterDateTo}
      onDateFromChange={onDateFromChange}
      onDateToChange={onDateToChange}
      filterImportant={filterImportant}
      onFilterImportantChange={setFilterImportant}
    />
  );

  const todoListContent = (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <SortableContext items={displayedTodos.map(t => t.id)} strategy={verticalListSortingStrategy}>
        {displayedTodos.length === 0 ? (
          <div className="text-center py-16">
            {filterImportant ? (
              <><div className="text-5xl mb-3 opacity-40">⭐</div><p className="text-sm" style={{ color: 'var(--muted)' }}>즐겨찾기한 할 일이 없어요</p></>
            ) : stats.total === 0 ? (
              <><div className="text-5xl mb-3 opacity-40">📝</div><p className="text-sm" style={{ color: 'var(--muted)' }}>{t.todo.noTodos}</p></>
            ) : (
              <><div className="text-5xl mb-3 opacity-40">🔍</div><p className="text-sm" style={{ color: 'var(--muted)' }}>{t.todo.noResults}</p></>
            )}
          </div>
        ) : (
          displayedTodos.map(todo => (
            <div key={todo.id} data-todo-id={todo.id}>
              <TodoItem todo={todo} onToggle={wrappedToggleComplete} onUpdate={updateTodo} onDelete={deleteTodo}
                onAddSubtask={addSubtask} onToggleSubtask={toggleSubtask} onDeleteSubtask={deleteSubtask}
                onStartPomodoro={pomodoro.selectTodo}
                autoEdit={autoEditTodoId === todo.id}
                onAutoEditDone={onAutoEditDone}
                isNew={newTodoIds.has(todo.id)}
                isExiting={exitingIds.has(todo.id)}
                projects={projects} />
            </div>
          ))
        )}
      </SortableContext>
      <DragOverlay>
        {activeTodo ? (
          <TodoItem todo={activeTodo} onToggle={() => {}} onUpdate={() => {}} onDelete={() => {}}
            onAddSubtask={() => {}} onToggleSubtask={() => {}} onDeleteSubtask={() => {}} isDragOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );

  const pageHeader = (
    <div className="mb-5">
      <div className="flex items-end justify-between">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
          {activeProject ? <span className="flex items-center gap-2"><span>{activeProject.icon}</span><span>{activeProject.name}</span></span> : t.nav.listFull}
        </h1>
        {stats.total > 0 && (
          <div className="text-right">
            <span className="text-2xl font-bold tabular-nums" style={{ color: 'var(--accent)' }}>{stats.completed}</span>
            <span className="text-sm" style={{ color: 'var(--muted)' }}>/{stats.total}</span>
          </div>
        )}
      </div>
      {stats.total > 0 && (
        <div className="mt-3">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(stats.completed / stats.total) * 100}%`, background: 'var(--accent)' }} />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* 모바일 레이아웃 */}
      <div className="md:hidden max-w-2xl mx-auto px-4 py-6">
        {/* 모바일 배너 헤더 */}
        <div className="rounded-2xl px-4 pt-3 pb-3 mb-4 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.10) 100%)', border: '1px solid rgba(99,102,241,0.22)' }}>
          <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full pointer-events-none"
            style={{ background: 'rgba(99,102,241,0.08)' }} />
          <div className="flex items-center gap-3 relative">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
              style={{ background: 'rgba(99,102,241,0.18)' }}>
              {activeProject ? activeProject.icon : '📋'}
            </div>
            <p className="flex-1 text-base font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              {activeProject ? activeProject.name : t.nav.listFull}
            </p>
            {stats.total > 0 && (
              <span className="text-xs font-semibold tabular-nums px-2.5 py-1 rounded-lg flex-shrink-0"
                style={{ background: 'rgba(99,102,241,0.18)', color: '#6366f1' }}>
                {stats.completed}<span className="font-normal opacity-60">/{stats.total}</span>
              </span>
            )}
            {onSearch && (
              <button
                onClick={onSearch}
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 active:opacity-60 transition-opacity"
                style={{ background: 'rgba(99,102,241,0.18)', color: '#6366f1' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            )}
          </div>
          {segmentBar}
        </div>
        <div className="mb-4">{filterBar}</div>
        {todoListContent}
      </div>

      {/* PC 웹 레이아웃: 단일 수평 툴바 + 컴팩트 목록 */}
      <div className="hidden md:flex flex-col h-full overflow-hidden">

        {/* ① 툴바 */}
        <div
          className="flex-shrink-0 flex items-center gap-2 px-4 h-12"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--card)' }}
        >
          {/* 제목 */}
          <h1 className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--text)' }}>
            {activeProject
              ? <span className="flex items-center gap-1.5"><span>{activeProject.icon}</span><span>{activeProject.name}</span></span>
              : t.nav.list}
          </h1>

          <div className="w-px h-4 flex-shrink-0" style={{ background: 'var(--border)' }} />

          {/* 즐겨찾기 필터 */}
          <button
            onClick={() => setFilterImportant(v => !v)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs flex-shrink-0 transition-colors"
            title="즐겨찾기만 보기"
            style={{
              background: filterImportant ? 'rgba(245,158,11,0.15)' : 'var(--bg)',
              color: filterImportant ? '#f59e0b' : 'var(--muted)',
              border: `1px solid ${filterImportant ? '#f59e0b' : 'var(--border)'}`,
            }}
          >
            ⭐ 즐겨찾기
          </button>

          {/* 상태 필터 */}
          <div className="flex items-center rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
            {([{ v: 'all' as const, l: t.status.all }, { v: 'active' as const, l: t.status.inProgress }, { v: 'completed' as const, l: t.status.completed }]).map(({ v, l }) => (
              <button
                key={v}
                onClick={() => setFilterStatus(v)}
                className="px-2.5 py-1.5 text-xs font-medium transition-colors"
                style={{ background: filterStatus === v ? 'var(--accent)' : 'transparent', color: filterStatus === v ? 'white' : 'var(--muted)' }}
              >{l}</button>
            ))}
          </div>

          {/* 정렬 */}
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as SortOrder)}
            className="text-xs py-1.5 pl-2.5 pr-6 rounded-lg outline-none appearance-none cursor-pointer flex-shrink-0"
            style={{ background: 'var(--bg)', color: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            <option value="manual">{t.sort.manual}</option>
            <option value="priority">{t.sort.priority}</option>
            <option value="dueDate">{t.sort.dueDate}</option>
            <option value="createdAt">{t.sort.createdAt}</option>
          </select>

          {/* 고급 필터 토글 */}
          {((allTags?.length ?? 0) > 0 || onDateFromChange) && (
            <button
              onClick={() => setShowPcAdvanced(v => !v)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs flex-shrink-0 transition-colors"
              style={{
                background: (showPcAdvanced || (filterTags?.length ?? 0) > 0 || filterDateFrom || filterDateTo) ? 'var(--accent-muted)' : 'var(--bg)',
                color: (showPcAdvanced || (filterTags?.length ?? 0) > 0 || filterDateFrom || filterDateTo) ? 'var(--accent)' : 'var(--muted)',
                border: '1px solid var(--border)',
              }}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              {t.filter.advanced}
            </button>
          )}

          {/* 완료 삭제 */}
          {stats.completed > 0 && !selectMode && (
            <button
              onClick={clearCompleted}
              className="text-xs px-2.5 py-1.5 rounded-lg flex-shrink-0"
              style={{ color: 'var(--destructive)', background: 'rgba(255,59,48,0.08)' }}
            >
              {t.filter.deleteCompletedNItems(stats.completed)}
            </button>
          )}

          <div className="flex-1" />

          {/* 선택 모드 */}
          <button
            onClick={() => { selectMode ? exitSelectMode() : setSelectMode(true); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs flex-shrink-0 transition-colors"
            style={{
              background: selectMode ? 'var(--accent-muted)' : 'var(--bg)',
              color: selectMode ? 'var(--accent)' : 'var(--muted)',
              border: '1px solid var(--border)',
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {selectMode ? t.common.cancel : t.common.select}
          </button>

        </div>

        {/* ② 고급 필터 패널 */}
        {showPcAdvanced && (
          <div
            className="flex-shrink-0 flex items-center gap-4 flex-wrap px-4 py-2"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}
          >
            {(allTags?.length ?? 0) > 0 && onTagToggle && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium flex-shrink-0" style={{ color: 'var(--muted)' }}>{t.filter.tags}</span>
                <div className="flex flex-wrap gap-1">
                  {allTags!.map(tag => {
                    const active = filterTags?.includes(tag) ?? false;
                    return (
                      <button key={tag} onClick={() => onTagToggle(tag)}
                        className="text-xs px-2 py-0.5 rounded-full font-medium transition-colors"
                        style={{ background: active ? 'var(--accent)' : 'var(--border)', color: active ? 'white' : 'var(--muted)' }}
                      >#{tag}</button>
                    );
                  })}
                </div>
              </div>
            )}
            {(onDateFromChange || onDateToChange) && (
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-xs flex-shrink-0" style={{ color: 'var(--muted)' }}>{t.date.dueDate}</span>
                <input type="date" value={filterDateFrom ?? ''} onChange={e => onDateFromChange?.(e.target.value)}
                  className="text-xs px-2 py-1 rounded-lg outline-none"
                  style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
                />
                <span className="text-xs" style={{ color: 'var(--muted)' }}>~</span>
                <input type="date" value={filterDateTo ?? ''} onChange={e => onDateToChange?.(e.target.value)}
                  className="text-xs px-2 py-1 rounded-lg outline-none"
                  style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
                />
              </div>
            )}
          </div>
        )}

        {/* ③ 진행률 바 */}
        {stats.total > 0 && (
          <div className="flex-shrink-0 flex items-center gap-3 px-4 py-1" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex-1 h-0.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(stats.completed / stats.total) * 100}%`, background: 'var(--accent)' }} />
            </div>
            <span className="text-xs flex-shrink-0 tabular-nums" style={{ color: 'var(--muted)' }}>
              {stats.completed}/{stats.total}
            </span>
          </div>
        )}

        {/* ④ 목록 */}
        <div className="flex-1 overflow-y-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <SortableContext items={todos.map(t => t.id)} strategy={verticalListSortingStrategy}>
              {todos.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    {stats.total === 0 ? t.todo.noTodosHint : t.todo.noResults}
                  </p>
                </div>
              ) : (
                todos.map(todo => (
                  <div key={todo.id} className="relative" data-todo-id={todo.id}>
                    {selectMode && (
                      <button
                        onClick={() => toggleSelect(todo.id)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
                        style={{
                          background: selectedIds.has(todo.id) ? 'var(--accent)' : 'var(--card)',
                          borderColor: selectedIds.has(todo.id) ? 'var(--accent)' : 'var(--border)',
                        }}
                      >
                        {selectedIds.has(todo.id) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    )}
                    <div style={{ paddingLeft: selectMode ? 36 : 0, opacity: selectMode && !selectedIds.has(todo.id) ? 0.6 : 1, transition: 'opacity 0.15s' }}>
                      <TodoItem todo={todo} compact
                        onToggle={selectMode ? () => toggleSelect(todo.id) : wrappedToggleComplete}
                        onUpdate={updateTodo} onDelete={deleteTodo}
                        onAddSubtask={addSubtask} onToggleSubtask={toggleSubtask} onDeleteSubtask={deleteSubtask}
                        onStartPomodoro={pomodoro.selectTodo}
                        autoEdit={autoEditTodoId === todo.id}
                        onAutoEditDone={onAutoEditDone}
                        isNew={newTodoIds.has(todo.id)}
                        isExiting={exitingIds.has(todo.id)}
                        projects={projects}
                      />
                    </div>
                  </div>
                ))
              )}
            </SortableContext>
            <DragOverlay>
              {activeTodo ? (
                <TodoItem todo={activeTodo} compact isDragOverlay
                  onToggle={() => {}} onUpdate={() => {}} onDelete={() => {}}
                  onAddSubtask={() => {}} onToggleSubtask={() => {}} onDeleteSubtask={() => {}}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* 일괄 액션 바 */}
        {selectMode && selectedIds.size > 0 && (
          <div
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5"
            style={{ borderTop: '1px solid var(--border)', background: 'var(--card)' }}
          >
            <span className="text-xs font-medium flex-1" style={{ color: 'var(--muted)' }}>
              {t.common.selectedCount(selectedIds.size)}
            </span>
            <button
              onClick={handleBulkComplete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
              style={{ background: '#10b981' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {t.common.complete}
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {t.common.delete}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
