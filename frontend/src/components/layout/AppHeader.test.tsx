import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect, describe, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';

vi.mock('components/layout/SidebarContext', () => ({
  useSidebar: vi.fn(),
}));

vi.mock('services/api', () => ({
  QueryFactory: {
    UserQuery: {
      useGetCurrentUserInfoQuery: vi.fn(),
    },
  },
}));

import { useSidebar } from './SidebarContext';
import { QueryFactory } from 'services/api';
import { AppHeader } from './AppHeader';

const mockedUseSidebar = vi.mocked(useSidebar);
const mockedUseGetCurrentUserInfo = vi.mocked(
  QueryFactory.UserQuery.useGetCurrentUserInfoQuery,
);

const mockToggle = vi.fn();

function setupDefaultMocks() {
  mockedUseSidebar.mockReturnValue({ isExpanded: false, toggle: mockToggle });
  mockedUseGetCurrentUserInfo.mockReturnValue({
    data: { id: '1', username: 'John Doe' },
  } as any);
}

function mockMatchMedia(mobile: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: mobile,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function renderHeader(path = '/courses') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppHeader />
    </MemoryRouter>,
  );
}

describe('AppHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMatchMedia(false); // desktop by default
    setupDefaultMocks();
  });

  // --- Rendering ---

  test('renders header', () => {
    renderHeader();

    expect(screen.getByTestId('app-header')).toBeInTheDocument();
  });

  test('renders HitsClass button with correct text', () => {
    renderHeader();

    expect(screen.getByTestId('app-header-hitsclass-button')).toHaveTextContent(
      'HitsClass',
    );
  });

  test('HitsClass button links to /courses', () => {
    renderHeader();

    expect(screen.getByTestId('app-header-hitsclass-button')).toHaveAttribute(
      'href',
      '/courses',
    );
  });

  test('renders sidebar toggle button', () => {
    renderHeader();

    expect(screen.getByTestId('app-header-sidebar-toggle')).toBeInTheDocument();
  });

  test('renders avatar button', () => {
    renderHeader();

    expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
  });

  // --- Breadcrumbs ---

  test('shows breadcrumbs on /courses page', () => {
    renderHeader('/courses');

    expect(screen.getByTestId('app-header-breadcrumbs')).toBeInTheDocument();
  });

  test('breadcrumbs show "Courses" title on /courses page', () => {
    renderHeader('/courses');

    expect(screen.getByTestId('app-header-breadcrumbs')).toHaveTextContent(
      'Courses',
    );
  });

  test('shows breadcrumbs on non-courses pages on desktop', () => {
    renderHeader('/course/1');

    expect(screen.getByTestId('app-header-breadcrumbs')).toBeInTheDocument();
  });

  // --- Sidebar toggle ---

  test('calls sidebar toggle when toggle button is clicked', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByTestId('app-header-sidebar-toggle'));

    expect(mockToggle).toHaveBeenCalledOnce();
  });

  test('toggle button has aria-expanded="false" when sidebar is collapsed', () => {
    mockedUseSidebar.mockReturnValue({ isExpanded: false, toggle: mockToggle });
    renderHeader();

    expect(screen.getByTestId('app-header-sidebar-toggle')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  test('toggle button has aria-expanded="true" when sidebar is expanded', () => {
    mockedUseSidebar.mockReturnValue({ isExpanded: true, toggle: mockToggle });
    renderHeader();

    expect(screen.getByTestId('app-header-sidebar-toggle')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  // --- Mobile behavior ---

  describe('on small screens', () => {
    beforeEach(() => {
      mockMatchMedia(true);
    });

    test('hides breadcrumbs when not on /courses page', () => {
      renderHeader('/course/1');

      expect(
        screen.queryByTestId('app-header-breadcrumbs'),
      ).not.toBeInTheDocument();
    });

    test('shows breadcrumbs when on /courses page', () => {
      renderHeader('/courses');

      expect(screen.getByTestId('app-header-breadcrumbs')).toBeInTheDocument();
    });

    test('hides avatar button when not on /courses page', () => {
      renderHeader('/course/1');

      expect(screen.queryByTestId('app-header-avatar')).not.toBeInTheDocument();
    });

    test('shows avatar button when on /courses page', () => {
      renderHeader('/courses');

      expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
    });
  });
});
