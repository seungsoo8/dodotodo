'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ICON_SETS } from '@/lib/iconSets';

interface Props {
  value: string;
  onChange: (icon: string) => void;
  size?: 'sm' | 'md';
}

export default function IconPickerPopover({ value, onChange, size = 'md' }: Props) {
  const [open, setOpen] = useState(false);
  const [activeSet, setActiveSet] = useState(0);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth < 768);
  }, []);

  const btnSize = size === 'sm' ? 'w-9 h-9 text-lg' : 'w-11 h-11 text-xl';
  const POPOVER_W = 280;
  const POPOVER_MAX_H = 380;

  function handleOpen() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      let left = rect.left;
      let top = rect.bottom + 8;
      if (left + POPOVER_W > window.innerWidth - 8) left = Math.max(8, window.innerWidth - POPOVER_W - 8);
      if (top + POPOVER_MAX_H > window.innerHeight - 8) top = Math.max(8, rect.top - POPOVER_MAX_H - 8);
      setPos({ top, left });
      setIsMobile(window.innerWidth < 768);
    }
    setOpen(v => !v);
  }

  const pcTabs = (
    <div
      className="flex gap-1 p-2 flex-shrink-0"
      style={{
        borderBottom: '1px solid var(--border)',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch' as never,
        scrollbarWidth: 'none' as never,
      }}
    >
      {ICON_SETS.map((set, i) => (
        <button
          key={i}
          type="button"
          onClick={() => setActiveSet(i)}
          className="flex-shrink-0 text-xs px-2 py-1 rounded-lg transition-colors whitespace-nowrap"
          style={{
            background: activeSet === i ? 'var(--accent)' : 'transparent',
            color: activeSet === i ? 'white' : 'var(--muted)',
            fontWeight: activeSet === i ? 600 : 400,
          }}
        >
          {set.icons[0]} {set.label.split(' · ')[0]}
        </button>
      ))}
    </div>
  );

  const pcGrid = (
    <div className="grid grid-cols-8 gap-0.5 p-2 overflow-y-auto">
      {ICON_SETS[activeSet].icons.map((icon, i) => (
        <button
          key={i}
          type="button"
          onClick={() => { onChange(icon); setOpen(false); }}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-all active:scale-90"
          style={{
            background: value === icon ? 'var(--accent)' : 'transparent',
            transform: value === icon ? 'scale(1.1)' : undefined,
          }}
        >
          {icon}
        </button>
      ))}
    </div>
  );

  const mobileSheet = (
    <div
      className="fixed inset-x-0 bottom-0 z-[501] rounded-t-3xl flex flex-col"
      style={{
        background: 'var(--card)',
        maxHeight: '72vh',
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.22)',
      }}
    >
      {/* Handle */}
      <div className="flex-shrink-0 pt-3 pb-0 flex justify-center">
        <div className="w-10 h-1.5 rounded-full" style={{ background: 'var(--border)' }} />
      </div>

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-3">
          <span
            className="w-11 h-11 flex items-center justify-center rounded-2xl text-2xl flex-shrink-0"
            style={{ background: 'var(--accent-muted, rgba(99,102,241,0.12))', fontSize: '1.6rem' }}
          >
            {value}
          </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            아이콘 선택
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'var(--bg)', color: 'var(--muted)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Category Tabs */}
      <div
        className="flex-shrink-0 flex gap-2 px-3 pb-3"
        style={{
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch' as never,
          scrollbarWidth: 'none' as never,
        }}
      >
        {ICON_SETS.map((set, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveSet(i)}
            className="flex-shrink-0 flex items-center gap-1.5 rounded-full transition-all whitespace-nowrap"
            style={{
              padding: '6px 14px 6px 10px',
              background: activeSet === i ? 'var(--accent)' : 'var(--bg)',
              color: activeSet === i ? 'white' : 'var(--muted)',
              fontWeight: activeSet === i ? 600 : 400,
              fontSize: '0.75rem',
              boxShadow: activeSet === i ? '0 2px 8px rgba(99,102,241,0.25)' : 'none',
            }}
          >
            <span style={{ fontSize: '1rem' }}>{set.icons[0]}</span>
            <span>{set.label.split(' · ')[0]}</span>
          </button>
        ))}
      </div>

      <div className="flex-shrink-0" style={{ height: 1, background: 'var(--border)' }} />

      {/* Icon Grid */}
      <div className="grid grid-cols-6 gap-1.5 p-3 overflow-y-auto">
        {ICON_SETS[activeSet].icons.map((icon, i) => (
          <button
            key={i}
            type="button"
            onClick={() => { onChange(icon); setOpen(false); }}
            className="aspect-square flex items-center justify-center rounded-xl transition-all active:scale-90"
            style={{
              fontSize: '1.5rem',
              background: value === icon ? 'var(--accent)' : 'var(--bg)',
              transform: value === icon ? 'scale(1.08)' : undefined,
              boxShadow: value === icon ? '0 2px 10px rgba(99,102,241,0.3)' : 'none',
            }}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className={`${btnSize} flex-shrink-0 flex items-center justify-center rounded-xl border transition-colors`}
        style={{
          background: 'var(--bg)',
          borderColor: open ? 'var(--accent)' : 'var(--border)',
          boxShadow: open ? '0 0 0 2px var(--accent-muted)' : 'none',
        }}
      >
        {value}
      </button>

      {open && mounted && createPortal(
        <>
          <div className="fixed inset-0 z-[500]" onClick={() => setOpen(false)} />

          {isMobile ? (
            mobileSheet
          ) : (
            /* PC: 팝오버 */
            <div
              className="fixed z-[501] rounded-2xl flex flex-col"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                width: POPOVER_W,
                maxHeight: POPOVER_MAX_H,
                top: pos.top,
                left: pos.left,
                boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
              }}
            >
              {pcTabs}
              {pcGrid}
            </div>
          )}
        </>,
        document.body
      )}
    </div>
  );
}
