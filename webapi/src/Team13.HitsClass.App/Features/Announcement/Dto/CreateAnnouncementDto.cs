using Team13.HitsClass.App.Features.Files.Dto;

namespace Team13.HitsClass.App.Features.Announcement.Dto
{
    public class CreateAnnouncementDto
    {
        public string Title { get; set; }
        public string? Description { get; set; }
        public List<FileInfoDto> Attachments { get; set; }
    }
}
