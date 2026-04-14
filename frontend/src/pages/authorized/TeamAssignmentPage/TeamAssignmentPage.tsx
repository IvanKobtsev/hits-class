import { useState } from 'react';
import { useParams } from 'react-router';
import { Tabs, Tab } from '@mui/material';
import { useGetPublicationByIdQuery } from 'services/api/api-client/PublicationsQuery';
import { useGetMySubmissionQuery } from 'services/api/api-client/SubmissionQuery';
import { useGetCourseQuery } from 'services/api/api-client/CourseQuery';
import { useCourseRole } from 'pages/authorized/OneCoursePage/useCourseRole';
import type {
  AssignmentPayload,
  TeamAssignmentPayload,
} from 'services/api/api-client.types';
import { TeamAssignmentView } from './TeamAssignmentView/TeamAssignmentView.tsx';
import styles from './TeamAssignmentPage.module.scss';
import { PublicCommentView } from '../AssignmentPage/PublicCommentView/PublicCommentView';
import { SubmissionPanel } from '../AssignmentPage/CreateSubmissionPanel/SubmissionPanel.tsx';
import { PrivateCommentView } from '../AssignmentPage/PrivateCommentView/PrivateCommentView.tsx';
import { Checkbox } from 'storybook/internal/components';
import { useSetFrozenStatusMutation } from '../../../services/api/api-client/TeamAssignmentQuery.ts';
import { queryClient } from '../../../services/api/query-client-helper.ts';
import { QueryFactory } from '../../../services/api';

type TabValue = 'assignment' | 'submissions' | 'teams';

export const TeamAssignmentPage = () => {
  const { assignmentId, courseId } = useParams();
  const id = Number(assignmentId);
  const cid = Number(courseId);

  const [activeTab, setActiveTab] = useState<TabValue>('assignment');
  const { mutateAsync } = useSetFrozenStatusMutation(id);

  const { data: publication } = useGetPublicationByIdQuery(id);
  const { data: submission } = useGetMySubmissionQuery(id);
  const { data: course } = useGetCourseQuery(cid);
  const role = useCourseRole(course);
  const isTeacher = role === 'teacher';

  if (!publication) return null;

  const payload = publication.publicationPayload as TeamAssignmentPayload;

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

      {activeTab === 'teams' && (
        <div className={styles.layout}>
          {!isTeacher && <div className={styles.invites}></div>}
          {!isTeacher && <h2 className={styles.invites}>Команды</h2>}
          {isTeacher && (
            <div
              className={styles.freezeTeams}
              onClick={async () => {
                await mutateAsync(!payload.areTeamsFrozen);
                await queryClient.invalidateQueries({
                  queryKey:
                    QueryFactory.PublicationsQuery.getPublicationByIdQueryKey(
                      id,
                    ),
                });
              }}
            >
              <Checkbox checked={payload.areTeamsFrozen} />
              Заморозить команды
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
