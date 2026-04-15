import { useQueryClient } from '@tanstack/react-query';
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
import { useCreateTeamMutation } from 'services/api/api-client/TeamQuery';
import styles from './CreateTeamModal.module.scss';

type CreateTeamForm = {
  name: string;
};

type CreateTeamModalProps = {
  assignmentId: number;
  isOpen: boolean;
  onClose: () => void;
};

export const CreateTeamModal = ({
  assignmentId,
  isOpen,
  onClose,
}: CreateTeamModalProps) => {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useCreateTeamMutation(assignmentId);

  const form = useAdvancedForm<CreateTeamForm>(
    async (data) => {
      await mutateAsync({ name: data.name.trim() });
      onClose();
      await queryClient.invalidateQueries({
        queryKey:
          QueryFactory.TeamQuery.getTeamsForAssignmentQueryKey(assignmentId),
      });
    },
    { shouldResetOnSuccess: true },
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
