import { Tabs, Tab } from '@mui/material';
import { useGetPublicationByIdQuery } from 'services/api/api-client/PublicationsQuery';
import { useGetMySubmissionQuery } from 'services/api/api-client/SubmissionQuery';
import { useGetCourseQuery } from 'services/api/api-client/CourseQuery';
import { useCourseRole } from 'pages/authorized/OneCoursePage/useCourseRole';
import type { TeamAssignmentPayload } from 'services/api/api-client.types';
import { TeamAssignmentView } from './TeamAssignmentView/TeamAssignmentView.tsx';
import styles from './TeamAssignmentPage.module.scss';
import { PublicCommentView } from '../AssignmentPage/PublicCommentView/PublicCommentView';
import { SubmissionPanel } from '../AssignmentPage/CreateSubmissionPanel/SubmissionPanel.tsx';
import { PrivateCommentView } from '../AssignmentPage/PrivateCommentView/PrivateCommentView.tsx';
import { TeamsViewAsTeacher } from './TeamsView/TeamsViewAsTeacher.tsx';
import { TeamsViewAsStudent } from './TeamsView/TeamsViewAsStudent.tsx';
import { Links } from '../../../application/constants/links.ts';

type TabValue = 'assignment' | 'submissions' | 'teams';

export const TeamAssignmentPage = () => {
  const params = Links.Authorized.TeamAssignmentRoutes.useParams();

  const { data: publication } = useGetPublicationByIdQuery(params.assignmentId);
  const { data: submission } = useGetMySubmissionQuery(params.assignmentId);
  const { data: course } = useGetCourseQuery(params.courseId);
  const role = useCourseRole(course);
  const isTeacher = role === 'teacher';

  if (!publication) return null;

  const payload = publication.publicationPayload as TeamAssignmentPayload;

  return (
    <div className={styles.page} data-test-id="TeamAssignmentPage">
      <div className={styles.tabsWrapper}>
        <Tabs
          value={params.queryParams.tab}
          onChange={(_, v: TabValue) => params.setQueryParams({ tab: v })}
          className={styles.tabs}
          data-test-id="AssignmentPage-tabs"
        >
          <Tab
            label="Задание"
            value="assignment"
            data-test-id="TeamAssignmentPage-tab-assignment"
          />
          <Tab
            label="Команды"
            value="teams"
            data-test-id="TeamAssignmentPage-tab-teams"
          />
          {isTeacher && (
            <Tab
              label="Работы"
              value="submissions"
              data-test-id="TeamAssignmentPage-tab-submissions"
            />
          )}
        </Tabs>
      </div>
      {params.queryParams.tab === 'assignment' && (
        <div className={styles.grid}>
          <div className={styles.left}>
            <TeamAssignmentView
              assignment={publication}
              submission={submission}
            />
            <PublicCommentView publicationId={params.assignmentId} />
          </div>
          {!isTeacher && (
            <div className={styles.right}>
              <SubmissionPanel
                assignmentId={params.assignmentId}
                submission={submission}
              />
              <PrivateCommentView
                assignmentId={params.assignmentId}
                comments={submission?.comments ?? []}
              />
            </div>
          )}
        </div>
      )}
      {params.queryParams.tab === 'teams' &&
        (isTeacher ? <TeamsViewAsTeacher /> : <TeamsViewAsStudent />)}
      {params.queryParams.tab === 'submissions' && isTeacher && (
        <div className={styles.submissionsLayout}></div>
      )}
    </div>
  );
};
