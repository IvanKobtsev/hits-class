using Team13.HitsClass.App.Features.Users.Dto;

namespace Team13.HitsClass.App.Features.Team.Dto;

public class TeamDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public UserDto Captain { get; set; }
    public List<UserDto> Members { get; set; }
    public int PublicationId { get; set; }
}
