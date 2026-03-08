using Team13.HitsClass.Domain;
using Team13.HitsClass.Domain.PublicationPayloadTypes;

namespace Team13.HitsClass.App.Features.Publications.Extensions;

public static class PublicationPayloadExtensions
{
    public static PublicationType GetEventType(this PublicationPayload publicationPayload)
    {
        return publicationPayload switch
        {
            AnnouncementPayload => PublicationType.Announcement,
            AssignmentPayload => PublicationType.Assignment,
            null => throw new NullReferenceException(
                $"Received null as {nameof(PublicationPayload)}"
            ),
            _ => throw new NotSupportedException(
                $"Unsupported type of {nameof(PublicationPayload)}"
            ),
        };
    }

    public static T GetCastedPayload<T>(this Publication publication)
        where T : PublicationPayload
    {
        return publication.PublicationPayload as T
            ?? throw new InvalidCastException(
                $"Could not cast {nameof(Publication.PublicationPayload)} to {typeof(T).Name}"
            );
    }
}
