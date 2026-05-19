import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import CalendarView from '@/components/CalendarView';
import { Todo } from '@/types/todo';

// 2026-05-17 기준으로 시간 고정
const FIXED_DATE = new Date('2026-05-17T12:00:00');

const makeTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: `todo-${Math.random().toString(36).slice(2)}`,
  title: '테스트 할 일',
  completed: false,
  priority: 'medium',
  urgency: 'not-urgent',
  recurring: 'none',
  subtasks: [],
  pomodoroCount: 0,
  createdAt: new Date().toISOString(),
  ...overrides,
});

const defaultProps = {
  allTodos: [],
  onToggle: vi.fn(),
  onUpdate: vi.fn(),
};

beforeEach(() => {
  // Date만 fake로 설정 - setTimeout/Promise는 실제 타이머 사용
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(FIXED_DATE);
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

function getDateBtn(day: number) {
  // 날짜 숫자 span을 찾아서 부모 button을 반환 (mobile grid 기준 첫 번째)
  const spans = screen.getAllByText(String(day)).filter(
    el => el.tagName === 'SPAN' && el.className.includes('rounded-full')
  );
  return spans[0]?.closest('button') as HTMLElement;
}

describe('CalendarView', () => {
  describe('헤더', () => {
    it('"캘린더" 제목이 표시된다', () => {
      render(<CalendarView {...defaultProps} />);

      // 모바일 + PC 레이아웃 양쪽에 렌더링되므로 getAllByRole 사용
      expect(screen.getAllByRole('heading', { name: '캘린더' })[0]).toBeInTheDocument();
    });

    it('현재 연/월이 표시된다', () => {
      render(<CalendarView {...defaultProps} />);

      expect(screen.getAllByText('2026년 5월')[0]).toBeInTheDocument();
    });

    it('이전 달 버튼이 있다', () => {
      render(<CalendarView {...defaultProps} />);

      // svg 버튼들 중 이전 달 버튼
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('요일 헤더', () => {
    it('일~토 요일이 표시된다', () => {
      render(<CalendarView {...defaultProps} />);

      ['일', '월', '화', '수', '목', '금', '토'].forEach(day => {
        expect(screen.getAllByText(day).length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('날짜 그리드', () => {
    it('해당 월의 날짜들이 렌더링된다', () => {
      render(<CalendarView {...defaultProps} />);

      expect(getDateBtn(1)).toBeInTheDocument();
      expect(getDateBtn(31)).toBeInTheDocument();
    });

    it('오늘(17일) 날짜 버튼이 렌더링된다', () => {
      render(<CalendarView {...defaultProps} />);

      expect(getDateBtn(17)).toBeInTheDocument();
    });
  });

  describe('월 이동', () => {
    it('이전 달 버튼 클릭 시 4월로 이동한다', async () => {
      const user = userEvent.setup();
      render(<CalendarView {...defaultProps} />);

      // 네비게이션 버튼은 날짜 버튼보다 앞에 있음
      const navButtons = screen.getAllByRole('button').filter(
        btn => !btn.textContent?.trim() || btn.closest('.flex.items-center.gap-2')
      );
      await user.click(navButtons[0]);

      expect(screen.getAllByText('2026년 4월')[0]).toBeInTheDocument();
    });

    it('다음 달 버튼 클릭 시 6월로 이동한다', async () => {
      const user = userEvent.setup();
      render(<CalendarView {...defaultProps} />);

      const navButtons = screen.getAllByRole('button').filter(
        btn => !btn.textContent?.trim() || btn.closest('.flex.items-center.gap-2')
      );
      await user.click(navButtons[1]);

      expect(screen.getAllByText('2026년 6월')[0]).toBeInTheDocument();
    });

    it('1월에서 이전 달 클릭 시 전년도 12월로 이동한다', async () => {
      vi.setSystemTime(new Date('2026-01-15T12:00:00'));
      const user = userEvent.setup();
      render(<CalendarView {...defaultProps} />);

      const navButtons = screen.getAllByRole('button').filter(
        btn => !btn.textContent?.trim()
      );
      await user.click(navButtons[0]);

      expect(screen.getAllByText('2025년 12월')[0]).toBeInTheDocument();
    });

    it('12월에서 다음 달 클릭 시 다음 해 1월로 이동한다', async () => {
      vi.setSystemTime(new Date('2026-12-15T12:00:00'));
      const user = userEvent.setup();
      render(<CalendarView {...defaultProps} />);

      const navButtons = screen.getAllByRole('button').filter(
        btn => !btn.textContent?.trim()
      );
      await user.click(navButtons[1]);

      expect(screen.getAllByText('2027년 1월')[0]).toBeInTheDocument();
    });
  });

  describe('할 일 표시', () => {
    it('마감일이 설정된 할 일이 해당 날짜에 표시된다', () => {
      const todos = [makeTodo({ title: '발표 준비', dueDate: '2026-05-20' })];
      render(<CalendarView {...defaultProps} allTodos={todos} />);

      expect(screen.getAllByText('발표 준비')[0]).toBeInTheDocument();
    });

    it('마감일이 다른 달인 할 일은 표시되지 않는다', () => {
      const todos = [makeTodo({ title: '6월 할 일', dueDate: '2026-06-10' })];
      render(<CalendarView {...defaultProps} allTodos={todos} />);

      expect(screen.queryByText('6월 할 일')).not.toBeInTheDocument();
    });

    it('같은 날짜에 4개 이상의 할 일이 있으면 "+N개"로 표시한다', () => {
      const todos = Array.from({ length: 5 }, (_, i) =>
        makeTodo({ title: `할 일 ${i + 1}`, dueDate: '2026-05-20' })
      );
      render(<CalendarView {...defaultProps} allTodos={todos} />);

      // mobile grid: max 3 shown → +2개, PC grid: max 2 shown → +3개
      expect(screen.getByText('+2개')).toBeInTheDocument();
    });
  });

  describe('날짜 클릭 및 상세 패널', () => {
    it('할 일이 없는 날짜 클릭 시 "할 일이 없습니다" 메시지를 표시한다', async () => {
      const user = userEvent.setup();
      render(<CalendarView {...defaultProps} />);

      await user.click(getDateBtn(5));

      expect(screen.getAllByText('이 날짜에 할 일이 없습니다.')[0]).toBeInTheDocument();
    });

    it('할 일이 있는 날짜 클릭 시 해당 할 일 목록을 표시한다', async () => {
      const user = userEvent.setup();
      const todos = [makeTodo({ title: '5월 20일 할 일', dueDate: '2026-05-20' })];
      render(<CalendarView {...defaultProps} allTodos={todos} />);

      await user.click(getDateBtn(20));

      expect(screen.getAllByText('5월 20일 할 일').length).toBeGreaterThanOrEqual(1);
    });

    it('같은 날짜를 다시 클릭하면 모바일 상세 패널이 닫힌다', async () => {
      const user = userEvent.setup();
      render(<CalendarView {...defaultProps} />);

      await user.click(getDateBtn(5));
      expect(screen.getAllByText('이 날짜에 할 일이 없습니다.')[0]).toBeInTheDocument();

      await user.click(getDateBtn(5));
      // PC 패널은 "날짜를 선택하세요"로 바뀌고, 모바일 패널은 숨겨짐
      expect(screen.queryByText('이 날짜에 할 일이 없습니다.')).not.toBeInTheDocument();
    });

    it('상세 패널에서 완료 토글 시 onToggle이 호출된다', async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();
      const todos = [makeTodo({ id: 'todo-x', title: '완료할 일', dueDate: '2026-05-20' })];
      render(<CalendarView {...defaultProps} allTodos={todos} onToggle={onToggle} />);

      await user.click(getDateBtn(20));

      // 상세 패널의 체크 버튼 클릭 (rounded-full border-2 클래스를 가진 버튼)
      const toggleBtn = document.querySelector('.rounded-full.border-2') as HTMLElement;
      if (toggleBtn) await user.click(toggleBtn);

      expect(onToggle).toHaveBeenCalledWith('todo-x');
    });

    it('다른 달로 이동 시 선택된 날짜가 초기화된다', async () => {
      const user = userEvent.setup();
      render(<CalendarView {...defaultProps} />);

      await user.click(getDateBtn(5));
      expect(screen.getAllByText('이 날짜에 할 일이 없습니다.')[0]).toBeInTheDocument();

      const navButtons = screen.getAllByRole('button').filter(btn => !btn.textContent?.trim());
      await user.click(navButtons[0]);
      expect(screen.queryByText('이 날짜에 할 일이 없습니다.')).not.toBeInTheDocument();
    });
  });
});
