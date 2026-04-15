import { Button } from '@mui/material';
import styles from '../TeamAssignmentPage.module.scss';
import TeamAssignmentIcon from 'assets/icons/team-assignment.svg?react';
import { useGetTeamsForAssignmentQuery } from '../../../../services/api/api-client/TeamQuery.ts';
import { useGetPublicationByIdQuery } from '../../../../services/api/api-client/PublicationsQuery.ts';
import {
  TeamAssignmentPayload,
  TeamDistributionType,
} from '../../../../services/api/api-client.types.ts';
import { useParams } from 'react-router';
import { TeamCard } from './TeamCard/TeamCard.tsx';
import { useState } from 'react';
import { CreateTeamModal } from './CreateTeamModal/CreateTeamModal.tsx';
import { useGetCurrentUserInfoQuery } from '../../../../services/api/api-client/UserQuery.ts';
import { Loading } from '../../../../components/uikit/suspense/Loading.tsx';
import { Links } from 'application/constants/links.ts';
import { EditTeamModal } from './EditTeamModal/EditTeamModal.tsx';

export function TeamsViewAsStudent() {
  const params = Links.Authorized.TeamAssignmentRoutes.useParams();
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const teamsQuery = useGetTeamsForAssignmentQuery(params.assignmentId);
  const { data: me } = useGetCurrentUserInfoQuery();

  const { data: publication } = useGetPublicationByIdQuery(params.assignmentId);

  if (!publication || !teamsQuery.data) return <Loading loading={true} />;

  const payload = publication.publicationPayload as TeamAssignmentPayload;

  const myTeamId = teamsQuery.data?.find((t) =>
    t.members.some((m) => m.id === me?.id),
  )?.id;

  return (
    <div className={styles.layout}>
      <h2 className={styles.header}>Приглашения</h2>
      <div className={styles.invites}></div>
      {payload.distributionType === TeamDistributionType.Free &&
      !payload.areTeamsFrozen &&
      !myTeamId ? (
        <Button
          variant="contained"
          onClick={() => setShowCreateTeamModal(true)}
          data-test-id="CourseFeedTab-create-team"
          startIcon={<TeamAssignmentIcon className={styles.icon} />}
          className={styles.btnPrimary}
        >
          Создать команду
        </Button>
      ) : null}
      <h2 className={styles.header}>Команды</h2>
      <Loading loading={teamsQuery.isLoading} doNotWrapChildren>
        {teamsQuery.data?.length === 0 && 'Нет команд'}
        <div className={styles.teamsContainer}>
          {myTeamId && (
            <TeamCard
              key={myTeamId}
              teamDto={teamsQuery.data.find((t) => t.id === myTeamId)!}
              assignment={publication}
              onClick={() => {
                if (!payload.areTeamsFrozen)
                  params.setQueryParams({ teamId: myTeamId });
              }}
              myTeam
            />
          )}
          {teamsQuery.data
            ?.filter((t) => t.id !== myTeamId)
            .map((t) => (
              <TeamCard key={t.id} teamDto={t} assignment={publication} />
            ))}
        </div>
      </Loading>
      <CreateTeamModal
        assignmentId={params.assignmentId}
        isOpen={showCreateTeamModal}
        onClose={() => setShowCreateTeamModal(false)}
      />
      {params.queryParams.teamId && (
        <EditTeamModal
          assignmentId={params.assignmentId}
          teamId={params.queryParams.teamId}
          isOpen={!!params.queryParams.teamId}
          onClose={() => params.setQueryParams({ teamId: undefined })}
          assignmentPayload={payload}
        />
      )}
    </div>
  );
}
