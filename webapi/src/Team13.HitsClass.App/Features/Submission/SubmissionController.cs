using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Team13.HitsClass.App.Features.Submission.Dto;

namespace Team13.HitsClass.App.Features.Submission
{
    [Authorize]
    [Route("api")]
    public class SubmissionController
    {
        public SubmissionController() { }

        /// <summary>
        /// Create submission
        /// </summary>
        [HttpPost("assignments/{id:int}/submission")]
        public async Task<SubmissionDto> CreateSubmission(
            [FromRoute] int id,
            [FromBody] CreateSubmissionDto dto
        )
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Gets all submissions for an assignment (check permission)
        /// </summary>
        [HttpGet("assignments/{id:int}/submissions")]
        public async Task<List<SubmissionListItem>> GetSubmissions([FromRoute] int id)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Gets student's submission for an assignment
        /// </summary>
        [HttpGet("assignments/{id:int}/my-submission")]
        public async Task<SubmissionDto> GetMySubmission([FromRoute] int id)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Gets full information for specific submission (check permission)
        /// </summary>
        [HttpGet("submissions/{id:int}")]
        public async Task<SubmissionDto> GetSubmission([FromRoute] int id)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Mark submission (check permission)
        /// </summary>
        [HttpPut("submissions/{id:int}/mark")]
        public async Task<SubmissionDto> MarkSubmission([FromRoute] int id, [FromBody] MarkDto dto)
        {
            throw new NotImplementedException();
        }
    }
}
