using Team13.HitsClass.App.Features.Comments.Dto;
using Team13.HitsClass.App.Features.Files.Dto;
using Team13.HitsClass.App.Features.Users;

namespace Team13.HitsClass.App.Features.Submission.Extensions;

public static class SubmissionExtensions
{
    public static Dto.SubmissionDto ToSubmissionDto(this Domain.Submission submission)
    {
        return new Dto.SubmissionDto
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
                    TextLexical = c.TextLexical,
                })
                .ToList(),
        };
    }

    public static Dto.SubmissionListItem ToSubmissionListItem(this Domain.Submission submission)
    {
        return new Dto.SubmissionListItem
        {
            Id = submission.Id,
            State = submission.State,
            Mark = submission.Mark,
            Author = submission.Author.ToUserDto(),
        };
    }
}
