import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import LoginPage from '@/app/login/page';

const mockReplace = vi.fn();
const mockSignInWithGoogle = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/contexts/AuthContext';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    loading: false,
    signInWithGoogle: mockSignInWithGoogle,
    signInWithApple: vi.fn(),
    signOut: vi.fn(),
    deleteAccount: vi.fn(),
  });
});

describe('LoginPage', () => {
  describe('로딩 상태', () => {
    it('loading이 true일 때 스피너를 표시한다', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: true,
        signInWithGoogle: mockSignInWithGoogle,
        signInWithApple: vi.fn(),
        signOut: vi.fn(),
        deleteAccount: vi.fn(),
      });
      const { container } = render(<LoginPage />);

      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('loading이 true일 때 로그인 버튼을 표시하지 않는다', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: true,
        signInWithGoogle: mockSignInWithGoogle,
        signInWithApple: vi.fn(),
        signOut: vi.fn(),
        deleteAccount: vi.fn(),
      });
      render(<LoginPage />);

      expect(screen.queryByRole('button', { name: /Google/ })).not.toBeInTheDocument();
    });
  });

  describe('비로그인 상태', () => {
    it('"Google로 계속하기" 버튼이 표시된다', () => {
      render(<LoginPage />);

      const buttons = screen.getAllByRole('button', { name: /Google로 계속하기/ });
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });

    it('로그인 버튼 클릭 시 signInWithGoogle이 호출된다', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const buttons = screen.getAllByRole('button', { name: /Google로 계속하기/ });
      await user.click(buttons[0]);

      expect(mockSignInWithGoogle).toHaveBeenCalledOnce();
    });

    it('동기화 안내 문구가 표시된다', () => {
      render(<LoginPage />);

      const elements = screen.getAllByText(/모든 기기/);
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('로그인 상태', () => {
    it('이미 로그인된 경우 홈으로 리다이렉트한다', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { uid: 'u1', email: 'test@test.com' } as any,
        loading: false,
        signInWithGoogle: mockSignInWithGoogle,
        signInWithApple: vi.fn(),
        signOut: vi.fn(),
        deleteAccount: vi.fn(),
      });

      vi.stubGlobal('location', { pathname: '/login', href: 'http://localhost/login' });

      render(<LoginPage />);

      expect(mockReplace).toHaveBeenCalledWith('/');

      vi.unstubAllGlobals();
    });
  });
});
