using System.ComponentModel.DataAnnotations.Schema;
using Team13.HitsClass.Common;
using Team13.HitsClass.Domain;

namespace Team13.HitsClass.App.Features.PeerReview.Dto
{
    public class PeerReviewAssignmentDto
    {
        public int Id { get; set; }
        public PeerReviewState State { get; set; }
        public string? Mark { get; set; }
        public JuryDto DefendantUser { get; set; }
        public int? SubmissionId { get; set; }
    }
}
