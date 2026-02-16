using Team13.HitsClass.App.Features.Users.Dto;

namespace Team13.HitsClass.App.Features.Courses.Dto;

public class CourseDto
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; }

    public UserDto Owner { get; set; }
    public List<UserDto> Teachers { get; set; }
    public string InviteCode { get; set; }

    public string Title { get; set; }
    public string Description { get; set; }
}
