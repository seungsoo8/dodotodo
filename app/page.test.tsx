import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import Home from '@/app/page';

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}));

vi.mock('@/hooks/useFirebaseAuth', () => ({
  useFirebaseAuth: vi.fn(),
}));

vi.mock('@/lib/onboarding', () => ({
  isOnboardingDone: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('@/app/login/page', () => ({
  default: () => <div data-testid="login-page">로그인 페이지</div>,
}));

vi.mock('@/components/AuthenticatedHome', () => ({
  default: ({ firebaseUser }: { firebaseUser: { uid: string } }) => (
    <div data-testid="authenticated-home">인증된 홈 (uid: {firebaseUser.uid})</div>
  ),
}));

import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Home (page.tsx) 라우팅 테스트', () => {
  describe('미인증 상태', () => {
    it('authReady이고 유저가 없으면 로그인 페이지를 표시한다', () => {
      vi.mocked(useFirebaseAuth).mockReturnValue({
        firebaseUser: null,
        authReady: true,
      });

      render(<Home />);

      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    it('authReady가 false이면 로딩 화면을 표시한다', () => {
      vi.mocked(useFirebaseAuth).mockReturnValue({
        firebaseUser: null,
        authReady: false,
      });

      const { container } = render(<Home />);

      // 로딩 화면에는 로딩 dot이 있음
      expect(container.querySelector('.rounded-full')).toBeInTheDocument();
      expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
      expect(screen.queryByTestId('authenticated-home')).not.toBeInTheDocument();
    });
  });

  describe('인증 상태', () => {
    it('authReady이고 유저가 있으면 AuthenticatedHome을 표시한다', () => {
      vi.mocked(useFirebaseAuth).mockReturnValue({
        firebaseUser: { uid: 'user-123', email: 'test@test.com' } as any,
        authReady: true,
      });

      render(<Home />);

      expect(screen.getByTestId('authenticated-home')).toBeInTheDocument();
      expect(screen.getByText(/uid: user-123/)).toBeInTheDocument();
    });

    it('AuthenticatedHome이 표시되면 로그인 페이지는 표시되지 않는다', () => {
      vi.mocked(useFirebaseAuth).mockReturnValue({
        firebaseUser: { uid: 'user-456' } as any,
        authReady: true,
      });

      render(<Home />);

      expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
    });
  });
});
