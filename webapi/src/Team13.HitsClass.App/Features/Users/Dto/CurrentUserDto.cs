namespace Team13.HitsClass.App.Features.Users.Dto;

public class CurrentUserDto : UserDto
{
    public string Username { get; set; }
    public bool IsTeacherSystemWide { get; set; }
    public bool IsAdmin { get; set; }
}
