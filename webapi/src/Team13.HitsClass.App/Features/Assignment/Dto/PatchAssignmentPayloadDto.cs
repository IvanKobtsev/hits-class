using Team13.HitsClass.Domain;
using Team13.WebApi.Domain.Helpers;
using Team13.WebApi.Patching.Models;

namespace Team13.HitsClass.App.Features.Assignment.Dto;

public class PatchAssignmentPayloadDto : PatchRequest<PublicationPayload>
{
    [RequiredOrMissing]
    public string Title { get; set; }

    public DateTime? DeadlineUtc { get; set; }
    public int? MaxMark { get; set; }
    public int? MinMark { get; set; }
    public DeadlineCriteria? DeadlineCriteria { get; set; }
    public bool? IsPeerReviewEnabled { get; set; }
    public int? JuryCountPerDefendant { get; set; }
}
