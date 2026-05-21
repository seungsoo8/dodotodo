'use client';

import { useState } from 'react';
import IconPickerPopover from './IconPickerPopover';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Project, Todo } from '@/types/todo';
import { usePomodoro } from '@/hooks/usePomodoro';
import TodoItem from './TodoItem';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProjectsViewProps {
  projects: Project[];
  allTodos: Todo[];
  onToggleFavorite: (projectId: string) => void;
  onAddProject: (data: Omit<Project, 'id'>) => void;
  onUpdateProject: (id: string, updates: Partial<Omit<Project, 'id'>>) => void;
  onDeleteProject: (id: string) => void;
  onReorderProjects: (activeId: string, overId: string) => void;
  onToggleTodo: (id: string) => void;
  onUpdateTodo: (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => void;
  onDeleteTodo: (id: string) => void;
  onAddSubtask: (todoId: string, title: string) => void;
  onToggleSubtask: (todoId: string, subtaskId: string) => void;
  onDeleteSubtask: (todoId: string, subtaskId: string) => void;
  pomodoro: ReturnType<typeof usePomodoro>;
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  editMode: boolean;
}

const COLOR_OPTIONS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6'];

function SortableProjectRow({
  project,
  stats,
  editMode,
  isEditing,
  editName,
  editIcon,
  editColor,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditNameChange,
  onEditIconChange,
  onEditColorChange,
  onDelete,
  onSelect,
  onToggleFavorite,
  t,
}: {
  project: Project;
  stats: { completed: number; total: number };
  editMode: boolean;
  isEditing: boolean;
  editName: string;
  editIcon: string;
  editColor: string;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditNameChange: (v: string) => void;
  onEditIconChange: (v: string) => void;
  onEditColorChange: (v: string) => void;
  onDelete: () => void;
  onSelect: () => void;
  onToggleFavorite: () => void;
  t: ReturnType<typeof useLanguage>['t'];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
    disabled: !editMode || isEditing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={{ ...style, background: 'var(--card)', border: `1px solid ${project.color}44` }}
        className="p-4 rounded-2xl flex flex-col gap-3"
      >
        <input
            type="text"
            value={editName}
            onChange={e => onEditNameChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onSaveEdit(); if (e.key === 'Escape') onCancelEdit(); }}
            autoFocus
            className="w-full text-sm px-3 py-2 rounded-xl outline-none"
            style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
          />
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--muted)' }}>아이콘</span>
            <IconPickerPopover value={editIcon} onChange={onEditIconChange} size="sm" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {COLOR_OPTIONS.map(color => (
              <button key={color} onClick={() => onEditColorChange(color)}
                className="w-6 h-6 rounded-full transition-transform"
                style={{ background: color, transform: editColor === color ? 'scale(1.25)' : 'scale(1)', boxShadow: editColor === color ? `0 0 0 2px var(--card), 0 0 0 3px ${color}` : 'none' }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onSaveEdit}
              disabled={!editName.trim()}
              className="flex-1 py-2 text-sm font-semibold rounded-xl text-white disabled:opacity-40"
              style={{ background: 'var(--accent)' }}
            >{t.common.save ?? '저장'}</button>
            <button
              onClick={onCancelEdit}
              className="px-4 py-2 text-sm rounded-xl"
              style={{ background: 'var(--border)', color: 'var(--muted)' }}
            >{t.common.cancel}</button>
          </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, background: 'var(--card)', border: `1px solid ${project.favorite ? project.color + '44' : 'var(--border)'}` }}
      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all"
    >
      {editMode && (
        <button
          className="flex-shrink-0 touch-none cursor-grab active:cursor-grabbing p-1"
          style={{ color: 'var(--muted)' }}
          {...attributes}
          {...listeners}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
          </svg>
        </button>
      )}
      <button
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
        onClick={() => { if (!editMode) onSelect(); }}
        disabled={editMode}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: project.color + '20' }}
        >
          {project.icon}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>
            {project.name}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {stats.completed} / {stats.total}개
          </p>
        </div>
      </button>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {editMode ? (
          <>
            <button
              onClick={onStartEdit}
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="w-7 h-7 rounded-full flex items-center justify-center text-red-400 font-bold"
              style={{ background: 'rgba(239,68,68,0.1)' }}
            >×</button>
          </>
        ) : (
          <>
            <button
              onClick={onToggleFavorite}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{
                color: project.favorite ? '#f59e0b' : 'var(--muted)',
                background: project.favorite ? 'rgba(245,158,11,0.12)' : 'transparent',
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill={project.favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} style={{ color: 'var(--muted)', opacity: 0.4 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </>
        )}
      </div>
    </div>
  );
}

export default function ProjectsView({
  projects, allTodos,
  onToggleFavorite, onAddProject, onUpdateProject, onDeleteProject, onReorderProjects,
  onToggleTodo, onUpdateTodo, onDeleteTodo,
  onAddSubtask, onToggleSubtask, onDeleteSubtask,
  pomodoro, selectedProjectId, onSelectProject,
  editMode,
}: ProjectsViewProps) {
  const { t } = useLanguage();
  const UNASSIGNED = '__unassigned__';
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('💼');
  const [newColor, setNewColor] = useState('#6366f1');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('💼');
  const [editColor, setEditColor] = useState('#6366f1');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const favorited = projects.filter(p => p.favorite);
  const rest = projects.filter(p => !p.favorite);
  const sorted = [...favorited, ...rest];

  function todoStats(projectId: string) {
    const relevant = allTodos.filter(todo => todo.projectId === projectId && !todo.deletedAt);
    return { completed: relevant.filter(t => t.completed).length, total: relevant.length };
  }

  function unassignedStats() {
    const relevant = allTodos.filter(todo => !todo.projectId && !todo.deletedAt);
    return { completed: relevant.filter(t => t.completed).length, total: relevant.length };
  }

  function startEditProject(project: Project) {
    setEditingProjectId(project.id);
    setEditName(project.name);
    setEditIcon(project.icon);
    setEditColor(project.color);
    setShowAdd(false);
  }

  function saveEditProject() {
    if (!editName.trim() || !editingProjectId) return;
    onUpdateProject(editingProjectId, { name: editName.trim(), icon: editIcon, color: editColor });
    setEditingProjectId(null);
  }

  function handleAdd() {
    if (!newName.trim()) return;
    onAddProject({ name: newName.trim(), icon: newIcon, color: newColor });
    setNewName(''); setNewIcon('💼'); setNewColor('#6366f1');
    setShowAdd(false);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorderProjects(active.id as string, over.id as string);
    }
  }

  // ─── 프로젝트 상세 (할 일 목록) ───
  if (selectedProjectId !== null) {
    const isUnassigned = selectedProjectId === UNASSIGNED;
    const project = isUnassigned ? null : projects.find(p => p.id === selectedProjectId);
    if (!isUnassigned && !project) { onSelectProject(null); return null; }

    const projectTodos = isUnassigned
      ? allTodos.filter(todo => !todo.projectId && !todo.deletedAt)
      : allTodos.filter(todo => todo.projectId === selectedProjectId && !todo.deletedAt);
    const active = projectTodos.filter(todo => !todo.completed);
    const completed = projectTodos.filter(todo => todo.completed);

    return (
      <div className="flex flex-col h-full">
        {/* PC 전용 프로젝트 헤더 */}
        <div
          className="hidden md:flex flex-shrink-0 items-center gap-3 px-4 py-3"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--card)' }}
        >
          <button
            onClick={() => onSelectProject(null)}
            className="flex items-center gap-1 text-sm font-medium active:opacity-60"
            style={{ color: 'var(--accent)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {t.nav.projects}
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-base">{project?.icon ?? '📂'}</span>
            <span className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{project?.name ?? t.projects.unassigned}</span>
          </div>
        </div>

        {/* 할 일 목록 */}
        <div className="flex-1 overflow-y-auto">
          {projectTodos.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm" style={{ color: 'var(--muted)' }}>{t.projects.noProjects}</p>
            </div>
          ) : (
            <div>
              {active.map(todo => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={onToggleTodo}
                  onUpdate={onUpdateTodo}
                  onDelete={onDeleteTodo}
                  onAddSubtask={onAddSubtask}
                  onToggleSubtask={onToggleSubtask}
                  onDeleteSubtask={onDeleteSubtask}
                  onStartPomodoro={id => pomodoro.selectTodo(id)}
                  compact
                />
              ))}
              {completed.length > 0 && (
                <div className="px-4 py-2 mt-1">
                  <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                    {t.status.completed} ({completed.length})
                  </p>
                </div>
              )}
              {completed.map(todo => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={onToggleTodo}
                  onUpdate={onUpdateTodo}
                  onDelete={onDeleteTodo}
                  onAddSubtask={onAddSubtask}
                  onToggleSubtask={onToggleSubtask}
                  onDeleteSubtask={onDeleteSubtask}
                  onStartPomodoro={id => pomodoro.selectTodo(id)}
                  compact
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── 프로젝트 목록 ───
  return (
    <div className="max-w-lg mx-auto px-4 py-5">
      {/* PC 전용 헤더 (편집 버튼 포함) */}
      <div className="hidden md:flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{t.nav.projects}</h2>
      </div>

      {/* 편집 모드: 프로젝트 추가 영역 */}
      {editMode && (
        <div className="mb-4">
          {showAdd ? (
            <div
              className="p-4 rounded-2xl flex flex-col gap-3"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <input
                type="text"
                placeholder={t.sidebar.projectName}
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
                autoFocus
                className="w-full text-sm px-3 py-2 rounded-xl outline-none"
                style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
              />
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--muted)' }}>아이콘</span>
                <IconPickerPopover value={newIcon} onChange={setNewIcon} size="sm" />
              </div>
              <div className="flex gap-2 flex-wrap">
                {COLOR_OPTIONS.map(color => (
                  <button key={color} onClick={() => setNewColor(color)}
                    className="w-6 h-6 rounded-full transition-transform"
                    style={{ background: color, transform: newColor === color ? 'scale(1.25)' : 'scale(1)', boxShadow: newColor === color ? `0 0 0 2px var(--card), 0 0 0 3px ${color}` : 'none' }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  disabled={!newName.trim()}
                  className="flex-1 py-2 text-sm font-semibold rounded-xl text-white disabled:opacity-40"
                  style={{ background: 'var(--accent)' }}
                >{t.projects.addProject}</button>
                <button
                  onClick={() => { setShowAdd(false); setNewName(''); }}
                  className="px-4 py-2 text-sm rounded-xl"
                  style={{ background: 'var(--border)', color: 'var(--muted)' }}
                >{t.common.cancel}</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-medium border-2 border-dashed transition-all hover:opacity-80"
              style={{ borderColor: 'var(--accent)', color: 'var(--accent)', background: 'var(--accent-muted)' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {t.projects.addProject}
            </button>
          )}
        </div>
      )}

      {/* 즐겨찾기 섹션 레이블 */}
      {favorited.length > 0 && (
        <p className="text-xs font-semibold mb-2 px-1" style={{ color: 'var(--muted)' }}>
          ★ {t.projects.favorites}
        </p>
      )}

      {/* 프로젝트 목록 */}
      {(() => {
        const ua = unassignedStats();
        return sorted.length === 0 && ua.total === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>{t.projects.noProjects}</p>
            {!editMode && (
              <button
                onClick={() => {/* edit mode는 부모가 관리 */}}
                className="mt-3 text-xs px-4 py-2 rounded-xl font-medium"
                style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
              >{t.projects.addProject}</button>
            )}
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sorted.map(p => p.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {sorted.map((project, i) => {
                  const stats = todoStats(project.id);
                  const isFavSeparator = i === favorited.length && favorited.length > 0 && rest.length > 0;
                  const isEditing = editingProjectId === project.id;
                  return (
                    <div key={project.id}>
                      {isFavSeparator && !editMode && (
                        <p className="text-xs font-semibold mb-2 mt-3 px-1" style={{ color: 'var(--muted)' }}>
                          {t.projects.all}
                        </p>
                      )}
                      <SortableProjectRow
                        project={project}
                        stats={stats}
                        editMode={editMode}
                        isEditing={isEditing}
                        editName={editName}
                        editIcon={editIcon}
                        editColor={editColor}
                        onStartEdit={() => startEditProject(project)}
                        onSaveEdit={saveEditProject}
                        onCancelEdit={() => setEditingProjectId(null)}
                        onEditNameChange={setEditName}
                        onEditIconChange={setEditIcon}
                        onEditColorChange={setEditColor}
                        onDelete={() => onDeleteProject(project.id)}
                        onSelect={() => onSelectProject(project.id)}
                        onToggleFavorite={() => onToggleFavorite(project.id)}
                        t={t}
                      />
                    </div>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        );
      })()}

      {/* 미지정 프로젝트 */}
      {(() => {
        const us = unassignedStats();
        if (sorted.length === 0 && us.total === 0) return null;
        return (
          <div
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all mt-2"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <button
              className="flex items-center gap-3 flex-1 min-w-0 text-left"
              onClick={() => !editMode && onSelectProject(UNASSIGNED)}
              disabled={editMode}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: 'var(--border)' }}
              >
                📂
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>
                  {t.projects.unassigned}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                  {us.completed} / {us.total}개
                </p>
              </div>
            </button>
            {!editMode && (
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} style={{ color: 'var(--muted)', opacity: 0.4 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
          </div>
        );
      })()}
    </div>
  );
}
