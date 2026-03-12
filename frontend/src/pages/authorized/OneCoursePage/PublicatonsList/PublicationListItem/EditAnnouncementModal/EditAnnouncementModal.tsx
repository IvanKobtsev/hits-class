import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CustomModal } from 'components/uikit/modal/CustomModal';
import { Field } from 'components/uikit/Field';
import { TextArea } from 'components/uikit/inputs/TextArea';
import {
  Button,
  ButtonColor,
  ButtonWidth,
} from 'components/uikit/buttons/Button';
import { FormError } from 'components/uikit/FormError';
import { Loading } from 'components/uikit/suspense/Loading';
import { useModal } from 'components/uikit/modal/useModal';
import { useAdvancedForm } from 'helpers/form/useAdvancedForm';
import { requiredRule } from 'helpers/form/react-hook-form-helper';
import { useUpdateAnnouncementMutation } from 'services/api/api-client/AnnouncementQuery';
import { useUploadFileMutation } from 'services/api/api-client/FilesQuery';
import {
  AttachedFileItem,
  AttachedFilesTable,
} from 'pages/authorized/AssignmentPage/CreateSubmissionPanel/AttachedFilesTable/AttachedFilesTable';
import type { Attachment, FileInfoDto } from 'services/api/api-client.types';
import { QueryFactory } from 'services/api';
import styles from './EditAnnouncementModal.module.scss';

const MAX_FILE_SIZE_BYTES = 400 * 1024 * 1024;

function makeId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function fileInfoToAttachment(info: FileInfoDto): Attachment {
  return {
    uuid: info.id,
    fileName: info.fileName,
    size: info.size,
    createdAt: info.createdAt,
  };
}

function attachmentToFileItem(attachment: Attachment): AttachedFileItem {
  return {
    id: attachment.uuid,
    name: attachment.fileName,
    size: attachment.size,
    status: 'uploaded',
  };
}

type EditAnnouncementForm = {
  content: string;
};

export type EditAnnouncementModalProps = {
  isOpen: boolean;
  onClose: () => void;
  publicationId: number;
  initialContent: string;
  initialAttachments: Attachment[];
};

export const EditAnnouncementModal = ({
  isOpen,
  onClose,
  publicationId,
  initialContent,
  initialAttachments,
}: EditAnnouncementModalProps) => {
  const { mutateAsync, isPending } = useUpdateAnnouncementMutation(publicationId);
  const queryClient = useQueryClient();
  const modal = useModal();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<AttachedFileItem[]>([]);
  const [existingAttachmentsByFileId, setExistingAttachmentsByFileId] = useState<
    Record<string, Attachment>
  >({});
  const [rawFiles, setRawFiles] = useState<Record<string, File>>({});
  const { mutateAsync: uploadFileAsync } = useUploadFileMutation();

  const form = useAdvancedForm<EditAnnouncementForm>(async (data) => {
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
        attachments: allAttachments.length > 0 ? allAttachments : null,
      });
      await queryClient.invalidateQueries({
        queryKey: QueryFactory.PublicationsQuery.getPublicationsQueryKey({
          courseId: 1,
        }).slice(0, 1),
      });
      onClose();
      void modal.showAlert({ title: 'Успех', text: 'Объявление обновлено' });
    } catch {
      void modal.showError({ text: 'Обновление объявления не удалось' });
    }
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({ content: initialContent });
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
        next.push({
          id,
          name: file.name,
          size: file.size,
          status,
        });
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
      title="Редактировать объявление"
    >
      <Loading loading={isPending}>
        <form onSubmit={form.handleSubmitDefault} className={styles.form}>
          <Field title="Содержание" testId="EditAnnouncement-content">
            <TextArea
              {...form.register('content', { ...requiredRule() })}
              data-test-id="EditAnnouncement-content-input"
              data-error={!!form.formState.errors.content}
            />
            {form.formState.errors.content && (
              <div data-error="true" className={styles.fieldError}>
                {form.formState.errors.content.message}
              </div>
            )}
          </Field>
          <Field
            title="Прикреплённые файлы"
            testId="EditAnnouncement-attachments"
          >
            <AttachedFilesTable files={files} onRemove={handleRemoveFile} />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className={styles.fileInput}
              data-test-id="EditAnnouncement-file-input"
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
