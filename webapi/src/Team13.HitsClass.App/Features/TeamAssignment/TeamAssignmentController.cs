using Microsoft.AspNetCore.Mvc;
using Team13.HitsClass.App.Features.Assignment;
using Team13.HitsClass.App.Features.Publications.Dto;
using Team13.HitsClass.App.Features.TeamAssignment.Dto;

namespace Team13.HitsClass.App.Features.TeamAssignment
{
    [Route("api/team-assignments")]
    [ApiController]
    public class TeamAssignmentController
    {
        private readonly TeamAssignmentService _teamAssignmentService;

        public TeamAssignmentController(TeamAssignmentService assignmentService)
        {
            _teamAssignmentService = assignmentService;
        }

        ///// <summary>
        ///// Gets statistics for specific team assignment
        ///// </summary>
        //[HttpGet("{id:int}/statistics")]
        //public async Task<AssignmentStatisticDto> GetAssignmentStatistics([FromRoute] int id) =>
        //    await _teamAssignmentService.GetAssignmentStatistics(id);

        /// <summary>
        /// Create assignment (check permission)
        /// </summary>
        [HttpPost("/api/courses/{courseId:int}/team-assignments")]
        public async Task<PublicationDto> CreateAssignment(
            [FromRoute] int courseId,
            [FromBody] CreateTeamAssignmentDto dto
        ) => await _teamAssignmentService.CreateTeamAssignment(courseId, dto);

        /// <summary>
        /// Update specific team assignment (check permission)
        /// </summary>
        [HttpPut("{assignmentId:int}")]
        public async Task<PublicationDto> PatchAssignment(
            [FromRoute] int assignmentId,
            [FromBody] PatchTeamAssignmentDto dto
        ) => await _teamAssignmentService.PatchTeamAssignment(assignmentId, dto);

        /// <summary>
        /// Delete specific teamassignment (check permission)
        /// </summary>
        [HttpDelete("{assignmentId:int}")]
        public async Task DeleteAssignment([FromRoute] int assignmentId) =>
            await _teamAssignmentService.DeleteTeamAssignment(assignmentId);

        /// <summary>
        /// Creates a team for a specific team assignment as a student.
        /// </summary>
        [HttpPost("{assignmentId:int}/teams")]
        public async Task<TeamDto> CreateTeam(
            [FromRoute] int assignmentId,
            [FromBody] CreateTeamDto dto
        ) => await _teamAssignmentService.CreateTeam(assignmentId, dto);
    }
}
