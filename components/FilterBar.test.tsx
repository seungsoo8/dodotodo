import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import FilterBar from '@/components/FilterBar';

const defaultProps = {
  filterStatus: 'all' as const,
  onStatusChange: vi.fn(),
  sortOrder: 'manual' as const,
  onSortChange: vi.fn(),
  completedCount: 0,
  onClearCompleted: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('FilterBar', () => {
  describe('상태 필터', () => {
    it("'전체', '진행 중', '완료' 버튼이 렌더링된다", () => {
      render(<FilterBar {...defaultProps} />);

      expect(screen.getByRole('button', { name: '전체' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '진행 중' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '완료' })).toBeInTheDocument();
    });

    it("'진행 중' 버튼 클릭 시 onStatusChange('active')가 호출된다", async () => {
      const user = userEvent.setup();
      const onStatusChange = vi.fn();
      render(<FilterBar {...defaultProps} onStatusChange={onStatusChange} />);

      await user.click(screen.getByRole('button', { name: '진행 중' }));

      expect(onStatusChange).toHaveBeenCalledWith('active');
    });

    it("'완료' 버튼 클릭 시 onStatusChange('completed')가 호출된다", async () => {
      const user = userEvent.setup();
      const onStatusChange = vi.fn();
      render(<FilterBar {...defaultProps} onStatusChange={onStatusChange} />);

      await user.click(screen.getByRole('button', { name: '완료' }));

      expect(onStatusChange).toHaveBeenCalledWith('completed');
    });

    it("'전체' 버튼 클릭 시 onStatusChange('all')가 호출된다", async () => {
      const user = userEvent.setup();
      const onStatusChange = vi.fn();
      render(<FilterBar {...defaultProps} filterStatus="active" onStatusChange={onStatusChange} />);

      await user.click(screen.getByRole('button', { name: '전체' }));

      expect(onStatusChange).toHaveBeenCalledWith('all');
    });
  });

  describe('정렬', () => {
    it('정렬 select가 렌더링된다', () => {
      render(<FilterBar {...defaultProps} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('정렬 옵션 3가지(수동/마감일/생성일)가 존재한다', () => {
      render(<FilterBar {...defaultProps} />);

      expect(screen.getByRole('option', { name: '수동' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '마감일' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '생성일' })).toBeInTheDocument();
    });

    it('정렬 변경 시 onSortChange가 호출된다', async () => {
      const user = userEvent.setup();
      const onSortChange = vi.fn();
      render(<FilterBar {...defaultProps} onSortChange={onSortChange} />);

      await user.selectOptions(screen.getByRole('combobox'), 'dueDate');

      expect(onSortChange).toHaveBeenCalledWith('dueDate');
    });
  });

  describe('완료 항목 삭제', () => {
    it('completedCount가 0이면 "완료 삭제" 버튼이 표시되지 않는다', () => {
      render(<FilterBar {...defaultProps} completedCount={0} />);

      expect(screen.queryByRole('button', { name: /완료 삭제/ })).not.toBeInTheDocument();
    });

    it('completedCount가 1 이상이면 "완료 삭제" 버튼이 표시된다', () => {
      render(<FilterBar {...defaultProps} completedCount={3} />);

      expect(screen.getByRole('button', { name: '완료 삭제 (3)' })).toBeInTheDocument();
    });
  });
});
