using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Features.Assignment;
using Team13.HitsClass.App.Features.Notifications;
using Team13.HitsClass.App.Features.Publications;
using Team13.HitsClass.App.Features.Publications.Dto;
using Team13.HitsClass.App.Features.TeamAssignment.Dto;
using Team13.HitsClass.Domain;
using Team13.HitsClass.Domain.PublicationPayloadTypes;
using Team13.HitsClass.Persistence;
using Team13.LowLevelPrimitives.Exceptions;
using Team13.PersistenceHelpers;
using Team13.WebApi.Patching;

namespace Team13.HitsClass.App.Features.TeamAssignment
{
    public class TeamAssignmentService(
        PublicationService publicationService,
        NotificationService notificationService,
        HitsClassDbContext dbContext
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

            if (createTeamAssignmentDto.Payload.MarkType == MarkType.Score)
            {
                var minMark = createTeamAssignmentDto.Payload.MinMark;
                var maxMark = createTeamAssignmentDto.Payload.MaxMark;
                if (maxMark == null)
                    throw new ValidationException(
                        "MaxMark is required for assignments with type Score"
                    );
                if (minMark == null)
                    throw new ValidationException(
                        "MinMark is required for assignments with type Score"
                    );
                if (minMark > maxMark)
                    throw new ValidationException("MinMark can't be bigger than MaxMark");
            }

            if (
                createTeamAssignmentDto.Payload.MarkType == MarkType.PassFail
                && (
                    createTeamAssignmentDto.Payload.MaxMark != null
                    || createTeamAssignmentDto.Payload.MinMark != null
                )
            )
                throw new ValidationException(
                    "MaxMark and MinMark are not allowed for assignments with type PassFail"
                );

            DeadlineCriteriaValidator.Validate(
                createTeamAssignmentDto.Payload.DeadlineCriteria,
                createTeamAssignmentDto.Payload.DeadlineUtc
            );

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
                    throw new ValidationException("Срок сдачи не может быть в прошлом.");
                if (patchAssignmentDto.Payload.DeadlineUtc.Value is { Hour: 0, Minute: 0 })
                    throw new ValidationException(
                        "Срок сдачи не может быть равен 00:00. Выберите лучше 23:59."
                    );
            }

            var minSize = patchAssignmentDto.Payload.MinTeamSize;
            var maxSize = patchAssignmentDto.Payload.MaxTeamSize;

            if (maxSize is > 100 or < 2)
            {
                throw new ValidationException(
                    "Максимальный размер команды не может быть больше 100 или меньше 2."
                );
            }

            if (minSize > maxSize || minSize is > 100)
            {
                throw new ValidationException(
                    "Максимальный размер команды должен быть больше или равен минимальному и не может быть больше 100."
                );
            }

            var minMark = patchAssignmentDto.Payload.MinMark;
            var maxMark = patchAssignmentDto.Payload.MaxMark;
            if (maxMark != null || minMark != null)
            {
                var assignment = await dbContext.Publications.GetOne(
                    Publication.HasId(assignmentId)
                );
                var payload = (AssignmentPayload)assignment.PublicationPayload;
                if (payload.MarkType == MarkType.PassFail)
                    throw new ValidationException(
                        "MaxMark and MinMark are not allowed for assignments with type PassFail"
                    );

                if (
                    (minMark == null && maxMark != null && payload.MinMark > maxMark)
                    || (maxMark == null && minMark != null && minMark > payload.MaxMark)
                    || (minMark > maxMark)
                )
                    throw new ValidationException("MinMark can't be bigger than MaxMark");
            }

            if (patchAssignmentDto.Payload.DeadlineCriteria != null)
            {
                var effectiveDeadline =
                    patchAssignmentDto.Payload.DeadlineUtc
                    ?? (
                        (AssignmentPayload)
                            (
                                await dbContext.Publications.GetOne(Publication.HasId(assignmentId))
                            ).PublicationPayload
                    ).DeadlineUtc;

                DeadlineCriteriaValidator.Validate(
                    patchAssignmentDto.Payload.DeadlineCriteria,
                    effectiveDeadline
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

        public async Task<PublicationDto> SetFrozenStatus(int assignmentId, bool isFrozen)
        {
            var patch = new PatchTeamAssignmentDto
            {
                Payload = new PatchTeamAssignmentPayloadDto { AreTeamsFrozen = isFrozen },
            }.MarkAllNonDefaultPropertiesAsDefined();

            patch.Payload!.SetHasProperty(nameof(patch.Payload.AreTeamsFrozen));

            return await publicationService.PatchPublication(assignmentId, patch, patch.Payload);
        }
    }
}
