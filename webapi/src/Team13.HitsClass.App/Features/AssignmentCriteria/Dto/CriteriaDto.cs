using Team13.HitsClass.Domain;

namespace Team13.HitsClass.App.Features.AssignmentCriteria.Dto
{
    public class CriteriaDto
    {
        public int Id { get; set; }
        public string Description { get; set; }
        public CriteriaType Type { get; set; }
        public decimal? MinValue { get; set; }
        public decimal? MaxValue { get; set; }
    }
}
