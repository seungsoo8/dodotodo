'use client';

import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { COLOR_PALETTE } from '@/lib/colorPalette';

interface LabelPickerProps {
  colorTag?: string;
  onSelect: (hex: string | undefined) => void;
  onClose: () => void;
}

const ORDERED_HEXES = [
  '#FF3B30', '#E53935', '#D81B60', '#E91E8A', '#FF6B8A',
  '#FF9500', '#FF5722', '#F4C430', '#FFC107',
  '#34C77B', '#4DB6AC', '#8BC34A', '#7DAA7D',
  '#2196F3', '#00BCD4', '#009688', '#3F51B5', '#5C6BC0',
  '#9C5BF0', '#9575CD', '#7B1FA2',
  '#A1887F', '#78909C', '#3A3A3C',
];

const GROUPS = [{ hexes: ORDERED_HEXES }];

export default function LabelPicker({ colorTag, onSelect, onClose }: LabelPickerProps) {
  const touchStartY = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimeout(() => scrollRef.current?.scrollTo({ top: 0 }), 0);
  }, []);

  function onTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (touchStartY.current === null) return;
    if (e.touches[0].clientY - touchStartY.current > 60) {
      touchStartY.current = null;
      onClose();
    }
  }
  function onTouchEnd() { touchStartY.current = null; }

  const content = (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="fixed inset-0 z-[9999] flex items-end"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={scrollRef}
        className="w-full px-4 pt-4 pb-10"
        style={{
          background: 'var(--card)',
          borderRadius: '28px 28px 0 0',
          boxShadow: '0 -8px 48px rgba(0,0,0,0.15)',
          maxHeight: '75vh',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 드래그 핸들 */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-1 mb-4">
          <p className="font-bold" style={{ fontSize: 17, color: 'var(--text)' }}>라벨 색상</p>
          <button type="button" onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: 'var(--border)', color: 'var(--muted)' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 없음 */}
        <button
          type="button"
          onClick={() => onSelect(undefined)}
          className="flex items-center gap-3 w-full px-3 py-3 rounded-2xl mb-3 transition-all"
          style={{ background: colorTag === undefined ? 'rgba(99,102,241,0.08)' : 'transparent' }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ border: '1.5px dashed var(--border)', background: 'var(--bg)' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
              style={{ color: 'var(--muted)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <span className="text-sm font-medium" style={{ color: colorTag === undefined ? '#6366f1' : 'var(--text)' }}>없음</span>
          {colorTag === undefined && (
            <svg className="ml-auto" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* 구분선 */}
        <div className="mb-3 mx-1" style={{ height: 1, background: 'var(--border)' }} />

        {/* 색상 리스트 */}
        {GROUPS.flatMap(g => g.hexes).map(hex => {
          const c = COLOR_PALETTE.find(p => p.hex === hex);
          if (!c) return null;
          const selected = colorTag === hex;
          return (
            <button
              key={hex}
              type="button"
              onClick={() => onSelect(hex)}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all"
              style={{ background: selected ? `${hex}12` : 'transparent' }}
            >
              <div className="flex-shrink-0" style={{
                width: 28, height: 28, borderRadius: '50%', background: hex,
                boxShadow: selected ? `0 0 0 2.5px var(--card), 0 0 0 4px ${hex}` : `0 2px 6px ${hex}50`,
                transition: 'box-shadow 0.15s',
              }} />
              <span className="text-sm flex-1 text-left" style={{
                color: selected ? hex : 'var(--text)',
                fontWeight: selected ? 600 : 400,
              }}>{c.name}</span>
              {selected && (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={hex} strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
