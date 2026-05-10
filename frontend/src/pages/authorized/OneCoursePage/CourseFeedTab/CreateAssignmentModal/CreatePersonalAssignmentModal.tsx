import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CustomModal } from 'components/uikit/modal/CustomModal';
import { Field } from 'components/uikit/Field';
import { Input } from 'components/uikit/inputs/Input';
import { HookFormDatePicker } from 'components/uikit/inputs/date-time/HookFormDatePicker';
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
import { useCreateAssignmentMutation } from 'services/api/api-client/AssignmentQuery';
import { useGetCourseQuery } from 'services/api/api-client/CourseQuery';
import { useUploadFileMutation } from 'services/api/api-client/FilesQuery';
import { TargetStudents } from '../TargetStudents/TargetStudents';
import {
  AttachedFileItem,
  AttachedFilesTable,
} from 'pages/authorized/AssignmentPage/CreateSubmissionPanel/AttachedFilesTable/AttachedFilesTable';
import {
  MarkType,
  type Attachment,
  type FileInfoDto,
  type LexicalState,
} from 'services/api/api-client.types';
import styles from './CreatePersonalAssignmentModal.module.scss';
import { wrapInLexical } from '../../../AssignmentPage/StudentSubmissionsTab/StudentSubmissionsTab.tsx';
import { LexicalTextAreaControlled } from 'components/lexical/text-area/LexicalTextArea.tsx';
import { RadioButton } from '../../../../../components/uikit/RadioButton.tsx';

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

type CreatePersonalAssignmentForm = {
  title: string;
  content: LexicalState;
  minMark: number | null;
  maxMark: number | null;
  markType: MarkType;
  deadlineUtc: Date | null;
};

export type CreatePersonalAssignmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const CreatePersonalAssignmentModal = ({
  isOpen,
  onClose,
}: CreatePersonalAssignmentModalProps) => {
  const { courseId } = useParams<{ courseId: string }>();
  const courseIdNum = Number(courseId);
  const { mutateAsync, isPending } = useCreateAssignmentMutation(courseIdNum);
  const { data: course } = useGetCourseQuery(courseIdNum);
  const queryClient = useQueryClient();
  const modal = useModal();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<AttachedFileItem[]>([]);
  const [rawFiles, setRawFiles] = useState<Record<string, File>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { mutateAsync: uploadFileAsync } = useUploadFileMutation();

  useEffect(() => {
    if (isOpen && course?.students) {
      setSelectedIds(new Set(course.students.map((s) => s.id)));
    }
  }, [isOpen, course?.students]);

  const form = useAdvancedForm<CreatePersonalAssignmentForm>(
    async (data) => {
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
        const attachments = fileInfos.map(fileInfoToAttachment);
        const students = course?.students ?? [];
        const targetUsersIds =
          selectedIds.size === 0 || selectedIds.size === students.length
            ? null
            : [...selectedIds];
        await mutateAsync({
          content: data.content,
          targetUsersIds,
          attachments: attachments.length > 0 ? attachments : null,
          payload: {
            publicationType: 'Assignment',
            title: data.title,
            markType: data.markType,
            minMark: data.minMark ?? null,
            maxMark: data.maxMark ?? null,
            deadlineUtc: data.deadlineUtc ?? null,
          },
        });
        await queryClient.invalidateQueries({ queryKey: [] });
        onClose();
      } catch {
        void modal.showError({ text: 'Создание задания не удалось' });
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
      title="Создать индивидуальное задание"
      maxWidth="lg"
      contentClassName={styles.wideModalContent}
    >
      <Loading loading={isPending}>
        <div className={styles.formLayout}>
          <div className={styles.formColumn}>
            <form onSubmit={form.handleSubmitDefault} className={styles.form}>
              <Field title="Название" testId="CreateAssignment-title">
                <Input
                  {...form.register('title', { ...requiredRule() })}
                  errorText={form.formState.errors.title?.message}
                  testId="CreateAssignment-title-input"
                />
              </Field>
              <Field title="Описание">
                <LexicalTextAreaControlled
                  className={styles.content}
                  form={form}
                  name={'content'}
                  testId="CreateAssignment-content-input"
                />
              </Field>
              <Field
                title="Тип оценки"
                fieldClassName={styles.markType}
              >
                <RadioButton
                  {...form.register('markType')}
                  value={MarkType.Score}
                  defaultChecked={true}
                  title={'Числовая'}
                />
                <RadioButton
                  {...form.register('markType')}
                  value={MarkType.PassFail}
                  title={'Зачет/незачет'}
                />
              </Field>
              <Field title="Срок сдачи">
                <HookFormDatePicker
                  name="deadlineUtc"
                  control={form.control}
                  withTime
                />
              </Field>
              <Field
                title="Прикреплённые файлы"
                testId="CreateAssignment-attachments"
              >
                <AttachedFilesTable files={files} onRemove={handleRemoveFile} />
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className={styles.fileInput}
                  data-test-id="CreateAssignment-file-input"
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
