using System;
using System.ComponentModel.DataAnnotations;

namespace Team13.HitsClass.Domain.PublicationPayloadTypes;

public class AssignmentPayload : PublicationPayload
{
    [Required(AllowEmptyStrings = false)]
    public string Title { get; set; }
    public DateTime? DeadlineUtc { get; set; }
}
