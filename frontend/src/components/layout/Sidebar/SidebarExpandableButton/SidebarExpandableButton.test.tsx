import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect, describe } from 'vitest';
import { SidebarExpandableButton } from './SidebarExpandableButton';

const MockIcon = () => (
  <svg data-test-id="sidebar-expandable-button-icon" />
);

const defaultProps = {
  title: 'My Courses',
  icon: MockIcon,
  onClick: vi.fn(),
  isExpanded: true,
};

function renderButton(props = defaultProps) {
  return render(<SidebarExpandableButton {...props} />);
}

describe('SidebarExpandableButton', () => {
  // --- Expanded ---

  test('displays the icon when expanded', () => {
    renderButton();

    expect(
      screen.getByTestId('sidebar-expandable-button-icon'),
    ).toBeInTheDocument();
  });

  test('displays the title when expanded', () => {
    renderButton();

    expect(screen.getByTestId('sidebar-expandable-button-title')).toHaveTextContent(
      'My Courses',
    );
  });

  // --- Collapsed ---

  test('displays the icon when collapsed', () => {
    renderButton({ ...defaultProps, isExpanded: false });

    expect(
      screen.getByTestId('sidebar-expandable-button-icon'),
    ).toBeInTheDocument();
  });

  test('does not display the title when collapsed', () => {
    renderButton({ ...defaultProps, isExpanded: false });

    expect(
      screen.queryByTestId('sidebar-expandable-button-title'),
    ).not.toBeInTheDocument();
  });

  // --- Click ---

  test('calls onClick when the button is clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderButton({ ...defaultProps, onClick });

    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledOnce();
  });
});
