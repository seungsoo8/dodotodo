'use client';

import { useState, useMemo } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Todo, WeeklyData, DailyCompletion } from '@/types/todo';

interface WidgetDataPlugin {
  setTodos(options: { todosJson: string }): Promise<void>;
  saveImageToPhotos(options: { base64: string }): Promise<void>;
}
const WidgetData = registerPlugin<WidgetDataPlugin>('WidgetData');

const isNative = Capacitor.isNativePlatform();

interface ReviewData {
  date: string;
  topThree: string[];
  note: string;
  completedCount: number;
  completedTitles?: string[];
}

interface Props {
  todos: Todo[];
  history: DailyCompletion[];
  streak: number;
  weeklyData: WeeklyData[];
  onClose: () => void;
  onSave?: (data: ReviewData) => void;
}

function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function getWeekLabel(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const dayOfMonth = d.getDate();
  const week = Math.ceil(dayOfMonth / 7);
  return `${year}년 ${month}월 ${week}주차`;
}

export default function WeeklyReviewModal({ todos, history, streak, weeklyData, onClose, onSave }: Props) {
  const [topThree, setTopThree] = useState<string[]>(['', '', '']);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  const weekAgo = offsetDate(-7);
  const today = offsetDate(0);

  const weekCompleted = useMemo(() =>
    todos.filter(t => !t.deletedAt && t.completed && t.completedAt && t.completedAt >= weekAgo + 'T00:00:00'),
    [todos, weekAgo]
  );

  const incomplete = useMemo(() =>
    todos.filter(t => !t.deletedAt && !t.completed && t.dueDate && t.dueDate <= today),
    [todos, today]
  );

  const totalThisWeek = weeklyData.reduce((s, d) => s + d.completed, 0);
  const bestDay = weeklyData.reduce((best, d) => d.completed > best.completed ? d : best, weeklyData[0]);
  const pct = totalThisWeek > 0 ? Math.round((weekCompleted.length / Math.max(totalThisWeek, weekCompleted.length)) * 100) : 0;

  function buildReviewCanvas(data: ReviewData): HTMLCanvasElement {
    // 9:16 모바일 비율 고정
    const W = 540, H = 960;
    const pad = 28;

    const canvas = document.createElement('canvas');
    canvas.width = W * 2; canvas.height = H * 2;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(2, 2);

    const f = (size: number, weight = 400) =>
      `${weight} ${size}px -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`;

    function clip(text: string, font: string, maxW: number): string {
      ctx.font = font;
      if (ctx.measureText(text).width <= maxW) return text;
      let t = text;
      while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
      return t + '…';
    }

    // 배경
    ctx.fillStyle = '#f0f2ff';
    ctx.fillRect(0, 0, W, H);

    // 헤더 그라디언트
    const HEADER_H = 200;
    const grad = ctx.createLinearGradient(0, 0, W, HEADER_H);
    grad.addColorStop(0, '#6366f1'); grad.addColorStop(1, '#a855f7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, HEADER_H);

    // 장식 원
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath(); ctx.arc(W - 50, -30, 120, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(W + 20, 140, 90, 0, Math.PI * 2); ctx.fill();

    // 헤더 텍스트
    ctx.fillStyle = 'rgba(255,255,255,0.62)';
    ctx.font = f(12, 600); ctx.fillText('Plenio', pad, 36);

    ctx.fillStyle = '#fff';
    ctx.font = f(34, 800); ctx.fillText('주간 회고', pad, 96);

    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.font = f(13); ctx.fillText(`${getWeekLabel()}  ·  ${data.date}`, pad, 122);

    // 완료율 우측
    const completionRatio = Math.min(data.completedCount / Math.max(totalThisWeek, 1), 1);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = f(26, 700); ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(completionRatio * 100)}%`, W - pad, 96);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = f(11); ctx.fillText('완료율', W - pad, 115);
    ctx.textAlign = 'left';

    // 프로그레스 바
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    roundRect(ctx, pad, 152, W - pad * 2, 6, 3); ctx.fill();
    if (completionRatio > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      roundRect(ctx, pad, 152, (W - pad * 2) * completionRatio, 6, 3); ctx.fill();
    }

    // 흰 카드
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, 0, HEADER_H - 24, W, H - (HEADER_H - 24), 26); ctx.fill();

    let y = HEADER_H + 10;

    // 통계 3칸
    const cw = (W - pad * 2 - 12) / 3;
    [
      { emoji: '✅', value: String(data.completedCount), label: '완료한 일', color: '#10b981', bg: '#f0fdf4' },
      { emoji: '🔥', value: `${streak}일`, label: '연속 달성', color: '#6366f1', bg: '#eef2ff' },
      { emoji: '⭐', value: `${bestDay?.completed ?? 0}개`, label: '최고 기록', color: '#f59e0b', bg: '#fffbeb' },
    ].forEach((s, i) => {
      const cx = pad + i * (cw + 6);
      ctx.fillStyle = s.bg;
      roundRect(ctx, cx, y, cw, 88, 14); ctx.fill();
      ctx.font = f(22); ctx.textAlign = 'center';
      ctx.fillText(s.emoji, cx + cw / 2, y + 28);
      ctx.fillStyle = s.color; ctx.font = f(19, 700);
      ctx.fillText(s.value, cx + cw / 2, y + 56);
      ctx.fillStyle = '#94a3b8'; ctx.font = f(11);
      ctx.fillText(s.label, cx + cw / 2, y + 74);
      ctx.textAlign = 'left';
    });
    y += 106;

    // 바 차트 섹션
    ctx.fillStyle = '#f8fafc';
    roundRect(ctx, pad, y, W - pad * 2, 96, 14); ctx.fill();

    ctx.fillStyle = '#64748b'; ctx.font = f(11, 600);
    ctx.fillText('이번 주 활동', pad + 14, y + 18);

    const bAreaH = 50, bMax = Math.max(...weeklyData.map(d => d.completed), 1);
    const bW = (W - pad * 2 - 28) / 7;
    weeklyData.forEach((d, i) => {
      const bx = pad + 14 + i * bW + bW * 0.15;
      const bWidth = bW * 0.7;
      const bHeight = Math.max((d.completed / bMax) * (bAreaH - 4), d.completed > 0 ? 6 : 2);
      ctx.fillStyle = d.completed > 0 ? '#818cf8' : '#e2e8f0';
      roundRect(ctx, bx, y + 26 + bAreaH - bHeight, bWidth, bHeight, 3); ctx.fill();
      if (d.completed > 0) {
        ctx.fillStyle = '#6366f1'; ctx.font = f(9, 600); ctx.textAlign = 'center';
        ctx.fillText(String(d.completed), bx + bWidth / 2, y + 26 + bAreaH - bHeight - 3);
      }
      ctx.fillStyle = '#94a3b8'; ctx.font = f(10); ctx.textAlign = 'center';
      ctx.fillText(d.day, bx + bWidth / 2, y + 26 + bAreaH + 13);
      ctx.textAlign = 'left';
    });
    y += 114;

    // 완료한 일 목록
    if (data.completedTitles && data.completedTitles.length > 0) {
      y += 6;
      ctx.fillStyle = '#475569'; ctx.font = f(11.5, 600);
      ctx.fillText('✅ 완료한 일', pad, y);
      y += 16;
      data.completedTitles.slice(0, 5).forEach((title) => {
        ctx.fillStyle = '#f0fdf4';
        roundRect(ctx, pad, y, W - pad * 2, 32, 9); ctx.fill();
        ctx.fillStyle = '#10b981';
        ctx.beginPath(); ctx.arc(pad + 15, y + 16, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#334155';
        ctx.fillText(clip(title, f(12), W - pad * 2 - 36), pad + 27, y + 21);
        y += 38;
      });
      y += 6;
    }

    // 다음 주 TOP 3
    if (data.topThree.length > 0) {
      y += 6;
      ctx.fillStyle = '#475569'; ctx.font = f(11.5, 600);
      ctx.fillText('🎯 다음 주 TOP 3', pad, y);
      y += 16;
      data.topThree.forEach((item, i) => {
        const colors = ['#6366f1', '#8b5cf6', '#a855f7'];
        const bgs = ['#eef2ff', '#f5f3ff', '#faf5ff'];
        ctx.fillStyle = bgs[i];
        roundRect(ctx, pad, y, W - pad * 2, 34, 10); ctx.fill();
        ctx.fillStyle = colors[i];
        ctx.beginPath(); ctx.arc(pad + 15, y + 17, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = f(10, 700); ctx.textAlign = 'center';
        ctx.fillText(String(i + 1), pad + 15, y + 21);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#1e293b'; ctx.font = f(12.5, 500);
        ctx.fillText(clip(item, f(12.5, 500), W - pad * 2 - 42), pad + 32, y + 22);
        y += 40;
      });
      y += 6;
    }

    // 한 줄 소감
    if (data.note) {
      y += 6;
      ctx.fillStyle = '#475569'; ctx.font = f(11.5, 600);
      ctx.fillText('✍️ 한 줄 소감', pad, y);
      y += 14;
      ctx.fillStyle = '#f8fafc';
      roundRect(ctx, pad, y, W - pad * 2, 46, 12); ctx.fill();
      ctx.fillStyle = '#334155'; ctx.font = f(13);
      ctx.fillText(clip(data.note, f(13), W - pad * 2 - 24), pad + 14, y + 29);
      y += 60;
    }

    // 푸터 (고정 위치)
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(pad, H - 44, W - pad * 2, 1);
    ctx.fillStyle = '#94a3b8'; ctx.font = f(11); ctx.textAlign = 'center';
    ctx.fillText('Made with Plenio', W / 2, H - 20);
    ctx.textAlign = 'left';

    return canvas;
  }

  function downloadReviewImage(data: ReviewData) {
    const canvas = buildReviewCanvas(data);
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url; a.download = `주간회고-${data.date}.png`; a.click();
  }

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  async function handleSave() {
    const data = { date: today, topThree: topThree.filter(Boolean), note, completedCount: weekCompleted.length, completedTitles: weekCompleted.slice(0, 5).map(t => t.title) };
    onSave?.(data);
    setSaved(true);
    if (isNative) {
      const canvas = buildReviewCanvas(data);
      const base64 = canvas.toDataURL('image/png').split(',')[1];
      const fileName = `주간회고-${data.date}.png`;
      try {
        // 1순위: PHPhotoLibrary 직접 저장 (Clean Build 후 동작)
        await WidgetData.saveImageToPhotos({ base64 });
      } catch {
        // fallback: 공유 시트 (Info.plist에 NSPhotoLibraryAddUsageDescription 추가됐으므로 "사진 저장" 항목 뜸)
        try {
          await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
          const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
          await Share.share({ title: `주간 회고 — ${getWeekLabel()}`, files: [uri] });
        } catch (shareErr) {
          console.error('share failed:', shareErr);
        }
      }
      onClose();
    } else {
      downloadReviewImage(data);
      setTimeout(onClose, 1200);
    }
  }

  function updateTop(idx: number, val: string) {
    setTopThree(prev => { const n = [...prev]; n[idx] = val; return n; });
  }

  const barMax = Math.max(...weeklyData.map(d => d.completed), 1);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div
        className="w-full md:max-w-md rounded-t-3xl md:rounded-3xl overflow-y-auto"
        style={{ background: 'var(--card)', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 드래그 핸들 */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
        </div>

        <div className="px-5 pb-8 pt-4">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>📅 주간 회고</h2>
              <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--accent)' }}>{getWeekLabel()}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--border)', color: 'var(--muted)' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { label: '완료한 일', value: weekCompleted.length, color: 'var(--success)', emoji: '✅' },
              { label: '연속 달성', value: `${streak}일`, color: 'var(--accent)', emoji: '🔥' },
              { label: '이번주 최고', value: `${bestDay?.completed ?? 0}개`, color: 'var(--warning)', emoji: '⭐' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl py-3 px-2 flex flex-col items-center gap-0.5"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <span className="text-lg">{s.emoji}</span>
                <span className="text-lg font-bold tabular-nums" style={{ color: s.color }}>{s.value}</span>
                <span className="text-xs text-center" style={{ color: 'var(--muted)' }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* 요일별 바 차트 */}
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>이번 주 활동</p>
            <div className="flex items-end gap-1.5 h-16">
              {weeklyData.map(d => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-md transition-all duration-500"
                    style={{
                      height: `${Math.max((d.completed / barMax) * 52, d.completed > 0 ? 8 : 2)}px`,
                      background: d.completed > 0 ? 'var(--accent)' : 'var(--border)',
                      opacity: d.completed > 0 ? 1 : 0.4,
                    }} />
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 미완료 할 일 */}
          {incomplete.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
                ⚠️ 미완료 ({incomplete.length})
              </p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {incomplete.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: t.priority === 'high' ? '#ef4444' : t.priority === 'medium' ? '#f59e0b' : '#6366f1' }} />
                    <span className="text-sm flex-1 truncate" style={{ color: 'var(--text)' }}>{t.title}</span>
                    {t.dueDate && <span className="text-xs flex-shrink-0" style={{ color: 'var(--muted)' }}>{t.dueDate}</span>}
                  </div>
                ))}
                {incomplete.length > 5 && (
                  <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>+{incomplete.length - 5}개 더</p>
                )}
              </div>
            </div>
          )}

          {/* 다음 주 TOP 3 */}
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
              🎯 다음 주 TOP 3
            </p>
            {topThree.map((val, i) => (
              <input key={i} type="text" value={val} onChange={e => updateTop(i, e.target.value)}
                placeholder={`${i + 1}순위 목표`}
                className="w-full mb-2 px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            ))}
          </div>

          {/* 한 줄 소감 */}
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
              ✍️ 이번 주 한 줄 소감
            </p>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="이번 주 어떠셨나요?"
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </div>

          {/* 저장 버튼 */}
          <button onClick={handleSave} disabled={saved}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-60"
            style={{ background: saved ? 'var(--success)' : 'var(--accent)' }}>
            {saved ? '✅ 저장되었어요!' : '회고 저장하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
