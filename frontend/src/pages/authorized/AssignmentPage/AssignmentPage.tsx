import { useParams } from 'react-router';
import { useGetPublicationByIdQuery } from 'services/api/api-client/PublicationsQuery';
import { useGetMySubmissionQuery } from 'services/api/api-client/SubmissionQuery';
import { useGetCourseQuery } from 'services/api/api-client/CourseQuery';
import { useCourseRole } from 'pages/authorized/OneCoursePage/useCourseRole';
import { AssignmentView } from './AssignmentView/AssignmentView';
import { PrivateCommentView } from './PrivateCommentView/PrivateCommentView';
import { PublicCommentView } from './PublicCommentView/PublicCommentView';
import { SubmissionPanel } from './CreateSubmissionPanel/SubmissionPanel';
import styles from './AssignmentPage.module.scss';

export const AssignmentPage = () => {
  const { assignmentId, courseId } = useParams();
  const id = Number(assignmentId);
  const cid = Number(courseId);

  const { data: publication } = useGetPublicationByIdQuery(id);
  const { data: submission } = useGetMySubmissionQuery(id);
  const { data: course } = useGetCourseQuery(cid);
  const role = useCourseRole(course);
  const isTeacher = role === 'teacher';

  if (!publication) return null;

  return (
    <div className={styles.page} data-test-id="AssignmentPage">
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
            <SubmissionPanel assignmentId={id} submission={submission} />
            <PrivateCommentView assignmentId={id} comments={submission?.comments ?? []} />
          </div>
        )}
      </div>
    </div>
  );
};
