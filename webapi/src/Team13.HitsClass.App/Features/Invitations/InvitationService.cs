using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Features.Invitations.Dto;
using Team13.HitsClass.App.Features.Notifications;
using Team13.HitsClass.App.Features.Teams;
using Team13.HitsClass.App.Features.Teams.Dto;
using Team13.HitsClass.App.Utils;
using Team13.HitsClass.Common;
using Team13.HitsClass.Domain;
using Team13.HitsClass.Domain.PublicationPayloadTypes;
using Team13.HitsClass.Persistence;
using Team13.LowLevelPrimitives;
using Team13.LowLevelPrimitives.Exceptions;
using Team13.PersistenceHelpers;

namespace Team13.HitsClass.App.Features.Invitations
{
    public class InvitationService(
        HitsClassDbContext dbContext,
        IUserAccessor userAccessor,
        UserManager<User> userManager,
        NotificationService notificationService
    )
    {
        public async Task SendInvitation(int teamId, string studentId)
        {
            var userId = userAccessor.GetUserId();

            var team = await dbContext
                .Teams.Include(t => t.Members)
                .Include(t => t.Publication)
                    .ThenInclude(p => p.Course)
                        .ThenInclude(c => c.Students)
                .GetOne(Team.HasId(teamId));

            if (team.CaptainId != userId)
                throw new AccessDeniedException(
                    "Only captains can send invitations to their team."
                );

            if (!team.Publication.Course.Students.Any(s => s.Id == studentId))
                throw new ValidationException(
                    $"User with id={studentId} is not a member of this course."
                );

            if (team.Members.Any(m => m.Id == studentId) || team.CaptainId == studentId)
                throw new ValidationException("Student is already a member of this team.");

            var payload = (TeamAssignmentPayload)team.Publication.PublicationPayload;
            if (payload.AreTeamsFrozen)
                throw new ValidationException("Teams are frozen.");

            if (payload.MaxTeamSize.HasValue && payload.MaxTeamSize < team.Members.Count + 1)
                throw new ValidationException("Your team is full");

            if (
                payload.DistributionType == TeamDistributionType.ByTeacher
                || payload.DistributionType == TeamDistributionType.Random
            )
                throw new ValidationException(
                    "You cannot invite members for assignment with this distributionType."
                );

            var student = await dbContext.Users.FirstAsync(x => x.Id == studentId);

            var otherTeam = await dbContext
                .Teams.Include(t => t.Members)
                .Where(t =>
                    t.PublicationId == team.PublicationId && t.Members.Any(m => m.Id == studentId)
                )
                .FirstOrDefaultAsync();

            if (otherTeam != null)
                throw new ValidationException("This student is already in another team.");

            await dbContext.Invitations.AddAsync(
                new Invitation { TeamId = team.Id, UserId = studentId }
            );
            await dbContext.SaveChangesAsync();
        }

        public async Task<List<InvitationDto>> GetAllInvitations(int assignmentId)
        {
            var userId = userAccessor.GetUserId();
            var invitations = await dbContext
                .Invitations.Include(i => i.Team)
                .Where(t => t.UserId == userId && t.Team.PublicationId == assignmentId)
                .Select(i => i.ToInvitationDto())
                .ToListAsync();
            return invitations;
        }

        public async Task<TeamDto> AcceptInvitation(int invitationId)
        {
            var userId = userAccessor.GetUserId();
            var user = await dbContext.Users.FirstAsync(x => x.Id == userId);
            var invitation = await dbContext
                .Invitations.Include(i => i.Team)
                .GetOne(Invitation.HasId(invitationId));

            if (invitation.UserId != userId)
                throw new AccessDeniedException("You can only accept your invitations.");

            var otherTeam = await dbContext
                .Teams.Include(t => t.Members)
                .Where(t =>
                    t.PublicationId == invitation.Team.PublicationId
                    && t.Members.Any(m => m.Id == userId)
                )
                .FirstOrDefaultAsync();
            if (otherTeam != null)
                throw new ValidationException("You are already in a team.");

            var team = await dbContext
                .Teams.Include(t => t.Members)
                .Include(t => t.Publication)
                .GetOne(Team.HasId(invitation.TeamId));

            var payload = (TeamAssignmentPayload)team.Publication.PublicationPayload;
            if (payload.AreTeamsFrozen)
                throw new ValidationException("Teams are frozen.");
            if (payload.MaxTeamSize.HasValue && payload.MaxTeamSize < team.Members.Count + 1)
                throw new ValidationException("This team is full");

            team.Members.Add(user);
            dbContext.Invitations.Remove(invitation);
            await dbContext.SaveChangesAsync();

            var saved = await dbContext
                .Teams.Include(t => t.Captain)
                .Include(t => t.Members)
                .GetOne(Team.HasId(team.Id));

            return saved.ToTeamDto();
        }

        public async Task DeclineInvitation(int invitationId)
        {
            var userId = userAccessor.GetUserId();
            var invitation = await dbContext.Invitations.GetOne(Invitation.HasId(invitationId));
            if (invitation.UserId != userId)
                throw new AccessDeniedException("You can only decline your invitations.");

            dbContext.Invitations.Remove(invitation);
            await dbContext.SaveChangesAsync();
        }
    }
}
