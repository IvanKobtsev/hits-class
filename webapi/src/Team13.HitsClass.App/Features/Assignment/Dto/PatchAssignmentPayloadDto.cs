using Team13.HitsClass.Domain;
using Team13.WebApi.Domain.Helpers;
using Team13.WebApi.Patching.Models;

namespace Team13.HitsClass.App.Features.Assignment.Dto;

public class PatchAssignmentPayloadDto : PatchRequest<PublicationPayload>
{
    [RequiredOrMissing]
    public string Title { get; set; }

    public DateTime? DeadlineUtc { get; set; }
}
