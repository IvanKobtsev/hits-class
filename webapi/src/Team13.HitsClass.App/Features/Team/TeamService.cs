using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Features.Team.Dto;
using Team13.HitsClass.App.Features.Team.Extensions;
using Team13.HitsClass.Domain;
using Team13.HitsClass.Domain.PublicationPayloadTypes;
using Team13.HitsClass.Persistence;
using Team13.LowLevelPrimitives;
using Team13.LowLevelPrimitives.Exceptions;
using Team13.PersistenceHelpers;

namespace Team13.HitsClass.App.Features.Team;

public class TeamService(HitsClassDbContext dbContext, IUserAccessor userAccessor)
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
}
