using System;
using System.ComponentModel.DataAnnotations;

namespace Team13.HitsClass.Domain.PublicationPayloadTypes;

public class AssignmentPayload : PublicationPayload
{
    [Required(AllowEmptyStrings = false)]
    public string Title { get; set; }

    [Required]
    public MarkType MarkType { get; set; }
    public DateTime? DeadlineUtc { get; set; }
    public int? MaxMark { get; set; }
    public int? MinMark { get; set; }
}
