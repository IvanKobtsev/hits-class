import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useUploadFileMutation } from 'services/api/api-client/FilesQuery';
import {
  AttachedFileItem,
  AttachedFilesTable,
} from 'pages/authorized/AssignmentPage/CreateSubmissionPanel/AttachedFilesTable/AttachedFilesTable';
import {
  Attachment,
  BonusType,
  CriteriaDto,
  DeadlineCriteria,
  FileInfoDto,
  LexicalState,
  MarkType,
  SubmissionType,
  TeamDistributionType,
} from 'services/api/api-client.types';
import { CriteriaFields, CriteriaItem, makeCriteriaKey } from '../../../CriteriaFields/CriteriaFields';
import { DeadlineCriteriaFields } from '../../../DeadlineCriteriaFields/DeadlineCriteriaFields.tsx';
import { QueryFactory } from 'services/api';
import styles from './EditTeamAssignmentModal.module.scss';
import { LexicalTextAreaControlled } from '../../../../../../components/lexical/text-area/LexicalTextArea.tsx';
import { wrapInLexical } from '../../../../AssignmentPage/StudentSubmissionsTab/StudentSubmissionsTab.tsx';
import { RadioButton } from '../../../../../../components/uikit/RadioButton.tsx';
import { CheckBox } from '../../../../../../components/uikit/CheckBox.tsx';
import { usePatchAssignmentMutation } from '../../../../../../services/api/api-client/TeamAssignmentQuery.ts';
import { PeerReviewMappingsPanel } from '../../../PeerReviewMappingsPanel/PeerReviewMappingsPanel';

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

type EditTeamAssignmentForm = {
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
  isPeerReviewEnabled: boolean;
  juryCountPerDefendant: number | null;
};

export type EditTeamAssignmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  publicationId: number;
  initialTitle: string;
  initialContent: LexicalState | null;
  initialDeadlineUtc: Date | null;
  initialAttachments: Attachment[];
  initialSubmissionType: SubmissionType;
  initialDistributionType: TeamDistributionType;
  initialMinSize?: number;
  initialMaxSize?: number;
  initialMarkType: MarkType;
  initialMinMark: number | null;
  initialMaxMark: number | null;
  initialCriteria?: CriteriaDto[];
  initialDeadlineCriteria?: DeadlineCriteria | null;
  initialIsPeerReviewEnabled?: boolean;
  initialJuryCountPerDefendant?: number | null;
  courseId: number;
};

