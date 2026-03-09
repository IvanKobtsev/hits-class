using System;

namespace Team13.HitsClass.Domain.PublicationPayloadTypes;

public class AssignmentPayload : PublicationPayload
{
    public string Title { get; set; }
    public DateTime? DeadlineUtc { get; set; }
}
