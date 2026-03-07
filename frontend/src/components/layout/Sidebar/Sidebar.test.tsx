import { render, screen } from '@testing-library/react';
import { vi, test, expect, describe, beforeEach } from 'vitest';
import { Sidebar } from './Sidebar';

vi.mock('./SidebarContext', () => ({
  useSidebar: vi.fn(),
}));

vi.mock(
  './SidebarExpandableDropdown/SidebarExpandableDropdown',
  () => ({
    SidebarExpandableDropdown: ({
      title,
      isExpandedHorizontally,
    }: {
      title: string;
      isExpandedHorizontally: boolean;
      [key: string]: unknown;
    }) => (isExpandedHorizontally ? <span>{title}</span> : null),
  }),
);

vi.mock(
  './SidebarExpandableButton/SidebarExpandableButton',
  () => ({
    SidebarExpandableButton: ({
      title,
      isExpanded,
    }: {
      title: string;
      isExpanded: boolean;
      [key: string]: unknown;
    }) => (isExpanded ? <span>{title}</span> : null),
  }),
);

import { useSidebar } from './SidebarContext';

const mockedUseSidebar = vi.mocked(useSidebar);

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Expanded ---

  test('shows both dropdown titles when expanded', () => {
    mockedUseSidebar.mockReturnValue({ isExpanded: true, toggle: vi.fn() });

    render(<Sidebar />);

    expect(
      screen.getByText('Курсы, на которых я обучаюсь'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Курсы, которые я преподаю'),
    ).toBeInTheDocument();
  });

  test('shows the button title when expanded', () => {
    mockedUseSidebar.mockReturnValue({ isExpanded: true, toggle: vi.fn() });

    render(<Sidebar />);

    expect(screen.getByText('Главная страница')).toBeInTheDocument();
  });

  // --- Collapsed ---

  test('hides both dropdown titles when collapsed', () => {
    mockedUseSidebar.mockReturnValue({ isExpanded: false, toggle: vi.fn() });

    render(<Sidebar />);

    expect(
      screen.queryByText('Курсы, на которых я обучаюсь'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Курсы, которые я преподаю'),
    ).not.toBeInTheDocument();
  });

  test('hides the button title when collapsed', () => {
    mockedUseSidebar.mockReturnValue({ isExpanded: false, toggle: vi.fn() });

    render(<Sidebar />);

    expect(screen.queryByText('Главная страница')).not.toBeInTheDocument();
  });
});
