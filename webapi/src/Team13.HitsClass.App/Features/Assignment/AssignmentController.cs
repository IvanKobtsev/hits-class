using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Team13.HitsClass.App.Features.Announcement;
using Team13.HitsClass.App.Features.Announcement.Dto;
using Team13.HitsClass.App.Features.Assignment.Dto;

namespace Team13.HitsClass.App.Features.Assignment
{
    [Route("api/assignment")]
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
        [HttpGet("{id}")]
        public async Task<AnnouncementDto> GetAssignment([FromRoute] Guid id)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Gets statistics for specific assignment
        /// </summary>
        [HttpGet("{id}/statistics")]
        public async Task<AssignmentStatisticDto> GetAssignmentStatistics([FromRoute] Guid id)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Create assignment (check permission)
        /// </summary>
        [HttpPost]
        public async Task CreateAssignment([FromBody] CreateAssignmentDto dto)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Update specific assignment (check permission)
        /// </summary>
        [HttpPut("{id}")]
        public async Task UpdateAssignment([FromRoute] Guid id, [FromBody] CreateAssignmentDto dto)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Delete specific assignment (check permission)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task DeleteAssignment([FromRoute] Guid id)
        {
            throw new NotImplementedException();
        }
    }
}
