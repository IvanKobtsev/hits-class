import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CustomModal } from 'components/uikit/modal/CustomModal';
import { Field } from 'components/uikit/Field';
import { Input } from 'components/uikit/inputs/Input';
import { TextArea } from 'components/uikit/inputs/TextArea';
import { HookFormDatePicker } from 'components/uikit/inputs/date-time/HookFormDatePicker';
import { Button, ButtonColor, ButtonWidth } from 'components/uikit/buttons/Button';
import { FormError } from 'components/uikit/FormError';
import { Loading } from 'components/uikit/suspense/Loading';
import { useModal } from 'components/uikit/modal/useModal';
import { useAdvancedForm } from 'helpers/form/useAdvancedForm';
import { requiredRule } from 'helpers/form/react-hook-form-helper';
import { usePatchAssignmentMutation } from 'services/api/api-client/AssignmentQuery';
import { useUploadFileMutation } from 'services/api/api-client/FilesQuery';
import {
  AttachedFileItem,
  AttachedFilesTable,
} from 'pages/authorized/AssignmentPage/CreateSubmissionPanel/AttachedFilesTable/AttachedFilesTable';
import type { Attachment, FileInfoDto } from 'services/api/api-client.types';
import { QueryFactory } from 'services/api';
import styles from './EditAssignmentModal.module.scss';

const MAX_FILE_SIZE_BYTES = 400 * 1024 * 1024;

function makeId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function fileInfoToAttachment(info: FileInfoDto): Attachment {
  return { uuid: info.id, fileName: info.fileName, size: info.size, createdAt: info.createdAt };
}

function attachmentToFileItem(attachment: Attachment): AttachedFileItem {
  return {
    id: attachment.uuid,
    name: attachment.fileName,
    size: attachment.size,
    status: 'uploaded',
  };
}

type EditAssignmentForm = {
  title: string;
  content: string;
  deadlineUtc: Date | null;
};

export type EditAssignmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  publicationId: number;
  initialTitle: string;
  initialContent: string;
  initialDeadlineUtc: Date | null;
  initialAttachments: Attachment[];
};

export const EditAssignmentModal = ({
  isOpen,
  onClose,
  onSuccess,
  publicationId,
  initialTitle,
  initialContent,
  initialDeadlineUtc,
  initialAttachments,
}: EditAssignmentModalProps) => {
  const { mutateAsync, isPending } = usePatchAssignmentMutation(publicationId);
  const queryClient = useQueryClient();
  const modal = useModal();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<AttachedFileItem[]>([]);
  const [existingAttachmentsByFileId, setExistingAttachmentsByFileId] = useState<
    Record<string, Attachment>
  >({});
  const [rawFiles, setRawFiles] = useState<Record<string, File>>({});
  const { mutateAsync: uploadFileAsync } = useUploadFileMutation();

  const form = useAdvancedForm<EditAssignmentForm>(async (data) => {
    try {
      const uploadableEntries = Object.entries(rawFiles).filter(([id]) => {
        const item = files.find((f) => f.id === id);
        return item && item.status !== 'too_large';
      });
      const fileInfos = await Promise.all(
        uploadableEntries.map(([, file]) =>
          uploadFileAsync({ file: { data: file, fileName: file.name } }),
        ),
      );
      const newAttachments = fileInfos.map(fileInfoToAttachment);
      const remainingExisting = files
        .filter((f) => existingAttachmentsByFileId[f.id])
        .map((f) => existingAttachmentsByFileId[f.id]);
      const allAttachments = [...remainingExisting, ...newAttachments];

      await mutateAsync({
        content: data.content,
        attachments: allAttachments,
        payload: {
          title: data.title,
          deadlineUtc: data.deadlineUtc ?? null,
        },
      });
      await queryClient.invalidateQueries({
        queryKey: QueryFactory.PublicationsQuery.getPublicationsQueryKey({
          courseId: 1,
        }).slice(0, 1),
      });
      onClose();
      onSuccess?.();
    } catch {
      void modal.showError({ text: 'Обновление задания не удалось' });
    }
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        title: initialTitle,
        content: initialContent,
        deadlineUtc: initialDeadlineUtc,
      });
      setFiles(initialAttachments.map(attachmentToFileItem));
      setExistingAttachmentsByFileId(
        Object.fromEntries(initialAttachments.map((a) => [a.uuid, a])),
      );
      setRawFiles({});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleClose = () => {
    form.reset();
    setFiles([]);
    setExistingAttachmentsByFileId({});
    setRawFiles({});
    onClose();
  };

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (!selectedFiles?.length) return;
      const next: AttachedFileItem[] = [];
      const nextRaw: Record<string, File> = {};
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const id = makeId();
        const status: AttachedFileItem['status'] =
          file.size > MAX_FILE_SIZE_BYTES ? 'too_large' : 'pending';
        next.push({ id, name: file.name, size: file.size, status });
        if (status === 'pending') {
          nextRaw[id] = file;
        }
      }
      setFiles((prev) => [...prev, ...next]);
      setRawFiles((prev) => ({ ...prev, ...nextRaw }));
      e.target.value = '';
    },
    [],
  );

  const handleRemoveFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setRawFiles((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={handleClose}
      isBlocking={false}
      title="Редактировать задание"
    >
      <Loading loading={isPending}>
        <form onSubmit={form.handleSubmitDefault} className={styles.form}>
          <Field title="Название" testId="EditAssignment-title">
            <Input
              {...form.register('title', { ...requiredRule() })}
              errorText={form.formState.errors.title?.message}
              testId="EditAssignment-title-input"
            />
          </Field>
          <Field title="Описание">
            <TextArea
              {...form.register('content', { ...requiredRule() })}
              errorText={form.formState.errors.content?.message}
              data-test-id="EditAssignment-content-input"
              data-error={!!form.formState.errors.content}
            />
          </Field>
          <Field title="Срок сдачи">
            <HookFormDatePicker
              name="deadlineUtc"
              control={form.control}
              withTime
            />
          </Field>
          <Field title="Прикреплённые файлы" testId="EditAssignment-attachments">
            <AttachedFilesTable files={files} onRemove={handleRemoveFile} />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className={styles.fileInput}
              data-test-id="EditAssignment-file-input"
              onChange={handleFileInputChange}
            />
            <Button
              title="Добавить файл"
              color={ButtonColor.Default}
              width={ButtonWidth.Fullwidth}
              className={styles.addFileButton}
              onClick={() => fileInputRef.current?.click()}
            />
          </Field>
          <FormError>{form.overallError || null}</FormError>
          <div className={styles.footer}>
            <Button
              title="Сохранить"
              type="submit"
              color={ButtonColor.Primary}
              width={ButtonWidth.Fullwidth}
            />
          </div>
        </form>
      </Loading>
    </CustomModal>
  );
};
