'use client';

import { useState } from 'react';

interface Topic {
  icon: string;
  color: string;
  title: string;
  items: { q: string; a: string }[];
}

const TOPICS: Topic[] = [
  {
    icon: '☀️',
    color: '#f59e0b',
    title: '오늘 탭',
    items: [
      { q: '오늘 탭이란?', a: '하단 탭바 맨 왼쪽의 오늘 탭은 마감일이 오늘로 설정된 할 일만 모아 보여줍니다. 오전·오후·저녁·새벽 시간대에 따라 배너 색상과 인사말이 자동으로 바뀝니다.' },
      { q: '오늘 탭에 할 일 표시하기', a: '할 일의 마감일을 오늘 날짜로 설정하면 오늘 탭에 자동으로 나타납니다. 생성 팝업이나 편집 화면에서 마감일을 오늘로 지정하세요.' },
      { q: '🎯 지금 뭐 해야 해?', a: '빈 상태 화면의 이 버튼을 탭하면 마감 초과·오늘 마감·높은 우선순위 순서로 지금 가장 먼저 처리해야 할 할 일을 자동으로 추천해줍니다.' },
      { q: '시간대별 루틴·우선순위 분류', a: '오늘 탭에 할 일이 있을 때, 높음 우선순위는 오전, 보통은 오후, 낮음은 저녁 섹션에 분류됩니다. 반복 할 일은 상단 루틴 섹션에 따로 표시됩니다.' },
      { q: '연속 달성·총 완료 통계', a: '오늘 탭 빈 상태 화면에서 지금까지의 총 완료 수와 연속 달성 일수를 확인할 수 있습니다.' },
    ],
  },
  {
    icon: '📋',
    color: '#6366f1',
    title: '할 일 관리',
    items: [
      { q: '할 일 추가하기', a: '화면 오른쪽 하단의 + 버튼을 탭하세요. 어느 화면에서든 누르면 생성 팝업이 열립니다. 제목, 마감일, 우선순위, 그룹, 태그, 반복 등을 설정할 수 있습니다.' },
      { q: '기간 설정 (시작일 ~ 마감일)', a: '생성 팝업 또는 편집 화면에서 시작일과 마감일을 범위로 지정할 수 있습니다. 기간이 설정된 할 일은 캘린더에서 해당 범위 전체에 걸쳐 표시됩니다.' },
      { q: '할 일 완료·수정·삭제', a: '항목 왼쪽 동그라미를 탭하면 완료/미완료를 전환합니다. 항목을 탭하면 인라인 편집 화면이 열립니다. 삭제된 항목은 휴지통으로 이동하며 복구할 수 있습니다.' },
      { q: '서브태스크 추가', a: '편집 화면에서 서브태스크를 추가할 수 있습니다. 서브태스크를 모두 완료하면 상위 할 일도 완료할지 묻는 팝업이 나타납니다.' },
      { q: '⭐ 즐겨찾기', a: '할 일 항목의 ⭐ 버튼을 탭하면 즐겨찾기로 등록됩니다. 목록 탭 필터바에서 "즐겨찾기" 버튼을 탭하면 즐겨찾기된 항목만 모아볼 수 있습니다.' },
      { q: '반복 할 일', a: '생성 팝업에서 반복 주기(매일·매주·매월·매년)를 설정할 수 있습니다. 반복 할 일은 오늘 탭의 루틴 섹션에도 표시됩니다.' },
      { q: '일괄 완료·삭제', a: 'PC 목록 뷰 우측 상단의 "선택" 버튼을 누르면 여러 항목을 선택해 한 번에 완료하거나 삭제할 수 있습니다.' },
    ],
  },
  {
    icon: '🗂',
    color: '#10b981',
    title: '할 일 탭 (목록 & 그룹)',
    items: [
      { q: '목록·그룹 전환', a: '하단 탭바의 "할 일" 탭을 탭하면 목록 뷰가 열립니다. 배너 하단의 목록·그룹 버튼을 탭해 두 뷰를 전환할 수 있습니다. 칸반·매트릭스를 활성화한 경우 해당 버튼도 같이 표시됩니다.' },
      { q: '목록 뷰 필터 & 정렬', a: '배너 아래 필터바에서 전체·진행 중·완료 상태 필터, 즐겨찾기 필터, 날짜·태그 필터를 조합할 수 있습니다. 정렬은 수동·우선순위·마감일·생성일 순으로 변경 가능합니다.' },
      { q: '완료된 항목 삭제', a: '필터바의 "완료 N개 삭제" 버튼을 탭하면 완료된 항목을 한 번에 휴지통으로 보낼 수 있습니다.' },
      { q: '검색', a: '목록 탭 배너 우측의 🔍 버튼을 탭하면 전체 검색 오버레이가 열립니다. PC에서는 Cmd+K(Mac) / Ctrl+K(Windows)로 열 수 있습니다.' },
      { q: '그룹 뷰', a: '배너에서 "그룹"을 선택하면 생성한 그룹 목록이 표시됩니다. 그룹을 탭하면 해당 그룹의 할 일만 볼 수 있으며, 상단에 뒤로가기 버튼이 나타납니다. 그룹을 지정하지 않은 항목은 "미지정"에서 확인하세요.' },
    ],
  },
  {
    icon: '📅',
    color: '#f59e0b',
    title: '캘린더',
    items: [
      { q: '캘린더 뷰', a: '마감일 기준으로 할 일을 달력에 표시합니다. 기간(시작일~마감일)이 설정된 할 일은 해당 범위 전체에 걸쳐 바 형태로 표시됩니다. 반복 할 일도 각 해당 날짜에 표시됩니다.' },
      { q: '날짜 탭 & 바텀시트', a: '날짜를 두 번 탭하면 해당 날짜의 할 일 목록이 바텀시트로 열립니다. 서브태스크 체크, 완료 표시, 새 할 일 추가를 바로 할 수 있습니다.' },
      { q: '월 이동', a: '배너의 < > 버튼으로 이전/다음 달로 이동합니다. 연월 버튼을 탭하면 연도와 월을 한번에 선택할 수 있는 피커가 열립니다.' },
    ],
  },
  {
    icon: '📁',
    color: '#06b6d4',
    title: '그룹 관리',
    items: [
      { q: '그룹 추가·수정·삭제', a: '할 일 탭에서 그룹 뷰로 전환한 뒤 배너의 "편집" 버튼을 누르면 편집 모드가 활성화됩니다. "그룹 추가" 버튼으로 새 그룹을 만들고, 그룹 옆 × 버튼으로 삭제할 수 있습니다. 이름, 아이콘, 색상을 자유롭게 설정하세요.' },
      { q: '그룹 즐겨찾기 고정', a: '그룹 카드의 ★ 버튼을 탭하면 즐겨찾기로 지정되며 항상 목록 상단에 고정됩니다.' },
      { q: '그룹 순서 변경', a: '편집 모드에서 그룹 카드를 길게 누른 뒤 드래그하여 순서를 바꿀 수 있습니다.' },
      { q: '미지정 그룹', a: '그룹을 지정하지 않은 할 일은 "미지정" 항목에 자동으로 모입니다. 그룹 목록 하단에서 확인할 수 있습니다.' },
      { q: '그룹으로 할 일 추가', a: '특정 그룹 상세 화면에서 + 버튼을 탭하면 해당 그룹이 자동 선택된 상태로 생성 팝업이 열립니다.' },
    ],
  },
  {
    icon: '🍅',
    color: '#ef4444',
    title: '포모도로 타이머',
    items: [
      { q: '포모도로 시작하기', a: '할 일 항목의 🍅 버튼을 탭하면 해당 할 일에 연결된 포모도로 타이머가 시작됩니다. 타이머는 화면 이동 후에도 플로팅 카드로 유지됩니다.' },
      { q: '작업·휴식 시간 조정', a: '설정 > 포모도로 탭에서 작업 시간과 휴식 시간을 분 단위로 조절할 수 있습니다.' },
      { q: '포모도로 카운트', a: '완료된 포모도로 세션 수가 할 일에 누적 기록됩니다. 항목에 🍅 개수로 표시됩니다.' },
    ],
  },
  {
    icon: '📊',
    color: '#8b5cf6',
    title: '통계 & 분석',
    items: [
      { q: '완료 기록 히트맵', a: '분석 탭에서 최근 1년간의 완료 기록을 GitHub 스타일 그리드로 시각화합니다. 색이 진할수록 많이 완료한 날입니다.' },
      { q: '연속 달성 스트릭', a: '하루도 빠짐없이 할 일을 완료한 연속 일수를 확인할 수 있습니다. 오늘 탭에서도 현재 스트릭을 볼 수 있습니다.' },
      { q: '주간 차트', a: '이번 주 요일별 완료 수를 바 차트로 확인할 수 있습니다.' },
      { q: '주간 회고', a: '분석 탭 우측 상단의 "주간 회고" 버튼 또는 일요일 저녁 자동 알림을 통해 이번 주 성과를 되돌아볼 수 있습니다.' },
    ],
  },
  {
    icon: '⚙️',
    color: '#64748b',
    title: '설정 & 기타',
    items: [
      { q: '언어 설정', a: '설정 > 기본값 탭에서 한국어/영어를 전환할 수 있습니다.' },
      { q: '테마 변경', a: '기기의 다크 모드 설정을 따릅니다. 기기에서 다크 모드를 전환하면 앱도 함께 바뀝니다.' },
      { q: '알림 설정', a: '설정 > 알림 탭에서 마감일 기반 알림을 켜고, 알림 시각과 며칠 전에 받을지 설정할 수 있습니다.' },
      { q: '휴지통', a: '삭제된 할 일은 설정 > 데이터 탭의 휴지통에서 복구하거나 영구 삭제할 수 있습니다. 30일 후 자동 삭제됩니다.' },
      { q: 'Plus (칸반·매트릭스·AI 채팅)', a: '설정 > Plus 탭에서 칸반 보드, 아이젠하워 매트릭스, AI 채팅 기능을 켜거나 끌 수 있습니다. 칸반·매트릭스를 활성화하면 할 일 탭 세그먼트 스위처에 추가되고, AI 채팅을 활성화하면 화면 좌측 하단에 ✨ 버튼이 나타납니다.' },
      { q: 'AI 채팅으로 할 일 관리', a: '화면 좌측 하단의 ✨ 버튼을 탭하면 AI 어시스턴트 채팅 패널이 열립니다. 자연어로 할 일 추가·수정을 요청할 수 있습니다. 예: "내일까지 보고서 작성 추가해줘", "오늘 할 일 중 중요도 높은 거 알려줘". AI 채팅은 설정 > Plus에서 활성화해야 합니다.' },
      { q: '마감 초과 배지', a: '마감일이 지난 미완료 할 일이 있으면 화면 우측에 빨간 배지가 표시됩니다. 탭하면 초과 목록이 열리고, 항목을 탭하면 편집 화면으로 바로 이동합니다.' },
    ],
  },
];

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

