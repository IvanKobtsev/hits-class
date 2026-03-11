import React, { useCallback, useRef, useState } from 'react';
import { CustomModal } from 'components/uikit/modal/CustomModal';
import { Field } from 'components/uikit/Field';
import { Input } from 'components/uikit/inputs/Input';
import { TextArea } from 'components/uikit/inputs/TextArea';
import { Button, ButtonColor, ButtonWidth } from 'components/uikit/buttons/Button';
import { FormError } from 'components/uikit/FormError';
import { Loading } from 'components/uikit/suspense/Loading';
import { useModal } from 'components/uikit/modal/useModal';
import { useAdvancedForm } from 'helpers/form/useAdvancedForm';
import { requiredRule } from 'helpers/form/react-hook-form-helper';
import { useCreateAnnouncementMutation } from 'services/api/api-client/AnnouncementQuery';
import { useUploadFileMutation } from 'services/api/api-client/FilesQuery';
import {
  AttachedFileItem,
  AttachedFilesTable,
} from 'pages/authorized/AssignmentPage/CreateSubmissionPanel/AttachedFilesTable/AttachedFilesTable';
import type { FileInfoDto } from 'services/api/api-client.types';
import styles from './CreateAnnouncementModal.module.scss';

const MAX_FILE_SIZE_BYTES = 400 * 1024 * 1024;

function makeId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type CreateAnnouncementForm = {
  title: string;
  description: string;
};

export type CreateAnnouncementModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const CreateAnnouncementModal = ({
  isOpen,
  onClose,
}: CreateAnnouncementModalProps) => {
  const { mutateAsync, isPending } = useCreateAnnouncementMutation();
  const modal = useModal();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<AttachedFileItem[]>([]);
  const [uploadedFileInfos, setUploadedFileInfos] = useState<
    Record<string, FileInfoDto>
  >({});
  const { mutate: uploadFile } = useUploadFileMutation();

  const attachments = Object.values(uploadedFileInfos);

  const form = useAdvancedForm<CreateAnnouncementForm>(
    async (data) => {
      try {
        await mutateAsync({
          title: data.title,
          description: data.description || null,
          attachments,
        });
        onClose();
      } catch {
        modal.showError({ text: 'Создание объявления не удалось' });
      }
    },
    { shouldResetOnSuccess: true },
  );

  const handleClose = () => {
    form.reset();
    setFiles([]);
    setUploadedFileInfos({});
    onClose();
  };

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
        next.push({ id, name: file.name, size: file.size, status, progress: status === 'uploading' ? 0 : undefined });
        if (status === 'uploading') {
          uploadFile(
            { file: { data: file, fileName: file.name } },
            {
              onSuccess: (data: FileInfoDto) => {
                setFiles((prev) =>
                  prev.map((f) => (f.id === id ? { ...f, status: 'uploaded' as const } : f)),
                );
                setUploadedFileInfos((prev) => ({ ...prev, [id]: data }));
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

  const handleRemoveFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setUploadedFileInfos((prev) => {
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
      title="Создать объявление"
    >
      <Loading loading={isPending}>
        <form onSubmit={form.handleSubmitDefault} className={styles.form}>
          <Field title="Название" testId="CreateAnnouncement-title">
            <Input
              {...form.register('title', { ...requiredRule() })}
              errorText={form.formState.errors.title?.message}
              testId="CreateAnnouncement-title-input"
            />
          </Field>
          <Field title="Описание">
            <TextArea
              {...form.register('description')}
              data-test-id="CreateAnnouncement-description"
            />
          </Field>
          <Field title="Прикреплённые файлы" testId="CreateAnnouncement-attachments">
            <AttachedFilesTable files={files} onRemove={handleRemoveFile} />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className={styles.fileInput}
              data-test-id="CreateAnnouncement-file-input"
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
              title="Создать"
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
