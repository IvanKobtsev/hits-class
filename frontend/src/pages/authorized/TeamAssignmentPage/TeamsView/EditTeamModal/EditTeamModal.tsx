import { Field } from 'components/uikit/Field';
import { Input } from 'components/uikit/inputs/Input';
import { CustomModal } from 'components/uikit/modal/CustomModal';
import { Loading } from 'components/uikit/suspense/Loading';
import styles from './EditTeamModal.module.scss';
import {
  getTeamForAssignmentQueryKey,
  getTeamsForAssignmentQueryKey,
  usePassCaptainRoleMutation,
  useGetTeamForAssignmentQuery,
} from '../../../../../services/api/api-client/TeamQuery.ts';
import AddMemberIcon from 'assets/icons/add-member.svg?react';
import {
  TeamAssignmentPayload,
  UserDto,
} from '../../../../../services/api/api-client.types.ts';
import { Button, Typography } from '@mui/material';
import { TeamMembersList, TeamStatus } from '../TeamCard/TeamCard.tsx';
import clsx from 'clsx';
import {
  disbandTeam,
  updateTeamName,
} from '../../../../../services/api/api-client/TeamClient.ts';
import { useRef, useState } from 'react';
import { ButtonColor } from '../../../../../components/uikit/buttons/Button.tsx';
import { Links } from 'application/constants/links.ts';
import { queryClient } from '../../../../../services/api/query-client-helper.ts';
import { useRerender } from '../../../../../helpers/useRerender.ts';
import { useGetCurrentUserInfoQuery } from '../../../../../services/api/api-client/UserQuery.ts';

type EditTeamModalProps = {
  assignmentId: number;
  teamId: number;
  isOpen: boolean;
  onClose: () => void;
  assignmentPayload: TeamAssignmentPayload;
  teacherView?: boolean;
};

