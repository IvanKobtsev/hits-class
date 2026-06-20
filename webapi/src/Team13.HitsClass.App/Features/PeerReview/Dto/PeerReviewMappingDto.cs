namespace Team13.HitsClass.App.Features.PeerReview.Dto;

public class PeerReviewMappingDto
{
    public string DefendantUserId { get; set; }
    public string DefendantName { get; set; }
    public List<JuryDto> Juries { get; set; }
}

public class JuryDto
{
    public string UserId { get; set; }
    public string Name { get; set; }
}
