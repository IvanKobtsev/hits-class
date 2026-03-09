using System;

namespace Team13.HitsClass.Domain;

public class Comment
{
    public int Id { get; set; }
    public int SubmissionId { get; set; }
    public Submission Submission { get; set; }
    public string AuthorId { get; set; }
    public User Author { get; set; }
    public string TextLexical { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastEditedAt { get; set; }

    /// <summary>
    /// Needed for Entity Framework, keep empty.
    /// </summary>
    public Comment() { }

    public Comment(int submissionId, string authorId, string textLexical)
    {
        SubmissionId = submissionId;
        AuthorId = authorId;
        TextLexical = textLexical;
        CreatedAt = DateTime.UtcNow;
    }
}
