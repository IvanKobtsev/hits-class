using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Features.Notifications;
using Team13.HitsClass.App.Features.Publications;
using Team13.HitsClass.App.Features.Publications.Dto;
using Team13.HitsClass.App.Features.TeamAssignment.Dto;
using Team13.HitsClass.Domain;
using Team13.HitsClass.Domain.PublicationPayloadTypes;
using Team13.HitsClass.Persistence;
using Team13.LowLevelPrimitives;
using Team13.LowLevelPrimitives.Exceptions;
using Team13.PersistenceHelpers;
using Team13.WebApi.Patching;

namespace Team13.HitsClass.App.Features.TeamAssignment
{
    public class TeamAssignmentService(
        HitsClassDbContext dbContext,
        IUserAccessor userAccessor,
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

        public async Task<PublicationDto> SetFrozenStatus(int assignmentId, bool isFrozen)
        {
            var patch = new PatchTeamAssignmentDto
            {
                Payload = new PatchTeamAssignmentPayloadDto { AreTeamsFrozen = isFrozen },
            }.MarkAllNonDefaultPropertiesAsDefined();

            patch.Payload!.SetHasProperty(nameof(patch.Payload.AreTeamsFrozen));

            return await publicationService.PatchPublication(assignmentId, patch, patch.Payload);
        }

        public async Task<TeamDto> CreateTeam(int assignmentId, CreateTeamDto dto)
        {
            var userId = userAccessor.GetUserId();

            var assignment = await dbContext
                .Publications.Include(p => p.Course)
                    .ThenInclude(c => c.Students)
                .Include(p => p.TargetUsers)
                .GetOne(Publication.HasId(assignmentId));

            if (assignment.Type != PublicationType.TeamAssignment)
                throw new ValidationException("Only team assignments can have teams.");

            if (!assignment.Course.Students.Any(s => s.Id == userId))
                throw new AccessDeniedException("You are not a student of this course.");

            if (!assignment.IsForEveryone && !assignment.TargetUsers.Any(u => u.Id == userId))
                throw new AccessDeniedException("This assignment is not targeted at you.");

            var payload = assignment.PublicationPayload as TeamAssignmentPayload;
            if (payload?.DistributionType != TeamDistributionType.Free)
                throw new ValidationException("Team creation is allowed only in open mode.");

            if (string.IsNullOrWhiteSpace(dto.Name))
                throw new ValidationException("Team name cannot be empty.");

            var normalizedName = dto.Name.Trim();

            var userAlreadyInTeam = await dbContext.Teams.AnyAsync(t =>
                t.PublicationId == assignmentId
                && (t.CaptainId == userId || t.Members.Any(m => m.Id == userId))
            );
            if (userAlreadyInTeam)
                throw new ValidationException("You already belong to a team for this assignment.");

            var duplicateNameExists = await dbContext.Teams.AnyAsync(t =>
                t.PublicationId == assignmentId && t.Name.ToLower() == normalizedName.ToLower()
            );
            if (duplicateNameExists)
                throw new ValidationException("Team name must be unique for this assignment.");

            var student = assignment.Course.Students.First(s => s.Id == userId);

            var team = new Team
            {
                Name = normalizedName,
                CaptainId = userId,
                Captain = student,
                PublicationId = assignmentId,
                Members = [student],
            };

            dbContext.Teams.Add(team);
            await dbContext.SaveChangesAsync();

            var savedTeam = await dbContext
                .Teams.Include(t => t.Members)
                .FirstAsync(t => t.Id == team.Id);

            return new TeamDto
            {
                Id = savedTeam.Id,
                Name = savedTeam.Name,
                CaptainId = savedTeam.CaptainId,
                MemberIds = savedTeam.Members.Select(m => m.Id).ToList(),
                PublicationId = savedTeam.PublicationId,
            };
        }
    }
}
