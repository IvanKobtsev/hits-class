using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Features.Submission.Dto;
using Team13.HitsClass.App.Features.Submission.Extensions;
using Team13.HitsClass.App.Utils;
using Team13.HitsClass.Common;
using Team13.HitsClass.Domain;
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

        if (publication.Type != PublicationType.Assignment)
            throw new ValidationException("Only assignments can have submissions.");

        if (!publication.IsForEveryone && !publication.TargetUsers.Any(u => u.Id == userId))
            throw new AccessDeniedException("This assignment is not targeted at you.");

        var duplicate = await dbContext.Submissions.AnyAsync(s =>
            s.PublicationId == assignmentId && s.AuthorId == userId
        );
        if (duplicate)
            throw new ValidationException("You have already submitted for this assignment.");

        var attachments = dto
            .Attachments.Select(a => new Attachment(a.Id, a.FileName, a.Size, a.CreatedAt))
            .ToList();

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
}
