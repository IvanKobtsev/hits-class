using System;
using System.Linq;
using System.Linq.Expressions;
using NeinLinq;
using Team13.HitsClass.App.Features.Comments.Dto;
using Team13.HitsClass.App.Features.Files.Dto;
using Team13.HitsClass.App.Features.Users;

namespace Team13.HitsClass.App.Features.Submission.Extensions;

public static class SubmissionExtensions
{
    [InjectLambda]
    public static Dto.SubmissionDto ToSubmissionDto(this Domain.Submission submission)
    {
        return _toSubmissionDtoExpressionCompiled.Value(submission);
    }

    private static readonly Lazy<
        Func<Domain.Submission, Dto.SubmissionDto>
    > _toSubmissionDtoExpressionCompiled = new(() => ToSubmissionDtoExpression().Compile());

    private static Expression<
        Func<Domain.Submission, Dto.SubmissionDto>
    > ToSubmissionDtoExpression()
    {
        return submission => new Dto.SubmissionDto
        {
            Id = submission.Id,
            State = submission.State,
            Mark = submission.Mark,
            LastSubmittedAtUTC = submission.LastSubmittedAtUTC,
            LastMarkedAtUTC = submission.LastMarkedAtUTC,
            Author = submission.Author.ToUserDto(),
            Attachments = submission
                .Attachments.Select(a => new FileInfoDto
                {
                    Id = a.Uuid,
                    FileName = a.FileName,
                    Size = a.Size,
                    CreatedAt = a.CreatedAt,
                    Metadata = new FileMetadataDto(),
                })
                .ToList(),
            Comments = submission
                .Comments.Select(c => new CommentDto
                {
                    Id = c.Id,
                    CreatedAt = c.CreatedAt,
                    LastEditedAt = c.LastEditedAt,
                    Author = c.Author.ToUserDto(),
                    Content = c.Content,
                })
                .ToList(),
        };
    }

    [InjectLambda]
    public static Dto.SubmissionListItem ToSubmissionListItem(this Domain.Submission submission)
    {
        return _toSubmissionListItemExpressionCompiled.Value(submission);
    }

    private static readonly Lazy<
        Func<Domain.Submission, Dto.SubmissionListItem>
    > _toSubmissionListItemExpressionCompiled = new(() =>
        ToSubmissionListItemExpression().Compile()
    );

    private static Expression<
        Func<Domain.Submission, Dto.SubmissionListItem>
    > ToSubmissionListItemExpression()
    {
        return submission => new Dto.SubmissionListItem
        {
            Id = submission.Id,
            State = submission.State,
            Mark = submission.Mark,
            Author = submission.Author.ToUserDto(),
        };
    }
}
