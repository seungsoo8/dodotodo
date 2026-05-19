'use client';

import { useAdminData } from '@/hooks/useAdminData';

function formatDate(ts: { seconds: number } | undefined): string {
  if (!ts) return '-';
  const d = new Date(ts.seconds * 1000);
  return d.toLocaleDateString('ko-KR', { year: '2-digit', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function daysSince(ts: { seconds: number } | undefined): number | null {
  if (!ts) return null;
  return Math.floor((Date.now() - ts.seconds * 1000) / 86400000);
}

export default function AdminView() {
  const { users, loading, error, refresh } = useAdminData();

  const now = Date.now();
  const totalUsers = users.length;
  const newThisWeek = users.filter(u => {
    const s = (u.createdAt as unknown as { seconds: number })?.seconds;
    return s && now - s * 1000 < 7 * 86400000;
  }).length;
  const activeToday = users.filter(u => {
    const s = (u.lastLoginAt as unknown as { seconds: number })?.seconds;
    return s && now - s * 1000 < 86400000;
  }).length;
  const totalTodos = users.reduce((sum, u) => sum + (u.todoCount ?? 0), 0);

  return (
    <div className="mx-auto px-4 md:px-8 py-6 md:py-8" style={{ maxWidth: 900 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>관리자 대시보드</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>DoDoTODO 사용자 현황</p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95 disabled:opacity-40"
          style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}
        >
          <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          새로고침
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: '총 유저', value: totalUsers, color: 'var(--accent)', icon: '👤' },
          { label: '이번 주 신규', value: newThisWeek, color: '#10b981', icon: '🆕' },
          { label: '오늘 접속', value: activeToday, color: '#f59e0b', icon: '🟢' },
          { label: '총 할 일', value: totalTodos, color: '#8b5cf6', icon: '📋' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="text-xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold tabular-nums" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* 에러 */}
      {error && (
        <div className="rounded-2xl p-4 mb-4 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}

      {/* 유저 테이블 */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>유저 목록</span>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>마지막 로그인 순</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="w-6 h-6 animate-spin" style={{ color: 'var(--accent)' }} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>유저 데이터가 없어요</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)', opacity: 0.6 }}>Firestore 보안 규칙을 확인하거나, 유저가 로그인하면 자동으로 등록됩니다</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                  {['유저', '이메일', '가입일', '마지막 접속', '할 일', '완료율'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: 'var(--muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const days = daysSince(u.lastLoginAt as unknown as { seconds: number });
                  const completionRate = u.todoCount && u.todoCount > 0
                    ? Math.round((u.completedCount ?? 0) / u.todoCount * 100)
                    : null;
                  const isActive = days !== null && days < 1;

                  return (
                    <tr
                      key={u.uid}
                      style={{
                        borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none',
                        background: 'var(--card)',
                      }}
                    >
                      {/* 유저 */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {u.photoURL ? (
                            <img src={u.photoURL} alt="" className="w-7 h-7 rounded-full flex-shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white" style={{ background: 'var(--accent)' }}>
                              {(u.displayName || u.email || '?')[0].toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium truncate max-w-[120px]" style={{ color: 'var(--text)' }}>
                              {u.displayName || '(이름 없음)'}
                            </p>
                            {isActive && (
                              <span className="text-xs" style={{ color: '#10b981' }}>● 오늘 접속</span>
                            )}
                          </div>
                        </div>
                      </td>
                      {/* 이메일 */}
                      <td className="px-4 py-3">
                        <span className="text-xs truncate max-w-[160px] block" style={{ color: 'var(--muted)' }}>{u.email || '-'}</span>
                      </td>
                      {/* 가입일 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>
                          {formatDate(u.createdAt as unknown as { seconds: number })}
                        </span>
                      </td>
                      {/* 마지막 접속 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs" style={{ color: days !== null && days < 3 ? 'var(--text)' : 'var(--muted)' }}>
                          {days === null ? '-' : days === 0 ? '오늘' : days === 1 ? '어제' : `${days}일 전`}
                        </span>
                      </td>
                      {/* 할 일 수 */}
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--accent)' }}>
                          {u.todoCount ?? '-'}
                        </span>
                      </td>
                      {/* 완료율 */}
                      <td className="px-4 py-3">
                        {completionRate !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)', minWidth: 40 }}>
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${completionRate}%`,
                                  background: completionRate === 100 ? 'var(--success)' : 'var(--accent)',
                                }}
                              />
                            </div>
                            <span className="text-xs tabular-nums" style={{ color: 'var(--muted)' }}>{completionRate}%</span>
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--muted)' }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
