using Microsoft.AspNetCore.Mvc;
using Team13.HitsClass.App.Features.Comments.Dto;

namespace Team13.HitsClass.App.Features.Comments;

[Route("api")]
public class CommentController
{
    [HttpGet("assignments/{assignmentId:int}/comments")]
    public Task<List<CommentDto>> GetAssignmentComments(int assignmentId)
    {
        throw new NotImplementedException();
    }

    [HttpPost("assignments/{assignmentId:int}/comments")]
    public Task<CommentDto> AddCommentToAssignment(
        [FromRoute] int assignmentId,
        [FromBody] CreateCommentDto createCommentDto
    )
    {
        throw new NotImplementedException();
    }

    [HttpGet("publication/{publicationId:int}/comments")]
    public Task<List<CommentDto>> GetPublicationComments(int publicationId)
    {
        throw new NotImplementedException();
    }

    [HttpPost("publication/{publicationId:int}/comments")]
    public Task<CommentDto> AddCommentToPublication(
        [FromRoute] int publicationId,
        [FromBody] CreateCommentDto createCommentDto
    )
    {
        throw new NotImplementedException();
    }

    [HttpPatch("comments/{commentId:int}")]
    public Task EditComment([FromRoute] int commentId, [FromBody] PatchCommentDto patchCommentDto)
    {
        throw new NotImplementedException();
    }

    [HttpDelete("comments/{commentId:int}")]
    public Task DeleteComment([FromRoute] int commentId)
    {
        throw new NotImplementedException();
    }
}
