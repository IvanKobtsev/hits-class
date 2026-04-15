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

export function TeamsViewAsStudent() {
  const { assignmentId } = useParams();
  const id = Number(assignmentId);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const teamsQuery = useGetTeamsForAssignmentQuery(id);

  const { data: publication } = useGetPublicationByIdQuery(id);

  if (!publication) return null;

  const payload = publication.publicationPayload as TeamAssignmentPayload;

  return (
    <div className={styles.layout}>
      <h2 className={styles.header}>Приглашения</h2>
      <div className={styles.invites}></div>
      {payload.distributionType === TeamDistributionType.Free &&
      !payload.areTeamsFrozen ? (
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
      <div className={styles.teamsContainer}>
        {teamsQuery.data?.map((t) => (
          <TeamCard key={t.id} teamDto={t} assignment={publication} />
        ))}
      </div>
      <CreateTeamModal
        assignmentId={id}
        isOpen={showCreateTeamModal}
        onClose={() => setShowCreateTeamModal(false)}
      />
    </div>
  );
}
