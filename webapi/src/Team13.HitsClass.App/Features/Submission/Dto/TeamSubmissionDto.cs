using Team13.HitsClass.App.Features.Users.Dto;
using Team13.HitsClass.Domain;

namespace Team13.HitsClass.App.Features.Submission.Dto;

public class TeamSubmissionDto
{
    public int TeamId { get; set; }
    public string TeamName { get; set; }
    public UserDto Captain { get; set; }
    public List<UserWithMarkDto> Members { get; set; }
    public List<Attachment> Attachments { get; set; }
}
