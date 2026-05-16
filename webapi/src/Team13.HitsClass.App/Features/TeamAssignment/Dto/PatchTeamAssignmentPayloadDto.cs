using Team13.HitsClass.Domain;
using Team13.WebApi.Domain.Helpers;
using Team13.WebApi.Patching.Models;

namespace Team13.HitsClass.App.Features.TeamAssignment.Dto
{
    public class PatchTeamAssignmentPayloadDto : PatchRequest<PublicationPayload>
    {
        [RequiredOrMissing]
        public string Title { get; set; }
        public DateTime? DeadlineUtc { get; set; }
        public int? MaxMark { get; set; }
        public int? MinMark { get; set; }
        public int? MinTeamSize { get; set; }
        public int? MaxTeamSize { get; set; }
        public TeamDistributionType DistributionType { get; set; }
        public SubmissionType SubmissionType { get; set; }
        public bool AreTeamsFrozen { get; set; }
        public DeadlineCriteria? DeadlineCriteria { get; set; }
    }
}
