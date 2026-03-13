using System;
using Team13.HitsClass.Common;

namespace Team13.HitsClass.Domain;

public class SubmissionComment
{
    public int Id { get; set; }
    public int SubmissionId { get; set; }
    public Submission Submission { get; set; }
    public string AuthorId { get; set; }
    public User Author { get; set; }
    public LexicalState Content { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastEditedAt { get; set; }

    /// <summary>
    /// Needed for Entity Framework, keep empty.
    /// </summary>
    public SubmissionComment() { }

    public SubmissionComment(int submissionId, string authorId, LexicalState content)
    {
        SubmissionId = submissionId;
        AuthorId = authorId;
        Content = content;
        CreatedAt = DateTime.UtcNow;
    }
}
