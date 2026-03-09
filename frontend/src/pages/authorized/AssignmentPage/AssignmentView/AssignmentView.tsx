import { AssignmentDto, SubmissionDto } from 'services/api/api-client.types';

function formatDateUTC(date: Date): string {
  const d = String(date.getUTCDate()).padStart(2, '0');
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const y = date.getUTCFullYear();
  return `${d}.${m}.${y}`;
}

function formatDateTimeUTC(date: Date): string {
  const h = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  return `${formatDateUTC(date)} ${h}:${min}`;
}

export type AssignmentViewProps = {
  assignment: AssignmentDto;
  submission?: SubmissionDto | null;
};

export const AssignmentView = ({ assignment, submission }: AssignmentViewProps) => {
  const { title, description, author, createdAtUTC, deadlineUTC, attachments } = assignment;

  return (
    <div>
      <h1 data-test-id="AssignmentView-title">{title}</h1>

      <span data-test-id="AssignmentView-author">{author.legalName}</span>

      <span data-test-id="AssignmentView-publication-date">
        {formatDateUTC(createdAtUTC)}
      </span>

      <span data-test-id="AssignmentView-deadline">
        {deadlineUTC ? formatDateTimeUTC(deadlineUTC) : 'Не указан'}
      </span>

      <p data-test-id="AssignmentView-description">{description}</p>

      {submission?.mark != null && (
        <span data-test-id="AssignmentView-mark">{submission.mark}</span>
      )}

      {attachments.map((file) => (
        <div key={file.id} data-test-id={`AssignmentView-attachment-${file.fileName}`}>
          {file.fileName}
        </div>
      ))}
    </div>
  );
};
