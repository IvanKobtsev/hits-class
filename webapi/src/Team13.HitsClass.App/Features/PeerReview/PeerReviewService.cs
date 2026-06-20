using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Features.PeerReview.Dto;
using Team13.HitsClass.App.Utils;
using Team13.HitsClass.Common;
using Team13.HitsClass.Domain;
using Team13.HitsClass.Domain.PublicationPayloadTypes;
using Team13.HitsClass.Persistence;
using Team13.LowLevelPrimitives;
using Team13.LowLevelPrimitives.Exceptions;
using Team13.PersistenceHelpers;

namespace Team13.HitsClass.App.Features.PeerReview;

public class PeerReviewService(
    HitsClassDbContext dbContext,
    IUserAccessor userAccessor,
    UserManager<User> userManager
)
{
    public async Task GeneratePeerReviewMappings(int publicationId)
    {
        var publication = await dbContext
            .Publications.AsSplitQuery()
            .Include(p => p.TargetUsers)
            .Include(p => p.Teams)
                .ThenInclude(t => t.Members)
            .GetOne(Publication.HasId(publicationId));

        var course = await dbContext
            .Courses.Include(c => c.Students)
            .GetOne(Course.HasId(publication.CourseId));

        var payload = (AssignmentPayload)publication.PublicationPayload;
        var juryCount =
            payload.JuryCountPerDefendant
            ?? throw new ValidationException("Количество жюри на ответчика обязательно.");

        var defendants = publication.IsForEveryone
            ? course.Students.ToList()
            : publication.TargetUsers.ToList();

        if (defendants.Count < juryCount + 1)
            throw new ValidationException(
                $"Недостаточно студентов для P2P оценки. Необходимо минимум {juryCount + 1}, доступно {defendants.Count}."
            );

        var teamsByUser = new Dictionary<string, int>();
        if (publication.Type == PublicationType.TeamAssignment)
        {
            foreach (var team in publication.Teams)
            {
                foreach (var member in team.Members)
                {
                    teamsByUser[member.Id] = team.Id;
                }
            }
        }

        var juryCountMap = defendants.ToDictionary(d => d.Id, _ => 0);
        var assignments = new List<PeerReviewAssignment>();

        foreach (var defendant in defendants)
        {
            var candidates = defendants
                .Where(s => s.Id != defendant.Id)
                .Where(s =>
                {
                    if (
                        teamsByUser.Count > 0
                        && teamsByUser.TryGetValue(defendant.Id, out var defendantTeamId)
                        && teamsByUser.TryGetValue(s.Id, out var candidateTeamId)
                    )
                        return defendantTeamId != candidateTeamId;
                    return true;
                })
                .OrderBy(s => juryCountMap.GetValueOrDefault(s.Id, 0))
                .ThenBy(_ => Random.Shared.Next())
                .Take(juryCount)
                .ToList();

            if (candidates.Count < juryCount)
                throw new ValidationException(
                    $"Недостаточно подходящих жюри для ответчика {defendant.LegalName}. "
                        + "Это может произойти, если команды слишком большие относительно количества жюри."
                );

            foreach (var jury in candidates)
            {
                assignments.Add(
                    new PeerReviewAssignment
                    {
                        PublicationId = publicationId,
                        JuryUserId = jury.Id,
                        DefendantUserId = defendant.Id,
                    }
                );
                juryCountMap[jury.Id] = juryCountMap.GetValueOrDefault(jury.Id, 0) + 1;
            }
        }

        dbContext.PeerReviewAssignments.AddRange(assignments);
        await dbContext.SaveChangesAsync();
    }

    public async Task<List<PeerReviewMappingDto>> GetMappings(int publicationId)
    {
        var publication = await EnsureCanManagePeerReview(publicationId);

        var course = await dbContext
            .Courses.Include(c => c.Students)
            .GetOne(Course.HasId(publication.CourseId));

        var defendants = publication.IsForEveryone
            ? course.Students.ToList()
            : await dbContext
                .Publications.Include(p => p.TargetUsers)
                .Where(p => p.Id == publicationId)
                .SelectMany(p => p.TargetUsers)
                .ToListAsync();

        var mappings = await dbContext
            .PeerReviewAssignments.Where(p => p.PublicationId == publicationId)
            .Include(p => p.JuryUser)
            .ToListAsync();

        var juryByDefendant = mappings
            .GroupBy(m => m.DefendantUserId)
            .ToDictionary(
                g => g.Key,
                g =>
                    g.Select(m => new JuryDto
                        {
                            UserId = m.JuryUserId,
                            Name = m.JuryUser.LegalName,
                        })
                        .ToList()
            );

        return defendants
            .Select(d => new PeerReviewMappingDto
            {
                DefendantUserId = d.Id,
                DefendantName = d.LegalName,
                Juries = juryByDefendant.GetValueOrDefault(d.Id, []),
            })
            .ToList();
    }

    public async Task UpdateMappings(int publicationId, UpdatePeerReviewMappingsDto dto)
    {
        var publication = await EnsureCanManagePeerReview(publicationId);
        var course = await dbContext
            .Courses.Include(c => c.Students)
            .GetOne(Course.HasId(publication.CourseId));

        var courseStudentIds = course.Students.Select(s => s.Id).ToHashSet();

        foreach (var mapping in dto.Mappings)
        {
            if (!courseStudentIds.Contains(mapping.DefendantUserId))
                throw new ValidationException(
                    $"Ответчик {mapping.DefendantUserId} не является студентом этого курса."
                );

            foreach (var juryId in mapping.JuryUserIds)
            {
                if (!courseStudentIds.Contains(juryId))
                    throw new ValidationException(
                        $"Жюри {juryId} не является студентом этого курса."
                    );
                if (juryId == mapping.DefendantUserId)
                    throw new ValidationException("Студент не может быть жюри для самого себя.");
            }
        }

        var existing = await dbContext
            .PeerReviewAssignments.Where(p => p.PublicationId == publicationId)
            .ToListAsync();
        dbContext.PeerReviewAssignments.RemoveRange(existing);

        var newAssignments = dto.Mappings.SelectMany(m =>
            m.JuryUserIds.Select(juryId => new PeerReviewAssignment
            {
                PublicationId = publicationId,
                JuryUserId = juryId,
                DefendantUserId = m.DefendantUserId,
            })
        );

        dbContext.PeerReviewAssignments.AddRange(newAssignments);
        await dbContext.SaveChangesAsync();
    }

    public async Task RegenerateMappings(int publicationId)
    {
        await EnsureCanManagePeerReview(publicationId);

        var existing = await dbContext
            .PeerReviewAssignments.Where(p => p.PublicationId == publicationId)
            .ToListAsync();
        dbContext.PeerReviewAssignments.RemoveRange(existing);
        await dbContext.SaveChangesAsync();

        await GeneratePeerReviewMappings(publicationId);
    }

    private async Task<Publication> EnsureCanManagePeerReview(int publicationId)
    {
        var userId = userAccessor.GetUserId();
        var user = await dbContext.Users.GetOne(User.HasId(userId));
        var publication = await dbContext.Publications.GetOne(Publication.HasId(publicationId));

        var course = await dbContext
            .Courses.Include(c => c.Teachers)
            .GetOne(Course.HasId(publication.CourseId));

        var canManage =
            publication.AuthorId == userId
            || await userManager.HasAnyOfRoles(user, [UserRoles.Admin, UserRoles.Teacher])
            || course.Teachers.Any(u => u.Id == userId);

        if (!canManage)
            throw new AccessDeniedException(
                "У вас нет прав для управления P2P оценкой этого задания."
            );

        return publication;
    }
}
