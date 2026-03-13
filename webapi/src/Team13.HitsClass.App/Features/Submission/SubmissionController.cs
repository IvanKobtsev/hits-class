using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Team13.HitsClass.App.Features.Submission.Dto;
using Team13.WebApi.Pagination;

namespace Team13.HitsClass.App.Features.Submission
{
    [Authorize]
    [Route("api")]
    public class SubmissionController(SubmissionService submissionService)
    {
        /// <summary>
        /// Create submission
        /// </summary>
        [HttpPost("assignments/{id:int}/submission")]
        public async Task<SubmissionDto> CreateSubmission(
            [FromRoute] int id,
            [FromBody] CreateSubmissionDto dto
        )
        {
            return await submissionService.CreateSubmission(id, dto);
        }

        /// <summary>
        /// Gets all submissions for an assignment (check permission)
        /// </summary>
        [HttpGet("assignments/{id:int}/submissions")]
        public async Task<PagedResult<SubmissionListItem>> GetSubmissions(
            [FromRoute] int id,
            [FromQuery] PagedRequestDto dto
        )
        {
            return await submissionService.GetSubmissions(id, dto);
        }

        /// <summary>
        /// Gets student's submission for an assignment
        /// </summary>
        [HttpGet("assignments/{id:int}/my-submission")]
        public async Task<SubmissionDto?> GetMySubmission([FromRoute] int id)
        {
            return await submissionService.GetMySubmission(id);
        }

        /// <summary>
        /// Gets full information for specific submission (check permission)
        /// </summary>
        [HttpGet("submissions/{id:int}")]
        public async Task<SubmissionDto> GetSubmission([FromRoute] int id)
        {
            return await submissionService.GetSubmission(id);
        }

        /// <summary>
        /// Save (upsert) draft submission
        /// </summary>
        [HttpPut("assignments/{id:int}/submission/draft")]
        public async Task<SubmissionDto> SaveDraft(
            [FromRoute] int id,
            [FromBody] CreateSubmissionDto dto
        )
        {
            return await submissionService.SaveDraft(id, dto);
        }

        /// <summary>
        /// Retract student's own submission (sets state back to Draft)
        /// </summary>
        [HttpPut("assignments/{id:int}/submission/retract")]
        public async Task<SubmissionDto> RetractSubmission([FromRoute] int id)
        {
            return await submissionService.RetractSubmission(id);
        }

        /// <summary>
        /// Mark submission (check permission)
        /// </summary>
        [HttpPut("submissions/{id:int}/mark")]
        public async Task<SubmissionDto> MarkSubmission([FromRoute] int id, [FromBody] MarkDto dto)
        {
            return await submissionService.MarkSubmission(id, dto);
        }
    }
}
