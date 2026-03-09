using Microsoft.AspNetCore.Identity;
using Team13.HitsClass.App.Features.Submission.Dto;
using Team13.HitsClass.Domain;
using Team13.HitsClass.Persistence;
using Team13.LowLevelPrimitives;
using Team13.WebApi.Pagination;

namespace Team13.HitsClass.App.Features.Submission;

public class SubmissionService(
    HitsClassDbContext dbContext,
    IUserAccessor userAccessor,
    UserManager<User> userManager
)
{
    public async Task<SubmissionDto> CreateSubmission(int assignmentId, CreateSubmissionDto dto)
    {
        throw new NotImplementedException();
    }

    public async Task<PagedResult<SubmissionListItem>> GetSubmissions(int assignmentId, PagedRequestDto dto)
    {
        throw new NotImplementedException();
    }

    public async Task<SubmissionDto?> GetMySubmission(int assignmentId)
    {
        throw new NotImplementedException();
    }

    public async Task<SubmissionDto> GetSubmission(int submissionId)
    {
        throw new NotImplementedException();
    }

    public async Task<SubmissionDto> MarkSubmission(int submissionId, MarkDto dto)
    {
        throw new NotImplementedException();
    }
}
