import { render, screen } from '@testing-library/react';
import { test, expect, describe } from 'vitest';
import { Avatar } from './Avatar';
import { UserDto } from 'services/api/api-client.types';

const mockUser: UserDto = {
  id: '1',
  email: 'john@example.com',
  legalName: 'John Doe',
  groupNumber: null,
};

describe('Avatar', () => {
  // --- Rendering ---

  test('renders N/A avatar when no user is provided', () => {
    render(<Avatar />);

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  test('renders initials when user is provided', () => {
    render(<Avatar user={mockUser} />);

    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  // --- Initials ---

  test('shows first and last name initials for a two-part name', () => {
    render(<Avatar user={mockUser} />);

    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  test('shows only first initial for a single-word name', () => {
    render(<Avatar user={{ ...mockUser, legalName: 'John' }} />);

    expect(screen.getByText('J')).toBeInTheDocument();
  });

  test('uses first and last name initials for a three-part name', () => {
    render(<Avatar user={{ ...mockUser, legalName: 'John Michael Doe' }} />);

    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  test('uppercases initials from a lowercase name', () => {
    render(<Avatar user={{ ...mockUser, legalName: 'john doe' }} />);

    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  test('shows N/A when legalName is null', () => {
    // @ts-expect-error testing runtime null value
    render(<Avatar user={{ ...mockUser, legalName: null }} />);

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  // --- Color ---

  test('sets data-color based on char code of first letter of legalName', () => {
    // 'J'.charCodeAt(0) = 74, 74 % 7 = 4
    render(<Avatar user={mockUser} />);

    expect(screen.getByText('JD')).toHaveAttribute('data-color', '4');
  });

  test('sets a different data-color for a different first letter', () => {
    // 'A'.charCodeAt(0) = 65, 65 % 7 = 2
    render(<Avatar user={{ ...mockUser, legalName: 'Alice Smith' }} />);

    expect(screen.getByText('AS')).toHaveAttribute('data-color', '2');
  });

  test('sets data-color="6" when legalName is null (fallback to "a")', () => {
    // 'a'.charCodeAt(0) = 97, 97 % 7 = 6
    // @ts-expect-error testing runtime null value
    render(<Avatar user={{ ...mockUser, legalName: null }} />);

    expect(screen.getByText('N/A')).toHaveAttribute('data-color', '6');
  });
});
