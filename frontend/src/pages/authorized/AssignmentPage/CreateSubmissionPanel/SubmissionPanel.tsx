import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, ButtonColor, ButtonWidth } from 'components/uikit/buttons/Button';
import { useUploadFileMutation } from 'services/api/api-client/FilesQuery';
import {
  useCreateSubmissionMutation,
  useRetractSubmissionMutation,
  useSaveDraftMutation,
  getMySubmissionQueryKey,
} from 'services/api/api-client/SubmissionQuery';
import type { FileInfoDto, SubmissionDto } from 'services/api/api-client.types';
import {
  AttachedFileItem,
  AttachedFilesTable,
} from './AttachedFilesTable/AttachedFilesTable';
import styles from './SubmissionPanel.module.scss';

const MAX_FILE_SIZE_BYTES = 400 * 1024 * 1024;

function makeId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function fileInfoToItem(f: FileInfoDto): AttachedFileItem {
  return { id: f.id, name: f.fileName, size: f.size, status: 'uploaded' };
}

function draftFilesFromSubmission(submission: SubmissionDto | undefined): AttachedFileItem[] {
  if (submission?.state === 'Draft') return submission.attachments.map(fileInfoToItem);
  return [];
}

function draftInfosFromSubmission(
  submission: SubmissionDto | undefined,
): Record<string, FileInfoDto> {
  if (submission?.state !== 'Draft') return {};
  const infos: Record<string, FileInfoDto> = {};
  submission.attachments.forEach((f) => {
    infos[f.id] = f;
  });
  return infos;
}

export type SubmissionPanelProps = {
  assignmentId?: number;
  submission?: SubmissionDto;
};

export const SubmissionPanel: React.FC<SubmissionPanelProps> = ({
  assignmentId,
  submission,
}) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-populate from Draft on mount (handles page-refresh-with-draft case)
  const [files, setFiles] = useState<AttachedFileItem[]>(() =>
    draftFilesFromSubmission(submission),
  );
  const [uploadedFileInfos, setUploadedFileInfos] = useState<Record<string, FileInfoDto>>(() =>
    draftInfosFromSubmission(submission),
  );

  const { mutate: uploadFile } = useUploadFileMutation();
  const { mutate: createSubmission, isPending: isSubmitting } =
    useCreateSubmissionMutation(assignmentId ?? 0);
  const { mutate: retractSubmission, isPending: isCancelling } =
    useRetractSubmissionMutation(assignmentId ?? 0);
  const { mutate: saveDraft } = useSaveDraftMutation(assignmentId ?? 0);

  const isFirstRender = useRef(true);

  // Auto-save draft whenever uploadedFileInfos changes (skip initial render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isSubmitted || assignmentId == null || Number.isNaN(assignmentId)) return;
    saveDraft({ attachments: Object.values(uploadedFileInfos) });
  }, [uploadedFileInfos]); // eslint-disable-line react-hooks/exhaustive-deps

  const isSubmitted = submission?.state === 'Submitted';

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
          queryClient.invalidateQueries({
            queryKey: getMySubmissionQueryKey(assignmentId),
          });
        },
      },
    );
  }, [assignmentId, attachments, canSubmit, createSubmission, queryClient]);

  const handleCancel = useCallback(() => {
    if (assignmentId == null || !submission) return;
    const previousAttachments = submission.attachments;
    retractSubmission(undefined, {
      onSuccess: () => {
        const restoredFiles: AttachedFileItem[] = previousAttachments.map(fileInfoToItem);
        const restoredInfos: Record<string, FileInfoDto> = {};
        previousAttachments.forEach((f) => {
          restoredInfos[f.id] = f;
        });
        setFiles(restoredFiles);
        setUploadedFileInfos(restoredInfos);
        queryClient.invalidateQueries({
          queryKey: getMySubmissionQueryKey(assignmentId),
        });
      },
    });
  }, [assignmentId, retractSubmission, queryClient, submission]);

  if (isSubmitted) {
    const submittedFiles = submission!.attachments.map(fileInfoToItem);
    return (
      <div className={styles.panel} data-test-id="add-attachment-panel">
        <div className={styles.header}>Ваша работа</div>
        <div className={styles.body}>
          <AttachedFilesTable files={submittedFiles} />
        </div>
        <div className={styles.footer}>
          <Button
            title="Отменить сдачу"
            color={ButtonColor.Default}
            width={ButtonWidth.Fullwidth}
            className={styles.submitButton}
            disabled={isCancelling}
            onClick={handleCancel}
            aria-label="Отменить сдачу"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel} data-test-id="add-attachment-panel">
      <div className={styles.header}>Ваша работа</div>
      <div className={styles.body}>
        <AttachedFilesTable files={files} onRemove={handleRemove} />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className={styles.fileInput}
          data-test-id="add-attachment-file-input"
          onChange={handleFileInputChange}
        />
        <Button
          title="Добавить файл"
          color={ButtonColor.Default}
          width={ButtonWidth.Fullwidth}
          className={styles.addFileButton}
          onClick={() => fileInputRef.current?.click()}
        />
      </div>
      <div className={styles.footer}>
        <Button
          title="Сдать"
          color={ButtonColor.Primary}
          width={ButtonWidth.Fullwidth}
          className={styles.submitButton}
          disabled={!canSubmit}
          onClick={handleSubmit}
          aria-label="Submit"
        />
      </div>
    </div>
  );
};
