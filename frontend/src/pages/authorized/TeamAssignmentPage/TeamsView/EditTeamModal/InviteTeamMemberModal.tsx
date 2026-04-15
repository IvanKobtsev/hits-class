import { MenuItem, TextField } from '@mui/material';
import { Field } from 'components/uikit/Field';
import { FormError } from 'components/uikit/FormError';
import {
  Button,
  ButtonColor,
  ButtonWidth,
} from 'components/uikit/buttons/Button';
import { CustomModal } from 'components/uikit/modal/CustomModal';
import { Loading } from 'components/uikit/suspense/Loading';
import { useAdvancedForm } from 'helpers/form/useAdvancedForm';
import { requiredRule } from 'helpers/form/react-hook-form-helper';
import type { UserDto } from 'services/api/api-client.types';
import { queryClient } from 'services/api/query-client-helper';
import {useSendInvitationMutation} from "../../../../../services/api/api-client/InvitationQuery.ts";

type InviteTeamMemberForm = {
  studentId: string | null;
};

type InviteTeamMemberModalProps = {
  assignmentId: number;
  teamId: number;
  isOpen: boolean;
  onClose: () => void;
  students: UserDto[];
};

export const InviteTeamMemberModal = ({
                                     assignmentId,
                                     teamId,
                                     isOpen,
                                     onClose,
                                     students,
                                   }: InviteTeamMemberModalProps) => {
  const { mutateAsync, isPending } = useSendInvitationMutation(teamId);

  const form = useAdvancedForm<InviteTeamMemberForm>(
    async (data) => {
      await mutateAsync(data.studentId!);
      onClose();
    },
    {
      shouldResetOnSuccess: true,
      initialize: (f) => {
        f.register('studentId', { ...requiredRule() });
      },
      defaultValues: { studentId: null },
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
      title="Пригласить в команду"
    >
      <Loading loading={isPending}>
        <form onSubmit={form.handleSubmitDefault}>
          <Field title="Студент">
            <TextField
              select
              fullWidth
              size="small"
              value={form.watch('studentId') ?? ''}
              error={!!form.formState.errors.studentId}
              helperText={form.formState.errors.studentId?.message}
              onChange={(e) =>
                form.setValue('studentId', e.target.value || null, {
                  shouldValidate: true,
                })
              }
              data-test-id="InviteTeamMember-student"
            >
              {students.length === 0 ? (
                <MenuItem disabled value="">
                  Нет доступных студентов
                </MenuItem>
              ) : (
                students.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.legalName || s.email}
                    {s.groupNumber ? ` (${s.groupNumber})` : ''}
                  </MenuItem>
                ))
              )}
            </TextField>
          </Field>
          <FormError>{form.overallError || null}</FormError>
          <div style={{ marginTop: 16 }}>
            <Button
              title="Пригласить"
              type="submit"
              color={ButtonColor.Primary}
              width={ButtonWidth.Fullwidth}
              disabled={students.length === 0}
            />
          </div>
        </form>
      </Loading>
    </CustomModal>
  );
};
