using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Features.Assignment.Dto;
using Team13.HitsClass.App.Features.Notifications;
using Team13.HitsClass.App.Features.Publications;
using Team13.HitsClass.App.Features.Publications.Dto;
using Team13.HitsClass.Common;
using Team13.HitsClass.Domain;
using Team13.HitsClass.Persistence;
using Team13.LowLevelPrimitives.Exceptions;
using Team13.PersistenceHelpers;

namespace Team13.HitsClass.App.Features.Assignment
{
    public class AssignmentService(
        PublicationService publicationService,
        HitsClassDbContext dbContext,
        NotificationService notificationService
    )
    {
        public async Task<AssignmentStatisticDto> GetAssignmentStatistics(int assignmentId)
        {
            var assignment = await dbContext
                .Publications.AsSplitQuery()
                .Include(p => p.TargetUsers)
                .GetOne(Publication.HasId(assignmentId));
            var course = await dbContext
                .Courses.Include(c => c.Students)
                .GetOne(Course.HasId(assignment.CourseId));

            if (assignment.Type != PublicationType.Assignment)
            {
                throw new ValidationException(
                    $"Publication with id {assignmentId} is not an assignment."
                );
            }

            var submissions = await dbContext
                .Submissions.Where(s => s.PublicationId == assignmentId)
                .ToListAsync();
            var total = assignment.IsForEveryone
                ? course.Students.Count
                : assignment.TargetUsers.Count;
            var submitted = submissions.Count(s => s.State != SubmissionState.Draft);

            return new AssignmentStatisticDto
            {
                Total = total,
                Submitted = submitted,
                Marked = submissions.Count(s => s.Mark != null),
                NotSubmitted = total - submitted,
            };
        }

        public async Task<PublicationDto> CreateAssignment(
            int courseId,
            CreateAssignmentDto createAssignmentDto
        )
        {
            if (createAssignmentDto.Payload.DeadlineUtc != null)
            {
                if (createAssignmentDto.Payload.DeadlineUtc <= DateTime.UtcNow)
                    throw new ValidationException("Deadline must be in the future.");
                if (createAssignmentDto.Payload.DeadlineUtc.Value is { Hour: 0, Minute: 0 })
                    throw new ValidationException(
                        "Deadline cannot be 00:00. Always choose 23:59 over midnight."
                    );
            }

            var newAssignment = await publicationService.CreateNewPublication(
                courseId,
                createAssignmentDto,
                createAssignmentDto.Payload
            );

            await notificationService.NewAssignmentNotification(newAssignment.Id);

            return newAssignment;
        }

        public async Task<PublicationDto> PatchAssignment(
            int assignmentId,
            PatchAssignmentDto patchAssignmentDto
        )
        {
            if (patchAssignmentDto.Payload is { DeadlineUtc: not null })
            {
                if (patchAssignmentDto.Payload.DeadlineUtc <= DateTime.UtcNow)
                    throw new ValidationException("Deadline must be in the future.");
                if (patchAssignmentDto.Payload.DeadlineUtc.Value is { Hour: 0, Minute: 0 })
                    throw new ValidationException(
                        "Deadline cannot be 00:00. Always choose 23:59 over midnight."
                    );
            }

            return await publicationService.PatchPublication(
                assignmentId,
                patchAssignmentDto,
                patchAssignmentDto.Payload
            );
        }

        public async Task DeleteAssignment(int assignmentId)
        {
            // I don't really know if we want to validate something here, but who knows

            await publicationService.DeletePublication(assignmentId);
        }
    }
}
