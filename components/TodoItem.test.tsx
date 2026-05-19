import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import TodoItem from '@/components/TodoItem';
import { Todo } from '@/types/todo';

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}));

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const baseTodo: Todo = {
  id: 'todo-1',
  title: '테스트 할 일',
  completed: false,
  priority: 'medium',
  urgency: 'not-urgent',
  recurring: 'none',
  subtasks: [],
  pomodoroCount: 0,
  createdAt: new Date().toISOString(),
};

const defaultProps = {
  todo: baseTodo,
  onToggle: vi.fn(),
  onUpdate: vi.fn(),
  onDelete: vi.fn(),
  onAddSubtask: vi.fn(),
  onToggleSubtask: vi.fn(),
  onDeleteSubtask: vi.fn(),
  compact: true,
};

function getToggleBtn(container: HTMLElement) {
  // compact 모드: 첫 번째 버튼이 토글(체크박스) 버튼
  return container.querySelectorAll('button')[0] as HTMLButtonElement;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TodoItem', () => {
  describe('렌더링', () => {
    it('제목을 표시한다', () => {
      render(<TodoItem {...defaultProps} />);

      expect(screen.getByText('테스트 할 일')).toBeInTheDocument();
    });

    it('설명이 있으면 표시한다', () => {
      const todo = { ...baseTodo, description: '상세 설명입니다' };
      render(<TodoItem {...defaultProps} todo={todo} />);

      expect(screen.getByText('상세 설명입니다')).toBeInTheDocument();
    });

    it('설명이 없으면 표시하지 않는다', () => {
      render(<TodoItem {...defaultProps} />);

      expect(screen.queryByText('상세 설명입니다')).not.toBeInTheDocument();
    });

    it('카테고리가 있으면 표시한다', () => {
      const todo = { ...baseTodo, category: '업무' };
      render(<TodoItem {...defaultProps} todo={todo} />);

      expect(screen.getByText('업무')).toBeInTheDocument();
    });

    it('카테고리가 없으면 표시하지 않는다', () => {
      render(<TodoItem {...defaultProps} />);

      expect(screen.queryByText('업무')).not.toBeInTheDocument();
    });

    it('반복 설정이 있으면 "반복" 배지를 표시한다', () => {
      const todo = { ...baseTodo, recurring: 'weekly' as const };
      render(<TodoItem {...defaultProps} todo={todo} />);

      expect(screen.getByText('반복')).toBeInTheDocument();
    });

    it('포모도로 횟수가 있으면 표시한다', () => {
      const todo = { ...baseTodo, pomodoroCount: 3 };
      render(<TodoItem {...defaultProps} todo={todo} />);

      expect(screen.getByText('🍅 3')).toBeInTheDocument();
    });
  });

  describe('우선순위 배지', () => {
    it("'high' 우선순위일 때 '높음' 배지를 표시한다", () => {
      const todo = { ...baseTodo, priority: 'high' as const };
      render(<TodoItem {...defaultProps} todo={todo} />);

      expect(screen.getByText('높음')).toBeInTheDocument();
    });

    it("'medium' 우선순위일 때 '보통' 배지를 표시한다", () => {
      render(<TodoItem {...defaultProps} />);

      expect(screen.getByText('보통')).toBeInTheDocument();
    });

    it("'low' 우선순위일 때 '낮음' 배지를 표시한다", () => {
      const todo = { ...baseTodo, priority: 'low' as const };
      render(<TodoItem {...defaultProps} todo={todo} />);

      expect(screen.getByText('낮음')).toBeInTheDocument();
    });
  });

  describe('마감일', () => {
    it('내일 마감일은 "내일"로 표시한다', () => {
      const todo = { ...baseTodo, dueDate: toDateStr(tomorrow) };
      render(<TodoItem {...defaultProps} todo={todo} />);

      expect(screen.getByText('내일')).toBeInTheDocument();
    });

    it('오늘 마감일은 "오늘"로 표시한다', () => {
      const todo = { ...baseTodo, dueDate: toDateStr(today) };
      render(<TodoItem {...defaultProps} todo={todo} />);

      expect(screen.getByText('오늘')).toBeInTheDocument();
    });

    it('지난 마감일은 "N일 지남"으로 표시한다', () => {
      const todo = { ...baseTodo, dueDate: toDateStr(yesterday) };
      render(<TodoItem {...defaultProps} todo={todo} />);

      expect(screen.getByText(/1일 지남/)).toBeInTheDocument();
    });

    it('마감일이 없으면 날짜를 표시하지 않는다', () => {
      render(<TodoItem {...defaultProps} />);

      expect(screen.queryByText('오늘')).not.toBeInTheDocument();
      expect(screen.queryByText('내일')).not.toBeInTheDocument();
    });
  });

  describe('완료 토글', () => {
    it('토글 버튼 클릭 시 onToggle이 todo.id와 함께 호출된다', () => {
      const onToggle = vi.fn();
      const { container } = render(<TodoItem {...defaultProps} onToggle={onToggle} />);

      fireEvent.click(getToggleBtn(container));

      expect(onToggle).toHaveBeenCalledOnce();
      expect(onToggle).toHaveBeenCalledWith('todo-1');
    });

    it('완료된 할 일은 제목에 line-through 스타일이 적용된다', () => {
      const todo = { ...baseTodo, completed: true };
      render(<TodoItem {...defaultProps} todo={todo} />);

      const title = screen.getByText('테스트 할 일');
      expect(title).toHaveStyle('text-decoration: line-through');
    });

    it('미완료 할 일은 제목에 line-through 스타일이 없다', () => {
      render(<TodoItem {...defaultProps} />);

      const title = screen.getByText('테스트 할 일');
      expect(title).not.toHaveClass('line-through');
    });
  });

  describe('수정 기능', () => {
    it('수정 버튼 클릭 시 TodoForm이 표시된다', async () => {
      const user = userEvent.setup();
      render(<TodoItem {...defaultProps} />);

      await user.click(screen.getByTitle('수정'));

      expect(screen.getByPlaceholderText('할 일을 입력하세요...')).toBeInTheDocument();
    });

    it('수정 폼에서 취소 시 원래 보기로 돌아간다', async () => {
      const user = userEvent.setup();
      render(<TodoItem {...defaultProps} />);

      await user.click(screen.getByTitle('수정'));
      await user.click(screen.getByRole('button', { name: '취소' }));

      expect(screen.getByText('테스트 할 일')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('할 일을 입력하세요...')).not.toBeInTheDocument();
    });

    it('수정 폼 제출 시 onUpdate가 호출된다', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();
      render(<TodoItem {...defaultProps} onUpdate={onUpdate} />);

      await user.click(screen.getByTitle('수정'));
      const titleInput = screen.getByPlaceholderText('할 일을 입력하세요...');
      await user.clear(titleInput);
      await user.type(titleInput, '수정된 제목');
      await user.click(screen.getByRole('button', { name: '수정' }));

      expect(onUpdate).toHaveBeenCalledOnce();
      expect(onUpdate).toHaveBeenCalledWith(
        'todo-1',
        expect.objectContaining({ title: '수정된 제목' })
      );
    });
  });

  describe('삭제 기능', () => {
    it('삭제 아이콘 클릭 시 확인 버튼이 나타난다', async () => {
      const user = userEvent.setup();
      render(<TodoItem {...defaultProps} />);

      await user.click(screen.getByTitle('삭제'));

      expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument();
    });

    it('삭제 확인 시 onDelete가 todo.id와 함께 호출된다', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(<TodoItem {...defaultProps} onDelete={onDelete} />);

      await user.click(screen.getByTitle('삭제'));
      await user.click(screen.getByRole('button', { name: '삭제' }));

      expect(onDelete).toHaveBeenCalledOnce();
      expect(onDelete).toHaveBeenCalledWith('todo-1');
    });

    it('삭제 취소 시 onDelete가 호출되지 않는다', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(<TodoItem {...defaultProps} onDelete={onDelete} />);

      await user.click(screen.getByTitle('삭제'));
      await user.click(screen.getByRole('button', { name: '취소' }));

      expect(onDelete).not.toHaveBeenCalled();
      expect(screen.getByTitle('삭제')).toBeInTheDocument();
    });

    it('완료된 항목도 삭제 버튼이 표시된다', () => {
      const todo = { ...baseTodo, completed: true };
      render(<TodoItem {...defaultProps} todo={todo} />);

      expect(screen.getByTitle('삭제')).toBeInTheDocument();
    });
  });

  describe('기한 초과 스타일', () => {
    it('미완료 + 기한 초과 시 red 계열 border를 가진다', () => {
      const todo = { ...baseTodo, dueDate: toDateStr(yesterday), completed: false };
      const { container } = render(<TodoItem {...defaultProps} todo={todo} />);

      expect(container.querySelector('.border-red-200')).toBeInTheDocument();
    });

    it('완료된 항목은 기한이 지나도 red border가 없다', () => {
      const todo = { ...baseTodo, dueDate: toDateStr(yesterday), completed: true };
      const { container } = render(<TodoItem {...defaultProps} todo={todo} />);

      expect(container.querySelector('.border-red-200')).not.toBeInTheDocument();
    });
  });

  describe('서브태스크 토글', () => {
    it('서브태스크가 없을 때 "서브태스크" 버튼이 표시된다', () => {
      render(<TodoItem {...defaultProps} />);

      expect(screen.getByRole('button', { name: /서브태스크/ })).toBeInTheDocument();
    });

    it('서브태스크가 있을 때 완료 수/전체 수가 표시된다', () => {
      const todo = {
        ...baseTodo,
        subtasks: [
          { id: 's1', title: '서브1', completed: true },
          { id: 's2', title: '서브2', completed: false },
        ],
      };
      render(<TodoItem {...defaultProps} todo={todo} />);

      expect(screen.getByText('1/2')).toBeInTheDocument();
    });

    it('서브태스크 버튼 클릭 시 SubtaskList가 표시된다', async () => {
      const user = userEvent.setup();
      const todo = {
        ...baseTodo,
        subtasks: [{ id: 's1', title: '서브태스크 항목', completed: false }],
      };
      render(<TodoItem {...defaultProps} todo={todo} />);

      await user.click(screen.getByText('0/1'));

      expect(screen.getByText('서브태스크 항목')).toBeInTheDocument();
    });
  });
});
