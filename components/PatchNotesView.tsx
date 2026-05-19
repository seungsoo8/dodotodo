'use client';

import { useState } from 'react';
import { PATCH_NOTES } from '@/lib/patchnotes';

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  추가: { bg: 'rgba(16,185,129,0.12)', text: '#10b981' },
  개선: { bg: 'rgba(99,102,241,0.12)', text: '#6366f1' },
  변경: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b' },
  수정: { bg: 'rgba(239,68,68,0.12)', text: '#ef4444' },
};

interface Props {
  onBack?: () => void;
  currentVersion?: string;
}

export default function PatchNotesView({ onBack, currentVersion }: Props) {
  const [openIdx, setOpenIdx] = useState<number>(0);

  const content = (
    <div className="space-y-3">
      {PATCH_NOTES.map((note, i) => {
        const isOpen = openIdx === i;
        const isCurrent = note.version === currentVersion;
        return (
          <div
            key={note.version}
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--card)', border: `1px solid ${isCurrent ? 'var(--accent)' : 'var(--border)'}` }}
          >
            <button
              className="w-full flex items-center gap-3 px-4 py-4 text-left"
              onClick={() => setOpenIdx(isOpen ? -1 : i)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>v{note.version}</span>
                  {isCurrent && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'var(--accent)', color: '#fff' }}>
                      현재 버전
                    </span>
                  )}
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>{note.date}</span>
                </div>
                {!isOpen && (
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
                    {note.changes.length}개 변경사항
                  </p>
                )}
              </div>
              <svg
                className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
                style={{ color: 'var(--muted)', transform: isOpen ? 'rotate(180deg)' : 'none' }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="pt-3 space-y-2">
                  {note.changes.map((c, ci) => {
                    const color = TYPE_COLORS[c.type] ?? TYPE_COLORS['추가'];
                    return (
                      <div key={ci} className="flex items-start gap-2.5">
                        <span
                          className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded-md font-semibold mt-0.5"
                          style={{ background: color.bg, color: color.text }}
                        >
                          {c.type}
                        </span>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{c.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      {/* 모바일 레이아웃 */}
      <div className="md:hidden max-w-2xl mx-auto px-4 py-6">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-medium mb-5 transition-opacity hover:opacity-70"
            style={{ color: 'var(--accent)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            설정
          </button>
        )}
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>패치노트</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>버전별 업데이트 내역</p>
        </div>
        {content}
      </div>

      {/* PC 웹 레이아웃 */}
      <div className="hidden md:block px-8 py-8">
        <div className="mx-auto" style={{ maxWidth: 720 }}>
          <div className="mb-7">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>패치노트</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>버전별 업데이트 내역</p>
          </div>
          {content}
        </div>
      </div>
    </>
  );
}
