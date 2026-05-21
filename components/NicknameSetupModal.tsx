'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const ICONS = [
  '🐶','🐱','🐰','🦊','🐻','🐼','🐨','🐯',
  '🐸','🐧','🦋','🌟','⚡','🔥','🎯','🚀',
  '💎','🍀','🌈','🎮','🎨','🏆','👾','🦄',
];

interface Props {
  onSave: (nickname: string, icon: string) => Promise<void>;
  onCancel?: () => void;
  initialNickname?: string;
  initialIcon?: string;
}

export default function NicknameSetupModal({ onSave, onCancel, initialNickname = '', initialIcon = '🐶' }: Props) {
  const { t } = useLanguage();
  const [nickname, setNickname] = useState(initialNickname);
  const [icon, setIcon] = useState(initialIcon || '🐶');
  const [saving, setSaving] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const isEditMode = !!onCancel;

  async function handleSave() {
    const name = nickname.trim();
    if (!name) return;
    setSaving(true);
    await onSave(name, icon);
  }

  function handleBackdropClick() {
    if (isEditMode) {
      onCancel();
    } else {
      setShowWarning(true);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[260] flex items-end md:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdropClick}
    >
      <style>{`
        @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn  { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        .nickname-sheet { animation: slideUp 0.32s cubic-bezier(0.22,1,0.36,1) forwards; }
        @media (min-width: 768px) { .nickname-sheet { animation: fadeIn 0.25s cubic-bezier(0.22,1,0.36,1) forwards; } }
      `}</style>

      <div
        className="nickname-sheet w-full md:w-[420px] rounded-t-3xl md:rounded-3xl flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--card)',
          boxShadow: '0 -8px 48px rgba(0,0,0,0.22)',
          maxHeight: '88vh',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* 드래그 핸들 */}
        <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-9 h-1 rounded-full" style={{ background: 'var(--border)' }} />
        </div>

        {/* 경고 배너 (강제 설정 모드에서만) */}
        {showWarning && !isEditMode && (
          <div
            className="mx-6 mt-3 px-4 py-3 rounded-2xl flex items-center gap-2 flex-shrink-0"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.3)' }}
          >
            <span className="text-base flex-shrink-0">🔒</span>
            <p className="text-xs font-medium" style={{ color: '#ef4444' }}>
              {t.nickname.warning}
            </p>
          </div>
        )}

        {/* 헤더 */}
        <div className="flex items-center gap-3 px-6 pt-4 pb-3 flex-shrink-0">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--accent), #7c7af8)' }}
          >
            ✨
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>{t.nickname.setupTitle}</p>
            <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
              {isEditMode ? t.nickname.editTitle : t.nickname.makeProfile}
            </h2>
          </div>
          {isEditMode && (
            <button
              onClick={onCancel}
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--bg)', color: 'var(--muted)' }}
            >
              ✕
            </button>
          )}
        </div>

        <div className="mx-6 h-px flex-shrink-0" style={{ background: 'var(--border)' }} />

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* 아이콘 선택 */}
          <div>
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--muted)' }}>{t.nickname.selectIcon}</p>
            <div className="grid grid-cols-8 gap-2">
              {ICONS.map(ic => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className="w-full aspect-square rounded-xl text-xl flex items-center justify-center transition-all"
                  style={{
                    background: icon === ic ? 'var(--accent-muted, rgba(99,102,241,0.12))' : 'var(--bg)',
                    border: icon === ic ? '2px solid var(--accent)' : '2px solid transparent',
                    transform: icon === ic ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* 닉네임 입력 */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>{t.settings.nickname}</p>
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: 'var(--bg)', border: '1.5px solid var(--border)' }}>
              <span className="text-2xl flex-shrink-0">{icon}</span>
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value.slice(0, 12))}
                placeholder={t.nickname.placeholder}
                maxLength={12}
                className="flex-1 bg-transparent text-sm font-medium outline-none"
                style={{ color: 'var(--text)' }}
                autoFocus
              />
              <span className="text-xs flex-shrink-0" style={{ color: 'var(--muted)' }}>{nickname.length}/12</span>
            </div>
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="px-6 pb-6 pt-3 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={!nickname.trim() || saving}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-opacity disabled:opacity-40"
            style={{ background: 'var(--accent)' }}
          >
            {saving ? t.nickname.saving : isEditMode ? t.nickname.saveEdit : t.nickname.save}
          </button>
        </div>
      </div>
    </div>
  );
}
