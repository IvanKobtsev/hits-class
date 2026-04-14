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
import { useCreateTeamMutation } from 'services/api/api-client/TeamQuery';
import styles from './CreateTeamModal.module.scss';

type CreateTeamForm = {
  name: string;
  captainId: string | null;
};

type CreateTeamModalProps = {
  assignmentId: number;
  isOpen: boolean;
  onClose: () => void;
  students?: UserDto[];
  allowCaptainSelection?: boolean;
};

export const CreateTeamModal = ({
  assignmentId,
  isOpen,
  onClose,
  students = [],
  allowCaptainSelection = false,
}: CreateTeamModalProps) => {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useCreateTeamMutation(assignmentId);

  const form = useAdvancedForm<CreateTeamForm>(
    async (data) => {
      await mutateAsync({
        name: data.name.trim(),
        captainId: allowCaptainSelection ? data.captainId : null,
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
        if (allowCaptainSelection) {
          f.register('captainId', { ...requiredRule() });
        }
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
          {allowCaptainSelection ? (
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
          ) : null}
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
