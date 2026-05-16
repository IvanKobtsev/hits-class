import {
  BonusType,
  MarkType,
  Attachment,
  FileInfoDto,
  LexicalState,
  SubmissionType,
  TeamDistributionType,
} from '../../../../../services/api/api-client.types.ts';
import { useGetCourseQuery } from '../../../../../services/api/api-client/CourseQuery.ts';
import { useModal } from '../../../../../components/uikit/modal/useModal.tsx';
import {
  AttachedFileItem,
  AttachedFilesTable,
} from '../../../AssignmentPage/CreateSubmissionPanel/AttachedFilesTable/AttachedFilesTable.tsx';
import { useUploadFileMutation } from '../../../../../services/api/api-client/FilesQuery.ts';
import { useAdvancedForm } from '../../../../../helpers/form/useAdvancedForm.ts';
import { wrapInLexical } from '../../../AssignmentPage/StudentSubmissionsTab/StudentSubmissionsTab.tsx';
import { CustomModal } from '../../../../../components/uikit/modal/CustomModal.tsx';
import styles from '../CreateAssignmentModal/CreatePersonalAssignmentModal.module.scss';
import { Loading } from '../../../../../components/uikit/suspense/Loading.tsx';
import { Field } from '../../../../../components/uikit/Field.tsx';
import { Input } from '../../../../../components/uikit/inputs/Input.tsx';
import { requiredRule } from '../../../../../helpers/form/react-hook-form-helper.ts';
import { LexicalTextAreaControlled } from '../../../../../components/lexical/text-area/LexicalTextArea.tsx';
import { HookFormDatePicker } from '../../../../../components/uikit/inputs/date-time/HookFormDatePicker.tsx';
import {
  Button,
  ButtonColor,
  ButtonWidth,
} from '../../../../../components/uikit/buttons/Button.tsx';
import { FormError } from '../../../../../components/uikit/FormError.tsx';
import { useParams } from 'react-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { queryClient } from 'services/api/query-client-helper.ts';
import { RadioButton } from '../../../../../components/uikit/RadioButton.tsx';
import { useCreateAssignmentMutation } from '../../../../../services/api/api-client/TeamAssignmentQuery.ts';
import { useDistributeRandomlyMutationWithParameters } from '../../../../../services/api/api-client/TeamQuery.ts';
import { DeadlineCriteriaFields } from '../../DeadlineCriteriaFields/DeadlineCriteriaFields.tsx';

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

type CreateTeamAssignmentForm = {
  title: string;
  content: LexicalState;
  deadlineUtc: Date | null;
  distributionType: TeamDistributionType;
  submissionType: SubmissionType;
  minTeamSize: number;
  maxTeamSize: number;
  markType: MarkType;
  minMark: number | null;
  maxMark: number | null;
  hasEarlyBonus: boolean;
  earlyBonusEarliestDate: Date | null;
  earlyBonusValue: string;
  earlyBonusType: BonusType;
  hasLatePenalty: boolean;
  latePenaltyLatestDate: Date | null;
};

