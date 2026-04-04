using Team13.HitsClass.App.Features.Assignment.Dto;
using Team13.HitsClass.Domain;

namespace Team13.HitsClass.App.Features.TeamAssignment.Dto
{
    public class PatchTeamAssignmentPayloadDto : PatchAssignmentPayloadDto
    {
        public int? MinTeamSize { get; set; }
        public int? MaxTeamSize { get; set; }
        public TeamDistributionType DistributionType { get; set; }
        public SubmissionType SubmissionType { get; set; }
    }
}
