using Microsoft.AspNetCore.Mvc;
using Team13.HitsClass.App.Features.Comments.Dto;

namespace Team13.HitsClass.App.Features.Comments;

[Route("api")]
[ApiController]
public class CommentController(CommentService commentService)
{
    /// <summary>
    /// Retrieves all Comments of the current user's submission for the specified Assignment.
    /// </summary>
    [HttpGet("assignments/{assignmentId:int}/comments")]
    public Task<List<CommentDto>> GetAssignmentComments([FromRoute] int assignmentId) =>
        commentService.GetSubmissionComments(assignmentId);

    /// <summary>
    /// Adds a Comment to the current user's submission for the specified Assignment.
    /// </summary>
    [HttpPost("assignments/{assignmentId:int}/comments")]
    public Task<CommentDto> AddCommentToAssignment(
        [FromRoute] int assignmentId,
        [FromBody] CreateCommentDto createCommentDto
    ) => commentService.AddSubmissionComment(assignmentId, createCommentDto);

    /// <summary>
    /// Retrieves all Comments of the specified Publication.
    /// </summary>
    [HttpGet("publication/{publicationId:int}/comments")]
    public Task<List<CommentDto>> GetPublicationComments([FromRoute] int publicationId) =>
        commentService.GetPublicationComments(publicationId);

    /// <summary>
    /// Adds a Comment to the specified Publication.
    /// </summary>
    [HttpPost("publication/{publicationId:int}/comments")]
    public Task<CommentDto> AddCommentToPublication(
        [FromRoute] int publicationId,
        [FromBody] CreateCommentDto createCommentDto
    ) => commentService.AddPublicationComment(publicationId, createCommentDto);

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
