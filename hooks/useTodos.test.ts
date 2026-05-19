import { renderHook, act } from '@testing-library/react';
import { useTodos } from '@/hooks/useTodos';

describe('useTodos', () => {
  describe('addTodo', () => {
    it('새 할 일을 목록 맨 앞에 추가한다', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo({ title: '장보기', priority: 'medium', urgency: 'not-urgent', recurring: 'none' });
      });

      expect(result.current.todos).toHaveLength(1);
      expect(result.current.todos[0].title).toBe('장보기');
      expect(result.current.todos[0].completed).toBe(false);
      expect(result.current.todos[0].id).toBeDefined();
      expect(result.current.todos[0].createdAt).toBeDefined();
    });

    it('여러 할 일을 추가하면 최신 항목이 맨 앞에 위치한다', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo({ title: '첫 번째', priority: 'low', urgency: 'not-urgent', recurring: 'none' });
      });
      act(() => {
        result.current.addTodo({ title: '두 번째', priority: 'high', urgency: 'not-urgent', recurring: 'none' });
      });

      expect(result.current.todos[0].title).toBe('두 번째');
      expect(result.current.todos[1].title).toBe('첫 번째');
    });

    it('선택적 필드(description, dueDate, category)를 함께 저장한다', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo({
          title: '상세 할 일',
          priority: 'high',
          urgency: 'not-urgent',
          recurring: 'none',
          description: '상세 설명',
          dueDate: '2026-12-31',
          category: '업무',
        });
      });

      const todo = result.current.todos[0];
      expect(todo.description).toBe('상세 설명');
      expect(todo.dueDate).toBe('2026-12-31');
      expect(todo.category).toBe('업무');
    });
  });

  describe('deleteTodo', () => {
    it('id로 특정 할 일을 삭제한다', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo({ title: '삭제할 항목', priority: 'medium', urgency: 'not-urgent', recurring: 'none' });
      });
      const id = result.current.todos[0].id;

      act(() => {
        result.current.deleteTodo(id);
      });

      expect(result.current.todos).toHaveLength(0);
    });

    it('특정 항목만 삭제하고 나머지는 유지한다', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo({ title: '항목 A', priority: 'low', urgency: 'not-urgent', recurring: 'none' });
      });
      act(() => {
        result.current.addTodo({ title: '항목 B', priority: 'high', urgency: 'not-urgent', recurring: 'none' });
      });
      const idA = result.current.todos[1].id; // 먼저 추가된 항목

      act(() => {
        result.current.deleteTodo(idA);
      });

      expect(result.current.todos).toHaveLength(1);
      expect(result.current.todos[0].title).toBe('항목 B');
    });
  });

  describe('toggleComplete', () => {
    it('미완료 → 완료로 토글한다', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo({ title: '토글 테스트', priority: 'medium', urgency: 'not-urgent', recurring: 'none' });
      });
      const id = result.current.todos[0].id;

      act(() => {
        result.current.toggleComplete(id);
      });

      expect(result.current.todos[0].completed).toBe(true);
    });

    it('완료 → 미완료로 다시 토글한다', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo({ title: '토글 테스트', priority: 'medium', urgency: 'not-urgent', recurring: 'none' });
      });
      const id = result.current.todos[0].id;

      act(() => { result.current.toggleComplete(id); });
      act(() => { result.current.toggleComplete(id); });

      expect(result.current.todos[0].completed).toBe(false);
    });
  });

  describe('updateTodo', () => {
    it('제목과 우선순위를 수정한다', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo({ title: '원본 제목', priority: 'low', urgency: 'not-urgent', recurring: 'none' });
      });
      const id = result.current.todos[0].id;

      act(() => {
        result.current.updateTodo(id, { title: '수정된 제목', priority: 'high' });
      });

      expect(result.current.todos[0].title).toBe('수정된 제목');
      expect(result.current.todos[0].priority).toBe('high');
    });

    it('다른 항목에는 영향을 주지 않는다', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo({ title: '항목 A', priority: 'low', urgency: 'not-urgent', recurring: 'none' });
      });
      act(() => {
        result.current.addTodo({ title: '항목 B', priority: 'medium', urgency: 'not-urgent', recurring: 'none' });
      });
      const idA = result.current.todos[1].id;

      act(() => {
        result.current.updateTodo(idA, { title: '수정된 A' });
      });

      expect(result.current.todos[0].title).toBe('항목 B');
      expect(result.current.todos[1].title).toBe('수정된 A');
    });
  });

  describe('clearCompleted', () => {
    it('완료된 항목만 제거하고 미완료 항목은 유지한다', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo({ title: '미완료', priority: 'medium', urgency: 'not-urgent', recurring: 'none' });
      });
      act(() => {
        result.current.addTodo({ title: '완료됨', priority: 'low', urgency: 'not-urgent', recurring: 'none' });
      });

      const completedId = result.current.todos[0].id; // 마지막 추가 = 맨 앞

      act(() => { result.current.toggleComplete(completedId); });
      act(() => { result.current.clearCompleted(); });

      expect(result.current.todos).toHaveLength(1);
      expect(result.current.todos[0].title).toBe('미완료');
    });

    it('완료 항목이 없으면 목록이 변하지 않는다', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo({ title: '미완료', priority: 'high', urgency: 'not-urgent', recurring: 'none' });
      });

      act(() => { result.current.clearCompleted(); });

      expect(result.current.todos).toHaveLength(1);
    });
  });

  describe('stats', () => {
    it('total, active, completed 통계를 올바르게 계산한다', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo({ title: '항목 1', priority: 'high', urgency: 'not-urgent', recurring: 'none' });
      });
      act(() => {
        result.current.addTodo({ title: '항목 2', priority: 'medium', urgency: 'not-urgent', recurring: 'none' });
      });
      act(() => {
        result.current.addTodo({ title: '항목 3', priority: 'low', urgency: 'not-urgent', recurring: 'none' });
      });

      const id = result.current.todos[0].id;
      act(() => { result.current.toggleComplete(id); });

      expect(result.current.stats.total).toBe(3);
      expect(result.current.stats.active).toBe(2);
      expect(result.current.stats.completed).toBe(1);
    });

    it('필터가 적용돼도 stats는 전체 기준으로 계산한다', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo({ title: '할 일', priority: 'high', urgency: 'not-urgent', recurring: 'none' });
      });
      act(() => {
        result.current.setFilterStatus('completed');
      });

      // 완료된 항목이 없어 todos는 빈 배열이지만 stats.total은 1
      expect(result.current.todos).toHaveLength(0);
      expect(result.current.stats.total).toBe(1);
    });
  });

  describe('검색 필터', () => {
    it('제목으로 검색한다', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo({ title: '운동하기', priority: 'high', urgency: 'not-urgent', recurring: 'none' });
        result.current.addTodo({ title: '책 읽기', priority: 'medium', urgency: 'not-urgent', recurring: 'none' });
      });

      act(() => { result.current.setSearchQuery('운동'); });

      expect(result.current.todos).toHaveLength(1);
      expect(result.current.todos[0].title).toBe('운동하기');
    });

    it('설명(description)으로도 검색한다', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo({ title: '할 일', priority: 'medium', urgency: 'not-urgent', recurring: 'none', description: '헬스장 가기' });
      });

      act(() => { result.current.setSearchQuery('헬스장'); });

      expect(result.current.todos).toHaveLength(1);
    });

    it('검색어가 없으면 전체를 반환한다', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo({ title: '항목 1', priority: 'low', urgency: 'not-urgent', recurring: 'none' });
        result.current.addTodo({ title: '항목 2', priority: 'high', urgency: 'not-urgent', recurring: 'none' });
      });

      act(() => { result.current.setSearchQuery(''); });

      expect(result.current.todos).toHaveLength(2);
    });

    it('대소문자를 구별하지 않고 검색한다', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo({ title: 'React 공부', priority: 'medium', urgency: 'not-urgent', recurring: 'none' });
      });

      act(() => { result.current.setSearchQuery('react'); });

      expect(result.current.todos).toHaveLength(1);
    });
  });

  describe('상태 필터', () => {
    it("'active' 필터는 미완료 항목만 반환한다", () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo({ title: '미완료', priority: 'medium', urgency: 'not-urgent', recurring: 'none' });
      });
      act(() => {
        result.current.addTodo({ title: '완료됨', priority: 'low', urgency: 'not-urgent', recurring: 'none' });
      });

      const completedId = result.current.todos[0].id;
      act(() => { result.current.toggleComplete(completedId); });
      act(() => { result.current.setFilterStatus('active'); });

      expect(result.current.todos).toHaveLength(1);
      expect(result.current.todos[0].title).toBe('미완료');
    });

    it("'completed' 필터는 완료 항목만 반환한다", () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo({ title: '미완료', priority: 'medium', urgency: 'not-urgent', recurring: 'none' });
      });
      act(() => {
        result.current.addTodo({ title: '완료됨', priority: 'low', urgency: 'not-urgent', recurring: 'none' });
      });

      const completedId = result.current.todos[0].id;
      act(() => { result.current.toggleComplete(completedId); });
      act(() => { result.current.setFilterStatus('completed'); });

      expect(result.current.todos).toHaveLength(1);
      expect(result.current.todos[0].title).toBe('완료됨');
    });
  });

  describe('우선순위 필터', () => {
    it("'high' 필터는 높은 우선순위 항목만 반환한다", () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo({ title: '높음', priority: 'high', urgency: 'not-urgent', recurring: 'none' });
        result.current.addTodo({ title: '보통', priority: 'medium', urgency: 'not-urgent', recurring: 'none' });
        result.current.addTodo({ title: '낮음', priority: 'low', urgency: 'not-urgent', recurring: 'none' });
      });

      act(() => { result.current.setFilterPriority('high'); });

      expect(result.current.todos).toHaveLength(1);
      expect(result.current.todos[0].title).toBe('높음');
    });
  });
});