export const EditTeamAssignmentModal = ({
  isOpen,
  onClose,
  onSuccess,
  publicationId,
  initialTitle,
  initialContent,
  initialDeadlineUtc,
  initialAttachments,
  initialSubmissionType,
  initialDistributionType,
  initialMinSize,
  initialMaxSize,
  initialMarkType,
  initialMinMark,
  initialMaxMark,
  initialCriteria,
  initialDeadlineCriteria,
  initialIsPeerReviewEnabled,
  initialJuryCountPerDefendant,
  courseId,
}: EditTeamAssignmentModalProps) => {
  const { mutateAsync, isPending } = usePatchAssignmentMutation(publicationId);
  const queryClient = useQueryClient();
  const modal = useModal();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<AttachedFileItem[]>([]);
  const [existingAttachmentsByFileId, setExistingAttachmentsByFileId] =
    useState<Record<string, Attachment>>({});
  const [rawFiles, setRawFiles] = useState<Record<string, File>>({});
  const [criteria, setCriteria] = useState<CriteriaItem[]>([]);
  const { mutateAsync: uploadFileAsync } = useUploadFileMutation();

  const form = useAdvancedForm<EditTeamAssignmentForm>(
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
      const newAttachments = fileInfos.map(fileInfoToAttachment);
      const remainingExisting = files
        .filter((f) => existingAttachmentsByFileId[f.id])
        .map((f) => existingAttachmentsByFileId[f.id]);
      const allAttachments = [...remainingExisting, ...newAttachments];

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
      await mutateAsync({
        content: data.content,
        attachments: allAttachments,
        criteria: criteria.map(({ _key: _, ...dto }) => dto),
        payload: {
          title: data.title,
          deadlineUtc: data.deadlineUtc ?? null,
          distributionType: data.distributionType,
          submissionType: data.submissionType,
          minTeamSize: !data.minTeamSize ? null : data.minTeamSize,
          maxTeamSize: !data.maxTeamSize ? null : data.maxTeamSize,
          minMark: !data.minMark ? null : data.minMark,
          maxMark: !data.maxMark ? null : data.maxMark,
          deadlineCriteria,
          isPeerReviewEnabled: data.isPeerReviewEnabled,
          juryCountPerDefendant: data.isPeerReviewEnabled
            ? Number(data.juryCountPerDefendant)
            : null,
        },
      });
      await queryClient.invalidateQueries({
        queryKey: QueryFactory.PublicationsQuery.getPublicationsQueryKey({
          courseId: 1,
        }).slice(0, 1),
      });
      onClose();
      onSuccess?.();
    },
    { defaultValues: { content: wrapInLexical('') } },
  );

  useEffect(() => {
    if (isOpen) {
      form.reset({
        title: initialTitle,
        content: initialContent ?? undefined,
        deadlineUtc: initialDeadlineUtc,
        submissionType: initialSubmissionType,
        distributionType: initialDistributionType,
        minTeamSize: initialMinSize,
        maxTeamSize: initialMaxSize,
        markType: initialMarkType,
        minMark: initialMinMark,
        maxMark: initialMaxMark,
        hasEarlyBonus: !!initialDeadlineCriteria?.earlyBonus,
        earlyBonusEarliestDate: initialDeadlineCriteria?.earlyBonus?.earliestDate ?? null,
        earlyBonusValue: String(initialDeadlineCriteria?.earlyBonus?.bonusValue ?? ''),
        earlyBonusType: initialDeadlineCriteria?.earlyBonus?.bonusType ?? BonusType.Score,
        hasLatePenalty: !!initialDeadlineCriteria?.latePenalty,
        latePenaltyLatestDate: initialDeadlineCriteria?.latePenalty?.latestDate ?? null,
        isPeerReviewEnabled: initialIsPeerReviewEnabled ?? false,
        juryCountPerDefendant: initialJuryCountPerDefendant ?? null,
      });
      setFiles(initialAttachments.map(attachmentToFileItem));
      setExistingAttachmentsByFileId(
        Object.fromEntries(initialAttachments.map((a) => [a.uuid, a])),
      );
      setRawFiles({});
      setCriteria((initialCriteria ?? []).map(({ id: _, ...c }) => ({ ...c, _key: makeCriteriaKey() })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleClose = () => {
    form.reset();
    setFiles([]);
    setExistingAttachmentsByFileId({});
    setRawFiles({});
    setCriteria([]);
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
      title="Редактировать командное задание"
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
            <LexicalTextAreaControlled
              className={styles.content}
              form={form}
              name={'content'}
              testId="EditAssignment-content-input"
            />
          </Field>
          {initialMarkType === MarkType.Score && (
            <>
              <Field title="Минимальная оценка" testId="CreateAssignment-minMark">
                <Input
                  {...form.register('minMark')}
                  errorText={form.formState.errors.minMark?.message}
                  testId="CreateAssignment-minMark-input"
                />
              </Field>
              <Field title="Максимальная оценка" testId="CreateAssignment-maxMark">
                <Input
                  {...form.register('maxMark')}
                  errorText={form.formState.errors.minMark?.message}
                  testId="CreateAssignment-maxMark-input"
                />
              </Field>
            </>
          )}
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
          <Field title="P2P оценка">
            <CheckBox
              {...form.register('isPeerReviewEnabled')}
              title="Включить P2P оценку"
            />
          </Field>
          {form.watch('isPeerReviewEnabled') && (
            <>
              <Field title="Количество жюри на ответчика">
                <Input
                  {...form.register('juryCountPerDefendant', {
                    ...requiredRule(),
                    min: { value: 1, message: 'Минимум 1' },
                  })}
                  type="number"
                  errorText={form.formState.errors.juryCountPerDefendant?.message}
                />
              </Field>
              {initialIsPeerReviewEnabled && (
                <PeerReviewMappingsPanel
                  publicationId={publicationId}
                  courseId={courseId}
                />
              )}
            </>
          )}
          <Field
            title="Тип распределения"
            fieldClassName={styles.distributionType}
          >
            <RadioButton
              {...form.register('distributionType')}
              value={TeamDistributionType.Free}
              title={'Свободное'}
            />
            <RadioButton
              {...form.register('distributionType')}
              value={TeamDistributionType.Draft}
              disabled={true}
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
              disabled={true}
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
          <CriteriaFields
            value={criteria}
            onChange={setCriteria}
            earlyBonus={
              form.watch('hasEarlyBonus') && form.watch('earlyBonusValue')
                ? {
                    bonusValue: Number(form.watch('earlyBonusValue')),
                    bonusType: form.watch('earlyBonusType'),
                  }
                : null
            }
          />
          <Field
            title="Прикреплённые файлы"
            testId="EditAssignment-attachments"
          >
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
