using Microsoft.AspNetCore.Mvc;
using Team13.HitsClass.App.Features.Teams.Dto;

namespace Team13.HitsClass.App.Features.Teams
{
    [Route("api")]
    [ApiController]
    public class TeamController(TeamService teamService)
    {
        /// <summary>
        /// Add a new member to the team (as teacher)
        /// </summary>
        [HttpPost("teams/{id:int}")]
        public async Task<TeamDto> AddTeamMember([FromRoute] int id, [FromBody] string studentId)
        {
            return await teamService.AddStudentToTeam(id, studentId);
        }

        /// <summary>
        /// Check if student already has a team for this assignment
        /// </summary>
        [HttpGet("team-assignments/{id:int}/team")]
        public async Task<bool> IsStudentInATeam([FromRoute] int id, [FromBody] string studentId)
        {
            return await teamService.IsStudentInATeam(id, studentId);
        }
    }
}
