import styles from '../TeamAssignmentPage.module.scss';
import TeamAssignmentIcon from 'assets/icons/team-assignment.svg?react';
import { useGetTeamsForAssignmentQuery } from '../../../../services/api/api-client/TeamQuery.ts';
import { useGetPublicationByIdQuery } from '../../../../services/api/api-client/PublicationsQuery.ts';
import { TeamAssignmentPayload } from '../../../../services/api/api-client.types.ts';
import { useParams } from 'react-router';
import { TeamCard } from './TeamCard/TeamCard.tsx';

export function TeamsViewAsStudent() {
  const { assignmentId, courseId } = useParams();
  const id = Number(assignmentId);
  const cid = Number(courseId);

  const { data: publication } = useGetPublicationByIdQuery(id);

  if (!publication) return null;

  const payload = publication.publicationPayload as TeamAssignmentPayload;

  const teamsQuery = useGetTeamsForAssignmentQuery(id);

  return (
    <div className={styles.layout}>
      <h2 className={styles.header}>Приглашения</h2>
      <div className={styles.invites}></div>
      <h2 className={styles.header}>Команды</h2>
      <div className={styles.teamsContainer}>
        {teamsQuery.data?.map((t) => (
          <TeamCard teamDto={t} assignment={publication} />
        ))}
      </div>
    </div>
  );
}
