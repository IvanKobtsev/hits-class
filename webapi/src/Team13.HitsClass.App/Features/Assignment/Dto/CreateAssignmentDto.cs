using System.ComponentModel.DataAnnotations;
using Team13.HitsClass.App.Features.Publications.Dto;
using Team13.HitsClass.Domain.PublicationPayloadTypes;

namespace Team13.HitsClass.App.Features.Assignment.Dto
{
    public class CreateAssignmentDto : CreatePublicationDto
    {
        [Required]
        public AssignmentPayload Payload { get; set; }
    }
}
