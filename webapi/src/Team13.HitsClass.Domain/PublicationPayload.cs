using System.Text.Json.Serialization;
using Team13.HitsClass.Common;
using Team13.HitsClass.Common.Attributes;
using Team13.HitsClass.Domain.PublicationPayloadTypes;

namespace Team13.HitsClass.Domain;

/// <summary>
/// Base class for publication payloads used to allow for
/// different types of content/logic based on the type.
/// </summary>
[DoNotCheckPatchRequest]
[JsonPolymorphic(
    TypeDiscriminatorPropertyName = PublicationConstants.PublicationTypeDiscriminatorPropertyName
)]
[JsonDerivedType(typeof(AnnouncementPayload), nameof(PublicationType.Announcement))]
[JsonDerivedType(typeof(AssignmentPayload), nameof(PublicationType.Assignment))]
public abstract class PublicationPayload { }
