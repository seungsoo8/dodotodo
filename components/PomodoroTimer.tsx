'use client';

import { useState } from 'react';
import { Todo } from '@/types/todo';
import { usePomodoro } from '@/hooks/usePomodoro';

interface PomodoroTimerProps {
  pomodoro: ReturnType<typeof usePomodoro>;
  todo: Todo | null;
  onClose: () => void;
}

export default function PomodoroTimer({ pomodoro, todo, onClose }: PomodoroTimerProps) {
  const [minimized, setMinimized] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  const { minutes, seconds, progress, isRunning, start, pause, reset, mode, sessions } = pomodoro;

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const modeColor = mode === 'work' ? 'var(--accent)' : '#10b981';
  const modeLabel = mode === 'work' ? '집중' : '휴식';

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed flex items-center gap-2 px-4 py-2.5 rounded-full shadow-xl transition-all hover:scale-105 active:scale-95 z-50"
        style={{ background: modeColor, color: 'white', bottom: 'calc(env(safe-area-inset-bottom) + 80px)', right: '20px' }}
      >
        <span className="text-sm font-bold tabular-nums">{minutes}:{seconds}</span>
        {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
      </button>
    );
  }

  const focusRadius = 72;
  const focusCircumference = 2 * Math.PI * focusRadius;
  const focusDashOffset = focusCircumference * (1 - progress);

  if (focusMode) {
    return (
      <div
        className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6"
        style={{
          background: mode === 'work' ? '#0e0e16' : '#0a1a10',
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-widest"
            style={{ background: `${modeColor}20`, color: modeColor }}
          >
            {modeLabel} 모드
          </span>
          <span className="text-xs font-medium tabular-nums" style={{ color: 'rgba(255,255,255,0.35)' }}>
            ×{sessions} 완료
          </span>
        </div>

        {todo && (
          <p className="text-base font-medium text-center px-8 max-w-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {todo.title}
          </p>
        )}

        <div className="relative" style={{ width: 200, height: 200 }}>
          <svg className="-rotate-90" width={200} height={200} viewBox="0 0 160 160">
            <circle cx="80" cy="80" r={focusRadius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
            <circle
              cx="80" cy="80" r={focusRadius} fill="none"
              stroke={modeColor} strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={focusCircumference}
              strokeDashoffset={focusDashOffset}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <span className="text-5xl font-bold tabular-nums text-white">
              {minutes}:{seconds}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <button
            onClick={reset}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <button
            onClick={isRunning ? pause : start}
            className="w-20 h-20 rounded-full flex items-center justify-center text-white shadow-2xl transition-all hover:scale-105 active:scale-95"
            style={{ background: modeColor, boxShadow: `0 0 40px ${modeColor}60` }}
          >
            {isRunning ? (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            onClick={() => setFocusMode(false)}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
            title="집중 모드 종료"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex gap-2 mt-2">
          <button
            onClick={() => pomodoro.setMode('work')}
            className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: mode === 'work' ? `${modeColor}25` : 'rgba(255,255,255,0.06)',
              color: mode === 'work' ? modeColor : 'rgba(255,255,255,0.4)',
              border: `1px solid ${mode === 'work' ? modeColor + '60' : 'transparent'}`,
            }}
          >
            집중 25분
          </button>
          <button
            onClick={() => pomodoro.setMode('break')}
            className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: mode === 'break' ? '#10b98120' : 'rgba(255,255,255,0.06)',
              color: mode === 'break' ? '#10b981' : 'rgba(255,255,255,0.4)',
              border: `1px solid ${mode === 'break' ? '#10b98160' : 'transparent'}`,
            }}
          >
            휴식 5분
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed w-72 rounded-2xl shadow-2xl z-50 overflow-hidden"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', bottom: 'calc(env(safe-area-inset-bottom) + 80px)', right: '20px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <span className="text-base">🍅</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>포모도로</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: `${modeColor}20`, color: modeColor }}
          >
            {modeLabel}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFocusMode(true)}
            className="p-1.5 rounded-lg transition-colors hover:opacity-60"
            style={{ color: 'var(--muted)' }}
            title="집중 모드"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
          <button
            onClick={() => setMinimized(true)}
            className="p-1.5 rounded-lg transition-colors hover:opacity-60"
            style={{ color: 'var(--muted)' }}
            title="최소화"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:opacity-60"
            style={{ color: 'var(--muted)' }}
            title="닫기"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Todo title */}
      {todo && (
        <div className="px-4 pt-3 pb-0">
          <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
            📌 {todo.title}
          </p>
        </div>
      )}

      {/* Timer ring */}
      <div className="flex flex-col items-center py-5">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r={radius} fill="none" stroke="var(--border)" strokeWidth="5" />
            <circle
              cx="40" cy="40" r={radius} fill="none"
              stroke={modeColor} strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text)' }}>
              {minutes}:{seconds}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={reset}
            className="p-2 rounded-full transition-colors hover:opacity-60"
            style={{ color: 'var(--muted)', background: 'var(--accent-muted)' }}
            title="리셋"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <button
            onClick={isRunning ? pause : start}
            className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-all hover:scale-105 active:scale-95"
            style={{ background: modeColor }}
          >
            {isRunning ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <div className="p-2 rounded-full" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.12)' }}>
            <span className="text-sm font-bold">×{sessions}</span>
          </div>
        </div>
      </div>

      {/* Mode switcher */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={() => pomodoro.setMode('work')}
          className="flex-1 py-1.5 text-xs font-medium rounded-lg transition-all"
          style={{
            background: mode === 'work' ? `${modeColor}20` : 'transparent',
            color: mode === 'work' ? modeColor : 'var(--muted)',
            border: `1px solid ${mode === 'work' ? modeColor : 'var(--border)'}`,
          }}
        >
          집중 25분
        </button>
        <button
          onClick={() => pomodoro.setMode('break')}
          className="flex-1 py-1.5 text-xs font-medium rounded-lg transition-all"
          style={{
            background: mode === 'break' ? '#10b98120' : 'transparent',
            color: mode === 'break' ? '#10b981' : 'var(--muted)',
            border: `1px solid ${mode === 'break' ? '#10b981' : 'var(--border)'}`,
          }}
        >
          휴식 5분
        </button>
      </div>
    </div>
  );
}
