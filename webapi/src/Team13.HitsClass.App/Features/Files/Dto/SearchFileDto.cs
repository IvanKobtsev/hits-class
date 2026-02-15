using Team13.WebApi.Pagination;

namespace Team13.HitsClass.App.Features.Files.Dto;

public class SearchFileDto : PagedRequestDto
{
    public string? Id { get; set; }
    public string? FileName { get; set; }
    public FileMetadataDto? Metadata { get; set; }
}