export const EditTeamModal = ({
  assignmentId,
  teamId,
  isOpen,
  onClose,
  assignmentPayload,
  teacherView,
}: EditTeamModalProps) => {
  const params = Links.Authorized.TeamAssignmentRoutes.useParams();
  const [disbandOpen, setDisbandOpen] = useState(false);
  const [passCaptainRoleErrorOpen, setPassCaptainRoleErrorOpen] =
    useState(false);
  const { rerender } = useRerender();
  const nameInputRef = useRef<HTMLInputElement>(null!);
  const { data: me } = useGetCurrentUserInfoQuery();

  // const form = useAdvancedForm<EditTeamForm>(
  //   async (data) => {
  //     await mutateAsync({ name: data.name.trim() });
  //     onClose();
  //     await queryClient.invalidateQueries({
  //       queryKey:
  //         QueryFactory.TeamQuery.getTeamsForAssignmentQueryKey(assignmentId),
  //     });
  //   },
  //   { shouldResetOnSuccess: true },
  // );

  const teamQuery = useGetTeamForAssignmentQuery(assignmentId, teamId);
  const passCaptainRoleMutation = usePassCaptainRoleMutation(teamId);
  const canAssignCaptainRole =
    !!teamQuery.data && (teacherView || teamQuery.data.captain.id === me?.id);

  const handleAssignCaptainRole = async (member: UserDto) => {
    try {
      await passCaptainRoleMutation.mutateAsync(member.id);
      await queryClient.invalidateQueries({
        queryKey: getTeamsForAssignmentQueryKey(assignmentId),
      });
      await queryClient.invalidateQueries({
        queryKey: getTeamForAssignmentQueryKey({
          teamId,
          assignmentId,
        }),
      });
    } catch {
      setPassCaptainRoleErrorOpen(true);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={handleClose}
      isBlocking={false}
      maxWidth="lg"
      title="Редактировать команду"
    >
      <Loading loading={teamQuery.isLoading} doNotRenderChildrenWhileLoading>
        {teamQuery.data && (
          <>
            <Field title="Название команды">
              <div className={styles.nameInputWrapper}>
                <Input
                  ref={nameInputRef}
                  onInput={rerender}
                  className={styles.input}
                  testId="EditTeam-name"
                  defaultValue={teamQuery.data.name}
                />
                <Button
                  variant="contained"
                  data-test-id="CourseFeedTab-create-team"
                  className={clsx(styles.btnPrimary, styles.saveName)}
                  disabled={
                    nameInputRef.current?.value.trim() ===
                      teamQuery.data.name.trim() ||
                    nameInputRef.current?.value.trim() === '' ||
                    !nameInputRef.current
                  }
                  onClick={async () => {
                    await updateTeamName(
                      teamId,
                      nameInputRef.current.value.trim(),
                    );
                    await queryClient.invalidateQueries({
                      queryKey: getTeamsForAssignmentQueryKey(assignmentId),
                    });
                    await queryClient.invalidateQueries({
                      queryKey: getTeamForAssignmentQueryKey({
                        teamId,
                        assignmentId,
                      }),
                    });
                  }}
                >
                  Сохранить
                </Button>
              </div>
            </Field>
            <div className={styles.container}>
              <div className={styles.members}>
                <Button
                  variant="contained"
                  data-test-id="CourseFeedTab-create-team"
                  startIcon={<AddMemberIcon className={styles.icon} />}
                  className={clsx(styles.btnPrimary, styles.addToTeam)}
                  disabled={
                    teamQuery.data.members.length >=
                    (assignmentPayload.maxTeamSize ?? 100)
                  }
                >
                  {teacherView ? 'Добавить в команду' : 'Пригласить в команду'}
                </Button>
                <div className={styles.membersCount}>
                  Участников: {teamQuery.data.members.length}
                  {!!assignmentPayload.maxTeamSize &&
                  !assignmentPayload.areTeamsFrozen
                    ? `/${assignmentPayload.maxTeamSize}`
                    : null}
                </div>
              </div>
              <TeamStatus
                teamDto={teamQuery.data}
                payload={assignmentPayload}
              />
            </div>

            <div className={styles.teamMembers}>
              <TeamMembersList
                teamDto={teamQuery.data}
                payload={assignmentPayload}
                canAssignCaptainRole={canAssignCaptainRole}
                onAssignCaptainRole={handleAssignCaptainRole}
              />
            </div>
            <div className={styles.footer}>
              <Button
                variant="contained"
                data-test-id="CourseFeedTab-create-team"
                className={clsx(styles.btnPrimary, styles.red)}
                onClick={() => setDisbandOpen(true)}
              >
                {'Расформировать команду'}
              </Button>
            </div>
            <CustomModal
              isOpen={disbandOpen}
              isBlocking={false}
              title="Расформировать команду"
              onClose={() => setDisbandOpen(false)}
              buttons="ok-cancel"
              okButtonColor={ButtonColor.Danger}
              okButtonText={'Расформировать'}
              onButtonClick={async (btn: 'ok' | 'cancel') => {
                if (btn === 'ok') {
                  await disbandTeam(teamId);
                  params.setQueryParams({ teamId: undefined });
                  await queryClient.invalidateQueries({
                    queryKey: getTeamsForAssignmentQueryKey(assignmentId),
                  });
                } else setDisbandOpen(false);
              }}
            >
              <Typography>
                Вы уверены, что хотите расформировать команду?
                <br /> Это действие необратимо.
              </Typography>
            </CustomModal>
            <CustomModal
              isOpen={passCaptainRoleErrorOpen}
              isBlocking={false}
              title="Ошибка"
              onClose={() => setPassCaptainRoleErrorOpen(false)}
              buttons="ok"
              okButtonText="Понятно"
              onButtonClick={() => setPassCaptainRoleErrorOpen(false)}
            >
              <Typography>
                Вы не можете передавать роль капитана в режиме драфта
              </Typography>
            </CustomModal>
          </>
        )}
      </Loading>
    </CustomModal>
  );
};
