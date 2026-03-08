using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Team13.HitsClass.App.Features.Publications.Dto;
using Team13.WebApi.Pagination;

namespace Team13.HitsClass.App.Features.Publications;

[Authorize]
[Route("api/publications")]
public class PublicationsController(PublicationService publicationService)
{
    [HttpGet("/api/courses/{courseId:int}/publications")]
    public async Task<PagedResult<PublicationDto>> GetPublications(
        [FromRoute] int courseId,
        [FromQuery] SearchPublicationsDto searchPublicationsDto
    ) => await publicationService.GetPublications(courseId, searchPublicationsDto);

    [HttpGet("{publicationId:int}")]
    public async Task<PublicationDto> GetPublicationById([FromRoute] int publicationId) =>
        await publicationService.GetPublicationById(publicationId);
}
