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
    icon: '📋',
    color: '#6366f1',
    title: '할 일 관리',
    items: [
      { q: '할 일 추가하기', a: '화면 오른쪽 하단의 + 버튼을 탭하거나, 목록 화면 상단의 입력 폼을 사용하세요. 제목, 설명, 우선순위, 마감일, 카테고리, 태그를 설정할 수 있습니다.' },
      { q: '할 일 완료 표시', a: '할 일 왼쪽의 동그라미를 탭하면 완료/미완료를 토글할 수 있습니다.' },
      { q: '할 일 수정하기', a: '할 일 항목을 탭하면 상세 편집 화면이 열립니다.' },
      { q: '할 일 삭제하기', a: '항목을 왼쪽으로 스와이프하거나 편집 화면에서 삭제 버튼을 누르세요. 삭제된 항목은 휴지통으로 이동합니다.' },
      { q: '소 작업(서브태스크) 추가', a: '할 일 상세 화면에서 서브태스크를 추가할 수 있습니다. 메인 할 일의 진행률로 표시됩니다.' },
    ],
  },
  {
    icon: '🗂️',
    color: '#10b981',
    title: '뷰 & 탐색',
    items: [
      { q: '오늘 뷰', a: '오늘 마감이거나 "오늘 할 일"로 표시한 항목만 모아 보여줍니다.' },
      { q: '칸반 보드', a: '할 일 / 진행 중 / 완료 세 컬럼으로 나뉩니다. 카드를 드래그해서 상태를 변경할 수 있습니다.' },
      { q: '캘린더 뷰', a: '마감일 기준으로 달력에 할 일을 표시합니다. 날짜를 탭해 해당 날짜의 할 일을 확인하세요.' },
      { q: '아이젠하워 매트릭스', a: '긴급함/중요함 기준으로 4분면에 할 일을 배치합니다. 우선순위 결정에 활용하세요.' },
      { q: '사이드바 열기', a: '화면 왼쪽 가장자리에서 오른쪽으로 스와이프하거나 상단 메뉴 버튼을 탭하세요.' },
    ],
  },
  {
    icon: '🍅',
    color: '#ef4444',
    title: '포모도로 타이머',
    items: [
      { q: '포모도로 시작하기', a: '할 일 항목의 🍅 버튼을 탭하면 해당 할 일에 연결된 포모도로 타이머가 시작됩니다.' },
      { q: '작업/휴식 시간 조정', a: '설정 > 포모도로 타이머에서 작업 시간과 휴식 시간을 조절할 수 있습니다.' },
      { q: '포모도로 카운트', a: '완료된 포모도로 세션 수가 할 일에 기록됩니다. 🍅 개수로 확인할 수 있어요.' },
    ],
  },
  {
    icon: '📊',
    color: '#f59e0b',
    title: '통계 & 분석',
    items: [
      { q: '완료 기록 히트맵', a: '최근 1년 완료 기록을 GitHub 스타일 그리드로 시각화합니다. 연속 달성 스트릭도 확인할 수 있어요.' },
      { q: '주간 차트', a: '이번 주 요일별 완료 수를 바 차트로 확인할 수 있습니다.' },
      { q: '우선순위별 완료율', a: '높음/보통/낮음 우선순위별로 완료 비율을 확인할 수 있습니다.' },
    ],
  },
  {
    icon: '⚙️',
    color: '#8b5cf6',
    title: '설정 & 기타',
    items: [
      { q: '테마 변경', a: '기기 설정의 다크 모드를 따릅니다. 기기에서 다크 모드를 전환하면 앱도 함께 바뀝니다.' },
      { q: '알림 설정', a: '설정 > 알림에서 마감일 기반 알림을 켜고, 며칠 전에 알림을 받을지 설정할 수 있습니다.' },
      { q: '프로젝트(폴더) 관리', a: '사이드바 하단에서 프로젝트를 추가하고, 할 일을 프로젝트별로 분류할 수 있습니다.' },
      { q: '휴지통', a: '삭제된 할 일은 휴지통에서 복구하거나 영구 삭제할 수 있습니다.' },
    ],
  },
];

