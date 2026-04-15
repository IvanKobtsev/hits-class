import { Button, Checkbox } from '@mui/material';
import TeamAssignmentIcon from 'assets/icons/team-assignment.svg?react';
import styles from '../TeamAssignmentPage.module.scss';
import { useSetFrozenStatusMutation } from 'services/api/api-client/TeamAssignmentQuery';
import { useGetTeamsForAssignmentQuery } from 'services/api/api-client/TeamQuery.ts';
import { TeamAssignmentPayload } from '../../../../services/api/api-client.types.ts';
import { useGetPublicationByIdQuery } from 'services/api/api-client/PublicationsQuery.ts';
import { useGetCourseQuery } from 'services/api/api-client/CourseQuery.ts';
import { queryClient } from 'services/api/query-client-helper.ts';
import { QueryFactory } from '../../../../services/api';
import { useParams } from 'react-router';
import { useState } from 'react';
import { CreateTeamAsTeacherModal } from './CreateTeamModal/CreateTeamAsTeacherModal.tsx';
import { TeamCard } from './TeamCard/TeamCard.tsx';

export function TeamsViewAsTeacher() {
  const { assignmentId, courseId } = useParams();
  const id = Number(assignmentId);
  const cid = Number(courseId);

  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const { mutateAsync } = useSetFrozenStatusMutation(id);
  const teamsQuery = useGetTeamsForAssignmentQuery(id);
  const { data: publication } = useGetPublicationByIdQuery(id);
  const { data: course } = useGetCourseQuery(cid);

  if (!publication) return null;

  const payload = publication.publicationPayload as TeamAssignmentPayload;

  return (
    <div className={styles.layout}>
      <div className={styles.teacherActions}>
        <Button
          variant="contained"
          onClick={() => setShowCreateTeamModal(true)}
          data-test-id="CourseFeedTab-create-team"
          startIcon={<TeamAssignmentIcon className={styles.icon} />}
          className={styles.btnPrimary}
        >
          Создать команду
        </Button>
        <div
          className={styles.freezeTeams}
          onClick={async () => {
            await mutateAsync(!payload.areTeamsFrozen);
            await queryClient.invalidateQueries({
              queryKey:
                QueryFactory.PublicationsQuery.getPublicationByIdQueryKey(id),
            });
          }}
        >
          <Checkbox checked={payload.areTeamsFrozen} />
          Заморозить команды
        </div>
      </div>
      <h2 className={styles.header}>Команды</h2>
      <div className={styles.teamsContainer}>
        {teamsQuery.data?.map((t) => (
          <TeamCard key={t.id} teamDto={t} assignment={publication} />
        ))}
      </div>
      <CreateTeamAsTeacherModal
        assignmentId={id}
        isOpen={showCreateTeamModal}
        onClose={() => setShowCreateTeamModal(false)}
        students={course?.students ?? []}
      />
    </div>
  );
}
