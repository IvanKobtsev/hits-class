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
        /// Create a team for a team assignment
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
        public async Task<bool> IsStudentInATeam([FromRoute] int id, [FromQuery] string studentId)
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
        /// Disband a team (captain or teacher only)
        /// </summary>
        [HttpDelete("teams/{id:int}/disband")]
        public async Task DisbandTeam([FromRoute] int id) => await teamService.DisbandTeam(id);

        /// <summary>
        /// Create a team for a team assignment (as teacher)
        /// </summary>
        [HttpPost("team-assignments/{assignmentId:int}/teams/teacher")]
        public async Task<TeamDto> CreateTeamAsTeacher(
            [FromRoute] int assignmentId,
            [FromBody] CreateTeamAsTeacherDto dto
        ) => await teamService.CreateTeamAsTeacher(assignmentId, dto);
    }
}
