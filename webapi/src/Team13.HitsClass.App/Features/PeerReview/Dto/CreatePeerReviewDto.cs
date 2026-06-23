using Team13.HitsClass.Domain;

namespace Team13.HitsClass.App.Features.PeerReview.Dto
{
    public class CreatePeerReviewDto
    {
        public string? Mark { get; set; }
        public string? Comment { get; set; }
        public List<CreateCriteriaEvaluationDto> Evaluations { get; set; }
    }

    public class CreateCriteriaEvaluationDto
    {
        public string Value { get; set; }
        public string? Note { get; set; }
        public int CriteriaId { get; set; }
    }
}
