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
import { Todo, Priority } from '@/types/todo';

interface Props {
  allTodos: Todo[];
  onUpdate: (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  addTodo?: (data: { title: string; priority: Priority; urgency: 'not-urgent'; recurring: 'none'; inProgress?: boolean }) => void;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
};

const PRIORITY_LABELS: Record<Priority, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
};

type KanbanStatus = 'todo' | 'inprogress' | 'done';

const COLUMNS: { id: KanbanStatus; label: string; color: string; emoji: string }[] = [
  { id: 'todo',       label: '할 일',   color: '#6366f1', emoji: '📋' },
  { id: 'inprogress', label: '진행 중', color: '#f59e0b', emoji: '⚡' },
  { id: 'done',       label: '완료',    color: '#10b981', emoji: '✅' },
];

function getStatus(todo: Todo): KanbanStatus {
  if (todo.completed) return 'done';
  if (todo.inProgress) return 'inprogress';
  return 'todo';
}

function formatDate(d: string) {
  const date = new Date(d + 'T00:00:00');
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function KanbanCard({ todo, isDragOverlay = false }: { todo: Todo; isDragOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: todo.id });
  const priorityColor = PRIORITY_COLORS[todo.priority];

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      {...(isDragOverlay ? {} : { ...attributes, ...listeners })}
      className="rounded-xl p-3 cursor-grab active:cursor-grabbing select-none"
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
      <div className="w-full h-0.5 rounded-full mb-2.5" style={{ background: `${priorityColor}28` }}>
        <div className="h-full rounded-full" style={{ background: priorityColor, width: '100%' }} />
      </div>

      <p className={`text-sm font-medium leading-snug ${todo.completed ? 'line-through opacity-50' : ''}`} style={{ color: 'var(--text)' }}>
        {todo.title}
      </p>

      {todo.description && (
        <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--muted)' }}>{todo.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
        <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ color: priorityColor, background: `${priorityColor}18` }}>
          {PRIORITY_LABELS[todo.priority]}
        </span>
        {todo.category && (
          <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ color: 'var(--muted)', background: 'var(--accent-muted)' }}>
            {todo.category}
          </span>
        )}
        {todo.dueDate && (
          <span className="text-xs ml-auto" style={{ color: 'var(--muted)' }}>
            📅 {formatDate(todo.dueDate)}
          </span>
        )}
        {(todo.subtasks?.length ?? 0) > 0 && (
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {todo.subtasks.filter(s => s.completed).length}/{todo.subtasks.length}
          </span>
        )}
      </div>

      {(todo.tags?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {todo.tags!.map(tag => (
            <span key={tag} className="text-xs px-1.5 py-0.5 rounded-md" style={{ color: 'var(--accent)', background: 'var(--accent-muted)' }}>
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function KanbanColumn({
  col,
  todos,
  isOver,
  onAddTodo,
}: {
  col: typeof COLUMNS[number];
  todos: Todo[];
  isOver: boolean;
  onAddTodo?: (title: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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
        minWidth: 220,
        scrollSnapAlign: 'start',
        background: isOver ? `${col.color}08` : 'var(--card)',
        border: `1px solid ${isOver ? col.color + '60' : 'var(--border)'}`,
      }}
    >
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <span>{col.emoji}</span>
        <span className="font-semibold text-sm" style={{ color: col.color }}>{col.label}</span>
        <span
          className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${col.color}18`, color: col.color }}
        >
          {todos.length}
        </span>
      </div>

      <SortableContext items={todos.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 p-3 flex-1 overflow-y-auto" style={{ minHeight: 120 }}>
          {todos.map(todo => (
            <KanbanCard key={todo.id} todo={todo} />
          ))}
          {todos.length === 0 && !adding && (
            <div className="flex-1 flex items-center justify-center py-8">
              <p className="text-xs" style={{ color: 'var(--muted)', opacity: isOver ? 0.8 : 0.4 }}>
                {isOver ? '여기에 놓기' : '드래그해서 이동'}
              </p>
            </div>
          )}
        </div>
      </SortableContext>

      {onAddTodo && col.id !== 'done' && (
        adding ? (
          <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <input
              ref={inputRef}
              autoFocus
              type="text"
              placeholder="할 일 제목..."
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
                className="flex-1 py-1 text-xs font-semibold rounded-lg text-white transition-all disabled:opacity-40"
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
            className="w-full flex items-center gap-1.5 px-4 py-2.5 text-xs transition-colors hover:opacity-70 border-t"
            style={{ color: 'var(--muted)', borderColor: 'var(--border)' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            카드 추가
          </button>
        )
      )}
    </div>
  );
}

export default function KanbanView({ allTodos, onUpdate, onToggle, addTodo }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<KanbanStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const visibleTodos = allTodos.filter(t => !t.deletedAt);

  const byStatus: Record<KanbanStatus, Todo[]> = {
    todo: visibleTodos.filter(t => getStatus(t) === 'todo'),
    inprogress: visibleTodos.filter(t => getStatus(t) === 'inprogress'),
    done: visibleTodos.filter(t => getStatus(t) === 'done'),
  };

  const activeTodo = activeId ? visibleTodos.find(t => t.id === activeId) : null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragOver(e: DragOverEvent) {
    const { over } = e;
    if (!over) { setOverColumn(null); return; }
    const overId = String(over.id);

    // Check if over a column
    const col = COLUMNS.find(c => c.id === overId);
    if (col) { setOverColumn(col.id); return; }

    // Check if over a card — find which column that card belongs to
    const overTodo = visibleTodos.find(t => t.id === overId);
    if (overTodo) { setOverColumn(getStatus(overTodo)); return; }

    setOverColumn(null);
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    setOverColumn(null);
    if (!over) return;

    const draggedId = String(active.id);
    const overId = String(over.id);

    // Determine target column
    let targetStatus: KanbanStatus | null = null;
    const col = COLUMNS.find(c => c.id === overId);
    if (col) {
      targetStatus = col.id;
    } else {
      const overTodo = visibleTodos.find(t => t.id === overId);
      if (overTodo) targetStatus = getStatus(overTodo);
    }

    if (!targetStatus) return;

    const draggedTodo = visibleTodos.find(t => t.id === draggedId);
    if (!draggedTodo) return;

    const currentStatus = getStatus(draggedTodo);
    if (currentStatus === targetStatus) return;

    applyStatusChange(draggedId, targetStatus, draggedTodo);
  }

  function applyStatusChange(todoId: string, newStatus: KanbanStatus, todo: Todo) {
    if (newStatus === 'done') {
      if (!todo.completed) onToggle(todoId);
    } else if (newStatus === 'inprogress') {
      onUpdate(todoId, { inProgress: true, completed: false, completedAt: undefined });
    } else {
      onUpdate(todoId, { inProgress: false, completed: false, completedAt: undefined });
    }
  }

  return (
    <div className="px-4 py-6 md:px-10 md:py-8 h-full flex flex-col">
      <div className="mb-5">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>칸반 보드</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
          카드를 드래그해서 상태를 변경하세요
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 flex-1 overflow-x-auto pb-2" style={{ minHeight: 0, scrollSnapType: 'x mandatory' }}>
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.id}
              col={col}
              todos={byStatus[col.id]}
              isOver={overColumn === col.id && activeId !== null}
              onAddTodo={addTodo ? (title) => addTodo({
                title,
                priority: 'medium',
                urgency: 'not-urgent',
                recurring: 'none',
                ...(col.id === 'inprogress' && { inProgress: true }),
              }) : undefined}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
          {activeTodo ? <KanbanCard todo={activeTodo} isDragOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
