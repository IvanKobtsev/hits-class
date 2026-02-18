using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Team13.HitsClass.App.Features.Announcement;
using Team13.HitsClass.App.Features.Announcement.Dto;
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
        [HttpPost("submission")]
        public async Task CreateSubmission([FromBody] CreateSubmissionDto dto)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Gets all submissions for an assignment (check permission)
        /// </summary>
        [HttpGet("assignment/{id}/submissions")]
        public async Task<List<SubmissionListElement>> GetSubmissions([FromRoute] Guid id)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Gets full information for specific submission (check permission)
        /// </summary>
        [HttpGet("submission/{id}")]
        public async Task<SubmissionDto> GetSubmission([FromRoute] Guid id)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Mark submission (check permission)
        /// </summary>
        [HttpPut("submission/{id}/mark")]
        public async Task<SubmissionDto> MarkSubmission([FromRoute] Guid id, [FromBody] MarkDto dto)
        {
            throw new NotImplementedException();
        }
    }
}
