'use client';

import { PATCH_NOTES } from '@/lib/patchnotes';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  version: string;
  onClose: () => void;
}

const TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  '추가': { bg: 'rgba(16,185,129,0.12)',  color: '#10b981' },
  '개선': { bg: 'rgba(99,102,241,0.12)',  color: '#6366f1' },
  '변경': { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  '수정': { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444' },
};

export default function WhatsNewModal({ version, onClose }: Props) {
  const { t } = useLanguage();
  const note = PATCH_NOTES.find(n => n.version === version);
  if (!note) return null;

  return (
    <div
      className="fixed inset-0 z-[250] flex items-end md:items-center justify-center whatsnew-backdrop"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        .whatsnew-sheet {
          animation: slideUp 0.32s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        @media (min-width: 768px) {
          .whatsnew-sheet {
            animation: fadeIn 0.25s cubic-bezier(0.22,1,0.36,1) forwards;
          }
        }
      `}</style>

      <div
        className="whatsnew-sheet w-full md:w-[400px] rounded-t-3xl md:rounded-3xl flex flex-col"
        style={{
          background: 'var(--card)',
          boxShadow: '0 -8px 48px rgba(0,0,0,0.22)',
          maxHeight: '82vh',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 드래그 핸들 (모바일) */}
        <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-9 h-1 rounded-full" style={{ background: 'var(--border)' }} />
        </div>

        {/* 헤더 */}
        <div className="flex items-center gap-3 px-6 pt-4 pb-3 flex-shrink-0">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--accent), #7c7af8)' }}
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
              {t.whatsNew.title(version)}
            </p>
            <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
              {t.whatsNew.subtitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--border)', color: 'var(--muted)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 구분선 */}
        <div className="mx-6 h-px flex-shrink-0" style={{ background: 'var(--border)' }} />

        {/* 변경 내역 */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
          {note.changes.map((change, i) => {
            const s = TYPE_STYLE[change.type] ?? TYPE_STYLE['추가'];
            return (
              <div key={i} className="flex items-start gap-3">
                <span
                  className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5"
                  style={{ background: s.bg, color: s.color }}
                >
                  {change.type}
                </span>
                <p className="text-sm leading-snug" style={{ color: 'var(--text)' }}>
                  {change.text}
                </p>
              </div>
            );
          })}
        </div>

        {/* 확인 버튼 */}
        <div className="px-6 pb-6 pt-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-opacity active:opacity-80"
            style={{ background: 'var(--accent)' }}
          >
            {t.whatsNew.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
