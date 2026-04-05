using Team13.HitsClass.App.Features.Publications.Dto;
using Team13.WebApi.Domain.Helpers;

namespace Team13.HitsClass.App.Features.TeamAssignment.Dto
{
    public class PatchTeamAssignmentDto : PatchPublicationDto
    {
        [RequiredOrMissing]
        public PatchTeamAssignmentPayloadDto? Payload { get; set; }
    }
}
