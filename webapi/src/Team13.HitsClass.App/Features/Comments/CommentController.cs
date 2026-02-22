using Microsoft.AspNetCore.Mvc;
using Team13.HitsClass.App.Features.Comments.Dto;

namespace Team13.HitsClass.App.Features.Comments;

[Route("api")]
public class CommentController
{
    /// <summary>
    /// Retrieves all Comments of the specified Assignment.
    /// </summary>
    [HttpGet("assignments/{assignmentId:int}/comments")]
    public Task<List<CommentDto>> GetAssignmentComments(int assignmentId)
    {
        throw new NotImplementedException();
    }

    /// <summary>
    /// Adds a Comment to the specified Assignment.
    /// </summary>
    [HttpPost("assignments/{assignmentId:int}/comments")]
    public Task<CommentDto> AddCommentToAssignment(
        [FromRoute] int assignmentId,
        [FromBody] CreateCommentDto createCommentDto
    )
    {
        throw new NotImplementedException();
    }

    /// <summary>
    /// Retrieves all Comments of the specified Publication.
    /// </summary>
    [HttpGet("publication/{publicationId:int}/comments")]
    public Task<List<CommentDto>> GetPublicationComments(int publicationId)
    {
        throw new NotImplementedException();
    }

    /// <summary>
    /// Adds a Comment to the specified Publication.
    /// </summary>
    [HttpPost("publication/{publicationId:int}/comments")]
    public Task<CommentDto> AddCommentToPublication(
        [FromRoute] int publicationId,
        [FromBody] CreateCommentDto createCommentDto
    )
    {
        throw new NotImplementedException();
    }

    /// <summary>
    /// Edits a Comment. Only the author of the comment or an admin can edit a comment.
    /// </summary>
    [HttpPatch("comments/{commentId:int}")]
    public Task EditComment([FromRoute] int commentId, [FromBody] PatchCommentDto patchCommentDto)
    {
        throw new NotImplementedException();
    }

    /// <summary>
    /// Deletes a Comment.
    /// Only the author of the comment or an admin can delete a comment.
    /// </summary>
    [HttpDelete("comments/{commentId:int}")]
    public Task DeleteComment([FromRoute] int commentId)
    {
        throw new NotImplementedException();
    }
}