export type CreateTeamAssignmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const CreateTeamAssignmentModal = ({
  isOpen,
  onClose,
}: CreateTeamAssignmentModalProps) => {
  const { courseId } = useParams<{ courseId: string }>();
  const courseIdNum = Number(courseId);
  const { mutateAsync, isPending } = useCreateAssignmentMutation(courseIdNum);
  const { mutateAsync: distributeRandomlyAsync } =
    useDistributeRandomlyMutationWithParameters();
  const { data: course } = useGetCourseQuery(courseIdNum);
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

  const form = useAdvancedForm<CreateTeamAssignmentForm>(
    async (data) => {
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
      const deadlineCriteria =
        data.hasEarlyBonus || data.hasLatePenalty
          ? {
              earlyBonus:
                data.hasEarlyBonus && data.earlyBonusEarliestDate
                  ? {
                      earliestDate: data.earlyBonusEarliestDate,
                      bonusValue: Number(data.earlyBonusValue),
                      bonusType: data.earlyBonusType,
                    }
                  : null,
              latePenalty:
                data.hasLatePenalty && data.latePenaltyLatestDate
                  ? { latestDate: data.latePenaltyLatestDate }
                  : null,
            }
          : null;
      const createdAssignment = await mutateAsync({
        content: data.content,
        targetUsersIds,
        attachments: attachments.length > 0 ? attachments : null,
        criteria: null,
        payload: {
          publicationType: 'TeamAssignment',
          distributionType: data.distributionType,
          submissionType: data.submissionType,
          title: data.title,
          deadlineUtc: data.deadlineUtc ?? null,
          minTeamSize: !data.minTeamSize ? null : data.minTeamSize,
          maxTeamSize: !data.maxTeamSize ? null : data.maxTeamSize,
          markType: data.markType,
          minMark: data.minMark,
          maxMark: data.maxMark,
          areTeamsFrozen: false,
          deadlineCriteria,
        },
      });
      if (data.distributionType === TeamDistributionType.Random) {
        await distributeRandomlyAsync({
          assignmentId: createdAssignment.id,
        });
      }
      await queryClient.invalidateQueries({ queryKey: [] });
      onClose();
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
      title="Создать командное задание"
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
              <Field title="Срок сдачи">
                <HookFormDatePicker
                  name="deadlineUtc"
                  control={form.control}
                  withTime
                />
              </Field>
              <DeadlineCriteriaFields
                register={form.register}
                control={form.control}
                watch={form.watch}
                deadlineSet={!!form.watch('deadlineUtc')}
              />
              <Field title="Тип оценки" fieldClassName={styles.markType}>
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
              <Field
                title="Минимальная оценка"
                testId="CreateAssignment-minMark"
              >
                <Input
                  {...form.register('minMark')}
                  errorText={form.formState.errors.minMark?.message}
                  testId="CreateAssignment-minMark-input"
                />
              </Field>
              <Field
                title="Максимальная оценка"
                testId="CreateAssignment-maxMark"
              >
                <Input
                  {...form.register('maxMark')}
                  errorText={form.formState.errors.minMark?.message}
                  testId="CreateAssignment-maxMark-input"
                />
              </Field>
              <Field
                title="Тип распределения"
                fieldClassName={styles.distributionType}
              >
                <RadioButton
                  {...form.register('distributionType')}
                  defaultChecked={true}
                  value={TeamDistributionType.Free}
                  title={'Свободное'}
                />
                <RadioButton
                  {...form.register('distributionType')}
                  value={TeamDistributionType.Draft}
                  title={'Драфт'}
                />
                <RadioButton
                  {...form.register('distributionType')}
                  value={TeamDistributionType.ByTeacher}
                  title={'Ручное (мной)'}
                />
                <RadioButton
                  {...form.register('distributionType')}
                  value={TeamDistributionType.Random}
                  title={'Случайное'}
                />
              </Field>
              <Field
                title="Кто может сдавать решение"
                fieldClassName={styles.submissionType}
              >
                <RadioButton
                  {...form.register('submissionType')}
                  value={SubmissionType.All}
                  defaultChecked={true}
                  title={'Все'}
                />
                <RadioButton
                  {...form.register('submissionType')}
                  value={SubmissionType.One}
                  title={'Капитан'}
                />
              </Field>
              <div className={styles.teamSize}>
                <Field
                  title="Минимальный размер команды"
                  fieldClassName={styles.submissionType}
                >
                  <Input
                    {...form.register('minTeamSize')}
                    type={'number'}
                    placeholder={'0'}
                  />
                </Field>
                <Field
                  title="Максимальный размер команды"
                  fieldClassName={styles.submissionType}
                >
                  <Input
                    {...form.register('maxTeamSize')}
                    type={'number'}
                    placeholder={'100'}
                  />
                </Field>
              </div>
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
                />
              </div>
            </form>
          </div>
        </div>
      </Loading>
    </CustomModal>
  );
};
