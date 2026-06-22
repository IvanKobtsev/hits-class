using System.ComponentModel.DataAnnotations;

namespace Team13.HitsClass.App.Features.PeerReview.Dto;

public class UpdatePeerReviewMappingsDto
{
    [Required]
    public List<UpdatePeerReviewMappingItem> Mappings { get; set; }
}

public class UpdatePeerReviewMappingItem
{
    [Required]
    public string DefendantUserId { get; set; }

    [Required]
    public List<string> JuryUserIds { get; set; }
}
