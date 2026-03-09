using Microsoft.AspNetCore.Mvc;
using Team13.HitsClass.App.Features.Assignment.Dto;
using Team13.HitsClass.App.Features.Publications.Dto;

namespace Team13.HitsClass.App.Features.Assignment
{
    [Route("api/assignments")]
    [ApiController]
    public class AssignmentController
    {
        private readonly AssignmentService _assignmentService;

        public AssignmentController(AssignmentService assignmentService)
        {
            _assignmentService = assignmentService;
        }

        /// <summary>
        /// Gets statistics for specific assignment
        /// </summary>
        [HttpGet("{id:int}/statistics")]
        public async Task<AssignmentStatisticDto> GetAssignmentStatistics([FromRoute] int id) =>
            await _assignmentService.GetAssignmentStatistics(id);

        /// <summary>
        /// Create assignment (check permission)
        /// </summary>
        [HttpPost("/api/courses/{courseId:int}/assignments")]
        public async Task<PublicationDto> CreateAssignment(
            [FromRoute] int courseId,
            [FromBody] CreateAssignmentDto dto
        ) => await _assignmentService.CreateAssignment(courseId, dto);

        /// <summary>
        /// Update specific assignment (check permission)
        /// </summary>
        [HttpPut("{assignmentId:int}")]
        public async Task<PublicationDto> PatchAssignment(
            [FromRoute] int assignmentId,
            [FromBody] PatchAssignmentDto dto
        ) => await _assignmentService.PatchAssignment(assignmentId, dto);

        /// <summary>
        /// Delete specific assignment (check permission)
        /// </summary>
        [HttpDelete("{assignmentId:int}")]
        public async Task DeleteAssignment([FromRoute] int assignmentId) =>
            await _assignmentService.DeleteAssignment(assignmentId);
    }
}
