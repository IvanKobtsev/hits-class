using Microsoft.AspNetCore.Mvc;
using Team13.HitsClass.App.Features.Teams.Dto;

namespace Team13.HitsClass.App.Features.Teams
{
    [Route("api")]
    [ApiController]
    public class TeamController(TeamService teamService)
    {
        /// <summary>
        /// Get teams for specific team assignment
        /// </summary>
        [HttpGet("team-assignments/{assignmentId:int}/teams")]
        public async Task<List<TeamDto>> GetTeamsForAssignment([FromRoute] int assignmentId) =>
            await teamService.GetTeamsForAssignment(assignmentId);

        /// <summary>
        /// Create a team for a team assignment (Free distribution mode only)
        /// </summary>
        [HttpPost("team-assignments/{assignmentId:int}/teams")]
        public async Task<TeamDto> CreateTeam(
            [FromRoute] int assignmentId,
            [FromBody] CreateTeamDto dto
        ) => await teamService.CreateTeam(assignmentId, dto);

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

        /// <summary>
        /// Remove member of a team
        /// </summary>
        [HttpDelete("teams/{id:int}")]
        public async Task<TeamDto> RemoveTeamMember([FromRoute] int id, [FromBody] string studentId)
        {
            return await teamService.RemoveTeamMember(id, studentId);
        }

        /// <summary>
        /// Pass the role of the captain
        /// </summary>
        [HttpPut("teams/{id:int}")]
        public async Task<TeamDto> PassCaptainRole(
            [FromRoute] int id,
            [FromBody] string newCaptainId
        )
        {
            return await teamService.PassCaptainRole(id, newCaptainId);
        }
    }
}
