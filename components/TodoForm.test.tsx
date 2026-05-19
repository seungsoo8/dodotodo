import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import TodoForm from '@/components/TodoForm';
import { Todo } from '@/types/todo';

const mockTodo: Todo = {
  id: 'todo-1',
  title: '기존 할 일',
  description: '기존 설명',
  completed: false,
  priority: 'high',
  urgency: 'urgent',
  dueDate: '2026-12-31',
  category: '업무',
  recurring: 'none',
  subtasks: [],
  pomodoroCount: 0,
  createdAt: new Date().toISOString(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TodoForm', () => {
  describe('렌더링', () => {
    it('빈 폼으로 렌더링된다', () => {
      render(<TodoForm onSubmit={vi.fn()} />);

      expect(screen.getByPlaceholderText('할 일을 입력하세요...')).toHaveValue('');
      expect(screen.getByPlaceholderText('설명 (선택사항)')).toHaveValue('');
      expect(screen.getByRole('button', { name: '추가' })).toBeInTheDocument();
    });

    it('initialData가 있으면 해당 값으로 채워진다', () => {
      render(<TodoForm onSubmit={vi.fn()} initialData={mockTodo} />);

      expect(screen.getByPlaceholderText('할 일을 입력하세요...')).toHaveValue('기존 할 일');
      expect(screen.getByPlaceholderText('설명 (선택사항)')).toHaveValue('기존 설명');
      expect(screen.getByRole('button', { name: '수정' })).toBeInTheDocument();
    });

    it('우선순위 버튼 3개가 렌더링된다', () => {
      render(<TodoForm onSubmit={vi.fn()} />);

      expect(screen.getByRole('button', { name: '높음' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '보통' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '낮음' })).toBeInTheDocument();
    });

    it('카테고리 select에 기본 옵션이 포함된다', () => {
      render(<TodoForm onSubmit={vi.fn()} />);

      // 카테고리 combobox는 첫 번째 select
      const selects = screen.getAllByRole('combobox');
      expect(selects[0]).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '업무' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '개인' })).toBeInTheDocument();
    });

    it('반복 select에 기본 옵션이 포함된다', () => {
      render(<TodoForm onSubmit={vi.fn()} />);

      expect(screen.getByRole('option', { name: '없음' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '매일' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '매주' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '매월' })).toBeInTheDocument();
    });

    it('onCancel이 있을 때 취소 버튼이 렌더링된다', () => {
      render(<TodoForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

      expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument();
    });

    it('onCancel이 없으면 취소 버튼이 없다', () => {
      render(<TodoForm onSubmit={vi.fn()} />);

      expect(screen.queryByRole('button', { name: '취소' })).not.toBeInTheDocument();
    });
  });

  describe('유효성 검사', () => {
    it('제목이 비어있으면 추가 버튼이 비활성화된다', () => {
      render(<TodoForm onSubmit={vi.fn()} />);

      expect(screen.getByRole('button', { name: '추가' })).toBeDisabled();
    });

    it('제목을 입력하면 추가 버튼이 활성화된다', async () => {
      const user = userEvent.setup();
      render(<TodoForm onSubmit={vi.fn()} />);

      await user.type(screen.getByPlaceholderText('할 일을 입력하세요...'), '새 할 일');

      expect(screen.getByRole('button', { name: '추가' })).toBeEnabled();
    });

    it('공백만 입력하면 추가 버튼이 비활성화 상태를 유지한다', async () => {
      const user = userEvent.setup();
      render(<TodoForm onSubmit={vi.fn()} />);

      await user.type(screen.getByPlaceholderText('할 일을 입력하세요...'), '   ');

      expect(screen.getByRole('button', { name: '추가' })).toBeDisabled();
    });
  });

  describe('제출(onSubmit)', () => {
    it('제목과 기본 우선순위로 onSubmit을 호출한다', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<TodoForm onSubmit={onSubmit} />);

      await user.type(screen.getByPlaceholderText('할 일을 입력하세요...'), '새 할 일');
      await user.click(screen.getByRole('button', { name: '추가' }));

      expect(onSubmit).toHaveBeenCalledOnce();
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ title: '새 할 일', priority: 'medium' })
      );
    });

    it('설명, 카테고리도 함께 전달한다', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<TodoForm onSubmit={onSubmit} />);

      await user.type(screen.getByPlaceholderText('할 일을 입력하세요...'), '상세 할 일');
      await user.type(screen.getByPlaceholderText('설명 (선택사항)'), '설명 내용');
      const [categorySelect] = screen.getAllByRole('combobox');
      await user.selectOptions(categorySelect, '업무');
      await user.click(screen.getByRole('button', { name: '추가' }));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '상세 할 일',
          description: '설명 내용',
          category: '업무',
        })
      );
    });

    it('제목 앞뒤 공백을 trim해서 전달한다', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<TodoForm onSubmit={onSubmit} />);

      await user.type(screen.getByPlaceholderText('할 일을 입력하세요...'), '  공백 제목  ');
      await user.click(screen.getByRole('button', { name: '추가' }));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ title: '공백 제목' })
      );
    });

    it('설명이 비어있으면 undefined로 전달한다', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<TodoForm onSubmit={onSubmit} />);

      await user.type(screen.getByPlaceholderText('할 일을 입력하세요...'), '할 일');
      await user.click(screen.getByRole('button', { name: '추가' }));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ description: undefined })
      );
    });

    it('신규 추가 후 폼이 초기화된다', async () => {
      const user = userEvent.setup();
      render(<TodoForm onSubmit={vi.fn()} />);

      const titleInput = screen.getByPlaceholderText('할 일을 입력하세요...');
      await user.type(titleInput, '임시 할 일');
      await user.click(screen.getByRole('button', { name: '추가' }));

      expect(titleInput).toHaveValue('');
    });

    it('수정 모드(initialData)에서는 폼이 초기화되지 않는다', async () => {
      const user = userEvent.setup();
      render(<TodoForm onSubmit={vi.fn()} initialData={mockTodo} />);

      await user.click(screen.getByRole('button', { name: '수정' }));

      expect(screen.getByPlaceholderText('할 일을 입력하세요...')).toHaveValue('기존 할 일');
    });
  });

  describe('우선순위 선택', () => {
    it('높음 우선순위를 선택하면 onSubmit에 high가 전달된다', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<TodoForm onSubmit={onSubmit} />);

      await user.click(screen.getByRole('button', { name: '높음' }));
      await user.type(screen.getByPlaceholderText('할 일을 입력하세요...'), '중요한 일');
      await user.click(screen.getByRole('button', { name: '추가' }));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ priority: 'high' })
      );
    });

    it('낮음 우선순위를 선택하면 onSubmit에 low가 전달된다', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<TodoForm onSubmit={onSubmit} />);

      await user.click(screen.getByRole('button', { name: '낮음' }));
      await user.type(screen.getByPlaceholderText('할 일을 입력하세요...'), '여유 있는 일');
      await user.click(screen.getByRole('button', { name: '추가' }));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ priority: 'low' })
      );
    });
  });

  describe('반복 설정', () => {
    it('반복 옵션을 선택하면 onSubmit에 전달된다', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<TodoForm onSubmit={onSubmit} />);

      const [, recurringSelect] = screen.getAllByRole('combobox');
      await user.selectOptions(recurringSelect, 'weekly');
      await user.type(screen.getByPlaceholderText('할 일을 입력하세요...'), '주간 미팅');
      await user.click(screen.getByRole('button', { name: '추가' }));

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ recurring: 'weekly' })
      );
    });
  });

  describe('취소(onCancel)', () => {
    it('취소 버튼 클릭 시 onCancel이 호출된다', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(<TodoForm onSubmit={vi.fn()} onCancel={onCancel} />);

      await user.click(screen.getByRole('button', { name: '취소' }));

      expect(onCancel).toHaveBeenCalledOnce();
    });
  });
});
