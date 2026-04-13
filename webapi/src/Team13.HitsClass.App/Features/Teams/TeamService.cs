using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Features.Teams.Dto;
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

            if (
                !team.Publication.Course.Teachers.Any(s => s.Id == userId)
                && !(team.Publication.Course.OwnerId == userId)
            )
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
