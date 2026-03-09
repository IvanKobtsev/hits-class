import { useParams } from 'react-router';
import { useGetMySubmissionQuery } from 'services/api/api-client/SubmissionQuery';
import type { AssignmentDto } from 'services/api/api-client.types';
import { AssignmentView } from './AssignmentView/AssignmentView';
import { SubmissionPanel } from './SubmissionPanel/SubmissionPanel';
import { PrivateCommentView } from './PrivateCommentView/PrivateCommentView';
import { PublicCommentView } from './PublicCommentView/PublicCommentView';

// TODO: replace with useGetAssignmentQuery once implemented
function useMockAssignmentQuery(_id: number): { data: AssignmentDto | undefined } {
  return {
    data: {
      id: _id,
      title: 'Домашнее задание (mock)',
      description: null,
      author: {
        id: 'mock-author',
        email: 'teacher@example.com',
        legalName: 'Иван Петров',
        groupNumber: null,
      },
      deadlineUTC: null,
      createdAtUTC: new Date(),
      lastUpdatedAtUTC: null,
      attachments: [],
      comments: [],
    },
  };
}

export const AssignmentPage = () => {
  const { assignmentId } = useParams();
  const id = Number(assignmentId);

  const { data: assignment } = useMockAssignmentQuery(id);
  const { data: submission } = useGetMySubmissionQuery(id);

  if (!assignment) return null;

  return (
    <div data-test-id="AssignmentPage">
      <AssignmentView assignment={assignment} submission={submission} />
      <SubmissionPanel />
      <PrivateCommentView />
      <PublicCommentView />
    </div>
  );
};
