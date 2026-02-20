using Team13.HitsClass.App.Features.Users.Dto;
using Team13.HitsClass.Common;

namespace Team13.HitsClass.App.Features.Submission.Dto
{
    public class SubmissionListItem
    {
        public int Id { get; }
        public SubmissionState State { get; set; }
        public string? Mark { get; set; }
        public UserDto Author { get; set; }
    }
}
