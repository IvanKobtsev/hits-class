using Team13.HitsClass.App.Features.Files.Dto;

namespace Team13.HitsClass.App.Features.Assignment.Dto
{
    public class CreateAssignmentDto
    {
        public string Title { get; set; }
        public string? Description { get; set; }
        public DateTime? DeadlineUTC { get; set; }
        public List<FileInfoDto> Attachments { get; set; }
    }
}
