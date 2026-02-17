using Team13.HitsClass.App.Features.Files.Dto;
using Team13.HitsClass.Domain.Enums;

namespace Team13.HitsClass.App.Features.Submission.Dto
{
    public class SubmissionDto
    {
        public Guid Id { get; }
        public SubmissionState State { get; set; }
        public string? Mark { get; set; }
        public DateTime? LastSubmittedAtUTC { get; set; }
        public DateTime? LastMarkedAtUTC { get; set; }
        public List<FileInfoDto> Attachments { get; set; }
        // public UserDto Author { get; set; }
        // public List<Comment> Comments { get; set; }
    }
}
