import { useState } from 'react';
import { useParams } from 'react-router';
import { Tabs, Tab } from '@mui/material';
import { useGetPublicationByIdQuery } from 'services/api/api-client/PublicationsQuery';
import { useGetMySubmissionQuery } from 'services/api/api-client/SubmissionQuery';
import { useGetCourseQuery } from 'services/api/api-client/CourseQuery';
import { useCourseRole } from 'pages/authorized/OneCoursePage/useCourseRole';
import type { AssignmentPayload } from 'services/api/api-client.types';
import { AssignmentView } from './AssignmentView/AssignmentView';
import { DeadlineHelper } from './DeadlineHelper/DeadlineHelper';
import { PrivateCommentView } from './PrivateCommentView/PrivateCommentView';
import { PublicCommentView } from './PublicCommentView/PublicCommentView';
import { SubmissionPanel } from './CreateSubmissionPanel/SubmissionPanel';
import { StudentSubmissionsTab } from './StudentSubmissionsTab/StudentSubmissionsTab';
import { PeerReviewMappingsPanel } from 'pages/authorized/OneCoursePage/PeerReviewMappingsPanel/PeerReviewMappingsPanel';
import { JuryReviewTab } from './JuryReviewTab/JuryReviewTab';
import styles from './AssignmentPage.module.scss';

type TabValue = 'assignment' | 'submissions' | 'peer-review' | 'my-reviews';

export const AssignmentPage = () => {
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

  const assignmentPayload = publication.publicationPayload as AssignmentPayload;
  const isPeerReviewEnabled = assignmentPayload?.isPeerReviewEnabled;
  const showTabs = isTeacher || isPeerReviewEnabled;

  return (
    <div className={styles.page} data-test-id="AssignmentPage">
      {showTabs && (
        <div className={styles.tabsWrapper}>
          <Tabs
            value={activeTab}
            onChange={(_, v: TabValue) => setActiveTab(v)}
            className={styles.tabs}
            data-test-id="AssignmentPage-tabs"
          >
            <Tab label="Задание" value="assignment" data-test-id="AssignmentPage-tab-assignment" />
            {isTeacher && (
              <Tab label="Работы учащихся" value="submissions" data-test-id="AssignmentPage-tab-submissions" />
            )}
            {isTeacher && isPeerReviewEnabled && (
              <Tab label="P2P оценка" value="peer-review" data-test-id="AssignmentPage-tab-peer-review" />
            )}
            {!isTeacher && isPeerReviewEnabled && (
              <Tab label="Мои проверки" value="my-reviews" data-test-id="AssignmentPage-tab-my-reviews" />
            )}
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
            <PublicCommentView publicationId={id} />
          </div>
          {!isTeacher && (
            <div className={styles.right}>
              <SubmissionPanel
                assignmentId={id}
                submission={submission}
                deadlineUtc={(publication.publicationPayload as AssignmentPayload)?.deadlineUtc ?? null}
                latestDate={(publication.publicationPayload as AssignmentPayload)?.deadlineCriteria?.latePenalty?.latestDate ?? null}
              />
              <DeadlineHelper
                deadlineUtc={(publication.publicationPayload as AssignmentPayload)?.deadlineUtc ?? null}
                deadlineCriteria={(publication.publicationPayload as AssignmentPayload)?.deadlineCriteria ?? null}
              />
              <PrivateCommentView assignmentId={id} comments={submission?.comments ?? []} />
            </div>
          )}
        </div>
      )}

      {activeTab === 'submissions' && isTeacher && (
        <div className={styles.submissionsLayout}>
          <StudentSubmissionsTab
            assignmentId={id}
            deadlineUtc={assignmentPayload?.deadlineUtc ?? null}
            latestDate={assignmentPayload?.deadlineCriteria?.latePenalty?.latestDate ?? null}
            minMark={assignmentPayload?.minMark ?? null}
            maxMark={assignmentPayload?.maxMark ?? null}
            criteria={publication.criteria}
            isPeerReviewEnabled={isPeerReviewEnabled}
          />
        </div>
      )}

      {activeTab === 'peer-review' && isTeacher && isPeerReviewEnabled && (
        <div className={styles.submissionsLayout}>
          <PeerReviewMappingsPanel
            publicationId={id}
            courseId={cid}
          />
        </div>
      )}

      {activeTab === 'my-reviews' && !isTeacher && isPeerReviewEnabled && (
        <div className={styles.submissionsLayout}>
          <JuryReviewTab
            assignmentId={id}
            criteria={publication.criteria}
            minMark={assignmentPayload?.minMark ?? null}
            maxMark={assignmentPayload?.maxMark ?? null}
          />
        </div>
      )}
    </div>
  );
};
