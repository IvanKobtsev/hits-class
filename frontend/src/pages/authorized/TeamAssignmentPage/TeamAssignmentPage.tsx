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
import { TeamSubmissionsView } from './TeamSubmissionsView/TeamSubmissionsView.tsx';
import { PeerReviewMappingsPanel } from 'pages/authorized/OneCoursePage/PeerReviewMappingsPanel/PeerReviewMappingsPanel';
import { JuryReviewTab } from '../AssignmentPage/JuryReviewTab/JuryReviewTab';

type TabValue = 'assignment' | 'submissions' | 'teams' | 'peer-review' | 'my-reviews';

export const TeamAssignmentPage = () => {
  const params = Links.Authorized.TeamAssignmentRoutes.useParams();

  const { data: publication } = useGetPublicationByIdQuery(params.assignmentId);
  const { data: submission } = useGetMySubmissionQuery(params.assignmentId);
  const { data: course } = useGetCourseQuery(params.courseId);
  const role = useCourseRole(course);
  const isTeacher = role === 'teacher';

  if (!publication) return null;

  const payload = publication.publicationPayload as TeamAssignmentPayload;
  const isPeerReviewEnabled = payload?.isPeerReviewEnabled;

  return (
    <div className={styles.page} data-test-id="TeamAssignmentPage">
      <div className={styles.tabsWrapper}>
        <Tabs
          value={params.queryParams.tab ?? 'assignment'}
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
          {isTeacher && isPeerReviewEnabled && (
            <Tab
              label="P2P оценка"
              value="peer-review"
              data-test-id="TeamAssignmentPage-tab-peer-review"
            />
          )}
          {!isTeacher && isPeerReviewEnabled && (
            <Tab
              label="Мои проверки"
              value="my-reviews"
              data-test-id="TeamAssignmentPage-tab-my-reviews"
            />
          )}
        </Tabs>
      </div>
      {(params.queryParams.tab ?? 'assignment') === 'assignment' && (
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
        <TeamSubmissionsView />
      )}
      {params.queryParams.tab === 'peer-review' && isTeacher && isPeerReviewEnabled && (
        <div className={styles.submissionsLayout}>
          <PeerReviewMappingsPanel
            publicationId={params.assignmentId}
            courseId={params.courseId}
          />
        </div>
      )}
      {params.queryParams.tab === 'my-reviews' && !isTeacher && isPeerReviewEnabled && (
        <div className={styles.submissionsLayout}>
          <JuryReviewTab
            assignmentId={params.assignmentId}
            criteria={publication.criteria}
            minMark={payload?.minMark ?? null}
            maxMark={payload?.maxMark ?? null}
          />
        </div>
      )}
    </div>
  );
};
