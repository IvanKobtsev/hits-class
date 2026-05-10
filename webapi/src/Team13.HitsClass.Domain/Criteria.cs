using Team13.DomainHelpers;

namespace Team13.HitsClass.Domain
{
    public class Criteria
    {
        public int Id { get; set; }
        public string Description { get; set; }
        public CriteriaType Type { get; set; }
        public decimal? MinValue { get; set; }
        public decimal? MaxValue { get; set; }
        public int PublicationId { get; set; }
        public Publication Publication { get; set; }

        #region Specifications

        public static Specification<Criteria> HasId(int id)
        {
            return new Specification<Criteria>(nameof(HasId), s => s.Id == id, id);
        }

        #endregion
    }
}
