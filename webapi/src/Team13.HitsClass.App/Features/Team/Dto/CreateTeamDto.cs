using System.ComponentModel.DataAnnotations;

namespace Team13.HitsClass.App.Features.Team.Dto;

public class CreateTeamDto
{
    [Required]
    public string Name { get; set; }
}
