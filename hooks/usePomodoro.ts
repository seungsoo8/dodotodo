'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type PomodoroMode = 'work' | 'break';

export function usePomodoro(
  onWorkComplete?: (todoId: string) => void,
  workMinutes = 25,
  breakMinutes = 5,
) {
  const DURATIONS: Record<PomodoroMode, number> = {
    work: workMinutes * 60,
    break: breakMinutes * 60,
  };
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const [mode, setMode] = useState<PomodoroMode>('work');
  const [timeLeft, setTimeLeft] = useState(DURATIONS.work);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  const modeRef = useRef(mode);
  const selectedRef = useRef(selectedTodoId);
  const onCompleteRef = useRef(onWorkComplete);
  modeRef.current = mode;
  selectedRef.current = selectedTodoId;
  onCompleteRef.current = onWorkComplete;

  useEffect(() => {
    setTimeLeft(DURATIONS[mode]);
    setIsRunning(false);
  }, [mode]);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev > 1) return prev - 1;
        setIsRunning(false);
        if (modeRef.current === 'work') {
          setSessions(s => s + 1);
          if (selectedRef.current) onCompleteRef.current?.(selectedRef.current);
          setMode('break');
        } else {
          setMode('work');
        }
        return 0;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(DURATIONS[modeRef.current]);
  }, []);

  const selectTodo = useCallback((id: string | null) => {
    setSelectedTodoId(id);
    setIsRunning(false);
    setMode('work');
  }, []);

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');
  const progress = 1 - timeLeft / (DURATIONS[mode] || 1);

  return {
    selectedTodoId,
    selectTodo,
    mode,
    setMode,
    timeLeft,
    minutes,
    seconds,
    progress,
    isRunning,
    start,
    pause,
    reset,
    sessions,
  };
}
