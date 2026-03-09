import { AssignmentDto, SubmissionDto } from 'services/api/api-client.types';

export type AssignmentViewProps = {
  assignment: AssignmentDto;
  submission?: SubmissionDto | null;
};

export const AssignmentView = (_props: AssignmentViewProps) => {
  return <></>;
};
