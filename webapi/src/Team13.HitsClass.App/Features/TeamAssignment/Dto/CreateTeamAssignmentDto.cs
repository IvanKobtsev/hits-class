using System.ComponentModel.DataAnnotations;
using Team13.HitsClass.App.Features.Publications.Dto;
using Team13.HitsClass.Domain.PublicationPayloadTypes;

namespace Team13.HitsClass.App.Features.TeamAssignment.Dto
{
    public class CreateTeamAssignmentDto : CreatePublicationDto
    {
        [Required]
        public TeamAssignmentPayload Payload { get; set; }
    }
}
