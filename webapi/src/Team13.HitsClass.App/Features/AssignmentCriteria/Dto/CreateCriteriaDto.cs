using Team13.HitsClass.Domain;

namespace Team13.HitsClass.App.Features.AssignmentCriteria.Dto
{
    public class CreateCriteriaDto
    {
        public string Description { get; set; }
        public CriteriaType Type { get; set; }
        public decimal? MinValue { get; set; }
        public decimal? MaxValue { get; set; }
    }
}
