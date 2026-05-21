'use client';

import { useState, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { KanbanColumn, Project, Todo } from '@/types/todo';
import { useLanguage } from '@/contexts/LanguageContext';
import { DEFAULT_KANBAN_COLUMNS } from '@/hooks/useSettings';
import TodoForm from './TodoForm';
import IconPickerPopover from './IconPickerPopover';
import { ChevronDown, Pencil, Plus, Trash2, Check } from 'lucide-react';

interface Props {
  allTodos: Todo[];
  onUpdate: (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  addTodo?: (data: Omit<Todo, 'id' | 'createdAt' | 'completed' | 'completedAt' | 'subtasks' | 'pomodoroCount'>) => void;
  projects?: Project[];
  kanbanColumns: KanbanColumn[];
  onUpdateColumns: (cols: KanbanColumn[]) => void;
}

const PRESET_COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6','#06b6d4','#f97316','#94a3b8'];


function getColumnId(todo: Todo, columns: KanbanColumn[]): string {
  if (todo.kanbanColumnId && columns.find(c => c.id === todo.kanbanColumnId)) {
    return todo.kanbanColumnId;
  }
  const doneCol = columns.find(c => c.isCompleted);
  if (todo.completed && doneCol) return doneCol.id;
  const inProgressCol = columns.find(c => c.id === 'inprogress');
  if (todo.inProgress && inProgressCol) return inProgressCol.id;
  return columns[0]?.id ?? 'todo';
}

function getDueColor(dueDate: string | undefined, completed: boolean): string | null {
  if (!dueDate || completed) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  const diff = Math.floor((due.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return '#ef4444';
  if (diff === 0) return '#f59e0b';
  return null;
}

function KanbanCard({
  todo, isDragOverlay = false, onToggle, onUpdate, onDelete,
}: {
  todo: Todo;
  isDragOverlay?: boolean;
  onToggle: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: todo.id });
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const dotColor = todo.colorTag || 'var(--accent)';
  const dueColor = getDueColor(todo.dueDate, todo.completed);
  const subtaskDone = todo.subtasks?.filter(s => s.completed).length ?? 0;
  const subtaskTotal = todo.subtasks?.length ?? 0;
  const subtaskPct = subtaskTotal > 0 ? Math.round(subtaskDone / subtaskTotal * 100) : 0;

  if (isEditing) {
    return (
      <div className="rounded-xl p-3" style={{ background: 'var(--card)', border: '1px solid var(--accent)', boxShadow: '0 0 0 2px var(--accent-muted)' }}>
        <TodoForm
          initialData={todo}
          onSubmit={updates => { onUpdate(todo.id, updates); setIsEditing(false); }}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      {...(isDragOverlay ? {} : { ...attributes, ...listeners })}
      className="rounded-xl cursor-grab active:cursor-grabbing select-none group"
      style={{
        transform: isDragOverlay ? undefined : CSS.Transform.toString(transform),
        transition: isDragOverlay ? undefined : transition,
        opacity: isDragging && !isDragOverlay ? 0 : 1,
        background: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: isDragOverlay ? '0 8px 24px rgba(0,0,0,0.18)' : undefined,
        touchAction: 'none',
      }}
    >
      {/* 상단 컬러 바 */}
      {todo.colorTag && <div className="h-1 rounded-t-xl" style={{ background: todo.colorTag }} />}

      <div className="p-3">
        {/* 제목 행 */}
        <div className="flex items-start gap-2">
          {/* 완료 체크 */}
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onToggle(todo.id); }}
            className="flex-shrink-0 mt-0.5 transition-all active:scale-90"
            style={{
              width: 16, height: 16, borderRadius: '50%',
              border: `1.5px solid ${todo.completed ? 'var(--accent)' : 'var(--border)'}`,
              background: todo.completed ? 'var(--accent)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {todo.completed && (
              <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          <p
            className="flex-1 text-sm font-medium leading-snug"
            style={{ color: todo.completed ? 'var(--muted)' : 'var(--text)', textDecoration: todo.completed ? 'line-through' : 'none' }}
          >
            {todo.title}
          </p>

          {/* 호버 액션 버튼들 */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onPointerDown={e => e.stopPropagation()}>
            {/* 중요 별표 */}
            <button
              onClick={e => { e.stopPropagation(); onUpdate(todo.id, { important: !todo.important }); }}
              className="w-6 h-6 flex items-center justify-center rounded-md"
              style={{ color: todo.important ? '#f59e0b' : 'var(--muted)' }}
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill={todo.important ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </button>
            {/* 편집 */}
            <button
              onClick={e => { e.stopPropagation(); setIsEditing(true); }}
              className="w-6 h-6 flex items-center justify-center rounded-md"
              style={{ color: 'var(--muted)' }}
            >
              <Pencil className="w-3 h-3" />
            </button>
            {/* 삭제 */}
            {!deleteConfirm ? (
              <button
                onClick={e => { e.stopPropagation(); setDeleteConfirm(true); }}
                className="w-6 h-6 flex items-center justify-center rounded-md"
                style={{ color: 'var(--muted)' }}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            ) : (
              <button
                onClick={e => { e.stopPropagation(); onDelete(todo.id); }}
                className="px-1.5 h-6 flex items-center text-xs rounded-md font-semibold"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
                onBlur={() => setDeleteConfirm(false)}
              >
                삭제
              </button>
            )}
          </div>
        </div>

        {/* 설명 */}
        {todo.description && (
          <p className="text-xs mt-1.5 line-clamp-2 pl-6" style={{ color: 'var(--muted)' }}>{todo.description}</p>
        )}

        {/* 서브태스크 프로그레스 바 */}
        {subtaskTotal > 0 && (
          <div className="mt-2.5 pl-6">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs" style={{ color: 'var(--muted)' }}>{subtaskDone}/{subtaskTotal}</span>
              <span className="text-xs" style={{ color: 'var(--muted)', opacity: 0.6 }}>{subtaskPct}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${subtaskPct}%`, background: subtaskPct === 100 ? 'var(--success)' : 'var(--accent)' }}
              />
            </div>
          </div>
        )}

        {/* 하단 메타 */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pl-6">
          {todo.important && (
            <span className="text-xs" style={{ color: '#f59e0b' }}>⭐</span>
          )}
          {todo.category && (
            <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ color: 'var(--muted)', background: 'var(--accent-muted)' }}>
              {todo.category}
            </span>
          )}
          {(todo.tags?.length ?? 0) > 0 && todo.tags!.map(tag => (
            <span key={tag} className="text-xs px-1.5 py-0.5 rounded-md" style={{ color: 'var(--accent)', background: 'var(--accent-muted)' }}>
              #{tag}
            </span>
          ))}
          {todo.dueDate && (
            <span
              className="text-xs ml-auto font-medium"
              style={{ color: dueColor ?? 'var(--muted)' }}
            >
              {dueColor === '#ef4444' ? '⚠ ' : dueColor === '#f59e0b' ? '⚡ ' : '📅 '}
              {todo.dueDate.slice(5).replace('-', '/')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 컬럼 헤더 편집 폼 ───
function ColumnEditPopover({
  col,
  onSave,
  onDelete,
  onClose,
  canDelete,
}: {
  col: KanbanColumn;
  onSave: (updated: KanbanColumn) => void;
  onDelete: () => void;
  onClose: () => void;
  canDelete: boolean;
}) {
  const [emoji, setEmoji] = useState(col.emoji);
  const [label, setLabel] = useState(col.label);
  const [color, setColor] = useState(col.color);
  const [isCompleted, setIsCompleted] = useState(col.isCompleted ?? false);

  return (
    <div
      className="absolute top-10 left-0 z-50 rounded-2xl p-4 shadow-2xl"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', width: 240 }}
      onPointerDown={e => e.stopPropagation()}
    >
      <div className="flex gap-2 mb-3 min-w-0">
        <IconPickerPopover value={emoji} onChange={setEmoji} />
        <input
          className="min-w-0 flex-1 text-sm px-3 rounded-xl outline-none"
          style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="컬럼 이름"
          autoFocus
        />
      </div>

      {/* 색상 선택 */}
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {PRESET_COLORS.map(c => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className="w-6 h-6 rounded-full transition-transform hover:scale-110"
            style={{ background: c, boxShadow: color === c ? `0 0 0 2px var(--card), 0 0 0 3.5px ${c}` : 'none' }}
          />
        ))}
      </div>

      {/* 완료 컬럼 토글 */}
      <label className="flex items-center gap-2 text-xs mb-3 cursor-pointer" style={{ color: 'var(--muted)' }}>
        <div
          onClick={() => setIsCompleted(v => !v)}
          className="w-8 h-4 rounded-full transition-colors flex items-center px-0.5"
          style={{ background: isCompleted ? 'var(--accent)' : 'var(--border)' }}
        >
          <div
            className="w-3 h-3 rounded-full bg-white transition-transform"
            style={{ transform: isCompleted ? 'translateX(16px)' : 'translateX(0)' }}
          />
        </div>
        이 컬럼에 이동하면 완료 처리
      </label>

      <div className="flex gap-2">
        <button
          onClick={() => onSave({ ...col, emoji, label, color, isCompleted })}
          disabled={!label.trim()}
          className="flex-1 py-1.5 text-xs font-semibold rounded-xl text-white disabled:opacity-40"
          style={{ background: color }}
        >
          저장
        </button>
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-xs rounded-xl"
          style={{ background: 'var(--border)', color: 'var(--muted)' }}
        >
          취소
        </button>
        {canDelete && (
          <button
            onClick={onDelete}
            className="w-8 h-8 flex items-center justify-center rounded-xl"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── 드롭 가능한 컬럼 ───
function KanbanColumnUI({
  col,
  todos,
  isOver,
  onAddTodo,
  onToggle,
  onUpdate,
  onDelete,
  onEditSave,
  onDeleteCol,
  canDelete,
  showCompleted,
  onToggleShowCompleted,
}: {
  col: KanbanColumn;
  todos: Todo[];
  isOver: boolean;
  onAddTodo?: (title: string) => void;
  onToggle: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => void;
  onDelete: (id: string) => void;
  onEditSave: (updated: KanbanColumn) => void;
  onDeleteCol: () => void;
  canDelete: boolean;
  showCompleted: boolean;
  onToggleShowCompleted: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

  function handleAdd() {
    if (!addTitle.trim()) return;
    onAddTodo!(addTitle.trim());
    setAddTitle('');
    setAdding(false);
  }

  return (
    <div
      className="flex flex-col flex-shrink-0 rounded-2xl transition-all duration-150"
      style={{
        width: 'calc(85vw)',
        maxWidth: 300,
        minWidth: 240,
        scrollSnapAlign: 'start',
        background: isOver ? `${col.color}08` : 'var(--card)',
        border: `1px solid ${isOver ? col.color + '60' : 'var(--border)'}`,
      }}
    >
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-4 py-3 relative group/header" style={{ borderBottom: '1px solid var(--border)' }}>
        <span>{col.emoji}</span>
        <span className="font-semibold text-sm" style={{ color: col.color }}>{col.label}</span>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${col.color}18`, color: col.color }}>
          {activeTodos.length}
        </span>
        {/* 편집 버튼 */}
        <button
          onClick={() => setEditOpen(v => !v)}
          className="ml-auto w-6 h-6 flex items-center justify-center rounded-lg opacity-0 group-hover/header:opacity-100 transition-opacity"
          style={{ color: 'var(--muted)', background: 'var(--border)' }}
        >
          <Pencil className="w-3 h-3" />
        </button>

        {editOpen && (
          <ColumnEditPopover
            col={col}
            onSave={updated => { onEditSave(updated); setEditOpen(false); }}
            onDelete={() => { onDeleteCol(); setEditOpen(false); }}
            onClose={() => setEditOpen(false)}
            canDelete={canDelete}
          />
        )}
      </div>

      {/* 카드 목록 */}
      <SortableContext items={activeTodos.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 p-3 flex-1 overflow-y-auto" style={{ minHeight: 120 }}>
          {activeTodos.map(todo => (
            <KanbanCard
              key={todo.id}
              todo={todo}
              onToggle={onToggle}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
          {activeTodos.length === 0 && !adding && (
            <div className="flex items-center justify-center py-8">
              <p className="text-xs" style={{ color: 'var(--muted)', opacity: isOver ? 0.8 : 0.4 }}>
                {isOver ? '여기에 놓기' : '드래그해서 이동'}
              </p>
            </div>
          )}
        </div>
      </SortableContext>

      {/* 완료된 카드 접기/펼치기 */}
      {completedTodos.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={onToggleShowCompleted}
            className="w-full flex items-center gap-1.5 px-4 py-2 text-xs transition-opacity hover:opacity-70"
            style={{ color: 'var(--muted)' }}
          >
            <Check className="w-3 h-3" style={{ color: 'var(--success)' }} />
            완료 {completedTodos.length}개
            <ChevronDown className="w-3 h-3 ml-auto transition-transform" style={{ transform: showCompleted ? 'rotate(180deg)' : 'none' }} />
          </button>
          {showCompleted && (
            <div className="flex flex-col gap-2 px-3 pb-3">
              {completedTodos.map(todo => (
                <KanbanCard key={todo.id} todo={todo} onToggle={onToggle} onUpdate={onUpdate} onDelete={onDelete} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 카드 추가 */}
      {onAddTodo && (
        adding ? (
          <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <input
              ref={inputRef}
              autoFocus
              type="text"
              placeholder="카드 제목 입력..."
              value={addTitle}
              onChange={e => setAddTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') { setAdding(false); setAddTitle(''); }
              }}
              className="w-full text-sm px-2.5 py-1.5 rounded-lg outline-none"
              style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
            />
            <div className="flex gap-1.5 mt-2">
              <button
                onClick={handleAdd}
                disabled={!addTitle.trim()}
                className="flex-1 py-1 text-xs font-semibold rounded-lg text-white disabled:opacity-40"
                style={{ background: col.color }}
              >
                추가
              </button>
              <button
                onClick={() => { setAdding(false); setAddTitle(''); }}
                className="px-3 py-1 text-xs rounded-lg"
                style={{ background: 'var(--border)', color: 'var(--muted)' }}
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full flex items-center gap-1.5 px-4 py-2.5 text-xs transition-opacity hover:opacity-70 border-t"
            style={{ color: 'var(--muted)', borderColor: 'var(--border)' }}
          >
            <Plus className="w-3.5 h-3.5" />
            카드 추가
          </button>
        )
      )}
    </div>
  );
}

// ─── 새 컬럼 추가 폼 ───
function AddColumnForm({
  onAdd,
  onClose,
}: {
  onAdd: (col: Omit<KanbanColumn, 'id'>) => void;
  onClose: () => void;
}) {
  const [emoji, setEmoji] = useState('📌');
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [isCompleted, setIsCompleted] = useState(false);

  function handleAdd() {
    if (!label.trim()) return;
    onAdd({ emoji, label: label.trim(), color, isCompleted });
  }

  return (
    <div className="p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16 }}>
      <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text)' }}>새 컬럼</p>
      <div className="flex gap-2 mb-3 min-w-0">
        <IconPickerPopover value={emoji} onChange={setEmoji} />
        <input
          autoFocus
          className="min-w-0 flex-1 text-sm px-3 rounded-xl outline-none"
          style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="컬럼 이름"
          onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') onClose(); }}
        />
      </div>
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {PRESET_COLORS.map(c => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className="w-6 h-6 rounded-full transition-transform hover:scale-110"
            style={{ background: c, boxShadow: color === c ? `0 0 0 2px var(--card), 0 0 0 3.5px ${c}` : 'none' }}
          />
        ))}
      </div>
      <label className="flex items-center gap-2 text-xs mb-3 cursor-pointer" style={{ color: 'var(--muted)' }}>
        <div
          onClick={() => setIsCompleted(v => !v)}
          className="w-8 h-4 rounded-full transition-colors flex items-center px-0.5"
          style={{ background: isCompleted ? 'var(--accent)' : 'var(--border)' }}
        >
          <div className="w-3 h-3 rounded-full bg-white transition-transform" style={{ transform: isCompleted ? 'translateX(16px)' : 'none' }} />
        </div>
        완료 처리 컬럼
      </label>
      <div className="flex gap-2">
        <button
          onClick={handleAdd}
          disabled={!label.trim()}
          className="flex-1 py-1.5 text-xs font-semibold rounded-xl text-white disabled:opacity-40"
          style={{ background: color }}
        >
          추가
        </button>
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-xs rounded-xl"
          style={{ background: 'var(--border)', color: 'var(--muted)' }}
        >
          취소
        </button>
      </div>
    </div>
  );
}

function AddColumnButton({ onAdd }: { onAdd: (col: Omit<KanbanColumn, 'id'>) => void }) {
  const [open, setOpen] = useState(false);

  function handleAdd(col: Omit<KanbanColumn, 'id'>) {
    onAdd(col);
    setOpen(false);
  }

  return (
    <>
      <div className="flex-shrink-0" style={{ width: 240 }}>
        <button
          onClick={() => setOpen(true)}
          className="w-full h-14 flex items-center justify-center gap-2 rounded-2xl text-sm font-medium transition-opacity hover:opacity-70 border-2 border-dashed"
          style={{ color: 'var(--muted)', borderColor: 'var(--border)' }}
        >
          <Plus className="w-4 h-4" />
          컬럼 추가
        </button>
      </div>

      {/* PC: 인라인 팝오버 / 모바일: 하단 시트 */}
      {open && (
        <>
          {/* 모바일 센터 팝업 */}
          <div
            className="md:hidden fixed inset-0 z-50 flex items-center justify-center px-5"
            style={{ background: 'rgba(0,0,0,0.45)' }}
            onClick={() => setOpen(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl p-4"
              style={{ background: 'var(--card)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
              onClick={e => e.stopPropagation()}
            >
              <AddColumnForm onAdd={handleAdd} onClose={() => setOpen(false)} />
            </div>
          </div>

          {/* PC 인라인 */}
          <div className="hidden md:block flex-shrink-0" style={{ width: 280 }}>
            <AddColumnForm onAdd={handleAdd} onClose={() => setOpen(false)} />
          </div>
        </>
      )}
    </>
  );
}

// ─── 메인 KanbanView ───
export default function KanbanView({ allTodos, onUpdate, onToggle, onDelete, addTodo, projects = [], kanbanColumns, onUpdateColumns }: Props) {
  const { lang } = useLanguage();
  const columns = kanbanColumns.length > 0 ? kanbanColumns : DEFAULT_KANBAN_COLUMNS;

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [filterProjectId, setFilterProjectId] = useState<string | null>(null);
  const [showCompletedMap, setShowCompletedMap] = useState<Record<string, boolean>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const visibleTodos = allTodos.filter(t =>
    !t.deletedAt && (filterProjectId === null || t.projectId === filterProjectId)
  );

  const byColumn: Record<string, Todo[]> = {};
  for (const col of columns) byColumn[col.id] = [];
  for (const todo of visibleTodos) {
    const colId = getColumnId(todo, columns);
    if (byColumn[colId]) byColumn[colId].push(todo);
    else byColumn[columns[0].id]?.push(todo);
  }

  const activeTodo = activeId ? visibleTodos.find(t => t.id === activeId) : null;

  function handleDragStart(e: DragStartEvent) { setActiveId(String(e.active.id)); }

  function handleDragOver(e: DragOverEvent) {
    const { over } = e;
    if (!over) { setOverColumn(null); return; }
    const overId = String(over.id);
    if (columns.find(c => c.id === overId)) { setOverColumn(overId); return; }
    const overTodo = visibleTodos.find(t => t.id === overId);
    if (overTodo) { setOverColumn(getColumnId(overTodo, columns)); return; }
    setOverColumn(null);
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null); setOverColumn(null);
    if (!over) return;
    const draggedId = String(active.id);
    const overId = String(over.id);
    let targetColId: string | null = null;
    if (columns.find(c => c.id === overId)) targetColId = overId;
    else {
      const overTodo = visibleTodos.find(t => t.id === overId);
      if (overTodo) targetColId = getColumnId(overTodo, columns);
    }
    if (!targetColId) return;
    const draggedTodo = visibleTodos.find(t => t.id === draggedId);
    if (!draggedTodo) return;
    if (getColumnId(draggedTodo, columns) === targetColId) return;

    const targetCol = columns.find(c => c.id === targetColId);
    if (!targetCol) return;

    if (targetCol.isCompleted) {
      onUpdate(draggedId, { kanbanColumnId: targetColId, inProgress: false });
      if (!draggedTodo.completed) onToggle(draggedId);
    } else {
      onUpdate(draggedId, {
        kanbanColumnId: targetColId,
        inProgress: targetColId === 'inprogress',
        completed: false,
        completedAt: undefined,
      });
    }
  }

  function handleUpdateColumn(updated: KanbanColumn) {
    onUpdateColumns(columns.map(c => c.id === updated.id ? updated : c));
  }

  function handleDeleteColumn(colId: string) {
    const firstCol = columns.find(c => c.id !== colId);
    if (!firstCol) return;
    // 해당 컬럼 할 일들을 첫 번째 컬럼으로 이동
    for (const todo of byColumn[colId] ?? []) {
      onUpdate(todo.id, { kanbanColumnId: firstCol.id });
    }
    onUpdateColumns(columns.filter(c => c.id !== colId));
  }

  function handleAddColumn(col: Omit<KanbanColumn, 'id'>) {
    const id = `col_${Date.now()}`;
    onUpdateColumns([...columns, { ...col, id }]);
  }

  return (
    <div className="px-4 py-6 md:px-10 md:py-8 h-full flex flex-col">
      {/* 헤더 */}
      <div className="mb-5 flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {lang === 'ko' ? '칸반 보드' : 'Kanban Board'}
          </h1>
        </div>

        {/* 프로젝트 필터 */}
        {projects.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterProjectId(null)}
              className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all"
              style={{
                background: filterProjectId === null ? 'var(--accent)' : 'var(--border)',
                color: filterProjectId === null ? 'white' : 'var(--muted)',
              }}
            >
              전체
            </button>
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => setFilterProjectId(prev => prev === p.id ? null : p.id)}
                className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all"
                style={{
                  background: filterProjectId === p.id ? p.color : 'var(--border)',
                  color: filterProjectId === p.id ? 'white' : 'var(--muted)',
                }}
              >
                {p.icon} {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 flex-1 overflow-x-auto pb-2" style={{ minHeight: 0, scrollSnapType: 'x mandatory' }}>
          {columns.map(col => (
            <KanbanColumnUI
              key={col.id}
              col={col}
              todos={byColumn[col.id] ?? []}
              isOver={overColumn === col.id && activeId !== null}
              onToggle={onToggle}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onEditSave={handleUpdateColumn}
              onDeleteCol={() => handleDeleteColumn(col.id)}
              canDelete={columns.length > 1}
              showCompleted={showCompletedMap[col.id] ?? false}
              onToggleShowCompleted={() => setShowCompletedMap(prev => ({ ...prev, [col.id]: !prev[col.id] }))}
              onAddTodo={addTodo ? (title) => {
                const isInProgress = col.id === 'inprogress';
                addTodo({ title, priority: 'medium', urgency: 'not-urgent', recurring: 'none', kanbanColumnId: col.id, ...(isInProgress && { inProgress: true }) });
              } : undefined}
            />
          ))}
          <AddColumnButton onAdd={handleAddColumn} />
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
          {activeTodo ? (
            <KanbanCard todo={activeTodo} isDragOverlay onToggle={onToggle} onUpdate={onUpdate} onDelete={onDelete} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
