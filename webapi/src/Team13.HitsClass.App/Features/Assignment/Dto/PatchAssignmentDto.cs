using Team13.HitsClass.App.Features.Publications.Dto;
using Team13.WebApi.Domain.Helpers;

namespace Team13.HitsClass.App.Features.Assignment.Dto;

public class PatchAssignmentDto : PatchPublicationDto
{
    [RequiredOrMissing]
    public PatchAssignmentPayloadDto? Payload { get; set; }
}
