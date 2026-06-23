using System;
using System.Collections.Generic;
using System.Text;
using Team13.DomainHelpers;

namespace Team13.HitsClass.Domain
{
    public class CriteriaEvaluation
    {
        public int Id { get; set; }
        public string Value { get; set; }
        public string? Note { get; set; }
        public int CriteriaId { get; set; }
        public Criteria Criteria { get; set; }
        public int PeerReviewId { get; set; }
        public PeerReview PeerReview { get; set; }

        #region Specifications

        public static Specification<CriteriaEvaluation> HasId(int id)
        {
            return new Specification<CriteriaEvaluation>(nameof(HasId), s => s.Id == id, id);
        }

        #endregion
    }
}
