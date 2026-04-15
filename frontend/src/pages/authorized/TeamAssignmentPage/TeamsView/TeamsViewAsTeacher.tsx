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
import { Loading } from '../../../../components/uikit/suspense/Loading.tsx';
import { EditTeamModal } from './EditTeamModal/EditTeamModal.tsx';
import { Links } from '../../../../application/constants/links.ts';

export function TeamsViewAsTeacher() {
  const params = Links.Authorized.TeamAssignmentRoutes.useParams();

  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const { mutateAsync } = useSetFrozenStatusMutation(params.assignmentId);
  const teamsQuery = useGetTeamsForAssignmentQuery(params.assignmentId);
  const { data: publication } = useGetPublicationByIdQuery(params.assignmentId);
  const { data: course } = useGetCourseQuery(params.courseId);

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
          disabled={payload.areTeamsFrozen}
        >
          Создать команду
        </Button>
        <div
          className={styles.freezeTeams}
          onClick={async () => {
            await mutateAsync(!payload.areTeamsFrozen);
            await queryClient.invalidateQueries({
              queryKey:
                QueryFactory.PublicationsQuery.getPublicationByIdQueryKey(
                  params.assignmentId,
                ),
            });
          }}
        >
          <Checkbox checked={payload.areTeamsFrozen} />
          Заморозить команды
        </div>
      </div>
      <h2 className={styles.header}>Команды</h2>
      <Loading loading={teamsQuery.isLoading} doNotWrapChildren>
        {teamsQuery.data?.length === 0 && 'Нет команд'}
        <div className={styles.teamsContainer}>
          {teamsQuery.data?.map((t) => (
            <TeamCard
              key={t.id}
              teamDto={t}
              assignment={publication}
              onClick={
                !payload.areTeamsFrozen
                  ? () => params.setQueryParams({ teamId: t.id })
                  : undefined
              }
            />
          ))}
        </div>
      </Loading>
      <CreateTeamAsTeacherModal
        assignmentId={params.assignmentId}
        isOpen={showCreateTeamModal}
        onClose={() => setShowCreateTeamModal(false)}
        students={course?.students ?? []}
      />
      {params.queryParams.teamId && (
        <EditTeamModal
          assignmentId={params.assignmentId}
          teamId={params.queryParams.teamId}
          isOpen={!!params.queryParams.teamId}
          onClose={() => params.setQueryParams({ teamId: undefined })}
          assignmentPayload={payload}
          teacherView
        />
      )}
    </div>
  );
}
