import { useQueryClient } from '@tanstack/react-query';
import { MenuItem, TextField } from '@mui/material';
import { Field } from 'components/uikit/Field';
import { FormError } from 'components/uikit/FormError';
import {
  Button,
  ButtonColor,
  ButtonWidth,
} from 'components/uikit/buttons/Button';
import { Input } from 'components/uikit/inputs/Input';
import { CustomModal } from 'components/uikit/modal/CustomModal';
import { Loading } from 'components/uikit/suspense/Loading';
import { useAdvancedForm } from 'helpers/form/useAdvancedForm';
import { requiredRule } from 'helpers/form/react-hook-form-helper';
import { QueryFactory } from 'services/api';
import type { UserDto } from 'services/api/api-client.types';
import { useCreateTeamAsTeacherMutation } from 'services/api/api-client/TeamQuery';
import styles from './CreateTeamModal.module.scss';

type CreateTeamAsTeacherForm = {
  name: string;
  captainId: string | null;
};

type CreateTeamAsTeacherModalProps = {
  assignmentId: number;
  isOpen: boolean;
  onClose: () => void;
  students: UserDto[];
};

export const CreateTeamAsTeacherModal = ({
  assignmentId,
  isOpen,
  onClose,
  students,
}: CreateTeamAsTeacherModalProps) => {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useCreateTeamAsTeacherMutation(assignmentId);

  const form = useAdvancedForm<CreateTeamAsTeacherForm>(
    async (data) => {
      await mutateAsync({
        name: data.name.trim(),
        studentIds: [data.captainId!],
      });
      onClose();
      await queryClient.invalidateQueries({
        queryKey: QueryFactory.TeamQuery.getTeamsForAssignmentQueryKey(
          assignmentId,
        ),
      });
    },
    {
      shouldResetOnSuccess: true,
      initialize: (f) => {
        f.register('captainId', { ...requiredRule() });
      },
      defaultValues: {
        captainId: null,
      },
    },
  );

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={handleClose}
      isBlocking={false}
      title="Создать команду"
    >
      <Loading loading={isPending}>
        <form onSubmit={form.handleSubmitDefault} className={styles.form}>
          <Field title="Название команды">
            <Input
              {...form.register('name', { ...requiredRule() })}
              errorText={form.formState.errors.name?.message}
              testId="CreateTeam-name"
            />
          </Field>
          <Field title="Капитан">
            <TextField
              select
              fullWidth
              size="small"
              value={form.watch('captainId') ?? ''}
              error={!!form.formState.errors.captainId}
              helperText={form.formState.errors.captainId?.message}
              onChange={(e) =>
                form.setValue('captainId', e.target.value || null, {
                  shouldValidate: true,
                })
              }
              data-test-id="CreateTeam-captain"
            >
              {students.map((student) => (
                <MenuItem key={student.id} value={student.id}>
                  {student.legalName || student.email}
                </MenuItem>
              ))}
            </TextField>
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
