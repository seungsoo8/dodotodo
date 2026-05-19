import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import SubtaskList from '@/components/SubtaskList';
import { Subtask } from '@/types/todo';

const subtasks: Subtask[] = [
  { id: 's1', title: '서브태스크 1', completed: false },
  { id: 's2', title: '서브태스크 2', completed: true },
  { id: 's3', title: '서브태스크 3', completed: false },
];

const defaultProps = {
  todoId: 'todo-1',
  subtasks: [],
  onAdd: vi.fn(),
  onToggle: vi.fn(),
  onDelete: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SubtaskList', () => {
  describe('렌더링', () => {
    it('서브태스크가 없으면 목록을 표시하지 않는다', () => {
      render(<SubtaskList {...defaultProps} />);

      expect(screen.queryByText('서브태스크')).not.toBeInTheDocument();
    });

    it('서브태스크가 있으면 각 항목의 제목을 표시한다', () => {
      render(<SubtaskList {...defaultProps} subtasks={subtasks} />);

      expect(screen.getByText('서브태스크 1')).toBeInTheDocument();
      expect(screen.getByText('서브태스크 2')).toBeInTheDocument();
      expect(screen.getByText('서브태스크 3')).toBeInTheDocument();
    });

    it('완료/전체 수를 표시한다', () => {
      render(<SubtaskList {...defaultProps} subtasks={subtasks} />);

      expect(screen.getByText('1/3')).toBeInTheDocument();
    });

    it('완료된 서브태스크는 line-through 스타일이 적용된다', () => {
      render(<SubtaskList {...defaultProps} subtasks={subtasks} />);

      expect(screen.getByText('서브태스크 2')).toHaveClass('line-through');
    });

    it('미완료 서브태스크는 line-through 스타일이 없다', () => {
      render(<SubtaskList {...defaultProps} subtasks={subtasks} />);

      expect(screen.getByText('서브태스크 1')).not.toHaveClass('line-through');
    });

    it('"서브태스크 추가" 버튼이 표시된다', () => {
      render(<SubtaskList {...defaultProps} />);

      expect(screen.getByRole('button', { name: /서브태스크 추가/ })).toBeInTheDocument();
    });
  });

  describe('진행률 바', () => {
    it('모두 미완료이면 진행률 바의 width가 0%다', () => {
      const allIncomplete: Subtask[] = [
        { id: 's1', title: '항목1', completed: false },
        { id: 's2', title: '항목2', completed: false },
      ];
      const { container } = render(<SubtaskList {...defaultProps} subtasks={allIncomplete} />);

      const progressBar = container.querySelector('.h-full.rounded-full') as HTMLElement;
      expect(progressBar.style.width).toBe('0%');
    });

    it('모두 완료이면 진행률 바의 width가 100%다', () => {
      const allComplete: Subtask[] = [
        { id: 's1', title: '항목1', completed: true },
        { id: 's2', title: '항목2', completed: true },
      ];
      const { container } = render(<SubtaskList {...defaultProps} subtasks={allComplete} />);

      const progressBar = container.querySelector('.h-full.rounded-full') as HTMLElement;
      expect(progressBar.style.width).toBe('100%');
    });

    it('1/2 완료이면 진행률 바의 width가 50%다', () => {
      const halfComplete: Subtask[] = [
        { id: 's1', title: '항목1', completed: true },
        { id: 's2', title: '항목2', completed: false },
      ];
      const { container } = render(<SubtaskList {...defaultProps} subtasks={halfComplete} />);

      const progressBar = container.querySelector('.h-full.rounded-full') as HTMLElement;
      expect(progressBar.style.width).toBe('50%');
    });
  });

  describe('서브태스크 토글', () => {
    it('서브태스크 버튼 클릭 시 onToggle이 todoId, subtaskId와 함께 호출된다', async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();
      render(<SubtaskList {...defaultProps} subtasks={subtasks} onToggle={onToggle} />);

      // 첫 번째 서브태스크의 토글 버튼 (체크 버튼)
      const toggleBtns = screen.getAllByRole('button').filter(
        btn => !btn.textContent?.includes('서브태스크') && !btn.textContent?.includes('×')
      );
      await user.click(toggleBtns[0]);

      expect(onToggle).toHaveBeenCalledOnce();
      expect(onToggle).toHaveBeenCalledWith('todo-1', 's1');
    });
  });

  describe('서브태스크 삭제', () => {
    it('× 버튼 클릭 시 onDelete가 todoId, subtaskId와 함께 호출된다', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(<SubtaskList {...defaultProps} subtasks={subtasks} onDelete={onDelete} />);

      const deleteButtons = screen.getAllByRole('button', { name: '×' });
      await user.click(deleteButtons[0]);

      expect(onDelete).toHaveBeenCalledOnce();
      expect(onDelete).toHaveBeenCalledWith('todo-1', 's1');
    });
  });

  describe('서브태스크 추가', () => {
    it('"서브태스크 추가" 버튼 클릭 시 입력창이 나타난다', async () => {
      const user = userEvent.setup();
      render(<SubtaskList {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /서브태스크 추가/ }));

      expect(screen.getByPlaceholderText('입력 후 Enter, Esc로 닫기')).toBeInTheDocument();
    });

    it('입력 후 Enter를 누르면 onAdd가 호출된다', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      render(<SubtaskList {...defaultProps} onAdd={onAdd} />);

      await user.click(screen.getByRole('button', { name: /서브태스크 추가/ }));
      await user.type(screen.getByPlaceholderText('입력 후 Enter, Esc로 닫기'), '새 서브태스크{Enter}');

      expect(onAdd).toHaveBeenCalledOnce();
      expect(onAdd).toHaveBeenCalledWith('todo-1', '새 서브태스크');
    });

    it('Enter 후 입력창이 초기화된다', async () => {
      const user = userEvent.setup();
      render(<SubtaskList {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /서브태스크 추가/ }));
      const input = screen.getByPlaceholderText('입력 후 Enter, Esc로 닫기');
      await user.type(input, '새 서브태스크{Enter}');

      expect(input).toHaveValue('');
    });

    it('입력창에서 Escape를 누르면 입력창이 닫힌다', async () => {
      const user = userEvent.setup();
      render(<SubtaskList {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /서브태스크 추가/ }));
      await user.keyboard('{Escape}');

      expect(screen.queryByPlaceholderText('입력 후 Enter, Esc로 닫기')).not.toBeInTheDocument();
    });

    it('빈 입력으로 Enter를 눌러도 onAdd가 호출되지 않는다', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      render(<SubtaskList {...defaultProps} onAdd={onAdd} />);

      await user.click(screen.getByRole('button', { name: /서브태스크 추가/ }));
      await user.keyboard('{Enter}');

      expect(onAdd).not.toHaveBeenCalled();
    });
  });
});
