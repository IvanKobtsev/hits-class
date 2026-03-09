import React, { useState, useCallback } from 'react';
import { Button } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { useUploadFileMutation } from 'services/api/api-client/FilesQuery';
import { useCreateSubmissionMutation } from 'services/api/api-client/SubmissionQuery';
import type { FileInfoDto } from 'services/api/api-client.types';
import {
  AttachedFileItem,
  AttachedFilesTable,
} from './AttachedFilesTable/AttachedFilesTable';

const MAX_FILE_SIZE_BYTES = 400 * 1024 * 1024;

function makeId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const SubmissionPanel: React.FC = () => {
  const [searchParams] = useSearchParams();
  const assignmentIdParam = searchParams.get('assignmentId');
  const assignmentId = assignmentIdParam
    ? parseInt(assignmentIdParam, 10)
    : undefined;

  const [files, setFiles] = useState<AttachedFileItem[]>([]);
  const [uploadedFileInfos, setUploadedFileInfos] = useState<
    Record<string, FileInfoDto>
  >({});

  const { mutate: uploadFile } = useUploadFileMutation();
  const { mutate: createSubmission, isPending: isSubmitting } =
    useCreateSubmissionMutation(assignmentId ?? 0);

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
              onSuccess: (data: FileInfoDto) => {
                setFiles((prev) =>
                  prev.map((f) =>
                    f.id === id ? { ...f, status: 'uploaded' as const } : f,
                  ),
                );
                setUploadedFileInfos((prev) => ({ ...prev, [id]: data }));
              },
              onError: () => {
                setFiles((prev) =>
                  prev.map((f) =>
                    f.id === id ? { ...f, status: 'error' as const } : f,
                  ),
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
    setUploadedFileInfos((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const attachments = Object.values(uploadedFileInfos);
  const canSubmit =
    assignmentId != null &&
    !Number.isNaN(assignmentId) &&
    attachments.length > 0 &&
    !isSubmitting;

  const handleSubmit = useCallback(() => {
    if (!canSubmit || assignmentId == null) return;
    createSubmission(
      { attachments },
      {
        onSuccess: () => {
          setFiles([]);
          setUploadedFileInfos({});
        },
      },
    );
  }, [assignmentId, attachments, canSubmit, createSubmission]);

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
      <Button
        variant="contained"
        sx={{ mt: 2 }}
        aria-label="Submit"
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        Submit
      </Button>
    </div>
  );
};
