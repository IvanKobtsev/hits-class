using Team13.HitsClass.App.Features.Notifications;
using Team13.HitsClass.App.Features.Publications;
using Team13.HitsClass.App.Features.Publications.Dto;
using Team13.HitsClass.App.Features.TeamAssignment.Dto;
using Team13.LowLevelPrimitives.Exceptions;

namespace Team13.HitsClass.App.Features.TeamAssignment
{
    public class TeamAssignmentService(
        PublicationService publicationService,
        NotificationService notificationService
    )
    {
        //public async Task<AssignmentStatisticDto> GetAssignmentStatistics(int assignmentId)
        //{
        //    throw new NotImplementedException();
        //}

        public async Task<PublicationDto> CreateTeamAssignment(
            int courseId,
            CreateTeamAssignmentDto createTeamAssignmentDto
        )
        {
            if (createTeamAssignmentDto.Payload.DeadlineUtc != null)
            {
                if (createTeamAssignmentDto.Payload.DeadlineUtc <= DateTime.UtcNow)
                    throw new ValidationException("Deadline must be in the future.");
                if (createTeamAssignmentDto.Payload.DeadlineUtc.Value is { Hour: 0, Minute: 0 })
                    throw new ValidationException(
                        "Deadline cannot be 00:00. Always choose 23:59 over midnight."
                    );
            }

            var minSize = createTeamAssignmentDto.Payload.MinTeamSize;
            var maxSize = createTeamAssignmentDto.Payload.MaxTeamSize;
            if (minSize != null && maxSize != null)
            {
                if (minSize > maxSize)
                    throw new ValidationException(
                        "MaxTeamSize must be bigger or equal to MinTeamSize."
                    );
            }

            var newAssignment = await publicationService.CreateNewPublication(
                courseId,
                createTeamAssignmentDto,
                createTeamAssignmentDto.Payload
            );

            await notificationService.NewAssignmentNotification(newAssignment.Id);

            return newAssignment;
        }

        public async Task<PublicationDto> PatchTeamAssignment(
            int assignmentId,
            PatchTeamAssignmentDto patchAssignmentDto
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

            var minSize = patchAssignmentDto.Payload.MinTeamSize;
            var maxSize = patchAssignmentDto.Payload.MaxTeamSize;
            if (minSize != null && maxSize != null)
            {
                if (minSize > maxSize)
                    throw new ValidationException(
                        "MaxTeamSize must be bigger or equal to MinTeamSize."
                    );
            }

            return await publicationService.PatchPublication(
                assignmentId,
                patchAssignmentDto,
                patchAssignmentDto.Payload
            );
        }

        public async Task DeleteTeamAssignment(int assignmentId)
        {
            await publicationService.DeletePublication(assignmentId);
        }
    }
}
