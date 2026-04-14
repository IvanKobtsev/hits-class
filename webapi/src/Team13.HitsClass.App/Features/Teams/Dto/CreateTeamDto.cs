using System.ComponentModel.DataAnnotations;

namespace Team13.HitsClass.App.Features.Teams.Dto;

public class CreateTeamDto
{
    [Required]
    public string Name { get; set; }

    public string? CaptainId { get; set; }
}