const totalItems = TOPICS.reduce((s, t) => s + t.items.length, 0);

interface Props {
  onBack?: () => void;
}

export default function HelpView({ onBack }: Props) {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const renderTopicBlock = (topic: Topic, ti: number, prefix: string) => {
    const rgb = hexToRgb(topic.color);
    return (
      <div key={ti}>
        {/* 토픽 배너 헤더 */}
        <div
          className="rounded-2xl px-4 pt-3 pb-3 mb-2 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, rgba(${rgb},0.18) 0%, rgba(${rgb},0.08) 100%)`,
            border: `1px solid rgba(${rgb},0.22)`,
          }}
        >
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, rgba(${rgb},0.2) 0%, transparent 70%)` }}
          />
          <div className="flex items-center gap-3 relative">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
              style={{ background: `rgba(${rgb},0.18)`, border: `1px solid rgba(${rgb},0.2)` }}
            >
              {topic.icon}
            </div>
            <span className="flex-1 text-sm font-bold" style={{ color: 'var(--text)' }}>{topic.title}</span>
            <span
              className="text-xs font-semibold tabular-nums px-2 py-0.5 rounded-lg flex-shrink-0"
              style={{ background: `rgba(${rgb},0.18)`, color: topic.color }}
            >
              {topic.items.length}
            </span>
          </div>
        </div>

        {/* 아코디언 카드 */}
        <div
          className="rounded-2xl overflow-hidden mb-4"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          {topic.items.map((item, ii) => {
            const key = `${prefix}-${ti}-${ii}`;
            const isOpen = openItem === key;
            const isLast = ii === topic.items.length - 1;
            return (
              <div key={ii} style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors"
                  style={{ background: isOpen ? `rgba(${rgb},0.04)` : undefined }}
                  onClick={() => setOpenItem(isOpen ? null : key)}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5"
                    style={{ background: `rgba(${rgb},${isOpen ? 1 : 0.4})`, transition: 'opacity 0.2s' }}
                  />
                  <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text)' }}>{item.q}</span>
                  <svg
                    className="w-3.5 h-3.5 flex-shrink-0"
                    style={{
                      color: topic.color,
                      opacity: 0.8,
                      transform: isOpen ? 'rotate(90deg)' : 'none',
                      transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                    }}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                {isOpen && (
                  <div
                    className="px-4 pb-4 pt-0.5"
                    style={{ borderLeft: `2.5px solid rgba(${rgb},0.5)`, marginLeft: 16 }}
                  >
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 모바일 레이아웃 */}
      <div className="md:hidden max-w-2xl mx-auto px-4 py-6">
        {/* 히어로 배너 */}
        <div
          className="rounded-2xl px-4 pt-4 pb-4 mb-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.12) 100%)',
            border: '1px solid rgba(99,102,241,0.22)',
          }}
        >
          <div
            className="absolute right-0 top-0 w-32 h-32 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
          />
          <div className="flex items-center gap-3 relative">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.22)' }}
            >
              📖
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>사용 설명서</h1>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(99,102,241,0.8)' }}>
                {TOPICS.length}개 주제 · {totalItems}개 항목
              </p>
            </div>
          </div>
        </div>

        <div>
          {TOPICS.map((topic, ti) => renderTopicBlock(topic, ti, 'mo'))}
        </div>

        {/* 팁 카드 */}
        <div
          className="rounded-2xl px-4 py-4 flex items-start gap-3"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.05) 100%)',
            border: '1px solid rgba(245,158,11,0.2)',
          }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
            style={{ background: 'rgba(245,158,11,0.15)' }}
          >
            💡
          </div>
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: '#f59e0b' }}>빠른 팁</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
              화면 왼쪽 가장자리에서 스와이프해 사이드바를 열어보세요. 각 뷰는 사이드바에서 빠르게 전환할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* PC 웹 레이아웃 */}
      <div className="hidden md:block px-8 py-8">
        <div className="mx-auto" style={{ maxWidth: 960 }}>
          {/* 히어로 배너 */}
          <div
            className="rounded-2xl px-6 py-5 mb-8 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.16) 0%, rgba(139,92,246,0.1) 100%)',
              border: '1px solid rgba(99,102,241,0.2)',
            }}
          >
            <div
              className="absolute right-0 top-0 w-48 h-48 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', transform: 'translate(20%, -20%)' }}
            />
            <div className="flex items-center gap-4 relative">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.22)' }}
              >
                📖
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>사용 설명서</h1>
                <p className="text-sm mt-0.5" style={{ color: 'rgba(99,102,241,0.8)' }}>
                  {TOPICS.length}개 주제 · {totalItems}개 항목
                </p>
              </div>
            </div>
          </div>

          {/* 2열 그리드 */}
          <div className="grid grid-cols-2 gap-x-5 gap-y-0">
            {TOPICS.map((topic, ti) => {
              const rgb = hexToRgb(topic.color);
              return (
                <div key={ti}>
                  {/* 토픽 배너 헤더 */}
                  <div
                    className="rounded-2xl px-4 pt-3 pb-3 mb-2 relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, rgba(${rgb},0.18) 0%, rgba(${rgb},0.08) 100%)`,
                      border: `1px solid rgba(${rgb},0.22)`,
                    }}
                  >
                    <div
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full pointer-events-none"
                      style={{ background: `radial-gradient(circle, rgba(${rgb},0.2) 0%, transparent 70%)` }}
                    />
                    <div className="flex items-center gap-3 relative">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                        style={{ background: `rgba(${rgb},0.18)`, border: `1px solid rgba(${rgb},0.2)` }}
                      >
                        {topic.icon}
                      </div>
                      <span className="flex-1 text-sm font-bold" style={{ color: 'var(--text)' }}>{topic.title}</span>
                      <span
                        className="text-xs font-semibold tabular-nums px-2 py-0.5 rounded-lg flex-shrink-0"
                        style={{ background: `rgba(${rgb},0.18)`, color: topic.color }}
                      >
                        {topic.items.length}
                      </span>
                    </div>
                  </div>

                  {/* 아코디언 카드 */}
                  <div
                    className="rounded-2xl overflow-hidden mb-5"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                  >
                    {topic.items.map((item, ii) => {
                      const key = `pc-${ti}-${ii}`;
                      const isOpen = openItem === key;
                      const isLast = ii === topic.items.length - 1;
                      return (
                        <div key={ii} style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
                          <button
                            className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                            style={{ background: isOpen ? `rgba(${rgb},0.04)` : undefined }}
                            onClick={() => setOpenItem(isOpen ? null : key)}
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5"
                              style={{ background: `rgba(${rgb},${isOpen ? 1 : 0.4})`, transition: 'opacity 0.2s' }}
                            />
                            <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text)' }}>{item.q}</span>
                            <svg
                              className="w-3.5 h-3.5 flex-shrink-0"
                              style={{
                                color: topic.color,
                                opacity: 0.8,
                                transform: isOpen ? 'rotate(90deg)' : 'none',
                                transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                              }}
                              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          {isOpen && (
                            <div
                              className="px-4 pb-4 pt-0.5"
                              style={{ borderLeft: `2.5px solid rgba(${rgb},0.5)`, marginLeft: 16 }}
                            >
                              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{item.a}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 팁 카드 */}
          <div
            className="rounded-2xl px-5 py-4 flex items-center gap-4"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.05) 100%)',
              border: '1px solid rgba(245,158,11,0.2)',
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
              style={{ background: 'rgba(245,158,11,0.15)' }}
            >
              💡
            </div>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              <span className="font-semibold" style={{ color: '#f59e0b' }}>빠른 팁 </span>
              화면 왼쪽 가장자리에서 스와이프해 사이드바를 열어보세요. 각 뷰는 사이드바에서 빠르게 전환할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
