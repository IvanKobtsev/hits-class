import { useParams } from 'react-router';
import { useGetPublicationByIdQuery } from 'services/api/api-client/PublicationsQuery';
import { useGetMySubmissionQuery } from 'services/api/api-client/SubmissionQuery';
import type { AssignmentDto } from 'services/api/api-client.types';
import { AssignmentView } from './AssignmentView/AssignmentView';
import { PrivateCommentView } from './PrivateCommentView/PrivateCommentView';
import { PublicCommentView } from './PublicCommentView/PublicCommentView';
import { SubmissionPanel } from './CreateSubmissionPanel/SubmissionPanel';

export const AssignmentPage = () => {
  const { assignmentId } = useParams();
  const id = Number(assignmentId);

  const { data: publication } = useGetPublicationByIdQuery(id);
  const { data: submission } = useGetMySubmissionQuery(id);

  if (!publication) return null;

  return (
    <div data-test-id="AssignmentPage">
      <AssignmentView
        assignment={publication as unknown as AssignmentDto}
        submission={submission}
      />
      <SubmissionPanel />
      <PrivateCommentView />
      <PublicCommentView />
    </div>
  );
};
