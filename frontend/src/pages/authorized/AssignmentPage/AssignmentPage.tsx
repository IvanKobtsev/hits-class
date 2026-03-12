import { useParams } from 'react-router';
import { useGetPublicationByIdQuery } from 'services/api/api-client/PublicationsQuery';
import { useGetMySubmissionQuery } from 'services/api/api-client/SubmissionQuery';
import { AssignmentView } from './AssignmentView/AssignmentView';
import { PrivateCommentView } from './PrivateCommentView/PrivateCommentView';
import { PublicCommentView } from './PublicCommentView/PublicCommentView';
import { SubmissionPanel } from './CreateSubmissionPanel/SubmissionPanel';
import styles from './AssignmentPage.module.scss';

export const AssignmentPage = () => {
  const { assignmentId } = useParams();
  const id = Number(assignmentId);

  const { data: publication } = useGetPublicationByIdQuery(id);
  const { data: submission } = useGetMySubmissionQuery(id);

  if (!publication) return null;

  return (
    <div className={styles.page} data-test-id="AssignmentPage">
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
    </div>
  );
};
