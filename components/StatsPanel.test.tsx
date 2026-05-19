import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import StatsPanel from '@/components/StatsPanel';
import { Todo, WeeklyData } from '@/types/todo';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  XAxis: () => null,
  Cell: () => null,
}));

const makeWeeklyData = (): WeeklyData[] =>
  ['일', '월', '화', '수', '목', '금', '토'].map((day, i) => ({
    day,
    completed: i,
    date: `2026-05-${String(i + 11).padStart(2, '0')}`,
  }));

const makeTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: `todo-${Math.random()}`,
  title: '할 일',
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
  stats: { total: 0, active: 0, completed: 0 },
  streak: 0,
  weeklyData: makeWeeklyData(),
  allTodos: [],
};

describe('StatsPanel', () => {
  describe('통계 수치', () => {
    it('전체/진행 중/완료 수를 표시한다', () => {
      const props = {
        ...defaultProps,
        stats: { total: 10, active: 7, completed: 3 },
      };
      render(<StatsPanel {...props} />);

      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('전체/진행 중/완료 레이블을 표시한다', () => {
      render(<StatsPanel {...defaultProps} />);

      expect(screen.getByText('전체')).toBeInTheDocument();
      expect(screen.getByText('진행 중')).toBeInTheDocument();
      expect(screen.getByText('완료')).toBeInTheDocument();
    });
  });

  describe('완료율', () => {
    it('할 일이 없을 때 완료율이 0%다', () => {
      render(<StatsPanel {...defaultProps} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('전체 10개 중 5개 완료 시 완료율이 50%다', () => {
      const props = {
        ...defaultProps,
        stats: { total: 10, active: 5, completed: 5 },
      };
      render(<StatsPanel {...props} />);

      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('전체 완료 시 완료율이 100%다', () => {
      const props = {
        ...defaultProps,
        stats: { total: 4, active: 0, completed: 4 },
      };
      render(<StatsPanel {...props} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('연속 달성(streak)', () => {
    it('연속 0일을 표시한다', () => {
      render(<StatsPanel {...defaultProps} streak={0} />);

      expect(screen.getByText('0일')).toBeInTheDocument();
      expect(screen.getByText('연속 달성')).toBeInTheDocument();
    });

    it('연속 5일을 표시한다', () => {
      render(<StatsPanel {...defaultProps} streak={5} />);

      expect(screen.getByText('5일')).toBeInTheDocument();
    });
  });

  describe('우선순위 분포', () => {
    it('진행 중인 할 일이 없으면 우선순위 분포를 표시하지 않는다', () => {
      render(<StatsPanel {...defaultProps} />);

      expect(screen.queryByText('우선순위 분포 (진행 중)')).not.toBeInTheDocument();
    });

    it('진행 중인 할 일이 있으면 우선순위 분포 섹션이 표시된다', () => {
      const todos = [
        makeTodo({ priority: 'high' }),
        makeTodo({ priority: 'medium' }),
        makeTodo({ priority: 'low' }),
      ];
      render(<StatsPanel {...defaultProps} allTodos={todos} />);

      // 레이블이 표시됨
      expect(screen.getByText('높음')).toBeInTheDocument();
      expect(screen.getByText('보통')).toBeInTheDocument();
      expect(screen.getByText('낮음')).toBeInTheDocument();
    });

    it('각 우선순위 개수가 표시된다', () => {
      const todos = [
        makeTodo({ priority: 'high' }),
        makeTodo({ priority: 'high' }),
        makeTodo({ priority: 'medium' }),
      ];
      render(<StatsPanel {...defaultProps} allTodos={todos} />);

      // 높음 2개, 보통 1개, 낮음 0개
      const counts = screen.getAllByText('2');
      expect(counts.length).toBeGreaterThanOrEqual(1);
    });

    it('완료된 할 일은 우선순위 분포에서 제외된다', () => {
      const todos = [
        makeTodo({ priority: 'high', completed: false }),
        makeTodo({ priority: 'high', completed: true }), // 완료된 항목
      ];
      render(<StatsPanel {...defaultProps} allTodos={todos} />);

      // 진행 중인 high는 1개
      const ones = screen.getAllByText('1');
      expect(ones.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('이번 주 완료 차트', () => {
    it('"이번 주 완료" 섹션 헤딩이 표시된다', () => {
      render(<StatsPanel {...defaultProps} />);

      expect(screen.getByText(/이번 주 완료/i)).toBeInTheDocument();
    });
  });
});
