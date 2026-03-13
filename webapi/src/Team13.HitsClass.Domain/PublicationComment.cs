using System;
using System.ComponentModel.DataAnnotations.Schema;
using Team13.HitsClass.Common;

namespace Team13.HitsClass.Domain;

public class PublicationComment
{
    public int Id { get; set; }
    public int PublicationId { get; set; }
    public Publication Publication { get; set; }
    public string AuthorId { get; set; }

    [ForeignKey(nameof(AuthorId))]
    public User Author { get; set; }

    public LexicalState Content { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastEditedAt { get; set; }

    /// <summary>
    /// Needed for Entity Framework, keep empty.
    /// </summary>
    public PublicationComment() { }

    public PublicationComment(int publicationId, string authorId, LexicalState content)
    {
        PublicationId = publicationId;
        AuthorId = authorId;
        Content = content;
        CreatedAt = DateTime.UtcNow;
    }
}
