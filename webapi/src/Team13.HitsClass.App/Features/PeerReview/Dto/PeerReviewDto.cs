using Team13.HitsClass.Common;
using Team13.HitsClass.Domain;

namespace Team13.HitsClass.App.Features.PeerReview.Dto
{
    public class PeerReviewDto
    {
        public int Id { get; set; }
        public string Mark { get; set; }
        public DateTime SubmittedAtUTC { get; set; }
        public List<CriteriaEvaluationDto> Evaluations { get; set; }
        public JuryDto Jury { get; set; }
    }

    public class CriteriaEvaluationDto
    {
        public int Id { get; set; }
        public string Value { get; set; }
        public string? Note { get; set; }
        public string CriteriaDescription { get; set; }
    }
}
