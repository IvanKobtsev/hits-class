using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Features.Teams.Dto;
using Team13.HitsClass.App.Utils;
using Team13.HitsClass.Common;
using Team13.HitsClass.Domain;
using Team13.HitsClass.Domain.PublicationPayloadTypes;
using Team13.HitsClass.Persistence;
using Team13.LowLevelPrimitives;
using Team13.LowLevelPrimitives.Exceptions;
using Team13.PersistenceHelpers;

namespace Team13.HitsClass.App.Features.Teams
{
    public class TeamService(
        HitsClassDbContext dbContext,
        IUserAccessor userAccessor,
        UserManager<User> userManager
    )
    {
        public async Task<TeamDto> CreateTeam(int assignmentId, CreateTeamDto dto)
        {
            var userId = userAccessor.GetUserId();

            var publication = await dbContext
                .Publications.Include(p => p.Course)
                    .ThenInclude(c => c.Students)
                .Include(p => p.Teams!)
                    .ThenInclude(t => t.Members)
                .GetOne(Publication.HasId(assignmentId));

            if (publication.Type != PublicationType.TeamAssignment)
                throw new ValidationException("Only team assignments can have teams.");

            var payload = (TeamAssignmentPayload)publication.PublicationPayload;

            if (payload.DistributionType != TeamDistributionType.Free)
                throw new ValidationException("Team creation is not open for this assignment.");

            if (payload.AreTeamsFrozen)
                throw new ValidationException("Teams are frozen.");

            if (!publication.Course.Students.Any(s => s.Id == userId))
                throw new AccessDeniedException("You are not a student of this course.");

            var alreadyInTeam = publication.Teams!.Any(t =>
                t.CaptainId == userId || t.Members.Any(m => m.Id == userId)
            );
            if (alreadyInTeam)
                throw new ValidationException("You are already in a team for this assignment.");

            var user = await dbContext.Users.GetOne(User.HasId(userId));

            var team = new Domain.Team
            {
                Name = dto.Name,
                CaptainId = userId,
                PublicationId = assignmentId,
                Members = [user],
            };

            dbContext.Teams.Add(team);
            await dbContext.SaveChangesAsync();

            var saved = await dbContext
                .Teams.Include(t => t.Captain)
                .Include(t => t.Members)
                .GetOne(Domain.Team.HasId(team.Id));

            return saved.ToTeamDto();
        }

        public async Task<TeamDto> AddStudentToTeam(int teamId, string studentId)
        {
            var userId = userAccessor.GetUserId();

            var team = await dbContext
                .Teams.Include(t => t.Members)
                .Include(t => t.Publication)
                    .ThenInclude(p => p.Course)
                        .ThenInclude(c => c.Students)
                .Include(t => t.Publication)
                    .ThenInclude(p => p.Course)
                        .ThenInclude(c => c.Teachers)
                .GetOne(Team.HasId(teamId));

            var user = await dbContext.Users.GetOne(User.HasId(userId));
            var hasAccess = (
                team.Publication.Course.OwnerId == userId
                || team.Publication.Course.Teachers.Any(s => s.Id == userId)
                || await userManager.HasAnyOfRoles(user, [UserRoles.Admin, UserRoles.Teacher])
            );

            if (!hasAccess)
                throw new AccessDeniedException("Only teachers can add students to teams.");

            if (!team.Publication.Course.Students.Any(s => s.Id == studentId))
                throw new ValidationException(
                    $"User with id={studentId} is not a member of this course."
                );

            if (team.Members.Any(m => m.Id == studentId) || team.CaptainId == studentId)
                throw new ValidationException("Student is already a member of this team.");

            var payload = (TeamAssignmentPayload)team.Publication.PublicationPayload;
            if (payload.AreTeamsFrozen)
                throw new ValidationException("Teams are frozen.");

            var student = await dbContext.Users.FirstAsync(x => x.Id == studentId);

            var otherTeam = await dbContext
                .Teams.Include(t => t.Members)
                .Where(t =>
                    t.PublicationId == team.PublicationId
                    && (t.CaptainId == studentId || t.Members.Any(m => m.Id == studentId))
                )
                .FirstOrDefaultAsync();

            if (otherTeam != null)
            {
                if (otherTeam.CaptainId == studentId)
                    throw new ValidationException("This student is a captain of another team.");
                otherTeam.Members.Remove(student);
            }

            team.Members.Add(student);
            await dbContext.SaveChangesAsync();

            var saved = await dbContext
                .Teams.Include(t => t.Captain)
                .Include(t => t.Members)
                .GetOne(Domain.Team.HasId(teamId));

            return saved.ToTeamDto();
        }

        public async Task<bool> IsStudentInATeam(int assignmentId, string studentId)
        {
            var assignment = await dbContext
                .Publications.Include(p => p.Teams)
                    .ThenInclude(t => t.Members)
                .GetOne(Publication.HasId(assignmentId));

            return assignment.Teams.Any(t =>
                t.CaptainId == studentId || t.Members.Any(m => m.Id == studentId)
            );
        }
    }
}
