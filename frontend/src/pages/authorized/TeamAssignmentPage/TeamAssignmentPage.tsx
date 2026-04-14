import { useState } from 'react';
import { useParams } from 'react-router';
import { Tabs, Tab } from '@mui/material';
import { useGetPublicationByIdQuery } from 'services/api/api-client/PublicationsQuery';
import { useGetMySubmissionQuery } from 'services/api/api-client/SubmissionQuery';
import { useGetCourseQuery } from 'services/api/api-client/CourseQuery';
import { useCourseRole } from 'pages/authorized/OneCoursePage/useCourseRole';
import type { AssignmentPayload } from 'services/api/api-client.types';
import { TeamAssignmentView } from './TeamAssignmentView/TeamAssignmentView.tsx';
import styles from './TeamAssignmentPage.module.scss';
import { PublicCommentView } from '../AssignmentPage/PublicCommentView/PublicCommentView';
import { SubmissionPanel } from '../AssignmentPage/CreateSubmissionPanel/SubmissionPanel.tsx';
import { PrivateCommentView } from '../AssignmentPage/PrivateCommentView/PrivateCommentView.tsx';

type TabValue = 'assignment' | 'submissions';

export const TeamAssignmentPage = () => {
  const { assignmentId, courseId } = useParams();
  const id = Number(assignmentId);
  const cid = Number(courseId);

  const [activeTab, setActiveTab] = useState<TabValue>('assignment');

  const { data: publication } = useGetPublicationByIdQuery(id);
  const { data: submission } = useGetMySubmissionQuery(id);
  const { data: course } = useGetCourseQuery(cid);
  const role = useCourseRole(course);
  const isTeacher = role === 'teacher';

  if (!publication) return null;

  return (
    <div className={styles.page} data-test-id="TeamAssignmentPage">
      {isTeacher && (
        <div className={styles.tabsWrapper}>
          <Tabs
            value={activeTab}
            onChange={(_, v: TabValue) => setActiveTab(v)}
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
            <Tab
              label="Работы"
              value="submissions"
              data-test-id="TeamAssignmentPage-tab-submissions"
            />
          </Tabs>
        </div>
      )}

      {activeTab === 'assignment' && (
        <div className={styles.layout}>
          <div className={styles.left}>
            <TeamAssignmentView
              assignment={publication}
              submission={submission}
            />
            <PublicCommentView publicationId={id} />
          </div>
          {!isTeacher && (
            <div className={styles.right}>
              <SubmissionPanel assignmentId={id} submission={submission} />
              <PrivateCommentView
                assignmentId={id}
                comments={submission?.comments ?? []}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'submissions' && isTeacher && (
        <div className={styles.submissionsLayout}></div>
      )}
    </div>
  );
};
