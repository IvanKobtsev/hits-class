using Microsoft.AspNetCore.Mvc;
using Team13.HitsClass.App.Features.PeerReview.Dto;

namespace Team13.HitsClass.App.Features.PeerReview;

[Route("api/assignments/{assignmentId:int}/peer-review")]
[ApiController]
public class PeerReviewController(PeerReviewService peerReviewService)
{
    [HttpGet("mappings")]
    public async Task<List<PeerReviewMappingDto>> GetMappings([FromRoute] int assignmentId) =>
        await peerReviewService.GetMappings(assignmentId);

    [HttpPut("mappings")]
    public async Task UpdateMappings(
        [FromRoute] int assignmentId,
        [FromBody] UpdatePeerReviewMappingsDto dto
    ) => await peerReviewService.UpdateMappings(assignmentId, dto);

    [HttpPost("regenerate")]
    public async Task RegenerateMappings([FromRoute] int assignmentId) =>
        await peerReviewService.RegenerateMappings(assignmentId);

    /// <summary>
    /// Submit peer review
    /// </summary>
    [HttpPost("/api/peer-review-assignment/{id:int}")]
    public async Task<PeerReviewDto> CreatePeerReview(
        [FromRoute] int id,
        [FromBody] CreatePeerReviewDto reviewDto
    ) => await peerReviewService.CreatePeerReview(id, reviewDto);

    /// <summary>
    /// Get peer review assignments
    /// </summary>
    [HttpGet]
    public async Task<List<PeerReviewAssignmentDto>> GetPeerReviewAssignments(
        [FromRoute] int assignmentId
    ) => await peerReviewService.GetPeerReviewAssignments(assignmentId);

    /// <summary>
    /// Delete peer review
    /// </summary>
    [HttpDelete("/api/peer-review/{id:int}")]
    public async Task DeletePeerReview([FromRoute] int id) =>
        await peerReviewService.DeletePeerReview(id);

    /// <summary>
    /// Get general information about peer review for one defendant (for teachers)
    /// </summary>
    [HttpGet("/api/assignments/{assignmentId:int}/defendant/{defendantId}/peer-reviews")]
    public async Task<List<PeerReviewAssignmentDto>> GetPeerReviewsGeneral(
        [FromRoute] int assignmentId,
        [FromRoute] string defendantId
    ) => await peerReviewService.GetPeerReviewsGeneral(assignmentId, defendantId);

    /// <summary>
    /// Get full review information by review id
    /// </summary>
    [HttpGet("/api/peer-reviews/{id:int}")]
    public async Task<PeerReviewDto> GetPeerReview([FromRoute] int id) =>
        await peerReviewService.GetPeerReview(id);

    /// <summary>
    /// Get full review information by assignment id (for students)
    /// </summary>
    [HttpGet("/api/peer-review-assignment/{id:int}/review")]
    public async Task<PeerReviewDto> GetReview([FromRoute] int id) =>
        await peerReviewService.GetReview(id);

    /// <summary>
    /// Update review
    /// </summary>
    [HttpPut("/api/peer-reviews/{id:int}")]
    public async Task<PeerReviewDto> UpdatePeerReview(
        [FromRoute] int id,
        [FromBody] UpdatePeerReviewDto dto
    ) => await peerReviewService.UpdatePeerReview(id, dto);
}
