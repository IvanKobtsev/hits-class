import React, { useState, useCallback } from 'react';
import { Button } from '@mui/material';
import { useUploadFileMutation } from 'services/api/api-client/FilesQuery';
import {
  AttachedFilesTable,
  type AttachedFileItem,
} from './AttachedFilesTable/AttachedFilesTable';

const MAX_FILE_SIZE_BYTES = 400 * 1024 * 1024;

function makeId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const AddAttachmentPanel: React.FC = () => {
  const [files, setFiles] = useState<AttachedFileItem[]>([]);
  const { mutate: uploadFile } = useUploadFileMutation();

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (!selectedFiles?.length) return;
      const next: AttachedFileItem[] = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const id = makeId();
        const status: AttachedFileItem['status'] =
          file.size > MAX_FILE_SIZE_BYTES ? 'too_large' : 'uploading';
        next.push({
          id,
          name: file.name,
          size: file.size,
          status,
          progress: status === 'uploading' ? 0 : undefined,
        });
        if (status === 'uploading') {
          uploadFile(
            { file: { data: file, fileName: file.name } },
            {
              onSuccess: () => {
                setFiles((prev) =>
                  prev.map((f) => (f.id === id ? { ...f, status: 'uploaded' as const } : f)),
                );
              },
              onError: () => {
                setFiles((prev) =>
                  prev.map((f) => (f.id === id ? { ...f, status: 'error' as const } : f)),
                );
              },
            },
          );
        }
      }
      setFiles((prev) => [...prev, ...next]);
      e.target.value = '';
    },
    [uploadFile],
  );

  const handleRemove = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return (
    <div data-test-id="add-attachment-panel">
      <AttachedFilesTable files={files} onRemove={handleRemove} />
      <input
        type="file"
        multiple
        data-test-id="add-attachment-file-input"
        onChange={handleFileInputChange}
        style={{ display: 'block', marginTop: 8 }}
      />
      <Button variant="contained" sx={{ mt: 2 }} aria-label="Submit">
        Submit
      </Button>
    </div>
  );
};