interface Props {
  onBack?: () => void;
}

export default function HelpView({ onBack }: Props) {
  const [openItem, setOpenItem] = useState<string | null>(null);

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
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>사용 설명서</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>앱의 모든 기능을 알아보세요</p>
        </div>

        <div className="space-y-4">
          {TOPICS.map((topic, ti) => (
            <div key={ti}>
              {/* 토픽 헤더 */}
              <div className="flex items-center gap-2.5 mb-2 px-1">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                  style={{ background: `${topic.color}18` }}
                >
                  {topic.icon}
                </div>
                <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{topic.title}</span>
              </div>

              {/* 항목 카드 */}
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                {topic.items.map((item, ii) => {
                  const key = `${ti}-${ii}`;
                  const isOpen = openItem === key;
                  const isLast = ii === topic.items.length - 1;
                  return (
                    <div key={ii} style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                        onClick={() => setOpenItem(isOpen ? null : key)}
                      >
                        <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text)' }}>{item.q}</span>
                        <svg
                          className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
                          style={{ color: topic.color, opacity: 0.7, transform: isOpen ? 'rotate(90deg)' : 'none' }}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      {isOpen && (
                        <div
                          className="px-4 pb-4"
                          style={{ borderLeft: `3px solid ${topic.color}`, marginLeft: 16 }}
                        >
                          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{item.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 팁 카드 */}
        <div
          className="mt-6 rounded-2xl px-5 py-4 flex items-start gap-3"
          style={{ background: 'var(--accent-muted)', border: '1px solid var(--border)' }}
        >
          <span className="text-lg mt-0.5">💡</span>
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--accent)' }}>빠른 팁</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
              화면 왼쪽 가장자리에서 스와이프해 사이드바를 열어보세요. 각 뷰는 사이드바에서 빠르게 전환할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* PC 웹 레이아웃 */}
      <div className="hidden md:block px-8 py-8">
        <div className="mx-auto" style={{ maxWidth: 900 }}>
          <div className="mb-7">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>사용 설명서</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>앱의 모든 기능을 알아보세요</p>
          </div>
          <div className="grid grid-cols-2 gap-5">
            {TOPICS.map((topic, ti) => (
              <div
                key={ti}
                className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                {/* 카드 헤더 */}
                <div
                  className="flex items-center gap-3 px-5 py-4"
                  style={{ borderBottom: '1px solid var(--border)', background: `${topic.color}08` }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: `${topic.color}18` }}
                  >
                    {topic.icon}
                  </div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{topic.title}</span>
                </div>
                {/* 항목 */}
                <div>
                  {topic.items.map((item, ii) => {
                    const key = `pc-${ti}-${ii}`;
                    const isOpen = openItem === key;
                    const isLast = ii === topic.items.length - 1;
                    return (
                      <div key={ii} style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
                        <button
                          className="w-full flex items-center gap-3 px-5 py-3.5 text-left"
                          onClick={() => setOpenItem(isOpen ? null : key)}
                        >
                          <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text)' }}>{item.q}</span>
                          <svg
                            className="w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200"
                            style={{ color: topic.color, opacity: 0.7, transform: isOpen ? 'rotate(90deg)' : 'none' }}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        {isOpen && (
                          <div
                            className="px-5 pb-4"
                            style={{ borderLeft: `3px solid ${topic.color}`, marginLeft: 20 }}
                          >
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{item.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* 팁 카드 */}
          <div
            className="mt-5 rounded-2xl px-5 py-4 flex items-center gap-3"
            style={{ background: 'var(--accent-muted)', border: '1px solid var(--border)' }}
          >
            <span className="text-lg">💡</span>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              <span className="font-semibold" style={{ color: 'var(--accent)' }}>빠른 팁 </span>
              화면 왼쪽 가장자리에서 스와이프해 사이드바를 열어보세요. 각 뷰는 사이드바에서 빠르게 전환할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
