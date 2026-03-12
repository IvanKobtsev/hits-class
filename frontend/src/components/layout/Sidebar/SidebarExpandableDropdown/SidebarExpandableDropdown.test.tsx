import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect, describe } from 'vitest';
import { SidebarExpandableDropdown } from './SidebarExpandableDropdown';

const MockIcon = () => (
  <svg data-test-id="sidebar-expandable-dropdown-icon" />
);

const defaultProps = {
  title: 'My Courses',
  icon: MockIcon,
  onClick: vi.fn(),
  isExpandedVertically: true,
  isExpandedHorizontally: true,
};

function renderDropdown(props = defaultProps) {
  return render(
    <SidebarExpandableDropdown {...props}>
      <li>Course 1</li>
      <li>Course 2</li>
    </SidebarExpandableDropdown>,
  );
}

describe('SidebarExpandableDropdown', () => {
  // --- Icon ---

  test('displays the icon when expanded both ways', () => {
    renderDropdown();

    expect(
      screen.getByTestId('sidebar-expandable-dropdown-icon'),
    ).toBeInTheDocument();
  });

  test('displays the icon when collapsed both ways', () => {
    renderDropdown({
      ...defaultProps,
      isExpandedVertically: false,
      isExpandedHorizontally: false,
    });

    expect(
      screen.getByTestId('sidebar-expandable-dropdown-icon'),
    ).toBeInTheDocument();
  });

  // --- Title (horizontal expansion) ---

  test('displays the title when isExpandedHorizontally is true', () => {
    renderDropdown();

    expect(
      screen.getByTestId('sidebar-expandable-dropdown-title'),
    ).toHaveTextContent('My Courses');
  });

  test('does not display the title when isExpandedHorizontally is false', () => {
    renderDropdown({ ...defaultProps, isExpandedHorizontally: false });

    expect(
      screen.queryByTestId('sidebar-expandable-dropdown-title'),
    ).not.toBeInTheDocument();
  });

  // --- Children (vertical expansion) ---

  test('displays children when expanded both ways', () => {
    renderDropdown();

    expect(screen.getByText('Course 1')).toBeInTheDocument();
    expect(screen.getByText('Course 2')).toBeInTheDocument();
  });

  test('does not display children when isExpandedVertically is false', () => {
    renderDropdown({ ...defaultProps, isExpandedVertically: false });

    expect(screen.queryByText('Course 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Course 2')).not.toBeInTheDocument();
  });

  test('does not display children when isExpandedHorizontally is false', () => {
    renderDropdown({ ...defaultProps, isExpandedHorizontally: false });

    expect(screen.queryByText('Course 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Course 2')).not.toBeInTheDocument();
  });

  test('preserves vertical expansion state when horizontal expansion changes', () => {
    const { rerender } = renderDropdown({
      ...defaultProps,
      isExpandedVertically: true,
      isExpandedHorizontally: true,
    });

    rerender(
      <SidebarExpandableDropdown
        {...defaultProps}
        isExpandedVertically={true}
        isExpandedHorizontally={false}
      >
        <li>Course 1</li>
        <li>Course 2</li>
      </SidebarExpandableDropdown>,
    );

    rerender(
      <SidebarExpandableDropdown
        {...defaultProps}
        isExpandedVertically={true}
        isExpandedHorizontally={true}
      >
        <li>Course 1</li>
        <li>Course 2</li>
      </SidebarExpandableDropdown>,
    );

    expect(screen.getByText('Course 1')).toBeInTheDocument();
    expect(screen.getByText('Course 2')).toBeInTheDocument();
  });

  // --- Empty state ---

  test('displays "-- No courses --" when no children and expanded both ways', () => {
    render(
      <SidebarExpandableDropdown {...defaultProps}>
      </SidebarExpandableDropdown>,
    );

    expect(screen.getByText('-- No courses --')).toBeInTheDocument();
  });

  test('"-- No courses --" has the noCourses style class applied', () => {
    render(
      <SidebarExpandableDropdown {...defaultProps}>
      </SidebarExpandableDropdown>,
    );

    const el = screen.getByText('-- No courses --');
    expect(el.className).toMatch(/noCourses/);
  });

  test('does not display "-- No courses --" when children are present', () => {
    renderDropdown();

    expect(screen.queryByText('-- No courses --')).not.toBeInTheDocument();
  });

  test('displays "-- No courses --" when children is an empty array', () => {
    render(
      <SidebarExpandableDropdown {...defaultProps}>
        {[]}
      </SidebarExpandableDropdown>,
    );

    expect(screen.getByText('-- No courses --')).toBeInTheDocument();
  });

  test('does not display "-- No courses --" when collapsed vertically', () => {
    render(
      <SidebarExpandableDropdown {...defaultProps} isExpandedVertically={false}>
      </SidebarExpandableDropdown>,
    );

    expect(screen.queryByText('-- No courses --')).not.toBeInTheDocument();
  });

  // --- Click ---

  test('calls onClick when the header is clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderDropdown({ ...defaultProps, onClick });

    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledOnce();
  });
});
