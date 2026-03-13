using Microsoft.EntityFrameworkCore;
using Team13.HitsClass.App.Features.Comments.Dto;
using Team13.HitsClass.App.Features.Users;
using Team13.HitsClass.Domain;
using Team13.HitsClass.Persistence;
using Team13.LowLevelPrimitives;
using Team13.LowLevelPrimitives.Exceptions;
using Team13.PersistenceHelpers;

namespace Team13.HitsClass.App.Features.Comments;

public class CommentService(HitsClassDbContext dbContext, IUserAccessor userAccessor)
{
    public async Task<List<CommentDto>> GetSubmissionComments(int assignmentId)
    {
        var userId = userAccessor.GetUserId();

        var submission = await dbContext
            .Submissions.Include(s => s.Comments)
                .ThenInclude(c => c.Author)
            .FirstOrDefaultAsync(s => s.PublicationId == assignmentId && s.AuthorId == userId);

        if (submission == null)
            return [];

        return submission.Comments.Select(ToCommentDto).ToList();
    }

    public async Task<CommentDto> AddSubmissionComment(int assignmentId, CreateCommentDto dto)
    {
        var userId = userAccessor.GetUserId();
        var user = await dbContext.Users.GetOne(User.HasId(userId));

        var submission = await dbContext
            .Submissions.Include(s => s.Comments)
                .ThenInclude(c => c.Author)
            .FirstOrDefaultAsync(s => s.PublicationId == assignmentId && s.AuthorId == userId);

        if (submission == null)
            throw new ValidationException("No submission found for this assignment.");

        var comment = new SubmissionComment(submission.Id, userId, dto.TextLexical)
        {
            Author = user,
        };
        submission.Comments.Add(comment);
        await dbContext.SaveChangesAsync();

        return ToCommentDto(comment);
    }

    public async Task<CommentDto> AddCommentToSubmissionById(int submissionId, CreateCommentDto dto)
    {
        var userId = userAccessor.GetUserId();
        var user = await dbContext.Users.GetOne(User.HasId(userId));

        var submission =
            await dbContext
                .Submissions.Include(s => s.Comments)
                    .ThenInclude(c => c.Author)
                .FirstOrDefaultAsync(s => s.Id == submissionId)
            ?? throw new ValidationException("Submission not found.");

        var comment = new SubmissionComment(submissionId, userId, dto.TextLexical)
        {
            Author = user,
        };
        submission.Comments.Add(comment);
        await dbContext.SaveChangesAsync();
        return ToCommentDto(comment);
    }

    public async Task<List<CommentDto>> GetPublicationComments(int publicationId)
    {
        var comments = await dbContext
            .PublicationComments.Include(c => c.Author)
            .Where(c => c.PublicationId == publicationId)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();

        return comments.Select(ToCommentDto).ToList();
    }

    public async Task<CommentDto> AddPublicationComment(int publicationId, CreateCommentDto dto)
    {
        var userId = userAccessor.GetUserId();
        var user = await dbContext.Users.GetOne(User.HasId(userId));

        await dbContext.Publications.GetOne(Publication.HasId(publicationId));

        var comment = new PublicationComment(publicationId, userId, dto.TextLexical)
        {
            Author = user,
        };
        dbContext.PublicationComments.Add(comment);
        await dbContext.SaveChangesAsync();

        return ToCommentDto(comment);
    }

    private static CommentDto ToCommentDto(SubmissionComment c) =>
        new()
        {
            Id = c.Id,
            CreatedAt = c.CreatedAt,
            LastEditedAt = c.LastEditedAt,
            Author = c.Author.ToUserDto(),
            TextLexical = c.TextLexical,
        };

    private static CommentDto ToCommentDto(PublicationComment c) =>
        new()
        {
            Id = c.Id,
            CreatedAt = c.CreatedAt,
            LastEditedAt = c.LastEditedAt,
            Author = c.Author.ToUserDto(),
            TextLexical = c.TextLexical,
        };
}
