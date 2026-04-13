using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Team13.HitsClass.App.Features.Team.Dto;

namespace Team13.HitsClass.App.Features.Team;

[Route("api/team-assignments")]
[ApiController]
[Authorize]
public class TeamController(TeamService teamService)
{
    /// <summary>
    /// Create a team for a team assignment (Free distribution mode only)
    /// </summary>
    [HttpPost("{assignmentId:int}/teams")]
    public async Task<TeamDto> CreateTeam(
        [FromRoute] int assignmentId,
        [FromBody] CreateTeamDto dto
    ) => await teamService.CreateTeam(assignmentId, dto);
}
