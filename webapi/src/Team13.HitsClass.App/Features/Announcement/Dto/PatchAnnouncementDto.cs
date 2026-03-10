using Team13.HitsClass.App.Features.Publications.Dto;

namespace Team13.HitsClass.App.Features.Announcement.Dto
{
    public class PatchAnnouncementDto : PatchPublicationDto
    {
        public PatchAnnouncementPayloadDto? Payload { get; set; }
    }
}
