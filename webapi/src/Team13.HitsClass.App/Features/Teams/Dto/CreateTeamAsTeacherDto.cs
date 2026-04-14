using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Team13.HitsClass.App.Features.Teams.Dto;

public class CreateTeamAsTeacherDto
{
    [Required]
    public string Name { get; set; }

    [Required]
    public List<string> StudentIds { get; set; }
}
