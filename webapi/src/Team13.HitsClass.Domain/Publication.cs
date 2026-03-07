using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Team13.DomainHelpers;
using Team13.HitsClass.Domain.PublicationPayloadTypes;

namespace Team13.HitsClass.Domain;

/// <summary>
/// Summary description for Publication
/// </summary>
[PrimaryKey(nameof(Id))]
public class Publication
{
    public int Id { get; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime LastUpdatedAtUtc { get; set; }
    public PublicationType Type { get; set; }
    public string AuthorId { get; set; }
    public User Author { get; set; }
    public string Content { get; set; }
    public List<User> ForWhom { get; set; }
    public List<Submission>? Submissions { get; set; }
    public List<Attachment> Attachments { get; set; }

    // public List<Comment> Comments { get; set; }

    /// <summary>
    /// An extra payload to allow for different types
    /// of content/logic.
    /// </summary>
    public JsonDocument PublicationPayloadJson { get; set; } = null!;

    [NotMapped]
    public PublicationPayload PublicationPayload
    {
        get => DeserializePayload(Type, PublicationPayloadJson);
        set => PublicationPayloadJson = SerializePayload(value);
    }

    #region PublicationPayload serialization/deserialization logic

    private static PublicationPayload DeserializePayload(PublicationType type, JsonDocument jsonDoc)
    {
        var root = jsonDoc.RootElement;

        return type switch
        {
            PublicationType.Announcement => root.Deserialize<AnnouncementPayload>()!,
            PublicationType.Assignment => root.Deserialize<AssignmentPayload>()!,
            _ => throw new NotSupportedException($"Unsupported type {type}"),
        };
    }

    private static JsonDocument SerializePayload(PublicationPayload payload)
    {
        return JsonSerializer.SerializeToDocument(payload, payload.GetType());
    }

    #endregion

    #region Specifications

    public static Specification<Publication> HasId(int id)
    {
        return new Specification<Publication>(nameof(HasId), p => p.Id == id, id);
    }

    #endregion

    /// <summary>
    /// Needed for Entity Framework, keep empty.
    /// </summary>
    public Publication() { }
}
