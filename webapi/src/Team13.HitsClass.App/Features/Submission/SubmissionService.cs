using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Features.Submission.Dto;
using Team13.HitsClass.App.Features.Submission.Extensions;
using Team13.HitsClass.App.Features.Users;
using Team13.HitsClass.App.Utils;
using Team13.HitsClass.Common;
using Team13.HitsClass.Domain;
using Team13.HitsClass.Domain.PublicationPayloadTypes;
using Team13.HitsClass.Persistence;
using Team13.LowLevelPrimitives;
using Team13.LowLevelPrimitives.Exceptions;
using Team13.PersistenceHelpers;
using Team13.WebApi.Pagination;
using DomainSubmission = Team13.HitsClass.Domain.Submission;

namespace Team13.HitsClass.App.Features.Submission;

public class SubmissionService(
    HitsClassDbContext dbContext,
    IUserAccessor userAccessor,
    UserManager<User> userManager
)
{
    public async Task<SubmissionDto> CreateSubmission(int assignmentId, CreateSubmissionDto dto)
    {
        var userId = userAccessor.GetUserId();

        var publication = await dbContext
            .Publications.Include(p => p.Course)
                .ThenInclude(c => c.Students)
            .Include(p => p.TargetUsers)
            .GetOne(Publication.HasId(assignmentId));

        if (!publication.Course.Students.Any(s => s.Id == userId))
            throw new AccessDeniedException("You are not a student of this course.");

        if (
            publication.Type != PublicationType.Assignment
            && publication.Type != PublicationType.TeamAssignment
        )
            throw new ValidationException("Only assignments can have submissions.");

        if (!publication.IsForEveryone && !publication.TargetUsers.Any(u => u.Id == userId))
            throw new AccessDeniedException("This assignment is not targeted at you.");

        var attachments = dto
            .Attachments.Select(a => new Attachment(a.Id, a.FileName, a.Size, a.CreatedAt))
            .ToList();

        var existing = await dbContext
            .Submissions.Include(s => s.Author)
            .Include(s => s.Comments)
                .ThenInclude(c => c.Author)
            .FirstOrDefaultAsync(s => s.PublicationId == assignmentId && s.AuthorId == userId);

        if (existing != null)
        {
            if (existing.State != SubmissionState.Draft)
                throw new ValidationException("You have already submitted for this assignment.");

            existing.Attachments = attachments;
            existing.State = SubmissionState.Submitted;
            existing.LastSubmittedAtUTC = DateTime.UtcNow;

            await dbContext.SaveChangesAsync();

            return existing.ToSubmissionDto();
        }

        var submission = new DomainSubmission
        {
            PublicationId = assignmentId,
            AuthorId = userId,
            State = SubmissionState.Submitted,
            LastSubmittedAtUTC = DateTime.UtcNow,
            Attachments = attachments,
            Comments = [],
        };

        dbContext.Submissions.Add(submission);
        await dbContext.SaveChangesAsync();

        var saved = await dbContext
            .Submissions.Include(s => s.Author)
            .Include(s => s.Comments)
                .ThenInclude(c => c.Author)
            .GetOne(DomainSubmission.HasId(submission.Id));

        return saved.ToSubmissionDto();
    }

    public async Task<PagedResult<SubmissionListItem>> GetSubmissions(
        int assignmentId,
        PagedRequestDto dto
    )
    {
        var userId = userAccessor.GetUserId();
        var user = await dbContext.Users.GetOne(User.HasId(userId));

        var publication = await dbContext
            .Publications.Include(p => p.Course)
                .ThenInclude(c => c.Teachers)
            .GetOne(Publication.HasId(assignmentId));

        var canView =
            await userManager.HasAnyOfRoles(user, [UserRoles.Admin, UserRoles.Teacher])
            || publication.Course.Teachers.Any(t => t.Id == userId);

        if (!canView)
            throw new AccessDeniedException("You do not have permission to view submissions.");

        var pagedSubmissions = await dbContext
            .Submissions.AsNoTracking()
            .Include(s => s.Author)
            .Where(s => s.PublicationId == assignmentId)
            .ToPagingListAsync(dto, nameof(DomainSubmission.Id));

        return new PagedResult<SubmissionListItem>(
            pagedSubmissions.Data.Select(s => s.ToSubmissionListItem()).ToList(),
            pagedSubmissions.TotalCount
        );
    }

    public async Task<SubmissionDto?> GetMySubmission(int assignmentId)
    {
        var userId = userAccessor.GetUserId();

        await dbContext.Publications.GetOne(Publication.HasId(assignmentId));

        var submission = await dbContext
            .Submissions.Include(s => s.Author)
            .Include(s => s.Comments)
                .ThenInclude(c => c.Author)
            .FirstOrDefaultAsync(s => s.PublicationId == assignmentId && s.AuthorId == userId);

        return submission?.ToSubmissionDto();
    }

    public async Task<SubmissionDto> GetSubmission(int submissionId)
    {
        var userId = userAccessor.GetUserId();
        var user = await dbContext.Users.GetOne(User.HasId(userId));

        var submission = await dbContext
            .Submissions.Include(s => s.Author)
            .Include(s => s.Comments)
                .ThenInclude(c => c.Author)
            .GetOne(DomainSubmission.HasId(submissionId));

        var publication = await dbContext
            .Publications.Include(p => p.Course)
                .ThenInclude(c => c.Teachers)
            .GetOne(Publication.HasId(submission.PublicationId));

        var canView =
            await userManager.HasAnyOfRoles(user, [UserRoles.Admin, UserRoles.Teacher])
            || publication.Course.Teachers.Any(t => t.Id == userId)
            || submission.AuthorId == userId;

        if (!canView)
            throw new AccessDeniedException("You do not have permission to view this submission.");

        return submission.ToSubmissionDto();
    }

    public async Task<SubmissionDto> SaveDraft(int assignmentId, CreateSubmissionDto dto)
    {
        var userId = userAccessor.GetUserId();

        var publication = await dbContext
            .Publications.Include(p => p.Course)
                .ThenInclude(c => c.Students)
            .Include(p => p.TargetUsers)
            .GetOne(Publication.HasId(assignmentId));

        if (!publication.Course.Students.Any(s => s.Id == userId))
            throw new AccessDeniedException("You are not a student of this course.");

        if (publication.Type != PublicationType.Assignment)
            throw new ValidationException("Only assignments can have submissions.");

        if (!publication.IsForEveryone && !publication.TargetUsers.Any(u => u.Id == userId))
            throw new AccessDeniedException("This assignment is not targeted at you.");

        var attachments = dto
            .Attachments.Select(a => new Attachment(a.Id, a.FileName, a.Size, a.CreatedAt))
            .ToList();

        var existing = await dbContext
            .Submissions.Include(s => s.Author)
            .Include(s => s.Comments)
                .ThenInclude(c => c.Author)
            .FirstOrDefaultAsync(s => s.PublicationId == assignmentId && s.AuthorId == userId);

        if (existing != null)
        {
            if (existing.State != SubmissionState.Draft)
                throw new ValidationException("Cannot modify a submitted or accepted submission.");

            existing.Attachments = attachments;
            await dbContext.SaveChangesAsync();
            return existing.ToSubmissionDto();
        }

        var submission = new DomainSubmission
        {
            PublicationId = assignmentId,
            AuthorId = userId,
            State = SubmissionState.Draft,
            Attachments = attachments,
            Comments = [],
        };

        dbContext.Submissions.Add(submission);
        await dbContext.SaveChangesAsync();

        var saved = await dbContext
            .Submissions.Include(s => s.Author)
            .Include(s => s.Comments)
                .ThenInclude(c => c.Author)
            .GetOne(DomainSubmission.HasId(submission.Id));

        return saved.ToSubmissionDto();
    }

    public async Task<SubmissionDto> RetractSubmission(int assignmentId)
    {
        var userId = userAccessor.GetUserId();

        var submission =
            await dbContext
                .Submissions.Include(s => s.Author)
                .Include(s => s.Comments)
                    .ThenInclude(c => c.Author)
                .FirstOrDefaultAsync(s => s.PublicationId == assignmentId && s.AuthorId == userId)
            ?? throw new PersistenceResourceNotFoundException("Submission not found.");

        if (submission.State == SubmissionState.Accepted)
            throw new ValidationException("Cannot retract an accepted submission.");

        submission.State = SubmissionState.Draft;
        submission.LastSubmittedAtUTC = null;

        await dbContext.SaveChangesAsync();

        return submission.ToSubmissionDto();
    }

    public async Task<SubmissionDto> MarkSubmission(int submissionId, MarkDto dto)
    {
        var userId = userAccessor.GetUserId();
        var user = await dbContext.Users.GetOne(User.HasId(userId));

        var submission = await dbContext
            .Submissions.Include(s => s.Author)
            .Include(s => s.Comments)
                .ThenInclude(c => c.Author)
            .GetOne(DomainSubmission.HasId(submissionId));

        var publication = await dbContext
            .Publications.Include(p => p.Course)
                .ThenInclude(c => c.Teachers)
            .GetOne(Publication.HasId(submission.PublicationId));

        var canMark =
            await userManager.HasAnyOfRoles(user, [UserRoles.Admin, UserRoles.Teacher])
            || publication.Course.Teachers.Any(t => t.Id == userId);

        if (!canMark)
            throw new AccessDeniedException("You do not have permission to mark this submission.");

        var payload = (AssignmentPayload)publication.PublicationPayload;
        ValidateMark(payload, dto.Mark);

        submission.Mark = dto.Mark;
        submission.LastMarkedAtUTC = DateTime.UtcNow;
        submission.State = SubmissionState.Accepted;

        if (!string.IsNullOrEmpty(dto.MarkComment?.Json))
        {
            var comment = new SubmissionComment(submission.Id, userId, dto.MarkComment)
            {
                Author = user,
            };
            submission.Comments.Add(comment);
        }

        await dbContext.SaveChangesAsync();

        return submission.ToSubmissionDto();
    }

    public async Task<TeamSubmissionDto> GetTeamSubmission(int teamId)
    {
        var team = await dbContext
            .Teams.AsNoTracking()
            .Include(t => t.Members)
            .Include(t => t.Captain)
            .GetOne(Team.HasId(teamId));
        var teamAssignment = await dbContext
            .Publications.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == team.PublicationId);

        var attachments = new List<Attachment>();
        var members = new List<UserWithMarkDto>();

        foreach (var member in team.Members)
        {
            attachments.AddRange(
                await dbContext
                    .Submissions.AsNoTracking()
                    .Include(s => s.Attachments)
                    .Where(s => s.AuthorId == member.Id)
                    .SelectMany(s => s.Attachments)
                    .ToListAsync()
            );

            var submission = await dbContext
                .Submissions.AsNoTracking()
                .FirstOrDefaultAsync(s =>
                    s.AuthorId == member.Id && s.PublicationId == teamAssignment.Id
                );

            members.Add(new UserWithMarkDto { User = member.ToUserDto(), Mark = submission?.Mark });
        }

        return new TeamSubmissionDto
        {
            TeamId = team.Id,
            TeamName = team.Name,
            Attachments = attachments,
            Members = members,
            Captain = team.Captain.ToUserDto(),
        };
    }

    public async Task MarkTeamMember(int teamId, string memberId, MarkDto dto)
    {
        var userId = userAccessor.GetUserId();
        var user = await dbContext.Users.GetOne(User.HasId(userId));

        var team = await dbContext
            .Teams.Include(t => t.Members)
            .Include(t => t.Captain)
            .GetOne(Team.HasId(teamId));

        var publication = await dbContext
            .Publications.Include(p => p.Course)
                .ThenInclude(c => c.Teachers)
            .GetOne(Publication.HasId(team.PublicationId));

        var canMark =
            await userManager.HasAnyOfRoles(user, [UserRoles.Admin, UserRoles.Teacher])
            || publication.Course.Teachers.Any(t => t.Id == userId);

        if (!canMark)
            throw new AccessDeniedException("You do not have permission to mark this team member.");

        var payload = (TeamAssignmentPayload)publication.PublicationPayload;
        ValidateMark(payload, dto.Mark);

        if (!team.Members.Any(m => m.Id == memberId))
            throw new ValidationException("This user is not a member of the team.");

        var submission = await dbContext.Submissions.FirstOrDefaultAsync(s =>
            s.AuthorId == memberId && s.PublicationId == team.PublicationId
        );

        if (submission == null)
        {
            submission = new DomainSubmission
            {
                PublicationId = publication.Id,
                AuthorId = memberId,
                State = SubmissionState.Submitted,
                LastSubmittedAtUTC = DateTime.UtcNow,
                Attachments = [],
                Comments = [],
            };

            dbContext.Submissions.Add(submission);
        }

        submission.Mark = dto.Mark;
        submission.LastMarkedAtUTC = DateTime.UtcNow;

        if (!string.IsNullOrEmpty(dto.MarkComment?.Json))
        {
            var comment = new SubmissionComment(submission.Id, userId, dto.MarkComment)
            {
                Author = user,
            };
            submission.Comments.Add(comment);
        }

        await dbContext.SaveChangesAsync();
    }

    private void ValidateMark(AssignmentPayload payload, string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("Mark is required");

        switch (payload.MarkType)
        {
            case MarkType.Score:
                if (!int.TryParse(value, out var score))
                    throw new ArgumentException("Score must be a number");

                if (payload.MaxMark == null)
                    throw new InvalidOperationException("MaxMark is not set");

                if (score < 0 || score > payload.MaxMark)
                    throw new ValidationException($"Score must be between 0 and {payload.MaxMark}");

                break;

            case MarkType.PassFail:
                var normalized = value.ToLower();

                if (normalized != "pass" && normalized != "fail")
                    throw new ValidationException("Value must be 'pass' or 'fail'");

                break;
            default:
                break;
        }
    }
}
