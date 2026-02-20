using Team13.HitsClass.App.Features.Comments.Dto;
using Team13.HitsClass.App.Features.Files.Dto;
using Team13.HitsClass.App.Features.Users.Dto;
using Team13.HitsClass.Common;

namespace Team13.HitsClass.App.Features.Submission.Dto
{
    public class SubmissionDto
    {
        public int Id { get; }
        public SubmissionState State { get; set; }
        public string? Mark { get; set; }
        public DateTime? LastSubmittedAtUTC { get; set; }
        public DateTime? LastMarkedAtUTC { get; set; }
        public List<FileInfoDto> Attachments { get; set; }
        public UserDto Author { get; set; }
        public List<CommentDto> Comments { get; set; }
    }
}
