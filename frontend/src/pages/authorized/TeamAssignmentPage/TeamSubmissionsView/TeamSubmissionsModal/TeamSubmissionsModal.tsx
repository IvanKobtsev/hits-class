import { CustomModal } from 'components/uikit/modal/CustomModal';
import { Loading } from 'components/uikit/suspense/Loading';
import styles from './TeamSubmissionsModal.module.scss';
import {
  MarkDto,
  MarkType,
  TeamAssignmentPayload,
  TeamSubmissionDto,
  UserWithMarkDto,
} from '../../../../../services/api/api-client.types.ts';
import { Button } from '@mui/material';
import clsx from 'clsx';
import { Links } from 'application/constants/links.ts';
import { queryClient } from '../../../../../services/api/query-client-helper.ts';
import { useGetTeamSubmissionQuery } from '../../../../../services/api/api-client/SubmissionQuery.ts';
import { TeamMemberEntry } from '../../TeamsView/TeamCard/TeamMemberEntry/TeamMemberEntry.tsx';
import {
  AdvancedFormReturnType,
  useAdvancedForm,
} from '../../../../../helpers/form/useAdvancedForm.ts';
import { markTeamMember } from '../../../../../services/api/api-client/SubmissionClient.ts';
import { QueryFactory } from '../../../../../services/api';
import { AttachmentsList } from '../../../OneCoursePage/PublicatonsList/PublicationListItem/AttachmentsList/AttachmentsList.tsx';
import { useState } from 'react';
import { Field } from 'components/uikit/Field';
import { Input } from 'components/uikit/inputs/Input';

type TeamSubmissionsModalProps = {
  assignmentId: number;
  teamId: number;
  isOpen: boolean;
  onClose: () => void;
  assignmentPayload: TeamAssignmentPayload;
  teacherView?: boolean;
};

export const TeamSubmissionsModal = ({
  teamId,
  isOpen,
  onClose,
  assignmentPayload,
}: TeamSubmissionsModalProps) => {
  const teamSubmissionQuery = useGetTeamSubmissionQuery(teamId);
  const [markAllOpen, setMarkAllOpen] = useState(false);
  const [markAllValue, setMarkAllValue] = useState('');

  const form = useAdvancedForm<Record<string, string>>(async (data) => {
    if (!teamSubmissionQuery.data) return;

    for (const teamMember of teamSubmissionQuery.data.members) {
      const mark = data[teamMember.user.id];

      if (!mark) continue;

      await markTeamMember(teamId, teamMember.user.id, {
        mark,
        markComment: null,
        markType: assignmentPayload.markType,
      });
      await queryClient.invalidateQueries({
        queryKey:
          QueryFactory.SubmissionQuery.getTeamSubmissionQueryKey(teamId),
      });
    }
  });

  const handleClose = () => {
    onClose();
  };

  const applyMarkToAll = () => {
    if (!teamSubmissionQuery.data) return;
    const value = markAllValue.trim();
    if (!value) return;
    const memberIds = [
      teamSubmissionQuery.data.captain.id,
      ...teamSubmissionQuery.data.members
        .map((m) => m.user.id)
        .filter((id) => id !== teamSubmissionQuery.data!.captain.id),
    ];
    for (const id of memberIds) {
      form.setValue(id, value, { shouldDirty: true, shouldValidate: true });
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={handleClose}
      isBlocking={false}
      maxWidth="lg"
      title="Оценить команду"
    >
      <Loading
        loading={teamSubmissionQuery.isLoading}
        doNotRenderChildrenWhileLoading
      >
        {teamSubmissionQuery.data && (
          <form onSubmit={form.handleSubmitDefault}>
            <div className={styles.teamMembers}>
              <TeamMembersWithMarksList
                teamSubmissionDto={teamSubmissionQuery.data}
                payload={assignmentPayload}
                hideExtraSlots
                form={form}
              />
            </div>
            <AttachmentsList
              attachments={teamSubmissionQuery.data?.attachments}
              onError={() => null}
            />
            <div className={styles.footer}>
              <Button
                variant="contained"
                type="button"
                data-test-id="TeamSubmissions-mark-all-button"
                className={clsx(styles.btnPrimary, styles.markAll)}
                onClick={() => {
                  setMarkAllValue('');
                  setMarkAllOpen(true);
                }}
              >
                {'Поставить оценку всей команде'}
              </Button>
              <Button
                variant="contained"
                data-test-id="TeamSubmissions-save-button"
                className={clsx(styles.btnPrimary, styles.red)}
                disabled={!form.formState.isDirty}
                type={'submit'}
              >
                {'Сохранить'}
              </Button>
            </div>
          </form>
        )}
      </Loading>
      <CustomModal
        isOpen={markAllOpen}
        isBlocking={false}
        title="Поставить оценку всей команде"
        onClose={() => setMarkAllOpen(false)}
        buttons="ok-cancel"
        okButtonText="Применить"
        onButtonClick={(btn: 'ok' | 'cancel') => {
          if (btn === 'ok') {
            applyMarkToAll();
          }
          setMarkAllOpen(false);
        }}
      >
        <Field title="Оценка">
          <Input
            autoFocus
            value={markAllValue}
            onChange={(e) => setMarkAllValue(e.target.value)}
            data-test-id="TeamSubmissions-mark-all-input"
          />
        </Field>
      </CustomModal>
    </CustomModal>
  );
};

export function TeamMembersWithMarksList({
  teamSubmissionDto,
  color,
  payload,
  hideExtraSlots,
  form,
}: {
  teamSubmissionDto: TeamSubmissionDto;
  color?: 'red' | 'green' | 'yellow' | 'blue';
  payload: TeamAssignmentPayload;
  hideExtraSlots?: boolean;
  form: AdvancedFormReturnType<Record<string, string>>;
}) {
  const numberOfMembers = teamSubmissionDto.members.length;
  const numberOfSlots = !payload.maxTeamSize
    ? numberOfMembers > 5
      ? numberOfMembers
      : 5
    : payload.maxTeamSize;
  const members: (UserWithMarkDto | null)[] = [
    ...teamSubmissionDto.members,
    ...(!payload.areTeamsFrozen && !hideExtraSlots
      ? Array.from({ length: numberOfSlots - numberOfMembers }, () => null)
      : []),
  ].filter((m) => !m || m.user.id !== teamSubmissionDto.captain.id);

  return (
    <>
      <TeamMemberEntry
        member={teamSubmissionDto.captain}
        color={color}
        form={form}
        mark={
          teamSubmissionDto.members.find(
            (m) => m.user.id === teamSubmissionDto.captain.id,
          )?.mark ?? null
        }
        isCaptain
      />
      {(members.length === 0 && (payload.areTeamsFrozen || hideExtraSlots)) || (
        <div className={styles.otherMembers}>
          {members.map((member) => (
            <TeamMemberEntry
              member={member?.user}
              color={color}
              form={form}
              mark={member?.mark}
            />
          ))}
        </div>
      )}
    </>
  );
}
