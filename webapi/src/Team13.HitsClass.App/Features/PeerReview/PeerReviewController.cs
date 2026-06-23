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

    [HttpPost("/api/peer-review-assignment/{id:int}")]
    public async Task<PeerReviewDto> CreatePeerReview(
        [FromRoute] int id,
        [FromBody] CreatePeerReviewDto reviewDto
    ) => await peerReviewService.CreatePeerReview(id, reviewDto);

    [HttpGet]
    public async Task<List<PeerReviewAssignmentDto>> GetPeerReviewAssignments([FromRoute] int id) =>
        await peerReviewService.GetPeerReviewAssignments(id);

    [HttpDelete("/api/peer-review/{id:int}")]
    public async Task DeletePeerReview([FromRoute] int id) =>
        await peerReviewService.DeletePeerReview(id);
}
