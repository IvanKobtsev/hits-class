using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Features.Notifications;
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
        UserManager<User> userManager,
        NotificationService notificationService
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
                .GetOne(Team.HasId(teamId));

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

        public async Task<TeamDto> RemoveTeamMember(int teamId, string studentId)
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
                team.CaptainId == userId
                || team.Publication.Course.OwnerId == userId
                || team.Publication.Course.Teachers.Any(s => s.Id == userId)
                || await userManager.HasAnyOfRoles(user, [UserRoles.Admin, UserRoles.Teacher])
            );

            if (!hasAccess)
                throw new AccessDeniedException(
                    "Only teachers or captains can remove team members."
                );

            if (!team.Members.Any(m => m.Id == studentId))
                throw new ValidationException("Student is not a member of this team.");

            var payload = (TeamAssignmentPayload)team.Publication.PublicationPayload;
            if (payload.AreTeamsFrozen)
                throw new ValidationException("Teams are frozen.");

            var student = await dbContext.Users.GetOne(User.HasId(studentId));
            team.Members.Remove(student);
            await dbContext.SaveChangesAsync();

            var saved = await dbContext
                .Teams.Include(t => t.Captain)
                .Include(t => t.Members)
                .GetOne(Team.HasId(teamId));

            return saved.ToTeamDto();
        }

        public async Task<TeamDto> PassCaptainRole(int teamId, string newCaptainId)
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
                team.CaptainId == userId
                || team.Publication.Course.OwnerId == userId
                || team.Publication.Course.Teachers.Any(s => s.Id == userId)
                || await userManager.HasAnyOfRoles(user, [UserRoles.Admin, UserRoles.Teacher])
            );

            if (!hasAccess)
                throw new AccessDeniedException(
                    "Only teachers or captains can choose new captain."
                );

            if (!team.Members.Any(m => m.Id == newCaptainId))
                throw new ValidationException("Student is not a member of this team.");

            var payload = (TeamAssignmentPayload)team.Publication.PublicationPayload;
            if (payload.AreTeamsFrozen)
                throw new ValidationException("Teams are frozen.");

            if (
                (
                    payload.DistributionType == TeamDistributionType.Draft
                    || payload.DistributionType == TeamDistributionType.ByTeacher
                )
                && team.CaptainId == userId
            )
                throw new AccessDeniedException(
                    "Only teachers can change captain for this distribution type."
                );

            var newCaptain = await dbContext.Users.GetOne(User.HasId(newCaptainId));
            team.CaptainId = newCaptainId;
            await dbContext.SaveChangesAsync();
            var saved = await dbContext
                .Teams.Include(t => t.Captain)
                .Include(t => t.Members)
                .GetOne(Team.HasId(teamId));

            return saved.ToTeamDto();
        }

        public async Task<TeamDto> CreateTeamAsTeacher(int assignmentId, CreateTeamAsTeacherDto dto)
        {
            var userId = userAccessor.GetUserId();

            var publication = await dbContext
                .Publications.Include(p => p.Course)
                    .ThenInclude(c => c.Students)
                .Include(p => p.Course)
                    .ThenInclude(c => c.Teachers)
                .Include(p => p.Teams!)
                    .ThenInclude(t => t.Members)
                .GetOne(Publication.HasId(assignmentId));

            if (publication.Type != PublicationType.TeamAssignment)
                throw new ValidationException("Only team assignments can have teams.");

            var user = await dbContext.Users.GetOne(User.HasId(userId));
            var hasAccess =
                publication.Course.OwnerId == userId
                || publication.Course.Teachers.Any(t => t.Id == userId)
                || await userManager.HasAnyOfRoles(user, [UserRoles.Admin, UserRoles.Teacher]);

            if (!hasAccess)
                throw new AccessDeniedException("Only teachers can create teams.");

            var payload = (TeamAssignmentPayload)publication.PublicationPayload;

            if (payload.AreTeamsFrozen)
                throw new ValidationException("Teams are frozen.");

            if (publication.Teams!.Count >= 100)
                throw new ValidationException("Maximum number of teams (100) has been reached.");

            if (
                publication.Teams!.Any(t =>
                    string.Equals(t.Name, dto.Name, StringComparison.OrdinalIgnoreCase)
                )
            )
                throw new ValidationException(
                    $"Team with name '{dto.Name}' already exists for this assignment."
                );

            if (dto.StudentIds.Count == 0)
                throw new ValidationException("At least one student must be added to the team.");

            var students = new List<Domain.User>();
            foreach (var studentId in dto.StudentIds)
            {
                if (!publication.Course.Students.Any(s => s.Id == studentId))
                    throw new ValidationException($"This student is not a member of this course.");

                if (publication.Teams!.Any(t => t.CaptainId == studentId))
                    throw new ValidationException(
                        $"This student is already a captain of another team."
                    );

                if (publication.Teams!.Any(t => t.Members.Any(m => m.Id == studentId)))
                    throw new ValidationException($"This student is already in another team.");

                var student = await dbContext.Users.GetOne(User.HasId(studentId));
                students.Add(student);
            }

            var captainId = dto.StudentIds[0];

            var team = new Domain.Team
            {
                Name = dto.Name,
                CaptainId = captainId,
                PublicationId = assignmentId,
                Members = students,
            };

            dbContext.Teams.Add(team);
            await dbContext.SaveChangesAsync();

            var saved = await dbContext
                .Teams.Include(t => t.Captain)
                .Include(t => t.Members)
                .GetOne(Domain.Team.HasId(team.Id));

            return saved.ToTeamDto();
        }

        public async Task DisbandTeam(int teamId)
        {
            var userId = userAccessor.GetUserId();

            var team = await dbContext
                .Teams.Include(t => t.Members)
                .Include(t => t.Publication)
                    .ThenInclude(p => p.Course)
                        .ThenInclude(c => c.Teachers)
                .GetOne(Team.HasId(teamId));

            var user = await dbContext.Users.GetOne(User.HasId(userId));
            var isTeacher =
                team.Publication.Course.OwnerId == userId
                || team.Publication.Course.Teachers.Any(t => t.Id == userId)
                || await userManager.HasAnyOfRoles(user, [UserRoles.Admin, UserRoles.Teacher]);
            var isCaptain = team.CaptainId == userId;

            if (!isTeacher && !isCaptain)
                throw new AccessDeniedException(
                    "Only teachers or the team captain can disband a team."
                );

            var payload = (TeamAssignmentPayload)team.Publication.PublicationPayload;
            if (!isTeacher && payload.AreTeamsFrozen)
                throw new ValidationException("Teams are frozen.");

            var membersToNotify = team.Members.Where(m => !isCaptain || m.Id != userId).ToList();

            var notificationDto = new TeamDisbandedNotificationDto
            {
                TeamName = team.Name,
                AssignmentTitle = payload.Title,
                CourseTitle = team.Publication.Course.Title,
                Recipients =
                [
                    .. membersToNotify.Select(m => new TeamDisbandedNotificationDto.RecipientInfo(
                        m.Email,
                        m.LegalName
                    )),
                ],
            };

            var teamMemberIds = team.Members.Select(m => m.Id).ToList();
            var submissions = await dbContext
                .Submissions.Where(s =>
                    s.PublicationId == team.PublicationId && teamMemberIds.Contains(s.AuthorId)
                )
                .ToListAsync();
            dbContext.Submissions.RemoveRange(submissions);

            dbContext.Teams.Remove(team);
            await dbContext.SaveChangesAsync();

            await notificationService.TeamDisbandedNotification(notificationDto);
        }

        public async Task<List<TeamDto>> GetTeamsForAssignment(int assignmentId)
        {
            var publication = await dbContext
                .Publications.Include(p => p.Teams!)
                    .ThenInclude(t => t.Members)
                .Include(p => p.Teams!)
                    .ThenInclude(t => t.Captain)
                .GetOne(Publication.HasId(assignmentId));

            if (publication.Type != PublicationType.TeamAssignment)
                throw new ValidationException("Only team assignments can have teams.");

            return publication.Teams!.Select(t => t.ToTeamDto()).ToList();
        }

        public async Task<TeamDto> GetTeamForAssignment(int assignmentId, int teamId)
        {
            var publication = await dbContext
                .Publications.Include(p => p.Teams!)
                    .ThenInclude(t => t.Members)
                .Include(p => p.Teams!)
                    .ThenInclude(t => t.Captain)
                .GetOne(Publication.HasId(assignmentId));

            if (publication.Type != PublicationType.TeamAssignment)
                throw new ValidationException("Only team assignments can have teams.");

            var team = publication.Teams!.FirstOrDefault(t => t.Id == teamId);

            return team == null
                ? throw new PersistenceResourceNotFoundException("Team not found.")
                : team.ToTeamDto();
        }

        public async Task<TeamDto> PatchTeamName(int teamId, string teamName)
        {
            var userId = userAccessor.GetUserId();

            var team = await dbContext
                .Teams.Include(t => t.Members)
                .Include(t => t.Publication)
                    .ThenInclude(p => p.Course)
                        .ThenInclude(c => c.Teachers)
                .GetOne(Team.HasId(teamId));

            var user = await dbContext.Users.GetOne(User.HasId(userId));
            var isTeacher =
                team.Publication.Course.OwnerId == userId
                || team.Publication.Course.Teachers.Any(t => t.Id == userId)
                || await userManager.HasAnyOfRoles(user, [UserRoles.Admin, UserRoles.Teacher]);
            var isCaptain = team.CaptainId == userId;

            if (!isTeacher && !isCaptain)
                throw new AccessDeniedException(
                    "Only teachers or the team captain can change team's name."
                );

            var payload = (TeamAssignmentPayload)team.Publication.PublicationPayload;
            if (!isTeacher && payload.AreTeamsFrozen)
                throw new ValidationException("Teams are frozen.");

            if (
                dbContext.Teams.Any(t =>
                    t.Name == teamName && t.PublicationId == team.PublicationId && t.Id != teamId
                )
            )
                throw new ValidationException($"Команда с названием '{teamName}' уже существует.");

            team.Name = teamName;
            await dbContext.SaveChangesAsync();

            return team.ToTeamDto();
        }
    }
}
