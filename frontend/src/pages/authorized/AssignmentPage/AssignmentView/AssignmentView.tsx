import { AssignmentDto, SubmissionDto } from 'services/api/api-client.types';

export type AssignmentViewProps = {
  assignment: AssignmentDto;
  submission?: SubmissionDto | null;
};

export const AssignmentView = (_props: AssignmentViewProps) => (
  <div data-testid="assignment-view">AssignmentView</div>
);
