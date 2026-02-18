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
        [HttpGet("{id:int}")]
        public async Task<AnnouncementDto> GetAssignment([FromRoute] int id)
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
        public async Task CreateAssignment([FromBody] CreateAssignmentDto dto)
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
