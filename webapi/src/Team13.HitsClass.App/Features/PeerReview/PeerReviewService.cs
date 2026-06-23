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
using Team13.WebApi.Patching;

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
                        State = PeerReviewState.NotReviewed,
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

    public async Task<PeerReviewDto> CreatePeerReview(
        int peerReviewAssignmentId,
        CreatePeerReviewDto reviewDto
    )
    {
        var userId = userAccessor.GetUserId();
        var user = await dbContext.Users.GetOne(User.HasId(userId));

        var peerReviewAssignment = await dbContext
            .PeerReviewAssignments.Include(a => a.Publication)
            .GetOne(PeerReviewAssignment.HasId(peerReviewAssignmentId));
        if (peerReviewAssignment.JuryUserId != userId)
            throw new ValidationException(
                $"Пользователь {userId} не является жюри для этого решения."
            );
        if (peerReviewAssignment.State == PeerReviewState.Checked)
            throw new ValidationException("Решение уже оценено.");

        var submission = await dbContext.Submissions.FirstOrDefaultAsync(s =>
            s.PublicationId == peerReviewAssignment.PublicationId
            && s.AuthorId == peerReviewAssignment.DefendantUserId
        );
        if (submission == null)
            throw new ValidationException("Нельзя оценить работу без решения.");

        var criteriaIds = reviewDto.Evaluations.Select(x => x.CriteriaId).Distinct().ToList();
        var criteriaList = await dbContext
            .AssignmentCriteria.Where(c => c.PublicationId == peerReviewAssignment.PublicationId)
            .ToListAsync();
        if (criteriaList.Count != criteriaIds.Count)
        {
            var existingIds = criteriaList.Select(c => c.Id);
            var missingIds = existingIds.Except(criteriaIds);

            throw new ValidationException(
                $"Criteria not found for IDs: {string.Join(", ", missingIds)}"
            );
        }
        var evaluations = reviewDto
            .Evaluations.Select(e => new CriteriaEvaluation
            {
                Value = e.Value,
                Note = e.Note,
                CriteriaId = e.CriteriaId,
            })
            .ToList();

        var peerReview = new Domain.PeerReview
        {
            Mark = reviewDto.Mark,
            SubmittedAtUTC = DateTime.UtcNow,
            AssignmentId = peerReviewAssignmentId,
            Evaluations = evaluations,
        };

        await dbContext.PeerReviews.AddAsync(peerReview);
        peerReviewAssignment.State = PeerReviewState.Reviewed;
        await dbContext.SaveChangesAsync();

        var review = await dbContext
            .PeerReviews.Include(p => p.Evaluations)
            .GetOne(Domain.PeerReview.HasId(peerReview.Id));
        return review.ToPeerReviewDto();
    }

    public async Task<List<PeerReviewAssignmentDto>> GetPeerReviewAssignments(int assignmentId)
    {
        var userId = userAccessor.GetUserId();
        var user = await dbContext.Users.GetOne(User.HasId(userId));
        var publication = await dbContext.Publications.GetOne(Publication.HasId(assignmentId));

        var submissionsToReview = await dbContext
            .PeerReviewAssignments.Include(p => p.DefendantUser)
            .Include(p => p.PeerReview)
            .Where(p => p.PublicationId == assignmentId && p.JuryUserId == userId)
            .Select(p => new PeerReviewAssignmentDto
            {
                Id = p.Id,
                State = p.State,
                Mark = p.PeerReview.Mark,
                DefendantUser = new JuryDto
                {
                    Name = p.DefendantUser.LegalName,
                    UserId = p.DefendantUserId,
                },
            })
            .ToListAsync();
        return submissionsToReview;
    }

    public async Task DeletePeerReview(int id)
    {
        var userId = userAccessor.GetUserId();
        var user = await dbContext.Users.GetOne(User.HasId(userId));

        var peerReview = await dbContext.PeerReviews.GetOne(Domain.PeerReview.HasId(id));
        var assignment = await dbContext.PeerReviewAssignments.GetOne(
            PeerReviewAssignment.HasId(peerReview.AssignmentId)
        );
        if (assignment.State == PeerReviewState.Checked)
            throw new ValidationException(
                "Ревью нельзя удалить после выставления оценки преподавателем."
            );
        if (peerReview.Assignment.JuryUserId != userId)
            throw new AccessDeniedException(
                $"Пользователь {userId} не является автором этого ревью и не может её удалить."
            );

        dbContext.PeerReviews.Remove(peerReview);
        assignment.State = PeerReviewState.NotReviewed;
        await dbContext.SaveChangesAsync();
    }

    public async Task<List<PeerReviewAssignmentDto>> GetPeerReviewsGeneral(
        int assignmentId,
        string defendantId
    )
    {
        var userId = userAccessor.GetUserId();
        var user = await dbContext.Users.GetOne(User.HasId(userId));
        var publication = await dbContext.Publications.GetOne(Publication.HasId(assignmentId));
        var course = await dbContext
            .Courses.Include(c => c.Teachers)
            .GetOne(Course.HasId(publication.CourseId));

        var hasAccess =
            course.OwnerId == userId
            || course.Teachers.Any(t => t.Id == userId)
            || await userManager.HasAnyOfRoles(user, [UserRoles.Admin]);

        if (!hasAccess)
        {
            throw new AccessDeniedException(
                $"Пользователь {userId} не может смотреть оценки других студентов."
            );
        }

        var reviews = await dbContext
            .PeerReviewAssignments.Include(p => p.DefendantUser)
            .Include(p => p.PeerReview)
            .Where(p => p.PublicationId == assignmentId && p.DefendantUserId == defendantId)
            .Select(p => new PeerReviewAssignmentDto
            {
                Id = p.Id,
                State = p.State,
                Mark = p.PeerReview.Mark,
                DefendantUser = new JuryDto
                {
                    Name = p.DefendantUser.LegalName,
                    UserId = p.DefendantUserId,
                },
            })
            .ToListAsync();
        return reviews;
    }

    public async Task<PeerReviewDto> GetPeerReview(int id)
    {
        var userId = userAccessor.GetUserId();
        var user = await dbContext.Users.GetOne(User.HasId(userId));

        var review = await dbContext
            .PeerReviews.Include(p => p.Evaluations)
            .Include(p => p.Assignment)
                .ThenInclude(a => a.Publication)
            .GetOne(Domain.PeerReview.HasId(id));

        var course = await dbContext
            .Courses.Include(c => c.Teachers)
            .GetOne(Course.HasId(review.Assignment.Publication.CourseId));

        var hasAccess =
            review.Assignment.JuryUserId == userId
            || course.OwnerId == userId
            || course.Teachers.Any(t => t.Id == userId)
            || await userManager.HasAnyOfRoles(user, [UserRoles.Admin]);

        if (!hasAccess)
        {
            throw new AccessDeniedException(
                $"Пользователь {userId} не может просматривать это ревью."
            );
        }

        return review.ToPeerReviewDto();
    }

    public async Task<PeerReviewDto> GetReview(int peerReviewAssignmentId)
    {
        var userId = userAccessor.GetUserId();
        var user = await dbContext.Users.GetOne(User.HasId(userId));

        var peerReviewAssignment = await dbContext.PeerReviewAssignments.GetOne(
            PeerReviewAssignment.HasId(peerReviewAssignmentId)
        );

        var reviewId = peerReviewAssignment.PeerReviewId;
        if (reviewId == null)
            throw new PersistenceResourceNotFoundException(
                $"Ревью для пары {peerReviewAssignmentId} не найдено."
            );

        return await GetPeerReview((int)reviewId);
    }

    public async Task<PeerReviewDto> UpdatePeerReview(int id, UpdatePeerReviewDto dto)
    {
        var userId = userAccessor.GetUserId();
        var user = await dbContext.Users.GetOne(User.HasId(userId));

        var review = await dbContext
            .PeerReviews.Include(p => p.Evaluations)
            .Include(p => p.Assignment)
                .ThenInclude(a => a.Publication)
            .GetOne(Domain.PeerReview.HasId(id));

        if (review.Assignment.JuryUserId != userId)
            throw new AccessDeniedException(
                $"Пользователь {userId} не является автором этого ревью и не может её изменить."
            );
        if (review.Assignment.State == PeerReviewState.Checked)
            throw new ValidationException(
                "Нельзя изменить ревью после выставления оценки преподавателем."
            );

        if (dto.IsFieldPresent(nameof(dto.Evaluations)))
        {
            var criteriaIds = dto.Evaluations.Select(x => x.CriteriaId).Distinct().ToList();
            var criteriaList = await dbContext
                .AssignmentCriteria.Where(c => c.PublicationId == review.Assignment.PublicationId)
                .ToListAsync();
            if (criteriaList.Count != criteriaIds.Count)
            {
                var existingIds = criteriaList.Select(c => c.Id);
                var missingIds = existingIds.Except(criteriaIds);

                throw new ValidationException(
                    $"Criteria not found for IDs: {string.Join(", ", missingIds)}"
                );
            }
            var evaluations = dto
                .Evaluations.Select(e => new CriteriaEvaluation
                {
                    Value = e.Value,
                    Note = e.Note,
                    CriteriaId = e.CriteriaId,
                })
                .ToList();
            review.Evaluations = evaluations;
        }
        review.Update(dto);

        await dbContext.SaveChangesAsync();
        return review.ToPeerReviewDto();
    }
}
