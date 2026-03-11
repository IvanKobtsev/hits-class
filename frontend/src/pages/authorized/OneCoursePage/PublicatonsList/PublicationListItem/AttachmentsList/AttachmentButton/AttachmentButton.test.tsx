import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, test, expect, describe, beforeEach } from 'vitest';
import { AttachmentButton } from './AttachmentButton';
import { downloadFile } from 'services/api/api-client/FilesClient';

vi.mock('services/api/api-client/FilesClient', () => ({
  downloadFile: vi.fn(),
}));

const mockFile = {
  uuid: 'test-uuid-123',
  fileName: 'test-file.pdf',
  size: 1024 * 1024 * 2.5,
};

const mockDataTestId = 'attachment-button-1';

function renderAttachmentButton(props = {}) {
  return render(
    <AttachmentButton
      file={mockFile}
      onError={vi.fn()}
      data-test-id={mockDataTestId}
      {...props}
    />
  );
}

describe('AttachmentButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders file name and size', () => {
    renderAttachmentButton();
    expect(screen.getByTestId(`${mockDataTestId}-name`)).toHaveTextContent('test-file.pdf');
    expect(screen.getByTestId(`${mockDataTestId}-size`)).toHaveTextContent('2.5 МБ');
  });

  test('calls downloadFile when clicked', async () => {
    const user = userEvent.setup();
    const mockDownload = vi.mocked(downloadFile);
    mockDownload.mockResolvedValue({ data: new Blob(), fileName: 'test.pdf' } as any);

    renderAttachmentButton();
    await user.click(screen.getByTestId(mockDataTestId));

    expect(mockDownload).toHaveBeenCalledWith(mockFile.uuid);
  });

  test('shows loading state while downloading', async () => {
    const user = userEvent.setup();
    const mockDownload = vi.mocked(downloadFile);
    mockDownload.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return { data: new Blob(), fileName: 'test.pdf' } as any;
    });

    renderAttachmentButton();
    
    const button = screen.getByTestId(mockDataTestId);
    await user.click(button);
    
    expect(screen.getByTestId(`${mockDataTestId}-progress`)).toBeInTheDocument();
    expect(button).toBeDisabled();
    
    await waitFor(() => {
      expect(screen.queryByTestId(`${mockDataTestId}-progress`)).not.toBeInTheDocument();
    });
  });

  test('calls onError when download fails', async () => {
    const user = userEvent.setup();
    const mockOnError = vi.fn();
    const mockDownload = vi.mocked(downloadFile);
    mockDownload.mockRejectedValue(new Error('Network error'));

    renderAttachmentButton({ onError: mockOnError });
    await user.click(screen.getByTestId(mockDataTestId));

    expect(mockOnError).toHaveBeenCalledWith('Не удалось скачать файл. Попробуйте позже.');
  });

  test('prevents multiple downloads while loading', async () => {
    const user = userEvent.setup();
    const mockDownload = vi.mocked(downloadFile);
    mockDownload.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return { data: new Blob(), fileName: 'test.pdf' } as any;
    });

    renderAttachmentButton();
    
    const button = screen.getByTestId(mockDataTestId);
    await user.click(button);
    await user.click(button);
    
    expect(mockDownload).toHaveBeenCalledTimes(1);
  });
});