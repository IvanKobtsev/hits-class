using Team13.HitsClass.App.Features.Files.Dto;
using Team13.HitsClass.App.Features.Publications.Dto;
using Team13.HitsClass.Domain.PublicationPayloadTypes;

namespace Team13.HitsClass.App.Features.Announcement.Dto
{
    public class CreateAnnouncementDto : CreatePublicationDto
    {
        public AnnouncementPayload Payload { get; set; }
    }
}
