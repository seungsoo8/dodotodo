'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  onDone: () => void;
}

const SLIDE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];
const SLIDE_EMOJIS = ['✅', '📋', '🍅', '📊'];

export default function OnboardingView({ onDone }: Props) {
  const { t } = useLanguage();
  const SLIDES = t.onboarding.slides.map((s, i) => ({
    emoji: SLIDE_EMOJIS[i],
    title: s.title,
    desc: s.desc,
    color: SLIDE_COLORS[i],
  }));
  const [idx, setIdx] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('left');
  const [animating, setAnimating] = useState(false);
  const slide = SLIDES[idx];
  const isLast = idx === SLIDES.length - 1;

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const mouseStartX = useRef(0);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const prevent = (e: TouchEvent) => { e.preventDefault(); };
    el.addEventListener('touchmove', prevent, { passive: false });
    return () => el.removeEventListener('touchmove', prevent);
  }, []);

  function finish() {
    onDone();
  }

  function goTo(next: number, dir: 'left' | 'right') {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setIdx(next);
      setAnimating(false);
    }, 280);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dy) > Math.abs(dx) || Math.abs(dx) < 40) return;
    if (dx < 0 && !isLast) goTo(idx + 1, 'left');
    else if (dx > 0 && idx > 0) goTo(idx - 1, 'right');
  }

  function handleMouseDown(e: React.MouseEvent) {
    mouseStartX.current = e.clientX;
    isDragging.current = true;
  }

  function handleMouseUp(e: React.MouseEvent) {
    if (!isDragging.current) return;
    isDragging.current = false;
    const dx = e.clientX - mouseStartX.current;
    if (Math.abs(dx) < 40) return;
    if (dx < 0 && !isLast) goTo(idx + 1, 'left');
    else if (dx > 0 && idx > 0) goTo(idx - 1, 'right');
  }

  return (
    <div
      ref={containerRef}
      className="h-screen flex flex-col select-none overflow-hidden"
      style={{ background: 'var(--bg)', touchAction: 'pan-y', overflowX: 'hidden' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => { isDragging.current = false; }}
    >
      {/* 배경 장식 원 */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 360, height: 360,
          borderRadius: '50%',
          background: `${slide.color}0d`,
          top: -100, right: -80,
          transition: 'background 0.4s ease',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: 240, height: 240,
          borderRadius: '50%',
          background: `${slide.color}08`,
          bottom: 80, left: -60,
          transition: 'background 0.4s ease',
        }}
      />
      <style>{`
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(-60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideOutLeft {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(-60px); }
        }
        @keyframes slideOutRight {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(60px); }
        }
        @keyframes dotPing {
          0%   { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .slide-in-left  { animation: slideInLeft  0.28s cubic-bezier(0.22,1,0.36,1) forwards; }
        .slide-in-right { animation: slideInRight 0.28s cubic-bezier(0.22,1,0.36,1) forwards; }
        .slide-out-left  { animation: slideOutLeft  0.28s cubic-bezier(0.22,1,0.36,1) forwards; }
        .slide-out-right { animation: slideOutRight 0.28s cubic-bezier(0.22,1,0.36,1) forwards; }
      `}</style>

      {/* Safe area top + Skip */}
      <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex justify-end px-6 pt-4">
          <button
            onClick={finish}
            className="text-sm px-4 py-1.5 rounded-full"
            style={{ color: 'var(--muted)', background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            {t.onboarding.skip}
          </button>
        </div>
      </div>

      {/* Slide content */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto flex flex-col items-center justify-center px-8 text-center gap-6">
        <div
          key={`emoji-${idx}`}
          className={`w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-xl ${animating ? (direction === 'left' ? 'slide-out-left' : 'slide-out-right') : (direction === 'left' ? 'slide-in-left' : 'slide-in-right')}`}
          style={{
            background: `${slide.color}18`,
            border: `2px solid ${slide.color}30`,
          }}
        >
          {slide.emoji}
        </div>

        <div
          key={`text-${idx}`}
          className={`space-y-3 ${animating ? (direction === 'left' ? 'slide-out-left' : 'slide-out-right') : (direction === 'left' ? 'slide-in-left' : 'slide-in-right')}`}
        >
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            {slide.title}
          </h2>
          <p className="text-base leading-relaxed max-w-xs" style={{ color: 'var(--muted)' }}>
            {slide.desc}
          </p>
        </div>

        {!isLast && (
          <p className="text-xs" style={{ color: 'var(--muted)', opacity: 0.45 }}>
            {t.onboarding.swipeHint}
          </p>
        )}
      </div>

      {/* 시작하기 버튼 (마지막 슬라이드) */}
      {isLast && (
        <div className="px-8 pb-4">
          <button
            onClick={finish}
            className="w-full py-4 rounded-2xl text-base font-bold text-white"
            style={{ background: slide.color }}
          >
            {t.onboarding.start}
          </button>
        </div>
      )}

      {/* Dots */}
      <div className="flex items-center justify-center gap-2 pb-6">
        {SLIDES.map((s, i) => (
          <div key={i} className="relative flex items-center justify-center">
            {i === idx && (
              <span
                className="absolute rounded-full"
                style={{
                  width: 24,
                  height: 8,
                  background: slide.color,
                  animation: 'dotPing 1.2s ease-out infinite',
                }}
              />
            )}
            <button
              onClick={() => goTo(i, i > idx ? 'left' : 'right')}
              className="relative rounded-full transition-all duration-300"
              style={{
                width: i === idx ? 24 : 8,
                height: 8,
                background: i === idx ? slide.color : 'var(--border)',
              }}
            />
          </div>
        ))}
      </div>

      <div style={{ paddingBottom: 'env(safe-area-inset-bottom)', height: 32 }} />
    </div>
  );
}
