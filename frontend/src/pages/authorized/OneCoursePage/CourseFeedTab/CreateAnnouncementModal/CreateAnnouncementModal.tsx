import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
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
import { useCreateAnnouncementMutation } from 'services/api/api-client/AnnouncementQuery';
import { useGetCourseQuery } from 'services/api/api-client/CourseQuery';
import { useUploadFileMutation } from 'services/api/api-client/FilesQuery';
import { TargetStudents } from '../TargetStudents/TargetStudents';
import {
  AttachedFileItem,
  AttachedFilesTable,
} from 'pages/authorized/AssignmentPage/CreateSubmissionPanel/AttachedFilesTable/AttachedFilesTable';
import type {
  Attachment,
  FileInfoDto,
  LexicalState,
} from 'services/api/api-client.types';
import styles from './CreateAnnouncementModal.module.scss';
import { QueryFactory } from 'services/api';
import { LexicalTextAreaControlled } from '../../../../../components/lexical/text-area/LexicalTextArea.tsx';
import { wrapInLexical } from '../../../AssignmentPage/StudentSubmissionsTab/StudentSubmissionsTab.tsx';

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

type CreateAnnouncementForm = {
  content: LexicalState;
};

export type CreateAnnouncementModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const CreateAnnouncementModal = ({
  isOpen,
  onClose,
}: CreateAnnouncementModalProps) => {
  const { courseId } = useParams<{ courseId: string }>();
  const courseIdNum = Number(courseId);
  const { mutateAsync, isPending } = useCreateAnnouncementMutation(courseIdNum);
  const { data: course } = useGetCourseQuery(courseIdNum);
  const queryClient = useQueryClient();
  const modal = useModal();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<AttachedFileItem[]>([]);
  const [uploadedFileInfos, setUploadedFileInfos] = useState<
    Record<string, FileInfoDto>
  >({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { mutate: uploadFile } = useUploadFileMutation();

  useEffect(() => {
    if (isOpen && course?.students) {
      setSelectedIds(new Set(course.students.map((s) => s.id)));
    }
  }, [isOpen, course?.students]);

  const attachments: Attachment[] =
    Object.values(uploadedFileInfos).map(fileInfoToAttachment);

  const form = useAdvancedForm<CreateAnnouncementForm>(
    async (data) => {
      try {
        const students = course?.students ?? [];
        const targetUsersIds =
          selectedIds.size === 0 || selectedIds.size === students.length
            ? null
            : [...selectedIds];
        await mutateAsync({
          content: data.content,
          targetUsersIds,
          attachments: attachments.length > 0 ? attachments : null,
          payload: { publicationType: 'Announcement' },
        });
        await queryClient.invalidateQueries({
          queryKey: QueryFactory.PublicationsQuery.getPublicationsQueryKey({
            courseId: courseIdNum,
          }).slice(0, 1),
        });
        onClose();
      } catch {
        void modal.showError({ text: 'Создание объявления не удалось' });
      }
    },
    {
      shouldResetOnSuccess: true,
      defaultValues: { content: { json: wrapInLexical('').json } },
    },
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
      maxWidth="lg"
      contentClassName={styles.wideModalContent}
    >
      <Loading loading={isPending}>
        <div className={styles.formLayout}>
          <div className={styles.formColumn}>
          <form onSubmit={form.handleSubmitDefault} className={styles.form}>
          <Field title="Содержание" testId="CreateAnnouncement-content">
            <LexicalTextAreaControlled
              className={styles.content}
              form={form}
              name={'content'}
              testId="CreateAnnouncement-content-input"
            />
            {form.formState.errors.content && (
              <div data-error="true" className={styles.fieldError}>
                {form.formState.errors.content.message}
              </div>
            )}
          </Field>
          <Field
            title="Прикреплённые файлы"
            testId="CreateAnnouncement-attachments"
          >
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
              disabled={selectedIds.size === 0}
            />
          </div>
        </form>
          </div>
          <div className={styles.targetColumn}>
            <TargetStudents
              courseId={courseIdNum}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
          </div>
        </div>
      </Loading>
    </CustomModal>
  );
};
