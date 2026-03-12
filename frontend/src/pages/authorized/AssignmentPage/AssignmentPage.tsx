import { useState } from 'react';
import { useParams } from 'react-router';
import { Tabs, Tab } from '@mui/material';
import { QueryFactory } from 'services/api';
import { useGetPublicationByIdQuery } from 'services/api/api-client/PublicationsQuery';
import { useGetMySubmissionQuery } from 'services/api/api-client/SubmissionQuery';
import { useCourseRole } from 'pages/authorized/OneCoursePage/useCourseRole';
import { AssignmentView } from './AssignmentView/AssignmentView';
import { PrivateCommentView } from './PrivateCommentView/PrivateCommentView';
import { PublicCommentView } from './PublicCommentView/PublicCommentView';
import { SubmissionPanel } from './CreateSubmissionPanel/SubmissionPanel';
import { StudentSubmissionsTab } from './StudentSubmissionsTab/StudentSubmissionsTab';
import styles from './AssignmentPage.module.scss';

type TabValue = 'assignment' | 'submissions';

export const AssignmentPage = () => {
  const { courseId, assignmentId } = useParams();
  const id = Number(assignmentId);
  const numCourseId = Number(courseId);

  const [activeTab, setActiveTab] = useState<TabValue>('assignment');

  const { data: course } = QueryFactory.CourseQuery.useGetCourseQuery(numCourseId);
  const role = useCourseRole(course);
  const isTeacher = role === 'teacher';

  const { data: publication } = useGetPublicationByIdQuery(id);
  const { data: submission } = useGetMySubmissionQuery(id);

  if (!publication) return null;

  return (
    <div className={styles.page} data-test-id="AssignmentPage">
      {isTeacher && (
        <div className={styles.tabsWrapper}>
          <Tabs
            value={activeTab}
            onChange={(_, v: TabValue) => setActiveTab(v)}
            className={styles.tabs}
            data-test-id="AssignmentPage-tabs"
          >
            <Tab label="Задание" value="assignment" data-test-id="AssignmentPage-tab-assignment" />
            <Tab label="Работы учащихся" value="submissions" data-test-id="AssignmentPage-tab-submissions" />
          </Tabs>
        </div>
      )}

      {activeTab === 'assignment' && (
        <div className={styles.layout}>
          <div className={styles.left}>
            <AssignmentView
              assignment={publication}
              submission={submission}
            />
            <PublicCommentView />
          </div>
          <div className={styles.right}>
            <SubmissionPanel assignmentId={id} submission={submission} />
            <PrivateCommentView />
          </div>
        </div>
      )}

      {activeTab === 'submissions' && isTeacher && (
        <div className={styles.submissionsLayout}>
          <StudentSubmissionsTab assignmentId={id} />
        </div>
      )}
    </div>
  );
};
