import { render, screen } from '@testing-library/react';
import { vi, test, expect, describe } from 'vitest';
import { AttachmentsList } from './AttachmentsList';

const mockAttachments = [
  {
    uuid: 'abc-123',
    fileName: 'document1.pdf',
    size: 1024 * 1024,
  },
  {
    uuid: 'def-456',
    fileName: 'image.jpg',
    size: 512 * 1024,
  },
];

describe('AttachmentsList', () => {
  test('renders title with correct attachment count', () => {
    render(
      <AttachmentsList
        attachments={mockAttachments}
        onError={vi.fn()}
      />
    );
    
    expect(screen.getByText('Прикрепленные файлы (2):')).toBeInTheDocument();
  });

  test('renders all attachment buttons', () => {
    render(
      <AttachmentsList
        attachments={mockAttachments}
        onError={vi.fn()}
      />
    );
    
    expect(screen.getByText('document1.pdf')).toBeInTheDocument();
    expect(screen.getByText('image.jpg')).toBeInTheDocument();
  });

  test('renders nothing when attachments array is empty', () => {
    const { container } = render(
      <AttachmentsList
        attachments={[]}
        onError={vi.fn()}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });
});