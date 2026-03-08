import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, describe } from 'vitest';
import { CreateSubmissionPanel } from './CreateSubmissionPanel';

describe('CreateSubmissionPanel', () => {
  // --- Rendering ---

  test('renders panel with create-submission-panel test id', () => {
    render(<CreateSubmissionPanel />);

    expect(screen.getByTestId('create-submission-panel')).toBeInTheDocument();
  });

  test('renders dropdown trigger "Add or create"', () => {
    render(<CreateSubmissionPanel />);

    expect(
      screen.getByRole('button', { name: /add or create/i }),
    ).toBeInTheDocument();
  });

  test('dropdown is closed by default', () => {
    render(<CreateSubmissionPanel />);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  // --- Dropdown options (only file and link) ---

  test('opens dropdown with two options: attach file and attach link when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<CreateSubmissionPanel />);

    await user.click(screen.getByRole('button', { name: /add or create/i }));

    expect(
      screen.getByRole('menuitem', { name: /attach file|file/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /attach link|link/i }),
    ).toBeInTheDocument();
    const menuItems = screen.getAllByRole('menuitem');
    expect(menuItems).toHaveLength(2);
  });

  // --- Choosing "attach file" ---

  test('shows file attachment area when user selects "attach file"', async () => {
    const user = userEvent.setup();
    render(<CreateSubmissionPanel />);

    await user.click(screen.getByRole('button', { name: /add or create/i }));
    await user.click(
      screen.getByRole('menuitem', { name: /attach file|file/i }),
    );

    expect(
      screen.getByTestId('create-submission-file-input'),
    ).toBeInTheDocument();
  });

  // --- Choosing "attach link" ---

  test('shows link input when user selects "attach link"', async () => {
    const user = userEvent.setup();
    render(<CreateSubmissionPanel />);

    await user.click(screen.getByRole('button', { name: /add or create/i }));
    await user.click(
      screen.getByRole('menuitem', { name: /attach link|link/i }),
    );

    expect(
      screen.getByTestId('create-submission-link-input'),
    ).toBeInTheDocument();
  });
});
