using Microsoft.AspNetCore.Mvc;
using Team13.HitsClass.App.Features.Assignment.Dto;

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
        /// Gets full information for specific assignment
        /// </summary>
        [HttpGet("{id:int}")]
        public async Task<AssignmentDto> GetAssignment([FromRoute] int id)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Gets statistics for specific assignment
        /// </summary>
        [HttpGet("{id:int}/statistics")]
        public async Task<AssignmentStatisticDto> GetAssignmentStatistics([FromRoute] int id)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Create assignment (check permission)
        /// </summary>
        [HttpPost]
        public async Task<AssignmentDto> CreateAssignment([FromBody] CreateAssignmentDto dto)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Update specific assignment (check permission)
        /// </summary>
        [HttpPut("{id:int}")]
        public async Task UpdateAssignment([FromRoute] int id, [FromBody] CreateAssignmentDto dto)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Delete specific assignment (check permission)
        /// </summary>
        [HttpDelete("{id:int}")]
        public async Task DeleteAssignment([FromRoute] int id)
        {
            throw new NotImplementedException();
        }
    }
}
