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
        [HttpPost("assignment/{id:int}/submission")]
        public async Task CreateSubmission([FromRoute] int id, [FromBody] CreateSubmissionDto dto)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Gets all submissions for an assignment (check permission)
        /// </summary>
        [HttpGet("assignment/{id:int}/submissions")]
        public async Task<List<SubmissionListElement>> GetSubmissions([FromRoute] int id)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Gets student's submission for an assignment
        /// </summary>
        [HttpGet("assignment/{id:int}/submission/my")]
        public async Task<SubmissionDto> GetMySubmission([FromRoute] int id)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Gets full information for specific submission (check permission)
        /// </summary>
        [HttpGet("submission/{id:int}")]
        public async Task<SubmissionDto> GetSubmission([FromRoute] int id)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Mark submission (check permission)
        /// </summary>
        [HttpPut("submission/{id:int}/mark")]
        public async Task<SubmissionDto> MarkSubmission([FromRoute] int id, [FromBody] MarkDto dto)
        {
            throw new NotImplementedException();
        }
    }
}
